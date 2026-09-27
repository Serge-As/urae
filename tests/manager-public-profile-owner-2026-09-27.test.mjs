import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {DiscoveryService} from '../.build/packages/discovery/src/index.js';

const setCtx=(k,actor,tenant='tenant_profile')=>k.context.set({actorId:actor,tenantId:tenant,groupRoles:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-'+actor});
test('manager public profile is opt-in and reputation is explicit public evidence without private data or opaque score',async()=>{
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),at=new Date().toISOString();setCtx(k,'manager');
 await repo.saveUser({id:'manager',displayName:'Gestionnaire',locale:'fr',createdAt:at});
 await repo.saveGroup({id:'g1',tenantId:'tenant_profile',name:'Association publique',kind:'association',governanceModel:'community',status:'active',createdBy:'manager',createdAt:at});
 await repo.savePublicGroupListing({id:'list1',tenantId:'tenant_profile',groupId:'g1',name:'Association publique',family:'association',visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,missionTags:[],activityTags:[],publishedAt:at,updatedAt:at});
 await repo.saveWorkspaceRecord({id:'cert1',tenantId:'tenant_profile',moduleId:'LEARNING.MANAGER_ACADEMY',title:'Attestation Gestion',status:'DONE',tags:['academy','certificate'],data:{kind:'CERTIFICATE',grantsFinancialRole:false,grantsPermission:false},createdBy:'manager',createdAt:at,updatedAt:at});
 const service=new DiscoveryService(repo,k);
 let profile=await service.saveManagerProfile({displayAlias:'Coach Gestion',locality:'Yaoundé',expertise:['gestion'],services:['formation'],bio:'Accompagnement',availability:'samedi',optIn:false,sharePublicGroups:true,shareAcademyCertificates:true});
 assert.equal(profile.optIn,false);
 profile=await service.saveManagerProfile({displayAlias:'Coach Gestion',locality:'Yaoundé',expertise:['gestion'],services:['formation'],bio:'Accompagnement',availability:'samedi',optIn:true,sharePublicGroups:true,shareAcademyCertificates:true});
 assert.equal(profile.reputationEvidence.basis,'PUBLIC_EVIDENCE_ONLY');assert.equal(profile.reputationEvidence.opaqueScore,false);
 assert.equal(profile.reputationEvidence.managedPublicGroups.length,1);assert.equal(profile.reputationEvidence.academyCertificates.length,1);
 assert.equal(profile.contactShared,false);assert.equal(profile.financialDataShared,false);assert.equal(profile.rawIdentityShared,false);assert.equal(profile.automaticRoleGrant,false);
 setCtx(k,'searcher','tenant_search');await repo.saveUser({id:'searcher',displayName:'Chercheur',locale:'fr',createdAt:at});
 const search=new DiscoveryService(repo,k),rows=await search.searchManagerProfiles({text:'gestion',locality:'Yaoundé'});
 assert.equal(rows.length,1);assert.equal(rows[0].displayAlias,'Coach Gestion');assert.equal(rows[0].reputationEvidence.opaqueScore,false);
 assert.equal('phone' in rows[0],false);assert.equal('email' in rows[0],false);assert.equal('balance' in rows[0],false);
});
test('manager public profile UI states consent, evidence and no opaque reputation score',()=>{
 const ui=fs.readFileSync('apps/web/src/manager-public-profile-ui.js','utf8');
 assert.match(ui,/votre consentement/);assert.match(ui,/Réputation explicable/);assert.match(ui,/Score opaque : non/);assert.match(ui,/finance partagée : non/);
});
