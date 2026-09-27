import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const MODULE_ID='RUBRIC.STARTER_KITS';
const managerRoles=new Set(['founder','manager','admin','president','treasurer','secretary']);
const now=()=>new Date().toISOString();
const text=(v:unknown,max:number)=>String(v??'').trim().slice(0,max);
const safeJson=(v:unknown,max:number)=>{const raw=typeof v==='string'?v:JSON.stringify(v??null);if(raw.length>max)throw Error('STARTER_KIT_PAYLOAD_TOO_LARGE');JSON.parse(raw);return raw;};
const safeNonNegative=(v:unknown,name:string)=>{const n=Number(v??0);if(!Number.isFinite(n)||n<0)throw Error('INVALID_STARTER_KIT_'+name);return n;};

export interface StarterKitInput{
  kitVersion?:string;generatedAt?:string;family:string;governance:string;members:number;sessions:number;
  monetaryVolume?:number;managerFees?:number;estimatedExternal?:number;fixedCosts?:number;estimatedMargin?:number;
  rubricRowsJson:string;checklistJson:string;calendarJson:string;risksJson:string;rulesJson:string;
  recommendedModel?:string;indicativeAmount?:number;feeExampleJson:string;orderPolicy?:string;latePolicyJson:string;
  simulationJson:string;adviceJson:string;invitation?:string;minutes?:string;profileJson:string;
}
export interface StarterKitRecord extends WorkspaceRecord{moduleId:typeof MODULE_ID;}

export class StarterKitService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private async access(groupId:Id,manage=false){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return group;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
    if(!member)throw Error('FORBIDDEN_SCOPE');
    if(manage&&!member.roles.some(r=>managerRoles.has(r)))throw Error('FORBIDDEN_SCOPE');
    return group;
  }
  private normalize(input:StarterKitInput){
    const generatedAt=input.generatedAt?new Date(input.generatedAt).toISOString():now();if(!Number.isFinite(Date.parse(generatedAt)))throw Error('INVALID_STARTER_KIT_DATE');
    const members=Math.trunc(safeNonNegative(input.members,'MEMBERS')),sessions=Math.trunc(safeNonNegative(input.sessions,'SESSIONS'));
    if(members>100000||sessions>10000)throw Error('STARTER_KIT_DIMENSION_OUT_OF_RANGE');
    return{
      kitVersion:text(input.kitVersion||'1.5.2.7',40),generatedAt,family:text(input.family,80),governance:text(input.governance,120),members,sessions,
      monetaryVolume:safeNonNegative(input.monetaryVolume,'VOLUME'),managerFees:safeNonNegative(input.managerFees,'FEES'),
      estimatedExternal:safeNonNegative(input.estimatedExternal,'EXTERNAL'),fixedCosts:safeNonNegative(input.fixedCosts,'FIXED_COSTS'),
      estimatedMargin:Number(input.estimatedMargin??0),rubricRowsJson:safeJson(input.rubricRowsJson,120000),
      checklistJson:safeJson(input.checklistJson,50000),calendarJson:safeJson(input.calendarJson,70000),risksJson:safeJson(input.risksJson,50000),
      rulesJson:safeJson(input.rulesJson,80000),recommendedModel:text(input.recommendedModel,5000),indicativeAmount:safeNonNegative(input.indicativeAmount,'INDICATIVE_AMOUNT'),
      feeExampleJson:safeJson(input.feeExampleJson,30000),orderPolicy:text(input.orderPolicy,5000),latePolicyJson:safeJson(input.latePolicyJson,30000),
      simulationJson:safeJson(input.simulationJson,50000),adviceJson:safeJson(input.adviceJson,50000),invitation:text(input.invitation,12000),
      minutes:text(input.minutes,20000),profileJson:safeJson(input.profileJson,80000)
    };
  }
  async current(groupId:Id):Promise<StarterKitRecord|undefined>{
    await this.access(groupId,false);const ctx=this.kernel.context.get();
    const rows=(await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE_ID,groupId)).filter(x=>x.status!=='ARCHIVED').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    return rows[0] as StarterKitRecord|undefined;
  }
  async save(groupId:Id,input:StarterKitInput):Promise<StarterKitRecord>{
    const group=await this.access(groupId,true),ctx=this.kernel.context.get(),data=this.normalize(input),existing=await this.current(groupId),stamp=now();
    const record:StarterKitRecord={id:existing?.id??('starter_kit_'+groupId),tenantId:ctx.tenantId,groupId,moduleId:MODULE_ID,
      title:'Kit prêt à l’emploi · '+group.name,summary:'Pack opérationnel de démarrage : règles, checklist, calendrier, simulation, invitation, PV, trésorerie, risques et Paper Bridge.',
      status:'ACTIVE',tags:['starter-kit','canonical-owner','paper-bridge','launch'],data,createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:existing?'STARTER_KIT_UPDATED':'STARTER_KIT_CREATED',targetType:'starter_kit',targetId:record.id,requestId:ctx.requestId,after:{groupId,kitVersion:data.kitVersion,members:data.members,sessions:data.sessions}}));
    return structuredClone(record);
  }
}
