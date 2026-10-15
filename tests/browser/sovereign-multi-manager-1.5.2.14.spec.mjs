import {settleWorkDialog} from './financial-work-mode-helper.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {test,expect} from '@playwright/test';

const base='http://127.0.0.1:4173',password='Synthetic-Multi-Manager-2026!';
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
async function setup(page,browser){
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
    await p.evaluate(id=>localStorage.setItem('tontine.activeGroupId',id),groupId);await p.reload();await p.locator('button[data-view="operations"]').first().click();await expect(cell(p,ids)).toBeVisible();await expect(p.locator('#connectivity')).toHaveText(/En ligne · Live$/,{timeout:10000});
  }
  return{ids,second,secondContext};
}

test('a slow response still confirms once, Meeting mode keeps the editor, and the other manager receives the amount',async({page,browser})=>{
  test.setTimeout(120000);const {ids,second,secondContext}=await setup(page,browser);
  try{
    let sends=0;
    await page.route('**/api/v1/outbox/apply',async route=>{
      const body=route.request().postDataJSON();
      if(String(body.type).startsWith('FINANCIAL_CELL')){sends++;const response=await route.fetch();await new Promise(r=>setTimeout(r,3100));await route.fulfill({response});}
      else await route.continue();
    });
    await cell(page,ids).locator('.cell-target-input').fill('1750');
    await expect(cell(second,ids)).toContainText(/Alpha.*saisit/,{timeout:5000});
    await cell(page,ids).locator('.cell-validate').click();await settleWorkDialog(page);
    await expect(page.locator('#meetingMatrix .eco-work-toolbar')).toContainText('Réunion');
    await expect(cell(page,ids)).toHaveAttribute('data-save-state','CONFIRMED',{timeout:9000});
    await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(1750);
    expect(sends,'one durable command, one completed send').toBe(1);
    await expect(page.locator('#connectivity')).toHaveText(/En ligne · Live$/);
    await page.locator('button[data-view="sessions"]').first().click();
    await page.locator('#sessionsMeetingSelect').selectOption(ids.meetingId);
    await page.locator('[data-session-tab="sheet"]').click();
    await expect(page.locator('#sessionsWorkspace .eco-work-toolbar')).toContainText('Réunion');
    await page.screenshot({path:'artifacts/meeting-synchronized.png',fullPage:false});
  }finally{await secondContext.close();}
});

