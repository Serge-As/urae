import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('packages/application/src/index.ts','utf8');
const main=fs.readFileSync('apps/web/src/main.js','utf8');
const index=fs.readFileSync('apps/web/index.html','utf8');
const sw=fs.readFileSync('apps/web/sw.js','utf8');
const manifest=JSON.parse(fs.readFileSync('apps/web/manifest.webmanifest','utf8'));

test('offline GET projections are generic and actor-scoped snapshots remain in use',()=>{
  assert.match(app,/return path==='\/api\/v1\/auth\/session'\|\|path\.startsWith\('\/api\/v1\/'\)/);
  assert.match(app,/offlineReadKey/);
  assert.match(app,/IndexedDbReadSnapshotAdapter/);
});

test('product catalog has an offline bundled fallback',()=>{
  assert.match(app,/version:'offline-bundled'/);
  assert.match(app,/const capabilities=this\.productModules\(\)/);
});

test('iOS Home Screen metadata is present without making iOS mandatory',()=>{
  assert.match(index,/apple-mobile-web-app-capable" content="yes"/);
  assert.match(index,/apple-mobile-web-app-status-bar-style" content="black-translucent"/);
  assert.match(index,/apple-mobile-web-app-title" content="Eco-System"/);
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.id,'/');
  assert.equal(manifest.scope,'/');
  assert.equal(manifest.orientation,'any');
  assert.equal(manifest.prefer_related_applications,false);
});

test('iOS users receive install guidance while other platforms keep beforeinstallprompt',()=>{
  assert.match(main,/const iosLike=/);
  assert.match(main,/showIosInstallGuide/);
  assert.match(main,/Sur l’écran d’accueil/);
  assert.match(main,/beforeinstallprompt/);
  assert.match(main,/navigator\.storage(?:\?\.|&&navigator\.storage\.)persist/);
});

test('offline loss of an optional section does not block Group Core',()=>{
  assert.match(main,/refreshOptionalOfflineSafe/);
  assert.match(main,/Offline optional section skipped/);
  assert.match(main,/navigator\.onLine/);
  assert.match(main,/NETWORK_UNAVAILABLE/);
});

test('service worker keeps a complete coherent shell and preserves one previous release',()=>{
  assert.match(sw,/eco-system-v1526-field-persistence-pc-mobile-20260925/);
  const current=sw.match(/const CACHE = '([^']+)';/)?.[1];
  const previous=sw.match(/const PREVIOUS_CACHE = '([^']+)';/)?.[1];
  assert.ok(current&&previous,'current and previous coherent caches are declared');
  assert.notEqual(current,previous,'rollback cache must differ from current release');
  assert.match(previous,/^eco-system-v\d+-/);
  for(const asset of ['/index.html','/styles.css?v=1526','/src/main.js?v=1526','/src/sessions-ui.js','/packages/application/src/index.js','/packages/offline/src/index.js'])assert.ok(sw.includes(asset),asset);
  assert.match(sw,/event\.request\.mode === 'navigate'/);
  assert.match(sw,/fetch\(event\.request, \{ cache:'no-store' \}\)/);
  assert.match(sw,/cache\.match\('\/index\.html'\)/);
  assert.match(sw,/RELEASE_READY/);
  assert.match(sw,/skipWaiting\(/);
  assert.doesNotMatch(main,/controllerchange[\s\S]{0,500}location\.reload\(/);
});
