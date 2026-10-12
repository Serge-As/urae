import {chromium} from '@playwright/test';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const preview='https://eco-system-refonte-preview.sergemimf.workers.dev';
const dest='visual-evidence';
await fs.mkdir(dest,{recursive:true});
const browser=await chromium.launch({headless:true});
const report={utc:new Date().toISOString(),target:preview,sourceSha:process.env.GITHUB_SHA,
  captures:[],errors:[],mobileOverflow:[],screenStates:{},auth:{},status:'OBSERVATION_ONLY'};
const pages=[
  ['dashboard','Accueil'],['launch','Créer / intégrer'],['operations','Cockpit Association'],
  ['sessions','Séances'],['finance','Finances'],['recap','Récap'],
  ['ecosystem','Écosystème, NOW, Deals, Business, Forum'],
  ['services','Services'],['backoffice','Back-office']
];

async function snapshot(page,label,mode){
  const safe=label.replace(/[^a-z0-9_-]/gi,'_'),file=mode+'-'+safe+'.png';
  await page.screenshot({path:path.join(dest,file),animations:'disabled',timeout:15000});
  const state=await page.evaluate(()=>{
    const body=document.body;
    const focused=document.activeElement;
    const activeView=[...document.querySelectorAll('.view.active')].map(e=>e.id);
    const panels=[...document.querySelectorAll('.view.active h1,.view.active h2,.view.active summary')]
      .filter(e=>e.getBoundingClientRect().width>0).slice(0,30).map(e=>e.textContent?.trim().slice(0,110));
    return{
      title:document.title,lang:document.documentElement.lang,bodyClass:body.className,
      activeView,panels,authVisible:!!document.querySelector('.auth-screen:not([hidden])'),
      horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+2,
      viewport:{w:innerWidth,h:innerHeight},
      buttonsVisible:[...document.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.disabled}).length,
      inputsVisible:[...document.querySelectorAll('input')].filter(e=>e.getBoundingClientRect().height>0).length,
      focusTag:focused?.tagName
    };
  });
  report.captures.push({file,label,mode,state});
  if(state.horizontalOverflow)report.mobileOverflow.push({label,mode});
  return state;
}
async function runViewport(mode,viewport,isMobile){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile,hasTouch:isMobile,serviceWorkers:'block',locale:'fr-FR'});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push({mode,kind:'pageerror',error:String(e).slice(0,400)}));
  page.on('response',r=>{if(r.status()>=500)report.errors.push({mode,kind:'http5xx',status:r.status(),url:r.url().replace(/([?&](?:token|secret|password)=)[^&]+/ig,'$1[redacted]').slice(0,250)});});
  try{
    const res=await page.goto(preview+'/',{waitUntil:'domcontentloaded',timeout:30000});
    report.screenStates[mode]={httpStatus:res?.status()};
    await page.waitForTimeout(3500);
    await snapshot(page,'auth-before-signin',mode);
    // Entirely synthetic isolated preview account: no real user's credentials.
    const suffix=(process.env.GITHUB_RUN_ID??String(Date.now())).slice(-8)+randomBytes(3).toString('hex');
    const username='uxaudit'+suffix;
    const password='Uxaudit-'+randomBytes(18).toString('hex')+'!';
    await page.locator('[data-auth-mode="register"]').click({timeout:8000});
    await page.locator('#authName').fill('UX Test Isolé');
    await page.locator('#authUsername').fill(username);
    await page.locator('#authPassword').fill(password);
    await page.locator('#authSubmit').click();
    let authenticated=false;
    try{
      await page.waitForFunction(()=>!document.body.classList.contains('signed-out') &&
        !document.body.classList.contains('auth-restoring'),{timeout:17000});
      await page.waitForTimeout(1300);
      authenticated=!(await page.locator('#authScreen').isVisible());
    }catch{}
    report.auth[mode]={registeredOrSignedIn:authenticated,
      errorMessage:await page.locator('#authError').textContent().then(x=>(x??'').slice(0,180)).catch(()=>null)};
    if(!authenticated){
      await snapshot(page,'registration-result',mode);
      return;
    }
    for(const [view,label] of pages){
      try{
        const nav=page.locator('#mainNav [data-view="'+view+'"]').first();
        if(!await nav.count())continue;
        await nav.evaluate(e=>e.click());
        await page.waitForTimeout(900);
        await snapshot(page,view,mode);
      }catch(e){report.errors.push({mode,view,kind:'capture',error:String(e).slice(0,280)});}
    }
  }catch(e){report.errors.push({mode,kind:'fatal',error:String(e).slice(0,500)});}
  await context.close();
}
await runViewport('desktop',{width:1440,height:900},false);
await runViewport('mobile',{width:390,height:844},true);
await browser.close();
await fs.writeFile(path.join(dest,'evidence.json'),JSON.stringify(report,null,2));
const compact={url:preview,captured:report.captures.length,
  auth:report.auth,screenStates:report.screenStates,
  overflow:report.mobileOverflow,errors:report.errors};
console.log('ECO_REAL_SCREEN_AUDIT',JSON.stringify(compact));
if(!report.captures.some(c=>c.mode==='desktop'&&c.label==='auth-before-signin')||
  !report.captures.some(c=>c.mode==='mobile'&&c.label==='auth-before-signin'))
  process.exitCode=1;
