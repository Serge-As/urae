import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {starterRubricFacetsForName} from '../.build/packages/rubrics/src/index.js';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';

test('rubric family semantics keep Aide locale with Collation and Main levée out of Autres',()=>{
  const collation=starterRubricFacetsForName('Collation');
  const ration=starterRubricFacetsForName('Ration');
  const localAid=starterRubricFacetsForName('Aide locale');
  const handRaise=starterRubricFacetsForName('Main levée');
  assert.deepEqual(ration,collation);
  assert.deepEqual(localAid,collation);
  assert.equal(handRaise?.direction,'MIXED');
  assert.equal(handRaise?.obligation,'EVENT_DRIVEN');
  assert.equal(handRaise?.medium,'HYBRID');
  assert.equal(handRaise?.eligibilityMode,'EVENT_BASED');

  const misc=fs.readFileSync('packages/misc-rubrics/src/index.ts','utf8');
  assert.match(misc,/MiscRubricKind='REGISTRATION'\|'LOAN_STAMP'\|'FINE'\|'CUSTOM'/);
  assert.doesNotMatch(misc,/LOCAL_AID|HAND_RAISE/);

  const html=fs.readFileSync('apps/web/index.html','utf8');
  assert.match(html,/id="quickRubricLocalAid"/);
  assert.match(html,/id="quickRubricHandRaise"/);
  assert.match(html,/Autres[^\n]*Inscription[^\n]*Timbre[^\n]*Amendes/);
});

test('semantic audit does not advertise partial or misowned capabilities as active',()=>{
  const structural=[
    'CORE.HYBRID_GROUP','FINANCE.ENVELOPES',
    'OPPORTUNITY.GRAPH','GEO.DIRECTORY',
    
    'AI.FOUNDER','DASHBOARDS.ALL','MANAGER.PUBLIC_PROFILE','SAFETY.QUIET_WATCH','AI.LOCAL','LEARNING.TALENT','CREATOR.STUDIO','TRUST.GRAPH','PAPER.PRINT'
  ];
  for(const id of structural){
    const module=PRODUCT_MODULES.find(x=>x.id===id);
    assert.ok(module,id+' exists');
    assert.equal(module.status,'STRUCTURAL_V1',id+' stays structural until its canonical journey is complete');
  }
});

test('custody remains custody and is not relabeled as multi-rubric wallet',()=>{
  const ui=fs.readFileSync('apps/web/src/advanced-ui.js','utf8');
  assert.match(ui,/Dépôt \/ custody interne Eco-System/);
  assert.match(ui,/Ce n’est pas le Wallet multi-rubriques/);
  assert.doesNotMatch(ui,/Portefeuille interne Eco-System/);
});

test('new group launch exposes canonical Association and rotating tontine families only',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const family=html.match(/<select id="groupKind">([\s\S]*?)<\/select>/)?.[1]??'';
  assert.match(family,/value="association"/);
  assert.match(family,/value="rotating_tontine"/);
  assert.doesNotMatch(family,/value="hybrid"/);
});
