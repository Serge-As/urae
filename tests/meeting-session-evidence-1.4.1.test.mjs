import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {MeetingService} from '../.build/packages/domain/src/index.js';

const setContext=(kernel,{actorId,roles=[]})=>kernel.context.set({
  actorId,tenantId:'tenant_session',activeGroupId:'group_session',groupRoles:roles,mandateIds:[],
  deviceId:'device_test',sessionId:'session_test',locale:'fr',timezone:'Africa/Douala',
  connectivity:'online',requestId:'req_'+actorId+'_'+Date.now()
});

const seed=async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),service=new MeetingService(repo,kernel);
  await repo.saveUser({id:'manager_session',displayName:'Fondatrice Manager',locale:'fr',createdAt:'2026-09-19T00:00:00Z'});
  await repo.saveUser({id:'member_a_user',displayName:'Membre A',locale:'fr',createdAt:'2026-09-19T00:00:00Z'});
  await repo.saveUser({id:'member_b_user',displayName:'Membre B',locale:'fr',createdAt:'2026-09-19T00:00:00Z'});
  await repo.saveGroup({id:'group_session',tenantId:'tenant_session',name:'Association Session',kind:'association',governanceModel:'community',status:'active',createdBy:'manager_session',createdAt:'2026-09-19T00:00:00Z'});
  await repo.saveMembership({id:'manager_membership',tenantId:'tenant_session',groupId:'group_session',userId:'manager_session',roles:['founder','manager'],status:'active',joinedAt:'2026-09-19T00:00:00Z'});
  await repo.saveMembership({id:'member_a',tenantId:'tenant_session',groupId:'group_session',userId:'member_a_user',roles:['member'],status:'active',joinedAt:'2026-09-19T00:00:00Z'});
  await repo.saveMembership({id:'member_b',tenantId:'tenant_session',groupId:'group_session',userId:'member_b_user',roles:['member'],status:'active',joinedAt:'2026-09-19T00:00:00Z'});
  await repo.saveMeeting({id:'meeting_session',tenantId:'tenant_session',groupId:'group_session',title:'Meeting Internal',status:'open',openedBy:'manager_session',openedAt:'2026-09-19T10:00:00Z'});
  return{repo,kernel,service};
};

test('attendance is manager-owned, updateable and auditable while a member sees only own status',async()=>{
  const {repo,kernel,service}=await seed();
  setContext(kernel,{actorId:'manager_session',roles:['founder','manager']});
  const first=await service.recordAttendance('tenant_session','group_session','meeting_session',{membershipId:'member_a',attendance:'PRESENT'});
  const second=await service.recordAttendance('tenant_session','group_session','meeting_session',{membershipId:'member_a',attendance:'LATE',note:'Arrivée après ouverture'});
  assert.equal(first.id,second.id);
  assert.equal(second.data.attendance,'LATE');
  const audits=await repo.listAudit('tenant_session');
  assert.ok(audits.some(x=>x.action==='MEETING_ATTENDANCE_RECORDED'));
  assert.ok(audits.some(x=>x.action==='MEETING_ATTENDANCE_UPDATED'));

  setContext(kernel,{actorId:'member_a_user',roles:['member']});
  const own=await service.listAttendance('tenant_session','group_session','meeting_session');
  assert.equal(own.length,1);assert.equal(own[0].displayName,'Membre A');
  await assert.rejects(()=>service.recordAttendance('tenant_session','group_session','meeting_session',{membershipId:'member_a',attendance:'ABSENT'}),/FORBIDDEN_SCOPE/);
});

