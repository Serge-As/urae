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

export function mountPrintCenterUI({app,getGroups=()=>[],getMembers=()=>[],getMeetings=()=>[],getRubrics=()=>[],isManager=()=>false,notify=()=>{},showError=()=>{}}={}){
  const host=document.querySelector('#view-documents');if(!host||document.querySelector('#paperPrintCenter'))return{refresh:async()=>{}};
  const panel=el('section',undefined,'panel');panel.id='paperPrintCenter';
  panel.append(el('div','Paper Bridge · Print','eyebrow'),el('h2','Centre d’impression'),el('p','Les documents imprimés sont des projections des données canoniques. Ils ne créent aucune nouvelle écriture financière.','truth-notice'));
  const actions=el('div',undefined,'actions'),printGroup=el('button','Imprimer l’état du groupe','primary');printGroup.type='button';actions.append(printGroup);panel.append(actions);
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