test('20, 40 and 100 categories are all covered by complete fitting parts, with invariant general totals',async({page,browser})=>{
  test.setTimeout(240000);const {ids,secondContext}=await setup(page,browser);await secondContext.close();
  await page.setViewportSize({width:1440,height:960});
  await enter(page,ids,1000);await expect(cell(page,ids)).toHaveAttribute('data-save-state','CONFIRMED');
  const rubricBody=name=>({name,facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}});
  for(const size of [20,40,100]){
    let rows=await api(page,'/api/v1/groups/'+ids.groupId+'/rubrics','GET',undefined,ids.groupId);
    while(rows.length<size){const r=await api(page,'/api/v1/groups/'+ids.groupId+'/rubrics','POST',rubricBody('Rubrique activité '+(rows.length+1)),ids.groupId);rows.push(r);}
    await page.locator('#refreshBtn').click();
    const root=page.locator('#meetingMatrix');
    await expect(root).toHaveAttribute('data-rubric-count',String(size));
    await expect(root.locator('table.canonical-financial-matrix')).toHaveAttribute('data-fitted','true');
    const parts=Number(await root.getAttribute('data-parts'));expect(parts).toBeGreaterThan(2);
    await expect(root.getByRole('button',{name:'Vue en 2 parties',exact:true})).toHaveCount(0);
    const seen=[];let total;
    for(let i=0;i<parts;i++){
      await root.getByRole('combobox',{name:'Choisir une partie du tableau'}).selectOption(String(i));
      const geometry=await root.locator('.canonical-financial-wrap').evaluate(w=>({overflow:w.scrollWidth-w.clientWidth,width:w.clientWidth,table:w.querySelector('table').getBoundingClientRect().width}));
      expect(geometry.overflow,'part '+(i+1)+'/'+parts+' must be complete').toBeLessThanOrEqual(2);
      expect(geometry.width).toBeGreaterThan(0);
      seen.push(...await root.locator('tbody tr').first().locator('td[data-rubric-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.rubricId)));
      const displayed=await root.locator('.table-grand-total').innerText();if(total===undefined)total=displayed;expect(displayed).toBe(total);
    }
    expect(seen.length).toBe(size);expect([...new Set(seen)].sort()).toEqual(rows.map(r=>r.id).sort());
    expect(Number(total.replace(/[^0-9-]/g,''))).toBe(1000);
    await page.screenshot({path:'artifacts/meeting-'+size+'-categories.png',fullPage:false});
  }
  await page.setViewportSize({width:700,height:900});
  await page.locator('#workspaceUiMode').selectOption('senior');
  await expect(page.locator('#meetingMatrix table')).toHaveAttribute('data-fitted','true');
  expect(await page.locator('#meetingMatrix .canonical-financial-wrap').evaluate(w=>w.scrollWidth-w.clientWidth)).toBeLessThanOrEqual(2);
  await page.screenshot({path:'artifacts/meeting-100-senior-narrow.png',fullPage:false});
});

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
  const requests=output.timeline.filter(row=>row.stage==='REQUEST');
  const grouped=new Map();
  for(const request of requests){const key=request.page+' '+request.path;grouped.set(key,(grouped.get(key)??0)+1);}
  const syncDelays=[];
  for(const [label,state,remote] of [['Alpha',output.alpha,output.beta],['Beta',output.beta,output.alpha]]){
    for(const submit of state.events??[]){
      if(submit.stage!=='eco:financial-cell-trace'||submit.traceType!=='CELL_SUBMIT')continue;
      const seen=(remote.events??[]).find(event=>event.elapsedMs>=submit.elapsedMs&&event.stage==='eco:financial-live-update'&&event.traceType==='MEETING_UPDATE'&&event.amount===submit.amount&&event.display===submit.amount);
      syncDelays.push({author:label,amount:submit.amount,remoteDisplayDelayMs:seen?seen.elapsedMs-submit.elapsedMs:null});
    }
  }
  const idleStart=output.timeline.find(row=>row.stage==='IDLE_WINDOW_START')?.elapsedMs,idleEnd=output.timeline.find(row=>row.stage==='IDLE_WINDOW_END')?.elapsedMs;
  const idleExpenseReads=idleStart===undefined?null:requests.filter(row=>row.elapsedMs>=idleStart&&row.elapsedMs<idleEnd&&/\/expenses$/.test(row.path)).length;
  const summary={result:output.result,thresholdMs:output.thresholdMs,canonicalCell:output.canonicalCell,totalRequests:requests.length,
    requestsByPageAndPath:[...grouped].sort((a,b)=>b[1]-a[1]).map(([path,count])=>({path,count})),
    syncDelays,idleExpenseReads,alpha:{display:output.alpha.display,saveState:output.alpha.saveState},beta:{display:output.beta.display,saveState:output.beta.saveState},
    alphaOutbox:Array.isArray(output.alphaOutbox)?output.alphaOutbox.map(row=>({status:row.status,attempts:row.attempts,targetAmount:row.payload.targetAmount,error:row.lastError,businessStatus:row.lastResult?.status,hasClockAnchor:row.payload?.hasClockAnchor,deviceSequence:row.payload?.deviceSequence})):output.alphaOutbox,
    betaOutbox:Array.isArray(output.betaOutbox)?output.betaOutbox.map(row=>({status:row.status,attempts:row.attempts,targetAmount:row.payload.targetAmount})):output.betaOutbox};
  // Keep complete selected-field evidence, but put a short summary in the terminal.
  // A shallow native Node path avoids PowerShell recursion through long artifact names.
  if(process.env.ECO_LIVE_SYNC_OUTPUT_DIR){
    const directory=path.resolve(process.env.ECO_LIVE_SYNC_OUTPUT_DIR);await mkdir(directory,{recursive:true});
    await writeFile(path.join(directory,'live-sync-timing.json'),JSON.stringify(output,null,2)+'\n','utf8');
    await writeFile(path.join(directory,'live-sync-summary.json'),JSON.stringify(summary,null,2)+'\n','utf8');
  }
  console.log('ECO_LIVE_SYNC_SUMMARY '+JSON.stringify(summary));
}

