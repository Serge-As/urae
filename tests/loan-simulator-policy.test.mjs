import test from 'node:test';
import assert from 'node:assert/strict';
import {simulatePeriodicLoan,summarizePeriodicLoan} from '../.build/packages/loan-simulator/src/index.js';

test('hypothetical loan simulation keeps interest separate from principal',()=>{
  const input={principal:10000,periods:2,ratePercentPerPeriod:10,priority:'CAPITAL_FIRST',payments:[6000,0],openingInterestDue:2000,interestBasis:'OUTSTANDING'};
  const rows=simulatePeriodicLoan(input),summary=summarizePeriodicLoan(input,rows);
  assert.equal(rows[0].interestNew,1000);
  assert.equal(rows[0].principalPaid,6000);
  assert.equal(rows[0].interestPaid,0);
  assert.equal(rows[0].principalAfter,4000);
  assert.equal(rows[0].interestAfter,3000);
  assert.equal(rows[1].interestNew,400,'unpaid interest never earns interest');
  assert.equal(summary.finalPrincipalDue,4000);
  assert.equal(summary.finalInterestDue,3400);
  assert.equal(summary.finalDebt,7400);
});

test('existing-loan comparison can simulate INTEREST_FIRST from the same opening debt',()=>{
  const input={principal:10000,periods:1,ratePercentPerPeriod:0,priority:'INTEREST_FIRST',payments:[6000],openingInterestDue:2000,interestBasis:'OUTSTANDING'};
  const rows=simulatePeriodicLoan(input),summary=summarizePeriodicLoan(input,rows);
  assert.equal(rows[0].interestPaid,2000);
  assert.equal(rows[0].principalPaid,4000);
  assert.equal(summary.finalPrincipalDue,6000);
  assert.equal(summary.finalInterestDue,0);
  assert.equal(summary.finalDebt,6000);
});

test('explicit allocation simulation uses the manager planned capital/interest split',()=>{
  const input={principal:10000,periods:2,ratePercentPerPeriod:0,priority:'EXPLICIT_ALLOCATION',
    principalPayments:[2500,1500],interestPayments:[1500,500],openingInterestDue:2000,interestBasis:'OUTSTANDING'};
  const rows=simulatePeriodicLoan(input),summary=summarizePeriodicLoan(input,rows);
  assert.deepEqual(rows.map(r=>[r.payment,r.principalPaid,r.interestPaid]),[[4000,2500,1500],[2000,1500,500]]);
  assert.equal(summary.finalPrincipalDue,6000);
  assert.equal(summary.finalInterestDue,0);
  assert.equal(summary.finalDebt,6000);
});

test('explicit allocation rejects invented interest or principal overpayment',()=>{
  assert.throws(()=>simulatePeriodicLoan({principal:1000,periods:1,ratePercentPerPeriod:0,priority:'EXPLICIT_ALLOCATION',
    principalPayments:[1200],interestPayments:[0],openingInterestDue:0}),/LOAN_EXPLICIT_PRINCIPAL_EXCEEDS_DUE/);
  assert.throws(()=>simulatePeriodicLoan({principal:1000,periods:1,ratePercentPerPeriod:0,priority:'EXPLICIT_ALLOCATION',
    principalPayments:[0],interestPayments:[200],openingInterestDue:100}),/LOAN_EXPLICIT_INTEREST_EXCEEDS_DUE/);
});
