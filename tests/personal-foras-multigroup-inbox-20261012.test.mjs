import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

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
  assert.match(personal,/renderPersonalForas\(groups,personalCommunities\)/);
  assert.match(personal,/eco:open-interest-community/);
  assert.match(main,/anchor:'communityEnginePanel'/);
  assert.match(main,/app.notificationsAcrossGroups\(\)/);
  assert.match(main,/if\(!document.querySelector\('#view-inbox.active'\)\)return/);
  assert.match(ads,/app.visualMediaBlob\(id\)/);
  assert.match(ads,/clearPreviewImage\(\)/);
  assert.match(ads,/Contenu sponsorisé · aperçu non publié/);
  assert.doesNotMatch(personal,/new WebSocket\(/);
});