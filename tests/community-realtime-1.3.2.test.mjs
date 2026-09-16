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
