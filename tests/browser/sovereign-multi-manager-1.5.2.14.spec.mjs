import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173',password='Synthetic-Multi-Manager-2026!';
const amount=async cell=>Number((await cell.locator('.cell-current').innerText()).replace(/[^0-9-]/g,''));
const api=(page,path,method='GET',body,groupId)=>page.evaluate(async({path,method,body,groupId})=>{
  const r=await fetch(path,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw Error(method+' '+path+' '+r.status+' '+JSON.stringify(data));return data;
},{path,method,body,groupId});
const cell=(page,ids)=>page.locator(`#meetingMatrix .matrix-cell-entry[data-membership-id="${ids.membershipId}"][data-rubric-id="${ids.rubricId}"][data-meeting-id="${ids.meetingId}"]`);
const enter=async(page,ids,value)=>{
  if(await amount(cell(page,ids))>0)page.once('dialog',d=>d.accept('Correction vérifiée entre gestionnaires'));
  await cell(page,ids).locator('.cell-target-input').fill(String(value));
  await cell(page,ids).locator('.cell-validate').click();
};
async function setup(page,browser){
  await page.goto(base);const suffix=Date.now()+'_'+Math.floor(Math.random()*100000);
  const account=await api(page,'/api/v1/auth/register','POST',{username:'owner_'+suffix,password,displayName:'Gestionnaire Alpha'});
  const project=await api(page,'/api/v1/group-projects','POST',{name:'Convergence '+suffix,kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:3,nominalContribution:0,currency:'XAF'});
  const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),groupId=group.id;
  const members=await api(page,'/api/v1/groups/'+groupId+'/members','GET',undefined,groupId),membershipId=members.find(x=>x.userId===account.account.id).id;
  const rubric=await api(page,'/api/v1/groups/'+groupId+'/rubrics','POST',{name:'Secours convergence',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},groupId);
  const meeting=await api(page,'/api/v1/groups/'+groupId+'/meetings','POST',{title:'Séance confrontation',scheduledAt:new Date().toISOString()},groupId);
  const invite=await api(page,'/api/v1/groups/'+groupId+'/join-links','POST',{mode:'AUTO_JOIN'},groupId);
  const secondContext=await browser.newContext(),second=await secondContext.newPage();await second.goto(base);
  await api(second,'/api/v1/auth/register','POST',{username:'manager_'+suffix,password,displayName:'Gestionnaire Beta'});
  const joined=await api(second,'/api/v1/join/redeem','POST',{code:invite.code});
  await api(page,'/api/v1/groups/'+groupId+'/members/'+joined.membershipId+'/lifecycle','PUT',{roles:['manager','member'],status:'active',reason:'Gestionnaire de qualification'},groupId);
  const ids={groupId,membershipId,rubricId:rubric.id,meetingId:meeting.id};
  for(const [p,username] of [[page,'owner_'+suffix],[second,'manager_'+suffix]]){
    await p.locator('[data-auth-mode="login"]').click();await p.locator('#authUsername').fill(username);await p.locator('#authPassword').fill(password);await p.locator('#authSubmit').click();await expect(p.locator('#authScreen')).toBeHidden();
    await p.evaluate(id=>localStorage.setItem('tontine.activeGroupId',id),groupId);await p.reload();await p.locator('button[data-view="operations"]').first().click();await expect(cell(p,ids)).toBeVisible();await expect(p.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:10000});
  }
  return{ids,second,secondContext};
}

