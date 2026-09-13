import test from 'node:test';
import assert from 'node:assert/strict';
import {generateRelayKey,encryptRelayEnvelope,decryptRelayEnvelope} from '../.build/packages/relay/src/index.js';

test('encrypted relay envelope authenticates metadata and payload',async()=>{
  const {key,keyId}=await generateRelayKey();
  const envelope={protocolVersion:1,senderDeviceId:'device-a',recipient:'device-b',createdAt:new Date().toISOString(),
    expiresAt:new Date(Date.now()+60000).toISOString(),nonce:'n1',payload:'{"intent":"MEETING_NOTE"}',opaque:false};
  const encrypted=await encryptRelayEnvelope(envelope,key,keyId);
  assert.equal(encrypted.opaque,true);assert.equal(encrypted.algorithm,'AES-GCM');assert.notEqual(encrypted.payload,envelope.payload);
  const plain=await decryptRelayEnvelope(encrypted,key,'device-b');assert.equal(plain.payload,envelope.payload);
});

test('relay rejects wrong recipient and tampering',async()=>{
  const {key,keyId}=await generateRelayKey();
  const envelope={protocolVersion:1,senderDeviceId:'device-a',recipient:'device-b',createdAt:new Date().toISOString(),
    expiresAt:new Date(Date.now()+60000).toISOString(),nonce:'n2',payload:'sensitive intent',opaque:false};
  const encrypted=await encryptRelayEnvelope(envelope,key,keyId);
  await assert.rejects(()=>decryptRelayEnvelope(encrypted,key,'device-c'),/RELAY_WRONG_RECIPIENT/);
  const tampered={...encrypted,payload:encrypted.payload.slice(0,-2)+'AA'};
  await assert.rejects(()=>decryptRelayEnvelope(tampered,key,'device-b'),/RELAY_INTEGRITY_FAILED/);
});
