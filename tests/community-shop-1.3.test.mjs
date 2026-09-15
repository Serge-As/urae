import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {CommunityService} from '../.build/packages/community/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';

const context=(kernel,actorId='owner')=>kernel.context.set({tenantId:'tenant_a',actorId,activeGroupId:'group_a',groupRoles:actorId==='owner'?['founder','manager']:['member'],mandateIds:[],deviceId:'d',sessionId:'s-'+actorId,locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r-'+actorId});
const group={id:'group_a',tenantId:'tenant_a',name:'Association A',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-15T00:00:00.000Z'};

test('community hub posts are group-scoped, governable and federate only by public group codes',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);
  await repo.saveMembership({id:'member_a',tenantId:'tenant_a',groupId:'group_a',userId:'member',roles:['member'],status:'active',joinedAt:'2026-09-15T00:00:00.000Z'});
  const svc=new CommunityService(repo,kernel);
  const hub=await svc.createHub('group_a',{title:'Femmes entrepreneures',visibility:'PLATFORM_PUBLIC',tags:['commerce','entraide'],federatedGroupCodes:['ECO-GRP-ABCDE-FGHIJ-KL']});
  assert.equal(hub.data.visibility,'PLATFORM_PUBLIC');
  context(kernel,'member');
  const post=await svc.createPost('group_a',{hubId:hub.id,kind:'OFFER',title:'Savon',body:'Nous avons un lot disponible pour un achat groupé.'});
  assert.equal((await svc.listPosts('group_a',hub.id)).length,1);
  context(kernel,'owner');
  const hidden=await svc.moderate('group_a',post.id,'HIDDEN','Annonce expirée');assert.equal(hidden.data.moderationState,'HIDDEN');
  context(kernel,'member');assert.equal((await svc.listPosts('group_a',hub.id)).length,0);
  const fed=await svc.federationProfile('group_a',hub.id);assert.deepEqual(fed.federatedGroupCodes,['ECO-GRP-ABCDE-FGHIJ-KL']);assert.equal(fed.safeProjection,true);
});

test('group boutique reuses canonical stock and exposes only published available quantity',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);
  const market=new MarketService(repo,kernel);
  const shop=await market.createOrUpdateShop('group_a',{name:'Boutique Association A',visibility:'PUBLIC',locality:'Yaoundé',categories:['savon','huile']});
  assert.equal(shop.data.marketKind,'SHOP');
  const soap=await market.createStock('group_a',{sku:'SAVON-01',name:'Savon',quantity:12,unit:'pièce',unitPrice:500,published:true,description:'Savon du groupement'});
  const oil=await market.createStock('group_a',{sku:'HUILE-01',name:'Huile',quantity:10,unit:'litre',unitPrice:1200,published:false});
  await market.createOrder('group_a',{stockItemId:soap.id,quantity:3,customerRef:'client-1',unitPrice:500});
  const storefront=await market.storefront('group_a');
  assert.equal(storefront.shop.name,'Boutique Association A');assert.equal(storefront.items.length,1);assert.equal(storefront.items[0].available,9);
  await market.setStockListing('group_a',oil.id,{published:true,unitPrice:1250});
  assert.equal((await market.storefront('group_a')).items.length,2);
});

test('boutique listing never creates a second ledger or inventory record',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);
  const market=new MarketService(repo,kernel);
  const item=await market.createStock('group_a',{sku:'A',name:'Article',quantity:5,published:false});
  await market.setStockListing('group_a',item.id,{published:true,unitPrice:100});
  const records=await repo.listWorkspaceRecords('tenant_a',undefined,'group_a');
  assert.equal(records.filter(x=>x.data.marketKind==='STOCK_ITEM').length,1);
  assert.equal((await repo.listLedgerEntries('tenant_a','group_a')).length,0,'publishing a catalog item is not a financial transaction');
});
