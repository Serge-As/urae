import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4173';
test.setTimeout(180000);

async function register(page){
  await page.goto(base+'/');
  await page.waitForFunction(()=>sessionStorage.getItem('eco.window.session.v1'));
  const fixture=await page.evaluate(async()=>{
    const request=async(path,body,group)=>{
      const response=await fetch('/api/v1/'+path,{method:body?'POST':'GET',headers:{'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1'),...(body?{'content-type':'application/json'}:{}),...(group?{'x-active-group-id':group}:{})},body:body?JSON.stringify(body):undefined});
      const result=await response.json();if(!response.ok)throw Error(path+':'+JSON.stringify(result));return result;
    };
    await request('auth/register',{username:'placement_'+Date.now(),password:'Synthetic-placement-20261027!',displayName:'Audit Canopée'});
    const project=await request('group-projects',{name:'Association audit des accès',kind:'association',governanceModel:'founder_managed',memberCount:2,sessions:2,nominalContribution:0,currency:'XAF'});
    const group=await request('group-projects/'+project.id+'/convert',{});
    await request('groups/'+group.id+'/members',{displayName:'Deuxième membre'},group.id);
    const meeting=await request('groups/'+group.id+'/meetings',{title:'Séance audit',scheduledAt:'2026-11-02T12:00:00Z'},group.id);
    return{groupId:group.id,meetingId:meeting.id};
  });
  await page.reload();await expect(page.locator('#authScreen')).toBeHidden();
  // A newly converted fixture may still be initializing its official rubrics.
  // Observe completion of the selected group's existing refresh before measuring
  // navigation: those setup writes are not produced by the catalogue action.
  await page.evaluate(()=>{window.__placementGroupReady=false;const node=document.getElementById('toast'),observer=new MutationObserver(()=>{if(node.textContent==='Groupe actif changé.'){window.__placementGroupReady=true;observer.disconnect();}});observer.observe(node,{childList:true,subtree:true,characterData:true});});
  await page.locator('#activeGroupSelect').selectOption(fixture.groupId);
  await page.waitForFunction(()=>window.__placementGroupReady);
  await page.locator('#mainNav [data-view=services]').click();
  await expect(page.locator('#moduleCatalog .module-card')).toHaveCount(164);
  return fixture;
}

test('all 164 catalogue entries stay discoverable and each explicit handoff points to a mounted owner',async({page})=>{
  await register(page);
  const audit=await page.evaluate(async()=>{
    const catalog=await(await fetch('/api/v1/product/capabilities')).json();
    const {canonicalCapabilityDestination}=await import('/src/capability-navigation.js');
    const cards=[...document.querySelectorAll('#moduleCatalog [data-capability-id]')];
    return{count:catalog.count,cards:cards.map(c=>({id:c.dataset.capabilityId,role:c.getAttribute('role'),tabIndex:c.tabIndex})),destinations:catalog.capabilities.map(c=>({id:c.id,destination:canonicalCapabilityDestination(c.id)})).filter(c=>c.destination).map(c=>({...c,mounted:Boolean(document.getElementById('view-'+c.destination.view))&&(!c.destination.anchor||Boolean(document.getElementById(c.destination.anchor))),openTargetMounted:!c.destination.openTarget||Boolean(document.getElementById(c.destination.openTarget))}))};
  });
  expect(audit.cards.map(c=>c.id).sort()).toEqual([...new Set(audit.cards.map(c=>c.id))].sort());
  expect(audit.cards).toHaveLength(audit.count);
  expect(audit.cards.every(c=>c.role==='button'&&c.tabIndex===0)).toBe(true);
  expect(audit.destinations.length).toBeGreaterThan(70);
  expect(audit.destinations.filter(c=>!c.mounted||!c.openTargetMounted)).toEqual([]);
});

