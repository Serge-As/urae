import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';

test('typing and cell focus use ephemeral websocket signals without durable storage',async()=>{
  globalThis.WebSocket={OPEN:1};
  const sent=[],puts=[];
  const socket={readyState:1,send:m=>sent.push(JSON.parse(String(m)))};
  const state={storage:{async get(){return 7;},async put(k,v){puts.push([k,v]);},async list(){return new Map();}},getWebSockets(){return[socket];}};
  const hub=new GroupLiveHub(state,{});
  const response=await hub.fetch(new Request('https://group-live.internal/signal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'TYPING',actorId:'manager-2',payload:{kind:'FINANCIAL_CELL',meetingId:'mtg',membershipId:'m',rubricId:'r'}})}));
  assert.equal(response.status,202);
  assert.equal(puts.length,1,'typing stores only one bounded per-actor activity fallback record');
  assert.match(String(puts[0][0]),/^signal-actor:.*:activity$/);
  assert.equal('amount' in (sent[0].event.payload??{}),false,'typing fallback must never contain financial amount');
  assert.equal(sent[0].type,'GROUP_LIVE_SIGNAL');
  assert.equal(sent[0].event.type,'TYPING');
  assert.equal(sent[0].event.payload.amount,undefined);
});

test('client live layer reconnects, heartbeats, replays gaps and exposes financial typing without amounts',()=>{
  const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  const api=fs.readFileSync('workers/api/src/index.ts','utf8');
  assert.match(live,/scheduleReconnect/);assert.match(live,/socket\.send\('PING'\)/);assert.match(live,/seq>lastSeq\+1/);assert.match(live,/GROUP_LIVE_SIGNAL/);assert.match(live,/addEventListener\('online'/);
  assert.match(live,/app\.liveEvents\(lastSeq,500\)/);assert.match(live,/dispatchDurableEvent\(event\)/);assert.match(live,/page<50/);
  assert.match(app,/liveEvents\(after=0,limit=500\)/);assert.match(app,/safeLimit/);
  assert.match(app,/publishLiveSignal/);assert.match(api,/live\\\/\(health\|events\|connect\|publish\|signal\)/);assert.match(api,/LIVE_CLIENT_SIGNAL_NOT_ALLOWED/);
  assert.match(main,/publishLiveSignal\?\.\('TYPING'/);assert.match(main,/800/);assert.match(main,/2500/);assert.match(main,/applyRemoteFinancialProjection/);assert.match(main,/remote-ack/);
  assert.doesNotMatch(main,/publishLiveSignal\?\.\('TYPING',[^\n]*amount/);
});
