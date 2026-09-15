import { PlatformKernel } from '../../../packages/platform-kernel/src/index.js';
import { D1PlatformRepository, InMemoryPlatformRepository, type D1DatabaseLike, type PlatformRepository } from '../../../packages/repositories/src/index.js';
import { FoundationService, LedgerService, MeetingService, starterGroupOperatingPolicy } from '../../../packages/domain/src/index.js';
import { DiscoveryService, MembershipGatewayService } from '../../../packages/discovery/src/index.js';
import { RubricKnowledgeService } from '../../../packages/rubrics/src/index.js';
import { makeId, type OutboxItem, type GroupOperatingPolicy, type ProjectCapability, type RubricOperatingModel, type WorkspaceRecord, type WorkspaceStatus } from '../../../packages/contracts/src/index.js';
import { PRODUCT_MODULES, PRODUCT_CAPABILITY_COUNT } from '../../../packages/module-registry/src/index.js';
import {
  CompletionSuiteService, COMPLETION_WORKFLOWS, buildLoanSchedule, applyLoanPayment, compareRules,
  explainLedgerAnomalies, makeIcs, suggestTontineSchedule, type CompletionKind
} from '../../../packages/completion/src/index.js';
import { ExplainabilityService, DocumentSearchService, previewCsv, buildNotificationDigest } from '../../../packages/innovation/src/index.js';
import { ReceivablesService, TreasuryService, RiskFinanceService } from '../../../packages/finance/src/index.js';
import { analyzeGovernanceText, governanceFingerprint, interpretLaunchPrompt } from '../../../packages/guided-assistant/src/index.js';
import { MemberFinancialControlService } from '../../../packages/member-control/src/index.js';
import { GroupIdentityService } from '../../../packages/group-identity/src/index.js';
import { ConciergeLearningService, type DataUsePurpose, type LearningCategory } from '../../../packages/concierge-learning/src/index.js';
import { MarketService } from '../../../packages/market/src/index.js';
import { HistoricalImportService, RepositoryArtifactStore, type ArtifactStoreLike } from '../../../packages/imports/src/index.js';
import { authenticatedApi } from './authenticated.js';
export { GroupLiveHub } from './group-live-hub.js';

interface DurableObjectStubLike { fetch(request:Request):Promise<Response>; }
interface DurableObjectNamespaceLike { idFromName(name:string):unknown; get(id:unknown):DurableObjectStubLike; }

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

const createRequestScope = (request:Request,repo:PlatformRepository,artifacts?:ArtifactStoreLike) => {
  const kernel=new PlatformKernel();
  const foundation=new FoundationService(repo,kernel); const ledger=new LedgerService(repo,kernel); const meetings=new MeetingService(repo,kernel); const discovery=new DiscoveryService(repo,kernel); const membershipGateway=new MembershipGatewayService(repo,kernel); const rubrics=new RubricKnowledgeService(repo,kernel);
  const completion=new CompletionSuiteService(repo,kernel);
  const explainability=new ExplainabilityService(repo,kernel); const documents=new DocumentSearchService(repo,kernel);
  const receivables=new ReceivablesService(repo,kernel); const treasury=new TreasuryService(repo,kernel,ledger); const riskFinance=new RiskFinanceService(repo,kernel,ledger); const market=new MarketService(repo,kernel);
  const artifactStore=artifacts??new RepositoryArtifactStore(repo,kernel);
  const imports=new HistoricalImportService(repo,kernel,ledger,completion,artifactStore);
  const memberControl=new MemberFinancialControlService(repo,kernel);
  const groupIdentity=new GroupIdentityService(repo,kernel);
  const conciergeLearning=new ConciergeLearningService(repo,kernel);
  const tenantId=request.headers.get('x-tenant-id')??'tenant_demo'; const actorId=request.headers.get('x-actor-id')??'user_founder';
  const groupRoles=(request.headers.get('x-group-roles')??'founder,manager').split(',').map(x=>x.trim()).filter(Boolean);
  kernel.context.set({actorId,tenantId,activeGroupId:request.headers.get('x-active-group-id')??undefined,groupRoles,mandateIds:[],deviceId:request.headers.get('x-device-id')??'device_web_demo',sessionId:request.headers.get('x-session-id')??'session_demo',locale:request.headers.get('accept-language')?.toLowerCase().startsWith('en')?'en':'fr',timezone:request.headers.get('x-timezone')??'Africa/Douala',connectivity:'online',requestId:request.headers.get('x-request-id')??makeId('req')});
  return {kernel,foundation,ledger,meetings,discovery,membershipGateway,rubrics,completion,explainability,documents,receivables,treasury,riskFinance,market,imports,memberControl,groupIdentity,conciergeLearning};
};

const inboxFor = async (repo:PlatformRepository,tenantId:string,actorId:string) => {
  const obligations=(await repo.listObligations(tenantId,actorId)).filter(x=>x.status==='open'||x.status==='overdue').map(x=>({id:x.id,kind:'obligation',title:x.title,priority:x.priority,status:x.status,groupId:x.groupId}));
  const cases=(await repo.listCases(tenantId,actorId)).filter(x=>x.status!=='CLOSED').map(x=>({id:x.id,kind:'case',title:x.summary,priority:'normal',status:x.status,groupId:x.groupId}));
  return [...obligations,...cases];
};

