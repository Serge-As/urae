import type { OutboxItem } from '../../contracts/src/index.js';

export type EcoRelayBundleKind='CONSENSUS'|'MEMBER_DELTA'|'MEMBER_ACK'|'SYNC_FORWARD'|'SYNC_RECEIPT';
export interface EcoRelayEvent { id:string; type:string; actorId:string; groupId?:string; membershipId?:string; createdAt:string; payload:unknown; }
export interface EcoRelayBundle {
  format:'eco-relay-bundle'; version:1; bundleId:string; kind:EcoRelayBundleKind; senderActorId:string; senderDeviceId:string;
  groupId?:string; meetingId?:string; recipientScope:'SERVER'|'GROUP_MANAGERS'|'MEMBER'|'DEVICE';
  recipientId?:string; createdAt:string; expiresAt:string; events:EcoRelayEvent[]; parentBundleIds:string[]; checksum:string;
}
export interface EcoRelayQrFrame { format:'eco-relay-qr'; version:1; transferId:string; index:number; total:number; checksum:string; payload:string; }

const enc=new TextEncoder();
const b64=(bytes:Uint8Array)=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);};
const unb64=(s:string)=>{const x=atob(s),b=new Uint8Array(x.length);for(let i=0;i<x.length;i++)b[i]=x.charCodeAt(i);return b;};
const hex=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const randomId=()=>globalThis.crypto?.randomUUID?.()??('relay_'+Date.now()+'_'+Math.random().toString(36).slice(2));
export const relayChecksum=async(value:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))));
export const createEcoRelayBundle=async(input:Omit<EcoRelayBundle,'format'|'version'|'bundleId'|'createdAt'|'expiresAt'|'checksum'> & {bundleId?:string;ttlMs?:number}):Promise<EcoRelayBundle>=>{
  const createdAt=new Date().toISOString(),expiresAt=new Date(Date.now()+(input.ttlMs??7*86400000)).toISOString();
  const bare:any={format:'eco-relay-bundle',version:1,bundleId:input.bundleId??randomId(),kind:input.kind,senderActorId:input.senderActorId,senderDeviceId:input.senderDeviceId,groupId:input.groupId,meetingId:input.meetingId,recipientScope:input.recipientScope,recipientId:input.recipientId,createdAt,expiresAt,events:input.events,parentBundleIds:input.parentBundleIds};
  bare.checksum=await relayChecksum(JSON.stringify(bare));return bare as EcoRelayBundle;
};
export const verifyEcoRelayBundle=async(bundle:EcoRelayBundle):Promise<boolean>=>{
  if(bundle.format!=='eco-relay-bundle'||bundle.version!==1||Date.parse(bundle.expiresAt)<=Date.now())return false;
  const {checksum,...bare}=bundle;return checksum===await relayChecksum(JSON.stringify(bare));
};
export const encodeRelayQrFrames=async(bundle:EcoRelayBundle,maxPayloadChars=900):Promise<EcoRelayQrFrame[]>=>{
  if(!(await verifyEcoRelayBundle(bundle)))throw Error('RELAY_BUNDLE_INVALID');
  const payload=b64(enc.encode(JSON.stringify(bundle))),total=Math.ceil(payload.length/maxPayloadChars),transferId=bundle.bundleId;
  const frames:EcoRelayQrFrame[]=[];for(let index=0;index<total;index++){const part=payload.slice(index*maxPayloadChars,(index+1)*maxPayloadChars);frames.push({format:'eco-relay-qr',version:1,transferId,index,total,checksum:await relayChecksum(part),payload:part});}return frames;
};
export const decodeRelayQrFrames=async(frames:EcoRelayQrFrame[]):Promise<EcoRelayBundle>=>{
  if(!frames.length)throw Error('RELAY_QR_EMPTY');const sorted=[...frames].sort((a,b)=>a.index-b.index),first=sorted[0];
  if(sorted.length!==first.total||sorted.some((f,i)=>f.transferId!==first.transferId||f.total!==first.total||f.index!==i||f.format!=='eco-relay-qr'))throw Error('RELAY_QR_INCOMPLETE');
  for(const f of sorted)if(await relayChecksum(f.payload)!==f.checksum)throw Error('RELAY_QR_CORRUPT');
  const bundle=JSON.parse(new TextDecoder().decode(unb64(sorted.map(x=>x.payload).join('')))) as EcoRelayBundle;
  if(!(await verifyEcoRelayBundle(bundle)))throw Error('RELAY_BUNDLE_INVALID');return bundle;
};

