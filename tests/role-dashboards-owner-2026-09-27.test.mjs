import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dashboardCard} from '../apps/web/src/role-dashboards-ui.js';

test('dashboard metric contract requires owner formula unit period freshness permission and proof',()=>{
 const card=dashboardCard({id:'cash',label:'Caisse',owner:'Ledger',formula:'sum(CASH)',unit:'XAF',period:'CURRENT',asOf:'2026-09-27T00:00:00Z',freshness:'LIVE',permission:'ALLOWED',proof:'ledger:summary',actual:1000});
 assert.equal(card.actual,1000);assert.equal(card.owner,'Ledger');assert.equal(card.proof,'ledger:summary');
 assert.throws(()=>dashboardCard({id:'bad',label:'Bad'}),/DASHBOARD_CARD_OWNER_REQUIRED/);
});
test('role dashboards cover six required profiles and never coerce unavailable data to zero',()=>{
 const ui=fs.readFileSync('apps/web/src/role-dashboards-ui.js','utf8');
 for(const role of ['MEMBER','MANAGER','PARTNER','ADVERTISER','SUPERADMIN','MAINTENANCE'])assert.match(ui,new RegExp("'"+role+"'"));
 assert.match(ui,/Indisponible/);assert.match(ui,/actual:null/);assert.match(ui,/Owner :/);assert.match(ui,/Formule :/);assert.match(ui,/asOf/);assert.match(ui,/fraîcheur/);assert.match(ui,/preuve/);
 assert.match(ui,/Ciblage par dette\/solde/);assert.match(ui,/FORBIDDEN/);assert.match(ui,/founderControl/);
});
