import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('3 Oct release is zero-polling and quota-safe code-only delivery',()=>{
  const sw=fs.readFileSync('apps/web/sw.js','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  const live=fs.readFileSync('apps/web/src/identity-live-ui.js','utf8');
  const marker=fs.readFileSync('.github/DEPLOY_ECO_SYSTEM_1_5_2_9_SOVEREIGN_ONCE','utf8');
  const deploy=fs.readFileSync('.github/workflows/deploy-1.5.2.9-sovereign-offline.yml','utf8');
  assert.match(deploy,/20261003-free-event-push-no-polling/);
  assert.match(deploy,/eco-system-v1529-free-event-push-20261003/);
  assert.match(sw,/PREVIOUS_CACHE = 'eco-system-v15210-offline-conflicts-loans-20261003'/);
  assert.match(main,/const FREE_CONSERVATION_MODE=true/);
  assert.doesNotMatch(live,/setInterval\(/);
  assert.match(marker,/db_mutation: none/);
  assert.match(marker,/code-only-no-d1-export-no-migration/);
  assert.match(deploy,/CODE_ONLY_DEPLOY=true/);
  assert.match(deploy,/if: env\.CODE_ONLY_DEPLOY != 'true'/);
});
