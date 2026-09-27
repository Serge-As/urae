const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const parse=(v,f=[])=>{try{return JSON.parse(String(v??''));}catch{return f;}};
const money=n=>Number(n??0).toLocaleString('fr-FR')+' XAF';

export function mountStarterKitUI({app,notify=()=>{},showError=()=>{}}={}){
  const host=document.querySelector('#view-launch');if(!host||document.querySelector('#savedStarterKitPanel'))return{refresh:async()=>{},open:()=>{}};
  const root=el('section',undefined,'panel');root.id='savedStarterKitPanel';
  root.append(el('div','Owner canonique · RUBRIC.STARTER_KITS','eyebrow'),el('h2','Kit prêt à l’emploi du groupe'),el('p','Ce panneau relit le Kit archivé lors de la création. Il n’invente aucune valeur et ne recalcule pas le Ledger.','truth-notice'));
  const actions=el('div',undefined,'actions'),refreshBtn=el('button','Actualiser le Kit','secondary');refreshBtn.type='button';const printBtn=el('button','Imprimer / enregistrer en PDF','primary');printBtn.type='button';actions.append(refreshBtn,printBtn);root.append(actions);
  const body=el('div',undefined,'stack');root.append(body);document.querySelector('#launchHub')?.closest('section.panel')?.insertAdjacentElement('afterend',root);
  let current=null;
  const section=(title,items)=>{const d=document.createElement('details');d.open=true;d.append(el('summary',title));const box=el('div',undefined,'stack');for(const x of items)box.append(el('p',x,'hint'));d.append(box);return d;};
  const render=record=>{
    body.replaceChildren();current=record;if(!record){body.append(el('p','Aucun Kit archivé pour le groupe actif. Créez ou intégrez le groupe via le Studio guidé pour générer son pack réel.','empty-state'));printBtn.disabled=true;return;}
    printBtn.disabled=false;const d=record.data??{};
    const metrics=el('div',undefined,'metrics small');for(const [label,value] of [['Membres',d.members],['Séances',d.sessions],['Volume simulé',money(d.monetaryVolume)],['Marge indicative',money(d.estimatedMargin)]]){const m=el('article',undefined,'metric');m.append(el('span',label),el('strong',value));metrics.append(m);}body.append(metrics);
    const model=el('article',undefined,'item');model.append(el('strong','Modèle recommandé — à valider'),el('p',d.recommendedModel||'—'),el('p','Ordre / tirage : '+String(d.orderPolicy||'—'),'hint'));body.append(model);
    const rubrics=parse(d.rubricRowsJson,[]);const rt=document.createElement('table');rt.className='meeting-matrix';rt.innerHTML='<thead><tr><th>Rubrique</th><th>Mode</th><th>Participation</th><th>Montant</th><th>Volume cycle</th><th>Frais gestion</th></tr></thead>';const tb=document.createElement('tbody');for(const r of rubrics){const tr=document.createElement('tr');for(const v of [r.name,r.mode,r.participation,r.amount?money(r.amount):'—',money(r.nominalCycle),money(r.fees)])tr.append(el('td',v));tb.append(tr);}rt.append(tb);const rd=document.createElement('details');rd.open=true;rd.append(el('summary','Rubriques & chiffrage'),rt);body.append(rd);
    const checklist=parse(d.checklistJson,[]).map(x=>Array.isArray(x)?'['+x[0]+'] '+x[1]:String(x));body.append(section('Checklist de lancement',checklist));
    const cal=parse(d.calendarJson,[]).map(x=>(x.label??('# '+x.index))+' · '+(x.date??'—'));body.append(section('Calendrier',cal));
    body.append(section('Risques / décisions à compléter',parse(d.risksJson,[])));
    body.append(section('Règlement / règles à adapter',parse(d.rulesJson,[])));
    body.append(section('Conseils de démarrage',parse(d.adviceJson,[])));
    const templates=document.createElement('details');templates.open=true;templates.append(el('summary','Invitation & modèle de PV'));const inv=document.createElement('textarea');inv.readOnly=true;inv.rows=5;inv.value=String(d.invitation??'');const pv=document.createElement('textarea');pv.readOnly=true;pv.rows=10;pv.value=String(d.minutes??'');templates.append(inv,pv);body.append(templates);
    const truth=el('p','Version Kit '+String(d.kitVersion??'—')+' · généré '+(d.generatedAt?new Date(String(d.generatedAt)).toLocaleString('fr-FR'):'—')+' · données source conservées dans le pack archivé.','truth-notice');body.append(truth);
  };
  const refresh=async()=>{if(!app.activeGroup()){render(null);return;}try{render(await app.starterKit());}catch(e){showError(e);body.replaceChildren(el('p','Kit indisponible : '+String(e?.message??e),'hint'));}};
  refreshBtn.onclick=()=>void refresh();
  printBtn.onclick=()=>{if(!current)return;const w=window.open('','_blank','noopener,noreferrer,width=1000,height=800');if(!w){notify('Autorisez les fenêtres contextuelles pour imprimer le Kit.');return;}const clone=body.cloneNode(true);w.document.write('<!doctype html><meta charset="utf-8"><title>Kit Eco-System</title><style>body{font-family:system-ui,sans-serif;max-width:1000px;margin:30px auto;padding:0 20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:6px;text-align:left}textarea{width:100%;box-sizing:border-box}</style><h1>Kit prêt à l’emploi</h1>'+clone.innerHTML+'<button onclick="print()">Imprimer / PDF</button>');w.document.close();};
  document.addEventListener('eco:group-context-changed',()=>void refresh());
  return{refresh,open:()=>{root.scrollIntoView({behavior:'smooth',block:'start'});void refresh();}};
}
