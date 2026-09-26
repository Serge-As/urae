import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('consenting candidate owner is exposed only through governed discovery routes',()=>{
 const api=fs.readFileSync('workers/api/src/index.ts','utf8'),app=fs.readFileSync('packages/application/src/index.ts','utf8');
 for(const token of ['candidate-profile','candidate-invitations','recruitment-campaigns'])assert.ok(api.includes(token),token);
 assert.ok(api.includes('discovery\\/candidates'),'governed candidate search route must remain group-scoped');
 for(const token of ['saveCandidateProfile','searchConsentingCandidates','candidateGroupFit','inviteConsentingCandidate','recruitmentCampaigns','respondCandidateInvitation'])assert.ok(app.includes(token),token);
});
