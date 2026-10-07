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
  const fixed=await sheet.locator('thead th:nth-child(2)').evaluate(node=>getComputedStyle(node).position);
  expect(fixed).toBe('sticky');
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
