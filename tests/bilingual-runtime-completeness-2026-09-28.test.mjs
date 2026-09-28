import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runtimeDictionary} from '../.build/apps/web/src/runtime-i18n.js';

const normalize=s=>String(s??'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const suspicious=/\b(?:aucun|aucune|ajouter|annuler|association|caisse|choisir|clôtur|compte|cotisation|créer|dépense|dette|épargne|enregistrer|étape|groupe|hors ligne|installer|langue|membre|modifier|prêt|rechercher|réunion|rubrique|séance|sélectionner|supprimer|suivant|tontine|valider|retour|gestionnaire|actualiser|ouvrir|fermer|disponible|règle|finance|financier)\b/i;

test('all visible static French UI copy has an English runtime translation',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8'),dictionary=runtimeDictionary(),sources=new Set(Object.keys(dictionary));
  const texts=[...html.matchAll(/>([^<>]+)</g)].map(m=>normalize(m[1])).filter(Boolean);
  const attrs=[...html.matchAll(/\b(?:placeholder|aria-label|title)="([^"]+)"/g)].map(m=>normalize(m[1])).filter(Boolean);
  const visible=[...new Set([...texts,...attrs])];
  const uncovered=visible.filter(x=>suspicious.test(x)&&!sources.has(x)&&!/^\d|^[A-Z0-9_.:/ +×%·—-]+$/.test(x));
  assert.deepEqual(uncovered,[],'untranslated visible French UI: '+uncovered.join(' | '));
  assert.ok(sources.size>=750,'translation dictionary unexpectedly shrank: '+sources.size);
});

test('runtime i18n follows dynamically injected UI and preserves explicit language switching',()=>{
  const source=fs.readFileSync('apps/web/src/runtime-i18n.ts','utf8'),main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(source,/MutationObserver/);
  assert.match(source,/installRuntimeI18nObserver/);
  assert.match(main,/installRuntimeI18nObserver\(\(\)=>uiLocale\)/);
  assert.match(main,/applyRuntimeLocale\(uiLocale\)/);
  assert.match(main,/uiLocale\s*=\s*e\.target\.value\s*===\s*'en'/);
});
