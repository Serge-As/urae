import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {CompletionSuiteService} from '../.build/packages/completion/src/index.js';
import {ReceivablesService,TreasuryService,RiskFinanceService} from '../.build/packages/finance/src/index.js';
import {MarketService} from '../.build/packages/market/src/index.js';
import {HistoricalImportService} from '../.build/packages/imports/src/index.js';

const context=()=>({tenantId:'tenant_f',actorId:'owner',activeGroupId:'group_f',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
async function setup(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();kernel.context.set(context());
  await repo.saveUser({id:'owner',displayName:'Owner',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveUser({id:'member',displayName:'Member',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveGroup({id:'group_f',tenantId:'tenant_f',name:'Groupe F',kind:'association',governanceModel:'community',status:'active',createdBy:'owner',createdAt:new Date().toISOString()});
  await repo.saveMembership({id:'m_owner',tenantId:'tenant_f',groupId:'group_f',userId:'owner',roles:['founder','manager'],status:'active',joinedAt:new Date().toISOString()});
  await repo.saveMembership({id:'m_member',tenantId:'tenant_f',groupId:'group_f',userId:'member',roles:['member'],status:'active',joinedAt:new Date().toISOString()});
  const ledger=new LedgerService(repo,kernel),completion=new CompletionSuiteService(repo,kernel);
  return{repo,kernel,ledger,completion,receivables:new ReceivablesService(repo,kernel),treasury:new TreasuryService(repo,kernel,ledger),risk:new RiskFinanceService(repo,kernel,ledger),market:new MarketService(repo,kernel)};
}

test('expected contribution becomes settled only after an explicit receipt allocation',async()=>{
  const {ledger,receivables}=await setup();
  const obligation=await receivables.createExpected('group_f',{membershipId:'m_member',title:'September due',dueAt:'2026-09-01T00:00:00Z',amount:10000});
  const receipt=await ledger.recordCashContribution({tenantId:'tenant_f',groupId:'group_f',membershipId:'m_member',amount:10000,idempotencyKey:'receipt-a'});
  let report=await receivables.report('group_f','2026-09-13T00:00:00Z');
  assert.equal(report[0].outstanding,10000);
  await receivables.allocate('group_f',{obligationId:obligation.id,receiptId:receipt.id,amount:10000});
  report=await receivables.report('group_f','2026-09-13T00:00:00Z');
  assert.equal(report[0].outstanding,0);assert.equal(report[0].status,'SETTLED');
});

test('savings, opening balance and custody all reuse the canonical ledger',async()=>{
  const {ledger,treasury}=await setup();
  await treasury.openingBalance('group_f',{amount:100000,note:'Verified opening cash',idempotencyKey:'opening-a'});
  const plan=await treasury.createSavingsPlan('group_f',{membershipId:'m_member',name:'School savings',targetAmount:50000});
  await treasury.depositSavings('group_f',plan.id,20000,'save-a');
  assert.equal((await treasury.savingsPosition('group_f',plan.id)).balance,20000);
  await treasury.withdrawSavings('group_f',plan.id,5000,'save-b');
  assert.equal((await treasury.savingsPosition('group_f',plan.id)).balance,15000);
  const custody=await treasury.createCustody('group_f',{name:'Bank deposit','holder':'Treasurer'});
  await treasury.sendToCustody('group_f',custody.id,30000,'custody-a');
  await treasury.returnFromCustody('group_f',custody.id,10000,'custody-b');
  const summary=await ledger.summary('tenant_f','group_f');
  assert.equal(summary.entryCount,5);assert.equal(summary.cashBalance,95000);
});

test('loan guarantees and solidarity cases remain explicit and financially traceable',async()=>{
  const {ledger,risk}=await setup();
  await ledger.recordCashContribution({tenantId:'tenant_f',groupId:'group_f',membershipId:'m_owner',amount:40000,idempotencyKey:'seed-solidarity'});
  const guarantee=await risk.guarantor('group_f',{loanId:'loan-1',membershipId:'m_member',guaranteedAmount:15000});
  assert.equal(guarantee.data.guaranteedAmount,15000);
  const support=await risk.solidarityCase('group_f',{beneficiaryMembershipId:'m_member',title:'Hospital help',approvedAmount:20000});
  await risk.fund('group_f',support.id,20000,'solidarity-in');
  await risk.disburse('group_f',support.id,12000,'solidarity-out');
  await assert.rejects(()=>risk.disburse('group_f',support.id,25000,'solidarity-too-much'),/SOLIDARITY_AMOUNT_EXCEEDS_APPROVAL/);
});

test('market engine controls reservation delivery return dispute and group-buy threshold',async()=>{
  const {market}=await setup();
  const stock=await market.createStock('group_f',{sku:'RICE25',name:'Rice 25kg',quantity:10});
  const order=await market.createOrder('group_f',{stockItemId:stock.id,quantity:4,customerRef:'member:m_member'});
  let delivered=await market.deliver('group_f',order.id,2);assert.equal(delivered.data.state,'PARTIAL');
  delivered=await market.deliver('group_f',order.id,2);assert.equal(delivered.data.state,'DELIVERED');
  const returned=await market.returnItems('group_f',order.id,1,'damaged bag');assert.equal(returned.data.returnedQuantity,1);
  const disputed=await market.dispute('group_f',order.id,'quantity contested');assert.equal(disputed.data.state,'DISPUTED');
  const campaign=await market.createGroupBuy('group_f',{title:'Rice buy',stockItemId:stock.id,thresholdQuantity:5,deadline:'2027-01-01T00:00:00Z'});
  let c=await market.commitGroupBuy('group_f',campaign.id,'m_member',3);assert.equal(c.data.state,'OPEN');
  c=await market.commitGroupBuy('group_f',campaign.id,'m_owner',2);assert.equal(c.data.state,'THRESHOLD_MET');
});

test('R2-backed contribution import is approved, replayable and preserves effective date',async()=>{
  const {repo,kernel,ledger,completion}=await setup();
  const objects=new Map();
  const store={
    async put(key,value){objects.set(key,String(value));},
    async get(key){const v=objects.get(key);return v===undefined?null:{async text(){return v;}};}
  };
  const service=new HistoricalImportService(repo,kernel,ledger,completion,store);
  const csv='membershipId;amount;effectiveAt\nm_member;7000;2026-08-31T10:00:00Z\n';
  let {batch,preview}=await service.stage('group_f',{title:'August archive',kind:'CONTRIBUTIONS',text:csv});
  assert.equal(preview.issues.length,0);
  batch=await service.approve('group_f',batch.id);
  assert.equal(batch.data.completionState,'APPROVED');
  batch=await service.apply('group_f',batch.id);
  assert.equal(batch.data.completionState,'APPLIED');assert.equal(batch.data.appliedCount,1);
  const again=await service.apply('group_f',batch.id);assert.equal(again.id,batch.id);
  const receipts=await repo.listContributionReceipts('tenant_f','group_f');
  assert.equal(receipts.length,1);assert.equal(receipts[0].receivedAt,'2026-08-31T10:00:00.000Z');
});
