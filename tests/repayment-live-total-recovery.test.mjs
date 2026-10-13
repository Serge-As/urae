import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

async function fixture(grouped=false){
  const repo=new InMemoryPlatformRepository(),tenantId='repay_t',groupId='repay_g',actorId='repay_manager',stamp='2026-10-08T10:00:00Z',events=[];
  await repo.saveUser({id:actorId,displayName:'Manager',locale:'fr',createdAt:stamp});
  await repo.saveGroup({id:groupId,tenantId,name:'Synthetic repayment',kind:'association',status:'active',createdBy:actorId,createdAt:stamp,governanceModel:'founder_managed'});
  await repo.saveMembership({id:'m',tenantId,groupId,userId:actorId,roles:['founder','manager'],status:'active',joinedAt:stamp});
  await repo.saveMeeting({id:'s',tenantId,groupId,title:'Séance',status:'open',session:1,openedAt:stamp,openedBy:actorId});
  await repo.saveRubricDefinition({id:'r',tenantId,groupId,name:'Remboursements',facets:{direction:'INFLOW',custom:{systemKey:'REPAYMENT'}},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp});
  await repo.saveWorkspaceRecord({id:'loan',tenantId,groupId,moduleId:'FINANCE.LOANS',title:'Prêt',status:'ACTIVE',tags:['completion','kind:LOAN','state:APPROVED'],data:{completionKind:'LOAN',completionState:'APPROVED',completionVersion:3,principal:10000,rubricId:'l',borrowerMembershipId:'m',outstandingPrincipal:0,unpaidInterest:0,currency:'XAF',paymentPriority:'CAPITAL_FIRST',rateBasisPointsPerPeriod:0},createdBy:actorId,createdAt:stamp,updatedAt:stamp});
  await repo.saveRubricDefinition({id:'l',tenantId,groupId,name:'Prêt',facets:{direction:'OUTFLOW',custom:{systemKey:'LOAN'}},policies:{loan:{allowed:true,rateBasisPointsPerPeriod:0,paymentPriority:'CAPITAL_FIRST',fundingMode:'AVAILABLE_GROUP_CASH',carryForwardUnusedFunds:true}},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp});
  const state=new Map(),hub=grouped?new GroupLiveHub({storage:{get:async k=>structuredClone(state.get(k)),put:async(k,v)=>{state.set(k,structuredClone(v));},list:async({prefix='',startAfter='',limit=1000}={})=>new Map([...state].filter(([k])=>k.startsWith(prefix)&&k>startAfter).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit))}},{}):null;
  let fail=false;
  const liveNamespace={idFromName:x=>x,get:()=>({fetch:async r=>{if(hub){if(fail)return new Response('offline',{status:503});return hub.fetch(r);}if(new URL(r.url).pathname.endsWith('/context'))return new Response('{}',{status:200});const event=await r.json();if(fail)return new Response('offline',{status:503});events.push(event);return new Response('{}',{status:202});}})};
  const handler=createApiHandler(repo,{premiumLive:true,liveNamespace});
  const request=async(path,method='GET',body)=>{
    const response=await handler(new Request('https://example.test'+path,{method,headers:{'content-type':'application/json','x-tenant-id':tenantId,'x-actor-id':actorId,'x-group-roles':'founder,manager','x-active-group-id':groupId},body:body===undefined?undefined:JSON.stringify(body)}));
    const data=await response.json();if(!response.ok)throw Error(JSON.stringify(data));return data;
  };
  if(grouped)await request('/api/v1/groups/'+groupId+'/meetings/s/financial-work/mode','POST',{mode:'REUNION'});
  await request('/api/v1/groups/'+groupId+'/ledger/opening-balance','POST',{amount:10000,currency:'XAF',idempotencyKey:'opening-test',note:'Synthetic test'});
  await request('/api/v1/groups/'+groupId+'/loans/loan/disburse','POST',{amount:10000,expectedVersion:3,meetingId:'s',rubricId:'l',idempotencyKey:'disburse-test'});
  return{repo,events,request,state,setFail:x=>{fail=x;},tenantId,groupId};
}

