import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {SafetyCaseService,assessReferralStructure} from '../.build/packages/trust/src/index.js';

const seed=async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),tenantId='tenant_safety',actorId='founder_safety';
  kernel.context.set({actorId,tenantId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-safety'});
  const foundation=new FoundationService(repo,kernel);await foundation.ensureUser({id:actorId,displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
  const p=await foundation.createProject({tenantId,createdBy:actorId,name:'Groupe sécurité',kind:'association',governanceModel:'community',memberCount:6,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const group=await foundation.convertProjectToGroup(tenantId,p.id);
  kernel.context.set({actorId,tenantId,activeGroupId:group.id,groupRoles:['founder','manager'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-safety-2'});
  return{repo,kernel,group,service:new SafetyCaseService(repo,kernel)};
};

test('anti-pyramid guard blocks multi-level and member-money-funded referral designs without issuing a legal verdict',()=>{
  const r=assessReferralStructure({levels:3,fundingSource:'COTISATIONS',rewardForRecruitingRecruiters:true,promisedReturnLinkedToRecruitment:true,realProductOrServiceEvidence:false});
  assert.equal(r.safeByConstruction,false);assert.equal(r.legalVerdict,false);assert.equal(r.requiresHumanReview,true);
  assert.ok(r.signals.some(x=>x.code==='MULTI_LEVEL_REWARD'));assert.ok(r.signals.some(x=>x.code==='MEMBER_MONEY_FUNDS_REFERRALS'));
});

test('a safety report begins as an unverified suspicion and never changes financial score automatically',async()=>{
  const {service,group}=await seed();
  const c=await service.report({groupId:group.id,subjectType:'SUPPLIER',subjectRef:'supplier-1',category:'FAKE_SUPPLIER',summary:'Documents incohérents',evidenceRef:'doc-1'});
  assert.equal(c.data.findingStatus,'UNVERIFIED_SUSPICION');assert.equal(c.data.publicAccusation,false);assert.equal(c.data.financialScoreEffect,false);assert.equal(c.data.automaticLegalVerdict,false);
  let next=await service.transition(c.id,'TRIAGED','À examiner');next=await service.transition(c.id,'INVESTIGATING','Vérification en cours');
  const result=await service.decide(c.id,{action:'WARN',reason:'Preuves partielles',findingStatus:'SUPPORTED_BY_REVIEW'});
  assert.equal(result.decision.data.legalVerdict,false);assert.equal(result.decision.data.financialScoreEffect,false);assert.equal(result.case.data.publicAccusation,false);
});

test('evidence is separate from the accusation and actioned cases can be appealed',async()=>{
  const {service,group}=await seed();
  const c=await service.report({groupId:group.id,subjectType:'OFFER',subjectRef:'offer-1',category:'MISLEADING_PROMISE',summary:'Promesse non documentée'});
  const ev=await service.addEvidence(c.id,{summary:'Capture de la promesse',ref:'evidence-1',source:'moderation'});assert.equal(ev.data.verified,false);
  await service.transition(c.id,'TRIAGED');await service.transition(c.id,'INVESTIGATING');await service.decide(c.id,{action:'LIMIT',reason:'Limiter pendant vérification'});
  const appeal=await service.appeal(c.id,{reason:'Le fournisseur conteste et apporte une facture',evidenceRef:'invoice-1'});
  assert.equal(appeal.case.data.caseState,'APPEALED');assert.equal(appeal.appeal.data.appealState,'OPEN');
});
