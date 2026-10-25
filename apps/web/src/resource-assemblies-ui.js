const dateInput=value=>{const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export function mountResourceAssembliesUI({app,openShop,notify=()=>{}}){
 const host=document.getElementById('businessStudioOperational');if(!host)return{clearForContext(){},setLocale(){}};
 const scope=()=>JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]),tx=(fr,en)=>document.documentElement.lang==='en'?en:fr;
 let current=scope(),generation=0,activity=0,loadSequence=0,loaded=false,translations=[];const busyCards=new Set();
 const root=document.createElement('details');root.id='resourceAssemblyPanel';root.className='panel economic-experiments';host.append(root);
 const n=(tag,fr,en,cls)=>{const node=document.createElement(tag);if(fr!==undefined)node.textContent=en===undefined?String(fr):tx(fr,en);if(en!==undefined)translations.push([node,fr,en]);if(cls)node.className=cls;return node;};
 const valid=(context,token)=>context===scope()&&token===generation;
 let list,status,form,lineBox,directory=[],creationAttempt;
 const message=(fr,en)=>{status.textContent=tx(fr,en);};
 const button=(fr,en,fn,kind='secondary',mutation=false)=>{const b=n('button',fr,en,kind);b.type='button';b.onclick=()=>{if(mutation&&b.closest('form')&&!b.closest('form').reportValidity())return;void run(b,fn,mutation);};return b;};
 async function run(control,fn,lockForm=false){
  if(control.disabled)return;activity++;const context=scope(),token=generation,article=control.closest('.resource-assembly-card'),container=article||(lockForm?control.closest('form')||control:control),controls=[...new Set([...container.querySelectorAll('input,select,textarea,button'),control])].map(node=>[node,node.disabled]);if(article)busyCards.add(article);for(const [node]of controls)node.disabled=true;
  try{await fn(()=>valid(context,token));}catch{if(valid(context,token))message('Action non confirmée. Vos champs sont conservés ; vérifiez les droits, la disponibilité et les conditions, puis réessayez.','Action not confirmed. Your fields are retained; check permissions, availability and terms, then retry.');}
  finally{if(article)busyCards.delete(article);for(const [node,disabled]of controls)if(node.isConnected)node.disabled=disabled;}
 }
 function field(parent,name,fr,en,type='text',value=''){
  const label=n('label'),input=n(type==='textarea'?'textarea':type==='select'?'select':'input');label.append(n('span',fr,en),input);input.name=name;input.required=true;if(input.tagName==='INPUT')input.type=type;if(type==='number'){input.min='1';input.step='1';input.max='1000000';}if(type!=='select')input.value=value;if('maxLength'in input&&['text','textarea'].includes(type))input.maxLength=type==='textarea'?1600:180;parent.append(label);return input;
 }
 function option(select,value,label,en){const o=n('option',label,en);o.value=value;select.append(o);return o;}
 function addLine(){
  if(lineBox.children.length>=4){message('Un plan contient au maximum 4 ressources.','A plan contains at most 4 resources.');return;}
  const row=n('fieldset',undefined,undefined,'form-grid resource-assembly-line');row.append(n('legend','Moyen demandé','Requested resource'));lineBox.append(row);
  field(row,'name','Usage prévu','Planned use');const shop=field(row,'shopId','Vitrine publique du propriétaire (membre du groupe)','Owner public shop (group member)','select'),stock=field(row,'stockItemId','Ressource publiée','Published resource','select');
  option(shop,'','Charger puis choisir une vitrine','Load then choose a shop');for(const item of directory)option(shop,item.id,item.name);option(stock,'','Choisir d’abord la vitrine','Choose the shop first');
  const units=field(row,'unit','Unité de la ressource','Resource unit');units.readOnly=true;field(row,'quantity','Quantité demandée','Requested quantity','number','1');field(row,'startsAt','Début souhaité','Desired start','datetime-local',dateInput(Date.now()+86400000));field(row,'endsAt','Fin souhaitée','Desired end','datetime-local',dateInput(Date.now()+2*86400000));field(row,'conditions','Durée, conditions et restitution à confirmer','Duration, terms and return to confirm','textarea');
  shop.onchange=()=>{const id=shop.value,context=scope(),token=generation;stock.replaceChildren();units.value='';option(stock,'','Chargement sur demande…','Loading on request…');void app.publicShop(id).then(data=>{if(!valid(context,token)||shop.value!==id||!row.isConnected)return;stock.replaceChildren();option(stock,'','Choisir une ressource','Choose a resource');for(const item of data.items){const o=option(stock,item.id,item.name+' · '+item.available+' '+item.unit);o.dataset.unit=item.unit;}}).catch(()=>{if(valid(context,token)&&shop.value===id)message('Vitrine non chargée. Réessayez en la sélectionnant.','Shop not loaded. Select it again to retry.');});};
  stock.onchange=()=>{units.value=stock.selectedOptions[0]?.dataset.unit||'';};row.append(button('Retirer cette ligne','Remove this line',()=>{row.remove();}));
 }
 async function loadDirectory(){
  const context=scope(),token=generation,rows=await app.shopDirectory();if(!valid(context,token))return;directory=rows;
  for(const select of lineBox.querySelectorAll('[name=shopId]')){const previous=select.value;select.replaceChildren();option(select,'','Choisir une vitrine','Choose a shop');for(const row of rows)option(select,row.id,row.name);select.value=previous;}
  message(rows.length?'Vitrines chargées. Choisissez un propriétaire membre du groupe courant.':'Aucune vitrine publique disponible.',rows.length?'Shops loaded. Choose an owner belonging to the current group.':'No public shop available.');
 }
 const names={TIME_RESERVED:['Créneau confirmé par le propriétaire','Time slot confirmed by owner'],BOOKING_ENDED:['Créneau terminé','Time slot ended'],RECHECK_REQUIRED:['Sources à relire sur demande','Recheck sources on request'],PROVISIONAL:['Provisoire · accord attendu','Provisional · awaiting agreement'],ACCEPTED_NOT_RESERVED:['Accord du propriétaire · non réservé','Owner accepted · not reserved'],CANONICAL_ORDER_LINKED:['Commande canonique relue','Canonical order reread'],SOURCE_NEEDS_REVIEW:['Source ou droits à revérifier','Source or permissions need review'],WITHDRAWN:['Retiré · vérifier séparément la commande','Withdrawn · check the order separately'],DECLINED:['Refusé','Declined'],ENDED:['Période terminée','Period ended']};
 function replaceCard(article,plan,submittedLine){const notes=new Map([...article.querySelectorAll('[data-assembly-line]')].filter(row=>row.dataset.assemblyLine!==submittedLine).map(row=>[row.dataset.assemblyLine,row.querySelector('[name=note]')?.value||''])),next=card(plan);for(const row of next.querySelectorAll('[data-assembly-line]')){const input=row.querySelector('[name=note]');if(input&&notes.has(row.dataset.assemblyLine))input.value=notes.get(row.dataset.assemblyLine);}article.replaceWith(next);}
 function card(plan){
  const article=n('article',undefined,undefined,'item resource-assembly-card');article.dataset.assemblyId=plan.id;
  article.append(n('h3',plan.own?plan.title:'Une demande pour mes ressources',plan.own?undefined:'A request for my resources'),n('p',plan.own?'Plan privé ; chaque propriétaire voit uniquement sa ligne.':'Les autres ressources, propriétaires et le titre privé du projet sont masqués.',plan.own?'Private plan; each owner sees only their line.':'Other resources, owners and the private project title are hidden.','hint'));
  article.append(button('Relire les sources et les droits','Recheck sources and permissions',async ok=>{const revision=activity,updated=await app.resourceAssembly(plan.id);if(ok()&&revision===activity)replaceCard(article,updated);else if(ok())message('Vos saisies sont conservées. Relancez la relecture quand vous êtes prêt.','Your input is retained. Recheck again when ready.');}));
  if(plan.state==='ARCHIVED')article.append(n('p','Plan archivé ; les commandes conservent leur parcours.','Archived plan; orders keep their own workflow.','truth-notice'));
  for(const line of plan.lines){
   const section=n('section',undefined,undefined,'stack');section.dataset.assemblyLine=line.id;section.append(n('strong',line.name),n('p',line.quantity+' '+line.unit+' · '+line.startsAt+' → '+line.endsAt),n('p',line.conditions),n('p',...(names[line.state]||[line.state,line.state]),'truth-notice'));
   if(line.reservation)section.append(n('p',line.reservation.state==='CONFIRMED'?'Réservation datée confirmée chez Market ; aucun paiement déduit.':'Réservation datée annulée avec trace.',line.reservation.state==='CONFIRMED'?'Timed reservation confirmed by Market; no payment inferred.':'Timed reservation cancelled with evidence.'));
    if(line.reservation)section.append(n('p',line.reservation.state==='CONFIRMED'?'Réservation datée confirmée chez Market ; aucun paiement déduit.':'Réservation datée annulée avec trace.',line.reservation.state==='CONFIRMED'?'Timed reservation confirmed by Market; no payment inferred.':'Timed reservation cancelled with evidence.'));
    if(line.decisionNote)section.append(n('p',line.decisionNote));if(line.proof)section.append(n('p','Commande liée : '+line.proof.orderId+' · paiement non déduit','Linked order: '+line.proof.orderId+' · payment not inferred'));
   const f=n('form',undefined,undefined,'form-grid');f.onsubmit=e=>e.preventDefault();const note=field(f,'note','Motif et vérifications effectuées','Reason and checks performed','textarea');section.append(f);
   const command=async(action,isCurrent,orderId)=>{if(!f.reportValidity())return;const updated=await app.updateResourceAssembly(plan.id,{expectedVersion:plan.version,action,lineId:line.id,note:note.value,orderId});if(isCurrent()){replaceCard(article,updated,line.id);message('Décision enregistrée ; aucune réservation ni annulation automatique.','Decision saved; no automatic reservation or cancellation.');}};
   if(line.reservation?.state==='CONFIRMED')f.append(button('Annuler explicitement le créneau','Explicitly cancel the slot',ok=>command('CANCEL_TIME',ok),'secondary',true));
    if(plan.state!=='ARCHIVED'){
    if(!plan.own&&line.calendarEnabled&&!line.reservation&&['REQUESTED','ACCEPTED'].includes(line.decision))f.append(button('Accepter et réserver ce créneau','Accept and reserve this time slot',ok=>command('RESERVE_TIME',ok),'primary',true));
     if(!plan.own&&line.decision!=='WITHDRAWN'){f.append(button('Accepter ces conditions sans réserver','Accept these terms without reserving',ok=>command('ACCEPT',ok),'secondary',true),button('Refuser avec motif','Decline with reason',ok=>command('DECLINE',ok),'secondary',true));}
    if(plan.own&&line.state==='ACCEPTED_NOT_RESERVED'){
     f.append(button('Vérifier et réserver dans la boutique','Review and reserve in the shop',async()=>{await openShop?.(line.shopId);}));const orders=field(f,'orderId','Commande déjà réservée pour cette ressource','Order already reserved for this resource','select');orders.required=false;option(orders,'','Charger mes achats compatibles','Load my matching purchases');
     f.append(button('Charger mes achats compatibles','Load my matching purchases',async ok=>{const purchases=await app.myPurchases();if(!ok())return;orders.replaceChildren();option(orders,'','Choisir une commande à relire','Choose an order to reread');for(const order of purchases.filter(x=>x.data.stockItemId===line.stockItemId&&x.data.marketScopeId===line.shopId))option(orders,order.id,order.id+' · '+order.data.quantity+' '+order.data.unit);}));
     f.append(button('Relier cette commande après vérification','Link this order after review',ok=>command('LINK_ORDER',ok,orders.value),'secondary',true));
    }
    if(line.decision!=='WITHDRAWN')f.append(button('Retirer cet accord ou ce besoin','Withdraw this agreement or need',ok=>command('WITHDRAW',ok),'secondary',true));
   }else if(line.reservation?.state!=='CONFIRMED')f.remove();article.append(section);
  }
  if(plan.own&&plan.state!=='ARCHIVED')article.append(button('Archiver le plan sans annuler les commandes','Archive the plan without cancelling orders',async ok=>{const updated=await app.updateResourceAssembly(plan.id,{expectedVersion:plan.version,action:'ARCHIVE'});if(ok())replaceCard(article,updated);}));
  return article;
 }
 async function load(){
   if(busyCards.size){message('Une vérification ou décision est en cours. Actualisez après sa confirmation.','A check or decision is in progress. Refresh after its confirmation.');return;}
  const context=scope(),token=generation,sequence=++loadSequence,revision=activity,response=await app.resourceAssemblies();if(!valid(context,token)||sequence!==loadSequence)return;
  if(revision!==activity){message('Vos saisies sont conservées. Relisez les changements avec Actualiser quand vous êtes prêt.','Your input is retained. Use Refresh to review changes when ready.');return;}
  loaded=true;list.replaceChildren(...response.items.map(card));if(!response.items.length)list.append(n('p','Aucun plan ou demande autorisé dans cet espace.','No authorized plan or request in this space.'));
 }
 function mount(){
  translations=[];root.replaceChildren(n('summary','Assembler des moyens · accords et réservations','Assemble resources · agreements and reservations'));
  root.append(n('p','Chaque propriétaire confirme uniquement sa ressource. Les intentions ne réservent rien. Réservez séparément dans la boutique puis reliez la commande existante. Retirer ou archiver ce plan n’annule jamais une commande.','Each owner confirms only their resource. Intentions reserve nothing. Reserve separately in the shop, then link the existing order. Withdrawing or archiving this plan never cancels an order.','truth-notice'));
  root.append(n('p','Jusqu’à 4 ressources de membres du groupe. Relisez les sources sur demande. Pour une ressource dont le calendrier est activé, le propriétaire peut confirmer un créneau sous contrôle de capacité Market. Pour une vente ordinaire, reliez la commande canonique. Toute annulation du créneau est explicite ; aucun paiement, renouvellement ou remboursement automatique.','Up to 4 resources from group members. Recheck sources on request. For a resource with its calendar enabled, the owner can confirm a slot under Market capacity checks. For an ordinary sale, link its canonical order. Slot cancellation is explicit; no automatic payment, renewal or refund.','hint'));
  status=n('p',undefined,undefined,'truth-notice');status.setAttribute('role','status');root.append(status,button('Actualiser mes plans et demandes','Refresh my plans and requests',load));
  form=n('form',undefined,undefined,'form-grid');form.id='resourceAssemblyCreate';field(form,'title','Nom privé du plan','Private plan name');lineBox=n('div',undefined,undefined,'stack');form.append(lineBox);addLine();form.append(button('Charger les vitrines publiques','Load public shops',loadDirectory),button('Ajouter un moyen','Add a resource',addLine));
  const consent=field(form,'consent','Je partage chaque ligne avec son propriétaire pour lui demander son accord','Share each line with its owner to request their agreement','checkbox');consent.value='yes';
  const create=button('Créer les demandes sans réserver','Create requests without reserving',async ok=>{
   const selected=[...lineBox.children].map(row=>Object.fromEntries([...row.querySelectorAll('input,textarea,select')].map(input=>[input.name,input.value])));
   const payload={title:form.elements.title.value,groupId:app.activeGroup(),consent:consent.checked,lines:selected.map(row=>({...row,quantity:Number(row.quantity),startsAt:new Date(row.startsAt).toISOString(),endsAt:new Date(row.endsAt).toISOString()}))},signature=JSON.stringify(payload);if(creationAttempt?.signature!==signature)creationAttempt={signature,key:crypto.randomUUID()};
   const result=await app.createResourceAssembly({...payload,idempotencyKey:creationAttempt.key});
   if(ok()){const existing=[...list.children].find(row=>row.dataset.assemblyId===result.id);if(existing)replaceCard(existing,result);else list.prepend(card(result));form.reset();lineBox.replaceChildren();addLine();notify(tx('Demandes enregistrées ; rien n’est réservé.','Requests saved; nothing is reserved.'));}
  },'primary',true);form.append(create);form.onsubmit=e=>{e.preventDefault();create.click();};root.append(form);list=n('div',undefined,undefined,'stack');root.append(list);form.hidden=!app.currentActor()||!app.activeGroup();
 }
 root.addEventListener('input',()=>activity++);root.addEventListener('change',()=>activity++);root.addEventListener('toggle',()=>{if(root.open&&!loaded)void run(root.querySelector('summary'),load);});
 function clearForContext(force=false){const next=scope();if(!force&&next===current)return;current=next;generation++;activity++;loadSequence++;loaded=false;directory=[];creationAttempt=undefined;busyCards.clear();mount();}
 function setLocale(){translations=translations.filter(([node])=>node.isConnected);for(const [node,fr,en]of translations)node.textContent=tx(fr,en);}
 mount();return{clearForContext,setLocale};
}