const safeCellIntent=row=>({
  id:row.id,status:row.status,attempts:row.attempts,createdAt:row.createdAt,updatedAt:row.updatedAt,lastError:row.lastError,
  lastResult:{status:row.lastResult?.status,accepted:row.lastResult?.accepted,canonicalAmount:row.lastResult?.canonicalAmount,cellVersion:row.lastResult?.cellVersion,error:row.lastResult?.error},
  payload:{targetAmount:row.payload?.targetAmount,baselineValue:row.payload?.baselineValue,baselineVersion:row.payload?.baselineVersion,
    deviceSequence:row.payload?.deviceSequence,recordedOffline:row.payload?.recordedOffline,recordedAtClient:row.payload?.recordedAtClient,
    hasClockAnchor:Boolean(row.payload?.clockAnchorId),elapsedSinceAnchorMs:row.payload?.elapsedSinceAnchorMs}
});
async function recordLiveSyncTiming(page,ids,label,timeline){
  const requests=new WeakMap(),jobs=new Set();
  const add=(stage,detail={})=>timeline.push({atMs:Date.now(),page:label,stage,...detail});
  const request=r=>{
    const pathname=new URL(r.url()).pathname;
    if(!/\/outbox\/apply$|\/financial-cells$|\/ledger$|\/expenses$|\/workspaces$|\/financial-clock-anchor$/.test(pathname))return;
    const id=timeline.length+1;requests.set(r,id);
    let command={};
    if(r.method()==='POST'&&/\/outbox\/apply$|\/financial-cells$/.test(pathname)){
      try{const body=r.postDataJSON(),p=body.payload??body.intentV2??body;
        command={type:body.type,targetAmount:p.targetAmount,baselineValue:p.baselineValue,baselineVersion:p.baselineVersion,
          recordedOffline:p.recordedOffline,recordedAtClient:p.recordedAtClient,hasClockAnchor:Boolean(p.clockAnchorId),
          elapsedSinceAnchorMs:p.elapsedSinceAnchorMs};}catch{}
    }
    add('REQUEST',{id,method:r.method(),path:pathname,command});
  };
  const response=r=>{
    const id=requests.get(r.request());if(!id)return;
    add('RESPONSE_HEADERS',{id,status:r.status()});
    const job=(async()=>{
      // Whitelist financial ACK fields. Never attach cookies, signed tickets,
      // full request/response bodies, credentials or arbitrary record contents.
      if(/\/outbox\/apply$|\/financial-cells$/.test(new URL(r.url()).pathname)){
        try{const body=await r.json();add('ACK',{id,status:body.status,accepted:body.accepted,canonicalAmount:body.canonicalAmount,cellVersion:body.cellVersion,error:body.error});}
        catch{add('ACK_UNREADABLE',{id});}
      }else add('RESPONSE_COMPLETE',{id});
    })();jobs.add(job);void job.finally(()=>jobs.delete(job));
  };
  const failed=r=>{const id=requests.get(r);if(id)add('REQUEST_FAILED',{id});};
  page.on('request',request);page.on('response',response);page.on('requestfailed',failed);
  await page.evaluate(ids=>{
    const rows=[];window.__ecoLiveSyncTiming=rows;
    const listen=type=>window.addEventListener(type,event=>{
      const d=event.detail??{},p=d.payload??d;
      if(p.meetingId&&String(p.meetingId)!==ids.meetingId)return;
      if(p.membershipId&&String(p.membershipId)!==ids.membershipId)return;
      if(p.rubricId&&String(p.rubricId)!==ids.rubricId)return;
      const selector='.matrix-cell-entry[data-meeting-id="'+ids.meetingId+'"][data-membership-id="'+ids.membershipId+'"][data-rubric-id="'+ids.rubricId+'"]';
      const cell=document.querySelector(selector),text=cell?.querySelector('.cell-current')?.textContent;
      rows.push({atMs:Date.now(),stage:type,traceType:d.type,amount:p.newAmount??p.amount??p.target,cellVersion:p.cellVersion,
        display:text==null?null:Number(text.replace(/[^0-9-]/g,'')),saveState:cell?.dataset.saveState});
      if(rows.length>150)rows.shift();
    });
    for(const type of ['eco:financial-cell-trace','eco:financial-local-committed','eco:financial-live-update','eco:financial-data-changed','eco:transport-degraded','eco:transport-retry-ready'])listen(type);
  },ids);
  return async()=>{
    page.off('request',request);page.off('response',response);page.off('requestfailed',failed);
    await Promise.allSettled([...jobs]);
    return await page.evaluate(ids=>{
      const selector='.matrix-cell-entry[data-meeting-id="'+ids.meetingId+'"][data-membership-id="'+ids.membershipId+'"][data-rubric-id="'+ids.rubricId+'"]',cell=document.querySelector(selector),text=cell?.querySelector('.cell-current')?.textContent;
      return{events:window.__ecoLiveSyncTiming??[],display:text==null?null:Number(text.replace(/[^0-9-]/g,'')),saveState:cell?.dataset.saveState,connectivity:document.querySelector('#connectivity')?.textContent};
    },ids);
  };
}
async function attachLiveSyncTiming(testInfo,ids,page,second,stop,timeline,result){
  // Stop observers before this diagnostic GET: it is failure evidence, never
  // part of the application's idle Live request policy or convergence check.
  const states=await Promise.allSettled([stop[0](),stop[1](),storedCellIntent(page,ids),storedCellIntent(second,ids)]);
  const read=i=>states[i].status==='fulfilled'?states[i].value:{diagnosticUnavailable:true};
  const snapshot=await api(second,'/api/v1/groups/'+ids.groupId+'/financial-cells/snapshot','GET',undefined,ids.groupId).catch(()=>null);
  const canonical=snapshot?.cells?.find(x=>x.meetingId===ids.meetingId&&x.membershipId===ids.membershipId&&x.rubricId===ids.rubricId);
  const start=timeline[0]?.atMs??Date.now();
  const output={schemaVersion:1,result,thresholdMs:5000,canonicalCell:canonical?{amount:canonical.amount,cellVersion:canonical.cellVersion,updatedAt:canonical.updatedAt}:null,
    timeline:timeline.map(({atMs,...r})=>({elapsedMs:atMs-start,...r})),
    alpha:read(0),beta:read(1),alphaOutbox:Array.isArray(read(2))?read(2).map(safeCellIntent):read(2),betaOutbox:Array.isArray(read(3))?read(3).map(safeCellIntent):read(3)};
  for(const state of [output.alpha,output.beta])if(state.events)state.events=state.events.map(({atMs,...r})=>({elapsedMs:atMs-start,...r}));
  await testInfo.attach('live-sync-timing',{body:Buffer.from(JSON.stringify(output,null,2)),contentType:'application/json'});
  console.log('ECO_LIVE_SYNC_TIMING '+JSON.stringify(output));
}

