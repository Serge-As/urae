import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {ExternalProgramsService} from '../.build/packages/external-programs/src/index.js';

async function setup(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
  kernel.context.set({tenantId:'t',actorId:'owner',activeGroupId:'g',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
  await repo.saveGroup({id:'g',tenantId:'t',name:'CERDAS',kind:'association',governanceModel:'founder_managed',status:'active',createdBy:'owner',createdAt:'2026-09-16T00:00:00Z'});
  return{repo,kernel,svc:new ExternalProgramsService(repo,kernel)};
}
const profile={groupCode:'ECO-GRP-ABC123',currency:'XAF',memberCount:18,receiptCount:15,collectedTotal:150000,cashIn:150000,cashOut:0,transactionCount:15,rubricVolumes:[{rubricId:'savons',rubricLabel:'Tontine Savons',amount:150000,receiptCount:15}],generatedAt:'2026-09-16T00:00:00Z',privacy:'GROUP_PSEUDONYMOUS_AGGREGATE',containsIndividualFinancialData:false,exportable:true,exportBlockers:[]};

test('partner and NGO programs are governed specialized records',async()=>{
  const {svc}=await setup();
  const partner=await svc.create('g',{kind:'PARTNER',partyName:'Fournisseur X',programName:'Prix groupés',purpose:'Négocier le savon en volume',dataAccess:'GROUP_AGGREGATE_ECONOMIC'});
  const ngo=await svc.create('g',{kind:'NGO',partyName:'ONG Y',programName:'Inclusion financière',purpose:'Accompagner la gouvernance',dataAccess:'NONE'});
  assert.equal(partner.state,'DRAFT');assert.equal(ngo.kind,'NGO');
  assert.equal((await svc.list('g')).length,2);
});

test('aggregate financial share pack exposes group masses but no member financial data',async()=>{
  const {svc}=await setup();
  let p=await svc.create('g',{kind:'PARTNER',partyName:'Partenaire financier',programName:'Financement collectif',purpose:'Dimensionner une offre groupe',dataAccess:'GROUP_AGGREGATE_ECONOMIC'});
  p=await svc.transition('g',p.id,'ACTIVE');
  const pack=await svc.issueAggregateSharePack('g',p.id,profile,'Étudier la masse Tontine Savons',30);
  assert.equal(pack.groupCode,'ECO-GRP-ABC123');assert.equal(pack.profile.rubricVolumes[0].amount,150000);
  assert.equal(pack.profile.containsIndividualFinancialData,false);
  assert.equal(JSON.stringify(pack).includes('Serge'),false);
  assert.equal((await svc.sharePacks('g',p.id)).length,1);
  await svc.revokeSharePack('g',pack.id);assert.equal((await svc.sharePacks('g',p.id)).length,0);
});

test('non-exportable or non-authorized financial profiles cannot be shared',async()=>{
  const {svc}=await setup();
  let p=await svc.create('g',{kind:'NGO',partyName:'ONG',programName:'Appui',purpose:'Suivi',dataAccess:'NONE'});p=await svc.transition('g',p.id,'ACTIVE');
  await assert.rejects(()=>svc.issueAggregateSharePack('g',p.id,profile,'x',30),/AGGREGATE_DATA_ACCESS_NOT_GRANTED/);
  let p2=await svc.create('g',{kind:'PARTNER',partyName:'Banque',programName:'Offre',purpose:'Analyse',dataAccess:'GROUP_AGGREGATE_ECONOMIC'});p2=await svc.transition('g',p2.id,'ACTIVE');
  await assert.rejects(()=>svc.issueAggregateSharePack('g',p2.id,{...profile,exportable:false,exportBlockers:['MIN_MEMBER_AGGREGATION_NOT_REACHED']},'x',30),/ECONOMIC_PROFILE_NOT_EXPORTABLE/);
});
