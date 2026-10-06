import test from 'node:test';
import assert from 'node:assert/strict';
import { compareNormalizedCellIntents } from '../.build/packages/domain/src/index.js';

const intent=(id,at,device='phone',seq=1,quality='VERIFIED')=>({
  commandId:id,effectiveRecordedAtMs:Date.parse(at),
  clockQuality:quality,deviceId:device,deviceSequence:seq
});
const choose=(current,arrival)=>{
  const order=compareNormalizedCellIntents(arrival.intent,current.intent);
  if(order==='CLOCK_REVIEW')throw new Error('REQUIRES_CLOCK_REVIEW');
  return order==='NEWER'?arrival:current;
};
test('recorded time beats arrival in either offline reconnect order (pure arbiter)',()=>{
  const initial={amount:1000,intent:intent('seed','2026-10-06T09:00:00Z','base')};
  const first={amount:3000,intent:intent('A','2026-10-06T10:10:00Z','phone-a')};
  const second={amount:2000,intent:intent('B','2026-10-06T10:05:00Z','phone-b')};
  assert.equal([first,second].reduce(choose,initial).amount,3000);
  assert.equal([second,first].reduce(choose,initial).amount,3000);
});
test('later SAME amount is still a newer recording and defeats an older offline write',()=>{
  const initial={amount:1000,intent:intent('seed','2026-10-06T09:00:00Z','base')};
  const laterSame={amount:1000,intent:intent('same','2026-10-06T10:10:00Z','phone-a')};
  const olderDifferent={amount:2000,intent:intent('other','2026-10-06T10:05:00Z','phone-b')};
  assert.equal(choose(laterSame,olderDifferent).amount,1000);
  assert.equal([olderDifferent,laterSame].reduce(choose,initial).amount,1000);
  assert.equal([laterSame,olderDifferent].reduce(choose,initial).amount,1000);
});
test('idempotent retry does not replace the recording time',()=>{
  const same=intent('command-X','2026-10-06T10:10:00Z');
  const retry={...same,effectiveRecordedAtMs:Date.parse('2026-10-06T11:00:00Z')};
  assert.equal(compareNormalizedCellIntents(retry,same),'SAME');
});
test('tie break deterministic on device, sequence and command without floating timestamp',()=>{
  const a=intent('a','2026-10-06T10:10:00Z','dev-a',1);
  const b=intent('b','2026-10-06T10:10:00Z','dev-b',1);
  assert.equal(compareNormalizedCellIntents(b,a),'NEWER');
  assert.equal(compareNormalizedCellIntents(a,b),'OLDER');
  assert.equal(compareNormalizedCellIntents({...a,commandId:'a2',deviceSequence:2},a),'NEWER');
});
test('unverifiable clock never silently wins through arrival or an invented timestamp',()=>{
  const trusted=intent('server','2026-10-06T10:00:00Z');
  const bogus=intent('future','2026-11-06T10:00:00Z','fast-phone',1,'UNVERIFIABLE');
  assert.equal(compareNormalizedCellIntents(bogus,trusted),'CLOCK_REVIEW');
  assert.equal(compareNormalizedCellIntents({...trusted,effectiveRecordedAtMs:NaN},bogus),'CLOCK_REVIEW');
});
