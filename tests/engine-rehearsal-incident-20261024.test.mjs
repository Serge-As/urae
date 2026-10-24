import test from 'node:test';import assert from 'node:assert/strict';
import {InMemoryPlatformRepository,D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';
import {prepareEngineRehearsal,executeEngineRehearsal,executeLoanPolicyRehearsal,forwardEngineRehearsal} from '../.build/workers/api/src/engine-rehearsal.js';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';
import {IndexedDbOutboxAdapter} from '../.build/packages/offline/src/index.js';
import {createIncidentReplay,parseIncidentReplay} from '../apps/web/src/incident-package.js';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';

for(const sqlite of [false,true])for(const scenario of ['LOST_ACK','LIVE_OUTAGE'])test((sqlite?'SQLite/D1':'Memory')+' actual loan, sheet queue, Live fault and idempotent recovery: '+scenario,async()=>{
  const databases=[],factory=()=>{if(!sqlite)return new InMemoryPlatformRepository();const db=new SQLiteD1(':memory:');db.migrate();databases.push(db);return new D1PlatformRepository(db);};
  try{const start=performance.now(),plan=prepareEngineRehearsal(scenario),result=await executeEngineRehearsal(createApiHandler,{scenario,items:plan.items},factory);
    console.log('REHEARSAL_ELAPSED_MS',scenario,sqlite,Math.round(performance.now()-start));
    assert.equal(result.faultObserved,true);assert.equal(result.recovered,true);assert.equal(result.productionFinancialWrites,false);assert.equal(result.realDataRead,false);assert.ok(result.checks.length>=30);assert.ok(result.checks.every(x=>x.passed));
    assert.deepEqual(result.totals,{borrowed:10000,repaid:4000,remainingPrincipal:6000,cashBalance:14000});assert.deepEqual(result.finalQueue.map(x=>x.status),['CONFIRMED','CONFIRMED']);assert.deepEqual(result.observers.map(x=>x.amount),[4000,4000]);
    assert.equal(result.policies.length,6);const capital=result.policies.find(x=>x.priority==='CAPITAL_FIRST'&&x.timing==='NEXT_SESSION_DUE');assert.equal(capital.principalAfterFirstPayment,7500);assert.equal(capital.unpaidInterestAfterNextPeriod,1750);
    const interest=result.policies.find(x=>x.priority==='INTEREST_FIRST'&&x.timing==='NEXT_SESSION_DUE');assert.equal(interest.principalAfterFirstPayment,8500);assert.equal(interest.unpaidInterestAfterNextPeriod,849);
    const replay=createIncidentReplay(result,{version:'1.5.2.37-engine-rehearsal',mode:'visual'}),parsed=parseIncidentReplay(JSON.stringify(replay));assert.equal(parsed.scenario,scenario);assert.equal(parsed.previousObservationUnverified,true);
    if(scenario==='LOST_ACK')assert.ok(result.intermediate.some(x=>x.status==='FAILED'));else assert.deepEqual(result.intermediate.map(x=>x.status),['CONFIRMED','CONFIRMED']);
  }finally{for(const db of databases)db.close();}
});
test('diagnostic route never reads or writes the supplied production repository and rejects unknown identities or commands before fixture construction',async()=>{
  const repository=new Proxy({},{get(){throw Error('PRODUCTION_REPOSITORY_TOUCHED');}}),handler=createApiHandler(repository);
  const send=async body=>{const r=await handler(new Request('https://synthetic.test/api/v1/diagnostics/rehearsal',{method:'POST',headers:{'content-type':'application/json','x-actor-id':'authorized-test-user'},body:JSON.stringify(body)}));return{status:r.status,body:await r.json()};};
  const plan=await send({phase:'prepare',scenario:'LOST_ACK'});assert.equal(plan.status,200);
  const result=await send({phase:'execute',scenario:'LOST_ACK',items:plan.body.items});assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.body.totals.remainingPrincipal,6000);
  assert.equal((await send({phase:'policy',priority:'CAPITAL_FIRST',timing:'NEXT_SESSION_DUE'})).status,400);
  await assert.rejects(()=>executeLoanPolicyRehearsal(createApiHandler,{priority:'UNKNOWN',timing:'NEXT_SESSION_DUE'}),/REHEARSAL_POLICY_INVALID/);
  for(const change of [items=>{items[0].actorId='REAL-IDENTITY';},items=>{items[0].payload.amount=123456789;},items=>{items[0].payload.extra='PRIVATE';},items=>{items[0].type='LOAN_DISBURSE_V1';},items=>{items[0].status='CONFIRMED';}]){
    const items=structuredClone(plan.body.items);change(items);assert.equal((await send({phase:'execute',scenario:'LOST_ACK',items})).status,400);
  }
  assert.equal((await send({phase:'prepare',scenario:'UNKNOWN'})).status,400);assert.equal((await send({phase:'prepare',scenario:'LOST_ACK',secret:'PRIVATE'})).status,400);
  assert.equal((await handler(new Request('https://synthetic.test/api/v1/diagnostics/rehearsal',{method:'POST',body:'{}'}))).status,401);
});
test('a replay file accepts only normalized synthetic observations and never trusts a saved success claim',()=>{
  const report={protocol:'ECO_ENGINE_REHEARSAL_1',recipeVersion:1,syntheticOnly:true,scenario:'LOST_ACK',checks:[{passed:true}],timeline:[{step:1,state:'LOAN_DISBURSED'}],faultObserved:true,recovered:true};
  const good=createIncidentReplay(report,{version:'1.5.2.37-engine-rehearsal',mode:'senior'});assert.equal(parseIncidentReplay(JSON.stringify(good)).previousObservationUnverified,true);
  for(const patch of [x=>{x.actor='PRIVATE';},x=>{x.expectedTotals.borrowed=999999;},x=>{x.timeline[0].state='<img src=x onerror=alert(1)>';},x=>{x.timeline[0].amount=123456789;},x=>{x.observation.checks=-1;},x=>{x.release='https://private.example';},x=>{x.recipeVersion=2;},x=>{x.containsRealIdentity=true;}]){const copy=structuredClone(good);patch(copy);assert.throws(()=>parseIncidentReplay(JSON.stringify(copy)));}
  assert.throws(()=>parseIncidentReplay('x'.repeat(16001)));assert.throws(()=>parseIncidentReplay('null'));assert.throws(()=>parseIncidentReplay('{broken'));
});
test('the optional outbox sandbox name is narrowly validated and the historical default remains available',()=>{
  assert.doesNotThrow(()=>new IndexedDbOutboxAdapter());assert.doesNotThrow(()=>new IndexedDbOutboxAdapter({sandboxId:'a'.repeat(32)}));
  for(const sandboxId of ['tontine-platform','../production','',undefined,'a'.repeat(33),'A'.repeat(32)])assert.throws(()=>new IndexedDbOutboxAdapter({sandboxId}),/SANDBOX_ID_INVALID/);
});
test('the dedicated Durable Object compute host never touches its real storage, group channels, bindings or caller identities',async()=>{
 const forbidden=new Proxy({},{get(){throw Error('REAL_BINDING_OR_STORAGE_TOUCHED');}}),hub=new GroupLiveHub({storage:forbidden},forbidden);let addressed='';
 const namespace={idFromName:name=>{addressed=name;return name;},get:id=>({fetch:async request=>{assert.equal(id,addressed);for(const name of ['cookie','authorization','x-actor-id','x-tenant-id','x-active-group-id'])assert.equal(request.headers.has(name),false,name);return hub.fetch(request);}})};
 const request=new Request('https://app.test/api/v1/diagnostics/rehearsal',{method:'POST',headers:{cookie:'PRIVATE',authorization:'PRIVATE','x-actor-id':'REAL','x-tenant-id':'REAL','x-active-group-id':'REAL'},body:JSON.stringify({phase:'execute',scenario:'LOST_ACK',items:prepareEngineRehearsal('LOST_ACK').items})});
 const response=await forwardEngineRehearsal(namespace,request);assert.equal(response.status,200);assert.equal((await response.json()).totals.remainingPrincipal,6000);assert.equal(addressed,'eco:diagnostics:engine-rehearsal:v1');
 assert.equal((await hub.fetch(new Request('https://internal/internal/engine-rehearsal'))).status,403);
});
