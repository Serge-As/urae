const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const option=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};

export function mountFounderControlUI({app,notify=()=>{},showError=console.error,date=x=>String(x)}){
  const nav=document.getElementById('founderControlNav'),view=document.getElementById('view-founder-control'),metrics=document.getElementById('founderControlMetrics'),servicesRoot=document.getElementById('founderServiceList'),issuesRoot=document.getElementById('founderIssueList'),editorialRoot=document.getElementById('founderEditorialList'),casesRoot=document.getElementById('founderUserCaseList'),issueForm=document.getElementById('founderIssueForm'),editorialForm=document.getElementById('founderEditorialForm');
  if(!nav||!view||!metrics||!servicesRoot||!issuesRoot||!editorialRoot||!casesRoot||!issueForm||!editorialForm)return{refresh:async()=>{},available:()=>false};
  let allowed=false,lastData=null,timer;
  const states=['NEW','TRIAGED','IN_PROGRESS','RESOLVED','VERIFIED','CLOSED'];

  const fillServiceSelect=(id,services)=>{
    const s=document.getElementById(id),prev=s.value;s.replaceChildren(option('','Non affecté / transversal'));
    for(const service of services)s.append(option(service.id,service.labelFr+' · '+service.id));
    if([...s.options].some(o=>o.value===prev))s.value=prev;
  };
  const renderMetrics=d=>{
    metrics.replaceChildren();
    const rows=[[d.totals.services,'Services supervisés'],[d.totals.pass,'PASS'],[d.totals.attention,'À surveiller'],[d.totals.fail,'Échec'],[d.totals.openIssues,'Incidents ouverts'],[d.totals.pendingEditorial,'Contenus à traiter'],[d.totals.openUserCases,'Plaintes/cas ouverts'],[d.totals.groups,'Groupes tenant']];
    for(const [n,label] of rows){const m=el('div',undefined,'metric');m.append(el('strong',String(n)),el('span',label));metrics.append(m);}
  };
  const renderServices=d=>{
    servicesRoot.replaceChildren();
    const sorted=[...d.services].sort((a,b)=>({FAIL:0,ATTENTION:1,UNKNOWN:2,PASS:3}[a.attention]-({FAIL:0,ATTENTION:1,UNKNOWN:2,PASS:3}[b.attention])||a.labelFr.localeCompare(b.labelFr));
    for(const s of sorted){
      const card=el('article',undefined,'item');card.dataset.serviceId=s.id;
      card.append(el('strong',s.labelFr),el('span',s.attention+' · '+s.catalogStatus,'pill'),el('p',s.id,'hint'));
      card.append(el('p',`Incidents ouverts : ${s.openIssues} · contenus à traiter : ${s.pendingEditorial} · supervision automatique : oui`));
      if(s.latestCheck)card.append(el('p',`Dernier contrôle : ${s.latestCheck.state} · ${s.latestCheck.source} · ${s.latestCheck.summary||'sans détail'} · ${date(s.latestCheck.checkedAt)}`,'hint'));
      const actions=el('div',undefined,'actions');
      for(const state of ['PASS','WARN','FAIL']){const b=el('button','Contrôle '+state,state==='FAIL'?'secondary':'link-btn');b.type='button';b.onclick=()=>void(async()=>{try{await app.recordFounderServiceCheck({serviceId:s.id,state,source:'founder-manual',summary:'Contrôle manuel depuis le cockpit Fondateur'});notify('Contrôle enregistré : '+state);await refresh();}catch(e){showError(e);}})();actions.append(b);}
      card.append(actions);servicesRoot.append(card);
    }
  };
  const renderIssues=d=>{
    issuesRoot.replaceChildren();
    if(!d.issues.length)issuesRoot.append(el('p','Aucun incident de contrôle enregistré.','hint'));
    for(const issue of d.issues){
      const card=el('article',undefined,'item');card.append(el('strong',issue.title),el('span',issue.severity+' · '+issue.state,'pill'),el('p',issue.summary),el('p',(issue.serviceId??'Transversal')+' · '+issue.source+' · '+date(issue.updatedAt),'hint'));
      if(issue.resolution)card.append(el('p','Résolution : '+issue.resolution,'truth-notice'));
      if(!['VERIFIED','CLOSED'].includes(issue.state)){
        const wrap=el('div',undefined,'form-grid'),select=el('select'),note=el('input');note.placeholder='Résolution / preuve si nécessaire';
        const allowed=issue.state==='NEW'?['TRIAGED','IN_PROGRESS','CLOSED']:issue.state==='TRIAGED'?['IN_PROGRESS','RESOLVED','CLOSED']:issue.state==='IN_PROGRESS'?['RESOLVED','CLOSED']:issue.state==='RESOLVED'?['IN_PROGRESS','VERIFIED','CLOSED']:['IN_PROGRESS','CLOSED'];
        for(const x of allowed)select.append(option(x,x));const b=el('button','Changer l’état','secondary');b.type='button';b.onclick=()=>void(async()=>{try{await app.transitionFounderIssue(issue.id,select.value,note.value);notify('Incident mis à jour.');await refresh();}catch(e){showError(e);}})();wrap.append(select,note,b);card.append(wrap);
      }
      issuesRoot.append(card);
    }
  };
  const renderEditorial=d=>{
    editorialRoot.replaceChildren();
    if(!d.editorial.length)editorialRoot.append(el('p','Aucun contenu éditorial suivi.','hint'));
    for(const item of d.editorial){
      const card=el('article',undefined,'item');card.append(el('strong',item.title),el('span',item.kind+' · '+item.state,'pill'),el('p',(item.serviceId??'Transversal')+(item.owner?' · '+item.owner:''),'hint'));if(item.notes)card.append(el('p',item.notes));
      if(item.state!=='PUBLISHED'){const actions=el('div',undefined,'actions');for(const state of ['DRAFT','REVIEW','NEEDS_FIX','READY','PUBLISHED']){const b=el('button',state,'link-btn');b.type='button';b.onclick=()=>void(async()=>{try{await app.transitionFounderEditorial(item.id,state);notify('Contenu : '+state);await refresh();}catch(e){showError(e);}})();actions.append(b);}card.append(actions);}
      editorialRoot.append(card);
    }
  };
  const renderCases=d=>{
    casesRoot.replaceChildren();if(!d.userCases.length)casesRoot.append(el('p','Aucune plainte/cas utilisateur ouvert dans ce tenant.','hint'));
    for(const c of d.userCases){const card=el('article',undefined,'item');card.append(el('strong',c.summary),el('span',c.status,'pill'),el('p',`${c.type} · groupe ${c.groupId??'—'} · ${date(c.openedAt)}`,'hint'));casesRoot.append(card);}
  };
  const render=d=>{lastData=d;allowed=true;nav.hidden=false;fillServiceSelect('founderIssueService',d.services);fillServiceSelect('founderEditorialService',d.services);renderMetrics(d);renderServices(d);renderIssues(d);renderEditorial(d);renderCases(d);document.getElementById('founderGeneratedAt').textContent='Dernière consolidation : '+date(d.generatedAt);};
  const refresh=async()=>{
    try{const d=await app.founderControlCenter();render(d);}
    catch(e){if(String(e?.message??e)==='FOUNDER_TEAM_ONLY'){allowed=false;nav.hidden=true;view.classList.remove('active');return;}showError(e);}
  };
  issueForm.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{await app.createFounderIssue({serviceId:value('founderIssueService')||undefined,title:value('founderIssueTitle'),summary:value('founderIssueSummary'),severity:value('founderIssueSeverity'),source:'FOUNDER'});issueForm.reset();notify('Incident ajouté au contrôle.');await refresh();}catch(err){showError(err);}})();});
  editorialForm.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{await app.createFounderEditorial({serviceId:value('founderEditorialService')||undefined,title:value('founderEditorialTitle'),kind:value('founderEditorialKind'),state:value('founderEditorialState'),owner:value('founderEditorialOwner')||undefined,notes:value('founderEditorialNotes')||undefined});editorialForm.reset();notify('Contenu ajouté au suivi.');await refresh();}catch(err){showError(err);}})();});
  const tick=()=>{if(allowed&&!document.hidden&&view.classList.contains('active'))void refresh();};
  timer=setInterval(tick,15000);window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
  return{refresh,available:()=>allowed,data:()=>lastData};
}
