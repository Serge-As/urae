import {settleWorkDialog} from './financial-work-mode-helper.mjs';
import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173';
const password='Synthetic-browser-finance-2026!';

const moneyValue=async locator=>{
  const text=await locator.locator('.cell-current').innerText();
  return Number(String(text).replace(/[^0-9-]/g,''));
};

const ledgerCellTotal=async(page,{groupId,meetingId,membershipId,rubricId})=>page.evaluate(async({groupId,meetingId,membershipId,rubricId})=>{
  const response=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/ledger',{headers:{'x-active-group-id':groupId,'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1')}});
  if(!response.ok)throw new Error('LEDGER_HTTP_'+response.status+':'+await response.text());
  const ledger=await response.json();
  return (ledger.receipts??[])
    .filter(x=>x.meetingId===meetingId&&x.membershipId===membershipId&&x.rubricId===rubricId)
    .reduce((n,x)=>n+Number(x.netAmount??0),0);
},{groupId,meetingId,membershipId,rubricId});

const sheetExpenseTotal=async(page,{groupId,meetingId,membershipId,rubricId})=>page.evaluate(async({groupId,meetingId,membershipId,rubricId})=>{
  const response=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/expenses?scope=SHEET',{headers:{'x-active-group-id':groupId,'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1')}});
  if(!response.ok)throw new Error('EXPENSE_HTTP_'+response.status+':'+await response.text());
  const rows=await response.json();
  return (Array.isArray(rows)?rows:rows.items??[])
    .filter(x=>x.meetingId===meetingId&&x.membershipId===membershipId&&x.rubricId===rubricId)
    .reduce((n,x)=>n+Number(x.amount??0),0);
},{groupId,meetingId,membershipId,rubricId});

const localOutboxState=page=>page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('tontine-platform',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try{
    if(!db.objectStoreNames.contains('outbox'))return[];
    return await new Promise((resolve,reject)=>{const request=db.transaction('outbox','readonly').objectStore('outbox').getAll();request.onsuccess=()=>resolve(request.result??[]);request.onerror=()=>reject(request.error);});
  }finally{db.close();}
});

