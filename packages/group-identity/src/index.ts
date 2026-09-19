import type {Group, Id, RubricDefinition, WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

export interface GroupOperationalIdentityProfile {
  declarationDate?:string;
  declarationNumber?:string;
  officeMandateStart?:string;
  officeMandateEnd?:string;
  note?:string;
  updatedAt?:string;
  updatedBy?:Id;
}

export interface GroupIdentityPassport {
  groupId:Id;
  tenantId:Id;
  publicCode:string;
  schemaVersion:1;
  identityFingerprint:string;
  rulesFingerprint:string;
  family:Group['kind'];
  governanceModel:Group['governanceModel'];
  createdAt:string;
  historicalCreatedAt?:string;
  currentExerciseLabel?:string;
  rubricCount:number;
  rubricKinds:string[];
  generatedAt:string;
  securityNote:'IDENTIFIER_NOT_SECRET';
}

const MODULE='IDENTITY.GROUP_PASSPORT';
const PROFILE_MODULE='IDENTITY.GROUP_PROFILE';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const encode=(bytes:Uint8Array)=>{
  const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let value=0,bits=0,out='';
  for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){bits-=5;out+=alphabet[(value>>>bits)&31];}}
  if(bits>0)out+=alphabet[(value<<(5-bits))&31];
  return out;
};
const sha=async(input:string)=>{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));
  return new Uint8Array(digest);
};
const stable=(value:unknown):string=>{
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  const record=value as Record<string,unknown>;
  return '{'+Object.keys(record).sort().map(k=>JSON.stringify(k)+':'+stable(record[k])).join(',')+'}';
};
const shortHex=async(input:string)=>{
  const bytes=await sha(input);return [...bytes].slice(0,12).map(x=>x.toString(16).padStart(2,'0')).join('');
};
const codeFor=async(group:Group)=>{
  const bytes=await sha(stable({v:1,tenantId:group.tenantId,groupId:group.id,createdAt:group.createdAt}));
  const body=encode(bytes.slice(0,7)).slice(0,10);
  const check=encode(bytes.slice(7,9)).slice(0,2);
  return `ECO-GRP-${body.slice(0,5)}-${body.slice(5)}-${check}`;
};
const passportId=(groupId:string)=>'group_passport_'+encodeURIComponent(groupId);
const profileId=(groupId:string)=>'group_profile_'+encodeURIComponent(groupId);

