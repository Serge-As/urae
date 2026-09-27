import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {NextOfKinService} from '../.build/packages/succession/src/index.js';

const setCtx=(k,actor,groupId,roles=[])=>k.context.set({actorId:actor,tenantId:'tenant_succ',activeGroupId:groupId,groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
async function seed(){
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),f=new FoundationService(repo,k);setCtx(k,'founder');
 await f.ensureUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
 const p=await f.createProject({tenantId:'tenant_succ',createdBy:'founder',name:'Association Succession',kind:'association',governanceModel:'community',rubrics:[{key:'coll',name:'Collation',kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:1000},amountBasis:'PER_MEMBER',memberCount:10,sessions:12,duration:{value:12,unit:'MONTHS'},participationMode:'RULE_BASED',contributionMode:'MONEY',managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}]});
 const g=await f.convertProjectToGroup('tenant_succ',p.id);await repo.saveUser({id:'u1',displayName:'Alice',locale:'fr',createdAt:new Date().toISOString()});await repo.saveUser({id:'u2',displayName:'Bob',locale:'fr',createdAt:new Date().toISOString()});
 await repo.saveMembership({id:'m1',tenantId:'tenant_succ',groupId:g.id,userId:'u1',status:'active',roles:['member'],joinedAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 await repo.saveMembership({id:'m2',tenantId:'tenant_succ',groupId:g.id,userId:'u2',status:'active',roles:['member'],joinedAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 setCtx(k,'founder',g.id,['founder']);return{repo,k,g,service:new NextOfKinService(repo,k)};
}

test('next-of-kin owner keeps declarations private and grants no automatic rights',async()=>{
 const {k,g,service}=await seed();
 const r=await service.create(g.id,{membershipId:'m1',contactAlias:'Contact A',relationship:'Enfant',contactRef:'contact-ref',consentRef:'CONSENT-1'});
 assert.equal(r.data.grantsMembership,false);assert.equal(r.data.grantsFinancialRights,false);assert.equal(r.data.grantsSigningAuthority,false);assert.equal(r.data.legalHeirDetermination,false);
 setCtx(k,'u1',g.id,['member']);assert.equal((await service.list(g.id)).length,1);const confirmed=await service.confirm(g.id,r.id);assert.equal(confirmed.data.successionState,'CONFIRMED');
 setCtx(k,'u2',g.id,['member']);assert.equal((await service.list(g.id)).length,0);await assert.rejects(()=>service.confirm(g.id,r.id),/FORBIDDEN_SCOPE/);
});

test('succession UI no longer persists generic workspace records',()=>{
 const ui=fs.readFileSync('apps/web/src/operational-registry-ui.js','utf8');
 assert.match(ui,/createNextOfKin/);assert.match(ui,/confirmNextOfKin/);assert.match(ui,/revokeNextOfKin/);
 assert.doesNotMatch(ui,/createWorkspaceRecord\(\{moduleId:'SUCCESSION\.NEXT_OF_KIN'/);
 assert.match(ui,/droits automatiques : aucun/);
});