test('distinct managers see typing and validated amounts, and an idle Live connection never polls financial snapshots',async({page,browser},testInfo)=>{
  test.setTimeout(90000);const {ids,second,secondContext}=await setup(page,browser);
  const timeline=[{atMs:Date.now(),stage:'SCENARIO_READY'}],stop=await Promise.all([recordLiveSyncTiming(page,ids,'Alpha',timeline),recordLiveSyncTiming(second,ids,'Beta',timeline)]);
  let result='PASS';
  try{
    let forbidden=0;second.on('request',r=>{if(/financial-cells\/snapshot|\/live\/events/.test(r.url()))forbidden++;});
    await cell(page,ids).locator('.cell-target-input').fill('1000');
    await expect(cell(second,ids)).toContainText(/Alpha.*saisit|Alpha.*écrit/,{timeout:5000});
    await cell(page,ids).locator('.cell-validate').click();await settleWorkDialog(page);await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(1000);
    await enter(second,ids,2001);await expect.poll(()=>amount(cell(page,ids)),{timeout:5000}).toBe(2001);
    // The author must be server-confirmed before observing a true idle window.
    await expect.poll(async()=>(await storedCellIntent(second,ids)).find(row=>row.payload?.targetAmount===2001)?.status,{timeout:5000}).toBe('CONFIRMED');
    await second.waitForTimeout(300);
    const idleReads=[],idleListeners=[];
    for(const [p,label] of [[page,'Alpha'],[second,'Beta']]){
      const listener=request=>{
        const pathname=new URL(request.url()).pathname;
        if(request.method()==='GET'&&/\/expenses$|\/ledger$|\/financial-cells\/snapshot$|\/live\/events$/.test(pathname))idleReads.push({page:label,path:pathname});
      };
      p.on('request',listener);idleListeners.push([p,listener]);
    }
    timeline.push({atMs:Date.now(),stage:'IDLE_WINDOW_START'});
    try{await second.waitForTimeout(1200);}finally{
      for(const [p,listener] of idleListeners)p.off('request',listener);
      timeline.push({atMs:Date.now(),stage:'IDLE_WINDOW_END'});
    }
    expect(forbidden).toBe(0);
    expect(idleReads,'idle Live screens must not poll financial snapshots, ledger or expenses').toEqual([]);
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

test('offline member review uses the newly saved local value instead of an older cached summary',async({page,context,browser})=>{
 test.setTimeout(120000);const {ids,second,secondContext}=await setup(page,browser);
 try{
  await enter(page,ids,1000);await expect.poll(()=>amount(cell(second,ids)),{timeout:5000}).toBe(1000);
  await page.getByRole('button',{name:'Vérifier le membre et terminer',exact:true}).click();
  let review=page.locator('.eco-work-dialog');await expect(review).toBeVisible();
  await expect.poll(async()=>Number((await review.locator('tbody tr').first().locator('td').nth(2).innerText()).replace(/[^0-9-]/g,''))).toBe(1000);
  await review.getByRole('button',{name:'Valider la synthèse et continuer',exact:true}).click();await expect(review).toHaveCount(0);
  await context.setOffline(true);await enter(page,ids,2000);await expect.poll(()=>amount(cell(page,ids))).toBe(2000);
  await page.getByRole('button',{name:'Vérifier le membre et terminer',exact:true}).click();review=page.locator('.eco-work-dialog');await expect(review).toBeVisible();
  await expect.poll(async()=>Number((await review.locator('tbody tr').first().locator('td').nth(2).innerText()).replace(/[^0-9-]/g,''))).toBe(2000);
  await expect(review).toContainText('cet appareil');
 }finally{await secondContext.close();}
});

