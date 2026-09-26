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
});
