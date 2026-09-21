import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {MeetingLiveConsensusService} from '../.build/packages/meeting-live-consensus/src/index.js';

const ctx=(kernel,actor)=>kernel.context.set({tenantId:'t',actorId:actor,activeGroupId:'g',groupRoles:['manager'],mandateIds:[],deviceId:'d-'+actor,sessionId:'s-'+actor,locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r-'+actor});

test('multi-manager live entry exposes stable colors and asks for consensus on divergence',async()=>{
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),svc=new MeetingLiveConsensusService(repo,kernel);
 await repo.saveGroup({id:'g',tenantId:'t',name:'G',kind:'association',governanceModel:'community',status:'active',createdBy:'m1',createdAt:'2026-09-21T08:00:00.000Z'});
 for(const u of ['m1','m2','m3'])await repo.saveMembership({id:'mem-'+u,tenantId:'t',groupId:'g',userId:u,roles:['manager'],status:'active',joinedAt:'2026-09-21T08:00:00.000Z'});
 ctx(kernel,'m1');let x=await svc.submit({groupId:'g',meetingId:'meet',cellKey:'memberA:tontine1000',value:1000,label:'Président'});
 ctx(kernel,'m2');x=await svc.submit({groupId:'g',meetingId:'meet',cellKey:'memberA:tontine1000',value:1500,label:'Trésorier'});
 assert.equal(x.state,'DIVERGENT');assert.notEqual(x.proposals[0].color,x.proposals[1].color);
 ctx(kernel,'m3');x=await svc.submit({groupId:'g',meetingId:'meet',cellKey:'memberA:tontine1000',value:1000,label:'Secrétaire'});
 ctx(kernel,'m1');await svc.vote('g','meet','memberA:tontine1000','m1');
 ctx(kernel,'m3');x=await svc.vote('g','meet','memberA:tontine1000','m1');
 assert.equal(x.state,'MAJORITY_SELECTED');assert.equal(x.selectedValue,'1000');assert.deepEqual(x.dissentingActorIds,['m2']);
 ctx(kernel,'m2');x=await svc.maintainDissent('g','meet','memberA:tontine1000','Je maintiens 1500 selon mon reçu.');
 assert.equal(x.state,'RESERVE_OPEN');assert.equal(x.selectedValue,'1000');
 assert.equal((await repo.listCases('t','m2')).some(c=>c.type==='LIVE_DATA_DIVERGENCE'&&c.status==='OPEN'),true);
});

test('same live value from several managers converges without dispute',async()=>{
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel(),svc=new MeetingLiveConsensusService(repo,kernel);
 await repo.saveGroup({id:'g',tenantId:'t',name:'G',kind:'association',governanceModel:'community',status:'active',createdBy:'m1',createdAt:'2026-09-21T08:00:00.000Z'});
 await repo.saveMembership({id:'a',tenantId:'t',groupId:'g',userId:'m1',roles:['manager'],status:'active',joinedAt:'2026-09-21T08:00:00.000Z'});
 await repo.saveMembership({id:'b',tenantId:'t',groupId:'g',userId:'m2',roles:['manager'],status:'active',joinedAt:'2026-09-21T08:00:00.000Z'});
 ctx(kernel,'m1');await svc.submit({groupId:'g',meetingId:'meet',cellKey:'memberB:savings',value:5000});
 ctx(kernel,'m2');const x=await svc.submit({groupId:'g',meetingId:'meet',cellKey:'memberB:savings',value:5000});
 assert.equal(x.state,'UNANIMOUS');assert.equal(x.selectedValue,'5000');
});
