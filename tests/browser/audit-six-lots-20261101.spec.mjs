import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {base,api,cell,enter,setup} from './eight-lots-fixture.mjs';
test.setTimeout(180000);
async function harness(page,html){await page.route('**/six-lot-fixture.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="fr"><head><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/canopee.css"></head><body class="eco-canopee">'+html+'</body></html>'}));await page.goto(base+'/six-lot-fixture.html');}

test('two managers review the exact current self-entry version without changing cash; stale approval cannot cover the next correction',async({page,browser})=>{
 const {ids,second,secondContext}=await setup(page,browser,{requireLive:false});try{
  await enter(page,ids,5000);await expect(cell(page,ids)).toHaveAttribute('data-save-state','CONFIRMED',{timeout:30000});
  const path='/api/v1/groups/'+ids.groupId,membershipPath=path+'/members/'+ids.membershipId+'/financial-notices';
  await expect.poll(async()=>{const notices=await api(second,membershipPath,'GET',undefined,ids.groupId);return notices.some(n=>n.reviewState==='PENDING'&&n.cellVersion===1);}).toBe(true);
  const notices=await api(second,membershipPath,'GET',undefined,ids.groupId),first=notices.find(n=>n.cellVersion===1);expect(Date.parse(first.reviewDueAt)-Date.parse(first.serverReceivedAt)).toBe(48*3600000);
  await api(second,path+'/meetings/'+ids.meetingId+'/financial-cells/review','POST',{membershipId:ids.membershipId,rubricId:ids.rubricId,amount:5000,cellVersion:1,decision:'APPROVE'},ids.groupId);
  expect((await api(second,membershipPath,'GET',undefined,ids.groupId)).find(n=>n.id===first.id).reviewState).toBe('REVIEWED');
  await enter(page,ids,7000);await expect(cell(page,ids)).toHaveAttribute('data-save-state','CONFIRMED',{timeout:30000});
  await expect.poll(async()=>{const ns=await api(second,membershipPath,'GET',undefined,ids.groupId);return ns.some(n=>n.cellVersion===2&&n.reviewState==='PENDING');}).toBe(true);
  const before=await api(second,path+'/ledger','GET',undefined,ids.groupId);expect(before.summary.cashBalance).toBe(7000);
  await expect(api(second,path+'/meetings/'+ids.meetingId+'/financial-cells/review','POST',{membershipId:ids.membershipId,rubricId:ids.rubricId,amount:5000,cellVersion:1,decision:'APPROVE'},ids.groupId)).rejects.toThrow(/CELL_REVIEW_STALE/);
  expect((await api(second,path+'/ledger','GET',undefined,ids.groupId)).summary.cashBalance).toBe(before.summary.cashBalance);
 }finally{await secondContext.close();}
});

test('group overview keeps all critical priorities, cash and published opportunities; details remain reachable on mobile',async({page},testInfo)=>{
 await harness(page,'<main style="max-width:1280px;margin:auto;padding:16px"><div id="groupHomeContent"></div></main>');
 await page.evaluate(async()=>{const {mountGroupHomeUI}=await import('/src/group-home-ui.js');const empty=async()=>[],members=[{id:'own',userId:'a',displayName:'Serge',status:'active',roles:['manager']}];
  const app={activeGroup:()=> 'g',currentTenant:()=> 't',currentActor:()=> 'a',groupMe:async()=>({isManager:true,membership:members[0]}),groupIdentityPassport:async()=>({publicCode:'ECO-G'}),groupIdentityProfile:async()=>({}),starterKit:async()=>null,meetingBeneficiaries:empty,meetingAttendance:empty,globalRecap:async()=>({layout:{columns:[]},rows:[]}),ledger:async()=>({summary:{cashBalance:45200,memberFundsLiability:30000,currency:'XAF'},receipts:[]}),arrears:empty,listCompletion:empty,exercises:empty,inboxItems:async()=>[...Array.from({length:5},(_,i)=>({id:'c'+i,groupId:'g',title:'Critique '+i,priority:'CRITICAL',status:'open'})),{id:'other',groupId:'private',title:'Montant privé autre groupe',priority:'CRITICAL',status:'open'},{id:'ordinary',groupId:'g',title:'À suivre',priority:'normal',status:'open'}],valueOffers:async()=>[{id:'offer',title:'Maraîchage du quartier',status:'PUBLISHED'}]};
  window.__home=mountGroupHomeUI({app,getGroups:()=>[{id:'g',name:'Association Canopée',kind:'association'}],getMembers:()=>members,getMeetings:()=>[],navigate:()=>{},fmt:n=>String(n)});await window.__home.refresh();});
 await expect(page.locator('.group-home-priority.is-critical')).toHaveCount(5);await expect(page.locator('.group-home-priorities')).toContainText('Voir une autre action');await expect(page.locator('body')).not.toContainText('Montant privé autre groupe');await expect(page.locator('.group-home-cash')).toContainText('45200');await expect(page.locator('.group-home-live-offers')).toContainText('Maraîchage du quartier');
 const details=page.locator('.group-home-finance-details');await expect(details).not.toHaveAttribute('open');await details.locator('summary').click();await expect(page.locator('.group-home-recap')).toBeVisible();
 for(const width of [360,1280]){await page.setViewportSize({width,height:900});const rail=await page.locator('.group-home-next').boundingBox(),people=await page.locator('.eco-group-people').boundingBox();expect(rail.y+rail.height).toBeLessThanOrEqual(people.y+1);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+2);await page.screenshot({path:testInfo.outputPath('six-lots-home-'+width+'.png'),fullPage:true});}
});

