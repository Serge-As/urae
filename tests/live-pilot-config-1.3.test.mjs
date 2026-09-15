import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Premium Live pilot deploy is isolated from production Worker and D1',()=>{
  const wf=fs.readFileSync('.github/workflows/deploy-live-pilot-1.3.yml','utf8');
  assert.match(wf,/PILOT_WORKER: eco-system-live-pilot/);
  assert.match(wf,/PILOT_DB: eco-system-live-pilot-db/);
  assert.match(wf,/EXPECTED_VERSION: 1\.3\.0-guided-ai-live/);
  assert.match(wf,/PREMIUM_LIVE_LEDGER = "true"/);
  assert.match(wf,/GroupLiveHub/);
  assert.match(wf,/storage = "sqlite"/);
  assert.match(wf,/FINANCIAL_NOTICE_NOT_STREAMED/);
  assert.match(wf,/realMoneyEnabled/);
  assert.match(wf,/COLLECTIVE_LEARNING_PEPPER/);
  assert.match(wf,/FOUNDER_TEAM_ACTORS/);
  assert.doesNotMatch(wf,/d1 migrations apply "eco-system-db"/);
  assert.doesNotMatch(wf,/wrangler@4 deploy --config workers\/api\/wrangler\.ci\.toml/);
});

test('base production config keeps Premium Live disabled until explicit qualified activation',()=>{
  const cfg=fs.readFileSync('workers/api/wrangler.toml','utf8');
  assert.match(cfg,/PREMIUM_LIVE_LEDGER = "false"/);
  assert.match(cfg,/class_name = "GroupLiveHub"/);
  assert.match(cfg,/\[exports\.GroupLiveHub\]/);
  assert.match(cfg,/storage = "sqlite"/);
});
