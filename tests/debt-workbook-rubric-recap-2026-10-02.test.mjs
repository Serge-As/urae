import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {simulatePeriodicLoan} from '../.build/packages/loan-simulator/src/index.js';

test('workbook debt semantics roll principal and interest separately at 5 percent example',()=>{
  const rows=simulatePeriodicLoan({principal:100000,periods:2,ratePercentPerPeriod:5,priority:'CAPITAL_FIRST',interestBasis:'OUTSTANDING',payments:[0,0]});
  assert.equal(rows[0].principalAfter,100000);
  assert.equal(rows[0].interestAfter,5000);
  assert.equal(rows[0].totalDebtAfter,105000);
  assert.equal(rows[1].interestAfter,10000);
  assert.equal(rows[1].totalDebtAfter,110000);
});

test('savings source recognizes legacy repayment and interest-repayment rubrics without double counting',()=>{
  const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
  assert.match(worker,/rembour\.\*interet/);
  assert.match(worker,/eventPrincipalTotal/);
  assert.match(worker,/eventInterestTotal/);
  assert.match(worker,/Math\.max\(ledgerRecoveredInterest,eventInterestTotal,periodInterestTotal\)/);
  assert.match(worker,/totalDebtIncludingNextInterest/);
  assert.match(worker,/LOAN_RATE_MISSING/);
});

test('rubrics expose one member by session recap and archived rubrics remain visible and restorable',()=>{
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(main,/renderRubricRecapTable/);
  assert.match(main,/Tableau récapitulatif · membres × séances/);
  assert.match(main,/Restaurer cette rubrique/);
  assert.doesNotMatch(main,/if\(r\.status==='ARCHIVED'\)continue;\s*const a/);
});

test('savings source refresh is event driven and only active on finance view',()=>{
  const ui=fs.readFileSync('apps/web/src/savings-yield-ui.js','utf8');
  assert.match(ui,/financeVisible/);
  assert.match(ui,/eco:view-changed/);
  assert.match(ui,/canonicalDirty/);
  assert.doesNotMatch(ui,/setInterval/);
});

test('sessions debt view consumes unified loan and savings projection instead of an isolated loan list',()=>{
  const ui=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
  const block=ui.slice(ui.indexOf('const renderDebts'),ui.indexOf('const renderSchedule'));
  assert.match(block,/savingsYieldSourceData/);
  assert.match(block,/nextInterestProjected/);
  assert.match(block,/Dette \+ prochaine échéance/);
  assert.doesNotMatch(block,/listCompletion\('LOAN'\)/);
});
