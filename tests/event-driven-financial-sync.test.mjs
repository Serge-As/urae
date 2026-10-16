import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

test('free-tier financial recovery is event-driven, bounded and never an idle D1 poll',async()=>{
  const main=await readFile('.build/src/main.js','utf8');
  const app=await readFile('.build/packages/application/src/index.js','utf8');
  const start=main.indexOf('const scheduleFinancialOutboxRecovery');
  assert.ok(start>=0,'targeted financial recovery must exist');
  const end=main.indexOf('let financialSnapshotTimer',start);
  const snippet=main.slice(start,end>start?end:start+6500);
  assert.doesNotMatch(snippet,/if\(FREE_CONSERVATION_MODE\)return/,'free mode must not strand a validated queued cell');
  assert.match(snippet,/await resumeOnline\(\)/);
  assert.match(snippet,/,\s*850\)/,'one validation-triggered debounce stays below five seconds');
  const pollStart=main.indexOf('const ensureFinancialSnapshotPolling'),pollEnd=main.indexOf('const submitFinancialCellElement',pollStart),poll=main.slice(pollStart,pollEnd);
  assert.match(poll,/if\s*\(\s*FREE_CONSERVATION_MODE\s*\)\s*return/,'canonical snapshot polling is disabled in free mode');
  assert.match(poll,/setInterval/,'paid-mode polling remains explicitly isolated behind the free-mode guard');
  assert.match(app,/transportUnavailableUntil\s*=\s*Date\.now\(\)\s*\+\s*3500/);
  assert.match(app,/eco:transport-retry-ready/);
});

test('specialized repayment and outflow commits emit Live cell events in direct and Outbox paths',async()=>{
  const worker=await readFile('.build/workers/api/src/index.js','utf8');
  assert.match(worker,/loan-repayment-live:/,'the shared canonical repayment owner must publish');
  assert.ok((worker.match(/applyCanonicalLoanRepayment\(/g)||[]).length>=3,'direct route, planned Outbox and legacy replay must delegate to the publishing owner');
  assert.ok((worker.match(/sheet-outflow-live:/g)||[]).length>=2,'outflow direct + Outbox replay must both publish');
  assert.match(worker,/operationType:\s*['"]LOAN_REPAYMENT['"]/);
  assert.match(worker,/operationType:\s*['"]SHEET_OUTFLOW['"]/);
});

test('manual refresh preserves navigation and does not bypass a known D1 quota guard',async()=>{
  const main=await readFile('.build/src/main.js','utf8');
  const start=main.indexOf("$('#refreshBtn').addEventListener");
  assert.ok(start>=0);
  const snippet=main.slice(start,start+1600);
  assert.match(snippet,/captureNavState\(\)/);
  assert.match(snippet,/forceTransportRetry/);
  assert.doesNotMatch(snippet,/forceServerRetry/);
  assert.match(snippet,/showView\(preserved\.view,\s*preserved\)/);
  assert.match(main,/matrixScrollLeft/);
  assert.match(main,/individualScrollLeft/);
});

test('group sheet expense endpoint persists and lists the same canonical expense',async()=>{
  const tenantId='tenant-expense-sync',groupId='group-expense-sync',actorId='manager-expense';
  const repo=new InMemoryPlatformRepository();
  await repo.saveUser({id:actorId,displayName:'Manager Expense',locale:'fr',createdAt:'2026-10-07T10:00:00Z'});
  await repo.saveUser({id:'member-expense',displayName:'Member Expense',locale:'fr',createdAt:'2026-10-07T10:00:00Z'});
  await repo.saveGroup({id:groupId,tenantId,kind:'association',name:'Expense Sync',status:'active',createdAt:'2026-10-07T10:00:00Z',createdBy:actorId,originMode:'CREATE_NEW',governanceModel:'community'});
  await repo.saveMembership({id:'membership-expense',tenantId,groupId,userId:'member-expense',status:'active',roles:['member'],joinedAt:'2026-10-07T10:00:00Z'});
  await repo.saveMeeting({id:'meeting-expense',tenantId,groupId,status:'open',title:'Séance',session:1,scheduledAt:'2026-10-07T10:00:00Z',openedAt:'2026-10-07T10:00:00Z',openedBy:actorId});
  await repo.saveRubricDefinition({id:'rubric-expense',tenantId,groupId,name:'Transport',status:'ACTIVE',source:'GROUP_CUSTOM',facets:{direction:'OUTFLOW'},policies:{},createdAt:'2026-10-07T10:00:00Z'});
  const handle=createApiHandler(repo);
  const request=async(path,method='GET',body)=>{
    const response=await handle(new Request('https://eco.invalid'+path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),'x-tenant-id':tenantId,'x-actor-id':actorId,'x-group-roles':'manager','x-active-group-id':groupId},body:body===undefined?undefined:JSON.stringify(body)}));
    const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}
    if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
    return data;
  };
  await request('/api/v1/groups/'+groupId+'/ledger/opening-balance','POST',{amount:5000,currency:'XAF',note:'Caisse test synchronisation',idempotencyKey:'opening-expense-sync'});
  const expense=await request('/api/v1/groups/'+groupId+'/expenses','POST',{amount:750,label:'Transport séance',scope:'SHEET',meetingId:'meeting-expense',membershipId:'membership-expense',rubricId:'rubric-expense',idempotencyKey:'expense-sync-1'});
  assert.equal(expense.amount,750);
  assert.equal(expense.scope,'SHEET');
  const rows=await request('/api/v1/groups/'+groupId+'/expenses?scope=SHEET');
  assert.equal(rows.length,1);
  assert.equal(rows[0].id,expense.id);
  assert.equal(rows[0].rubricId,'rubric-expense');
});

