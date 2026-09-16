import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';
import {makeId,type WorkspaceRecord} from '../../contracts/src/index.js';

export type FundMemberAdjustmentKind='OPENING_RETAINED'|'REFUND'|'ASSISTANCE_CHARGE'|'ADJUSTMENT_IN'|'ADJUSTMENT_OUT';
export interface FundMemberAdjustment {id:string;groupId:string;rubricId:string;membershipId:string;exerciseLabel:string;kind:FundMemberAdjustmentKind;amount:number;note?:string;occurredAt:string;createdBy:string;}
export interface FundMemberPosition {
  membershipId:string;displayName:string;openingRetained:number;contributions:number;refunds:number;assistanceCharges:number;adjustmentIn:number;adjustmentOut:number;attributableReserve:number;
}
const MODULE='FINANCE.FUND_MEMBER_ADJUSTMENT',now=()=>new Date().toISOString();
const integer=(name:string,v:number)=>{if(!Number.isSafeInteger(v)||v<0)throw new Error('INVALID_'+name.toUpperCase());return v;};
const clean=(v:unknown,max=1000)=>String(v??'').trim().slice(0,max);
const decode=(r:WorkspaceRecord):FundMemberAdjustment=>({id:r.id,groupId:String(r.groupId??''),rubricId:String(r.data.rubricId??''),membershipId:String(r.data.membershipId??''),exerciseLabel:String(r.data.exerciseLabel??''),kind:String(r.data.kind??'ADJUSTMENT_IN') as FundMemberAdjustmentKind,amount:Number(r.data.amount??0),note:r.summary,occurredAt:String(r.data.occurredAt??r.createdAt),createdBy:r.createdBy});

export class FundPositionService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public ledger:LedgerService){}
  private async membership(groupId:string,membershipId:string){
    const ctx=this.kernel.context.get(),m=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.id===membershipId);if(!m)throw new Error('MEMBERSHIP_NOT_FOUND');return m;
  }
  async record(groupId:string,rubricId:string,input:{membershipId:string;exerciseLabel:string;kind:FundMemberAdjustmentKind;amount:number;note?:string;occurredAt?:string}){
    const ctx=this.kernel.context.get();await this.membership(groupId,input.membershipId);if(!rubricId)throw new Error('RUBRIC_ID_REQUIRED');
    if(!['OPENING_RETAINED','REFUND','ASSISTANCE_CHARGE','ADJUSTMENT_IN','ADJUSTMENT_OUT'].includes(input.kind))throw new Error('INVALID_FUND_ADJUSTMENT_KIND');
    const amount=integer('fund_adjustment_amount',input.amount),exerciseLabel=clean(input.exerciseLabel,120)||'CURRENT',stamp=now(),occurredAt=input.occurredAt?new Date(input.occurredAt).toISOString():stamp;
    const r:WorkspaceRecord={id:makeId('fund_member_adjustment'),tenantId:ctx.tenantId,groupId,moduleId:MODULE,title:input.kind,summary:clean(input.note,1000)||undefined,status:'ACTIVE',tags:['fund-member-position','rubric:'+rubricId,'member:'+input.membershipId,'exercise:'+exerciseLabel],data:{rubricId,membershipId:input.membershipId,exerciseLabel,kind:input.kind,amount,occurredAt},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'FUND_MEMBER_ADJUSTMENT_RECORDED',targetType:'fund_member_adjustment',targetId:r.id,requestId:ctx.requestId,metadata:{groupId,rubricId,membershipId:input.membershipId,kind:input.kind,amount,exerciseLabel}}));return decode(r);
  }
  async positions(groupId:string,rubricId:string,exerciseLabel='CURRENT'){
    const ctx=this.kernel.context.get(),members=await this.repo.listMemberships(ctx.tenantId,groupId),positions=await this.ledger.receiptPositions(ctx.tenantId,groupId);
    const receipts=positions.filter(x=>x.rubricId===rubricId);
    const adjustments=(await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId)).map(decode).filter(x=>x.rubricId===rubricId&&x.exerciseLabel===exerciseLabel);
    const users=await Promise.all(members.map(async m=>({m,u:await this.repo.getUser(ctx.tenantId,m.userId)})));
    const rows:FundMemberPosition[]=users.map(({m,u})=>{
      const contribution=receipts.filter(x=>x.membershipId===m.id).reduce((n,x)=>n+x.netAmount,0),mine=adjustments.filter(x=>x.membershipId===m.id);
      const sum=(kind:FundMemberAdjustmentKind)=>mine.filter(x=>x.kind===kind).reduce((n,x)=>n+x.amount,0);
      const openingRetained=sum('OPENING_RETAINED'),refunds=sum('REFUND'),assistanceCharges=sum('ASSISTANCE_CHARGE'),adjustmentIn=sum('ADJUSTMENT_IN'),adjustmentOut=sum('ADJUSTMENT_OUT');
      return{membershipId:m.id,displayName:u?.displayName??m.userId,openingRetained,contributions:contribution,refunds,assistanceCharges,adjustmentIn,adjustmentOut,attributableReserve:openingRetained+contribution+adjustmentIn-refunds-assistanceCharges-adjustmentOut};
    });
    return{groupId,rubricId,exerciseLabel,positions:rows,totals:{openingRetained:rows.reduce((n,x)=>n+x.openingRetained,0),contributions:rows.reduce((n,x)=>n+x.contributions,0),refunds:rows.reduce((n,x)=>n+x.refunds,0),assistanceCharges:rows.reduce((n,x)=>n+x.assistanceCharges,0),adjustmentIn:rows.reduce((n,x)=>n+x.adjustmentIn,0),adjustmentOut:rows.reduce((n,x)=>n+x.adjustmentOut,0),attributableReserve:rows.reduce((n,x)=>n+x.attributableReserve,0)},adjustments};
  }
}
