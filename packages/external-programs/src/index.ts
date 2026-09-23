import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord,Id} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {GroupEconomicProfile} from '../../economic-intelligence/src/index.js';

export type ExternalProgramKind='PARTNER'|'NGO';
export type ExternalProgramState='DRAFT'|'ACTIVE'|'PAUSED'|'COMPLETED';
export type AggregateDataAccess='NONE'|'GROUP_AGGREGATE_ECONOMIC';
export type ProgramEnrollmentState='ENROLLED'|'REVOKED'|'EXPIRED';
export type SupportActionKind='TRAINING'|'COACHING'|'EQUIPMENT'|'GRANT'|'RESTRUCTURING'|'OTHER';
export type FundingState='PROMISED'|'AGREED'|'RECEIVED'|'ALLOCATED'|'JUSTIFIED';
export type HandoverStage='PREPARATION'|'OBSERVER'|'CO_MANAGEMENT'|'LOCAL_MANAGEMENT'|'CLOSED';

export interface ExternalProgram {
  id:string;groupId:string;kind:ExternalProgramKind;partyName:string;programName:string;
  purpose:string;localities:string[];tags:string[];state:ExternalProgramState;
  dataAccess:AggregateDataAccess;createdAt:string;updatedAt:string;createdBy:string;
}
export interface AggregateSharePack {
  id:string;groupId:string;programId:string;groupCode:string;purpose:string;
  generatedAt:string;expiresAt:string;profile:GroupEconomicProfile;
  privacy:'GROUP_PSEUDONYMOUS_AGGREGATE';revocable:true;
}

const PROGRAM_MODULE='PARTNERS.EXTERNAL_PROGRAM';
const SHARE_MODULE='PARTNERS.AGGREGATE_SHARE';
const ENROLLMENT_MODULE='PARTNERS.PROGRAM_ENROLLMENT';
const SUPPORT_MODULE='PARTNERS.SUPPORT_ACTION';
const FUNDING_MODULE='PARTNERS.FUNDING_EVIDENCE';
const HANDOVER_MODULE='PARTNERS.HANDOVER_PLAN';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const clean=(v:unknown,max=500)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,max);
const strings=(xs:unknown,maxItems=30)=>Array.isArray(xs)?[...new Set(xs.map(x=>clean(x,120)).filter(Boolean))].slice(0,maxItems):[];
const safeScopes=new Set(['TRAINING','GROUP_AGGREGATES','DOCUMENT_REVIEW','PROGRAM_METRICS','SUPPORT_ACTIONS','CO_MANAGEMENT']);
const fundingRank:Record<FundingState,number>={PROMISED:0,AGREED:1,RECEIVED:2,ALLOCATED:3,JUSTIFIED:4};