export class GroupIdentityService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}

  private async access(groupId:Id,manage=false){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);
    if(!group)throw new Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return group;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member||manage&&!member.roles.some(r=>managers.has(r)))throw new Error('FORBIDDEN_SCOPE');
    return group;
  }

  async compute(groupId:Id):Promise<GroupIdentityPassport>{
    const ctx=this.kernel.context.get(),group=await this.access(groupId,false);
    const rubrics=(await this.repo.listRubricDefinitions(ctx.tenantId,groupId)).slice().sort((a,b)=>a.id.localeCompare(b.id));
    const publicCode=await codeFor(group);
    const identityFingerprint=await shortHex(stable({v:1,tenantId:group.tenantId,groupId:group.id,createdAt:group.createdAt,originMode:group.originMode,historicalCreatedAt:group.historicalCreatedAt}));
    const rulesProjection=rubrics.map((r:RubricDefinition)=>({id:r.id,version:r.version,name:r.name,facets:r.facets,operatingModel:r.operatingModel,activityPlan:r.activityPlan,status:r.status}));
    const rulesFingerprint=await shortHex(stable({v:1,groupKind:group.kind,governanceModel:group.governanceModel,operatingPolicy:group.operatingPolicy,rubrics:rulesProjection,currentExerciseLabel:group.currentExerciseLabel}));
    return{groupId:group.id,tenantId:group.tenantId,publicCode,schemaVersion:1,identityFingerprint,rulesFingerprint,family:group.kind,governanceModel:group.governanceModel,createdAt:group.createdAt,historicalCreatedAt:group.historicalCreatedAt,currentExerciseLabel:group.currentExerciseLabel,rubricCount:rubrics.length,rubricKinds:[...new Set(rubrics.map(r=>r.activityPlan?.kind).filter(Boolean).map(String))].sort(),generatedAt:new Date().toISOString(),securityNote:'IDENTIFIER_NOT_SECRET'};
  }

  async issue(groupId:Id):Promise<GroupIdentityPassport>{
    const ctx=this.kernel.context.get();await this.access(groupId,true);
    const passport=await this.compute(groupId),id=passportId(groupId),existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    const stamp=new Date().toISOString();
    const record:WorkspaceRecord={
      id,tenantId:ctx.tenantId,groupId,moduleId:MODULE,title:'Passeport identitaire du groupe',
      summary:'Identifiant stable et empreinte versionnée des règles. Ce code identifie le groupe mais ne donne aucun accès.',
      status:'ACTIVE',tags:['group-identity','non-secret','schema:1'],
      data:{publicCode:passport.publicCode,identityFingerprint:passport.identityFingerprint,rulesFingerprint:passport.rulesFingerprint,schemaVersion:1,rubricCount:passport.rubricCount,rubricKindsJson:JSON.stringify(passport.rubricKinds),generatedAt:passport.generatedAt},
      createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp
    };
    await this.repo.saveWorkspaceRecord(record);
    const audit=this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:existing?'GROUP_IDENTITY_PASSPORT_REFRESHED':'GROUP_IDENTITY_PASSPORT_ISSUED',targetType:'group_identity_passport',targetId:id,requestId:ctx.requestId,metadata:{groupId,publicCode:passport.publicCode,rulesFingerprint:passport.rulesFingerprint}});
    await this.repo.saveAudit(audit);return passport;
  }

  async verify(groupId:Id,publicCode:string,rulesFingerprint?:string){
    const passport=await this.compute(groupId);
    return{identityMatches:passport.publicCode===publicCode,rulesMatch:rulesFingerprint===undefined?undefined:passport.rulesFingerprint===rulesFingerprint,current:passport};
  }

  async profile(groupId:Id):Promise<GroupOperationalIdentityProfile>{
    const ctx=this.kernel.context.get();await this.access(groupId,false);
    const row=await this.repo.getWorkspaceRecord(ctx.tenantId,profileId(groupId));
    if(!row||row.moduleId!==PROFILE_MODULE)return{};
    const text=(key:string)=>row.data[key]===null||row.data[key]===undefined?undefined:String(row.data[key]);
    return{declarationDate:text('declarationDate'),declarationNumber:text('declarationNumber'),officeMandateStart:text('officeMandateStart'),officeMandateEnd:text('officeMandateEnd'),note:text('note'),updatedAt:row.updatedAt,updatedBy:text('updatedBy')};
  }

  async updateProfile(groupId:Id,input:GroupOperationalIdentityProfile):Promise<GroupOperationalIdentityProfile>{
    const ctx=this.kernel.context.get();await this.access(groupId,true);
    const clean=(value:unknown,max:number)=>{const v=String(value??'').trim();if(v.length>max)throw Error('GROUP_PROFILE_FIELD_TOO_LONG');return v||undefined;};
    const date=(value:unknown)=>{const v=clean(value,40);if(!v)return undefined;if(!Number.isFinite(Date.parse(v)))throw Error('INVALID_GROUP_PROFILE_DATE');return new Date(v).toISOString();};
    const declarationDate=date(input.declarationDate),officeMandateStart=date(input.officeMandateStart),officeMandateEnd=date(input.officeMandateEnd);
    if(officeMandateStart&&officeMandateEnd&&Date.parse(officeMandateEnd)<Date.parse(officeMandateStart))throw Error('INVALID_OFFICE_MANDATE_RANGE');
    const declarationNumber=clean(input.declarationNumber,120),note=clean(input.note,1000),id=profileId(groupId),previous=await this.repo.getWorkspaceRecord(ctx.tenantId,id),stamp=new Date().toISOString();
    const data={declarationDate:declarationDate??null,declarationNumber:declarationNumber??null,officeMandateStart:officeMandateStart??null,officeMandateEnd:officeMandateEnd??null,note:note??null,updatedBy:ctx.actorId};
    const row:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:PROFILE_MODULE,title:'Profil identitaire et administratif du groupe',summary:'Déclaration et période de mandat du Bureau. Aucune valeur n’est inventée.',status:'ACTIVE',tags:['group-identity','administrative-profile'],data,createdBy:previous?.createdBy??ctx.actorId,createdAt:previous?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(row);
    const audit=this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:previous?'GROUP_IDENTITY_PROFILE_UPDATED':'GROUP_IDENTITY_PROFILE_CREATED',targetType:'group_identity_profile',targetId:id,requestId:ctx.requestId,before:previous?.data,after:data});
    await this.repo.saveAudit(audit);
    return{declarationDate,declarationNumber,officeMandateStart,officeMandateEnd,note,updatedAt:stamp,updatedBy:ctx.actorId};
  }
}
