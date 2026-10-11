import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {AdManagerService} from '../.build/packages/ad-manager/src/index.js';
import {PartnerAdProposalService} from '../.build/packages/ad-manager/src/partner-proposals.js';

const scope=(kernel,actor)=>kernel.context.set({tenantId:'tenant',actorId:actor,activeGroupId:'g',groupRoles:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
const input=()=>({title:'Service de quartier',headline:'Couture locale',body:'Atelier avec rendez-vous à Douala',callToAction:'Voir le service',destinationRef:'service:seamstress-1',objective:'AWARENESS',locality:'Douala'});
async function setup(){
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
 scope(kernel,'owner');
 await repo.saveGroup({id:'g',tenantId:'tenant',name:'Groupe',kind:'association',governanceModel:'founder_managed',status:'active',createdBy:'owner',createdAt:'2026-10-10T00:00:00Z'});
 await repo.saveGroup({id:'g2',tenantId:'tenant',name:'Groupe 2',kind:'association',governanceModel:'founder_managed',status:'active',createdBy:'owner',createdAt:'2026-10-10T00:00:00Z'});
 for(const [id,userId,roles] of [['ma','member',[]],['ma2','other',[]],['mgr','manager',['manager']]])
  await repo.saveMembership({id,tenantId:'tenant',groupId:'g',userId,roles,status:'active'});
 return{repo,kernel,service:new PartnerAdProposalService(repo,kernel,new AdManagerService(repo,kernel))};
}
test('member can submit but never approve own ad or mutate manager approval',async()=>{
 const {service,kernel}=await setup();scope(kernel,'member');
 const result=await service.create('g',input());
 assert.equal(result.data.proposalState,'SUBMITTED');
 assert.equal((await service.list('g')).length,1);
 await assert.rejects(()=>service.review('g',result.id,'IMPORT'),/FORBIDDEN_SCOPE/);
 scope(kernel,'other');
 assert.deepEqual(await service.list('g'),[]);
 scope(kernel,'owner');
 assert.equal((await service.list('g')).length,1);
});
test('separate manager imports partner proposal only into canonical sandbox DRAFT',async()=>{
 const {service,kernel,repo}=await setup();scope(kernel,'member');
 const proposal=await service.create('g',input());scope(kernel,'manager');
 const reviewed=await service.review('g',proposal.id,'IMPORT');
 assert.equal(reviewed.data.proposalState,'IMPORTED');
 const campaigns=await new AdManagerService(repo,kernel).list('g');
 assert.equal(campaigns.length,1);
 assert.equal(campaigns[0].state,'DRAFT');
 assert.equal(campaigns[0].budgetSandbox,0);
 assert.equal(campaigns[0].creative.headline,'Couture locale');
 assert.equal((await service.review('g',proposal.id,'IMPORT')).data.campaignId,campaigns[0].id);
 assert.equal((await new AdManagerService(repo,kernel).list('g')).length,1);
});
test('submitted manager proposal may not be self-reviewed; tenant and group remain scoped',async()=>{
 const {service,kernel}=await setup();scope(kernel,'owner');
 const proposal=await service.create('g',input());
 await assert.rejects(()=>service.review('g',proposal.id,'IMPORT'),/PARTNER_AD_SELF_REVIEW_FORBIDDEN/);
 await assert.rejects(()=>service.review('g2',proposal.id,'REJECT','wrong group'),/PARTNER_AD_NOT_FOUND/);
});
test('only authors may reference their actual private partner image',async()=>{
 const {service,kernel,repo}=await setup();
 scope(kernel,'member');
 await repo.saveWorkspaceRecord({id:'visual_media_member',tenantId:'tenant',groupId:'g',moduleId:'MEDIA.VISUAL_ASSET',title:'Photo',status:'ACTIVE',tags:['media'],data:{purpose:'PARTNER_CREATIVE'},createdBy:'member',createdAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-11T00:00:00Z'});
 await repo.saveWorkspaceRecord({id:'visual_media_other',tenantId:'tenant',groupId:'g',moduleId:'MEDIA.VISUAL_ASSET',title:'Photo',status:'ACTIVE',tags:['media'],data:{purpose:'PARTNER_CREATIVE'},createdBy:'other',createdAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-11T00:00:00Z'});
 await assert.rejects(()=>service.create('g',{...input(),mediaAssetId:'visual_media_other'}),/PARTNER_AD_MEDIA_OWNER_MISMATCH/);
 const proposal=await service.create('g',{...input(),mediaAssetId:'visual_media_member'});
 scope(kernel,'manager');
 const reviewed=await service.review('g',proposal.id,'IMPORT');
 assert.ok(reviewed.data.campaignId);
});
test('invalid external destination rejected and review reason required',async()=>{
 const {service,kernel}=await setup();scope(kernel,'member');
 await assert.rejects(()=>service.create('g',{...input(),destinationRef:'https://external.example'}),/INVALID_PARTNER_AD_PROPOSAL/);
 const proposal=await service.create('g',input());scope(kernel,'manager');
 await assert.rejects(()=>service.review('g',proposal.id,'REJECT',''),/REVIEW_REASON_REQUIRED/);
 const rejected=await service.review('g',proposal.id,'REJECT','Offre sans justificatif');
 assert.equal(rejected.data.proposalState,'REJECTED');
 await assert.rejects(()=>service.review('g',proposal.id,'IMPORT'),/INVALID_PARTNER_AD_TRANSITION/);
});
