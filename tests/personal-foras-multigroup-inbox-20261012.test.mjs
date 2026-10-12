import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';
import {handleRequest} from '../.build/workers/api/src/index.js';

test('personal inbox reads all authorized groups through existing scoped API without switching active group',async()=>{
  const app=Object.create(ConnectedApplication.prototype),requested=[];
  app.activeGroupId='g1';
  app.listMyGroups=async()=>[{id:'g1',name:'Groupe 1'},{id:'g2',name:'Groupe 2'},{id:'g3',name:'Groupe 3'}];
  app.request=async url=>{
    requested.push(url);
    if(url.includes('/g3/'))throw Error('NETWORK_UNAVAILABLE');
    return[{id:'notice-'+url.split('/')[4],title:'Alerte',read:false}];
  };
  const result=await app.notificationsAcrossGroups();
  assert.equal(app.activeGroupId,'g1','active group must never change during aggregation');
  assert.equal(result.items.length,2);
  assert.deepEqual(result.items.map(x=>x.groupName).sort(),['Groupe 1','Groupe 2']);
  assert.deepEqual(result.unavailable,[{groupId:'g3',groupName:'Groupe 3'}]);
  assert.deepEqual(requested.sort(),[
    '/api/v1/groups/g1/notifications','/api/v1/groups/g2/notifications','/api/v1/groups/g3/notifications'
  ]);
});

test('read receipt always targets explicitly authorized group route, never implicitly the current group',async()=>{
  const app=Object.create(ConnectedApplication.prototype);
  app.activeGroupId='g1';let called;
  app.request=async(path,init)=>{called={path,init};return{read:true};};
  await app.markNotificationReadInGroup('g2','notice-2');
  assert.equal(called.path,'/api/v1/groups/g2/notifications/notice-2/read');
  assert.equal(called.init.method,'POST');
  assert.equal(app.activeGroupId,'g1');
  await assert.rejects(()=>app.markNotificationReadInGroup('','n'),/NOTICE_SCOPE_REQUIRED/);
});

test('foras and creative preview are projections of existing owners, never parallel services',()=>{
  const personal=fs.readFileSync('apps/web/src/personal-cockpit-ui.js','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  const ads=fs.readFileSync('apps/web/src/ad-manager-ui.js','utf8');
  const backend=fs.readFileSync('workers/api/src/index.ts','utf8');
  const appCode=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(backend,/url\.pathname==='\/api\/v1\/groups\/mine'/);
  assert.match(backend,/member\.userId===ctx\.actorId&&member\.status==='active'/);
  assert.match(appCode,/const groups=await this\.listMyGroups\(\)/);
  assert.match(personal,/renderPersonalForas\(forumGroups,personalCommunities,forumsUnavailable\)/);
  assert.match(personal,/eco:open-interest-community/);
  assert.match(main,/anchor:'communityEnginePanel'/);
  assert.match(main,/app.notificationsAcrossGroups\(\)/);
  assert.match(main,/if\(!document.querySelector\('#view-inbox.active'\)\)return/);
  assert.match(ads,/app.visualMediaBlob\(id\)/);
  assert.match(ads,/clearPreviewImage\(\)/);
  assert.match(ads,/Contenu sponsorisé · aperçu non publié/);
  assert.doesNotMatch(personal,/new WebSocket\(/);
});
test('personal group directory never lists another creator or a non-member in the same tenant',async()=>{
  const tenant='ux_my_foras_scope_20261012';
  const send=(actor,url,init={})=>handleRequest(new Request('https://example.test'+url,{
    ...init,headers:{'content-type':'application/json','x-tenant-id':tenant,'x-actor-id':actor,'x-group-roles':'founder,manager',...(init.headers||{})}
  }));
  const create=async(actor,name)=>{
    const p=await send(actor,'/api/v1/group-projects',{method:'POST',body:JSON.stringify({
      name,memberCount:2,sessions:2,nominalContribution:1000,
      managementFeePerContribution:0,estimatedExternalCostRate:0,fixedOperatingCostPerSession:0
    })});
    assert.equal(p.status,201);
    const project=await p.json();
    const g=await send(actor,'/api/v1/group-projects/'+encodeURIComponent(project.id)+'/convert',{method:'POST',body:'{}'});
    assert.equal(g.status,201);return g.json();
  };
  const own=await create('owner_a','Private A');
  const other=await create('owner_b','Private B');
  const mine=await send('owner_a','/api/v1/groups/mine');
  assert.equal(mine.status,200);
  const visible=await mine.json();
  assert.ok(visible.some(group=>group.id===own.id));
  assert.ok(!visible.some(group=>group.id===other.id));
  const stranger=await send('not_a_member','/api/v1/groups/mine');
  assert.equal(stranger.status,200);
  assert.deepEqual(await stranger.json(),[]);
  const privateNotices=await send('not_a_member','/api/v1/groups/'+encodeURIComponent(own.id)+'/notifications');
  assert.notEqual(privateNotices.status,200);
});
