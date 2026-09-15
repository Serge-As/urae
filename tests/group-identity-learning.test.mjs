import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {GroupIdentityService} from '../.build/packages/group-identity/src/index.js';
import {ConciergeLearningService,aggregateCollectiveLearning} from '../.build/packages/concierge-learning/src/index.js';

const context=(kernel,actorId='owner')=>kernel.context.set({tenantId:'tenant_a',actorId,activeGroupId:'group_a',groupRoles:actorId==='owner'?['founder','manager']:['member'],mandateIds:[],deviceId:'d',sessionId:'s-'+actorId,locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r-'+actorId});
const group={id:'group_a',tenantId:'tenant_a',name:'Association A',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2020-01-02T00:00:00.000Z'};

test('group passport code is stable while rules fingerprint tracks governed configuration',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);
  const identity=new GroupIdentityService(repo,kernel);const a=await identity.issue('group_a'),b=await identity.compute('group_a');
  assert.equal(a.publicCode,b.publicCode);assert.equal(a.identityFingerprint,b.identityFingerprint);assert.match(a.publicCode,/^ECO-GRP-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{2}$/);
  const rubric={id:'rubric_a',tenantId:'tenant_a',groupId:'group_a',name:'Secours',aliases:[],facets:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'EVENT_BASED'},status:'DRAFT',source:'GROUP_CUSTOM',version:1,createdAt:'2026-09-15T00:00:00.000Z',updatedAt:'2026-09-15T00:00:00.000Z'};
  await repo.saveRubricDefinition(rubric);const c=await identity.compute('group_a');
  assert.equal(c.publicCode,a.publicCode,'stable identity code must survive rule changes');assert.notEqual(c.rulesFingerprint,a.rulesFingerprint,'rules fingerprint must change when group rules change');
  assert.equal((await identity.verify('group_a',a.publicCode,a.rulesFingerprint)).identityMatches,true);
});

test('beta collective learning is on by default, sourced and refuses sensitive categories',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);
  const svc=new ConciergeLearningService(repo,kernel);
  const before=await svc.learn('group_a',{category:'MEETING_RHYTHM',key:'meeting.cadence',value:'2e samedi du mois',sourceRef:'RI:article-8',confidence:0.94,privacy:'GROUP_SHAREABLE'});
  assert.equal(before.collectiveEligible,true,'beta profile should exercise safe collective learning without extra setup');
  await svc.setConsent('group_a','COLLECTIVE_LEARNING',false);
  const stillActive=await svc.learn('group_a',{category:'MEETING_RHYTHM',key:'meeting.cadence.beta-open',value:'2e samedi du mois',sourceRef:'RI:article-8',confidence:0.95,privacy:'GROUP_SHAREABLE'});
  assert.equal(stillActive.collectiveEligible,true,'BETA_OPEN must keep safe collective learning active even if a stale OFF preference exists');
  await assert.rejects(()=>svc.learn('group_a',{category:'DEBT',key:'member.debt',value:'75000',sourceRef:'ledger:member-x',confidence:1,privacy:'GROUP_SHAREABLE'}),/CATEGORY_NOT_SHAREABLE/);
  const signals=await svc.safeCollectiveSignals('group_a','ECO-GRP-AAAAA-BBBBB-CC');assert.equal(signals.length,2);
});

test('beta commercial affinities are available by default but never include finance or disputes',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);
  const svc=new ConciergeLearningService(repo,kernel);
  await svc.learn('group_a',{category:'MARKET_INTEREST',key:'market.category',value:'huile et savon',sourceRef:'market:group-buy-preference',confidence:0.8,privacy:'GROUP_PRIVATE'});
  await svc.learn('group_a',{category:'DISPUTE',key:'dispute.pattern',value:'retard paiement',sourceRef:'case:1',confidence:1,privacy:'GROUP_PRIVATE'});
  assert.deepEqual(await svc.commercialAffinities('group_a'),[{category:'MARKET_INTEREST',key:'market.category',value:'huile et savon'}]);
  await svc.setConsent('group_a','COMMERCIAL_PERSONALIZATION',false);
  assert.deepEqual(await svc.commercialAffinities('group_a'),[{category:'MARKET_INTEREST',key:'market.category',value:'huile et savon'}],'BETA_OPEN keeps non-sensitive commercial affinities active for every beta account');
});


test('privacy-first profile honors an explicit OFF preference while beta can preserve it for later',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);
  const beta=new ConciergeLearningService(repo,kernel,'BETA_OPEN');
  await beta.setConsent('group_a','COMMERCIAL_PERSONALIZATION',false);
  assert.equal((await beta.consent('group_a')).purposes.COMMERCIAL_PERSONALIZATION,true);
  const privacy=new ConciergeLearningService(repo,kernel,'PRIVACY_FIRST');
  assert.equal((await privacy.consent('group_a')).purposes.COMMERCIAL_PERSONALIZATION,false);
});

test('collective discoveries require k-anonymity across distinct groups',()=>{
  const signals=[];for(let i=1;i<=5;i++)signals.push({groupCode:'G'+i,category:'MEETING_RHYTHM',key:'cadence',value:'monthly',confidence:0.8+i/100});
  signals.push({groupCode:'G1',category:'MEETING_RHYTHM',key:'cadence',value:'monthly',confidence:0.9});
  const discoveries=aggregateCollectiveLearning(signals,5);assert.equal(discoveries.length,1);assert.equal(discoveries[0].supportingGroups,5);assert.equal(discoveries[0].privacy,'K_ANONYMIZED');
  assert.deepEqual(aggregateCollectiveLearning(signals.slice(0,4),5),[]);
});

test('privacy-first profile keeps all transverse purposes off until explicitly enabled',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();context(kernel);await repo.saveGroup(group);
  const svc=new ConciergeLearningService(repo,kernel,'PRIVACY_FIRST');
  const consent=await svc.consent('group_a');
  assert.deepEqual(consent.purposes,{COLLECTIVE_LEARNING:false,COMMERCIAL_PERSONALIZATION:false,PARTNER_MATCHING:false,COMMUNITY_DISCOVERY:false});
  assert.equal(consent.defaultMode,'PRIVACY_FIRST');
  const memory=await svc.learn('group_a',{category:'MEETING_RHYTHM',key:'meeting.cadence',value:'monthly',sourceRef:'RI:1',confidence:0.8,privacy:'GROUP_SHAREABLE'});
  assert.equal(memory.collectiveEligible,false);
  await svc.setConsent('group_a','COLLECTIVE_LEARNING',true);
  const enabled=await svc.learn('group_a',{category:'MEETING_RHYTHM',key:'meeting.cadence.2',value:'monthly',sourceRef:'RI:1',confidence:0.8,privacy:'GROUP_SHAREABLE'});
  assert.equal(enabled.collectiveEligible,true);
});
