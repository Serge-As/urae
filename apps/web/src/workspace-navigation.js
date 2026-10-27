/** Local tabs only: existing panels retain their IDs, handlers and owners. */
export function mountWorkspaceNavigation({getScope=()=>'',navigate=()=>{}}={}){
  const dashboard=document.getElementById('view-dashboard');if(!dashboard)return;
  const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
  const nav=el('nav',null,'workspace-tabs');nav.setAttribute('aria-label','Espaces de mon cockpit');nav.setAttribute('role','tablist');
  const definitions=[['overview','Mon Eco','My Eco'],['groups','Accueil du groupe','Group home'],['opportunities','Échanger & entreprendre','Connect & trade'],['services','Services & confort','Services & comfort']];
  const panels=new Map(),buttons=new Map();let active='overview';
  for(const [key,fr,en] of definitions){
    const button=el('button',fr);button.type='button';button.dataset.workspaceTab=key;button.id='cockpit-tab-'+key;button.setAttribute('role','tab');button.setAttribute('aria-controls','cockpit-panel-'+key);button.dataset.labelFr=fr;button.dataset.labelEn=en;
    const panel=el('div',null,'cockpit-tab-panel');panel.id='cockpit-panel-'+key;panel.dataset.cockpitPanel=key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
    panels.set(key,panel);buttons.set(key,button);nav.append(button);
  }
  const storageKey=()=> 'eco.cockpit.tab.'+getScope();
  const select=(key,{persist=true,focus=false}={})=>{
    active=panels.has(key)?key:'overview';
    for(const [id,panel] of panels){panel.hidden=id!==active;const b=buttons.get(id);b.setAttribute('aria-selected',String(id===active));b.tabIndex=id===active?0:-1;b.classList.toggle('active',id===active);}
    if(persist)try{sessionStorage.setItem(storageKey(),active);}catch{}
    if(focus)buttons.get(active).focus();
  };
  for(const [key,button] of buttons)button.onclick=()=>select(key);
  nav.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const keys=[...panels.keys()],i=keys.indexOf(active);
    select(keys[event.key==='Home'?0:event.key==='End'?keys.length-1:(i+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length],{focus:true});
  });
  const classify=node=>{
    if(!(node instanceof Element)||node===nav||node.dataset.cockpitPanel||node.classList.contains('cockpit-welcome')||node.dataset.ecoVisualMedia==='HOME_HERO')return;
    const id=node.id;
    const key=['groupHomePanel','roleDashboardsCenter'].includes(id)?'groups'
      :['ecoPulsePanel','anticipationCenter','anticipationPanel'].includes(id)?'opportunities'
      :id==='uiModePanel'||id==='universeCards'||node.classList.contains('cahier-banner')||node.querySelector(':scope > .quick-grid')?'services'
      :id==='ecoCockpitWorkbench'||id==='personalCockpitPanel'||id==='urgentNotificationsPanel'||node.matches('.cockpit-workbench,.cockpit-launchpad,.two-col')?'overview':'services';
    panels.get(key).append(node);
  };
  for(const node of [...dashboard.children])classify(node);
  dashboard.querySelector('.cockpit-welcome')?.after(nav);
  for(const panel of panels.values())dashboard.append(panel);
  const commerce=el('section',null,'panel cockpit-intents');
  commerce.append(el('span','J’AI UN PROJET · J’AI UNE OFFRE · JE CHERCHE','eyebrow'),el('h2','Faites circuler vos possibilités'));
  const grid=el('div',null,'cockpit-intent-grid');
  for(const [title,description,module,view,anchor] of [
    ['Acheter ou vendre','Produits, services, fournisseurs et achats groupés.','MARKETPLACE.CORE'],
    ['Proposer une opportunité','Un besoin, une offre, une collaboration à préparer.',null,'ecosystem','valueNetworkOperational'],
    ['Échanger avec ma communauté','Questions, expériences et entraide.','COMMUNITY.FORUM'],
    ['Développer mes compétences','Apprendre et valoriser mes capacités.',null,'ecosystem','academyOperational'],
    ['Examiner une proposition','Évaluer les signaux de risque avant de s’engager.',null,'ecosystem','financialLabPanel']
  ]){
    const button=el('button',null,'cockpit-intent');button.type='button';button.append(el('strong',title),el('span',description));
    if(module)button.dataset.moduleOpen=module;else button.onclick=()=>navigate(view,{anchor,force:true});grid.append(button);
  }
  commerce.append(grid);panels.get('opportunities').prepend(commerce);
  // Owners mounted after this module remain accessible in the same tab system.
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.parentElement===dashboard)classify(node);}).observe(dashboard,{childList:true});
  const restore=()=>{
    let saved='overview';try{saved=sessionStorage.getItem(storageKey())||'overview';}catch{}select(saved,{persist:false});
    const en=document.documentElement.lang==='en';for(const b of buttons.values())b.textContent=en?b.dataset.labelEn:b.dataset.labelFr;
  };
  window.addEventListener('eco:view-changed',event=>{
    if(event.detail?.view!=='dashboard')return;restore();
    const target=event.detail.state?.anchor&&document.getElementById(event.detail.state.anchor),panel=target?.closest('[data-cockpit-panel]');
    if(panel)select(panel.dataset.cockpitPanel);
  });
  window.addEventListener('eco:journey-changed',restore);
  restore();
}
