import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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


test('twenty project rubrics survive conversion and are visible on the member operational sheet',async()=>{
  const repo=new InMemoryPlatformRepository();
  await repo.saveUser({id:'founder_20',displayName:'Responsable 20',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  const handler=createApiHandler(repo);
  const h={'content-type':'application/json','x-tenant-id':'tenant_20','x-actor-id':'founder_20','x-group-roles':'founder,manager'};
  const historical=[
    ['aide_locale','AIDE LOCALE','ASSISTANCE'],['secours','SECOURS','SOLIDARITY'],['epargne','EPARGNE','SAVINGS'],['epargne_scolaire','EPARGNE SCOLAIRE','SAVINGS'],
    ['remboursement','REMBOURSEMENT','REPAYMENT'],['remb_interets','REMBOUR INTERETS','REPAYMENT'],['tontine_10000','TONTINE 10000F','TONTINE'],['tontine_25000','TONTINE 25000F','TONTINE'],
    ['main_levee_espece','MAIN LEVEE ESPECE','LEVY'],['autres','AUTRES','OTHER'],['huile_savon','HUILLE ET SAVON','TONTINE'],['main_levee_nature','MAIN LEVEE NATURE','LEVY'],
    ['prets','PRETS','LOAN'],['special_pret','SPECIAL PRET','LOAN'],['special_remb','SPECIAL REMBOURSEMENT','REPAYMENT'],['inscription','INSCRIPTION','CONTRIBUTION'],
    ['amendes','AMENDES','CONTRIBUTION'],['timbre','TIMBRE DE PRET','CONTRIBUTION'],['collation','COLLATION','CONTRIBUTION'],['transport','TRANSPORT','TRANSPORT']
  ];
  const rubrics=historical.map(([key,name,kind])=>({key,name,kind,nominalAmount:{currency:'XAF',amount:kind==='TONTINE'?10000:1000},amountBasis:kind==='TONTINE'?'PER_SHARE':'PER_MEMBER',participationMode:'OPTIONAL',contributionMode:'MONEY',memberCount:20,shareCount:kind==='TONTINE'?20:undefined,potCount:kind==='TONTINE'?2:undefined,sessions:12,duration:{value:12,unit:'MONTHS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}));
  let r=await handler(new Request('http://local/api/v1/group-projects',{method:'POST',headers:h,body:JSON.stringify({name:'Groupe 20 rubriques',kind:'association',governanceModel:'community',rubrics,launchProfile:{origin:{mode:'NEW'}}})}));
  assert.equal(r.status,201);const project=await r.json();
  r=await handler(new Request('http://local/api/v1/group-projects/'+project.id+'/simulate',{method:'POST',headers:h,body:'{}'}));assert.equal(r.status,200);
  r=await handler(new Request('http://local/api/v1/group-projects/'+project.id+'/convert',{method:'POST',headers:h,body:'{}'}));assert.equal(r.status,201);const group=await r.json();
  let defs=await repo.listRubricDefinitions('tenant_20',group.id);assert.equal(defs.length,20);assert.ok(defs.every(x=>x.status==='ACTIVE'));
  await repo.saveUser({id:'member_20',displayName:'Membre 20',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'membership_20',tenantId:'tenant_20',groupId:group.id,userId:'member_20',roles:['member'],status:'active',joinedAt:'2026-01-02T00:00:00Z'});
  await repo.saveMeeting({id:'meeting_20',tenantId:'tenant_20',groupId:group.id,title:'Janvier',status:'open',openedBy:'founder_20',openedAt:'2026-01-10T10:00:00Z'});
  const mh={'content-type':'application/json','x-tenant-id':'tenant_20','x-actor-id':'member_20','x-group-roles':'member'};
  r=await handler(new Request('http://local/api/v1/groups/'+group.id+'/rubrics',{headers:mh}));assert.equal(r.status,200);defs=await r.json();assert.equal(defs.length,20);
  r=await handler(new Request('http://local/api/v1/groups/'+group.id+'/members/membership_20/operational-sheet',{headers:mh}));assert.equal(r.status,200);const sheet=await r.json();
  assert.equal(sheet.rubrics.length,20);assert.equal(Object.keys(sheet.exerciseMatrix[0].cells).length,20);
  for(const name of historical.map(x=>x[1]))assert.ok(sheet.rubrics.some(x=>x.name===name),name+' must remain on the individual sheet');
});

test('partial principal then interest repayment in one meeting accrues interest only once and projects both rubric cells',async()=>{
  const {repo,handler}=await seed();
  const base={tenantId:'tenant_t3',groupId:'group_t3',aliases:[],facets:{direction:'INFLOW',obligation:'OPTIONAL',medium:'CASH',refundability:'NON_REFUNDABLE',replenishment:'NONE',interestMode:'NONE',eligibilityMode:'ALL_MEMBERS'},status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
  await repo.saveRubricDefinition({...base,id:'rubric_repay_principal',name:'REMBOURSEMENT',activityPlan:{key:'rep_principal',name:'REMBOURSEMENT',kind:'REPAYMENT',nominalAmount:{currency:'XAF',amount:0},amountBasis:'PER_MEMBER',memberCount:2,sessions:12,duration:{value:12,unit:'MONTHS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}});
  await repo.saveRubricDefinition({...base,id:'rubric_repay_interest',name:'REMBOUR INTERETS',activityPlan:{key:'rep_interest',name:'REMBOUR INTERETS',kind:'REPAYMENT',nominalAmount:{currency:'XAF',amount:0},amountBasis:'PER_MEMBER',memberCount:2,sessions:12,duration:{value:12,unit:'MONTHS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}});
  await repo.saveWorkspaceRecord({id:'loan_sheet_t3',tenantId:'tenant_t3',groupId:'group_t3',moduleId:'FINANCE.LOANS',title:'Prêt test',status:'ACTIVE',tags:['completion','kind:LOAN','state:DISBURSED'],data:{completionKind:'LOAN',completionState:'DISBURSED',completionVersion:4,borrowerMembershipId:'mm_t3',principal:50000,outstandingPrincipal:50000,unpaidInterest:0,rateBasisPointsPerPeriod:500,paymentPriority:'CAPITAL_FIRST',ledgerEntryId:'ledger_disbursement_evidence',currency:'XAF',accruedMeetingIdsJson:'[]'},createdBy:'founder_t3',createdAt:'2026-01-10T09:00:00Z',updatedAt:'2026-01-10T09:00:00Z'});
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/loans/loan_sheet_t3/repay',{method:'POST',headers:founder,body:JSON.stringify({principalAmount:10000,interestAmount:0,rateBasisPointsPerPeriod:500,meetingId:'meeting_t3',rubricId:'rubric_repay_principal',expectedVersion:4,idempotencyKey:'rep-principal-t3'})}));
  assert.equal(r.status,201);let body=await r.json();assert.equal(body.allocation.interestAccrued,2500);assert.equal(body.allocation.remainingPrincipal,40000);assert.equal(body.allocation.unpaidInterestAfter,2500);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/loans/loan_sheet_t3/repay',{method:'POST',headers:founder,body:JSON.stringify({principalAmount:0,interestAmount:2500,rateBasisPointsPerPeriod:500,meetingId:'meeting_t3',rubricId:'rubric_repay_interest',expectedVersion:5,idempotencyKey:'rep-interest-t3'})}));
  assert.equal(r.status,201);body=await r.json();assert.equal(body.allocation.interestAccrued,0);assert.equal(body.allocation.remainingPrincipal,40000);assert.equal(body.allocation.unpaidInterestAfter,0);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/members/mm_t3/operational-sheet',{headers:member}));assert.equal(r.status,200);const sheet=await r.json(),row=sheet.exerciseMatrix.find(x=>x.meetingId==='meeting_t3');
  assert.equal(row.cells.rubric_repay_principal.inflow,10000);assert.equal(row.cells.rubric_repay_interest.inflow,2500);
  const events=(await repo.listWorkspaceRecords('tenant_t3','FINANCE.SHEET_EVENT','group_t3'));assert.equal(events.length,2);
});

test('loan simulator supports a flexible 9-period circuit matrix without interest on interest',async()=>{
  const {handler}=await seed();
  const r=await handler(new Request('http://local/api/v1/groups/group_t3/loans/simulate',{method:'POST',headers:member,body:JSON.stringify({principal:50000,periods:9,ratePercentPerPeriod:5,priority:'CAPITAL_FIRST',payments:[0,30000,20000,0,0,0,0,0,0]})}));
  assert.equal(r.status,200);const body=await r.json();assert.equal(body.rows.length,9);assert.equal(body.noInterestOnInterest,true);
  assert.deepEqual(Object.keys(body.rows[0]).sort(),['interestAfter','interestNew','interestOpening','interestPaid','nextInterestProjected','nextTaxablePrincipal','nextTotalDueProjected','payment','period','principalAfter','principalBefore','principalPaid','totalDebtAfter','unappliedPayment'].sort());
  assert.equal(body.summary.originalPrincipal,50000);assert.equal(body.summary.periodsSimulated,9);
});


test('simple member loan completion list and history stay scoped to own borrower identity',async()=>{
  const {repo,handler}=await seed();
  await repo.saveUser({id:'other_t3',displayName:'Autre Membre',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'mo_t3',tenantId:'tenant_t3',groupId:'group_t3',userId:'other_t3',roles:['member'],status:'active',joinedAt:'2026-01-01T00:00:00Z'});
  const base={tenantId:'tenant_t3',groupId:'group_t3',moduleId:'FINANCE.LOANS',status:'ACTIVE',tags:['completion','kind:LOAN','state:DISBURSED'],createdBy:'founder_t3',createdAt:'2026-01-10T09:00:00Z',updatedAt:'2026-01-10T09:00:00Z'};
  await repo.saveWorkspaceRecord({...base,id:'loan_own_t3',title:'Prêt du membre',data:{completionKind:'LOAN',completionState:'DISBURSED',completionVersion:4,borrowerMembershipId:'mm_t3',principal:10000,outstandingPrincipal:10000,unpaidInterest:0,rateBasisPointsPerPeriod:500,paymentPriority:'CAPITAL_FIRST',ledgerEntryId:'ledger_own'}});
  await repo.saveWorkspaceRecord({...base,id:'loan_other_t3',title:'Prêt autre membre',data:{completionKind:'LOAN',completionState:'DISBURSED',completionVersion:4,borrowerMembershipId:'mo_t3',principal:90000,outstandingPrincipal:90000,unpaidInterest:0,rateBasisPointsPerPeriod:500,paymentPriority:'CAPITAL_FIRST',ledgerEntryId:'ledger_other'}});
  await repo.saveWorkspaceRecord({id:'sheet_event_own_t3',tenantId:'tenant_t3',groupId:'group_t3',moduleId:'FINANCE.SHEET_EVENT',title:'Prêt décaissé',status:'DONE',tags:['sheet-event','loan-disbursement'],data:{membershipId:'mm_t3',meetingId:'meeting_t3',rubricId:'rubric_fine',loanId:'loan_own_t3',ledgerEntryId:'ledger_own',amount:10000,direction:'OUT'},createdBy:'founder_t3',createdAt:'2026-01-10T09:00:00Z',updatedAt:'2026-01-10T09:00:00Z'});
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/completion?kind=LOAN',{headers:member}));assert.equal(r.status,200);let loans=await r.json();assert.equal(loans.length,1);assert.equal(loans[0].id,'loan_own_t3');
  r=await handler(new Request('http://local/api/v1/groups/group_t3/loans/loan_own_t3/history',{headers:member}));assert.equal(r.status,200);let history=await r.json();assert.equal(history.events.length,1);assert.equal(history.events[0].amount,10000);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/loans/loan_other_t3/history',{headers:member}));assert.notEqual(r.status,200);
});

test('web shell locks the two-sheet UX contract and does not auto-inject the three starter rubrics',()=>{
  const voice=fs.readFileSync('apps/web/src/voice-entry-ui.ts','utf8');
  const misc=fs.readFileSync('apps/web/src/misc-rubrics-ui.js','utf8');
  const gov=fs.readFileSync('apps/web/src/master-governance-ui.ts','utf8');
  const html=fs.readFileSync('apps/web/index.html','utf8');
  assert.match(voice,/postLoanFromSheet/);assert.match(voice,/x\.status!=='ARCHIVED'/);assert.match(voice,/FINANCE\.SHEET_EVENT/);
  assert.doesNotMatch(misc,/await app\.ensureMiscRubricStarters\(\)/);
  assert.match(html,/Votre feuille de séance/);assert.match(html,/Vos fiches individuelles/);assert.match(html,/Utilisez les deux feuilles/);
  assert.match(gov,/id="mgLoanPeriods" type="number" min="1" max="120" value="9"/);
  assert.match(gov,/Capital remboursé/);assert.match(gov,/Intérêt payé/);assert.match(gov,/Intérêt restant dû/);assert.match(gov,/Total mensuel restant dû pour séance suivante/);assert.match(gov,/Comparer les 2 systèmes/);
});


test('founder exact 50,000 XAF example differentiates capital-first and interest-first through month four',async()=>{
  const {handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/loans/simulate',{method:'POST',headers:member,body:JSON.stringify({principal:50000,periods:4,ratePercentPerPeriod:5,priority:'CAPITAL_FIRST',payments:[0,30000,20000,6000]})}));
  assert.equal(r.status,200);let x=await r.json();
  assert.equal(x.rows[0].interestNew,2500);assert.equal(x.rows[0].totalDebtAfter,52500);
  assert.equal(x.rows[1].principalPaid,30000);assert.equal(x.rows[1].principalAfter,20000);assert.equal(x.rows[1].interestAfter,5000);assert.equal(x.rows[1].totalDebtAfter,25000);
  assert.equal(x.rows[2].interestNew,1000);assert.equal(x.rows[2].principalPaid,20000);assert.equal(x.rows[2].principalAfter,0);assert.equal(x.rows[2].interestAfter,6000);assert.equal(x.rows[2].nextInterestProjected,0);assert.equal(x.rows[2].nextTotalDueProjected,6000);
  assert.equal(x.rows[3].principalAfter,0);assert.equal(x.rows[3].interestAfter,0);assert.equal(x.rows[3].totalDebtAfter,0);

  r=await handler(new Request('http://local/api/v1/groups/group_t3/loans/simulate',{method:'POST',headers:member,body:JSON.stringify({principal:50000,periods:4,ratePercentPerPeriod:5,priority:'INTEREST_FIRST',payments:[0,30000,20000,6563]})}));
  assert.equal(r.status,200);x=await r.json();
  assert.equal(x.rows[1].interestPaid,5000);assert.equal(x.rows[1].principalPaid,25000);assert.equal(x.rows[1].principalAfter,25000);assert.equal(x.rows[1].interestAfter,0);
  assert.equal(x.rows[2].interestNew,1250);assert.equal(x.rows[2].interestPaid,1250);assert.equal(x.rows[2].principalPaid,18750);assert.equal(x.rows[2].principalAfter,6250);assert.equal(x.rows[2].interestAfter,0);
  assert.equal(x.rows[2].nextInterestProjected,313);assert.equal(x.rows[2].nextTotalDueProjected,6563);
  assert.equal(x.rows[3].interestNew,313);assert.equal(x.rows[3].interestPaid,313);assert.equal(x.rows[3].principalPaid,6250);assert.equal(x.rows[3].principalAfter,0);assert.equal(x.rows[3].interestAfter,0);assert.equal(x.rows[3].totalDebtAfter,0);
});

test('rubric count is group-defined: one rubric and forty rubrics both convert without a twenty-rubric rule',async()=>{
  for(const count of [1,40]){
    const repo=new InMemoryPlatformRepository(),founderId='founder_count_'+count,tenant='tenant_count_'+count;
    await repo.saveUser({id:founderId,displayName:'Responsable '+count,locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
    const handler=createApiHandler(repo),h={'content-type':'application/json','x-tenant-id':tenant,'x-actor-id':founderId,'x-group-roles':'founder,manager'};
    const rubrics=Array.from({length:count},(_,i)=>({key:'rubric_'+(i+1),name:'Rubrique '+(i+1),kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:1000},amountBasis:'PER_MEMBER',participationMode:'OPTIONAL',contributionMode:'MONEY',memberCount:5,sessions:12,duration:{value:12,unit:'MONTHS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}));
    let r=await handler(new Request('http://local/api/v1/group-projects',{method:'POST',headers:h,body:JSON.stringify({name:'Groupe '+count+' rubriques',kind:'association',governanceModel:'community',rubrics,launchProfile:{origin:{mode:'NEW'}}})}));
    assert.equal(r.status,201);const project=await r.json();
    r=await handler(new Request('http://local/api/v1/group-projects/'+project.id+'/convert',{method:'POST',headers:h,body:'{}'}));assert.equal(r.status,201);const group=await r.json();
    const defs=await repo.listRubricDefinitions(tenant,group.id);assert.equal(defs.length,count);assert.ok(defs.every(x=>x.status==='ACTIVE'));
  }
});


test('closing a monthly meeting accrues interest once on remaining principal even without payment',async()=>{
  const {repo,handler}=await seed();
  await repo.saveWorkspaceRecord({id:'loan_close_t3',tenantId:'tenant_t3',groupId:'group_t3',moduleId:'FINANCE.LOANS',title:'Prêt 50 000',status:'ACTIVE',tags:['completion','kind:LOAN','state:DISBURSED'],data:{completionKind:'LOAN',completionState:'DISBURSED',completionVersion:4,borrowerMembershipId:'mm_t3',principal:50000,outstandingPrincipal:50000,unpaidInterest:0,rateBasisPointsPerPeriod:500,paymentPriority:'CAPITAL_FIRST',ledgerEntryId:'ledger_disbursement_close',currency:'XAF',accruedMeetingIdsJson:'[]'},createdBy:'founder_t3',createdAt:'2026-01-10T09:00:00Z',updatedAt:'2026-01-10T09:00:00Z'});
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/meetings/meeting_t3/close',{method:'POST',headers:founder,body:'{}'}));assert.equal(r.status,200);
  let loan=await repo.getWorkspaceRecord('tenant_t3','loan_close_t3');assert.equal(Number(loan.data.unpaidInterest),2500);assert.equal(Number(loan.data.outstandingPrincipal),50000);
  assert.deepEqual(JSON.parse(String(loan.data.accruedMeetingIdsJson)),['meeting_t3']);
  let periods=await repo.listWorkspaceRecords('tenant_t3','FINANCE.LOAN_PERIOD','group_t3');assert.equal(periods.length,1);assert.equal(Number(periods[0].data.interestNew),2500);assert.equal(Number(periods[0].data.nextTotalDueProjected),55000);
  r=await handler(new Request('http://local/api/v1/groups/group_t3/meetings/meeting_t3/close',{method:'POST',headers:founder,body:'{}'}));assert.equal(r.status,200);
  loan=await repo.getWorkspaceRecord('tenant_t3','loan_close_t3');assert.equal(Number(loan.data.unpaidInterest),2500);periods=await repo.listWorkspaceRecords('tenant_t3','FINANCE.LOAN_PERIOD','group_t3');assert.equal(periods.length,1);
});

test('group policy may block a new loan until both prior principal and interest are settled',async()=>{
  const {repo,handler}=await seed();
  const base={tenantId:'tenant_t3',groupId:'group_t3',aliases:[],facets:{direction:'OUTFLOW',obligation:'OPTIONAL',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'RATE',eligibilityMode:'RULE_BASED'},status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
  await repo.saveRubricDefinition({...base,id:'rubric_loan_policy',name:'PRETS',activityPlan:{key:'prets',name:'PRETS',kind:'LOAN',nominalAmount:{currency:'XAF',amount:0},amountBasis:'PER_MEMBER',memberCount:2,sessions:12,duration:{value:12,unit:'MONTHS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0},policies:{loan:{allowed:true,rateBasisPointsPerPeriod:500,interestBase:'PRINCIPAL_ONLY',paymentPriority:'CAPITAL_FIRST',noInterestOnInterest:true,overdue:{blockNewLoanUntilSettled:true,recoverFrom:[]},specialLoans:[]}}});
  await repo.saveWorkspaceRecord({id:'loan_prior_t3',tenantId:'tenant_t3',groupId:'group_t3',moduleId:'FINANCE.LOANS',title:'Prêt antérieur',status:'ACTIVE',tags:['completion','kind:LOAN','state:REPAYING'],data:{completionKind:'LOAN',completionState:'REPAYING',completionVersion:5,borrowerMembershipId:'mm_t3',rubricId:'rubric_loan_policy',principal:50000,outstandingPrincipal:0,unpaidInterest:6000,rateBasisPointsPerPeriod:500,paymentPriority:'CAPITAL_FIRST',ledgerEntryId:'ledger_prior'},createdBy:'founder_t3',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-10T00:00:00Z'});
  const r=await handler(new Request('http://local/api/v1/groups/group_t3/completion',{method:'POST',headers:founder,body:JSON.stringify({kind:'LOAN',title:'Nouveau prêt',data:{principal:10000,currency:'XAF',borrowerMembershipId:'mm_t3',rubricId:'rubric_loan_policy',outstandingPrincipal:0}})}));
  assert.equal(r.status,400);const body=await r.json();assert.equal(body.error,'PREVIOUS_LOAN_DEBT_NOT_SETTLED');
});


test('targeted tranche 6 keeps Tontines Members Back-office and loan editing coherent',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const tontine=fs.readFileSync('apps/web/src/tontine-manager-ui.js','utf8');
  const completion=fs.readFileSync('apps/web/src/completion-ui.js','utf8');
  const dossier=fs.readFileSync('apps/web/src/member-dossier-ui.ts','utf8');
  const gov=fs.readFileSync('apps/web/src/master-governance-ui.ts','utf8');
  const misc=fs.readFileSync('packages/misc-rubrics/src/index.ts','utf8');
  assert.match(html,/data-view="members"/);assert.match(html,/data-view="backoffice"/);assert.match(html,/id="memberDossierHost"/);
  assert.match(tontine,/status!=='ARCHIVED'/);assert.match(tontine,/nominal\*parts\/pots/);assert.match(tontine,/tontineRubricCreateForm/);assert.match(tontine,/tontineRankingList/);
  assert.match(completion,/if\(!byId\('tontineCompletionPanel'\)\)return/);
  assert.match(dossier,/memberDossierHost/);assert.doesNotMatch(dossier,/q\('detailBody'\)/);
  assert.match(gov,/data-loan-edit-capital/);assert.match(gov,/data-loan-payment-index/);assert.doesNotMatch(gov,/JSON\.stringify\(x,null,2\)/);
  assert.match(misc,/name:'Timbre de prêt'/);assert.doesNotMatch(misc,/name:'Timbre',/);
});


test('manager correcting own 2,000 XAF contribution to 5,000 keeps the full trace and requires independent review',async()=>{
  const {repo,handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t3/contributions/cash',{method:'POST',headers:founder,body:JSON.stringify({membershipId:'mm_t3',amount:2000,currency:'XAF',meetingId:'meeting_t3',rubricId:'rubric_fine',idempotencyKey:'own-corr-original'})}));
  assert.equal(r.status,201);const original=await r.json();
  const membership=await repo.getMembership('tenant_t3','group_t3','mm_t3');await repo.saveMembership({...membership,roles:['member','manager']});
  const selfManager={'content-type':'application/json','x-tenant-id':'tenant_t3','x-actor-id':'member_t3','x-group-roles':'member,manager'};
  r=await handler(new Request('http://local/api/v1/groups/group_t3/contributions/'+encodeURIComponent(original.id)+'/correct',{method:'POST',headers:selfManager,body:JSON.stringify({newAmount:5000,reason:'Montant réellement versé = 5 000'})}));
  assert.equal(r.status,200);const correction=await r.json();
  assert.equal(correction.oldAmount,2000);assert.equal(correction.newAmount,5000);assert.equal(correction.beforeSituation,2000);assert.equal(correction.afterSituation,5000);
  assert.equal(correction.selfBenefit,true);assert.equal(correction.requiresIndependentReview,true);
  const positions=await (await handler(new Request('http://local/api/v1/groups/group_t3/ledger',{headers:selfManager}))).json();
  const old=positions.receipts.find(x=>x.id===original.id),replacement=positions.receipts.find(x=>x.id===correction.replacementReceiptId);
  assert.equal(old.netAmount,0);assert.equal(replacement.netAmount,5000);
  const notices=await (await handler(new Request('http://local/api/v1/groups/group_t3/members/mm_t3/financial-notices',{headers:selfManager}))).json();
  const n=notices.find(x=>x.operationType==='CASH_CONTRIBUTION_CORRECTED');
  assert.equal(n.previousAmount,2000);assert.equal(n.newAmount,5000);assert.equal(n.previousSituation,2000);assert.equal(n.newSituation,5000);assert.equal(n.disputeState,'UNDER_REVIEW');assert.equal(n.selfBenefit,true);
  const traces=await repo.listWorkspaceRecords('tenant_t3','FINANCE.CORRECTION','group_t3');assert.equal(traces.length,1);assert.equal(traces[0].status,'DONE');assert.equal(traces[0].data.oldAmount,2000);assert.equal(traces[0].data.newAmount,5000);
  const audits=await repo.listAudit('tenant_t3');assert.ok(audits.some(x=>x.action==='FINANCIAL_CORRECTION_REQUESTED'));assert.ok(audits.some(x=>x.action==='FINANCIAL_CORRECTION_COMPLETED'));
  const reviewTasks=await repo.listObligations('tenant_t3','founder_t3');assert.ok(reviewTasks.some(x=>x.type==='FINANCIAL_INDEPENDENT_REVIEW'&&x.sourceId===n.id));
});



test('manager correction of another member is never institutionally silent',async()=>{
  const {repo,handler}=await seed();
  await repo.saveUser({id:'reviewer_t3',displayName:'Deuxième Responsable',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'reviewer_membership_t3',tenantId:'tenant_t3',groupId:'group_t3',userId:'reviewer_t3',roles:['manager'],status:'active',joinedAt:'2026-01-01T00:00:00Z'});

  let r=await handler(new Request('http://local/api/v1/groups/group_t3/contributions/cash',{method:'POST',headers:founder,body:JSON.stringify({membershipId:'mm_t3',amount:2000,currency:'XAF',meetingId:'meeting_t3',rubricId:'rubric_fine',idempotencyKey:'other-corr-original'})}));
  assert.equal(r.status,201);const original=await r.json();

  r=await handler(new Request('http://local/api/v1/groups/group_t3/contributions/'+encodeURIComponent(original.id)+'/correct',{method:'POST',headers:founder,body:JSON.stringify({newAmount:5000,reason:'Correction 2 000 vers 5 000 avec revue indépendante'})}));
  assert.equal(r.status,200);const correction=await r.json();
  assert.equal(correction.selfBenefit,false);
  assert.equal(correction.requiresIndependentReview,true);
  assert.equal(correction.notice.disputeState,'UNDER_REVIEW');
  assert.equal(correction.notice.previousAmount,2000);
  assert.equal(correction.notice.newAmount,5000);

  const ledger=(await (await handler(new Request('http://local/api/v1/groups/group_t3/ledger',{headers:founder}))).json());
  assert.equal(ledger.receipts.find(x=>x.id===original.id).netAmount,0);
  assert.equal(ledger.receipts.find(x=>x.id===correction.replacementReceiptId).netAmount,5000);

  const tasks=await repo.listObligations('tenant_t3','reviewer_t3');
  assert.ok(tasks.some(x=>x.type==='FINANCIAL_INDEPENDENT_REVIEW'&&x.sourceId===correction.notice.id&&x.status==='open'));

  r=await handler(new Request('http://local/api/v1/groups/group_t3/financial-notices/'+encodeURIComponent(correction.notice.id)+'/officer-review',{method:'POST',headers:founder,body:JSON.stringify({note:'Auteur tente de valider sa propre correction'})}));
  assert.equal(r.status,400);
  assert.equal((await r.json()).error,'INDEPENDENT_REVIEW_REQUIRED');

  const reviewer={'content-type':'application/json','x-tenant-id':'tenant_t3','x-actor-id':'reviewer_t3','x-group-roles':'manager'};
  r=await handler(new Request('http://local/api/v1/groups/group_t3/financial-notices/'+encodeURIComponent(correction.notice.id)+'/officer-review',{method:'POST',headers:reviewer,body:JSON.stringify({note:'Correction vérifiée par le deuxième responsable'})}));
  assert.equal(r.status,200);const reviewed=await r.json();assert.equal(reviewed.disputeState,'OFFICER_CONFIRMED');
  assert.equal((await repo.listObligations('tenant_t3','reviewer_t3')).find(x=>x.sourceId===correction.notice.id)?.status,'completed');
});

test('targeted tranche 7 exposes manager rubric matrix, self-owned dossier and direct loan cell editing',()=>{
  const detail=fs.readFileSync('apps/web/src/detail-ui.js','utf8');
  const dossier=fs.readFileSync('apps/web/src/member-dossier-ui.ts','utf8');
  const governance=fs.readFileSync('apps/web/src/master-governance-ui.ts','utf8');
  const control=fs.readFileSync('apps/web/src/member-control-ui.js','utf8');
  assert.match(detail,/rubricContributionMatrix/);assert.match(detail,/Tableau récapitulatif des contributions/);assert.match(detail,/rubricConfigurationEditor/);
  assert.match(dossier,/Consultation Bureau/);assert.match(dossier,/Votre dossier/);assert.match(dossier,/const self=/);
  assert.match(governance,/loan-matrix-edit-value/);assert.match(governance,/Touchez directement un montant encadré/);assert.match(governance,/data-loan-payment-index/);
  assert.match(control,/Auto-modification financière/);assert.match(control,/Revue indépendante/);assert.match(control,/actorName/);
});
