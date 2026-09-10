import test from 'node:test';
import assert from 'node:assert/strict';
import { PlatformKernel } from '../.build/packages/platform-kernel/src/index.js';
import { InMemoryPlatformRepository } from '../.build/packages/repositories/src/index.js';
import { FoundationService } from '../.build/packages/domain/src/index.js';
import { Outbox } from '../.build/packages/offline/src/index.js';
import { LoopbackRelayTransport, envelopeForOutbox } from '../.build/packages/relay/src/index.js';

const ctx = (kernel, tenantId='tenant_A', actorId='founder_A', activeGroupId) => kernel.context.set({ actorId, tenantId, activeGroupId, groupRoles: activeGroupId ? ['founder','manager'] : ['founder'], mandateIds: [], deviceId:'d1',sessionId:'s1',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r1' });

test('group launch simulation separates nominal money, external costs and manager margin', async () => {
  const k=new PlatformKernel(); const repo=new InMemoryPlatformRepository(); const svc=new FoundationService(repo,k); ctx(k);
  const p=await svc.createProject({ tenantId:'tenant_A',createdBy:'founder_A',name:'Demo',kind:'rotating_tontine',governanceModel:'founder_managed',memberCount:50,sessions:10,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:50},estimatedExternalCostRate:0.0175,fixedOperatingCostPerSession:{currency:'XAF',amount:0} });
  const r=await svc.simulateProject('tenant_A',p.id);
  assert.equal(r.totalNominalContributions,500000); assert.equal(r.totalManagementFees,25000); assert.equal(r.estimatedExternalCosts,8750); assert.equal(r.estimatedManagerMargin,16250);
});

test('project can become a group and create founder membership + inbox obligation', async () => {
  const k=new PlatformKernel(); const repo=new InMemoryPlatformRepository(); const svc=new FoundationService(repo,k); ctx(k);
  const p=await svc.createProject({ tenantId:'tenant_A',createdBy:'founder_A',name:'G1',kind:'association',governanceModel:'community',memberCount:20,sessions:12,nominalContribution:{currency:'XAF',amount:5000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0} });
  await svc.simulateProject('tenant_A',p.id); const g=await svc.convertProjectToGroup('tenant_A',p.id); ctx(k,'tenant_A','founder_A',g.id);
  const members=await repo.listMemberships('tenant_A',g.id); assert.equal(members.length,1); assert.deepEqual(members[0]?.roles,['founder','manager']); assert.equal(k.inbox.forUser('tenant_A','founder_A').length,1);
});



test('project simulation is capability-governed instead of creator-only', async () => {
  const k=new PlatformKernel(); const repo=new InMemoryPlatformRepository(); const svc=new FoundationService(repo,k); ctx(k);
  const p=await svc.createProject({ tenantId:'tenant_A',createdBy:'founder_A',name:'Delegable draft',kind:'association',governanceModel:'community',memberCount:2,sessions:2,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0} });
  ctx(k,'tenant_A','other_actor'); await assert.rejects(()=>svc.simulateProject('tenant_A',p.id),/FORBIDDEN_SCOPE/);
  ctx(k,'tenant_A','founder_A'); await svc.grantProjectAccess('tenant_A',p.id,'other_actor',['SIMULATE']);
  ctx(k,'tenant_A','other_actor'); const result=await svc.simulateProject('tenant_A',p.id); assert.equal(result.projectId,p.id);
  await assert.rejects(()=>svc.convertProjectToGroup('tenant_A',p.id),/FORBIDDEN_SCOPE/);
});

test('group project rejects unknown business enums', async () => {
  const k=new PlatformKernel(); const repo=new InMemoryPlatformRepository(); const svc=new FoundationService(repo,k); ctx(k);
  await assert.rejects(()=>svc.createProject({ tenantId:'tenant_A',createdBy:'founder_A',name:'Invalid',kind:'made_up',governanceModel:'community',memberCount:2,sessions:2,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0} }),/INVALID_GROUP_KIND/);
});

