const byId=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T|null;
const en=()=>byId<HTMLSelectElement>('languageSelect')?.value==='en';
const tr=(fr:string,eng:string)=>en()?eng:fr;
const groupId=()=>byId<HTMLSelectElement>('activeGroupSelect')?.value||(()=>{try{return localStorage.getItem('tontine.activeGroupId')??'';}catch{return '';}})();
const money=(n:number)=>new Intl.NumberFormat(en()?'en-CM':'fr-CM',{maximumFractionDigits:0}).format(n)+' F CFA';
async function getExpenses(){const group=groupId();if(!group)return[];const res=await fetch(`/api/v1/groups/${encodeURIComponent(group)}/expenses`,{headers:{'accept-language':en()?'en':'fr','x-active-group-id':group}});if(!res.ok)return[];return await res.json() as any[];}

let recapBusy=false,detailBusy=false;
async function renderRecapExpenses(){
  const root=byId('recapFinance');if(!root||recapBusy||!groupId())return;recapBusy=true;try{
    root.querySelector('[data-expense-recap]')?.remove();const rows=await getExpenses();const sheet=rows.filter(x=>x.scope==='SHEET'),back=rows.filter(x=>x.scope==='BACKOFFICE');
    const card=document.createElement('article');card.className='item';card.dataset.expenseRecap='1';
    const total=rows.reduce((n,x)=>n+Number(x.amount??0),0),meetingLinked=rows.filter(x=>x.meetingId).reduce((n,x)=>n+Number(x.amount??0),0);
    const h=document.createElement('strong');h.textContent=tr('Dépenses enregistrées','Recorded expenses');card.append(h);
    const p=document.createElement('p');p.textContent=tr(`Total : ${money(total)} · sur les deux feuilles : ${money(sheet.reduce((n,x)=>n+Number(x.amount??0),0))} · back-office : ${money(back.reduce((n,x)=>n+Number(x.amount??0),0))}`,`Total: ${money(total)} · on the two sheets: ${money(sheet.reduce((n,x)=>n+Number(x.amount??0),0))} · back office: ${money(back.reduce((n,x)=>n+Number(x.amount??0),0))}`);card.append(p);
    const small=document.createElement('small');small.textContent=tr(`Rattachées à une séance : ${money(meetingLinked)}. Les dépenses sans membre restent en back-office, mais celles liées à une séance remontent dans son Récap.`,`Meeting-linked: ${money(meetingLinked)}. Expenses without a member remain in back office, while meeting-linked expenses flow into that meeting's Recap.`);card.append(small);root.append(card);
  }finally{recapBusy=false;}
}

async function renderMeetingExpenses(){
  const body=byId('detailBody');if(!body||detailBusy||!groupId())return;const match=location.hash.match(/^#detail=meeting:(.+)$/);if(!match)return;detailBusy=true;try{
    body.querySelector('[data-meeting-expenses]')?.remove();const meetingId=decodeURIComponent(match[1]!),rows=(await getExpenses()).filter(x=>x.meetingId===meetingId);if(!rows.length)return;
    const card=document.createElement('article');card.className='panel';card.dataset.meetingExpenses='1';const h=document.createElement('h2');h.textContent=tr('Dépenses de cette séance','Expenses for this meeting');card.append(h);
    const total=rows.reduce((n,x)=>n+Number(x.amount??0),0);const intro=document.createElement('p');intro.className='truth-notice';intro.textContent=tr(`Total sorties : ${money(total)}. Les dépenses de feuille et de back-office rattachées à cette séance sont réunies ici sans créer un second registre.`,`Total outflows: ${money(total)}. Sheet and back-office expenses linked to this meeting are gathered here without creating a second ledger.`);card.append(intro);
    for(const x of rows){const item=document.createElement('article');item.className='item';const strong=document.createElement('strong');strong.textContent=x.label;const p=document.createElement('p');p.textContent='−'+money(Number(x.amount??0));const small=document.createElement('small');small.textContent=(x.scope==='SHEET'?tr('Deux feuilles','Two sheets'):tr('Back-office','Back office'))+(x.membershipId?' · '+tr('rattachée à un membre','member-linked'):'');item.append(strong,p,small);if(x.note){const note=document.createElement('p');note.textContent=x.note;item.append(note);}card.append(item);}body.append(card);
  }finally{detailBusy=false;}
}

let refreshTimer:ReturnType<typeof setTimeout>|undefined;
function schedule(){
  if(refreshTimer!==undefined)return;
  refreshTimer=setTimeout(()=>{refreshTimer=undefined;void renderRecapExpenses();void renderMeetingExpenses();},120);
}
// MutationObserver runs after the render stack: busy has already been reset.
// Ignore only this projection's own top-level cards; real recap/detail changes
// still trigger a fresh read from the existing canonical expense endpoint.
const externalMutation=(records:MutationRecord[],marker:'expenseRecap'|'meetingExpenses')=>records.some(record=>
  Array.from(record.addedNodes).concat(Array.from(record.removedNodes)).some(node=>!(node instanceof HTMLElement&&node.dataset[marker]==='1')));
export function mountExpenseRecapUI(){
  const recap=byId('recapFinance');if(recap)new MutationObserver(records=>{if(!recapBusy&&externalMutation(records,'expenseRecap'))schedule();}).observe(recap,{childList:true});
  const detail=byId('detailBody');if(detail)new MutationObserver(records=>{if(!detailBusy&&externalMutation(records,'meetingExpenses'))schedule();}).observe(detail,{childList:true,subtree:false});
  document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target.closest('[data-view="recap"],[data-detail-type="meeting"],#refreshBtn'):null;if(target)schedule();});
  byId<HTMLSelectElement>('activeGroupSelect')?.addEventListener('change',schedule);byId<HTMLSelectElement>('languageSelect')?.addEventListener('change',schedule);schedule();
}
