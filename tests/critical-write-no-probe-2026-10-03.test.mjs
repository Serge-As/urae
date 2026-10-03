import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('critical write path has no preliminary connectivity GET',()=>{
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const guard=app.slice(app.indexOf('private async canAttemptCriticalWrite'),app.indexOf('private async cached'));
  assert.match(guard,/serverBudgetBlocked/);
  assert.match(guard,/navigator\.onLine===false/);
  assert.match(guard,/return true/);
  assert.doesNotMatch(guard,/fetch\(/);
  assert.doesNotMatch(guard,/auth\/session/);
  const cell=app.slice(app.indexOf('async setFinancialCellTarget'),app.indexOf('async applyFinancialCellConsensus'));
  assert.match(cell,/canAttemptCriticalWrite/);
  assert.match(cell,/this\.request\(/);
});
