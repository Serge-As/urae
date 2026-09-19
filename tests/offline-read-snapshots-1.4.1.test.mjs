import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

test('essential GET reads may fall back to the last actor-scoped snapshot only on network loss',async()=>{
  const oldFetch=globalThis.fetch,oldIndexed=globalThis.indexedDB;
  try{
    globalThis.indexedDB={};
    const app=new ConnectedApplication({actorId:'manager_offline',tenantId:'tenant_offline'});
    const group={id:'group_offline',tenantId:'tenant_offline',name:'Groupe hors ligne',kind:'association',governanceModel:'community',status:'active',createdBy:'manager_offline',createdAt:'2026-09-19T00:00:00Z'};
    app.readSnapshots.get=async id=>({id,actorId:'manager_offline',tenantId:'tenant_offline',path:'/api/v1/groups',body:[group],updatedAt:'2026-09-19T20:00:00Z'});
    globalThis.fetch=async()=>{throw Error('NETWORK_DOWN');};
    const groups=await app.listGroups();
    assert.equal(groups.length,1);assert.equal(groups[0].name,'Groupe hors ligne');
  }finally{globalThis.fetch=oldFetch;if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;}
});

test('offline session continuation uses an explicit last-session snapshot but never masks a live HTTP rejection',async()=>{
  const oldFetch=globalThis.fetch,oldIndexed=globalThis.indexedDB;
  try{
    globalThis.indexedDB={};
    const app=new ConnectedApplication({actorId:'placeholder',tenantId:'placeholder'});
    app.readSnapshots.get=async id=>id==='session:last'?{id,actorId:'member_offline',tenantId:'tenant_offline',path:'/api/v1/auth/session',body:{authenticated:true,account:{id:'member_offline',tenantId:'tenant_offline',username:'member',displayName:'Membre Offline',locale:'fr'}},updatedAt:'2026-09-19T20:00:00Z'}:undefined;
    globalThis.fetch=async()=>{throw Error('NETWORK_DOWN');};
    const offline=await app.authStatus();assert.equal(offline.authenticated,true);assert.equal(offline.account.displayName,'Membre Offline');

    globalThis.fetch=async()=>new Response(JSON.stringify({error:'AUTHENTICATION_REQUIRED'}),{status:401,headers:{'content-type':'application/json'}});
    await assert.rejects(()=>app.authStatus(),/AUTHENTICATION_REQUIRED/);
  }finally{globalThis.fetch=oldFetch;if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;}
});

test('offline read support stays a projection layer and the service worker never caches API truth',async()=>{
  const appSource=await readFile('packages/application/src/index.ts','utf8');
  const offlineSource=await readFile('packages/offline/src/index.ts','utf8');
  const main=await readFile('apps/web/src/main.js','utf8');
  const sw=await readFile('apps/web/sw.js','utf8');
  assert.match(offlineSource,/IndexedDbReadSnapshotAdapter/);
  assert.match(appSource,/eco:offline-snapshot-used/);
  assert.match(appSource,/NETWORK_UNAVAILABLE/);
  assert.match(main,/dernière copie synchronisée/);
  assert.match(sw,/url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(sw,/event\.respondWith\(fetch\(event\.request\)\)/);
});
