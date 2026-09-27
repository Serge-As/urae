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

  const controls=el('form',undefined,'form-grid');controls.id='paperPrintForm';
  const kindLabel=el('label','Document'),kind=document.createElement('select');kind.name='kind';kindLabel.append(kind);
  const meetingLabel=el('label','Séance'),meetingSelect=document.createElement('select');meetingSelect.name='meeting';meetingLabel.append(meetingSelect);
  const memberLabel=el('label','Membre'),memberSelect=document.createElement('select');memberSelect.name='member';memberLabel.append(memberSelect);
  const previewBtn=el('button','Prévisualiser','secondary');previewBtn.type='submit';
  const printBtn=el('button','Imprimer / Enregistrer en PDF','primary');printBtn.type='button';
  controls.append(kindLabel,meetingLabel,memberLabel,previewBtn,printBtn);panel.append(controls);
  const quick=el('div',undefined,'actions'),printGroup=el('button','Imprimer cet état du groupe','link-btn');printGroup.type='button';quick.append(printGroup);panel.append(quick);
  const preview=el('div',undefined,'stack');panel.append(preview);host.append(panel);

  const group=()=>getGroups().find(g=>g.id===app.activeGroup());
  const activeMembers=()=>getMembers().filter(x=>x.status==='active');
  const visibleMembers=()=>isManager()?activeMembers():activeMembers().filter(x=>x.userId===app.currentActor());
  const currentMeeting=()=>getMeetings().find(x=>x.id===meetingSelect.value);
  const currentMember=()=>visibleMembers().find(x=>x.id===memberSelect.value);

  const refill=()=>{
    const prevKind=kind.value,prevMeeting=meetingSelect.value,prevMember=memberSelect.value;kind.replaceChildren();
    const options=[['GROUP_STATE','État général du groupe'],['MEMBER_SHEET','Fiche individuelle']];
    if(isManager())options.push(['SESSION_SHEET','Feuille de séance'],['ATTENDANCE_SHEET','Émargement / présences'],['ROLE_REGISTER','Registre par rôle'],['MEMBER_CARDS','Cartes membres']);
    for(const [v,l] of options)kind.append(new Option(l,v));if(options.some(([v])=>v===prevKind))kind.value=prevKind;
    meetingSelect.replaceChildren(new Option('Choisir une séance',''));for(const m of [...getMeetings()].sort((a,b)=>String(b.scheduledAt??b.openedAt??'').localeCompare(String(a.scheduledAt??a.openedAt??''))))meetingSelect.append(new Option((m.title??'Séance')+' · '+new Date(m.scheduledAt??m.openedAt).toLocaleDateString('fr-FR'),m.id));if(getMeetings().some(m=>m.id===prevMeeting))meetingSelect.value=prevMeeting;
    memberSelect.replaceChildren(new Option('Choisir un membre',''));for(const m of visibleMembers())memberSelect.append(new Option(m.displayName,m.id));if(visibleMembers().some(m=>m.id===prevMember))memberSelect.value=prevMember;else if(visibleMembers().length===1)memberSelect.value=visibleMembers()[0].id;
    const k=kind.value;meetingLabel.hidden=!['SESSION_SHEET','ATTENDANCE_SHEET'].includes(k);memberLabel.hidden=k!=='MEMBER_SHEET';
  };

  const snapshot=async()=>{
    const g=group();if(!g)throw Error('ACTIVE_GROUP_REQUIRED');const ledger=isManager()?await app.ledger().catch(()=>null):null;
    return buildPrintSnapshot({group:g,members:getMembers(),meetings:getMeetings(),rubrics:getRubrics(),ledger});
  };
  const dataFor=async(k)=>{
    const g=group();if(!g)throw Error('ACTIVE_GROUP_REQUIRED');
    if(k==='GROUP_STATE')return snapshot();
    if(k==='MEMBER_SHEET'){
      const member=currentMember();if(!member)throw Error('MEMBERSHIP_REQUIRED');
      if(!isManager()&&member.userId!==app.currentActor())throw Error('FORBIDDEN_SCOPE');
      const statement=await app.memberStatement(member.id);return buildMemberPrintSheet({group:g,member,statement,rubrics:getRubrics(),meetings:getMeetings()});
    }
    if(!isManager())throw Error('MANAGER_REQUIRED');
    if(k==='SESSION_SHEET'){const meeting=currentMeeting();if(!meeting)throw Error('MEETING_REQUIRED');return buildSessionPrintSheet({group:g,meeting,members:getMembers(),rubrics:getRubrics(),ledger:await app.ledger()});}
    if(k==='ATTENDANCE_SHEET'){const meeting=currentMeeting();if(!meeting)throw Error('MEETING_REQUIRED');return buildAttendancePrintSheet({group:g,meeting,members:getMembers(),attendance:await app.meetingAttendance(meeting.id)});}
    if(k==='ROLE_REGISTER')return buildRoleRegister({group:g,members:getMembers()});
    if(k==='MEMBER_CARDS')return buildMemberCards({group:g,members:getMembers()});
    throw Error('PRINT_KIND_UNSUPPORTED');
  };

  const baseCss='<style>body{font-family:system-ui,sans-serif;max-width:1200px;margin:22px auto;padding:0 18px;line-height:1.35;color:#111}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #999;padding:5px;text-align:left;vertical-align:top}th{background:#eee}.num{text-align:right}.muted{color:#555}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.member-card{border:1px solid #555;padding:14px;min-height:105px;break-inside:avoid}.signature{height:28px;min-width:100px}button{margin-top:20px}@page{margin:12mm}@media print{button{display:none}.landscape{page:landscape}}</style>';
  const header=d=>'<h1>'+esc(d.group?.name??'Eco-System')+'</h1><p class="muted">Lot '+esc(d.lot??'—')+' · généré le '+esc(new Date(d.generatedAt??Date.now()).toLocaleString('fr-FR'))+' · projection canonique, aucune écriture créée par l’impression.</p>';
  const htmlFor=(k,d)=>{
    if(k==='GROUP_STATE'){
      const financial=d.financial&&isManager()?'<h2>Situation financière canonique</h2><p>Caisse : <strong>'+esc(money(d.financial.cashBalance))+'</strong> · écritures : '+esc(d.financial.entryCount)+' · reçus : '+esc(d.financial.receiptCount)+'</p>':'';
      const rubrics=d.rubrics.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.kind)+'</td><td>'+esc(x.direction)+'</td></tr>').join(''),meetings=d.meetings.map(x=>'<tr><td>'+esc(x.title)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.at?new Date(x.at).toLocaleString('fr-FR'):'—')+'</td></tr>').join('');
      return header({...d,lot:printLot()})+'<p>'+esc(d.group.kind)+' · '+esc(d.group.status)+'</p><p>'+esc(d.counts.members)+' membre(s) actif(s) · '+esc(d.counts.rubrics)+' rubrique(s) · '+esc(d.counts.meetings)+' séance(s)</p>'+financial+'<h2>Rubriques actives</h2><table><tr><th>Rubrique</th><th>Type</th><th>Sens</th></tr>'+rubrics+'</table><h2>Séances</h2><table><tr><th>Séance</th><th>État</th><th>Date</th></tr>'+meetings+'</table>';
    }
    if(k==='SESSION_SHEET'){
      const head='<tr><th>Membre</th>'+d.rubrics.map(r=>'<th>'+esc(r.name)+'</th>').join('')+'<th>Total</th></tr>',rows=d.rows.map(r=>'<tr><td>'+esc(r.displayName)+'</td>'+r.cells.map(v=>'<td class="num">'+esc(v?money(v):'—')+'</td>').join('')+'<td class="num"><strong>'+esc(money(r.total))+'</strong></td></tr>').join(''),totals='<tr><th>Totaux</th>'+d.columnTotals.map(v=>'<th class="num">'+esc(money(v))+'</th>').join('')+'<th class="num">'+esc(money(d.grandTotal))+'</th></tr>';
      return '<div class="landscape">'+header(d)+'<h2>'+esc(d.meeting.title)+' · Feuille de séance</h2><p>'+esc(d.meeting.status)+' · '+esc(d.meeting.at?new Date(d.meeting.at).toLocaleString('fr-FR'):'')+'</p><table>'+head+rows+totals+'</table></div>';
    }
    if(k==='MEMBER_SHEET'){
      const totals=d.byRubric.map(x=>'<tr><td>'+esc(x.rubricName)+'</td><td class="num">'+esc(money(x.total))+'</td></tr>').join(''),receipts=d.receipts.map(x=>'<tr><td>'+esc(x.meetingName)+'</td><td>'+esc(x.rubricName)+'</td><td class="num">'+esc(money(x.netAmount))+'</td><td>'+esc(new Date(x.receivedAt).toLocaleDateString('fr-FR'))+'</td></tr>').join('');
      return header(d)+'<h2>Fiche individuelle · '+esc(d.member.displayName)+'</h2><p><strong>Total net : '+esc(money(d.totalNet))+'</strong></p><h3>Totaux par rubrique</h3><table><tr><th>Rubrique</th><th>Total</th></tr>'+totals+'</table><h3>Historique</h3><table><tr><th>Séance</th><th>Rubrique</th><th>Montant</th><th>Date</th></tr>'+receipts+'</table><p class="muted">Cette fiche ne contient aucune donnée financière d’un autre membre.</p>';
    }
    if(k==='ATTENDANCE_SHEET'){
      const rows=d.rows.map(x=>'<tr><td>'+esc(x.displayName)+'</td><td>'+esc(x.attendance||'—')+'</td><td>'+esc(x.note||'')+'</td><td class="signature"></td></tr>').join('');
      return header(d)+'<h2>'+esc(d.meeting.title)+' · Émargement / présences</h2><table><tr><th>Membre</th><th>Présence</th><th>Observation</th><th>Signature / émargement</th></tr>'+rows+'</table>';
    }
    if(k==='ROLE_REGISTER'){
      const rows=d.rows.map(x=>'<tr><td>'+esc(x.role)+'</td><td>'+esc(x.displayName)+'</td><td>'+esc(x.membershipId)+'</td></tr>').join('');
      return header(d)+'<h2>Registre par rôle</h2><table><tr><th>Rôle</th><th>Membre</th><th>Référence adhésion</th></tr>'+rows+'</table>';
    }
    if(k==='MEMBER_CARDS'){
      const cards=d.cards.map(x=>'<article class="member-card"><strong>'+esc(x.displayName)+'</strong><p>'+esc(d.group.name)+'</p><p>Réf. '+esc(x.membershipId)+'</p><p>Rôle(s) : '+esc(x.roles.join(', ')||'membre')+'</p><small>Aucun contact privé ni pièce d’identité imprimé automatiquement.</small></article>').join('');
      return header(d)+'<h2>Cartes membres</h2><div class="cards">'+cards+'</div>';
    }
    throw Error('PRINT_KIND_UNSUPPORTED');
  };
  const openPrint=async(k)=>{
    const d=await dataFor(k),w=window.open('','_blank','noopener,noreferrer,width=1100,height=850');if(!w){notify('Autorisez les fenêtres contextuelles pour imprimer.');return;}
    w.document.write('<!doctype html><meta charset="utf-8"><title>Eco-System · impression</title>'+baseCss+htmlFor(k,d)+'<button onclick="print()">Imprimer / Enregistrer en PDF</button>');w.document.close();notify('Document imprimable préparé depuis les données canoniques.');
  };
  const render=async()=>{
    refill();preview.replaceChildren();if(!app.activeGroup()){preview.append(el('p','Sélectionnez un groupe pour préparer une impression.','empty-state'));return;}
    try{
      const k=kind.value,d=await dataFor(k),card=el('article',undefined,'item');card.append(el('strong',kind.options[kind.selectedIndex]?.textContent??k));
      if(d.lot)card.append(el('p','Lot '+d.lot,'hint'));
      if(k==='GROUP_STATE')card.append(el('p',d.counts.members+' membre(s) actif(s) · '+d.counts.rubrics+' rubrique(s) · '+d.counts.meetings+' séance(s)','hint'));
      if(k==='SESSION_SHEET')card.append(el('p',d.rows.length+' membre(s) × '+d.rubrics.length+' rubrique(s) · total '+money(d.grandTotal),'hint'));
      if(k==='MEMBER_SHEET')card.append(el('p',d.member.displayName+' · total net '+money(d.totalNet),'hint'));
      if(k==='ATTENDANCE_SHEET')card.append(el('p',d.rows.length+' ligne(s) d’émargement avec colonne signature.','hint'));
      if(k==='ROLE_REGISTER')card.append(el('p',d.rows.length+' affectation(s) de rôle.','hint'));
      if(k==='MEMBER_CARDS')card.append(el('p',d.cards.length+' carte(s), sans contact privé ni pièce d’identité.','hint'));
      preview.append(card);
    }catch(e){preview.append(el('p',String(e?.message??e),'hint'));}
  };
  kind.onchange=()=>{refill();void render();};meetingSelect.onchange=()=>void render();memberSelect.onchange=()=>void render();
  controls.onsubmit=e=>{e.preventDefault();void render();};
  printBtn.onclick=()=>void openPrint(kind.value).catch(showError);
  printGroup.onclick=()=>void openPrint('GROUP_STATE').catch(showError);
  document.addEventListener('eco:group-context-changed',()=>void render());void render();return{refresh:render};
}
