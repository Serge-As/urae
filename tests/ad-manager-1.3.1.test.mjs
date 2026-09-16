import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {AdManagerService,buildContextualHouseAdPlan,selectAdDelivery} from '../.build/packages/ad-manager/src/index.js';

async function setup(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  kernel.context.set({tenantId:'t',actorId:'owner',activeGroupId:'g',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
  await repo.saveGroup({id:'g',tenantId:'t',name:'Groupe',kind:'association',governanceModel:'founder_managed',status:'active',createdBy:'owner',createdAt:'2026-09-15T00:00:00Z'});
  return{repo,kernel,ads:new AdManagerService(repo,kernel)};
}
const campaign=()=>({name:'Savons de rentrée',objective:'GROUP_BUY',budgetSandbox:50000,currency:'XAF',placements:['FEED','COMMUNITY'],frequencyCapPer7Days:4,targeting:{localities:['Yaoundé'],interestTags:['achats-groupes'],rubricKinds:['TONTINE_IN_KIND'],aggregateRubricVolumeBands:['SAVON:100000-500000']},creative:{headline:'Prix groupé savons',body:'Une offre négociée pour les groupes intéressés.',callToAction:'Voir le deal',destinationRef:'group-buy:soap-1'}});

test('AdManager creates a governed sandbox campaign and follows moderation lifecycle',async()=>{
  const {ads}=await setup();let c=await ads.create('g',campaign());
  assert.equal(c.state,'DRAFT');assert.equal(c.budgetSandbox,50000);
  c=await ads.transition('g',c.id,'PENDING_REVIEW');c=await ads.transition('g',c.id,'APPROVED','Créatif et ciblage agrégé conformes');c=await ads.transition('g',c.id,'ACTIVE');
  c=await ads.metric('g',c.id,'IMPRESSION');c=await ads.metric('g',c.id,'OPEN');c=await ads.metric('g',c.id,'ACTION');
  assert.equal(c.impressions,1);assert.equal(c.opens,1);assert.equal(c.actions,1);
});

test('AdManager forbids individual financial and identity targeting but allows pseudonymous group monetary bands',async()=>{
  const {ads}=await setup();
  await assert.rejects(()=>ads.create('g',{...campaign(),targeting:{interestTags:['member-debt-high']}}),/SENSITIVE_AD_TARGETING_FORBIDDEN/);
  await assert.rejects(()=>ads.create('g',{...campaign(),targeting:{interestTags:['CNI-match']}}),/SENSITIVE_AD_TARGETING_FORBIDDEN/);
  const ok=await ads.create('g',campaign());assert.deepEqual(ok.targeting.aggregateRubricVolumeBands,['SAVON:100000-500000']);
});

test('campaign cannot bypass moderation and become active from draft',async()=>{
  const {ads}=await setup();const c=await ads.create('g',campaign());
  await assert.rejects(()=>ads.transition('g',c.id,'ACTIVE'),/INVALID_AD_CAMPAIGN_TRANSITION/);
});


test('House Ads adapt to the exercise stage and group rubrics while retaining exploration',()=>{
  const early=buildContextualHouseAdPlan({groupKey:'g-early',originMode:'IMPORT_EXISTING',exerciseProgress:.08,monthsToExerciseEnd:11,rubricKinds:['CONTRIBUTION'],rubricNames:['Collation','Secours'],lowBandwidth:true});
  assert.ok(early.slice(0,4).some(x=>x.key==='ACADEMY'));
  assert.ok(early.slice(0,4).some(x=>x.key==='PAPER_BRIDGE'));
  const closing=buildContextualHouseAdPlan({groupKey:'g-closing',exerciseProgress:.75,monthsToExerciseEnd:3.5,rubricKinds:['SAVINGS','SOLIDARITY'],rubricNames:['Épargne','Secours']});
  assert.equal(closing[0].key,'INTEREST_FAIRNESS_LAB');
  assert.ok(closing[0].reasonCodes.includes('FOUR_MONTH_CLOSING_WINDOW'));
  const inKind=buildContextualHouseAdPlan({groupKey:'g-soap',exerciseProgress:.4,monthsToExerciseEnd:7,rubricKinds:['TONTINE'],rubricNames:['Tontine savons','Tontine draps']});
  assert.equal(inKind[0].key,'DEMAND_EXCHANGE');
  const unrelated=buildContextualHouseAdPlan({groupKey:'g-general',exerciseProgress:.4,monthsToExerciseEnd:7,rubricKinds:['SOLIDARITY'],rubricNames:['Secours']});
  const demand=unrelated.find(x=>x.key==='DEMAND_EXCHANGE');
  assert.ok(demand,'general groups keep exploratory commerce promotions in the candidate plan');
  assert.ok(demand.score<inKind[0].score,'in-kind context receives stronger emphasis than unrelated groups');
});

test('paid ad delivery checks contextual interest tags and falls back to a contextual House Ad',async()=>{
  const {ads}=await setup();
  let c=await ads.create('g',{...campaign(),placements:['FEED_NATIVE']});
  c=await ads.transition('g',c.id,'PENDING_REVIEW');c=await ads.transition('g',c.id,'APPROVED');c=await ads.transition('g',c.id,'ACTIVE');
  const noMatch=selectAdDelivery([c],{placementId:'FEED_NATIVE',locality:'Yaoundé',interestTags:['formation'],rubricKind:'TONTINE_IN_KIND',houseContext:{groupKey:'g',exerciseProgress:.1,monthsToExerciseEnd:10,rubricKinds:['CONTRIBUTION'],rubricNames:['Collation']}});
  assert.equal(noMatch.kind,'HOUSE');
  const match=selectAdDelivery([c],{placementId:'FEED_NATIVE',locality:'Yaoundé',interestTags:['achats-groupes'],rubricKind:'TONTINE_IN_KIND',houseContext:{groupKey:'g',exerciseProgress:.4,monthsToExerciseEnd:7,rubricKinds:['TONTINE'],rubricNames:['Tontine savons']}});
  assert.equal(match.kind,'PAID');assert.equal(match.campaignId,c.id);
});
