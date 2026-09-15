import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {MemberFinancialControlService} from '../.build/packages/member-control/src/index.js';

const setContext=(kernel,actorId,roles=[])=>kernel.context.set({tenantId:'tenant_a',actorId,activeGroupId:'group_a',groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s-'+actorId,locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r-'+actorId});

test('member confirmation and reserve stay separate from the immutable ledger',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),svc=new MemberFinancialControlService(repo,kernel);
  await repo.saveGroup({id:'group_a',tenantId:'tenant_a',name:'CERDAS test',kind:'association',governanceModel:'community',status:'active',createdBy:'manager',createdAt:'2026-09-15T00:00:00.000Z'});
  await repo.saveMembership({id:'membership_member',tenantId:'tenant_a',groupId:'group_a',userId:'member',roles:['member'],status:'active',joinedAt:'2026-09-15T00:00:00.000Z'});
  await repo.saveMembership({id:'membership_manager',tenantId:'tenant_a',groupId:'group_a',userId:'manager',roles:['manager'],status:'active',joinedAt:'2026-09-15T00:00:00.000Z'});
  const entry={id:'ledger_1',tenantId:'tenant_a',groupId:'group_a',currency:'XAF',descriptionCode:'LEDGER_CASH_CONTRIBUTION',sourceType:'cash_contribution',sourceId:'receipt_1',idempotencyKey:'idem_1',createdAt:'2026-09-15T00:01:00.000Z',createdBy:'manager',lines:[{accountId:'cash',debit:2000,credit:0,memoCode:'CASH'},{accountId:'liability',debit:0,credit:2000,memoCode:'MEMBER'}]};
  await repo.saveLedgerEntry(entry);

  setContext(kernel,'manager',['manager']);
  const notice=await svc.create({groupId:'group_a',membershipId:'membership_member',entry,operationType:'CASH_CONTRIBUTION',amount:2000,currency:'XAF',previousSituation:18000,newSituation:20000});
  assert.equal(notice.disputeState,'NO_RESERVE');

  setContext(kernel,'member',['member']);
  assert.equal((await svc.list('group_a','membership_member')).length,1);
  const confirmed=await svc.confirm('group_a',notice.id);assert.equal(confirmed.memberState,'MEMBER_CONFIRMED');
  const reserved=await svc.reserve('group_a',notice.id,'Je ne reconnais pas ce versement.');
  assert.equal(reserved.notice.disputeState,'MEMBER_RESERVE');assert.equal(reserved.case.status,'OPEN');
  assert.deepEqual(await repo.getLedgerEntry('tenant_a','group_a','ledger_1'),entry,'reserve must not edit financial entry');

  setContext(kernel,'manager',['manager']);
  const officer=await svc.officerReview('group_a',notice.id,'Reçu papier et caisse vérifiés.');assert.equal(officer.disputeState,'OFFICER_CONFIRMED');

  setContext(kernel,'member',['member']);
  const maintained=await svc.memberReview('group_a',notice.id,'MAINTAIN_RESERVE','Je demande une seconde vérification.');
  assert.equal(maintained.disputeState,'MEMBER_RESERVE_MAINTAINED');
  assert.deepEqual(await repo.getLedgerEntry('tenant_a','group_a','ledger_1'),entry);
});

test('member-control actions cannot be taken for another member by an outsider',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),svc=new MemberFinancialControlService(repo,kernel);
  await repo.saveGroup({id:'group_a',tenantId:'tenant_a',name:'Groupe',kind:'association',governanceModel:'community',status:'active',createdBy:'manager',createdAt:'2026-09-15T00:00:00.000Z'});
  await repo.saveMembership({id:'m1',tenantId:'tenant_a',groupId:'group_a',userId:'member',roles:['member'],status:'active',joinedAt:'2026-09-15T00:00:00.000Z'});
  setContext(kernel,'outsider',[]);
  await assert.rejects(()=>svc.list('group_a','m1'),/FORBIDDEN_SCOPE/);
});
