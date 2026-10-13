import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4173';
const ids=['recapMetrics','recapAlerts','recapIdentityLive','recapMembers','recapMeetingsRubrics','recapFinance','recapExceptions','recapCommunityMarket','recapActions'];
const setup=async page=>{
  await page.goto(base+'/health');
  await page.setContent('<!doctype html><html><body><button id="recapNavBtn"></button><div id="recapAccessDenied" hidden></div><section id="recapContent">'+ids.map(id=>'<div id="'+id+'"></div>').join('')+'</section></body></html>');
};
test('ordinary member sees only their own canonical Recap, never the manager Ledger',async({page})=>{
  await setup(page);
  await page.evaluate(async()=>{
    const {mountRecapUI}=await import('/src/recap-ui.js');
    window.__ledgerReads=0;
    const app={
      activeGroup:()=> 'g1',currentActor:()=> 'actor-a',
      memberStatement:async id=>{
        if(id!=='own')throw Error('WRONG_MEMBER');
        return{groupName:'Association un',totalNetContributions:2500,totalDebt:700,debtPrincipal:600,debtInterest:100,asOf:'2026-10-13T08:00:00Z'};
      },
      ledger:async()=>{window.__ledgerReads++;throw Error('LEAK');}
    };
    window.__recap=mountRecapUI({app,getGroups:()=>[{id:'g1',name:'Association un'}],
      getMembers:()=>[{id:'own',groupId:'g1',userId:'actor-a',status:'active',displayName:'Moi'},{id:'other',groupId:'g1',userId:'actor-b',status:'active',displayName:'Autre membre secret'}],
      getMeetings:()=>[],getRubrics:()=>[],isManager:()=>false,navigate:()=>{},fmt:n=>String(n),date:v=>v});
    await window.__recap.refresh();
  });
  await expect(page.locator('#recapContent')).toBeVisible();
  await expect(page.locator('#recapMetrics')).toContainText('2500');
  await expect(page.locator('#recapFinance')).toContainText('100');
  await expect(page.locator('#recapContent')).not.toContainText('Autre membre secret');
  expect(await page.evaluate(()=>window.__ledgerReads)).toBe(0);
});
test('manager cannot render an old group A response over newly-selected group B',async({page})=>{
  await setup(page);
  await page.evaluate(async()=>{
    const {mountRecapUI}=await import('/src/recap-ui.js');
    window.__activeGroup='A';window.__oldResolved=false;
    const empty=async()=>[];
    const app={
      activeGroup:()=>window.__activeGroup,currentActor:()=> 'manager',
      groupIdentityPassport:async()=>null,conciergeProfile:async()=>null,
      ledger:async()=>window.__activeGroup==='A'?await new Promise(resolve=>window.__resolveOld=()=>{
        window.__oldResolved=true;resolve({summary:{cashBalance:999,memberFundsLiability:0,entryCount:0},receipts:[]});
      }):{summary:{cashBalance:42,memberFundsLiability:0,entryCount:0},receipts:[]},
      arrears:empty,listCompletion:empty,listPairingRequests:empty,listApplications:empty,miscPostings:empty,miscRubrics:empty,
      listCommunityHubs:empty,groupStorefront:async()=>({shop:null,items:[]}),liveHealth:async()=>null,
      listJoinLinks:empty,dataUseConsent:async()=>null,ecoPulseProfile:async()=>({affinities:[]})
    };
    window.__recap=mountRecapUI({app,getGroups:()=>[{id:'A',name:'Ancien groupe'},{id:'B',name:'Nouveau groupe'}],
      getMembers:()=>[],getMeetings:()=>[],getRubrics:()=>[],isManager:()=>true,navigate:()=>{},fmt:n=>String(n),date:v=>v});
    window.__oldTask=window.__recap.refresh();
    window.__activeGroup='B';
    await window.__recap.refresh();
    window.__resolveOld();
    await window.__oldTask;
  });
  await expect(page.locator('#recapIdentityLive')).toContainText('Nouveau groupe');
  await expect(page.locator('#recapFinance')).toContainText('42');
  await expect(page.locator('#recapContent')).not.toContainText('Ancien groupe');
  await expect(page.locator('#recapContent')).not.toContainText('999');
  expect(await page.evaluate(()=>window.__oldResolved)).toBe(true);
});
