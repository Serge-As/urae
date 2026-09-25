import {test,expect} from '@playwright/test';

test('Eco-System opens in WebKit at 320px and keeps primary controls usable',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toContainText('Eco-System');
  await expect(page.locator('#authSubmit')).toBeVisible();
  const box=await page.locator('#authSubmit').boundingBox();
  expect(box?.height??0).toBeGreaterThanOrEqual(44);
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content','yes');
});

test('WebKit installed PWA shell is controlled and fully cached after one visit',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{if('serviceWorker'in navigator){await navigator.serviceWorker.ready;}});
  await page.reload({waitUntil:'domcontentloaded'});
  const state=await page.evaluate(async()=>{
    const controlled=Boolean(navigator.serviceWorker?.controller);
    const keys=await caches.keys();
    const cache=await caches.open('eco-system-v1522-governed-field-feedback-20260923');
    const paths=['/index.html','/styles.css?v=1522','/src/main.js?v=1522','/src/ui-modes.js?v=1522','/src/field-hardening.js?v=1522','/src/voice-entry-bootstrap.js?v=1522'];
    const hits=await Promise.all(paths.map(async path=>Boolean(await cache.match(path))));
    return{controlled,keys,paths,hits};
  });
  expect(state.controlled).toBe(true);
  expect(state.keys).toContain('eco-system-v1522-governed-field-feedback-20260923');
  expect(state.hits).toEqual([true,true,true,true,true,true]);
  await expect(page.locator('body')).toContainText('Eco-System');
  await expect(page.locator('#authScreen')).toBeVisible();
});
