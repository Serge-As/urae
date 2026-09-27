const node=(tag,text,className)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);if(className)x.className=className;return x;};
const stateOf=r=>String(r?.data?.completionState??'');
const versionOf=r=>Number(r?.data?.completionVersion??1);

export function mountDataQualityUI({app,navigate,notify=()=>{},showError=()=>{}}={}){
  const hardening=document.querySelector('#hardeningHub');if(!hardening||document.querySelector('#dataQualityCenter'))return{refresh:async()=>{}};
  const panel=node('section',undefined,'panel');panel.id='dataQualityCenter';
  const head=node('div',undefined,'section-kicker'),copy=node('div');copy.append(node('span','Cohérence & preuve','eyebrow'),node('h2','Qualité des données'),node('p','Détecte les anomalies du Ledger sans modifier les écritures, suit les conflits et calcule un passeport de préparation du groupe. Toute résolution reste explicite et auditée.'));head.append(copy);panel.append(head);
  const actions=node('div',undefined,'actions'),scan=node('button','Scanner les anomalies','primary'),readiness=node('button','Calculer la préparation','secondary'),openLab=node('button','Ouvrir les workflows qualité','link-btn');for(const b of [scan,readiness,openLab])b.type='button';actions.append(scan,readiness,openLab);panel.append(actions);
  const metrics=node('div',undefined,'metrics small'),list=node('div',undefined,'stack');panel.append(metrics,list);hardening.closest('section.panel')?.insertAdjacentElement('beforebegin',panel);

  const openKind=kind=>{navigate?.('services',{anchor:'completionPanel',force:true});setTimeout(()=>{const select=document.querySelector('#completionKind');if(select){select.value=kind;select.dispatchEvent(new Event('change',{bubbles:true}));select.scrollIntoView({behavior:'smooth',block:'center'});}},80);};
  openLab.onclick=()=>openKind('ANOMALY');

  const refresh=async()=>{
    metrics.replaceChildren();list.replaceChildren();
    if(!app.activeGroup()){list.append(node('p','Sélectionnez un groupe pour auditer sa qualité de données.','empty-state'));return;}
    try{
      const [anomalies,conflicts,passports,expectations]=await Promise.all([
        app.listCompletion('ANOMALY'),app.listCompletion('CONFLICT'),app.listCompletion('READINESS_PASSPORT'),app.listCompletion('EXPECTATION_TRACE')
      ]);
      const unresolved=anomalies.filter(x=>!['RESOLVED','DISMISSED'].includes(stateOf(x))),openConflicts=conflicts.filter(x=>!['RESOLVED','REJECTED'].includes(stateOf(x))),latest=[...passports].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
      for(const [label,value] of [['Anomalies ouvertes',unresolved.length],['Conflits ouverts',openConflicts.length],['Attentes tracées',expectations.length],['Préparation',latest?(latest.data?.ready===true?'Prêt':'À compléter'):'Non calculée']]){const m=node('article',undefined,'metric');m.append(node('span',label),node('strong',value));metrics.append(m);}
      const all=[...unresolved.map(x=>({kind:'ANOMALY',r:x})),...openConflicts.map(x=>({kind:'CONFLICT',r:x}))];
      if(!all.length)list.append(node('p','Aucune anomalie ni conflit ouvert enregistré.','empty-state'));
      for(const {kind,r} of all){const card=node('article',undefined,'item');card.append(node('strong',r.title),node('small',kind+' · '+stateOf(r)));if(r.summary)card.append(node('p',r.summary,'hint'));const acts=node('div',undefined,'actions');
        if(kind==='ANOMALY'&&stateOf(r)==='OPEN'){const explain=node('button','Marquer expliquée','secondary');explain.type='button';explain.onclick=()=>void app.transitionCompletion(r.id,'EXPLAINED',versionOf(r),{},'Explication confirmée par un responsable').then(refresh).catch(showError);acts.append(explain);}
        if(kind==='ANOMALY'&&['OPEN','EXPLAINED'].includes(stateOf(r))){const resolve=node('button','Résoudre avec validation','primary');resolve.type='button';resolve.onclick=()=>void app.transitionCompletion(r.id,'RESOLVED',versionOf(r),{resolvedAt:new Date().toISOString()},'Résolution explicitement validée').then(refresh).catch(showError);acts.append(resolve);}
        const open=node('button','Ouvrir le workflow','link-btn');open.type='button';open.onclick=()=>openKind(kind);acts.append(open);card.append(acts);list.append(card);}
    }catch(error){list.append(node('p','Audit qualité indisponible : '+String(error?.message??error),'hint'));}
  };

  scan.onclick=()=>void(async()=>{try{
    const raw=await app.ledgerAnomalies(),existing=await app.listCompletion('ANOMALY');
    const keys=new Set(existing.map(x=>String(x.data?.anomalyKey??'')));
    let created=0;
    for(const a of raw){const key=[a.code,a.entryId??'',a.details].join('|');if(keys.has(key))continue;await app.createCompletion('ANOMALY',{title:'Anomalie Ledger · '+a.code,summary:a.details,data:{anomalyKey:key,code:a.code,entryId:a.entryId??'',detectedAt:new Date().toISOString()},tags:['auto-scan','ledger-anomaly']});created++;}
    notify(created?created+' anomalie(s) ajoutée(s) au suivi.':'Scan terminé : aucune nouvelle anomalie.');
    await refresh();
  }catch(error){showError(error);}})();

  readiness.onclick=()=>void(async()=>{try{const r=await app.createReadinessPassport();notify(r.data?.ready===true?'Passeport : groupe prêt.':'Passeport : éléments à compléter.');await refresh();}catch(error){showError(error);}})();
  document.addEventListener('eco:group-context-changed',()=>void refresh());
  return{refresh,openKind};
}
