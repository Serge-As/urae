import type {ContributionReceipt,Id,RubricDefinition,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';

const now=()=>new Date().toISOString();
const clean=(v:unknown,n=500)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
type WalletAccess='AVAILABLE'|'RESERVED'|'REVIEW_REQUIRED'|'ACTIVITY_ONLY';
type ReservationState='ACTIVE'|'RELEASED';

export interface WalletSubaccount{
  key:string;groupId:Id;groupName:string;kind:'RUBRIC'|'SAVINGS_PLAN'|'LOAN_DEBT';
  sourceId:Id;label:string;currency:string;trackedBalance:number;reservedBalance:number;availableBalance:number;
  access:WalletAccess;reasonCodes:string[];
}
export interface WalletProjection{
  ownerUserId:Id;currency:string;walletBalance:number;availableBalance:number;reservedBalance:number;
  activityOnlyBalance:number;subaccounts:WalletSubaccount[];history:Array<Record<string,unknown>>;
  providerTopupEnabled:false;externalPaymentRailEnabled:false;derivedFromCanonicalLedger:true;asOf:string;
}

export class WalletService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public ledger:LedgerService){}
  private ctx(){return this.kernel.context.get();}
  private async memberships(){
    const c=this.ctx(),out:Array<{groupId:Id;groupName:string;membershipId:Id}>=[];
    for(const g of await this.repo.listGroups(c.tenantId)){
      const m=(await this.repo.listMemberships(c.tenantId,g.id)).find(x=>x.userId===c.actorId&&x.status==='active');
      if(m)out.push({groupId:g.id,groupName:g.name,membershipId:m.id});
    }
    return out;
  }
  private async reservations(){
    const c=this.ctx();
    return (await this.repo.listWorkspaceRecords(c.tenantId,'FINANCE.WALLET'))
      .filter(x=>x.createdBy===c.actorId&&x.data.walletOwnerId===c.actorId&&x.data.recordKind==='RESERVATION');
  }
  private reservationAmount(rows:WorkspaceRecord[],groupId:Id,key:string){
    return rows.filter(x=>x.groupId===groupId&&x.data.subaccountKey===key&&x.data.reservationState==='ACTIVE')
      .reduce((n,x)=>n+Number(x.data.amount??0),0);
  }
  private accessFor(rubric?:RubricDefinition):{access:WalletAccess;reasons:string[]}{
    if(!rubric)return{access:'ACTIVITY_ONLY',reasons:['RUBRIC_NOT_CLASSIFIED_AS_SPENDABLE']};
    if(rubric.facets.refundability==='FULLY_REFUNDABLE')return{access:'AVAILABLE',reasons:['FULLY_REFUNDABLE_RUBRIC']};
    if(['PARTIALLY_REFUNDABLE','CONDITIONAL'].includes(rubric.facets.refundability))return{access:'REVIEW_REQUIRED',reasons:['RUBRIC_RULE_REVIEW_REQUIRED']};
    return{access:'ACTIVITY_ONLY',reasons:['NON_REFUNDABLE_OR_NOT_APPLICABLE']};
  }
  private async savingsBalance(groupId:Id,plan:WorkspaceRecord){
    const c=this.ctx(),code=('SAVINGS_LIABILITY_'+plan.id).replace(/[^A-Z0-9_]/gi,'_').toUpperCase();
    const account=(await this.repo.listLedgerAccounts(c.tenantId,groupId)).find(a=>a.code===code);
    if(!account)return 0;
    let balance=0;for(const e of await this.repo.listLedgerEntries(c.tenantId,groupId))for(const line of e.lines)if(line.accountId===account.id)balance+=line.credit-line.debit;
    return Math.max(0,balance);
  }
  async projection():Promise<WalletProjection>{
    const c=this.ctx(),memberships=await this.memberships(),reservations=await this.reservations(),subaccounts:WalletSubaccount[]=[],history:Array<Record<string,unknown>>=[];
    let activityOnlyBalance=0;
    for(const m of memberships){
      const rubrics=await this.repo.listRubricDefinitions(c.tenantId,m.groupId),rubricById=new Map(rubrics.map(x=>[x.id,x]));
      const positions=(await this.ledger.receiptPositions(c.tenantId,m.groupId)).filter(x=>x.membershipId===m.membershipId&&x.netAmount!==0);
      const grouped=new Map<string,Array<ContributionReceipt&{netAmount:number}>>();
      for(const row of positions){const key=row.rubricId??'unallocated',bucket=grouped.get(key)??[];bucket.push(row);grouped.set(key,bucket);}
      for(const [rubricId,rows] of grouped){
        const rubric=rubricId==='unallocated'?undefined:rubricById.get(rubricId),tracked=Math.max(0,rows.reduce((n,x)=>n+x.netAmount,0)),key='rubric:'+rubricId,{access,reasons}=this.accessFor(rubric),reserved=this.reservationAmount(reservations,m.groupId,key),eligible=access==='AVAILABLE'?tracked:0,available=Math.max(0,eligible-reserved);
        if(access!=='AVAILABLE')activityOnlyBalance+=tracked;
        subaccounts.push({key,groupId:m.groupId,groupName:m.groupName,kind:'RUBRIC',sourceId:rubricId,label:rubric?.name??'Flux non affecté',currency:rows[0]?.amount.currency??'XAF',trackedBalance:tracked,reservedBalance:Math.min(reserved,eligible),availableBalance:available,access:reserved>0&&available===0&&eligible>0?'RESERVED':access,reasonCodes:reasons});
        for(const row of rows)history.push({id:row.id,at:row.receivedAt,groupId:m.groupId,groupName:m.groupName,subaccountKey:key,label:rubric?.name??'Flux non affecté',kind:'CONTRIBUTION',amount:row.netAmount,currency:row.amount.currency,walletEligible:access==='AVAILABLE',ledgerEntryId:row.ledgerEntryId,meetingId:row.meetingId??null});
      }
      const groupRecords=await this.repo.listWorkspaceRecords(c.tenantId,undefined,m.groupId);
      const loans=groupRecords.filter(x=>x.data.completionKind==='LOAN'&&x.data.borrowerMembershipId===m.membershipId&&['DISBURSED','REPAYING'].includes(String(x.data.completionState??'')));
      for(const loan of loans){
        const principal=Math.max(0,Number(loan.data.outstandingPrincipal??0)),interest=Math.max(0,Number(loan.data.unpaidInterest??0)),debt=principal+interest;if(debt<=0)continue;
        const key='loan:'+loan.id;
        subaccounts.push({key,groupId:m.groupId,groupName:m.groupName,kind:'LOAN_DEBT',sourceId:loan.id,label:loan.title||'Prêt',currency:String(loan.data.currency??'XAF'),trackedBalance:-debt,reservedBalance:0,availableBalance:0,access:'ACTIVITY_ONLY',reasonCodes:['OUTSTANDING_LOAN_DEBT','PRINCIPAL_PLUS_DUE_INTEREST']});
        history.push({id:'wallet_debt_'+loan.id,at:loan.updatedAt,groupId:m.groupId,groupName:m.groupName,subaccountKey:key,label:loan.title||'Prêt',kind:'DEBT_POSITION',amount:-debt,currency:String(loan.data.currency??'XAF'),walletEligible:false,ledgerEntryId:loan.data.ledgerEntryId??null,meetingId:loan.data.interestAppliesToMeetingId??null,principal,unpaidInterest:interest});
      }
      const plans=groupRecords.filter(x=>x.data.specializedKind==='SAVINGS_PLAN'&&x.data.membershipId===m.membershipId&&x.status==='ACTIVE');
      for(const plan of plans){
        const balance=await this.savingsBalance(m.groupId,plan),key='savings:'+plan.id,reserved=this.reservationAmount(reservations,m.groupId,key),available=Math.max(0,balance-reserved);
        subaccounts.push({key,groupId:m.groupId,groupName:m.groupName,kind:'SAVINGS_PLAN',sourceId:plan.id,label:plan.title,currency:String(plan.data.currency??'XAF'),trackedBalance:balance,reservedBalance:Math.min(reserved,balance),availableBalance:available,access:reserved>0&&available===0&&balance>0?'RESERVED':'AVAILABLE',reasonCodes:['EXPLICIT_SAVINGS_PLAN']});
        const entryIds=new Set<string>();for(const e of await this.repo.listLedgerEntries(c.tenantId,m.groupId))if(e.sourceType==='savings_plan'&&e.sourceId===plan.id)entryIds.add(e.id);
        for(const e of (await this.repo.listLedgerEntries(c.tenantId,m.groupId)).filter(x=>entryIds.has(x.id)))history.push({id:e.id,at:e.createdAt,groupId:m.groupId,groupName:m.groupName,subaccountKey:key,label:plan.title,kind:e.descriptionCode.includes('WITHDRAWAL')?'WITHDRAWAL':'DEPOSIT',amount:e.lines.reduce((n,l)=>n+(l.memoCode?.endsWith('_CASH')?l.debit-l.credit:0),0),currency:e.currency,walletEligible:true,ledgerEntryId:e.id,meetingId:e.meetingId??null});
      }
    }
    const activeReservations=reservations.filter(x=>x.data.reservationState==='ACTIVE');
    for(const r of activeReservations)history.push({id:r.id,at:r.createdAt,groupId:r.groupId??null,subaccountKey:r.data.subaccountKey,label:r.title,kind:'RESERVATION',amount:-Number(r.data.amount??0),currency:String(r.data.currency??'XAF'),walletEligible:true,ledgerEntryId:null,meetingId:null});
    subaccounts.sort((a,b)=>a.groupName.localeCompare(b.groupName,'fr')||a.label.localeCompare(b.label,'fr'));
    history.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
    const availableBalance=subaccounts.reduce((n,x)=>n+x.availableBalance,0),reservedBalance=subaccounts.reduce((n,x)=>n+x.reservedBalance,0);
    const walletBalance=subaccounts.reduce((n,x)=>n+x.trackedBalance,0);
    return{ownerUserId:c.actorId,currency:'XAF',walletBalance,availableBalance,reservedBalance,activityOnlyBalance,subaccounts,history,providerTopupEnabled:false,externalPaymentRailEnabled:false,derivedFromCanonicalLedger:true,asOf:now()};
  }
  async reserve(input:{groupId:Id;subaccountKey:string;amount:number;purpose:string;expiresAt?:string}){
    const c=this.ctx(),amount=Number(input.amount);if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_WALLET_RESERVATION_AMOUNT');
    const purpose=clean(input.purpose);if(!purpose)throw Error('WALLET_RESERVATION_PURPOSE_REQUIRED');
    const memberships=await this.memberships();if(!memberships.some(x=>x.groupId===input.groupId))throw Error('FORBIDDEN_SCOPE');
    const before=await this.projection(),sub=before.subaccounts.find(x=>x.groupId===input.groupId&&x.key===input.subaccountKey);if(!sub)throw Error('WALLET_SUBACCOUNT_NOT_FOUND');
    if(sub.access!=='AVAILABLE'||sub.availableBalance<amount)throw Error('INSUFFICIENT_AVAILABLE_WALLET_BALANCE');
    const expiresAt=input.expiresAt?new Date(input.expiresAt).toISOString():'';if(input.expiresAt&&(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.now()))throw Error('INVALID_EXPIRES_AT');
    const stamp=now(),record:WorkspaceRecord={id:makeId('wallet_reservation'),tenantId:c.tenantId,groupId:input.groupId,moduleId:'FINANCE.WALLET',title:'Réservation Wallet · '+purpose,summary:purpose,status:'ACTIVE',tags:['wallet','reservation','state:ACTIVE'],data:{recordKind:'RESERVATION',walletOwnerId:c.actorId,subaccountKey:input.subaccountKey,amount,currency:sub.currency,reservationState:'ACTIVE',expiresAt,ledgerMutation:false,providerTopup:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'WALLET_RESERVATION_CREATED',targetType:'workspace_record',targetId:record.id,requestId:c.requestId,metadata:{groupId:input.groupId,subaccountKey:input.subaccountKey,amount}}));return record;
  }
  async release(id:Id){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!=='FINANCE.WALLET'||r.createdBy!==c.actorId||r.data.walletOwnerId!==c.actorId||r.data.recordKind!=='RESERVATION')throw Error('WALLET_RESERVATION_NOT_FOUND');
    if(r.data.reservationState!=='ACTIVE')return r;const next={...r,status:'DONE' as const,tags:['wallet','reservation','state:RELEASED'],data:{...r.data,reservationState:'RELEASED',releasedAt:now(),ledgerMutation:false},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'WALLET_RESERVATION_RELEASED',targetType:'workspace_record',targetId:r.id,requestId:c.requestId}));return next;
  }
}
