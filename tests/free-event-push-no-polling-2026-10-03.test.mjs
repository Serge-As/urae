import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
const hub=fs.readFileSync('workers/api/src/group-live-hub.ts','utf8');
const savings=fs.readFileSync('apps/web/src/savings-yield-ui.js','utf8');
const sessions=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
const completion=fs.readFileSync('apps/web/src/completion-ui.js','utf8');
const app=fs.readFileSync('packages/application/src/index.ts','utf8');

test('idle app emits no recurring live or D1 traffic',()=>{
  assert.doesNotMatch(live,/setInterval\(/);
  assert.match(main,/if\(FREE_CONSERVATION_MODE\)return;/);
  assert.match(main,/if\(FREE_CONSERVATION_MODE\)return;\n  const key=.*financialRetryTimers/s);
  assert.match(savings,/canonicalDirty/);
  assert.doesNotMatch(savings,/setInterval/);
});

test('typing draft validation and abandonment are event-triggered',()=>{
  assert.match(main,/sendSignal\('CELL_FOCUS'\)/);
  assert.match(main,/sendSignal\('TYPING'\)/);
  assert.match(main,/sendSignal\('TYPING_STOP'\)/);
  assert.match(main,/sendSignal\('FINANCIAL_DRAFT'\)/);
  assert.match(main,/sendSignal\('FINANCIAL_DRAFT_CLEAR'\)/);
  assert.match(main,/identityLiveUI\.publishSignal/);
  assert.match(hub,/CLIENT_SIGNAL/);
});

test('validated financial changes push their committed projection without D1 reread',()=>{
  assert.match(worker,/financial-cell-managers:/);
  assert.match(worker,/publishLive/);
  assert.match(main,/applyRemoteFinancialProjection/);
  const block=worker.slice(worker.indexOf('const liveStubFor'),worker.indexOf('const publishLive'));
  assert.doesNotMatch(block,/groupIdentity\.compute/);
});

test('debt savings rubric and offline acquisitions remain present',()=>{
  assert.match(sessions,/savingsYieldSourceData/);
  assert.match(sessions,/nextInterestProjected/);
  assert.match(completion,/renderLoanDebtRecap/);
  assert.match(app,/ensureOfficialRepaymentRubric/);
  assert.match(main,/renderRubricRecapTable/);
  assert.match(savings,/yieldCanonicalTables/);
  assert.match(app,/updateRubricPolicies[\s\S]*queueLocal\('RUBRIC_POLICIES_V1'/);
  assert.match(app,/createCompletion[\s\S]*COMPLETION_CREATE_V1/);
});


test('critical financial write never spends a preliminary auth GET',()=>{
  const guard=app.slice(app.indexOf('private async canAttemptCriticalWrite'),app.indexOf('private async cached'));
  assert.match(guard,/business write is itself the connectivity probe/);
  assert.doesNotMatch(guard,/fetch\(/);
  assert.doesNotMatch(guard,/api\/v1\/auth\/session/);
});
