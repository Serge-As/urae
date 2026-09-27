import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {DiscoveryService} from '../.build/packages/discovery/src/index.js';

const ctx=(actorId,tenantId='t',groupRoles=[])=>({actorId,tenantId,activeGroupId:tenantId==='t'?'g':undefined,groupRoles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r-'+actorId});
test('candidate search is opt-in opaque limited and cannot enumerate without criteria',async()=>{
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),service=new DiscoveryService(repo,kernel);
 await repo.saveUser({id:'manager',displayName:'Manager',locale:'fr',createdAt:new Date().toISOString()});
 await repo.saveUser({id:'candidate',displayName:'Candidate',locale:'fr',createdAt:new Date().toISOString()});
 await repo.saveGroup({id:'g',tenantId:'t',name:'Groupe',kind:'association',governanceModel:'community',status:'active',createdBy:'manager',createdAt:new Date().toISOString()});
 await repo.saveMembership({id:'m_mgr',tenantId:'t',groupId:'g',userId:'manager',roles:['manager'],status:'active',joinedAt:new Date().toISOString()});
 kernel.context.set(ctx('candidate','candidate_t'));await service.saveCandidateProfile({displayAlias:'Mara',locality:'Yaoundé',skills:['couture'],interests:['entraide'],desiredGroupTags:['commerce'],bio:'Couturière',optIn:true});
 kernel.context.set(ctx('manager','t',['manager']));
 await assert.rejects(()=>service.searchCandidates('t','g',{}),/DISCOVERY_QUERY_REQUIRED/);
 const found=await service.searchCandidates('t','g',{locality:'Yaoundé',tags:['couture']});assert.equal(found.length,1);assert.equal(found[0].candidate.displayAlias,'Mara');
 assert.equal('ownerActorId' in found[0].candidate,false);assert.equal('phone' in found[0].candidate,false);assert.equal('cni' in found[0].candidate,false);
});

test('candidate can opt out and recruitment campaign is manager-governed',async()=>{
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),service=new DiscoveryService(repo,kernel);
 await repo.saveUser({id:'manager',displayName:'Manager',locale:'fr',createdAt:new Date().toISOString()});await repo.saveUser({id:'candidate',displayName:'Candidate',locale:'fr',createdAt:new Date().toISOString()});
 await repo.saveGroup({id:'g',tenantId:'t',name:'Groupe',kind:'association',governanceModel:'community',status:'active',createdBy:'manager',createdAt:new Date().toISOString()});
 kernel.context.set(ctx('candidate','candidate_t'));await service.saveCandidateProfile({displayAlias:'Mara',locality:'Douala',optIn:true});assert.ok(await service.candidateProfile());await service.saveCandidateProfile({displayAlias:'Mara',locality:'Douala',optIn:false});assert.equal(await service.candidateProfile(),undefined);
 kernel.context.set(ctx('manager','t',['manager']));const c=await service.createRecruitmentCampaign('t','g',{title:'Nouveaux membres',locality:'Douala',tags:['entraide']});assert.equal(c.data.candidateContactPolicy,'OPT_IN_ONLY');const closed=await service.setRecruitmentCampaignState('t','g',c.id,'CLOSED');assert.equal(closed.status,'DONE');
});
