import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {GroupEconomicProfile} from '../../economic-intelligence/src/index.js';

export type ExternalProgramKind='PARTNER'|'NGO';
export type ExternalProgramState='DRAFT'|'ACTIVE'|'PAUSED'|'COMPLETED';
export type ExternalProgramTrack='GENERAL'|'WOMEN_LEADERSHIP'|'YOUTH'|'DIGITAL_LITERACY'|'ENTREPRENEURSHIP';
export const STRUCTURAL_INCLUSION_CHARTER={
  accessToOwnData:true,
  sharedPhoneSafe:true,
  equalRoleEligibility:true,
  equalMarketplaceAccess:true,
  voluntaryTargetedPrograms:true,
  protectedAttributesExcludedFromFinancialAndTrustScoring:true,
  complaintAndAppealAccess:true
} as const;
export type AggregateDataAccess='NONE'|'GROUP_AGGREGATE_ECONOMIC';

export interface ExternalProgram {
  id:string;groupId:string;kind:ExternalProgramKind;partyName:string;programName:string;
  purpose:string;localities:string[];tags:string[];track:ExternalProgramTrack;state:ExternalProgramState;
  dataAccess:AggregateDataAccess;createdAt:string;updatedAt:string;createdBy:string;
}
export interface AggregateSharePack {
  id:string;groupId:string;programId:string;groupCode:string;purpose:string;
  generatedAt:string;expiresAt:string;profile:GroupEconomicProfile;
  privacy:'GROUP_PSEUDONYMOUS_AGGREGATE';revocable:true;
}

const PROGRAM_MODULE='PARTNERS.EXTERNAL_PROGRAM';
const SHARE_MODULE='PARTNERS.AGGREGATE_SHARE';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const clean=(v:string,max=500)=>v.trim().replace(/\s+/g,' ').slice(0,max);
const strings=(xs:unknown,maxItems=30)=>Array.isArray(xs)?[...new Set(xs.map(x=>clean(String(x),120)).filter(Boolean))].slice(0,maxItems):[];

const decodeProgram=(r:WorkspaceRecord):ExternalProgram=>({
  id:r.id,groupId:String(r.groupId??''),kind:String(r.data.kind) as ExternalProgramKind,
  partyName:String(r.data.partyName??''),programName:r.title,purpose:String(r.data.purpose??''),
  localities:JSON.parse(String(r.data.localitiesJson??'[]')),tags:JSON.parse(String(r.data.tagsJson??'[]')),
  track:String(r.data.track??'GENERAL') as ExternalProgramTrack,
  state:String(r.data.state??'DRAFT') as ExternalProgramState,
  dataAccess:String(r.data.dataAccess??'NONE') as AggregateDataAccess,
  createdAt:r.createdAt,updatedAt:r.updatedAt,createdBy:r.createdBy
});
const decodeShare=(r:WorkspaceRecord):AggregateSharePack=>({
  id:r.id,groupId:String(r.groupId??''),programId:String(r.data.programId??''),groupCode:String(r.data.groupCode??''),
  purpose:String(r.data.purpose??''),generatedAt:String(r.data.generatedAt??r.createdAt),expiresAt:String(r.data.expiresAt??r.updatedAt),
  profile:JSON.parse(String(r.data.profileJson??'{}')) as GroupEconomicProfile,
  privacy:'GROUP_PSEUDONYMOUS_AGGREGATE',revocable:true
});

