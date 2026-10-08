import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173';
const password='Synthetic-consensus-persistence-2026!';

const amountFrom=async locator=>Number(String(await locator.locator('.cell-current').innerText()).replace(/[^0-9-]/g,''));

test('closed-session offline target becomes the canonical value after synchronization and reload',async({page,context})=>{
  test.setTimeout(120_000);
  let ids;
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  ids=await page.evaluate(async({password})=>{
    const json=async(path,method='GET',body,groupId)=>{
      const response=await fetch(path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
      const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}
      if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
      return data;
    };
    const suffix=String(Date.now());
    const account=await json('/api/v1/auth/register','POST',{username:'consensus_'+suffix,password,displayName:'Consensus Browser'});
    const project=await json('/api/v1/group-projects','POST',{name:'Consensus '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:2,nominalContribution:0,currency:'XAF'});
    const group=await json('/api/v1/group-projects/'+encodeURIComponent(project.id)+'/convert','POST',{});
    const members=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/members','GET',undefined,group.id);
    const membershipId=members.find(x=>x.userId===account.account.id)?.id??members[0]?.id;
    const rubric=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/rubrics','POST',{
      name:'Secours persistance',
      facets:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},
      source:'GROUP_CUSTOM',
      operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}
    },group.id);
    const meeting=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/meetings','POST',{title:'Séance clôturée',scheduledAt:'2026-09-25T18:00:00.000Z'},group.id);
    await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/meetings/'+encodeURIComponent(meeting.id)+'/close','POST',{},group.id);
    localStorage.setItem('tontine.activeGroupId',group.id);
    return{groupId:group.id,membershipId,meetingId:meeting.id,rubricId:rubric.id};
  },{password});

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  const selector='.matrix-cell-entry[data-membership-id="'+ids.membershipId+'"][data-rubric-id="'+ids.rubricId+'"][data-meeting-id="'+ids.meetingId+'"]';
  const cell=page.locator('#meetingMatrix').locator(selector);
  await expect(cell).toBeVisible();

  await context.setOffline(true);
  page.once('dialog',dialog=>dialog.accept('Correction hors ligne de séance clôturée'));
  await cell.locator('.cell-target-input').fill('1000');
  await cell.locator('.cell-validate').click();
  await expect.poll(()=>amountFrom(cell)).toBe(1000);
  await expect(cell).toContainText(/synchro en attente/i);

  await context.setOffline(false);
  await page.waitForTimeout(2500);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  const reloaded=page.locator('#meetingMatrix').locator(selector);
  await expect(reloaded).toBeVisible();

  // A manager validation is immediately canonical. Reload must preserve the
  // exact target; confrontation is opened only by an explicit dissent/reserve.
  await expect.poll(()=>amountFrom(reloaded)).toBe(1000);
  await expect(reloaded).not.toContainText(/Proposé\s*:/i);

  // Data-first refit must preserve the existing table, editable amounts,
  // session/member/rubric context, totals and the sticky identifying columns.
  const sheet=page.locator('#meetingMatrix .canonical-financial-matrix');
  await expect(sheet).toBeVisible();
  const headers=await sheet.locator('thead th').allTextContents();
  expect(headers.map(x=>x.trim())).toEqual(expect.arrayContaining(['N°','Membre','Secours persistance','Total membre']));
  await expect(sheet.locator('.table-row-total').first()).toBeVisible();
  await expect(sheet.locator('.table-total-row')).toBeVisible();
  await expect(reloaded.locator('.cell-target-input')).toBeVisible();
  await expect(reloaded.locator('.cell-validate')).toBeVisible();
  await expect(sheet.locator('thead th:nth-child(2)')).toHaveCSS('position','sticky');
  await page.setViewportSize({width:390,height:820});
  await expect(sheet).toBeVisible();
  const size=await sheet.evaluate(node=>({width:node.scrollWidth,headerCells:node.querySelectorAll('thead th').length}));
  expect(size.headerCells).toBeGreaterThanOrEqual(4); // groups may already have official rubrics
  await page.locator('#individualSheetsViewBtn').click();
  const individual=page.locator('#individualSheetMatrix .canonical-financial-matrix');
  await expect(individual).toBeVisible();
  const memberHeaders=(await individual.locator('thead th').allTextContents()).map(x=>x.trim());
  expect(memberHeaders).toEqual(expect.arrayContaining(['Séance','Secours persistance','Total séance']));
  await expect(individual.locator('.table-total-row')).toBeVisible();
});


