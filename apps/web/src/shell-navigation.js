// Presentation only: every destination delegates to its existing navigation
// button. No financial command, new business owner or remote search is created.
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const WORDS={
  dashboard:'accueil home dashboard cockpit mon espace my space',inbox:'a faire to do inbox notifications actions',
  discovery:'decouvrir discover discovery groupes groups recherche search',launch:'creer integrer rejoindre create join kit groupe group',
  assistant:'eco ia ai assistant aide help intelligence',operations:'centre operationnel operations saisie entry feuille sheet',
  sessions:'seances sessions meeting reunion presence saisie entry',members:'membres members participants contacts',
  finance:'finances finance caisse cash ledger',tontines:'tontines tours rounds',recap:'recap recapitulatif summary bilan',
  backoffice:'back office administration gestion management',ecosystem:'ecosysteme ecosystem',services:'services capacites capabilities all tous',
  relay:'relay local offline hors ligne resilience',control:'control center controle fondateur founder',settings:'reglages settings security securite langue language affichage display',trash:'corbeille trash archive',
  twoSheetWorkspace:'fiches individuelles membres member sheets individual entries',rubricsManagementPanel:'rubriques categories cotisations contributions',
  financeLoanGuide:'prets loans credit emprunt remboursement repayment',loanOfficialConfig:'prets interets loans interest politique policy',
  savingsYieldLab:'epargne savings rendement yield',assistanceRulebookPanel:'assistances assistance solidarite solidarity secours',
  interestCommunityPanel:'communautes communities community',externalProgramsPanel:'partenaires partners ong ngo programmes programs',
  adManagerPanel:'publicite advertising ads campagnes campaigns admanager',valueNetworkOperational:'eco now opportunites opportunities value network harvest offres offers besoins needs',
  personalCockpitPanel:'mes associations groupes my associations groups',personalRotatingTontines:'mes tontines rotatives my rotating tontines',
  'MARKETPLACE.CORE':'marketplace boutique shop store achats ventes acheter vendre buy sell',
  'COMMUNITY.FORUM':'foras forums hubs community communaute discussions entraide'
};
export const navigationKey=entry=>[entry.view||'',entry.anchor||'',entry.module||'',entry.sheetMode||'',entry.preset||''].join('|');
export function searchNavigationEntries(entries,query=''){
  const words=normalize(query).split(/\s+/).filter(Boolean);
  return entries.map((entry,index)=>{
    const label=normalize(entry.label),aliases=normalize(WORDS[entry.module||entry.anchor||entry.view]||'');
    const haystack=label+' '+aliases;
    const score=!words.length?1:words.every(w=>haystack.includes(w))?1+(label===normalize(query)?20:0)+(label.startsWith(normalize(query))?8:0)+words.filter(w=>label.includes(w)).length:0;
    return{...entry,score,originalOrder:index};
  }).filter(e=>e.score>0).sort((a,b)=>b.score-a.score||a.originalOrder-b.originalOrder);
}

export function createNavigationFavorites({storage,scope,now=Date.now}={}){
  const key=()=>{const s=scope?.();return s?.actor?'eco.navigation.favorites.v1.'+encodeURIComponent(s.actor)+'.'+encodeURIComponent(s.group||'personal'):null;};
  const read=()=>{try{const k=key();if(!k)return[];const v=JSON.parse(storage.getItem(k)||'null');return Array.isArray(v?.items)?v.items.filter(x=>x&&typeof x.id==='string'&&x.id.length<400&&Number.isFinite(x.at)&&x.at<=now()&&now()-x.at<30*86400000).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).slice(0,8):[];}catch{return[];}};
  const write=items=>{try{const k=key();if(!k)return false;storage.setItem(k,JSON.stringify({version:1,items}));return true;}catch{return false;}};
  return{ids:()=>read().map(x=>x.id),toggle(id){if(typeof id!=='string'||!id||id.length>=400)return false;const old=read();return write(old.some(x=>x.id===id)?old.filter(x=>x.id!==id):[{id,at:now()},...old].slice(0,8));},clear:()=>write([])};
}

