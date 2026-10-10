import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('a broken browser CacheStorage never turns online navigation into ERR_FAILED or clears finance',async()=>{
 const listeners=new Map();let requestCount=0,result;
 runInNewContext(readFileSync('apps/web/sw.js','utf8'),{URL,Response,caches:{open:async()=>{throw Error('CacheStorage unavailable');}},fetch:async()=>{requestCount++;return new Response('<h1>Eco restored</h1>',{headers:{'content-type':'text/html'}});},self:{location:{origin:'https://eco.example'},addEventListener:(name,handler)=>listeners.set(name,handler)}});
 listeners.get('fetch')({request:{method:'GET',mode:'navigate',url:'https://eco.example/?#financeLoanGuide'},respondWith:promise=>result=promise});
 const response=await result;assert.equal(response.status,200);assert.match(await response.text(),/Eco restored/);assert.equal(requestCount,1);
});
