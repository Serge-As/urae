import test from 'node:test';
import assert from 'node:assert/strict';
import {MeetingLiveConsensusService} from '../.build/packages/meeting-live-consensus/src/index.js';

const fixture=()=>{
  const records=new Map(),cases=new Map(),audit=[],groupId='group-review',tenantId='tenant-review',memberId='membership-01';
  const group={id:groupId,tenantId,createdBy:'manager-a'};
  const memberships=[
    {id:'m-a',userId:'manager-a',groupId,tenantId,status:'active',roles:['manager']},
    {id:'m-b',userId:'manager-b',groupId,tenantId,status:'active',roles:['manager']},
    {id:memberId,userId:'member-1',groupId,tenantId,status:'active',roles:[]}
  ];
  let actor='manager-a',canonicalAmount=3000;
  const repository={
    getGroup:async()=>group,
    listMemberships:async()=>memberships,
    getWorkspaceRecord:async(_tenant,id)=>records.get(id),
    saveWorkspaceRecord:async record=>{records.set(record.id,structuredClone(record));},
    saveAudit:async row=>audit.push(row),
    listCases:async()=>[...cases.values()],
    saveCase:async row=>{cases.set(row.id,structuredClone(row));},
    getLedgerEntry:async()=>{throw Error('REVIEW_MUST_NOT_ACCESS_LEDGER');},
    commitFinancialCorrection:async()=>{throw Error('REVIEW_MUST_NOT_MUTATE_LEDGER');}
  };
  const kernel={
    context:{get:()=>({tenantId,actorId:actor,requestId:'test-review',groupRoles:actor==='member-1'?[]:['manager']})},
    audit:{append:row=>({...row,id:'audit-'+audit.length,at:new Date().toISOString()})}
  };
  return {svc:new MeetingLiveConsensusService(repository,kernel),groupId,memberId,records,cases,audit,
    setActor:id=>actor=id,setAmount:n=>canonicalAmount=n,getAmount:()=>canonicalAmount};
};

test('manager may contest without mutating the canonical contribution or opening a replacement ledger',async()=>{
  const x=fixture(),input={groupId:x.groupId,meetingId:'session-01',membershipId:x.memberId,
    rubricId:'rubric-01',cellVersion:2,amount:3000,reason:'Montant non reconnu',decision:'RESERVE'};
  const result=await x.svc.reviewCanonicalCell(input);
  assert.equal(result.record.state,'RESERVE_OPEN');
  assert.equal(result.record.selectedValue,'3000');
  assert.equal(x.getAmount(),3000);
  assert.equal(x.cases.size,1);
  assert.equal(x.records.get(result.review.id).data.reason,'Montant non reconnu');
  const repeat=await x.svc.reviewCanonicalCell(input);
  assert.equal(repeat.review.id,result.review.id,'replay preserves review id');
  assert.equal(x.cases.size,1,'replay does not duplicate the dispute case');
});
test('silence from other managers cannot block canonical value or independent approval',async()=>{
  const x=fixture();
  const input={groupId:x.groupId,meetingId:'session-02',membershipId:x.memberId,
    rubricId:'rubric-01',cellVersion:3,amount:500,decision:'APPROVE'};
  const r=await x.svc.reviewCanonicalCell(input);
  assert.equal(r.review.data.decision,'APPROVE');
  assert.equal(x.cases.size,0);
  assert.equal(x.getAmount(),3000,'reviewer approval never edits financial authority');
});
test('members cannot impersonate manager and older revision cannot approve newer review',async()=>{
  const x=fixture(),input={groupId:x.groupId,meetingId:'session-03',membershipId:x.memberId,
    rubricId:'rubric-01',cellVersion:4,amount:3000,decision:'APPROVE'};
  await x.svc.reviewCanonicalCell(input);
  await assert.rejects(()=>x.svc.reviewCanonicalCell({...input,cellVersion:3}),/CELL_REVIEW_STALE/);
  x.setActor('member-1');
  await assert.rejects(()=>x.svc.reviewCanonicalCell(input),/MANAGER_REQUIRED/);
});
