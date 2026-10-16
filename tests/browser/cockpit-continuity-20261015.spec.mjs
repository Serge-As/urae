import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4173';
test.setTimeout(120000);
test('connected cockpit, direct destinations, memory and Eco IA remain usable on desktop and phone',async({page})=>{
 page.on('pageerror',error=>console.log('COCKPIT_PAGE_ERROR',error.message));page.on('console',message=>{if(message.type()==='error')console.log('COCKPIT_CONSOLE_ERROR',message.text());});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const scope=sessionStorage.getItem('eco.window.session.v1');
  const r=await fetch('/api/v1/auth/register',{method:'POST',headers:{'content-type':'application/json',...(scope?{'x-eco-window-id':scope}:{})},body:JSON.stringify({username:'cockpit_'+Date.now(),password:'Synthetic-cockpit-20261015!',displayName:'Camille Démonstration'})});if(!r.ok)throw Error('Synthetic account setup '+r.status);
 });
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#authScreen')).toBeHidden();
 await expect(page.locator('#myRotatingTontinesNavBtn')).toBeHidden();
 await expect(page.locator('#cockpitGreeting')).toBeVisible();await expect(page.locator('.cockpit-launchpad button')).toHaveCount(6);
 await page.screenshot({path:'artifacts/cockpit-desktop.png',fullPage:true});
 await page.locator('#sessionsNavBtn').click();await expect(page.locator('#view-sessions')).toBeVisible();
 await page.locator('#mainNav [data-view="dashboard"]').first().click();await expect(page.locator('#journeyRecent')).toContainText('Séances');
 await page.locator('#ecoAiNavBtn').click();await expect(page.locator('#view-assistant')).toBeVisible();await expect(page.locator('#view-launch')).toBeHidden();
 await page.locator('#ecoAssistantPrompt').fill('Reprendre mon activité');await expect(page.locator('#focusedFieldDictation')).toHaveCSS('position','fixed');await page.locator('#localAssistantCenter button[type="submit"]').click();await expect(page.locator('#ecoAssistantResult')).toContainText('sessions');
 await page.locator('#ecoAssistantPrompt').fill('Vendre ou acheter');await page.locator('#localAssistantCenter button[type="submit"]').click();await expect(page.locator('#ecoAssistantResult')).toContainText('acheteur');
 await page.screenshot({path:'artifacts/eco-ia-desktop.png',fullPage:true});
 await page.locator('#mainNav [data-view="dashboard"]').first().click();await page.locator('.journey-settings summary').click();await page.locator('#journeyRemember').uncheck();await page.locator('#sessionsNavBtn').click();await page.locator('#mainNav [data-view="dashboard"]').first().click();await expect(page.locator('#journeyRecent')).toContainText('désactivée');
 await page.setViewportSize({width:390,height:844});await expect(page.locator('#ecoAiNavBtn')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
 await page.screenshot({path:'artifacts/cockpit-mobile.png',fullPage:true});
 await page.locator('#ecoAiNavBtn').click();await expect(page.locator('#ecoAssistantPrompt')).toBeVisible();
 const rotating=await page.evaluate(async()=>{
  const scope=sessionStorage.getItem('eco.window.session.v1'),headers={'content-type':'application/json',...(scope?{'x-eco-window-id':scope}:{})};
  const create=await fetch('/api/v1/group-projects',{method:'POST',headers,body:JSON.stringify({name:'Tontine personnelle synthétique',kind:'rotating_tontine',governanceModel:'founder_managed',memberCount:2,sessions:2,nominalContribution:100,currency:'XAF'})});
  if(!create.ok)throw Error('Rotating project '+create.status);const project=await create.json();
  const convert=await fetch('/api/v1/group-projects/'+project.id+'/convert',{method:'POST',headers,body:'{}'});if(!convert.ok)throw Error('Rotating conversion '+convert.status);return convert.json();
 });
 await page.setViewportSize({width:1280,height:900});await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#myRotatingTontinesNavBtn')).toBeVisible();
 await page.locator('#myRotatingTontinesNavBtn').click();
 await expect(page.locator('#personalRotatingTontines')).toContainText('Tontine personnelle synthétique');
 await page.locator('#personalRotatingTontines [data-rotating-group="'+rotating.id+'"]').click();
 await expect(page.locator('#activeGroupSelect')).toHaveValue(rotating.id);
});
test('cell dictation waits for stop and review, never submits finance, and rejects stale context',async({page})=>{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  window.SpeechRecognition=class{start(){this.onstart?.();window.testRecognition=this;}stop(){this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:'cinq mille',confidence:.98}],{isFinal:true})]});this.onend?.();}};
  const {createCellDictationButton}=await import('/src/voice-entry-ui.js');window.testScope='one';window.testFinancialWrites=0;
  document.body.classList.remove('signed-out','auth-restoring');document.getElementById('authScreen').hidden=true;
  const host=document.createElement('section');host.id='dictationFixture';host.style.cssText='position:fixed;top:10px;left:10px;z-index:10000;background:white;padding:10px';const input=document.createElement('input');input.id='dictationTarget';input.type='number';const validate=document.createElement('button');validate.textContent='Commit';validate.onclick=()=>window.testFinancialWrites++;host.append(input,createCellDictationButton(input,{label:'Camille · Épargne',getScope:()=>window.testScope}),validate);document.body.append(host);
 });
 await page.locator('#dictationFixture .cell-dictate').click();await page.locator('dialog button').filter({hasText:'Écouter'}).click();await expect(page.locator('dialog textarea')).toHaveValue('');await page.locator('dialog button').filter({hasText:'Arrêter'}).click();await expect(page.locator('dialog textarea')).toHaveValue('cinq mille');await expect(page.locator('dialog input')).toHaveValue('5000');await expect(page.locator('#dictationTarget')).toHaveValue('');
 await page.locator('dialog button').filter({hasText:'Reporter'}).click();await expect(page.locator('#dictationTarget')).toHaveValue('5000');expect(await page.evaluate(()=>window.testFinancialWrites)).toBe(0);
 await page.locator('#dictationFixture .cell-dictate').click();await page.locator('dialog input').fill('6000');await page.evaluate(()=>window.testScope='two');await page.locator('dialog button').filter({hasText:'Reporter'}).click();await expect(page.locator('#dictationTarget')).toHaveValue('5000');await expect(page.locator('dialog')).toContainText('changé');
 await page.locator('dialog button').filter({hasText:'Annuler'}).click();await expect(page.locator('dialog.eco-dictation-dialog')).toHaveCount(0);
});
