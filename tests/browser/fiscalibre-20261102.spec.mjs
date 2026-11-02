import {test,expect} from '@playwright/test';
import {pbkdf2Sync} from 'node:crypto';
import {createServer} from 'node:https';
import {mkdtemp,readFile,unlink,rmdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fiscalibreFetch} from '../../.build/workers/api/src/fiscalibre-host.js';
test.setTimeout(180000);
test.use({ignoreHTTPSErrors:true});
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173';
let server,privateOrigin,certificateFolder;
const password='synthetic-browser-password',salt='synthetic-browser-salt';
test.beforeAll(async()=>{
 certificateFolder=await mkdtemp(join(tmpdir(),'fiscalibre-https-synthetic-'));
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=localhost','-addext','subjectAltName=IP:127.0.0.1,DNS:localhost','-keyout',join(certificateFolder,'key.pem'),'-out',join(certificateFolder,'cert.pem')],{stdio:'ignore'});
 const env={AUTH_LIVE_SIGNING_SECRET:'synthetic-browser-signing-secret-only',RELEASE_COMMIT_SHA:'f'.repeat(40),FISCALIBRE_TEST_VERIFIER:{salt,verifier:pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex')}};
 server=createServer({key:await readFile(join(certificateFolder,'key.pem')),cert:await readFile(join(certificateFolder,'cert.pem'))},async(q,res)=>{
  try{
   const parts=[];for await(const chunk of q)parts.push(chunk);
   const response=q.url.startsWith('/fiscalibre/')?await fiscalibreFetch(new Request(privateOrigin+q.url,{method:q.method,headers:q.headers,body:q.method==='POST'?Buffer.concat(parts):undefined}),env):await fetch(base+q.url);
   const headers=Object.fromEntries(response.headers);delete headers['content-length'];delete headers['content-encoding'];delete headers['transfer-encoding'];
   res.writeHead(response.status,headers);res.end(Buffer.from(await response.arrayBuffer()));
  }catch(e){res.writeHead(500);res.end(String(e));}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));privateOrigin='https://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}if(certificateFolder){await unlink(join(certificateFolder,'key.pem'));await unlink(join(certificateFolder,'cert.pem'));await rmdir(certificateFolder);}});
async function openFiscalibre(page){const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(privateOrigin+'/fiscalibre/');await page.locator('#fiscalibrePassword').fill(password);await page.getByRole('button',{name:'Ouvrir Fiscalibre'}).click();await expect(page.locator('#view h1')).toBeVisible();return errors;}
test('Fiscalibre link remains below login and signup without altering auth controls',async({page})=>{await page.goto(base);await expect(page.locator('#authScreen')).toBeVisible();const link=page.locator('#fiscalibreLink');await expect(link).toHaveAttribute('href','/fiscalibre/');await page.locator('[data-auth-mode="register"]').click();await expect(link).toBeVisible();await expect(page.locator('#authName')).toBeVisible();await page.locator('[data-auth-mode="login"]').click();await expect(link).toBeVisible();await expect(page.locator('#authUsername')).toBeVisible();});
test('Fiscalibre all pages and subpages render on phone and preserve Eco storage',async({page})=>{await page.setViewportSize({width:360,height:850});await page.goto(privateOrigin);await page.evaluate(()=>localStorage.setItem('eco-fiscalibre-preservation-synthetic','eco-only'));const errors=await openFiscalibre(page);expect(await page.evaluate(()=>localStorage.getItem('eco-fiscalibre-preservation-synthetic'))).toBe('eco-only');const pages=await page.evaluate(()=>tabs.map(x=>x[0]));for(const p of pages){await page.evaluate(p=>go(p),p);await expect(page.locator('#view h1')).toBeVisible();const subs=await page.evaluate(p=>(window.SUBTABS_CONFIG[p]||[]).map(x=>x.id),p);for(const s of subs)await page.evaluate(({p,s})=>window.navigateTo(p,s),{p,s});expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'Mobile page '+p+' / '+subs.at(-1)).toBeLessThanOrEqual(2);}expect(errors).toEqual([]);await page.goto(privateOrigin);expect(await page.evaluate(()=>localStorage.getItem('eco-fiscalibre-preservation-synthetic'))).toBe('eco-only');});
test('reference searches accounts and individual result lines; Harmony never fabricates acceptance',async({page})=>{const errors=await openFiscalibre(page);await page.evaluate(()=>go('reference'));await page.locator('#refSearch').fill('6593');await expect(page.locator('#refTable')).toContainText('dépréciations sur stocks');await page.locator('#refSearch').fill('6581');await expect(page.locator('#refTable')).toContainText('administrateurs');await page.locator('#refLines').click();await page.locator('#refSearch').fill('TH');await expect(page.locator('#refTable')).toContainText('75');await page.evaluate(()=>window.navigateTo('tax','tax_harmony'));await expect(page.locator('#harmonyPortalCard')).toContainText('API non configurée');await expect(page.locator('#harmonyPortalCard')).toContainText('Non vérifiée');await expect(page.locator('#apiEndpointSelect')).toHaveCount(0);const download=page.waitForEvent('download');await page.locator('#connectorExport').click();expect((await download).suggestedFilename()).toBe('Fiscalibre-dossier-raccordement.json');expect(errors).toEqual([]);});
test('VAT exempt choice, save and reload keep Fiscalibre values while unknown AST stays draft',async({page})=>{const errors=await openFiscalibre(page);await page.evaluate(()=>window.navigateTo('tax','tax_sim'));await page.locator('#vatMode').selectOption('exempt');await page.locator('#calcTax').click();expect(await page.evaluate(()=>cur().tax.vatMode)).toBe('exempt');await page.locator('#save').click();await page.reload();expect(await page.evaluate(()=>cur().tax.vatMode)).toBe('exempt');expect(await page.evaluate(()=>Fiscal.purchase({amount:1000000,vat:'unknown',withholding:'unknown'}).blocked)).toBe(true);expect(errors).toEqual([]);});
