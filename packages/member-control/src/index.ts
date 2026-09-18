import type {CaseRecord, Id, LedgerEntry, Membership, Obligation, WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

export type MemberNoticeState='NOTIFIED'|'MEMBER_CONFIRMED'|'MEMBER_UNANSWERED';
export type DisputeState='NO_RESERVE'|'MEMBER_RESERVE'|'UNDER_REVIEW'|'OFFICER_CONFIRMED'|'MEMBER_APPROVED_AFTER_REVIEW'|'MEMBER_RESERVE_MAINTAINED'|'RESOLVED';

export interface FinancialNotice {
  id:string;groupId:string;membershipId:string;userId:string;ledgerEntryId:string;
  operationType:string;amount:number;currency:string;rubricId?:string;meetingId?:string;
  previousSituation?:number;newSituation?:number;previousAmount?:number;newAmount?:number;correctionReason?:string;
  selfBenefit?:boolean;requiresIndependentReview?:boolean;authorId:string;authorRoles:string[];
  createdAt:string;memberState:MemberNoticeState;disputeState:DisputeState;version:number;
  reserveReason?:string;officerId?:string;officerNote?:string;memberReviewNote?:string;updatedAt:string;
}

const MODULE='FINANCE.MEMBER_CONTROL';
const managers=new Set(['founder','manager','admin','president','treasurer','auditor']);
const now=()=>new Date().toISOString();
const noticeId=(groupId:string,membershipId:string,ledgerEntryId:string)=>'financial_notice_'+encodeURIComponent(JSON.stringify([groupId,membershipId,ledgerEntryId]));

const toNotice=(r:WorkspaceRecord):FinancialNotice=>{
  const d=r.data;
  return{
    id:r.id,groupId:String(r.groupId??''),membershipId:String(d.membershipId??''),userId:String(d.userId??''),ledgerEntryId:String(d.ledgerEntryId??''),
    operationType:String(d.operationType??''),amount:Number(d.amount??0),currency:String(d.currency??'XAF'),
    rubricId:d.rubricId?String(d.rubricId):undefined,meetingId:d.meetingId?String(d.meetingId):undefined,
    previousSituation:d.previousSituation===null||d.previousSituation===undefined?undefined:Number(d.previousSituation),
    newSituation:d.newSituation===null||d.newSituation===undefined?undefined:Number(d.newSituation),
    previousAmount:d.previousAmount===null||d.previousAmount===undefined?undefined:Number(d.previousAmount),
    newAmount:d.newAmount===null||d.newAmount===undefined?undefined:Number(d.newAmount),
    correctionReason:d.correctionReason?String(d.correctionReason):undefined,
    selfBenefit:Boolean(d.selfBenefit),requiresIndependentReview:Boolean(d.requiresIndependentReview),
    authorId:String(d.authorId??''),authorRoles:JSON.parse(String(d.authorRolesJson??'[]')) as string[],
    createdAt:r.createdAt,memberState:String(d.memberState??'NOTIFIED') as MemberNoticeState,
    disputeState:String(d.disputeState??'NO_RESERVE') as DisputeState,version:Number(d.version??1),
    reserveReason:d.reserveReason?String(d.reserveReason):undefined,officerId:d.officerId?String(d.officerId):undefined,
    officerNote:d.officerNote?String(d.officerNote):undefined,memberReviewNote:d.memberReviewNote?String(d.memberReviewNote):undefined,updatedAt:r.updatedAt
  };
};

const dataFor=(n:FinancialNotice):WorkspaceRecord['data']=>({
  membershipId:n.membershipId,userId:n.userId,ledgerEntryId:n.ledgerEntryId,operationType:n.operationType,amount:n.amount,currency:n.currency,
  rubricId:n.rubricId??null,meetingId:n.meetingId??null,previousSituation:n.previousSituation??null,newSituation:n.newSituation??null,
  previousAmount:n.previousAmount??null,newAmount:n.newAmount??null,correctionReason:n.correctionReason??null,
  selfBenefit:Boolean(n.selfBenefit),requiresIndependentReview:Boolean(n.requiresIndependentReview),
  authorId:n.authorId,authorRolesJson:JSON.stringify(n.authorRoles),memberState:n.memberState,disputeState:n.disputeState,version:n.version,
  reserveReason:n.reserveReason??null,officerId:n.officerId??null,officerNote:n.officerNote??null,memberReviewNote:n.memberReviewNote??null
});

export class MemberFinancialControlService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}

  private async membership(groupId:string,membershipId:string):Promise<Membership>{
    const ctx=this.kernel.context.get();const m=await this.repo.getMembership(ctx.tenantId,groupId,membershipId);
    if(!m)throw new Error('MEMBERSHIP_NOT_FOUND');return m;
  }
  private async canManage(groupId:string):Promise<boolean>{
    const ctx=this.kernel.context.get();const g=await this.repo.getGroup(ctx.tenantId,groupId);if(!g)return false;
    if(g.createdBy===ctx.actorId)return true;
    const ms=await this.repo.listMemberships(ctx.tenantId,groupId),m=ms.find(x=>x.userId===ctx.actorId&&x.status==='active');
    return Boolean(m?.roles.some(r=>managers.has(r)));
  }
  private async requireSelfOrManager(groupId:string,membershipId:string):Promise<Membership>{
    const ctx=this.kernel.context.get(),m=await this.membership(groupId,membershipId);
    if(m.userId!==ctx.actorId&&!(await this.canManage(groupId)))throw new Error('FORBIDDEN_SCOPE');return m;
  }
  private async get(groupId:string,id:string):Promise<{record:WorkspaceRecord;notice:FinancialNotice}>{
    const ctx=this.kernel.context.get();const r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(!r||r.groupId!==groupId||r.moduleId!==MODULE)throw new Error('FINANCIAL_NOTICE_NOT_FOUND');
    return{record:r,notice:toNotice(r)};
  }
  private async save(record:WorkspaceRecord,notice:FinancialNotice,action:string):Promise<FinancialNotice>{
    const ctx=this.kernel.context.get(),updated:{record:WorkspaceRecord;notice:FinancialNotice}={record:{...record,data:dataFor(notice),updatedAt:notice.updatedAt},notice};
    await this.repo.saveWorkspaceRecord(updated.record);
    const audit=this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action,targetType:'financial_notice',targetId:notice.id,requestId:ctx.requestId,metadata:{ledgerEntryId:notice.ledgerEntryId,memberState:notice.memberState,disputeState:notice.disputeState,version:notice.version}});
    await this.repo.saveAudit(audit);return structuredClone(notice);
  }

  async create(input:{groupId:string;membershipId:string;entry:LedgerEntry;operationType:string;amount:number;currency:string;rubricId?:string;meetingId?:string;previousSituation?:number;newSituation?:number;previousAmount?:number;newAmount?:number;correctionReason?:string;selfBenefit?:boolean;requiresIndependentReview?:boolean}):Promise<FinancialNotice>{
    const ctx=this.kernel.context.get(),m=await this.membership(input.groupId,input.membershipId);
    const id=noticeId(input.groupId,input.membershipId,input.entry.id),existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(existing)return toNotice(existing);
    const stamp=now(),notice:FinancialNotice={id,groupId:input.groupId,membershipId:m.id,userId:m.userId,ledgerEntryId:input.entry.id,operationType:input.operationType,amount:input.amount,currency:input.currency,rubricId:input.rubricId,meetingId:input.meetingId,previousSituation:input.previousSituation,newSituation:input.newSituation,previousAmount:input.previousAmount,newAmount:input.newAmount,correctionReason:input.correctionReason,selfBenefit:Boolean(input.selfBenefit),requiresIndependentReview:Boolean(input.requiresIndependentReview),authorId:input.entry.createdBy,authorRoles:[...ctx.groupRoles],createdAt:stamp,memberState:'NOTIFIED',disputeState:input.requiresIndependentReview?'UNDER_REVIEW':'NO_RESERVE',version:1,updatedAt:stamp};
    const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId:input.groupId,moduleId:MODULE,title:'Avis financier membre',summary:'Une opération a modifié votre situation. Vérifiez-la.',status:'ACTIVE',tags:['financial-notice','member-control'],data:dataFor(notice),createdBy:input.entry.createdBy,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    const audit=this.kernel.audit.append({tenantId:ctx.tenantId,actorId:input.entry.createdBy,action:'MEMBER_FINANCIAL_NOTICE_CREATED',targetType:'financial_notice',targetId:id,requestId:ctx.requestId,metadata:{ledgerEntryId:input.entry.id,membershipId:m.id,selfBenefit:Boolean(input.selfBenefit),requiresIndependentReview:Boolean(input.requiresIndependentReview)}});
    await this.repo.saveAudit(audit);
    if(notice.requiresIndependentReview){
      const reviewers=(await this.repo.listMemberships(ctx.tenantId,input.groupId)).filter(x=>x.status==='active'&&x.userId!==notice.authorId&&x.roles.some(r=>managers.has(r)));
      for(const reviewer of reviewers){
        const obligation:Obligation={id:'obligation_self_review_'+encodeURIComponent(JSON.stringify([id,reviewer.userId])),tenantId:ctx.tenantId,groupId:input.groupId,assigneeId:reviewer.userId,type:'FINANCIAL_INDEPENDENT_REVIEW',title:'Vérifier une auto-modification financière : '+input.operationType+' '+input.amount+' '+input.currency,dueAt:stamp,priority:'high',status:'open',sourceType:'financial_notice',sourceId:id};
        await this.repo.saveObligation(obligation);
      }
    }
    return notice;
  }

  async list(groupId:string,membershipId:string):Promise<FinancialNotice[]>{
    await this.requireSelfOrManager(groupId,membershipId);const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId)).map(toNotice).filter(n=>n.membershipId===membershipId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }

  async confirm(groupId:string,id:string):Promise<FinancialNotice>{
    const ctx=this.kernel.context.get(),x=await this.get(groupId,id),m=await this.membership(groupId,x.notice.membershipId);
    if(m.userId!==ctx.actorId)throw new Error('MEMBER_SELF_ACTION_REQUIRED');
    if(x.notice.requiresIndependentReview)throw new Error('INDEPENDENT_REVIEW_REQUIRED');
    if(x.notice.memberState==='MEMBER_CONFIRMED')return x.notice;
    const notice={...x.notice,memberState:'MEMBER_CONFIRMED' as const,version:x.notice.version+1,updatedAt:now()};
    return this.save(x.record,notice,'MEMBER_FINANCIAL_NOTICE_CONFIRMED');
  }

  async reserve(groupId:string,id:string,reason:string):Promise<{notice:FinancialNotice;case:CaseRecord}>{
    const ctx=this.kernel.context.get(),clean=reason.trim();if(!clean)throw new Error('RESERVE_REASON_REQUIRED');
    const x=await this.get(groupId,id),m=await this.membership(groupId,x.notice.membershipId);if(m.userId!==ctx.actorId)throw new Error('MEMBER_SELF_ACTION_REQUIRED');
    const notice={...x.notice,disputeState:'MEMBER_RESERVE' as const,reserveReason:clean,version:x.notice.version+1,updatedAt:now()};
    const saved=await this.save(x.record,notice,'MEMBER_FINANCIAL_RESERVE_OPENED');
    const caseId='case_reserve_'+encodeURIComponent(id);
    let record=(await this.repo.listCases(ctx.tenantId,m.userId)).find(c=>c.id===caseId);
    if(!record){record={id:caseId,tenantId:ctx.tenantId,groupId,type:'FINANCIAL_RESERVE',subjectType:'ledger_entry',subjectId:notice.ledgerEntryId,status:'OPEN',openedBy:m.userId,openedAt:now(),summary:clean};await this.repo.saveCase(record);}
    return{notice:saved,case:record};
  }

  async officerReview(groupId:string,id:string,note:string):Promise<FinancialNotice>{
    const ctx=this.kernel.context.get();if(!(await this.canManage(groupId)))throw new Error('FORBIDDEN_SCOPE');
    const x=await this.get(groupId,id);if(!['MEMBER_RESERVE','UNDER_REVIEW','MEMBER_RESERVE_MAINTAINED'].includes(x.notice.disputeState))throw new Error('NO_MEMBER_RESERVE');
    if(x.notice.requiresIndependentReview&&x.notice.authorId===ctx.actorId)throw new Error('INDEPENDENT_REVIEW_REQUIRED');
    const notice={...x.notice,disputeState:'OFFICER_CONFIRMED' as const,officerId:ctx.actorId,officerNote:note.trim()||'Validation après vérification',version:x.notice.version+1,updatedAt:now()};
    const saved=await this.save(x.record,notice,'FINANCIAL_RESERVE_OFFICER_CONFIRMED');
    if(saved.requiresIndependentReview){
      const tasks=(await this.repo.listObligations(ctx.tenantId)).filter(o=>o.type==='FINANCIAL_INDEPENDENT_REVIEW'&&o.sourceId===saved.id&&o.status==='open');
      for(const task of tasks)await this.repo.saveObligation({...task,status:'completed'});
    }
    return saved;
  }

  async memberReview(groupId:string,id:string,decision:'APPROVE_AFTER_REVIEW'|'MAINTAIN_RESERVE',note=''):Promise<FinancialNotice>{
    const ctx=this.kernel.context.get(),x=await this.get(groupId,id),m=await this.membership(groupId,x.notice.membershipId);if(m.userId!==ctx.actorId)throw new Error('MEMBER_SELF_ACTION_REQUIRED');
    if(x.notice.disputeState!=='OFFICER_CONFIRMED')throw new Error('OFFICER_REVIEW_REQUIRED');
    const disputeState=decision==='APPROVE_AFTER_REVIEW'?'MEMBER_APPROVED_AFTER_REVIEW':'MEMBER_RESERVE_MAINTAINED';
    const notice={...x.notice,disputeState:disputeState as DisputeState,memberReviewNote:note.trim()||undefined,version:x.notice.version+1,updatedAt:now()};
    return this.save(x.record,notice,decision==='APPROVE_AFTER_REVIEW'?'MEMBER_RESERVE_APPROVED_AFTER_REVIEW':'MEMBER_RESERVE_MAINTAINED');
  }
}
