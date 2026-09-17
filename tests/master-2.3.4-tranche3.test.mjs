import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

const founder={'content-type':'application/json','x-tenant-id':'tenant_t3','x-actor-id':'founder_t3','x-group-roles':'founder,manager'};
const member={'content-type':'application/json','x-tenant-id':'tenant_t3','x-actor-id':'member_t3','x-group-roles':'member'};

async function seed(){
  const repo=new InMemoryPlatformRepository();
  await repo.saveUser({id:'founder_t3',displayName:'Responsable Exemple',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveUser({id:'member_t3',displayName:'Membre Test',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveGroup({id:'group_t3',tenantId:'tenant_t3',name:'Association Opérations',kind:'association',governanceModel:'community',status:'active',createdBy:'founder_t3',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'mf_t3',tenantId:'tenant_t3',groupId:'group_t3',userId:'founder_t3',roles:['founder','manager'],status:'active',joinedAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'mm_t3',tenantId:'tenant_t3',groupId:'group_t3',userId:'member_t3',roles:['member'],status:'active',joinedAt:'2026-01-01T00:00:00Z'});
  await repo.saveMeeting({id:'meeting_t3',tenantId:'tenant_t3',groupId:'group_t3',title:'Janvier',status:'open',openedBy:'founder_t3',openedAt:'2026-01-10T10:00:00Z',scheduledAt:'2026-01-10T10:00:00Z'});
  const base={tenantId:'tenant_t3',groupId:'group_t3',aliases:[],facets:{direction:'INFLOW',obligation:'OPTIONAL',medium:'CASH',refundability:'FULLY_REFUNDABLE',replenishment:'NONE',interestMode:'NONE',eligibilityMode:'ALL_MEMBERS'},status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
  await repo.saveRubricDefinition({...base,id:'rubric_savings',name:'Épargne',activityPlan:{key:'savings',name:'Épargne',kind:'SAVINGS',nominalAmount:{currency:'XAF',amount:0},amountBasis:'PER_MEMBER',participationMode:'OPTIONAL',contributionMode:'MONEY',memberCount:2,sessions:12,duration:{value:12,unit:'MONTHS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}});
  await repo.saveRubricDefinition({...base,id:'rubric_fine',name:'Amendes',facets:{...base.facets,refundability:'NON_REFUNDABLE'}});
  return{repo,handler:createApiHandler(repo)};
}

test('member operational sheet reuses canonical receipt truth and exposes same exercise matrix to self',async()=>{
  const {handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/contributions/cash',{method:'POST',headers:founder,body:JSON.stringify({membershipId:'mm_t3',amount:1000,currency:'XAF',meetingId:'meeting_t3',rubricId:'rubric_savings',idempotencyKey:'t3-save-1'})}));
  assert.equal(r.status,201);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/members/mm_t3/operational-sheet',{headers:member}));
  assert.equal(r.status,200);const sheet=await r.json();
  assert.equal(sheet.membership.id,'mm_t3');
  assert.equal(sheet.statement.totalNetContributions,1000);
  assert.equal(sheet.exerciseMatrix[0].cells.rubric_savings.inflow,1000);
  assert.equal(sheet.exerciseMatrix[0].cells.rubric_savings.net,1000);
  assert.equal(sheet.notices.length,1);
  assert.match(sheet.notices[0].authorColor,/^#/);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/members/mf_t3/operational-sheet',{headers:member}));
  assert.equal(r.status,403);
});

test('global recap supports selectable positive negative and manual columns without changing ledger truth',async()=>{
  const {handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/contributions/cash',{method:'POST',headers:founder,body:JSON.stringify({membershipId:'mm_t3',amount:1000,currency:'XAF',meetingId:'meeting_t3',rubricId:'rubric_savings',idempotencyKey:'t3-recap-1'})}));
  assert.equal(r.status,201);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/recap/layout',{method:'PUT',headers:founder,body:JSON.stringify({expectedVersion:0,columns:[{id:'savings',label:'Épargne',polarity:'POSITIVE',sourceRubricId:'rubric_savings'},{id:'manual_debt',label:'Ajustement négatif',polarity:'NEGATIVE',manualOnly:true}]})}));
  assert.equal(r.status,200);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/recap/overrides',{method:'PUT',headers:founder,body:JSON.stringify({membershipId:'mm_t3',columnId:'manual_debt',amount:200,reason:'Décision bureau testée et tracée'})}));
  assert.equal(r.status,200);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/recap/global',{headers:founder}));
  assert.equal(r.status,200);const recap=await r.json();const row=recap.rows.find(x=>x.membershipId==='mm_t3');
  assert.equal(row.cells.savings.automaticAmount,1000);
  assert.equal(row.cells.manual_debt.manualOverride,200);
  assert.equal(row.positiveTotal,1000);assert.equal(row.negativeTotal,200);assert.equal(row.total,800);
  assert.equal(recap.ledgerSummary.memberFundsLiability,1000);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/recap/global',{headers:member}));
  assert.equal(r.status,403);
});

test('loan simulator applies founder monthly rule with no interest on interest',async()=>{
  const {handler}=await seed();
  const r=await handler(new Request('http://local/api/v1/groups/group_t3/loans/simulate',{method:'POST',headers:member,body:JSON.stringify({principal:50000,periods:3,ratePercentPerPeriod:5,priority:'CAPITAL_FIRST',payments:[0,30000,20000]})}));
  assert.equal(r.status,200);const body=await r.json();assert.equal(body.noInterestOnInterest,true);
  assert.equal(body.rows[0].interestNew,2500);assert.equal(body.rows[0].totalDebtAfter,52500);
  assert.equal(body.rows[1].principalAfter,20000);assert.equal(body.rows[1].interestAfter,5000);assert.equal(body.rows[1].totalDebtAfter,25000);
  assert.equal(body.rows[2].interestNew,1000);assert.equal(body.rows[2].principalAfter,0);assert.equal(body.rows[2].interestAfter,6000);assert.equal(body.rows[2].totalDebtAfter,6000);
});


test('savings source data reads member deposits and realized interest from canonical records',async()=>{
  const {repo,handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/contributions/cash',{method:'POST',headers:founder,body:JSON.stringify({membershipId:'mm_t3',amount:12000,currency:'XAF',meetingId:'meeting_t3',rubricId:'rubric_savings',idempotencyKey:'t3-source-save'})}));
  assert.equal(r.status,201);
  await repo.saveLedgerAccount({id:'acct_interest_t3',tenantId:'tenant_t3',groupId:'group_t3',code:'LOAN_INTEREST_INCOME',nameCode:'LOAN_INTEREST_INCOME',type:'income',currency:'XAF',createdAt:'2026-01-10T10:00:00Z'});
  await repo.saveLedgerAccount({id:'acct_cash_interest_t3',tenantId:'tenant_t3',groupId:'group_t3',code:'CASH_INTEREST_TEST',nameCode:'CASH_INTEREST_TEST',type:'asset',currency:'XAF',createdAt:'2026-01-10T10:00:00Z'});
  await repo.saveLedgerEntry({id:'ledger_interest_t3',tenantId:'tenant_t3',groupId:'group_t3',currency:'XAF',descriptionCode:'LEDGER_LOAN_REPAYMENT',sourceType:'loan_repayment',sourceId:'loan_t3',idempotencyKey:'interest-source-t3',createdAt:'2026-01-10T10:01:00Z',createdBy:'founder_t3',meetingId:'meeting_t3',lines:[{accountId:'acct_cash_interest_t3',debit:2500,credit:0},{accountId:'acct_interest_t3',debit:0,credit:2500}]});
  r=await handler(new Request('http://local/api/v1/groups/group_t3/savings-yield/source-data',{headers:founder}));
  assert.equal(r.status,200);const source=await r.json();
  assert.equal(source.source,'CANONICAL_LEDGER_AND_RECEIPTS');
  assert.equal(source.totals.classicPrincipal,12000);
  assert.equal(source.totals.recoveredInterest,2500);
  assert.equal(source.deposits[0].memberId,'mm_t3');
  assert.equal(source.deposits[0].periodKey,'JAN');
});

test('fine grids and loan sanctions are governed rubric policies',async()=>{
  const {handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/rubrics/rubric_fine/policies',{method:'PUT',headers:founder,body:JSON.stringify({fine:{rules:[{key:'late_lt_30',label:'Retard moins de 30 min',amount:500,currency:'XAF'},{key:'absence',label:'Absence non justifiée',amount:2000,currency:'XAF'}],reviewStatus:'VALIDATED',definitionSource:'MANUAL'}})}));
  assert.equal(r.status,200);let rubric=await r.json();assert.equal(rubric.policies.fine.rules.length,2);
  await assert.doesNotReject(async()=>{r=await handler(new Request('http://local/api/v1/groups/group_t3/rubrics/rubric_fine/policies',{method:'PUT',headers:founder,body:JSON.stringify({loan:{allowed:true,rateBasisPointsPerPeriod:500,interestBase:'PRINCIPAL_ONLY',paymentPriority:'CAPITAL_FIRST',noInterestOnInterest:true,overdue:{maxDurationPeriods:3,penaltyRateBasisPointsPerPeriod:1000,blockNewLoanUntilSettled:true,blockNextExercise:true,recoverFrom:['TONTINE','GUARANTOR']},specialLoans:[{key:'urgent',label:'Prêt urgence',rateBasisPointsPerPeriod:300,maxDurationPeriods:1,paymentPriority:'CAPITAL_FIRST'}]}})}));assert.equal(r.status,200);});
});
