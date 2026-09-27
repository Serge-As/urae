import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=1200)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
type Approval={actorId:Id;at:string;roles:string[]};

export class MeetingReopenAuthorizationService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private async access(groupId:Id){
    const c=this.ctx(),group=await this.repo.getGroup(c.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===c.actorId)return{group,roles:['founder','manager']};
    const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m||!m.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return{group,roles:m.roles};
  }
  private async get(groupId:Id,id:Id){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!=='MEETING.REOPEN_AUTH')throw Error('REOPEN_AUTH_NOT_FOUND');return r;
  }
  private approvals(r:WorkspaceRecord):Approval[]{try{const x=JSON.parse(String(r.data.approvalsJson??'[]'));return Array.isArray(x)?x:[];}catch{return[];}}
  private eligible(roles:string[],allowed:string[]){return roles.some(r=>allowed.includes(r));}
  private status(group:any,r:WorkspaceRecord,approvals:Approval[]){
    const required=Math.max(1,Number(r.data.requiredApprovals??1)),allowed=JSON.parse(String(r.data.roleCodesJson??'[]')) as string[],founderOverride=r.data.founderOverride===true;
    const eligible=approvals.filter(x=>this.eligible(x.roles,allowed));
    const founderPresent=eligible.some(x=>x.actorId===group.createdBy);
    return founderOverride&&founderPresent||eligible.length>=required?'APPROVED':'PENDING';
  }
  async create(groupId:Id,meetingId:Id,input:{reason:string;expiresAt?:string;scope?:string}){
    const {group,roles}=await this.access(groupId),c=this.ctx(),meeting=await this.repo.getMeeting(c.tenantId,groupId,meetingId);if(!meeting||meeting.status!=='closed')throw Error('MEETING_NOT_CLOSED');
    const late=group.operatingPolicy?.latePosting;if(!late||late.mode==='FORBIDDEN')throw Error('LATE_POSTING_NOT_ALLOWED');
    const reason=clean(input.reason);if(!reason)throw Error('LATE_POSTING_REASON_REQUIRED');
    const allowed=late.approval.roleCodes?.length?late.approval.roleCodes:['founder','president','treasurer','manager'];
    if(!this.eligible(roles,allowed)&&c.actorId!==group.createdBy)throw Error('REOPEN_APPROVER_NOT_ELIGIBLE');
    let expiresAt=input.expiresAt?new Date(input.expiresAt).toISOString():'';
    if(input.expiresAt&&!Number.isFinite(Date.parse(expiresAt)))throw Error('INVALID_EXPIRES_AT');
    if(late.maxHoursAfterClose!==undefined&&meeting.closedAt){
      const policyExpiry=new Date(Date.parse(meeting.closedAt)+late.maxHoursAfterClose*3600000).toISOString();
      if(!expiresAt||Date.parse(expiresAt)>Date.parse(policyExpiry))expiresAt=policyExpiry;
    }
    if(expiresAt&&Date.parse(expiresAt)<=Date.now())throw Error('REOPEN_AUTH_EXPIRED');
    const stamp=now(),approvals:Approval[]=[{actorId:c.actorId,at:stamp,roles:[...roles]}],id=makeId('reopen_auth');
    const base:WorkspaceRecord={id,tenantId:c.tenantId,groupId,moduleId:'MEETING.REOPEN_AUTH',title:'Autorisation après clôture',summary:reason,status:'ACTIVE',tags:['reopen-auth','state:PENDING'],data:{meetingId,reason,scope:clean(input.scope,240)||'LATE_POSTING',requiredApprovals:Math.max(1,late.approval.minimumApprovals),roleCodesJson:JSON.stringify(allowed),founderOverride:Boolean(late.approval.founderOverride),approvalsJson:JSON.stringify(approvals),authorizationState:'PENDING',expiresAt,closedAt:meeting.closedAt??'',independentAccountsRequired:true},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    const state=this.status(group,base,approvals),record={...base,tags:['reopen-auth','state:'+state],data:{...base.data,authorizationState:state}};await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'MEETING_REOPEN_AUTH_CREATED',targetType:'meeting',targetId:meetingId,requestId:c.requestId,metadata:{groupId,authorizationId:id,state,requiredApprovals:record.data.requiredApprovals}}));return record;
  }
  async approve(groupId:Id,id:Id){
    const {group,roles}=await this.access(groupId),c=this.ctx(),r=await this.get(groupId,id);if(String(r.data.authorizationState)==='CANCELLED')throw Error('REOPEN_AUTH_CANCELLED');
    if(r.data.expiresAt&&Date.parse(String(r.data.expiresAt))<=Date.now())throw Error('REOPEN_AUTH_EXPIRED');
    const allowed=JSON.parse(String(r.data.roleCodesJson??'[]')) as string[];if(!this.eligible(roles,allowed)&&c.actorId!==group.createdBy)throw Error('REOPEN_APPROVER_NOT_ELIGIBLE');
    const approvals=this.approvals(r);if(!approvals.some(x=>x.actorId===c.actorId))approvals.push({actorId:c.actorId,at:now(),roles:[...roles]});
    const state=this.status(group,r,approvals),next={...r,tags:['reopen-auth','state:'+state],data:{...r.data,approvalsJson:JSON.stringify(approvals),authorizationState:state},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'MEETING_REOPEN_AUTH_APPROVED',targetType:'workspace_record',targetId:id,requestId:c.requestId,metadata:{groupId,state,approvalCount:approvals.length}}));return next;
  }
  async cancel(groupId:Id,id:Id,reason:string){
    await this.access(groupId);const c=this.ctx(),r=await this.get(groupId,id),next={...r,status:'ARCHIVED' as const,tags:['reopen-auth','state:CANCELLED'],data:{...r.data,authorizationState:'CANCELLED',cancelReason:clean(reason,500),cancelledAt:now()},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async list(groupId:Id,meetingId?:Id){
    await this.access(groupId);const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,'MEETING.REOPEN_AUTH',groupId);return rows.filter(x=>!meetingId||x.data.meetingId===meetingId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
}
