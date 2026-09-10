import { PlatformKernel } from '../../../packages/platform-kernel/src/index.js';
import { D1PlatformRepository, InMemoryPlatformRepository, type D1DatabaseLike, type PlatformRepository } from '../../../packages/repositories/src/index.js';
import { FoundationService, LedgerService, MeetingService, starterGroupOperatingPolicy } from '../../../packages/domain/src/index.js';
import { DiscoveryService, MembershipGatewayService } from '../../../packages/discovery/src/index.js';
import { RubricKnowledgeService } from '../../../packages/rubrics/src/index.js';
import { makeId, type OutboxItem, type GroupOperatingPolicy, type ProjectCapability, type RubricOperatingModel } from '../../../packages/contracts/src/index.js';

const defaultRepo = new InMemoryPlatformRepository();

const baseSecurityHeaders: HeadersInit = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cache-control': 'no-store'
};

const corsHeaders = (request: Request): HeadersInit => {
  const origin = request.headers.get('origin');
  if (!origin) return { vary:'origin' };
  try {
    const requestOrigin = new URL(request.url).origin;
    if (origin === requestOrigin) return { 'access-control-allow-origin':origin, vary:'origin' };
  } catch { /* handled by route parser */ }
  return { vary:'origin' };
};

const json = (data: unknown, status = 200, headers: HeadersInit = {}): Response => new Response(JSON.stringify(data, null, 2), {
  status, headers: { 'content-type':'application/json; charset=utf-8', ...baseSecurityHeaders, ...headers }
});

const readJson = async <T>(request: Request): Promise<T> => { try { return await request.json() as T; } catch { throw new Error('INVALID_JSON'); } };
const strArray=(value:unknown):string[]=>Array.isArray(value)?value.map(String).map(x=>x.trim()).filter(Boolean):typeof value==='string'?value.split(',').map(x=>x.trim()).filter(Boolean):[];
const finite = (value: unknown, fallback?: number): number => {
  if ((value === undefined || value === null || value === '') && fallback !== undefined) return fallback;
  const n=Number(value); if(!Number.isFinite(n)) throw new Error('INVALID_NUMBER'); return n;
};

const createRequestScope = (request:Request,repo:PlatformRepository) => {
  const kernel=new PlatformKernel();
  const foundation=new FoundationService(repo,kernel); const ledger=new LedgerService(repo,kernel); const meetings=new MeetingService(repo,kernel); const discovery=new DiscoveryService(repo,kernel); const membershipGateway=new MembershipGatewayService(repo,kernel); const rubrics=new RubricKnowledgeService(repo,kernel);
  const tenantId=request.headers.get('x-tenant-id')??'tenant_demo'; const actorId=request.headers.get('x-actor-id')??'user_founder';
  const groupRoles=(request.headers.get('x-group-roles')??'founder,manager').split(',').map(x=>x.trim()).filter(Boolean);
  kernel.context.set({actorId,tenantId,activeGroupId:request.headers.get('x-active-group-id')??undefined,groupRoles,mandateIds:[],deviceId:request.headers.get('x-device-id')??'device_web_demo',sessionId:request.headers.get('x-session-id')??'session_demo',locale:request.headers.get('accept-language')?.toLowerCase().startsWith('en')?'en':'fr',timezone:request.headers.get('x-timezone')??'Africa/Douala',connectivity:'online',requestId:request.headers.get('x-request-id')??makeId('req')});
  return {kernel,foundation,ledger,meetings,discovery,membershipGateway,rubrics};
};

const inboxFor = async (repo:PlatformRepository,tenantId:string,actorId:string) => {
  const obligations=(await repo.listObligations(tenantId,actorId)).filter(x=>x.status==='open'||x.status==='overdue').map(x=>({id:x.id,kind:'obligation',title:x.title,priority:x.priority,status:x.status,groupId:x.groupId}));
  const cases=(await repo.listCases(tenantId,actorId)).filter(x=>x.status!=='CLOSED').map(x=>({id:x.id,kind:'case',title:x.summary,priority:'normal',status:x.status,groupId:x.groupId}));
  return [...obligations,...cases];
};

