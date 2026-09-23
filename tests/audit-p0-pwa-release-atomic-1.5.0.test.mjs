import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw=fs.readFileSync('apps/web/sw.js','utf8');

test('new service worker refuses to install when an essential release asset is missing',()=>{
  assert.match(sw,/ESSENTIAL_SHELL/);
  assert.match(sw,/Promise\.all\(ESSENTIAL_SHELL\.map/);
  assert.match(sw,/throw new Error\('RELEASE_ASSET_MISSING:'/);
  assert.match(sw,/RELEASE_READY/);
});

test('active release cache is immutable and does not mix fresh html with cached javascript',()=>{
  assert.doesNotMatch(sw,/ignoreSearch\s*:\s*true/);
  assert.doesNotMatch(sw,/cache\.put\(url\.pathname,fresh/);
  assert.match(sw,/Navigation is release-cache first/);
  assert.match(sw,/APP_SHELL\.includes\(url\.pathname\)/);
});

test('activation keeps the immediately previous coherent release and never force-takes waiting state',()=>{
  assert.match(sw,/PREVIOUS_CACHE/);
  assert.match(sw,/name !== CACHE && name !== PREVIOUS_CACHE/);
  assert.doesNotMatch(sw,/skipWaiting\(/);
});
