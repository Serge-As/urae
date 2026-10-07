import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

const tenantId='tenant-loan-scope',groupId='group-loan-scope',rubricId='rubric-loan';
const createdAt='2026-10-01T08:00:00.000Z',effectiveAt='2026-10-06T12:00:00.000Z';

const fixture=async()=>{
  const repo=new InMemoryPlatformRepository();
  await repo.saveUser({id:'manager-a',displayName:'Manager A',locale:'fr',createdAt});
  await repo.saveUser({id:'borrower-a',displayName:'Paul',locale:'fr',createdAt});
  await repo.saveGroup({id:groupId,tenantId,kind:'association',name:'Prêts gouvernés',status:'active',
    createdAt,createdBy:'manager-a',originMode:'CREATE_NEW',governanceModel:'community'});
  await repo.saveMembership({id:'membership-borrower',tenantId,groupId,userId:'borrower-a',status:'active',
    roles:['member'],joinedAt:createdAt});
  await repo.saveRubricDefinition({id:rubricId,tenantId,groupId,name:'Prêt',status:'ACTIVE',source:'GROUP_CUSTOM',
    facets:{direction:'OUTFLOW',custom:{systemKey:'LOAN'}},
    policies:{loan:{allowed:true,rateBasisPointsPerPeriod:200,interestBase:'PRINCIPAL_ONLY',
      paymentPriority:'CAPITAL_FIRST',interestTiming:'NEXT_SESSION_DUE',fundingMode:'AVAILABLE_GROUP_CASH',
      carryForwardUnusedFunds:true,noInterestOnInterest:true}},
    createdAt,updatedAt:createdAt,version:1});
  const saveLoan=async(id,state,updatedAt='2026-10-05T10:00:00.000Z')=>repo.saveWorkspaceRecord({
    id,tenantId,groupId,moduleId:'FINANCE.LOANS',title:id,status:state==='CLOSED'?'DONE':'ACTIVE',
    tags:['completion','kind:LOAN','state:'+state],
    data:{completionKind:'LOAN',completionState:state,completionVersion:1,borrowerMembershipId:'membership-borrower',
      rubricId,principal:10000,outstandingPrincipal:state==='CLOSED'?0:10000,unpaidInterest:state==='CLOSED'?0:2000,
      currency:'XAF',rateBasisPointsPerPeriod:200,paymentPriority:'CAPITAL_FIRST',
      interestTiming:'NEXT_SESSION_DUE',noInterestOnInterest:true,installmentsPerYear:12},
    createdBy:'manager-a',createdAt,updatedAt
  });
  await saveLoan('loan-open','REPAYING');
  await saveLoan('loan-closed','CLOSED','2026-10-04T10:00:00.000Z');
  const handle=createApiHandler(repo);
  const request=async(path,method='GET',body)=>{
    const response=await handle(new Request('https://eco.invalid'+path,{method,headers:{
      ...(body===undefined?{}:{'content-type':'application/json'}),'x-tenant-id':tenantId,'x-actor-id':'manager-a',
      'x-group-roles':'manager','x-active-group-id':groupId
    },body:body===undefined?undefined:JSON.stringify(body)}));
    const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}
    if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
    return data;
  };
  const policy=async(scope,commandId,selectedLoanIds=[])=>request('/api/v1/groups/'+groupId+'/rubrics/'+rubricId+'/policies','PUT',{
    loan:{allowed:true,rateBasisPointsPerPeriod:200,interestBase:'PRINCIPAL_ONLY',
      paymentPriority:'INTEREST_FIRST',interestTiming:'NEXT_SESSION_DUE',fundingMode:'AVAILABLE_GROUP_CASH',
      carryForwardUnusedFunds:true,noInterestOnInterest:true,
      changeControl:{commandId,scope,effectiveMode:'DATE',effectiveAt,selectedLoanIds}}
  });
  return{repo,request,policy};
};

test('Option A changes new loans only: an older open loan keeps CAPITAL_FIRST for its next repayment',async()=>{
  const x=await fixture();
  const updated=await x.policy('NEW_LOANS_ONLY','scope-a');
  assert.equal(updated.policies.loan.revisions.length,1);
  assert.deepEqual(updated.policies.loan.revisions[0].affectedLoanIds,[]);
  const result=await x.request('/api/v1/groups/'+groupId+'/loans/loan-open/repay','POST',{
    paymentAmount:6000,expectedVersion:1,idempotencyKey:'repay-a'
  });
  assert.equal(result.allocation.priority,'CAPITAL_FIRST');
  assert.equal(result.allocation.principalPaid,6000);
  assert.equal(result.allocation.interestPaid,0);
  assert.equal(result.allocation.remainingPrincipal,4000);
  assert.equal(result.allocation.unpaidInterestAfter,2000);
});

test('Option B applies to open loans and excludes a fully settled loan',async()=>{
  const x=await fixture();
  const updated=await x.policy('NEW_AND_ALL_OPEN_LOANS','scope-b');
  const revision=updated.policies.loan.revisions[0];
  assert.deepEqual(revision.affectedLoanIds,['loan-open']);
  assert.ok(!revision.affectedLoanIds.includes('loan-closed'));
  const result=await x.request('/api/v1/groups/'+groupId+'/loans/loan-open/repay','POST',{
    paymentAmount:6000,expectedVersion:1,idempotencyKey:'repay-b'
  });
  assert.equal(result.allocation.priority,'INTEREST_FIRST');
  assert.equal(result.allocation.interestPaid,2000);
  assert.equal(result.allocation.principalPaid,4000);
  assert.equal(result.allocation.remainingPrincipal,6000);
  assert.equal(result.allocation.unpaidInterestAfter,0);
});

test('Selected-open mode affects only selected live loans and policy command replay is idempotent',async()=>{
  const x=await fixture();
  const first=await x.policy('NEW_AND_SELECTED_OPEN_LOANS','scope-selected',['loan-open']);
  const second=await x.policy('NEW_AND_SELECTED_OPEN_LOANS','scope-selected',['loan-open']);
  assert.equal(first.policies.loan.revisions.length,1);
  assert.equal(second.policies.loan.revisions.length,1);
  assert.equal(first.policies.loan.revisions[0].id,second.policies.loan.revisions[0].id);
  assert.deepEqual(first.policies.loan.revisions[0].affectedLoanIds,['loan-open']);
});

test('Selected-open mode refuses a closed loan instead of silently rewriting history',async()=>{
  const x=await fixture();
  await assert.rejects(()=>x.policy('NEW_AND_SELECTED_OPEN_LOANS','scope-closed',['loan-closed']),/LOAN_POLICY_SELECTED_LOAN_NOT_OPEN/);
});
