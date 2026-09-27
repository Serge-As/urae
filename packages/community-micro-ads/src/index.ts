import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {ValueNetworkService} from '../../value-network/src/index.js';

export type MicroAdType='SEEK'|'OFFER';
export type MicroAdState='DRAFT'|'PUBLISHED'|'CLOSED'|'EXPIRED'|'REPORTED';
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=1000)=>String(v??'').trim().slice(0,n);
const durations=new Set([7,14,30]);
export class CommunityMicroAdService{
 constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public valueNetwork:ValueNetworkService){}
 private ctx(){return this.kernel.context.get();}
 private async member(groupId:Id){
   const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
   if(g.createdBy===c.actorId)return g;
   const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');if(!m)throw Error('FORBIDDEN_SCOPE');return g;
 }
 private async manager(groupId:Id){
   const c=this.ctx(),g=await this.member(groupId);if(g.createdBy===c.actorId)return true;
   const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
   return Boolean(m?.roles.some(role=>['founder','manager','admin','president','treasurer','secretary'].includes(role)));
 }
 private async get(groupId:Id,id:Id){
   const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!=='COMMUNITY.MICRO_ADS')throw Error('MICRO_AD_NOT_FOUND');return r;
 }
 private async canMutate(r:WorkspaceRecord){
   const c=this.ctx();if(r.createdBy===c.actorId)return;const g=await this.repo.getGroup(c.tenantId,String(r.groupId));if(g?.createdBy===c.actorId)return;
   const m=(await this.repo.listMemberships(c.tenantId,String(r.groupId))).find(x=>x.userId===c.actorId&&x.status==='active');if(!m||!m.roles.some(role=>['founder','manager','admin','president','secretary'].includes(role)))throw Error('FORBIDDEN_SCOPE');
 }
 async create(groupId:Id,input:{type:MicroAdType;category:string;text:string;locality:string;contactMode?:'CHAT'|'CONSENTED_REF';contactRef?:string;durationDays?:7|14|30;customExpiresAt?:string}){
   await this.member(groupId);const c=this.ctx();if(!['SEEK','OFFER'].includes(input.type))throw Error('INVALID_MICRO_AD_TYPE');
   const category=clean(input.category,120),body=clean(input.text,700),locality=clean(input.locality,180);if(!category||!body||!locality)throw Error('MICRO_AD_REQUIRED_FIELDS');
   const contactMode=input.contactMode??'CHAT',contactRef=clean(input.contactRef,500);if(contactMode==='CONSENTED_REF'&&!contactRef)throw Error('CONTACT_REF_REQUIRED');
   let expiresAt:string;const days=input.durationDays??7;if(input.customExpiresAt){expiresAt=new Date(input.customExpiresAt).toISOString();if(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.now())throw Error('INVALID_EXPIRES_AT');}else{if(!durations.has(days))throw Error('INVALID_MICRO_AD_DURATION');expiresAt=new Date(Date.now()+days*86400000).toISOString();}
   const at=now(),r:WorkspaceRecord={id:makeId('micro_ad'),tenantId:c.tenantId,groupId,moduleId:'COMMUNITY.MICRO_ADS',title:(input.type==='SEEK'?'Je cherche · ':'Je propose · ')+category,summary:body,status:'DRAFT',tags:['micro-ad','type:'+input.type,'state:DRAFT'],data:{microAdType:input.type,microAdState:'DRAFT',category,text:body,locality,contactMode,contactRef,expiresAt,marketplaceKind:'',marketplaceRef:'',reportCount:0,lowData:true},createdBy:c.actorId,createdAt:at,updatedAt:at};
   await this.repo.saveWorkspaceRecord(r);return r;
 }
 async publish(groupId:Id,id:Id){await this.member(groupId);const c=this.ctx(),r=await this.get(groupId,id);await this.canMutate(r);if(String(r.data.microAdState)!=='DRAFT')throw Error('MICRO_AD_NOT_DRAFT');if(Date.parse(String(r.data.expiresAt))<=Date.now())throw Error('MICRO_AD_EXPIRED');const next={...r,status:'ACTIVE' as const,tags:['micro-ad','type:'+String(r.data.microAdType),'state:PUBLISHED'],data:{...r.data,microAdState:'PUBLISHED',publishedAt:now()},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;}
 async close(groupId:Id,id:Id){await this.member(groupId);const r=await this.get(groupId,id);await this.canMutate(r);const next={...r,status:'DONE' as const,tags:['micro-ad','type:'+String(r.data.microAdType),'state:CLOSED'],data:{...r.data,microAdState:'CLOSED',closedAt:now()},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;}
 async report(groupId:Id,id:Id,reason:string){await this.member(groupId);const c=this.ctx(),r=await this.get(groupId,id),why=clean(reason,1200);if(!why)throw Error('REPORT_REASON_REQUIRED');const report:WorkspaceRecord={id:makeId('micro_ad_report'),tenantId:c.tenantId,groupId,moduleId:'COMMUNITY.MICRO_ADS',title:'Signalement micro-annonce',summary:why,status:'ACTIVE',tags:['micro-ad-report'],data:{microAdId:id,reason:why,reportedBy:c.actorId,state:'OPEN'},createdBy:c.actorId,createdAt:now(),updatedAt:now()};await this.repo.saveWorkspaceRecord(report);const next={...r,data:{...r.data,reportCount:Number(r.data.reportCount??0)+1},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return report;}
 async promote(groupId:Id,id:Id,input:{quantity:number;unit:string;unitPrice?:number;currency?:string;neededBy?:string;expiresAt?:string;evidenceRef?:string}){
   await this.member(groupId);const r=await this.get(groupId,id);await this.canMutate(r);if(!['DRAFT','PUBLISHED'].includes(String(r.data.microAdState)))throw Error('MICRO_AD_NOT_OPEN');
   if(r.data.marketplaceRef)return r;
   const type=String(r.data.microAdType) as MicroAdType,category=String(r.data.category),locality=String(r.data.locality),title=r.title,textBody=String(r.data.text??r.summary??'');
   let target;
   if(type==='SEEK'){
     if(!await this.manager(groupId))throw Error('MICRO_AD_GROUP_NEED_REQUIRES_MANAGER');
     target=await this.valueNetwork.createNeed({groupId,title,category,quantity:input.quantity,unit:input.unit,locality,neededBy:input.neededBy,sourceType:'COMMUNITY_MESSAGE',sourceRef:r.id,note:textBody,publicationConsent:false,currency:input.currency??'XAF'});
   }else{
     target=await this.valueNetwork.createOffer({kind:'SERVICE',title,category,availableQuantity:input.quantity,unit:input.unit,locality,unitPrice:input.unitPrice,currency:input.currency??'XAF',expiresAt:input.expiresAt??String(r.data.expiresAt),evidenceRef:input.evidenceRef,serviceZones:[locality]});
   }
   const next={...r,data:{...r.data,marketplaceKind:type==='SEEK'?'NEED':'OFFER',marketplaceRef:target.id,marketplaceLinkedAt:now()},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
 }
 async list(groupId:Id,input:{locality?:string;type?:MicroAdType;includeClosed?:boolean}={}){
   const g=await this.member(groupId);const c=this.ctx(),membership=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active'),manager=g.createdBy===c.actorId||Boolean(membership?.roles.some(role=>['founder','manager','admin','president','secretary'].includes(role))),at=Date.now(),rows=(await this.repo.listWorkspaceRecords(c.tenantId,'COMMUNITY.MICRO_ADS',groupId)).filter(x=>!x.tags.includes('micro-ad-report'));
   const out=[];for(const r of rows){let state=String(r.data.microAdState??'DRAFT');if(state==='PUBLISHED'&&Date.parse(String(r.data.expiresAt))<=at){state='EXPIRED';const next={...r,status:'DONE' as const,tags:['micro-ad','type:'+String(r.data.microAdType),'state:EXPIRED'],data:{...r.data,microAdState:'EXPIRED',expiredAt:now()},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);r.data=next.data;r.status=next.status;r.tags=next.tags;}
     if(state==='DRAFT'&&r.createdBy!==c.actorId&&!manager)continue;if(!input.includeClosed&&!['DRAFT','PUBLISHED'].includes(state))continue;if(input.type&&r.data.microAdType!==input.type)continue;if(input.locality&&String(r.data.locality).toLowerCase()!==input.locality.toLowerCase())continue;out.push(r);}
   return out.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 }
}
