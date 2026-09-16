import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {FundPositionService} from '../.build/packages/fund-positions/src/index.js';

async function setup(){
 const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();
 kernel.context.set({tenantId:'t',actorId:'owner',activeGroupId:'g',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
 await repo.saveUser({id:'u1',displayName:'Membre A',locale:'fr',createdAt:'2026-09-16T00:00:00Z'});
 await repo.saveUser({id:'u2',displayName:'Membre B',locale:'fr',createdAt:'2026-09-16T00:00:00Z'});
 await repo.saveGroup({id:'g',tenantId:'t',name:'Groupe',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:'2026-09-16T00:00:00Z'});
 await repo.saveMembership({id:'m1',tenantId:'t',groupId:'g',userId:'u1',roles:['member'],status:'active',joinedAt:'2026-09-16T00:00:00Z'});
 await repo.saveMembership({id:'m2',tenantId:'t',groupId:'g',userId:'u2',roles:['member'],status:'active',joinedAt:'2026-09-16T00:00:00Z'});
 const ledger=new LedgerService(repo,kernel),svc=new FundPositionService(repo,kernel,ledger);
 return{repo,kernel,ledger,svc};
}
test('Secours member positions preserve opening retention and exact member contributions',async()=>{
 const {ledger,svc}=await setup();
 await ledger.recordCashContribution({tenantId:'t',groupId:'g',membershipId:'m1',amount:{currency:'XAF',amount:2000},rubricId:'secours',idempotencyKey:'a'});
 await ledger.recordCashContribution({tenantId:'t',groupId:'g',membershipId:'m2',amount:{currency:'XAF',amount:3000},rubricId:'secours',idempotencyKey:'b'});
 await svc.record('g','secours',{membershipId:'m1',exerciseLabel:'2027',kind:'OPENING_RETAINED',amount:12000,note:'Retenue exercice précédent'});
 const p=await svc.positions('g','secours','2027'),a=p.positions.find(x=>x.membershipId==='m1'),b=p.positions.find(x=>x.membershipId==='m2');
 assert.equal(a.openingRetained,12000);assert.equal(a.contributions,2000);assert.equal(a.attributableReserve,14000);
 assert.equal(b.contributions,3000);assert.equal(p.totals.attributableReserve,17000);
});
test('refund and assistance charge remain attributable to the member instead of disappearing into a global Secours balance',async()=>{
 const {ledger,svc}=await setup();
 await ledger.recordCashContribution({tenantId:'t',groupId:'g',membershipId:'m1',amount:{currency:'XAF',amount:10000},rubricId:'secours',idempotencyKey:'a'});
 await svc.record('g','secours',{membershipId:'m1',exerciseLabel:'CURRENT',kind:'REFUND',amount:2000});
 await svc.record('g','secours',{membershipId:'m1',exerciseLabel:'CURRENT',kind:'ASSISTANCE_CHARGE',amount:1000});
 const p=await svc.positions('g','secours'),a=p.positions.find(x=>x.membershipId==='m1');
 assert.equal(a.contributions,10000);assert.equal(a.refunds,2000);assert.equal(a.assistanceCharges,1000);assert.equal(a.attributableReserve,7000);
});
test('reversal in canonical ledger changes Secours contribution position without deleting history',async()=>{
 const {repo,ledger,svc}=await setup();
 const receipt=await ledger.recordCashContribution({tenantId:'t',groupId:'g',membershipId:'m1',amount:{currency:'XAF',amount:5000},rubricId:'secours',idempotencyKey:'a'});
 await ledger.reverseEntry({tenantId:'t',groupId:'g',entryId:receipt.ledgerEntryId,reason:'Erreur de saisie'});
 const p=await svc.positions('g','secours');assert.equal(p.positions.find(x=>x.membershipId==='m1').contributions,0);
 assert.ok((await repo.listLedgerEntries('t','g')).length>=2);
});
