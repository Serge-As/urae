import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {GrowthReferralService,InMemoryReferralBudgetStore} from '../.build/packages/growth-referral/src/index.js';

const setActor=(kernel,id)=>kernel.context.set({actorId:id,tenantId:'tenant_referral',groupRoles:[],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-'+id});

test('unsafe referral campaign structures are rejected before activation',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();setActor(kernel,'owner');
  const service=new GrowthReferralService(repo,kernel,new InMemoryReferralBudgetStore());
  await assert.rejects(()=>service.createCampaign({title:'Multi',targetKind:'GROUP',targetId:'g1',budgetTotal:10000,rewardPerConversion:1000,levels:2,fundingSource:'SANDBOX_BUDGET'}),/REFERRAL_STRUCTURE_FORBIDDEN/);
  await assert.rejects(()=>service.createCampaign({title:'Cotisations',targetKind:'GROUP',targetId:'g1',budgetTotal:10000,rewardPerConversion:1000,levels:1,fundingSource:'GROUP_APPROVED_BUDGET',fundingEvidenceRef:'PV',promisedReturnLinkedToRecruitment:true}),/REFERRAL_STRUCTURE_FORBIDDEN/);
});

test('reported conversion reserves no reward until campaign owner verifies it',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),budgets=new InMemoryReferralBudgetStore();setActor(kernel,'owner');
  const service=new GrowthReferralService(repo,kernel,budgets);
  const created=await service.createCampaign({title:'Direct',targetKind:'GROUP',targetId:'g1',budgetTotal:2000,rewardPerConversion:1000,fundingSource:'SANDBOX_BUDGET',maxRewardsPerBeneficiary:2});
  await service.setCampaignState(created.record.id,'ACTIVE');
  const share=await service.createShare({targetKind:'GROUP',targetId:'g1',campaignId:created.record.id,channel:'LINK'});
  setActor(kernel,'referred');await service.registerLanding(share.code);
  const detected=await service.registerConversion({code:share.code,kind:'MEMBERSHIP_APPROVED',eventRef:'membership-1',evidenceSummary:'Adhésion annoncée'});
  assert.equal(detected.rewardReserved,false);assert.equal(detected.conversion.data.verificationState,'PENDING_VERIFICATION');
  assert.equal((await budgets.snapshot(created.record.id)).reservedAmount,0);
  setActor(kernel,'owner');const verified=await service.verifyConversion(created.record.id,detected.conversion.id,{accepted:true,reason:'Adhésion vérifiée dans le groupe',reviewEvidenceRef:'membership-1'});
  assert.equal(verified.conversion.data.verificationState,'VERIFIED');assert.equal(verified.conversion.data.rewardReserved,true);assert.equal(verified.budget.reservedAmount,1000);
  const approved=await service.approveReward(created.record.id,detected.conversion.id);assert.equal(approved.conversion.data.rewardState,'APPROVED_SANDBOX');assert.equal(approved.conversion.data.payoutRealMoney,false);assert.equal(approved.budget.spentAmount,1000);
});

test('rejected conversion never consumes campaign budget',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),budgets=new InMemoryReferralBudgetStore();setActor(kernel,'owner');
  const service=new GrowthReferralService(repo,kernel,budgets);
  const c=await service.createCampaign({title:'Direct',targetKind:'GROUP',targetId:'g1',budgetTotal:1000,rewardPerConversion:1000});await service.setCampaignState(c.record.id,'ACTIVE');
  const share=await service.createShare({targetKind:'GROUP',targetId:'g1',campaignId:c.record.id});
  setActor(kernel,'person');await service.registerLanding(share.code);const d=await service.registerConversion({code:share.code,kind:'LEAD_QUALIFIED',eventRef:'lead-1',evidenceSummary:'Lead à examiner'});
  setActor(kernel,'owner');const rejected=await service.verifyConversion(c.record.id,d.conversion.id,{accepted:false,reason:'Preuve insuffisante'});
  assert.equal(rejected.conversion.data.rewardState,'REJECTED');assert.equal((await budgets.snapshot(c.record.id)).reservedAmount,0);
});
