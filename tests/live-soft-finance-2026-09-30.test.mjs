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

test('live client heals missed durable events while visible',()=>{
  assert.match(live,/catchupTimer/);
  assert.match(live,/1200/);
  assert.match(live,/visibilityState==='visible'/);
  assert.match(live,/catchUp\(\)/);
});

test('server broadcasts canonical financial writes to managers',()=>{
  assert.match(worker,/financial-cell-managers:/);
  assert.match(worker,/operationType:'CASH_CONTRIBUTION'/);
  assert.match(worker,/loan-sheet-live:/);
  assert.match(worker,/loan-repayment-live:/);
});


test('financial live exposes a draft-presence signal without broadcasting the draft amount',()=>{
  assert.match(main,/FINANCIAL_DRAFT/);
  assert.match(main,/FINANCIAL_DRAFT_CLEAR/);
  assert.match(main,/a un brouillon non validé/);
  assert.match(main,/4500/);
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
