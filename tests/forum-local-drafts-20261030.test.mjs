import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

test('offline forum revisions survive reload, replay in order and remain scoped to their author',async()=>{
  const oldIndexed=globalThis.indexedDB,oldFetch=globalThis.fetch;
  const records=new Map(),durable=new Map();
  try{
    globalThis.indexedDB={};globalThis.fetch=async()=>{throw Error('OFFLINE');};
    const create=actor=>{const app=new ConnectedApplication({actorId:actor,tenantId:'t'});app.activeGroupId='g';app.readSnapshots.get=async id=>records.get(id);app.readSnapshots.save=async row=>{const value={...structuredClone(row),updatedAt:new Date().toISOString()};records.set(row.id,value);return value;};app.outboxStorage.save=async rows=>{for(const row of rows)durable.set(row.id,structuredClone(row));};return app;};
    const app=create('u1');
    await app.saveForumDraft('h','Projet','Version A');
    await app.saveForumDraft('h','Projet','Version B');
    const pending=app.outbox.list();assert.equal(pending.length,2);assert.equal(pending[1].payload.baselineBody,'Version A');
    assert.equal((await app.forumUserState('h')).draftBody,'Version B');
    const restored=create('u1');restored.outbox.restore([...durable.values()]);
    assert.equal((await restored.forumUserState('h')).draftBody,'Version B');
    await assert.rejects(create('u2').forumUserState('h'),/NETWORK_UNAVAILABLE/);
    let server={draftTitle:'',draftBody:''};const applied=[];
    globalThis.fetch=async(_url,init)=>{const item=JSON.parse(init.body),p=item.payload;assert.equal(p.baselineBody,server.draftBody);server={draftTitle:p.title,draftBody:p.body,updatedAt:new Date().toISOString()};applied.push(p.body);return Response.json({accepted:true,stored:true,state:server});};
    await restored.syncOutbox();assert.deepEqual(applied,['Version A','Version B']);
    assert.equal(restored.outbox.list().every(x=>x.status==='CONFIRMED'),true);
    assert.equal((await restored.cached('/api/v1/groups/g/forum-v2/hubs/h/draft-local')).localPending,false);
  }finally{globalThis.fetch=oldFetch;if(oldIndexed===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexed;}
});
