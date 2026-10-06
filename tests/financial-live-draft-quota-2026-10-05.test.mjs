import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

const cell=(rubricId)=>({kind:'FINANCIAL_CELL',meetingId:'meeting-1',membershipId:'member-1',rubricId});
const testState=()=>{
  const entries=new Map(),writes=[];
  const storage={
    async get(key){return entries.get(key);},
    async put(key,value){entries.set(key,value);writes.push(['put',key]);},
    async delete(key){entries.delete(key);writes.push(['delete',key]);},
    async list({prefix='',startAfter,limit=500}={}){
      return new Map([...entries.entries()].filter(([k])=>k.startsWith(prefix)&&(!startAfter||k>startAfter)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit));
    }
  };
  return {entries,writes,storage,getWebSockets(){return[];}};
};
const post=async(hub,type,payload,actorId='manager-a')=>{
  const response=await hub.fetch(new Request('https://group-live.internal/signal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,actorId,payload})}));
  assert.equal(response.status,202);return response.json();
};
const read=async(hub,afterAt=0)=>(
  await hub.fetch(new Request('https://group-live.internal/signals?afterAt='+afterAt+'&actorId=manager-b'))
).json();

test('two simultaneous drafts by same actor survive distinct cell keys and clear only own cell',async()=>{
  globalThis.WebSocket={OPEN:1};
  const state=testState(),hub=new GroupLiveHub(state,{});
  await post(hub,'FINANCIAL_DRAFT',cell('secours'));
  await post(hub,'FINANCIAL_DRAFT',cell('collation'));
  assert.equal(state.writes.length,2);
  assert.equal(state.entries.size,2);
  let active=(await read(hub)).signals.filter(s=>s.type==='FINANCIAL_DRAFT');
  assert.equal(active.length,2);
  await post(hub,'FINANCIAL_DRAFT_CLEAR',cell('secours'));
  assert.equal(state.entries.size,1);
  active=(await read(hub)).signals.filter(s=>s.type==='FINANCIAL_DRAFT');
  assert.deepEqual(active.map(s=>s.payload.rubricId),['collation']);
  assert.equal(state.writes.length,3);
  await post(hub,'TYPING',cell('collation'));
  await post(hub,'TYPING_STOP',cell('collation'));
  assert.equal(state.writes.length,3,'typing must never write Durable storage');
  assert.equal(state.entries.size,1);
});

test('a stored unconfirmed draft is replayed after 12s without any polling',async()=>{
  const state=testState(),hub=new GroupLiveHub(state,{});
  await post(hub,'FINANCIAL_DRAFT',cell('epargne'));
  const [[key,row]]=[...state.entries];
  state.entries.set(key,{...row,at:new Date(Date.now()-22000).toISOString()});
  // New object instance simulates hibernation/memory reset.
  const recovered=new GroupLiveHub(state,{});
  const {signals}=await read(recovered,Date.now());
  assert.equal(signals.length,1);
  assert.equal(signals[0].payload.rubricId,'epargne');
  assert.equal(signals[0].payload.amount,undefined);
  assert.equal(signals[0].type,'FINANCIAL_DRAFT');
});

test('presence in the UI does not clear a draft after idle typing-stop timeout',()=>{
  const ui=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(ui,/remoteFinancialDrafts/);
  assert.match(ui,/liveTypingHideTimer/);
  assert.match(ui,/deadline=Date.now\(\)\+30\*60_000/);
  assert.match(ui,/paintRemoteFinancialDraft/);
  assert.doesNotMatch(ui,/resetPresenceTimer\(11000\)/);
  const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
  assert.doesNotMatch(live,/setInterval\(/);
  assert.match(live,/serverBudgetState\?\.\(\)\.blocked/);
});

test('auth 429 is not silently reclassified as a Cloudflare daily D1 quota',async()=>{
  const old=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'RATE_LIMITED'}),{status:429,headers:{'content-type':'application/json'}});
  const app=new ConnectedApplication();
  try{
    await assert.rejects(()=>app.request('/api/v1/groups'),{message:'RATE_LIMITED'});
    assert.equal(app.serverBudgetState().blocked,false);
    assert.match(fs.readFileSync('packages/application/src/index.ts','utf8'),/eco:server-budget-expired/);
  }finally{app.forceServerRetry();globalThis.fetch=old;}
});
