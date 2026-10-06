import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sessions=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
const completion=fs.readFileSync('apps/web/src/completion-ui.js','utf8');
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
  assert.match(completion,/loan-four-criteria-table/);
  assert.match(completion,/Ensemble du groupe/);
  assert.match(completion,/Capital restant/);
  assert.match(completion,/Intérêts dus/);
  assert.match(completion,/Prochains intérêts projetés/);
  assert.match(completion,/loan-criterion-due/);
  assert.match(completion,/loan-criteria-start/);
  assert.match(completion,/Dette totale exigible/);
});
test('canonical finance source includes per-member other debts and loan policy projection metadata',()=>{
  assert.match(worker,/otherDebts=groupObligations\.map/);
  assert.match(worker,/interestTiming:String/);
  assert.match(worker,/interestAppliesToLabel/);
  assert.match(worker,/loanPeriods:periodRows,loanDebts,otherDebts/);
});
