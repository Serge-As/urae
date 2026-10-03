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


test('cell validation has at most one event-bound idempotent retry and no loop',()=>{
  const cell=app.slice(app.indexOf('async setFinancialCellTarget'),app.indexOf('async applyFinancialCellConsensus'));
  assert.match(cell,/const send=\(\)=>this\.request/);
  assert.match(cell,/One validation action may perform one idempotent transport retry, never a loop/);
  assert.match(cell,/!this\.serverBudgetBlocked\(\)/);
  assert.match(cell,/navigator\.onLine!==false/);
  assert.doesNotMatch(cell,/setInterval|setTimeout/);
  const sends=(cell.match(/await send\(\)/g)||[]).length;
  assert.equal(sends,2,'initial send + one retry only');
});
