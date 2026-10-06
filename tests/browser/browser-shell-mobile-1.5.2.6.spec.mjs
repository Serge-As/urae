import {test,expect} from '@playwright/test';
import fs from 'node:fs';

const swSource=fs.readFileSync('apps/web/sw.js','utf8');
const htmlSource=fs.readFileSync('apps/web/index.html','utf8');
const CURRENT_CACHE=swSource.match(/const CACHE = '([^']+)'/)?.[1];
const PREVIOUS_CACHE=swSource.match(/const PREVIOUS_CACHE = '([^']+)'/)?.[1];
const MAIN_SRC=htmlSource.match(/<script type="module" src="(\/src\/main\.js\?v=\d+)"><\/script>/)?.[1];
const VERSION_TAG=MAIN_SRC?.match(/\?v=(\d+)/)?.[1];
if(!CURRENT_CACHE||!MAIN_SRC||!VERSION_TAG)throw new Error('RELEASE_SHELL_IDENTITY_NOT_FOUND');

const base='http://127.0.0.1:4173';

test('current shell installs completely, controls reload and survives offline without mixed assets',async({page,context})=>{
  test.setTimeout(90_000);
  // Seed a coherent 1.5.2.10 cache + local storage before first app load.
  // No Service Worker is registered on the /health JSON page.
  await page.goto(base+'/health',{waitUntil:'domcontentloaded'});
  await page.evaluate(async(previousCache)=>{
    const old=await caches.open(previousCache);
    await old.put('/index.html',new Response('<!doctype html><title>OLD_15210</title><body>OLD_15210</body>',{headers:{'content-type':'text/html'}}));
    await old.put('/__eco_release_ready__',new Response(JSON.stringify({cache:previousCache,installedAt:'2026-10-03'})));
    localStorage.setItem('eco:release-qa-outbox-marker','outbox-must-survive');
    await new Promise((resolve,reject)=>{
      const request=indexedDB.open('eco-release-qa',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('outbox');
      request.onerror=()=>reject(request.error);
      request.onsuccess=()=>{
        const db=request.result,tx=db.transaction('outbox','readwrite');
        tx.objectStore('outbox').put({amount:1000,status:'PENDING'},'pending-cell');
        tx.oncomplete=()=>{db.close();resolve();};
        tx.onerror=()=>reject(tx.error);
      };
    });
  },PREVIOUS_CACHE);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toContainText('Eco-System');

  const state=await page.evaluate(async({currentCache,versionTag})=>{
    if(!('serviceWorker' in navigator))return{supported:false};
    try{await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});}catch(error){return{supported:true,error:String(error)};}
    const started=Date.now();
    while(Date.now()-started<15_000){
      const reg=await navigator.serviceWorker.getRegistration('/');
      const names=await caches.keys();
      const cache=names.includes(currentCache)?await caches.open(currentCache):null;
      const ready=cache?Boolean(await cache.match('/__eco_release_ready__')):false;
      if(reg?.active&&ready)return{
        supported:true,ready:true,active:reg.active.state,waiting:reg.waiting?.state??'',
        installing:reg.installing?.state??'',controlled:Boolean(navigator.serviceWorker.controller),
        names,
        hits:await Promise.all([
          '/index.html','/styles.css?v='+versionTag,'/src/main.js?v='+versionTag,
          '/src/ui-modes.js?v='+versionTag,'/src/field-hardening.js?v='+versionTag,
          '/src/voice-entry-bootstrap.js?v='+versionTag,'/packages/application/src/index.js'
        ].map(async path=>Boolean(await cache.match(path))))
      };
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    const reg=await navigator.serviceWorker.getRegistration('/');
    return{supported:true,ready:false,active:reg?.active?.state??'',waiting:reg?.waiting?.state??'',installing:reg?.installing?.state??'',controlled:Boolean(navigator.serviceWorker.controller),names:await caches.keys()};
  },{currentCache:CURRENT_CACHE,versionTag:VERSION_TAG});
  expect(state.supported).toBe(true);
  expect(state.ready,state).toBe(true);
  expect(state.hits).toEqual([true,true,true,true,true,true,true]);

  // skipWaiting activates a complete replacement without erasing local stores.
  await page.reload({waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller)),{timeout:10_000}).toBe(true);
  await expect(page.locator(`script[src="${MAIN_SRC}"]`)).toHaveCount(1);

  // A preserved previous cache must not win online navigation over the current release.
  await page.evaluate(async()=>{
    const old=await caches.open('eco-system-v1523-financial-entry-offline-20260925');
    await old.put('/index.html',new Response('<!doctype html><title>STALE_1523</title><body>STALE_1523</body>',{headers:{'content-type':'text/html'}}));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).not.toContainText('STALE_1523');
  await expect(page.locator(`script[src="${MAIN_SRC}"]`)).toHaveCount(1);

  // The complete current shell remains available after the network disappears.
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toContainText('Eco-System');
  await expect(page.locator(`script[src="${MAIN_SRC}"]`)).toHaveCount(1);
  const retained=await page.evaluate(async({currentCache,previousCache})=>{
    const old=await caches.open(previousCache),current=await caches.open(currentCache);
    const index=await old.match('/index.html'),newIndex=await current.match('/index.html');
    const db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open('eco-release-qa',1);
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    const local=await new Promise((resolve,reject)=>{
      const r=db.transaction('outbox','readonly').objectStore('outbox').get('pending-cell');
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    db.close();
    return {old:await index?.text(),next:await newIndex?.text(),local,marker:localStorage.getItem('eco:release-qa-outbox-marker')};
  },{currentCache:CURRENT_CACHE,previousCache:PREVIOUS_CACHE});
  expect(retained.old).toContain('OLD_15210');
  expect(retained.next).toContain('Eco-System');
  expect(retained.marker).toBe('outbox-must-survive');
  expect(retained.local).toEqual({amount:1000,status:'PENDING'});
  await context.setOffline(false);
});

test('phone visual mode keeps financial controls compact while validation remains finger-sized',async({page})=>{
  await page.setViewportSize({width:360,height:740});
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const metrics=await page.evaluate(()=>{
    const host=document.createElement('div');
    host.className='matrix-cell-entry';
    host.innerHTML='<strong class="cell-current">1 000 F CFA</strong><input class="cell-target-input"><button class="cell-validate">✓</button><small class="cell-sync-state pending">Enregistré sur cet appareil · synchro en attente</small>';
    document.body.append(host);
    const input=host.querySelector('.cell-target-input'),button=host.querySelector('.cell-validate');
    const h=host.getBoundingClientRect(),ib=input.getBoundingClientRect(),bb=button.getBoundingClientRect();
    const banner=document.createElement('div');banner.className='financial-alert-bar is-critical';banner.textContent='Séance clôturée modifiée · Consultez l’historique et les nouvelles valeurs.';document.body.append(banner);
    const bs=getComputedStyle(banner),hs=banner.getBoundingClientRect();
    return{hostWidth:h.width,inputHeight:ib.height,buttonWidth:bb.width,buttonHeight:bb.height,bannerHeight:hs.height,bannerFont:parseFloat(bs.fontSize)};
  });
  expect(metrics.buttonWidth).toBeGreaterThanOrEqual(44);
  expect(metrics.buttonHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.inputHeight).toBeLessThanOrEqual(44);
  expect(metrics.bannerFont).toBeLessThanOrEqual(13);
  expect(metrics.bannerHeight).toBeLessThan(90);
});
