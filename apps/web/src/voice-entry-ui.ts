import {matchVoiceCandidate,parseVoiceAmount,parseVoiceFinancialCommand,type VoiceFinancialEntryDraft} from '../../../packages/voice-commands/src/index.js';

type AnyRecord=Record<string,any>;
const byId=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T|null;
const uiEn=()=>byId<HTMLSelectElement>('languageSelect')?.value==='en';
const t=(fr:string,en:string)=>uiEn()?en:fr;
const activeGroup=()=>byId<HTMLSelectElement>('activeGroupSelect')?.value||(()=>{try{return localStorage.getItem('tontine.activeGroupId')??'';}catch{return '';}})();
const idem=(prefix:string)=>prefix+':'+(crypto.randomUUID?.()??String(Date.now())+Math.random().toString(36).slice(2));
const fmt=(n:number)=>new Intl.NumberFormat(uiEn()?'en-CM':'fr-CM',{maximumFractionDigits:0}).format(n)+' F CFA';

async function api<T=any>(path:string,init:RequestInit={}):Promise<T>{
  const headers=new Headers(init.headers??{});if(init.body&&!headers.has('content-type'))headers.set('content-type','application/json');
  headers.set('accept-language',uiEn()?'en':'fr');const group=activeGroup();if(group)headers.set('x-active-group-id',group);
  const response=await fetch(path,{...init,headers});const body=await response.json().catch(()=>({error:'HTTP_'+response.status}));
  if(!response.ok)throw Error(String(body.error??'HTTP_'+response.status));return body as T;
}

const friendly=(code:string)=>({
  ACTIVE_GROUP_REQUIRED:t('Choisissez un groupe.','Choose a group.'),FORBIDDEN_SCOPE:t('Cette saisie est réservée à un responsable habilité.','This entry is restricted to an authorized manager.'),
  MEMBER_NOT_DETECTED:t('Je n’ai pas identifié le membre. Choisissez-le dans la prévisualisation.','I could not identify the member. Select them in the preview.'),
  NO_FINANCIAL_ENTRY_DETECTED:t('Je n’ai identifié aucun montant. Exemple : « Eco, chez Serge, Secours 500 ; Épargne 1000 ».','I found no amount. Example: “Eco, for Serge, Support 500; Savings 1000”.'),
  MEETING_NOT_OPEN:t('Cette séance est clôturée. Choisissez une séance ouverte pour une saisie immédiate.','This meeting is closed. Choose an open meeting for immediate entry.'),
  INSUFFICIENT_CASH:t('La caisse disponible ne permet pas cette dépense.','Available cash is insufficient for this expense.'),
  SHEET_EXPENSE_CONTEXT_REQUIRED:t('Une dépense de feuille exige un membre, une séance et une rubrique.','A sheet expense requires a member, meeting and rubric.'),
  INVALID_EXPENSE_AMOUNT:t('Le montant de la dépense doit être un entier positif.','Expense amount must be a positive integer.'),
  TONTINE_SHARE_NOT_FOUND:t('La part Tontine concernée doit être choisie dans Tontines.','The relevant Tontine share must be chosen in Tontines.'),
  LOAN_REQUIRED:t('Choisissez le prêt concerné par ce remboursement.','Choose the loan concerned by this repayment.'),
  MULTIPLE_LOANS:t('Plusieurs prêts actifs existent pour ce membre : choisissez le prêt directement dans la cellule de remboursement.','This member has several active loans: choose the loan directly in the repayment cell.'),
  LOAN_POLICY_REQUIRED:t('Cette rubrique Prêt doit d’abord avoir ses règles de prêt configurées.','This Loan rubric must have its loan rules configured first.'),
  LOAN_RATE_REQUIRED:t('Définissez explicitement le taux par période de cette rubrique Prêt, même s’il est de 0 %.','Explicitly define the per-period rate for this Loan rubric, even if it is 0%.'),
  LOAN_INTEREST_PAYMENT_EXCEEDS_DUE:t('Le montant saisi dépasse les intérêts réellement dus à cette période.','The entered amount exceeds interest actually due for this period.')
} as Record<string,string>)[code]??code.replaceAll('_',' ');

let members:AnyRecord[]=[],rubrics:AnyRecord[]=[],meetings:AnyRecord[]=[],misc:AnyRecord[]=[],loans:AnyRecord[]=[],loadedGroup='';
const kindAliases:Record<string,string[]>={
  SAVINGS:['épargne','epargne','savings','saving'],SOLIDARITY:['secours','solidarité','solidarite','aide','support'],REPAYMENT:['remboursement','repayment','rembourser'],
  CONTRIBUTION:['cotisation','contribution'],TRANSPORT:['transport'],LOAN:['prêt','pret','loan'],ASSISTANCE:['assistance','aide spéciale','special assistance'],OFFICE:['bureau','office'],LEVY:['prélèvement','prelevement','levy']
};

async function loadContext(force=false){
  const group=activeGroup();if(!group){members=[];rubrics=[];meetings=[];misc=[];loans=[];loadedGroup='';return;}
  if(!force&&loadedGroup===group&&members.length)return;
  [members,rubrics,meetings,misc,loans]=await Promise.all([
    api(`/api/v1/groups/${encodeURIComponent(group)}/members`),api(`/api/v1/groups/${encodeURIComponent(group)}/rubrics`),api(`/api/v1/groups/${encodeURIComponent(group)}/meetings`),
    api(`/api/v1/groups/${encodeURIComponent(group)}/misc-rubrics`).catch(()=>[]),api(`/api/v1/groups/${encodeURIComponent(group)}/completion?kind=LOAN`).catch(()=>[])
  ]);loadedGroup=group;
}