const decodeProgram=(r:WorkspaceRecord):ExternalProgram=>({
  id:r.id,groupId:String(r.groupId??''),kind:String(r.data.kind) as ExternalProgramKind,
  partyName:String(r.data.partyName??''),programName:r.title,purpose:String(r.data.purpose??''),
  localities:JSON.parse(String(r.data.localitiesJson??'[]')),tags:JSON.parse(String(r.data.tagsJson??'[]')),
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
  private ctx(){return this.kernel.context.get();}
  private async requireManager(groupId:string){
    const ctx=this.ctx(),g=await this.repo.getGroup(ctx.tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');
    if(g.createdBy===ctx.actorId)return g;
    const m=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
    if(!m?.roles.some(r=>managers.has(r)))throw new Error('FORBIDDEN_SCOPE');return g;
  }
  private async record(moduleId:string,groupId:string,title:string,data:WorkspaceRecord['data'],tags:string[],status:WorkspaceRecord['status']='ACTIVE'){
    const ctx=this.ctx(),stamp=now(),record:WorkspaceRecord={id:makeId('program'),tenantId:ctx.tenantId,groupId,moduleId,title,status,tags,data,createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(record);return record;
  }
  private async activeProgram(groupId:string,programId:string){
    const r=await this.repo.getWorkspaceRecord(this.ctx().tenantId,programId);if(!r||r.groupId!==groupId||r.moduleId!==PROGRAM_MODULE)throw new Error('EXTERNAL_PROGRAM_NOT_FOUND');
    if(String(r.data.state)!=='ACTIVE')throw new Error('EXTERNAL_PROGRAM_NOT_ACTIVE');return r;
  }
  private async enrollment(groupId:string,enrollmentId:string,active=true){
    const r=await this.repo.getWorkspaceRecord(this.ctx().tenantId,enrollmentId);if(!r||r.groupId!==groupId||r.moduleId!==ENROLLMENT_MODULE)throw new Error('PROGRAM_ENROLLMENT_NOT_FOUND');
    const expired=Boolean(r.data.endsAt&&Date.parse(String(r.data.endsAt))<=Date.now());
    if(active&&(String(r.data.state)!=='ENROLLED'||expired))throw new Error('PROGRAM_ENROLLMENT_NOT_ACTIVE');
    return r;
  }

  async list(groupId:string,kind?:ExternalProgramKind):Promise<ExternalProgram[]>{
    await this.requireManager(groupId);const ctx=this.ctx();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,PROGRAM_MODULE,groupId)).map(decodeProgram).filter(x=>!kind||x.kind===kind).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  async create(groupId:string,input:{kind:ExternalProgramKind;partyName:string;programName:string;purpose:string;localities?:string[];tags?:string[];dataAccess?:AggregateDataAccess}):Promise<ExternalProgram>{
    await this.requireManager(groupId);const ctx=this.ctx(),stamp=now();
    if(!['PARTNER','NGO'].includes(input.kind))throw new Error('INVALID_EXTERNAL_PROGRAM_KIND');
    const partyName=clean(input.partyName,160),programName=clean(input.programName,180),purpose=clean(input.purpose,1000);
    if(!partyName||!programName||!purpose)throw new Error('EXTERNAL_PROGRAM_FIELDS_REQUIRED');
    const dataAccess=input.dataAccess??'NONE';if(!['NONE','GROUP_AGGREGATE_ECONOMIC'].includes(dataAccess))throw new Error('INVALID_EXTERNAL_DATA_ACCESS');
    const program:ExternalProgram={id:makeId(input.kind==='NGO'?'ngo_program':'partner_program'),groupId,kind:input.kind,partyName,programName,purpose,localities:strings(input.localities),tags:strings(input.tags),state:'DRAFT',dataAccess,createdAt:stamp,updatedAt:stamp,createdBy:ctx.actorId};
    const record:WorkspaceRecord={id:program.id,tenantId:ctx.tenantId,groupId,moduleId:PROGRAM_MODULE,title:programName,summary:purpose.slice(0,500),status:'DRAFT',tags:['external-program',input.kind.toLowerCase(),...program.tags.map(x=>'topic:'+x)],data:{kind:program.kind,partyName:program.partyName,purpose:program.purpose,localitiesJson:JSON.stringify(program.localities),tagsJson:JSON.stringify(program.tags),state:program.state,dataAccess:program.dataAccess},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'EXTERNAL_PROGRAM_CREATED',targetType:'external_program',targetId:program.id,requestId:ctx.requestId,metadata:{groupId,kind:program.kind,dataAccess:program.dataAccess}}));
    return program;
  }
  async transition(groupId:string,id:string,to:ExternalProgramState):Promise<ExternalProgram>{
    await this.requireManager(groupId);const ctx=this.ctx(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(!r||r.groupId!==groupId||r.moduleId!==PROGRAM_MODULE)throw new Error('EXTERNAL_PROGRAM_NOT_FOUND');
    const current=decodeProgram(r),allowed:Record<ExternalProgramState,ExternalProgramState[]>={DRAFT:['ACTIVE'],ACTIVE:['PAUSED','COMPLETED'],PAUSED:['ACTIVE','COMPLETED'],COMPLETED:[]};
    if(!(allowed[current.state]??[]).includes(to))throw new Error('INVALID_EXTERNAL_PROGRAM_TRANSITION');
    const next={...current,state:to,updatedAt:now()};
    await this.repo.saveWorkspaceRecord({...r,status:to==='DRAFT'?'DRAFT':to==='COMPLETED'?'DONE':'ACTIVE',data:{...r.data,state:to},updatedAt:next.updatedAt});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'EXTERNAL_PROGRAM_STATE_CHANGED',targetType:'external_program',targetId:id,requestId:ctx.requestId,metadata:{from:current.state,to}}));
    return next;
  }

  async createEnrollment(groupId:string,programId:string,input:{consentRef:string;purpose:string;scopes:string[];startsAt?:string;endsAt:string;facilitatorRef?:string}){
    await this.requireManager(groupId);await this.activeProgram(groupId,programId);
    const consentRef=clean(input.consentRef,500),purpose=clean(input.purpose,800),scopes=[...new Set(input.scopes.map(x=>clean(x,80).toUpperCase()).filter(Boolean))];
    if(!consentRef||!purpose||!scopes.length)throw new Error('PROGRAM_ENROLLMENT_CONSENT_REQUIRED');
    if(scopes.some(x=>!safeScopes.has(x)))throw new Error('PROGRAM_SCOPE_FORBIDDEN');
    const startsAt=input.startsAt?new Date(input.startsAt).toISOString():now(),endsAt=new Date(input.endsAt).toISOString();
    if(!Number.isFinite(Date.parse(startsAt))||!Number.isFinite(Date.parse(endsAt))||Date.parse(endsAt)<=Math.max(Date.parse(startsAt),Date.now()))throw new Error('INVALID_PROGRAM_ENROLLMENT_PERIOD');
    const r=await this.record(ENROLLMENT_MODULE,groupId,'Mandat d’accompagnement',{programId,consentRef,purpose,scopesJson:JSON.stringify(scopes),startsAt,endsAt,facilitatorRef:clean(input.facilitatorRef,240),state:'ENROLLED',grantsFinancialRole:false,individualFinanceAccess:false},['program-enrollment','program:'+programId,'consent-bounded']);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:this.ctx().tenantId,actorId:this.ctx().actorId,action:'PROGRAM_ENROLLED',targetType:'program_enrollment',targetId:r.id,requestId:this.ctx().requestId,metadata:{groupId,programId,endsAt,scopes}}));return r;
  }
  async enrollments(groupId:string,programId:string){
    await this.requireManager(groupId);const rows=await this.repo.listWorkspaceRecords(this.ctx().tenantId,ENROLLMENT_MODULE,groupId);
    return rows.filter(x=>String(x.data.programId)===programId).map(x=>{
      const expired=Boolean(x.data.endsAt&&Date.parse(String(x.data.endsAt))<=Date.now());
      return expired&&x.data.state==='ENROLLED'?{...x,data:{...x.data,state:'EXPIRED'}}:x;
    });
  }
  async revokeEnrollment(groupId:string,enrollmentId:string,reason:string){
    await this.requireManager(groupId);const r=await this.enrollment(groupId,enrollmentId,false),why=clean(reason,800);if(!why)throw new Error('REVOCATION_REASON_REQUIRED');
    const next={...r,status:'ARCHIVED' as const,data:{...r.data,state:'REVOKED',revokedAt:now(),revocationReason:why},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }

  async recordSupportAction(groupId:string,enrollmentId:string,input:{kind:SupportActionKind;summary:string;evidenceRef?:string;performedAt?:string}){
    await this.requireManager(groupId);const enrollment=await this.enrollment(groupId,enrollmentId,true);
    if(!['TRAINING','COACHING','EQUIPMENT','GRANT','RESTRUCTURING','OTHER'].includes(input.kind))throw new Error('INVALID_SUPPORT_ACTION_KIND');
    const summary=clean(input.summary,1500);if(!summary)throw new Error('SUPPORT_ACTION_SUMMARY_REQUIRED');
    const performedAt=input.performedAt?new Date(input.performedAt).toISOString():now();if(!Number.isFinite(Date.parse(performedAt)))throw new Error('INVALID_SUPPORT_ACTION_DATE');
    return this.record(SUPPORT_MODULE,groupId,'Action d’accompagnement · '+input.kind,{programId:String(enrollment.data.programId),enrollmentId,kind:input.kind,summary,evidenceRef:clean(input.evidenceRef,500),performedAt,grantsFinancialRole:false},['support-action','program:'+String(enrollment.data.programId),input.kind.toLowerCase()],'DONE');
  }
  async supportActions(groupId:string,enrollmentId:string){
    await this.requireManager(groupId);await this.enrollment(groupId,enrollmentId,false);return (await this.repo.listWorkspaceRecords(this.ctx().tenantId,SUPPORT_MODULE,groupId)).filter(x=>String(x.data.enrollmentId)===enrollmentId);
  }

  async recordFundingEvidence(groupId:string,enrollmentId:string,input:{state:FundingState;amount:number;currency?:string;evidenceRef:string;ledgerEntryId?:Id;note?:string}){
    await this.requireManager(groupId);const enrollment=await this.enrollment(groupId,enrollmentId,true);
    if(!Object.prototype.hasOwnProperty.call(fundingRank,input.state))throw new Error('INVALID_FUNDING_STATE');
    if(!Number.isSafeInteger(input.amount)||input.amount<0)throw new Error('INVALID_FUNDING_AMOUNT');
    const evidenceRef=clean(input.evidenceRef,500);if(!evidenceRef)throw new Error('FUNDING_EVIDENCE_REQUIRED');
    if(fundingRank[input.state]>=fundingRank.RECEIVED&&input.amount>0){
      if(!input.ledgerEntryId)throw new Error('FUNDING_LEDGER_ENTRY_REQUIRED');
      const ledger=await this.repo.getLedgerEntry(this.ctx().tenantId,groupId,input.ledgerEntryId);if(!ledger)throw new Error('FUNDING_LEDGER_ENTRY_NOT_FOUND');
    }
    return this.record(FUNDING_MODULE,groupId,'Financement programme · '+input.state,{programId:String(enrollment.data.programId),enrollmentId,state:input.state,amount:input.amount,currency:clean(input.currency||'XAF',12).toUpperCase(),evidenceRef,ledgerEntryId:input.ledgerEntryId??'',note:clean(input.note,1000),financialTruthOwner:'LEDGER',promiseIsMoney:false},['funding-evidence','program:'+String(enrollment.data.programId),input.state.toLowerCase()],'DONE');
  }
  async fundingEvidence(groupId:string,enrollmentId:string){
    await this.requireManager(groupId);await this.enrollment(groupId,enrollmentId,false);return (await this.repo.listWorkspaceRecords(this.ctx().tenantId,FUNDING_MODULE,groupId)).filter(x=>String(x.data.enrollmentId)===enrollmentId);
  }

  async createHandoverPlan(groupId:string,enrollmentId:string,input:{localOwnerRef:string;note?:string;authorizationRef?:string}){
    await this.requireManager(groupId);const enrollment=await this.enrollment(groupId,enrollmentId,true),localOwnerRef=clean(input.localOwnerRef,240);if(!localOwnerRef)throw new Error('LOCAL_OWNER_REQUIRED');
    return this.record(HANDOVER_MODULE,groupId,'Plan de transfert vers la gestion locale',{programId:String(enrollment.data.programId),enrollmentId,localOwnerRef,note:clean(input.note,1200),authorizationRef:clean(input.authorizationRef,500),stage:'PREPARATION',grantsFinancialRole:false,roleChangesRequireCanonicalMembership:true},['handover','program:'+String(enrollment.data.programId)]);
  }
  async transitionHandover(groupId:string,planId:string,to:HandoverStage,input:{authorizationRef?:string;note?:string}={}){
    await this.requireManager(groupId);const r=await this.repo.getWorkspaceRecord(this.ctx().tenantId,planId);if(!r||r.groupId!==groupId||r.moduleId!==HANDOVER_MODULE)throw new Error('HANDOVER_PLAN_NOT_FOUND');
    const from=String(r.data.stage) as HandoverStage,allowed:Record<HandoverStage,HandoverStage[]>={PREPARATION:['OBSERVER'],OBSERVER:['CO_MANAGEMENT','LOCAL_MANAGEMENT'],CO_MANAGEMENT:['LOCAL_MANAGEMENT'],LOCAL_MANAGEMENT:['CLOSED'],CLOSED:[]};
    if(!(allowed[from]??[]).includes(to))throw new Error('INVALID_HANDOVER_TRANSITION');
    const authorizationRef=clean(input.authorizationRef??r.data.authorizationRef,500);if(to==='CO_MANAGEMENT'&&!authorizationRef)throw new Error('CO_MANAGEMENT_AUTHORIZATION_REQUIRED');
    const next={...r,status:to==='CLOSED'?'DONE' as const:'ACTIVE' as const,data:{...r.data,stage:to,authorizationRef,note:clean(input.note??r.data.note,1200),grantsFinancialRole:false,transitionedAt:now()},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async handoverPlans(groupId:string,enrollmentId:string){
    await this.requireManager(groupId);return (await this.repo.listWorkspaceRecords(this.ctx().tenantId,HANDOVER_MODULE,groupId)).filter(x=>String(x.data.enrollmentId)===enrollmentId);
  }

  async issueAggregateSharePack(groupId:string,programId:string,profile:GroupEconomicProfile,purpose:string,ttlDays=30):Promise<AggregateSharePack>{
    await this.requireManager(groupId);const r=await this.activeProgram(groupId,programId),program=decodeProgram(r);
    if(program.dataAccess!=='GROUP_AGGREGATE_ECONOMIC')throw new Error('AGGREGATE_DATA_ACCESS_NOT_GRANTED');
    if(!profile.exportable||profile.containsIndividualFinancialData!==false||profile.privacy!=='GROUP_PSEUDONYMOUS_AGGREGATE')throw new Error('ECONOMIC_PROFILE_NOT_EXPORTABLE');
    if(profile.groupCode.includes(groupId))throw new Error('RAW_GROUP_IDENTIFIER_FORBIDDEN');
    const days=Math.min(Math.max(Math.trunc(ttlDays),1),90),generatedAt=now(),expiresAt=new Date(Date.now()+days*86400000).toISOString(),id=makeId('aggregate_share');
    const pack:AggregateSharePack={id,groupId,programId,groupCode:profile.groupCode,purpose:clean(purpose||program.purpose,500),generatedAt,expiresAt,profile:structuredClone(profile),privacy:'GROUP_PSEUDONYMOUS_AGGREGATE',revocable:true};
    await this.repo.saveWorkspaceRecord({id,tenantId:this.ctx().tenantId,groupId,moduleId:SHARE_MODULE,title:'Dossier agrégé · '+program.partyName,summary:pack.purpose,status:'ACTIVE',tags:['aggregate-share','program:'+programId,'privacy:pseudonymous-group'],data:{programId,groupCode:profile.groupCode,purpose:pack.purpose,generatedAt,expiresAt,profileJson:JSON.stringify(profile),revoked:false},createdBy:this.ctx().actorId,createdAt:generatedAt,updatedAt:generatedAt});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:this.ctx().tenantId,actorId:this.ctx().actorId,action:'AGGREGATE_ECONOMIC_SHARE_ISSUED',targetType:'aggregate_share',targetId:id,requestId:this.ctx().requestId,metadata:{programId,groupCode:profile.groupCode,expiresAt}}));return pack;
  }
  async sharePacks(groupId:string,programId:string):Promise<AggregateSharePack[]>{
    await this.requireManager(groupId);return (await this.repo.listWorkspaceRecords(this.ctx().tenantId,SHARE_MODULE,groupId)).filter(r=>String(r.data.programId)===programId&&r.data.revoked!==true).map(decodeShare).sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt));
  }
  async revokeSharePack(groupId:string,shareId:string):Promise<void>{
    await this.requireManager(groupId);const ctx=this.ctx(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,shareId);
    if(!r||r.groupId!==groupId||r.moduleId!==SHARE_MODULE)throw new Error('AGGREGATE_SHARE_NOT_FOUND');
    await this.repo.saveWorkspaceRecord({...r,status:'ARCHIVED',data:{...r.data,revoked:true},updatedAt:now()});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'AGGREGATE_ECONOMIC_SHARE_REVOKED',targetType:'aggregate_share',targetId:shareId,requestId:ctx.requestId}));
  }
}
