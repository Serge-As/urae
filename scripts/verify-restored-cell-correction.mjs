// Exercise the real ledger on a disposable copy of the verified private backup.
// Output is deliberately limited to assertion results. This program has no network client.
import assert from 'node:assert/strict';
import {copyFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SQLiteD1} from './sqlite-d1.mjs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';

const directory=await mkdtemp(join(tmpdir(),'eco-restored-cell-'));
const file=join(directory,'copy.sqlite');
let db;
try {
  await copyFile('.recovery/restored.sqlite',file);
  db=new SQLiteD1(file);
  const repo=new D1PlatformRepository(db),kernel=new PlatformKernel(),ledger=new LedgerService(repo,kernel);
  const groups=db.db.prepare("SELECT DISTINCT tenant_id,group_id FROM platform_records WHERE record_type='contribution_receipt'").all();
  let checked=false;
  for(const {tenant_id:tenantId,group_id:groupId} of groups){
    const group=await repo.getGroup(tenantId,groupId);
    if(!group)continue;
    kernel.context.set({tenantId,actorId:group.createdBy,activeGroupId:groupId,groupRoles:[],mandateIds:[],mandateGrants:[],locale:'fr',timezone:'Africa/Douala',requestId:'isolated-check'});
    const rows=await ledger.receiptPositions(tenantId,groupId);
    const cells=new Map();
    for(const row of rows){
      const key=JSON.stringify([row.meetingId,row.membershipId,row.rubricId]);
      cells.set(key,(cells.get(key)??0)+row.netAmount);
    }
    for(const [key,amount] of cells){
      if(amount!==5000)continue;
      const [meetingId,membershipId,rubricId]=JSON.parse(key);
      const meeting=await repo.getMeeting(tenantId,groupId,meetingId);
      const rubric=await repo.getRubricDefinition(tenantId,groupId,rubricId);
      const member=await repo.getMembership(tenantId,groupId,membershipId);
      if(meeting?.status!=='open'||member?.status!=='active'||rubric?.facets?.direction!=='INFLOW'||rubric.status==='ARCHIVED')continue;
      if(/remboursement|repayment|loan|prêt/i.test([rubric.name,rubric.activityPlan?.kind,rubric.facets.custom?.systemKey].join(' ')))continue;
      const revision=await repo.getFinancialCellRevision(tenantId,groupId,meetingId,membershipId,rubricId,'XAF');
      const result=await ledger.replaceCashContributionCell({tenantId,groupId,meetingId,membershipId,rubricId,currency:'XAF',targetAmount:4000,expectedCurrentAmount:5000,expectedCellVersion:revision?.version??0,reason:'Contrôle sur copie isolée',idempotencyKey:'isolated-check-'+crypto.randomUUID()});
      assert.equal(result.status,'APPLIED');assert.equal(result.previousAmount,5000);assert.equal(result.newAmount,4000);
      assert.equal(result.cellVersion,(revision?.version??0)+1);
      db.close();db=new SQLiteD1(file);
      const reopened=new LedgerService(new D1PlatformRepository(db),new PlatformKernel());
      const updated=await reopened.receiptPositions(tenantId,groupId);
      const cell=updated.filter(r=>r.meetingId===meetingId&&r.membershipId===membershipId&&r.rubricId===rubricId);
      assert.equal(cell.reduce((n,r)=>n+r.netAmount,0),4000);
      assert.equal(updated.reduce((n,r)=>n+r.netAmount,0)-rows.reduce((n,r)=>n+r.netAmount,0),-1000);
      checked=true;break;
    }
    if(checked)break;
  }
  console.log(checked?'RESTORED_CELL_CHECK: persisted 5000 to 4000; group change -1000; production writes 0':'RESTORED_CELL_CHECK: no eligible existing 5000 cell; production writes 0');
} finally {
  db?.close();
  await rm(directory,{recursive:true,force:true});
}
