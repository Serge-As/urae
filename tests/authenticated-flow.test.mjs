import test from 'node:test';
import assert from 'node:assert/strict';
import { SQLiteD1 } from '../scripts/sqlite-d1.mjs';
import worker from '../.build/workers/api/src/index.js';

function environment(){const db=new SQLiteD1(':memory:');db.migrate();return{db,request:async(path,method='GET',body,cookie,extra={})=>{
 const headers={'content-type':'application/json',origin:'https://local.test',...(cookie?{cookie}:{}),...extra};
 return worker.fetch(new Request('https://local.test'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),{DB:db});
}};}
async function register(e,username){const r=await e.request('/api/v1/auth/register','POST',{username,password:'Synthetic-test-password-2026!',displayName:username});assert.equal(r.status,200,await r.clone().text());const body=await r.json();return{account:body.account,cookie:r.headers.get('set-cookie').split(';')[0],header:r.headers.get('set-cookie')};}
async function group(e,account){const r=await e.request('/api/v1/group-projects','POST',{name:'Session test group',memberCount:2,sessions:2,nominalContribution:1000},account.cookie);assert.equal(r.status,201,await r.clone().text());const p=await r.json();const converted=await e.request(`/api/v1/group-projects/${p.id}/convert`,'POST',{},account.cookie);assert.equal(converted.status,201);return converted.json();}

test('real session protects business routes, ignores forged identity, and can be revoked',async()=>{
 const e=environment();try{
  const anonymous=await e.request('/api/v1/groups','GET',undefined,undefined,{'x-actor-id':'user_founder','x-tenant-id':'tenant_local'});assert.equal(anonymous.status,401);
  const a=await register(e,'session_owner');assert.match(a.header,/HttpOnly/);assert.match(a.header,/SameSite=Strict/);assert.match(a.header,/Secure/);
  const g=await group(e,a);const outsider=await register(e,'session_outsider');
  const denied=await e.request(`/api/v1/groups/${g.id}/ledger`,'GET',undefined,outsider.cookie,{'x-actor-id':a.account.id,'x-tenant-id':a.account.tenantId,'x-group-roles':'founder,manager'});assert.equal(denied.status,403);
  const data=await (await e.request('/api/v1/groups','GET',undefined,outsider.cookie)).json();assert.equal(data.length,0);
  assert.equal((await e.request('/api/v1/groups/mine')).status,401);
  const personal=await e.request('/api/v1/groups/mine','GET',undefined,a.cookie);assert.equal(personal.status,200,await personal.clone().text());
  assert.deepEqual((await personal.json()).map(x=>x.id),[g.id]);
  const privateDirectory=await e.request('/api/v1/groups/mine','GET',undefined,outsider.cookie,{'x-active-group-id':g.id,'x-actor-id':a.account.id});
  assert.equal(privateDirectory.status,200);assert.deepEqual(await privateDirectory.json(),[]);
  const logout=await e.request('/api/v1/auth/logout','POST',{},a.cookie);assert.equal(logout.status,200);
  assert.equal((await e.request('/api/v1/groups','GET',undefined,a.cookie)).status,401);
 }finally{e.db.close();}
});
test('registration, password verification, session expiry and cross-origin protection',async()=>{
 const e=environment();try{
  const a=await register(e,'login_member');
  assert.equal((await e.request('/api/v1/auth/login','POST',{username:'login_member',password:'Incorrect-but-long-password'})).status,401);
  const login=await e.request('/api/v1/auth/login','POST',{username:'login_member',password:'Synthetic-test-password-2026!'});assert.equal(login.status,200);
  assert.equal((await e.request('/api/v1/auth/logout','POST',{},a.cookie,{origin:'https://untrusted.test'})).status,403);
  e.db.db.prepare('UPDATE auth_sessions SET expires_at=0').run();assert.equal((await e.request('/api/v1/groups','GET',undefined,a.cookie)).status,401);
 }finally{e.db.close();}
});
test('authenticated session creates group, records cash once, and stores offline notes durably',async()=>{
 const e=environment();try{
  const a=await register(e,'ledger_owner');const g=await group(e,a);const headers={'x-active-group-id':g.id};
  const members=await (await e.request(`/api/v1/groups/${g.id}/members`,'GET',undefined,a.cookie,headers)).json();
  const input={membershipId:members[0].id,amount:2500,idempotencyKey:'device-operation'};
  const r=await e.request(`/api/v1/groups/${g.id}/contributions/cash`,'POST',input,a.cookie,headers);assert.equal(r.status,201,await r.clone().text());
  const receipt=await r.json();const repeat=await (await e.request(`/api/v1/groups/${g.id}/contributions/cash`,'POST',input,a.cookie,headers)).json();assert.equal(receipt.id,repeat.id);
  const note={tenantId:g.tenantId,actorId:a.account.id,type:'MEETING_NOTE_UPDATED',payload:{groupId:g.id,note:'Compte rendu conservé'},idempotencyKey:'note-1',createdAt:new Date().toISOString()};
  const saved=await e.request('/api/v1/outbox/apply','POST',note,a.cookie,headers);assert.equal(saved.status,200,await saved.clone().text());assert.equal((await saved.json()).stored,true);
  const notes=await (await e.request('/api/v1/workspaces?moduleId=MEETING.COMMAND_CENTER','GET',undefined,a.cookie,headers)).json();assert.equal(notes[0].summary,'Compte rendu conservé');
 }finally{e.db.close();}
});

