import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
test('Smart Procurement has an end-to-end user journey for supplier to invoice reconciliation',()=>{
 const html=fs.readFileSync('apps/web/index.html','utf8'),ui=fs.readFileSync('apps/web/src/advanced-ui.js','utf8');
 for(const id of ['smartProcurementPanel','marketSupplierForm','marketProcurementForm','marketProcurementList'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const token of ['registerMarketSupplier','createMarketProcurement','receiveMarketProcurement','recordMarketSupplierInvoice','reconcileMarketSupplierInvoice','issueMarketSupplierCreditNote','paySupplierCredit'])assert.ok(ui.includes(token),token);
 assert.match(html,/coût rendu = marchandises \+ fret \+ autres coûts documentés/);
 assert.match(ui,/Ledger entry ID proving payment|ID de l’écriture Ledger/);
});
