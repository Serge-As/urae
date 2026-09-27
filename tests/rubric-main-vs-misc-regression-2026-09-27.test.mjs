import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Aide locale stays a principal CONTRIBUTION rubric and never a misc sub-rubric',()=>{
  const guided=fs.readFileSync('packages/guided-assistant/src/index.ts','utf8');
  const launch=fs.readFileSync('apps/web/src/launch-rubrics.js','utf8');
  const misc=fs.readFileSync('packages/misc-rubrics/src/index.ts','utf8');
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');

  assert.match(launch,/CONTRIBUTION:'Collation \/ Aide locale \/ Ration'/);
  assert.match(guided,/pushMeetingContribution\('Aide locale'/);
  assert.match(guided,/rubric:\{name,kind:'CONTRIBUTION'/);
  assert.match(main,/quickRubricLocalAid/);
  assert.match(main,/RUBRIC\.LOCAL_AID'[\s\S]{0,220}rubricsManagementPanel/);

  assert.doesNotMatch(misc,/LOCAL_AID|Aide locale/);
  assert.doesNotMatch(html,/miscRubricCustomKind[\s\S]{0,240}Aide locale/);
  assert.doesNotMatch(main,/RUBRIC\.LOCAL_AID'[\s\S]{0,220}miscRubricPanel/);
});

test('Main levée stays a principal LEVY rubric and never a misc sub-rubric',()=>{
  const guided=fs.readFileSync('packages/guided-assistant/src/index.ts','utf8');
  const misc=fs.readFileSync('packages/misc-rubrics/src/index.ts','utf8');
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');

  assert.match(guided,/title:'Main levée'[\s\S]{0,360}kind:'LEVY'/);
  assert.match(main,/quickRubricHandRaise/);
  assert.match(main,/RUBRIC\.HAND_RAISE'[\s\S]{0,220}rubricsManagementPanel/);
  assert.doesNotMatch(misc,/HAND_RAISE|Main levée/);
  assert.doesNotMatch(html,/miscRubricCustomKind[\s\S]{0,240}Main levée/);
});

test('Collation Aide locale and Ration may coexist as distinct principal suggestions',()=>{
  const guided=fs.readFileSync('packages/guided-assistant/src/index.ts','utf8');
  assert.match(guided,/pushMeetingContribution\('Collation'/);
  assert.match(guided,/pushMeetingContribution\('Aide locale'/);
  assert.match(guided,/pushMeetingContribution\('Ration'/);
  assert.match(guided,/Collation, Aide locale et Ration restent distinctes/);
});
