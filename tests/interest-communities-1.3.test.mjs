import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {InterestCommunityService} from '../.build/packages/interest-communities/src/index.js';

test('Yaoundé by Night can exist independently of any financial group',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const svc=new InterestCommunityService(db);
    const c=await svc.create('alice',{name:'Yaoundé by Night',description:'Bons coins et sorties nocturnes',locality:'Yaoundé',visibility:'PUBLIC',joinPolicy:'OPEN',tags:['sorties','restaurants','hébergement','musique']});
    const found=await svc.discover('bob',{q:'night',locality:'Yaoundé'});assert.equal(found.length,1);assert.equal(found[0].id,c.id);
    assert.deepEqual(await svc.join('bob',c.id),{status:'JOINED'});
    await svc.createContent('bob',c.id,{kind:'PLACE',title:'Bon coin Bastos',body:'Lieu recommandé par la communauté.',category:'sortie',locality:'Yaoundé'});
    await svc.createContent('alice',c.id,{kind:'EVENT',title:'Sortie du samedi',body:'Rencontre de la communauté.',category:'musique',locality:'Yaoundé',startsAt:'2026-09-19T20:00:00+01:00'});
    const feed=await svc.feed('bob',c.id);assert.equal(feed.length,2);assert.ok(feed.some(x=>x.kind==='PLACE'));assert.ok(feed.some(x=>x.kind==='EVENT'));
    const discoveryFeed=await svc.discoverContent('bob',20);assert.equal(discoveryFeed.length,2);assert.ok(discoveryFeed.every(x=>x.communityName==='Yaoundé by Night'));assert.ok(discoveryFeed.some(x=>x.kind==='PLACE'));
    assert.equal((await svc.mine('bob'))[0].name,'Yaoundé by Night');
  }finally{db.close();}
});

test('private or request communities preserve membership governance',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const svc=new InterestCommunityService(db);
    const publicRequest=await svc.create('alice',{name:'Entrepreneurs Yaoundé',visibility:'PUBLIC',joinPolicy:'REQUEST',tags:['business']});
    const privateC=await svc.create('alice',{name:'Cercle privé',visibility:'PRIVATE',joinPolicy:'REQUEST',tags:['privé']});
    await svc.createContent('alice',privateC.id,{kind:'POST',title:'Secret',body:'Contenu réservé aux membres du cercle privé.'});
    const discovered=await svc.discover('bob',{});assert.ok(discovered.some(x=>x.id===publicRequest.id));assert.equal(discovered.some(x=>x.id===privateC.id),false);
    assert.equal((await svc.discoverContent('bob',20)).some(x=>x.communityId===privateC.id),false,'private community content must stay outside global discovery');
    const pending=await svc.join('bob',publicRequest.id,'Je suis entrepreneur');assert.equal(pending.status,'PENDING');
    const reqs=await svc.joinRequests('alice',publicRequest.id);assert.equal(reqs.length,1);
    await svc.decideJoin('alice',publicRequest.id,reqs[0].id,'APPROVE');
    assert.equal((await svc.get('bob',publicRequest.id)).viewerStatus,'ACTIVE');
  }finally{db.close();}
});
