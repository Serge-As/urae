import type {Id,Membership,Obligation,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const positive=(value:number)=>{if(!Number.isSafeInteger(value)||value<=0)throw Error('INVALID_AMOUNT');return value;};

export interface PaymentAllocation extends WorkspaceRecord{
  data:WorkspaceRecord['data']&{specializedKind:'PAYMENT_ALLOCATION';obligationId:Id;receiptId:Id;amount:number;currency:string};
}

export class ReceivablesService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private async access(groupId:Id,manage=false):Promise<Membership|undefined>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member)throw Error('FORBIDDEN_SCOPE');
    if(manage&&!member.roles.some(r=>managerRoles.has(r)))throw Error('FORBIDDEN_SCOPE');
    return member;
  }
  private async allocations(groupId:Id):Promise<PaymentAllocation[]>{
    const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.ARREARS',groupId))
      .filter(r=>r.data.specializedKind==='PAYMENT_ALLOCATION') as PaymentAllocation[];
  }
  async createExpected(groupId:Id,input:{membershipId:Id;title:string;dueAt:string;amount:number;currency?:string;rubricId?:Id}):Promise<Obligation>{
    await this.access(groupId,true);const ctx=this.kernel.context.get(),member=await this.repo.getMembership(ctx.tenantId,groupId,input.membershipId);
    if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');positive(input.amount);
    if(!Number.isFinite(Date.parse(input.dueAt)))throw Error('INVALID_DUE_AT');
    const title=input.title.trim();if(!title)throw Error('TITLE_REQUIRED');
    const obligation:Obligation={id:makeId('obligation'),tenantId:ctx.tenantId,groupId,assigneeId:member.userId,type:'EXPECTED_CONTRIBUTION',
      title,dueAt:new Date(input.dueAt).toISOString(),priority:'normal',status:'open',sourceType:'rubric_expectation',sourceId:input.rubricId??groupId,
      amount:{currency:input.currency??'XAF',amount:input.amount}};
    await this.repo.saveObligation(obligation);return obligation;
  }
  async allocate(groupId:Id,input:{obligationId:Id;receiptId:Id;amount:number}):Promise<PaymentAllocation>{
    await this.access(groupId,true);positive(input.amount);const ctx=this.kernel.context.get();
    const obligation=(await this.repo.listObligations(ctx.tenantId)).find(o=>o.id===input.obligationId&&o.groupId===groupId);
    if(!obligation?.amount)throw Error('OBLIGATION_NOT_FOUND');
    const receipt=(await this.repo.listContributionReceipts(ctx.tenantId,groupId)).find(r=>r.id===input.receiptId);if(!receipt)throw Error('RECEIPT_NOT_FOUND');
    if(receipt.amount.currency!==obligation.amount.currency)throw Error('ALLOCATION_CURRENCY_MISMATCH');
    const allocations=await this.allocations(groupId);
    const receiptUsed=allocations.filter(a=>a.data.receiptId===receipt.id).reduce((n,a)=>n+Number(a.data.amount),0);
    const obligationUsed=allocations.filter(a=>a.data.obligationId===obligation.id).reduce((n,a)=>n+Number(a.data.amount),0);
    if(receiptUsed+input.amount>receipt.amount.amount)throw Error('RECEIPT_OVERALLOCATED');
    if(obligationUsed+input.amount>obligation.amount.amount)throw Error('OBLIGATION_OVERALLOCATED');
    const stamp=now(),record:PaymentAllocation={id:makeId('allocation'),tenantId:ctx.tenantId,groupId,moduleId:'FINANCE.ARREARS',
      title:'Allocation '+receipt.id,status:'ACTIVE',tags:['specialized-finance','kind:PAYMENT_ALLOCATION'],
      data:{specializedKind:'PAYMENT_ALLOCATION',obligationId:obligation.id,receiptId:receipt.id,amount:input.amount,currency:receipt.amount.currency},
      createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    if(obligationUsed+input.amount===obligation.amount.amount)await this.repo.saveObligation({...obligation,status:'completed'});
    return record;
  }
  async report(groupId:Id,asOf=now()){
    await this.access(groupId,false);const ctx=this.kernel.context.get(),cutoff=Date.parse(asOf);if(!Number.isFinite(cutoff))throw Error('INVALID_AS_OF');
    const obligations=(await this.repo.listObligations(ctx.tenantId)).filter(o=>o.groupId===groupId&&o.amount&&o.status!=='cancelled'&&(!o.dueAt||Date.parse(o.dueAt)<=cutoff));
    const allocations=await this.allocations(groupId);
    return obligations.map(o=>{const allocated=allocations.filter(a=>a.data.obligationId===o.id).reduce((n,a)=>n+Number(a.data.amount),0);
      const expected=o.amount!.amount,outstanding=Math.max(0,expected-allocated);
      return{obligationId:o.id,title:o.title,assigneeId:o.assigneeId,dueAt:o.dueAt,currency:o.amount!.currency,expected,allocated,outstanding,
        status:outstanding===0?'SETTLED':(o.dueAt&&Date.parse(o.dueAt)<cutoff?'OVERDUE':'OPEN')};});
  }
}
