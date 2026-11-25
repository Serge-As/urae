import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';

function fixture(){
 const bodies={'/':'<html>ready</html>','/index.html':'<html>ready</html>','/src/main.js':'export const ready=true;'};
 const hashes=Object.fromEntries(Object.entries(bodies).map(([p,s])=>[p,createHash('sha256').update(s).digest('hex')]));
 let source=readFileSync('apps/web/sw.js','utf8').replace(/const ESSENTIAL_SHELL = \[[\s\S]*?\];/,"const ESSENTIAL_SHELL = ['/', '/index.html', '/src/main.js'];").replace(/const OPTIONAL_SHELL = \[[\s\S]*?\];/,'const OPTIONAL_SHELL = [];').replace('const GENERATED_ASSET_HASHES = {};','const GENERATED_ASSET_HASHES = '+JSON.stringify(hashes)+';');
 const handlers={},stored=new Map(),calls=[],failed=new Map();let skipped=0,claimed=0;
 const key=value=>typeof value==='string'?new URL(value,'https://eco.example').pathname:new URL(value.url).pathname;
 const cache={match:async p=>stored.get(key(p))?.clone(),put:async(p,r)=>stored.set(key(p),r.clone())};
 const self={location:{origin:'https://eco.example'},crypto:webcrypto,addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{skipped++;},clients:{claim:async()=>{claimed++;}}};
 const caches={open:async()=>cache,delete:async()=>{throw Error('candidate bytes must remain');}};
 const fetch=async p=>{const path=key(p);calls.push(path);if((failed.get(path)??0)>0){failed.set(path,failed.get(path)-1);throw Error('synthetic interrupted download');}return new Response(bodies[path],{headers:{'content-type':path.endsWith('.js')?'application/javascript':'text/html'}});};
 const timer=(fn,ms)=>ms<2000?(queueMicrotask(fn),0):setTimeout(fn,ms);
 new Function('self','caches','fetch','setTimeout','clearTimeout',source)(self,caches,fetch,timer,clearTimeout);
 const dispatch=async(name,data={})=>{let work;handlers[name]({...data,waitUntil:p=>{work=p;}});await work;};
 return{dispatch,stored,calls,failed,skipped:()=>skipped,claimed:()=>claimed};
}
test('one interrupted asset is retried while the coherent shell marker is written strictly last',async()=>{
 const f=fixture();f.failed.set('/src/main.js',1);await f.dispatch('install');assert.equal(f.skipped(),1);assert.equal(f.calls.filter(p=>p==='/src/main.js').length,2);assert.equal([...f.stored.keys()].at(-1),'/__eco_release_ready__');
});
test('failed installation retains verified bytes and the next install downloads only the missing asset',async()=>{
 const f=fixture();f.failed.set('/src/main.js',3);await assert.rejects(f.dispatch('install'));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.skipped(),0);assert.equal(f.stored.has('/__eco_release_ready__'),false);assert.equal(f.stored.has('/index.html'),true);
 const before=f.calls.length;await f.dispatch('install');assert.deepEqual(f.calls.slice(before),['/src/main.js']);assert.equal(f.skipped(),1);
});
test('corrupted retained candidate bytes are re-downloaded and an unready cache cannot claim a page',async()=>{
 const f=fixture();f.stored.set('/index.html',new Response('corrupt'));await f.dispatch('message',{data:{type:'CLAIM_CLIENTS'}});assert.equal(f.claimed(),0);
 await f.dispatch('install');assert.ok(f.calls.includes('/index.html'));await f.dispatch('message',{data:{type:'CLAIM_CLIENTS'}});assert.equal(f.claimed(),1);
});
