import test from 'node:test';
import assert from 'node:assert/strict';
import { mountIdentityLiveUI } from '../apps/web/src/identity-live-ui.js';

test('existing signed WebSocket remains usable when unrelated D1 quota is blocked',async()=>{
  const saved=new Map();
  for(const k of ['document','window','navigator','WebSocket','CustomEvent'])saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));
  const sockets=[];let blocked=false;let tickets=0;
  try{
    Object.defineProperty(globalThis,'document',{configurable:true,value:{getElementById(id){
      return id==='identityPassport'?{replaceChildren(){}}:id==='view-settings'?{classList:{contains:()=>false}}:null;
    },addEventListener(){},visibilityState:'visible'}});
    Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener(){},dispatchEvent(){}}});
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
    Object.defineProperty(globalThis,'CustomEvent',{configurable:true,value:class{constructor(type,options){this.type=type;this.detail=options?.detail;}}});
    Object.defineProperty(globalThis,'WebSocket',{configurable:true,value:class{
      static CONNECTING=0;static OPEN=1;
      constructor(){this.readyState=0;this.sent=[];sockets.push(this);}
      send(message){this.sent.push(JSON.parse(message));}
      close(){this.readyState=3;}
    }});
    const app={
      activeGroup:()=> 'grp-test',
      serverBudgetState:()=>({blocked}),
      liveWebSocketUrl:()=> 'wss://example.invalid/live',
      liveTicket:async()=>{tickets++;return{ticket:'already-signed'};},
      groupIdentityPassport:async()=>({}),conciergeProfile:async()=>({})
    };
    const live=mountIdentityLiveUI({app,conservationMode:true,showError:e=>{throw e;}});
    await live.refresh();
    assert.equal(sockets.length,1);
    const ws=sockets[0];ws.readyState=1;ws.onopen();
    blocked=true;
    const result=await live.publishSignal('TYPING',{kind:'FINANCIAL_CELL',meetingId:'s1',membershipId:'m1',rubricId:'r1'});
    assert.equal(result.accepted,true);
    assert.equal(result.transport,'websocket');
    assert.ok(ws.sent.some(m=>m.eventType==='TYPING'));
    assert.equal(tickets,1,'typing sends no new ticket/D1 request');
    live.disconnect();
  }finally{
    for(const [k,d]of saved)if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];
  }
});
