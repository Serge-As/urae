import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {runtimeDictionary, localeTag} from '../.build/apps/web/src/runtime-i18n.js';

test('browser entrypoint imports every 1.3 runtime module it invokes',()=>{
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(main,/captureRuntimeI18n/);
  assert.match(main,/from ['"]\.\/runtime-i18n\.js['"]/);
  assert.match(main,/mountCompletionUI/);
  assert.match(main,/mountAdvancedUI/);
  assert.match(main,/advancedUI\.refresh\(\)/);
  assert.match(main,/from ['"]\.\/completion-ui\.js['"]/);
  assert.match(main,/new ConnectedApplication\(\{ locale: uiLocale \}\)/);
  assert.match(main,/new Intl\.NumberFormat\(localeTag\(uiLocale\)/);
  assert.match(main,/new Intl\.DateTimeFormat\(localeTag\(uiLocale\)/);
  assert.doesNotMatch(main,/new ConnectedApplication\(\{\s*locale:\s*['"]fr['"]/);
});

test('runtime bilingual dictionary covers critical current shell journeys',()=>{
  const d=runtimeDictionary();
  for(const [fr,en] of [
    ['Connexion','Sign in'],['Découvrir','Discover'],['Créer une association ou une tontine','Create an association or tontine'],
    ['Tontine opérationnelle','Operational tontine'],['Prêts, obligations et décisions','Loans, obligations and decisions'],
    ['Laboratoire fonctionnel 1.2','1.2 functional lab'],['Réglages · Sécurité · Compatibilité','Settings · Security · Compatibility']
  ]) assert.equal(d[fr],en,fr);
  assert.equal(localeTag('fr'),'fr-CM');assert.equal(localeTag('en'),'en-CM');
});

test('PWA cache contains current 1.3.4 field and bilingual transitive modules',()=>{
  const sw=fs.readFileSync('apps/web/sw.js','utf8');
  for(const path of ['/src/field-hardening.js','/src/voice-entry-bootstrap.js','/src/voice-entry-ui.js','/src/expense-recap-ui.js','/src/member-dossier-ui.js','/src/documents-ui.js','/src/contextual-group-ui.js','/src/runtime-i18n.js','/src/completion-ui.js','/src/advanced-ui.js','/src/offline-snapshot.js','/packages/completion/src/index.js'])assert.ok(sw.includes(path),path);
  assert.match(sw,/v134/);
});

test('current shell identifies 1.3 instead of stale 1.1.2 copy',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  assert.match(html,/Eco-System 1\.3\.2/);assert.doesNotMatch(html,/1\.1\.2/);
  assert.match(html,/tontineCompletionPanel/);assert.match(html,/loanCompletionPanel/);assert.match(html,/completionLab/);
});


test('advanced browser UI parses and exposes governed specialized journeys',()=>{
  const run=spawnSync(process.execPath,['--check','apps/web/src/advanced-ui.js'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
  const html=fs.readFileSync('apps/web/index.html','utf8');
  for(const id of ['advancedFinancePanel','marketEnginePanel','historicalImportPanel','expectedContributionForm','savingsPlanForm','stockForm'])assert.match(html,new RegExp(id));
});


test('launch wizard exposes independent tontines and rubric context instead of one global nominal contribution',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8'),rubrics=fs.readFileSync('apps/web/src/launch-rubrics.js','utf8'),main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(html,/addLaunchTontine/);assert.match(html,/plusieurs tontines/);assert.doesNotMatch(html,/Cotisation nominale XAF/);
  assert.match(rubrics,/Qui participe à cette rubrique/);assert.match(rubrics,/Argent \+ nature/);assert.match(rubrics,/Nature \/ article/);
  assert.match(main,/const parameters=\{rubrics:readRubricEditors\(launchEditors\),launchProfile:launchStudio\.readProfile\(\)\}/);
  assert.match(main,/ensureCurrentServiceWorker/);assert.match(main,/updateViaCache:'none'/);
});


test('beta shell keeps intelligence and Live standard without premium consent switches',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  assert.match(html,/ecoPulsePanel/);assert.match(html,/EcoPulse · BETA_OPEN/);assert.match(html,/Live Ledger · bêta/);
  for(const stale of ['consentCollectiveLearning','consentCommercial','consentPartners','consentCommunity','personalCommercialConsent','liveConnectBtn','livePingBtn'])assert.doesNotMatch(html,new RegExp(stale),stale);
  assert.doesNotMatch(html,/Premium Live/);
});

test('current PWA caches pairing detail cockpit recap and Meetup-style community journeys',()=>{
  const sw=fs.readFileSync('apps/web/sw.js','utf8');
  for(const path of ['/src/pairing-ui.js','/src/detail-ui.js','/src/personal-cockpit-ui.js','/src/recap-ui.js','/src/interest-community-ui.js'])assert.ok(sw.includes(path),path);
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(main,/detailUI\.openFromLocation/);assert.match(main,/recordEcoPulse/);
  const detail=fs.readFileSync('apps/web/src/detail-ui.js','utf8');
  assert.match(detail,/href='#detail='/);assert.match(detail,/openFromLocation/);
});

test('Recap is a real manager back-office across onboarding Autres Live AI and market',()=>{
  const recap=fs.readFileSync('apps/web/src/recap-ui.js','utf8');
  for(const token of ['listJoinLinks','miscRubrics','dataUseConsent','ecoPulseProfile','Live Ledger','EcoPulse apprend','cycle de vie','Rapprochements historiques'])assert.match(recap,new RegExp(token));
});
