import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173';

test('1.5.2.6 shell installs completely, controls reload and survives offline without mixed assets',async({page,context})=>{
  test.setTimeout(90_000);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toContainText('Eco-System');

  const state=await page.evaluate(async()=>{
    if(!('serviceWorker' in navigator))return{supported:false};
    try{await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});}catch(error){return{supported:true,error:String(error)};}
    const started=Date.now();
    while(Date.now()-started<15_000){
      const reg=await navigator.serviceWorker.getRegistration('/');
      const names=await caches.keys();
      const cache=names.includes('eco-system-v1526-field-persistence-pc-mobile-20260925')
        ?await caches.open('eco-system-v1526-field-persistence-pc-mobile-20260925'):null;
      const ready=cache?Boolean(await cache.match('/__eco_release_ready__')):false;
      if(reg?.active&&ready)return{
        supported:true,ready:true,active:reg.active.state,waiting:reg.waiting?.state??'',
        installing:reg.installing?.state??'',controlled:Boolean(navigator.serviceWorker.controller),
        names,
        hits:await Promise.all([
          '/index.html','/styles.css?v=1526','/src/main.js?v=1526',
          '/src/ui-modes.js?v=1526','/src/field-hardening.js?v=1526',
          '/src/voice-entry-bootstrap.js?v=1526','/packages/application/src/index.js'
        ].map(async path=>Boolean(await cache.match(path))))
      };
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    const reg=await navigator.serviceWorker.getRegistration('/');
    return{supported:true,ready:false,active:reg?.active?.state??'',waiting:reg?.waiting?.state??'',installing:reg?.installing?.state??'',controlled:Boolean(navigator.serviceWorker.controller),names:await caches.keys()};
  });
  expect(state.supported).toBe(true);
  expect(state.ready,state).toBe(true);
  expect(state.hits).toEqual([true,true,true,true,true,true,true]);

  // skipWaiting activates a complete replacement without erasing local stores.
  await page.reload({waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller)),{timeout:10_000}).toBe(true);
  await expect(page.locator('script[src="/src/main.js?v=1526"]')).toHaveCount(1);

  // A preserved previous cache must not win online navigation over the current release.
  await page.evaluate(async()=>{
    const old=await caches.open('eco-system-v1523-financial-entry-offline-20260925');
    await old.put('/index.html',new Response('<!doctype html><title>STALE_1523</title><body>STALE_1523</body>',{headers:{'content-type':'text/html'}}));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).not.toContainText('STALE_1523');
  await expect(page.locator('script[src="/src/main.js?v=1526"]')).toHaveCount(1);

  // The complete current shell remains available after the network disappears.
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toContainText('Eco-System');
  await expect(page.locator('script[src="/src/main.js?v=1526"]')).toHaveCount(1);
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
