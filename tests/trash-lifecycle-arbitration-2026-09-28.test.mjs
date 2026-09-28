import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {TrashLifecycleMaintenance,addCalendarMonthsClamped} from '../.build/packages/trash-lifecycle/src/index.js';

const tenantId='tenant-trash',groupId='group-trash',deleted='2026-03-28T12:00:00.000Z',expired='2026-09-28T12:00:00.000Z';
const group={id:groupId,tenantId,name:'Groupe corbeille',kind:'association',governanceModel:'community',status:'archived',createdBy:'founder-trash',createdAt:'2025-01-01T00:00:00.000Z'};

async function seeded(kind='GROUP'){
 const repo=new InMemoryPlatformRepository();await repo.saveGroup(group);
 await repo.saveWorkspaceRecord({id:'artifact-pointer',tenantId,groupId,moduleId:'DOCUMENT.TEST',title:'Pièce',status:'ACTIVE',tags:[],data:{artifactKey:'r2://bucket/'+tenantId+'/'+groupId+'/proof.pdf'},createdBy:'founder-trash',createdAt:deleted,updatedAt:deleted});
 await repo.saveWorkspaceRecord({id:'trash-item',tenantId,groupId,moduleId:'TRASH.ITEM',title:'Supprimé',status:'ACTIVE',tags:['trash'],data:{kind,entityId:groupId,deletedAt:deleted,restoreUntil:expired,snapshotJson:JSON.stringify(group),petitionState:'OPEN',petitionThreshold:2,lifecycleState:'TRASHED',remindersEnabled:true,nextReminderAt:'2026-04-28T12:00:00.000Z'},createdBy:'founder-trash',createdAt:deleted,updatedAt:deleted});
 return repo;
}

test('six calendar months stay calendar based at month ends',()=>{
 assert.equal(addCalendarMonthsClamped(new Date('2026-08-31T10:00:00Z'),6).toISOString(),'2027-02-28T10:00:00.000Z');
});

test('group R2 deletion starts only after canonical purge arbitration has committed',async()=>{
 const repo=await seeded(),observations=[];
 const maintenance=new TrashLifecycleMaintenance(repo,{delete:async key=>{observations.push({key,purged:await repo.isGroupPurged(tenantId,groupId)});}});
 const report=await maintenance.run(new Date('2026-09-28T12:00:01Z'));
 assert.equal(report.purged,1);assert.equal(observations.length,1);assert.equal(observations[0].purged,true);
 const cleanup=(await repo.listTrashMaintenanceItems()).find(x=>x.moduleId==='TRASH.ARTIFACT_CLEANUP');assert.equal(cleanup.status,'DONE');assert.equal(cleanup.data.artifactKeysJson,'[]');
});

test('failed R2 cleanup remains durable and retryable after group data is purged',async()=>{
 const repo=await seeded();let fail=true,calls=0;const maintenance=new TrashLifecycleMaintenance(repo,{delete:async()=>{calls++;if(fail)throw Error('R2_TEMPORARY');}});
 const first=await maintenance.run(new Date('2026-09-28T12:00:01Z'));assert.equal(first.purged,1);assert.equal(first.blocked,1);assert.equal(await repo.isGroupPurged(tenantId,groupId),true);
 let cleanup=(await repo.listTrashMaintenanceItems()).find(x=>x.moduleId==='TRASH.ARTIFACT_CLEANUP');assert.equal(cleanup.status,'ACTIVE');assert.match(String(cleanup.data.lastError),/R2_TEMPORARY/);
 fail=false;const second=await maintenance.run(new Date('2026-09-28T13:00:00Z'));cleanup=(await repo.listTrashMaintenanceItems()).find(x=>x.moduleId==='TRASH.ARTIFACT_CLEANUP');assert.equal(cleanup.status,'DONE');assert.ok(calls>=2);
});

test('non-group trash expires the restore snapshot without breaking retained ledger references',async()=>{
 const repo=await seeded('MEMBER'),maintenance=new TrashLifecycleMaintenance(repo);const report=await maintenance.run(new Date('2026-09-28T12:00:01Z'));assert.equal(report.purged,1);
 const item=await repo.getWorkspaceRecord(tenantId,'trash-item');assert.equal(item.status,'ARCHIVED');assert.equal(item.data.lifecycleState,'PURGED_RECOVERY_SNAPSHOT');assert.equal(item.data.snapshotJson,'');assert.equal(await repo.isGroupPurged(tenantId,groupId),false);
});
