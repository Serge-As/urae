const CACHE = 'eco-system-master-cockpit-20260911-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css?v=master-20260911',
  '/manifest.webmanifest?v=master-20260911',
  '/src/main.js?v=master-20260911',
  '/src/i18n.js',
  '/packages/application/src/index.js',
  '/packages/contracts/src/index.js',
  '/packages/domain/src/index.js',
  '/packages/module-registry/src/index.js',
  '/packages/module-registry/src/service-capabilities.js',
  '/packages/offline/src/index.js',
  '/packages/platform-kernel/src/index.js',
  '/packages/relay/src/index.js',
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
    for (const name of await caches.keys()) {
      if (name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ??
      (fallbackPath ? await cache.match(fallbackPath) : undefined) ??
      new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(networkFirst(event.request, '/index.html'));
    return;
  }

  const freshCritical =
    url.pathname === '/styles.css' ||
    url.pathname === '/src/main.js' ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/sw.js';

  if (freshCritical) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    return networkFirst(event.request);
  })());
});
