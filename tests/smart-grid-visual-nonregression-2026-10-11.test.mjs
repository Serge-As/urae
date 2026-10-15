import test from 'node:test';
import assert from 'node:assert/strict';
import {splitFinancialRubrics, sumFinancialRubrics, planFinancialRubricLayout} from '../apps/web/src/smart-grid-view.js';

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
  for(const invalid of [0,-1,NaN,1.5])assert.deepEqual(splitFinancialRubrics(rubrics,invalid),[rubrics]);
  const parts=splitFinancialRubrics(rubrics,2);
  parts[0].pop();
  assert.deepEqual(rubrics,['cotisation','epargne','tontine']);
});

test('measured partitions fit every column and cover all 20, 40 or 100 rubrics exactly once',()=>{
  for(const count of [1,20,40,100])for(const mode of ['visual','senior','assisted'])for(const width of [320,664,1024,1440]){
    const plan=planFinancialRubricLayout({count,width,mode});
    const rubrics=Array.from({length:count},(_,i)=>'rubric-'+i);
    for(const parts of plan.choices.filter(x=>x!==1)){
      const groups=splitFinancialRubrics(rubrics,parts);
      assert.deepEqual(groups.flat(),rubrics);
      assert.equal(groups.length,parts);
      for(const group of groups)assert.ok(plan.reserved+group.length*plan.columnWidth<=plan.available);
    }
    if(plan.recommended!==null)assert.ok(plan.fits(plan.recommended));
  }
  assert.equal(planFinancialRubricLayout({count:20,width:900}).choices.includes(2),false);
  assert.equal(planFinancialRubricLayout({count:12,width:900}).recommended,3);
});

