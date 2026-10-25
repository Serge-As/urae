import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalOCRSession} from '../apps/web/src/local-ocr-session.js';

class Host {
 static all=[];
 constructor(url,options){this.url=url;this.options=options;this.messages=[];this.stops=0;Host.all.push(this);}
 postMessage(message){this.messages.push(message);}
 terminate(){this.stops++;}
 send(message){this.onmessage({data:message});}
}
async function fixture(run,clock=false){
 const previous={Worker:globalThis.Worker,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
 globalThis.Worker=Host;Host.all=[];
 const timers=new Map();let seq=0;
 if(clock){globalThis.setTimeout=(callback,ms)=>{const id=++seq;timers.set(id,{callback,ms});return id;};globalThis.clearTimeout=id=>timers.delete(id);}
 try{await run(timers);}finally{Object.assign(globalThis,previous);}
}

test('local OCR keeps one owned host, rejects overlapping work and ignores unrelated replies',()=>fixture(async()=>{
 const progress=[],session=createLocalOCRSession((...args)=>progress.push(args)),host=Host.all[0];
 assert.equal(host.url.pathname.endsWith('/local-document-ocr-worker.js'),true);assert.equal(host.options.type,'module');
 const first=session.recognize(new Blob(['synthetic']));await assert.rejects(session.recognize(new Blob(['other'])),/IN_PROGRESS/);
 host.send({id:99,type:'RESULT',text:'stale'});host.send({id:1,type:'PROGRESS',status:'reading',progress:.5});host.send({id:1,type:'RESULT',text:'1000'});
 assert.equal(await first,'1000');assert.deepEqual(progress,[['reading',.5]]);
 const next=session.recognize(new Blob(['second']));host.send({id:1,type:'ERROR'});host.send({id:2,type:'RESULT',text:'2000'});assert.equal(await next,'2000');
 session.terminate();assert.equal(host.stops,1);
}));

test('language loading failure ends the pending job and terminates its owned host immediately',()=>fixture(async()=>{
 const session=createLocalOCRSession(),host=Host.all[0],pending=session.recognize(new Blob(['scan']));
 const rejected=assert.rejects(pending,/DOCUMENT_OCR_UNAVAILABLE/);host.send({id:1,type:'ERROR'});await rejected;assert.equal(host.stops,1);
 host.send({id:1,type:'RESULT',text:'late'});await assert.rejects(session.recognize(new Blob(['again'])),/CANCELLED/);
}));

test('native worker and message decoding errors stop extraction without leaking a pending promise',()=>fixture(async()=>{
 for(const kind of ['onerror','onmessageerror']){
  const session=createLocalOCRSession(),host=Host.all.at(-1),pending=session.recognize(new Blob(['scan']));let prevented=false;
  const rejected=assert.rejects(pending,/DOCUMENT_OCR_UNAVAILABLE/);host[kind]({preventDefault(){prevented=true;}});await rejected;
  assert.equal(host.stops,1);if(kind==='onerror')assert.equal(prevented,true);
 }
}));

test('cancel during initialization rejects immediately; a fresh session can then finish',()=>fixture(async()=>{
 const session=createLocalOCRSession(),host=Host.all[0],pending=session.recognize(new Blob(['scan']));
 const rejected=assert.rejects(pending,/DOCUMENT_PREPARATION_CANCELLED/);session.terminate();session.terminate();await rejected;assert.equal(host.stops,1);
 const next=createLocalOCRSession(),newHost=Host.all[1],result=next.recognize(new Blob(['retry']));host.send({id:1,type:'RESULT',text:'discarded'});newHost.send({id:1,type:'RESULT',text:'review me'});assert.equal(await result,'review me');next.terminate();
}));

test('a stalled engine has an idle deadline and progress cannot extend the absolute deadline',()=>fixture(async timers=>{
 const session=createLocalOCRSession(),host=Host.all[0],pending=session.recognize(new Blob(['scan'])),deadline=[...timers.values()].find(x=>x.ms===180000);
 const rejected=assert.rejects(pending,/DOCUMENT_OCR_TIMEOUT/);
 assert.equal([...timers.values()].filter(x=>x.ms===60000).length,1);
 host.send({id:1,type:'PROGRESS',status:'loading',progress:.1});assert.equal(timers.size,2);assert.ok([...timers.values()].includes(deadline));
 deadline.callback();await rejected;assert.equal(host.stops,1);assert.equal(timers.size,0);
} ,true));

test('an idle timeout ends initialization even if the engine never emits an error',()=>fixture(async timers=>{
 const session=createLocalOCRSession(),host=Host.all[0],pending=session.recognize(new Blob(['scan']));
 const rejected=assert.rejects(pending,/DOCUMENT_OCR_TIMEOUT/);[...timers.values()].find(x=>x.ms===60000).callback();await rejected;assert.equal(host.stops,1);assert.equal(timers.size,0);
},true));
