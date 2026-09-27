import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {AnticipationService} from '../.build/packages/anticipation/src/index.js';

const setCtx=(k,actor,groupId)=>k.context.set({actorId:actor,tenantId:'tenant_ant',activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
async function seed(){
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),f=new FoundationService(repo,k);setCtx(k,'founder');
 await f.ensureUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
 const p=await f.createProject({tenantId:'tenant_ant',createdBy:'founder',name:'Association Anticipation',kind:'association',governanceModel:'community',rubrics:[{key:'coll',name:'Collation',kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:1000},amountBasis:'PER_MEMBER',memberCount:10,sessions:12,duration:{value:12,unit:'MONTHS'},participationMode:'RULE_BASED',contributionMode:'MONEY',managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}]});
 const g=await f.convertProjectToGroup('tenant_ant',p.id);setCtx(k,'founder',g.id);return{repo,k,g,service:new AnticipationService(repo,k)};
}
test('anticipation generates labelled deterministic signals and requires human validation',async()=>{
 const {repo,g,service}=await seed(),stamp=new Date().toISOString();
 await repo.saveMeeting({id:'future',tenantId:'tenant_ant',groupId:g.id,title:'Réunion future',status:'open',scheduledAt:new Date(Date.now()+86400000).toISOString(),openedAt:stamp,createdBy:'founder',createdAt:stamp,updatedAt:stamp});
 const signals=await service.signals(g.id);assert.ok(signals.some(x=>x.level==='CERTAIN'&&x.kind==='NEXT_MEETING'));assert.ok(signals.every(x=>x.humanValidated===false));
 const draft=await service.createDraft(g.id);assert.equal(draft.data.anticipationState,'DRAFT');assert.equal(draft.data.ledgerMutation,false);assert.equal(draft.data.meetingMutation,false);assert.equal(draft.data.obligationCreation,false);
 const active=await service.validate(g.id,draft.id);assert.equal(active.data.anticipationState,'ACTIVE');assert.equal(active.data.humanValidated,true);
 const done=await service.complete(g.id,draft.id);assert.equal(done.data.anticipationState,'DONE');
});
test('anticipation UI keeps levels and explicit validation',()=>{
 const ui=fs.readFileSync('apps/web/src/anticipation-ui.js','utf8');assert.match(ui,/HISTORICAL_INFERENCE/);assert.match(ui,/Valider ce plan/);assert.match(ui,/Aucun signal ne modifie le RI, le Ledger/);
});
