import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4173';
test.setTimeout(120000);
test.beforeEach(async({page})=>{page.setDefaultTimeout(20000);page.on('pageerror',error=>console.log('LOT05_PAGE_ERROR',error.message));});
const api=(page,path,method='GET',body,groupId)=>page.evaluate(async q=>{
 const scope=sessionStorage.getItem('eco.window.session.v1'),response=await fetch(q.path,{method:q.method,headers:{'content-type':'application/json',...(scope?{'x-eco-window-id':scope}:{}),...(q.groupId?{'x-active-group-id':q.groupId}:{})},body:q.body===undefined?undefined:JSON.stringify(q.body)}),data=await response.json();if(!response.ok)throw Error(q.path+' '+response.status+' '+JSON.stringify(data));return data;
},{path,method,body,groupId});
async function setup(page){
 await page.goto(base);await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
 const account=await api(page,'/api/v1/auth/register','POST',{username:'practice_'+Date.now()+'_'+Math.floor(Math.random()*10000),password:'Synthetic-practice-20261020!',displayName:'Gestionnaire Exercice'});
 const project=await api(page,'/api/v1/group-projects','POST',{name:'Groupe fictif de recette L05',kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:3,nominalContribution:0,currency:'XAF'}),group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),groupId=group.id;
 const members=await api(page,'/api/v1/groups/'+groupId+'/members','GET',undefined,groupId),membershipId=members.find(x=>x.userId===account.account.id).id;
 const rubric=await api(page,'/api/v1/groups/'+groupId+'/rubrics','POST',{name:'Secours recette',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},groupId);
 const meeting=await api(page,'/api/v1/groups/'+groupId+'/meetings','POST',{title:'Séance fictive L05',scheduledAt:new Date().toISOString()},groupId);
 await page.reload();await expect(page.locator('#activeGroupSelect option[value="'+groupId+'"]').first()).toHaveCount(1);await page.locator('#activeGroupSelect').selectOption(groupId);await expect(page.locator('#toast')).toHaveText('Groupe actif changé.',{timeout:20000});await page.locator('#mainNav [data-view="operations"]').first().click();
 const input=page.locator(`#meetingMatrix .matrix-cell-entry[data-membership-id="${membershipId}"][data-rubric-id="${rubric.id}"][data-meeting-id="${meeting.id}"] .cell-target-input`);await input.fill('5432');
 return{input,groupId,open:page.locator('#meetingMatrix .eco-session-practice-open')};
}
const practice=page=>page.locator('#ecoSessionPractice');
const inputFor=(page,who,id='practice-r0')=>practice(page).locator(`input[data-practice-member="${who}"][data-practice-rubric="${id}"]`);
const total=(page,who)=>practice(page).locator(`[data-practice-total="${who}"]`).innerText().then(t=>Number(t.replace(/[^0-9-]/g,'')));
test('rehearsal freezes the prior member, keeps complete parts and never writes or changes the real draft',async({page})=>{
 await page.setViewportSize({width:1366,height:900});const real=await setup(page);const writes=[];page.on('request',r=>{if(r.method()==='POST'&&/\/outbox\/apply$|\/financial-cells$|\/ledger$|\/expenses$/.test(r.url()))writes.push(r.url());});
 await real.open.click();await expect(practice(page)).toContainText('EXERCICE LOCAL');
 await inputFor(page,'Amina').fill('1000');await inputFor(page,'Amina').locator('..').locator('button').click();await expect.poll(()=>total(page,'Amina')).toBe(1000);
 await inputFor(page,'Boris').focus();const review=practice(page).locator('.eco-session-practice-review');await expect(review).toBeVisible();await expect(review).toContainText('Amina');await expect(inputFor(page,'Boris')).toHaveJSProperty('readOnly',true);await page.keyboard.type('999');await expect(inputFor(page,'Boris')).toHaveValue('');
 await review.getByRole('button',{name:'Valider la synthèse et continuer l’exercice',exact:true}).click();await inputFor(page,'Boris').fill('750');await inputFor(page,'Boris').locator('..').locator('button').click();await expect.poll(()=>total(page,'Boris')).toBe(750);
 const part=practice(page).getByRole('combobox',{name:'Partie de l’exercice',exact:true}),count=await part.locator('option').count(),covered=new Set();expect(count).toBeGreaterThan(1);
 for(let i=0;i<count;i++){await part.selectOption(String(i));for(const label of (await practice(page).locator('thead th').allTextContents()).slice(1,-1))covered.add(label);await expect.poll(()=>total(page,'Amina')).toBe(1000);await expect.poll(()=>total(page,'Boris')).toBe(750);}
 expect(covered.size).toBe(20);await page.screenshot({path:'artifacts/lot05-session-rehearsal-desktop.png',fullPage:false});
 await practice(page).getByRole('button',{name:'Fermer',exact:true}).click();await expect(practice(page)).toHaveCount(0);await expect(real.input).toHaveValue('5432');expect(writes).toEqual([]);
});
test('small-screen senior exercise remains readable offline and reopening starts a separate exercise',async({page,context})=>{
 const real=await setup(page);await page.locator('#workspaceUiMode').selectOption('senior');await page.setViewportSize({width:360,height:800});await real.open.click();await expect(practice(page)).toBeVisible();await expect(practice(page).getByRole('combobox',{name:'Découpage de l’exercice',exact:true})).toContainText('Vue fiche');
 await context.setOffline(true);await inputFor(page,'Amina').fill('123');await inputFor(page,'Amina').locator('..').locator('button').click();await expect.poll(()=>total(page,'Amina')).toBe(123);
 const part=practice(page).getByRole('combobox',{name:'Partie de l’exercice',exact:true});expect(await part.locator('option').count()).toBe(20);await part.selectOption('19');await expect(practice(page)).toContainText('Réserve collective');await expect.poll(()=>total(page,'Amina')).toBe(123);
 const geometry=await practice(page).evaluate(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,viewport:innerWidth,overflow:el.scrollWidth-el.clientWidth};});expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(geometry.viewport+1);expect(geometry.overflow).toBeLessThanOrEqual(1);
 await expect(practice(page).getByRole('button',{name:'Fermer',exact:true})).toBeInViewport();await page.screenshot({path:'artifacts/lot05-session-rehearsal-mobile-senior.png',fullPage:false});await page.keyboard.press('Escape');await expect(practice(page)).toHaveCount(0);await expect(real.input).toHaveValue('5432');await real.open.click();await expect.poll(()=>total(page,'Amina')).toBe(0);await page.keyboard.press('Escape');await context.setOffline(false);
});