test('distinct managers see typing and validated amounts, and an idle Live connection never polls financial snapshots',async({page,browser},testInfo)=>{
  test.setTimeout(90000);const {ids,second,secondContext}=await setup(page,browser);
  const timeline=[{atMs:Date.now(),stage:'SCENARIO_READY'}],stop=await Promise.all([recordLiveSyncTiming(page,ids,'Alpha',timeline),recordLiveSyncTiming(second,ids,'Beta',timeline)]);
  let result='PASS';
  try{
    let forbidden=0;second.on('request',r=>{if(/financial-cells\/snapshot|\/live\/events/.test(r.url()))forbidden++;});
    await cell(page,ids).locator('.cell-target-input').fill('1000');
    await expect(cell(second,ids)).toContainText(/Alpha.*saisit|Alpha.*écrit/,{timeout:5000});
    await cell(page,ids).locator('.cell-validate').click();await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(1000);
    await enter(second,ids,2001);await expect.poll(()=>amount(cell(page,ids)),{timeout:5000}).toBe(2001);
    await second.waitForTimeout(1200);expect(forbidden).toBe(0);
    await page.setViewportSize({width:390,height:820});await expect(cell(page,ids).locator('.cell-validate')).toBeVisible();
    await cell(page,ids).scrollIntoViewIfNeeded();
    // Visibility alone did not catch a sticky total covering the editable field.
    // A real touch-width edit must be actionable and reach the second manager.
    await cell(page,ids).locator('.cell-target-input').click();
    await enter(page,ids,2002);
    await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(2002);
    await page.screenshot({path:'test-results/convergence-mobile.png',fullPage:false});
    await page.locator('button[data-view="sessions"]').first().click();
    await page.locator('#sessionsMeetingSelect').selectOption('__cumulative__');
    await expect(page.locator('[data-session-tab="cumulative"]')).toHaveClass(/active/);
    for(const tab of ['beneficiaries','recap','debts','schedule']){
      await page.locator(`[data-session-tab="${tab}"]`).click();
      await expect(page.locator(`[data-session-tab="${tab}"]`)).toHaveClass(/active/);
      await expect(page.locator('#sessionsWorkspace')).not.toBeEmpty();
    }
  }catch(error){result='FAIL';throw error;}finally{
    try{await attachLiveSyncTiming(testInfo,ids,page,second,stop,timeline,result);}catch{console.log('ECO_LIVE_SYNC_TIMING_UNAVAILABLE');}
    await secondContext.close();
  }
});

