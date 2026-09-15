import type {Id,Membership,User} from '../../contracts/src/index.js';
import type {PlatformRepository,D1DatabaseLike} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type GroupJoinMode='AUTO_JOIN'|'HISTORICAL_MATCH';
export interface GroupJoinInvite {
  code:string;groupId:Id;mode:GroupJoinMode;expiresAt:string;maxUses:number;usedCount:number;label?:string;joinPath:string;
}
export interface PairingRequestView {
  requestId:string;groupId:Id;displayName:string;status:'PENDING'|'APPROVED'|'REJECTED';membershipId?:Id;createdAt:string;decidedAt?:string;decisionReason?:string;
}

const managers=new Set(['founder','manager','admin','president','treasurer']);
const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const now=()=>new Date().toISOString();
const normalize=(code:string)=>code.toUpperCase().replace(/[^A-Z0-9]/g,'');
const randomCode=(length=12)=>{
  const bytes=new Uint8Array(length);crypto.getRandomValues(bytes);
  return [...bytes].map(b=>alphabet[b%alphabet.length]).join('');
};
const displayCode=(code:string)=>normalize(code).match(/.{1,4}/g)?.join('-')??normalize(code);
const hash=async(value:string)=>{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalize(value)));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
const safeHours=(hours:number,max:number)=>{const h=Math.trunc(hours);if(!Number.isSafeInteger(h)||h<1||h>max)throw Error('INVALID_EXPIRY');return h;};

export class GroupPairingService{
  constructor(public db:D1DatabaseLike,public repo:PlatformRepository,public kernel:PlatformKernel){}

