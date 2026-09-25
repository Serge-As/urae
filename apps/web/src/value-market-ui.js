const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const row=(label,value)=>{const p=el('p');const b=el('strong',label+' : ');p.append(b,document.createTextNode(String(value??'—')));return p;};
const field=(label,node,className='')=>{const l=el('label',undefined,className);l.append(document.createTextNode(label),node);return l;};
const button=(label,className='secondary')=>{const b=el('button',label,className);b.type='button';return b;};
const localDateTime=(date=new Date())=>{const d=new Date(date.getTime()-date.getTimezoneOffset()*60000);return d.toISOString().slice(0,16);};
const dateLabel=value=>{try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value??'—');}};
const num=input=>Math.trunc(Number(input.value||0));
const money=(value,fmt)=>fmt?fmt(Number(value??0)):new Intl.NumberFormat('fr-FR').format(Number(value??0))+' F CFA';
const parseJson=value=>{try{return JSON.parse(String(value??'[]'));}catch{return[];}};
const tiersFromText=value=>String(value??'').split(',').map(x=>x.trim()).filter(Boolean).map(part=>{const [q,p]=part.split(':').map(x=>x.trim());return{minQty:Math.trunc(Number(q)),price:Math.trunc(Number(p))};});
const levelLabel=level=>({0:'0 · Texte',1:'1 · Image / audio',2:'2 · Vidéo courte',3:'3 · Live interactif'})[Number(level)]??String(level);
const dealTypeLabel=value=>({
  PUBLIC_DEAL:'Public Deal',GROUP_DEAL:'Group Deal',SUPPLIER_DEAL:'Supplier Deal',FRESH_DEAL:'Fresh Deal',
  BULK_DEAL:'Bulk Deal',INSTITUTIONAL_DEAL:'Institutional Deal'
})[value]??value;
const flashTypeLabel=value=>({NOW_LIQUIDATION:'NOW Liquidation',SURPLUS_NOW:'Surplus NOW',RESCUE_DEAL:'Rescue Deal'})[value]??value;
const statePill=value=>el('span',String(value??'—'),'pill value-market-state state-'+String(value??'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-'));

