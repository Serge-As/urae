import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('field feedback: canonical sheet entry uses business semantics instead of treating every cell as contribution',async()=>{
  const app=await readFile('.build/packages/application/src/index.js','utf8');
  const main=await readFile('.build/src/main.js','utf8');
  assert.match(app,/recordFinancialSheetEntry/);
  assert.match(app,/recordCashContribution/);
  assert.match(app,/\/loans\/[^`'\"]*\/disburse/);
  assert.match(app,/scope:\s*['"]SHEET['"]/);
  assert.match(main,/financialNatureForRubric/);
  assert.match(main,/recordFinancialSheetEntry/);
  assert.match(main,/FINANCE\.SHEET_EVENT/);
  assert.match(main,/app\.expenses\(\{\s*scope\s*:\s*['"]SHEET['"]\s*\}\)/);
  assert.match(main,/Sortie \/ dette|Outflow \/ debt/);
});

test('field feedback: loan close accrual is one canonical flow for online and outbox and targets next session',async()=>{
  const worker=await readFile('.build/workers/api/src/index.js','utf8');
  const occurrences=(worker.match(/accrueLoanInterestAfterMeetingClose/g)||[]).length;
  assert.ok(occurrences>=3,'helper definition + direct close + outbox close expected');
  assert.match(worker,/interestCloseSourceIdsJson/);
  assert.match(worker,/preparedInterestMeetingIdsJson/);
  assert.match(worker,/interestAppliesToMeetingId/);
  assert.match(worker,/interestAppliesToLabel/);
  assert.match(worker,/appliesTo\s*:\s*['"]NEXT_SESSION['"]/);
  assert.match(worker,/totalDebt(?:After)?\s*:\s*(?:currentPrincipal|principal)\s*\+\s*interestAfter/);
  assert.match(worker,/loanDebts/);
});

test('field feedback: prepared next-session interest is consumed without double accrual',async()=>{
  const worker=await readFile('.build/workers/api/src/index.js','utf8');
  assert.match(worker,/preparedInterestMeetingIds\.includes\(meetingId\)/);
  assert.match(worker,/usedPreparedInterest\s*=\s*true/);
  assert.match(worker,/preparedInterestPending\s*=\s*false/);
});

test('field feedback: financial matrix allows page wheel scrolling while keeping horizontal table scroll',async()=>{
  const css=await readFile('.build/styles.css','utf8');
  assert.match(css,/canonical-financial-wrap\{[^}]*overflow-x:auto[^}]*overflow-y:visible/);
  assert.match(css,/canonical-financial-wrap\{[^}]*overscroll-behavior-y:auto/);
  assert.match(css,/canonical-financial-wrap\{[^}]*touch-action:pan-x pan-y/);
});

test('field feedback: member actions never collapse into vertical letters',async()=>{
  const css=await readFile('.build/styles.css','utf8');
  assert.match(css,/member-management-toolbar\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/member-management-toolbar button\{[^}]*width:100%[^}]*overflow-wrap:normal[^}]*word-break:normal/);
});

test('field feedback: restored trash notice expires visually after 72h and Home stays capped at five urgent alerts',async()=>{
  const main=await readFile('.build/src/main.js','utf8');
  assert.match(main,/restoredWindow\s*=\s*72\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.match(main,/slice\(\s*0\s*,\s*5\s*\)/);
  assert.match(main,/renderNotificationCenter/);
  assert.match(main,/notificationCenterList/);
});

test('field feedback: flagship visual mode has its own premium visual language',async()=>{
  const css=await readFile('.build/styles.css','utf8');
  assert.match(css,/body\.ui-mode-visual\{background:/);
  assert.match(css,/body\.ui-mode-visual \.topbar\{[^}]*backdrop-filter/);
  assert.match(css,/body\.ui-mode-visual \.hero\{[^}]*radial-gradient/);
  assert.match(css,/body\.ui-mode-visual \.metric::before/);
  assert.match(css,/body\.ui-mode-visual \.quick::after/);
});

test('field feedback: member debt surfaces include interest and next-session attribution',async()=>{
  const detail=await readFile('.build/src/detail-ui.js','utf8');
  const home=await readFile('.build/src/group-home-ui.js','utf8');
  const sessions=await readFile('.build/src/sessions-ui.js','utf8');
  assert.match(detail,/Intérêts dus/);assert.match(detail,/interestAppliesToLabel/);
  assert.match(home,/Dette totale/);assert.match(home,/debtInterest/);
  assert.match(sessions,/Dernier intérêt ajouté|Latest accrued interest/);
  assert.match(sessions,/interestAppliesToLabel/);
});

test('field feedback: application shell contains no escaped newline artifact',async()=>{
  const html=await readFile('.build/index.html','utf8');
  assert.doesNotMatch(html,/<body[^>]*>\\n\s*<section/);
  assert.match(html,/ECO-SYSTEM · 1\.5\.2\.1/);
});