test('tenant isolation hides group from another tenant', async () => {
  const k=new PlatformKernel(); const repo=new InMemoryPlatformRepository(); const svc=new FoundationService(repo,k); ctx(k);
  const p=await svc.createProject({ tenantId:'tenant_A',createdBy:'founder_A',name:'Private',kind:'association',governanceModel:'community',memberCount:2,sessions:2,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0} });
  const g=await svc.convertProjectToGroup('tenant_A',p.id); assert.ok(await repo.getGroup('tenant_A',g.id)); assert.equal(await repo.getGroup('tenant_B',g.id),undefined);
});

test('cashbox rejects negative or fractional XAF physical amounts', () => {
  const k=new PlatformKernel(); const svc=new FoundationService(new InMemoryPlatformRepository(),k);
  assert.throws(()=>svc.cashbox.close({openingCash:-1,cashIn:0,cashOut:0,countedClosing:0}),/INVALID_CASHBOX_OPENINGCASH/);
  assert.throws(()=>svc.cashbox.close({openingCash:0,cashIn:10.5,cashOut:0,countedClosing:10}),/INVALID_CASHBOX_CASHIN/);
});

test('cashbox detects exact variance without mutating ledger', () => {
  const k=new PlatformKernel(); const svc=new FoundationService(new InMemoryPlatformRepository(),k); const snap=svc.cashbox.close({openingCash:50000,cashIn:225000,cashOut:210000,countedClosing:64000});
  assert.equal(snap.theoreticalClosing,65000); assert.equal(snap.variance,-1000); assert.equal(k.reconciliation.compare(65000,64000).status,'MISMATCH');
});

test('outbox is idempotent and relay confirms one logical intention', async () => {
  const outbox=new Outbox(); const a=outbox.enqueue({tenantId:'t',actorId:'u',type:'NOTE',payload:{x:1},idempotencyKey:'same-key'}); const b=outbox.enqueue({tenantId:'t',actorId:'u',type:'NOTE',payload:{x:2},idempotencyKey:'same-key'});
  assert.equal(a.id,b.id); assert.equal(outbox.list().length,1); const relay=new LoopbackRelayTransport(); const result=await outbox.sync(async item => ({ok:(await relay.send(envelopeForOutbox('d',item))).accepted}));
  assert.equal(result[0]?.status,'CONFIRMED'); assert.equal(result[0]?.attempts,1);
});

test('compatibility engine degrades instead of failing globally', () => {
  const k=new PlatformKernel(); assert.equal(k.compatibility.classify({indexedDb:false,serviceWorker:false,webRtc:false,bluetooth:false,microphone:false,webGpu:false}),'core'); assert.equal(k.compatibility.classify({indexedDb:true,serviceWorker:true,webRtc:false,bluetooth:false,microphone:false,webGpu:false}),'offline_advanced'); assert.equal(k.compatibility.classify({indexedDb:true,serviceWorker:true,webRtc:true,bluetooth:false,microphone:false,webGpu:false}),'advanced');
});

test('resource governor prevents one subsystem consuming all shared budget', () => {
  const k=new PlatformKernel(); k.resources.setBudget('d1_reads',100); assert.equal(k.resources.consume('d1_reads',80).allowed,true); assert.equal(k.resources.consume('d1_reads',30).allowed,false);
});


test('support cases feed the same universal inbox instead of a duplicate complaint engine', async () => {
  const { FoundationApplication } = await import('../.build/packages/application/src/index.js');
  const app=new FoundationApplication(); await app.bootstrap({actorId:'support_user',tenantId:'support_tenant',displayName:'Support User',locale:'en'});
  const c=app.openSupportCase('Need help understanding a group rule');
  assert.equal(c.status,'OPEN'); assert.equal(app.inboxItems().some(x=>x.kind==='case'&&x.id===c.id),true);
});
