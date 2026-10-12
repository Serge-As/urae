import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {ValueNetworkService} from '../.build/packages/value-network/src/index.js';

test('forum business handoff uses the existing forms and never directly writes business or finance data',()=>{
  const forum=fs.readFileSync('apps/web/src/community-shop-ui.js','utf8');
  const ownerUI=fs.readFileSync('apps/web/src/core-economic-learning-ui.js','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  const cockpit=fs.readFileSync('apps/web/src/personal-cockpit-ui.js','utf8');
  assert.match(forum,/eco:forum-opportunity-intent/);
  assert.match(forum,/post\.kind==='REQUEST'&&isManager\(\)/);
  assert.doesNotMatch(forum,/app\.createValueNeed\(/);
  assert.doesNotMatch(forum,/app\.createValueOffer\(/);
  assert.match(ownerUI,/sourceType:needForm\.dataset\.sourceType==='COMMUNITY_MESSAGE'/);
  assert.match(ownerUI,/sourceRef:needForm\.dataset\.sourceRef/);
  assert.match(ownerUI,/eco:open-economic-opportunity/);
  assert.match(main,/anchor:'valueNetworkOperational'/);
  assert.match(cockpit,/personal-opportunity-actions/);
  assert.match(cockpit,/Proposer mes services/);
});

test('a forum-sourced need is a draft with persisted provenance and no automatic purchase or payment',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  const context=(actor,group)=>kernel.context.set({
    tenantId:'tenant_opportunity',actorId:actor,activeGroupId:group,
    groupRoles:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',
    timezone:'Africa/Douala',connectivity:'online',requestId:'forum-opportunity-test'
  });
  await repo.saveGroup({id:'group_opportunity',tenantId:'tenant_opportunity',
    name:'Collectif',kind:'association',governanceModel:'community',status:'active',
    createdBy:'manager',createdAt:new Date().toISOString()});
  const service=new ValueNetworkService(repo,kernel);
  context('manager','group_opportunity');
  const need=await service.createNeed({
    groupId:'group_opportunity',title:'Savons pour séance',category:'savons',quantity:10,
    unit:'carton',sourceType:'COMMUNITY_MESSAGE',sourceRef:'forum-message-17',
    publicationConsent:false
  });
  assert.equal(need.moduleId,'OPPORTUNITY.NEED');
  assert.equal(need.data.state,'DRAFT');
  assert.equal(need.data.sourceType,'COMMUNITY_MESSAGE');
  assert.equal(need.data.sourceRef,'forum-message-17');
  await assert.rejects(()=>service.publishNeed(need.id),/NEED_NOT_VALIDATED|NEED_PUBLICATION_CONSENT_REQUIRED/);
  context('member','group_opportunity');
  await assert.rejects(()=>service.createNeed({
    groupId:'group_opportunity',title:'Unauthorized',category:'savons',quantity:1,unit:'carton'
  }),/FORBIDDEN_SCOPE/);
  const offer=await service.createOffer({
    kind:'SERVICE',title:'Coiffure à domicile',category:'coiffure',
    availableQuantity:1,unit:'heure',expiresAt:new Date(Date.now()+7*86400000).toISOString()
  });
  assert.equal(offer.moduleId,'OPPORTUNITY.OFFER');
  assert.equal(offer.groupId,undefined);
  assert.equal(offer.createdBy,'member');
});
