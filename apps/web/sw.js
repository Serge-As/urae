const CACHE = 'eco-system-v1528-geo-directory-20260928';
const PREVIOUS_CACHE = 'eco-system-v1527-live-completion-20260927';
const RELEASE_READY = '/__eco_release_ready__';

// Authentication, navigation and canonical application owners must be complete
// before this worker may install. Optional business/community panels can fail
// independently without replacing an already-working release.
const ESSENTIAL_SHELL = [
  '/', '/index.html', '/styles.css?v=1528', '/manifest.webmanifest',
  '/src/ui-modes.js?v=1528', '/src/field-hardening.js?v=1528', '/src/main.js?v=1528', '/src/i18n.js', '/src/runtime-i18n.js',
  '/src/resilience-ui.js', '/src/group-home-ui.js', '/src/sessions-ui.js',
  '/src/detail-ui.js', '/src/member-control-ui.js', '/src/loan-simulation-ui.js', '/src/business-studio-ui.js', '/src/core-economic-learning-ui.js',
  '/packages/application/src/index.js', '/packages/contracts/src/index.js',
  '/packages/domain/src/index.js', '/packages/offline/src/index.js',
  '/packages/platform-kernel/src/index.js', '/packages/relay/src/index.js',
  '/packages/repositories/src/index.js',
  '/src/sovereign-offline-ui.js',
  '/packages/offline-sovereign/src/index.js', '/packages/exercise/src/index.js',
  '/packages/relay/src/broadcast.js', '/packages/relay/src/qr-v10.js',
  '/packages/savings-yield/src/index.js', '/packages/recap-engine/src/index.js',
  '/packages/loan-simulator/src/index.js', '/packages/group-doctor/src/index.js'
];

const OPTIONAL_SHELL = [
  '/src/voice-entry-bootstrap.js?v=1528', '/src/voice-entry-ui.js', '/src/expense-recap-ui.js',
  '/src/member-dossier-ui.js', '/src/documents-ui.js', '/src/contextual-group-ui.js',
  '/src/blueprint-executable-ui.js', '/src/community-blueprint-presets.js',
  '/src/financial-lab-ui.js', '/src/completion-ui.js', '/src/advanced-ui.js',
  '/src/offline-snapshot.js', '/src/launch-rubrics.js', '/src/launch-studio.js',
  '/src/identity-live-ui.js', '/src/community-shop-ui.js', '/src/misc-rubrics-ui.js',
  '/src/pairing-ui.js', '/src/personal-cockpit-ui.js', '/src/recap-ui.js',
  '/src/interest-community-ui.js', '/src/ad-manager-ui.js', '/src/tontine-manager-ui.js',
  '/src/savings-yield-ui.js', '/src/external-programs-ui.js', '/src/founder-control-ui.js',
  '/src/assistance-rulebook-ui.js',
  '/src/starter-kit-ui.js',
  '/src/group-learning-registry-ui.js',
  '/src/role-directory-talent-ui.js', '/src/geolocation.js',
  '/src/role-directory-talent-ui.js', '/src/geolocation.js',
  '/packages/rubrics/src/launch-config.js', '/packages/rubrics/src/index.js',
  '/packages/completion/src/index.js', '/packages/module-registry/src/index.js',
  '/packages/module-registry/src/service-capabilities.js'
];
const APP_SHELL = [...ESSENTIAL_SHELL, ...OPTIONAL_SHELL];

