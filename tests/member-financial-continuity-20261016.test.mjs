import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';
import {projectTontineContribution} from '../.build/packages/rubrics/src/contribution-position.js';
import {applyLoanPayment} from '../.build/packages/completion/src/index.js';

async function fixture(){
  const repo=new InMemoryPlatformRepository(),stamp='2026-10-16T08:00:00Z';
  await repo.saveGroup({id:'g',tenantId:'t',name:'Synthetic continuity',kind:'association',status:'active',createdBy:'a',createdAt:stamp,governanceModel:'founder_managed'});
  for(const actor of ['a','b']){await repo.saveUser({id:actor,displayName:actor,locale:'fr',createdAt:stamp});await repo.saveMembership({id:'m-'+actor,tenantId:'t',groupId:'g',userId:actor,roles:['manager'],status:'active',joinedAt:stamp});}
  await repo.saveMeeting({id:'s',tenantId:'t',groupId:'g',title:'Séance',status:'open',openedAt:stamp,openedBy:'a'});
  await repo.saveRubricDefinition({id:'r',tenantId:'t',groupId:'g',name:'Secours',facets:{direction:'INFLOW',obligation:'CUSTOM'},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp});
  const request=async(actor,path,method='GET',body)=>{
    // A new handler per request deliberately discards all in-memory UI/service
    // state: outstanding reviews must come from the repository after reload.
    const handler=createApiHandler(repo),response=await handler(new Request('https://test.local/api/v1/groups/g'+path,{method,headers:{'content-type':'application/json','x-tenant-id':'t','x-actor-id':actor,'x-group-roles':'manager','x-active-group-id':'g'},body:body===undefined?undefined:JSON.stringify(body)}));
    const data=await response.json();if(!response.ok)throw Error(JSON.stringify(data));return data;
  };
  return{repo,request};
}

test('canonical review survives service reload, clears on exact approval, and reopens for a newer amount',async()=>{
  const {repo,request}=await fixture();
  await request('a','/meetings/s/financial-cells','POST',{membershipId:'m-a',rubricId:'r',targetAmount:1000,expectedCurrentAmount:0,expectedCellVersion:0,reason:'Initial',idempotencyKey:'initial'});
  let snapshot=await request('b','/financial-cells/snapshot'),cell=snapshot.cells.find(x=>x.rubricId==='r');assert.equal(cell.reviewRequired,true);
  const original=await repo.listLedgerEntries('t','g');
  await request('b','/meetings/s/financial-cells/review','POST',{membershipId:'m-a',rubricId:'r',amount:1000,cellVersion:cell.cellVersion,decision:'APPROVE'});
  cell=(await request('b','/financial-cells/snapshot')).cells.find(x=>x.rubricId==='r');assert.equal(cell.reviewRequired,false);assert.equal(cell.reviewDecision,'APPROVE');
  assert.deepEqual(await repo.listLedgerEntries('t','g'),original,'approval cannot mutate Ledger');
  await request('a','/meetings/s/financial-cells','POST',{membershipId:'m-a',rubricId:'r',targetAmount:3000,expectedCurrentAmount:1000,expectedCellVersion:cell.cellVersion,reason:'Correction',idempotencyKey:'change'});
  cell=(await request('b','/financial-cells/snapshot')).cells.find(x=>x.rubricId==='r');assert.equal(cell.amount,3000);assert.equal(cell.reviewRequired,true);
  await assert.rejects(request('b','/meetings/s/financial-cells/review','POST',{membershipId:'m-a',rubricId:'r',amount:1000,cellVersion:cell.cellVersion-1,decision:'APPROVE'}),/CELL_REVIEW_STALE/);
});

test('reserve/approve/reserve at the same cell version retains the latest durable decision',async()=>{
  const {request}=await fixture();await request('a','/meetings/s/financial-cells','POST',{membershipId:'m-a',rubricId:'r',targetAmount:1000,expectedCurrentAmount:0,expectedCellVersion:0,reason:'Initial',idempotencyKey:'initial'});
  const cell=(await request('b','/financial-cells/snapshot')).cells[0];
  for(const decision of ['RESERVE','APPROVE','RESERVE','APPROVE']){
    await request('b','/meetings/s/financial-cells/review','POST',{membershipId:'m-a',rubricId:'r',amount:1000,cellVersion:cell.cellVersion,decision,reason:'Test de décision explicite'});
    const updated=(await request('b','/financial-cells/snapshot')).cells[0];assert.equal(updated.reviewRequired,decision==='RESERVE');assert.equal(updated.reviewDecision,decision);
  }
});

test('tontine cumulative due accepts partial arrears and carries declared advance without collecting cash twice',()=>{
  const input={eligible:true,shares:2,perShare:100,sessions:7,paidTotal:800,currentCash:0};
  const due=projectTontineContribution(input);assert.equal(due.periodic,200);assert.equal(due.expectedCumulative,1400);assert.equal(due.arrearsBefore,400);assert.equal(due.remainingDue,600);
  for(const cash of [250,300,450,600]){const p=projectTontineContribution({...input,targetCash:cash});assert.equal(p.remainingDue,600-cash);assert.equal(p.advance,0);}
  const advance=projectTontineContribution({...input,targetCash:850});assert.equal(advance.advance,250);assert.equal(advance.remainingDue,0);
  const next=projectTontineContribution({...input,sessions:8,paidTotal:1650});assert.equal(next.coveredByAdvance,200);assert.equal(next.remainingDue,0);assert.equal(next.advance,50);assert.equal(next.cashCollectedNow,0);assert.equal(next.ledgerMutationOnCoverage,false);
  const partial=projectTontineContribution({...input,sessions:9,paidTotal:1650});assert.equal(partial.coveredByAdvance,50);assert.equal(partial.remainingDue,150);
  assert.equal(projectTontineContribution({...input,eligible:false,shares:0}).status,'NOT_PARTICIPATING');
});

