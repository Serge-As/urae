import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {OpportunityService} from '../.build/packages/opportunity/src/index.js';

const setContext=(kernel,actorId='owner',roles=['founder','manager'])=>kernel.context.set({
  tenantId:'tenant_a',actorId,activeGroupId:'group_a',groupRoles:roles,mandateIds:[],deviceId:'device_'+actorId,
  sessionId:'session_'+actorId,locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_'+actorId
});
const group={id:'group_a',tenantId:'tenant_a',name:'Association A',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-21T00:00:00.000Z'};

test('personal opportunity intent is a draft, not a transaction, and stays private to its creator',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();setContext(kernel,'alice',['member']);
  const svc=new OpportunityService(repo,kernel);
  const need=await svc.create({title:'Cherche réparateur',direction:'NEED',urgency:'NOW',locality:'Yaoundé'});
  assert.equal(need.data.opportunityState,'DRAFT');
  assert.equal(need.data.humanValidated,false);
  assert.equal(need.data.commercialCommitment,false);
  assert.equal(need.data.realMoney,false);
  assert.equal((await svc.list()).length,1);
  setContext(kernel,'bob',['member']);
  await assert.rejects(()=>svc.get(need.id),/FORBIDDEN_SCOPE/);
  assert.equal((await svc.list()).length,0);
});

test('an active group member can express a need and explicit human transition opens it without money movement',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();setContext(kernel);await repo.saveGroup(group);
  await repo.saveMembership({id:'m_alice',tenantId:'tenant_a',groupId:'group_a',userId:'alice',roles:['member'],status:'active',joinedAt:'2026-09-21T00:00:00.000Z'});
  setContext(kernel,'alice',['member']);
  const svc=new OpportunityService(repo,kernel);
  const need=await svc.create({title:'200 chaises pour la fête',summary:'Besoin à préparer pour la clôture',direction:'NEED',quantity:200,unit:'chaise',groupId:'group_a',source:'FORUM',sourceRef:'post_123'});
  assert.equal(need.groupId,'group_a');
  assert.equal(need.status,'DRAFT');
  const opened=await svc.transition(need.id,'OPEN');
  assert.equal(opened.status,'ACTIVE');
  assert.equal(opened.data.opportunityState,'OPEN');
  assert.equal(opened.data.humanValidated,true);
  assert.equal(opened.data.commercialCommitment,false);
  assert.equal(opened.data.realMoney,false);
  assert.equal((await repo.listLedgerEntries('tenant_a','group_a')).length,0);
  const audits=await repo.listAudit('tenant_a');
  assert.ok(audits.some(x=>x.action==='OPPORTUNITY_INTENT_CREATED'));
  assert.ok(audits.some(x=>x.action==='OPPORTUNITY_INTENT_TRANSITIONED'));
});

test('another ordinary member cannot govern someone else opportunity, while a manager can',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();setContext(kernel);await repo.saveGroup(group);
  await repo.saveMembership({id:'m_alice',tenantId:'tenant_a',groupId:'group_a',userId:'alice',roles:['member'],status:'active'});
  await repo.saveMembership({id:'m_bob',tenantId:'tenant_a',groupId:'group_a',userId:'bob',roles:['member'],status:'active'});
  await repo.saveMembership({id:'m_mgr',tenantId:'tenant_a',groupId:'group_a',userId:'manager2',roles:['manager'],status:'active'});
  setContext(kernel,'alice',['member']);const svc=new OpportunityService(repo,kernel);
  const need=await svc.create({title:'Recherche transport',groupId:'group_a'});
  setContext(kernel,'bob',['member']);
  await assert.rejects(()=>svc.transition(need.id,'OPEN'),/FORBIDDEN_SCOPE/);
  setContext(kernel,'manager2',['manager']);
  const opened=await svc.transition(need.id,'OPEN');
  assert.equal(opened.data.opportunityState,'OPEN');
});

test('opportunity state machine rejects invalid transitions and malformed quantities',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();setContext(kernel,'alice',['member']);
  const svc=new OpportunityService(repo,kernel);
  await assert.rejects(()=>svc.create({title:'Bad',quantity:0}),/INVALID_QUANTITY/);
  const need=await svc.create({title:'Valid'});
  await assert.rejects(()=>svc.transition(need.id,'FULFILLED'),/INVALID_OPPORTUNITY_TRANSITION/);
  await svc.transition(need.id,'OPEN');
  await svc.transition(need.id,'MATCHING');
  const done=await svc.transition(need.id,'FULFILLED');
  assert.equal(done.status,'DONE');
  await assert.rejects(()=>svc.transition(need.id,'OPEN'),/INVALID_OPPORTUNITY_TRANSITION/);
});

test('API and connected application expose dedicated opportunity endpoints instead of relying only on generic workspace CRUD',async()=>{
  const [api,app]=await Promise.all([
    readFile('workers/api/src/index.ts','utf8'),
    readFile('packages/application/src/index.ts','utf8')
  ]);
  assert.match(api,/\/api\/v1\/opportunities/);
  assert.match(api,/opportunity\.create/);
  assert.match(api,/opportunity\.transition/);
  assert.match(app,/createOpportunity/);
  assert.match(app,/transitionOpportunity/);
});
