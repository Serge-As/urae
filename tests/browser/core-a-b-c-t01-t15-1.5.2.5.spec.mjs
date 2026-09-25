import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173';
const password='Synthetic-browser-core-abc-2026!';

const cellSelector=({membershipId,rubricId,meetingId}) =>
  '.matrix-cell-entry[data-membership-id="'+membershipId+'"][data-rubric-id="'+rubricId+'"][data-meeting-id="'+meetingId+'"]';

const uiAmount=async locator=>{
  const text=await locator.locator('.cell-current').innerText();
  return Number(String(text).replace(/[^0-9-]/g,''));
};

const ledgerState=async(page,ids,rubricId)=>page.evaluate(async({ids,rubricId})=>{
  const response=await fetch('/api/v1/groups/'+encodeURIComponent(ids.groupId)+'/ledger',{headers:{'x-active-group-id':ids.groupId}});
  if(!response.ok)throw new Error('LEDGER_HTTP_'+response.status+':'+await response.text());
  const ledger=await response.json();
  const rows=(ledger.receipts??[]).filter(x=>x.meetingId===ids.meetingId&&x.membershipId===ids.membershipId&&x.rubricId===rubricId);
  return{
    total:rows.reduce((n,x)=>n+Number(x.netAmount??0),0),
    keys:rows.map(x=>x.idempotencyKey).filter(Boolean),
    rows:rows.length
  };
},{ids,rubricId});

