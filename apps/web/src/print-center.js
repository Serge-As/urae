const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n??0).toLocaleString('fr-FR')+' XAF';

export function buildPrintSnapshot({group,members=[],meetings=[],rubrics=[],ledger}){
  const activeMembers=members.filter(x=>x.status==='active'),openMeetings=meetings.filter(x=>x.status==='open'),closedMeetings=meetings.filter(x=>x.status==='closed');
  return{
    generatedAt:new Date().toISOString(),
    group:{id:group?.id??'',name:group?.name??'Groupe',kind:group?.kind??'',status:group?.status??''},
    counts:{members:activeMembers.length,rubrics:rubrics.filter(x=>x.status==='ACTIVE').length,meetings:meetings.length,openMeetings:openMeetings.length,closedMeetings:closedMeetings.length},
    rubrics:rubrics.filter(x=>x.status==='ACTIVE').map(x=>({name:x.name,kind:x.activityPlan?.kind??x.facets?.custom?.miscKind??'',direction:x.facets?.direction??''})),
    meetings:meetings.slice().sort((a,b)=>String(a.scheduledAt??a.openedAt??'').localeCompare(String(b.scheduledAt??b.openedAt??''))).map(x=>({title:x.title,status:x.status,at:x.scheduledAt??x.openedAt??''})),
    financial:ledger?{cashBalance:Number(ledger.summary?.cashBalance??0),entryCount:Number(ledger.summary?.entryCount??ledger.entries?.length??0),receiptCount:Number(ledger.receipts?.length??0)}:null
  };
}

const netReceipt=r=>Number(r?.netAmount??r?.amount?.amount??0);
const printLot=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return 'ECO-PAPER-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());};

export function buildSessionPrintSheet({group,meeting,members=[],rubrics=[],ledger}){
  const activeMembers=members.filter(x=>x.status==='active'),activeRubrics=rubrics.filter(x=>x.status==='ACTIVE'),receipts=(ledger?.receipts??[]).filter(x=>x.meetingId===meeting?.id);
  const rows=activeMembers.map(m=>{const cells=activeRubrics.map(r=>receipts.filter(x=>x.membershipId===m.id&&x.rubricId===r.id).reduce((n,x)=>n+netReceipt(x),0));return{membershipId:m.id,displayName:m.displayName,cells,total:cells.reduce((a,b)=>a+b,0)};});
  const columnTotals=activeRubrics.map((_,i)=>rows.reduce((n,row)=>n+Number(row.cells[i]??0),0));
  return{kind:'SESSION_SHEET',lot:printLot(),generatedAt:new Date().toISOString(),group:{id:group?.id??'',name:group?.name??'Groupe'},meeting:{id:meeting?.id??'',title:meeting?.title??'Séance',status:meeting?.status??'',at:meeting?.scheduledAt??meeting?.openedAt??''},rubrics:activeRubrics.map(r=>({id:r.id,name:r.name})),rows,columnTotals,grandTotal:columnTotals.reduce((a,b)=>a+b,0),canonicalProjection:true};
}
export function buildMemberPrintSheet({group,member,statement,rubrics=[],meetings=[]}){
  const rubricNames=new Map(rubrics.map(r=>[r.id,r.name])),meetingNames=new Map(meetings.map(m=>[m.id,m.title]));
  const receipts=(statement?.receipts??[]).map(r=>({receiptId:r.id,meetingId:r.meetingId??'',meetingName:meetingNames.get(r.meetingId)??'Sans séance',rubricId:r.rubricId??'',rubricName:rubricNames.get(r.rubricId)??'Sans rubrique',netAmount:netReceipt(r),currency:r.amount?.currency??statement?.currency??'XAF',receivedAt:r.receivedAt}));
  const byRubric=[...new Set(receipts.map(x=>x.rubricId))].map(id=>({rubricId:id,rubricName:receipts.find(x=>x.rubricId===id)?.rubricName??'Rubrique',total:receipts.filter(x=>x.rubricId===id).reduce((n,x)=>n+x.netAmount,0)}));
  return{kind:'MEMBER_SHEET',lot:printLot(),generatedAt:new Date().toISOString(),group:{id:group?.id??'',name:group?.name??'Groupe'},member:{id:member?.id??'',displayName:member?.displayName??statement?.displayName??'Membre'},currency:statement?.currency??'XAF',totalNet:Number(statement?.totalNetContributions??0),byRubric,receipts,canonicalProjection:true,otherMemberDataIncluded:false};
}
export function buildAttendancePrintSheet({group,meeting,members=[],attendance=[]}){
  const byMember=new Map(attendance.map(x=>[String(x.data?.membershipId??x.membershipId??''),x]));
  const rows=members.filter(x=>x.status==='active').map(m=>{const a=byMember.get(m.id);return{membershipId:m.id,displayName:m.displayName,attendance:String(a?.data?.attendance??''),note:String(a?.data?.note??''),signature:''};});
  return{kind:'ATTENDANCE_SHEET',lot:printLot(),generatedAt:new Date().toISOString(),group:{id:group?.id??'',name:group?.name??'Groupe'},meeting:{id:meeting?.id??'',title:meeting?.title??'Séance',at:meeting?.scheduledAt??meeting?.openedAt??''},rows,canonicalProjection:true,signatureColumn:true};
}
export function buildRoleRegister({group,members=[]}){
  const rows=[];for(const m of members.filter(x=>x.status==='active'))for(const role of m.roles??[])rows.push({membershipId:m.id,displayName:m.displayName,role});
  rows.sort((a,b)=>String(a.role).localeCompare(String(b.role),'fr')||String(a.displayName).localeCompare(String(b.displayName),'fr'));
  return{kind:'ROLE_REGISTER',lot:printLot(),generatedAt:new Date().toISOString(),group:{id:group?.id??'',name:group?.name??'Groupe'},rows,canonicalProjection:true};
}
export function buildMemberCards({group,members=[]}){
  return{kind:'MEMBER_CARDS',lot:printLot(),generatedAt:new Date().toISOString(),group:{id:group?.id??'',name:group?.name??'Groupe'},cards:members.filter(x=>x.status==='active').map(m=>({membershipId:m.id,displayName:m.displayName,roles:[...(m.roles??[])],privateContactIncluded:false,identityDocumentIncluded:false})),canonicalProjection:true};
}