test('offline divergent edits survive reload, confront the exact cell, and converge after keeping or explicitly reconfirming a value',async({page,context,browser},testInfo)=>{
  test.setTimeout(120000);const {ids,second,secondContext}=await setup(page,browser);
  try{
    await enter(page,ids,1000);await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(1000);
    await second.locator('#refreshBtn').click();await expect.poll(()=>amount(cell(second,ids))).toBe(1000);
    for(const p of [page,second])await p.waitForFunction(async()=>{for(const name of await caches.keys())if(await (await caches.open(name)).match('/__eco_release_ready__'))return Boolean(navigator.serviceWorker.controller);return false;});
    await context.setOffline(true);await secondContext.setOffline(true);
    await enter(page,ids,2000);await enter(second,ids,3000);
    await expect.poll(()=>amount(cell(page,ids))).toBe(2000);await expect.poll(()=>amount(cell(second,ids))).toBe(3000);
    await page.reload();await expect(cell(page,ids)).toBeVisible();await expect.poll(()=>amount(cell(page,ids))).toBe(2000);
    await secondContext.setOffline(false);await expect.poll(async()=>{
      const result=await api(second,'/api/v1/groups/'+ids.groupId+'/financial-cells/snapshot','GET',undefined,ids.groupId);return result.cells.find(x=>x.meetingId===ids.meetingId&&x.membershipId===ids.membershipId&&x.rubricId===ids.rubricId)?.amount;
    },{timeout:8000}).toBe(3000);
    await context.setOffline(false);const dialog=page.locator('#offlineFinancialConfrontation');await expect(dialog).toBeVisible({timeout:10000});
    await expect(dialog).toContainText('2 000');await expect(dialog).toContainText('3 000');await expect(cell(page,ids)).toHaveClass(/is-critical-conflict/);
    await dialog.getByRole('button',{name:'Conserver présent',exact:true}).click();await dialog.getByRole('button',{name:'Valider et synchroniser',exact:true}).click();
    await expect.poll(()=>amount(cell(page,ids)),{timeout:8000}).toBe(3000);await expect(cell(page,ids)).not.toHaveClass(/is-critical-conflict/);
    // The server-confirmed remote push must also survive a cold offline refresh.
    await context.setOffline(true);await page.reload();await expect(cell(page,ids)).toBeVisible();await expect.poll(()=>amount(cell(page,ids))).toBe(3000);
    await enter(page,ids,4000);await enter(second,ids,5000);await expect.poll(()=>amount(cell(second,ids))).toBe(5000);
    // A local amount is durable before its server ACK. Observe the canonical
    // 5,000 before asking the other device to make a new choice against it.
    await expect.poll(async()=>{
      const snapshot=await api(second,'/api/v1/groups/'+ids.groupId+'/financial-cells/snapshot','GET',undefined,ids.groupId);
      return snapshot.cells.find(x=>x.meetingId===ids.meetingId&&x.membershipId===ids.membershipId&&x.rubricId===ids.rubricId)?.amount;
    },{timeout:8000}).toBe(5000);
    await context.setOffline(false);await expect(dialog).toBeVisible({timeout:10000});await dialog.press('Escape');await expect(dialog).toHaveCount(0);
    await page.locator('[data-financial-confrontation]').click();await expect(dialog).toBeVisible();await expect(dialog).toContainText('4 000');await expect(dialog).toContainText('5 000');await dialog.getByRole('button',{name:'Appliquer cet appareil',exact:true}).click();await dialog.getByRole('button',{name:'Valider et synchroniser',exact:true}).click();
    try{
      await expect.poll(()=>amount(cell(second,ids)),{timeout:8000}).toBe(4000);await expect.poll(()=>amount(cell(page,ids))).toBe(4000);
      await page.reload();await expect.poll(()=>amount(cell(page,ids))).toBe(4000);
    }catch(error){
      // Distinguish canonical ordering, Outbox refusal and a stale Live display.
      // Only synthetic test data and selected metadata are attached, never tickets.
      const states=await Promise.allSettled([
        api(second,'/api/v1/groups/'+ids.groupId+'/financial-cells/snapshot','GET',undefined,ids.groupId),
        storedCellIntent(page,ids),storedCellIntent(second,ids),amount(cell(page,ids)),amount(cell(second,ids))
      ]);
      const safeIntent=row=>({id:row.id,status:row.status,attempts:row.attempts,createdAt:row.createdAt,updatedAt:row.updatedAt,lastError:row.lastError,
        lastResult:{status:row.lastResult?.status,accepted:row.lastResult?.accepted,canonicalAmount:row.lastResult?.canonicalAmount,cellVersion:row.lastResult?.cellVersion,error:row.lastResult?.error},
        payload:{groupId:row.payload?.groupId,targetAmount:row.payload?.targetAmount,baselineValue:row.payload?.baselineValue,baselineVersion:row.payload?.baselineVersion,
          deviceSequence:row.payload?.deviceSequence,recordedOffline:row.payload?.recordedOffline,recordedAtClient:row.payload?.recordedAtClient,
          hasClockAnchor:Boolean(row.payload?.clockAnchorId),elapsedSinceAnchorMs:row.payload?.elapsedSinceAnchorMs}});
      const read=i=>states[i].status==='fulfilled'?states[i].value:{error:String(states[i].reason)};
      const snapshot=read(0),local=read(1),remote=read(2);
      await testInfo.attach('offline-reconfirmation-state',{
        body:Buffer.from(JSON.stringify({canonicalCell:snapshot.cells?.find(x=>x.meetingId===ids.meetingId&&x.membershipId===ids.membershipId&&x.rubricId===ids.rubricId)??snapshot,
          localOutbox:Array.isArray(local)?local.map(safeIntent):local,remoteOutbox:Array.isArray(remote)?remote.map(safeIntent):remote,
          localDisplay:read(3),remoteDisplay:read(4)},null,2)),contentType:'application/json'
      });
      throw error;
    }
  }finally{await secondContext.close();}
});

