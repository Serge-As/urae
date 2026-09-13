import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRODUCT_MODULES, PRODUCT_CAPABILITY_COUNT } from '../.build/packages/module-registry/src/index.js';
import { InMemoryPlatformRepository } from '../.build/packages/repositories/src/index.js';
import { createApiHandler } from '../.build/workers/api/src/index.js';

test('Complete App catalog exposes more than 100 unique A-J capabilities',()=>{
  assert.ok(PRODUCT_CAPABILITY_COUNT>=100,`catalog too small: ${PRODUCT_CAPABILITY_COUNT}`);
  assert.equal(PRODUCT_MODULES.length,PRODUCT_CAPABILITY_COUNT);
  assert.equal(new Set(PRODUCT_MODULES.map(x=>x.id)).size,PRODUCT_MODULES.length);
  for(const lot of ['B','C','D','E','F','G','H','I','J']) assert.ok(PRODUCT_MODULES.some(x=>x.lot===lot),`lot ${lot} missing`);
  for(const id of ['DISCOVERY.GROUP_SEARCH','MEMBERSHIP.APPLICATION','GROUP.LAUNCH_STUDIO','RUBRIC.LIVING_RULES','MEETING.COMMAND_CENTER','LEDGER.CANONICAL','FINANCE.LOANS','COMMUNITY.FORUM','MARKETPLACE.CORE','ADS.MANAGER','LEARNING.MANAGER_ACADEMY','AI.ASSISTANT','PAPER.BRIDGE','REPORTING.EXPORTS','BACKUP.BIR_PLUS']) assert.ok(PRODUCT_MODULES.some(x=>x.id===id),id);
});

test('Complete App public shell is no longer the old Alpha screen',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  assert.match(html,/Eco-System/);
  assert.match(html,/Découvrir/);
  assert.match(html,/Règles vivantes/);
  assert.match(html,/Communauté/);
  assert.doesNotMatch(html,/V0\.6\.0 — MOBILE LIVING RULES/);
});

test('capability catalog API reports the same canonical list',async()=>{
  const handler=createApiHandler(new InMemoryPlatformRepository());
  const r=await handler(new Request('http://local/api/v1/product/capabilities',{headers:{'x-tenant-id':'t','x-actor-id':'u'}}));
  assert.equal(r.status,200);
  const body=await r.json();
  assert.equal(body.version,'1.2.0-functional-completion');
  assert.equal(body.count,PRODUCT_CAPABILITY_COUNT);
  assert.ok(body.count>=100);
});

test('universal workspace creates, lists and updates persistent capability records without becoming a second ledger',async()=>{
  const repo=new InMemoryPlatformRepository();const handler=createApiHandler(repo);
  const headers={'content-type':'application/json','x-tenant-id':'tenant_complete','x-actor-id':'user_complete'};
  let r=await handler(new Request('http://local/api/v1/workspaces',{method:'POST',headers,body:JSON.stringify({moduleId:'MARKETPLACE.SUPPLIERS',title:'Fournisseur boissons',summary:'Comparer trois offres',tags:['novembre'],data:{budget:40000}})}));
  assert.equal(r.status,201);const created=await r.json();assert.equal(created.moduleId,'MARKETPLACE.SUPPLIERS');assert.equal(created.status,'ACTIVE');
  r=await handler(new Request('http://local/api/v1/workspaces?moduleId=MARKETPLACE.SUPPLIERS',{headers}));
  const list=await r.json();assert.equal(list.length,1);assert.equal(list[0].title,'Fournisseur boissons');
  r=await handler(new Request(`http://local/api/v1/workspaces/${created.id}`,{method:'PUT',headers,body:JSON.stringify({status:'DONE'})}));
  assert.equal(r.status,200);const updated=await r.json();assert.equal(updated.status,'DONE');
  assert.equal((await repo.listLedgerEntries('tenant_complete','whatever')).length,0);
});

test('Complete App health keeps real money disabled',async()=>{
  const handler=createApiHandler(new InMemoryPlatformRepository());
  const r=await handler(new Request('http://local/health',{headers:{'x-tenant-id':'t','x-actor-id':'u'}}));
  const h=await r.json();assert.equal(h.version,'1.2.0-functional-completion');assert.equal(h.realMoneyEnabled,false);
});
