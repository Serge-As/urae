import {test,expect} from '@playwright/test';

test.use({serviceWorkers:'block'});
test.setTimeout(120000);
const base='http://127.0.0.1:4173',password='Synthetic-notifications-20261021!';
const request=(page,path,method='GET',body)=>page.evaluate(async({path,method,body})=>{
 const r=await fetch(path,{method,headers:{'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1'),'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return{status:r.status,body:await r.json()};
},{path,method,body});
async function api(page,...args){const r=await request(page,...args);expect(r.status,JSON.stringify(r.body)).toBeLessThan(300);return r.body;}
async function setup(page){
 await page.goto(base);await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
 const username='notice_'+Date.now()+'_'+Math.floor(Math.random()*10000),account=await api(page,'/api/v1/auth/register','POST',{username,password,displayName:'Synthetic notification owner'});
 const project=await api(page,'/api/v1/group-projects','POST',{name:'Synthetic notification group',kind:'association',governanceModel:'founder_managed',memberCount:1,sessions:2,nominalContribution:0,currency:'XAF'}),group=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{});
 await page.reload();await expect(page.locator('#activeGroupSelect option[value="'+group.id+'"]').first()).toHaveCount(1);if(await page.locator('#activeGroupSelect').inputValue()!==group.id)await page.locator('#activeGroupSelect').selectOption(group.id);await expect(page.locator('#activeGroupSelect')).toHaveValue(group.id);await expect(page.locator('#mainNav [data-view="inbox"]').first()).toBeVisible();await page.waitForLoadState('networkidle');
 return{username,account:account.account,groupId:group.id};
}
async function publish(page,groupId,extra={}){return api(page,'/api/v1/groups/'+groupId+'/notifications','POST',{title:'Synthèse privée de recette',message:'Somme confidentielle 19731 XAF',channels:['IN_APP','WEB_PUSH','EMAIL'],audience:'ALL_MEMBERS',priority:'HIGH',sourceEvent:{id:'synthetic-event',version:1},action:{view:'inbox',anchor:'notificationCenterPanel',label:'Ouvrir la notification'},...extra});}
const cardFor=(root,id)=>root.locator('[data-notice-id="'+id+'"]');
async function open(page,noticeId){await page.locator('#mainNav [data-view="inbox"]').first().click();const root=page.locator('#notificationCenterPanel');await expect(cardFor(root,noticeId)).toHaveCount(1);return root;}

test('module click during catalogue startup is retained and shop creation survives initialization',async({page})=>{
 await page.goto(base);await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);
 await api(page,'/api/v1/auth/register','POST',{username:'startup_'+Date.now(),password,displayName:'Synthetic startup owner'});
 let release;const held=new Promise(resolve=>{release=resolve;});let intercepted=false;
 await page.route('**/api/v1/product/capabilities',async route=>{intercepted=true;await held;await route.continue();});
 try{
  await page.reload();await expect.poll(()=>intercepted).toBe(true);
  await page.locator('#mainNav [data-module-open="MARKETPLACE.CORE"]').click();
  release();await page.waitForLoadState('networkidle');
  const root=page.locator('#personalShopsPanel');await expect(root).toHaveAttribute('open','');
  await root.locator('.personal-shop-create [name=name]').fill('Synthetic startup shop');
  await root.getByRole('button',{name:'Créer ma boutique privée',exact:true}).click();
  await expect(root.locator('.shop-settings')).toBeVisible();
  const rows=await api(page,'/api/v1/market/shops/mine');expect(rows).toHaveLength(1);expect(rows[0].groupId).toBeUndefined();expect(rows[0].data.visibility).toBe('PRIVATE');
 }finally{release();}
});

