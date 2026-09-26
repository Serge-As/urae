import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('supplier UI exposes invoice reconciliation and credit-note lifecycle on the existing Marketplace owner',()=>{
  const ui=fs.readFileSync('apps/web/src/community-shop-ui.js','utf8');
  for(const token of ['marketProcurementLifecycle','Ajouter facture fournisseur','Rapprocher facture / coût rendu','Enregistrer un avoir','recordMarketSupplierInvoice','reconcileMarketSupplierInvoice','issueMarketSupplierCreditNote']) assert.ok(ui.includes(token),token);
  assert.doesNotMatch(ui,/second inventaire fournisseur|parallel supplier ledger/i);
});
