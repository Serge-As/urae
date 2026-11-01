import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {MemberFinancialControlService} from '../.build/packages/member-control/src/index.js';
async function fixture(t,{peer=true}={}){
 const db=new SQLiteD1(':memory:');db.migrate();t.after(()=>db.close());const repo=new D1PlatformRepository(db),kernel=new PlatformKernel();let stamp='2026-11-01T10:00:00.000Z';
 const context=actor=>kernel.context.set({tenantId:'t',actorId:actor,activeGroupId:'g',groupRoles:['manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r-'+actor});context('a');
 await repo.saveGroup({id:'g',tenantId:'t',name:'Synthetic review',kind:'association',governanceModel:'community',status:'active',createdBy:'a',createdAt:stamp});
 for(const actor of peer?['a','b']:['a'])await repo.saveMembership({id:'m-'+actor,tenantId:'t',groupId:'g',userId:actor,roles:['manager','member'],status:'active',joinedAt:stamp});
 const service=new MemberFinancialControlService(repo,kernel,()=>stamp);
 const create=async(id,version=1,amount=5000,extra={})=>{const entry={id,tenantId:'t',groupId:'g',currency:'XAF',descriptionCode:'TEST',sourceType:'test',sourceId:id,idempotencyKey:id,createdAt:'2026-10-30T10:00:00Z',createdBy:'a',lines:[{accountId:'cash',debit:amount,credit:0},{accountId:'member',debit:0,credit:amount}]};await repo.saveLedgerEntry(entry);return service.create({groupId:'g',membershipId:'m-a',entry,operationType:'CASH_CONTRIBUTION',amount,currency:'XAF',meetingId:'meeting',rubricId:'rubric',newAmount:amount,cellVersion:version,...extra});};
 return {db,repo,service,create,context,at:value=>stamp=value};
}
test('self entry commits first, server receipt starts 48h and overdue review never changes the Ledger',async t=>{
 const x=await fixture(t),n=await x.create('entry1');assert.equal(n.reviewDueAt,'2026-11-03T10:00:00.000Z');assert.equal(n.serverReceivedAt,'2026-11-01T10:00:00.000Z');assert.equal(n.reviewState,'PENDING');assert.equal(n.requiresIndependentReview,true);
 const before=await x.repo.listLedgerEntries('t','g');await assert.rejects(()=>x.service.officerReview('g',n.id,'self'),/INDEPENDENT_REVIEW_REQUIRED/);
 x.at('2026-11-04T10:00:00.000Z');assert.equal((await x.service.list('g','m-a'))[0].reviewState,'OVERDUE');assert.deepEqual(await x.repo.listLedgerEntries('t','g'),before);
 const again=await x.create('entry1');assert.equal(again.reviewDueAt,n.reviewDueAt);assert.equal((await x.repo.listObligations('t','b')).length,1);
});
test('correction cannot restart the deadline; current-version review closes only independent non-disputed history',async t=>{
 const x=await fixture(t),first=await x.create('entry1');x.at('2026-11-02T10:00:00.000Z');const next=await x.create('entry2',2,7000);assert.equal(next.reviewDueAt,first.reviewDueAt);
 x.context('b');await assert.rejects(()=>x.service.officerReview('g',first.id,'old snapshot'),/CELL_REVIEW_STALE/);
 await assert.rejects(()=>x.service.approveCell('g','meeting','m-a','rubric',1,5000),/CELL_REVIEW_STALE/);assert.equal((await x.service.list('g','m-a')).find(n=>n.id===next.id).reviewState,'PENDING');
 await x.service.approveCell('g','meeting','m-a','rubric',2,7000);const notices=await x.service.list('g','m-a');assert.ok(notices.every(n=>n.reviewState==='REVIEWED'&&n.reviewedCellVersion===2));assert.ok((await x.repo.listObligations('t','b')).every(n=>n.status==='completed'));
 x.context('a');const third=await x.create('entry3',3,9000);assert.equal(third.reviewState,'PENDING');assert.equal(third.reviewDueAt,'2026-11-04T10:00:00.000Z');
});
test('sole manager is accepted honestly; removing a peer does not silently waive an outstanding independent review',async t=>{
 const x=await fixture(t,{peer:false}),n=await x.create('single');assert.equal(n.reviewState,'SOLE_MANAGER');assert.equal(n.requiresIndependentReview,false);assert.equal((await x.service.confirm('g',n.id)).memberState,'MEMBER_CONFIRMED');
 await x.repo.saveMembership({id:'m-b',tenantId:'t',groupId:'g',userId:'b',roles:['manager'],status:'active',joinedAt:'2026-11-01T10:00:00Z'});const pending=await x.create('with-peer',2);
 await x.repo.saveMembership({...await x.repo.getMembership('t','g','m-b'),status:'left'});const next=await x.create('peer-left',3);assert.equal(next.requiresIndependentReview,true);assert.equal(next.reviewDueAt,pending.reviewDueAt);
});
test('a member reserve remains open when another manager agrees with the cell; tenant boundaries remain enforced',async t=>{
 const x=await fixture(t),n=await x.create('reserve');await x.service.reserve('g',n.id,'Montant à vérifier');x.context('b');await x.service.approveCell('g','meeting','m-a','rubric',1,5000);assert.equal((await x.service.list('g','m-a'))[0].disputeState,'MEMBER_RESERVE');
 x.context('outsider');await assert.rejects(()=>x.service.approveCell('g','meeting','m-a','rubric',1,5000),/FORBIDDEN_SCOPE/);
});

test('a delayed projection inherits the first trusted server receipt instead of postponing the 48h deadline',async t=>{const x=await fixture(t);x.at('2026-11-02T10:00:00.000Z');const n=await x.create('delayed',1,5000,{serverReceivedAt:'2026-11-01T10:00:00.000Z'});assert.equal(n.createdAt,'2026-11-02T10:00:00.000Z');assert.equal(n.reviewDueAt,'2026-11-03T10:00:00.000Z');});

test('a concurrent reserve wins over an approval based on an older notice; D1 CAS never erases the member reserve',async t=>{
 const x=await fixture(t),n=await x.create('interleaved'),cas=x.repo.saveFinancialNoticeState.bind(x.repo);let signal,release;const entered=new Promise(r=>signal=r),resume=new Promise(r=>release=r);
 x.repo.saveFinancialNoticeState=async(record,version)=>{if(record.data.disputeState==='OFFICER_CONFIRMED'){signal();await resume;}return cas(record,version);};
 x.context('b');const approving=x.service.approveCell('g','meeting','m-a','rubric',1,5000);await entered;x.context('a');await x.service.reserve('g',n.id,'Réserve arrivée pendant la lecture');x.context('b');release();await assert.rejects(approving,/FINANCIAL_NOTICE_CHANGED_RETRY/);
 const notice=(await x.service.list('g','m-a'))[0];assert.equal(notice.disputeState,'MEMBER_RESERVE');assert.equal(notice.reserveReason,'Réserve arrivée pendant la lecture');assert.ok((await x.repo.listObligations('t','b')).every(o=>o.status==='open'));assert.equal((await x.repo.listLedgerEntries('t','g')).length,1);
});
