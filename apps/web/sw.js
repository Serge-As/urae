const CACHE = 'eco-system-v1451-field-corrections-20260922';
const APP_SHELL = [
  '/', '/index.html', '/styles.css', '/manifest.webmanifest',
  '/src/field-hardening.js', '/src/voice-entry-bootstrap.js', '/src/voice-entry-ui.js', '/src/expense-recap-ui.js', '/src/member-dossier-ui.js', '/src/documents-ui.js', '/src/contextual-group-ui.js',
  '/src/main.js', '/src/resilience-ui.js', '/src/group-home-ui.js', '/src/sessions-ui.js', '/src/blueprint-executable-ui.js', '/src/community-blueprint-presets.js', '/src/financial-lab-ui.js', '/src/i18n.js', '/src/runtime-i18n.js', '/src/completion-ui.js', '/src/advanced-ui.js', '/src/offline-snapshot.js', '/src/launch-rubrics.js', '/src/launch-studio.js', '/src/member-control-ui.js', '/src/identity-live-ui.js', '/src/community-shop-ui.js', '/src/misc-rubrics-ui.js', '/src/pairing-ui.js', '/src/detail-ui.js', '/src/personal-cockpit-ui.js', '/src/recap-ui.js', '/src/interest-community-ui.js', '/src/ad-manager-ui.js', '/src/tontine-manager-ui.js', '/src/savings-yield-ui.js', '/src/external-programs-ui.js', '/src/founder-control-ui.js', '/src/assistance-rulebook-ui.js',
  '/packages/rubrics/src/launch-config.js', '/packages/rubrics/src/index.js',
  '/packages/application/src/index.js', '/packages/completion/src/index.js', '/packages/contracts/src/index.js',
  '/packages/domain/src/index.js', '/packages/module-registry/src/index.js',
  '/packages/module-registry/src/service-capabilities.js', '/packages/offline/src/index.js',
  '/packages/platform-kernel/src/index.js', '/packages/relay/src/index.js',
  '/packages/repositories/src/index.js'
];

self.addEventListener('install', event => {
  // Old/low-memory Android must never lose an already working shell because one
  // optional asset failed while a new worker was installing. Seed each asset
  // independently and let activation happen naturally when the current client closes.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const path of APP_SHELL) {
      try {
        const response = await fetch(path, { cache: 'no-store' });
        if (response && response.ok) await cache.put(path, response.clone());
      } catch (_) {}
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const names = await caches.keys();
    for (const name of names) {
      if (name.startsWith('eco-system-') && name !== CACHE) {
        try { await caches.delete(name); } catch (_) {}
      }
    }
  })());
});

const cachedShell = async request => {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  return await cache.match(request, { ignoreSearch: true }) ||
         await cache.match(url.pathname, { ignoreSearch: true });
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

  // Online: prefer fresh HTML so cached old markup is never mixed with newer JavaScript.
  // Offline / unstable 2G: fall back quickly to the complete local shell.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('/index.html') || await cache.match('/');
      const freshWithTimeout=async()=>{
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2500);
        try{
          const fresh=await fetch(event.request,{cache:'no-store',signal:controller.signal});
          if(fresh.ok)await cache.put('/index.html',fresh.clone());
          return fresh.ok?fresh:null;
        }catch{return null;}finally{clearTimeout(timer);}
      };
      if(self.navigator?.onLine!==false){const fresh=await freshWithTimeout();if(fresh)return fresh;}
      if(cached)return cached;
      const fresh=await freshWithTimeout();if(fresh)return fresh;
      return new Response('<!doctype html><meta charset="utf-8"><title>Eco-System</title><h1>Eco-System</h1><p>Eco-System doit être installé ou transféré sur cet appareil avant une toute première utilisation sans Internet.</p>', { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
    })());
    return;
  }

  // Scripts/styles/assets are cache-first too, so an offline page never stalls
  // waiting for a network timeout. Refresh in background when possible.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cachedShell(event.request);
    if (cached) {
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(event.request, { cache: 'no-store' });
          if (fresh.ok) await cache.put(url.pathname, fresh.clone());
        } catch (_) {}
      })());
      return cached;
    }
    try {
      const fresh = await fetch(event.request, { cache: 'no-store' });
      if (fresh.ok) await cache.put(url.pathname, fresh.clone());
      return fresh;
    } catch (_) {
      return new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
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
