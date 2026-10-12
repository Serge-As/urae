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
  await page.locator('#simulateProjectBtn').click();
  // A remote Cloudflare D1 cold start can take longer than a fixed delay.
  // Wait for the canonical output OR a real error; do not invent a failure
  // solely because an asynchronous request has not returned after 2.5 sec.
  await page.waitForFunction(()=>{
    const result=document.querySelector('#simulationResult')?.textContent??'';
    const error=document.querySelector('#errorBox');
    return result.includes('Total monétaire')||Boolean(error&&!error.hidden&&error.textContent?.trim());
  },null,{timeout:25000}).catch(()=>{});
  const result=await page.locator('#simulationResult').innerText();
  if(!result.includes('Total monétaire')){
    const diagnostic=await page.evaluate(()=>({
      step:document.querySelector('#launchStepStatus')?.textContent,
      htmlInvalid:[...document.querySelectorAll('#projectForm :invalid')].map(x=>({id:x.id,name:x.getAttribute('name'),hidden:x.closest('[data-launch-step]')?.hidden,disabled:x.disabled})).slice(0,25),
      error:document.querySelector('#errorBox')?.textContent?.slice(0,500),
      status:document.querySelector('#toast')?.textContent?.slice(0,220),
      result:document.querySelector('#simulationResult')?.textContent?.slice(0,120)
    }));
    throw Error('Simulation did not produce expected result: '+JSON.stringify(diagnostic));
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
