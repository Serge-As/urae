import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adviseEcoRequest,assessEcoInvestmentClaim} from '../apps/web/src/eco-intelligence-core.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Eco IA routes association creation without a financial write',()=>{
 const x=adviseEcoRequest('Créer une association avec plusieurs tontines');
 assert.equal(x.intent,'GROUP');assert.equal(x.destination.view,'launch');
 assert.equal(x.canWriteLedger,false);assert.equal(x.canCreateGroup,false);assert.equal(x.usesExternalModel,false);
});
test('Eco IA advises on financial voice and retains canonical validation',()=>{
 const x=adviseEcoRequest('dicter une cotisation dans la cellule');
 assert.equal(x.intent,'FINANCE');assert.equal(x.destination.view,'operations');
 assert.equal(x.requiresHumanConfirmation,true);
});
test('Eco IA warns about Ponzi-like offers without claiming a legal verdict',()=>{
 const x=adviseEcoRequest('Placement garanti 30% par mois si je recrute mes amis');
 assert.equal(x.intent,'SAFETY');assert.equal(x.riskAssessment.status,'WARNING_SIGNS');
 assert.equal(x.riskAssessment.notALegalVerdict,true);
 assert.ok(x.warnings.length>0);
 const y=assessEcoInvestmentClaim('Je veux investir 50000 FCFA');
 assert.equal(y.status,'INSUFFICIENT_EVIDENCE');
});
test('Eco IA respects translations and service responsibilities',()=>{
 assert.equal(adviseEcoRequest('supplier quotation',{locale:'en'}).intent,'PARTNERS');
 assert.equal(adviseEcoRequest('forum community',{locale:'en'}).intent,'COMMUNITIES');
 assert.equal(adviseEcoRequest('filme le registre de notre tontine').intent,'REGISTER');
 assert.equal(adviseEcoRequest('rédiger les statuts du groupe').intent,'DOCUMENTS');
});
test('Eco IA menu mounts actual local assistant instead of group creation',()=>{
 assert.match(read('apps/web/index.html'),/id="ecoAiNavBtn" data-view="dashboard" data-anchor="localAssistantCenter"/);
 assert.match(read('apps/web/src/main.js'),/ecoAiNavBtn'\)\?\.addEventListener\('click',\(\)=>localAssistantUI\.open\(\)\)/);
 const ui=read('apps/web/src/local-assistant.js');
 assert.match(ui,/renderAdvice\(raw\)/);
 assert.match(ui,/adviseEcoRequest\(raw/);
});
test('existing cell voice remains a draft, preserving canonical validation',()=>{
 const ui=read('apps/web/src/voice-entry-ui.ts');
 assert.match(ui,/function installFinancialCellDictation/);
 assert.match(ui,/input\.dispatchEvent\(new Event\('input'/);
});
