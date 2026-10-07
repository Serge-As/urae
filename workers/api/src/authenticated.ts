import { SessionService } from '../../../packages/auth/src/index.js';
import type { D1DatabaseLike, PlatformRepository } from '../../../packages/repositories/src/index.js';
import type { Group } from '../../../packages/contracts/src/index.js';
import {maybeHandleFinancialExtension} from './financial-extension.js';

const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
const publicPaths=new Set(['/health','/api/v1/product/capabilities','/api/v1/discovery/groups','/api/v1/kernel']);
const managementRoles=new Set(['founder','manager','admin','president','treasurer']);
const multipartPaths=new Set(['/api/v1/assistant/group-launch/analyze-files']);
const JSON_BODY_LIMIT=128*1024;
const MULTIPART_BODY_LIMIT=26*1024*1024;
// Warm-isolate optimization only for profile mirrors. NEVER cache group
// membership, session, financial authorization, ledger or account privileges.
const recentlyMirroredUsers=new Map<string,{fingerprint:string,expiresAt:number}>();
const mirrorSessionUser=async(repo:PlatformRepository,account:{id:string;tenantId:string;displayName:string;locale:string;createdAt:string})=>{
 const fingerprint=[account.tenantId,account.displayName,account.locale,account.createdAt].join('|'),cached=recentlyMirroredUsers.get(account.id);
 if(cached?.fingerprint===fingerprint&&cached.expiresAt>Date.now())return;
 const current=await repo.getUser(account.id);
 if(!current||current.displayName!==account.displayName||current.locale!==account.locale){
  await repo.saveUser({id:account.id,displayName:account.displayName,locale:account.locale,createdAt:current?.createdAt??account.createdAt});
 }
 if(recentlyMirroredUsers.size>=512)recentlyMirroredUsers.delete(recentlyMirroredUsers.keys().next().value!);
 recentlyMirroredUsers.set(account.id,{fingerprint,expiresAt:Date.now()+5*60_000});
};

const b64url=(bytes:Uint8Array)=>{let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const b64urlText=(text:string)=>b64url(new TextEncoder().encode(text));
const b64urlDecodeText=(value:string)=>{const normalized=value.replace(/-/g,'+').replace(/_/g,'/');const binary=atob(normalized+'='.repeat((4-normalized.length%4)%4));return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));};
const signLiveValue=async(value:string,secret:string)=>{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))));};
type LiveTicket={v:1;actorId:string;tenantId:string;groupId:string;roles:string[];exp:number;kind?:'ECO_FINANCIAL_CLOCK_V1';deviceId?:string;anchorAtMs?:number;};
const issueLiveTicket=async(payload:LiveTicket,secret:string)=>{const body=b64urlText(JSON.stringify(payload));return body+'.'+await signLiveValue(body,secret);};
const verifyLiveTicket=async(token:string,secret:string):Promise<LiveTicket|undefined>=>{
 const [body,signature,extra]=token.split('.');if(!body||!signature||extra)return undefined;
 const expected=await signLiveValue(body,secret);if(expected.length!==signature.length)return undefined;
 let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=expected.charCodeAt(i)^signature.charCodeAt(i);if(mismatch)return undefined;
 try{const payload=JSON.parse(b64urlDecodeText(body)) as LiveTicket;if(payload.v!==1||!payload.actorId||!payload.tenantId||!payload.groupId||!Array.isArray(payload.roles)||payload.exp<=Math.floor(Date.now()/1000))return undefined;return payload;}catch{return undefined;}
};

