import type {D1DatabaseLike} from '../../repositories/src/index.js';

export interface PersonalCommercialConsent {accountId:string;groupId:string;granted:boolean;version:number;updatedAt:string;}
export interface IssuedPreferenceToken {token:string;expiresAt:string;maxAgeSeconds:number;}

const TOKEN_SECONDS=30*24*60*60;
const hex=(buffer:ArrayBuffer)=>[...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
const sha=async(value:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
const randomToken=()=>{
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
};
const stamp=()=>new Date().toISOString();

export class CommercialPreferenceService{
  constructor(public db:D1DatabaseLike,public defaultGranted=true){}

  async consent(accountId:string,groupId:string):Promise<PersonalCommercialConsent>{
    const row=await this.db.prepare('SELECT account_id,group_id,granted,version,updated_at FROM commercial_preference_consents WHERE account_id=? AND group_id=?').bind(accountId,groupId).first<Record<string,unknown>>();
    return row?{accountId:String(row.account_id),groupId:String(row.group_id),granted:Number(row.granted)===1,version:Number(row.version),updatedAt:String(row.updated_at)}:{accountId,groupId,granted:this.defaultGranted,version:0,updatedAt:''};
  }

  async setConsent(accountId:string,groupId:string,granted:boolean):Promise<PersonalCommercialConsent>{
    const current=await this.consent(accountId,groupId),updatedAt=stamp(),version=current.version+1;
    await this.db.prepare(`INSERT INTO commercial_preference_consents(account_id,group_id,granted,version,updated_at)
      VALUES(?,?,?,?,?)
      ON CONFLICT(account_id,group_id) DO UPDATE SET granted=excluded.granted,version=excluded.version,updated_at=excluded.updated_at`)
      .bind(accountId,groupId,granted?1:0,version,updatedAt).run();
    if(!granted)await this.db.prepare('UPDATE commercial_preference_tokens SET revoked_at=? WHERE account_id=? AND group_id=? AND revoked_at IS NULL').bind(updatedAt,accountId,groupId).run();
    return{accountId,groupId,granted,version,updatedAt};
  }

  async issue(accountId:string,groupId:string):Promise<IssuedPreferenceToken>{
    const consent=await this.consent(accountId,groupId);if(!consent.granted)throw new Error('PERSONAL_COMMERCIAL_CONSENT_REQUIRED');
    const token=randomToken(),tokenHash=await sha(token),createdAt=stamp(),expiresAt=new Date(Date.now()+TOKEN_SECONDS*1000).toISOString();
    await this.db.prepare('INSERT INTO commercial_preference_tokens(token_hash,account_id,group_id,created_at,expires_at,revoked_at) VALUES(?,?,?,?,?,NULL)')
      .bind(tokenHash,accountId,groupId,createdAt,expiresAt).run();
    return{token,expiresAt,maxAgeSeconds:TOKEN_SECONDS};
  }

  async verify(token:string,accountId:string,groupId:string):Promise<boolean>{
    if(!token)return false;const tokenHash=await sha(token);
    const row=await this.db.prepare('SELECT account_id,group_id,expires_at,revoked_at FROM commercial_preference_tokens WHERE token_hash=?').bind(tokenHash).first<Record<string,unknown>>();
    if(!row||row.revoked_at)return false;
    return String(row.account_id)===accountId&&String(row.group_id)===groupId&&Date.parse(String(row.expires_at))>Date.now();
  }

  async revokeToken(token:string,accountId:string,groupId:string):Promise<void>{
    if(!token)return;const tokenHash=await sha(token),now=stamp();
    await this.db.prepare('UPDATE commercial_preference_tokens SET revoked_at=? WHERE token_hash=? AND account_id=? AND group_id=?').bind(now,tokenHash,accountId,groupId).run();
  }
}

export const preferenceCookie=(token:string,maxAgeSeconds:number)=>[
  'eco_pref='+encodeURIComponent(token),
  'Path=/',
  'HttpOnly',
  'Secure',
  'SameSite=Lax',
  'Max-Age='+Math.max(0,Math.trunc(maxAgeSeconds))
].join('; ');

export const clearPreferenceCookie=()=>preferenceCookie('',0);
export const readPreferenceCookie=(request:Request)=>{
  const cookie=request.headers.get('cookie')??'';
  for(const part of cookie.split(';')){const [name,...rest]=part.trim().split('=');if(name==='eco_pref')return decodeURIComponent(rest.join('='));}
  return '';
};
