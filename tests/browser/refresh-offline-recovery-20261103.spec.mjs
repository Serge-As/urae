import {test,expect} from '@playwright/test';
import {settleWorkDialog} from './financial-work-mode-helper.mjs';
test.setTimeout(120000);
const base='http://127.0.0.1:4173';
const api=(page,path,method='GET',body,groupId)=>page.evaluate(async q=>{
 const scope=sessionStorage.getItem('eco.window.session.v1'),r=await fetch(q.path,{method:q.method,headers:{'content-type':'application/json','x-eco-window-id':scope,...(q.groupId?{'x-active-group-id':q.groupId}:{})},body:q.body===undefined?undefined:JSON.stringify(q.body)});const data=await r.json();if(!r.ok)throw Error(q.path+' '+r.status+' '+JSON.stringify(data));return data;
},{path,method,body,groupId});
async function setup(page){
 await page.goto(base,{waitUntil:'domcontentloaded'});await expect(page.locator('#authScreen')).toBeVisible();
 const stamp=Date.now()+'_'+Math.floor(Math.random()*100000);
 const account=await api(page,'/api/v1/auth/register','POST',{username:'reprise_'+stamp,password:'Synthetic-Recovery-20261103!',displayName:'Gestionnaire reprise'});
 const project=await api(page,'/api/v1/group-projects','POST',{name:'Reprise '+stamp,kind:'association',governanceModel:'founder_managed',memberCount:2,sessions:2,nominalContribution:0,currency:'XAF'});
 const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),groupId=group.id;
 const members=await api(page,'/api/v1/groups/'+groupId+'/members','GET',undefined,groupId);
 const rubric=await api(page,'/api/v1/groups/'+groupId+'/rubrics','POST',{name:'Reprise synthétique',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},groupId);
 const meeting=await api(page,'/api/v1/groups/'+groupId+'/meetings','POST',{title:'Séance reprise',scheduledAt:new Date().toISOString()},groupId);
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#accountName')).toContainText('Gestionnaire reprise');
 await page.locator('button[data-view="operations"]').first().click();
 const ids={groupId,membershipId:members.find(m=>m.userId===account.account.id).id,rubricId:rubric.id,meetingId:meeting.id};
 const cell=page.locator('#meetingMatrix .matrix-cell-entry[data-meeting-id="'+ids.meetingId+'"][data-membership-id="'+ids.membershipId+'"][data-rubric-id="'+ids.rubricId+'"]');
 await expect(cell).toBeVisible({timeout:15000});await expect(page.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:20000});
 await expect.poll(()=>page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;return Boolean(reg.active&&navigator.serviceWorker.controller);}),{timeout:30000}).toBe(true);
 return{ids,cell,scope:await page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))};
}
for(const width of [1280,360])test('cached F5 survives cleared window.name offline and revalidates in background online at '+width+'px',async({page,context})=>{
 await page.setViewportSize({width,height:900});const {cell,scope}=await setup(page);
 await cell.locator('.cell-target-input').fill('2750');
 await context.setOffline(true);await page.evaluate(()=>{window.name='';});await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#accountName')).toContainText('Gestionnaire reprise');await expect(cell.locator('.cell-target-input')).toHaveValue('2750');
 expect(await page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toBe(scope);
 await context.setOffline(false);await expect(page.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:20000});
 await page.addInitScript(()=>{
   const send=window.fetch.bind(window);window.__heldAuthReads=0;window.__authReleased=false;
   let release;const held=new Promise(resolve=>{release=resolve;});window.__releaseAuth=()=>{window.__authReleased=true;release();};
   window.fetch=(input,init)=>{
     if(!String(input).endsWith('/api/v1/auth/session'))return send(input,init);
     window.__heldAuthReads++;
     return new Promise((resolve,reject)=>{init?.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});void held.then(()=>send(input,init)).then(resolve,reject);});
   };
 });
 await page.evaluate(()=>{window.name='';});await page.reload({waitUntil:'domcontentloaded'});
 // The server response is still held: restoration cannot depend on its result.
 // A fixed wall-clock promise would measure host load and module downloads too.
 await expect(cell.locator('.cell-target-input')).toHaveValue('2750',{timeout:3000});
 await expect(page.locator('#authScreen')).toBeHidden();expect(await page.evaluate(()=>window.__authReleased)).toBe(false);
 await expect.poll(()=>page.evaluate(()=>window.__heldAuthReads)).toBe(1);await page.evaluate(()=>window.__releaseAuth());
 await expect(page.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:20000});await expect(cell.locator('.cell-target-input')).toHaveValue('2750');
});
test('network event burst resumes one durable financial intent automatically and leaves no idle polling loop',async({page,context})=>{
 const {cell,ids}=await setup(page);await context.setOffline(true);
 await cell.locator('.cell-target-input').fill('4300');await cell.locator('.cell-validate').click();await settleWorkDialog(page);
 await expect(cell.locator('.cell-current')).toContainText(/4\s*300/);
 await page.reload({waitUntil:'domcontentloaded'});await expect(cell.locator('.cell-current')).toContainText(/4\s*300/);
 const calls=[];page.on('request',request=>{if(request.url().includes('/api/v1/'))calls.push({path:new URL(request.url()).pathname,method:request.method()});});
 await context.setOffline(false);await page.evaluate(()=>{window.dispatchEvent(new Event('online'));window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('pageshow'));});
 await expect(cell).toHaveAttribute('data-save-state','CONFIRMED',{timeout:30000});
 const canonical=await api(page,'/api/v1/groups/'+ids.groupId+'/financial-cells/snapshot','GET',undefined,ids.groupId);
 const rows=canonical.cells??canonical.items??canonical;expect(JSON.stringify(rows)).toContain('4300');
 expect(calls.filter(x=>x.path.endsWith('/outbox/apply')).length).toBeLessThanOrEqual(2);
 const first=calls.length;await page.waitForTimeout(4500);const settled=calls.length;await page.waitForTimeout(4500);expect(calls.length-settled).toBeLessThanOrEqual(1);
 expect(settled-first).toBeLessThan(15);
 // Fiscalibre uses its separate HTTPS fixture in the acquired gate. It must
 // never be placed in this public shell's cache, including after recovery.
 expect(await page.evaluate(async()=>{for(const name of await caches.keys())for(const r of await(await caches.open(name)).keys())if(new URL(r.url).pathname.startsWith('/fiscalibre/'))return true;return false;})).toBe(false);
});
