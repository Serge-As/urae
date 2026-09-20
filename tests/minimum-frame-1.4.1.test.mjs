import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {MeetingService} from '../.build/packages/domain/src/index.js';
import {GroupIdentityService} from '../.build/packages/group-identity/src/index.js';
import {ReceivablesService} from '../.build/packages/finance/src/receivables.js';

const context=(kernel,actorId,roles=[])=>kernel.context.set({
  actorId,tenantId:'tenant_frame',activeGroupId:'group_frame',groupRoles:roles,mandateIds:[],
  deviceId:'device_frame',sessionId:'session_frame_'+actorId,locale:'fr',timezone:'Africa/Douala',
  connectivity:'online',requestId:'req_frame_'+actorId+'_'+Date.now()
});
const seed=async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  for(const [id,name] of [['manager_frame','Manager'],['member_a_user','Membre A'],['member_b_user','Membre B']])await repo.saveUser({id,displayName:name,locale:'fr',createdAt:'2026-09-19T00:00:00Z'});
  await repo.saveGroup({id:'group_frame',tenantId:'tenant_frame',name:'Groupe Cadre',kind:'association',governanceModel:'community',status:'active',createdBy:'manager_frame',createdAt:'2026-09-19T00:00:00Z',historicalCreatedAt:'2020-01-01T00:00:00Z',currentExerciseLabel:'2026-2027'});
  await repo.saveMembership({id:'manager_m',tenantId:'tenant_frame',groupId:'group_frame',userId:'manager_frame',roles:['founder','manager'],status:'active',joinedAt:'2026-09-19T00:00:00Z'});
  await repo.saveMembership({id:'member_a',tenantId:'tenant_frame',groupId:'group_frame',userId:'member_a_user',roles:['member'],status:'active',joinedAt:'2024-01-01T00:00:00Z'});
  await repo.saveMembership({id:'member_b',tenantId:'tenant_frame',groupId:'group_frame',userId:'member_b_user',roles:['member'],status:'active',joinedAt:'2024-02-01T00:00:00Z'});
  await repo.saveMeeting({id:'meeting_frame',tenantId:'tenant_frame',groupId:'group_frame',title:'Interne',status:'open',openedBy:'manager_frame',openedAt:'2026-09-19T10:00:00Z'});
  return{repo,kernel};
};

test('member arrears report is own-only while manager retains group-wide view',async()=>{
  const {repo,kernel}=await seed(),svc=new ReceivablesService(repo,kernel);
  await repo.saveObligation({id:'oa',tenantId:'tenant_frame',groupId:'group_frame',assigneeId:'member_a_user',type:'EXPECTED_CONTRIBUTION',title:'Cotisation A',dueAt:'2026-09-01T00:00:00Z',priority:'normal',status:'open',sourceType:'rubric_expectation',sourceId:'r1',amount:{currency:'XAF',amount:2000}});
  await repo.saveObligation({id:'ob',tenantId:'tenant_frame',groupId:'group_frame',assigneeId:'member_b_user',type:'EXPECTED_CONTRIBUTION',title:'Cotisation B',dueAt:'2026-09-01T00:00:00Z',priority:'normal',status:'open',sourceType:'rubric_expectation',sourceId:'r1',amount:{currency:'XAF',amount:5000}});
  context(kernel,'member_a_user',['member']);
  const mine=await svc.report('group_frame','2026-09-19T00:00:00Z');
  assert.deepEqual(mine.map(x=>x.obligationId),['oa']);
  context(kernel,'manager_frame',['founder','manager']);
  const all=await svc.report('group_frame','2026-09-19T00:00:00Z');
  assert.deepEqual(new Set(all.map(x=>x.obligationId)),new Set(['oa','ob']));
});

test('canonical group identity stores declaration and Bureau mandate without inventing values',async()=>{
  const {repo,kernel}=await seed(),svc=new GroupIdentityService(repo,kernel);
  context(kernel,'manager_frame',['founder','manager']);
  const before=await svc.profile('group_frame');assert.equal(before.declarationNumber,undefined);
  const saved=await svc.updateProfile('group_frame',{declarationNumber:'DECL-2026-015',declarationDate:'2026-03-01',officeMandateStart:'2026-01-01',officeMandateEnd:'2027-12-31',note:'Référence déclarée par le Bureau'});
  assert.equal(saved.declarationNumber,'DECL-2026-015');
  assert.ok(saved.officeMandateEnd.startsWith('2027-12-31'));
  context(kernel,'member_a_user',['member']);
  const memberView=await svc.profile('group_frame');assert.equal(memberView.declarationNumber,'DECL-2026-015');
  await assert.rejects(()=>svc.updateProfile('group_frame',{declarationNumber:'X'}),/FORBIDDEN_SCOPE/);
});

test('meeting context extends the canonical meeting instead of creating a parallel schedule',async()=>{
  const {repo,kernel}=await seed(),svc=new MeetingService(repo,kernel);
  context(kernel,'manager_frame',['founder','manager']);
  const updated=await svc.updateMeetingContext('tenant_frame','group_frame','meeting_frame',{scheduledAt:'2026-09-20T15:00:00+01:00',location:'Maison communautaire',theme:'Réunion ordinaire',dressCode:'Rouge'});
  assert.equal(updated.location,'Maison communautaire');assert.equal(updated.theme,'Réunion ordinaire');assert.equal(updated.dressCode,'Rouge');
  assert.equal((await repo.getMeeting('tenant_frame','group_frame','meeting_frame')).location,'Maison communautaire');
  const audits=await repo.listAudit('tenant_frame');assert.ok(audits.some(x=>x.action==='MEETING_CONTEXT_UPDATED'));
});

test('Accueil and Séances implement the minimum frame with non-destructive management wording',async()=>{
  const [home,detail,html]=await Promise.all([
    readFile('apps/web/src/group-home-ui.js','utf8'),
    readFile('apps/web/src/detail-ui.js','utf8'),
    readFile('apps/web/index.html','utf8')
  ]);
  for(const phrase of ['Groupe + code','Déclaration','Mandat du Bureau','Recettes depuis exercice','Dépenses depuis exercice','Solde caisse à ce jour','Membres redevables / impayés / amendes','Classement Tontines','Ma situation Tontines','Mes dettes / échéances'])assert.ok(home.includes(phrase),phrase);
  for(const phrase of ['Finances de la séance','Gestion des dettes à ce jour','Caisses / dépenses du Back-office comprises','Présence et émargement','Bénéficiaires et preuves de réception','Liste des séances / précédentes séances','Lieu / canal','Thème','Tenue / code vestimentaire'])assert.ok(detail.includes(phrase),phrase);
  assert.ok(home.includes('Gérer / archiver les rubriques'));
  assert.ok(!home.includes('Supprimer définitivement les rubriques'));
  assert.ok(html.includes('Centre opérationnel'));
  assert.ok(html.includes('id="view-sessions"'));
  assert.ok(html.includes('Vue d’ensemble'));
  assert.ok(html.includes('Bénéficiaires & preuves'));
});
