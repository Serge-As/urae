import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173',password='Synthetic-Multi-Manager-2026!';
const amount=async cell=>Number((await cell.locator('.cell-current').innerText()).replace(/[^0-9-]/g,''));
const api=(page,path,method='GET',body,groupId)=>page.evaluate(async({path,method,body,groupId})=>{
  const r=await fetch(path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw Error(method+' '+path+' '+r.status+' '+JSON.stringify(data));return data;
},{path,method,body,groupId});
const cell=(page,ids)=>page.locator(`#meetingMatrix .matrix-cell-entry[data-membership-id="${ids.membershipId}"][data-rubric-id="${ids.rubricId}"][data-meeting-id="${ids.meetingId}"]`);
const enter=async(page,ids,value)=>{
  if(await amount(cell(page,ids))>0)page.once('dialog',d=>d.accept('Correction vérifiée entre gestionnaires'));
  await cell(page,ids).locator('.cell-target-input').fill(String(value));
  await cell(page,ids).locator('.cell-validate').click();
};
async function setup(page,browser){
  await page.goto(base);const suffix=Date.now()+'_'+Math.floor(Math.random()*100000);
  const account=await api(page,'/api/v1/auth/register','POST',{username:'owner_'+suffix,password,displayName:'Gestionnaire Alpha'});
  const project=await api(page,'/api/v1/group-projects','POST',{name:'Convergence '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:3,nominalContribution:0,currency:'XAF'});
  const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),groupId=group.id;
  const members=await api(page,'/api/v1/groups/'+groupId+'/members','GET',undefined,groupId),membershipId=members.find(x=>x.userId===account.account.id).id;
  const rubric=await api(page,'/api/v1/groups/'+groupId+'/rubrics','POST',{name:'Secours convergence',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},groupId);
  const meeting=await api(page,'/api/v1/groups/'+groupId+'/meetings','POST',{title:'Séance confrontation',scheduledAt:new Date().toISOString()},groupId);
  const invite=await api(page,'/api/v1/groups/'+groupId+'/join-links','POST',{mode:'AUTO_JOIN'},groupId);
  const secondContext=await browser.newContext(),second=await secondContext.newPage();await second.goto(base);
  await api(second,'/api/v1/auth/register','POST',{username:'manager_'+suffix,password,displayName:'Gestionnaire Beta'});
  const joined=await api(second,'/api/v1/join/redeem','POST',{code:invite.code});
  await api(page,'/api/v1/groups/'+groupId+'/members/'+joined.membershipId+'/lifecycle','PUT',{roles:['manager','member'],status:'active',reason:'Gestionnaire de qualification'},groupId);
  const ids={groupId,membershipId,rubricId:rubric.id,meetingId:meeting.id};
  for(const [p,username] of [[page,'owner_'+suffix],[second,'manager_'+suffix]]){
    await p.locator('[data-auth-mode="login"]').click();await p.locator('#authUsername').fill(username);await p.locator('#authPassword').fill(password);await p.locator('#authSubmit').click();await expect(p.locator('#authScreen')).toBeHidden();
    await p.evaluate(id=>localStorage.setItem('tontine.activeGroupId',id),groupId);await p.reload();await p.locator('button[data-view="operations"]').first().click();await expect(cell(p,ids)).toBeVisible();await expect(p.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:10000});
  }
  return{ids,second,secondContext};
}

test('distinct managers see typing and validated amounts, and an idle Live connection never polls financial snapshots',async({page,browser})=>{
  test.setTimeout(90000);const {ids,second,secondContext}=await setup(page,browser);
  try{
    let forbidden=0;second.on('request',r=>{if(/financial-cells\/snapshot|\/live\/events/.test(r.url()))forbidden++;});
    await cell(page,ids).locator('.cell-target-input').fill('1000');
    await expect(cell(second,ids)).toContainText(/Alpha.*saisit|Alpha.*écrit/,{timeout:5000});
    await cell(page,ids).locator('.cell-validate').click();await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(1000);
    await enter(second,ids,2001);await expect.poll(()=>amount(cell(page,ids)),{timeout:5000}).toBe(2001);
    await second.waitForTimeout(1200);expect(forbidden).toBe(0);
    await page.setViewportSize({width:390,height:820});await expect(cell(page,ids).locator('.cell-validate')).toBeVisible();
    await cell(page,ids).scrollIntoViewIfNeeded();
    await page.screenshot({path:'test-results/convergence-mobile.png',fullPage:false});
  }finally{await secondContext.close();}
});

test('offline divergent edits survive reload, confront the exact cell, and converge after keeping or explicitly reconfirming a value',async({page,context,browser})=>{
  test.setTimeout(120000);const {ids,second,secondContext}=await setup(page,browser);
  try{
    await enter(page,ids,1000);await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(1000);
    await second.locator('#refreshBtn').click();await expect.poll(()=>amount(cell(second,ids))).toBe(1000);
    for(const p of [page,second])await p.waitForFunction(async()=>{for(const name of await caches.keys())if(await (await caches.open(name)).match('/__eco_release_ready__'))return Boolean(navigator.serviceWorker.controller);return false;});
    await context.setOffline(true);await secondContext.setOffline(true);
    await enter(page,ids,2000);await enter(second,ids,3000);
    await expect.poll(()=>amount(cell(page,ids))).toBe(2000);await expect.poll(()=>amount(cell(second,ids))).toBe(3000);
    await page.reload();await expect(cell(page,ids)).toBeVisible();await expect.poll(()=>amount(cell(page,ids))).toBe(2000);
    await secondContext.setOffline(false);await expect.poll(async()=>{
      const result=await api(second,'/api/v1/groups/'+ids.groupId+'/financial-cells/snapshot','GET',undefined,ids.groupId);return result.cells.find(x=>x.meetingId===ids.meetingId&&x.membershipId===ids.membershipId&&x.rubricId===ids.rubricId)?.amount;
    },{timeout:8000}).toBe(3000);
    await context.setOffline(false);const dialog=page.locator('#offlineFinancialConfrontation');await expect(dialog).toBeVisible({timeout:10000});
    await expect(dialog).toContainText('2 000');await expect(dialog).toContainText('3 000');await expect(cell(page,ids)).toHaveClass(/is-critical-conflict/);
    await dialog.getByRole('button',{name:'Conserver présent',exact:true}).click();await dialog.getByRole('button',{name:'Valider et synchroniser',exact:true}).click();
    await expect.poll(()=>amount(cell(page,ids)),{timeout:8000}).toBe(3000);await expect(cell(page,ids)).not.toHaveClass(/is-critical-conflict/);
    // The server-confirmed remote push must also survive a cold offline refresh.
    await context.setOffline(true);await page.reload();await expect(cell(page,ids)).toBeVisible();await expect.poll(()=>amount(cell(page,ids))).toBe(3000);
    await enter(page,ids,4000);await enter(second,ids,5000);await expect.poll(()=>amount(cell(second,ids))).toBe(5000);
    await context.setOffline(false);await expect(dialog).toBeVisible({timeout:10000});await dialog.press('Escape');await expect(dialog).toHaveCount(0);
    await page.locator('[data-financial-confrontation]').click();await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Appliquer cet appareil',exact:true}).click();await dialog.getByRole('button',{name:'Valider et synchroniser',exact:true}).click();
    await expect.poll(()=>amount(cell(second,ids)),{timeout:8000}).toBe(4000);await expect.poll(()=>amount(cell(page,ids))).toBe(4000);
    await page.reload();await expect.poll(()=>amount(cell(page,ids))).toBe(4000);
  }finally{await secondContext.close();}
});
