import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleRequest } from '../.build/workers/api/src/index.js';
const req = (path, init={}) => new Request(`https://example.test${path}`, { ...init, headers: { 'content-type':'application/json','x-tenant-id':'api_tenant','x-actor-id':'api_founder','x-group-roles':'founder,manager', ...(init.headers ?? {}) } });
test('worker health is honest about real money', async () => { const r=await handleRequest(req('/health')); assert.equal(r.status,200); const body=await r.json(); assert.equal(body.ok,true); assert.equal(body.realMoneyEnabled,false); });
test('worker vertical slice creates, simulates and converts a project', async () => { const create=await handleRequest(req('/api/v1/group-projects',{method:'POST',body:JSON.stringify({name:'API Group',memberCount:10,sessions:10,nominalContribution:1000,managementFeePerContribution:50,estimatedExternalCostRate:0.01,fixedOperatingCostPerSession:0})})); assert.equal(create.status,201); const p=await create.json(); const sim=await handleRequest(req(`/api/v1/group-projects/${p.id}/simulate`,{method:'POST',body:'{}'})); assert.equal(sim.status,200); const s=await sim.json(); assert.equal(s.totalNominalContributions,100000); const convert=await handleRequest(req(`/api/v1/group-projects/${p.id}/convert`,{method:'POST',body:'{}'})); assert.equal(convert.status,201); const g=await convert.json(); assert.equal(g.name,'API Group'); const groups=await handleRequest(req('/api/v1/groups')); assert.equal(groups.status,200); const list=await groups.json(); assert.ok(list.some(x=>x.id===g.id)); });


test('concurrent tenants keep request-scoped context isolated', async () => {
  const make=(tenant,actor,name)=>handleRequest(new Request('https://example.test/api/v1/group-projects',{method:'POST',headers:{'content-type':'application/json','x-tenant-id':tenant,'x-actor-id':actor,'x-group-roles':'founder,manager'},body:JSON.stringify({name,memberCount:2,sessions:2,nominalContribution:1000,managementFeePerContribution:0,estimatedExternalCostRate:0,fixedOperatingCostPerSession:0})}));
  const [a,b]=await Promise.all([make('tenant_concurrent_A','actor_A','A only'),make('tenant_concurrent_B','actor_B','B only')]);
  assert.equal(a.status,201); assert.equal(b.status,201);
  const listA=await handleRequest(new Request('https://example.test/api/v1/groups',{headers:{'x-tenant-id':'tenant_concurrent_A','x-actor-id':'actor_A'}}));
  const listB=await handleRequest(new Request('https://example.test/api/v1/groups',{headers:{'x-tenant-id':'tenant_concurrent_B','x-actor-id':'actor_B'}}));
  const groupsA=await listA.json(); const groupsB=await listB.json();
  assert.ok(groupsA.every(x=>x.tenantId==='tenant_concurrent_A')); assert.ok(groupsB.every(x=>x.tenantId==='tenant_concurrent_B'));
});


test('worker rejects invalid group kind instead of persisting corrupt domain data', async () => {
  const response=await handleRequest(req('/api/v1/group-projects',{method:'POST',body:JSON.stringify({name:'Bad',kind:'unknown_kind',governanceModel:'community',memberCount:2,sessions:2,nominalContribution:1000,managementFeePerContribution:0,estimatedExternalCostRate:0,fixedOperatingCostPerSession:0})}));
  assert.equal(response.status,400); const body=await response.json(); assert.equal(body.error,'INVALID_GROUP_KIND');
});


test('mobile root explicitly resolves to index.html through Cloudflare assets binding', async () => {
  const requested=[];
  const env={ASSETS:{fetch:async request=>{
    requested.push(new URL(request.url).pathname);
    return new Response('<!doctype html><html><title>Eco-System</title></html>',{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
  }}};
  const response=await worker.fetch(new Request('https://example.test/'),env);
  assert.equal(response.status,200);
  assert.equal(requested[0],'/index.html');
  assert.match(await response.text(),/Eco-System/);
});