const rubricCandidates=()=>rubrics.filter(r=>r.status!=='ARCHIVED').map(r=>({id:r.id,label:r.name,aliases:[...(r.aliases??[]),...(kindAliases[String(r.activityPlan?.kind??'')]??[])]}));
const memberCandidates=()=>members.map(m=>({id:m.id,label:m.displayName,aliases:[m.displayName]}));
const openMeetings=()=>meetings.filter(m=>m.status==='open').sort((a,b)=>String(b.scheduledAt??b.openedAt).localeCompare(String(a.scheduledAt??a.openedAt)));
const miscForRubric=(rubricId:string)=>misc.find(x=>String(x.rubricId)===rubricId);
const rubricById=(id:string)=>rubrics.find(r=>r.id===id);
const activeLoansFor=(membershipId:string)=>loans.filter(l=>String(l.data?.borrowerMembershipId??'')===membershipId&&['DISBURSED','REPAYING'].includes(String(l.data?.completionState??''))&&(Number(l.data?.outstandingPrincipal??l.data?.principal??0)>0||Number(l.data?.unpaidInterest??0)>0));
const normalizeLabel=(value:unknown)=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const rubricKind=(rubric:any)=>String(rubric?.activityPlan?.kind??'').toUpperCase();
const repaymentComponent=(rubric:any)=>{
  const explicit=String(rubric?.facets?.custom?.repaymentComponent??'').toUpperCase();if(explicit==='INTEREST'||explicit==='PRINCIPAL')return explicit;
  return /interet|interest/.test(normalizeLabel(rubric?.name))?'INTEREST':'PRINCIPAL';
};

async function postIncome(membershipId:string,rubricId:string,meetingId:string,amount:number,note=''){
  const group=activeGroup();if(!group)throw Error('ACTIVE_GROUP_REQUIRED');const template=miscForRubric(rubricId);
  if(template){return api(`/api/v1/groups/${encodeURIComponent(group)}/misc-rubrics/postings`,{method:'POST',body:JSON.stringify({membershipId,meetingId,items:[{templateId:template.id,amount,note:note||t('Saisie assistée','Assisted entry')}],idempotencyKey:idem('misc_voice')})});}
  return api(`/api/v1/groups/${encodeURIComponent(group)}/contributions/cash`,{method:'POST',body:JSON.stringify({membershipId,rubricId,meetingId,amount,currency:'XAF',idempotencyKey:idem('sheet_in')})});
}
async function postExpense(membershipId:string,rubricId:string,meetingId:string,amount:number,label:string,note=''){
  const group=activeGroup();if(!group)throw Error('ACTIVE_GROUP_REQUIRED');return api(`/api/v1/groups/${encodeURIComponent(group)}/expenses`,{method:'POST',body:JSON.stringify({membershipId,rubricId,meetingId,amount,label,scope:'SHEET',note,idempotencyKey:idem('sheet_out')})});
}
async function postLoanFromSheet(membershipId:string,rubric:any,meetingId:string,amount:number){
  const group=activeGroup();if(!group)throw Error('ACTIVE_GROUP_REQUIRED');const policy=rubric?.policies?.loan;if(!policy?.allowed)throw Error('LOAN_POLICY_REQUIRED');
  const special=/special/.test(normalizeLabel(rubric?.name))?(policy.specialLoans?.[0]??undefined):undefined;
  const rawRate=special?.rateBasisPointsPerPeriod??policy.rateBasisPointsPerPeriod;if(rawRate===undefined||rawRate===null)throw Error('LOAN_RATE_REQUIRED');
  const rateBasisPointsPerPeriod=Number(rawRate),paymentPriority=special?.paymentPriority??policy.paymentPriority??'CAPITAL_FIRST';
  const periods=Number(special?.maxDurationPeriods??policy.overdue?.maxDurationPeriods??6),member=members.find(x=>x.id===membershipId),key=idem('sheet_loan');
  let loan=await api<any>(`/api/v1/groups/${encodeURIComponent(group)}/completion`,{method:'POST',body:JSON.stringify({kind:'LOAN',title:(rubric?.name??t('Prêt','Loan'))+' · '+(member?.displayName??membershipId),data:{principal:amount,currency:'XAF',borrowerMembershipId:membershipId,rubricId:rubric.id,rateBasisPointsPerPeriod,paymentPriority,noInterestOnInterest:true,periods,outstandingPrincipal:0,unpaidInterest:0,loanClass:special?'SPECIAL':'STANDARD',sourceSurface:'TWO_SHEETS',sheetEntryKey:key}})});
  loan=await api<any>(`/api/v1/groups/${encodeURIComponent(group)}/completion/${encodeURIComponent(loan.id)}/transition`,{method:'POST',body:JSON.stringify({to:'SUBMITTED',expectedVersion:Number(loan.data?.completionVersion??1),patch:{submittedFromSheet:true,meetingId}})});
  loan=await api<any>(`/api/v1/groups/${encodeURIComponent(group)}/completion/${encodeURIComponent(loan.id)}/transition`,{method:'POST',body:JSON.stringify({to:'APPROVED',expectedVersion:Number(loan.data?.completionVersion??2),patch:{approvedAt:new Date().toISOString(),approvedFromSheet:true}})});
  const result=await api<any>(`/api/v1/groups/${encodeURIComponent(group)}/loans/${encodeURIComponent(loan.id)}/disburse`,{method:'POST',body:JSON.stringify({amount,expectedVersion:Number(loan.data?.completionVersion??3),meetingId,rubricId:rubric.id,idempotencyKey:key+':disburse'})});
  loans=await api<any[]>(`/api/v1/groups/${encodeURIComponent(group)}/completion?kind=LOAN`).catch(()=>loans);return result;
}
async function postRepayment(membershipId:string,meetingId:string,rubric:any,amount:number,loanId?:string){
  const group=activeGroup();if(!group)throw Error('ACTIVE_GROUP_REQUIRED');const active=activeLoansFor(membershipId);let loan=loanId?active.find(x=>x.id===loanId):undefined;
  if(!loan&&active.length===1)loan=active[0];if(!loan)throw Error(active.length>1?'MULTIPLE_LOANS':'LOAN_REQUIRED');
  const component=repaymentComponent(rubric),body:any={principalAmount:component==='PRINCIPAL'?amount:0,interestAmount:component==='INTEREST'?amount:0,expectedVersion:Number(loan.data?.completionVersion??0),meetingId,rubricId:rubric.id,idempotencyKey:idem('sheet_repayment')};
  const result=await api<any>(`/api/v1/groups/${encodeURIComponent(group)}/loans/${encodeURIComponent(loan.id)}/repay`,{method:'POST',body:JSON.stringify(body)});
  loans=await api<any[]>(`/api/v1/groups/${encodeURIComponent(group)}/completion?kind=LOAN`).catch(()=>loans);return result;
}

