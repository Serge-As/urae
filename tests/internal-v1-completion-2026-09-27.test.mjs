import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService,LedgerService,MeetingService} from '../.build/packages/domain/src/index.js';
import {TreasuryService} from '../.build/packages/finance/src/treasury.js';
import {PrepaymentService} from '../.build/packages/prepayments/src/index.js';
import {MeetingReopenAuthorizationService} from '../.build/packages/meeting-authorization/src/index.js';
import {CommitmentTrustGraphService} from '../.build/packages/trust/src/index.js';

const ctx=(k,actor,groupId,roles=['founder','manager'])=>k.context.set({actorId:actor,tenantId:'t6',activeGroupId:groupId,groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-'+actor+'-'+Date.now()});
async function seed(){
  const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),f=new FoundationService(repo,k);ctx(k,'founder');
  await f.ensureUser({id:'founder',displayName:'Fondatrice',locale:'fr',createdAt:new Date().toISOString()});
  await f.ensureUser({id:'manager2',displayName:'Trésorier',locale:'fr',createdAt:new Date().toISOString()});
  await f.ensureUser({id:'memberu',displayName:'Membre',locale:'fr',createdAt:new Date().toISOString()});
  const p=await f.createProject({tenantId:'t6',createdBy:'founder',name:'Groupe finalisation',kind:'association',governanceModel:'community',memberCount:3,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const g=await f.convertProjectToGroup('t6',p.id);ctx(k,'founder',g.id);
  await repo.saveMembership({id:'m_manager2',tenantId:'t6',groupId:g.id,userId:'manager2',roles:['treasurer'],status:'active',joinedAt:new Date().toISOString()});
  await repo.saveMembership({id:'m_member',tenantId:'t6',groupId:g.id,userId:'memberu',roles:['member'],status:'active',joinedAt:new Date().toISOString()});
  const current=(await repo.getGroup('t6',g.id)).operatingPolicy;
  await f.updateGroupOperatingPolicy('t6',g.id,{...current,latePosting:{...current.latePosting,mode:'GOVERNED',requireReason:true,approval:{...current.latePosting.approval,roleCodes:['founder','president','treasurer','manager'],minimumApprovals:2,founderOverride:false}}});
  return{repo,k,f,g,ledger:new LedgerService(repo,k),meetings:new MeetingService(repo,k)};
}

test('prepayment posts cash once and later allocation does not create a second ledger entry',async()=>{
  const {repo,k,g,ledger,meetings}=await seed();ctx(k,'founder',g.id);
  const rubric={id:'r_collation',tenantId:'t6',groupId:g.id,name:'Collation',aliases:[],facets:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'NON_REFUNDABLE',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  await repo.saveRubricDefinition(rubric);
  const meeting=await meetings.openMeeting('t6',g.id,{title:'Séance future',scheduledAt:'2026-10-10T10:00:00Z'});
  const svc=new PrepaymentService(repo,k,ledger),row=await svc.create(g.id,{membershipId:'m_member',rubricId:rubric.id,amount:5000,intendedMeetingId:meeting.id,idempotencyKey:'prepay-1'});
  assert.equal((await repo.listLedgerEntries('t6',g.id)).length,1);
  assert.equal(Number(row.data.remainingAmount),5000);
  const allocated=await svc.allocate(g.id,row.id,{meetingId:meeting.id,amount:3000});
  assert.equal((await repo.listLedgerEntries('t6',g.id)).length,1,'allocation must not post cash again');
  assert.equal(Number(allocated.data.remainingAmount),2000);
  assert.equal(allocated.data.ledgerMutationOnAllocation,false);
});

test('post-close authorization reaches quorum only with distinct authenticated manager accounts',async()=>{
  const {repo,k,g,ledger,meetings}=await seed();ctx(k,'founder',g.id);
  const meeting=await meetings.openMeeting('t6',g.id,{title:'Séance clôturée'});await meetings.closeMeeting('t6',g.id,meeting.id);
  const auth=new MeetingReopenAuthorizationService(repo,k),pending=await auth.create(g.id,meeting.id,{reason:'Retard justifié'});
  assert.equal(pending.data.authorizationState,'PENDING');assert.equal(JSON.parse(String(pending.data.approvalsJson)).length,1);
  await assert.rejects(()=>ledger.recordCashContribution({tenantId:'t6',groupId:g.id,membershipId:'m_member',amount:1000,meetingId:meeting.id,lateReason:'Tentative',approverIds:['manager2'],idempotencyKey:'spoof'}),/INDEPENDENT_APPROVAL_REQUIRED/);
  ctx(k,'manager2',g.id,['treasurer']);const approved=await auth.approve(g.id,pending.id);assert.equal(approved.data.authorizationState,'APPROVED');
  ctx(k,'founder',g.id);const receipt=await ledger.recordCashContribution({tenantId:'t6',groupId:g.id,membershipId:'m_member',amount:1000,meetingId:meeting.id,lateReason:'Retard justifié',lateAuthorizationId:approved.id,idempotencyKey:'late-approved'});
  assert.equal(receipt.latePosting?.approvedBy.length,2);
  assert.ok(receipt.latePosting?.approvedBy.includes('founder'));assert.ok(receipt.latePosting?.approvedBy.includes('manager2'));
});

test('budget envelopes stay structural until a dedicated non-duplicative allocation engine exists',async()=>{
  const registry=await import('../.build/packages/module-registry/src/index.js');
  const capability=registry.PRODUCT_MODULES.find(x=>x.id==='FINANCE.ENVELOPES');
  assert.equal(capability?.status,'STRUCTURAL_V1');
  const {repo,k,g,ledger}=await seed();ctx(k,'founder',g.id);
  const before=(await repo.listLedgerEntries('t6',g.id)).length;new TreasuryService(repo,k,ledger);
  assert.equal((await repo.listLedgerEntries('t6',g.id)).length,before,'no envelope pseudo-engine may mutate the canonical ledger while the capability is structural');
});

test('internal wallet is canonical custody, reports its ledger balance and is not an external payment rail',async()=>{
  const {repo,k,g,ledger}=await seed();ctx(k,'founder',g.id);
  await ledger.recordCashContribution({tenantId:'t6',groupId:g.id,membershipId:'m_member',amount:15000,idempotencyKey:'cash-wallet'});
  const treasury=new TreasuryService(repo,k,ledger),wallet=await treasury.createCustody(g.id,{name:'Dépôt interne',holder:'Trésorier'});
  await treasury.sendToCustody(g.id,wallet.id,6000,'wallet-out');
  let pos=await treasury.custodyPosition(g.id,wallet.id);assert.equal(pos.balance,6000);assert.equal(pos.internalOnly,true);assert.equal(pos.externalPaymentRail,false);
  await treasury.returnFromCustody(g.id,wallet.id,2000,'wallet-in');pos=await treasury.custodyPosition(g.id,wallet.id);assert.equal(pos.balance,4000);
});

test('trust graph uses behaviour-only evidence and remains advisory with no automatic decision',async()=>{
  const {repo,k,g}=await seed();ctx(k,'founder',g.id);const trust=new CommitmentTrustGraphService(repo,k);
  for(let i=0;i<5;i++)await trust.addEvidence(g.id,'m_member',{commitmentBand:'SMALL',kind:i===3?'RECOVERED_ARREARS':'FULFILLED_ON_TIME',sourceId:'pv-'+i,occurredAt:new Date(2026,8,1+i).toISOString()});
  const graph=await trust.graph(g.id,'m_member'),profile=await trust.profile(g.id,'m_member','SMALL');
  assert.equal(profile.advisoryOnly,true);assert.notEqual(profile.rating,'INSUFFICIENT_EVIDENCE');assert.equal(graph.policy.wealthUsed,false);assert.equal(graph.policy.automaticAdmission,false);assert.equal(graph.policy.automaticCreditDecision,false);assert.equal(graph.policy.automaticExclusion,false);
});
