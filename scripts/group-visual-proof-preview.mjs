import {chromium} from '@playwright/test';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const out='group-evidence';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},locale:'fr-FR',serviceWorkers:'block'});
const report={target:'https://eco-system-refonte-preview.sergemimf.workers.dev',sha:process.env.GITHUB_SHA,
  steps:[],screenshots:[],pageErrors:[],result:'NOT_STARTED'};
page.on('pageerror',e=>report.pageErrors.push(String(e).slice(0,350)));
async function shot(name){
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)});
  await page.waitForTimeout(180);
  const filename=name+'.png';await page.screenshot({path:path.join(out,filename),timeout:12000});
  report.screenshots.push(filename);
}
async function step(label,fn){
  try{await fn();report.steps.push({step:label,result:'PASS'});}
  catch(e){report.steps.push({step:label,result:'FAIL',error:String(e).slice(0,450)});throw e;}
}
async function next(){
  const current=Number((await page.locator('#launchStepStatus').innerText()).match(/\d+/)?.[0]??0);
  await page.locator('#launchNextBtn').evaluate(button=>button.click());
  await page.waitForFunction(expected=>{
    const value=document.querySelector('#launchStepStatus')?.textContent??'';
    return Number(value.match(/\d+/)?.[0]??0)===expected &&
      document.querySelector('[data-launch-step="'+expected+'"]')?.hidden===false;
  },current+1,{timeout:7000}).catch(async error=>{
    const debug=await page.evaluate(()=>({
      step:document.querySelector('#launchStepStatus')?.textContent,
      visibleStep:[...document.querySelectorAll('[data-launch-step]')].filter(x=>!x.hidden).map(x=>x.dataset.launchStep),
      nextDisabled:document.querySelector('#launchNextBtn')?.disabled,
      formInert:document.querySelector('#projectForm')?.inert,
      errors:document.querySelector('#errorBox')?.textContent?.slice(0,260)
    }));
    throw new Error(String(error)+' | '+JSON.stringify(debug));
  });
}
function browse(view){
 return page.locator('#mainNav .nav-btn[data-view="'+view+'"]').first().evaluate(e=>e.click());
}
const rub=(label)=>page.locator('.launch-rubric label').filter({hasText:label}).first();
try{
 await step('open preview',async()=>{await page.goto(report.target+'/',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1500);});
 await step('register isolated audit account',async()=>{
  const id='uxgroup'+(process.env.GITHUB_RUN_ID??'task').slice(-8)+randomBytes(3).toString('hex');
  await page.locator('[data-auth-mode="register"]').click();
  await page.locator('#authName').fill('UX Audit Groupe Test');
  await page.locator('#authUsername').fill(id);
  await page.locator('#authPassword').fill('Test-'+randomBytes(18).toString('hex')+'!');
  await page.locator('#authSubmit').click();
  await page.locator('body:not(.signed-out):not(.auth-restoring)').waitFor({timeout:20000});
  await page.locator('#authScreen').waitFor({state:'hidden',timeout:20000});
 });
 await step('navigate wizard',async()=>{await browse('launch');await next();});
 await step('group identity and governance',async()=>{
  await page.locator('#projectName').fill('Association UX Audit Isolée');
  await page.locator('#groupKind').selectOption('association');
  await next(); // 3
  await page.locator('#governanceModel').selectOption('founder_managed');
  await next(); // 4
  await page.locator('#cycleLabel').fill('Audit octobre 2026');
  await page.locator('#cycleExpectedSessions').fill('3');
  await next(); // 5
  await page.locator('#expectedMembers').fill('3');
  await next(); // 6
 });
 await step('create governed rubric, no real money',async()=>{
  await page.locator('#addLaunchRubric').click();
  const details=await page.evaluate(()=>({
    step:document.querySelector('#launchStepStatus')?.textContent,
    visibleSteps:[...document.querySelectorAll('[data-launch-step]')].filter(x=>!x.hidden).map(x=>x.dataset.launchStep),
    addButtonDisabled:document.querySelector('#addLaunchRubric')?.disabled,
    addButtonParentDisabled:document.querySelector('#addLaunchRubric')?.closest('fieldset')?.disabled,
    editors:document.querySelectorAll('.launch-rubric').length,
    rubricLabels:[...document.querySelectorAll('.launch-rubric label')].slice(0,5).map(x=>x.textContent?.slice(0,80)),
    output:document.querySelector('#launchRubrics')?.textContent?.slice(0,180),
    status:document.querySelector('#errorBox')?.textContent?.slice(0,200)
  }));
  console.log('ECO_LAUNCH_RUBRIC_INSERTION',JSON.stringify(details));
  if(details.editors<1)throw new Error('RUBRIC_EDITOR_NOT_INSERTED '+JSON.stringify(details));
  await rub('Cette rubrique sert à…').locator('select').selectOption('CONTRIBUTION');
  await rub('Nom utilisé dans votre association').locator('input').fill('Collation test');
  await rub('Montant nominal par versement').locator('input').fill('1000');
  await rub('Nombre de membres participant').locator('input').fill('3');
  if(await rub('Nombre total de noms').locator('input').isEnabled())await rub('Nombre total de noms').locator('input').fill('3');
  if(await rub('Pots servis par tour').locator('input').isEnabled())await rub('Pots servis par tour').locator('input').fill('3');
  await rub('Nombre de tours').locator('input').fill('3');
  await rub('Durée du cycle').locator('input').fill('3');
  await next(); // 7
 });
 await step('simulate plan',async()=>{
  const events=[];
  const onRequest=req=>{if(req.url().includes('/api/v1/group-projects'))events.push({type:'request',method:req.method(),path:new URL(req.url()).pathname});};
  const onResponse=resp=>{if(resp.url().includes('/api/v1/group-projects'))events.push({type:'response',status:resp.status(),path:new URL(resp.url()).pathname});};
  const onFail=req=>{if(req.url().includes('/api/v1/group-projects'))events.push({type:'failed',failure:req.failure()?.slice(0,150)??null});};
  page.on('request',onRequest);page.on('response',onResponse);page.on('requestfailed',onFail);
  await page.evaluate(()=>{
    window.__ecoLaunchErrors=[];
    const error=document.querySelector('#errorBox');
    if(error){new MutationObserver(()=>{
      const value=error.textContent?.trim();
      if(value&&window.__ecoLaunchErrors.at(-1)!==value)window.__ecoLaunchErrors.push(value.slice(0,400));
    }).observe(error,{attributes:true,childList:true,subtree:true,characterData:true});}
  });
  // Real Worker assets, not merely a successful /health, determine whether
  // the launched UI has the same event handler as the qualified source.
  const served=await page.request.get(report.target+'/src/main.js?v=15215',{headers:{'cache-control':'no-cache','pragma':'no-cache'}});
  const servedSource=await served.text();
  const release=await page.request.get(report.target+'/health');
  const health=await release.json().catch(()=>({}));
  const assetTruth={status:served.status(),bytes:servedSource.length,
    hasBoundedLaunchFeedback:servedSource.includes('Simulation non terminée'),
    hasHandlerSymbol:servedSource.includes('simulateLaunchFromUserAction'),
    etag:served.headers().etag??null,cacheControl:served.headers()['cache-control']??null,
    actualHealthSha:health.commitSha??null,expectedSha:report.sha};
  console.log('ECO_LAUNCH_SERVED_ASSET',JSON.stringify(assetTruth));
  await page.evaluate(()=>{
    window.__ecoSimulationClickCaptured=0;
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#simulateProjectBtn'))window.__ecoSimulationClickCaptured++;
    },true);
  });
  console.log('ECO_LAUNCH_BEFORE_CLICK',JSON.stringify(await page.evaluate(()=>{
    const button=document.getElementById('simulateProjectBtn');
    const fieldset=button?.closest('fieldset');
    return{disabled:button?.disabled,fieldsetDisabled:fieldset?.disabled,
      fieldsetHidden:fieldset?.hidden,hasForm:!!button?.closest('form'),
      buttonType:button?.type,projectName:document.getElementById('projectName')?.value?.length};
  })));
  await page.locator('#simulateProjectBtn').click();
  await page.waitForTimeout(900);
  console.log('ECO_LAUNCH_AFTER_CLICK',JSON.stringify(await page.evaluate(()=>({
    localState:document.getElementById('simulationResult')?.dataset.simulationStatus,
    localText:document.getElementById('simulationResult')?.textContent?.slice(0,300),
    error:document.getElementById('errorBox')?.textContent?.slice(0,300),
    buttonDisabled:document.getElementById('simulateProjectBtn')?.disabled,
    clickObserved:window.__ecoSimulationClickCaptured??0
  }))));
  // A remote Cloudflare D1 cold start can take longer than a fixed delay.
  // Wait for the canonical output OR a real error; do not invent a failure
  // solely because an asynchronous request has not returned after 2.5 sec.
  await page.waitForFunction(()=>{
    const result=document.querySelector('#simulationResult')?.textContent??'';
    const error=document.querySelector('#errorBox');
    return result.includes('Total monétaire')||Boolean(document.querySelector('#simulationResult[data-simulation-status="ERROR"]'))||Boolean(error&&!error.hidden&&error.textContent?.trim());
  },null,{timeout:25000}).catch(()=>{});
  const result=await page.locator('#simulationResult').innerText();
  if(!result.includes('Total monétaire')){
    const diagnostic=await page.evaluate(()=>({
      step:document.querySelector('#launchStepStatus')?.textContent,
      htmlInvalid:[...document.querySelectorAll('#projectForm :invalid')].map(x=>({id:x.id,name:x.getAttribute('name'),hidden:x.closest('[data-launch-step]')?.hidden,disabled:x.disabled})).slice(0,25),
      error:document.querySelector('#errorBox')?.textContent?.slice(0,500),
      status:document.querySelector('#toast')?.textContent?.slice(0,220),
      result:document.querySelector('#simulationResult')?.textContent?.slice(0,600),
      resultStatus:document.querySelector('#simulationResult')?.dataset.simulationStatus
    }));
    console.log('ECO_LAUNCH_SIMULATION_NETWORK',JSON.stringify(events));
    console.log('ECO_LAUNCH_TRANSIENT_ERRORS',JSON.stringify(await page.evaluate(()=>window.__ecoLaunchErrors??[])));
    throw Error('Simulation did not produce expected result: '+JSON.stringify(diagnostic)+' network='+JSON.stringify(events));
  }
 });
 await step('review preview and create',async()=>{
  for(let n=8;n<=10;n++)await next();
  await page.locator('#previewConfirmed').check();
  await page.locator('#createGroupBtn').click();
  await page.waitForTimeout(2600);
  await page.waitForFunction(()=>{const x=document.querySelector('#activeGroupSelect');return x&&Boolean(x.value)},{timeout:22000});
 });
 report.result='GROUP_CREATED';
 await shot('group-operations-desktop');
 await browse('recap');await page.waitForTimeout(1000);await shot('group-recap-desktop');
 await browse('finance');await page.waitForTimeout(800);await shot('group-finance-desktop');
 await browse('sessions');await page.waitForTimeout(800);await shot('group-sessions-desktop');
 await browse('ecosystem');await page.waitForTimeout(800);await shot('group-ecosystem-desktop');
 await page.setViewportSize({width:390,height:844});
 await browse('operations');await page.waitForTimeout(700);await shot('group-operations-mobile');
 await browse('recap');await page.waitForTimeout(700);await shot('group-recap-mobile');
 await browse('finance');await page.waitForTimeout(700);await shot('group-finance-mobile');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForTimeout(3000);
 report.reload={groupStillSelected:await page.locator('#activeGroupSelect').inputValue().then(Boolean).catch(()=>false),
  signedOut:await page.locator('body').evaluate(x=>x.classList.contains('signed-out'))};
 if(!report.reload.groupStillSelected)report.result='GROUP_CREATED_BUT_RELOAD_NOT_VERIFIED';
}catch(e){report.result='BLOCKED';report.error=String(e).slice(0,600);try{await shot('failure-state')}catch{}}
await fs.writeFile(path.join(out,'group-evidence.json'),JSON.stringify(report,null,2));
console.log('ECO_REAL_GROUP_FLOW',JSON.stringify(report));
await browser.close();
if(report.result!=='GROUP_CREATED')process.exitCode=1;