export interface RelayEnvelope { protocolVersion:1; senderDeviceId:string; recipient:'server'|string; createdAt:string; expiresAt:string; nonce:string; payload:string; opaque:boolean; }
export interface RelayTransport {readonly name:string;readonly local:boolean;available():Promise<boolean>;send(envelope:RelayEnvelope):Promise<{accepted:boolean;receiptId?:string}>;}
export class LoopbackRelayTransport implements RelayTransport {readonly name='loopback';readonly local=true;async available(){return true;}async send(e:RelayEnvelope){if(new Date(e.expiresAt).getTime()<Date.now())return{accepted:false};return{accepted:true,receiptId:`loop_${e.nonce}`};}}
export const envelopeForOutbox=(deviceId:string,item:OutboxItem):RelayEnvelope=>({protocolVersion:1,senderDeviceId:deviceId,recipient:'server',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+5*60000).toISOString(),nonce:item.idempotencyKey,payload:JSON.stringify({id:item.id,type:item.type,tenantId:item.tenantId,payload:item.payload}),opaque:false});

export interface EncryptedRelayEnvelope extends Omit<RelayEnvelope,'payload'|'opaque'>{payload:string;opaque:true;algorithm:'AES-GCM';iv:string;keyId:string;}
const relayAad=(e:Pick<RelayEnvelope,'protocolVersion'|'senderDeviceId'|'recipient'|'createdAt'|'expiresAt'|'nonce'>)=>enc.encode(JSON.stringify([e.protocolVersion,e.senderDeviceId,e.recipient,e.createdAt,e.expiresAt,e.nonce]));
const buf=(b:Uint8Array)=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) as ArrayBuffer;
export const generateRelayKey=async()=>{if(!crypto?.subtle)throw Error('WEB_CRYPTO_REQUIRED');const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);const raw=new Uint8Array(await crypto.subtle.exportKey('raw',key));const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',buf(raw)));return{key,keyId:hex(digest.slice(0,8))};};
export const encryptRelayEnvelope=async(e:RelayEnvelope,key:CryptoKey,keyId:string):Promise<EncryptedRelayEnvelope>=>{if(Date.parse(e.expiresAt)<=Date.now())throw Error('RELAY_EXPIRED');const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:buf(iv),additionalData:buf(relayAad(e))},key,buf(enc.encode(e.payload)));return{...e,payload:b64(new Uint8Array(cipher)),opaque:true,algorithm:'AES-GCM',iv:b64(iv),keyId};};
export const decryptRelayEnvelope=async(e:EncryptedRelayEnvelope,key:CryptoKey,expectedRecipient:string):Promise<RelayEnvelope>=>{if(e.recipient!==expectedRecipient&&e.recipient!=='server')throw Error('RELAY_WRONG_RECIPIENT');if(Date.parse(e.expiresAt)<=Date.now())throw Error('RELAY_EXPIRED');try{const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:buf(unb64(e.iv)),additionalData:buf(relayAad(e))},key,buf(unb64(e.payload)));return{protocolVersion:e.protocolVersion,senderDeviceId:e.senderDeviceId,recipient:e.recipient,createdAt:e.createdAt,expiresAt:e.expiresAt,nonce:e.nonce,payload:new TextDecoder().decode(plain),opaque:false};}catch{throw Error('RELAY_INTEGRITY_FAILED');}};
