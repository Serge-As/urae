import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('packages/application/src/index.ts','utf8');
const main=fs.readFileSync('apps/web/src/main.js','utf8');
const hub=fs.readFileSync('workers/api/src/group-live-hub.ts','utf8');
const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
const deploy=fs.readFileSync('.github/workflows/deploy-1.5.2.9-sovereign-offline.yml','utf8');

test('online financial writes probe real server instead of stale cached-read state',()=>{
  assert.match(app,/canAttemptCriticalWrite/);
  assert.match(app,/bypassing read-snapshot fallback/);
  assert.match(app,/setFinancialCellTarget[\s\S]*canAttemptCriticalWrite/);
  assert.match(app,/recordFinancialSheetEntry[\s\S]*canAttemptCriticalWrite/);
});

test('free conservation keeps targeted patching but disables automatic queue and snapshot loops',()=>{
  assert.match(main,/scheduleFinancialOutboxRecovery/);
  assert.match(main,/financialCellSnapshot/);
  assert.match(main,/pollCanonicalFinancialSnapshot/);
  assert.match(main,/if\(FREE_CONSERVATION_MODE\)return;/);
  assert.match(main,/previous!==signature/);
  assert.match(main,/financialSnapshotGroup/);
  const submit=main.slice(main.indexOf('const submitFinancialCellElement'),main.indexOf('const makeFinancialEntryCell'));
  assert.doesNotMatch(submit,/await renderLedger\(\)/);
  assert.doesNotMatch(submit,/sessionsUI\.refresh/);
});

test('typing is pure push while only actual draft state survives websocket hibernation',()=>{
  assert.match(hub,/TYPING \/ FOCUS \/ BLUR are pure push/);
  assert.match(hub,/Only an actual draft state change is retained/);
  assert.match(hub,/signal-actor:[^\n]*:draft/);
  assert.match(hub,/ttlMs:12000/);
  assert.doesNotMatch(hub,/payload\.amount/);
});

test('server exposes compact financial cell snapshot and deployment cannot roll back production',()=>{
  assert.match(worker,/financial-cells\\\/snapshot/);
  assert.match(worker,/watermark/);
  assert.match(deploy,/Refuse stale production overwrite/);
  assert.match(deploy,/git merge-base --is-ancestor/);
  assert.match(deploy,/fetch-depth: 0/);
});