interface PreviewRow{draft:VoiceFinancialEntryDraft;rubricId:string;direction:'IN'|'OUT';amount:number;loanId?:string;}
let previewRows:PreviewRow[]=[];

function speech(lang:string,onFinal:(text:string)=>void,onState:(active:boolean,message:string)=>void){
  const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Recognition){onState(false,t('Reconnaissance vocale non disponible sur ce navigateur. Utilisez le texte.','Speech recognition is unavailable in this browser. Use text input.'));return{toggle:()=>{}};}
  let listening=false,recognition:any;
  const start=()=>{recognition=new Recognition();recognition.lang=lang;recognition.continuous=true;recognition.interimResults=true;recognition.onstart=()=>onState(true,t('Je vous écoute…','Listening…'));recognition.onresult=(event:any)=>{let final='';for(let i=event.resultIndex??0;i<event.results.length;i++)if(event.results[i].isFinal)final+=(final?' ':'')+String(event.results[i][0]?.transcript??'').trim();if(final)onFinal(final);};recognition.onerror=(e:any)=>{if(['not-allowed','service-not-allowed','audio-capture'].includes(String(e.error))){listening=false;onState(false,t('Micro indisponible ou permission refusée.','Microphone unavailable or permission denied.'));}};recognition.onend=()=>{if(listening)setTimeout(()=>{try{recognition.start();}catch{}},250);else onState(false,t('Dictée arrêtée.','Dictation stopped.'));};listening=true;try{recognition.start();}catch{listening=false;}};
  const stop=()=>{listening=false;try{recognition?.stop();}catch{};};return{toggle:()=>listening?stop():start(),stop};
}

