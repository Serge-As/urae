import {test,expect} from '@playwright/test';
import fs from 'node:fs';

const swSource=fs.readFileSync('apps/web/sw.js','utf8');
const htmlSource=fs.readFileSync('apps/web/index.html','utf8');
const CURRENT_CACHE=swSource.match(/const CACHE = '([^']+)'/)?.[1];
const MAIN_SRC=htmlSource.match(/<script type="module" src="(\/src\/main\.js\?v=\d+)"><\/script>/)?.[1];
const VERSION_TAG=MAIN_SRC?.match(/\?v=(\d+)/)?.[1];
if(!CURRENT_CACHE||!MAIN_SRC||!VERSION_TAG)throw new Error('RELEASE_SHELL_IDENTITY_NOT_FOUND');
const base='http://127.0.0.1:4173';

test('Eco-System opens in WebKit/iPhone viewport and keeps primary controls usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toContainText('Eco-System');
  await expect(page.locator('#authSubmit')).toBeVisible();
  const box=await page.locator('#authSubmit').boundingBox();
  expect(box?.height??0).toBeGreaterThanOrEqual(44);
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content','yes');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','/manifest.webmanifest');
});

test('WebKit PWA shell installs current release atomically and survives offline',async({page,context})=>{
  test.setTimeout(90_000);
  await page.goto(base+'/',{waitUntil:'networkidle'});
  const state=await page.evaluate(async({cacheName,versionTag})=>{
    if(!('serviceWorker' in navigator))return{supported:false};
    await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
    const started=Date.now();
    while(Date.now()-started<15_000){
      const names=await caches.keys(),cache=names.includes(cacheName)?await caches.open(cacheName):null;
      const ready=cache?Boolean(await cache.match('/__eco_release_ready__')):false;
      if(ready)return{supported:true,ready,names,hits:await Promise.all([
        '/index.html','/styles.css?v='+versionTag,'/src/main.js?v='+versionTag,
        '/src/voice-entry-bootstrap.js?v='+versionTag,'/src/geolocation.js','/packages/application/src/index.js'
      ].map(async path=>Boolean(await cache.match(path))))};
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    return{supported:true,ready:false,names:await caches.keys()};
  },{cacheName:CURRENT_CACHE,versionTag:VERSION_TAG});
  expect(state.supported).toBe(true);expect(state.ready,state).toBe(true);expect(state.names).toContain(CURRENT_CACHE);expect(state.hits).toEqual([true,true,true,true,true,true]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker?.controller)),{timeout:10_000}).toBe(true);
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('body')).toContainText('Eco-System');await context.setOffline(false);
});

test('English locale is applied from first screen in WebKit and can switch back to French',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('tontine.locale','en'));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('#authScreen')).toContainText(/Sign in|Create an account|Create account/i);
  await expect(page.locator('button[data-view="dashboard"]')).toContainText('Home');
  await page.evaluate(()=>{
    const select=document.querySelector('#languageSelect');if(!select)throw new Error('LANGUAGE_SELECT_MISSING');
    select.value='fr';select.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await expect(page.locator('button[data-view="dashboard"]')).toContainText('Accueil');
});

test('voice and GPS use progressive enhancement instead of assuming iOS capabilities',async({page})=>{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const support=await page.evaluate(()=>({
    mediaRecorder:typeof MediaRecorder!=='undefined',
    getUserMedia:Boolean(navigator.mediaDevices?.getUserMedia),
    geolocation:Boolean(navigator.geolocation),
    secure:window.isSecureContext
  }));
  expect(typeof support.mediaRecorder).toBe('boolean');
  expect(typeof support.getUserMedia).toBe('boolean');
  expect(typeof support.geolocation).toBe('boolean');
  const voice=fs.readFileSync('apps/web/src/voice-entry-ui.ts','utf8'),geo=fs.readFileSync('apps/web/src/geolocation.js','utf8');
  expect(voice).toMatch(/typeof MediaRecorder==='undefined'\|\|!navigator\.mediaDevices\?\.getUserMedia/);
  expect(voice).toMatch(/VOICE_TRANSCRIPTION_UNAVAILABLE/);
  expect(geo).toMatch(/isSecureContext/);expect(geo).toMatch(/GEO_PERMISSION_DENIED/);
});
