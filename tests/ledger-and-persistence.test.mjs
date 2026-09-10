import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PlatformKernel } from '../.build/packages/platform-kernel/src/index.js';
import { InMemoryPlatformRepository } from '../.build/packages/repositories/src/index.js';
import { FoundationService, LedgerService, MeetingService } from '../.build/packages/domain/src/index.js';
import { FilePlatformRepository } from '../scripts/file-repository.mjs';
import { createApiHandler } from '../.build/workers/api/src/index.js';

const setCtx=(k,tenant='t',actor='u',groupId)=>k.context.set({actorId:actor,tenantId:tenant,activeGroupId:groupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});

async function seeded(){
  const repo=new InMemoryPlatformRepository(); const k=new PlatformKernel(); const f=new FoundationService(repo,k); setCtx(k);
  await f.ensureUser({id:'u',displayName:'Founder',locale:'fr',createdAt:new Date().toISOString()});
  const p=await f.createProject({tenantId:'t',createdBy:'u',name:'Ledger Group',kind:'rotating_tontine',governanceModel:'founder_managed',memberCount:2,sessions:2,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const g=await f.convertProjectToGroup('t',p.id); setCtx(k,'t','u',g.id);
  const m=await f.addMember('t',g.id,{id:'m1',displayName:'Member One',locale:'en',createdAt:new Date().toISOString()});
  return {repo,k,f,g,m};
}

test('manual cash contribution posts a balanced idempotent ledger entry and reversal is append-only', async()=>{
  const {repo,k,g,m}=await seeded(); const ledger=new LedgerService(repo,k);
  const first=await ledger.recordCashContribution({tenantId:'t',groupId:g.id,membershipId:m.id,amount:5000,idempotencyKey:'cash-1'});
  const duplicate=await ledger.recordCashContribution({tenantId:'t',groupId:g.id,membershipId:m.id,amount:5000,idempotencyKey:'cash-1'});
  assert.equal(first.id,duplicate.id);
  let summary=await ledger.summary('t',g.id); assert.equal(summary.cashBalance,5000); assert.equal(summary.memberFundsLiability,5000); assert.equal(summary.entryCount,1);
  const entries=await repo.listLedgerEntries('t',g.id); const original=entries[0]; assert.equal(original.lines.reduce((n,l)=>n+l.debit,0),original.lines.reduce((n,l)=>n+l.credit,0));
  const reversal=await ledger.reverseEntry({tenantId:'t',groupId:g.id,entryId:original.id,reason:'Wrong member'}); assert.equal(reversal.reversalOfEntryId,original.id);
  summary=await ledger.summary('t',g.id); assert.equal(summary.cashBalance,0); assert.equal(summary.memberFundsLiability,0); assert.equal(summary.entryCount,2);
  assert.ok(await repo.getLedgerEntry('t',g.id,original.id),'original entry must remain');
});



test('closed meeting is a checkpoint: governed late contribution remains possible and auditable', async()=>{
  const {repo,k,f,g,m}=await seeded(); const ledger=new LedgerService(repo,k); const meetings=new MeetingService(repo,k);
  const meeting=await meetings.openMeeting('t',g.id,{title:'Closed session'}); await meetings.closeMeeting('t',g.id,meeting.id);
  await assert.rejects(()=>ledger.recordCashContribution({tenantId:'t',groupId:g.id,membershipId:m.id,amount:1000,meetingId:meeting.id,idempotencyKey:'late-no-reason'}),/LATE_POSTING_REASON_REQUIRED/);
  const receipt=await ledger.recordCashContribution({tenantId:'t',groupId:g.id,membershipId:m.id,amount:1000,meetingId:meeting.id,lateReason:'Retardataire accepté après clôture',idempotencyKey:'late-with-reason'});
  assert.equal(receipt.latePosting?.isLate,true); assert.equal(receipt.latePosting?.approvedBy.includes('u'),true);
  const policy=(await repo.getGroup('t',g.id)).operatingPolicy; await f.updateGroupOperatingPolicy('t',g.id,{...policy,latePosting:{...policy.latePosting,mode:'FORBIDDEN'}});
  await assert.rejects(()=>ledger.recordCashContribution({tenantId:'t',groupId:g.id,membershipId:m.id,amount:1000,meetingId:meeting.id,lateReason:'Should now fail',idempotencyKey:'late-forbidden'}),/LATE_POSTING_NOT_ALLOWED/);
});

test('meeting, cash receipt and support case are operational through the API', async()=>{
  const repo=new InMemoryPlatformRepository(); const handle=createApiHandler(repo);
  const headers={'content-type':'application/json','x-tenant-id':'api_real','x-actor-id':'founder','x-group-roles':'founder,manager'};
  const call=(p,init={})=>handle(new Request(`https://local.test${p}`,{...init,headers:{...headers,...(init.headers??{})}}));
  await call('/api/v1/bootstrap',{method:'POST',body:JSON.stringify({displayName:'Founder',locale:'en'})});
  const pr=await call('/api/v1/group-projects',{method:'POST',body:JSON.stringify({name:'Operational',memberCount:3,sessions:3,nominalContribution:1000,managementFeePerContribution:0,estimatedExternalCostRate:0,fixedOperatingCostPerSession:0})}); const p=await pr.json();
  await call(`/api/v1/group-projects/${p.id}/simulate`,{method:'POST',body:'{}'}); const gr=await call(`/api/v1/group-projects/${p.id}/convert`,{method:'POST',body:'{}'}); const g=await gr.json();
  const mr=await call(`/api/v1/groups/${g.id}/members`,{method:'POST',body:JSON.stringify({displayName:'Alice'})}); assert.equal(mr.status,201); const m=await mr.json();
  const meet=await call(`/api/v1/groups/${g.id}/meetings`,{method:'POST',body:JSON.stringify({title:'September meeting'})}); assert.equal(meet.status,201); const meeting=await meet.json();
  const cr=await call(`/api/v1/groups/${g.id}/contributions/cash`,{method:'POST',body:JSON.stringify({membershipId:m.id,amount:2500,meetingId:meeting.id,idempotencyKey:'api-cash-1'})}); assert.equal(cr.status,201);
  const ledger=await (await call(`/api/v1/groups/${g.id}/ledger`)).json(); assert.equal(ledger.summary.cashBalance,2500); assert.equal(ledger.receipts.length,1);
  const support=await call('/api/v1/cases',{method:'POST',body:JSON.stringify({groupId:g.id,summary:'Need clarification'})}); assert.equal(support.status,201);
  const inbox=await (await call('/api/v1/inbox')).json(); assert.ok(inbox.some(x=>x.kind==='case')); assert.ok(inbox.some(x=>x.kind==='obligation'));
});

test('file repository survives process-style re-instantiation', async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'tontine-repo-')); const file=path.join(dir,'db.json');
  const a=new FilePlatformRepository(file); await a.saveUser({id:'u',displayName:'Persisted User',locale:'en',createdAt:'2026-09-01T00:00:00Z'}); await a.saveGroup({id:'g',tenantId:'t',name:'Persistent Group',kind:'association',governanceModel:'community',status:'active',createdBy:'u',createdAt:'2026-09-01T00:00:00Z'});
  const b=new FilePlatformRepository(file); const groups=await b.listGroups('t'); assert.equal(groups.length,1); assert.equal(groups[0].name,'Persistent Group'); assert.equal((await b.getUser('u')).displayName,'Persisted User');
  const raw=JSON.parse(await readFile(file,'utf8')); assert.equal(raw.version,1);
});

