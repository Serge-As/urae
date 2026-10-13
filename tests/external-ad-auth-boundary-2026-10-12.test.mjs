import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticatedApi} from '../.build/workers/api/src/authenticated.js';
const base='https://eco.example',group='group-123',tenant='tenant-123',token='ad_invite_abc123.'+'a'.repeat(64);
function setup(){
 const calls=[];
 const handle=async req=>{calls.push({url:req.url,method:req.method,actor:req.headers.get('x-actor-id'),
  session:req.headers.get('x-session-id'),roles:req.headers.get('x-group-roles'),
  tenant:req.headers.get('x-tenant-id'),group:req.headers.get('x-active-group-id'),
  token:req.headers.get('x-external-ad-token'),type:req.headers.get('content-type')});
  return new Response(JSON.stringify({ok:true}),{status:200,headers:{'content-type':'application/json'}})};
 const proxy=authenticatedApi({},{prepare(){throw Error('DB_WOULD_BE_USED_FOR_AUTH')}},handle);
 return{proxy,calls};
}
const route=()=>base+'/api/v1/external-ads/groups/'+group+'/invite';
const headers=()=>({'x-tenant-id':tenant,'x-external-ad-token':token,'x-actor-id':'founder-spoof',
 'x-group-roles':'founder,manager','x-active-group-id':'other-group','x-session-id':'admin-spoof'});
test('invited guest without session cannot impersonate group manager',async()=>{
 const {proxy,calls}=setup();
 assert.equal((await proxy(new Request(route(),{headers:headers()}))).status,200);
 assert.equal(calls.length,1);
 assert.equal(calls[0].actor,'external-ad-invite-only');
 assert.equal(calls[0].roles,'');
 assert.equal(calls[0].session,'invitation-only');
 assert.equal(calls[0].group,group);
 assert.equal(calls[0].tenant,tenant);
});
test('invite intake accepts only bounded same-origin JSON and photo multipart',async()=>{
 const {proxy,calls}=setup();
 assert.equal((await proxy(new Request(route(),{method:'POST',headers:{...headers(),origin:base,'content-type':'application/json'},body:'{"title":"Local"}'}))).status,200);
 const photo=new FormData();photo.append('file',new File([new Uint8Array(180_000)],'image.png',{type:'image/png'}));
 assert.equal((await proxy(new Request(route()+'/photo',{method:'POST',headers:{...headers(),origin:base},body:photo}))).status,200);
 assert.equal(calls.length,2);
 assert.ok(calls[1].type.startsWith('multipart/form-data;'));
 assert.equal((await proxy(new Request(route(),{method:'POST',headers:{...headers(),origin:'https://evil.example','content-type':'application/json'},body:'{}'}))).status,403);
 assert.equal((await proxy(new Request(route(),{method:'POST',headers:{...headers(),origin:base,'content-type':'text/plain'},body:'{}'}))).status,415);
 assert.equal((await proxy(new Request(route()+'/photo',{headers:headers()}))).status,405);
});
test('invalid or missing invite cannot bypass authorization for other routes',async()=>{
 const {proxy,calls}=setup();
 assert.equal((await proxy(new Request(route(),{headers:{'x-tenant-id':tenant}}))).status,403);
 assert.notEqual((await proxy(new Request(base+'/api/v1/groups/'+group+'/visual-media',{headers:headers()}))).status,200);
 assert.equal(calls.length,0);
});
