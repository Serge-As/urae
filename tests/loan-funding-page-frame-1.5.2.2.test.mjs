import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('1.5.2.2 loan policy supports general, savings, repayments, combined and custom funding sources',async()=>{
  const contracts=await readFile('.build/packages/contracts/src/index.js','utf8');
  const governance=await readFile('.build/src/master-governance-ui.js','utf8');
  assert.match(governance,/GENERAL_CASH/);
  assert.match(governance,/SAVINGS_AND_REPAYMENTS/);
  assert.match(governance,/CUSTOM_RUBRICS/);
  assert.match(governance,/mgLoanCfgEnforceFunding/);
  assert.match(governance,/data-mg-loan-funding-rubric/);
  assert.ok(contracts.length>0);
});

test('loan disbursement keeps one cash Ledger entry and records funding as an earmark',async()=>{
  const worker=await readFile('.build/workers/api/src/index.js','utf8');
  const loanBlock=worker.slice(worker.indexOf('loans\\/([^/]+)\\/disburse'),worker.indexOf('loans\\/allocation-preview'));
  assert.match(loanBlock,/recordCashMovement/);
  assert.match(loanBlock,/FINANCE\.LOAN_FUNDING/);
  assert.match(loanBlock,/fundingSource/);
  assert.match(loanBlock,/LOAN_FUNDING_POOL_INSUFFICIENT/);
  assert.match(loanBlock,/receiptPositions/);
  assert.match(loanBlock,/allocationsJson/);
  assert.doesNotMatch(loanBlock,/new Ledger|second ledger/i);
});

test('page frame is present above every view and exposes group, session, debt, Home and Alerts context',async()=>{
  const html=await readFile('.build/index.html','utf8');
  const main=await readFile('.build/src/main.js','utf8');
  assert.ok(html.indexOf('id="pageContextBar"')<html.indexOf('id="view-dashboard"'));
  assert.match(html,/pageContextGroup/);
  assert.match(html,/pageContextMeeting/);
  assert.match(html,/pageContextDebt/);
  assert.match(main,/renderPageContextBar/);
  assert.match(main,/memberStatement/);
  assert.match(main,/Dettes prêts|Loan debt/);
});

test('large alert center paginates and filters without flooding Home',async()=>{
  const html=await readFile('.build/index.html','utf8');
  const main=await readFile('.build/src/main.js','utf8');
  assert.match(html,/notificationCenterPrevBtn/);
  assert.match(html,/notificationCenterNextBtn/);
  assert.match(html,/notificationCenterPriority/);
  assert.match(html,/notificationCenterSearch/);
  assert.match(main,/NOTIFICATION_CENTER_PAGE_SIZE\s*=\s*50/);
  assert.match(main,/notificationCenterPage/);
  assert.match(main,/slice\(\s*0\s*,\s*5\s*\)/);
});

test('Home exposes advanced canonical engines instead of hiding implemented services',async()=>{
  const html=await readFile('.build/index.html','utf8');
  for(const id of ['businessStudioOperational','valueNetworkOperational','marketEnginePanel','referralOperational','knowledgeOperational','academyOperational','externalProgramsPanel']) assert.match(html,new RegExp(id));
  assert.match(html,/Control Center/);
  assert.match(html,/propriétaire canonique/);
});

test('1.5.2.2 cache identity is exact and retains 1.5.2.1 as coherent rollback',async()=>{
  const sw=await readFile('.build/sw.js','utf8');
  const html=await readFile('.build/index.html','utf8');
  assert.match(sw,/eco-system-v1522-loan-funding-page-frame-20260923/);
  assert.match(sw,/PREVIOUS_CACHE = 'eco-system-v1521-field-finance-debt-ux-20260923'/);
  assert.match(html,/ECO-SYSTEM · 1\.5\.2\.2/);
  assert.match(html,/main\.js\?v=1522/);
  assert.doesNotMatch(html,/<body[^>]*>\\n/);
  assert.doesNotMatch(html,/<\/script>\\n\s*<script/);
});
