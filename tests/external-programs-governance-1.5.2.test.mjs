import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {ExternalProgramsService} from '../.build/packages/external-programs/src/index.js';

const seed=async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),tenantId='tenant_program',actorId='founder_program';
  kernel.context.set({actorId,tenantId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-program'});
  const foundation=new FoundationService(repo,kernel);await foundation.ensureUser({id:actorId,displayName:'Fondatrice',locale:'fr',createdAt:new Date().toISOString()});
  const p=await foundation.createProject({tenantId,createdBy:actorId,name:'Groupe ONG',kind:'association',governanceModel:'community',memberCount:8,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const group=await foundation.convertProjectToGroup(tenantId,p.id);
  kernel.context.set({actorId,tenantId,activeGroupId:group.id,groupRoles:['founder','manager'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-program-2'});
  return{repo,kernel,group,service:new ExternalProgramsService(repo,kernel)};
};
const future=days=>new Date(Date.now()+days*86400000).toISOString();

test('NGO program enrollment is explicit, bounded and cannot request individual finance access',async()=>{
  const {service,group}=await seed();
  const p=await service.create(group.id,{kind:'NGO',partyName:'ONG Test',programName:'Accompagnement',purpose:'Former les responsables'});
  await service.transition(group.id,p.id,'ACTIVE');
  await assert.rejects(()=>service.createEnrollment(group.id,p.id,{consentRef:'PV-01',purpose:'Formation',scopes:['FINANCE_INDIVIDUAL'],endsAt:future(30)}),/PROGRAM_SCOPE_FORBIDDEN/);
  const e=await service.createEnrollment(group.id,p.id,{consentRef:'PV-01',purpose:'Formation',scopes:['TRAINING','PROGRAM_METRICS'],endsAt:future(30),facilitatorRef:'animateur-1'});
  assert.equal(e.data.grantsFinancialRole,false);assert.equal(e.data.individualFinanceAccess,false);
});

test('support action is traceable and funding promise never becomes received money without Ledger evidence',async()=>{
  const {service,group}=await seed();
  const p=await service.create(group.id,{kind:'NGO',partyName:'ONG Test',programName:'Programme',purpose:'Appui'});await service.transition(group.id,p.id,'ACTIVE');
  const e=await service.createEnrollment(group.id,p.id,{consentRef:'consent-1',purpose:'Appui',scopes:['TRAINING','SUPPORT_ACTIONS'],endsAt:future(20)});
  const action=await service.recordSupportAction(group.id,e.id,{kind:'TRAINING',summary:'Formation trésorerie',evidenceRef:'presence-1'});
  assert.equal(action.data.grantsFinancialRole,false);
  const promised=await service.recordFundingEvidence(group.id,e.id,{state:'PROMISED',amount:100000,currency:'XAF',evidenceRef:'lettre-promesse'});
  assert.equal(promised.data.promiseIsMoney,false);
  await assert.rejects(()=>service.recordFundingEvidence(group.id,e.id,{state:'RECEIVED',amount:100000,currency:'XAF',evidenceRef:'recu'}),/FUNDING_LEDGER_ENTRY_REQUIRED/);
});

test('handover progresses to local management without granting roles from the program service',async()=>{
  const {service,group}=await seed();
  const p=await service.create(group.id,{kind:'NGO',partyName:'ONG Test',programName:'Programme',purpose:'Transition'});await service.transition(group.id,p.id,'ACTIVE');
  const e=await service.createEnrollment(group.id,p.id,{consentRef:'consent-2',purpose:'Transition',scopes:['CO_MANAGEMENT'],endsAt:future(60)});
  let h=await service.createHandoverPlan(group.id,e.id,{localOwnerRef:'presidente-locale'});
  h=await service.transitionHandover(group.id,h.id,'OBSERVER');
  await assert.rejects(()=>service.transitionHandover(group.id,h.id,'CO_MANAGEMENT'),/CO_MANAGEMENT_AUTHORIZATION_REQUIRED/);
  h=await service.transitionHandover(group.id,h.id,'CO_MANAGEMENT',{authorizationRef:'PV-COGESTION'});
  h=await service.transitionHandover(group.id,h.id,'LOCAL_MANAGEMENT');
  assert.equal(h.data.stage,'LOCAL_MANAGEMENT');assert.equal(h.data.grantsFinancialRole,false);assert.equal(h.data.roleChangesRequireCanonicalMembership,true);
});
