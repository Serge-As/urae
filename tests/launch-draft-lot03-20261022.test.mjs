import test from 'node:test';
import assert from 'node:assert/strict';
import {createLaunchDraftStore,findLaunchNameResemblances,assessLaunchSteps,LAUNCH_GUIDE_VERSION} from '../.build/apps/web/src/launch-draft.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),m};};
const make=()=>{const storage=memory(),identity={actor:'owner_A',tenant:'tenant_A'},store=createLaunchDraftStore({storage,scope:()=>identity,now:()=>1792627200000});return{storage,identity,store};};
test('a saved private draft remains isolated across both account and tenant changes',()=>{
 const {identity,store}=make();store.save({fields:{historyNote:{value:'synthetic private history'}}},0);identity.actor='owner_B';assert.equal(store.load(),null);identity.actor='owner_A';identity.tenant='tenant_B';assert.equal(store.load(),null);identity.tenant='tenant_A';assert.equal(store.load().payload.fields.historyNote.value,'synthetic private history');
});
test('stale draft revision refuses overwrite and retains the newer saved choices',()=>{
 const {store}=make();assert.equal(store.save({step:3},0),1);assert.equal(store.save({step:7},1),2);assert.throws(()=>store.save({step:1},1),/LAUNCH_DRAFT_CONFLICT/);assert.equal(store.load().payload.step,7);
});
test('blocked storage, oversized content and unknown guide version never pretend a successful save',()=>{
 const {store,storage}=make();store.save({step:2},0);assert.throws(()=>store.save({note:'x'.repeat(310*1024)},1),/TOO_LARGE/);assert.equal(store.load().revision,1);const k=[...storage.m.keys()][0];storage.setItem(k,JSON.stringify({schema:1,guideVersion:'unknown',payload:{}}));assert.throws(()=>store.load(),/VERSION/);const blocked=createLaunchDraftStore({storage:{getItem:()=>null,setItem:()=>{throw Error('storage blocked');}},scope:()=>({actor:'a',tenant:'t'})});assert.throws(()=>blocked.rememberCreation('project_1'),/storage blocked/);
});
test('pending canonical creation cannot be silently replaced; successful completion removes only its draft',()=>{
 const {store}=make();store.save({step:10},0);store.rememberCreation('project_1',{kitVersion:'1.5.1',name:'synthetic'});assert.throws(()=>store.rememberCreation('project_2',{}),/PENDING/);assert.throws(()=>store.acknowledgeCompleted(),/PENDING/);store.rememberCreation('project_1',{name:'changed after first confirmation'});assert.equal(store.pending().kit.name,'synthetic');store.completeCreation('group_1');assert.equal(store.load(),null);assert.equal(store.pending().projectId,'project_1');assert.equal(store.pending().completedGroupId,'group_1');store.markKitSaved('group_1');assert.equal(store.pending().kitSaved,true);store.acknowledgeCompleted();assert.equal(store.pending(),null);
});
test('a name resemblance is a review hint that preserves historical person and share references',()=>{
 const rows=[{key:'tontine_a',name:'A',participants:[{key:'historic_a',name:'André Serge',shares:[{key:'share_a'}]}]},{key:'tontine_b',name:'B',participants:[{key:'historic_b',name:'Andre   Serge',shares:[{key:'share_b'}]}]}],before=structuredClone(rows),matches=findLaunchNameResemblances(rows);assert.equal(matches.length,1);assert.deepEqual(matches[0].map(p=>p.personKey),['historic_a','historic_b']);assert.deepEqual(rows,before);assert.equal(typeof matches[0][0].mergedMembershipId,'undefined');
});
test('preparation status never adopts rules or grants a simulated feasibility pass',()=>{
 const fields=Object.fromEntries(Object.entries({launchOrigin:'NEW',projectName:'Synthetic',groupKind:'association',governanceModel:'community',cycleStartsAt:'2026-10-22',cycleCadence:'MONTHLY',cycleExpectedSessions:'0',expectedMembers:'-1',rosterMode:'PROGRESSIVE',projectLocale:'fr'}).map(([k,value])=>[k,{value}]));fields.channelInApp={checked:true};const r=assessLaunchSteps({fields});assert.equal(r.length,10);assert.equal(r[0].state,'COMPLETE');assert.equal(r[3].state,'INCONSISTENT');assert.equal(r[4].state,'INCONSISTENT');assert.equal(r[6].state,'INCOMPLETE');assert.equal(r[9].state,'INCOMPLETE');
});
test('recovering an interrupted creation repeats the canonical project without a second group or member',async()=>{
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();kernel.context.set({tenantId:'tenant_A',actorId:'owner_A',roleClaims:['founder','manager'],mandateIds:[],deviceId:'synthetic',sessionId:'synthetic',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'lot03'});const service=new FoundationService(repo,kernel),project=await service.createProject({tenantId:'tenant_A',createdBy:'owner_A',projectId:'project_resume_test',name:'Synthetic recovery',kind:'association',governanceModel:'community',memberCount:3,sessions:3,nominalContribution:{currency:'XAF',amount:500},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0},launchProfile:{origin:{mode:'NEW'},previewConfirmed:true}});
 const {store}=make();store.rememberCreation(project.id,{guideVersion:LAUNCH_GUIDE_VERSION});const first=await service.convertProjectToGroup('tenant_A',project.id);const membersBefore=await repo.listMemberships('tenant_A',first.id);const retry=await service.convertProjectToGroup('tenant_A',store.pending().projectId);assert.equal(retry.id,first.id);assert.equal((await repo.listGroups('tenant_A')).length,1);assert.deepEqual(await repo.listMemberships('tenant_A',first.id),membersBefore);store.completeCreation(retry.id);assert.equal(store.pending().completedGroupId,first.id);
});
