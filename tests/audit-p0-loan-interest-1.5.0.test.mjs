import test from 'node:test';
import assert from 'node:assert/strict';
import {simulatePeriodicLoan} from '../.build/packages/loan-simulator/src/index.js';

test('INITIAL basis stops generating new interest after principal reaches zero',()=>{
  const rows=simulatePeriodicLoan({
    principal:10000,
    periods:3,
    ratePercentPerPeriod:10,
    priority:'CAPITAL_FIRST',
    interestBasis:'INITIAL',
    payments:[11000,0,0]
  });
  assert.deepEqual(rows.map(r=>r.interestNew),[1000,0,0]);
  assert.equal(rows[0].principalAfter,0);
  assert.equal(rows[1].principalAfter,0);
  assert.equal(rows[2].totalDebtAfter,0);
});

test('unpaid interest remains due but never creates new interest after capital is zero',()=>{
  const rows=simulatePeriodicLoan({
    principal:10000,
    periods:3,
    ratePercentPerPeriod:10,
    priority:'CAPITAL_FIRST',
    interestBasis:'INITIAL',
    payments:[10000,0,0]
  });
  assert.equal(rows[0].principalAfter,0);
  assert.equal(rows[0].interestAfter,1000);
  assert.equal(rows[1].interestNew,0);
  assert.equal(rows[1].interestAfter,1000);
  assert.equal(rows[2].interestNew,0);
  assert.equal(rows[2].totalDebtAfter,1000);
});

test('OUTSTANDING basis keeps charging only remaining principal and stops at zero',()=>{
  const rows=simulatePeriodicLoan({
    principal:10000,
    periods:3,
    ratePercentPerPeriod:10,
    priority:'CAPITAL_FIRST',
    interestBasis:'OUTSTANDING',
    payments:[4000,3000,4900]
  });
  assert.deepEqual(rows.map(r=>r.interestNew),[1000,600,300]);
  assert.equal(rows[2].principalAfter,0);
  assert.equal(rows[2].interestAfter,0);
  assert.equal(rows[2].nextInterestProjected,0);
});
