import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync('apps/web/src/loan-simulation-ui.js','utf8');
const html=fs.readFileSync('apps/web/index.html','utf8');
const completion=fs.readFileSync('apps/web/src/completion-ui.js','utf8');

test('loan simulation supports hypothetical, existing and A/B comparison without financial writes',()=>{
  assert.match(ui,/Simulation uniquement/);
  assert.match(ui,/Scénario A/);
  assert.match(ui,/Scénario B/);
  assert.match(ui,/Comparer avec un scénario B/);
  assert.match(ui,/app\.simulateLoan\(/);
  assert.match(ui,/app\.loanHistory\(loan\.id\)/);
  assert.match(ui,/Écart B – A sur la dette finale/);
  assert.doesNotMatch(ui,/repayLoan|disburseLoan|recordCash|recordLoanRepayment|setFinancialCellTarget/);
  assert.match(completion,/loanFreeSimulationBtn/);
  assert.match(completion,/Simulation libre · prêt imaginaire/);
  assert.match(completion,/Simulation du prêt existant/);
});

test('loan policy UI exposes both A and B scopes plus effective date or meeting without hiding closed-loan safeguard',()=>{
  for(const id of ['loanPolicyScope','loanPolicyEffectiveMode','loanPolicyEffectiveAt','loanPolicyEffectiveMeeting','loanPolicySelectedLoans'])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/NEW_LOANS_ONLY/);
  assert.match(html,/NEW_AND_ALL_OPEN_LOANS/);
  assert.match(html,/NEW_AND_SELECTED_OPEN_LOANS/);
  assert.match(html,/Les prêts soldés ne sont jamais réécrits/);
  assert.match(completion,/selectedLoanIds/);
  assert.match(completion,/effectiveMeetingId/);
  assert.match(completion,/effectiveAt/);
});
