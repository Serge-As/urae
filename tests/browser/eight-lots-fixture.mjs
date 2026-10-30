import {expect} from '@playwright/test';
import {settleWorkDialog} from './financial-work-mode-helper.mjs';
const base=process.env.EIGHT_LOTS_URL||'http://127.0.0.1:4173',password='Synthetic-Multi-Manager-2026!';
const amount=async cell=>Number((await cell.locator('.cell-current').innerText()).replace(/[^0-9-]/g,''));
const api=(page,path,method='GET',body,groupId)=>page.evaluate(async({path,method,body,groupId})=>{
  const scope=sessionStorage.getItem('eco.window.session.v1');
  const r=await fetch(path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(scope?{'x-eco-window-id':scope}:{}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw Error(method+' '+path+' '+r.status+' '+JSON.stringify(data));return data;
},{path,method,body,groupId});
const cell=(page,ids)=>page.locator(`#meetingMatrix .matrix-cell-entry[data-membership-id="${ids.membershipId}"][data-rubric-id="${ids.rubricId}"][data-meeting-id="${ids.meetingId}"]`);
const enter=async(page,ids,value)=>{
  if(await amount(cell(page,ids))>0)page.once('dialog',d=>d.accept('Correction vérifiée entre gestionnaires'));
  await cell(page,ids).locator('.cell-target-input').fill(String(value));
  await cell(page,ids).locator('.cell-validate').click();await settleWorkDialog(page);
};
async function setup(page,browser,{requireLive=true}={}){
  await page.goto(base);await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);const suffix=Date.now()+'_'+Math.floor(Math.random()*100000);
  const account=await api(page,'/api/v1/auth/register','POST',{username:'owner_'+suffix,password,displayName:'Gestionnaire Alpha'});
  const project=await api(page,'/api/v1/group-projects','POST',{name:'Convergence '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:3,nominalContribution:0,currency:'XAF'});
  const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),groupId=group.id;
  const members=await api(page,'/api/v1/groups/'+groupId+'/members','GET',undefined,groupId),membershipId=members.find(x=>x.userId===account.account.id).id;
  const rubric=await api(page,'/api/v1/groups/'+groupId+'/rubrics','POST',{name:'Secours convergence',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},groupId);
  const meeting=await api(page,'/api/v1/groups/'+groupId+'/meetings','POST',{title:'Séance confrontation',scheduledAt:new Date().toISOString()},groupId);
  const invite=await api(page,'/api/v1/groups/'+groupId+'/join-links','POST',{mode:'AUTO_JOIN'},groupId);
  const secondContext=await browser.newContext(),second=await secondContext.newPage();await second.goto(base);
  await expect.poll(()=>second.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
  await api(second,'/api/v1/auth/register','POST',{username:'manager_'+suffix,password,displayName:'Gestionnaire Beta'});
  const joined=await api(second,'/api/v1/join/redeem','POST',{code:invite.code});
  await api(page,'/api/v1/groups/'+groupId+'/members/'+joined.membershipId+'/lifecycle','PUT',{roles:['manager','member'],status:'active',reason:'Gestionnaire de qualification'},groupId);
  const ids={groupId,membershipId,rubricId:rubric.id,meetingId:meeting.id};
  // Registration already established each window's real authorized session.
  // Do not authenticate the same fixture again and exhaust the production-like
  // IP rate limiter as this suite grows. Login itself has dedicated UI coverage.
  for(const p of [page,second]){
    await p.evaluate(id=>localStorage.setItem('tontine.activeGroupId',id),groupId);await p.reload();
    await expect(p.locator('#authScreen')).toBeHidden();
    await p.locator('button[data-view="operations"]').first().click();
    await expect(cell(p,ids)).toBeVisible({timeout:35000});
    if(requireLive)await expect(p.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:10000});
  }
  return{ids,second,secondContext};
}


export {base,api,cell,enter,setup};
