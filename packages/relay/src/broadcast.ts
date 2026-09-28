export interface EcoMemberCapsule {
  protocolVersion:1;
  groupId:string;
  membershipId:string;
  generatedAt:string;
  expiresAt:string;
  projection:Record<string,unknown>;
}

export interface EcoRelayPairingMaterial {
  protocolVersion:1;
  membershipId:string;
  keyId:string;
  rawKey:string;
  createdAt:string;
  groupId?:string;
  groupName?:string;
  displayName?:string;
  memberNumber?:number;
}

export interface EcoEncryptedCapsule {
  membershipId:string;
  keyId:string;
  expiresAt:string;
  iv:string;
  ciphertext:string;
}

export interface EcoBroadcastBundle {
  protocol:'ECO_BROADCAST_1';
  transferId:string;
  groupId:string;
  generatedAt:string;
  expiresAt:string;
  capsules:EcoEncryptedCapsule[];
}

export interface EcoBroadcastFrame {
  protocol:'ECOB1';
  transferId:string;
  index:number;
  total:number;
  digest:string;
  chunk:string;
  raw:string;
}

const te=new TextEncoder(),td=new TextDecoder();
const b64u=(bytes:Uint8Array):string=>{
  let s='';for(const b of bytes)s+=String.fromCharCode(b);
  return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
};
const unb64u=(value:string):Uint8Array=>{
  const normalized=value.replaceAll('-','+').replaceAll('_','/'),padded=normalized+'='.repeat((4-normalized.length%4)%4),raw=atob(padded),out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;
};
const hex=(bytes:Uint8Array)=>[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
const randomToken=(bytes=8)=>hex(crypto.getRandomValues(new Uint8Array(bytes)));
const digest16=async(value:Uint8Array|string)=>{
  const bytes=typeof value==='string'?te.encode(value):value;
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).slice(0,16);
};
const rawBuffer=(bytes:Uint8Array):ArrayBuffer=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;

export async function createRelayPairingMaterial(membershipId:string):Promise<EcoRelayPairingMaterial>{
  if(!membershipId.trim())throw Error('MEMBERSHIP_REQUIRED');
  const raw=crypto.getRandomValues(new Uint8Array(32));
  return{protocolVersion:1,membershipId,keyId:(await digest16(raw)),rawKey:b64u(raw),createdAt:new Date().toISOString()};
}

export function encodePairingQr(material:EcoRelayPairingMaterial):string{
  if(material.protocolVersion!==1||!material.groupId||!material.membershipId||!material.keyId||!material.rawKey)throw Error('INVALID_RELAY_PAIRING_MATERIAL');
  let compact:any={p:1,g:material.groupId,m:material.membershipId,k:material.keyId,r:material.rawKey,c:material.createdAt,G:material.groupName??'',d:material.displayName??'',n:material.memberNumber??null};
  let encoded='ECOP1:'+b64u(te.encode(JSON.stringify(compact)));
  if(te.encode(encoded).length>250){compact={p:1,g:material.groupId,m:material.membershipId,k:material.keyId,r:material.rawKey,c:material.createdAt,n:material.memberNumber??null};encoded='ECOP1:'+b64u(te.encode(JSON.stringify(compact)));}
  if(te.encode(encoded).length>271)throw Error('PAIRING_QR_TOO_LARGE');
  return encoded;
}
export function decodePairingQr(raw:string):EcoRelayPairingMaterial{
  if(!raw.startsWith('ECOP1:'))throw Error('INVALID_PAIRING_QR');
  let c:any;try{c=JSON.parse(td.decode(unb64u(raw.slice(6))));}catch{throw Error('INVALID_PAIRING_QR');}
  if(c?.p!==1||!c.g||!c.m||!c.k||!c.r)throw Error('INVALID_PAIRING_QR');
  return{protocolVersion:1,groupId:String(c.g),membershipId:String(c.m),keyId:String(c.k),rawKey:String(c.r),createdAt:String(c.c??new Date().toISOString()),groupName:c.G?String(c.G):undefined,displayName:c.d?String(c.d):undefined,memberNumber:Number.isSafeInteger(c.n)?Number(c.n):undefined};
}

export async function encryptMemberCapsule(capsule:EcoMemberCapsule,material:EcoRelayPairingMaterial):Promise<EcoEncryptedCapsule>{
  if(capsule.membershipId!==material.membershipId)throw Error('RELAY_MEMBERSHIP_KEY_MISMATCH');
  const raw=unb64u(material.rawKey),key=await crypto.subtle.importKey('raw',rawBuffer(raw),{name:'AES-GCM'},false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12)),aad=te.encode(JSON.stringify([capsule.groupId,capsule.membershipId,material.keyId,capsule.expiresAt]));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:rawBuffer(iv),additionalData:rawBuffer(aad)},key,te.encode(JSON.stringify(capsule)));
  return{membershipId:capsule.membershipId,keyId:material.keyId,expiresAt:capsule.expiresAt,iv:b64u(iv),ciphertext:b64u(new Uint8Array(cipher))};
}

