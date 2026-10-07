import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

const tenantId='tenant-loan-policy',groupId='group-loan-policy',rubricId='rubric-loan-policy',memberId='member-loan-policy';

const fixture=async()=>{
  const repo=new InMemoryPlatformRepository();
  await repo.saveGroup({id:groupId,tenantId,name:'Groupe prêts',kind:'association',status:'active',createdBy:'manager-loan',createdAt:'2026-10-07T08:00:00Z',governanceModel:'community'});
  await repo.saveUser({id:'manager-loan',displayName:'Gestionnaire',locale:'fr',createdAt:'2026-10-07T08:00:00Z'});
  await repo.saveUser({id:'user-borrower',displayName:'Emprunteur',locale:'fr',createdAt:'2026-10-07T08:00:00Z'});
  await repo.saveMembership({id:'manager-membership',tenantId,groupId,userId:'manager-loan',roles:['manager'],status:'active',joinedAt:'2026-10-07T08:00:00Z'});
  await repo.saveMembership({id:memberId,tenantId,groupId,userId:'user-borrower',roles:['member'],status:'active',joinedAt:'2026-10-07T08:00:00Z'});
  await repo.saveRubricDefinition({id:rubricId,tenantId,groupId,name:'Prêt',status:'ACTIVE',version:1,source:'GROUP_CUSTOM',
    facets:{direction:'OUTFLOW',custom:{systemKey:'LOAN'}},operatingModel:{},createdAt:'2026-10-07T08:00:00Z',updatedAt:'2026-10-07T08:00:00Z',
    policies:{loan:{allowed:true,rateBasisPointsPerPeriod:0,interestBase:'PRINCIPAL_ONLY',paymentPriority:'CAPITAL_FIRST',interestTiming:'NEXT_SESSION_DUE',noInterestOnInterest:true,fundingMode:'AVAILABLE_GROUP_CASH',carryForwardUnusedFunds:true}}});
  const handle=createApiHandler(repo);
  const api=async(path,method='GET',body)=>{
    const res=await handle(new Request('https://eco.invalid'+path,{method,headers:{'content-type':'application/json','x-tenant-id':tenantId,'x-actor-id':'manager-loan','x-group-roles':'manager','x-active-group-id':groupId},body:body===undefined?undefined:JSON.stringify(body)}));
    const data=await res.json();if(!res.ok)throw new Error('HTTP_'+res.status+':'+JSON.stringify(data));return data;
  };
  const createOpenLoan=async(label)=>{
    let loan=await api('/api/v1/groups/'+groupId+'/completion','POST',{kind:'LOAN',title:label,data:{principal:10000,currency:'XAF',borrowerMembershipId:memberId,rubricId,rateBasisPointsPerPeriod:0,paymentPriority:'CAPITAL_FIRST',interestTiming:'NEXT_SESSION_DUE',noInterestOnInterest:true,outstandingPrincipal:10000,unpaidInterest:2000}});
    for(const to of ['SUBMITTED','APPROVED','DISBURSED']){
      loan=await api('/api/v1/groups/'+groupId+'/completion/'+loan.id+'/transition','POST',{to,expectedVersion:Number(loan.data.completionVersion),patch:to==='DISBURSED'?{outstandingPrincipal:10000,unpaidInterest:2000,ledgerEntryId:'synthetic-disbursement-'+loan.id,disbursedAt:'2026-10-07T08:15:00Z'}:{}});
    }
    return loan;
  };
  const repay=async loan=>{
    const result=await api('/api/v1/groups/'+groupId+'/loans/'+loan.id+'/repay','POST',{paymentAmount:6000,expectedVersion:Number(loan.data.completionVersion),idempotencyKey:'repay-'+loan.id});
    return result.allocation;
  };
  const changePolicy=async(policy,scope,selectedLoanIds=[],control={})=>api('/api/v1/groups/'+groupId+'/rubrics/'+rubricId+'/policies','PUT',{
    loan:{...policy,allowed:true,interestBase:'PRINCIPAL_ONLY',noInterestOnInterest:true,changeControl:{commandId:String(control.commandId??('cmd-'+scope+'-'+selectedLoanIds.join('-')+'-'+String(policy.paymentPriority)+'-'+String(control.effectiveMode??'IMMEDIATE'))),scope,effectiveMode:String(control.effectiveMode??'IMMEDIATE'),selectedLoanIds,...control}}
  });
  return{repo,api,createOpenLoan,repay,changePolicy};
};