test('logical event retry, explicit reading and source action stay separate in the real inbox',async({page})=>{
 const f=await setup(page),notice=await publish(page,f.groupId);expect((await publish(page,f.groupId)).id).toBe(notice.id);const source=await api(page,'/api/v1/cases','POST',{groupId:f.groupId,summary:'Dossier synthétique en attente'}),before=await api(page,'/api/v1/cases');
 const root=await open(page,notice.id),card=cardFor(root,notice.id);await expect(root.locator('.notification-center-item')).toHaveCount((await api(page,'/api/v1/groups/'+f.groupId+'/notifications')).length);await expect(card).toContainText('Traitement métier non déduit');await expect(root.locator('[data-waiting-id="'+source.id+'"]').first()).toBeVisible();
 await card.getByRole('button',{name:'Ouvrir la notification',exact:true}).click();await expect(page.locator('#view-inbox')).toHaveClass(/active/);expect((await api(page,'/api/v1/groups/'+f.groupId+'/notifications'))[0].read).toBe(false);
 await card.getByRole('button',{name:'Marquer comme lu',exact:true}).click();await expect(card).toHaveClass(/is-read/);await expect(card).toContainText('Lu le');expect(await api(page,'/api/v1/cases')).toEqual(before);
 await root.locator('.notification-controls').getByRole('button',{name:'Non lues',exact:true}).click();await expect(card).toHaveCount(0);await root.locator('.notification-controls').getByRole('button',{name:'Toutes',exact:true}).click();await expect(card).toHaveCount(1);
 await card.getByText('Mes traces de lecture et de transport',{exact:true}).click();await expect(root).toContainText('Ces traces ne prouvent ni paiement ni approbation.');await expect(root.locator('.notification-waiting h3')).toBeVisible();await page.waitForLoadState('networkidle');const tracked=[];page.on('request',r=>{if(/\/notifications(?:\/|\?|$)|\/inbox(?:\?|$)/.test(new URL(r.url()).pathname))tracked.push(r.url());});await page.waitForTimeout(1000);expect(tracked).toEqual([]);
 await root.scrollIntoViewIfNeeded();await root.screenshot({path:'artifacts/lot24-notification-inbox-desktop.png'});
});

test('browser consent is explicit, OFF and snooze suppress reminders, attempted display never claims receipt',async({page})=>{
 await page.addInitScript(()=>{
  globalThis.syntheticReminders=[];globalThis.syntheticPermissionRequests=0;
  class SyntheticNotification{static permission='default';static async requestPermission(){globalThis.syntheticPermissionRequests++;return this.permission='granted';}constructor(title,options){globalThis.syntheticReminders.push({title,...options});}close(){}}
  globalThis.Notification=SyntheticNotification;
 });
 const f=await setup(page),notice=await publish(page,f.groupId),root=await open(page,notice.id);await expect.poll(()=>page.evaluate(()=>globalThis.syntheticPermissionRequests)).toBe(0);
 await root.getByText('Mes préférences et le silence temporaire',{exact:true}).click();await root.getByRole('button',{name:'Autoriser ce navigateur',exact:true}).click();await expect.poll(()=>page.evaluate(()=>globalThis.syntheticPermissionRequests)).toBe(1);await expect(root).toContainText('granted');
 await root.locator('input[name=WEB_PUSH]').uncheck();await root.getByRole('button',{name:'Enregistrer mes préférences',exact:true}).click();await expect.poll(async()=>(await api(page,'/api/v1/notifications/preferences')).channels.WEB_PUSH).toBe(false);
 await cardFor(root,notice.id).getByRole('button',{name:'Afficher un rappel discret ici',exact:true}).click();await expect(root).toContainText('empêche ce rappel');expect(await page.evaluate(()=>globalThis.syntheticReminders)).toEqual([]);
 await root.locator('input[name=WEB_PUSH]').check();await root.getByRole('button',{name:'Enregistrer mes préférences',exact:true}).click();await expect.poll(async()=>(await api(page,'/api/v1/notifications/preferences')).channels.WEB_PUSH).toBe(true);await root.getByRole('button',{name:'Silence pendant une heure',exact:true}).click();await expect(root).toContainText('Silence temporaire jusqu’au');await cardFor(root,notice.id).getByRole('button',{name:'Afficher un rappel discret ici',exact:true}).click();await expect(root).toContainText('empêche ce rappel');expect(await page.evaluate(()=>globalThis.syntheticReminders)).toEqual([]);
 await root.getByRole('button',{name:'Reprendre les rappels',exact:true}).click();await expect(root).not.toContainText('Silence temporaire jusqu’au');await cardFor(root,notice.id).getByRole('button',{name:'Afficher un rappel discret ici',exact:true}).click();await expect(root).toContainText('réception par le terminal non confirmée');const reminders=await page.evaluate(()=>globalThis.syntheticReminders);expect(reminders).toHaveLength(1);expect(JSON.stringify(reminders)).not.toContain('19731');expect(JSON.stringify(reminders)).not.toContain('Synthèse privée');const history=await api(page,'/api/v1/groups/'+f.groupId+'/notifications/'+notice.id+'/history');expect(history.attempts.map(x=>x.state).sort()).toEqual(['BROWSER_REQUESTED','SUPPRESSED','SUPPRESSED']);expect(history.attempts.every(x=>x.transportOutcome==='NOT_CONFIRMED')).toBe(true);expect(history.readAt).toBeUndefined();
});

