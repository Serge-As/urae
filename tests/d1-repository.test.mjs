import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { D1PlatformRepository } from '../.build/packages/repositories/src/index.js';
import { PlatformKernel } from '../.build/packages/platform-kernel/src/index.js';
import { FoundationService } from '../.build/packages/domain/src/index.js';
import { DiscoveryService } from '../.build/packages/discovery/src/index.js';
import worker, {createApiHandler} from '../.build/workers/api/src/index.js';

class FakeStatement {
  constructor(db,sql){this.db=db;this.sql=sql;this.values=[];}
  bind(...values){this.values=values;return this;}
  async run(){
    if(!/^INSERT INTO platform_records/i.test(this.sql.trim())) throw new Error(`Unsupported run SQL: ${this.sql}`);
    const [record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at]=this.values;
    this.db.rows.set(`${record_type}:${record_id}`,{record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at});
    return {success:true};
  }
  matching(){
    if(!/^SELECT data_json FROM platform_records/i.test(this.sql.trim())) throw new Error(`Unsupported select SQL: ${this.sql}`);
    const names=[...this.sql.matchAll(/\b(record_type|record_id|tenant_id|group_id|assignee_id|idempotency_key)=\?/g)].map(m=>m[1]);
    const cond=Object.fromEntries(names.map((n,i)=>[n,this.values[i]]));
    return [...this.db.rows.values()].filter(row=>Object.entries(cond).every(([k,v])=>row[k]===v));
  }
  async first(){const row=this.matching()[0];return row?{data_json:row.data_json}:null;}
  async all(){return {results:this.matching().map(row=>({data_json:row.data_json}))};}
}
class FakeD1 {
  constructor(){this.rows=new Map();}
  prepare(sql){return new FakeStatement(this,sql);}
  async batch(statements){return Promise.all(statements.map(s=>s.run()));}
}
const setCtx=(k,tenantId,actorId,activeGroupId,roles=['founder','manager'])=>k.context.set({actorId,tenantId,activeGroupId,groupRoles:roles,mandateIds:[],deviceId:'d1',sessionId:'s1',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:`req-${tenantId}-${actorId}`});

test('D1PlatformRepository persists canonical group/discovery data across repository instances',async()=>{
  const db=new FakeD1(); const repo=new D1PlatformRepository(db); const k=new PlatformKernel(); setCtx(k,'tenant_d1','founder_d1'); const foundation=new FoundationService(repo,k);
  await foundation.ensureUser({id:'founder_d1',displayName:'Founder D1',locale:'fr',createdAt:new Date().toISOString()});
  const project=await foundation.createProject({tenantId:'tenant_d1',createdBy:'founder_d1',name:'Association D1',kind:'association',governanceModel:'community',memberCount:12,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const group=await foundation.convertProjectToGroup('tenant_d1',project.id); setCtx(k,'tenant_d1','founder_d1',group.id); const discovery=new DiscoveryService(repo,k);
  await discovery.publishGroupListing({tenantId:'tenant_d1',groupId:group.id,visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'YaoundÃ©',missionTags:['entraide'],activityTags:['Ã©pargne']});
  const repoAfterRestart=new D1PlatformRepository(db);
  assert.equal((await repoAfterRestart.getGroup('tenant_d1',group.id))?.name,'Association D1');
  assert.equal((await repoAfterRestart.listMemberships('tenant_d1',group.id)).length,1);
  assert.equal((await repoAfterRestart.listPublicGroupListings()).length,1);
});

test('trusted API handler persists through the D1 adapter between requests',async()=>{
  const db=new FakeD1();const handler=createApiHandler(new D1PlatformRepository(db)); const headers={'content-type':'application/json','x-tenant-id':'tenant_worker','x-actor-id':'founder_worker'};
  const bootstrap=await handler(new Request('http://local/api/v1/bootstrap',{method:'POST',headers,body:JSON.stringify({displayName:'Founder'})})); assert.equal(bootstrap.status,200);
  const create=await handler(new Request('http://local/api/v1/group-projects',{method:'POST',headers,body:JSON.stringify({name:'Cloud Group',kind:'association',governanceModel:'community',memberCount:10,sessions:10,nominalContribution:1000,currency:'XAF'})})); assert.equal(create.status,201); const project=await create.json();
  const convert=await handler(new Request(`http://local/api/v1/group-projects/${project.id}/convert`,{method:'POST',headers})); assert.equal(convert.status,201);
  const groups=await handler(new Request('http://local/api/v1/groups',{headers})); assert.equal(groups.status,200); const list=await groups.json(); assert.equal(list.length,1); assert.equal(list[0].name,'Cloud Group');
  const health=await handler(new Request('http://local/health')); const h=await health.json(); assert.equal(h.realMoneyEnabled,false); assert.equal(h.version,'1.1.2-qualified-local');
});

test('0003 platform_records migration is additive and idempotent by construction',()=>{
  const sql=fs.readFileSync('cloudflare/migrations/0003_platform_records.sql','utf8').toUpperCase();
  assert.match(sql,/CREATE TABLE IF NOT EXISTS PLATFORM_RECORDS/); assert.match(sql,/CREATE INDEX IF NOT EXISTS/);
  assert.doesNotMatch(sql,/\bDROP\b/); assert.doesNotMatch(sql,/\bTRUNCATE\b/); assert.doesNotMatch(sql,/\bDELETE\s+FROM\b/);
});