function speak(text:string){if(!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=uiEn()?'en-US':'fr-FR';window.speechSynthesis.speak(utterance);}

function makeOption(value:string,label:string){const o=document.createElement('option');o.value=value;o.textContent=label;return o;}

function renderPreview(memberId:string,meetingId:string,status:HTMLElement){
  const root=byId('voiceFinancialPreview');if(!root)return;root.replaceChildren();
  const memberSelect=document.createElement('select');memberSelect.id='voiceResolvedMember';memberSelect.append(makeOption('',t('Choisir le membre','Choose member')));for(const m of members)memberSelect.append(makeOption(m.id,m.displayName));memberSelect.value=memberId;
  const meetingSelect=document.createElement('select');meetingSelect.id='voiceResolvedMeeting';meetingSelect.append(makeOption('',t('Choisir la séance ouverte','Choose open meeting')));for(const m of openMeetings())meetingSelect.append(makeOption(m.id,m.title));meetingSelect.value=meetingId;
  const head=document.createElement('div');head.className='voice-preview-head';const ml=document.createElement('label');ml.textContent=t('Membre','Member');ml.append(memberSelect);const sl=document.createElement('label');sl.textContent=t('Séance','Meeting');sl.append(meetingSelect);head.append(ml,sl);root.append(head);
  previewRows.forEach((row,index)=>{
    const article=document.createElement('article');article.className='voice-entry-row';
    const label=document.createElement('strong');label.textContent=row.draft.label;
    const rubric=document.createElement('select');rubric.dataset.role='rubric';rubric.append(makeOption('',t('Choisir rubrique','Choose category')));for(const r of rubrics.filter(x=>x.status!=='ARCHIVED'))rubric.append(makeOption(r.id,r.name));rubric.value=row.rubricId;
    const direction=document.createElement('select');direction.dataset.role='direction';direction.append(makeOption('IN',t('Entrée / cotisation (+)','Income / contribution (+)')),makeOption('OUT',t('Dépense / sortie (−)','Expense / outflow (−)')));direction.value=row.direction;
    const amount=document.createElement('input');amount.type='number';amount.min='1';amount.step='1';amount.inputMode='numeric';amount.value=String(row.amount);amount.dataset.role='amount';
    const loan=document.createElement('select');loan.dataset.role='loan';loan.hidden=true;
    const syncLoan=()=>{const r=rubricById(rubric.value),kind=rubricKind(r),isRepay=kind==='REPAYMENT';if(kind==='LOAN'){direction.value='OUT';direction.disabled=true;}else if(kind==='REPAYMENT'){direction.value='IN';direction.disabled=true;}else direction.disabled=false;loan.hidden=!isRepay;if(isRepay){loan.replaceChildren(makeOption('',t('Choisir le prêt','Choose loan')));for(const x of activeLoansFor(memberSelect.value))loan.append(makeOption(x.id,x.title+' · '+fmt(Number(x.data?.outstandingPrincipal??0))+' · '+t('int. dus ','int. due ')+fmt(Number(x.data?.unpaidInterest??0))));if(activeLoansFor(memberSelect.value).length===1)loan.value=activeLoansFor(memberSelect.value)[0].id;}};
    rubric.onchange=syncLoan;direction.onchange=syncLoan;memberSelect.addEventListener('change',syncLoan);syncLoan();
    const remove=document.createElement('button');remove.type='button';remove.className='link-btn';remove.textContent='×';remove.title=t('Retirer cette ligne','Remove this row');remove.onclick=()=>{previewRows.splice(index,1);renderPreview(memberSelect.value,meetingSelect.value,status);};
    article.append(label,rubric,direction,amount,loan,remove);root.append(article);
  });
  const summary=document.createElement('p');summary.className='truth-notice';summary.textContent=t('Aucune écriture n’est encore faite. Relisez le membre, la séance, chaque rubrique, le sens (+/−) et le montant, puis validez.','Nothing has been posted yet. Review member, meeting, each category, direction (+/−) and amount, then confirm.');root.append(summary);
  const actions=document.createElement('div');actions.className='actions';const read=document.createElement('button');read.type='button';read.textContent=t('🔊 Lire la prévisualisation','🔊 Read preview');read.onclick=()=>{const member=members.find(x=>x.id===memberSelect.value)?.displayName??'';speak((uiEn()?'Member ':'Membre ')+member+'. '+previewRows.map((r,i)=>{const a=(root.querySelectorAll('.voice-entry-row')[i]?.querySelector('[data-role=amount]') as HTMLInputElement)?.value??r.amount;return r.draft.label+' '+a+' francs';}).join('. '));};
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent=t('Valider ces saisies','Confirm these entries');confirm.onclick=()=>void(async()=>{try{
    const membershipId=memberSelect.value,meeting=meetingSelect.value;if(!membershipId)throw Error('MEMBER_NOT_DETECTED');if(!meeting)throw Error('MEETING_NOT_OPEN');confirm.disabled=true;let done=0;
    const rows=[...root.querySelectorAll<HTMLElement>('.voice-entry-row')];for(let i=0;i<rows.length;i++){
      const node=rows[i]!,rubricId=(node.querySelector('[data-role=rubric]') as HTMLSelectElement).value,direction=(node.querySelector('[data-role=direction]') as HTMLSelectElement).value as 'IN'|'OUT',amount=Number((node.querySelector('[data-role=amount]') as HTMLInputElement).value),loanId=(node.querySelector('[data-role=loan]') as HTMLSelectElement)?.value;
      if(!rubricId)throw Error(t('Rubrique non choisie à la ligne ','Category not selected on row ')+(i+1));if(!Number.isSafeInteger(amount)||amount<=0)throw Error(t('Montant invalide à la ligne ','Invalid amount on row ')+(i+1));const r=rubricById(rubricId);
      const kind=rubricKind(r);
      if(kind==='LOAN')await postLoanFromSheet(membershipId,r,meeting,amount);
      else if(kind==='REPAYMENT')await postRepayment(membershipId,meeting,r,amount,loanId);
      else if(direction==='OUT')await postExpense(membershipId,rubricId,meeting,amount,r?.name??previewRows[i].draft.label,t('Saisie depuis les deux feuilles / dictée','Entry from two-sheet / dictation flow'));
      else await postIncome(membershipId,rubricId,meeting,amount,t('Saisie dictée confirmée','Confirmed dictated entry'));
      done++;
    }
    status.textContent=t(`${done} saisie(s) confirmée(s). Les deux feuilles utilisent maintenant ces mêmes écritures.`,`${done} entry/entries confirmed. Both sheets now use the same records.`);status.className='voice-status success';previewRows=[];root.replaceChildren();await loadContext(true);byId<HTMLButtonElement>('refreshBtn')?.click();
  }catch(e){status.textContent=friendly(e instanceof Error?e.message:String(e));status.className='voice-status error';}finally{confirm.disabled=false;}})();actions.append(read,confirm);root.append(actions);
}

async function interpretFinancialCommand(status:HTMLElement){
  const text=byId<HTMLTextAreaElement>('voiceFinancialText')?.value.trim()??'';if(!text){status.textContent=t('Dictez ou écrivez une instruction.','Dictate or type an instruction.');return;}
  try{await loadContext(true);if(!activeGroup())throw Error('ACTIVE_GROUP_REQUIRED');const draft=parseVoiceFinancialCommand(text);previewRows=[];
    let memberId='';if(draft.memberQuery){const match=matchVoiceCandidate(draft.memberQuery,memberCandidates());if(match.candidate&&match.status!=='AMBIGUOUS')memberId=match.candidate.id;}
    let meetingId='';if(draft.meetingQuery){const match=matchVoiceCandidate(draft.meetingQuery,openMeetings().map(m=>({id:m.id,label:m.title})));if(match.candidate&&match.status!=='AMBIGUOUS')meetingId=match.candidate.id;}if(!meetingId&&openMeetings().length===1)meetingId=openMeetings()[0].id;
    for(const entry of draft.entries){const match=matchVoiceCandidate(entry.label,rubricCandidates());previewRows.push({draft:entry,rubricId:match.candidate&&match.status!=='AMBIGUOUS'?match.candidate.id:'',direction:entry.direction,amount:entry.amount});}
    status.textContent=draft.entries.length?t(`${draft.entries.length} ligne(s) comprise(s). Rien n’est comptabilisé avant votre validation.`,`${draft.entries.length} line(s) understood. Nothing is posted until you confirm.`):friendly('NO_FINANCIAL_ENTRY_DETECTED');status.className='voice-status';renderPreview(memberId,meetingId,status);
  }catch(e){status.textContent=friendly(e instanceof Error?e.message:String(e));status.className='voice-status error';}
}

function installFinancialVoicePanel(){
  if(byId('voiceFinancialPanel'))return;const operations=byId('operationsContent');if(!operations)return;
  const panel=document.createElement('section');panel.className='panel voice-financial-panel';panel.id='voiceFinancialPanel';panel.innerHTML=`<div class="panel-head"><div><h2 data-v-fr="Saisie vocale Eco · deux feuilles" data-v-en="Eco voice entry · two sheets">Saisie vocale Eco · deux feuilles</h2><p data-v-fr="Dites par exemple : « Eco ! Chez membre Serge, remplis Secours 500 ; Épargne 1000 ; Remboursement 5000 ». L’application prépare la saisie, mais ne comptabilise rien avant votre validation." data-v-en="For example: “Eco! For member Serge, fill Support 500; Savings 1000; Repayment 5000”. The app prepares the entry but posts nothing before your confirmation."></p></div></div>
  <div class="voice-command-grid"><label><span data-v-fr="Langue de reconnaissance" data-v-en="Recognition language"></span><select id="voiceFinancialLanguage"><option value="fr-FR">Français</option><option value="en-US">English</option><option value="text-local">Langue locale · texte/alias</option></select></label><label class="full"><span data-v-fr="Instruction" data-v-en="Instruction"></span><textarea id="voiceFinancialText" rows="3" placeholder="Eco ! Chez membre Serge, remplis Secours: 500; Epargne: 1000; Remboursement: 5000"></textarea></label></div>
  <div class="actions"><button id="voiceFinancialMic" type="button" class="secondary">🎙️ <span data-v-fr="Dicter" data-v-en="Dictate">Dicter</span></button><button id="voiceFinancialInterpret" type="button" class="primary"><span data-v-fr="Comprendre et prévisualiser" data-v-en="Understand and preview">Comprendre et prévisualiser</span></button><button id="voiceFinancialClear" type="button" class="link-btn"><span data-v-fr="Effacer" data-v-en="Clear">Effacer</span></button></div><p id="voiceFinancialStatus" class="voice-status"></p><div id="voiceFinancialPreview" class="stack"></div>
  <details class="voice-local-help"><summary data-v-fr="Langues camerounaises · fonctionnement actuel" data-v-en="Cameroonian languages · current operation"></summary><p data-v-fr="Les noms, rubriques et alias peuvent être écrits en Boulou, Ewondo, Bassa, Eton, Fulfulde/Peul, Badjué et autres langues en Unicode. La reconnaissance vocale automatique dépend cependant des langues réellement prises en charge par le navigateur : Français et English restent les modes sûrs. Le mode langue locale accepte le texte et les alias sans prétendre reconnaître une langue que le moteur vocal ne maîtrise pas." data-v-en="Names, categories and aliases can be written in Boulou, Ewondo, Bassa, Eton, Fulfulde/Peul, Badjué and other languages using Unicode. Automatic speech recognition still depends on languages actually supported by the browser: French and English remain the reliable modes. Local-language mode accepts text and aliases without pretending the speech engine supports an unsupported language."></p></details>`;
  operations.prepend(panel);const status=byId('voiceFinancialStatus')!;const box=byId<HTMLTextAreaElement>('voiceFinancialText')!,lang=byId<HTMLSelectElement>('voiceFinancialLanguage')!;let controller:any;
  const refreshSpeech=()=>{controller?.stop?.();controller=speech(lang.value==='en-US'?'en-US':'fr-FR',text=>{box.value+=(box.value&& !/\s$/.test(box.value)?' ':'')+text;box.dispatchEvent(new Event('input',{bubbles:true}));},(active,message)=>{byId<HTMLButtonElement>('voiceFinancialMic')!.disabled=lang.value==='text-local';byId<HTMLButtonElement>('voiceFinancialMic')!.textContent=active?(uiEn()?'⏹ Stop':'⏹ Arrêter'):(uiEn()?'🎙️ Dictate':'🎙️ Dicter');status.textContent=message;});};refreshSpeech();
  lang.onchange=()=>{refreshSpeech();if(lang.value==='text-local'){byId<HTMLButtonElement>('voiceFinancialMic')!.disabled=true;status.textContent=t('Écrivez l’instruction avec les noms/alias locaux ; la voix locale n’est pas annoncée comme disponible.','Type the instruction using local names/aliases; local speech is not advertised as supported.');}else byId<HTMLButtonElement>('voiceFinancialMic')!.disabled=false;};
  byId<HTMLButtonElement>('voiceFinancialMic')!.onclick=()=>controller.toggle();byId<HTMLButtonElement>('voiceFinancialInterpret')!.onclick=()=>void interpretFinancialCommand(status);byId<HTMLButtonElement>('voiceFinancialClear')!.onclick=()=>{box.value='';previewRows=[];byId('voiceFinancialPreview')?.replaceChildren();status.textContent='';};
}

async function recordSheetCell(membershipId:string,rubricId:string,meetingId:string,direction:'IN'|'OUT',amount:number,status?:HTMLElement,loanId?:string){
  const rubric=rubricById(rubricId),kind=rubricKind(rubric);
  if(kind==='LOAN')await postLoanFromSheet(membershipId,rubric,meetingId,amount);
  else if(kind==='REPAYMENT')await postRepayment(membershipId,meetingId,rubric,amount,loanId);
  else if(direction==='OUT')await postExpense(membershipId,rubricId,meetingId,amount,rubric?.name??t('Dépense de séance','Meeting expense'));
  else await postIncome(membershipId,rubricId,meetingId,amount);
  if(status)status.textContent=t('Enregistré sur les deux feuilles.','Recorded on both sheets.');await loadContext(true);byId<HTMLButtonElement>('refreshBtn')?.click();
}

function buildSheetCellEditor(membershipId:string,rubric:any,meetingId:string,status?:HTMLElement){
  const editor=document.createElement('div');editor.className='sheet-cell-editor';const kind=rubricKind(rubric);
  const dir=document.createElement('select');dir.append(makeOption('IN','+'),makeOption('OUT','−'));dir.title=t('Entrée ou sortie','Income or outflow');
  if(kind==='LOAN'){dir.replaceChildren(makeOption('OUT',t('Prêt −','Loan −')));dir.value='OUT';dir.disabled=true;}
  else if(kind==='REPAYMENT'){dir.replaceChildren(makeOption('IN',repaymentComponent(rubric)==='INTEREST'?t('Intérêts +','Interest +'):t('Remb. +','Repay +')));dir.value='IN';dir.disabled=true;}
  else if(String(rubric?.facets?.direction??'')==='OUTFLOW')dir.value='OUT';
  const amount=document.createElement('input');amount.type='number';amount.min='1';amount.step='1';amount.inputMode='numeric';amount.placeholder='0';amount.setAttribute('aria-label',t('Montant','Amount'));
  let loanSelect:HTMLSelectElement|undefined;
  if(kind==='REPAYMENT'){
    loanSelect=document.createElement('select');loanSelect.className='sheet-loan-select';loanSelect.append(makeOption('',t('Prêt concerné','Related loan')));
    const active=activeLoansFor(membershipId);for(const loan of active)loanSelect.append(makeOption(loan.id,loan.title+' · '+t('capital ','principal ')+fmt(Number(loan.data?.outstandingPrincipal??0))+' · '+t('intérêts ','interest ')+fmt(Number(loan.data?.unpaidInterest??0))));
    if(active.length===1){loanSelect.value=active[0].id;loanSelect.hidden=true;}
  }
  const save=document.createElement('button');save.type='button';save.textContent='✓';save.title=t('Valider cette cellule','Confirm this cell');save.onclick=()=>void(async()=>{try{save.disabled=true;await recordSheetCell(membershipId,rubric.id,meetingId,dir.value as 'IN'|'OUT',Number(amount.value),status,loanSelect?.value||undefined);amount.value='';}catch(e){if(status)status.textContent=friendly(e instanceof Error?e.message:String(e));}finally{save.disabled=false;}})();
  editor.append(dir,amount);if(loanSelect)editor.append(loanSelect);editor.append(save);return editor;
}

async function renderCanonicalMeetingMatrix(root:HTMLElement,meetingId?:string){
  await loadContext();const group=activeGroup();if(!group||root.dataset.canonicalRendering==='1')return;root.dataset.canonicalRendering='1';try{
    const [ledger,expenses,sheetEvents]=await Promise.all([
      api<AnyRecord>(`/api/v1/groups/${encodeURIComponent(group)}/ledger`),
      api<any[]>(`/api/v1/groups/${encodeURIComponent(group)}/expenses`).catch(()=>[]),
      api<any[]>(`/api/v1/workspaces?moduleId=FINANCE.SHEET_EVENT&groupId=${encodeURIComponent(group)}`).catch(()=>[])
    ]);
    let chosen=meetingId||root.dataset.meetingId||openMeetings()[0]?.id||meetings[0]?.id||'';
    const controls=document.createElement('div');controls.className='sheet-controls';const label=document.createElement('label');label.textContent=t('Séance de la feuille ','Sheet meeting ');const select=document.createElement('select');select.append(makeOption('',t('Choisir une séance','Choose a meeting')));for(const m of meetings.slice().sort((a,b)=>String(b.openedAt).localeCompare(String(a.openedAt))))select.append(makeOption(m.id,m.title+(m.status==='open'?' · '+t('ouverte','open'):' · '+t('clôturée','closed'))));select.value=chosen;label.append(select);controls.append(label);
    const status=document.createElement('p');status.className='hint';status.textContent=t('Toutes les rubriques créées non archivées sont affichées. Prêts et remboursements passent par leur moteur canonique, pas par une cotisation générique.','All created non-archived rubrics are shown. Loans and repayments use their canonical engine, not a generic contribution.');controls.append(status);
    const activeRubrics=rubrics.filter(x=>x.status!=='ARCHIVED'),table=document.createElement('table');table.className='meeting-matrix canonical-two-sheet';table.dataset.rubricCount=String(activeRubrics.length);
    const thead=document.createElement('thead'),hr=document.createElement('tr');hr.append(Object.assign(document.createElement('th'),{textContent:t('Membre','Member')}));
    for(const r of activeRubrics){const th=document.createElement('th');const a=document.createElement('a');a.href='#detail=rubric:'+encodeURIComponent(r.id);a.dataset.detailType='rubric';a.dataset.detailId=r.id;a.textContent=r.name;th.append(a);hr.append(th);}thead.append(hr);table.append(thead);const tbody=document.createElement('tbody');
    for(const m of members){
      const tr=document.createElement('tr'),th=document.createElement('th');const a=document.createElement('a');a.href='#detail=member:'+encodeURIComponent(m.id);a.dataset.detailType='member';a.dataset.detailId=m.id;a.textContent=m.displayName;th.append(a);tr.append(th);
      for(const r of activeRubrics){
        const td=document.createElement('td');
        const receiptIn=(ledger.receipts??[]).filter((x:any)=>x.membershipId===m.id&&(!chosen||x.meetingId===chosen)&&x.rubricId===r.id).reduce((n:number,x:any)=>n+Number(x.netAmount??x.amount?.amount??0),0);
        const eventIn=sheetEvents.filter((x:any)=>String(x.data?.membershipId??'')===m.id&&(!chosen||x.data?.meetingId===chosen)&&x.data?.rubricId===r.id&&x.data?.direction==='IN').reduce((n:number,x:any)=>n+Number(x.data?.amount??0),0);
        const expenseOut=expenses.filter((x:any)=>x.scope==='SHEET'&&x.membershipId===m.id&&(!chosen||x.meetingId===chosen)&&x.rubricId===r.id).reduce((n:number,x:any)=>n+Number(x.amount??0),0);
        const eventOut=sheetEvents.filter((x:any)=>String(x.data?.membershipId??'')===m.id&&(!chosen||x.data?.meetingId===chosen)&&x.data?.rubricId===r.id&&x.data?.direction==='OUT').reduce((n:number,x:any)=>n+Number(x.data?.amount??0),0);
        const inflow=receiptIn+eventIn,outflow=expenseOut+eventOut,value=document.createElement('div');value.className='sheet-cell-value';value.innerHTML=`<strong>${fmt(inflow-outflow)}</strong><small>+${fmt(inflow)} · −${fmt(outflow)}</small>`;td.append(value);
        if(chosen&&meetings.find(x=>x.id===chosen)?.status==='open')td.append(buildSheetCellEditor(m.id,r,chosen,status));tr.append(td);
      }
      tbody.append(tr);
    }
    table.append(tbody);root.replaceChildren(controls,table);root.dataset.meetingId=chosen;root.dataset.canonical='1';select.onchange=()=>{delete root.dataset.canonicalRendering;root.dataset.meetingId=select.value;void renderCanonicalMeetingMatrix(root,select.value);};
  }finally{delete root.dataset.canonicalRendering;}
}

function hardenLegacyMatrix(){const root=byId('meetingMatrix');if(!root)return;const observer=new MutationObserver(()=>{if(root.childElementCount&&!root.querySelector('.canonical-two-sheet')){delete root.dataset.canonical;void renderCanonicalMeetingMatrix(root).catch(()=>{});}});observer.observe(root,{childList:true,subtree:false});document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target.closest('#meetingMatrix .matrix-cell'):null;if(target){event.preventDefault();event.stopImmediatePropagation();void renderCanonicalMeetingMatrix(root);}},true);}

