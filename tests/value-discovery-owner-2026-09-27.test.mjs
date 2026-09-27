import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {ValueDiscoveryService} from '../.build/packages/value-discovery/src/index.js';

const setCtx=k=>k.context.set({actorId:'u1',tenantId:'tenant_value',groupRoles:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
test('Value Discovery is private and suggests only published consented real demand with reasons',async()=>{
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel();setCtx(k);const service=new ValueDiscoveryService(repo,k),at=new Date().toISOString();
 await service.saveProfile({skills:['transport'],assets:['camion'],locality:'Yaoundé',availability:'week-end'});
 await repo.saveWorkspaceRecord({id:'n-private',tenantId:'tenant_value',groupId:'g1',moduleId:'OPPORTUNITY.NEED',title:'Transport privé',status:'ACTIVE',tags:[],data:{state:'PUBLISHED',publicationConsent:false,category:'Transport',locality:'Yaoundé'},createdBy:'x',createdAt:at,updatedAt:at});
 await repo.saveWorkspaceRecord({id:'n-public',tenantId:'tenant_value',groupId:'g1',moduleId:'OPPORTUNITY.NEED',title:'Transport marchandises',summary:'Besoin camion transport',status:'ACTIVE',tags:[],data:{state:'PUBLISHED',publicationConsent:true,category:'Transport',locality:'Yaoundé'},createdBy:'x',createdAt:at,updatedAt:at});
 const rows=await service.suggestions();assert.equal(rows.length,1);assert.equal(rows[0].id,'n-public');assert.ok(rows[0].reasons.length);assert.equal(rows[0].guaranteedIncome,false);
 const p=await service.profile();assert.equal(p.createdBy,'u1');assert.equal(p.data.incomePromise,false);
});
test('Value Discovery UI states no guaranteed income and exposes guided fields',()=>{const ui=fs.readFileSync('apps/web/src/value-discovery-ui.js','utf8');assert.match(ui,/Ce que je sais faire/);assert.match(ui,/Stock \/ capacité/);assert.match(ui,/revenu garanti : non/);});
