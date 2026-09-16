import type {D1DatabaseLike} from '../../repositories/src/index.js';

export type IdentityProofType='CNI'|'PHONE'|'NAME';
export type IdentityVerificationState='CLAIMED'|'MANAGER_RECORDED'|'VERIFIED';

const cleanCni=(value:string)=>{
  const normalized=value.normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(normalized.length<6||normalized.length>40)throw new Error('INVALID_CNI_FORMAT');
  return normalized;
};
const cleanPhone=(value:string)=>{
  let normalized=value.normalize('NFKC').replace(/[^0-9+]/g,'');
  if(normalized.startsWith('00'))normalized='+'+normalized.slice(2);
  if(normalized.startsWith('6')&&normalized.length===9)normalized='+237'+normalized;
  if(!/^\+[1-9][0-9]{7,14}$/.test(normalized))throw new Error('INVALID_PHONE_FORMAT');
  return normalized;
};
const cleanName=(value:string)=>{
  const normalized=value.normalize('NFKC').toUpperCase().replace(/[’']/g,' ').replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim();
  if(normalized.length<3||normalized.length>160)throw new Error('INVALID_NAME_FORMAT');
  return normalized;
};
const normalize=(type:IdentityProofType,value:string)=>type==='CNI'?cleanCni(value):type==='PHONE'?cleanPhone(value):cleanName(value);
const hex=(buffer:ArrayBuffer)=>[...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
const hmac=async(secret:string,value:string)=>{
  if(secret.length<24)throw new Error('IDENTITY_MATCH_PEPPER_REQUIRED');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
};
const now=()=>new Date().toISOString();

export class IdentityProofService{
  constructor(public db:D1DatabaseLike,public pepper:string){}
  private token(type:IdentityProofType,value:string){return hmac(this.pepper,type+':'+normalize(type,value));}

  async registerAccountProof(accountId:string,type:IdentityProofType,value:string,sourceRef='USER_PRESENTED'):Promise<{proofId:string;state:IdentityVerificationState;proofType:IdentityProofType}>{
    const hash=await this.token(type,value),proofId='proof_'+crypto.randomUUID(),createdAt=now();
    const existing=await this.db.prepare("SELECT proof_id,verification_state FROM identity_proof_tokens WHERE account_id=? AND proof_type=? AND identifier_hash=? LIMIT 1").bind(accountId,type,hash).first<Record<string,unknown>>();
    if(existing)return{proofId:String(existing.proof_id),state:String(existing.verification_state) as IdentityVerificationState,proofType:type};
    await this.db.prepare("INSERT INTO identity_proof_tokens(proof_id,account_id,proof_type,identifier_hash,verification_state,source_ref,created_at) VALUES(?,?,?,?, 'CLAIMED',?,?)").bind(proofId,accountId,type,hash,sourceRef.slice(0,160),createdAt).run();
    return{proofId,state:'CLAIMED',proofType:type};
  }
  registerAccountCni(accountId:string,cni:string,sourceRef='USER_PRESENTED'){return this.registerAccountProof(accountId,'CNI',cni,sourceRef);}
  registerAccountPhone(accountId:string,phone:string,sourceRef='USER_PRESENTED'){return this.registerAccountProof(accountId,'PHONE',phone,sourceRef);}
  registerAccountName(accountId:string,name:string,sourceRef='USER_PRESENTED'){return this.registerAccountProof(accountId,'NAME',name,sourceRef);}

  async recordHistoricalHint(input:{tenantId:string;groupId:string;membershipId:string;proofType:IdentityProofType;value:string;createdBy:string}):Promise<{hintId:string;state:IdentityVerificationState;proofType:IdentityProofType}>{
    const hash=await this.token(input.proofType,input.value),hintId=input.proofType.toLowerCase()+'_hint_'+crypto.randomUUID(),createdAt=now();
    await this.db.prepare("INSERT INTO historical_identity_hints(hint_id,tenant_id,group_id,membership_id,proof_type,identifier_hash,verification_state,created_by,created_at) VALUES(?,?,?,?,?,?,'MANAGER_RECORDED',?,?) ON CONFLICT(tenant_id,group_id,membership_id,proof_type) DO UPDATE SET identifier_hash=excluded.identifier_hash,verification_state='MANAGER_RECORDED',created_by=excluded.created_by,created_at=excluded.created_at")
      .bind(hintId,input.tenantId,input.groupId,input.membershipId,input.proofType,hash,input.createdBy,createdAt).run();
    return{hintId,state:'MANAGER_RECORDED',proofType:input.proofType};
  }
  recordHistoricalCniHint(input:{tenantId:string;groupId:string;membershipId:string;cni:string;createdBy:string}){return this.recordHistoricalHint({tenantId:input.tenantId,groupId:input.groupId,membershipId:input.membershipId,proofType:'CNI',value:input.cni,createdBy:input.createdBy});}
  recordHistoricalPhoneHint(input:{tenantId:string;groupId:string;membershipId:string;phone:string;createdBy:string}){return this.recordHistoricalHint({tenantId:input.tenantId,groupId:input.groupId,membershipId:input.membershipId,proofType:'PHONE',value:input.phone,createdBy:input.createdBy});}
  recordHistoricalNameHint(input:{tenantId:string;groupId:string;membershipId:string;name:string;createdBy:string}){return this.recordHistoricalHint({tenantId:input.tenantId,groupId:input.groupId,membershipId:input.membershipId,proofType:'NAME',value:input.name,createdBy:input.createdBy});}

  async candidateMatches(accountId:string):Promise<Array<{tenantId:string;groupId:string;membershipId:string;proofType:IdentityProofType;confidence:'EXACT_HASH_MATCH'}>>{
    const rows=await this.db.prepare("SELECT h.tenant_id,h.group_id,h.membership_id,h.proof_type FROM identity_proof_tokens p JOIN historical_identity_hints h ON h.proof_type=p.proof_type AND h.identifier_hash=p.identifier_hash WHERE p.account_id=? AND p.proof_type IN ('CNI','PHONE','NAME')").bind(accountId).all<Record<string,unknown>>();
    return rows.results.map(r=>({tenantId:String(r.tenant_id),groupId:String(r.group_id),membershipId:String(r.membership_id),proofType:String(r.proof_type) as IdentityProofType,confidence:'EXACT_HASH_MATCH' as const}));
  }

  async markVerified(proofId:string,accountId:string):Promise<void>{
    await this.db.prepare("UPDATE identity_proof_tokens SET verification_state='VERIFIED',verified_at=? WHERE proof_id=? AND account_id=?").bind(now(),proofId,accountId).run();
  }
}
