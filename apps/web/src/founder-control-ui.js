const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const v=id=>String(document.getElementById(id)?.value??'').trim();

export function mountFounderControlUI({app,notify=()=>{},showError=console.error}){
  const nav=document.getElementById('founderControlNavBtn'),root=document.getElementById('founderControlRoot');
  const metrics=document.getElementById('controlMetrics'),services=document.getElementById('controlServices'),complaints=document.getElementById('controlComplaints'),incidents=document.getElementById('controlIncidents'),content=document.getElementById('controlContent'),meta=document.getElementById('controlMeta');
  if(!nav||!root||!metrics||!services||!complaints||!incidents||!content||!meta)return{refresh:async()=>false};
  let authorized=false,last=null;
  const pill=(text,kind='')=>el('span',text,'pill '+kind);
  const metric=(n,label)=>{const d=el('div',undefined,'metric');d.append(el('strong',String(n)),el('span',label));return d;};
  const button=(label,fn,cls='secondary')=>{const b=el('button',label,cls);b.type='button';b.onclick=()=>void fn();return b;};

  const render=async()=>{
    let snap;
    try{snap=await app.founderControl();authorized=true;nav.hidden=false;root.hidden=false;}
    catch(e){authorized=false;nav.hidden=true;root.hidden=true;return false;}
    last=snap;metrics.replaceChildren();services.replaceChildren();complaints.replaceChildren();incidents.replaceChildren();content.replaceChildren();
    metrics.append(metric(snap.platform.groups,'Groupes'),metric(snap.platform.memberships,'Adhésions'),metric(snap.platform.openComplaints,'Plaintes ouvertes'),metric(snap.capabilities.length,'Capacités supervisées'),metric(snap.incidents.filter(x=>!['RESOLVED','CLOSED'].includes(x.status)).length,'Incidents ouverts'),metric(snap.content.filter(x=>!['PUBLISHED','DONE','ARCHIVED'].includes(x.status)).length,'Contenus à traiter'));
    meta.textContent='Supervision automatique : '+snap.supervisionRule+' · actualisé '+new Date(snap.generatedAt).toLocaleString('fr-FR');

    const order={FAIL:0,DEGRADED:1,UNKNOWN:2,PASS:3};
    for(const c of [...snap.capabilities].sort((a,b)=>(order[a.health]??9)-(order[b.health]??9)||a.id.localeCompare(b.id))){
      const card=el('article',undefined,'item');card.append(el('strong',c.labelFr||c.id),pill(c.health,c.health==='FAIL'?'offline':c.health==='PASS'?'online':''),el('p',c.id+' · '+c.declaredStatus+' · lot '+c.lot,'hint'));
      if(c.healthNote)card.append(el('p',c.healthNote));
      const actions=el('div',undefined,'actions');
      for(const h of ['PASS','DEGRADED','FAIL'])actions.append(button(h,async()=>{const note=window.prompt('Observation de contrôle pour '+c.id+':',c.healthNote??'')??'';await app.markFounderCapabilityHealth(c.id,h,note);await render();},h==='PASS'?'secondary':'link-btn'));
      card.append(actions);services.append(card);
    }
    if(!snap.complaints.length)complaints.append(el('p','Aucune plainte ouverte détectée.','hint'));
    for(const c of snap.complaints){const card=el('article',undefined,'item');card.append(el('strong',c.summary||c.id),pill(c.status),el('p','Groupe '+(c.groupId??'—')+' · '+(c.openedAt?new Date(c.openedAt).toLocaleString('fr-FR'):'date inconnue'),'hint'));complaints.append(card);}
    if(!snap.incidents.length)incidents.append(el('p','Aucun incident de contrôle enregistré.','hint'));
    for(const x of snap.incidents){const card=el('article',undefined,'item');card.append(el('strong',x.title),pill(x.priority),pill(x.status),el('p',String(x.data?.note??''),'hint'));if(!['RESOLVED','CLOSED'].includes(x.status))card.append(button('Marquer résolu',async()=>{const note=window.prompt('Résolution :','Correctif qualifié et vérifié.')??'';await app.transitionFounderControlItem(x.id,'RESOLVED',note);await render();},'primary'));incidents.append(card);}
    if(!snap.content.length)content.append(el('p','Aucun article/texte de contrôle enregistré.','hint'));
    for(const x of snap.content){const card=el('article',undefined,'item');card.append(el('strong',x.title),pill(x.priority),pill(x.status),el('p',String(x.data?.kind??'ARTICLE')+' · '+String(x.data?.note??''),'hint'));if(x.status!=='PUBLISHED')card.append(button('Passer à la prochaine étape',async()=>{const next=x.status==='TODO'?'DRAFT':x.status==='DRAFT'?'NEEDS_REVIEW':x.status==='NEEDS_REVIEW'?'PUBLISHED':'DONE';await app.transitionFounderControlItem(x.id,next,'Progression depuis le Control Center');await render();},'secondary'));content.append(card);}
    return true;
  };

  document.getElementById('controlIncidentForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{await app.createFounderIncident({key:v('controlIncidentKey')||('incident-'+Date.now()),title:v('controlIncidentTitle'),priority:v('controlIncidentPriority'),source:v('controlIncidentSource')||'FOUNDER',note:v('controlIncidentNote')});notify('Incident ajouté au contrôle.');e.target.reset();await render();}catch(err){showError(err);}})();});
  document.getElementById('controlContentForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{await app.createFounderContentTask({key:v('controlContentKey')||('content-'+Date.now()),title:v('controlContentTitle'),status:'TODO',priority:v('controlContentPriority'),kind:v('controlContentKind')||'ARTICLE',url:v('controlContentUrl'),note:v('controlContentNote')});notify('Contenu ajouté au plan éditorial.');e.target.reset();await render();}catch(err){showError(err);}})();});
  document.getElementById('controlRefreshBtn')?.addEventListener('click',()=>void render().catch(showError));
  return{refresh:render,isAuthorized:()=>authorized,lastSnapshot:()=>last};
}
