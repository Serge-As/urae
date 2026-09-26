import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';

test('qualified supplier owner is wired through API and connected application',()=>{
  const api=fs.readFileSync('workers/api/src/index.ts','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const repo=fs.readFileSync('packages/repositories/src/index.ts','utf8');
  for(const token of ['stockProjection','procurementLifecycle','recordSupplierInvoice','reconcileSupplierInvoice','issueSupplierCreditNote']) assert.match(api,new RegExp(token));
  for(const token of ['marketStockProjection','marketProcurementLifecycle','recordMarketSupplierInvoice','reconcileMarketSupplierInvoice','issueMarketSupplierCreditNote']) assert.match(app,new RegExp(token));
  assert.match(repo,/commitMarketStockReservation/);
  for(const id of ['MARKETPLACE.SUPPLIERS','MARKETPLACE.SUPPLIER_CREDIT','MARKETPLACE.PROCUREMENT']) assert.equal(PRODUCT_MODULES.find(x=>x.id===id)?.status,'FOUNDATION_ACTIVE');
});
