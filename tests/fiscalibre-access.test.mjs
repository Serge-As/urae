import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {FISCALIBRE_ACCESS_SOURCE} from '../.build/workers/api/src/fiscalibre-access.js';

function fixture(){
 let now=0,sequence=0;const attributes=new Set(['data-fiscalibre-private']),events={},timers=new Map(),scripts=[];
 const result={redirects:[],saves:0,speechStops:0};
 const root={setAttribute:k=>attributes.add(k),removeAttribute:k=>attributes.delete(k),hasAttribute:k=>attributes.has(k)};
 const document={documentElement:root,hidden:false,getElementById:()=>({textContent:''}),addEventListener:(name,fn)=>events[name]=fn,createElement:()=>({remove(){}}),head:{appendChild:script=>scripts.push(script)}};
 const window={addEventListener:(name,fn)=>events[name]=fn,fiscalibreSaveBeforeLock:()=>result.saves++,speechSynthesis:{cancel:()=>result.speechStops++}};
 const context={document,window,performance:{now:()=>now},Date:class extends Date{static now(){return now;}},location:{replace:url=>result.redirects.push(url)},setTimeout:(fn,ms)=>{timers.set(++sequence,{fn,at:now+ms});return sequence;},clearTimeout:id=>timers.delete(id)};
 runInNewContext('('+FISCALIBRE_ACCESS_SOURCE+')({expiresAt:3600000,serverNow:0})',context);
 return {result,events,document,window,attributes,scripts,advance(ms,runTimers=true){now+=ms;if(runTimers)for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();}}};
}
test('Open view locks after one hour; another verification cannot extend the initial deadline',()=>{const f=fixture();assert(!f.attributes.has('data-fiscalibre-private'));f.advance(1800000);f.window.__fiscalibreAccess.verify({expiresAt:5400000,serverNow:1800000});f.advance(1800001);assert.deepEqual(f.result.redirects,['/fiscalibre/?expired=1']);assert(f.attributes.has('data-fiscalibre-private'));assert.equal(f.result.saves,1);});
test('Background and BFCache hide the content; expired foreground returns to password even with suspended timers',()=>{const f=fixture();f.events.pagehide();assert(f.attributes.has('data-fiscalibre-private'));f.advance(3600001,false);f.events.pageshow({persisted:true});assert.deepEqual(f.result.redirects,['/fiscalibre/?expired=1']);assert.equal(f.result.speechStops,1);});
test('Active foreground revalidates through the protected script and network failure remains locked',()=>{const f=fixture();f.document.hidden=true;f.events.visibilitychange();assert(f.attributes.has('data-fiscalibre-private'));f.document.hidden=false;f.events.visibilitychange();assert.equal(f.scripts.length,1);assert.match(f.scripts[0].src,/^\/fiscalibre\/access\.js\?check=/);f.scripts[0].onerror();assert.deepEqual(f.result.redirects,['/fiscalibre/?expired=1']);assert(f.attributes.has('data-fiscalibre-private'));});
test('Expired interaction is blocked before any operation can run',()=>{const f=fixture();f.advance(3600001,false);let prevented=0;f.events.submit({preventDefault:()=>prevented++,stopImmediatePropagation:()=>prevented++});assert.equal(prevented,2);assert.equal(f.result.redirects.length,1);});
