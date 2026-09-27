import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';

const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=800)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);

export class PrepaymentService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public ledger:LedgerService){}
  private ctx(){return this.kernel.context.get();}
  private async access(groupId:Id){
    const c=this.ctx(),group=await this.repo.getGroup(c.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===c.actorId)return group;const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m||!m.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return group;
  }
  private async get(groupId:Id,id:Id){const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!=='MEETING.PREPAYMENTS')throw Error('PREPAYMENT_NOT_FOUND');return r;}
  private allocations(r:WorkspaceRecord):Array<{meetingId:Id;amount:number;allocatedAt:string;allocatedBy:Id}>{try{const x=JSON.parse(String(r.data.allocationsJson??'[]'));return Array.isArray(x)?x:[];}catch{return[];}}
  async create(groupId:Id,input:{membershipId:Id;rubricId?:Id;amount:number;intendedMeetingId?:Id;note?:string;idempotencyKey:string}){
    await this.access(groupId);const c=this.ctx();if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_PREPAYMENT_AMOUNT');
    const member=await this.repo.getMembership(c.tenantId,groupId,input.membershipId);if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');
    if(input.rubricId&&!await this.repo.getRubricDefinition(c.tenantId,groupId,input.rubricId))throw Error('RUBRIC_NOT_FOUND');
    if(input.intendedMeetingId){const m=await this.repo.getMeeting(c.tenantId,groupId,input.intendedMeetingId);if(!m||m.status==='cancelled'||m.status==='closed')throw Error('PREPAYMENT_TARGET_MEETING_INVALID');}
    const receipt=await this.ledger.recordCashContribution({tenantId:c.tenantId,groupId,membershipId:input.membershipId,amount:input.amount,currency:'XAF',rubricId:input.rubricId,idempotencyKey:input.idempotencyKey},c.requestId);
    const id='prepayment_'+receipt.id,existing=await this.repo.getWorkspaceRecord(c.tenantId,id);if(existing)return existing;
    const stamp=receipt.receivedAt,record:WorkspaceRecord={id,tenantId:c.tenantId,groupId,moduleId:'MEETING.PREPAYMENTS',title:'Avance · '+input.amount+' XAF',summary:clean(input.note),status:'ACTIVE',tags:['prepayment','state:AVAILABLE','ledger-once'],data:{membershipId:input.membershipId,rubricId:input.rubricId??'',amount:input.amount,currency:'XAF',receiptId:receipt.id,ledgerEntryId:receipt.ledgerEntryId,intendedMeetingId:input.intendedMeetingId??'',allocationsJson:'[]',allocatedAmount:0,remainingAmount:input.amount,prepaymentState:'AVAILABLE',ledgerMutationOnAllocation:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'PREPAYMENT_RECORDED',targetType:'workspace_record',targetId:id,requestId:c.requestId,metadata:{groupId,membershipId:input.membershipId,amount:input.amount,receiptId:receipt.id}}));return record;
  }
  async allocate(groupId:Id,id:Id,input:{meetingId:Id;amount:number}){
    await this.access(groupId);const c=this.ctx(),r=await this.get(groupId,id),meeting=await this.repo.getMeeting(c.tenantId,groupId,input.meetingId);if(!meeting||meeting.status==='cancelled'||meeting.status==='closed')throw Error('PREPAYMENT_TARGET_MEETING_INVALID');
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_PREPAYMENT_AMOUNT');const allocations=this.allocations(r),total=Number(r.data.amount??0),allocated=allocations.reduce((n,x)=>n+Number(x.amount??0),0);if(allocated+input.amount>total)throw Error('PREPAYMENT_AMOUNT_EXCEEDS_REMAINING');
    const existing=allocations.find(x=>x.meetingId===input.meetingId);if(existing)existing.amount+=input.amount;else allocations.push({meetingId:input.meetingId,amount:input.amount,allocatedAt:now(),allocatedBy:c.actorId});
    const nextAllocated=allocated+input.amount,state=nextAllocated===total?'ALLOCATED':'PARTIALLY_ALLOCATED',next={...r,tags:['prepayment','state:'+state,'ledger-once'],data:{...r.data,allocationsJson:JSON.stringify(allocations),allocatedAmount:nextAllocated,remainingAmount:total-nextAllocated,prepaymentState:state,ledgerMutationOnAllocation:false},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'PREPAYMENT_ALLOCATED',targetType:'workspace_record',targetId:id,requestId:c.requestId,metadata:{groupId,meetingId:input.meetingId,amount:input.amount,ledgerEntryId:r.data.ledgerEntryId}}));return next;
  }
  async list(groupId:Id){await this.access(groupId);const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId,'MEETING.PREPAYMENTS',groupId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
}
