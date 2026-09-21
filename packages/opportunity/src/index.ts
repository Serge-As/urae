import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import {makeId,type Id,type WorkspaceRecord} from '../../contracts/src/index.js';

export type OpportunityDirection='NEED'|'OFFER';
export type OpportunityState='DRAFT'|'OPEN'|'MATCHING'|'FULFILLED'|'CANCELLED';
export type OpportunityVisibility='PRIVATE'|'GROUP'|'PLATFORM';
export type OpportunityUrgency='NORMAL'|'SOON'|'NOW';
export type OpportunitySource='DIRECT'|'BLUEPRINT'|'FORUM'|'COMMUNITY';

export interface OpportunityInput{
  title:string;
  summary?:string;
  direction?:OpportunityDirection;
  category?:string;
  quantity?:number;
  unit?:string;
  locality?:string;
  targetDate?:string;
  urgency?:OpportunityUrgency;
  visibility?:OpportunityVisibility;
  source?:OpportunitySource;
  sourceRef?:string;
  groupId?:Id;
}

export interface OpportunityRecord extends WorkspaceRecord{
  moduleId:'OPPORTUNITY.NEED';
  data:WorkspaceRecord['data']&{
    opportunityDirection:OpportunityDirection;
    opportunityState:OpportunityState;
    humanValidated:boolean;
    commercialCommitment:false;
    realMoney:false;
    version:number;
  };
}

const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const clean=(value:unknown,max=240)=>String(value??'').trim().slice(0,max);
const stateToWorkspace=(state:OpportunityState):WorkspaceRecord['status']=>state==='DRAFT'?'DRAFT':state==='FULFILLED'?'DONE':state==='CANCELLED'?'ARCHIVED':'ACTIVE';
const transitions:Record<OpportunityState,OpportunityState[]>={
  DRAFT:['OPEN','CANCELLED'],
  OPEN:['MATCHING','FULFILLED','CANCELLED'],
  MATCHING:['OPEN','FULFILLED','CANCELLED'],
  FULFILLED:[],
  CANCELLED:[]
};

