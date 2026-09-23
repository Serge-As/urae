import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {ValueNetworkService} from '../.build/packages/value-network/src/index.js';

const seed=async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),tenantId='tenant_match',actorId='founder_match';
  kernel.context.set({actorId,tenantId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-match'});
  const foundation=new FoundationService(repo,kernel);
  await foundation.ensureUser({id:actorId,displayName:'Fondatrice',locale:'fr',createdAt:new Date().toISOString()});
  const p=await foundation.createProject({tenantId,createdBy:actorId,name:'Groupe Marché',kind:'association',governanceModel:'community',memberCount:5,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const group=await foundation.convertProjectToGroup(tenantId,p.id);
  kernel.context.set({actorId,tenantId,activeGroupId:group.id,groupRoles:['founder','manager'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-match-2'});
  return{repo,kernel,group,service:new ValueNetworkService(repo,kernel)};
};

test('matching converts compatible units and computes documented landed cost',async()=>{
  const {service,group}=await seed(),neededBy=new Date(Date.now()+6*86400000).toISOString(),expiresAt=new Date(Date.now()+20*86400000).toISOString(),availableBy=new Date(Date.now()+3*86400000).toISOString();
  const need=await service.createNeed({groupId:group.id,title:'Farine pour événement',category:'farine',quantity:2,unit:'kg',locality:'Yaoundé',neededBy,specification:'maïs blanc',quality:'A',budgetMax:5000,currency:'XAF',publicationConsent:true});
  await service.validateNeed(need.id);
  await service.createOffer({kind:'SUPPLIER',title:'Farine locale',category:'farine',availableQuantity:3000,unit:'g',locality:'Yaoundé',specification:'maïs blanc',quality:'A',availableBy,expiresAt,unitPrice:2,transportCost:500,otherCosts:100,discount:100,currency:'XAF',documentedDeliveries:4,confirmedDisputes:0});
  const matches=await service.matchNeed(need.id);
  assert.equal(matches.length,1);assert.equal(matches[0].landedTotal,4500);assert.ok(matches[0].score>0);
  assert.ok(matches[0].explanations.some(x=>x.includes('Quantité couverte')));
  assert.equal(matches[0].rankingIndependentOfSponsorship,true);
});

test('budget-constrained need never treats unknown landed costs as zero',async()=>{
  const {service,group}=await seed(),neededBy=new Date(Date.now()+6*86400000).toISOString(),expiresAt=new Date(Date.now()+20*86400000).toISOString(),availableBy=new Date(Date.now()+3*86400000).toISOString();
  const need=await service.createNeed({groupId:group.id,title:'Savons',category:'savons',quantity:10,unit:'unité',locality:'Yaoundé',neededBy,budgetMax:15000,currency:'XAF',publicationConsent:true});
  await service.validateNeed(need.id);
  await service.createOffer({kind:'SUPPLIER',title:'Savons sans transport chiffré',category:'savons',availableQuantity:20,unit:'unité',locality:'Yaoundé',availableBy,expiresAt,unitPrice:1000,currency:'XAF'});
  assert.equal((await service.matchNeed(need.id)).length,0);
});

test('publication requires explicit consent and sponsorship never changes trust score by itself',async()=>{
  const {service,group}=await seed(),expiresAt=new Date(Date.now()+20*86400000).toISOString();
  const need=await service.createNeed({groupId:group.id,title:'Service photo',category:'photo',quantity:2,unit:'heure',publicationConsent:false});
  await service.validateNeed(need.id);
  await assert.rejects(()=>service.publishNeed(need.id),/NEED_PUBLICATION_CONSENT_REQUIRED/);
  const safe=await service.createNeed({groupId:group.id,title:'Service photo privé',category:'photo',quantity:2,unit:'heure',publicationConsent:true});
  await service.validateNeed(safe.id);
  await service.createOffer({kind:'SERVICE',title:'Studio sponsorisé',category:'photo',availableQuantity:4,unit:'heure',expiresAt,unitPrice:5000,transportCost:0,otherCosts:0,currency:'XAF',sponsored:true});
  const [match]=await service.matchNeed(safe.id);assert.equal(match.sponsored,true);assert.equal(match.rankingIndependentOfSponsorship,true);
  assert.ok(match.warnings.some(x=>x.includes('sponsorisée')));
});
