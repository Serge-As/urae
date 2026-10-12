import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('apps/web/index.html','utf8');
const sw=fs.readFileSync('apps/web/sw.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');

test('new preview release has one immutable 15216 shell identity across index, worker and builder',()=>{
  assert.match(sw,/const CACHE = 'eco-system-v15216-ux-cache-recovery-20261012'/);
  assert.match(sw,/const PREVIOUS_CACHE = 'eco-system-v15215-bounded-recovery-20261008'/);
  assert.match(build,/const RELEASE_VERSION='1\.5\.2\.16-ux-cache-recovery'/);
  for(const file of ['/styles.css','/src/ui-modes.js','/src/main.js']){
    assert.ok(html.includes(file+'?v=15216'),file+' index link');
    assert.ok(sw.includes(file+'?v=15216'),file+' precache link');
  }
  for(const file of ['/src/field-hardening.js','/src/voice-entry-bootstrap.js']){
    assert.ok(build.includes(file+'?v=15216'),file+' builder link');
    assert.ok(sw.includes(file+'?v=15216'),file+' precache link');
  }
  assert.doesNotMatch(html,/\?v=15215/);
  assert.doesNotMatch(build,/\?v=15215/);
  assert.doesNotMatch(sw,/\?v=15215/);
});

test('updates retain offline financial data and previous coherent cache',()=>{
  assert.match(sw,/name !== PREVIOUS_CACHE/);
  assert.match(sw,/cache\.put\(RELEASE_READY/);
  assert.match(sw,/await self\.skipWaiting\(\)/);
  assert.doesNotMatch(sw,/indexedDB\.deleteDatabase/);
  assert.doesNotMatch(sw,/localStorage\.clear\(/);
  assert.doesNotMatch(sw,/caches\.delete\(PREVIOUS_CACHE\)/);
});
