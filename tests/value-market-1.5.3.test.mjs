import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';

const tenant='tenant_value',groupId='group_value',managerId='manager_value',memberUser='member_value',memberId='membership_value';
const setCtx=(kernel,actorId,roles,activeGroupId=groupId)=>kernel.context.set({
  actorId,tenantId:tenant,activeGroupId,groupRoles:roles,mandateIds:[],deviceId:'value-device',sessionId:'value-'+actorId,
  locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-'+actorId+'-'+Date.now()
});

async function seed(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  await repo.saveUser({id:managerId,displayName:'Gestionnaire Valeur',locale:'fr',createdAt:'2026-09-23T00:00:00Z'});
  await repo.saveUser({id:memberUser,displayName:'Membre Valeur',locale:'fr',createdAt:'2026-09-23T00:00:00Z'});
  await repo.saveGroup({id:groupId,tenantId:tenant,name:'Groupe Value',kind:'association',governanceModel:'community',status:'active',createdBy:managerId,createdAt:'2026-09-23T00:00:00Z'});
  await repo.saveMembership({id:'manager_membership_value',tenantId:tenant,groupId,userId:managerId,roles:['founder','manager'],status:'active',joinedAt:'2026-09-23T00:00:00Z'});
  await repo.saveMembership({id:memberId,tenantId:tenant,groupId,userId:memberUser,roles:['member'],status:'active',joinedAt:'2026-09-23T00:00:00Z'});
  setCtx(kernel,managerId,['founder','manager']);
  const market=new MarketService(repo,kernel);
  const stock=await market.createStock(groupId,{sku:'SAVON-01',name:'Carton savon',quantity:20,unit:'carton',unitPrice:1000,published:true});
  const supplier=await market.registerSupplier(groupId,{name:'Fournisseur A',locality:'Yaoundé',paymentTerms:'Comptant'});
  return{repo,kernel,market,stock,supplier};
}

test('step 14: NOW/Surplus/Rescue discloses the real discount and a member claim becomes one canonical order',async()=>{
  const {repo,kernel,market,stock}=await seed(),observedAt=new Date(Date.now()-60000).toISOString(),expiresAt=new Date(Date.now()+86400000).toISOString();
  await assert.rejects(()=>market.createFlashOffer(groupId,{type:'NOW_LIQUIDATION',stockItemId:stock.id,quantity:5,offerPrice:700,originalPrice:1000,reason:'',condition:'Bon état',observedAt,expiresAt,disclosure:'Rabais transparent'}),/FLASH_DISCLOSURE_REQUIRED/);
  await assert.rejects(()=>market.createFlashOffer(groupId,{type:'NOW_LIQUIDATION',stockItemId:stock.id,quantity:5,offerPrice:1200,originalPrice:1000,reason:'Rotation rapide',condition:'Bon état',observedAt,expiresAt,disclosure:'Aucun défaut caché'}),/INVALID_FLASH_PRICE/);
  const offer=await market.createFlashOffer(groupId,{type:'NOW_LIQUIDATION',stockItemId:stock.id,quantity:5,offerPrice:700,originalPrice:1000,reason:'Rotation rapide',condition:'Bon état',observedAt,expiresAt,disclosure:'Aucun défaut caché ; remise liée au délai'});
  assert.equal(offer.data.claimedQuantity,0);assert.equal(offer.data.noHiddenDefectConfirmed,true);
  setCtx(kernel,memberUser,['member']);
  const claim=await market.claimFlashOffer(groupId,offer.id,memberId,2);
  assert.equal(claim.order.data.marketKind,'MARKET_ORDER');assert.equal(claim.order.data.unitPrice,700);assert.equal(claim.order.data.membershipId,memberId);
  assert.equal(claim.offer.data.claimedQuantity,2);
  const stockAfter=(await repo.listWorkspaceRecords(tenant,'MARKETPLACE.CORE',groupId)).find(x=>x.id===stock.id);
  assert.equal(Number(stockAfter.data.reserved),2);
  await assert.rejects(()=>market.claimFlashOffer(groupId,offer.id,memberId,4),/FLASH_OFFER_QUANTITY_EXCEEDED/);
});

