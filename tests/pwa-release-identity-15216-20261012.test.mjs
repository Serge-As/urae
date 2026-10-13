import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('apps/web/index.html','utf8');
const sw=fs.readFileSync('apps/web/sw.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const preview=fs.readFileSync('scripts/preview-cache-identity.mjs','utf8');
const previewWorkflowPath='.github/workflows/eco-refonte-isolated-preview.yml';
const workflow=fs.readFileSync(fs.existsSync(previewWorkflowPath)?previewWorkflowPath:'.github/workflows/deploy-1.5.2.10-offline-conflicts-loans.yml','utf8');
const hasPreviewWorkflow=fs.existsSync(previewWorkflowPath);
const contract=JSON.parse(fs.readFileSync('docs/release/CURRENT_RELEASE_CONTRACT.json','utf8'));

test('production source release contract is not changed by preview-only cache isolation',()=>{
  assert.ok(sw.includes("const CACHE = '"+contract.release.pwaCache+"'"));
  assert.ok(sw.includes("const PREVIOUS_CACHE = '"+contract.release.previousPwaCache+"'"));
  assert.match(build,/const RELEASE_VERSION='1\.5\.2\.16-live-modes-refonte'/);
  assert.match(html,/main\.js\?v=15216/);
  assert.match(preview,/GITHUB_REF_NAME/);
  assert.match(preview,/preview\/eco-refonte-20261012/);
  assert.match(preview,/eco-system-preview-/);
  if(hasPreviewWorkflow){
    assert.match(workflow,/node scripts\/preview-cache-identity\.mjs/);
    assert.match(workflow,/Locked dependencies and full app qualification/);
  }else{
    // Production candidate: retain the real release's existing safety gates.
    assert.match(workflow,/ECO_SYSTEM_DB: eco-system-db/);
    assert.match(workflow,/R2_BUCKET: eco-system-backups/);
    assert.match(workflow,/Verify code-only marker/);
    assert.match(workflow,/EXPECTED_VERSION: 1\.5\.2\.16-live-modes-refonte/);
    assert.doesNotMatch(workflow,/PREVIEW_DB:|PREVIEW_BUCKET:/);
  }
});

test('preview stamp protects previous release and does not remove offline financial data',()=>{
  assert.match(preview,/const PREVIOUS_CACHE =/);
  assert.match(preview,/name !== PREVIOUS_CACHE/);
  assert.doesNotMatch(preview,/indexedDB\.deleteDatabase\(/);
  assert.doesNotMatch(preview,/localStorage\.clear\(/);
  assert.match(sw,/cache\.put\(RELEASE_READY/);
  assert.match(sw,/event\.request\.mode === 'navigate'/);
});
