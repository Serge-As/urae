import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';

test('Group Doctor and Meeting Autopilot are real session journeys, not structural cards',()=>{
  const ui=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
  assert.match(ui,/renderManagerIntelligence/);
  assert.match(ui,/app\.meetingAutopilot/);
  assert.match(ui,/app\.savingsYieldDoctor/);
  assert.match(ui,/pendingEvidenceCount/);
  assert.match(ui,/unresolvedVariance/);
  assert.match(ui,/aucune mutation automatique|no automatic mutation/i);
  for(const id of ['GROUP.MEETING_AUTOPILOT','GROUP.DOCTOR'])assert.equal(PRODUCT_MODULES.find(x=>x.id===id)?.status,'FOUNDATION_ACTIVE');
});
