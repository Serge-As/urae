import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateWorkbookYieldPipeline,allocateCapitalAtWorkYield} from '../.build/packages/savings-yield/src/index.js';

test('historical workbook stages normalize provisional interest back to exact weighted allocation',()=>{
  const result=simulateWorkbookYieldPipeline({
    realizedInterestPool:18500,
    bureauShareBasisPoints:2000,
    funds:[
      {fund:'CLASSIC',shareBasisPoints:7000,eligiblePeriods:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT'],highestCoefficient:9,coefficients:{JAN:9,FEB:8,MAR:7,APR:6,MAY:5,JUN:4,JUL:3,AUG:2,SEP:1,OCT:.5,NOV:0,DEC:0}},
      {fund:'SCHOOL',shareBasisPoints:1000,eligiblePeriods:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT'],highestCoefficient:9,coefficients:{JAN:9,FEB:8,MAR:7,APR:6,MAY:5,JUN:4,JUL:3,AUG:2,SEP:1,OCT:.5,NOV:0,DEC:0}}
    ],
    deposits:[
      {id:'d1',memberId:'m1',fund:'CLASSIC',periodKey:'JAN',amount:100000},
      {id:'d2',memberId:'m2',fund:'CLASSIC',periodKey:'SEP',amount:100000},
      {id:'s1',memberId:'m3',fund:'SCHOOL',periodKey:'JAN',amount:50000}
    ]
  });
  const classic=result.funds.find(x=>x.fund==='CLASSIC');
  assert.equal(classic.allocatedPool,12950);
  assert.ok(classic.provisionalBaseRate>0);
  assert.ok(classic.normalizationRatio>0);
  assert.equal(classic.members.reduce((n,x)=>n+x.interest,0),12950);
  assert.ok(classic.members.find(x=>x.memberId==='m1').interest>classic.members.find(x=>x.memberId==='m2').interest);
  assert.equal(result.bureauIndemnity,3700);
  assert.equal(result.totalAllocated,18500);
  assert.equal(result.exactPoolConservation,true);
});

test('highest workbook coefficient is a common scale factor and does not change normalized final shares',()=>{
  const base={realizedInterestPool:10000,bureauShareBasisPoints:0,deposits:[
    {id:'d1',memberId:'m1',fund:'CLASSIC',periodKey:'JAN',amount:100000},
    {id:'d2',memberId:'m2',fund:'CLASSIC',periodKey:'SEP',amount:100000}
  ]};
  const a=simulateWorkbookYieldPipeline({...base,funds:[{fund:'CLASSIC',shareBasisPoints:10000,eligiblePeriods:['JAN','SEP'],highestCoefficient:9,coefficients:{JAN:9,SEP:1}}]});
  const b=simulateWorkbookYieldPipeline({...base,funds:[{fund:'CLASSIC',shareBasisPoints:10000,eligiblePeriods:['JAN','SEP'],highestCoefficient:18,coefficients:{JAN:9,SEP:1}}]});
  assert.deepEqual(a.funds[0].members.map(x=>x.interest),b.funds[0].members.map(x=>x.interest));
});

test('no-loan-no-yield gives no productive weight to an idle deposit',()=>{
  const r=allocateCapitalAtWorkYield({
    interestPool:10000,endSession:4,
    deposits:[
      {id:'jan',memberId:'early',fund:'CLASSIC',session:1,amount:100000},
      {id:'apr',memberId:'idle',fund:'CLASSIC',session:2,amount:100000}
    ],
    events:[
      {type:'LOAN_DISBURSEMENT',session:1,loanId:'L1',fund:'CLASSIC',amount:100000},
      {type:'LOAN_PRINCIPAL_REPAYMENT',session:4,loanId:'L1',amount:100000}
    ],
    policy:{allocationMethod:'FIFO_AVAILABLE',noLoanNoYield:true,recyclePrincipalRepayments:true,reinvestRealizedInterest:false}
  });
  const early=r.members.find(x=>x.memberId==='early'),idle=r.members.find(x=>x.memberId==='idle');
  assert.ok(early.weightedScore>0);assert.equal(idle.weightedScore,0);
  assert.equal(early.interest,10000);assert.equal(idle.interest,0);
});

test('principal repayment preserves saver ownership and can be lent again for additional exposure',()=>{
  const r=allocateCapitalAtWorkYield({
    interestPool:9000,endSession:5,
    deposits:[{id:'d1',memberId:'m1',fund:'CLASSIC',session:1,amount:100000}],
    events:[
      {type:'LOAN_DISBURSEMENT',session:1,loanId:'L1',fund:'CLASSIC',amount:100000},
      {type:'LOAN_PRINCIPAL_REPAYMENT',session:2,loanId:'L1',amount:100000},
      {type:'LOAN_DISBURSEMENT',session:3,loanId:'L2',fund:'CLASSIC',amount:100000},
      {type:'LOAN_PRINCIPAL_REPAYMENT',session:5,loanId:'L2',amount:100000}
    ],
    policy:{allocationMethod:'FIFO_AVAILABLE',noLoanNoYield:true,recyclePrincipalRepayments:true,reinvestRealizedInterest:false}
  });
  assert.equal(r.loansDisbursed,200000);assert.equal(r.principalRepaid,200000);
  assert.equal(r.totalMemberExposure,300000);
  assert.equal(r.members[0].interest,9000);
});

test('realized interest may be re-lent as collective profit without becoming member principal',()=>{
  const r=allocateCapitalAtWorkYield({
    interestPool:5000,endSession:4,
    deposits:[{id:'d1',memberId:'m1',fund:'CLASSIC',session:1,amount:100000}],
    events:[
      {type:'LOAN_DISBURSEMENT',session:1,loanId:'L1',fund:'CLASSIC',amount:100000},
      {type:'LOAN_PRINCIPAL_REPAYMENT',session:2,loanId:'L1',amount:100000},
      {type:'LOAN_INTEREST_RECEIPT',session:2,loanId:'L1',fund:'CLASSIC',amount:10000},
      {type:'LOAN_DISBURSEMENT',session:3,loanId:'L2',fund:'CLASSIC',amount:110000}
    ],
    policy:{allocationMethod:'PRO_RATA_AVAILABLE',noLoanNoYield:true,recyclePrincipalRepayments:true,reinvestRealizedInterest:true}
  });
  assert.equal(r.realizedInterestReceipts,10000);
  assert.equal(r.totalMemberPrincipal,100000);
  assert.ok(r.collectiveProfitExposure>0);
  assert.equal(r.members.reduce((n,x)=>n+x.interest,0),5000);
  assert.equal(r.exactPoolConservation,true);
});
