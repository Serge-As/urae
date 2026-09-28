export type VoiceFinancialDirection='IN'|'OUT';
export interface VoiceFinancialEntryDraft{label:string;amount:number;direction:VoiceFinancialDirection;raw:string;}
export interface VoiceFinancialCommandDraft{
  raw:string;wakeWordDetected:boolean;memberQuery?:string;meetingQuery?:string;entries:VoiceFinancialEntryDraft[];
  localeGuess:'fr'|'en'|'unknown';warnings:string[];
}
export interface VoiceMatchCandidate{id:string;label:string;aliases?:string[];}
export interface VoiceMatchResult{status:'EXACT'|'FUZZY'|'AMBIGUOUS'|'NONE';candidate?:VoiceMatchCandidate;score:number;alternatives:VoiceMatchCandidate[];}
export interface VoiceContextualEntryMatch{candidate:VoiceMatchCandidate;amount:number;direction:VoiceFinancialDirection;raw:string;}

export const normalizeVoiceText=(value:string):string=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();

export function sanitizeVoiceFinancialTranscript(raw:string):string{
  const compact=String(raw??'').replace(/\s+/g,' ').trim();if(!compact)return '';
  const wakeToken=/\b(?:eco|éco|echo)(?:\s*[- ]?\s*(?:system|système|systeme))?\b/gi;
  const matches=[...compact.matchAll(wakeToken)];if(matches.length<2)return compact;
  let firstKept=false;
  return compact.replace(wakeToken,(token,offset)=>{if(!firstKept&&Number(offset)<=24){firstKept=true;return /^echo$/i.test(token)?'Eco':token;}return ' ';})
    .replace(/\s+([,;:.!?])/g,'$1').replace(/\s{2,}/g,' ').trim();
}

const FR_UNITS:Record<string,number>={zero:0,un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,treize:13,quatorze:14,quinze:15,seize:16,dixsept:17,dixhuit:18,dixneuf:19,vingt:20,trente:30,quarante:40,cinquante:50,soixante:60};
const EN_UNITS:Record<string,number>={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};

const compactToken=(value:string)=>normalizeVoiceText(value).replace(/[-\s]/g,'');

function parseFrenchWords(value:string):number|undefined{
  const raw=normalizeVoiceText(value).replace(/\bfrancs?\b|\bcfa\b|\bxaf\b|\bfcfa\b/g,' ').replace(/-/g,' ');
  const tokens=raw.split(/\s+/).filter(Boolean);if(!tokens.length)return undefined;
  let total=0,current=0,consumed=0;
  for(let i=0;i<tokens.length;i++){
    const t=tokens[i]!,next=tokens[i+1];
    if(t==='et'){consumed++;continue;}
    if(t==='quatre'&&next==='vingt'){current+=80;i++;consumed+=2;continue;}
    if(t==='soixante'&&next==='dix'){current+=70;i++;consumed+=2;continue;}
    if(t==='soixante'&&next&&FR_UNITS[next]!==undefined&&FR_UNITS[next]!<20){current+=60+FR_UNITS[next]!;i++;consumed+=2;continue;}
    if(t==='cent'||t==='cents'){current=(current||1)*100;consumed++;continue;}
    if(t==='mille'||t==='milles'){total+=(current||1)*1000;current=0;consumed++;continue;}
    if(t==='million'||t==='millions'){total+=(current||1)*1_000_000;current=0;consumed++;continue;}
    const compact=compactToken(t),n=FR_UNITS[t]??FR_UNITS[compact];if(n===undefined)return undefined;current+=n;consumed++;
  }
  return consumed?total+current:undefined;
}

function parseEnglishWords(value:string):number|undefined{
  const raw=normalizeVoiceText(value).replace(/\bfrancs?\b|\bcfa\b|\bxaf\b|\bfcfa\b/g,' ').replace(/-/g,' ');
  const tokens=raw.split(/\s+/).filter(Boolean);if(!tokens.length)return undefined;
  let total=0,current=0,consumed=0;
  for(const t of tokens){
    if(t==='and'){consumed++;continue;}
    if(t==='hundred'){current=(current||1)*100;consumed++;continue;}
    if(t==='thousand'){total+=(current||1)*1000;current=0;consumed++;continue;}
    if(t==='million'||t==='millions'){total+=(current||1)*1_000_000;current=0;consumed++;continue;}
    const n=EN_UNITS[t];if(n===undefined)return undefined;current+=n;consumed++;
  }
  return consumed?total+current:undefined;
}

