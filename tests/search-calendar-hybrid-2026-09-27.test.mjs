import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {localUniversalSearch,remoteUniversalSearch} from '../apps/web/src/universal-search.js';
import {buildUnifiedCalendar} from '../apps/web/src/unified-calendar.js';

test('universal search ranks authorized local projections and normalizes accents',()=>{
  const rows=localUniversalSearch({
    query:'epargne',
    groups:[{id:'g1',name:'Épargne Solidaire',kind:'association'}],
    members:[{id:'m1',displayName:'Alice',status:'active',roles:['member']}],
    meetings:[{id:'s1',title:'Séance septembre',status:'open'}],
    rubrics:[{id:'r1',name:'Épargne scolaire',activityPlan:{kind:'SAVINGS'}}],
    modules:[{id:'FINANCE.SAVINGS',labelFr:'Épargne',labelEn:'Savings',status:'FOUNDATION_ACTIVE',lot:'E'}]
  });
  assert.ok(rows.some(x=>x.kind==='group'&&x.id==='g1'));
  assert.ok(rows.some(x=>x.kind==='rubric'&&x.id==='r1'));
  assert.ok(rows.some(x=>x.kind==='module'&&x.id==='FINANCE.SAVINGS'));
  assert.ok(!rows.some(x=>x.kind==='member'&&x.id==='m1'));
});

test('remote universal search covers documents knowledge métier records and inbox',()=>{
  const rows=remoteUniversalSearch({
    query:'seance',
    documents:[{recordId:'d1',title:'RI séance',score:3,snippet:'Article 8',source:'R2'}],
    knowledge:[{id:'k1',title:'Règle séance',data:{knowledgeState:'VALIDATED',body:'Deuxième samedi'}}],
    workspaces:[{id:'w1',title:'Préparation séance',moduleId:'MEETING.COMMAND_CENTER',status:'ACTIVE',summary:'Checklist séance',tags:['réunion'],data:{meetingId:'s1'}}],
    inbox:[{id:'i1',kind:'obligation',title:'Valider séance',status:'open',priority:'high',sourceType:'MEETING'}]
  });
  assert.equal(rows.length,4);
  assert.ok(rows.some(x=>x.kind==='document'&&x.id==='d1'));
  assert.ok(rows.some(x=>x.kind==='knowledge'&&x.id==='k1'));
  assert.ok(rows.some(x=>x.kind==='workspace'&&x.id==='w1'&&x.moduleId==='MEETING.COMMAND_CENTER'));
  assert.ok(rows.some(x=>x.kind==='inbox'&&x.id==='i1'));
});

test('unified calendar combines meetings, explicit workspace dates and actor obligations without inventing dates',()=>{
  const model=buildUnifiedCalendar({
    meetings:[{id:'s1',title:'Séance 1',scheduledAt:'2026-10-10T10:00:00Z',status:'planned'}],
    records:[
      {id:'w1',title:'Dossier fournisseur',moduleId:'SUPPLIER.CREDIT',status:'ACTIVE',data:{dueAt:'2026-10-12T10:00:00Z'}},
      {id:'w2',title:'Sans date',moduleId:'BUSINESS.STUDIO',status:'ACTIVE',data:{note:'pas de date'}}
    ],
    obligations:[{id:'o1',title:'Valider PV',status:'OPEN',dueAt:'2026-10-11T10:00:00Z',sourceType:'GOVERNANCE'}],
    now:new Date('2026-10-01T00:00:00Z')
  });
  assert.equal(model.all.length,3);
  assert.deepEqual(model.all.map(x=>x.kind),['meeting','obligation','record']);
  assert.ok(!model.all.some(x=>x.entityId==='w2'));
});

test('launch keeps canonical families and models hybrid as a rotating-tontine variant',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  const launch=fs.readFileSync('apps/web/src/launch-studio.js','utf8');
  const registry=fs.readFileSync('packages/module-registry/src/index.ts','utf8');
  assert.doesNotMatch(html,/value="hybrid">Association \+ tontine/);
  assert.match(html,/id="tontineVariant"/);
  assert.match(html,/value="HYBRID">Hybride argent \+ nature/);
  assert.match(main,/family==='rotating_tontine'/);
  assert.match(main,/variant==='HYBRID'\?'MIXED'/);
  assert.match(launch,/tontineVariant:value\('groupKind'\)==='rotating_tontine'/);
  assert.match(main,/renderUniversalSearchFull/);
  assert.match(main,/renderUnifiedCalendar/);
  assert.match(registry,/CORE\.HYBRID_GROUP[^\n]*FOUNDATION_ACTIVE[^\n]*SPECIALIZED/);
  assert.match(registry,/SEARCH\.UNIVERSAL[^\n]*FOUNDATION_ACTIVE[^\n]*SPECIALIZED/);
  assert.match(registry,/CALENDAR\.UNIFIED[^\n]*FOUNDATION_ACTIVE[^\n]*SPECIALIZED/);
});
