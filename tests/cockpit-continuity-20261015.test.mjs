import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourneyContext} from '../apps/web/src/journey-context.js';
import {interpretLocalAssistant} from '../apps/web/src/local-assistant.js';

function fixture(){const values=new Map();let actor='a',group='one',time=1000;return {memory:createJourneyContext({storage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},scope:()=>({actor,group}),now:()=>time}),values,actor:v=>actor=v,group:v=>group=v,time:v=>time=v};}
test('journey isolates accounts and groups and never stores business content',()=>{
 const f=fixture();f.memory.visit('sessions');f.memory.visit('operations');f.memory.visit('sessions');assert.deepEqual(f.memory.snapshot().recent.map(r=>r.view),['sessions','operations']);
 f.actor('b');assert.equal(f.memory.snapshot().recent.length,0);f.memory.visit('finance');f.actor('a');assert.equal(f.memory.snapshot().recent[0].view,'sessions');f.group('two');assert.equal(f.memory.snapshot().recent.length,0);
 f.group('one');f.memory.visit({view:'finance',amount:1200});assert.equal(f.memory.snapshot().recent.length,2);assert.ok([...f.values.values()].every(v=>!v.includes('amount')));
});
test('disabled memory clears and remains disabled; anonymous visits cannot persist',()=>{
 const f=fixture();f.memory.visit('sessions');f.memory.setEnabled(false);f.memory.visit('finance');assert.deepEqual(f.memory.snapshot(),{enabled:false,recent:[]});f.memory.clear();assert.equal(f.memory.snapshot().enabled,false);f.memory.setEnabled(true);f.memory.visit('members');f.memory.clear();assert.equal(f.memory.snapshot().recent.length,0);f.actor('');f.memory.visit('sessions');assert.equal(f.memory.snapshot().enabled,false);
});
test('journey expires, bounds and rejects unsupported destinations',()=>{
 const f=fixture();for(const v of ['dashboard','sessions','finance','inbox','members','tontines','services','documents','ecosystem','discovery'])f.memory.visit(v);assert.equal(f.memory.snapshot().recent.length,8);f.memory.visit('control');assert.equal(f.memory.snapshot().recent[0].view,'discovery');f.time(31*86400000);assert.equal(f.memory.snapshot().recent.length,0);
});
test('storage failures cannot break navigation',()=>{const m=createJourneyContext({storage:{getItem(){throw Error();},setItem(){throw Error();}},scope:()=>({actor:'a'})});assert.doesNotThrow(()=>m.visit('sessions'));assert.doesNotThrow(()=>m.clear());});
test('retention reduction purges expired visits and sheet references without resurrection',()=>{
 const f=fixture();f.memory.visit('operations');f.memory.rememberReference({kind:'meeting',id:'old-sheet',view:'operations'});f.time(2*86400000);f.memory.visit('documents');f.memory.rememberReference({kind:'meeting',id:'new-sheet',view:'sessions'});
 assert.equal(f.memory.setRetentionDays(1),true);assert.deepEqual(f.memory.snapshot().recent.map(x=>x.view),['documents']);assert.deepEqual(f.memory.references().map(x=>x.id),['new-sheet']);assert.equal(f.memory.settings().retentionDays,1);
 assert.equal(f.memory.setRetentionDays(30),true);assert.deepEqual(f.memory.references().map(x=>x.id),['new-sheet']);assert.equal(f.memory.snapshot().recent.length,1);assert.equal(f.memory.setRetentionDays(365),false);assert.equal(f.memory.settings().retentionDays,30);
});
test('selective forgetting removes only the requested space and its resume references',()=>{
 const f=fixture();f.memory.visit('sessions');f.memory.visit('documents');f.memory.rememberReference({kind:'meeting',id:'session-ref',view:'sessions'});f.memory.rememberReference({kind:'meeting',id:'operations-ref',view:'operations'});
 assert.equal(f.memory.forget('sessions'),true);assert.deepEqual(f.memory.snapshot().recent.map(x=>x.view),['documents']);assert.deepEqual(f.memory.references().map(x=>x.id),['operations-ref']);assert.equal(f.memory.forget('unknown'),false);f.memory.clear();assert.equal(f.memory.references().length,0);
});
test('device pause applies to this account across groups without enabling another account or changing business storage',()=>{
 const f=fixture();f.memory.visit('sessions');f.group('two');f.memory.visit('finance');assert.equal(f.memory.setDeviceEnabled(false),true);f.memory.visit('members');assert.deepEqual(f.memory.snapshot(),{enabled:false,recent:[]});f.group('one');assert.equal(f.memory.snapshot().enabled,false);
 f.actor('b');assert.equal(f.memory.snapshot().enabled,true);f.memory.setEnabled(false);f.actor('a');assert.equal(f.memory.snapshot().enabled,false);f.memory.clear();assert.equal(f.memory.setDeviceEnabled(true),true);assert.equal(f.memory.snapshot().enabled,true);assert.equal(f.memory.snapshot().recent.length,0);f.group('two');assert.deepEqual(f.memory.snapshot().recent.map(x=>x.view),['finance']);f.group('one');f.actor('b');assert.equal(f.memory.snapshot().enabled,false);
 assert.ok([...f.values.keys()].every(k=>k.startsWith('eco.journey.')));
});
test('FR and EN assistant intent parity and no autonomous accounting',()=>{
 for(const [fr,en,topic] of [['Préparer ma séance','Prepare my meeting','meeting'],['Vendre ou acheter','Sell or buy','commerce'],['Publier une opportunité','Publish an opportunity','opportunity'],['Comprendre un risque','Understand a risk','risk'],['Rédiger mes statuts','Draft my bylaws','governance'],['Importer un registre papier','Import a paper register','paper'],['Reprendre mon activité','Resume my activity','resume']]){
 for(const text of [fr,en]){const d=interpretLocalAssistant(text);assert.equal(d.intent,'GUIDE',text);assert.equal(d.topic,topic);assert.equal(d.canWriteLedger,false);}}
 assert.equal(interpretLocalAssistant('Create a group with 20 members').intent,'LAUNCH_DRAFT');assert.equal(interpretLocalAssistant('Savings 1000 for Alice').intent,'FINANCIAL_DRAFT');assert.equal(interpretLocalAssistant('Open sessions').view,'sessions');
});
