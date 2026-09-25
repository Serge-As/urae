import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

const emptyLedger=()=>({summary:{currency:'XAF',cashBalance:0,memberFundsLiability:0,entryCount:0},entries:[],receipts:[],cellRevisions:[]});

test('1.5.2.3 queued financial entry stays visibly projected when server ledger is still zero',async()=>{
  const oldFetch=globalThis.fetch,oldIndexed=globalThis.indexedDB;
  try{
    globalThis.indexedDB={};
    const app=new ConnectedApplication({actorId:'manager_hotfix',tenantId:'tenant_hotfix'});
    app.selectGroup('group_hotfix');
    app.outboxStorage.save=async()=>{};
    app.readSnapshots.save=async x=>({...x,updatedAt:new Date().toISOString()});
    app.readSnapshots.get=async()=>undefined;
    globalThis.fetch=async(input,init={})=>{
      const url=String(input);
      if(url.includes('/api/v1/outbox/apply'))return new Response(JSON.stringify({error:'TEMPORARY_UNAVAILABLE'}),{status:503,headers:{'content-type':'application/json'}});
      if(url.includes('/api/v1/groups/group_hotfix/ledger'))return new Response(JSON.stringify(emptyLedger()),{status:200,headers:{'content-type':'application/json'}});
      throw new Error('UNEXPECTED_FETCH:'+url+':'+String(init.method??'GET'));
    };
    const result=await app.recordCashContribution({membershipId:'member_1',meetingId:'meeting_1',rubricId:'rubric_1',amount:1000});
    assert.equal(result.queued,true);
    const ledger=await app.ledger();
    assert.equal(ledger.summary.cashBalance,1000);
    assert.equal(ledger.summary.memberFundsLiability,1000);
    assert.equal(ledger.summary.entryCount,1);
    assert.equal(ledger.receipts.length,1);
    assert.equal(ledger.receipts[0].netAmount,1000);
    assert.equal(ledger.receipts[0].localPending,true);
    assert.ok(['FAILED','PENDING','SYNCING'].includes(String(ledger.receipts[0].localPendingStatus)));
  }finally{globalThis.fetch=oldFetch;if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;}
});

test('1.5.2.3 optimistic ledger deduplicates a pending intent already present in a cached/server projection',async()=>{
  const oldFetch=globalThis.fetch,oldIndexed=globalThis.indexedDB;
  try{
    globalThis.indexedDB={};
    const app=new ConnectedApplication({actorId:'manager_hotfix',tenantId:'tenant_hotfix'});
    app.selectGroup('group_hotfix');app.outboxStorage.save=async()=>{};
    globalThis.fetch=async input=>{
      const url=String(input);
      if(url.includes('/api/v1/outbox/apply'))return new Response(JSON.stringify({error:'TEMPORARY_UNAVAILABLE'}),{status:503,headers:{'content-type':'application/json'}});
      if(url.includes('/api/v1/groups/group_hotfix/ledger')){
        const item=app.outboxItems().find(x=>x.type==='CONTRIBUTION_CASH_RECORDED');
        const receipt=item?{id:'server_or_cache',tenantId:'tenant_hotfix',groupId:'group_hotfix',membershipId:'member_1',amount:{currency:'XAF',amount:1000},paymentMethod:'cash',ledgerEntryId:'pending',meetingId:'meeting_1',receivedAt:item.createdAt,receivedBy:'manager_hotfix',idempotencyKey:item.idempotencyKey,rubricId:'rubric_1',netAmount:1000,localPending:true}:{};
        return new Response(JSON.stringify({summary:{currency:'XAF',cashBalance:1000,memberFundsLiability:1000,entryCount:1},entries:[],receipts:[receipt],cellRevisions:[]}),{status:200,headers:{'content-type':'application/json'}});
      }
      throw new Error('UNEXPECTED_FETCH');
    };
    await app.recordCashContribution({membershipId:'member_1',meetingId:'meeting_1',rubricId:'rubric_1',amount:1000});
    const ledger=await app.ledger();
    assert.equal(ledger.receipts.length,1);
    assert.equal(ledger.summary.cashBalance,1000);
    assert.equal(ledger.summary.entryCount,1);
  }finally{globalThis.fetch=oldFetch;if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;}
});

test('1.5.2.3 offline correction exposes the exact pending target for immediate matrix rendering',async()=>{
  const oldIndexed=globalThis.indexedDB;
  try{
    globalThis.indexedDB={};
    const app=new ConnectedApplication({actorId:'manager_hotfix',tenantId:'tenant_hotfix'});
    app.selectGroup('group_hotfix');app.outboxStorage.save=async()=>{};app.usingOfflineSnapshot=true;
    const result=await app.setFinancialCellTarget({meetingId:'meeting_1',membershipId:'member_1',rubricId:'rubric_1',targetAmount:500,currentAmount:1000,currentVersion:2,reason:'Correction terrain'});
    assert.equal(result.queued,true);
    const pending=app.pendingFinancialCellTargets();
    assert.equal(pending.length,1);assert.equal(pending[0].targetAmount,500);assert.equal(pending[0].baselineValue,1000);assert.equal(pending[0].baselineVersion,2);
  }finally{if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;}
});

test('1.5.2.3 financial matrix validates both click and Enter and shows durable local pending state',async()=>{
  const main=await readFile('.build/src/main.js','utf8');
  assert.match(main,/validate\.addEventListener\('click',\s*submit\)/);
  assert.match(main,/event\.key\s*===\s*['"]Enter['"][\s\S]{0,120}event\.code\s*===\s*['"]Enter['"][\s\S]{0,120}event\.keyCode\s*===\s*13/);
  assert.match(main,/event\.preventDefault\(\);[\s\S]{0,120}event\.stopPropagation\(\);[\s\S]{0,120}submit\(\)/);
  assert.match(main,/financialPendingTargets\s*=\s*new Map/);
  assert.match(main,/Enregistré hors ligne · synchro en attente/);
  assert.match(main,/✓ Valeur enregistrée sur cet appareil/);
});
