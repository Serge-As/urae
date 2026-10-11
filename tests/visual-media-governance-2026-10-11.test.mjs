import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {VisualMediaService,assertVisualSize,sniffVisualMime} from '../.build/packages/visual-media/src/index.js';

const PNG=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8FbhQAAAAASUVORK5CYII=','base64'));
const scope=(kernel,actor,group='g')=>kernel.context.set({tenantId:'tenantA',actorId:actor,activeGroupId:group,groupRoles:[],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'test'});
async function setup(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),objects=new Map();
  const store={
    async put(key,value){objects.set(key,typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value));},
    async get(key){const bytes=objects.get(key);return bytes?{arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),text:async()=>new TextDecoder().decode(bytes)}:null}
  };
  scope(kernel,'owner');
  await repo.saveGroup({id:'g',tenantId:'tenantA',name:'Groupe',kind:'association',governanceModel:'founder_managed',status:'active',createdBy:'owner',createdAt:'2026-09-15T00:00:00Z'});
  await repo.saveGroup({id:'g2',tenantId:'tenantA',name:'Other',kind:'association',governanceModel:'founder_managed',status:'active',createdBy:'owner',createdAt:'2026-09-15T00:00:00Z'});
  return{repo,kernel,store,media:new VisualMediaService(repo,kernel,store),objects};
}
const photo=()=>new File([PNG],'test.png',{type:'image/png'});

test('visual assets validate size and signature; SVG and fake formats are forbidden',()=>{
  assert.equal(sniffVisualMime(PNG),'image/png');
  assert.throws(()=>sniffVisualMime(new TextEncoder().encode('<svg><script>alert(1)</script></svg>')),/MEDIA_UNSUPPORTED_FORMAT/);
  assert.throws(()=>assertVisualSize(2000001),/MEDIA_SIZE_OUT_OF_RANGE/);
});

test('owner may upload, select, read and revoke a group visual without finance writes',async()=>{
  const {media}=await setup();
  const uploaded=await media.upload('g',photo(),'HOME_HERO');
  assert.match(uploaded.id,/^visual_media_/);
  assert.equal(uploaded.contentType,'image/png');
  assert.deepEqual((await media.list('g')).map(x=>x.id),[uploaded.id]);
  await media.assign('g','HOME_HERO',uploaded.id);
  assert.equal((await media.presentation('g')).HOME_HERO,uploaded.id);
  const bytes=await media.bytes('g',uploaded.id);
  assert.deepEqual(new Uint8Array(bytes.bytes),PNG);
  await media.assign('g','HOME_HERO','');
  assert.equal((await media.presentation('g')).HOME_HERO,'');
});

test('group/tenant isolation and privacy of profile images cannot be bypassed by manager',async()=>{
  const {repo,kernel,media}=await setup();
  scope(kernel,'owner','g');
  const personal=await media.upload('g',photo(),'PROFILE_PHOTO');
  await media.assign('g','PROFILE_PHOTO',personal.id);
  await assert.rejects(()=>media.record('g2',personal.id),/MEDIA_NOT_FOUND/);
  scope(kernel,'member','g');
  await assert.rejects(()=>media.bytes('g',personal.id),/FORBIDDEN_SCOPE|FORBIDDEN_MEDIA_ACCESS/);
  scope(kernel,'owner','g');
  await assert.rejects(()=>media.assign('g','GROUP_COVER',personal.id),/MEDIA_PURPOSE_MISMATCH/);
});

test('invalid slot and image-mime mismatch are rejected before any storage write',async()=>{
  const {media,objects}=await setup();
  await assert.rejects(()=>media.upload('g',new File([PNG],'fake.jpg',{type:'image/jpeg'}),'GROUP_COVER'),/MEDIA_MIME_MISMATCH/);
  await assert.rejects(()=>media.upload('g',photo(),'INVALID_SLOT'),/MEDIA_INVALID_PURPOSE/);
  assert.equal(objects.size,0);
});

test('service fails closed without binary artifact storage',async()=>{
  const {repo,kernel}=await setup();
  const storage={async put(){throw Error('D1_FALLBACK_TEXT_ONLY')},async get(){return null}};
  const media=new VisualMediaService(repo,kernel,storage);
  await assert.rejects(()=>media.upload('g',photo(),'HOME_HERO'),/D1_FALLBACK_TEXT_ONLY/);
});
