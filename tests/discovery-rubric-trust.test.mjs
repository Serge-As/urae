import test from 'node:test';
import assert from 'node:assert/strict';
import { PlatformKernel } from '../.build/packages/platform-kernel/src/index.js';
import { InMemoryPlatformRepository } from '../.build/packages/repositories/src/index.js';
import { FoundationService } from '../.build/packages/domain/src/index.js';
import { DiscoveryService, MembershipGatewayService } from '../.build/packages/discovery/src/index.js';
import { CommitmentReliabilityEngine } from '../.build/packages/trust/src/index.js';
import { RubricKnowledgeService } from '../.build/packages/rubrics/src/index.js';
import { createApiHandler } from '../.build/workers/api/src/index.js';

const setCtx=(k,tenantId,actorId,activeGroupId,roles=['founder','manager'])=>k.context.set({actorId,tenantId,activeGroupId,groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:`req-${tenantId}-${actorId}`});
const makeGroup=async(repo,k,tenantId,actorId,name)=>{
  setCtx(k,tenantId,actorId); const foundation=new FoundationService(repo,k); await foundation.ensureUser({id:actorId,displayName:actorId,locale:'fr',createdAt:new Date().toISOString()});
  const p=await foundation.createProject({tenantId,createdBy:actorId,name,kind:'association',governanceModel:'community',memberCount:10,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  return foundation.convertProjectToGroup(tenantId,p.id);
};

test('discovery uses a safe public cross-tenant projection and excludes secret/non-public groups', async()=>{
  const repo=new InMemoryPlatformRepository(); const k=new PlatformKernel(); const discovery=new DiscoveryService(repo,k);
  const a=await makeGroup(repo,k,'tenant_A','founder_A','Solidarité Mvog-Ada'); setCtx(k,'tenant_A','founder_A',a.id); await discovery.publishGroupListing({tenantId:'tenant_A',groupId:a.id,visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'Yaoundé',missionTags:['solidarité','quartier'],activityTags:['épargne'],meetingMode:'IN_PERSON',contributionBand:{currency:'XAF',min:1000,max:5000,cadence:'weekly'}});
  const b=await makeGroup(repo,k,'tenant_B','founder_B','Cercle Secret'); setCtx(k,'tenant_B','founder_B',b.id);
  await assert.rejects(()=>discovery.publishGroupListing({tenantId:'tenant_B',groupId:b.id,visibility:'SECRET',discoverable:true,joinPolicy:'INVITE_ONLY',recruiting:false,locality:'Yaoundé',missionTags:['solidarité'],activityTags:[]}),/SECRET_GROUP_NOT_DISCOVERABLE/);
  const matches=await discovery.search({text:'solidarité',locality:'Yaoundé',missionTags:['solidarité'],maxContribution:{currency:'XAF',amount:5000},recruitingOnly:true});
  assert.equal(matches.length,1); assert.equal(matches[0].listing.groupId,a.id); assert.equal('members' in matches[0].listing,false); assert.equal(matches[0].reasonCodes.includes('LOCALITY_MATCH'),true);
});

test('membership application crosses the public gateway but creates canonical membership only after manager approval', async()=>{
  const repo=new InMemoryPlatformRepository(); const k=new PlatformKernel(); const group=await makeGroup(repo,k,'tenant_target','founder_target','Association Nlongkak');
  const discovery=new DiscoveryService(repo,k); setCtx(k,'tenant_target','founder_target',group.id); await discovery.publishGroupListing({tenantId:'tenant_target',groupId:group.id,visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'Yaoundé',missionTags:['entraide'],activityTags:['tontine']});
  await repo.saveUser({id:'candidate_1',displayName:'Candidate 1',locale:'fr',createdAt:new Date().toISOString()}); setCtx(k,'tenant_candidate','candidate_1',undefined,['member']);
  const gateway=new MembershipGatewayService(repo,k); const app=await gateway.requestToJoin({groupId:group.id,message:'Je souhaite rejoindre',requestedCommitmentBand:{currency:'XAF',max:5000,cadence:'weekly'}});
  assert.equal(app.status,'PENDING'); assert.equal((await repo.listMemberships('tenant_target',group.id)).some(x=>x.userId==='candidate_1'),false);
  setCtx(k,'tenant_target','founder_target',group.id); const decided=await gateway.decide(app.id,'APPROVE','Candidature validée');
  assert.equal(decided.application.status,'APPROVED'); assert.ok(decided.membershipId); assert.equal((await repo.listMemberships('tenant_target',group.id)).some(x=>x.userId==='candidate_1'&&x.status==='active'),true);
});

test('reliability is contextual to the commitment band and does not extrapolate wealth or prestige',()=>{
  const engine=new CommitmentReliabilityEngine(); const evidence=[0,1,2,3,4,5].map(i=>({subjectUserId:'u1',commitmentBand:'MICRO',kind:i===4?'RECOVERED_ARREARS':'FULFILLED_ON_TIME',occurredAt:new Date(2026,0,i+1).toISOString(),sourceId:`e${i}`}));
  const micro=engine.profile('u1','MICRO',evidence); const high=engine.profile('u1','HIGH',evidence);
  assert.equal(micro.rating,'CONSISTENT'); assert.equal(micro.confidence,'MEDIUM'); assert.equal(micro.advisoryOnly,true); assert.equal(micro.explanationCodes.includes('WEALTH_NOT_USED'),true);
  assert.equal(high.rating,'INSUFFICIENT_EVIDENCE'); assert.equal(high.score,undefined);
});

test('rubric engine accepts mixed facets and governance text only creates reviewable claims', async()=>{
  const repo=new InMemoryPlatformRepository(); const k=new PlatformKernel(); const group=await makeGroup(repo,k,'tenant_R','founder_R','Association Rubriques'); setCtx(k,'tenant_R','founder_R',group.id);
  const svc=new RubricKnowledgeService(repo,k); const rubric=await svc.createRubric({tenantId:'tenant_R',groupId:group.id,name:'Secours Projet',aliases:['Fonds Coup Dur'],purpose:'Aide et reconstitution selon événement',facets:{direction:'MIXED',obligation:'EVENT_DRIVEN',medium:'HYBRID',refundability:'CONDITIONAL',replenishment:'PRO_RATA_MEMBERS',interestMode:'NONE',eligibilityMode:'EVENT_BASED'},source:'GROUP_CUSTOM'});
  assert.equal(rubric.facets.direction,'MIXED'); assert.equal(rubric.facets.replenishment,'PRO_RATA_MEMBERS');
  const suggestions=svc.suggestClaimsFromGovernanceText('Le fonds de secours est reconstitué au prorata des membres après décaissement. Tout prêt exige un avaliste et peut porter intérêt.');
  assert.equal(suggestions.some(x=>x.subject==='SECOURS'),true); assert.equal(suggestions.some(x=>x.predicate==='REPLENISHMENT'),true); assert.equal(suggestions.some(x=>x.predicate==='GUARANTEE_RULE'),true);
  const claim=await svc.recordClaim({tenantId:'tenant_R',groupId:group.id,sourceFingerprint:'sha256:demo-ri',sourceKind:'RI',suggestion:suggestions[0]}); assert.equal(claim.status,'OBSERVED');
  const reviewed=await svc.reviewClaim(claim.id,'VALIDATED'); assert.equal(reviewed.status,'VALIDATED');
  assert.equal((await repo.listRubricDefinitions('tenant_R',group.id)).length,1);
});

test('rubric operating model separates written rule, observed practice, shortfall and solidarity coverage', async()=>{
  const repo=new InMemoryPlatformRepository(); const k=new PlatformKernel(); const group=await makeGroup(repo,k,'tenant_C','founder_C','Association Collation'); setCtx(k,'tenant_C','founder_C',group.id);
  const svc=new RubricKnowledgeService(repo,k); const rubric=await svc.createRubric({tenantId:'tenant_C',groupId:group.id,name:'Collation',facets:{direction:'BIDIRECTIONAL',obligation:'MANDATORY',medium:'CASH',refundability:'NON_REFUNDABLE',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'ALL_MEMBERS'},source:'GROUP_CUSTOM',operatingModel:{writtenRule:'2 000 F obligatoires pour chaque membre.',observedPractice:'Le groupe avance le manquant des absents.',effectiveRuleSummary:'Objectif fixe par membre avec couverture solidaire.',ruleRealityStatus:'DIFFERS',targetMode:'PER_MEMBER_FIXED',perMemberAmount:{currency:'XAF',amount:2000},mandatoryForAbsentees:true,shortfallHandling:'SOLIDARITY_COVERAGE',payoutMode:'FIXED_TARGET_IF_COVERED',immediateFullPayout:true}});
  const preview=await svc.previewCycle({tenantId:'tenant_C',groupId:group.id,rubricId:rubric.id,memberCount:20,collectedFromMembers:38000});
  assert.equal(preview.expectedTotal,40000); assert.equal(preview.memberShortfall,2000); assert.equal(preview.memberPositionDisplay,-2000); assert.equal(preview.solidarityCoverage,2000); assert.equal(preview.availableForBeneficiary,40000); assert.equal(preview.beneficiaryDisbursement,40000); assert.equal(preview.remainingRubricBalance,0); assert.equal(preview.memberDebtAfterCoverage,2000);
  assert.equal(preview.notes.includes('WRITTEN_RULE_DIFFERS_FROM_OBSERVED_PRACTICE'),true);
});


test('API exposes discovery and governance suggestions without activating governance rules', async()=>{
  const repo=new InMemoryPlatformRepository(); const k=new PlatformKernel(); const group=await makeGroup(repo,k,'tenant_api','founder_api','Association API Discovery');
  const discovery=new DiscoveryService(repo,k); setCtx(k,'tenant_api','founder_api',group.id);
  await discovery.publishGroupListing({tenantId:'tenant_api',groupId:group.id,visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'Yaoundé',missionTags:['solidarité'],activityTags:['épargne'],meetingMode:'HYBRID',contributionBand:{currency:'XAF',max:5000,cadence:'weekly'}});
  const handler=createApiHandler(repo);
  const search=await handler(new Request('http://local/api/v1/discovery/groups?locality=Yaound%C3%A9&missionTags=solidarit%C3%A9&maxContribution=5000&currency=XAF&recruitingOnly=true'));
  assert.equal(search.status,200); const matches=await search.json(); assert.equal(matches.length,1); assert.equal(matches[0].listing.groupId,group.id);
  const claims=await handler(new Request('http://local/api/v1/governance/claims/suggest',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'Le fonds de secours est reconstitué au prorata des membres après décaissement.'})}));
  assert.equal(claims.status,200); const suggested=await claims.json(); assert.equal(suggested.automaticActivation,false); assert.equal(suggested.suggestions.some(x=>x.predicate==='REPLENISHMENT'),true);
});

test('API rejects an invalid membership decision instead of silently treating it as rejection', async()=>{
  const handler=createApiHandler(new InMemoryPlatformRepository());
  const response=await handler(new Request('http://local/api/v1/membership-applications/missing/decision',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({decision:'MAYBE'})}));
  assert.equal(response.status,400); const body=await response.json(); assert.equal(body.error,'INVALID_MEMBERSHIP_DECISION');
});
