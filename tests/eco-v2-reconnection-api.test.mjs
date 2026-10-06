import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

// Calls the internal handler only. Authentication/HMAC trust boundaries have
// separate tests; these normalized headers model verified adapter output.
const scope={tenantId:'tenant-q05',groupId:'group-q05',meetingId:'meeting-q05',
  membershipId:'membership-q05',rubricId:'rubric-q05'};
const fixture=async()=>{
  const repo=new InMemoryPlatformRepository();
  await repo.saveGroup({id:scope.groupId,tenantId:scope.tenantId,
    kind:'association',name:'Q05 Groupe',status:'active',createdAt:'2026-10-06T08:00:00Z',
    createdBy:'manager-a',originMode:'CREATE_NEW',governanceModel:'community'});
  for(const id of ['manager-a','manager-b','member-q05']){
    await repo.saveUser({id,displayName:id,locale:'fr',createdAt:'2026-10-06T08:00:00Z'});
  }
  await repo.saveMembership({id:scope.membershipId,tenantId:scope.tenantId,groupId:scope.groupId,
    userId:'member-q05',status:'active',roles:['member'],joinedAt:'2026-10-06T08:00:00Z'});
  await repo.saveMembership({id:'manager-b-membership',tenantId:scope.tenantId,groupId:scope.groupId,
    userId:'manager-b',status:'active',roles:['manager'],joinedAt:'2026-10-06T08:00:00Z'});
  await repo.saveMeeting({id:scope.meetingId,tenantId:scope.tenantId,groupId:scope.groupId,
    status:'open',title:'Séance Q05',session:1,
    scheduledAt:'2026-10-06T08:00:00Z',openedAt:'2026-10-06T08:00:00Z',openedBy:'manager-a'});
  await repo.saveRubricDefinition({id:scope.rubricId,tenantId:scope.tenantId,groupId:scope.groupId,
    name:'Collation',status:'ACTIVE',facets:{direction:'INFLOW'},
    policies:{},createdAt:'2026-10-06T08:00:00Z'});
  const handle=createApiHandler(repo),send=async(actor,target,key,ms,baseVersion=1,clockQuality='VERIFIED')=>{
    const v2=ms>0,commandId='cell-target:'+key;
    const payload={groupId:scope.groupId,meetingId:scope.meetingId,membershipId:scope.membershipId,
      rubricId:scope.rubricId,targetAmount:target,baselineValue:1000,baselineVersion:baseVersion,
      recordedAtClient:new Date(ms||Date.parse('2026-10-06T09:00:00Z')).toISOString(),
      deviceId:'device-'+actor,deviceSequence:Math.max(1,key.length),commandId,reason:'Confrontation test'};
    const body={membershipId:scope.membershipId,rubricId:scope.rubricId,targetAmount:target,
      expectedCurrentAmount:1000,expectedCellVersion:baseVersion,reason:'Confrontation test',
      ...(v2?{intentV2:payload}:{})};
    const request=new Request('https://eco.invalid/api/v1/groups/'+scope.groupId+
      '/meetings/'+scope.meetingId+'/financial-cells',{
      method:'POST',
      headers:{'content-type':'application/json','x-tenant-id':scope.tenantId,
        'x-actor-id':actor,'x-group-roles':'manager','x-active-group-id':scope.groupId,
        'x-idempotency-key':commandId,
        'x-eco-recorded-at-ms':String(ms),'x-eco-clock-quality':clockQuality},
      body:JSON.stringify(body)});
    const response=await handle(request),result=await response.json();
    if(!response.ok)throw new Error('HTTP_'+response.status+':'+JSON.stringify(result));
    return result;
  };
  const state=async()=>{
    const {LedgerService}=await import('../.build/packages/domain/src/index.js');
    const receipts=await repo.listContributionReceipts(scope.tenantId,scope.groupId);
    // Canonical receipt positions: original minus reversals plus replacements.
    let total=0;
    const entries=await repo.listLedgerEntries(scope.tenantId,scope.groupId);
    for(const receipt of receipts){
      const original=entries.find(e=>e.id===receipt.ledgerEntryId);
      const reversed=entries.some(e=>e.reversalOfEntryId===original?.id);
      if(!reversed)total+=receipt.amount.amount;
    }
    const version=await repo.getFinancialCellRevision(scope.tenantId,scope.groupId,
      scope.meetingId,scope.membershipId,scope.rubricId,'XAF');
    return{total,version:version?.version??0,entryCount:entries.length};
  };
  await send('manager-a',1000,'seed',0,0);
  assert.equal((await state()).total,1000);
  assert.equal((await state()).version,1);
  return{repo,send,state};
};
const at=(minute,seconds=0)=>Date.parse('2026-10-06T10:'+
  String(minute).padStart(2,'0')+':'+String(seconds).padStart(2,'0')+'Z');

test('Q05 normal, B disconnected and reconnected first or second yields same canonical 3000',async()=>{
  for(const order of ['AB','BA']){
    const x=await fixture();
    const ops={A:()=>x.send('manager-a',2000,'A',at(1)),
      B:()=>x.send('manager-b',3000,'B',at(2))};
    const statuses=[];
    for(const key of order)statuses.push((await ops[key]()).status);
    assert.equal((await x.state()).total,3000);
    assert.ok(statuses.includes('SUPERSEDED')||order==='AB');
  }
});
test('Q21 later identical amount reconfirmation wins and advances revision without extra cash',async()=>{
  const x=await fixture();
  await x.send('manager-b',3000,'early',at(2));
  const before=await x.state();
  const same=await x.send('manager-a',3000,'later-same',at(4));
  assert.equal(same.status,'NO_AMOUNT_CHANGE');
  const after=await x.state();
  assert.equal(after.total,3000);
  assert.equal(after.entryCount,before.entryCount,'later same value creates no Ledger entry');
  assert.equal(after.version,before.version+1,'new recording advances revision/order');
  const older=await x.send('manager-b',4000,'older',at(3));
  assert.equal(older.status,'SUPERSEDED');
  assert.equal((await x.state()).total,3000);
});
test('Q22 lost ACK/replay same command never posts another ledger entry',async()=>{
  const x=await fixture();
  const first=await x.send('manager-a',2000,'durable',at(2));
  const before=await x.state();
  const replay=await x.send('manager-a',2000,'durable',at(2));
  assert.equal(replay.replayed,true);
  assert.equal(replay.status,first.status);
  assert.deepEqual(await x.state(),before);
});
test('Q20 unverified device clock preserves candidate and leaves canonical ledger alone',async()=>{
  const x=await fixture(),before=await x.state();
  const result=await x.send('manager-a',9999,'wrong-clock',at(12),1,'UNVERIFIABLE');
  assert.equal(result.status,'CLOCK_REVIEW');
  assert.deepEqual(await x.state(),before);
});
