import { scrypt, timingSafeEqual, randomBytes } from 'node:crypto';
import type { D1DatabaseLike } from '../../repositories/src/index.js';

export interface Account { id:string; username:string; displayName:string; tenantId:string; locale:string; createdAt:string }
interface AccountRow { id:string; username:string; display_name:string; tenant_id:string; locale:string; created_at:string; salt:string; password_hash:string }
interface SessionRow { account_id:string; expires_at:number; last_seen:number }
const SESSION_SECONDS=8*60*60;
const IDLE_SECONDS=30*60;
const json=(data:unknown,status=200,headers:HeadersInit={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});
const sha256=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const bytes=(hex:string)=>Uint8Array.from(hex.match(/../g)??[],x=>parseInt(x,16));
const passwordKey=(password:string,salt:string):Promise<Uint8Array>=>new Promise((resolve,reject)=>scrypt(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
const hex=(value:Uint8Array)=>Array.from(value,x=>x.toString(16).padStart(2,'0')).join('');
const project=(r:AccountRow):Account=>({id:r.id,username:r.username,displayName:r.display_name,tenantId:r.tenant_id,locale:r.locale,createdAt:r.created_at});
const cookieName=(url:URL)=>url.protocol==='https:'?'__Host-eco_session':'eco_local_session';
const cookie=(url:URL,value:string,age=SESSION_SECONDS)=>`${cookieName(url)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${url.protocol==='https:'?'; Secure':''}`;

/** Server-owned identities and opaque, revocable sessions. No client role/tenant is trusted. */
export class SessionService {
 constructor(private readonly db:D1DatabaseLike){}
 private token(request:Request):string|undefined{
  const name=cookieName(new URL(request.url));
  const value=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value)?value:undefined;
 }
 private async rateLimit(key:string,maximum:number,seconds:number):Promise<void>{
  const bucket=Math.floor(Date.now()/1000/seconds);
  const row=await this.db.prepare(`INSERT INTO auth_rate_limits(bucket_key,bucket,hits) VALUES(?,?,1)
    ON CONFLICT(bucket_key) DO UPDATE SET hits=CASE WHEN bucket=excluded.bucket THEN hits+1 ELSE 1 END,bucket=excluded.bucket
    RETURNING hits`).bind(key,bucket).first<{hits:number}>();
  if(!row || row.hits>maximum)throw Error('RATE_LIMITED');
 }
 async current(request:Request):Promise<Account|undefined>{
  const token=this.token(request);if(!token)return undefined;
  const key=await sha256(token),now=Math.floor(Date.now()/1000);
  const session=await this.db.prepare('SELECT account_id,expires_at,last_seen FROM auth_sessions WHERE token_hash=?').bind(key).first<SessionRow>();
  if(!session || session.expires_at<=now || session.last_seen+IDLE_SECONDS<=now)return undefined;
  const account=await this.db.prepare('SELECT * FROM auth_accounts WHERE id=?').bind(session.account_id).first<AccountRow>();
  if(!account)return undefined;
  if(now-session.last_seen>60)await this.db.prepare('UPDATE auth_sessions SET last_seen=? WHERE token_hash=?').bind(now,key).run();
  return project(account);
 }
 private async issue(account:Account,url:URL):Promise<Response>{
  const token=randomBytes(32).toString('base64url'),now=Math.floor(Date.now()/1000);
  await this.db.prepare('INSERT INTO auth_sessions(token_hash,account_id,created_at,last_seen,expires_at) VALUES(?,?,?,?,?)')
   .bind(await sha256(token),account.id,now,now,now+SESSION_SECONDS).run();
  return json({authenticated:true,account},200,{'set-cookie':cookie(url,token)});
 }
 async handle(request:Request):Promise<Response>{
  const url=new URL(request.url);
  if(request.method==='GET' && url.pathname==='/api/v1/auth/session'){
   const account=await this.current(request);return json({authenticated:Boolean(account),account:account??null});
  }
  if(request.method!=='POST')return json({error:'NOT_FOUND'},404);
  if(request.headers.get('origin')!==url.origin || !request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'ORIGIN_NOT_ALLOWED'},403);
  try{
   if(url.pathname==='/api/v1/auth/logout'){
    const token=this.token(request);if(token)await this.db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await sha256(token)).run();
    return json({authenticated:false},200,{'set-cookie':cookie(url,'',0)});
   }
   if(!['/api/v1/auth/register','/api/v1/auth/login'].includes(url.pathname))return json({error:'NOT_FOUND'},404);
   const content=await request.text();if(content.length>4096)return json({error:'REQUEST_TOO_LARGE'},413);
   const body=JSON.parse(content) as Record<string,unknown>;
   const username=String(body.username??'').trim().toLowerCase(),password=String(body.password??'');
   if(!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username) || password.length<12 || password.length>128)return json({error:'INVALID_CREDENTIAL_FORMAT'},400);
   const ip=request.headers.get('cf-connecting-ip')??'local';
   await this.rateLimit('ip:'+await sha256(ip),30,600);
   await this.rateLimit('account:'+await sha256(username),10,600);
   if(url.pathname.endsWith('/register')){
    const displayName=String(body.displayName??'').trim();if(!displayName || displayName.length>80)return json({error:'INVALID_DISPLAY_NAME'},400);
    const salt=randomBytes(16).toString('hex'),hash=hex(await passwordKey(password,salt));
    const account:Account={id:'user_'+crypto.randomUUID(),username,displayName,tenantId:'tenant_'+crypto.randomUUID(),locale:body.locale==='en'?'en':'fr',createdAt:new Date().toISOString()};
    try{await this.db.prepare('INSERT INTO auth_accounts(id,username,display_name,tenant_id,locale,created_at,salt,password_hash) VALUES(?,?,?,?,?,?,?,?)')
      .bind(account.id,username,displayName,account.tenantId,account.locale,account.createdAt,salt,hash).run();}
    catch(error){if(/unique|constraint/i.test(String(error)))return json({error:'ACCOUNT_UNAVAILABLE'},409);throw error;}
    return this.issue(account,url);
   }
   const found=await this.db.prepare('SELECT * FROM auth_accounts WHERE username=?').bind(username).first<AccountRow>();
   const candidate=await passwordKey(password,found?.salt??'ec000000000000000000000000000000');
   const expected=found?bytes(found.password_hash):new Uint8Array(64);
   if(!found || !timingSafeEqual(candidate,expected))return json({error:'INVALID_CREDENTIALS'},401);
   return this.issue(project(found),url);
  }catch(error){
   if(error instanceof SyntaxError)return json({error:'INVALID_JSON'},400);
   if(error instanceof Error && error.message==='RATE_LIMITED')return json({error:'RATE_LIMITED'},429,{'retry-after':'600'});
   return json({error:'AUTH_SERVICE_UNAVAILABLE'},503);
  }
 }
}