test('beneficiary receipt requires a prior manager declaration and a member can confirm only self',async()=>{
  const {repo,kernel,service}=await seed();
  setContext(kernel,{actorId:'manager_session',roles:['founder','manager']});
  const declaration=await service.declareBenefit('tenant_session','group_session','meeting_session',{membershipId:'member_a',amount:10000,currency:'XAF',note:'Assistance remise en séance'});
  assert.equal(declaration.status,'ACTIVE');
  assert.equal(declaration.data.amount,10000);
  assert.match(String(declaration.data.proofCode),/^ECO-RCP-[A-Z0-9]{10}$/);

  setContext(kernel,{actorId:'member_a_user',roles:['member']});
  const visible=await service.listBenefitDeclarations('tenant_session','group_session','meeting_session');
  assert.equal(visible.length,1);assert.equal(visible[0].id,declaration.id);
  const input={declarationId:declaration.id,membershipId:'member_a',amount:10000,currency:'XAF',method:'MEMBER_CONFIRMATION',idempotencyKey:'member-a-confirm'};
  const evidence=await service.recordBenefitEvidence('tenant_session','group_session','meeting_session',input);
  assert.equal(evidence.type,'MEETING_BENEFIT_RECEIPT');
  assert.equal(evidence.data.memberSelfConfirmed,true);
  assert.equal(evidence.data.amount,10000);
  assert.equal(evidence.data.proofCode,declaration.data.proofCode);

  const retried=await service.recordBenefitEvidence('tenant_session','group_session','meeting_session',input);
  assert.equal(retried.id,evidence.id);
  const done=await repo.getWorkspaceRecord('tenant_session',declaration.id);
  assert.equal(done.status,'DONE');assert.equal(done.data.evidenceId,evidence.id);

  assert.throws(()=>repo.saveEvidence({...evidence,data:{...evidence.data,amount:99999}}),/EVIDENCE_IMMUTABLE_CONFLICT/);
});

test('member cannot acknowledge another beneficiary and manager can record paper evidence',async()=>{
  const {kernel,service}=await seed();
  setContext(kernel,{actorId:'manager_session',roles:['founder','manager']});
  const declaration=await service.declareBenefit('tenant_session','group_session','meeting_session',{membershipId:'member_b',amount:5000,currency:'XAF'});

  setContext(kernel,{actorId:'member_a_user',roles:['member']});
  await assert.rejects(()=>service.recordBenefitEvidence('tenant_session','group_session','meeting_session',{
    declarationId:declaration.id,membershipId:'member_b',amount:5000,currency:'XAF',method:'MEMBER_CONFIRMATION',idempotencyKey:'wrong-member'
  }),/MEMBER_SELF_ACTION_REQUIRED/);

  setContext(kernel,{actorId:'manager_session',roles:['founder','manager']});
  const evidence=await service.recordBenefitEvidence('tenant_session','group_session','meeting_session',{
    declarationId:declaration.id,membershipId:'member_b',amount:5000,currency:'XAF',method:'PAPER_EMARGEMENT',note:'Signature papier constatée',idempotencyKey:'paper-member-b'
  });
  assert.equal(evidence.data.method,'PAPER_EMARGEMENT');
  assert.equal(evidence.data.memberSelfConfirmed,false);
});

test('photo evidence requires an artifact and session UI exposes the complete governed cockpit',async()=>{
  const {kernel,service}=await seed();
  setContext(kernel,{actorId:'manager_session',roles:['founder','manager']});
  const declaration=await service.declareBenefit('tenant_session','group_session','meeting_session',{membershipId:'member_b',amount:7500,currency:'XAF'});
  await assert.rejects(()=>service.recordBenefitEvidence('tenant_session','group_session','meeting_session',{
    declarationId:declaration.id,membershipId:'member_b',amount:7500,currency:'XAF',method:'PHOTO_DOCUMENT',idempotencyKey:'photo-no-file'
  }),/EVIDENCE_ARTIFACT_REQUIRED/);

  const ui=await readFile('apps/web/src/detail-ui.js','utf8'),api=await readFile('workers/api/src/index.ts','utf8'),app=await readFile('packages/application/src/index.ts','utf8');
  for(const phrase of ['Identification de la séance','Temporalité de la séance','Finances de la séance','Présence et émargement','Bénéficiaires et preuves de réception','Aucun rapprochement de caisse n’est enregistré'])assert.ok(ui.includes(phrase),phrase);
  assert.ok(ui.includes('Je confirme avoir reçu'));assert.ok(ui.includes('Émargement papier reçu'));assert.ok(ui.includes('Joindre photo / document'));
  assert.ok(ui.includes('Code de réception'));
  assert.ok(api.includes('beneficiary-evidence')&&api.includes('upload'));assert.ok(api.includes('recordBenefitEvidence'));
  assert.ok(app.includes('meetingAttendance'));assert.ok(app.includes('meetingBeneficiaries'));assert.ok(app.includes('meetingBenefitEvidence'));
});
