import { PlatformKernel } from '../../../packages/platform-kernel/src/index.js';
import { D1PlatformRepository, InMemoryPlatformRepository, type D1DatabaseLike, type PlatformRepository } from '../../../packages/repositories/src/index.js';
import { FoundationService, LedgerService, MeetingService, starterGroupOperatingPolicy, compareNormalizedCellIntents, financialCellWinnerRecordId, financialCellIntentRecordId } from '../../../packages/domain/src/index.js';
import { DiscoveryService, MembershipGatewayService } from '../../../packages/discovery/src/index.js';
import { RubricKnowledgeService } from '../../../packages/rubrics/src/index.js';
import { makeId, type OutboxItem, type GroupOperatingPolicy, type ProjectCapability, type RubricOperatingModel, type RubricPolicies, type WorkspaceRecord, type WorkspaceStatus } from '../../../packages/contracts/src/index.js';
import { PRODUCT_MODULES, PRODUCT_CAPABILITY_COUNT, buildProductReadinessReport } from '../../../packages/module-registry/src/index.js';
import {
  CompletionSuiteService, COMPLETION_WORKFLOWS, buildLoanSchedule, applyLoanPayment, compareRules,
  explainLedgerAnomalies, makeIcs, suggestTontineSchedule, type CompletionKind
} from '../../../packages/completion/src/index.js';
import { ExplainabilityService, DocumentSearchService, previewCsv, buildNotificationDigest } from '../../../packages/innovation/src/index.js';
import { ReceivablesService, TreasuryService, RiskFinanceService } from '../../../packages/finance/src/index.js';
import { analyzeGovernanceText, governanceFingerprint, interpretLaunchPrompt } from '../../../packages/guided-assistant/src/index.js';
import { MemberFinancialControlService } from '../../../packages/member-control/src/index.js';
import { MemberEnvelopeService } from '../../../packages/member-envelope/src/index.js';
import { MeetingLiveConsensusService } from '../../../packages/meeting-live-consensus/src/index.js';
import { GroupIdentityService } from '../../../packages/group-identity/src/index.js';
import { ConciergeLearningService, type DataUsePurpose, type LearningCategory, type DataUseDefaultMode } from '../../../packages/concierge-learning/src/index.js';
import { MarketService } from '../../../packages/market/src/index.js';
import { CommunityService } from '../../../packages/community/src/index.js';
import { CommunityRealtimeStore } from '../../../packages/community-realtime/src/index.js';
import { FounderLearningStore } from '../../../packages/founder-observatory/src/index.js';
import { FounderControlStore, type CapabilityHealth } from '../../../packages/founder-control/src/index.js';
import { FounderAIService } from '../../../packages/founder-ai/src/index.js';
import { CommercialPreferenceService, preferenceCookie, clearPreferenceCookie, readPreferenceCookie } from '../../../packages/commercial-preferences/src/index.js';
import { MiscRubricService } from '../../../packages/misc-rubrics/src/index.js';
import { allocateSavingsYield, splitInterestPool, simulateWorkbookYieldPipeline, allocateCapitalAtWorkYield, allocateCapitalTimeYield, allocateAttributedProductiveYield, SAVINGS_YIELD_POLICY_PRESETS } from '../../../packages/savings-yield/src/index.js';
import { buildFinancialRecap, buildSessionRecap, buildClosingCarryover } from '../../../packages/recap-engine/src/index.js';
import { AdManagerService, AD_PLACEMENT_CATALOG, HOUSE_AD_CATALOG, selectAdDelivery } from '../../../packages/ad-manager/src/index.js';
import { diagnoseGroup } from '../../../packages/group-doctor/src/index.js';
import { prepareMeetingAutopilot } from '../../../packages/meeting-autopilot/src/index.js';
import { EconomicIntelligenceService } from '../../../packages/economic-intelligence/src/index.js';
import { ExternalProgramsService, type ExternalProgramKind, type ExternalProgramState, type AggregateDataAccess, type SupportActionKind, type FundingState, type HandoverStage } from '../../../packages/external-programs/src/index.js';
import { IdentityProofService } from '../../../packages/identity-proof/src/index.js';
import { GroupPairingService } from '../../../packages/group-pairing/src/index.js';
import { InterestCommunityService } from '../../../packages/interest-communities/src/index.js';
import { EcoPulseService, type EngagementAction, type RecommendationCandidate } from '../../../packages/ecopulse/src/index.js';
import { HistoricalImportService, RepositoryArtifactStore, type ArtifactStoreLike } from '../../../packages/imports/src/index.js';
import { GovernanceVoteService } from '../../../packages/governance-vote/src/index.js';
import { NotificationService } from '../../../packages/notifications/src/index.js';
import { OperationalCockpitService } from '../../../packages/operational-cockpit/src/index.js';
import { simulatePeriodicLoan, summarizePeriodicLoan } from '../../../packages/loan-simulator/src/index.js';
import { TrashLifecycleMaintenance, addCalendarMonthsClamped } from '../../../packages/trash-lifecycle/src/index.js';
import { BusinessStudioService } from '../../../packages/business-studio/src/index.js';
import { GrowthReferralService, InMemoryReferralBudgetStore, D1ReferralBudgetStore, type ReferralBudgetStore } from '../../../packages/growth-referral/src/index.js';
import { KnowledgeAcademyService } from '../../../packages/knowledge-academy/src/index.js';
import { ValueNetworkService } from '../../../packages/value-network/src/index.js';
import { GroupReconstitutionService } from '../../../packages/group-reconstitution/src/index.js';
import { CreatorTalentService } from '../../../packages/creator-talent/src/index.js';
import { QuietWatchService } from '../../../packages/quiet-watch/src/index.js';
import { RubricExceptionService } from '../../../packages/rubric-exceptions/src/index.js';
import { TimeMachineService } from '../../../packages/time-machine/src/index.js';
import { NextOfKinService } from '../../../packages/succession/src/index.js';
import { AnticipationService } from '../../../packages/anticipation/src/index.js';
import { CommunityMicroAdService } from '../../../packages/community-micro-ads/src/index.js';
import { ValueDiscoveryService } from '../../../packages/value-discovery/src/index.js';
import { MeetingReopenAuthorizationService } from '../../../packages/meeting-authorization/src/index.js';
import { PrepaymentService } from '../../../packages/prepayments/src/index.js';
import { WalletService } from '../../../packages/wallet/src/index.js';
import { OpportunityGraphService } from '../../../packages/opportunity-graph/src/index.js';
import { StarterKitService } from '../../../packages/starter-kit/src/index.js';
import { GroupModelRegistryService, GroupCaseLawService } from '../../../packages/group-learning-registry/src/index.js';
import { SafetyCaseService, CommitmentTrustGraphService, assessReferralStructure, type SafetyCategory, type SafetyCaseState, type SafetyAction } from '../../../packages/trust/src/index.js';
import { ExpenseService } from '../../../packages/expenses/src/index.js';
import { authenticatedApi } from './authenticated.js';
export { GroupLiveHub } from './group-live-hub.js';

interface DurableObjectStubLike { fetch(request:Request):Promise<Response>; }
interface DurableObjectNamespaceLike { idFromName(name:string):unknown; get(id:unknown):DurableObjectStubLike; }
interface MarkdownConversionResultLike { id?:string; name:string; mimetype?:string; mimeType?:string; format:'markdown'|'text'|'error'; tokens?:number; data?:string; error?:string; }
interface WorkersAILike {
  toMarkdown(input:{name:string;blob:Blob}|Array<{name:string;blob:Blob}>,options?:Record<string,unknown>):Promise<MarkdownConversionResultLike|MarkdownConversionResultLike[]|{result:MarkdownConversionResultLike|MarkdownConversionResultLike[]}>;
  run?(model:string,input:Record<string,unknown>,options?:Record<string,unknown>):Promise<unknown>;
}

const RELEASE_VERSION='1.5.2.11-field-recovery';
const RELEASE_BUILD_ID='eco-system-1.5.2.11-20261005-field-recovery';
const RELEASE_SCHEMA_VERSION='d1-additive-20260923';
const RELEASE_POLICY_VERSION='live-finance-policy-20261003-explicit-conflicts';
const RELEASE_PWA_CACHE='eco-system-v15211-q01q28-recovery-20261006';

const defaultRepo = new InMemoryPlatformRepository();
const defaultReferralBudgets = new InMemoryReferralBudgetStore();

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
const bytesToBase64=(bytes:Uint8Array):string=>{let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(bytes.length,i+0x8000)));return btoa(binary);};
const jsonArraySafe=(value:string):string[]=>{try{const x=JSON.parse(value);return Array.isArray(x)?x.map(String):[];}catch{return[];}};
const strArray=(value:unknown):string[]=>Array.isArray(value)?value.map(String).map(x=>x.trim()).filter(Boolean):typeof value==='string'?value.split(',').map(x=>x.trim()).filter(Boolean):[];
const finite = (value: unknown, fallback?: number): number => {
  if ((value === undefined || value === null || value === '') && fallback !== undefined) return fallback;
  const n=Number(value); if(!Number.isFinite(n)) throw new Error('INVALID_NUMBER'); return n;
};
const safeArtifactName=(name:string)=>name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,120)||'document';
const sha256Bytes=async(buffer:ArrayBuffer)=>{
  const digest=await crypto.subtle.digest('SHA-256',buffer);
  return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
const launchDocumentExtension=(name:string)=>name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]??'';
const launchDocumentKind=(file:File)=>{
  const ext=launchDocumentExtension(file.name),mime=file.type.toLowerCase();
  if(mime.startsWith('image/')||['jpg','jpeg','png','webp','bmp','gif','svg'].includes(ext))return'IMAGE';
  if(['txt','md','csv','html','htm','xml'].includes(ext)||mime.startsWith('text/'))return'TEXT';
  if(ext==='pdf'||mime==='application/pdf')return'PDF';
  if(['docx','odt'].includes(ext)||mime.includes('wordprocessingml')||mime.includes('opendocument.text'))return'DOCUMENT';
  if(ext==='doc'||mime==='application/msword')return'LEGACY_WORD';
  return'UNKNOWN';
};

const createRequestScope = (request:Request,repo:PlatformRepository,artifacts?:ArtifactStoreLike,dataUseDefaultMode:DataUseDefaultMode='BETA_OPEN',documentAI?:WorkersAILike) => {
  const kernel=new PlatformKernel();
  const foundation=new FoundationService(repo,kernel); const ledger=new LedgerService(repo,kernel); const meetings=new MeetingService(repo,kernel); const discovery=new DiscoveryService(repo,kernel); const membershipGateway=new MembershipGatewayService(repo,kernel); const rubrics=new RubricKnowledgeService(repo,kernel);
  const completion=new CompletionSuiteService(repo,kernel);
  const explainability=new ExplainabilityService(repo,kernel); const documents=new DocumentSearchService(repo,kernel);
  const receivables=new ReceivablesService(repo,kernel); const treasury=new TreasuryService(repo,kernel,ledger); const riskFinance=new RiskFinanceService(repo,kernel,ledger); const market=new MarketService(repo,kernel); const community=new CommunityService(repo,kernel);
  const artifactStore=artifacts??new RepositoryArtifactStore(repo,kernel);
  const imports=new HistoricalImportService(repo,kernel,ledger,completion,artifactStore);
  const memberControl=new MemberFinancialControlService(repo,kernel);
  const memberEnvelopes=new MemberEnvelopeService(repo,kernel,ledger);
  const groupIdentity=new GroupIdentityService(repo,kernel);
  const conciergeLearning=new ConciergeLearningService(repo,kernel,dataUseDefaultMode);
  const miscRubrics=new MiscRubricService(repo,kernel,ledger);
  const adManager=new AdManagerService(repo,kernel,documentAI);
  const economicIntelligence=new EconomicIntelligenceService(repo,kernel);
  const externalPrograms=new ExternalProgramsService(repo,kernel);
  const operationalCockpit=new OperationalCockpitService(repo,kernel,ledger);
  const businessStudio=new BusinessStudioService(repo,kernel);
  const knowledgeAcademy=new KnowledgeAcademyService(repo,kernel);
  const valueNetwork=new ValueNetworkService(repo,kernel);
  const creatorTalent=new CreatorTalentService(repo,kernel,businessStudio,community);
  const quietWatch=new QuietWatchService(repo,kernel);
  const tenantId=request.headers.get('x-tenant-id')??'tenant_demo'; const actorId=request.headers.get('x-actor-id')??'user_founder';
  const groupRoles=(request.headers.get('x-group-roles')??'founder,manager').split(',').map(x=>x.trim()).filter(Boolean);
  kernel.context.set({actorId,tenantId,activeGroupId:request.headers.get('x-active-group-id')??undefined,groupRoles,mandateIds:[],mandateGrants:[],deviceId:request.headers.get('x-device-id')??'device_web_demo',sessionId:request.headers.get('x-session-id')??'session_demo',locale:request.headers.get('accept-language')?.toLowerCase().startsWith('en')?'en':'fr',timezone:request.headers.get('x-timezone')??'Africa/Douala',connectivity:'online',requestId:request.headers.get('x-request-id')??makeId('req')});
  return {kernel,foundation,ledger,meetings,discovery,membershipGateway,rubrics,completion,explainability,documents,receivables,treasury,riskFinance,market,community,imports,artifactStore,memberControl,memberEnvelopes,groupIdentity,conciergeLearning,miscRubrics,adManager,economicIntelligence,externalPrograms,operationalCockpit,businessStudio,knowledgeAcademy,valueNetwork,creatorTalent,quietWatch};
};

const inboxFor = async (repo:PlatformRepository,tenantId:string,actorId:string) => {
  const obligations=(await repo.listObligations(tenantId,actorId)).filter(x=>x.status==='open'||x.status==='overdue').map(x=>({id:x.id,kind:'obligation',title:x.title,priority:x.priority,status:x.status,groupId:x.groupId,dueAt:x.dueAt,sourceType:x.sourceType,sourceId:x.sourceId}));
  const cases=(await repo.listCases(tenantId,actorId)).filter(x=>x.status!=='CLOSED').map(x=>({id:x.id,kind:'case',title:x.summary,priority:'normal',status:x.status,groupId:x.groupId}));
  return [...obligations,...cases];
};

export const createApiHandler = (repo:PlatformRepository = defaultRepo,options:{artifacts?:ArtifactStoreLike;documentAI?:WorkersAILike;liveNamespace?:DurableObjectNamespaceLike;premiumLive?:boolean;referralBudgets?:ReferralBudgetStore;founderLearning?:FounderLearningStore;founderControl?:FounderControlStore;communityRealtime?:CommunityRealtimeStore;founderTeamActors?:Set<string>;commercialPreferences?:CommercialPreferenceService;groupPairing?:GroupPairingService;interestCommunities?:InterestCommunityService;ecoPulse?:EcoPulseService;identityProof?:IdentityProofService;dataUseDefaultMode?:DataUseDefaultMode;governanceSecret?:string;releaseCommitSha?:string}={}) => async (request:Request):Promise<Response> => {
  const url=new URL(request.url); const cors=corsHeaders(request);
  if(request.method==='OPTIONS'){
    const allowed=Boolean((cors as Record<string,string>)['access-control-allow-origin']);
    return new Response(null,{status:allowed?204:403,headers:{...baseSecurityHeaders,...cors,'access-control-allow-methods':'GET,POST,PUT,OPTIONS','access-control-allow-headers':'content-type,x-tenant-id,x-actor-id,x-group-roles,x-active-group-id,x-device-id,x-session-id,x-request-id,x-timezone'}});
  }
  const {kernel,foundation,ledger,meetings,discovery,membershipGateway,rubrics,completion,explainability,documents,receivables,treasury,riskFinance,market,community,imports,artifactStore,memberControl,memberEnvelopes,groupIdentity,conciergeLearning,miscRubrics,adManager,economicIntelligence,externalPrograms,operationalCockpit,businessStudio,knowledgeAcademy,valueNetwork,creatorTalent,quietWatch}=createRequestScope(request,repo,options.artifacts,options.dataUseDefaultMode??'BETA_OPEN',options.documentAI);
  let ctx=kernel.context.get();
  const trustedLiveTicket=request.headers.get('x-live-ticket-authenticated')==='1';
  if(!trustedLiveTicket)try{
    const at=Date.now(),rows=await repo.listWorkspaceRecords(ctx.tenantId,'MANAGER.BUSINESS_STUDIO'),grants=rows.filter(r=>r.data.businessKind==='MANDATE'&&r.status==='ACTIVE'&&r.data.mandateState==='ACTIVE'&&String(r.data.delegateUserId??'')===ctx.actorId&&Date.parse(String(r.data.startsAt??''))<=at&&(!r.data.endsAt||Date.parse(String(r.data.endsAt))>at)).map(r=>{let permissions:string[]=[];try{permissions=JSON.parse(String(r.data.delegatedRightsJson??'[]'));}catch{}return{mandateId:r.id,groupId:String(r.data.groupId??''),permissions:[...new Set(permissions.map(x=>String(x).toUpperCase()))],startsAt:String(r.data.startsAt??''),endsAt:r.data.endsAt?String(r.data.endsAt):undefined};}).filter(g=>g.groupId&&g.permissions.length);
    kernel.context.set({...ctx,mandateIds:grants.map(g=>g.mandateId),mandateGrants:grants});ctx=kernel.context.get();
  }catch{}
  const governanceVotes=new GovernanceVoteService(repo,kernel,options.governanceSecret??'eco-system-nonproduction-governance-secret');
  const notifications=new NotificationService(repo,kernel);
  const growthReferral=new GrowthReferralService(repo,kernel,options.referralBudgets??defaultReferralBudgets);
  const reconstitution=new GroupReconstitutionService(repo,kernel);
  const rubricExceptions=new RubricExceptionService(repo,kernel);
  const timeMachine=new TimeMachineService(repo,kernel);
  const nextOfKin=new NextOfKinService(repo,kernel);
  const anticipation=new AnticipationService(repo,kernel);
  const microAds=new CommunityMicroAdService(repo,kernel,valueNetwork);
  const valueDiscovery=new ValueDiscoveryService(repo,kernel);
  const safety=new SafetyCaseService(repo,kernel);
  const trustGraph=new CommitmentTrustGraphService(repo,kernel);
  const reopenAuth=new MeetingReopenAuthorizationService(repo,kernel);
  const prepayments=new PrepaymentService(repo,kernel,ledger);
  const wallet=new WalletService(repo,kernel,ledger);
  const opportunityGraph=new OpportunityGraphService(repo,kernel);
  const starterKit=new StarterKitService(repo,kernel);
  const groupModels=new GroupModelRegistryService(repo,kernel);
  const groupCaseLaw=new GroupCaseLawService(repo,kernel);
  const founderAI=new FounderAIService();
  if(options.premiumLive)kernel.features.set('premium_live_ledger',true);
  const isFounderTeamActor=async()=>Boolean(options.founderTeamActors?.has(ctx.actorId))||Boolean(options.founderControl&&await options.founderControl.isPlatformOwner(ctx.actorId));
  const requireGroup=async(groupId:string,manage=false)=>{
    const group=await repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return group;
    const member=(await repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member || manage && !member.roles.some(r=>['founder','manager','admin','president','treasurer'].includes(r)))throw Error('FORBIDDEN_SCOPE');
    return group;
  };
  const liveStubFor=(groupId:string)=>{
    if(!options.premiumLive||!options.liveNamespace)throw new Error('PREMIUM_LIVE_LEDGER_DISABLED');
    // Stable tenant + group channel. No D1 read is needed merely to route a Live event.
    const channelKey=ctx.tenantId+':'+groupId;
    return{stub:options.liveNamespace.get(options.liveNamespace.idFromName(channelKey)),channelKey};
  };
  const publishLive=async(groupId:string,type:string,idempotencyKey:string,payload:Record<string,string|number|boolean|null>,targetUserId?:string)=>{
    if(!options.premiumLive||!options.liveNamespace)return;
    const {stub}=await liveStubFor(groupId);
    const response=await stub.fetch(new Request('https://group-live.internal/publish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,actorId:ctx.actorId,idempotencyKey,payload,targetUserId})}));
    if(!response.ok){
      const detail=(await response.text().catch(()=>'' )).slice(0,500);
      throw new Error('LIVE_PUBLISH_FAILED'+(detail?':'+detail:''));
    }
  };

  const dispatchContributionProjection=async(groupId:string,receipt:import('../../../packages/contracts/src/index.js').ContributionReceipt,entry:import('../../../packages/contracts/src/index.js').LedgerEntry)=>{
    const projectionId='financial_projection_'+entry.id,existing=await repo.getWorkspaceRecord(ctx.tenantId,projectionId);
    if(existing?.status==='DONE')return true;
    try{
      const positions=await ledger.receiptPositions(ctx.tenantId,groupId);
      const after=positions.filter(p=>p.membershipId===receipt.membershipId).reduce((n,p)=>n+p.netAmount,0);
      const meeting=receipt.meetingId?await repo.getMeeting(ctx.tenantId,groupId,receipt.meetingId):undefined,closed=meeting?.status==='closed';
      const notice=await memberControl.create({groupId,membershipId:receipt.membershipId,entry,operationType:'CASH_CONTRIBUTION',amount:receipt.amount.amount,currency:receipt.amount.currency,rubricId:receipt.rubricId,meetingId:receipt.meetingId,previousSituation:after-receipt.amount.amount,newSituation:after});
      const entryActor=await actorLabel(),entryMember=await memberLabel(groupId,receipt.membershipId),entryRubric=receipt.rubricId?await rubricLabel(groupId,receipt.rubricId):'Sans rubrique';
      await notifications.publish(groupId,{title:closed?'Saisie financière après clôture':'Nouvelle saisie financière',message:`${entryActor} a enregistré ${receipt.amount.amount} F CFA pour ${entryMember} · ${entryRubric}${closed?' après clôture de la séance':''}. Vérifiez cette opération.`,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[receipt.membershipId],priority:closed?'CRITICAL':'NORMAL',action:{view:'operations',anchor:'twoSheetWorkspace',meetingId:receipt.meetingId,membershipId:receipt.membershipId,rubricId:receipt.rubricId,label:'Voir la ligne concernée'}});
      // Keep the Live idempotency key deliberately short and stable. The old encoded notice id could exceed the DO limit.
      await publishLive(groupId,'FINANCIAL_NOTICE','financial-notice:'+entry.id,{noticeId:notice.id,ledgerEntryId:notice.ledgerEntryId,operationType:notice.operationType,amount:notice.amount,currency:notice.currency,previousSituation:notice.previousSituation??0,newSituation:notice.newSituation??0,meetingClosed:Boolean(closed),alertLevel:closed?'closed':'open'},notice.userId);
      if(receipt.meetingId&&receipt.rubricId){
        const cell=await financialCellState(groupId,receipt.meetingId,receipt.membershipId,receipt.rubricId);
        await publishLive(groupId,'MEETING_UPDATE','financial-cell-managers:'+entry.id,{meetingId:receipt.meetingId,kind:'FINANCIAL_CELL',operationType:'CASH_CONTRIBUTION',membershipId:receipt.membershipId,rubricId:receipt.rubricId,previousAmount:cell.current-receipt.amount.amount,newAmount:cell.current,cellVersion:cell.cellVersion,meetingClosed:Boolean(closed),actorId:ctx.actorId,actorName:entryActor});
      }
      if(existing)await repo.saveWorkspaceRecord({...existing,status:'DONE',tags:[...new Set(existing.tags.filter(t=>t!=='pending').concat('dispatched'))],data:{...existing.data,attemptCount:Number(existing.data.attemptCount??0)+1,lastError:null,dispatchedAt:new Date().toISOString()},updatedAt:new Date().toISOString()});
      return true;
    }catch(error){
      if(existing)await repo.saveWorkspaceRecord({...existing,status:'ACTIVE',tags:[...new Set(existing.tags.concat('pending','retry-required'))],data:{...existing.data,attemptCount:Number(existing.data.attemptCount??0)+1,lastError:(error instanceof Error?error.message:String(error)).slice(0,500)},updatedAt:new Date().toISOString()});
      return false;
    }
  };

  const managerUserIds=async(groupId:string)=>{
    const group=await requireGroup(groupId,true),ids=new Set<string>([group.createdBy]);
    for(const m of await repo.listMemberships(ctx.tenantId,groupId))if(m.status==='active'&&m.roles.some(r=>['founder','manager','admin','president','treasurer','secretary','auditor'].includes(r)))ids.add(m.userId);
    return [...ids];
  };
  const actorLabelFor=async(actorId:string)=>{const user=await repo.getUser(actorId);return user?.displayName??actorId;};
  const actorLabel=async()=>actorLabelFor(ctx.actorId);
  const memberLabel=async(groupId:string,membershipId:string)=>{const membership=await repo.getMembership(ctx.tenantId,groupId,membershipId);const user=membership?await repo.getUser(membership.userId):undefined;return user?.displayName??membershipId;};
  const rubricLabel=async(groupId:string,rubricId:string)=>{const rubric=await repo.getRubricDefinition(ctx.tenantId,groupId,rubricId);return rubric?.name??rubricId;};
  const notifyGovernanceChange=async(groupId:string,input:{title:string;message:string;priority?:'LOW'|'NORMAL'|'HIGH'|'CRITICAL';action?:{view:string;anchor?:string;meetingId?:string;membershipId?:string;rubricId?:string;entityKind?:string;entityId?:string;label?:string}})=>{
    const actor=await actorLabel();
    return notifications.publish(groupId,{title:input.title,message:`${input.message} · Auteur : ${actor}`,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:input.priority??'HIGH',action:input.action});
  };
  const financialCellState=async(groupId:string,meetingId:string,membershipId:string,rubricId:string)=>{
    const rows=(await ledger.receiptPositions(ctx.tenantId,groupId)).filter(x=>x.meetingId===meetingId&&x.membershipId===membershipId&&x.rubricId===rubricId&&x.netAmount!==0);
    const revision=await repo.getFinancialCellRevision(ctx.tenantId,groupId,meetingId,membershipId,rubricId,'XAF');
    return{rows,current:rows.reduce((n,x)=>n+x.netAmount,0),cellVersion:revision?.version??0,baselineActorId:rows.slice().reverse().find(x=>x.netAmount>0)?.receivedBy};
  };
  const dispatchFinancialCorrectionProjection=async(record:import('../../../packages/contracts/src/index.js').WorkspaceRecord):Promise<{ok:boolean;notice?:any}>=>{
    if(record.moduleId!=='FINANCE.CORRECTION_OUTBOX'||!record.groupId)return{ok:false};
    if(record.status==='DONE')return{ok:true};
    const d=record.data,groupId=record.groupId,operationId=String(d.operationId??''),membershipId=String(d.membershipId??''),meetingId=String(d.meetingId??''),rubricId=String(d.rubricId??''),entryId=String(d.primaryEntryId??''),previousAmount=finite(d.previousAmount),newAmount=finite(d.newAmount),reason=String(d.reason??'Correction de cellule financière');
    try{
      const [entry,meeting,targetMember]=await Promise.all([repo.getLedgerEntry(ctx.tenantId,groupId,entryId),repo.getMeeting(ctx.tenantId,groupId,meetingId),repo.getMembership(ctx.tenantId,groupId,membershipId)]);
      if(!entry||!meeting||!targetMember)throw Error('CORRECTION_PROJECTION_SOURCE_MISSING');
      const positions=await ledger.receiptPositions(ctx.tenantId,groupId),newSituation=positions.filter(x=>x.membershipId===membershipId).reduce((n,x)=>n+x.netAmount,0),previousSituation=newSituation-(newAmount-previousAmount);
      const notice=await memberControl.create({groupId,membershipId,entry,operationType:'FINANCIAL_CELL_CORRECTION',amount:newAmount,currency:'XAF',rubricId,meetingId,previousSituation,newSituation,previousAmount,newAmount,correctionReason:reason,selfBenefit:targetMember.userId===record.createdBy,requiresIndependentReview:false});
      const correctionActor=await actorLabelFor(record.createdBy),correctionMember=await memberLabel(groupId,membershipId),correctionRubric=await rubricLabel(groupId,rubricId),meetingWhen=new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(meeting.scheduledAt??meeting.openedAt)),changeWhen=new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(record.createdAt)),action={view:'operations',anchor:'twoSheetWorkspace',meetingId,membershipId,rubricId,label:'Voir la cellule modifiée'};
      await notifications.publish(groupId,{title:meeting.status==='closed'?'Séance clôturée modifiée':'Donnée financière corrigée',message:`${correctionMember} · ${correctionRubric} · ${meetingWhen} : ${previousAmount} → ${newAmount} F CFA. Auteur : ${correctionActor}. Modification : ${changeWhen}. Motif : ${reason}`,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:meeting.status==='closed'?'CRITICAL':'HIGH',action,idempotencyKey:'financial-correction:'+operationId+':managers'});
      await notifications.publish(groupId,{title:meeting.status==='closed'?'Votre compte a été corrigé après clôture':'Votre compte a été corrigé',message:`${correctionRubric} · ${meetingWhen} : ${previousAmount} → ${newAmount} F CFA. Auteur : ${correctionActor}. Modification : ${changeWhen}. Motif : ${reason}. Vous pouvez valider ou émettre une réserve.`,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[membershipId],priority:meeting.status==='closed'?'CRITICAL':'HIGH',action,idempotencyKey:'financial-correction:'+operationId+':member'});
      await publishLive(groupId,'FINANCIAL_NOTICE','financial-cell-correction:'+entry.id,{noticeId:notice.id,ledgerEntryId:entry.id,operationType:'FINANCIAL_CELL_CORRECTION',amount:newAmount,currency:'XAF',previousAmount,newAmount,meetingClosed:meeting.status==='closed',alertLevel:meeting.status==='closed'?'closed':'correction'},targetMember.userId);
      await publishLive(groupId,'MEETING_UPDATE','financial-cell-managers:'+entry.id,{meetingId,kind:'FINANCIAL_CELL_CORRECTION',operationType:'FINANCIAL_CELL_CORRECTION',membershipId,rubricId,previousAmount,newAmount,cellVersion:d.cellVersion===undefined?0:Number(d.cellVersion),meetingClosed:meeting.status==='closed',actorId:record.createdBy,actorName:correctionActor});
      await repo.saveWorkspaceRecord({...record,status:'DONE',tags:[...new Set(record.tags.filter(t=>!['pending','retry-required'].includes(t)).concat('dispatched'))],data:{...record.data,attemptCount:Number(record.data.attemptCount??0)+1,lastError:null,noticeId:notice.id,dispatchedAt:new Date().toISOString()},updatedAt:new Date().toISOString()});
      return{ok:true,notice};
    }catch(error){
      try{await repo.saveWorkspaceRecord({...record,status:'ACTIVE',tags:[...new Set(record.tags.concat('pending','retry-required'))],data:{...record.data,attemptCount:Number(record.data.attemptCount??0)+1,lastError:(error instanceof Error?error.message:String(error)).slice(0,500)},updatedAt:new Date().toISOString()});}catch{}
      return{ok:false};
    }
  };

  const applyFinancialCellTarget=async(input:{groupId:string;meetingId:string;membershipId:string;rubricId:string;targetAmount:number;expectedCurrentAmount?:number;expectedCellVersion?:number;reason:string;idempotencyKey:string;consensusId?:string;consensusVersion?:number;normalizedIntent?:{commandId:string;actorId:string;deviceId:string;deviceSequence:number;effectiveRecordedAtMs:number;clockQuality:'VERIFIED'}})=>{
    const group=await requireGroup(input.groupId,true),meeting=await repo.getMeeting(ctx.tenantId,input.groupId,input.meetingId);if(!meeting||meeting.status==='cancelled')throw Error('MEETING_NOT_FOUND');
    if(!Number.isSafeInteger(input.targetAmount)||input.targetAmount<0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    const beforeAll=await ledger.receiptPositions(ctx.tenantId,input.groupId),beforeSituation=beforeAll.filter(x=>x.membershipId===input.membershipId).reduce((n,x)=>n+x.netAmount,0);
    const state=await financialCellState(input.groupId,input.meetingId,input.membershipId,input.rubricId);
    if(state.current===input.targetAmount){
      if(!input.normalizedIntent)return{status:'NO_CHANGE',current:state.current,target:input.targetAmount};
      const stamp=await ledger.reaffirmCashContributionCell({tenantId:ctx.tenantId,groupId:input.groupId,
        meetingId:input.meetingId,membershipId:input.membershipId,rubricId:input.rubricId,
        amount:input.targetAmount,expectedCellVersion:input.expectedCellVersion??state.cellVersion,
        idempotencyKey:input.idempotencyKey,intent:input.normalizedIntent});
      return{status:'NO_AMOUNT_CHANGE',current:state.current,target:input.targetAmount,
        newAmount:input.targetAmount,cellVersion:stamp.cellVersion};
    }
    const reason=input.reason.trim()||'Correction de cellule financière';
    const correction=await ledger.replaceCashContributionCell({
      tenantId:ctx.tenantId,groupId:input.groupId,meetingId:input.meetingId,membershipId:input.membershipId,rubricId:input.rubricId,
      targetAmount:input.targetAmount,expectedCurrentAmount:input.expectedCurrentAmount??state.current,expectedCellVersion:input.expectedCellVersion??state.cellVersion,currency:'XAF',
      reason,idempotencyKey:input.idempotencyKey,normalizedIntent:input.normalizedIntent
    },ctx.requestId);
    const receipt=correction.receipt,evidenceEntry=correction.evidenceEntry;
    if(!evidenceEntry)throw Error('FINANCIAL_CORRECTION_NOT_APPLIED');
    const outbox=correction.operationId?await repo.getWorkspaceRecord(ctx.tenantId,'financial_correction_outbox_'+correction.operationId):undefined;
    const delivery=outbox?await dispatchFinancialCorrectionProjection(outbox):{ok:false};
    return{status:'APPLIED',current:state.current,target:input.targetAmount,previousAmount:state.current,newAmount:input.targetAmount,cellVersion:correction.cellVersion,receipt,notice:delivery.notice??null,deliveryPending:!delivery.ok,groupId:group.id};
  };

  // Trusted clock quality is added only by authenticatedApi, never by client.
  // Unsupported/offline-unanchored clocks remain persistent review proposals.
  const applyRecordedCellV2=async(input:{
    groupId:string;meetingId:string;membershipId:string;rubricId:string;targetAmount:number;
    baselineValue:number;baselineVersion:number;recordedAtClient:string;
    clockAnchorId?:string;deviceId:string;deviceSequence:number;commandId:string;reason:string;
  })=>{
    await requireGroup(input.groupId,true);
    const key=String(input.commandId||''),
      orderId=financialCellWinnerRecordId(ctx.tenantId,input.groupId,input.meetingId,input.membershipId,input.rubricId),
      receiptId=financialCellIntentRecordId(ctx.tenantId,input.groupId,key),
      normalizedMs=Number(request.headers.get('x-eco-recorded-at-ms')),
      quality=String(request.headers.get('x-eco-clock-quality')||'UNVERIFIABLE');
    if(!key.startsWith('cell-target:')||!input.meetingId||!input.membershipId||!input.rubricId||
       !Number.isSafeInteger(input.targetAmount)||input.targetAmount<0)throw Error('CELL_INTENT_INVALID');
    const existing=await repo.getWorkspaceRecord(ctx.tenantId,receiptId);
    if(existing){
      if(existing.createdBy!==ctx.actorId||Number(existing.data.targetAmount)!==input.targetAmount||
         String(existing.data.meetingId||'')!==input.meetingId||
         String(existing.data.membershipId||'')!==input.membershipId||
         String(existing.data.rubricId||'')!==input.rubricId)throw Error('IDEMPOTENCY_CONFLICT');
      const current=await financialCellState(input.groupId,input.meetingId,input.membershipId,input.rubricId);
      return{accepted:true,stored:true,replayed:true,status:String(existing.data.status||'RECORDED'),
        targetAmount:input.targetAmount,canonicalAmount:current.current,cellVersion:current.cellVersion};
    }
    const recordReview=async(status:'CLOCK_REVIEW'|'SUPERSEDED',amount:number,version:number)=>{
      const stamp=new Date().toISOString(),receipt:import('../../../packages/contracts/src/index.js').WorkspaceRecord={
        id:receiptId,tenantId:ctx.tenantId,groupId:input.groupId,
        moduleId:'FINANCE.CELL_INTENT_V2',title:'Intention financière historisée',
        summary:status,status:status==='SUPERSEDED'?'DONE':'ACTIVE',
        tags:['finance','cell-intent',status.toLowerCase()],
        data:{meetingId:input.meetingId,membershipId:input.membershipId,
          rubricId:input.rubricId,commandId:key,targetAmount:input.targetAmount,
          canonicalAmount:amount,cellVersion:version,status,deviceId:input.deviceId,
          deviceSequence:input.deviceSequence,recordedAtClient:input.recordedAtClient,
          clockQuality:quality},
        createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp
      };
      await repo.saveWorkspaceRecord(receipt);
      if(status==='SUPERSEDED'){
        const actor=await actorLabel(),member=await memberLabel(input.groupId,input.membershipId),
          rubric=await rubricLabel(input.groupId,input.rubricId),
          textMessage=actor+' : ancien montant '+input.targetAmount+' F CFA remplacé par '+
            amount+' F CFA pour '+member+' · '+rubric+
            '. L’intention rejetée reste conservée et contestable.';
        const action={view:'operations',anchor:'twoSheetWorkspace',meetingId:input.meetingId,
          membershipId:input.membershipId,rubricId:input.rubricId,label:'Consulter la modification'};
        await notifications.publish(input.groupId,{
          title:'Saisie concurrente supplantée',message:textMessage,channels:['IN_APP','WEB_PUSH'],
          audience:'MANAGERS',priority:'HIGH',action,idempotencyKey:receiptId+':managers'});
        await notifications.publish(input.groupId,{
          title:'Modification concurrente de votre compte',message:textMessage,channels:['IN_APP','WEB_PUSH'],
          audience:'SELECTED',selectedMembershipIds:[input.membershipId],
          priority:'HIGH',action,idempotencyKey:receiptId+':member'});
      }
      return{accepted:true,stored:true,status,targetAmount:input.targetAmount,
        canonicalAmount:amount,cellVersion:version};
    };
    const trusted=quality==='VERIFIED'&&Number.isSafeInteger(normalizedMs)&&normalizedMs>0&&
      String(input.deviceId||'').length>3&&Number.isSafeInteger(input.deviceSequence)&&input.deviceSequence>0;
    if(!trusted){
      const state=await financialCellState(input.groupId,input.meetingId,input.membershipId,input.rubricId);
      return recordReview('CLOCK_REVIEW',state.current,state.cellVersion);
    }
    const intent={commandId:key,actorId:ctx.actorId,deviceId:input.deviceId,
      deviceSequence:input.deviceSequence,effectiveRecordedAtMs:normalizedMs,clockQuality:'VERIFIED' as const};
    for(let retry=0;retry<5;retry++){
      const state=await financialCellState(input.groupId,input.meetingId,input.membershipId,input.rubricId);
      const record=await repo.getWorkspaceRecord(ctx.tenantId,orderId);
      const previous=record&&record.moduleId==='FINANCE.CELL_ORDER_V2'&&
        Number(record.data.cellVersion)===state.cellVersion?record:null;
      if(record&&!previous)return recordReview('CLOCK_REVIEW',state.current,state.cellVersion);
      if(previous){
        const value=previous.data,order=compareNormalizedCellIntents(intent,{
          commandId:String(value.commandId||''),deviceId:String(value.deviceId||''),
          deviceSequence:Number(value.deviceSequence),
          effectiveRecordedAtMs:Number(value.effectiveRecordedAtMs),
          clockQuality:value.clockQuality==='VERIFIED'?'VERIFIED':'UNVERIFIABLE'
        });
        if(order==='CLOCK_REVIEW')return recordReview('CLOCK_REVIEW',state.current,state.cellVersion);
        if(order==='SAME')throw Error('IDEMPOTENCY_CONFLICT');
        if(order==='OLDER'){
          const revision=await repo.getFinancialCellRevision(ctx.tenantId,input.groupId,
            input.meetingId,input.membershipId,input.rubricId,'XAF');
          if((revision?.version??0)!==state.cellVersion)continue;
          return recordReview('SUPERSEDED',state.current,state.cellVersion);
        }
      }else if(state.cellVersion!==input.baselineVersion){
        // Mixed-release V1 corrections have no verifiable record time.
        return recordReview('CLOCK_REVIEW',state.current,state.cellVersion);
      }
      try{
        const result=await applyFinancialCellTarget({groupId:input.groupId,meetingId:input.meetingId,
          membershipId:input.membershipId,rubricId:input.rubricId,targetAmount:input.targetAmount,
          expectedCurrentAmount:state.current,expectedCellVersion:state.cellVersion,
          reason:input.reason||'Saisie enregistrée et synchronisée',
          idempotencyKey:key,normalizedIntent:intent});
        if(result.status==='NO_AMOUNT_CHANGE'){
          await publishLive(input.groupId,'MEETING_UPDATE','cell-reaffirm:'+key,{
            meetingId:input.meetingId,membershipId:input.membershipId,rubricId:input.rubricId,
            kind:'FINANCIAL_CELL',operationType:'CELL_RECONFIRMED',
            previousAmount:state.current,newAmount:input.targetAmount,
            cellVersion:Number(result.cellVersion??state.cellVersion+1),actorId:ctx.actorId});
          const membership=await repo.getMembership(ctx.tenantId,input.groupId,input.membershipId);
          if(membership)await publishLive(input.groupId,'MEMBER_PROJECTION_UPDATED',
            'reaffirm-member:'+key,{meetingId:input.meetingId,
              membershipId:input.membershipId,rubricId:input.rubricId,amount:input.targetAmount,
              cellVersion:Number(result.cellVersion??state.cellVersion+1)},membership.userId);
        }
        return{...result,accepted:true,stored:true,canonicalAmount:input.targetAmount};
      }catch(error){
        if(error instanceof Error&&['CELL_VERSION_CONFLICT','CELL_VALUE_CONFLICT'].includes(error.message))continue;
        throw error;
      }
    }
    throw Error('CELL_CONCURRENCY_RETRY_REQUIRED');
  };

  const applyFinancialReview=async(input:{groupId:string;meetingId:string;membershipId:string;rubricId:string;decision:string;reason:string;amount:number;cellVersion:number})=>{
    const {groupId,meetingId,membershipId,rubricId,decision,reason}=input;
    await requireGroup(groupId,true);
    if(!membershipId||!rubricId||!['APPROVE','RESERVE'].includes(decision))throw Error('INVALID_CELL_REVIEW');
      const [meeting,membership,rubric]=await Promise.all([
        repo.getMeeting(ctx.tenantId,groupId,meetingId),
        repo.getMembership(ctx.tenantId,groupId,membershipId),
        repo.getRubricDefinition(ctx.tenantId,groupId,rubricId)
      ]);
      if(!meeting||meeting.status==='cancelled'||!membership||!rubric)throw Error('CELL_REVIEW_SCOPE_INVALID');
      const rubricName=String(rubric.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
        rubricKind=String(rubric.activityPlan?.kind??'').toUpperCase(),
        rubricSystem=String(rubric.facets?.custom?.systemKey??'').toUpperCase();
      if(['LOAN','REPAYMENT'].includes(rubricKind)||['LOAN','REPAYMENT'].includes(rubricSystem)||
        /pret|emprunt|loan|remboursement|repayment/.test(rubricName)||rubric.facets?.direction==='OUTFLOW')
        throw Error('SPECIALIZED_FINANCIAL_REVIEW_REQUIRED');
      const current=await financialCellState(groupId,meetingId,membershipId,rubricId),
        expectedVersion=finite(input.cellVersion,-1),expectedAmount=finite(input.amount,-1);
      if(current.cellVersion!==expectedVersion||current.current!==expectedAmount)throw Error('CELL_REVIEW_STALE');
      const consensus=new MeetingLiveConsensusService(repo,kernel);
      const outcome=await consensus.reviewCanonicalCell({groupId,meetingId,membershipId,rubricId,
        amount:current.current,cellVersion:current.cellVersion,reason,
        decision:decision as 'APPROVE'|'RESERVE'});
      if(decision==='RESERVE'){
        const actor=await actorLabel(),member=await memberLabel(groupId,membershipId),rubricName=await rubricLabel(groupId,rubricId);
        await notifications.publish(groupId,{
          title:'Contestation de cellule financière',
          message:`${actor} conteste ${member} · ${rubricName} : ${current.current} F CFA. Motif : ${reason}. La donnée reste applicable durant la procédure.`,
          channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:'HIGH',
          action:{view:'operations',anchor:'twoSheetWorkspace',meetingId,membershipId,rubricId,label:'Consulter la cellule'},
          idempotencyKey:outcome.review.id+':managers'
        });
        await notifications.publish(groupId,{
          title:'Une modification de votre compte est contestée',
          message:`${rubricName} : ${current.current} F CFA. Une vérification est ouverte. La valeur reste enregistrée tant qu’aucune décision ne la modifie.`,
          channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[membershipId],priority:'HIGH',
          action:{view:'operations',anchor:'twoSheetWorkspace',meetingId,membershipId,rubricId,label:'Consulter la situation'},
          idempotencyKey:outcome.review.id+':member'
        });
      }
      await publishLive(groupId,decision==='RESERVE'?'MANAGER_RESERVE':'CONSENSUS_SELECTED',
        outcome.review.id,{meetingId,membershipId,rubricId,cellVersion:current.cellVersion,
          amount:current.current,actorId:ctx.actorId,decision,reviewId:outcome.review.id,
          conflictNoticeId:decision==='RESERVE'?outcome.record.id:null});
      if(decision==='RESERVE')await publishLive(groupId,'MEMBER_PROJECTION_UPDATED',
        outcome.review.id+':member',{meetingId,membershipId,rubricId,cellVersion:current.cellVersion,
          amount:current.current,disputed:true},membership.userId);
      return {status:decision==='RESERVE'?'RESERVE_OPEN':'APPROVED',reviewId:outcome.review.id,
        currentAmount:current.current,cellVersion:current.cellVersion,canonicalUnchanged:true};
  };

  const jsonStringArray=(value:unknown):string[]=>{try{const parsed=JSON.parse(String(value??'[]'));return Array.isArray(parsed)?parsed.map(String):[];}catch{return[];}};
  const meetingMoment=(meeting:any)=>Date.parse(String(meeting?.scheduledAt??meeting?.openedAt??meeting?.createdAt??''))||0;
  const normalizedLoanInterestTiming=(value:unknown):'NEXT_SESSION_DUE'|'UPFRONT_DEDUCTED'|'UPFRONT_REQUIRED'=>['UPFRONT_DEDUCTED','UPFRONT_REQUIRED'].includes(String(value))?String(value) as any:'NEXT_SESSION_DUE';
  const loanPolicySnapshot=(policy:any)=>{
    const priority=['INTEREST_FIRST','EXPLICIT_ALLOCATION'].includes(String(policy?.paymentPriority))?String(policy.paymentPriority):'CAPITAL_FIRST';
    return{
      rateBasisPointsPerPeriod:Math.max(0,finite(policy?.rateBasisPointsPerPeriod,0)),
      paymentPriority:priority,
      interestTiming:normalizedLoanInterestTiming(policy?.interestTiming),
      fundingMode:String(policy?.fundingMode)==='SAVINGS_REPAYMENTS_ONLY'?'SAVINGS_REPAYMENTS_ONLY':'AVAILABLE_GROUP_CASH',
      carryForwardUnusedFunds:policy?.carryForwardUnusedFunds!==false
    };
  };
  const loanPolicyRevisions=(policy:any)=>Array.isArray(policy?.revisions)?policy.revisions.filter((x:any)=>x&&typeof x==='object'):[] as any[];
  const resolveLoanPolicyForOperation=(loan:any,policy:any,operationAtMs=Date.now())=>{
    const history=loanPolicyRevisions(policy).slice().sort((a:any,b:any)=>(Date.parse(String(a.effectiveAt??''))||0)-(Date.parse(String(b.effectiveAt??''))||0)||String(a.id??'').localeCompare(String(b.id??'')));
    const loanCreated=Date.parse(String(loan?.createdAt??loan?.data?.createdAt??loan?.updatedAt??''))||operationAtMs;
    const fallback=history.length?loanPolicySnapshot(history[0]?.before):loanPolicySnapshot(policy);
    const base=loan?.id?{
      rateBasisPointsPerPeriod:finite(loan?.data?.rateBasisPointsPerPeriod,fallback.rateBasisPointsPerPeriod),
      paymentPriority:['INTEREST_FIRST','EXPLICIT_ALLOCATION'].includes(String(loan?.data?.paymentPriority))?String(loan.data.paymentPriority):String(fallback.paymentPriority),
      interestTiming:normalizedLoanInterestTiming(loan?.data?.interestTiming??fallback.interestTiming),
      fundingMode:String(loan?.data?.fundingMode??fallback.fundingMode)==='SAVINGS_REPAYMENTS_ONLY'?'SAVINGS_REPAYMENTS_ONLY':'AVAILABLE_GROUP_CASH',
      carryForwardUnusedFunds:loan?.data?.carryForwardUnusedFunds===undefined?fallback.carryForwardUnusedFunds:loan.data.carryForwardUnusedFunds!==false
    }:fallback;
    const result:any={...base,policyRevisionId:String(loan?.data?.policyRevisionId??''),policyRevisionEffectiveAt:String(loan?.data?.policyRevisionEffectiveAt??'')};
    for(const revision of history){
      const effectiveMs=Date.parse(String(revision.effectiveAt??''));if(!Number.isFinite(effectiveMs)||effectiveMs>operationAtMs)continue;
      const scope=String(revision.scope??'NEW_LOANS_ONLY'),createdAfter=loanCreated>=effectiveMs;
      const selected=Array.isArray(revision.selectedLoanIds)&&revision.selectedLoanIds.map(String).includes(String(loan?.id??''));
      const applies=scope==='NEW_AND_ALL_OPEN_LOANS'||(scope==='NEW_AND_SELECTED_OPEN_LOANS'&&(createdAfter||selected))||(scope==='NEW_LOANS_ONLY'&&createdAfter);
      if(!applies)continue;
      Object.assign(result,loanPolicySnapshot(revision.after),{policyRevisionId:String(revision.id??''),policyRevisionEffectiveAt:String(revision.effectiveAt??'')});
    }
    return result;
  };
  const updateRubricPoliciesGoverned=async(groupId:string,rubricId:string,policies:RubricPolicies)=>{
    const current=await repo.getRubricDefinition(ctx.tenantId,groupId,rubricId);if(!current)throw Error('RUBRIC_NOT_FOUND');
    const incoming:any=structuredClone(policies??{}),incomingLoan:any=incoming.loan;
    if(!incomingLoan)return{updated:await rubrics.updatePolicies({tenantId:ctx.tenantId,groupId,rubricId,policies:incoming}),revision:null,affectedLoanIds:[] as string[]};
    const prior:any=current.policies?.loan??{},serverHistory=loanPolicyRevisions(prior);
    const control:any=incomingLoan.changeControl;
    const {changeControl:_discarded,revisions:_untrusted,...loanFields}=incomingLoan;
    if(!control){
      incoming.loan={...loanFields,revisions:serverHistory};
      return{updated:await rubrics.updatePolicies({tenantId:ctx.tenantId,groupId,rubricId,policies:incoming}),revision:null,affectedLoanIds:[] as string[]};
    }
    const commandId=String(control.commandId??makeId('loan_policy_change')),revisionId='loan_policy_revision_'+commandId.replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,140);
    const duplicate=serverHistory.find((x:any)=>String(x.id)===revisionId);
    if(duplicate)return{updated:current,revision:duplicate,affectedLoanIds:[] as string[]};
    const scope=['NEW_AND_ALL_OPEN_LOANS','NEW_AND_SELECTED_OPEN_LOANS'].includes(String(control.scope))?String(control.scope):'NEW_LOANS_ONLY';
    const selectedLoanIds=[...new Set((Array.isArray(control.selectedLoanIds)?control.selectedLoanIds:[]).map(String).filter(Boolean))];
    if(scope==='NEW_AND_SELECTED_OPEN_LOANS'&&!selectedLoanIds.length)throw Error('LOAN_POLICY_SELECTED_LOANS_REQUIRED');
    const effectiveMode=String(control.effectiveMode??'IMMEDIATE');
    let effectiveAt=new Date().toISOString(),effectiveMeetingId='';
    if(effectiveMode==='DATE'){
      const ms=Date.parse(String(control.effectiveAt??''));if(!Number.isFinite(ms))throw Error('LOAN_POLICY_EFFECTIVE_DATE_INVALID');effectiveAt=new Date(ms).toISOString();
    }else if(effectiveMode==='MEETING'){
      effectiveMeetingId=String(control.effectiveMeetingId??'');if(!effectiveMeetingId)throw Error('LOAN_POLICY_EFFECTIVE_MEETING_REQUIRED');
      const meeting=await repo.getMeeting(ctx.tenantId,groupId,effectiveMeetingId);if(!meeting)throw Error('MEETING_NOT_FOUND');
      const ms=meetingMoment(meeting);if(!ms)throw Error('LOAN_POLICY_EFFECTIVE_MEETING_DATE_REQUIRED');effectiveAt=new Date(ms).toISOString();
    }
    const allLoans=await completion.list(groupId,'LOAN'),openStates=new Set(['SUBMITTED','APPROVED','DISBURSED','REPAYING']);
    const eligibleOpen=allLoans.filter((loan:any)=>openStates.has(String(loan.data?.completionState??'')));
    if(scope==='NEW_AND_SELECTED_OPEN_LOANS'){
      const known=new Set(eligibleOpen.map((x:any)=>String(x.id))),missing=selectedLoanIds.filter(id=>!known.has(id));if(missing.length)throw Error('LOAN_POLICY_SELECTED_LOAN_NOT_OPEN');
    }
    const revision:any={id:revisionId,createdAt:new Date().toISOString(),createdBy:ctx.actorId,effectiveAt,effectiveMeetingId:effectiveMeetingId||undefined,scope,selectedLoanIds:scope==='NEW_AND_SELECTED_OPEN_LOANS'?selectedLoanIds:undefined,before:loanPolicySnapshot(prior),after:loanPolicySnapshot(loanFields)};
    incoming.loan={...loanFields,revisions:[...serverHistory,revision]};
    const updated=await rubrics.updatePolicies({tenantId:ctx.tenantId,groupId,rubricId,policies:incoming});
    const affectedLoanIds=scope==='NEW_AND_ALL_OPEN_LOANS'?eligibleOpen.map((x:any)=>String(x.id)):scope==='NEW_AND_SELECTED_OPEN_LOANS'?selectedLoanIds:[];
    return{updated,revision,affectedLoanIds};
  };
  const loanFundingReservationId=(key:string)=>'loan_funding_reservation_'+encodeURIComponent(key).slice(0,160);
  const loanFundingAvailability=async(input:{groupId:string;meetingId?:string;mode:'SAVINGS_REPAYMENTS_ONLY'|'AVAILABLE_GROUP_CASH';carryForward:boolean;currency:string;extraRepayment?:number})=>{
    if(!input.carryForward&&!input.meetingId)throw Error('MEETING_REQUIRED_FOR_SESSION_ONLY_LOAN_FUNDING');
    const [summary,rubricRows,positions,sheetEvents,reservations]=await Promise.all([
      ledger.summary(ctx.tenantId,input.groupId,input.currency),repo.listRubricDefinitions(ctx.tenantId,input.groupId),ledger.receiptPositions(ctx.tenantId,input.groupId),
      repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.SHEET_EVENT',input.groupId),repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.LOANS',input.groupId)
    ]);
    const scoped=<T extends {meetingId?:unknown}>(rows:T[])=>input.carryForward?rows:rows.filter(x=>String(x.meetingId??'')===String(input.meetingId??''));
    const extra=Math.max(0,Number(input.extraRepayment??0)),now=Date.now();
    const activeReservations=reservations.filter(x=>x.status==='ACTIVE'&&x.tags.includes('loan-funding-reservation')&&Date.parse(String(x.data.expiresAt??''))>now&&(input.carryForward||String(x.data.meetingId??'')===String(input.meetingId??'')));
    const reserved=activeReservations.reduce((n,x)=>n+Math.max(0,Number(x.data.amount??0)),0);
    let basis=0;
    if(input.mode==='AVAILABLE_GROUP_CASH'&&input.carryForward)basis=Math.max(0,Number(summary.cashBalance??0)+extra);
    else{
      const normalized=(v:unknown)=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      const savingsIds=new Set(rubricRows.filter(r=>{const kind=String(r.activityPlan?.kind??'').toUpperCase(),system=String(r.facets?.custom?.systemKey??'').toUpperCase(),name=normalized(r.name),semantic=String(r.facets?.refundability??'')==='FULLY_REFUNDABLE'&&String(r.facets?.direction??'')!=='OUTFLOW'&&String(r.facets?.interestMode??'')==='CUSTOM';return kind==='SAVINGS'||/SAVINGS|EPARGNE/.test(system)||/epargne|saving/.test(name)||semantic;}).map(r=>r.id));
      const receiptPool=scoped(positions as any[]).filter((p:any)=>Number(p.netAmount??0)>0&&(input.mode==='AVAILABLE_GROUP_CASH'||savingsIds.has(String(p.rubricId??'')))).reduce((n:number,p:any)=>n+Number(p.netAmount??0),0);
      const scopedEvents=scoped((sheetEvents as any[]).map(x=>({meetingId:x.data?.meetingId,x}))).map(x=>x.x),repayments=scopedEvents.filter((x:any)=>String(x.data?.direction??'').toUpperCase()==='IN'&&Boolean(x.data?.loanId)).reduce((n:number,x:any)=>n+Math.abs(Number(x.data?.amount??0)),0),outflows=scopedEvents.filter((x:any)=>String(x.data?.direction??'').toUpperCase()==='OUT'&&(input.mode==='AVAILABLE_GROUP_CASH'||Boolean(x.data?.loanId))).reduce((n:number,x:any)=>n+Math.abs(Number(x.data?.amount??0)),0);
      basis=Math.max(0,receiptPool+repayments+extra-outflows);
      basis=Math.min(basis,Math.max(0,Number(summary.cashBalance??0)+extra));
    }
    return{basis,reserved,available:Math.max(0,basis-reserved),cashBalance:Number(summary.cashBalance??0),mode:input.mode};
  };

  const disburseApprovedLoan=async(input:{groupId:string;loan:any;principal:number;expectedVersion:number;meetingId?:string;rubricId?:string;idempotencyKey:string})=>{
    let loan=input.loan;const initialState=String(loan.data.completionState??''),policyRubricId=input.rubricId??String(loan.data.rubricId??''),policyRubric=policyRubricId?await repo.getRubricDefinition(ctx.tenantId,input.groupId,policyRubricId):undefined,effectivePolicy=resolveLoanPolicyForOperation(loan,policyRubric?.policies?.loan,Date.now()),timing=normalizedLoanInterestTiming(effectivePolicy.interestTiming),rate=finite(effectivePolicy.rateBasisPointsPerPeriod,0),effectivePriority=String(effectivePolicy.paymentPriority??'CAPITAL_FIRST'),upfrontInterest=timing==='NEXT_SESSION_DUE'?0:Math.round(input.principal*rate/10000),upfrontKey=input.idempotencyKey+':upfront-interest';
    let upfrontEntry=upfrontInterest>0?await repo.findLedgerEntryByIdempotency(ctx.tenantId,input.groupId,upfrontKey):undefined,entry=await repo.findLedgerEntryByIdempotency(ctx.tenantId,input.groupId,input.idempotencyKey),fundingReservation:WorkspaceRecord|undefined;
    const upfrontEntryExisted=Boolean(upfrontEntry);
    if(initialState==='APPROVED'&&!entry){
      const mode=String(effectivePolicy.fundingMode??'AVAILABLE_GROUP_CASH')==='SAVINGS_REPAYMENTS_ONLY'?'SAVINGS_REPAYMENTS_ONLY':'AVAILABLE_GROUP_CASH',carryForward=effectivePolicy.carryForwardUnusedFunds!==false;
      if(mode==='SAVINGS_REPAYMENTS_ONLY'&&!input.meetingId)throw Error('MEETING_REQUIRED_FOR_RESTRICTED_LOAN_FUNDING');
      const reservationId=loanFundingReservationId(input.idempotencyKey),existing=await repo.getWorkspaceRecord(ctx.tenantId,reservationId),stamp=new Date().toISOString(),expiresAt=new Date(Date.now()+60_000).toISOString();
      if(existing&&Number(existing.data.amount??0)!==input.principal)throw Error('IDEMPOTENCY_CONFLICT');
      fundingReservation={id:reservationId,tenantId:ctx.tenantId,groupId:input.groupId,moduleId:'FINANCE.LOANS',title:'Réservation de liquidité prêt',summary:'Réservation anti-double-décaissement à durée courte.',status:'ACTIVE',tags:['loan-funding-reservation','loan:'+loan.id],data:{loanId:loan.id,meetingId:input.meetingId??'',amount:input.principal,mode,carryForward,expiresAt},createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp};
      await repo.saveWorkspaceRecord(fundingReservation);
      const availability=await loanFundingAvailability({groupId:input.groupId,meetingId:input.meetingId,mode,carryForward,currency:String(loan.data.currency??'XAF'),extraRepayment:timing==='UPFRONT_REQUIRED'?upfrontInterest:0});
      if(availability.available<0||availability.basis<availability.reserved){await repo.saveWorkspaceRecord({...fundingReservation,status:'ARCHIVED',data:{...fundingReservation.data,rejectedAt:new Date().toISOString(),basis:availability.basis,reserved:availability.reserved},updatedAt:new Date().toISOString()});throw Error(mode==='SAVINGS_REPAYMENTS_ONLY'?'INSUFFICIENT_AUTHORIZED_LOAN_FUNDS':'INSUFFICIENT_CASH');}
    }
    if(initialState==='APPROVED'){
      if(timing==='UPFRONT_REQUIRED'&&upfrontInterest>0&&!upfrontEntry){
        const balance=(await ledger.summary(ctx.tenantId,input.groupId,String(loan.data.currency??'XAF'))).cashBalance;
        if(balance+upfrontInterest<input.principal)throw Error('INSUFFICIENT_CASH');
        upfrontEntry=await ledger.recordLoanRepayment({tenantId:ctx.tenantId,groupId:input.groupId,principalAmount:0,interestAmount:upfrontInterest,currency:String(loan.data.currency??'XAF'),sourceId:loan.id,meetingId:input.meetingId,idempotencyKey:upfrontKey});
      }
      if(!entry)entry=await ledger.recordCashMovement({tenantId:ctx.tenantId,groupId:input.groupId,amount:input.principal,currency:String(loan.data.currency??'XAF'),direction:'out',counterAccountCode:'LOAN_RECEIVABLE',counterAccountType:'asset',descriptionCode:'LEDGER_LOAN_DISBURSEMENT',sourceType:'loan',sourceId:loan.id,meetingId:input.meetingId,idempotencyKey:input.idempotencyKey,kind:'loan_disbursement'});
      const cashAfter=await ledger.summary(ctx.tenantId,input.groupId,String(loan.data.currency??'XAF'));if(Number(cashAfter.cashBalance??0)<0&&entry){await ledger.reverseEntry({tenantId:ctx.tenantId,groupId:input.groupId,entryId:entry.id,reason:'Décaissement concurrent refusé : caisse négative'});if(upfrontEntry&&!upfrontEntryExisted)await ledger.reverseEntry({tenantId:ctx.tenantId,groupId:input.groupId,entryId:upfrontEntry.id,reason:'Annulation de l’intérêt préalable créé pendant cette tentative car le prêt n’a pas pu être décaissé'});if(fundingReservation)await repo.saveWorkspaceRecord({...fundingReservation,status:'ARCHIVED',data:{...fundingReservation.data,rejectedAt:new Date().toISOString(),reason:'NEGATIVE_CASH_AFTER_CONCURRENT_DISBURSEMENT'},updatedAt:new Date().toISOString()});throw Error('INSUFFICIENT_CASH_CONCURRENT');}
      if(timing==='UPFRONT_DEDUCTED'&&upfrontInterest>0&&!upfrontEntry)upfrontEntry=await ledger.recordLoanRepayment({tenantId:ctx.tenantId,groupId:input.groupId,principalAmount:0,interestAmount:upfrontInterest,currency:String(loan.data.currency??'XAF'),sourceId:loan.id,meetingId:input.meetingId,idempotencyKey:upfrontKey});
      loan=await completion.transition(input.groupId,loan.id,'DISBURSED',{expectedVersion:input.expectedVersion,patch:{ledgerEntryId:entry.id,outstandingPrincipal:input.principal,unpaidInterest:0,accruedMeetingIdsJson:'[]',rateBasisPointsPerPeriod:rate,paymentPriority:effectivePriority,interestTiming:timing,fundingMode:effectivePolicy.fundingMode,carryForwardUnusedFunds:effectivePolicy.carryForwardUnusedFunds,policyRevisionId:effectivePolicy.policyRevisionId||loan.data.policyRevisionId,policyRevisionEffectiveAt:effectivePolicy.policyRevisionEffectiveAt||loan.data.policyRevisionEffectiveAt,upfrontInterestAmount:upfrontInterest,upfrontInterestLedgerEntryId:upfrontEntry?.id??'',upfrontInterestSourceMeetingId:input.meetingId??'',upfrontInterestSkipNextClose:upfrontInterest>0&&!input.meetingId,upfrontInterestPending:false,disbursedAt:entry.createdAt}});
    }else if(!['DISBURSED','REPAYING','CLOSED'].includes(initialState)||!entry)throw Error('LOAN_NOT_APPROVED');
    if(input.meetingId){
      const periodId='loan_period_'+encodeURIComponent(loan.id+'|'+input.meetingId),existing=await repo.getWorkspaceRecord(ctx.tenantId,periodId),stamp=entry!.createdAt,nextInterest=timing==='NEXT_SESSION_DUE'?Math.round(input.principal*rate/10000):0;
      await repo.saveWorkspaceRecord({id:periodId,tenantId:ctx.tenantId,groupId:input.groupId,moduleId:'FINANCE.LOAN_PERIOD',title:'Décaissement du prêt',summary:timing==='NEXT_SESSION_DUE'?'Capital décaissé ; intérêt de la prochaine séance encore projeté.':'Capital décaissé ; intérêt de la première période déjà perçu selon la politique du groupe.',status:'DONE',tags:['loan-period','loan:'+loan.id,'meeting:'+input.meetingId,'disbursement'],data:{loanId:loan.id,membershipId:String(loan.data.borrowerMembershipId??''),meetingId:input.meetingId,principalBefore:input.principal,interestOpening:0,interestNew:0,paymentAmount:upfrontInterest,principalPaid:0,interestPaid:upfrontInterest,principalAfter:input.principal,interestAfter:0,totalDebtAfter:input.principal,nextInterestProjected:nextInterest,nextTotalDueProjected:input.principal+nextInterest,priority:effectivePriority,rateBasisPointsPerPeriod:rate,interestTiming:timing,policyRevisionId:String(effectivePolicy.policyRevisionId??'')},createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp});
    }
    const rubricId=input.rubricId??String(loan.data.rubricId??'');if(rubricId&&input.meetingId){
      const eventId='sheet_loan_event_'+entry!.id,existing=await repo.getWorkspaceRecord(ctx.tenantId,eventId);if(!existing)await repo.saveWorkspaceRecord({id:eventId,tenantId:ctx.tenantId,groupId:input.groupId,moduleId:'FINANCE.SHEET_EVENT',title:'Prêt décaissé',summary:'Projection de feuille liée à l’écriture canonique du prêt.',status:'DONE',tags:['sheet-event','loan-disbursement','ledger:'+entry!.id],data:{membershipId:String(loan.data.borrowerMembershipId??''),meetingId:input.meetingId,rubricId,loanId:loan.id,ledgerEntryId:entry!.id,amount:input.principal,direction:'OUT'},createdBy:ctx.actorId,createdAt:entry!.createdAt,updatedAt:entry!.createdAt});
      await publishLive(input.groupId,'MEETING_UPDATE','loan-sheet-live:'+entry!.id,{meetingId:input.meetingId,kind:'FINANCIAL_CELL',operationType:'LOAN_DISBURSEMENT',membershipId:String(loan.data.borrowerMembershipId??''),rubricId,previousAmount:0,newAmount:input.principal,meetingClosed:false,actorId:ctx.actorId,actorName:await actorLabel()});
    }
    if(fundingReservation)await repo.saveWorkspaceRecord({...fundingReservation,status:'DONE',data:{...fundingReservation.data,ledgerEntryId:entry!.id,confirmedAt:new Date().toISOString()},updatedAt:new Date().toISOString()});
    return{entry:entry!,upfrontInterestEntry:upfrontEntry??null,upfrontInterest,interestTiming:timing,loan};
  };
  const accrueLoanInterestAfterMeetingClose=async(groupId:string,closedMeeting:any)=>{
    const meetingRows=(await repo.listMeetings(ctx.tenantId,groupId)).filter(x=>x.status!=='cancelled').slice().sort((a,b)=>meetingMoment(a)-meetingMoment(b)||String(a.id).localeCompare(String(b.id)));
    const closedIndex=meetingRows.findIndex(x=>x.id===closedMeeting.id),nextMeeting=closedIndex>=0?meetingRows.slice(closedIndex+1).find(x=>meetingMoment(x)>=meetingMoment(closedMeeting)):undefined;
    const activeLoans=(await completion.list(groupId,'LOAN')).filter(x=>['DISBURSED','REPAYING'].includes(String(x.data.completionState))&&finite(x.data.outstandingPrincipal,0)>0);
    const updates=[] as any[];
    for(const loan of activeLoans){
      const sourceCloseIds=jsonStringArray(loan.data.interestCloseSourceIdsJson),legacyAccrued=jsonStringArray(loan.data.accruedMeetingIdsJson);
      if(sourceCloseIds.includes(closedMeeting.id)||(String(loan.data.lastAccruedMeetingId??'')===closedMeeting.id&&legacyAccrued.includes(closedMeeting.id)))continue;
      const principal=finite(loan.data.outstandingPrincipal,0),interestOpening=finite(loan.data.unpaidInterest,0),perYear=Math.max(1,finite(loan.data.installmentsPerYear,12));
      const rate=finite(loan.data.rateBasisPointsPerPeriod,Math.round(finite(loan.data.annualRateBasisPoints,0)/perYear)),timing=normalizedLoanInterestTiming(loan.data.interestTiming),upfrontSourceMeetingId=String(loan.data.upfrontInterestSourceMeetingId??''),skipNextClose=loan.data.upfrontInterestSkipNextClose===true||String(loan.data.upfrontInterestSkipNextClose)==='true',coveredUpfront=timing!=='NEXT_SESSION_DUE'&&((upfrontSourceMeetingId&&upfrontSourceMeetingId===closedMeeting.id)||(!upfrontSourceMeetingId&&skipNextClose));
      const interestNew=coveredUpfront?0:Math.round(principal*rate/10000),interestAfter=interestOpening+interestNew;
      sourceCloseIds.push(closedMeeting.id);
      const preparedMeetingIds=jsonStringArray(loan.data.preparedInterestMeetingIdsJson);if(nextMeeting&&!preparedMeetingIds.includes(nextMeeting.id))preparedMeetingIds.push(nextMeeting.id);
      const targetState=String(loan.data.completionState)==='DISBURSED'?'REPAYING':String(loan.data.completionState);
      const patch:any={unpaidInterest:interestAfter,interestCloseSourceIdsJson:JSON.stringify(sourceCloseIds),preparedInterestMeetingIdsJson:JSON.stringify(preparedMeetingIds),preparedInterestPending:!nextMeeting,interestAppliesToMeetingId:nextMeeting?.id??'',interestAppliesToLabel:coveredUpfront?(nextMeeting?('Aucun intérêt supplémentaire à '+new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date(nextMeeting.scheduledAt??nextMeeting.openedAt))+' : première période déjà couverte'):'Première période déjà couverte'):nextMeeting?('Réunion du '+new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date(nextMeeting.scheduledAt??nextMeeting.openedAt))):'Séance suivante',interestSourceClosedMeetingId:closedMeeting.id,lastAccruedInterest:interestNew,lastAccruedAt:new Date().toISOString(),upfrontInterestSkipNextClose:coveredUpfront?false:loan.data.upfrontInterestSkipNextClose};
      await completion.transition(groupId,loan.id,targetState,{expectedVersion:finite(loan.data.completionVersion),patch});
      const periodKey=nextMeeting?.id??('next-after-'+closedMeeting.id),periodId='loan_period_'+encodeURIComponent(loan.id+'|'+periodKey),stamp=new Date().toISOString(),nextInterest=Math.round(principal*rate/10000),existing=await repo.getWorkspaceRecord(ctx.tenantId,periodId);
      await repo.saveWorkspaceRecord({id:periodId,tenantId:ctx.tenantId,groupId,moduleId:'FINANCE.LOAN_PERIOD',title:'Intérêt dû · '+(nextMeeting?.title??'séance suivante'),summary:coveredUpfront?'Première période couverte par un intérêt perçu au décaissement ; aucun nouvel intérêt exigible pour la séance suivante.':'Intérêt devenu exigible à la clôture de la séance précédente et rattaché à la séance suivante, sans intérêt sur intérêt.',status:'DONE',tags:['loan-period','loan:'+loan.id,'source-close:'+closedMeeting.id,nextMeeting?'meeting:'+nextMeeting.id:'next-session-pending'],data:{loanId:loan.id,membershipId:String(loan.data.borrowerMembershipId??''),meetingId:nextMeeting?.id??'',sourceClosedMeetingId:closedMeeting.id,appliesTo:'NEXT_SESSION',principalBefore:principal,interestOpening,interestNew,paymentAmount:Number(existing?.data.paymentAmount??0),principalPaid:Number(existing?.data.principalPaid??0),interestPaid:Number(existing?.data.interestPaid??0),principalAfter:principal,interestAfter,totalDebtAfter:principal+interestAfter,nextInterestProjected:nextInterest,nextTotalDueProjected:principal+interestAfter+nextInterest,priority:String(loan.data.paymentPriority??'CAPITAL_FIRST'),rateBasisPointsPerPeriod:rate},createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp});
      updates.push({loanId:loan.id,interestNew,interestAfter,totalDebt:principal+interestAfter,sourceClosedMeetingId:closedMeeting.id,appliesToMeetingId:nextMeeting?.id??null,appliesToLabel:patch.interestAppliesToLabel});
      const membershipId=String(loan.data.borrowerMembershipId??'');
      if(membershipId&&interestNew>0)await notifications.publish(groupId,{title:'Intérêt de prêt comptabilisé pour la prochaine séance',message:`${interestNew} F CFA d’intérêt ont été ajoutés à la dette après clôture de « ${closedMeeting.title} ». Dette actuelle : ${principal+interestAfter} F CFA. Cet intérêt concerne ${patch.interestAppliesToLabel}, pas la séance clôturée.`,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[membershipId],priority:'HIGH',action:{view:'sessions',meetingId:nextMeeting?.id??closedMeeting.id,label:'Voir la dette'}});
    }
    return{closedMeetingId:closedMeeting.id,nextMeetingId:nextMeeting?.id??null,updates};
  };

  const trashEntity=async(groupId:string,kind:string,entityId:string)=>{
    await requireGroup(groupId,true);const now=new Date(),restoreUntil=addCalendarMonthsClamped(now,6);
    let snapshot:any,label=entityId,retired:any,recordType:'group'|'meeting'|'membership'|'rubric_definition';
    if(kind==='MEETING'){
      const entity=await repo.getMeeting(ctx.tenantId,groupId,entityId);if(!entity)throw Error('MEETING_NOT_FOUND');snapshot=entity;label=entity.title;retired={...entity,status:'cancelled'};recordType='meeting';
    }else if(kind==='MEMBER'){
      const entity=await repo.getMembership(ctx.tenantId,groupId,entityId);if(!entity)throw Error('MEMBERSHIP_NOT_FOUND');snapshot=entity;
      const user=await repo.getUser(entity.userId);label=user?.displayName??entity.userId;retired={...entity,status:'left'};recordType='membership';
    }else if(kind==='RUBRIC'){
      const entity=await repo.getRubricDefinition(ctx.tenantId,groupId,entityId);if(!entity)throw Error('RUBRIC_NOT_FOUND');snapshot=entity;label=entity.name;
      retired={...entity,status:'ARCHIVED',updatedAt:now.toISOString(),version:entity.version+1};recordType='rubric_definition';
    }else if(kind==='GROUP'){
      if(entityId!==groupId)throw Error('GROUP_SCOPE_MISMATCH');const entity=await repo.getGroup(ctx.tenantId,groupId);if(!entity)throw Error('GROUP_NOT_FOUND');snapshot=entity;label=entity.name;retired={...entity,status:'archived'};recordType='group';
    }else throw Error('TRASH_KIND_UNSUPPORTED');

    const activeMemberships=kind==='GROUP'?(await repo.listMemberships(ctx.tenantId,groupId)).filter(m=>m.status==='active'):[];
    const eligibleMembershipIds=activeMemberships.map(m=>m.id),eligibleUserIds=[...new Set(activeMemberships.map(m=>m.userId))];
    const petitionThreshold=kind==='GROUP'?Math.ceil(2*eligibleMembershipIds.length/3):0;
    const founderId=kind==='GROUP'?String(snapshot?.createdBy??''):'';
    const reminderRecipients=[...new Set([founderId,ctx.actorId].filter(Boolean))];
    const id='trash_'+encodeURIComponent(JSON.stringify([groupId,kind,entityId])),existing=await repo.getWorkspaceRecord(ctx.tenantId,id);
    const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:'TRASH.ITEM',title:label,summary:'Restaurable pendant six mois',status:'ACTIVE',tags:['trash',kind.toLowerCase()],data:{
      kind,entityId,deletedAt:now.toISOString(),restoreUntil:restoreUntil.toISOString(),snapshotJson:JSON.stringify(snapshot),deletedBy:ctx.actorId,founderId:founderId||null,
      lifecycleState:'TRASHED',remindersEnabled:kind==='GROUP',nextReminderAt:kind==='GROUP'?addCalendarMonthsClamped(now,1).toISOString():null,
      reminderRecipientUserIdsJson:JSON.stringify(reminderRecipients),reminderOptOutUserIdsJson:'[]',
      eligibleMembershipIdsJson:kind==='GROUP'?JSON.stringify(eligibleMembershipIds):'[]',eligibleUserIdsJson:kind==='GROUP'?JSON.stringify(eligibleUserIds):'[]',
      petitionState:kind==='GROUP'?'OPEN':null,petitionThreshold:kind==='GROUP'?petitionThreshold:0,petitionSignatureUserIdsJson:'[]'
    },createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??now.toISOString(),updatedAt:now.toISOString()};
    const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'ENTITY_MOVED_TO_TRASH',targetType:kind.toLowerCase(),targetId:entityId,requestId:ctx.requestId,metadata:{trashId:id,restoreUntil:restoreUntil.toISOString(),petitionThreshold}});
    await repo.commitTrashLifecycle({entityRecordType:recordType,entity:retired,trashRecord:record,audit});

    const actor=await actorLabel(),kindLabel=kind==='MEETING'?'Séance':kind==='MEMBER'?'Membre':kind==='GROUP'?'Groupe':'Rubrique',action={view:'trash',entityKind:kind,entityId,id,label:'Voir la corbeille'};
    if(kind==='GROUP'){
      await notifications.publish(groupId,{title:'Groupe placé à la corbeille',message:`${actor} a placé « ${label} » à la corbeille. Restauration possible jusqu’au ${restoreUntil.toLocaleDateString('fr-FR')}. Les membres inscrits au moment du retrait disposent du mécanisme de pétition prévu par la gouvernance.`,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED_USERS',selectedUserIds:[...new Set([...eligibleUserIds,...reminderRecipients])],priority:'CRITICAL',action});
    }else await notifications.publish(groupId,{title:kindLabel+' placé(e) à la corbeille',message:`${actor} a placé « ${label} » à la corbeille. Restauration possible jusqu’au ${restoreUntil.toLocaleDateString('fr-FR')}.`,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:'HIGH',action});
    if(kind==='MEMBER')await notifications.publish(groupId,{title:'Votre dossier a été placé à la corbeille',message:`${actor} a retiré temporairement votre dossier du groupe. La restauration reste possible pendant six mois.`,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[entityId],priority:'HIGH',action});
    return record;
  };

  const listTrash=async(groupId:string)=>{
    await requireGroup(groupId,true);const items=await repo.listWorkspaceRecords(ctx.tenantId,'TRASH.ITEM',groupId);
    return items.sort((a,b)=>String(b.data.deletedAt??b.createdAt).localeCompare(String(a.data.deletedAt??a.createdAt)));
  };

  const restoreTrash=async(groupId:string,trashId:string)=>{
    await requireGroup(groupId,true);const record=await repo.getWorkspaceRecord(ctx.tenantId,trashId);if(!record||record.groupId!==groupId||record.moduleId!=='TRASH.ITEM')throw Error('TRASH_ITEM_NOT_FOUND');
    if(record.status!=='ACTIVE'||String(record.data.lifecycleState??'TRASHED')==='PURGE_PENDING'||Date.parse(String(record.data.restoreUntil??''))<Date.now())throw Error('TRASH_RETENTION_EXPIRED');
    const snapshot=JSON.parse(String(record.data.snapshotJson??'{}')),kind=String(record.data.kind??'');
    const recordType=kind==='MEETING'?'meeting':kind==='MEMBER'?'membership':kind==='RUBRIC'?'rubric_definition':kind==='GROUP'?'group':null;
    if(!recordType)throw Error('TRASH_KIND_UNSUPPORTED');
    const restored={...record,status:'DONE' as WorkspaceStatus,data:{...record.data,lifecycleState:'RESTORED',restoredAt:new Date().toISOString(),restoredBy:ctx.actorId},updatedAt:new Date().toISOString()};
    const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'ENTITY_RESTORED_FROM_TRASH',targetType:kind.toLowerCase(),targetId:String(record.data.entityId??''),requestId:ctx.requestId,metadata:{trashId}});
    await repo.commitTrashLifecycle({entityRecordType:recordType,entity:snapshot,trashRecord:restored,audit});
    const actor=await actorLabel(),entityId=String(record.data.entityId??''),kindLabel=kind==='MEETING'?'Séance':kind==='MEMBER'?'Membre':kind==='GROUP'?'Groupe':'Rubrique';
    await notifications.publish(groupId,{title:kindLabel+' restauré(e)',message:`${actor} a restauré « ${record.title} » depuis la corbeille.`,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:'HIGH',action:{view:kind==='MEETING'?'sessions':kind==='MEMBER'?'members':kind==='GROUP'?'launch':'operations',anchor:kind==='RUBRIC'?'rubricsManagementPanel':undefined,meetingId:kind==='MEETING'?entityId:undefined,membershipId:kind==='MEMBER'?entityId:undefined,rubricId:kind==='RUBRIC'?entityId:undefined,entityKind:kind,entityId,label:'Voir l’élément restauré'}});
    return restored;
  };

  const groupTrashVisible=async(record:WorkspaceRecord)=>{
    if(String(record.data.kind??'')!=='GROUP')return false;const groupId=String(record.data.entityId??record.groupId??''),group=await repo.getGroup(ctx.tenantId,groupId);if(!group)return false;
    if(group.createdBy===ctx.actorId||String(record.data.deletedBy??'')===ctx.actorId)return true;
    const eligible=jsonArraySafe(String(record.data.eligibleUserIdsJson??'[]'));if(eligible.includes(ctx.actorId))return true;
    const member=(await repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId);return Boolean(member);
  };
  const listGroupTrash=async()=>{
    const rows=(await repo.listWorkspaceRecords(ctx.tenantId,'TRASH.ITEM')).filter(x=>String(x.data.kind??'')==='GROUP'),out=[] as WorkspaceRecord[];
    for(const item of rows)if(await groupTrashVisible(item))out.push(item);
    return out.sort((a,b)=>String(b.data.deletedAt??b.createdAt).localeCompare(String(a.data.deletedAt??a.createdAt)));
  };
  const visibleWorkspace=async(record:WorkspaceRecord)=>{
    if(!record.groupId)return record.createdBy===ctx.actorId;
    try{await requireGroup(record.groupId,true);return true;}catch{return false;}
  };
  try {
    const petitionStatus=url.pathname.match(/^\/api\/v1\/trash\/groups\/([^/]+)\/petition$/);
    if(petitionStatus&&request.method==='GET')return json(await reconstitution.status(decodeURIComponent(petitionStatus[1]!)),200,cors);
    if(petitionStatus&&request.method==='POST')return json(await reconstitution.sign(decodeURIComponent(petitionStatus[1]!)),200,cors);
    const petitionWithdraw=url.pathname.match(/^\/api\/v1\/trash\/groups\/([^/]+)\/petition\/withdraw$/);
    if(petitionWithdraw&&request.method==='POST')return json(await reconstitution.withdraw(decodeURIComponent(petitionWithdraw[1]!)),200,cors);
    const successorCreate=url.pathname.match(/^\/api\/v1\/trash\/groups\/([^/]+)\/successor$/);
    if(successorCreate&&request.method==='POST'){const body=await readJson<any>(request);return json(await reconstitution.createSuccessor(decodeURIComponent(successorCreate[1]!),body),201,cors);}
    const successorDecision=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/succession\/decisions$/);
    if(successorDecision&&request.method==='POST'){const body=await readJson<any>(request);return json(await reconstitution.recordDecision(successorDecision[1]!,body),201,cors);}
    const successorDispute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/succession\/disputes$/);
    if(successorDispute&&request.method==='POST'){const body=await readJson<any>(request);return json(await reconstitution.openDispute(successorDispute[1]!,body),201,cors);}

    if(url.pathname==='/api/v1/trash/groups'&&request.method==='GET')return json(await listGroupTrash(),200,cors);
    const globalGroupTrashRestore=url.pathname.match(/^\/api\/v1\/trash\/groups\/([^/]+)\/restore$/);
    if(globalGroupTrashRestore&&request.method==='POST'){const id=decodeURIComponent(globalGroupTrashRestore[1]!),record=await repo.getWorkspaceRecord(ctx.tenantId,id);if(!record||!await groupTrashVisible(record))throw Error('TRASH_ITEM_NOT_FOUND');return json(await restoreTrash(String(record.data.entityId??record.groupId??''),id),200,cors);}
    const globalGroupTrashReminders=url.pathname.match(/^\/api\/v1\/trash\/groups\/([^/]+)\/reminders$/);
    if(globalGroupTrashReminders&&request.method==='PUT'){const id=decodeURIComponent(globalGroupTrashReminders[1]!),record=await repo.getWorkspaceRecord(ctx.tenantId,id);if(!record||!await groupTrashVisible(record))throw Error('TRASH_ITEM_NOT_FOUND');const body=await readJson<Record<string,unknown>>(request),enabled=body.enabled!==false,optOut=new Set(jsonArraySafe(String(record.data.reminderOptOutUserIdsJson??'[]')));if(enabled)optOut.delete(ctx.actorId);else optOut.add(ctx.actorId);const updated={...record,data:{...record.data,reminderOptOutUserIdsJson:JSON.stringify([...optOut])},updatedAt:new Date().toISOString()};await repo.saveWorkspaceRecord(updated);return json(updated,200,cors);}
    const scopedGroup=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)/)?.[1];
    if(scopedGroup)await requireGroup(scopedGroup);
    const trashRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/trash$/);
    const trashRestore=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/trash\/([^/]+)\/restore$/);
    if(trashRoute&&request.method==='GET')return json(await listTrash(trashRoute[1]!),200,cors);
    if(trashRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await trashEntity(trashRoute[1]!,String(body.kind??''),String(body.entityId??'')),201,cors);}
    if(trashRestore&&request.method==='POST')return json(await restoreTrash(trashRestore[1]!,decodeURIComponent(trashRestore[2]!)),200,cors);
    const groupModelsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/models$/);
    if(groupModelsRoute&&request.method==='GET')return json({items:await groupModels.list(groupModelsRoute[1]!)},200,cors);
    if(groupModelsRoute&&request.method==='POST'){const body=await readJson<any>(request);return json(await groupModels.capture(groupModelsRoute[1]!,body),201,cors);}
    const groupModelReviewRequest=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/models\/([^/]+)\/review-request$/);
    if(groupModelReviewRequest&&request.method==='POST')return json(await groupModels.requestReview(groupModelReviewRequest[1]!,groupModelReviewRequest[2]!),200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/group-models')return json({items:await groupModels.list()},200,cors);
    const caseLawRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/case-law$/);
    if(caseLawRoute&&request.method==='GET')return json({items:await groupCaseLaw.list(caseLawRoute[1]!)},200,cors);
    if(caseLawRoute&&request.method==='POST'){const body=await readJson<any>(request);return json(await groupCaseLaw.create(caseLawRoute[1]!,body),201,cors);}
    const caseLawAction=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/case-law\/([^/]+)\/(validate-local|review-request)$/);
    if(caseLawAction&&request.method==='POST')return json(caseLawAction[3]==='validate-local'?await groupCaseLaw.validateLocal(caseLawAction[1]!,caseLawAction[2]!):await groupCaseLaw.requestReview(caseLawAction[1]!,caseLawAction[2]!),200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/founder/group-models/review-queue'){const ok=await isFounderTeamActor();return json({items:await groupModels.reviewQueue(ok)},200,cors);}
    const founderModelReview=url.pathname.match(/^\/api\/v1\/founder\/group-models\/([^/]+)\/review$/);
    if(founderModelReview&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request),ok=await isFounderTeamActor();return json(await groupModels.review(founderModelReview[1]!,String(body.state??'STANDARD') as any,String(body.note??''),ok),200,cors);}
    if(request.method==='GET'&&url.pathname==='/api/v1/founder/case-law/review-queue'){const ok=await isFounderTeamActor();return json({items:await groupCaseLaw.reviewQueue(ok)},200,cors);}
    const founderCaseReview=url.pathname.match(/^\/api\/v1\/founder\/case-law\/([^/]+)\/review$/);
    if(founderCaseReview&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request),ok=await isFounderTeamActor();return json(await groupCaseLaw.review(founderCaseReview[1]!,String(body.state??'REJECTED') as any,String(body.note??''),ok),200,cors);}
    const starterKitRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/starter-kit$/);
    if(starterKitRoute&&request.method==='GET'){const record=await starterKit.current(starterKitRoute[1]!);return json(record??null,200,cors);}
    if(starterKitRoute&&request.method==='PUT'){const body=await readJson<any>(request);return json(await starterKit.save(starterKitRoute[1]!,body),200,cors);}
    const prepaymentRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/prepayments$/);
    if(prepaymentRoute&&request.method==='GET')return json({items:await prepayments.list(prepaymentRoute[1]!)},200,cors);
    if(prepaymentRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request),record=await prepayments.create(prepaymentRoute[1]!,{membershipId:String(body.membershipId??''),rubricId:body.rubricId?String(body.rubricId):undefined,amount:finite(body.amount),intendedMeetingId:body.intendedMeetingId?String(body.intendedMeetingId):undefined,note:body.note?String(body.note):undefined,idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('prepayment'))});const receipt=(await repo.listContributionReceipts(ctx.tenantId,prepaymentRoute[1]!)).find(x=>x.id===String(record.data.receiptId??'')),entry=receipt?await repo.getLedgerEntry(ctx.tenantId,prepaymentRoute[1]!,receipt.ledgerEntryId):undefined;if(receipt&&entry)await dispatchContributionProjection(prepaymentRoute[1]!,receipt,entry);return json(record,201,cors);}
    const prepaymentAllocate=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/prepayments\/([^/]+)\/allocate$/);
    if(prepaymentAllocate&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await prepayments.allocate(prepaymentAllocate[1]!,prepaymentAllocate[2]!,{meetingId:String(body.meetingId??''),amount:finite(body.amount)}),200,cors);}
    const reopenAuthBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/reopen-authorizations$/);
    if(reopenAuthBase&&request.method==='GET')return json({items:await reopenAuth.list(reopenAuthBase[1]!,reopenAuthBase[2]!)},200,cors);
    if(reopenAuthBase&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await reopenAuth.create(reopenAuthBase[1]!,reopenAuthBase[2]!,{reason:String(body.reason??''),expiresAt:body.expiresAt?String(body.expiresAt):undefined,scope:body.scope?String(body.scope):undefined}),201,cors);}
    const reopenAuthApprove=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/reopen-authorizations\/([^/]+)\/approve$/);
    if(reopenAuthApprove&&request.method==='POST'){const row=await reopenAuth.approve(reopenAuthApprove[1]!,reopenAuthApprove[3]!);if(String(row.data.meetingId)!==reopenAuthApprove[2]!)throw Error('REOPEN_AUTH_NOT_FOUND');return json(row,200,cors);}
    const reopenAuthCancel=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/reopen-authorizations\/([^/]+)\/cancel$/);
    if(reopenAuthCancel&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request),row=await reopenAuth.cancel(reopenAuthCancel[1]!,reopenAuthCancel[3]!,String(body.reason??''));if(String(row.data.meetingId)!==reopenAuthCancel[2]!)throw Error('REOPEN_AUTH_NOT_FOUND');return json(row,200,cors);}
    // Manager review does not mutate the canonical ledger.
    const financialCellReview=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/financial-cells\/review$/);
    if(financialCellReview&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await applyFinancialReview({
        groupId:financialCellReview[1]!,meetingId:financialCellReview[2]!,
        membershipId:String(body.membershipId??''),rubricId:String(body.rubricId??''),
        decision:String(body.decision??''),reason:String(body.reason??'').trim(),
        amount:finite(body.amount,-1),cellVersion:finite(body.cellVersion,-1)
      }),200,cors);
    }
    const financialCellBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/financial-cells$/);
    const financialCellApply=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/financial-cells\/([^/]+)\/apply$/);
    if(financialCellBase&&request.method==='POST'){
      const groupId=financialCellBase[1]!,meetingId=financialCellBase[2]!;await requireGroup(groupId,true);
      const body=await readJson<Record<string,unknown>>(request),membershipId=String(body.membershipId??''),rubricId=String(body.rubricId??''),targetAmount=finite(body.targetAmount),expectedCurrentAmount=body.expectedCurrentAmount===undefined?undefined:finite(body.expectedCurrentAmount),expectedCellVersion=body.expectedCellVersion===undefined?undefined:finite(body.expectedCellVersion),reason=String(body.reason??'').trim();
      if(!membershipId||!rubricId)throw Error('FINANCIAL_CELL_REQUIRED');
      if(!Number.isSafeInteger(targetAmount)||targetAmount<0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
      if(body.intentV2&&typeof body.intentV2==='object'){
        const intent=body.intentV2 as Record<string,unknown>;
        if(String(request.headers.get('x-idempotency-key')??'')!==String(intent.commandId??''))
          throw Error('CELL_INTENT_KEY_MISMATCH');
        const result=await applyRecordedCellV2({
          groupId,meetingId,membershipId,rubricId,targetAmount,reason,
          baselineValue:Number(intent.baselineValue??0),baselineVersion:Number(intent.baselineVersion??0),
          recordedAtClient:String(intent.recordedAtClient??''),
          clockAnchorId:String(intent.clockAnchorId??''),deviceId:String(intent.deviceId??''),
          deviceSequence:Number(intent.deviceSequence??0),commandId:String(intent.commandId??'')
        });
        return json(result,200,cors);
      }
      const state=await financialCellState(groupId,meetingId,membershipId,rubricId),meeting=await repo.getMeeting(ctx.tenantId,groupId,meetingId);if(!meeting||meeting.status==='cancelled')throw Error('MEETING_NOT_FOUND');
      if(state.current===targetAmount)return json({status:'NO_CHANGE',current:state.current,target:targetAmount},200,cors);
      if(expectedCurrentAmount!==undefined&&expectedCurrentAmount!==state.current)throw Error('CELL_VALUE_CONFLICT');
      if(expectedCellVersion!==undefined&&expectedCellVersion!==state.cellVersion)throw Error('CELL_VERSION_CONFLICT');

      // 1.5.2.6b: manager validation writes immediately; confrontation follows only an explicit dissent/reserve.
      const creatingCell=state.current===0;
      const applied=await applyFinancialCellTarget({groupId,meetingId,membershipId,rubricId,targetAmount,expectedCurrentAmount:expectedCurrentAmount??state.current,expectedCellVersion:expectedCellVersion??state.cellVersion,reason:reason||'Correction explicite de la feuille de séance',idempotencyKey:String(request.headers.get('x-idempotency-key')??makeId('cell-correction'))});
      return json(applied,creatingCell?201:200,cors);
    }
    if(financialCellApply&&request.method==='POST'){
      const groupId=financialCellApply[1]!,meetingId=financialCellApply[2]!,cellKey=decodeURIComponent(financialCellApply[3]!);await requireGroup(groupId,true);
      const body=await readJson<Record<string,unknown>>(request),consensus=new MeetingLiveConsensusService(repo,kernel),item=await consensus.get(groupId,meetingId,cellKey);
      if(!item||!item.selectedValue||!['MAJORITY_SELECTED','UNANIMOUS','RESERVE_OPEN'].includes(item.state))throw Error('CONSENSUS_SELECTION_REQUIRED');
      if(!item.membershipId||!item.rubricId)throw Error('FINANCIAL_CELL_REQUIRED');
      const targetAmount=Number(item.selectedValue);if(!Number.isSafeInteger(targetAmount)||targetAmount<0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
      const currentState=await financialCellState(groupId,meetingId,item.membershipId,item.rubricId);
      if(item.baselineCellVersion!==undefined&&currentState.cellVersion!==item.baselineCellVersion)throw Error('CELL_VERSION_CONFLICT');
      const applied=await applyFinancialCellTarget({groupId,meetingId,membershipId:item.membershipId,rubricId:item.rubricId,targetAmount,expectedCurrentAmount:currentState.current,expectedCellVersion:item.baselineCellVersion??currentState.cellVersion,reason:String(body.reason??'Valeur retenue après confrontation des gestionnaires'),idempotencyKey:'cell-consensus:'+item.id+':v'+item.version,consensusId:item.id,consensusVersion:item.version});
      return json({...applied,consensusState:item.state},200,cors);
    }
    const consensusBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/live-consensus$/);
    const consensusAction=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/live-consensus\/([^/]+)\/(vote|reserve)$/);
    if(consensusBase||consensusAction){
      const groupId=(consensusBase?.[1]??consensusAction?.[1])!,meetingId=(consensusBase?.[2]??consensusAction?.[2])!;
      await requireGroup(groupId,true);
      const consensus=new MeetingLiveConsensusService(repo,kernel);
      if(consensusBase&&request.method==='GET')return json({items:await consensus.list(groupId,meetingId)},200,cors);
      if(consensusBase&&request.method==='POST'){
        const body=await readJson<Record<string,unknown>>(request),cellKey=String(body.cellKey??'').trim();if(!cellKey)throw Error('CELL_KEY_REQUIRED');
        const item=await consensus.submit({groupId,meetingId,cellKey,value:body.value,label:body.label?String(body.label):undefined,membershipId:body.membershipId?String(body.membershipId):undefined,rubricId:body.rubricId?String(body.rubricId):undefined});
        await publishLive(groupId,item.state==='DIVERGENT'?'CONSENSUS_REQUIRED':'MANAGER_ENTRY','manager-entry:'+item.id+':'+item.version,{meetingId,cellKey,state:item.state,version:item.version,selectedValue:item.selectedValue??''});
        return json(item,201,cors);
      }
      if(consensusAction&&request.method==='POST'){
        const cellKey=decodeURIComponent(consensusAction[3]!),action=consensusAction[4]!,body=await readJson<Record<string,unknown>>(request);
        if(action==='vote'){
          const item=await consensus.vote(groupId,meetingId,cellKey,String(body.proposalActorId??''));
          await publishLive(groupId,item.state==='MAJORITY_SELECTED'||item.state==='UNANIMOUS'?'CONSENSUS_SELECTED':'CONSENSUS_REQUIRED','consensus-vote:'+item.id+':'+item.version,{meetingId,cellKey,state:item.state,version:item.version,selectedValue:item.selectedValue??''});
          if(item.membershipId){const target=await repo.getMembership(ctx.tenantId,groupId,item.membershipId);if(target)await publishLive(groupId,'MEMBER_PROJECTION_UPDATED','member-projection:'+item.id+':'+item.version,{meetingId,cellKey,state:item.state,selectedValue:item.selectedValue??''},target.userId);}
          return json(item,200,cors);
        }
        const item=await consensus.maintainDissent(groupId,meetingId,cellKey,String(body.reason??''));
        await publishLive(groupId,'MANAGER_RESERVE','manager-reserve:'+item.id+':'+item.version,{meetingId,cellKey,state:item.state,version:item.version,selectedValue:item.selectedValue??''});
        return json(item,200,cors);
      }
      return json({error:'METHOD_NOT_ALLOWED'},405,cors);
    }
    const liveSignalsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/live\/signals$/);
    if(liveSignalsRoute&&request.method==='GET'){
      const groupId=liveSignalsRoute[1]!;if(!options.premiumLive||!options.liveNamespace)return json({enabled:false,error:'PREMIUM_LIVE_LEDGER_DISABLED'},503,cors);await requireGroup(groupId,false);
      const {stub}=liveStubFor(groupId),afterAt=url.searchParams.get('afterAt')??'0';
      return stub.fetch(new Request('https://group-live.internal/signals?afterAt='+encodeURIComponent(afterAt)+'&actorId='+encodeURIComponent(ctx.actorId)));
    }
    const liveRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/live\/(health|events|connect|publish|signal)$/);
    if(liveRoute){
      const groupId=liveRoute[1]!,action=liveRoute[2]!;
      if(!options.premiumLive||!options.liveNamespace)return json({enabled:false,error:'PREMIUM_LIVE_LEDGER_DISABLED'},503,cors);
      const {stub}=liveStubFor(groupId);
      if(action==='health'&&request.method==='GET'){
        await requireGroup(groupId,false);
        const response=await stub.fetch(new Request('https://group-live.internal/health'));
        const body=await response.json() as Record<string,unknown>;
        return json({...body,enabled:true,groupCode:groupId,transport:'EVENT_PUSH_NO_D1_POLLING'},response.status,cors);
      }
      if(action==='events'&&request.method==='GET'){
        await requireGroup(groupId,false);
        const after=url.searchParams.get('after')??'0',limit=url.searchParams.get('limit')??'100';
        return stub.fetch(new Request('https://group-live.internal/events?after='+encodeURIComponent(after)+'&limit='+encodeURIComponent(limit)+'&userId='+encodeURIComponent(ctx.actorId)));
      }
      if(action==='connect'&&request.method==='GET'){
        // Signed live tickets are already group-scoped by authenticatedApi.
        // Fallback to the canonical D1 authorization path for legacy clients.
        if(!trustedLiveTicket)await requireGroup(groupId,false);
        const after=url.searchParams.get('after')??'0';
        return stub.fetch(new Request('https://group-live.internal/connect?userId='+encodeURIComponent(ctx.actorId)+'&after='+encodeURIComponent(after),{method:'GET',headers:request.headers}));
      }
      if(action==='signal'&&request.method==='POST'){
        const body=await readJson<Record<string,unknown>>(request),type=String(body.type??'');
        const allowed=new Set(['PRESENCE','TYPING','TYPING_STOP','CELL_FOCUS','CELL_BLUR','FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR','LIVE_ACK']);
        if(!allowed.has(type))throw new Error('LIVE_CLIENT_SIGNAL_NOT_ALLOWED');
        const raw=body.payload&&typeof body.payload==='object'&&!Array.isArray(body.payload)?body.payload as Record<string,unknown>:{};
        const kind=String(raw.kind??'');
        await requireGroup(groupId,kind==='FINANCIAL_CELL');
        const payload:Record<string,string|number|boolean|null>={};
        for(const [k,v] of Object.entries(raw))if(typeof v==='string'||typeof v==='number'||typeof v==='boolean'||v===null)payload[k]=v;
        const response=await stub.fetch(new Request('https://group-live.internal/signal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,actorId:ctx.actorId,payload})}));
        if(!response.ok)throw new Error('LIVE_SIGNAL_FAILED');
        return json({accepted:true,ephemeral:true,groupCode:groupId},202,cors);
      }
      if(action==='publish'&&request.method==='POST'){
        const body=await readJson<Record<string,unknown>>(request),type=String(body.type??'');
        if(type==='MEETING_UPDATE')await requireGroup(groupId,true);
        else if(!['PRESENCE','SYNC_HINT'].includes(type))throw new Error('LIVE_CLIENT_EVENT_NOT_ALLOWED');
        const raw=body.payload&&typeof body.payload==='object'&&!Array.isArray(body.payload)?body.payload as Record<string,unknown>:{};
        const payload:Record<string,string|number|boolean|null>={};
        for(const [k,v] of Object.entries(raw))if(typeof v==='string'||typeof v==='number'||typeof v==='boolean'||v===null)payload[k]=v;
        const idempotencyKey=String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('live'));
        await publishLive(groupId,type,idempotencyKey,payload);
        return json({accepted:true,groupCode:groupId},202,cors);
      }
      return json({error:'METHOD_NOT_ALLOWED'},405,cors);
    }
    if(request.method==='GET'&&url.pathname==='/health') return json({ok:true,service:'tontine-api',version:RELEASE_VERSION,buildId:RELEASE_BUILD_ID,commitSha:options.releaseCommitSha??'UNBOUND_LOCAL_BUILD',schemaVersion:RELEASE_SCHEMA_VERSION,policyVersion:RELEASE_POLICY_VERSION,pwaCache:RELEASE_PWA_CACHE,now:new Date().toISOString(),realMoneyEnabled:kernel.features.enabled('financial-real-money'),manualCashLedgerEnabled:true,premiumLiveEnabled:options.premiumLive===true&&Boolean(options.liveNamespace),founderControlBound:Boolean(options.founderControl),communityRealtimeBound:Boolean(options.communityRealtime),artifactStorageBound:true,artifactStorageMode:options.artifacts?'R2':'D1_FALLBACK',contextScope:'request'},200,cors);
    if(request.method==='POST'&&url.pathname==='/api/v1/value/offers'){const body=await readJson<any>(request);return json(await valueNetwork.createOffer(body),201,cors);}
    if(request.method==='GET'&&url.pathname==='/api/v1/value/offers')return json({items:await valueNetwork.listOffers()},200,cors);
    const valueNeeds=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/value\/needs$/);
    if(valueNeeds&&request.method==='GET')return json({items:await valueNetwork.listNeeds(valueNeeds[1]!)},200,cors);
    if(valueNeeds&&request.method==='POST'){const body=await readJson<any>(request);return json(await valueNetwork.createNeed({groupId:valueNeeds[1]!,...body}),201,cors);}
    const valueNeedAction=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/value\/needs\/([^/]+)\/(validate|publish|matches|procurement)$/);
    if(valueNeedAction){
      const groupId=valueNeedAction[1]!,needId=valueNeedAction[2]!,action=valueNeedAction[3]!;await requireGroup(groupId,action!=='matches');
      if(action==='validate'&&request.method==='POST')return json(await valueNetwork.validateNeed(needId),200,cors);
      if(action==='publish'&&request.method==='POST')return json(await valueNetwork.publishNeed(needId),200,cors);
      if(action==='matches'&&request.method==='GET')return json({items:await valueNetwork.matchNeed(needId)},200,cors);
      if(action==='procurement'&&request.method==='POST'){const body=await readJson<any>(request);return json(await valueNetwork.prepareProcurement(needId,String(body.offerId??'')),201,cors);}
    }

    if(request.method==='GET'&&url.pathname==='/api/v1/safety/cases'){
      const groupId=url.searchParams.get('groupId')??undefined;return json({items:await safety.list(groupId)},200,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/safety/reports'){
      const body=await readJson<Record<string,unknown>>(request);return json(await safety.report({
        groupId:body.groupId?String(body.groupId):undefined,subjectType:String(body.subjectType??''),subjectRef:String(body.subjectRef??''),category:String(body.category??'OTHER') as SafetyCategory,
        summary:String(body.summary??''),evidenceRef:body.evidenceRef?String(body.evidenceRef):undefined,source:body.source?String(body.source):undefined
      }),201,cors);
    }
    const safetyTransition=url.pathname.match(/^\/api\/v1\/safety\/cases\/([^/]+)\/transition$/);
    if(safetyTransition&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await safety.transition(safetyTransition[1]!,String(body.state??'') as SafetyCaseState,String(body.note??''),String(body.evidenceRef??'')),200,cors);}
    const safetyEvidence=url.pathname.match(/^\/api\/v1\/safety\/cases\/([^/]+)\/evidence$/);
    if(safetyEvidence&&request.method==='GET')return json({items:await safety.evidence(safetyEvidence[1]!)},200,cors);
    if(safetyEvidence&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await safety.addEvidence(safetyEvidence[1]!,{summary:String(body.summary??''),ref:String(body.ref??''),source:body.source?String(body.source):undefined}),201,cors);}
    const safetyDecision=url.pathname.match(/^\/api\/v1\/safety\/cases\/([^/]+)\/decision$/);
    if(safetyDecision&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await safety.decide(safetyDecision[1]!,{action:String(body.action??'NO_ACTION') as SafetyAction,reason:String(body.reason??''),evidenceRef:body.evidenceRef?String(body.evidenceRef):undefined,findingStatus:body.findingStatus as any}),200,cors);}
    const safetyAppeal=url.pathname.match(/^\/api\/v1\/safety\/cases\/([^/]+)\/appeal$/);
    if(safetyAppeal&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await safety.appeal(safetyAppeal[1]!,{reason:String(body.reason??''),evidenceRef:body.evidenceRef?String(body.evidenceRef):undefined}),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/safety/referral-structure-assessment'){const body=await readJson<Record<string,unknown>>(request);return json(assessReferralStructure({levels:finite(body.levels,1),fundingSource:String(body.fundingSource??''),rewardForRecruitingRecruiters:Boolean(body.rewardForRecruitingRecruiters),promisedReturnLinkedToRecruitment:Boolean(body.promisedReturnLinkedToRecruitment),realProductOrServiceEvidence:body.realProductOrServiceEvidence===undefined?undefined:Boolean(body.realProductOrServiceEvidence)}),200,cors);}
    const trustEvidenceRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/trust\/([^/]+)\/evidence$/);
    if(trustEvidenceRoute&&request.method==='GET')return json({items:await trustGraph.evidence(trustEvidenceRoute[1]!,trustEvidenceRoute[2]!)},200,cors);
    if(trustEvidenceRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await trustGraph.addEvidence(trustEvidenceRoute[1]!,trustEvidenceRoute[2]!,{commitmentBand:String(body.commitmentBand??''),kind:String(body.kind??'') as any,sourceId:String(body.sourceId??''),occurredAt:body.occurredAt?String(body.occurredAt):undefined,weight:body.weight===undefined?undefined:Number(body.weight)}),201,cors);}
    const trustProfileRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/trust\/([^/]+)\/profile$/);
    if(trustProfileRoute&&request.method==='GET')return json(await trustGraph.profile(trustProfileRoute[1]!,trustProfileRoute[2]!,url.searchParams.get('band')??'SMALL'),200,cors);
    const trustGraphRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/trust\/([^/]+)$/);
    if(trustGraphRoute&&request.method==='GET')return json(await trustGraph.graph(trustGraphRoute[1]!,trustGraphRoute[2]!),200,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/knowledge'){return json({items:await knowledgeAcademy.searchKnowledge(url.searchParams.get('q')??'',url.searchParams.get('groupId')??undefined)},200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/knowledge'){const body=await readJson<any>(request);return json(await knowledgeAcademy.createKnowledge(body),201,cors);}
    const knowledgeRevision=url.pathname.match(/^\/api\/v1\/knowledge\/([^/]+)\/revisions$/);
    if(knowledgeRevision&&request.method==='POST'){const body=await readJson<any>(request);return json(await knowledgeAcademy.reviseKnowledge(knowledgeRevision[1]!,body),201,cors);}
    const knowledgeReview=url.pathname.match(/^\/api\/v1\/knowledge\/([^/]+)\/review$/);
    if(knowledgeReview&&request.method==='POST'){const body=await readJson<any>(request);return json(await knowledgeAcademy.reviewKnowledge(knowledgeReview[1]!,String(body.state??'TO_REVALIDATE') as any,String(body.note??'')),200,cors);}
    if(request.method==='GET'&&url.pathname==='/api/v1/encyclopedia')return json({items:knowledgeAcademy.encyclopedia(url.searchParams.get('q')??'')},200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/founder-ai/context'){
      if(!(await isFounderTeamActor()))throw new Error('FOUNDER_TEAM_ONLY');
      const q=url.searchParams.get('q')??'',knowledgeContext=await knowledgeAcademy.founderContext(q);
      const control=options.founderControl?await options.founderControl.snapshot(PRODUCT_MODULES.map(x=>({id:x.id,labelFr:x.labelFr,labelEn:x.labelEn,status:x.status,lot:x.lot,workspace:x.workspace}))):undefined;
      let learning:undefined|{stats:any;discoveries:any[];privacy:string};
      if(options.founderLearning){const minGroups=5;const [stats,discoveries]=await Promise.all([options.founderLearning.stats(minGroups),options.founderLearning.discoveries(minGroups,100)]);learning={stats,discoveries,privacy:'SANITIZED_PSEUDONYMOUS_K_ANONYMIZED'};}
      return json(founderAI.synthesize({query:q,knowledgeContext,control,learning}),200,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/academy')return json(await knowledgeAcademy.academy(),200,cors);
    if(request.method==='POST'&&url.pathname==='/api/v1/academy/courses'){const body=await readJson<any>(request);return json(await knowledgeAcademy.createCourse(body),201,cors);}
    const academyEnroll=url.pathname.match(/^\/api\/v1\/academy\/courses\/([^/]+)\/enroll$/);
    if(academyEnroll&&request.method==='POST')return json(await knowledgeAcademy.enroll(academyEnroll[1]!),201,cors);
    const academyLesson=url.pathname.match(/^\/api\/v1\/academy\/enrollments\/([^/]+)\/lessons$/);
    if(academyLesson&&request.method==='POST'){const body=await readJson<any>(request);return json(await knowledgeAcademy.submitLesson(academyLesson[1]!,body),200,cors);}

    if(request.method==='GET'&&url.pathname==='/api/v1/growth/referrals')return json(await growthReferral.dashboard(),200,cors);
    if(request.method==='POST'&&url.pathname==='/api/v1/growth/referral-campaigns'){const body=await readJson<any>(request);return json(await growthReferral.createCampaign(body),201,cors);}
    const referralCampaign=url.pathname.match(/^\/api\/v1\/growth\/referral-campaigns\/([^/]+)\/state$/);
    if(referralCampaign&&request.method==='POST'){const body=await readJson<any>(request);return json(await growthReferral.setCampaignState(referralCampaign[1]!,String(body.state??'ACTIVE') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/growth/referral-shares'){const body=await readJson<any>(request);return json(await growthReferral.createShare(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/growth/referral-landings'){const body=await readJson<any>(request);return json(await growthReferral.registerLanding(String(body.code??'')),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/growth/referral-conversions'){const body=await readJson<any>(request);return json(await growthReferral.registerConversion(body),201,cors);}
    const referralVerify=url.pathname.match(/^\/api\/v1\/growth\/referral-campaigns\/([^/]+)\/conversions\/([^/]+)\/verify$/);
    if(referralVerify&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await growthReferral.verifyConversion(referralVerify[1]!,referralVerify[2]!,{accepted:Boolean(body.accepted),reason:String(body.reason??''),reviewEvidenceRef:body.reviewEvidenceRef?String(body.reviewEvidenceRef):undefined}),200,cors);}
    const referralReward=url.pathname.match(/^\/api\/v1\/growth\/referral-campaigns\/([^/]+)\/rewards\/([^/]+)\/approve$/);
    if(referralReward&&request.method==='POST')return json(await growthReferral.approveReward(referralReward[1]!,referralReward[2]!),200,cors);

    const quietWatchBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/quiet-watch$/);
    if(quietWatchBase&&request.method==='GET')return json({items:await quietWatch.list(quietWatchBase[1]!)},200,cors);
    if(quietWatchBase&&request.method==='POST')return json(await quietWatch.scan(quietWatchBase[1]!),200,cors);
    const quietWatchItem=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/quiet-watch\/([^/]+)\/(acknowledge|assistance|approve-assistance|resolve)$/);
    if(quietWatchItem&&request.method==='POST'){const body=await readJson<any>(request),groupId=quietWatchItem[1]!,id=quietWatchItem[2]!,action=quietWatchItem[3]!;if(action==='acknowledge')return json(await quietWatch.acknowledge(groupId,id,String(body.note??'')),200,cors);if(action==='assistance')return json(await quietWatch.proposeAssistance(groupId,id,body),200,cors);if(action==='approve-assistance')return json(await quietWatch.approveAssistance(groupId,id),200,cors);return json(await quietWatch.resolve(groupId,id,{note:String(body.note??''),evidenceRef:String(body.evidenceRef??'')}),200,cors);}

    const creatorDiscovery=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/creator-content$/);
    if(creatorDiscovery&&request.method==='GET')return json({items:await creatorTalent.discoverContent(creatorDiscovery[1]!,url.searchParams.get('hubId')??undefined)},200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/creator-studio')return json(await creatorTalent.myCreatorStudio(),200,cors);
    if(request.method==='POST'&&url.pathname==='/api/v1/creator-studio/content'){const body=await readJson<any>(request);return json(await creatorTalent.createContent(body),201,cors);}
    const creatorPublish=url.pathname.match(/^\/api\/v1\/creator-studio\/content\/([^/]+)\/publish$/);
    if(creatorPublish&&request.method==='POST'){const body=await readJson<any>(request);return json(await creatorTalent.publishContent(creatorPublish[1]!,body),200,cors);}
    const creatorInterest=url.pathname.match(/^\/api\/v1\/creator-studio\/content\/([^/]+)\/interest$/);
    if(creatorInterest&&request.method==='POST'){const body=await readJson<any>(request);return json(await creatorTalent.recordInterest(creatorInterest[1]!,String(body.note??'')),201,cors);}
    const creatorConversation=url.pathname.match(/^\/api\/v1\/creator-studio\/content\/([^/]+)\/interests\/([^/]+)\/conversation$/);
    if(creatorConversation&&request.method==='POST'){const body=await readJson<any>(request);return json(await creatorTalent.startConversation(creatorConversation[1]!,creatorConversation[2]!,body),201,cors);}
    const creatorAction=url.pathname.match(/^\/api\/v1\/creator-studio\/content\/([^/]+)\/interests\/([^/]+)\/action$/);
    if(creatorAction&&request.method==='POST'){const body=await readJson<any>(request);return json(await creatorTalent.createCanonicalAction(creatorAction[1]!,creatorAction[2]!,body),201,cors);}
    if(request.method==='GET'&&url.pathname==='/api/v1/talent/profile')return json(await creatorTalent.talentProfile(),200,cors);
    if(request.method==='POST'&&url.pathname==='/api/v1/talent/evidence'){const body=await readJson<any>(request);return json(await creatorTalent.addTalentEvidence(body),201,cors);}

    if(request.method==='GET'&&url.pathname==='/api/v1/business/summary')return json(await businessStudio.summary(),200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/business/records')return json({items:await businessStudio.records()},200,cors);
    if(request.method==='PUT'&&url.pathname==='/api/v1/business/workspace'){const body=await readJson<any>(request);return json(await businessStudio.configure(body),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/mandates'){const body=await readJson<any>(request);return json(await businessStudio.createMandate(body),201,cors);}
    const groupBusinessMandates=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/business\/mandates$/);
    if(groupBusinessMandates&&request.method==='GET')return json({items:await businessStudio.groupMandates(groupBusinessMandates[1]!)},200,cors);
    const businessMandateApprove=url.pathname.match(/^\/api\/v1\/business\/mandates\/([^/]+)\/approve$/);
    if(businessMandateApprove&&request.method==='POST')return json(await businessStudio.approveMandate(businessMandateApprove[1]!),200,cors);
    const businessMandate=url.pathname.match(/^\/api\/v1\/business\/mandates\/([^/]+)\/(activate|end)$/);
    if(businessMandate&&request.method==='POST'){const body=await readJson<any>(request);return json(businessMandate[2]==='activate'?await businessStudio.activateMandate(businessMandate[1]!):await businessStudio.endMandate(businessMandate[1]!,String(body.reason??'')),200,cors);}
    const delegatedReport=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/mandate-report$/);
    if(delegatedReport&&request.method==='GET'){
      const groupId=delegatedReport[1]!,decision=kernel.policy.evaluate('mandate:right',ctx,{groupId,permission:'REPORTING'});if(!decision.allowed)throw Error(decision.reason);
      const group=await repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
      const [members,groupMeetings,summary]=await Promise.all([repo.listMemberships(ctx.tenantId,groupId),repo.listMeetings(ctx.tenantId,groupId),ledger.summary(ctx.tenantId,groupId)]);
      return json({group:{id:group.id,name:group.name},computedAt:new Date().toISOString(),sourceVersion:summary.entryCount,scope:'GROUP_AGGREGATE',availability:'AVAILABLE',members:{active:members.filter(x=>x.status==='active').length},meetings:{open:groupMeetings.filter(x=>x.status==='open').length,closed:groupMeetings.filter(x=>x.status==='closed').length},ledger:{currency:summary.currency,cashBalance:summary.cashBalance,entryCount:summary.entryCount},mandateRight:'REPORTING'},200,cors);
    }
    const delegatedCommunication=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/mandate-communication-drafts$/);
    if(delegatedCommunication&&request.method==='POST'){
      const groupId=delegatedCommunication[1]!,decision=kernel.policy.evaluate('mandate:right',ctx,{groupId,permission:'COMMUNICATION_SUPPORT'});if(!decision.allowed)throw Error(decision.reason);const body=await readJson<any>(request),title=String(body.title??'').trim().slice(0,160),message=String(body.message??'').trim().slice(0,1500);if(!title||!message)throw Error('MANDATE_COMMUNICATION_REQUIRED');
      const at=new Date().toISOString(),record={id:makeId('mandate_comm'),tenantId:ctx.tenantId,groupId,moduleId:'MANDATE.COMMUNICATION_DRAFT',title,summary:message,status:'ACTIVE' as const,tags:['mandate','communication-support','manager-review-required'],data:{mandateIdsJson:JSON.stringify(ctx.mandateIds),requiresManagerPublication:true,financialEffect:false},createdBy:ctx.actorId,createdAt:at,updatedAt:at};await repo.saveWorkspaceRecord(record);await repo.saveAudit(kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'MANDATE_COMMUNICATION_DRAFT_CREATED',targetType:'group',targetId:groupId,after:{recordId:record.id},requestId:ctx.requestId}));return json(record,201,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/business/clients'){const body=await readJson<any>(request);return json(await businessStudio.createClient(body),201,cors);}
    const businessClient=url.pathname.match(/^\/api\/v1\/business\/clients\/([^/]+)\/state$/);
    if(businessClient&&request.method==='POST'){const body=await readJson<any>(request);return json(await businessStudio.setClientState(businessClient[1]!,String(body.state??'PROSPECT') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/offers'){const body=await readJson<any>(request);return json(await businessStudio.createOffer(body),201,cors);}
    const businessOffer=url.pathname.match(/^\/api\/v1\/business\/offers\/([^/]+)\/state$/);
    if(businessOffer&&request.method==='POST'){const body=await readJson<any>(request);return json(await businessStudio.setOfferState(businessOffer[1]!,String(body.state??'ACTIVE') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/requests'){const body=await readJson<any>(request);return json(await businessStudio.createRequest(body),201,cors);}
    const businessRequest=url.pathname.match(/^\/api\/v1\/business\/requests\/([^/]+)\/state$/);
    if(businessRequest&&request.method==='POST'){const body=await readJson<any>(request);return json(await businessStudio.setRequestState(businessRequest[1]!,String(body.state??'OPEN') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/quotes'){const body=await readJson<any>(request);return json(await businessStudio.createQuote(body),201,cors);}
    const businessQuote=url.pathname.match(/^\/api\/v1\/business\/quotes\/([^/]+)\/decision$/);
    if(businessQuote&&request.method==='POST'){const body=await readJson<any>(request);return json(await businessStudio.quoteDecision(businessQuote[1]!,String(body.state??'SENT') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/orders'){const body=await readJson<any>(request);return json(await businessStudio.createOrder(body),201,cors);}
    const businessOrder=url.pathname.match(/^\/api\/v1\/business\/orders\/([^/]+)\/state$/);
    if(businessOrder&&request.method==='POST'){const body=await readJson<any>(request);return json(await businessStudio.setOrderState(businessOrder[1]!,String(body.state??'DRAFT') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/contracts'){const body=await readJson<any>(request);return json(await businessStudio.createContract(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/invoices'){const body=await readJson<any>(request);return json(await businessStudio.issueInvoice(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/payments'){const body=await readJson<any>(request);return json(await businessStudio.recordPayment(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/expenses'){const body=await readJson<any>(request);return json(await businessStudio.recordExpense(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/revenues'){const body=await readJson<any>(request);return json(await businessStudio.recordRevenue(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/communications'){const body=await readJson<any>(request);return json(await businessStudio.logCommunication(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/actions'){const body=await readJson<any>(request);return json(await businessStudio.createAction(body),201,cors);}
    const businessAction=url.pathname.match(/^\/api\/v1\/business\/actions\/([^/]+)\/complete$/);
    if(businessAction&&request.method==='POST')return json(await businessStudio.completeAction(businessAction[1]!),200,cors);
    if(request.method==='POST'&&url.pathname==='/api/v1/business/time'){const body=await readJson<any>(request);return json(await businessStudio.recordTime(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/scenarios'){const body=await readJson<any>(request);return json(await businessStudio.scenario(body),201,cors);}
    if(request.method==='GET'&&url.pathname==='/api/v1/business/profitability')return json({items:await businessStudio.profitability()},200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/business/brief')return json(await businessStudio.operatingBrief(),200,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/kernel') return json({services:['context','policy','workflow','events','audit','obligations','evidence','reconciliation','cases','inbox','notifications','configuration','features','data-governance','compatibility','resource-governor'],features:{groupLaunch:kernel.features.enabled('group-launch-studio'),meetingSync:kernel.features.enabled('meeting-sync-core'),realMoney:kernel.features.enabled('financial-real-money'),manualCashLedger:true}},200,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/product/capabilities'){
      return json({version:RELEASE_VERSION,count:PRODUCT_CAPABILITY_COUNT,capabilities:PRODUCT_MODULES,readiness:buildProductReadinessReport(PRODUCT_MODULES)},200,cors);
    }

    if(request.method==='POST'&&url.pathname==='/api/v1/voice/transcribe'){
      if(!ctx.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');await requireGroup(ctx.activeGroupId,true);
      if(!options.documentAI?.run)throw new Error('VOICE_TRANSCRIPTION_UNAVAILABLE');
      const form=await request.formData(),audio=form.get('audio'),language=String(form.get('language')??ctx.locale??'fr').toLowerCase().startsWith('en')?'en':'fr';
      if(!(audio instanceof Blob)||audio.size<80)throw new Error('VOICE_TRANSCRIPTION_EMPTY');
      if(audio.size>4_000_000)throw new Error('VOICE_AUDIO_TOO_LARGE');
      const bytes=new Uint8Array(await audio.arrayBuffer());
      const result=await options.documentAI.run('@cf/openai/whisper-large-v3-turbo',{
        audio:bytesToBase64(bytes),task:'transcribe',language,vad_filter:true,condition_on_previous_text:false,
        compression_ratio_threshold:2.2,no_speech_threshold:0.55,hallucination_silence_threshold:1.5,
        initial_prompt:language==='fr'
          ?'Commande financière Eco-System. Conserver exactement les noms propres et les montants. Vocabulaire fréquent : membre, séance, cotisation, épargne, secours, remboursement, prêt, intérêts, assistance, collation, aide locale, main levée.'
          :'Eco-System financial command. Preserve proper names and amounts exactly. Frequent vocabulary: member, meeting, contribution, savings, support, repayment, loan, interest, assistance.'
      }) as any;
      const transcript=String(result?.text??result?.transcription_info?.text??'').trim();if(!transcript)throw new Error('VOICE_TRANSCRIPTION_EMPTY');
      return json({text:transcript,serverFinal:true,stored:false,model:'@cf/openai/whisper-large-v3-turbo'},200,cors);
    }


    const accountProof=url.pathname.match(/^\/api\/v1\/identity-proofs\/(cni|phone|name)$/);
    if(accountProof&&request.method==='POST'){
      if(!options.identityProof)throw new Error('IDENTITY_PROOF_UNAVAILABLE');
      const proofType=accountProof[1]!.toUpperCase() as 'CNI'|'PHONE'|'NAME',body=await readJson<Record<string,unknown>>(request);
      const value=String(body.value??body.cni??body.phone??body.name??'');
      return json(await options.identityProof.registerAccountProof(ctx.actorId,proofType,value,String(body.sourceRef??'USER_PRESENTED')),201,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/identity-proofs/matches'){
      if(!options.identityProof)throw new Error('IDENTITY_PROOF_UNAVAILABLE');
      return json(await options.identityProof.candidateMatches(ctx.actorId),200,cors);
    }
    if(request.method==='GET'&&url.pathname==='/api/v1/identity-proofs/cni/matches'){
      if(!options.identityProof)throw new Error('IDENTITY_PROOF_UNAVAILABLE');
      return json((await options.identityProof.candidateMatches(ctx.actorId)).filter(x=>x.proofType==='CNI'),200,cors);
    }
    const identityHint=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/identity-hint\/(cni|phone|name)$/);
    if(identityHint&&request.method==='POST'){
      if(!options.identityProof)throw new Error('IDENTITY_PROOF_UNAVAILABLE');
      const groupId=identityHint[1]!,membershipId=identityHint[2]!,proofType=identityHint[3]!.toUpperCase() as 'CNI'|'PHONE'|'NAME';
      const target=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!target)throw new Error('MEMBERSHIP_NOT_FOUND');
      if(target.userId!==ctx.actorId)await requireGroup(groupId,true);else await requireGroup(groupId,false);
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.identityProof.recordHistoricalHint({tenantId:ctx.tenantId,groupId,membershipId,proofType,value:String(body.value??''),createdBy:ctx.actorId}),201,cors);
    }
    const cniHint=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/cni-hint$/);
    if(cniHint&&request.method==='POST'){
      if(!options.identityProof)throw new Error('IDENTITY_PROOF_UNAVAILABLE');
      const groupId=cniHint[1]!,membershipId=cniHint[2]!,target=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!target)throw new Error('MEMBERSHIP_NOT_FOUND');
      if(target.userId!==ctx.actorId)await requireGroup(groupId,true);else await requireGroup(groupId,false);
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.identityProof.recordHistoricalCniHint({tenantId:ctx.tenantId,groupId,membershipId,cni:String(body.cni??''),createdBy:ctx.actorId}),201,cors);
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

    if(url.pathname==='/api/v1/pulse/profile'&&request.method==='GET'){
      if(!options.ecoPulse)throw new Error('ECOPULSE_UNAVAILABLE');
      return json({affinities:await options.ecoPulse.affinities(ctx.actorId,50),mode:'BETA_OPEN',sensitiveFeatures:false},200,cors);
    }
    if(url.pathname==='/api/v1/pulse/events'&&request.method==='POST'){
      if(!options.ecoPulse)throw new Error('ECOPULSE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.ecoPulse.record(ctx.actorId,{
        itemId:String(body.itemId??''),itemKind:String(body.itemKind??''),action:String(body.action??'') as EngagementAction,source:String(body.source??''),
        groupId:body.groupId?String(body.groupId):undefined,locality:body.locality?String(body.locality):undefined,tags:strArray(body.tags),
        sessionId:request.headers.get('x-session-id')??undefined
      }),202,cors);
    }
    if(url.pathname==='/api/v1/pulse/feed'&&request.method==='GET'){
      if(!options.ecoPulse)throw new Error('ECOPULSE_UNAVAILABLE');
      const candidates:RecommendationCandidate[]=[];
      if(options.interestCommunities){
        const [communities,communityContent]=await Promise.all([
          options.interestCommunities.discover(ctx.actorId,{limit:80}),
          options.interestCommunities.discoverContent(ctx.actorId,120)
        ]);
        for(const item of communities)candidates.push({
          id:item.id,kind:'interest-community',title:item.name,source:'community-discovery',tags:item.tags??[],locality:item.locality,
          freshnessAt:item.updatedAt??item.createdAt,payload:{communityId:item.id,memberCount:item.memberCount??0,viewerStatus:item.viewerStatus??''}
        });
        for(const item of communityContent)candidates.push({
          id:item.id,kind:'interest-content-'+item.kind.toLowerCase(),title:item.title??item.communityName,source:'community-content',
          tags:[...item.communityTags,item.kind,item.category??''].filter(Boolean),locality:item.locality,
          freshnessAt:item.startsAt??item.updatedAt??item.createdAt,payload:{communityId:item.communityId,contentId:item.id,contentKind:item.kind}
        });
      }
      for(const match of (await discovery.search({})).slice(0,80)){
        const listing=match.listing;
        candidates.push({
          id:listing.groupId,kind:'public-group',title:listing.name,source:'group-discovery',
          tags:[listing.family,...listing.missionTags,...listing.activityTags,listing.recruiting?'recruiting':''].filter(Boolean),
          locality:listing.locality,freshnessAt:listing.updatedAt,payload:{groupId:listing.groupId,joinPolicy:listing.joinPolicy,recruiting:listing.recruiting}
        });
      }
      if(ctx.activeGroupId){
        try{
          const meetingsForGroup=await repo.listMeetings(ctx.tenantId,ctx.activeGroupId);
          for(const meeting of meetingsForGroup.filter(x=>x.status!=='cancelled').slice(-12))candidates.push({
            id:meeting.id,kind:'meeting',title:meeting.title,source:'my-group',tags:['meeting','group-life'],
            freshnessAt:meeting.scheduledAt??meeting.openedAt,groupId:ctx.activeGroupId,payload:{meetingId:meeting.id,groupId:ctx.activeGroupId,status:meeting.status}
          });
        }catch{}
        try{
          const hubs=await community.listHubs(ctx.activeGroupId);
          for(const hub of hubs.slice(0,20))candidates.push({
            id:hub.id,kind:'group-hub',title:hub.title,source:'group-community',tags:hub.tags.filter(x=>x.startsWith('topic:')).map(x=>x.slice(6)),
            freshnessAt:hub.updatedAt,groupId:ctx.activeGroupId,payload:{hubId:hub.id,groupId:ctx.activeGroupId}
          });
        }catch{}
        try{
          const storefront=await market.storefront(ctx.activeGroupId),shopTags=storefront.shop?.categories??[];
          for(const item of (storefront.items??[]).slice(0,40))candidates.push({
            id:item.id,kind:'shop-item',title:item.name,source:'group-shop',tags:shopTags,locality:storefront.shop?.locality,
            groupId:ctx.activeGroupId,payload:{itemId:item.id,groupId:ctx.activeGroupId,unitPrice:item.unitPrice,available:item.available}
          });
        }catch{}
      }
      const ranked=await options.ecoPulse.rank(ctx.actorId,candidates,{locality:url.searchParams.get('locality')??undefined,limit:Number(url.searchParams.get('limit')??12)});
      return json({items:ranked,engine:'ECOPULSE_V1',candidateCount:candidates.length,mode:'BETA_OPEN',sensitiveFeatures:false},200,cors);
    }
    if(url.pathname==='/api/v1/communities'&&request.method==='GET'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      if(url.searchParams.get('mine')==='true')return json(await options.interestCommunities.mine(ctx.actorId),200,cors);
      return json(await options.interestCommunities.discover(ctx.actorId,{q:url.searchParams.get('q')??undefined,locality:url.searchParams.get('locality')??undefined,tags:strArray(url.searchParams.get('tags')??''),limit:Number(url.searchParams.get('limit')??50)}),200,cors);
    }
    if(url.pathname==='/api/v1/communities'&&request.method==='POST'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.interestCommunities.create(ctx.actorId,{name:String(body.name??''),description:body.description?String(body.description):undefined,locality:body.locality?String(body.locality):undefined,visibility:String(body.visibility??'PUBLIC') as any,joinPolicy:String(body.joinPolicy??'OPEN') as any,tags:strArray(body.tags)}),201,cors);
    }
    const interestCommunity=url.pathname.match(/^\/api\/v1\/communities\/([^/]+)$/);
    if(interestCommunity&&request.method==='GET'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      return json(await options.interestCommunities.get(ctx.actorId,interestCommunity[1]!),200,cors);
    }
    const interestJoin=url.pathname.match(/^\/api\/v1\/communities\/([^/]+)\/join$/);
    if(interestJoin&&request.method==='POST'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);return json(await options.interestCommunities.join(ctx.actorId,interestJoin[1]!,String(body.message??'')),200,cors);
    }
    const interestRequests=url.pathname.match(/^\/api\/v1\/communities\/([^/]+)\/join-requests$/);
    if(interestRequests&&request.method==='GET'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      return json(await options.interestCommunities.joinRequests(ctx.actorId,interestRequests[1]!),200,cors);
    }
    const interestDecision=url.pathname.match(/^\/api\/v1\/communities\/([^/]+)\/join-requests\/([^/]+)\/decision$/);
    if(interestDecision&&request.method==='POST'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);return json(await options.interestCommunities.decideJoin(ctx.actorId,interestDecision[1]!,interestDecision[2]!,String(body.decision??'') as any),200,cors);
    }
    const interestContent=url.pathname.match(/^\/api\/v1\/communities\/([^/]+)\/content$/);
    if(interestContent&&request.method==='GET'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      return json(await options.interestCommunities.feed(ctx.actorId,interestContent[1]!,Number(url.searchParams.get('limit')??100)),200,cors);
    }
    if(interestContent&&request.method==='POST'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request),metadata=body.metadata&&typeof body.metadata==='object'&&!Array.isArray(body.metadata)?body.metadata as Record<string,unknown>:{};
      return json(await options.interestCommunities.createContent(ctx.actorId,interestContent[1]!,{kind:String(body.kind??'POST') as any,title:body.title?String(body.title):undefined,body:String(body.body??''),category:body.category?String(body.category):undefined,locality:body.locality?String(body.locality):undefined,startsAt:body.startsAt?String(body.startsAt):undefined,endsAt:body.endsAt?String(body.endsAt):undefined,metadata}),201,cors);
    }
    const interestModerate=url.pathname.match(/^\/api\/v1\/communities\/([^/]+)\/content\/([^/]+)\/moderate$/);
    if(interestModerate&&request.method==='POST'){
      if(!options.interestCommunities)throw new Error('COMMUNITY_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);return json(await options.interestCommunities.moderate(ctx.actorId,interestModerate[1]!,interestModerate[2]!,String(body.state??'') as any),200,cors);
    }

    if(request.method==='POST'&&url.pathname==='/api/v1/join/redeem'){
      if(!options.groupPairing)throw new Error('PAIRING_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);return json(await options.groupPairing.redeemInvite(String(body.code??'')),200,cors);
    }
    const pairingStatusRoute=url.pathname.match(/^\/api\/v1\/join\/pairing-requests\/([^/]+)$/);
    if(pairingStatusRoute&&request.method==='GET'){
      if(!options.groupPairing)throw new Error('PAIRING_STORE_UNAVAILABLE');
      return json(await options.groupPairing.pairingStatus(pairingStatusRoute[1]!),200,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/pairing-code'){
      if(!options.groupPairing)throw new Error('PAIRING_STORE_UNAVAILABLE');
      return json(await options.groupPairing.createMemberPairingCode(),201,cors);
    }
    const joinLinksRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/join-links$/);
    if(joinLinksRoute&&request.method==='GET'){
      if(!options.groupPairing)throw new Error('PAIRING_STORE_UNAVAILABLE');
      return json(await options.groupPairing.listInvites(joinLinksRoute[1]!),200,cors);
    }
    if(joinLinksRoute&&request.method==='POST'){
      if(!options.groupPairing)throw new Error('PAIRING_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.groupPairing.createInvite(joinLinksRoute[1]!,{mode:body.mode?String(body.mode) as any:undefined,label:body.label?String(body.label):undefined,expiresHours:body.expiresHours===undefined?undefined:finite(body.expiresHours),maxUses:body.maxUses===undefined?undefined:finite(body.maxUses)}),201,cors);
    }
    const pairingRequestsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/pairing-requests$/);
    if(pairingRequestsRoute&&request.method==='GET'){
      if(!options.groupPairing)throw new Error('PAIRING_STORE_UNAVAILABLE');
      return json(await options.groupPairing.listPairingRequests(pairingRequestsRoute[1]!),200,cors);
    }
    const pairingDecisionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/pairing-requests\/([^/]+)\/decision$/);
    if(pairingDecisionRoute&&request.method==='POST'){
      if(!options.groupPairing)throw new Error('PAIRING_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.groupPairing.decidePairing(pairingDecisionRoute[1]!,pairingDecisionRoute[2]!,{decision:String(body.decision??'') as any,membershipId:body.membershipId?String(body.membershipId):undefined,reason:body.reason?String(body.reason):undefined}),200,cors);
    }
    const pairMemberCodeRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/pair-member-code$/);
    if(pairMemberCodeRoute&&request.method==='POST'){
      if(!options.groupPairing)throw new Error('PAIRING_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.groupPairing.bindWithMemberCode(pairMemberCodeRoute[1]!,String(body.membershipId??''),String(body.code??'')),200,cors);
    }


    if(request.method==='POST'&&url.pathname==='/api/v1/assistant/group-launch/analyze-files'){
      if(!options.artifacts)throw Error('R2_ARTIFACT_REQUIRED');
      const form=await request.formData();
      const files=form.getAll('files').filter((x):x is File=>typeof File!=='undefined'&&x instanceof File);
      if(!files.length)throw Error('GOVERNANCE_DOCUMENT_REQUIRED');
      if(files.length>40)throw Error('TOO_MANY_GOVERNANCE_FILES');
      const totalSize=files.reduce((n,x)=>n+x.size,0);if(totalSize>25*1024*1024)throw Error('GOVERNANCE_DOCUMENTS_TOO_LARGE');
      const warnings:string[]=[],converted:Array<{file:File;kind:string;text:string;fingerprint:string;artifactKey:string;tokens?:number;format?:string;error?:string}>=[];
      const imageCount=files.filter(x=>launchDocumentKind(x)==='IMAGE').length;
      if(imageCount===1)warnings.push('PHOTO_SET_SINGLE_IMAGE_REVIEW_RECOMMENDED');
      for(const file of files){
        if(file.size<=0)throw Error('EMPTY_GOVERNANCE_DOCUMENT');
        const kind=launchDocumentKind(file),buffer=await file.arrayBuffer(),fingerprint=await sha256Bytes(buffer);
        const artifactKey='launch-documents/'+ctx.tenantId+'/'+ctx.actorId+'/'+fingerprint+'/'+safeArtifactName(file.name);
        await options.artifacts.put(artifactKey,buffer,{httpMetadata:{contentType:file.type||'application/octet-stream'},customMetadata:{tenantId:ctx.tenantId,actorId:ctx.actorId,fingerprint,kind,originalName:file.name.slice(0,180)}});
        let text='',tokens:undefined|number,format:undefined|string,error:undefined|string;
        if(kind==='LEGACY_WORD')warnings.push('LEGACY_DOC_ARCHIVED_CONVERSION_NOT_GUARANTEED:'+file.name);
        else if(kind==='TEXT'){text=new TextDecoder('utf-8',{fatal:false}).decode(buffer);format='text';}
        else if(kind==='PDF'||kind==='DOCUMENT'||kind==='IMAGE'){
          if(!options.documentAI)warnings.push('AI_DOCUMENT_CONVERTER_UNAVAILABLE:'+file.name);
          else{
            const raw=await options.documentAI.toMarkdown({name:file.name,blob:new Blob([buffer],{type:file.type||'application/octet-stream'})},{conversionOptions:{output:{format:'text'},image:{descriptionLanguage:'fr'},pdf:{metadata:false}}});
            const unpacked=(raw&&typeof raw==='object'&&'result'in raw?(raw as {result:any}).result:raw) as MarkdownConversionResultLike|MarkdownConversionResultLike[];
            const one=Array.isArray(unpacked)?unpacked[0]:unpacked;
            if(one?.format==='error'){error=one.error??'DOCUMENT_CONVERSION_FAILED';warnings.push('DOCUMENT_CONVERSION_FAILED:'+file.name);}
            else{text=String(one?.data??'');tokens=one?.tokens;format=one?.format;}
          }
        }else warnings.push('UNSUPPORTED_GOVERNANCE_FILE:'+file.name);
        converted.push({file,kind,text,fingerprint,artifactKey,tokens,format,error});
      }
      const combinedText=converted.filter(x=>x.text.trim()).map(x=>'--- '+x.file.name+' ---\n'+x.text.trim()).join('\n\n').slice(0,1_900_000);
      if(!combinedText.trim())throw Error('NO_EXTRACTABLE_GOVERNANCE_TEXT');
      const suggestions=analyzeGovernanceText(combinedText),textFingerprint=await governanceFingerprint(combinedText);
      return json({combinedText,fingerprints:[textFingerprint,...converted.map(x=>x.fingerprint)],files:converted.map(x=>({name:x.file.name,size:x.file.size,type:x.file.type,kind:x.kind,fingerprint:x.fingerprint,artifactKey:x.artifactKey,tokens:x.tokens,format:x.format,error:x.error})),warnings,suggestions,requiresHumanConfirmation:true,financialWrites:false},200,cors);
    }

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
      const project=await foundation.createProject({projectId:body.projectId?String(body.projectId):undefined,tenantId:ctx.tenantId,createdBy:ctx.actorId,name:String(body.name??''),kind:(body.kind??'rotating_tontine') as any,governanceModel:(body.governanceModel??'founder_managed') as any,launchProfile:body.launchProfile as any,...financial});
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
      const latitude=url.searchParams.get('latitude'),longitude=url.searchParams.get('longitude'),radiusKm=url.searchParams.get('radiusKm');
      return json(await discovery.search({text:url.searchParams.get('q')??undefined,locality:url.searchParams.get('locality')??undefined,missionTags:strArray(url.searchParams.get('missionTags')),activityTags:strArray(url.searchParams.get('activityTags')),family:(url.searchParams.get('family')??undefined) as any,meetingMode:(url.searchParams.get('meetingMode')??undefined) as any,maxContribution:max?{currency,amount:finite(max)}:undefined,recruitingOnly:url.searchParams.get('recruitingOnly')==='true',latitude:latitude!==null?finite(latitude):undefined,longitude:longitude!==null?finite(longitude):undefined,radiusKm:radiusKm!==null?finite(radiusKm):undefined}),200,cors);
    }
    if(url.pathname==='/api/v1/discovery/saved-searches'&&request.method==='GET')return json({items:await discovery.savedSearches()},200,cors);
    if(url.pathname==='/api/v1/discovery/saved-searches'&&request.method==='POST')return json(await discovery.saveSearch(await readJson<any>(request)),201,cors);
    const savedRun=url.pathname.match(/^\/api\/v1\/discovery\/saved-searches\/([^/]+)\/run$/);
    if(savedRun&&request.method==='POST')return json(await discovery.runSavedSearch(savedRun[1]!),200,cors);
    const savedDelete=url.pathname.match(/^\/api\/v1\/discovery\/saved-searches\/([^/]+)$/);
    if(savedDelete&&request.method==='DELETE')return json(await discovery.deleteSavedSearch(savedDelete[1]!),200,cors);
    if(url.pathname==='/api/v1/discovery/proximity'&&request.method==='GET'){const latitude=url.searchParams.get('latitude'),longitude=url.searchParams.get('longitude'),radius=url.searchParams.get('radiusKm');if(latitude!==null||longitude!==null){if(latitude===null||longitude===null)throw new Error('INVALID_GEO_COORDINATES');return json(await discovery.proximityByCoordinates(finite(latitude),finite(longitude),radius!==null?finite(radius):20,String(url.searchParams.get('q')??'')),200,cors);}return json(await discovery.proximity(String(url.searchParams.get('locality')??''),String(url.searchParams.get('q')??'')),200,cors);}
    if(url.pathname==='/api/v1/discovery/manager-profile'&&request.method==='GET')return json({profile:await discovery.managerProfile()},200,cors);
    if(url.pathname==='/api/v1/discovery/manager-profile'&&request.method==='PUT'){const body=await readJson<any>(request);return json(await discovery.saveManagerProfile(body),200,cors);}
    if(url.pathname==='/api/v1/discovery/manager-profiles/search'&&request.method==='GET')return json({items:await discovery.searchManagerProfiles({text:url.searchParams.get('q')??undefined,locality:url.searchParams.get('locality')??undefined,expertise:strArray(url.searchParams.get('expertise')??'')})},200,cors);
    if(url.pathname==='/api/v1/discovery/candidate-profile'&&request.method==='GET')return json({profile:await discovery.candidateProfile()},200,cors);
    if(url.pathname==='/api/v1/discovery/candidate-profile'&&request.method==='PUT'){const body=await readJson<any>(request);return json(await discovery.saveCandidateProfile(body),200,cors);}
    if(url.pathname==='/api/v1/discovery/candidate-invitations'&&request.method==='GET')return json(await discovery.candidateInvitations(),200,cors);
    const candidateInvitationResponse=url.pathname.match(/^\/api\/v1\/discovery\/candidate-invitations\/([^/]+)\/respond$/);
    if(candidateInvitationResponse&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request),response=String(body.response??'');if(response!=='INTERESTED'&&response!=='DECLINED')throw new Error('INVALID_CANDIDATE_INVITATION_RESPONSE');return json(await discovery.respondCandidateInvitation(candidateInvitationResponse[1]!,response),200,cors);}
    const candidateSearchRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/discovery\/candidates$/);
    if(candidateSearchRoute&&request.method==='GET'){const latitude=url.searchParams.get('latitude'),longitude=url.searchParams.get('longitude'),radiusKm=url.searchParams.get('radiusKm');return json(await discovery.searchCandidates(ctx.tenantId,candidateSearchRoute[1]!,{text:url.searchParams.get('q')??undefined,locality:url.searchParams.get('locality')??undefined,tags:strArray(url.searchParams.get('tags')??''),latitude:latitude!==null?finite(latitude):undefined,longitude:longitude!==null?finite(longitude):undefined,radiusKm:radiusKm!==null?finite(radiusKm):undefined}),200,cors);}
    const candidateFitRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/discovery\/candidates\/([^/]+)\/fit$/);
    if(candidateFitRoute&&request.method==='GET')return json(await discovery.candidateFit(ctx.tenantId,candidateFitRoute[1]!,candidateFitRoute[2]!),200,cors);
    const candidateInviteRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/discovery\/candidates\/([^/]+)\/invite$/);
    if(candidateInviteRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await discovery.inviteCandidate(ctx.tenantId,candidateInviteRoute[1]!,candidateInviteRoute[2]!,{campaignId:body.campaignId?String(body.campaignId):undefined,message:body.message?String(body.message):undefined}),201,cors);}
    const recruitmentCampaignRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/recruitment-campaigns$/);
    if(recruitmentCampaignRoute&&request.method==='GET')return json(await discovery.recruitmentCampaigns(ctx.tenantId,recruitmentCampaignRoute[1]!),200,cors);
    if(recruitmentCampaignRoute&&request.method==='POST'){const body=await readJson<any>(request);return json(await discovery.createRecruitmentCampaign(ctx.tenantId,recruitmentCampaignRoute[1]!,body),201,cors);}
    const recruitmentCampaignState=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/recruitment-campaigns\/([^/]+)\/state$/);
    if(recruitmentCampaignState&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request),state=String(body.state??'');if(!['ACTIVE','PAUSED','CLOSED'].includes(state))throw new Error('INVALID_RECRUITMENT_STATE');return json(await discovery.setRecruitmentCampaignState(ctx.tenantId,recruitmentCampaignState[1]!,recruitmentCampaignState[2]!,state as any),200,cors);}

    const discoveryPublish=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/discovery$/);
    if(discoveryPublish&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); const band=body.contributionBand&&typeof body.contributionBand==='object'?body.contributionBand as Record<string,unknown>:undefined;
      return json(await discovery.publishGroupListing({tenantId:ctx.tenantId,groupId:discoveryPublish[1]!,visibility:String(body.visibility??'PUBLIC') as any,discoverable:Boolean(body.discoverable??true),joinPolicy:String(body.joinPolicy??'REQUEST') as any,recruiting:Boolean(body.recruiting??false),locality:body.locality?String(body.locality):undefined,missionTags:strArray(body.missionTags),activityTags:strArray(body.activityTags),meetingMode:body.meetingMode?String(body.meetingMode) as any:undefined,contributionBand:band?{currency:String(band.currency??'XAF'),min:band.min===undefined?undefined:finite(band.min),max:band.max===undefined?undefined:finite(band.max),cadence:band.cadence?String(band.cadence):undefined}:undefined,publicManagerAlias:body.publicManagerAlias?String(body.publicManagerAlias):undefined}),200,cors);
    }
    const applicationCreate=url.pathname.match(/^\/api\/v1\/discovery\/groups\/([^/]+)\/applications$/);
    if(applicationCreate&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); const band=body.requestedCommitmentBand&&typeof body.requestedCommitmentBand==='object'?body.requestedCommitmentBand as Record<string,unknown>:undefined;
      const answers=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?Object.fromEntries(Object.entries(body.answers as Record<string,unknown>).map(([k,v])=>[k,String(v??'')])):undefined;
      return json(await membershipGateway.requestToJoin({groupId:applicationCreate[1]!,message:body.message?String(body.message):undefined,requestedCommitmentBand:band?{currency:String(band.currency??'XAF'),min:band.min===undefined?undefined:finite(band.min),max:band.max===undefined?undefined:finite(band.max),cadence:band.cadence?String(band.cadence):undefined}:undefined,answers,referralCode:body.referralCode?String(body.referralCode):undefined}),201,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/membership-applications'){
      const body=await readJson<Record<string,unknown>>(request);
      const groupId=String(body.groupId??'').trim(); if(!groupId) throw new Error('GROUP_ID_REQUIRED');
      const answers=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?Object.fromEntries(Object.entries(body.answers as Record<string,unknown>).map(([k,v])=>[k,String(v??'')])):undefined;
      return json(await membershipGateway.requestToJoin({groupId,message:body.message?String(body.message):undefined,answers,referralCode:body.referralCode?String(body.referralCode):undefined}),201,cors);
    }
    const membershipQuestions=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/membership-questions$/);
    if(membershipQuestions&&request.method==='GET'){const listing=await repo.getPublicGroupListing(membershipQuestions[1]!);if(listing?.tenantId===ctx.tenantId)return json(await membershipGateway.groupMembershipQuestions(ctx.tenantId,membershipQuestions[1]!),200,cors);return json(await membershipGateway.membershipQuestions(membershipQuestions[1]!),200,cors);}
    if(membershipQuestions&&request.method==='PUT'){const body=await readJson<Record<string,unknown>>(request);return json(await membershipGateway.setMembershipQuestions(ctx.tenantId,membershipQuestions[1]!,Array.isArray(body.questions)?body.questions as any:[]),200,cors);}
    const membershipReferral=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/membership-referrals$/);
    if(membershipReferral&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await membershipGateway.createReferral(ctx.tenantId,membershipReferral[1]!,String(body.note??'')),201,cors);}
    const applicationDetail=url.pathname.match(/^\/api\/v1\/membership-applications\/([^/]+)\/details$/);
    if(applicationDetail&&request.method==='GET')return json(await membershipGateway.applicationDetails(applicationDetail[1]!),200,cors);
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
      const groupId=rubricRoute[1]!,body=await readJson<Record<string,unknown>>(request); if(!body.facets||typeof body.facets!=='object') throw new Error('RUBRIC_FACETS_REQUIRED');
      const operatingModel=body.operatingModel&&typeof body.operatingModel==='object'?body.operatingModel as RubricOperatingModel:undefined;
      const rubric=await rubrics.createRubric({id:body.id?String(body.id):undefined,tenantId:ctx.tenantId,groupId,name:String(body.name??''),aliases:strArray(body.aliases),purpose:body.purpose?String(body.purpose):undefined,facets:body.facets as any,source:body.source?String(body.source) as any:undefined,operatingModel});
      await notifyGovernanceChange(groupId,{title:'Rubrique ajoutée',message:`Rubrique « ${rubric.name} » ajoutée au groupe.`,action:{view:'operations',anchor:'rubricsManagementPanel',rubricId:rubric.id,entityKind:'RUBRIC',entityId:rubric.id,label:'Voir la rubrique'}});
      return json(rubric,201,cors);
    }
    const rubricActivityRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubrics\/([^/]+)\/activity-plan$/);
    if(rubricActivityRoute&&request.method==='PUT'){const groupId=rubricActivityRoute[1]!,rubricId=rubricActivityRoute[2]!,updated=await rubrics.updateActivityPlan(ctx.tenantId,groupId,rubricId,await readJson(request));await notifyGovernanceChange(groupId,{title:'Rubrique modifiée',message:`Caractéristiques de « ${updated.name} » modifiées.`,action:{view:'operations',anchor:'rubricsManagementPanel',rubricId,entityKind:'RUBRIC',entityId:rubricId,label:'Voir la rubrique'}});return json(updated,200,cors);}
    const rubricModelRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubrics\/([^/]+)\/operating-model$/);
    if(rubricModelRoute&&request.method==='PUT'){
      const groupId=rubricModelRoute[1]!,rubricId=rubricModelRoute[2]!,body=await readJson<RubricOperatingModel>(request),updated=await rubrics.updateOperatingModel({tenantId:ctx.tenantId,groupId,rubricId,model:body});
      await notifyGovernanceChange(groupId,{title:'Règle de rubrique modifiée',message:`Règle opérationnelle de « ${updated.name} » modifiée.`,action:{view:'operations',anchor:'rubricsManagementPanel',rubricId,entityKind:'RUBRIC',entityId:rubricId,label:'Voir la rubrique'}});
      return json(updated,200,cors);
    }
    const rubricPoliciesRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubrics\/([^/]+)\/policies$/);
    if(rubricPoliciesRoute&&request.method==='PUT'){
      const groupId=rubricPoliciesRoute[1]!,rubricId=rubricPoliciesRoute[2]!,body=await readJson<RubricPolicies>(request),result=await updateRubricPoliciesGoverned(groupId,rubricId,body),updated=result.updated;
      const revision:any=result.revision,scopeLabel=revision?String(revision.scope):'UNCHANGED_SCOPE';
      await notifyGovernanceChange(groupId,{title:'Politiques de rubrique modifiées',message:revision?`Politique de « ${updated.name} » versionnée · portée ${scopeLabel} · effet ${String(revision.effectiveAt)}.`:`Politiques de « ${updated.name} » modifiées.`,action:{view:'operations',anchor:'rubricsManagementPanel',rubricId,entityKind:'RUBRIC',entityId:rubricId,label:'Voir la rubrique'}});
      const loanPolicy=updated.policies?.loan;
      if(loanPolicy)try{await publishLive(groupId,'RULE_UPDATE','loan-policy:'+rubricId+':'+String(updated.version??0),{kind:'LOAN_POLICY',rubricId,rateBasisPointsPerPeriod:Number(loanPolicy.rateBasisPointsPerPeriod??0),paymentPriority:String(loanPolicy.paymentPriority??'CAPITAL_FIRST'),interestTiming:String(loanPolicy.interestTiming??'NEXT_SESSION_DUE'),fundingMode:String(loanPolicy.fundingMode??'AVAILABLE_GROUP_CASH'),carryForwardUnusedFunds:loanPolicy.carryForwardUnusedFunds!==false,revisionId:String(revision?.id??''),scope:String(revision?.scope??''),effectiveAt:String(revision?.effectiveAt??''),effectiveMeetingId:String(revision?.effectiveMeetingId??''),affectedLoanIds:result.affectedLoanIds,actorId:ctx.actorId});}catch{}
      return json(updated,200,cors);
    }
    const rubricPreviewRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubrics\/([^/]+)\/preview-cycle$/);
    if(rubricPreviewRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);return json(await rubrics.previewCycle({tenantId:ctx.tenantId,groupId:rubricPreviewRoute[1]!,rubricId:rubricPreviewRoute[2]!,memberCount:finite(body.memberCount),collectedFromMembers:finite(body.collectedFromMembers),solidarityCoverageAmount:body.solidarityCoverageAmount===undefined?undefined:finite(body.solidarityCoverageAmount),beneficiaryDisbursement:body.beneficiaryDisbursement===undefined?undefined:finite(body.beneficiaryDisbursement)}),200,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/governance/claims/suggest'){
      const body=await readJson<Record<string,unknown>>(request); return json({suggestions:rubrics.suggestClaimsFromGovernanceText(String(body.text??'')),automaticActivation:false},200,cors);
    }

    const statement=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/statement$/);
    if(statement&&request.method==='GET'){
      const groupId=statement[1]!,membershipId=statement[2]!,base=await ledger.memberStatement(ctx.tenantId,groupId,membershipId,url.searchParams.get('asOf')??undefined);
      const [defs,meetingRows,entries,audits,loans,obligations]=await Promise.all([repo.listRubricDefinitions(ctx.tenantId,groupId),repo.listMeetings(ctx.tenantId,groupId),repo.listLedgerEntries(ctx.tenantId,groupId),repo.listAudit(ctx.tenantId),completion.list(groupId,'LOAN').catch(()=>[]),repo.listObligations(ctx.tenantId)]);
      const membership=await repo.getMembership(ctx.tenantId,groupId,membershipId),rubricMap=new Map(defs.map(r=>[r.id,r])),meetingMap=new Map(meetingRows.map(m=>[m.id,m]));
      const isLoanRubric=(rubricId?:string)=>{const r=rubricId?rubricMap.get(rubricId):undefined,n=String(r?.name??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return String(r?.facets?.custom?.systemKey??'')==='LOAN'||/^prets?$|^loans?$/.test(n);};
      const isPositiveContribution=(rubricId?:string)=>{const r=rubricId?rubricMap.get(rubricId):undefined;return !isLoanRubric(rubricId)&&(!r||r.facets?.direction!=='OUTFLOW');};
      const enriched=[] as any[];
      for(const r of base.receipts){const meeting=r.meetingId?meetingMap.get(r.meetingId):undefined,rubric=r.rubricId?rubricMap.get(r.rubricId):undefined,author=await actorLabelFor(r.receivedBy),reversals=entries.filter(e=>e.reversalOfEntryId===r.ledgerEntryId),corrections=[] as any[];for(const rev of reversals){const audit=audits.find(a=>a.action==='LEDGER_ENTRY_REVERSED'&&a.targetId===rev.id);corrections.push({at:rev.createdAt,authorId:rev.createdBy,authorName:await actorLabelFor(rev.createdBy),reason:String(audit?.metadata?.reason??''),entryId:rev.id});}enriched.push({...r,meetingTitle:meeting?('Réunion du '+new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date(meeting.scheduledAt??meeting.openedAt))):'Sans séance',rubricName:rubric?.name??'Sans rubrique',receivedByName:author,isModified:corrections.length>0||r.netAmount!==r.amount.amount,corrections,financialNature:isLoanRubric(r.rubricId)?'LOAN_DEBT':isPositiveContribution(r.rubricId)?'CONTRIBUTION':'OUTFLOW'});}
      const totalNetContributions=base.receipts.filter(r=>isPositiveContribution(r.rubricId)).reduce((n,r)=>n+r.netAmount,0),legacyLoanPrincipal=base.receipts.filter(r=>isLoanRubric(r.rubricId)).reduce((n,r)=>n+Math.max(0,r.netAmount),0);
      const memberLoans=loans.filter(x=>String(x.data?.borrowerMembershipId??'')===membershipId&&['DISBURSED','REPAYING'].includes(String(x.data?.completionState??''))),canonicalPrincipal=memberLoans.reduce((n,x)=>n+Number(x.data?.outstandingPrincipal??0),0),debtInterest=memberLoans.reduce((n,x)=>n+Number(x.data?.unpaidInterest??0),0),otherDebt=membership?obligations.filter(x=>x.groupId===groupId&&x.assigneeId===membership.userId&&(x.status==='open'||x.status==='overdue')).reduce((n,x)=>n+Number(x.amount?.amount??0),0):0,debtPrincipal=legacyLoanPrincipal+canonicalPrincipal,totalDebt=debtPrincipal+debtInterest+otherDebt;
      const loanDebts=memberLoans.map(x=>({loanId:x.id,title:x.title,outstandingPrincipal:Number(x.data?.outstandingPrincipal??0),unpaidInterest:Number(x.data?.unpaidInterest??0),totalDebt:Number(x.data?.outstandingPrincipal??0)+Number(x.data?.unpaidInterest??0),lastAccruedInterest:Number(x.data?.lastAccruedInterest??0),interestAppliesToMeetingId:String(x.data?.interestAppliesToMeetingId??'')||null,interestAppliesToLabel:String(x.data?.interestAppliesToLabel??'')||null,interestSourceClosedMeetingId:String(x.data?.interestSourceClosedMeetingId??'')||null}));
      return json({...base,totalNetContributions,receipts:enriched,debtPrincipal,debtInterest,otherDebt,totalDebt,loanDebts},200,cors);
    }
    const meetingHistoryRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/history$/);
    if(meetingHistoryRoute&&request.method==='GET'){
      const groupId=meetingHistoryRoute[1]!,meetingId=meetingHistoryRoute[2]!;await requireGroup(groupId);const meeting=await repo.getMeeting(ctx.tenantId,groupId,meetingId);if(!meeting)throw new Error('MEETING_NOT_FOUND');
      const [positions,defs,memberRows,entries,audits]=await Promise.all([ledger.receiptPositions(ctx.tenantId,groupId),repo.listRubricDefinitions(ctx.tenantId,groupId),repo.listMemberships(ctx.tenantId,groupId),repo.listLedgerEntries(ctx.tenantId,groupId),repo.listAudit(ctx.tenantId)]);const items=[] as any[];
      for(const r of positions.filter(x=>x.meetingId===meetingId)){const member=memberRows.find(x=>x.id===r.membershipId),user=member?await repo.getUser(member.userId):undefined,rubric=defs.find(x=>x.id===r.rubricId),reversals=entries.filter(e=>e.reversalOfEntryId===r.ledgerEntryId);items.push({id:r.id,kind:reversals.length||r.netAmount!==r.amount.amount?'FINANCIAL_CHANGE':'FINANCIAL_ENTRY',meetingId,meetingTitle:meeting.title,memberId:r.membershipId,memberName:user?.displayName??r.membershipId,rubricId:r.rubricId,rubricName:rubric?.name??'Sans rubrique',amount:r.amount.amount,netAmount:r.netAmount,at:r.receivedAt,authorId:r.receivedBy,authorName:await actorLabelFor(r.receivedBy),reason:r.latePosting?.reason??null});for(const rev of reversals){const audit=audits.find(a=>a.action==='LEDGER_ENTRY_REVERSED'&&a.targetId===rev.id);items.push({id:rev.id,kind:'FINANCIAL_CORRECTION',meetingId,meetingTitle:meeting.title,memberId:r.membershipId,memberName:user?.displayName??r.membershipId,rubricId:r.rubricId,rubricName:rubric?.name??'Sans rubrique',amount:r.amount.amount,netAmount:r.netAmount,at:rev.createdAt,authorId:rev.createdBy,authorName:await actorLabelFor(rev.createdBy),reason:String(audit?.metadata?.reason??'Correction financière')});}}
      for(const a of audits.filter(a=>a.targetId===meetingId||String((a.after as any)?.meetingId??'')===meetingId||String((a.metadata as any)?.meetingId??'')===meetingId)){if(items.some(x=>x.id===a.id))continue;items.push({id:a.id,kind:a.action,meetingId,meetingTitle:meeting.title,at:a.at,authorId:a.actorId,authorName:a.actorId?await actorLabelFor(a.actorId):'Système',reason:String((a.metadata as any)?.reason??'')});}
      return json({meetingId,items:items.sort((a,b)=>String(b.at).localeCompare(String(a.at)))},200,cors);
    }
    const members=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members$/);
    if(members&&request.method==='GET'){
      const group=await repo.getGroup(ctx.tenantId,members[1]!); if(!group) return json({error:'NOT_FOUND'},404,cors);
      const list=await foundation.ensureMemberNumbers(ctx.tenantId,group.id,ctx.requestId+':member-numbers'); const joined=[];
      for(const m of list){const user=await repo.getUser(m.userId);joined.push({...m,displayName:user?.displayName??m.userId});}
      return json(joined,200,cors);
    }
    if(members&&request.method==='POST'){
      const group=await repo.getGroup(ctx.tenantId,members[1]!); if(!group) return json({error:'NOT_FOUND'},404,cors);
      const body=await readJson<Record<string,unknown>>(request); const displayName=String(body.displayName??'').trim(); if(!displayName) throw new Error('MEMBER_NAME_REQUIRED');
      const membership=await foundation.addMember(ctx.tenantId,group.id,{id:String(body.userId??makeId('user')),displayName,locale:String(body.locale??ctx.locale),createdAt:new Date().toISOString()},String(body.operationId??body.membershipId??request.headers.get('x-idempotency-key')??makeId('req')),body.membershipId?String(body.membershipId):undefined);
      await notifyGovernanceChange(group.id,{title:'Membre ajouté',message:`Membre « ${displayName} » ajouté au groupe.`,action:{view:'members',membershipId:membership.id,entityKind:'MEMBER',entityId:membership.id,label:'Voir le membre'}});
      return json(membership,201,cors);
    }
    const memberNumberOrder=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/member-number-order$/);
    if(memberNumberOrder&&request.method==='PUT'){
      const groupId=memberNumberOrder[1]!,body=await readJson<Record<string,unknown>>(request),membershipIds=strArray(body.membershipIds);
      return json(await foundation.setMemberNumberOrder(ctx.tenantId,groupId,membershipIds,String(body.operationId??ctx.requestId)),200,cors);
    }
    const memberLifecycle=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/lifecycle$/);
    if(memberLifecycle&&request.method==='PUT'){
      const groupId=memberLifecycle[1]!,membershipId=memberLifecycle[2]!,group=await requireGroup(groupId,true);
      const existing=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!existing)throw new Error('MEMBERSHIP_NOT_FOUND');
      const body=await readJson<Record<string,unknown>>(request),status=String(body.status??existing.status) as import('../../../packages/contracts/src/index.js').Membership['status'];
      if(!['invited','waitlisted','trial','active','suspended','left'].includes(status))throw new Error('INVALID_MEMBERSHIP_STATUS');
      const expected=body.expectedRevision===undefined?Number(existing.lifecycleRevision??0):finite(body.expectedRevision);
      if(expected!==Number(existing.lifecycleRevision??0))throw new Error('STALE_MEMBERSHIP_VERSION');
      const roles=body.roles===undefined?existing.roles:strArray(body.roles);if(existing.userId===group.createdBy&&!roles.includes('founder'))throw new Error('FOUNDER_ROLE_REQUIRED');
      const now=new Date().toISOString(),reinstated=status==='active'&&['suspended','left','waitlisted','trial'].includes(existing.status)?now:existing.reinstatedAt;
      const next={...existing,status,roles,historicalJoinedAt:body.historicalJoinedAt?String(body.historicalJoinedAt):existing.historicalJoinedAt,probationEndsAt:body.probationEndsAt?String(body.probationEndsAt):undefined,lifecycleReason:body.reason?String(body.reason):existing.lifecycleReason,lifecycleUpdatedAt:now,lifecycleUpdatedBy:ctx.actorId,lifecycleRevision:Number(existing.lifecycleRevision??0)+1,reinstatedAt:reinstated};
      await repo.saveMembership(next);const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'MEMBERSHIP_LIFECYCLE_UPDATED',targetType:'membership',targetId:membershipId,before:{status:existing.status,roles:existing.roles,revision:existing.lifecycleRevision??0},after:{status:next.status,roles:next.roles,revision:next.lifecycleRevision},requestId:ctx.requestId});await repo.saveAudit(audit);
      const mName=await memberLabel(groupId,membershipId),msg=`Membre « ${mName} » : statut ${existing.status} → ${next.status}; rôles ${existing.roles.join(', ')||'—'} → ${next.roles.join(', ')||'—'}.`;
      await notifyGovernanceChange(groupId,{title:'Membre modifié',message:msg,action:{view:'members',membershipId,entityKind:'MEMBER',entityId:membershipId,label:'Voir le membre'}});
      await notifications.publish(groupId,{title:'Votre dossier de membre a été modifié',message:msg,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[membershipId],priority:'HIGH',action:{view:'members',membershipId,entityKind:'MEMBER',entityId:membershipId,label:'Voir mon dossier'}});
      return json(next,200,cors);
    }
    const memberNameRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/name$/);
    if(memberNameRoute&&request.method==='PUT'){
      const groupId=memberNameRoute[1]!,membershipId=memberNameRoute[2]!;await requireGroup(groupId,true);
      const membership=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!membership)throw new Error('MEMBERSHIP_NOT_FOUND');
      const user=await repo.getUser(membership.userId);if(!user)throw new Error('USER_NOT_FOUND');
      const body=await readJson<Record<string,unknown>>(request),displayName=String(body.displayName??'').trim(),reason=String(body.reason??'').trim();
      if(!displayName)throw new Error('MEMBER_NAME_REQUIRED');if(!reason)throw new Error('CHANGE_REASON_REQUIRED');if(displayName===user.displayName)return json({...membership,displayName},200,cors);
      const before=user.displayName,next={...user,displayName};await repo.saveUser(next);await repo.saveAudit(kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'MEMBER_NAME_UPDATED',targetType:'membership',targetId:membershipId,before:{displayName:before},after:{displayName},metadata:{reason},requestId:ctx.requestId}));
      const actor=await actorLabel(),message=`Nom du membre corrigé : « ${before} » → « ${displayName} ». Motif : ${reason}. Auteur : ${actor}.`,action={view:'members',membershipId,entityKind:'MEMBER',entityId:membershipId,label:'Voir le membre'};
      await notifications.publish(groupId,{title:'Nom d’un membre modifié',message,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:'HIGH',action});await notifications.publish(groupId,{title:'Votre nom a été corrigé dans le groupe',message,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[membershipId],priority:'HIGH',action});
      return json({...membership,displayName},200,cors);
    }
    const memberParticipation=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/participations$/);
    if(memberParticipation&&request.method==='GET'){
      const groupId=memberParticipation[1]!,membershipId=memberParticipation[2]!;await requireGroup(groupId);if(!(await repo.getMembership(ctx.tenantId,groupId,membershipId)))throw new Error('MEMBERSHIP_NOT_FOUND');
      return json((await repo.listWorkspaceRecords(ctx.tenantId,'MEMBERSHIP.RUBRIC_PARTICIPATION',groupId)).filter(x=>String(x.data.membershipId??'')===membershipId),200,cors);
    }
    if(memberParticipation&&request.method==='POST'){
      const groupId=memberParticipation[1]!,membershipId=memberParticipation[2]!;await requireGroup(groupId,true);if(!(await repo.getMembership(ctx.tenantId,groupId,membershipId)))throw new Error('MEMBERSHIP_NOT_FOUND');
      const body=await readJson<Record<string,unknown>>(request),rubricId=String(body.rubricId??''),rubric=await repo.getRubricDefinition(ctx.tenantId,groupId,rubricId);if(!rubric)throw new Error('RUBRIC_NOT_FOUND');
      const status=String(body.status??'ACTIVE');if(!['ACTIVE','PAUSED','OPTED_OUT'].includes(status))throw new Error('INVALID_PARTICIPATION_STATUS');const shareCount=finite(body.shareCount,1);if(!Number.isInteger(shareCount)||shareCount<0)throw new Error('INVALID_SHARE_COUNT');
      const id='member_rubric_'+encodeURIComponent(JSON.stringify([groupId,membershipId,rubricId])),existing=await repo.getWorkspaceRecord(ctx.tenantId,id),now=new Date().toISOString();
      const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:'MEMBERSHIP.RUBRIC_PARTICIPATION',title:rubric.name,summary:'Participation '+status,status:'ACTIVE',tags:['membership','rubric-participation'],data:{membershipId,rubricId,rubricName:rubric.name,status,shareCount,shareNames:String(body.shareNames??'')},createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??now,updatedAt:now};
      await repo.saveWorkspaceRecord(record);const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'MEMBERSHIP_RUBRIC_PARTICIPATION_UPDATED',targetType:'workspace_record',targetId:id,before:existing?.data,after:record.data,requestId:ctx.requestId});await repo.saveAudit(audit);return json(record,existing?200:201,cors);
    }

    const meetingRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings$/);
    if(meetingRoute&&request.method==='GET') return json(await repo.listMeetings(ctx.tenantId,meetingRoute[1]!),200,cors);
    if(meetingRoute&&request.method==='POST'){
      const groupId=meetingRoute[1]!,body=await readJson<Record<string,unknown>>(request),meeting=await meetings.openMeeting(ctx.tenantId,groupId,{
        id:body.id?String(body.id):undefined,title:String(body.title??''),scheduledAt:body.scheduledAt?String(body.scheduledAt):undefined,location:body.location?String(body.location):undefined,theme:body.theme?String(body.theme):undefined,dressCode:body.dressCode?String(body.dressCode):undefined
      });
      await notifyGovernanceChange(groupId,{title:'Séance ajoutée',message:`Séance « ${meeting.title} » créée.`,action:{view:'sessions',meetingId:meeting.id,entityKind:'MEETING',entityId:meeting.id,label:'Voir la séance'}});
      return json(meeting,201,cors);
    }
    const meetingContext=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/context$/);
    if(meetingContext&&request.method==='PUT'){
      const groupId=meetingContext[1]!,meetingId=meetingContext[2]!,before=await repo.getMeeting(ctx.tenantId,groupId,meetingId);
      const body=await readJson<Record<string,unknown>>(request);
      const optional=(key:string)=>Object.prototype.hasOwnProperty.call(body,key)?(body[key]===null?null:String(body[key])):undefined;
      const updated=await meetings.updateMeetingContext(ctx.tenantId,groupId,meetingId,{scheduledAt:optional('scheduledAt'),location:optional('location'),theme:optional('theme'),dressCode:optional('dressCode')});
      const changes:string[]=[];
      if(before){for(const key of ['scheduledAt','location','theme','dressCode'] as const){if(String(before[key]??'')!==String(updated[key]??''))changes.push(`${key}: « ${String(before[key]??'—')} » → « ${String(updated[key]??'—')} »`);}}
      if(changes.length){
        const closed=before?.status==='closed',actor=await actorLabel();
        await notifications.publish(groupId,{title:closed?'Séance clôturée modifiée':'Séance modifiée',message:`${actor} a modifié « ${updated.title} » · ${changes.join(' · ')}`,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:closed?'CRITICAL':'HIGH',action:{view:'sessions',meetingId,entityKind:'MEETING',entityId:meetingId,label:'Voir la séance'}});
        await publishLive(groupId,'MEETING_UPDATE',(closed?'closed-':'')+'meeting-context:'+meetingId+':'+new Date().toISOString(),{meetingId,kind:closed?'CLOSED_MEETING_CONTEXT_CHANGED':'MEETING_CONTEXT_CHANGED',meetingClosed:Boolean(closed),changedFields:changes.map(x=>x.split(':')[0]).join(',')});
      }
      return json(updated,200,cors);
    }
    const meetingAttendance=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/attendance$/);
    if(meetingAttendance&&request.method==='GET')return json(await meetings.listAttendance(ctx.tenantId,meetingAttendance[1]!,meetingAttendance[2]!),200,cors);
    if(meetingAttendance&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await meetings.recordAttendance(ctx.tenantId,meetingAttendance[1]!,meetingAttendance[2]!,{membershipId:String(body.membershipId??''),attendance:String(body.attendance??'') as any,note:body.note?String(body.note):undefined}),200,cors);
    }
    const meetingBeneficiaries=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/beneficiaries$/);
    if(meetingBeneficiaries&&request.method==='GET')return json(await meetings.listBenefitDeclarations(ctx.tenantId,meetingBeneficiaries[1]!,meetingBeneficiaries[2]!),200,cors);
    if(meetingBeneficiaries&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await meetings.declareBenefit(ctx.tenantId,meetingBeneficiaries[1]!,meetingBeneficiaries[2]!,{membershipId:String(body.membershipId??''),rubricId:body.rubricId?String(body.rubricId):undefined,amount:finite(body.amount),currency:String(body.currency??'XAF'),note:body.note?String(body.note):undefined}),201,cors);
    }
    const benefitEvidenceUpload=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/beneficiary-evidence\/upload$/);
    if(benefitEvidenceUpload&&request.method==='POST'){
      const groupId=benefitEvidenceUpload[1]!,meetingId=benefitEvidenceUpload[2]!;await requireGroup(groupId);
      if(!(await repo.getMeeting(ctx.tenantId,groupId,meetingId)))throw new Error('MEETING_NOT_FOUND');
      const form=await request.formData(),file=form.get('file');
      if(!(file instanceof File)||file.size<=0)throw new Error('EVIDENCE_FILE_REQUIRED');
      if(file.size>10_000_000)throw new Error('EVIDENCE_FILE_TOO_LARGE');
      const ext=launchDocumentExtension(file.name),mime=file.type.toLowerCase();
      if(!mime.startsWith('image/')&&mime!=='application/pdf'&&!['jpg','jpeg','png','webp','pdf'].includes(ext))throw new Error('EVIDENCE_FILE_TYPE_NOT_ALLOWED');
      const buffer=await file.arrayBuffer(),fingerprint=await sha256Bytes(buffer),key='evidence/'+ctx.tenantId+'/'+groupId+'/'+meetingId+'/'+fingerprint+'-'+safeArtifactName(file.name);
      try{await artifactStore.put(key,buffer,{httpMetadata:{contentType:file.type||'application/octet-stream'},customMetadata:{tenantId:ctx.tenantId,groupId,meetingId,fingerprint,purpose:'MEETING_BENEFIT_RECEIPT'}});}
      catch(error){if(error instanceof Error&&['D1_FALLBACK_TEXT_ONLY','INVALID_ARTIFACT_KEY','R2_REQUIRED_FOR_LARGE_ARTIFACT'].includes(error.message))throw new Error('R2_REQUIRED_FOR_EVIDENCE_FILE');throw error;}
      return json({artifactKey:key,fingerprint,name:file.name,size:file.size,contentType:file.type||'application/octet-stream'},201,cors);
    }
    const benefitEvidence=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/beneficiary-evidence$/);
    if(benefitEvidence&&request.method==='GET')return json(await meetings.listBenefitEvidence(ctx.tenantId,benefitEvidence[1]!,benefitEvidence[2]!),200,cors);
    if(benefitEvidence&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await meetings.recordBenefitEvidence(ctx.tenantId,benefitEvidence[1]!,benefitEvidence[2]!,{
        declarationId:String(body.declarationId??''),membershipId:String(body.membershipId??''),rubricId:body.rubricId?String(body.rubricId):undefined,
        amount:body.amount===undefined?undefined:finite(body.amount),currency:body.currency?String(body.currency):undefined,
        method:String(body.method??'') as any,artifactKey:body.artifactKey?String(body.artifactKey):undefined,fingerprint:body.fingerprint?String(body.fingerprint):undefined,
        note:body.note?String(body.note):undefined,idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('benefit_evidence'))
      }),201,cors);
    }

    const closeMeeting=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/close$/);
    if(closeMeeting&&request.method==='POST'){
      const groupId=closeMeeting[1]!,meetingId=closeMeeting[2]!,closed=await meetings.closeMeeting(ctx.tenantId,groupId,meetingId);
      const debtUpdate=await accrueLoanInterestAfterMeetingClose(groupId,closed);
      return json({...closed,debtUpdate},200,cors);
    }

    const miscCatalog=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/misc-rubrics$/);
    if(miscCatalog&&request.method==='GET'){
      const meetingId=url.searchParams.get('meetingId')??undefined;
      return json(await miscRubrics.list(miscCatalog[1]!,meetingId),200,cors);
    }
    if(miscCatalog&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request),action=String(body.action??'ensure_starters');
      if(action==='ensure_starters')return json(await miscRubrics.ensureStarters(miscCatalog[1]!),200,cors);
      if(action==='create_custom')return json(await miscRubrics.createCustom(miscCatalog[1]!,{name:String(body.name??''),description:body.description?String(body.description):undefined,lifecycle:String(body.lifecycle??'PERSISTENT') as any,amountMode:String(body.amountMode??'VARIABLE') as any,defaultAmount:body.defaultAmount===undefined?undefined:finite(body.defaultAmount),activeFirstSessions:body.activeFirstSessions===undefined?undefined:finite(body.activeFirstSessions)}),201,cors);
      throw new Error('INVALID_MISC_ACTION');
    }
    const miscPostings=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/misc-rubrics\/postings$/);
    if(miscPostings&&request.method==='GET')return json(await miscRubrics.postings(miscPostings[1]!,{meetingId:url.searchParams.get('meetingId')??undefined,membershipId:url.searchParams.get('membershipId')??undefined}),200,cors);
    if(miscPostings&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request),items=Array.isArray(body.items)?body.items as Array<Record<string,unknown>>:[];
      const results=await miscRubrics.postBatch(miscPostings[1]!,{membershipId:String(body.membershipId??''),meetingId:body.meetingId?String(body.meetingId):undefined,idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('misc_batch')),items:items.map(x=>({templateId:String(x.templateId??''),amount:finite(x.amount),note:x.note?String(x.note):undefined}))});
      for(const result of results){
        const entry=await repo.getLedgerEntry(ctx.tenantId,miscPostings[1]!,result.ledgerEntryId),membership=await repo.getMembership(ctx.tenantId,miscPostings[1]!,String(body.membershipId??''));
        if(entry&&membership){
          const positions=await ledger.receiptPositions(ctx.tenantId,miscPostings[1]!);const after=positions.filter(x=>x.membershipId===membership.id).reduce((n,x)=>n+x.netAmount,0);
          const notice=await memberControl.create({groupId:miscPostings[1]!,membershipId:membership.id,entry,operationType:'OTHER_RUBRIC_'+result.template.kind,amount:result.amount,currency:result.currency,rubricId:result.template.rubricId,meetingId:body.meetingId?String(body.meetingId):undefined,previousSituation:after-result.amount,newSituation:after});
          await publishLive(miscPostings[1]!,'FINANCIAL_NOTICE','notice:'+notice.id,{noticeId:notice.id,ledgerEntryId:notice.ledgerEntryId,operationType:notice.operationType,amount:notice.amount,currency:notice.currency,previousSituation:notice.previousSituation??0,newSituation:notice.newSituation??0},notice.userId);
        }
      }
      return json({results},201,cors);
    }

    const contributionCorrectionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/contributions\/([^/]+)\/correct$/);
    if(contributionCorrectionRoute&&request.method==='POST'){
      const groupId=contributionCorrectionRoute[1]!,receiptId=decodeURIComponent(contributionCorrectionRoute[2]!),group=await requireGroup(groupId,true);
      const body=await readJson<Record<string,unknown>>(request),newAmount=Number(body.newAmount),reason=String(body.reason??'').trim();
      if(!Number.isSafeInteger(newAmount)||newAmount<0)throw new Error('INVALID_CONTRIBUTION_AMOUNT');
      if(!reason)throw new Error('REVERSAL_REASON_REQUIRED');
      const receipts=await repo.listContributionReceipts(ctx.tenantId,groupId),receipt=receipts.find(x=>x.id===receiptId);if(!receipt)throw new Error('CONTRIBUTION_RECEIPT_NOT_FOUND');
      const target=await repo.getMembership(ctx.tenantId,groupId,receipt.membershipId);if(!target)throw new Error('MEMBERSHIP_NOT_FOUND');
      const positionsBefore=await ledger.receiptPositions(ctx.tenantId,groupId),position=positionsBefore.find(x=>x.id===receipt.id);if(!position||position.netAmount<=0)throw new Error('CONTRIBUTION_ALREADY_REVERSED');
      const beforeSituation=positionsBefore.filter(x=>x.membershipId===receipt.membershipId).reduce((n,x)=>n+x.netAmount,0),oldAmount=position.netAmount;
      const selfBenefit=target.userId===ctx.actorId,requiresIndependentReview=true,correctionId='financial_correction_'+makeId('corr');
      const stamp=new Date().toISOString(),record:WorkspaceRecord={id:correctionId,tenantId:ctx.tenantId,groupId,moduleId:'FINANCE.CORRECTION',title:'Correction financière',summary:reason,status:'ACTIVE',tags:['financial-correction',selfBenefit?'self-benefit':'manager-correction'],data:{receiptId:receipt.id,membershipId:receipt.membershipId,rubricId:receipt.rubricId??null,meetingId:receipt.meetingId??null,oldAmount,newAmount,beforeSituation,authorId:ctx.actorId,selfBenefit,requiresIndependentReview},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
      await repo.saveWorkspaceRecord(record);
      await repo.saveAudit(kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'FINANCIAL_CORRECTION_REQUESTED',targetType:'contribution_receipt',targetId:receipt.id,requestId:ctx.requestId,metadata:{correctionId,oldAmount,newAmount,beforeSituation,selfBenefit,reason}}));
      try{
        const reversal=await ledger.reverseEntry({tenantId:ctx.tenantId,groupId,entryId:receipt.ledgerEntryId,reason});
        let replacementReceipt:import('../../../packages/contracts/src/index.js').ContributionReceipt|undefined,replacementEntry:import('../../../packages/contracts/src/index.js').LedgerEntry|undefined;
        if(newAmount>0){
          replacementReceipt=await ledger.recordCashContribution({tenantId:ctx.tenantId,groupId,membershipId:receipt.membershipId,amount:newAmount,currency:receipt.amount.currency,meetingId:receipt.meetingId,rubricId:receipt.rubricId,idempotencyKey:'correction:'+correctionId});
          replacementEntry=await repo.getLedgerEntry(ctx.tenantId,groupId,replacementReceipt.ledgerEntryId);
        }
        const positionsAfter=await ledger.receiptPositions(ctx.tenantId,groupId),afterSituation=positionsAfter.filter(x=>x.membershipId===receipt.membershipId).reduce((n,x)=>n+x.netAmount,0),noticeEntry=replacementEntry??reversal;
        const notice=await memberControl.create({groupId,membershipId:receipt.membershipId,entry:noticeEntry,operationType:'CASH_CONTRIBUTION_CORRECTED',amount:newAmount,currency:receipt.amount.currency,rubricId:receipt.rubricId,meetingId:receipt.meetingId,previousSituation:beforeSituation,newSituation:afterSituation,previousAmount:oldAmount,newAmount,correctionReason:reason,selfBenefit,requiresIndependentReview});
        await repo.saveWorkspaceRecord({...record,status:'DONE',tags:[...record.tags,'completed'],data:{...record.data,reversalEntryId:reversal.id,replacementReceiptId:replacementReceipt?.id??null,replacementEntryId:replacementEntry?.id??null,afterSituation,noticeId:notice.id},updatedAt:new Date().toISOString()});
        await repo.saveAudit(kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'FINANCIAL_CORRECTION_COMPLETED',targetType:'financial_correction',targetId:correctionId,requestId:ctx.requestId,metadata:{receiptId:receipt.id,reversalEntryId:reversal.id,replacementReceiptId:replacementReceipt?.id??'',oldAmount,newAmount,beforeSituation,afterSituation,selfBenefit,requiresIndependentReview}}));
        try{await publishLive(groupId,'FINANCIAL_NOTICE','correction-notice:'+noticeEntry.id,{noticeId:notice.id,ledgerEntryId:notice.ledgerEntryId,operationType:notice.operationType,amount:notice.amount,currency:notice.currency,previousSituation:notice.previousSituation??0,newSituation:notice.newSituation??0,selfBenefit},notice.userId);}catch{}
        return json({correctionId,receiptId:receipt.id,oldAmount,newAmount,beforeSituation,afterSituation,selfBenefit,requiresIndependentReview,reversalEntryId:reversal.id,replacementReceiptId:replacementReceipt?.id??null,notice},200,cors);
      }catch(error){
        const failure=(error instanceof Error?error.message:String(error)).slice(0,300);
        await repo.saveWorkspaceRecord({...record,status:'ACTIVE',tags:[...record.tags,'failed','recovery-required'],data:{...record.data,error:failure},updatedAt:new Date().toISOString()});
        await repo.saveAudit(kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'FINANCIAL_CORRECTION_FAILED',targetType:'financial_correction',targetId:correctionId,requestId:ctx.requestId,metadata:{receiptId:receipt.id,oldAmount,newAmount,selfBenefit,error:failure}}));
        throw error;
      }
    }

    const contributionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/contributions\/cash$/);
    if(contributionRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      const receipt=await ledger.recordCashContribution({tenantId:ctx.tenantId,groupId:contributionRoute[1]!,membershipId:String(body.membershipId??''),amount:finite(body.amount),currency:String(body.currency??'XAF'),meetingId:body.meetingId?String(body.meetingId):undefined,rubricId:body.rubricId?String(body.rubricId):undefined,lateReason:body.lateReason?String(body.lateReason):undefined,approverIds:strArray(body.approverIds),lateAuthorizationId:body.lateAuthorizationId?String(body.lateAuthorizationId):undefined,idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('idem'))});
      const entry=await repo.getLedgerEntry(ctx.tenantId,contributionRoute[1]!,receipt.ledgerEntryId);
      if(entry)await dispatchContributionProjection(contributionRoute[1]!,receipt,entry);
      // The financial transaction is authoritative once D1 has committed it.
      // A temporary Live failure must never turn a committed contribution into an ambiguous HTTP failure.
      return json(receipt,201,cors);
    }

    const retryProjectionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/live\/retry-pending$/);
    if(retryProjectionRoute&&request.method==='POST'){
      const groupId=retryProjectionRoute[1]!;await requireGroup(groupId,true);
      const pending=(await repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.LIVE_PROJECTION',groupId)).filter(r=>r.status==='ACTIVE'),pendingCorrections=(await repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.CORRECTION_OUTBOX',groupId)).filter(r=>r.status==='ACTIVE');
      const receipts=await repo.listContributionReceipts(ctx.tenantId,groupId);let retried=0,confirmed=0;
      for(const record of pending){
        const entryId=String(record.data.entryId??''),entry=entryId?await repo.getLedgerEntry(ctx.tenantId,groupId,entryId):undefined;
        const receipt=receipts.find(x=>x.ledgerEntryId===entryId);
        if(!entry||!receipt)continue;retried++;if(await dispatchContributionProjection(groupId,receipt,entry))confirmed++;
      }
      for(const record of pendingCorrections){retried++;if((await dispatchFinancialCorrectionProjection(record)).ok)confirmed++;}
      return json({retried,confirmed,pending:Math.max(0,pending.length+pendingCorrections.length-confirmed)},200,cors);
    }

    const savingsYieldSource=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/source-data$/);
    if(savingsYieldSource&&request.method==='GET'){
      const groupId=savingsYieldSource[1]!;await requireGroup(groupId,true);
      const [rubricRows,meetingRows,positions,accounts,entries,memberships,loanPeriods,loanRows,obligationRows,sheetEvents,distributionPolicies,ledgerSummary]=await Promise.all([
        repo.listRubricDefinitions(ctx.tenantId,groupId),repo.listMeetings(ctx.tenantId,groupId),ledger.receiptPositions(ctx.tenantId,groupId),
        repo.listLedgerAccounts(ctx.tenantId,groupId),repo.listLedgerEntries(ctx.tenantId,groupId),repo.listMemberships(ctx.tenantId,groupId),
        repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.LOAN_PERIOD',groupId),completion.list(groupId,'LOAN'),repo.listObligations(ctx.tenantId),
        repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.SHEET_EVENT',groupId),repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.SAVINGS_YIELD',groupId),
        ledger.summary(ctx.tenantId,groupId,'XAF')
      ]);
      const normalizeSavingsLabel=(value:unknown)=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
      const isSavingsRubric=(r:any)=>{const facets=r.facets??{},semanticSavings=String(facets.refundability??'')==='FULLY_REFUNDABLE'&&String(facets.direction??'')!=='OUTFLOW'&&String(facets.interestMode??'')==='CUSTOM';return String(r.activityPlan?.kind??'').toUpperCase()==='SAVINGS'||/SAVINGS|EPARGNE/.test(String(facets.custom?.systemKey??'').toUpperCase())||/epargne|saving/.test(normalizeSavingsLabel(r.name))||semanticSavings;};
      // Historical savings stay in the financial truth even after a rubric is archived.
      const savingsRubrics=rubricRows.filter(isSavingsRubric);
      const savingsIds=new Set(savingsRubrics.map(r=>r.id));
      const orderedMeetings=meetingRows.slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt)));
      const sessionByMeeting=new Map(orderedMeetings.map((m,i)=>[m.id,i+1]));
      const periodKeys=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const rubricById=new Map(savingsRubrics.map(r=>[r.id,r])),allRubricById=new Map(rubricRows.map(r=>[r.id,r]));
      const normalizeLabel=(value:unknown)=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
      const officialLoanRubric=rubricRows.find(r=>String(r.facets?.custom?.systemKey??'').toUpperCase()==='LOAN'||/^(pret|prets|emprunt|emprunts|loan|loans)$/.test(normalizeLabel(r.name)));
      const repaymentComponent=(rubricId:string)=>{
        const rubric=allRubricById.get(rubricId),name=normalizeLabel(rubric?.name),explicit=String(rubric?.facets?.custom?.repaymentComponent??'').toUpperCase();
        if(explicit==='INTEREST'||/rembour.*interet|interest.*repay|repay.*interest/.test(name))return'INTEREST';
        if(explicit==='PRINCIPAL'||/rembour|repay/.test(name))return'PRINCIPAL';
        return'';
      };
      const deposits=positions.filter(p=>p.rubricId&&savingsIds.has(p.rubricId)&&p.netAmount>0).map(p=>{
        const rubric=rubricById.get(p.rubricId!)!,session=p.meetingId?(sessionByMeeting.get(p.meetingId)??1):1;
        const fund=/scolaire|school/i.test(rubric.name)?'SCHOOL':'CLASSIC';
        return{id:p.id,memberId:p.membershipId,amount:p.netAmount,session,fund,periodKey:periodKeys[(session-1)%12],rubricId:p.rubricId,meetingId:p.meetingId??null,receivedAt:p.receivedAt};
      });
      const memberRows=[];for(const m of memberships){const u=await repo.getUser(m.userId);memberRows.push({id:m.id,displayName:u?.displayName??m.userId,status:m.status});}
      const accountById=new Map(accounts.map(a=>[a.id,a]));
      const interestByAccount:Record<string,number>={};
      for(const entry of entries)for(const line of entry.lines){const account=accountById.get(line.accountId);if(account&&/INTEREST.*INCOME|INTEREST_INCOME/i.test(account.code)){interestByAccount[account.code]=(interestByAccount[account.code]??0)+(line.credit-line.debit);}}
      const ledgerRecoveredInterest=Object.values(interestByAccount).reduce((n,x)=>n+x,0);
      const classicPrincipal=deposits.filter(d=>d.fund==='CLASSIC').reduce((n,d)=>n+d.amount,0),schoolPrincipal=deposits.filter(d=>d.fund==='SCHOOL').reduce((n,d)=>n+d.amount,0);
      const savingsSeries=savingsRubrics.map(r=>{const rows=deposits.filter(d=>d.rubricId===r.id);return{rubricId:r.id,name:r.name,total:rows.reduce((n,d)=>n+d.amount,0),entries:rows.map(d=>({memberId:d.memberId,meetingId:d.meetingId,session:d.session,amount:d.amount}))};});
      const loanDisbursements=sheetEvents.map(x=>({x,d:x.data??{}})).filter(({d})=>String(d.direction??'').toUpperCase()==='OUT'&&Boolean(d.loanId)&&Boolean(d.meetingId)).map(({x,d})=>({loanId:String(d.loanId),memberId:String(d.membershipId??''),meetingId:String(d.meetingId),session:sessionByMeeting.get(String(d.meetingId))??1,amount:Math.abs(Number(d.amount??0)),rubricId:String(d.rubricId??''),createdAt:String(x.createdAt??x.updatedAt??'')}));
      const distributionPolicyRecord=distributionPolicies.filter(x=>x.status!=='ARCHIVED'&&x.tags.includes('savings-yield-policy')).sort((a,b)=>String(b.updatedAt??b.createdAt).localeCompare(String(a.updatedAt??a.createdAt)))[0];
      const distributionPolicy={eligibilityPolicy:String(distributionPolicyRecord?.data?.eligibilityPolicy??'ALL_DEPOSITS'),classicShareBasisPoints:Number(distributionPolicyRecord?.data?.classicShareBasisPoints??7000),schoolShareBasisPoints:Number(distributionPolicyRecord?.data?.schoolShareBasisPoints??1000),borrowerShareBasisPoints:Number(distributionPolicyRecord?.data?.borrowerShareBasisPoints??0),officeShareBasisPoints:Number(distributionPolicyRecord?.data?.officeShareBasisPoints??2000),reserveShareBasisPoints:Number(distributionPolicyRecord?.data?.reserveShareBasisPoints??0),borrowerWeightMode:String(distributionPolicyRecord?.data?.borrowerWeightMode??'VOLUME_TIME_INTEREST'),eligibleThroughClassic:Number(distributionPolicyRecord?.data?.eligibleThroughClassic??10),eligibleThroughSchool:Number(distributionPolicyRecord?.data?.eligibleThroughSchool??7),poolingMode:String(distributionPolicyRecord?.data?.poolingMode??'POOLED'),residualPolicy:String(distributionPolicyRecord?.data?.residualPolicy??'TIME_WEIGHTED'),recordId:distributionPolicyRecord?.id??null,updatedAt:distributionPolicyRecord?.updatedAt??null};
      const periodRows=loanPeriods.map(x=>({id:x.id,loanId:String(x.data.loanId??''),memberId:String(x.data.membershipId??''),meetingId:String(x.data.meetingId??''),principalPaid:Number(x.data.principalPaid??0),interestPaid:Number(x.data.interestPaid??0),principalAfter:Number(x.data.principalAfter??0),interestAfter:Number(x.data.interestAfter??0),interestNew:Number(x.data.interestNew??0),nextInterestProjected:Number(x.data.nextInterestProjected??0),totalDebtAfter:Number(x.data.totalDebtAfter??0),updatedAt:String(x.updatedAt??x.createdAt??'')}));
      const paymentEvents=new Map<string,{memberId:string;meetingId:string;loanId:string;principalPaid:number;interestPaid:number}>();
      for(const x of sheetEvents){
        const d=x.data??{},rubricId=String(d.rubricId??''),amount=Math.abs(Number(d.amount??0)),component=repaymentComponent(rubricId),principalPaid=Number(d.principalPaid??(component==='PRINCIPAL'?amount:0)),interestPaid=Number(d.interestPaid??(component==='INTEREST'?amount:0));
        if(principalPaid<=0&&interestPaid<=0)continue;
        const k=String(d.ledgerEntryId??x.id),old=paymentEvents.get(k);
        if(!old)paymentEvents.set(k,{memberId:String(d.membershipId??''),meetingId:String(d.meetingId??''),loanId:String(d.loanId??''),principalPaid:Math.max(0,principalPaid),interestPaid:Math.max(0,interestPaid)});
        else paymentEvents.set(k,{...old,principalPaid:Math.max(old.principalPaid,principalPaid),interestPaid:Math.max(old.interestPaid,interestPaid)});
      }
      const eventPayments=[...paymentEvents.values()],eventPrincipalTotal=eventPayments.reduce((n,x)=>n+x.principalPaid,0),eventInterestTotal=eventPayments.reduce((n,x)=>n+x.interestPaid,0);
      const periodPrincipalTotal=periodRows.reduce((n,x)=>n+x.principalPaid,0),periodInterestTotal=periodRows.reduce((n,x)=>n+x.interestPaid,0);
      const repayments=(eventPrincipalTotal>0?eventPayments.filter(x=>x.principalPaid>0).map(x=>({memberId:x.memberId,meetingId:x.meetingId,loanId:x.loanId,amount:x.principalPaid})):periodRows.filter(x=>x.principalPaid>0).map(x=>({memberId:x.memberId,meetingId:x.meetingId,loanId:x.loanId,amount:x.principalPaid})));
      const interestReceipts=(eventInterestTotal>0?eventPayments.filter(x=>x.interestPaid>0).map(x=>({memberId:x.memberId,meetingId:x.meetingId,loanId:x.loanId,amount:x.interestPaid})):periodRows.filter(x=>x.interestPaid>0).map(x=>({memberId:x.memberId,meetingId:x.meetingId,loanId:x.loanId,amount:x.interestPaid})));
      // The workbook keeps principal debt and interest debt as two rolling balances.
      // Historical sheet events may predate the canonical loan-period records, so
      // use the strongest available evidence without double-counting the same payment.
      const recoveredInterest=Math.max(ledgerRecoveredInterest,eventInterestTotal,periodInterestTotal);
      const sessionRank=new Map(orderedMeetings.map((m,i)=>[m.id,i+1])),latestPeriodByLoan=new Map<string,(typeof periodRows)[number]>();
      for(const p of periodRows.slice().sort((a,b)=>(sessionRank.get(a.meetingId)??0)-(sessionRank.get(b.meetingId)??0)||a.updatedAt.localeCompare(b.updatedAt)))if(p.loanId)latestPeriodByLoan.set(p.loanId,p);
      const activeLoans=loanRows.filter(x=>['DISBURSED','REPAYING'].includes(String(x.data.completionState??''))||Number(latestPeriodByLoan.get(x.id)?.principalAfter??0)>0||Number(latestPeriodByLoan.get(x.id)?.interestAfter??0)>0);
      const loanDebts=activeLoans.map(x=>{
        const latest=latestPeriodByLoan.get(x.id),loanNewer=!latest||String(x.updatedAt??'')>=String(latest.updatedAt??''),rubric=allRubricById.get(String(x.data.rubricId??''))??officialLoanRubric;
        const principal=Math.max(0,Number(loanNewer?x.data.outstandingPrincipal:latest?.principalAfter??x.data.outstandingPrincipal??0)),interest=Math.max(0,Number(loanNewer?x.data.unpaidInterest:latest?.interestAfter??x.data.unpaidInterest??0));
        const rate=Number(x.data.rateBasisPointsPerPeriod??rubric?.policies?.loan?.rateBasisPointsPerPeriod??0),nextInterestProjected=rate>0?Math.round(principal*rate/10000):Number(latest?.nextInterestProjected??0);
        return{loanId:x.id,memberId:String(x.data.borrowerMembershipId??latest?.memberId??''),rubricId:String(x.data.rubricId??''),title:x.title,principal,interest,nextInterestProjected,totalDue:principal+interest,totalIncludingNextInterest:principal+interest+nextInterestProjected,rateBasisPointsPerPeriod:rate,paymentPriority:String(rubric?.policies?.loan?.paymentPriority??x.data.paymentPriority??'CAPITAL_FIRST'),interestTiming:String(x.data.interestTiming??rubric?.policies?.loan?.interestTiming??'NEXT_SESSION_DUE'),lastAccruedInterest:Number(x.data.lastAccruedInterest??latest?.interestNew??0),interestAppliesToMeetingId:String(x.data.interestAppliesToMeetingId??'')||null,interestAppliesToLabel:String(x.data.interestAppliesToLabel??'')||null,interestSourceClosedMeetingId:String(x.data.interestSourceClosedMeetingId??'')||null};
      }).filter(x=>x.principal>0||x.interest>0||x.nextInterestProjected>0);
      const groupObligations=obligationRows.filter(x=>x.groupId===groupId&&(x.status==='open'||x.status==='overdue')),membershipByUser=new Map(memberships.map(m=>[m.userId,m.id])),otherDebts=groupObligations.map(x=>({id:x.id,memberId:membershipByUser.get(String(x.assigneeId??''))??null,title:x.title,status:x.status,amount:Number(x.amount?.amount??0),dueAt:x.dueAt??null})),otherDebt=otherDebts.reduce((n,x)=>n+x.amount,0);
      const outstandingPrincipal=loanDebts.reduce((n,x)=>n+x.principal,0),outstandingInterest=loanDebts.reduce((n,x)=>n+x.interest,0),nextInterestProjected=loanDebts.reduce((n,x)=>n+x.nextInterestProjected,0),totalDebt=outstandingPrincipal+outstandingInterest+otherDebt,totalDebtIncludingNextInterest=totalDebt+nextInterestProjected,totalPrincipalRepaid=Math.max(eventPrincipalTotal,periodPrincipalTotal),totalSavings=deposits.reduce((n,d)=>n+d.amount,0);
      const healthLeft=totalPrincipalRepaid+recoveredInterest-totalDebt,healthRight=totalSavings,healthWithNextLeft=totalPrincipalRepaid+recoveredInterest-totalDebtIncludingNextInterest,warnings:string[]=[];
      if(recoveredInterest===0)warnings.push('NO_REALIZED_INTEREST_FOUND');
      if(eventInterestTotal!==ledgerRecoveredInterest&&eventInterestTotal>0)warnings.push('INTEREST_SOURCE_VARIANCE:'+String(eventInterestTotal-ledgerRecoveredInterest));
      if(loanDebts.some(x=>x.principal>0&&x.rateBasisPointsPerPeriod<=0))warnings.push('LOAN_RATE_MISSING');
      return json({generatedAt:new Date().toISOString(),source:'CANONICAL_LEDGER_AND_RECEIPTS',sourceDetail:'LEDGER_RECEIPTS_SHEETS_AND_LOAN_PERIODS',members:memberRows,rubrics:savingsRubrics.map(r=>({id:r.id,name:r.name})),loanDisbursements,distributionPolicy,meetings:orderedMeetings.map((m,i)=>({id:m.id,title:m.title,session:i+1,scheduledAt:m.scheduledAt??m.openedAt,status:m.status})),deposits,savingsSeries,repayments,interestReceipts,loanPeriods:periodRows,loanDebts,otherDebts,totals:{classicPrincipal,schoolPrincipal,totalPrincipal:classicPrincipal+schoolPrincipal,totalSavings,totalPrincipalRepaid,recoveredInterest,outstandingPrincipal,outstandingInterest,nextInterestProjected,otherDebt,totalDebt,totalDebtIncludingNextInterest,cashBalance:Number(ledgerSummary.cashBalance??0)},health:{formula:'(TOTAL_REPAYMENTS + TOTAL_INTEREST_COLLECTED) - TOTAL_CURRENT_DEBT >= TOTAL_SAVINGS',left:healthLeft,right:healthRight,difference:healthLeft-healthRight,passes:healthLeft>=healthRight},healthWithNext:{formula:'(TOTAL_REPAYMENTS + TOTAL_INTEREST_COLLECTED) - (TOTAL_CURRENT_DEBT + NEXT_INTEREST) >= TOTAL_SAVINGS',left:healthWithNextLeft,right:healthRight,difference:healthWithNextLeft-healthRight,passes:healthWithNextLeft>=healthRight},interestByAccount,warnings},200,cors);
    }

    const savingsYieldPreview=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/preview$/);
    if(savingsYieldPreview&&request.method==='POST'){
      await requireGroup(savingsYieldPreview[1]!,true);const body=await readJson<Record<string,unknown>>(request);
      return json(allocateSavingsYield(body as any),200,cors);
    }
    const savingsYieldWorkbook=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/workbook-preview$/);
    if(savingsYieldWorkbook&&request.method==='POST'){
      await requireGroup(savingsYieldWorkbook[1]!,true);
      const body=await readJson<Record<string,unknown>>(request);
      return json(simulateWorkbookYieldPipeline(body as any),200,cors);
    }
    const savingsYieldProductive=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/capital-at-work-preview$/);
    if(savingsYieldProductive&&request.method==='POST'){
      await requireGroup(savingsYieldProductive[1]!,true);
      const body=await readJson<Record<string,unknown>>(request);
      return json(allocateCapitalAtWorkYield(body as any),200,cors);
    }
    const savingsYieldCapitalTime=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/capital-time-preview$/);
    if(savingsYieldCapitalTime&&request.method==='POST'){
      await requireGroup(savingsYieldCapitalTime[1]!,true);
      return json(allocateCapitalTimeYield(await readJson<any>(request)),200,cors);
    }
    const savingsYieldAttributed=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/attributed-productive-preview$/);
    if(savingsYieldAttributed&&request.method==='POST'){
      await requireGroup(savingsYieldAttributed[1]!,true);
      return json(allocateAttributedProductiveYield(await readJson<any>(request)),200,cors);
    }
    const savingsYieldPolicies=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/policies$/);
    if(savingsYieldPolicies&&request.method==='GET'){
      await requireGroup(savingsYieldPolicies[1]!,true);
      return json({presets:SAVINGS_YIELD_POLICY_PRESETS,activation:'HUMAN_CONFIRMATION_REQUIRED',financialPosting:false},200,cors);
    }
    const savingsYieldDoctor=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/doctor$/);
    if(savingsYieldDoctor&&request.method==='POST'){
      await requireGroup(savingsYieldDoctor[1]!,true);
      return json(diagnoseGroup(await readJson<any>(request)),200,cors);
    }
    const meetingAutopilot=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/autopilot-preview$/);
    if(meetingAutopilot&&request.method==='POST'){
      await requireGroup(meetingAutopilot[1]!,true);
      return json(prepareMeetingAutopilot(await readJson<any>(request)),200,cors);
    }

    const savingsYieldSplit=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/split-preview$/);
    if(savingsYieldSplit&&request.method==='POST'){
      await requireGroup(savingsYieldSplit[1]!,true);const body=await readJson<Record<string,unknown>>(request);
      return json(splitInterestPool(finite(body.total),Array.isArray(body.shares)?body.shares as any:[]),200,cors);
    }
    const financialRecapPreview=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/recap\/financial-preview$/);
    if(financialRecapPreview&&request.method==='POST'){
      await requireGroup(financialRecapPreview[1]!,true);return json(buildFinancialRecap(await readJson<any>(request)),200,cors);
    }
    const sessionRecapPreview=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/recap-preview$/);
    if(sessionRecapPreview&&request.method==='POST'){
      await requireGroup(sessionRecapPreview[1]!,true);
      if(!(await repo.getMeeting(ctx.tenantId,sessionRecapPreview[1]!,sessionRecapPreview[2]!)))throw new Error('MEETING_NOT_FOUND');
      return json(buildSessionRecap(await readJson<any>(request)),200,cors);
    }
    const closingCarryoverPreview=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/closing\/carryover-preview$/);
    if(closingCarryoverPreview&&request.method==='POST'){
      await requireGroup(closingCarryoverPreview[1]!,true);return json(buildClosingCarryover(await readJson<any>(request)),200,cors);
    }

    const financialSnapshotRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-cells\/snapshot$/);
    if(financialSnapshotRoute&&request.method==='GET'){
      const groupId=financialSnapshotRoute[1]!;await requireGroup(groupId,false);
      const [positions,revisions,sheetEvents,sheetExpenses]=await Promise.all([
        ledger.receiptPositions(ctx.tenantId,groupId),
        repo.listFinancialCellRevisions(ctx.tenantId,groupId),
        repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.SHEET_EVENT',groupId),
        new ExpenseService(repo,kernel,ledger).list(groupId,{scope:'SHEET'}).catch(()=>[])
      ]);
      const cells=new Map<string,{meetingId:string;membershipId:string;rubricId:string;amount:number;cellVersion:number;updatedAt:string;actorId?:string;nature?:string}>();
      const key=(meetingId:string,membershipId:string,rubricId:string)=>JSON.stringify([meetingId,membershipId,rubricId]);
      const revisionByKey=new Map(revisions.map(r=>[key(r.meetingId,r.membershipId,r.rubricId),r]));
      for(const p of positions){
        if(!p.meetingId||!p.rubricId)continue;const k=key(p.meetingId,p.membershipId,p.rubricId),revision=revisionByKey.get(k),old=cells.get(k);
        const at=String(revision?.updatedAt??p.receivedAt??'');
        cells.set(k,{meetingId:p.meetingId,membershipId:p.membershipId,rubricId:p.rubricId,amount:Number(old?.amount??0)+Number(p.netAmount??0),cellVersion:Number(revision?.version??0),updatedAt:at>String(old?.updatedAt??'')?at:String(old?.updatedAt??at),actorId:String(p.receivedBy??old?.actorId??''),nature:'CONTRIBUTION'});
      }
      for(const r of revisions){const k=key(r.meetingId,r.membershipId,r.rubricId);if(!cells.has(k))cells.set(k,{meetingId:r.meetingId,membershipId:r.membershipId,rubricId:r.rubricId,amount:0,cellVersion:r.version,updatedAt:r.updatedAt,nature:'CONTRIBUTION'});}
      for(const event of sheetEvents){
        const meetingId=String(event.data.meetingId??''),membershipId=String(event.data.membershipId??''),rubricId=String(event.data.rubricId??'');if(!meetingId||!membershipId||!rubricId)continue;
        const direction=String(event.data.direction??'IN'),amount=Number(event.data.amount??0),signed=direction==='OUT'?-Math.abs(amount):Math.abs(amount),k=key(meetingId,membershipId,rubricId),old=cells.get(k);
        cells.set(k,{meetingId,membershipId,rubricId,amount:Number(old?.amount??0)+signed,cellVersion:Number(old?.cellVersion??0),updatedAt:String(event.updatedAt??event.createdAt??old?.updatedAt??''),actorId:String(event.createdBy??old?.actorId??''),nature:direction==='OUT'?'LOAN_OR_OUTFLOW':'REPAYMENT'});
      }
      for(const expense of sheetExpenses){
        if(!expense.meetingId||!expense.membershipId||!expense.rubricId)continue;const k=key(expense.meetingId,expense.membershipId,expense.rubricId),old=cells.get(k);
        cells.set(k,{meetingId:expense.meetingId,membershipId:expense.membershipId,rubricId:expense.rubricId,amount:Number(old?.amount??0)-Math.abs(Number(expense.amount??0)),cellVersion:Number(old?.cellVersion??0),updatedAt:String(expense.createdAt??old?.updatedAt??''),actorId:String(expense.createdBy??old?.actorId??''),nature:'OUTFLOW'});
      }
      const rows=[...cells.values()],watermark=rows.reduce((m,x)=>String(x.updatedAt??'')>m?String(x.updatedAt):m,'');
      return json({generatedAt:new Date().toISOString(),watermark,cells:rows},200,cors);
    }
    const ledgerRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger$/);
    if(ledgerRoute&&request.method==='GET') return json({summary:await ledger.summary(ctx.tenantId,ledgerRoute[1]!),entries:await repo.listLedgerEntries(ctx.tenantId,ledgerRoute[1]!),receipts:await ledger.receiptPositions(ctx.tenantId,ledgerRoute[1]!),cellRevisions:await repo.listFinancialCellRevisions(ctx.tenantId,ledgerRoute[1]!)},200,cors);
    const reverseRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger\/([^/]+)\/reverse$/);
    if(reverseRoute&&request.method==='POST'){
      const groupId=reverseRoute[1]!,entryId=decodeURIComponent(reverseRoute[2]!),body=await readJson<Record<string,unknown>>(request),reason=String(body.reason??'').trim();
      if(!reason)throw new Error('REVERSAL_REASON_REQUIRED');
      const receipts=await repo.listContributionReceipts(ctx.tenantId,groupId),receipt=receipts.find(x=>x.ledgerEntryId===entryId);
      let beforeSituation:number|undefined,oldAmount:number|undefined,target:import('../../../packages/contracts/src/index.js').Membership|undefined;
      if(receipt){
        const before=await ledger.receiptPositions(ctx.tenantId,groupId),position=before.find(x=>x.id===receipt.id);
        oldAmount=position?.netAmount??receipt.amount.amount;beforeSituation=before.filter(x=>x.membershipId===receipt.membershipId).reduce((n,x)=>n+x.netAmount,0);target=await repo.getMembership(ctx.tenantId,groupId,receipt.membershipId);
      }
      const reversal=await ledger.reverseEntry({tenantId:ctx.tenantId,groupId,entryId,reason});
      if(receipt&&target){
        const after=await ledger.receiptPositions(ctx.tenantId,groupId),afterSituation=after.filter(x=>x.membershipId===receipt.membershipId).reduce((n,x)=>n+x.netAmount,0),selfBenefit=target.userId===ctx.actorId,requiresIndependentReview=true;
        const notice=await memberControl.create({groupId,membershipId:receipt.membershipId,entry:reversal,operationType:'CASH_CONTRIBUTION_REVERSED',amount:0,currency:receipt.amount.currency,rubricId:receipt.rubricId,meetingId:receipt.meetingId,previousSituation:beforeSituation,newSituation:afterSituation,previousAmount:oldAmount,newAmount:0,correctionReason:reason,selfBenefit,requiresIndependentReview});
        try{await publishLive(groupId,'FINANCIAL_NOTICE','reversal-notice:'+reversal.id,{noticeId:notice.id,ledgerEntryId:notice.ledgerEntryId,operationType:notice.operationType,amount:0,currency:notice.currency,previousSituation:notice.previousSituation??0,newSituation:notice.newSituation??0,selfBenefit},notice.userId);}catch{}
      }
      return json(reversal,201,cors);
    }

    const cashboxRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/cashbox\/reconciliations$/);
    if(cashboxRoute&&request.method==='GET') return json(await repo.listCashboxReconciliations(ctx.tenantId,cashboxRoute[1]!),200,cors);
    if(cashboxRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request); return json(await foundation.reconcileCashbox({tenantId:ctx.tenantId,groupId:cashboxRoute[1]!,meetingId:body.meetingId?String(body.meetingId):undefined,openingCash:finite(body.openingCash),cashIn:finite(body.cashIn),cashOut:finite(body.cashOut),countedClosing:finite(body.countedClosing),currency:String(body.currency??'XAF')}),201,cors);
    }

    const memberEnvelope=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/member-envelope$/);
    if(memberEnvelope&&request.method==='GET'){
      const membershipId=url.searchParams.get('membershipId')??undefined;
      return json(await memberEnvelopes.build(memberEnvelope[1]!,memberEnvelope[2]!,membershipId),200,cors);
    }
    const memberNotices=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/financial-notices$/);
    if(memberNotices&&request.method==='GET')return json(await memberControl.list(memberNotices[1]!,memberNotices[2]!),200,cors);
    const noticeConfirm=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-notices\/([^/]+)\/confirm$/);
    if(noticeConfirm&&request.method==='POST')return json(await memberControl.confirm(noticeConfirm[1]!,decodeURIComponent(noticeConfirm[2]!)),200,cors);
    const noticeReserve=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-notices\/([^/]+)\/reserve$/);
    if(noticeReserve&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await memberControl.reserve(noticeReserve[1]!,decodeURIComponent(noticeReserve[2]!),String(body.reason??'')),201,cors);}
    const noticeOfficer=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-notices\/([^/]+)\/officer-review$/);
    if(noticeOfficer&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await memberControl.officerReview(noticeOfficer[1]!,decodeURIComponent(noticeOfficer[2]!),String(body.note??'')),200,cors);}
    const noticeMemberReview=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/financial-notices\/([^/]+)\/member-review$/);
    if(noticeMemberReview&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request),decision=String(body.decision??'');
      if(decision!=='APPROVE_AFTER_REVIEW'&&decision!=='MAINTAIN_RESERVE')throw new Error('INVALID_MEMBER_REVIEW_DECISION');
      return json(await memberControl.memberReview(noticeMemberReview[1]!,decodeURIComponent(noticeMemberReview[2]!),decision,String(body.note??'')),200,cors);
    }

    const forumMessages=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/forum-v2\/hubs\/([^/]+)\/messages$/);
    if(forumMessages&&request.method==='GET'){
      if(!options.communityRealtime)throw new Error('COMMUNITY_REALTIME_UNAVAILABLE');
      const groupId=forumMessages[1]!,hubId=decodeURIComponent(forumMessages[2]!);await community.federationProfile(groupId,hubId);
      return json(await options.communityRealtime.listMessages({tenantId:ctx.tenantId,groupId,hubId,viewerId:ctx.actorId,limit:Number(url.searchParams.get('limit')??50),before:url.searchParams.get('before')??undefined,after:url.searchParams.get('after')??undefined,around:url.searchParams.get('around')??undefined}),200,cors);
    }
    if(forumMessages&&request.method==='POST'){
      if(!options.communityRealtime)throw new Error('COMMUNITY_REALTIME_UNAVAILABLE');
      const groupId=forumMessages[1]!,hubId=decodeURIComponent(forumMessages[2]!);await community.federationProfile(groupId,hubId);
      const body=await readJson<Record<string,unknown>>(request);
      const message=await options.communityRealtime.createMessage({tenantId:ctx.tenantId,groupId,hubId,authorId:ctx.actorId,kind:String(body.kind??'DISCUSSION') as any,title:body.title?String(body.title):undefined,body:String(body.body??''),parentId:body.parentId?String(body.parentId):undefined});
      await options.communityRealtime.clearDraft(ctx.tenantId,groupId,hubId,ctx.actorId);
      await publishLive(groupId,'COMMUNITY_EVENT','forum-message:'+message.id,{hubId,messageId:message.id,event:'MESSAGE_CREATED'});
      return json(message,201,cors);
    }
    const forumState=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/forum-v2\/hubs\/([^/]+)\/state$/);
    if(forumState&&request.method==='GET'){
      if(!options.communityRealtime)throw new Error('COMMUNITY_REALTIME_UNAVAILABLE');
      const groupId=forumState[1]!,hubId=decodeURIComponent(forumState[2]!);await community.federationProfile(groupId,hubId);
      return json(await options.communityRealtime.state(ctx.tenantId,groupId,hubId,ctx.actorId),200,cors);
    }
    const forumDraft=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/forum-v2\/hubs\/([^/]+)\/draft$/);
    if(forumDraft&&request.method==='PUT'){
      if(!options.communityRealtime)throw new Error('COMMUNITY_REALTIME_UNAVAILABLE');
      const groupId=forumDraft[1]!,hubId=decodeURIComponent(forumDraft[2]!);await community.federationProfile(groupId,hubId);
      const body=await readJson<Record<string,unknown>>(request),state=await options.communityRealtime.saveDraft({tenantId:ctx.tenantId,groupId,hubId,userId:ctx.actorId,title:String(body.title??''),body:String(body.body??'')});
      await publishLive(groupId,'COMMUNITY_DRAFT_SYNC','forum-draft:'+ctx.actorId+':'+hubId+':'+state.updatedAt,{hubId,updatedAt:state.updatedAt},ctx.actorId);
      return json(state,200,cors);
    }
    const forumRead=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/forum-v2\/hubs\/([^/]+)\/read-position$/);
    if(forumRead&&request.method==='PUT'){
      if(!options.communityRealtime)throw new Error('COMMUNITY_REALTIME_UNAVAILABLE');
      const groupId=forumRead[1]!,hubId=decodeURIComponent(forumRead[2]!);await community.federationProfile(groupId,hubId);
      const body=await readJson<Record<string,unknown>>(request),state=await options.communityRealtime.markRead({tenantId:ctx.tenantId,groupId,hubId,userId:ctx.actorId,messageId:String(body.messageId??''),anchorRatio:finite(body.anchorRatio,0)});
      await publishLive(groupId,'COMMUNITY_READ_SYNC','forum-read:'+ctx.actorId+':'+hubId+':'+state.updatedAt,{hubId,messageId:state.lastReadMessageId??'',updatedAt:state.updatedAt},ctx.actorId);
      return json(state,200,cors);
    }
    const forumReaction=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/forum-v2\/messages\/([^/]+)\/reaction$/);
    if(forumReaction&&request.method==='POST'){
      if(!options.communityRealtime)throw new Error('COMMUNITY_REALTIME_UNAVAILABLE');
      const groupId=forumReaction[1]!,body=await readJson<Record<string,unknown>>(request),messageId=decodeURIComponent(forumReaction[2]!);
      await requireGroup(groupId);
      const messageContext=await options.communityRealtime.messageContext(messageId);
      if(!messageContext||messageContext.tenantId!==ctx.tenantId||messageContext.groupId!==groupId)throw new Error('COMMUNITY_MESSAGE_NOT_FOUND');
      const state=await options.communityRealtime.toggleReaction({messageId,userId:ctx.actorId,reaction:String(body.reaction??'')});
      await publishLive(groupId,'COMMUNITY_EVENT','forum-reaction:'+messageId+':'+ctx.actorId+':'+String(body.reaction??'')+':'+(state.active?'on':'off'),{hubId:messageContext.hubId,messageId,event:'REACTION_CHANGED'});
      return json(state,200,cors);
    }

    const economicProfile=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/economic-profile$/);
    if(economicProfile&&request.method==='GET'){
      const groupId=economicProfile[1]!;await requireGroup(groupId,true);
      const passport=await groupIdentity.compute(groupId),consent=await conciergeLearning.consent(groupId);
      const profile=await economicIntelligence.profile(groupId,passport.publicCode);
      const enabled=consent.purposes.PARTNER_MATCHING;
      return json(enabled?profile:{...profile,exportable:false,exportBlockers:[...profile.exportBlockers,'PARTNER_MATCHING_DISABLED']},200,cors);
    }

    const externalProgramsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/external-programs$/);
    if(externalProgramsRoute&&request.method==='GET'){
      const kind=url.searchParams.get('kind') as ExternalProgramKind|null;
      return json(await externalPrograms.list(externalProgramsRoute[1]!,kind??undefined),200,cors);
    }
    if(externalProgramsRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await externalPrograms.create(externalProgramsRoute[1]!,{
        kind:String(body.kind??'PARTNER') as ExternalProgramKind,partyName:String(body.partyName??''),programName:String(body.programName??''),
        purpose:String(body.purpose??''),localities:strArray(body.localities),tags:strArray(body.tags),
        dataAccess:String(body.dataAccess??'NONE') as AggregateDataAccess
      }),201,cors);
    }
    const externalTransition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/external-programs\/([^/]+)\/transition$/);
    if(externalTransition&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await externalPrograms.transition(externalTransition[1]!,externalTransition[2]!,String(body.state??'') as ExternalProgramState),200,cors);
    }
    const programEnrollments=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/external-programs\/([^/]+)\/enrollments$/);
    if(programEnrollments&&request.method==='GET')return json(await externalPrograms.enrollments(programEnrollments[1]!,programEnrollments[2]!),200,cors);
    if(programEnrollments&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await externalPrograms.createEnrollment(programEnrollments[1]!,programEnrollments[2]!,{
        consentRef:String(body.consentRef??''),purpose:String(body.purpose??''),scopes:strArray(body.scopes),
        startsAt:body.startsAt?String(body.startsAt):undefined,endsAt:String(body.endsAt??''),facilitatorRef:body.facilitatorRef?String(body.facilitatorRef):undefined
      }),201,cors);
    }
    const enrollmentRevoke=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/program-enrollments\/([^/]+)\/revoke$/);
    if(enrollmentRevoke&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await externalPrograms.revokeEnrollment(enrollmentRevoke[1]!,enrollmentRevoke[2]!,String(body.reason??'')),200,cors);}
    const supportActions=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/program-enrollments\/([^/]+)\/support-actions$/);
    if(supportActions&&request.method==='GET')return json(await externalPrograms.supportActions(supportActions[1]!,supportActions[2]!),200,cors);
    if(supportActions&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await externalPrograms.recordSupportAction(supportActions[1]!,supportActions[2]!,{
      kind:String(body.kind??'OTHER') as SupportActionKind,summary:String(body.summary??''),evidenceRef:body.evidenceRef?String(body.evidenceRef):undefined,performedAt:body.performedAt?String(body.performedAt):undefined
    }),201,cors);}
    const programFunding=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/program-enrollments\/([^/]+)\/funding$/);
    if(programFunding&&request.method==='GET')return json(await externalPrograms.fundingEvidence(programFunding[1]!,programFunding[2]!),200,cors);
    if(programFunding&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await externalPrograms.recordFundingEvidence(programFunding[1]!,programFunding[2]!,{
      state:String(body.state??'PROMISED') as FundingState,amount:finite(body.amount,0),currency:body.currency?String(body.currency):undefined,evidenceRef:String(body.evidenceRef??''),ledgerEntryId:body.ledgerEntryId?String(body.ledgerEntryId):undefined,note:body.note?String(body.note):undefined
    }),201,cors);}
    const handovers=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/program-enrollments\/([^/]+)\/handovers$/);
    if(handovers&&request.method==='GET')return json(await externalPrograms.handoverPlans(handovers[1]!,handovers[2]!),200,cors);
    if(handovers&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await externalPrograms.createHandoverPlan(handovers[1]!,handovers[2]!,{
      localOwnerRef:String(body.localOwnerRef??''),note:body.note?String(body.note):undefined,authorizationRef:body.authorizationRef?String(body.authorizationRef):undefined
    }),201,cors);}
    const handoverTransition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/program-handovers\/([^/]+)\/transition$/);
    if(handoverTransition&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await externalPrograms.transitionHandover(handoverTransition[1]!,handoverTransition[2]!,String(body.state??'') as HandoverStage,{authorizationRef:body.authorizationRef?String(body.authorizationRef):undefined,note:body.note?String(body.note):undefined}),200,cors);}

    const externalShare=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/external-programs\/([^/]+)\/share-packs$/);
    if(externalShare&&request.method==='GET')return json(await externalPrograms.sharePacks(externalShare[1]!,externalShare[2]!),200,cors);
    if(externalShare&&request.method==='POST'){
      const groupId=externalShare[1]!,passport=await groupIdentity.compute(groupId),consent=await conciergeLearning.consent(groupId);
      if(!consent.purposes.PARTNER_MATCHING)throw new Error('PARTNER_MATCHING_DISABLED');
      const profile=await economicIntelligence.profile(groupId,passport.publicCode);
      const body=await readJson<Record<string,unknown>>(request);
      return json(await externalPrograms.issueAggregateSharePack(groupId,externalShare[2]!,profile,String(body.purpose??''),finite(body.ttlDays,30)),201,cors);
    }
    const externalRevoke=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/external-share-packs\/([^/]+)\/revoke$/);
    if(externalRevoke&&request.method==='POST'){await externalPrograms.revokeSharePack(externalRevoke[1]!,externalRevoke[2]!);return json({revoked:true},200,cors);}

    const identityPassport=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/identity-passport$/);
    if(identityPassport&&request.method==='GET')return json(await groupIdentity.compute(identityPassport[1]!),200,cors);
    if(identityPassport&&request.method==='POST')return json(await groupIdentity.issue(identityPassport[1]!),201,cors);
    const identityProfile=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/identity-profile$/);
    if(identityProfile&&request.method==='GET')return json(await groupIdentity.profile(identityProfile[1]!),200,cors);
    if(identityProfile&&request.method==='PUT')return json(await groupIdentity.updateProfile(identityProfile[1]!,await readJson<any>(request)),200,cors);

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
      const memory=await conciergeLearning.learn(memoriesRoute[1]!,{
        category,key:String(body.key??''),value:String(body.value??''),sourceRef:String(body.sourceRef??''),
        evidenceSnippet:body.evidenceSnippet?String(body.evidenceSnippet):undefined,confidence:finite(body.confidence),
        privacy:String(body.privacy??'GROUP_PRIVATE') as any,visibility:String(body.visibility??'MANAGERS') as any
      });
      if(memory.collectiveEligible&&options.founderLearning){
        const passport=await groupIdentity.compute(memoriesRoute[1]!);
        const signals=await conciergeLearning.safeCollectiveSignals(memoriesRoute[1]!,passport.publicCode);
        await options.founderLearning.ingest(passport.publicCode,signals.filter(x=>x.key===memory.key&&x.value===memory.value));
      }
      return json(memory,201,cors);
    }
    const collectiveSignals=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/concierge\/collective-signals$/);
    if(collectiveSignals&&request.method==='GET'){
      const passport=await groupIdentity.compute(collectiveSignals[1]!);
      return json(await conciergeLearning.safeCollectiveSignals(collectiveSignals[1]!,passport.publicCode),200,cors);
    }
    const conciergeProfile=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/concierge\/profile$/);
    if(conciergeProfile&&request.method==='GET'){
      const passport=await groupIdentity.compute(conciergeProfile[1]!);
      return json(await conciergeLearning.profile(conciergeProfile[1]!,passport.publicCode,passport.rulesFingerprint),200,cors);
    }
    const commercialAffinities=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/concierge\/commercial-affinities$/);
    if(commercialAffinities&&request.method==='GET')return json(await conciergeLearning.commercialAffinities(commercialAffinities[1]!),200,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/founder/control'){
      if(!options.founderControl||!(await isFounderTeamActor()))throw new Error('FOUNDER_TEAM_ONLY');
      return json(await options.founderControl.snapshot(PRODUCT_MODULES.map(x=>({id:x.id,labelFr:x.labelFr,labelEn:x.labelEn,status:x.status,lot:x.lot,workspace:x.workspace}))),200,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/founder/control/content'){
      if(!options.founderControl||!(await isFounderTeamActor()))throw new Error('FOUNDER_TEAM_ONLY');
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.founderControl.createContent({key:String(body.key??''),title:String(body.title??''),status:body.status?String(body.status):undefined,priority:body.priority?String(body.priority):undefined,kind:body.kind?String(body.kind):undefined,url:body.url?String(body.url):undefined,note:body.note?String(body.note):undefined}),201,cors);
    }
    if(request.method==='POST'&&url.pathname==='/api/v1/founder/control/incidents'){
      if(!options.founderControl||!(await isFounderTeamActor()))throw new Error('FOUNDER_TEAM_ONLY');
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.founderControl.createIncident({key:String(body.key??''),title:String(body.title??''),priority:body.priority?String(body.priority):undefined,source:body.source?String(body.source):undefined,note:body.note?String(body.note):undefined}),201,cors);
    }
    const controlTransition=url.pathname.match(/^\/api\/v1\/founder\/control\/items\/([^/]+)\/transition$/);
    if(controlTransition&&request.method==='POST'){
      if(!options.founderControl||!(await isFounderTeamActor()))throw new Error('FOUNDER_TEAM_ONLY');
      const body=await readJson<Record<string,unknown>>(request);
      return json(await options.founderControl.transition(decodeURIComponent(controlTransition[1]!),String(body.status??''),String(body.note??''),String(body.evidenceRef??'')),200,cors);
    }
    const capabilityCheck=url.pathname.match(/^\/api\/v1\/founder\/control\/capabilities\/(.+)\/check$/);
    if(capabilityCheck&&request.method==='POST'){
      if(!options.founderControl||!(await isFounderTeamActor()))throw new Error('FOUNDER_TEAM_ONLY');
      const body=await readJson<Record<string,unknown>>(request);
      await options.founderControl.recordCapabilityCheck(decodeURIComponent(capabilityCheck[1]!),String(body.health??'UNKNOWN') as CapabilityHealth,String(body.note??''));
      return json({ok:true},200,cors);
    }

    if(request.method==='GET'&&url.pathname==='/api/v1/founder/learning-observatory'){
      if(!options.founderLearning||!(await isFounderTeamActor()))throw new Error('FOUNDER_TEAM_ONLY');
      const minGroups=Math.max(5,Number(url.searchParams.get('minGroups')??5));
      const [stats,discoveries]=await Promise.all([options.founderLearning.stats(minGroups),options.founderLearning.discoveries(minGroups,Number(url.searchParams.get('limit')??100))]);
      return json({stats,discoveries,privacy:'SANITIZED_PSEUDONYMOUS_K_ANONYMIZED',rawGroupData:false,rawMemberData:false},200,cors);
    }

    const personalCommercial=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/preferences\/commercial-consent$/);
    if(personalCommercial&&request.method==='GET'){
      if(!options.commercialPreferences)throw new Error('PREFERENCE_STORE_UNAVAILABLE');
      const [personal,groupConsent]=await Promise.all([options.commercialPreferences.consent(ctx.actorId,personalCommercial[1]!),conciergeLearning.consent(personalCommercial[1]!)]);
      return json({personal,groupEnabled:groupConsent.purposes.COMMERCIAL_PERSONALIZATION},200,cors);
    }
    if(personalCommercial&&request.method==='POST'){
      if(!options.commercialPreferences)throw new Error('PREFERENCE_STORE_UNAVAILABLE');
      const body=await readJson<Record<string,unknown>>(request),granted=Boolean(body.granted);
      const personal=await options.commercialPreferences.setConsent(ctx.actorId,personalCommercial[1]!,granted);
      const groupConsent=await conciergeLearning.consent(personalCommercial[1]!);
      return json({personal,groupEnabled:groupConsent.purposes.COMMERCIAL_PERSONALIZATION},200,{...cors,...(!granted?{'set-cookie':clearPreferenceCookie()}: {})});
    }
    const issuePreference=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/preferences\/commercial-cookie$/);
    if(issuePreference&&request.method==='POST'){
      if(!options.commercialPreferences)throw new Error('PREFERENCE_STORE_UNAVAILABLE');
      const groupConsent=await conciergeLearning.consent(issuePreference[1]!);
      if(!groupConsent.purposes.COMMERCIAL_PERSONALIZATION)throw new Error('GROUP_COMMERCIAL_CONSENT_REQUIRED');
      const issued=await options.commercialPreferences.issue(ctx.actorId,issuePreference[1]!);
      const affinities=await conciergeLearning.commercialAffinities(issuePreference[1]!);
      return json({enabled:true,expiresAt:issued.expiresAt,affinityCount:affinities.length},201,{...cors,'set-cookie':preferenceCookie(issued.token,issued.maxAgeSeconds)});
    }
    const revokePreference=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/preferences\/commercial-cookie\/revoke$/);
    if(revokePreference&&request.method==='POST'){
      if(!options.commercialPreferences)throw new Error('PREFERENCE_STORE_UNAVAILABLE');
      await options.commercialPreferences.revokeToken(readPreferenceCookie(request),ctx.actorId,revokePreference[1]!);
      return json({enabled:false},200,{...cors,'set-cookie':clearPreferenceCookie()});
    }
    const preferenceContext=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/preferences\/commercial-context$/);
    if(preferenceContext&&request.method==='GET'){
      if(!options.commercialPreferences)throw new Error('PREFERENCE_STORE_UNAVAILABLE');
      const groupConsent=await conciergeLearning.consent(preferenceContext[1]!);
      const valid=groupConsent.purposes.COMMERCIAL_PERSONALIZATION&&await options.commercialPreferences.verify(readPreferenceCookie(request),ctx.actorId,preferenceContext[1]!);
      return json({enabled:valid,affinities:valid?await conciergeLearning.commercialAffinities(preferenceContext[1]!):[]},200,cors);
    }

    if(url.pathname==='/api/v1/opportunity-graph'&&request.method==='GET')return json(await opportunityGraph.projection(),200,cors);
    if(url.pathname==='/api/v1/wallet'&&request.method==='GET')return json(await wallet.projection(),200,cors);
    if(url.pathname==='/api/v1/wallet/reservations'&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await wallet.reserve({groupId:String(body.groupId??''),subaccountKey:String(body.subaccountKey??''),amount:finite(body.amount),purpose:String(body.purpose??''),expiresAt:body.expiresAt?String(body.expiresAt):undefined}),201,cors);}
    const walletRelease=url.pathname.match(/^\/api\/v1\/wallet\/reservations\/([^/]+)\/release$/);
    if(walletRelease&&request.method==='POST')return json(await wallet.release(walletRelease[1]!),200,cors);

    if(url.pathname==='/api/v1/value-discovery/profile'&&request.method==='GET')return json({profile:await valueDiscovery.profile()},200,cors);
    if(url.pathname==='/api/v1/value-discovery/profile'&&request.method==='PUT'){const body=await readJson<any>(request);return json(await valueDiscovery.saveProfile(body),200,cors);}
    if(url.pathname==='/api/v1/value-discovery/suggestions'&&request.method==='GET')return json({items:await valueDiscovery.suggestions(finite(url.searchParams.get('limit'),30))},200,cors);
    const microAdsBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/micro-ads$/);
    if(microAdsBase&&request.method==='GET')return json({items:await microAds.list(microAdsBase[1]!,{locality:url.searchParams.get('locality')??undefined,type:(url.searchParams.get('type')??undefined) as any,includeClosed:url.searchParams.get('includeClosed')==='1'})},200,cors);
    if(microAdsBase&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await microAds.create(microAdsBase[1]!,{type:String(body.type??'SEEK') as any,category:String(body.category??''),text:String(body.text??''),locality:String(body.locality??''),contactMode:String(body.contactMode??'CHAT') as any,contactRef:body.contactRef?String(body.contactRef):undefined,durationDays:body.durationDays===undefined?undefined:Number(body.durationDays) as any,customExpiresAt:body.customExpiresAt?String(body.customExpiresAt):undefined}),201,cors);}
    const microAdAction=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/micro-ads\/([^/]+)\/(publish|close|report|promote)$/);
    if(microAdAction&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request),[g,id,action]=[microAdAction[1]!,microAdAction[2]!,microAdAction[3]!];return json(action==='publish'?await microAds.publish(g,id):action==='close'?await microAds.close(g,id):action==='report'?await microAds.report(g,id,String(body.reason??'')):await microAds.promote(g,id,{quantity:finite(body.quantity,1),unit:String(body.unit??'unité'),unitPrice:body.unitPrice===undefined?undefined:finite(body.unitPrice),currency:String(body.currency??'XAF'),neededBy:body.neededBy?String(body.neededBy):undefined,expiresAt:body.expiresAt?String(body.expiresAt):undefined,evidenceRef:body.evidenceRef?String(body.evidenceRef):undefined}),200,cors);}
    const anticipationBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/anticipation$/);
    if(anticipationBase&&request.method==='GET')return json({items:await anticipation.list(anticipationBase[1]!),signals:await anticipation.signals(anticipationBase[1]!)},200,cors);
    if(anticipationBase&&request.method==='POST')return json(await anticipation.createDraft(anticipationBase[1]!),201,cors);
    const anticipationTransition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/anticipation\/([^/]+)\/(validate|complete|archive)$/);
    if(anticipationTransition&&request.method==='POST'){
      const [g,id,action]=[anticipationTransition[1]!,anticipationTransition[2]!,anticipationTransition[3]!];
      return json(action==='validate'?await anticipation.validate(g,id):action==='complete'?await anticipation.complete(g,id):await anticipation.archive(g,id),200,cors);
    }
    const nextOfKinBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/succession\/next-of-kin$/);
    if(nextOfKinBase&&request.method==='GET')return json({items:await nextOfKin.list(nextOfKinBase[1]!,url.searchParams.get('membershipId')??undefined)},200,cors);
    if(nextOfKinBase&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await nextOfKin.create(nextOfKinBase[1]!,{membershipId:String(body.membershipId??''),contactAlias:String(body.contactAlias??''),relationship:String(body.relationship??''),contactRef:String(body.contactRef??''),consentRef:String(body.consentRef??''),notes:body.notes?String(body.notes):undefined}),201,cors);}
    const nextOfKinConfirm=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/succession\/next-of-kin\/([^/]+)\/confirm$/);
    if(nextOfKinConfirm&&request.method==='POST')return json(await nextOfKin.confirm(nextOfKinConfirm[1]!,nextOfKinConfirm[2]!),200,cors);
    const nextOfKinRevoke=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/succession\/next-of-kin\/([^/]+)\/revoke$/);
    if(nextOfKinRevoke&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await nextOfKin.revoke(nextOfKinRevoke[1]!,nextOfKinRevoke[2]!,String(body.reason??'')),200,cors);}
    const timeMachineBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/time-machine$/);
    if(timeMachineBase&&request.method==='GET')return json({items:await timeMachine.list(timeMachineBase[1]!)},200,cors);
    if(timeMachineBase&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await timeMachine.capture(timeMachineBase[1]!,{label:body.label?String(body.label):undefined,reason:String(body.reason??'')}),201,cors);}
    const timeMachineOne=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/time-machine\/([^/]+)$/);
    if(timeMachineOne&&request.method==='GET')return json(await timeMachine.get(timeMachineOne[1]!,timeMachineOne[2]!),200,cors);
    const timeMachineCompare=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/time-machine\/compare$/);
    if(timeMachineCompare&&request.method==='GET')return json(await timeMachine.compare(timeMachineCompare[1]!,String(url.searchParams.get('from')??''),String(url.searchParams.get('to')??'')),200,cors);
    const rubricExceptionBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubric-exceptions$/);
    if(rubricExceptionBase&&request.method==='GET')return json({items:await rubricExceptions.list(rubricExceptionBase[1]!)},200,cors);
    if(rubricExceptionBase&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await rubricExceptions.create(rubricExceptionBase[1]!,{rubricId:String(body.rubricId??''),title:String(body.title??''),scope:String(body.scope??'GROUP') as any,targetRef:body.targetRef?String(body.targetRef):undefined,reason:String(body.reason??''),effectSummary:String(body.effectSummary??''),evidenceRef:String(body.evidenceRef??''),validFrom:body.validFrom?String(body.validFrom):undefined,validUntil:body.validUntil?String(body.validUntil):undefined}),201,cors);}
    const rubricExceptionDecide=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubric-exceptions\/([^/]+)\/(approve|reject)$/);
    if(rubricExceptionDecide&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await rubricExceptions.decide(rubricExceptionDecide[1]!,rubricExceptionDecide[2]!,rubricExceptionDecide[3]==='approve'?'APPROVED':'REJECTED',String(body.note??'')),200,cors);}
    const rubricExceptionClose=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubric-exceptions\/([^/]+)\/close$/);
    if(rubricExceptionClose&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await rubricExceptions.close(rubricExceptionClose[1]!,rubricExceptionClose[2]!,String(body.note??'')),200,cors);}
    const rubricExceptionApplicable=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/rubric-exceptions\/applicable$/);
    if(rubricExceptionApplicable&&request.method==='GET')return json({items:await rubricExceptions.applicable(rubricExceptionApplicable[1]!,{rubricId:String(url.searchParams.get('rubricId')??''),membershipId:url.searchParams.get('membershipId')??undefined,meetingId:url.searchParams.get('meetingId')??undefined,at:url.searchParams.get('at')??undefined})},200,cors);
    const amountExplain=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/amount-explanation$/);
    if(amountExplain&&request.method==='GET'){
      const rubricId=url.searchParams.get('rubricId')??undefined,base=await explainability.amount(amountExplain[1]!,amountExplain[2]!,rubricId);
      const applicableExceptions=rubricId?await rubricExceptions.applicable(amountExplain[1]!,{rubricId,membershipId:amountExplain[2]!,meetingId:url.searchParams.get('meetingId')??undefined,at:url.searchParams.get('at')??undefined}):[];
      return json({...base,applicableExceptions},200,cors);
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
      return json({version:RELEASE_VERSION,workflows:COMPLETION_WORKFLOWS},200,cors);
    }

    const expectedRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/receivables\/expected$/);
    if(expectedRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await receivables.createExpected(expectedRoute[1]!,{membershipId:String(body.membershipId??''),title:String(body.title??''),dueAt:String(body.dueAt??''),amount:finite(body.amount),currency:String(body.currency??'XAF'),rubricId:body.rubricId?String(body.rubricId):undefined}),201,cors);}
    const allocationRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/receivables\/allocations$/);
    if(allocationRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await receivables.allocate(allocationRoute[1]!,{obligationId:String(body.obligationId??''),receiptId:String(body.receiptId??''),amount:finite(body.amount)}),201,cors);}
    const arrearsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/receivables\/arrears$/);
    if(arrearsRoute&&request.method==='GET')return json(await receivables.report(arrearsRoute[1]!,url.searchParams.get('asOf')??undefined),200,cors);
    const savingsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings$/);
    if(savingsRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.createSavingsPlan(savingsRoute[1]!,{id:body.id?String(body.id):undefined,membershipId:String(body.membershipId??''),name:String(body.name??''),targetAmount:body.targetAmount===undefined?undefined:finite(body.targetAmount),currency:String(body.currency??'XAF')}),201,cors);}
    const savingsPosition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings\/([^/]+)\/position$/);
    if(savingsPosition&&request.method==='GET')return json(await treasury.savingsPosition(savingsPosition[1]!,savingsPosition[2]!),200,cors);
    const savingsDeposit=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings\/([^/]+)\/deposit$/);
    if(savingsDeposit&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.depositSavings(savingsDeposit[1]!,savingsDeposit[2]!,finite(body.amount),String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('savings'))),201,cors);}
    const savingsWithdraw=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings\/([^/]+)\/withdraw$/);
    if(savingsWithdraw&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.withdrawSavings(savingsWithdraw[1]!,savingsWithdraw[2]!,finite(body.amount),String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('savings_withdraw'))),201,cors);}
    const openingRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ledger\/opening-balance$/);
    if(openingRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.openingBalance(openingRoute[1]!,{amount:finite(body.amount),currency:String(body.currency??'XAF'),note:String(body.note??''),idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('opening'))}),201,cors);}
    const custodyRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/custody$/);
    if(custodyRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.createCustody(custodyRoute[1]!,{id:body.id?String(body.id):undefined,name:String(body.name??''),holder:String(body.holder??''),currency:String(body.currency??'XAF')}),201,cors);}
    const custodyPositionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/custody\/([^/]+)\/position$/);
    if(custodyPositionRoute&&request.method==='GET')return json(await treasury.custodyPosition(custodyPositionRoute[1]!,custodyPositionRoute[2]!),200,cors);
    const custodyOut=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/custody\/([^/]+)\/send$/);
    if(custodyOut&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.sendToCustody(custodyOut[1]!,custodyOut[2]!,finite(body.amount),String(body.idempotencyKey??makeId('custody_out'))),201,cors);}
    const custodyIn=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/custody\/([^/]+)\/return$/);
    if(custodyIn&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await treasury.returnFromCustody(custodyIn[1]!,custodyIn[2]!,finite(body.amount),String(body.idempotencyKey??makeId('custody_in'))),201,cors);}
    const guarantorRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/([^/]+)\/guarantors$/);
    if(guarantorRoute&&request.method==='GET'){const rows=await riskFinance.list(guarantorRoute[1]!,'LOAN_GUARANTEE');return json({items:rows.filter(x=>String(x.data.loanId??'')===guarantorRoute[2]!)},200,cors);}
    if(guarantorRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await riskFinance.guarantor(guarantorRoute[1]!,{loanId:guarantorRoute[2]!,membershipId:String(body.membershipId??''),guaranteedAmount:finite(body.guaranteedAmount)}),201,cors);}
    const guarantorRelease=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/([^/]+)\/guarantors\/([^/]+)\/release$/);
    if(guarantorRelease&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request),record=await riskFinance.releaseGuarantee(guarantorRelease[1]!,guarantorRelease[3]!,String(body.reason??''));if(String(record.data.loanId??'')!==guarantorRelease[2]!)throw Error('LOAN_GUARANTEE_NOT_FOUND');return json(record,200,cors);}
    const solidarityRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/solidarity\/cases$/);
    if(solidarityRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await riskFinance.solidarityCase(solidarityRoute[1]!,{id:body.id?String(body.id):undefined,beneficiaryMembershipId:String(body.beneficiaryMembershipId??''),title:String(body.title??''),approvedAmount:finite(body.approvedAmount),currency:String(body.currency??'XAF')}),201,cors);}
    const solidarityFund=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/solidarity\/cases\/([^/]+)\/fund$/);
    if(solidarityFund&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await riskFinance.fund(solidarityFund[1]!,solidarityFund[2]!,finite(body.amount),String(body.idempotencyKey??makeId('solidarity_fund'))),201,cors);}
    const solidarityPay=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/solidarity\/cases\/([^/]+)\/disburse$/);
    if(solidarityPay&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await riskFinance.disburse(solidarityPay[1]!,solidarityPay[2]!,finite(body.amount),String(body.idempotencyKey??makeId('solidarity_pay'))),201,cors);}
    const communityHubs=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/community\/hubs$/);
    if(communityHubs&&request.method==='GET')return json(await community.listHubs(communityHubs[1]!),200,cors);
    if(communityHubs&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await community.createHub(communityHubs[1]!,{title:String(body.title??''),about:body.about?String(body.about):undefined,visibility:String(body.visibility??'GROUP_PRIVATE') as any,tags:strArray(body.tags),federatedGroupCodes:strArray(body.federatedGroupCodes)}),201,cors);
    }
    const communityPosts=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/community\/hubs\/([^/]+)\/posts$/);
    if(communityPosts&&request.method==='GET')return json(await community.listPosts(communityPosts[1]!,communityPosts[2]!),200,cors);
    if(communityPosts&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await community.createPost(communityPosts[1]!,{hubId:communityPosts[2]!,kind:String(body.kind??'DISCUSSION') as any,title:body.title?String(body.title):undefined,body:String(body.body??'')}),201,cors);
    }
    const communityModerate=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/community\/posts\/([^/]+)\/moderate$/);
    if(communityModerate&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await community.moderate(communityModerate[1]!,communityModerate[2]!,String(body.state??'') as any,String(body.reason??'')),200,cors);}
    const communityFederation=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/community\/hubs\/([^/]+)\/federation$/);
    if(communityFederation&&request.method==='GET')return json(await community.federationProfile(communityFederation[1]!,communityFederation[2]!),200,cors);

    const shopRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/shop$/);
    if(shopRoute&&request.method==='GET')return json(await market.storefront(shopRoute[1]!),200,cors);
    if(shopRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await market.createOrUpdateShop(shopRoute[1]!,{name:String(body.name??''),tagline:body.tagline?String(body.tagline):undefined,visibility:String(body.visibility??'GROUP_ONLY') as any,locality:body.locality?String(body.locality):undefined,categories:strArray(body.categories)}),200,cors);
    }
    const storefrontRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/storefront$/);
    if(storefrontRoute&&request.method==='GET')return json(await market.storefront(storefrontRoute[1]!),200,cors);
    const adDashboard=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/dashboard$/);
    if(adDashboard&&request.method==='GET')return json(await adManager.dashboard(adDashboard[1]!),200,cors);
    const adHousePlan=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/house-plan$/);
    if(adHousePlan&&request.method==='GET')return json(await adManager.housePlan(adHousePlan[1]!),200,cors);
    const adHouseVariants=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/house-variants$/);
    if(adHouseVariants&&request.method==='POST')return json(await adManager.composeHouseVariants(adHouseVariants[1]!),200,cors);
    const adProspects=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/prospects$/);
    if(adProspects&&request.method==='GET')return json(await adManager.listProspects(adProspects[1]!),200,cors);
    if(adProspects&&request.method==='POST')return json(await adManager.createProspect(adProspects[1]!,await readJson<any>(request)),201,cors);
    const adProspectTransition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/prospects\/([^/]+)\/transition$/);
    if(adProspectTransition&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await adManager.transitionProspect(adProspectTransition[1]!,adProspectTransition[2]!,String(body.state??'') as any,String(body.note??'')),200,cors);
    }
    const adInventory=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/inventory$/);
    if(adInventory&&request.method==='GET'){await requireGroup(adInventory[1]!,true);return json({placements:AD_PLACEMENT_CATALOG,houseAds:HOUSE_AD_CATALOG},200,cors);}
    const adDecision=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/decision-preview$/);
    if(adDecision&&request.method==='POST'){
      const groupId=adDecision[1]!,campaigns=await adManager.list(groupId),body=await readJson<any>(request);
      return json(selectAdDelivery(campaigns,body),200,cors);
    }
    const adCampaigns=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/campaigns$/);
    if(adCampaigns&&request.method==='GET')return json(await adManager.list(adCampaigns[1]!),200,cors);
    if(adCampaigns&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await adManager.create(adCampaigns[1]!,body as any),201,cors);
    }
    const adTransition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/campaigns\/([^/]+)\/transition$/);
    if(adTransition&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await adManager.transition(adTransition[1]!,adTransition[2]!,String(body.state??'') as any,String(body.note??'')),200,cors);
    }
    const adMetric=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/ads\/campaigns\/([^/]+)\/metric$/);
    if(adMetric&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await adManager.metric(adMetric[1]!,adMetric[2]!,String(body.event??'') as any),200,cors);
    }

    const stockListing=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/stock\/([^/]+)\/listing$/);
    if(stockListing&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.setStockListing(stockListing[1]!,stockListing[2]!,{published:Boolean(body.published),unitPrice:body.unitPrice===undefined?undefined:finite(body.unitPrice),description:body.description?String(body.description):undefined}),200,cors);}

    const stockRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/stock$/);
    if(stockRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.createStock(stockRoute[1]!,{sku:String(body.sku??''),name:String(body.name??''),quantity:finite(body.quantity),unit:body.unit?String(body.unit):undefined,unitPrice:body.unitPrice===undefined?undefined:finite(body.unitPrice),description:body.description?String(body.description):undefined,published:Boolean(body.published),ownership:body.ownership?String(body.ownership) as any:undefined,ownerRef:body.ownerRef?String(body.ownerRef):undefined}),201,cors);}
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
    const supplierRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/suppliers$/);
    if(supplierRoute&&request.method==='GET')return json({items:await market.suppliers(supplierRoute[1]!)},200,cors);
    if(supplierRoute&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.registerSupplier(supplierRoute[1]!,body),201,cors);}
    const procurementRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/procurements$/);
    if(procurementRoute&&request.method==='GET')return json(await market.procurement(procurementRoute[1]!),200,cors);
    if(procurementRoute&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.createProcurement(procurementRoute[1]!,body),201,cors);}
    const valueProcurementHandoff=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/procurements\/from-value-draft\/([^/]+)$/);
    if(valueProcurementHandoff&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.approveValueProcurementDraft(valueProcurementHandoff[1]!,valueProcurementHandoff[2]!,body),201,cors);}

    const procurementReceive=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/procurements\/([^/]+)\/receive$/);
    if(procurementReceive&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.receiveProcurement(procurementReceive[1]!,procurementReceive[2]!,body),200,cors);}
    const procurementReturn=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/procurements\/([^/]+)\/return$/);
    if(procurementReturn&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.returnProcurement(procurementReturn[1]!,procurementReturn[2]!,body),200,cors);}
    const stockProjectionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/stock\/([^/]+)\/projection$/);
    if(stockProjectionRoute&&request.method==='GET')return json(await market.stockProjection(stockProjectionRoute[1]!,stockProjectionRoute[2]!),200,cors);
    const procurementLifecycleRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/procurements\/([^/]+)\/lifecycle$/);
    if(procurementLifecycleRoute&&request.method==='GET')return json(await market.procurementLifecycle(procurementLifecycleRoute[1]!,procurementLifecycleRoute[2]!),200,cors);
    const supplierInvoiceRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/procurements\/([^/]+)\/invoices$/);
    if(supplierInvoiceRoute&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.recordSupplierInvoice(supplierInvoiceRoute[1]!,{...body,procurementId:supplierInvoiceRoute[2]!}),201,cors);}
    const supplierInvoiceReconcile=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/procurements\/([^/]+)\/invoices\/([^/]+)\/reconcile$/);
    if(supplierInvoiceReconcile&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.reconcileSupplierInvoice(supplierInvoiceReconcile[1]!,{procurementId:supplierInvoiceReconcile[2]!,invoiceId:supplierInvoiceReconcile[3]!,note:body.note?String(body.note):undefined}),200,cors);}
    const supplierCreditNoteRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/procurements\/([^/]+)\/credit-notes$/);
    if(supplierCreditNoteRoute&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.issueSupplierCreditNote(supplierCreditNoteRoute[1]!,{...body,procurementId:supplierCreditNoteRoute[2]!}),201,cors);}
    const supplierCreditPayment=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/supplier-credits\/([^/]+)\/payments$/);
    if(supplierCreditPayment&&request.method==='POST'){const body=await readJson<any>(request);return json(await market.paySupplierCredit(supplierCreditPayment[1]!,supplierCreditPayment[2]!,body),200,cors);}
    const groupBuyRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/group-buys$/);
    if(groupBuyRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.createGroupBuy(groupBuyRoute[1]!,{title:String(body.title??''),stockItemId:body.stockItemId?String(body.stockItemId):undefined,thresholdQuantity:finite(body.thresholdQuantity),deadline:String(body.deadline??'')}),201,cors);}
    const groupBuyCommit=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/group-buys\/([^/]+)\/commit$/);
    if(groupBuyCommit&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.commitGroupBuy(groupBuyCommit[1]!,groupBuyCommit[2]!,String(body.membershipId??''),finite(body.quantity)),200,cors);}
    const socialCommerceRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/social-commerce$/);
    if(socialCommerceRoute&&request.method==='GET')return json(await market.socialCommerce(socialCommerceRoute[1]!),200,cors);
    const flashOfferRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/flash-offers$/);
    if(flashOfferRoute&&request.method==='POST')return json(await market.createFlashOffer(flashOfferRoute[1]!,await readJson<any>(request)),201,cors);
    const flashClose=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/flash-offers\/([^/]+)\/close$/);
    if(flashClose&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.closeFlashOffer(flashClose[1]!,flashClose[2]!,String(body.reason??'')),200,cors);}
    const marketRequestRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/requests$/);
    if(marketRequestRoute&&request.method==='GET')return json({items:await market.marketRequests(marketRequestRoute[1]!)},200,cors);
    if(marketRequestRoute&&request.method==='POST')return json(await market.createMarketRequest(marketRequestRoute[1]!,await readJson<any>(request)),201,cors);
    const marketRequestAccept=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/requests\/([^/]+)\/accept-prediction$/);
    if(marketRequestAccept&&request.method==='POST')return json(await market.acceptPredictedMarketRequest(marketRequestAccept[1]!,marketRequestAccept[2]!),200,cors);
    const marketRequestOpen=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/requests\/([^/]+)\/open$/);
    if(marketRequestOpen&&request.method==='POST')return json(await market.openMarketRequest(marketRequestOpen[1]!,marketRequestOpen[2]!),200,cors);
    const marketResponses=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/requests\/([^/]+)\/responses$/);
    if(marketResponses&&request.method==='GET')return json({items:await market.marketRequestResponses(marketResponses[1]!,marketResponses[2]!)},200,cors);
    if(marketResponses&&request.method==='POST')return json(await market.respondMarketRequest(marketResponses[1]!,marketResponses[2]!,await readJson<any>(request)),201,cors);
    const marketResponseShortlist=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/requests\/([^/]+)\/responses\/([^/]+)\/shortlist$/);
    if(marketResponseShortlist&&request.method==='POST')return json(await market.shortlistMarketResponse(marketResponseShortlist[1]!,marketResponseShortlist[2]!,marketResponseShortlist[3]!),200,cors);
    const marketResponseSelect=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/requests\/([^/]+)\/responses\/([^/]+)\/select$/);
    if(marketResponseSelect&&request.method==='POST')return json(await market.selectMarketResponse(marketResponseSelect[1]!,marketResponseSelect[2]!,marketResponseSelect[3]!),200,cors);
    const marketRequestTransition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/requests\/([^/]+)\/transition$/);
    if(marketRequestTransition&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.transitionMarketRequest(marketRequestTransition[1]!,marketRequestTransition[2]!,String(body.state??'') as any,String(body.note??'')),200,cors);}
    const dealRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/deals$/);
    if(dealRoute&&request.method==='GET')return json({items:await market.deals(dealRoute[1]!)},200,cors);
    if(dealRoute&&request.method==='POST')return json(await market.createDeal(dealRoute[1]!,await readJson<any>(request)),201,cors);
    const dealOpen=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/deals\/([^/]+)\/open$/);
    if(dealOpen&&request.method==='POST')return json(await market.openDeal(dealOpen[1]!,dealOpen[2]!),200,cors);
    const dealCommit=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/deals\/([^/]+)\/commit$/);
    if(dealCommit&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.commitDealQuantity(dealCommit[1]!,dealCommit[2]!,finite(body.quantity)),200,cors);}
    const dealCommitments=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/deals\/([^/]+)\/commitments$/);
    if(dealCommitments&&request.method==='GET')return json({items:await market.dealCommitments(dealCommitments[1]!,dealCommitments[2]!)},200,cors);
    const dealTransition=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/deals\/([^/]+)\/transition$/);
    if(dealTransition&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.transitionDeal(dealTransition[1]!,dealTransition[2]!,String(body.state??'') as any,String(body.note??'')),200,cors);}
    const liveMarketRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/live-markets$/);
    if(liveMarketRoute&&request.method==='GET')return json({items:await market.liveMarkets(liveMarketRoute[1]!)},200,cors);
    if(liveMarketRoute&&request.method==='POST')return json(await market.createLiveMarket(liveMarketRoute[1]!,await readJson<any>(request)),201,cors);
    const liveMarketState=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/live-markets\/([^/]+)\/state$/);
    if(liveMarketState&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.setLiveMarketState(liveMarketState[1]!,liveMarketState[2]!,String(body.state??'') as any),200,cors);}
    const liveMarketPin=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/market\/live-markets\/([^/]+)\/pin-deal$/);
    if(liveMarketPin&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.pinLiveMarketDeal(liveMarketPin[1]!,liveMarketPin[2]!,String(body.dealId??'')),200,cors);}

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
        id:body.id?String(body.id):undefined,title:String(body.title??''),summary:body.summary?String(body.summary):undefined,data,tags:strArray(body.tags)
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
    if(obligationRoute&&request.method==='GET'){
      const groupId=obligationRoute[1]!;await requireGroup(groupId);
      return json((await repo.listObligations(ctx.tenantId)).filter(x=>x.groupId===groupId),200,cors);
    }
    if(obligationRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.createFinancialObligation(obligationRoute[1]!,{
        membershipId:String(body.membershipId??''),type:String(body.type??'CONTRIBUTION_DUE'),title:String(body.title??''),
        dueAt:body.dueAt?String(body.dueAt):undefined,amount:body.amount===undefined?undefined:finite(body.amount),
        currency:String(body.currency??'XAF'),sourceId:body.sourceId?String(body.sourceId):undefined
      }),201,cors);
    }
    const obligationUpdate=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/obligations\/([^/]+)$/);
    if(obligationUpdate&&request.method==='PUT'){
      const groupId=obligationUpdate[1]!,obligationId=obligationUpdate[2]!;await requireGroup(groupId,true);const existing=(await repo.listObligations(ctx.tenantId)).find(x=>x.id===obligationId&&x.groupId===groupId);if(!existing)throw new Error('OBLIGATION_NOT_FOUND');
      const body=await readJson<Record<string,unknown>>(request),status=String(body.status??existing.status) as typeof existing.status;if(!['open','completed','cancelled','overdue'].includes(status))throw new Error('INVALID_OBLIGATION_STATUS');
      const next={...existing,status,title:body.title?String(body.title):existing.title,dueAt:body.dueAt?String(body.dueAt):existing.dueAt,priority:body.priority?String(body.priority) as typeof existing.priority:existing.priority};await repo.saveObligation(next);const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'OBLIGATION_UPDATED',targetType:'obligation',targetId:existing.id,before:{status:existing.status,dueAt:existing.dueAt},after:{status:next.status,dueAt:next.dueAt},requestId:ctx.requestId});await repo.saveAudit(audit);return json(next,200,cors);
    }
    const masterArrearsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/arrears$/);
    if(masterArrearsRoute&&request.method==='GET'){
      const groupId=masterArrearsRoute[1]!;await requireGroup(groupId,true);const now=Date.now(),rows=(await repo.listObligations(ctx.tenantId)).filter(x=>x.groupId===groupId&&(x.status==='overdue'||(x.status==='open'&&Boolean(x.dueAt)&&Date.parse(x.dueAt!)<now)));return json(rows,200,cors);
    }
    const recoveryCase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/arrears\/([^/]+)\/recovery-case$/);
    if(recoveryCase&&request.method==='POST'){
      const groupId=recoveryCase[1]!,obligationId=recoveryCase[2]!;await requireGroup(groupId,true);const obligation=(await repo.listObligations(ctx.tenantId)).find(x=>x.id===obligationId&&x.groupId===groupId);if(!obligation)throw new Error('OBLIGATION_NOT_FOUND');const body=await readJson<Record<string,unknown>>(request),now=new Date().toISOString();
      const record={id:makeId('case'),tenantId:ctx.tenantId,groupId,type:'ARREARS_RECOVERY',subjectType:'obligation',subjectId:obligation.id,status:'OPEN' as const,openedBy:ctx.actorId,openedAt:now,summary:String(body.summary??('Régularisation: '+obligation.title))};await repo.saveCase(record);const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'ARREARS_RECOVERY_OPENED',targetType:'case',targetId:record.id,after:{obligationId:obligation.id,membershipId:obligation.assigneeId},requestId:ctx.requestId});await repo.saveAudit(audit);return json(record,201,cors);
    }
    const operationalReport=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/reports\/operational-summary$/);
    if(operationalReport&&request.method==='GET'){
      const groupId=operationalReport[1]!,group=await requireGroup(groupId,true);const [members,meetingRows,rubricRows,obligationRows,ledgerSummary,entries]=await Promise.all([repo.listMemberships(ctx.tenantId,groupId),repo.listMeetings(ctx.tenantId,groupId),repo.listRubricDefinitions(ctx.tenantId,groupId),repo.listObligations(ctx.tenantId),ledger.summary(ctx.tenantId,groupId),repo.listLedgerEntries(ctx.tenantId,groupId)]);const groupObligations=obligationRows.filter(x=>x.groupId===groupId);return json({group:{id:group.id,name:group.name,kind:group.kind,status:group.status},generatedAt:new Date().toISOString(),summary:{members:members.length,activeMembers:members.filter(x=>x.status==='active').length,meetings:meetingRows.length,openMeetings:meetingRows.filter(x=>x.status==='open').length,rubrics:rubricRows.length,openObligations:groupObligations.filter(x=>x.status==='open'||x.status==='overdue').length,cashBalance:ledgerSummary.cashBalance,ledgerEntries:entries.length},members,meetings:meetingRows,rubrics:rubricRows,obligations:groupObligations,ledger:{summary:ledgerSummary,entries}},200,cors);
    }

    const loanHistory=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/([^/]+)\/history$/);
    if(loanHistory&&request.method==='GET'){
      const groupId=loanHistory[1]!,loanId=loanHistory[2]!,loan=(await completion.list(groupId,'LOAN')).find(x=>x.id===loanId);
      if(!loan)throw new Error('LOAN_NOT_FOUND');
      const events=(await repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.SHEET_EVENT',groupId))
        .filter(x=>String(x.data.loanId??'')===loanId)
        .sort((a,b)=>a.createdAt.localeCompare(b.createdAt))
        .map(x=>({id:x.id,title:x.title,meetingId:x.data.meetingId?String(x.data.meetingId):undefined,rubricId:x.data.rubricId?String(x.data.rubricId):undefined,
          amount:Number(x.data.amount??0),direction:String(x.data.direction??''),principalPaid:Number(x.data.principalPaid??0),interestPaid:Number(x.data.interestPaid??0),
          ledgerEntryId:x.data.ledgerEntryId?String(x.data.ledgerEntryId):undefined,createdAt:x.createdAt}));
      const periods=(await repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.LOAN_PERIOD',groupId))
        .filter(x=>String(x.data.loanId??'')===loanId).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))
        .map(x=>({id:x.id,title:x.title,meetingId:String(x.data.meetingId??''),principalBefore:Number(x.data.principalBefore??0),interestOpening:Number(x.data.interestOpening??0),interestNew:Number(x.data.interestNew??0),payment:Number(x.data.paymentAmount??0),principalPaid:Number(x.data.principalPaid??0),interestPaid:Number(x.data.interestPaid??0),principalAfter:Number(x.data.principalAfter??0),interestAfter:Number(x.data.interestAfter??0),totalDebtAfter:Number(x.data.totalDebtAfter??0),nextInterestProjected:Number(x.data.nextInterestProjected??0),nextTotalDueProjected:Number(x.data.nextTotalDueProjected??0),priority:String(x.data.priority??loan.data.paymentPriority??'CAPITAL_FIRST'),createdAt:x.createdAt}));
      return json({loanId,borrowerMembershipId:String(loan.data.borrowerMembershipId??''),events,periods},200,cors);
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
      const principal=finite(body.amount??loan.data.principal),idempotencyKey=String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('loan_disbursement'));
      const applied=await disburseApprovedLoan({groupId:loanDisburse[1]!,loan,principal,expectedVersion:finite(body.expectedVersion),meetingId:body.meetingId?String(body.meetingId):undefined,rubricId:body.rubricId?String(body.rubricId):undefined,idempotencyKey});
      return json(applied,201,cors);
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
      const loanRubrics=await repo.listRubricDefinitions(ctx.tenantId,loanRepay[1]!),loanRubric=loanRubrics.find(r=>r.id===String(loan.data.rubricId??''))??loanRubrics.find(r=>String(r.facets?.custom?.systemKey??'').toUpperCase()==='LOAN'||/^(pret|prets|emprunt|emprunts|loan|loans)$/.test(String(r.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()));
      // Group policy, not an old browser's cached priority, governs NEW repayments.
      // Historical period allocations remain immutable and auditable.
      const specialPriority=String(loan.data.loanClass??'')==='SPECIAL'?loanRubric?.policies?.loan?.specialLoans?.[0]?.paymentPriority:undefined;
      const currentPriority=String(specialPriority??loanRubric?.policies?.loan?.paymentPriority??body.priority??loan.data.paymentPriority??'CAPITAL_FIRST')==='INTEREST_FIRST'?'INTEREST_FIRST':'CAPITAL_FIRST';
      const outstanding=finite(loan.data.outstandingPrincipal),unpaidInterest=finite(loan.data.unpaidInterest,0),meetingId=body.meetingId?String(body.meetingId):undefined;
      const repaymentPeriodsPerYear=Math.max(1,finite(loan.data.installmentsPerYear,12)),rateBasisPointsPerPeriod=finite(body.rateBasisPointsPerPeriod??loan.data.rateBasisPointsPerPeriod??Math.round(finite(loan.data.annualRateBasisPoints,0)/repaymentPeriodsPerYear),0);
      let accruedMeetingIds=jsonStringArray(loan.data.accruedMeetingIdsJson),preparedInterestMeetingIds=jsonStringArray(loan.data.preparedInterestMeetingIdsJson),preparedInterestPending=loan.data.preparedInterestPending===true||String(loan.data.preparedInterestPending)==='true';
      let periodInterest=0,interestDue=unpaidInterest,usedPreparedInterest=false;
      if(meetingId){
        if(preparedInterestMeetingIds.includes(meetingId)){preparedInterestMeetingIds=preparedInterestMeetingIds.filter(id=>id!==meetingId);usedPreparedInterest=true;}
        else if(preparedInterestPending){preparedInterestPending=false;usedPreparedInterest=true;}
        else if(!accruedMeetingIds.includes(meetingId)){periodInterest=Math.round(outstanding*rateBasisPointsPerPeriod/10000);interestDue+=periodInterest;accruedMeetingIds.push(meetingId);}
      }
      const explicitAllocation=body.principalAmount!==undefined||body.interestAmount!==undefined;
      const allocation=explicitAllocation
        ?(()=>{const principalPaid=finite(body.principalAmount,0),interestPaid=finite(body.interestAmount,0);if(principalPaid>outstanding)throw new Error('INVALID_LOAN_REPAYMENT');if(interestPaid>interestDue)throw new Error('LOAN_INTEREST_PAYMENT_EXCEEDS_DUE');const remainingPrincipal=outstanding-principalPaid,unpaidInterestAfter=interestDue-interestPaid;return{principalPaid,interestPaid,remainingPrincipal,unpaidInterestAfter,totalDebtAfter:remainingPrincipal+unpaidInterestAfter,interestAccrued:periodInterest,totalInterestDue:interestDue,paymentAmount:principalPaid+interestPaid,priority:currentPriority};})()
        :applyLoanPayment({principalOutstanding:outstanding,unpaidInterest:interestDue,paymentAmount:finite(body.paymentAmount),rateBasisPointsPerPeriod:meetingId?0:rateBasisPointsPerPeriod,priority:currentPriority as any});
      if(allocation.principalPaid<0||allocation.principalPaid>outstanding)throw new Error('INVALID_LOAN_REPAYMENT');
      const entry=await ledger.recordLoanRepayment({
        tenantId:ctx.tenantId,groupId:loanRepay[1]!,principalAmount:allocation.principalPaid,interestAmount:allocation.interestPaid,
        currency:String(loan.data.currency??'XAF'),sourceId:loan.id,meetingId,
        idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('loan_repayment'))
      });
      const target=allocation.remainingPrincipal===0&&allocation.unpaidInterestAfter===0?'CLOSED':'REPAYING';
      const updatedLoan=await completion.transition(loanRepay[1]!,loan.id,target,{
        expectedVersion:finite(body.expectedVersion),patch:{outstandingPrincipal:allocation.remainingPrincipal,unpaidInterest:allocation.unpaidInterestAfter,lastRepaymentLedgerEntryId:entry.id,paymentPriority:allocation.priority,accruedMeetingIdsJson:JSON.stringify(accruedMeetingIds),preparedInterestMeetingIdsJson:JSON.stringify(preparedInterestMeetingIds),preparedInterestPending,interestAppliesToMeetingId:usedPreparedInterest&&meetingId?meetingId:loan.data.interestAppliesToMeetingId}
      });
      if(meetingId){
        const periodId='loan_period_'+encodeURIComponent(loan.id+'|'+meetingId),oldPeriod=await repo.getWorkspaceRecord(ctx.tenantId,periodId),stamp=entry.createdAt,nextInterest=Math.round(allocation.remainingPrincipal*rateBasisPointsPerPeriod/10000);
        const previousPayment=Number(oldPeriod?.data.paymentAmount??0),previousPrincipalPaid=Number(oldPeriod?.data.principalPaid??0),previousInterestPaid=Number(oldPeriod?.data.interestPaid??0),previousInterestNew=Number(oldPeriod?.data.interestNew??0);
        await repo.saveWorkspaceRecord({id:periodId,tenantId:ctx.tenantId,groupId:loanRepay[1]!,moduleId:'FINANCE.LOAN_PERIOD',title:'Période de prêt',summary:'Évolution mensuelle du capital et des intérêts issue des écritures des deux feuilles.',status:'DONE',tags:['loan-period','loan:'+loan.id,'meeting:'+meetingId],data:{loanId:loan.id,membershipId:String(loan.data.borrowerMembershipId??''),meetingId,principalBefore:Number(oldPeriod?.data.principalBefore??outstanding),interestOpening:Number(oldPeriod?.data.interestOpening??unpaidInterest),interestNew:previousInterestNew+periodInterest,paymentAmount:previousPayment+allocation.paymentAmount,principalPaid:previousPrincipalPaid+allocation.principalPaid,interestPaid:previousInterestPaid+allocation.interestPaid,principalAfter:allocation.remainingPrincipal,interestAfter:allocation.unpaidInterestAfter,totalDebtAfter:allocation.totalDebtAfter,nextInterestProjected:nextInterest,nextTotalDueProjected:allocation.totalDebtAfter+nextInterest,priority:String(allocation.priority),rateBasisPointsPerPeriod},createdBy:oldPeriod?.createdBy??ctx.actorId,createdAt:oldPeriod?.createdAt??stamp,updatedAt:stamp});
      }
      const repaymentRubricId=body.rubricId?String(body.rubricId):undefined;
      if(repaymentRubricId&&meetingId){
        const eventId='sheet_loan_event_'+entry.id,existing=await repo.getWorkspaceRecord(ctx.tenantId,eventId);
        if(!existing)await repo.saveWorkspaceRecord({id:eventId,tenantId:ctx.tenantId,groupId:loanRepay[1]!,moduleId:'FINANCE.SHEET_EVENT',title:'Remboursement prêt',summary:'Projection de feuille liée à une écriture canonique de remboursement.',status:'DONE',tags:['sheet-event','loan-repayment','ledger:'+entry.id],data:{membershipId:String(loan.data.borrowerMembershipId??''),meetingId,rubricId:repaymentRubricId,loanId:loan.id,ledgerEntryId:entry.id,principalPaid:allocation.principalPaid,interestPaid:allocation.interestPaid,amount:allocation.paymentAmount,direction:'IN'},createdBy:ctx.actorId,createdAt:entry.createdAt,updatedAt:entry.createdAt});
        await publishLive(loanRepay[1]!,'MEETING_UPDATE','loan-repayment-live:'+entry.id,{meetingId,kind:'FINANCIAL_CELL',operationType:'LOAN_REPAYMENT',membershipId:String(loan.data.borrowerMembershipId??''),rubricId:repaymentRubricId,previousAmount:0,newAmount:allocation.paymentAmount,meetingClosed:false,actorId:ctx.actorId,actorName:await actorLabel()});
      }
      return json({entry,allocation,loan:updatedLoan},201,cors);
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
      const groupId=calendarRoute[1]!;await requireGroup(groupId);
      const [meetings,obligations]=await Promise.all([repo.listMeetings(ctx.tenantId,groupId),repo.listObligations(ctx.tenantId,ctx.actorId)]);
      const events=[
        ...meetings.filter(x=>x.scheduledAt).map(x=>({uid:'meeting-'+x.id,title:x.title,start:x.scheduledAt!,cancelled:x.status==='cancelled'})),
        ...obligations.filter(x=>x.groupId===groupId&&x.dueAt&&(x.status==='open'||x.status==='overdue')).map(x=>({uid:'obligation-'+x.id,title:'Échéance · '+x.title,start:x.dueAt!,cancelled:false}))
      ];
      const ics=makeIcs(events);
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
      if(record.moduleId==='FINANCE.SAVINGS_YIELD'&&record.tags.includes('savings-yield-policy')&&record.groupId)await publishLive(record.groupId,'RULE_UPDATE','savings-yield-policy:'+record.id+':'+record.updatedAt,{kind:'SAVINGS_DISTRIBUTION_POLICY',recordId:record.id,updatedAt:record.updatedAt,actorId:ctx.actorId});
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
      if(updated.moduleId==='FINANCE.SAVINGS_YIELD'&&updated.tags.includes('savings-yield-policy')&&updated.groupId)await publishLive(updated.groupId,'RULE_UPDATE','savings-yield-policy:'+updated.id+':'+updated.updatedAt,{kind:'SAVINGS_DISTRIBUTION_POLICY',recordId:updated.id,updatedAt:updated.updatedAt,actorId:ctx.actorId});
      return json(updated,200,cors);
    }

    if(request.method==='POST'&&url.pathname==='/api/v1/outbox/apply'){
      const item=await readJson<OutboxItem<Record<string,unknown>>>(request); if(item.tenantId!==ctx.tenantId||item.actorId!==ctx.actorId) throw new Error('FORBIDDEN_SCOPE');
      const markerHash=await sha256Bytes(new TextEncoder().encode(JSON.stringify([ctx.tenantId,ctx.actorId,item.idempotencyKey])).buffer);
      const markerId='outbox_applied_'+markerHash,existingMarker=await repo.getWorkspaceRecord(ctx.tenantId,markerId);
      if(existingMarker)return json({accepted:true,stored:true,replayed:true,type:item.type,idempotencyKey:item.idempotencyKey},200,cors);
      const markApplied=async()=>{const at=new Date().toISOString();await repo.saveWorkspaceRecord({id:markerId,tenantId:ctx.tenantId,groupId:(item.payload as any).groupId?String((item.payload as any).groupId):undefined,moduleId:'OFFLINE.OUTBOX_ACK',title:'Offline operation acknowledged',summary:undefined,status:'DONE',tags:['offline','idempotency','type:'+item.type],data:{type:item.type,idempotencyKey:item.idempotencyKey},createdBy:ctx.actorId,createdAt:at,updatedAt:at});};
      if(item.type==='CONTRIBUTION_CASH_RECORDED'){
        const p=item.payload;const groupId=String(p.groupId??'');
        const receipt=await ledger.recordCashContribution({tenantId:ctx.tenantId,groupId,membershipId:String(p.membershipId??''),amount:finite(p.amount),currency:String(p.currency??'XAF'),meetingId:p.meetingId?String(p.meetingId):undefined,rubricId:p.rubricId?String(p.rubricId):undefined,lateReason:p.lateReason?String(p.lateReason):undefined,approverIds:strArray(p.approverIds),lateAuthorizationId:p.lateAuthorizationId?String(p.lateAuthorizationId):undefined,idempotencyKey:item.idempotencyKey});
        const entry=await repo.getLedgerEntry(ctx.tenantId,groupId,receipt.ledgerEntryId);
        if(entry)await dispatchContributionProjection(groupId,receipt,entry);
        await markApplied();
        return json({accepted:true,receipt},200,cors);
      }
      if(item.type==='FINANCIAL_SHEET_ENTRY_V1'){
        const p=item.payload,groupId=String(p.groupId??''),membershipId=String(p.membershipId??''),meetingId=String(p.meetingId??''),rubricId=String(p.rubricId??''),amount=finite(p.amount),nature=String(p.nature??'');
        await requireGroup(groupId,true);
        const membership=await repo.getMembership(ctx.tenantId,groupId,membershipId),meeting=await repo.getMeeting(ctx.tenantId,groupId,meetingId),rubric=await repo.getRubricDefinition(ctx.tenantId,groupId,rubricId);
        if(!membership)throw Error('MEMBERSHIP_NOT_FOUND');if(!meeting||meeting.status==='cancelled')throw Error('MEETING_NOT_FOUND');if(!rubric)throw Error('RUBRIC_NOT_FOUND');
        if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_CONTRIBUTION_AMOUNT');

        if(nature==='OUTFLOW'){
          const expense=await new ExpenseService(repo,kernel,ledger).create(groupId,{amount,label:String(p.rubricName??rubric.name??'Dépense de séance'),scope:'SHEET',meetingId,membershipId,rubricId,note:String(p.reason??'Saisie financière hors ligne puis synchronisée'),idempotencyKey:item.idempotencyKey});
          await markApplied();return json({accepted:true,stored:true,expense},200,cors);
        }

        if(nature==='LOAN'){
          const policy=rubric.policies?.loan;if(!policy?.allowed)throw Error('LOAN_POLICY_REQUIRED');
          const normalized=String(rubric.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),special=/special/.test(normalized)?policy.specialLoans?.[0]:undefined;
          const rawRate=p.rateBasisPointsPerPeriod??special?.rateBasisPointsPerPeriod??policy.rateBasisPointsPerPeriod;if(rawRate===undefined||rawRate===null)throw Error('LOAN_RATE_REQUIRED');
          const rateBasisPointsPerPeriod=finite(rawRate),paymentPriority=String(p.paymentPriority??special?.paymentPriority??policy.paymentPriority??'CAPITAL_FIRST'),interestTiming=normalizedLoanInterestTiming(p.interestTiming??special?.interestTiming??policy.interestTiming),periods=finite(p.periods??special?.maxDurationPeriods??policy.overdue?.maxDurationPeriods??6),loanClass=String(p.loanClass??(special?'SPECIAL':'STANDARD'));
          let loan=(await completion.list(groupId,'LOAN')).find(x=>String(x.data?.sheetEntryKey??'')===item.idempotencyKey);
          if(!loan)loan=await completion.create(groupId,'LOAN',{title:String(rubric.name??'Prêt'),data:{principal:amount,currency:'XAF',borrowerMembershipId:membershipId,rubricId,rateBasisPointsPerPeriod,paymentPriority,interestTiming,noInterestOnInterest:true,periods,outstandingPrincipal:0,unpaidInterest:0,loanClass,sourceSurface:'TWO_SHEETS',sheetEntryKey:item.idempotencyKey}});
          let state=String(loan.data.completionState??'');
          if(state==='DRAFT'){loan=await completion.transition(groupId,loan.id,'SUBMITTED',{expectedVersion:finite(loan.data.completionVersion),patch:{submittedFromSheet:true,meetingId}});state=String(loan.data.completionState);}
          if(state==='SUBMITTED'){loan=await completion.transition(groupId,loan.id,'APPROVED',{expectedVersion:finite(loan.data.completionVersion),patch:{approvedAt:new Date().toISOString(),approvedFromSheet:true}});state=String(loan.data.completionState);}
          const applied=await disburseApprovedLoan({groupId,loan,principal:amount,expectedVersion:finite(loan.data.completionVersion),meetingId,rubricId,idempotencyKey:item.idempotencyKey+':disburse'});
          await markApplied();return json({accepted:true,stored:true,...applied},200,cors);
        }

        if(nature==='REPAYMENT'){
          const repaymentKey=item.idempotencyKey+':repay',rawComponent=String(p.repaymentComponent??'AUTO').toUpperCase(),component=rawComponent==='INTEREST'?'INTEREST':rawComponent==='PRINCIPAL'?'PRINCIPAL':'AUTO';
          let entry=await repo.findLedgerEntryByIdempotency(ctx.tenantId,groupId,repaymentKey);
          let loans=await completion.list(groupId,'LOAN'),loan=p.loanId?loans.find(x=>x.id===String(p.loanId)):undefined;
          if(entry&&!loan)loan=loans.find(x=>String(x.data?.lastRepaymentLedgerEntryId??'')===entry!.id);
          if(!loan){
            const active=loans.filter(x=>String(x.data?.borrowerMembershipId??'')===membershipId&&['DISBURSED','REPAYING'].includes(String(x.data?.completionState??''))&&(finite(x.data?.outstandingPrincipal)>0||finite(x.data?.unpaidInterest)>0));
            if(active.length!==1)throw Error(active.length>1?'MULTIPLE_LOANS':'LOAN_REQUIRED');loan=active[0]!;
          }
          const loanRubrics=await repo.listRubricDefinitions(ctx.tenantId,groupId),loanRubric=loanRubrics.find(r=>r.id===String(loan!.data?.rubricId??''))??loanRubrics.find(r=>String(r.facets?.custom?.systemKey??'').toUpperCase()==='LOAN'||/^(pret|prets|emprunt|emprunts|loan|loans)$/.test(String(r.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()));
          const priority=String(loanRubric?.policies?.loan?.paymentPriority??p.paymentPriority??loan.data?.paymentPriority??'CAPITAL_FIRST')==='INTEREST_FIRST'?'INTEREST_FIRST':'CAPITAL_FIRST';
          let principalPaid=component==='PRINCIPAL'?amount:0,interestPaid=component==='INTEREST'?amount:0;
          if(!entry||String(loan.data?.lastRepaymentLedgerEntryId??'')!==entry.id){
            const outstanding=finite(loan.data.outstandingPrincipal),unpaidInterest=finite(loan.data.unpaidInterest,0),repaymentPeriodsPerYear=Math.max(1,finite(loan.data.installmentsPerYear,12)),rateBasisPointsPerPeriod=finite(loan.data.rateBasisPointsPerPeriod??Math.round(finite(loan.data.annualRateBasisPoints,0)/repaymentPeriodsPerYear),0);
            let accruedMeetingIds=jsonStringArray(loan.data.accruedMeetingIdsJson),preparedInterestMeetingIds=jsonStringArray(loan.data.preparedInterestMeetingIdsJson),preparedInterestPending=loan.data.preparedInterestPending===true||String(loan.data.preparedInterestPending)==='true';
            let periodInterest=0,interestDue=unpaidInterest,usedPreparedInterest=false;
            if(preparedInterestMeetingIds.includes(meetingId)){preparedInterestMeetingIds=preparedInterestMeetingIds.filter(id=>id!==meetingId);usedPreparedInterest=true;}
            else if(preparedInterestPending){preparedInterestPending=false;usedPreparedInterest=true;}
            else if(!accruedMeetingIds.includes(meetingId)){periodInterest=Math.round(outstanding*rateBasisPointsPerPeriod/10000);interestDue+=periodInterest;accruedMeetingIds.push(meetingId);}
            if(component==='AUTO'){
              const allocation=applyLoanPayment({principalOutstanding:outstanding,unpaidInterest:interestDue,paymentAmount:amount,rateBasisPointsPerPeriod:0,priority});
              principalPaid=allocation.principalPaid;interestPaid=allocation.interestPaid;
            }
            if(principalPaid>outstanding)throw Error('INVALID_LOAN_REPAYMENT');if(interestPaid>interestDue)throw Error('LOAN_INTEREST_PAYMENT_EXCEEDS_DUE');
            const remainingPrincipal=outstanding-principalPaid,unpaidInterestAfter=interestDue-interestPaid,totalDebtAfter=remainingPrincipal+unpaidInterestAfter,paymentAmount=principalPaid+interestPaid;
            entry=await ledger.recordLoanRepayment({tenantId:ctx.tenantId,groupId,principalAmount:principalPaid,interestAmount:interestPaid,currency:String(loan.data.currency??'XAF'),sourceId:loan.id,meetingId,idempotencyKey:repaymentKey});
            const target=remainingPrincipal===0&&unpaidInterestAfter===0?'CLOSED':'REPAYING';
            loan=await completion.transition(groupId,loan.id,target,{expectedVersion:finite(loan.data.completionVersion),patch:{outstandingPrincipal:remainingPrincipal,unpaidInterest:unpaidInterestAfter,lastRepaymentLedgerEntryId:entry.id,paymentPriority:priority,accruedMeetingIdsJson:JSON.stringify(accruedMeetingIds),preparedInterestMeetingIdsJson:JSON.stringify(preparedInterestMeetingIds),preparedInterestPending,interestAppliesToMeetingId:usedPreparedInterest?meetingId:loan.data.interestAppliesToMeetingId}});
            const periodId='loan_period_'+encodeURIComponent(loan.id+'|'+meetingId),oldPeriod=await repo.getWorkspaceRecord(ctx.tenantId,periodId),stamp=entry.createdAt,nextInterest=Math.round(remainingPrincipal*rateBasisPointsPerPeriod/10000),previousPayment=Number(oldPeriod?.data.paymentAmount??0),previousPrincipalPaid=Number(oldPeriod?.data.principalPaid??0),previousInterestPaid=Number(oldPeriod?.data.interestPaid??0),previousInterestNew=Number(oldPeriod?.data.interestNew??0);
            await repo.saveWorkspaceRecord({id:periodId,tenantId:ctx.tenantId,groupId,moduleId:'FINANCE.LOAN_PERIOD',title:'Période de prêt',summary:'Évolution du prêt synchronisée depuis une saisie financière hors ligne.',status:'DONE',tags:['loan-period','loan:'+loan.id,'meeting:'+meetingId,'offline-replay'],data:{loanId:loan.id,membershipId,meetingId,principalBefore:Number(oldPeriod?.data.principalBefore??outstanding),interestOpening:Number(oldPeriod?.data.interestOpening??unpaidInterest),interestNew:previousInterestNew+periodInterest,paymentAmount:previousPayment+paymentAmount,principalPaid:previousPrincipalPaid+principalPaid,interestPaid:previousInterestPaid+interestPaid,principalAfter:remainingPrincipal,interestAfter:unpaidInterestAfter,totalDebtAfter,nextInterestProjected:nextInterest,nextTotalDueProjected:totalDebtAfter+nextInterest,priority,rateBasisPointsPerPeriod},createdBy:oldPeriod?.createdBy??ctx.actorId,createdAt:oldPeriod?.createdAt??stamp,updatedAt:stamp});
          }
          if(entry){
            const eventId='sheet_loan_event_'+entry.id,existing=await repo.getWorkspaceRecord(ctx.tenantId,eventId);
            if(!existing)await repo.saveWorkspaceRecord({id:eventId,tenantId:ctx.tenantId,groupId,moduleId:'FINANCE.SHEET_EVENT',title:'Remboursement prêt',summary:'Projection de feuille liée à une écriture canonique de remboursement synchronisée depuis l’outbox.',status:'DONE',tags:['sheet-event','loan-repayment','ledger:'+entry.id,'offline-replay'],data:{membershipId,meetingId,rubricId,loanId:loan.id,ledgerEntryId:entry.id,principalPaid,interestPaid,amount:principalPaid+interestPaid,direction:'IN'},createdBy:ctx.actorId,createdAt:entry.createdAt,updatedAt:entry.createdAt});
          }
          await markApplied();return json({accepted:true,stored:true,loan,entry},200,cors);
        }

        throw Error('UNSUPPORTED_FINANCIAL_SHEET_NATURE');
      }

      if(item.type==='MEETING_NOTE_UPDATED'){
        const groupId=String(item.payload.groupId??'');await requireGroup(groupId,true);
        const note=String(item.payload.note??'').trim();if(!note)throw Error('NOTE_REQUIRED');
        const id='note_'+encodeURIComponent(JSON.stringify([ctx.tenantId,ctx.actorId,item.idempotencyKey]));
        const existing=await repo.getWorkspaceRecord(ctx.tenantId,id);
        if(existing && (existing.summary!==note || existing.groupId!==groupId))throw Error('IDEMPOTENCY_CONFLICT');
        if(!existing)await repo.saveWorkspaceRecord({id,tenantId:ctx.tenantId,groupId,moduleId:'MEETING.COMMAND_CENTER',title:'Note de séance',summary:note,status:'ACTIVE',tags:['note'],data:{},createdBy:ctx.actorId,createdAt:item.createdAt,updatedAt:new Date().toISOString()});
        await markApplied();
        return json({accepted:true,stored:true,type:item.type,recordId:id},200,cors);
      }
      if(item.type==='GROUP_PROJECT_UPSERT_V1'){
        const p=item.payload,input=(p.input&&typeof p.input==='object'?p.input:{}) as Record<string,unknown>,rubricPlans=Array.isArray(input.rubrics)?input.rubrics:undefined;
        const financial=rubricPlans!==undefined?{rubrics:rubricPlans as any}:{memberCount:finite(input.memberCount),sessions:finite(input.sessions),nominalContribution:{currency:'XAF',amount:finite(input.nominalContribution)},managementFeePerContribution:{currency:'XAF',amount:finite(input.managementFeePerContribution,0)},estimatedExternalCostRate:finite(input.estimatedExternalCostRate,0),fixedOperatingCostPerSession:{currency:'XAF',amount:finite(input.fixedOperatingCostPerSession,0)}};
        const project=await foundation.createProject({projectId:String(p.projectId??''),tenantId:ctx.tenantId,createdBy:ctx.actorId,name:String(input.name??''),kind:String(input.kind??'rotating_tontine') as any,governanceModel:String(input.governanceModel??'founder_managed') as any,launchProfile:input.launchProfile as any,...financial},item.idempotencyKey);
        const result=await foundation.simulateProject(ctx.tenantId,project.id,item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,project,result},200,cors);
      }
      if(item.type==='GROUP_PROJECT_CONVERT_V1'){
        const group=await foundation.convertProjectToGroup(ctx.tenantId,String(item.payload.projectId??''),item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,group},200,cors);
      }
      if(item.type==='MEMBER_ADD_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const membership=await foundation.addMember(ctx.tenantId,groupId,{id:String(p.userId??''),displayName:String(p.displayName??''),locale:String(p.locale??ctx.locale),createdAt:String(p.createdAt??new Date().toISOString())},item.idempotencyKey,String(p.membershipId??''));
        await markApplied();
        return json({accepted:true,stored:true,membership},200,cors);
      }
      if(item.type==='MEMBER_NUMBER_ORDER_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const memberships=await foundation.setMemberNumberOrder(ctx.tenantId,groupId,strArray(p.membershipIds),item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,memberships},200,cors);
      }
      if(item.type==='GROUP_EXERCISE_LABEL_V1'){
        const p=item.payload,groupId=String(p.groupId??''),label=String(p.label??'').trim();await requireGroup(groupId,true);if(!label)throw Error('EXERCISE_LABEL_REQUIRED');
        const group=await repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
        if(group.currentExerciseLabel!==label)await repo.saveGroup({...group,currentExerciseLabel:label});
        await markApplied();return json({accepted:true,stored:true,groupId,label},200,cors);
      }
      if(item.type==='SAVINGS_PLAN_CREATE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const record=await treasury.createSavingsPlan(groupId,{id:String(p.id??''),membershipId:String(p.membershipId??''),name:String(p.name??''),targetAmount:p.targetAmount===null||p.targetAmount===undefined?undefined:finite(p.targetAmount),currency:String(p.currency??'XAF')});
        await markApplied();return json({accepted:true,stored:true,record},200,cors);
      }
      if(item.type==='SAVINGS_DEPOSIT_V1'){
        const p=item.payload,groupId=String(p.groupId??''),planId=String(p.planId??''),key=String(p.idempotencyKey??item.idempotencyKey);await requireGroup(groupId,true);
        const entry=await treasury.depositSavings(groupId,planId,finite(p.amount),key);
        await markApplied();return json({accepted:true,stored:true,entry},200,cors);
      }
      if(item.type==='SAVINGS_WITHDRAW_V1'){
        const p=item.payload,groupId=String(p.groupId??''),planId=String(p.planId??''),key=String(p.idempotencyKey??item.idempotencyKey);await requireGroup(groupId,true);
        const entry=await treasury.withdrawSavings(groupId,planId,finite(p.amount),key);
        await markApplied();return json({accepted:true,stored:true,entry},200,cors);
      }
      if(item.type==='OPENING_BALANCE_V1'){
        const p=item.payload,groupId=String(p.groupId??''),key=String(p.idempotencyKey??item.idempotencyKey);await requireGroup(groupId,true);
        const result=await treasury.openingBalance(groupId,{amount:finite(p.amount),currency:String(p.currency??'XAF'),note:String(p.note??'Offline opening balance'),idempotencyKey:key});
        await markApplied();return json({accepted:true,stored:true,result},200,cors);
      }
      if(item.type==='CUSTODY_CREATE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const record=await treasury.createCustody(groupId,{id:String(p.id??''),name:String(p.name??''),holder:String(p.holder??''),currency:String(p.currency??'XAF')});
        await markApplied();return json({accepted:true,stored:true,record},200,cors);
      }
      if(item.type==='CUSTODY_SEND_V1'){
        const p=item.payload,groupId=String(p.groupId??''),key=String(p.idempotencyKey??item.idempotencyKey);await requireGroup(groupId,true);
        const entry=await treasury.sendToCustody(groupId,String(p.custodyId??''),finite(p.amount),key);
        await markApplied();return json({accepted:true,stored:true,entry},200,cors);
      }
      if(item.type==='CUSTODY_RETURN_V1'){
        const p=item.payload,groupId=String(p.groupId??''),key=String(p.idempotencyKey??item.idempotencyKey);await requireGroup(groupId,true);
        const entry=await treasury.returnFromCustody(groupId,String(p.custodyId??''),finite(p.amount),key);
        await markApplied();return json({accepted:true,stored:true,entry},200,cors);
      }
      if(item.type==='SOLIDARITY_CASE_CREATE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const record=await riskFinance.solidarityCase(groupId,{id:String(p.id??''),beneficiaryMembershipId:String(p.beneficiaryMembershipId??''),title:String(p.title??''),approvedAmount:finite(p.approvedAmount),currency:String(p.currency??'XAF')});
        await markApplied();return json({accepted:true,stored:true,record},200,cors);
      }
      if(item.type==='SOLIDARITY_FUND_V1'){
        const p=item.payload,groupId=String(p.groupId??''),key=String(p.idempotencyKey??item.idempotencyKey);await requireGroup(groupId,true);
        const entry=await riskFinance.fund(groupId,String(p.caseId??''),finite(p.amount),key);
        await markApplied();return json({accepted:true,stored:true,entry},200,cors);
      }
      if(item.type==='SOLIDARITY_DISBURSE_V1'){
        const p=item.payload,groupId=String(p.groupId??''),key=String(p.idempotencyKey??item.idempotencyKey);await requireGroup(groupId,true);
        const entry=await riskFinance.disburse(groupId,String(p.caseId??''),finite(p.amount),key);
        await markApplied();return json({accepted:true,stored:true,entry},200,cors);
      }
      if(item.type==='MEMBER_LIFECYCLE_V1'){
        const p=item.payload,groupId=String(p.groupId??''),membershipId=String(p.membershipId??''),input=(p.input&&typeof p.input==='object'?p.input:{}) as Record<string,unknown>,group=await requireGroup(groupId,true);
        const existing=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!existing)throw Error('MEMBERSHIP_NOT_FOUND');
        const status=String(input.status??existing.status) as import('../../../packages/contracts/src/index.js').Membership['status'];if(!['invited','waitlisted','trial','active','suspended','left'].includes(status))throw Error('INVALID_MEMBERSHIP_STATUS');
        const expected=input.expectedRevision===undefined?Number(existing.lifecycleRevision??0):finite(input.expectedRevision);
        if(expected!==Number(existing.lifecycleRevision??0)){
          if(Number(existing.lifecycleRevision??0)>expected&&existing.status===status){await markApplied();return json({accepted:true,stored:true,membership:existing,replayed:true},200,cors);}
          throw Error('STALE_MEMBERSHIP_VERSION');
        }
        const roles=input.roles===undefined?existing.roles:strArray(input.roles);if(existing.userId===group.createdBy&&!roles.includes('founder'))throw Error('FOUNDER_ROLE_REQUIRED');
        const now=new Date().toISOString(),next={...existing,status,roles,historicalJoinedAt:input.historicalJoinedAt?String(input.historicalJoinedAt):existing.historicalJoinedAt,probationEndsAt:input.probationEndsAt?String(input.probationEndsAt):undefined,lifecycleReason:input.reason?String(input.reason):existing.lifecycleReason,lifecycleUpdatedAt:now,lifecycleUpdatedBy:ctx.actorId,lifecycleRevision:Number(existing.lifecycleRevision??0)+1,reinstatedAt:status==='active'&&['suspended','left','waitlisted','trial'].includes(existing.status)?now:existing.reinstatedAt};
        await repo.saveMembership(next);await repo.saveAudit(kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'MEMBERSHIP_LIFECYCLE_OFFLINE_REPLAYED',targetType:'membership',targetId:membershipId,before:{status:existing.status,roles:existing.roles,revision:existing.lifecycleRevision??0},after:{status:next.status,roles:next.roles,revision:next.lifecycleRevision},metadata:{outboxId:item.id},requestId:ctx.requestId}));
        await markApplied();return json({accepted:true,stored:true,membership:next},200,cors);
      }
      if(item.type==='MEMBER_NAME_V1'){
        const p=item.payload,groupId=String(p.groupId??''),membershipId=String(p.membershipId??''),displayName=String(p.displayName??'').trim(),reason=String(p.reason??'').trim();await requireGroup(groupId,true);
        const membership=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!membership)throw Error('MEMBERSHIP_NOT_FOUND');const user=await repo.getUser(membership.userId);if(!user)throw Error('USER_NOT_FOUND');
        if(!displayName||!reason)throw Error('MEMBER_NAME_REQUIRED');
        if(user.displayName!==displayName){const before=user.displayName;await repo.saveUser({...user,displayName});await repo.saveAudit(kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'MEMBER_NAME_OFFLINE_REPLAYED',targetType:'membership',targetId:membershipId,before:{displayName:before},after:{displayName},metadata:{reason,outboxId:item.id},requestId:ctx.requestId}));}
        await markApplied();return json({accepted:true,stored:true,membership:{...membership,displayName}},200,cors);
      }
      if(item.type==='COMPLETION_CREATE_V1'){
        const p=item.payload,groupId=String(p.groupId??''),id=String(p.id??''),kind=String(p.kind??'') as CompletionKind;await requireGroup(groupId,true);
        const existing=id?await repo.getWorkspaceRecord(ctx.tenantId,id):undefined;
        const record=existing??await completion.create(groupId,kind,{id,title:String(p.title??''),summary:p.summary?String(p.summary):undefined,data:(p.data&&typeof p.data==='object'?p.data:{}) as Record<string,unknown>,tags:strArray(p.tags)});
        if(existing&&String(existing.data.completionKind??'')!==kind)throw Error('IDEMPOTENCY_CONFLICT');
        await markApplied();return json({accepted:true,stored:true,record},200,cors);
      }
      if(item.type==='COMPLETION_TRANSITION_V1'){
        const p=item.payload,groupId=String(p.groupId??''),id=String(p.id??''),to=String(p.to??''),expectedVersion=finite(p.expectedVersion),patch=(p.patch&&typeof p.patch==='object'?p.patch:{}) as Record<string,unknown>;await requireGroup(groupId,true);
        const existing=await repo.getWorkspaceRecord(ctx.tenantId,id);if(!existing)throw Error('COMPLETION_RECORD_NOT_FOUND');
        const version=Number(existing.data.completionVersion??0),state=String(existing.data.completionState??'');
        const record=version>expectedVersion&&state===to?existing:await completion.transition(groupId,id,to,{expectedVersion,patch,reason:p.reason?String(p.reason):undefined});
        await markApplied();return json({accepted:true,stored:true,record},200,cors);
      }
      if(item.type==='TONTINE_SERVE_V1'){
        const p=item.payload,groupId=String(p.groupId??''),shareId=String(p.shareId??''),key=String(p.idempotencyKey??item.idempotencyKey),amount=finite(p.amount);await requireGroup(groupId,true);
        let share=(await completion.list(groupId,'TONTINE_SHARE')).find(x=>x.id===shareId);if(!share)throw Error('TONTINE_SHARE_NOT_FOUND');
        let entry=await repo.findLedgerEntryByIdempotency(ctx.tenantId,groupId,key);
        if(!entry){
          if(String(share.data.completionState)!=='SCHEDULED'&&String(share.data.completionState)!=='SERVED')throw Error('TONTINE_SHARE_NOT_SCHEDULED');
          entry=await ledger.recordCashMovement({tenantId:ctx.tenantId,groupId,amount,currency:String(p.currency??'XAF'),direction:'out',counterAccountCode:'MEMBER_FUNDS_LIABILITY',counterAccountType:'liability',descriptionCode:'LEDGER_TONTINE_BENEFIT',sourceType:'tontine_share',sourceId:share.id,meetingId:p.meetingId?String(p.meetingId):undefined,idempotencyKey:key,kind:'tontine_benefit'});
        }
        if(String(share.data.completionState)!=='SERVED')share=await completion.markTontineShareServed(groupId,share.id,entry.id,finite(p.expectedVersion));
        await markApplied();return json({accepted:true,stored:true,entry,share},200,cors);
      }
      if(item.type==='LOAN_DISBURSE_V1'){
        const p=item.payload,groupId=String(p.groupId??''),loanId=String(p.loanId??''),key=String(p.idempotencyKey??item.idempotencyKey),amount=finite(p.amount);await requireGroup(groupId,true);
        let loan=(await completion.list(groupId,'LOAN')).find(x=>x.id===loanId);if(!loan)throw Error('LOAN_NOT_FOUND');
        const applied=await disburseApprovedLoan({groupId,loan,principal:amount,expectedVersion:finite(p.expectedVersion),meetingId:p.meetingId?String(p.meetingId):undefined,rubricId:p.rubricId?String(p.rubricId):undefined,idempotencyKey:key});
        await markApplied();return json({accepted:true,stored:true,...applied},200,cors);
      }
      if(item.type==='LOAN_REPAY_V1'){
        const p=item.payload,groupId=String(p.groupId??''),loanId=String(p.loanId??''),key=String(p.idempotencyKey??item.idempotencyKey),principalPaid=finite(p.principalAmount,0),interestPaid=finite(p.interestAmount,0),meetingId=p.meetingId?String(p.meetingId):undefined;await requireGroup(groupId,true);
        let loan=(await completion.list(groupId,'LOAN')).find(x=>x.id===loanId);if(!loan)throw Error('LOAN_NOT_FOUND');
        let entry=await repo.findLedgerEntryByIdempotency(ctx.tenantId,groupId,key);
        if(!entry){
          if(!['DISBURSED','REPAYING'].includes(String(loan.data.completionState)))throw Error('LOAN_NOT_REPAYABLE');
          const outstanding=finite(loan.data.outstandingPrincipal),unpaid=finite(loan.data.unpaidInterest,0),periodInterest=finite(p.periodInterest,0),interestDue=unpaid+periodInterest;
          if(principalPaid>outstanding)throw Error('INVALID_LOAN_REPAYMENT');if(interestPaid>interestDue)throw Error('LOAN_INTEREST_PAYMENT_EXCEEDS_DUE');
          entry=await ledger.recordLoanRepayment({tenantId:ctx.tenantId,groupId,principalAmount:principalPaid,interestAmount:interestPaid,currency:String(loan.data.currency??'XAF'),sourceId:loan.id,meetingId,idempotencyKey:key});
          const remaining=outstanding-principalPaid,unpaidAfter=interestDue-interestPaid,target=remaining===0&&unpaidAfter===0?'CLOSED':'REPAYING';
          const accrued=Array.isArray(p.accruedMeetingIds)?p.accruedMeetingIds.map(String):jsonStringArray(loan.data.accruedMeetingIdsJson);
          loan=await completion.transition(groupId,loan.id,target,{expectedVersion:finite(p.expectedVersion),patch:{outstandingPrincipal:remaining,unpaidInterest:unpaidAfter,lastRepaymentLedgerEntryId:entry.id,accruedMeetingIdsJson:JSON.stringify(accrued)}});
          if(meetingId){
            const periodId='loan_period_'+encodeURIComponent(loan.id+'|'+meetingId),old=await repo.getWorkspaceRecord(ctx.tenantId,periodId),stamp=entry.createdAt,rate=finite(p.rateBasisPointsPerPeriod??loan.data.rateBasisPointsPerPeriod,0),nextInterest=Math.round(remaining*rate/10000);
            await repo.saveWorkspaceRecord({id:periodId,tenantId:ctx.tenantId,groupId,moduleId:'FINANCE.LOAN_PERIOD',title:'Période de prêt',summary:'Évolution de prêt rejouée depuis le journal offline.',status:'DONE',tags:['loan-period','loan:'+loan.id,'meeting:'+meetingId,'offline-replay'],data:{loanId:loan.id,membershipId:String(loan.data.borrowerMembershipId??''),meetingId,principalBefore:Number(old?.data.principalBefore??(remaining+principalPaid)),interestOpening:Number(old?.data.interestOpening??Math.max(0,unpaidAfter+interestPaid-finite(p.periodInterest,0))),interestNew:Number(old?.data.interestNew??0)+finite(p.periodInterest,0),paymentAmount:Number(old?.data.paymentAmount??0)+principalPaid+interestPaid,principalPaid:Number(old?.data.principalPaid??0)+principalPaid,interestPaid:Number(old?.data.interestPaid??0)+interestPaid,principalAfter:remaining,interestAfter:unpaidAfter,totalDebtAfter:remaining+unpaidAfter,nextInterestProjected:nextInterest,nextTotalDueProjected:remaining+unpaidAfter+nextInterest,priority:String(loan.data.paymentPriority??'CAPITAL_FIRST'),rateBasisPointsPerPeriod:rate},createdBy:old?.createdBy??ctx.actorId,createdAt:old?.createdAt??stamp,updatedAt:stamp});
          }
        }
        await markApplied();return json({accepted:true,stored:true,entry,loan},200,cors);
      }
      if(item.type==='RUBRIC_CREATE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const rubric=await rubrics.createRubric({id:String(p.id??''),tenantId:ctx.tenantId,groupId,name:String(p.name??''),aliases:strArray(p.aliases),purpose:p.purpose?String(p.purpose):undefined,facets:p.facets as any,source:String(p.source??'GROUP_CUSTOM') as any,operatingModel:p.operatingModel as any,policies:p.policies as any,activityPlan:p.activityPlan as any});
        await markApplied();
        return json({accepted:true,stored:true,rubric},200,cors);
      }
      if(item.type==='RUBRIC_RESTORE_V1'){
        const p=item.payload,groupId=String(p.groupId??''),rubricId=String(p.rubricId??'');await requireGroup(groupId,true);
        const trash=await listTrash(groupId),itemToRestore=trash.find(x=>String(x.data?.kind??'')==='RUBRIC'&&String(x.data?.entityId??'')===rubricId&&x.status==='ACTIVE');
        if(itemToRestore)await restoreTrash(groupId,itemToRestore.id);
        else{const rubric=await repo.getRubricDefinition(ctx.tenantId,groupId,rubricId);if(!rubric)throw Error('RUBRIC_NOT_FOUND');if(rubric.status==='ARCHIVED')await repo.saveRubricDefinition({...rubric,status:'ACTIVE',version:Number(rubric.version??0)+1,updatedAt:new Date().toISOString()});}
        await markApplied();return json({accepted:true,stored:true,rubricId},200,cors);
      }
      if(item.type==='RUBRIC_ACTIVITY_PLAN_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const rubric=await rubrics.updateActivityPlan(ctx.tenantId,groupId,String(p.rubricId??''),p.plan);
        await markApplied();
        return json({accepted:true,stored:true,rubric},200,cors);
      }
      if(item.type==='GROUP_POLICY_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const group=await foundation.updateGroupOperatingPolicy(ctx.tenantId,groupId,p.policy as GroupOperatingPolicy,item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,group},200,cors);
      }
      if(item.type==='MEETING_OPEN_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const meeting=await meetings.openMeeting(ctx.tenantId,groupId,{id:String(p.id??''),title:p.title?String(p.title):undefined,scheduledAt:p.scheduledAt?String(p.scheduledAt):undefined,location:p.location?String(p.location):undefined,theme:p.theme?String(p.theme):undefined,dressCode:p.dressCode?String(p.dressCode):undefined},item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,meeting},200,cors);
      }
      if(item.type==='MEETING_CONTEXT_V1'){
        const p=item.payload,groupId=String(p.groupId??''),meetingId=String(p.meetingId??'');await requireGroup(groupId,true);
        const before=await repo.getMeeting(ctx.tenantId,groupId,meetingId);
        const meeting=await meetings.updateMeetingContext(ctx.tenantId,groupId,meetingId,{scheduledAt:p.scheduledAt===undefined?undefined:p.scheduledAt===null?null:String(p.scheduledAt),location:p.location===undefined?undefined:p.location===null?null:String(p.location),theme:p.theme===undefined?undefined:p.theme===null?null:String(p.theme),dressCode:p.dressCode===undefined?undefined:p.dressCode===null?null:String(p.dressCode)},item.idempotencyKey);
        if(before?.status==='closed'){
          await notifications.publish(groupId,{title:'Séance clôturée modifiée hors ligne',message:'Une modification préparée hors ligne vient d’être synchronisée sur une séance clôturée.',channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:'CRITICAL'});
          await publishLive(groupId,'MEETING_UPDATE','closed-meeting-context-sync:'+item.idempotencyKey,{meetingId,kind:'CLOSED_MEETING_CONTEXT_CHANGED',meetingClosed:true});
        }
        await markApplied();
        return json({accepted:true,stored:true,meeting},200,cors);
      }
      if(item.type==='MEETING_ATTENDANCE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const record=await meetings.recordAttendance(ctx.tenantId,groupId,String(p.meetingId??''),{membershipId:String(p.membershipId??''),attendance:String(p.attendance??'') as any,note:p.note?String(p.note):undefined},item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,record},200,cors);
      }
      if(item.type==='MEETING_BENEFIT_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const record=await meetings.declareBenefit(ctx.tenantId,groupId,String(p.meetingId??''),{membershipId:String(p.membershipId??''),rubricId:p.rubricId?String(p.rubricId):undefined,amount:finite(p.amount),currency:String(p.currency??'XAF'),note:p.note?String(p.note):undefined},item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,record},200,cors);
      }
      if(item.type==='MEETING_BENEFIT_EVIDENCE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,false);
        const evidence=await meetings.recordBenefitEvidence(ctx.tenantId,groupId,String(p.meetingId??''),{declarationId:String(p.declarationId??''),membershipId:String(p.membershipId??''),rubricId:p.rubricId?String(p.rubricId):undefined,amount:p.amount===undefined?undefined:finite(p.amount),currency:p.currency?String(p.currency):undefined,method:String(p.method??'') as any,artifactKey:p.artifactKey?String(p.artifactKey):undefined,fingerprint:p.fingerprint?String(p.fingerprint):undefined,note:p.note?String(p.note):undefined,idempotencyKey:String(p.idempotencyKey??item.idempotencyKey)},item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,evidence},200,cors);
      }
      if(item.type==='RUBRIC_MODEL_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const rubric=await rubrics.updateOperatingModel({tenantId:ctx.tenantId,groupId,rubricId:String(p.rubricId??''),model:p.model as RubricOperatingModel});
        await markApplied();
        return json({accepted:true,stored:true,rubric},200,cors);
      }
      if(item.type==='RUBRIC_POLICIES_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const result=await updateRubricPoliciesGoverned(groupId,String(p.rubricId??''),p.policies as RubricPolicies),rubric=result.updated;
        await markApplied();
        return json({accepted:true,stored:true,rubric,loanPolicyRevision:result.revision??null,affectedLoanIds:result.affectedLoanIds},200,cors);
      }
      if(item.type==='MEETING_CLOSE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const meeting=await meetings.closeMeeting(ctx.tenantId,groupId,String(p.meetingId??''),item.idempotencyKey);
        const debtUpdate=await accrueLoanInterestAfterMeetingClose(groupId,meeting);
        await markApplied();
        return json({accepted:true,stored:true,meeting,debtUpdate},200,cors);
      }
      if(item.type==='CASHBOX_RECONCILE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const record=await foundation.reconcileCashbox({tenantId:ctx.tenantId,groupId,meetingId:p.meetingId?String(p.meetingId):undefined,openingCash:finite(p.openingCash),cashIn:finite(p.cashIn),cashOut:finite(p.cashOut),countedClosing:finite(p.countedClosing),currency:String(p.currency??'XAF')},item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,record},200,cors);
      }
      if(item.type==='MEETING_DISTRIBUTION_V1'){
        const p=item.payload,groupId=String(p.groupId??''),meetingId=String(p.meetingId??'');await requireGroup(groupId,true);
        if(!(await repo.getMeeting(ctx.tenantId,groupId,meetingId)))throw Error('MEETING_NOT_FOUND');
        const unresolved=(await new MeetingLiveConsensusService(repo,kernel).list(groupId,meetingId)).some(x=>['COLLECTING','DIVERGENT'].includes(x.state));
        if(unresolved)throw Error('CONSENSUS_UNRESOLVED');
        const at=new Date().toISOString(),id='meeting_distribution_'+markerHash;
        await repo.saveWorkspaceRecord({id,tenantId:ctx.tenantId,groupId,moduleId:'MEETING.DISTRIBUTION',title:'Diffusion membres prête',summary:'Projection de séance validée et rendue disponible aux membres.',status:'DONE',tags:['meeting-distribution','meeting:'+meetingId],data:{meetingId,kind:'MEMBER_DISTRIBUTION_READY',confirmedAt:String(p.confirmedAt??at)},createdBy:ctx.actorId,createdAt:at,updatedAt:at});
        await publishLive(groupId,'MEETING_UPDATE',item.idempotencyKey,{meetingId,kind:'MEMBER_DISTRIBUTION_READY',at});
        const envelopes=await memberEnvelopes.buildAll(groupId,meetingId);
        for(const envelope of envelopes){
          await publishLive(groupId,'MEMBER_ENVELOPE_READY','member-envelope:'+meetingId+':'+envelope.membershipId,{meetingId,membershipId:envelope.membershipId,fingerprint:envelope.fingerprint,expiresAt:envelope.expiresAt,scope:'MEMBER_ONLY'},envelope.recipientUserId);
        }
        await markApplied();
        return json({accepted:true,stored:true,recordId:id,envelopeCount:envelopes.length},200,cors);
      }
      if(item.type==='FINANCIAL_NOTICE_CONFIRM_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,false);
        const notice=await memberControl.confirm(groupId,String(p.noticeId??''));
        await markApplied();
        return json({accepted:true,stored:true,notice},200,cors);
      }
      if(item.type==='FINANCIAL_NOTICE_RESERVE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,false);
        const result=await memberControl.reserve(groupId,String(p.noticeId??''),String(p.reason??''));
        await markApplied();
        return json({accepted:true,stored:true,...result},200,cors);
      }
      if(item.type==='FINANCIAL_NOTICE_OFFICER_REVIEW_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const notice=await memberControl.officerReview(groupId,String(p.noticeId??''),String(p.note??''));
        await markApplied();
        return json({accepted:true,stored:true,notice},200,cors);
      }
      if(item.type==='FINANCIAL_NOTICE_MEMBER_REVIEW_V1'){
        const p=item.payload,groupId=String(p.groupId??''),decision=String(p.decision??'');
        await requireGroup(groupId,false);
        if(decision!=='APPROVE_AFTER_REVIEW'&&decision!=='MAINTAIN_RESERVE')throw Error('INVALID_MEMBER_REVIEW_DECISION');
        const notice=await memberControl.memberReview(groupId,String(p.noticeId??''),decision,String(p.note??''));
        await markApplied();
        return json({accepted:true,stored:true,notice},200,cors);
      }
      if(item.type==='FINANCIAL_CELL_REVIEW_V1'){
        const p=item.payload,groupId=String(p.groupId??'');
        const reviewed=await applyFinancialReview({groupId,meetingId:String(p.meetingId??''),
          membershipId:String(p.membershipId??''),rubricId:String(p.rubricId??''),
          decision:String(p.decision??''),reason:String(p.reason??''),
          amount:finite(p.amount,-1),cellVersion:finite(p.cellVersion,-1)});
        await markApplied();return json({accepted:true,stored:true,...reviewed},200,cors);
      }
      if(item.type==='FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'){
        const p=item.payload;
        const outcome=await applyRecordedCellV2({
          groupId:String(p.groupId??''),meetingId:String(p.meetingId??''),
          membershipId:String(p.membershipId??''),rubricId:String(p.rubricId??''),
          targetAmount:Number(p.targetAmount??0),baselineValue:Number(p.baselineValue??0),
          baselineVersion:Number(p.baselineVersion??0),recordedAtClient:String(p.recordedAtClient??''),
          clockAnchorId:String(p.clockAnchorId??''),deviceId:String(p.deviceId??''),
          deviceSequence:Number(p.deviceSequence??0),commandId:item.idempotencyKey,
          reason:String(p.reason??'')
        });
        if(outcome.status!=='CLOCK_REVIEW')await markApplied();
        return json(outcome,200,cors);
      }
      if(item.type==='FINANCIAL_CELL_CORRECTION_PROPOSAL_V1'){
        const p=item.payload,groupId=String(p.groupId??''),meetingId=String(p.meetingId??''),membershipId=String(p.membershipId??''),rubricId=String(p.rubricId??''),targetAmount=finite(p.targetAmount),reason=String(p.reason??'');
        await requireGroup(groupId,true);
        const state=await financialCellState(groupId,meetingId,membershipId,rubricId),baselineValue=finite(p.baselineValue,state.current),baselineVersion=finite(p.baselineVersion,state.cellVersion),managers=await managerUserIds(groupId),meeting=await repo.getMeeting(ctx.tenantId,groupId,meetingId);
        if(!meeting||meeting.status==='cancelled')throw Error('MEETING_NOT_FOUND');
        // A replay after an ambiguous network response is already satisfied when
        // the canonical value equals the requested target.
        if(state.current===targetAmount){await markApplied();return json({accepted:true,stored:true,status:'NO_CHANGE'},200,cors);}
        const staleBaseline=baselineValue!==state.current||baselineVersion!==state.cellVersion;
        // Two devices editing the same offline baseline must never silently overwrite
        // one another. The first synchronized value stays canonical; every divergent
        // stale command becomes an explicit conflict for human reconciliation.
        if(staleBaseline)throw Error('CELL_VALUE_CONFLICT');
        const result=await applyFinancialCellTarget({groupId,meetingId,membershipId,rubricId,targetAmount,expectedCurrentAmount:baselineValue,expectedCellVersion:baselineVersion,reason:reason||'Correction saisie hors ligne puis synchronisée',idempotencyKey:item.idempotencyKey});
        await markApplied();return json({accepted:true,stored:true,...result},200,cors);
      }

      throw new Error('OUTBOX_TYPE_UNSUPPORTED');
    }


    const pollsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/polls$/);
    if(pollsRoute&&request.method==='GET')return json(await governanceVotes.list(pollsRoute[1]!),200,cors);
    if(pollsRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await governanceVotes.open(pollsRoute[1]!,{title:String(body.title??''),question:String(body.question??''),options:strArray(body.options),mode:String(body.mode??'NAMED') as any,kind:String(body.kind??'YES_NO') as any,quorumBps:finite(body.quorumBps,5000),majority:String(body.majority??'SIMPLE') as any,qualifiedThresholdBps:body.qualifiedThresholdBps===undefined?undefined:finite(body.qualifiedThresholdBps),closesAt:body.closesAt?String(body.closesAt):undefined}),201,cors);
    }
    const ballotRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/polls\/([^/]+)\/ballots$/);
    if(ballotRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await governanceVotes.cast(ballotRoute[1]!,ballotRoute[2]!,strArray(body.selections)),201,cors);}
    const tallyRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/polls\/([^/]+)\/tally$/);
    if(tallyRoute&&request.method==='GET')return json(await governanceVotes.tally(tallyRoute[1]!,tallyRoute[2]!),200,cors);
    const closePollRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/polls\/([^/]+)\/close$/);
    if(closePollRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await governanceVotes.close(closePollRoute[1]!,closePollRoute[2]!,String(body.state??'CLOSED')==='CANCELLED'?'CANCELLED':'CLOSED'),200,cors);}

    if(url.pathname==='/api/v1/notifications/preferences'&&request.method==='GET')return json(await notifications.preferences(),200,cors);
    if(url.pathname==='/api/v1/notifications/preferences'&&request.method==='PUT'){const body=await readJson<any>(request);return json(await notifications.savePreferences(body),200,cors);}
    const groupNotifications=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/notifications$/);
    if(groupNotifications&&request.method==='GET')return json(await notifications.inbox(groupNotifications[1]!),200,cors);
    if(groupNotifications&&request.method==='POST'){const body=await readJson<any>(request);return json(await notifications.publish(groupNotifications[1]!,body),201,cors);}
    const readNotification=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/notifications\/([^/]+)\/read$/);
    if(readNotification&&request.method==='POST')return json(await notifications.markRead(readNotification[1]!,readNotification[2]!),200,cors);

    const myMembershipRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/me$/);
    if(myMembershipRoute&&request.method==='GET'){
      const groupId=myMembershipRoute[1]!,group=await requireGroup(groupId),membership=(await repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
      return json({membership:membership??null,isManager:group.createdBy===ctx.actorId||Boolean(membership?.roles.some(r=>['founder','manager','admin','president','treasurer','auditor'].includes(r))),group:{id:group.id,name:group.name,kind:group.kind}},200,cors);
    }

    const operationalSheetRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/operational-sheet$/);
    if(operationalSheetRoute&&request.method==='GET')return json(await operationalCockpit.memberSheet(operationalSheetRoute[1]!,operationalSheetRoute[2]!),200,cors);

    const recapGlobalRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/recap\/global$/);
    if(recapGlobalRoute&&request.method==='GET')return json(await operationalCockpit.globalRecap(recapGlobalRoute[1]!),200,cors);
    const recapLayoutRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/recap\/layout$/);
    if(recapLayoutRoute&&request.method==='GET')return json(await operationalCockpit.getRecapLayout(recapLayoutRoute[1]!),200,cors);
    if(recapLayoutRoute&&request.method==='PUT'){const body=await readJson<any>(request);return json(await operationalCockpit.saveRecapLayout(recapLayoutRoute[1]!,{columns:Array.isArray(body.columns)?body.columns:[],expectedVersion:body.expectedVersion===undefined?undefined:Number(body.expectedVersion)}),200,cors);}
    const recapOverrideRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/recap\/overrides$/);
    if(recapOverrideRoute&&request.method==='PUT'){const body=await readJson<any>(request);return json(await operationalCockpit.setRecapOverride(recapOverrideRoute[1]!,{membershipId:String(body.membershipId??''),columnId:String(body.columnId??''),amount:body.amount===null?null:Number(body.amount),reason:String(body.reason??'')}),200,cors);}

    const loanSimulationRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/loans\/simulate$/);
    if(loanSimulationRoute&&request.method==='POST'){
      await requireGroup(loanSimulationRoute[1]!);
      const body=await readJson<any>(request);
      const input={principal:Number(body.principal),periods:Number(body.periods),ratePercentPerPeriod:Number(body.ratePercentPerPeriod),priority:String(body.priority??'CAPITAL_FIRST') as any,interestBasis:String(body.interestBasis??'OUTSTANDING') as any,payments:Array.isArray(body.payments)?body.payments.map(Number):[],openingInterestDue:Number(body.openingInterestDue??0)};
      const rows=simulatePeriodicLoan(input);
      return json({rows,summary:summarizePeriodicLoan(input,rows),simulationOnly:true,noInterestOnInterest:true,interestBasis:'OUTSTANDING_PRINCIPAL'},200,cors);
    }

    const memberHistoryRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/financial-history$/);
    if(memberHistoryRoute&&request.method==='GET'){
      const groupId=memberHistoryRoute[1]!,membershipId=memberHistoryRoute[2]!,group=await requireGroup(groupId),target=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!target)throw new Error('MEMBERSHIP_NOT_FOUND');
      const viewer=(await repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active'),manager=group.createdBy===ctx.actorId||Boolean(viewer?.roles.some(r=>['founder','manager','admin','president','treasurer','auditor'].includes(r)));
      if(!manager&&target.userId!==ctx.actorId)throw new Error('FORBIDDEN_SCOPE');
      const limit=Math.min(100,Math.max(10,Math.trunc(finite(url.searchParams.get('limit'),50)))),cursorRaw=url.searchParams.get('cursor')??'';
      let cursor:{at:string;id:string}|undefined;if(cursorRaw){try{const x=JSON.parse(decodeURIComponent(cursorRaw));if(Array.isArray(x)&&x.length===2)cursor={at:String(x[0]),id:String(x[1])};}catch{throw new Error('INVALID_CURSOR');}}
      const statement=await ledger.memberStatement(ctx.tenantId,groupId,membershipId,url.searchParams.get('asOf')??undefined);
      const sorted=statement.receipts.slice().sort((a,b)=>String(b.receivedAt).localeCompare(String(a.receivedAt))||String(b.id??b.ledgerEntryId).localeCompare(String(a.id??a.ledgerEntryId)));
      const filtered=cursor?sorted.filter(r=>String(r.receivedAt)<cursor!.at||(String(r.receivedAt)===cursor!.at&&String(r.id??r.ledgerEntryId)<cursor!.id)):sorted;
      const page=filtered.slice(0,limit),last=page.at(-1),nextCursor=filtered.length>page.length&&last?encodeURIComponent(JSON.stringify([last.receivedAt,String(last.id??last.ledgerEntryId)])):null;
      return json({items:page,nextCursor,hasMore:Boolean(nextCursor),pageSize:page.length,total:sorted.length,groupId,membershipId},200,cors);
    }

    const notebookRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/notebook$/);
    if(notebookRoute&&request.method==='GET'){
      const groupId=notebookRoute[1]!,membershipId=notebookRoute[2]!,group=await requireGroup(groupId),target=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!target)throw new Error('MEMBERSHIP_NOT_FOUND');
      const viewer=(await repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active'),manager=group.createdBy===ctx.actorId||Boolean(viewer?.roles.some(r=>['founder','manager','admin','president','treasurer'].includes(r)));
      if(!manager&&target.userId!==ctx.actorId)throw new Error('FORBIDDEN_SCOPE');
      const [statement,obligations,attendance,participations,profile,allWorkspace]=await Promise.all([
        ledger.memberStatement(ctx.tenantId,groupId,membershipId,url.searchParams.get('asOf')??undefined),
        repo.listObligations(ctx.tenantId),repo.listWorkspaceRecords(ctx.tenantId,'MEETING.ATTENDANCE',groupId),repo.listWorkspaceRecords(ctx.tenantId,'MEMBERSHIP.RUBRIC_PARTICIPATION',groupId),repo.getWorkspaceRecord(ctx.tenantId,'member_profile_'+membershipId),repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)
      ]);
      const ownObligations=obligations.filter(x=>x.groupId===groupId&&x.assigneeId===membershipId),ownAttendance=attendance.filter(x=>String(x.data.membershipId??'')===membershipId),ownParticipation=participations.filter(x=>String(x.data.membershipId??'')===membershipId),assigned=allWorkspace.filter(x=>String(x.data.assigneeMembershipId??x.data.membershipId??'')===membershipId&&!['MEETING.ATTENDANCE','MEMBERSHIP.RUBRIC_PARTICIPATION'].includes(x.moduleId));
      const timeline=[...statement.receipts.map(x=>({at:x.receivedAt,kind:'RECEIPT',title:String(x.netAmount)+' '+String(x.amount.currency)})),...ownObligations.map(x=>({at:x.dueAt??'',kind:'OBLIGATION',title:x.title})),...ownAttendance.map(x=>({at:x.createdAt,kind:'ATTENDANCE',title:String(x.data.attendance??x.title)})),...assigned.map(x=>({at:x.updatedAt,kind:x.moduleId,title:x.title}))].filter(x=>x.at).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
      return json({group:{id:group.id,name:group.name},membership:target,profile:profile?.data??null,statement,obligations:ownObligations,attendance:ownAttendance,participations:ownParticipation,assignedRecords:assigned,timeline},200,cors);
    }

    return json({error:'NOT_FOUND'},404,cors);
  } catch(error){const message=error instanceof Error?error.message:'UNKNOWN_ERROR';const status=['FORBIDDEN_SCOPE','FOUNDER_TEAM_ONLY'].includes(message)?403:message==='VOICE_TRANSCRIPTION_UNAVAILABLE'?503:['IDEMPOTENCY_CONFLICT','CELL_VALUE_CONFLICT','CELL_VERSION_CONFLICT'].includes(message)?409:message.endsWith('_NOT_FOUND')?404:400;return json({error:message,requestId:ctx.requestId},status,cors);}
};

export const handleRequest=createApiHandler(defaultRepo);
export interface AssetsFetcherLike { fetch(request: Request): Promise<Response> }
export interface WorkerEnv { AUTH_LIVE_SIGNING_SECRET?:string; RELEASE_COMMIT_SHA?: string; DB?: D1DatabaseLike; ASSETS?: AssetsFetcherLike; ARTIFACTS?: ArtifactStoreLike; AI?: WorkersAILike; GROUP_LIVE_HUB?: DurableObjectNamespaceLike; PREMIUM_LIVE_LEDGER?: string; DATA_USE_PROFILE?: string; COLLECTIVE_LEARNING_PEPPER?: string; IDENTITY_MATCH_PEPPER?: string; FOUNDER_TEAM_ACTORS?: string }
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
  const founderLearning=env.COLLECTIVE_LEARNING_PEPPER?new FounderLearningStore(env.DB,env.COLLECTIVE_LEARNING_PEPPER):undefined;
  const founderControl=env.DB?new FounderControlStore(env.DB):undefined;
  const communityRealtime=env.DB?new CommunityRealtimeStore(env.DB):undefined;
  const identityPepper=env.IDENTITY_MATCH_PEPPER??env.COLLECTIVE_LEARNING_PEPPER;
  const identityProof=identityPepper?new IdentityProofService(env.DB,identityPepper):undefined;
  const founderTeamActors=new Set((env.FOUNDER_TEAM_ACTORS??'').split(',').map(x=>x.trim()).filter(Boolean));
  const dataUseDefaultMode:DataUseDefaultMode=env.DATA_USE_PROFILE==='PRIVACY_FIRST'?'PRIVACY_FIRST':'BETA_OPEN';
  const commercialPreferences=new CommercialPreferenceService(env.DB,dataUseDefaultMode==='BETA_OPEN');
  const interestCommunities=new InterestCommunityService(env.DB);
  const ecoPulse=new EcoPulseService(env.DB);
  const pairingKernel=new PlatformKernel();
  const groupPairing=new GroupPairingService(env.DB,repository,pairingKernel);
  return authenticatedApi(repository,env.DB,async authenticatedRequest=>{
    const h=authenticatedRequest.headers;
    pairingKernel.context.set({actorId:h.get('x-actor-id')??'unknown',tenantId:h.get('x-tenant-id')??'unknown',activeGroupId:h.get('x-active-group-id')||undefined,groupRoles:(h.get('x-group-roles')??'').split(',').filter(Boolean),mandateIds:[],mandateGrants:[],deviceId:h.get('x-device-id')??'device_web',sessionId:h.get('x-session-id')??'server-authenticated',locale:h.get('accept-language')?.toLowerCase().startsWith('en')?'en':'fr',timezone:h.get('x-timezone')??'Africa/Douala',connectivity:'online',requestId:h.get('x-request-id')??crypto.randomUUID()});
    return createApiHandler(repository,{artifacts:env.ARTIFACTS,documentAI:env.AI,liveNamespace:env.GROUP_LIVE_HUB,premiumLive:env.PREMIUM_LIVE_LEDGER==='true',referralBudgets:new D1ReferralBudgetStore(env.DB!),founderLearning,founderControl,communityRealtime,founderTeamActors,commercialPreferences,groupPairing,interestCommunities,ecoPulse,identityProof,dataUseDefaultMode,governanceSecret:env.COLLECTIVE_LEARNING_PEPPER??env.IDENTITY_MATCH_PEPPER,releaseCommitSha:env.RELEASE_COMMIT_SHA})(authenticatedRequest);
  },env.AUTH_LIVE_SIGNING_SECRET??env.COLLECTIVE_LEARNING_PEPPER??env.IDENTITY_MATCH_PEPPER)(request);
},
async scheduled(controller:{scheduledTime?:number},env:WorkerEnv,executionCtx?:{waitUntil?(promise:Promise<unknown>):void}){
  if(!env.DB)return;
  const maintenance=new TrashLifecycleMaintenance(new D1PlatformRepository(env.DB),env.ARTIFACTS);
  const task=maintenance.run(new Date(controller.scheduledTime??Date.now()));
  if(executionCtx?.waitUntil)executionCtx.waitUntil(task);else await task;
}
};
export {defaultRepo as repo};
