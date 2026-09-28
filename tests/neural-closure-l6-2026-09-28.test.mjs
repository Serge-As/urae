import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {StarterKitService} from '../.build/packages/starter-kit/src/index.js';
import {ValueNetworkService} from '../.build/packages/value-network/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';
import {BusinessStudioService} from '../.build/packages/business-studio/src/index.js';

async function seed(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),tenantId='tenant_neural_l6',actorId='manager_neural_l6';
  kernel.context.set({actorId,tenantId,groupRoles:['founder','manager'],mandateIds:[],mandateGrants:[],deviceId:'l6-device',sessionId:'l6-session',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'l6-seed'});
  const foundation=new FoundationService(repo,kernel);
  await foundation.ensureUser({id:actorId,displayName:'Gestionnaire L6',locale:'fr',createdAt:new Date().toISOString()});
  const project=await foundation.createProject({tenantId,createdBy:actorId,name:'Association L6',kind:'association',governanceModel:'community',rubrics:[
    {key:'collation',name:'Collation',kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:1000},amountBasis:'PER_MEMBER',memberCount:12,sessions:12,duration:{value:12,unit:'MONTHS'},participationMode:'RULE_BASED',contributionMode:'MONEY',managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}
  ]});
  const group=await foundation.convertProjectToGroup(tenantId,project.id);
  kernel.context.set({actorId,tenantId,activeGroupId:group.id,groupRoles:['founder','manager'],mandateIds:[],mandateGrants:[],deviceId:'l6-device',sessionId:'l6-session',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'l6-run'});
  return{repo,kernel,group,kit:new StarterKitService(repo,kernel),value:new ValueNetworkService(repo,kernel),market:new MarketService(repo,kernel),business:new BusinessStudioService(repo,kernel)};
}

test('L6 Starter Kit persists the governed pack through its canonical owner',async()=>{
  const {kit,group}=await seed();
  const saved=await kit.save(group.id,{
    kitVersion:'neural-l6',family:'association',governance:'community',members:12,sessions:12,
    rubricRowsJson:JSON.stringify([{name:'Collation',amount:1000}]),checklistJson:'[]',calendarJson:'[]',risksJson:'[]',rulesJson:'[]',
    feeExampleJson:'{}',latePolicyJson:'{}',simulationJson:JSON.stringify({central:{sessions:12}}),adviceJson:'[]',profileJson:'{}'
  });
  const current=await kit.current(group.id);
  assert.equal(current?.id,saved.id);
  assert.equal(current?.data.kitVersion,'neural-l6');
  assert.equal(JSON.parse(String(current?.data.rubricRowsJson))[0].name,'Collation');
});