export const createApiHandler = (repo:PlatformRepository = defaultRepo) => async (request:Request):Promise<Response> => {
  const url=new URL(request.url); const cors=corsHeaders(request);
  if(request.method==='OPTIONS'){
    const allowed=Boolean((cors as Record<string,string>)['access-control-allow-origin']);
    return new Response(null,{status:allowed?204:403,headers:{...baseSecurityHeaders,...cors,'access-control-allow-methods':'GET,POST,PUT,OPTIONS','access-control-allow-headers':'content-type,x-tenant-id,x-actor-id,x-group-roles,x-active-group-id,x-device-id,x-session-id,x-request-id,x-timezone'}});
  }
  const {kernel,foundation,ledger,meetings,discovery,membershipGateway,rubrics}=createRequestScope(request,repo); const ctx=kernel.context.get();
  try {
    if(request.method==='GET'&&url.pathname==='/health') return json({ok:true,service:'tontine-api',version:'0.6.0-mobile-living-rules',now:new Date().toISOString(),realMoneyEnabled:kernel.features.enabled('financial-real-money'),manualCashLedgerEnabled:true,contextScope:'request'},200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/kernel') return json({services:['context','policy','workflow','events','audit','obligations','evidence','reconciliation','cases','inbox','notifications','configuration','features','data-governance','compatibility','resource-governor'],features:{groupLaunch:kernel.features.enabled('group-launch-studio'),meetingSync:kernel.features.enabled('meeting-sync-core'),realMoney:kernel.features.enabled('financial-real-money'),manualCashLedger:true}},200,cors);

    if(request.method==='POST'&&url.pathname==='/api/v1/bootstrap'){
      const body=await readJson<Record<string,unknown>>(request); await foundation.ensureUser({id:ctx.actorId,displayName:String(body.displayName??'Local Manager').trim()||'Local Manager',locale:String(body.locale??ctx.locale),createdAt:new Date().toISOString()});
      return json({ok:true,actorId:ctx.actorId,tenantId:ctx.tenantId},200,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/universe'){
      const groups=await repo.listGroups(ctx.tenantId); const inbox=await inboxFor(repo,ctx.tenantId,ctx.actorId); const audit=await repo.listAudit(ctx.tenantId);
      return json({groups:groups.length,inbox:inbox.length,audit:audit.length},200,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/inbox') return json(await inboxFor(repo,ctx.tenantId,ctx.actorId),200,cors);

    if(request.method==='POST'&&url.pathname==='/api/v1/group-projects'){
      const body=await readJson<Record<string,unknown>>(request);
      const project=await foundation.createProject({tenantId:ctx.tenantId,createdBy:ctx.actorId,name:String(body.name??''),kind:(body.kind??'rotating_tontine') as any,governanceModel:(body.governanceModel??'founder_managed') as any,memberCount:finite(body.memberCount),sessions:finite(body.sessions),nominalContribution:{currency:String(body.currency??'XAF'),amount:finite(body.nominalContribution)},managementFeePerContribution:{currency:String(body.currency??'XAF'),amount:finite(body.managementFeePerContribution,0)},estimatedExternalCostRate:finite(body.estimatedExternalCostRate,0),fixedOperatingCostPerSession:{currency:String(body.currency??'XAF'),amount:finite(body.fixedOperatingCostPerSession,0)}});
      return json(project,201,cors);
    }
    const projectGrant=url.pathname.match(/^\/api\/v1\/group-projects\/([^/]+)\/access-grants$/);
    if(request.method==='POST'&&projectGrant){const body=await readJson<Record<string,unknown>>(request);return json(await foundation.grantProjectAccess(ctx.tenantId,projectGrant[1]!,String(body.userId??''),strArray(body.capabilities) as ProjectCapability[]),200,cors);}
    const sim=url.pathname.match(/^\/api\/v1\/group-projects\/([^/]+)\/simulate$/); if(request.method==='POST'&&sim) return json(await foundation.simulateProject(ctx.tenantId,sim[1]!),200,cors);
    const convert=url.pathname.match(/^\/api\/v1\/group-projects\/([^/]+)\/convert$/); if(request.method==='POST'&&convert) return json(await foundation.convertProjectToGroup(ctx.tenantId,convert[1]!),201,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/groups') return json(await repo.listGroups(ctx.tenantId),200,cors);
    const groupPolicyRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/operating-policy$/);
    if(groupPolicyRoute&&request.method==='GET'){const group=await repo.getGroup(ctx.tenantId,groupPolicyRoute[1]!);if(!group)return json({error:'NOT_FOUND'},404,cors);return json(group.operatingPolicy??starterGroupOperatingPolicy(),200,cors);}
    if(groupPolicyRoute&&request.method==='PUT'){const body=await readJson<GroupOperatingPolicy>(request);return json(await foundation.updateGroupOperatingPolicy(ctx.tenantId,groupPolicyRoute[1]!,body),200,cors);}


    if(request.method==='GET'&&url.pathname==='/api/v1/discovery/groups'){
      const max=url.searchParams.get('maxContribution'); const currency=url.searchParams.get('currency')??'XAF';
      return json(await discovery.search({text:url.searchParams.get('q')??undefined,locality:url.searchParams.get('locality')??undefined,missionTags:strArray(url.searchParams.get('missionTags')),activityTags:strArray(url.searchParams.get('activityTags')),family:(url.searchParams.get('family')??undefined) as any,meetingMode:(url.searchParams.get('meetingMode')??undefined) as any,maxContribution:max?{currency,amount:finite(max)}:undefined,recruitingOnly:url.searchParams.get('recruitingOnly')==='true'}),200,cors);
    }
    const discoveryPublish=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/discovery$/);
    if(discoveryPublish&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); const band=body.contributionBand&&typeof body.contributionBand==='object'?body.contributionBand as Record<string,unknown>:undefined;
      return json(await discovery.publishGroupListing({tenantId:ctx.tenantId,groupId:discoveryPublish[1]!,visibility:String(body.visibility??'PUBLIC') as any,discoverable:Boolean(body.discoverable??true),joinPolicy:String(body.joinPolicy??'REQUEST') as any,recruiting:Boolean(body.recruiting??false),locality:body.locality?String(body.locality):undefined,missionTags:strArray(body.missionTags),activityTags:strArray(body.activityTags),meetingMode:body.meetingMode?String(body.meetingMode) as any:undefined,contributionBand:band?{currency:String(band.currency??'XAF'),min:band.min===undefined?undefined:finite(band.min),max:band.max===undefined?undefined:finite(band.max),cadence:band.cadence?String(band.cadence):undefined}:undefined,publicManagerAlias:body.publicManagerAlias?String(body.publicManagerAlias):undefined}),200,cors);
    }
    const applicationCreate=url.pathname.match(/^\/api\/v1\/discovery\/groups\/([^/]+)\/applications$/);
    if(applicationCreate&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); const band=body.requestedCommitmentBand&&typeof body.requestedCommitmentBand==='object'?body.requestedCommitmentBand as Record<string,unknown>:undefined;
      return json(await membershipGateway.requestToJoin({groupId:applicationCreate[1]!,message:body.message?String(body.message):undefined,requestedCommitmentBand:band?{currency:String(band.currency??'XAF'),min:band.min===undefined?undefined:finite(band.min),max:band.max===undefined?undefined:finite(band.max),cadence:band.cadence?String(band.cadence):undefined}:undefined}),201,cors);
    }
    const applicationList=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/applications$/);
    if(applicationList&&request.method==='GET') return json(await membershipGateway.listForGroup(ctx.tenantId,applicationList[1]!),200,cors);
    const applicationDecision=url.pathname.match(/^\/api\/v1\/membership-applications\/([^/]+)\/decision$/);
    if(applicationDecision&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); const decision=String(body.decision??'');
      if(decision!=='APPROVE'&&decision!=='REJECT') throw new Error('INVALID_MEMBERSHIP_DECISION');
      return json(await membershipGateway.decide(applicationDecision[1]!,decision,body.reason?String(body.reason):undefined),200,cors);
    }

    const rubricRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubrics$/);
    if(rubricRoute&&request.method==='GET') return json(await rubrics.listRubrics(ctx.tenantId,rubricRoute[1]!),200,cors);
    if(rubricRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); if(!body.facets||typeof body.facets!=='object') throw new Error('RUBRIC_FACETS_REQUIRED');
      const operatingModel=body.operatingModel&&typeof body.operatingModel==='object'?body.operatingModel as RubricOperatingModel:undefined;
      return json(await rubrics.createRubric({tenantId:ctx.tenantId,groupId:rubricRoute[1]!,name:String(body.name??''),aliases:strArray(body.aliases),purpose:body.purpose?String(body.purpose):undefined,facets:body.facets as any,source:body.source?String(body.source) as any:undefined,operatingModel}),201,cors);
    }
    const rubricModelRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubrics\/([^/]+)\/operating-model$/);
    if(rubricModelRoute&&request.method==='PUT'){
      const body=await readJson<RubricOperatingModel>(request);return json(await rubrics.updateOperatingModel({tenantId:ctx.tenantId,groupId:rubricModelRoute[1]!,rubricId:rubricModelRoute[2]!,model:body}),200,cors);
    }
    const rubricPreviewRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubrics\/([^/]+)\/preview-cycle$/);
    if(rubricPreviewRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);return json(await rubrics.previewCycle({tenantId:ctx.tenantId,groupId:rubricPreviewRoute[1]!,rubricId:rubricPreviewRoute[2]!,memberCount:finite(body.memberCount),collectedFromMembers:finite(body.collectedFromMembers),solidarityCoverageAmount:body.solidarityCoverageAmount===undefined?undefined:finite(body.solidarityCoverageAmount),beneficiaryDisbursement:body.beneficiaryDisbursement===undefined?undefined:finite(body.beneficiaryDisbursement)}),200,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/governance/claims/suggest'){
      const body=await readJson<Record<string,unknown>>(request); return json({suggestions:rubrics.suggestClaimsFromGovernanceText(String(body.text??'')),automaticActivation:false},200,cors);
    }

    const members=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members$/);
    if(members&&request.method==='GET'){
      const group=await repo.getGroup(ctx.tenantId,members[1]!); if(!group) return json({error:'NOT_FOUND'},404,cors);
      const list=await repo.listMemberships(ctx.tenantId,group.id); const joined=[];
      for(const m of list){const user=await repo.getUser(m.userId);joined.push({...m,displayName:user?.displayName??m.userId});}
      return json(joined,200,cors);
    }
    if(members&&request.method==='POST'){
      const group=await repo.getGroup(ctx.tenantId,members[1]!); if(!group) return json({error:'NOT_FOUND'},404,cors);
      const body=await readJson<Record<string,unknown>>(request); const displayName=String(body.displayName??'').trim(); if(!displayName) throw new Error('MEMBER_NAME_REQUIRED');
      const membership=await foundation.addMember(ctx.tenantId,group.id,{id:String(body.userId??makeId('user')),displayName,locale:String(body.locale??ctx.locale),createdAt:new Date().toISOString()}); return json(membership,201,cors);
    }

    const meetingRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings$/);
    if(meetingRoute&&request.method==='GET') return json(await repo.listMeetings(ctx.tenantId,meetingRoute[1]!),200,cors);
    if(meetingRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); return json(await meetings.openMeeting(ctx.tenantId,meetingRoute[1]!,{title:String(body.title??''),scheduledAt:body.scheduledAt?String(body.scheduledAt):undefined}),201,cors);
    }
    const closeMeeting=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/close$/); if(closeMeeting&&request.method==='POST') return json(await meetings.closeMeeting(ctx.tenantId,closeMeeting[1]!,closeMeeting[2]!),200,cors);

    const contributionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/contributions\/cash$/);
    if(contributionRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      const receipt=await ledger.recordCashContribution({tenantId:ctx.tenantId,groupId:contributionRoute[1]!,membershipId:String(body.membershipId??''),amount:finite(body.amount),currency:String(body.currency??'XAF'),meetingId:body.meetingId?String(body.meetingId):undefined,rubricId:body.rubricId?String(body.rubricId):undefined,lateReason:body.lateReason?String(body.lateReason):undefined,approverIds:strArray(body.approverIds),idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('idem'))});
      return json(receipt,201,cors);
    }

    const ledgerRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger$/);
    if(ledgerRoute&&request.method==='GET') return json({summary:await ledger.summary(ctx.tenantId,ledgerRoute[1]!),entries:await repo.listLedgerEntries(ctx.tenantId,ledgerRoute[1]!),receipts:await repo.listContributionReceipts(ctx.tenantId,ledgerRoute[1]!)},200,cors);
    const reverseRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger\/([^/]+)\/reverse$/);
    if(reverseRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await ledger.reverseEntry({tenantId:ctx.tenantId,groupId:reverseRoute[1]!,entryId:reverseRoute[2]!,reason:String(body.reason??'')}),201,cors);}

    const cashboxRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/cashbox\/reconciliations$/);
    if(cashboxRoute&&request.method==='GET') return json(await repo.listCashboxReconciliations(ctx.tenantId,cashboxRoute[1]!),200,cors);
    if(cashboxRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); return json(await foundation.reconcileCashbox({tenantId:ctx.tenantId,groupId:cashboxRoute[1]!,meetingId:body.meetingId?String(body.meetingId):undefined,openingCash:finite(body.openingCash),cashIn:finite(body.cashIn),cashOut:finite(body.cashOut),countedClosing:finite(body.countedClosing),currency:String(body.currency??'XAF')}),201,cors);
    }

    if(request.method==='POST'&&url.pathname==='/api/v1/cases'){
      const body=await readJson<Record<string,unknown>>(request); return json(await foundation.openSupportCase({tenantId:ctx.tenantId,groupId:body.groupId?String(body.groupId):undefined,openedBy:ctx.actorId,summary:String(body.summary??'')}),201,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/cases') return json(await repo.listCases(ctx.tenantId,ctx.actorId),200,cors);

    if(request.method==='POST'&&url.pathname==='/api/v1/outbox/apply'){
      const item=await readJson<OutboxItem<Record<string,unknown>>>(request); if(item.tenantId!==ctx.tenantId||item.actorId!==ctx.actorId) throw new Error('FORBIDDEN_SCOPE');
      if(item.type==='CONTRIBUTION_CASH_RECORDED'){
        const p=item.payload; const receipt=await ledger.recordCashContribution({tenantId:ctx.tenantId,groupId:String(p.groupId??''),membershipId:String(p.membershipId??''),amount:finite(p.amount),currency:String(p.currency??'XAF'),meetingId:p.meetingId?String(p.meetingId):undefined,rubricId:p.rubricId?String(p.rubricId):undefined,lateReason:p.lateReason?String(p.lateReason):undefined,approverIds:strArray(p.approverIds),idempotencyKey:item.idempotencyKey}); return json({accepted:true,receipt},200,cors);
      }
      if(item.type==='MEETING_NOTE_UPDATED') return json({accepted:true,stored:false,type:item.type},200,cors);
      throw new Error('OUTBOX_TYPE_UNSUPPORTED');
    }

    return json({error:'NOT_FOUND'},404,cors);
  } catch(error){const message=error instanceof Error?error.message:'UNKNOWN_ERROR';const status=message==='FORBIDDEN_SCOPE'?403:message.endsWith('_NOT_FOUND')?404:400;return json({error:message,requestId:ctx.requestId},status,cors);}
};

export const handleRequest=createApiHandler(defaultRepo);
export interface AssetsFetcherLike { fetch(request: Request): Promise<Response> }
export interface WorkerEnv { DB?: D1DatabaseLike; ASSETS?: AssetsFetcherLike }
export default {async fetch(request:Request,env:WorkerEnv={}){
  const url=new URL(request.url);
  if(request.method==='GET' && env.ASSETS && url.pathname!=='/health' && !url.pathname.startsWith('/api/')){
    // In Worker-first assets mode, make the public mobile entry point explicit.
    // `/` must always remain a usable PWA door instead of falling through to JSON 404.
    const assetUrl=new URL(request.url);
    if(assetUrl.pathname==='/') assetUrl.pathname='/index.html';
    const assetRequest=assetUrl.href===request.url?request:new Request(assetUrl.href,request);
    const asset=await env.ASSETS.fetch(assetRequest);
    if(asset.status!==404 || url.pathname==='/' || url.pathname==='/index.html') return asset;
  }
  return createApiHandler(env.DB?new D1PlatformRepository(env.DB):defaultRepo)(request);
}};
export {defaultRepo as repo};
