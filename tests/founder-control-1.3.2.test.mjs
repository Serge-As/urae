import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FounderControlService} from '../.build/packages/founder-control/src/index.js';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';

function setup(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  kernel.context.set({tenantId:'operator',actorId:'founder-team',groupRoles:['founder'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
  return{repo,kernel,svc:new FounderControlService(repo,kernel)};
}

test('founder dashboard automatically supervises every catalog capability',async()=>{
  const {svc}=setup();const dashboard=await svc.dashboard();
  assert.equal(dashboard.services.length,PRODUCT_MODULES.length);
  assert.ok(dashboard.services.every(x=>x.autoSupervised===true));
  assert.deepEqual(new Set(dashboard.services.map(x=>x.id)),new Set(PRODUCT_MODULES.map(x=>x.id)));
});

test('founder can track a complaint from new to verified with an explicit resolution',async()=>{
  const {svc}=setup();let issue=await svc.createIssue({serviceId:PRODUCT_MODULES[0].id,title:'Parcours cassé',summary:'Un test terrain signale une erreur.',severity:'HIGH',source:'USER_COMPLAINT'});
  assert.equal(issue.state,'NEW');issue=await svc.transitionIssue(issue.id,'TRIAGED');issue=await svc.transitionIssue(issue.id,'IN_PROGRESS');
  issue=await svc.transitionIssue(issue.id,'RESOLVED','Correctif livré et CI verte.');
  issue=await svc.transitionIssue(issue.id,'VERIFIED','Retest utilisateur confirmé.');
  assert.equal(issue.state,'VERIFIED');
  const d=await svc.dashboard();assert.equal(d.totals.openIssues,0);
});

test('resolved issue cannot hide without a resolution note',async()=>{
  const {svc}=setup();const issue=await svc.createIssue({title:'Erreur',summary:'Détail',severity:'MEDIUM'});
  await assert.rejects(()=>svc.transitionIssue(issue.id,'RESOLVED',''),/CONTROL_ISSUE_RESOLUTION_REQUIRED/);
});

test('editorial backlog exposes missing or poorly written content until ready or published',async()=>{
  const {svc}=setup();const serviceId=PRODUCT_MODULES[0].id;
  const item=await svc.createEditorial({serviceId,title:'Article aide',kind:'HELP',state:'MISSING',notes:'À rédiger.'});
  let d=await svc.dashboard();assert.equal(d.totals.pendingEditorial,1);
  await svc.transitionEditorial(item.id,'PUBLISHED','Relu et publié.');
  d=await svc.dashboard();assert.equal(d.totals.pendingEditorial,0);
});

test('latest service check drives supervision attention without replacing catalog truth',async()=>{
  const {svc}=setup(),serviceId=PRODUCT_MODULES[0].id;
  await svc.recordCheck({serviceId,state:'FAIL',source:'synthetic-smoke',summary:'Endpoint indisponible'});
  let d=await svc.dashboard();assert.equal(d.services.find(x=>x.id===serviceId).attention,'FAIL');
  await svc.recordCheck({serviceId,state:'PASS',source:'synthetic-smoke',summary:'Retest réussi'});
  d=await svc.dashboard();assert.equal(d.services.find(x=>x.id===serviceId).latestCheck.state,'PASS');
});