export function authenticatedApi(repo:PlatformRepository,db:D1DatabaseLike,handle:(request:Request)=>Promise<Response>,liveTicketSecret?:string){
 const sessions=new SessionService(db);
 return async (request:Request):Promise<Response>=>{
  const url=new URL(request.url);
  if(request.method==='GET' && publicPaths.has(url.pathname))return handle(request);
  const liveConnect=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/live\/connect$/);
  if(request.method==='GET'&&liveConnect&&liveTicketSecret){
   const token=url.searchParams.get('ticket')??'',ticket=token?await verifyLiveTicket(token,liveTicketSecret):undefined;
   if(ticket&&!ticket.kind&&ticket.groupId===liveConnect[1]){
    const headers=new Headers(request.headers);
    for(const name of ['x-tenant-id','x-actor-id','x-group-roles','x-session-id','x-request-id'])headers.delete(name);
    headers.set('x-tenant-id',ticket.tenantId);headers.set('x-actor-id',ticket.actorId);headers.set('x-group-roles',ticket.roles.join(','));
    headers.set('x-active-group-id',ticket.groupId);headers.set('x-session-id','live-ticket');headers.set('x-request-id',crypto.randomUUID());headers.set('x-live-ticket-authenticated','1');
    return handle(new Request(request,{headers}));
   }
  }
  try{
   if(!['GET','HEAD','OPTIONS'].includes(request.method)){
    if(request.headers.get('origin')!==url.origin)return response({error:'ORIGIN_NOT_ALLOWED'},403);
    const contentType=(request.headers.get('content-type')??'').toLowerCase();
    const multipartAllowed=multipartPaths.has(url.pathname)&&contentType.startsWith('multipart/form-data;');
    const jsonAllowed=contentType.startsWith('application/json');
    if(!jsonAllowed&&!multipartAllowed)return response({error:'JSON_REQUIRED'},415);
    const bodyLimit=multipartAllowed?MULTIPART_BODY_LIMIT:JSON_BODY_LIMIT;
    if(Number(request.headers.get('content-length')??0)>bodyLimit)return response({error:'REQUEST_TOO_LARGE'},413);
    const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
    if(reader){while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>bodyLimit){await reader.cancel();return response({error:'REQUEST_TOO_LARGE'},413);}chunks.push(next.value);}}
    const data=new Uint8Array(size);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}
    request=new Request(url,{method:request.method,headers:request.headers,body:data});
   }
   if(url.pathname.startsWith('/api/v1/auth/'))return sessions.handle(request);
   const account=await sessions.current(request);if(!account)return response({error:'AUTHENTICATION_REQUIRED'},401);
   await mirrorSessionUser(repo,account);
   const memberships=(await repo.listMembershipsForUser(account.id)).filter(m=>m.status==='active');
   const ownGroups=(await repo.listGroups(account.tenantId)).filter(g=>g.createdBy===account.id);
   const allowedGroups=new Map<string,Group>(ownGroups.map(g=>[g.id,g]));
   for(const m of memberships){const group=await repo.getGroupById(m.groupId);if(group && group.tenantId===m.tenantId)allowedGroups.set(group.id,group);}
   if(request.method==='GET' && url.pathname==='/api/v1/groups')return response([...allowedGroups.values()].map(g=>({...g,viewerRoles:g.createdBy===account.id?['founder','manager']:memberships.find(m=>m.groupId===g.id)?.roles??[]})));
   const liveTicketRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/live\/ticket$/);
   if(request.method==='GET'&&liveTicketRoute){
    const group=allowedGroups.get(liveTicketRoute[1]!);if(!group)return response({error:'FORBIDDEN_SCOPE'},403);if(!liveTicketSecret)return response({error:'LIVE_TICKET_UNAVAILABLE'},503);
    const membership=memberships.find(m=>m.groupId===group.id),roles=group.createdBy===account.id?['founder','manager']:membership?.roles??[],now=Math.floor(Date.now()/1000),exp=now+60*60;
    const ticket=await issueLiveTicket({v:1,actorId:account.id,tenantId:group.tenantId,groupId:group.id,roles,exp},liveTicketSecret);
    return response({ticket,expiresAt:new Date(exp*1000).toISOString(),groupId:group.id},200);
   }
   const clockAnchorRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-clock-anchor$/);
   if(clockAnchorRoute&&request.method==='GET'){
     const group=allowedGroups.get(clockAnchorRoute[1]!);
     if(!group)return response({error:'FORBIDDEN_SCOPE'},403);
     const membership=memberships.find(m=>m.groupId===group.id);
     if(group.createdBy!==account.id&&!membership?.roles.some(r=>managementRoles.has(r)))return response({error:'FORBIDDEN_SCOPE'},403);
     if(!liveTicketSecret)return response({error:'SIGNED_CLOCK_UNAVAILABLE'},503);
     const deviceId=String(url.searchParams.get('deviceId')??'').trim();
     if(!deviceId||deviceId.length>128)return response({error:'CLOCK_DEVICE_ID_REQUIRED'},400);
     const issuedAt=Date.now(),expiry=issuedAt+7*86400000;
     const ticket=await issueLiveTicket({v:1,kind:'ECO_FINANCIAL_CLOCK_V1',actorId:account.id,
       tenantId:group.tenantId,groupId:group.id,roles:['CLOCK_ONLY'],deviceId,
       anchorAtMs:issuedAt,exp:Math.floor(expiry/1000)},liveTicketSecret);
     return response({token:ticket,anchorAtMs:issuedAt,expiresAt:new Date(expiry).toISOString(),deviceId});
   }
   const routeGroup=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)/)?.[1];
   const requestedGroup=routeGroup ?? url.searchParams.get('groupId') ?? request.headers.get('x-active-group-id') ?? '';
   const group=requestedGroup?allowedGroups.get(requestedGroup):undefined;
   if(requestedGroup && !group)return response({error:'FORBIDDEN_SCOPE'},403);
   const membership=group?memberships.find(m=>m.groupId===group.id):undefined;
   const roles=group?.createdBy===account.id?['founder','manager']:membership?.roles??[];
   // Read-only members can view their own statement, but no full group financial
   // data or shared administrative dossiers until a finer read policy is defined.
   const memberStatement=/^\/api\/v1\/groups\/[^/]+\/members\/[^/]+\/statement$/.test(url.pathname);
   const sensitive=/\/(?:ledger|cashbox|applications|operating-policy|expenses)(?:\/|$)/.test(url.pathname)||url.pathname==='/api/v1/workspaces';
   if(group && sensitive && !memberStatement && !roles.some(r=>managementRoles.has(r)))return response({error:'FORBIDDEN_SCOPE'},403);
   const headers=new Headers(request.headers);
   for(const name of ['x-tenant-id','x-actor-id','x-group-roles','x-session-id','x-request-id','x-eco-recorded-at-ms','x-eco-clock-quality'])headers.delete(name);
   // Only authenticated scope may annotate V2 financial clock quality.
   // A client supplied numeric timestamp or pre-auth header is never trusted.
   if(request.method==='POST'&&liveTicketSecret&&
      (url.pathname==='/api/v1/outbox/apply'||/\/financial-cells$/.test(url.pathname))){
     const body=await request.clone().json().catch(()=>null) as any;
     const p=body?.type==='FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'?body.payload:
       body?.intentV2&&typeof body.intentV2==='object'?body.intentV2:null;
     if(p){
       const token=String(p.clockAnchorId??'');
       const ticket=token?await verifyLiveTicket(token,liveTicketSecret):undefined;
       const elapsed=Number(p.elapsedSinceAnchorMs),arrival=Date.now();
       const valid=Boolean(ticket&&ticket.kind==='ECO_FINANCIAL_CLOCK_V1'&&
         ticket.actorId===account.id&&ticket.tenantId===(group?.tenantId??account.tenantId)&&
         ticket.groupId===group?.id&&ticket.deviceId===String(p.deviceId??'')&&
         Number.isSafeInteger(ticket.anchorAtMs)&&Number.isFinite(elapsed)&&elapsed>=0&&
         elapsed<=7*86400000&&arrival>=ticket.anchorAtMs!&&
         elapsed<=arrival-ticket.anchorAtMs!+15000);
       if(valid){
         const normalizedMs=Math.round(ticket!.anchorAtMs!+elapsed);
         headers.set('x-eco-recorded-at-ms',String(normalizedMs));
         headers.set('x-eco-clock-quality','VERIFIED');
       }else headers.set('x-eco-clock-quality','UNVERIFIABLE');
     }
   }
   headers.set('x-tenant-id',group?.tenantId??account.tenantId);headers.set('x-actor-id',account.id);
   headers.set('x-group-roles',roles.join(','));headers.set('x-active-group-id',group?.id??'');
   headers.set('x-session-id','server-authenticated');headers.set('x-request-id',crypto.randomUUID());
   if(request.method==='POST' && url.pathname==='/api/v1/bootstrap'){
    return response({ok:true,actorId:account.id,tenantId:group?.tenantId??account.tenantId,displayName:account.displayName});
   }
   const rewritten=new Request(request,{headers});
   const extension=await maybeHandleFinancialExtension(repo,rewritten);if(extension)return extension;
   return handle(rewritten);
  }catch{return response({error:'SERVICE_UNAVAILABLE'},503);}
 };
}
