const CACHE = 'eco-system-cahier-app-v110';
const APP_SHELL = [
  '/', '/index.html', '/styles.css', '/manifest.webmanifest',
  '/src/main.js', '/src/i18n.js',
  '/packages/application/src/index.js', '/packages/contracts/src/index.js',
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
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
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

  // Static assets are stale-while-revalidate for low-data/offline use.
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
