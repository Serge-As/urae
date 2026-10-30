import {test,expect} from '@playwright/test';
import {base,api,cell,enter,setup} from './eight-lots-fixture.mjs';
test.setTimeout(180000);
test.use({actionTimeout:20000});

test('financial tables retain group totals while filtering, disclose sources and preserve context links across mobile layouts',async({page,browser},testInfo)=>{
  // This layout/source test uses HTTP acknowledgements; continuous Live
  // convergence is asserted separately by the retained two-manager scenario.
  const {ids,secondContext}=await setup(page,browser,{requireLive:false});
  try{
    console.log('TABLES_FIXTURE_READY');
    await enter(page,ids,5000);await expect(cell(page,ids)).toHaveAttribute('data-save-state','CONFIRMED',{timeout:30000});
    const matrix=page.locator('#meetingMatrix'),total=await matrix.locator('.table-total-row').textContent();
    await matrix.locator('[data-table-search]').fill('Beta');await matrix.locator('.eco-table-controls').getByRole('button',{name:'Appliquer',exact:true}).click();
    await expect(matrix.locator('.eco-filtered-total')).toBeVisible();await expect(matrix.locator('.table-total-row')).toHaveText(total);
    await expect(matrix.locator('[data-detail-type="member"]')).toHaveCount(1);console.log('TABLES_FILTER_TOTAL_PRESERVED');
    await matrix.locator('.eco-table-controls').getByRole('button',{name:'Tout afficher',exact:true}).click();
    await matrix.locator('.table-total-row .eco-number-source').last().click();
    const explanation=page.locator('.eco-number-dialog');await expect(explanation).toContainText('Aucun arrondi supplémentaire');await expect(explanation).toContainText('5');await expect(explanation).toContainText('Réunion du');
    await explanation.getByRole('button',{name:'Fermer',exact:true}).click();console.log('TABLES_NUMBER_SOURCE_READY');
    for(const width of [320,360,768,1440]){
      await page.setViewportSize({width,height:900});await expect(matrix.locator('.cell-target-input').first()).toBeVisible();
      const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(metrics.scroll).toBeLessThanOrEqual(metrics.width+2);
      await page.screenshot({path:testInfo.outputPath('meeting-'+width+'.png'),fullPage:false});console.log('TABLES_VIEWPORT_PASS '+width);
    }
    await page.setViewportSize({width:1440,height:900});
    await matrix.locator('[data-detail-type="rubric"]').first().click();
    // Leaving the edited member deliberately uses the existing passage review.
    const summary=page.locator('.eco-member-synthesis');await expect(summary).toBeVisible();
    const continueButton=summary.getByRole('button',{name:'Valider la synthèse et continuer',exact:true});
    await expect(continueButton).toBeEnabled({timeout:10000});await continueButton.click();
    await expect(summary).toBeHidden();
    await expect(page.locator('#detailTitle')).toHaveText('Secours convergence');
    await expect(page.locator('#detailBody')).toContainText('Secours convergence');
    await expect(page.locator('#detailBody .cell-target-input')).toHaveCount(0);
    // Return via the established navigation owner, then use the group panorama.
    await page.locator('#groupHomeNavBtn').click();
    const home=page.locator('.group-home-surface');await expect(home.locator('.group-home-finance')).toBeVisible({timeout:15000});
    await expect(home.getByRole('button',{name:'Atelier de séance',exact:true})).toBeVisible();
    await home.getByRole('button',{name:'Journal du groupe',exact:true}).click();await expect(home).toHaveAttribute('data-composition','journal');
    await home.getByRole('button',{name:'Panorama',exact:true}).click();await page.screenshot({path:testInfo.outputPath('group-panorama.png'),fullPage:false});
  }finally{await secondContext.close();}
});

