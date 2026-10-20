import {buildCockpitPriorities,createCockpitPreferences,cockpitScope,revalidateCockpitTarget} from './cockpit-priorities.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function mountCockpitPriorities({app,journey,navigate,openDetail,openGroupWorkspace,openOpportunity,openInbox}={}){
 const host=document.getElementById('view-dashboard');if(!host)return{update(){},reset(){}};
 const context=()=>({actor:app.currentActor(),tenant:app.currentTenant?.(),group:app.activeGroup()||''}),tx=(fr,en)=>document.documentElement.lang==='en'?en:fr;
 const prefs=createCockpitPreferences({storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},scope:context});
 let scope=cockpitScope(context()),generation=0,data={},meta={},message='',showAll=new Set();
 const root=el('section',undefined,'panel eco-workbench');root.id='ecoCockpitWorkbench';root.setAttribute('aria-labelledby','ecoWorkbenchTitle');
 const top=el('div',undefined,'eco-workbench-heading'),heading=el('div'),eyebrow=el('p',undefined,'eyebrow'),title=el('h2');title.id='ecoWorkbenchTitle';const intro=el('p',undefined,'hint');heading.append(eyebrow,title,intro);
 const controls=el('div',undefined,'eco-workbench-controls'),label=el('label'),toggle=el('input');toggle.type='checkbox';toggle.id='ecoCockpitPersonalization';const toggleText=el('span');label.append(toggle,toggleText);
 const reset=el('button',undefined,'secondary');reset.type='button';reset.id='ecoCockpitReset';controls.append(label,reset);top.append(heading,controls);
 const status=el('p',undefined,'eco-workbench-status');status.setAttribute('role','status');const counts=el('div',undefined,'eco-workbench-counts'),lanes=el('div',undefined,'eco-workbench-lanes'),preparation=el('div',undefined,'eco-workbench-preparation'),directory=el('details',undefined,'eco-workbench-directory');
 root.append(top,status,counts,lanes,preparation,directory);
 const launchpad=host.querySelector('.cockpit-launchpad');if(launchpad)launchpad.insertAdjacentElement('afterend',root);else host.prepend(root);
 const names={now:['À faire maintenant','Do now'],watch:['À surveiller','Keep an eye on'],resume:['À reprendre','Resume'],opportunities:['Opportunités','Opportunities']};
 const owners={meetings:['Séances','Meetings'],inbox:['À faire','To do'],notices:['Avis financiers','Financial notices'],journey:['Mémoire locale','Local memory'],pulse:['EcoPulse','EcoPulse']};
 const reasons={blocked:['Un blocage demande votre attention.','A blockage needs your attention.'],overdue:['La date indiquée est arrivée.','The stated date is due.'],priority:['Priorité indiquée par la source.','Priority set by the source.'],assigned:['Cette action vous est destinée.','This action is assigned to you.'],'manage-meeting':['Vous pouvez préparer cette séance ouverte.','You can prepare this open meeting.'],'open-meeting':['Une séance de votre groupe est ouverte.','Your group has an open meeting.'],upcoming:['Prochaine date renseignée par votre groupe.','Upcoming date entered by your group.'],review:['Cet avis attend votre vérification.','This notice awaits your review.'],interrupted:['Vous avez consulté cette feuille sur cet appareil.','You visited this sheet on this device.'],suggested:['Suggestion de votre fil EcoPulse.','Suggested by your EcoPulse feed.']};
 const date=x=>{const d=new Date(x);return Number.isFinite(d.valueOf())?d.toLocaleString(document.documentElement.lang==='en'?'en-GB':'fr-FR',{dateStyle:'short',timeStyle:'short'}):tx('Date inconnue','Unknown date');};
 const button=(text,fn,cls='secondary')=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
 const storageResult=ok=>{message=ok?'':tx('Cet appareil ne peut pas enregistrer la préférence.','This device cannot save the preference.');render();};
 const resetData=()=>{scope=cockpitScope(context());generation++;data={};meta={};message='';showAll=new Set();render();};
 const activate=async(card,b)=>{
  const captured=context(),key=cockpitScope(captured);b.disabled=true;message=tx('Vérification des droits et de la cible…','Checking permissions and target…');status.textContent=message;
  try{
   await revalidateCockpitTarget({app,context:captured,card});if(key!==cockpitScope(context()))return;
   if(card.kind==='resume')navigate(card.view,{meetingId:card.targetId,matrixMeetingId:card.targetId,sheetMode:'meeting',force:true});
   else if(card.kind==='meeting')await openDetail?.('meeting',card.targetId);
   else if(card.kind==='notice')await openDetail?.('member',card.memberId);
   else if(card.kind==='inbox'){if(openInbox)await openInbox(card.targetId);else navigate('inbox');}
   else if(card.kind==='opportunity'){const item=(data.opportunities||[]).find(x=>x.id===card.targetId);if(item)await openOpportunity?.(item);}
   message='';
  }catch(error){
   if(key!==cockpitScope(context()))return;
   if(error.message==='COCKPIT_TARGET_UNAVAILABLE'){
    if(card.kind==='resume')journey?.forgetReference(card.targetId);
    data.invalid=[...(data.invalid||[]),card.id];message=tx('Cette cible est close, supprimée ou ne relève plus de vos droits. Le raccourci a été retiré.','This target is closed, deleted or outside your permissions. The shortcut was removed.');
   }else message=tx('La vérification est indisponible. Réessayez quand la connexion et vos droits pourront être confirmés.','Verification is unavailable. Retry when the connection and your permissions can be confirmed.');
  }finally{if(key===cockpitScope(context())){b.disabled=false;render();}}
 };
 const provenance=card=>{
  const m=meta[card.owner],bits=[tx(...owners[card.owner])];
  if(card.owner==='journey')bits.push(date(card.at),tx('Référence locale, droits à revérifier','Local reference; permissions will be checked'));
  else if(m?.source==='LOCAL_PENDING'||m?.availability==='LOCAL_PENDING')bits.push(tx('Changements locaux en attente','Local changes pending'));
  else if(m?.lastSyncedAt)bits.push(tx('Dernière synchronisation : ','Last sync: ')+date(m.lastSyncedAt));
  else bits.push(tx('Fraîcheur à revérifier','Freshness needs checking'));
  return bits.join(' · ');
 };
 function render(){
  if(scope!==cockpitScope(context())){resetData();return;}
  const p=prefs.snapshot(),model=buildCockpitPriorities({...data,groupId:context().group,references:journey?.references?.()||[],preferences:p});
  for(const key of Object.keys(model.lanes))model.lanes[key]=model.lanes[key].filter(c=>!(data.invalid||[]).includes(c.id));
  eyebrow.textContent=tx('Votre poste de travail','Your workspace');title.textContent=tx('L’essentiel, au bon moment','What matters, when it matters');intro.textContent=tx('Des priorités expliquées et des raccourcis vers vos actions. Chaque information garde sa source.','Explained priorities and shortcuts to your actions. Every item keeps its source.');
  toggle.checked=p.enabled;toggle.disabled=!context().actor;toggleText.textContent=tx('Mes choix de présentation','My display preferences');reset.textContent=tx('Réinitialiser mes choix','Reset my choices');reset.disabled=!context().actor;
  status.textContent=message||(model.hiddenCount?tx(model.hiddenCount+' carte(s) masquée(s). Réinitialiser les rend visibles.',model.hiddenCount+' hidden card(s). Reset makes them visible again.'):tx('La consultation du cockpit n’engage aucune opération.','Viewing this cockpit does not commit an operation.'));
  counts.replaceChildren();lanes.replaceChildren();
  for(const [lane,labels]of Object.entries(names)){
   const cards=model.lanes[lane],summary=el('div');summary.append(el('strong',String(cards.length)),el('span',tx(...labels)));counts.append(summary);
   const column=el('section',undefined,'eco-workbench-lane');column.dataset.cockpitLane=lane;const h=el('h3',tx(...labels));column.append(h);
   for(const card of cards.slice(0,showAll.has(lane)?cards.length:6)){
    const article=el('article',undefined,'eco-workbench-card');article.dataset.cockpitCard=card.id;article.dataset.cockpitOwner=card.owner;if(card.pinned)article.classList.add('is-pinned');
    article.append(el('strong',card.title),el('p',tx(...reasons[card.reason]),'eco-workbench-reason'));
    if(card.dueAt)article.append(el('p',date(card.dueAt),'eco-workbench-date'));
    if(card.why?.length)article.append(el('p',card.why.join(' · '),'hint'));
    article.append(el('small',provenance(card),'eco-workbench-source'));
    const actions=el('div',undefined,'eco-workbench-card-actions');const open=button(card.kind==='resume'?tx('Reprendre','Resume'):tx('Ouvrir','Open'),()=>void activate(card,open),'primary');actions.append(open);
    const pin=button(card.pinned?'★':'☆',()=>storageResult(prefs.toggle(card.id,'pinned')),'ghost');pin.dataset.cockpitPin=card.id;pin.setAttribute('aria-label',tx((card.pinned?'Désépingler : ':'Épingler : ')+card.title,(card.pinned?'Unpin: ':'Pin: ')+card.title));pin.setAttribute('aria-pressed',String(card.pinned));pin.disabled=!p.enabled;
    const hide=button(tx('Masquer','Hide'),()=>storageResult(prefs.toggle(card.id,'hidden')),'ghost');hide.dataset.cockpitHide=card.id;hide.disabled=!p.enabled;actions.append(pin,hide);article.append(actions);column.append(article);
   }
   if(!cards.length){const unavailable=lane==='now'&&data.inbox==null||lane==='watch'&&data.notices==null&&context().group||lane==='opportunities'&&data.opportunities==null;column.append(el('p',lane==='resume'&&!journey?.snapshot().enabled?tx('La mémoire est désactivée.','Memory is disabled.'):unavailable?tx('Cette source est temporairement indisponible. Les autres actions restent accessibles.','This source is temporarily unavailable. Other actions remain available.'):tx('Rien à afficher pour le moment.','Nothing to show for now.'),'eco-workbench-empty'));}
   if(cards.length>6&&!showAll.has(lane))column.append(button(tx('Voir les '+cards.length+' cartes','Show all '+cards.length+' cards'),()=>{showAll.add(lane);render();},'link-btn'));
   lanes.append(column);
  }
  preparation.replaceChildren();preparation.append(el('strong',tx('Préparer et anticiper','Prepare and look ahead')),el('p',tx('La séance conserve ses présences, ses bénéficiaires et ses feuilles. Le diagnostic utilise les règles de votre groupe.','The meeting keeps its attendance, beneficiaries and sheets. The diagnostic uses your group rules.'),'hint'));
  preparation.append(button(tx('Préparer une séance','Prepare a meeting'),()=>navigate('sessions')),button(tx('Calendrier des engagements','Commitment calendar'),()=>navigate('ecosystem',{anchor:'unifiedCalendarPanel',force:true})));
  if(data.manager)preparation.append(button(tx('Diagnostic Group Doctor','Group Doctor diagnostic'),()=>navigate('finance',{anchor:'savingsYieldLab',force:true})));
  directory.replaceChildren();const groups=data.groups||[];directory.append(el('summary',tx('Tous mes groupes · '+groups.length,'All my groups · '+groups.length)));
  if(data.groupsUnavailable)directory.append(el('p',tx('Le répertoire est indisponible ; aucun groupe n’est considéré comme supprimé.','The directory is unavailable; no group is treated as deleted.'),'hint'));
  for(const g of groups){const b=button(String(g.name||g.id),()=>void Promise.resolve(openGroupWorkspace?.(g.id)).catch(()=>{message=tx('Les droits de ce groupe doivent être revérifiés.','Permissions for this group need checking.');render();}));b.dataset.cockpitGroup=g.id;directory.append(b);}
 }
 const update=async(patch,captured=context())=>{
  if(cockpitScope(captured)!==cockpitScope(context()))return;
  if(scope!==cockpitScope(context()))resetData();Object.assign(data,patch);render();
  const token=++generation,group=context().group,paths={inbox:'/api/v1/inbox',meetings:group?'/api/v1/groups/'+encodeURIComponent(group)+'/meetings':null,notices:group&&data.memberId?'/api/v1/groups/'+encodeURIComponent(group)+'/members/'+encodeURIComponent(data.memberId)+'/financial-notices':null};
  const values=await Promise.all(Object.entries(paths).map(async([owner,path])=>[owner,path?await app.projectionMeta(path).catch(()=>null):null]));
  if(token!==generation||cockpitScope(captured)!==cockpitScope(context()))return;meta=Object.fromEntries(values);render();
 };
 toggle.onchange=()=>storageResult(prefs.setEnabled(toggle.checked));reset.onclick=()=>storageResult(prefs.reset());
 let observedLocale=document.documentElement.lang;
 new MutationObserver(()=>{if(observedLocale!==document.documentElement.lang){observedLocale=document.documentElement.lang;render();}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 window.addEventListener('eco:journey-changed',render);window.addEventListener('storage',render);window.addEventListener('eco:view-changed',()=>{if(scope!==cockpitScope(context()))resetData();else render();});
 document.addEventListener('focusin',event=>{
  const cell=event.target?.closest?.('.matrix-cell-entry'),view=cell?.closest('.view')?.id.replace('view-','');
  if(cell&&cell.dataset.meetingId&&['sessions','operations'].includes(view)&&journey?.snapshot().enabled){const prior=journey.references()[0];if(prior?.id!==cell.dataset.meetingId||prior.view!==view){journey.rememberReference({kind:'meeting',id:cell.dataset.meetingId,view});render();}}
 });
 render();return{update,reset:resetData};
}
