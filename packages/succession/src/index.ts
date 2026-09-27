import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

type SuccessionState='RECORDED'|'CONFIRMED'|'REVOKED'|'ARCHIVED';
const managers=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const now=()=>new Date().toISOString();
const text=(v:unknown,n=2000)=>String(v??'').trim().slice(0,n);

export class NextOfKinService{
 constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
 private ctx(){return this.kernel.context.get();}
 private async actor(groupId:Id){
   const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
   const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
   const manager=g.createdBy===c.actorId||Boolean(m?.roles.some(r=>managers.has(r)));if(!manager&&!m)throw Error('FORBIDDEN_SCOPE');return{group:g,membership:m,manager};
 }
 private async subject(groupId:Id,membershipId:Id){
   const c=this.ctx(),m=await this.repo.getMembership(c.tenantId,groupId,membershipId);if(!m||m.status==='removed')throw Error('MEMBERSHIP_NOT_FOUND');return m;
 }
 private async record(groupId:Id,id:Id){
   const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!=='SUCCESSION.NEXT_OF_KIN')throw Error('NEXT_OF_KIN_NOT_FOUND');return r;
 }
 private async assertVisible(groupId:Id,r:WorkspaceRecord){
   const {manager}=await this.actor(groupId);if(manager)return;
   const c=this.ctx(),m=await this.subject(groupId,String(r.data.membershipId??''));if(m.userId!==c.actorId)throw Error('FORBIDDEN_SCOPE');
 }
 async list(groupId:Id,membershipId?:Id){
   const {manager,membership}=await this.actor(groupId),c=this.ctx(),rows=(await this.repo.listWorkspaceRecords(c.tenantId,'SUCCESSION.NEXT_OF_KIN',groupId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
   if(manager)return membershipId?rows.filter(x=>x.data.membershipId===membershipId):rows;
   return rows.filter(x=>x.data.membershipId===membership?.id);
 }
 async create(groupId:Id,input:{membershipId:Id;contactAlias:string;relationship:string;contactRef:string;consentRef:string;notes?:string}){
   const actor=await this.actor(groupId),c=this.ctx(),subject=await this.subject(groupId,input.membershipId);if(!actor.manager&&subject.userId!==c.actorId)throw Error('FORBIDDEN_SCOPE');
   const alias=text(input.contactAlias,240),relationship=text(input.relationship,240),contactRef=text(input.contactRef,1000),consentRef=text(input.consentRef,1200),notes=text(input.notes,3000);if(!alias||!relationship||!contactRef||!consentRef)throw Error('NEXT_OF_KIN_REQUIRED_FIELDS');
   const stamp=now(),r:WorkspaceRecord={id:makeId('next_of_kin'),tenantId:c.tenantId,groupId,moduleId:'SUCCESSION.NEXT_OF_KIN',title:'Contact succession · '+alias,summary:'Contact déclaré pour le dossier membre',status:'ACTIVE',tags:['next-of-kin','private','state:RECORDED'],data:{membershipId:subject.id,contactAlias:alias,relationship,contactRef,consentRef,notes,successionState:'RECORDED',declaredBy:c.actorId,declaredAt:stamp,confirmedAt:'',confirmedBy:'',revokedAt:'',revokedBy:'',grantsMembership:false,grantsFinancialRights:false,grantsSigningAuthority:false,legalHeirDetermination:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
   await this.repo.saveWorkspaceRecord(r);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'NEXT_OF_KIN_RECORDED',targetType:'membership',targetId:subject.id,requestId:c.requestId,metadata:{groupId,recordId:r.id,relationship}}));return r;
 }
 async confirm(groupId:Id,id:Id){
   const r=await this.record(groupId,id);await this.assertVisible(groupId,r);const c=this.ctx(),subject=await this.subject(groupId,String(r.data.membershipId??'')),actor=await this.actor(groupId);
   if(!actor.manager&&subject.userId!==c.actorId)throw Error('FORBIDDEN_SCOPE');if(String(r.data.successionState)==='REVOKED')throw Error('NEXT_OF_KIN_REVOKED');
   const next:WorkspaceRecord={...r,tags:['next-of-kin','private','state:CONFIRMED'],data:{...r.data,successionState:'CONFIRMED' as SuccessionState,confirmedAt:now(),confirmedBy:c.actorId,grantsMembership:false,grantsFinancialRights:false,grantsSigningAuthority:false,legalHeirDetermination:false},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
 }
 async revoke(groupId:Id,id:Id,reason:string){
   const r=await this.record(groupId,id);await this.assertVisible(groupId,r);const c=this.ctx(),why=text(reason,2000);if(!why)throw Error('REVOCATION_REASON_REQUIRED');
   const next:WorkspaceRecord={...r,status:'ARCHIVED',tags:['next-of-kin','private','state:REVOKED'],data:{...r.data,successionState:'REVOKED' as SuccessionState,revokedAt:now(),revokedBy:c.actorId,revocationReason:why,grantsMembership:false,grantsFinancialRights:false,grantsSigningAuthority:false,legalHeirDetermination:false},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
   await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'NEXT_OF_KIN_REVOKED',targetType:'workspace_record',targetId:id,requestId:c.requestId,metadata:{groupId,reason:why}}));return next;
 }
}
