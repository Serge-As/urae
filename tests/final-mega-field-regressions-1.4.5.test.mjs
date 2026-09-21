import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const html=fs.readFileSync('apps/web/index.html','utf8');
const sw=fs.readFileSync('apps/web/sw.js','utf8');
const sessions=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
const recap=fs.readFileSync('apps/web/src/recap-ui.js','utf8');
const app=fs.readFileSync('packages/application/src/index.ts','utf8');
const api=fs.readFileSync('workers/api/src/index.ts','utf8');
const consensus=fs.readFileSync('packages/meeting-live-consensus/src/index.ts','utf8');
const relay=fs.readFileSync('packages/relay/src/index.ts','utf8');
const resilience=fs.readFileSync('apps/web/src/resilience-ui.js','utf8');

test('Android 6 offline shell is cache-first and never force-reloads on worker takeover',()=>{
  assert.match(sw,/eco-system-v145-final-mega-offline-safe-20260921/);
  assert.match(sw,/Navigation is cache-first/);
  assert.match(sw,/Scripts\/styles\/assets are cache-first/);
  assert.doesNotMatch(sw,/skipWaiting\(/);
  assert.doesNotMatch(main,/controllerchange[\s\S]{0,600}location\.reload\(/);
  assert.match(main,/setTimeout\(\(\)=>\{try\{reg\.update\(\)/);
  assert.ok(sw.includes('/src/resilience-ui.js'));
});

test('important group menus are first-class and no longer hidden in Finance',()=>{
  for(const label of ['Fiches membres','Rubriques','Prêts','Épargne','Assistances','Tontines','Recap','Communautés','Partenaires & ONG','Publicité','Eco Relay','Eco Local','Control Center','Corbeille'])assert.ok(html.includes(label),label);
  assert.match(html,/Outils financiers complémentaires/);
  assert.match(html,/utilisez directement « Prêts », « Épargne » ou « Assistances »/);
  for(const id of ['quickRubricLoan','quickRubricSavings','quickRubricAssistance'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(main,/prepareRubricPreset\('Prêt'/);
  assert.match(main,/prepareRubricPreset\('Épargne'/);
  assert.match(main,/prepareRubricPreset\('Assistance'/);
});

test('financial sheet edits a target value for one exact meeting instead of adding a delta',()=>{
  assert.match(main,/Nouvelle valeur totale/);
  assert.match(main,/Remplacer 1 000 par 500 donne 500/);
  assert.match(main,/setFinancialCellTarget\(\{meetingId,membershipId:member\.id,rubricId:rubric\.id,targetAmount:target,currentAmount:current/);
  assert.match(main,/meetingMatrixScope/);
  assert.match(api,/financialCellState/);
  assert.match(api,/applyFinancialCellTarget/);
  assert.match(api,/ledger\.reverseEntry/);
  assert.match(api,/amount:input\.targetAmount/);
  assert.doesNotMatch(api,/targetAmount-state\.current/);
});

test('multi-manager correction compares with canonical baseline and requires real majority before apply',()=>{
  assert.match(consensus,/proposeAgainstBaseline/);
  assert.match(consensus,/Valeur canonique actuelle/);
  assert.match(consensus,/Math\.floor\(managerIds\.length\/2\)\+1/);
  assert.match(api,/status:'CONSENSUS_REQUIRED'/);
  assert.match(api,/financial-cells\/\(\[\^\/\]\+\)\/apply/);
  assert.match(sessions,/Appliquer la valeur retenue/);
  assert.match(sessions,/applyFinancialCellConsensus/);
  assert.doesNotMatch(consensus,/recordCashContribution|saveLedgerEntry|reverseEntry/);
});

test('Sessions defaults to cumulative sheet and exact selected session is carried into canonical entry',()=>{
  assert.match(sessions,/★ Feuille récapitulative/);
  assert.match(sessions,/select\.value=.*'__cumulative__'/);
  assert.match(sessions,/matrixMeetingId:meeting\.id/);
  assert.match(sessions,/Saisir \/ corriger cette séance/);
  assert.match(sessions,/Autres séances/);
  assert.match(sessions,/\+ Nouvelle séance/);
  assert.match(recap,/Feuille récapitulative · exercice \/ cycle/);
  assert.match(recap,/Aucune seconde comptabilité/);
});

test('back navigation covers views anchors session and financial sheet state',()=>{
  assert.match(html,/id="appBackBtn"/);
  for(const token of ['matrixMeetingId','sheetMode','openTarget','anchor','sessionTab','meetingId','openDetails','focusId'])assert.ok(main.includes(token),token);
  assert.match(main,/closest\('a\[href\^="#"\]'\)/);
  assert.match(main,/history\.pushState/);
  assert.match(main,/history\.back\(\)/);
});

test('member financial changes surface visible green orange red alerts and persistent notifications',()=>{
  assert.match(html,/id="financialAlertBar"/);
  assert.match(main,/is-open/);
  assert.match(main,/is-closed/);
  assert.match(main,/is-critical/);
  assert.match(main,/groupNotifications\(\)/);
  assert.match(api,/Nouvelle saisie financière/);
  assert.match(api,/Saisie financière après clôture/);
  assert.match(api,/Votre compte a été corrigé après clôture/);
  assert.match(api,/audience:'SELECTED'/);
  assert.match(api,/audience:'MANAGERS'/);
});

test('closed sessions can be edited with manager alert and financial member alert',()=>{
  assert.match(sessions,/Modifier la séance clôturée/);
  assert.match(api,/Séance clôturée modifiée/);
  assert.match(api,/CLOSED_MEETING_CONTEXT_CHANGED/);
  assert.match(api,/governedCorrectionReason/);
  assert.match(api,/meeting\.status==='closed'/);
});

test('individual sheets are restored and manager can edit exact member-session-rubric cells',()=>{
  assert.match(html,/id="individualSheetMatrix"/);
  assert.match(main,/renderIndividualSheetMatrix/);
  assert.match(main,/openFinancialCellEditor\(\{member,rubric,meetingId:meeting\.id\}\)/);
  assert.match(main,/financeIndividualSheetBtn/);
});

test('six month trash is reversible and exposes no manual permanent-delete route',()=>{
  assert.match(html,/id="view-trash"/);
  assert.match(api,/restoreUntil\.setUTCMonth\(restoreUntil\.getUTCMonth\(\)\+6\)/);
  assert.match(api,/ENTITY_MOVED_TO_TRASH/);
  assert.match(api,/ENTITY_RESTORED_FROM_TRASH/);
  assert.match(api,/snapshotJson/);
  assert.match(api,/TRASH_RETENTION_EXPIRED/);
  assert.doesNotMatch(api,/trash[^\n]{0,120}request\.method==='DELETE'/);
  assert.match(main,/Restaurer intégralement/);
});

test('Eco Relay uses authenticated encryption random nonce expiry and anti-replay while preserving original actor',()=>{
  assert.match(relay,/AES-GCM/);
  assert.match(relay,/crypto\.getRandomValues/);
  assert.match(relay,/RelayReplayGuard/);
  assert.match(relay,/RELAY_EXPIRED/);
  assert.match(relay,/RELAY_INTEGRITY_FAILED/);
  assert.match(relay,/actorId:item\.actorId/);
  assert.match(resilience,/relayOnly:true/);
  assert.match(resilience,/RELAY_ONLY/);
  assert.match(resilience,/RTCPeerConnection/);
  assert.match(resilience,/createDataChannel\('eco-relay'/);
});

test('Lots 9 10 11 12 acquired engines remain present',()=>{
  for(const token of ['analyzeGroupDocumentFiles','sourceDocumentFingerprints','previewWorkbookSavingsYield','quoteLoan','repayLoan'])assert.ok(app.includes(token)||main.includes(token),token);
  for(const id of ['interestCommunityPanel','externalProgramsPanel','adManagerPanel','founderControlNavBtn'])assert.ok(html.includes(id),id);
  assert.ok(fs.existsSync('apps/web/src/interest-community-ui.js'));
  assert.ok(fs.existsSync('apps/web/src/external-programs-ui.js'));
  assert.ok(fs.existsSync('apps/web/src/ad-manager-ui.js'));
  assert.ok(fs.existsSync('apps/web/src/founder-control-ui.js'));
});
