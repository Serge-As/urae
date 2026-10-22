import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository,D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {BusinessStudioService} from '../.build/packages/business-studio/src/index.js';
import {ValueNetworkService} from '../.build/packages/value-network/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';
import {OpportunityGraphService} from '../.build/packages/opportunity-graph/src/index.js';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {createApiHandler} from '../.build/workers/api/src/index.js';
async function setup(sql){
 const db=sql?new SQLiteD1(':memory:'):null;if(db)db.migrate();const repo=db?new D1PlatformRepository(db):new InMemoryPlatformRepository(),at=new Date().toISOString();
 await repo.saveGroup({id:'g',tenantId:'t',name:'Synthetic economic group',kind:'association',governanceModel:'community',createdBy:'owner',status:'active',createdAt:at});
 for(const actor of ['owner','alice','bob']){await repo.saveUser({id:actor,displayName:actor,locale:'fr',createdAt:at});await repo.saveMembership({id:'m_'+actor,tenantId:'t',groupId:'g',userId:actor,roles:[actor==='owner'?'founder':'member'],status:'active',joinedAt:at});}
 const kernel=(actor,tenant='t')=>{const k=new PlatformKernel();k.context.set({actorId:actor,tenantId:tenant,activeGroupId:'g',groupRoles:['founder'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'test'});return k;};
 const biz=(actor='owner',tenant='t')=>new BusinessStudioService(repo,kernel(actor,tenant)),value=(actor='owner',tenant='t')=>new ValueNetworkService(repo,kernel(actor,tenant)),market=(actor='owner')=>new MarketService(repo,kernel(actor));
 const end=new Date(Date.now()+86400000).toISOString(),experiment=(key='experiment_001')=>({title:'Ten garments',customer:'Private customer research',problem:'Reliable uniforms',offer:'Ten durable uniforms',quantity:10,unit:'unité',prices:[500,700],costs:{MATERIALS:500,TRANSPORT:100,LABOUR:200,FEES:0,OTHER:0},minutes:120,minimumOrders:1,minimumGrossMargin:2000,endsAt:end,idempotencyKey:key});
 const pool=async()=>value().createPool('g',{title:'Voluntary rice need',category:'rice',unit:'kg',locality:'Yaoundé',neededBy:end,idempotencyKey:'pool_create_001'});
 const handle=createApiHandler(repo),send=async(actor,path,method='GET',body)=>{const response=await handle(new Request('https://synthetic.test'+path,{method,headers:{'content-type':'application/json','x-actor-id':actor,'x-tenant-id':'t','x-active-group-id':'g'},body:body===undefined?undefined:JSON.stringify(body)}));return{status:response.status,body:await response.json()};};
 return{repo,kernel,biz,value,market,end,experiment,pool,send};
}
for(const sql of [false,true]){const label=sql?'SQLite/D1':'memory';
 test(label+' immutable experiments keep unknown costs unknown, compare two prices and never create revenue',async()=>{
  const f=await setup(sql),input={...f.experiment(),costs:{MATERIALS:500}},r=await f.biz().createExperiment(input),view=await f.biz().reviewExperiment(r.id);
  assert.equal(view.forecasts[0].forecastRevenue,5000);assert.equal(view.forecasts[1].forecastRevenue,7000);assert.equal(view.forecasts[0].grossMargin,null);assert.equal(view.forecasts[0].knownCosts,500);assert.equal(view.decision,'NOT_CONFIRMED');assert.equal(view.observed.deliveredContractValue,null);assert.equal(view.observed.netDelivered,null);assert.equal(view.observed.grossMargin,null);
  const summary=await f.biz().summary();assert.equal(summary.received,0);assert.equal(summary.quoted,0);assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);
  await assert.rejects(()=>f.biz().createExperiment({...input,idempotencyKey:'invalid_cost',costs:{MATERIALS:true}}),/INVALID_EXPERIMENT_AMOUNT/);
 });
 test(label+' retry is first-write only, a variant preserves its source, exports do not expose private costs',async()=>{
  const f=await setup(sql),input=f.experiment(),all=await Promise.all(Array.from({length:8},()=>f.biz().createExperiment(input))),r=all[0];assert.ok(all.every(x=>x.id===r.id));assert.equal((await f.biz().experiments()).total,1);
  await assert.rejects(()=>f.biz().createExperiment({...input,title:'Different title'}),/GOVERNED_RECORD_CONFLICT/);
  const variant=await f.biz().createExperiment({...input,idempotencyKey:'variant_0001',prices:[600,800],previousExperimentId:r.id});assert.notEqual(variant.id,r.id);assert.equal(variant.data.previousExperimentId,r.id);assert.equal((await f.biz().reviewExperiment(r.id)).forecasts[0].unitPrice,500);
  const draft=await f.biz().experimentPublicationDraft(r.id,1);assert.equal(draft.unitPrice,700);assert.equal(draft.published,false);assert.ok(!JSON.stringify(draft).includes('Private customer research'));assert.equal(draft.costs,undefined);
  await assert.rejects(()=>f.biz('alice').reviewExperiment(r.id),/EXPERIMENT_NOT_FOUND/);await assert.rejects(()=>f.biz('owner','other').reviewExperiment(r.id),/EXPERIMENT_NOT_FOUND/);
 });
 test(label+' actual deliveries minus returns are reread, duplicate links count once and cash is only declared',async()=>{
  const f=await setup(sql),biz=f.biz(),r=await biz.createExperiment(f.experiment()),market=f.market(),stock=await market.createStock('g',{sku:'uniform',name:'Uniform',quantity:10,unit:'unité',unitPrice:500,published:true});
  const order=await market.createOrder('g',{stockItemId:stock.id,quantity:8,customerRef:'Synthetic buyer',idempotencyKey:'order_000001'});
  await market.deliver('g',order.id,8,{idempotencyKey:'deliver_00001'});await market.returnItems('g',order.id,2,'Synthetic return',{idempotencyKey:'return_00001'});
  await Promise.all([biz.linkExperimentOrder(r.id,order.id),biz.linkExperimentOrder(r.id,order.id)]);
  const input={costs:f.experiment().costs,minutes:120,cashReceived:1000,note:'Observed batch costs, partial cash, next test',idempotencyKey:'observation_1'},obs=await biz.observeExperiment(r.id,input);assert.equal((await biz.observeExperiment(r.id,input)).id,obs.id);
  const view=await biz.reviewExperiment(r.id,obs.id);assert.equal(view.orders.length,1);assert.equal(view.observed.netDelivered,6);assert.equal(view.observed.deliveredContractValue,3000);assert.equal(view.observed.grossMargin,2200);assert.equal(view.observed.cashFlowDeclared,200);assert.equal(view.observed.grossMarginPerHour,1100);assert.equal(view.decision,'THRESHOLD_MET');assert.equal(view.paymentStatus,'NOT_INFERRED');assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);
  const missing=await biz.observeExperiment(r.id,{costs:{MATERIALS:600},note:'Transport and labour unknown',idempotencyKey:'observation_2'});assert.equal((await biz.reviewExperiment(r.id,missing.id)).observed.grossMargin,null);assert.equal((await biz.reviewExperiment(r.id,obs.id)).observed.grossMargin,2200);
 });
 test(label+' revoked current commercial rights stop private canonical order details from reappearing',async()=>{
  const f=await setup(sql),m=await f.repo.getMembership('t','g','m_alice');await f.repo.saveMembership({...m,roles:['manager']});
  const r=await f.biz('alice').createExperiment(f.experiment()),stock=await f.market().createStock('g',{sku:'private',name:'Private stock',quantity:2,unit:'unité',unitPrice:500,published:true}),order=await f.market().createOrder('g',{stockItemId:stock.id,quantity:1,customerRef:'Sensitive private buyer',idempotencyKey:'order_rights_1'});
  await f.biz('alice').linkExperimentOrder(r.id,order.id);await f.repo.saveMembership({...m,roles:['member']});
  const view=await f.biz('alice').reviewExperiment(r.id);assert.equal(view.orders[0].status,'CURRENT_ACCESS_UNAVAILABLE');assert.equal(view.observed.deliveredContractValue,null);assert.ok(!JSON.stringify(view).includes('Sensitive private buyer'));
 });
 test(label+' voluntary pooling converts compatible units and discloses only the total and own contribution',async()=>{
  const f=await setup(sql),r=await f.pool();await f.value('alice').contributePool('g',r.id,{quantity:1,unit:'kg',consent:true});const v=await f.value('bob').contributePool('g',r.id,{quantity:500,unit:'g',consent:true});
  assert.equal(v.quantity,1.5);assert.equal(v.participants,2);assert.equal(v.ownContribution.quantity,500);assert.ok(!JSON.stringify(v).includes('alice'));assert.equal(v.createsOrder,false);assert.equal((await f.value().listNeeds('g')).length,0);
  await assert.rejects(()=>f.value('bob').createPool('g',{title:'No manager',category:'rice',unit:'kg',neededBy:f.end,idempotencyKey:'pool_unauthorised'}),/FORBIDDEN_SCOPE/);
  await assert.rejects(()=>f.value('owner','other').poolView('g',r.id),/GROUP_NOT_FOUND/);assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);
 });
 test(label+' double confirmation, incompatible units and missing consent cannot inflate the aggregate',async()=>{
  const f=await setup(sql),r=await f.pool(),actor=f.value('alice');await Promise.all(Array.from({length:8},()=>actor.contributePool('g',r.id,{quantity:2,unit:'kg',consent:true})));assert.equal((await f.value().poolView('g',r.id)).quantity,2);
  await assert.rejects(()=>actor.contributePool('g',r.id,{quantity:3,unit:'kg',consent:true}),/GOVERNED_RECORD_CONFLICT/);
  await assert.rejects(()=>f.value('bob').contributePool('g',r.id,{quantity:1,unit:'litre',consent:true}),/POOL_UNIT_NOT_COMPARABLE/);
  await assert.rejects(()=>f.value('bob').contributePool('g',r.id,{quantity:1,unit:'kg',consent:false}),/POOL_AGGREGATE_CONSENT_REQUIRED/);assert.equal((await f.value().poolView('g',r.id)).participants,1);
 });
 test(label+' withdrawal is absorbing and remains possible after leaving; inactive membership no longer contributes',async()=>{
  const f=await setup(sql),r=await f.pool();await f.value('alice').contributePool('g',r.id,{quantity:2,unit:'kg',consent:true});await f.value('bob').contributePool('g',r.id,{quantity:1,unit:'kg',consent:true});
  await Promise.all([f.value('alice').withdrawPool('g',r.id),f.value('alice').withdrawPool('g',r.id)]);assert.equal((await f.value().poolView('g',r.id)).quantity,1);await assert.rejects(()=>f.value('alice').contributePool('g',r.id,{quantity:2,unit:'kg',consent:true}),/POOL_CONSENT_WITHDRAWN/);
  const m=await f.repo.getMembership('t','g','m_bob');await f.repo.saveMembership({...m,status:'inactive'});assert.equal((await f.value().poolView('g',r.id)).quantity,0);assert.equal((await f.value('bob').withdrawPool('g',r.id)).withdrawn,true);
 });
 test(label+' current pooled matching applies hard constraints, withdrawal changes future matches and closure blocks confirmations',async()=>{
  const f=await setup(sql),r=await f.pool(),v=f.value();await f.value('alice').contributePool('g',r.id,{quantity:2,unit:'kg',consent:true});
  const good=await v.createOffer({kind:'SUPPLIER',title:'Fresh rice',category:'rice',availableQuantity:2,unit:'kg',locality:'Yaoundé',unitPrice:500,transportCost:0,otherCosts:0,availableBy:new Date().toISOString(),expiresAt:f.end});
  await v.createOffer({kind:'SUPPLIER',title:'Wrong litres, high evidence',category:'rice',availableQuantity:1000,unit:'litre',locality:'Yaoundé',unitPrice:1,availableBy:new Date().toISOString(),expiresAt:f.end,documentedDeliveries:1000,sponsored:true});
  const result=await v.poolMatches('g',r.id);assert.equal(result.items.length,1);assert.equal(result.items[0].offer.id,good.id);assert.equal(result.createsOrder,false);assert.equal(result.items[0].landedTotal,1000);
  await f.value('alice').withdrawPool('g',r.id);await assert.rejects(()=>v.poolMatches('g',r.id),/POOL_NO_ACTIVE_QUANTITY/);
  await v.closePool('g',r.id);assert.equal((await v.poolView('g',r.id)).state,'CLOSED');await assert.rejects(()=>f.value('bob').contributePool('g',r.id,{quantity:1,unit:'kg',consent:true}),/POOL_NOT_OPEN/);
 });
 test(label+' generic workspace routes cannot forge, alter or expose immutable private economic records',async()=>{
  const f=await setup(sql),r=await f.biz().createExperiment(f.experiment()),pool=await f.pool();await f.value('alice').contributePool('g',pool.id,{quantity:1,unit:'kg',consent:true});
  assert.equal((await f.send('owner','/api/v1/workspaces?moduleId=MANAGER.BUSINESS_STUDIO')).body.length,0);assert.equal((await f.send('owner','/api/v1/workspaces?moduleId=OPPORTUNITY.NEED&groupId=g')).body.length,0);
  assert.equal((await f.send('owner','/api/v1/workspaces/'+r.id,'PUT',{title:'Overwrite'})).status,403);assert.equal((await f.send('owner','/api/v1/workspaces','POST',{moduleId:'MANAGER.BUSINESS_STUDIO',title:'Forge',tags:['business-experiment']})).status,403);
  assert.equal((await f.send('alice','/api/v1/business/experiments')).body.total,0);assert.ok((await f.send('alice','/api/v1/business/experiments/'+r.id)).status>=400);
 });
 test(label+' listing ten pools batches rights, memberships and records into exactly three repository reads',async()=>{
  const f=await setup(sql);for(let i=0;i<10;i++)await f.value().createPool('g',{title:'Need '+i,category:'rice',unit:'kg',neededBy:f.end,idempotencyKey:'budget_pool_'+i});
  const calls={};for(const name of ['getGroup','listMemberships','listWorkspaceRecords']){const original=f.repo[name].bind(f.repo);f.repo[name]=(...args)=>{calls[name]=(calls[name]??0)+1;return original(...args);};}
  const result=await f.value().pools('g');assert.equal(result.total,10);assert.deepEqual(calls,{getGroup:1,listMemberships:1,listWorkspaceRecords:1});
 });
 test(label+' expiration is enforced when reading pooled matches and the opportunity graph without a scheduler',async()=>{
  const f=await setup(sql),r=await f.pool();await f.value('alice').contributePool('g',r.id,{quantity:1,unit:'kg',consent:true});const offer=await f.value().createOffer({kind:'NOW',title:'Short availability',category:'rice',availableQuantity:2,unit:'kg',locality:'Yaoundé',expiresAt:f.end});
  await f.repo.saveWorkspaceRecord({...offer,id:'legacy-undated-offer',data:{...offer.data,expiresAt:''}});
  const initial=await new OpportunityGraphService(f.repo,f.kernel('owner')).projection();assert.ok(initial.nodes.some(n=>n.ref===offer.id));assert.equal(initial.nodes.find(n=>n.ref==='legacy-undated-offer').meta.expiryKnown,false);const original=Date.now;Date.now=()=>original()+2*86400000;
  try{assert.equal((await f.value().poolView('g',r.id)).state,'EXPIRED');await assert.rejects(()=>f.value().poolMatches('g',r.id),/POOL_NOT_OPEN/);const expired=await new OpportunityGraphService(f.repo,f.kernel('owner')).projection();assert.ok(!expired.nodes.some(n=>n.ref===offer.id));assert.ok(expired.nodes.some(n=>n.ref==='legacy-undated-offer'&&n.meta.expiryKnown===false));}finally{Date.now=original;}
 });
}
