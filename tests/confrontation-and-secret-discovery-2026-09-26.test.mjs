import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {DiscoveryService} from '../.build/packages/discovery/src/index.js';

test('Sessions keeps financial entry canonical and reserves explicit reconciliation for disputes',()=>{
  const ui=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
  assert.match(ui,/Confrontation & réserves entre gestionnaires/);
  assert.match(ui,/saisie financière se fait uniquement dans la feuille canonique/);
  assert.match(ui,/Ouvrir cette réserve/);
  assert.doesNotMatch(ui,/Saisie live multi-gestionnaires/);
  assert.doesNotMatch(ui,/Proposer cette donnée/);
});

test('SECRET group cannot cross the Discovery publication boundary',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  kernel.context.set({actorId:'owner',tenantId:'t',activeGroupId:'g',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
  await repo.saveUser({id:'owner',displayName:'Owner',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveGroup({id:'g',tenantId:'t',name:'Secret',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:new Date().toISOString()});
  const service=new DiscoveryService(repo,kernel);
  await assert.rejects(()=>service.publishGroupListing({tenantId:'t',groupId:'g',visibility:'SECRET',discoverable:true,joinPolicy:'INVITE_ONLY',recruiting:false,missionTags:[],activityTags:[]}),/SECRET_GROUP_NOT_DISCOVERABLE/);
});
