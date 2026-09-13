import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { messages } from '../.build/apps/web/src/i18n.js';

test('FR and EN dictionaries have exact key parity and substantial coverage', () => {
  const fr=Object.keys(messages.fr).sort(); const en=Object.keys(messages.en).sort();
  assert.deepEqual(en,fr); assert.ok(fr.length>=100,`expected >=100 translation keys, got ${fr.length}`);
});

test('all data-i and data-i-placeholder keys in HTML exist in both locales', async () => {
  const html=await readFile('apps/web/index.html','utf8');
  const keys=[...html.matchAll(/data-i(?:-placeholder)?="([^"]+)"/g)].map(m=>m[1]);
  for(const key of keys){assert.ok(key in messages.fr,`missing fr key ${key}`);assert.ok(key in messages.en,`missing en key ${key}`);}
});


test('English catalogue contains no accidental French UI copy', () => {
  const allowed=new Set(['Français']);
  const suspicious=/\b(?:aucun|aucune|groupe|membre|réunion|cotisation|caisse|enregistrer|créer|sélectionner|données|gestionnaire|fondateur|prévu|prévus|disponible|indisponible|erreur|hors ligne|boîte|règles)\b/i;
  for(const [key,value] of Object.entries(messages.en)){
    if(allowed.has(value))continue;
    assert.doesNotMatch(value,suspicious,`English key ${key} appears to contain French copy: ${value}`);
  }
});

test('service worker precaches the transitive foundation modules and is registered at root scope', async () => {
  const sw=await readFile('apps/web/sw.js','utf8'); const main=await readFile('apps/web/src/main.js','utf8');
  for(const critical of ['/packages/application/src/index.js','/packages/platform-kernel/src/index.js','/packages/offline/src/index.js','/packages/repositories/src/index.js']) assert.match(sw,new RegExp(critical.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(main,/register\('\/sw\.js',\s*\{\s*scope:\s*'\/'\s*\}\)/);
});
