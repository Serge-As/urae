import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('deployable shell loads field hardening and voice two-sheet layer before legacy main',async()=>{
  const html=await readFile('.build/index.html','utf8');const hard=html.indexOf('/src/field-hardening.js?v=134'),voice=html.indexOf('/src/voice-entry-bootstrap.js?v=134'),main=html.indexOf('/src/main.js?v=130');
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

test('matrix interception prevents old click-to-Finance behavior from owning sheet cells',async()=>{
  const source=await readFile('.build/src/voice-entry-ui.js','utf8');assert.match(source,/stopImmediatePropagation/);assert.match(source,/canonical-two-sheet/);assert.match(source,/sheet-cell-edit-trigger/);assert.match(source,/sheet-cell-popover/);assert.match(source,/individualSheetMatrix/);
});


test('two-sheet workspace uses compact anchored entry instead of redirecting cells to Finance',async()=>{
  const source=await readFile('.build/src/voice-entry-ui.js','utf8');
  const main=await readFile('apps/web/src/main.js','utf8');
  assert.match(source,/Saisir \/ corriger/);assert.match(source,/sheetCellPopover/);assert.match(source,/renderIndividualSheetWorkspace/);
  assert.doesNotMatch(main,/go\('finance'\); \$\('#contributionAmount'\)\.focus\(\)/);
});


test('targeted tranche 7 keeps canonical matrix ownership and audited replacement workflow',async()=>{
  const source=await readFile('.build/src/voice-entry-ui.js','utf8');
  const main=await readFile('apps/web/src/main.js','utf8');
  assert.match(source,/eco:render-two-sheets/);assert.match(source,/\/contributions\/.+\/correct/);
  assert.match(source,/Cette réunion est clôturée|This meeting is closed/);
  assert.match(source,/Réunion du|Meeting on/);
  assert.match(source,/ancien — ne plus utiliser/);assert.match(source,/Timbre de prêt/);
  assert.match(main,/eco:render-two-sheets/);assert.doesNotMatch(main,/\#matrixViewBtn[^\n]+renderMeetingMatrix\(\)/);
});


test('financial dictation is confidence-aware and never treats noise robustness as proven',async()=>{
  const source=await readFile('.build/src/voice-entry-ui.js','utf8');
  assert.match(source,/maxAlternatives\s*=\s*3/);
  assert.match(source,/confidence/);
  assert.match(source,/Transcription incertaine|Uncertain transcription/);
  assert.match(source,/faible confiance|low confidence/);
  assert.match(source,/Rien n.a été remplacé|Nothing was replaced/);
  assert.match(source,/bruit n.est pas présenté comme résolu|Noise handling is not claimed as solved/);
  assert.match(source,/no-speech/);
});
