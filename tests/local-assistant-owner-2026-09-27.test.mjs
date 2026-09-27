import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {interpretLocalAssistant} from '../apps/web/src/local-assistant.js';

const modules=[
 {id:'MEETING.COMMAND_CENTER',labelFr:'Command Center séance',labelEn:'Meeting Command Center',status:'FOUNDATION_ACTIVE',lot:'D'},
 {id:'RUBRIC.SAVINGS',labelFr:'Épargne',labelEn:'Savings',status:'FOUNDATION_ACTIVE',lot:'E'}
];
test('local assistant is deterministic offline and never writes the ledger',()=>{
 const nav=interpretLocalAssistant('Ouvre les séances',modules);assert.equal(nav.intent,'NAVIGATE');assert.equal(nav.view,'sessions');assert.equal(nav.canWriteLedger,false);assert.equal(nav.offlineCapable,true);
 const finance=interpretLocalAssistant('Chez membre Alice, Épargne 1000',modules);assert.equal(finance.intent,'FINANCIAL_DRAFT');assert.equal(finance.requiresHumanConfirmation,true);assert.equal(finance.canWriteLedger,false);
 const launch=interpretLocalAssistant('Créer une tontine hybride pour 20 membres',modules);assert.equal(launch.intent,'LAUNCH_DRAFT');assert.equal(launch.canWriteLedger,false);
 const search=interpretLocalAssistant('épargne',modules);assert.equal(search.intent,'SEARCH');assert.equal(search.results[0].id,'RUBRIC.SAVINGS');
});
test('local assistant UI hands finance to canonical preview and group creation to Launch Studio',()=>{
 const ui=fs.readFileSync('apps/web/src/local-assistant.js','utf8');
 assert.match(ui,/voiceFinancialText/);assert.match(ui,/voiceFinancialInterpret/);assert.match(ui,/Rien ne sera comptabilisé avant votre validation/);
 assert.match(ui,/launchAssistantText/);assert.match(ui,/aucune création de groupe ni règle n’est validée automatiquement/);
 assert.match(ui,/réseau requis : non/);assert.match(ui,/écriture Ledger directe : non/);
});
