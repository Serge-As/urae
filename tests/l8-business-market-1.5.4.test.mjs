import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';

async function setup(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  const tenantId='tenant_l8',groupId='group_l8',actorId='manager_l8';
  kernel.context.set({actorId,tenantId,activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'l8-device',sessionId:'l8-session',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'l8-request'});
  await repo.saveUser({id:actorId,displayName:'Manager L8',locale:'fr',createdAt:'2026-09-25T00:00:00Z'});
  await repo.saveGroup({id:groupId,tenantId,name:'Groupe L8',kind:'association',governanceModel:'community',status:'active',createdBy:actorId,createdAt:'2026-09-25T00:00:00Z'});
  return {repo,kernel,groupId,market:new MarketService(repo,kernel)};
}

test('L8 atomically reserves commercial stock and keeps an immutable movement projection',async()=>{
  const {market,groupId}=await setup();
  const stock=await market.createStock(groupId,{sku:'L8-SOAP',name:'Savon',quantity:5,unitPrice:1000,published:true,ownership:'COMMERCIAL'});
  const order=await market.createOrder(groupId,{stockItemId:stock.id,quantity:3,customerRef:'client-l8',unitPrice:900});
  assert.equal(order.data.state,'CONFIRMED');
  const projection=await market.stockProjection(groupId,stock.id);
  assert.deepEqual(projection.current,{quantity:5,reserved:3});
  assert.equal(projection.matchesCurrent,true);
  assert.equal(projection.complete,true);
  assert.ok(projection.movementCount>=2);
  await assert.rejects(()=>market.createOrder(groupId,{stockItemId:stock.id,quantity:3,customerRef:'too-much'}),/INSUFFICIENT_STOCK/);
});

test('L8 supplier invoice reconciliation and credit note keep the exact debtor and reduce outstanding supplier credit',async()=>{
  const {market,groupId}=await setup();
  const supplier=await market.registerSupplier(groupId,{name:'Fournisseur L8',locality:'Yaoundé'});
  const p=await market.createProcurement(groupId,{supplierId:supplier.id,debtorType:'GROUP',debtorRef:groupId,lines:[{sku:'L8-OIL',label:'Huile',quantity:4,unitCost:1000}],freight:500,otherCosts:0,currency:'XAF',creditDueAt:'2027-01-15T00:00:00.000Z'});
  await market.receiveProcurement(groupId,p.id,{lines:[{lineIndex:0,quantity:4}],stockOwnership:'COMMERCIAL'});
  const invoice=await market.recordSupplierInvoice(groupId,{procurementId:p.id,invoiceRef:'FAC-L8-01',amount:4700,currency:'XAF',evidenceRef:'r2://invoice/l8'});
  await assert.rejects(()=>market.reconcileSupplierInvoice(groupId,{procurementId:p.id,invoiceId:invoice.id}),/RECONCILIATION_VARIANCE_NOTE_REQUIRED/);
  const reconciliation=await market.reconcileSupplierInvoice(groupId,{procurementId:p.id,invoiceId:invoice.id,note:'Écart fournisseur documenté'});
  assert.equal(reconciliation.data.difference,200);
  await market.issueSupplierCreditNote(groupId,{procurementId:p.id,invoiceId:invoice.id,amount:200,reason:'Remise fournisseur',evidenceRef:'r2://credit-note/l8'});
  const lifecycle=await market.procurementLifecycle(groupId,p.id);
  assert.equal(lifecycle.creditNotes.length,1);
  assert.equal(lifecycle.credits.length,1);
  assert.equal(lifecycle.credits[0].data.debtorRef,groupId);
  assert.equal(lifecycle.credits[0].data.principal,4300);
});
