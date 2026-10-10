import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sessions=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
const completion=fs.readFileSync('apps/web/src/completion-ui.js','utf8');
const debtSummary=fs.readFileSync('apps/web/src/financial-summary-tables.js','utf8');
const debtView=completion+'\n'+debtSummary;
const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
const html=fs.readFileSync('apps/web/index.html','utf8');

test('debt view distinguishes interest due from next projected interest',()=>{
  assert.match(sessions,/Prochain intérêt/);
  assert.match(sessions,/rateBasisPointsPerPeriod/);
  assert.match(sessions,/Dette si prochaine période/);
  assert.match(sessions,/sans le comptabiliser prématurément/);
});
test('loan menu exposes member x session recap and current totals',()=>{
  assert.match(html,/id="loanDebtRecap"/);
  assert.match(completion,/loanRecapTable/);
  assert.match(completion,/renderDebtEvolutionTable\(data/);
  assert.match(debtView,/loan-four-criteria-table/);
  assert.match(debtView,/Ensemble du groupe/);
  assert.match(debtView,/Capital restant/);
  assert.match(debtView,/Intérêts dus/);
  assert.match(debtView,/Prochains intérêts projetés/);
  assert.match(debtView,/loan-criterion-/);
  assert.match(debtView,/totalDebtAfter/);
  assert.match(debtView,/loan-criteria-start/);
  assert.match(debtView,/Dette totale exigible/);
});
test('canonical finance source includes per-member other debts and loan policy projection metadata',()=>{
  assert.match(worker,/otherDebts=groupObligations\.map/);
  assert.match(worker,/interestTiming:String/);
  assert.match(worker,/interestAppliesToLabel/);
  assert.match(worker,/loanPeriods:periodRows,loanDebts,otherDebts/);
});
