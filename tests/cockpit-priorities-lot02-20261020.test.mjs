import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourneyContext} from '../apps/web/src/journey-context.js';
import {buildCockpitPriorities,createCockpitPreferences,revalidateCockpitTarget} from '../apps/web/src/cockpit-priorities.js';
const storage=()=>{const values=new Map();return{values,getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};};
test('continuity passport stores bounded references only, preserves old views and isolates actor/group',()=>{
 const store=storage();let actor='a',group='g',time=1000;const journey=createJourneyContext({storage:store,scope:()=>({actor,group}),now:()=>time});
 for(let i=0;i<20;i++)journey.rememberReference({kind:'meeting',id:'meeting-'+i,view:'operations',title:'PRIVATE_TITLE',amount:1234,draft:'NEVER_STORE'});
 journey.visit('sessions');assert.equal(journey.references().length,16);assert.equal(journey.references()[0].id,'meeting-19');assert.deepEqual(journey.snapshot(),{enabled:true,recent:[{view:'sessions',at:1000}]});
 const raw=[...store.values.values()].join('');for(const forbidden of ['PRIVATE_TITLE','amount','1234','NEVER_STORE'])assert.ok(!raw.includes(forbidden));
 actor='b';assert.deepEqual(journey.references(),[]);actor='a';group='h';assert.deepEqual(journey.references(),[]);group='g';journey.forgetReference('meeting-19');assert.equal(journey.references().length,15);time=31*86400000;assert.deepEqual(journey.references(),[]);
});
test('memory OFF clears references and survives later navigation, invalid references and storage failure',()=>{
 const store=storage(),journey=createJourneyContext({storage:store,scope:()=>({actor:'a',group:'g'})});
 journey.rememberReference({kind:'meeting',id:'one',view:'sessions'});journey.setEnabled(false);assert.equal(journey.rememberReference({kind:'meeting',id:'two',view:'sessions'}),false);journey.visit('finance');assert.deepEqual(journey.snapshot(),{enabled:false,recent:[]});assert.deepEqual(journey.references(),[]);
 journey.setEnabled(true);for(const ref of [{kind:'loan',id:'one',view:'sessions'},{kind:'meeting',id:'<script>',view:'sessions'},{kind:'meeting',id:'x',view:'control'}])assert.equal(journey.rememberReference(ref),false);
 const broken=createJourneyContext({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},scope:()=>({actor:'a'})});assert.doesNotThrow(()=>broken.rememberReference({kind:'meeting',id:'x',view:'sessions'}));assert.deepEqual(broken.references(),[]);
});
test('priorities explain mandate, deadline and blockage and exclude foreign/closed objects without financial calculations',()=>{
 const model=buildCockpitPriorities({groupId:'g',manager:true,now:100000,meetings:[{id:'m',title:'Meeting',status:'open'},{id:'old',status:'closed'}],inbox:[{id:'task',title:'Due',dueAt:new Date(10).toISOString(),groupId:'g'},{id:'blocked',status:'BLOCKED'},{id:'secret',groupId:'other'},{id:'done',status:'DONE'}],notices:[{id:'n',status:'PENDING',amount:8000},{id:'confirmed',status:'CONFIRMED'}],memberId:'self',references:[{kind:'meeting',id:'m',view:'operations',at:100},{kind:'meeting',id:'old',view:'sessions',at:100}]});
 assert.equal(model.lanes.now[0].reason,'blocked');assert.equal(model.lanes.now[1].reason,'overdue');assert.equal(model.lanes.now[2].reason,'manage-meeting');assert.equal(model.lanes.resume[0].targetId,'m');assert.equal(model.lanes.watch[0].memberId,'self');assert.ok(!JSON.stringify(model).includes('8000'));assert.ok(!model.cards.some(x=>/secret|done|confirmed|old/.test(x.targetId)));
});
test('display choices are bounded, expiring, actor tenant group isolated, resettable and best effort',()=>{
 const store=storage();let context={actor:'a',tenant:'t',group:'g'},time=1000;const p=createCockpitPreferences({storage:store,scope:()=>context,now:()=>time});assert.equal(p.toggle('meeting:m','pinned'),true);assert.equal(p.toggle('meeting:m','hidden'),true);
 for(const c of [{actor:'b',tenant:'t',group:'g'},{actor:'a',tenant:'u',group:'g'},{actor:'a',tenant:'t',group:'h'}]){context=c;assert.deepEqual(p.snapshot().pinned,[]);}
 context={actor:'a',tenant:'t',group:'g'};assert.equal(p.snapshot().pinned[0].id,'meeting:m');time=31*86400000;assert.deepEqual(p.snapshot().hidden,[]);p.setEnabled(false);assert.equal(p.snapshot().enabled,false);p.reset();assert.equal(p.snapshot().enabled,true);
 const broken=createCockpitPreferences({storage:{getItem(){throw Error();},setItem(){throw Error();}},scope:()=>context});assert.equal(broken.toggle('meeting:m','pinned'),false);
});
test('partial sources stay independent and disabled presentation preferences ignore pins/hiding and recommendations',()=>{
 const common={meetings:[{id:'m',status:'open'}],inbox:null,notices:null,opportunities:[{id:'shop',kind:'shop-item',title:'Shop'}]};
 const on=buildCockpitPriorities({...common,preferences:{hidden:[{id:'meeting:m'}]}});assert.equal(on.hiddenCount,1);assert.equal(on.lanes.opportunities.length,1);
 const off=buildCockpitPriorities({...common,preferences:{enabled:false,hidden:[{id:'meeting:m'}]}});assert.equal(off.lanes.now.length,1);assert.equal(off.lanes.opportunities.length,0);assert.equal(off.hiddenCount,0);
});
function fixture(){
 let current={actor:'a',tenant:'t',group:'g'},metaPatch={},access={membership:{id:'self',status:'active'},isManager:false},meetings=[{id:'m',status:'open'}],inbox=[{id:'i',groupId:'g',status:'OPEN'}],notices=[{id:'n',status:'PENDING'}];const reads=[];
 const app={currentActor:()=>current.actor,currentTenant:()=>current.tenant,activeGroup:()=>current.group,groupMe:async()=>{reads.push('access');return access;},listMeetings:async()=>{reads.push('meetings');return meetings;},inboxItems:async()=>{reads.push('inbox');return inbox;},financialNotices:async()=>{reads.push('notices');return notices;},projectionMeta:async()=>({source:'SERVER',lastSyncedAt:new Date(2000).toISOString(),scope:{actorId:current.actor,tenantId:current.tenant,groupId:current.group},...metaPatch})};
 return{app,context:{...current},reads,patchMeta:x=>metaPatch=x,setAccess:x=>access=x,setMeetings:x=>meetings=x,setInbox:x=>inbox=x,setNotices:x=>notices=x,switchContext:x=>current=x};
}
const resume={kind:'resume',targetId:'m',groupRequired:true};
test('resume delegates access/existence to fresh canonical owners; closed and deleted meetings cannot reopen',async()=>{
 const f=fixture(),run=()=>revalidateCockpitTarget({app:f.app,context:f.context,card:resume,now:()=>1000});assert.equal((await run()).id,'m');assert.deepEqual(f.reads,['access','meetings']);f.setMeetings([{id:'m',status:'closed'}]);await assert.rejects(run,/TARGET_UNAVAILABLE/);f.setMeetings([]);await assert.rejects(run,/TARGET_UNAVAILABLE/);assert.ok(Object.keys(f.app).every(x=>!/(post|write|ledger|command)/i.test(x)));
});
test('cached permissions, revoked membership and foreign tenant metadata do not grant a resume',async()=>{
 const f=fixture(),run=()=>revalidateCockpitTarget({app:f.app,context:f.context,card:resume,now:()=>1000});
 f.patchMeta({lastSyncedAt:new Date(999).toISOString()});await assert.rejects(run,/VERIFICATION_UNAVAILABLE/);f.patchMeta({source:'LOCAL'});await assert.rejects(run,/VERIFICATION_UNAVAILABLE/);f.patchMeta({scope:{actorId:'a',tenantId:'foreign',groupId:'g'}});await assert.rejects(run,/VERIFICATION_UNAVAILABLE/);f.patchMeta({});f.setAccess({membership:{id:'self',status:'left'}});await assert.rejects(run,/TARGET_UNAVAILABLE/);
});
test('context switched during access verification cannot navigate with the prior result',async()=>{
 const f=fixture();f.app.groupMe=async()=>{f.switchContext({actor:'other',tenant:'t',group:'g'});return{isManager:true};};await assert.rejects(()=>revalidateCockpitTarget({app:f.app,context:f.context,card:resume,now:()=>1000}),/CONTEXT_CHANGED/);assert.deepEqual(f.reads,[]);
});
test('completed inbox actions and approved notices disappear after canonical revalidation',async()=>{
 const f=fixture();assert.equal(await revalidateCockpitTarget({app:f.app,context:f.context,card:{kind:'inbox',targetId:'i',groupRequired:true},now:()=>1000}),true);f.setInbox([{id:'i',status:'DONE'}]);await assert.rejects(()=>revalidateCockpitTarget({app:f.app,context:f.context,card:{kind:'inbox',targetId:'i',groupRequired:true},now:()=>1000}),/TARGET_UNAVAILABLE/);
 f.setNotices([{id:'n',status:'CONFIRMED'}]);await assert.rejects(()=>revalidateCockpitTarget({app:f.app,context:f.context,card:{kind:'notice',targetId:'n',memberId:'self',groupRequired:true},now:()=>1000}),/TARGET_UNAVAILABLE/);
});
