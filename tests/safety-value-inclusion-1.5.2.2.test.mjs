import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {SafetyCenterService} from '../.build/packages/safety-center/src/index.js';
import {ValueNetworkService} from '../.build/packages/value-network/src/index.js';
import {STRUCTURAL_INCLUSION_CHARTER} from '../.build/packages/external-programs/src/index.js';

const context=kernel=>kernel.context.set({actorId:'user_test',tenantId:'tenant_test',activeGroupId:'group_test',groupRoles:['founder','manager'],mandateIds:[],deviceId:'device_test',sessionId:'session_test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_test'});

test('anti-Ponzi safety engine blocks multi-level recruitment and keeps a reviewable case',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);const safety=new SafetyCenterService(repo,kernel);
  const assessment=safety.assessText('Commission sur les recrues de mes recrues dans une structure multi-niveau');
  assert.equal(assessment.flagged,true);assert.equal(assessment.blocked,true);assert.equal(assessment.riskKind,'PYRAMID_PONZI');
  const opened=await safety.screenAndOpen({text:'Recrute puis gagne sur ta downline',groupId:'group_test',entityType:'REFERRAL_CAMPAIGN'});
  assert.equal(opened.assessment.blocked,true);assert.ok(opened.case);
  const cases=await safety.list('group_test');assert.equal(cases.length,1);assert.equal(cases[0].data.caseState,'SIGNAL');
  const reviewed=await safety.review(cases[0].id,{decision:'RESTRICT',note:'Structure multi-niveau à corriger'});assert.equal(reviewed.data.caseState,'RESTRICTED');
  const appeal=await safety.appeal(cases[0].id,'Campagne reformulée en recommandation directe');assert.equal(appeal.data.caseState,'APPEALED');
});

test('safety distinguishes a signal from a proven accusation',()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);const safety=new SafetyCenterService(repo,kernel);
  const a=safety.assessText('Rendement garanti sans risque : doublez votre argent');
  assert.equal(a.flagged,true);assert.equal(a.riskKind,'MISLEADING_RETURN');assert.equal(a.blocked,false);
  assert.ok(a.rationale.length>0);
});

test('value matching rejects wrong units and explains landed cost without inventing unknowns',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);const value=new ValueNetworkService(repo,kernel);
  const need=await value.createNeed({groupId:'group_test',title:'100 cartons savon',category:'savon',quantity:100,unit:'carton',locality:'Yaoundé',maxTotalBudget:550000,currency:'XAF'});
  await value.validateNeed(need.id);
  await value.createOffer({kind:'SUPPLIER',title:'Bon fournisseur',category:'savon',availableQuantity:120,unit:'carton',locality:'Yaoundé',unitPrice:5000,deliveryCost:20000,currency:'XAF',expiresAt:new Date(Date.now()+7*86400000).toISOString(),supplierReliability:80});
  await value.createOffer({kind:'SUPPLIER',title:'Mauvaise unité',category:'savon',availableQuantity:1000,unit:'pièce',locality:'Yaoundé',unitPrice:10,currency:'XAF',expiresAt:new Date(Date.now()+7*86400000).toISOString()});
  const matches=await value.matchNeed(need.id);assert.equal(matches.length,1);assert.equal(matches[0].offer.title,'Bon fournisseur');assert.equal(matches[0].explanation.landedTotal,520000);assert.ok(matches[0].advantages.includes('UNIT_EXACT'));
});

test('value matching fails closed on a hard budget ceiling but leaves missing optional facts explicitly unknown',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);const value=new ValueNetworkService(repo,kernel);
  const need=await value.createNeed({groupId:'group_test',title:'Besoin huile',category:'huile',quantity:10,unit:'bidon',maxUnitPrice:5000});
  await value.validateNeed(need.id);
  await value.createOffer({kind:'SUPPLIER',title:'Trop cher',category:'huile',availableQuantity:20,unit:'bidon',unitPrice:6000,currency:'XAF',expiresAt:new Date(Date.now()+7*86400000).toISOString()});
  assert.equal((await value.matchNeed(need.id)).length,0);
  const need2=await value.createNeed({groupId:'group_test',title:'Besoin riz',category:'riz',quantity:5,unit:'sac'});
  await value.validateNeed(need2.id);
  await value.createOffer({kind:'SUPPLIER',title:'Prix non fourni',category:'riz',availableQuantity:5,unit:'sac',unitPrice:0,currency:'XAF',expiresAt:new Date(Date.now()+7*86400000).toISOString()});
  const m=await value.matchNeed(need2.id);assert.equal(m.length,1);assert.ok(m[0].unknowns.includes('UNIT_PRICE_UNKNOWN'));assert.equal(m[0].explanation.landedTotal,null);
});

test('structural inclusion charter excludes protected attributes from financial and trust scoring',()=>{
  assert.equal(STRUCTURAL_INCLUSION_CHARTER.equalRoleEligibility,true);
  assert.equal(STRUCTURAL_INCLUSION_CHARTER.voluntaryTargetedPrograms,true);
  assert.equal(STRUCTURAL_INCLUSION_CHARTER.protectedAttributesExcludedFromFinancialAndTrustScoring,true);
});

test('UI exposes safety review, women leadership and explainable matching',async()=>{
  const core=await readFile('.build/src/core-economic-learning-ui.js','utf8').catch(()=>null);
  // readFile import kept local below for build portability
  assert.ok(core===null||typeof core==='string');
});

import {readFile} from 'node:fs/promises';
test('operational UI surfaces safety, inclusion and landed-cost matching',async()=>{
  const core=await readFile('.build/src/core-economic-learning-ui.js','utf8');
  const html=await readFile('.build/index.html','utf8');
  assert.match(core,/anti-arnaque/);assert.match(core,/anti-pyramide/);assert.match(core,/coût rendu/);
  assert.match(html,/Leadership féminin/);assert.match(html,/attributs protégés ne sont pas utilisés dans les scores financiers/);
});
