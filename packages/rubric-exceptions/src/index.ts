import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

export type RubricExceptionScope='GROUP'|'MEMBERSHIP'|'MEETING';
export type RubricExceptionState='PROPOSED'|'APPROVED'|'REJECTED'|'CLOSED';
const managers=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const now=()=>new Date().toISOString();
const text=(v:unknown,n=4000)=>String(v??'').trim().slice(0,n);

export class RubricExceptionService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private async access(groupId:Id,manage=false){
    const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
    if(g.createdBy===c.actorId)return g;
    const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m||manage&&!m.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return g;
  }
  private async get(groupId:Id,id:Id){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);
    if(!r||r.groupId!==groupId||r.moduleId!=='RUBRIC.EXCEPTIONS')throw Error('RUBRIC_EXCEPTION_NOT_FOUND');
    return r;
  }
  async create(groupId:Id,input:{rubricId:Id;title:string;scope:RubricExceptionScope;targetRef?:Id;reason:string;effectSummary:string;evidenceRef:string;validFrom?:string;validUntil?:string}){
    await this.access(groupId,true);const c=this.ctx(),rubric=await this.repo.getRubricDefinition(c.tenantId,groupId,input.rubricId);if(!rubric)throw Error('RUBRIC_NOT_FOUND');
    if(!['GROUP','MEMBERSHIP','MEETING'].includes(input.scope))throw Error('INVALID_EXCEPTION_SCOPE');
    const targetRef=text(input.targetRef,240);if(input.scope!=='GROUP'&&!targetRef)throw Error('EXCEPTION_TARGET_REQUIRED');
    if(input.scope==='MEMBERSHIP'&&targetRef&&!await this.repo.getMembership(c.tenantId,groupId,targetRef))throw Error('MEMBERSHIP_NOT_FOUND');
    if(input.scope==='MEETING'&&targetRef&&!await this.repo.getMeeting(c.tenantId,groupId,targetRef))throw Error('MEETING_NOT_FOUND');
    const title=text(input.title,240),reason=text(input.reason,5000),effect=text(input.effectSummary,5000),evidence=text(input.evidenceRef,1200);if(!title||!reason||!effect||!evidence)throw Error('RUBRIC_EXCEPTION_REQUIRED_FIELDS');
    const validFrom=input.validFrom?new Date(input.validFrom).toISOString():now();if(!Number.isFinite(Date.parse(validFrom)))throw Error('INVALID_VALID_FROM');
    const validUntil=input.validUntil?new Date(input.validUntil).toISOString():'';if(input.validUntil&&!Number.isFinite(Date.parse(validUntil)))throw Error('INVALID_VALID_UNTIL');if(validUntil&&Date.parse(validUntil)<=Date.parse(validFrom))throw Error('INVALID_EXCEPTION_WINDOW');
    const stamp=now(),r:WorkspaceRecord={id:makeId('rubric_exception'),tenantId:c.tenantId,groupId,moduleId:'RUBRIC.EXCEPTIONS',title,summary:reason.slice(0,1000),status:'DRAFT',tags:['rubric-exception','state:PROPOSED','scope:'+input.scope],data:{exceptionState:'PROPOSED',rubricId:rubric.id,rubricVersion:rubric.version,scope:input.scope,targetRef,effectSummary:effect,reason,evidenceRef:evidence,validFrom,validUntil,approvedAt:'',approvedBy:'',decisionNote:'',createsLedgerEntry:false,autoApplyMoney:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'RUBRIC_EXCEPTION_PROPOSED',targetType:'rubric_exception',targetId:r.id,requestId:c.requestId,metadata:{groupId,rubricId:rubric.id,scope:input.scope,targetRef}}));return r;
  }
  async decide(groupId:Id,id:Id,state:'APPROVED'|'REJECTED',note:string){
    await this.access(groupId,true);const c=this.ctx(),r=await this.get(groupId,id);if(String(r.data.exceptionState)!=='PROPOSED')throw Error('RUBRIC_EXCEPTION_NOT_PROPOSED');
    const why=text(note,5000);if(!why)throw Error('EXCEPTION_DECISION_NOTE_REQUIRED');
    const next:WorkspaceRecord={...r,status:state==='APPROVED'?'ACTIVE':'ARCHIVED',tags:['rubric-exception','state:'+state,'scope:'+String(r.data.scope??'GROUP')],data:{...r.data,exceptionState:state,decisionNote:why,approvedAt:state==='APPROVED'?now():'',approvedBy:state==='APPROVED'?c.actorId:'',decidedAt:now(),decidedBy:c.actorId,createsLedgerEntry:false,autoApplyMoney:false},updatedAt:now()};
    await this.repo.saveWorkspaceRecord(next);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'RUBRIC_EXCEPTION_'+state,targetType:'rubric_exception',targetId:id,requestId:c.requestId,metadata:{groupId,note:why}}));return next;
  }
  async close(groupId:Id,id:Id,note:string){
    await this.access(groupId,true);const c=this.ctx(),r=await this.get(groupId,id);if(!['APPROVED','PROPOSED'].includes(String(r.data.exceptionState)))throw Error('RUBRIC_EXCEPTION_NOT_OPEN');
    const why=text(note,5000);if(!why)throw Error('EXCEPTION_CLOSE_NOTE_REQUIRED');const next:WorkspaceRecord={...r,status:'ARCHIVED',tags:['rubric-exception','state:CLOSED','scope:'+String(r.data.scope??'GROUP')],data:{...r.data,exceptionState:'CLOSED',closedAt:now(),closedBy:c.actorId,closeNote:why},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async list(groupId:Id){await this.access(groupId,false);const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId,'RUBRIC.EXCEPTIONS',groupId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  async applicable(groupId:Id,input:{rubricId:Id;membershipId?:Id;meetingId?:Id;at?:string}){
    await this.access(groupId,false);const at=input.at?Date.parse(input.at):Date.now();if(!Number.isFinite(at))throw Error('INVALID_EXCEPTION_AT');
    const rows=await this.list(groupId);return rows.filter(r=>{
      if(r.data.exceptionState!=='APPROVED'||r.data.rubricId!==input.rubricId)return false;
      const from=Date.parse(String(r.data.validFrom??r.createdAt)),until=r.data.validUntil?Date.parse(String(r.data.validUntil)):Infinity;if(at<from||at>until)return false;
      const scope=String(r.data.scope??'GROUP'),target=String(r.data.targetRef??'');if(scope==='MEMBERSHIP')return Boolean(input.membershipId)&&target===input.membershipId;if(scope==='MEETING')return Boolean(input.meetingId)&&target===input.meetingId;return scope==='GROUP';
    });
  }
}
