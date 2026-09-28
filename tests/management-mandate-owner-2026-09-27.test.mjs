import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {BusinessStudioService} from '../.build/packages/business-studio/src/index.js';

const setCtx=(k,actor,groupId,roles=[])=>k.context.set({actorId:actor,tenantId:'tenant_mandate',activeGroupId:groupId,groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_'+actor});
async function seed(){
  const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),f=new FoundationService(repo,k);setCtx(k,'founder');
  await f.ensureUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
  const p=await f.createProject({tenantId:'tenant_mandate',createdBy:'founder',name:'Association Mandat',kind:'association',governanceModel:'community',rubrics:[{key:'coll',name:'Collation',kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:1000},amountBasis:'PER_MEMBER',memberCount:10,sessions:12,duration:{value:12,unit:'MONTHS'},participationMode:'RULE_BASED',contributionMode:'MONEY',managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}]});
  const g=await f.convertProjectToGroup('tenant_mandate',p.id);
  await repo.saveUser({id:'manager2',displayName:'Manager 2',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveUser({id:'delegate1',displayName:'Délégué',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveMembership({id:'m2',tenantId:'tenant_mandate',groupId:g.id,userId:'manager2',status:'active',roles:['treasurer'],joinedAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  setCtx(k,'founder',g.id,['founder']);return{repo,k,g,service:new BusinessStudioService(repo,k)};
}

test('management mandate requires explicit rights and independent quorum before activation',async()=>{
  const {k,g,service}=await seed(),start=new Date(Date.now()-86400000).toISOString(),end=new Date(Date.now()+86400000*30).toISOString();
  await assert.rejects(()=>service.createMandate({groupId:g.id,services:['Suivi'],startsAt:start,endsAt:end,feeModel:'FIXED',feeAmount:10000,delegatedRights:[],minimumApprovals:2}),/MANDATE_RIGHTS_REQUIRED/);
  const r=await service.createMandate({groupId:g.id,services:['Suivi séances','Reporting'],startsAt:start,endsAt:end,feeModel:'FIXED',feeAmount:10000,delegatedRights:['MEETING_SUPPORT','REPORTING'],delegateUserId:'delegate1',approvalsRequired:['founder','treasurer'],minimumApprovals:2});
  assert.equal(r.data.mandateState,'DRAFT');assert.equal(r.data.systemPermissionElevation,false);assert.equal(r.data.delegateUserId,'delegate1');assert.equal(r.data.delegationModel,'BOUNDED_EXPLICIT_RIGHTS');
  await assert.rejects(()=>service.activateMandate(r.id),/MANDATE_APPROVALS_INCOMPLETE/);
  await service.approveMandate(r.id);await assert.rejects(()=>service.activateMandate(r.id),/MANDATE_APPROVALS_INCOMPLETE/);
  setCtx(k,'manager2',g.id,['treasurer']);const visible=await service.groupMandates(g.id);assert.equal(visible.length,1);await service.approveMandate(r.id);
  setCtx(k,'founder',g.id,['founder']);const active=await service.activateMandate(r.id);assert.equal(active.data.mandateState,'ACTIVE');assert.equal(active.data.systemPermissionElevation,false);
  const ended=await service.endMandate(r.id,'Mission terminée et validée');assert.equal(ended.data.mandateState,'ENDED');
});

test('mandate rights stay bounded and never become blanket group management',async()=>{
  const {k,g,service}=await seed(),start=new Date(Date.now()-3600000).toISOString(),end=new Date(Date.now()+86400000).toISOString();
  let r=await service.createMandate({groupId:g.id,services:['Reporting'],startsAt:start,endsAt:end,feeModel:'FIXED',delegatedRights:['REPORTING'],delegateUserId:'delegate1'});r=await service.approveMandate(r.id);r=await service.activateMandate(r.id);
  k.context.set({actorId:'delegate1',tenantId:'tenant_mandate',activeGroupId:g.id,groupRoles:[],mandateIds:[r.id],mandateGrants:[{mandateId:r.id,groupId:g.id,permissions:['REPORTING'],startsAt:start,endsAt:end}],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_delegate'});
  assert.equal(k.policy.evaluate('group:manage',k.context.get(),{groupId:g.id}).allowed,false);
  assert.equal(k.policy.evaluate('mandate:right',k.context.get(),{groupId:g.id,permission:'REPORTING'}).allowed,true);
  assert.equal(k.policy.evaluate('mandate:right',k.context.get(),{groupId:g.id,permission:'MEMBER_ADMIN_SUPPORT'}).allowed,false);
});

test('Business Studio mandate UI exposes rights approvals and quorum instead of direct activation',()=>{
  const ui=fs.readFileSync('apps/web/src/business-studio-ui.js','utf8');
  assert.match(ui,/Droits de mission/);assert.match(ui,/minimumApprovals/);assert.match(ui,/approveBusinessMandate/);assert.match(ui,/Activer après quorum/);
  assert.match(ui,/aucune élévation automatique de permission système/);
});
