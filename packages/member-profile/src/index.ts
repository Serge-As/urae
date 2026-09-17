import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

export interface MemberProfileData{
  legalName?:string;displayAlias?:string;domicile?:string;quarter?:string;profession?:string;joinedYear?:number;
  fatherName?:string;motherName?:string;spouseName?:string;children?:string[];siblings?:string[];
  sponsorName?:string;emergencyContactName?:string;emergencyContactRelation?:string;officeTitle?:string;
  notes?:string;preferredLocale?:string;profileVersion:number;
}
export interface MemberProfileRecord extends MemberProfileData{id:Id;groupId:Id;membershipId:Id;updatedAt:string;updatedBy:Id;}
const MODULE='MEMBER.PROFILE';
const MANAGERS=new Set(['founder','manager','admin','president','treasurer']);
const clean=(value:unknown,max=180)=>{const v=String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');return v?v.slice(0,max):undefined;};
const lines=(value:unknown)=>Array.isArray(value)?value.map(x=>clean(x,120)).filter(Boolean).slice(0,30) as string[]:String(value??'').split(/[;\n]/).map(x=>clean(x,120)).filter(Boolean).slice(0,30) as string[];
const parse=(record:WorkspaceRecord):MemberProfileRecord=>({id:record.id,groupId:String(record.groupId??''),membershipId:String(record.data.membershipId??''),legalName:record.data.legalName?String(record.data.legalName):undefined,displayAlias:record.data.displayAlias?String(record.data.displayAlias):undefined,domicile:record.data.domicile?String(record.data.domicile):undefined,quarter:record.data.quarter?String(record.data.quarter):undefined,profession:record.data.profession?String(record.data.profession):undefined,joinedYear:record.data.joinedYear?Number(record.data.joinedYear):undefined,fatherName:record.data.fatherName?String(record.data.fatherName):undefined,motherName:record.data.motherName?String(record.data.motherName):undefined,spouseName:record.data.spouseName?String(record.data.spouseName):undefined,children:Array.isArray(record.data.children)?record.data.children.map(String):[],siblings:Array.isArray(record.data.siblings)?record.data.siblings.map(String):[],sponsorName:record.data.sponsorName?String(record.data.sponsorName):undefined,emergencyContactName:record.data.emergencyContactName?String(record.data.emergencyContactName):undefined,emergencyContactRelation:record.data.emergencyContactRelation?String(record.data.emergencyContactRelation):undefined,officeTitle:record.data.officeTitle?String(record.data.officeTitle):undefined,notes:record.summary,preferredLocale:record.data.preferredLocale?String(record.data.preferredLocale):undefined,profileVersion:Number(record.data.profileVersion??1),updatedAt:record.updatedAt,updatedBy:String(record.data.updatedBy??record.createdBy)});

export class MemberProfileService{
  constructor(private repo:PlatformRepository,private kernel:PlatformKernel){}
  private async access(groupId:Id,membershipId:Id,manage=false):Promise<Membership>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');const target=await this.repo.getMembership(ctx.tenantId,groupId,membershipId);if(!target)throw Error('MEMBERSHIP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return target;const viewer=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');if(!viewer)throw Error('FORBIDDEN_SCOPE');
    const self=target.userId===ctx.actorId;if(manage&&!viewer.roles.some(r=>MANAGERS.has(r))&&!self)throw Error('FORBIDDEN_SCOPE');if(!manage&&!self&&!viewer.roles.some(r=>MANAGERS.has(r)))throw Error('FORBIDDEN_SCOPE');return target;
  }
  async get(groupId:Id,membershipId:Id):Promise<MemberProfileRecord|undefined>{await this.access(groupId,membershipId);const ctx=this.kernel.context.get(),record=await this.repo.getWorkspaceRecord(ctx.tenantId,`member_profile_${membershipId}`);return record&&record.groupId===groupId&&record.moduleId===MODULE?parse(record):undefined;}
  async save(groupId:Id,membershipId:Id,input:Partial<MemberProfileData>&{expectedVersion?:number}):Promise<MemberProfileRecord>{
    await this.access(groupId,membershipId,true);const ctx=this.kernel.context.get(),id=`member_profile_${membershipId}`,existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id),current=existing?parse(existing):undefined;
    if(input.expectedVersion!==undefined&&Number(input.expectedVersion)!==Number(current?.profileVersion??0))throw Error('MEMBER_PROFILE_VERSION_CONFLICT');
    const year=input.joinedYear===undefined?current?.joinedYear:Number(input.joinedYear);if(year!==undefined&&(!Number.isInteger(year)||year<1900||year>new Date().getFullYear()+1))throw Error('INVALID_JOINED_YEAR');
    const stamp=new Date().toISOString(),version=Number(current?.profileVersion??0)+1,data:MemberProfileData={legalName:clean(input.legalName??current?.legalName),displayAlias:clean(input.displayAlias??current?.displayAlias),domicile:clean(input.domicile??current?.domicile),quarter:clean(input.quarter??current?.quarter),profession:clean(input.profession??current?.profession),joinedYear:year,fatherName:clean(input.fatherName??current?.fatherName),motherName:clean(input.motherName??current?.motherName),spouseName:clean(input.spouseName??current?.spouseName),children:input.children===undefined?(current?.children??[]):lines(input.children),siblings:input.siblings===undefined?(current?.siblings??[]):lines(input.siblings),sponsorName:clean(input.sponsorName??current?.sponsorName),emergencyContactName:clean(input.emergencyContactName??current?.emergencyContactName),emergencyContactRelation:clean(input.emergencyContactRelation??current?.emergencyContactRelation),officeTitle:clean(input.officeTitle??current?.officeTitle),notes:clean(input.notes??current?.notes,1000),preferredLocale:clean(input.preferredLocale??current?.preferredLocale,32),profileVersion:version};
    const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:MODULE,title:data.legalName??data.displayAlias??`Profil ${membershipId}`,summary:data.notes,status:'ACTIVE',tags:['member-profile','private','membership:'+membershipId],data:{...data,membershipId,updatedBy:ctx.actorId},createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(record);return parse(record);
  }
}