const fetchReleaseAsset = async path => {
  const response = await Promise.race([
    fetch(path, { cache: 'no-store' }),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('RELEASE_ASSET_TIMEOUT:' + path)),8000))
  ]);
  if (!response || !response.ok) throw new Error('RELEASE_ASSET_MISSING:' + path);
  // Consume a clone now so an incomplete/aborted body cannot masquerade as cached.
  await response.clone().arrayBuffer();
  return response;
};

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // main.js statically imports several modules historically labelled optional.
    // A release is therefore coherent only after the whole declared shell is
    // fetched and stored. Download in bounded parallel batches for slow links.
    for (let offset=0; offset<APP_SHELL.length; offset+=6) {
      const batch=APP_SHELL.slice(offset,offset+6);
      const fetched=await Promise.all(batch.map(async path=>[path,await fetchReleaseAsset(path)]));
      for(const [path,response] of fetched)await cache.put(path,response.clone());
    }
    // Written strictly last: activation is forbidden for a partial shell.
    await cache.put(RELEASE_READY, new Response(JSON.stringify({cache:CACHE,installedAt:new Date().toISOString(),assets:APP_SHELL.length}), {
      headers:{'content-type':'application/json; charset=utf-8'}
    }));
    // Installation is atomic above; only now may this complete release replace a stale controller.
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    if (!await cache.match(RELEASE_READY)) throw new Error('RELEASE_NOT_READY');
    await self.clients.claim();
    const names = await caches.keys();
    // Keep one known previous coherent release for operator rollback/recovery.
    // Never delete the immediately previous cache during the same activation.
    for (const name of names) {
      if (name.startsWith('eco-system-') && name !== CACHE && name !== PREVIOUS_CACHE) {
        try { await caches.delete(name); } catch (_) {}
      }
    }
  })());
});

const cachedShell = async request => {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  // A versioned request must only match that exact version. Falling back from
  // main.js?v=1528 to an older /main.js was the source of mixed-release UI.
  if(url.search)return await cache.match(request);
  return await cache.match(url.pathname);
};

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // API reads are handled by the application snapshot layer. Do not synthesize
  // stale API responses in the Service Worker.
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Online navigation is network-first so Chrome/Opera profiles controlled by
  // an older worker can recover without deleting IndexedDB/outbox/site data.
  // Offline falls back to the complete cache of this exact release.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('/index.html') || await cache.match('/');
      // Always try the network first; navigator.onLine is not a reliable
      // connectivity oracle in workers. The bounded timeout preserves 2G/offline fallback.
      try {
        const fresh = await Promise.race([
          fetch(event.request, { cache:'no-store' }),
          new Promise((_,reject)=>setTimeout(()=>reject(new Error('NAVIGATION_TIMEOUT')),6000))
        ]);
        if (fresh && fresh.ok) return fresh;
      } catch (_) {}
      if (cached) return cached;
      try {
        const fresh = await fetch(event.request, { cache:'no-store' });
        if (fresh.ok) return fresh;
      } catch (_) {}
      return new Response('<!doctype html><meta charset="utf-8"><title>Eco-System</title><h1>Eco-System</h1><p>Eco-System doit être installé ou transféré sur cet appareil avant une toute première utilisation sans Internet.</p>', {
        status:503, headers:{'content-type':'text/html; charset=utf-8'}
      });
    })());
    return;
  }

  // Scripts/styles/assets are cache-first. Assets belonging to APP_SHELL are
  // immutable for the lifetime of this worker: there is no background refresh
  // into an active release cache.
  event.respondWith((async () => {
    const cached = await cachedShell(event.request);
    if (cached) return cached;

    if (APP_SHELL.includes(url.pathname)) {
      return new Response('Release asset unavailable', {status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
    }

    try { return await fetch(event.request, { cache:'no-store' }); }
    catch (_) { return new Response('Offline', {status:503,headers:{'content-type':'text/plain; charset=utf-8'}}); }
  })());
});

self.addEventListener('periodicsync',event=>{
  if(event.tag!=='eco-system-outbox')return;
  event.waitUntil((async()=>{
    for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({type:'ECO_SYSTEM_SYNC_OUTBOX',reason:'periodic'});
  })());
});

self.addEventListener('sync',event=>{
  if(event.tag!=='eco-system-outbox')return;
  event.waitUntil((async()=>{
    for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({type:'ECO_SYSTEM_SYNC_OUTBOX',reason:'background'});
  })());
});