test('steps 15-16: predicted demand requires accepted anticipation then Reverse Market reaches canonical procurement',async()=>{
  const {repo,kernel,market,supplier}=await seed(),stamp=new Date().toISOString();
  await assert.rejects(()=>market.createMarketRequest(groupId,{title:'Besoin savon',origin:'PREDICTED',category:'savon',quantity:10}),/PREDICTION_REF_REQUIRED/);
  await repo.saveWorkspaceRecord({id:'prediction_value',tenantId:tenant,groupId,moduleId:'GROUP.ANTICIPATION',title:'Anticipation savon',status:'DRAFT',tags:['anticipation'],data:{humanValidated:false},createdBy:managerId,createdAt:stamp,updatedAt:stamp});
  await assert.rejects(()=>market.createMarketRequest(groupId,{title:'Besoin savon',origin:'PREDICTED',category:'savon',quantity:10,predictionRef:'prediction_value'}),/PREDICTION_NOT_HUMAN_ACCEPTED/);
  const prediction=await repo.getWorkspaceRecord(tenant,'prediction_value');await repo.saveWorkspaceRecord({...prediction,status:'ACTIVE',data:{...prediction.data,humanValidated:true},updatedAt:new Date().toISOString()});
  const request=await market.createMarketRequest(groupId,{title:'Besoin savon',origin:'PREDICTED',category:'savon',quantity:10,unit:'carton',locality:'Yaoundé',budgetMax:15000,predictionRef:'prediction_value'});
  assert.equal(request.data.state,'PREDICTED');assert.equal(request.data.humanValidated,false);
  await assert.rejects(()=>market.respondMarketRequest(groupId,request.id,{supplierId:supplier.id,unitPrice:900,quantity:10,deliveryCost:500,delayText:'24 h',conditions:'Livraison groupée',availability:'Disponible'}),/MARKET_REQUEST_NOT_OPEN/);
  await market.validateMarketRequest(groupId,request.id);
  const response=await market.respondMarketRequest(groupId,request.id,{supplierId:supplier.id,unitPrice:900,quantity:10,deliveryCost:500,delayText:'24 h',conditions:'Livraison groupée',availability:'Disponible',evidenceRef:'devis-001',variant:'Savon 400 g'});
  assert.equal(response.data.landedCost,9500);
  await market.shortlistMarketResponse(groupId,response.id);await market.selectMarketResponse(groupId,response.id);
  const procurement=await market.materializeMarketRequestProcurement(groupId,request.id);
  assert.equal(procurement.data.marketRequestId,request.id);assert.equal(procurement.data.marketResponseId,response.id);assert.equal(procurement.data.source,'REVERSE_MARKET');assert.equal(procurement.data.landedCost,9500);
  const current=(await market.marketRequests(groupId)).find(x=>x.id===request.id);assert.equal(current.data.state,'FULFILLMENT');assert.equal(current.data.procurementId,procurement.id);
});

test('step 17: Eco Deals use real thresholds and price tiers, keep internal terms private, then materialize canonical orders',async()=>{
  const {kernel,market,stock,supplier}=await seed();
  await assert.rejects(()=>market.createDeal(groupId,{title:'Faux palier',dealType:'GROUP_DEAL',supplierId:supplier.id,stockItemId:stock.id,publicPrice:1000,supplierPrice:650,supplierMinimum:3,maxQuantity:10,delivery:'48 h',quality:'Neuf',commission:50,deadline:new Date(Date.now()+86400000).toISOString(),tiers:[{minQty:3,price:1100}]}),/INVALID_DEAL_TIERS/);
  const deal=await market.createDeal(groupId,{title:'Deal savon',dealType:'GROUP_DEAL',supplierId:supplier.id,stockItemId:stock.id,publicPrice:1000,supplierPrice:650,supplierMinimum:3,maxQuantity:10,delivery:'48 h',quality:'Neuf',commission:50,promotion:'Affichage groupe',volumeBonus:'1 carton démonstration',deadline:new Date(Date.now()+86400000).toISOString(),tiers:[{minQty:3,price:900},{minQty:5,price:800}]});
  assert.equal(deal.data.realMoney,false);assert.equal(deal.data.internalTermsConfidential,true);
  setCtx(kernel,memberUser,['member']);let committed=await market.commitDeal(groupId,deal.id,memberId,2);assert.equal(committed.data.state,'OPEN');
  committed=await market.commitDeal(groupId,deal.id,memberId,1);assert.equal(committed.data.state,'THRESHOLD_MET');assert.equal(committed.data.currentPublicPrice,900);
  const publicDeals=await market.deals(groupId,false),publicDeal=publicDeals.find(x=>x.id===deal.id);assert.equal(publicDeal.data.supplierPrice,undefined);assert.equal(publicDeal.data.commission,undefined);
  setCtx(kernel,managerId,['founder','manager']);const internal=(await market.deals(groupId,true)).find(x=>x.id===deal.id);assert.equal(internal.data.supplierPrice,650);assert.equal(internal.data.commission,50);
  await market.activateDeal(groupId,deal.id);const orders=await market.materializeDealOrders(groupId,deal.id);assert.equal(orders.length,1);assert.equal(orders[0].data.marketKind,'MARKET_ORDER');assert.equal(orders[0].data.unitPrice,900);assert.equal(orders[0].data.quantity,3);
  const after=(await market.deals(groupId,true)).find(x=>x.id===deal.id);assert.equal(after.data.state,'FULFILLMENT');
});

