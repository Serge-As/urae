import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

test('Cloudflare Complete App config targets eco-system and never commits credentials or D1 UUID',()=>{
  const cfg=fs.readFileSync('workers/api/wrangler.toml','utf8');
  assert.match(cfg,/name = "eco-system"/); assert.doesNotMatch(cfg,/CLOUDFLARE_API_TOKEN\s*=/); assert.doesNotMatch(cfg,/database_id\s*=\s*"[0-9a-f-]{20,}"/i);
  const wf=fs.readFileSync('.github/workflows/deploy-cloudflare-complete-app.yml','utf8');
  assert.match(wf,/secrets\.CLOUDFLARE_ACCOUNT_ID/); assert.match(wf,/secrets\.CLOUDFLARE_API_TOKEN/); assert.match(wf,/eco-system-db/); assert.match(wf,/realMoneyEnabled/); assert.match(wf,/ECO_SYSTEM_ROOT/); assert.match(wf,/EXPECTED_VERSION: 1.0.0-complete-app/);
  assert.match(wf,/Refusing to silently create a replacement/);
  assert.doesNotMatch(wf,/d1 create/);
  assert.match(wf,/MIN_CAPABILITIES: 100/);
});

test('Wrangler CI renderer creates the DB binding without touching base config',()=>{
  const out='/tmp/eco-wrangler-test.toml'; const id='11111111-2222-3333-4444-555555555555';
  const run=spawnSync(process.execPath,['scripts/render-wrangler-d1.mjs',id,out],{encoding:'utf8'}); assert.equal(run.status,0,run.stderr);
  const rendered=fs.readFileSync(out,'utf8'); assert.match(rendered,/binding = "DB"/); assert.match(rendered,/database_name = "eco-system-db"/); assert.match(rendered,new RegExp(id)); assert.match(rendered,/migrations_dir = "\.\.\/\.\.\/cloudflare\/migrations"/);
  assert.doesNotMatch(fs.readFileSync('workers/api/wrangler.toml','utf8'),new RegExp(id));
});


test('Cloudflare Cahier App deploy reuses the same Worker and exclusively eco-system-db',()=>{
  const wf=fs.readFileSync('.github/workflows/deploy-cloudflare-cahier-app.yml','utf8');
  assert.match(wf,/next\/1\.1\.0-cahier-app/);
  assert.match(wf,/EXPECTED_VERSION: 1\.1\.0-cahier-app/);
  assert.match(wf,/ECO_SYSTEM_DB: eco-system-db/);
  assert.match(wf,/Refusing to silently create a replacement/);
  assert.doesNotMatch(wf,/d1 create/);
  assert.match(wf,/1\.1\.0-CAHIER-APP/);
  assert.match(wf,/Cahier Maître 2\.3\.4/);
  assert.match(wf,/MIN_CAPABILITIES: 139/);
});