export const createApiHandler = (repo:PlatformRepository = defaultRepo,options:{artifacts?:ArtifactStoreLike;liveNamespace?:DurableObjectNamespaceLike;premiumLive?:boolean}={}) => async (request:Request):Promise<Response> => {
  const url=new URL(request.url); const cors=corsHeaders(request);
  if(request.method==='OPTIONS'){
    const allowed=Boolean((cors as Record<string,string>)['access-control-allow-origin']);
    return new Response(null,{status:allowed?204:403,headers:{...baseSecurityHeaders,...cors,'access-control-allow-methods':'GET,POST,PUT,OPTIONS','access-control-allow-headers':'content-type,x-tenant-id,x-actor-id,x-group-roles,x-active-group-id,x-device-id,x-session-id,x-request-id,x-timezone'}});
  }
  const {kernel,foundation,ledger,meetings,discovery,membershipGateway,rubrics,completion,explainability,documents,receivables,treasury,riskFinance,market,imports,memberControl,groupIdentity,conciergeLearning}=createRequestScope(request,repo,options.artifacts); const ctx=kernel.context.get();
  if(options.premiumLive)kernel.features.set('premium_live_ledger',true);
  const requireGroup=async(groupId:string,manage=false)=>{
    const group=await repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return group;
    const member=(await repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member || manage && !member.roles.some(r=>['founder','manager','admin','president','treasurer'].includes(r)))throw Error('FORBIDDEN_SCOPE');
    return group;
  };
  const liveStubFor=async(groupId:string)=>{
    if(!options.premiumLive||!options.liveNamespace)throw new Error('PREMIUM_LIVE_LEDGER_DISABLED');
    const passport=await groupIdentity.compute(groupId);
    return{stub:options.liveNamespace.get(options.liveNamespace.idFromName(passport.publicCode)),passport};
  };
  const publishLive=async(groupId:string,type:string,idempotencyKey:string,payload:Record<string,string|number|boolean|null>,targetUserId?:string)=>{
    if(!options.premiumLive||!options.liveNamespace)return;
    const {stub}=await liveStubFor(groupId);
    const response=await stub.fetch(new Request('https://group-live.internal/publish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,actorId:ctx.actorId,idempotencyKey,payload,targetUserId})}));
    if(!response.ok)throw new Error('LIVE_PUBLISH_FAILED');
  };

  const visibleWorkspace=async(record:WorkspaceRecord)=>{
    if(!record.groupId)return record.createdBy===ctx.actorId;
    try{await requireGroup(record.groupId,true);return true;}catch{return false;}
  };
  try {
    const scopedGroup=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)/)?.[1];
    if(scopedGroup)await requireGroup(scopedGroup);
    const liveRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/live\/(health|events|connect|publish)$/);
    if(liveRoute){
      const groupId=liveRoute[1]!,action=liveRoute[2]!;
      if(!options.premiumLive||!options.liveNamespace)return json({enabled:false,error:'PREMIUM_LIVE_LEDGER_DISABLED'},503,cors);
      const {stub,passport}=await liveStubFor(groupId);
      if(action==='health'&&request.method==='GET'){
        const response=await stub.fetch(new Request('https://group-live.internal/health'));
        const body=await response.json() as Record<string,unknown>;
        return json({...body,enabled:true,groupCode:passport.publicCode,rulesFingerprint:passport.rulesFingerprint},response.status,cors);
      }
      if(action==='events'&&request.method==='GET'){
        const after=url.searchParams.get('after')??'0',limit=url.searchParams.get('limit')??'100';
        return stub.fetch(new Request('https://group-live.internal/events?after='+encodeURIComponent(after)+'&limit='+encodeURIComponent(limit)+'&userId='+encodeURIComponent(ctx.actorId)));
      }
      if(action==='connect'&&request.method==='GET')return stub.fetch(new Request('https://group-live.internal/connect?userId='+encodeURIComponent(ctx.actorId),{method:'GET',headers:request.headers}));
      if(action==='publish'&&request.method==='POST'){
        const body=await readJson<Record<string,unknown>>(request),type=String(body.type??'');
        if(type==='MEETING_UPDATE')await requireGroup(groupId,true);
        else if(!['PRESENCE','SYNC_HINT'].includes(type))throw new Error('LIVE_CLIENT_EVENT_NOT_ALLOWED');
        const raw=body.payload&&typeof body.payload==='object'&&!Array.isArray(body.payload)?body.payload as Record<string,unknown>:{};
        const payload:Record<string,string|number|boolean|null>={};
        for(const [k,v] of Object.entries(raw))if(typeof v==='string'||typeof v==='number'||typeof v==='boolean'||v===null)payload[k]=v;
        const idempotencyKey=String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('live'));
        await publishLive(groupId,type,idempotencyKey,payload);
        return json({accepted:true,groupCode:passport.publicCode},202,cors);
      }
      return json({error:'METHOD_NOT_ALLOWED'},405,cors);
    }
    if(request.method==='GET'&&url.pathname==='/health') return json({ok:true,service:'tontine-api',version:'1.2.0-functional-completion',now:new Date().toISOString(),realMoneyEnabled:kernel.features.enabled('financial-real-money'),manualCashLedgerEnabled:true,artifactStorageBound:true,artifactStorageMode:options.artifacts?'R2':'D1_FALLBACK',contextScope:'request'},200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/kernel') return json({services:['context','policy','workflow','events','audit','obligations','evidence','reconciliation','cases','inbox','notifications','configuration','features','data-governance','compatibility','resource-governor'],features:{groupLaunch:kernel.features.enabled('group-launch-studio'),meetingSync:kernel.features.enabled('meeting-sync-core'),realMoney:kernel.features.enabled('financial-real-money'),manualCashLedger:true}},200,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/product/capabilities'){
      return json({version:'1.2.0-functional-completion',count:PRODUCT_CAPABILITY_COUNT,capabilities:PRODUCT_MODULES},200,cors);
    }


    if(request.method==='POST'&&url.pathname==='/api/v1/bootstrap'){
      const body=await readJson<Record<string,unknown>>(request); await foundation.ensureUser({id:ctx.actorId,displayName:String(body.displayName??'Local Manager').trim()||'Local Manager',locale:String(body.locale??ctx.locale),createdAt:new Date().toISOString()});
      return json({ok:true,actorId:ctx.actorId,tenantId:ctx.tenantId},200,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/universe'){
      const groups=await repo.listGroups(ctx.tenantId); const inbox=await inboxFor(repo,ctx.tenantId,ctx.actorId); const audit=await repo.listAudit(ctx.tenantId);
      return json({groups:groups.length,inbox:inbox.length,audit:audit.length},200,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/inbox') return json(await inboxFor(repo,ctx.tenantId,ctx.actorId),200,cors);

    if(request.method==='POST'&&url.pathname==='/api/v1/assistant/group-launch/analyze'){
      const body=await readJson<Record<string,unknown>>(request);const text=String(body.text??'');
      const suggestions=analyzeGovernanceText(text);const fingerprint=await governanceFingerprint(text);
      return json({fingerprint,suggestions,requiresHumanConfirmation:true,financialWrites:false},200,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/assistant/group-launch/interpret'){
      const body=await readJson<Record<string,unknown>>(request);const text=String(body.text??'');
      return json({draft:interpretLaunchPrompt(text),requiresHumanConfirmation:true,financialWrites:false},200,cors);
    }

    if(request.method==='POST'&&url.pathname==='/api/v1/group-projects'){
      const body=await readJson<Record<string,unknown>>(request);
      const financial=body.rubrics!==undefined?{rubrics:body.rubrics as any}:{memberCount:finite(body.memberCount),sessions:finite(body.sessions),nominalContribution:{currency:String(body.currency??'XAF'),amount:finite(body.nominalContribution)},managementFeePerContribution:{currency:String(body.currency??'XAF'),amount:finite(body.managementFeePerContribution,0)},estimatedExternalCostRate:finite(body.estimatedExternalCostRate,0),fixedOperatingCostPerSession:{currency:String(body.currency??'XAF'),amount:finite(body.fixedOperatingCostPerSession,0)}};
      const project=await foundation.createProject({tenantId:ctx.tenantId,createdBy:ctx.actorId,name:String(body.name??''),kind:(body.kind??'rotating_tontine') as any,governanceModel:(body.governanceModel??'founder_managed') as any,launchProfile:body.launchProfile as any,...financial});
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
    if(request.method==='POST'&&url.pathname==='/api/v1/membership-applications'){
      const body=await readJson<Record<string,unknown>>(request);
      const groupId=String(body.groupId??'').trim(); if(!groupId) throw new Error('GROUP_ID_REQUIRED');
      return json(await membershipGateway.requestToJoin({groupId,message:body.message?String(body.message):undefined}),201,cors);
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
    const rubricActivityRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubrics\/([^/]+)\/activity-plan$/);
    if(rubricActivityRoute&&request.method==='PUT')return json(await rubrics.updateActivityPlan(ctx.tenantId,rubricActivityRoute[1]!,rubricActivityRoute[2]!,await readJson(request)),200,cors);
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

    const statement=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/statement$/);
    if(statement&&request.method==='GET')return json(await ledger.memberStatement(ctx.tenantId,statement[1]!,statement[2]!,url.searchParams.get('asOf')??undefined),200,cors);
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
      const entry=await repo.getLedgerEntry(ctx.tenantId,contributionRoute[1]!,receipt.ledgerEntryId);
      if(entry){
        const positions=await ledger.receiptPositions(ctx.tenantId,contributionRoute[1]!);
        const after=positions.filter(p=>p.membershipId===receipt.membershipId).reduce((n,p)=>n+p.netAmount,0);
        const notice=await memberControl.create({groupId:contributionRoute[1]!,membershipId:receipt.membershipId,entry,operationType:'CASH_CONTRIBUTION',amount:receipt.amount.amount,currency:receipt.amount.currency,rubricId:receipt.rubricId,meetingId:receipt.meetingId,previousSituation:after-receipt.amount.amount,newSituation:after});
        await publishLive(contributionRoute[1]!,'FINANCIAL_NOTICE','notice:'+notice.id,{noticeId:notice.id,ledgerEntryId:notice.ledgerEntryId,operationType:notice.operationType,amount:notice.amount,currency:notice.currency,previousSituation:notice.previousSituation??0,newSituation:notice.newSituation??0},notice.userId);
      }
      return json(receipt,201,cors);
    }

    const ledgerRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger$/);
    if(ledgerRoute&&request.method==='GET') return json({summary:await ledger.summary(ctx.tenantId,ledgerRoute[1]!),entries:await repo.listLedgerEntries(ctx.tenantId,ledgerRoute[1]!),receipts:await ledger.receiptPositions(ctx.tenantId,ledgerRoute[1]!)},200,cors);
    const reverseRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger\/([^/]+)\/reverse$/);
    if(reverseRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await ledger.reverseEntry({tenantId:ctx.tenantId,groupId:reverseRoute[1]!,entryId:reverseRoute[2]!,reason:String(body.reason??'')}),201,cors);}

    const cashboxRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/cashbox\/reconciliations$/);
    if(cashboxRoute&&request.method==='GET') return json(await repo.listCashboxReconciliations(ctx.tenantId,cashboxRoute[1]!),200,cors);
    if(cashboxRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); return json(await foundation.reconcileCashbox({tenantId:ctx.tenantId,groupId:cashboxRoute[1]!,meetingId:body.meetingId?String(body.meetingId):undefined,openingCash:finite(body.openingCash),cashIn:finite(body.cashIn),cashOut:finite(body.cashOut),countedClosing:finite(body.countedClosing),currency:String(body.currency??'XAF')}),201,cors);
    }

    const memberNotices=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/financial-notices$/);
    if(memberNotices&&request.method==='GET')return json(await memberControl.list(memberNotices[1]!,memberNotices[2]!),200,cors);
    const noticeConfirm=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-notices\/([^/]+)\/confirm$/);
    if(noticeConfirm&&request.method==='POST')return json(await memberControl.confirm(noticeConfirm[1]!,noticeConfirm[2]!),200,cors);
    const noticeReserve=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-notices\/([^/]+)\/reserve$/);
    if(noticeReserve&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await memberControl.reserve(noticeReserve[1]!,noticeReserve[2]!,String(body.reason??'')),201,cors);}
    const noticeOfficer=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-notices\/([^/]+)\/officer-review$/);
    if(noticeOfficer&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await memberControl.officerReview(noticeOfficer[1]!,noticeOfficer[2]!,String(body.note??'')),200,cors);}
    const noticeMemberReview=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-notices\/([^/]+)\/member-review$/);
    if(noticeMemberReview&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request),decision=String(body.decision??'');
      if(decision!=='APPROVE_AFTER_REVIEW'&&decision!=='MAINTAIN_RESERVE')throw new Error('INVALID_MEMBER_REVIEW_DECISION');
      return json(await memberControl.memberReview(noticeMemberReview[1]!,noticeMemberReview[2]!,decision,String(body.note??'')),200,cors);
    }

    const identityPassport=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/identity-passport$/);
    if(identityPassport&&request.method==='GET')return json(await groupIdentity.compute(identityPassport[1]!),200,cors);
    if(identityPassport&&request.method==='POST')return json(await groupIdentity.issue(identityPassport[1]!),201,cors);

    const dataConsent=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/data-use-consent$/);
    if(dataConsent&&request.method==='GET')return json(await conciergeLearning.consent(dataConsent[1]!),200,cors);
    if(dataConsent&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request),purpose=String(body.purpose??'') as DataUsePurpose;
      if(!['COLLECTIVE_LEARNING','COMMERCIAL_PERSONALIZATION','PARTNER_MATCHING','COMMUNITY_DISCOVERY'].includes(purpose))throw new Error('INVALID_DATA_USE_PURPOSE');
      return json(await conciergeLearning.setConsent(dataConsent[1]!,purpose,Boolean(body.granted)),200,cors);
    }

    const memoriesRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/concierge\/memories$/);
    if(memoriesRoute&&request.method==='GET')return json(await conciergeLearning.memories(memoriesRoute[1]!),200,cors);
    if(memoriesRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request),category=String(body.category??'') as LearningCategory;
      return json(await conciergeLearning.learn(memoriesRoute[1]!,{
        category,key:String(body.key??''),value:String(body.value??''),sourceRef:String(body.sourceRef??''),
        evidenceSnippet:body.evidenceSnippet?String(body.evidenceSnippet):undefined,confidence:finite(body.confidence),
        privacy:String(body.privacy??'GROUP_PRIVATE') as any,visibility:String(body.visibility??'MANAGERS') as any
      }),201,cors);
    }
    const collectiveSignals=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/concierge\/collective-signals$/);
    if(collectiveSignals&&request.method==='GET'){
      const passport=await groupIdentity.compute(collectiveSignals[1]!);
      return json(await conciergeLearning.safeCollectiveSignals(collectiveSignals[1]!,passport.publicCode),200,cors);
    }
    const commercialAffinities=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/concierge\/commercial-affinities$/);
    if(commercialAffinities&&request.method==='GET')return json(await conciergeLearning.commercialAffinities(commercialAffinities[1]!),200,cors);

    const amountExplain=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/amount-explanation$/);
    if(amountExplain&&request.method==='GET'){
      return json(await explainability.amount(amountExplain[1]!,amountExplain[2]!,url.searchParams.get('rubricId')??undefined),200,cors);
    }
    const documentSearch=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/documents\/search$/);
    if(documentSearch&&request.method==='GET'){
      return json(await documents.search(documentSearch[1]!,url.searchParams.get('q')??'',Number(url.searchParams.get('limit')??20)),200,cors);
    }
    const importPreview=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/imports\/csv\/preview$/);
    if(importPreview&&request.method==='POST'){
      await requireGroup(importPreview[1]!,true);const body=await readJson<Record<string,unknown>>(request);
      return json(await imports.stage(importPreview[1]!,{title:String(body.title??'CSV import preview'),kind:String(body.kind??'CONTRIBUTIONS') as any,text:String(body.text??''),delimiter:body.delimiter?String(body.delimiter):undefined}),201,cors);
    }
    const importApprove=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/imports\/([^/]+)\/approve$/);
    if(importApprove&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);const mapping=body.mapping&&typeof body.mapping==='object'&&!Array.isArray(body.mapping)?body.mapping as Record<string,string>:{};
      return json(await imports.approve(importApprove[1]!,importApprove[2]!,mapping),200,cors);
    }
    const importApply=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/imports\/([^/]+)\/apply$/);
    if(importApply&&request.method==='POST')return json(await imports.apply(importApply[1]!,importApply[2]!),200,cors);
    const groupHealth=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/health-snapshot$/);
    if(groupHealth&&request.method==='GET')return json(await explainability.health(groupHealth[1]!),200,cors);
    const digestRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/notification-digest$/);
    if(digestRoute&&request.method==='GET'){
      await requireGroup(digestRoute[1]!);
      const items=(await repo.listObligations(ctx.tenantId)).filter(x=>x.groupId===digestRoute[1]&&x.assigneeId===ctx.actorId&&x.status==='open').map(x=>({id:x.id,title:x.title,dueAt:x.dueAt,priority:x.priority}));
      return json({items:buildNotificationDigest(items,new Date().toISOString(),Number(url.searchParams.get('hours')??24))},200,cors);
    }

    if(request.method==='GET'&&url.pathname==='/api/v1/completion/workflows'){
      return json({version:'1.2.0-functional-completion',workflows:COMPLETION_WORKFLOWS},200,cors);
    }

    const expectedRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/receivables\/expected$/);
    if(expectedRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await receivables.createExpected(expectedRoute[1]!,{membershipId:String(body.membershipId??''),title:String(body.title??''),dueAt:String(body.dueAt??''),amount:finite(body.amount),currency:String(body.currency??'XAF'),rubricId:body.rubricId?String(body.rubricId):undefined}),201,cors);}
    const allocationRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/receivables\/allocations$/);
    if(allocationRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await receivables.allocate(allocationRoute[1]!,{obligationId:String(body.obligationId??''),receiptId:String(body.receiptId??''),amount:finite(body.amount)}),201,cors);}
    const arrearsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/receivables\/arrears$/);
    if(arrearsRoute&&request.method==='GET')return json(await receivables.report(arrearsRoute[1]!,url.searchParams.get('asOf')??undefined),200,cors);
    const savingsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings$/);
    if(savingsRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.createSavingsPlan(savingsRoute[1]!,{membershipId:String(body.membershipId??''),name:String(body.name??''),targetAmount:body.targetAmount===undefined?undefined:finite(body.targetAmount),currency:String(body.currency??'XAF')}),201,cors);}
    const savingsPosition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings\/([^/]+)\/position$/);
    if(savingsPosition&&request.method==='GET')return json(await treasury.savingsPosition(savingsPosition[1]!,savingsPosition[2]!),200,cors);
    const savingsDeposit=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings\/([^/]+)\/deposit$/);
    if(savingsDeposit&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.depositSavings(savingsDeposit[1]!,savingsDeposit[2]!,finite(body.amount),String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('savings'))),201,cors);}
    const savingsWithdraw=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings\/([^/]+)\/withdraw$/);
    if(savingsWithdraw&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.withdrawSavings(savingsWithdraw[1]!,savingsWithdraw[2]!,finite(body.amount),String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('savings_withdraw'))),201,cors);}
    const openingRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger\/opening-balance$/);
    if(openingRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.openingBalance(openingRoute[1]!,{amount:finite(body.amount),currency:String(body.currency??'XAF'),note:String(body.note??''),idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('opening'))}),201,cors);}
    const custodyRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/custody$/);
    if(custodyRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.createCustody(custodyRoute[1]!,{name:String(body.name??''),holder:String(body.holder??''),currency:String(body.currency??'XAF')}),201,cors);}
    const custodyOut=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/custody\/([^/]+)\/send$/);
    if(custodyOut&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.sendToCustody(custodyOut[1]!,custodyOut[2]!,finite(body.amount),String(body.idempotencyKey??makeId('custody_out'))),201,cors);}
    const custodyIn=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/custody\/([^/]+)\/return$/);
    if(custodyIn&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.returnFromCustody(custodyIn[1]!,custodyIn[2]!,finite(body.amount),String(body.idempotencyKey??makeId('custody_in'))),201,cors);}
    const guarantorRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/([^/]+)\/guarantors$/);
    if(guarantorRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await riskFinance.guarantor(guarantorRoute[1]!,{loanId:guarantorRoute[2]!,membershipId:String(body.membershipId??''),guaranteedAmount:finite(body.guaranteedAmount)}),201,cors);}
    const solidarityRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/solidarity\/cases$/);
    if(solidarityRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await riskFinance.solidarityCase(solidarityRoute[1]!,{beneficiaryMembershipId:String(body.beneficiaryMembershipId??''),title:String(body.title??''),approvedAmount:finite(body.approvedAmount),currency:String(body.currency??'XAF')}),201,cors);}
    const solidarityFund=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/solidarity\/cases\/([^/]+)\/fund$/);
    if(solidarityFund&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await riskFinance.fund(solidarityFund[1]!,solidarityFund[2]!,finite(body.amount),String(body.idempotencyKey??makeId('solidarity_fund'))),201,cors);}
    const solidarityPay=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/solidarity\/cases\/([^/]+)\/disburse$/);
    if(solidarityPay&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await riskFinance.disburse(solidarityPay[1]!,solidarityPay[2]!,finite(body.amount),String(body.idempotencyKey??makeId('solidarity_pay'))),201,cors);}
    const stockRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/stock$/);
    if(stockRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.createStock(stockRoute[1]!,{sku:String(body.sku??''),name:String(body.name??''),quantity:finite(body.quantity),unit:body.unit?String(body.unit):undefined}),201,cors);}
    const stockAdjust=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/stock\/([^/]+)\/adjust$/);
    if(stockAdjust&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.adjustStock(stockAdjust[1]!,stockAdjust[2]!,finite(body.delta),String(body.reason??'')),200,cors);}
    const orderRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/orders$/);
    if(orderRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.createOrder(orderRoute[1]!,{stockItemId:String(body.stockItemId??''),quantity:finite(body.quantity),customerRef:String(body.customerRef??''),unitPrice:body.unitPrice===undefined?undefined:finite(body.unitPrice)}),201,cors);}
    const deliverRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/orders\/([^/]+)\/deliver$/);
    if(deliverRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.deliver(deliverRoute[1]!,deliverRoute[2]!,finite(body.quantity)),200,cors);}
    const returnRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/orders\/([^/]+)\/return$/);
    if(returnRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.returnItems(returnRoute[1]!,returnRoute[2]!,finite(body.quantity),String(body.reason??'')),200,cors);}
    const disputeRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/orders\/([^/]+)\/dispute$/);
    if(disputeRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.dispute(disputeRoute[1]!,disputeRoute[2]!,String(body.summary??'')),200,cors);}
    const groupBuyRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/group-buys$/);
    if(groupBuyRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.createGroupBuy(groupBuyRoute[1]!,{title:String(body.title??''),stockItemId:body.stockItemId?String(body.stockItemId):undefined,thresholdQuantity:finite(body.thresholdQuantity),deadline:String(body.deadline??'')}),201,cors);}
    const groupBuyCommit=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/group-buys\/([^/]+)\/commit$/);
    if(groupBuyCommit&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.commitGroupBuy(groupBuyCommit[1]!,groupBuyCommit[2]!,String(body.membershipId??''),finite(body.quantity)),200,cors);}
    const completionCollection=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/completion$/);
    if(completionCollection&&request.method==='GET'){
      const kind=url.searchParams.get('kind') as CompletionKind|null;
      return json(await completion.list(completionCollection[1]!,kind??undefined),200,cors);
    }
    if(completionCollection&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      const kind=String(body.kind??'') as CompletionKind;
      const data=body.data&&typeof body.data==='object'&&!Array.isArray(body.data)?body.data as Record<string,unknown>:{};
      return json(await completion.create(completionCollection[1]!,kind,{
        title:String(body.title??''),summary:body.summary?String(body.summary):undefined,data,tags:strArray(body.tags)
      }),201,cors);
    }
    const completionTransition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/completion\/([^/]+)\/transition$/);
    if(completionTransition&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      const patch=body.patch&&typeof body.patch==='object'&&!Array.isArray(body.patch)?body.patch as Record<string,unknown>:{};
      return json(await completion.transition(completionTransition[1]!,completionTransition[2]!,String(body.to??''),{
        expectedVersion:finite(body.expectedVersion),patch,reason:body.reason?String(body.reason):undefined
      }),200,cors);
    }

    const identityClaim=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/identity-claims$/);
    if(identityClaim&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.createHistoricalIdentityClaim(identityClaim[1]!,{
        historicalReference:String(body.historicalReference??''),evidenceReference:String(body.evidenceReference??''),
        claimedMembershipId:body.claimedMembershipId?String(body.claimedMembershipId):undefined,note:body.note?String(body.note):undefined
      }),201,cors);
    }

    const tontineCycle=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/tontine\/cycles$/);
    if(tontineCycle&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.createTontineCycle(tontineCycle[1]!,{
        rubricId:String(body.rubricId??''),name:String(body.name??''),rounds:finite(body.rounds),
        potsPerRound:finite(body.potsPerRound),currency:String(body.currency??'XAF'),
        nominalPotAmount:body.nominalPotAmount===undefined?undefined:finite(body.nominalPotAmount)
      }),201,cors);
    }
    const tontineShare=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/tontine\/shares$/);
    if(tontineShare&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.addTontineShare(tontineShare[1]!,{
        cycleId:String(body.cycleId??''),membershipId:String(body.membershipId??''),label:String(body.label??'')
      }),201,cors);
    }
    const scheduleSuggestion=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/tontine\/schedule\/suggest$/);
    if(scheduleSuggestion&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      await requireGroup(scheduleSuggestion[1]!,true);
      return json(suggestTontineSchedule(strArray(body.shareIds),finite(body.rounds),finite(body.potsPerRound),
        Array.isArray(body.constraints)?body.constraints as any:[]),200,cors);
    }
    const scheduleShare=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/tontine\/shares\/([^/]+)\/schedule$/);
    if(scheduleShare&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.scheduleTontineShare(scheduleShare[1]!,scheduleShare[2]!,finite(body.round),finite(body.expectedVersion)),200,cors);
    }
    const serveShare=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/tontine\/shares\/([^/]+)\/serve$/);
    if(serveShare&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      const share=(await completion.list(serveShare[1]!,'TONTINE_SHARE')).find(x=>x.id===serveShare[2]!);
      if(!share)throw new Error('TONTINE_SHARE_NOT_FOUND');
      if(String(share.data.completionState)!=='SCHEDULED')throw new Error('TONTINE_SHARE_NOT_SCHEDULED');
      const entry=await ledger.recordCashMovement({
        tenantId:ctx.tenantId,groupId:serveShare[1]!,amount:finite(body.amount),currency:String(body.currency??'XAF'),
        direction:'out',counterAccountCode:'MEMBER_FUNDS_LIABILITY',counterAccountType:'liability',
        descriptionCode:'LEDGER_TONTINE_BENEFIT',sourceType:'tontine_share',sourceId:share.id,
        meetingId:body.meetingId?String(body.meetingId):undefined,
        idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('benefit')),kind:'tontine_benefit'
      });
      return json({entry,share:await completion.markTontineShareServed(serveShare[1]!,share.id,entry.id,finite(body.expectedVersion))},201,cors);
    }

    const obligationRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/obligations$/);
    if(obligationRoute&&request.method==='GET')return json(await repo.listObligations(ctx.tenantId),200,cors);
    if(obligationRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.createFinancialObligation(obligationRoute[1]!,{
        membershipId:String(body.membershipId??''),type:String(body.type??'CONTRIBUTION_DUE'),title:String(body.title??''),
        dueAt:body.dueAt?String(body.dueAt):undefined,amount:body.amount===undefined?undefined:finite(body.amount),
        currency:String(body.currency??'XAF'),sourceId:body.sourceId?String(body.sourceId):undefined
      }),201,cors);
    }

    const loanQuote=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/quote$/);
    if(loanQuote&&request.method==='POST'){
      await requireGroup(loanQuote[1]!,true);
      const body=await readJson<Record<string,unknown>>(request);
      const schedule=buildLoanSchedule({
        principal:finite(body.principal),installments:finite(body.installments),annualRateBasisPoints:finite(body.annualRateBasisPoints,0),
        installmentsPerYear:finite(body.installmentsPerYear,12),method:String(body.method??'DECLINING') as any,feesTotal:finite(body.feesTotal,0)
      });
      const examplePayment=body.examplePaymentAmount===undefined?undefined:applyLoanPayment({
        principalOutstanding:finite(body.principal),unpaidInterest:finite(body.unpaidInterest,0),paymentAmount:finite(body.examplePaymentAmount),
        rateBasisPointsPerPeriod:finite(body.rateBasisPointsPerPeriod,0),priority:String(body.paymentPriority??'CAPITAL_FIRST') as any
      });
      return json({schedule,examplePayment},200,cors);
    }
    const loanDisburse=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/([^/]+)\/disburse$/);
    if(loanDisburse&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      const loan=(await completion.list(loanDisburse[1]!,'LOAN')).find(x=>x.id===loanDisburse[2]!);
      if(!loan)throw new Error('LOAN_NOT_FOUND');
      if(String(loan.data.completionState)!=='APPROVED')throw new Error('LOAN_NOT_APPROVED');
      const principal=finite(body.amount??loan.data.principal);
      const entry=await ledger.recordCashMovement({
        tenantId:ctx.tenantId,groupId:loanDisburse[1]!,amount:principal,currency:String(loan.data.currency??'XAF'),
        direction:'out',counterAccountCode:'LOAN_RECEIVABLE',counterAccountType:'asset',
        descriptionCode:'LEDGER_LOAN_DISBURSEMENT',sourceType:'loan',sourceId:loan.id,
        meetingId:body.meetingId?String(body.meetingId):undefined,
        idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('loan_disbursement')),kind:'loan_disbursement'
      });
      return json({entry,loan:await completion.transition(loanDisburse[1]!,loan.id,'DISBURSED',{
        expectedVersion:finite(body.expectedVersion),patch:{ledgerEntryId:entry.id,outstandingPrincipal:principal,disbursedAt:new Date().toISOString()}
      })},201,cors);
    }
    const loanAllocation=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/allocation-preview$/);
    if(loanAllocation&&request.method==='POST'){
      await requireGroup(loanAllocation[1]!,true);const body=await readJson<Record<string,unknown>>(request);
      return json(applyLoanPayment({
        principalOutstanding:finite(body.principalOutstanding),unpaidInterest:finite(body.unpaidInterest,0),paymentAmount:finite(body.paymentAmount),
        rateBasisPointsPerPeriod:finite(body.rateBasisPointsPerPeriod),priority:String(body.priority??'CAPITAL_FIRST') as any
      }),200,cors);
    }
    const loanRepay=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/([^/]+)\/repay$/);
    if(loanRepay&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      const loan=(await completion.list(loanRepay[1]!,'LOAN')).find(x=>x.id===loanRepay[2]!);
      if(!loan)throw new Error('LOAN_NOT_FOUND');
      if(!['DISBURSED','REPAYING'].includes(String(loan.data.completionState)))throw new Error('LOAN_NOT_REPAYABLE');
      const outstanding=finite(loan.data.outstandingPrincipal),unpaidInterest=finite(loan.data.unpaidInterest,0);
      const explicitPrincipal=body.principalAmount!==undefined;
      const allocation=explicitPrincipal
        ?{principalPaid:finite(body.principalAmount),interestPaid:finite(body.interestAmount,0),remainingPrincipal:outstanding-finite(body.principalAmount),unpaidInterestAfter:unpaidInterest,totalDebtAfter:outstanding-finite(body.principalAmount)+unpaidInterest,interestAccrued:0,totalInterestDue:unpaidInterest,paymentAmount:finite(body.principalAmount)+finite(body.interestAmount,0),priority:String(body.priority??'CAPITAL_FIRST')}
        :applyLoanPayment({principalOutstanding:outstanding,unpaidInterest,paymentAmount:finite(body.paymentAmount),rateBasisPointsPerPeriod:finite(body.rateBasisPointsPerPeriod??loan.data.rateBasisPointsPerPeriod,0),priority:String(body.priority??loan.data.paymentPriority??'CAPITAL_FIRST') as any});
      if(allocation.principalPaid<0||allocation.principalPaid>outstanding)throw new Error('INVALID_LOAN_REPAYMENT');
      const entry=await ledger.recordLoanRepayment({
        tenantId:ctx.tenantId,groupId:loanRepay[1]!,principalAmount:allocation.principalPaid,interestAmount:allocation.interestPaid,
        currency:String(loan.data.currency??'XAF'),sourceId:loan.id,meetingId:body.meetingId?String(body.meetingId):undefined,
        idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('loan_repayment'))
      });
      const target=allocation.remainingPrincipal===0&&allocation.unpaidInterestAfter===0?'CLOSED':'REPAYING';
      return json({entry,allocation,loan:await completion.transition(loanRepay[1]!,loan.id,target,{
        expectedVersion:finite(body.expectedVersion),patch:{outstandingPrincipal:allocation.remainingPrincipal,unpaidInterest:allocation.unpaidInterestAfter,lastRepaymentLedgerEntryId:entry.id,paymentPriority:allocation.priority}
      })},201,cors);
    }

    const decisionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/decisions$/);
    if(decisionRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.createGovernanceDecision(decisionRoute[1]!,{
        title:String(body.title??''),subject:String(body.subject??''),threshold:finite(body.threshold),
        expiresAt:body.expiresAt?String(body.expiresAt):undefined,operationFingerprint:body.operationFingerprint?String(body.operationFingerprint):undefined
      }),201,cors);
    }
    const decisionApprove=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/decisions\/([^/]+)\/approve$/);
    if(decisionApprove&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.approveDecision(decisionApprove[1]!,decisionApprove[2]!,finite(body.expectedVersion)),200,cors);
    }

    const readinessRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/readiness$/);
    if(readinessRoute&&request.method==='POST')return json(await completion.readinessPassport(readinessRoute[1]!),201,cors);

    const ruleCompareRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rules\/compare$/);
    if(ruleCompareRoute&&request.method==='POST'){
      await requireGroup(ruleCompareRoute[1]!,true);
      const body=await readJson<Record<string,unknown>>(request);
      const before=body.before&&typeof body.before==='object'&&!Array.isArray(body.before)?body.before as Record<string,unknown>:{};
      const after=body.after&&typeof body.after==='object'&&!Array.isArray(body.after)?body.after as Record<string,unknown>:{};
      return json({differences:compareRules(before,after)},200,cors);
    }

    const anomalyRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger\/anomalies$/);
    if(anomalyRoute&&request.method==='GET'){
      await requireGroup(anomalyRoute[1]!,true);
      return json(explainLedgerAnomalies(await repo.listLedgerEntries(ctx.tenantId,anomalyRoute[1]!)),200,cors);
    }

    const calendarRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/calendar\.ics$/);
    if(calendarRoute&&request.method==='GET'){
      await requireGroup(calendarRoute[1]!);
      const meetings=await repo.listMeetings(ctx.tenantId,calendarRoute[1]!);
      const ics=makeIcs(meetings.filter(x=>x.scheduledAt).map(x=>({uid:x.id,title:x.title,start:x.scheduledAt!,cancelled:x.status==='cancelled'})));
      return new Response(ics,{status:200,headers:{'content-type':'text/calendar; charset=utf-8','content-disposition':'attachment; filename="eco-system.ics"',...baseSecurityHeaders,...cors}});
    }

    if(request.method==='POST'&&url.pathname==='/api/v1/cases'){
      const body=await readJson<Record<string,unknown>>(request); return json(await foundation.openSupportCase({tenantId:ctx.tenantId,groupId:body.groupId?String(body.groupId):undefined,openedBy:ctx.actorId,summary:String(body.summary??'')}),201,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/cases') return json(await repo.listCases(ctx.tenantId,ctx.actorId),200,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/workspaces'){
      const moduleId=url.searchParams.get('moduleId')??undefined;
      const groupId=url.searchParams.get('groupId')??undefined;
      const records=await repo.listWorkspaceRecords(ctx.tenantId,moduleId,groupId);const visible=[];
      for(const record of records)if(await visibleWorkspace(record))visible.push(record);
      return json(visible,200,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/workspaces'){
      const body=await readJson<Record<string,unknown>>(request);
      const moduleId=String(body.moduleId??'').trim(); const title=String(body.title??'').trim();
      if(!moduleId||!PRODUCT_MODULES.some(x=>x.id===moduleId)) throw new Error('INVALID_MODULE_ID');
      if(!title) throw new Error('WORKSPACE_TITLE_REQUIRED');
      if(body.groupId)await requireGroup(String(body.groupId),true);
      const timestamp=new Date().toISOString();
      const rawData=body.data&&typeof body.data==='object'&&!Array.isArray(body.data)?body.data as Record<string,unknown>:{};
      const data:Record<string,string|number|boolean|null>={};
      for(const [k,v] of Object.entries(rawData)){if(typeof v==='string'||typeof v==='number'||typeof v==='boolean'||v===null)data[k]=v;}
      const status=String(body.status??'ACTIVE') as WorkspaceStatus;
      if(!['DRAFT','ACTIVE','DONE','ARCHIVED'].includes(status)) throw new Error('INVALID_WORKSPACE_STATUS');
      const record:WorkspaceRecord={id:makeId('workspace'),tenantId:ctx.tenantId,groupId:body.groupId?String(body.groupId):undefined,moduleId,title,summary:body.summary?String(body.summary):undefined,status,tags:strArray(body.tags),data,createdBy:ctx.actorId,createdAt:timestamp,updatedAt:timestamp};
      await repo.saveWorkspaceRecord(record);
      const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'WORKSPACE_RECORD_CREATED',targetType:'workspace_record',targetId:record.id,after:{moduleId:record.moduleId,groupId:record.groupId,status:record.status},requestId:ctx.requestId}); await repo.saveAudit(audit);
      return json(record,201,cors);
    }
    const workspaceRoute=url.pathname.match(/^\/api\/v1\/workspaces\/([^/]+)$/);
    if(workspaceRoute&&request.method==='PUT'){
      const existing=await repo.getWorkspaceRecord(ctx.tenantId,workspaceRoute[1]!); if(!existing)return json({error:'NOT_FOUND'},404,cors);
      if(!await visibleWorkspace(existing))throw Error('FORBIDDEN_SCOPE');
      const body=await readJson<Record<string,unknown>>(request);
      const status=String(body.status??existing.status) as WorkspaceStatus; if(!['DRAFT','ACTIVE','DONE','ARCHIVED'].includes(status)) throw new Error('INVALID_WORKSPACE_STATUS');
      const rawData=body.data&&typeof body.data==='object'&&!Array.isArray(body.data)?body.data as Record<string,unknown>:existing.data;
      const data:Record<string,string|number|boolean|null>={}; for(const [k,v] of Object.entries(rawData)){if(typeof v==='string'||typeof v==='number'||typeof v==='boolean'||v===null)data[k]=v;}
      const updated:WorkspaceRecord={...existing,title:body.title===undefined?existing.title:String(body.title).trim()||existing.title,summary:body.summary===undefined?existing.summary:String(body.summary),status,tags:body.tags===undefined?existing.tags:strArray(body.tags),data,updatedAt:new Date().toISOString()};
      await repo.saveWorkspaceRecord(updated);
      const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'WORKSPACE_RECORD_UPDATED',targetType:'workspace_record',targetId:updated.id,after:{moduleId:updated.moduleId,status:updated.status},requestId:ctx.requestId}); await repo.saveAudit(audit);
      return json(updated,200,cors);
    }

    if(request.method==='POST'&&url.pathname==='/api/v1/outbox/apply'){
      const item=await readJson<OutboxItem<Record<string,unknown>>>(request); if(item.tenantId!==ctx.tenantId||item.actorId!==ctx.actorId) throw new Error('FORBIDDEN_SCOPE');
      if(item.type==='CONTRIBUTION_CASH_RECORDED'){
        const p=item.payload;const groupId=String(p.groupId??'');
        const receipt=await ledger.recordCashContribution({tenantId:ctx.tenantId,groupId,membershipId:String(p.membershipId??''),amount:finite(p.amount),currency:String(p.currency??'XAF'),meetingId:p.meetingId?String(p.meetingId):undefined,rubricId:p.rubricId?String(p.rubricId):undefined,lateReason:p.lateReason?String(p.lateReason):undefined,approverIds:strArray(p.approverIds),idempotencyKey:item.idempotencyKey});
        const entry=await repo.getLedgerEntry(ctx.tenantId,groupId,receipt.ledgerEntryId);
        if(entry){const positions=await ledger.receiptPositions(ctx.tenantId,groupId);const after=positions.filter(x=>x.membershipId===receipt.membershipId).reduce((n,x)=>n+x.netAmount,0);await memberControl.create({groupId,membershipId:receipt.membershipId,entry,operationType:'CASH_CONTRIBUTION',amount:receipt.amount.amount,currency:receipt.amount.currency,rubricId:receipt.rubricId,meetingId:receipt.meetingId,previousSituation:after-receipt.amount.amount,newSituation:after});}
        return json({accepted:true,receipt},200,cors);
      }
      if(item.type==='MEETING_NOTE_UPDATED'){
        const groupId=String(item.payload.groupId??'');await requireGroup(groupId,true);
        const note=String(item.payload.note??'').trim();if(!note)throw Error('NOTE_REQUIRED');
        const id='note_'+encodeURIComponent(JSON.stringify([ctx.tenantId,ctx.actorId,item.idempotencyKey]));
        const existing=await repo.getWorkspaceRecord(ctx.tenantId,id);
        if(existing && (existing.summary!==note || existing.groupId!==groupId))throw Error('IDEMPOTENCY_CONFLICT');
        if(!existing)await repo.saveWorkspaceRecord({id,tenantId:ctx.tenantId,groupId,moduleId:'MEETING.COMMAND_CENTER',title:'Note de séance',summary:note,status:'ACTIVE',tags:['note'],data:{},createdBy:ctx.actorId,createdAt:item.createdAt,updatedAt:new Date().toISOString()});
        return json({accepted:true,stored:true,type:item.type,recordId:id},200,cors);
      }
      throw new Error('OUTBOX_TYPE_UNSUPPORTED');
    }

    return json({error:'NOT_FOUND'},404,cors);
  } catch(error){const message=error instanceof Error?error.message:'UNKNOWN_ERROR';const status=message==='FORBIDDEN_SCOPE'?403:message==='IDEMPOTENCY_CONFLICT'?409:message.endsWith('_NOT_FOUND')?404:400;return json({error:message,requestId:ctx.requestId},status,cors);}
};

export const handleRequest=createApiHandler(defaultRepo);
export interface AssetsFetcherLike { fetch(request: Request): Promise<Response> }
export interface WorkerEnv { DB?: D1DatabaseLike; ASSETS?: AssetsFetcherLike; ARTIFACTS?: ArtifactStoreLike }
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
  if(!env.DB){
    if(request.method==='GET' && ['/health','/api/v1/product/capabilities','/api/v1/kernel','/api/v1/discovery/groups'].includes(url.pathname))return handleRequest(request);
    return json({error:'PERSISTENT_STORAGE_REQUIRED'},503);
  }
  const repository=new D1PlatformRepository(env.DB);
  return authenticatedApi(repository,env.DB,createApiHandler(repository,{artifacts:env.ARTIFACTS}))(request);
}};
export {defaultRepo as repo};
