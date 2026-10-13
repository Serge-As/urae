import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runtimeDictionary} from '../.build/apps/web/src/runtime-i18n.js';

test('all five workspace links target existing sections and native navigation',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const nav=[...html.matchAll(/<button[^>]+data-view="ecosystem"[^>]+data-anchor="([^"]+)"/g)].map(m=>m[1]);
  for(const id of ['interestCommunityPanel','marketEnginePanel','groupShopPanel','adManagerPanel','visualMediaPanel']){
    assert.ok(nav.includes(id),'missing workspace jump '+id);
    assert.ok(html.includes('id="'+id+'"'),'orphaned workspace jump '+id);
  }
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(main,/querySelectorAll\('\[data-view\]'\)/);
});

test('visual studio actions are wired to actual application commands',()=>{
  const ui=fs.readFileSync('apps/web/src/visual-media-studio.js','utf8');
  const api=fs.readFileSync('packages/application/src/index.ts','utf8');
  const backend=fs.readFileSync('workers/api/src/index.ts','utf8');
  assert.match(ui,/uploadVisualMedia\(selected,slot\)/);
  assert.match(ui,/setVisualMediaSlot\(slot,asset.id\)/);
  assert.match(api,/async visualMediaBlob\(id:string\)/);
  assert.match(api,/async uploadVisualMedia\(file:File,purpose:string\)/);
  assert.match(backend,/const visualApi=url\.pathname\.match/);
  assert.match(backend,/visualMedia\.upload/);
  assert.match(backend,/visualMedia\.assign/);
});

test('campaign images stay bound to existing AdManager and pass dedicated media validation',()=>{
  const service=fs.readFileSync('packages/ad-manager/src/index.ts','utf8');
  const ui=fs.readFileSync('apps/web/src/ad-manager-ui.js','utf8');
  const route=fs.readFileSync('workers/api/src/index.ts','utf8');
  assert.match(service,/mediaAssetId\?:string/);
  assert.match(ui,/mediaAssetId:value\('adCampaignMedia'\)/);
  assert.match(route,/AD_MEDIA_PURPOSE_MISMATCH/);
  assert.match(route,/visualMedia\.record\(adCampaigns\[1\]!,String\(creative.mediaAssetId\),true\)/);
  assert.match(service,/async transition\(/);
});

test('FR/EN additions have explicit translations',()=>{
  const dictionary=runtimeDictionary();
  for(const label of ['Studio médias','Images, profils et couvertures','Image du créatif publicitaire','Sans image','Régie publicitaire','Accès aux espaces existants']){
    assert.equal(typeof dictionary[label],'string','missing English label: '+label);
    assert.ok(dictionary[label].length>2);
  }
});
