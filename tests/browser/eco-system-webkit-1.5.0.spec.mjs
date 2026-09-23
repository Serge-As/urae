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

test('WebKit shell remains coherent offline after one installed visit',async({page,context})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{if('serviceWorker'in navigator){await navigator.serviceWorker.ready;}});
  await context.setOffline(true);
  // A fresh navigation exercises the installed Service Worker without relying on WebKit's
  // flaky offline page.reload path, which can raise an engine-level internal error.
  const offlinePage=await context.newPage();
  await offlinePage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await expect(offlinePage.locator('body')).toContainText('Eco-System');
  await expect(offlinePage.locator('#authScreen')).toBeVisible();
});
