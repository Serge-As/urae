import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';
import {Outbox} from '../.build/packages/offline/src/index.js';

test('online cash persists before sending and retries an ambiguous reply using the same key',async()=>{
 const oldFetch=globalThis.fetch,oldIndexed=globalThis.indexedDB;
 const online=Object.getOwnPropertyDescriptor(navigator,'onLine');
 try{
  globalThis.indexedDB={};Object.defineProperty(navigator,'onLine',{value:true,configurable:true});
  const app=new ConnectedApplication({actorId:'member',tenantId:'tenant'});app.selectGroup('group');
  let persisted=[],calls=[],fail=true;
  app.outboxStorage.save=async items=>{persisted=structuredClone(items);};
  globalThis.fetch=async(_url,init)=>{const item=JSON.parse(init.body);assert.ok(persisted.some(x=>x.id===item.id));calls.push(item.idempotencyKey);if(fail){fail=false;throw Error('Reply lost');}return new Response(JSON.stringify({accepted:true,stored:true}),{status:200});};
  const first=await app.recordCashContribution({membershipId:'m',amount:1000});assert.equal(first.queued,true);assert.equal(first.outbox.status,'FAILED');
  const result=await app.syncOutbox();assert.equal(result[0].status,'CONFIRMED');assert.equal(calls.length,2);assert.equal(calls[0],calls[1]);
  let sent=false;globalThis.fetch=async()=>{sent=true;throw Error('Unexpected send');};app.outboxStorage.save=async()=>{throw Error('Disk full');};
  await assert.rejects(app.recordCashContribution({membershipId:'m',amount:2000}),/DURABLE_STORAGE_REQUIRED/);assert.equal(sent,false);assert.equal(app.outboxItems().length,1);
 }finally{globalThis.fetch=oldFetch;if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;if(online)Object.defineProperty(navigator,'onLine',online);else delete navigator.onLine;}
});


test('restored outbox replays by creation time rather than IndexedDB primary-key order',async()=>{
 const outbox=new Outbox(),seen=[];
 outbox.restore([
   {id:'a_expense',tenantId:'tenant',actorId:'manager',type:'FINANCIAL_SHEET_ENTRY_V1',payload:{groupId:'group',nature:'OUTFLOW',amount:700},idempotencyKey:'expense',status:'PENDING',createdAt:'2026-09-28T16:00:00.200Z',updatedAt:'2026-09-28T16:00:00.200Z',attempts:0},
   {id:'z_contribution',tenantId:'tenant',actorId:'manager',type:'FINANCIAL_CELL_CORRECTION_PROPOSAL_V1',payload:{groupId:'group',targetAmount:3000},idempotencyKey:'cash-in',status:'PENDING',createdAt:'2026-09-28T16:00:00.100Z',updatedAt:'2026-09-28T16:00:00.100Z',attempts:0}
 ]);
 const result=await outbox.sync(async item=>{seen.push(item.type);return{ok:true,result:{accepted:true,stored:true}};});
 assert.deepEqual(seen,['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_SHEET_ENTRY_V1']);
 assert.equal(result.every(x=>x.status==='CONFIRMED'),true);
});