test('T01–T15 lots A/B/C: navigateur, ✓/Entrée, remplacement exact, offline et synchronisation',async({page,context})=>{
  test.setTimeout(150_000);
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  let ids;

  await test.step('T01 — accès navigateur et bootstrap réel',async()=>{
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('body')).toContainText('Eco-System');
    ids=await page.evaluate(async({password})=>{
      const json=async(path,method='GET',body,groupId)=>{
        const response=await fetch(path,{
          method,
          headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},
          body:body===undefined?undefined:JSON.stringify(body)
        });
        const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}
        if(!response.ok)throw new Error(method+' '+path+' -> '+response.status+' '+text);
        return data;
      };
      const suffix=String(Date.now());
      const account=await json('/api/v1/auth/register','POST',{username:'abc_'+suffix,password,displayName:'ABC Browser'});
      const project=await json('/api/v1/group-projects','POST',{name:'ABC '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:3,nominalContribution:0,currency:'XAF'});
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
      for(const name of ['Cotisation ABC','Secours ABC','Collation ABC'])rubrics.push(await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/rubrics','POST',rubricBody(name),group.id));
      const meeting=await json('/api/v1/groups/'+encodeURIComponent(group.id)+'/meetings','POST',{title:'Séance ABC',scheduledAt:'2026-09-25T18:00:00.000Z'},group.id);
      localStorage.setItem('tontine.activeGroupId',group.id);
      return{groupId:group.id,membershipId,meetingId:meeting.id,rubricIds:rubrics.map(x=>x.id)};
    },{password});
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#authScreen')).toBeHidden();
  });

  const cell=index=>page.locator(cellSelector({membershipId:ids.membershipId,rubricId:ids.rubricIds[index],meetingId:ids.meetingId}));

  await test.step('T02 — matrice canonique visible sur la séance exacte',async()=>{
    await page.locator('button[data-view="operations"]').first().click();
    await expect(page.locator('#meetingMatrix .canonical-financial-matrix')).toBeVisible();
    await expect(cell(0)).toBeVisible();
  });

  await test.step('T03 — un rafraîchissement de projection ne doit pas effacer le champ en cours',async()=>{
    const input=cell(0).locator('.cell-target-input');
    await input.fill('1000');
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('eco:financial-data-changed')));
    await expect(input).toHaveValue('1000');
  });

  await test.step('T04 — ✓ appelle réellement le contrôleur et enregistre 1 000',async()=>{
    await cell(0).locator('.cell-validate').click();
    await expect.poll(()=>uiAmount(cell(0))).toBe(1000);
    await expect.poll(async()=>(await ledgerState(page,ids,ids.rubricIds[0])).total).toBe(1000);
  });

  await test.step('T05 — les totaux de ligne/colonne reflètent la validation',async()=>{
    await expect(page.locator('#meetingMatrix .table-row-total').first()).toContainText(/1.?000/);
    await expect(page.locator('#meetingMatrix .table-grand-total')).toContainText(/1.?000/);
  });

  await test.step('T06 — actualisation en ligne: 1 000 persiste',async()=>{
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('button[data-view="operations"]').first().click();
    await expect.poll(()=>uiAmount(cell(0))).toBe(1000);
  });

  await test.step('T07 — Entrée remplace exactement 1 000 par 500 dans la même cellule',async()=>{
    page.once('dialog',dialog=>dialog.accept('Correction T07 1000 vers 500'));
    await cell(0).locator('.cell-target-input').fill('500');
    await cell(0).locator('.cell-target-input').press('Enter');
    await expect.poll(()=>uiAmount(cell(0))).toBe(500);
  });

  await test.step('T08 — le Ledger vaut 500, jamais 1 500',async()=>{
    await expect.poll(async()=>(await ledgerState(page,ids,ids.rubricIds[0])).total).toBe(500);
    expect((await ledgerState(page,ids,ids.rubricIds[0])).total).not.toBe(1500);
  });

  await test.step('T09 — nouvelle actualisation: 500 reste la vérité projetée',async()=>{
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('button[data-view="operations"]').first().click();
    await expect.poll(()=>uiAmount(cell(0))).toBe(500);
  });

  await test.step('T10 — le shell offline qualifié prend le contrôle sans forcer une nouvelle PWA',async()=>{
    const state=await page.evaluate(async()=>{
      if(!('serviceWorker' in navigator))return{supported:false,ready:false};
      try{await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});}catch{}
      const start=Date.now();
      while(Date.now()-start<12000){
        const reg=await navigator.serviceWorker.getRegistration('/');
        const keys=await caches.keys();
        if(reg?.active&&keys.includes('eco-system-v1523-financial-entry-offline-20260925'))return{supported:true,ready:true};
        await new Promise(r=>setTimeout(r,250));
      }
      return{supported:true,ready:false};
    });
    expect(state.ready).toBe(true);
  });

  await test.step('T11 — hors ligne, ✓ persiste localement une nouvelle valeur',async()=>{
    await context.setOffline(true);
    await cell(1).locator('.cell-target-input').fill('3000');
    await cell(1).locator('.cell-validate').click();
    await expect.poll(()=>uiAmount(cell(1))).toBe(3000);
    await expect(cell(1)).toContainText(/Enregistré sur cet appareil|synchro en attente/i);
  });

  await test.step('T12 — rechargement hors ligne: 3 000 reste visible et pending',async()=>{
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(1000);
    await page.locator('button[data-view="operations"]').first().click();
    await expect.poll(()=>uiAmount(cell(1))).toBe(3000);
    await expect(cell(1)).toContainText(/Enregistré sur cet appareil|synchro en attente/i);
  });

  await test.step('T13 — hors ligne, Entrée suit le même chemin durable',async()=>{
    await cell(2).locator('.cell-target-input').fill('4000');
    await cell(2).locator('.cell-target-input').press('Enter');
    await expect.poll(()=>uiAmount(cell(2))).toBe(4000);
    await expect(cell(2)).toContainText(/Enregistré sur cet appareil|synchro en attente/i);
  });

  await test.step('T14 — reconnexion synchronise les deux valeurs exactes',async()=>{
    await context.setOffline(false);
    await expect.poll(async()=>(await ledgerState(page,ids,ids.rubricIds[1])).total,{timeout:30_000}).toBe(3000);
    await expect.poll(async()=>(await ledgerState(page,ids,ids.rubricIds[2])).total,{timeout:30_000}).toBe(4000);
  });

  await test.step('T15 — rechargement final: pas de doublon, pas d’erreur navigateur',async()=>{
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('button[data-view="operations"]').first().click();
    await expect.poll(()=>uiAmount(cell(0))).toBe(500);
    await expect.poll(()=>uiAmount(cell(1))).toBe(3000);
    await expect.poll(()=>uiAmount(cell(2))).toBe(4000);
    for(let i=0;i<3;i++){
      const state=await ledgerState(page,ids,ids.rubricIds[i]);
      expect(new Set(state.keys).size).toBe(state.keys.length);
    }
    expect(pageErrors).toEqual([]);
  });
});