async function enhanceDetailSheets(){
  const body=byId('detailBody');if(!body)return;const group=activeGroup();if(!group)return;await loadContext();
  const me=await api<any>(`/api/v1/groups/${encodeURIComponent(group)}/me`).catch(()=>({isManager:false}));
  // A simple member's individual sheet is already built from the privacy-safe operational projection.
  // Never replace it with group-wide ledger reads that the member is not allowed to perform.
  if(!me.isManager)return;
  const [expenses,ledger,sheetEvents]=await Promise.all([
    api<any[]>(`/api/v1/groups/${encodeURIComponent(group)}/expenses`).catch(()=>[]),
    api<AnyRecord>(`/api/v1/groups/${encodeURIComponent(group)}/ledger`).catch(()=>({receipts:[]})),
    api<any[]>(`/api/v1/workspaces?moduleId=FINANCE.SHEET_EVENT&groupId=${encodeURIComponent(group)}`).catch(()=>[])
  ]);
  for(const table of body.querySelectorAll<HTMLTableElement>('.member-exercise-matrix table,.meeting-entry-matrix table')){
    if(table.dataset.twoSheetEnhanced==='1')continue;table.dataset.twoSheetEnhanced='1';
    const rubricIds=[...table.querySelectorAll<HTMLAnchorElement>('thead th a[data-detail-type="rubric"]')].map(a=>a.dataset.detailId??'');
    const isMember=Boolean(table.closest('.member-exercise-matrix')),hash=location.hash.match(/^#detail=(member|meeting):(.+)$/);if(!hash)continue;const currentId=decodeURIComponent(hash[2]);
    const rows=[...table.querySelectorAll<HTMLTableRowElement>('tbody tr')];
    for(const tr of rows){
      const rowLink=tr.querySelector<HTMLAnchorElement>('th a[data-detail-id]'),rowId=rowLink?.dataset.detailId??'',membershipId=isMember?currentId:rowId,meetingId=isMember?rowId:currentId;if(!membershipId||!meetingId)continue;
      const cells=[...tr.querySelectorAll<HTMLTableCellElement>('td')];
      cells.forEach((td,i)=>{
        const rubricId=rubricIds[i],rubric=rubricById(rubricId);if(!rubricId||!rubric)return;
        const receiptIn=(ledger.receipts??[]).filter((x:any)=>x.membershipId===membershipId&&x.meetingId===meetingId&&x.rubricId===rubricId).reduce((n:number,x:any)=>n+Number(x.netAmount??x.amount?.amount??0),0);
        const eventIn=sheetEvents.filter((x:any)=>String(x.data?.membershipId??'')===membershipId&&x.data?.meetingId===meetingId&&x.data?.rubricId===rubricId&&x.data?.direction==='IN').reduce((n:number,x:any)=>n+Number(x.data?.amount??0),0);
        const expenseOut=expenses.filter((x:any)=>x.scope==='SHEET'&&x.membershipId===membershipId&&x.meetingId===meetingId&&x.rubricId===rubricId).reduce((n:number,x:any)=>n+Number(x.amount??0),0);
        const eventOut=sheetEvents.filter((x:any)=>String(x.data?.membershipId??'')===membershipId&&x.data?.meetingId===meetingId&&x.data?.rubricId===rubricId&&x.data?.direction==='OUT').reduce((n:number,x:any)=>n+Number(x.data?.amount??0),0);
        const inflow=receiptIn+eventIn,outflow=expenseOut+eventOut,shown=td.querySelector<HTMLElement>('.matrix-confirmed');
        if(shown){shown.textContent=fmt(inflow-outflow);shown.title=t(`Net : +${fmt(inflow)} − ${fmt(outflow)}`,`Net: +${fmt(inflow)} − ${fmt(outflow)}`);}
        const old=td.querySelector('.matrix-entry');if(old)old.replaceWith(buildSheetCellEditor(membershipId,rubric,meetingId));
      });
    }
  }
}

function watchDetailSheets(){const body=byId('detailBody');if(!body)return;let timer=0;new MutationObserver(()=>{clearTimeout(timer);timer=window.setTimeout(()=>void enhanceDetailSheets().catch(()=>{}),80);}).observe(body,{childList:true,subtree:true});}

function installBackOfficeExpense(){const finance=byId('financeContent');if(!finance||byId('backOfficeExpensePanel'))return;const section=document.createElement('section');section.className='panel';section.id='backOfficeExpensePanel';section.innerHTML=`<div class="panel-head"><div><h2 data-v-fr="Dépenses · back-office" data-v-en="Expenses · back office"></h2><p data-v-fr="Pour les dépenses non portées directement sur la fiche d’un membre. Elles peuvent être rattachées à une séance et remontent au Récap." data-v-en="For expenses not entered directly on a member sheet. They may be linked to a meeting and flow into Recap."></p></div></div><form id="backOfficeExpenseForm" class="form-grid"><label><span data-v-fr="Libellé" data-v-en="Label"></span><input id="backOfficeExpenseLabel" required></label><label><span data-v-fr="Montant" data-v-en="Amount"></span><input id="backOfficeExpenseAmount" type="number" min="1" step="1" inputmode="numeric" required></label><label><span data-v-fr="Séance (facultatif)" data-v-en="Meeting (optional)"></span><select id="backOfficeExpenseMeeting"><option value="">—</option></select></label><label class="full"><span data-v-fr="Note / justificatif" data-v-en="Note / evidence"></span><input id="backOfficeExpenseNote"></label><button class="primary" type="submit" data-v-fr="Enregistrer la dépense" data-v-en="Record expense"></button></form><p id="backOfficeExpenseStatus" class="hint"></p><div id="backOfficeExpenseList" class="stack"></div>`;finance.append(section);const form=byId<HTMLFormElement>('backOfficeExpenseForm')!,status=byId('backOfficeExpenseStatus')!;
  const refresh=async()=>{try{await loadContext(true);const sel=byId<HTMLSelectElement>('backOfficeExpenseMeeting')!,cur=sel.value;sel.replaceChildren(makeOption('',t('Sans séance','No meeting')));for(const m of meetings)sel.append(makeOption(m.id,m.title));sel.value=[...sel.options].some(o=>o.value===cur)?cur:'';const group=activeGroup();if(!group)return;const rows=await api<any[]>(`/api/v1/groups/${encodeURIComponent(group)}/expenses?scope=BACKOFFICE`).catch(()=>[]),root=byId('backOfficeExpenseList')!;root.replaceChildren();for(const x of rows.slice(0,30)){const a=document.createElement('article');a.className='item';a.innerHTML=`<strong>${x.label}</strong><p>−${fmt(Number(x.amount))}</p><small>${x.meetingId?t('Séance liée','Linked meeting')+' · ':''}${new Date(x.createdAt).toLocaleString()}</small>`;root.append(a);}}catch{}};void refresh();byId<HTMLSelectElement>('activeGroupSelect')?.addEventListener('change',()=>void refresh());form.onsubmit=e=>{e.preventDefault();void(async()=>{try{const group=activeGroup();if(!group)throw Error('ACTIVE_GROUP_REQUIRED');const amount=Number((byId<HTMLInputElement>('backOfficeExpenseAmount')!).value),label=(byId<HTMLInputElement>('backOfficeExpenseLabel')!).value.trim();await api(`/api/v1/groups/${encodeURIComponent(group)}/expenses`,{method:'POST',body:JSON.stringify({amount,label,scope:'BACKOFFICE',meetingId:byId<HTMLSelectElement>('backOfficeExpenseMeeting')!.value||undefined,note:byId<HTMLInputElement>('backOfficeExpenseNote')!.value.trim()||undefined,idempotencyKey:idem('backoffice_out')})});form.reset();status.textContent=t('Dépense enregistrée et tracée dans le Ledger.','Expense recorded and traced in the Ledger.');await refresh();byId<HTMLButtonElement>('refreshBtn')?.click();}catch(err){status.textContent=friendly(err instanceof Error?err.message:String(err));}})();};}

function installFocusedFieldDictation(){
  if(byId('focusedFieldDictation'))return;const button=document.createElement('button');button.id='focusedFieldDictation';button.type='button';button.className='focused-field-dictation';button.textContent='🎙️';button.title=t('Dicter dans le champ actif','Dictate into active field');button.hidden=true;document.body.append(button);let target:HTMLInputElement|HTMLTextAreaElement|null=null,controller:any;
  document.addEventListener('focusin',event=>{const e=event.target as HTMLElement;if(e instanceof HTMLTextAreaElement||(e instanceof HTMLInputElement&&['text','search','number','tel'].includes(e.type))){target=e;button.hidden=false;}else button.hidden=true;});
  button.onclick=()=>{if(!target)return;controller?.stop?.();controller=speech(uiEn()?'en-US':'fr-FR',text=>{if(!target)return;if(target instanceof HTMLInputElement&&target.type==='number'){const amount=parseVoiceAmount(text);if(amount!==undefined)target.value=String(amount);}else target.value+=(target.value&& !/\s$/.test(target.value)?' ':'')+text;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));},(active)=>{button.textContent=active?'⏹️':'🎙️';});controller.toggle();};
}