test('runtime translation changes only new content and optional speech protects member names and never validates on its own',async({page})=>{
 await harness(page,'<main><div id="legacy">Accueil</div><div data-i18n-owner="component">Accueil du composant</div><input class="cell-target-input"></main>');
 await page.evaluate(async()=>{const i18n=await import('/src/runtime-i18n.js');window.__locale='en';i18n.captureRuntimeI18n(document);i18n.applyRuntimeLocale('en');window.__stopI18n=i18n.installRuntimeI18nObserver(()=>window.__locale);window.__i18n=i18n;
  window.__oldWrites=0;new MutationObserver(rows=>window.__oldWrites+=rows.length).observe(document.getElementById('legacy'),{subtree:true,characterData:true});const added=document.createElement('div');added.id='added';added.textContent='Accueil';document.body.append(added);});
 await expect(page.locator('#added')).toHaveText('Home');expect(await page.evaluate(()=>window.__oldWrites)).toBe(0);await expect(page.locator('[data-i18n-owner="component"]')).toHaveText('Accueil du composant');
 await page.evaluate(()=>{window.__locale='fr';window.__i18n.applyRuntimeLocale('fr');});await expect(page.locator('#legacy')).toHaveText('Accueil');await expect(page.locator('#added')).toHaveText('Accueil');
 await page.evaluate(async()=>{window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices:()=>[{lang:'fr-CM',localService:true}],speak:u=>window.__spoken.push(u.text)}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};const {createVoiceEcho}=await import('/src/voice-echo.js');window.__echo=createVoiceEcho({scope:()=> 'synthetic',notify:()=>{}});localStorage.setItem('eco.voiceEcho.synthetic',JSON.stringify({enabled:true,names:false}));window.__accepted=null;void window.__echo.before({amount:5000,memberName:'Serge',rubricName:'Épargne'}).then(x=>window.__accepted=x);});
 const dialog=page.locator('dialog[data-voice-echo="confirmation"]');await expect(dialog).toBeVisible();await expect(dialog).not.toContainText('Serge');expect((await page.evaluate(()=>window.__spoken.join(' '))).replace(/\D/g,'')).toBe('5000');await dialog.getByRole('button',{name:'Revenir à la saisie'}).click();await expect.poll(()=>page.evaluate(()=>window.__accepted)).toBe(false);
});

test('Excel export works offline from the authorized member view and never reads another member statement',async({page},testInfo)=>{
 await harness(page,'<section id="view-documents"></section>');
 await page.evaluate(async()=>{const {mountPrintCenterUI}=await import('/src/print-center.js');window.__readMembers=[];const members=[{id:'own',userId:'a',displayName:'Serge',status:'active',roles:['member']},{id:'other',userId:'b',displayName:'Private colleague',status:'active',roles:['member']}];
  const app={activeGroup:()=> 'g',currentActor:()=> 'a',memberStatement:async id=>{window.__readMembers.push(id);if(id!=='own')throw Error('PRIVATE');return{receipts:[{id:'own-receipt',rubricId:'r',netAmount:5000,receivedAt:'2026-11-01T10:00:00Z'}],totalNetContributions:5000};}};
  window.__print=mountPrintCenterUI({app,getGroups:()=>[{id:'g',name:'Groupe synthétique'}],getMembers:()=>members,getMeetings:()=>[],getRubrics:()=>[{id:'r',name:'Épargne',status:'ACTIVE'}],isManager:()=>false,showError:e=>{window.__error=String(e);}});await window.__print.refresh();});
 await page.locator('[name="kind"]').selectOption('MEMBER_SHEET');await expect(page.locator('#paperPrintCenter')).not.toContainText('Private colleague');await page.context().setOffline(true);
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter Excel (.xlsx)'}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/\.xlsx$/);const output=testInfo.outputPath('member-offline.xlsx');await download.saveAs(output);expect((await readFile(output)).subarray(0,4).toString('hex')).toBe('504b0304');expect(await page.evaluate(()=>window.__readMembers.every(x=>x==='own'))).toBe(true);await page.context().setOffline(false);
});
