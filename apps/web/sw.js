const CACHE = 'eco-system-v1525-core-abc-20260925';
const PREVIOUS_CACHE = 'eco-system-v1523-financial-entry-offline-20260925';
const RELEASE_READY = '/__eco_release_ready__';
const BUILD_STARTUP_SHELL = [];
const RELEASE_FETCH_TIMEOUT_MS = 10000;
const RELEASE_FETCH_CONCURRENCY = 4;

// Authentication, navigation and canonical application owners must be complete
// before this worker may install. Optional business/community panels can fail
// independently without replacing an already-working release.
const ESSENTIAL_SHELL = Array.from(new Set([
  '/', '/index.html', '/styles.css?v=1523', '/manifest.webmanifest',
  '/src/ui-modes.js?v=1523', '/src/field-hardening.js?v=1523', '/src/main.js?v=1523', '/src/i18n.js', '/src/runtime-i18n.js',
  '/src/resilience-ui.js', '/src/group-home-ui.js', '/src/sessions-ui.js',
  '/src/detail-ui.js', '/src/member-control-ui.js', '/src/loan-simulation-ui.js', '/src/business-studio-ui.js', '/src/core-economic-learning-ui.js',
  '/packages/application/src/index.js', '/packages/contracts/src/index.js',
  '/packages/domain/src/index.js', '/packages/offline/src/index.js',
  '/packages/platform-kernel/src/index.js', '/packages/relay/src/index.js',
  '/packages/repositories/src/index.js',
  ...BUILD_STARTUP_SHELL
]));

const OPTIONAL_SHELL = [
  '/src/voice-entry-bootstrap.js?v=1523', '/src/voice-entry-ui.js', '/src/expense-recap-ui.js',
  '/src/member-dossier-ui.js', '/src/documents-ui.js', '/src/contextual-group-ui.js',
  '/src/blueprint-executable-ui.js', '/src/community-blueprint-presets.js',
  '/src/financial-lab-ui.js', '/src/completion-ui.js', '/src/advanced-ui.js',
  '/src/offline-snapshot.js', '/src/launch-rubrics.js', '/src/launch-studio.js',
  '/src/identity-live-ui.js', '/src/community-shop-ui.js', '/src/misc-rubrics-ui.js',
  '/src/pairing-ui.js', '/src/personal-cockpit-ui.js', '/src/recap-ui.js',
  '/src/interest-community-ui.js', '/src/ad-manager-ui.js', '/src/tontine-manager-ui.js',
  '/src/savings-yield-ui.js', '/src/external-programs-ui.js', '/src/founder-control-ui.js',
  '/src/assistance-rulebook-ui.js',
  '/packages/rubrics/src/launch-config.js', '/packages/rubrics/src/index.js',
  '/packages/completion/src/index.js', '/packages/module-registry/src/index.js',
  '/packages/module-registry/src/service-capabilities.js'
];
const APP_SHELL = [...ESSENTIAL_SHELL, ...OPTIONAL_SHELL];

const cacheReleaseAsset = async (cache, path) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELEASE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(path, { cache: 'no-store', signal: controller.signal });
    if (!response || !response.ok) throw new Error('RELEASE_ASSET_MISSING:' + path + ':' + (response?.status ?? 'NO_RESPONSE'));
    // Consume the complete body before starting more work. Keeping many
    // unconsumed responses open can exhaust the per-origin connection pool and
    // leave an install event stuck forever on weak or constrained networks.
    const body = await response.arrayBuffer();
    const stored = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });
    await cache.put(path, stored);
  } catch (error) {
    if (controller.signal.aborted) throw new Error('RELEASE_ASSET_TIMEOUT:' + path);
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const cacheReleaseAssets = async (cache, paths, { optional = false } = {}) => {
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= paths.length) return;
      const path = paths[index];
      try {
        await cacheReleaseAsset(cache, path);
      } catch (error) {
        if (!optional) throw error;
      }
    }
  };
  const workers = Array.from(
    { length: Math.min(RELEASE_FETCH_CONCURRENCY, Math.max(paths.length, 1)) },
    () => worker()
  );
  await Promise.all(workers);
};

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cache required startup assets with bounded concurrency. Each response body
    // is fully consumed and written before the worker takes another URL.
    // RELEASE_READY is still written last, so a partial install can never be
    // activated as a coherent release.
    await cache.delete(RELEASE_READY);
    await cacheReleaseAssets(cache, ESSENTIAL_SHELL);
    await cacheReleaseAssets(cache, OPTIONAL_SHELL, { optional: true });
    await cache.put(RELEASE_READY, new Response(JSON.stringify({cache:CACHE,installedAt:new Date().toISOString()}), {
      headers:{'content-type':'application/json; charset=utf-8'}
    }));
    // The complete coherent shell is now cached. Promote this worker immediately
    // so a stale Chrome/Opera tab cannot pin an older release indefinitely.
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
  // main.js?v=1523 to an older /main.js was the source of mixed-release UI.
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

  // Offline / unstable 2G: fall back quickly to the complete local shell.
  // Navigation is release-cache first even while online: fresh HTML must never
  // be combined with JavaScript from a different active worker release.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('/index.html') || await cache.match('/');
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
