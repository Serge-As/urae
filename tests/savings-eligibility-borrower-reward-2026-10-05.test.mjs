import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleSavingsDeposits,allocateBorrowerReward,splitInterestPool} from '../.build/packages/savings-yield/src/index.js';

test('LOAN_SESSION_GATE makes the entire loan session eligible, not only the loan amount',()=>{
  const deposits=[
    {id:'s2-a',memberId:'a',amount:300000,session:2},
    {id:'s2-b',memberId:'b',amount:200000,session:2},
    {id:'s3-a',memberId:'a',amount:150000,session:3}
  ];
  const eligible=eligibleSavingsDeposits(deposits,'LOAN_SESSION_GATE',[2],10);
  assert.equal(eligible.reduce((n,x)=>n+x.amount,0),500000);
  assert.deepEqual(eligible.map(x=>x.id),['s2-a','s2-b']);
});

test('ALL_DEPOSITS ignores presence of a loan but still obeys the group eligibility cutoff',()=>{
  const deposits=[
    {id:'s2',memberId:'a',amount:100000,session:2},
    {id:'s3',memberId:'a',amount:100000,session:3},
    {id:'s11',memberId:'a',amount:100000,session:11}
  ];
  assert.deepEqual(eligibleSavingsDeposits(deposits,'ALL_DEPOSITS',[2],10).map(x=>x.id),['s2','s3']);
  assert.deepEqual(eligibleSavingsDeposits(deposits,'LOAN_SESSION_GATE',[2,11],10).map(x=>x.id),['s2']);
});

test('borrower reward excludes open debt and rewards earlier/larger/interest-paying settled loans',()=>{
  const result=allocateBorrowerReward({
    interestPool:10000,endSession:12,mode:'VOLUME_TIME_INTEREST',
    loans:[
      {loanId:'early',memberId:'early',principal:100000,disbursedSession:1,repaidSession:8,realizedInterest:20000},
      {loanId:'late',memberId:'late',principal:80000,disbursedSession:6,repaidSession:10,realizedInterest:10000},
      {loanId:'open',memberId:'open',principal:500000,disbursedSession:1,realizedInterest:50000}
    ]
  });
  assert.equal(result.eligibleLoanCount,2);
  assert.equal(result.members.some(x=>x.memberId==='open'),false);
  assert.ok(result.members.find(x=>x.memberId==='early').interest>result.members.find(x=>x.memberId==='late').interest);
  assert.equal(result.members.reduce((n,x)=>n+x.interest,0),10000);
});

test('60/20/10/8/2 pool key is exact to the franc',()=>{
  const split=splitInterestPool(123457,[
    {key:'CLASSIC',basisPoints:6000},{key:'SCHOOL',basisPoints:2000},{key:'BORROWERS',basisPoints:1000},{key:'OFFICE',basisPoints:800},{key:'RESERVE',basisPoints:200}
  ]);
  assert.equal(split.reduce((n,x)=>n+x.amount,0),123457);
  assert.deepEqual(split.map(x=>x.basisPoints),[6000,2000,1000,800,200]);
});
