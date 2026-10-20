import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';
import {RequestBudgetMonitor,canCoalesceSecondaryRead} from '../.build/packages/application/src/request-budget.js';
import {compareLotEffects} from '../scripts/compare-lot-effects.mjs';
import {canonicalApproval,verifyEcoLockApproval} from '../scripts/verify-eco-lock-approval.mjs';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import worker from '../.build/workers/api/src/index.js';

test('only default GET options on the explicit secondary allowlist can be combined',()=>{
 for(const p of ['/api/v1/universe','/api/v1/product/capabilities','/api/v1/workspaces?moduleId=MEETING.COMMAND_CENTER','/api/v1/groups/g/concierge/profile'])assert.equal(canCoalesceSecondaryRead(p),true);
 for(const p of ['/api/v1/auth/session','/api/v1/groups/g/ledger','/api/v1/groups/g/financial-cells','/api/v1/groups/g/live/ticket','/api/v1/groups/g/notifications','/api/v1/groups/g/loans'])assert.equal(canCoalesceSecondaryRead(p),false);
 for(const opts of [{method:'POST'},{headers:{accept:'x'}},{signal:new AbortController().signal},{cache:'reload'},{credentials:'omit'}])assert.equal(canCoalesceSecondaryRead('/api/v1/universe',opts),false);
});
test('local measurement is opt-in, bounded to fixed categories and unable to reject an over-budget command',()=>{
 const meter=new RequestBudgetMonitor();meter.syncScope('account-and-group');assert.equal(meter.start('/secret','POST'),null);meter.reset(true,1);
 const a=meter.start('/api/v1/groups/secret-id/financial-cells','POST');meter.network(a);meter.json(a,{amount:5432,name:'private member'});meter.finish(a,true);
 const b=meter.start('/api/v1/groups/secret-id/ledger','GET');meter.network(b);meter.local(b);meter.finish(b,false);meter.stop();
 const report=meter.snapshot();assert.equal(report.overBudget,true);assert.equal(report.totals.networkRequests,2);assert.equal(report.totals.failures,1);assert.equal(report.pending,0);assert.ok(report.totals.decodedJsonBytes>0);assert.doesNotMatch(JSON.stringify(report),/secret-id|5432|private member|account-and-group/);
 meter.syncScope('another-account');meter.finish(a,true);assert.equal(meter.snapshot().totals.calls,0);assert.equal(meter.snapshot().enabled,false);
});
const globals=async run=>{const old=globalThis.fetch;try{await run();}finally{globalThis.fetch=old;}};
const options={actorId:'synthetic-manager',tenantId:'synthetic-tenant'};
const pause=()=>new Promise(r=>setImmediate(r));

