import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4173';
test.setTimeout(120000);
test.beforeEach(async({page})=>{page.setDefaultTimeout(20000);page.on('pageerror',error=>console.log('LOT01_PAGE_ERROR',error.message));});
const api=(page,path,method='GET',body,groupId)=>page.evaluate(async({path,method,body,groupId})=>{
 const scope=sessionStorage.getItem('eco.window.session.v1');
 const r=await fetch(path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(scope?{'x-eco-window-id':scope}:{}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json();if(!r.ok)throw Error(path+' '+r.status+' '+JSON.stringify(data));return data;
},{path,method,body,groupId});
async function register(page){
 await page.goto(base);await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
 const account=await api(page,'/api/v1/auth/register','POST',{username:'navigation_'+Date.now()+'_'+Math.floor(Math.random()*10000),password:'Synthetic-navigation-20261020!',displayName:'Camille Navigation'});
 await page.reload();await expect(page.locator('#authScreen')).toBeHidden();await expect(page.locator('#ecoNavigationOpen')).toBeVisible();return account;
}
const menu=page=>page.locator('#ecoNavigationDialog');

test('complete menu is local, bilingual, keyboard accessible and favorites survive reload',async({page})=>{
 await register(page);let remoteSearches=0;
 page.on('request',r=>{if(/\/api\/.*search/.test(r.url()))remoteSearches++;});
 await page.keyboard.press('Control+k');await expect(menu(page)).toBeVisible();await expect(page.locator('#ecoNavigationFilter')).toBeFocused();
 await page.locator('#ecoNavigationFilter').fill('loans');await expect(menu(page).locator('.eco-navigation-destination').first()).toContainText('Prêts');
 await menu(page).locator('.eco-navigation-star').first().click();await expect(menu(page).locator('.eco-navigation-star').first()).toHaveAttribute('aria-pressed','true');
 await page.locator('#ecoNavigationFilter').focus();await page.keyboard.press('ArrowDown');await expect(menu(page).locator('.eco-navigation-destination').first()).toBeFocused();await page.keyboard.press('Enter');
 await expect(menu(page)).not.toBeVisible();await expect(page.locator('#view-finance')).toBeVisible();
 await expect(page.locator('#ecoNavigationFavorites')).toContainText('Prêts');
 await page.reload();await expect(page.locator('#ecoNavigationFavorites')).toContainText('Prêts');
 await page.locator('#globalSearch').fill('savings');await expect(page.locator('#globalSearchResults button').first()).toContainText('Épargne');await page.locator('#globalSearch').press('ArrowDown');await expect(page.locator('#globalSearch')).toHaveAttribute('aria-activedescendant',/eco-search-option-\d+/);await page.locator('#globalSearch').press('Enter');
 await expect(page.locator('#view-finance')).toBeVisible();await expect(page).toHaveURL(/#savingsYieldLab$/);await expect(page.locator('.eco-navigation-current')).toContainText('Épargne');expect(remoteSearches).toBe(0);
 await page.locator('#ecoNavigationOpen').click();await page.locator('#ecoNavigationFilter').fill('pyramide inconnue xyz');await expect(menu(page).locator('.eco-navigation-destination')).toHaveCount(0);
 await page.keyboard.press('Escape');await expect(menu(page)).not.toBeVisible();
});

test('opening the menu and visiting commerce preserve the financial draft and restore its exact cell',async({page})=>{
 console.log('LOT01 finance: account setup');
 const account=await register(page);
 const project=await api(page,'/api/v1/group-projects','POST',{name:'Navigation synthétique',kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:3,nominalContribution:0,currency:'XAF'});
 const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),groupId=group.id;
 console.log('LOT01 finance: group ready');
 const members=await api(page,'/api/v1/groups/'+groupId+'/members','GET',undefined,groupId),membershipId=members.find(x=>x.userId===account.account.id).id;
 const rubric=await api(page,'/api/v1/groups/'+groupId+'/rubrics','POST',{name:'Secours navigation',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},groupId);
 const meeting=await api(page,'/api/v1/groups/'+groupId+'/meetings','POST',{title:'Séance navigation',scheduledAt:new Date().toISOString()},groupId);
 await page.reload();await expect(page.locator('#activeGroupSelect option[value="'+groupId+'"]').first()).toHaveCount(1);await page.locator('#activeGroupSelect').selectOption(groupId);await page.locator('#mainNav [data-view="operations"]').first().click();
 console.log('LOT01 finance: sheet ready');
 const input=page.locator(`#meetingMatrix .matrix-cell-entry[data-membership-id="${membershipId}"][data-rubric-id="${rubric.id}"][data-meeting-id="${meeting.id}"] .cell-target-input`);
 let financialWrites=0;page.on('request',r=>{if(r.method()==='POST'&&/\/outbox\/apply$|\/financial-cells$/.test(r.url()))financialWrites++;});
 await input.fill('5432');await page.keyboard.press('Control+k');await expect(menu(page)).toBeVisible();await expect(input).toHaveValue('5432');
 console.log('LOT01 finance: menu retained draft');
 await page.keyboard.press('Escape');await expect(input).toBeFocused();await expect(input).toHaveValue('5432');
 await page.locator('#ecoNavigationOpen').click();await page.locator('#ecoNavigationFilter').fill('marketplace');await menu(page).locator('.eco-navigation-destination').first().click();
 await expect(page.locator('#ecoNavigationResume')).toBeVisible();await page.locator('#ecoNavigationResume').click();
 console.log('LOT01 finance: resumed');
 await expect(page.locator('#view-operations')).toBeVisible();await expect(input).toHaveValue('5432');await expect(input).toBeFocused();expect(financialWrites).toBe(0);
 await expect(page.locator('.eco-navigation-group')).toHaveText('Navigation synthétique');
});

test('navigation and all three modes fit 360, 768, 1366 pixels and a magnified layout',async({page})=>{
 await register(page);const fonts=[];
 for(const mode of ['visual','senior','assisted']){
  await page.locator('#workspaceUiMode').selectOption(mode);
  fonts.push(await page.locator('#ecoNavigationOpen').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)));
  if(mode==='assisted')await expect(page.locator('.eco-navigation-guide')).toBeVisible();else await expect(page.locator('.eco-navigation-guide')).toBeHidden();
  for(const width of [360,768,1366]){
   await page.setViewportSize({width,height:900});await page.locator('#ecoNavigationOpen').click();await expect(menu(page)).toBeVisible();
   const geometry=await menu(page).evaluate(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:innerWidth,overflow:el.scrollWidth-el.clientWidth};});
   expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(geometry.width+1);expect(geometry.overflow).toBeLessThanOrEqual(2);
   await page.screenshot({path:`artifacts/lot01-navigation-${mode}-${width}.png`});await page.keyboard.press('Escape');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  }
 }
 expect(fonts).toEqual([13,17,15]);
 await page.setViewportSize({width:1366,height:900});
 // At native 200% zoom, a 1366px window has approximately 683 CSS pixels.
 // Exercise that effective layout; this does not assert a native browser zoom setting.
 await page.setViewportSize({width:683,height:450});await page.locator('#ecoNavigationOpen').click();
 const close=menu(page).getByRole('button',{name:'Fermer',exact:true});await expect(close).toBeVisible();await close.click();
 await expect(menu(page)).not.toBeVisible();
});
