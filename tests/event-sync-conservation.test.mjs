import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
const app=fs.readFileSync('packages/application/src/index.ts','utf8');

test('free-plan finance sync is event-driven, not one-second D1 polling',()=>{
  assert.match(main,/if\(FREE_CONSERVATION_MODE\)return;/);
  assert.doesNotMatch(main,/setInterval\([^\n]*1000\)/);
  assert.match(main,/FREE_CONSERVATION_MODE\?\[150,550,1300\]/);
  assert.match(app,/eventCritical\?2200/);
});

test('Live WebSocket reconnects persistently and is not disabled merely by a D1 budget latch',()=>{
  assert.doesNotMatch(live,/reconnectAttempt>=4/);
  assert.match(live,/\[800,1800,4000,10000,30000\]/);
  const connectGuard=live.match(/if\(!wantConnection\|\|!app\.activeGroup\(\)\|\|typeof WebSocket==='undefined'[^\n]+/i)?.[0]??'';
  assert.ok(connectGuard,'connect guard missing');
  assert.doesNotMatch(connectGuard,/serverBudgetState/);
  assert.match(live,/app\.markLiveTransportHealthy\?\.\(\)/);
  assert.match(live,/eco:live-disconnected/);
});

test('online badge reports the actual Live channel rather than equating Internet with synchronization',()=>{
  assert.match(main,/En ligne · Live/);
  assert.match(main,/En ligne · connexion Live…/);
  assert.match(main,/eco:live-connected/);
  assert.match(main,/eco:live-disconnected/);
});

test('manual refresh and page reload persist exact financial navigation and horizontal table position',()=>{
  for(const token of ['matrixScrollLeft','individualScrollLeft','matrixMeetingId','membershipId','sheetMode'])assert.ok(main.includes(token),token+' must be persisted');
  assert.match(main,/pagehide[^\n]*persistCurrentNavigation/);
  assert.match(main,/beforeunload[^\n]*persistCurrentNavigation/);
  assert.match(main,/Données actualisées sans perdre votre position/);
});
