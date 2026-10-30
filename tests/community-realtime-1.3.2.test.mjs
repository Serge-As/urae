import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {CommunityRealtimeStore} from '../.build/packages/community-realtime/src/index.js';

test('Forum v2 keeps draft and read anchor across server-backed sessions',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const store=new CommunityRealtimeStore(db);
    const a=await store.createMessage({tenantId:'t',groupId:'g',hubId:'h',authorId:'u1',body:'Premier message'});
    const b=await store.createMessage({tenantId:'t',groupId:'g',hubId:'h',authorId:'u2',body:'Deuxième message',parentId:a.id});
    await store.saveDraft({tenantId:'t',groupId:'g',hubId:'h',userId:'u1',title:'Brouillon',body:'Texte non envoyé'});
    await store.markRead({tenantId:'t',groupId:'g',hubId:'h',userId:'u1',messageId:b.id,anchorRatio:.6});
    const state=await store.state('t','g','h','u1');
    assert.equal(state.draftBody,'Texte non envoyé');
    assert.equal(state.lastReadMessageId,b.id);
    assert.equal(state.anchorMessageId,b.id);
    assert.equal(state.anchorRatio,.6);
    const page=await store.listMessages({tenantId:'t',groupId:'g',hubId:'h',viewerId:'u1',around:b.id,limit:20});
    assert.ok(page.messages.some(x=>x.id===b.id));
    assert.equal(page.messages.find(x=>x.id===b.id).rootId,a.id);
  }finally{db.close();}
});

test('Forum v2 reactions are per-user toggles and message pagination stays bounded',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const store=new CommunityRealtimeStore(db);
    const m=await store.createMessage({tenantId:'t',groupId:'g',hubId:'h',authorId:'u1',body:'Réagissez'});
    assert.deepEqual(await store.toggleReaction({messageId:m.id,userId:'u2',reaction:'👍'}),{active:true});
    let page=await store.listMessages({tenantId:'t',groupId:'g',hubId:'h',viewerId:'u2',limit:5000});
    assert.equal(page.messages[0].reactions['👍'],1);
    assert.deepEqual(page.messages[0].viewerReactions,['👍']);
    assert.deepEqual(await store.toggleReaction({messageId:m.id,userId:'u2',reaction:'👍'}),{active:false});
    page=await store.listMessages({tenantId:'t',groupId:'g',hubId:'h',viewerId:'u2',limit:5000});
    assert.equal(page.messages[0].reactions['👍'],undefined);
  }finally{db.close();}
});

test('draft content comparison preserves concurrent read markers, rejects stale windows and isolates authors',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const store=new CommunityRealtimeStore(db),scope={tenantId:'t',groupId:'g',hubId:'h',userId:'u1'};
    await store.saveDraft({...scope,title:'Projet',body:'Version A',expectedTitle:'',expectedBody:''});
    await store.markRead({...scope,messageId:'m-read',anchorRatio:.75});
    const saved=await store.saveDraft({...scope,title:'Projet',body:'Version B',expectedTitle:'Projet',expectedBody:'Version A'});
    assert.equal(saved.anchorMessageId,'m-read');assert.equal(saved.anchorRatio,.75);
    await assert.rejects(store.saveDraft({...scope,title:'Ancienne fenêtre',body:'Écrasement',expectedTitle:'Projet',expectedBody:'Version A'}),/FORUM_DRAFT_CHANGED/);
    assert.equal((await store.state('t','g','h','u1')).draftBody,'Version B');
    assert.equal((await store.state('t','g','h','u2')).draftBody,'');
    // An uncertain response can safely repeat the exact accepted content.
    const retry=await store.saveDraft({...scope,title:'Projet',body:'Version B',expectedTitle:'Projet',expectedBody:'Version A'});
    assert.equal(retry.draftBody,'Version B');
    await store.markRead({...scope,messageId:'m-later'});
    assert.equal((await store.state('t','g','h','u1')).draftBody,'Version B');
  }finally{db.close();}
});
