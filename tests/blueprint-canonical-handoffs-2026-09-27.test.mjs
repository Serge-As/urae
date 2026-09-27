import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{PRODUCT_MODULES}from'../.build/packages/module-registry/src/index.js';
test('Blueprint hands proven capabilities to their canonical owner instead of generic workspace records',()=>{
 const src=fs.readFileSync('apps/web/src/blueprint-executable-ui.js','utf8');
 for(const id of ['GROUP.MEETING_AUTOPILOT','GROUP.DOCTOR','MARKETPLACE.PREDICTIVE_DEMAND','MARKETPLACE.DEMAND_EXCHANGE','MARKETPLACE.REVERSE_MARKET','MARKETPLACE.PROCUREMENT','MARKETPLACE.FLASH_OFFERS','MARKETPLACE.ECO_DEALS','MARKETPLACE.LIVE_MARKET','MANAGER.BUSINESS_STUDIO','MANAGER.BUSINESS_AGENT','LEARNING.MANAGER_ACADEMY','SAFETY.ANTISCAM'])assert.ok(src.includes("'"+id+"'"),id);
 assert.match(src,/Le Blueprint orchestre/);assert.match(src,/eco:value-network-preset/);
});
test('social commerce stages are registered as active canonical Marketplace capabilities',()=>{
 for(const id of ['MARKETPLACE.FLASH_OFFERS','MARKETPLACE.PREDICTIVE_DEMAND','MARKETPLACE.REVERSE_MARKET','MARKETPLACE.DEMAND_EXCHANGE','MARKETPLACE.ECO_NOW','MARKETPLACE.HARVEST_LOCAL','MARKETPLACE.FRESH_DROP','MARKETPLACE.PICKUP_NETWORK','MARKETPLACE.ECO_DEALS','MARKETPLACE.LIVE_MARKET','MANAGER.BUSINESS_AGENT'])assert.equal(PRODUCT_MODULES.find(x=>x.id===id)?.status,'FOUNDATION_ACTIVE',id);
});
