export interface NumpadRubricCandidate {id:string;name:string;}
export interface NumpadCode {code:string;rubricId:string;name:string;}
export interface NumpadEntry {rubricId:string;rubricName:string;code:string;amount:number;}
export interface NumpadDraft {memberNumber:number;entries:NumpadEntry[];raw:string;}

const norm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const preferred=(name:string)=>{
  const n=norm(name);
  if(/REMBOURSEMENT|REPAYMENT/.test(n))return'R';
  if(/EPARGNE|SAVING/.test(n))return'E';
  if(/SECOURS|SOLIDAR/.test(n))return'S';
  if(/COLLATION/.test(n))return'C';
  if(/AIDE LOCALE/.test(n))return'AL';
  if(/RATION/.test(n))return'RA';
  if(/PRET|LOAN/.test(n))return'P';
  if(/INTERET|INTEREST/.test(n))return'I';
  if(/TONTINE/.test(n))return'T';
  const words=n.split(' ').filter(Boolean),acronym=words.map(x=>x[0]).join('').slice(0,3);
  return acronym||n.slice(0,2)||'X';
};
export function buildNumpadRubricCodes(rubrics:NumpadRubricCandidate[]):NumpadCode[]{
  const used=new Map<string,number>();
  return rubrics.slice().sort((a,b)=>a.name.localeCompare(b.name,'fr',{sensitivity:'base'})||a.id.localeCompare(b.id)).map(r=>{
    const base=preferred(r.name),count=(used.get(base)??0)+1;used.set(base,count);
    return{code:count===1?base:base+count,rubricId:r.id,name:r.name};
  });
}
const amount=(token:string)=>{
  const t=token.replace(/[\s_]/g,'').replace(',','.').toLowerCase(),m=/^(\d+(?:\.\d+)?)([km])?$/.exec(t);if(!m)throw Error('NUMPAD_INVALID_AMOUNT:'+token);
  const mult=m[2]==='k'?1000:m[2]==='m'?1000000:1,n=Math.round(Number(m[1])*mult);if(!Number.isSafeInteger(n)||n<=0)throw Error('NUMPAD_INVALID_AMOUNT:'+token);return n;
};
export function parseEcoNumpad(raw:string,codes:NumpadCode[]):NumpadDraft{
  const clean=String(raw??'').trim();if(!clean)throw Error('NUMPAD_EMPTY');
  const tokens=clean.replace(/[;,:=]+/g,' ').replace(/\s+/g,' ').trim().split(' ');
  const first=String(tokens.shift()??'').toUpperCase(),member=/^(?:M|N|MEMBRE|MEMBER)?#?(\d+)$/.exec(first);if(!member)throw Error('NUMPAD_MEMBER_NUMBER_REQUIRED');
  const memberNumber=Number(member[1]);if(!Number.isSafeInteger(memberNumber)||memberNumber<1)throw Error('NUMPAD_MEMBER_NUMBER_REQUIRED');
  if(tokens.length<2||tokens.length%2!==0)throw Error('NUMPAD_CODE_AMOUNT_PAIRS_REQUIRED');
  const byCode=new Map(codes.map(x=>[x.code.toUpperCase(),x])),entries:NumpadEntry[]=[];
  for(let i=0;i<tokens.length;i+=2){
    const code=tokens[i]!.toUpperCase(),candidate=byCode.get(code);if(!candidate)throw Error('NUMPAD_UNKNOWN_CODE:'+code);
    entries.push({rubricId:candidate.rubricId,rubricName:candidate.name,code:candidate.code,amount:amount(tokens[i+1]!)});
  }
  return{memberNumber,entries,raw:clean};
}
