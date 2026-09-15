import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {GroupPairingService} from '../.build/packages/group-pairing/src/index.js';

const setCtx=(kernel,actor,tenant='tenant_owner')=>kernel.context.set({tenantId:tenant,actorId:actor,activeGroupId:'group_a',groupRoles:actor==='owner'?['founder','manager']:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r-'+actor});
const account=async(db,id,name,tenant)=>db.prepare("INSERT INTO auth_accounts(id,username,display_name,tenant_id,locale,created_at,salt,password_hash) VALUES(?,?,?,?,?,?,?,?)").bind(id,id,name,tenant,'fr','2026-09-15T00:00:00.000Z','salt-'+id,'hash-'+id).run();

test('new group secure link joins member without second manager action',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  try{
    await account(db,'owner','Responsable','tenant_owner');await account(db,'visitor','Nouveau membre','tenant_visitor');
    await repo.saveGroup({id:'group_a',tenantId:'tenant_owner',name:'Nouveau groupe',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-15T00:00:00.000Z',originMode:'NEW'});
    setCtx(kernel,'owner');const svc=new GroupPairingService(db,repo,kernel),invite=await svc.createInvite('group_a',{expiresHours:24,maxUses:10});assert.equal(invite.mode,'AUTO_JOIN');
    setCtx(kernel,'visitor','tenant_visitor');const joined=await svc.redeemInvite(invite.code);assert.equal(joined.status,'JOINED');
    const membership=await repo.getMembership('tenant_owner','group_a',joined.membershipId);assert.equal(membership.userId,'visitor');
  }finally{db.close();}
});

test('historical group preserves membership identity and only rebinds account after manager match',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  try{
    await account(db,'owner','Responsable','tenant_owner');await account(db,'visitor','Marie N.','tenant_visitor');
    await repo.saveGroup({id:'group_a',tenantId:'tenant_owner',name:'Ancienne association',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-15T00:00:00.000Z',originMode:'IMPORT_EXISTING',historicalCreatedAt:'2012-01-01T00:00:00.000Z'});
    await repo.saveUser({id:'legacy_marie',displayName:'Marie historique',locale:'fr',createdAt:'2012-01-01T00:00:00.000Z'});
    await repo.saveMembership({id:'membership_historical_marie',tenantId:'tenant_owner',groupId:'group_a',userId:'legacy_marie',roles:['member'],status:'active',joinedAt:'2012-01-01T00:00:00.000Z',historicalJoinedAt:'2012-01-01T00:00:00.000Z'});
    setCtx(kernel,'owner');const svc=new GroupPairingService(db,repo,kernel),invite=await svc.createInvite('group_a');assert.equal(invite.mode,'HISTORICAL_MATCH');
    setCtx(kernel,'visitor','tenant_visitor');const pending=await svc.redeemInvite(invite.code);assert.equal(pending.status,'PENDING_MANAGER_MATCH');
    assert.equal((await repo.getMembership('tenant_owner','group_a','membership_historical_marie')).userId,'legacy_marie');
    setCtx(kernel,'owner');const approved=await svc.decidePairing('group_a',pending.pairingRequestId,{decision:'APPROVE',membershipId:'membership_historical_marie'});
    assert.equal(approved.membership.id,'membership_historical_marie');assert.equal(approved.membership.userId,'visitor');
    assert.equal(approved.membership.historicalJoinedAt,'2012-01-01T00:00:00.000Z');
  }finally{db.close();}
});
