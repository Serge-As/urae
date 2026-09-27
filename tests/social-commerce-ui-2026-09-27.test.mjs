import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
test('social commerce journeys are visible and use canonical owners',()=>{
 const html=fs.readFileSync('apps/web/index.html','utf8'),ui=fs.readFileSync('apps/web/src/advanced-ui.js','utf8'),value=fs.readFileSync('apps/web/src/core-economic-learning-ui.js','utf8');
 for(const id of ['socialCommercePanel','socialFlashForm','socialRequestForm','socialDealForm','socialLiveForm'])assert.match(html,new RegExp('id="'+id+'"'));
 for(const token of ['createFlashOffer','createMarketRequest','respondMarketRequest','shortlistMarketResponse','selectMarketResponse','createDeal','commitDealQuantity','createLiveMarket'])assert.ok(ui.includes(token),token);
 assert.match(html,/Aucun faux compteur/);assert.match(ui,/engagé réel/);
 assert.match(value,/eco:value-network-preset/);for(const kind of ['NOW','HARVEST','FRESH_DROP','PICKUP'])assert.ok(html.includes('data-value-network-preset="'+kind+'"'),kind);
 assert.doesNotMatch(ui,/Math\.random\(\).*viewer|fake.*viewer/i);
});
