import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Outbox} from '../.build/packages/offline/src/index.js';

function shell(app){
  const source=readFileSync('apps/web/src/main.js','utf8');
  const start=source.indexOf('let onlineResumePromise='),end=source.indexOf('const eventDrivenConnectivityRecovery=',start);
  assert.ok(start>0&&end>start);
  const noop=()=>{},dependencies={app,captureNavState:()=>({}),persistNavState:noop,renderConnectivity:noop,
    reviewOfflineFinancialBacklog:async()=>true,pendingTargetSnapshot:()=>[],pendingSheetSnapshot:()=>[],
    rememberTargetsConfirmedBySync:noop,renderOutbox:noop,renderPersistedFinancialConflicts:noop,
    flushDeferredFinancialProjections:noop,financialCellKey:JSON.stringify};
  return new Function(...Object.keys(dependencies),'let financialPendingTargets,financialPendingSheetEntries,offlineConfrontationDeferred=false;\n'+source.slice(start,end)+'\nreturn resumeOnline;')(...Object.values(dependencies));
}
const enqueue=(outbox,key)=>outbox.enqueue({tenantId:'t',actorId:'a',type:'FINANCIAL_CELL_CORRECTION_PROPOSAL_V2',payload:{groupId:'g',meetingId:'s',membershipId:key,rubricId:'r',targetAmount:2000},idempotencyKey:key});

test('twenty validated entries arriving during an active synchronization all drain without another user action',async()=>{
  const outbox=new Outbox(),sent=[];
  let release,started;
  const firstStarted=new Promise(r=>{started=r;}),hold=new Promise(r=>{release=r;});
  const app={activeGroup:()=> 'g',outboxItems:()=>outbox.list(),pendingFinancialCellTargets:()=>[],pendingFinancialSheetEntries:()=>[],
    syncOutbox:()=>outbox.sync(async item=>{sent.push(item.idempotencyKey);if(sent.length===1){started();await hold;}return{ok:true};})};
  const resume=shell(app);enqueue(outbox,'first');const first=resume();await firstStarted;
  for(let i=0;i<20;i++){enqueue(outbox,'during-'+i);void resume();}
  release();await first;
  for(let i=0;i<25;i++)await new Promise(r=>setImmediate(r));
  assert.equal(sent.length,21,'new validations must not disappear into the existing single-flight promise');
  assert.equal(new Set(sent).size,21,'each durable intent is sent once');
  assert.ok(outbox.list().every(x=>x.status==='CONFIRMED'));
});

test('coalesced wakeups during an outage never create an idle retry loop',async()=>{
  const outbox=new Outbox();let sent=0,release;
  const hold=new Promise(r=>{release=r;});
  const app={activeGroup:()=> 'g',outboxItems:()=>outbox.list(),pendingFinancialCellTargets:()=>[],pendingFinancialSheetEntries:()=>[],
    syncOutbox:()=>outbox.sync(async()=>{sent++;await hold;return{ok:false,error:'NETWORK_UNAVAILABLE'};})};
  const resume=shell(app);enqueue(outbox,'failed');const first=resume();void resume();void resume();release();await first;
  for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));
  assert.equal(sent,1);assert.equal(outbox.list()[0].status,'FAILED');
});