test('six concurrent secondary reads become one fresh request, return independent copies and match all reference results',()=>globals(async()=>{
 const reports=[];
 for(const enabled of [false,true]){
  let reads=0;const app=new ConnectedApplication(options);app.setSecondaryReadCoalescing(enabled);app.startRequestMeasurement(2);
  globalThis.fetch=async()=>{reads++;await pause();return Response.json([{id:'synthetic-note',summary:'same response'}]);};
  const values=await Promise.all(Array.from({length:6},()=>app.listWorkspaceRecords('MEETING.COMMAND_CENTER')));assert.ok(values.every(v=>v[0].summary==='same response'));
  values[0][0].summary='local consumer edit';assert.equal(values[1][0].summary,'same response');const burst=reads;
  await app.listWorkspaceRecords('MEETING.COMMAND_CENTER');assert.equal(reads,burst+1,'a later read is not a timed cache');
  const beforeIdle=reads;await pause();await pause();assert.equal(reads,beforeIdle,'no idle wake or polling');app.stopRequestMeasurement();const measure=app.requestMeasurement();assert.equal(measure.totals.coalesced,enabled?5:0);assert.equal(measure.totals.networkRequests,enabled?2:7);
  reports.push({schema:'ECO_EFFECT_MIRROR_V1',scenario:'six-simultaneous-secondary-reads-plus-fresh-read',commandsSha256:createHash('sha256').update('6*GET(workspace:MEETING.COMMAND_CENTER);GET(fresh);idle').digest('hex'),effects:{responses:values.map((v,i)=>({index:i,id:v[0].id,summary:i===0?'local consumer edit':v[0].summary})),laterReadFresh:true,consumerIsolation:true},metrics:{networkRequests:reads,reads,writes:0,idleRequests:0}});
 }
 assert.equal(compareLotEffects(...reports).pass,true);assert.equal(compareLotEffects(...reports).savedRequests,5);
 await mkdir('artifacts',{recursive:true});await Promise.all(reports.map((r,i)=>writeFile('artifacts/lot28-mirror-'+(i?'after':'before')+'.json',JSON.stringify(r,null,2))));
}));
test('financial reads and commands are never combined and a mutation prevents joining an older secondary read',()=>globals(async()=>{
 const app=new ConnectedApplication(options);let sends=0;const held=[];globalThis.fetch=async()=>{sends++;return new Promise(resolve=>held.push(()=>resolve(Response.json({amount:1000,cellVersion:3}))));};
 const first=app.request('/api/v1/universe');await pause();const command=app.request('/api/v1/groups/g/financial-cells',{method:'POST',body:'{}'});const later=app.request('/api/v1/universe');const f1=app.request('/api/v1/groups/g/ledger'),f2=app.request('/api/v1/groups/g/ledger');await pause();assert.equal(sends,5);held.forEach(resolve=>resolve());const results=await Promise.all([first,command,later,f1,f2]);assert.equal(results[3].cellVersion,3);assert.equal(results[4].amount,1000);
}));
test('Mirror preserves the real Worker Ledger, receipt, duplicate key and versions while removing five secondary HTTP reads',()=>globals(async()=>{
 const reports=[];
 for(const enabled of [false,true]){
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
   let cookie='',observed=false,reads=0,writes=0;
   const direct=async(path,method='GET',body)=>{
    const response=await worker.fetch(new Request('https://mirror.test'+path,{method,headers:{'content-type':'application/json',origin:'https://mirror.test',...(cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)}),{DB:db});
    assert.ok(response.ok,await response.clone().text());return response;
   };
   const registration=await direct('/api/v1/auth/register','POST',{username:'mirror_manager',password:'Synthetic-mirror-password-2026!',displayName:'Synthetic Mirror'});cookie=registration.headers.get('set-cookie').split(';')[0];const account=(await registration.json()).account;
   const project=await(await direct('/api/v1/group-projects','POST',{name:'Synthetic Mirror Group',memberCount:1,sessions:2,nominalContribution:1000})).json(),group=await(await direct('/api/v1/group-projects/'+project.id+'/convert','POST',{})).json(),members=await(await direct('/api/v1/groups/'+group.id+'/members')).json();
   const app=new ConnectedApplication({baseUrl:'https://mirror.test',actorId:account.id,tenantId:account.tenantId});app.activeGroupId=group.id;app.setSecondaryReadCoalescing(enabled);app.startRequestMeasurement(1);
   globalThis.fetch=async(url,init={})=>{await pause();const method=init.method??'GET';if(observed){if(method==='GET')reads++;else writes++;}const headers=new Headers(init.headers);headers.set('cookie',cookie);headers.set('origin','https://mirror.test');return worker.fetch(new Request(url,{...init,headers}),{DB:db});};
   observed=true;const secondary=await Promise.all(Array.from({length:6},()=>app.listWorkspaceRecords('MEETING.COMMAND_CENTER')));
   const input={membershipId:members[0].id,amount:1000,idempotencyKey:'mirror-cash-once'},path='/api/v1/groups/'+group.id+'/contributions/cash';
   const first=await app.request(path,{method:'POST',body:JSON.stringify(input)}),duplicate=await app.request(path,{method:'POST',body:JSON.stringify(input)}),ledger=await app.request('/api/v1/groups/'+group.id+'/ledger');
   assert.equal(first.id,duplicate.id);assert.equal(ledger.receipts.length,1);assert.equal(ledger.summary.cashBalance,1000);assert.equal(ledger.summary.entryCount,1);
   const beforeIdle=reads+writes;await pause();await pause();assert.equal(reads+writes,beforeIdle);
   reports.push({schema:'ECO_EFFECT_MIRROR_V1',scenario:'real-worker-secondary-reads-and-idempotent-cash',commandsSha256:createHash('sha256').update('6*workspace;cash1000:key-mirror-cash-once;cash1000:key-mirror-cash-once;ledger;idle').digest('hex'),effects:{secondaryCounts:secondary.map(x=>x.length),receiptAmounts:[first.amount,duplicate.amount],idempotencyKeys:[first.idempotencyKey,duplicate.idempotencyKey],duplicateReturnedSameReceipt:first.id===duplicate.id,ledgerSummary:ledger.summary,receiptCount:ledger.receipts.length,cellVersions:(ledger.cellRevisions??[]).map(r=>r.version)},metrics:{networkRequests:reads+writes,reads,writes,idleRequests:0}});
  }finally{db.db.close();}
 }
 const compared=compareLotEffects(...reports);assert.equal(compared.pass,true);assert.equal(compared.savedRequests,5);assert.equal(reports[0].metrics.writes,2);assert.equal(reports[1].metrics.writes,2);
 await mkdir('artifacts',{recursive:true});await Promise.all(reports.map((r,i)=>writeFile('artifacts/lot28-finance-mirror-'+(i?'after':'before')+'.json',JSON.stringify(r,null,2))));
}));
test('actor, group, locale and explicit request options do not share pending secondary reads',()=>globals(async()=>{
 const app=new ConnectedApplication(options);let sends=0;const held=[];globalThis.fetch=async()=>{sends++;return new Promise(resolve=>held.push(()=>resolve(Response.json([]))));};
 const work=[app.listWorkspaceRecords()];app.actorId='other-account';work.push(app.listWorkspaceRecords());app.activeGroupId='other-group';work.push(app.listWorkspaceRecords());app.setLocale('en');work.push(app.listWorkspaceRecords());work.push(app.request('/api/v1/workspaces?',{headers:{accept:'application/json'}}));await pause();assert.equal(sends,5);held.forEach(resolve=>resolve());await Promise.all(work);
}));
test('a shared secondary failure is reported to each consumer, then a genuine retry remains available',()=>globals(async()=>{
 const app=new ConnectedApplication(options);let sends=0;globalThis.fetch=async()=>{sends++;await pause();return Response.json({error:'SYNTHETIC_UNAVAILABLE'},{status:400});};
 const failed=await Promise.allSettled(Array.from({length:3},()=>app.listWorkspaceRecords()));assert.equal(sends,1);assert.ok(failed.every(r=>r.status==='rejected'&&r.reason.message==='SYNTHETIC_UNAVAILABLE'));
 globalThis.fetch=async()=>{sends++;return Response.json([]);};assert.deepEqual(await app.listWorkspaceRecords(),[]);assert.equal(sends,2);
}));
test('Mirror rejects missing evidence, different commands, changed financial effects or savings obtained by dropping writes',()=>{
 const a={schema:'ECO_EFFECT_MIRROR_V1',scenario:'financial-target',commandsSha256:'a'.repeat(64),effects:{amount:1000,cellVersion:2,status:'CONFIRMED',idempotencyKeys:['same-key'],order:['LOCAL_PENDING','CONFIRMED']},metrics:{networkRequests:7,reads:5,writes:2,idleRequests:0}},b=structuredClone(a);b.metrics.networkRequests=6;b.metrics.reads=4;assert.equal(compareLotEffects(a,b).pass,true);
 for(const mutate of [v=>v.effects.amount=999,v=>v.effects.cellVersion=3,v=>v.effects.order.reverse(),v=>{v.metrics.writes--;v.metrics.reads++;}]){const changed=structuredClone(b);mutate(changed);assert.equal(compareLotEffects(a,changed).pass,false);}
 assert.throws(()=>compareLotEffects(a,{}),/INCOMPLETE/);assert.throws(()=>compareLotEffects(a,{...b,commandsSha256:'b'.repeat(64)}),/DIFFERENT/);
});
test('ECO-LOCK requires an external signature over the exact SHA, impact, paths and expiry; the verifier cannot grant approval',()=>{
 const keys=generateKeyPairSync('ed25519'),publicKey=keys.publicKey.export({type:'spki',format:'pem'}),now=Date.parse('2026-10-20T12:00:00Z'),expected={repository:'synthetic/project',baseSha:'a'.repeat(40),headSha:'b'.repeat(40),rollbackSha:'a'.repeat(40),impactSha256:'c'.repeat(64),paths:['apps/web/src/example.js']},payload={schema:'ECO_LOCK_APPROVAL_V1',humanSigner:'SYNTHETIC TEST ONLY',issuedAt:'2026-10-20T11:00:00Z',expiresAt:'2026-10-20T13:00:00Z',...expected},envelope={payload,signature:sign(null,Buffer.from(canonicalApproval(payload)),keys.privateKey).toString('base64')};
 assert.equal(verifyEcoLockApproval(envelope,publicKey,expected,now).verified,true);
 assert.throws(()=>verifyEcoLockApproval({...envelope,payload:{...payload,headSha:'d'.repeat(40)}},publicKey,expected,now),/BAD_SIGNATURE/);
 assert.throws(()=>verifyEcoLockApproval(envelope,publicKey,{...expected,headSha:'d'.repeat(40)},now),/SCOPE_MISMATCH/);
 assert.throws(()=>verifyEcoLockApproval(envelope,publicKey,{...expected,paths:['workers/api/src/index.ts']},now),/SCOPE_MISMATCH/);
 assert.throws(()=>verifyEcoLockApproval(envelope,publicKey,expected,now+7200000),/EXPIRED/);
 const wrong=generateKeyPairSync('ed25519').publicKey.export({type:'spki',format:'pem'});assert.throws(()=>verifyEcoLockApproval(envelope,wrong,expected,now),/BAD_SIGNATURE/);
});
