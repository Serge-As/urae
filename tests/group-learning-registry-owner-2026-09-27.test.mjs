import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {GroupModelRegistryService,GroupCaseLawService} from '../.build/packages/group-learning-registry/src/index.js';

const setCtx=(k,actor,groupId)=>k.context.set({actorId:actor,tenantId:'tenant_models',activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
async function seed(){
  const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),f=new FoundationService(repo,k);setCtx(k,'founder');
  await f.ensureUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
  const p=await f.createProject({tenantId:'tenant_models',createdBy:'founder',name:'Association Test',kind:'association',governanceModel:'community',rubrics:[{key:'coll',name:'Collation',kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:1000},memberCount:10,sessions:12,participationMode:'RULE_BASED',contributionMode:'MONEY'}]});
  const g=await f.convertProjectToGroup('tenant_models',p.id);setCtx(k,'founder',g.id);return{repo,k,g,models:new GroupModelRegistryService(repo,k),cases:new GroupCaseLawService(repo,k)};
}

test('Group Model Registry versions sanitized group models instead of generic notes',async()=>{
  const {repo,g,models}=await seed();
  const v1=await models.capture(g.id,{title:'Modèle secours-épargne',modelState:'EXPERIMENTAL',context:'Association de quartier avec séances mensuelles.',evidenceRef:'PV-2026-01',compatibility:'Associations avec cotisations mensuelles',outcomes:'Cycle pilote stable'});
  assert.equal(v1.moduleId,'GROUP.MODEL_REGISTRY');
  assert.equal(v1.data.modelVersion,1);
  assert.equal(v1.data.modelState,'EXPERIMENTAL');
  assert.equal(v1.data.containsMemberData,false);
  const rubrics=JSON.parse(v1.data.rubricBlueprintJson);
  assert.ok(rubrics.some(x=>x.name==='Collation'));
  const v2=await models.capture(g.id,{title:'Variante secours-épargne',modelState:'STANDARD',context:'Variante après mesure du pilote.',evidenceRef:'PV-2026-06',compatibility:'Même famille',outcomes:'Résultats consolidés',variantOfId:v1.id});
  assert.equal(v2.data.modelKey,v1.data.modelKey);
  assert.equal(v2.data.modelVersion,2);
  const requested=await models.requestReview(g.id,v2.id);assert.equal(requested.data.modelState,'REVIEW_REQUESTED');
  await assert.rejects(()=>models.review(v2.id,'RECOMMENDED','Validé',false),/FOUNDER_TEAM_ONLY/);
  const reviewed=await models.review(v2.id,'RECOMMENDED','Simulation et résultats relus.',true);assert.equal(reviewed.data.modelState,'RECOMMENDED');
  assert.equal((await repo.listWorkspaceRecords('tenant_models','GROUP.MODEL_REGISTRY',g.id)).length,2);
});

test('Case Law requires simulation measurement arbitration and reproducibility before global recommendation',async()=>{
  const {g,cases}=await seed();
  const draft=await cases.create(g.id,{title:'Pratique exceptionnelle',situation:'Cotisation décalée après événement local.',justification:'Décision exceptionnelle du groupe.',experiment:'Décalage testé sur une séance.',evidenceRef:'PV-CASE-1'});
  await cases.validateLocal(g.id,draft.id);
  await assert.rejects(()=>cases.requestReview(g.id,draft.id),/CASE_LAW_RECOMMENDATION_EVIDENCE_INCOMPLETE/);
  const complete=await cases.create(g.id,{title:'Pratique mesurée',situation:'Ordre alternatif testé.',justification:'Contrainte documentée.',experiment:'Pilote sur trois séances.',results:'Aucun écart de caisse et satisfaction documentée.',disputes:'Une réserve résolue.',reproducibility:'Reproduit sur deux cycles comparables.',evidenceRef:'PV-CASE-2',simulationRef:'SIM-2',measurementRef:'METRIC-2',arbitrationRef:'ARB-2'});
  const requested=await cases.requestReview(g.id,complete.id);assert.equal(requested.data.caseState,'REVIEW_REQUESTED');
  await assert.rejects(()=>cases.review(complete.id,'RECOMMENDED','ok',false),/FOUNDER_TEAM_ONLY/);
  const recommended=await cases.review(complete.id,'RECOMMENDED','Mesure et arbitrage vérifiés.',true);assert.equal(recommended.data.globalRecommendation,true);assert.equal(recommended.data.autoRuleActivation,false);
});

test('specialized UI replaces generic workspace paths for models and case-law',()=>{
  const ui=fs.readFileSync('apps/web/src/group-learning-registry-ui.js','utf8');
  const old=fs.readFileSync('apps/web/src/operational-registry-ui.js','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(ui,/captureGroupModel/);assert.match(ui,/createCaseLaw/);assert.match(ui,/founderReviewGroupModel/);assert.match(ui,/founderReviewCaseLaw/);
  assert.doesNotMatch(old,/createWorkspaceRecord\(\{moduleId:'GROUP\.MODEL_REGISTRY'/);
  assert.doesNotMatch(old,/createWorkspaceRecord\(\{moduleId:'GROUP\.CASE_LAW'/);
  assert.match(app,/groupModels/);assert.match(app,/caseLaw/);
});
