import test from 'node:test';
import assert from 'node:assert/strict';
import {allocateSavingsYield,allocateSavingsYieldAtWork,splitInterestPool} from '../.build/packages/savings-yield/src/index.js';

const legacy={JAN:9,FEB:8,MAR:7,APR:6,MAY:5,JUN:4,JUL:3,AUG:2,SEP:1,OCT:0.5,NOV:0,DEC:0};

test('savings yield weights every deposit separately instead of annual member total',()=>{
  const r=allocateSavingsYield({interestPool:1000,coefficients:legacy,deposits:[
    {id:'a-jan',memberId:'a',amount:100000,periodKey:'JAN'},
    {id:'a-sep',memberId:'a',amount:100000,periodKey:'SEP'},
    {id:'b-apr',memberId:'b',amount:200000,periodKey:'APR'}
  ]});
  const a=r.members.find(x=>x.memberId==='a'),b=r.members.find(x=>x.memberId==='b');
  assert.equal(a.weightedScore,100000*9+100000*1);
  assert.equal(b.weightedScore,200000*6);
  assert.equal(r.distributedInterest,1000);assert.equal(r.undistributedInterest,0);
});

test('same amount saved earlier wins when office coefficient is higher',()=>{
  const r=allocateSavingsYield({interestPool:10000,coefficients:legacy,deposits:[
    {id:'jan',memberId:'early',amount:100000,periodKey:'JAN'},
    {id:'sep',memberId:'late',amount:100000,periodKey:'SEP'}
  ]});
  const early=r.members.find(x=>x.memberId==='early'),late=r.members.find(x=>x.memberId==='late');
  assert.ok(early.interest>late.interest);assert.equal(early.weightedScore,9*late.weightedScore);
});

test('a much larger late deposit may fairly exceed a smaller early deposit',()=>{
  const r=allocateSavingsYield({interestPool:19000,coefficients:legacy,deposits:[
    {id:'jan',memberId:'early',amount:100000,periodKey:'JAN'},
    {id:'sep',memberId:'late',amount:1000000,periodKey:'SEP'}
  ]});
  const early=r.members.find(x=>x.memberId==='early'),late=r.members.find(x=>x.memberId==='late');
  assert.equal(early.weightedScore,900000);assert.equal(late.weightedScore,1000000);
  assert.ok(late.interest>early.interest);
});

test('largest remainder distribution always allocates exactly 100 percent of the real pool',()=>{
  const r=allocateSavingsYield({interestPool:18500,coefficients:legacy,deposits:[
    {id:'1',memberId:'a',amount:123456,periodKey:'JAN'},
    {id:'2',memberId:'b',amount:234567,periodKey:'APR'},
    {id:'3',memberId:'c',amount:345678,periodKey:'OCT'}
  ]});
  assert.equal(r.members.reduce((n,x)=>n+x.interest,0),18500);
  assert.equal(r.distributedInterest,18500);assert.equal(r.undistributedInterest,0);
});

test('legacy January to October coefficients preserve the workbook intent including October 0.5',()=>{
  const r=allocateSavingsYield({interestPool:9500,mode:'LEGACY_COEFFICIENTS',coefficients:legacy,deposits:[
    {id:'j',memberId:'jan',amount:100000,periodKey:'JAN'},
    {id:'o',memberId:'oct',amount:100000,periodKey:'OCT'}
  ]});
  assert.equal(r.deposits.find(x=>x.periodKey==='OCT').coefficient,0.5);
  assert.equal(r.members.find(x=>x.memberId==='jan').weightedScore,900000);
  assert.equal(r.members.find(x=>x.memberId==='oct').weightedScore,50000);
});

test('interest pool suballocation is exact too',()=>{
  const split=splitInterestPool(18500,[{key:'EPARGNE',basisPoints:7000},{key:'EPARGNE_SCOLAIRE',basisPoints:1000},{key:'BUREAU',basisPoints:2000}]);
  assert.deepEqual(split.map(x=>x.amount),[12950,1850,3700]);
  assert.equal(split.reduce((n,x)=>n+x.amount,0),18500);
});


test('workbook reconstruction exposes Principal -> provisional -> normalization -> final stages',()=>{
  const r=allocateSavingsYield({interestPool:12950,mode:'WORKBOOK_RECONSTRUCTED',coefficients:legacy,deposits:[
    {id:'jan',memberId:'a',amount:100000,periodKey:'JAN'},
    {id:'apr',memberId:'b',amount:100000,periodKey:'APR'}
  ]});
  assert.equal(r.stages.maxCoefficient,9);
  assert.equal(r.stages.generalRatePercent,12950/200000*100);
  assert.equal(r.stages.provisionalBaseRate,r.stages.generalRatePercent/9);
  assert.ok(r.stages.provisionalTotal>0);
  assert.equal(r.stages.normalizationRatio,r.stages.provisionalTotal/12950);
  assert.equal(r.members.reduce((n,x)=>n+x.interest,0),12950);
});

