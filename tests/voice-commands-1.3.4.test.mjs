import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoiceAmount,parseVoiceFinancialCommand,matchVoiceCandidate} from '../.build/packages/voice-commands/src/index.js';

test('commande vocale française Eco remplit plusieurs rubriques',()=>{
  const draft=parseVoiceFinancialCommand('Eco! Chez Membre Serge, remplis Secours: 500; Epargne: 1000; Remboursement: 5000');
  assert.equal(draft.wakeWordDetected,true);
  assert.equal(draft.memberQuery,'Serge');
  assert.equal(draft.entries.length,3);
  assert.deepEqual(draft.entries.map(x=>[x.label,x.amount,x.direction]),[
    ['Secours',500,'IN'],['Epargne',1000,'IN'],['Remboursement',5000,'IN']
  ]);
});

test('montants dictés en toutes lettres français',()=>{
  assert.equal(parseVoiceAmount('cinq cents francs'),500);
  assert.equal(parseVoiceAmount('mille'),1000);
  assert.equal(parseVoiceAmount('cinq mille'),5000);
  assert.equal(parseVoiceAmount('cinquante-deux mille cinq cents'),52500);
});

test('commande vocale anglaise remplit plusieurs rubriques',()=>{
  const draft=parseVoiceFinancialCommand('Eco, for member Serge, fill Support: five hundred; Savings: one thousand; Repayment: five thousand');
  assert.equal(draft.memberQuery,'Serge');
  assert.equal(draft.entries.length,3);
  assert.deepEqual(draft.entries.map(x=>x.amount),[500,1000,5000]);
  assert.equal(draft.localeGuess,'en');
});

test('la voix distingue explicitement une dépense',()=>{
  const draft=parseVoiceFinancialCommand('Eco, chez membre Serge, remplis dépense Transport: 2000; Secours: 500');
  assert.equal(draft.entries[0].direction,'OUT');
  assert.equal(draft.entries[0].label,'Transport');
  assert.equal(draft.entries[0].amount,2000);
  assert.equal(draft.entries[1].direction,'IN');
});

test('résolution tolérante des noms et alias mais refuse les ambiguïtés',()=>{
  const exact=matchVoiceCandidate('épargne',[{id:'r1',label:'Epargne'},{id:'r2',label:'Secours'}]);
  assert.equal(exact.candidate?.id,'r1');
  const alias=matchVoiceCandidate('aide sociale',[{id:'r1',label:'Secours',aliases:['Aide sociale','Solidarité']},{id:'r2',label:'Transport'}]);
  assert.equal(alias.candidate?.id,'r1');
  const ambiguous=matchVoiceCandidate('tontine',[{id:'t1',label:'Tontine 1000'},{id:'t2',label:'Tontine 2000'}]);
  assert.equal(ambiguous.status,'AMBIGUOUS');
});
