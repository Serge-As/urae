import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {GroupReconstitutionService} from '../.build/packages/group-reconstitution/src/index.js';

const tenantId='tenant-reconstitution',sourceGroupId='group-old',trashId='trash-group-old';
const at='2026-09-23T00:00:00.000Z';
const group={id:sourceGroupId,tenantId,name:'Groupe Ancien',kind:'association',governanceModel:'community',status:'archived',createdBy:'u1',createdAt:at};
const setActor=(kernel,actorId)=>kernel.context.set({actorId,tenantId,activeGroupId:sourceGroupId,groupRoles:['member'],mandateIds:[],deviceId:'test',sessionId:'test',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-'+actorId});

const seed=async(n=80)=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();setActor(kernel,'u1');
  await repo.saveGroup(group);
  const users=Array.from({length:n},(_,i)=>'u'+(i+1));
  for(let i=0;i<n;i++){
    await repo.saveUser({id:users[i],displayName:'Membre '+(i+1),locale:'fr',createdAt:at});
    await repo.saveMembership({id:'m'+(i+1),tenantId,groupId:sourceGroupId,userId:users[i],roles:i===0?['founder','manager']:['member'],status:'active',joinedAt:at});
  }
  await repo.saveWorkspaceRecord({id:trashId,tenantId,groupId:sourceGroupId,moduleId:'TRASH.ITEM',title:'Groupe Ancien',summary:'Restaurable',status:'ACTIVE',tags:['trash','group'],data:{kind:'GROUP',entityId:sourceGroupId,deletedAt:at,restoreUntil:'2027-03-23T00:00:00.000Z',snapshotJson:JSON.stringify(group),deletedBy:'u1',eligibleUserIdsJson:JSON.stringify(users),eligibleMembershipIdsJson:JSON.stringify(users.map((_,i)=>'m'+(i+1))),petitionThreshold:Math.ceil(2*n/3),petitionState:'OPEN',lifecycleState:'TRASHED'},createdBy:'u1',createdAt:at,updatedAt:at});
  return{repo,kernel,users,service:new GroupReconstitutionService(repo,kernel)};
};

test('80-member frozen electorate requires exactly 54 active signatures',async()=>{
  const {kernel,users,service}=await seed(80);
  for(const actor of users.slice(0,53)){setActor(kernel,actor);await service.sign(trashId);}
  setActor(kernel,users[0]);let state=await service.status(trashId);
  assert.equal(state.threshold,54);assert.equal(state.signatureCount,53);assert.equal(state.reached,false);
  setActor(kernel,users[53]);state=await service.sign(trashId);
  assert.equal(state.signatureCount,54);assert.equal(state.reached,true);
});

test('withdrawal removes a signature from the active 2/3 count and re-signing restores it',async()=>{
  const {kernel,users,service}=await seed(3);
  setActor(kernel,users[0]);await service.sign(trashId);
  setActor(kernel,users[1]);let state=await service.sign(trashId);
  assert.equal(state.threshold,2);assert.equal(state.reached,true);
  state=await service.withdraw(trashId);assert.equal(state.signatureCount,1);assert.equal(state.reached,false);
  state=await service.sign(trashId);assert.equal(state.signatureCount,2);assert.equal(state.reached,true);
});

test('successor receives signatories only and no old ledger entry is copied automatically',async()=>{
  const {repo,kernel,users,service}=await seed(3);
  await repo.saveLedgerEntry({id:'old-entry',tenantId,groupId:sourceGroupId,currency:'XAF',descriptionCode:'OLD',sourceType:'test',sourceId:'old',idempotencyKey:'old-entry',createdAt:at,createdBy:'u1',lines:[{accountId:'a',debit:1000,credit:0},{accountId:'b',debit:0,credit:1000}]});
  setActor(kernel,users[0]);await service.sign(trashId);
  setActor(kernel,users[1]);await service.sign(trashId);
  setActor(kernel,users[0]);const result=await service.createSuccessor(trashId,{purpose:'Continuer le groupe'});
  assert.equal(result.automaticFinancialTransfer,false);
  assert.equal((await repo.listMemberships(tenantId,result.group.id)).length,2);
  assert.equal((await repo.listMemberships(tenantId,result.group.id)).some(x=>x.userId===users[2]),false);
  assert.equal((await repo.listLedgerEntries(tenantId,result.group.id)).length,0);
  assert.equal(result.dossier.data.assetDebtDecisionState,'UNDECIDED_BY_SUCCESSOR');
  assert.equal(result.dossier.data.complaintAvailable,true);
});
