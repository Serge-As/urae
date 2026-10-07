import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const html=fs.readFileSync('apps/web/index.html','utf8');
const sw=fs.readFileSync('apps/web/sw.js','utf8');
const sessions=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
const detail=fs.readFileSync('apps/web/src/detail-ui.js','utf8');
const personal=fs.readFileSync('apps/web/src/personal-cockpit-ui.js','utf8');
const operational=fs.readFileSync('packages/operational-cockpit/src/index.ts','utf8');
const loanSimulator=fs.readFileSync('packages/loan-simulator/src/index.ts','utf8');
const recap=fs.readFileSync('apps/web/src/recap-ui.js','utf8');
const app=fs.readFileSync('packages/application/src/index.ts','utf8');
const api=fs.readFileSync('workers/api/src/index.ts','utf8');
const domain=fs.readFileSync('packages/domain/src/index.ts','utf8');
const consensus=fs.readFileSync('packages/meeting-live-consensus/src/index.ts','utf8');
const relay=fs.readFileSync('packages/relay/src/index.ts','utf8');
const resilience=fs.readFileSync('apps/web/src/resilience-ui.js','utf8');
const trashLifecycle=fs.readFileSync('packages/trash-lifecycle/src/index.ts','utf8');
const repositories=fs.readFileSync('packages/repositories/src/index.ts','utf8');