test('loan policy A, B-all and B-selected preserve each loan history and change only eligible open loans',async()=>{
  const x=await fixture();
  const [loan1,loan2,loan3,loan4,closedLoan]=await Promise.all(['P1','P2','P3','P4','P soldé'].map(x.createOpenLoan));
  const closed=await x.api('/api/v1/groups/'+groupId+'/completion/'+closedLoan.id+'/transition','POST',{to:'CLOSED',expectedVersion:Number(closedLoan.data.completionVersion),patch:{outstandingPrincipal:0,unpaidInterest:0,closedAt:'2026-10-07T08:30:00Z'}});
  assert.equal(String(closed.data.completionState),'CLOSED');
  let rubric=(await x.repo.getRubricDefinition(tenantId,groupId,rubricId));
  let policy=rubric.policies.loan;

  rubric=await x.changePolicy({...policy,paymentPriority:'INTEREST_FIRST'},'NEW_LOANS_ONLY');
  policy=rubric.policies.loan;
  const a=await x.repay(loan1);
  assert.equal(a.principalPaid,6000,'A leaves an already-open loan on its stored CAPITAL_FIRST rule');
  assert.equal(a.interestPaid,0);
  assert.equal(a.remainingPrincipal,4000);
  assert.equal(a.unpaidInterestAfter,2000);

  rubric=await x.changePolicy({...policy,paymentPriority:'INTEREST_FIRST'},'NEW_AND_ALL_OPEN_LOANS');
  policy=rubric.policies.loan;
  const allOpenRevision=policy.revisions.at(-1);
  assert.ok(allOpenRevision.affectedLoanIds.includes(loan2.id));
  assert.ok(!allOpenRevision.affectedLoanIds.includes(closedLoan.id),'loan already closed before the decision is excluded from B-all');
  const b=await x.repay(loan2);
  assert.equal(b.interestPaid,2000,'B-all applies the new priority to an eligible open loan');
  assert.equal(b.principalPaid,4000);
  assert.equal(b.remainingPrincipal,6000);
  assert.equal(b.unpaidInterestAfter,0);

  rubric=await x.changePolicy({...policy,paymentPriority:'CAPITAL_FIRST'},'NEW_AND_SELECTED_OPEN_LOANS',[loan3.id]);
  policy=rubric.policies.loan;
  const selected=await x.repay(loan3);
  const notSelected=await x.repay(loan4);
  assert.equal(selected.principalPaid,6000,'selected open loan receives the later CAPITAL_FIRST revision');
  assert.equal(selected.interestPaid,0);
  assert.equal(notSelected.principalPaid,4000,'non-selected open loan keeps the prior INTEREST_FIRST revision');
  assert.equal(notSelected.interestPaid,2000);

  const revisions=policy.revisions??[];
  assert.equal(revisions.length,3);
  assert.deepEqual(revisions.map(r=>r.scope),['NEW_LOANS_ONLY','NEW_AND_ALL_OPEN_LOANS','NEW_AND_SELECTED_OPEN_LOANS']);
  assert.equal(revisions[2].selectedLoanIds[0],loan3.id);
});

test('policy change command is idempotent and never duplicates a revision on retry',async()=>{
  const x=await fixture(),loan=await x.createOpenLoan('P-idempotent');
  const rubric=await x.repo.getRubricDefinition(tenantId,groupId,rubricId),policy=rubric.policies.loan;
  const body={loan:{...policy,paymentPriority:'INTEREST_FIRST',changeControl:{commandId:'stable-policy-command',scope:'NEW_AND_SELECTED_OPEN_LOANS',effectiveMode:'IMMEDIATE',selectedLoanIds:[loan.id]}}};
  const first=await x.api('/api/v1/groups/'+groupId+'/rubrics/'+rubricId+'/policies','PUT',body);
  const second=await x.api('/api/v1/groups/'+groupId+'/rubrics/'+rubricId+'/policies','PUT',body);
  assert.equal(first.policies.loan.revisions.length,1);
  assert.equal(second.policies.loan.revisions.length,1);
  assert.equal(second.policies.loan.revisions[0].id,first.policies.loan.revisions[0].id);
});

test('meeting-effective revision changes allocation only from the chosen canonical meeting onward',async()=>{
  const x=await fixture(),loan=await x.createOpenLoan('P séance');
  await x.repo.saveMeeting({id:'meeting-before',tenantId,groupId,status:'open',title:'Avant',session:1,scheduledAt:'2026-10-07T08:30:00Z',openedAt:'2026-10-07T08:30:00Z',openedBy:'manager-loan'});
  await x.repo.saveMeeting({id:'meeting-effect',tenantId,groupId,status:'open',title:'Effet',session:2,scheduledAt:'2026-10-08T08:30:00Z',openedAt:'2026-10-08T08:30:00Z',openedBy:'manager-loan'});
  let rubric=await x.repo.getRubricDefinition(tenantId,groupId,rubricId),policy=rubric.policies.loan;
  rubric=await x.changePolicy({...policy,paymentPriority:'INTEREST_FIRST'},'NEW_AND_SELECTED_OPEN_LOANS',[loan.id],{commandId:'meeting-effective',effectiveMode:'MEETING',effectiveMeetingId:'meeting-effect'});
  const revision=rubric.policies.loan.revisions.at(-1);
  assert.equal(revision.effectiveMeetingId,'meeting-effect');
  assert.equal(revision.effectiveAt,'2026-10-08T08:30:00.000Z');

  const before=await x.api('/api/v1/groups/'+groupId+'/loans/'+loan.id+'/repay','POST',{paymentAmount:1000,meetingId:'meeting-before',expectedVersion:Number(loan.data.completionVersion),idempotencyKey:'before-effect'});
  assert.equal(before.allocation.principalPaid,1000);
  assert.equal(before.allocation.interestPaid,0);

  const after=await x.api('/api/v1/groups/'+groupId+'/loans/'+loan.id+'/repay','POST',{paymentAmount:1000,meetingId:'meeting-effect',expectedVersion:Number(before.loan.data.completionVersion),idempotencyKey:'after-effect'});
  assert.equal(after.allocation.principalPaid,0);
  assert.equal(after.allocation.interestPaid,1000);
});

test('an upfront-interest timing change never rewrites a loan already disbursed',async()=>{
  const x=await fixture(),loan=await x.createOpenLoan('P timing');
  const rubric=await x.repo.getRubricDefinition(tenantId,groupId,rubricId),policy=rubric.policies.loan;
  await x.changePolicy({...policy,interestTiming:'UPFRONT_DEDUCTED'},'NEW_AND_SELECTED_OPEN_LOANS',[loan.id],{commandId:'no-retro-upfront'});
  const result=await x.api('/api/v1/groups/'+groupId+'/loans/'+loan.id+'/repay','POST',{paymentAmount:1000,expectedVersion:Number(loan.data.completionVersion),idempotencyKey:'timing-repay'});
  assert.equal(result.loan.data.interestTiming,'NEXT_SESSION_DUE');
});