export function mountShellNavigation({getContext=()=>({}),getCurrentState=()=>({}),navigate=()=>{}}={}){
  const nav=document.getElementById('mainNav'),content=document.querySelector('main.content');
  if(!nav||!content)return{refresh(){},search:()=>[]};
  const en=()=>document.documentElement.lang==='en',tx=(fr,eng)=>en()?eng:fr;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  const button=(text,cls='secondary')=>{const b=el('button',cls,text);b.type='button';return b;};
  const favorites=createNavigationFavorites({storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},scope:getContext});
  let lastScope='',lastEditor=null,returnEditor=null,navigated=false;
  const describeEditor=node=>{if(!(node instanceof HTMLElement))return null;const cell=node.closest('.matrix-cell-entry');return{node,id:node.id,cell:cell?{meeting:cell.dataset.meetingId,member:cell.dataset.membershipId,rubric:cell.dataset.rubricId,host:cell.closest('#meetingMatrix,#sessionsWorkspace,#individualSheetMatrix')?.id}:null};};
  const resolveEditor=reference=>{if(reference?.node?.isConnected&&reference.node.getClientRects().length)return reference.node;if(reference?.cell){const c=reference.cell,host=c.host?document.getElementById(c.host):content;return host?.querySelector(`.matrix-cell-entry[data-meeting-id="${CSS.escape(c.meeting||'')}"][data-membership-id="${CSS.escape(c.member||'')}"][data-rubric-id="${CSS.escape(c.rubric||'')}"] .cell-target-input`);}return reference?.id?document.getElementById(reference.id):null;};
  const resumptions=new Map();
  const scopeKey=()=>{const c=getContext();return c.actor?JSON.stringify([c.actor,c.group||'']):'';};
  const entries=()=>[...nav.querySelectorAll('button[data-view],button[data-module-open]')].filter(b=>!b.hidden&&!b.disabled&&!b.closest('[hidden]')).map(b=>({
    id:navigationKey({view:b.dataset.view,anchor:b.dataset.anchor,module:b.dataset.moduleOpen,sheetMode:b.dataset.sheetMode,preset:b.dataset.ecoModulePreset}),
    label:b.querySelector('b')?.textContent||b.textContent,view:b.dataset.view,anchor:b.dataset.anchor,module:b.dataset.moduleOpen,source:b
  }));
  const bar=el('section','eco-navigation-context');bar.id='ecoNavigationContext';bar.setAttribute('aria-label','Contexte de navigation');
  const trail=el('div','eco-navigation-trail'),personal=button('Mon espace','eco-navigation-home'),group=el('span','eco-navigation-group'),current=el('strong','eco-navigation-current'),role=el('span','eco-navigation-role');
  personal.onclick=()=>navigate('dashboard');trail.append(personal,group,current,role);
  const actions=el('div','eco-navigation-actions'),open=button('Tous les espaces','eco-navigation-open'),pin=button('☆','eco-navigation-pin'),resume=button('Reprendre la saisie','eco-navigation-resume');
  open.id='ecoNavigationOpen';pin.id='ecoNavigationPin';resume.id='ecoNavigationResume';resume.hidden=true;
  open.setAttribute('aria-haspopup','dialog');open.setAttribute('aria-controls','ecoNavigationDialog');open.setAttribute('aria-expanded','false');
  actions.append(resume,pin,open);const shortcut=el('span','eco-navigation-shortcut','Ctrl / ⌘ K');open.append(shortcut);
  const favoriteStrip=el('div','eco-navigation-favorites');favoriteStrip.id='ecoNavigationFavorites';
  const groupSpaces=el('nav','eco-navigation-group-spaces');groupSpaces.id='ecoGroupSpaces';
  const guide=el('p','eco-navigation-guide');bar.append(trail,actions,groupSpaces,favoriteStrip,guide);content.prepend(bar);
  // Share the real, wrapping context height with presentation scroll margins.
  // No viewport polling or financial-editor relocation is needed.
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{
    content.style.setProperty('--eco-navigation-height',Math.ceil(bar.getBoundingClientRect().height)+'px');
  }).observe(bar);
  const skip=el('a','eco-skip-link','Aller au contenu');skip.href='#ecoMainContent';content.id='ecoMainContent';content.tabIndex=-1;document.body.prepend(skip);
  const dialog=el('dialog','eco-navigation-dialog');dialog.id='ecoNavigationDialog';dialog.setAttribute('aria-labelledby','ecoNavigationTitle');
  const header=el('div','eco-navigation-dialog-head'),title=el('h2',null);title.id='ecoNavigationTitle';const close=button('Fermer','ghost');header.append(title,close);
  const label=el('label','eco-navigation-search-label'),filter=el('input');filter.type='search';filter.id='ecoNavigationFilter';filter.autocomplete='off';label.htmlFor=filter.id;
  const filterText=el('span');label.append(filterText,filter);
  const hint=el('p','hint'),status=el('p','eco-navigation-status');status.setAttribute('role','status');
  const list=el('div','eco-navigation-list');const clear=button('Effacer mes favoris','link-btn');
  dialog.append(header,label,hint,status,list,clear);
  const storageNotice=()=>{status.textContent=tx('Impossible de conserver le favori sur cet appareil.','This device could not save the favorite.');};
  const selected=()=>{const active=nav.querySelector('.nav-btn.active');return entries().find(x=>x.source===active)||null;};
  const activate=entry=>{
    // Recheck the currently visible owner button at activation, including after
    // role/group changes. Never retain a callable clone of an old destination.
    const allowed=entries().find(x=>x.id===entry.id);if(!allowed)return;
    navigated=true;if(dialog.open)dialog.close();allowed.source.click();
  };
  const renderDialog=()=>{
    // Role/translation refreshes may arrive between two keyboard events. Keep
    // focus on the same destination when its presentation is rebuilt.
    const focused=list.contains(document.activeElement)?document.activeElement:null;
    const focusId=focused?.dataset.navigationId,starId=focused?.dataset.favoriteId;
    const rows=searchNavigationEntries(entries(),filter.value),saved=new Set(favorites.ids());list.replaceChildren();
    status.textContent=rows.length?tx(rows.length+' espaces accessibles',rows.length+' available spaces'):tx('Aucun espace trouvé. Essayez un autre terme.','No matching space. Try another term.');
    for(const row of rows){
      const item=el('div','eco-navigation-row'),go=button(row.label,'eco-navigation-destination'),star=button(saved.has(row.id)?'★':'☆','eco-navigation-star');
      go.dataset.navigationId=row.id;go.onclick=()=>activate(row);
      star.setAttribute('aria-label',tx((saved.has(row.id)?'Retirer des favoris : ':'Ajouter aux favoris : ')+row.label,(saved.has(row.id)?'Unpin: ':'Pin: ')+row.label));star.setAttribute('aria-pressed',String(saved.has(row.id)));star.disabled=!getContext().actor;
      star.onclick=()=>{if(!favorites.toggle(row.id)){storageNotice();return;}refresh();starFocus(row.id);};
      star.dataset.favoriteId=row.id;item.append(go,star);list.append(item);
    }
    clear.disabled=!getContext().actor||favorites.ids().length===0;
    if(focused){const next=[...list.querySelectorAll('button')].find(b=>focusId?b.dataset.navigationId===focusId:b.dataset.favoriteId===starId);(next||filter).focus({preventScroll:true});}
  };
  const starFocus=id=>[...list.querySelectorAll('[data-favorite-id]')].find(b=>b.dataset.favoriteId===id)?.focus();
  const refresh=()=>{
    const ctx=getContext(),scope=scopeKey(),all=entries();
    if(scope!==lastScope){lastScope=scope;lastEditor=null;returnEditor=null;filter.value='';document.getElementById('globalSearchResults')?.replaceChildren();if(dialog.open)dialog.close();}
    if(document.body.classList.contains('signed-out')||!ctx.actor){resumptions.clear();if(dialog.open)dialog.close();}
    const chosen=selected();
    personal.textContent=tx('Mon espace','My space');group.textContent=ctx.groupLabel||tx('Tous mes groupes','All my groups');current.textContent=(chosen?.label||tx('Accueil','Home'))+(ctx.objectLabel?' · '+ctx.objectLabel:'');
    role.textContent=ctx.group?ctx.role==='manager'?tx('Gestionnaire','Manager'):tx('Membre','Member'):tx('Personnel','Personal');
    open.firstChild.textContent=tx('Tous les espaces','All spaces');title.textContent=tx('Tous vos espaces Eco','All your Eco spaces');close.textContent=tx('Fermer','Close');
    filterText.textContent=tx('Rechercher une fonction','Find a function');filter.placeholder=tx('Prêt, boutique, séances, aide…','Loan, shop, sessions, help…');
    hint.textContent=tx('Les mêmes parcours, accessibles ici. Épinglez jusqu’à 8 favoris ; ils restent séparés par compte et groupe sur cet appareil pendant 30 jours.','The same journeys, available here. Pin up to 8 favorites; they stay separate by account and group on this device for 30 days.');
    clear.textContent=tx('Effacer mes favoris','Clear my favorites');guide.textContent=tx('Choisissez un espace ou recherchez une fonction. Votre saisie en cours reste conservée à l’ouverture du menu.','Choose a space or search for a function. Opening the menu preserves your current entry.');
    skip.textContent=tx('Aller au contenu','Skip to content');bar.setAttribute('aria-label',tx('Contexte de navigation','Navigation context'));
    groupSpaces.replaceChildren();groupSpaces.hidden=!ctx.group;groupSpaces.setAttribute('aria-label',tx('Repères du groupe actif','Active group destinations'));
    if(ctx.group)for(const [selector,fr,eng] of [
      ['#groupHomeNavBtn','Accueil du groupe','Group home'],['#sessionsNavBtn','Séances','Sessions'],['#memberSheetsNavBtn','Fiches','Sheets'],['#recapNavBtn','Cockpit · Récap','Cockpit · Recap'],
      ['[data-module-open="MARKETPLACE.CORE"]','Boutiques','Shops'],['[data-module-open="COMMUNITY.FORUM"]','Forum','Forum']
    ]){
      const row=all.find(x=>x.source.matches(selector));if(!row)continue;
      const b=button(tx(fr,eng),'eco-navigation-group-space');b.onclick=()=>activate(row);
      const state=getCurrentState(),active=state.view===row.view&&(row.anchor?state.anchor===row.anchor:!state.anchor);
      if(active){b.classList.add('active');b.setAttribute('aria-current','page');}groupSpaces.append(b);
    }
    favoriteStrip.replaceChildren();favoriteStrip.setAttribute('aria-label',tx('Mes favoris','My favorites'));
    const ids=new Set(favorites.ids());for(const row of all.filter(e=>ids.has(e.id))){const b=button(row.label,'eco-navigation-favorite');b.onclick=()=>activate(row);favoriteStrip.append(b);}favoriteStrip.hidden=!favoriteStrip.childElementCount;
    const pinned=Boolean(chosen&&ids.has(chosen.id));
    pin.hidden=!chosen||!ctx.actor;pin.textContent=pinned?'★':'☆';pin.setAttribute('aria-pressed',String(pinned));pin.setAttribute('aria-label',pinned?tx('Retirer cet espace des favoris','Unpin this space'):tx('Épingler cet espace','Pin this space'));
    const previous=resumptions.get(scope);resume.hidden=!previous||previous.view===getCurrentState().view;resume.textContent=tx('Reprendre la saisie','Resume entry');
    if(dialog.open)renderDialog();
    for(const b of nav.querySelectorAll('.nav-btn')){if(b.classList.contains('active'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
  };
  const openDialog=()=>{
    if(!getContext().actor||document.body.classList.contains('signed-out')||document.querySelector('dialog[open]'))return;
    returnEditor=lastEditor||describeEditor(document.activeElement);navigated=false;filter.value='';refresh();renderDialog();
    document.body.append(dialog);dialog.showModal();open.setAttribute('aria-expanded','true');filter.focus();
  };
  open.onclick=openDialog;close.onclick=()=>dialog.close();filter.oninput=renderDialog;
  dialog.addEventListener('close',()=>{if(dialog.open)return;dialog.remove();open.setAttribute('aria-expanded','false');if(!navigated)resolveEditor(returnEditor)?.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dialog.close();}});
  filter.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){const first=list.querySelector('.eco-navigation-destination');if(first){e.preventDefault();first.focus();}}});
  list.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&e.target?.matches?.('.eco-navigation-destination')){const row=entries().find(x=>x.id===e.target.dataset.navigationId);if(row){e.preventDefault();activate(row);}return;}
    if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
    const bs=[...list.querySelectorAll('.eco-navigation-destination')],index=bs.indexOf(document.activeElement);if(index<0)return;
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?bs.length-1:(index+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length;bs[next]?.focus();
  });
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.isComposing&&e.key.toLowerCase()==='k'){if(getContext().actor&&!document.querySelector('dialog[open]')){e.preventDefault();openDialog();}}});
  document.addEventListener('focusin',e=>{if(e.target instanceof HTMLElement&&content.contains(e.target)&&!bar.contains(e.target))lastEditor=describeEditor(e.target);});
  pin.onclick=()=>{const row=selected();if(row){if(!favorites.toggle(row.id)){openDialog();storageNotice();return;}refresh();}};
  clear.onclick=()=>{if(!favorites.clear()){storageNotice();return;}refresh();filter.focus();};
  resume.onclick=()=>{const previous=resumptions.get(scopeKey());if(previous)navigate(previous.view,{...previous,force:true});};
  window.addEventListener('eco:navigation-leaving',e=>{const state=e.detail?.state,key=scopeKey();if(key&&['sessions','operations'].includes(state?.view)){resumptions.set(key,{...state});if(resumptions.size>8)resumptions.delete(resumptions.keys().next().value);}});
  window.addEventListener('eco:view-changed',refresh);window.addEventListener('eco:ui-mode-changed',refresh);window.addEventListener('storage',e=>{if(e.key?.startsWith('eco.navigation.favorites.'))refresh();});
  document.addEventListener('change',e=>{if(e.target?.matches?.('#sessionsMeetingSelect,#meetingMatrixScope,#individualSheetMember,#workspaceModule'))refresh();});
  new MutationObserver(refresh).observe(nav,{attributes:true,attributeFilter:['hidden','disabled'],subtree:true,childList:true});
  // The existing translator writes lang even when it has not changed. React
  // only to a real language transition to avoid a DOM/translation feedback loop.
  let observedLocale=document.documentElement.lang;
  new MutationObserver(()=>{const locale=document.documentElement.lang;if(locale!==observedLocale){observedLocale=locale;refresh();}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['class']});
  // Give the existing top search keyboard semantics without replacing its
  // local groups/modules provider or causing requests on each keystroke.
  const input=document.getElementById('globalSearch'),results=document.getElementById('globalSearchResults');let index=-1;
  if(input&&results){
    input.setAttribute('aria-label',tx('Rechercher dans Eco','Search Eco'));input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',results.id);input.setAttribute('aria-expanded','false');results.setAttribute('role','listbox');
    new MutationObserver(()=>{index=-1;input.removeAttribute('aria-activedescendant');input.setAttribute('aria-expanded',String(results.childElementCount>0));[...results.querySelectorAll('button')].forEach((b,i)=>{b.id='eco-search-option-'+i;b.setAttribute('role','option');b.setAttribute('aria-selected','false');});}).observe(results,{childList:true});
    input.addEventListener('keydown',e=>{
      const options=[...results.querySelectorAll('button')];if(e.key==='Escape'){results.replaceChildren();return;}
      if(['ArrowDown','ArrowUp'].includes(e.key)&&options.length){e.preventDefault();index=index<0?(e.key==='ArrowDown'?0:options.length-1):(index+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options.forEach((b,i)=>b.setAttribute('aria-selected',String(index===i)));input.setAttribute('aria-activedescendant',options[index].id);options[index].scrollIntoView({block:'nearest'});}
      if(e.key==='Enter'&&index>=0&&options[index]){e.preventDefault();options[index].click();}
    });
  }
  refresh();return{refresh,search:query=>searchNavigationEntries(entries(),query),activate};
}
