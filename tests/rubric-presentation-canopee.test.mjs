import test from 'node:test';
import assert from 'node:assert/strict';
import {rubricMark} from '../apps/web/src/smart-grid-view.js';

test('sheet bands distinguish loan disbursement, repayment, levy and mixed assistance', () => {
  const mark = (kind, direction, nature, fundingMode) => rubricMark({
    name: 'Rubrique du groupe',
    activityPlan: {kind, policyDraft: {assistance: {fundingMode}}},
    facets: {direction}
  }, nature);
  assert.deepEqual(mark('LOAN', 'OUTFLOW', 'LOAN'), {family:'loan', flow:'out'});
  assert.deepEqual(mark('REPAYMENT', 'INFLOW', 'REPAYMENT'), {family:'repayment', flow:'in'});
  assert.deepEqual(mark('LEVY', 'INFLOW', 'CONTRIBUTION'), {family:'levy', flow:'in'});
  assert.deepEqual(mark('ASSISTANCE', 'OUTFLOW', 'OUTFLOW', 'MIXED'), {family:'assistance', flow:''});
  assert.deepEqual(mark('SAVINGS', 'OUTFLOW', 'OUTFLOW'), {family:'savings', flow:'out'});
});

test('historic keys, unclassified rubrics and non-cash contributions have safe visual marks', () => {
  assert.deepEqual(rubricMark({name:'Prêt apparent', facets:{custom:{systemKey:'SAVINGS'},direction:'INFLOW'}},'CONTRIBUTION'), {family:'savings',flow:'in'});
  assert.deepEqual(rubricMark({name:'Tontine 2000',facets:{direction:'INFLOW'}},'CONTRIBUTION'), {family:'tontine',flow:'in'});
  assert.deepEqual(rubricMark({name:'Dons',facets:{medium:'IN_KIND',direction:'INFLOW'}},'CONTRIBUTION'), {family:'other',flow:''});
  assert.deepEqual(rubricMark({name:'Transport personnalisé'},'CONTRIBUTION'), {family:'other',flow:''});
});
