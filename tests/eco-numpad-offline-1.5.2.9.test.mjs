import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildNumpadRubricCodes,parseEcoNumpad} from '../.build/packages/eco-numpad/src/index.js';

test('Eco NumPad maps member number and rubric codes without AI or network',()=>{
  const codes=buildNumpadRubricCodes([
    {id:'secours',name:'Secours'},
    {id:'epargne',name:'Épargne'},
    {id:'remb',name:'Remboursement'},
    {id:'coll',name:'Collation'}
  ]);
  assert.deepEqual(codes.map(x=>[x.code,x.rubricId]),[['C','coll'],['E','epargne'],['R','remb'],['S','secours']]);
  const draft=parseEcoNumpad('3 S 500 E 1000 R 5k',codes);
  assert.equal(draft.memberNumber,3);
  assert.deepEqual(draft.entries.map(x=>[x.rubricId,x.amount]),[['secours',500],['epargne',1000],['remb',5000]]);
});

test('Eco NumPad makes colliding rubric families explicit instead of guessing',()=>{
  const codes=buildNumpadRubricCodes([{id:'t1',name:'Tontine 1 000'},{id:'t2',name:'Tontine savons'},{id:'t3',name:'Tontine huile'}]);
  assert.deepEqual(codes.map(x=>x.code),['T','T2','T3']);
  assert.throws(()=>parseEcoNumpad('2 X 1000',codes),/NUMPAD_UNKNOWN_CODE/);
});

test('Eco NumPad UI always previews before canonical financial commit and stays in offline shell',()=>{
  const ui=fs.readFileSync('apps/web/src/sovereign-offline-ui.js','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const sw=fs.readFileSync('apps/web/sw.js','utf8');
  assert.match(ui,/Eco NumPad/);assert.match(ui,/Prévisualiser/);assert.match(ui,/numCommit\.disabled=true/);
  assert.match(app,/previewEcoNumpad/);assert.match(app,/commitEcoNumpad/);assert.match(app,/recordFinancialSheetEntry/);
  assert.match(sw,/\/packages\/eco-numpad\/src\/index\.js/);
});