export async function decryptMemberCapsule(groupId:string,encrypted:EcoEncryptedCapsule,material:EcoRelayPairingMaterial,_bundleExpiresAt?:string):Promise<EcoMemberCapsule>{
  if(encrypted.membershipId!==material.membershipId||encrypted.keyId!==material.keyId)throw Error('RELAY_KEY_NOT_FOR_MEMBER');
  const raw=unb64u(material.rawKey),iv=unb64u(encrypted.iv),key=await crypto.subtle.importKey('raw',rawBuffer(raw),{name:'AES-GCM'},false,['decrypt']);
  if(Date.parse(encrypted.expiresAt)<=Date.now())throw Error('RELAY_CAPSULE_EXPIRED');
  const aad=te.encode(JSON.stringify([groupId,encrypted.membershipId,material.keyId,encrypted.expiresAt]));
  try{
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:rawBuffer(iv),additionalData:rawBuffer(aad)},key,rawBuffer(unb64u(encrypted.ciphertext)));
    const capsule=JSON.parse(td.decode(plain)) as EcoMemberCapsule;
    if(capsule.groupId!==groupId||capsule.membershipId!==material.membershipId)throw Error('RELAY_CAPSULE_SCOPE_MISMATCH');
    if(Date.parse(capsule.expiresAt)<=Date.now())throw Error('RELAY_CAPSULE_EXPIRED');
    return capsule;
  }catch(error){if(error instanceof Error&&error.message.startsWith('RELAY_'))throw error;throw Error('RELAY_CAPSULE_INTEGRITY_FAILED');}
}

export function createBroadcastBundle(groupId:string,capsules:EcoEncryptedCapsule[],ttlMinutes=30):EcoBroadcastBundle{
  if(!groupId.trim())throw Error('GROUP_REQUIRED');
  if(!capsules.length)throw Error('BROADCAST_CAPSULES_REQUIRED');
  const ids=new Set<string>();for(const c of capsules){if(ids.has(c.membershipId))throw Error('DUPLICATE_BROADCAST_MEMBER');ids.add(c.membershipId);}
  const generatedAt=new Date().toISOString(),expiresAt=new Date(Date.now()+Math.max(1,ttlMinutes)*60_000).toISOString();
  return{protocol:'ECO_BROADCAST_1',transferId:randomToken(6),groupId,generatedAt,expiresAt,capsules:structuredClone(capsules)};
}

export async function encodeBroadcastFrames(bundle:EcoBroadcastBundle,chunkChars=180):Promise<string[]>{
  if(chunkChars<80||chunkChars>190)throw Error('INVALID_BROADCAST_CHUNK_SIZE');
  const payload=b64u(te.encode(JSON.stringify(bundle))),digest=await digest16(payload),chunks:string[]=[];
  for(let i=0;i<payload.length;i+=chunkChars)chunks.push(payload.slice(i,i+chunkChars));
  if(chunks.length>9999)throw Error('BROADCAST_TOO_LARGE');
  return chunks.map((chunk,index)=>`ECOB1:${bundle.transferId}:${index+1}:${chunks.length}:${digest}:${chunk}`);
}

export function parseBroadcastFrame(raw:string):EcoBroadcastFrame{
  const m=/^ECOB1:([a-f0-9]{12}):(\d{1,4}):(\d{1,4}):([a-f0-9]{16}):([A-Za-z0-9_-]+)$/.exec(raw.trim());
  if(!m)throw Error('INVALID_BROADCAST_FRAME');
  const index=Number(m[2]),total=Number(m[3]);if(index<1||total<1||index>total)throw Error('INVALID_BROADCAST_FRAME_INDEX');
  return{protocol:'ECOB1',transferId:m[1]!,index,total,digest:m[4]!,chunk:m[5]!,raw:raw.trim()};
}

export class EcoBroadcastReceiver{
  private transferId?:string;
  private total=0;
  private digest='';
  private frames=new Map<number,string>();
  add(raw:string):{accepted:boolean;received:number;total:number;complete:boolean}{
    const f=parseBroadcastFrame(raw);
    if(!this.transferId){this.transferId=f.transferId;this.total=f.total;this.digest=f.digest;}
    if(f.transferId!==this.transferId||f.total!==this.total||f.digest!==this.digest)return{accepted:false,received:this.frames.size,total:this.total,complete:false};
    this.frames.set(f.index,f.chunk);
    return{accepted:true,received:this.frames.size,total:this.total,complete:this.frames.size===this.total};
  }
  progress(){return{transferId:this.transferId,received:this.frames.size,total:this.total,complete:this.total>0&&this.frames.size===this.total};}
  reset(){this.transferId=undefined;this.total=0;this.digest='';this.frames.clear();}
  async assemble():Promise<EcoBroadcastBundle>{
    if(!this.transferId||this.frames.size!==this.total)throw Error('BROADCAST_INCOMPLETE');
    let payload='';for(let i=1;i<=this.total;i++){const chunk=this.frames.get(i);if(!chunk)throw Error('BROADCAST_INCOMPLETE');payload+=chunk;}
    if(await digest16(payload)!==this.digest)throw Error('BROADCAST_DIGEST_MISMATCH');
    const bundle=JSON.parse(td.decode(unb64u(payload))) as EcoBroadcastBundle;
    if(bundle.protocol!=='ECO_BROADCAST_1'||bundle.transferId!==this.transferId)throw Error('BROADCAST_BUNDLE_MISMATCH');
    if(Date.parse(bundle.expiresAt)<=Date.now())throw Error('BROADCAST_EXPIRED');
    return bundle;
  }
}
