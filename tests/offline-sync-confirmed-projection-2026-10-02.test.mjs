import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync('apps/web/src/main.js','utf8');

test('offline target confirmed by outbox remains writer truth until canonical projection catches up',()=>{
  assert.match(main,/pendingTargetSnapshot/);
  assert.match(main,/rememberTargetsConfirmedBySync/);
  const resume=main.slice(main.indexOf('const resumeOnline='),main.indexOf("window.addEventListener('online'"));
  assert.match(resume,/const beforeSync=pendingTargetSnapshot\(\)/);
  assert.match(resume,/await app\.syncOutbox\(\)/);
  assert.match(resume,/rememberTargetsConfirmedBySync\(beforeSync\)/);
  assert.ok(resume.indexOf('rememberTargetsConfirmedBySync(beforeSync)')<resume.indexOf('await start()'));
});

test('automatic retry promotes a synchronized queued target before re-reading projections',()=>{
  const recovery=main.slice(main.indexOf('const scheduleFinancialOutboxRecovery'),main.indexOf('let financialSnapshotTimer'));
  assert.match(recovery,/const beforeSync=pendingTargetSnapshot\(\)/);
  assert.match(recovery,/rememberTargetsConfirmedBySync\(beforeSync\)/);
  assert.ok(recovery.indexOf('rememberTargetsConfirmedBySync(beforeSync)')<recovery.indexOf('await loadFinancialProjectionState()'));
});
