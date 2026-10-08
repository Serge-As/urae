import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {currentRelease} from './release-fixture.mjs';

test('activation preserves the ready cache actually installed from public production',async()=>{
  const origin='https://eco.example',current=currentRelease.pwaCache;
  const installed='eco-system-v15211-field-recovery-20261005',ready='/__eco_release_ready__';
  const stores=new Map(),listeners=new Map();
  const open=async name=>{
    if(!stores.has(name))stores.set(name,new Map());
    const data=stores.get(name);
    return {match:async key=>data.get(typeof key==='string'?key:key.url),
      put:async(key,value)=>data.set(typeof key==='string'?key:key.url,value)};
  };
  await (await open(installed)).put(ready,new Response(JSON.stringify({cache:installed})));
  await (await open(installed)).put('/src/main.js?v=15211',new Response('previous coherent application'));
  await (await open(current)).put(ready,new Response(JSON.stringify({cache:current})));
  const source=readFileSync(new URL('../apps/web/sw.js',import.meta.url),'utf8');
  let claimed=false,pending;
  runInNewContext(source,{URL,Response,caches:{open,keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},
    self:{location:{origin},addEventListener:(name,handler)=>listeners.set(name,handler),
      clients:{claim:async()=>{claimed=true;}}}});
  listeners.get('activate')({waitUntil:promise=>{pending=promise;}});
  await pending;
  assert.equal(claimed,true);
  assert.equal(stores.has(installed),true,'a public predecessor must survive activation of a newer source line');
  assert.equal(await (await (await open(installed)).match('/src/main.js?v=15211')).text(),'previous coherent application');
  assert.equal(stores.has(current),true);
});
