import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const MODULE='TRUST.VERIFICATION';
const kinds=['IDENTITY_DOCUMENT_SEEN','REGISTRATION_DOCUMENT_SEEN','SKILL_DEMONSTRATED','STOCK_DECLARED','DELIVERY_CONFIRMED','MEMBERSHIP_CONFIRMED'] as const;
export type AssertionKind=typeof kinds[number];
const managers=new Set(['founder','manager','admin','president','treasurer']);
const text=(v:unknown,max:number)=>String(v??'').trim().slice(0,max);
const digest=async(v:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const encode=(v:unknown)=>btoa(JSON.stringify(v)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=(v:string)=>JSON.parse(atob(v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4)));
export interface AssertionInput {membershipId:Id;kind:AssertionKind;statement:string;scope:string;evidenceRef?:string;expiresAt:string;idempotencyKey:string;replacesAssertionId?:Id;}

/** Fact verification owns assertions, never identity matching, reputation or permissions. */
export class TrustVerificationService{
 constructor(public repo:PlatformRepository,public kernel:PlatformKernel,private clock=()=>Date.now()){}
 private ctx(){return this.kernel.context.get();}
 private stamp(){return new Date(this.clock()).toISOString();}
 private async access(groupId:Id){
  const c=this.ctx(),group=await this.repo.getGroup(c.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
  const members=await this.repo.listMemberships(c.tenantId,groupId),actor=members.find(m=>m.userId===c.actorId&&m.status==='active');
  const manager=group.createdBy===c.actorId||Boolean(actor?.roles.some(r=>managers.has(r)));
  if(!manager&&!actor)throw Error('FORBIDDEN_SCOPE');return{group,members,actor,manager};
 }
 private async visible(groupId:Id,id:Id){
  const access=await this.access(groupId),r=await this.repo.getWorkspaceRecord(this.ctx().tenantId,id);
  if(!r||r.moduleId!==MODULE||r.groupId!==groupId||!r.tags.includes('verification-fact')||r.data.kind!=='ASSERTION')throw Error('ASSERTION_NOT_FOUND');
  if(!access.manager&&r.data.subjectUserId!==this.ctx().actorId)throw Error('FORBIDDEN_SCOPE');return{r,...access};
 }
 private async append(groupId:Id,kind:string,key:string,values:WorkspaceRecord['data']){
  if(!/^[a-zA-Z0-9_.:-]{8,160}$/.test(key))throw Error('GOVERNED_REQUEST_KEY_REQUIRED');
  const c=this.ctx(),payload={kind,...values},fingerprint=await digest(JSON.stringify(payload)),id='tv_'+await digest(JSON.stringify([c.tenantId,c.actorId,groupId,kind,key]));
  const at=this.stamp(),r:WorkspaceRecord={id,tenantId:c.tenantId,groupId,moduleId:MODULE,title:'Assertion · '+kind,status:'DONE',tags:['verification-fact','immutable'],data:{...payload,fingerprint},createdBy:c.actorId,createdAt:at,updatedAt:at};
  const result=await this.repo.insertGovernedRecord(r);if(result.record.data.fingerprint!==fingerprint)throw Error('GOVERNED_RECORD_CONFLICT');
  if(result.inserted)await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'TRUST_'+kind,targetType:'verification',targetId:id,requestId:c.requestId}));return result.record;
 }
 private state(r:WorkspaceRecord,rows:WorkspaceRecord[]){
  const events=rows.filter(x=>x.data.assertionId===r.id);
  if(events.some(x=>x.data.kind==='REVOKE'||x.data.kind==='REPLACE'))return'REVOKED';
  if(events.some(x=>x.data.kind==='SUSPEND'))return'SUSPENDED';
  if(events.some(x=>x.data.kind==='CONTEST'))return'CONTESTED';
  if(Date.parse(String(r.data.expiresAt))<=this.clock())return'EXPIRED';return'ACTIVE';
 }
 async issue(groupId:Id,input:AssertionInput){
  const access=await this.access(groupId),subject=access.members.find(m=>m.id===input.membershipId&&m.status==='active'),c=this.ctx();
  if(!subject)throw Error('MEMBERSHIP_NOT_FOUND');if(!kinds.includes(input.kind))throw Error('INVALID_ASSERTION_KIND');
  const declared=input.kind==='STOCK_DECLARED';if(!access.manager&&(!declared||subject.userId!==c.actorId))throw Error('FORBIDDEN_SCOPE');
  const statement=text(input.statement,600),scope=text(input.scope,240),evidenceRef=text(input.evidenceRef,240),expiry=Date.parse(input.expiresAt);
  if(!statement||!scope||!declared&&!evidenceRef)throw Error('ASSERTION_FIELDS_REQUIRED');
  if(!Number.isFinite(expiry)||expiry<=this.clock()||expiry>this.clock()+366*86400000)throw Error('INVALID_ASSERTION_EXPIRY');
  if(input.replacesAssertionId){const old=await this.visible(groupId,input.replacesAssertionId);if(old.r.data.subjectUserId!==subject.userId||!access.manager&&old.r.createdBy!==c.actorId)throw Error('FORBIDDEN_SCOPE');}
  const record=await this.append(groupId,'ASSERTION',input.idempotencyKey,{membershipId:subject.id,subjectUserId:subject.userId,assertionKind:input.kind,statement,scope,evidenceRef,expiresAt:new Date(expiry).toISOString(),assurance:declared?'DECLARED':'DOCUMENTED_REVIEW',issuerType:declared?'DECLARANT':'GROUP_MANAGER',replacesAssertionId:input.replacesAssertionId??null});
  if(input.replacesAssertionId)await this.append(groupId,'REPLACE',input.idempotencyKey,{assertionId:input.replacesAssertionId,replacementId:record.id,reason:'Replaced by a new dated assertion'});
  return record;
 }
 async list(groupId:Id,membershipId?:Id){
  const access=await this.access(groupId),rows=(await this.repo.listWorkspaceRecords(this.ctx().tenantId,MODULE,groupId)).filter(x=>x.tags.includes('verification-fact')),actor=this.ctx().actorId;
  return rows.filter(r=>r.data.kind==='ASSERTION'&&(!membershipId||r.data.membershipId===membershipId)&&(access.manager||r.data.subjectUserId===actor)).map(r=>({record:r,state:this.state(r,rows),events:rows.filter(x=>x.data.assertionId===r.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id)),shares:rows.filter(x=>x.data.kind==='SHARE'&&x.data.assertionId===r.id).map(s=>({id:s.id,expiresAt:s.data.expiresAt,summary:s.data.summary,revoked:rows.some(x=>x.data.kind==='REVOKE_SHARE'&&x.data.shareId===s.id)}))}));
 }
 async act(groupId:Id,id:Id,input:{action:'SUSPEND'|'REVOKE'|'CONTEST'|'REVIEW';reason:string;evidenceRef?:string;idempotencyKey:string}){
  const access=await this.visible(groupId,id),c=this.ctx(),own=access.r.data.subjectUserId===c.actorId;
  if(!['SUSPEND','REVOKE','CONTEST','REVIEW'].includes(input.action))throw Error('INVALID_ASSERTION_ACTION');
  if(input.action==='REVIEW'?!access.manager:!access.manager&&!own)throw Error('FORBIDDEN_SCOPE');
  const reason=text(input.reason,1200);if(!reason)throw Error('ASSERTION_REASON_REQUIRED');
  // A review records the response. Reactivation requires a new dated assertion.
  return this.append(groupId,input.action,input.idempotencyKey,{assertionId:id,reason,evidenceRef:text(input.evidenceRef,240)});
 }
 async share(groupId:Id,id:Id,input:{summary:string;expiresAt:string;idempotencyKey:string}){
  const {r}=await this.visible(groupId,id),c=this.ctx();if(r.data.subjectUserId!==c.actorId)throw Error('FORBIDDEN_SCOPE');
  const rows=(await this.repo.listWorkspaceRecords(c.tenantId,MODULE,groupId)).filter(x=>x.tags.includes('verification-fact'));if(this.state(r,rows)!=='ACTIVE')throw Error('ASSERTION_NOT_ACTIVE');
  const summary=text(input.summary,500),expiry=Date.parse(input.expiresAt);if(!summary||!Number.isFinite(expiry)||expiry<=this.clock()||expiry>Date.parse(String(r.data.expiresAt)))throw Error('INVALID_CARD_EXPIRY');
  const shareId='tv_'+await digest(JSON.stringify([c.tenantId,c.actorId,groupId,'SHARE',input.idempotencyKey]));
  const prior=await this.repo.getWorkspaceRecord(c.tenantId,shareId);
  if(prior)throw Error('CARD_ALREADY_CREATED_REVOKE_OR_CREATE_NEW');
  const bytes=crypto.getRandomValues(new Uint8Array(32)),secret=[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');
  const token=encode({t:c.tenantId,g:groupId,a:id,s:shareId,k:secret}),tokenHash=await digest(token);
  const record=await this.append(groupId,'SHARE',input.idempotencyKey,{assertionId:id,summary,expiresAt:new Date(expiry).toISOString(),tokenHash});
  // An identical concurrent request may never replace another secret.
  if(record.data.tokenHash!==tokenHash)throw Error('GOVERNED_RECORD_CONFLICT');return{id:record.id,token,expiresAt:record.data.expiresAt};
 }
 async revokeShare(groupId:Id,id:Id,shareId:Id,key:string){
  const {r}=await this.visible(groupId,id);if(r.data.subjectUserId!==this.ctx().actorId)throw Error('FORBIDDEN_SCOPE');
  const share=await this.repo.getWorkspaceRecord(this.ctx().tenantId,shareId);if(!share||share.moduleId!==MODULE||share.groupId!==groupId||share.data.kind!=='SHARE'||share.data.assertionId!==id)throw Error('CARD_NOT_FOUND');
  return this.append(groupId,'REVOKE_SHARE',key,{assertionId:id,shareId});
 }
 async verify(token:string){
  const checkedAt=this.stamp(),invalid=(state='INVALID')=>({valid:false,state,checkedAt,onlineCheck:true,scope:'ASSERTION_ONLY'});
  let p:any;try{if(typeof token!=='string'||token.length>1800)return invalid();p=decode(token);}catch{return invalid();}
  if(!p||!['t','g','a','s','k'].every(k=>typeof p[k]==='string'&&p[k].length<240)||!/^[a-f0-9]{64}$/.test(p.k))return invalid();
  const share=await this.repo.getWorkspaceRecord(p.t,p.s);if(!share||share.moduleId!==MODULE||share.groupId!==p.g||share.data.kind!=='SHARE'||share.data.assertionId!==p.a||share.data.tokenHash!==await digest(token))return invalid();
  const rows=(await this.repo.listWorkspaceRecords(p.t,MODULE,p.g)).filter(x=>x.tags.includes('verification-fact')),r=rows.find(x=>x.id===p.a&&x.data.kind==='ASSERTION');if(!r)return invalid();
  if(rows.some(x=>x.data.kind==='REVOKE_SHARE'&&x.data.shareId===share.id))return invalid('SHARE_REVOKED');
  if(Date.parse(String(share.data.expiresAt))<=this.clock())return invalid('SHARE_EXPIRED');
  const state=this.state(r,rows);if(state!=='ACTIVE')return invalid(state);
  const group=await this.repo.getGroup(p.t,p.g),members=await this.repo.listMemberships(p.t,p.g);
  if(!group||group.status!=='active'||!members.some(x=>x.id===r.data.membershipId&&x.status==='active'))return invalid('SUBJECT_INACTIVE');
  if(r.data.assurance!=='DECLARED'&&group.createdBy!==r.createdBy&&!members.some(x=>x.userId===r.createdBy&&x.status==='active'&&x.roles.some(role=>managers.has(role))))return invalid('ISSUER_INACTIVE');
  return{valid:true,state:'ACTIVE',checkedAt,onlineCheck:true,scope:'ASSERTION_ONLY',assertionKind:r.data.assertionKind,summary:share.data.summary,assurance:r.data.assurance,issuerType:r.data.issuerType,issuedAt:r.createdAt,expiresAt:r.data.expiresAt,shareExpiresAt:share.data.expiresAt,permissionGranted:false,commercialGuarantee:false,privateEvidenceIncluded:false};
 }
}
