import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';

const tenant='tenant_l7',actor='manager_l7';
const ctx=kernel=>kernel.context.set({actorId:actor,tenantId:tenant,groupRoles:['founder','manager'],mandateIds:[],deviceId:'l7-device',sessionId:'l7-session',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'l7-request'});

test('L7 launch governance versions templates, preserves document provenance and stores immutable no-ledger feasibility runs',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel);
  await repo.saveUser({id:actor,displayName:'Gestionnaire L7',locale:'fr',createdAt:'2026-09-25T00:00:00Z'});
  const service=new FoundationService(repo,kernel);
  const project=await service.createProject({
    tenantId:tenant,createdBy:actor,name:'Association L7',kind:'association',governanceModel:'community',
    rubrics:[
      {key:'t1000',name:'Tontine 1 000',kind:'TONTINE',nominalAmount:{currency:'XAF',amount:1000},amountBasis:'PER_SHARE',participationMode:'OPTIONAL',memberCount:10,shareCount:8,potCount:8,sessions:8,duration:{value:8,unit:'SESSIONS'},managementFeePerPayment:50,estimatedExternalCostRate:0,fixedCostPerSession:0},
      {key:'savings',name:'Épargne',kind:'SAVINGS',nominalAmount:{currency:'XAF',amount:5000},amountBasis:'PER_MEMBER',participationMode:'OPTIONAL',memberCount:10,sessions:8,duration:{value:8,unit:'SESSIONS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0}
    ],
    launchProfile:{origin:{mode:'NEW'},cycle:{expectedSessions:8,cadence:'MONTHLY'},members:{expectedMembers:10},communication:{channels:['IN_APP','PRINT']},accessibility:{ultraSimple:true,lowBandwidthPriority:true,oldDevicePriority:true,preferredLocale:'fr'},sourceDocumentFingerprints:[],previewConfirmed:true}
  });

  const v1=await service.createLaunchTemplateVersion(tenant,project.id,{templateKey:'association-standard',title:'Modèle association',policies:{quorum:'RI'},calendar:[{session:1}],budget:{currency:'XAF'},trainingRefs:['academy-treasurer']});
  const v2=await service.createLaunchTemplateVersion(tenant,project.id,{templateKey:'association-standard',title:'Modèle association révisé',policies:{quorum:'RI-validé'},trainingRefs:['academy-treasurer']});
  assert.equal(v1.version,1);assert.equal(v2.version,2);assert.equal(v2.immutable,true);assert.equal(v2.snapshot.rubrics.length,2);

  const pdf=await service.recordLaunchSourceDocument(tenant,project.id,{kind:'PDF',fileName:'RI.pdf',fingerprint:'sha256:ri-v1',sourceRef:'r2://ri/1'});
  const photo=await service.recordLaunchSourceDocument(tenant,project.id,{kind:'PHOTO',fileName:'RI-page-2.jpg',fingerprint:'sha256:ri-photo-2',sourceRef:'r2://ri/2',pageIndex:2});
  assert.equal(pdf.humanReview,'PENDING');assert.equal(photo.pageIndex,2);
  await service.reviewLaunchSourceDocument(tenant,project.id,pdf.id,{accepted:true,note:'RI lisible et cohérent'});
  await service.reviewLaunchSourceDocument(tenant,project.id,photo.id,{accepted:true,note:'Page photo lisible et rattachée au RI'});

  const before=await repo.getProject(tenant,project.id),run=await service.recordFeasibilityRun(tenant,project.id),after=await repo.getProject(tenant,project.id);
  assert.equal(run.immutable,true);assert.equal(run.ledgerMutation,false);assert.equal(run.realMoney,false);assert.equal(run.result.projectId,project.id);
  assert.equal(before.status,'draft');assert.equal(after.status,'draft');

  const checklist=await service.createLaunchChecklistVersion(tenant,project.id,[
    {key:'ri',label:'RI validé',required:true,done:true,responsibleRole:'president',evidenceRef:pdf.id},
    {key:'treasury-training',label:'Formation trésorerie',required:true,done:true,responsibleRole:'treasurer',academyCourseId:'academy-treasurer',evidenceRef:'certificate:treasurer'}
  ]);
  assert.equal(checklist.version,1);
  const readiness=await service.launchReadiness(tenant,project.id);
  assert.equal(readiness.ready,true);assert.deepEqual(readiness.sourceReviews,{pending:0,rejected:0,accepted:2});assert.deepEqual(readiness.academyRefs,['academy-treasurer']);assert.equal(readiness.proofOnly,true);
});
