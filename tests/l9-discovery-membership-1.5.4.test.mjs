import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {DiscoveryService,MembershipGatewayService} from '../.build/packages/discovery/src/index.js';

const tenant='tenant_l9',groupId='group_l9',manager='manager_l9',candidate='candidate_l9';
const setCtx=(kernel,actor,roles=[],tenantId=tenant)=>kernel.context.set({actorId:actor,tenantId,activeGroupId:groupId,groupRoles:roles,mandateIds:[],deviceId:'l9-device',sessionId:'l9-'+actor,locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'l9-'+actor});

async function seed(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  await repo.saveUser({id:manager,displayName:'Manager L9',locale:'fr',createdAt:'2026-09-25T00:00:00Z'});
  await repo.saveUser({id:candidate,displayName:'Candidate L9',locale:'fr',createdAt:'2026-09-25T00:00:00Z'});
  await repo.saveGroup({id:groupId,tenantId:tenant,name:'Groupe L9',kind:'association',governanceModel:'community',status:'active',createdBy:manager,createdAt:'2026-09-25T00:00:00Z'});
  await repo.saveMembership({id:'m_manager_l9',tenantId:tenant,groupId,userId:manager,roles:['founder','manager'],status:'active',joinedAt:'2026-09-25T00:00:00Z'});
  setCtx(kernel,manager,['founder','manager']);
  return{repo,kernel,discovery:new DiscoveryService(repo,kernel),gateway:new MembershipGatewayService(repo,kernel)};
}

test('L9 keeps SECRET groups out of Discovery and public listings sparse',async()=>{
  const {discovery}=await seed();
  await assert.rejects(()=>discovery.publishGroupListing({tenantId:tenant,groupId,visibility:'SECRET',discoverable:false,joinPolicy:'INVITE_ONLY',recruiting:false,missionTags:[],activityTags:[]}),/SECRET_GROUP_NOT_DISCOVERABLE/);
  const publicListing=await discovery.publishGroupListing({tenantId:tenant,groupId,visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true,locality:'Yaoundé',missionTags:['entraide'],activityTags:['tontine']});
  assert.equal(publicListing.discoverable,true);
  const found=await discovery.search({text:'Groupe L9',locality:'Yaoundé'});
  assert.equal(found.length,1);
  assert.equal('members' in found[0].listing,false);
  assert.equal('balances' in found[0].listing,false);
});

test('L9 manager issues an opaque single-use invitation and candidate joins without contact-book access',async()=>{
  const {repo,kernel,gateway}=await seed();
  const invitation=await gateway.createInvitation({targetTenantId:tenant,groupId,note:'Invitation volontaire'});
  assert.ok(invitation.token.length>=32);
  const stored=(await repo.listWorkspaceRecords(tenant,'DISCOVERY.MEMBERSHIP',groupId))[0];
  assert.equal(stored.data.kind,'MEMBERSHIP_INVITATION');
  assert.notEqual(stored.data.tokenHash,invitation.token);
  assert.equal(JSON.stringify(stored).includes(invitation.token),false);
  setCtx(kernel,candidate,[],'tenant_candidate');
  const accepted=await gateway.acceptInvitation({targetTenantId:tenant,groupId,token:invitation.token});
  const member=await repo.getMembership(tenant,groupId,accepted.membershipId);
  assert.equal(member.userId,candidate);assert.deepEqual(member.roles,['member']);
  await assert.rejects(()=>gateway.acceptInvitation({targetTenantId:tenant,groupId,token:invitation.token}),/INVITATION_ALREADY_USED/);
});