test('Android 6 offline shell remains bounded and never force-reloads a live page on worker takeover',()=>{
  assert.match(sw,/const CACHE = 'eco-system-v15211-sovereign-relay-20261007'/);
  assert.match(sw,/PREVIOUS_CACHE = 'eco-system-v15211-data-first-confrontation-20261007'/);
  assert.match(sw,/RELEASE_ASSET_TIMEOUT/);
  assert.match(sw,/Scripts\/styles\/assets are cache-first/);
  assert.match(sw,/skipWaiting\(/);
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
  assert.match(main,/setFinancialCellTarget\(\{meetingId,membershipId,rubricId,targetAmount:target,currentAmount:current/);
  assert.match(main,/makeFinancialEntryCell/);
  assert.match(main,/cell-target-input/);
  assert.match(main,/cell-validate/);
  assert.match(main,/meetingMatrixScope/);
  assert.match(api,/financialCellState/);
  assert.match(api,/applyFinancialCellTarget/);
  const targetStart=api.indexOf('const applyFinancialCellTarget='),targetEnd=api.indexOf('\n  const jsonStringArray=',targetStart),targetBody=api.slice(targetStart,targetEnd);
  assert.match(targetBody,/replaceCashContributionCell/);
  assert.match(targetBody,/targetAmount:input\.targetAmount/);
  assert.doesNotMatch(targetBody,/ledger\.reverseEntry|ledger\.recordCashContribution/);
  assert.doesNotMatch(targetBody,/targetAmount-state\.current/);
});

test('multi-manager correction applies immediately while explicit dissent keeps the governed confrontation path',()=>{
  assert.match(api,/manager validation writes immediately/);
  assert.match(api,/applyFinancialCellTarget/);
  assert.doesNotMatch(api,/const needsConsensus=meeting\.status==='closed'/);
  assert.match(consensus,/proposeAgainstBaseline/);
  assert.match(consensus,/Math\.floor\(managerIds\.length\/2\)\+1/);
  assert.ok(api.includes("financial-cells\\/([^/]+)\\/apply"));
  assert.match(sessions,/Corriger la valeur canonique avec la résolution/);
  assert.match(sessions,/applyFinancialCellConsensus/);
  assert.match(sessions,/Une réserve ne bloque jamais la valeur courante/);
  assert.doesNotMatch(sessions,/validation d’un second responsable requise/);
  assert.doesNotMatch(consensus,/recordCashContribution|saveLedgerEntry|reverseEntry/);
});

test('Sessions defaults to cumulative sheet and exact selected session is carried into canonical entry',()=>{
  assert.match(sessions,/★ Feuille récapitulative/);
  assert.match(sessions,/select\.value=.*'__cumulative__'/);
  assert.match(sessions,/host\.dataset\.meetingId=meeting\.id/);assert.match(sessions,/eco:render-canonical-financial-table/);
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
  assert.match(api,/replaceCashContributionCell/);
  assert.match(api,/meeting\.status==='closed'/);
  assert.match(domain,/Correction après clôture/);
});

test('individual sheets are restored and manager can edit exact member-session-rubric cells',()=>{
  assert.match(html,/id="individualSheetMatrix"/);
  assert.match(main,/renderIndividualSheetMatrix/);
  assert.match(main,/makeFinancialEntryCell\(\{member,rubric:r,meetingId:meeting\.id/);assert.match(main,/TOTAL COLONNES/);
  assert.match(main,/financeIndividualSheetBtn/);
});

test('member management removes inline trash risk and supports rename and ordering',()=>{
  assert.match(html,/id="memberSort"/);
  assert.match(html,/id="memberManageSelect"/);
  assert.match(html,/id="memberRenameBtn"/);
  assert.match(html,/id="memberTrashBtn"/);
  assert.match(main,/updateMemberName/);
  assert.doesNotMatch(main,/li\.append\(remove\)/);
});

test('detail sheet delegates financial editing to the one canonical table owner',()=>{
  assert.match(detail,/canonical-financial-table-host/);
  assert.match(detail,/eco:render-canonical-financial-table/);
  assert.match(detail,/même remplacement exact/);
  assert.doesNotMatch(detail,/setFinancialCellTarget/);
  assert.match(main,/setFinancialCellTarget/);
  assert.match(main,/Nouvelle valeur totale/);
  assert.match(detail,/Prêts \/ capital dû/);
});

test('member and session histories expose human-readable financial provenance',()=>{
  assert.match(main,/Historique des contributions et modifications/);
  assert.match(main,/Capital prêts \/ dettes/);
  assert.match(sessions,/meetingHistory\(meeting\.id\)/);
  assert.match(sessions,/Modification financière/);
  assert.match(api,/receivedByName/);
  assert.match(api,/debtPrincipal/);
  assert.match(api,/meetingHistoryRoute/);
});

test('six month trash is calendar-correct reversible and final purge is system-owned',()=>{
  assert.match(html,/id="view-trash"/);
  assert.match(api,/addCalendarMonthsClamped\(now,6\)/);
  assert.match(api,/ENTITY_MOVED_TO_TRASH/);
  assert.match(api,/ENTITY_RESTORED_FROM_TRASH/);
  assert.match(api,/snapshotJson/);
  assert.match(api,/commitTrashLifecycle/);
  assert.doesNotMatch(api,/trash[^\n]{0,120}request\.method==='DELETE'/);
  assert.match(repositories,/group_purge_execution_guards/);
  assert.match(trashLifecycle,/TRASH\.ARTIFACT_CLEANUP/);
  assert.match(trashLifecycle,/captureGroupPurgeManifest/);
  assert.match(trashLifecycle,/purgeGroupData/);
  assert.match(trashLifecycle,/Rappel · groupe dans la corbeille/);
  assert.match(repositories,/purged_group_tombstones/);
  assert.match(repositories,/DELETE FROM platform_records WHERE tenant_id=\? AND group_id=\?/);
  assert.match(main,/Restaurer intégralement/);
  assert.match(api,/kind==='GROUP'/);
  assert.match(api,/remindersEnabled/);
  assert.match(app,/groupTrashItems/);
  assert.match(main,/Ne plus me rappeler chaque mois/);
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
  for(const token of ['analyzeGroupDocumentFiles','fingerprints:string[]','previewWorkbookSavingsYield','quoteLoan','repayLoan'])assert.ok(app.includes(token)||main.includes(token),token);
  for(const id of ['interestCommunityPanel','externalProgramsPanel','adManagerPanel','founderControlNavBtn'])assert.ok(html.includes(id),id);
  assert.ok(fs.existsSync('apps/web/src/interest-community-ui.js'));
  assert.ok(fs.existsSync('apps/web/src/external-programs-ui.js'));
  assert.ok(fs.existsSync('apps/web/src/ad-manager-ui.js'));
  assert.ok(fs.existsSync('apps/web/src/founder-control-ui.js'));
});

test('loan is a negative member position and simulation is available to member and manager',()=>{
  assert.match(operational,/legacyLoanOutflow/);
  assert.match(operational,/polarity:isLoanRubric\(r\)\?'NEGATIVE':'POSITIVE'/);
  assert.match(personal,/Position après dettes/);
  assert.match(personal,/openLoanSimulationDialog/);
  assert.match(loanSimulator,/openingInterestDue/);
  assert.match(app,/simulateLoan/);
  assert.match(app,/loanHistory/);
});

test('stale cached html recovers to the coherent 1.5.2.11 shell while preserving the previous release',()=>{
  assert.match(main,/document\.querySelector\('#claimLocalAccountBtn'\)\?\.addEventListener/);
  assert.doesNotMatch(main,/\$\('#claimLocalAccountBtn'\)\.addEventListener/);
  assert.match(sw,/const CACHE = 'eco-system-v15211-sovereign-relay-20261007'/);
  assert.match(sw,/PREVIOUS_CACHE = 'eco-system-v15211-data-first-confrontation-20261007'/);
  assert.match(html,/ECO-SYSTEM · 1\.5\.2\.11/);
  assert.match(html,/main\.js\?v=15211/);
  const current=sw.match(/const CACHE = '([^']+)';/)?.[1],previous=sw.match(/const PREVIOUS_CACHE = '([^']+)';/)?.[1];
  assert.ok(current&&previous&&current!==previous,'current release and rollback release must be distinct coherent caches');
  assert.match(sw,/coherent installed shell is the navigation source of truth/);
});
