import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {TimeMachineService} from '../.build/packages/time-machine/src/index.js';

const setCtx=(k,actor,groupId)=>k.context.set({actorId:actor,tenantId:'tenant_time',activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
async function seed(){
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),f=new FoundationService(repo,k);setCtx(k,'founder');
 await f.ensureUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
 const p=await f.createProject({tenantId:'tenant_time',createdBy:'founder',name:'Association Historique',kind:'association',governanceModel:'community',rubrics:[{key:'coll',name:'Collation',kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:1000},amountBasis:'PER_MEMBER',memberCount:10,sessions:12,duration:{value:12,unit:'MONTHS'},participationMode:'RULE_BASED',contributionMode:'MONEY',managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}]});
 const g=await f.convertProjectToGroup('tenant_time',p.id);setCtx(k,'founder',g.id);return{repo,k,g,service:new TimeMachineService(repo,k)};
}

test('Time Machine captures immutable derived snapshots and compares change without rollback',async()=>{
 const {repo,g,service}=await seed();
 const a=await service.capture(g.id,{label:'Avant membre',reason:'Point de comparaison'});
 const first=await service.get(g.id,a.id);assert.equal(first.snapshot.counts.activeMembers,1);assert.equal(first.record.data.rollbackSupported,false);
 await repo.saveUser({id:'u1',displayName:'Alice',locale:'fr',createdAt:new Date().toISOString()});
 await repo.saveMembership({id:'m1',tenantId:'tenant_time',groupId:g.id,userId:'u1',status:'active',roles:['member'],joinedAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 const b=await service.capture(g.id,{label:'Après membre',reason:'Mesurer évolution'});
 const diff=await service.compare(g.id,a.id,b.id);assert.equal(diff.deltas.members,1);assert.equal(diff.readOnly,true);assert.equal(diff.rollbackSupported,false);
 const again=await service.get(g.id,a.id);assert.equal(again.snapshot.counts.activeMembers,1);
});

test('Time Machine UI uses dedicated owner and exposes no rollback path',()=>{
 const ui=fs.readFileSync('apps/web/src/operational-registry-ui.js','utf8');
 assert.match(ui,/captureTimeMachine/);assert.match(ui,/compareTimeMachine/);assert.match(ui,/timeMachineSnapshot/);
 assert.doesNotMatch(ui,/createWorkspaceRecord\(\{moduleId:'DATA\.TIME_MACHINE'/);
 assert.match(ui,/Aucun rollback automatique/);
});
