import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {MemberProfileService} from '../.build/packages/member-profile/src/index.js';

const group={id:'g',tenantId:'t',name:'Groupe',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-01T00:00:00.000Z'};
const serge={id:'m_serge',tenantId:'t',groupId:'g',userId:'u_serge',roles:['member'],status:'active',joinedAt:'2026-09-01T00:00:00.000Z'};
const paul={id:'m_paul',tenantId:'t',groupId:'g',userId:'u_paul',roles:['member'],status:'active',joinedAt:'2026-09-01T00:00:00.000Z'};
const ctx=(kernel,actor,roles=[])=>kernel.context.set({tenantId:'t',actorId:actor,activeGroupId:'g',groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
async function setup(){const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel,'owner',['founder']);await repo.saveGroup(group);for(const [id,name] of [['u_serge','Serge'],['u_paul','Paul']])await repo.saveUser({id,displayName:name,locale:'fr',createdAt:'2026-09-01T00:00:00.000Z'});await repo.saveMembership(serge);await repo.saveMembership(paul);return{repo,kernel,svc:new MemberProfileService(repo,kernel)};}

test('manager saves and versions a private member dossier',async()=>{const {svc}=await setup();const a=await svc.save('g','m_serge',{legalName:'Serge M.',profession:'Commerçant',children:['Alice','Bob'],joinedYear:2015,expectedVersion:0});assert.equal(a.profileVersion,1);assert.equal(a.profession,'Commerçant');assert.deepEqual(a.children,['Alice','Bob']);const b=await svc.save('g','m_serge',{quarter:'Mimboman',expectedVersion:1});assert.equal(b.profileVersion,2);assert.equal(b.legalName,'Serge M.');assert.equal(b.quarter,'Mimboman');});

test('stale edit is rejected instead of silently overwriting another manager',async()=>{const {svc}=await setup();await svc.save('g','m_serge',{profession:'A',expectedVersion:0});await assert.rejects(()=>svc.save('g','m_serge',{profession:'B',expectedVersion:0}),/MEMBER_PROFILE_VERSION_CONFLICT/);});

test('member can read and maintain own dossier but cannot read another member private dossier',async()=>{const {kernel,svc}=await setup();await svc.save('g','m_serge',{legalName:'Serge',expectedVersion:0});ctx(kernel,'u_serge',['member']);assert.equal((await svc.get('g','m_serge')).legalName,'Serge');await svc.save('g','m_serge',{displayAlias:'Boss',expectedVersion:1});await assert.rejects(()=>svc.get('g','m_paul'),/FORBIDDEN_SCOPE/);});

test('joined year and list fields are normalized',async()=>{const {svc}=await setup();const p=await svc.save('g','m_serge',{joinedYear:2020,children:[' Alice ','','Bob'],siblings:'Paul; Jeanne',expectedVersion:0});assert.deepEqual(p.children,['Alice','Bob']);assert.deepEqual(p.siblings,['Paul','Jeanne']);await assert.rejects(()=>svc.save('g','m_serge',{joinedYear:1800,expectedVersion:1}),/INVALID_JOINED_YEAR/);});