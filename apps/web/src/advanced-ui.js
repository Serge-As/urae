const el=id=>document.getElementById(id);
const value=id=>String(el(id)?.value??'').trim();
const number=id=>Number(value(id));
const opt=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
const card=(title,meta,body='')=>{const a=document.createElement('article');a.className='item';const h=document.createElement('strong');h.textContent=title;a.append(h);if(body){const p=document.createElement('p');p.textContent=body;a.append(p);}if(meta){const s=document.createElement('small');s.textContent=meta;a.append(s);}return a;};

export const mountAdvancedUI=({app,notify,showError,getMembers,fmt,translate,isManager=()=>false})=>{
  let importBatch=null;
  const tx=(fr,en)=>translate(fr,en);
  const run=async(fn)=>{try{await fn();}catch(e){showError(e);}};

  const refillMembers=()=>{
    const items=getMembers();
    for(const id of ['expectedMember','savingsMember','solidarityMember']){
      const s=el(id);if(!s)continue;const current=s.value;s.replaceChildren(opt('',tx('Choisir un membre','Choose a member')));
      for(const m of items)s.append(opt(m.id,m.displayName));if(items.some(m=>m.id===current))s.value=current;
    }
  };

  const renderArrears=async()=>{
    const root=el('arrearsList');if(!root||!app.activeGroup())return;const rows=await app.arrears();root.replaceChildren();
    if(!rows.length){root.append(card(tx('Aucun attendu arrivé à échéance','No due expectation'),'',tx('Aucun impayé calculé.','No calculated arrears.')));return;}
    for(const r of rows){
      const a=card(r.title,String(r.status),tx('Attendu','Expected')+' '+fmt(r.expected)+' · '+tx('affecté','allocated')+' '+fmt(r.allocated)+' · '+tx('reste','outstanding')+' '+fmt(r.outstanding));
      root.append(a);
    }
  };

  const renderSavings=async()=>{
    const root=el('savingsList');if(!root||!app.activeGroup())return;
    const rows=(await app.listWorkspaceRecords('RUBRIC.SAVINGS',app.activeGroup())).filter(r=>r.data.specializedKind==='SAVINGS_PLAN');root.replaceChildren();
    for(const p of rows){
      const pos=await app.savingsPosition(p.id);const a=card(p.title,tx('Solde','Balance')+' '+fmt(Number(pos.balance)),tx('Objectif','Target')+' '+fmt(Number(pos.targetAmount??0)));
      const dep=document.createElement('button');dep.type='button';dep.textContent=tx('Déposer','Deposit');dep.onclick=()=>void run(async()=>{const raw=prompt(tx('Montant du dépôt','Deposit amount'),'10000');if(raw===null)return;await app.depositSavings(p.id,Number(raw));await renderSavings();notify(tx('Dépôt enregistré.','Deposit recorded.'));});
      const wd=document.createElement('button');wd.type='button';wd.textContent=tx('Retirer','Withdraw');wd.onclick=()=>void run(async()=>{const raw=prompt(tx('Montant du retrait','Withdrawal amount'),'5000');if(raw===null)return;await app.withdrawSavings(p.id,Number(raw));await renderSavings();notify(tx('Retrait enregistré.','Withdrawal recorded.'));});
      a.append(dep,wd);root.append(a);
    }
  };

  const renderCustody=async()=>{
    const root=el('custodyList');if(!root||!app.activeGroup())return;
    const rows=(await app.listWorkspaceRecords(undefined,app.activeGroup())).filter(r=>r.data.specializedKind==='CUSTODY_ACCOUNT');root.replaceChildren();
    for(const x of rows){
      const a=card(x.title,tx('Détenteur','Holder')+': '+String(x.data.holder??''),tx('Devise','Currency')+': '+String(x.data.currency??'XAF'));
      const send=document.createElement('button');send.type='button';send.textContent=tx('Confier des espèces','Send cash');send.onclick=()=>void run(async()=>{const raw=prompt(tx('Montant à confier','Amount to send'),'10000');if(raw===null)return;await app.sendToCustody(x.id,Number(raw));notify(tx('Mouvement comptabilisé.','Movement posted.'));});
      const back=document.createElement('button');back.type='button';back.textContent=tx('Retour en caisse','Return to cashbox');back.onclick=()=>void run(async()=>{const raw=prompt(tx('Montant restitué','Returned amount'),'10000');if(raw===null)return;await app.returnFromCustody(x.id,Number(raw));notify(tx('Retour comptabilisé.','Return posted.'));});
      a.append(send,back);root.append(a);
    }
  };

  const renderSolidarity=async()=>{
    const root=el('solidarityList');if(!root||!app.activeGroup())return;
    const rows=(await app.listWorkspaceRecords('SOLIDARITY.FUND',app.activeGroup())).filter(r=>r.data.specializedKind==='SOLIDARITY_CASE');root.replaceChildren();
    for(const x of rows){
      const a=card(x.title,String(x.data.state??''),tx('Montant approuvé','Approved amount')+' '+fmt(Number(x.data.approvedAmount??0)));
      const fund=document.createElement('button');fund.type='button';fund.textContent=tx('Alimenter le fonds','Fund');fund.onclick=()=>void run(async()=>{const raw=prompt(tx('Montant versé au fonds','Amount funded'),'10000');if(raw===null)return;await app.fundSolidarity(x.id,Number(raw));notify(tx('Fonds alimenté.','Fund credited.'));});
      const pay=document.createElement('button');pay.type='button';pay.textContent=tx('Décaisser l’aide','Disburse support');pay.onclick=()=>void run(async()=>{const raw=prompt(tx('Montant de l’aide','Support amount'),'10000');if(raw===null)return;await app.disburseSolidarity(x.id,Number(raw));notify(tx('Aide décaissée et tracée.','Support disbursed and traced.'));});
      a.append(fund,pay);root.append(a);
    }
  };

  const marketRows=async()=>app.activeGroup()?(await app.listWorkspaceRecords(undefined,app.activeGroup())).filter(r=>r.tags.includes('market-engine')):[];
  const renderMarket=async()=>{
    if(!app.activeGroup())return;const rows=await marketRows(),stocks=rows.filter(r=>r.data.marketKind==='STOCK_ITEM'),orders=rows.filter(r=>r.data.marketKind==='MARKET_ORDER'),buys=rows.filter(r=>r.data.marketKind==='GROUP_BUY');
    for(const id of ['orderStockItem','groupBuyStock']){const s=el(id);if(!s)continue;const current=s.value;s.replaceChildren();if(id==='groupBuyStock')s.append(opt('',tx('Sans article lié','No linked item')));for(const x of stocks)s.append(opt(x.id,x.title));if([...s.options].some(o=>o.value===current))s.value=current;}
    const root=el('marketRecords');if(root){root.replaceChildren();for(const x of stocks)root.append(card(x.title,tx('Stock','Stock')+': '+String(x.data.quantity??0)+' · '+tx('réservé','reserved')+': '+String(x.data.reserved??0),String(x.data.sku??'')));
      for(const x of orders){const a=card(x.title,String(x.data.state??''),tx('Quantité','Quantity')+' '+String(x.data.quantity??0)+' · '+tx('livrée','delivered')+' '+String(x.data.deliveredQuantity??0));
        if(!['DELIVERED','RETURNED','DISPUTED'].includes(String(x.data.state))){const b=document.createElement('button');b.type='button';b.textContent=tx('Livrer','Deliver');b.onclick=()=>void run(async()=>{const raw=prompt(tx('Quantité livrée','Delivered quantity'),'1');if(raw===null)return;await app.deliverMarketOrder(x.id,Number(raw));await renderMarket();});a.append(b);}
        const ret=document.createElement('button');ret.type='button';ret.textContent=tx('Retour','Return');ret.onclick=()=>void run(async()=>{const q=prompt(tx('Quantité retournée','Returned quantity'),'1');if(q===null)return;const reason=prompt(tx('Motif','Reason'),'');if(reason===null)return;await app.returnMarketOrder(x.id,Number(q),reason);await renderMarket();});a.append(ret);
        const dis=document.createElement('button');dis.type='button';dis.textContent=tx('Litige','Dispute');dis.onclick=()=>void run(async()=>{const s=prompt(tx('Résumé du litige','Dispute summary'),'');if(!s)return;await app.disputeMarketOrder(x.id,s);await renderMarket();});a.append(dis);root.append(a);}
    }
    const br=el('groupBuyList');if(br){br.replaceChildren();for(const x of buys){const a=card(x.title,String(x.data.state??''),tx('Engagé','Committed')+' '+String(x.data.committedQuantity??0)+' / '+String(x.data.thresholdQuantity??0));
      const b=document.createElement('button');b.type='button';b.textContent=tx('Participer','Join');b.onclick=()=>void run(async()=>{const member=getMembers().find(m=>m.userId===app.currentActor());if(!member)throw Error('MEMBERSHIP_NOT_FOUND');const raw=prompt(tx('Quantité','Quantity'),'1');if(raw===null)return;await app.commitGroupBuy(x.id,member.id,Number(raw));await app.recordEcoPulse({itemId:x.id,itemKind:'group-buy',action:'PURCHASE_INTENT',source:'group-shop',groupId:app.activeGroup(),tags:['group-buy','marketplace']}).catch(()=>{});await renderMarket();});a.append(b);br.append(a);}}
  };


  const parseTiers=value=>String(value??'').split(',').map(x=>x.trim()).filter(Boolean).map(x=>{const [q,p]=x.split(':').map(Number);if(!Number.isSafeInteger(q)||q<=0||!Number.isSafeInteger(p)||p<0)throw Error('INVALID_DEAL_TIERS');return{minQuantity:q,unitPrice:p};});
  const localIso=id=>{const raw=value(id);return raw?new Date(raw).toISOString():'';};
  const renderSocialCommerce=async()=>{
    const flashRoot=el('socialFlashList'),requestRoot=el('socialRequestList'),dealRoot=el('socialDealList'),liveRoot=el('socialLiveList');if(!flashRoot||!app.activeGroup())return;
    const data=await app.socialCommerce();
    flashRoot.replaceChildren();for(const x of (data.flashOffers??[]).filter(x=>String(x.data.state)!=='CLOSED')){const a=card(x.title,String(x.data.flashKind)+' · '+String(x.data.state),String(x.data.quantity)+' '+String(x.data.unit)+' · '+fmt(Number(x.data.unitPrice))+' · '+String(x.data.reason));if(isManager()){const b=document.createElement('button');b.type='button';b.textContent=tx('Clôturer','Close');b.onclick=()=>void run(async()=>{const reason=prompt(tx('Motif de clôture','Closing reason'),'')??'';await app.closeFlashOffer(x.id,reason);await renderSocialCommerce();});a.append(b);}flashRoot.append(a);}if(!flashRoot.childNodes.length)flashRoot.append(card(tx('Aucune offre urgente','No urgent offer'),'',''));

    requestRoot?.replaceChildren();for(const x of data.requests??[]){const state=String(x.data.requestState),a=card(x.title,state,String(x.data.quantity)+' '+String(x.data.unit)+' · '+String(x.data.category)+(x.data.sourceType==='PREDICTION'?tx(' · prévision',' · prediction'):''));const acts=document.createElement('div');acts.className='actions';
      if(isManager()&&state==='DRAFT'&&x.data.sourceType==='PREDICTION'&&x.data.humanAccepted!==true){const b=document.createElement('button');b.type='button';b.textContent=tx('Accepter humainement la prévision','Human accept prediction');b.onclick=()=>void run(async()=>{await app.acceptPredictedMarketRequest(x.id);await renderSocialCommerce();});acts.append(b);}
      if(isManager()&&state==='DRAFT'&&(x.data.sourceType!=='PREDICTION'||x.data.humanAccepted===true)){const b=document.createElement('button');b.type='button';b.textContent=tx('Ouvrir la demande','Open request');b.onclick=()=>void run(async()=>{await app.openMarketRequest(x.id);await renderSocialCommerce();});acts.append(b);}
      if(isManager()&&['OPEN','RESPONSES'].includes(state)){const b=document.createElement('button');b.type='button';b.textContent=tx('Ajouter une réponse fournisseur','Add supplier response');b.onclick=()=>void run(async()=>{const supplierRef=prompt(tx('Référence fournisseur','Supplier reference'),'')?.trim();if(!supplierRef)return;const price=Number(prompt(tx('Prix total proposé XAF','Proposed total price XAF'),'0'));const availableQuantity=Number(prompt(tx('Quantité disponible','Available quantity'),String(x.data.quantity??1)));const conditions=prompt(tx('Conditions','Conditions'),'')??'';const evidenceRef=prompt(tx('Preuve / devis','Evidence / quote'),'')??'';await app.respondMarketRequest(x.id,{supplierRef,price,availableQuantity,conditions,evidenceRef,currency:'XAF'});await renderSocialCommerce();});acts.append(b);}
      const responses=(data.responses??[]).filter(r=>String(r.data.requestId)===x.id);for(const response of responses){const rr=card(tx('Réponse ','Response ')+String(response.data.supplierRef),String(response.data.responseState),fmt(Number(response.data.price))+' · '+String(response.data.availableQuantity)+' '+String(x.data.unit));if(isManager()&&['RESPONSES','SHORTLIST'].includes(state)&&String(response.data.responseState)==='SUBMITTED'){const sb=document.createElement('button');sb.type='button';sb.textContent=tx('Présélectionner','Shortlist');sb.onclick=()=>void run(async()=>{await app.shortlistMarketResponse(x.id,response.id);await renderSocialCommerce();});rr.append(sb);}if(isManager()&&['RESPONSES','SHORTLIST'].includes(state)&&['SUBMITTED','SHORTLISTED'].includes(String(response.data.responseState))){const sel=document.createElement('button');sel.type='button';sel.className='primary';sel.textContent=tx('Sélectionner','Select');sel.onclick=()=>void run(async()=>{await app.selectMarketResponse(x.id,response.id);await renderSocialCommerce();});rr.append(sel);}a.append(rr);}
      if(isManager()&&state==='SELECTED'){const b=document.createElement('button');b.type='button';b.textContent=tx('Passer en exécution','Start fulfillment');b.onclick=()=>void run(async()=>{await app.transitionMarketRequest(x.id,'FULFILLMENT',tx('Exécution confirmée','Fulfillment confirmed'));await renderSocialCommerce();});acts.append(b);}
      if(isManager()&&['SELECTED','FULFILLMENT'].includes(state)){const d=document.createElement('button');d.type='button';d.textContent=tx('Signaler litige','Dispute');d.onclick=()=>void run(async()=>{await app.transitionMarketRequest(x.id,'DISPUTED',prompt(tx('Motif','Reason'),'')??'');await renderSocialCommerce();});acts.append(d);}
      if(isManager()&&['FULFILLMENT','DISPUTED'].includes(state)){const b=document.createElement('button');b.type='button';b.textContent=tx('Clôturer avec preuve','Close with evidence');b.onclick=()=>void run(async()=>{const note=prompt(tx('Preuve / note de clôture','Closing evidence / note'),'')??'';await app.transitionMarketRequest(x.id,'CLOSED',note);await renderSocialCommerce();});acts.append(b);}
      if(acts.childNodes.length)a.append(acts);requestRoot?.append(a);
    }if(requestRoot&&!requestRoot.childNodes.length)requestRoot.append(card(tx('Aucune demande','No request'),'',''));

    dealRoot?.replaceChildren();for(const x of data.deals??[]){const state=String(x.data.dealState),a=card(x.title,state,tx('Prix actuel','Current price')+' '+fmt(Number(x.data.effectiveUnitPrice))+' · '+tx('engagé réel','real committed')+' '+String(x.data.committedQuantity??0)+' / '+String(x.data.quantity));const acts=document.createElement('div');acts.className='actions';
      if(isManager()&&state==='DRAFT'){const b=document.createElement('button');b.type='button';b.textContent=tx('Publier le Deal','Open deal');b.onclick=()=>void run(async()=>{await app.openDeal(x.id);await renderSocialCommerce();});acts.append(b);}
      if(state==='OPEN'){const b=document.createElement('button');b.type='button';b.className='primary';b.textContent=tx('M’engager sur une quantité','Commit quantity');b.onclick=()=>void run(async()=>{const q=Number(prompt(tx('Quantité réellement souhaitée','Real quantity wanted'),'1'));if(!q)return;await app.commitDealQuantity(x.id,q);await renderSocialCommerce();});acts.append(b);}
      if(isManager()&&state==='OPEN'){const b=document.createElement('button');b.type='button';b.textContent=tx('Passer en exécution','Start fulfillment');b.onclick=()=>void run(async()=>{await app.transitionDeal(x.id,'FULFILLMENT');await renderSocialCommerce();});acts.append(b);}
      if(isManager()&&['OPEN','FULFILLMENT'].includes(state)){const d=document.createElement('button');d.type='button';d.textContent=tx('Litige','Dispute');d.onclick=()=>void run(async()=>{await app.transitionDeal(x.id,'DISPUTED',prompt(tx('Motif','Reason'),'')??'');await renderSocialCommerce();});acts.append(d);}
      if(isManager()&&['OPEN','FULFILLMENT','DISPUTED'].includes(state)){const c=document.createElement('button');c.type='button';c.textContent=tx('Clôturer','Close');c.onclick=()=>void run(async()=>{await app.transitionDeal(x.id,'CLOSED',prompt(tx('Preuve / note','Evidence / note'),'')??'');await renderSocialCommerce();});acts.append(c);}a.append(acts);dealRoot?.append(a);
    }if(dealRoot&&!dealRoot.childNodes.length)dealRoot.append(card(tx('Aucun Deal','No deal'),'',''));

    const hubSelect=el('socialLiveHub'),dealSelect=el('socialLiveDeal');if(hubSelect){const cur=hubSelect.value;hubSelect.replaceChildren(opt('',tx('Aucun','None')));for(const h of await app.listCommunityHubs().catch(()=>[]))hubSelect.append(opt(h.id,h.title));if([...hubSelect.options].some(o=>o.value===cur))hubSelect.value=cur;}if(dealSelect){const cur=dealSelect.value;dealSelect.replaceChildren(opt('',tx('Aucun','None')));for(const d of data.deals??[])dealSelect.append(opt(d.id,d.title));if([...dealSelect.options].some(o=>o.value===cur))dealSelect.value=cur;}
    liveRoot?.replaceChildren();for(const x of data.liveMarkets??[]){const state=String(x.data.liveState),a=card(x.title,state,String(x.data.mode)+' · '+new Date(String(x.data.scheduledAt)).toLocaleString());const acts=document.createElement('div');acts.className='actions';if(isManager()&&state==='DRAFT'){const b=document.createElement('button');b.type='button';b.textContent=tx('Programmer','Schedule');b.onclick=()=>void run(async()=>{await app.setLiveMarketState(x.id,'SCHEDULED');await renderSocialCommerce();});acts.append(b);}if(isManager()&&state==='SCHEDULED'){const b=document.createElement('button');b.type='button';b.className='primary';b.textContent=tx('Passer en direct','Go live');b.onclick=()=>void run(async()=>{await app.setLiveMarketState(x.id,'LIVE');await app.publishLiveSignal?.('PRESENCE',{kind:'LIVE_MARKET',liveMarketId:x.id,state:'LIVE'}).catch(()=>{});await renderSocialCommerce();});acts.append(b);}if(isManager()&&['SCHEDULED','LIVE'].includes(state)){const b=document.createElement('button');b.type='button';b.textContent=tx('Clôturer le direct','Close live');b.onclick=()=>void run(async()=>{await app.setLiveMarketState(x.id,'CLOSED');await renderSocialCommerce();});acts.append(b);}a.append(acts);liveRoot?.append(a);}if(liveRoot&&!liveRoot.childNodes.length)liveRoot.append(card(tx('Aucune session Live','No Live session'),'',''));
  };

  const renderImport=()=>{
    const root=el('historicalImportPreview');if(!root)return;root.replaceChildren();if(!importBatch)return;
    root.append(card(importBatch.batch.title,String(importBatch.batch.data.completionState),tx('Empreinte','Fingerprint')+': '+String(importBatch.preview.fingerprint)+' · '+tx('lignes','rows')+': '+String(importBatch.preview.rowCount)+' · '+tx('anomalies','issues')+': '+String(importBatch.preview.issues.length)));
    el('historicalImportApprove').disabled=importBatch.preview.issues.length>0;el('historicalImportApply').disabled=true;
  };

  el('expectedContributionForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createExpectedContribution({membershipId:value('expectedMember'),title:value('expectedTitle'),dueAt:new Date(value('expectedDue')).toISOString(),amount:number('expectedAmount')});await renderArrears();notify(tx('Attendu créé.','Expectation created.'));});});
  el('arrearsRefresh')?.addEventListener('click',()=>void run(renderArrears));
  el('savingsPlanForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createSavingsPlan({membershipId:value('savingsMember'),name:value('savingsName'),targetAmount:value('savingsTarget')?number('savingsTarget'):undefined});await renderSavings();});});
  el('openingBalanceForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.recordOpeningBalance(number('openingBalanceAmount'),value('openingBalanceNote'));notify(tx('Solde d’ouverture comptabilisé.','Opening balance posted.'));});});
  el('custodyForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createCustody({name:value('custodyName'),holder:value('custodyHolder')});await renderCustody();});});
  el('solidarityForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createSolidarityCase({beneficiaryMembershipId:value('solidarityMember'),title:value('solidarityTitle'),approvedAmount:number('solidarityApproved')});await renderSolidarity();});});
  el('stockForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createStockItem({sku:value('stockSku'),name:value('stockName'),quantity:number('stockQuantity')});await renderMarket();});});
  el('marketOrderForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{const stockItemId=value('orderStockItem');await app.createMarketOrder({stockItemId,quantity:number('orderQuantity'),customerRef:value('orderCustomer'),unitPrice:value('orderUnitPrice')?number('orderUnitPrice'):undefined});await app.recordEcoPulse({itemId:stockItemId,itemKind:'shop-item',action:'PURCHASE_INTENT',source:'group-shop',groupId:app.activeGroup(),tags:['marketplace','purchase-intent']}).catch(()=>{});await renderMarket();});});
  el('groupBuyForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createGroupBuy({title:value('groupBuyTitle'),stockItemId:value('groupBuyStock')||undefined,thresholdQuantity:number('groupBuyThreshold'),deadline:new Date(value('groupBuyDeadline')).toISOString()});await renderMarket();});});
  el('valueNetworkPresetActions')?.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('[data-value-network-preset]'):null;if(!b)return;window.dispatchEvent(new CustomEvent('eco:value-network-preset',{detail:{kind:b.dataset.valueNetworkPreset}}));document.getElementById('valueNetworkOperational')?.scrollIntoView({behavior:'smooth',block:'start'});});
  el('socialFlashForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createFlashOffer({kind:value('socialFlashKind'),title:value('socialFlashTitle'),reason:value('socialFlashReason'),condition:value('socialFlashCondition'),quantity:number('socialFlashQuantity'),unit:value('socialFlashUnit'),unitPrice:number('socialFlashPrice'),currency:'XAF',locality:value('socialFlashLocality'),expiresAt:localIso('socialFlashExpires'),evidenceRef:value('socialFlashEvidence')});e.target.reset();await renderSocialCommerce();notify(tx('Offre urgente publiée avec ses preuves et conditions.','Urgent offer published with evidence and conditions.'));});});
  el('socialRequestForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{const raw=value('socialRequestNeededBy');await app.createMarketRequest({title:value('socialRequestTitle'),category:value('socialRequestCategory'),quantity:number('socialRequestQuantity'),unit:value('socialRequestUnit'),locality:value('socialRequestLocality'),neededBy:raw?new Date(raw+'T23:59:59').toISOString():undefined,budgetMax:value('socialRequestBudget')?number('socialRequestBudget'):undefined,currency:'XAF',conditions:value('socialRequestConditions'),evidenceRef:value('socialRequestEvidence'),sourceType:value('socialRequestSource'),predictionReason:value('socialRequestPredictionReason')||undefined});e.target.reset();await renderSocialCommerce();notify(tx('Demande créée en brouillon. Une prévision doit encore être acceptée humainement.','Request created as draft. A prediction still requires human acceptance.'));});});
  el('socialDealForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createDeal({title:value('socialDealTitle'),dealType:value('socialDealType'),publicUnitPrice:number('socialDealPrice'),currency:'XAF',quantity:number('socialDealQuantity'),availability:value('socialDealAvailability'),publicConditions:value('socialDealConditions'),expiresAt:localIso('socialDealExpires'),privateSupplierPrice:value('socialDealSupplierPrice')?number('socialDealSupplierPrice'):undefined,privateMinimum:value('socialDealPrivateMinimum')?number('socialDealPrivateMinimum'):undefined,commission:value('socialDealCommission')?number('socialDealCommission'):undefined,priceTiers:parseTiers(value('socialDealTiers'))});e.target.reset();await renderSocialCommerce();notify(tx('Deal créé en brouillon : les conditions publiques sont séparées des termes privés.','Deal created as draft: public conditions are separate from private terms.'));});});
  el('socialLiveForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createLiveMarket({title:value('socialLiveTitle'),theme:value('socialLiveTheme'),scheduledAt:localIso('socialLiveScheduled'),mode:value('socialLiveMode'),communityHubId:value('socialLiveHub')||undefined,providerRef:value('socialLiveProvider')||undefined,pinnedDealId:value('socialLiveDeal')||undefined});e.target.reset();await renderSocialCommerce();notify(tx('Session Live créée sans faux compteur ni fausse urgence.','Live session created without fake counter or fake urgency.'));});});

  el('historicalImportForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{const file=el('historicalImportFile').files?.[0];if(!file)throw Error('IMPORT_FILE_REQUIRED');const text=await file.text();importBatch=await app.previewHistoricalCsv({title:value('historicalImportTitle'),kind:value('historicalImportKind'),text});renderImport();});});
  el('historicalImportApprove')?.addEventListener('click',()=>void run(async()=>{const batch=await app.approveHistoricalImport(importBatch.batch.id);importBatch.batch=batch;el('historicalImportApprove').disabled=true;el('historicalImportApply').disabled=false;renderImport();el('historicalImportApply').disabled=false;}));
  el('historicalImportApply')?.addEventListener('click',()=>void run(async()=>{const batch=await app.applyHistoricalImport(importBatch.batch.id);importBatch.batch=batch;renderImport();el('historicalImportApply').disabled=true;notify(tx('Import appliqué et tracé.','Import applied and traced.'));}));

  const refresh=async()=>{refillMembers();if(!app.activeGroup())return;await Promise.all([renderArrears(),renderSavings(),renderCustody(),renderSolidarity(),renderMarket(),renderSocialCommerce()]);};
  return{refresh,setLocale:refresh};
};