test('optional local voice installs only on request, starts without network and deletes only its model stores',async({page,browserName},testInfo)=>{
  // Use the acquired real-origin outage method. WebKit's offline emulator
  // rejects service-worker responses before the application's fetch handler.
  const {createServer}=await import('node:http');
  const proxy=createServer(async(req,res)=>{
    try{const upstream=await fetch(base+req.url,{headers:{accept:req.headers.accept??'*/*'}});res.statusCode=upstream.status;for(const [key,value] of upstream.headers)if(!['content-encoding','content-length','transfer-encoding','connection'].includes(key))res.setHeader(key,value);res.end(Buffer.from(await upstream.arrayBuffer()));}
    catch{res.writeHead(503);res.end('Origin unavailable');}
  });
  await new Promise((resolve,reject)=>{proxy.once('error',reject);proxy.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+proxy.address().port;
  let stopped=false;const stop=async()=>{if(stopped)return;stopped=true;const done=new Promise((resolve,reject)=>proxy.close(e=>e?reject(e):resolve()));proxy.closeAllConnections();await done;};
  try{
  page.on('console',message=>{if(message.type()==='error')console.log('LOCAL_VOICE_BROWSER_ERROR: '+message.text().slice(0,1600));});
  const requests=[];page.on('request',r=>{if(r.url().includes('/vendor/voice/'))requests.push(r.url());});
  const rootResponse=await page.goto(origin);await expect(page.locator('#authScreen')).toBeVisible();
  expect(rootResponse.headers()['content-security-policy']).not.toContain("'unsafe-eval'");
  expect(requests).toEqual([]);
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('SHELL_INSTALL_TIMEOUT')),45000))]);});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:30000});
  const installed=await page.evaluate(async()=>{
    const voice=await import('/src/vosk-local.js');
    await(await caches.open('synthetic-financial-preservation')).put('/synthetic-outbox-evidence',new Response('preserved'));
    await new Promise((resolve,reject)=>{const r=indexedDB.open('synthetic-financial-preservation',1);r.onupgradeneeded=()=>r.result.createObjectStore('outbox');r.onsuccess=()=>{r.result.close();resolve();};r.onerror=()=>reject(r.error);});
    await voice.installLocalModel();
    const worker=await(await caches.open('eco-voice-fr022-v1')).match('/vendor/voice/worker.js');
    if(!worker?.headers.get('content-security-policy')?.includes("connect-src 'self' blob: data:;"))throw Error('LOCAL_WORKER_POLICY_NOT_PRESERVED');
    return voice.localModelInstalled();
  });expect(installed).toBe(true);expect(requests.some(x=>x.includes('model-fr-part-'))).toBe(true);
  await stop();
  await expect(async()=>{await fetch(origin+'/__network_probe__',{signal:AbortSignal.timeout(2000)});}).rejects.toThrow();
  if(browserName==='chromium')await page.context().setOffline(true);
  const result=await page.evaluate(async()=>{
    const voice=await import('/src/vosk-local.js'),start=performance.now(),model=await voice.loadLocalModel(),coldLoadMs=performance.now()-start;
    const recognizer=new model.KaldiRecognizer(16000);recognizer.setWords(true);
    const silence=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('LOCAL_ASR_FLUSH_TIMEOUT')),20000);recognizer.on('result',m=>{if(m.final){clearTimeout(timer);resolve(m.result);}});recognizer.acceptWaveformFloat(new Float32Array(16000),16000);recognizer.retrieveFinalResult();});recognizer.remove();
    const warm=performance.now();await voice.loadLocalModel();const warmLoadMs=performance.now()-warm;
    await voice.removeLocalModel();
    return{coldLoadMs,warmLoadMs,silence,installed:await voice.localModelInstalled(),financialCache:await(await caches.open('synthetic-financial-preservation')).match('/synthetic-outbox-evidence').then(Boolean),financialDB:(await indexedDB.databases()).some(x=>x.name==='synthetic-financial-preservation'),networkProof:'ISOLATED_ORIGIN_STOPPED',physicalAcceptance:'NOT_ACCEPTED',recognitionAccuracy:'NOT_MEASURED_SYNTHETIC_SILENCE_ONLY'};
  });
  expect(result.installed).toBe(false);expect(result.financialCache).toBe(true);expect(result.financialDB).toBe(true);expect(result.silence.text).toBe('');
  await testInfo.attach('local-voice-runtime.json',{body:JSON.stringify(result,null,2),contentType:'application/json'});
  }finally{await stop();}
});