const storedCellIntent=(page,ids)=>page.evaluate(ids=>new Promise((resolve,reject)=>{
  const open=indexedDB.open('tontine-platform');
  open.onerror=()=>reject(open.error);
  open.onsuccess=()=>{
    const db=open.result,read=db.transaction('outbox','readonly').objectStore('outbox').getAll();
    read.onerror=()=>{db.close();reject(read.error);};
    read.onsuccess=()=>{const rows=read.result.filter(x=>x.type==='FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'&&x.payload?.groupId===ids.groupId&&x.payload?.meetingId===ids.meetingId&&x.payload?.membershipId===ids.membershipId&&x.payload?.rubricId===ids.rubricId);db.close();resolve(rows);};
  };
}),ids);

test('server outage while navigator stays online stops idle retries and the durable cell converges on network return',async({page,browser})=>{
  test.setTimeout(90000);const {ids,second,secondContext}=await setup(page,browser);
  try{
    // Simulate an unreachable HTTPS API while the browser still reports online.
    // Keep the authenticated Live channel and the second manager's network alive.
    await page.evaluate(()=>{
      const send=window.fetch.bind(window);
      window.__ecoOutage={active:true,calls:0};
      window.fetch=(input,init)=>{
        const path=typeof input==='string'?input:input.url??String(input);
        if(window.__ecoOutage.active&&path.includes('/api/v1/')){
          window.__ecoOutage.calls++;
          return Promise.reject(new TypeError('Synthetic API transport outage'));
        }
        return send(input,init);
      };
    });
    expect(await page.evaluate(()=>navigator.onLine)).toBe(true);
    await enter(page,ids,1000);
    await expect.poll(()=>amount(cell(page,ids))).toBe(1000);
    await expect.poll(async()=>(await storedCellIntent(page,ids)).length).toBe(1);
    const [pending]=await storedCellIntent(page,ids);
    expect(['PENDING','FAILED']).toContain(pending.status);
    await page.waitForTimeout(9000);
    const attempts=await page.evaluate(()=>window.__ecoOutage.calls);
    expect(attempts).toBeGreaterThan(0);
    await page.waitForTimeout(8000);
    expect(await page.evaluate(()=>window.__ecoOutage.calls)).toBe(attempts);
    expect(await amount(cell(second,ids)),'an unsent local value is not server-confirmed finance').toBe(0);
    await page.evaluate(()=>{window.__ecoOutage.active=false;window.dispatchEvent(new Event('online'));});
    await expect.poll(()=>amount(cell(second,ids)),{timeout:10000}).toBe(1000);
    await expect.poll(async()=>(await storedCellIntent(page,ids))[0]?.status,{timeout:10000}).toBe('CONFIRMED');
    const [confirmed]=await storedCellIntent(page,ids);
    expect(confirmed.idempotencyKey).toBe(pending.idempotencyKey);
    expect(confirmed.payload.targetAmount).toBe(1000);
    const snapshot=await api(second,'/api/v1/groups/'+ids.groupId+'/financial-cells/snapshot','GET',undefined,ids.groupId);
    expect(snapshot.cells.find(x=>x.meetingId===ids.meetingId&&x.membershipId===ids.membershipId&&x.rubricId===ids.rubricId)?.amount).toBe(1000);
    await page.screenshot({path:'test-results/bounded-outage-recovered.png',fullPage:false});
  }finally{await secondContext.close();}
});
