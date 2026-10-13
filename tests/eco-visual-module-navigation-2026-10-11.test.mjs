import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('apps/web/index.html','utf8');
const main=fs.readFileSync('apps/web/src/main.js','utf8');
const blueprint=fs.readFileSync('apps/web/src/blueprint-executable-ui.js','utf8');
const business=fs.readFileSync('apps/web/src/business-studio-ui.js','utf8');
const kits=fs.readFileSync('apps/web/src/starter-kit-ui.js','utf8');
const creator=fs.readFileSync('apps/web/src/creator-talent-ui.js','utf8');
const academy=fs.readFileSync('apps/web/src/core-economic-learning-ui.js','utf8');

test('Eco NOW, Deals, Business, Kits, Foras, Harvest, Academy and Creator all have real entrypoints',()=>{
  const entries=[
    ['Eco NOW','valueNetworkOperational',academy,'MARKETPLACE.ECO_NOW'],
    ['Eco Deals','socialDealTitle',html,'MARKETPLACE.ECO_DEALS'],
    ['Eco Business','businessStudioOperational',business,'MANAGER.BUSINESS_STUDIO'],
    ['Foras · Forums','communityEnginePanel',html,'COMMUNITY.FORUM'],
    ['Kits du groupe','savedStarterKitPanel',kits,'GROUP.MEETING_AUTOPILOT'],
    ['Eco Harvest','valueNetworkOperational',academy,'MARKETPLACE.HARVEST_LOCAL'],
    ['Academy','academyOperational',academy,'LEARNING.MANAGER_ACADEMY'],
    ['Creator &amp; Talent','creatorTalentCenter',creator,'CREATOR.STUDIO']
  ];
  for(const [label,anchor,owner,moduleId] of entries){
    assert.ok(html.includes('>'+label+'</button>'),label+' link missing');
    assert.ok(html.includes('data-anchor="'+anchor+'"'),anchor+' destination missing');
    assert.ok(owner.includes(anchor),anchor+' owner not mounted');
    assert.ok(blueprint.includes(moduleId)||moduleId==='GROUP.MEETING_AUTOPILOT',moduleId+' not mapped');
  }
});

test('NOW and Harvest invoke existing validated Value Network presets',()=>{
  assert.match(main,/eco:value-network-preset/);
  assert.match(academy,/eco:value-network-preset/);
  assert.match(academy,/offerBox.open=true/);
  assert.match(main,/owner.open=true/);
});

test('existing ReCap and confrontation labels and modules not hidden by new visual shortcuts',()=>{
  assert.match(html,/Recap du groupe/);
  assert.match(main,/mountRecapUI/);
  assert.match(main,/mountPairingUI/);
  assert.match(html,/adManagerPanel/);
});
