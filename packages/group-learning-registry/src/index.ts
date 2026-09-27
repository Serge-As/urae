import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import {makeId} from '../../contracts/src/index.js';

const MODEL='GROUP.MODEL_REGISTRY',CASE='GROUP.CASE_LAW';
const managers=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const now=()=>new Date().toISOString();
const str=(v:unknown,n=4000)=>String(v??'').trim().slice(0,n);
const json=(v:unknown,max=80000)=>{const raw=typeof v==='string'?v:JSON.stringify(v??null);if(raw.length>max)throw Error('REGISTRY_PAYLOAD_TOO_LARGE');JSON.parse(raw);return raw;};
type ModelState='HISTORICAL'|'EXPERIMENTAL'|'STANDARD'|'REVIEW_REQUESTED'|'RECOMMENDED'|'DEPRECATED';
type CaseState='DRAFT'|'LOCAL_VALIDATED'|'REVIEW_REQUESTED'|'RECOMMENDED'|'REJECTED'|'ARCHIVED';

class Access{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  ctx(){return this.kernel.context.get();}
  async group(groupId:Id,manage=false){
    const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
    if(g.createdBy===c.actorId)return g;
    const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m||manage&&!m.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return g;
  }
  async canSeeGroup(groupId?:Id){
    if(!groupId)return false;try{await this.group(groupId,false);return true;}catch{return false;}
  }
}

export class GroupModelRegistryService extends Access{
  async list(groupId?:Id){
    const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,MODEL,groupId);
    if(groupId){await this.group(groupId,false);return rows.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
    const visible=[];for(const r of rows){if(r.data.modelState==='RECOMMENDED'||await this.canSeeGroup(r.groupId))visible.push(r);}
    return visible.sort((a,b)=>String(b.data.modelVersion??0).localeCompare(String(a.data.modelVersion??0))||b.updatedAt.localeCompare(a.updatedAt));
  }
  async capture(groupId:Id,input:{title:string;modelState?:'HISTORICAL'|'EXPERIMENTAL'|'STANDARD';context:string;evidenceRef:string;compatibility?:string;outcomes?:string;variantOfId?:Id;notes?:string}){
    const g=await this.group(groupId,true),c=this.ctx(),rubrics=await this.repo.listRubricDefinitions(c.tenantId,groupId);
    const state:ModelState=input.modelState??'EXPERIMENTAL';if(!['HISTORICAL','EXPERIMENTAL','STANDARD'].includes(state))throw Error('MODEL_STATE_NOT_CREATABLE');
    const title=str(input.title,240),context=str(input.context,6000),evidence=str(input.evidenceRef,1200);if(!title||!context||!evidence)throw Error('MODEL_REQUIRED_FIELDS');
    let variantOf:WorkspaceRecord|undefined;if(input.variantOfId){variantOf=await this.repo.getWorkspaceRecord(c.tenantId,input.variantOfId);if(!variantOf||variantOf.moduleId!==MODEL)throw Error('MODEL_VARIANT_PARENT_NOT_FOUND');}
    const modelKey=variantOf?String(variantOf.data.modelKey):makeId('group_model'),siblings=(await this.repo.listWorkspaceRecords(c.tenantId,MODEL)).filter(x=>x.data.modelKey===modelKey),version=Math.max(0,...siblings.map(x=>Number(x.data.modelVersion??0)))+1,stamp=now();
    const rubricBlueprint=rubrics.filter(x=>x.status==='ACTIVE').map(x=>({name:x.name,activityPlan:x.activityPlan,facets:x.facets,operatingModel:x.operatingModel,policies:x.policies}));
    const data={modelKey,modelVersion:version,modelState:state,sourceGroupId:groupId,family:g.kind,governance:g.governanceModel,context,evidenceRef:evidence,compatibility:str(input.compatibility,5000),outcomes:str(input.outcomes,5000),notes:str(input.notes,5000),variantOfId:input.variantOfId??'',rubricBlueprintJson:json(rubricBlueprint),launchProfileJson:json(g.launchProfileSnapshot??{}),reviewNote:'',reviewedAt:'',reviewedBy:'',containsMemberData:false};
    const r:WorkspaceRecord={id:makeId('group_model_version'),tenantId:c.tenantId,groupId,moduleId:MODEL,title,summary:context.slice(0,1000),status:'ACTIVE',tags:['group-model','versioned','state:'+state],data,createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(r);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'GROUP_MODEL_CAPTURED',targetType:'group_model',targetId:r.id,requestId:c.requestId,metadata:{groupId,modelKey,version,state}}));return r;
  }
  async requestReview(groupId:Id,id:Id){
    await this.group(groupId,true);const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!==MODEL)throw Error('GROUP_MODEL_NOT_FOUND');
    if(r.data.modelState==='DEPRECATED')throw Error('DEPRECATED_MODEL_CANNOT_REVIEW');
    const next={...r,tags:['group-model','versioned','state:REVIEW_REQUESTED'],data:{...r.data,modelState:'REVIEW_REQUESTED'},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async review(id:Id,state:'STANDARD'|'RECOMMENDED'|'DEPRECATED',note:string,founderAuthorized:boolean){
    if(!founderAuthorized)throw Error('FOUNDER_TEAM_ONLY');const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!==MODEL)throw Error('GROUP_MODEL_NOT_FOUND');
    const why=str(note,5000);if(!why)throw Error('MODEL_REVIEW_NOTE_REQUIRED');
    const next={...r,tags:['group-model','versioned','state:'+state],data:{...r.data,modelState:state,reviewNote:why,reviewedAt:now(),reviewedBy:c.actorId},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'GROUP_MODEL_REVIEWED',targetType:'group_model',targetId:id,requestId:c.requestId,metadata:{state,note:why}}));return next;
  }
  async reviewQueue(founderAuthorized:boolean){if(!founderAuthorized)throw Error('FOUNDER_TEAM_ONLY');const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId,MODEL)).filter(x=>x.data.modelState==='REVIEW_REQUESTED').sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));}
}

