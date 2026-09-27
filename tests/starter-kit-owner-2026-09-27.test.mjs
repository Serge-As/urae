import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {StarterKitService} from '../.build/packages/starter-kit/src/index.js';

const context=(kernel,actor,groupId)=>kernel.context.set({actorId:actor,tenantId:'tenant_kit',activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_kit'});
const payload=(version='1.5.2.7')=>({
  kitVersion:version,generatedAt:'2026-09-27T12:00:00.000Z',family:'association',governance:'community',members:25,sessions:12,
  monetaryVolume:300000,managerFees:12000,estimatedExternal:3000,fixedCosts:2000,estimatedMargin:7000,
  rubricRowsJson:JSON.stringify([{name:'Collation',kind:'CONTRIBUTION',mode:'MONEY',participation:'RULE_BASED',amount:1000,nominalCycle:300000,fees:12000}]),
  checklistJson:JSON.stringify([['OBLIGATOIRE','Valider les rubriques']]),calendarJson:JSON.stringify([{index:1,label:'Séance 1',date:'2026-10-10'}]),
  risksJson:JSON.stringify(['Valider la règle de retard']),rulesJson:JSON.stringify(['Une écriture reste traçable.']),
  recommendedModel:'Association avec rubriques gouvernées',indicativeAmount:1000,feeExampleJson:JSON.stringify({perPayment:40}),
  orderPolicy:'Ordre décidé par le groupe',latePolicyJson:JSON.stringify({text:'Sous validation'}),simulationJson:JSON.stringify({central:{revenue:12000,cost:5000,indicativeMargin:7000}}),
  adviceJson:JSON.stringify(['Rapprocher la caisse']),invitation:'Invitation groupe',minutes:'Modèle de PV',profileJson:JSON.stringify({origin:{mode:'NEW'}})
});

async function seed(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),foundation=new FoundationService(repo,kernel);context(kernel,'founder');
  await foundation.ensureUser({id:'founder',displayName:'Fondatrice',locale:'fr',createdAt:new Date().toISOString()});
  const project=await foundation.createProject({tenantId:'tenant_kit',createdBy:'founder',name:'Groupe Kit',kind:'association',governanceModel:'community',memberCount:25,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const group=await foundation.convertProjectToGroup('tenant_kit',project.id);context(kernel,'founder',group.id);
  return{repo,kernel,group,service:new StarterKitService(repo,kernel)};
}

test('Starter Kit owner persists the complete governed pack without touching the Ledger',async()=>{
  const {repo,group,service}=await seed(),before=(await repo.listLedgerEntries('tenant_kit',group.id)).length;
  const first=await service.save(group.id,payload());
  assert.equal(first.moduleId,'RUBRIC.STARTER_KITS');
  assert.equal(first.data.rubricRowsJson,payload().rubricRowsJson);
  assert.equal(first.data.checklistJson,payload().checklistJson);
  assert.equal(first.data.calendarJson,payload().calendarJson);
  assert.equal(first.data.rulesJson,payload().rulesJson);
  assert.equal(first.data.invitation,'Invitation groupe');
  assert.equal(first.data.minutes,'Modèle de PV');
  assert.equal((await repo.listLedgerEntries('tenant_kit',group.id)).length,before);
  const second=await service.save(group.id,{...payload('1.5.2.7-r2'),recommendedModel:'Modèle révisé'});
  assert.equal(second.id,first.id,'one canonical current kit per group');
  assert.equal(second.data.recommendedModel,'Modèle révisé');
  assert.equal((await repo.listWorkspaceRecords('tenant_kit','RUBRIC.STARTER_KITS',group.id)).length,1);
});

test('Launch Studio uses the dedicated Starter Kit API instead of an invented generic module id',()=>{
  const launch=fs.readFileSync('apps/web/src/launch-studio.js','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
  const viewer=fs.readFileSync('apps/web/src/starter-kit-ui.js','utf8');
  assert.match(launch,/app\.saveStarterKit\(groupId,data\)/);
  assert.doesNotMatch(launch,/GROUP\.STARTER_KIT/);
  assert.match(app,/saveStarterKit/);
  assert.match(worker,/StarterKitService/);
  assert.match(worker,/\/starter-kit/);
  for(const marker of ['Rubriques & chiffrage','Checklist de lancement','Calendrier','Risques / décisions à compléter','Règlement / règles à adapter','Invitation & modèle de PV'])assert.ok(viewer.includes(marker),marker);
});
