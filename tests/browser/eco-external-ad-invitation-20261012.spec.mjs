import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4173';
test('externally invited advertiser opens actual standalone portal and submits one bounded proposal',async({page})=>{
 const secret='ad_invite_12345678-aaaa-bbbb-cccc-ffffffffffff.'+'c'.repeat(64);
 let requests=[],submitted;
 await page.route('**/api/v1/external-ads/groups/group-demo/invite',async route=>{
  const req=route.request();requests.push({method:req.method(),url:req.url(),secret:req.headers()['x-external-ad-token'],tenant:req.headers()['x-tenant-id']});
  if(req.method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({valid:true,expiresAt:'2099-01-01T00:00:00Z'})});
  submitted=req.postDataJSON();
  return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({id:'partner-ad-1',state:'SUBMITTED'})});
 });
 const params=new URLSearchParams({token:secret,group:'group-demo',tenant:'tenant-demo'});
 await page.goto(base+'/external-ad.html#'+params);
 await expect(page.locator('#externalAdForm')).toBeVisible();
 await page.locator('[name="title"]').fill('Atelier local');
 await page.locator('[name="headline"]').fill('Réparations utiles');
 await page.locator('[name="body"]').fill('Réservez votre réparation');
 await page.locator('[name="callToAction"]').fill('Voir le service');
 await page.locator('[name="destinationRef"]').fill('service:repair-1');
 await page.locator('#externalAdSend').click();
 await expect(page.locator('#externalAdForm')).toBeHidden();
 await expect(page.locator('#portalStatus')).toContainText('Proposition enregistrée');
 expect(submitted.title).toBe('Atelier local');
 expect(requests.every(x=>x.secret===secret&&x.tenant==='tenant-demo')).toBe(true);
 expect(requests.every(x=>!x.url.includes(secret))).toBe(true);
});
test('external portal does not expose submit form for missing or invalid invitation',async({page})=>{
 await page.goto(base+'/external-ad.html');
 await expect(page.locator('#externalAdForm')).toBeHidden();
 await expect(page.locator('#portalStatus')).toContainText('expiré');
});
