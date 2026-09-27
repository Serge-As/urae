import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Forum v2 reuses the single proactive live channel and exposes WhatsApp-like typing',()=>{
  const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
  const forum=fs.readFileSync('apps/web/src/community-shop-ui.js','utf8');
  const api=fs.readFileSync('workers/api/src/index.ts','utf8');
  assert.match(live,/eco:live-event/);
  assert.doesNotMatch(forum,/new WebSocket\(/,'forum must not open a second websocket');
  assert.match(forum,/COMMUNITY_DRAFT/);assert.match(forum,/écrit…/);assert.match(forum,/publishLiveSignal\?\.\('TYPING'/);
  assert.match(api,/hubId:messageContext\.hubId,messageId,event:'REACTION_CHANGED'/);
  assert.match(api,/messageContext\.tenantId!==ctx\.tenantId\|\|messageContext\.groupId!==groupId/);
});

test('community realtime exposes message context without changing reaction toggle contract',()=>{
  const src=fs.readFileSync('packages/community-realtime/src/index.ts','utf8');
  assert.match(src,/async messageContext\(messageId:string\)/);
  assert.match(src,/Promise<\{active:boolean\}>/);
});
