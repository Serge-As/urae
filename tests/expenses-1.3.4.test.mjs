import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {ExpenseService} from '../.build/packages/expenses/src/index.js';

const group={id:'group_a',tenantId:'tenant_a',name:'Association A',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-01T00:00:00.000Z'};
const member={id:'membership_serge',tenantId:'tenant_a',groupId:'group_a',userId:'serge_user',roles:['member'],status:'active',joinedAt:'2026-09-01T00:00:00.000Z'};
const meeting={id:'meeting_1',tenantId:'tenant_a',groupId:'group_a',title:'Séance 1',status:'open',openedBy:'owner',openedAt:'2026-09-17T00:00:00.000Z'};
const rubric={id:'rubric_transport',tenantId:'tenant_a',groupId:'group_a',name:'Transport',aliases:[],purpose:'Transport de séance',facets:{direction:'MIXED',obligation:'OPTIONAL',medium:'CASH',refundability:'NON_REFUNDABLE',replenishment:'NONE',interestMode:'NONE',eligibilityMode:'SELECTED_MEMBERS'},status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z'};
const context=kernel=>kernel.context.set({tenantId:'tenant_a',actorId:'owner',activeGroupId:'group_a',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});

async function setup(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);await repo.saveUser({id:'serge_user',displayName:'Serge',locale:'fr',createdAt:'2026-09-01T00:00:00.000Z'});await repo.saveMembership(member);await repo.saveMeeting(meeting);await repo.saveRubricDefinition(rubric);const ledger=new LedgerService(repo,kernel);await ledger.recordCashContribution({tenantId:'tenant_a',groupId:'group_a',membershipId:'membership_serge',amount:10000,currency:'XAF',meetingId:'meeting_1',rubricId:'rubric_transport',idempotencyKey:'seed-cash'});return{repo,kernel,ledger,svc:new ExpenseService(repo,kernel,ledger)};
}

test('sheet expense is member meeting and rubric linked while using canonical ledger',async()=>{
  const {repo,ledger,svc}=await setup();const before=await ledger.summary('tenant_a','group_a','XAF');assert.equal(before.cashBalance,10000);
  const expense=await svc.create('group_a',{amount:2000,label:'Transport payé pour Serge',scope:'SHEET',meetingId:'meeting_1',membershipId:'membership_serge',rubricId:'rubric_transport',note:'Dépense depuis la feuille',idempotencyKey:'expense-sheet-1'});
  assert.equal(expense.amount,2000);assert.equal(expense.scope,'SHEET');assert.equal(expense.membershipId,'membership_serge');assert.equal(expense.meetingId,'meeting_1');assert.equal(expense.rubricId,'rubric_transport');
  const after=await ledger.summary('tenant_a','group_a','XAF');assert.equal(after.cashBalance,8000);
  const entry=await repo.getLedgerEntry('tenant_a','group_a',expense.ledgerEntryId);assert.equal(entry.sourceType,'group_expense');assert.equal(entry.meetingId,'meeting_1');assert.equal(entry.lines.reduce((n,x)=>n+x.debit,0),2000);assert.equal(entry.lines.reduce((n,x)=>n+x.credit,0),2000);
  assert.equal((await svc.list('group_a',{meetingId:'meeting_1',membershipId:'membership_serge',rubricId:'rubric_transport',scope:'SHEET'})).length,1);
});

test('expense retries are idempotent and never double-debit cash',async()=>{
  const {ledger,svc}=await setup();const input={amount:1500,label:'Transport',scope:'SHEET',meetingId:'meeting_1',membershipId:'membership_serge',rubricId:'rubric_transport',idempotencyKey:'expense-retry'};
  const a=await svc.create('group_a',input),b=await svc.create('group_a',input);assert.equal(a.id,b.id);assert.equal(a.ledgerEntryId,b.ledgerEntryId);assert.equal((await ledger.summary('tenant_a','group_a','XAF')).cashBalance,8500);
});

test('sheet expense requires the two-sheet context but back-office expense may stand alone',async()=>{
  const {svc}=await setup();await assert.rejects(()=>svc.create('group_a',{amount:500,label:'Erreur',scope:'SHEET',idempotencyKey:'missing'}),/SHEET_EXPENSE_CONTEXT_REQUIRED/);
  const back=await svc.create('group_a',{amount:700,label:'Papeterie',scope:'BACKOFFICE',note:'Achat bureau',idempotencyKey:'backoffice-1'});assert.equal(back.scope,'BACKOFFICE');assert.equal(back.membershipId,undefined);assert.equal(back.rubricId,undefined);
});
