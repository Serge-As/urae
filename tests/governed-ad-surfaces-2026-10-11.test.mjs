import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {AdManagerService} from '../.build/packages/ad-manager/src/index.js';
import {VisualMediaService} from '../.build/packages/visual-media/src/index.js';

function ctx(kernel,actor){kernel.context.set({tenantId:'test',actorId:actor,activeGroupId:'g',groupRoles:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'q'});}
async function setup(){
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel,'owner');
 await repo.saveGroup({id:'g',tenantId:'test',name:'Tontine',kind:'association',governanceModel:'founder_managed',status:'active',createdBy:'owner',createdAt:'2026-10-01T00:00:00Z'});
 await repo.saveMembership({id:'m',tenantId:'test',groupId:'g',userId:'viewer',roles:[],status:'active'});
 const ads=new AdManagerService(repo,kernel);
 return{repo,kernel,ads};
}
const request=()=>({name:'Atelier local',objective:'AWARENESS',budgetSandbox:0,currency:'XAF',
 placements:['FORUM_NATIVE'],frequencyCapPer7Days:3,targeting:{localities:[]},
 creative:{headline:'Réservez votre atelier',body:'Participez ce samedi',callToAction:'Voir l’offre',destinationRef:'service:atelier-1'}});
test('group member only receives approved ACTIVE campaign creative without targeting or budgets',async()=>{
 const {repo,kernel,ads}=await setup();
 const c=await ads.create('g',request());
 ctx(kernel,'viewer');
 const draft=await ads.placement('g','FORUM_NATIVE');
 assert.equal(draft.kind,'HOUSE');
 ctx(kernel,'owner');
 await ads.transition('g',c.id,'PENDING_REVIEW');
 await ads.transition('g',c.id,'APPROVED');
 await ads.transition('g',c.id,'ACTIVE');
 ctx(kernel,'viewer');
 const shown=await ads.placement('g','FORUM_NATIVE');
 assert.equal(shown.kind,'SPONSORED_SANDBOX');assert.equal(shown.headline,request().creative.headline);
 assert.equal(Object.hasOwn(shown,'targeting'),false);
 assert.equal(Object.hasOwn(shown,'budgetSandbox'),false);
 assert.equal(Object.hasOwn(shown,'createdBy'),false);
 await assert.rejects(()=>ads.list('g'),/FORBIDDEN_SCOPE/);
 await assert.rejects(()=>ads.placement('g','RECEIPT_FOOTER'),/AD_PLACEMENT_NOT_PUBLIC/);
});
test('ad surface unavailable to outsiders even when campaign is active',async()=>{
 const {kernel,ads}=await setup();
 ctx(kernel,'outsider');await assert.rejects(()=>ads.placement('g','FORUM_NATIVE'),/FORBIDDEN_SCOPE/);
});
test('sponsored image stays private until approved and becomes visible to eligible group members only',async()=>{
 const {repo,kernel,ads}=await setup();
 const mediaId='visual_media_private';
 await repo.saveWorkspaceRecord({id:mediaId,tenantId:'test',groupId:'g',moduleId:'MEDIA.VISUAL_ASSET',title:'Image',status:'ACTIVE',
  tags:['private'],data:{purpose:'AD_CREATIVE',artifactKey:'imports/test/g/picture',contentType:'image/png'},createdBy:'owner',createdAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-11T00:00:00Z'});
 const c=await ads.create('g',{...request(),creative:{...request().creative,mediaAssetId:mediaId}});
 const media=new VisualMediaService(repo,kernel,{put:async()=>{},get:async()=>null});
 ctx(kernel,'viewer');await assert.rejects(()=>media.record('g',mediaId),/FORBIDDEN_MEDIA_ACCESS/);
 ctx(kernel,'owner');
 await ads.transition('g',c.id,'PENDING_REVIEW');await ads.transition('g',c.id,'APPROVED');await ads.transition('g',c.id,'ACTIVE');
 ctx(kernel,'viewer');assert.equal((await media.record('g',mediaId)).id,mediaId);
});
