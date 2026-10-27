import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('Canopée styles ship identically in the app, public deployment and offline shell',async()=>{
  const [source,built,published,index,sw]=await Promise.all(['apps/web/canopee.css','.build/canopee.css','.build/public/canopee.css','.build/index.html','.build/sw.js'].map(p=>readFile(p,'utf8')));
  assert.equal(built,source);assert.equal(published,source);
  const href=index.match(/href="(\/canopee\.css\?v=\d+)"/)?.[1];assert.ok(href);assert.ok(sw.includes(href));
  const manifest=JSON.parse(await readFile('.build/eco-shell-manifest.json','utf8'));
  const asset=Object.entries(manifest.assets).find(([p])=>p.split('?')[0]==='/canopee.css');assert.ok(asset,'CSS must be fingerprinted in coherent release manifest');
  assert.equal(asset[1].sha256,createHash('sha256').update(source).digest('hex'));
});
