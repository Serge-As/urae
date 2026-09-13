import { SessionService } from '../../../packages/auth/src/index.js';
import type { D1DatabaseLike, PlatformRepository } from '../../../packages/repositories/src/index.js';
import type { Group } from '../../../packages/contracts/src/index.js';

const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
const publicPaths=new Set(['/health','/api/v1/product/capabilities','/api/v1/discovery/groups','/api/v1/kernel']);
const managementRoles=new Set(['founder','manager','admin','president','treasurer']);

export function authenticatedApi(repo:PlatformRepository,db:D1DatabaseLike,handle:(request:Request)=>Promise<Response>){
 const sessions=new SessionService(db);
 return async (request:Request):Promise<Response>=>{
  const url=new URL(request.url);
  if(request.method==='GET' && publicPaths.has(url.pathname))return handle(request);
  try{
   if(!['GET','HEAD','OPTIONS'].includes(request.method)){
    if(request.headers.get('origin')!==url.origin)return response({error:'ORIGIN_NOT_ALLOWED'},403);
    if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return response({error:'JSON_REQUIRED'},415);
    if(Number(request.headers.get('content-length')??0)>131072)return response({error:'REQUEST_TOO_LARGE'},413);
    const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
    if(reader){while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>131072){await reader.cancel();return response({error:'REQUEST_TOO_LARGE'},413);}chunks.push(next.value);}}
    const data=new Uint8Array(size);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}
    request=new Request(url,{method:request.method,headers:request.headers,body:data});
   }
   if(url.pathname.startsWith('/api/v1/auth/'))return sessions.handle(request);
   const account=await sessions.current(request);if(!account)return response({error:'AUTHENTICATION_REQUIRED'},401);
   await repo.saveUser({id:account.id,displayName:account.displayName,locale:account.locale,createdAt:account.createdAt});
   const memberships=(await repo.listMembershipsForUser(account.id)).filter(m=>m.status==='active');
   const ownGroups=(await repo.listGroups(account.tenantId)).filter(g=>g.createdBy===account.id);
   const allowedGroups=new Map<string,Group>(ownGroups.map(g=>[g.id,g]));
   for(const m of memberships){const group=await repo.getGroupById(m.groupId);if(group && group.tenantId===m.tenantId)allowedGroups.set(group.id,group);}
   if(request.method==='GET' && url.pathname==='/api/v1/groups')return response([...allowedGroups.values()].map(g=>({...g,viewerRoles:g.createdBy===account.id?['founder','manager']:memberships.find(m=>m.groupId===g.id)?.roles??[]})));
   const routeGroup=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)/)?.[1];
   const requestedGroup=routeGroup ?? url.searchParams.get('groupId') ?? request.headers.get('x-active-group-id') ?? '';
   const group=requestedGroup?allowedGroups.get(requestedGroup):undefined;
   if(requestedGroup && !group)return response({error:'FORBIDDEN_SCOPE'},403);
   const membership=group?memberships.find(m=>m.groupId===group.id):undefined;
   const roles=group?.createdBy===account.id?['founder','manager']:membership?.roles??[];
   // Read-only members can view their own statement, but no full group financial
   // data or shared administrative dossiers until a finer read policy is defined.
   const memberStatement=/^\/api\/v1\/groups\/[^/]+\/members\/[^/]+\/statement$/.test(url.pathname);
   const sensitive=/\/(?:ledger|cashbox|applications|operating-policy)(?:\/|$)/.test(url.pathname)||url.pathname==='/api/v1/workspaces';
   if(group && sensitive && !memberStatement && !roles.some(r=>managementRoles.has(r)))return response({error:'FORBIDDEN_SCOPE'},403);
   const headers=new Headers(request.headers);
   for(const name of ['x-tenant-id','x-actor-id','x-group-roles','x-session-id','x-request-id'])headers.delete(name);
   headers.set('x-tenant-id',group?.tenantId??account.tenantId);headers.set('x-actor-id',account.id);
   headers.set('x-group-roles',roles.join(','));headers.set('x-active-group-id',group?.id??'');
   headers.set('x-session-id','server-authenticated');headers.set('x-request-id',crypto.randomUUID());
   if(request.method==='POST' && url.pathname==='/api/v1/bootstrap'){
    return response({ok:true,actorId:account.id,tenantId:group?.tenantId??account.tenantId,displayName:account.displayName});
   }
   const rewritten=new Request(request,{headers});
   return handle(rewritten);
  }catch{return response({error:'SERVICE_UNAVAILABLE'},503);}
 };
}
