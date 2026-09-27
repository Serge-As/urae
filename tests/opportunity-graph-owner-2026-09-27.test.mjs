import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {OpportunityGraphService} from '../.build/packages/opportunity-graph/src/index.js';

const stamp=()=>new Date().toISOString();
const ctx=(k,actor)=>k.context.set({actorId:actor,tenantId:'tenant_graph',activeGroupId:'g1',groupRoles:['member'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
test('Opportunity Graph is privacy-filtered derived projection and writes no second truth',async()=>{
  const repo=new InMemoryPlatformRepository(),k=new PlatformKernel();ctx(k,'u1');
  await repo.saveUser({id:'u1',displayName:'Alice',locale:'fr',createdAt:stamp()});
  await repo.saveGroup({id:'g1',tenantId:'tenant_graph',name:'Groupe Local',kind:'association',governanceModel:'community',createdBy:'founder',status:'active',createdAt:stamp()});
  await repo.saveMembership({id:'m1',tenantId:'tenant_graph',groupId:'g1',userId:'u1',status:'active',roles:['member'],joinedAt:stamp(),updatedAt:stamp()});
  await repo.savePublicGroupListing({id:'l1',tenantId:'tenant_graph',groupId:'g1',name:'Groupe Local',family:'association',visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'Yaoundé',missionTags:['entraide'],activityTags:['transport'],publishedAt:stamp(),updatedAt:stamp()});
  await repo.saveWorkspaceRecord({id:'vd1',tenantId:'tenant_graph',moduleId:'MANAGER.VALUE_DISCOVERY',title:'Profil',status:'ACTIVE',tags:['value-discovery'],data:{profileOwnerId:'u1',skillsJson:JSON.stringify(['Transport']),locality:'Yaoundé'},createdBy:'u1',createdAt:stamp(),updatedAt:stamp()});
  await repo.saveWorkspaceRecord({id:'public1',tenantId:'__eco_public_candidate_projection__',moduleId:'MEMBERSHIP.PORTFOLIO',title:'Couturière',status:'ACTIVE',tags:['public-candidate','consent:yes'],data:{ownerActorId:'other',optIn:true,displayAlias:'Couturière M.',locality:'Yaoundé',skills:JSON.stringify(['Couture']),interests:'[]',desiredGroupTags:'[]',bio:'',availability:'weekend'},createdBy:'other',createdAt:stamp(),updatedAt:stamp()});
  await repo.saveWorkspaceRecord({id:'private1',tenantId:'__eco_public_candidate_projection__',moduleId:'MEMBERSHIP.PORTFOLIO',title:'Privé',status:'ARCHIVED',tags:['public-candidate','consent:no'],data:{ownerActorId:'private',optIn:false,displayAlias:'Secret',locality:'Douala',skills:JSON.stringify(['SecretSkill']),interests:'[]',desiredGroupTags:'[]'},createdBy:'private',createdAt:stamp(),updatedAt:stamp()});
  await repo.saveWorkspaceRecord({id:'need1',tenantId:'tenant_graph',groupId:'g1',moduleId:'OPPORTUNITY.NEED',title:'Transport samedi',status:'ACTIVE',tags:['opportunity','need'],data:{state:'PUBLISHED',publicationConsent:true,category:'Transport',quantity:1,unit:'service',locality:'Yaoundé'},createdBy:'founder',createdAt:stamp(),updatedAt:stamp()});
  await repo.saveWorkspaceRecord({id:'offer1',tenantId:'tenant_graph',moduleId:'OPPORTUNITY.OFFER',title:'Service transport',status:'ACTIVE',tags:['opportunity','offer'],data:{state:'ACTIVE',category:'Transport',availableQuantity:2,unit:'service',locality:'Yaoundé'},createdBy:'seller',createdAt:stamp(),updatedAt:stamp()});
  await repo.saveWorkspaceRecord({id:'course1',tenantId:'tenant_graph',moduleId:'LEARNING.MANAGER_ACADEMY',title:'Transport & livraison',status:'ACTIVE',tags:['academy','course'],data:{kind:'COURSE',audience:'Tous',description:'Améliorer sa compétence transport'},createdBy:'founder',createdAt:stamp(),updatedAt:stamp()});
  const before=(await repo.listWorkspaceRecords('tenant_graph')).length,graph=await new OpportunityGraphService(repo,k).projection(),after=(await repo.listWorkspaceRecords('tenant_graph')).length;
  assert.equal(before,after,'graph must not persist a second source of truth');assert.equal(graph.persisted,false);assert.equal(graph.secondSourceOfTruth,false);assert.equal(graph.privacyFiltered,true);
  assert.ok(graph.nodes.some(x=>x.kind==='SKILL'&&x.label==='Transport'));assert.ok(graph.nodes.some(x=>x.kind==='NEED'&&x.ref==='need1'));assert.ok(graph.nodes.some(x=>x.kind==='OFFER'&&x.ref==='offer1'));assert.ok(graph.nodes.some(x=>x.kind==='COURSE'&&x.ref==='course1'));
  assert.ok(graph.nodes.some(x=>x.kind==='PERSON'&&x.label==='Couturière M.'));assert.ok(!graph.nodes.some(x=>x.label==='Secret'||x.label==='SecretSkill'));
  assert.ok(graph.edges.some(x=>x.relation==='MEMBER_OF'));assert.ok(graph.edges.some(x=>x.relation==='CATEGORY_COMPATIBLE_WITH'));
});
test('Opportunity Graph UI states that it is derived and low-bandwidth',()=>{
  const ui=fs.readFileSync('apps/web/src/opportunity-graph-ui.js','utf8');assert.match(ui,/ne devient jamais une seconde base de vérité/);assert.match(ui,/Nœuds visibles/);assert.match(ui,/Relations visibles/);
});