test('catalogue financial, meeting, business, advertising and offline entries open their real contextual owners',async({page})=>{
  await register(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Existing anonymous pulse telemetry is observed separately from business
  // mutations; rubric creation and every financial write remain disallowed.
  const mutations=[];page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method())&&r.url().includes('/api/v1/')&&!r.url().includes('/auth/')&&!r.url().includes('/live/')&&new URL(r.url()).pathname!=='/api/v1/pulse/events')mutations.push({method:r.method(),path:new URL(r.url()).pathname});});
  for(const [id,view,anchor,tab,registryTab]of[
    ['MEETING.ATTENDANCE','sessions','sessionsWorkspace','attendance'],
    ['MEETING.MEMBER_MATRIX','sessions','sessionsWorkspace','sheet'],
    ['FINANCE.LEDGER','finance','financeLedgerPanel'],
    ['FINANCE.SAVINGS_YIELD','finance','savingsYieldLab'],
    ['FINANCE.REPAYMENTS','operations','twoSheetWorkspace'],
    ['ADS.CAMPAIGNS','ecosystem','adManagerPanel'],
    ['MARKETPLACE.SUPPLIERS','ecosystem','marketEnginePanel'],
    ['MARKETPLACE.ECO_NOW','ecosystem','valueNetworkOperational'],
    ['RELAY.COMMUNITY','relay','ecoRelayPanel'],
    ['SUCCESSION.NEXT_OF_KIN','settings','operationalRegistryCenter',undefined,'succession']
  ]){
    await page.locator('#mainNav [data-view=services]').click();
    const card=page.locator('#moduleCatalog [data-capability-id="'+id+'"]');
    await card.focus();await card.press('Enter');
    await expect(page.locator('#view-'+view)).toHaveClass(/active/);
    await expect(page.locator('#'+anchor)).toBeVisible();
    if(tab)await expect(page.locator('#sessionsTabs [data-session-tab="'+tab+'"]')).toHaveClass(/active/);
    if(registryTab){await expect(page.locator('[data-op-registry-tab="'+registryTab+'"]')).toHaveClass(/active/);await expect(page.locator('#operationalRegistryCenter form [name=contactAlias]')).toBeVisible();}
  }
  expect(errors).toEqual([]);
  expect(mutations).toEqual([]);
});

test('Canopée table focus preserves critical conflict cues and a usable numeric editor on phone and senior mode',async({page})=>{
  await page.goto(base+'/health');
  await page.setContent('<!doctype html><html lang="fr"><head><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/canopee.css"></head><body class="eco-canopee eco-cockpit-shell ui-mode-visual"><main style="max-width:100%;padding:12px"><div class="canonical-financial-wrap"><table class="meeting-matrix canonical-financial-matrix"><thead><tr><th>Membre</th><th>Épargne</th></tr></thead><tbody><tr><th>Amina</th><td><div class="matrix-cell-entry is-critical-conflict" data-save-state="CONFLICT"><strong class="cell-current">1000</strong><input class="cell-target-input" type="number" value="3000"><button class="cell-validate">✓</button><span class="cell-save-state">Conflit à examiner</span></div></td></tr></tbody></table></div></main></body></html>');
  await page.evaluate(()=>{const bar=document.createElement('div');bar.className='eco-work-toolbar';const title=document.createElement('strong');title.textContent='Mode à choisir · Live connecté';bar.append(title);for(const text of ['Vérifier le membre et terminer','Choisir le mode','S’entraîner sans toucher la caisse']){const b=document.createElement('button');b.textContent=text;bar.append(b);}document.querySelector('main').prepend(bar);});
  for(const mode of ['visual','senior']){
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(mode=>document.body.className='eco-canopee eco-cockpit-shell ui-mode-'+mode,mode);
    const input=page.locator('.cell-target-input');await input.fill('2500');await input.focus();
    await expect(input).toHaveValue('2500');
    // Phone conflict styling deliberately uses a persistent red outline rather
    // than an animated border. Keep that existing cue while the input is focused.
    await expect.poll(()=>page.locator('.matrix-cell-entry').evaluate(cell=>{const cs=getComputedStyle(cell),rgb=cs.outlineColor.match(/\d+/g)?.map(Number);return Boolean(rgb&&rgb[0]>=150&&rgb[1]<80&&rgb[2]<100&&parseFloat(cs.outlineWidth)>=3);})).toBe(true);
    const state=await page.locator('.matrix-cell-entry').evaluate(cell=>{const cs=getComputedStyle(cell),button=cell.querySelector('button').getBoundingClientRect();return{outline:parseFloat(cs.outlineWidth),height:button.height,width:button.width,overflow:document.documentElement.scrollWidth>innerWidth};});
    expect(state.outline).toBeGreaterThanOrEqual(3);expect(state.height).toBeGreaterThanOrEqual(44);expect(state.width).toBeGreaterThanOrEqual(44);expect(state.overflow).toBe(false);
    await expect(page.locator('.cell-save-state')).toBeVisible();
    expect(await page.locator('.eco-work-toolbar button').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().width>=140))).toBe(true);
  }
});
