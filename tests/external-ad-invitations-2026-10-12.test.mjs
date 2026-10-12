import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {AdManagerService} from '../.build/packages/ad-manager/src/index.js';
import {PartnerAdProposalService} from '../.build/packages/ad-manager/src/partner-proposals.js';
import {ExternalAdInviteService} from '../.build/packages/ad-manager/src/external-invitations.js';
const PNG=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8FbhQAAAAASUVORK5CYII=','base64'));
const scope=(k,actor,tenant='tenant')=>k.context.set({tenantId:tenant,actorId:actor,activeGroupId:'g',groupRoles:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
async function setup(){
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),stored=new Map();
 const artifact={async put(k,v){stored.set(k,new Uint8Array(v))},async get(k){const bytes=stored.get(k);return bytes?{arrayBuffer:async()=>bytes.buffer}:null}};
 scope(kernel,'founder');
 for(const [id,createdBy] of [['g','founder'],['g2','founder']])
  await repo.saveGroup({id,tenantId:'tenant',name:id,kind:'association',governanceModel:'founder_managed',status:'active',createdBy,createdAt:'2026-10-12T00:00:00Z'});
 await repo.saveMembership({id:'mgr',tenantId:'tenant',groupId:'g',userId:'manager',roles:['manager'],status:'active'});
 const external=new ExternalAdInviteService(repo,kernel,artifact);
 return{repo,kernel,external,stored};
}
const proposal=()=>({title:'Atelier local',headline:'Réparer vos vêtements',body:'Atelier de proximité',callToAction:'En savoir plus',destinationRef:'service:atelier-1',objective:'AWARENESS'});
test('external invite is issued only by manager, secret never listed and unauthorized group does not accept it',async()=>{
 const {kernel,external}=await setup();
 scope(kernel,'stranger');await assert.rejects(()=>external.issue('g','Annonceur'),/FORBIDDEN_SCOPE/);
 scope(kernel,'manager');
 const invite=await external.issue('g','Annonceur',48);
 assert.ok(invite.token.length>70);
 const list=await external.list('g');assert.equal(list.length,1);
 assert.ok(!JSON.stringify(list).includes(invite.token));assert.ok(!JSON.stringify(list).includes('tokenHash'));
 scope(kernel,'external');await assert.rejects(()=>external.status('g2',invite.token),/AD_INVITE_INVALID/);
 await assert.rejects(()=>external.status('g',invite.token.slice(0,-3)+'zzz'),/AD_INVITE_INVALID/);
 assert.equal((await external.status('g',invite.token)).valid,true);
});
test('invited advertiser can upload image, submit exactly one proposal and never activate or charge it',async()=>{
 const {kernel,external,repo}=await setup();
 const {token}=await external.issue('g','Partenaire');
 scope(kernel,'external');
 const image=await external.upload('g',token,new File([PNG],'ad.png',{type:'image/png'}));
 assert.match(image.id,/^visual_media_/);
 const submitted=await external.submit('g',token,proposal());
 assert.equal(submitted.state,'SUBMITTED');
 assert.equal((await external.submit('g',token,proposal())).id,submitted.id);
 await assert.rejects(()=>external.upload('g',token,new File([PNG],'ad.png',{type:'image/png'})),/AD_INVITE_ALREADY_USED/);
 const row=await repo.getWorkspaceRecord('tenant',submitted.id);
 assert.equal(row?.data.mediaAssetId,image.id);assert.equal(row?.status,'ACTIVE');
 scope(kernel,'manager');
 const service=new PartnerAdProposalService(repo,kernel,new AdManagerService(repo,kernel));
 const reviewed=await service.review('g',submitted.id,'IMPORT');
 assert.equal(reviewed.data.proposalState,'IMPORTED');
 const campaigns=await new AdManagerService(repo,kernel).list('g');
 assert.equal(campaigns.length,1);assert.equal(campaigns[0].state,'DRAFT');
 assert.equal(campaigns[0].budgetSandbox,0);
 assert.equal(campaigns[0].creative.mediaAssetId,image.id);
});
test('external link refuses expired invitation, unsupported contents and unsafe destination',async()=>{
 const {kernel,external,repo}=await setup();
 const invite=await external.issue('g','Annonceur');
 scope(kernel,'outsider');
 await assert.rejects(()=>external.upload('g',invite.token,new File(['<svg/>'],'ad.svg',{type:'image/svg+xml'})),/MEDIA_UNSUPPORTED_FORMAT/);
 await assert.rejects(()=>external.submit('g',invite.token,{...proposal(),destinationRef:'https://untrusted.example'}),/INVALID_PARTNER_AD_PROPOSAL/);
 const stored=await repo.getWorkspaceRecord('tenant',invite.inviteId);
 await repo.saveWorkspaceRecord({...stored,data:{...stored.data,expiresAt:'2020-01-01T00:00:00Z'}});
 await assert.rejects(()=>external.status('g',invite.token),/AD_INVITE_EXPIRED/);
});