test('successive repayments publish the absolute total; replaying an old payment never reduces the debt twice',async()=>{
  const {request,events,repo,tenantId,groupId}=await fixture(),path='/api/v1/groups/'+groupId+'/loans/loan/repay';
  const first={paymentAmount:2500,expectedVersion:4,meetingId:'s',rubricId:'r',idempotencyKey:'payment-1'};
  await request(path,'POST',first);await request(path,'POST',{...first,paymentAmount:1500,expectedVersion:5,idempotencyKey:'payment-2'});
  const cells=events.filter(x=>x.payload.operationType==='LOAN_REPAYMENT');assert.deepEqual(cells.map(x=>x.payload.newAmount),[2500,4000]);assert.deepEqual(cells.map(x=>x.payload.cellVersion),[1,2]);
  const replay=await request(path,'POST',first);assert.equal(replay.replayed,true);assert.equal(replay.loan.data.outstandingPrincipal,6000);
  assert.equal((await repo.listLedgerEntries(tenantId,groupId)).filter(x=>x.sourceType==='loan_repayment').length,2);
  const snapshot=await request('/api/v1/groups/'+groupId+'/financial-cells/snapshot');assert.equal(snapshot.cells.find(x=>x.rubricId==='r').amount,4000);assert.equal(snapshot.cells.find(x=>x.rubricId==='r').cellVersion,2);
});

test('a Live outage after financial commit leaves a durable projection which the existing retry endpoint delivers',async()=>{
  const {request,repo,events,setFail,tenantId,groupId}=await fixture();setFail(true);
  await request('/api/v1/groups/'+groupId+'/loans/loan/repay','POST',{paymentAmount:2500,expectedVersion:4,meetingId:'s',rubricId:'r',idempotencyKey:'lost-push'});
  assert.equal((await repo.listLedgerEntries(tenantId,groupId)).filter(x=>x.sourceType==='loan_repayment').length,1);
  const projection=(await repo.listWorkspaceRecords(tenantId,'FINANCE.LIVE_PROJECTION',groupId)).find(x=>x.tags.includes('sheet-live')&&JSON.parse(x.data.payloadJson).operationType==='LOAN_REPAYMENT');assert.equal(projection.status,'ACTIVE');
  setFail(false);await request('/api/v1/groups/'+groupId+'/live/retry-pending','POST',{});
  assert.equal((await repo.getWorkspaceRecord(tenantId,projection.id)).status,'DONE');assert.equal(events.filter(x=>x.payload.operationType==='LOAN_REPAYMENT').length,1);
});

test('grouped meeting binds loan and repayment summary rows to canonical Ledger notices without duplicating finance',async()=>{
 const {request,state,repo,tenantId,groupId}=await fixture(true),path='/api/v1/groups/'+groupId+'/loans/loan/repay';
 await request(path,'POST',{paymentAmount:2500,expectedVersion:4,meetingId:'s',rubricId:'r',idempotencyKey:'group-pay-1'});
 await request(path,'POST',{paymentAmount:1500,expectedVersion:5,meetingId:'s',rubricId:'r',idempotencyKey:'group-pay-2'});
 const bundles=[...state].filter(([k])=>k.startsWith('work:bundle:')).map(([,v])=>v);assert.equal(bundles.length,1);assert.equal(bundles[0].operationIds.length,3);assert.equal(bundles[0].noticeIds.length,3);
 const summary=await request('/api/v1/groups/'+groupId+'/meetings/s/financial-work/summary?membershipId=m&rubricIds=l,r');
 assert.equal(summary.lines.find(x=>x.rubricId==='r').current,4000);assert.equal(summary.lines.find(x=>x.rubricId==='l').current,-10000);
 for(const row of summary.lines){const notice=await repo.getWorkspaceRecord(tenantId,row.noticeId);assert.ok(notice);assert.equal(Number(notice.data.newAmount),Math.abs(row.current));}
 assert.equal((await repo.listLedgerEntries(tenantId,groupId)).filter(x=>x.sourceType==='loan_repayment').length,2);
});