test('loan policy scopes and free/existing simulation controls are usable in the real browser UI',async({page})=>{
  test.setTimeout(120_000);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const ids=await page.evaluate(async({password})=>{
    const json=async(path,method='GET',body,groupId)=>{
      const response=await fetch(path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
      const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}
      if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
      return data;
    };
    const suffix='loan_ui_'+String(Date.now());
    await json('/api/v1/auth/register','POST',{username:suffix,password,displayName:'Loan UI Browser'});
    const project=await json('/api/v1/group-projects','POST',{name:'Loan UI '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:2,sessions:3,nominalContribution:1000,currency:'XAF'});
    const group=await json('/api/v1/group-projects/'+encodeURIComponent(project.id)+'/convert','POST',{});
    localStorage.setItem('tontine.activeGroupId',group.id);
    return{groupId:group.id};
  },{password});

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#loansNavBtn').click();
  await expect(page.locator('#financeLoanGuide')).toBeVisible();
  await page.locator('#financeLoanRulesBtn').click();
  await expect(page.locator('#loanCompletionPanel')).toBeVisible();

  const scope=page.locator('#loanPolicyScope');
  await expect(scope).toBeVisible();
  await expect(scope.locator('option')).toHaveCount(3);
  await expect(scope).toContainText('Nouveaux prêts uniquement');
  await expect(scope).toContainText('tous les prêts en cours');
  await expect(scope).toContainText('certains prêts en cours');

  await page.locator('#loanFreeSimulationBtn').click();
  const dialog=page.locator('#loanEvolutionDialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Simulation uniquement/i);
  await expect(dialog.locator('.loan-simulation-summary').first()).toBeVisible();

  const priorities=dialog.locator('.loan-simulation-control-card select');
  await priorities.first().selectOption('EXPLICIT_ALLOCATION');
  await expect(dialog.locator('.loan-explicit-allocation-fields').first()).toBeVisible();
  const explicitInputs=dialog.locator('.loan-explicit-allocation-fields').first().locator('input');
  await explicitInputs.nth(0).fill('2500, 1500');
  await explicitInputs.nth(1).fill('0, 0');
  await dialog.getByRole('button',{name:/Calculer/i}).click();
  await expect(dialog.locator('.loan-simulation-table').first()).toBeVisible();

  await dialog.locator('.loan-compare-toggle input').check();
  await expect(dialog.locator('.loan-simulation-b')).toBeVisible();
  await expect(dialog.locator('.loan-simulation-control-card')).toHaveCount(2);
});

test('repayment 2500 syncs event-wise within five seconds and survives reload without losing table context',async({page,context,browser})=>{
  test.setTimeout(120_000);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const ids=await page.evaluate(async({password})=>{
    const json=async(path,method='GET',body,groupId)=>{
      const response=await fetch(path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
      const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}
      if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
      return data;
    };
    const suffix='repay_sync_'+String(Date.now());
    const account=await json('/api/v1/auth/register','POST',{username:suffix,password,displayName:'Repayment Sync Browser'});
    const project=await json('/api/v1/group-projects','POST',{name:'Repay Sync '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:1,nominalContribution:0,currency:'XAF'});
    const group=await json('/api/v1/group-projects/'+encodeURIComponent(project.id)+'/convert','POST',{});
    const members=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/members','GET',undefined,group.id);
    const membershipId=members.find(x=>x.userId===account.account.id)?.id??members[0]?.id;
    const loanRubric=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/rubrics','POST',{
      id:'loan-rubric-'+suffix,name:'Prêt',facets:{direction:'OUTFLOW',obligation:'EVENT_DRIVEN',medium:'CASH',refundability:'NOT_APPLICABLE',replenishment:'EVENT_DRIVEN',interestMode:'RATE',eligibilityMode:'RULE_BASED',custom:{systemKey:'LOAN'}},
      source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}
    },group.id);
    await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/rubrics/'+encodeURIComponent(loanRubric.id)+'/policies','PUT',{loan:{allowed:true,rateBasisPointsPerPeriod:0,interestBase:'PRINCIPAL_ONLY',paymentPriority:'CAPITAL_FIRST',interestTiming:'NEXT_SESSION_DUE',fundingMode:'AVAILABLE_GROUP_CASH',carryForwardUnusedFunds:true,noInterestOnInterest:true}},group.id);
    const repaymentRubric=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/rubrics','POST',{
      id:'repay-rubric-'+suffix,name:'Remboursements',facets:{direction:'INFLOW',obligation:'EVENT_DRIVEN',medium:'CASH',refundability:'NOT_APPLICABLE',replenishment:'EVENT_DRIVEN',interestMode:'NONE',eligibilityMode:'RULE_BASED',custom:{systemKey:'REPAYMENT',repaymentComponent:'PRINCIPAL'}},
      source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}
    },group.id);
    // Force a genuinely wide real matrix so position restoration is tested on
    // columns far to the right instead of relying on synthetic CSS width.
    for(let i=1;i<=10;i++)await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/rubrics','POST',{
      id:'wide-rubric-'+i+'-'+suffix,name:'Rubrique '+String(i).padStart(2,'0'),facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'NOT_APPLICABLE',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},
      source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}
    },group.id);
    const meeting=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/meetings','POST',{title:'Séance remboursement',scheduledAt:'2026-10-07T10:00:00.000Z'},group.id);
    await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/contributions/cash','POST',{membershipId,amount:10000,meetingId:meeting.id,idempotencyKey:'seed-cash-'+suffix},group.id);
    let loan=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/completion','POST',{kind:'LOAN',title:'Prêt test 10 000',data:{principal:10000,currency:'XAF',borrowerMembershipId:membershipId,rubricId:loanRubric.id,rateBasisPointsPerPeriod:0,paymentPriority:'CAPITAL_FIRST',interestTiming:'NEXT_SESSION_DUE',noInterestOnInterest:true,outstandingPrincipal:0,unpaidInterest:0,installmentsPerYear:12}},group.id);
    loan=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/completion/'+encodeURIComponent(loan.id)+'/transition','POST',{to:'SUBMITTED',expectedVersion:1,patch:{meetingId:meeting.id}},group.id);
    loan=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/completion/'+encodeURIComponent(loan.id)+'/transition','POST',{to:'APPROVED',expectedVersion:2,patch:{}},group.id);
    loan=(await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/loans/'+encodeURIComponent(loan.id)+'/disburse','POST',{amount:10000,expectedVersion:3,meetingId:meeting.id,rubricId:loanRubric.id,idempotencyKey:'disburse-'+suffix},group.id)).loan;
    localStorage.setItem('tontine.activeGroupId',group.id);
    return{groupId:group.id,membershipId,meetingId:meeting.id,repaymentRubricId:repaymentRubric.id,loanId:loan.id,username:suffix,actorId:account.account.id,tenantId:account.account.tenantId};
  },{password});

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[data-view="operations"]').first().click();
  const selector='.matrix-cell-entry[data-membership-id="'+ids.membershipId+'"][data-rubric-id="'+ids.repaymentRubricId+'"][data-meeting-id="'+ids.meetingId+'"]';
  const cell=page.locator('#meetingMatrix').locator(selector);
  await expect(cell).toBeVisible();

  // A second browser context models another device using the same account.
  // It must converge through the durable WebSocket push, not snapshot polling.
  const mirrorContext=await browser.newContext();
  const mirror=await mirrorContext.newPage();
  await mirror.goto(base+'/',{waitUntil:'domcontentloaded'});
  await mirror.evaluate(async({username,password,groupId})=>{
    const response=await fetch('/api/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,password})});
    if(!response.ok)throw new Error('MIRROR_LOGIN_'+response.status);
    localStorage.setItem('tontine.activeGroupId',groupId);
  },{username:ids.username,password,groupId:ids.groupId});
  await mirror.reload({waitUntil:'domcontentloaded'});
  await mirror.locator('button[data-view="operations"]').first().click();
  const mirrorCell=mirror.locator('#meetingMatrix').locator(selector);
  await expect(mirrorCell).toBeVisible();
  await expect(mirror.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:8000});
  let forbiddenIdleReads=0;
  mirror.on('request',request=>{
    const url=new URL(request.url());
    if(url.pathname.includes('/financial-cells/snapshot')||url.pathname.endsWith('/live/events'))forbiddenIdleReads++;
  });

  await context.setOffline(true);
  await cell.locator('.cell-target-input').fill('2500');
  await cell.locator('.cell-validate').click();
  await expect.poll(()=>amountFrom(cell)).toBe(2500);
  await expect(cell).toContainText(/synchro en attente/i);

  const syncStarted=Date.now();
  await context.setOffline(false);
  await expect.poll(async()=>page.evaluate(async ids=>{
    const response=await fetch('/api/v1/groups/'+encodeURIComponent(ids.groupId)+'/loans/'+encodeURIComponent(ids.loanId)+'/history',{headers:{'x-active-group-id':ids.groupId}});
    if(!response.ok)return false;
    const history=await response.json();
    return (history.events??[]).some(x=>Number(x.amount)===2500&&String(x.rubricId)===String(ids.repaymentRubricId));
  },ids),{timeout:5000,intervals:[200,350,500,700]}).toBe(true);
  expect(Date.now()-syncStarted).toBeLessThan(5500);
  await expect.poll(()=>amountFrom(cell),{timeout:5000}).toBe(2500);
  await expect.poll(()=>amountFrom(mirrorCell),{timeout:5000,intervals:[100,200,350,500]}).toBe(2500);
  await mirror.waitForTimeout(1800);
  expect(forbiddenIdleReads).toBe(0);

  // A second payment in the same cell must push the cumulative value, not
  // replace the first payment. Replay the same durable command after its ACK.
  const secondPayment=await page.evaluate(async ids=>{
    const headers={'content-type':'application/json','x-active-group-id':ids.groupId};
    const item={id:'second-'+ids.loanId,tenantId:'',actorId:'',type:'FINANCIAL_SHEET_ENTRY_V1',idempotencyKey:'second-'+ids.loanId,status:'PENDING',attempts:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),payload:{groupId:ids.groupId,membershipId:ids.membershipId,meetingId:ids.meetingId,rubricId:ids.repaymentRubricId,amount:1500,nature:'REPAYMENT',loanId:ids.loanId,repaymentComponent:'PRINCIPAL'}};
    item.tenantId=ids.tenantId;item.actorId=ids.actorId;
    const response=await fetch('/api/v1/outbox/apply',{method:'POST',headers,body:JSON.stringify(item)});const result=await response.json();if(!response.ok)throw Error(JSON.stringify(result));return{item,result};
  },ids);
  expect(secondPayment.result.canonicalAmount).toBe(4000);
  await expect.poll(()=>amountFrom(mirrorCell),{timeout:5000}).toBe(4000);
  const replay=await page.evaluate(async data=>{const r=await fetch('/api/v1/outbox/apply',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data.item)});const result=await r.json();if(!r.ok)throw Error(JSON.stringify(result));return result;},secondPayment);
  expect(replay.replayed).toBe(true);expect(replay.canonicalAmount).toBe(4000);

  // The app refresh must keep the horizontal place. Use a real phone-width
  // viewport so the replacement matrix still overflows after rerender; do not
  // fake overflow with an inline width that disappears during refresh.
  await page.setViewportSize({width:390,height:820});
  const wrap=page.locator('#meetingMatrix .canonical-financial-wrap');
  await wrap.evaluate(node=>{node.scrollLeft=node.scrollWidth;});
  const before=await wrap.evaluate(node=>node.scrollLeft);
  expect(before).toBeGreaterThan(0);
  await page.locator('#refreshBtn').evaluate(button=>button.click());
  await expect(page.locator('#view-operations')).toHaveClass(/active/);
  await expect.poll(async()=>page.locator('#meetingMatrix .canonical-financial-wrap').evaluate(node=>node.scrollLeft),{timeout:8000}).toBeGreaterThan(0);

  // A full page reload also restores the active Operations view, selected
  // meeting and matrix column rather than sending the manager back to Home.
  const currentWrap=page.locator('#meetingMatrix .canonical-financial-wrap');
  await currentWrap.evaluate(node=>{node.scrollLeft=node.scrollWidth;});
  expect(await currentWrap.evaluate(node=>node.scrollLeft)).toBeGreaterThan(0);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#view-operations')).toHaveClass(/active/);
  const reloaded=page.locator('#meetingMatrix').locator(selector);
  await expect(reloaded).toBeVisible();
  await expect.poll(()=>amountFrom(reloaded)).toBe(4000);
  await page.locator('#loansNavBtn').click();
  await expect(page.locator('#loanDebtRecap .debt-group-journey-table')).toBeVisible();
  for(const label of ['Capital restant','Intérêts dus','Prochains intérêts projetés','Total dette exigible'])await expect(page.locator('#loanDebtRecap')).toContainText(label);
  await mirrorContext.close();
});