  private async manager(groupId:Id){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroupById(groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return group;
    const member=(await this.repo.listMemberships(group.tenantId,group.id)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member||!member.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return group;
  }
  private async authBound(userId:Id){
    return Boolean(await this.db.prepare('SELECT id FROM auth_accounts WHERE id=?').bind(userId).first<Record<string,unknown>>());
  }
  private async bindMembership(groupId:Id,membershipId:Id,accountId:Id,actorId:Id){
    const group=await this.manager(groupId),membership=await this.repo.getMembership(group.tenantId,groupId,membershipId);if(!membership)throw Error('MEMBERSHIP_NOT_FOUND');
    if(membership.userId===accountId)return membership;
    if(await this.authBound(membership.userId))throw Error('MEMBERSHIP_ALREADY_BOUND');
    const account=await this.db.prepare('SELECT id,display_name,locale,created_at FROM auth_accounts WHERE id=?').bind(accountId).first<Record<string,unknown>>();
    if(!account)throw Error('ACCOUNT_NOT_FOUND');
    const user:User={id:accountId,displayName:String(account.display_name),locale:String(account.locale??'fr'),createdAt:String(account.created_at)};
    await this.repo.saveUser(user);
    const before={...membership},next:Membership={...membership,userId:accountId,status:'active',joinedAt:membership.joinedAt??now(),historicalTenureStatus:membership.historicalTenureStatus??'VALIDATED'};
    await this.repo.saveMembership(next);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:group.tenantId,actorId,action:'HISTORICAL_MEMBERSHIP_ACCOUNT_PAIRED',targetType:'membership',targetId:membership.id,requestId:this.kernel.context.get().requestId,before,after:next,metadata:{preservedMembershipId:membership.id}}));
    return next;
  }

  async createInvite(groupId:Id,input:{mode?:GroupJoinMode;label?:string;expiresHours?:number;maxUses?:number}={}):Promise<GroupJoinInvite>{
    const ctx=this.kernel.context.get(),group=await this.manager(groupId);
    const historical=group.originMode==='IMPORT_EXISTING'||Boolean(group.historicalCreatedAt);
    const mode=input.mode??(historical?'HISTORICAL_MATCH':'AUTO_JOIN');
    if(historical&&mode==='AUTO_JOIN')throw Error('HISTORICAL_GROUP_REQUIRES_MATCH');
    const hours=safeHours(input.expiresHours??72,24*30),maxUses=Math.trunc(input.maxUses??200);if(!Number.isSafeInteger(maxUses)||maxUses<1||maxUses>5000)throw Error('INVALID_MAX_USES');
    const raw=randomCode(12),code=displayCode(raw),tokenHash=await hash(raw),createdAt=now(),expiresAt=new Date(Date.now()+hours*3600000).toISOString();
    await this.db.prepare('INSERT INTO group_join_links(token_hash,tenant_id,group_id,mode,label,max_uses,used_count,expires_at,created_by,created_at,revoked_at) VALUES(?,?,?,?,?,?,?,?,?,?,NULL)')
      .bind(tokenHash,group.tenantId,group.id,mode,input.label?.trim().slice(0,120)??null,maxUses,0,expiresAt,ctx.actorId,createdAt).run();
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:group.tenantId,actorId:ctx.actorId,action:'GROUP_JOIN_LINK_CREATED',targetType:'group',targetId:group.id,requestId:ctx.requestId,metadata:{mode,maxUses,expiresAt}}));
    return{code,groupId:group.id,mode,expiresAt,maxUses,usedCount:0,label:input.label?.trim(),joinPath:'/join?code='+encodeURIComponent(code)};
  }

  async listInvites(groupId:Id){
    const group=await this.manager(groupId);
    const rows=await this.db.prepare('SELECT mode,label,max_uses,used_count,expires_at,created_at,revoked_at FROM group_join_links WHERE tenant_id=? AND group_id=? ORDER BY created_at DESC').bind(group.tenantId,group.id).all<Record<string,unknown>>();
    return rows.results.map(r=>({mode:String(r.mode),label:r.label?String(r.label):undefined,maxUses:Number(r.max_uses),usedCount:Number(r.used_count),expiresAt:String(r.expires_at),createdAt:String(r.created_at),revoked:Boolean(r.revoked_at)}));
  }

  async redeemInvite(code:string):Promise<{status:'JOINED';groupId:Id;membershipId:Id}|{status:'PENDING_MANAGER_MATCH';groupId:Id;pairingRequestId:string}>{
    const ctx=this.kernel.context.get(),tokenHash=await hash(code);
    const link=await this.db.prepare('SELECT * FROM group_join_links WHERE token_hash=?').bind(tokenHash).first<Record<string,unknown>>();
    if(!link)throw Error('INVITE_NOT_FOUND');
    if(link.revoked_at||Date.parse(String(link.expires_at))<=Date.now())throw Error('INVITE_EXPIRED');
    if(Number(link.used_count)>=Number(link.max_uses))throw Error('INVITE_USAGE_LIMIT');
    const group=await this.repo.getGroupById(String(link.group_id));if(!group||group.tenantId!==String(link.tenant_id))throw Error('GROUP_NOT_FOUND');
    const account=await this.db.prepare('SELECT id,display_name,locale,created_at FROM auth_accounts WHERE id=?').bind(ctx.actorId).first<Record<string,unknown>>();if(!account)throw Error('ACCOUNT_NOT_FOUND');
    const existing=(await this.repo.listMemberships(group.tenantId,group.id)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(existing)return{status:'JOINED',groupId:group.id,membershipId:existing.id};

    if(String(link.mode)==='AUTO_JOIN'){
      const user:User={id:ctx.actorId,displayName:String(account.display_name),locale:String(account.locale??'fr'),createdAt:String(account.created_at)};await this.repo.saveUser(user);
      const membership:Membership={id:makeId('membership'),tenantId:group.tenantId,groupId:group.id,userId:ctx.actorId,roles:['member'],status:'active',joinedAt:now()};
      await this.repo.saveMembership(membership);
      await this.db.prepare('UPDATE group_join_links SET used_count=used_count+1 WHERE token_hash=? AND used_count<max_uses').bind(tokenHash).run();
      await this.repo.saveAudit(this.kernel.audit.append({tenantId:group.tenantId,actorId:ctx.actorId,action:'MEMBER_JOINED_BY_SECURE_LINK',targetType:'membership',targetId:membership.id,requestId:ctx.requestId,metadata:{groupId:group.id,inviteMode:'AUTO_JOIN'}}));
      return{status:'JOINED',groupId:group.id,membershipId:membership.id};
    }

    const prior=await this.db.prepare("SELECT request_id,status FROM historical_pairing_requests WHERE group_id=? AND account_id=? AND status='PENDING' LIMIT 1").bind(group.id,ctx.actorId).first<Record<string,unknown>>();
    if(prior)return{status:'PENDING_MANAGER_MATCH',groupId:group.id,pairingRequestId:String(prior.request_id)};
    const requestId=makeId('pairing'),createdAt=now();
    await this.db.prepare("INSERT INTO historical_pairing_requests(request_id,tenant_id,group_id,account_id,display_name,status,created_at) VALUES(?,?,?,?,?,'PENDING',?)")
      .bind(requestId,group.tenantId,group.id,ctx.actorId,String(account.display_name),createdAt).run();
    await this.db.prepare('UPDATE group_join_links SET used_count=used_count+1 WHERE token_hash=? AND used_count<max_uses').bind(tokenHash).run();
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:group.tenantId,actorId:ctx.actorId,action:'HISTORICAL_PAIRING_REQUESTED',targetType:'pairing_request',targetId:requestId,requestId:ctx.requestId,metadata:{groupId:group.id}}));
    return{status:'PENDING_MANAGER_MATCH',groupId:group.id,pairingRequestId:requestId};
  }

  async pairingStatus(requestId:string):Promise<PairingRequestView>{
    const ctx=this.kernel.context.get(),r=await this.db.prepare('SELECT * FROM historical_pairing_requests WHERE request_id=? AND account_id=?').bind(requestId,ctx.actorId).first<Record<string,unknown>>();if(!r)throw Error('PAIRING_REQUEST_NOT_FOUND');
    return{requestId:String(r.request_id),groupId:String(r.group_id),displayName:String(r.display_name),status:String(r.status) as PairingRequestView['status'],membershipId:r.membership_id?String(r.membership_id):undefined,createdAt:String(r.created_at),decidedAt:r.decided_at?String(r.decided_at):undefined,decisionReason:r.decision_reason?String(r.decision_reason):undefined};
  }

  async listPairingRequests(groupId:Id):Promise<PairingRequestView[]>{
    const group=await this.manager(groupId),rows=await this.db.prepare('SELECT * FROM historical_pairing_requests WHERE tenant_id=? AND group_id=? ORDER BY created_at DESC').bind(group.tenantId,group.id).all<Record<string,unknown>>();
    return rows.results.map(r=>({requestId:String(r.request_id),groupId:group.id,displayName:String(r.display_name),status:String(r.status) as PairingRequestView['status'],membershipId:r.membership_id?String(r.membership_id):undefined,createdAt:String(r.created_at),decidedAt:r.decided_at?String(r.decided_at):undefined,decisionReason:r.decision_reason?String(r.decision_reason):undefined}));
  }

  async decidePairing(groupId:Id,requestId:string,input:{decision:'APPROVE'|'REJECT';membershipId?:Id;reason?:string}){
    const ctx=this.kernel.context.get(),group=await this.manager(groupId),r=await this.db.prepare("SELECT * FROM historical_pairing_requests WHERE request_id=? AND tenant_id=? AND group_id=? AND status='PENDING'").bind(requestId,group.tenantId,group.id).first<Record<string,unknown>>();if(!r)throw Error('PAIRING_REQUEST_NOT_FOUND');
    if(input.decision==='REJECT'){
      const decidedAt=now();await this.db.prepare("UPDATE historical_pairing_requests SET status='REJECTED',decided_at=?,decided_by=?,decision_reason=? WHERE request_id=?").bind(decidedAt,ctx.actorId,input.reason?.trim().slice(0,300)??null,requestId).run();
      return{status:'REJECTED' as const};
    }
    if(!input.membershipId)throw Error('MEMBERSHIP_REQUIRED');
    const membership=await this.bindMembership(groupId,input.membershipId,String(r.account_id),ctx.actorId),decidedAt=now();
    await this.db.prepare("UPDATE historical_pairing_requests SET status='APPROVED',membership_id=?,decided_at=?,decided_by=?,decision_reason=? WHERE request_id=?").bind(membership.id,decidedAt,ctx.actorId,input.reason?.trim().slice(0,300)??null,requestId).run();
    return{status:'APPROVED' as const,membership};
  }

  async createMemberPairingCode():Promise<{code:string;expiresAt:string}>{
    const ctx=this.kernel.context.get(),account=await this.db.prepare('SELECT id,display_name FROM auth_accounts WHERE id=?').bind(ctx.actorId).first<Record<string,unknown>>();if(!account)throw Error('ACCOUNT_NOT_FOUND');
    const raw=randomCode(10),code=displayCode(raw),tokenHash=await hash(raw),createdAt=now(),expiresAt=new Date(Date.now()+30*60*1000).toISOString();
    await this.db.prepare('UPDATE member_pairing_codes SET revoked_at=? WHERE account_id=? AND used_at IS NULL AND revoked_at IS NULL').bind(createdAt,ctx.actorId).run();
    await this.db.prepare('INSERT INTO member_pairing_codes(token_hash,account_id,display_name,created_at,expires_at,used_at,revoked_at) VALUES(?,?,?,?,?,NULL,NULL)').bind(tokenHash,ctx.actorId,String(account.display_name),createdAt,expiresAt).run();
    return{code,expiresAt};
  }

  async bindWithMemberCode(groupId:Id,membershipId:Id,code:string){
    const ctx=this.kernel.context.get(),group=await this.manager(groupId),tokenHash=await hash(code);
    const row=await this.db.prepare('SELECT * FROM member_pairing_codes WHERE token_hash=?').bind(tokenHash).first<Record<string,unknown>>();
    if(!row||row.revoked_at||row.used_at||Date.parse(String(row.expires_at))<=Date.now())throw Error('MEMBER_PAIRING_CODE_INVALID');
    const membership=await this.bindMembership(group.id,membershipId,String(row.account_id),ctx.actorId),usedAt=now();
    await this.db.prepare('UPDATE member_pairing_codes SET used_at=? WHERE token_hash=?').bind(usedAt,tokenHash).run();
    return{membership,displayName:String(row.display_name)};
  }
}
