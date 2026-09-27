import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {DiscoveryService} from '../.build/packages/discovery/src/index.js';

const set=(k,actorId,tenantId,activeGroupId)=>k.context.set({actorId,tenantId,activeGroupId,groupRoles:activeGroupId?['manager']:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
test('manager can express group interest without receiving candidate private identity and candidate controls response',async()=>{
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),service=new DiscoveryService(repo,kernel);
 await repo.saveUser({id:'manager',displayName:'Manager',locale:'fr',createdAt:new Date().toISOString()});await repo.saveUser({id:'candidate',displayName:'Candidate Private',locale:'fr',createdAt:new Date().toISOString()});
 await repo.saveGroup({id:'g',tenantId:'t',name:'Groupe Entraide',kind:'association',governanceModel:'community',status:'active',createdBy:'manager',createdAt:new Date().toISOString()});
 set(kernel,'candidate','candidate_t');const p=await service.saveCandidateProfile({displayAlias:'Mara public',locality:'Yaoundé',skills:['couture'],optIn:true});
 set(kernel,'manager','t','g');const invite=await service.inviteCandidate('t','g',p.id,{message:'Votre profil public correspond à notre campagne.'});assert.equal(invite.groupName,'Groupe Entraide');assert.equal('candidateOwnerActorId' in invite,false);
 set(kernel,'candidate','candidate_t');let inbox=await service.candidateInvitations();assert.equal(inbox.length,1);assert.equal(inbox[0].state,'PENDING');const response=await service.respondCandidateInvitation(inbox[0].id,'INTERESTED');assert.equal(response.state,'INTERESTED');
});