export class OpportunityService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}

  private async groupAccess(groupId:Id,manage=false){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);
    if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return group;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member)throw Error('FORBIDDEN_SCOPE');
    if(manage&&!member.roles.some(role=>managers.has(role)))throw Error('FORBIDDEN_SCOPE');
    return group;
  }

  private async recordAccess(record:OpportunityRecord,manage=false){
    const ctx=this.kernel.context.get();
    if(!record.groupId){
      if(record.createdBy!==ctx.actorId)throw Error('FORBIDDEN_SCOPE');
      return;
    }
    await this.groupAccess(record.groupId,false);
    if(manage&&record.createdBy!==ctx.actorId)await this.groupAccess(record.groupId,true);
  }

  async create(input:OpportunityInput):Promise<OpportunityRecord>{
    const ctx=this.kernel.context.get(),title=clean(input.title,180);
    if(!title)throw Error('OPPORTUNITY_TITLE_REQUIRED');
    if(input.groupId)await this.groupAccess(input.groupId,false);
    const direction=input.direction??'NEED';
    if(!['NEED','OFFER'].includes(direction))throw Error('INVALID_OPPORTUNITY_DIRECTION');
    if(input.quantity!==undefined&&(!Number.isFinite(input.quantity)||input.quantity<=0))throw Error('INVALID_QUANTITY');
    if(input.targetDate&&Number.isNaN(Date.parse(input.targetDate)))throw Error('INVALID_TARGET_DATE');
    const urgency=input.urgency??'NORMAL';
    if(!['NORMAL','SOON','NOW'].includes(urgency))throw Error('INVALID_URGENCY');
    const visibility=input.visibility??(input.groupId?'GROUP':'PRIVATE');
    if(!['PRIVATE','GROUP','PLATFORM'].includes(visibility))throw Error('INVALID_VISIBILITY');
    if(!input.groupId&&visibility==='GROUP')throw Error('GROUP_VISIBILITY_REQUIRES_GROUP');
    const source=input.source??'DIRECT';
    if(!['DIRECT','BLUEPRINT','FORUM','COMMUNITY'].includes(source))throw Error('INVALID_OPPORTUNITY_SOURCE');
    const sourceRef=clean(input.sourceRef,220);
    if(sourceRef&&['FORUM','COMMUNITY'].includes(source)){
      const existing=(await this.repo.listWorkspaceRecords(ctx.tenantId,'OPPORTUNITY.NEED',input.groupId))
        .find(x=>String(x.data.source??'')===source&&String(x.data.sourceRef??'')===sourceRef) as OpportunityRecord|undefined;
      if(existing){await this.recordAccess(existing,false);return existing;}
    }
    const stamp=now(),record:OpportunityRecord={
      id:makeId('opportunity'),tenantId:ctx.tenantId,groupId:input.groupId,moduleId:'OPPORTUNITY.NEED',
      title,summary:clean(input.summary,1200)||undefined,status:'DRAFT',
      tags:['opportunity-engine','direction:'+direction.toLowerCase(),'source:'+source.toLowerCase()],
      data:{
        opportunityDirection:direction,opportunityState:'DRAFT',category:clean(input.category,120),quantity:input.quantity??null,
        unit:clean(input.unit,80),locality:clean(input.locality,160),targetDate:input.targetDate?new Date(input.targetDate).toISOString():null,
        urgency,visibility,source,sourceRef,humanValidated:false,commercialCommitment:false,realMoney:false,version:1
      },
      createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp
    };
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'OPPORTUNITY_INTENT_CREATED',targetType:'opportunity',targetId:record.id,requestId:ctx.requestId,after:{state:'DRAFT',direction,groupId:input.groupId??null,source}}));
    return record;
  }

  async list(groupId?:Id):Promise<OpportunityRecord[]>{
    const ctx=this.kernel.context.get();
    if(groupId)await this.groupAccess(groupId,false);
    const rows=await this.repo.listWorkspaceRecords(ctx.tenantId,'OPPORTUNITY.NEED',groupId);
    return rows.filter(row=>row.moduleId==='OPPORTUNITY.NEED'&&(groupId?row.groupId===groupId:!row.groupId&&row.createdBy===ctx.actorId)) as OpportunityRecord[];
  }

  async get(id:Id):Promise<OpportunityRecord>{
    const ctx=this.kernel.context.get(),record=await this.repo.getWorkspaceRecord(ctx.tenantId,id) as OpportunityRecord|undefined;
    if(!record||record.moduleId!=='OPPORTUNITY.NEED')throw Error('OPPORTUNITY_NOT_FOUND');
    await this.recordAccess(record,false);return record;
  }

  async transition(id:Id,to:OpportunityState):Promise<OpportunityRecord>{
    if(!['DRAFT','OPEN','MATCHING','FULFILLED','CANCELLED'].includes(to))throw Error('INVALID_OPPORTUNITY_STATE');
    const ctx=this.kernel.context.get(),record=await this.get(id),from=String(record.data.opportunityState??record.status) as OpportunityState;
    await this.recordAccess(record,true);
    if(!transitions[from]?.includes(to))throw Error('INVALID_OPPORTUNITY_TRANSITION');
    const stamp=now(),next:OpportunityRecord={
      ...record,status:stateToWorkspace(to),updatedAt:stamp,
      data:{...record.data,opportunityState:to,humanValidated:to==='OPEN'||to==='MATCHING'||to==='FULFILLED'?true:Boolean(record.data.humanValidated),commercialCommitment:false,realMoney:false,version:Number(record.data.version??1)+1}
    };
    await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'OPPORTUNITY_INTENT_TRANSITIONED',targetType:'opportunity',targetId:id,requestId:ctx.requestId,before:{state:from},after:{state:to},metadata:{commercialCommitment:false,realMoney:false}}));
    return next;
  }
}
