import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';
import {handleRequest} from '../.build/workers/api/src/index.js';

test('a member account may select four associations/tontines without arbitrary one-group limit or outsider leak',async()=>{
  const tenant='multiple_association_20261013';
  const send=(actor,url,init={})=>handleRequest(new Request('https://example.test'+url,{
    ...init,headers:{'content-type':'application/json','x-tenant-id':tenant,'x-actor-id':actor,'x-group-roles':'founder,manager',...(init.headers||{})}
  }));
  const create=async(actor,name,kind)=>{
    const p=await send(actor,'/api/v1/group-projects',{method:'POST',body:JSON.stringify({
      name,kind,governanceModel:'community',memberCount:3,sessions:4,nominalContribution:1000,
      managementFeePerContribution:0,estimatedExternalCostRate:0,fixedOperatingCostPerSession:0
    })});
    assert.equal(p.status,201);
    const project=await p.json();
    const converted=await send(actor,'/api/v1/group-projects/'+encodeURIComponent(project.id)+'/convert',{method:'POST',body:'{}'});
    assert.equal(converted.status,201);return converted.json();
  };
  const all=[];
  for(let i=0;i<4;i++)all.push(await create('member_1','Association ou groupe '+i,i<2?'association':'rotating_tontine'));
  const outsider=await create('outsider','Confidentiel indépendant','association');
  const response=await send('member_1','/api/v1/groups/mine');
  assert.equal(response.status,200);
  const mine=await response.json();
  assert.deepEqual(new Set(mine.map(g=>g.id)),new Set(all.map(g=>g.id)));
  assert.ok(!mine.some(g=>g.id===outsider.id));
  const unauth=await send('member_1','/api/v1/groups/'+outsider.id+'/members');
  assert.notEqual(unauth.status,200,'forbidden groups must not be selectable through direct API URLs');
});

test('client keeps all verified groups and their canonical tenant mapping without changing active group',async()=>{
  const app=Object.create(ConnectedApplication.prototype);
  app.actorId='actor_1';app.homeTenantId='tenant_home';app.tenantId='tenant_home';
  app.activeGroupId='g02';app.groupTenants=new Map();
  app.request=async path=>{
    assert.equal(path,'/api/v1/groups/mine');
    return Array.from({length:26},(_,i)=>({id:'g'+String(i).padStart(2,'0'),name:'Association '+i,tenantId:'tenant_home',status:'active'}));
  };
  const mine=await app.listMyGroups();
  assert.equal(mine.length,26);
  assert.equal(app.activeGroupId,'g02');
  assert.equal(app.groupTenants.get('g25'),'tenant_home');
});

test('creation opens real group immediately, with optional Kit not blocking group context',async()=>{
  const ui=fs.readFileSync('apps/web/src/main.js','utf8');
  const client=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(ui,/groups = await app\.listGroups\(\)/);
  assert.match(ui,/await renderGroups\(\);\s*renderActiveGroup\(\);\s*renderGroupSelector\(\);\s*go\('operations'/);
  // Execute the creation handler with an unresolved optional archive. Its
  // parameter list may evolve; the acquired non-blocking behavior must not.
  const begin=ui.indexOf('const createLaunchGroup=async'),end=ui.indexOf("$('#createGroupBtn').addEventListener",begin);
  assert.ok(begin>=0&&end>begin);
  const source=ui.slice(begin,end).trim().replace(/^const createLaunchGroup=/,'').replace(/;$/,'');
  const order=[],errors=[],button={disabled:false,textContent:'Create'},form={},status={};let resolveKit;
  const kit=new Promise(resolve=>{resolveKit=resolve;});
  const dependencies={
    $:id=>id==='#createGroupBtn'?button:id==='#projectForm'?form:status,
    app:{currentActor:()=> 'actor',currentTenant:()=> 'tenant',createGroupFromProject:async id=>{assert.equal(id,'existing_project');order.push('created');return{id:'new_group',name:'Synthetic'};}},
    launchStudio:{pendingCreation:()=>null,rememberCreation:()=>{},completeCreation:()=>{},persistStarterKit:()=>{order.push('kit');return kit;},markKitSaved:()=>order.push('kit_saved'),renderPreview:()=>{}},
    renderGroups:async()=>{order.push('groups');},renderActiveGroup:()=>order.push('active'),renderGroupSelector:()=>order.push('selector'),
    go:()=>order.push('navigate'),toast:()=>{},refreshGroupContext:async()=>{order.push('refresh');},fail:e=>errors.push(e),tx:fr=>fr,launchError:e=>e,
    simulateCurrentLaunch:()=>{throw Error('UNEXPECTED_RESIMULATION');},window:{}
  };
  const run=new Function('d',`const {$,app,launchStudio,renderGroups,renderActiveGroup,renderGroupSelector,go,toast,refreshGroupContext,fail,tx,launchError,simulateCurrentLaunch,window}=d;let launchCreationPending=false,lastProjectId='existing_project';return (${source});`)(dependencies);
  await run();assert.deepEqual(errors,[]);assert.deepEqual(order,['created','groups','active','selector','navigate','kit','refresh']);assert.equal(form.inert,false);assert.equal(button.disabled,false);
  resolveKit({id:'kit'});await new Promise(resolve=>setImmediate(resolve));assert.equal(order.at(-1),'kit_saved');
  assert.match(ui,/void refreshGroupContext\(\)\.catch\(fail\)/);
  assert.match(client,/const groups=await this\.listGroups\(\)/);
  assert.match(client,/path==='\/api\/v1\/groups\/mine'/);
  // Preserve the legacy core bootstrap until financial multi-manager coverage passes.
});

test('join-link membership remains selectable only after canonical scoped access succeeds',async()=>{
  const app=Object.create(ConnectedApplication.prototype);
  app.activeGroupId='joined';app.groupTenants=new Map();
  app.listMyGroups=async()=>[{id:'owned',tenantId:'account',name:'Owned'}];
  app.listGroups=async()=>[{id:'owned',tenantId:'account'},{id:'joined',tenantId:'account'},{id:'private',tenantId:'account'}];
  let checks=0;
  app.request=async path=>{assert.equal(path,'/api/v1/groups/joined/members');checks++;return[{id:'member',userId:'actor'}];};
  const accessible=await app.listAccessibleGroups();
  assert.deepEqual(accessible.map(g=>g.id),['owned','joined']);
  assert.equal(checks,1);
  assert.equal(app.activeGroupId,'joined');
  app.request=async()=>{throw Error('FORBIDDEN_SCOPE');};
  const restricted=await app.listAccessibleGroups();
  assert.deepEqual(restricted.map(g=>g.id),['owned']);
  assert.ok(!restricted.some(g=>g.id==='private'));
});

test('personal cockpit exposes a full membership-scoped association picker with canonical group opening',()=>{
  const personal=fs.readFileSync('apps/web/src/personal-cockpit-ui.js','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(personal,/personal-group-picker/);
  assert.match(personal,/for\(const group of forumGroups\)/);
  assert.match(personal,/openGroupWorkspace\?\.\(groupPicker\.value\)/);
  assert.match(main,/openGroupWorkspace:async groupId=>/);
  assert.match(main,/const mine=await app\.listMyGroups\(\)/);
  assert.match(main,/app\.selectGroup\(groupId\);\s*await refreshGroupContext\(\)/);
  assert.doesNotMatch(personal,/forumGroups\.slice\(0,\s*\d+\).*personal-group-picker/);
});
