import type { OutboxItem } from '../../contracts/src/index.js';

export interface RelayEnvelope {
  protocolVersion: 1;
  senderDeviceId: string;
  recipient: 'server' | string;
  createdAt: string;
  expiresAt: string;
  nonce: string;
  payload: string;
  opaque: boolean;
}

export interface RelayTransport {
  readonly name: string;
  readonly local: boolean;
  available(): Promise<boolean>;
  send(envelope: RelayEnvelope): Promise<{ accepted: boolean; receiptId?: string }>;
}

export class LoopbackRelayTransport implements RelayTransport {
  readonly name = 'loopback';
  readonly local = true;
  async available(): Promise<boolean> { return true; }
  async send(envelope: RelayEnvelope): Promise<{ accepted: boolean; receiptId?: string }> {
    if (new Date(envelope.expiresAt).getTime() < Date.now()) return { accepted: false };
    return { accepted: true, receiptId: `loop_${envelope.nonce}` };
  }
}

export const envelopeForOutbox = (deviceId: string, item: OutboxItem): RelayEnvelope => ({
  protocolVersion: 1,
  senderDeviceId: deviceId,
  recipient: 'server',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  nonce: item.idempotencyKey,
  payload: JSON.stringify({ id: item.id, type: item.type, tenantId: item.tenantId, payload: item.payload }),
  opaque: false // devient true lorsque le chiffrement E2E du relay est branché.
});


export interface EncryptedRelayEnvelope extends Omit<RelayEnvelope,'payload'|'opaque'> {
  payload: string;
  opaque: true;
  algorithm: 'AES-GCM';
  iv: string;
  keyId: string;
}

const bytesToBase64=(bytes:Uint8Array):string=>{
  let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);
};
const base64ToBytes=(value:string):Uint8Array=>{
  const binary=atob(value),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;
};
const relayAad=(e:Pick<RelayEnvelope,'protocolVersion'|'senderDeviceId'|'recipient'|'createdAt'|'expiresAt'|'nonce'>):Uint8Array=>
  new TextEncoder().encode(JSON.stringify([e.protocolVersion,e.senderDeviceId,e.recipient,e.createdAt,e.expiresAt,e.nonce]));

export const generateRelayKey=async():Promise<{key:CryptoKey;keyId:string}>=>{
  if(!globalThis.crypto?.subtle)throw new Error('WEB_CRYPTO_REQUIRED');
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  const raw=new Uint8Array(await crypto.subtle.exportKey('raw',key));
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',raw));
  return{key,keyId:[...digest.slice(0,8)].map(x=>x.toString(16).padStart(2,'0')).join('')};
};

export const encryptRelayEnvelope=async(envelope:RelayEnvelope,key:CryptoKey,keyId:string):Promise<EncryptedRelayEnvelope>=>{
  if(!globalThis.crypto?.subtle)throw new Error('WEB_CRYPTO_REQUIRED');
  if(Date.parse(envelope.expiresAt)<=Date.now())throw new Error('RELAY_EXPIRED');
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:relayAad(envelope)},key,new TextEncoder().encode(envelope.payload));
  return{protocolVersion:envelope.protocolVersion,senderDeviceId:envelope.senderDeviceId,recipient:envelope.recipient,
    createdAt:envelope.createdAt,expiresAt:envelope.expiresAt,nonce:envelope.nonce,payload:bytesToBase64(new Uint8Array(cipher)),
    opaque:true,algorithm:'AES-GCM',iv:bytesToBase64(iv),keyId};
};

export const decryptRelayEnvelope=async(envelope:EncryptedRelayEnvelope,key:CryptoKey,expectedRecipient:string):Promise<RelayEnvelope>=>{
  if(!globalThis.crypto?.subtle)throw new Error('WEB_CRYPTO_REQUIRED');
  if(envelope.recipient!==expectedRecipient&&envelope.recipient!=='server')throw new Error('RELAY_WRONG_RECIPIENT');
  if(Date.parse(envelope.expiresAt)<=Date.now())throw new Error('RELAY_EXPIRED');
  try{
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(envelope.iv),additionalData:relayAad(envelope)},key,base64ToBytes(envelope.payload));
    return{protocolVersion:envelope.protocolVersion,senderDeviceId:envelope.senderDeviceId,recipient:envelope.recipient,
      createdAt:envelope.createdAt,expiresAt:envelope.expiresAt,nonce:envelope.nonce,payload:new TextDecoder().decode(plain),opaque:false};
  }catch{throw new Error('RELAY_INTEGRITY_FAILED');}
};
