import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {RubricExceptionService} from '../.build/packages/rubric-exceptions/src/index.js';

const setCtx=(k,actor,groupId)=>k.context.set({actorId:actor,tenantId:'tenant_exc',activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
async function seed(){
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),f=new FoundationService(repo,k);setCtx(k,'founder');
 await f.ensureUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
 const p=await f.createProject({tenantId:'tenant_exc',createdBy:'founder',name:'Association Test',kind:'association',governanceModel:'community',rubrics:[{key:'coll',name:'Collation',kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:1000},amountBasis:'PER_MEMBER',memberCount:10,sessions:12,duration:{value:12,unit:'MONTHS'},participationMode:'RULE_BASED',contributionMode:'MONEY',managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}]});
 const g=await f.convertProjectToGroup('tenant_exc',p.id);setCtx(k,'founder',g.id);
 const rubric=(await repo.listRubricDefinitions('tenant_exc',g.id))[0];
 return{repo,k,g,rubric,service:new RubricExceptionService(repo,k)};
}

test('rubric exceptions are dated justified auditable and target-aware',async()=>{
 const {repo,g,rubric,service}=await seed();
 const proposed=await service.create(g.id,{rubricId:rubric.id,title:'Dispense ponctuelle',scope:'MEMBERSHIP',targetRef:'membership_missing',reason:'Décision exceptionnelle',effectSummary:'Dispense de la contribution pour une séance',evidenceRef:'PV-EXC-1'}).catch(e=>e);
 assert.match(String(proposed?.message??proposed),/MEMBERSHIP_NOT_FOUND/);
 const member={id:'m1',tenantId:'tenant_exc',groupId:g.id,userId:'u1',status:'active',roles:['member'],joinedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
 await repo.saveUser({id:'u1',displayName:'Alice',locale:'fr',createdAt:new Date().toISOString()});await repo.saveMembership(member);
 const r=await service.create(g.id,{rubricId:rubric.id,title:'Dispense ponctuelle',scope:'MEMBERSHIP',targetRef:'m1',reason:'Décision exceptionnelle du groupe',effectSummary:'Dispense de la contribution concernée',evidenceRef:'PV-EXC-1'});
 assert.equal(r.data.exceptionState,'PROPOSED');assert.equal(r.data.createsLedgerEntry,false);assert.equal((await service.applicable(g.id,{rubricId:rubric.id,membershipId:'m1'})).length,0);
 const approved=await service.decide(g.id,r.id,'APPROVED','PV relu et validation confirmée');
 assert.equal(approved.data.exceptionState,'APPROVED');
 assert.equal((await service.applicable(g.id,{rubricId:rubric.id,membershipId:'m1'})).length,1);
 assert.equal((await service.applicable(g.id,{rubricId:rubric.id,membershipId:'other'})).length,0);
 const audits=await repo.listAudit('tenant_exc');assert.ok(audits.some(x=>x.action==='RUBRIC_EXCEPTION_PROPOSED'));assert.ok(audits.some(x=>x.action==='RUBRIC_EXCEPTION_APPROVED'));
});

test('exception UI no longer persists through generic workspace records',()=>{
 const ui=fs.readFileSync('apps/web/src/operational-registry-ui.js','utf8');
 assert.match(ui,/createRubricException/);assert.match(ui,/decideRubricException/);assert.match(ui,/closeRubricException/);
 assert.doesNotMatch(ui,/createWorkspaceRecord\(\{moduleId:'RUBRIC\.EXCEPTIONS'/);
});
