import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runtimeDictionary, localeTag} from '../.build/apps/web/src/runtime-i18n.js';

test('browser entrypoint imports every 1.2 runtime module it invokes',()=>{
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(main,/captureRuntimeI18n/);
  assert.match(main,/from ['"]\.\/runtime-i18n\.js['"]/);
  assert.match(main,/mountCompletionUI/);
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

test('PWA cache contains new functional and bilingual transitive modules',()=>{
  const sw=fs.readFileSync('apps/web/sw.js','utf8');
  for(const path of ['/src/runtime-i18n.js','/src/completion-ui.js','/packages/completion/src/index.js'])assert.ok(sw.includes(path),path);
  assert.match(sw,/v120/);
});

test('current shell identifies 1.2 instead of stale 1.1.2 copy',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  assert.match(html,/1\.2\.0/);assert.doesNotMatch(html,/1\.1\.2/);
  assert.match(html,/tontineCompletionPanel/);assert.match(html,/loanCompletionPanel/);assert.match(html,/completionLab/);
});
