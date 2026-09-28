const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const money=n=>Number(n??0).toLocaleString('fr-FR')+' XAF';

export function mountMemberEnvelopeUI({app,notify=()=>{},showError=()=>{}}={}){
  const host=document.querySelector('#view-dashboard');if(!host||document.getElementById('memberEnvelopeCenter'))return{refresh:async()=>{},open:()=>{}};
  const root=el('details',undefined,'panel');root.id='memberEnvelopeCenter';root.append(el('summary','Mon enveloppe de séance'));
  root.append(el('p','Après « 2 · Diffuser aux membres », cette enveloppe contient uniquement votre propre situation : saisies de séance, total personnel, dettes de prêt, obligations et états de réserve. Elle ne contient aucune donnée financière des autres membres.','truth-notice'));
  const form=document.createElement('form');form.className='inline-form';const select=document.createElement('select');select.name='meeting';const btn=el('button','Afficher mon enveloppe','primary');btn.type='submit';form.append(select,btn);
  const status=el('p','', 'hint'),body=el('div',undefined,'stack');root.append(form,status,body);
  const anchor=document.getElementById('walletCenter')??document.getElementById('personalCockpitPanel');anchor?.insertAdjacentElement('afterend',root);

  let meetings=[];
  const currentMembership=async()=>{const members=await app.listMembers();return members.find(m=>m.userId===app.currentActor())??null;};
  const fillMeetings=async(preferred)=>{
    meetings=await app.listMeetings().catch(()=>[]);select.replaceChildren();
    for(const m of [...meetings].sort((a,b)=>String(b.scheduledAt??b.openedAt).localeCompare(String(a.scheduledAt??a.openedAt)))){
      const o=document.createElement('option');o.value=m.id;o.textContent=(m.title||'Séance')+' · '+new Date(m.scheduledAt??m.openedAt).toLocaleString('fr-FR');if(preferred===m.id)o.selected=true;select.append(o);
    }
  };
  const envelopeFromCapsule=capsule=>{
    if(!capsule?.projection)return null;const p=capsule.projection,meeting=p.meeting??null,receipts=p.receipts??[];
    return{fingerprint:capsule.projectionDigest??'',expiresAt:capsule.expiresAt,projection:{meeting:meeting??{id:'offline',title:'Dernière projection reçue',status:'offline'},meetingReceipts:receipts.map(r=>({...r,late:Boolean(r.late??false)})),meetingNet:receipts.reduce((n,r)=>n+Number(r.netAmount??0),0),statementTotal:Number(p.statementTotal??0),loanDebts:p.loanDebts??[],obligations:p.obligations??[],notices:p.notices??[]},offlineCapsule:true,projectionVersion:Number(capsule.projectionVersion??0)};
  };
  const render=env=>{
    body.replaceChildren();status.textContent=(env.offlineCapsule?'Projection locale v'+env.projectionVersion+' · ':'Empreinte : '+String(env.fingerprint??'').slice(0,16)+'… · ')+(env.expiresAt?'valable jusqu’au '+new Date(env.expiresAt).toLocaleString('fr-FR'):'');
    const summary=el('article',undefined,'item');summary.append(el('strong',env.projection.meeting.title),el('p','Cette séance : '+money(env.projection.meetingNet)+' · total personnel : '+money(env.projection.statementTotal),'hint'));body.append(summary);
    const receipts=el('article',undefined,'item');receipts.append(el('strong','Saisies de cette séance'));
    if(!env.projection.meetingReceipts?.length)receipts.append(el('p','Aucune saisie financière personnelle dans cette séance.','empty-state'));
    for(const r of env.projection.meetingReceipts??[])receipts.append(el('p',r.rubricName+' · '+money(r.netAmount)+(r.late?' · après clôture':''),'hint'));body.append(receipts);
    const debts=el('article',undefined,'item');debts.append(el('strong','Prêts / dettes'));
    if(!env.projection.loanDebts?.length)debts.append(el('p','Aucune dette de prêt active.','empty-state'));
    for(const d of env.projection.loanDebts??[])debts.append(el('p',d.title+' · capital '+money(d.principal)+' · intérêts '+money(d.interest)+' · dette totale '+money(d.totalDebt),'hint'));body.append(debts);
    const obligations=el('article',undefined,'item');obligations.append(el('strong','Obligations en cours'));
    if(!env.projection.obligations?.length)obligations.append(el('p','Aucune obligation ouverte.','empty-state'));
    for(const o of env.projection.obligations??[])obligations.append(el('p',o.title+(o.amount!==undefined?' · '+money(o.amount):'')+(o.dueAt?' · échéance '+new Date(o.dueAt).toLocaleDateString('fr-FR'):''),'hint'));body.append(obligations);
    const notices=el('article',undefined,'item');notices.append(el('strong','Contrôle membre'));
    if(!env.projection.notices?.length)notices.append(el('p','Aucun avis de contrôle lié à cette séance.','empty-state'));
    for(const n of env.projection.notices??[])notices.append(el('p',n.operationType+' · '+money(n.amount)+' · '+n.memberState+' · '+n.disputeState,'hint'));body.append(notices);
    body.append(el('p','Confidentialité : autres membres = non · contacts = non · pièces d’identité = non · audit brut = non.','truth-notice'));
  };
  const load=async(meetingId)=>{
    if(!meetingId)return;body.replaceChildren(el('p','Chargement…','hint'));
    try{const env=await app.memberEnvelope(meetingId);render(env);return;}catch(serverError){
      try{const membership=await currentMembership(),capsule=membership?await app.receivedMemberCapsule(membership.id):undefined,local=envelopeFromCapsule(capsule);if(local&&(!local.projection.meeting?.id||local.projection.meeting.id===meetingId)){render(local);return;}}catch{}
      body.replaceChildren();status.textContent='';showError(serverError);body.append(el('p',String(serverError?.message??serverError)==='MEMBER_DISTRIBUTION_NOT_READY'?'Cette séance n’a pas encore été diffusée aux membres.':'Enveloppe indisponible : '+String(serverError?.message??serverError),'hint'));
    }
  };
  const refresh=async(preferred)=>{await fillMeetings(preferred);if(select.value)await load(select.value);};
  form.onsubmit=e=>{e.preventDefault();void load(select.value);};
  root.addEventListener('toggle',()=>{if(root.open)void refresh();});
  window.addEventListener('eco:member-capsule-updated',e=>{
    const detail=e.detail??{};notify('Votre projection personnelle hors connexion a été mise à jour.');
    if(root.open){const meetingId=select.value;void load(meetingId);}
  });
  window.addEventListener('eco:live-event',e=>{
    const ev=e.detail;if(ev?.type!=='MEMBER_ENVELOPE_READY')return;
    const meetingId=String(ev.payload?.meetingId??'');if(!meetingId)return;
    notify('Votre enveloppe de séance est prête.');
    void (async()=>{await fillMeetings(meetingId);if(root.open)await load(meetingId);})();
  });
  document.addEventListener('eco:group-context-changed',()=>{body.replaceChildren();status.textContent='';if(root.open)void fillMeetings();});
  return{refresh,open:(meetingId)=>{root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});void refresh(meetingId);}};
}
