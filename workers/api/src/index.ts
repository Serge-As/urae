import { PlatformKernel } from '../../../packages/platform-kernel/src/index.js';
import { D1PlatformRepository, InMemoryPlatformRepository, type D1DatabaseLike, type PlatformRepository } from '../../../packages/repositories/src/index.js';
import { FoundationService, LedgerService, MeetingService, starterGroupOperatingPolicy } from '../../../packages/domain/src/index.js';
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
import { MeetingLiveConsensusService } from '../../../packages/meeting-live-consensus/src/index.js';
import { GroupIdentityService } from '../../../packages/group-identity/src/index.js';
import { ConciergeLearningService, type DataUsePurpose, type LearningCategory, type DataUseDefaultMode } from '../../../packages/concierge-learning/src/index.js';
import { MarketService } from '../../../packages/market/src/index.js';
import { CommunityService } from '../../../packages/community/src/index.js';
import { CommunityRealtimeStore } from '../../../packages/community-realtime/src/index.js';
import { FounderLearningStore } from '../../../packages/founder-observatory/src/index.js';
import { FounderControlStore, type CapabilityHealth } from '../../../packages/founder-control/src/index.js';
import { CommercialPreferenceService, preferenceCookie, clearPreferenceCookie, readPreferenceCookie } from '../../../packages/commercial-preferences/src/index.js';
import { MiscRubricService } from '../../../packages/misc-rubrics/src/index.js';
import { allocateSavingsYield, splitInterestPool, simulateWorkbookYieldPipeline, allocateCapitalAtWorkYield, allocateCapitalTimeYield, allocateAttributedProductiveYield, SAVINGS_YIELD_POLICY_PRESETS } from '../../../packages/savings-yield/src/index.js';
import { buildFinancialRecap, buildSessionRecap, buildClosingCarryover } from '../../../packages/recap-engine/src/index.js';
import { AdManagerService, AD_PLACEMENT_CATALOG, HOUSE_AD_CATALOG, selectAdDelivery } from '../../../packages/ad-manager/src/index.js';
import { diagnoseGroup } from '../../../packages/group-doctor/src/index.js';
import { prepareMeetingAutopilot } from '../../../packages/meeting-autopilot/src/index.js';
import { EconomicIntelligenceService } from '../../../packages/economic-intelligence/src/index.js';
import { ExternalProgramsService, type ExternalProgramKind, type ExternalProgramState, type AggregateDataAccess } from '../../../packages/external-programs/src/index.js';
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
import { authenticatedApi } from './authenticated.js';
export { GroupLiveHub } from './group-live-hub.js';

interface DurableObjectStubLike { fetch(request:Request):Promise<Response>; }
interface DurableObjectNamespaceLike { idFromName(name:string):unknown; get(id:unknown):DurableObjectStubLike; }
interface MarkdownConversionResultLike { id?:string; name:string; mimetype?:string; mimeType?:string; format:'markdown'|'text'|'error'; tokens?:number; data?:string; error?:string; }
interface WorkersAILike {
  toMarkdown(input:{name:string;blob:Blob}|Array<{name:string;blob:Blob}>,options?:Record<string,unknown>):Promise<MarkdownConversionResultLike|MarkdownConversionResultLike[]|{result:MarkdownConversionResultLike|MarkdownConversionResultLike[]}>;
  run?(model:string,input:Record<string,unknown>,options?:Record<string,unknown>):Promise<unknown>;
}

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
  const groupIdentity=new GroupIdentityService(repo,kernel);
  const conciergeLearning=new ConciergeLearningService(repo,kernel,dataUseDefaultMode);
  const miscRubrics=new MiscRubricService(repo,kernel,ledger);
  const adManager=new AdManagerService(repo,kernel,documentAI);
  const economicIntelligence=new EconomicIntelligenceService(repo,kernel);
  const externalPrograms=new ExternalProgramsService(repo,kernel);
  const operationalCockpit=new OperationalCockpitService(repo,kernel,ledger);
  const businessStudio=new BusinessStudioService(repo,kernel);
  const tenantId=request.headers.get('x-tenant-id')??'tenant_demo'; const actorId=request.headers.get('x-actor-id')??'user_founder';
  const groupRoles=(request.headers.get('x-group-roles')??'founder,manager').split(',').map(x=>x.trim()).filter(Boolean);
  kernel.context.set({actorId,tenantId,activeGroupId:request.headers.get('x-active-group-id')??undefined,groupRoles,mandateIds:[],deviceId:request.headers.get('x-device-id')??'device_web_demo',sessionId:request.headers.get('x-session-id')??'session_demo',locale:request.headers.get('accept-language')?.toLowerCase().startsWith('en')?'en':'fr',timezone:request.headers.get('x-timezone')??'Africa/Douala',connectivity:'online',requestId:request.headers.get('x-request-id')??makeId('req')});
  return {kernel,foundation,ledger,meetings,discovery,membershipGateway,rubrics,completion,explainability,documents,receivables,treasury,riskFinance,market,community,imports,artifactStore,memberControl,groupIdentity,conciergeLearning,miscRubrics,adManager,economicIntelligence,externalPrograms,operationalCockpit,businessStudio};
};

const inboxFor = async (repo:PlatformRepository,tenantId:string,actorId:string) => {
  const obligations=(await repo.listObligations(tenantId,actorId)).filter(x=>x.status==='open'||x.status==='overdue').map(x=>({id:x.id,kind:'obligation',title:x.title,priority:x.priority,status:x.status,groupId:x.groupId}));
  const cases=(await repo.listCases(tenantId,actorId)).filter(x=>x.status!=='CLOSED').map(x=>({id:x.id,kind:'case',title:x.summary,priority:'normal',status:x.status,groupId:x.groupId}));
  return [...obligations,...cases];
};

