import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('deployable shell loads field hardening and voice two-sheet layer before legacy main',async()=>{
  const html=await readFile('.build/index.html','utf8');const hard=html.indexOf('/src/field-hardening.js'),voice=html.indexOf('/src/voice-entry-bootstrap.js'),main=html.indexOf('/src/main.js');
  assert.ok(hard>=0);assert.ok(voice>hard);assert.ok(main>voice);
});

test('voice two-sheet UI keeps preview confirmation and routes income expense and repayment to canonical APIs',async()=>{
  const source=await readFile('.build/src/voice-entry-ui.js','utf8');
  assert.match(source,/Comprendre et prévisualiser|Understand and preview/);
  assert.match(source,/Valider ces saisies|Confirm these entries/);
  assert.match(source,/\/contributions\/cash/);
  assert.match(source,/\/expenses/);
  assert.match(source,/\/loans\//);
  assert.match(source,/misc-rubrics\/postings/);
  assert.match(source,/scope:\s*['"]SHEET['"]/);
  assert.match(source,/scope:\s*['"]BACKOFFICE['"]/);
});

test('two-sheet UI explicitly supports French English and honest local-language text mode',async()=>{
  const source=await readFile('.build/src/voice-entry-ui.js','utf8');
  assert.match(source,/fr-FR/);assert.match(source,/en-US/);assert.match(source,/text-local/);
  assert.match(source,/Boulou/);assert.match(source,/Ewondo/);assert.match(source,/Bassa/);assert.match(source,/Fulfulde\/Peul/);assert.match(source,/Badjué/);
  assert.match(source,/ne maîtrise pas|unsupported language/);
});

test('voice layer never owns financial matrices; main keeps the single canonical renderer',async()=>{
  const voice=await readFile('.build/src/voice-entry-ui.js','utf8');
  const main=await readFile('.build/src/main.js','utf8');
  assert.doesNotMatch(voice,/renderCanonicalMeetingMatrix|hardenLegacyMatrix|watchDetailSheets/);
  assert.match(main,/renderCanonicalFinancialTable/);
  assert.match(main,/canonical-financial-matrix/);
  assert.match(main,/individualSheetMatrix/);
});


test('two-sheet workspace uses one inline target-value editor instead of redirecting cells to Finance',async()=>{
  const main=await readFile('.build/src/main.js','utf8');
  assert.match(main,/Saisir \/ corriger/);
  assert.match(main,/cell-target-input/);
  assert.match(main,/setFinancialCellTarget/);
  assert.match(main,/TOTAL COLONNES/);
  assert.doesNotMatch(main,/go\('finance'\); \$\('#contributionAmount'\)\.focus\(\)/);
});


test('targeted tranche 7 keeps canonical ownership, target replacement and independent review',async()=>{
  const voice=await readFile('.build/src/voice-entry-ui.js','utf8');
  const main=await readFile('.build/src/main.js','utf8');
  const app=await readFile('.build/packages/application/src/index.js','utf8');
  const worker=await readFile('.build/workers/api/src/index.js','utf8');
  assert.match(main,/Saisir \/ corriger/);
  assert.match(main,/setFinancialCellTarget/);
  assert.match(app,/financial-cells/);
  assert.match(worker,/selfBenefit/);
  assert.match(worker,/requiresIndependentReview/);
  assert.match(main,/Réunion du|Meeting on/);
  assert.match(main,/isLegacyStampDuplicate/);
  assert.doesNotMatch(voice,/renderCanonicalFinancialTable|renderCanonicalMeetingMatrix/);
  assert.match(main,/eco:render-canonical-financial-table/);
});


test('financial dictation is confidence-aware and never treats noise robustness as proven',async()=>{
  const source=await readFile('.build/src/voice-entry-ui.js','utf8');
  assert.match(source,/maxAlternatives\s*=\s*3/);
  assert.match(source,/interimResults\\s*=\\s*false/);
  assert.doesNotMatch(source,/interimResults\\s*=\\s*true/);
  assert.match(source,/MediaRecorder/);
  assert.match(source,/confidence/);
  assert.match(source,/Transcription incertaine|Uncertain transcription/);
  assert.match(source,/faible confiance|low confidence/);
  assert.match(source,/Rien n.a été remplacé|Nothing was replaced/);
  assert.match(source,/bruit n.est pas présenté comme résolu|Noise handling is not claimed as solved/);
  assert.match(source,/no-speech/);
});


test('sheet correction copy distinguishes self-benefit from ordinary independent review',async()=>{
  const source=await readFile('.build/src/main.js','utf8');
  assert.match(source,/result\?\.selfBenefit/);
  assert.match(source,/votre propre situation|your own situation/);
  assert.match(source,/autre responsable habilité doit la vérifier avant validation institutionnelle|authorized manager must review it before institutional confirmation/);
  assert.match(source,/ancienne valeur, contrepassation et nouvelle valeur|previous value, reversal and new value/);
});
