const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const localDate=value=>{const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
const parse=s=>{try{return JSON.parse(String(s));}catch{return null;}};
const values=form=>Object.fromEntries(new FormData(form));
const optional=v=>v===''||v===undefined?null:Number(v);
const costs=data=>Object.fromEntries(['MATERIALS','TRANSPORT','LABOUR','FEES','OTHER'].map(k=>[k,optional(data[k])]));
export function mountEconomicExperimentsUI({app,isManager=()=>false,notify=()=>{}}){
 const tx=(fr,en)=>document.documentElement.lang==='en'?en:fr;
 const scope=()=>JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]);
 let current=scope(),generation=0,experimentPanel,poolPanel,experimentBox,poolBox,experimentForm,poolForm;
 const money=(n,currency='XAF')=>n===null||n===undefined?tx('Inconnu','Unknown'):new Intl.NumberFormat(document.documentElement.lang==='en'?'en-GB':'fr-FR',{maximumFractionDigits:0}).format(n)+' '+currency;
 const button=(text,action)=>{const b=el('button',text,'secondary');b.type='button';b.onclick=()=>{const context=scope(),version=generation;void Promise.resolve().then(action).catch(()=>{if(context===scope()&&version===generation)notice(b.parentElement,tx('Action non confirmée. Réessayez.','Action not confirmed. Retry.'));});};return b;};
 const field=(form,name,label,{type='text',required=true,value='',choices}={})=>{
  const l=el('label',label),input=el(choices?'select':type==='textarea'?'textarea':'input');
  input.name=name;if(input.tagName==='INPUT')input.type=type;input.required=required;
  if(type==='number'){input.min='0';input.step='any';input.inputMode='decimal';}
  if(choices)for(const [v,t] of choices){const o=el('option',t);o.value=v;input.append(o);}
  if(type==='checkbox')input.checked=value===true;else{input.value=value;if('defaultValue'in input)input.defaultValue=value;}
  if(type==='hidden')form.append(input);else{l.append(input);form.append(l);}return input;
 };
 const notice=(parent,message)=>{const p=el('p',message,'truth-notice');p.setAttribute('role','status');parent.append(p);return p;};
 const busy=async(form,payload,action,done)=>{
  if(form.dataset.busy==='true')return;const context=scope(),version=generation;form.dataset.busy='true';
  form.querySelectorAll('[data-operation-feedback]').forEach(n=>n.remove());
  const signature=JSON.stringify(payload);if(form.dataset.signature!==signature){form.dataset.signature=signature;form.dataset.requestKey=crypto.randomUUID();}
  const controls=[...form.querySelectorAll('input,select,textarea,button')].map(node=>[node,node.disabled]);for(const [node]of controls)node.disabled=true;
  try{const result=await action({...payload,idempotencyKey:form.dataset.requestKey});if(context===scope()&&version===generation)await done(result);}
  catch{if(context===scope()&&version===generation){const p=notice(form,tx('Opération non confirmée. Vos champs sont conservés. Réessayez avec les mêmes valeurs.','Operation not confirmed. Your fields are retained. Retry with the same values.'));p.dataset.operationFeedback='true';}}
  finally{form.dataset.busy='false';for(const [node,disabled]of controls)node.disabled=disabled;}
 };
 function form(title,submit){const f=el('form',undefined,'form-grid');f.append(el('h3',title));const b=el('button',submit,'primary');b.type='submit';return{f,finish:()=>f.append(b)};}
 function costFields(f){
  const names={MATERIALS:tx('Matières / achats','Materials / purchases'),TRANSPORT:tx('Transport','Transport'),LABOUR:tx('Main-d’œuvre','Labour'),FEES:tx('Frais','Fees'),OTHER:tx('Autres coûts','Other costs')};
  for(const key of Object.keys(names))field(f,key,names[key]+tx(' · vide = inconnu ; 0 = aucun',' · blank = unknown; 0 = none'),{type:'number',required:false});
  field(f,'minutes',tx('Temps de travail (minutes) · facultatif','Work time (minutes) · optional'),{type:'number',required:false});
 }
 function createExperimentForm(){
  const {f,finish}=form(tx('Préparer une expérience privée','Prepare a private experiment'),tx('Enregistrer les hypothèses','Save hypotheses'));f.id='businessExperimentCreate';
  field(f,'title',tx('Nom de l’expérience','Experiment name'));
  field(f,'customer',tx('Clientèle visée (privé)','Target customers (private)'));
  field(f,'problem',tx('Problème à résoudre','Problem to solve'),{type:'textarea'});
  field(f,'offer',tx('Offre à tester','Offer to test'),{type:'textarea'});
  field(f,'quantity',tx('Quantité prévisionnelle','Forecast quantity'),{type:'number'});
  field(f,'unit',tx('Unité','Unit'),{value:'unité'});
  field(f,'price0',tx('Premier prix à comparer (XAF)','First price to compare (XAF)'),{type:'number'});
  field(f,'price1',tx('Second prix à comparer (XAF)','Second price to compare (XAF)'),{type:'number'});
  costFields(f);
  field(f,'endsAt',tx('Fin choisie de l’expérience','Chosen experiment end'),{type:'datetime-local',value:localDate(Date.now()+7*86400000)});
  field(f,'minimumOrders',tx('Seuil de commandes livrées · facultatif','Delivered order threshold · optional'),{type:'number',required:false});
  field(f,'minimumGrossMargin',tx('Seuil de marge brute (XAF) · facultatif','Gross margin threshold (XAF) · optional'),{type:'number',required:false});
  field(f,'previousExperimentId','',{type:'hidden',required:false});finish();
  f.onsubmit=e=>{e.preventDefault();const d=values(f);void busy(f,{title:d.title,customer:d.customer,problem:d.problem,offer:d.offer,quantity:Number(d.quantity),unit:d.unit,currency:'XAF',prices:[Number(d.price0),Number(d.price1)],costs:costs(d),minutes:optional(d.minutes),endsAt:new Date(d.endsAt).toISOString(),minimumOrders:optional(d.minimumOrders),minimumGrossMargin:optional(d.minimumGrossMargin),previousExperimentId:d.previousExperimentId||undefined},x=>app.createBusinessExperiment(x),async()=>{f.reset();f.elements.endsAt.value=localDate(Date.now()+7*86400000);notify(tx('Hypothèses enregistrées, aucune vente créée.','Hypotheses saved; no sale created.'));await loadExperiments();});};
  return f;
 }
 function revise(r){
  experimentForm.reset();const d=r.data,p=parse(d.pricesJson)||[],c=parse(d.costsJson)||{};
  const inputs={title:r.title,customer:d.customer,problem:d.problem,offer:d.offer,quantity:d.quantity,unit:d.unit,price0:p[0],price1:p[1],...c,minutes:d.minutes,previousExperimentId:r.id,minimumOrders:d.minimumOrders,minimumGrossMargin:d.minimumGrossMargin};
  for(const [k,v]of Object.entries(inputs))if(experimentForm.elements[k])experimentForm.elements[k].value=v===null?'':String(v??'');
  experimentForm.elements.endsAt.value=localDate(Date.now()+7*86400000);experimentForm.scrollIntoView({block:'start'});experimentForm.elements.title.focus();
 }
 function download(name,data){
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function showReview(card,id,observationId){
  const context=scope(),version=generation;const view=await app.reviewBusinessExperiment(id,observationId);
  if(context!==scope()||version!==generation)return;
  let output=card.querySelector('.experiment-review');if(!output){output=el('section',undefined,'experiment-review stack');card.append(output);}output.replaceChildren();
  const table=el('table',undefined,'data-table'),head=el('tr');
  for(const t of [tx('Prix','Price'),tx('Ventes prévues','Forecast revenue'),tx('Marge prévisionnelle','Forecast gross margin')])head.append(el('th',t));table.append(head);
  for(const f of view.forecasts){const row=el('tr');row.append(el('td',money(f.unitPrice)),el('td',money(f.forecastRevenue)),el('td',money(f.grossMargin)));table.append(row);}
  output.append(table);
  if(view.totalLinkedOrders>view.orderReadLimit)notice(output,tx('Comparaison partielle : 20 commandes relues au maximum. Aucun bénéfice complet n’est conclu.','Partial comparison: at most 20 orders reread. No complete profit is inferred.'));
  const o=view.observed;output.append(el('p',tx('Livraisons nettes de retours : ','Deliveries net of returns: ')+(o.netDelivered===null?tx('inconnu','unknown'):o.netDelivered)+' '+view.experiment.data.unit+' · '+tx('Valeur contractuelle livrée : ','Delivered contract value: ')+money(o.deliveredContractValue)),el('p',tx('Marge brute observée : ','Observed gross margin: ')+money(o.grossMargin)+' · '+tx('Trésorerie déclarée : ','Declared cash flow: ')+money(o.cashFlowDeclared)),el('p',tx('Décision : ','Decision: ')+({NO_THRESHOLD:tx('aucun seuil choisi','no chosen threshold'),NOT_CONFIRMED:tx('non confirmé : données incomplètes','not confirmed: incomplete data'),THRESHOLD_MET:tx('seuil atteint','threshold met'),THRESHOLD_NOT_MET:tx('seuil non atteint','threshold not met')}[view.decision]??view.decision)));
  if(o.missingCosts.length){const names={MATERIALS:tx('matières et achats','materials and purchases'),TRANSPORT:tx('transport','transport'),LABOUR:tx('main-d’œuvre','labour'),FEES:tx('frais','fees'),OTHER:tx('autres coûts','other costs')};output.append(el('p',tx('Coûts inconnus : ','Unknown costs: ')+o.missingCosts.map(k=>names[k]??k).join(', '),'truth-notice'));}
  for(const order of view.orders)output.append(el('p',order.orderId+' · '+(order.status==='CANONICAL_READ'?tx('relue chez le propriétaire','reread from the owner'):tx('non comparable ou accès actuel indisponible','not comparable or current access unavailable')),'hint'));
  const picker=el('select');picker.setAttribute('aria-label',tx('Observation à comparer','Observation to compare'));picker.append(Object.assign(el('option',tx('Sans observation déclarée','No declared observation')),{value:''}));
  for(const obs of view.observations){const opt=el('option',obs.data.note);opt.value=obs.id;picker.append(opt);}picker.value=observationId||'';
  output.append(picker,button(tx('Comparer cette observation','Compare this observation'),()=>showReview(card,id,picker.value||undefined)));
  output.append(button(tx('Exporter ce dossier privé (JSON)','Export this private dossier (JSON)'),async()=>{download('eco-business-experiment.json',view);}));
  for(const index of [0,1])output.append(button(tx('Préparer le prix ','Prepare price ')+(index+1),async()=>{
   const draft=await app.businessExperimentDraft(id,index);if(context!==scope()||version!==generation)return;
   if(window.confirm(tx('Exporter uniquement le brouillon public choisi ? Aucune publication automatique.','Export only the selected public draft? Nothing is published automatically.')))download('eco-offer-draft.json',draft);
  }));
 }
 async function loadExperiments(){
  if(!app.currentActor())return;const context=scope(),version=generation;experimentBox.replaceChildren(el('p',tx('Chargement…','Loading…')));
  try{
   const result=await app.businessExperiments();if(context!==scope()||version!==generation)return;experimentBox.replaceChildren();
   if(!result.items.length)experimentBox.append(el('p',tx('Aucune expérience. Les données de démonstration ne sont pas ajoutées à votre compte.','No experiment. Demonstration data is not inserted into your account.')));
   if(result.total>result.limit)notice(experimentBox,tx('Les 100 expériences les plus récentes sont affichées ; les autres restent conservées.','The 100 most recent experiments are shown; the others are retained.'));
   for(const r of result.items){
    const card=el('article',undefined,'item stack');card.dataset.experimentId=r.id;card.append(el('h3',r.title),el('p',r.data.problem),el('p',r.data.offer),el('small',tx('Fin : ','End: ')+new Date(r.data.endsAt).toLocaleString()));
    card.append(button(tx('Comparer les prix et résultats','Compare prices and results'),()=>showReview(card,r.id).catch(()=>notice(card,tx('Comparaison indisponible. Réessayez.','Comparison unavailable. Retry.')))),button(tx('Créer une variante, conserver l’original','Create a variant, keep the original'),async()=>revise(r)));
    const link=form(tx('Relier une commande canonique','Link a canonical order'),tx('Relier sans recopier les ventes','Link without copying sales'));
    field(link.f,'orderId',tx('Référence de commande de votre boutique / groupe','Order reference from your shop / group'));link.finish();
    link.f.onsubmit=e=>{e.preventDefault();void busy(link.f,values(link.f),x=>app.linkBusinessExperimentOrder(r.id,x.orderId),async()=>{link.f.reset();await showReview(card,r.id);});};card.append(link.f);
    const obs=form(tx('Consigner les coûts et mesures constatés','Record observed costs and measurements'),tx('Conserver cette observation','Keep this observation'));costFields(obs.f);
    field(obs.f,'cashReceived',tx('Encaissement déclaré (XAF) · non confirmé par paiement','Declared cash received (XAF) · payment not inferred'),{type:'number',required:false});
    field(obs.f,'note',tx('Observation et prochaine expérience','Observation and next experiment'),{type:'textarea'});obs.finish();
    obs.f.onsubmit=e=>{e.preventDefault();const d=values(obs.f);void busy(obs.f,{costs:costs(d),minutes:optional(d.minutes),cashReceived:optional(d.cashReceived),note:d.note},x=>app.observeBusinessExperiment(r.id,x),async o=>{obs.f.reset();await showReview(card,r.id,o.id);});};card.append(obs.f);experimentBox.append(card);
   }
  }catch{if(context===scope()&&version===generation)experimentBox.replaceChildren(el('p',tx('Expériences non chargées. Réessayez lorsque la connexion est disponible.','Experiments not loaded. Retry when connected.')));}
 }
 async function loadPools(){
  if(!app.currentActor())return;const context=scope(),version=generation;poolBox.replaceChildren();if(poolForm)poolForm.hidden=!isManager();
  if(!app.activeGroup()){poolBox.append(el('p',tx('Sélectionnez un groupe.','Select a group.')));return;}
  try{
   const result=await app.valuePools();if(context!==scope()||version!==generation)return;poolBox.replaceChildren();
   if(!result.items.length)poolBox.append(el('p',tx('Aucun besoin mutualisé.','No pooled need.')));
   for(const v of result.items){
    const r=v.record,card=el('article',undefined,'item stack');card.dataset.poolId=r.id;
    card.append(el('h3',r.title),el('p',v.quantity+' '+v.unit+' · '+v.participants+' '+tx('participants volontaires','voluntary participants')),el('p',v.state==='OPEN'?tx('Ouvert','Open'):v.state==='EXPIRED'?tx('Expiré','Expired'):tx('Fermé','Closed')),el('small',tx('Échéance : ','Deadline: ')+new Date(r.data.neededBy).toLocaleString()));
    if(v.ownContribution)card.append(el('p',tx('Votre participation : ','Your contribution: ')+v.ownContribution.quantity+' '+v.ownContribution.unit+' · '+(v.ownContribution.effective?tx('prise en compte','included'):tx('retirée ou inactive','withdrawn or inactive'))));
    if(v.state==='OPEN'&&!v.ownContribution){
     const f=form(tx('Participer volontairement','Contribute voluntarily'),tx('Confirmer mon besoin','Confirm my need'));
     field(f.f,'quantity',tx('Ma quantité','My quantity'),{type:'number'});field(f.f,'unit',tx('Unité de ma quantité','My quantity unit'),{value:v.unit});
     field(f.f,'consent',tx('J’autorise uniquement le total agrégé, sans publier mon identité ni commander','I consent only to the aggregate total, without publishing my identity or placing an order'),{type:'checkbox'});f.finish();
     f.f.onsubmit=e=>{e.preventDefault();const d=values(f.f);void busy(f.f,{quantity:Number(d.quantity),unit:d.unit,consent:f.f.elements.consent.checked},x=>app.actOnValuePool(r.id,'contribute',x),async()=>loadPools());};card.append(f.f);
    }
    if(v.ownContribution&&!v.ownContribution.withdrawn)card.append(button(tx('Retirer ma participation','Withdraw my contribution'),async()=>{try{await app.actOnValuePool(r.id,'withdraw');if(context===scope()&&version===generation)await loadPools();}catch{notice(card,tx('Retrait non confirmé. Réessayez.','Withdrawal not confirmed. Retry.'));}}));
    if(v.state==='OPEN'&&v.quantity>0)card.append(button(tx('Chercher des offres pour le total actuel','Find offers for the current total'),async()=>{
     try{const result=await app.valuePoolMatches(r.id);if(context!==scope()||version!==generation)return;
      let box=card.querySelector('.pool-matches');if(!box){box=el('div',undefined,'pool-matches stack');card.append(box);}box.replaceChildren();
      if(!result.items.length)notice(box,tx('Aucune offre compatible. Revoyez la quantité, l’unité, la zone, la date ou les contraintes.','No compatible offer. Review quantity, unit, area, date or constraints.'));
      for(const m of result.items.slice(0,10)){const row=el('article',undefined,'item');row.append(el('strong',m.offer.title),el('p',money(m.landedTotal)),el('p',m.explanations.join(' · ')),el('small',m.warnings.join(' · ')));box.append(row);}
      notice(box,tx('Ce rapprochement ne réserve rien. Revalidez quantités et accord dans le parcours commercial avant tout engagement.','This match reserves nothing. Revalidate quantities and agreement in commerce before any commitment.'));
     }catch{notice(card,tx('Rapprochement indisponible. Actualisez les participations.','Matching unavailable. Refresh contributions.'));}
    }));
    if(v.state==='OPEN'&&isManager())card.append(button(tx('Fermer ce besoin mutualisé','Close this pooled need'),async()=>{if(!window.confirm(tx('Fermer ce besoin ? Les participations et retraits resteront conservés.','Close this need? Contributions and withdrawals will remain recorded.')))return;try{await app.actOnValuePool(r.id,'close');if(context===scope()&&version===generation)await loadPools();}catch{notice(card,tx('Fermeture non confirmée.','Closure not confirmed.'));}}));
    poolBox.append(card);
   }
  }catch{if(context===scope()&&version===generation)poolBox.replaceChildren(el('p',tx('Besoins non chargés. Réessayez lorsque la connexion est disponible.','Needs not loaded. Retry when connected.')));}
 }
 function mount(){
  const businessHost=document.getElementById('businessStudioOperational'),valueHost=document.getElementById('valueNetworkOperational');if(!businessHost||!valueHost)return;
  document.getElementById('businessExperimentsPanel')?.remove();document.getElementById('pooledNeedsPanel')?.remove();
  experimentPanel=el('details',undefined,'panel economic-experiments');experimentPanel.id='businessExperimentsPanel';
  experimentPanel.append(el('summary',tx('Expériences · prix · résultats réels','Experiments · prices · actual results')));
  notice(experimentPanel,tx('Dossier privé. Les hypothèses et coûts inconnus ne deviennent ni ventes ni paiements. Les commandes liées sont relues avec vos droits actuels.','Private dossier. Hypotheses and unknown costs become neither sales nor payments. Linked orders are reread using your current rights.'));
  experimentForm=createExperimentForm();experimentBox=el('div',undefined,'stack');experimentPanel.append(experimentForm,button(tx('Actualiser mes expériences','Refresh my experiments'),loadExperiments),experimentBox);
  experimentPanel.addEventListener('toggle',()=>{if(experimentPanel.open&&!experimentBox.childElementCount)void loadExperiments();});businessHost.append(experimentPanel);
  poolPanel=el('details',undefined,'panel economic-experiments');poolPanel.id='pooledNeedsPanel';poolPanel.append(el('summary',tx('Besoins mutualisés avec consentement','Pooled needs with consent')));
  notice(poolPanel,tx('Chaque membre confirme sa quantité pour le total du groupe. Il peut la retirer. Aucun nom ni besoin individuel n’est publié. Une participation n’est pas une commande ; un retrait est définitif pour ce besoin.','Each member confirms their quantity for the group total and may withdraw it. No individual name or need is published. Participation is not an order; withdrawal is final for this need.'));
  const f=form(tx('Ouvrir un besoin mutualisé','Open a pooled need'),tx('Ouvrir sans engagement commercial','Open without a commercial commitment'));poolForm=f.f;poolForm.id='valuePoolCreate';
  field(poolForm,'title',tx('Besoin commun','Common need'));field(poolForm,'category',tx('Catégorie','Category'));field(poolForm,'unit',tx('Unité du total','Aggregate unit'),{value:'kg'});field(poolForm,'locality',tx('Zone approximative','Approximate area'),{required:false});field(poolForm,'neededBy',tx('Échéance','Deadline'),{type:'datetime-local',value:localDate(Date.now()+7*86400000)});field(poolForm,'specification',tx('Contraintes indispensables','Required specification'),{required:false});field(poolForm,'quality',tx('Qualité indispensable','Required quality'),{required:false});f.finish();poolForm.hidden=!isManager();
  poolForm.onsubmit=e=>{e.preventDefault();const d=values(poolForm);void busy(poolForm,{...d,neededBy:new Date(d.neededBy).toISOString()},x=>app.createValuePool(x),async()=>{poolForm.reset();poolForm.elements.neededBy.value=localDate(Date.now()+7*86400000);await loadPools();});};
  poolBox=el('div',undefined,'stack');poolPanel.append(poolForm,button(tx('Actualiser les participations','Refresh contributions'),loadPools),poolBox);
  poolPanel.addEventListener('toggle',()=>{if(poolPanel.open&&!poolBox.childElementCount)void loadPools();});valueHost.append(poolPanel);
 }
 function clearForContext(force=false){const next=scope();if(!force&&next===current){if(poolForm)poolForm.hidden=!isManager();return;}current=next;generation++;mount();}
 function setLocale(){const snapshot=f=>f?{fields:Object.fromEntries([...f.elements].filter(x=>x.name).map(x=>[x.name,x.type==='checkbox'?x.checked:x.value])),key:f.dataset.requestKey,signature:f.dataset.signature}:null;const saved=snapshot(experimentForm),pool=snapshot(poolForm);clearForContext(true);for(const [form,data]of [[experimentForm,saved],[poolForm,pool]])if(form&&data){for(const [key,value]of Object.entries(data.fields))if(form.elements[key]){if(form.elements[key].type==='checkbox')form.elements[key].checked=value;else form.elements[key].value=value;}if(data.key)form.dataset.requestKey=data.key;if(data.signature)form.dataset.signature=data.signature;}}
 function open(kind){clearForContext();const target=kind==='experiments'?experimentPanel:poolPanel;if(!target)return;for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;target.scrollIntoView({block:'start'});}
 mount();return{clearForContext,setLocale,open};
}