test('step 19: Live Market has progressive capability, pinned product/deal, unique real participants and Q&A',async()=>{
  const {kernel,market,stock,supplier}=await seed();
  const deal=await market.createDeal(groupId,{title:'Deal live',dealType:'PUBLIC_DEAL',supplierId:supplier.id,stockItemId:stock.id,publicPrice:1000,supplierMinimum:2,maxQuantity:8,delivery:'24 h',quality:'Neuf',deadline:new Date(Date.now()+86400000).toISOString(),tiers:[]});
  const live=await market.createLiveMarket(groupId,{title:'Mercredi marché',theme:'Savons et bons plans',scheduledAt:new Date(Date.now()+3600000).toISOString(),capabilityLevel:3,dealId:deal.id,stockItemId:stock.id,mediaRef:'stream:community-value'});
  assert.equal(live.data.capabilityLevel,3);assert.equal(live.data.realCounter,true);assert.equal(live.data.dealId,deal.id);assert.equal(live.data.stockItemId,stock.id);assert.equal(live.data.stockTitle,'Carton savon');
  let current=await market.transitionLiveMarket(groupId,live.id,'LIVE');assert.equal(current.data.state,'LIVE');
  setCtx(kernel,memberUser,['member']);await market.joinLiveMarket(groupId,live.id);current=await market.joinLiveMarket(groupId,live.id);assert.equal(current.data.viewerCount,1);
  current=await market.askLiveMarket(groupId,live.id,'Le prix baisse-t-il au seuil ?');const questions=JSON.parse(String(current.data.questionsJson));assert.equal(questions.length,1);assert.match(questions[0].text,/prix baisse/);
  setCtx(kernel,managerId,['founder','manager']);current=await market.transitionLiveMarket(groupId,live.id,'ENDED');assert.equal(current.data.state,'ENDED');assert.equal(current.status,'DONE');
});

test('Value Market capabilities and UI are first-class rather than Blueprint-only labels',async()=>{
  for(const id of ['MARKETPLACE.DEMAND_EXCHANGE','MARKETPLACE.ECO_NOW','MARKETPLACE.DEALS','MARKETPLACE.LIVE_MARKET']){
    const capability=PRODUCT_MODULES.find(x=>x.id===id);assert.ok(capability,id);assert.equal(capability.status,'FOUNDATION_ACTIVE');
  }
  const ui=fs.readFileSync('apps/web/src/value-market-ui.js','utf8'),html=fs.readFileSync('apps/web/index.html','utf8'),market=fs.readFileSync('packages/market/src/index.ts','utf8'),blueprint=fs.readFileSync('apps/web/src/blueprint-executable-ui.js','utf8');
  for(const phrase of ['NOW Liquidation','Predictive Demand Exchange','Eco Reverse Market','Eco Deals','Eco Live Market','Aucun paiement réel'])assert.ok(ui.includes(phrase),phrase);
  assert.match(html,/id="valueMarketPanel"/);assert.match(html,/id="valueMarketRoot"/);
  assert.match(market,/materializeMarketRequestProcurement/);assert.match(market,/claimFlashOffer/);assert.match(market,/materializeDealOrders/);
  assert.match(blueprint,/MARKETPLACE\.DEMAND_EXCHANGE/);assert.match(blueprint,/MARKETPLACE\.PROCUREMENT/);assert.match(blueprint,/MARKETPLACE\.ECO_NOW/);assert.match(blueprint,/valueMarketPanel/);
  assert.match(blueprint,/ne crée plus de dossier parallèle/);
});
