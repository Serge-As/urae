import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import {makeId,type WorkspaceRecord,type WorkspaceStatus} from '../../contracts/src/index.js';
import {PRODUCT_MODULES} from '../../module-registry/src/index.js';

export type ControlIssueState='NEW'|'TRIAGED'|'IN_PROGRESS'|'RESOLVED'|'VERIFIED'|'CLOSED';
export type EditorialState='MISSING'|'DRAFT'|'REVIEW'|'NEEDS_FIX'|'READY'|'PUBLISHED';
export type CheckState='PASS'|'WARN'|'FAIL'|'UNKNOWN';

export interface FounderControlIssue {
  id:string;serviceId?:string;title:string;summary:string;severity:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
  state:ControlIssueState;source:'FOUNDER'|'USER_COMPLAINT'|'AUTOMATED_CHECK'|'TEAM';groupId?:string;
  createdAt:string;updatedAt:string;createdBy:string;resolution?:string;
}
export interface FounderEditorialItem {
  id:string;serviceId?:string;title:string;kind:'ARTICLE'|'HELP'|'LEGAL'|'ONBOARDING'|'FAQ'|'MARKETING'|'OTHER';
  state:EditorialState;owner?:string;notes?:string;createdAt:string;updatedAt:string;createdBy:string;
}
export interface FounderServiceCheck {
  id:string;serviceId:string;state:CheckState;source:string;summary:string;checkedAt:string;createdBy:string;
}
const ISSUE_MODULE='FOUNDER.CONTROL_ISSUE',EDITORIAL_MODULE='FOUNDER.EDITORIAL_TASK',CHECK_MODULE='FOUNDER.SERVICE_CHECK';
const now=()=>new Date().toISOString();
const clean=(v:unknown,max=1000)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,max);
const issueState=(v:unknown):ControlIssueState=>{const x=String(v??'NEW') as ControlIssueState;if(!['NEW','TRIAGED','IN_PROGRESS','RESOLVED','VERIFIED','CLOSED'].includes(x))throw new Error('INVALID_CONTROL_ISSUE_STATE');return x;};
const editorialState=(v:unknown):EditorialState=>{const x=String(v??'MISSING') as EditorialState;if(!['MISSING','DRAFT','REVIEW','NEEDS_FIX','READY','PUBLISHED'].includes(x))throw new Error('INVALID_EDITORIAL_STATE');return x;};
const checkState=(v:unknown):CheckState=>{const x=String(v??'UNKNOWN') as CheckState;if(!['PASS','WARN','FAIL','UNKNOWN'].includes(x))throw new Error('INVALID_CHECK_STATE');return x;};
const issueFrom=(r:WorkspaceRecord):FounderControlIssue=>({id:r.id,serviceId:r.data.serviceId?String(r.data.serviceId):undefined,title:r.title,summary:r.summary??'',severity:String(r.data.severity??'MEDIUM') as any,state:String(r.data.state??'NEW') as ControlIssueState,source:String(r.data.source??'FOUNDER') as any,groupId:r.groupId,createdAt:r.createdAt,updatedAt:r.updatedAt,createdBy:r.createdBy,resolution:r.data.resolution?String(r.data.resolution):undefined});
const editorialFrom=(r:WorkspaceRecord):FounderEditorialItem=>({id:r.id,serviceId:r.data.serviceId?String(r.data.serviceId):undefined,title:r.title,kind:String(r.data.kind??'OTHER') as any,state:String(r.data.state??'MISSING') as EditorialState,owner:r.data.owner?String(r.data.owner):undefined,notes:r.summary,createdAt:r.createdAt,updatedAt:r.updatedAt,createdBy:r.createdBy});
const checkFrom=(r:WorkspaceRecord):FounderServiceCheck=>({id:r.id,serviceId:String(r.data.serviceId??''),state:String(r.data.state??'UNKNOWN') as CheckState,source:String(r.data.source??'manual'),summary:r.summary??'',checkedAt:String(r.data.checkedAt??r.updatedAt),createdBy:r.createdBy});

