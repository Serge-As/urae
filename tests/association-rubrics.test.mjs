import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {RubricKnowledgeService} from '../.build/packages/rubrics/src/index.js';
import {validateLaunchRubrics,simulateRubricPlan} from '../.build/packages/rubrics/src/launch-config.js';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import worker from '../.build/workers/api/src/index.js';

const plan=(overrides={})=>({key:'solidarity',name:'Notre panier',kind:'CONTRIBUTION',nominalAmount:{currency:'XAF',amount:2000},amountBasis:'PER_MEMBER',memberCount:20,sessions:12,duration:{value:12,unit:'MONTHS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0,...overrides});
const tontine=(turns=[1,2,3,4],pots=1)=>plan({key:'rotation',name:'Les quatre noms de Serge',kind:'TONTINE',amountBasis:'PER_SHARE',memberCount:1,shareCount:4,potCount:pots,sessions:4,nominalAmount:{currency:'XAF',amount:10000},participants:[{key:'serge',name:'Serge',shares:turns.map((turn,i)=>({key:`share_${i}`,name:`Nom ${i+1}`,turn}))}]});
function setup(){const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();kernel.context.set({tenantId:'tenant_a',actorId:'owner',groupRoles:['founder'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});return{repo,kernel,service:new FoundationService(repo,kernel)};}
const input=rubrics=>({tenantId:'tenant_a',createdBy:'owner',name:'Association CER',kind:'association',governanceModel:'community',rubrics});

test('association simulates independent named rubrics without a global contribution',async()=>{
  const {repo,service}=setup(),project=await service.createProject(input([plan(),tontine()]));
  const result=await service.simulateProject('tenant_a',project.id);
  assert.equal(result.totalNominalContributions,480000+160000);assert.equal(result.rubricBreakdown.length,2);
  assert.equal(result.rubricBreakdown[1].unitsPerSession,4);assert.equal(result.breakEvenMembers,undefined);
  const group=await service.convertProjectToGroup('tenant_a',project.id);
  const saved=await repo.listRubricDefinitions('tenant_a',group.id);assert.equal(saved.length,2);
  assert.deepEqual(saved.map(r=>r.activityPlan),validateLaunchRubrics([plan(),tontine()]));
  assert.equal((await repo.listMemberships('tenant_a',group.id)).length,1,'planning names are not enrollments');
  assert.equal((await service.convertProjectToGroup('tenant_a',project.id)).id,group.id);
  assert.equal((await repo.listRubricDefinitions('tenant_a',group.id)).length,2);
  const sameName=await service.createProject(input([plan()]));assert.notEqual((await service.convertProjectToGroup('tenant_a',sameName.id)).id,group.id);
});

test('four shares of one member may benefit in one, two or four turns; pots never multiply subscriptions',()=>{
  for(const [turns,pots]of [[[1,1,1,1],4],[[1,1,2,2],2],[[1,2,3,4],1]]){
    const [p]=validateLaunchRubrics([tontine(turns,pots)]);assert.equal(simulateRubricPlan(p).totalNominalContributions,160000);
    assert.equal(p.participants[0].shares.length,4);
  }
});

test('invalid or overbooked shares and unsafe totals fail before project persistence',async()=>{
  const {repo,service}=setup();let writes=0;repo.saveProject=async()=>{writes++;};
  const invalid=[[],[tontine([1,1,1,1],1)],[tontine([1,2,3,5],1)],[plan({memberCount:0})],[plan({nominalAmount:{currency:'XAF',amount:Number.MAX_SAFE_INTEGER}})],[plan(),plan()],[tontine([1,2,3,4],1),plan({nominalAmount:{currency:'USD',amount:10}})]];
  for(const rubrics of invalid)await assert.rejects(()=>service.createProject(input(rubrics)));
  const duplicate=tontine();duplicate.participants[0].shares[1].key='share_0';await assert.rejects(()=>service.createProject(input([duplicate])),/INVALID_TONTINE_SHARE/);
  const insufficient=tontine();insufficient.sessions=3;await assert.rejects(()=>service.createProject(input([insufficient])),/TONTINE_INSUFFICIENT_TURNS/);
  assert.equal(writes,0);
});

test('retry after interrupted rubric persistence repairs the same group without duplicate memberships or rubrics',async()=>{
  const {repo,service}=setup(),p=await service.createProject(input([plan(),tontine()]));
  const save=repo.saveRubricDefinition.bind(repo);let count=0;repo.saveRubricDefinition=async r=>{if(++count===2)throw Error('INJECTED_STORAGE_FAILURE');return save(r);};
  await assert.rejects(()=>service.convertProjectToGroup('tenant_a',p.id),/INJECTED/);
  repo.saveRubricDefinition=save;const g=await service.convertProjectToGroup('tenant_a',p.id);
  assert.equal((await repo.listGroups('tenant_a')).length,1);assert.equal((await repo.listMemberships('tenant_a',g.id)).length,1);assert.equal((await repo.listRubricDefinitions('tenant_a',g.id)).length,2);
});

test('rubric configuration update stays scoped and is not overwritten by conversion retry',async()=>{
  const {repo,kernel,service}=setup(),p=await service.createProject(input([tontine()])),g=await service.convertProjectToGroup('tenant_a',p.id);
  const [r]=await repo.listRubricDefinitions('tenant_a',g.id),svc=new RubricKnowledgeService(repo,kernel),next=tontine([1,1,2,2],2);next.name='Notre rythme';
  await svc.updateActivityPlan('tenant_a',g.id,r.id,next);await service.convertProjectToGroup('tenant_a',p.id);
  assert.equal((await repo.getRubricDefinition('tenant_a',g.id,r.id)).name,'Notre rythme');
  kernel.context.set({...kernel.context.get(),actorId:'outsider'});await assert.rejects(()=>svc.updateActivityPlan('tenant_a',g.id,r.id,next),/FORBIDDEN_SCOPE/);
});

test('authenticated D1 API persists association rubrics and per-share scheduling across requests',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();let cookie='';
  const request=(path,method='GET',body,extra={})=>worker.fetch(new Request('https://local.test'+path,{method,headers:{origin:'https://local.test','content-type':'application/json',cookie,...extra},body:body===undefined?undefined:JSON.stringify(body)}),{DB:db});
  try{
    let response=await request('/api/v1/auth/register','POST',{username:'rubric_api_owner',password:'Synthetic-rubric-password-2026!',displayName:'Rubric Owner'});assert.equal(response.status,200);cookie=response.headers.get('set-cookie').split(';')[0];
    response=await request('/api/v1/group-projects','POST',{name:'CER rubriques',kind:'association',governanceModel:'community',rubrics:[plan(),tontine()]});assert.equal(response.status,201,await response.clone().text());const project=await response.json();
    response=await request(`/api/v1/group-projects/${project.id}/convert`,'POST',{});assert.equal(response.status,201,await response.clone().text());const group=await response.json(),headers={'x-active-group-id':group.id};
    response=await request(`/api/v1/groups/${group.id}/rubrics`,'GET',undefined,headers);assert.equal(response.status,200);const saved=await response.json(),rotation=saved.find(r=>r.activityPlan.kind==='TONTINE');assert.equal(saved.length,2);
    response=await request(`/api/v1/groups/${group.id}/rubrics/${rotation.id}/activity-plan`,'PUT',tontine([1,1,2,2],2),headers);assert.equal(response.status,200,await response.clone().text());
    const refreshed=await(await request(`/api/v1/groups/${group.id}/rubrics`,'GET',undefined,headers)).json();assert.deepEqual(refreshed.find(r=>r.id===rotation.id).activityPlan.participants[0].shares.map(s=>s.turn),[1,1,2,2]);
    const ledger=await(await request(`/api/v1/groups/${group.id}/ledger`,'GET',undefined,headers)).json();assert.equal(ledger.summary.entryCount,0);
    cookie='';assert.equal((await request(`/api/v1/groups/${group.id}/rubrics`,'GET',undefined,headers)).status,401);
  }finally{db.close();}
});

test('project conversion delegation materializes only the granted project rubrics and retains founder ownership',async()=>{
  const {repo,kernel,service}=setup(),project=await service.createProject(input([tontine()]));
  await service.grantProjectAccess('tenant_a',project.id,'delegate',['CONVERT']);
  kernel.context.set({...kernel.context.get(),actorId:'delegate'});
  // Simulation is a separate capability; the founder prepares the project before delegating conversion.
  kernel.context.set({...kernel.context.get(),actorId:'owner'});await service.simulateProject('tenant_a',project.id);
  kernel.context.set({...kernel.context.get(),actorId:'delegate'});
  const group=await service.convertProjectToGroup('tenant_a',project.id);
  assert.equal(group.createdBy,'owner');assert.equal((await repo.listRubricDefinitions('tenant_a',group.id)).length,1);
  const [rubric]=await repo.listRubricDefinitions('tenant_a',group.id);
  await assert.rejects(()=>new RubricKnowledgeService(repo,kernel).updateActivityPlan('tenant_a',group.id,rubric.id,tontine()),/FORBIDDEN_SCOPE/);
});
