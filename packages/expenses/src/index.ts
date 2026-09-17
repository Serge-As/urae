import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';

export type ExpenseScope='SHEET'|'BACKOFFICE';
export interface ExpenseInput{
  amount:number;label:string;scope:ExpenseScope;meetingId?:Id;membershipId?:Id;rubricId?:Id;note?:string;idempotencyKey:string;
}
export interface ExpenseRecord{
  id:Id;groupId:Id;amount:number;currency:'XAF';label:string;scope:ExpenseScope;meetingId?:Id;membershipId?:Id;rubricId?:Id;
  note?:string;ledgerEntryId:Id;createdAt:string;createdBy:Id;
}
const MODULE='FINANCE.EXPENSE';
const MANAGERS=new Set(['founder','manager','admin','president','treasurer']);
const safe=(v:string)=>v.trim().replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,120);

const parse=(r:WorkspaceRecord):ExpenseRecord=>({
  id:r.id,groupId:String(r.groupId??''),amount:Number(r.data.amount??0),currency:'XAF',label:r.title,
  scope:String(r.data.scope??'BACKOFFICE') as ExpenseScope,meetingId:r.data.meetingId?String(r.data.meetingId):undefined,
  membershipId:r.data.membershipId?String(r.data.membershipId):undefined,rubricId:r.data.rubricId?String(r.data.rubricId):undefined,
  note:r.summary,ledgerEntryId:String(r.data.ledgerEntryId??''),createdAt:r.createdAt,createdBy:r.createdBy
});

export class ExpenseService{
  constructor(private repo:PlatformRepository,private kernel:PlatformKernel,private ledger:LedgerService){}

  private async manager(groupId:Id):Promise<Membership|undefined>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return;
    const membership=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!membership||!membership.roles.some(role=>MANAGERS.has(role)))throw Error('FORBIDDEN_SCOPE');return membership;
  }

  async create(groupId:Id,input:ExpenseInput):Promise<ExpenseRecord>{
    await this.manager(groupId);const ctx=this.kernel.context.get();
    const amount=Number(input.amount),label=input.label.trim(),key=input.idempotencyKey.trim(),scope=input.scope;
    if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_EXPENSE_AMOUNT');
    if(!label||label.length>160)throw Error('EXPENSE_LABEL_REQUIRED');
    if(!key)throw Error('IDEMPOTENCY_KEY_REQUIRED');
    if(!['SHEET','BACKOFFICE'].includes(scope))throw Error('INVALID_EXPENSE_SCOPE');
    if(scope==='SHEET'&&(!input.meetingId||!input.membershipId||!input.rubricId))throw Error('SHEET_EXPENSE_CONTEXT_REQUIRED');
    if(input.membershipId){const m=await this.repo.getMembership(ctx.tenantId,groupId,input.membershipId);if(!m)throw Error('MEMBERSHIP_NOT_FOUND');}
    if(input.meetingId){const meeting=(await this.repo.listMeetings(ctx.tenantId,groupId)).find(x=>x.id===input.meetingId);if(!meeting)throw Error('MEETING_NOT_FOUND');}
    if(input.rubricId){const rubric=await this.repo.getRubricDefinition(ctx.tenantId,groupId,input.rubricId);if(!rubric)throw Error('RUBRIC_NOT_FOUND');}
    const id='expense_'+safe(key),existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(existing)return parse(existing);
    const entry=await this.ledger.recordCashMovement({tenantId:ctx.tenantId,groupId,amount,currency:'XAF',direction:'out',counterAccountCode:'GROUP_EXPENSE',counterAccountName:'Dépenses du groupe',counterAccountType:'expense',descriptionCode:'LEDGER_GROUP_EXPENSE',sourceType:'group_expense',sourceId:id,meetingId:input.meetingId,idempotencyKey:key,kind:'cash_out'});
    const stamp=entry.createdAt??new Date().toISOString();
    const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:MODULE,title:label,summary:input.note?.trim().slice(0,500)||undefined,status:'DONE',tags:['expense','scope:'+scope.toLowerCase(),input.meetingId?'meeting-linked':'backoffice'],data:{amount,currency:'XAF',scope,meetingId:input.meetingId??null,membershipId:input.membershipId??null,rubricId:input.rubricId??null,ledgerEntryId:entry.id,idempotencyKey:key},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return parse(record);
  }

  async list(groupId:Id,filters:{meetingId?:Id;membershipId?:Id;rubricId?:Id;scope?:ExpenseScope}={}):Promise<ExpenseRecord[]>{
    await this.manager(groupId);const ctx=this.kernel.context.get(),rows=await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId);
    return rows.map(parse).filter(x=>(!filters.meetingId||x.meetingId===filters.meetingId)&&(!filters.membershipId||x.membershipId===filters.membershipId)&&(!filters.rubricId||x.rubricId===filters.rubricId)&&(!filters.scope||x.scope===filters.scope)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }
}