export class FounderControlService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  async dashboard(){
    const ctx=this.ctx();
    const [issuesR,editorialR,checksR,cases,groups]=await Promise.all([
      this.repo.listWorkspaceRecords(ctx.tenantId,ISSUE_MODULE),
      this.repo.listWorkspaceRecords(ctx.tenantId,EDITORIAL_MODULE),
      this.repo.listWorkspaceRecords(ctx.tenantId,CHECK_MODULE),
      this.repo.listCases(ctx.tenantId),
      this.repo.listGroups(ctx.tenantId)
    ]);
    const issues=issuesR.map(issueFrom),editorial=editorialR.map(editorialFrom),checks=checksR.map(checkFrom);
    const latestCheck=new Map<string,FounderServiceCheck>();
    for(const check of checks.sort((a,b)=>b.checkedAt.localeCompare(a.checkedAt)))if(!latestCheck.has(check.serviceId))latestCheck.set(check.serviceId,check);
    // Registry-driven on purpose: adding a product module automatically puts it
    // under founder supervision without a second manual dashboard update.
    const services=PRODUCT_MODULES.map(module=>{
      const check=latestCheck.get(module.id);
      const openIssues=issues.filter(x=>x.serviceId===module.id&&!['VERIFIED','CLOSED'].includes(x.state)).length;
      const pendingEditorial=editorial.filter(x=>x.serviceId===module.id&&!['READY','PUBLISHED'].includes(x.state)).length;
      const catalogStatus=module.status;
      const structural=/STRUCTURAL|PLANNED/.test(catalogStatus),failed=check?.state==='FAIL',warn=check?.state==='WARN';
      const attention=failed?'FAIL':warn||structural||openIssues||pendingEditorial?'ATTENTION':check?.state==='PASS'?'PASS':'UNKNOWN';
      return{id:module.id,labelFr:module.labelFr,labelEn:module.labelEn,lot:module.lot,workspace:module.workspace,catalogStatus,latestCheck:check??null,openIssues,pendingEditorial,attention,autoSupervised:true};
    });
    const unknownServiceChecks=checks.filter(x=>!PRODUCT_MODULES.some(m=>m.id===x.serviceId));
    return{
      generatedAt:now(),tenantId:ctx.tenantId,autoSupervision:true,
      totals:{services:services.length,pass:services.filter(x=>x.attention==='PASS').length,attention:services.filter(x=>x.attention==='ATTENTION').length,fail:services.filter(x=>x.attention==='FAIL').length,unknown:services.filter(x=>x.attention==='UNKNOWN').length,openIssues:issues.filter(x=>!['VERIFIED','CLOSED'].includes(x.state)).length,pendingEditorial:editorial.filter(x=>!['READY','PUBLISHED'].includes(x.state)).length,openUserCases:cases.filter(x=>x.status!=='CLOSED').length,groups:groups.length},
      services,issues:issues.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),editorial:editorial.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),userCases:cases.filter(x=>x.status!=='CLOSED').sort((a,b)=>b.openedAt.localeCompare(a.openedAt)),unknownServiceChecks
    };
  }
  async createIssue(input:{serviceId?:string;title:string;summary:string;severity?:FounderControlIssue['severity'];source?:FounderControlIssue['source'];groupId?:string}){
    const ctx=this.ctx(),stamp=now(),title=clean(input.title,180),summary=clean(input.summary,2000);if(!title||!summary)throw new Error('CONTROL_ISSUE_FIELDS_REQUIRED');
    const severity=input.severity??'MEDIUM';if(!['LOW','MEDIUM','HIGH','CRITICAL'].includes(severity))throw new Error('INVALID_CONTROL_ISSUE_SEVERITY');
    const source=input.source??'FOUNDER';if(!['FOUNDER','USER_COMPLAINT','AUTOMATED_CHECK','TEAM'].includes(source))throw new Error('INVALID_CONTROL_ISSUE_SOURCE');
    const r:WorkspaceRecord={id:makeId('control_issue'),tenantId:ctx.tenantId,groupId:input.groupId,moduleId:ISSUE_MODULE,title,summary,status:'ACTIVE',tags:['founder-control','issue',input.serviceId?'service:'+input.serviceId:'service:unassigned'],data:{serviceId:input.serviceId??null,severity,state:'NEW',source,resolution:null},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'FOUNDER_CONTROL_ISSUE_CREATED',targetType:'control_issue',targetId:r.id,requestId:ctx.requestId,metadata:{serviceId:input.serviceId,severity,source}}));return issueFrom(r);
  }
  async transitionIssue(id:string,to:ControlIssueState,resolution=''){
    const ctx=this.ctx(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!r||r.moduleId!==ISSUE_MODULE)throw new Error('CONTROL_ISSUE_NOT_FOUND');
    const current=issueFrom(r),allowed:Record<ControlIssueState,ControlIssueState[]>={NEW:['TRIAGED','IN_PROGRESS','CLOSED'],TRIAGED:['IN_PROGRESS','RESOLVED','CLOSED'],IN_PROGRESS:['RESOLVED','CLOSED'],RESOLVED:['IN_PROGRESS','VERIFIED','CLOSED'],VERIFIED:['IN_PROGRESS','CLOSED'],CLOSED:['IN_PROGRESS']};
    const state=issueState(to);if(!(allowed[current.state]??[]).includes(state))throw new Error('INVALID_CONTROL_ISSUE_TRANSITION');
    if(['RESOLVED','VERIFIED','CLOSED'].includes(state)&&!clean(resolution||r.data.resolution,1000))throw new Error('CONTROL_ISSUE_RESOLUTION_REQUIRED');
    const updatedAt=now(),next:WorkspaceRecord={...r,status:state==='CLOSED'?'ARCHIVED':state==='VERIFIED'?'DONE':'ACTIVE',data:{...r.data,state,resolution:clean(resolution||r.data.resolution,1000)||null},updatedAt};
    await this.repo.saveWorkspaceRecord(next);await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'FOUNDER_CONTROL_ISSUE_STATE_CHANGED',targetType:'control_issue',targetId:id,requestId:ctx.requestId,metadata:{from:current.state,to:state}}));return issueFrom(next);
  }
  async createEditorial(input:{serviceId?:string;title:string;kind?:FounderEditorialItem['kind'];state?:EditorialState;owner?:string;notes?:string}){
    const ctx=this.ctx(),stamp=now(),title=clean(input.title,180);if(!title)throw new Error('EDITORIAL_TITLE_REQUIRED');
    const kind=input.kind??'OTHER';if(!['ARTICLE','HELP','LEGAL','ONBOARDING','FAQ','MARKETING','OTHER'].includes(kind))throw new Error('INVALID_EDITORIAL_KIND');
    const state=editorialState(input.state??'MISSING');const status:WorkspaceStatus=state==='PUBLISHED'?'DONE':'ACTIVE';
    const r:WorkspaceRecord={id:makeId('editorial'),tenantId:ctx.tenantId,moduleId:EDITORIAL_MODULE,title,summary:clean(input.notes,2000)||undefined,status,tags:['founder-control','editorial',input.serviceId?'service:'+input.serviceId:'service:unassigned'],data:{serviceId:input.serviceId??null,kind,state,owner:clean(input.owner,120)||null},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);return editorialFrom(r);
  }
  async transitionEditorial(id:string,to:EditorialState,notes?:string){
    const ctx=this.ctx(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!r||r.moduleId!==EDITORIAL_MODULE)throw new Error('EDITORIAL_TASK_NOT_FOUND');
    const state=editorialState(to),next:WorkspaceRecord={...r,status:state==='PUBLISHED'?'DONE':'ACTIVE',summary:notes===undefined?r.summary:clean(notes,2000),data:{...r.data,state},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return editorialFrom(next);
  }
  async recordCheck(input:{serviceId:string;state:CheckState;source?:string;summary?:string}){
    const ctx=this.ctx(),serviceId=clean(input.serviceId,160);if(!serviceId)throw new Error('SERVICE_ID_REQUIRED');const state=checkState(input.state),stamp=now();
    const r:WorkspaceRecord={id:makeId('service_check'),tenantId:ctx.tenantId,moduleId:CHECK_MODULE,title:serviceId,summary:clean(input.summary,1000)||undefined,status:state==='PASS'?'DONE':'ACTIVE',tags:['founder-control','service-check','service:'+serviceId],data:{serviceId,state,source:clean(input.source,120)||'manual',checkedAt:stamp},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);return checkFrom(r);
  }
}
