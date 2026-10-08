import {currentRelease,currentQuery} from './release-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('manager Relay exchanges durable intents without becoming a second ledger',async()=>{
  const [app,ui,main,localRoom]=await Promise.all([
    readFile('packages/application/src/index.ts','utf8'),
    readFile('apps/web/src/sovereign-offline-ui.js','utf8'),
    readFile('apps/web/src/main.js','utf8'),
    readFile('packages/relay/src/local-room.ts','utf8')
  ]);
  assert.match(app,/ECO_MANAGER_DELTA_2/);
  assert.match(app,/managerRelayIntents/);
  assert.match(app,/relayManagerFinancialTargets/);
  assert.match(app,/importLocalRoomManagerDelta/);
  assert.match(app,/resolveLocalRoomManagerConflict/);
  assert.match(app,/\[ECO_RELAY_RESOLUTION\]/);
  const importBlock=app.slice(app.indexOf('async importLocalRoomManagerDelta'),app.indexOf('async ecoRelayFerryPackets'));
  assert.match(importBlock,/saveCached/);
  assert.doesNotMatch(importBlock,/outbox\.enqueue/);
  assert.match(app,/row\.path==='\/api\/v1\/groups'.*filter\(g=>String\(g\?\.id/s);
  assert.match(ui,/Confronter \/ intégrer gestionnaires/);
  assert.match(ui,/Retenir ici/);
  assert.match(ui,/Retenir l’autre/);
  assert.match(ui,/Appliquer les recommandations chronologiques/);
  assert.match(main,/Reçu via Eco Relay · serveur non requis pour continuer/);
  assert.match(main,/localRelayGroupStructure/);
  assert.match(app,/transportUnavailableUntil/);
  assert.match(app,/markTransportUnavailable/);
  assert.match(app,/timeoutMs=formUpload\?30000:eventCritical\?2200:6500/);
  assert.match(main,/Local actif · serveur momentanément absent/);
  assert.match(localRoom,/iceServers:\[\]/);
});

test('member ferry is opaque, bounded and opportunistic',async()=>{
  const [app,api,ui,contract,sw]=await Promise.all([
    readFile('packages/application/src/index.ts','utf8'),
    readFile('workers/api/src/index.ts','utf8'),
    readFile('apps/web/src/sovereign-offline-ui.js','utf8'),
    readFile('docs/release/CURRENT_RELEASE_CONTRACT.json','utf8'),
    readFile('apps/web/sw.js','utf8')
  ]);
  assert.match(app,/prepareManagerFerryPackets/);
  assert.match(app,/transportProfile:'FERRY_COMPACT_V1'/);
  assert.match(app,/const budget=90000/);
  assert.match(app,/slice\(0,6\)/);
  assert.match(app,/syncEcoRelayFerry/);
  assert.match(api,/ferry-sync/);
  assert.match(api,/requireGroup\(groupId,false\)/);
  assert.match(api,/OFFLINE\.RELAY_FERRY/);
  assert.match(api,/Opaque store-and-forward packet/);
  assert.match(api,/packets\.length>6/);
  assert.match(api,/out\.length>=12/);
  const ferryBlock=api.slice(api.indexOf('const ferryMatch='),api.indexOf("if(request.method==='POST'&&url.pathname==='/api/v1/outbox/apply')"));
  assert.doesNotMatch(ferryBlock,/applyOutboxItem\(/);
  assert.doesNotMatch(ferryBlock,/ledger\./);
  assert.match(ui,/Profiter de cette connexion Internet/);
  assert.match(ui,/sans polling continu/);
  assert.match(ui,/FERRY_PACKET_BATCH/);
  const release=JSON.parse(contract);
  assert.ok(release.release.buildId.includes(release.release.version.split('-')[0]));
  assert.equal(release.release.pwaCache,currentRelease.pwaCache);
  assert.notEqual(release.release.previousPwaCache,release.release.pwaCache);
  assert.ok(sw.includes(currentRelease.pwaCache));
});

test('critical group cycle remains represented by local durable owners',async()=>{
  const app=await readFile('packages/application/src/index.ts','utf8');
  for(const command of [
    'GROUP_PROJECT_CONVERT_V1','MEMBER_ADD_V1','MEETING_OPEN_V1','MEETING_CLOSE_V1',
    'RUBRIC_CREATE_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2','LOAN_DISBURSE_V1',
    'LOAN_REPAY_V1','COMPLETION_CREATE_V1','COMPLETION_TRANSITION_V1',
    'GROUP_EXERCISE_LABEL_V1','TONTINE_SERVE_V1'
  ]) assert.match(app,new RegExp(command));
  assert.match(app,/createGroupFromProject\(projectId:string\)/);
  assert.match(app,/async openExercise/);
  assert.match(app,/async closeExercise/);
  assert.match(app,/async carryForwardExercise/);
});