test('runnable demo command does not require TypeScript compilation', async()=>{
  const pkg=JSON.parse(await readFile('package.json','utf8')); assert.equal(pkg.scripts.demo,'node scripts/dev-server.mjs'); assert.ok(pkg.scripts['demo:rebuild'].includes('build.mjs'));
});

test('outsider cannot self-assign manager authority by request headers', async()=>{
  const repo=new InMemoryPlatformRepository(); const handle=createApiHandler(repo);
  const founderHeaders={'content-type':'application/json','x-tenant-id':'sovereign_tenant','x-actor-id':'founder','x-group-roles':'founder,manager'};
  const founder=(p,init={})=>handle(new Request(`https://local.test${p}`,{...init,headers:{...founderHeaders,...(init.headers??{})}}));
  await founder('/api/v1/bootstrap',{method:'POST',body:JSON.stringify({displayName:'Founder'})});
  const p=await (await founder('/api/v1/group-projects',{method:'POST',body:JSON.stringify({name:'Sovereign',memberCount:2,sessions:2,nominalContribution:1000,managementFeePerContribution:0,estimatedExternalCostRate:0,fixedOperatingCostPerSession:0})})).json();
  await founder(`/api/v1/group-projects/${p.id}/simulate`,{method:'POST',body:'{}'}); const g=await (await founder(`/api/v1/group-projects/${p.id}/convert`,{method:'POST',body:'{}'})).json();
  const outsider=new Request(`https://local.test/api/v1/groups/${g.id}/members`,{method:'POST',headers:{'content-type':'application/json','x-tenant-id':'sovereign_tenant','x-actor-id':'outsider','x-group-roles':'founder,manager'},body:JSON.stringify({displayName:'Injected'})});
  const response=await handle(outsider); assert.equal(response.status,403); const body=await response.json(); assert.equal(body.error,'FORBIDDEN_SCOPE');
});