test('a group may decide that a savings period without a new loan earns no yield',()=>{
  const r=allocateSavingsYield({interestPool:10000,mode:'WORKBOOK_RECONSTRUCTED',coefficients:{JAN:9,FEB:8},periodProductivity:{JAN:1,FEB:0},deposits:[
    {id:'jan',memberId:'productive',amount:100000,periodKey:'JAN'},
    {id:'feb',memberId:'idle',amount:100000,periodKey:'FEB'}
  ]});
  assert.equal(r.deposits.find(x=>x.id==='feb').score,0);
  assert.equal(r.members.find(x=>x.memberId==='idle').interest,0);
  assert.equal(r.members.find(x=>x.memberId==='productive').interest,10000);
});

test('capital-at-work NEW_DISBURSEMENT gives zero productivity to a session without new loans',()=>{
  const r=allocateSavingsYieldAtWork({
    interestPool:12000,
    deposits:[
      {id:'a-jan',memberId:'a',amount:100000,periodKey:'JAN'},
      {id:'b-feb',memberId:'b',amount:100000,periodKey:'FEB'}
    ],
    periods:[
      {periodKey:'JAN',sequence:1,loanDisbursed:100000,principalRepaid:0},
      {periodKey:'FEB',sequence:2,loanDisbursed:0,principalRepaid:0}
    ],
    policy:{utilizationBasis:'NEW_DISBURSEMENT'}
  });
  assert.equal(r.periods[0].utilization,1);
  assert.equal(r.periods[1].utilization,0);
  assert.equal(r.distributedInterest,12000);
});

test('capital-at-work can treat outstanding loans as productive even with no new disbursement',()=>{
  const r=allocateSavingsYieldAtWork({
    interestPool:10000,
    deposits:[
      {id:'a-jan',memberId:'a',amount:100000,periodKey:'JAN'},
      {id:'b-feb',memberId:'b',amount:100000,periodKey:'FEB'}
    ],
    periods:[
      {periodKey:'JAN',sequence:1,loanDisbursed:100000,principalRepaid:0},
      {periodKey:'FEB',sequence:2,loanDisbursed:0,principalRepaid:0}
    ],
    policy:{utilizationBasis:'OUTSTANDING_LOANS'}
  });
  assert.equal(r.periods[1].outstandingLoans,100000);
  assert.equal(r.periods[1].utilization,0.5);
  assert.ok(r.members.find(x=>x.memberId==='b').interest>0);
  assert.equal(r.distributedInterest,10000);
});

test('principal repayments restore lendable liquidity without double-counting member savings principal',()=>{
  const r=allocateSavingsYieldAtWork({
    interestPool:10000,
    deposits:[{id:'a-jan',memberId:'a',amount:100000,periodKey:'JAN'}],
    periods:[
      {periodKey:'JAN',sequence:1,loanDisbursed:100000,principalRepaid:0},
      {periodKey:'FEB',sequence:2,loanDisbursed:50000,principalRepaid:50000}
    ],
    policy:{utilizationBasis:'NEW_DISBURSEMENT'}
  });
  assert.equal(r.totalPrincipal,100000);
  assert.equal(r.periods[1].lendableLiquidityBeforeLoans,50000);
  assert.equal(r.periods[1].modeledLiquidityAfterLoans,0);
  assert.equal(r.distributedInterest,10000);
});

test('collected interest may be re-lent as liquidity without becoming new member principal',()=>{
  const r=allocateSavingsYieldAtWork({
    interestPool:5000,
    deposits:[{id:'a-jan',memberId:'a',amount:100000,periodKey:'JAN'}],
    periods:[
      {periodKey:'JAN',sequence:1,loanDisbursed:100000,principalRepaid:0},
      {periodKey:'FEB',sequence:2,loanDisbursed:10000,principalRepaid:0,interestCollected:10000}
    ],
    policy:{utilizationBasis:'NEW_DISBURSEMENT',includeInterestAsLendable:true}
  });
  assert.equal(r.totalPrincipal,100000);
  assert.equal(r.periods[1].lendableLiquidityBeforeLoans,10000);
  assert.equal(r.periods[1].modeledLiquidityAfterLoans,0);
});
