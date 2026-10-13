import test from 'node:test';
import assert from 'node:assert/strict';
import {splitFinancialRubrics, sumFinancialRubrics} from '../apps/web/src/smart-grid-view.js';

test('all rubrics remain represented exactly once across 1, 2 or 5 panels', () => {
  for (const size of [0,1,2,3,5,9,10,40,100]) {
    const rubricIds = Array.from({length:size}, (_,i) => 'r'+i);
    for(const parts of [1,2,5]) {
      const panels=splitFinancialRubrics(rubricIds,parts);
      assert.deepEqual(panels.flat(),rubricIds);
      assert.ok(panels.every(x => x.length > 0 || !size));
      assert.equal(new Set(panels.flat()).size,size);
      assert.ok(panels.length <= parts);
    }
  }
});

test('global total is independent of visible partitions', () => {
  const rubrics=Array.from({length:27},(_,i)=>({id:String(i)}));
  const expected=sumFinancialRubrics(rubrics,r=>Number(r.id)*125);
  for(const parts of [1,2,5]){
    const sum=splitFinancialRubrics(rubrics,parts).reduce((s,group)=>s+sumFinancialRubrics(group,r=>Number(r.id)*125),0);
    assert.equal(sum,expected);
  }
});

test('invalid parts fall back to full and input arrays stay immutable', () => {
  const rubrics=['cotisation','epargne','tontine'];
  assert.deepEqual(splitFinancialRubrics(rubrics,7),[rubrics]);
  const parts=splitFinancialRubrics(rubrics,2);
  parts[0].pop();
  assert.deepEqual(rubrics,['cotisation','epargne','tontine']);
});