export function mountPrintCenterUI({app,getGroups=()=>[],getMembers=()=>[],getMeetings=()=>[],getRubrics=()=>[],isManager=()=>false,notify=()=>{},showError=()=>{}}={}){
  const host=document.querySelector('#view-documents');if(!host||document.querySelector('#paperPrintCenter'))return{refresh:async()=>{}};
  const panel=el('section',undefined,'panel');panel.id='paperPrintCenter';
  panel.append(el('div','Projection canonique','eyebrow'),el('h2','État imprimable du groupe'),el('p','Les documents imprimés sont des projections des données canoniques. Ils ne créent aucune nouvelle écriture financière.','truth-notice'));
  const actions=el('div',undefined,'actions'),printGroup=el('button','Imprimer cet état du groupe','primary');printGroup.type='button';actions.append(printGroup);panel.append(actions);
  const preview=el('div',undefined,'stack');panel.append(preview);host.append(panel);

  const snapshot=async()=>{
    const group=getGroups().find(g=>g.id===app.activeGroup());if(!group)throw Error('ACTIVE_GROUP_REQUIRED');
    const ledger=isManager()?await app.ledger().catch(()=>null):null;
    return buildPrintSnapshot({group,members:getMembers(),meetings:getMeetings(),rubrics:getRubrics(),ledger});
  };
  const render=async()=>{
    preview.replaceChildren();if(!app.activeGroup()){preview.append(el('p','Sélectionnez un groupe pour préparer une impression.','empty-state'));return;}
    try{const s=await snapshot();const card=el('article',undefined,'item');card.append(el('strong',s.group.name),el('p',s.counts.members+' membre(s) actif(s) · '+s.counts.rubrics+' rubrique(s) · '+s.counts.meetings+' séance(s)','hint'));if(s.financial&&isManager())card.append(el('p','Caisse canonique : '+money(s.financial.cashBalance)+' · '+s.financial.entryCount+' écriture(s)','hint'));preview.append(card);}catch(e){preview.append(el('p',String(e?.message??e),'hint'));}
  };
  printGroup.onclick=()=>void(async()=>{try{
    const s=await snapshot(),w=window.open('','_blank','noopener,noreferrer,width=960,height=800');if(!w){notify('Autorisez les fenêtres contextuelles pour imprimer.');return;}
    const financial=s.financial&&isManager()?'<h2>Situation financière canonique</h2><p>Caisse : <strong>'+esc(money(s.financial.cashBalance))+'</strong> · écritures : '+esc(s.financial.entryCount)+' · reçus : '+esc(s.financial.receiptCount)+'</p>':'';
    const rubrics=s.rubrics.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.kind)+'</td><td>'+esc(x.direction)+'</td></tr>').join('');
    const meetings=s.meetings.map(x=>'<tr><td>'+esc(x.title)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.at?new Date(x.at).toLocaleString('fr-FR'):'—')+'</td></tr>').join('');
    w.document.write('<!doctype html><meta charset="utf-8"><title>Eco-System · '+esc(s.group.name)+'</title><style>body{font-family:system-ui,sans-serif;max-width:980px;margin:30px auto;padding:0 20px;line-height:1.45}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:7px;text-align:left}small{color:#555}@media print{button{display:none}}</style><h1>'+esc(s.group.name)+'</h1><p>'+esc(s.group.kind)+' · '+esc(s.group.status)+'</p><p>'+esc(s.counts.members)+' membre(s) actif(s) · '+esc(s.counts.rubrics)+' rubrique(s) · '+esc(s.counts.meetings)+' séance(s)</p>'+financial+'<h2>Rubriques actives</h2><table><tr><th>Rubrique</th><th>Type</th><th>Sens</th></tr>'+rubrics+'</table><h2>Séances</h2><table><tr><th>Séance</th><th>État</th><th>Date</th></tr>'+meetings+'</table><p><small>Généré par Eco-System le '+esc(new Date(s.generatedAt).toLocaleString('fr-FR'))+'. Projection imprimable : aucune écriture financière n’est créée par cette impression.</small></p><button onclick="print()">Imprimer / Enregistrer en PDF</button>');
    w.document.close();notify('État imprimable préparé depuis les données canoniques.');
  }catch(e){showError(e);}})();
  document.addEventListener('eco:group-context-changed',()=>void render());
  void render();
  return{refresh:render};
}
