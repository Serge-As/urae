import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';

const makeState=()=>{
  const sent=[],puts=[],attachments=new Map();
  const socket={readyState:1,send:m=>sent.push(JSON.parse(String(m))),serializeAttachment:v=>attachments.set('a',v),deserializeAttachment:()=>attachments.get('a')};
  const state={storage:{async get(){return 0;},async put(k,v){puts.push([k,v]);},async list(){return new Map();}},getWebSockets(){return[socket];},acceptWebSocket(ws){void ws;}};
  return{sent,puts,socket,state,attachments};
};

test('typing and focus broadcast without Durable storage writes',async()=>{
  globalThis.WebSocket={OPEN:1};
  const {sent,puts,state}=makeState(),hub=new GroupLiveHub(state,{});
  const response=await hub.fetch(new Request('https://group-live.internal/signal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'TYPING',actorId:'manager-2',payload:{kind:'FINANCIAL_CELL',meetingId:'mtg',membershipId:'m',rubricId:'r'}})}));
  assert.equal(response.status,202);
  assert.equal(puts.length,0,'typing must remain pure push');
  assert.equal(sent[0].type,'GROUP_LIVE_SIGNAL');
  assert.equal(sent[0].event.type,'TYPING');
  assert.equal(sent[0].event.payload.amount,undefined);
});

test('draft state is the only ephemeral financial presence persisted',async()=>{
  globalThis.WebSocket={OPEN:1};
  const {puts,state}=makeState(),hub=new GroupLiveHub(state,{});
  await hub.fetch(new Request('https://group-live.internal/signal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'FINANCIAL_DRAFT',actorId:'manager-2',payload:{kind:'FINANCIAL_CELL',meetingId:'mtg',membershipId:'m',rubricId:'r'}})}));
  assert.equal(puts.length,1);
  assert.match(String(puts[0][0]),/^signal-actor:.*:draft:FINANCIAL_CELL:mtg:m:r$/);
  assert.equal('amount' in (puts[0][1].payload??{}),false);
});


test('direct websocket CLIENT_SIGNAL reaches peer without storage or HTTP fallback',async()=>{
  globalThis.WebSocket={OPEN:1};
  const puts=[],received=[];
  const peer={readyState:1,send:m=>received.push(JSON.parse(String(m)))};
  const sender={readyState:1,send(){},deserializeAttachment:()=>({userId:'manager-direct'})};
  const state={storage:{async get(){return 0;},async put(k,v){puts.push([k,v]);},async list(){return new Map();}},getWebSockets(){return[peer];}};
  const hub=new GroupLiveHub(state,{});
  await hub.webSocketMessage(sender,JSON.stringify({type:'CLIENT_SIGNAL',eventType:'TYPING',payload:{kind:'FINANCIAL_CELL',meetingId:'m1',membershipId:'member-1',rubricId:'r1'}}));
  assert.equal(puts.length,0);
  assert.equal(received.length,1);
  assert.equal(received[0].type,'GROUP_LIVE_SIGNAL');
  assert.equal(received[0].event.actorId,'manager-direct');
  assert.equal(received[0].event.type,'TYPING');
  assert.equal(received[0].event.payload.amount,undefined);
});

test('client live layer is websocket-first with reconnect replay and no heartbeat polling',()=>{
  const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  const api=fs.readFileSync('workers/api/src/index.ts','utf8');
  assert.match(live,/scheduleReconnect/);
  assert.match(live,/CLIENT_SIGNAL/);
  assert.match(live,/liveWebSocketUrl\(lastSeq,String\(ticketData\?\.ticket\?\?''\)\)/);
  assert.match(live,/GROUP_LIVE_SIGNAL/);
  assert.match(live,/GROUP_LIVE_HELLO/);
  assert.match(live,/reconnectAttempt>=4/);
  assert.match(live,/\[1500,4500,12000,30000\]/);
  assert.match(live,/addEventListener\('online'/);
  assert.doesNotMatch(live,/socket\.send\('PING'\)/);
  assert.doesNotMatch(live,/setInterval\(/);
  assert.match(app,/liveWebSocketUrl\(after=0,ticket=''\)/);
  assert.match(api,/live\\\/\(health\|events\|connect\|publish\|signal\)/);
  assert.match(main,/identityLiveUI\.publishSignal/);
  assert.match(main,/applyRemoteFinancialProjection/);
  assert.match(main,/remote-ack/);
});
