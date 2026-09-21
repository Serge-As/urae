const CACHE = 'eco-system-v146-sessions-community-blueprint-final-20260921';
const APP_SHELL = [
  '/', '/index.html', '/styles.css', '/manifest.webmanifest',
  '/src/field-hardening.js', '/src/voice-entry-bootstrap.js', '/src/voice-entry-ui.js', '/src/expense-recap-ui.js', '/src/member-dossier-ui.js', '/src/documents-ui.js', '/src/contextual-group-ui.js',
  '/src/main.js', '/src/group-home-ui.js', '/src/sessions-ui.js', '/src/blueprint-executable-ui.js', '/src/community-blueprint-presets.js', '/src/financial-lab-ui.js', '/src/i18n.js', '/src/runtime-i18n.js', '/src/completion-ui.js', '/src/advanced-ui.js', '/src/offline-snapshot.js', '/src/launch-rubrics.js', '/src/launch-studio.js', '/src/member-control-ui.js', '/src/identity-live-ui.js', '/src/community-shop-ui.js', '/src/misc-rubrics-ui.js', '/src/pairing-ui.js', '/src/detail-ui.js', '/src/personal-cockpit-ui.js', '/src/recap-ui.js', '/src/interest-community-ui.js', '/src/ad-manager-ui.js', '/src/tontine-manager-ui.js', '/src/savings-yield-ui.js', '/src/external-programs-ui.js', '/src/founder-control-ui.js', '/src/assistance-rulebook-ui.js',
  '/packages/rubrics/src/launch-config.js', '/packages/rubrics/src/index.js',
  '/packages/application/src/index.js', '/packages/completion/src/index.js', '/packages/contracts/src/index.js',
  '/packages/domain/src/index.js', '/packages/module-registry/src/index.js',
  '/packages/module-registry/src/service-capabilities.js', '/packages/offline/src/index.js',
  '/packages/platform-kernel/src/index.js', '/packages/relay/src/index.js',
  '/packages/repositories/src/index.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('eco-system-') && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigations are network-first so a newly deployed Cahier App is visible immediately.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (response.ok) await cache.put('/index.html', response.clone());
        return response;
      } catch {
        return (await cache.match('/index.html')) ?? new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Executable modules/styles must match the newly loaded HTML; fall back only when offline.
  if (['script','style'].includes(event.request.destination)) {
    event.respondWith((async () => {
      const cache=await caches.open(CACHE);
      try { const response=await fetch(event.request,{cache:'no-store'}); if(response.ok)await cache.put(url.pathname,response.clone()); return response; }
      catch { return await cache.match(event.request,{ignoreSearch:true}) ?? new Response('Offline',{status:503}); }
    })());
    return;
  }
  // Other static assets are stale-while-revalidate for low-data/offline use.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request, { ignoreSearch: true });
    const network = fetch(event.request).then(async response => {
      if (response.ok) await cache.put(url.pathname, response.clone());
      return response;
    });
    if (cached) { event.waitUntil(network.catch(() => undefined)); return cached; }
    try { return await network; }
    catch { return new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
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
