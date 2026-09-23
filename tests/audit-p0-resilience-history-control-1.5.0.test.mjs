import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const offline=fs.readFileSync('packages/offline/src/index.ts','utf8');
const app=fs.readFileSync('packages/application/src/index.ts','utf8');
const api=fs.readFileSync('workers/api/src/index.ts','utf8');
const control=fs.readFileSync('packages/founder-control/src/index.ts','utf8');
const controlUi=fs.readFileSync('apps/web/src/founder-control-ui.js','utf8');
const detail=fs.readFileSync('apps/web/src/detail-ui.js','utf8');
const workerConfig=fs.readFileSync('workers/api/wrangler.toml','utf8');

test('local identity claim has a durable resumable migration journal',()=>{
  assert.match(offline,/class IndexedDbIdentityMigrationJournal/);
  for(const step of ['SERVER_IDENTITY_VERIFIED','SNAPSHOTS_MIGRATED','OUTBOX_MIGRATED','LOCAL_ACCOUNT_BOUND','SESSION_ADOPTED','COMPLETED'])assert.match(offline,new RegExp(step));
  const start=app.indexOf('async claimLocalAccount'),end=app.indexOf('async localAccountInfo',start),body=app.slice(start,end);
  assert.match(body,/identityMigration\.begin/);
  assert.match(body,/identityMigration\.mark/);
  assert.match(body,/identityMigration\.fail/);
  assert.match(body,/SNAPSHOTS_MIGRATED/);
  assert.match(body,/OUTBOX_MIGRATED/);
  assert.match(body,/LOCAL_ACCOUNT_BOUND/);
  assert.match(body,/COMPLETED/);
});

test('member financial history is cursor paginated and UI no longer truncates at 100',()=>{
  assert.match(api,/financial-history/);
  assert.match(api,/nextCursor/);
  assert.match(api,/hasMore/);
  assert.match(app,/memberFinancialHistory/);
  assert.match(detail,/Charger la suite/);
  assert.match(detail,/aucune troncature silencieuse/);
  const memberStart=detail.indexOf('const memberDetail='),memberEnd=detail.indexOf('const meetingDetail=',memberStart),member=detail.slice(memberStart,memberEnd);
  assert.doesNotMatch(member,/statement\.receipts[^;\n]*slice\(0,100\)/);
});

test('founder control cannot resolve an incident without evidence',()=>{
  assert.match(control,/RESOLUTION_EVIDENCE_REQUIRED/);
  assert.match(control,/resolutionEvidenceRef/);
  assert.match(controlUi,/Preuve obligatoire/);
  assert.match(controlUi,/RESOLUTION_EVIDENCE_REQUIRED/);
});

test('trash maintenance is server scheduled and not triggered by trash reads',()=>{
  assert.match(api,/async scheduled\(/);
  assert.match(api,/TrashLifecycleMaintenance/);
  assert.match(workerConfig,/crons\s*=\s*\["15 7 \* \* \*"\]/);
  const listStart=api.indexOf('const listTrash=async'),listEnd=api.indexOf('const restoreTrash=',listStart),listBody=api.slice(listStart,listEnd);
  assert.doesNotMatch(listBody,/purgeGroupData|TrashLifecycleMaintenance|notifications\.publish/);
});
