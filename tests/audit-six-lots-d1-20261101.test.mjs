import os from 'node:os';
import path from 'node:path';
import {verifyCopy} from '../scripts/apply-qualified-read-indexes.mjs';
import {verifyIndexSql} from '../scripts/apply-qualified-read-indexes.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
const sorted=rows=>rows.map(r=>r.id).sort();
test('module SQL filtering returns exactly the historical projection while loading fewer rows and using the additive index',async()=>{
 const db=new SQLiteD1(':memory:');db.migrate();const repo=new D1PlatformRepository(db);try{
 for(let i=0;i<600;i++)await repo.saveWorkspaceRecord({id:'r'+i,tenantId:i%3?'tenant-a':'tenant-b',groupId:i%2?'group-a':'group-b',moduleId:'M'+i%5,title:'Record',summary:'',status:'ACTIVE',tags:[],data:{},createdBy:'actor',createdAt:'2026-11-01',updatedAt:'2026-11-01'});
 const all=await repo.listWorkspaceRecords('tenant-a'),expected=all.filter(x=>x.groupId==='group-a'&&x.moduleId==='M1'),got=await repo.listWorkspaceRecords('tenant-a','M1','group-a');assert.deepEqual(sorted(got),sorted(expected));assert.ok(got.length<all.length/5);
 assert.deepEqual(sorted(await repo.listWorkspaceRecords('tenant-a','M1')),sorted(all.filter(x=>x.moduleId==='M1')));assert.equal((await repo.listWorkspaceRecords('foreign','M1','group-a')).length,0);
 const plan=db.db.prepare("EXPLAIN QUERY PLAN SELECT data_json FROM platform_records WHERE record_type=? AND tenant_id=? AND group_id=? AND json_extract(data_json,'$.moduleId')=?").all('workspace_record','tenant-a','group-a','M1');assert.ok(plan.some(x=>x.detail.includes('idx_platform_workspace_module')),JSON.stringify(plan));
 const receipt={rowsInTenant:all.length,rowsTransferred:got.length,queryPlan:plan.map(x=>x.detail),integrity:db.db.prepare('PRAGMA integrity_check').get().integrity_check};fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/six-lots-d1-query-plan.json',JSON.stringify(receipt,null,2));assert.equal(receipt.integrity,'ok');
 }finally{db.close();}
});
test('directory lookup keeps latest historical listing and respects group data even when legacy scope metadata is absent',async()=>{
 const db=new SQLiteD1(':memory:');db.migrate();const repo=new D1PlatformRepository(db);try{
 for(const listing of [{id:'old-id',groupId:'g',updatedAt:'2026-10-01'},{id:'latest-id',groupId:'g',updatedAt:'2026-11-01'},{id:'other',groupId:'other',updatedAt:'2026-11-02'}])await repo.savePublicGroupListing({...listing,tenantId:'t',visibility:'PUBLIC',name:listing.id});
 db.db.prepare("UPDATE platform_records SET group_id=NULL WHERE record_type='public_group_listing' AND record_id='latest-id'").run();
 assert.equal((await repo.getPublicGroupListing('g')).id,'latest-id');assert.equal(await repo.getPublicGroupListing('missing'),undefined);assert.deepEqual(await repo.getPublicGroupListing('g'),(await repo.listPublicGroupListings()).find(x=>x.groupId==='g'));
 }finally{db.close();}
});
test('new read indexes add no entries for Ledger records and deleting them preserves all records',async()=>{
 const db=new SQLiteD1(':memory:');db.migrate();try{
 const schema=db.db.prepare("SELECT sql FROM sqlite_master WHERE name IN ('idx_platform_workspace_module','idx_platform_public_group')").all();assert.equal(schema.length,2);assert.ok(schema.every(x=>/WHERE record_type=/.test(x.sql)));
 const before=db.db.prepare('SELECT count(*) AS n FROM platform_records').get().n;db.db.exec('DROP INDEX idx_platform_workspace_module; DROP INDEX idx_platform_public_group');assert.equal(db.db.prepare('SELECT count(*) AS n FROM platform_records').get().n,before);assert.equal(db.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 }finally{db.close();}
});

test('deployment rejects any financial/table mutation or arbitrary third index before touching production',()=>{const sql=fs.readFileSync('cloudflare/migrations/0020_scoped_module_directory_indexes.sql','utf8');assert.equal(verifyIndexSql(sql).length,2);for(const unsafe of [sql+'DELETE FROM platform_records;',sql+'CREATE INDEX surprise ON platform_records(tenant_id);',sql.replace('platform_records','ledger_entry')])assert.throws(()=>verifyIndexSql(unsafe),/ONLY_QUALIFIED_READ_INDEXES_ALLOWED/);});

test('the actual index migration is qualified on an old restored SQLite copy and preserves every inserted record',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'eco-index-copy-')),source=path.join(dir,'before.sqlite'),target=path.join(dir,'after.sqlite');const db=new SQLiteD1(source);db.migrate();const repo=new D1PlatformRepository(db);await repo.saveWorkspaceRecord({id:'proof',tenantId:'t',groupId:'g',moduleId:'M',title:'Proof',summary:'',status:'ACTIVE',tags:[],data:{value:5000},createdBy:'a',createdAt:'2026-11-01',updatedAt:'2026-11-01'});db.db.exec('DROP INDEX idx_platform_workspace_module; DROP INDEX idx_platform_public_group');db.close();
 try{const result=verifyCopy(source,target,undefined,process.platform==='win32'?'python':'python3');assert.equal(result.dataHashBefore,result.dataHashAfter);assert.equal(result.integrity,'ok');assert.equal(result.foreignKeyErrors,0);assert.ok(result.plan.some(x=>x.includes('idx_platform_workspace_module')));}finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true});}
});
