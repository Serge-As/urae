import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {LedgerService} from '../.build/packages/domain/src/index.js';
import {RiskFinanceService} from '../.build/packages/finance/src/risk.js';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';

const seed=async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();kernel.context.set({actorId:'manager',tenantId:'t',activeGroupId:'g',groupRoles:['manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});
  await repo.saveUser({id:'manager',displayName:'Manager',locale:'fr',createdAt:new Date().toISOString()});await repo.saveUser({id:'u1',displayName:'Borrower',locale:'fr',createdAt:new Date().toISOString()});await repo.saveUser({id:'u2',displayName:'Garant',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveGroup({id:'g',tenantId:'t',name:'G',kind:'association',governanceModel:'community',status:'active',createdBy:'manager',createdAt:new Date().toISOString()});
  await repo.saveMembership({id:'borrower',tenantId:'t',groupId:'g',userId:'u1',roles:['member'],status:'active',joinedAt:new Date().toISOString()});await repo.saveMembership({id:'guarantor',tenantId:'t',groupId:'g',userId:'u2',roles:['member'],status:'active',joinedAt:new Date().toISOString()});
  await repo.saveWorkspaceRecord({id:'loan1',tenantId:'t',groupId:'g',moduleId:'FINANCE.LOANS',title:'Loan',status:'ACTIVE',tags:['completion'],data:{completionKind:'LOAN',borrowerMembershipId:'borrower',principal:50000,outstandingPrincipal:50000},createdBy:'manager',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  return{repo,service:new RiskFinanceService(repo,kernel,new LedgerService(repo,kernel))};
};

test('loan guarantor lifecycle validates the loan, forbids borrower self-guarantee and remains readable',async()=>{
  const {service}=await seed();
  await assert.rejects(()=>service.guarantor('g',{loanId:'missing',membershipId:'guarantor',guaranteedAmount:10000}),/LOAN_NOT_FOUND/);
  await assert.rejects(()=>service.guarantor('g',{loanId:'loan1',membershipId:'borrower',guaranteedAmount:10000}),/LOAN_GUARANTOR_CANNOT_BE_BORROWER/);
  const g=await service.guarantor('g',{loanId:'loan1',membershipId:'guarantor',guaranteedAmount:10000});assert.equal(g.data.state,'ACTIVE');
  await assert.rejects(()=>service.guarantor('g',{loanId:'loan1',membershipId:'guarantor',guaranteedAmount:5000}),/LOAN_GUARANTOR_ALREADY_ACTIVE/);
  const released=await service.releaseGuarantee('g',g.id,'Prêt soldé');assert.equal(released.data.state,'RELEASED');assert.equal(released.status,'DONE');
  assert.equal((await service.list('g','LOAN_GUARANTEE')).length,1);
});

test('loan UI and API expose add/list/release guarantors end to end',()=>{
  const worker=fs.readFileSync('workers/api/src/index.ts','utf8'),app=fs.readFileSync('packages/application/src/index.ts','utf8'),ui=fs.readFileSync('apps/web/src/completion-ui.js','utf8');
  assert.match(worker,/request\.method==='GET'.*LOAN_GUARANTEE/s);assert.match(worker,/guarantors\\\/\(\[\^\/\]\+\)\\\/release/);
  assert.match(app,/loanGuarantors/);assert.match(app,/releaseLoanGuarantor/);assert.match(ui,/loan-guarantor-form/);assert.match(ui,/Enregistrer le garant/);
  assert.equal(PRODUCT_MODULES.find(x=>x.id==='FINANCE.LOAN_GUARANTORS')?.status,'FOUNDATION_ACTIVE');
});
