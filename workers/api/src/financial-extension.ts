import {PlatformKernel} from '../../../packages/platform-kernel/src/index.js';
import {LedgerService} from '../../../packages/domain/src/index.js';
import {ExpenseService,type ExpenseScope} from '../../../packages/expenses/src/index.js';
import {MemberProfileService} from '../../../packages/member-profile/src/index.js';
import {GroupDocumentService} from '../../../packages/group-documents/src/index.js';
import {makeId} from '../../../packages/contracts/src/index.js';
import type {PlatformRepository} from '../../../packages/repositories/src/index.js';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const errorStatus=(code:string)=>code==='FORBIDDEN_SCOPE'?403:code==='MEMBER_PROFILE_VERSION_CONFLICT'?409:code.endsWith('_NOT_FOUND')?404:400;
const kernelFor=(request:Request,groupId:string)=>{const tenantId=request.headers.get('x-tenant-id')??'',actorId=request.headers.get('x-actor-id')??'';if(!tenantId||!actorId)return undefined;const kernel=new PlatformKernel();kernel.context.set({actorId,tenantId,activeGroupId:groupId,groupRoles:(request.headers.get('x-group-roles')??'').split(',').map(x=>x.trim()).filter(Boolean),mandateIds:[],deviceId:request.headers.get('x-device-id')??'web',sessionId:request.headers.get('x-session-id')??'server-authenticated',locale:request.headers.get('accept-language')?.toLowerCase().startsWith('en')?'en':'fr',timezone:request.headers.get('x-timezone')??'Africa/Douala',connectivity:'online',requestId:request.headers.get('x-request-id')??makeId('req')});return kernel;};

export async function maybeHandleFinancialExtension(repo:PlatformRepository,request:Request):Promise<Response|undefined>{
  const url=new URL(request.url),expenseRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/expenses$/),profileRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/profile$/),documentsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/documents$/),documentRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/documents\/([^/]+)$/);if(!expenseRoute&&!profileRoute&&!documentsRoute&&!documentRoute)return undefined;
  const groupId=(expenseRoute?.[1]??profileRoute?.[1]??documentsRoute?.[1]??documentRoute?.[1])!,kernel=kernelFor(request,groupId);if(!kernel)return json({error:'AUTHENTICATION_REQUIRED'},401);
  try{
    if(profileRoute){
      const membershipId=profileRoute[2]!,service=new MemberProfileService(repo,kernel);
      if(request.method==='GET')return json((await service.get(groupId,membershipId))??{membershipId,groupId,profileVersion:0},200);
      if(request.method==='PUT')return json(await service.save(groupId,membershipId,await request.json() as any),200);
      return json({error:'METHOD_NOT_ALLOWED'},405);
    }
    if(documentsRoute||documentRoute){
      const service=new GroupDocumentService(repo,kernel);
      if(documentsRoute&&request.method==='GET')return json(await service.list(groupId),200);
      if(documentsRoute&&request.method==='POST')return json(await service.create(groupId,await request.json() as any),201);
      if(documentRoute&&request.method==='PUT'){const body=await request.json() as Record<string,unknown>;if(String(body.action??'')!=='archive')throw Error('INVALID_DOCUMENT_ACTION');return json(await service.archive(groupId,documentRoute[2]!),200);}
      return json({error:'METHOD_NOT_ALLOWED'},405);
    }
    const service=new ExpenseService(repo,kernel,new LedgerService(repo,kernel));
    if(request.method==='GET'){
      const scope=url.searchParams.get('scope') as ExpenseScope|null;
      const rows=await service.list(groupId,{meetingId:url.searchParams.get('meetingId')??undefined,membershipId:url.searchParams.get('membershipId')??undefined,rubricId:url.searchParams.get('rubricId')??undefined,scope:scope??undefined});
      return json(rows);
    }
    if(request.method==='POST'){
      const body=await request.json() as Record<string,unknown>;
      const result=await service.create(groupId,{amount:Number(body.amount),label:String(body.label??''),scope:String(body.scope??'BACKOFFICE') as ExpenseScope,meetingId:body.meetingId?String(body.meetingId):undefined,membershipId:body.membershipId?String(body.membershipId):undefined,rubricId:body.rubricId?String(body.rubricId):undefined,note:body.note?String(body.note):undefined,idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('expense'))});
      return json(result,201);
    }
    return json({error:'METHOD_NOT_ALLOWED'},405);
  }catch(error){const code=error instanceof Error?error.message:String(error);return json({error:code},errorStatus(code));}
}