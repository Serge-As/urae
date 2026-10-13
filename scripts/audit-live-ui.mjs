import {chromium,webkit} from '@playwright/test';
import fs from 'node:fs';import path from 'node:path';import {randomBytes} from 'node:crypto';
const base=(process.env.ECO_AUDIT_URL??'https://eco-system-refonte-preview.sergemimf.workers.dev').replace(/\/$/,'');
const dir='audit-live-ui';fs.mkdirSync(dir,{recursive:true});
const checks=[],screenshots=[];
const views={dashboard:'Accueil',launch:'Créer / intégrer et Kits',operations:'Cockpit Association',sessions:'Séances / matrice',finance:'Finances et Confrontation',recap:'Récap',ecosystem:'Eco NOW / Deals / Business / Forum / Market / Harvest',members:'Membres / portraits',control:'Founder Control',services:'Catalogue des capacités'};
const state=page=>page.evaluate(()=>({lang:document.documentElement.lang,body:document.body.className,
 authVisible:(()=>{const e=document.querySelector('#authScreen');return!!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0})(),
 active:[...document.querySelectorAll('.view.active')].map(x=>x.id),
 headings:[...document.querySelectorAll('.view.active h1,.view.active h2')].map(x=>x.textContent.trim()).slice(0,13),
 buttons:[...document.querySelectorAll('.view.active button')].filter(x=>x.getBoundingClientRect().width>0).length,
 scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
 brand:getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()}));
const shot=async(page,id,name)=>{const file=path.join(dir,id+'_'+name+'.png');await page.screenshot({path:file,fullPage:false,animations:'disabled',timeout:30000});screenshots.push(path.basename(file));};
async function inspect(browser,type,device,lang){
 const cfg=device==='mobile'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1366,height:850},deviceScaleFactor:1};
 const ctx=await browser.newContext({...cfg,locale:lang==='fr'?'fr-FR':'en-US',serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await ctx.newPage(),id=[type,device,lang].join('_'),errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,180)));
 let res;try{res=await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:40000});}catch(e){checks.push({id,status:'INACCESSIBLE',error:String(e)});await ctx.close();return;}
 await page.waitForTimeout(2000);await shot(page,id,'00_real_first_load');
 const initial=await state(page);let authenticated=!initial.authVisible,reason='';
 if(!authenticated){
  try{await page.locator('[data-auth-mode="register"]').click({timeout:6000});
   const name=page.locator('#authName');if(await name.isVisible())await name.fill('QA Preview');
   await page.locator('#authUsername').fill('ecoqa'+randomBytes(5).toString('hex'));
   await page.locator('#authPassword').fill('A!9'+randomBytes(24).toString('base64url'));
   await page.locator('#authSubmit').click();await page.waitForTimeout(3500);
   authenticated=!(await state(page)).authVisible;
   if(!authenticated)reason=(await page.locator('#authError').textContent().catch(()=>''))?.slice(0,300)||'Form remains on login';
  }catch(e){reason=String(e).slice(0,330);}
 }
 checks.push({id,phase:'initial',http:res?.status(),...initial,authenticated,reason,pageErrors:errors.slice(0,7)});
 await shot(page,id,authenticated?'01_auth_success':'01_login_blocked');
 if(!authenticated){checks.push({id,status:'BLOCKED_LOGIN',reason});await ctx.close();return;}
 if(lang==='en')try{
   await page.locator('.nav-btn[data-view="settings"]').first().click({timeout:4000});
   if(await page.locator('#languageSelect').count())await page.locator('#languageSelect').selectOption('en');
   await page.waitForTimeout(300);
 }catch(e){checks.push({id,phase:'language',status:'BLOCKED',reason:String(e).slice(0,150)});}
 for(const [name,purpose]of Object.entries(views)){
  try{
   const btn=page.locator('button[data-view="'+name+'"]:visible').first();
   if(await btn.count())await btn.click({timeout:6000});
   else if(!(await state(page)).active.includes('view-'+name))throw Error('No visible navigation control for '+name);
   await page.waitForTimeout(450);
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   const current=await state(page);await shot(page,id,name);
   checks.push({id,view:name,purpose,status:current.active.includes('view-'+name)?'CAPTURED_ACTIVE':'NOT_ACTIVE',...current});
  }catch(e){checks.push({id,view:name,status:'BLOCKED_VIEW',reason:String(e).slice(0,300)});}
 }
 if(type==='chromium'&&device==='desktop'&&lang==='fr')
  for(const [name,sel]of [['forum','#communityEnginePanel'],['market','#marketEnginePanel'],['ads','#adManagerPanel'],['business','#businessStudioOperational'],['academy','#academyOperational'],['media','#visualMediaPanel']]){
   try{await page.locator('.nav-btn[data-view="ecosystem"]').first().click({timeout:6000});
    const target=page.locator(sel).first();if(!await target.count())throw Error('Missing element '+sel);
    await target.evaluate(e=>{for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
    await target.scrollIntoViewIfNeeded({timeout:5000});await page.waitForTimeout(350);await shot(page,id,'detail_'+name);
    checks.push({id,view:'detail_'+name,status:'CAPTURED',selector:sel,text:(await target.innerText()).slice(0,180)});
   }catch(e){checks.push({id,view:'detail_'+name,status:'BLOCKED_DETAIL',error:String(e).slice(0,220)});}
  }
 await ctx.close();
}
const health=await fetch(base+'/health').then(async r=>({status:r.status,json:await r.json().catch(()=>({}))})).catch(e=>({error:String(e)}));
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch();
 for(const device of ['desktop','mobile'])for(const lang of ['fr','en'])await inspect(browser,name,device,lang);
 await browser.close();
}
const report={url:base,type:'LIVE_REMOTE_CLOUDFLARE_SCREENSHOTS_NOT_MOCKUPS',health,createdAt:new Date().toISOString(),checks,screenshots};
fs.writeFileSync(path.join(dir,'audit.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(dir,'README.md'),'Captures issues du navigateur sur '+base+'. Aucun contenu HTML injecté. Si la création de compte QA est bloquée, les captures internes sont volontairement absentes et marquées BLOCKED.\n');
console.log('LIVE_UI_AUDIT',JSON.stringify({health,shots:screenshots.length,login:checks.filter(x=>x.phase==='initial').map(x=>({id:x.id,authenticated:x.authenticated,reason:x.reason})),blocked:checks.filter(x=>(x.status||'').startsWith('BLOCKED')).length}));