export function parseVoiceAmount(value:string):number|undefined{
  const cleaned=normalizeVoiceText(value).replace(/\bfrancs?\b|\bcfa\b|\bxaf\b|\bfcfa\b/g,' ').trim();
  const numeric=cleaned.replace(/(?<=\d)[\s.](?=\d{3}(?:\D|$))/g,'').replace(/,/g,'.');
  if(/^\d+(?:\.0+)?$/.test(numeric)){const n=Number(numeric);return Number.isSafeInteger(n)&&n>=0?n:undefined;}
  return parseFrenchWords(cleaned)??parseEnglishWords(cleaned);
}

const ACTION_WORDS=/(?:remplis|remplir|mets|mettre|enregistre|enregistrer|saisis|saisir|ajoute|ajouter|fill|enter|record|add)\b/i;
const OUT_WORDS=/^(?:depense|dépense|sortie|decaissement|décaissement|decaisse|décaisse|paye|paiement|expense|outflow|payout)\b[\s:,-]*/i;
const IN_WORDS=/^(?:entree|entrée|cotisation|versement|verse|encaissement|income|inflow|contribution|payment)\b[\s:,-]*/i;

const stripWake=(text:string):{text:string;wake:boolean}=>{
  const wake=/^\s*(?:hey\s+)?(?:eco(?:[-\s]?system)?|éco(?:[-\s]?systeme)?)\b[\s!,:-]*/i;
  return wake.test(text)?{text:text.replace(wake,''),wake:true}:{text,wake:false};
};

const detectLocale=(text:string):'fr'|'en'|'unknown'=>{
  const n=normalizeVoiceText(text);const fr=(n.match(/\b(?:chez|membre|remplis|epargne|secours|remboursement|depense|seance|reunion|cotisation)\b/g)??[]).length;
  const en=(n.match(/\b(?:member|fill|savings|support|repayment|expense|meeting|contribution)\b/g)??[]).length;
  return fr>en?'fr':en>fr?'en':'unknown';
};

const splitEntrySegments=(text:string):string[]=>{
  let v=text.trim();
  const action=v.match(ACTION_WORDS);if(action?.index!==undefined)v=v.slice(action.index+action[0].length).replace(/^\s*[:,-]?\s*/,'');
  v=v.replace(/\s+(?:et|and)\s+(?=(?:depense|dépense|sortie|expense|outflow\s+)?[^,;]{1,50}(?::|=))/gi,';');
  return v.split(/[;\n]|,(?=\s*(?:depense|dépense|sortie|expense|outflow\s+)?[^,]{1,50}(?::|=))/i).map(x=>x.trim()).filter(Boolean);
};

const parseSegment=(raw:string):VoiceFinancialEntryDraft|undefined=>{
  let text=raw.trim(),direction:VoiceFinancialDirection='IN';
  if(OUT_WORDS.test(text)){direction='OUT';text=text.replace(OUT_WORDS,'').trim();}
  else text=text.replace(IN_WORDS,'').trim();
  text=text.replace(/^(?:la\s+rubrique|rubrique|the\s+category|category)\s+/i,'').trim();
  const colon=text.match(/^(.{1,90}?)[=:]\s*(.+)$/);
  if(colon){const amount=parseVoiceAmount(colon[2]!);if(amount===undefined)return undefined;return{label:colon[1]!.trim(),amount,direction,raw};}
  const tokens=text.split(/\s+/).filter(Boolean);
  for(let take=Math.min(8,tokens.length-1);take>=1;take--){
    const amount=parseVoiceAmount(tokens.slice(-take).join(' '));if(amount===undefined)continue;
    const label=tokens.slice(0,-take).join(' ').replace(/[,:=-]+$/,'').trim();if(label)return{label,amount,direction,raw};
  }
  return undefined;
};

