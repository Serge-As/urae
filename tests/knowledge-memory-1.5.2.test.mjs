import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {KnowledgeAcademyService} from '../.build/packages/knowledge-academy/src/index.js';

const ctx=(kernel,actorId,tenantId='tenant_knowledge',activeGroupId)=>kernel.context.set({actorId,tenantId,activeGroupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-'+actorId});

const seed=async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel,'founder');
  const foundation=new FoundationService(repo,kernel);await foundation.ensureUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
  const p=await foundation.createProject({tenantId:'tenant_knowledge',createdBy:'founder',name:'Groupe mémoire',kind:'association',governanceModel:'community',memberCount:5,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const group=await foundation.convertProjectToGroup('tenant_knowledge',p.id);ctx(kernel,'founder','tenant_knowledge',group.id);
  return{repo,kernel,group,service:new KnowledgeAcademyService(repo,kernel)};
};

test('revision preserves stable item identity and supersedes old version',async()=>{
  const {repo,service}=await seed();
  const first=await service.createKnowledge({title:'Règle test',kind:'OBSERVATION',body:'Version initiale'});
  const second=await service.reviseKnowledge(first.id,{body:'Version révisée',reason:'Retour terrain'});
  assert.equal(second.data.knowledgeItemId,first.data.knowledgeItemId);assert.equal(second.data.version,2);
  const old=await repo.getWorkspaceRecord('tenant_knowledge',first.id);assert.equal(old.status,'ARCHIVED');assert.equal(old.data.knowledgeState,'SUPERSEDED');
  const found=await service.searchKnowledge('Règle');assert.equal(found.length,1);assert.equal(found[0].id,second.id);
});

test('expired or review-due knowledge is surfaced as to revalidate, not silently trusted',async()=>{
  const {service}=await seed(),past=new Date(Date.now()-86400000).toISOString();
  await service.createKnowledge({title:'Info volatile',kind:'EXTERNAL_SOURCE',body:'À revoir',nextReviewAt:past});
  const [row]=await service.searchKnowledge('volatile');assert.equal(row.data.knowledgeState,'TO_REVALIDATE');assert.equal(row.data.stale,true);
});

test('private memory is visible only to its author',async()=>{
  const {repo,kernel,service}=await seed();
  await service.createKnowledge({title:'Note privée',kind:'PRODUCT_MEMORY',body:'secret non financier',sensitivity:'PRIVATE'});
  await repo.saveUser({id:'other',displayName:'Other',locale:'fr',createdAt:new Date().toISOString()});ctx(kernel,'other');
  assert.equal((await service.searchKnowledge('Note privée')).length,0);
});

test('group knowledge requires group membership and Academy accepts only validated sources',async()=>{
  const {repo,kernel,group,service}=await seed();
  const k=await service.createKnowledge({title:'Règle groupe',kind:'VALIDATED_RULE',body:'Règle locale',groupId:group.id,sensitivity:'GROUP'});
  await assert.rejects(()=>service.createCourse({title:'Cours',audience:'Managers',description:'test',lessons:[{id:'l1',title:'Leçon',objective:'Comprendre'}],sourceKnowledgeIds:[k.id]}),/ACADEMY_SOURCE_KNOWLEDGE_NOT_VALIDATED/);
  await service.reviewKnowledge(k.id,'VALIDATED');
  const course=await service.createCourse({title:'Cours',audience:'Managers',description:'test',lessons:[{id:'l1',title:'Leçon',objective:'Comprendre'}],sourceKnowledgeIds:[k.id]});assert.ok(course.id);
  await repo.saveUser({id:'outsider',displayName:'Outsider',locale:'fr',createdAt:new Date().toISOString()});ctx(kernel,'outsider','tenant_knowledge',group.id);
  await assert.rejects(()=>service.searchKnowledge('Règle groupe',group.id),/FORBIDDEN_SCOPE/);
});
