import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';

async function fixture(){
  const repo=new InMemoryPlatformRepository(),stamp='2026-10-12T08:00:00Z';
  const ids=Object.fromEntries(['tenant','group','actor','other','member','meeting','rubric'].map(k=>[k,k+'_'+crypto.randomUUID()]));
  for(const id of [ids.actor,ids.other])await repo.saveUser({id,displayName:id===ids.actor?'Alpha':'Beta',locale:'fr',createdAt:stamp});
  await repo.saveGroup({id:ids.group,tenantId:ids.tenant,name:'Synthetic Live',kind:'association',status:'active',createdBy:ids.actor,createdAt:stamp,governanceModel:'founder_managed'});
  for(const [id,userId] of [[ids.member,ids.actor],['other-membership',ids.other]])await repo.saveMembership({id,tenantId:ids.tenant,groupId:ids.group,userId,roles:['manager','member'],status:'active',joinedAt:stamp});
  await repo.saveMeeting({id:ids.meeting,tenantId:ids.tenant,groupId:ids.group,title:'Séance',status:'open',session:1,openedAt:stamp,openedBy:ids.actor});
  await repo.saveRubricDefinition({id:ids.rubric,tenantId:ids.tenant,groupId:ids.group,name:'Secours',facets:{direction:'INFLOW'},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp});
  const storage=new Map(),hub=new GroupLiveHub({storage:{get:async k=>storage.get(k),put:async(k,v)=>storage.set(k,structuredClone(v)),list:async({prefix='',startAfter='',limit=500}={})=>new Map([...storage].filter(([k])=>k.startsWith(prefix)&&k>startAfter).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit))}},{});
  let failLive=false;
  const liveNamespace={idFromName:x=>x,get:()=>({fetch:r=>failLive?Promise.resolve(new Response('interruption',{status:503})):hub.fetch(r)})};
  const handler=createApiHandler(repo,{premiumLive:true,liveNamespace});
  const request=async(path,body,actor=ids.actor,extra={})=>{
    const response=await handler(new Request('https://eco.test'+path,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-tenant-id':ids.tenant,'x-actor-id':actor,'x-group-roles':'manager','x-active-group-id':ids.group,...extra},body:body===undefined?undefined:JSON.stringify(body)}));
    return {status:response.status,data:await response.json()};
  };
  const base='/api/v1/groups/'+ids.group,cell=base+'/meetings/'+ids.meeting+'/financial-cells';
  const target=(n=2000)=>({membershipId:ids.member,rubricId:ids.rubric,targetAmount:n,expectedCurrentAmount:0,expectedCellVersion:0,reason:'Synthetic check'});
  const events=()=>[...storage.values()].filter(x=>x?.seq&&x?.type);
  return{repo,ids,base,cell,target,request,events,failLive:v=>{failLive=v;}};
}

test('a non-financial notification failure cannot suppress the committed cell push',async()=>{
  const x=await fixture(),save=x.repo.insertNotificationRecord.bind(x.repo);let injected=0;
  x.repo.insertNotificationRecord=async row=>{if(row.moduleId==='NOTIFY.MESSAGE'){injected++;throw Error('SYNTHETIC_NOTIFICATION_UNAVAILABLE');}return save(row);};
  const result=await x.request(x.cell,x.target());
  assert.equal(result.status,201);assert.equal(result.data.status,'APPLIED');
  assert.equal(x.events().filter(e=>e.type==='MEETING_UPDATE'&&e.payload.newAmount===2000).length,1,'confirmed amount must be pushed independently of notification rendering');
  const pending=await x.repo.listWorkspaceRecords(x.ids.tenant,'FINANCE.CORRECTION_OUTBOX',x.ids.group);
  assert.equal(pending[0].status,'ACTIVE','failed ancillary delivery stays retryable');
  assert.ok(injected>0,'the canonical notification insertion really encountered the injected outage');
});

test('a persisted manager reserve with real-sized identifiers is acknowledged and delivered without changing money',async()=>{
  const x=await fixture();assert.equal((await x.request(x.cell,x.target())).status,201);
  const before=await x.repo.listLedgerEntries(x.ids.tenant,x.ids.group);
  const result=await x.request(x.cell+'/review',{meetingId:x.ids.meeting,membershipId:x.ids.member,rubricId:x.ids.rubric,amount:2000,cellVersion:1,decision:'RESERVE',reason:'Reçu à vérifier'},x.ids.other);
  assert.equal(result.status,200,JSON.stringify(result.data));
  assert.equal(result.data.canonicalUnchanged,true);
  assert.deepEqual(await x.repo.listLedgerEntries(x.ids.tenant,x.ids.group),before);
  assert.equal(x.events().filter(e=>e.type==='MANAGER_RESERVE').length,1);
});

test('replaying an acknowledged V2 command repairs an interrupted push without another financial entry',async()=>{
  const x=await fixture(),key='cell-target:'+crypto.randomUUID(),body={...x.target(),intentV2:{groupId:x.ids.group,meetingId:x.ids.meeting,membershipId:x.ids.member,rubricId:x.ids.rubric,targetAmount:2000,baselineValue:0,baselineVersion:0,recordedAtClient:'2026-10-12T08:00:01Z',deviceId:'synthetic-device',deviceSequence:1,commandId:key,reason:'Synthetic retry'}};
  const headers={'x-idempotency-key':key,'x-eco-clock-quality':'VERIFIED','x-eco-recorded-at-ms':String(Date.parse('2026-10-12T08:00:01Z'))};
  x.failLive(true);const first=await x.request(x.cell,body,x.ids.actor,headers);
  assert.equal(first.status,200);assert.equal(first.data.status,'APPLIED');
  const before=await x.repo.listLedgerEntries(x.ids.tenant,x.ids.group);
  x.failLive(false);const retry=await x.request(x.cell,body,x.ids.actor,headers);
  assert.equal(retry.status,200);assert.equal(retry.data.replayed,true);
  assert.deepEqual(await x.repo.listLedgerEntries(x.ids.tenant,x.ids.group),before);
  assert.equal(x.events().filter(e=>e.type==='MEETING_UPDATE'&&e.payload.newAmount===2000).length,1,'lost commit push must be replayed, not abandoned after the HTTP acknowledgement');
});

test('generic workspace editing cannot rewrite an already delivered private financial snapshot',async()=>{
 const x=await fixture(),at=new Date().toISOString(),record={id:'synthetic-frozen-bundle',tenantId:x.ids.tenant,groupId:x.ids.group,moduleId:'FINANCE.MEMBER_BUNDLE',title:'Frozen summary',status:'DONE',tags:['member-bundle'],data:{snapshotJson:'{"amount":1000}'},createdBy:x.ids.actor,createdAt:at,updatedAt:at};await x.repo.saveWorkspaceRecord(record);
 const response=await createApiHandler(x.repo)(new Request('https://eco.test/api/v1/workspaces/'+record.id,{method:'PUT',headers:{'content-type':'application/json','x-tenant-id':x.ids.tenant,'x-actor-id':x.ids.actor,'x-group-roles':'manager'},body:JSON.stringify({data:{snapshotJson:'{"amount":9999}'}})}));
 assert.equal((await response.json()).error,'IMMUTABLE_FINANCIAL_SNAPSHOT');assert.deepEqual(await x.repo.getWorkspaceRecord(x.ids.tenant,record.id),record);
});
