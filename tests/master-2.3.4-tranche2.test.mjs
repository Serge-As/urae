import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {createApiHandler} from '../.build/workers/api/src/index.js';

const founderHeaders={'content-type':'application/json','x-tenant-id':'tenant_t2','x-actor-id':'founder_t2','x-group-roles':'founder,manager'};
const memberHeaders={'content-type':'application/json','x-tenant-id':'tenant_t2','x-actor-id':'member_t2','x-group-roles':'member'};

async function seed(){
  const repo=new InMemoryPlatformRepository();
  await repo.saveUser({id:'founder_t2',displayName:'Fondatrice Exemple',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveUser({id:'member_t2',displayName:'Membre Exemple',locale:'fr',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveGroup({id:'group_t2',tenantId:'tenant_t2',name:'Association Tranche 2',kind:'association',governanceModel:'community',status:'active',createdBy:'founder_t2',createdAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'membership_founder_t2',tenantId:'tenant_t2',groupId:'group_t2',userId:'founder_t2',roles:['founder','manager'],status:'active',joinedAt:'2026-01-01T00:00:00Z'});
  await repo.saveMembership({id:'membership_member_t2',tenantId:'tenant_t2',groupId:'group_t2',userId:'member_t2',roles:['member'],status:'active',joinedAt:'2026-01-01T00:00:00Z'});
  return {repo,handler:createApiHandler(repo,{governanceSecret:'0123456789abcdef0123456789abcdef'})};
}

test('governance poll supports secret ballot, quorum and closure without exposing voter identity in ballot record',async()=>{
  const {repo,handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t2/governance/polls',{method:'POST',headers:founderHeaders,body:JSON.stringify({title:'Budget annuel',question:'Valider le budget ?',kind:'YES_NO',mode:'SECRET',quorumBps:5000,majority:'SIMPLE'})}));
  assert.equal(r.status,201);const poll=await r.json();assert.equal(poll.mode,'SECRET');assert.equal(poll.eligibleCount,2);
  r=await handler(new Request(`http://local/api/v1/groups/group_t2/governance/polls/${poll.id}/ballots`,{method:'POST',headers:memberHeaders,body:JSON.stringify({selections:['OUI']})}));
  assert.equal(r.status,201);assert.equal((await r.json()).secret,true);
  r=await handler(new Request(`http://local/api/v1/groups/group_t2/governance/polls/${poll.id}/ballots`,{method:'POST',headers:founderHeaders,body:JSON.stringify({selections:['OUI']})}));
  assert.equal(r.status,201);
  r=await handler(new Request(`http://local/api/v1/groups/group_t2/governance/polls/${poll.id}/close`,{method:'POST',headers:founderHeaders,body:JSON.stringify({state:'CLOSED'})}));assert.equal(r.status,200);
  r=await handler(new Request(`http://local/api/v1/groups/group_t2/governance/polls/${poll.id}/tally`,{headers:memberHeaders}));const tally=await r.json();
  assert.equal(tally.castCount,2);assert.equal(tally.quorumReached,true);assert.equal(tally.resolution,'ADOPTED');
  const ballots=(await repo.listWorkspaceRecords('tenant_t2','GOVERNANCE.VOTE.BALLOT','group_t2'));
  assert.equal(ballots.length,2);assert.ok(ballots.every(x=>x.createdBy==='secret-ballot'));assert.ok(ballots.every(x=>!String(x.data.voterKey).includes('membership_member_t2')));
});

test('notifications remain honest about external provider delivery and preserve per-user read state',async()=>{
  const {handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t2/notifications',{method:'POST',headers:founderHeaders,body:JSON.stringify({title:'Séance samedi',message:'Réunion à 15 h',channels:['IN_APP','WEB_PUSH','WHATSAPP'],audience:'ALL_MEMBERS',priority:'HIGH'})}));
  assert.equal(r.status,201);const notice=await r.json();assert.equal(notice.delivery.IN_APP,'AVAILABLE');assert.equal(notice.delivery.WEB_PUSH,'PROVIDER_PENDING');assert.equal(notice.delivery.WHATSAPP,'MANUAL_SHARE');
  r=await handler(new Request('http://local/api/v1/groups/group_t2/notifications',{headers:memberHeaders}));let inbox=await r.json();assert.equal(inbox.length,1);assert.equal(inbox[0].read,false);
  r=await handler(new Request(`http://local/api/v1/groups/group_t2/notifications/${notice.id}/read`,{method:'POST',headers:memberHeaders,body:'{}'}));assert.equal(r.status,200);
  r=await handler(new Request('http://local/api/v1/groups/group_t2/notifications',{headers:memberHeaders}));inbox=await r.json();assert.equal(inbox[0].read,true);
  r=await handler(new Request('http://local/api/v1/notifications/preferences',{method:'PUT',headers:memberHeaders,body:JSON.stringify({channels:{IN_APP:true,WEB_PUSH:false,WHATSAPP:true},quietHours:{start:'21:00',end:'06:00'},digest:'DAILY'})}));assert.equal(r.status,200);const prefs=await r.json();assert.equal(prefs.digest,'DAILY');assert.equal(prefs.channels.WHATSAPP,true);
});

test('member notebook is self-readable and remains manager-scoped for another member',async()=>{
  const {handler}=await seed();
  let r=await handler(new Request('http://local/api/v1/groups/group_t2/members/membership_member_t2/notebook',{headers:memberHeaders}));
  assert.equal(r.status,200);let body=await r.json();assert.equal(body.group.id,'group_t2');assert.equal(body.membership.id,'membership_member_t2');assert.ok(Array.isArray(body.timeline));
  r=await handler(new Request('http://local/api/v1/groups/group_t2/members/membership_founder_t2/notebook',{headers:memberHeaders}));
  assert.equal(r.status,400);body=await r.json();assert.equal(body.error,'FORBIDDEN_SCOPE');
});

test('tranche 2 shell exposes votes, notifications, secure invitations, calendar and member notebook',()=>{
  const bootstrap=fs.readFileSync('apps/web/src/voice-entry-bootstrap.ts','utf8');
  const ui=fs.readFileSync('apps/web/src/master-governance-ui.ts','utf8');
  assert.match(bootstrap,/mountMasterGovernanceUI/);
  for(const token of ['Votes','Notifications','Invitations','Calendrier','Carnet membre']) assert.match(ui,new RegExp(token));
  assert.match(ui,/calendar\.ics/);assert.match(ui,/governance\/polls/);assert.match(ui,/notifications\/preferences/);
});
