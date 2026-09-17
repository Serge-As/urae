import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {GroupDocumentService} from '../.build/packages/group-documents/src/index.js';
import {DocumentSearchService} from '../.build/packages/innovation/src/documents.js';

const group={id:'g',tenantId:'t',name:'CER',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-01T00:00:00.000Z'};
const member={id:'m',tenantId:'t',groupId:'g',userId:'member_user',roles:['member'],status:'active',joinedAt:'2026-09-01T00:00:00.000Z'};
const ctx=(kernel,actor,roles=[])=>kernel.context.set({tenantId:'t',actorId:actor,activeGroupId:'g',groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
async function setup(){const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel,'owner',['founder']);await repo.saveGroup(group);await repo.saveUser({id:'member_user',displayName:'Membre',locale:'fr',createdAt:'2026-09-01T00:00:00.000Z'});await repo.saveMembership(member);return{repo,kernel,svc:new GroupDocumentService(repo,kernel)};}

test('manager registers R2-backed extracted governance document and search finds it',async()=>{const {repo,kernel,svc}=await setup();const doc=await svc.create('g',{title:'Règlement intérieur 2026',content:'Article 12. La fête annuelle est organisée en décembre. Les prêts exigent un garant.',artifactKey:'launch-documents/t/owner/a/ri.pdf',fingerprint:'abc123',kind:'PDF',source:'ri.pdf'});assert.equal(doc.kind,'PDF');const hits=await new DocumentSearchService(repo,kernel).search('g','fête annuelle');assert.equal(hits.length,1);assert.equal(hits[0].recordId,doc.id);});

test('fingerprint makes repeated upload idempotent at document registry level',async()=>{const {svc}=await setup();const a=await svc.create('g',{title:'RI',content:'Texte',fingerprint:'same'}),b=await svc.create('g',{title:'RI copie',content:'Texte',fingerprint:'same'});assert.equal(a.id,b.id);assert.equal((await svc.list('g')).length,1);});

test('ordinary member may read/search but may not add or archive group governance documents',async()=>{const {kernel,svc}=await setup();const doc=await svc.create('g',{title:'PV',content:'Décision quorum',fingerprint:'pv1'});ctx(kernel,'member_user',['member']);assert.equal((await svc.list('g')).length,1);await assert.rejects(()=>svc.create('g',{title:'X',content:'x'}),/FORBIDDEN_SCOPE/);await assert.rejects(()=>svc.archive('g',doc.id),/FORBIDDEN_SCOPE/);});

test('archived documents leave active library and search index',async()=>{const {repo,kernel,svc}=await setup();const doc=await svc.create('g',{title:'Ancien RI',content:'ancienne règle épargne',fingerprint:'old'});await svc.archive('g',doc.id);assert.equal((await svc.list('g')).length,0);assert.equal((await new DocumentSearchService(repo,kernel).search('g','épargne')).length,0);});