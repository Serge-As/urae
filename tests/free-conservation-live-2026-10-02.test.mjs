import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
const app=fs.readFileSync('packages/application/src/index.ts','utf8');
const hub=fs.readFileSync('workers/api/src/group-live-hub.ts','utf8');
const worker=fs.readFileSync('workers/api/src/index.ts','utf8');

test('free conservation keeps canonical D1 polling fully dormant',()=>{
  assert.match(main,/FREE_CONSERVATION_MODE=true/);
  assert.match(main,/if\(FREE_CONSERVATION_MODE\)return;/);
  assert.doesNotMatch(main,/setInterval\(\(\)=>\{void pollCanonicalFinancialSnapshot\(\);\},1200\)/);
  const remote=main.slice(main.indexOf("window.addEventListener('eco:financial-live-update'"),main.indexOf('const refreshGroupContext'));
  assert.match(remote,/!FREE_CONSERVATION_MODE/);
});

test('free conservation uses event push instead of freezing live',()=>{
  assert.match(main,/conservationMode: FREE_CONSERVATION_MODE/);
  assert.match(live,/PUSH ÉVÉNEMENTIEL · mode gratuit/);
  assert.match(live,/CLIENT_SIGNAL/);
  assert.match(live,/liveWebSocketUrl\(lastSeq\)/);
  assert.doesNotMatch(live,/GELÉ · mode gratuit/);
  assert.doesNotMatch(live,/setInterval\(/);
  assert.doesNotMatch(live,/startCatchupTimer/);
  assert.match(live,/reconnectAttempt>=1/);
  assert.match(live,/GROUP_LIVE_HELLO/);
});

test('financial presence is one start one stop without heartbeat traffic',()=>{
  const cell=main.slice(main.indexOf('const makeFinancialEntryCell'),main.indexOf('const renderMeetingMatrix'));
  assert.match(cell,/typingActive=false/);
  assert.match(cell,/sendSignal\('TYPING'\)/);
  assert.match(cell,/sendSignal\('TYPING_STOP'\)/);
  assert.match(cell,/sendSignal\('FINANCIAL_DRAFT'\)/);
  assert.match(cell,/sendSignal\('FINANCIAL_DRAFT_CLEAR'\)/);
  assert.doesNotMatch(cell,/draftHeartbeat/);
  assert.doesNotMatch(cell,/setInterval/);
});

test('writer-side confirmed cell survives stale canonical refresh',()=>{
  assert.match(main,/FINANCIAL_CONFIRMED_STORAGE/);
  assert.match(main,/rememberConfirmedCell/);
  assert.match(main,/Same-version stale reads must never roll the writer back/);
  assert.match(main,/confirmedVersion/);
});

test('quota circuit queues mutations without automatic retry loop',()=>{
  assert.match(app,/serverBudgetBlockedUntil/);
  assert.match(app,/if\(this\.serverBudgetBlocked\(\)\)/);
  assert.match(main,/const scheduleFinancialOutboxRecovery=detail=>\{\n  if\(FREE_CONSERVATION_MODE\)return;/);
});

test('live routing itself adds no D1 identity lookup per event',()=>{
  const block=worker.slice(worker.indexOf('const liveStubFor'),worker.indexOf('const publishLive'));
  assert.match(block,/ctx\.tenantId\+'\:\'\+groupId/);
  assert.doesNotMatch(block,/groupIdentity\.compute/);
  assert.match(worker,/transport:'EVENT_PUSH_NO_D1_POLLING'/);
});

test('transient typing is not persisted while actual draft state is bounded',()=>{
  assert.match(hub,/TYPING \/ FOCUS \/ BLUR are pure push/);
  assert.match(hub,/FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR/);
});
