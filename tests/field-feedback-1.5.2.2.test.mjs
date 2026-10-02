import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('1.5.2.2 canonical sheet dispatches contribution outflow loan and repayment through business owners',async()=>{
  const app=await readFile('.build/packages/application/src/index.js','utf8');
  const main=await readFile('.build/src/main.js','utf8');
  assert.match(app,/recordFinancialSheetEntry/);
  assert.match(app,/recordCashContribution/);
  assert.match(app,/scope\s*:\s*['"]SHEET['"]/);
  assert.match(app,/\/loans\/[^\x60'"]*\/disburse/);
  assert.match(app,/\/loans\/[^\x60'"]*\/repay/);
  assert.match(main,/financialNatureForRubric/);
  assert.match(main,/recordFinancialSheetEntry/);
  assert.match(main,/FINANCE\.SHEET_EVENT/);
  assert.match(main,/app\.expenses\(\{\s*scope\s*:\s*['"]SHEET['"]\s*\}\)/);
  assert.match(main,/Sortie \/ dette|Outflow \/ debt/);
});

test('1.5.2.2 close interest belongs to the next session and one helper owns online plus outbox close',async()=>{
  const worker=await readFile('.build/workers/api/src/index.js','utf8');
  assert.ok((worker.match(/accrueLoanInterestAfterMeetingClose/g)||[]).length>=3);
  for(const token of ['interestCloseSourceIdsJson','preparedInterestMeetingIdsJson','interestAppliesToMeetingId','interestAppliesToLabel','interestSourceClosedMeetingId','loanDebts'])assert.ok(worker.includes(token),token);
  assert.match(worker,/appliesTo\s*:\s*['"]NEXT_SESSION['"]/);
  assert.match(worker,/totalDebt\s*:\s*principal\s*\+\s*interestAfter/);
  assert.match(worker,/preparedInterestMeetingIds\.includes\(meetingId\)/);
  assert.match(worker,/usedPreparedInterest\s*=\s*true/);
});

test('1.5.2.2 debt UI exposes principal interest total and next-session attribution',async()=>{
  const home=await readFile('.build/src/group-home-ui.js','utf8');
  const detail=await readFile('.build/src/detail-ui.js','utf8');
  const sessions=await readFile('.build/src/sessions-ui.js','utf8');
  assert.match(home,/Dette totale/);assert.match(home,/debtInterest/);assert.match(home,/interestAppliesToLabel/);
  assert.match(detail,/Intérêts dus/);assert.match(detail,/interestAppliesToLabel/);
  assert.match(sessions,/Dernier intérêt ajouté|Latest accrued interest/);assert.match(sessions,/interestAppliesToLabel/);
});

test('1.5.2.2 financial matrices let the page wheel scroll while horizontal matrix scrolling remains local',async()=>{
  const css=await readFile('.build/styles.css','utf8');
  assert.match(css,/canonical-financial-wrap\{[^}]*overflow-x:auto[^}]*overflow-y:visible/);
  assert.match(css,/canonical-financial-wrap\{[^}]*overscroll-behavior-y:auto/);
  assert.match(css,/canonical-financial-wrap\{[^}]*touch-action:pan-x pan-y/);
});

test('1.5.2.2 member management does not collapse controls into vertical letters',async()=>{
  const css=await readFile('.build/styles.css','utf8');
  assert.match(css,/member-management-toolbar\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/member-management-toolbar button\{[^}]*width:100%[^}]*overflow-wrap:normal[^}]*word-break:normal/);
});

test('1.5.2.2 trash restore feedback lasts 72 hours and Home caps priority alerts at five',async()=>{
  const main=await readFile('.build/src/main.js','utf8');
  const html=await readFile('.build/index.html','utf8');
  assert.match(main,/restoredWindow\s*=\s*72\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.match(main,/slice\(\s*0\s*,\s*5\s*\)/);
  assert.match(main,/renderNotificationCenter/);assert.match(html,/id="notificationCenterList"/);assert.match(html,/id="urgentNotificationsAllBtn"/);
});

test('1.5.2.2 flagship visual mode is materially richer while Senior and Assisted remain separate modes',async()=>{
  const css=await readFile('.build/styles.css','utf8');
  const modes=await readFile('.build/src/ui-modes.js','utf8');
  assert.match(css,/body\.ui-mode-visual\{background:/);
  assert.match(css,/body\.ui-mode-visual \.topbar\{[^}]*backdrop-filter/);
  assert.match(css,/body\.ui-mode-visual \.hero\{[^}]*radial-gradient/);
  assert.match(css,/body\.ui-mode-visual \.metric::before/);
  assert.match(modes,/visual/);assert.match(modes,/senior/);assert.match(modes,/assisted/);
});

test('1.5.2.9 free-conservation shell is version isolated and keeps the previous coherent release',async()=>{
  const html=await readFile('.build/index.html','utf8');
  const sw=await readFile('.build/sw.js','utf8');
  assert.match(html,/ECO-SYSTEM · 1\.5\.2\.9/);
  assert.match(html,/main\.js\?v=1529/);
  assert.match(sw,/eco-system-v1529-free-conservation-debt-20261002/);\n  assert.match(sw,/PREVIOUS_CACHE = 'eco-system-v1529-live-field-recovery-20260930'/);
  const current=sw.match(/const CACHE = '([^']+)';/)?.[1],previous=sw.match(/const PREVIOUS_CACHE = '([^']+)';/)?.[1];
  assert.ok(current&&previous&&current!==previous,'current and rollback caches must remain distinct');
  assert.doesNotMatch(html,/<body[^>]*>\\n\s*<section/);
});
