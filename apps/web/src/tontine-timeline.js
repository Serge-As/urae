import {contextLink}from'./context-link.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
export function projectTontineRounds(shares){
  const rounds=new Map();
  for(const share of shares){const d=share.data??{},round=Number(d.scheduledRound);if(!Number.isSafeInteger(round)||round<1||d.completionState==='CANCELLED')continue;if(!rounds.has(round))rounds.set(round,[]);rounds.get(round).push({id:share.id,title:share.title,membershipId:d.membershipId,slot:d.scheduledSlot,state:d.completionState,evidence:d.benefitLedgerEntryId,served:d.completionState==='SERVED'&&Boolean(d.benefitLedgerEntryId)});}
  return[...rounds].sort((a,b)=>a[0]-b[0]).map(([round,items])=>({round,items:items.sort((a,b)=>Number(a.slot??0)-Number(b.slot??0))}));
}
/** Read-only schedule projection. A scheduled round never counts as a Ledger-proven benefit. */
export function tontineTimeline(shares,members,tx=(fr)=>fr){
  const root=el('ol',undefined,'eco-tontine-timeline');root.setAttribute('aria-label',tx('Calendrier des tours programmés','Scheduled round timeline'));
  for(const {round,items}of projectTontineRounds(shares)){const item=el('li');item.append(el('strong',tx('Tour ','Round ')+round));for(const share of items){const m=members.find(x=>x.id===share.membershipId),row=el('div',undefined,'eco-round-beneficiary');row.append(m?contextLink(m.displayName,'member',m.id):el('span',share.title),el('span',share.served?tx('Servi · preuve Ledger','Served · Ledger evidence'):share.state==='SERVED'?tx('Preuve à vérifier','Evidence needs checking'):tx('Programmé','Scheduled'),share.served?'pill success':'pill'));if(share.evidence)row.append(el('small',tx('Preuve : ','Evidence: ')+share.evidence));item.append(row);}root.append(item);}
  if(!root.childElementCount)root.append(el('li',tx('Aucun tour programmé. Le calendrier s’affichera après classement des parts.','No scheduled rounds. The timeline appears after shares are scheduled.')));
  return root;
}