export const createApiHandler = (repo:PlatformRepository = defaultRepo,options:{artifacts?:ArtifactStoreLike;documentAI?:WorkersAILike;liveNamespace?:DurableObjectNamespaceLike;premiumLive?:boolean;referralBudgets?:ReferralBudgetStore;founderLearning?:FounderLearningStore;founderControl?:FounderControlStore;communityRealtime?:CommunityRealtimeStore;founderTeamActors?:Set<string>;commercialPreferences?:CommercialPreferenceService;groupPairing?:GroupPairingService;interestCommunities?:InterestCommunityService;ecoPulse?:EcoPulseService;identityProof?:IdentityProofService;dataUseDefaultMode?:DataUseDefaultMode;governanceSecret?:string}={}) => async (request:Request):Promise<Response> => {
  const url=new URL(request.url); const cors=corsHeaders(request);
  if(request.method==='OPTIONS'){
    const allowed=Boolean((cors as Record<string,string>)['access-control-allow-origin']);
    return new Response(null,{status:allowed?204:403,headers:{...baseSecurityHeaders,...cors,'access-control-allow-methods':'GET,POST,PUT,OPTIONS','access-control-allow-headers':'content-type,x-tenant-id,x-actor-id,x-group-roles,x-active-group-id,x-device-id,x-session-id,x-request-id,x-timezone'}});
  }
  const {kernel,foundation,ledger,meetings,discovery,membershipGateway,rubrics,completion,explainability,documents,receivables,treasury,riskFinance,market,community,imports,artifactStore,memberControl,groupIdentity,conciergeLearning,miscRubrics,adManager,economicIntelligence,externalPrograms,operationalCockpit,businessStudio}=createRequestScope(request,repo,options.artifacts,options.dataUseDefaultMode??'BETA_OPEN',options.documentAI); const ctx=kernel.context.get();
  const governanceVotes=new GovernanceVoteService(repo,kernel,options.governanceSecret??'eco-system-nonproduction-governance-secret');
  const notifications=new NotificationService(repo,kernel);
  const growthReferral=new GrowthReferralService(repo,kernel,options.referralBudgets??defaultReferralBudgets);
  if(options.premiumLive)kernel.features.set('premium_live_ledger',true);
  const isFounderTeamActor=async()=>Boolean(options.founderTeamActors?.has(ctx.actorId))||Boolean(options.founderControl&&await options.founderControl.isPlatformOwner(ctx.actorId));
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
  const applyFinancialCellTarget=async(input:{groupId:string;meetingId:string;membershipId:string;rubricId:string;targetAmount:number;expectedCurrentAmount?:number;expectedCellVersion?:number;reason:string;idempotencyKey:string;consensusId?:string;consensusVersion?:number})=>{
    const group=await requireGroup(input.groupId,true),meeting=await repo.getMeeting(ctx.tenantId,input.groupId,input.meetingId);if(!meeting||meeting.status==='cancelled')throw Error('MEETING_NOT_FOUND');
    if(!Number.isSafeInteger(input.targetAmount)||input.targetAmount<0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    const beforeAll=await ledger.receiptPositions(ctx.tenantId,input.groupId),beforeSituation=beforeAll.filter(x=>x.membershipId===input.membershipId).reduce((n,x)=>n+x.netAmount,0);
    const state=await financialCellState(input.groupId,input.meetingId,input.membershipId,input.rubricId);
    if(state.current===input.targetAmount)return{status:'NO_CHANGE',current:state.current,target:input.targetAmount};
    const reason=input.reason.trim()||'Correction de cellule financière';
    const correction=await ledger.replaceCashContributionCell({
      tenantId:ctx.tenantId,groupId:input.groupId,meetingId:input.meetingId,membershipId:input.membershipId,rubricId:input.rubricId,
      targetAmount:input.targetAmount,expectedCurrentAmount:input.expectedCurrentAmount??state.current,expectedCellVersion:input.expectedCellVersion??state.cellVersion,currency:'XAF',
      reason,idempotencyKey:input.idempotencyKey
    },ctx.requestId);
    const receipt=correction.receipt,evidenceEntry=correction.evidenceEntry;
    if(!evidenceEntry)throw Error('FINANCIAL_CORRECTION_NOT_APPLIED');
    const afterAll=await ledger.receiptPositions(ctx.tenantId,input.groupId),newSituation=afterAll.filter(x=>x.membershipId===input.membershipId).reduce((n,x)=>n+x.netAmount,0),targetMember=await repo.getMembership(ctx.tenantId,input.groupId,input.membershipId);
    const notice=await memberControl.create({groupId:input.groupId,membershipId:input.membershipId,entry:evidenceEntry,operationType:'FINANCIAL_CELL_CORRECTION',amount:input.targetAmount,currency:'XAF',rubricId:input.rubricId,meetingId:input.meetingId,previousSituation:beforeSituation,newSituation,previousAmount:state.current,newAmount:input.targetAmount,correctionReason:reason,selfBenefit:targetMember?.userId===ctx.actorId,requiresIndependentReview:false});
    const correctionActor=await actorLabel(),correctionMember=await memberLabel(input.groupId,input.membershipId),correctionRubric=await rubricLabel(input.groupId,input.rubricId),meetingWhen=new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(meeting.scheduledAt??meeting.openedAt)),changeWhen=new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date()),action={view:'operations',anchor:'twoSheetWorkspace',meetingId:input.meetingId,membershipId:input.membershipId,rubricId:input.rubricId,label:'Voir la cellule modifiée'};
    await notifications.publish(input.groupId,{title:meeting.status==='closed'?'Séance clôturée modifiée':'Donnée financière corrigée',message:`${correctionMember} · ${correctionRubric} · ${meetingWhen} : ${state.current} → ${input.targetAmount} F CFA. Auteur : ${correctionActor}. Modification : ${changeWhen}. Motif : ${reason}`,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:meeting.status==='closed'?'CRITICAL':'HIGH',action});
    await notifications.publish(input.groupId,{title:meeting.status==='closed'?'Votre compte a été corrigé après clôture':'Votre compte a été corrigé',message:`${correctionRubric} · ${meetingWhen} : ${state.current} → ${input.targetAmount} F CFA. Auteur : ${correctionActor}. Modification : ${changeWhen}. Motif : ${reason}. Vous pouvez valider ou émettre une réserve.`,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[input.membershipId],priority:meeting.status==='closed'?'CRITICAL':'HIGH',action});
    if(targetMember)await publishLive(input.groupId,'FINANCIAL_NOTICE','financial-cell-correction:'+evidenceEntry.id,{noticeId:notice.id,ledgerEntryId:evidenceEntry.id,operationType:'FINANCIAL_CELL_CORRECTION',amount:input.targetAmount,currency:'XAF',previousAmount:state.current,newAmount:input.targetAmount,meetingClosed:meeting.status==='closed',alertLevel:meeting.status==='closed'?'closed':'correction'},targetMember.userId);
    await publishLive(input.groupId,'MEETING_UPDATE','financial-cell-managers:'+evidenceEntry.id,{meetingId:input.meetingId,kind:'FINANCIAL_CELL_CORRECTION',membershipId:input.membershipId,rubricId:input.rubricId,previousAmount:state.current,newAmount:input.targetAmount,meetingClosed:meeting.status==='closed'});
    return{status:'APPLIED',current:state.current,target:input.targetAmount,previousAmount:state.current,newAmount:input.targetAmount,cellVersion:correction.cellVersion,receipt,notice,groupId:group.id};
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
    const financialCellBase=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/financial-cells$/);
    const financialCellApply=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/meetings\/([^/]+)\/financial-cells\/([^/]+)\/apply$/);
    if(financialCellBase&&request.method==='POST'){
      const groupId=financialCellBase[1]!,meetingId=financialCellBase[2]!;await requireGroup(groupId,true);
      const body=await readJson<Record<string,unknown>>(request),membershipId=String(body.membershipId??''),rubricId=String(body.rubricId??''),targetAmount=finite(body.targetAmount),expectedCurrentAmount=body.expectedCurrentAmount===undefined?undefined:finite(body.expectedCurrentAmount),expectedCellVersion=body.expectedCellVersion===undefined?undefined:finite(body.expectedCellVersion),reason=String(body.reason??'').trim();
      if(!membershipId||!rubricId)throw Error('FINANCIAL_CELL_REQUIRED');
      if(!Number.isSafeInteger(targetAmount)||targetAmount<0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
      const state=await financialCellState(groupId,meetingId,membershipId,rubricId),meeting=await repo.getMeeting(ctx.tenantId,groupId,meetingId);if(!meeting||meeting.status==='cancelled')throw Error('MEETING_NOT_FOUND');
      if(state.current===targetAmount)return json({status:'NO_CHANGE',current:state.current,target:targetAmount},200,cors);
      if(expectedCurrentAmount!==undefined&&expectedCurrentAmount!==state.current)throw Error('CELL_VALUE_CONFLICT');
      if(expectedCellVersion!==undefined&&expectedCellVersion!==state.cellVersion)throw Error('CELL_VERSION_CONFLICT');
      const managers=await managerUserIds(groupId);
      const needsConsensus=meeting.status==='closed'||(state.current>0&&(managers.length>1||Boolean(state.baselineActorId&&state.baselineActorId!==ctx.actorId)));
      if(needsConsensus){
        const item=await new MeetingLiveConsensusService(repo,kernel).proposeAgainstBaseline({groupId,meetingId,cellKey:membershipId+':'+rubricId,value:targetAmount,baselineValue:state.current,baselineCellVersion:state.cellVersion,baselineActorId:state.baselineActorId,label:'Proposition de correction',membershipId,rubricId});
        const proposer=await actorLabel(),originalActor=state.baselineActorId?await actorLabelFor(state.baselineActorId):'auteur antérieur',mName=await memberLabel(groupId,membershipId),rName=await rubricLabel(groupId,rubricId),action={view:'operations',anchor:'twoSheetWorkspace',meetingId,membershipId,rubricId,label:'Voir et confronter la cellule'};
        const sessionWhen=new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(meeting.scheduledAt??meeting.openedAt)),proposalWhen=new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date());
        await notifications.publish(groupId,{title:'Donnée financière à confronter',message:`${mName} · ${rName} · séance ${sessionWhen} : ${proposer} propose ${state.current} → ${targetAmount} F CFA (saisie précédente : ${originalActor}). Proposition : ${proposalWhen}. Motif : ${reason||'non précisé'}. La valeur canonique reste inchangée avant décision du Bureau.`,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:'HIGH',action});
        await notifications.publish(groupId,{title:'Votre donnée est en cours de confrontation',message:`${proposer} propose de modifier ${rName} : ${state.current} → ${targetAmount} F CFA. Aucune valeur n’est encore remplacée tant que les gestionnaires n’ont pas décidé.`,channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[membershipId],priority:'HIGH',action});
        await publishLive(groupId,'CONSENSUS_REQUIRED','financial-cell-proposal:'+item.id+':'+item.version,{meetingId,cellKey:item.cellKey,state:item.state,version:item.version,baselineValue:state.current,proposedValue:targetAmount,membershipId,rubricId,proposedBy:ctx.actorId});
        return json({status:'CONSENSUS_REQUIRED',current:state.current,target:targetAmount,consensus:item},202,cors);
      }
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
    if(request.method==='GET'&&url.pathname==='/health') return json({ok:true,service:'tontine-api',version:'1.4.0-master-2.3.4-closure',now:new Date().toISOString(),realMoneyEnabled:kernel.features.enabled('financial-real-money'),manualCashLedgerEnabled:true,premiumLiveEnabled:options.premiumLive===true&&Boolean(options.liveNamespace),founderControlBound:Boolean(options.founderControl),communityRealtimeBound:Boolean(options.communityRealtime),artifactStorageBound:true,artifactStorageMode:options.artifacts?'R2':'D1_FALLBACK',contextScope:'request'},200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/growth/referrals')return json(await growthReferral.dashboard(),200,cors);
    if(request.method==='POST'&&url.pathname==='/api/v1/growth/referral-campaigns'){const body=await readJson<any>(request);return json(await growthReferral.createCampaign(body),201,cors);}
    const referralCampaign=url.pathname.match(/^\/api\/v1\/growth\/referral-campaigns\/([^/]+)\/state$/);
    if(referralCampaign&&request.method==='POST'){const body=await readJson<any>(request);return json(await growthReferral.setCampaignState(referralCampaign[1]!,String(body.state??'ACTIVE') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/growth/referral-shares'){const body=await readJson<any>(request);return json(await growthReferral.createShare(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/growth/referral-landings'){const body=await readJson<any>(request);return json(await growthReferral.registerLanding(String(body.code??'')),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/growth/referral-conversions'){const body=await readJson<any>(request);return json(await growthReferral.registerConversion(body),201,cors);}
    const referralReward=url.pathname.match(/^\/api\/v1\/growth\/referral-campaigns\/([^/]+)\/rewards\/([^/]+)\/approve$/);
    if(referralReward&&request.method==='POST')return json(await growthReferral.approveReward(referralReward[1]!,referralReward[2]!),200,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/business/summary')return json(await businessStudio.summary(),200,cors);
    if(request.method==='GET'&&url.pathname==='/api/v1/business/records')return json({items:await businessStudio.records()},200,cors);
    if(request.method==='PUT'&&url.pathname==='/api/v1/business/workspace'){const body=await readJson<any>(request);return json(await businessStudio.configure(body),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/mandates'){const body=await readJson<any>(request);return json(await businessStudio.createMandate(body),201,cors);}
    const businessMandate=url.pathname.match(/^\/api\/v1\/business\/mandates\/([^/]+)\/(activate|end)$/);
    if(businessMandate&&request.method==='POST'){const body=await readJson<any>(request);return json(businessMandate[2]==='activate'?await businessStudio.activateMandate(businessMandate[1]!):await businessStudio.endMandate(businessMandate[1]!,String(body.reason??'')),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/clients'){const body=await readJson<any>(request);return json(await businessStudio.createClient(body),201,cors);}
    const businessClient=url.pathname.match(/^\/api\/v1\/business\/clients\/([^/]+)\/state$/);
    if(businessClient&&request.method==='POST'){const body=await readJson<any>(request);return json(await businessStudio.setClientState(businessClient[1]!,String(body.state??'PROSPECT') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/quotes'){const body=await readJson<any>(request);return json(await businessStudio.createQuote(body),201,cors);}
    const businessQuote=url.pathname.match(/^\/api\/v1\/business\/quotes\/([^/]+)\/decision$/);
    if(businessQuote&&request.method==='POST'){const body=await readJson<any>(request);return json(await businessStudio.quoteDecision(businessQuote[1]!,String(body.state??'SENT') as any),200,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/contracts'){const body=await readJson<any>(request);return json(await businessStudio.createContract(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/invoices'){const body=await readJson<any>(request);return json(await businessStudio.issueInvoice(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/payments'){const body=await readJson<any>(request);return json(await businessStudio.recordPayment(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/expenses'){const body=await readJson<any>(request);return json(await businessStudio.recordExpense(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/time'){const body=await readJson<any>(request);return json(await businessStudio.recordTime(body),201,cors);}
    if(request.method==='POST'&&url.pathname==='/api/v1/business/scenarios'){const body=await readJson<any>(request);return json(await businessStudio.scenario(body),201,cors);}

    if(request.method==='GET'&&url.pathname==='/api/v1/kernel') return json({services:['context','policy','workflow','events','audit','obligations','evidence','reconciliation','cases','inbox','notifications','configuration','features','data-governance','compatibility','resource-governor'],features:{groupLaunch:kernel.features.enabled('group-launch-studio'),meetingSync:kernel.features.enabled('meeting-sync-core'),realMoney:kernel.features.enabled('financial-real-money'),manualCashLedger:true}},200,cors);

    if(request.method==='GET'&&url.pathname==='/api/v1/product/capabilities'){
      return json({version:'1.4.0-master-2.3.4-closure',count:PRODUCT_CAPABILITY_COUNT,capabilities:PRODUCT_MODULES,readiness:buildProductReadinessReport(PRODUCT_MODULES)},200,cors);
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
      const groupId=rubricPoliciesRoute[1]!,rubricId=rubricPoliciesRoute[2]!,body=await readJson<RubricPolicies>(request),updated=await rubrics.updatePolicies({tenantId:ctx.tenantId,groupId,rubricId,policies:body});
      await notifyGovernanceChange(groupId,{title:'Politiques de rubrique modifiées',message:`Politiques de « ${updated.name} » modifiées.`,action:{view:'operations',anchor:'rubricsManagementPanel',rubricId,entityKind:'RUBRIC',entityId:rubricId,label:'Voir la rubrique'}});
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
      return json({...base,totalNetContributions,receipts:enriched,debtPrincipal,debtInterest,otherDebt,totalDebt},200,cors);
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
      const list=await repo.listMemberships(ctx.tenantId,group.id); const joined=[];
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
      const activeLoans=(await completion.list(groupId,'LOAN')).filter(x=>['DISBURSED','REPAYING'].includes(String(x.data.completionState))&&finite(x.data.outstandingPrincipal,0)>0);
      for(const loan of activeLoans){
        let accruedMeetingIds:string[]=[];try{accruedMeetingIds=JSON.parse(String(loan.data.accruedMeetingIdsJson??'[]'));if(!Array.isArray(accruedMeetingIds))accruedMeetingIds=[];}catch{accruedMeetingIds=[];}
        if(accruedMeetingIds.includes(meetingId))continue;
        const principal=finite(loan.data.outstandingPrincipal,0),interestOpening=finite(loan.data.unpaidInterest,0),perYear=Math.max(1,finite(loan.data.installmentsPerYear,12)),rate=finite(loan.data.rateBasisPointsPerPeriod,Math.round(finite(loan.data.annualRateBasisPoints,0)/perYear)),interestNew=Math.round(principal*rate/10000),interestAfter=interestOpening+interestNew;
        accruedMeetingIds.push(meetingId);
        await completion.transition(groupId,loan.id,'REPAYING',{expectedVersion:finite(loan.data.completionVersion),patch:{unpaidInterest:interestAfter,accruedMeetingIdsJson:JSON.stringify(accruedMeetingIds),lastAccruedMeetingId:meetingId,lastAccruedInterest:interestNew}});
        const periodId='loan_period_'+encodeURIComponent(loan.id+'|'+meetingId),stamp=new Date().toISOString(),nextInterest=Math.round(principal*rate/10000);
        await repo.saveWorkspaceRecord({id:periodId,tenantId:ctx.tenantId,groupId,moduleId:'FINANCE.LOAN_PERIOD',title:'Période de prêt · '+closed.title,summary:'Intérêt mensuel exigible calculé sur le capital restant, sans intérêt sur intérêt.',status:'DONE',tags:['loan-period','loan:'+loan.id,'meeting:'+meetingId],data:{loanId:loan.id,membershipId:String(loan.data.borrowerMembershipId??''),meetingId,principalBefore:principal,interestOpening,interestNew,paymentAmount:0,principalPaid:0,interestPaid:0,principalAfter:principal,interestAfter,totalDebtAfter:principal+interestAfter,nextInterestProjected:nextInterest,nextTotalDueProjected:principal+interestAfter+nextInterest,priority:String(loan.data.paymentPriority??'CAPITAL_FIRST'),rateBasisPointsPerPeriod:rate},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp});
      }
      return json(closed,200,cors);
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
      const receipt=await ledger.recordCashContribution({tenantId:ctx.tenantId,groupId:contributionRoute[1]!,membershipId:String(body.membershipId??''),amount:finite(body.amount),currency:String(body.currency??'XAF'),meetingId:body.meetingId?String(body.meetingId):undefined,rubricId:body.rubricId?String(body.rubricId):undefined,lateReason:body.lateReason?String(body.lateReason):undefined,approverIds:strArray(body.approverIds),idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('idem'))});
      const entry=await repo.getLedgerEntry(ctx.tenantId,contributionRoute[1]!,receipt.ledgerEntryId);
      if(entry)await dispatchContributionProjection(contributionRoute[1]!,receipt,entry);
      // The financial transaction is authoritative once D1 has committed it.
      // A temporary Live failure must never turn a committed contribution into an ambiguous HTTP failure.
      return json(receipt,201,cors);
    }

    const retryProjectionRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/live\/retry-pending$/);
    if(retryProjectionRoute&&request.method==='POST'){
      const groupId=retryProjectionRoute[1]!;await requireGroup(groupId,true);
      const pending=(await repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.LIVE_PROJECTION',groupId)).filter(r=>r.status==='ACTIVE');
      const receipts=await repo.listContributionReceipts(ctx.tenantId,groupId);let retried=0,confirmed=0;
      for(const record of pending){
        const entryId=String(record.data.entryId??''),entry=entryId?await repo.getLedgerEntry(ctx.tenantId,groupId,entryId):undefined;
        const receipt=receipts.find(x=>x.ledgerEntryId===entryId);
        if(!entry||!receipt)continue;retried++;if(await dispatchContributionProjection(groupId,receipt,entry))confirmed++;
      }
      return json({retried,confirmed,pending:Math.max(0,pending.length-confirmed)},200,cors);
    }

    const savingsYieldSource=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/savings-yield\/source-data$/);
    if(savingsYieldSource&&request.method==='GET'){
      const groupId=savingsYieldSource[1]!;await requireGroup(groupId,true);
      const [rubricRows,meetingRows,positions,accounts,entries,memberships]=await Promise.all([
        repo.listRubricDefinitions(ctx.tenantId,groupId),repo.listMeetings(ctx.tenantId,groupId),ledger.receiptPositions(ctx.tenantId,groupId),
        repo.listLedgerAccounts(ctx.tenantId,groupId),repo.listLedgerEntries(ctx.tenantId,groupId),repo.listMemberships(ctx.tenantId,groupId)
      ]);
      const savingsRubrics=rubricRows.filter(r=>r.status==='ACTIVE'&&(String(r.activityPlan?.kind??'').toUpperCase()==='SAVINGS'||/[ée]pargne|saving/i.test(r.name)));
      const savingsIds=new Set(savingsRubrics.map(r=>r.id));
      const orderedMeetings=meetingRows.slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt)));
      const sessionByMeeting=new Map(orderedMeetings.map((m,i)=>[m.id,i+1]));
      const periodKeys=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const rubricById=new Map(savingsRubrics.map(r=>[r.id,r]));
      const deposits=positions.filter(p=>p.rubricId&&savingsIds.has(p.rubricId)&&p.netAmount>0).map(p=>{
        const rubric=rubricById.get(p.rubricId!)!,session=p.meetingId?(sessionByMeeting.get(p.meetingId)??1):1;
        const fund=/scolaire|school/i.test(rubric.name)?'SCHOOL':'CLASSIC';
        return{id:p.id,memberId:p.membershipId,amount:p.netAmount,session,fund,periodKey:periodKeys[(session-1)%12],rubricId:p.rubricId,meetingId:p.meetingId??null,receivedAt:p.receivedAt};
      });
      const memberRows=[];for(const m of memberships){const u=await repo.getUser(m.userId);memberRows.push({id:m.id,displayName:u?.displayName??m.userId,status:m.status});}
      const accountById=new Map(accounts.map(a=>[a.id,a]));
      const interestByAccount:Record<string,number>={};
      for(const entry of entries)for(const line of entry.lines){const account=accountById.get(line.accountId);if(account&&/INTEREST.*INCOME|INTEREST_INCOME/i.test(account.code)){interestByAccount[account.code]=(interestByAccount[account.code]??0)+(line.credit-line.debit);}}
      const recoveredInterest=Object.values(interestByAccount).reduce((n,x)=>n+x,0);
      const classicPrincipal=deposits.filter(d=>d.fund==='CLASSIC').reduce((n,d)=>n+d.amount,0),schoolPrincipal=deposits.filter(d=>d.fund==='SCHOOL').reduce((n,d)=>n+d.amount,0);
      return json({generatedAt:new Date().toISOString(),source:'CANONICAL_LEDGER_AND_RECEIPTS',members:memberRows,rubrics:savingsRubrics.map(r=>({id:r.id,name:r.name})),meetings:orderedMeetings.map((m,i)=>({id:m.id,title:m.title,session:i+1,scheduledAt:m.scheduledAt??m.openedAt})),deposits,totals:{classicPrincipal,schoolPrincipal,totalPrincipal:classicPrincipal+schoolPrincipal,recoveredInterest},interestByAccount,warnings:recoveredInterest===0?['NO_REALIZED_INTEREST_FOUND']:[]},200,cors);
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
      const state=await options.communityRealtime.toggleReaction({messageId,userId:ctx.actorId,reaction:String(body.reaction??'')});
      await publishLive(groupId,'COMMUNITY_EVENT','forum-reaction:'+messageId+':'+ctx.actorId+':'+String(body.reaction??'')+':'+(state.active?'on':'off'),{messageId,event:'REACTION_CHANGED'});
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
      return json(await options.founderControl.transition(decodeURIComponent(controlTransition[1]!),String(body.status??''),String(body.note??'')),200,cors);
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
      return json({version:'1.4.0-master-2.3.4-closure',workflows:COMPLETION_WORKFLOWS},200,cors);
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
    if(stockRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await market.createStock(stockRoute[1]!,{sku:String(body.sku??''),name:String(body.name??''),quantity:finite(body.quantity),unit:body.unit?String(body.unit):undefined,unitPrice:body.unitPrice===undefined?undefined:finite(body.unitPrice),description:body.description?String(body.description):undefined,published:Boolean(body.published)}),201,cors);}
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
      if(String(loan.data.completionState)!=='APPROVED')throw new Error('LOAN_NOT_APPROVED');
      const principal=finite(body.amount??loan.data.principal);
      const entry=await ledger.recordCashMovement({
        tenantId:ctx.tenantId,groupId:loanDisburse[1]!,amount:principal,currency:String(loan.data.currency??'XAF'),
        direction:'out',counterAccountCode:'LOAN_RECEIVABLE',counterAccountType:'asset',
        descriptionCode:'LEDGER_LOAN_DISBURSEMENT',sourceType:'loan',sourceId:loan.id,
        meetingId:body.meetingId?String(body.meetingId):undefined,
        idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('loan_disbursement')),kind:'loan_disbursement'
      });
      const updatedLoan=await completion.transition(loanDisburse[1]!,loan.id,'DISBURSED',{
        expectedVersion:finite(body.expectedVersion),patch:{ledgerEntryId:entry.id,outstandingPrincipal:principal,unpaidInterest:0,accruedMeetingIdsJson:'[]',disbursedAt:new Date().toISOString()}
      });
      const rubricId=body.rubricId?String(body.rubricId):String(loan.data.rubricId??'');
      if(rubricId&&body.meetingId){
        const eventId='sheet_loan_event_'+entry.id,meetingId=String(body.meetingId),existing=await repo.getWorkspaceRecord(ctx.tenantId,eventId);
        if(!existing)await repo.saveWorkspaceRecord({id:eventId,tenantId:ctx.tenantId,groupId:loanDisburse[1]!,moduleId:'FINANCE.SHEET_EVENT',title:'Prêt décaissé',summary:'Projection de feuille liée à l’écriture canonique du prêt.',status:'DONE',tags:['sheet-event','loan-disbursement','ledger:'+entry.id],data:{membershipId:String(loan.data.borrowerMembershipId??''),meetingId,rubricId,loanId:loan.id,ledgerEntryId:entry.id,amount:principal,direction:'OUT'},createdBy:ctx.actorId,createdAt:entry.createdAt,updatedAt:entry.createdAt});
      }
      return json({entry,loan:updatedLoan},201,cors);
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
      const outstanding=finite(loan.data.outstandingPrincipal),unpaidInterest=finite(loan.data.unpaidInterest,0),meetingId=body.meetingId?String(body.meetingId):undefined;
      const repaymentPeriodsPerYear=Math.max(1,finite(loan.data.installmentsPerYear,12)),rateBasisPointsPerPeriod=finite(body.rateBasisPointsPerPeriod??loan.data.rateBasisPointsPerPeriod??Math.round(finite(loan.data.annualRateBasisPoints,0)/repaymentPeriodsPerYear),0);
      let accruedMeetingIds:string[]=[];try{accruedMeetingIds=JSON.parse(String(loan.data.accruedMeetingIdsJson??'[]'));if(!Array.isArray(accruedMeetingIds))accruedMeetingIds=[];}catch{accruedMeetingIds=[];}
      let periodInterest=0,interestDue=unpaidInterest;
      if(meetingId&&!accruedMeetingIds.includes(meetingId)){
        periodInterest=Math.round(outstanding*rateBasisPointsPerPeriod/10000);interestDue+=periodInterest;accruedMeetingIds.push(meetingId);
      }
      const explicitAllocation=body.principalAmount!==undefined||body.interestAmount!==undefined;
      const allocation=explicitAllocation
        ?(()=>{const principalPaid=finite(body.principalAmount,0),interestPaid=finite(body.interestAmount,0);if(principalPaid>outstanding)throw new Error('INVALID_LOAN_REPAYMENT');if(interestPaid>interestDue)throw new Error('LOAN_INTEREST_PAYMENT_EXCEEDS_DUE');const remainingPrincipal=outstanding-principalPaid,unpaidInterestAfter=interestDue-interestPaid;return{principalPaid,interestPaid,remainingPrincipal,unpaidInterestAfter,totalDebtAfter:remainingPrincipal+unpaidInterestAfter,interestAccrued:periodInterest,totalInterestDue:interestDue,paymentAmount:principalPaid+interestPaid,priority:String(body.priority??loan.data.paymentPriority??'CAPITAL_FIRST')};})()
        :applyLoanPayment({principalOutstanding:outstanding,unpaidInterest:interestDue,paymentAmount:finite(body.paymentAmount),rateBasisPointsPerPeriod:meetingId?0:rateBasisPointsPerPeriod,priority:String(body.priority??loan.data.paymentPriority??'CAPITAL_FIRST') as any});
      if(allocation.principalPaid<0||allocation.principalPaid>outstanding)throw new Error('INVALID_LOAN_REPAYMENT');
      const entry=await ledger.recordLoanRepayment({
        tenantId:ctx.tenantId,groupId:loanRepay[1]!,principalAmount:allocation.principalPaid,interestAmount:allocation.interestPaid,
        currency:String(loan.data.currency??'XAF'),sourceId:loan.id,meetingId,
        idempotencyKey:String(body.idempotencyKey??request.headers.get('x-idempotency-key')??makeId('loan_repayment'))
      });
      const target=allocation.remainingPrincipal===0&&allocation.unpaidInterestAfter===0?'CLOSED':'REPAYING';
      const updatedLoan=await completion.transition(loanRepay[1]!,loan.id,target,{
        expectedVersion:finite(body.expectedVersion),patch:{outstandingPrincipal:allocation.remainingPrincipal,unpaidInterest:allocation.unpaidInterestAfter,lastRepaymentLedgerEntryId:entry.id,paymentPriority:allocation.priority,accruedMeetingIdsJson:JSON.stringify(accruedMeetingIds)}
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
      const markerHash=await sha256Bytes(new TextEncoder().encode(JSON.stringify([ctx.tenantId,ctx.actorId,item.idempotencyKey])).buffer);
      const markerId='outbox_applied_'+markerHash,existingMarker=await repo.getWorkspaceRecord(ctx.tenantId,markerId);
      if(existingMarker)return json({accepted:true,stored:true,replayed:true,type:item.type,idempotencyKey:item.idempotencyKey},200,cors);
      const markApplied=async()=>{const at=new Date().toISOString();await repo.saveWorkspaceRecord({id:markerId,tenantId:ctx.tenantId,groupId:(item.payload as any).groupId?String((item.payload as any).groupId):undefined,moduleId:'OFFLINE.OUTBOX_ACK',title:'Offline operation acknowledged',summary:undefined,status:'DONE',tags:['offline','idempotency','type:'+item.type],data:{type:item.type,idempotencyKey:item.idempotencyKey},createdBy:ctx.actorId,createdAt:at,updatedAt:at});};
      if(item.type==='CONTRIBUTION_CASH_RECORDED'){
        const p=item.payload;const groupId=String(p.groupId??'');
        const receipt=await ledger.recordCashContribution({tenantId:ctx.tenantId,groupId,membershipId:String(p.membershipId??''),amount:finite(p.amount),currency:String(p.currency??'XAF'),meetingId:p.meetingId?String(p.meetingId):undefined,rubricId:p.rubricId?String(p.rubricId):undefined,lateReason:p.lateReason?String(p.lateReason):undefined,approverIds:strArray(p.approverIds),idempotencyKey:item.idempotencyKey});
        const entry=await repo.getLedgerEntry(ctx.tenantId,groupId,receipt.ledgerEntryId);
        if(entry)await dispatchContributionProjection(groupId,receipt,entry);
        await markApplied();
        return json({accepted:true,receipt},200,cors);
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
      if(item.type==='RUBRIC_CREATE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const rubric=await rubrics.createRubric({id:String(p.id??''),tenantId:ctx.tenantId,groupId,name:String(p.name??''),aliases:strArray(p.aliases),purpose:p.purpose?String(p.purpose):undefined,facets:p.facets as any,source:String(p.source??'GROUP_CUSTOM') as any,operatingModel:p.operatingModel as any,policies:p.policies as any,activityPlan:p.activityPlan as any});
        await markApplied();
        return json({accepted:true,stored:true,rubric},200,cors);
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
        const rubric=await rubrics.updatePolicies({tenantId:ctx.tenantId,groupId,rubricId:String(p.rubricId??''),policies:p.policies as RubricPolicies});
        await markApplied();
        return json({accepted:true,stored:true,rubric},200,cors);
      }
      if(item.type==='MEETING_CLOSE_V1'){
        const p=item.payload,groupId=String(p.groupId??'');await requireGroup(groupId,true);
        const meeting=await meetings.closeMeeting(ctx.tenantId,groupId,String(p.meetingId??''),item.idempotencyKey);
        await markApplied();
        return json({accepted:true,stored:true,meeting},200,cors);
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
        await markApplied();
        return json({accepted:true,stored:true,recordId:id},200,cors);
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
      if(item.type==='FINANCIAL_CELL_CORRECTION_PROPOSAL_V1'){
        const p=item.payload,groupId=String(p.groupId??''),meetingId=String(p.meetingId??''),membershipId=String(p.membershipId??''),rubricId=String(p.rubricId??''),targetAmount=finite(p.targetAmount),reason=String(p.reason??'');
        await requireGroup(groupId,true);
        const state=await financialCellState(groupId,meetingId,membershipId,rubricId),baselineValue=finite(p.baselineValue,state.current),baselineVersion=finite(p.baselineVersion,state.cellVersion),managers=await managerUserIds(groupId),meeting=await repo.getMeeting(ctx.tenantId,groupId,meetingId);
        if(!meeting||meeting.status==='cancelled')throw Error('MEETING_NOT_FOUND');
        // A replay after an ambiguous network response is already satisfied when
        // the canonical value equals the requested target.
        if(state.current===targetAmount){await markApplied();return json({accepted:true,stored:true,status:'NO_CHANGE'},200,cors);}
        const staleBaseline=baselineValue!==state.current||baselineVersion!==state.cellVersion;
        const needsConsensus=staleBaseline||meeting.status==='closed'||(state.current>0&&managers.length>1);
        if(needsConsensus){
          const consensus=await new MeetingLiveConsensusService(repo,kernel).proposeAgainstBaseline({groupId,meetingId,cellKey:membershipId+':'+rubricId,value:targetAmount,baselineValue:state.current,baselineCellVersion:state.cellVersion,baselineActorId:state.baselineActorId,label:staleBaseline?'Conflit de base hors ligne':'Proposition reçue hors ligne',membershipId,rubricId});
          await notifications.publish(groupId,{title:staleBaseline?'Conflit de saisie hors ligne':'Correction offline à confronter',message:`La saisie hors ligne partait de ${baselineValue} F CFA (version ${baselineVersion}) ; la valeur canonique est maintenant ${state.current} F CFA (version ${state.cellVersion}) et la proposition demande ${targetAmount} F CFA. La valeur canonique reste inchangée avant décision du Bureau.`,channels:['IN_APP','WEB_PUSH'],audience:'MANAGERS',priority:staleBaseline?'CRITICAL':'HIGH'});
          await markApplied();return json({accepted:true,stored:true,status:'CONSENSUS_REQUIRED',staleBaseline,consensus},200,cors);
        }
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
  } catch(error){const message=error instanceof Error?error.message:'UNKNOWN_ERROR';const status=['FORBIDDEN_SCOPE','FOUNDER_TEAM_ONLY'].includes(message)?403:['IDEMPOTENCY_CONFLICT','CELL_VALUE_CONFLICT','CELL_VERSION_CONFLICT'].includes(message)?409:message.endsWith('_NOT_FOUND')?404:400;return json({error:message,requestId:ctx.requestId},status,cors);}
};

export const handleRequest=createApiHandler(defaultRepo);
export interface AssetsFetcherLike { fetch(request: Request): Promise<Response> }
export interface WorkerEnv { DB?: D1DatabaseLike; ASSETS?: AssetsFetcherLike; ARTIFACTS?: ArtifactStoreLike; AI?: WorkersAILike; GROUP_LIVE_HUB?: DurableObjectNamespaceLike; PREMIUM_LIVE_LEDGER?: string; DATA_USE_PROFILE?: string; COLLECTIVE_LEARNING_PEPPER?: string; IDENTITY_MATCH_PEPPER?: string; FOUNDER_TEAM_ACTORS?: string }
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
    pairingKernel.context.set({actorId:h.get('x-actor-id')??'unknown',tenantId:h.get('x-tenant-id')??'unknown',activeGroupId:h.get('x-active-group-id')||undefined,groupRoles:(h.get('x-group-roles')??'').split(',').filter(Boolean),mandateIds:[],deviceId:h.get('x-device-id')??'device_web',sessionId:h.get('x-session-id')??'server-authenticated',locale:h.get('accept-language')?.toLowerCase().startsWith('en')?'en':'fr',timezone:h.get('x-timezone')??'Africa/Douala',connectivity:'online',requestId:h.get('x-request-id')??crypto.randomUUID()});
    return createApiHandler(repository,{artifacts:env.ARTIFACTS,documentAI:env.AI,liveNamespace:env.GROUP_LIVE_HUB,premiumLive:env.PREMIUM_LIVE_LEDGER==='true',referralBudgets:new D1ReferralBudgetStore(env.DB),founderLearning,founderControl,communityRealtime,founderTeamActors,commercialPreferences,groupPairing,interestCommunities,ecoPulse,identityProof,dataUseDefaultMode,governanceSecret:env.COLLECTIVE_LEARNING_PEPPER??env.IDENTITY_MATCH_PEPPER})(authenticatedRequest);
  })(request);
}};
export {defaultRepo as repo};
