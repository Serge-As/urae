import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {MiscRubricService} from '../.build/packages/misc-rubrics/src/index.js';

const ctx=kernel=>kernel.context.set({tenantId:'tenant_a',actorId:'owner',activeGroupId:'group_a',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
const group={id:'group_a',tenantId:'tenant_a',name:'Association A',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-01T00:00:00.000Z'};

test('Autres supports registration fine and loan stamp simultaneously in one meeting',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel);await repo.saveGroup(group);
  await repo.saveUser({id:'member_user',displayName:'Marie',locale:'fr',createdAt:'2026-09-01T00:00:00.000Z'});
  await repo.saveMembership({id:'membership_marie',tenantId:'tenant_a',groupId:'group_a',userId:'member_user',roles:['member'],status:'active',joinedAt:'2026-09-01T00:00:00.000Z'});
  const meeting={id:'meeting_1',tenantId:'tenant_a',groupId:'group_a',title:'Première séance',status:'open',openedBy:'owner',openedAt:'2026-09-10T00:00:00.000Z'};await repo.saveMeeting(meeting);
  const svc=new MiscRubricService(repo,kernel,new LedgerService(repo,kernel));
  const starters=await svc.ensureStarters('group_a');assert.equal(starters.length,3);
  const byKind=Object.fromEntries(starters.map(x=>[x.kind,x]));
  const posted=await svc.postBatch('group_a',{membershipId:'membership_marie',meetingId:'meeting_1',idempotencyKey:'same-session',items:[
    {templateId:byKind.REGISTRATION.id,amount:2000,note:'Inscription'},
    {templateId:byKind.FINE.id,amount:500,note:'Retard'},
    {templateId:byKind.LOAN_STAMP.id,amount:1000,note:'Timbre du prêt'}
  ]});
  assert.equal(posted.length,3);
  assert.equal((await repo.listContributionReceipts('tenant_a','group_a')).length,3);
  assert.equal((await repo.listLedgerEntries('tenant_a','group_a')).length,3);
  assert.equal((await svc.postings('group_a',{meetingId:'meeting_1',membershipId:'membership_marie'})).length,3);
});

test('ephemeral registration disappears after configured first sessions while persistent Autres remain',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel);await repo.saveGroup(group);
  const svc=new MiscRubricService(repo,kernel,new LedgerService(repo,kernel));await svc.ensureStarters('group_a');
  for(let i=1;i<=4;i++)await repo.saveMeeting({id:'meeting_'+i,tenantId:'tenant_a',groupId:'group_a',title:'Séance '+i,status:'open',openedBy:'owner',openedAt:`2026-09-${String(9+i).padStart(2,'0')}T00:00:00.000Z`});
  assert.ok((await svc.list('group_a','meeting_1')).some(x=>x.kind==='REGISTRATION'));
  const fourth=await svc.list('group_a','meeting_4');
  assert.equal(fourth.some(x=>x.kind==='REGISTRATION'),false);
  assert.ok(fourth.some(x=>x.kind==='LOAN_STAMP'));
  assert.ok(fourth.some(x=>x.kind==='FINE'));
});
