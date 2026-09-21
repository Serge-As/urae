import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Outbox} from '../.build/packages/offline/src/index.js';

const application=fs.readFileSync('packages/application/src/index.ts','utf8');
const api=fs.readFileSync('workers/api/src/index.ts','utf8');
const sessions=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
const main=fs.readFileSync('apps/web/src/main.js','utf8');
const html=fs.readFileSync('apps/web/index.html','utf8');
const consensus=fs.readFileSync('packages/meeting-live-consensus/src/index.ts','utf8');

test('mega lot keeps one canonical offline replay path for core group operations',()=>{
  for(const type of [
    'GROUP_PROJECT_UPSERT_V1','GROUP_PROJECT_CONVERT_V1','MEMBER_ADD_V1','RUBRIC_CREATE_V1',
    'RUBRIC_ACTIVITY_PLAN_V1','RUBRIC_MODEL_V1','RUBRIC_POLICIES_V1','GROUP_POLICY_V1',
    'MEETING_OPEN_V1','MEETING_CONTEXT_V1','MEETING_ATTENDANCE_V1','MEETING_BENEFIT_V1',
    'MEETING_BENEFIT_EVIDENCE_V1','MEETING_DISTRIBUTION_V1','MEETING_CLOSE_V1','CASHBOX_RECONCILE_V1','CONTRIBUTION_CASH_RECORDED',
    'FINANCIAL_NOTICE_CONFIRM_V1','FINANCIAL_NOTICE_RESERVE_V1','FINANCIAL_NOTICE_OFFICER_REVIEW_V1','FINANCIAL_NOTICE_MEMBER_REVIEW_V1'
  ]){
    assert.ok(application.includes(type)||type==='MEETING_CLOSE_V1'||type==='CASHBOX_RECONCILE_V1',type);
    assert.ok(api.includes(type),type+' server replay');
  }
  assert.match(api,/\/api\/v1\/outbox\/apply/);
  assert.match(api,/ledger\.recordCashContribution/);
  assert.match(api,/meetings\.recordAttendance/);
  assert.match(api,/rubrics\.updateOperatingModel/);
});

test('lot 2 cumulative sheet is immediately after session sheet and remains a ledger projection',()=>{
  const sessionIndex=html.indexOf('data-session-tab="sheet"'),cumulativeIndex=html.indexOf('data-session-tab="cumulative"'),attendanceIndex=html.indexOf('data-session-tab="attendance"');
  assert.ok(sessionIndex>=0&&sessionIndex<cumulativeIndex&&cumulativeIndex<attendanceIndex);
  assert.match(sessions,/Feuille de saisie récapitulative/);
  assert.match(sessions,/app\.ledger\(\)/);
  assert.match(sessions,/ne crée pas une seconde comptabilité/);
});

test('lot 3 restores view session tab selected meeting details scroll and focus without storing secrets',()=>{
  for(const token of ['captureNavState','sessionTab','meetingId','openDetails','scrollY','focusId','goBack','popstate'])assert.ok(main.includes(token),token);
  assert.doesNotMatch(main,/captureNavState[\s\S]{0,2500}(password|pin|token|secret)/i);
});

test('lot 4 keeps manager proposals votes majority and dissent reserve separate from ledger',()=>{
  for(const token of ['DIVERGENT','MAJORITY_SELECTED','UNANIMOUS','RESERVE_OPEN','LIVE_DATA_DIVERGENCE','stableColor'])assert.ok(consensus.includes(token),token);
  assert.match(sessions,/Confronter les (?:saisies|données)/);
  assert.match(sessions,/reserveLiveConsensus/);
  assert.doesNotMatch(consensus,/recordCashContribution|saveLedgerEntry|postLedger/);
  assert.match(api,/CONSENSUS_UNRESOLVED/);
  assert.match(api,/new MeetingLiveConsensusService\(repo,kernel\)\.list\(groupId,meetingId\)/);
});

test('lot 7 member financial control remains confirm or reserve with live refresh',()=>{
  const member=fs.readFileSync('apps/web/src/member-control-ui.js','utf8');
  const identity=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
  assert.match(member,/Valider (?:la )?transaction/);
  assert.match(member,/Émettre une réserve/);
  assert.match(member,/eco:financial-live-update/);
  assert.match(identity,/MEMBER_PROJECTION_UPDATED/);
  for(const type of ['FINANCIAL_NOTICE_CONFIRM_V1','FINANCIAL_NOTICE_RESERVE_V1','FINANCIAL_NOTICE_OFFICER_REVIEW_V1','FINANCIAL_NOTICE_MEMBER_REVIEW_V1'])assert.ok(application.includes(type),type);
});

test('lots 8 and 9 retain canonical finance, savings yield, assistance and multi-document RI paths',()=>{
  for(const token of ['previewWorkbookSavingsYield','previewCapitalAtWorkYield','previewCapitalTimeYield','previewAttributedProductiveYield','previewFinancialRecap','quoteLoan','repayLoan'])assert.ok(application.includes(token),token);
  assert.match(application,/analyzeGroupDocumentFiles/);
  assert.match(api,/analyze-files/);
  for(const token of ["'IMAGE'","'PDF'","'DOCUMENT'","'LEGACY_WORD'"])assert.ok(api.includes(token),token);
  const launchStudio=fs.readFileSync('apps/web/src/launch-studio.js','utf8');
  assert.match(launchStudio,/sourceDocumentFingerprints/);
});

test('lot 13 stops automatic retry storms but permits deliberate operator recovery',async()=>{
  const outbox=new Outbox();
  outbox.enqueue({tenantId:'t',actorId:'a',type:'X',payload:{},idempotencyKey:'k'});
  for(let i=0;i<8;i++)await outbox.sync(async()=>({ok:false}));
  let item=outbox.list()[0];
  assert.equal(item.attempts,5);
  assert.equal(item.status,'FAILED');
  outbox.retry(item.id);item=outbox.list()[0];
  assert.equal(item.attempts,0);
  assert.equal(item.status,'PENDING');
});
