import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

test('offline mode can reopen authenticated session, groups and any previously synchronized API GET',async()=>{
  const oldFetch=globalThis.fetch,oldIndexed=globalThis.indexedDB;
  try{
    globalThis.indexedDB={};
    const app=new ConnectedApplication({actorId:'placeholder',tenantId:'placeholder'});
    const account={id:'manager_offline',tenantId:'tenant_offline',username:'manager',displayName:'Manager Offline',locale:'fr'};
    const group={id:'group_offline',tenantId:'tenant_offline',name:'Groupe Offline',kind:'association',governanceModel:'community',status:'active',createdBy:'manager_offline',createdAt:'2026-09-21T00:00:00Z'};
    app.readSnapshots.get=async id=>{
      if(id==='session:last')return{id,actorId:account.id,tenantId:account.tenantId,path:'/api/v1/auth/session',body:{authenticated:true,account},updatedAt:'2026-09-21T08:00:00Z'};
      if(String(id).includes('/api/v1/groups'))return{id,actorId:account.id,tenantId:account.tenantId,path:'/api/v1/groups',body:[group],updatedAt:'2026-09-21T08:00:00Z'};
      if(String(id).includes('/api/v1/pulse/feed?'))return{id,actorId:account.id,tenantId:account.tenantId,path:'/api/v1/pulse/feed?',body:{items:[{id:'offline-feed'}]},updatedAt:'2026-09-21T08:00:00Z'};
      return undefined;
    };
    globalThis.fetch=async()=>{throw Error('NETWORK_DOWN');};
    assert.equal((await app.authStatus()).authenticated,true);
    assert.equal((await app.listGroups())[0].name,'Groupe Offline');
    assert.equal((await app.ecoPulseFeed({})).items[0].id,'offline-feed');
  }finally{globalThis.fetch=oldFetch;if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;}
});

test('offline architecture caches the complete authenticated GET projection but never API responses in CacheStorage',async()=>{
  const appSource=await readFile('packages/application/src/index.ts','utf8');
  const sw=await readFile('apps/web/sw.js','utf8');
  assert.match(appSource,/return path\.startsWith\('\/api\/v1\/'\)/);
  assert.match(appSource,/eco:offline-snapshot-used/);
  assert.match(sw,/eco-system-v145-true-offline-20260921/);
  assert.match(sw,/url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(sw,/event\.respondWith\(fetch\(event\.request\)\)/);
});