export class ExternalProgramsService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private async requireManager(groupId:string){
    const ctx=this.kernel.context.get(),g=await this.repo.getGroup(ctx.tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');
    if(g.createdBy===ctx.actorId)return g;
    const m=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
    if(!m?.roles.some(r=>managers.has(r)))throw new Error('FORBIDDEN_SCOPE');return g;
  }
  async list(groupId:string,kind?:ExternalProgramKind):Promise<ExternalProgram[]>{
    await this.requireManager(groupId);const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,PROGRAM_MODULE,groupId)).map(decodeProgram).filter(x=>!kind||x.kind===kind).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  async create(groupId:string,input:{kind:ExternalProgramKind;partyName:string;programName:string;purpose:string;localities?:string[];tags?:string[];track?:ExternalProgramTrack;dataAccess?:AggregateDataAccess}):Promise<ExternalProgram>{
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),stamp=now();
    if(!['PARTNER','NGO'].includes(input.kind))throw new Error('INVALID_EXTERNAL_PROGRAM_KIND');
    const partyName=clean(input.partyName,160),programName=clean(input.programName,180),purpose=clean(input.purpose,1000);
    if(!partyName||!programName||!purpose)throw new Error('EXTERNAL_PROGRAM_FIELDS_REQUIRED');
    const dataAccess=input.dataAccess??'NONE';if(!['NONE','GROUP_AGGREGATE_ECONOMIC'].includes(dataAccess))throw new Error('INVALID_EXTERNAL_DATA_ACCESS');
    const track=input.track??'GENERAL';if(!['GENERAL','WOMEN_LEADERSHIP','YOUTH','DIGITAL_LITERACY','ENTREPRENEURSHIP'].includes(track))throw new Error('INVALID_EXTERNAL_PROGRAM_TRACK');
    const program:ExternalProgram={id:makeId(input.kind==='NGO'?'ngo_program':'partner_program'),groupId,kind:input.kind,partyName,programName,purpose,localities:strings(input.localities),tags:strings(input.tags),track,state:'DRAFT',dataAccess,createdAt:stamp,updatedAt:stamp,createdBy:ctx.actorId};
    const record:WorkspaceRecord={id:program.id,tenantId:ctx.tenantId,groupId,moduleId:PROGRAM_MODULE,title:programName,summary:purpose.slice(0,500),status:'DRAFT',tags:['external-program',input.kind.toLowerCase(),...program.tags.map(x=>'topic:'+x)],data:{kind:program.kind,partyName:program.partyName,purpose:program.purpose,localitiesJson:JSON.stringify(program.localities),tagsJson:JSON.stringify(program.tags),track:program.track,state:program.state,dataAccess:program.dataAccess,inclusionCharterJson:JSON.stringify(STRUCTURAL_INCLUSION_CHARTER)},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'EXTERNAL_PROGRAM_CREATED',targetType:'external_program',targetId:program.id,requestId:ctx.requestId,metadata:{groupId,kind:program.kind,dataAccess:program.dataAccess}}));
    return program;
  }
  async transition(groupId:string,id:string,to:ExternalProgramState):Promise<ExternalProgram>{
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(!r||r.groupId!==groupId||r.moduleId!==PROGRAM_MODULE)throw new Error('EXTERNAL_PROGRAM_NOT_FOUND');
    const current=decodeProgram(r),allowed:Record<ExternalProgramState,ExternalProgramState[]>={DRAFT:['ACTIVE'],ACTIVE:['PAUSED','COMPLETED'],PAUSED:['ACTIVE','COMPLETED'],COMPLETED:[]};
    if(!(allowed[current.state]??[]).includes(to))throw new Error('INVALID_EXTERNAL_PROGRAM_TRANSITION');
    const next={...current,state:to,updatedAt:now()};
    await this.repo.saveWorkspaceRecord({...r,status:to==='DRAFT'?'DRAFT':to==='COMPLETED'?'DONE':'ACTIVE',data:{...r.data,state:to},updatedAt:next.updatedAt});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'EXTERNAL_PROGRAM_STATE_CHANGED',targetType:'external_program',targetId:id,requestId:ctx.requestId,metadata:{from:current.state,to}}));
    return next;
  }
  async issueAggregateSharePack(groupId:string,programId:string,profile:GroupEconomicProfile,purpose:string,ttlDays=30):Promise<AggregateSharePack>{
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,programId);
    if(!r||r.groupId!==groupId||r.moduleId!==PROGRAM_MODULE)throw new Error('EXTERNAL_PROGRAM_NOT_FOUND');
    const program=decodeProgram(r);if(program.state!=='ACTIVE')throw new Error('EXTERNAL_PROGRAM_NOT_ACTIVE');
    if(program.dataAccess!=='GROUP_AGGREGATE_ECONOMIC')throw new Error('AGGREGATE_DATA_ACCESS_NOT_GRANTED');
    if(!profile.exportable||profile.containsIndividualFinancialData!==false||profile.privacy!=='GROUP_PSEUDONYMOUS_AGGREGATE')throw new Error('ECONOMIC_PROFILE_NOT_EXPORTABLE');
    if(profile.groupCode.includes(groupId))throw new Error('RAW_GROUP_IDENTIFIER_FORBIDDEN');
    const days=Math.min(Math.max(Math.trunc(ttlDays),1),90),generatedAt=now(),expiresAt=new Date(Date.now()+days*86400000).toISOString(),id=makeId('aggregate_share');
    const pack:AggregateSharePack={id,groupId,programId,groupCode:profile.groupCode,purpose:clean(purpose||program.purpose,500),generatedAt,expiresAt,profile:structuredClone(profile),privacy:'GROUP_PSEUDONYMOUS_AGGREGATE',revocable:true};
    await this.repo.saveWorkspaceRecord({id,tenantId:ctx.tenantId,groupId,moduleId:SHARE_MODULE,title:'Dossier agrégé · '+program.partyName,summary:pack.purpose,status:'ACTIVE',tags:['aggregate-share','program:'+programId,'privacy:pseudonymous-group'],data:{programId,groupCode:profile.groupCode,purpose:pack.purpose,generatedAt,expiresAt,profileJson:JSON.stringify(profile),revoked:false},createdBy:ctx.actorId,createdAt:generatedAt,updatedAt:generatedAt});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'AGGREGATE_ECONOMIC_SHARE_ISSUED',targetType:'aggregate_share',targetId:id,requestId:ctx.requestId,metadata:{programId,groupCode:profile.groupCode,expiresAt}}));
    return pack;
  }
  async sharePacks(groupId:string,programId:string):Promise<AggregateSharePack[]>{
    await this.requireManager(groupId);const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,SHARE_MODULE,groupId)).filter(r=>String(r.data.programId)===programId&&r.data.revoked!==true).map(decodeShare).sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt));
  }
  async revokeSharePack(groupId:string,shareId:string):Promise<void>{
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,shareId);
    if(!r||r.groupId!==groupId||r.moduleId!==SHARE_MODULE)throw new Error('AGGREGATE_SHARE_NOT_FOUND');
    await this.repo.saveWorkspaceRecord({...r,status:'ARCHIVED',data:{...r.data,revoked:true},updatedAt:now()});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'AGGREGATE_ECONOMIC_SHARE_REVOKED',targetType:'aggregate_share',targetId:shareId,requestId:ctx.requestId}));
  }
}
