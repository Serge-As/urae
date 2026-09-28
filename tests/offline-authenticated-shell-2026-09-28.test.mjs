import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('authenticated offline startup never falls back to first-account registration because a secondary read is missing',()=>{
  const source=fs.readFileSync('apps/web/src/main.js','utf8');
  const start=source.slice(source.indexOf('async function start()'),source.indexOf('\nasync function showStatement',source.indexOf('async function start()')));
  assert.match(start,/let authenticatedSession=false/);
  assert.match(start,/authenticatedSession=true/);
  assert.match(start,/if\(authenticatedSession\)/);
  assert.match(start,/document\.body\.classList\.remove\('signed-out','auth-restoring'\)/);
  assert.match(start,/refreshOptionalOfflineSafe\('workspaces',loadWorkspaces\)/);
  assert.match(start,/Offline product catalog snapshot unavailable/);
  const authenticatedBranch=start.slice(start.indexOf('if(authenticatedSession)'),start.indexOf("showAuth(tx('Mode hors ligne disponible"));
  assert.doesNotMatch(authenticatedBranch,/showAuth\(/);
});

test('core financial refresh remains strict while secondary group/session panels are optional offline',()=>{
  const source=fs.readFileSync('apps/web/src/main.js','utf8');
  const refresh=source.slice(source.indexOf('const refreshGroupContext'),source.indexOf('const refreshAll',source.indexOf('const refreshGroupContext')));
  assert.match(refresh,/await renderMembers\(\)/);
  assert.match(refresh,/await renderMeetings\(\)/);
  assert.match(refresh,/await renderLivingRules\(\)/);
  assert.match(refresh,/if\(manage\)await renderLedger\(\)/);
  assert.match(refresh,/refreshOptionalOfflineSafe\('group-home'/);
  assert.match(refresh,/refreshOptionalOfflineSafe\('sessions-home'/);
});