test('L6 Value need becomes exactly one canonical Market procurement only after explicit approval',async()=>{
  const {value,market,group}=await seed();
  const need=await value.createNeed({groupId:group.id,title:'Huile pour activité',category:'huile',quantity:4,unit:'unité',locality:'Douala',neededBy:new Date(Date.now()+20*86400000).toISOString(),publicationConsent:true});
  await value.validateNeed(need.id);await value.publishNeed(need.id);
  const offer=await value.createOffer({kind:'SUPPLY',title:'Huile fournisseur',category:'huile',availableQuantity:20,unit:'unité',locality:'Douala',unitPrice:1000,currency:'XAF',expiresAt:new Date(Date.now()+30*86400000).toISOString(),availableBy:new Date(Date.now()+10*86400000).toISOString(),transportCost:500,otherCosts:200,discount:100,supplierRef:'supplier-external-l6'});
  const matches=await value.matchNeed(need.id);assert.equal(matches.some(x=>x.offer.id===offer.id),true);
  const draft=await value.prepareProcurement(need.id,offer.id);
  assert.equal(draft.moduleId,'MARKETPLACE.PROCUREMENT');
  assert.equal(draft.data.requiresExplicitApproval,true);
  assert.equal(draft.data.createsOrder,false);
  assert.equal(draft.data.createsDebt,false);
  assert.equal(Number(draft.data.landedCost),4600);

  const supplier=await market.registerSupplier(group.id,{name:'Fournisseur canonique L6',locality:'Douala'});
  const due=new Date(Date.now()+45*86400000).toISOString();
  const first=await market.approveValueProcurementDraft(group.id,draft.id,{supplierId:supplier.id,debtorType:'GROUP',debtorRef:group.id,creditDueAt:due});
  const replay=await market.approveValueProcurementDraft(group.id,draft.id,{supplierId:supplier.id,debtorType:'GROUP',debtorRef:group.id,creditDueAt:due});
  assert.equal(replay.id,first.id);
  assert.equal(first.data.sourceNeedId,need.id);
  assert.equal(first.data.sourceOfferId,offer.id);
  assert.equal(first.data.sourceDraftId,draft.id);
  assert.equal(Number(first.data.landedCost),4600);
  const state=await market.procurement(group.id);
  assert.equal(state.procurements.filter(x=>String(x.data.sourceDraftId)===draft.id).length,1);
  const storedDraft=await market.repo.getWorkspaceRecord('tenant_neural_l6',draft.id);
  assert.equal(storedDraft?.data.state,'HANDED_OFF');
  assert.equal(storedDraft?.data.procurementId,first.id);

  await market.receiveProcurement(group.id,first.id,{lines:[{lineIndex:0,quantity:2}],stockOwnership:'COMMERCIAL'});
  await market.receiveProcurement(group.id,first.id,{lines:[{lineIndex:0,quantity:2}],stockOwnership:'COMMERCIAL'});
  const lifecycle=await market.procurementLifecycle(group.id,first.id);
  assert.equal(lifecycle.procurement.data.state,'RECEIVED');
  assert.equal(lifecycle.credits.length,1);
  assert.equal(Number(lifecycle.credits[0].data.principal),4600);
});

test('L6 Business Studio closes prospect to quote contract order invoice and payment without touching collective Ledger',async()=>{
  const {business,repo,group}=await seed();
  const beforeLedger=(await repo.listLedgerEntries('tenant_neural_l6',group.id)).length;
  const client=await business.createClient({name:'Client L6',type:'BUSINESS'});
  const quote=await business.createQuote({clientId:client.id,title:'Devis L6',items:[{label:'Accompagnement',quantity:1,unitPrice:25000}]});
  await business.quoteDecision(quote.id,'ACCEPTED');
  const contract=await business.createContract({clientId:client.id,quoteId:quote.id,title:'Contrat L6',startsAt:new Date().toISOString(),scope:'Accompagnement de gestion'});
  const order=await business.createOrder({clientId:client.id,quoteId:quote.id,contractId:contract.id,title:'Commande L6',amount:25000});
  await business.setOrderState(order.id,'CONFIRMED');await business.setOrderState(order.id,'IN_PROGRESS');await business.setOrderState(order.id,'DELIVERED');
  const invoice=await business.issueInvoice({clientId:client.id,contractId:contract.id,amount:25000,dueAt:new Date(Date.now()+30*86400000).toISOString()});
  await business.recordPayment({invoiceId:invoice.id,amount:10000,method:'CASH',reference:'P1'});
  await business.recordPayment({invoiceId:invoice.id,amount:15000,method:'BANK',reference:'P2'});
  const records=await business.records(),stored=records.find(x=>x.id===invoice.id);
  assert.equal(stored?.data.invoiceState,'PAID');
  assert.equal(Number(stored?.data.receivedAmount),25000);
  assert.equal((await repo.listLedgerEntries('tenant_neural_l6',group.id)).length,beforeLedger);
});

test('L6 API/application expose only the explicit canonical Value-to-Market handoff',()=>{
  const api=fs.readFileSync('workers/api/src/index.ts','utf8'),app=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(api,/market\/procurements\\\/from-value-draft/);
  assert.match(api,/approveValueProcurementDraft/);
  assert.match(app,/approveValueProcurementDraft/);
  assert.match(app,/market\/procurements\/from-value-draft/);
});
