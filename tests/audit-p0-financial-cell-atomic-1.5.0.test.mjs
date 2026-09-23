import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';

const entry=(id,key,debit,credit,reverseOf)=>({
  id,tenantId:'t',groupId:'g',currency:'XAF',descriptionCode:reverseOf?'LEDGER_REVERSAL':'LEDGER_CASH_CONTRIBUTION',
  sourceType:reverseOf?'ledger_reversal':'membership_contribution',sourceId:reverseOf??'m',
  idempotencyKey:key,createdAt:'2026-09-23T00:00:00.000Z',createdBy:'manager',meetingId:'meet',
  reversalOfEntryId:reverseOf,
  lines:[
    {accountId:'cash',debit,credit:0,memoCode:'A'},
    {accountId:'funds',debit:0,credit,memoCode:'B'}
  ]
});

test('atomic correction repository commits reversal replacement receipt audit and outbox as one plan',()=>{
  const repo=new InMemoryPlatformRepository();
  const reversal={
    id:'rev',tenantId:'t',groupId:'g',currency:'XAF',descriptionCode:'LEDGER_REVERSAL',sourceType:'ledger_reversal',sourceId:'old',
    idempotencyKey:'op:rev',createdAt:'2026-09-23T00:00:00.000Z',createdBy:'manager',meetingId:'meet',reversalOfEntryId:'old',
    lines:[{accountId:'cash',debit:0,credit:1000,memoCode:'REV'},{accountId:'funds',debit:1000,credit:0,memoCode:'REV'}]
  };
  const replacement=entry('new','op:replacement',500,500);
  const receipt={id:'receipt',tenantId:'t',groupId:'g',membershipId:'m',amount:{currency:'XAF',amount:500},paymentMethod:'cash',ledgerEntryId:'new',meetingId:'meet',rubricId:'r',receivedAt:'2026-09-23T00:00:00.000Z',receivedBy:'manager',idempotencyKey:'op:replacement'};
  const audit={id:'audit',tenantId:'t',actorId:'manager',action:'FINANCIAL_CELL_CORRECTED',targetType:'financial_cell',targetId:'cell',at:'2026-09-23T00:00:00.000Z'};
  const outbox={id:'outbox',tenantId:'t',groupId:'g',moduleId:'FINANCE.CORRECTION_OUTBOX',title:'Correction',status:'ACTIVE',tags:['pending'],data:{},createdBy:'manager',createdAt:'2026-09-23T00:00:00.000Z',updatedAt:'2026-09-23T00:00:00.000Z'};
  const plan={kind:'cell_correction',operationId:'corr',idempotencyKey:'op',intentFingerprint:'fingerprint',tenantId:'t',groupId:'g',primaryEntryId:'new',entries:[reversal,replacement],receipt,accounts:[],audits:[audit],cellRevision:{meetingId:'meet',membershipId:'m',rubricId:'r',currency:'XAF',expectedVersion:0,nextVersion:1},outboxRecords:[outbox]};
  const committed=repo.commitFinancialCorrection(plan);
  assert.equal(committed.operationId,'corr');
  assert.equal(repo.listLedgerEntries('t','g').length,2);
  assert.equal(repo.listContributionReceipts('t','g').length,1);
  assert.equal(repo.listAudit('t').some(x=>x.id==='audit'),true);
  assert.equal(repo.getWorkspaceRecord('t','outbox')?.moduleId,'FINANCE.CORRECTION_OUTBOX');
});

test('same correction idempotency key cannot be reused for a different intent',()=>{
  const repo=new InMemoryPlatformRepository();
  const base={kind:'cell_correction',operationId:'corr',idempotencyKey:'same',intentFingerprint:'A',tenantId:'t',groupId:'g',primaryEntryId:'e',entries:[entry('e','same:replacement',500,500)],accounts:[],audits:[],cellRevision:{meetingId:'meet',membershipId:'m',rubricId:'r',currency:'XAF',expectedVersion:0,nextVersion:1}};
  repo.commitFinancialCorrection(base);
  assert.throws(()=>repo.commitFinancialCorrection({...base,operationId:'corr2',intentFingerprint:'B'}),/IDEMPOTENCY_CONFLICT/);
  assert.equal(repo.listLedgerEntries('t','g').length,1);
});

test('worker cell target no longer performs sequential reversal then contribution',()=>{
  const api=fs.readFileSync('workers/api/src/index.ts','utf8');
  const start=api.indexOf('const applyFinancialCellTarget='),end=api.indexOf('\n  const trashEntity=',start);
  const body=api.slice(start,end);
  assert.match(body,/replaceCashContributionCell/);
  assert.doesNotMatch(body,/ledger\.reverseEntry/);
  assert.doesNotMatch(body,/ledger\.recordCashContribution/);
});

test('connected cell target is durably queued before HTTP transport and carries its baseline',()=>{
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const start=app.indexOf('async setFinancialCellTarget'),end=app.indexOf('\n  async applyFinancialCellConsensus',start);
  const body=app.slice(start,end);
  assert.match(body,/queueLocal\('FINANCIAL_CELL_CORRECTION_PROPOSAL_V1'/);
  assert.match(body,/expectedCurrentAmount:current/);
  assert.match(body,/x-idempotency-key/);
  assert.match(body,/markConfirmedByKey/);
  assert.doesNotMatch(body,/current===0&&input\.targetAmount>0/);
});


test('two different commands cannot both commit the same financial cell version',()=>{
  const repo=new InMemoryPlatformRepository();
  const first={kind:'cell_correction',operationId:'corr-a',idempotencyKey:'a',intentFingerprint:'A',tenantId:'t',groupId:'g',primaryEntryId:'a-entry',entries:[entry('a-entry','a:replacement',500,500)],accounts:[],audits:[],cellRevision:{meetingId:'meet',membershipId:'m',rubricId:'r',currency:'XAF',expectedVersion:0,nextVersion:1}};
  const second={kind:'cell_correction',operationId:'corr-b',idempotencyKey:'b',intentFingerprint:'B',tenantId:'t',groupId:'g',primaryEntryId:'b-entry',entries:[entry('b-entry','b:replacement',4000,4000)],accounts:[],audits:[],cellRevision:{meetingId:'meet',membershipId:'m',rubricId:'r',currency:'XAF',expectedVersion:0,nextVersion:1}};
  repo.commitFinancialCorrection(first);
  assert.throws(()=>repo.commitFinancialCorrection(second),/CELL_VERSION_CONFLICT/);
  assert.equal(repo.listLedgerEntries('t','g').length,1);
  assert.equal(repo.getFinancialCellRevision('t','g','meet','m','r','XAF')?.version,1);
});

test('UI/API contract carries cell revision from ledger read to target command',()=>{
  const api=fs.readFileSync('workers/api/src/index.ts','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const ui=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(api,/cellRevisions:await repo\.listFinancialCellRevisions/);
  assert.match(api,/expectedCellVersion/);
  assert.match(app,/baselineVersion:currentVersion/);
  assert.match(app,/expectedCellVersion:currentVersion/);
  assert.match(ui,/exactCellVersion/);
});
