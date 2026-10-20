import test from 'node:test';
import assert from 'node:assert/strict';
import {navigationKey,searchNavigationEntries,createNavigationFavorites} from '../apps/web/src/shell-navigation.js';

const entries=[
  {id:'loan',view:'finance',anchor:'financeLoanGuide',label:'Prêts'},
  {id:'saving',view:'finance',anchor:'savingsYieldLab',label:'Épargne'},
  {id:'shop',module:'MARKETPLACE.CORE',label:'Marketplace'},
  {id:'sessions',view:'sessions',label:'Séances'},
  {id:'people',view:'members',label:'Membres'}
];
test('local function search matches accents, bilingual synonyms and all query words',()=>{
  for(const q of ['prêt','pret','loans','repayment'])assert.equal(searchNavigationEntries(entries,q)[0].id,'loan');
  assert.equal(searchNavigationEntries(entries,'epargne')[0].id,'saving');
  assert.equal(searchNavigationEntries(entries,'acheter vendre')[0].id,'shop');
  assert.equal(searchNavigationEntries(entries,'meeting')[0].id,'sessions');
  assert.equal(searchNavigationEntries(entries,'loans marketplace').length,0);
  assert.deepEqual(searchNavigationEntries(entries,'').map(e=>e.id),entries.map(e=>e.id));
});
test('navigation keys distinguish anchors and individual financial modes',()=>{
  assert.notEqual(navigationKey({view:'finance',anchor:'loan'}),navigationKey({view:'finance',anchor:'saving'}));
  assert.notEqual(navigationKey({view:'operations',sheetMode:'meeting'}),navigationKey({view:'operations',sheetMode:'individual'}));
});
const fixture=()=>{
  const data=new Map();let scope={actor:'A',group:'G1'},clock=2000000000000;
  const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  return {data,storage,setScope:s=>scope=s,advance:n=>clock+=n,now:()=>clock,favorites:createNavigationFavorites({storage,scope:()=>scope,now:()=>clock})};
};
test('favorites persist only identifiers and are isolated by actor and group',()=>{
  const f=fixture();assert.equal(f.favorites.toggle('loan'),true);assert.deepEqual(f.favorites.ids(),['loan']);
  f.setScope({actor:'A',group:'G2'});assert.deepEqual(f.favorites.ids(),[]);f.favorites.toggle('saving');
  f.setScope({actor:'B',group:'G1'});assert.deepEqual(f.favorites.ids(),[]);
  f.setScope({actor:'A',group:'G1'});assert.deepEqual(f.favorites.ids(),['loan']);
  assert.deepEqual(Object.keys(JSON.parse([...f.data.values()][0]).items[0]).sort(),['at','id']);
});
test('favorites are bounded, unpin correctly, expire and can be cleared',()=>{
  const f=fixture();for(let i=0;i<12;i++)f.favorites.toggle('space'+i);
  assert.equal(f.favorites.ids().length,8);assert.equal(f.favorites.ids()[0],'space11');
  f.favorites.toggle('space11');assert.equal(f.favorites.ids().includes('space11'),false);
  f.advance(30*86400000);assert.deepEqual(f.favorites.ids(),[]);
  f.favorites.toggle('new');f.favorites.clear();assert.deepEqual(f.favorites.ids(),[]);
});
test('corrupt, future and duplicated records cannot leak or exceed limits',()=>{
  const f=fixture();f.favorites.toggle('seed');const key=[...f.data.keys()][0];
  f.data.set(key,'bad json');assert.deepEqual(f.favorites.ids(),[]);
  f.data.set(key,JSON.stringify({items:[null,{id:'future',at:f.now()+1},{id:'ok',at:f.now()},{id:'ok',at:f.now()},{id:'x'.repeat(400),at:f.now()}]}));
  assert.deepEqual(f.favorites.ids(),['ok']);
});
test('anonymous and unavailable local storage fail without preventing navigation',()=>{
  const f=fixture();f.setScope({});assert.equal(f.favorites.toggle('loan'),false);
  const locked=createNavigationFavorites({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('full');}},scope:()=>({actor:'A'})});
  assert.deepEqual(locked.ids(),[]);assert.equal(locked.toggle('loan'),false);assert.equal(locked.clear(),false);
});
