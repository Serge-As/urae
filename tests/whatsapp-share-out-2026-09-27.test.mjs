import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEcoShareIntent,parseEcoShareIntent,buildWhatsAppSharePayload} from '../apps/web/src/share-out.js';

test('WhatsApp share-out creates an exact Eco-System return link without a provider dependency',()=>{
  const input={view:'ecosystem',anchor:'socialCommercePanel',kind:'market-deal',groupId:'group A',objectId:'deal:42',title:'Huile 1L',summary:'Deal public · 1 200 F CFA'};
  const hash=buildEcoShareIntent(input),parsed=parseEcoShareIntent(hash);
  assert.deepEqual(parsed,{view:'ecosystem',anchor:'socialCommercePanel',kind:'market-deal',groupId:'group A',objectId:'deal:42',contextId:''});
  const payload=buildWhatsAppSharePayload(input,{origin:'https://eco-system.example',pathname:'/'});
  assert.match(payload.whatsappUrl,/^https:\/\/wa\.me\/\?text=/);
  assert.match(payload.deepLink,/#eco-share=/);
  assert.match(payload.text,/Réf\. ECO-MARKET-DEAL-/);
  assert.doesNotMatch(payload.text,/phone|cni|debt|loan/i);
});

test('WhatsApp handoff is wired to marketplace and community without promoting the external provider adapter',()=>{
  const advanced=fs.readFileSync('apps/web/src/advanced-ui.js','utf8');
  const community=fs.readFileSync('apps/web/src/community-shop-ui.js','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  const registry=fs.readFileSync('packages/module-registry/src/index.ts','utf8');
  assert.match(advanced,/openWhatsAppShare/);
  assert.match(advanced,/dataset\.ecoShareKind/);
  assert.match(community,/openWhatsAppShare/);
  assert.match(main,/parseEcoShareIntent/);
  assert.match(main,/eco:share-intent/);
  assert.match(registry,/SHARE\.WHATSAPP\.HANDOFF/);
  assert.match(registry,/INTEGRATION\.WHATSAPP[^\n]*STRUCTURAL_V1/);
});
