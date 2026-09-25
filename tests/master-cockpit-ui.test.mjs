import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Master Cockpit exposes the 10-step creation cockpit required by the Cahier',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const steps=[...html.matchAll(/class="wizard-step(?: active)?" data-step="(\d+)"/g)].map(x=>Number(x[1]));
  assert.deepEqual(steps,[1,2,3,4,5,6,7,8,9,10]);
  for(const label of ['Origine du groupe','Famille principale','Gouvernance et pouvoirs','Exercice, cycle et réunions','Membres, cohortes et parts','Tontine / rubriques / bénéficiaires','Finance et faisabilité','Communication & publication','Accessibilité et appareils','Prévisualisation avant activation']) assert.ok(html.includes(label),label);
});

test('Master Cockpit exposes validated domains as dedicated views',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  for(const view of ['dashboard','launch','operations','finance','discovery','community','marketplace','ads','academy','reports','services','inbox','settings']) assert.ok(html.includes('id="view-'+view+'"'),view);
  for(const capability of ['FINANCE.LOANS','COMMUNITY.FORUM','MARKETPLACE.CORE','ADS.CAMPAIGNS','LEARNING.MANAGER_ACADEMY','AI.ASSISTANT','PAPER.BRIDGE','REPORTING.EXPORTS','GEO.DIRECTORY','BACKUP.BIR_PLUS']) assert.ok(html.includes(capability),capability);
});

test('Master Cockpit service worker forces fresh navigation and purges old app caches',()=>{
  const sw=fs.readFileSync('apps/web/sw.js','utf8');
  assert.match(sw,/master-cockpit-20260913-r2/);
  assert.match(sw,/event\.request\.mode === 'navigate'/);
  assert.match(sw,/new Request\(request, \{ cache: 'reload' \}\)/);
  assert.match(sw,/if \(name !== CACHE\) await caches\.delete\(name\)/);
  assert.match(sw,/self\.skipWaiting\(\)/);
  assert.match(sw,/self\.clients\.claim\(\)/);
});

test('Master Cockpit install manifest and public release sentinel point to the forced-update release',()=>{
  const manifest=JSON.parse(fs.readFileSync('apps/web/manifest.webmanifest','utf8'));
  const release=JSON.parse(fs.readFileSync('apps/web/release.json','utf8'));
  assert.match(manifest.start_url,/master-cockpit-20260913-r2/);
  assert.equal(release.release,'master-cockpit-20260913-r2');
  assert.equal(release.expectedUi,'Master Cockpit');
  assert.equal(release.realMoneyEnabled,false);
  assert.ok(release.capabilityCatalogMinimum>=139);
});

test('Master Cockpit keeps the safety invariant visible',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  assert.match(html,/realMoneyEnabled=false/);
  assert.match(html,/Argent réel/);
  assert.match(html,/désactivé/);
});
