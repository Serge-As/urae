import type {D1DatabaseLike} from '../../repositories/src/index.js';

export type IdentityProofType='CNI';
export type IdentityVerificationState='CLAIMED'|'MANAGER_RECORDED'|'VERIFIED';

const cleanCni=(value:string)=>{
  const normalized=value.normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(normalized.length<6||normalized.length>40)throw new Error('INVALID_CNI_FORMAT');
  return normalized;
};
const hex=(buffer:ArrayBuffer)=>[...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
const hmac=async(secret:string,value:string)=>{
  if(secret.length<24)throw new Error('IDENTITY_MATCH_PEPPER_REQUIRED');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
};
const now=()=>new Date().toISOString();

export class IdentityProofService{
  constructor(public db:D1DatabaseLike,public pepper:string){}
  private token(cni:string){return hmac(this.pepper,'CNI:'+cleanCni(cni));}

  async registerAccountCni(accountId:string,cni:string,sourceRef='USER_PRESENTED'):Promise<{proofId:string;state:IdentityVerificationState}>{
    const hash=await this.token(cni),proofId='proof_'+crypto.randomUUID(),createdAt=now();
    const existing=await this.db.prepare("SELECT proof_id,verification_state FROM identity_proof_tokens WHERE account_id=? AND proof_type='CNI' AND identifier_hash=? LIMIT 1").bind(accountId,hash).first<Record<string,unknown>>();
    if(existing)return{proofId:String(existing.proof_id),state:String(existing.verification_state) as IdentityVerificationState};
    await this.db.prepare("INSERT INTO identity_proof_tokens(proof_id,account_id,proof_type,identifier_hash,verification_state,source_ref,created_at) VALUES(?,?,'CNI',?,'CLAIMED',?,?)").bind(proofId,accountId,hash,sourceRef.slice(0,160),createdAt).run();
    return{proofId,state:'CLAIMED'};
  }

  async recordHistoricalCniHint(input:{tenantId:string;groupId:string;membershipId:string;cni:string;createdBy:string}):Promise<{hintId:string;state:IdentityVerificationState}>{
    const hash=await this.token(input.cni),hintId='cni_hint_'+crypto.randomUUID(),createdAt=now();
    await this.db.prepare(`INSERT INTO historical_identity_hints(hint_id,tenant_id,group_id,membership_id,proof_type,identifier_hash,verification_state,created_by,created_at)
      VALUES(?,?,?,?, 'CNI',?,'MANAGER_RECORDED',?,?)
      ON CONFLICT(tenant_id,group_id,membership_id,proof_type) DO UPDATE SET identifier_hash=excluded.identifier_hash,verification_state='MANAGER_RECORDED',created_by=excluded.created_by,created_at=excluded.created_at`)
      .bind(hintId,input.tenantId,input.groupId,input.membershipId,hash,input.createdBy,createdAt).run();
    return{hintId,state:'MANAGER_RECORDED'};
  }

  async candidateMatches(accountId:string):Promise<Array<{tenantId:string;groupId:string;membershipId:string;proofType:'CNI';confidence:'EXACT_HASH_MATCH'}>>{
    const rows=await this.db.prepare(`SELECT h.tenant_id,h.group_id,h.membership_id
      FROM identity_proof_tokens p JOIN historical_identity_hints h
      ON h.proof_type=p.proof_type AND h.identifier_hash=p.identifier_hash
      WHERE p.account_id=? AND p.proof_type='CNI'`).bind(accountId).all<Record<string,unknown>>();
    return rows.results.map(r=>({tenantId:String(r.tenant_id),groupId:String(r.group_id),membershipId:String(r.membership_id),proofType:'CNI' as const,confidence:'EXACT_HASH_MATCH' as const}));
  }

  async markVerified(proofId:string,accountId:string):Promise<void>{
    await this.db.prepare("UPDATE identity_proof_tokens SET verification_state='VERIFIED',verified_at=? WHERE proof_id=? AND account_id=?").bind(now(),proofId,accountId).run();
  }
}
