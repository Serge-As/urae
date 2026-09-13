import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {ExplainabilityService,DocumentSearchService,previewCsv,buildNotificationDigest} from '../.build/packages/innovation/src/index.js';

const ctx=(actorId='owner',tenantId='tenant_i')=>({tenantId,actorId,activeGroupId:'group_i',groupRoles:actorId==='owner'?['founder','manager']:['member'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
async function setup(){
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();kernel.context.set(ctx());
 await repo.saveUser({id:'owner',displayName:'Owner',locale:'fr',createdAt:new Date().toISOString()});
 await repo.saveUser({id:'member',displayName:'Member',locale:'en',createdAt:new Date().toISOString()});
 await repo.saveGroup({id:'group_i',tenantId:'tenant_i',name:'G',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:new Date().toISOString()});
 await repo.saveMembership({id:'m_owner',tenantId:'tenant_i',groupId:'group_i',userId:'owner',roles:['founder','manager'],status:'active',joinedAt:new Date().toISOString()});
 await repo.saveMembership({id:'m_member',tenantId:'tenant_i',groupId:'group_i',userId:'member',roles:['member'],status:'active',joinedAt:new Date().toISOString()});
 await repo.saveRubricDefinition({id:'rubric_i',tenantId:'tenant_i',groupId:'group_i',name:'Collation',aliases:[],facets:{direction:'MIXED',obligation:'CUSTOM',medium:'CASH',refundability:'CUSTOM',replenishment:'CUSTOM',interestMode:'CUSTOM',eligibilityMode:'RULE_BASED'},status:'ACTIVE',source:'GROUP_CUSTOM',version:3,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'CUSTOM',payoutMode:'CUSTOM',immediateFullPayout:false}});
 return{repo,kernel,ledger:new LedgerService(repo,kernel),explain:new ExplainabilityService(repo,kernel),docs:new DocumentSearchService(repo,kernel)};
}

test('amount explanation uses canonical receipts and reversal chain',async()=>{
 const {ledger,explain}=await setup();
 const receipt=await ledger.recordCashContribution({tenantId:'tenant_i',groupId:'group_i',membershipId:'m_member',rubricId:'rubric_i',amount:10000,idempotencyKey:'e-1'});
 let x=await explain.amount('group_i','m_member','rubric_i');assert.equal(x.gross,10000);assert.equal(x.net,10000);assert.equal(x.rows[0].status,'ACTIVE');assert.equal(x.ruleReferences[0].version,3);
 await ledger.reverseEntry({tenantId:'tenant_i',groupId:'group_i',entryId:receipt.ledgerEntryId,reason:'correction'});
 x=await explain.amount('group_i','m_member','rubric_i');assert.equal(x.net,0);assert.equal(x.rows[0].status,'REVERSED');assert.equal(x.rows[0].reversalEntryIds.length,1);
});

test('member can explain own amount but cannot inspect another member',async()=>{
 const {kernel,explain}=await setup();kernel.context.set(ctx('member'));
 const own=await explain.amount('group_i','m_member');assert.equal(own.membershipId,'m_member');
 await assert.rejects(()=>explain.amount('group_i','m_owner'),/FORBIDDEN_SCOPE/);
});

test('CSV import preview fingerprints source and never confuses blank rows with application',async()=>{
 const text='name;amount\nAlice;1000\nBob;\n';
 const a=await previewCsv(text,{requiredHeaders:['name','amount']});const b=await previewCsv(text,{requiredHeaders:['name','amount']});
 assert.equal(a.fingerprint,b.fingerprint);assert.equal(a.rowCount,2);assert.deepEqual(a.headers,['name','amount']);assert.equal(a.issues.length,0);
 const bad=await previewCsv('name;name\nA;1;extra\n',{requiredHeaders:['amount']});
 assert.ok(bad.issues.some(x=>x.code==='DUPLICATE_HEADER'));assert.ok(bad.issues.some(x=>x.code==='REQUIRED_HEADER_MISSING'));assert.ok(bad.issues.some(x=>x.code==='COLUMN_COUNT_MISMATCH'));
});

test('document search is group scoped, sourced and excludes archived records',async()=>{
 const {repo,docs}=await setup();
 await repo.saveWorkspaceRecord({id:'doc1',tenantId:'tenant_i',groupId:'group_i',moduleId:'GOVERNANCE.DOCUMENTS',title:'Règlement 2026',summary:'La collation est décidée en séance.',status:'ACTIVE',tags:['kind:DOCUMENT'],data:{content:'Article 4 : la collation est de 2000 francs.',source:'RI signé',page:'4',version:2},createdBy:'owner',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 await repo.saveWorkspaceRecord({id:'doc2',tenantId:'tenant_i',groupId:'group_i',moduleId:'GOVERNANCE.DOCUMENTS',title:'Ancien',summary:'collation',status:'ARCHIVED',tags:['kind:DOCUMENT'],data:{content:'ancienne règle'},createdBy:'owner',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 const hits=await docs.search('group_i','collation');assert.equal(hits.length,1);assert.equal(hits[0].recordId,'doc1');assert.equal(hits[0].source,'RI signé');assert.equal(hits[0].page,'4');
});

test('notification digest groups only relevant time window deterministically',()=>{
 const rows=buildNotificationDigest([{id:'a',title:'Later',dueAt:'2026-09-15T10:00:00Z',priority:'normal'},{id:'b',title:'Soon',dueAt:'2026-09-13T10:00:00Z',priority:'high'}],'2026-09-13T00:00:00Z',24);
 assert.deepEqual(rows.map(x=>x.id),['b']);
});

test('group health snapshot exposes aggregate operations, not private record bodies',async()=>{
 const {explain}=await setup();const health=await explain.health('group_i');
 assert.equal(health.groupId,'group_i');assert.equal(typeof health.ledgerEntries,'number');assert.equal('records' in health,false);
});
