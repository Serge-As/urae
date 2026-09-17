import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PRODUCT_MODULES,buildProductReadinessReport,MASTER_2_3_4_EXTERNAL_GATES} from '../.build/packages/module-registry/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

const headers={'content-type':'application/json','x-tenant-id':'tenant_234','x-actor-id':'founder_234','x-group-roles':'founder,manager'};
const seed=async()=>{
  const repo=new InMemoryPlatformRepository();
  await repo.saveUser({id:'founder_234',displayName:'Fondatrice',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveUser({id:'member_234',displayName:'Serge Exemple',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveGroup({id:'group_234',tenantId:'tenant_234',name:'Association 234',kind:'association',governanceModel:'community',status:'active',createdBy:'founder_234',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'membership_founder',tenantId:'tenant_234',groupId:'group_234',userId:'founder_234',roles:['founder','manager'],status:'active',joinedAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'membership_234',tenantId:'tenant_234',groupId:'group_234',userId:'member_234',roles:['member'],status:'active',joinedAt:'2026-01-01T00:00:00Z'});
  await repo.saveRubricDefinition({id:'rubric_tontine',tenantId:'tenant_234',groupId:'group_234',name:'Tontine 1 000',aliases:['1000'],facets:{direction:'INFLOW',obligation:'OPTIONAL',medium:'CASH',refundability:'NOT_APPLICABLE',replenishment:'NONE',interestMode:'NONE',eligibilityMode:'SELECTED_MEMBERS'},policies:{},createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'});
  return {repo,handler:createApiHandler(repo)};
};

test('Master 2.3.4 readiness refuses false completeness while structural blockers remain',()=>{
  const report=buildProductReadinessReport(PRODUCT_MODULES,new Date('2026-09-17T20:00:00Z'));
  assert.equal(report.masterBaseline,'2.3.4');
  assert.equal(report.total,PRODUCT_MODULES.length);
  assert.equal(report.verdict,'CLOSURE_IN_PROGRESS');
  assert.equal(report.masterComplete,false);
  assert.ok(report.blockingIds.length>0);
  assert.ok(report.externalGatedIds.includes('INTEGRATION.MOBILE_MONEY'));
  assert.equal(MASTER_2_3_4_EXTERNAL_GATES.has('INTEGRATION.WHATSAPP'),true);
  assert.equal(report.blockingIds.includes('INTEGRATION.MOBILE_MONEY'),false,'external provider gate must not masquerade as an independently solvable code blocker');
});

test('member lifecycle is authoritative, audited and optimistic-versioned',async()=>{
  const {repo,handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_234/members/membership_234/lifecycle',{method:'PUT',headers,body:JSON.stringify({status:'trial',expectedRevision:0,probationEndsAt:'2026-10-01',reason:'Période d’essai',roles:['member']})}));
  assert.equal(r.status,200);let body=await r.json();assert.equal(body.status,'trial');assert.equal(body.lifecycleRevision,1);assert.equal(body.lifecycleUpdatedBy,'founder_234');
  r=await handler(new Request('http://local/api/v1/groups/group_234/members/membership_234/lifecycle',{method:'PUT',headers,body:JSON.stringify({status:'active',expectedRevision:0,roles:['member']})}));
  assert.equal(r.status,400);assert.equal((await r.json()).error,'STALE_MEMBERSHIP_VERSION');
  r=await handler(new Request('http://local/api/v1/groups/group_234/members/membership_234/lifecycle',{method:'PUT',headers,body:JSON.stringify({status:'active',expectedRevision:1,roles:['member']})}));
  body=await r.json();assert.equal(body.status,'active');assert.equal(body.lifecycleRevision,2);assert.ok(body.reinstatedAt);
  const audit=await repo.listAudit('tenant_234');assert.ok(audit.some(x=>x.action==='MEMBERSHIP_LIFECYCLE_UPDATED'));
});

test('founder membership cannot silently lose founder authority through lifecycle edit',async()=>{
  const {handler}=await seed();
  const r=await handler(new Request('http://local/api/v1/groups/group_234/members/membership_founder/lifecycle',{method:'PUT',headers,body:JSON.stringify({status:'active',expectedRevision:0,roles:['member']})}));
  assert.equal(r.status,400);assert.equal((await r.json()).error,'FOUNDER_ROLE_REQUIRED');
});

test('rubric participation is persisted without creating a financial entry',async()=>{
  const {repo,handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_234/members/membership_234/participations',{method:'POST',headers,body:JSON.stringify({rubricId:'rubric_tontine',status:'ACTIVE',shareCount:3,shareNames:'Serge A, Serge B, Serge C'})}));
  assert.equal(r.status,201);let body=await r.json();assert.equal(body.data.shareCount,3);assert.equal(body.moduleId,'MEMBERSHIP.RUBRIC_PARTICIPATION');
  r=await handler(new Request('http://local/api/v1/groups/group_234/members/membership_234/participations',{headers}));body=await r.json();assert.equal(body.length,1);assert.equal(body[0].data.rubricId,'rubric_tontine');
  assert.equal((await repo.listLedgerEntries('tenant_234','group_234')).length,0,'participation configuration must not invent a ledger movement');
});

test('arrears status and recovery case remain separate from canonical obligation truth',async()=>{
  const {repo,handler}=await seed();
  await repo.saveObligation({id:'obl_late',tenantId:'tenant_234',groupId:'group_234',assigneeId:'membership_234',type:'CONTRIBUTION_DUE',title:'Cotisation en retard',dueAt:'2026-09-01',priority:'high',status:'open',sourceType:'rubric',sourceId:'rubric_tontine',amount:{currency:'XAF',amount:5000}});
  let r=await handler(new Request('http://local/api/v1/groups/group_234/arrears',{headers}));assert.equal(r.status,200);let body=await r.json();assert.equal(body.length,1);
  r=await handler(new Request('http://local/api/v1/groups/group_234/arrears/obl_late/recovery-case',{method:'POST',headers,body:JSON.stringify({summary:'Appel et plan de régularisation'})}));assert.equal(r.status,201);body=await r.json();assert.equal(body.type,'ARREARS_RECOVERY');assert.equal(body.subjectId,'obl_late');
  assert.equal((await repo.listObligations('tenant_234')).find(x=>x.id==='obl_late').status,'open','case creation must not erase debt truth');
  r=await handler(new Request('http://local/api/v1/groups/group_234/obligations/obl_late',{method:'PUT',headers,body:JSON.stringify({status:'completed'})}));assert.equal(r.status,200);assert.equal((await r.json()).status,'completed');
});

test('operational report reuses server authorities instead of a browser-side second ledger',async()=>{
  const {repo,handler}=await seed();
  await repo.saveMeeting({id:'meet1',tenantId:'tenant_234',groupId:'group_234',title:'Séance 1',status:'open',openedBy:'founder_234',openedAt:'2026-09-17T18:00:00Z'});
  await repo.saveObligation({id:'obl1',tenantId:'tenant_234',groupId:'group_234',assigneeId:'membership_234',type:'CONTRIBUTION_DUE',title:'Secours',priority:'normal',status:'open',sourceType:'rubric',sourceId:'rubric_tontine',amount:{currency:'XAF',amount:1000}});
  const r=await handler(new Request('http://local/api/v1/groups/group_234/reports/operational-summary',{headers}));assert.equal(r.status,200);const body=await r.json();assert.equal(body.summary.members,2);assert.equal(body.summary.meetings,1);assert.equal(body.summary.rubrics,1);assert.equal(body.summary.openObligations,1);assert.equal(body.ledger.summary.cashBalance,0);
});

test('1.4 shell mounts dedicated 2.3.4 operational center instead of catalogue-only completion',()=>{
  const bootstrap=fs.readFileSync('apps/web/src/voice-entry-bootstrap.ts','utf8');
  const ui=fs.readFileSync('apps/web/src/master-closure-ui.ts','utf8');
  assert.match(bootstrap,/mountMasterClosureUI/);
  for(const token of ['Cycle de vie du membre','Participation par rubrique','Présence & émargement','Impayés & régularisation','Exports vérifiables','Vérité fonctionnelle du produit']) assert.match(ui,new RegExp(token));
  assert.match(ui,/MEMBERSHIP\.RECRUITMENT/);
  assert.match(ui,/GOVERNANCE\.VOTE/);
  assert.match(ui,/NOTIFY\.MULTICHANNEL/);
  assert.doesNotMatch(ui,/realMoneyEnabled\s*=\s*true/);
});
