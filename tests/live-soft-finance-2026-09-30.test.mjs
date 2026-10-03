import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
const css=fs.readFileSync('apps/web/styles.css','utf8');

test('financial validation uses soft targeted projection instead of full matrix rebuild',()=>{
  assert.match(main,/refreshFinancialProjectionSilently/);
  assert.match(main,/patchFinancialDomCell/);
  assert.match(main,/focusNextFinancialInput/);
  const handler=main.slice(main.indexOf("window.addEventListener('eco:financial-live-update'"),main.indexOf('const refreshGroupContext'));
  assert.doesNotMatch(handler,/renderLedger\(\)/);
  const submit=main.slice(main.indexOf('const submitFinancialCellElement'),main.indexOf('const makeFinancialEntryCell'));
  assert.doesNotMatch(submit,/await renderLedger\(\)/);
  assert.doesNotMatch(submit,/sessionsUI\.refresh/);
  assert.match(submit,/CELL_VALUE_CONFLICT/);
  assert.match(submit,/Cellule resynchronisée/);
});

test('financial banners are dismissable without deleting notification history',()=>{
  assert.match(main,/DISMISSED_FINANCIAL_ALERTS/);
  assert.match(main,/financial-alert-close/);
  assert.match(main,/Masquer ce bandeau sans supprimer la notification/);
  assert.match(css,/financial-alert-close/);
});

test('live client heals missed durable events by sequence replay on reconnect without polling',()=>{
  assert.match(live,/liveWebSocketUrl\(lastSeq\)/);
  assert.match(live,/sequence-gap/);
  assert.match(live,/visibilityState==='visible'/);
  assert.doesNotMatch(live,/catchupTimer/);
  assert.doesNotMatch(live,/setInterval\(/);
});

test('server broadcasts canonical financial writes to managers',()=>{
  assert.match(worker,/financial-cell-managers:/);
  assert.match(worker,/operationType:'CASH_CONTRIBUTION'/);
  assert.match(worker,/loan-sheet-live:/);
  assert.match(worker,/loan-repayment-live:/);
});


test('financial live exposes draft presence only on state changes and never broadcasts the draft amount',()=>{
  assert.match(main,/FINANCIAL_DRAFT/);
  assert.match(main,/FINANCIAL_DRAFT_CLEAR/);
  assert.match(main,/a un brouillon non validé/);
  assert.match(main,/draftAnnounced/);
  assert.doesNotMatch(main,/draftHeartbeat/);
  assert.doesNotMatch(main,/4500/);
  assert.match(worker,/FINANCIAL_DRAFT/);
  assert.match(css,/live-cell-draft/);
  const cellBuilder=main.slice(main.indexOf('const makeFinancialEntryCell'),main.indexOf('const ensureMatrixMeeting'));
  assert.doesNotMatch(cellBuilder,/FINANCIAL_DRAFT[^\n]+input\.value/);
});

test('blocking errors are closable and conflicts tell the user how to recover',()=>{
  assert.match(main,/className='error-close'/);
  assert.match(main,/setTimeout\(hideError/);
  assert.match(main,/cliquez sur Actualiser/);
  assert.match(css,/\.error-close/);
});


test('production configuration really activates the Premium Live Ledger path',()=>{
  const wrangler=fs.readFileSync('workers/api/wrangler.toml','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const deploy=fs.readFileSync('.github/workflows/deploy-1.5.2.9-sovereign-offline.yml','utf8');
  assert.match(wrangler,/PREMIUM_LIVE_LEDGER = "true"/);
  assert.match(app,/FINANCIAL_DRAFT'.*FINANCIAL_DRAFT_CLEAR'/);
  assert.match(deploy,/PREMIUM_LIVE_LEDGER_NOT_ACTIVE/);
});


test('soft financial patch preserves queued offline state and skips server refresh until sync',()=>{
  const patch=main.slice(main.indexOf('const patchFinancialDomCell'),main.indexOf('const focusNextFinancialInput'));
  assert.match(patch,/preservePending=false/);
  assert.match(patch,/if\(!preservePending\)\{financialPendingTargets\.delete\(key\);financialReviewTargets\.delete\(key\);\}/);
  const submit=main.slice(main.indexOf('const submitFinancialCellElement'),main.indexOf('const makeFinancialEntryCell'));
  assert.match(submit,/const preservePending=Boolean\(result\?\.status==='QUEUED_SYNC'\|\|result\?\.queued\)/);
  assert.match(submit,/patchFinancialDomCell\(\{meetingId,membershipId,rubricId,amount:displayTarget,cellVersion:result\?\.cellVersion,preservePending\}\)/);
  assert.match(submit,/if\(!preservePending&&!FREE_CONSERVATION_MODE\)void pollCanonicalFinancialSnapshot\(\)/);
  assert.match(main,/FREE_CONSERVATION_MODE=true/);
  assert.doesNotMatch(submit,/if\(!preservePending\)void pollCanonicalFinancialSnapshot\(\)/);
  assert.doesNotMatch(submit,/if\(!preservePending\)void refreshFinancialProjectionSilently/);
  assert.match(submit,/detail:\{meetingId,membershipId,rubricId,amount:displayTarget,cellVersion:result\?\.cellVersion,soft:true,preservePending\}/);
});
