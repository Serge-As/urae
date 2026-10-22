import test from 'node:test';
import assert from 'node:assert/strict';
import {InMemoryPlatformRepository,D1PlatformRepository} from '../.build/packages/repositories/src/index.js';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {createApiHandler} from '../.build/workers/api/src/index.js';
import {CommunityRealtimeStore} from '../.build/packages/community-realtime/src/index.js';
const at='2026-10-01T08:00:00Z',future=days=>new Date(Date.now()+days*86400000).toISOString();
async function fixture(sql){
 const db=sql?new SQLiteD1(':memory:'):null;if(db)db.migrate();const repo=db?new D1PlatformRepository(db):new InMemoryPlatformRepository();
 await repo.saveGroup({id:'g',tenantId:'t',name:'Synthetic productive group',kind:'association',governanceModel:'founder_managed',createdBy:'owner',status:'active',createdAt:at});
 for(const user of ['owner','alice','bob','outsider']){await repo.saveUser({id:user,displayName:'Synthetic '+user,locale:'fr',createdAt:at});if(user!=='outsider')await repo.saveMembership({id:'m_'+user,tenantId:'t',groupId:'g',userId:user,roles:[user==='owner'?'founder':'member'],status:'active',joinedAt:at});}
 const realtime=db?new CommunityRealtimeStore(db):undefined,handler=createApiHandler(repo,{communityRealtime:realtime});
 const send=async(path,method='GET',body,actor='owner')=>{const r=await handler(new Request('https://synthetic.test/api/v1/'+path,{method,headers:{'content-type':'application/json','x-tenant-id':'t','x-actor-id':actor,'x-active-group-id':'g'},body:body===undefined?undefined:JSON.stringify(body)}));return{status:r.status,body:await r.json()};};
 const ok=async(...args)=>{const r=await send(...args);assert.ok(r.status===200||r.status===201,JSON.stringify(r));return r.body;};
 const practice=async()=>ok('academy/practices','POST',{title:'Reconcile a synthetic record',criteria:['Compare source entries','Document the observed difference'],mentorId:'bob',consent:true},'alice');
 const job=async(groupId)=>ok('business-studio/jobs','POST',{title:'Synthetic paid mission',kind:'SERVICE',description:'Prepare an accessible report',criteria:['Explain one calculation'],conditions:'Remote, declared two hours, no advance recruitment charge',compensation:'Declared 5000 XAF on accepted delivery',locality:'Remote',deadline:future(7),slots:[future(2)],consent:true,groupId});
 return{repo,db,realtime,send,ok,practice,job};
}
for(const sql of [false,true]){const prefix=sql?'SQLite/D1':'memory';
 test(prefix+' practice requires independent current review, retains exact evidence version, supports motivated revocation and hides withdrawn evidence',async()=>{
  const f=await fixture(sql),p=await f.practice(),route='academy/practices/'+p.id+'/commands';assert.equal(p.badge.valid,false);
  assert.equal((await f.send('academy/practices/'+p.id,'GET',undefined,'owner')).status,404);
  const sub=await f.ok(route,'POST',{action:'SUBMIT',expectedVersion:p.version,deliverable:'PRIVATE-PRACTICE: compared exact entries and recorded one difference'},'alice');
  const pending=await f.ok('academy/practices/'+p.id,'GET',undefined,'bob');assert.equal(pending.deliverable,'');assert.equal(pending.reviewToken,null);
  const mentor=await f.ok(route,'POST',{action:'ACCEPT_MENTOR',expectedVersion:sub.version},'bob');assert.match(mentor.deliverable,/PRIVATE-PRACTICE/);
  assert.equal((await f.send(route,'POST',{action:'REVIEW',expectedVersion:mentor.version,reviewToken:mentor.reviewToken,decision:'VALIDATED',note:'I reviewed the listed criteria'},'alice')).body.error,'PRACTICE_INDEPENDENT_REVIEW_REQUIRED');
  assert.equal((await f.send(route,'POST',{action:'REVIEW',expectedVersion:mentor.version,reviewToken:'unread',decision:'VALIDATED',note:'Review reason'},'bob')).body.error,'PRACTICE_DELIVERABLE_NOT_REVIEWED');
  const review=await f.ok(route,'POST',{action:'REVIEW',expectedVersion:mentor.version,reviewToken:mentor.reviewToken,decision:'VALIDATED',note:'Compared each criterion against the submitted output'},'bob');assert.equal(review.badge.valid,true);assert.equal(review.badge.evidenceRevision,1);assert.equal(review.badge.grantsPermission,false);
  assert.equal((await f.send(route,'POST',{action:'REVOKE',expectedVersion:review.version,note:''},'bob')).body.error,'PRACTICE_REVOCATION_REASON_REQUIRED');
  const revoked=await f.ok(route,'POST',{action:'REVOKE',expectedVersion:review.version,note:'A source was found incomplete'},'bob');assert.equal(revoked.badge.valid,false);
  const appeal=await f.ok(route,'POST',{action:'APPEAL',expectedVersion:revoked.version,note:'Please inspect the additional source'},'alice');assert.equal(appeal.state,'APPEALED');assert.equal(appeal.badge.valid,false);
   const resolved=await f.ok(route,'POST',{action:'RESOLVE_APPEAL',expectedVersion:appeal.version,note:'The new source can be submitted for a second examination'},'bob');assert.equal(resolved.state,'CORRECTION_REQUIRED');
   const second=await f.ok(route,'POST',{action:'SUBMIT',expectedVersion:resolved.version,deliverable:'SECOND-PRIVATE-VERSION with the additional source'},'alice');assert.equal(second.submissions.length,2);assert.match(second.submissions[0].deliverable,/PRIVATE-PRACTICE/);assert.equal(second.badge.valid,false);assert.equal(second.reviews.length,4);
   assert.equal((await f.send(route,'POST',{action:'REVIEW',expectedVersion:second.version,reviewToken:mentor.reviewToken,decision:'VALIDATED',note:'Stale first revision'},'bob')).body.error,'PRACTICE_DELIVERABLE_NOT_REVIEWED');
   await f.ok(route,'POST',{action:'WITHDRAW',expectedVersion:second.version},'alice');const withdrawn=await f.ok('academy/practices/'+p.id,'GET',undefined,'bob');assert.equal(withdrawn.deliverable,'');assert.equal(withdrawn.reviewNote,null);assert.deepEqual(withdrawn.events,[]);assert.deepEqual(withdrawn.submissions,[]);assert.deepEqual(withdrawn.reviews,[]);
  assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);assert.equal((await f.repo.listMemberships('t','g')).find(m=>m.userId==='alice').roles[0],'member');
 });
 test(prefix+' notebooks reveal only explicitly shared fields, recheck group membership, reject stale saves and remove withdrawn search matches',async()=>{
  const f=await fixture(sql),input={expectedVersion:0,fields:[{kind:'SKILL',value:'sewing professional',visibility:'GROUP',groupIds:['g']},{kind:'NEED',value:'PRIVATE-HEALTH-NOTE sewing',visibility:'PRIVATE'},{kind:'REALIZATION',value:'PRIVATE-FINANCE-NOTE',visibility:'PRIVATE'}]};
  const n=await f.ok('discovery/notebook','PUT',input,'alice');assert.equal(n.fields.length,3);const preview=await f.ok('discovery/notebook/preview','POST',{audience:'GROUP',groupId:'g'},'alice');assert.deepEqual(preview.fields.map(x=>x.value),['sewing professional']);
  const matches=await f.ok('groups/g/notebooks?q=sewing','GET',undefined,'bob');assert.equal(matches.items.length,1);assert.ok(!JSON.stringify(matches).includes('PRIVATE-'));assert.equal((await f.send('groups/g/notebooks?q=sewing','GET',undefined,'outsider')).status,403);
  assert.equal((await f.send('discovery/notebook','PUT',input,'alice')).body.error,'NOTEBOOK_VERSION_CONFLICT');
  const saved=await f.ok('discovery/notebook','PUT',{expectedVersion:n.version,fields:n.fields.map(x=>({...x,visibility:'PRIVATE',groupIds:[]}))},'alice');assert.equal(saved.version,2);assert.equal((await f.ok('groups/g/notebooks?q=sewing','GET',undefined,'bob')).items.length,0);
  await f.ok('discovery/notebook','PUT',{expectedVersion:2,fields:input.fields},'alice');const m=await f.repo.getMembership('t','g','m_alice');await f.repo.saveMembership({...m,status:'left'});assert.equal((await f.ok('groups/g/notebooks?q=sewing','GET',undefined,'bob')).items.length,0);
 });
 test(prefix+' forum solution is proposed privately, independently reviewed and invalidated on source moderation; generic knowledge review cannot bypass source checks',async()=>{
  const f=await fixture(sql),hub=await f.ok('groups/g/community/hubs','POST',{title:'Synthetic source Hub'}),post=await f.ok('groups/g/community/hubs/'+hub.id+'/posts','POST',{body:'A source method explaining how to reconcile records',kind:'DISCUSSION',title:'Synthetic source'});
  const solution=await f.ok('groups/g/forum-solutions','POST',{hubId:hub.id,title:'Repeatable reconciliation',method:'Compare the canonical references one by one',conditions:'Only when both sources are available',result:'One verified discrepancy, reported without rewriting entries',sources:[{id:post.id,engine:'LEGACY'}],consent:true},'alice');
  assert.equal((await f.ok('groups/g/forum-solutions','GET',undefined,'bob')).items.length,0);assert.equal((await f.send('forum-solutions/'+solution.id+'/review','POST',{expectedVersion:1,sourceToken:solution.sourceToken,accepted:true,note:'review'},'alice')).body.error,'SOLUTION_INDEPENDENT_REVIEW_REQUIRED');
  const forReview=(await f.ok('groups/g/forum-solutions')).items[0];const reviewed=await f.ok('forum-solutions/'+solution.id+'/review','POST',{expectedVersion:forReview.version,sourceToken:forReview.sourceToken,accepted:true,note:'Compared the method, conditions and observed output against the source'});assert.equal(reviewed.state,'VALIDATED');assert.equal((await f.ok('groups/g/forum-solutions','GET',undefined,'bob')).items[0].method,solution.method);
  assert.equal((await f.send('knowledge/'+solution.id+'/review','POST',{state:'VALIDATED'})).body.error,'CANONICAL_SOLUTION_ROUTE_REQUIRED');
  const p=await f.repo.getWorkspaceRecord('t',post.id);await f.repo.saveWorkspaceRecord({...p,data:{...p.data,moderationState:'HIDDEN',version:2}});const stale=(await f.ok('groups/g/forum-solutions','GET',undefined,'bob')).items[0];assert.equal(stale.state,'NEEDS_REVIEW');assert.equal(stale.method,'');assert.equal(stale.result,'');assert.equal(stale.sourceToken,null);assert.equal((await f.ok('knowledge?groupId=g')).items.some(x=>x.id===solution.id),false);assert.equal((await f.send('groups/g/forum-solutions','GET',undefined,'outsider')).status,403);
 });
 test(prefix+' job applications and appointments use one CAS aggregate, keep each candidate private and never produce financial entries',async()=>{
  const f=await fixture(sql),draft=await f.job();assert.equal((await f.ok('business-studio/jobs','GET',undefined,'bob')).items.length,0);const job=await f.ok('business-studio/jobs/'+draft.id+'/commands','POST',{action:'PUBLISH',expectedVersion:draft.version}),route='business-studio/jobs/'+job.id+'/commands';
  const a=await f.ok(route,'POST',{action:'APPLY',expectedVersion:job.version,message:'PRIVATE-ALICE-APPLICATION'},'alice'),b=await f.ok(route,'POST',{action:'APPLY',expectedVersion:a.version,message:'PRIVATE-BOB-APPLICATION'},'bob');
  const own=await f.ok('business-studio/jobs/'+job.id,'GET',undefined,'alice');assert.equal(own.applications.length,1);assert.ok(!JSON.stringify(own).includes('PRIVATE-BOB'));const outsider=await f.ok('business-studio/jobs/'+job.id,'GET',undefined,'outsider');assert.deepEqual(outsider.applications,[]);assert.ok(!JSON.stringify(outsider).includes('PRIVATE-ALICE'));
  const again=await f.ok(route,'POST',{action:'APPLY',expectedVersion:job.version,message:'duplicate retry'},'alice');assert.equal(again.applications[0].id,a.applications[0].id);
  const slot=b.slots[0],attempts=await Promise.all([f.send(route,'POST',{action:'BOOK',expectedVersion:b.version,slotId:slot.id},'alice'),f.send(route,'POST',{action:'BOOK',expectedVersion:b.version,slotId:slot.id},'bob')]);assert.equal(attempts.filter(x=>x.status===200).length,1);
  const current=await f.ok('business-studio/jobs/'+job.id);assert.equal(current.applications.length,2);assert.equal(current.slots.filter(s=>s.applicationId).length,1);assert.equal(current.paymentCreated,false);assert.equal(current.recruitmentFee,0);assert.equal((await f.repo.listLedgerEntries('t','g')).length,0);
  const closed=await f.ok(route,'POST',{action:'CLOSE',expectedVersion:current.version});assert.equal((await f.send(route,'POST',{action:'APPLY',expectedVersion:closed.version,message:'Late application'},'outsider')).body.error,'JOB_NOT_ACCEPTING_APPLICATIONS');
 });
 test(prefix+' private productive records cannot be listed or rewritten through generic workspaces and a group job checks membership',async()=>{
  const f=await fixture(sql),p=await f.practice(),job=await f.job('g');await f.ok('business-studio/jobs/'+job.id+'/commands','POST',{action:'PUBLISH',expectedVersion:job.version});assert.equal((await f.send('business-studio/jobs/'+job.id,'GET',undefined,'outsider')).status,404);
  for(const actor of ['owner','alice']){const all=await f.ok('workspaces','GET',undefined,actor);assert.equal(all.some(x=>[p.id,job.id].includes(x.id)),false);}
  const rewritten=await f.send('workspaces/'+p.id,'PUT',{data:{kind:'PRACTICE_ATTEMPT',state:'VALIDATED'}});assert.equal(rewritten.body.error,'CANONICAL_PRODUCTIVE_ROUTE_REQUIRED');
  const forged=await f.send('workspaces','POST',{moduleId:'LEARNING.MANAGER_ACADEMY',title:'Fake validation',data:{kind:'PRACTICE_ATTEMPT',state:'VALIDATED'}});assert.equal(forged.body.error,'CANONICAL_PRODUCTIVE_ROUTE_REQUIRED');
  const bypass=await f.send('business-studio/clients/'+job.id+'/state','POST',{state:'CLOSED'});assert.ok(bypass.status>=400);assert.equal((await f.ok('business-studio/jobs/'+job.id)).state,'PUBLISHED');
 });
}
test('SQLite/D1 live forum sources are loaded by exact group and hub; an edited source cannot retain a validated solution',async()=>{
 const f=await fixture(true),hub=await f.ok('groups/g/community/hubs','POST',{title:'Synthetic live Hub'}),message=await f.realtime.createMessage({tenantId:'t',groupId:'g',hubId:hub.id,authorId:'owner',body:'Original live source'});
 const s=await f.ok('groups/g/forum-solutions','POST',{hubId:hub.id,title:'Live solution',method:'Do one observed step',conditions:'Source available',result:'Observed completion',sources:[{id:message.id,engine:'LIVE'}],consent:true},'alice');
 await f.ok('forum-solutions/'+s.id+'/review','POST',{expectedVersion:s.version,sourceToken:s.sourceToken,accepted:true,note:'Reviewed current live source and outcome'});await f.db.prepare('UPDATE community_messages SET body=?,edited_at=? WHERE id=?').bind('Changed source',new Date().toISOString(),message.id).run();
 const v=(await f.ok('groups/g/forum-solutions','GET',undefined,'bob')).items[0];assert.equal(v.sourceCurrent,false);assert.equal(v.state,'NEEDS_REVIEW');assert.equal(v.method,'');assert.equal(await f.realtime.messageReference('other-tenant','g',hub.id,message.id),undefined);
});
