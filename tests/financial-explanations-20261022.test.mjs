import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository,D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {createApiHandler} from '../.build/workers/api/src/index.js';
import {buildSavingsCalculationCopy,verifySavingsCalculationCopy} from '../.build/packages/savings-yield/src/proof.js';
import {verifyProposalCoverage} from '../scripts/proposal-coverage-gate.mjs';
import {readFile} from 'node:fs/promises';
const at='2026-10-01T08:00:00Z';
async function fixture(sql){
 const db=sql?new SQLiteD1(':memory:'):null;if(db)db.migrate();const repo=db?new D1PlatformRepository(db):new InMemoryPlatformRepository();
 await repo.saveGroup({id:'g',tenantId:'t',name:'Synthetic explanations',kind:'association',governanceModel:'founder_managed',createdBy:'owner',status:'active',createdAt:at});
 for(const actor of ['owner','alice','bob']){await repo.saveUser({id:actor,displayName:actor,locale:'fr',createdAt:at});await repo.saveMembership({id:'m_'+actor,tenantId:'t',groupId:'g',userId:actor,roles:[actor==='owner'?'founder':'member'],status:'active',joinedAt:at});}
 await repo.saveMeeting({id:'s',tenantId:'t',groupId:'g',title:'Synthetic meeting',status:'open',openedAt:at,openedBy:'owner'});
 await repo.saveRubricDefinition({id:'r',tenantId:'t',groupId:'g',name:'Secours',facets:{direction:'INFLOW',obligation:'CUSTOM'},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:at});
 const handler=createApiHandler(repo),send=async(action,method='GET',body,actor='owner')=>{const r=await handler(new Request('https://synthetic.test/api/v1/groups/g/'+action,{method,headers:{'content-type':'application/json','x-tenant-id':'t','x-actor-id':actor,'x-active-group-id':'g'},body:body===undefined?undefined:JSON.stringify(body)}));return {status:r.status,body:await r.json()};};
 const ok=async(...args)=>{const r=await send(...args);assert.ok(r.status===200||r.status===201,JSON.stringify(r));return r.body;};
 const record=async(id,kind,data)=>repo.saveWorkspaceRecord({id,tenantId:'t',groupId:'g',moduleId:({LOAN:'FINANCE.LOANS',GROUP_EXERCISE:'GROUP.EXERCISE',TONTINE_CYCLE:'TONTINE.CYCLES',TONTINE_SHARE:'TONTINE.SHARES'})[kind]??kind,title:'Synthetic '+id,status:'ACTIVE',tags:['completion','kind:'+kind],data:{completionKind:kind,completionState:'DRAFT',completionVersion:1,...data},createdBy:'owner',createdAt:at,updatedAt:at});
 const loan=async()=>{await repo.saveRubricDefinition({id:'lr',tenantId:'t',groupId:'g',name:'Prêt',facets:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',custom:{systemKey:'LOAN'}},policies:{loan:{rateBasisPointsPerPeriod:1000,paymentPriority:'CAPITAL_FIRST'}},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:at});await record('loan','LOAN',{completionState:'REPAYING',borrowerMembershipId:'m_alice',outstandingPrincipal:100000,unpaidInterest:5000,rateBasisPointsPerPeriod:1000,paymentPriority:'CAPITAL_FIRST',currency:'XAF',ledgerEntryId:'prior-disbursement'});};
 return {repo,db,send,ok,record,loan};
}
for(const sql of [false,true]){const label=sql?'SQLite/D1':'memory';
 test(label+' contribution and traced correction reconcile the canonical balance without any new financial write',async()=>{
  const f=await fixture(sql);const initial=await f.ok('meetings/s/financial-cells','POST',{membershipId:'m_alice',rubricId:'r',targetAmount:3000,expectedCurrentAmount:0,expectedCellVersion:0,reason:'Initial synthetic receipt',idempotencyKey:'receipt_1'});
  await f.ok('meetings/s/financial-cells','POST',{membershipId:'m_alice',rubricId:'r',targetAmount:1000,expectedCurrentAmount:3000,expectedCellVersion:initial.cellVersion,reason:'Traced synthetic correction',idempotencyKey:'correction_1'});
  await f.ok('meetings/s/financial-cells','POST',{membershipId:'m_bob',rubricId:'r',targetAmount:500,expectedCurrentAmount:0,expectedCellVersion:0,reason:'Other member receipt',idempotencyKey:'receipt_2'});
  const before=await f.repo.listLedgerEntries('t','g'),view=await f.ok('finance/explanation');assert.equal(view.control.status,'MATCH');assert.equal(view.control.canonicalAmount,1500);assert.equal(view.period.net,1500);assert.ok(view.movements.items.some(x=>x.reversalOfEntryId));assert.equal(view.pendingLocalIncluded,false);
  const own=await f.ok('finance/explanation?membershipId=m_alice&rubricId=r&meetingId=s','GET',undefined,'alice');assert.equal(own.period.net,1000);assert.equal(own.control.status,'MATCH');assert.deepEqual(own.filters.members.map(x=>x.id),['m_alice']);assert.ok(own.movements.items.every(x=>x.membershipId==='m_alice'));assert.ok(!JSON.stringify(own).includes('m_bob'));
  assert.equal((await f.send('finance/explanation?membershipId=m_bob','GET',undefined,'alice')).status,403);assert.equal((await f.send('finance/explanation','GET',undefined,'outsider')).status,403);
  assert.deepEqual(await f.repo.listLedgerEntries('t','g'),before);assert.equal((await f.ok('finance/explanation?from=2099-01-01')).movements.total,0);assert.equal((await f.send('finance/explanation?to=2020-01-01&from=2099-01-01')).status,400);
 });
 test(label+' a member can read only their loan and compare policy-based outcomes; stale snapshots and excess payment are rejected',async()=>{
  const f=await fixture(sql);await f.loan();const before=await f.repo.getWorkspaceRecord('t','loan');const view=await f.ok('finance/loans/loan','GET',undefined,'alice');assert.equal(view.loan.principal,100000);assert.equal(view.loan.interest,5000);assert.equal((await f.send('finance/loans/loan','GET',undefined,'bob')).status,404);
  const scenario=await f.ok('finance/loans/loan/scenario','POST',{expectedSnapshot:view.loan.snapshot,paymentAmount:30000,periods:3},'alice');assert.equal(scenario.recordedDuePreview.principalPaid,30000);assert.equal(scenario.recordedDuePreview.interestPaid,0);assert.equal(scenario.rows[0].interestNew,10000);assert.equal(scenario.rows[1].interestNew,7000);assert.equal(scenario.canExecuteFromPreview,false);assert.deepEqual(await f.repo.getWorkspaceRecord('t','loan'),before);assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);
  assert.equal((await f.send('finance/loans/loan/scenario','POST',{expectedSnapshot:view.loan.snapshot,paymentAmount:105001,periods:3},'alice')).body.error,'LOAN_PAYMENT_EXCEEDS_TOTAL_DUE');
  await f.repo.saveWorkspaceRecord({...before,updatedAt:'2026-10-22T20:00:00Z',data:{...before.data,outstandingPrincipal:90000,completionVersion:2}});assert.equal((await f.send('finance/loans/loan/scenario','POST',{expectedSnapshot:view.loan.snapshot,paymentAmount:30000,periods:3},'alice')).body.error,'FINANCE_PREVIEW_STALE');
 });
 test(label+' a historical closing exposes only the authorized envelope and never fabricates detailed calculation inputs or payment proof',async()=>{
  const f=await fixture(sql);await f.record('exercise','GROUP_EXERCISE',{completionState:'CLOSED',closingPlanJson:JSON.stringify({members:[{membershipId:'m_alice',principal:1000,interest:50,payableCash:1050},{membershipId:'m_bob',principal:2000,interest:100,payableCash:2100}],totalPrincipal:3000,totalInterest:150,memberAllocatedTotal:3150})});
  const view=await f.ok('finance/yield-receipts','GET',undefined,'alice');assert.equal(view.items[0].envelopes.length,1);assert.equal(view.items[0].envelopes[0].membershipId,'m_alice');assert.equal(view.items[0].totals,undefined);assert.equal(view.items[0].calculationInputsRecorded,false);assert.equal(view.items[0].paymentCertification,false);assert.ok(!JSON.stringify(view).includes('m_bob'));
  assert.equal((await f.send('finance/yield-copy','POST',{interestPool:100,deposits:[],coefficients:{}},'alice')).status,403);
 });
 test(label+' calendar enforces personal obligations and actual ledger proof; a timing shock never changes rounds, cash or assistance data',async()=>{
  const f=await fixture(sql);await f.record('cycle','TONTINE_CYCLE',{completionState:'ACTIVE',rounds:3,nominalPotAmount:1000});await f.record('share1','TONTINE_SHARE',{completionState:'SCHEDULED',cycleId:'cycle',membershipId:'m_alice',scheduledRound:1});await f.record('share2','TONTINE_SHARE',{completionState:'SERVED',cycleId:'cycle',membershipId:'m_bob',scheduledRound:2,benefitLedgerEntryId:'invented-ledger'});
  for(const a of ['alice','bob'])await f.repo.saveObligation({id:'o_'+a,tenantId:'t',groupId:'g',assigneeId:a,type:'EXPECTED_CONTRIBUTION',title:'Private '+a,priority:'normal',status:'open',sourceType:'synthetic',sourceId:a,amount:{currency:'XAF',amount:500}});
  const own=await f.ok('finance/calendar','GET',undefined,'alice');assert.deepEqual(own.obligations.map(x=>x.id),['o_alice']);assert.equal(own.shares.length,1);const all=await f.ok('finance/calendar');assert.equal(all.shares.find(x=>x.id==='share2').servedWithEvidence,false);
  const before=await f.repo.listWorkspaceRecords('t',undefined,'g'),v=await f.ok('finance/calendar/stress','POST',{cycleId:'cycle',openingCash:0,incomePerRound:1000,delayedAmount:500,affectedRound:1,releaseRound:3});assert.deepEqual(v.rows.map(x=>x.difference),[-500,-500,0]);assert.equal(v.rows[0].shortfall,500);assert.equal(v.canonicalScheduleChanged,false);assert.deepEqual(await f.repo.listWorkspaceRecords('t',undefined,'g'),before);assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);assert.equal((await f.send('finance/calendar/stress','POST',{cycleId:'cycle'},'alice')).status,403);
 });
}
test('portable savings calculation copies reproduce exact pool allocation and reject tampered inputs, results, hashes and metadata',async()=>{
 const input={interestPool:1001,coefficients:{JAN:2,FEB:1},deposits:[{id:'b',memberId:'bob',amount:1000,periodKey:'FEB'},{id:'a',memberId:'alice',amount:1000,periodKey:'JAN'}]};const copy=await buildSavingsCalculationCopy(input);assert.equal(copy.result.distributedInterest,1001);assert.equal(copy.result.members.reduce((n,m)=>n+m.interest,0),1001);assert.equal((await verifySavingsCalculationCopy(copy)).valid,true);assert.deepEqual(await buildSavingsCalculationCopy({...input,deposits:[...input.deposits].reverse()}),copy);
 for(const change of [x=>x.input.deposits[0].amount++,x=>x.result.members[0].interest++,x=>x.contentSha256='0'.repeat(64),x=>x.posting=true]){const altered=structuredClone(copy);change(altered);await assert.rejects(()=>verifySavingsCalculationCopy(altered),/YIELD_COPY_MISMATCH/);}
});
test('all 92 proposals have acceptance criteria, a responsible lot and a bounded integration plan; assignment cannot masquerade as delivery',async()=>{
 const reg=JSON.parse(await readFile(new URL('../docs/implementation/PROPOSALS_REGISTER_2026-10-20.json',import.meta.url),'utf8'));assert.equal(verifyProposalCoverage(reg).proposals,92);const bad=structuredClone(reg);bad.proposals[0].targetLots=[];assert.throws(()=>verifyProposalCoverage(bad),/PROPOSAL_LOT_MAPPING/);const duplicate=structuredClone(reg);duplicate.proposals[1].id=duplicate.proposals[0].id;assert.throws(()=>verifyProposalCoverage(duplicate),/PROPOSAL_ID/);
});