export class GroupCaseLawService extends Access{
  async list(groupId:Id){await this.group(groupId,false);const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId,CASE,groupId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  async create(groupId:Id,input:{title:string;situation:string;justification:string;experiment:string;results?:string;disputes?:string;reproducibility?:string;evidenceRef:string;simulationRef?:string;measurementRef?:string;arbitrationRef?:string}){
    await this.group(groupId,true);const c=this.ctx(),title=str(input.title,240),situation=str(input.situation,6000),justification=str(input.justification,6000),experiment=str(input.experiment,6000),evidenceRef=str(input.evidenceRef,1200);if(!title||!situation||!justification||!experiment||!evidenceRef)throw Error('CASE_LAW_REQUIRED_FIELDS');
    const stamp=now(),r:WorkspaceRecord={id:makeId('case_law'),tenantId:c.tenantId,groupId,moduleId:CASE,title,summary:situation.slice(0,1000),status:'DRAFT',tags:['case-law','state:DRAFT'],data:{caseState:'DRAFT',situation,justification,experiment,results:str(input.results,6000),disputes:str(input.disputes,6000),reproducibility:str(input.reproducibility,6000),evidenceRef,simulationRef:str(input.simulationRef,1200),measurementRef:str(input.measurementRef,1200),arbitrationRef:str(input.arbitrationRef,1200),globalRecommendation:false,autoRuleActivation:false,promotedModelId:''},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(r);return r;
  }
  async validateLocal(groupId:Id,id:Id){
    await this.group(groupId,true);const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!==CASE)throw Error('CASE_LAW_NOT_FOUND');
    const next={...r,status:'ACTIVE' as const,tags:['case-law','state:LOCAL_VALIDATED'],data:{...r.data,caseState:'LOCAL_VALIDATED',localValidatedAt:now(),localValidatedBy:c.actorId,globalRecommendation:false,autoRuleActivation:false},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  private recommendable(r:WorkspaceRecord){return Boolean(str(r.data.simulationRef)&&str(r.data.measurementRef)&&str(r.data.arbitrationRef)&&str(r.data.results)&&str(r.data.reproducibility));}
  async requestReview(groupId:Id,id:Id){
    await this.group(groupId,true);const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!==CASE)throw Error('CASE_LAW_NOT_FOUND');if(!this.recommendable(r))throw Error('CASE_LAW_RECOMMENDATION_EVIDENCE_INCOMPLETE');
    const next={...r,status:'ACTIVE' as const,tags:['case-law','state:REVIEW_REQUESTED'],data:{...r.data,caseState:'REVIEW_REQUESTED'},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async review(id:Id,state:'RECOMMENDED'|'REJECTED'|'ARCHIVED',note:string,founderAuthorized:boolean){
    if(!founderAuthorized)throw Error('FOUNDER_TEAM_ONLY');const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!==CASE)throw Error('CASE_LAW_NOT_FOUND');if(state==='RECOMMENDED'&&!this.recommendable(r))throw Error('CASE_LAW_RECOMMENDATION_EVIDENCE_INCOMPLETE');
    const why=str(note,5000);if(!why)throw Error('CASE_LAW_REVIEW_NOTE_REQUIRED');const status:'ACTIVE'|'ARCHIVED'=state==='ARCHIVED'?'ARCHIVED':'ACTIVE';const next:WorkspaceRecord={...r,status,tags:['case-law','state:'+state],data:{...r.data,caseState:state,reviewNote:why,reviewedAt:now(),reviewedBy:c.actorId,globalRecommendation:state==='RECOMMENDED',autoRuleActivation:false},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async reviewQueue(founderAuthorized:boolean){if(!founderAuthorized)throw Error('FOUNDER_TEAM_ONLY');const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId,CASE)).filter(x=>x.data.caseState==='REVIEW_REQUESTED').sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));}
}
