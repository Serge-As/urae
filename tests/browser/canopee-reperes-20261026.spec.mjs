import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4173';
test.setTimeout(120000);

test('unchanged loan projections retain the actual cell and selected part; changed values and actors refresh the view',async({page})=>{
  await page.goto(base+'/health');await page.setContent('<!doctype html><html lang="fr"><head><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/canopee.css"></head><body class="eco-canopee"><section id="view-finance" class="view active"><section id="loanCompletionPanel"><div id="loanList"></div></section></section></body></html>');
  await page.evaluate(async()=>{
    const {mountCompletionUI}=await import('/src/completion-ui.js');window.__loanActor='manager';window.__loanVersion=1;window.__loanAmount=10000;
    const app={activeGroup:()=> 'group',currentActor:()=>window.__loanActor,currentTenant:()=> 'synthetic',completionWorkflows:async()=>({workflows:{LOAN:{}}}),listCompletion:async kind=>kind==='LOAN'?[{id:'loan',title:'Prêt synthétique',createdAt:'2026-10-01T12:00:00Z',data:{borrowerMembershipId:'member',principal:10000,outstandingPrincipal:window.__loanAmount,unpaidInterest:0,completionState:'DISBURSED',completionVersion:window.__loanVersion,paymentPriority:'CAPITAL_FIRST'}}]:[]};
    window.__loans=mountCompletionUI({app,getMembers:()=>[{id:'member',displayName:'Membre synthétique'}],getMeetings:()=>[],getRubrics:()=>[],getLocale:()=>document.documentElement.lang,fmt:n=>String(n),date:n=>n,notify:()=>{},showError:e=>{throw e;}});await window.__loans.refresh();
  });
  const part=page.getByRole('combobox',{name:'Partie du portefeuille de prêts',exact:true});await part.selectOption('2');
  await page.evaluate(()=>{window.__firstLoanCell=document.querySelector('.loan-portfolio-table tbody td');window.__firstLoanTable=document.querySelector('.loan-portfolio-table');return Promise.all([window.__loans.refresh(),window.__loans.refresh(),window.__loans.refresh()]);});
  expect(await page.evaluate(()=>window.__firstLoanCell.isConnected&&window.__firstLoanTable===document.querySelector('.loan-portfolio-table'))).toBe(true);await expect(part).toHaveValue('2');
  expect(await page.locator('.loan-portfolio-table tbody td').first().evaluate(n=>n.getBoundingClientRect().width)).toBeGreaterThanOrEqual(140);
  await page.evaluate(async()=>{window.__loanAmount=9000;window.__loanVersion++;await window.__loans.refresh();});await expect(page.locator('.loan-portfolio-table tbody td').nth(5)).toHaveText('9000');await expect(part).toHaveValue('2');expect(await page.evaluate(()=>window.__firstLoanCell.isConnected)).toBe(false);
  await page.evaluate(async()=>{window.__actorLoanCell=document.querySelector('.loan-portfolio-table tbody td');window.__loanActor='another-manager';await window.__loans.refresh();});expect(await page.evaluate(()=>window.__actorLoanCell.isConnected)).toBe(false);await expect(part).toHaveValue('2');
});

