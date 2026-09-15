import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {
  CompletionSuiteService, buildLoanSchedule, compareRules, explainLedgerAnomalies,
  makeIcs, suggestTontineSchedule
} from '../.build/packages/completion/src/index.js';

const context=(actorId='owner')=>({
  tenantId:'tenant_a',actorId,activeGroupId:'group_a',groupRoles:actorId==='owner'?['founder','manager']:['member'],
  mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_'+actorId
});

async function setup(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();kernel.context.set(context());
  await repo.saveUser({id:'owner',displayName:'Owner',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveUser({id:'member_2',displayName:'Member Two',locale:'en',createdAt:new Date().toISOString()});
  await repo.saveGroup({id:'group_a',tenantId:'tenant_a',name:'Association A',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:new Date().toISOString()});
  await repo.saveMembership({id:'membership_owner',tenantId:'tenant_a',groupId:'group_a',userId:'owner',roles:['founder','manager'],status:'active',joinedAt:new Date().toISOString()});
  await repo.saveMembership({id:'membership_2',tenantId:'tenant_a',groupId:'group_a',userId:'member_2',roles:['member'],status:'active',joinedAt:new Date().toISOString()});
  await repo.saveRubricDefinition({id:'rubric_tontine',tenantId:'tenant_a',groupId:'group_a',name:'Notre tontine',aliases:[],facets:{direction:'MIXED',obligation:'CUSTOM',medium:'CASH',refundability:'CUSTOM',replenishment:'CUSTOM',interestMode:'CUSTOM',eligibilityMode:'RULE_BASED'},status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  return{repo,kernel,completion:new CompletionSuiteService(repo,kernel),ledger:new LedgerService(repo,kernel)};
}

test('deterministic scheduler respects pots per round and supports four shares over one, two or four rounds',()=>{
  const shares=['s1','s2','s3','s4'];
  const one=suggestTontineSchedule(shares,1,4);assert.deepEqual(one.assignments.map(x=>x.round),[1,1,1,1]);assert.equal(one.unassigned.length,0);
  const two=suggestTontineSchedule(shares,2,2);assert.deepEqual(two.assignments.map(x=>x.round),[1,1,2,2]);assert.equal(two.unassigned.length,0);
  const four=suggestTontineSchedule(shares,4,1);assert.deepEqual(four.assignments.map(x=>x.round),[1,2,3,4]);assert.equal(four.unassigned.length,0);
  const impossible=suggestTontineSchedule(shares,1,1);assert.equal(impossible.unassigned.length,3);assert.ok(impossible.warnings.includes('CAPACITY_INSUFFICIENT'));
});

test('tontine share may be served once and the benefit uses the canonical ledger',async()=>{
  const {completion,ledger}=await setup();
  const cycle=await completion.createTontineCycle('group_a',{rubricId:'rubric_tontine',name:'Cycle 2026',rounds:2,potsPerRound:2,nominalPotAmount:40000});
  const share=await completion.addTontineShare('group_a',{cycleId:cycle.id,membershipId:'membership_owner',label:'Nom 1'});
  const scheduled=await completion.scheduleTontineShare('group_a',share.id,1,1);
  await assert.rejects(()=>completion.markTontineShareServed('group_a',share.id,'missing-ledger-entry',2),/TONTINE_BENEFIT_LEDGER_PROOF_INVALID/);
  await ledger.recordCashContribution({tenantId:'tenant_a',groupId:'group_a',membershipId:'membership_owner',amount:40000,idempotencyKey:'seed-tontine'});
  const benefit=await ledger.recordCashMovement({tenantId:'tenant_a',groupId:'group_a',amount:40000,direction:'out',counterAccountCode:'MEMBER_FUNDS_LIABILITY',counterAccountType:'liability',descriptionCode:'LEDGER_TONTINE_BENEFIT',sourceType:'tontine_share',sourceId:share.id,idempotencyKey:'benefit-1',kind:'tontine_benefit'});
  const served=await completion.markTontineShareServed('group_a',share.id,benefit.id,2);
  assert.equal(served.data.completionState,'SERVED');
  await assert.rejects(()=>completion.markTontineShareServed('group_a',share.id,benefit.id,3),/INVALID_COMPLETION_TRANSITION/);
  const summary=await ledger.summary('tenant_a','group_a');assert.equal(summary.cashBalance,0);assert.equal(summary.memberFundsLiability,0);
});

test('loan schedule separates principal, interest and fees and loan cash movements remain balanced',async()=>{
  const {completion,ledger}=await setup();
  const schedule=buildLoanSchedule({principal:120000,installments:12,annualRateBasisPoints:1200,feesTotal:1200,method:'DECLINING'});
  assert.equal(schedule.reduce((n,x)=>n+x.principal,0),120000);
  assert.equal(schedule.reduce((n,x)=>n+x.fees,0),1200);
  assert.equal(schedule.at(-1).remainingPrincipal,0);
  await ledger.recordCashContribution({tenantId:'tenant_a',groupId:'group_a',membershipId:'membership_owner',amount:200000,idempotencyKey:'seed-loan'});
  let loan=await completion.create('group_a','LOAN',{title:'Loan A',data:{principal:120000,currency:'XAF',borrowerMembershipId:'membership_2',schedule:JSON.stringify(schedule)}});
  loan=await completion.transition('group_a',loan.id,'SUBMITTED',{expectedVersion:1});
  loan=await completion.transition('group_a',loan.id,'APPROVED',{expectedVersion:2});
  const out=await ledger.recordCashMovement({tenantId:'tenant_a',groupId:'group_a',amount:120000,direction:'out',counterAccountCode:'LOAN_RECEIVABLE',counterAccountType:'asset',descriptionCode:'LEDGER_LOAN_DISBURSEMENT',sourceType:'loan',sourceId:loan.id,idempotencyKey:'loan-out',kind:'loan_disbursement'});
  loan=await completion.transition('group_a',loan.id,'DISBURSED',{expectedVersion:3,patch:{ledgerEntryId:out.id,outstandingPrincipal:120000}});
  const repayment=await ledger.recordCashMovement({tenantId:'tenant_a',groupId:'group_a',amount:20000,direction:'in',counterAccountCode:'LOAN_RECEIVABLE',counterAccountType:'asset',descriptionCode:'LEDGER_LOAN_REPAYMENT',sourceType:'loan_repayment',sourceId:loan.id,idempotencyKey:'loan-in-1',kind:'loan_repayment'});
  loan=await completion.transition('group_a',loan.id,'REPAYING',{expectedVersion:4,patch:{outstandingPrincipal:100000,lastRepaymentLedgerEntryId:repayment.id}});
  assert.equal(loan.data.outstandingPrincipal,100000);
  const entries=await ledger.repo.listLedgerEntries('tenant_a','group_a');assert.deepEqual(explainLedgerAnomalies(entries),[]);
});

test('governance approval is independent, versioned and reaches quorum without trusting supplied approver IDs',async()=>{
  const {completion,kernel}=await setup();
  let decision=await completion.createGovernanceDecision('group_a',{title:'Approve rule',subject:'Rule v2',threshold:2});
  decision=await completion.transition('group_a',decision.id,'OPEN',{expectedVersion:1});
  kernel.context.set(context('member_2'));
  decision=await completion.approveDecision('group_a',decision.id,2);
  assert.equal(decision.data.approvalCount,1);assert.equal(decision.data.completionState,'OPEN');
  await assert.rejects(()=>completion.approveDecision('group_a',decision.id,2),/COMPLETION_VERSION_CONFLICT|DUPLICATE_APPROVAL/);
  kernel.context.set(context('owner'));
  decision=await completion.approveDecision('group_a',decision.id,3);
  assert.equal(decision.data.completionState,'APPROVED');assert.equal(decision.data.approvalCount,2);
});

test('historical identity claim keeps evidence and does not silently transfer a membership',async()=>{
  const {completion,repo}=await setup();
  let claim=await completion.createHistoricalIdentityClaim('group_a',{historicalReference:'sheet-2022-row-14',evidenceReference:'signed-card-14',claimedMembershipId:'membership_2'});
  claim=await completion.transition('group_a',claim.id,'UNDER_REVIEW',{expectedVersion:1});
  claim=await completion.transition('group_a',claim.id,'APPROVED',{expectedVersion:2,patch:{reviewNote:'matched by two proofs'}});
  assert.equal(claim.data.completionState,'APPROVED');
  assert.equal((await repo.getMembership('tenant_a','group_a','membership_2')).userId,'member_2');
});

test('completion records reject stale versions and cross-tenant access',async()=>{
  const {completion,kernel}=await setup();
  const record=await completion.create('group_a','SCENARIO',{title:'Scenario 1',data:{memberCount:20}});
  await completion.transition('group_a',record.id,'COMPARED',{expectedVersion:1});
  await assert.rejects(()=>completion.transition('group_a',record.id,'ARCHIVED',{expectedVersion:1}),/COMPLETION_VERSION_CONFLICT/);
  kernel.context.set({...context('intruder'),tenantId:'tenant_b'});
  await assert.rejects(()=>completion.list('group_a'),/GROUP_NOT_FOUND|FORBIDDEN_SCOPE/);
});

test('rule comparison and personal calendar output are deterministic and data-safe',()=>{
  const diff=compareRules({amount:10000,frequency:'monthly'},{amount:12000,frequency:'monthly',graceDays:2});
  assert.deepEqual(diff.map(x=>x.field),['amount','graceDays']);
  const ics=makeIcs([{uid:'meeting-1',title:'Séance A, Yaoundé',start:'2026-09-20T09:00:00+01:00'}]);
  assert.match(ics,/BEGIN:VCALENDAR/);assert.match(ics,/UID:meeting-1/);assert.match(ics,/Séance A\\, Yaoundé/);
});

test('readiness passport explains blockers instead of returning an opaque score',async()=>{
  const {completion}=await setup();
  const passport=await completion.readinessPassport('group_a');
  assert.equal(passport.data.ready,true);assert.equal(passport.data.activeRubrics,1);assert.equal(passport.data.activeMembers,2);
  assert.deepEqual(JSON.parse(passport.data.blockers),[]);
});