test('neutral private link returns to the exact notice after login, rejects another account and works on mobile offline honestly',async({page,browser,context})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{globalThis.syntheticCopiedLink=text;}}});});
 const f=await setup(page),notice=await publish(page,f.groupId),root=await open(page,notice.id);await cardFor(root,notice.id).getByRole('button',{name:'Copier le lien privé',exact:true}).click();await expect(root).toContainText('Aucun envoi ni accès du destinataire n’est confirmé.');const link=await page.evaluate(()=>globalThis.syntheticCopiedLink);expect(link).toContain('#eco-share=');expect(link).toContain(notice.id);expect(link).not.toContain('19731');expect(link).not.toContain('Synthèse');
 const mirrorContext=await browser.newContext({serviceWorkers:'block'}),mirror=await mirrorContext.newPage();mirror.on('pageerror',e=>console.log('L24_PRIVATE_LINK_ERROR',e.message));try{
  await mirror.goto(link);await expect(mirror.locator('#authScreen')).toBeVisible();await mirror.locator('#authUsername').fill(f.username);await mirror.locator('#authPassword').fill(password);await mirror.locator('#authSubmit').click();await mirror.waitForLoadState('networkidle');await mirror.waitForFunction(()=>document.querySelector('#authSubmit')?.disabled===false);await expect(mirror.locator('#view-inbox')).toHaveClass(/active/);await expect(cardFor(mirror.locator('#notificationCenterPanel'),notice.id)).toHaveCount(1);expect((await api(mirror,'/api/v1/groups/'+f.groupId+'/notifications'))[0].read).toBe(false);
  await mirror.locator('#logoutBtn').click();await expect(mirror.locator('#authScreen')).toBeVisible();await api(mirror,'/api/v1/auth/register','POST',{username:'outsider_'+Date.now(),password,displayName:'Synthetic outsider'});await mirror.reload();const denied=await request(mirror,'/api/v1/groups/'+f.groupId+'/notifications/'+notice.id+'/action');expect(denied.status).toBeGreaterThanOrEqual(400);expect(denied.status).toBeLessThan(500);expect(JSON.stringify(denied.body)).not.toContain('19731');await expect(mirror.locator('#notificationCenterPanel .notification-center-item')).toHaveCount(0);
 }finally{await mirrorContext.close();}
 await page.setViewportSize({width:360,height:800});await page.locator('#workspaceUiMode').selectOption('assisted');await page.getByRole('combobox',{name:'Choisir la langue / Choose language',exact:true}).selectOption('en');await expect(cardFor(root,notice.id).getByRole('button',{name:'Copy private link',exact:true})).toBeVisible();await expect(root.getByRole('heading',{name:'Notification center',exact:true})).toBeVisible();let box=await root.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(361);await page.screenshot({path:'artifacts/lot24-notification-mobile-assisted.png'});
 await context.setOffline(true);await root.locator('#notificationCenterRefreshBtn').click();await expect(root).toContainText('Offline: current state not verified.');await expect(root.locator('.notification-center-item')).toHaveCount(0);await context.setOffline(false);
});
