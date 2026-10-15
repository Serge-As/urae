import {settleWorkDialog} from './financial-work-mode-helper.mjs';
import {test,expect} from '@playwright/test';
test.setTimeout(120000);
const base='http://127.0.0.1:4173',password='Synthetic-Window-20261010!';
const api=(page,path,method='GET',body,groupId)=>page.evaluate(async q=>{
 const scope=sessionStorage.getItem('eco.window.session.v1');
 const r=await fetch(q.path,{method:q.method,headers:{'content-type':'application/json',...(scope?{'x-eco-window-id':scope}:{}),...(q.groupId?{'x-active-group-id':q.groupId}:{})},body:q.body===undefined?undefined:JSON.stringify(q.body)});
 const data=await r.json();if(!r.ok)throw Error(q.path+' '+r.status+' '+JSON.stringify(data));return data;
},{path,method,body,groupId});
const cell=(p,i)=>p.locator('#meetingMatrix .matrix-cell-entry[data-meeting-id="'+i.meetingId+'"][data-membership-id="'+i.membershipId+'"][data-rubric-id="'+i.rubricId+'"]');
const amount=c=>c.locator('.cell-current').innerText().then(t=>Number(t.replace(/[^0-9-]/g,'')));
async function setup(page,context){
 await page.goto(base,{waitUntil:'domcontentloaded'});const second=await context.newPage();await second.goto(base,{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
 await expect.poll(()=>second.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
 const suffix=Date.now()+'_'+Math.floor(Math.random()*100000),a='alpha_'+suffix,b='beta_'+suffix;
 const alpha=await api(page,'/api/v1/auth/register','POST',{username:a,password,displayName:'Fenêtre Alpha'});
 await api(second,'/api/v1/auth/register','POST',{username:b,password,displayName:'Fenêtre Beta'});
 const project=await api(page,'/api/v1/group-projects','POST',{name:'Fenêtres '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:2,sessions:3,nominalContribution:0,currency:'XAF'});
 const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),groupId=group.id;
 const people=await api(page,'/api/v1/groups/'+groupId+'/members','GET',undefined,groupId),membershipId=people.find(m=>m.userId===alpha.account.id).id;
 const rubric=await api(page,'/api/v1/groups/'+groupId+'/rubrics','POST',{name:'Secours fenêtres',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},groupId);
 const meeting=await api(page,'/api/v1/groups/'+groupId+'/meetings','POST',{title:'Séance fenêtres',scheduledAt:new Date().toISOString()},groupId);
 const invite=await api(page,'/api/v1/groups/'+groupId+'/join-links','POST',{mode:'AUTO_JOIN'},groupId),joined=await api(second,'/api/v1/join/redeem','POST',{code:invite.code});
 await api(page,'/api/v1/groups/'+groupId+'/members/'+joined.membershipId+'/lifecycle','PUT',{roles:['manager','member'],status:'active',reason:'Qualification fenêtres'},groupId);
 const ids={groupId,membershipId,rubricId:rubric.id,meetingId:meeting.id};
 for(const p of [page,second]){
  await p.reload({waitUntil:'domcontentloaded'});await expect(p.locator('#authScreen')).toBeHidden();
  await p.locator('button[data-view="operations"]').first().click();await expect(cell(p,ids)).toBeVisible();await expect(p.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:10000});
 }
 return{ids,second};
}
async function enter(page,ids,value){if(await amount(cell(page,ids))>0)page.once('dialog',d=>d.accept('Correction vérifiée'));await cell(page,ids).locator('.cell-target-input').fill(String(value));await cell(page,ids).locator('.cell-validate').click();await settleWorkDialog(page);}

test('two accounts in one browser keep their own identity, drafts, live amounts, close button and F5 position',async({page,context})=>{
 const {ids,second}=await setup(page,context);
 await page.locator('#workspaceUiMode').selectOption('senior');
 await second.locator('#workspaceUiMode').selectOption('visual');
 await expect(page.locator('body')).toHaveClass(/ui-mode-senior/);
 await expect(second.locator('body')).toHaveClass(/ui-mode-visual/);
 const seniorFont=await cell(page,ids).locator('.cell-current').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
 const visualFont=await cell(second,ids).locator('.cell-current').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
 expect(seniorFont-visualFont).toBeGreaterThanOrEqual(4);
 expect(await cell(second,ids).evaluate(e=>e.getBoundingClientRect().height)).toBeLessThan(95);
 await cell(page,ids).scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/meeting-senior.png',fullPage:false});
 await cell(second,ids).scrollIntoViewIfNeeded();await second.screenshot({path:'artifacts/meeting-visual.png',fullPage:false});
 await page.locator('#workspaceUiMode').selectOption('assisted');
 await expect(page.locator('#meetingMatrix .eco-work-toolbar')).toHaveCSS('display','flex');
 await page.screenshot({path:'artifacts/meeting-assisted.png',fullPage:false});
 await page.locator('#workspaceUiMode').selectOption('visual');
 await cell(page,ids).locator('.cell-target-input').fill('1000');
 await expect(cell(second,ids)).toContainText(/Alpha.*saisit|Alpha.*brouillon/,{timeout:5000});
 await expect(cell(page,ids).locator('.cell-live-presence')).not.toContainText('Beta');
 await cell(page,ids).locator('.cell-validate').click();await settleWorkDialog(page);await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(1000);
 await expect(cell(page,ids)).toHaveAttribute('data-save-state','CONFIRMED',{timeout:5000});
 await enter(second,ids,2000);await expect.poll(()=>amount(cell(page,ids)),{timeout:5000}).toBe(2000);
 await expect(cell(second,ids)).toHaveAttribute('data-save-state','CONFIRMED',{timeout:5000});
 await expect(page.locator('#financialAlertBar')).toBeVisible();await page.locator('#financialAlertBar .financial-alert-close').click();await expect(page.locator('#financialAlertBar')).toBeHidden();
 await cell(page,ids).locator('.cell-target-input').fill('2500');await expect(cell(second,ids).locator('.cell-target-input')).toHaveValue('');
 await page.evaluate(()=>window.scrollTo(0,500));const before=await page.evaluate(()=>window.scrollY);
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#accountName')).toContainText('Alpha');await expect(cell(page,ids).locator('.cell-target-input')).toHaveValue('2500');
 await expect.poll(()=>page.evaluate(previous=>Math.abs(window.scrollY-previous),before)).toBeLessThan(100);
 expect(before).toBeGreaterThan(0);await expect.poll(()=>amount(cell(page,ids))).toBe(2000);
 await second.reload({waitUntil:'domcontentloaded'});await expect(second.locator('#accountName')).toContainText('Beta');await expect.poll(()=>amount(cell(second,ids))).toBe(2000);
});

test('offline validations from two accounts in one profile survive F5 without erasing either outbox',async({page,context})=>{
 const {ids,second}=await setup(page,context);
 await expect.poll(()=>page.evaluate(async()=>{const keys=await caches.keys();for(const key of keys){const cache=await caches.open(key);if(await cache.match('/__eco_release_ready__'))return true;}return false;}),{timeout:20000}).toBe(true);
 await context.setOffline(true);await enter(page,ids,4100);await expect.poll(()=>amount(cell(page,ids))).toBe(4100);await enter(second,ids,4200);await expect.poll(()=>amount(cell(second,ids))).toBe(4200);
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#accountName')).toContainText('Alpha');await expect.poll(()=>amount(cell(page,ids))).toBe(4100);
 await second.reload({waitUntil:'domcontentloaded'});await expect(second.locator('#accountName')).toContainText('Beta');await expect.poll(()=>amount(cell(second,ids))).toBe(4200);
 const stored=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('tontine-platform');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result;const q=db.transaction('outbox').objectStore('outbox').getAll();q.onsuccess=()=>{resolve(q.result.map(x=>({actorId:x.actorId,status:x.status,target:x.payload?.targetAmount})));db.close();};q.onerror=()=>reject(q.error);};}));
 expect(new Set(stored.filter(x=>[4100,4200].includes(x.target)).map(x=>x.actorId)).size).toBe(2);
});