export function parseVoiceFinancialCommand(raw:string):VoiceFinancialCommandDraft{
  const cleaned=sanitizeVoiceFinancialTranscript(raw);const warnings:string[]=[];const wake=stripWake(cleaned);const localeGuess=detectLocale(cleaned);let body=wake.text.trim();
  const action=body.match(ACTION_WORDS);const actionIndex=action?.index??-1;const header=actionIndex>=0?body.slice(0,actionIndex):body;
  let memberQuery:string|undefined,meetingQuery:string|undefined;
  const member=header.match(/(?:chez|pour|for)\s+(?:le\s+|the\s+)?(?:membre|member)?\s*([^,;]+?)(?=\s+(?:a\s+la\s+seance|à\s+la\s+séance|seance|séance|meeting)\b|\s*[,;]|$)/i)
    ??header.match(/(?:membre|member)\s+([^,;]+?)(?=\s+(?:seance|séance|meeting)\b|\s*[,;]|$)/i);
  if(member?.[1])memberQuery=member[1].trim().replace(/[,:-]+$/,'').trim();
  const meeting=header.match(/(?:a\s+la\s+seance|à\s+la\s+séance|seance|séance|reunion|réunion|meeting)\s+([^,;]+)/i);if(meeting?.[1])meetingQuery=meeting[1].trim();
  let entriesText=actionIndex>=0?body.slice(actionIndex):body;
  if(memberQuery&&actionIndex<0){const marker=body.toLowerCase().indexOf(memberQuery.toLowerCase());if(marker>=0)entriesText=body.slice(marker+memberQuery.length).replace(/^\s*[,;:-]?\s*/,'');}
  const segments=splitEntrySegments(entriesText),entries:VoiceFinancialEntryDraft[]=[];
  for(const segment of segments){const parsed=parseSegment(segment);if(parsed&&parsed.label&&parsed.amount>0)entries.push(parsed);else if(segment)warnings.push('UNPARSED:'+segment);}
  if(!memberQuery)warnings.push('MEMBER_NOT_DETECTED');if(!entries.length)warnings.push('NO_FINANCIAL_ENTRY_DETECTED');if(!wake.wake)warnings.push('WAKE_WORD_NOT_DETECTED');
  return{raw,wakeWordDetected:wake.wake,memberQuery,meetingQuery,entries,localeGuess,warnings};
}

const levenshtein=(a:string,b:string):number=>{const m=a.length,n=b.length;const prev=Array.from({length:n+1},(_,i)=>i),cur=new Array<number>(n+1);for(let i=1;i<=m;i++){cur[0]=i;for(let j=1;j<=n;j++)cur[j]=Math.min(cur[j-1]!+1,prev[j]!+1,prev[j-1]!+(a[i-1]===b[j-1]?0:1));for(let j=0;j<=n;j++)prev[j]=cur[j]!;}return prev[n]!;};
const labelScore=(query:string,label:string):number=>{
  const q=normalizeVoiceText(query),l=normalizeVoiceText(label);if(!q||!l)return 0;if(q===l)return 1;if(l.includes(q)||q.includes(l))return .93;
  const qt=new Set(q.split(/\s+/)),lt=new Set(l.split(/\s+/)),intersection=[...qt].filter(x=>lt.has(x)).length,union=new Set([...qt,...lt]).size,jaccard=union?intersection/union:0;
  const edit=1-levenshtein(q,l)/Math.max(q.length,l.length,1);return Math.max(jaccard*.9,edit*.88);
};

export function matchVoiceCandidate(query:string,candidates:VoiceMatchCandidate[]):VoiceMatchResult{
  const scored=candidates.map(candidate=>({candidate,score:Math.max(labelScore(query,candidate.label),...(candidate.aliases??[]).map(a=>labelScore(query,a)))})).sort((a,b)=>b.score-a.score);
  const best=scored[0];if(!best||best.score<.58)return{status:'NONE',score:best?.score??0,alternatives:scored.slice(0,3).map(x=>x.candidate)};
  const close=scored.filter(x=>best.score-x.score<.06&&x.score>=.58);if(close.length>1&&best.score<.98)return{status:'AMBIGUOUS',score:best.score,alternatives:close.slice(0,5).map(x=>x.candidate)};
  return{status:best.score>=.98?'EXACT':'FUZZY',candidate:best.candidate,score:best.score,alternatives:scored.slice(1,4).map(x=>x.candidate)};
}

