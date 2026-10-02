import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
const app=fs.readFileSync('packages/application/src/index.ts','utf8');

test('free conservation disables recurring D1 financial snapshot polling',()=>{
  assert.match(main,/FREE_CONSERVATION_MODE=true/);
  assert.match(main,/if\(FREE_CONSERVATION_MODE\)return;/);
  assert.doesNotMatch(main,/setInterval\(\(\)=>\{void pollCanonicalFinancialSnapshot\(\);\},1200\)/);
  const remote=main.slice(main.indexOf("window.addEventListener('eco:financial-live-update'"),main.indexOf('const refreshGroupContext'));
  assert.match(remote,/!FREE_CONSERVATION_MODE/);
});

test('healthy websocket has no 1.2 second REST catchup loop',()=>{
  assert.match(live,/socket\.readyState!==WebSocket\.OPEN/);
  assert.match(live,/30000/);
  assert.doesNotMatch(live,/\},1200\);/);
});

test('writer-side confirmed cell survives stale canonical refresh',()=>{
  assert.match(main,/FINANCIAL_CONFIRMED_STORAGE/);
  assert.match(main,/rememberConfirmedCell/);
  assert.match(main,/Same-version stale reads must never roll the writer back/);
  assert.match(main,/confirmedVersion/);
});

test('transient 429 503 504 projections reuse last-known-good cache and mutations can queue',()=>{
  assert.match(app,/\[429,503,504\]\.includes\(response\.status\)/);
  assert.match(app,/announceOfflineSnapshot/);
  assert.match(app,/throw new Error\('NETWORK_UNAVAILABLE'\)/);
});


test('free conservation freezes live socket and financial presence publishing',()=>{
  assert.match(main,/conservationMode: FREE_CONSERVATION_MODE/);
  assert.match(live,/GELÉ · mode gratuit/);
  assert.match(live,/if\(conservationMode\)/);
  assert.match(main,/const liveSignalsEnabled=!FREE_CONSERVATION_MODE/);
  assert.match(main,/if\(liveSignalsEnabled\)void app\.publishLiveSignal/);
});