function installTwoSheetChooser(){
  const meeting=byId<HTMLButtonElement>('meetingSheetViewBtn'),individual=byId<HTMLButtonElement>('individualSheetsViewBtn'),mode=byId('meetingSheetMode');
  if(!meeting||!individual||meeting.dataset.bound==='1')return;meeting.dataset.bound='1';
  meeting.onclick=()=>{meeting.classList.add('active');individual.classList.remove('active');if(mode)mode.hidden=false;byId<HTMLButtonElement>('matrixViewBtn')?.click();setTimeout(()=>byId('meetingMatrix')?.scrollIntoView({behavior:'smooth',block:'start'}),80);};
  individual.onclick=()=>{individual.classList.add('active');meeting.classList.remove('active');document.querySelector<HTMLButtonElement>('#masterGovernanceCenter [data-mg="sheet"]')?.click();setTimeout(()=>byId('mg-sheet')?.scrollIntoView({behavior:'smooth',block:'start'}),80);};
}
function translateInjected(){for(const el of document.querySelectorAll<HTMLElement>('[data-v-fr][data-v-en]'))el.textContent=uiEn()?el.dataset.vEn??'':el.dataset.vFr??'';}

export function mountVoiceEntryUI(){installFinancialVoicePanel();hardenLegacyMatrix();watchDetailSheets();installBackOfficeExpense();installFocusedFieldDictation();installTwoSheetChooser();byId<HTMLButtonElement>('membersNavBtn')?.addEventListener('click',()=>setTimeout(()=>byId('memberForm')?.scrollIntoView({behavior:'smooth',block:'center'}),100));byId<HTMLButtonElement>('financeIndividualSheetBtn')?.addEventListener('click',()=>{document.querySelector<HTMLButtonElement>('#masterGovernanceCenter [data-mg="sheet"]')?.click();setTimeout(()=>byId('mg-sheet')?.scrollIntoView({behavior:'smooth',block:'start'}),100);});byId<HTMLButtonElement>('financeLoanRulesBtn')?.addEventListener('click',()=>{document.querySelector<HTMLButtonElement>('#masterGovernanceCenter [data-mg="loan"]')?.click();setTimeout(()=>byId('mg-loan')?.scrollIntoView({behavior:'smooth',block:'start'}),100);});translateInjected();byId<HTMLSelectElement>('languageSelect')?.addEventListener('change',()=>{translateInjected();});byId<HTMLSelectElement>('activeGroupSelect')?.addEventListener('change',()=>{loadedGroup='';void loadContext(true).catch(()=>{});});}
