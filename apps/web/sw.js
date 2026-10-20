// A new cache identity is mandatory, even for a patch-level app release.
const CACHE = 'eco-system-v15226-commercial-orders-20261020';
const PREVIOUS_CACHE = 'eco-system-v15225-assistant-tools-20261020';
const PRIOR_PERSONAL_COCKPIT_CACHE = 'eco-system-v15224-cockpit-continuity-20261020';
const PRIOR_RESOURCE_CACHE = 'eco-system-v15223-resource-proof-20261020';
const PRIOR_REHEARSAL_CACHE = 'eco-system-v15222-session-rehearsal-20261020';
const PRIOR_STABLE_NAVIGATION_CACHE = 'eco-system-v15221-navigation-stability-20261020';
const PRIOR_NAVIGATION_RELEASE_CACHE = 'eco-system-v15220-navigation-coherence-20261020';
const PRIOR_NAVIGATION_CACHE = 'eco-system-v15219-member-continuity-20261016';
const PRIOR_WORKSPACE_CACHE = 'eco-system-v15218-workspace-repair-20261015';
const PRIOR_COCKPIT_CACHE = 'eco-system-v15217-cockpit-continuity-20261015';
const PRIOR_REDESIGN_CACHE = 'eco-system-v15216-live-modes-refonte-20261013';
const PRIOR_CONVERGENCE_CACHE = 'eco-system-v15214-sovereign-convergence-20261008';
// Preserve the earlier coherent source line as well as the actual v15211 install.
const PRIOR_SOURCE_RECOVERY_CACHE = 'eco-system-v15213-live-repayment-ui-20261007';
const LEGACY_RECOVERY_CACHE = 'eco-system-v15210-offline-conflicts-loans-20261003';
// Public /health before this delivery still served v15211. Preserve that real
// installed predecessor as well as the prior source line and legacy recovery.
const INSTALLED_RECOVERY_CACHE = 'eco-system-v15211-field-recovery-20261005';
const RELEASE_READY = '/__eco_release_ready__';

// Authentication, navigation and canonical application owners must be complete
// before this worker may install. Optional business/community panels can fail
// independently without replacing an already-working release.
const ESSENTIAL_SHELL = [
  '/', '/index.html', '/styles.css?v=15226', '/manifest.webmanifest',
  '/src/ui-modes.js?v=15226', '/src/field-hardening.js?v=15226', '/src/main.js?v=15226', '/src/i18n.js', '/src/runtime-i18n.js',
  '/src/resilience-ui.js', '/src/group-home-ui.js', '/src/sessions-ui.js',
  '/src/detail-ui.js', '/src/member-control-ui.js', '/src/loan-simulation-ui.js', '/src/business-studio-ui.js', '/src/core-economic-learning-ui.js',
  '/packages/application/src/index.js', '/packages/contracts/src/index.js',
  '/packages/domain/src/index.js', '/packages/offline/src/index.js',
  '/packages/platform-kernel/src/index.js', '/packages/relay/src/index.js',
  '/packages/repositories/src/index.js',
  '/src/sovereign-offline-ui.js',
  '/packages/offline-sovereign/src/index.js', '/packages/exercise/src/index.js',
  '/packages/relay/src/broadcast.js', '/packages/relay/src/qr-v10.js', '/packages/relay/src/local-room.js',
  '/packages/savings-yield/src/index.js', '/packages/recap-engine/src/index.js',
  '/packages/loan-simulator/src/index.js', '/packages/group-doctor/src/index.js', '/packages/eco-numpad/src/index.js',
  '/src/vendor/qr-scanner.min.js', '/src/vendor/qr-scanner-worker.min.js'
];

const OPTIONAL_SHELL = [
  '/src/voice-entry-bootstrap.js?v=15226', '/src/voice-entry-ui.js', '/src/expense-recap-ui.js',
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
  '/packages/rubrics/src/launch-config.js', '/packages/rubrics/src/index.js',
  '/packages/completion/src/index.js', '/packages/module-registry/src/index.js',
  '/packages/module-registry/src/service-capabilities.js'
];
// scripts/pwa-shell-closure.mjs fills this build-time list with all direct and
// transitive local imports; an incomplete dependency graph prevents the build.
// The source worker keeps its original declarations for review and audit.
const GENERATED_IMPORT_CLOSURE = [];
const GENERATED_ASSET_HASHES = {};
const APP_SHELL = [...ESSENTIAL_SHELL, ...OPTIONAL_SHELL, ...GENERATED_IMPORT_CLOSURE];
const SHELL_PATHS = new Set(APP_SHELL.map(path=>new URL(path,self.location.origin).pathname));

