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
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(app,/LAST_KNOWN_GOOD_PLUS_LOCAL/);
  assert.match(app,/loanDebtById/);
  assert.match(app,/depositById/);
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
  assert.match(ui,/localManager/);
  assert.doesNotMatch(block,/listCompletion\('LOAN'\)/);
});


test('quota exhaustion opens a durable local circuit breaker instead of hammering D1',()=>{
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(app,/serverBudgetBlockedUntil/);
  assert.match(app,/eco\.serverBudgetBlock\.v1/);
  assert.match(app,/markServerBudgetBlocked/);
  assert.match(app,/status===429\?Date\.UTC/);
  assert.match(app,/forceServerRetry/);
  assert.match(app,/if\(this\.serverBudgetBlocked\(\)\)/);
});

test('manager scope survives D1 exhaustion from last-known groupMe truth',()=>{
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(app,/eco\.groupMe\.v1:/);
  assert.match(app,/savedAt:new Date\(\)\.toISOString/);
  assert.match(app,/saved&&\(saved\.membership\|\|saved\.isManager\)/);
});

test('Remboursements is an official offline-capable rubric and archived historical copy is restorable',()=>{
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
  assert.match(app,/ensureOfficialRepaymentRubric/);
  assert.match(app,/systemKey:'REPAYMENT'/);
  assert.match(app,/repaymentComponent:'PRINCIPAL'/);
  assert.match(app,/RUBRIC_RESTORE_V1/);
  assert.match(worker,/item\.type==='RUBRIC_RESTORE_V1'/);
  assert.match(worker,/restoreTrash/);
});

test('legacy loan sheets rebuild debt and derive next-session interest offline',()=>{
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(app,/historicalLoanDebts/);
  assert.match(app,/loanSheetEvents/);
  assert.match(app,/disbursementMeetingByLoan/);
  assert.match(app,/derivedInterest/);
  assert.match(app,/timing==='NEXT_SESSION_DUE'/);
  assert.match(app,/latestLater\?\.status==='closed'/);
});
