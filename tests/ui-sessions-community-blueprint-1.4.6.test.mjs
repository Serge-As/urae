import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('1.4.6 separates Operational Center from Sessions without deleting acquired cockpit tools',async()=>{
  const html=await readFile('apps/web/index.html','utf8');
  assert.ok(html.includes('data-view="operations"')); assert.ok(html.includes('Centre opérationnel'));
  assert.ok(html.includes('data-view="sessions"')); assert.ok(html.includes('id="view-sessions"'));
  assert.ok(html.includes('Accès historique conservé')); assert.ok(html.includes('Compatibilité historique')); assert.ok(html.includes('Gérer les Séances'));
  for(const acquired of ['twoSheetWorkspace','miscRubricPanel','Règles vivantes','offlineMeetingPanel','Tontines permanentes','meetingHub'])assert.ok(html.includes(acquired),acquired);
});

test('all eight session tabs keep full desktop meaning and short phone labels',async()=>{
  const html=await readFile('apps/web/index.html','utf8');
  const checks=[
    ['overview','Vue d’ensemble','Vue'],['sheet','Feuille de séance','Feuille'],['attendance','Présences','Présences'],
    ['beneficiaries','Bénéficiaires & preuves','Bénéf.'],['recap','Récap & caisse','Récap'],['debts','Dettes & amendes','Dettes'],
    ['schedule','Classements & programmation','Classement'],['history','Historique','Historique']
  ];
  for(const [id,full,short] of checks){assert.ok(html.includes('data-session-tab="'+id+'"'),id);assert.ok(html.includes('data-mobile-label="'+short+'"'),short);assert.ok(html.includes(full),full);}
});

test('phone main navigation exposes concise readable labels instead of clipping destinations',async()=>{
  const [html,css]=await Promise.all([readFile('apps/web/index.html','utf8'),readFile('apps/web/styles.css','utf8')]);
  for(const short of ['Accueil','À faire','Découvrir','Créer','Eco IA','Centre op.','Séances','Membres','Finances','Back-office','Tontines','Communautés','Services','Réglages'])assert.ok(html.includes('data-mobile-label="'+short+'"'),short);
  assert.ok(css.includes('.nav-btn{flex:0 0 110px!important')); assert.ok(css.includes('white-space:normal!important')); assert.ok(css.includes('overflow-wrap:anywhere'));
  assert.ok(css.includes('.sessions-tabs button[data-mobile-label]::after'));
  assert.ok(css.includes('.contextual-action-presets{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto'));
});

test('Community and Value landing exposes Blueprint forums interest communities market partners and trust',async()=>{
  const [html,main]=await Promise.all([readFile('apps/web/index.html','utf8'),readFile('apps/web/src/main.js','utf8')]);
  assert.ok(html.includes('Communautés & valeur'));
  for(const target of ['blueprintExecutablePanel','communityEnginePanel','interestCommunityPanel','marketEnginePanel','externalProgramsPanel','financialLabPanel'])assert.ok(html.includes('data-eco-jump="'+target+'"'),target);
  assert.ok(main.includes('[data-eco-jump]')); assert.ok(main.includes('scrollIntoView'));
});

test('Blueprint community layer remains a set of canonical handoffs and action presets',async()=>{
  const [bp,presets]=await Promise.all([readFile('apps/web/src/blueprint-executable-ui.js','utf8'),readFile('apps/web/src/community-blueprint-presets.js','utf8')]);
  for(const id of ['COMMUNITY.FORUM','COMMUNITY.PRO_HUBS','PARTNERS.DIRECTORY','LEARNING.MANAGER_ACADEMY'])assert.ok(bp.includes(id),id);
  assert.ok(bp.includes('moteur canonique'));
  for(const label of ['Forum principal du groupe','Opportunités du groupe','Marché & besoins','Compétences · emploi · services','Agriculture · production · commerce local','Business · fournisseurs · activité','Formation · transmission · Academy','ONG · partenaires · impact','Créateurs · vitrines · contenus utiles','Actualités sourcées & tendances'])assert.ok(presets.includes(label),label);
  for(const token of ['groupbuy','harvest','business','partner','creator','sourced','buzz'])assert.ok(presets.includes(token),token);
  assert.ok(presets.includes('Une tranche horaire ne transforme jamais un contenu en information vérifiée'));
});

test('1.4.6 preserves opportunity evidence and live consensus work from 1.4.4 and 1.4.5',async()=>{
  const [pkg,app,sessions]=await Promise.all([readFile('package.json','utf8'),readFile('packages/application/src/index.ts','utf8'),readFile('apps/web/src/sessions-ui.js','utf8')]);
  assert.ok(pkg.includes('1.4.6-ui-sessions-community-blueprint-final')); assert.ok(app.includes('createOpportunity'));
  assert.match(app,/consensus/i); assert.match(sessions,/consensus/i);
});

test('1.4.6 PWA precaches Sessions Blueprint community modules and exposes current shell',async()=>{
  const [sw,html]=await Promise.all([readFile('apps/web/sw.js','utf8'),readFile('apps/web/index.html','utf8')]);
  assert.ok(sw.includes('eco-system-v146-sessions-community-blueprint-final-20260921'));
  for(const path of ['/src/sessions-ui.js','/src/blueprint-executable-ui.js','/src/community-blueprint-presets.js','/src/community-shop-ui.js'])assert.ok(sw.includes(path),path);
  assert.ok(html.includes('ECO-SYSTEM · 1.4.6')); assert.ok(html.includes('styles.css?v=146'));
});
