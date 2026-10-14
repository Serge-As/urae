import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main=readFileSync(new URL('../apps/web/src/main.js',import.meta.url),'utf8');
const voice=readFileSync(new URL('../apps/web/src/voice-entry-ui.ts',import.meta.url),'utf8');
const styles=readFileSync(new URL('../apps/web/styles.css',import.meta.url),'utf8');

test('microphone belongs to canonical editable financial cell without replacing validation',()=>{
  const start=main.indexOf('const makeFinancialEntryCell=');
  const end=main.indexOf('const ensureMatrixMeeting=',start);
  const cell=main.slice(start,end);
  assert.ok(start>=0&&end>start);
  assert.match(cell,/className='cell-target-input'/);
  assert.match(cell,/className='cell-validate'/);
  assert.match(cell,/className='cell-dictate'/);
  assert.match(cell,/eco:financial-cell-dictate/);
  assert.match(cell,/holder\.append\(input,microphone,validate,liveLine,stateLine\)/);
});

test('voice preview does not submit financial operation automatically',()=>{
  const start=voice.indexOf('function installFinancialCellDictation()');
  const end=voice.indexOf('// Individual financial sheets are also owned by main.js.',start);
  const cell=voice.slice(start,end);
  assert.ok(start>=0&&end>start);
  assert.match(cell,/financialSpeech\(/);
  assert.match(cell,/parseVoiceAmount\(spoken\)/);
  assert.match(cell,/speak\(/);
  assert.match(cell,/apply\.disabled=true/);
  assert.match(cell,/input\.dispatchEvent\(new Event\('input'/);
  assert.doesNotMatch(cell,/postIncome\(|postExpense\(|submitFinancialCellElement\(|\.click\(\)/);
  assert.match(voice,/installFinancialCellDictation\(\);/);
});

test('microphone has accessible dimensions and inline review controls',()=>{
  assert.match(styles,/\.matrix-cell-entry \.cell-dictate\{[^}]*min-width:44px;min-height:44px/);
  assert.match(styles,/\.matrix-cell-entry \.eco-cell-voice-review/);
});
