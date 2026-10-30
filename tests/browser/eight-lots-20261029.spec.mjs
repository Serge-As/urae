import {test,expect} from '@playwright/test';
import {base,api,cell,enter,setup} from './eight-lots-fixture.mjs';
test.setTimeout(120000);
test('an unavailable secondary module does not keep the phone behind session restoration',async({page})=>{
  await page.route('**/temporal-commerce-ui.js',r=>r.abort());await page.setViewportSize({width:360,height:780});await page.goto(base,{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).not.toHaveClass(/auth-restoring/,{timeout:10000});await expect(page.locator('#authScreen')).toBeVisible();
});
test('delayed parent modules keep printing and resource reservations mounted after authentication becomes usable',async({browser})=>{
  // A page route cannot delay a response already supplied by Chromium's SW.
  // This regression isolates module ordering; the acquired offline suites keep SW enabled.
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  let release;const ready=new Promise(resolve=>{release=resolve;});
  for(const file of ['documents-ui.js','business-studio-ui.js'])await page.route('**/'+file,async route=>{await ready;await route.continue();});
  try{
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#authScreen')).toBeVisible({timeout:15000});
    await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
    await api(page,'/api/v1/auth/register','POST',{username:'delayed_parent_'+Date.now(),password:'Synthetic-delayed-parents-20261030!',displayName:'Montage différé synthétique'});
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#authScreen')).toBeHidden({timeout:15000});
    await expect(page.locator('body')).not.toHaveClass(/auth-restoring/);
    expect(await page.locator('#paperPrintCenter').count()).toBe(0);
    expect(await page.locator('#resourceAssemblyPanel').count()).toBe(0);
    // Let unrelated child modules finish while their actual parent is held.
    await page.waitForTimeout(1200);release();
    await expect(page.locator('#view-documents #paperPrintCenter')).toHaveCount(1,{timeout:15000});
    await expect(page.locator('#businessStudioOperational #resourceAssemblyPanel')).toHaveCount(1,{timeout:15000});
    await expect(page.locator('#eco-module-recovery-mountPrintCenterUI')).toHaveCount(0);
    await expect(page.locator('#eco-module-recovery-mountResourceAssembliesUI')).toHaveCount(0);
  }finally{release();await context.close();}
});

test('authentication failure offers recovery and sanitized diagnostics without clearing local data',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('synthetic-preserved','retained'));
  await page.route('**/api/v1/auth/session',r=>r.fulfill({status:500,contentType:'application/json',body:'{"error":"SYNTHETIC_AUTH_FAILURE"}'}));
  await page.goto(base,{waitUntil:'domcontentloaded'});await expect(page.getByRole('button',{name:'Réessayer le démarrage'})).toBeVisible({timeout:15000});
  const diagnostics=await page.evaluate(()=>({report:window.ecoStartupDiagnostics(),preserved:localStorage.getItem('synthetic-preserved')}));expect(diagnostics.preserved).toBe('retained');expect(diagnostics.report.privacy.storageContents).toBe(false);expect(JSON.stringify(diagnostics.report)).not.toContain('SYNTHETIC_AUTH_FAILURE');
});
test('member link opens a named collective summary, reviews peer versions, and keeps the canonical editable member sheet',async({page,browser})=>{
  const {ids,second,secondContext}=await setup(page,browser);
  try{
    const rubric=await api(page,'/api/v1/groups/'+ids.groupId+'/rubrics','POST',{name:'Transport collectif',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},ids.groupId);
    await enter(page,ids,1000);await expect(cell(page,ids)).toHaveAttribute('data-save-state','CONFIRMED',{timeout:30000});
    await api(second,'/api/v1/groups/'+ids.groupId+'/meetings/'+ids.meetingId+'/financial-cells','POST',{membershipId:ids.membershipId,rubricId:rubric.id,targetAmount:2000,baselineValue:0,baselineVersion:0,reason:'Saisie collègue synthétique'},ids.groupId);
    const members=await api(page,'/api/v1/groups/'+ids.groupId+'/members','GET',undefined,ids.groupId),other=members.find(x=>x.id!==ids.membershipId);
    const started=Date.now();await page.locator('#meetingMatrix [data-detail-type="member"][data-detail-id="'+other.id+'"]').click();const summary=page.locator('.eco-member-synthesis');
    await expect(summary).toBeVisible();await expect(summary.locator('h2')).toContainText('Gestionnaire Alpha');await expect(summary).toContainText('Transport collectif');expect(Date.now()-started).toBeLessThan(8000);
    await expect(summary.getByRole('button',{name:'Valider la synthèse et continuer'})).toBeEnabled();await summary.getByRole('button',{name:'Valider la synthèse et continuer'}).click();await expect(summary).not.toBeVisible();
    await expect(page.locator('#detailTitle')).toHaveText(other.displayName);await expect(page.locator('#detailBody [data-financial-mode="individual"]')).toBeVisible();await expect(page.locator('#detailBody .cell-target-input').first()).toBeEditable();
    const snapshot=await api(page,'/api/v1/groups/'+ids.groupId+'/financial-cells/snapshot','GET',undefined,ids.groupId),peer=snapshot.cells.find(x=>x.membershipId===ids.membershipId&&x.rubricId===rubric.id&&x.meetingId===ids.meetingId);expect(peer.reviewDecision).toBe('APPROVE');
  }finally{await secondContext.close();}
});
test('direct and durable closure reject a stale version even when the amount is identical',async({page,browser})=>{
  const {ids,secondContext}=await setup(page,browser);try{
    await api(page,'/api/v1/groups/'+ids.groupId+'/meetings/'+ids.meetingId+'/financial-cells','POST',{membershipId:ids.membershipId,rubricId:ids.rubricId,targetAmount:1000,baselineValue:0,baselineVersion:0,reason:'Version test'},ids.groupId);
    const result=await page.evaluate(async ids=>{const headers={'content-type':'application/json','x-eco-window-id':sessionStorage.getItem('eco.window.session.v1'),'x-active-group-id':ids.groupId},account=(await(await fetch('/api/v1/auth/session',{headers})).json()).account,payload={groupId:ids.groupId,meetingId:ids.meetingId,membershipId:ids.membershipId,action:'close',passageId:'synthetic-stale-'+Date.now(),terminalCommandIds:[],reviewedValues:[{rubricId:ids.rubricId,amount:1000,cellVersion:0}],approvePeers:true},responses=[];for(const[path,body]of [['/api/v1/groups/'+ids.groupId+'/meetings/'+ids.meetingId+'/financial-work/close',payload],['/api/v1/outbox/apply',{id:'synthetic-'+Date.now(),idempotencyKey:'synthetic-stale-'+Date.now(),type:'FINANCIAL_WORK_V1',actorId:account.id,tenantId:account.tenantId,payload,createdAt:new Date().toISOString()}]]){const r=await fetch(path,{method:'POST',headers,body:JSON.stringify(body)});responses.push({status:r.status,body:await r.json()});}return responses;},ids);
    for(const response of result){expect(response.status).toBe(400);expect(response.body.error).toBe('SYNTHESIS_CHANGED_REVIEW_REQUIRED');}
  }finally{await secondContext.close();}
});
