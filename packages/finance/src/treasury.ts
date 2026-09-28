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
  private async save(groupId:Id,kind:Kind,title:string,data:Record<string,string|number|boolean|null>,recordId?:Id):Promise<FinanceRecord>{
    await this.access(groupId,true);const ctx=this.kernel.context.get(),stamp=now();
    const record:FinanceRecord={id:recordId?.trim()||makeId('finance'),tenantId:ctx.tenantId,groupId,moduleId:kind==='SAVINGS_PLAN'?'RUBRIC.SAVINGS':'FINANCE.LEDGER',
      title,status:'ACTIVE',tags:['specialized-finance','kind:'+kind],data:{...data,specializedKind:kind},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  private async list(groupId:Id,kind:Kind):Promise<FinanceRecord[]>{
    await this.access(groupId,false);const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)).filter(r=>r.data.specializedKind===kind) as FinanceRecord[];
  }
  async createSavingsPlan(groupId:Id,input:{id?:Id;membershipId:Id;name:string;targetAmount?:number;currency?:string}){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),member=await this.repo.getMembership(ctx.tenantId,groupId,input.membershipId);
    if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');if(input.targetAmount!==undefined&&(!Number.isSafeInteger(input.targetAmount)||input.targetAmount<0))throw Error('INVALID_TARGET_AMOUNT');
    const name=input.name.trim();if(!name)throw Error('NAME_REQUIRED');
    const existing=input.id?await this.repo.getWorkspaceRecord(ctx.tenantId,input.id):undefined;if(existing){if(existing.groupId!==groupId||String(existing.data.specializedKind)!=='SAVINGS_PLAN')throw Error('IDEMPOTENCY_CONFLICT');return existing as FinanceRecord;}
    return this.save(groupId,'SAVINGS_PLAN',name,{membershipId:member.id,targetAmount:input.targetAmount??null,currency:input.currency??'XAF'},input.id);
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
    amount(input.amount);const note=input.note.trim();if(!note)throw Error('NOTE_REQUIRED');const ctx=this.kernel.context.get(),recordId='finance_opening_'+encodeURIComponent(JSON.stringify([ctx.tenantId,groupId,input.idempotencyKey]));
    const existing=await this.repo.getWorkspaceRecord(ctx.tenantId,recordId),record=existing??await this.save(groupId,'OPENING_BALANCE','Opening balance',{amount:input.amount,currency:input.currency??'XAF',note},recordId);
    if(existing&&(Number(existing.data.amount)!==input.amount||String(existing.data.note??'')!==note))throw Error('IDEMPOTENCY_CONFLICT');
    const entry=await this.ledger.recordCashMovement({tenantId:ctx.tenantId,groupId,amount:input.amount,currency:input.currency??'XAF',direction:'in',
      counterAccountCode:'OPENING_EQUITY',counterAccountType:'equity',descriptionCode:'LEDGER_OPENING_BALANCE',sourceType:'opening_balance',
      sourceId:record.id,idempotencyKey:input.idempotencyKey,kind:'opening_balance'});
    return{record,entry};
  }
  async createCustody(groupId:Id,input:{id?:Id;name:string;holder:string;currency?:string}){
    const name=input.name.trim(),holder=input.holder.trim();if(!name||!holder)throw Error('CUSTODY_NAME_AND_HOLDER_REQUIRED');
    const ctx=this.kernel.context.get(),existing=input.id?await this.repo.getWorkspaceRecord(ctx.tenantId,input.id):undefined;if(existing){if(existing.groupId!==groupId||String(existing.data.specializedKind)!=='CUSTODY_ACCOUNT')throw Error('IDEMPOTENCY_CONFLICT');return existing as FinanceRecord;}
    return this.save(groupId,'CUSTODY_ACCOUNT',name,{holder,currency:input.currency??'XAF'},input.id);
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