const escapeRegExp=(value:string)=>value.replace(/[|\\{}()[\]^$+*?.-]/g,'\\$&');

export function matchVoiceMention(text:string,candidates:VoiceMatchCandidate[]):VoiceMatchResult{
  const hay=' '+normalizeVoiceText(sanitizeVoiceFinancialTranscript(text))+' ',hits=new Map<string,{candidate:VoiceMatchCandidate;length:number}>();
  for(const candidate of candidates){
    for(const value of [candidate.label,...(candidate.aliases??[])]){
      const needle=normalizeVoiceText(value);if(!needle)continue;
      const re=new RegExp('(?:^|[^\\p{L}\\p{N}])'+escapeRegExp(needle).replace(/\\ /g,'\\s+')+'(?=$|[^\\p{L}\\p{N}])','u');
      if(re.test(hay)){const prior=hits.get(candidate.id);if(!prior||needle.length>prior.length)hits.set(candidate.id,{candidate,length:needle.length});}
    }
  }
  const ranked=[...hits.values()].sort((a,b)=>b.length-a.length);
  if(!ranked.length)return{status:'NONE',score:0,alternatives:[]};
  if(ranked.length>1)return{status:'AMBIGUOUS',score:1,alternatives:ranked.slice(0,5).map(x=>x.candidate)};
  return{status:'EXACT',candidate:ranked[0]!.candidate,score:1,alternatives:[]};
}

export function extractVoiceFinancialEntriesByCandidates(raw:string,candidates:VoiceMatchCandidate[]):VoiceContextualEntryMatch[]{
  const text=normalizeVoiceText(sanitizeVoiceFinancialTranscript(raw));
  const mentions:Array<{start:number;end:number;candidate:VoiceMatchCandidate;alias:string}>=[];
  for(const candidate of candidates){
    const aliases=[candidate.label,...(candidate.aliases??[])].map(normalizeVoiceText).filter(Boolean).sort((a,b)=>b.length-a.length);
    for(const alias of aliases){
      const re=new RegExp('(?:^|[^\\p{L}\\p{N}])('+escapeRegExp(alias).replace(/\\ /g,'\\s+')+')(?=$|[^\\p{L}\\p{N}])','gu');
      for(const match of text.matchAll(re)){
        const whole=match[0]??'',captured=match[1]??'',prefix=whole.slice(0,whole.length-captured.length),start=(match.index??0)+prefix.length;
        mentions.push({start,end:start+captured.length,candidate,alias});
      }
    }
  }
  mentions.sort((a,b)=>a.start-b.start||b.alias.length-a.alias.length);
  const selected:Array<(typeof mentions)[number]>=[];const occupied=new Set<string>();
  for(const mention of mentions){
    if(selected.some(x=>mention.start<x.end&&mention.end>x.start))continue;
    const key=mention.candidate.id+':'+mention.start;if(occupied.has(key))continue;occupied.add(key);selected.push(mention);
  }
  selected.sort((a,b)=>a.start-b.start);
  const results:VoiceContextualEntryMatch[]=[];
  for(let i=0;i<selected.length;i++){
    const mention=selected[i]!,next=selected[i+1],segment=text.slice(mention.end,next?.start??text.length)
      .replace(/^[\s:;,=.-]+/,'').replace(/^(?:montant|amount|est|de|du|des|a|à)\s+/,'').trim();
    const tokens=segment.split(/\s+/).filter(Boolean);let amount:number|undefined,used='';
    for(let take=Math.min(8,tokens.length);take>=1;take--){const part=tokens.slice(0,take).join(' '),parsed=parseVoiceAmount(part);if(parsed!==undefined&&parsed>0){amount=parsed;used=part;break;}}
    if(amount===undefined)continue;
    const before=text.slice(Math.max(0,mention.start-28),mention.start);
    const direction:VoiceFinancialDirection=/(?:depense|sortie|decaissement|paye|expense|outflow|payout)\s*$/.test(before)?'OUT':'IN';
    results.push({candidate:mention.candidate,amount,direction,raw:(mention.alias+' '+used).trim()});
  }
  return results;
}
