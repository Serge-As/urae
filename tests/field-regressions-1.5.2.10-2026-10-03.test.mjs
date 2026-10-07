import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const app=fs.readFileSync('packages/application/src/index.ts','utf8');
const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
const completion=fs.readFileSync('apps/web/src/completion-ui.js','utf8');
const styles=fs.readFileSync('apps/web/styles.css','utf8');
const sw=fs.readFileSync('apps/web/sw.js','utf8');

test('writer overlay uses the actual baselineVersion and conflicts never masquerade as confirmation',()=>{
  const snapshot=main.slice(main.indexOf('const pendingTargetSnapshot'),main.indexOf('const scheduleFinancialOutboxRecovery'));
  assert.match(snapshot,/baselineVersion/);
  assert.doesNotMatch(snapshot,/baselineCellVersion/);
  assert.match(snapshot,/stored\?\.status==='CONFIRMED'/);
  assert.match(snapshot,/stored\?\.status==='CONFLICT'/);
  assert.match(snapshot,/markCriticalFinancialConflict/);
});

test('divergent offline cell writes stop as explicit conflicts instead of silent rebases',()=>{
  const block=worker.slice(worker.indexOf("if(item.type==='FINANCIAL_CELL_CORRECTION_PROPOSAL_V1')"),worker.indexOf("throw new Error('OUTBOX_TYPE_UNSUPPORTED')"));
  assert.match(block,/if\(staleBaseline\)throw Error\('CELL_VALUE_CONFLICT'\)/);
  assert.doesNotMatch(block,/Rebase après synchronisation/);
  assert.match(styles,/eco-critical-conflict-blink/);
  assert.match(styles,/is-critical-conflict/);
  assert.match(styles,/#b01420/);
});

test('offline refresh is shell-first and reconnect remains event driven without full app restart',()=>{
  assert.match(sw,/const ready = await cache\.match\(RELEASE_READY\)/);
  assert.match(sw,/if \(cached\) return cached/);
  assert.doesNotMatch(sw,/periodicsync/);
  assert.match(main,/NAV_STATE_STORAGE='eco\.navigation\.state\.v1'/);
  assert.match(main,/window\.addEventListener\('pageshow'/);
  assert.match(main,/window\.addEventListener\('focus'/);
  assert.match(main,/visibilitychange/);
  const resume=main.slice(main.indexOf('const resumeOnline='),main.indexOf("window.addEventListener('online'"));
  assert.match(resume,/await refreshGroupContext\(\)/);
  assert.doesNotMatch(resume,/await start\(\)/);
});

test('savings history recognizes archived and system-key savings instead of collapsing to zero',()=>{
  assert.match(worker,/const isSavingsRubric=/);
  assert.match(worker,/SAVINGS\|EPARGNE/);
  assert.match(worker,/rubricRows\.filter\(isSavingsRubric\)/);
  assert.match(app,/const isSavingsRubric=/);
  assert.match(app,/rubrics\.filter\(isSavingsRubric\)/);
  assert.doesNotMatch(worker,/savingsRubrics=rubricRows\.filter\(r=>r\.status==='ACTIVE'/);
  assert.doesNotMatch(app,/savingsRubrics=rubrics\.filter\(r=>r\.status==='ACTIVE'/);
});

test('generic repayment envelope auto-allocates by the current policy',()=>{
  assert.match(app,/const component=explicitInterest\?'INTEREST':explicitPrincipal\?'PRINCIPAL':'AUTO'/);
  assert.match(app,/paymentAmount:input\.amount,priority/);
  const replay=worker.slice(worker.indexOf("if(nature==='REPAYMENT')"),worker.indexOf("throw Error('UNSUPPORTED_FINANCIAL_SHEET_NATURE')"));
  assert.match(replay,/component=.*'AUTO'/);
  assert.match(replay,/applyLoanPayment\(/);
  assert.match(replay,/resolveLoanPolicyForOperation\(loan,loanRubric\?\.policies\?\.loan/);
  assert.match(replay,/effectivePolicy\.paymentPriority/);
});

test('loan policy, portfolio, open-loan state and debt journey use compact selector/table surfaces',()=>{
  assert.match(worker,/effectivePolicy=resolveLoanPolicyForOperation\(x,rubric\?\.policies\?\.loan/);
  assert.match(worker,/paymentPriority:String\(effectivePolicy\.paymentPriority\?\?x\.data\.paymentPriority/);
  assert.match(completion,/loan-portfolio-table/);
  assert.match(completion,/loan-open-state-table/);
  assert.match(completion,/Parcours d’une dette/);
  assert.match(completion,/app\.loanHistory\(loanSelect\.value\)/);
  assert.match(completion,/effectiveLoanPolicyForDisplay\(loan,currentPolicy\)/);
  assert.match(completion,/effectiveLoan=.*data:\{\.\.\.loan\.data,\.\.\.resolved\}/s);
  assert.match(completion,/Récapitulatif de l’évolution des dettes/);
});

test('rubric recap is one chooser and one matrix, not one stacked table per rubric',()=>{
  assert.match(main,/appendRubricRecapChooser/);
  assert.match(main,/rubricRecapChooser/);
  assert.match(main,/Tableau récapitulatif · membres × séances/);
  assert.doesNotMatch(main,/appendRubricRecap\(a,r\)/);
});
