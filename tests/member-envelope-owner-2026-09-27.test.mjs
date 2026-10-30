import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {MemberEnvelopeService} from '../.build/packages/member-envelope/src/index.js';

const stamp=()=>new Date().toISOString();
const setCtx=(k,actor,roles=[])=>k.context.set({actorId:actor,tenantId:'tenant_env',activeGroupId:'g1',groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_'+actor});
async function seed(){
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),ledger=new LedgerService(repo,k);
 for(const [id,name] of [['founder','Founder'],['u1','Alice'],['u2','Bob']])await repo.saveUser({id,displayName:name,locale:'fr',createdAt:stamp()});
 await repo.saveGroup({id:'g1',tenantId:'tenant_env',name:'Groupe',kind:'association',governanceModel:'community',createdBy:'founder',status:'active',createdAt:stamp()});
 await repo.saveMembership({id:'m1',tenantId:'tenant_env',groupId:'g1',userId:'u1',status:'active',roles:['member'],joinedAt:stamp(),updatedAt:stamp()});
 await repo.saveMembership({id:'m2',tenantId:'tenant_env',groupId:'g1',userId:'u2',status:'active',roles:['member'],joinedAt:stamp(),updatedAt:stamp()});
 const openedAt=stamp();await repo.saveMeeting({id:'meet1',tenantId:'tenant_env',groupId:'g1',title:'Séance 1',status:'open',openedBy:'founder',openedAt});
 const facets={direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'NON_REFUNDABLE',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'};
 await repo.saveRubricDefinition({id:'r1',tenantId:'tenant_env',groupId:'g1',name:'Aide locale',aliases:[],facets,status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:stamp(),updatedAt:stamp()});
 setCtx(k,'founder',['founder','manager']);
 await ledger.recordCashContribution({tenantId:'tenant_env',groupId:'g1',membershipId:'m1',meetingId:'meet1',rubricId:'r1',amount:1000,idempotencyKey:'m1-c'});
 await ledger.recordCashContribution({tenantId:'tenant_env',groupId:'g1',membershipId:'m2',meetingId:'meet1',rubricId:'r1',amount:9000,idempotencyKey:'m2-c'});
 await repo.saveMeeting({id:'meet1',tenantId:'tenant_env',groupId:'g1',title:'Séance 1',status:'closed',openedBy:'founder',openedAt,closedAt:stamp()});
 await repo.saveWorkspaceRecord({id:'loan1',tenantId:'tenant_env',groupId:'g1',moduleId:'FINANCE.LOANS',title:'Prêt Alice',status:'ACTIVE',tags:['completion'],data:{completionKind:'LOAN',completionState:'REPAYING',borrowerMembershipId:'m1',outstandingPrincipal:2000,unpaidInterest:250},createdBy:'founder',createdAt:stamp(),updatedAt:stamp()});
 return{repo,k,ledger,service:new MemberEnvelopeService(repo,k,ledger)};
}
test('member envelope requires explicit distribution and contains only recipient finances',async()=>{
 const {repo,k,service}=await seed();setCtx(k,'u1',['member']);
 await assert.rejects(()=>service.build('g1','meet1'),/MEMBER_DISTRIBUTION_NOT_READY/);
 await repo.saveWorkspaceRecord({id:'dist1',tenantId:'tenant_env',groupId:'g1',moduleId:'MEETING.DISTRIBUTION',title:'Diffusion',status:'DONE',tags:['meeting-distribution'],data:{meetingId:'meet1',kind:'MEMBER_DISTRIBUTION_READY'},createdBy:'founder',createdAt:stamp(),updatedAt:stamp()});
 const env=await service.build('g1','meet1');
 assert.equal(env.membershipId,'m1');assert.equal(env.recipientUserId,'u1');assert.equal(env.scope,'MEMBER_ONLY');
 assert.equal(env.projection.meetingNet,1000);assert.equal(env.projection.meetingReceipts.length,1);assert.equal(env.projection.meetingReceipts[0].netAmount,1000);
 assert.ok(env.projection.meetingReceipts.every(x=>x.membershipId!=='m2'&&Number(x.netAmount)!==9000),'Bob financial receipt must never leak into Alice envelope');
 assert.ok((env.projection.loanDebts??[]).every(x=>x.membershipId!=='m2'),'Bob loan debt must never leak into Alice envelope');
 assert.equal(env.projection.loanDebts[0].totalDebt,2250);
 assert.deepEqual(env.privacy,{otherMemberFinancialData:false,contactsIncluded:false,identityDocumentsIncluded:false,rawAuditIncluded:false});
 assert.equal(env.transport.requiresRecipientBinding,true);assert.equal(env.transport.opaqueCapable,true);assert.equal(env.fingerprint.length,64);
});
test('member cannot fetch another member envelope while manager may build all recipients',async()=>{
 const {repo,k,service}=await seed();
 await repo.saveWorkspaceRecord({id:'dist1',tenantId:'tenant_env',groupId:'g1',moduleId:'MEETING.DISTRIBUTION',title:'Diffusion',status:'DONE',tags:['meeting-distribution'],data:{meetingId:'meet1',kind:'MEMBER_DISTRIBUTION_READY'},createdBy:'founder',createdAt:stamp(),updatedAt:stamp()});
 setCtx(k,'u1',['member']);await assert.rejects(()=>service.build('g1','meet1','m2'),/FORBIDDEN_SCOPE/);
 setCtx(k,'founder',['founder','manager']);const all=await service.buildAll('g1','meet1');assert.equal(all.length,2);assert.deepEqual(new Set(all.map(x=>x.recipientUserId)),new Set(['u1','u2']));
});

test('a scoped passage retains exact canonical amounts and versions without exposing another member',async()=>{
 const {k,service}=await seed();setCtx(k,'founder',['founder','manager']);
 const all=await service.canonicalCells('g1'),scoped=await service.canonicalCells('g1',{membershipId:'m1',meetingId:'meet1'});
 assert.deepEqual(scoped.cells,all.cells.filter(x=>x.membershipId==='m1'&&x.meetingId==='meet1'));
 assert.equal(scoped.cells[0].amount,1000);
 setCtx(k,'u1',['member']);assert.deepEqual((await service.canonicalCells('g1',{membershipId:'m2'})).cells,[]);
});
test('member envelope UI and worker use targeted live readiness rather than broadcast financial payload',()=>{
 const ui=fs.readFileSync('apps/web/src/member-envelope-ui.js','utf8'),worker=fs.readFileSync('workers/api/src/index.ts','utf8');
 assert.match(ui,/aucune donnée financière des autres membres/);assert.match(ui,/MEMBER_ENVELOPE_READY/);
 assert.match(worker,/publishLive\(groupId,'MEMBER_ENVELOPE_READY'/);assert.match(worker,/envelope\.recipientUserId/);
 assert.match(worker,/fingerprint:envelope\.fingerprint/);assert.doesNotMatch(worker,/MEMBER_ENVELOPE_READY[^\n]+meetingReceipts/);
});
