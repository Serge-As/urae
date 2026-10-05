import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('live stream migration resets stale browser sequence and avoids reconnect loops',()=>{
  const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
  const hub=fs.readFileSync('workers/api/src/group-live-hub.ts','utf8');
  assert.match(hub,/requestedAfter>latest/);
  assert.match(hub,/GROUP_LIVE_HELLO/);
  assert.match(hub,/effectiveAfter=reset\?0:requestedAfter/);
  assert.match(live,/if\(msg\.type==='GROUP_LIVE_HELLO'\)\{if\(msg\.reset\)lastSeq=0/);
  assert.match(live,/reconnectAttempt>=4/);
  assert.match(live,/\[1500,4500,12000,30000\]/);
  assert.match(live,/tentative '\+reconnectAttempt\+'\/4/);
});
