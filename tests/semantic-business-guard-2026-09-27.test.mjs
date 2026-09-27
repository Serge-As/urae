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

test('semantic audit keeps genuinely partial capabilities structural and recognizes completed canonical journeys',()=>{
  for(const id of ['GEO.DIRECTORY']){
    const module=PRODUCT_MODULES.find(x=>x.id===id);
    assert.ok(module,id+' exists');
    assert.equal(module.status,'STRUCTURAL_V1',id+' remains structural until consented device geolocation is implemented');
  }
  for(const id of ['AI.FOUNDER','DASHBOARDS.ALL','MANAGER.PUBLIC_PROFILE','SAFETY.QUIET_WATCH','AI.LOCAL','LEARNING.TALENT','CREATOR.STUDIO']){
    const module=PRODUCT_MODULES.find(x=>x.id===id);
    assert.ok(module,id+' exists');
    assert.equal(module.status,'FOUNDATION_ACTIVE',id+' has a canonical owner, governed journey and dedicated evidence tests');
  }
});

test('custody remains custody and is not relabeled as multi-rubric wallet',()=>{
  const ui=fs.readFileSync('apps/web/src/advanced-ui.js','utf8');
  assert.match(ui,/Dépôt \/ custody interne Eco-System/);
  assert.match(ui,/Ce n’est pas le Wallet multi-rubriques/);
  assert.doesNotMatch(ui,/Portefeuille interne Eco-System/);
});

test('new group launch keeps two canonical families and refines rotating tontine with variants',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const family=html.match(/<select id="groupKind">([\s\S]*?)<\/select>/)?.[1]??'';
  assert.match(family,/value="association"/);
  assert.match(family,/value="rotating_tontine"/);
  assert.doesNotMatch(family,/value="hybrid"/);
  const variants=html.match(/<select id="tontineVariant">([\s\S]*?)<\/select>/)?.[1]??'';
  assert.match(variants,/value="MONEY"/);
  assert.match(variants,/value="IN_KIND"/);
  assert.match(variants,/value="HYBRID"/);
  const hybrid=PRODUCT_MODULES.find(x=>x.id==='CORE.HYBRID_GROUP');
  assert.equal(hybrid?.status,'FOUNDATION_ACTIVE');
});
