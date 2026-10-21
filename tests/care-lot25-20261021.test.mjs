import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository,D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';
import {caseCareAdapter} from '../.build/workers/api/src/care.js';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {FilePlatformRepository} from '../scripts/file-repository.mjs';
import path from 'node:path';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

async function setup(sql=false){
 const db=sql?new SQLiteD1(':memory:'):null;if(db)db.migrate();const repo=db?new D1PlatformRepository(db):new InMemoryPlatformRepository(),at=new Date().toISOString();
 for(const id of ['owner','alice','bob','stranger'])await repo.saveUser({id,displayName:id,locale:'fr',createdAt:at});
 await repo.saveGroup({id:'g',tenantId:'t',name:'Synthetic support',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:at});
 for(const id of ['alice','bob'])await repo.saveMembership({id:'m_'+id,tenantId:'t',groupId:'g',userId:id,roles:[id==='bob'?'manager':'member'],status:'active',joinedAt:at});
 const kernel=(actorId,tenantId='t')=>{const k=new PlatformKernel();k.context.set({actorId,tenantId,groupRoles:['founder'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});return k;};
 const care=(actor,tenant='t')=>caseCareAdapter(repo,kernel(actor,tenant)),create=(extra={})=>care('alice').create({summary:'Synthetic issue',groupId:'g',idempotencyKey:'create_case_0001',...extra});
 let sequence=0;const command=async(actor,r,action,extra={})=>care(actor).command(r.id,{action,expectedRevision:r.care?.revision??0,idempotencyKey:'action_'+String(++sequence).padStart(6,'0'),...extra});
 const handle=createApiHandler(repo),send=async(actor,url,method='GET',body)=>{const r=await handle(new Request('https://example.test'+url,{method,headers:{'content-type':'application/json','x-actor-id':actor,'x-tenant-id':'t','x-group-roles':'founder'},body:body===undefined?undefined:JSON.stringify(body)}));return{status:r.status,body:await r.json()};};
 return{repo,db,kernel,care,create,command,send};
}
for(const sql of [false,true]){const engine=sql?'SQLite/D1':'memory';
 test(engine+' case creation retries preserve one case, opening date and original event; forged ownership is ignored',async()=>{
  const f=await setup(sql),rows=await Promise.all(Array.from({length:6},()=>f.create({openedBy:'stranger',status:'RESOLVED',care:{revision:500}})));
  assert.equal(new Set(rows.map(x=>x.id)).size,1);assert.equal(new Set(rows.map(x=>x.openedAt)).size,1);assert.equal(rows[0].openedBy,'alice');assert.equal(rows[0].status,'OPEN');assert.equal(rows[0].care.revision,1);assert.equal(rows[0].care.events.length,1);
  await assert.rejects(()=>f.create({summary:'Changed'}),/CASE_IDEMPOTENCY_CONFLICT/);assert.equal((await f.repo.listCases('t')).length,1);assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);
 });
 test(engine+' nonassigned queue is visible only to current group managers and requester, regardless of claimed header role',async()=>{
  const f=await setup(sql),r=await f.create();assert.equal((await f.care('owner').list()).cases[0].id,r.id);assert.equal((await f.care('bob').list()).cases.length,1);assert.equal((await f.care('stranger').list()).cases.length,0);
  assert.equal((await f.send('stranger','/api/v1/care/cases/'+r.id)).status,403);await assert.rejects(()=>f.command('alice',r,'ASSIGN',{assignedTo:'alice'}),/FORBIDDEN_SCOPE/);
  await assert.rejects(()=>f.command('owner',r,'ASSIGN',{assignedTo:'stranger'}),/INVALID_CASE_ASSIGNEE/);assert.equal((await f.repo.getCaseById(r.id)).care.revision,1);
 });
 test(engine+' competing assignments use compare-and-swap instead of silently overwriting a responsible person',async()=>{
  const f=await setup(sql),r=await f.create(),out=await Promise.allSettled([f.command('owner',r,'ASSIGN',{assignedTo:'owner'}),f.command('owner',r,'ASSIGN',{assignedTo:'bob'})]);
  assert.equal(out.filter(x=>x.status==='fulfilled').length,1);assert.match(String(out.find(x=>x.status==='rejected').reason),/CASE_VERSION_CONFLICT/);const stored=await f.repo.getCaseById(r.id);assert.equal(stored.care.revision,2);assert.equal(stored.care.events.length,2);
 });
 test(engine+' proposed resolution is not accepted until requester decides; close and reopen preserve the full prior trail',async()=>{
  const f=await setup(sql),group=await f.repo.getGroup('t','g');let r=await f.create();r=(await f.command('owner',r,'ASSIGN',{assignedTo:'owner'})).record;r=(await f.command('owner',r,'START_REVIEW')).record;r=(await f.command('owner',r,'PROPOSE_RESOLUTION',{note:'Arrange a replacement with the stock owner'})).record;
  assert.equal(r.status,'WAITING_PARTY');assert.equal(r.care.resolution.state,'PROPOSED');await assert.rejects(()=>f.command('owner',r,'ACCEPT_RESOLUTION'),/FORBIDDEN_SCOPE/);await assert.rejects(()=>f.command('owner',r,'CLOSE'),/FORBIDDEN_SCOPE/);
  r=(await f.command('alice',r,'ACCEPT_RESOLUTION')).record;assert.equal(r.status,'RESOLVED');r=(await f.command('alice',r,'CLOSE')).record;assert.equal(r.status,'CLOSED');r=(await f.command('alice',r,'REOPEN',{note:'The promised replacement has not happened'})).record;assert.equal(r.status,'OPEN');assert.equal(r.care.resolution,undefined);assert.equal(r.care.events.some(x=>x.kind==='ACCEPT_RESOLUTION'),true);assert.equal(r.care.events.find(x=>x.kind==='PROPOSE_RESOLUTION').note,'Arrange a replacement with the stock owner');assert.deepEqual(await f.repo.getGroup('t','g'),group);assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);
 });
 test(engine+' refusal, mediation and appeal never fabricate an external decision or a guaranteed deadline',async()=>{
  const f=await setup(sql);let r=await f.create();r=(await f.command('owner',r,'ASSIGN',{assignedTo:'owner'})).record;r=(await f.command('owner',r,'PROPOSE_RESOLUTION',{note:'Proposed review'})).record;r=(await f.command('alice',r,'REFUSE_RESOLUTION',{note:'Missing proof'})).record;assert.equal(r.status,'UNDER_REVIEW');assert.equal(r.care.resolution.state,'REFUSED');r=(await f.command('alice',r,'ESCALATE',{note:'Request a mediator'})).record;assert.equal(r.status,'MEDIATION');r=(await f.command('alice',r,'APPEAL',{note:'Independent review requested'})).record;assert.equal(r.status,'APPEALED');const d=await f.care('alice').detail(r.id);assert.equal(d.financialOutcome,'NOT_INFERRED');assert.equal(d.servicePromise,'NO_GUARANTEED_RESPONSE_TIME');assert.equal(r.care.indicativeDueAt,undefined);
 });
 test(engine+' an explicit plan retains a date as indicative and requires an actual assignee for responsible waiting',async()=>{
  const f=await setup(sql);let r=await f.create();await assert.rejects(()=>f.command('owner',r,'UPDATE_PLAN',{nextAction:'Review',waitingFor:'RESPONSIBLE'}),/CASE_ASSIGNEE_REQUIRED/);
  r=(await f.command('owner',r,'UPDATE_PLAN',{nextAction:'Requester should provide delivery reference',waitingFor:'REQUESTER',indicativeDueAt:'2026-11-01T10:00:00Z'})).record;assert.equal(r.status,'WAITING_PARTY');assert.equal(r.care.indicativeDueAt,'2026-11-01T10:00:00.000Z');r=(await f.command('owner',r,'UPDATE_PLAN',{nextAction:'Clarify availability',waitingFor:'UNASSIGNED',indicativeDueAt:null})).record;assert.equal(r.care.indicativeDueAt,undefined);
 });
 test(engine+' legacy private cases stay private and group revocation removes access even for their requester',async()=>{
  const f=await setup(sql),at=new Date().toISOString();await f.repo.saveCase({id:'legacy',tenantId:'t',groupId:'g',type:'GENERAL_SUPPORT',subjectType:'group',subjectId:'g',status:'OPEN',openedBy:'alice',openedAt:at,summary:'Private legacy note'});assert.equal((await f.care('owner').list()).cases.length,0);await assert.rejects(()=>f.care('owner').detail('legacy'),/FORBIDDEN_SCOPE/);assert.equal((await f.care('alice').detail('legacy')).record.care,undefined);
  const r=await f.create(),m=await f.repo.getMembership('t','g','m_alice');await f.repo.saveMembership({...m,status:'left'});await assert.rejects(()=>f.care('alice').detail(r.id),/FORBIDDEN_SCOPE/);await assert.rejects(()=>f.command('alice',r,'COMMENT',{note:'No longer permitted'}),/FORBIDDEN_SCOPE/);assert.equal((await f.care('alice').list()).cases.length,0);
 });
 test(engine+' account-private cases do not leak to another tenant, group manager or an arbitrary assignment',async()=>{
  const f=await setup(sql),r=await f.create({groupId:undefined});assert.equal(r.care.visibility,'PRIVATE');await assert.rejects(()=>f.care('alice','other').detail(r.id),/FORBIDDEN_SCOPE/);await assert.rejects(()=>f.care('owner').detail(r.id),/FORBIDDEN_SCOPE/);await assert.rejects(()=>f.command('alice',r,'ASSIGN',{assignedTo:'bob'}),/INVALID_CASE_ASSIGNEE/);
  const closed=(await f.command('alice',r,'WITHDRAW',{note:'No service was promised; cancel this request'})).record;assert.equal(closed.status,'CLOSED');assert.equal(closed.care.resolution,undefined);
 });
 test(engine+' only author-owned immutable scoped evidence references can enter a shared case',async()=>{
  const f=await setup(sql),r=await f.create(),at=new Date().toISOString();for(const [id,actor,immutable]of [['mine','alice',true],['other','bob',true],['mutable','alice',false]])await f.repo.saveEvidence({id,tenantId:'t',createdBy:actor,createdAt:at,type:'SYNTHETIC_PROOF',subjectType:'GROUP',subjectId:'g',immutable,data:{groupId:'g'}});
  for(const id of ['other','mutable','missing'])await assert.rejects(()=>f.command('alice',r,'COMMENT',{note:'Proof',evidenceIds:[id]}),/FORBIDDEN_CASE_EVIDENCE/);
  const next=(await f.command('alice',r,'COMMENT',{note:'Share my proof reference with these case parties',evidenceIds:['mine']})).record;assert.deepEqual(next.care.events.at(-1).data.evidenceIds,['mine']);assert.equal((await f.repo.getEvidence('t','mine')).immutable,true);assert.equal((await f.care('stranger').list()).cases.length,0);
 });
 test(engine+' a lost response can be retried with the old version once; altered intent with that key is rejected',async()=>{
  const f=await setup(sql),r=await f.create(),original=f.repo.saveCaseRevision.bind(f.repo);let lose=true;f.repo.saveCaseRevision=async(v,expected)=>{const ok=await original(v,expected);if(lose&&ok){lose=false;throw Error('SYNTHETIC_RESPONSE_LOST');}return ok;};
  const input={action:'COMMENT',expectedRevision:1,idempotencyKey:'lost_response_01',note:'One retained response'};await assert.rejects(()=>f.care('alice').command(r.id,input),/SYNTHETIC_RESPONSE_LOST/);const replay=await f.care('alice').command(r.id,input);assert.equal(replay.record.care.events.length,2);assert.equal(replay.record.care.revision,2);await assert.rejects(()=>f.care('alice').command(r.id,{...input,note:'Different intent'}),/CASE_IDEMPOTENCY_CONFLICT/);
 });
 test(engine+' preventive expectations need two current parties and preserve accepted version while revision two is discussed',async()=>{
  const f=await setup(sql);let r=await f.create({category:'PREVENTION'});await assert.rejects(()=>f.command('alice',r,'PROPOSE_EXPECTATIONS',{items:[{label:'Delivery',value:'Pickup',notApplicable:false}]}),/CASE_TWO_PARTIES_REQUIRED/);
  r=(await f.command('owner',r,'ASSIGN',{assignedTo:'owner'})).record;const items=[{label:'Delivery',value:'Pickup after fitting',notApplicable:false},{label:'Shipping',value:'',notApplicable:true}];r=(await f.command('alice',r,'PROPOSE_EXPECTATIONS',{items})).record;r=(await f.command('owner',r,'ACCEPT_EXPECTATIONS',{expectationRevision:1})).record;assert.equal(r.care.acceptedExpectation,undefined);r=(await f.command('alice',r,'ACCEPT_EXPECTATIONS',{expectationRevision:1})).record;const accepted=structuredClone(r.care.acceptedExpectation);assert.deepEqual(accepted.items,items);assert.equal(accepted.acceptedBy.length,2);
  r=(await f.command('owner',r,'PROPOSE_EXPECTATIONS',{items:[{label:'Delivery',value:'New proposal only',notApplicable:false}]})).record;assert.equal(r.care.expectationDraft.revision,2);assert.deepEqual(r.care.acceptedExpectation,accepted);await assert.rejects(()=>f.command('alice',r,'ACCEPT_EXPECTATIONS',{expectationRevision:1}),/CASE_EXPECTATION_VERSION_CONFLICT/);assert.equal(r.care.events.filter(x=>x.kind==='PROPOSE_EXPECTATIONS').length,2);
 });
 test(engine+' a case cannot insert preventive conditions into an accepted order or mutate its source',async()=>{
  const f=await setup(sql),k=f.kernel('owner'),market=new MarketService(f.repo,k),shop=await market.createPersonalShop({name:'Synthetic support shop',visibility:'PUBLIC',idempotencyKey:'support_shop_01'}),stock=await market.createStock(shop.id,{sku:'CARE',name:'Synthetic item',quantity:4,unitPrice:500,published:true});
  const buyer=new MarketService(f.repo,f.kernel('alice')),order=await buyer.purchaseFromShop(shop.id,{stockItemId:stock.id,quantity:2,idempotencyKey:'support_buy_01'}),before=await f.repo.getWorkspaceRecord('t',order.id),r=await buyer.openOrderSupport(order.id,{summary:'Synthetic delivery issue',idempotencyKey:'support_issue_01'});
  assert.equal(r.care.visibility,'ORDER_PARTIES');assert.equal((await f.care('owner').list()).cases[0].id,r.id);await assert.rejects(()=>f.care('stranger').detail(r.id),/FORBIDDEN_SCOPE/);await assert.rejects(()=>f.command('alice',r,'PROPOSE_EXPECTATIONS',{items:[{label:'New fee',value:'Forbidden',notApplicable:false}]}),/CASE_RETROACTIVE_EXPECTATIONS_FORBIDDEN/);assert.deepEqual(await f.repo.getWorkspaceRecord('t',order.id),before);
 });
 test(engine+' order support crosses buyer and seller account tenants through source rights and revokes a removed seller mandate',async()=>{
  const f=await setup(sql),seller=new MarketService(f.repo,f.kernel('owner')),shop=await seller.createPersonalShop({name:'Synthetic cross-tenant support',visibility:'PUBLIC',idempotencyKey:'cross_shop_0001'}),stock=await seller.createStock(shop.id,{sku:'X',name:'Synthetic item',quantity:5,unitPrice:100,published:true}),buyer=new MarketService(f.repo,f.kernel('alice'), 'buyer-tenant'),order=await buyer.purchaseFromShop(shop.id,{stockItemId:stock.id,quantity:1,idempotencyKey:'cross_buy_0001'}),r=await buyer.openOrderSupport(order.id,{summary:'Cross account issue',idempotencyKey:'cross_case_0001'});
  assert.equal(r.tenantId,'buyer-tenant');assert.equal((await f.care('alice','buyer-tenant').detail(r.id)).record.id,r.id);assert.equal((await f.care('owner').detail(r.id)).record.id,r.id);await seller.setShopCollaborator(shop.id,{userId:'bob',role:'SELL'});let next=(await f.command('owner',r,'ASSIGN',{assignedTo:'bob'})).record;assert.equal((await f.care('bob').list()).cases[0].id,r.id);await seller.setShopCollaborator(shop.id,{userId:'bob',role:'REVOKED'});await assert.rejects(()=>f.care('bob').detail(r.id),/FORBIDDEN_SCOPE/);assert.equal((await f.care('bob').list()).cases.length,0);assert.equal((await f.repo.getCaseById(r.id)).care.revision,next.care.revision);
 });
 test(engine+' history capacity, invalid actions and oversize evidence are explicit failures without any partial event',async()=>{
  const f=await setup(sql),r=await f.create();for(const extra of [{action:'PAY'},{action:'COMMENT',note:'Missing proof',evidenceIds:Array.from({length:7},(_,i)=>'p'+i)},{action:'UPDATE_PLAN',nextAction:'Bad date',indicativeDueAt:'not-a-date'}])await assert.rejects(()=>f.command('owner',r,extra.action,extra));assert.equal((await f.repo.getCaseById(r.id)).care.revision,1);
  r.care.events=Array.from({length:200},(_,i)=>({...r.care.events[0],id:'history_'+i}));await f.repo.saveCase(r);await assert.rejects(()=>f.command('alice',r,'COMMENT',{note:'Capacity is explicit'}),/CASE_HISTORY_LIMIT/);assert.equal((await f.repo.getCaseById(r.id)).care.events.length,200);
 });
}
test('file persistence compares case revisions atomically and retains retry identity after a fresh repository instance',async()=>{
 const file=path.resolve('.data/lot25-native-'+crypto.randomUUID()+'.json'),repo=new FilePlatformRepository(file),r={id:'case_file',tenantId:'t',type:'SUPPORT',subjectType:'account',subjectId:'alice',status:'OPEN',openedBy:'alice',openedAt:new Date().toISOString(),summary:'Synthetic file case'};
 assert.equal(await repo.saveCaseRevision(r,null),true);assert.equal(await repo.saveCaseRevision(r,null),false);const k=new PlatformKernel(),input={action:'COMMENT',expectedRevision:0,idempotencyKey:'file_comment_001',note:'Retained'},rights={actorId:'alice',requester:true,canManage:true,canParticipate:true},next=k.cases.applyCare(r,input,rights);const result=await Promise.all([repo.saveCaseRevision(next,0),repo.saveCaseRevision({...next,summary:'A lost competing write'},0)]);assert.deepEqual(result,[true,false]);const restored=await new FilePlatformRepository(file).getCaseById(r.id);assert.equal(restored.care.events.length,1);assert.equal(k.cases.applyCare(restored,input,rights).care.revision,1);
});
test('explicit care retry reuses bounded transport recovery without resetting D1 quota protection or financial outbox',async()=>{
 const saved=globalThis.fetch,app=new ConnectedApplication({actorId:'synthetic',tenantId:'t'}),input={action:'COMMENT',expectedRevision:1,idempotencyKey:'explicit_retry_01',note:'Retained reply'};let calls=0;const before=app.outboxItems();
 globalThis.fetch=async()=>{if(++calls===1)throw Error('SYNTHETIC_TRANSPORT_LOST');return new Response(JSON.stringify({record:{care:{revision:2}}}),{status:200});};
 try{await assert.rejects(()=>app.commandCareCase('case',input),/NETWORK_UNAVAILABLE/);assert.equal((await app.commandCareCase('case',input)).record.care.revision,2);assert.equal(calls,2);assert.deepEqual(app.outboxItems(),before);app.serverBudgetBlockedUntil=Date.now()+50000;await assert.rejects(()=>app.commandCareCase('case',input),/NETWORK_UNAVAILABLE/);assert.equal(calls,2);}
 finally{globalThis.fetch=saved;if(app.transportWake)clearTimeout(app.transportWake);if(app.serverBudgetWake)clearTimeout(app.serverBudgetWake);}
});