test('cross-tenant admission grants own statement, never group ledger or another member statement',async()=>{
 const e=environment();try{
  const owner=await register(e,'admission_owner'),member=await register(e,'admission_member');
  const g=await group(e,owner),headers={'x-active-group-id':g.id};
  let r=await e.request(`/api/v1/groups/${g.id}/discovery`,'POST',{visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true},owner.cookie,headers);assert.equal(r.status,200,await r.clone().text());
  r=await e.request('/api/v1/membership-applications','POST',{groupId:g.id,message:'Adhésion de test'},member.cookie);assert.equal(r.status,201,await r.clone().text());const application=await r.json();
  r=await e.request(`/api/v1/membership-applications/${application.id}/decision`,'POST',{decision:'APPROVE'},owner.cookie,headers);assert.equal(r.status,200,await r.clone().text());
  const all=await (await e.request(`/api/v1/groups/${g.id}/members`,'GET',undefined,owner.cookie,headers)).json();const membership=all.find(m=>m.userId===member.account.id);
  const accessible=await (await e.request('/api/v1/groups','GET',undefined,member.cookie)).json();assert.equal(accessible[0].id,g.id);assert.deepEqual(accessible[0].viewerRoles,['member']);
  const personal=await e.request('/api/v1/groups/mine','GET',undefined,member.cookie);assert.equal(personal.status,200,await personal.clone().text());
  assert.deepEqual(await personal.json(),accessible,'personal directory retains authorized memberships from the group tenant');
  r=await e.request(`/api/v1/groups/${g.id}/contributions/cash`,'POST',{membershipId:membership.id,amount:7000,idempotencyKey:'statement-test'},owner.cookie,headers);const receipt=await r.json();assert.equal(r.status,201);
  const path=`/api/v1/groups/${g.id}/members/${membership.id}/statement`;
  r=await e.request(path,'GET',undefined,member.cookie,headers);assert.equal(r.status,200);assert.equal((await r.json()).totalNetContributions,7000);
  assert.equal((await e.request(`/api/v1/groups/${g.id}/ledger`,'GET',undefined,member.cookie,headers)).status,403);
  assert.equal((await e.request(`/api/v1/groups/${g.id}/members/${all.find(m=>m.userId===owner.account.id).id}/statement`,'GET',undefined,member.cookie,headers)).status,403);
  r=await e.request(`/api/v1/groups/${g.id}/ledger/${receipt.ledgerEntryId}/reverse`,'POST',{reason:'Annulation de test'},owner.cookie,headers);assert.equal(r.status,201,await r.clone().text());
  const statement=await (await e.request(path,'GET',undefined,member.cookie,headers)).json();assert.equal(statement.totalNetContributions,0);assert.equal(statement.receipts[0].amount.amount,7000);assert.equal(statement.receipts[0].netAmount,0);
  const ledger=await (await e.request(`/api/v1/groups/${g.id}/ledger`,'GET',undefined,owner.cookie,headers)).json();assert.equal(ledger.summary.cashBalance,0);assert.equal(ledger.receipts[0].netAmount,0);
 }finally{e.db.close();}
});

