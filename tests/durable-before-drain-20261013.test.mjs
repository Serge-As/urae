import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';
test('an in-flight mode sync cannot send a financial intention before its durable sequence has committed',async()=>{
 const oldIndexed=globalThis.indexedDB,oldFetch=globalThis.fetch;globalThis.indexedDB={};
 let releaseMode,releaseFinance,startedMode;const modeHeld=new Promise(r=>releaseMode=r),financeHeld=new Promise(r=>releaseFinance=r),modeStarted=new Promise(r=>startedMode=r),sent=[];
 try{
  const app=new ConnectedApplication({tenantId:'synthetic-tenant',actorId:'synthetic-manager'});app.selectGroup('synthetic-group');
  app.outboxStorage.save=async()=>{};app.sovereign.append=async()=>{};
  app.outboxStorage.recordFinancialCellIntent=async item=>{await financeHeld;return{...item,payload:{...item.payload,deviceSequence:27,deviceId:'synthetic-device'}};};
  globalThis.fetch=async(_url,init)=>{const item=JSON.parse(init.body);sent.push(item);if(item.type==='FINANCIAL_WORK_V1'){startedMode();await modeHeld;}return new Response(JSON.stringify({accepted:true,stored:true,status:'APPLIED'}));};
  await app.queueLocal('FINANCIAL_WORK_V1',{groupId:'synthetic-group',meetingId:'s',mode:'REUNION'});
  const sync=app.syncOutbox();await modeStarted;
  const financial=app.queueLocal('FINANCIAL_CELL_CORRECTION_PROPOSAL_V2',{groupId:'synthetic-group',meetingId:'s',membershipId:'m',rubricId:'r',targetAmount:1000},'cell-target:durability-regression');
  await new Promise(r=>setImmediate(r));releaseMode();await sync;
  assert.equal(sent.filter(x=>x.type==='FINANCIAL_CELL_CORRECTION_PROPOSAL_V2').length,0,'no unsigned/unsequenced intention may reach the server');
  releaseFinance();await financial;await app.syncOutbox();const commands=sent.filter(x=>x.type==='FINANCIAL_CELL_CORRECTION_PROPOSAL_V2');assert.equal(commands.length,1);assert.equal(commands[0].payload.deviceSequence,27);
 }finally{releaseMode?.();releaseFinance?.();globalThis.fetch=oldFetch;if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;}
});
