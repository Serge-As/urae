import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync('apps/web/index.html','utf8');
const css=fs.readFileSync('apps/web/styles.css','utf8');
const main=fs.readFileSync('apps/web/src/main.js','utf8');
const modes=fs.readFileSync('apps/web/src/experience-mode.js','utf8');
const auth=fs.readFileSync('packages/auth/src/index.ts','utf8');
const application=fs.readFileSync('packages/application/src/index.ts','utf8');
const sw=fs.readFileSync('apps/web/sw.js','utf8');
const worker=fs.readFileSync('workers/api/src/index.ts','utf8');

test('home exposes three persistent experience modes without removing capabilities',()=>{
  for(const mode of ['visual','senior','assisted'])assert.match(index,new RegExp('data-experience-mode="'+mode+'"'));
  assert.match(index,/Visuel/);assert.match(index,/Senior/);assert.match(index,/Assisté · dictée/);
  assert.match(modes,/eco\.experienceMode/);assert.match(modes,/localStorage\.setItem/);
  assert.match(css,/body\[data-experience-mode="visual"\]/);
  assert.match(css,/body\[data-experience-mode="senior"\]/);
  assert.match(css,/body\[data-experience-mode="assisted"\]/);
  assert.doesNotMatch(modes,/\.remove\(\)|display\s*=\s*['"]none['"]/);
});

test('senior and assisted modes enlarge controls and keep dictation explicit',()=>{
  assert.match(css,/--tap:56px/);assert.match(css,/--tap:58px/);
  assert.match(css,/focused-field-dictation/);
  assert.match(index,/experienceReadPageBtn/);assert.match(index,/experienceDictateBtn/);
  assert.match(modes,/speechSynthesis/);assert.match(modes,/focusedFieldDictation/);
});

test('startup restores session before revealing the login form',()=>{
  assert.match(index,/id="sessionRestoreScreen"/);
  assert.match(index,/id="authScreen"[^>]*hidden/);
  assert.match(main,/sessionRestoreScreen/);
  assert.match(main,/const session=await app\.authStatus\(\)/);
  assert.match(main,/restore\.hidden=true/);
});

test('private-device session choice is explicit and server bounded',()=>{
  assert.match(index,/id="authRemember"/);
  assert.match(application,/remember\?:boolean/);
  assert.match(auth,/SHORT_SESSION_SECONDS=8\*60\*60/);
  assert.match(auth,/REMEMBER_SESSION_SECONDS=30\*24\*60\*60/);
  assert.match(auth,/IDLE_SECONDS=7\*24\*60\*60/);
  assert.match(auth,/remember=body\.remember===true/);
});

test('one canonical financial owner keeps replacement and independent review semantics',()=>{
  assert.match(main,/renderCanonicalFinancialTable/);
  assert.match(main,/Saisir \/ corriger/);
  assert.match(application,/setFinancialCellTarget/);
  assert.match(worker,/replaceCashContributionCell/);
  assert.match(worker,/selfBenefit:Boolean/);
  assert.match(worker,/requiresIndependentReview:Boolean/);
  assert.match(main,/ancienne valeur, contrepassation et nouvelle valeur/);
});

test('1.5.2 PWA cache is release-isolated and includes experience controller',()=>{
  assert.match(sw,/eco-system-v152-unified-ui-modes-auth-pwa-20260923/);
  assert.match(sw,/\/src\/experience-mode\.js/);
  assert.match(worker,/RELEASE_PWA_CACHE='eco-system-v152-unified-ui-modes-auth-pwa-20260923'/);
  assert.match(index,/\/src\/main\.js\?v=152/);
  assert.match(index,/\/styles\.css\?v=152/);
});