test('authenticated governance document upload accepts multipart while other business writes still require JSON',async()=>{
 const e=environment();try{
  const a=await register(e,'document_owner');
  const form=new FormData();form.append('files',new Blob(['Secours obligatoire 1000 FCFA. Tontine de 2000 FCFA.'],{type:'text/plain'}),'rubriques.txt');
  const uploaded=await worker.fetch(new Request('https://local.test/api/v1/assistant/group-launch/analyze-files',{method:'POST',headers:{origin:'https://local.test',cookie:a.cookie},body:form}),{DB:e.db,ARTIFACTS:{put:async()=>{}}});
  assert.equal(uploaded.status,200,await uploaded.clone().text());
  const result=await uploaded.json();assert.ok(result.suggestions.some(x=>x.rubric));
  const wrongType=await worker.fetch(new Request('https://local.test/api/v1/bootstrap',{method:'POST',headers:{origin:'https://local.test',cookie:a.cookie,'content-type':'text/plain'},body:'hello'}),{DB:e.db});
  assert.equal(wrongType.status,415);assert.equal((await wrongType.json()).error,'JSON_REQUIRED');
 }finally{e.db.close();}
});


test('second manager immediately replaces 1000 by 500 without ever producing 1500',async()=>{
 const e=environment();try{
  const owner=await register(e,'cell_owner'),manager=await register(e,'cell_manager');
  const g=await group(e,owner),headers={'x-active-group-id':g.id};

  let r=await e.request(`/api/v1/groups/${g.id}/discovery`,'POST',{visibility:'PUBLIC',discoverable:true,joinPolicy:'REQUEST',recruiting:true},owner.cookie,headers);
  assert.equal(r.status,200,await r.clone().text());
  r=await e.request('/api/v1/membership-applications','POST',{groupId:g.id,message:'gestionnaire'},manager.cookie);assert.equal(r.status,201,await r.clone().text());const application=await r.json();
  r=await e.request(`/api/v1/membership-applications/${application.id}/decision`,'POST',{decision:'APPROVE'},owner.cookie,headers);assert.equal(r.status,200,await r.clone().text());

  let members=await (await e.request(`/api/v1/groups/${g.id}/members`,'GET',undefined,owner.cookie,headers)).json();
  const ownerMembership=members.find(x=>x.userId===owner.account.id),managerMembership=members.find(x=>x.userId===manager.account.id);
  r=await e.request(`/api/v1/groups/${g.id}/members/${managerMembership.id}/lifecycle`,'PUT',{status:'active',roles:['member','manager'],expectedRevision:Number(managerMembership.lifecycleRevision??0),reason:'test multi-manager'},owner.cookie,headers);
  assert.equal(r.status,200,await r.clone().text());

  r=await e.request(`/api/v1/groups/${g.id}/rubrics`,'POST',{name:'Cotisation test',facets:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},source:'GROUP_CUSTOM',operatingModel:{ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false}},owner.cookie,headers);
  assert.equal(r.status,201,await r.clone().text());const rubric=await r.json();

  r=await e.request(`/api/v1/groups/${g.id}/meetings`,'POST',{title:'Séance cible',scheduledAt:'2026-09-22T08:00:00.000Z'},owner.cookie,headers);
  assert.equal(r.status,201,await r.clone().text());const meeting=await r.json();

  const cell={membershipId:ownerMembership.id,rubricId:rubric.id,targetAmount:1000,reason:'Saisie initiale'};
  r=await e.request(`/api/v1/groups/${g.id}/meetings/${meeting.id}/financial-cells`,'POST',cell,owner.cookie,headers);
  assert.equal(r.status,201,await r.clone().text());assert.equal((await r.json()).target,1000);

  const managerHeaders={'x-active-group-id':g.id};
  r=await e.request(`/api/v1/groups/${g.id}/meetings/${meeting.id}/financial-cells`,'POST',{...cell,targetAmount:500,reason:'Correction constatée'},manager.cookie,managerHeaders);
  assert.equal(r.status,200,await r.clone().text());const applied=await r.json();assert.equal(applied.status,'APPLIED');assert.equal(applied.previousAmount,1000);assert.equal(applied.newAmount,500);

  let ledger=await (await e.request(`/api/v1/groups/${g.id}/ledger`,'GET',undefined,owner.cookie,headers)).json();
  let total=ledger.receipts.filter(x=>x.membershipId===ownerMembership.id&&x.rubricId===rubric.id&&x.meetingId===meeting.id).reduce((n,x)=>n+x.netAmount,0);
  assert.equal(total,500,'latest authorized target must immediately replace 1000, never add +500 and never wait for consensus');

  const memberAlerts=await (await e.request(`/api/v1/groups/${g.id}/notifications`,'GET',undefined,owner.cookie,headers)).json();
  assert.ok(memberAlerts.some(x=>/compte a été corrigé|Donnée financière corrigée/i.test(String(x.title??''))), 'affected member must receive a correction alert');
 }finally{e.db.close();}
});

