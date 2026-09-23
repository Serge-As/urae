import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('home exposes visual senior and assisted modes before financial content',async()=>{
  const html=await readFile('.build/index.html','utf8');
  assert.match(html,/id="uiModePanel"/);
  assert.match(html,/value="visual"/);
  assert.match(html,/value="senior"/);
  assert.match(html,/value="assisted"/);
  assert.match(html,/Ouvrir la dictée financière/);
  assert.ok(html.indexOf('id="uiModePanel"')<html.indexOf('class="cahier-banner"'));
});

test('mode controller persists only the three supported modes and assisted mode opens voice entry',async()=>{
  const source=await readFile('.build/src/ui-modes.js','utf8');
  assert.match(source,/new Set\(\[\s*['"]visual['"]\s*,\s*['"]senior['"]\s*,\s*['"]assisted['"]\s*\]\)/);
  assert.match(source,/eco\.uiMode/);
  assert.match(source,/voiceFinancialPanel/);
  assert.match(source,/eco:ui-mode-changed/);
});

test('senior mode increases control sizes and prevents crushed navigation labels',async()=>{
  const css=await readFile('.build/styles.css','utf8');
  assert.match(css,/ui-mode-senior/);
  assert.match(css,/min-height:52px/);
  assert.match(css,/overflow-wrap:normal/);
  assert.match(css,/word-break:normal/);
  assert.match(css,/canonical-financial-wrap\{overflow-x:auto/);
});

test('service worker never falls back a versioned request to an unversioned stale asset',async()=>{
  const sw=await readFile('.build/sw.js','utf8');
  assert.match(sw,/eco-system-v153-value-market-closure-20260923/);
  assert.match(sw,/if\(url\.search\)return await cache\.match\(request\)/);
  assert.doesNotMatch(sw,/cache\.match\(request\) \|\| await cache\.match\(url\.pathname\)/);
  assert.match(sw,/\/src\/main\.js\?v=153/);
  assert.match(sw,/\/src\/ui-modes\.js\?v=153/);
});

test('authentication restores before showing login and supports a private-device session',async()=>{
  const html=await readFile('.build/index.html','utf8');
  const main=await readFile('.build/src/main.js','utf8');
  const auth=await readFile('.build/packages/auth/src/index.js','utf8');
  assert.match(html,/auth-restoring/);
  assert.match(html,/authRememberDevice/);
  assert.match(main,/document\.body\.classList\.add\('auth-restoring'\)/);
  assert.match(main,/rememberDevice/);
  assert.match(auth,/PRIVATE_SESSION_SECONDS/);
  assert.match(auth,/PRIVATE_IDLE_SECONDS/);
});
