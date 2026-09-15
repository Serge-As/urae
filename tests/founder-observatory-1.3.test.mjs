import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {FounderLearningStore} from '../.build/packages/founder-observatory/src/index.js';

test('founder observatory stores no tenant group member or raw source identifiers',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const store=new FounderLearningStore(db,'a-very-long-private-learning-pepper');
    await store.ingest('ECO-GRP-AAAAA-BBBBB-CC',[{groupCode:'ignored-client-field',category:'MEETING_RHYTHM',key:'cadence',value:'monthly',confidence:0.9}]);
    const rows=(await db.prepare('SELECT * FROM collective_learning_signals').all()).results;
    assert.equal(rows.length,1);
    const row=rows[0];assert.ok(row.group_token);assert.notEqual(row.group_token,'ECO-GRP-AAAAA-BBBBB-CC');
    assert.equal('tenant_id' in row,false);assert.equal('group_id' in row,false);assert.equal('member_id' in row,false);assert.equal('source_ref' in row,false);
  }finally{db.close();}
});

test('founder discoveries require five distinct pseudonymous groups',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const store=new FounderLearningStore(db,'another-long-private-learning-pepper');
    for(let i=1;i<=4;i++)await store.ingest('ECO-GRP-GROUP'+i,[{groupCode:'unused',category:'RUBRIC_PATTERN',key:'tontine.instances',value:'multiple',confidence:0.8}]);
    assert.deepEqual(await store.discoveries(5),[]);
    await store.ingest('ECO-GRP-GROUP5',[{groupCode:'unused',category:'RUBRIC_PATTERN',key:'tontine.instances',value:'multiple',confidence:0.9}]);
    const discoveries=await store.discoveries(5);assert.equal(discoveries.length,1);assert.equal(discoveries[0].supportingGroups,5);assert.equal(discoveries[0].privacy,'K_ANONYMIZED');
    const stats=await store.stats(5);assert.equal(stats.pseudonymousGroups,5);assert.equal(stats.discoveries,1);
  }finally{db.close();}
});

test('founder store refuses operation without a sufficiently strong server pepper',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const store=new FounderLearningStore(db,'short');
    await assert.rejects(()=>store.ingest('ECO-GRP-X',[{groupCode:'unused',category:'MEETING_RHYTHM',key:'cadence',value:'monthly',confidence:1}]),/LEARNING_PEPPER_REQUIRED/);
  }finally{db.close();}
});
