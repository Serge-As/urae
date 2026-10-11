import {test,expect} from '@playwright/test';
const base='http://127.0.0.1:4173';
test('member partner studio really submits a proposal and shows its server result',async({page})=>{
 await page.goto(base+'/health');
 await page.setContent('<!doctype html><html lang="fr"><body><section id="view-ecosystem" class="active"><section id="adManagerPanel"></section></section></body></html>');
 await page.evaluate(async()=>{
  const {mountPartnerAdsUI}=await import('/src/partner-ad-ui.js');
  window.__created=[];
  const app={
   activeGroup:()=> 'group-a',currentActor:()=> 'member-a',
   visualMediaList:async()=>[],partnerAdProposals:async()=>window.__created,
   createPartnerAdProposal:async form=>{
    const record={id:'proposal-1',groupId:'group-a',createdBy:'member-a',title:form.title,
       data:{proposalState:'SUBMITTED',headline:form.headline,body:form.body}};
    window.__created.push(record);return record;
   }
  };
  await mountPartnerAdsUI({app,isManager:()=>false}).refresh();
 });
 await page.locator('#partnerAdPanel [name="title"]').fill('Atelier quartier');
 await page.locator('#partnerAdPanel [name="headline"]').fill('Couture locale');
 await page.locator('#partnerAdPanel [name="body"]').fill('Service à domicile');
 await page.locator('#partnerAdPanel [name="callToAction"]').fill('Réserver');
 await page.locator('#partnerAdPanel [name="destinationRef"]').fill('service:couture-1');
 await page.locator('#partnerAdPanel button[type="submit"]').click();
 await expect(page.locator('#partnerAdPanel .eco-partner-proposal')).toContainText('Atelier quartier');
 await expect.poll(()=>page.evaluate(()=>window.__created.length)).toBe(1);
 await expect(page.locator('#partnerAdPanel')).not.toContainText('Importer en brouillon');
});
test('approved ad shows only on safe Home, Forum and Market surfaces and CTA uses native navigation',async({page})=>{
 await page.goto(base+'/health');
 await page.setContent('<!doctype html><html lang="fr"><body><section id="view-dashboard"><div class="hero">Accueil</div></section><section id="communityEnginePanel"><div class="section-kicker">Forum</div></section><details id="marketEnginePanel"><summary>Marché</summary></details><section id="view-finance"><form id="contributionForm">Finance</form></section></body></html>');
 await page.evaluate(async()=>{
  const {mountAdSurfacesUI}=await import('/src/ad-surfaces-ui.js');
  window.__navigated=[];
  const app={activeGroup:()=> 'g',
   adSurface:async placement=>({kind:'SPONSORED_SANDBOX',headline:'Atelier local',body:'Cours et ateliers',
    callToAction:'Voir ce Deal',destinationRef:'deal:deal-1',mediaAssetId:null}),
   visualMediaBlob:async()=>{throw Error('NO_MEDIA');}
  };
  await mountAdSurfacesUI({app,navigate:(view,opts)=>window.__navigated.push({view,opts})}).refresh();
 });
 await expect(page.locator('[data-eco-ad-surface]')).toHaveCount(3);
 await expect(page.locator('#view-finance [data-eco-ad-surface]')).toHaveCount(0);
 await page.locator('[data-eco-ad-surface="HOME_AFTER_PRIORITIES"] button').click();
 expect(await page.evaluate(()=>window.__navigated[0])).toMatchObject({view:'ecosystem',opts:{anchor:'socialCommercePanel'}});
 await expect(page.locator('[data-eco-ad-surface="FORUM_NATIVE"]')).toContainText('Atelier local');
});
