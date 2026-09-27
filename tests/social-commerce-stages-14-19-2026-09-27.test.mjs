import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';

async function setup(){
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),tenantId='t_social',groupId='g_social',actorId='owner_social';
 kernel.context.set({actorId,tenantId,activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
 await repo.saveUser({id:actorId,displayName:'Owner',locale:'fr',createdAt:new Date().toISOString()});
 await repo.saveGroup({id:groupId,tenantId,name:'Groupe marché',kind:'association',governanceModel:'community',status:'active',createdBy:actorId,createdAt:new Date().toISOString()});
 return{repo,kernel,market:new MarketService(repo,kernel),groupId};
}
const future=d=>new Date(Date.now()+d*86400000).toISOString();

test('urgent flash offer requires truthful reason condition date quantity and evidence',async()=>{
 const {market,groupId}=await setup();
 await assert.rejects(()=>market.createFlashOffer(groupId,{kind:'RESCUE',title:'Tomates',reason:'',condition:'Bon état',quantity:20,unit:'caisse',unitPrice:5000,expiresAt:future(2),evidenceRef:'photo-1'}),/FLASH_OFFER_DISCLOSURE_REQUIRED/);
 const x=await market.createFlashOffer(groupId,{kind:'RESCUE',title:'Tomates',reason:'Arrivage à écouler avant samedi',condition:'Bon état documenté',quantity:20,unit:'caisse',unitPrice:5000,expiresAt:future(2),evidenceRef:'photo-1'});
 assert.equal(x.data.flashKind,'RESCUE');assert.equal(x.data.truthDisclosure,true);assert.equal(x.data.state,'OPEN');
});

test('predicted demand can never open before explicit human acceptance',async()=>{
 const {market,groupId}=await setup();
 const req=await market.createMarketRequest(groupId,{title:'Boissons fête',category:'boisson',quantity:100,unit:'casier',sourceType:'PREDICTION',predictionReason:'RI: fête annuelle en décembre'});
 await assert.rejects(()=>market.openMarketRequest(groupId,req.id),/HUMAN_ACCEPTANCE_REQUIRED/);
 await market.acceptPredictedMarketRequest(groupId,req.id);const opened=await market.openMarketRequest(groupId,req.id);assert.equal(opened.data.requestState,'OPEN');
});

test('reverse market follows request responses shortlist selected fulfillment closed without creating money',async()=>{
 const {repo,market,groupId}=await setup();
 let req=await market.createMarketRequest(groupId,{title:'Restauration fête',category:'restauration',quantity:180,unit:'personne',locality:'Yaoundé',sourceType:'MANUAL'});
 req=await market.openMarketRequest(groupId,req.id);
 const a=await market.respondMarketRequest(groupId,req.id,{supplierRef:'supplier-a',price:450000,availableQuantity:180,conditions:'Buffet complet',evidenceRef:'devis-a'});
 await market.shortlistMarketResponse(groupId,req.id,a.id);req=await market.selectMarketResponse(groupId,req.id,a.id);assert.equal(req.data.requestState,'SELECTED');
 req=await market.transitionMarketRequest(groupId,req.id,'FULFILLMENT','Commande externe à confirmer');req=await market.transitionMarketRequest(groupId,req.id,'CLOSED','Livraison documentée');assert.equal(req.data.requestState,'CLOSED');
 assert.equal((await repo.listLedgerEntries('t_social',groupId)).length,0,'market workflow must not invent a financial posting');
});

test('deal price drop uses only declared real tiers and never increases price',async()=>{
 const {market,groupId}=await setup();
 await assert.rejects(()=>market.createDeal(groupId,{title:'Deal savon',dealType:'BULK',publicUnitPrice:21000,quantity:200,availability:'Stock confirmé',publicConditions:'Retrait dépôt',expiresAt:future(5),priceTiers:[{minQuantity:50,unitPrice:20000},{minQuantity:100,unitPrice:20500}]}),/PRICE_DROP_TIER_MUST_NOT_INCREASE/);
 let deal=await market.createDeal(groupId,{title:'Deal savon',dealType:'BULK',publicUnitPrice:21000,quantity:200,availability:'Stock confirmé',publicConditions:'Retrait dépôt',expiresAt:future(5),priceTiers:[{minQuantity:50,unitPrice:20500},{minQuantity:100,unitPrice:20000},{minQuantity:150,unitPrice:19700}]});
 deal=await market.openDeal(groupId,deal.id);const committed=await market.commitDealQuantity(groupId,deal.id,120);deal=committed.deal;assert.equal(deal.data.effectiveUnitPrice,20000);assert.equal(deal.data.committedQuantity,120);const proof=await market.dealCommitments(groupId,deal.id);assert.equal(proof.length,1);assert.equal(proof[0].data.quantity,120);assert.ok(proof[0].data.actorId);
});

test('live market is progressive and refuses fabricated video/live prerequisites',async()=>{
 const {market,groupId}=await setup();
 await assert.rejects(()=>market.createLiveMarket(groupId,{title:'Marché vidéo',scheduledAt:future(1),mode:'VIDEO'}),/VIDEO_PROVIDER_REFERENCE_REQUIRED/);
 await assert.rejects(()=>market.createLiveMarket(groupId,{title:'Marché interactif',scheduledAt:future(1),mode:'INTERACTIVE'}),/COMMUNITY_HUB_REQUIRED/);
 let live=await market.createLiveMarket(groupId,{title:'Marché texte',theme:'Rentrée',scheduledAt:future(1),mode:'TEXT'});live=await market.setLiveMarketState(groupId,live.id,'SCHEDULED');live=await market.setLiveMarketState(groupId,live.id,'LIVE');assert.equal(live.data.liveState,'LIVE');assert.equal(live.data.realViewerCount,false);assert.equal(live.data.falseCountdown,false);
});
