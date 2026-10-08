import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');

test('financial cell stages optimistic value before transport and reverts rejected commands',()=>{
  const block=main.slice(main.indexOf('const submitFinancialCellElement'),main.indexOf('const makeFinancialEntryCell'));
  assert.match(block,/const stageOptimisticValue=/);
  assert.match(block,/stageOptimisticValue\(\);[\s\S]*await app\.setFinancialCellTarget/);
  assert.match(block,/deferSync:true/,'the UI stages durably and the shared recovery owner handles transport');
  assert.match(block,/patchFinancialDomCell\(\{meetingId,membershipId,rubricId,amount:displayTarget,preservePending:true\}\)/);
  assert.match(block,/if\(optimisticStaged\)financialOptimisticValues\.delete\(cellKey\)/);
  assert.match(block,/amount:signedCurrent,preservePending:false/);
});
