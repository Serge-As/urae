import {OFFLINE_CAPABILITY_POLICIES}from'./offline-policies.generated.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function offlinePolicyDescription(policy){
  const p=String(policy).toLowerCase();return{
    read:/cached|snapshot|read|local|offline|queue/.test(p)?'Selon la copie disponible':'Non qualifiée',
    draft:/draft|local/.test(p)?'Préparation locale prévue':'Non qualifié',
    queue:/queue|outbox|intent|pending/.test(p)?'Intention en attente de confirmation':'Selon le parcours existant',
    confirmation:/local_only|^local$|deterministic/.test(p)?'Locale pour cette capacité':'Serveur requis pour l’état confirmé',
    policy
  };
}
export function mountRecoveryWorkspace({app,getGroups,getModules,navigate,tx,showError}){
  const settings=document.getElementById('view-settings');if(!settings)return{refresh:async()=>{}};
  const root=el('section',undefined,'panel eco-recovery-workspace');root.id='localRecoveryWorkspace';settings.prepend(root);let revision=0;
  const refresh=async()=>{
    const at=++revision,scope=JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]);root.replaceChildren();
    root.append(el('span',tx('CONTINUER EN CONFIANCE','CONTINUE WITH CONFIDENCE'),'eyebrow'),el('h2',tx('Mon appareil, mes copies et mes synchronisations','My device, copies and synchronization')));
    const group=getGroups().find(g=>g.id===app.activeGroup()),base='/api/v1/groups/'+encodeURIComponent(app.activeGroup()||'');
    const metadata=app.activeGroup()?await Promise.all(['/members','/meetings','/ledger','/rubrics'].map(path=>app.projectionMeta(base+path).catch(()=>null))):[];
    if(at!==revision||scope!==JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]))return;
    const status=el('div',undefined,'eco-recovery-summary');status.append(el('strong',group?.name||tx('Aucun groupe actif','No active group')),el('p',tx('Copie privée liée au compte connecté. Les montants en attente ne sont pas des confirmations serveur.','Private copy bound to this account. Pending amounts are not server confirmations.')));
    const pending=app.outboxItems().filter(x=>x.actorId===app.currentActor()&&x.tenantId===app.currentTenant()&&(!app.activeGroup()||x.payload?.groupId===app.activeGroup())&&!['CONFIRMED','CANCELLED'].includes(x.status));status.append(el('p',tx('Opérations en attente : ','Pending operations: ')+pending.length+' · '+tx('À résoudre : ','To resolve: ')+pending.filter(x=>x.status==='CONFLICT').length));
    const names=[tx('Membres','Members'),tx('Séances','Meetings'),tx('Ledger','Ledger'),tx('Rubriques','Categories')];metadata.forEach((meta,index)=>status.append(el('p',names[index]+' · '+(meta?.lastSyncedAt?new Date(meta.lastSyncedAt).toLocaleString():tx('Aucune copie serveur datée','No dated server copy'))+' · '+(meta?.availability||'UNAVAILABLE'))));
    const resume=el('button',tx('Ouvrir mes feuilles locales','Open local sheets'),'primary');resume.type='button';resume.disabled=!app.activeGroup();resume.onclick=()=>navigate('operations',{anchor:'twoSheetWorkspace',force:true});const offline=el('button',tx('Transmission et récupération hors ligne','Offline transfer and recovery'),'secondary');offline.type='button';offline.dataset.moduleOpen='OFFLINE.OUTBOX';const diagnostics=el('button',tx('Diagnostic sans données personnelles','Diagnostics without personal data'),'secondary');diagnostics.type='button';diagnostics.onclick=()=>window.dispatchEvent(new Event('eco:startup-diagnostics'));status.append(resume,offline,diagnostics);root.append(status);
    const details=el('details'),summary=el('summary',tx('Ce que chaque capacité permet hors ligne','Offline behavior of each capability'));details.append(summary,el('p',tx('Cette carte expose les politiques déclarées. Une copie doit exister sur cet appareil ; sa présence et sa fraîcheur ne sont jamais garanties par le seul nom d’un service. Les états non qualifiés restent signalés.','This map exposes declared policies. A copy must exist on this device; a service name does not guarantee its presence or freshness. Unqualified states remain explicit.'),'hint'));
    const search=el('input');search.type='search';search.placeholder=tx('Rechercher une capacité','Find a capability');search.setAttribute('aria-label',search.placeholder);details.append(search);const wrap=el('div',undefined,'matrix-wrap'),table=el('table'),head=el('thead'),hr=el('tr');for(const name of [tx('Capacité','Capability'),tx('Lecture','Read'),tx('Brouillon','Draft'),tx('Envoi','Send'),tx('Confirmation','Confirmation')]){const th=el('th',name);th.scope='col';hr.append(th);}head.append(hr);table.append(head);const body=el('tbody');
    for(const module of getModules()){const policy=offlinePolicyDescription(OFFLINE_CAPABILITY_POLICIES[module.id]||'NOT_QUALIFIED_SERVER_CONFIRMATION_REQUIRED'),tr=el('tr'),name=el('th'),open=el('button',module.labelFr||module.id,'link-btn');open.type='button';open.dataset.moduleOpen=module.id;name.scope='row';name.append(open,el('small',module.id+' · '+module.status));name.title=policy.policy;tr.dataset.search=(module.labelFr+' '+module.id).toLowerCase();tr.append(name);for(const key of ['read','draft','queue','confirmation'])tr.append(el('td',policy[key]));body.append(tr);}table.append(body);wrap.append(table);details.append(wrap);search.oninput=()=>{const q=search.value.toLowerCase();for(const row of body.rows)row.hidden=!row.dataset.search.includes(q);};root.append(details);
  };
  window.addEventListener('eco:open-local-recovery',()=>{navigate('settings',{anchor:root.id,force:true});void refresh().catch(showError);});
  return{refresh,clearForContext:()=>{revision++;root.replaceChildren();}};
}
