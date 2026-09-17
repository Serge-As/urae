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
  const source=await readFile('.build/src/voice-entry-ui.js','utf8');assert.match(source,/stopImmediatePropagation/);assert.match(source,/canonical-two-sheet/);assert.match(source,/sheet-cell-editor/);
});
