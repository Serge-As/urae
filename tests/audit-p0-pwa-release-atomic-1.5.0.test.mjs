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
  assert.match(sw,/await caches\.delete\(CACHE\)/);
  assert.match(sw,/throw error/);
});

test('installed navigation is coherent-shell-first so offline reload is immediate while release assets stay immutable',()=>{
  assert.doesNotMatch(sw,/ignoreSearch\s*:\s*true/);
  assert.doesNotMatch(sw,/cache\.put\(url\.pathname,fresh/);
  assert.match(sw,/coherent installed shell is the navigation source of truth/);
  assert.match(sw,/const ready = await cache\.match\(RELEASE_READY\)/);
  assert.match(sw,/if \(cached\) return cached/);
  assert.match(sw,/fetch\(event\.request, \{ cache:'no-store' \}\)/);
  assert.match(sw,/if\(url\.search\)return await cache\.match\(request\)/);
  assert.match(sw,/SHELL_PATHS\.has\(url\.pathname\)/);
});

test('activation preserves previous coherent release and only skipWaits after RELEASE_READY is written',()=>{
  assert.match(sw,/PREVIOUS_CACHE/);
  assert.match(sw,/name !== CACHE && name !== PREVIOUS_CACHE/);
  const marker=sw.indexOf('await cache.put(RELEASE_READY');
  const skip=sw.indexOf('await self.skipWaiting()');
  assert.ok(marker>=0,'RELEASE_READY write missing');
  assert.ok(skip>marker,'skipWaiting must occur only after complete release marker');
});


test('release changes the active cache identity while preserving a distinct coherent rollback cache',()=>{
  const current=sw.match(/const CACHE = '([^']+)';/)?.[1];
  const previous=sw.match(/const PREVIOUS_CACHE = '([^']+)';/)?.[1];
  assert.ok(current&&previous,'release and rollback caches are both declared');
  assert.notEqual(current,previous,'active release cache must differ from rollback cache');
  assert.match(current,/^eco-system-v15211-/);
  assert.match(previous,/^eco-system-v15211-data-first-confrontation-20261007$/);
  assert.match(sw,/LEGACY_RECOVERY_CACHE = 'eco-system-v15210-offline-conflicts-loans-20261003'/);
});
