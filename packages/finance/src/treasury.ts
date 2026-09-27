import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';

const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const amount=(value:number)=>{if(!Number.isSafeInteger(value)||value<=0)throw Error('INVALID_AMOUNT');return value;};

type Kind='SAVINGS_PLAN'|'CUSTODY_ACCOUNT'|'OPENING_BALANCE';
export interface FinanceRecord extends WorkspaceRecord{data:WorkspaceRecord['data']&{specializedKind:Kind};}

export class TreasuryService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public ledger:LedgerService){}
  private async access(groupId:Id,manage=false):Promise<Membership|undefined>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member)throw Error('FORBIDDEN_SCOPE');
    if(manage&&!member.roles.some(r=>managerRoles.has(r)))throw Error('FORBIDDEN_SCOPE');
    return member;
  }
  private async save(groupId:Id,kind:Kind,title:string,data:Record<string,string|number|boolean|null>):Promise<FinanceRecord>{
    await this.access(groupId,true);const ctx=this.kernel.context.get(),stamp=now();
    const record:FinanceRecord={id:makeId('finance'),tenantId:ctx.tenantId,groupId,moduleId:kind==='SAVINGS_PLAN'?'RUBRIC.SAVINGS':'FINANCE.LEDGER',
      title,status:'ACTIVE',tags:['specialized-finance','kind:'+kind],data:{...data,specializedKind:kind},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  private async list(groupId:Id,kind:Kind):Promise<FinanceRecord[]>{
    await this.access(groupId,false);const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)).filter(r=>r.data.specializedKind===kind) as FinanceRecord[];
  }
  async createSavingsPlan(groupId:Id,input:{membershipId:Id;name:string;targetAmount?:number;currency?:string}){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),member=await this.repo.getMembership(ctx.tenantId,groupId,input.membershipId);
    if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');if(input.targetAmount!==undefined&&(!Number.isSafeInteger(input.targetAmount)||input.targetAmount<0))throw Error('INVALID_TARGET_AMOUNT');
    const name=input.name.trim();if(!name)throw Error('NAME_REQUIRED');
    return this.save(groupId,'SAVINGS_PLAN',name,{membershipId:member.id,targetAmount:input.targetAmount??null,currency:input.currency??'XAF'});
  }
  async savingsPosition(groupId:Id,planId:Id){
    const plan=(await this.list(groupId,'SAVINGS_PLAN')).find(x=>x.id===planId);if(!plan)throw Error('SAVINGS_PLAN_NOT_FOUND');
    const ctx=this.kernel.context.get(),code=('SAVINGS_LIABILITY_'+plan.id).replace(/[^A-Z0-9_]/gi,'_').toUpperCase();
    const account=(await this.repo.listLedgerAccounts(ctx.tenantId,groupId)).find(a=>a.code===code),entries=await this.repo.listLedgerEntries(ctx.tenantId,groupId);
    let balance=0;if(account)for(const e of entries)for(const line of e.lines)if(line.accountId===account.id)balance+=line.credit-line.debit;
    return{planId,balance,currency:String(plan.data.currency??'XAF'),targetAmount:Number(plan.data.targetAmount??0)};
  }
  async depositSavings(groupId:Id,planId:Id,value:number,key:string){
    amount(value);const plan=(await this.list(groupId,'SAVINGS_PLAN')).find(x=>x.id===planId);if(!plan)throw Error('SAVINGS_PLAN_NOT_FOUND');
    return this.ledger.recordCashMovement({tenantId:plan.tenantId,groupId,amount:value,currency:String(plan.data.currency??'XAF'),direction:'in',
      counterAccountCode:'SAVINGS_LIABILITY_'+plan.id,counterAccountType:'liability',descriptionCode:'LEDGER_SAVINGS_DEPOSIT',
      sourceType:'savings_plan',sourceId:plan.id,idempotencyKey:key,kind:'cash_in'});
  }
  async withdrawSavings(groupId:Id,planId:Id,value:number,key:string){
    amount(value);const position=await this.savingsPosition(groupId,planId);if(position.balance<value)throw Error('INSUFFICIENT_SAVINGS_BALANCE');
    const plan=(await this.list(groupId,'SAVINGS_PLAN')).find(x=>x.id===planId)!;
    return this.ledger.recordCashMovement({tenantId:plan.tenantId,groupId,amount:value,currency:position.currency,direction:'out',
      counterAccountCode:'SAVINGS_LIABILITY_'+plan.id,counterAccountType:'liability',descriptionCode:'LEDGER_SAVINGS_WITHDRAWAL',
      sourceType:'savings_plan',sourceId:plan.id,idempotencyKey:key,kind:'cash_out'});
  }
  async openingBalance(groupId:Id,input:{amount:number;currency?:string;note:string;idempotencyKey:string}){
    amount(input.amount);const note=input.note.trim();if(!note)throw Error('NOTE_REQUIRED');const ctx=this.kernel.context.get();
    const record=await this.save(groupId,'OPENING_BALANCE','Opening balance',{amount:input.amount,currency:input.currency??'XAF',note});
    const entry=await this.ledger.recordCashMovement({tenantId:ctx.tenantId,groupId,amount:input.amount,currency:input.currency??'XAF',direction:'in',
      counterAccountCode:'OPENING_EQUITY',counterAccountType:'equity',descriptionCode:'LEDGER_OPENING_BALANCE',sourceType:'opening_balance',
      sourceId:record.id,idempotencyKey:input.idempotencyKey,kind:'opening_balance'});
    return{record,entry};
  }
  async createEnvelope(groupId:Id,input:{name:string;budgetAmount:number;purpose?:string;currency?:string}){
    await this.access(groupId,true);const name=input.name.trim();if(!name)throw Error('ENVELOPE_NAME_REQUIRED');if(!Number.isSafeInteger(input.budgetAmount)||input.budgetAmount<0)throw Error('INVALID_ENVELOPE_BUDGET');
    const ctx=this.kernel.context.get(),stamp=now(),record:FinanceRecord={id:makeId('envelope'),tenantId:ctx.tenantId,groupId,moduleId:'FINANCE.ENVELOPES',title:name,summary:input.purpose?.trim().slice(0,800),status:'ACTIVE',tags:['budget-envelope','classification-only'],data:{specializedKind:'BUDGET_ENVELOPE' as any,budgetAmount:input.budgetAmount,allocatedAmount:0,remainingAmount:input.budgetAmount,currency:input.currency??'XAF',allocationsJson:'[]',ledgerMutation:false},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'BUDGET_ENVELOPE_CREATED',targetType:'workspace_record',targetId:record.id,requestId:ctx.requestId,metadata:{groupId,budgetAmount:input.budgetAmount}}));return record;
  }
  async envelopes(groupId:Id){
    await this.access(groupId,false);const ctx=this.kernel.context.get();return (await this.repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.ENVELOPES',groupId)).filter(x=>x.status!=='ARCHIVED');
  }
  async allocateEnvelope(groupId:Id,envelopeId:Id,input:{amount:number;ledgerEntryId?:Id;note?:string}){
    await this.access(groupId,true);amount(input.amount);const ctx=this.kernel.context.get(),record=await this.repo.getWorkspaceRecord(ctx.tenantId,envelopeId);if(!record||record.groupId!==groupId||record.moduleId!=='FINANCE.ENVELOPES')throw Error('ENVELOPE_NOT_FOUND');
    if(input.ledgerEntryId&&!await this.repo.getLedgerEntry(ctx.tenantId,groupId,input.ledgerEntryId))throw Error('LEDGER_ENTRY_NOT_FOUND');
    let allocations:Array<{id:string;amount:number;ledgerEntryId?:string;note?:string;allocatedAt:string;allocatedBy:string}>;try{allocations=JSON.parse(String(record.data.allocationsJson??'[]'));}catch{allocations=[];}
    if(input.ledgerEntryId&&allocations.some(x=>x.ledgerEntryId===input.ledgerEntryId))throw Error('ENVELOPE_LEDGER_ENTRY_ALREADY_ALLOCATED');
    const budget=Number(record.data.budgetAmount??0),allocated=allocations.reduce((n,x)=>n+Number(x.amount??0),0);if(allocated+input.amount>budget)throw Error('ENVELOPE_BUDGET_EXCEEDED');
    allocations.push({id:makeId('env_alloc'),amount:input.amount,ledgerEntryId:input.ledgerEntryId,note:input.note?.trim().slice(0,500),allocatedAt:now(),allocatedBy:ctx.actorId});
    const next={...record,data:{...record.data,allocationsJson:JSON.stringify(allocations),allocatedAmount:allocated+input.amount,remainingAmount:budget-allocated-input.amount,ledgerMutation:false},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'BUDGET_ENVELOPE_ALLOCATED',targetType:'workspace_record',targetId:record.id,requestId:ctx.requestId,metadata:{groupId,amount:input.amount,ledgerEntryId:input.ledgerEntryId??null}}));return next;
  }
  async createCustody(groupId:Id,input:{name:string;holder:string;currency?:string}){
    const name=input.name.trim(),holder=input.holder.trim();if(!name||!holder)throw Error('CUSTODY_NAME_AND_HOLDER_REQUIRED');
    return this.save(groupId,'CUSTODY_ACCOUNT',name,{holder,currency:input.currency??'XAF'});
  }
  async custodyPosition(groupId:Id,custodyId:Id){
    const record=(await this.list(groupId,'CUSTODY_ACCOUNT')).find(x=>x.id===custodyId);if(!record)throw Error('CUSTODY_ACCOUNT_NOT_FOUND');
    const ctx=this.kernel.context.get(),code=('CUSTODY_ASSET_'+record.id).replace(/[^A-Z0-9_]/gi,'_').toUpperCase();
    const account=(await this.repo.listLedgerAccounts(ctx.tenantId,groupId)).find(a=>a.code===code),entries=await this.repo.listLedgerEntries(ctx.tenantId,groupId);
    let balance=0;if(account)for(const e of entries)for(const line of e.lines)if(line.accountId===account.id)balance+=line.debit-line.credit;
    return{custodyId,balance,currency:String(record.data.currency??'XAF'),holder:String(record.data.holder??''),name:record.title,internalOnly:true,externalPaymentRail:false};
  }
  async sendToCustody(groupId:Id,custodyId:Id,value:number,key:string){
    amount(value);const record=(await this.list(groupId,'CUSTODY_ACCOUNT')).find(x=>x.id===custodyId);if(!record)throw Error('CUSTODY_ACCOUNT_NOT_FOUND');
    return this.ledger.recordCashMovement({tenantId:record.tenantId,groupId,amount:value,currency:String(record.data.currency??'XAF'),direction:'out',
      counterAccountCode:'CUSTODY_ASSET_'+record.id,counterAccountType:'asset',descriptionCode:'LEDGER_CASH_TO_CUSTODY',
      sourceType:'custody',sourceId:record.id,idempotencyKey:key,kind:'transfer'});
  }
  async returnFromCustody(groupId:Id,custodyId:Id,value:number,key:string){
    amount(value);const record=(await this.list(groupId,'CUSTODY_ACCOUNT')).find(x=>x.id===custodyId);if(!record)throw Error('CUSTODY_ACCOUNT_NOT_FOUND');
    return this.ledger.recordCashMovement({tenantId:record.tenantId,groupId,amount:value,currency:String(record.data.currency??'XAF'),direction:'in',
      counterAccountCode:'CUSTODY_ASSET_'+record.id,counterAccountType:'asset',descriptionCode:'LEDGER_CUSTODY_TO_CASH',
      sourceType:'custody',sourceId:record.id,idempotencyKey:key,kind:'transfer'});
  }
}
