import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';

test('recent typing is visible immediately without Durable storage write',async()=>{
  globalThis.WebSocket={OPEN:1};
  const puts=[],state={storage:{async get(){return 0;},async put(k,v){puts.push([k,v]);},async list(){return new Map();}},getWebSockets(){return[];}};
  const hub=new GroupLiveHub(state,{});
  await hub.fetch(new Request('https://group-live.internal/signal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'TYPING',actorId:'manager-b',payload:{kind:'FINANCIAL_CELL',meetingId:'m1',membershipId:'mb',rubricId:'r'}})}));
  const res=await hub.fetch(new Request('https://group-live.internal/signals?afterAt=0&actorId=manager-a')),data=await res.json();
  assert.equal(puts.length,0);
  assert.equal(data.ephemeral,true);
  assert.equal(data.signals.length,1);
  assert.equal(data.signals[0].type,'TYPING');
  assert.equal(data.signals[0].payload.amount,undefined);
});

test('client has no recurring REST fallback; reconnect resumes through websocket sequence',()=>{
  const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  assert.match(live,/workMode!=='REUNION'/);
  assert.match(live,/SYNC_PROBE/);
  assert.doesNotMatch(live,/setInterval\([^\n]*liveEvents/);
  assert.doesNotMatch(live,/startCatchupTimer/);
  assert.match(live,/liveWebSocketUrl\(lastSeq,String\(ticketData\?\.ticket\?\?''\)\)/);
  assert.match(live,/CLIENT_SIGNAL/);
  assert.doesNotMatch(live,/app\.publishLiveSignal\?\./);
  assert.match(live,/WebSocket-only/);
  assert.match(app,/liveWebSocketUrl\(after=0,ticket=''\)/);
});
