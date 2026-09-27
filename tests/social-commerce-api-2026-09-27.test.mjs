import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
test('stages 14-19 are exposed only through canonical market API and application owner',()=>{
 const api=fs.readFileSync('workers/api/src/index.ts','utf8'),app=fs.readFileSync('packages/application/src/index.ts','utf8');
 for(const token of ['market\\/flash-offers','market\\/requests','market\\/deals','market\\/live-markets'])assert.ok(api.includes(token),token);
 for(const token of ['createFlashOffer','acceptPredictedMarketRequest','respondMarketRequest','shortlistMarketResponse','selectMarketResponse','createDeal','commitDealQuantity','createLiveMarket','pinLiveMarketDeal'])assert.ok(app.includes(token),token);
 assert.doesNotMatch(app,/realMoneyEnabled\s*=\s*true/);
});
