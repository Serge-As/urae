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


test('first existing account becomes durable platform owner while later accounts do not',async()=>{
  const db=new SQLiteD1(':memory:');
  try{
    db.db.exec("CREATE TABLE auth_accounts(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,tenant_id TEXT NOT NULL UNIQUE,locale TEXT NOT NULL,created_at TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL);");
    db.db.prepare("INSERT INTO auth_accounts VALUES(?,?,?,?,?,?,?,?)").run('user_first','first','First','tenant_first','fr','2026-01-01T00:00:00Z','salt','hash');
    db.db.prepare("INSERT INTO auth_accounts VALUES(?,?,?,?,?,?,?,?)").run('user_later','later','Later','tenant_later','fr','2026-02-01T00:00:00Z','salt2','hash2');
    db.migrate();
    const store=new FounderControlStore(db);
    assert.equal(await store.isPlatformOwner('user_first'),true);
    assert.equal(await store.isPlatformOwner('user_later'),false);
  }finally{db.close();}
});
