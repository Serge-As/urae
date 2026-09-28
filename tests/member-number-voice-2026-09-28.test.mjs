import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {matchVoiceMention} from '../.build/packages/voice-commands/src/index.js';

async function seed(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),service=new FoundationService(repo,kernel);
  kernel.context.set({actorId:'founder',tenantId:'member_no_t',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'member-no-test'});
  await service.ensureUser({id:'founder',displayName:'Fondatrice',locale:'fr',createdAt:new Date().toISOString()});
  const p=await service.createProject({tenantId:'member_no_t',createdBy:'founder',name:'Groupe numéroté',kind:'association',governanceModel:'community',memberCount:5,sessions:12,nominalContribution:{currency:'XAF',amount:1000},managementFeePerContribution:{currency:'XAF',amount:0},estimatedExternalCostRate:0,fixedOperatingCostPerSession:{currency:'XAF',amount:0}});
  const group=await service.convertProjectToGroup('member_no_t',p.id);
  return{repo,kernel,service,group};
}

test('group membership numbers are stable and monotonic',async()=>{
  const {repo,service,group}=await seed();
  const owner=(await repo.listMemberships('member_no_t',group.id)).find(x=>x.userId==='founder');
  assert.equal(owner?.memberNumber,1);
  const a=await service.addMember('member_no_t',group.id,{id:'u_a',displayName:'Nlom',locale:'fr',createdAt:new Date().toISOString()});
  const b=await service.addMember('member_no_t',group.id,{id:'u_b',displayName:'Mballa',locale:'fr',createdAt:new Date().toISOString()});
  assert.equal(a.memberNumber,2);assert.equal(b.memberNumber,3);
  const again=await service.ensureMemberNumbers('member_no_t',group.id);
  assert.deepEqual(again.map(x=>x.memberNumber).sort((x,y)=>Number(x)-Number(y)),[1,2,3]);
});

test('legacy membership without number is backfilled once and keeps the assigned number',async()=>{
  const {repo,service,group}=await seed();
  await repo.saveUser({id:'legacy',displayName:'Mvondo',locale:'fr',createdAt:'2020-01-01T00:00:00.000Z'});
  await repo.saveMembership({id:'legacy_membership',tenantId:'member_no_t',groupId:group.id,userId:'legacy',roles:['member'],status:'active',joinedAt:'2020-01-01T00:00:00.000Z'});
  const first=await service.ensureMemberNumbers('member_no_t',group.id);
  const assigned=first.find(x=>x.id==='legacy_membership')?.memberNumber;
  assert.ok(Number(assigned)>0);
  const second=await service.ensureMemberNumbers('member_no_t',group.id);
  assert.equal(second.find(x=>x.id==='legacy_membership')?.memberNumber,assigned);
});

test('voice UI exposes member-number aliases and parser can resolve a spoken member number',()=>{
  const ui=fs.readFileSync('apps/web/src/voice-entry-ui.ts','utf8');
  assert.match(ui,/membre numéro/);assert.match(ui,/member number/);assert.match(ui,/memberNumber/);
  const match=matchVoiceMention('Eco chez membre numéro 10 secours 500',[{id:'m10',label:'Nlom Essomba',aliases:['membre numéro 10','member number 10']}]);
  assert.equal(match.status,'EXACT');assert.equal(match.candidate?.id,'m10');
});


test('manager-defined member order becomes the stable 1..N voice numbering',async()=>{
  const {repo,service,group}=await seed();
  const owner=(await repo.listMemberships('member_no_t',group.id)).find(x=>x.userId==='founder');
  const a=await service.addMember('member_no_t',group.id,{id:'rank_a',displayName:'Nom difficile A',locale:'fr',createdAt:new Date().toISOString()});
  const b=await service.addMember('member_no_t',group.id,{id:'rank_b',displayName:'Nom difficile B',locale:'fr',createdAt:new Date().toISOString()});
  const ranked=await service.setMemberNumberOrder('member_no_t',group.id,[b.id,owner.id,a.id],'rank-op');
  assert.equal(ranked.find(x=>x.id===b.id)?.memberNumber,1);
  assert.equal(ranked.find(x=>x.id===owner.id)?.memberNumber,2);
  assert.equal(ranked.find(x=>x.id===a.id)?.memberNumber,3);
  const again=await service.ensureMemberNumbers('member_no_t',group.id);
  assert.equal(again.find(x=>x.id===a.id)?.memberNumber,3);
  const candidates=ranked.map(x=>({id:x.id,label:x.id,aliases:['membre numéro '+x.memberNumber,'member number '+x.memberNumber]}));
  const match=matchVoiceMention('Eco chez membre numéro 3 secours 500',candidates);
  assert.equal(match.status,'EXACT');assert.equal(match.candidate?.id,a.id);
});

test('financial meeting sheet renders a separate number column before member name',()=>{
  const main=fs.readFileSync('apps/web/src/main.js','utf8');
  assert.match(main,/member-number-column/);
  assert.match(main,/textContent=tx\('N°','No\.'/);
  assert.match(main,/tr\.append\(number,name\)/);
  assert.match(main,/memberSaveNumbersBtn/);
  assert.match(main,/memberApplyDisplayedOrderBtn/);
});
