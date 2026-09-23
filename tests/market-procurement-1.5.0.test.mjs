import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';

const setup=async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),tenantId='t',groupId='g',actorId='manager';
  kernel.context.set({actorId,tenantId,activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
  await repo.saveUser({id:actorId,displayName:'Gestionnaire',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveGroup({id:groupId,tenantId,name:'Groupe test',kind:'association',governanceModel:'community',status:'active',createdBy:actorId,createdAt:new Date().toISOString()});
  return{repo,kernel,market:new MarketService(repo,kernel),groupId};
};

test('pot-reserved stock cannot be published or sold through the commercial storefront',async()=>{
  const {market,groupId}=await setup();
  const pot=await market.createStock(groupId,{sku:'POT-1',name:'Savons tontine',quantity:20,unitPrice:500,published:true,ownership:'POT_RESERVED'});
  assert.equal(pot.data.published,false);
  await assert.rejects(()=>market.setStockListing(groupId,pot.id,{published:true}),/POT_STOCK_NOT_SELLABLE/);
  await assert.rejects(()=>market.createOrder(groupId,{stockItemId:pot.id,quantity:1,customerRef:'client'}),/POT_STOCK_NOT_SELLABLE/);
  const storefront=await market.storefront(groupId);assert.equal(storefront.items.some(x=>x.id===pot.id),false);
});

test('supplier procurement records landed cost and exact debtor before creating credit',async()=>{
  const {market,groupId}=await setup();
  const supplier=await market.registerSupplier(groupId,{name:'Fournisseur A',locality:'Yaoundé'});
  await assert.rejects(()=>market.createProcurement(groupId,{supplierId:supplier.id,debtorType:'GROUP',debtorRef:'wrong-group',lines:[{label:'Huile',quantity:10,unitCost:1000}],freight:2000,otherCosts:500,currency:'XAF'}),/SUPPLIER_CREDIT_DEBTOR_MISMATCH/);
  const p=await market.createProcurement(groupId,{supplierId:supplier.id,debtorType:'GROUP',debtorRef:groupId,lines:[{sku:'HUILE-1',label:'Huile',quantity:10,unitCost:1000}],freight:2000,otherCosts:500,currency:'XAF',creditDueAt:'2027-01-15T00:00:00.000Z'});
  assert.equal(p.data.goodsCost,10000);assert.equal(p.data.landedCost,12500);
  await market.receiveProcurement(groupId,p.id,{lines:[{lineIndex:0,quantity:10}],stockOwnership:'COMMERCIAL'});
  const state=await market.procurement(groupId);
  assert.equal(state.credits.length,1);assert.equal(state.credits[0].data.debtorRef,groupId);assert.equal(state.credits[0].data.principal,12500);
});