test('loan repayment never clips excess payment or includes projected future interest',()=>{
  const input={principalOutstanding:3000,unpaidInterest:250,paymentAmount:3250,rateBasisPointsPerPeriod:0,priority:'CAPITAL_FIRST'};
  const paid=applyLoanPayment(input);assert.equal(paid.totalDebtAfter,0);assert.equal(paid.paymentAmount,3250);
  assert.throws(()=>applyLoanPayment({...input,paymentAmount:3251}),/LOAN_PAYMENT_EXCEEDS_TOTAL_DUE/);
  assert.throws(()=>applyLoanPayment({...input,principalOutstanding:0,unpaidInterest:0,paymentAmount:1}),/LOAN_PAYMENT_EXCEEDS_TOTAL_DUE/);
});

test('global repayment position pays existing loans and due special debts once and rejects excess or stale targets',async()=>{
  const {repo,request}=await fixture(),stamp='2026-10-01T08:00:00Z';
  await repo.saveRubricDefinition({id:'repay',tenantId:'t',groupId:'g',name:'Remboursements',facets:{direction:'INFLOW',obligation:'CUSTOM',custom:{systemKey:'REPAYMENT'}},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp});
  await repo.saveWorkspaceRecord({id:'loan',tenantId:'t',groupId:'g',moduleId:'FINANCE.LOANS',title:'Prêt',status:'ACTIVE',tags:['completion','kind:LOAN'],data:{completionKind:'LOAN',completionState:'REPAYING',completionVersion:5,borrowerMembershipId:'m-a',principal:5000,outstandingPrincipal:3000,unpaidInterest:250,currency:'XAF',rateBasisPointsPerPeriod:1000,paymentPriority:'CAPITAL_FIRST',accruedMeetingIdsJson:'["s"]'},createdBy:'a',createdAt:stamp,updatedAt:stamp});
  await repo.saveObligation({id:'special',tenantId:'t',groupId:'g',assigneeId:'a',type:'EXPECTED_CONTRIBUTION',title:'Dette spéciale due',priority:'normal',status:'open',dueAt:stamp,sourceType:'special',sourceId:'special',amount:{currency:'XAF',amount:750}});
  await repo.saveObligation({id:'future',tenantId:'t',groupId:'g',assigneeId:'a',type:'EXPECTED_CONTRIBUTION',title:'Future obligation',priority:'normal',status:'open',dueAt:'2099-01-01T00:00:00Z',sourceType:'special',sourceId:'future',amount:{currency:'XAF',amount:9000}});
  const position=()=>request('a','/financial-entry-position?meetingId=s&membershipId=m-a&rubricId=repay');
  let p=await position();assert.equal(p.totalDue,4000);assert.equal(p.interest,250);assert.equal(p.futureInterestIncluded,false);
  const apply=async(key,amount,targetAmount,baselineAmount=0,baselineVersion=0)=>{
    const handler=createApiHandler(repo),response=await handler(new Request('https://test.local/api/v1/outbox/apply',{method:'POST',headers:{'content-type':'application/json','x-tenant-id':'t','x-actor-id':'a','x-group-roles':'manager','x-active-group-id':'g'},body:JSON.stringify({id:key,tenantId:'t',actorId:'a',type:'FINANCIAL_SHEET_ENTRY_V1',idempotencyKey:key,payload:{groupId:'g',membershipId:'m-a',meetingId:'s',rubricId:'repay',amount,nature:'REPAYMENT',targetAmount,baselineAmount,baselineVersion}})}));
    const data=await response.json();if(!response.ok)throw Error(JSON.stringify(data));return data;
  };
  await assert.rejects(apply('too-much',4001,4001),/LOAN_PAYMENT_EXCEEDS_TOTAL_DUE/);assert.equal((await repo.listLedgerEntries('t','g')).length,0);
  const first=await apply('repay-first',1000,1000);assert.equal(first.canonicalAmount,1000);assert.equal(first.debtPosition.totalDue,3000);
  await apply('repay-first',1000,1000);assert.equal((await repo.listLedgerEntries('t','g')).length,1);
  await assert.rejects(apply('stale',1000,1000),/SHEET_TARGET_STALE/);
  p=await position();const second=await apply('repay-last',3000,4000,1000,p.cellVersion);assert.equal(second.canonicalAmount,4000);assert.equal(second.debtPosition.totalDue,0);
  const entries=await repo.listLedgerEntries('t','g');assert.equal(entries.length,3);await apply('repay-last',3000,4000,1000,p.cellVersion);assert.deepEqual(await repo.listLedgerEntries('t','g'),entries);
  p=await position();await assert.rejects(apply('after-clearing',1,4001,4000,p.cellVersion),/MEMBER_DEBT_SETTLED/);
});
