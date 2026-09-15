import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {EcoPulseService} from '../.build/packages/ecopulse/src/index.js';
import {CommercialPreferenceService} from '../.build/packages/commercial-preferences/src/index.js';

test('EcoPulse learns strong first-party interests but passive impressions do not change affinities',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const pulse=new EcoPulseService(db);
    await pulse.record('user_a',{itemId:'c1',itemKind:'interest-community',action:'IMPRESSION',source:'community-discovery',tags:['nightlife','restaurants'],locality:'Yaoundé'});
    assert.deepEqual(await pulse.affinities('user_a'),[],'passive impressions should not train the taste profile');
    await pulse.record('user_a',{itemId:'c1',itemKind:'interest-community',action:'JOIN',source:'community-discovery',tags:['nightlife','restaurants'],locality:'Yaoundé'});
    const affinities=await pulse.affinities('user_a');
    assert.ok(affinities.some(x=>x.dimension==='tag'&&x.value==='nightlife'&&x.score>0));
    assert.ok(affinities.some(x=>x.dimension==='locality'&&x.value==='yaoundé'&&x.score>0));
  }finally{db.close();}
});

test('EcoPulse rejects sensitive feature sources and strips sensitive tags from recommendation learning',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const pulse=new EcoPulseService(db);
    await assert.rejects(()=>pulse.record('user_a',{itemId:'x',itemKind:'financial-balance',action:'OPEN',source:'finance-dashboard',tags:['debt']}),/SENSITIVE_ENGAGEMENT_FEATURE_FORBIDDEN/);
    await pulse.record('user_a',{itemId:'shop1',itemKind:'shop-item',action:'OPEN',source:'group-shop',tags:['savon','member.debt','health'],locality:'Yaoundé'});
    const values=(await pulse.affinities('user_a')).map(x=>x.value);
    assert.ok(values.includes('savon'));
    assert.ok(!values.some(x=>/debt|health/i.test(x)));
  }finally{db.close();}
});

test('EcoPulse hides explicitly rejected items and favors matching interests with explainable reasons',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const pulse=new EcoPulseService(db);
    await pulse.record('user_a',{itemId:'seed',itemKind:'interest-community',action:'JOIN',source:'community-discovery',tags:['nightlife','music'],locality:'Yaoundé'});
    await pulse.record('user_a',{itemId:'blocked',itemKind:'interest-community',action:'NOT_INTERESTED',source:'community-discovery',tags:['nightlife'],locality:'Yaoundé'});
    const ranked=await pulse.rank('user_a',[
      {id:'liked',kind:'interest-community',title:'Yaoundé by Night',source:'community-discovery',tags:['nightlife','music'],locality:'Yaoundé',freshnessAt:new Date().toISOString()},
      {id:'blocked',kind:'interest-community',title:'Masqué',source:'community-discovery',tags:['nightlife'],locality:'Yaoundé'},
      {id:'other',kind:'public-group',title:'Groupe jardinage',source:'group-discovery',tags:['jardinage'],locality:'Douala'}
    ],{locality:'Yaoundé',limit:10,dayKey:'2026-09-15'});
    assert.equal(ranked.some(x=>x.id==='blocked'),false);
    assert.equal(ranked[0].id,'liked');
    assert.ok(ranked[0].reasonCodes.includes('PERSONAL_AFFINITY'));
    assert.ok(ranked[0].why.some(x=>x.includes('centres d’intérêt')));
  }finally{db.close();}
});

test('EcoPulse diversity caps prevent one source or kind from monopolizing the feed',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const pulse=new EcoPulseService(db);
    const candidates=[];
    for(let i=0;i<8;i++)candidates.push({id:'c'+i,kind:'interest-community',title:'Community '+i,source:'community-discovery',tags:['sorties']});
    candidates.push({id:'g1',kind:'public-group',title:'Groupe 1',source:'group-discovery',tags:['entraide']});
    candidates.push({id:'s1',kind:'shop-item',title:'Savon',source:'group-shop',tags:['savon']});
    const ranked=await pulse.rank('user_a',candidates,{limit:10,dayKey:'2026-09-15'});
    assert.ok(ranked.filter(x=>x.kind==='interest-community').length<=3);
    assert.ok(ranked.filter(x=>x.source==='community-discovery').length<=4);
    assert.ok(ranked.some(x=>x.kind==='public-group'));
    assert.ok(ranked.some(x=>x.kind==='shop-item'));
  }finally{db.close();}
});

test('commercial preference service keeps beta accounts active but privacy-first honors stored OFF',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const beta=new CommercialPreferenceService(db,true);
    assert.equal((await beta.consent('user_a','group_a')).granted,true);
    await beta.setConsent('user_a','group_a',false);
    assert.equal((await beta.consent('user_a','group_a')).granted,true,'BETA_OPEN should ignore stale OFF for effective access');
    const privacy=new CommercialPreferenceService(db,false);
    assert.equal((await privacy.consent('user_a','group_a')).granted,false,'future privacy-first mode should honor persisted OFF');
  }finally{db.close();}
});
