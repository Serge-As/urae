import test from 'node:test';
import assert from 'node:assert/strict';
import {simulatePeriodicLoan} from '../.build/packages/loan-simulator/src/index.js';

test('50,000 XAF at 5% per month with no payment ends at 57,500 without compounding interest',()=>{
  const rows=simulatePeriodicLoan({principal:50000,periods:3,ratePercentPerPeriod:5,priority:'CAPITAL_FIRST',interestBasis:'OUTSTANDING'});
  assert.deepEqual(rows.map(r=>[r.interestNew,r.principalAfter,r.interestAfter,r.totalDebtAfter]),[
    [2500,50000,2500,52500],
    [2500,50000,5000,55000],
    [2500,50000,7500,57500]
  ]);
});

test('capital-first partial repayments keep unpaid interest separate and non-taxable',()=>{
  const rows=simulatePeriodicLoan({principal:50000,periods:3,ratePercentPerPeriod:5,priority:'CAPITAL_FIRST',interestBasis:'OUTSTANDING',payments:[0,30000,20000]});
  assert.equal(rows[1].principalAfter,20000);
  assert.equal(rows[1].interestAfter,5000);
  assert.equal(rows[2].interestNew,1000);
  assert.equal(rows[2].principalAfter,0);
  assert.equal(rows[2].interestAfter,6000);
  assert.equal(rows[2].totalDebtAfter,6000);
  assert.equal(rows[2].nextTaxablePrincipal,0);
});

test('interest-first partial repayments reproduce the alternate group rule',()=>{
  const rows=simulatePeriodicLoan({principal:50000,periods:3,ratePercentPerPeriod:5,priority:'INTEREST_FIRST',interestBasis:'OUTSTANDING',payments:[0,30000,20000]});
  assert.equal(rows[1].interestPaid,5000);
  assert.equal(rows[1].principalPaid,25000);
  assert.equal(rows[1].principalAfter,25000);
  assert.equal(rows[1].interestAfter,0);
  assert.equal(rows[2].interestNew,1250);
  assert.equal(rows[2].interestPaid,1250);
  assert.equal(rows[2].principalPaid,18750);
  assert.equal(rows[2].principalAfter,6250);
  assert.equal(rows[2].interestAfter,0);
});

test('unpaid interest can remain after principal reaches zero without generating more interest',()=>{
  const rows=simulatePeriodicLoan({principal:5000,periods:6,ratePercentPerPeriod:5,priority:'CAPITAL_FIRST',payments:[0,5000,0,0,0,0]});
  assert.equal(rows[1].principalAfter,0);
  assert.equal(rows[1].interestAfter,500);
  for(const row of rows.slice(2)){assert.equal(row.interestNew,0);assert.equal(row.interestAfter,500);assert.equal(row.nextTaxablePrincipal,0);}
});
