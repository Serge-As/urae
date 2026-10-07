import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('offline return auto-replays unchanged baselines and confronts only real divergence', async()=>{
  const [web,app,offline,css,sw,contract]=await Promise.all([
    readFile('apps/web/src/main.js','utf8'),
    readFile('packages/application/src/index.ts','utf8'),
    readFile('packages/offline/src/index.ts','utf8'),
    readFile('apps/web/styles.css','utf8'),
    readFile('apps/web/sw.js','utf8'),
    readFile('docs/release/CURRENT_RELEASE_CONTRACT.json','utf8')
  ]);
  assert.match(web,/showOfflineFinancialConfrontation/);
  assert.match(web,/reviewOfflineFinancialBacklog/);
  assert.match(web,/Déjà présent/);
  assert.match(web,/Cet appareil/);
  assert.match(web,/Appliquer toutes mes modifications/);
  assert.match(web,/Conserver toutes les données déjà présentes/);
  assert.match(web,/if\(!\(await reviewOfflineFinancialBacklog\(forceConfrontation\)\)\)/);
  // Reconnect is automatic when the server has not changed since the local
  // baseline. Only concurrent divergence opens the confrontation dialog.
  assert.match(web,/preview\.rows\.every\(row=>!row\.serverChangedSinceBaseline\)\)return true/);
  assert.match(web,/maxAttempts=FREE_CONSERVATION_MODE\?3:8/);
  assert.match(web,/FREE_CONSERVATION_MODE\?\[200,650,1500\]/);
  assert.doesNotMatch(web,/if\(FREE_CONSERVATION_MODE\)return;\s*const key=.*financialRetryTimers/s);
  assert.match(app,/previewOfflineFinancialConfrontation/);
  assert.match(app,/serverChangedSinceBaseline/);
  assert.match(app,/cancelOutboxItem/);
  assert.match(offline,/cancel\(id:Id\):OutboxItem\|undefined/);
  assert.match(offline,/status:'CANCELLED'/);
  assert.match(css,/offline-confrontation-table/);
  assert.match(css,/offline-confrontation-session/);
  const release=JSON.parse(contract);
  assert.equal(release.release.pwaCache,'eco-system-v15212-event-sync-ui-20261007');
  assert.match(sw,/eco-system-v15212-event-sync-ui-20261007/);
});

test('identical amount confirmations are not silently discarded', async()=>{
  const web=await readFile('apps/web/src/main.js','utf8');
  assert.match(web,/row\.sameAmount\?'APPLY_LOCAL'/);
  assert.match(web,/Même montant · confirmer/);
  assert.doesNotMatch(web,/row\.sameAmount\?'KEEP_SERVER'/);
});
