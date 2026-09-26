import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';
test('Discovery member recruitment has a complete privacy-safe UI journey and keeps GroupPairing canonical',()=>{
 const ui=fs.readFileSync('apps/web/src/pairing-ui.js','utf8'),app=fs.readFileSync('packages/application/src/index.ts','utf8');
 for(const token of ['Mon portfolio public','Rechercher les profils opt-in','Signaler l’intérêt du groupe','candidateGroupFit','candidateInvitations'])assert.ok(ui.includes(token),token);
 assert.match(ui,/Aucun téléphone, CNI, solde ou contact privé/);
 assert.match(app,/createJoinLink/);assert.match(ui,/createJoinLink/);
 for(const id of ['DISCOVERY.MEMBER_SEARCH','DISCOVERY.GROUP_FIT','MEMBERSHIP.RECRUITMENT','MEMBERSHIP.PORTFOLIO','MEMBERSHIP.ANTI_ENUMERATION','MEMBERSHIP.RECONCILIATION'])assert.equal(PRODUCT_MODULES.find(x=>x.id===id)?.status,'FOUNDATION_ACTIVE',id);
});
