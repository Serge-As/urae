import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mountIdentityLiveUI } from '../apps/web/src/identity-live-ui.js';

test('financial live socket connects even if optional identity D1 read fails', async () => {
  const previous=new Map();
  for(const key of ['document','window','navigator','WebSocket','CustomEvent'])previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  const sockets=[],events=[],errors=[];
  try {
    const passport={replaceChildren(){}};
    Object.defineProperty(globalThis,'document',{configurable:true,value:{getElementById(id){return id==='identityPassport'?passport:null;},addEventListener(){}}});
    Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener(){},dispatchEvent(event){events.push(event);}}});
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
    Object.defineProperty(globalThis,'CustomEvent',{configurable:true,value:class {constructor(type,options){this.type=type;this.detail=options?.detail;}}});
    Object.defineProperty(globalThis,'WebSocket',{configurable:true,value:class {
      static OPEN=1;
      constructor(url){this.url=url;this.readyState=0;sockets.push(this);}
      close(){this.readyState=3;}
    }});
    const app={
      activeGroup:()=> 'group-test',
      liveWebSocketUrl:()=> 'wss://example.invalid/live',
      groupIdentityPassport:async()=>{throw Error('D1_UNAVAILABLE');},
      conciergeProfile:async()=>({}),
    };
    const live=mountIdentityLiveUI({app,conservationMode:true,showError:error=>errors.push(error.message)});
    await live.refresh();
    assert.equal(sockets.length,1,'D1 identity read must not gate live socket');
    assert.deepEqual(errors,['D1_UNAVAILABLE']);
    sockets[0].readyState=1;sockets[0].onopen();
    assert.ok(events.some(e=>e.type==='eco:live-connected'&&e.detail.groupId==='group-test'));
    live.disconnect();
  } finally {
    for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});

test('remote financial changes must not drop queued divergent local writes',()=>{
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  const block=main.slice(main.indexOf('const applyRemoteFinancialProjection='),main.indexOf('const acknowledgeRemoteFinancialCell='));
  assert.match(block,/outboxItems/);
  assert.match(block,/FINANCIAL_CELL_CORRECTION_PROPOSAL_V1/);
  assert.match(block,/FINANCIAL_SHEET_ENTRY_V1/);
  assert.match(block,/localAmount!==amount/);
  assert.match(block,/markCriticalFinancialConflict/);
  assert.match(main,/if\(!applyRemoteFinancialProjection\(p\)\)return/);
});

test('saved loan policy and debt projection update only after real financial events',()=>{
  const ui=fs.readFileSync('apps/web/src/completion-ui.js','utf8');
  assert.match(ui,/rubric\.policies=structuredClone\(updated\?\.policies\?\?policies\)/);
  assert.match(ui,/window\.addEventListener\('eco:financial-data-changed',scheduleDebtRefresh\)/);
  assert.match(ui,/window\.addEventListener\('eco:financial-live-update',scheduleDebtRefresh\)/);
  assert.doesNotMatch(ui,/setInterval\(/);
});


test('Wi-Fi to mobile change reconnects once without polling or stale onclose dropping the fresh socket',async()=>{
  const previous=new Map();
  for(const key of ['document','window','navigator','WebSocket','CustomEvent'])previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
  const sockets=[],networkHandlers={};
  try{
    const passport={replaceChildren(){}},connection={type:'wifi',effectiveType:'4g',rtt:30,addEventListener(name,handler){networkHandlers[name]=handler;}};
    Object.defineProperty(globalThis,'document',{configurable:true,value:{getElementById(id){return id==='identityPassport'?passport:null;},addEventListener(){}}});
    Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener(){},dispatchEvent(){}}});
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true,connection}});
    Object.defineProperty(globalThis,'CustomEvent',{configurable:true,value:class {constructor(type,options){this.type=type;this.detail=options?.detail;}}});
    Object.defineProperty(globalThis,'WebSocket',{configurable:true,value:class {
      static OPEN=1;static CONNECTING=0;
      constructor(url){this.url=url;this.readyState=0;sockets.push(this);}
      close(){this.readyState=3;}
    }});
    const app={activeGroup:()=> 'group-net',liveTicket:async()=>({ticket:'signed'}),
      liveWebSocketUrl:()=> 'wss://example.invalid/live',
      groupIdentityPassport:async()=>{throw Error('D1_DOWN');},
      conciergeProfile:async()=>({})};
    const live=mountIdentityLiveUI({app,conservationMode:true,showError:()=>{}});
    await live.refresh();
    await Promise.resolve();
    assert.equal(sockets.length,1);
    sockets[0].readyState=1;sockets[0].onopen();
    connection.rtt=65;networkHandlers.change();
    await Promise.resolve();
    assert.equal(sockets.length,1,'RTT change cannot create a new connection');
    connection.effectiveType='3g';networkHandlers.change();
    await Promise.resolve();
    assert.equal(sockets.length,1,'bandwidth estimate cannot create new Live requests');
    connection.type='cellular';networkHandlers.change();
    await Promise.resolve();await Promise.resolve();
    assert.equal(sockets.length,2,'real interface switch reconnects immediately');
    sockets[1].readyState=1;sockets[1].onopen();
    sockets[0].onclose();
    assert.equal(sockets.length,2,'a late old onclose cannot schedule another reconnect');
    live.disconnect();
  }finally{for(const [k,d] of previous){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
