import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {CommitmentTrustGraphService} from '../.build/packages/trust/src/index.js';

const stamp=()=>new Date().toISOString();
const ctx=(k,actor,roles=[])=>k.context.set({actorId:actor,tenantId:'tenant_trust',activeGroupId:'g1',groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_'+actor});
test('Trust Graph derives explainable multi-source relations without opaque decision score',async()=>{
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel();ctx(k,'founder',['founder','manager']);
 await repo.saveUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:stamp()});await repo.saveUser({id:'u1',displayName:'Alice',locale:'fr',createdAt:stamp()});
 await repo.saveGroup({id:'g1',tenantId:'tenant_trust',name:'Groupe Trust',kind:'association',governanceModel:'community',createdBy:'founder',status:'active',createdAt:stamp()});
 await repo.saveMembership({id:'m1',tenantId:'tenant_trust',groupId:'g1',userId:'u1',status:'active',roles:['member','secretary'],joinedAt:new Date(Date.now()-90*86400000).toISOString(),updatedAt:stamp()});
 await repo.saveWorkspaceRecord({id:'att1',tenantId:'tenant_trust',groupId:'g1',moduleId:'MEETING.ATTENDANCE',title:'Présence',status:'ACTIVE',tags:['attendance'],data:{meetingId:'meet1',membershipId:'m1',attendance:'PRESENT'},createdBy:'founder',createdAt:stamp(),updatedAt:stamp()});
 await repo.saveWorkspaceRecord({id:'mand1',tenantId:'tenant_trust',moduleId:'MANAGER.BUSINESS_STUDIO',title:'Mandat groupe',status:'ACTIVE',tags:['business-studio'],data:{businessKind:'MANDATE',groupId:'g1',mandateState:'ACTIVE',systemPermissionElevation:false},createdBy:'u1',createdAt:stamp(),updatedAt:stamp()});
 await repo.saveWorkspaceRecord({id:'ord1',tenantId:'tenant_trust',groupId:'g1',moduleId:'MARKETPLACE.CORE',title:'Order service',status:'DONE',tags:['market-engine'],data:{marketKind:'MARKET_ORDER',state:'DELIVERED',quantity:1,disputed:false},createdBy:'u1',createdAt:stamp(),updatedAt:stamp()});
 await repo.saveWorkspaceRecord({id:'en1',tenantId:'tenant_trust',moduleId:'LEARNING.MANAGER_ACADEMY',title:'Formation gestion',status:'ACTIVE',tags:['academy'],data:{kind:'ENROLLMENT',enrollmentState:'IN_PROGRESS'},createdBy:'u1',createdAt:stamp(),updatedAt:stamp()});
 await repo.saveWorkspaceRecord({id:'cert1',tenantId:'tenant_trust',moduleId:'LEARNING.MANAGER_ACADEMY',title:'Attestation gestion',status:'DONE',tags:['academy'],data:{kind:'CERTIFICATE',grantsFinancialRole:false,grantsPermission:false},createdBy:'u1',createdAt:stamp(),updatedAt:stamp()});
 await repo.saveWorkspaceRecord({id:'safety1',tenantId:'tenant_trust',groupId:'g1',moduleId:'SAFETY.ANTISCAM',title:'Incident à vérifier',status:'ACTIVE',tags:['safety-case'],data:{kind:'SAFETY_CASE',subjectRef:'u1',caseState:'TRIAGED',findingStatus:'UNVERIFIED_SUSPICION',financialScoreEffect:false},createdBy:'founder',createdAt:stamp(),updatedAt:stamp()});
 const service=new CommitmentTrustGraphService(repo,k);
 await service.addEvidence('g1','m1',{commitmentBand:'SMALL',kind:'FULFILLED_ON_TIME',sourceId:'proof_demo'});
 await service.addEvidence('g1','m1',{commitmentBand:'SMALL',kind:'FULFILLED_ON_TIME',sourceId:'meet1'});
 await service.addEvidence('g1','m1',{commitmentBand:'SMALL',kind:'RECOVERED_ARREARS',sourceId:'case1'});
 const graph=await service.graph('g1','m1');
 assert.equal(graph.policy.advisoryOnly,true);assert.equal(graph.policy.automaticAdmission,false);assert.equal(graph.policy.automaticCreditDecision,false);assert.equal(graph.policy.automaticExclusion,false);assert.equal(graph.policy.wealthUsed,false);assert.equal(graph.policy.opaqueGlobalScore,false);assert.equal(graph.policy.secondSourceOfTruth,false);
 for(const kind of ['PERSON','MEMBERSHIP','GROUP','ROLE','PARTICIPATION','MANDATE','ORDER','TRAINING','CERTIFICATION','INCIDENT','EVIDENCE','IDENTITY_PROOF_REFERENCE'])assert.ok(graph.nodes.some(n=>n.kind===kind),kind);
 for(const rel of ['HAS_MEMBERSHIP','MEMBER_OF','HOLDS_ROLE','PARTICIPATED_AS','HAS_MANDATE','PLACED_ORDER','ENROLLED_IN','EARNED_CERTIFICATION','SUBJECT_OF','SUPPORTED_BY','IDENTITY_SUPPORTED_BY'])assert.ok(graph.edges.some(e=>e.relation===rel),rel);
 assert.ok(graph.coverage.participation>0);assert.ok(graph.coverage.mandates>0);assert.ok(graph.coverage.orders>0);assert.ok(graph.coverage.training>0);assert.ok(graph.coverage.certifications>0);assert.ok(graph.coverage.incidents>0);assert.ok(graph.coverage.evidence>=3);
});
test('Trust Graph UI explains relations and second-source boundary',()=>{
 const ui=fs.readFileSync('apps/web/src/trust-center.js','utf8');assert.match(ui,/Relations explicables/);assert.match(ui,/ne crée pas une seconde vérité/);assert.match(ui,/Décision automatique/);
});
