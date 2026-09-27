import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {WalletService} from '../.build/packages/wallet/src/index.js';

const ctx=(k,actor,roles=[],groupId)=>k.context.set({actorId:actor,tenantId:'tenant_wallet',activeGroupId:groupId,groupRoles:roles,mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req_'+actor});
const stamp=()=>new Date().toISOString();

async function seed(){
  const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),ledger=new LedgerService(repo,k);
  await repo.saveUser({id:'founder',displayName:'Founder',locale:'fr',createdAt:stamp()});
  await repo.saveUser({id:'u1',displayName:'Alice',locale:'fr',createdAt:stamp()});
  await repo.saveUser({id:'u2',displayName:'Bob',locale:'fr',createdAt:stamp()});
  await repo.saveGroup({id:'g1',tenantId:'tenant_wallet',name:'Groupe Wallet',kind:'association',governanceModel:'community',createdBy:'founder',status:'active',createdAt:stamp()});
  await repo.saveMembership({id:'m1',tenantId:'tenant_wallet',groupId:'g1',userId:'u1',status:'active',roles:['member'],joinedAt:stamp(),updatedAt:stamp()});
  await repo.saveMembership({id:'m2',tenantId:'tenant_wallet',groupId:'g1',userId:'u2',status:'active',roles:['member'],joinedAt:stamp(),updatedAt:stamp()});
  const base={tenantId:'tenant_wallet',groupId:'g1',aliases:[],status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:stamp(),updatedAt:stamp()};
  await repo.saveRubricDefinition({...base,id:'r_aide',name:'Aide locale',facets:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'NON_REFUNDABLE',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'}});
  await repo.saveRubricDefinition({...base,id:'r_save',name:'Épargne',facets:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'FULLY_REFUNDABLE',replenishment:'NONE',interestMode:'CUSTOM',eligibilityMode:'RULE_BASED'}});
  ctx(k,'founder',['founder','manager'],'g1');
  await ledger.recordCashContribution({tenantId:'tenant_wallet',groupId:'g1',membershipId:'m1',amount:1000,rubricId:'r_aide',idempotencyKey:'aide-1'});
  await ledger.recordCashContribution({tenantId:'tenant_wallet',groupId:'g1',membershipId:'m1',amount:5000,rubricId:'r_save',idempotencyKey:'save-1'});
  return{repo,k,ledger,wallet:new WalletService(repo,k,ledger)};
}

test('Wallet derives personal balances from canonical ledger and never makes Aide locale spendable',async()=>{
  const {repo,k,wallet}=await seed();ctx(k,'u1',['member'],'g1');
  const beforeEntries=(await repo.listLedgerEntries('tenant_wallet','g1')).length,p=await wallet.projection();
  const aid=p.subaccounts.find(x=>x.sourceId==='r_aide'),save=p.subaccounts.find(x=>x.sourceId==='r_save');
  assert.equal(aid?.trackedBalance,1000);assert.equal(aid?.availableBalance,0);assert.equal(aid?.access,'ACTIVITY_ONLY');
  assert.equal(save?.trackedBalance,5000);assert.equal(save?.availableBalance,5000);assert.equal(save?.access,'AVAILABLE');
  assert.equal(p.walletBalance,5000);assert.equal(p.activityOnlyBalance,1000);assert.equal(p.providerTopupEnabled,false);assert.equal(p.externalPaymentRailEnabled,false);
  const r=await wallet.reserve({groupId:'g1',subaccountKey:'rubric:r_save',amount:1200,purpose:'Projet futur'});
  const after=await wallet.projection();assert.equal(after.availableBalance,3800);assert.equal(after.reservedBalance,1200);
  assert.equal((await repo.listLedgerEntries('tenant_wallet','g1')).length,beforeEntries,'reservation must not mutate canonical ledger');
  await wallet.release(r.id);const released=await wallet.projection();assert.equal(released.availableBalance,5000);assert.equal(released.reservedBalance,0);
});

test('Wallet projection is personal and does not expose another member balance',async()=>{
  const {k,wallet}=await seed();ctx(k,'u2',['member'],'g1');const p=await wallet.projection();assert.equal(p.ownerUserId,'u2');assert.equal(p.walletBalance,0);assert.equal(p.subaccounts.length,0);
});

test('Wallet UI clearly separates available money from non-spendable activity and external providers',()=>{
  const ui=fs.readFileSync('apps/web/src/wallet-ui.js','utf8');
  assert.match(ui,/projection personnelle du Ledger canonique/);
  assert.match(ui,/ne deviennent pas de l’argent disponible/);
  assert.match(ui,/Mobile Money\/cartes restent désactivées/);
  assert.match(ui,/Réserver une partie/);
});
