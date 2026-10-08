import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

async function fixture(){
  const repo=new InMemoryPlatformRepository(),tenantId='repay_t',groupId='repay_g',actorId='repay_manager',stamp='2026-10-08T10:00:00Z',events=[];
  await repo.saveUser({id:actorId,displayName:'Manager',locale:'fr',createdAt:stamp});
  await repo.saveGroup({id:groupId,tenantId,name:'Synthetic repayment',kind:'association',status:'active',createdBy:actorId,createdAt:stamp,governanceModel:'founder_managed'});
  await repo.saveMembership({id:'m',tenantId,groupId,userId:actorId,roles:['founder','manager'],status:'active',joinedAt:stamp});
  await repo.saveMeeting({id:'s',tenantId,groupId,title:'Séance',status:'open',session:1,openedAt:stamp,openedBy:actorId});
  await repo.saveRubricDefinition({id:'r',tenantId,groupId,name:'Remboursements',facets:{direction:'INFLOW',custom:{systemKey:'REPAYMENT'}},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp});
  await repo.saveWorkspaceRecord({id:'loan',tenantId,groupId,moduleId:'FINANCE.LOANS',title:'Prêt',status:'ACTIVE',tags:['completion','kind:LOAN','state:APPROVED'],data:{completionKind:'LOAN',completionState:'APPROVED',completionVersion:3,principal:10000,rubricId:'l',borrowerMembershipId:'m',outstandingPrincipal:0,unpaidInterest:0,currency:'XAF',paymentPriority:'CAPITAL_FIRST',rateBasisPointsPerPeriod:0},createdBy:actorId,createdAt:stamp,updatedAt:stamp});
  await repo.saveRubricDefinition({id:'l',tenantId,groupId,name:'Prêt',facets:{direction:'OUTFLOW',custom:{systemKey:'LOAN'}},policies:{loan:{allowed:true,rateBasisPointsPerPeriod:0,paymentPriority:'CAPITAL_FIRST',fundingMode:'AVAILABLE_GROUP_CASH',carryForwardUnusedFunds:true}},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp});
  let fail=false;
  const liveNamespace={idFromName:x=>x,get:()=>({fetch:async r=>{const event=await r.json();if(fail)return new Response('offline',{status:503});events.push(event);return new Response('{}',{status:202});}})};
  const handler=createApiHandler(repo,{premiumLive:true,liveNamespace});
  const request=async(path,method='GET',body)=>{
    const response=await handler(new Request('https://example.test'+path,{method,headers:{'content-type':'application/json','x-tenant-id':tenantId,'x-actor-id':actorId,'x-group-roles':'founder,manager','x-active-group-id':groupId},body:body===undefined?undefined:JSON.stringify(body)}));
    const data=await response.json();if(!response.ok)throw Error(JSON.stringify(data));return data;
  };
  await request('/api/v1/groups/'+groupId+'/ledger/opening-balance','POST',{amount:10000,currency:'XAF',idempotencyKey:'opening-test',note:'Synthetic test'});
  await request('/api/v1/groups/'+groupId+'/loans/loan/disburse','POST',{amount:10000,expectedVersion:3,meetingId:'s',rubricId:'l',idempotencyKey:'disburse-test'});
  return{repo,events,request,setFail:x=>{fail=x;},tenantId,groupId};
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
