import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

async function fixture(){
  const repo=new InMemoryPlatformRepository(),stamp='2026-10-16T08:00:00Z';
  await repo.saveGroup({id:'g',tenantId:'t',name:'Synthetic continuity',kind:'association',status:'active',createdBy:'a',createdAt:stamp,governanceModel:'founder_managed'});
  for(const actor of ['a','b']){await repo.saveUser({id:actor,displayName:actor,locale:'fr',createdAt:stamp});await repo.saveMembership({id:'m-'+actor,tenantId:'t',groupId:'g',userId:actor,roles:['manager'],status:'active',joinedAt:stamp});}
  await repo.saveMeeting({id:'s',tenantId:'t',groupId:'g',title:'Séance',status:'open',openedAt:stamp,openedBy:'a'});
  await repo.saveRubricDefinition({id:'r',tenantId:'t',groupId:'g',name:'Secours',facets:{direction:'INFLOW',obligation:'CUSTOM'},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp});
  const request=async(actor,path,method='GET',body)=>{
    // A new handler per request deliberately discards all in-memory UI/service
    // state: outstanding reviews must come from the repository after reload.
    const handler=createApiHandler(repo),response=await handler(new Request('https://test.local/api/v1/groups/g'+path,{method,headers:{'content-type':'application/json','x-tenant-id':'t','x-actor-id':actor,'x-group-roles':'manager','x-active-group-id':'g'},body:body===undefined?undefined:JSON.stringify(body)}));
    const data=await response.json();if(!response.ok)throw Error(JSON.stringify(data));return data;
  };
  return{repo,request};
}

test('canonical review survives service reload, clears on exact approval, and reopens for a newer amount',async()=>{
  const {repo,request}=await fixture();
  await request('a','/meetings/s/financial-cells','POST',{membershipId:'m-a',rubricId:'r',targetAmount:1000,expectedCurrentAmount:0,expectedCellVersion:0,reason:'Initial',idempotencyKey:'initial'});
  let snapshot=await request('b','/financial-cells/snapshot'),cell=snapshot.cells.find(x=>x.rubricId==='r');assert.equal(cell.reviewRequired,true);
  const original=await repo.listLedgerEntries('t','g');
  await request('b','/meetings/s/financial-cells/review','POST',{membershipId:'m-a',rubricId:'r',amount:1000,cellVersion:cell.cellVersion,decision:'APPROVE'});
  cell=(await request('b','/financial-cells/snapshot')).cells.find(x=>x.rubricId==='r');assert.equal(cell.reviewRequired,false);assert.equal(cell.reviewDecision,'APPROVE');
  assert.deepEqual(await repo.listLedgerEntries('t','g'),original,'approval cannot mutate Ledger');
  await request('a','/meetings/s/financial-cells','POST',{membershipId:'m-a',rubricId:'r',targetAmount:3000,expectedCurrentAmount:1000,expectedCellVersion:cell.cellVersion,reason:'Correction',idempotencyKey:'change'});
  cell=(await request('b','/financial-cells/snapshot')).cells.find(x=>x.rubricId==='r');assert.equal(cell.amount,3000);assert.equal(cell.reviewRequired,true);
  await assert.rejects(request('b','/meetings/s/financial-cells/review','POST',{membershipId:'m-a',rubricId:'r',amount:1000,cellVersion:cell.cellVersion-1,decision:'APPROVE'}),/CELL_REVIEW_STALE/);
});

test('reserve/approve/reserve at the same cell version retains the latest durable decision',async()=>{
  const {request}=await fixture();await request('a','/meetings/s/financial-cells','POST',{membershipId:'m-a',rubricId:'r',targetAmount:1000,expectedCurrentAmount:0,expectedCellVersion:0,reason:'Initial',idempotencyKey:'initial'});
  const cell=(await request('b','/financial-cells/snapshot')).cells[0];
  for(const decision of ['RESERVE','APPROVE','RESERVE','APPROVE']){
    await request('b','/meetings/s/financial-cells/review','POST',{membershipId:'m-a',rubricId:'r',amount:1000,cellVersion:cell.cellVersion,decision,reason:'Test de décision explicite'});
    const updated=(await request('b','/financial-cells/snapshot')).cells[0];assert.equal(updated.reviewRequired,decision==='RESERVE');assert.equal(updated.reviewDecision,decision);
  }
});