const fetchReleaseAsset = async path => {
  const abort=typeof AbortController==='function'?new AbortController():null;
  let timer;
  try{
  const download=(async()=>{
  const response=await fetch(path,{cache:'no-store',...(abort?{signal:abort.signal}:{})});
  if (!response || !response.ok) throw new Error('RELEASE_ASSET_MISSING:' + path);
  // A 200 HTML fallback must never be accepted as a JavaScript module.
  // Missing or wrong MIME types leave the previously-ready cache untouched.
  const assetPath=new URL(path,self.location.origin).pathname;
  const returnedType=(response.headers.get('content-type')||'').toLowerCase();
  const jsAsset=/\.m?js$/i.test(assetPath);
  if(jsAsset&&!/(?:javascript|ecmascript)/.test(returnedType))throw new Error('RELEASE_ASSET_MIME:'+path+':'+returnedType);
  if(/\.css$/i.test(assetPath)&&!returnedType.includes('text/css'))throw new Error('RELEASE_ASSET_MIME:'+path+':'+returnedType);
  if(jsAsset&&response.url&&new URL(response.url).pathname!==assetPath)throw new Error('RELEASE_ASSET_REDIRECT:'+path);
  // Consume a clone now so an incomplete/aborted body cannot masquerade as cached.
  const bytes=await response.clone().arrayBuffer(),expected=GENERATED_ASSET_HASHES[assetPath];
  if(expected&&self.crypto?.subtle){
    const digest=await self.crypto.subtle.digest('SHA-256',bytes),hash=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!==expected)throw new Error('RELEASE_ASSET_INTEGRITY:'+path);
  }
  return response;
  })();
  // Bound the WHOLE body, not just response headers. A 2G download needs a
  // longer window; abandoning a candidate never touches the installed release.
  return await Promise.race([download,new Promise((_,reject)=>{timer=setTimeout(()=>{abort?.abort();reject(new Error('RELEASE_ASSET_TIMEOUT:'+path));},90000);})]);
  }finally{if(timer)clearTimeout(timer);}
};

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // A fresh cache identity is essential: never partially overwrite the
    // cache currently controlling users on an unreliable 2G connection.
    const cache = await caches.open(CACHE);
    try {
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
    // Activation follows the completed cache marker; the page controllerchange
    // handler must never reload an editing session or discard its Outbox.
    await self.skipWaiting();
    } catch (error) {
      // Roll back an incomplete candidate ONLY. Never delete the previous
      // release cache, IndexedDB, Outbox, drafts, or any canonical financial data.
      await caches.delete(CACHE);
      throw error;
    }
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
      if (name.startsWith('eco-system-') && name !== CACHE && name !== PREVIOUS_CACHE && name !== PRIOR_PERSONAL_COCKPIT_CACHE && name !== PRIOR_RESOURCE_CACHE && name !== PRIOR_REHEARSAL_CACHE && name !== PRIOR_STABLE_NAVIGATION_CACHE && name !== PRIOR_NAVIGATION_RELEASE_CACHE && name !== PRIOR_NAVIGATION_CACHE && name !== PRIOR_WORKSPACE_CACHE && name !== PRIOR_REDESIGN_CACHE && name !== PRIOR_COCKPIT_CACHE && name !== LEGACY_RECOVERY_CACHE && name !== INSTALLED_RECOVERY_CACHE && name !== PRIOR_SOURCE_RECOVERY_CACHE && name !== PRIOR_CONVERGENCE_CACHE) {
        try { await caches.delete(name); } catch (_) {}
      }
    }
  })());
});

const cachedShell = async request => {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  // A versioned request must only match that exact version. Falling back from
  // main.js?v=15226 to an older /main.js was the source of mixed-release UI.
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

  // The coherent installed shell is the navigation source of truth. Returning
  // it immediately makes F5/reload deterministic while fully offline instead of
  // waiting several seconds for a doomed network navigation. Release updates are
  // handled atomically by service-worker update/install, never by mutating this cache.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const cache = await caches.open(CACHE);
        const ready = await cache.match(RELEASE_READY);
        const cached = ready && (await cache.match('/index.html') || await cache.match('/'));
        if (cached) return cached;
      } catch (_) {
        // CacheStorage failures must not reject respondWith (Chromium ERR_FAILED).
        // Pending financial data is stored independently and is never cleared.
      }
      try {
        const fresh = await fetch(event.request, { cache:'no-store' });
        if (fresh && fresh.ok) return fresh;
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

    // Never fetch an unknown query-version of a declared shell asset from
    // network: that would load a different JS version into the offline release.
    if (SHELL_PATHS.has(url.pathname)) {
      return new Response('Release asset unavailable', {status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
    }

    try { return await fetch(event.request, { cache:'no-store' }); }
    catch (_) { return new Response('Offline', {status:503,headers:{'content-type':'text/plain; charset=utf-8'}}); }
  })());
});

self.addEventListener('sync',event=>{
  if(event.tag!=='eco-system-outbox')return;
  event.waitUntil((async()=>{
    for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({type:'ECO_SYSTEM_SYNC_OUTBOX',reason:'background'});
  })());
});
