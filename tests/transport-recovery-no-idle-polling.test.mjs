import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

async function fixture(t,run){
  const before={fetch:globalThis.fetch,indexedDB:globalThis.indexedDB,window:globalThis.window,onLine:Object.getOwnPropertyDescriptor(navigator,'onLine')};
  t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.parse('2026-10-08T12:00:00Z')});
  globalThis.indexedDB={};globalThis.window=new EventTarget();
  Object.defineProperty(navigator,'onLine',{value:false,configurable:true});
  const app=new ConnectedApplication({actorId:'manager',tenantId:'tenant'});app.selectGroup('group');
  let durable=[],reachable=false,recovery,wakes=0;
  const calls=[];
  app.outboxStorage.save=async items=>{durable=structuredClone(items);};
  app.sovereign.append=async()=>({});
  app.readSnapshots.get=async()=>undefined;
  globalThis.fetch=async(_url,init)=>{
    const item=JSON.parse(init.body);
    assert.ok(durable.some(row=>row.id===item.id),'an intent must be durable before every send');
    calls.push(item.idempotencyKey);
    if(!reachable)throw Error('Synthetic server outage while navigator remains online');
    return new Response(JSON.stringify({accepted:true,stored:true}),{status:200});
  };
  // Group selection was offline to avoid an unrelated signed-clock warmup.
  Object.defineProperty(navigator,'onLine',{value:true,configurable:true});
  // Execute the actual shell listener with the real Application/Outbox.
  // The old listener resets attempts and rearms the timer on every wake.
  const listener=readFileSync('apps/web/src/main.js','utf8').split('\n').find(line=>line.startsWith("window.addEventListener('eco:transport-retry-ready',"));
  assert.ok(listener,'the transport wake listener must exist');
  new Function('window','app','eventDrivenConnectivityRecovery',listener)(window,app,()=>{wakes++;recovery=app.syncOutbox();});
  const advance=async ms=>{t.mock.timers.tick(ms);await recovery;};
  try{await run({app,calls,advance,durable:()=>durable,wakes:()=>wakes,reachable:value=>{reachable=value;}});}
  finally{
    app.forceTransportRetry();t.mock.timers.reset();globalThis.fetch=before.fetch;
    if(before.indexedDB===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=before.indexedDB;
    if(before.window===undefined)delete globalThis.window;else globalThis.window=before.window;
    if(before.onLine)Object.defineProperty(navigator,'onLine',before.onLine);else delete navigator.onLine;
  }
}

test('prolonged server outage has one automatic wake and retains the same durable intent until genuine recovery',t=>fixture(t,async({app,calls,advance,durable,wakes,reachable})=>{
  const intent=await app.queueDemoIntent('Synthetic durable note');
  await app.syncOutbox();
  for(let cycle=0;cycle<8;cycle++)await advance(3650);
  assert.equal(wakes(),1,'a failed automatic retry must not schedule another automatic wake');
  assert.equal(calls.length,2,'initial send plus one bounded automatic retry, with no idle HTTP loop');
  assert.equal(durable()[0].status,'FAILED');
  assert.equal(durable()[0].attempts,2);
  assert.equal(durable()[0].idempotencyKey,intent.idempotencyKey);
  reachable(true);app.forceTransportRetry();await app.syncOutbox();
  assert.equal(app.outboxItems()[0].status,'CONFIRMED');
  assert.equal(calls.length,3);assert.equal(new Set(calls).size,1,'recovery reuses the original key');
}));

test('automatic wake never reopens exhausted attempts or business conflicts, and real transport recovery preserves the quota guard',t=>fixture(t,async({app,calls,advance,durable,reachable})=>{
  const intent=await app.queueDemoIntent('Synthetic exhausted note');await app.syncOutbox();
  const failed={...app.outboxItems()[0],attempts:5};
  const conflict={...failed,id:'conflict',idempotencyKey:'conflict',status:'CONFLICT',lastError:'CELL_VALUE_CONFLICT'};
  const confirmed={...failed,id:'confirmed',idempotencyKey:'confirmed',status:'CONFIRMED'};
  app.outbox.restore([failed,conflict,confirmed]);
  await advance(3650);
  assert.equal(calls.length,1,'the timer must respect the exhausted transport attempt limit');
  assert.equal(app.outboxItems().find(x=>x.id===intent.id).attempts,5);
  assert.equal(durable().find(x=>x.id==='conflict').status,'CONFLICT');
  app.serverBudgetBlockedUntil=Date.now()+60000;
  app.forceTransportRetry();reachable(true);await app.syncOutbox();
  assert.equal(calls.length,1,'a connectivity event cannot bypass an active D1 quota guard');
  assert.equal(app.outboxItems().find(x=>x.id==='confirmed').status,'CONFIRMED');
  assert.equal(app.outboxItems().find(x=>x.id==='conflict').status,'CONFLICT');
  app.forceServerRetry();await app.syncOutbox();
  assert.equal(calls.length,2);assert.equal(app.outboxItems().find(x=>x.id===intent.id).status,'CONFIRMED');
  assert.equal(app.outboxItems().find(x=>x.id==='conflict').status,'CONFLICT');
}));

test('a successful real response cancels a stale wake and permits one bounded recovery in a later outage',t=>fixture(t,async({app,calls,advance,wakes,reachable})=>{
  await app.queueDemoIntent('First outage');await app.syncOutbox();
  reachable(true);await app.syncOutbox();await advance(3650);
  assert.equal(wakes(),0,'a completed send must cancel its stale automatic wake');
  assert.equal(calls.length,2);
  reachable(false);await app.queueDemoIntent('Second outage');await app.syncOutbox();
  for(let cycle=0;cycle<8;cycle++)await advance(3650);
  assert.equal(wakes(),1);assert.equal(calls.length,4,'the later outage receives one automatic retry');
}));

test('activation retains the coherent 14/13 source caches and the installed 11/legacy 10 recovery caches',async()=>{
  const contract=JSON.parse(readFileSync('docs/release/CURRENT_RELEASE_CONTRACT.json','utf8'));
  const retained=[contract.release.pwaCache,contract.release.previousPwaCache,'eco-system-v15213-live-repayment-ui-20261007','eco-system-v15211-field-recovery-20261005','eco-system-v15210-offline-conflicts-loans-20261003'];
  const obsolete='eco-system-v143-blueprint-5-0-0-finalized-20260921',foreign='another-app-cache';
  const handlers={},deleted=[];
  const self={location:{origin:'https://eco.example'},addEventListener:(name,handler)=>{handlers[name]=handler;},clients:{claim:async()=>{}}};
  const caches={open:async()=>({match:async()=>({ok:true})}),keys:async()=>[...retained,obsolete,foreign],delete:async name=>{deleted.push(name);return true;}};
  new Function('self','caches',readFileSync('apps/web/sw.js','utf8'))(self,caches);
  let activation;handlers.activate({waitUntil:promise=>{activation=promise;}});await activation;
  assert.deepEqual(deleted,[obsolete],'activation keeps the recovery line and unrelated caches');
});
