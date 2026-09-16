import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {FounderControlStore} from '../.build/packages/founder-control/src/index.js';

test('Founder Control Center auto-registers every canonical capability it receives',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const store=new FounderControlStore(db);
    const capabilities=[
      {id:'A.ONE',labelFr:'Un',labelEn:'One',status:'FOUNDATION_ACTIVE',lot:'A',workspace:'SPECIALIZED'},
      {id:'B.TWO',labelFr:'Deux',labelEn:'Two',status:'STRUCTURAL_V1',lot:'B',workspace:'UNIVERSAL'}
    ];
    let snap=await store.snapshot(capabilities);
    assert.deepEqual(snap.capabilities.map(x=>x.id),['A.ONE','B.TWO']);
    assert.equal(snap.supervisionRule,'CATALOG_AUTO_REGISTER');
    capabilities.push({id:'C.THREE',labelFr:'Trois',labelEn:'Three',status:'FUNCTIONAL_BETA',lot:'C',workspace:'SPECIALIZED'});
    snap=await store.snapshot(capabilities);
    assert.ok(snap.capabilities.some(x=>x.id==='C.THREE'));
    await store.recordCapabilityCheck('C.THREE','FAIL','Régression détectée');
    snap=await store.snapshot(capabilities);
    const c=snap.capabilities.find(x=>x.id==='C.THREE');
    assert.equal(c.health,'FAIL');assert.equal(c.healthNote,'Régression détectée');
  }finally{db.close();}
});

test('Founder Control Center tracks editorial work and incidents to resolution',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const store=new FounderControlStore(db);
    const content=await store.createContent({key:'HELP-1',title:'Guide Épargne',priority:'HIGH',note:'À reprendre'});
    const incident=await store.createIncident({key:'BUG-1',title:'Forum indisponible',priority:'CRITICAL',note:'Diagnostic'});
    await store.transition(content.id,'NEEDS_REVIEW','Premier brouillon prêt');
    await store.transition(incident.id,'RESOLVED','Correctif qualifié');
    const snap=await store.snapshot([]);
    assert.equal(snap.content[0].status,'NEEDS_REVIEW');
    assert.equal(snap.incidents[0].status,'RESOLVED');
  }finally{db.close();}
});
