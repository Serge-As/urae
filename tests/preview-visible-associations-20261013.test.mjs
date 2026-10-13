import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('a personal associations shortcut reaches the existing cockpit instead of a duplicate module',()=>{
  const html=readFileSync('apps/web/index.html','utf8');
  const main=readFileSync('apps/web/src/main.js','utf8');
  const personal=readFileSync('apps/web/src/personal-cockpit-ui.js','utf8');
  assert.match(html,/<button id="myAssociationsNavBtn"[^>]*data-view="dashboard"[^>]*data-anchor="personalCockpitPanel"/);
  assert.match(html,/id="personalCockpitPanel"/);
  assert.match(personal,/personal-group-picker/);
  assert.match(personal,/for\(const group of forumGroups\)/);
  assert.match(main,/data-view/);
});

test('the isolated preview environment is visibly named without changing financial status or production UI',()=>{
  const html=readFileSync('apps/web/index.html','utf8');
  const main=readFileSync('apps/web/src/main.js','utf8');
  const css=readFileSync('apps/web/styles.css','utf8');
  assert.match(html,/id="previewEnvBadge"[^>]*hidden/);
  assert.match(html,/PRÉPRODUCTION · données de test séparées/);
  assert.match(main,/location\.hostname==='eco-system-refonte-preview\.sergemimf\.workers\.dev'/);
  assert.match(main,/previewBadge\.hidden=!previewEnvironment/);
  assert.match(css,/\.preview-env-badge\[hidden\]\{display:none!important\}/);
  assert.match(html,/id="financialAlertBar"/,'Financial conflict remains visible');
});