test('productive forms retain a pressed action when optional guidance panels expand',async({page})=>{
  await page.setViewportSize({width:1280,height:720});await page.goto(base+'/health');
  await page.setContent('<!doctype html><html lang="fr"><head><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/canopee.css"></head><body class="eco-canopee"><main><section class="view active"><header class="page-head"><h1>Communautés</h1></header><section class="panel"><div id="guidanceHub" style="min-height:80px"></div></section><div style="height:1000px"></div></section></main></body></html>');
  await page.evaluate(async()=>{
    const {mountProductiveCommunityUI}=await import('/src/productive-community-ui.js');window.__practiceWrites=[];
    const app={currentActor:()=> 'learner',currentTenant:()=> 'synthetic',activeGroup:()=> 'group',academyPractices:async()=>({items:[]}),createAcademyPractice:async data=>window.__practiceWrites.push(data)};
    window.__productive=mountProductiveCommunityUI({app});await window.__productive.open('practice');
  });
  const root=page.locator('#productiveCommunityCenter');await root.locator('[name=title]').fill('Réalisation synthétique');await root.locator('[name=criteria]').fill('Résultat observable');await root.locator('[name=mentorId]').fill('independent-mentor');await root.locator('[name=consent]').check();
  const save=root.getByRole('button',{name:'Préparer la pratique',exact:true});await save.scrollIntoViewIfNeeded();
  const before=await save.boundingBox();await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();
  await page.locator('#guidanceHub').evaluate(async n=>{n.style.height='1100px';await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const during=await save.boundingBox();expect(Math.abs(during.y-before.y)).toBeLessThanOrEqual(1);await page.mouse.up();
  await expect.poll(()=>page.evaluate(()=>window.__practiceWrites.length)).toBe(1);
  expect(await page.evaluate(()=>window.__practiceWrites[0])).toMatchObject({title:'Réalisation synthétique',mentorId:'independent-mentor',consent:true});
});

async function projection(page,{manager=true,kind='association'}={}){
  await page.goto(base+'/health');
  await page.setContent('<!doctype html><html lang="fr"><head><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/canopee.css"></head><body class="eco-cockpit-shell eco-canopee ui-mode-visual"><main style="max-width:1280px;padding:24px;margin:auto"><section id="groupHomePanel"><div id="groupHomeContent"></div></section></main></body></html>');
  await page.evaluate(async({manager,kind})=>{
    const {mountGroupHomeUI}=await import('/src/group-home-ui.js');
    window.__group='A';window.__actor='actor';window.__manager=manager;window.__navigations=[];window.__reads=[];window.__writes=[];
    const members=()=>[{id:'own',groupId:window.__group,userId:'actor',displayName:'Amina N.',status:'active',roles:['member']},{id:'other',groupId:window.__group,userId:'other-actor',displayName:'Benoît T.',status:'active',roles:['member']}];
    const empty=async()=>[];
    window.__app={
      activeGroup:()=>window.__group,currentActor:()=>window.__actor,currentTenant:()=> 'tenant',
      groupMe:async()=>({isManager:window.__manager,membership:members()[0]}),
      groupIdentityPassport:async()=>({publicCode:'ECO-GRP-'+window.__group}),groupIdentityProfile:async()=>({}),starterKit:async()=>null,
      updateGroupIdentityProfile:async data=>window.__writes.push(data),
      meetingBeneficiaries:empty,meetingAttendance:empty,
      globalRecap:async()=>{window.__reads.push('recap');return{layout:{columns:[{id:'savings',label:'Épargne'},{id:'solidarity',label:'Secours'}]},rows:[{membershipId:'own',displayName:'Amina N.',cells:{savings:{displayAmount:32000},solidarity:{displayAmount:2000}},positiveTotal:34000,negativeTotal:0,total:34000}],backOfficeExpenses:[],ledgerSummary:{cashBalance:999999}};},
      ledger:async()=>{window.__reads.push('ledger');return{summary:{cashBalance:45200,memberFundsLiability:34000,currency:'XAF'},receipts:[],entries:[]};},
      arrears:empty,listCompletion:async type=>type==='TONTINE_SHARE'?[{title:'Part Amina',data:{membershipId:'own',completionState:'SERVED',scheduledRound:1,scheduledSlot:1}},{title:'Part Benoît',data:{membershipId:'other',completionState:'SCHEDULED',scheduledRound:2,scheduledSlot:1}}]:[],
      exercises:async()=>[{title:'Exercice 2026',data:{completionState:'OPEN',openingCash:11200}}],
      memberOperationalSheet:async id=>{if(id!=='own')throw Error('WRONG_MEMBERSHIP');return{exerciseMatrix:[{cells:{savings:{inflow:34000,outflow:1500}}}]};},
      memberStatement:async id=>{if(id!=='own')throw Error('WRONG_MEMBERSHIP');return{totalDebt:1700,debtPrincipal:1500,debtInterest:200,otherDebt:0,loanDebts:[]};}
    };
    window.__home=mountGroupHomeUI({app:window.__app,getGroups:()=>[{id:'A',name:kind==='rotating_tontine'?'Tontine des voisins':'Association Canopée',kind},{id:'B',name:'Groupe suivant',kind:'association'}],getMembers:members,getMeetings:()=>[{id:'session',title:'Rencontre de solidarité',status:'open',scheduledAt:'2026-11-01T10:00:00Z',location:'Salle du quartier'}],navigate:(view,options)=>window.__navigations.push({view,options}),fmt:n=>String(n)});
    await window.__home.refresh();
  },{manager,kind});
}

test('group overview uses actual Ledger cash, exercise carryover and canonical Recap; actions keep their owner',async({page})=>{
  await projection(page);
  await expect(page.locator('.group-home-cash')).toContainText('45200');
  await expect(page.locator('.group-home-metrics')).toContainText('11200');
  await expect(page.locator('.group-home-recap')).toContainText('34000');
  await expect(page.locator('#groupHomeContent')).not.toContainText('999999');
  await expect(page.locator('.group-home-metrics')).toContainText('Engagement du groupe');
  await expect(page.locator('.group-home-next')).toContainText('Salle du quartier');
  await page.locator('.group-home-shortcuts').getByRole('button',{name:'Approfondir · Récap'}).click();
  await page.locator('.group-home-shortcuts').getByRole('button',{name:'Fiches des membres'}).click();
  await page.locator('.group-home-next button').click();
  expect(await page.evaluate(()=>window.__navigations)).toMatchObject([{view:'recap'},{view:'operations',options:{anchor:'twoSheetWorkspace',sheetMode:'individual'}},{view:'sessions',options:{meetingId:'session'}}]);
  expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});

test('group switch discards late success and failure; detached profile form cannot write to the new group',async({page})=>{
  for(const fail of [false,true]){
    await projection(page);
    await page.evaluate(()=>{
      window.__oldForm=document.querySelector('.group-home-identity form');
      window.__app.ledger=async()=>window.__group==='A'?new Promise((resolve,reject)=>window.__finishOld=()=>window.__failOld?reject(Error('OLD_FAILURE')):resolve({summary:{cashBalance:777777},receipts:[]})):{summary:{cashBalance:42},receipts:[]};
      window.__oldRefresh=window.__home.refresh();
    });
    await expect.poll(()=>page.evaluate(()=>typeof window.__finishOld)).toBe('function');
    await page.evaluate(async fail=>{
      window.__failOld=fail;window.__group='B';window.__home.clearForContext();
      window.__oldForm.dispatchEvent(new Event('submit',{cancelable:true}));
      await window.__home.refresh();window.__finishOld();await window.__oldRefresh;
    },fail);
    await expect(page.locator('.group-home-title')).toHaveText('Groupe suivant');
    await expect(page.locator('.group-home-cash')).toContainText('42');
    await expect(page.locator('#groupHomeContent')).not.toContainText('777777');
    await expect(page.locator('#groupHomeContent')).not.toContainText('Association Canopée');
    expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
  }
});

test('member home reads only the own sheet and statement, never the manager aggregate',async({page})=>{
  await projection(page,{manager:false});
  await expect(page.locator('.group-home-finance')).toContainText('Flux nets de ma fiche');
  await expect(page.locator('.group-home-finance')).toContainText('32500');
  await expect(page.locator('.group-home-finance')).toContainText('1700');
  await expect(page.locator('.group-home-finance')).not.toContainText('Benoît');
  await expect(page.locator('.group-home-cash')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__reads)).toEqual([]);
  await page.locator('.group-home-shortcuts').getByRole('button',{name:'Ma fiche individuelle'}).click();
  expect(await page.evaluate(()=>window.__navigations[0])).toMatchObject({view:'operations',options:{membershipId:'own',sheetMode:'individual'}});
});

test('rotating tontine puts recorded rounds before the Recap and keeps unknowns explicit',async({page})=>{
  await projection(page,{kind:'rotating_tontine'});
  await expect(page.locator('.group-home-heading')).toContainText('TONTINE ROTATIVE');
  await expect(page.locator('.group-home-rounds')).toContainText('1 / 2 parts');
  await expect(page.locator('[data-round-state="SCHEDULED"]')).toContainText('Benoît');
  expect(await page.locator('.group-home-rounds').evaluate(n=>Boolean(n.compareDocumentPosition(document.querySelector('.group-home-recap'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await page.evaluate(async()=>{window.__app.ledger=async()=>({summary:{},receipts:[]});window.__app.exercises=async()=>[];window.__app.arrears=async()=>{throw Error('UNAVAILABLE');};await window.__home.refresh();});
  await expect(page.locator('.group-home-cash strong')).toHaveText('—');
  await expect(page.locator('.group-home-finance')).toContainText('Vue partielle');
  await page.evaluate(async()=>{window.__app.globalRecap=async()=>{throw Error('UNAVAILABLE');};await window.__home.refresh();});
  await expect(page.locator('.group-home-finance')).toContainText('Aucune valeur de remplacement');
  await expect(page.locator('.group-home-cash')).toHaveCount(0);
});

test('cached finance exposes last synchronization and pending work; missing Ledger snapshot is not zero',async({page})=>{
  await projection(page);
  await page.evaluate(async()=>{
    window.__app.projectionMeta=async path=>({availability:path.endsWith('/ledger')?'UNAVAILABLE':'LOCAL_PENDING',lastSyncedAt:'2026-10-24T10:15:00Z',pendingCount:2});
    window.__app.transportState=()=>({degraded:true});
    window.__app.ledger=async()=>({summary:{cashBalance:0,memberFundsLiability:0},receipts:[]});
    await window.__home.refresh();
  });
  await expect(page.locator('.group-home-cash strong')).toHaveText('—');
  await expect(page.locator('.group-home-sync')).toContainText('Lecture depuis cet appareil');
  await expect(page.locator('.group-home-sync')).toContainText('24 oct. 2026');
  await expect(page.locator('.group-home-sync')).toContainText('confirmation : 2');
  await expect(page.locator('.group-home-recap')).toContainText('34000');
  expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});

test('overview fits phone, tablet and desktop in all modes, with accessible scrollable financial tables',async({page})=>{
  await projection(page);
  for(const mode of ['visual','senior','assisted']){
    await page.evaluate(mode=>document.body.className='eco-cockpit-shell eco-canopee ui-mode-'+mode,mode);
    for(const width of [360,768,1440]){
      await page.setViewportSize({width,height:1000});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
      const table=page.locator('.group-home-recap [role="region"]');await expect(table).toHaveAttribute('tabindex','0');
      const size=await page.locator('.group-home-shortcuts button').first().evaluate(n=>{const r=n.getBoundingClientRect();return{width:r.width,height:r.height};});expect(size.height).toBeGreaterThanOrEqual(42);expect(size.width).toBeGreaterThanOrEqual(42);
    }
  }
  await page.evaluate(()=>{document.documentElement.lang='en';return window.__home.refresh();});
  await expect(page.locator('.group-home-finance')).toContainText('Group finance and recap');
  await expect(page.locator('.group-home-shortcuts')).toContainText('Explore · Recap');
});

const api=(page,path,method='GET',body,groupId)=>page.evaluate(async({path,method,body,groupId})=>{
  const r=await fetch(path,{method,headers:{'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1'),...(body===undefined?{}:{'content-type':'application/json'}),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const value=await r.json();if(!r.ok)throw Error(path+' '+r.status+' '+JSON.stringify(value));return value;
},{path,method,body,groupId});

test('role dashboards follow hydrated context, discard old group and role responses, and preserve an explicit profile',async({page})=>{
  await page.goto(base+'/health');
  await page.setContent('<main id="view-dashboard"><section id="personalCockpitPanel"></section></main>');
  await page.evaluate(async()=>{
    const {mountRoleDashboardsUI}=await import('/src/role-dashboards-ui.js');
    window.__group='A';window.__manage=false;window.__groups=[];window.__dashErrors=[];
    window.__dashApp={currentActor:()=> 'actor',currentTenant:()=> 'tenant',activeGroup:()=>window.__group,projectionMeta:async()=>({availability:'SYNCED',computedAt:'2026-10-26T10:00:00Z'}),ledger:async()=>({summary:{cashBalance:1234}}),quietWatch:async()=>[],inboxItems:async()=>[],memberOperationalSheet:async()=>({statement:{totalNetContributions:95}})};
    window.__dash=mountRoleDashboardsUI({app:window.__dashApp,getGroups:()=>window.__groups,getMembers:()=>[{id:'own',userId:'actor',status:'active'},{id:'peer',userId:'peer',status:'active'}],getMeetings:()=>[{status:'open'}],isManager:()=>window.__manage,showError:e=>window.__dashErrors.push(e.message)});
    await window.__dash.refresh();window.__groups=[{id:'A'},{id:'B'}];window.__manage=true;await window.__dash.refresh();
  });
  const root=page.locator('#roleDashboardsCenter'),card=label=>root.locator('.dashboard-contract-card').filter({has:page.locator('span',{hasText:label})});
  await expect(root.locator('[data-dashboard-role="MANAGER"]')).toHaveClass('active');await expect(card('Membres actifs').locator('strong')).toHaveText('2');await expect(card('Caisse canonique').locator('strong')).toHaveText('1 234');
  for(const fail of [false,true]){
    await page.evaluate(()=>{window.__group='A';window.__dash.clearForContext();window.__finishOld=null;window.__dashApp.ledger=async()=>window.__group==='A'?new Promise((resolve,reject)=>window.__finishOld=fail=>fail?reject(Error('OLD_GROUP_FAILURE')):resolve({summary:{cashBalance:777777}})):{summary:{cashBalance:42}};window.__oldDash=window.__dash.refresh();});
    await expect.poll(()=>page.evaluate(()=>typeof window.__finishOld)).toBe('function');
    await page.evaluate(async fail=>{window.__group='B';window.__dash.clearForContext();await window.__dash.refresh();window.__finishOld(fail);await window.__oldDash;},fail);
    await expect(card('Caisse canonique').locator('strong')).toHaveText('42');await expect(root).not.toContainText('777');
  }
  await page.evaluate(()=>{window.__group='A';window.__dash.clearForContext();window.__finishOld=null;window.__oldDash=window.__dash.refresh();});
  await expect.poll(()=>page.evaluate(()=>typeof window.__finishOld)).toBe('function');
  await root.locator('[data-dashboard-role="MEMBER"]').click();await expect(card('Groupes accessibles').locator('strong')).toHaveText('2');
  await page.evaluate(async()=>{window.__finishOld(false);await window.__oldDash;await window.__dash.refresh();});
  await expect(root.locator('[data-dashboard-role="MEMBER"]')).toHaveClass('active');await expect(card('Groupes accessibles').locator('strong')).toHaveText('2');await expect(card('Caisse canonique')).toHaveCount(0);expect(await page.evaluate(()=>window.__dashErrors)).toEqual([]);
});

test('returning to group home and manually refreshing show the latest canonical cash in both existing dashboards',async({page})=>{
  await page.goto(base);await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
  const registered=await api(page,'/api/v1/auth/register','POST',{username:'canopee_fresh_'+Date.now(),password:'Synthetic-canopee-fresh-20261026!',displayName:'Canopée actualisée'});
  const project=await api(page,'/api/v1/group-projects','POST',{name:'Groupe de contrôle de fraîcheur',kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:1,nominalContribution:0,currency:'XAF'});
  const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),path='/api/v1/groups/'+group.id;
  const members=await api(page,path+'/members','GET',undefined,group.id),membershipId=members.find(m=>m.userId===registered.account.id).id;
  const rubric=await api(page,path+'/rubrics','POST',{name:'Contribution synthétique',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},group.id);
  await api(page,path+'/ledger/opening-balance','POST',{amount:1000,currency:'XAF',note:'Argent fictif',idempotencyKey:'fresh-opening-'+group.id},group.id);
  await page.reload();await expect(page.locator('#authScreen')).toBeHidden();await page.locator('#activeGroupSelect').selectOption(group.id);await expect(page.locator('#toast')).toHaveText('Groupe actif changé.',{timeout:35000});
  await page.locator('#groupHomeNavBtn').click();const cash=page.locator('.group-home-cash strong'),managerCash=page.locator('#roleDashboardsCenter .dashboard-contract-card').filter({hasText:'Caisse canonique'}).locator('strong');
  await expect(cash).toContainText('1 000');await expect(managerCash).toHaveText('1 000');
  const writes=[];page.on('request',r=>{if(r.method()==='POST'&&/\/financial-cells|\/outbox\/apply|\/contributions|\/expenses|\/ledger\//.test(r.url()))writes.push(r.url());});
  await page.locator('#mainNav [data-view="finance"]').first().click();
  await api(page,path+'/contributions/cash','POST',{membershipId,rubricId:rubric.id,amount:500,currency:'XAF',idempotencyKey:'fresh-contribution-1-'+group.id},group.id);
  await page.locator('#groupHomeNavBtn').click();await expect(cash).toContainText('1 500');await expect(managerCash).toHaveText('1 500');
  await api(page,path+'/contributions/cash','POST',{membershipId,rubricId:rubric.id,amount:250,currency:'XAF',idempotencyKey:'fresh-contribution-2-'+group.id},group.id);
  await page.locator('#refreshBtn').click();await expect(cash).toContainText('1 750');await expect(managerCash).toHaveText('1 750');
  expect(writes).toEqual([base+path+'/contributions/cash',base+path+'/contributions/cash']);const ledger=await api(page,path+'/ledger','GET',undefined,group.id);expect(ledger.summary.cashBalance).toBe(1750);expect(ledger.entries).toHaveLength(3);
});

test.describe('financial startup presentation',()=>{
// Control API latency in this fixture. Installed PWA recovery is exercised by
// the separate real-origin-shutdown scenario below.
test.use({serviceWorkers:'block'});
test('financial F5 restores the saved column as soon as the sheet is ready, while an optional panel is still loading',async({page})=>{
  await page.setViewportSize({width:390,height:820});await page.goto(base);
  await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
  await api(page,'/api/v1/auth/register','POST',{username:'canopee_column_'+Date.now(),password:'Synthetic-canopee-column-20261026!',displayName:'Colonne conservée'});
  const project=await api(page,'/api/v1/group-projects','POST',{name:'Feuille disponible avant les panneaux secondaires',kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:1,nominalContribution:2500,currency:'XAF'});
  const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{}),path='/api/v1/groups/'+group.id;
  await api(page,path+'/meetings','POST',{title:'Séance fictive de contrôle du défilement',scheduledAt:'2026-10-26T10:00:00Z'},group.id);
  await api(page,path+'/rubrics','POST',{name:'Contribution fictive de contrôle',facets:{direction:'INFLOW',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},group.id);
  await page.evaluate(id=>localStorage.setItem('tontine.activeGroupId',id),group.id);await page.reload();
  await expect(page.locator('#authScreen')).toBeHidden();await page.locator('#mainNav [data-view="operations"]').first().click();
  const wrap=page.locator('#meetingMatrix .canonical-financial-wrap');await expect(wrap).toBeVisible({timeout:35000});await page.waitForLoadState('networkidle');
  await page.locator('#meetingMatrix').getByRole('button',{name:'Vue intégrale',exact:true}).click();
  const before=await wrap.evaluate(node=>{node.scrollLeft=node.scrollWidth;return node.scrollLeft;});expect(before).toBeGreaterThan(0);
  const ledger=await api(page,path+'/ledger','GET',undefined,group.id),writes=[];
  page.on('request',r=>{if(!['GET','HEAD'].includes(r.method())&&/\/financial-cells|\/outbox\/apply|\/contributions|\/expenses|\/ledger\//.test(r.url()))writes.push(r.url());});
  let releaseMembers,releaseOptional,membersBlocked=false,optionalBlocked=false;
  const membersGate=new Promise(resolve=>releaseMembers=resolve),optionalGate=new Promise(resolve=>releaseOptional=resolve);
  await page.route('**'+path+'/members',async route=>{membersBlocked=true;await membersGate;await route.continue();});
  await page.route('**'+path+'/applications',async route=>{optionalBlocked=true;await optionalGate;await route.continue();});
  try{
    await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#view-operations')).toHaveClass(/active/);
    await expect.poll(()=>membersBlocked).toBe(true);await expect(wrap).toHaveCount(0);releaseMembers();
    await expect(wrap).toBeVisible({timeout:35000});await expect.poll(()=>optionalBlocked,{timeout:35000}).toBe(true);
    await expect.poll(()=>wrap.evaluate(node=>node.scrollLeft),{timeout:8000}).toBeGreaterThan(0);
    // Startup cannot have completed while this real optional request is held.
    expect(optionalBlocked).toBe(true);expect(writes).toEqual([]);
  }finally{releaseMembers();releaseOptional();await page.unrouteAll({behavior:'wait'});}
  const after=await api(page,path+'/ledger','GET',undefined,group.id);expect(after.summary).toEqual(ledger.summary);expect(after.entries).toEqual(ledger.entries);
});
});

test('real application opens group home, Recap, shops, forum, ads and media without financial writes',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
  await api(page,'/api/v1/auth/register','POST',{username:'canopee_'+Date.now(),password:'Synthetic-canopee-20261026!',displayName:'Amina Canopée'});
  const project=await api(page,'/api/v1/group-projects','POST',{name:'Association Canopée · démonstration',kind:'association',governanceModel:'founder_managed',memberCount:4,sessions:4,nominalContribution:2500,currency:'XAF'});
  const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{});
  await api(page,'/api/v1/groups/'+group.id+'/meetings','POST',{title:'Notre prochaine rencontre',scheduledAt:'2026-11-07T14:00:00Z',location:'Maison des associations'},group.id);
  await page.reload();await expect(page.locator('#authScreen')).toBeHidden();await page.locator('#activeGroupSelect').selectOption(group.id);await expect(page.locator('#toast')).toHaveText('Groupe actif changé.',{timeout:35000});
  await page.locator('#groupHomeNavBtn').click();await expect(page.locator('.group-home-title')).toHaveText('Association Canopée · démonstration');await expect(page.locator('.group-home-finance')).toBeVisible();
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'artifacts/canopee-real-home-initial.png',fullPage:true});
  await expect.poll(()=>page.locator('.group-home-title').evaluate(n=>{const r=n.getBoundingClientRect(),bar=document.querySelector('#ecoNavigationContext').getBoundingClientRect();return r.top-bar.bottom;})).toBeGreaterThanOrEqual(0);
  expect(await page.locator('.group-home-next h3').evaluate(n=>getComputedStyle(n).color)).toBe('rgb(255, 249, 232)');
  await page.waitForLoadState('networkidle');const before=await api(page,'/api/v1/groups/'+group.id+'/ledger','GET',undefined,group.id);
  const writes=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method())&&/\/financial-cells|\/outbox\/apply|\/contributions|\/expenses|\/ledger\//.test(r.url()))writes.push(r.url());});
  await page.locator('.group-home-shortcuts').getByRole('button',{name:'Approfondir · Récap'}).click();await expect(page.locator('#view-recap')).toBeVisible();
  for(const [label,selector] of [['Boutiques','#marketEnginePanel'],['Forum & entraide','#communityEnginePanel'],['AdManager','#adManagerPanel'],['Studio médias','#ecoVisualMediaStudio']]){
    await page.locator('#groupHomeNavBtn').click();await page.locator('.group-home-doors').getByRole('button',{name:new RegExp('^'+label)}).click();await expect(page.locator(selector)).toBeVisible({timeout:20000});
    const destination=page.locator(selector);
    await expect.poll(()=>destination.evaluate(n=>n.getBoundingClientRect().top)).toBeLessThan(500);
    await expect.poll(()=>destination.evaluate(n=>n.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
    if(selector==='#adManagerPanel'){
      const alignment=()=>destination.evaluate(n=>Math.abs(n.getBoundingClientRect().top-(parseFloat(getComputedStyle(n).scrollMarginTop)||0)));
      await expect.poll(alignment).toBeLessThanOrEqual(2);
      // A late preceding panel must not displace the requested workspace.
      await destination.evaluate(n=>{const late=document.createElement('div');late.id='canopee-late-panel-fixture';late.style.height='900px';n.before(late);});
      // Header/font layout can change the CSS margin while the panel loads.
      // Assert the actual destination contract, rather than an earlier pixel.
      await expect.poll(alignment).toBeLessThanOrEqual(2);
      // Wheel over the page heading; native multi-selects consume their own
      // wheel events when the preceding navigation leaves the pointer there.
      await destination.locator('h2,h3').first().hover();
      const before=await destination.evaluate(n=>n.getBoundingClientRect().top);
      await page.mouse.wheel(0,160);
      await expect.poll(()=>destination.evaluate(n=>n.getBoundingClientRect().top)).toBeLessThan(before-60);
      await destination.evaluate(async n=>{const below=document.createElement('div');below.id='canopee-after-interaction-fixture';below.style.height='400px';n.append(below);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      expect(await destination.evaluate(n=>n.getBoundingClientRect().top)).toBeLessThan(before-60);
      await page.evaluate(()=>document.getElementById('canopee-after-interaction-fixture').remove());
      await page.evaluate(()=>document.getElementById('canopee-late-panel-fixture').remove());
    }
  }
  await page.locator('#groupHomeNavBtn').click();await page.locator('#ecoGroupSpaces').getByRole('button',{name:'Forum',exact:true}).click();await expect(page.locator('#communityEnginePanel')).toBeVisible();
  await page.locator('#groupHomeNavBtn').click();
  for(const width of [1440,360]){
    await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
    if(width===360){
      expect(await page.locator('.topbar').evaluate(n=>n.getBoundingClientRect().height)).toBeLessThanOrEqual(136);
      for(const selector of ['#activeGroupSelect','#topLanguageSelect','#workspaceUiMode','#logoutBtn','#connectivity'])await expect(page.locator(selector)).toBeVisible();
      await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      expect(await page.locator('.group-home-cash').evaluate(n=>n.getBoundingClientRect().top)).toBeLessThan(900);
    }
    await page.screenshot({path:'artifacts/canopee-real-home-'+width+'.png',fullPage:true});
  }
  const after=await api(page,'/api/v1/groups/'+group.id+'/ledger','GET',undefined,group.id);expect(after.summary).toEqual(before.summary);expect(after.entries).toEqual(before.entries);expect(writes).toEqual([]);expect(errors).toEqual([]);
});

test('real group home and its saved cash reopen after the origin stops, with Canopée styling',async({page})=>{
  test.setTimeout(180000);
  // A stopped local origin also covers WebKit, whose offline emulator can reject SW responses.
  const {createServer}=await import('node:http');
  const proxy=createServer(async(req,res)=>{
    try{
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const headers={...req.headers};delete headers.host;delete headers.connection;delete headers['content-length'];
      // Forward this same-origin test proxy as its upstream origin; preserve the app's CSRF policy.
      if(headers.origin==='http://127.0.0.1:'+req.socket.localPort)headers.origin=base;
      const upstream=await fetch(base+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks),redirect:'manual'});
      res.statusCode=upstream.status;
      for(const [key,value] of upstream.headers)if(!['content-encoding','content-length','transfer-encoding','connection','set-cookie'].includes(key))res.setHeader(key,value);
      const cookies=upstream.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);
      res.end(Buffer.from(await upstream.arrayBuffer()));
    }catch{res.writeHead(503);res.end('Origin unavailable');}
  });
  await new Promise((resolve,reject)=>{proxy.once('error',reject);proxy.listen(0,'127.0.0.1',resolve);});
  let stopped=false;const stop=async()=>{if(stopped)return;stopped=true;const done=new Promise((resolve,reject)=>proxy.close(e=>e?reject(e):resolve()));proxy.closeAllConnections();await done;};
  try{
    await page.goto('http://127.0.0.1:'+proxy.address().port);
    await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
    await api(page,'/api/v1/auth/register','POST',{username:'canopee_offline_'+Date.now(),password:'Synthetic-offline-canopee-20261026!',displayName:'Canopée sans réseau'});
    const project=await api(page,'/api/v1/group-projects','POST',{name:'Association disponible hors ligne',kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:1,nominalContribution:0,currency:'XAF'});
    const group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{});
    await api(page,'/api/v1/groups/'+group.id+'/ledger/opening-balance','POST',{amount:18750,currency:'XAF',note:'Fixture hors ligne, argent fictif',idempotencyKey:'canopee-offline-opening-'+group.id},group.id);
    await page.reload();await expect(page.locator('#authScreen')).toBeHidden();await page.locator('#activeGroupSelect').selectOption(group.id);await expect(page.locator('#toast')).toHaveText('Groupe actif changé.',{timeout:35000});
    await page.locator('#groupHomeNavBtn').click();await expect(page.locator('.group-home-title')).toHaveText(group.name);
    await expect(page.locator('.group-home-cash strong')).toHaveText(/18\s*750/);
    await expect(page.locator('.group-home-sync')).toContainText('dernière synchronisation');
    await expect.poll(()=>page.evaluate(async()=>{for(const name of await caches.keys()){const c=await caches.open(name);if(await c.match('/__eco_release_ready__'))return Boolean(await c.match('/canopee.css',{ignoreSearch:true}))&&Boolean(await c.match('/src/group-home-ui.js'));}return false;}),{timeout:45000}).toBe(true);
    // An installed cache is not proof that this first document is controlled.
    // Complete the online PWA installation before testing an installed app's outage.
    if(!await page.evaluate(()=>Boolean(navigator.serviceWorker.controller)))await page.reload({waitUntil:'domcontentloaded'});
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller)),{timeout:20000}).toBe(true);
    await stop();
    const response=await page.reload({waitUntil:'domcontentloaded',timeout:30000});expect(response.status()).toBe(200);
    await expect(page.locator('#authScreen')).toBeHidden({timeout:35000});
    await page.locator('#groupHomeNavBtn').click();await expect(page.locator('.group-home-title')).toHaveText(group.name);
    await expect(page.locator('.group-home-cash strong')).toHaveText(/18\s*750/,{timeout:35000});
    await expect(page.locator('.group-home-sync')).toContainText('dernière synchronisation');
    await expect(page.locator('body')).toHaveCSS('background-color','rgb(246, 245, 240)');
    await page.locator('.group-home-shortcuts').getByRole('button',{name:'Approfondir · Récap'}).click();await expect(page.locator('#view-recap')).toBeVisible();
  }finally{await stop();}
});
