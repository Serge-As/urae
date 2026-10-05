import test from 'node:test';
import assert from 'node:assert/strict';
import {applyLoanPayment} from '../.build/packages/completion/src/index.js';

test('generic repayment with CAPITAL_FIRST pays capital first then only the surplus to due interest',()=>{
  const first=applyLoanPayment({principalOutstanding:10000,unpaidInterest:2000,paymentAmount:6000,rateBasisPointsPerPeriod:0,priority:'CAPITAL_FIRST'});
  assert.deepEqual({principal:first.principalPaid,interest:first.interestPaid,remaining:first.remainingPrincipal,interestDue:first.unpaidInterestAfter},{principal:6000,interest:0,remaining:4000,interestDue:2000});
  const second=applyLoanPayment({principalOutstanding:4000,unpaidInterest:2000,paymentAmount:5000,rateBasisPointsPerPeriod:0,priority:'CAPITAL_FIRST'});
  assert.deepEqual({principal:second.principalPaid,interest:second.interestPaid,remaining:second.remainingPrincipal,interestDue:second.unpaidInterestAfter},{principal:4000,interest:1000,remaining:0,interestDue:1000});
});

test('generic repayment with INTEREST_FIRST pays due interest before principal',()=>{
  const r=applyLoanPayment({principalOutstanding:10000,unpaidInterest:2000,paymentAmount:6000,rateBasisPointsPerPeriod:0,priority:'INTEREST_FIRST'});
  assert.deepEqual({principal:r.principalPaid,interest:r.interestPaid,remaining:r.remainingPrincipal,interestDue:r.unpaidInterestAfter},{principal:4000,interest:2000,remaining:6000,interestDue:0});
});

test('unpaid interest is never capitalized into the next interest base',()=>{
  const r=applyLoanPayment({principalOutstanding:10000,unpaidInterest:5000,paymentAmount:0,rateBasisPointsPerPeriod:1000,priority:'CAPITAL_FIRST'});
  assert.equal(r.interestAccrued,1000);
  assert.equal(r.totalInterestDue,6000);
  assert.equal(r.totalDebtAfter,16000);
});
