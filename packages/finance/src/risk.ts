import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';

const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const validAmount=(v:number)=>{if(!Number.isSafeInteger(v)||v<=0)throw Error('INVALID_AMOUNT');return v;};

type Kind='SOLIDARITY_CASE'|'LOAN_GUARANTEE';
export interface RiskRecord extends WorkspaceRecord{data:WorkspaceRecord['data']&{specializedKind:Kind};}

export class RiskFinanceService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public ledger:LedgerService){}
  private async access(groupId:Id,manage=false):Promise<Membership|undefined>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member)throw Error('FORBIDDEN_SCOPE');
    if(manage&&!member.roles.some(r=>managerRoles.has(r)))throw Error('FORBIDDEN_SCOPE');
    return member;
  }
  private async save(groupId:Id,kind:Kind,title:string,data:Record<string,string|number|boolean|null>):Promise<RiskRecord>{
    await this.access(groupId,true);const ctx=this.kernel.context.get(),stamp=now();
    const record:RiskRecord={id:makeId('risk'),tenantId:ctx.tenantId,groupId,
      moduleId:kind==='SOLIDARITY_CASE'?'SOLIDARITY.FUND':'FINANCE.LOAN_GUARANTORS',title,status:'ACTIVE',
      tags:['specialized-finance','kind:'+kind],data:{...data,specializedKind:kind},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  async list(groupId:Id,kind:Kind){
    await this.access(groupId,false);const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)).filter(r=>r.data.specializedKind===kind) as RiskRecord[];
  }
  async guarantor(groupId:Id,input:{loanId:Id;membershipId:Id;guaranteedAmount:number}){
    await this.access(groupId,true);validAmount(input.guaranteedAmount);const ctx=this.kernel.context.get();
    const loan=await this.repo.getWorkspaceRecord(ctx.tenantId,input.loanId);
    if(!loan||loan.groupId!==groupId||loan.moduleId!=='FINANCE.LOANS'||String(loan.data.completionKind??'')!=='LOAN')throw Error('LOAN_NOT_FOUND');
    const member=await this.repo.getMembership(ctx.tenantId,groupId,input.membershipId);if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');
    if(String(loan.data.borrowerMembershipId??'')===member.id)throw Error('LOAN_GUARANTOR_CANNOT_BE_BORROWER');
    const existing=(await this.list(groupId,'LOAN_GUARANTEE')).find(x=>String(x.data.loanId??'')===input.loanId&&String(x.data.membershipId??'')===member.id&&String(x.data.state??'ACTIVE')==='ACTIVE');
    if(existing)throw Error('LOAN_GUARANTOR_ALREADY_ACTIVE');
    return this.save(groupId,'LOAN_GUARANTEE','Guarantee '+input.loanId,{loanId:input.loanId,membershipId:member.id,guaranteedAmount:input.guaranteedAmount,state:'ACTIVE'});
  }
  async releaseGuarantee(groupId:Id,guaranteeId:Id,reason:string):Promise<RiskRecord>{
    await this.access(groupId,true);const ctx=this.kernel.context.get(),record=await this.repo.getWorkspaceRecord(ctx.tenantId,guaranteeId);
    if(!record||record.groupId!==groupId||record.moduleId!=='FINANCE.LOAN_GUARANTORS'||String(record.data.specializedKind??'')!=='LOAN_GUARANTEE')throw Error('LOAN_GUARANTEE_NOT_FOUND');
    const guarantee=record as RiskRecord;
    if(String(guarantee.data.state??'ACTIVE')!=='ACTIVE')return guarantee;
    const why=reason.trim();if(!why)throw Error('GUARANTEE_RELEASE_REASON_REQUIRED');
    const updated:RiskRecord={...guarantee,status:'DONE',data:{...guarantee.data,state:'RELEASED',releasedAt:now(),releasedBy:ctx.actorId,releaseReason:why},updatedAt:now()};
    await this.repo.saveWorkspaceRecord(updated);return updated;
  }
  async solidarityCase(groupId:Id,input:{beneficiaryMembershipId:Id;title:string;approvedAmount:number;currency?:string}){
    await this.access(groupId,true);validAmount(input.approvedAmount);const ctx=this.kernel.context.get();
    const member=await this.repo.getMembership(ctx.tenantId,groupId,input.beneficiaryMembershipId);if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');
    const title=input.title.trim();if(!title)throw Error('TITLE_REQUIRED');
    return this.save(groupId,'SOLIDARITY_CASE',title,{beneficiaryMembershipId:member.id,approvedAmount:input.approvedAmount,currency:input.currency??'XAF',state:'APPROVED'});
  }
  async fund(groupId:Id,caseId:Id,value:number,key:string){
    validAmount(value);const record=(await this.list(groupId,'SOLIDARITY_CASE')).find(x=>x.id===caseId);if(!record)throw Error('SOLIDARITY_CASE_NOT_FOUND');
    return this.ledger.recordCashMovement({tenantId:record.tenantId,groupId,amount:value,currency:String(record.data.currency??'XAF'),direction:'in',
      counterAccountCode:'SOLIDARITY_FUND_LIABILITY',counterAccountType:'liability',descriptionCode:'LEDGER_SOLIDARITY_FUNDING',
      sourceType:'solidarity_case',sourceId:record.id,idempotencyKey:key,kind:'cash_in'});
  }
  async disburse(groupId:Id,caseId:Id,value:number,key:string){
    validAmount(value);const record=(await this.list(groupId,'SOLIDARITY_CASE')).find(x=>x.id===caseId);if(!record)throw Error('SOLIDARITY_CASE_NOT_FOUND');
    if(value>Number(record.data.approvedAmount??0))throw Error('SOLIDARITY_AMOUNT_EXCEEDS_APPROVAL');
    return this.ledger.recordCashMovement({tenantId:record.tenantId,groupId,amount:value,currency:String(record.data.currency??'XAF'),direction:'out',
      counterAccountCode:'SOLIDARITY_FUND_LIABILITY',counterAccountType:'liability',descriptionCode:'LEDGER_SOLIDARITY_DISBURSEMENT',
      sourceType:'solidarity_case',sourceId:record.id,idempotencyKey:key,kind:'cash_out'});
  }
}
