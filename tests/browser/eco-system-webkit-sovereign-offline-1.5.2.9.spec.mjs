import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173';

test('WebKit decodes an Eco QR with the bundled offline decoder and no BarcodeDetector dependency',async({page})=>{
  const response=await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  expect(response?.headers()['permissions-policy']??'').toContain('camera=(self)');
  expect(response?.headers()['content-security-policy']??'').toContain("worker-src 'self' blob:");
  const result=await page.evaluate(async()=>{
    const qr=await import('/packages/relay/src/qr-v10.js');
    const scanner=await import('/src/vendor/qr-scanner.min.js');
    const payload='ECOB1:abcdef123456:1:1:0123456789abcdef:SGVsbG9FY29TeXN0ZW0';
    const svg=qr.qrMatrixSvg(qr.qrV10LMatrix(payload),8,4);
    const uri='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    const decoded=await scanner.default.scanImage(uri,{returnDetailedScanResult:true});
    return{decoded:decoded.data,barcodeDetector:typeof window.BarcodeDetector!=='undefined'};
  });
  expect(result.decoded).toBe('ECOB1:abcdef123456:1:1:0123456789abcdef:SGVsbG9FY29TeXN0ZW0');
});

test('WebKit shell keeps sovereign offline and QR decoder assets cached for airplane mode',async({page,context})=>{
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});});
  await expect.poll(async()=>page.evaluate(async()=>{
    const names=await caches.keys(),name=names.find(x=>x.includes('v1529-sovereign-offline'));if(!name)return false;
    const c=await caches.open(name);
    return Boolean(await c.match('/__eco_release_ready__'));
  }),{timeout:20000}).toBe(true);
  const hits=await page.evaluate(async()=>{
    const name=(await caches.keys()).find(x=>x.includes('v1529-sovereign-offline')),c=await caches.open(name);
    const paths=['/src/sovereign-offline-ui.js','/src/vendor/qr-scanner.min.js','/src/vendor/qr-scanner-worker.min.js','/packages/offline-sovereign/src/index.js','/packages/exercise/src/index.js','/packages/relay/src/broadcast.js'];
    return Promise.all(paths.map(async p=>Boolean(await c.match(p))));
  });
  expect(hits).toEqual([true,true,true,true,true,true]);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#ecoRelaySovereignWorkspace')).toBeAttached();
  await context.setOffline(false);
});
