import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

const base='/api/v1/groups/g';
const ledger=()=>({summary:{currency:'XAF',cashBalance:10000,memberFundsLiability:0,entryCount:0},entries:[],receipts:[],cellRevisions:[]});
async function fixture(run){
  const before=globalThis.indexedDB;globalThis.indexedDB={};
  try{
    const app=new ConnectedApplication({actorId:'manager',tenantId:'t'});app.selectGroup('g');
    const snapshots=new Map();let sequence=0,network=0;
    app.readSnapshots.get=async id=>snapshots.get(id);
    app.readSnapshots.save=async row=>{const saved={...row,updatedAt:new Date().toISOString()};snapshots.set(row.id,saved);return saved;};
    app.readSnapshots.listForActorTenant=async()=>[...snapshots.values()];
    app.outboxStorage.save=async()=>{};
    app.sovereign.list=async()=>[];
    app.outboxStorage.recordFinancialCellIntent=async item=>({...item,payload:{...item.payload,deviceId:'test-device',deviceSequence:++sequence,commandId:item.idempotencyKey}});
    app.serverBudgetBlockedUntil=Date.now()+60000;
    app.financialCellSnapshot=async()=>{network++;return{generatedAt:new Date().toISOString(),watermark:'test',cells:[{meetingId:'s',membershipId:'m',rubricId:'r',amount:3000,cellVersion:3,updatedAt:new Date().toISOString()}]};};
    await app.saveCached(base+'/ledger',ledger());
    await app.saveCached(base+'/rubrics',[]);await app.saveCached(base+'/members',[]);await app.saveCached(base+'/meetings',[]);
    await run({app,snapshots,network:()=>network});
  }finally{if(before===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=before;}
}

test('keep existing cancels the old intent with an audit record and returns the retained amount',()=>fixture(async({app})=>{
  await app.setFinancialCellTarget({meetingId:'s',membershipId:'m',rubricId:'r',targetAmount:2000,currentAmount:1000,currentVersion:1});
  const preview=await app.previewOfflineFinancialConfrontation(),row=preview.rows[0];
  assert.equal(row.serverChangedSinceBaseline,true);
  const retained=await app.resolveOfflineFinancialConfrontation(preview,{applyIds:[],keepServerIds:[row.outboxId]});
  assert.equal(retained[0].retainedAmount,3000);
  assert.equal(app.outboxItems()[0].status,'CANCELLED');
  assert.equal(app.outboxItems()[0].payload.targetAmount,2000);
  assert.equal(app.pendingFinancialCellTargets().length,0);
}));

test('choosing an older local amount creates a new durable validation before retiring the old intent',()=>fixture(async({app,network})=>{
  await app.setFinancialCellTarget({meetingId:'s',membershipId:'m',rubricId:'r',targetAmount:2000,currentAmount:1000,currentVersion:1});
  const old=app.outboxItems()[0],preview=await app.previewOfflineFinancialConfrontation();
  await app.resolveOfflineFinancialConfrontation(preview,{applyIds:[old.id],keepServerIds:[]});
  const rows=app.outboxItems(),replacement=rows.find(x=>x.id!==old.id);
  assert.equal(rows.find(x=>x.id===old.id).status,'CANCELLED');
  assert.equal(replacement.status,'PENDING');assert.equal(replacement.payload.baselineValue,3000);assert.equal(replacement.payload.baselineVersion,3);
  assert.match(replacement.payload.reason,/OFFLINE_CONFRONTATION/);
  assert.notEqual(replacement.idempotencyKey,old.idempotencyKey);
  assert.equal(rows.find(x=>x.id===old.id).payload.recordedAtClient,old.payload.recordedAtClient);
  assert.equal(network(),1,'decision preparation performs no financial send');
}));

test('Relay preserves a conflict after import and never imports the other actor authorization context',()=>fixture(async({app})=>{
  await app.setFinancialCellTarget({meetingId:'s',membershipId:'m',rubricId:'r',targetAmount:2000,currentAmount:1000,currentVersion:1});
  await app.saveCached(base+'/me',{isManager:false,membership:{userId:'manager',roles:['member']}});
  const own=app.outboxItems()[0],remote={...own,id:'remote',actorId:'other',idempotencyKey:'cell-target:other',payload:{...own.payload,targetAmount:3000,recordedAtClient:'2099-01-01T00:00:00.000Z'}};
  const delta={protocol:'ECO_MANAGER_DELTA_2',tenantId:'t',groupId:'g',actorId:'other',commands:[remote],structuralSnapshots:[{path:base+'/me',body:{isManager:true,membership:{userId:'other',roles:['founder']}}}]};
  const result=await app.importLocalRoomManagerDelta(delta);
  assert.equal(result.conflicts,1);assert.equal((await app.confrontLocalRoomManagerDelta(delta)).potentialFinancialConflicts.length,1);
  assert.equal((await app.cached(base+'/me')).isManager,false);
  assert.equal(app.outboxItems().length,1,'a foreign actor command is never enqueued as our own');
}));

test('a cancelled savings receipt and a closed loan cannot resurrect from a last-known-good projection',()=>fixture(async({app})=>{
  await app.saveCached(base+'/rubrics',[{id:'savings',name:'Épargne classique',facets:{direction:'INFLOW',refundability:'FULLY_REFUNDABLE',interestMode:'CUSTOM'}}]);
  const state=ledger();state.receipts=[{id:'deposit',membershipId:'m',rubricId:'savings',meetingId:'s',netAmount:0,receivedAt:'2026-10-01',amount:{amount:1000}}];await app.saveCached(base+'/ledger',state);
  await app.saveCached(base+'/savings-yield/source-data',{deposits:[{id:'deposit',memberId:'m',rubricId:'savings',meetingId:'s',amount:1000,fund:'CLASSIC'}],loanDebts:[{loanId:'loan',memberId:'m',principal:10000,interest:500}],totals:{}});
  await app.saveCached(app.completionPath('LOAN'),[{id:'loan',data:{completionKind:'LOAN',completionState:'CLOSED',outstandingPrincipal:0,unpaidInterest:0}}]);
  const result=await app.savingsYieldSourceData();
  assert.equal(result.totals.totalSavings,0);assert.equal(result.loanDebts.length,0);assert.equal(result.totals.outstandingPrincipal,0);
}));

for(const priority of ['CAPITAL_FIRST','INTEREST_FIRST'])test('offline debt projection follows '+priority+' before the server is reachable',()=>fixture(async({app})=>{
  const rubric={id:'loan-rubric',name:'Prêt',facets:{custom:{systemKey:'LOAN'}},policies:{loan:{allowed:true,rateBasisPointsPerPeriod:0,paymentPriority:priority}}};
  await app.saveCached(base+'/rubrics',[rubric]);
  await app.saveCached(app.completionPath('LOAN'),[{id:'loan',title:'Prêt',createdAt:'2026-09-01',data:{completionKind:'LOAN',completionState:'DISBURSED',borrowerMembershipId:'m',outstandingPrincipal:10000,unpaidInterest:2000,paymentPriority:priority,rateBasisPointsPerPeriod:0,rubricId:rubric.id}}]);
  await app.recordFinancialSheetEntry({membershipId:'m',meetingId:'s',rubric:{id:'repay',name:'Remboursements',facets:{custom:{systemKey:'REPAYMENT'}}},amount:6000,deferSync:true});
  const result=await app.savingsYieldSourceData(),debt=result.loanDebts[0];
  assert.equal(debt.principal,priority==='CAPITAL_FIRST'?4000:6000);assert.equal(debt.interest,priority==='CAPITAL_FIRST'?2000:0);
  assert.equal(result.localPending,true);assert.equal(result.totals.recoveredInterest,priority==='CAPITAL_FIRST'?0:2000);
  assert.equal((await app.cached(app.completionPath('LOAN')))[0].data.outstandingPrincipal,10000,'projection never changes the persisted canonical loan');
}));

test('a real transport recovery reopens exhausted transport attempts but preserves business conflicts and quota protection',()=>fixture(async({app})=>{
  app.outbox.restore([{id:'failed',tenantId:'t',actorId:'manager',idempotencyKey:'failed',type:'MEETING_NOTE_UPDATED',payload:{groupId:'g'},status:'FAILED',attempts:5,lastError:'NETWORK_UNAVAILABLE',createdAt:'2026-10-01',updatedAt:'2026-10-01'},
    {id:'conflict',tenantId:'t',actorId:'manager',idempotencyKey:'conflict',type:'MEETING_NOTE_UPDATED',payload:{groupId:'g'},status:'CONFLICT',attempts:5,lastError:'CELL_VALUE_CONFLICT',createdAt:'2026-10-01',updatedAt:'2026-10-01'}]);
  app.markLiveTransportHealthy();
  assert.equal(app.outboxItems().find(x=>x.id==='failed').attempts,0);assert.equal(app.outboxItems().find(x=>x.id==='conflict').status,'CONFLICT');assert.equal(app.serverBudgetState().blocked,true);
}));

test('an unpersisted specialized financial operation cannot remain eligible for background sending',()=>fixture(async({app})=>{
  app.outboxStorage.save=async()=>{throw Error('Storage unavailable');};
  await assert.rejects(app.recordFinancialSheetEntry({membershipId:'m',meetingId:'s',rubric:{id:'repay',name:'Remboursements',facets:{custom:{systemKey:'REPAYMENT'}}},amount:6000,deferSync:true}),/DURABLE_STORAGE_REQUIRED/);
  assert.equal(app.outboxItems().length,0);
}));

test('a Relay decision survives a fresh comparison and retires the stale imported display target',()=>fixture(async({app})=>{
  await app.setFinancialCellTarget({meetingId:'s',membershipId:'m',rubricId:'r',targetAmount:2000,currentAmount:1000,currentVersion:1});
  const local=app.outboxItems()[0],remote={...local,id:'remote',actorId:'other',idempotencyKey:'other-key',payload:{...local.payload,targetAmount:3000}};
  const delta={protocol:'ECO_MANAGER_DELTA_2',tenantId:'t',groupId:'g',actorId:'other',commands:[remote],structuralSnapshots:[]};
  await app.importLocalRoomManagerDelta(delta);
  assert.equal((await app.localRelayFinancialConflicts()).length,1);
  await app.resolveLocalRoomManagerConflict({local,remote,choice:'LOCAL'});
  assert.equal((await app.localRelayFinancialConflicts()).length,0);
  assert.equal((await app.relayManagerFinancialTargets()).length,0);
  assert.equal((await app.confrontLocalRoomManagerDelta(delta)).potentialFinancialConflicts.length,0);
}));
