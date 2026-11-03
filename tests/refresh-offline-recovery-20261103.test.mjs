import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';
import {browserWindowScope} from '../.build/packages/application/src/browser-window-scope.js';
import {readFileSync} from 'node:fs';

const id='0123456789abcdef0123456789abcdef';
function fixture(t,{online=true,locked=false}={}){
 const saved=new Map([['eco.window.session.v1',id],['eco.window.session.bound.v1',id]]);
 const before={window:globalThis.window,sessionStorage:globalThis.sessionStorage,localStorage:globalThis.localStorage,indexedDB:globalThis.indexedDB,fetch:globalThis.fetch,locks:Object.getOwnPropertyDescriptor(navigator,'locks'),online:Object.getOwnPropertyDescriptor(navigator,'onLine')};
 const window=new EventTarget();window.name='';globalThis.window=window;
 globalThis.sessionStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)};
 const local=new Map();globalThis.localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)};globalThis.indexedDB={};
 let first=true;Object.defineProperty(navigator,'locks',{configurable:true,value:{request:async(_name,_opts,fn)=>{const deny=locked&&first;first=false;return fn(deny?null:{});}}});
 Object.defineProperty(navigator,'onLine',{configurable:true,value:online});
 const app=new ConnectedApplication();const rows=new Map();app.localAuth.current=async()=>undefined;app.readSnapshots.get=async key=>rows.get(key);app.readSnapshots.save=async row=>rows.set(row.id,row);
 t.after(()=>{app.finishCachedWorkspaceRestore();app.forceTransportRetry();window.dispatchEvent(new Event('pagehide'));for(const k of ['window','sessionStorage','localStorage','indexedDB','fetch']){if(before[k]===undefined)delete globalThis[k];else globalThis[k]=before[k];}for(const [k,v] of [['locks',before.locks],['onLine',before.online]]){if(v)Object.defineProperty(navigator,k,v);else delete navigator[k];}});
 return{app,rows,saved,local,window};
}
const session={authenticated:true,account:{id:'actor-a',tenantId:'tenant-a',username:'alpha',displayName:'Alpha',locale:'fr'}};
const snapshot=(body,path='/api/v1/auth/session')=>({id:'session:window:'+id,actorId:'actor-a',tenantId:'tenant-a',path,body,source:'SERVER',updatedAt:'2026-11-03T10:00:00Z',lastSyncedAt:'2026-11-03T10:00:00Z'});