test('real financial matrix validates click, Enter, closed-session first entry and offline replay',async({browser,page,context})=>{
  test.setTimeout(120_000);
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  const registration=await browser.newContext();
  let ids;
  try {
    const setup=await registration.newPage();
    await setup.goto(base+'/',{waitUntil:'domcontentloaded'});

    ids=await setup.evaluate(async({password})=>{
      const json=async(path,method='GET',body,groupId)=>{
        let response;
        try{
          response=await fetch(path,{
            method,
            headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},
            body:body===undefined?undefined:JSON.stringify(body)
          });
        }catch(error){
          throw new Error(method+' '+path+' -> FETCH_FAILED '+String(error));
        }
        const text=await response.text();
        let data;try{data=JSON.parse(text);}catch{data=text;}
        if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
        return data;
      };

      const suffix=String(Date.now()),username='finance_e2e_'+suffix;
      const account=await json('/api/v1/auth/register','POST',{username,password,displayName:'Finance E2E'});
      const project=await json('/api/v1/group-projects','POST',{name:'Groupe saisie E2E '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:4,nominalContribution:0,currency:'XAF'});
      const group=await json('/api/v1/group-projects/'+encodeURIComponent(project.id)+'/convert','POST',{});
      const members=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/members','GET',undefined,group.id);
      const membershipId=members.find(x=>x.userId===account.account.id)?.id??members[0]?.id;
      if(!membershipId)throw new Error('NO_OWNER_MEMBERSHIP');

      const rubricBody=name=>({
        name,
        facets:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},
        source:'GROUP_CUSTOM',
        operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}
      });
      const rubrics=[];
      for(const name of ['Secours E2E','Collation E2E','Transport E2E','Épargne E2E']){
        rubrics.push(await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/rubrics','POST',rubricBody(name),group.id));
      }
      const expenseBody=rubricBody('Dépense E2E');expenseBody.facets.direction='OUTFLOW';
      rubrics.push(await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/rubrics','POST',expenseBody,group.id));
      const meeting=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/meetings','POST',{title:'Séance E2E ouverte',scheduledAt:'2026-09-25T15:00:00.000Z'},group.id);
      return{groupId:group.id,membershipId,meetingId:meeting.id,rubricIds:rubrics.map(x=>x.id),username};
    },{password});
  } finally { await registration.close(); }
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // Use the real login surface once so the device receives the salted PBKDF2
  // offline credential mirror. API-only registration is intentionally not
  // sufficient for a cold offline restart.
  await page.locator('[data-auth-mode="login"]').click();
  await page.locator('#authUsername').fill(ids.username);
  await page.locator('#authPassword').fill(password);
  const [login]=await Promise.all([
    page.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/auth/login'&&response.request().method()==='POST'),
    page.locator('#authSubmit').click()
  ]);
  expect(login.ok()).toBe(true);
  await expect(page.locator('#authScreen')).toBeHidden({timeout:30000});
  await expect(page.locator('#accountName')).toContainText('Finance E2E');
  const groupSelect=page.locator('#activeGroupSelect');
  await expect(groupSelect.locator('option[value="'+ids.groupId+'"]')).toHaveCount(1);
  await groupSelect.selectOption(ids.groupId);
  await expect(groupSelect).toHaveValue(ids.groupId);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#authScreen')).toBeHidden();
  await page.locator('button[data-view="operations"]').first().click();
  await expect(page.locator('#meetingMatrix .canonical-financial-matrix')).toBeVisible();

  const cell=(rubricId,meetingId=ids.meetingId)=>page.locator(
    '#meetingMatrix .matrix-cell-entry[data-membership-id="'+ids.membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"]'
  );

  const clickCell=cell(ids.rubricIds[0]);
  await clickCell.locator('.cell-target-input').fill('1000');
  const beforeClick=await page.evaluate(({membershipId,rubricId,meetingId})=>{
    const root=document.querySelector('.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"]');
    const input=root?.querySelector('.cell-target-input'),button=root?.querySelector('.cell-validate');
    if(input)input.dataset.e2eMarker='input-before-click';
    if(button)button.dataset.e2eMarker='button-before-click';
    return{value:input?.value??'',hasState:Boolean(root?.querySelector('.cell-save-state')),html:root?.outerHTML??'',source:document.querySelector('script[src*="main.js"]')?.getAttribute('src')??''};
  },{membershipId:ids.membershipId,rubricId:ids.rubricIds[0],meetingId:ids.meetingId});
  if(beforeClick.value!=='1000'||!beforeClick.hasState)throw new Error('INPUT_REPLACED_BEFORE_CLICK '+JSON.stringify(beforeClick));
  await clickCell.locator('.cell-validate').click();await settleWorkDialog(page);
  await page.waitForTimeout(1000);
  const firstUi=await moneyValue(cell(ids.rubricIds[0]));
  const firstLedger=await ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[0]});
  if(firstUi!==1000||firstLedger!==1000){
    const diagnostics=await page.evaluate(({membershipId,rubricId,meetingId})=>({
      error:document.querySelector('#errorBox')?.textContent??'',
      cell:document.querySelector('.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"]')?.textContent??'',
      state:document.querySelector('.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"]')?.getAttribute('data-save-state')??'',
      trace:localStorage.getItem('eco.financialCellTrace')??'[]',
      inputValue:document.querySelector('.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"] .cell-target-input')?.value??'',
      inputMarker:document.querySelector('.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"] .cell-target-input')?.getAttribute('data-e2e-marker')??'',
      buttonMarker:document.querySelector('.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"] .cell-validate')?.getAttribute('data-e2e-marker')??'',
      submitBound:document.querySelector('.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"] .cell-validate')?.getAttribute('data-eco-submit-bound')??'',
      onclickType:typeof document.querySelector('.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"] .cell-validate')?.onclick,
      mainHasTrace:false,
      mainHasSelfContainedBinding:false
    }),{membershipId:ids.membershipId,rubricId:ids.rubricIds[0],meetingId:ids.meetingId});
    const sourceProof=await page.evaluate(async()=>{const src=document.querySelector('script[src*="main.js"]')?.getAttribute('src');if(!src)return {trace:false,binding:false};const text=await (await fetch(src,{cache:'no-store'})).text();return {trace:text.includes('traceFinancialCell'),binding:text.includes('__ecoFinancialSubmit')&&text.includes("ecoSubmitBound='1'")};});
    diagnostics.mainHasTrace=sourceProof.trace;diagnostics.mainHasSelfContainedBinding=sourceProof.binding;
    throw new Error('FIRST_CLICK_NOT_COMMITTED ui='+firstUi+' ledger='+firstLedger+' diagnostics='+JSON.stringify(diagnostics));
  }

  const replaceCell=cell(ids.rubricIds[0]);
  await replaceCell.locator('.cell-target-input').fill('500');
  await replaceCell.locator('.cell-validate').click();await settleWorkDialog(page,'Correction E2E 1000 vers 500');
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[0]))).toBe(500);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[0]})).toBe(500);
  await replaceCell.locator('.cell-target-input').fill('4000');
  await replaceCell.locator('.cell-target-input').press('Enter');await settleWorkDialog(page,'Correction E2E 500 vers 4000');
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[0]))).toBe(4000);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[0]})).toBe(4000);

  await replaceCell.locator('.cell-target-input').fill('5000');
  await replaceCell.locator('.cell-validate').click();
  await settleWorkDialog(page,'Contrôle de la valeur de départ');
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[0]})).toBe(5000);
  await replaceCell.locator('.cell-target-input').fill('4000');
  await replaceCell.locator('.cell-validate').click();
  const correction=page.locator('.eco-financial-reason');
  await expect(correction).toContainText(/5\s?000.*4\s?000/);
  await correction.getByRole('button',{name:'Annuler'}).click();
  await expect(replaceCell.locator('.cell-target-input')).toHaveValue('4000');
  expect(await ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[0]})).toBe(5000);
  await replaceCell.locator('.cell-validate').click();
  await settleWorkDialog(page,'Rectification du montant');
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[0]})).toBe(4000);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[0]))).toBe(4000);

  const enterCell=cell(ids.rubricIds[1]);
  await enterCell.locator('.cell-target-input').fill('2000');
  await enterCell.locator('.cell-target-input').press('Enter');await settleWorkDialog(page);
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[1]))).toBe(2000);
  // A live redraw can replace the transient cell status. Verify the durable result.
  try {
    await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[1]}),{timeout:30000}).toBe(2000);
  } catch(error) {
    console.log('ENTER_DIAGNOSTIC',await enterCell.evaluate(el=>({
      cell:el.textContent, state:el.dataset.saveState, connectivity:document.querySelector('#connectivity')?.textContent,
      dialogs:[...document.querySelectorAll('dialog[open]')].map(x=>x.textContent?.slice(0,120)),
      traces:JSON.parse(localStorage.getItem('eco.financialCellTrace')||'[]').slice(-8).map(({type,status,target,current,error})=>({type,status,target,current,error}))
    })));
    throw error;
  }

  await page.evaluate(async({groupId,meetingId})=>{
    const r=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/meetings/'+encodeURIComponent(meetingId)+'/close',{
      method:'POST',headers:{'content-type':'application/json','x-active-group-id':groupId,'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1')},body:'{}'
    });
    if(!r.ok)throw new Error('CLOSE_HTTP_'+r.status+':'+await r.text());
  },ids);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  await expect(page.locator('#meetingMatrix .canonical-financial-matrix')).toBeVisible();
  const closedCell=cell(ids.rubricIds[2]);
  await closedCell.locator('.cell-target-input').fill('1500');
  await closedCell.locator('.cell-validate').click();await settleWorkDialog(page,'Régularisation E2E après clôture');
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[2]))).toBe(1500);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[2]})).toBe(1500);

  const open2=await page.evaluate(async({groupId})=>{
    const r=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/meetings',{
      method:'POST',headers:{'content-type':'application/json','x-active-group-id':groupId,'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1')},
      body:JSON.stringify({title:'Séance E2E offline',scheduledAt:'2026-09-25T16:00:00.000Z'})
    });
    if(!r.ok)throw new Error('MEETING2_HTTP_'+r.status+':'+await r.text());
    return r.json();
  },ids);
  ids.meetingId=open2.id;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  await expect(page.locator('#meetingMatrix .canonical-financial-matrix')).toBeVisible();
  await expect(cell(ids.rubricIds[3],ids.meetingId)).toBeVisible();

  const swState=await page.evaluate(async()=>{
    if(!('serviceWorker' in navigator))return{supported:false};
    let registrationError='';
    try{await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});}catch(e){registrationError=String(e);}
    const started=Date.now();
    while(Date.now()-started<12000){
      const reg=await navigator.serviceWorker.getRegistration('/');
      const cacheNames=await caches.keys();
      let releaseReady=false;
      for(const name of cacheNames){
        const cache=await caches.open(name);
        if(await cache.match('/__eco_release_ready__')){releaseReady=true;break;}
      }
      if(reg?.active&&releaseReady)return{supported:true,ready:true,controller:Boolean(navigator.serviceWorker.controller),active:reg.active.state,waiting:reg.waiting?.state??'',installing:reg.installing?.state??'',registrationError,caches:cacheNames,releaseReady};
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    const reg=await navigator.serviceWorker.getRegistration('/');
    const probes={};
    for(const url of ['/sw.js','/index.html','/src/main.js?v=1523','/src/field-hardening.js?v=1523','/packages/application/src/index.js']){
      try{const response=await fetch(url,{cache:'no-store'});probes[url]={status:response.status,ok:response.ok,type:response.headers.get('content-type')??''};}catch(e){probes[url]={error:String(e)};}
    }
    const cacheNames=await caches.keys(),cacheEntries={};
    for(const name of cacheNames){const cache=await caches.open(name);cacheEntries[name]=(await cache.keys()).map(request=>new URL(request.url).pathname+new URL(request.url).search);}
    return{supported:true,ready:false,controller:Boolean(navigator.serviceWorker.controller),active:reg?.active?.state??'',waiting:reg?.waiting?.state??'',installing:reg?.installing?.state??'',registrationError,caches:cacheNames,cacheEntries,probes};
  });
  if(!swState.ready)throw new Error('SERVICE_WORKER_NOT_READY '+JSON.stringify(swState));
  await context.setOffline(true);
  const offlineCell=cell(ids.rubricIds[3],ids.meetingId);
  await offlineCell.locator('.cell-target-input').fill('3000');
  await offlineCell.locator('.cell-validate').click();await settleWorkDialog(page);
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[3],ids.meetingId))).toBe(3000);
  await expect(cell(ids.rubricIds[3],ids.meetingId)).toContainText(/Enregistré sur cet appareil|synchro en attente/i);

  const offlineExpense=cell(ids.rubricIds[4],ids.meetingId);
  await offlineExpense.locator('.cell-target-input').fill('700');
  await offlineExpense.locator('.cell-validate').click();await settleWorkDialog(page);
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[4],ids.meetingId))).toBe(-700);
  await expect(cell(ids.rubricIds[4],ids.meetingId)).toContainText(/Enregistré sur cet appareil|synchro en attente/i);

  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2000);
  const offlineOperations=page.locator('button[data-view="operations"]').first();
  if(!await offlineOperations.isVisible().catch(()=>false)){
    const diagnostics=await page.evaluate(async()=>{
      const reg=await navigator.serviceWorker.getRegistration('/');
      const cacheNames=await caches.keys();
      return{
        online:navigator.onLine,
        bodyClass:document.body.className,
        authHidden:document.querySelector('#authScreen')?.hidden??null,
        restoreHidden:document.querySelector('#sessionRestoreScreen')?.hidden??null,
        errorHidden:document.querySelector('#errorBox')?.hidden??null,
        errorText:document.querySelector('#errorBox')?.textContent??'',
        accountName:document.querySelector('#accountName')?.textContent??'',
        controller:Boolean(navigator.serviceWorker.controller),
        active:reg?.active?.state??'',
        waiting:reg?.waiting?.state??'',
        installing:reg?.installing?.state??'',
        caches:cacheNames
      };
    });
    throw new Error('OFFLINE_RELOAD_UI_NOT_READY '+JSON.stringify({diagnostics,pageErrors}));
  }
  await offlineOperations.click();
  await expect(page.locator('#meetingMatrix .canonical-financial-matrix')).toBeVisible();
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[3],ids.meetingId))).toBe(3000);
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[4],ids.meetingId))).toBe(-700);
  await expect(cell(ids.rubricIds[4],ids.meetingId)).toContainText(/Enregistré sur cet appareil|synchro en attente/i);

  await context.setOffline(false);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[3]}),{timeout:30_000}).toBe(3000);
  let expenseSynced=false;
  try{await expect.poll(()=>sheetExpenseTotal(page,{...ids,rubricId:ids.rubricIds[4]}),{timeout:30_000}).toBe(700);expenseSynced=true;}catch{}
  if(!expenseSynced){
    const outbox=(await localOutboxState(page)).filter(x=>['FINANCIAL_SHEET_ENTRY_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V1'].includes(String(x.type))).map(x=>({id:x.id,type:x.type,status:x.status,attempts:x.attempts,lastError:x.lastError,lastResult:x.lastResult,createdAt:x.createdAt,updatedAt:x.updatedAt,idempotencyKey:x.idempotencyKey,payload:x.payload}));
    const diagnostics=await page.evaluate(async({groupId})=>{
      const ledgerResponse=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/ledger',{headers:{'x-active-group-id':groupId,'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1')}});
      const ledger=ledgerResponse.ok?await ledgerResponse.json():{status:ledgerResponse.status,text:await ledgerResponse.text()};
      return{online:navigator.onLine,activeGroup:localStorage.getItem('tontine.activeGroupId'),selectorValue:document.querySelector('#activeGroupSelect')?.value??'',selectorText:document.querySelector('#activeGroupSelect')?.selectedOptions?.[0]?.textContent??'',errorText:document.querySelector('#errorBox')?.textContent??'',ledgerSummary:ledger?.summary??null};
    },{groupId:ids.groupId});
    throw new Error('OFFLINE_EXPENSE_NOT_SYNCED '+JSON.stringify({diagnostics,outbox,pageErrors}));
  }
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[3],ids.meetingId)),{timeout:30_000}).toBe(3000);
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[4],ids.meetingId)),{timeout:30_000}).toBe(-700);

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[3],ids.meetingId))).toBe(3000);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[3]})).toBe(3000);
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[4],ids.meetingId))).toBe(-700);
  await expect.poll(()=>sheetExpenseTotal(page,{...ids,rubricId:ids.rubricIds[4]})).toBe(700);
});
