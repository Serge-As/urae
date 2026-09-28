import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173';

test.beforeEach(async({page})=>{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
    for(const name of ['eco-system-sovereign-v1','eco-system-read-snapshots','tontine-platform']){
      await new Promise(resolve=>{const r=indexedDB.deleteDatabase(name);r.onsuccess=r.onerror=r.onblocked=()=>resolve();});
    }
    localStorage.clear();
  });
});

test('L2 sovereign journal serializes 100 concurrent writes without loss',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {IndexedDbSovereignStore}=await import('/packages/offline-sovereign/src/index.js');
    const a=new IndexedDbSovereignStore(),b=new IndexedDbSovereignStore(),writes=[];
    for(let i=0;i<100;i++)writes.push((i%2?a:b).append({tenantId:'tenant-l2',groupId:'group-l2',actorId:'manager-l2',type:'L2_PROBE',payload:{i}}));
    const events=await Promise.all(writes),rows=await a.list('tenant-l2','group-l2'),verified=await a.verify('tenant-l2','group-l2');
    return{returned:events.length,rows:rows.length,sequences:rows.map(x=>x.sequence),payloads:rows.map(x=>x.payload.i),verified};
  });
  expect(result.returned).toBe(100);
  expect(result.rows).toBe(100);
  expect(new Set(result.sequences).size).toBe(100);
  expect(result.sequences).toEqual(Array.from({length:100},(_,i)=>i+1));
  expect(new Set(result.payloads).size).toBe(100);
  expect(result.verified).toEqual({ok:true,count:100});
});

test('L2 invalid Eco Vault is rejected before active snapshots, journal or outbox change',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {ConnectedApplication}=await import('/packages/application/src/index.js');
    const {createEcoVault,IndexedDbSovereignStore}=await import('/packages/offline-sovereign/src/index.js');
    const {IndexedDbReadSnapshotAdapter}=await import('/packages/offline/src/index.js');
    const app=new ConnectedApplication({actorId:'member-l2',tenantId:'tenant-l2',displayName:'Member L2'});
    const snapshots=new IndexedDbReadSnapshotAdapter(),sovereign=new IndexedDbSovereignStore();
    const groupsPath='/api/v1/groups',groupsId=JSON.stringify(['member-l2','tenant-l2','ACCOUNT',groupsPath]);
    await snapshots.save({id:groupsId,actorId:'member-l2',tenantId:'tenant-l2',path:groupsPath,body:[{id:'group-l2',tenantId:'tenant-l2',name:'Avant',kind:'association',governanceModel:'community',status:'active',createdBy:'manager-real',createdAt:'2026-09-28T00:00:00.000Z'}]});
    await sovereign.append({tenantId:'tenant-l2',groupId:'group-l2',actorId:'member-l2',type:'BEFORE',payload:{amount:1000},createdAt:'2026-09-28T10:00:00.000Z'});
    const beforeGroups=(await snapshots.get(groupsId)).body,beforeEvents=await sovereign.list('tenant-l2','group-l2');
    const badEvent={id:'bad',tenantId:'tenant-l2',groupId:'group-l2',actorId:'x',sequence:2,type:'BAD',payload:{},createdAt:'2026-09-28T11:00:00.000Z',previousHash:'WRONG',hash:'WRONG'};
    const vault=await createEcoVault('vault-pass-2026',{tenantId:'tenant-l2',groupId:'group-l2',exportedAt:'2026-09-28T12:00:00.000Z',appVersion:'test',state:{actorId:'member-l2',snapshots:[{id:groupsId,actorId:'member-l2',tenantId:'tenant-l2',path:groupsPath,body:[{...beforeGroups[0],name:'APRES_INVALIDE'}],updatedAt:'2026-09-28T12:00:00.000Z'}],outbox:[]}},[badEvent],[]);
    let error='';try{await app.restoreEcoVault('vault-pass-2026',vault);}catch(e){error=String(e?.message??e);}
    const afterGroups=(await snapshots.get(groupsId)).body,afterEvents=await sovereign.list('tenant-l2','group-l2');
    return{error,beforeGroups,afterGroups,beforeEvents,afterEvents};
  });
  expect(result.error).toMatch(/SOVEREIGN_JOURNAL_/);
  expect(result.afterGroups).toEqual(result.beforeGroups);
  expect(result.afterEvents).toEqual(result.beforeEvents);
});

test('L2 Relay pairing keeps member role and account-scoped groups across group switching',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {ConnectedApplication}=await import('/packages/application/src/index.js');
    const {createRelayPairingMaterial}=await import('/packages/relay/src/broadcast.js');
    const {IndexedDbReadSnapshotAdapter}=await import('/packages/offline/src/index.js');
    const app=new ConnectedApplication({actorId:'member-l2',tenantId:'tenant-l2',displayName:'Member L2'});
    const key=await createRelayPairingMaterial('membership-l2');
    await app.importRelayPairingMaterial({...key,groupId:'group-a',groupName:'Groupe A',displayName:'Membre L2',memberNumber:10,groupAuthorityId:'manager-a'});
    const key2=await createRelayPairingMaterial('membership-l2-b');
    await app.importRelayPairingMaterial({...key2,groupId:'group-b',groupName:'Groupe B',displayName:'Membre L2',memberNumber:10,groupAuthorityId:'manager-b'});
    app.selectGroup('group-a');app.selectGroup('group-b');app.selectGroup('group-a');
    const store=new IndexedDbReadSnapshotAdapter(),id=JSON.stringify(['member-l2','tenant-l2','ACCOUNT','/api/v1/groups']),groups=(await store.get(id))?.body??[];
    const membersId=JSON.stringify(['member-l2','tenant-l2','group-a','/api/v1/groups/group-a/members']),members=(await store.get(membersId))?.body??[];
    return{groups:groups.map(g=>({id:g.id,createdBy:g.createdBy})),member:members.find(m=>m.id==='membership-l2'),active:app.activeGroup()};
  });
  expect(result.groups).toEqual(expect.arrayContaining([{id:'group-a',createdBy:'manager-a'},{id:'group-b',createdBy:'manager-b'}]));
  expect(result.member.roles).toEqual(['member']);
  expect(result.groups.find(x=>x.id==='group-a').createdBy).not.toBe('member-l2');
  expect(result.active).toBe('group-a');
});
