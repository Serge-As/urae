import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';

const headers={'content-type':'application/json','x-tenant-id':'tenant_a','x-actor-id':'owner','x-group-roles':'founder,manager'};
const req=(path,init={})=>new Request('https://local.test'+path,{...init,headers:{...headers,...(init.headers??{})}});

async function seed(repo){
  const at='2026-09-15T00:00:00.000Z';
  await repo.saveUser({id:'owner',displayName:'Owner',locale:'fr',createdAt:at});
  await repo.saveUser({id:'user_a',displayName:'A',locale:'fr',createdAt:at});
  for(const id of ['group_a','group_b']){
    await repo.saveGroup({id,tenantId:'tenant_a',name:id,kind:'association',governanceModel:'founder_managed',status:'active',createdBy:'owner',createdAt:at});
  }
  await repo.saveMembership({id:'membership_a',tenantId:'tenant_a',groupId:'group_a',userId:'user_a',roles:['member'],status:'active',joinedAt:at});
}

test('group obligations endpoint never leaks obligations from another group in the same tenant',async()=>{
  const repo=new InMemoryPlatformRepository();await seed(repo);
  await repo.saveObligation({id:'oa',tenantId:'tenant_a',groupId:'group_a',assigneeId:'user_a',type:'CONTRIBUTION_DUE',title:'A',priority:'normal',status:'open',sourceType:'test'});
  await repo.saveObligation({id:'ob',tenantId:'tenant_a',groupId:'group_b',assigneeId:'owner',type:'CONTRIBUTION_DUE',title:'B',priority:'normal',status:'open',sourceType:'test'});
  const handle=createApiHandler(repo),response=await handle(req('/api/v1/groups/group_a/obligations'));
  assert.equal(response.status,200);const body=await response.json();
  assert.deepEqual(body.map(x=>x.id),['oa']);
});

test('cash contribution commits a durable projection record with the financial transaction',async()=>{
  const repo=new InMemoryPlatformRepository();await seed(repo);const handle=createApiHandler(repo);
  const response=await handle(req('/api/v1/groups/group_a/contributions/cash',{method:'POST',body:JSON.stringify({membershipId:'membership_a',amount:2500,idempotencyKey:'recovery-outbox-1'})}));
  assert.equal(response.status,201);const receipt=await response.json();
  const projection=await repo.getWorkspaceRecord('tenant_a','financial_projection_'+receipt.ledgerEntryId);
  assert.ok(projection);assert.equal(projection.moduleId,'FINANCE.LIVE_PROJECTION');assert.equal(projection.status,'DONE');
  assert.equal(projection.data.membershipId,'membership_a');
});

test('a Live failure never turns an already committed contribution into an HTTP failure',async()=>{
  const repo=new InMemoryPlatformRepository();await seed(repo);
  const failingNamespace={
    idFromName:name=>name,
    get:()=>({fetch:async()=>new Response(JSON.stringify({error:'simulated-live-failure'}),{status:400,headers:{'content-type':'application/json'}})})
  };
  const handle=createApiHandler(repo,{premiumLive:true,liveNamespace:failingNamespace});
  const response=await handle(req('/api/v1/groups/group_a/contributions/cash',{method:'POST',body:JSON.stringify({membershipId:'membership_a',amount:3000,idempotencyKey:'recovery-outbox-2'})}));
  assert.equal(response.status,201);const receipt=await response.json();
  assert.ok(await repo.getLedgerEntry('tenant_a','group_a',receipt.ledgerEntryId));
  const projection=await repo.getWorkspaceRecord('tenant_a','financial_projection_'+receipt.ledgerEntryId);
  assert.equal(projection.status,'ACTIVE');assert.match(String(projection.data.lastError),/LIVE_PUBLISH_FAILED/);
});

test('Durable Object live replay continues after sequence 500',async()=>{
  const map=new Map();
  for(let seq=1;seq<=520;seq++){
    const event={seq,id:'e'+seq,type:'SYNC_HINT',at:'2026-09-15T00:00:00.000Z',actorId:'owner',idempotencyKey:'k'+seq,payload:{seq}};
    map.set('event:'+String(seq).padStart(12,'0'),event);
  }
  map.set('seq',520);
  const storage={
    get:async key=>map.get(key),
    put:async(key,value)=>{map.set(key,value);},
    list:async({prefix='',startAfter,limit=1000}={})=>new Map([...map.entries()].filter(([key])=>key.startsWith(prefix)&&(!startAfter||key>startAfter)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit))
  };
  const hub=new GroupLiveHub({storage},{}),response=await hub.fetch(new Request('https://group-live.internal/events?after=500&limit=20&userId=owner'));
  assert.equal(response.status,200);const body=await response.json();
  assert.equal(body.events.length,20);assert.equal(body.events[0].seq,501);assert.equal(body.events.at(-1).seq,520);assert.equal(body.latest,520);
});

test('launch regression guard keeps ten steps and Collation wording',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8'),rubrics=fs.readFileSync('apps/web/src/launch-rubrics.js','utf8');
  const steps=[...html.matchAll(/data-launch-step="(\d+)"/g)].map(x=>Number(x[1]));
  assert.deepEqual(steps,[1,2,3,4,5,6,7,8,9,10]);
  assert.match(rubrics,/Collation \/ Aide locale \/ Ration/);
  assert.doesNotMatch(rubrics,/Collection \/ Aide locale \/ Ration/);
});
