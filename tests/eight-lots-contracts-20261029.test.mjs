import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateSynthesis} from '../.build/workers/api/src/synthesis-review.js';
import {parseVoiceAmount,voiceAmountInWords} from '../.build/packages/voice-commands/src/index.js';
import {selectTableMembers} from '../.build/apps/web/src/table-preferences.js';
import worker from '../.build/workers/api/src/index.js';
test('collective review rejects the same amount at a different version, including amount reverted to its original value',async()=>{
  const args={snapshot:{cells:[{meetingId:'s',membershipId:'m',rubricId:'r',amount:1000,cellVersion:3,actorId:'peer'}]},meetingId:'s',membershipId:'m'};
  await assert.rejects(validateSynthesis({...args,values:[{rubricId:'r',amount:1000,cellVersion:1}]}),/SYNTHESIS_CHANGED_REVIEW_REQUIRED/);
  assert.equal((await validateSynthesis({...args,values:[{rubricId:'r',amount:1000,cellVersion:3}]}))[0].actorId,'peer');
  await assert.rejects(validateSynthesis({...args,values:[{rubricId:'r',amount:1000,cellVersion:3},{rubricId:'r',amount:1000,cellVersion:3}]}),/INVALID_SYNTHESIS/);
  await assert.rejects(validateSynthesis({...args,membershipId:'other',values:[{rubricId:'r',amount:1000,cellVersion:3}]}),/SYNTHESIS_CHANGED/);
});
test('financial dictation corpus accepts mixed words and complete separators, never guesses missing zeroes',()=>{
  for(const[text,amount]of[['5',5],['5000',5000],['5 000',5000],['5.000',5000],['5,000',5000],['5 mille',5000],['5 mille 200',5200],['cinq mille',5000],['5 thousand',5000],['2 million 300 thousand',2300000],['deux cent cinquante',250],['0',0]])assert.equal(parseVoiceAmount(text),amount,text);
  for(const text of ['5,50','5.50','5 00','cinq bananes','-5000','9007199254740992','9007199254740992 million'])assert.equal(parseVoiceAmount(text),undefined,text);
  assert.equal(voiceAmountInWords(5000),'cinq mille');assert.equal(voiceAmountInWords(71),'soixante et onze');assert.equal(voiceAmountInWords(80),'quatre-vingts');assert.equal(voiceAmountInWords(200),'deux cents');assert.equal(voiceAmountInWords(5200,'en'),'five thousand two hundred');
});
test('table search and stable sorting do not mutate the canonical members or total input',()=>{
  const all=[{id:'1',displayName:'Élodie',memberNumber:1},{id:'2',displayName:'Serge',memberNumber:2},{id:'3',displayName:'Serge',memberNumber:3}];
  const visible=selectTableMembers(all,{query:'serge',sort:'name'},()=>1000);assert.deepEqual(visible.map(x=>x.id),['2','3']);assert.equal(all.length,3);
  assert.deepEqual(selectTableMembers(all,{query:'elodie',sort:'number'},()=>0).map(x=>x.id),['1']);assert.deepEqual(all.map(x=>x.id),['1','2','3']);
});

test('optional ASR worker has its own CSP while document policy and missing-asset protection stay strict',async()=>{
  const strict="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'";
  const ASSETS={fetch:async()=>new Response('/* synthetic asset */',{headers:{'content-type':'text/javascript','content-security-policy':strict}})};
  const document=await worker.fetch(new Request('https://eco.test/index.html'),{ASSETS});
  assert.equal(document.headers.get('content-security-policy'),strict);
  const voice=await worker.fetch(new Request('https://eco.test/vendor/voice/worker.js'),{ASSETS});
  assert.match(voice.headers.get('content-security-policy'),/script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'/);
  assert.match(voice.headers.get('content-security-policy'),/connect-src 'self' blob:/);
  assert.match(voice.headers.get('content-security-policy'),/worker-src 'none'/);
  const missing=await worker.fetch(new Request('https://eco.test/vendor/voice/worker.js'),{ASSETS:{fetch:async()=>new Response('<!doctype html>',{headers:{'content-type':'text/html'}})}});
  assert.equal(missing.status,503);assert.doesNotMatch(missing.headers.get('content-security-policy'),/unsafe-eval/);
});
