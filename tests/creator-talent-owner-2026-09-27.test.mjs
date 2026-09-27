import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {BusinessStudioService} from '../.build/packages/business-studio/src/index.js';
import {CommunityService} from '../.build/packages/community/src/index.js';
import {KnowledgeAcademyService} from '../.build/packages/knowledge-academy/src/index.js';
import {CreatorTalentService} from '../.build/packages/creator-talent/src/index.js';

const ctx=(k,actor,groupId,roles=[])=>k.context.set({actorId:actor,tenantId:'tenant_creator',activeGroupId:groupId,groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-'+actor});
async function seed(){
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),at=new Date().toISOString(),groupId='g-creator';
 await repo.saveUser({id:'owner',displayName:'Créatrice',locale:'fr',createdAt:at});
 await repo.saveUser({id:'member',displayName:'Membre',locale:'fr',createdAt:at});
 await repo.saveGroup({id:groupId,tenantId:'tenant_creator',name:'Groupe Creator',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:at});
 await repo.saveMembership({id:'m-owner',tenantId:'tenant_creator',groupId,userId:'owner',roles:['founder','manager'],status:'active',joinedAt:at,updatedAt:at});
 await repo.saveMembership({id:'m-member',tenantId:'tenant_creator',groupId,userId:'member',roles:['member'],status:'active',joinedAt:at,updatedAt:at});
 ctx(k,'owner',groupId,['founder','manager']);
 const business=new BusinessStudioService(repo,k),community=new CommunityService(repo,k),academy=new KnowledgeAcademyService(repo,k),service=new CreatorTalentService(repo,k,business,community);
 return{repo,k,groupId,business,community,academy,service};
}

test('Creator uses Community for publication and converts interest into canonical Business records',async()=>{
 const {k,groupId,business,community,service}=await seed();
 const hub=await community.createHub(groupId,{title:'Services du groupe'});
 const offer=await business.createOffer({name:'Secrétariat',category:'SERVICE',unitPrice:5000});
 const content=await service.createContent({title:'Service de secrétariat',body:'Je propose la préparation de vos PV.',offerId:offer.id,groupId,hubId:hub.id});
 assert.equal(content.data.contentState,'PUBLISHED');assert.ok(content.data.communityPostId);assert.equal(content.data.canonicalTransactionOnly,true);assert.equal(content.data.incomePromise,false);
 ctx(k,'member',groupId,['member']);
 const discovered=await service.discoverContent(groupId);assert.equal(discovered.length,1);assert.equal(discovered[0].id,content.id);
 const interest=await service.recordInterest(content.id,'Besoin pour notre prochaine séance');assert.equal(interest.data.interestState,'OPEN');assert.equal(interest.data.privateContactShared,false);
 ctx(k,'owner',groupId,['founder','manager']);
 const action=await service.createCanonicalAction(content.id,interest.id,{clientName:'Membre intéressé',need:'Préparer un PV',estimatedBudget:5000});
 assert.equal(action.request.data.businessKind,'REQUEST');assert.equal(action.client.data.businessKind,'CLIENT');assert.equal(action.interest.data.interestState,'ACTION');
 const records=await business.records();assert.ok(records.some(x=>x.id===action.request.id));assert.ok(records.some(x=>x.id===action.client.id));
});

test('Talent Learn-Prove-Work-Earn never marks Earn before a real canonical receipt exists',async()=>{
 const {k,business,academy,service}=await seed();ctx(k,'owner','g-creator',['founder','manager']);
 const course=await academy.createCourse({title:'Gestion de séance',audience:'Gestionnaire',description:'Parcours',lessons:[{id:'l1',title:'Séance',objective:'Préparer une séance'}]});
 const enrollment=await academy.enroll(course.id);await academy.submitLesson(enrollment.id,{lessonId:'l1',score:90});
 await service.addTalentEvidence({kind:'PORTFOLIO',title:'Portfolio PV',evidenceRef:'doc://portfolio-pv'});
 const client=await business.createClient({name:'Client réel',type:'PERSON',consentToContact:true});
 const order=await business.createOrder({clientId:client.id,title:'PV séance',amount:5000});await business.setOrderState(order.id,'CONFIRMED');await business.setOrderState(order.id,'IN_PROGRESS');await business.setOrderState(order.id,'DELIVERED');
 await service.addTalentEvidence({kind:'COMPLETED_ORDER',title:'Commande livrée',evidenceRef:'order-proof',businessOrderId:order.id});
 let profile=await service.talentProfile();assert.equal(profile.learn.complete,true);assert.equal(profile.prove.complete,true);assert.equal(profile.work.complete,true);assert.equal(profile.earn.complete,false);assert.equal(profile.guardrails.incomePromise,false);
 await business.recordRevenue({label:'Service PV payé',amount:5000,source:'SERVICE',reference:order.id});
 profile=await service.talentProfile();assert.equal(profile.earn.complete,true);assert.equal(profile.earn.confirmedBusinessReceipts.length,1);
});

test('Creator Talent UI states canonical cycles and no income promise',()=>{
 const ui=fs.readFileSync('apps/web/src/creator-talent-ui.js','utf8');
 assert.match(ui,/Learn → Prove → Work → Earn/);assert.match(ui,/contenu → intérêt → conversation → action → transaction/);
 assert.match(ui,/ne promet jamais de revenu/);assert.match(ui,/Business Studio canonique/);assert.match(ui,/createCreatorContent/);assert.match(ui,/creatorInterestToBusiness/);
});
