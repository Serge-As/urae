const el=id=>document.getElementById(id);
const value=id=>String(el(id)?.value??'').trim();
const number=id=>Number(value(id));
const opt=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
const card=(title,meta,body='')=>{const a=document.createElement('article');a.className='item';const h=document.createElement('strong');h.textContent=title;a.append(h);if(body){const p=document.createElement('p');p.textContent=body;a.append(p);}if(meta){const s=document.createElement('small');s.textContent=meta;a.append(s);}return a;};

export const mountAdvancedUI=({app,notify,showError,getMembers,fmt,translate})=>{
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
      const b=document.createElement('button');b.type='button';b.textContent=tx('Participer','Join');b.onclick=()=>void run(async()=>{const member=getMembers().find(m=>m.userId===app.currentActor());if(!member)throw Error('MEMBERSHIP_NOT_FOUND');const raw=prompt(tx('Quantité','Quantity'),'1');if(raw===null)return;await app.commitGroupBuy(x.id,member.id,Number(raw));await renderMarket();});a.append(b);br.append(a);}}
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
  el('marketOrderForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createMarketOrder({stockItemId:value('orderStockItem'),quantity:number('orderQuantity'),customerRef:value('orderCustomer'),unitPrice:value('orderUnitPrice')?number('orderUnitPrice'):undefined});await renderMarket();});});
  el('groupBuyForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{await app.createGroupBuy({title:value('groupBuyTitle'),stockItemId:value('groupBuyStock')||undefined,thresholdQuantity:number('groupBuyThreshold'),deadline:new Date(value('groupBuyDeadline')).toISOString()});await renderMarket();});});
  el('historicalImportForm')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{const file=el('historicalImportFile').files?.[0];if(!file)throw Error('IMPORT_FILE_REQUIRED');const text=await file.text();importBatch=await app.previewHistoricalCsv({title:value('historicalImportTitle'),kind:value('historicalImportKind'),text});renderImport();});});
  el('historicalImportApprove')?.addEventListener('click',()=>void run(async()=>{const batch=await app.approveHistoricalImport(importBatch.batch.id);importBatch.batch=batch;el('historicalImportApprove').disabled=true;el('historicalImportApply').disabled=false;renderImport();el('historicalImportApply').disabled=false;}));
  el('historicalImportApply')?.addEventListener('click',()=>void run(async()=>{const batch=await app.applyHistoricalImport(importBatch.batch.id);importBatch.batch=batch;renderImport();el('historicalImportApply').disabled=true;notify(tx('Import appliqué et tracé.','Import applied and traced.'));}));

  const refresh=async()=>{refillMembers();if(!app.activeGroup())return;await Promise.all([renderArrears(),renderSavings(),renderCustody(),renderSolidarity(),renderMarket()]);};
  return{refresh,setLocale:refresh};
};
