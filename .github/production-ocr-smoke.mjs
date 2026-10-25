import fs from'node:fs';import path from'node:path';import{chromium,expect}from'@playwright/test';
const ev=process.cwd(),release={sha:process.env.ECO_TARGET_SOURCE},origin='https://eco-system.sergemimf.workers.dev';
const browser=await chromium.launch(),context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
const requests=[];context.on('request',request=>requests.push({url:request.url(),method:request.method()}));
const started=Date.now(),network=[],errors=[];
context.on('response',response=>network.push({url:response.url(),status:response.status(),atMs:Date.now()-started,contentType:response.headers()['content-type'],contentEncoding:response.headers()['content-encoding']}));
context.on('requestfailed',request=>network.push({url:request.url(),failure:request.failure()?.errorText,atMs:Date.now()-started}));
context.on('requestfinished',request=>network.push({url:request.url(),finished:true,atMs:Date.now()-started}));
page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
try{
 await page.goto(origin+'/public-notebook.html',{waitUntil:'domcontentloaded',timeout:45000});
 const health=await page.evaluate(async()=>{const r=await fetch('/health',{cache:'no-store'});if(!r.ok)throw Error('HEALTH_FAILED');return r.json();});
 if(health.commitSha!==release.sha||health.realMoneyEnabled!==false)throw Error('PRODUCTION_SOURCE_MISMATCH');
 await page.evaluate(async()=>{const {installLocalDocumentPreparation}=await import('/src/local-document-preparation.js');const input=document.createElement('input'),section=document.createElement('section');input.id='syntheticDocumentInput';input.type='file';document.querySelector('main').replaceChildren(input,section);globalThis.__syntheticEcoPreparation=installLocalDocumentPreparation(input,section,()=> 'synthetic-read-only-qa');});
 const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=210;const x=canvas.getContext('2d');x.fillStyle='white';x.fillRect(0,0,1000,210);x.fillStyle='black';x.font='52px Arial';x.fillText('ECO TOTAL 1000',60,100);x.fillText('Test de lecture',60,175);return canvas.toDataURL('image/png').split(',')[1];});
 await page.locator('#syntheticDocumentInput').setInputFiles({name:'synthetic-no-personal-data.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.getByRole('button',{name:'Extraire localement pour préparer la relecture',exact:true}).click();
  await expect(page.locator('[data-local-document-preparation]')).toContainText('Préparation locale terminée',{timeout:300000});
 const text=await page.evaluate(()=>globalThis.__syntheticEcoPreparation.getTexts().map(x=>x.text).join('\n'));if(!/1000/.test(text))throw Error('SYNTHETIC_OCR_VALUE_MISSING');
 if(requests.some(r=>/^https?:/.test(r.url)&&!r.url.startsWith(origin+'/')))throw Error('EXTERNAL_DOCUMENT_ENGINE_REQUEST');
 if(requests.some(r=>!['GET','HEAD'].includes(r.method)))throw Error('UNEXPECTED_REMOTE_WRITE');
  const receipt={sourceSha:release.sha,version:health.version,checkedAt:new Date().toISOString(),result:'PASS',scope:'Real French/English image OCR against deployed same-origin assets and production CSP. Synthetic image generated only in the disposable browser; no account or business write.',transport:'GitHub Ubuntu runner, default Chromium transport. Workstation QUIC/DNS incidents remain a separate, unaccepted client condition.',realMoneyEnabled:false,externalRequests:0,remoteWrites:0,requests:requests.length,fieldAcceptance:'NOT_ACCEPTED'};
 fs.writeFileSync(path.join(ev,'DOCUMENT_RECOVERY_PRODUCTION_OCR.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}catch(error){
  const progress=await page.locator('[data-local-document-preparation]').textContent().catch(()=>null);
  fs.writeFileSync(path.join(ev,'DOCUMENT_RECOVERY_PRODUCTION_OCR_DIAGNOSTIC.json'),JSON.stringify({sourceSha:release.sha,result:'INCOMPLETE',elapsedMs:Date.now()-started,progress,network,errors,error:String(error).slice(0,1500)},null,2));
  throw error;
}finally{await context.close();await browser.close();}
