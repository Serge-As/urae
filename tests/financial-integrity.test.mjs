import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { InMemoryPlatformRepository, D1PlatformRepository } from '../.build/packages/repositories/src/index.js';
import { PlatformKernel } from '../.build/packages/platform-kernel/src/index.js';
import { FoundationService, LedgerService } from '../.build/packages/domain/src/index.js';
import { Outbox } from '../.build/packages/offline/src/index.js';
import { FilePlatformRepository } from '../scripts/file-repository.mjs';

class SQLiteD1 {
 constructor(){this.db=new DatabaseSync(':memory:');this.db.exec(fs.readFileSync('cloudflare/migrations/0003_platform_records.sql','utf8'));this.db.exec(fs.readFileSync('cloudflare/migrations/0004_financial_operations.sql','utf8'));this.failAt=-1;}
 prepare(sql){const db=this.db;let values=[];return{bind(...v){values=v;return this;},async first(){return db.prepare(sql).get(...values)??null;},async all(){return{results:db.prepare(sql).all(...values)};},async run(){return db.prepare(sql).run(...values);}};}
 async batch(statements){this.db.exec('BEGIN');try{const result=[];for(let i=0;i<statements.length;i++){if(i===this.failAt)throw Error('INJECTED_STORAGE_FAILURE');result.push(await statements[i].run());}this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
const context=(k,actor='owner')=>k.context.set({tenantId:'integrity',actorId:actor,groupRoles:['founder','manager'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'test'});
async function setup(repo){const k=new PlatformKernel();context(k);const f=new FoundationService(repo,k);await f.ensureUser({id:'owner',displayName:'Owner',locale:'fr',createdAt:new Date().toISOString()});const p=await f.createProject({tenantId:'integrity',createdBy:'owner',name:'Integrity group',kind:'association',governanceModel:'community',memberCount:2,sessions:2,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});const group=await f.convertProjectToGroup('integrity',p.id);const member=(await repo.listMemberships('integrity',group.id))[0];return{k,group,ledger:new LedgerService(repo,k),input:{tenantId:'integrity',groupId:group.id,membershipId:member.id,amount:1000,idempotencyKey:'unique-cash'}};}

test('concurrent identical contributions create one receipt, entry and financial audit',async()=>{
 const repo=new InMemoryPlatformRepository();const{ledger,input}=await setup(repo);
 const receipts=await Promise.all(Array.from({length:12},()=>ledger.recordCashContribution(input)));
 assert.equal(new Set(receipts.map(x=>x.id)).size,1);
 assert.equal((await repo.listLedgerEntries(input.tenantId,input.groupId)).length,1);
 assert.equal((await repo.listAudit(input.tenantId)).filter(x=>x.action==='CASH_CONTRIBUTION_POSTED').length,1);
 assert.equal((await ledger.summary(input.tenantId,input.groupId)).cashBalance,1000);
});
test('idempotency never authorizes another actor or silently substitutes a different amount',async()=>{
 const repo=new InMemoryPlatformRepository();const{k,ledger,input}=await setup(repo);await ledger.recordCashContribution(input);
 await assert.rejects(ledger.recordCashContribution({...input,amount:2000}),/IDEMPOTENCY_CONFLICT/);
 context(k,'outsider');await assert.rejects(ledger.recordCashContribution(input),/FORBIDDEN_SCOPE/);
});
test('D1 transaction rolls back a failure after ledger insertion; retry commits exactly once',async()=>{
 const db=new SQLiteD1();const repo=new D1PlatformRepository(db);const{ledger,input}=await setup(repo);
 db.failAt=4;await assert.rejects(ledger.recordCashContribution(input),/INJECTED_STORAGE_FAILURE/);
 assert.equal((await repo.listLedgerEntries(input.tenantId,input.groupId)).length,0);
 assert.equal((await repo.listContributionReceipts(input.tenantId,input.groupId)).length,0);
 assert.equal((await repo.listLedgerAccounts(input.tenantId,input.groupId)).length,0);
 db.failAt=-1;const receipt=await ledger.recordCashContribution(input);
 assert.equal((await ledger.recordCashContribution(input)).id,receipt.id);
 const r=await ledger.reverseEntry({tenantId:input.tenantId,groupId:input.groupId,entryId:receipt.ledgerEntryId,reason:'correction'});
 assert.equal((await ledger.reverseEntry({tenantId:input.tenantId,groupId:input.groupId,entryId:receipt.ledgerEntryId,reason:'correction'})).id,r.id);
 assert.equal((await ledger.summary(input.tenantId,input.groupId)).cashBalance,0);db.db.close();
});
test('file repository persists workspaces and one atomic financial operation across restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'eco-integrity-'));const file=path.join(dir,'db.json');
 try{const repo=new FilePlatformRepository(file);const{ledger,input}=await setup(repo);await Promise.all([ledger.recordCashContribution(input),ledger.recordCashContribution(input)]);
 await repo.saveWorkspaceRecord({id:'workspace',tenantId:'integrity',moduleId:'COMMUNITY.FORUM',title:'Meeting notes',status:'ACTIVE',tags:[],data:{},createdBy:'owner',createdAt:'2026-09-12',updatedAt:'2026-09-12'});
 const restored=new FilePlatformRepository(file);assert.equal((await restored.listContributionReceipts(input.tenantId,input.groupId)).length,1);const workspaces=await restored.listWorkspaceRecords('integrity');assert.equal(workspaces.length,2);assert.ok(workspaces.some(x=>x.moduleId==='FINANCE.LIVE_PROJECTION'));assert.ok(workspaces.some(x=>x.moduleId==='COMMUNITY.FORUM'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('two simultaneous sync requests send each queued intent once and identity keys remain separate',async()=>{
 const outbox=new Outbox();outbox.enqueue({tenantId:'a',actorId:'one',type:'note',payload:{},idempotencyKey:'same'});outbox.enqueue({tenantId:'b',actorId:'two',type:'note',payload:{},idempotencyKey:'same'});
 let calls=0;const handler=async()=>{calls++;await new Promise(r=>setTimeout(r,5));return{ok:true};};
 await Promise.all([outbox.sync(handler),outbox.sync(handler)]);assert.equal(calls,2);assert.equal(outbox.list().filter(x=>x.status==='CONFIRMED').length,2);
});
