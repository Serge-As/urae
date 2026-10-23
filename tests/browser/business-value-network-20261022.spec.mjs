import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.use({serviceWorkers:'block',actionTimeout:15000});test.setTimeout(150000);
const base='http://127.0.0.1:4173';
async function api(page,path,method='GET',body,groupId){return page.evaluate(async({path,method,body,groupId})=>{const r=await fetch(path,{method,headers:{'content-type':'application/json','x-eco-window-id':sessionStorage.getItem('eco.window.session.v1'),...(groupId?{'x-active-group-id':groupId}:{})},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(JSON.stringify(data));return data;},{path,method,body,groupId});}
async function register(page,label){
 await page.goto(base);await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('eco.window.session.v1'))).toMatch(/^[a-f0-9]{32}$/);await page.waitForLoadState('networkidle');
 const r=await api(page,'/api/v1/auth/register','POST',{username:'economic_'+label+'_'+Date.now()+'_'+Math.floor(Math.random()*100000),password:'Synthetic-economic-20261022!',displayName:'Synthetic '+label});await page.reload();await expect(page.locator('#mainNav [data-module-open="MARKETPLACE.CORE"]')).toBeVisible();await page.waitForLoadState('networkidle');return r.account;
}
async function makeGroup(page){
 const project=await api(page,'/api/v1/group-projects','POST',{name:'Synthetic pooled economy',kind:'association',governanceModel:'founder_managed',memberCount:3,sessions:3,nominalContribution:0,currency:'XAF'});
 const g=await api(page,'/api/v1/group-projects/'+project.id+'/convert','POST',{});await page.reload();await expect(page.locator('#activeGroupSelect')).toHaveValue(g.id);await page.waitForLoadState('networkidle');return g;
}
async function open(page,kind='experiments'){
 await page.locator(kind==='experiments'?'#mainNav [data-module-open="MARKETPLACE.CORE"]':'#mainNav [data-anchor="valueNetworkOperational"][data-eco-module-preset="NOW"]').click();
 const parent=page.locator(kind==='experiments'?'#businessStudioOperational':'#valueNetworkOperational');if(!await parent.evaluate(n=>n.open))await parent.locator(':scope > summary').click();
 const root=page.locator(kind==='experiments'?'#businessExperimentsPanel':'#pooledNeedsPanel');if(!await root.evaluate(n=>n.open))await root.locator(':scope > summary').click();await expect(root).toBeVisible();return root;
}
async function fillExperiment(form,label='Synthetic garment experiment'){
 for(const [name,value]of Object.entries({title:label,customer:'PRIVATE-CUSTOMER-ONLY',problem:'A durable affordable uniform',offer:'Ten durable uniforms',quantity:'10',unit:'unité',price0:'500',price1:'700',minimumOrders:'1',minimumGrossMargin:'2000'}))await form.locator('[name='+name+']').fill(value);
}
test('private hypotheses keep unknown margins, observations and variants; the voluntary export excludes private costs',async({page})=>{
 await register(page,'experiment');const root=await open(page),form=root.locator('#businessExperimentCreate');await fillExperiment(form);
 await form.getByRole('button',{name:'Enregistrer les hypothèses',exact:true}).click();const card=root.locator('[data-experiment-id]');await expect(card).toHaveCount(1);
 await card.getByRole('button',{name:'Comparer les prix et résultats',exact:true}).click();await expect(card.locator('table')).toContainText('5');await expect(card.locator('table tr').nth(1).locator('td').last()).toHaveText('Inconnu');
 await expect(card.locator('.experiment-review')).toContainText('non confirmé');
 const obs=card.locator('form').nth(1);for(const k of ['MATERIALS','TRANSPORT','LABOUR','FEES','OTHER'])await obs.locator('[name='+k+']').fill(k==='MATERIALS'?'500':'0');await obs.locator('[name=note]').fill('Observed costs; sales not yet linked');await obs.getByRole('button',{name:'Conserver cette observation',exact:true}).click();await expect(card.locator('.experiment-review')).toContainText('non confirmé');
 page.once('dialog',d=>d.accept());const downloaded=page.waitForEvent('download');await card.getByRole('button',{name:'Préparer le prix 2',exact:true}).click();const download=await downloaded,data=JSON.parse(await readFile(await download.path(),'utf8'));expect(data.unitPrice).toBe(700);expect(data.published).toBe(false);expect(data.costs).toBeUndefined();expect(JSON.stringify(data)).not.toContain('PRIVATE-CUSTOMER-ONLY');
 await card.getByRole('button',{name:'Créer une variante, conserver l’original',exact:true}).click();await form.locator('[name=title]').fill('Synthetic variant retained source');await form.locator('[name=price0]').fill('600');await form.getByRole('button',{name:'Enregistrer les hypothèses',exact:true}).click();await expect(root.locator('[data-experiment-id]')).toHaveCount(2);
 const all=await api(page,'/api/v1/business/experiments');expect(all.total).toBe(2);const original=all.items.find(x=>x.title==='Synthetic garment experiment'),review=await api(page,'/api/v1/business/experiments/'+original.id);expect(review.forecasts[0].unitPrice).toBe(500);expect(review.paymentStatus).toBe('NOT_INFERRED');
});
test('two actual accounts contribute compatible units and withdraw without exposing each other or placing an order',async({page,browser})=>{
 await register(page,'pool_owner');const group=await makeGroup(page),root=await open(page,'pools'),create=root.locator('#valuePoolCreate');
 for(const [name,value]of Object.entries({title:'Synthetic rice pooling',category:'rice',unit:'kg',locality:'Yaoundé'}))await create.locator('[name='+name+']').fill(value);
 await create.getByRole('button',{name:'Ouvrir sans engagement commercial',exact:true}).click();const card=root.locator('[data-pool-id]');await expect(card).toHaveCount(1);const poolId=await card.getAttribute('data-pool-id');
 let contribution=card.locator('form');await contribution.locator('[name=quantity]').fill('1');await contribution.locator('[name=consent]').check();await contribution.getByRole('button',{name:'Confirmer mon besoin',exact:true}).click();await expect(card).toContainText('1 kg');
 const context=await browser.newContext({serviceWorkers:'block'}),receiver=await context.newPage();
 try{
  const account=await register(receiver,'pool_member');await api(page,'/api/v1/groups/'+group.id+'/members','POST',{userId:account.id,displayName:'Synthetic consenting member'},group.id);await receiver.reload();
  await expect(receiver.locator('#activeGroupSelect option[value="'+group.id+'"]')).toHaveCount(1);if(await receiver.locator('#activeGroupSelect').inputValue()!==group.id)await receiver.locator('#activeGroupSelect').selectOption(group.id);await receiver.waitForLoadState('networkidle');
  const other=await open(receiver,'pools'),theirCard=other.locator('[data-pool-id="'+poolId+'"]');await expect(theirCard).toHaveCount(1);contribution=theirCard.locator('form');
  await contribution.locator('[name=quantity]').fill('500');await contribution.locator('[name=unit]').fill('g');await contribution.locator('[name=consent]').check();await contribution.getByRole('button',{name:'Confirmer mon besoin',exact:true}).click();await expect(theirCard).toContainText('1.5 kg');
  await root.getByRole('button',{name:'Actualiser les participations',exact:true}).click();await expect(card).toContainText('1.5 kg');await expect(card).not.toContainText('Synthetic consenting member');
  await theirCard.getByRole('button',{name:'Retirer ma participation',exact:true}).click();await expect(theirCard).toContainText('1 kg');await root.getByRole('button',{name:'Actualiser les participations',exact:true}).click();await expect(card).toContainText('1 kg');
  const view=await api(page,'/api/v1/groups/'+group.id+'/value/pools/'+poolId,'GET',undefined,group.id);expect(view.participants).toBe(1);expect(view.createsOrder).toBe(false);expect(JSON.stringify(view)).not.toContain(account.id);
 }finally{await context.close();}
 const ledger=await api(page,'/api/v1/groups/'+group.id+'/ledger','GET',undefined,group.id);expect(ledger.entries).toHaveLength(0);expect(ledger.receipts).toHaveLength(0);
});
test('English mobile controls retain unconfirmed offline fields, clear private context on logout and add no idle polling',async({page,context})=>{
 await page.setViewportSize({width:360,height:800});await register(page,'mobile');await page.locator('#topLanguageSelect').selectOption('en');await page.waitForLoadState('networkidle');const root=await open(page),form=root.locator('#businessExperimentCreate');await expect(root.locator(':scope > summary')).toContainText('Experiments');
 await expect(root).toContainText('No experiment. Demonstration data is not inserted into your account.');await page.waitForLoadState('networkidle');let requests=0;page.on('request',r=>{if(/\/api\/v1\/(business\/experiments|groups\/[^/]+\/value\/pools)/.test(r.url()))requests++;});await page.waitForTimeout(1200);expect(requests).toBe(0);
 await fillExperiment(form,'PRIVATE-OFFLINE-FIELDS');await context.setOffline(true);await form.getByRole('button',{name:'Save hypotheses',exact:true}).click();await expect(form).toContainText('Your fields are retained');await expect(form.locator('[name=title]')).toHaveValue('PRIVATE-OFFLINE-FIELDS');await context.setOffline(false);
 const bounds=await root.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(-1);expect(bounds.x+bounds.width).toBeLessThanOrEqual(361);
 await page.locator('#logoutBtn').click();await expect(page.locator('#authScreen')).toBeVisible();expect(await page.locator('#businessExperimentCreate [name=title]').inputValue()).toBe('');expect(await page.evaluate(async()=>{const r=await fetch('/api/v1/business/experiments',{headers:{'x-eco-window-id':sessionStorage.getItem('eco.window.session.v1')}});return r.status;})).toBe(401);
});
