import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173';
const password='Synthetic-browser-finance-2026!';

const moneyValue=async locator=>{
  const text=await locator.locator('.cell-current').innerText();
  return Number(String(text).replace(/[^0-9-]/g,''));
};

const ledgerCellTotal=async(page,{groupId,meetingId,membershipId,rubricId})=>page.evaluate(async({groupId,meetingId,membershipId,rubricId})=>{
  const response=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/ledger',{headers:{'x-active-group-id':groupId}});
  if(!response.ok)throw new Error('LEDGER_HTTP_'+response.status+':'+await response.text());
  const ledger=await response.json();
  return (ledger.receipts??[])
    .filter(x=>x.meetingId===meetingId&&x.membershipId===membershipId&&x.rubricId===rubricId)
    .reduce((n,x)=>n+Number(x.netAmount??0),0);
},{groupId,meetingId,membershipId,rubricId});

test('real financial matrix validates click, Enter, closed-session first entry and offline replay',async({page,context})=>{
  test.setTimeout(120_000);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});

  const ids=await page.evaluate(async({password})=>{
    const json=async(path,method='GET',body,groupId)=>{
      const response=await fetch(path,{
        method,
        headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},
        body:body===undefined?undefined:JSON.stringify(body)
      });
      const text=await response.text();
      let data;try{data=JSON.parse(text);}catch{data=text;}
      if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
      return data;
    };

    const suffix=String(Date.now());
    const account=await json('/api/v1/auth/register','POST',{username:'finance_e2e_'+suffix,password,displayName:'Finance E2E'});
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
    const meeting=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/meetings','POST',{title:'Séance E2E ouverte',scheduledAt:'2026-09-25T15:00:00.000Z'},group.id);
    localStorage.setItem('tontine.activeGroupId',group.id);
    return{groupId:group.id,membershipId,meetingId:meeting.id,rubricIds:rubrics.map(x=>x.id)};
  },{password});

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
  await clickCell.locator('.cell-validate').click();
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

  const enterCell=cell(ids.rubricIds[1]);
  await enterCell.locator('.cell-target-input').fill('2000');
  await enterCell.locator('.cell-target-input').press('Enter');
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[1]))).toBe(2000);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[1]})).toBe(2000);

  await page.evaluate(async({groupId,meetingId})=>{
    const r=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/meetings/'+encodeURIComponent(meetingId)+'/close',{
      method:'POST',headers:{'content-type':'application/json','x-active-group-id':groupId},body:'{}'
    });
    if(!r.ok)throw new Error('CLOSE_HTTP_'+r.status+':'+await r.text());
  },ids);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  await expect(page.locator('#meetingMatrix .canonical-financial-matrix')).toBeVisible();
  const closedCell=cell(ids.rubricIds[2]);
  page.once('dialog',dialog=>dialog.accept('Régularisation E2E après clôture'));
  await closedCell.locator('.cell-target-input').fill('1500');
  await closedCell.locator('.cell-validate').click();
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[2]))).toBe(1500);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[2]})).toBe(1500);

  const open2=await page.evaluate(async({groupId})=>{
    const r=await fetch('/api/v1/groups/'+encodeURIComponent(groupId)+'/meetings',{
      method:'POST',headers:{'content-type':'application/json','x-active-group-id':groupId},
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

  await page.evaluate(async()=>{if('serviceWorker' in navigator)await navigator.serviceWorker.ready;});
  await context.setOffline(true);
  const offlineCell=cell(ids.rubricIds[3],ids.meetingId);
  await offlineCell.locator('.cell-target-input').fill('3000');
  await offlineCell.locator('.cell-validate').click();
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[3],ids.meetingId))).toBe(3000);
  await expect(cell(ids.rubricIds[3],ids.meetingId)).toContainText(/Enregistré sur cet appareil|synchro en attente/i);

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  await expect(page.locator('#meetingMatrix .canonical-financial-matrix')).toBeVisible();
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[3],ids.meetingId))).toBe(3000);

  await context.setOffline(false);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[3]}),{timeout:30_000}).toBe(3000);
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[3],ids.meetingId)),{timeout:30_000}).toBe(3000);

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  await expect.poll(()=>moneyValue(cell(ids.rubricIds[3],ids.meetingId))).toBe(3000);
  await expect.poll(()=>ledgerCellTotal(page,{...ids,rubricId:ids.rubricIds[3]})).toBe(3000);
});
