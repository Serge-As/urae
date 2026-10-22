import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository,D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {TrustVerificationService} from '../.build/packages/trust/src/index.js';
import {GovernanceVoteService} from '../.build/packages/governance-vote/src/index.js';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {createApiHandler} from '../.build/workers/api/src/index.js';

async function setup(sql=false){
 const db=sql?new SQLiteD1(':memory:'):null;if(db)db.migrate();const repo=db?new D1PlatformRepository(db):new InMemoryPlatformRepository(),at=new Date().toISOString();
 await repo.saveGroup({id:'g',tenantId:'t',name:'Synthetic governance',kind:'association',governanceModel:'community',createdBy:'owner',status:'active',createdAt:at});
 for(const actor of ['owner','alice','bob']){await repo.saveUser({id:actor,displayName:actor,locale:'fr',createdAt:at});await repo.saveMembership({id:'m_'+actor,tenantId:'t',groupId:'g',userId:actor,roles:[actor==='owner'?'founder':'member'],status:'active',joinedAt:at});}
 const kernel=(actor,tenant='t')=>{const k=new PlatformKernel();k.context.set({actorId:actor,tenantId:tenant,activeGroupId:'g',groupRoles:['founder'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'test'});return k;};
 let clock=Date.now();const verification=(actor,tenant)=>new TrustVerificationService(repo,kernel(actor,tenant),()=>clock),votes=actor=>new GovernanceVoteService(repo,kernel(actor),'synthetic-stable-secret'),expiry=new Date(clock+86400000).toISOString();
 const input=(key='assertion_0001')=>({membershipId:'m_alice',kind:'IDENTITY_DOCUMENT_SEEN',statement:'A specific document was examined, no identity guarantee',scope:'Group g only',evidenceRef:'private_file_reference',expiresAt:expiry,idempotencyKey:key});
 const handle=createApiHandler(repo),send=async(actor,path,method='GET',body)=>{const r=await handle(new Request('https://synthetic.test'+path,{method,headers:{'content-type':'application/json','x-actor-id':actor,'x-tenant-id':'t','x-active-group-id':'g'},body:body===undefined?undefined:JSON.stringify(body)}));return{status:r.status,body:await r.json()};};
 return{repo,db,kernel,verification,votes,input,expiry,send,advance:n=>clock+=n};
}
for(const sql of [false,true]){const engine=sql?'SQLite/D1':'memory';
 test(engine+' assertions preserve one immutable fact on retry; declared stock grants no reviewed identity',async()=>{
  const f=await setup(sql),v=f.verification('owner'),r=await v.issue('g',f.input());const retry=await Promise.all(Array.from({length:4},()=>v.issue('g',f.input())));assert.ok(retry.every(x=>x.id===r.id));
  await assert.rejects(()=>v.issue('g',{...f.input(),scope:'changed'}),/GOVERNED_RECORD_CONFLICT/);
  await assert.rejects(()=>f.verification('alice').issue('g',f.input('illegal_review')),/FORBIDDEN_SCOPE/);
  const stock=await f.verification('alice').issue('g',{...f.input('declared_stock'),kind:'STOCK_DECLARED',evidenceRef:''});assert.equal(stock.data.assurance,'DECLARED');assert.equal(r.data.assurance,'DOCUMENTED_REVIEW');
  assert.equal((await f.verification('alice').list('g')).length,2);assert.equal((await f.verification('bob').list('g')).length,0);await assert.rejects(()=>f.verification('stranger').list('g'),/FORBIDDEN_SCOPE/);await assert.rejects(()=>f.verification('owner','other_tenant').list('g'),/GROUP_NOT_FOUND/);
  assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);assert.deepEqual((await f.repo.getMembership('t','g','m_alice')).roles,['member']);
 });
 test(engine+' selective card only reveals chosen summary, is revoked online and cannot access private evidence',async()=>{
  const f=await setup(sql),r=await f.verification('owner').issue('g',f.input());await assert.rejects(()=>f.verification('owner').share('g',r.id,{summary:'not chosen by subject',expiresAt:f.expiry,idempotencyKey:'manager_share'}),/FORBIDDEN_SCOPE/);
  const v=f.verification('alice'),card=await v.share('g',r.id,{summary:'Document consulted in a limited group review',expiresAt:f.expiry,idempotencyKey:'share_00001'}),publicView=await f.verification('outsider','other_tenant').verify(card.token);
  assert.equal(publicView.valid,true);assert.equal(publicView.commercialGuarantee,false);assert.equal(publicView.permissionGranted,false);assert.equal(publicView.privateEvidenceIncluded,false);assert.ok(!JSON.stringify(publicView).includes('private_file_reference'));assert.ok(!JSON.stringify(publicView).includes('m_alice'));assert.ok(!JSON.stringify(await f.repo.listWorkspaceRecords('t','TRUST.VERIFICATION','g')).includes(card.token));
  assert.equal((await v.verify(card.token+'x')).valid,false);await v.revokeShare('g',r.id,card.id,'revoke_share_0001');assert.equal((await v.verify(card.token)).state,'SHARE_REVOKED');assert.equal((await v.list('g'))[0].state,'ACTIVE');
 });
 test(engine+' suspension, contest, replacement, expiry and concurrent revocation never silently reactivate a fact',async()=>{
  const f=await setup(sql),manager=f.verification('owner'),subject=f.verification('alice'),r=await manager.issue('g',f.input()),card=await subject.share('g',r.id,{summary:'Limited card',expiresAt:f.expiry,idempotencyKey:'share_00002'});
  await subject.act('g',r.id,{action:'CONTEST',reason:'Wrong scope',idempotencyKey:'contest_0001'});assert.equal((await manager.verify(card.token)).state,'CONTESTED');await manager.act('g',r.id,{action:'REVIEW',reason:'Review recorded, new assertion needed',idempotencyKey:'review_00001'});assert.equal((await manager.verify(card.token)).valid,false);
  await Promise.all([subject.act('g',r.id,{action:'REVOKE',reason:'Withdraw fact',idempotencyKey:'revoke_00001'}),manager.act('g',r.id,{action:'SUSPEND',reason:'Concurrent review',idempotencyKey:'suspend_0001'})]);assert.equal((await manager.verify(card.token)).state,'REVOKED');
  const next=await manager.issue('g',{...f.input('replacement_1'),replacesAssertionId:r.id});assert.equal((await manager.list('g')).find(x=>x.record.id===r.id).state,'REVOKED');const nextCard=await subject.share('g',next.id,{summary:'Replacement summary',expiresAt:f.expiry,idempotencyKey:'share_00003'});assert.equal((await subject.verify(nextCard.token)).valid,true);f.advance(86400001);assert.equal((await subject.verify(nextCard.token)).valid,false);
 });
 test(engine+' withdrawal of current affiliation invalidates new checks without destroying the dated fact',async()=>{
  const f=await setup(sql),r=await f.verification('owner').issue('g',f.input()),v=f.verification('alice'),card=await v.share('g',r.id,{summary:'Limited affiliation',expiresAt:f.expiry,idempotencyKey:'share_00004'}),member=await f.repo.getMembership('t','g','m_alice');await f.repo.saveMembership({...member,status:'inactive'});assert.equal((await v.verify(card.token)).state,'SUBJECT_INACTIVE');assert.ok(await f.repo.getWorkspaceRecord('t',r.id));
 });
 test(engine+' a closed adopted poll assigns work, records report and review; canonical finance stays untouched',async()=>{
  const f=await setup(sql),owner=f.votes('owner'),poll=await owner.open('g',{title:'Limited expenditure',question:'Authorize a ceiling, not payment',options:[],mode:'SECRET',kind:'YES_NO',quorumBps:5000,majority:'SIMPLE',rulesVersion:'rules_v3',discussionRef:'minutes_1',evidenceRefs:['private_evidence']});
  await owner.cast('g',poll.id,['OUI']);await f.votes('alice').cast('g',poll.id,['OUI']);await assert.rejects(()=>owner.planExecution('g',poll.id,{title:'Execute',assigneeUserId:'alice',effectOwner:'FINANCE',idempotencyKey:'plan_before'}),/ADOPTED_DECISION_REQUIRED/);await owner.close('g',poll.id);
  const input={title:'Prepare canonical payment request',assigneeUserId:'alice',effectOwner:'FINANCE',idempotencyKey:'plan_000001'},task=await owner.planExecution('g',poll.id,input);assert.equal((await owner.planExecution('g',poll.id,input)).id,task.id);assert.equal(task.data.rulesVersion,'rules_v3');assert.equal((await owner.tally('g',poll.id)).poll.discussionRef,'minutes_1');
  await assert.rejects(()=>f.votes('bob').actOnExecution('g',task.id,{action:'START',note:'Not assigned',idempotencyKey:'start_wrong'}),/FORBIDDEN_SCOPE/);
  const assigned=f.votes('alice');await assigned.actOnExecution('g',task.id,{action:'START',note:'Preparation',idempotencyKey:'start_00001'});await assert.rejects(()=>assigned.actOnExecution('g',task.id,{action:'REPORT',note:'No evidence',idempotencyKey:'report_missing'}),/EVIDENCE_REQUIRED/);
  await assigned.actOnExecution('g',task.id,{action:'REPORT',note:'Canonical command requested, not confirmed',evidenceRef:'command_ref_1',idempotencyKey:'report_00001'});assert.equal((await owner.execution('g'))[0].state,'EFFECT_REPORTED');
  await assert.rejects(()=>assigned.actOnExecution('g',task.id,{action:'REVIEW',note:'Self approval',evidenceRef:'command_ref_1',idempotencyKey:'review_wrong'}),/FORBIDDEN_SCOPE/);
  const review={action:'REVIEW',note:'Evidence examined, actual owner remains authoritative',evidenceRef:'command_ref_1',idempotencyKey:'review_00002'};await owner.actOnExecution('g',task.id,review);await owner.actOnExecution('g',task.id,review);const view=(await owner.execution('g'))[0];assert.equal(view.state,'EVIDENCE_REVIEWED');assert.equal(view.canonicalEffect,'NOT_INFERRED');assert.equal(view.events.filter(x=>x.data.kind==='REVIEW').length,1);assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);assert.deepEqual((await f.repo.getMembership('t','g','m_alice')).roles,['member']);
 });
 test(engine+' repeated concurrent votes count once, cancelled and no quorum decisions cannot create execution tasks',async()=>{
  const f=await setup(sql),v=f.votes('owner'),input={title:'Vote',question:'Synthetic question',options:[],mode:'NAMED',kind:'YES_NO',quorumBps:10000,majority:'SIMPLE'},p=await v.open('g',input),attempts=await Promise.allSettled(Array.from({length:8},()=>v.cast('g',p.id,['OUI'])));assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal((await v.tally('g',p.id)).castCount,1);await v.close('g',p.id);assert.equal((await v.tally('g',p.id)).resolution,'NO_QUORUM');await assert.rejects(()=>v.planExecution('g',p.id,{title:'Forbidden',assigneeUserId:'alice',effectOwner:'FINANCE',idempotencyKey:'no_quorum_1'}),/ADOPTED_DECISION_REQUIRED/);
  const cancelled=await v.open('g',{...input,quorumBps:0});await v.cast('g',cancelled.id,['OUI']);await v.close('g',cancelled.id,'CANCELLED');assert.equal((await v.tally('g',cancelled.id)).resolution,'CANCELLED');
 });
 test(engine+' specialized API rejects generic writes and hides private governed facts from workspace listings',async()=>{
  const f=await setup(sql),r=await f.verification('owner').issue('g',f.input());assert.equal((await f.send('owner','/api/v1/groups/g/verification/assertions')).body.items.length,1);assert.equal((await f.send('bob','/api/v1/groups/g/verification/assertions')).body.items.length,0);
  assert.equal((await f.send('owner','/api/v1/workspaces?moduleId=TRUST.VERIFICATION&groupId=g')).body.length,0);assert.equal((await f.send('owner','/api/v1/workspaces/'+r.id,'PUT',{title:'Forged fact'})).status,403);assert.equal((await f.send('owner','/api/v1/workspaces','POST',{moduleId:'TRUST.VERIFICATION',groupId:'g',title:'Forged fact',tags:['verification-fact'],data:{kind:'ASSERTION'}})).status,403);assert.equal((await f.send('alice','/api/v1/groups/g/verification/assertions','POST',f.input('api_forbidden'))).status,403);
 });
}