export function mountValueMarketUI({app,getMembers=()=>[],isManager=()=>false,notify=()=>{},showError=console.error,navigate=()=>{},fmt=n=>String(n)}){
  const root=document.getElementById('valueMarketRoot');if(!root)return{refresh:async()=>{}};
  let snapshot={flashOffers:[],requests:[],responses:[],deals:[],liveMarkets:[]},core=[],anticipations=[],hubs=[],internalDeals=[],socket;

  const activeGroup=()=>app.activeGroup();
  const members=()=>getMembers().filter(x=>x.status!=='left');
  const selfMember=()=>members().find(x=>x.userId===app.currentActor?.());
  const stocks=()=>core.filter(x=>x.data?.marketKind==='STOCK_ITEM');
  const suppliers=()=>core.filter(x=>x.data?.marketKind==='SUPPLIER');
  const dealRows=()=>isManager()&&internalDeals.length?internalDeals:snapshot.deals;
  const byDeal=id=>dealRows().find(x=>x.id===id)||snapshot.deals.find(x=>x.id===id);
  const availableStock=item=>Math.max(0,Number(item?.data?.quantity??0)-Number(item?.data?.reserved??0));

  const safe=async(fn)=>{try{return await fn();}catch(e){showError(e);throw e;}};

  const selectOf=(rows,labelOf,blank='—')=>{const s=document.createElement('select');s.append(new Option(blank,''));for(const x of rows)s.append(new Option(labelOf(x),x.id));return s;};
  const metric=(label,value)=>{const a=el('article',undefined,'metric');a.append(el('span',label),el('strong',String(value)));return a;};

  const connectLive=()=>{
    try{
      socket?.close();socket=undefined;if(!activeGroup())return;
      const ws=new WebSocket(app.liveWebSocketUrl());socket=ws;
      ws.onmessage=event=>{try{const msg=JSON.parse(event.data),e=msg?.event;if(msg?.type==='GROUP_LIVE_EVENT'&&e?.type==='COMMUNITY_EVENT'&&String(e.payload?.domain??'')==='VALUE_MARKET')void refresh();}catch{}};
    }catch{}
  };

  const load=async()=>{
    if(!activeGroup())return;
    const tasks=[app.valueMarketSnapshot(),app.listCommunityHubs().catch(()=>[])];
    if(isManager())tasks.push(app.listWorkspaceRecords('MARKETPLACE.CORE',activeGroup()).catch(()=>[]),app.listWorkspaceRecords('GROUP.ANTICIPATION',activeGroup()).catch(()=>[]),app.ecoDealsInternal().catch(()=>[]));
    const values=await Promise.all(tasks);
    snapshot=values[0]??snapshot;hubs=values[1]??[];
    if(isManager()){core=values[2]??[];anticipations=(values[3]??[]).filter(x=>['ACTIVE','DONE'].includes(x.status)&&x.data?.humanValidated===true);internalDeals=values[4]??[];}
    else{core=[];anticipations=[];internalDeals=[];}
  };

  const renderHeader=()=>{
    const head=el('section',undefined,'value-market-hero');
    const title=el('div');title.append(el('span','Community & Value Network · étapes 14–17 + 19','eyebrow'),el('h2','Marché de valeur opérationnel'),el('p','Liquidation honnête, demande anticipée validée, Reverse Market, Deals négociés et Live Market utilisent le même stock, les mêmes fournisseurs, les mêmes commandes et les mêmes preuves que le Marketplace canonique.'));
    const refreshBtn=button('Actualiser','primary');refreshBtn.onclick=()=>void refresh();const top=el('div',undefined,'panel-head');top.append(title,refreshBtn);head.append(top);
    const guard=el('p','Engagement ≠ paiement : cette version organise les offres, réservations, réponses et commandes. Aucun débit réel ni Mobile Money n’est déclenché tant que la passerelle de paiement réel reste désactivée.','truth-notice');head.append(guard);
    const metrics=el('div',undefined,'metrics small');
    metrics.append(metric('Offres urgentes',snapshot.flashOffers.filter(x=>String(x.data?.state)==='OPEN').length),metric('Demandes marché',snapshot.requests.filter(x=>!['CLOSED'].includes(String(x.data?.state))).length),metric('Deals',snapshot.deals.filter(x=>!['CLOSED','EXPIRED'].includes(String(x.data?.state))).length),metric('Live programmés / actifs',snapshot.liveMarkets.filter(x=>['SCHEDULED','LIVE'].includes(String(x.data?.state))).length));head.append(metrics);
    root.append(head);
  };

  const renderFlashOffers=()=>{
    const section=el('section',undefined,'value-market-block');section.id='valueMarketFlash';section.append(el('h3','14 · NOW Liquidation · Surplus NOW · Rescue Deal'),el('p','Une baisse de prix n’est publiée qu’avec sa raison, l’état réel du produit, la date d’observation, la quantité disponible et une divulgation explicite. Aucun faux rabais ni défaut caché.','hint'));
    if(isManager()){
      const form=el('form',undefined,'form-grid value-market-form'),type=document.createElement('select'),stock=selectOf(stocks(),x=>x.title+' · '+availableStock(x)+' disponible(s)','Choisir le stock'),quantity=document.createElement('input'),original=document.createElement('input'),offer=document.createElement('input'),observed=document.createElement('input'),expires=document.createElement('input'),reason=document.createElement('textarea'),condition=document.createElement('input'),disclosure=document.createElement('textarea'),submit=el('button','Publier l’offre transparente','primary');
      for(const [v,l] of [['NOW_LIQUIDATION','NOW Liquidation · écoulement rapide'],['SURPLUS_NOW','Surplus NOW · surplus agricole/commercial'],['RESCUE_DEAL','Rescue Deal · conforme mais à vendre vite']])type.append(new Option(l,v));
      quantity.type='number';quantity.min='1';quantity.step='1';original.type='number';original.min='1';offer.type='number';offer.min='0';observed.type='datetime-local';observed.value=localDateTime();expires.type='datetime-local';expires.value=localDateTime(new Date(Date.now()+24*3600000));reason.rows=2;reason.placeholder='Pourquoi le prix baisse réellement ?';condition.placeholder='État / qualité / conservation';disclosure.rows=2;disclosure.placeholder='Information que l’acheteur doit connaître avant de décider';submit.type='submit';
      stock.onchange=()=>{const item=stocks().find(x=>x.id===stock.value);if(item){original.value=String(Number(item.data?.unitPrice??0)||'');quantity.max=String(availableStock(item));}};
      form.append(field('Type',type),field('Stock canonique',stock),field('Quantité',quantity),field('Prix de référence réel',original),field('Prix proposé',offer),field('Date du constat',observed),field('Fin de validité',expires),field('État du produit',condition),field('Raison du rabais',reason,'full'),field('Divulgation / transparence',disclosure,'full'),submit);
      form.onsubmit=e=>void(async()=>{e.preventDefault();try{submit.disabled=true;await app.createFlashOffer({type:type.value,stockItemId:stock.value,quantity:num(quantity),originalPrice:num(original),offerPrice:num(offer),observedAt:new Date(observed.value).toISOString(),expiresAt:new Date(expires.value).toISOString(),reason:reason.value,condition:condition.value,disclosure:disclosure.value});notify('Offre urgente publiée avec ses informations de transparence.');form.reset();observed.value=localDateTime();expires.value=localDateTime(new Date(Date.now()+24*3600000));await refresh();}catch(err){showError(err);}finally{submit.disabled=false;}})();section.append(form);
    }
    const list=el('div',undefined,'stack value-market-list');
    const rows=[...snapshot.flashOffers].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if(!rows.length)list.append(el('p','Aucune offre NOW / Surplus / Rescue publiée.','empty-state'));
    for(const offer of rows){const item=stocks().find(x=>x.id===String(offer.data?.stockItemId)),card=el('article',undefined,'item value-market-card');const head=el('div',undefined,'actions');head.append(el('strong',flashTypeLabel(String(offer.data?.flashType))),statePill(offer.data?.state));card.append(head,row('Produit',item?.title??offer.data?.sku??offer.title),row('Quantité',offer.data?.quantity),row('Prix de référence',money(offer.data?.originalPrice,fmt)),row('Prix NOW',money(offer.data?.offerPrice,fmt)),row('Raison du rabais',offer.data?.reason),row('État',offer.data?.condition),row('Divulgation',offer.data?.disclosure),row('Constaté le',dateLabel(offer.data?.observedAt)),row('Expire le',dateLabel(offer.data?.expiresAt)));
      if(String(offer.data?.state)==='OPEN'){
        const remaining=Math.max(0,Number(offer.data?.quantity??0)-Number(offer.data?.claimedQuantity??0));card.append(row('Encore réservable',remaining));
        if(remaining>0){const claimBox=el('div',undefined,'actions'),q=document.createElement('input');q.type='number';q.min='1';q.max=String(remaining);q.value='1';q.className='inline-number';let who;
          if(isManager()){who=selectOf(members(),x=>x.displayName||x.id,'Membre bénéficiaire');claimBox.append(who);}
          const claim=button('Réserver → commande canonique','primary');claim.onclick=()=>void(async()=>{const membershipId=isManager()?who?.value:selfMember()?.id;if(!membershipId)return showError(Error('MEMBERSHIP_NOT_FOUND'));try{const result=await app.claimFlashOffer(offer.id,membershipId,Math.max(1,num(q)));notify('Réservation créée dans les commandes canoniques. Aucun paiement réel n’a été déclenché.');void result;await refresh();}catch(e){showError(e);}})();claimBox.append(q,claim);card.append(claimBox);}
        if(isManager()){const close=button('Clôturer l’offre');close.onclick=()=>void(async()=>{const reason=window.prompt('Motif de clôture :','Stock écoulé / offre terminée')?.trim();if(!reason)return;try{await app.closeFlashOffer(offer.id,reason);await refresh();}catch(e){showError(e);}})();card.append(close);}
      }list.append(card);}
    section.append(list);root.append(section);
  };

  const responseCard=(response,request)=>{
    const supplier=suppliers().find(x=>x.id===String(response.data?.supplierId)),card=el('article',undefined,'item market-response-card'),head=el('div',undefined,'actions');head.append(el('strong',supplier?.title??response.title),statePill(response.data?.responseState));card.append(head,row('Prix unitaire',money(response.data?.unitPrice,fmt)),row('Quantité proposée',response.data?.quantity),row('Livraison',money(response.data?.deliveryCost,fmt)),row('Coût rendu',money(response.data?.landedCost,fmt)),row('Délai',response.data?.delayText),row('Disponibilité',response.data?.availability),row('Conditions',response.data?.conditions),row('Preuve / référence',response.data?.evidenceRef||'—'),row('Variante',response.data?.variant||'—'));
    if(isManager()&&['SUBMITTED','SHORTLISTED'].includes(String(response.data?.responseState))){
      const actions=el('div',undefined,'actions');
      if(String(response.data?.responseState)==='SUBMITTED'){const shortlist=button('Mettre en shortlist');shortlist.onclick=()=>void(async()=>{try{await app.shortlistMarketResponse(response.id);await refresh();}catch(e){showError(e);}})();actions.append(shortlist);}
      const select=button('Sélectionner cette offre','primary');select.onclick=()=>void(async()=>{try{await app.selectMarketResponse(response.id);notify('Offre sélectionnée. La demande n’est pas encore un paiement.');await refresh();}catch(e){showError(e);}})();actions.append(select);card.append(actions);
    }
    return card;
  };

  const renderDemandExchange=()=>{
    const section=el('section',undefined,'value-market-block');section.id='valueMarketDemand';section.append(el('h3','15–16 · Predictive Demand Exchange · Eco Reverse Market'),el('p','Besoin explicite ou besoin prédit par Eco Anticipation. Une prédiction doit d’abord avoir été acceptée humainement, puis la demande est ouverte. Les fournisseurs répondent avec prix, délai, conditions, disponibilité, preuve et variantes.','hint'));
    if(isManager()){
      const form=el('form',undefined,'form-grid value-market-form'),origin=document.createElement('select'),prediction=selectOf(anticipations,x=>x.title,'Aucune anticipation liée'),title=document.createElement('input'),category=document.createElement('input'),quantity=document.createElement('input'),unit=document.createElement('input'),locality=document.createElement('input'),budget=document.createElement('input'),needed=document.createElement('input'),delivery=document.createElement('input'),constraints=document.createElement('textarea'),submit=el('button','Créer la demande à valider','primary');
      origin.append(new Option('Explicit Demand · besoin saisi','EXPLICIT'),new Option('Predicted Demand · issu d’Eco Anticipation','PREDICTED'));prediction.disabled=true;title.required=true;category.required=true;quantity.type='number';quantity.min='1';quantity.value='1';unit.value='unité';budget.type='number';budget.min='0';needed.type='datetime-local';constraints.rows=2;submit.type='submit';
      origin.onchange=()=>{prediction.disabled=origin.value!=='PREDICTED';if(origin.value!=='PREDICTED')prediction.value='';};
      form.append(field('Origine',origin),field('Anticipation acceptée',prediction),field('Besoin / objet',title),field('Catégorie',category),field('Quantité',quantity),field('Unité',unit),field('Localité',locality),field('Budget max indicatif',budget),field('Besoin avant le',needed),field('Livraison souhaitée',delivery),field('Contraintes / variantes acceptables',constraints,'full'),submit);
      form.onsubmit=e=>void(async()=>{e.preventDefault();try{submit.disabled=true;await app.createMarketRequest({origin:origin.value,predictionRef:prediction.value||undefined,title:title.value,category:category.value,quantity:num(quantity),unit:unit.value,locality:locality.value,budgetMax:budget.value?num(budget):undefined,neededBy:needed.value?new Date(needed.value).toISOString():undefined,deliveryMode:delivery.value,constraints:constraints.value});notify(origin.value==='PREDICTED'?'Demande prédite créée : validation humaine encore requise.':'Demande explicite créée : ouvrez-la après vérification.');form.reset();origin.value='EXPLICIT';prediction.disabled=true;quantity.value='1';unit.value='unité';await refresh();}catch(err){showError(err);}finally{submit.disabled=false;}})();section.append(form);
      if(origin.value==='PREDICTED'&&!anticipations.length)section.append(el('p','Aucune anticipation validée n’est disponible. Validez d’abord une proposition dans Eco Anticipation : une prédiction ne peut pas devenir demande marché toute seule.','truth-notice'));
    }
    const list=el('div',undefined,'stack');
    const requests=[...snapshot.requests].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if(!requests.length)list.append(el('p','Aucune demande Reverse Market.','empty-state'));
    for(const request of requests){
      const card=el('article',undefined,'item value-market-card request-card'),head=el('div',undefined,'actions');head.append(el('strong',request.title),statePill(request.data?.state));card.append(head,row('Origine',request.data?.requestOrigin==='PREDICTED'?'Predicted Demand':'Explicit Demand'),row('Catégorie',request.data?.category),row('Quantité',String(request.data?.quantity)+' '+String(request.data?.unit??'')),row('Localité',request.data?.locality||'—'),row('Budget max',Number(request.data?.budgetMax)>0?money(request.data?.budgetMax,fmt):'Non fixé'),row('Échéance',request.data?.neededBy?dateLabel(request.data?.neededBy):'—'),row('Contraintes',request.data?.constraints||'—'));
      if(request.data?.requestOrigin==='PREDICTED')card.append(row('Source Eco Anticipation',request.data?.predictionRef||'—'));
      const actions=el('div',undefined,'actions'),state=String(request.data?.state);
      if(isManager()&&['DRAFT','PREDICTED'].includes(state)){const validate=button('Validation humaine → Ouvrir','primary');validate.onclick=()=>void(async()=>{try{await app.validateMarketRequest(request.id);notify('Demande ouverte après validation humaine.');await refresh();}catch(e){showError(e);}})();actions.append(validate);}
      if(isManager()&&state==='SELECTED'){const fulfill=button('Créer l’approvisionnement canonique','primary');fulfill.onclick=()=>void(async()=>{try{const p=await app.materializeMarketRequestProcurement(request.id);notify('Approvisionnement créé depuis l’offre fournisseur sélectionnée · '+String(p?.title??''));await refresh();}catch(e){showError(e);}})();actions.append(fulfill);}
      if(isManager()&&state==='FULFILLMENT'){const close=button('Clôturer');close.onclick=()=>void(async()=>{try{await app.transitionMarketRequest(request.id,'CLOSED');await refresh();}catch(e){showError(e);}})();actions.append(close);}
      if(isManager()&&!['CLOSED','DISPUTED'].includes(state)){const dispute=button('Ouvrir un litige');dispute.onclick=()=>void(async()=>{const note=window.prompt('Résumé factuel du litige :')?.trim();if(!note)return;try{await app.transitionMarketRequest(request.id,'DISPUTED',note);await refresh();}catch(e){showError(e);}})();actions.append(dispute);}
      if(actions.childElementCount)card.append(actions);
      const responses=snapshot.responses.filter(x=>String(x.data?.requestId)===request.id),box=el('details',undefined,'market-response-stack');box.open=['RESPONSES','SHORTLIST','SELECTED'].includes(state);box.append(el('summary','Réponses fournisseurs · '+responses.length));
      for(const response of responses)box.append(responseCard(response,request));
      if(isManager()&&['OPEN','RESPONSES','SHORTLIST'].includes(state)){
        const rf=el('form',undefined,'form-grid compact-form'),supplier=selectOf(suppliers(),x=>x.title,'Choisir fournisseur'),price=document.createElement('input'),qtyInput=document.createElement('input'),deliveryCost=document.createElement('input'),delay=document.createElement('input'),availability=document.createElement('input'),conditions=document.createElement('textarea'),evidence=document.createElement('input'),variant=document.createElement('input'),send=el('button','Ajouter la réponse','primary');
        price.type='number';price.min='0';qtyInput.type='number';qtyInput.min='1';qtyInput.value=String(request.data?.quantity??1);deliveryCost.type='number';deliveryCost.min='0';deliveryCost.value='0';conditions.rows=2;send.type='submit';
        rf.append(field('Fournisseur',supplier),field('Prix unitaire',price),field('Quantité',qtyInput),field('Livraison',deliveryCost),field('Délai',delay),field('Disponibilité',availability),field('Conditions',conditions,'full'),field('Preuve / référence',evidence),field('Variante',variant),send);
        rf.onsubmit=e=>void(async()=>{e.preventDefault();try{send.disabled=true;await app.respondMarketRequest(request.id,{supplierId:supplier.value,unitPrice:num(price),quantity:num(qtyInput),deliveryCost:num(deliveryCost),delayText:delay.value,availability:availability.value,conditions:conditions.value,evidenceRef:evidence.value,variant:variant.value});notify('Réponse fournisseur ajoutée à la demande.');await refresh();}catch(err){showError(err);}finally{send.disabled=false;}})();box.append(rf);
        if(!suppliers().length)box.append(el('p','Aucun fournisseur enregistré : ajoutez d’abord un fournisseur dans le Marketplace canonique.','truth-notice'));
      }
      card.append(box);list.append(card);
    }
    section.append(list);root.append(section);
  };

  const renderDeals=()=>{
    const section=el('section',undefined,'value-market-block');section.id='valueMarketDeals';section.append(el('h3','17 · Eco Deals · vente négociée'),el('p','Les conditions internes de négociation restent réservées aux responsables. Les seuils et prix affichés publiquement sont toujours réels : aucune fausse progression, aucun faux palier.','hint'));
    if(isManager()){
      const form=el('form',undefined,'form-grid value-market-form'),type=document.createElement('select'),title=document.createElement('input'),supplier=selectOf(suppliers(),x=>x.title,'Fournisseur facultatif'),stock=selectOf(stocks().filter(x=>String(x.data?.ownership??'COMMERCIAL')!=='POT_RESERVED'),x=>x.title+' · '+availableStock(x)+' disponible(s)','Stock facultatif'),publicPrice=document.createElement('input'),minimum=document.createElement('input'),maximum=document.createElement('input'),delivery=document.createElement('input'),quality=document.createElement('input'),deadline=document.createElement('input'),tiers=document.createElement('input'),supplierPrice=document.createElement('input'),commission=document.createElement('input'),promotion=document.createElement('input'),bonus=document.createElement('input'),submit=el('button','Créer le Deal','primary');
      for(const v of ['PUBLIC_DEAL','GROUP_DEAL','SUPPLIER_DEAL','FRESH_DEAL','BULK_DEAL','INSTITUTIONAL_DEAL'])type.append(new Option(dealTypeLabel(v),v));
      for(const x of [publicPrice,minimum,maximum,supplierPrice,commission]){x.type='number';x.min='0';}minimum.min='1';maximum.min='1';deadline.type='datetime-local';deadline.value=localDateTime(new Date(Date.now()+7*86400000));tiers.placeholder='Ex. 50:20500, 100:20000, 150:19700';
      const publicBox=el('fieldset',undefined,'full deal-public-terms');publicBox.append(el('legend','Conditions publiques · toujours vraies'),field('Prix public de base',publicPrice),field('Minimum fournisseur réel',minimum),field('Quantité maximale réelle',maximum),field('Livraison',delivery),field('Qualité / état promis',quality),field('Date limite',deadline),field('Paliers quantité:prix',tiers,'full'));
      const internal=el('details',undefined,'full deal-internal-terms');internal.append(el('summary','Conditions internes confidentielles de négociation'));const ig=el('div',undefined,'form-grid');ig.append(field('Prix fournisseur',supplierPrice),field('Commission',commission),field('Promotion négociée',promotion),field('Bonus volume',bonus));internal.append(ig);
      form.append(field('Type de Deal',type),field('Titre',title),field('Fournisseur',supplier),field('Stock canonique lié',stock),publicBox,internal,submit);
      form.onsubmit=e=>void(async()=>{e.preventDefault();try{submit.disabled=true;await app.createEcoDeal({title:title.value,dealType:type.value,supplierId:supplier.value||undefined,stockItemId:stock.value||undefined,publicPrice:num(publicPrice),supplierPrice:supplierPrice.value?num(supplierPrice):undefined,supplierMinimum:num(minimum),maxQuantity:num(maximum),delivery:delivery.value,quality:quality.value,commission:commission.value?num(commission):undefined,promotion:promotion.value,volumeBonus:bonus.value,deadline:new Date(deadline.value).toISOString(),tiers:tiersFromText(tiers.value)});notify('Deal créé. Les engagements restent des réservations, pas des débits.');form.reset();deadline.value=localDateTime(new Date(Date.now()+7*86400000));await refresh();}catch(err){showError(err);}finally{submit.disabled=false;}})();section.append(form);
    }
    const list=el('div',undefined,'stack');
    const rows=[...dealRows()].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if(!rows.length)list.append(el('p','Aucun Eco Deal actif.','empty-state'));
    for(const deal of rows){
      const card=el('article',undefined,'item value-market-card deal-card'),state=String(deal.data?.state),committed=Number(deal.data?.committedQuantity??0),max=Number(deal.data?.maxQuantity??0),minimum=Number(deal.data?.supplierMinimum??0),head=el('div',undefined,'actions');head.append(el('strong',deal.title),statePill(state));card.append(head,row('Type',dealTypeLabel(String(deal.data?.dealType))),row('Prix public actuel',money(deal.data?.currentPublicPrice??deal.data?.publicPrice,fmt)),row('Minimum réel',minimum),row('Engagements',committed+' / '+max),row('Livraison',deal.data?.delivery),row('Qualité',deal.data?.quality),row('Fin',dateLabel(deal.data?.deadline)));
      const progress=document.createElement('progress');progress.max=Math.max(1,max);progress.value=Math.min(committed,max);progress.className='deal-progress';card.append(progress,el('small','Seuil fournisseur : '+minimum+' · progression réelle : '+committed));
      const tiers=parseJson(deal.data?.tiersJson);if(Array.isArray(tiers)&&tiers.length)card.append(row('Paliers réels',tiers.map(x=>x.minQty+'+ → '+money(x.price,fmt)).join(' · ')));
      if(isManager()){
        const internal=el('details',undefined,'deal-confidential');internal.append(el('summary','Négociation interne · confidentielle'),row('Prix fournisseur',money(deal.data?.supplierPrice,fmt)),row('Commission',money(deal.data?.commission,fmt)),row('Promotion',deal.data?.promotion||'—'),row('Bonus volume',deal.data?.volumeBonus||'—'));card.append(internal);
      }
      if(['OPEN','THRESHOLD_MET'].includes(state)){
        const commitBox=el('div',undefined,'actions'),qtyInput=document.createElement('input');qtyInput.type='number';qtyInput.min='1';qtyInput.step='1';qtyInput.value='1';qtyInput.className='inline-number';
        let memberSelect;if(isManager()){memberSelect=selectOf(members(),x=>x.displayName||x.id,'Membre à engager');commitBox.append(memberSelect);}const commit=button('Ajouter un engagement','primary');commit.onclick=()=>void(async()=>{const membershipId=isManager()?memberSelect?.value:selfMember()?.id;if(!membershipId)return showError(Error('MEMBERSHIP_NOT_FOUND'));try{await app.commitEcoDeal(deal.id,membershipId,Math.max(1,num(qtyInput)));notify('Engagement enregistré. Aucun paiement réel n’a été déclenché.');await refresh();}catch(e){showError(e);}})();commitBox.append(qtyInput,commit);card.append(commitBox);
      }
      if(isManager()){
        const actions=el('div',undefined,'actions');
        if(state==='THRESHOLD_MET'){const activate=button('Activer le Deal','primary');activate.onclick=()=>void(async()=>{try{await app.activateEcoDeal(deal.id);await refresh();}catch(e){showError(e);}})();actions.append(activate);}
        if(state==='ACTIVATED'&&deal.data?.stockItemId){const orders=button('Créer les commandes canoniques','primary');orders.onclick=()=>void(async()=>{try{const created=await app.materializeEcoDealOrders(deal.id);notify(String(created?.length??0)+' commande(s) créées dans le Marketplace canonique.');await refresh();}catch(e){showError(e);}})();actions.append(orders);}
        if(['FULFILLMENT','ACTIVATED','EXPIRED'].includes(state)){const close=button('Clôturer le Deal');close.onclick=()=>void(async()=>{try{await app.closeEcoDeal(deal.id);await refresh();}catch(e){showError(e);}})();actions.append(close);}
        if(actions.childElementCount)card.append(actions);
      }
      card.append(el('p','Réservation commerciale seulement : aucun compte financier n’est débité ici.','truth-notice'));list.append(card);
    }
    section.append(list);root.append(section);
  };

  const renderLiveMarket=()=>{
    const section=el('section',undefined,'value-market-block');section.id='valueMarketLive';section.append(el('h3','19 · Eco Live Market'),el('p','Rendez-vous commerciaux progressifs : texte → image/audio → vidéo courte → live interactif. Les questions et compteurs sont réels ; le chat durable reste le Forum/Hub canonique, pas un second moteur social.','hint'));
    if(isManager()){
      const form=el('form',undefined,'form-grid value-market-form'),title=document.createElement('input'),theme=document.createElement('input'),scheduled=document.createElement('input'),level=document.createElement('select'),deal=selectOf(snapshot.deals,x=>x.title,'Deal épinglé facultatif'),stock=selectOf(stocks().filter(x=>String(x.data?.ownership??'COMMERCIAL')!=='POT_RESERVED'),x=>x.title,'Produit épinglé facultatif'),hub=selectOf(hubs,x=>x.title,'Hub / forum facultatif'),media=document.createElement('input'),submit=el('button','Programmer le Live Market','primary');
      scheduled.type='datetime-local';scheduled.value=localDateTime(new Date(Date.now()+2*3600000));for(let i=0;i<=3;i++)level.append(new Option(levelLabel(i),String(i)));level.value='0';media.placeholder='Référence média / lien stream / document (optionnel)';submit.type='submit';
      form.append(field('Titre',title),field('Thème',theme),field('Date / heure',scheduled),field('Niveau progressif',level),field('Deal épinglé',deal),field('Produit épinglé',stock),field('Hub de discussion',hub),field('Média / stream',media),submit);
      form.onsubmit=e=>void(async()=>{e.preventDefault();try{submit.disabled=true;await app.createLiveMarket({title:title.value,theme:theme.value,scheduledAt:new Date(scheduled.value).toISOString(),capabilityLevel:Number(level.value),dealId:deal.value||undefined,stockItemId:stock.value||undefined,communityHubId:hub.value||undefined,mediaRef:media.value||undefined});notify('Live Market programmé.');form.reset();scheduled.value=localDateTime(new Date(Date.now()+2*3600000));await refresh();}catch(err){showError(err);}finally{submit.disabled=false;}})();section.append(form);
    }
    const list=el('div',undefined,'stack');
    const rows=[...snapshot.liveMarkets].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if(!rows.length)list.append(el('p','Aucun rendez-vous Eco Live Market.','empty-state'));
    for(const live of rows){
      const card=el('article',undefined,'item value-market-card live-market-card'),state=String(live.data?.state),deal=byDeal(String(live.data?.dealId??'')),head=el('div',undefined,'actions');head.append(el('strong',live.title),statePill(state));card.append(head,row('Thème',live.data?.theme),row('Rendez-vous',dateLabel(live.data?.scheduledAt)),row('Capacité',levelLabel(live.data?.capabilityLevel)),row('Participants réels',Number(live.data?.viewerCount??0)));
      const pinnedStock=stocks().find(x=>x.id===String(live.data?.stockItemId??'')),pinnedStockLabel=pinnedStock?.title||String(live.data?.stockTitle??'');if(pinnedStockLabel)card.append(row('Produit épinglé',pinnedStockLabel));
      if(live.data?.mediaRef)card.append(row('Média / stream',live.data.mediaRef));
      if(deal){
        card.append(row('Deal épinglé',deal.title),row('Progression Deal',String(deal.data?.committedQuantity??0)+' / '+String(deal.data?.maxQuantity??0)),row('Prix public',money(deal.data?.currentPublicPrice??deal.data?.publicPrice,fmt)));
        if(state==='LIVE'&&['OPEN','THRESHOLD_MET'].includes(String(deal.data?.state))){const cta=el('div',undefined,'actions'),q=document.createElement('input');q.type='number';q.min='1';q.value='1';q.className='inline-number';let who;if(isManager()){who=selectOf(members(),x=>x.displayName||x.id,'Membre');cta.append(who);}const commit=button('CTA · Je m’engage sur ce Deal','primary');commit.onclick=()=>void(async()=>{const membershipId=isManager()?who?.value:selfMember()?.id;if(!membershipId)return showError(Error('MEMBERSHIP_NOT_FOUND'));try{await app.commitEcoDeal(deal.id,membershipId,Math.max(1,num(q)));notify('Engagement Deal enregistré pendant le Live. Aucun paiement réel.');await refresh();}catch(e){showError(e);}})();cta.append(q,commit);card.append(cta);}
      }
      const actions=el('div',undefined,'actions');
      if(isManager()&&state==='SCHEDULED'){const start=button('Démarrer le Live','primary');start.onclick=()=>void(async()=>{try{await app.transitionLiveMarket(live.id,'LIVE');await refresh();}catch(e){showError(e);}})();actions.append(start);}
      if(state==='LIVE'){const join=button('Rejoindre / actualiser ma présence','primary');join.onclick=()=>void(async()=>{try{await app.joinLiveMarket(live.id);await refresh();}catch(e){showError(e);}})();actions.append(join);if(isManager()){const end=button('Terminer le Live');end.onclick=()=>void(async()=>{try{await app.transitionLiveMarket(live.id,'ENDED');await refresh();}catch(e){showError(e);}})();actions.append(end);}}
      if(live.data?.communityHubId){const forum=button('Ouvrir le Hub / chat durable');forum.onclick=()=>{navigate('ecosystem');setTimeout(()=>document.getElementById('communityEnginePanel')?.scrollIntoView({behavior:'smooth',block:'start'}),100);};actions.append(forum);}
      card.append(actions);
      if(state==='LIVE'){const qa=el('form',undefined,'actions live-question-form'),q=document.createElement('input'),send=el('button','Envoyer la question','secondary');q.placeholder='Question / commentaire utile pendant le live';send.type='submit';qa.append(q,send);qa.onsubmit=e=>void(async()=>{e.preventDefault();if(!q.value.trim())return;try{send.disabled=true;await app.askLiveMarket(live.id,q.value);q.value='';await refresh();}catch(err){showError(err);}finally{send.disabled=false;}})();card.append(qa);}
      const questions=parseJson(live.data?.questionsJson);if(Array.isArray(questions)&&questions.length){const qbox=el('details',undefined,'live-questions');qbox.open=state==='LIVE';qbox.append(el('summary','Questions / interactions · '+questions.length));for(const q of questions.slice(-20)){const user=members().find(m=>m.userId===q.actorId);qbox.append(row(user?.displayName??'Participant',q.text));}card.append(qbox);}
      card.append(el('p',Number(live.data?.capabilityLevel)>=3?'Niveau 3 : interaction Live activée. La vidéo peut être relayée par la couche média disponible ; les interactions restent synchronisées ici.':'Ce niveau reste volontairement léger pour les appareils anciens et les connexions faibles.','hint'));list.append(card);
    }
    section.append(list);root.append(section);
  };

  async function refresh(){
    root.replaceChildren();
    if(!activeGroup()){root.append(el('div','Sélectionnez un groupe pour utiliser le Marché de valeur.','empty-state'));socket?.close();return;}
    try{await load();renderHeader();renderFlashOffers();renderDemandExchange();renderDeals();renderLiveMarket();connectLive();}catch(e){showError(e);root.append(el('p','Le Marché de valeur n’a pas pu être actualisé. Les autres fonctions du groupe restent disponibles.','empty-state'));}
  }

  document.getElementById('valueMarketRefreshBtn')?.addEventListener('click',()=>void refresh());
  return{refresh};
}
