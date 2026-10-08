import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

async function fixture(run){
  const before={fetch:globalThis.fetch,indexedDB:globalThis.indexedDB,onLine:Object.getOwnPropertyDescriptor(navigator,'onLine')};
  globalThis.indexedDB={};Object.defineProperty(navigator,'onLine',{value:false,configurable:true});
  const app=new ConnectedApplication({actorId:'manager',tenantId:'tenant'});app.selectGroup('group');
  let sequence=1;const cached=new Map(),anchors=new Map(),calls=[];
  app.readSnapshots.get=async id=>cached.get(id);
  app.readSnapshots.save=async row=>{cached.set(row.id,row);return row;};
  app.outboxStorage.save=async()=>{};
  app.outboxStorage.recordFinancialCellIntent=async item=>({...item,payload:{...item.payload,deviceId:app.localDeviceId(),deviceSequence:++sequence,commandId:item.idempotencyKey}});
  app.sovereign.append=async()=>({});
  Object.defineProperty(navigator,'onLine',{value:true,configurable:true});
  const canonicalRecordedAtMs=Date.now()-20;
  const oldAnchorAtMs=Date.now()-60000;
  anchors.set('old-clock',oldAnchorAtMs);
  const stale=()=>({groupId:'group',deviceId:app.localDeviceId(),token:'old-clock',anchorAtMs:oldAnchorAtMs,monotonicAt:performance.now(),expiresAt:Date.now()+600000});
  app.financialClockAnchor=stale();
  const old={id:'original',actorId:'manager',tenantId:'tenant',idempotencyKey:'original-key',type:'FINANCIAL_CELL_CORRECTION_PROPOSAL_V2',status:'FAILED',attempts:1,createdAt:'2026-10-08T12:00:00Z',updatedAt:'2026-10-08T12:00:00Z',payload:{groupId:'group',meetingId:'session',membershipId:'member',rubricId:'rubric',targetAmount:4000,baselineValue:3000,baselineVersion:2,recordedOffline:true,recordedAtClient:'2026-10-08T12:00:00Z',clockAnchorId:'old-clock',elapsedSinceAnchorMs:100,deviceId:app.localDeviceId(),deviceSequence:1,commandId:'original-key'}};
  app.outbox.restore([old]);
  const preview={generatedAt:new Date().toISOString(),watermark:'canonical-v3',rows:[{outboxId:old.id,idempotencyKey:old.idempotencyKey,meetingId:'session',membershipId:'member',rubricId:'rubric',localAmount:4000,baselineAmount:3000,baselineVersion:2,recordedAt:old.createdAt,canonicalAmount:5000,canonicalVersion:3,canonicalUpdatedAt:new Date(canonicalRecordedAtMs).toISOString(),serverChangedSinceBaseline:true,sameAmount:false}]};
  globalThis.fetch=async url=>{
    assert.match(String(url),/financial-clock-anchor/);calls.push(String(url));
    const issuedAt=Date.now();anchors.set('fresh-clock',issuedAt);
    return new Response(JSON.stringify({token:'fresh-clock',anchorAtMs:issuedAt,expiresAt:new Date(issuedAt+600000).toISOString(),deviceId:app.localDeviceId()}),{status:200});
  };
  const decide=()=>app.resolveOfflineFinancialConfrontation(preview,{applyIds:[old.id],keepServerIds:[]});
  const normalizedTime=intent=>anchors.get(intent.payload.clockAnchorId)+intent.payload.elapsedSinceAnchorMs;
  try{await run({app,old,preview,cached,anchors,calls,stale,decide,normalizedTime,canonicalRecordedAtMs});}
  finally{app.forceTransportRetry();globalThis.fetch=before.fetch;if(before.indexedDB===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=before.indexedDB;if(before.onLine)Object.defineProperty(navigator,'onLine',before.onLine);else delete navigator.onLine;}
}

test('explicit reconfirmation records a time after the observed canonical version despite an older valid anchor',()=>fixture(async({app,old,decide,normalizedTime,canonicalRecordedAtMs})=>{
  await decide();const replacement=app.outboxItems().find(x=>x.id!==old.id);
  assert.ok(normalizedTime(replacement)>canonicalRecordedAtMs,'new confirmation must follow the observed canonical version');
  assert.equal(replacement.payload.targetAmount,4000);assert.equal(replacement.payload.baselineValue,5000);assert.equal(replacement.payload.baselineVersion,3);
  assert.equal(replacement.status,'PENDING','preparation is never a server confirmation');
  const original=app.outboxItems().find(x=>x.id===old.id);
  assert.equal(original.status,'CANCELLED');assert.deepEqual(original.payload,old.payload,'original recording and clock are immutable');
}));

test('a warmup begun before the decision cannot lend its older anchor to the reconfirmation',()=>fixture(async({app,old,stale,decide,normalizedTime,canonicalRecordedAtMs})=>{
  let finishOld;app.financialClockLoading=new Promise(resolve=>{finishOld=()=>{app.financialClockAnchor=stale();resolve();};}).finally(()=>{app.financialClockLoading=undefined;});
  const decision=decide();await Promise.resolve();finishOld();await decision;
  const replacement=app.outboxItems().find(x=>x.id!==old.id);
  assert.ok(normalizedTime(replacement)>canonicalRecordedAtMs,'new confirmation must follow the observed canonical version even with an in-flight old warmup');
}));

test('an unavailable clock endpoint cannot turn a cached old server timestamp into a fresh signed clock',()=>fixture(async({app,old,cached,decide})=>{
  app.financialClockAnchor=undefined;
  const path='/api/v1/groups/group/financial-clock-anchor?deviceId='+encodeURIComponent(app.localDeviceId());
  cached.set(app.offlineReadKey(path),{body:{token:'old-clock',anchorAtMs:Date.now()-60000,expiresAt:new Date(Date.now()+600000).toISOString(),deviceId:app.localDeviceId()},updatedAt:'2026-10-08T12:00:00Z'});
  globalThis.fetch=async()=>{throw Error('Synthetic clock transport outage');};
  await decide();const replacement=app.outboxItems().find(x=>x.id!==old.id);
  assert.equal(replacement.payload.clockAnchorId,undefined,'offline snapshot is not proof of a new clock anchor');
  assert.equal(replacement.status,'PENDING');assert.equal(replacement.payload.recordedOffline,true);
}));

test('a group change during the fresh clock request preserves the original intent and cannot create a command in another group',()=>fixture(async({app,old,decide})=>{
  let finish;
  globalThis.fetch=()=>new Promise(resolve=>{finish=()=>{const issuedAt=Date.now();resolve(new Response(JSON.stringify({token:'fresh-clock',anchorAtMs:issuedAt,expiresAt:new Date(issuedAt+600000).toISOString(),deviceId:app.localDeviceId()}),{status:200}));};});
  const decision=decide();
  for(let i=0;i<10&&!finish;i++)await Promise.resolve();
  assert.equal(typeof finish,'function','the fresh server clock request has begun');
  Object.defineProperty(navigator,'onLine',{value:false,configurable:true});app.selectGroup('another-group');
  Object.defineProperty(navigator,'onLine',{value:true,configurable:true});finish();
  await assert.rejects(decision,/CONFRONTATION_DECISION_STALE/);
  assert.equal(app.outboxItems().length,1,'no replacement crosses the group boundary');
  assert.equal(app.outboxItems()[0].status,'FAILED','the original remains available for its own group');
  assert.deepEqual(app.outboxItems()[0].payload,old.payload);
}));
