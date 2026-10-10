import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionService} from '../.build/packages/auth/src/index.js';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';
import {browserWindowScope} from '../.build/packages/application/src/browser-window-scope.js';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';

const password='Synthetic-password-2026!';
const a='a'.repeat(32),b='b'.repeat(32);
function environment(){
 const db=new SQLiteD1(':memory:');db.migrate();const service=new SessionService(db),jar=new Map();
 const call=async(path,method='GET',body,scope,extra={})=>{
  const response=await service.handle(new Request('https://session.test'+path,{method,headers:{origin:'https://session.test','content-type':'application/json',cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...(scope?{'x-eco-window-id':scope}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)}));
  for(const value of response.headers.getSetCookie()){const [pair]=value.split(';'),at=pair.indexOf('='),key=pair.slice(0,at);if(/Max-Age=0(?:;|$)/.test(value))jar.delete(key);else jar.set(key,pair.slice(at+1));}
  return response;
 };
 return{db,service,jar,call};
}
async function register(env,username,scope){const response=await env.call('/api/v1/auth/register','POST',{username,password,displayName:username},scope);assert.equal(response.status,200,await response.clone().text());for(const cookie of response.headers.getSetCookie()){assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/Secure/);}return(await response.json()).account;}
async function actor(env,scope,extra){return(await(await env.call('/api/v1/auth/session','GET',undefined,scope,extra)).json()).account?.id;}

test('one shared cookie jar preserves two authenticated windows while legacy clients remain compatible',async()=>{
 const env=environment();try{
  const first=await register(env,'window_cerdas',a),second=await register(env,'window_bb',b);
  assert.equal(await actor(env),second.id,'legacy single cookie follows last login');
  assert.equal(await actor(env,a),first.id,'first window must retain CERDAS after BB logs in');
  assert.equal(await actor(env,b),second.id);
  assert.equal(env.jar.size,3,'two HttpOnly window cookies plus one legacy default');
  const firstRequest=new Request('https://session.test/api/v1/groups',{headers:{cookie:[...env.jar].map(([k,v])=>k+'='+v).join('; '),'x-eco-window-id':a}});
  assert.equal((await env.service.current(firstRequest)).id,first.id,'business auth uses the same window scope');
 }finally{env.db.close();}
});

test('logout and refresh cannot adopt the other window account through the legacy alias',async()=>{
 const env=environment();try{
  await register(env,'logout_cerdas',a);const second=await register(env,'logout_bb',b);
  assert.equal((await env.call('/api/v1/auth/logout','POST',{},a)).status,200);
  assert.equal(await actor(env,a,{'x-eco-window-adopt-legacy':'1'}),undefined,'signed-out tombstone blocks migration');
  assert.equal(await actor(env,b),second.id,'logging out CERDAS cannot revoke BB');
  assert.equal(await actor(env),second.id,'default cookie for BB is preserved');
 }finally{env.db.close();}
});

test('legacy adoption is explicit, preserves the original session, and does not happen for a bound window',async()=>{
 const env=environment();try{
  const old=await register(env,'migration_manager');
  assert.equal(await actor(env,a),undefined);
  assert.equal(await actor(env,a,{'x-eco-window-adopt-legacy':'1'}),old.id);
  assert.equal(await actor(env,a),old.id);
  assert.equal(await actor(env),old.id);
  env.db.db.prepare('UPDATE auth_sessions SET expires_at=0').run();
  assert.equal(await actor(env,a,{'x-eco-window-adopt-legacy':'1'}),undefined,'expired scoped cookie cannot switch actor');
 }finally{env.db.close();}
});

test('adopting the same account creates independent sessions so one window logout cannot revoke its sibling',async()=>{
 const env=environment();try{
  const owner=await register(env,'sibling_manager',a);
  assert.equal(await actor(env,b,{'x-eco-window-adopt-legacy':'1'}),owner.id);
  assert.notEqual(env.jar.get('__Host-eco_session_'+a),env.jar.get('__Host-eco_session_'+b));
  await env.call('/api/v1/auth/logout','POST',{},b);
  assert.equal(await actor(env,b,{'x-eco-window-adopt-legacy':'1'}),undefined);
  assert.equal(await actor(env,a),owner.id);
 }finally{env.db.close();}
});

test('bootstrap restores own durable intentions in joined group tenants instead of dropping them at F5',async()=>{
 const previous=globalThis.indexedDB;globalThis.indexedDB={};
 try{
  const app=new ConnectedApplication({actorId:'manager',tenantId:'home-tenant'});
  app.authStatus=async()=>({authenticated:true,account:{id:'manager',tenantId:'home-tenant',displayName:'BB',locale:'fr'}});
  const intent={id:'intent-joined',actorId:'manager',tenantId:'founder-tenant',type:'FINANCIAL_CELL_CORRECTION_PROPOSAL_V2',payload:{groupId:'joined-group',meetingId:'m',membershipId:'member',rubricId:'secours',targetAmount:2000},idempotencyKey:'cell-target:test',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'PENDING',attempts:0};
  app.outboxStorage.load=async()=>[intent,{...intent,id:'foreign',actorId:'another-manager'}];
  app.recoverInterruptedVaultRestores=async()=>{};app.listGroups=async()=>[];app.request=async()=>({ok:true});app.groupTrashItems=async()=>[];
  await app.bootstrap();assert.deepEqual(app.outboxItems(),[intent]);
  assert.equal(app.outboxItems()[0].tenantId,'founder-tenant','scope is retained; authorization stays server owned');
 }finally{if(previous===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=previous;}
});

test('a duplicated tab cannot keep the sessionStorage and name of an already active window',async()=>{
 const oldWindow=globalThis.window,oldStorage=globalThis.sessionStorage,oldLocks=Object.getOwnPropertyDescriptor(navigator,'locks');
 const held=new Set(),releases=[];
 Object.defineProperty(navigator,'locks',{configurable:true,value:{request:async(name,_options,callback)=>{if(held.has(name))return callback(null);held.add(name);try{return await callback({name});}finally{held.delete(name);}}}});
 const fakeWindow=()=>({name:'eco-window:'+a,addEventListener:(_event,callback)=>releases.push(callback)});
 const storage=()=>{const rows=new Map([['eco.window.session.v1',a]]);return{getItem:key=>rows.get(key)??null,setItem:(key,value)=>rows.set(key,String(value))};};
 try{
  globalThis.window=fakeWindow();globalThis.sessionStorage=storage();const first=browserWindowScope();await first.ready;assert.equal(first.id,a);
  globalThis.window=fakeWindow();globalThis.sessionStorage=storage();const duplicate=browserWindowScope();await duplicate.ready;
  assert.notEqual(duplicate.id,first.id);assert.match(duplicate.id,/^[a-f0-9]{32}$/);
 }finally{for(const release of releases)release();if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;if(oldStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=oldStorage;if(oldLocks)Object.defineProperty(navigator,'locks',oldLocks);else delete navigator.locks;}
});
