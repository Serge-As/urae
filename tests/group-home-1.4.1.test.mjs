import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('group home is rooted in Association/Tontine context and keeps Séances explicit',async()=>{
  const html=await readFile('apps/web/index.html','utf8');
  assert.match(html,/id="groupHomePanel"/);
  assert.match(html,/Accueil du groupe/);
  assert.match(html,/data-view="operations"[^>]*><span>☷<\/span><b>Séances<\/b>/);
  assert.match(html,/Séances & feuilles financières/);
});

test('group home projects canonical recap ledger and self sheet instead of recalculating a parallel truth',async()=>{
  const source=await readFile('apps/web/src/group-home-ui.js','utf8');
  assert.match(source,/app\.globalRecap\(\)/);
  assert.match(source,/app\.ledger\(\)/);
  assert.match(source,/app\.memberOperationalSheet\(me\.membership\.id\)/);
  assert.match(source,/cette page Accueil ne recalcule pas une seconde comptabilité/);
  assert.match(source,/Déclaration légale et durée des mandats/);
  assert.match(source,/Réunion du/);
});

test('PWA precaches the group-home projection for low-data and offline shell use',async()=>{
  const sw=await readFile('apps/web/sw.js','utf8');
  assert.match(sw,/\/src\/group-home-ui\.js/);
});