test('reload keeps its tab identity after a browser clears window.name',async t=>{
 const f=fixture(t);const scope=browserWindowScope();await scope.ready;assert.equal(scope.id,id);assert.equal(f.window.name,'eco-window:'+id);
});
test('a cloned tab rotates its identity before reading an account or sending headers',async t=>{
 const f=fixture(t,{locked:true});const scope=browserWindowScope();await scope.ready;assert.notEqual(scope.id,id);assert.equal(f.saved.get('eco.window.session.v1'),scope.id);
});
test('cached startup restores only the current window, does no HTTP and never fabricates a missing read or write',async t=>{
 const {app,rows}=fixture(t);rows.set('session:window:'+id,snapshot(session));let calls=0;globalThis.fetch=async()=>{calls++;throw Error('network must not run during cached restore');};
 const restored=await app.restoreCachedSession();assert.equal(restored.account.id,'actor-a');assert.equal(app.currentTenant(),'tenant-a');
 const groups=[{id:'g',tenantId:'tenant-a',status:'active'}];rows.set(JSON.stringify(['actor-a','tenant-a','ACCOUNT','/api/v1/groups']),snapshot(groups,'/api/v1/groups'));
 assert.deepEqual(await app.listGroups(),groups);await assert.rejects(app.request('/api/v1/not-cached'),/NETWORK_UNAVAILABLE/);
 await assert.rejects(app.request('/api/v1/bootstrap',{method:'POST',body:'{}'}),/NETWORK_UNAVAILABLE/);assert.equal(calls,0);
 app.finishCachedWorkspaceRestore();globalThis.fetch=async()=>{calls++;return Response.json(session);};
 assert.equal((await app.authStatus({requireServer:true})).account.id,'actor-a');assert.equal(calls,1);
});
test('session:last and mismatched snapshot provenance cannot select another account',async t=>{
 const {app,rows}=fixture(t);rows.set('session:last',snapshot(session));assert.equal(await app.restoreCachedSession(),undefined);
 rows.set('session:window:'+id,{...snapshot(session),actorId:'another-actor'});assert.equal(await app.restoreCachedSession(),undefined);
});
test('fresh authorization cannot silently fall back to a cached session on transport failure',async t=>{
 const {app,rows}=fixture(t);rows.set('session:window:'+id,snapshot(session));globalThis.fetch=async()=>{throw Error('synthetic outage');};
 await assert.rejects(app.authStatus({requireServer:true}),/NETWORK_UNAVAILABLE/);
});
test('the HTTP deadline includes a stalled successful JSON body',async t=>{
 const {app}=fixture(t);t.mock.timers.enable({apis:['setTimeout','Date']});
 globalThis.fetch=async()=>({ok:true,status:200,json:()=>new Promise(()=>{})});
 const read=app.request('/api/v1/groups');const rejected=assert.rejects(read,/NETWORK_UNAVAILABLE/);
 for(let i=0;i<12;i++)await Promise.resolve();t.mock.timers.tick(6501);await rejected;t.mock.timers.reset();
});
test('invalid successful JSON preserves the saved projection instead of replacing it with an empty object',async t=>{
 const {app,rows}=fixture(t);const key=app.offlineReadKey('/api/v1/groups');rows.set(key,snapshot([{id:'kept'}],'/api/v1/groups'));
 globalThis.fetch=async()=>new Response('truncated-json',{status:200});assert.deepEqual(await app.listGroups(),[{id:'kept'}]);assert.deepEqual(rows.get(key).body,[{id:'kept'}]);
});
test('offline reads do not attempt HTTP and a connectivity event does not cancel a known D1 quota',async t=>{
 const {app}=fixture(t,{online:false});let calls=0;globalThis.fetch=async()=>{calls++;return Response.json(session);};
 await assert.rejects(app.request('/api/v1/groups'),/NETWORK_UNAVAILABLE/);assert.equal(calls,0);
 Object.defineProperty(navigator,'onLine',{configurable:true,value:true});app.serverBudgetBlockedUntil=Date.now()+60000;app.serverBudgetReason='D1_QUOTA_RETRY';app.forceTransportRetry();
 await assert.rejects(app.authStatus({requireServer:true}),/NETWORK_UNAVAILABLE/);assert.equal(calls,0);assert.equal(app.serverBudgetState().blocked,true);
});
test('an unclaimed local account remains immediately usable without a server call',async t=>{
 const {app}=fixture(t);app.localAuth.current=async()=>({id:'local-a',tenantId:'local-tenant',username:'alpha',displayName:'Local Alpha',locale:'fr',registrationState:'LOCAL_PENDING_REGISTRATION'});
 globalThis.fetch=async()=>{throw Error('local registration must not need the server');};
 const result=await app.authStatus();assert.equal(result.authenticated,true);assert.equal(result.offline,true);assert.equal(result.account.id,'local-a');
});
test('simultaneous connectivity signals share one 400ms recovery wake and one worker update',()=>{
 const source=readFileSync('apps/web/src/main.js','utf8');const start=source.indexOf('const scheduleConnectivityRecovery=()=>{'),end=source.indexOf("window.addEventListener('online'",start);
 assert.ok(start>=0&&end>start);const queued=[];let resumes=0,updates=0;
 const schedule=new Function('navigator','setTimeout','resumeOnline','currentServiceWorkerRegistration','let connectivityRecoveryTimer;'+source.slice(start,end)+'return scheduleConnectivityRecovery;')({onLine:true},(fn,ms)=>{assert.equal(ms,400);queued.push(fn);return 1;},()=>{resumes++;},{update:async()=>{updates++;}});
 schedule();schedule();schedule();assert.equal(queued.length,1);queued[0]();assert.equal(resumes,1);assert.equal(updates,1);
});
