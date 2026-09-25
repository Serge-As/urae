import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw=fs.readFileSync('apps/web/sw.js','utf8');

test('new service worker refuses to install when any declared startup-shell asset is missing',()=>{
  assert.match(sw,/APP_SHELL/);
  assert.match(sw,/for \(let offset=0; offset<APP_SHELL\.length; offset\+=6\)/);
  assert.match(sw,/Promise\.all\(batch\.map/);
  assert.match(sw,/throw new Error\('RELEASE_ASSET_MISSING:'/);
  assert.match(sw,/RELEASE_ASSET_TIMEOUT/);
  assert.match(sw,/await response\.clone\(\)\.arrayBuffer\(\)/);
  assert.match(sw,/RELEASE_READY/);
});

test('online navigation is network-first while versioned release assets remain immutable in cache',()=>{
  assert.doesNotMatch(sw,/ignoreSearch\s*:\s*true/);
  assert.doesNotMatch(sw,/cache\.put\(url\.pathname,fresh/);
  assert.match(sw,/Online navigation is network-first/);
  assert.match(sw,/fetch\(event\.request, \{ cache:'no-store' \}\)/);
  assert.match(sw,/if\(url\.search\)return await cache\.match\(request\)/);
  assert.match(sw,/APP_SHELL\.includes\(url\.pathname\)/);
});

test('activation preserves previous coherent release and only skipWaits after RELEASE_READY is written',()=>{
  assert.match(sw,/PREVIOUS_CACHE/);
  assert.match(sw,/name !== CACHE && name !== PREVIOUS_CACHE/);
  const marker=sw.indexOf('await cache.put(RELEASE_READY');
  const skip=sw.indexOf('await self.skipWaiting()');
  assert.ok(marker>=0,'RELEASE_READY write missing');
  assert.ok(skip>marker,'skipWaiting must occur only after complete release marker');
});
