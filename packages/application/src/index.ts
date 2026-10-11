import type {LaunchRubricPlan, GroupProjectLaunchProfile} from '../../contracts/src/index.js';
import { PlatformKernel, type DeviceCapabilities } from '../../platform-kernel/src/index.js';
import { InMemoryPlatformRepository } from '../../repositories/src/index.js';
import { FoundationService, GroupLaunchSimulator, starterGroupOperatingPolicy } from '../../domain/src/index.js';
import { IndexedDbIdentityMigrationJournal, IndexedDbLocalAuthAdapter, IndexedDbOutboxAdapter, IndexedDbReadSnapshotAdapter, Outbox, type LocalAccountRecord } from '../../offline/src/index.js';
import { LoopbackRelayTransport, envelopeForOutbox } from '../../relay/src/index.js';
import { PRODUCT_MODULES } from '../../module-registry/src/index.js';
import { makeId, type CashboxReconciliationRecord, type CashboxSnapshot, type CaseRecord, type ContributionReceipt, type EvidenceRecord, type FeasibilityResult, type Group, type LedgerEntry, type LedgerSummary, type MeetingSession, type Membership, type MembershipView, type OutboxItem, type GroupOperatingPolicy, type RubricDefinition, type RubricOperatingModel, type RubricCyclePreview, type GroupDiscoveryMatch, type PublicGroupListing, type MembershipApplication, type WorkspaceRecord, type WorkspaceStatus } from '../../contracts/src/index.js';
import { COMPLETION_WORKFLOWS, suggestTontineSchedule as suggestTontineScheduleLocal, buildLoanSchedule, applyLoanPayment, type CompletionKind, type CompletionRecord, type TontineScheduleConstraint, type TontineScheduleResult, type LoanScheduleRow } from '../../completion/src/index.js';
import { starterRubricFacetsForName } from '../../rubrics/src/index.js';
import { simulatePeriodicLoan, summarizePeriodicLoan } from '../../loan-simulator/src/index.js';
import { allocateSavingsYield, splitInterestPool, simulateWorkbookYieldPipeline, allocateCapitalAtWorkYield, allocateCapitalTimeYield, allocateAttributedProductiveYield, eligibleSavingsDeposits, allocateBorrowerReward, SAVINGS_YIELD_POLICY_PRESETS } from '../../savings-yield/src/index.js';
import { buildFinancialRecap, buildSessionRecap, buildClosingCarryover } from '../../recap-engine/src/index.js';
import { diagnoseGroup } from '../../group-doctor/src/index.js';
import { IndexedDbSovereignStore, createEcoVault, openEcoVault, validateSovereignJournalEvents, type SovereignSnapshot } from '../../offline-sovereign/src/index.js';
import { buildExerciseClosingPlan, buildExerciseCarryForwardSeed, type ExerciseClosingInput, type ExerciseClosingPlan } from '../../exercise/src/index.js';
import { buildNumpadRubricCodes, parseEcoNumpad, type NumpadCode, type NumpadDraft } from '../../eco-numpad/src/index.js';
import { createRelayPairingMaterial, encryptMemberCapsule, decryptMemberCapsule, createBroadcastBundle, encodeBroadcastFrames, encodeTargetedBroadcastFrames, type EcoMemberCapsule, type EcoRelayPairingMaterial, type EcoBroadcastBundle } from '../../relay/src/broadcast.js';

export const KERNEL_SERVICE_IDS = [
  'kernelContext','kernelPolicy','kernelWorkflow','kernelEvents','kernelAudit','kernelObligations','kernelEvidence','kernelReconciliation','kernelInbox','kernelCases','kernelNotifications','kernelConfiguration','kernelFeatures','kernelGovernance','kernelCompatibility','kernelResourceGovernor','kernelOutbox','kernelRelay'
] as const;

// Pure in-memory facade kept for deterministic domain tests and isolated experimentation.
export class FoundationApplication {
  private readonly kernel = new PlatformKernel();
  private readonly repo = new InMemoryPlatformRepository();
  private readonly service = new FoundationService(this.repo, this.kernel);
  private readonly outbox = new Outbox();
  private readonly outboxStorage = new IndexedDbOutboxAdapter();
  private readonly relay = new LoopbackRelayTransport();
  private actorId = 'user_founder';
  private tenantId = 'tenant_demo';
  private activeGroupId?: string;
  private locale = 'fr';

  async bootstrap(input: { actorId?: string; tenantId?: string; displayName?: string; locale?: string } = {}): Promise<{ restoredOutbox: number }> {
    this.actorId=input.actorId??this.actorId; this.tenantId=input.tenantId??this.tenantId; this.locale=input.locale??this.locale; this.refreshContext();
    await this.service.ensureUser({id:this.actorId,displayName:input.displayName??'Demo Manager',locale:this.locale,createdAt:new Date().toISOString()});
    let restoredOutbox=0;
    if(IndexedDbOutboxAdapter.supported()) try{const persisted=await this.outboxStorage.load();this.outbox.restore(persisted.filter(x=>x.tenantId===this.tenantId&&x.actorId===this.actorId));restoredOutbox=this.outbox.list().length;}catch{}
    return {restoredOutbox};
  }
  setConnectivity(connectivity:'online'|'offline'|'degraded'):void{this.refreshContext(connectivity);}
  setLocale(locale:string):void{this.locale=locale;this.refreshContext();}
  private refreshContext(connectivity?:'online'|'offline'|'degraded'):void{const previous=(()=>{try{return this.kernel.context.get();}catch{return undefined;}})();this.kernel.context.set({actorId:this.actorId,tenantId:this.tenantId,activeGroupId:this.activeGroupId,groupRoles:this.activeGroupId?['founder','manager']:['founder'],mandateIds:[],deviceId:'web-demo',sessionId:'session-demo',locale:this.locale,timezone:'Africa/Douala',connectivity:connectivity??previous?.connectivity??'online',requestId:makeId('req')});}
  async simulateAndStoreProject(input:{name:string;kind:Group['kind'];governanceModel:Group['governanceModel'];memberCount:number;sessions:number;nominalContribution:number;managementFeePerContribution:number;estimatedExternalCostRate:number;fixedOperatingCostPerSession:number}):Promise<{projectId:string;result:FeasibilityResult}>{this.refreshContext();const p=await this.service.createProject({tenantId:this.tenantId,createdBy:this.actorId,name:input.name,kind:input.kind,governanceModel:input.governanceModel,memberCount:input.memberCount,sessions:input.sessions,nominalContribution:{currency:'XAF',amount:input.nominalContribution},managementFeePerContribution:{currency:'XAF',amount:input.managementFeePerContribution},estimatedExternalCostRate:input.estimatedExternalCostRate,fixedOperatingCostPerSession:{currency:'XAF',amount:input.fixedOperatingCostPerSession}});return{projectId:p.id,result:await this.service.simulateProject(this.tenantId,p.id)};}
  async createGroupFromProject(projectId:string):Promise<Group>{this.refreshContext();const g=await this.service.convertProjectToGroup(this.tenantId,projectId);this.activeGroupId=g.id;this.refreshContext();return g;}
  async addMember(displayName:string):Promise<Membership>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');this.refreshContext();return this.service.addMember(this.tenantId,this.activeGroupId,{id:makeId('user'),displayName,locale:this.locale,createdAt:new Date().toISOString()});}
  reconcileCashbox(input:{openingCash:number;cashIn:number;cashOut:number;countedClosing:number}):{snapshot:CashboxSnapshot;reconciliation:{status:string;variance:number}}{const snapshot=this.service.cashbox.close(input);const r=this.kernel.reconciliation.compare(snapshot.theoreticalClosing,snapshot.countedClosing);return{snapshot,reconciliation:{status:r.status,variance:r.variance}};}
  async queueDemoIntent(note='Local demo update'):Promise<OutboxItem>{const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type:'MEETING_NOTE_UPDATED',payload:{activeGroupId:this.activeGroupId,note},idempotencyKey:`demo-${this.activeGroupId??'none'}-${new Date().toISOString().slice(0,16)}`});await this.persistOutbox();return item;}
  async syncOutbox():Promise<OutboxItem[]>{const result=await this.outbox.sync(async item=>({ok:(await this.relay.send(envelopeForOutbox('web-demo',item))).accepted}));await this.persistOutbox();return result;}
  private async persistOutbox():Promise<void>{if(!IndexedDbOutboxAdapter.supported())return;try{await this.outboxStorage.save(this.outbox.list());}catch{}}
  outboxItems():OutboxItem[]{return this.outbox.list();}
  productModules(){return structuredClone(PRODUCT_MODULES);}
  kernelServices():readonly string[]{return KERNEL_SERVICE_IDS;}
  openSupportCase(summary:string):CaseRecord{const clean=summary.trim();if(!clean)throw new Error('CASE_SUMMARY_REQUIRED');return this.kernel.cases.open({tenantId:this.tenantId,groupId:this.activeGroupId,type:'GENERAL_SUPPORT',subjectType:this.activeGroupId?'group':'account',subjectId:this.activeGroupId??this.actorId,openedBy:this.actorId,summary:clean});}
  inboxItems(){return this.kernel.inbox.forUser(this.tenantId,this.actorId);}
  deviceCompatibility(capabilities:DeviceCapabilities){return{level:this.kernel.compatibility.classify(capabilities),capabilities:structuredClone(capabilities)};}
  safetyState(){return{realMoneyEnabled:this.kernel.features.enabled('financial-real-money'),manualCashLedgerEnabled:false,cloudAiBudgetEnabled:false,relayMediaEnabled:false};}
  async universe(){const groups=await this.repo.listGroups(this.tenantId);return{groups:groups.length,inbox:this.kernel.inbox.forUser(this.tenantId,this.actorId).length,pendingSync:this.outbox.list().filter(x=>x.status!=='CONFIRMED').length,audit:this.kernel.audit.list(this.tenantId).length};}
}

export interface ConnectedApplicationOptions { baseUrl?: string; actorId?: string; tenantId?: string; displayName?: string; locale?: string; }
export interface SessionAccount {id:string;tenantId:string;username:string;displayName:string;locale:string}

const clientLoanPolicySnapshot=(policy:any)=>({
  rateBasisPointsPerPeriod:Math.max(0,Number(policy?.rateBasisPointsPerPeriod??0)||0),
  paymentPriority:['INTEREST_FIRST','EXPLICIT_ALLOCATION'].includes(String(policy?.paymentPriority))?String(policy.paymentPriority):'CAPITAL_FIRST',
  interestTiming:['UPFRONT_DEDUCTED','UPFRONT_REQUIRED'].includes(String(policy?.interestTiming))?String(policy.interestTiming):'NEXT_SESSION_DUE',
  fundingMode:String(policy?.fundingMode)==='SAVINGS_REPAYMENTS_ONLY'?'SAVINGS_REPAYMENTS_ONLY':'AVAILABLE_GROUP_CASH',
  carryForwardUnusedFunds:policy?.carryForwardUnusedFunds!==false
});
const resolveClientLoanPolicy=(loan:any,policy:any,operationAtMs=Date.now())=>{
  const history=(Array.isArray(policy?.revisions)?policy.revisions:[]).filter((x:any)=>x&&typeof x==='object').slice().sort((a:any,b:any)=>(Date.parse(String(a.effectiveAt??''))||0)-(Date.parse(String(b.effectiveAt??''))||0)||String(a.id??'').localeCompare(String(b.id??'')));
  const fallback=history.length?clientLoanPolicySnapshot(history[0]?.before):clientLoanPolicySnapshot(policy),created=Date.parse(String(loan?.createdAt??loan?.data?.createdAt??loan?.updatedAt??''))||operationAtMs;
  const out:any=loan?.id?{...fallback,
    rateBasisPointsPerPeriod:Number(loan?.data?.rateBasisPointsPerPeriod??fallback.rateBasisPointsPerPeriod),
    paymentPriority:String(loan?.data?.paymentPriority??fallback.paymentPriority),
    interestTiming:String(loan?.data?.interestTiming??fallback.interestTiming),
    policyRevisionId:String(loan?.data?.policyRevisionId??''),
    policyRevisionEffectiveAt:String(loan?.data?.policyRevisionEffectiveAt??'')
  }:{...fallback,policyRevisionId:'',policyRevisionEffectiveAt:''};
  for(const revision of history){
    const effective=Date.parse(String(revision.effectiveAt??''));if(!Number.isFinite(effective)||effective>operationAtMs)continue;
    const scope=String(revision.scope??'NEW_LOANS_ONLY'),loanId=String(loan?.id??''),createdAfter=created>=effective,closedBeforeEffect=String(loan?.data?.completionState??'')==='CLOSED'&&(Date.parse(String(loan?.updatedAt??''))||0)>0&&(Date.parse(String(loan?.updatedAt??''))||0)<=effective;
    const selected=Array.isArray(revision.selectedLoanIds)&&revision.selectedLoanIds.map(String).includes(loanId),affected=Array.isArray(revision.affectedLoanIds)&&revision.affectedLoanIds.map(String).includes(loanId),legacyOpenAll=scope==='NEW_AND_ALL_OPEN_LOANS'&&!Array.isArray(revision.affectedLoanIds)&&!closedBeforeEffect;
    if(closedBeforeEffect||!(createdAfter||(scope==='NEW_AND_ALL_OPEN_LOANS'&&(affected||legacyOpenAll))||(scope==='NEW_AND_SELECTED_OPEN_LOANS'&&selected)))continue;
    const next=clientLoanPolicySnapshot(revision.after),disbursedAt=Date.parse(String(loan?.data?.disbursedAt??''))||0;
    if(disbursedAt&&disbursedAt<effective&&next.interestTiming!=='NEXT_SESSION_DUE')next.interestTiming=out.interestTiming;
    Object.assign(out,next,{policyRevisionId:String(revision.id??''),policyRevisionEffectiveAt:String(revision.effectiveAt??'')});
  }
  return out;
};

export class ConnectedApplication {
  private readonly kernel = new PlatformKernel();
  private readonly outbox = new Outbox();
  private readonly outboxStorage = new IndexedDbOutboxAdapter();
  private readonly readSnapshots = new IndexedDbReadSnapshotAdapter();
  private readonly localAuth = new IndexedDbLocalAuthAdapter();
  private readonly identityMigration = new IndexedDbIdentityMigrationJournal();
  private readonly sovereign = new IndexedDbSovereignStore();
  private usingOfflineSnapshot=false;
  private transportUnavailableUntil=0;
  private transportRecoveryWakeUsed=false;
  private serverBudgetBlockedUntil=0;
  private serverBudgetReason='';
  private serverBudgetWake?:ReturnType<typeof setTimeout>;
  private transportWake?:ReturnType<typeof setTimeout>;
  private actorId:string; private tenantId:string; private displayName:string; private locale:string; private activeGroupId?:string;
  private readonly baseUrl:string;
  private groupTenants=new Map<string,string>();
  private homeTenantId?:string;
  private financialClockAnchor?:{groupId:string;deviceId:string;token:string;anchorAtMs:number;monotonicAt:number;expiresAt:number};
  private financialClockLoading?:Promise<void>;
  private async warmFinancialClock(refresh=false):Promise<void>{
    const groupId=this.activeGroupId,deviceId=this.localDeviceId();
    // An explicit reconfirmation observed a newer canonical value. Await any
    // older warmup, then obtain an anchor issued after that observation.
    if(refresh&&this.financialClockLoading)await this.financialClockLoading;
    if(refresh)this.financialClockAnchor=undefined;
    if(!groupId||typeof navigator!=='undefined'&&navigator.onLine===false||this.serverBudgetBlocked())return;
    if(this.financialClockAnchor?.groupId===groupId&&
      this.financialClockAnchor.deviceId===deviceId&&Date.now()<this.financialClockAnchor.expiresAt)return;
    if(this.financialClockLoading){await this.financialClockLoading;if(this.financialClockAnchor?.groupId!==groupId)return this.warmFinancialClock();return;}
    this.financialClockLoading=(async()=>{
      try{
        const response=await this.request<{token:string;anchorAtMs:number;expiresAt:string;deviceId:string}>(
          '/api/v1/groups/'+encodeURIComponent(groupId)+'/financial-clock-anchor?deviceId='+encodeURIComponent(deviceId));
        if(this.activeGroupId!==groupId||!response?.token||response.deviceId!==deviceId)return;
        const perf=typeof performance!=='undefined'&&Number.isFinite(performance.now())?performance.now():0;
        if(perf>0)this.financialClockAnchor={groupId,deviceId,token:response.token,anchorAtMs:response.anchorAtMs,
          monotonicAt:perf,expiresAt:Date.parse(response.expiresAt)};
      }catch(error){console.info('Financial clock unavailable, future intents require review',error);}
    })().finally(()=>{this.financialClockLoading=undefined;});
    return this.financialClockLoading;
  }
  private financialRecordedAnchor():{clockAnchorId?:string;elapsedSinceAnchorMs?:number;deviceId:string}{
    const deviceId=this.localDeviceId(),current=this.financialClockAnchor;
    const perf=typeof performance!=='undefined'?performance.now():NaN;
    if(!current||current.groupId!==this.activeGroupId||current.deviceId!==deviceId||
      !Number.isFinite(perf)||perf<current.monotonicAt||Date.now()>current.expiresAt)return{deviceId};
    return{clockAnchorId:current.token,elapsedSinceAnchorMs:Math.round(perf-current.monotonicAt),deviceId};
  }

  constructor(options:ConnectedApplicationOptions={}){
    this.baseUrl=options.baseUrl??''; this.actorId=options.actorId??'user_founder'; this.tenantId=options.tenantId??'tenant_local'; this.displayName=options.displayName??'Local Manager';
    let storedLocale:string|undefined;try{
      storedLocale=localStorage.getItem('tontine.locale')??undefined;this.activeGroupId=localStorage.getItem('tontine.activeGroupId')??undefined;
      const budget=JSON.parse(localStorage.getItem('eco.serverBudgetBlock.v1')||'null');if(budget&&Number(budget.until)>Date.now()){this.serverBudgetBlockedUntil=Number(budget.until);this.serverBudgetReason=String(budget.reason??'SERVER_BUDGET');}
    }catch{}
    this.locale=options.locale??storedLocale??'fr';
    this.armServerBudgetWake();
  }

  private adoptLocalAccount(account:LocalAccountRecord):SessionAccount{
    const claimed=account.registrationState==='SERVER_CLAIMED'&&account.serverActorId&&account.serverTenantId;
    this.actorId=claimed?account.serverActorId!:account.id;this.homeTenantId=claimed?account.serverTenantId!:account.tenantId;this.tenantId=this.homeTenantId;this.displayName=account.displayName;this.locale=account.locale;this.usingOfflineSnapshot=true;
    return{id:this.actorId,tenantId:this.tenantId,username:account.username,displayName:account.displayName,locale:account.locale};
  }
  private async seedLocalAccount(account:LocalAccountRecord):Promise<SessionAccount>{
    const projected=this.adoptLocalAccount(account);
    await this.saveCached('/api/v1/auth/session',{authenticated:true,account:projected,local:true,registrationState:account.registrationState});
    const existing=await this.cached<Group[]>('/api/v1/groups');if(!existing)await this.saveCached('/api/v1/groups',[]);
    return projected;
  }
  private async serverAuthenticate(mode:'login'|'register',input:{username:string;password:string;displayName?:string}):Promise<{authenticated:boolean;account:SessionAccount}>{
    return this.request(`/api/v1/auth/${mode}`,{method:'POST',body:JSON.stringify({...input,locale:this.locale})});
  }

  private headers(extra:Record<string,string>={}):HeadersInit{return{'content-type':'application/json','accept-language':this.locale,'x-active-group-id':this.activeGroupId??'','x-timezone':'Africa/Douala',...extra};}
  private serverBudgetBlocked():boolean{
    if(this.serverBudgetBlockedUntil<=Date.now()){if(this.serverBudgetBlockedUntil){this.serverBudgetBlockedUntil=0;this.serverBudgetReason='';try{localStorage.removeItem('eco.serverBudgetBlock.v1');}catch{}}return false;}
    return true;
  }
  private armServerBudgetWake():void{
    if(this.serverBudgetWake)clearTimeout(this.serverBudgetWake);
    this.serverBudgetWake=undefined;
    if(this.serverBudgetBlockedUntil<=Date.now())return;
    // Exactly one wake-up at the quota boundary, not 1s/30s status probes.
    this.serverBudgetWake=setTimeout(()=>{
      this.serverBudgetWake=undefined;
      if(this.serverBudgetBlockedUntil>Date.now()){this.armServerBudgetWake();return;}
      if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:server-budget-expired'));
    },Math.min(2_147_483_647,this.serverBudgetBlockedUntil-Date.now()+1000));
  }
  private markServerBudgetBlocked(status:number):void{
    const now=new Date(),daily=status===429,until=daily?Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1,0,5,0):Date.now()+15*60_000;
    this.serverBudgetBlockedUntil=Math.max(this.serverBudgetBlockedUntil,until);this.serverBudgetReason=daily?'D1_DAILY_QUOTA':'D1_QUOTA_RETRY';
    try{localStorage.setItem('eco.serverBudgetBlock.v1',JSON.stringify({until:this.serverBudgetBlockedUntil,reason:this.serverBudgetReason,at:new Date().toISOString()}));}catch{}
    this.armServerBudgetWake();
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:server-budget-blocked',{detail:{until:this.serverBudgetBlockedUntil,reason:this.serverBudgetReason}}));
  }
  forceServerRetry():void{this.transportRecoveryWakeUsed=false;this.serverBudgetBlockedUntil=0;this.serverBudgetReason='';this.transportUnavailableUntil=0;if(this.serverBudgetWake)clearTimeout(this.serverBudgetWake);this.serverBudgetWake=undefined;if(this.transportWake)clearTimeout(this.transportWake);this.transportWake=undefined;try{localStorage.removeItem('eco.serverBudgetBlock.v1');}catch{}this.usingOfflineSnapshot=false;}
  forceTransportRetry():void{
    this.transportRecoveryWakeUsed=false;
    this.transportUnavailableUntil=0;if(this.transportWake)clearTimeout(this.transportWake);this.transportWake=undefined;
    // A real connectivity event reopens exhausted TRANSPORT retries only.
    // Business conflicts and confirmed payments remain terminal.
    for(const item of this.outbox.list())if(item.status==='FAILED'&&item.attempts>=5&&
      /^(NETWORK_UNAVAILABLE|HTTP_5\d\d)$/.test(String(item.lastError??'')))this.outbox.retry(item.id);
  }
  markLiveTransportHealthy():void{
    // A successfully opened authenticated WebSocket is already proof that the
    // server is reachable. Do not spend a D1/auth GET merely to leave a stale
    // offline snapshot state before the next financial write.
    this.forceTransportRetry();this.usingOfflineSnapshot=false;
    if(this.transportWake)clearTimeout(this.transportWake);this.transportWake=undefined;
    // Cold offline reloads lose the monotonic anchor. Warm a new signed clock
    // for future edits only; original offline timestamps remain untouched.
    void this.warmFinancialClock();
  }
  private markTransportUnavailable():void{
    // One bounded wake per outage, then wait for a real connectivity/user event.
    // The automatic wake must not reset this latch or the Outbox attempt limit.
    this.transportUnavailableUntil=Date.now()+3500;
    if(this.transportWake)clearTimeout(this.transportWake);
    this.transportWake=undefined;
    if(!this.transportRecoveryWakeUsed)this.transportWake=setTimeout(()=>{
      this.transportWake=undefined;
      if(this.transportUnavailableUntil>Date.now())return;
      this.transportRecoveryWakeUsed=true;
      this.transportUnavailableUntil=0;
      if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:transport-retry-ready'));
    },3650);
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:transport-degraded',{detail:{until:this.transportUnavailableUntil}}));
  }
  serverBudgetState():{blocked:boolean;until:number;reason:string}{return{blocked:this.serverBudgetBlocked(),until:this.serverBudgetBlockedUntil,reason:this.serverBudgetReason};}
  transportState():{degraded:boolean;until:number}{return{degraded:this.transportUnavailableUntil>Date.now(),until:this.transportUnavailableUntil};}
  private offlineReadAllowed(path:string):boolean{
    // A clock anchor cannot be re-based onto performance.now() after replaying
    // an old GET snapshot. Only a fresh server response establishes that pair.
    if(/\/financial-clock-anchor(?:\?|$)/.test(path))return false;
    // Actor-scoped IndexedDB snapshots are safe for GET projections. Keeping this
    // generic prevents a newly-added read screen from becoming an accidental
    // offline blocker. Mutations are never synthesized here.
    return path==='/api/v1/auth/session'||path.startsWith('/api/v1/');
  }
  private offlineReadKey(path:string):string{
    if(path==='/api/v1/auth/session')return 'session:last';
    const accountTenant=this.homeTenantId??this.tenantId;
    if(path==='/api/v1/groups')return JSON.stringify([this.actorId,accountTenant,'ACCOUNT',path]);
    return JSON.stringify([this.actorId,this.tenantId,this.activeGroupId??'',path]);
  }
  private async cacheReadSnapshot<T>(path:string,body:T):Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported()||!this.offlineReadAllowed(path))return;
    const session=path==='/api/v1/auth/session'?(body as any)?.account:undefined,stamp=new Date().toISOString(),raw=body as any,sourceVersion=raw?.sourceVersion??raw?.projectionVersion??raw?.version??raw?.watermark;
    try{await this.readSnapshots.save({id:this.offlineReadKey(path),actorId:String(session?.id??this.actorId),tenantId:String(session?.tenantId??this.tenantId),path,body,source:'SERVER',lastSyncedAt:stamp,sourceVersion});}catch{}
  }
  private announceOfflineSnapshot(path:string,updatedAt:string):void{
    this.usingOfflineSnapshot=true;
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:offline-snapshot-used',{detail:{path,updatedAt}}));
  }
  private isOffline():boolean{return this.serverBudgetBlocked()||(typeof navigator!=='undefined'&&navigator.onLine===false);}
  private async canAttemptCriticalWrite():Promise<boolean>{
    if(this.serverBudgetBlocked())return false;
    if(typeof navigator!=='undefined'&&navigator.onLine===false)return false;
    // The financial write itself is the event-driven connectivity probe. A
    // previous cached GET or short transport failure must not force an extra
    // auth/D1 read before every validation. This also lets a phone recover as
    // soon as mobile data/Wi-Fi works again.
    this.transportRecoveryWakeUsed=false;this.transportUnavailableUntil=0;
    if(this.transportWake)clearTimeout(this.transportWake);this.transportWake=undefined;
    return true;
  }
  private async cached<T>(path:string):Promise<T|undefined>{
    try{
      const exact=await this.readSnapshots.get<T>(this.offlineReadKey(path));if(exact)return exact.body;
      if(path==='/api/v1/groups'){
        const tenantId=this.homeTenantId??this.tenantId,rows=await this.readSnapshots.listForActorTenant(this.actorId,tenantId),byId=new Map<string,Group>();
        for(const row of rows.filter(x=>x.path==='/api/v1/groups'))for(const group of Array.isArray(row.body)?row.body as Group[]:[])if(group?.id)byId.set(group.id,group);
        if(byId.size){const body=[...byId.values()] as unknown as T;await this.readSnapshots.save({id:this.offlineReadKey(path),actorId:this.actorId,tenantId,path,body});return body;}
      }
    }catch{}
    return undefined;
  }
  private async saveCached<T>(path:string,body:T,source:'SERVER'|'LOCAL'|'RELAY'|'RESTORED'='LOCAL'):Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported())throw Error('DURABLE_STORAGE_REQUIRED');
    const tenantId=path==='/api/v1/groups'?(this.homeTenantId??this.tenantId):this.tenantId,id=this.offlineReadKey(path),previous=await this.readSnapshots.get<any>(id).catch(()=>undefined),raw=body as any,sourceVersion=raw?.sourceVersion??raw?.projectionVersion??raw?.version??raw?.watermark??previous?.sourceVersion;
    await this.readSnapshots.save({id,actorId:this.actorId,tenantId,path,body,source,lastSyncedAt:source==='SERVER'?new Date().toISOString():previous?.lastSyncedAt,sourceVersion});
  }
  async projectionMeta(path:string):Promise<{computedAt:string|null;sourceVersion:string|number|null;lastSyncedAt:string|null;pendingCount:number;scope:{actorId:string;tenantId:string;groupId:string|null};availability:'AVAILABLE'|'STALE'|'LOCAL_PENDING'|'UNAVAILABLE';source:string|null}>{
    const snapshot=await this.readSnapshots.get<any>(this.offlineReadKey(path)).catch(()=>undefined),pending=this.outbox.list().filter(x=>!['CONFIRMED','CANCELLED'].includes(x.status)&&String((x.payload as any)?.groupId??this.activeGroupId??'')===String(this.activeGroupId??'')).length,body=snapshot?.body as any,computedAt=body?.computedAt??body?.asOf??body?.generatedAt??snapshot?.updatedAt??null,sourceVersion=snapshot?.sourceVersion??body?.sourceVersion??body?.projectionVersion??body?.version??null;
    const age=computedAt?Date.now()-Date.parse(String(computedAt)):Infinity,availability=!snapshot?'UNAVAILABLE':pending>0?'LOCAL_PENDING':Number.isFinite(age)&&age>24*3600_000?'STALE':'AVAILABLE';
    return{computedAt,sourceVersion,lastSyncedAt:snapshot?.lastSyncedAt??null,pendingCount:pending,scope:{actorId:this.actorId,tenantId:this.tenantId,groupId:this.activeGroupId??null},availability,source:snapshot?.source??null};
  }
  private async patchCachedArray<T>(path:string,updater:(items:T[])=>T[]):Promise<T[]>{
    const current=structuredClone(await this.cached<T[]>(path)??[]),next=updater(current);
    await this.saveCached(path,next);return next;
  }
  private async queueLocal(type:string,payload:Record<string,unknown>,idempotencyKey=makeId('op')):Promise<OutboxItem>{
    payload={...payload,recordedOffline:payload.recordedOffline??(this.isOffline()||this.transportUnavailableUntil>Date.now())};
    let item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type,payload,idempotencyKey});
    const financialTarget=['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'].includes(type);
    if(financialTarget){
      try{
        const committed=await this.outboxStorage.recordFinancialCellIntent(
          item as OutboxItem<Record<string,unknown>>,this.localDeviceId());
        this.outbox.adoptDurable(committed);item=committed;
      }catch(error){
        // Do not allow an unpersisted in-memory intention to reach the network.
        this.outbox.discardUncommitted(item.id);
        throw Error('DURABLE_STORAGE_REQUIRED',{cause:error});
      }
    }else try{await this.persistOutbox();}catch(error){this.outbox.discardUncommitted(item.id);throw Error('DURABLE_STORAGE_REQUIRED',{cause:error});}
    const groupId=String(payload.groupId??this.activeGroupId??'');
    // The financial command already has an atomic, durable journal inside the
    // Outbox database. A best-effort sovereign mirror must not turn a committed
    // local action into a spurious failure that encourages duplicate validation.
    if(groupId&&IndexedDbSovereignStore.supported()){
      try{await this.sovereign.append({tenantId:this.tenantId,groupId,actorId:this.actorId,type,
        payload:{...structuredClone(item.payload),idempotencyKey,outboxId:item.id}});}
      catch(error){if(!financialTarget&&type!=='FINANCIAL_SHEET_ENTRY_V1')throw error;console.info('Sovereign financial mirror deferred',error);}
    }
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:local-mutation',{detail:{type,id:item.id,idempotencyKey}}));
    if((financialTarget||type==='FINANCIAL_SHEET_ENTRY_V1')&&typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:financial-local-committed',{detail:{groupId,meetingId:payload.meetingId,membershipId:payload.membershipId,rubricId:payload.rubricId,commandId:idempotencyKey}}));
    return item;
  }
  private async sha256Hex(value:string):Promise<string>{
    const bytes=new TextEncoder().encode(value),digest=await crypto.subtle.digest('SHA-256',bytes);
    return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  private localDeviceId():string{
    const fallback='device_'+this.actorId;try{let id=localStorage.getItem('tontine.deviceId');if(!id){id='device_'+crypto.randomUUID();localStorage.setItem('tontine.deviceId',id);}return id;}catch{return fallback;}
  }
  private async patchCachedFinancialNotice(membershipId:string,noticeId:string,patch:Record<string,unknown>):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members/${encodeURIComponent(membershipId)}/financial-notices`;
    const rows=await this.cached<any[]>(path)??[],current=rows.find(x=>x.id===noticeId);if(!current)throw Error('FINANCIAL_NOTICE_NOT_CACHED');
    const updated={...current,...patch,version:Number(current.version??0)+1,updatedAt:new Date().toISOString(),localActionPending:true};
    await this.saveCached(path,rows.map(x=>x.id===noticeId?updated:x));return updated;
  }
  private async request<T>(path:string,init:RequestInit={}):Promise<T>{
    const headers=new Headers(this.headers());
    for(const [k,v] of new Headers(init.headers??{}))headers.set(k,v);
    if(typeof FormData!=='undefined'&&init.body instanceof FormData)headers.delete('content-type');
    const method=String(init.method??'GET').toUpperCase(),cacheable=method==='GET'&&this.offlineReadAllowed(path),securityCritical=path.startsWith('/api/v1/auth/');
    if(!securityCritical&&this.transportUnavailableUntil>Date.now()){
      if(cacheable&&IndexedDbReadSnapshotAdapter.supported()){
        try{const snapshot=await this.readSnapshots.get<T>(this.offlineReadKey(path));if(snapshot){this.announceOfflineSnapshot(path,snapshot.updatedAt);return structuredClone(snapshot.body);}}catch{}
      }
      throw new Error('NETWORK_UNAVAILABLE');
    }
    if(this.serverBudgetBlocked()){
      if(cacheable&&IndexedDbReadSnapshotAdapter.supported()){
        try{const snapshot=await this.readSnapshots.get<T>(this.offlineReadKey(path));if(snapshot){this.announceOfflineSnapshot(path,snapshot.updatedAt);return structuredClone(snapshot.body);}}catch{}
      }
      throw new Error('NETWORK_UNAVAILABLE');
    }
    let response:Response;
    // navigator.onLine can be true on a hotspot with no Internet. Bound actual
    // server attempts; after one failure a short local circuit breaker makes
    // subsequent offline-capable actions immediate without periodic probing.
    const formUpload=typeof FormData!=='undefined'&&init.body instanceof FormData,
      eventCritical=/\/outbox\/apply$|\/financial-cells$|\/loans\/[^/]+\/(?:repay|disburse)$/.test(path),
      timeoutMs=formUpload?30000:eventCritical?2200:6500;
    const abort=typeof AbortController==='function'?new AbortController():null;
    let requestTimer:ReturnType<typeof setTimeout>|undefined;
    try{
      const send=fetch(`${this.baseUrl}${path}`,{...init,headers,...(abort?{signal:abort.signal}:{})});
      response=await Promise.race([send,new Promise<Response>((_,reject)=>{
        requestTimer=setTimeout(()=>{abort?.abort();reject(new Error('NETWORK_UNAVAILABLE'));},timeoutMs);
      })]);
    }catch(error){
      this.markTransportUnavailable();
      if(cacheable&&IndexedDbReadSnapshotAdapter.supported()){
        try{const snapshot=await this.readSnapshots.get<T>(this.offlineReadKey(path));if(snapshot){this.announceOfflineSnapshot(path,snapshot.updatedAt);return structuredClone(snapshot.body);}}catch{}
      }
      throw new Error('NETWORK_UNAVAILABLE',{cause:error});
    }finally{if(requestTimer)clearTimeout(requestTimer);}
    const body=await response.json().catch(()=>({error:`HTTP_${response.status}`}));
    if(!response.ok){
      const errorCode=String((body as any)?.error??'');
      // Not every HTTP 429 is a daily D1 quota: login/security throttles must
      // never strand the whole app until tomorrow. Require explicit quota text.
      const quotaSignal=/(?:\bd1\b.{0,80}(?:quota|limit|exceed)|(?:quota|daily\s+limit|limit\s+exceed|too\s+many\s+(?:queries|requests)).{0,80}\bd1\b|quota\s+exceeded|daily\s+quota)/i.test(errorCode);
      const transient=[503,504].includes(response.status)||quotaSignal;
      if(quotaSignal)this.markServerBudgetBlocked(/daily|per.day/i.test(errorCode)?429:503);
      if(response.status===429&&!quotaSignal)throw new Error(errorCode==='HTTP_429'?'RATE_LIMITED':errorCode);
      if(transient&&cacheable&&IndexedDbReadSnapshotAdapter.supported()){
        try{const snapshot=await this.readSnapshots.get<T>(this.offlineReadKey(path));if(snapshot){this.announceOfflineSnapshot(path,snapshot.updatedAt);return structuredClone(snapshot.body);}}catch{}
      }
      if(transient)throw new Error('NETWORK_UNAVAILABLE');
      throw new Error(String(body.error??`HTTP_${response.status}`));
    }
    this.usingOfflineSnapshot=false;this.transportUnavailableUntil=0;this.transportRecoveryWakeUsed=false;
    if(this.transportWake)clearTimeout(this.transportWake);this.transportWake=undefined;
    if(cacheable)await this.cacheReadSnapshot(path,body as T);
    return body as T;
  }

  async bootstrap(input:{actorId?:string;tenantId?:string;displayName?:string;locale?:string}={}):Promise<{restoredOutbox:number;groups:Group[]}>{
    const session=await this.authStatus();if(!session.authenticated || !session.account)throw Error('AUTHENTICATION_REQUIRED');
    this.actorId=session.account.id;this.homeTenantId=session.account.tenantId;this.tenantId=session.account.tenantId;this.displayName=session.account.displayName;
    let preferred:string|undefined;try{preferred=localStorage.getItem('tontine.locale')??undefined;}catch{}this.locale=preferred??session.account.locale;
    if(IndexedDbOutboxAdapter.supported())try{const persisted=await this.outboxStorage.load();this.outbox.restore(persisted.filter(x=>x.actorId===this.actorId&&x.tenantId===this.tenantId));}catch{}
    await this.recoverInterruptedVaultRestores();
    const groups=await this.listGroups();if(this.activeGroupId&&!groups.some(g=>g.id===this.activeGroupId))this.selectGroup(undefined);if(!this.activeGroupId&&groups[0])this.selectGroup(groups[0].id);else this.selectGroup(this.activeGroupId);
    if(!this.usingOfflineSnapshot){await this.request('/api/v1/bootstrap',{method:'POST',body:JSON.stringify({displayName:this.displayName,locale:this.locale})});await this.groupTrashItems().catch(()=>[]);if(this.activeGroupId)await this.warmFinancialClock();}
    return{restoredOutbox:this.outbox.list().length,groups};
  }

  async authStatus():Promise<{authenticated:boolean;account:SessionAccount|null;local?:boolean;registrationState?:string;offline?:boolean}>{
    let local:LocalAccountRecord|undefined;try{local=await this.localAuth.current();}catch{}
    if(local?.registrationState==='LOCAL_PENDING_REGISTRATION'){
      const account=this.adoptLocalAccount(local);return{authenticated:true,account,local:true,registrationState:local.registrationState,offline:true};
    }
    if(typeof navigator!=='undefined'&&navigator.onLine===false){
      if(local){const account=this.adoptLocalAccount(local);return{authenticated:true,account,local:true,registrationState:local.registrationState,offline:true};}
      try{const cached=await this.readSnapshots.get<any>('session:last');if(cached?.body?.authenticated&&cached.body.account){this.announceOfflineSnapshot('/api/v1/auth/session',cached.updatedAt);return{...cached.body,offline:true};}}catch{}
      return{authenticated:false,account:null,offline:true};
    }
    try{
      const server=await this.request<{authenticated:boolean;account:SessionAccount|null}>('/api/v1/auth/session');
      if(server.authenticated&&server.account){this.actorId=server.account.id;this.homeTenantId=server.account.tenantId;this.tenantId=server.account.tenantId;this.displayName=server.account.displayName;this.usingOfflineSnapshot=false;return server;}
      if(local){const account=this.adoptLocalAccount(local);return{authenticated:true,account,local:true,registrationState:local.registrationState};}
      return server;
    }catch(error){
      if(error instanceof Error&&error.message==='NETWORK_UNAVAILABLE'){
        if(local){const account=this.adoptLocalAccount(local);return{authenticated:true,account,local:true,registrationState:local.registrationState,offline:true};}
        return{authenticated:false,account:null,offline:true};
      }
      throw error;
    }
  }
  currentActor():string{return this.actorId;}
  async relayPairingMaterial(membershipId:string,rotate=false):Promise<EcoRelayPairingMaterial>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const [members,groups]=await Promise.all([this.listMembers(),this.listGroups()]),member=members.find(x=>x.id===membershipId&&x.status==='active'),group=groups.find(x=>x.id===this.activeGroupId);if(!member||!group)throw Error('MEMBERSHIP_NOT_FOUND');const self=members.find(x=>x.userId===this.actorId),canManage=group.createdBy===this.actorId||Boolean(self?.roles?.some(r=>['founder','manager','admin','president','treasurer'].includes(String(r).toLowerCase())));if(!canManage)throw Error('FORBIDDEN_GROUP_MANAGEMENT');
    const existing=!rotate?await this.sovereign.relayKey(this.tenantId,this.activeGroupId,membershipId):undefined;
    const base=existing?{protocolVersion:1 as const,membershipId,keyId:existing.keyId,rawKey:existing.rawKey,createdAt:existing.createdAt}:await createRelayPairingMaterial(membershipId);
    const material:EcoRelayPairingMaterial={...base,groupId:group.id,groupName:group.name,displayName:member.displayName,memberNumber:member.memberNumber,groupAuthorityId:group.createdBy};
    if(!existing)await this.sovereign.saveRelayKey({tenantId:this.tenantId,groupId:this.activeGroupId,membershipId:material.membershipId,keyId:material.keyId,rawKey:material.rawKey,createdAt:material.createdAt});
    return material;
  }
  async importRelayPairingMaterial(material:EcoRelayPairingMaterial):Promise<void>{
    if(material.protocolVersion!==1||!material.membershipId||!material.keyId||!material.rawKey||!material.groupId)throw Error('INVALID_RELAY_PAIRING_MATERIAL');
    const groupId=material.groupId,groups=await this.cached<Group[]>('/api/v1/groups')??[],existingGroup=groups.find(x=>x.id===groupId);
    if(!existingGroup){
      const stamp=material.createdAt||new Date().toISOString(),group:Group={id:groupId,tenantId:this.tenantId,name:material.groupName?.trim()||'Groupe Eco Relay',kind:'association',originMode:'IMPORT_EXISTING',governanceModel:'community',status:'active',createdBy:material.groupAuthorityId?.trim()||('relay_authority_'+groupId),createdAt:stamp};
      await this.saveCached('/api/v1/groups',[...groups,group]);this.groupTenants.set(groupId,this.tenantId);
    }
    this.selectGroup(groupId);
    const path='/api/v1/groups/'+encodeURIComponent(groupId)+'/members',members=await this.cached<MembershipView[]>(path)??[];
    if(!members.some(x=>x.id===material.membershipId)){
      const member:MembershipView={id:material.membershipId,tenantId:this.tenantId,groupId,userId:this.actorId,memberNumber:material.memberNumber,roles:['member'],status:'active',joinedAt:material.createdAt,displayName:material.displayName?.trim()||('Membre '+(material.memberNumber??''))};
      await this.saveCached(path,[...members,member]);
    }
    await this.sovereign.saveRelayKey({tenantId:this.tenantId,groupId,membershipId:material.membershipId,keyId:material.keyId,rawKey:material.rawKey,createdAt:material.createdAt});
  }
  async relayReceiverIdentity():Promise<{membershipId:string;keyId:string}|undefined>{
    if(!this.activeGroupId)return undefined;const members=await this.listMembers(),own=members.find(x=>x.userId===this.actorId&&x.status!=='left');if(!own)return undefined;
    const key=await this.sovereign.relayKey(this.tenantId,this.activeGroupId,own.id);return key?{membershipId:own.id,keyId:key.keyId}:undefined;
  }
  private async localProjectionSnapshot(meetingId?:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const groupId=this.activeGroupId;
    const [groups,members,rubrics,meetings,ledgerState,loans,exercises,journal]=await Promise.all([this.listGroups(),this.listMembers(),this.listRubrics(),this.listMeetings(),this.ledger(),this.listCompletion('LOAN'),this.exercises(),this.sovereign.list(this.tenantId,groupId)]);
    const group=groups.find(x=>x.id===groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    const meeting=meetingId?meetings.find(x=>x.id===meetingId):meetings.slice().sort((a,b)=>String(b.scheduledAt??b.openedAt).localeCompare(String(a.scheduledAt??a.openedAt)))[0];
    return{groupId,group,members,rubrics,meeting,ledgerState,loans,exercises,projectionVersion:journal.at(-1)?.sequence??0};
  }
  private async memberCapsuleFromSnapshot(snapshot:any,membershipId:string):Promise<EcoMemberCapsule>{
    const member=snapshot.members.find((x:any)=>x.id===membershipId&&x.status!=='left');if(!member)throw Error('MEMBERSHIP_NOT_FOUND');
    const rubricNames=new Map(snapshot.rubrics.map((x:any)=>[x.id,x.name])),meeting=snapshot.meeting;
    const receipts=(snapshot.ledgerState.receipts??[]).filter((x:any)=>x.membershipId===membershipId&&(!meeting||x.meetingId===meeting.id)).map((x:any)=>({receiptId:x.id,meetingId:x.meetingId??null,rubricId:x.rubricId??null,rubricName:x.rubricId?rubricNames.get(x.rubricId)??'Rubrique':'Sans rubrique',netAmount:Number(x.netAmount??x.amount?.amount??0),currency:String(x.amount?.currency??'XAF'),receivedAt:x.receivedAt,localPending:Boolean(x.localPending)}));
    const allReceipts=(snapshot.ledgerState.receipts??[]).filter((x:any)=>x.membershipId===membershipId),statementTotal=allReceipts.reduce((n:number,x:any)=>n+Number(x.netAmount??x.amount?.amount??0),0);
    const debts=snapshot.loans.filter((x:any)=>String(x.data.borrowerMembershipId??'')===membershipId&&['DISBURSED','REPAYING'].includes(String(x.data.completionState??''))).map((x:any)=>({loanId:x.id,title:x.title,principal:Number(x.data.outstandingPrincipal??0),interest:Number(x.data.unpaidInterest??0),totalDebt:Number(x.data.outstandingPrincipal??0)+Number(x.data.unpaidInterest??0)})).filter((x:any)=>x.totalDebt>0);
    const currentExercise=snapshot.exercises.find((x:any)=>['OPEN','CLOSING'].includes(String(x.data.completionState)))??snapshot.exercises.at(-1),latestClosed=snapshot.exercises.filter((x:any)=>['CLOSED','CARRIED_FORWARD'].includes(String(x.data.completionState))).sort((a:any,b:any)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0],pending=this.outbox.list().filter(x=>{const p=x.payload as any;return String(p.groupId??'')===snapshot.groupId&&String(p.membershipId??'')===membershipId&&!['CONFIRMED','CANCELLED','CONFLICT'].includes(x.status);}).map(x=>({id:x.id,type:x.type,status:x.status,createdAt:x.createdAt}));
    let exerciseEnvelope:any=null;if(latestClosed?.data.closingPlanJson)try{const plan=JSON.parse(String(latestClosed.data.closingPlanJson));exerciseEnvelope=(plan.members??[]).find((x:any)=>x.membershipId===membershipId)??null;}catch{}
    const projection={group:{id:snapshot.group.id,name:snapshot.group.name,currentExerciseLabel:snapshot.group.currentExerciseLabel??null},member:{id:member.id,memberNumber:member.memberNumber??null,displayName:member.displayName,roles:member.roles,status:member.status},meeting:meeting?{id:meeting.id,title:meeting.title,status:meeting.status,scheduledAt:meeting.scheduledAt??meeting.openedAt}:null,receipts,statementTotal,loanDebts:debts,currentExercise:currentExercise?{id:currentExercise.id,label:String(currentExercise.data.label??currentExercise.title),state:String(currentExercise.data.completionState??''),openingCash:Number(currentExercise.data.openingCash??0)}:null,latestExerciseEnvelope:exerciseEnvelope,pendingLocalOperations:pending};
    const generatedAt=new Date().toISOString(),projectionDigest=await this.sha256Hex(JSON.stringify(projection));
    return{protocolVersion:1,groupId:snapshot.groupId,membershipId,generatedAt,expiresAt:new Date(Date.now()+30*24*3600_000).toISOString(),projection,schemaVersion:1,projectionVersion:snapshot.projectionVersion,sourceAuthorityId:this.actorId,sourceDeviceId:this.localDeviceId(),projectionDigest};
  }
  async localMemberCapsule(membershipId:string,meetingId?:string):Promise<EcoMemberCapsule>{return this.memberCapsuleFromSnapshot(await this.localProjectionSnapshot(meetingId),membershipId);}
  private broadcastAckPath(groupId:string):string{return '/api/v1/relay/broadcast-acks/'+encodeURIComponent(groupId);}
  async recordEcoBroadcastAck(membershipId:string,projectionVersion:number):Promise<void>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(projectionVersion)||projectionVersion<0)throw Error('INVALID_PROJECTION_VERSION');
    const path=this.broadcastAckPath(this.activeGroupId),acks=await this.cached<Record<string,number>>(path)??{},previous=Number(acks[membershipId]??-1);if(projectionVersion>previous)await this.saveCached(path,{...acks,[membershipId]:projectionVersion});
  }
  async prepareEcoBroadcast(input:{meetingId?:string;membershipIds?:string[];ttlMinutes?:number;cursor?:number;pageSize?:number;deltaOnly?:boolean}={}):Promise<{bundle:EcoBroadcastBundle;frames:string[];targetedFrames:string[];included:string[];unpaired:string[];skippedUnchanged:string[];nextCursor:number|null;projectionVersion:number}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const snapshot=await this.localProjectionSnapshot(input.meetingId),all=snapshot.members,group=snapshot.group,self=all.find((x:any)=>x.userId===this.actorId),canManage=group.createdBy===this.actorId||Boolean(self?.roles?.some((r:any)=>['founder','manager','admin','president','treasurer'].includes(String(r).toLowerCase())));if(!canManage)throw Error('FORBIDDEN_GROUP_MANAGEMENT');
    const active=all.filter((x:any)=>x.status==='active').slice().sort((a:any,b:any)=>Number(a.memberNumber??Number.MAX_SAFE_INTEGER)-Number(b.memberNumber??Number.MAX_SAFE_INTEGER)||String(a.id).localeCompare(String(b.id))),explicit=input.membershipIds?.length?new Set(input.membershipIds.map(String)):undefined,cursor=Math.max(0,Math.trunc(input.cursor??0)),pageSize=Math.min(200,Math.max(1,Math.trunc(input.pageSize??80))),selected=explicit?active.filter((x:any)=>explicit.has(x.id)):active.slice(cursor,cursor+pageSize),nextCursor=explicit||cursor+selected.length>=active.length?null:cursor+selected.length;
    const encrypted=[],included:string[]=[],unpaired:string[]=[],skippedUnchanged:string[]=[],acks=input.deltaOnly?await this.cached<Record<string,number>>(this.broadcastAckPath(this.activeGroupId))??{}:{};
    for(const member of selected){
      if(input.deltaOnly&&Number(acks[member.id]??-1)>=snapshot.projectionVersion){skippedUnchanged.push(member.id);continue;}
      const key=await this.sovereign.relayKey(this.tenantId,this.activeGroupId,member.id);if(!key){unpaired.push(member.id);continue;}
      const capsule=await this.memberCapsuleFromSnapshot(snapshot,member.id),material:EcoRelayPairingMaterial={protocolVersion:1,membershipId:member.id,keyId:key.keyId,rawKey:key.rawKey,createdAt:key.createdAt};encrypted.push(await encryptMemberCapsule(capsule,material));included.push(member.id);
    }
    if(!encrypted.length)throw Error(skippedUnchanged.length?'BROADCAST_NO_CHANGED_MEMBERS':'BROADCAST_NO_PAIRED_MEMBERS');
    const bundle=createBroadcastBundle(this.activeGroupId,encrypted,input.ttlMinutes??30),[frames,targetedFrames]=await Promise.all([encodeBroadcastFrames(bundle,180),encodeTargetedBroadcastFrames(bundle,165)]);return{bundle,frames,targetedFrames,included,unpaired,skippedUnchanged,nextCursor,projectionVersion:snapshot.projectionVersion};
  }
  async receiveEcoBroadcast(bundle:EcoBroadcastBundle,membershipId?:string):Promise<EcoMemberCapsule>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(bundle.groupId!==this.activeGroupId)throw Error('BROADCAST_WRONG_GROUP');
    const members=await this.listMembers(),own=membershipId?members.find(x=>x.id===membershipId):members.find(x=>x.userId===this.actorId);if(!own)throw Error('MEMBERSHIP_NOT_FOUND');
    const key=await this.sovereign.relayKey(this.tenantId,this.activeGroupId,own.id);if(!key)throw Error('RELAY_PAIRING_REQUIRED');
    const encrypted=bundle.capsules.find(x=>x.membershipId===own.id);if(!encrypted)throw Error('BROADCAST_NO_CAPSULE_FOR_MEMBER');
    const material:EcoRelayPairingMaterial={protocolVersion:1,membershipId:own.id,keyId:key.keyId,rawKey:key.rawKey,createdAt:key.createdAt},capsule=await decryptMemberCapsule(bundle.groupId,encrypted,material,bundle.expiresAt);
    const path='/api/v1/relay/member-capsule/'+encodeURIComponent(bundle.groupId)+'/'+encodeURIComponent(own.id),seenPath='/api/v1/relay/seen-transfers/'+encodeURIComponent(bundle.groupId)+'/'+encodeURIComponent(own.id),existing=await this.cached<EcoMemberCapsule>(path),seen=await this.cached<string[]>(seenPath)??[];
    const incomingDigest=capsule.projectionDigest??await this.sha256Hex(JSON.stringify(capsule.projection)),incomingVersion=Number(capsule.projectionVersion??0),existingDigest=existing?(existing.projectionDigest??await this.sha256Hex(JSON.stringify(existing.projection))):undefined,existingVersion=Number(existing?.projectionVersion??0);
    if(existing){
      if(incomingVersion<existingVersion)throw Error('BROADCAST_STALE_PROJECTION');
      if(incomingVersion===existingVersion&&incomingDigest!==existingDigest)throw Error('BROADCAST_PROJECTION_CONFLICT');
      if((incomingVersion===existingVersion&&incomingDigest===existingDigest)||seen.includes(bundle.transferId))return existing;
    }
    const normalized:EcoMemberCapsule={...capsule,schemaVersion:1,projectionVersion:incomingVersion,projectionDigest:incomingDigest};
    await this.saveCached(path,normalized,'RELAY');await this.saveCached(seenPath,[...seen.filter(x=>x!==bundle.transferId).slice(-255),bundle.transferId],'RELAY');
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:member-capsule-updated',{detail:{groupId:bundle.groupId,membershipId:own.id,projectionVersion:incomingVersion,transferId:bundle.transferId}}));
    return normalized;
  }
  async receivedMemberCapsule(membershipId:string):Promise<EcoMemberCapsule|undefined>{
    if(!this.activeGroupId)return undefined;return this.cached('/api/v1/relay/member-capsule/'+encodeURIComponent(this.activeGroupId)+'/'+encodeURIComponent(membershipId));
  }
  private managerRelayIntentPath(groupId:string):string{return 'local://manager-relay-intents/'+encodeURIComponent(groupId);}
  private relayFerryPath(groupId:string):string{return 'local://relay-ferry/'+encodeURIComponent(groupId);}
  private managerCommandCellKey(item:any):string{
    const p=item?.payload??{};
    if(['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'].includes(String(item?.type)))
      return JSON.stringify(['CELL',p.meetingId??'',p.membershipId??'',p.rubricId??'',p.activityId??'']);
    if(String(item?.type)==='FINANCIAL_SHEET_ENTRY_V1')
      return JSON.stringify(['SHEET',p.meetingId??'',p.membershipId??'',p.rubricId??'',p.nature??'']);
    return '';
  }
  private managerIntentOrder(item:any):string{
    const p=item?.payload??{},stamp=String(p.recordedAtClient??item?.createdAt??''),device=String(p.deviceId??''),seq=String(Number(p.deviceSequence??0)).padStart(12,'0');
    return [stamp,device,seq,String(item?.idempotencyKey??item?.id??'')].join('|');
  }
  private async managerRelayIntents():Promise<any[]>{
    if(!this.activeGroupId)return[];
    return (await this.cached<any[]>(this.managerRelayIntentPath(this.activeGroupId))??[])
      .filter(x=>x&&String((x.payload??{}).groupId??'')===this.activeGroupId)
      .slice(-5000);
  }
  async localRelayGroupStructure():Promise<{members:MembershipView[];meetings:MeetingSession[];rubrics:RubricDefinition[]}>{
    if(!this.activeGroupId)return{members:[],meetings:[],rubrics:[]};const base='/api/v1/groups/'+encodeURIComponent(this.activeGroupId);
    const [members,meetings,rubrics]=await Promise.all([
      this.cached<MembershipView[]>(base+'/members'),this.cached<MeetingSession[]>(base+'/meetings'),this.cached<RubricDefinition[]>(base+'/rubrics')
    ]);
    return{members:members??[],meetings:meetings??[],rubrics:rubrics??[]};
  }
  async relayManagerFinancialTargets():Promise<Array<{meetingId:string;membershipId:string;rubricId:string;targetAmount:number;baselineValue:number;baselineVersion:number;status:string;businessStatus:string;idempotencyKey:string;createdAt:string;source:'RELAY';sourceActorId:string;recordedAtClient:string}>>{
    const intents=await this.managerRelayIntents(),byCell=new Map<string,any>();
    const resolutions=await this.cached<any[]>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId??'')+'/eco-relay/resolutions')??[];
    for(const item of intents){
      if(!['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'].includes(String(item.type)))continue;
      const p=item.payload??{},key=this.managerCommandCellKey(item);if(!key)continue;
      if(resolutions.some(x=>x.key===key&&x.comparedCommandIds?.includes(String(item.idempotencyKey))))continue;
      const current=byCell.get(key);if(!current||this.managerIntentOrder(item)>this.managerIntentOrder(current))byCell.set(key,item);
    }
    return [...byCell.values()].map(item=>{const p=item.payload??{};return{
      meetingId:String(p.meetingId??''),membershipId:String(p.membershipId??''),rubricId:String(p.rubricId??''),
      targetAmount:Number(p.targetAmount??0),baselineValue:Number(p.baselineValue??0),baselineVersion:Number(p.baselineVersion??0),
      status:'RELAY_RECEIVED',businessStatus:'',idempotencyKey:String(item.idempotencyKey??''),createdAt:String(item.createdAt??p.recordedAtClient??''),
      source:'RELAY' as const,sourceActorId:String(item.actorId??''),recordedAtClient:String(p.recordedAtClient??item.createdAt??'')
    };}).filter(x=>x.meetingId&&x.membershipId&&x.rubricId&&Number.isSafeInteger(x.targetAmount)&&x.targetAmount>=0);
  }
  private managerStructuralPathAllowed(path:string,groupId:string):boolean{
    const enc=encodeURIComponent(groupId),base='/api/v1/groups/'+enc;
    // The receiving device's /me response is authorization context, never an
    // interchangeable group projection from another manager's device.
    return path==='/api/v1/groups'||path===base+'/members'||path===base+'/meetings'||path===base+'/rubrics'||path===base+'/identity-profile';
  }
  async localRoomManagerDelta():Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const groupId=this.activeGroupId;
    const relayed=await this.managerRelayIntents(),own=this.outbox.list().filter(x=>String((x.payload as any)?.groupId??'')===groupId&&!['CONFIRMED','CANCELLED'].includes(String(x.status)));
    const commandsById=new Map<string,any>();for(const item of [...relayed,...own])commandsById.set(String(item.actorId)+':'+String(item.idempotencyKey??item.id),structuredClone(item));
    const allSnapshots=IndexedDbReadSnapshotAdapter.supported()?await this.readSnapshots.listForActorTenant(this.actorId,this.tenantId):[],structuralSnapshots:any[]=[];let bytes=0;
    for(const row of allSnapshots){
      if(!this.managerStructuralPathAllowed(String(row.path??''),groupId))continue;
      const scopedBody=row.path==='/api/v1/groups'&&Array.isArray(row.body)?(row.body as any[]).filter(g=>String(g?.id??'')===groupId):row.body;
      const safe={path:row.path,body:scopedBody,updatedAt:row.updatedAt,sourceVersion:row.sourceVersion??null},size=JSON.stringify(safe).length;
      if(bytes+size>900000)break;bytes+=size;structuralSnapshots.push(safe);
    }
    const journal=await this.sovereign.list(this.tenantId,groupId),last=journal.at(-1);
    return{protocol:'ECO_MANAGER_DELTA_2',groupId,tenantId:this.tenantId,actorId:this.actorId,sourceDeviceId:this.localDeviceId(),generatedAt:new Date().toISOString(),
      commands:[...commandsById.values()].slice(-2500),structuralSnapshots,journalHead:last?{sequence:last.sequence,hash:last.hash}:null};
  }
  async confrontLocalRoomManagerDelta(remote:any):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!remote||remote.groupId!==this.activeGroupId)throw Error('ECO_LOCAL_ROOM_DELTA_INVALID');
    if(remote.protocol==='ECO_MANAGER_DELTA_1'){
      if(!Array.isArray(remote.events))throw Error('ECO_LOCAL_ROOM_DELTA_INVALID');
      const local=await this.sovereign.list(this.tenantId,this.activeGroupId),remoteEvents=remote.events as any[];let commonSequence=0;
      const max=Math.min(local.length,remoteEvents.length);for(let i=0;i<max;i++){if(local[i]?.sequence===remoteEvents[i]?.sequence&&local[i]?.hash===remoteEvents[i]?.hash)commonSequence=i+1;else break;}
      return{protocol:'ECO_MANAGER_DELTA_1',commonSequence,commonCommands:0,localOnly:Math.max(0,local.length-commonSequence),remoteOnly:Math.max(0,remoteEvents.length-commonSequence),structuralChanges:0,potentialFinancialConflicts:[]};
    }
    if(remote.protocol!=='ECO_MANAGER_DELTA_2'||remote.tenantId!==this.tenantId||!Array.isArray(remote.commands)||!Array.isArray(remote.structuralSnapshots))throw Error('ECO_LOCAL_ROOM_DELTA_INVALID');
    const localRelayed=await this.managerRelayIntents(),localOwn=this.outbox.list().filter(x=>String((x.payload as any)?.groupId??'')===this.activeGroupId&&!['CONFIRMED','CANCELLED'].includes(String(x.status))),local=[...localRelayed,...localOwn];
    const commandId=(x:any)=>String(x?.actorId??'')+':'+String(x?.idempotencyKey??x?.id??''),localIds=new Set<string>(local.map(commandId)),remoteIds=new Set<string>((remote.commands as any[]).map(commandId)),commonCommands=[...remoteIds].filter(x=>localIds.has(x)).length;
    const localByCell=new Map<string,any>();for(const item of local){const key=this.managerCommandCellKey(item);if(!key)continue;const old=localByCell.get(key);if(!old||(item.actorId===this.actorId&&old.actorId!==this.actorId)||(item.actorId===old.actorId&&this.managerIntentOrder(item)>this.managerIntentOrder(old)))localByCell.set(key,item);}
    const remoteByCell=new Map<string,any>();for(const item of remote.commands){const p=item?.payload??{};if(String(p.groupId??'')!==this.activeGroupId)continue;const key=this.managerCommandCellKey(item);if(!key)continue;const old=remoteByCell.get(key);if(!old||this.managerIntentOrder(item)>this.managerIntentOrder(old))remoteByCell.set(key,item);}
    const potentialFinancialConflicts:any[]=[];
    for(const [key,theirs] of remoteByCell){
      const mine=localByCell.get(key);if(!mine)continue;
      const ma=Number(mine.payload?.targetAmount??mine.payload?.amount),ra=Number(theirs.payload?.targetAmount??theirs.payload?.amount),mineOrder=this.managerIntentOrder(mine),theirOrder=this.managerIntentOrder(theirs);
      const locallyResolved=String(mine.payload?.reason??'').startsWith('[ECO_RELAY_RESOLUTION]')&&mineOrder>theirOrder;
      if(Number.isFinite(ma)&&Number.isFinite(ra)&&ma!==ra&&!locallyResolved)potentialFinancialConflicts.push({key,local:mine,remote:theirs,recommended:theirOrder>mineOrder?'REMOTE':'LOCAL'});
    }
    const resolutions=await this.cached<any[]>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/eco-relay/resolutions')??[];
    const unresolved=potentialFinancialConflicts.filter(row=>!resolutions.some(x=>x.key===row.key&&x.comparedCommandIds?.includes(String(row.remote.idempotencyKey))));
    return{protocol:'ECO_MANAGER_DELTA_2',commonSequence:0,commonCommands,localOnly:Math.max(0,localIds.size-commonCommands),remoteOnly:Math.max(0,remoteIds.size-commonCommands),structuralChanges:remote.structuralSnapshots.length,potentialFinancialConflicts:unresolved};
  }
  async resolveLocalRoomManagerConflict(input:{local:any;remote:any;choice:'LOCAL'|'REMOTE'}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!['LOCAL','REMOTE'].includes(input.choice))throw Error('ECO_RELAY_RESOLUTION_INVALID');
    const local=input.local,remote=input.remote,lp=local?.payload??{},rp=remote?.payload??{};
    const targetTypes=['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'];
    if(lp.groupId!==this.activeGroupId||rp.groupId!==this.activeGroupId)throw Error('ECO_RELAY_RESOLUTION_SCOPE_INVALID');
    if(!targetTypes.includes(String(local?.type))||!targetTypes.includes(String(remote?.type)))throw Error('SPECIALIZED_FINANCIAL_REVIEW_REQUIRED');
    const coords=(p:any)=>[String(p.meetingId??''),String(p.membershipId??''),String(p.rubricId??'')];
    const [lm,lmem,lr]=coords(lp),[rm,rmem,rr]=coords(rp);if(!lm||!lmem||!lr||lm!==rm||lmem!==rmem||lr!==rr)throw Error('ECO_RELAY_RESOLUTION_SCOPE_INVALID');
    const localAmount=Number(lp.targetAmount??lp.amount),remoteAmount=Number(rp.targetAmount??rp.amount),chosen=input.choice==='REMOTE'?remoteAmount:localAmount;
    if(!Number.isSafeInteger(chosen)||chosen<0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    const baselineVersion=Math.max(0,Number(lp.baselineVersion??0),Number(rp.baselineVersion??0)),reason='[ECO_RELAY_RESOLUTION] '+input.choice+' · '+String(local?.actorId??'local')+' / '+String(remote?.actorId??'relay');
    const result=await this.setFinancialCellTarget({meetingId:lm,membershipId:lmem,rubricId:lr,targetAmount:chosen,currentAmount:localAmount,currentVersion:baselineVersion,reason});
    const path='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/eco-relay/resolutions',resolutions=await this.cached<any[]>(path)??[],key=this.managerCommandCellKey(local);
    await this.saveCached(path,[...resolutions.filter(x=>x.key!==key),{key,comparedCommandIds:[local.idempotencyKey,remote.idempotencyKey],selectedAmount:chosen,choice:input.choice,recordedAt:new Date().toISOString()}]);
    const conflictsPath='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/eco-relay/conflicts';
    await this.saveCached(conflictsPath,(await this.cached<any[]>(conflictsPath)??[]).filter(x=>x.key!==key));
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:manager-relay-updated',{detail:{groupId:this.activeGroupId,resolved:true,choice:input.choice,meetingId:lm,membershipId:lmem,rubricId:lr,targetAmount:chosen}}));
    return result;
  }
  async importLocalRoomManagerDelta(remote:any):Promise<{importedCommands:number;mergedSnapshots:number;duplicates:number;conflicts:number}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(remote?.protocol!=='ECO_MANAGER_DELTA_2'||remote.groupId!==this.activeGroupId||remote.tenantId!==this.tenantId||!Array.isArray(remote.commands)||!Array.isArray(remote.structuralSnapshots))throw Error('ECO_LOCAL_ROOM_DELTA_INVALID');
    // Compare BEFORE integrating the remote commands. Otherwise the local side
    // already contains the remote winner and the real divergence disappears.
    const comparison=await this.confrontLocalRoomManagerDelta(remote);
    const conflictsPath='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/eco-relay/conflicts',oldConflicts=await this.cached<any[]>(conflictsPath)??[],conflictsByKey=new Map(oldConflicts.map(x=>[x.key,x]));
    for(const conflict of comparison.potentialFinancialConflicts)conflictsByKey.set(conflict.key,conflict);
    await this.saveCached(conflictsPath,[...conflictsByKey.values()],'RELAY');
    const current=await this.managerRelayIntents(),byId=new Map(current.map(x=>[String(x.actorId)+':'+String(x.idempotencyKey??x.id),x])),before=byId.size;
    for(const item of remote.commands.slice(0,2500)){
      const p=item?.payload??{};if(!item?.actorId||!item?.idempotencyKey||String(p.groupId??'')!==this.activeGroupId)continue;
      byId.set(String(item.actorId)+':'+String(item.idempotencyKey),structuredClone({...item,relayReceivedAt:new Date().toISOString(),relaySourceDeviceId:String(remote.sourceDeviceId??'')}));
    }
    await this.saveCached(this.managerRelayIntentPath(this.activeGroupId),[...byId.values()].slice(-5000),'RELAY');
    let mergedSnapshots=0;
    const rowStamp=(x:any)=>Date.parse(String(x?.updatedAt??x?.joinedAt??x?.createdAt??''))||0;
    for(const snap of remote.structuralSnapshots.slice(0,80)){
      const path=String(snap?.path??'');if(!this.managerStructuralPathAllowed(path,this.activeGroupId))continue;
      const incoming=snap?.body,currentBody=await this.cached<any>(path);
      if(Array.isArray(incoming)){
        const map=new Map<string,any>();for(const row of Array.isArray(currentBody)?currentBody:[])if(row?.id)map.set(String(row.id),row);
        for(const row of incoming)if(row?.id&&(path!=='/api/v1/groups'||String(row.id)===this.activeGroupId)&&(!row.groupId||String(row.groupId)===this.activeGroupId)){const old=map.get(String(row.id));if(!old||rowStamp(row)>=rowStamp(old))map.set(String(row.id),row);}
        await this.saveCached(path,[...map.values()],'RELAY');mergedSnapshots++;
      }else if(incoming&&typeof incoming==='object'){
        const oldStamp=rowStamp(currentBody),newStamp=rowStamp(incoming);if(!currentBody||newStamp>=oldStamp){await this.saveCached(path,incoming,'RELAY');mergedSnapshots++;}
      }
    }
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:manager-relay-updated',{detail:{groupId:this.activeGroupId,sourceActorId:String(remote.actorId??''),importedCommands:Math.max(0,byId.size-before),mergedSnapshots,conflicts:comparison.potentialFinancialConflicts.length}}));
    return{importedCommands:Math.max(0,byId.size-before),mergedSnapshots,duplicates:Math.max(0,remote.commands.length-(byId.size-before)),conflicts:comparison.potentialFinancialConflicts.length};
  }
  async localRelayFinancialConflicts():Promise<any[]>{
    if(!this.activeGroupId)return[];return await this.cached<any[]>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/eco-relay/conflicts')??[];
  }
  async ecoRelayFerryPackets():Promise<any[]>{
    if(!this.activeGroupId)return[];const rows=await this.cached<any[]>(this.relayFerryPath(this.activeGroupId))??[],now=Date.now();
    return rows.filter(x=>x?.protocol==='ECO_FERRY_1'&&x.groupId===this.activeGroupId&&Date.parse(String(x.expiresAt??''))>now).slice(-300);
  }
  private async storeEcoRelayFerryPackets(packets:any[]):Promise<number>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const existing=await this.ecoRelayFerryPackets(),map=new Map(existing.map(x=>[String(x.packetId),x]));let added=0;
    for(const packet of packets.slice(0,100)){
      if(packet?.protocol!=='ECO_FERRY_1'||packet.groupId!==this.activeGroupId||!packet.packetId||!packet.recipientMembershipId||!packet.capsule||Date.parse(String(packet.expiresAt??''))<=Date.now())continue;
      if(!map.has(String(packet.packetId)))added++;map.set(String(packet.packetId),structuredClone(packet));
    }
    await this.saveCached(this.relayFerryPath(this.activeGroupId),[...map.values()].slice(-300),'RELAY');return added;
  }
  async prepareManagerFerryPackets():Promise<{packets:any[];included:string[];unpaired:string[]}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const full=await this.localRoomManagerDelta(),members=await this.listMembers(),included:string[]=[],unpaired:string[]=[],packets:any[]=[];
    // Internet ferry is deliberately compact. Direct Eco Local can carry the
    // full manager delta; the server mailbox gets only a bounded encrypted slice
    // so one brief mobile-data session benefits the group without megabyte uploads.
    const budget=90000,commands:any[]=[],structuralSnapshots:any[]=[];let used=JSON.stringify({...full,commands:[],structuralSnapshots:[]}).length;
    for(const item of (full.commands??[]).slice(-500).reverse()){
      const size=JSON.stringify(item).length;if(used+size>budget)break;commands.unshift(item);used+=size;
    }
    for(const snap of (full.structuralSnapshots??[])){
      const size=JSON.stringify(snap).length;if(used+size>budget)continue;structuralSnapshots.push(snap);used+=size;
    }
    const delta={...full,commands,structuralSnapshots,transportProfile:'FERRY_COMPACT_V1',fullCommandCount:Number(full.commands?.length??0),fullStructuralCount:Number(full.structuralSnapshots?.length??0)};
    const managerRoles=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
    for(const member of members.filter(x=>x.status==='active'&&(x.roles??[]).some(r=>managerRoles.has(String(r).toLowerCase()))&&x.userId!==this.actorId)){
      const key=await this.sovereign.relayKey(this.tenantId,this.activeGroupId,member.id);if(!key){unpaired.push(member.id);continue;}
      const expiresAt=new Date(Date.now()+7*24*3600_000).toISOString(),capsule:EcoMemberCapsule={protocolVersion:1,groupId:this.activeGroupId,membershipId:member.id,generatedAt:new Date().toISOString(),expiresAt,projection:{kind:'ECO_MANAGER_DELTA_2',delta},schemaVersion:1,sourceAuthorityId:this.actorId,sourceDeviceId:this.localDeviceId()};
      const material:EcoRelayPairingMaterial={protocolVersion:1,membershipId:member.id,keyId:key.keyId,rawKey:key.rawKey,createdAt:key.createdAt},encrypted=await encryptMemberCapsule(capsule,material),bundle=createBroadcastBundle(this.activeGroupId,[encrypted],7*24*60);
      packets.push({protocol:'ECO_FERRY_1',packetId:bundle.transferId+'-'+encrypted.keyId,groupId:this.activeGroupId,recipientMembershipId:member.id,keyId:encrypted.keyId,createdAt:bundle.generatedAt,expiresAt:bundle.expiresAt,capsule:encrypted,sourceActorId:this.actorId});included.push(member.id);
    }
    await this.storeEcoRelayFerryPackets(packets);return{packets,included,unpaired};
  }
  async receiveEcoRelayFerryPackets(packets:any[]):Promise<{stored:number;applied:number}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const stored=await this.storeEcoRelayFerryPackets(packets),members=await this.listMembers(),own=members.find(x=>x.userId===this.actorId&&x.status!=='left');let applied=0;
    if(own){
      const key=await this.sovereign.relayKey(this.tenantId,this.activeGroupId,own.id);
      if(key){
        const material:EcoRelayPairingMaterial={protocolVersion:1,membershipId:own.id,keyId:key.keyId,rawKey:key.rawKey,createdAt:key.createdAt};
        for(const packet of packets){
          if(packet?.protocol!=='ECO_FERRY_1'||packet.groupId!==this.activeGroupId||packet.recipientMembershipId!==own.id||packet.keyId!==key.keyId)continue;
          try{const capsule=await decryptMemberCapsule(this.activeGroupId,packet.capsule,material,packet.expiresAt),projection:any=capsule.projection;if(projection?.kind==='ECO_MANAGER_DELTA_2'&&projection.delta){await this.importLocalRoomManagerDelta(projection.delta);applied++;}}catch{}
        }
      }
    }
    return{stored,applied};
  }
  async syncEcoRelayFerry():Promise<{uploaded:number;downloaded:number;applied:number;skipped?:boolean}>{
    if(!this.activeGroupId||this.serverBudgetBlocked()||typeof navigator!=='undefined'&&navigator.onLine===false)return{uploaded:0,downloaded:0,applied:0,skipped:true};
    const local=await this.ecoRelayFerryPackets(),knownPacketIds=local.map(x=>String(x.packetId)).slice(-500),uploads=local.filter(x=>!x.serverSyncedAt).slice(0,6).map(({serverSyncedAt,...x})=>x);
    const result=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/relay/ferry-sync',{method:'POST',body:JSON.stringify({packets:uploads,knownPacketIds})});
    const accepted=new Set((result.acceptedIds??[]).map(String)),stamp=new Date().toISOString(),updated=local.map(x=>accepted.has(String(x.packetId))?{...x,serverSyncedAt:stamp}:x);
    await this.saveCached(this.relayFerryPath(this.activeGroupId),updated,'RELAY');const received=await this.receiveEcoRelayFerryPackets(Array.isArray(result.packets)?result.packets:[]);
    return{uploaded:accepted.size,downloaded:Array.isArray(result.packets)?result.packets.length:0,applied:received.applied};
  }
  async localRoomMemberBundle(membershipId:string,meetingId?:string):Promise<EcoBroadcastBundle>{
    const result=await this.prepareEcoBroadcast({meetingId,membershipIds:[membershipId],ttlMinutes:60});return result.bundle;
  }
  private vaultRecoveryPath(groupId:string):string{return 'local://vault-recovery/'+encodeURIComponent(groupId);}
  private vaultRecoveryId(groupId:string):string{return JSON.stringify([this.actorId,this.tenantId,'VAULT_RECOVERY',groupId]);}
  private async recoverInterruptedVaultRestores():Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported())return;
    const rows=await this.readSnapshots.listForActorTenant(this.actorId,this.tenantId),markers=rows.filter(x=>x.path.startsWith('local://vault-recovery/'));
    for(const marker of markers){
      const b=marker.body as any;if(b?.protocol!=='ECO_VAULT_RECOVERY_1'||!b.groupId){await this.readSnapshots.remove(marker.id).catch(()=>{});continue;}
      await this.sovereign.replaceGroupState(this.tenantId,String(b.groupId),Array.isArray(b.eventsBefore)?b.eventsBefore:[],Array.isArray(b.relayKeysBefore)?b.relayKeysBefore:[]);
      await this.readSnapshots.applyAtomic({save:Array.isArray(b.snapshotBackups)?b.snapshotBackups:[],removeIds:Array.isArray(b.snapshotNewIds)?b.snapshotNewIds:[]});
      const prior=Array.isArray(b.outboxBefore)?b.outboxBefore:[];this.outbox.restore(prior);if(IndexedDbOutboxAdapter.supported())await this.outboxStorage.replaceForIdentity(this.actorId,this.tenantId,prior);
      await this.readSnapshots.remove(marker.id);
    }
  }
  private async validateOpenedVault(opened:{snapshot:SovereignSnapshot;events:any[];relayKeys:any[]}):Promise<{groupId:string;state:any;snapshots:any[];outbox:any[]}>{
    const snapshot=opened.snapshot;if(!snapshot?.tenantId||!snapshot?.groupId||!snapshot?.state)throw Error('VAULT_PAYLOAD_INVALID');
    const groupId=String(snapshot.groupId),state=snapshot.state as any,snapshots=Array.isArray(state.snapshots)?state.snapshots:[],outbox=Array.isArray(state.outbox)?state.outbox:[];
    if(snapshots.length>10000||opened.events.length>250000||opened.relayKeys.length>10000||outbox.length>50000)throw Error('VAULT_TOO_LARGE');
    await validateSovereignJournalEvents(snapshot.tenantId,groupId,opened.events as any[]);
    const enc=encodeURIComponent(groupId);
    for(const row of snapshots){const path=String(row?.path??'');if(!path||!(path==='/api/v1/groups'||path.includes('/groups/'+enc+'/')||path.includes('/groups/'+groupId+'/')||path.includes('/relay/member-capsule/'+enc+'/')||path.includes('/relay/seen-transfers/'+enc+'/')))throw Error('VAULT_SNAPSHOT_SCOPE_INVALID');}
    for(const key of opened.relayKeys)if(String(key?.tenantId??'')!==snapshot.tenantId||String(key?.groupId??'')!==groupId||!key?.membershipId||!key?.keyId||!key?.rawKey)throw Error('VAULT_RELAY_KEY_SCOPE_INVALID');
    return{groupId,state,snapshots,outbox};
  }
  async exportEcoVault(passphrase:string):Promise<string>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const groupId=this.activeGroupId,allSnapshots=await this.readSnapshots.listForActorTenant(this.actorId,this.tenantId),encoded=encodeURIComponent(groupId);
    const selected=allSnapshots.filter(x=>x.path==='/api/v1/groups'||x.path.includes('/groups/'+encoded+'/')||x.path.includes('/groups/'+groupId+'/')||x.path.includes('/relay/member-capsule/'+encoded+'/')||x.path.includes('/relay/seen-transfers/'+encoded+'/')).map(x=>x.path==='/api/v1/groups'?{...x,body:Array.isArray(x.body)?(x.body as any[]).filter(g=>g.id===groupId):x.body}:x);
    const journal=await this.sovereign.list(this.tenantId,groupId),keys=await this.sovereign.relayKeys(this.tenantId,groupId),snapshot:SovereignSnapshot={tenantId:this.tenantId,groupId,exportedAt:new Date().toISOString(),appVersion:'1.5.2.9-sovereign-offline',state:{actorId:this.actorId,snapshots:selected,outbox:this.outbox.list().filter(x=>String((x.payload as any)?.groupId??'')===groupId)}};
    return createEcoVault(passphrase,snapshot,journal,keys);
  }
  async inspectEcoVault(passphrase:string,encoded:string):Promise<{tenantId:string;groupId:string;exportedAt:string;events:number;snapshots:number;relayKeys:number}>{
    const opened=await openEcoVault(passphrase,encoded),checked=await this.validateOpenedVault(opened);
    return{tenantId:opened.snapshot.tenantId,groupId:checked.groupId,exportedAt:opened.snapshot.exportedAt,events:opened.events.length,snapshots:checked.snapshots.length,relayKeys:opened.relayKeys.length};
  }
  async restoreEcoVault(passphrase:string,encoded:string):Promise<{groupId:string;events:number;snapshots:number;outbox:number}>{
    const opened=await openEcoVault(passphrase,encoded),checked=await this.validateOpenedVault(opened);if(opened.snapshot.tenantId!==this.tenantId)throw Error('VAULT_TENANT_MISMATCH');
    const groupId=checked.groupId,currentEvents=await this.sovereign.list(this.tenantId,groupId),currentKeys=await this.sovereign.relayKeys(this.tenantId,groupId),min=Math.min(currentEvents.length,opened.events.length);
    for(let i=0;i<min;i++)if(currentEvents[i]?.hash!==opened.events[i]?.hash)throw Error('VAULT_JOURNAL_DIVERGENCE');
    const mergedEvents=currentEvents.length>=opened.events.length?currentEvents:opened.events;
    const keyMap=new Map(opened.relayKeys.map((x:any)=>[String(x.membershipId),x]));for(const key of currentKeys){const old=keyMap.get(key.membershipId) as any;if(!old||String(key.createdAt)>=String(old.createdAt))keyMap.set(key.membershipId,key);}const mergedKeys=[...keyMap.values()] as any[];
    const targetSaves:Array<{id:string;actorId:string;tenantId:string;path:string;body:unknown}>=[],snapshotBackups:Array<{id:string;actorId:string;tenantId:string;path:string;body:unknown}>=[],snapshotNewIds:string[]=[];
    for(const row of checked.snapshots){
      const path=String(row.path),id=path==='/api/v1/groups'?JSON.stringify([this.actorId,this.homeTenantId??this.tenantId,'ACCOUNT',path]):JSON.stringify([this.actorId,this.tenantId,groupId,path]),current=await this.readSnapshots.get<any>(id),sourceUpdated=String(row.updatedAt??opened.snapshot.exportedAt??'');
      let body=row.body;
      if(path==='/api/v1/groups'){const byId=new Map<string,any>();for(const g of Array.isArray(current?.body)?current!.body:[])if(g?.id)byId.set(g.id,g);for(const g of Array.isArray(row.body)?row.body:[])if(g?.id)byId.set(g.id,g);body=[...byId.values()];}
      else if(current&&sourceUpdated&&String(current.updatedAt)>sourceUpdated)continue;
      if(current)snapshotBackups.push({id:current.id,actorId:current.actorId,tenantId:current.tenantId,path:current.path,body:current.body});else snapshotNewIds.push(id);
      targetSaves.push({id,actorId:this.actorId,tenantId:path==='/api/v1/groups'?(this.homeTenantId??this.tenantId):this.tenantId,path,body});
    }
    const rank=(x:any)=>x?.status==='CONFIRMED'?3:x?.status==='CANCELLED'?2:1,outboxMap=new Map<string,any>();
    for(const item of checked.outbox){if(item?.actorId===this.actorId&&item?.tenantId===this.tenantId)outboxMap.set(String(item.idempotencyKey??item.id),item);}
    for(const item of this.outbox.list()){const k=String(item.idempotencyKey??item.id),old=outboxMap.get(k);if(!old||rank(item)>rank(old)||String(item.updatedAt??item.createdAt??'')>=String(old.updatedAt??old.createdAt??''))outboxMap.set(k,item);}
    const mergedOutbox=[...outboxMap.values()],outboxBefore=this.outbox.list(),markerId=this.vaultRecoveryId(groupId),markerPath=this.vaultRecoveryPath(groupId);
    await this.readSnapshots.save({id:markerId,actorId:this.actorId,tenantId:this.tenantId,path:markerPath,body:{protocol:'ECO_VAULT_RECOVERY_1',groupId,eventsBefore:currentEvents,relayKeysBefore:currentKeys,snapshotBackups,snapshotNewIds,outboxBefore}});
    try{
      await this.sovereign.replaceGroupState(this.tenantId,groupId,mergedEvents as any[],mergedKeys as any[]);
      await this.readSnapshots.applyAtomic({save:targetSaves});
      this.outbox.restore(mergedOutbox);if(IndexedDbOutboxAdapter.supported())await this.outboxStorage.replaceForIdentity(this.actorId,this.tenantId,mergedOutbox);
      this.groupTenants.set(groupId,this.tenantId);this.selectGroup(groupId);await this.readSnapshots.remove(markerId);
      return{groupId,events:mergedEvents.length,snapshots:targetSaves.length,outbox:mergedOutbox.length};
    }catch(error){
      await this.sovereign.replaceGroupState(this.tenantId,groupId,currentEvents,currentKeys).catch(()=>{});await this.readSnapshots.applyAtomic({save:snapshotBackups,removeIds:snapshotNewIds}).catch(()=>{});this.outbox.restore(outboxBefore);if(IndexedDbOutboxAdapter.supported())await this.outboxStorage.replaceForIdentity(this.actorId,this.tenantId,outboxBefore).catch(()=>{});await this.readSnapshots.remove(markerId).catch(()=>{});throw error;
    }
  }
  async memberEnvelope(meetingId:string,membershipId?:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const q=membershipId?'?membershipId='+encodeURIComponent(membershipId):'';
    return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/member-envelope${q}`);
  }
  async financialNotices(membershipId:string):Promise<any[]>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members/${encodeURIComponent(membershipId)}/financial-notices`);}
  async confirmFinancialNotice(noticeId:string,membershipId?:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/financial-notices/${encodeURIComponent(noticeId)}/confirm`,{method:'POST',body:'{}'});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    if(!membershipId)throw Error('MEMBERSHIP_REQUIRED_FOR_OFFLINE_ACTION');
    const updated=await this.patchCachedFinancialNotice(membershipId,noticeId,{memberState:'MEMBER_CONFIRMED'});
    await this.queueLocal('FINANCIAL_NOTICE_CONFIRM_V1',{groupId:this.activeGroupId,noticeId,membershipId},'notice-confirm:'+noticeId);return updated;
  }
  async reserveFinancialNotice(noticeId:string,reason:string,membershipId?:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const clean=reason.trim();if(!clean)throw Error('RESERVE_REASON_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/financial-notices/${encodeURIComponent(noticeId)}/reserve`,{method:'POST',body:JSON.stringify({reason:clean})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    if(!membershipId)throw Error('MEMBERSHIP_REQUIRED_FOR_OFFLINE_ACTION');
    const updated=await this.patchCachedFinancialNotice(membershipId,noticeId,{disputeState:'MEMBER_RESERVE',reserveReason:clean});
    await this.queueLocal('FINANCIAL_NOTICE_RESERVE_V1',{groupId:this.activeGroupId,noticeId,membershipId,reason:clean},'notice-reserve:'+noticeId+':'+await this.sha256Hex(clean));return{notice:updated,case:{localPending:true}};
  }
  async officerReviewFinancialNotice(noticeId:string,note:string,membershipId?:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const clean=note.trim()||'Validation après vérification';
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/financial-notices/${encodeURIComponent(noticeId)}/officer-review`,{method:'POST',body:JSON.stringify({note:clean})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    if(!membershipId)throw Error('MEMBERSHIP_REQUIRED_FOR_OFFLINE_ACTION');
    const updated=await this.patchCachedFinancialNotice(membershipId,noticeId,{disputeState:'OFFICER_CONFIRMED',officerId:this.actorId,officerNote:clean});
    await this.queueLocal('FINANCIAL_NOTICE_OFFICER_REVIEW_V1',{groupId:this.activeGroupId,noticeId,membershipId,note:clean},'notice-officer:'+noticeId+':'+this.actorId+':'+await this.sha256Hex(clean));return updated;
  }
  async memberReviewFinancialNotice(noticeId:string,decision:'APPROVE_AFTER_REVIEW'|'MAINTAIN_RESERVE',note='',membershipId?:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const clean=note.trim(),disputeState=decision==='APPROVE_AFTER_REVIEW'?'MEMBER_APPROVED_AFTER_REVIEW':'MEMBER_RESERVE_MAINTAINED';
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/financial-notices/${encodeURIComponent(noticeId)}/member-review`,{method:'POST',body:JSON.stringify({decision,note:clean})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    if(!membershipId)throw Error('MEMBERSHIP_REQUIRED_FOR_OFFLINE_ACTION');
    const updated=await this.patchCachedFinancialNotice(membershipId,noticeId,{disputeState,memberReviewNote:clean||undefined});
    await this.queueLocal('FINANCIAL_NOTICE_MEMBER_REVIEW_V1',{groupId:this.activeGroupId,noticeId,membershipId,decision,note:clean},'notice-member-review:'+noticeId+':'+decision+':'+await this.sha256Hex(clean));return updated;
  }

  async memberFinancialHistory(membershipId:string,cursor?:string,limit=50):Promise<{items:any[];nextCursor?:string|null;hasMore:boolean;pageSize:number;total:number}>{
    if(!this.activeGroupId)return{items:[],nextCursor:null,hasMore:false,pageSize:0,total:0};
    const p=new URLSearchParams({limit:String(limit)});if(cursor)p.set('cursor',cursor);
    return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/members/'+encodeURIComponent(membershipId)+'/financial-history?'+p.toString());
  }
  async memberStatement(membershipId:string):Promise<import('../../contracts/src/index.js').MemberStatement>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members/${encodeURIComponent(membershipId)}/statement`);}
  async groupMe():Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/me`,key='eco.groupMe.v1:'+this.actorId+':'+this.activeGroupId;
    try{
      const result=await this.request<any>(path);
      if(result?.membership||result?.isManager){try{localStorage.setItem(key,JSON.stringify({...result,savedAt:new Date().toISOString()}));}catch{}}
      return result;
    }catch(error){
      try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&(saved.membership||saved.isManager))return saved;}catch{}
      const cached=await this.cached<any>(path);if(cached)return cached;throw error;
    }
  }
  async globalRecap():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/recap/global`);}
  async memberOperationalSheet(membershipId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members/${encodeURIComponent(membershipId)}/operational-sheet`);}
  async authenticate(mode:'login'|'register',input:{username:string;password:string;displayName?:string;rememberDevice?:boolean}):Promise<void>{
    const localFlow=async()=>{
      if(!IndexedDbLocalAuthAdapter.supported())throw Error('LOCAL_AUTH_UNAVAILABLE');
      const local=mode==='register'
        ? await this.localAuth.register({username:input.username,password:input.password,displayName:input.displayName??'',locale:this.locale})
        : await this.localAuth.login(input.username,input.password);
      await this.seedLocalAccount(local);this.selectGroup(undefined);
    };
    if(typeof navigator!=='undefined'&&navigator.onLine===false){await localFlow();return;}
    try{
      const result=await this.serverAuthenticate(mode,input);if(!result.authenticated||!result.account)throw Error('AUTHENTICATION_REQUIRED');
      this.actorId=result.account.id;this.homeTenantId=result.account.tenantId;this.tenantId=result.account.tenantId;this.displayName=result.account.displayName;this.usingOfflineSnapshot=false;
      // A successful online authentication becomes an offline-capable credential on this device.
      // Only a salted PBKDF2 verifier is persisted; the clear password is never stored.
      try{
        const mirror=await this.localAuth.rememberServerAccount({username:result.account.username,password:input.password,displayName:result.account.displayName,locale:result.account.locale,serverActorId:result.account.id,serverTenantId:result.account.tenantId});
        await this.saveCached('/api/v1/auth/session',{authenticated:true,account:result.account,local:true,registrationState:mirror.registrationState});
      }catch{}
    }catch(error){
      if(error instanceof Error&&error.message==='NETWORK_UNAVAILABLE'){await localFlow();return;}
      throw error;
    }
  }
  async claimLocalAccount(password:string):Promise<{account:SessionAccount;synced:number;pending:number}>{
    const local=await this.localAuth.current();if(!local||local.registrationState!=='LOCAL_PENDING_REGISTRATION')throw Error('LOCAL_ACCOUNT_NOT_PENDING');
    if(typeof navigator!=='undefined'&&navigator.onLine===false)throw Error('NETWORK_UNAVAILABLE');
    let server:{authenticated:boolean;account:SessionAccount};
    try{server=await this.serverAuthenticate('register',{username:local.username,password,displayName:local.displayName});}
    catch(error){
      if(!(error instanceof Error)||error.message!=='ACCOUNT_UNAVAILABLE')throw error;
      server=await this.serverAuthenticate('login',{username:local.username,password});
    }
    if(!server.authenticated||!server.account)throw Error('AUTHENTICATION_REQUIRED');
    const oldActor=local.id,oldTenant=local.tenantId,next=server.account;
    let journal=await this.identityMigration.begin({oldActorId:oldActor,oldTenantId:oldTenant,newActorId:next.id,newTenantId:next.tenantId});
    const done=(step:string)=>journal.steps.includes(step as any);
    try{
      if(!done('SNAPSHOTS_MIGRATED')){await this.readSnapshots.migrateIdentity(oldActor,oldTenant,next.id,next.tenantId);journal=await this.identityMigration.mark(oldActor,oldTenant,'SNAPSHOTS_MIGRATED');}
      let migrated=await this.outboxStorage.load();
      if(!done('OUTBOX_MIGRATED')){migrated=await this.outboxStorage.migrateIdentity(oldActor,oldTenant,next.id,next.tenantId);journal=await this.identityMigration.mark(oldActor,oldTenant,'OUTBOX_MIGRATED');}
      else migrated=migrated.filter(x=>x.actorId===next.id&&x.tenantId===next.tenantId);
      if(!done('LOCAL_ACCOUNT_BOUND')){await this.localAuth.markClaimed(local.id,{id:next.id,tenantId:next.tenantId});journal=await this.identityMigration.mark(oldActor,oldTenant,'LOCAL_ACCOUNT_BOUND');}
      this.actorId=next.id;this.homeTenantId=next.tenantId;this.tenantId=next.tenantId;this.displayName=next.displayName;this.locale=next.locale;this.usingOfflineSnapshot=false;
      this.outbox.restore(migrated);await this.saveCached('/api/v1/auth/session',{authenticated:true,account:next,local:true,registrationState:'SERVER_CLAIMED'});
      if(!done('SESSION_ADOPTED'))journal=await this.identityMigration.mark(oldActor,oldTenant,'SESSION_ADOPTED');
      const syncedRows=await this.syncOutbox(),pending=syncedRows.filter(x=>x.status!=='CONFIRMED').length;
      await this.identityMigration.mark(oldActor,oldTenant,'COMPLETED');
      return{account:next,synced:syncedRows.length-pending,pending};
    }catch(error){await this.identityMigration.fail(oldActor,oldTenant,error).catch(()=>{});throw error;}
  }
  async localAccountInfo():Promise<{username:string;displayName:string;registrationState:string}|undefined>{const local=await this.localAuth.current();return local?{username:local.username,displayName:local.displayName,registrationState:local.registrationState}:undefined;}
  async logout():Promise<void>{
    try{if(typeof navigator==='undefined'||navigator.onLine!==false)await this.request('/api/v1/auth/logout',{method:'POST',body:'{}'});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    try{await this.localAuth.logout();}catch{}this.outbox.restore([]);this.selectGroup(undefined);this.usingOfflineSnapshot=false;try{await this.readSnapshots.remove('session:last');}catch{}
  }

  setLocale(locale:string):void{this.locale=locale==='en'?'en':'fr';try{localStorage.setItem('tontine.locale',this.locale);}catch{}}
  setConnectivity(_connectivity:'online'|'offline'|'degraded'):void{}
  selectGroup(groupId?:string):void{const before=this.activeGroupId;this.activeGroupId=groupId;this.tenantId=(groupId?this.groupTenants.get(groupId):undefined)??this.homeTenantId??this.tenantId;if(before!==groupId){this.financialClockAnchor=undefined;if(groupId&&typeof window!=='undefined')void this.warmFinancialClock();}try{if(groupId)localStorage.setItem('tontine.activeGroupId',groupId);else localStorage.removeItem('tontine.activeGroupId');}catch{}}
  activeGroup():string|undefined{return this.activeGroupId;}

  async analyzeGroupDocument(text:string):Promise<{fingerprint:string;suggestions:any[];requiresHumanConfirmation:boolean;financialWrites:boolean}>{return this.request('/api/v1/assistant/group-launch/analyze',{method:'POST',body:JSON.stringify({text})});}
  async analyzeGroupDocumentFiles(files:File[]):Promise<{combinedText:string;fingerprints:string[];files:any[];warnings:string[];suggestions:any[];requiresHumanConfirmation:boolean;financialWrites:boolean}>{
    const form=new FormData();for(const file of files)form.append('files',file,file.name);
    return this.request('/api/v1/assistant/group-launch/analyze-files',{method:'POST',body:form});
  }
  async interpretGroupLaunch(text:string):Promise<{draft:any;requiresHumanConfirmation:boolean;financialWrites:boolean}>{return this.request('/api/v1/assistant/group-launch/interpret',{method:'POST',body:JSON.stringify({text})});}

  async listGroups():Promise<Group[]>{const all=await this.request<Group[]>('/api/v1/groups');this.groupTenants=new Map(all.map(g=>[g.id,g.tenantId]));return all.filter(g=>g.status!=='archived');}
  async groupOperatingPolicy():Promise<GroupOperatingPolicy>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/operating-policy`);}
  async updateGroupOperatingPolicy(policy:GroupOperatingPolicy):Promise<Group>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/operating-policy`,{method:'PUT',body:JSON.stringify(policy)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const groupId=this.activeGroupId,groups=await this.cached<Group[]>('/api/v1/groups')??[],current=groups.find(g=>g.id===groupId);if(!current)throw Error('GROUP_NOT_FOUND');
    const nextPolicy={...structuredClone(policy),version:Math.max(Number(current.operatingPolicy?.version??0)+1,Number(policy.version??1)),updatedAt:new Date().toISOString(),updatedBy:this.actorId};
    const group={...current,operatingPolicy:nextPolicy};await this.saveCached(`/api/v1/groups/${encodeURIComponent(groupId)}/operating-policy`,nextPolicy);
    await this.saveCached('/api/v1/groups',groups.map(g=>g.id===groupId?group:g));await this.queueLocal('GROUP_POLICY_V1',{groupId,policy:nextPolicy});
    return group;
  }
  async listRubrics():Promise<RubricDefinition[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`);}
  async ensureOfficialLoanRubric():Promise<RubricDefinition>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const rows=await this.listRubrics(),normalize=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const existing=rows.find(r=>String(r.facets?.custom?.systemKey??'')==='LOAN'||['pret','prets','loan','loans'].includes(normalize(r.name)));
    if(existing)return existing;
    const groupId=this.activeGroupId,id='rubric_core_loan_'+groupId,stamp=new Date().toISOString();
    const facets={direction:'OUTFLOW',obligation:'EVENT_DRIVEN',medium:'CASH',refundability:'NOT_APPLICABLE',replenishment:'EVENT_DRIVEN',interestMode:'RATE',eligibilityMode:'RULE_BASED',fundCode:'LOAN_RECEIVABLE',custom:{systemKey:'LOAN',financialSign:-1}} as const;
    const operatingModel:RubricOperatingModel={writtenRule:'Le prêt est une sortie de caisse du groupe et crée une créance sur le membre.',observedPractice:'Capital restant et intérêts sont suivis séparément.',effectiveRuleSummary:'Décaissement négatif pour la caisse ; remboursement positif ; aucun intérêt sur intérêt.',ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false};
    if(this.isOffline()){
      const rubric:RubricDefinition={id,tenantId:this.tenantId,groupId,name:'Prêt',aliases:['Prêts','Loan'],purpose:'Prêts aux membres : capital, intérêts et remboursements.',facets:structuredClone(facets),operatingModel:structuredClone(operatingModel),status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:stamp,updatedAt:stamp};
      await this.patchCachedArray<RubricDefinition>(`/api/v1/groups/${encodeURIComponent(groupId)}/rubrics`,items=>items.some(x=>x.id===id)?items:[...items,rubric]);
      await this.queueLocal('RUBRIC_CREATE_V1',{groupId,id,name:rubric.name,aliases:rubric.aliases,purpose:rubric.purpose,facets,source:'GROUP_CUSTOM',operatingModel},'ensure-loan-rubric:'+groupId);
      return rubric;
    }
    return this.request(`/api/v1/groups/${encodeURIComponent(groupId)}/rubrics`,{method:'POST',body:JSON.stringify({id,name:'Prêt',aliases:['Prêts','Loan'],purpose:'Prêts aux membres : capital, intérêts et remboursements.',facets,source:'GROUP_CUSTOM',operatingModel})});
  }
  async ensureOfficialRepaymentRubric():Promise<RubricDefinition>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const groupId=this.activeGroupId,rows=await this.listRubrics(),normalize=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const existing=rows.find(r=>String((r.facets as any)?.custom?.systemKey??'').toUpperCase()==='REPAYMENT'||['remboursement','remboursements','repayment','repayments'].includes(normalize(r.name))||(r.aliases??[]).some(a=>['remboursement','remboursements','repayment','repayments'].includes(normalize(String(a)))));
    if(existing&&existing.status!=='ARCHIVED')return existing;
    const path=`/api/v1/groups/${encodeURIComponent(groupId)}/rubrics`;
    if(existing&&existing.status==='ARCHIVED'){
      if(this.isOffline()){
        const restored={...existing,status:'ACTIVE' as const,version:Number(existing.version??0)+1,updatedAt:new Date().toISOString()};
        await this.saveCached(path,rows.map(r=>r.id===existing.id?restored:r));await this.queueLocal('RUBRIC_RESTORE_V1',{groupId,rubricId:existing.id},'restore-repayment:'+groupId+':'+existing.id);return restored;
      }
      const trash=await this.trashItems().catch(()=>[]),item=trash.find((x:any)=>String(x.data?.kind??'')==='RUBRIC'&&String(x.data?.entityId??'')===existing.id&&x.status==='ACTIVE');
      if(item){await this.restoreTrashItem(item.id);const refreshed=await this.listRubrics();return refreshed.find(r=>r.id===existing.id)??existing;}
    }
    const id='rubric_core_repayment_'+groupId,stamp=new Date().toISOString(),facets:any=starterRubricFacetsForName('Remboursements')??{direction:'INFLOW',obligation:'EVENT_DRIVEN',medium:'CASH',refundability:'NOT_APPLICABLE',replenishment:'EVENT_DRIVEN',interestMode:'NONE',eligibilityMode:'RULE_BASED',fundCode:'LOAN_RECEIVABLE',custom:{systemKey:'REPAYMENT',repaymentComponent:'PRINCIPAL'}};
    facets.custom={...(facets.custom??{}),systemKey:'REPAYMENT',repaymentComponent:String(facets.custom?.repaymentComponent??'PRINCIPAL')};
    const operatingModel:RubricOperatingModel={writtenRule:'Les remboursements de prêts sont des entrées du groupe distinctes du capital prêté et des intérêts encaissés.',observedPractice:'Le principal remboursé et les intérêts peuvent être saisis séparément selon les règles du groupe.',effectiveRuleSummary:'Remboursement positif ; imputation principal/intérêt explicite ; aucune fusion opaque.',ruleRealityStatus:'ALIGNED',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false};
    if(this.isOffline()){
      const rubric:RubricDefinition={id,tenantId:this.tenantId,groupId,name:'Remboursements',aliases:['Remboursement','Repayments'],purpose:'Remboursements de capital des prêts ; les intérêts restent identifiables séparément.',facets,operatingModel:structuredClone(operatingModel),status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:stamp,updatedAt:stamp};
      await this.patchCachedArray<RubricDefinition>(path,items=>items.some(x=>x.id===id)?items:[...items,rubric]);await this.queueLocal('RUBRIC_CREATE_V1',{groupId,id,name:rubric.name,aliases:rubric.aliases,purpose:rubric.purpose,facets,source:'GROUP_CUSTOM',operatingModel},'ensure-repayment-rubric:'+groupId);return rubric;
    }
    return this.request(path,{method:'POST',body:JSON.stringify({id,name:'Remboursements',aliases:['Remboursement','Repayments'],purpose:'Remboursements de capital des prêts ; les intérêts restent identifiables séparément.',facets,source:'GROUP_CUSTOM',operatingModel})});
  }

  async createRubric(input:{name:string;writtenRule?:string;observedPractice?:string;model:RubricOperatingModel}):Promise<RubricDefinition>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');
    const facets=starterRubricFacetsForName(input.name)??{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'} as const;
    const operatingModel={...input.model,writtenRule:input.writtenRule,observedPractice:input.observedPractice};
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`,{method:'POST',body:JSON.stringify({name:input.name,facets,source:'GROUP_CUSTOM',operatingModel})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const stamp=new Date().toISOString(),id=makeId('rubric'),rubric:RubricDefinition={id,tenantId:this.tenantId,groupId:this.activeGroupId,name:input.name.trim(),aliases:[],facets:structuredClone(facets),operatingModel:structuredClone(operatingModel),status:'DRAFT',source:'GROUP_CUSTOM',version:1,createdAt:stamp,updatedAt:stamp};
    await this.patchCachedArray<RubricDefinition>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`,rows=>rows.some(x=>x.id===id)?rows:[...rows,rubric]);
    await this.queueLocal('RUBRIC_CREATE_V1',{groupId:this.activeGroupId,id,name:rubric.name,facets,source:'GROUP_CUSTOM',operatingModel});
    return rubric;
  }
  async updateRubricOperatingModel(rubricId:string,model:RubricOperatingModel):Promise<RubricDefinition>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/operating-model`,{method:'PUT',body:JSON.stringify(model)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`,rows=await this.cached<RubricDefinition[]>(path)??[],current=rows.find(x=>x.id===rubricId);if(!current)throw Error('RUBRIC_NOT_FOUND');
    const confirmed={...structuredClone(model),confirmedAt:new Date().toISOString(),confirmedBy:this.actorId},updated={...current,operatingModel:confirmed,version:current.version+1,updatedAt:new Date().toISOString()};await this.saveCached(path,rows.map(x=>x.id===rubricId?updated:x));
    await this.queueLocal('RUBRIC_MODEL_V1',{groupId:this.activeGroupId,rubricId,model});return updated;
  }
  async updateRubricPolicies(rubricId:string,policies:any):Promise<RubricDefinition>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');
    const prepared=structuredClone(policies??{});
    if(prepared?.loan?.changeControl&&!prepared.loan.changeControl.commandId)prepared.loan.changeControl.commandId=makeId('loan_policy_change');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/policies`,{method:'PUT',body:JSON.stringify(prepared)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`,rows=await this.cached<RubricDefinition[]>(path)??[],current=rows.find(x=>x.id===rubricId);if(!current)throw Error('RUBRIC_NOT_FOUND');
    const updated={...current,policies:structuredClone(prepared),version:current.version+1,updatedAt:new Date().toISOString(),localActionPending:true};await this.saveCached(path,rows.map(x=>x.id===rubricId?updated:x));
    await this.queueLocal('RUBRIC_POLICIES_V1',{groupId:this.activeGroupId,rubricId,policies:prepared});return updated;
  }
  async previewRubricCycle(rubricId:string,input:{memberCount:number;collectedFromMembers:number;solidarityCoverageAmount?:number;beneficiaryDisbursement?:number}):Promise<RubricCyclePreview>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/preview-cycle`,{method:'POST',body:JSON.stringify(input)});}
  async updateMemberLifecycle(membershipId:string,input:{status?:string;roles?:string[];reason?:string;probationEndsAt?:string;historicalJoinedAt?:string;expectedRevision?:number}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/members/'+encodeURIComponent(membershipId)+'/lifecycle',{method:'PUT',body:JSON.stringify(input)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/members',rows=await this.cached<MembershipView[]>(path)??[],current=rows.find(x=>x.id===membershipId);if(!current)throw Error('MEMBERSHIP_NOT_FOUND');
    const expected=Number(input.expectedRevision??current.lifecycleRevision??0),actual=Number(current.lifecycleRevision??0);if(expected!==actual)throw Error('MEMBERSHIP_REVISION_CONFLICT');
    const updated:any={...current,status:input.status??current.status,roles:input.roles??current.roles,probationEndsAt:input.probationEndsAt??(current as any).probationEndsAt,historicalJoinedAt:input.historicalJoinedAt??(current as any).historicalJoinedAt,lifecycleRevision:actual+1,updatedAt:new Date().toISOString(),localActionPending:true};
    await this.saveCached(path,rows.map(x=>x.id===membershipId?updated:x));await this.queueLocal('MEMBER_LIFECYCLE_V1',{groupId:this.activeGroupId,membershipId,input:{...input,expectedRevision:expected}});return updated;
  }
  async updateMemberName(membershipId:string,displayName:string,reason:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const clean=displayName.trim(),why=reason.trim();if(!clean)throw Error('INVALID_DISPLAY_NAME');if(!why)throw Error('MEMBER_NAME_REASON_REQUIRED');
    if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/members/'+encodeURIComponent(membershipId)+'/name',{method:'PUT',body:JSON.stringify({displayName:clean,reason:why})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/members',rows=await this.cached<MembershipView[]>(path)??[],current=rows.find(x=>x.id===membershipId);if(!current)throw Error('MEMBERSHIP_NOT_FOUND');
    const updated:any={...current,displayName:clean,updatedAt:new Date().toISOString(),localActionPending:true};await this.saveCached(path,rows.map(x=>x.id===membershipId?updated:x));
    await this.queueLocal('MEMBER_NAME_V1',{groupId:this.activeGroupId,membershipId,displayName:clean,reason:why});return updated;
  }
  async listMembers():Promise<MembershipView[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`);}
  async listMeetings():Promise<MeetingSession[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings`);}
  async meetingHistory(meetingId:string):Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request<any>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/history`);return r.items??[];}
  async meetingAttendance(meetingId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/attendance`);}
  async recordMeetingAttendance(meetingId:string,input:{membershipId:string;attendance:'PRESENT'|'ABSENT'|'EXCUSED'|'REPRESENTED'|'LATE';note?:string}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/attendance`,{method:'POST',body:JSON.stringify(input)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/attendance`,id='attendance_'+encodeURIComponent(JSON.stringify([this.tenantId,this.activeGroupId,meetingId,input.membershipId])),stamp=new Date().toISOString();
    const members=await this.cached<MembershipView[]>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`)??[],displayName=members.find(x=>x.id===input.membershipId)?.displayName??input.membershipId;
    const previous=(await this.cached<any[]>(path)??[]).find(x=>x.id===id),record={id,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:'MEETING.ATTENDANCE',title:'Présence · '+meetingId,summary:input.note?.trim()||undefined,status:'ACTIVE',tags:['attendance','meeting:'+meetingId,'member:'+input.membershipId],data:{meetingId,membershipId:input.membershipId,attendance:input.attendance,note:input.note?.trim()||null,updatedBy:this.actorId},createdBy:previous?.createdBy??this.actorId,createdAt:previous?.createdAt??stamp,updatedAt:stamp,displayName};
    await this.patchCachedArray<any>(path,rows=>[...rows.filter(x=>x.id!==id),record]);await this.queueLocal('MEETING_ATTENDANCE_V1',{groupId:this.activeGroupId,meetingId,...input});return record;
  }
  async meetingBeneficiaries(meetingId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/beneficiaries`);}
  async declareMeetingBeneficiary(meetingId:string,input:{membershipId:string;rubricId?:string;amount:number;currency?:string;note?:string}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/beneficiaries`,{method:'POST',body:JSON.stringify(input)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    if(!Number.isSafeInteger(input.amount)||input.amount<0)throw Error('INVALID_BENEFIT_AMOUNT');
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/beneficiaries`,id='benefit_decl_'+encodeURIComponent(JSON.stringify([this.tenantId,this.activeGroupId,meetingId,input.membershipId,input.rubricId??''])),stamp=new Date().toISOString();
    const previous=(await this.cached<any[]>(path)??[]).find(x=>x.id===id);if(previous?.status==='DONE')throw Error('BENEFIT_ALREADY_RECEIPTED');
    const members=await this.cached<MembershipView[]>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`)??[],displayName=members.find(x=>x.id===input.membershipId)?.displayName??input.membershipId;
    const record={id,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:'MEETING.BENEFICIARIES',title:'Bénéficiaire déclaré',summary:input.note?.trim()||undefined,status:'ACTIVE',tags:['beneficiary','pending-evidence','meeting:'+meetingId,'member:'+input.membershipId],data:{meetingId,membershipId:input.membershipId,rubricId:input.rubricId??null,amount:input.amount,currency:input.currency??'XAF',proofCode:previous?.data?.proofCode??('ECO-RCP-LOCAL-'+makeId('proof').slice(-8).toUpperCase()),evidenceId:null,declaredBy:this.actorId},createdBy:previous?.createdBy??this.actorId,createdAt:previous?.createdAt??stamp,updatedAt:stamp,displayName};
    await this.patchCachedArray<any>(path,rows=>[...rows.filter(x=>x.id!==id),record]);await this.queueLocal('MEETING_BENEFIT_V1',{groupId:this.activeGroupId,meetingId,...input,currency:input.currency??'XAF'});return record;
  }
  async meetingBenefitEvidence(meetingId:string):Promise<EvidenceRecord[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/beneficiary-evidence`);}
  async recordMeetingBenefitEvidence(meetingId:string,input:{declarationId:string;membershipId:string;rubricId?:string;amount?:number;currency?:string;method:'MEMBER_CONFIRMATION'|'PAPER_EMARGEMENT'|'PHOTO_DOCUMENT';artifactKey?:string;fingerprint?:string;note?:string;idempotencyKey?:string}):Promise<EvidenceRecord>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/beneficiary-evidence`,{method:'POST',body:JSON.stringify(input)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    if(input.method==='PHOTO_DOCUMENT'&&!input.artifactKey)throw Error('OFFLINE_EVIDENCE_FILE_REQUIRES_ONLINE_UPLOAD');
    const key=input.idempotencyKey?.trim()||makeId('benefit_evidence'),path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/beneficiary-evidence`,id='evidence_benefit_'+encodeURIComponent(JSON.stringify([this.tenantId,this.activeGroupId,meetingId,input.membershipId,input.rubricId??'',input.declarationId,key])),stamp=new Date().toISOString();
    const existing=(await this.cached<EvidenceRecord[]>(path)??[]).find(x=>x.id===id);if(existing)return existing;
    const evidence:EvidenceRecord={id,tenantId:this.tenantId,type:'MEETING_BENEFIT_RECEIPT',subjectType:'meeting_benefit',subjectId:'meeting_benefit_'+encodeURIComponent(JSON.stringify([this.activeGroupId,meetingId,input.membershipId,input.rubricId??'',input.declarationId,key])),createdAt:stamp,createdBy:this.actorId,data:{groupId:this.activeGroupId,meetingId,declarationId:input.declarationId,membershipId:input.membershipId,rubricId:input.rubricId??null,amount:input.amount??0,currency:input.currency??'XAF',method:input.method,artifactKey:input.artifactKey??null,fingerprint:input.fingerprint??null,note:input.note?.trim()||null,idempotencyKey:key,memberSelfConfirmed:input.method==='MEMBER_CONFIRMATION'},immutable:true};
    await this.patchCachedArray<EvidenceRecord>(path,rows=>[...rows,evidence]);
    const declarationsPath=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/beneficiaries`;
    await this.patchCachedArray<any>(declarationsPath,rows=>rows.map(x=>x.id===input.declarationId?{...x,status:'DONE',tags:[...new Set([...(x.tags??[]).filter((t:string)=>t!=='pending-evidence'),'evidence-recorded'])],data:{...x.data,evidenceId:id,evidenceMethod:input.method},updatedAt:stamp}:x));
    await this.queueLocal('MEETING_BENEFIT_EVIDENCE_V1',{groupId:this.activeGroupId,meetingId,...input,idempotencyKey:key},key);return evidence;
  }
  async uploadMeetingBenefitEvidence(meetingId:string,file:File):Promise<{artifactKey:string;fingerprint:string;name:string;size:number;contentType:string}>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const form=new FormData();form.append('file',file);return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/beneficiary-evidence/upload`,{method:'POST',body:form});}
  async openMeeting(input:string|{title?:string;scheduledAt?:string;location?:string;theme?:string;dressCode?:string}):Promise<MeetingSession>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');const body=typeof input==='string'?{title:input}:input;
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings`,{method:'POST',body:JSON.stringify(body)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const stamp=new Date().toISOString(),id=makeId('meeting'),meeting:MeetingSession={id,tenantId:this.tenantId,groupId:this.activeGroupId,title:body.title?.trim()||'MEETING_DEFAULT_TITLE',status:'open',openedBy:this.actorId,openedAt:stamp,scheduledAt:body.scheduledAt?new Date(body.scheduledAt).toISOString():undefined,location:body.location?.trim()||undefined,theme:body.theme?.trim()||undefined,dressCode:body.dressCode?.trim()||undefined};
    await this.patchCachedArray<MeetingSession>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings`,rows=>rows.some(x=>x.id===id)?rows:[...rows,meeting]);
    await this.queueLocal('MEETING_OPEN_V1',{...meeting},id);return meeting;
  }
  async updateMeetingContext(meetingId:string,input:{scheduledAt?:string|null;location?:string|null;theme?:string|null;dressCode?:string|null}):Promise<MeetingSession>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/context`,{method:'PUT',body:JSON.stringify(input)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings`,rows=await this.cached<MeetingSession[]>(path)??[],current=rows.find(x=>x.id===meetingId);if(!current)throw Error('MEETING_NOT_FOUND');
    const clean=(value:string|null|undefined,currentValue:string|undefined)=>value===undefined?currentValue:value===null?undefined:(value.trim()||undefined);
    const updated:MeetingSession={...current,scheduledAt:input.scheduledAt===undefined?current.scheduledAt:input.scheduledAt===null?undefined:new Date(input.scheduledAt).toISOString(),location:clean(input.location,current.location),theme:clean(input.theme,current.theme),dressCode:clean(input.dressCode,current.dressCode)};
    await this.saveCached(path,rows.map(x=>x.id===meetingId?updated:x));await this.queueLocal('MEETING_CONTEXT_V1',{groupId:this.activeGroupId,meetingId,...input});return updated;
  }
  async closeMeeting(meetingId:string):Promise<MeetingSession>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/close`,{method:'POST',body:'{}'});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings`,rows=await this.cached<MeetingSession[]>(path)??[],current=rows.find(x=>x.id===meetingId);if(!current)throw Error('MEETING_NOT_FOUND');if(current.status==='closed')return current;if(current.status!=='open')throw Error('MEETING_NOT_OPEN');
    const updated:MeetingSession={...current,status:'closed',closedAt:new Date().toISOString()};await this.saveCached(path,rows.map(x=>x.id===meetingId?updated:x));await this.queueLocal('MEETING_CLOSE_V1',{groupId:this.activeGroupId,meetingId},'close:'+meetingId);return updated;
  }

  async simulateAndStoreProject(input:{name:string;kind:Group['kind'];governanceModel:Group['governanceModel'];rubrics?:LaunchRubricPlan[];launchProfile?:GroupProjectLaunchProfile;memberCount?:number;sessions?:number;nominalContribution?:number;managementFeePerContribution?:number;estimatedExternalCostRate?:number;fixedOperatingCostPerSession?:number}):Promise<{projectId:string;result:FeasibilityResult}>{
    const headers={'x-active-group-id':''},projectId=makeId('project'),stamp=new Date().toISOString(),currency='XAF',launchProfile=input.launchProfile??{origin:{mode:'NEW'}};
    const localProject:any={id:projectId,tenantId:this.tenantId,createdBy:this.actorId,name:input.name.trim(),kind:input.kind,governanceModel:input.governanceModel,status:'simulated',createdAt:stamp,rubrics:input.rubrics?structuredClone(input.rubrics):undefined,launchProfile:structuredClone(launchProfile),
      memberCount:input.rubrics?1:Number(input.memberCount??0),sessions:input.rubrics?1:Number(input.sessions??0),nominalContribution:{currency,amount:input.rubrics?0:Number(input.nominalContribution??0)},managementFeePerContribution:{currency,amount:input.rubrics?0:Number(input.managementFeePerContribution??0)},estimatedExternalCostRate:input.rubrics?0:Number(input.estimatedExternalCostRate??0),fixedOperatingCostPerSession:{currency,amount:input.rubrics?0:Number(input.fixedOperatingCostPerSession??0)}};
    const localResult=new GroupLaunchSimulator().simulate(localProject);await this.saveCached(`/api/v1/offline/projects/${projectId}`,localProject);
    if(!this.isOffline()){
      try{
        const project=await this.request<{id:string}>('/api/v1/group-projects',{method:'POST',headers,body:JSON.stringify({...input,projectId,currency:'XAF'})});
        const result=await this.request<FeasibilityResult>(`/api/v1/group-projects/${encodeURIComponent(project.id)}/simulate`,{method:'POST',headers,body:'{}'});
        if(project.id!==projectId)await this.saveCached(`/api/v1/offline/projects/${project.id}`,{...localProject,id:project.id});
        return{projectId:project.id,result};
      }catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    }
    await this.queueLocal('GROUP_PROJECT_UPSERT_V1',{projectId,input:structuredClone(input)},projectId);return{projectId,result:localResult};
  }
  async createGroupFromProject(projectId:string):Promise<Group>{
    if(!this.isOffline())try{const group=await this.request<Group>(`/api/v1/group-projects/${encodeURIComponent(projectId)}/convert`,{method:'POST',headers:{'x-active-group-id':''},body:'{}'});this.selectGroup(group.id);return group;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const project=await this.cached<any>(`/api/v1/offline/projects/${projectId}`);if(!project)throw Error('PROJECT_NOT_FOUND');
    const origin=project.launchProfile?.origin??{mode:'NEW'},groupId=origin.mode==='TRANSFORM_REGISTERED'&&origin.sourceGroupId?String(origin.sourceGroupId):`group_from_${projectId}`,stamp=new Date().toISOString();
    const existingGroups=await this.cached<Group[]>('/api/v1/groups')??[],previous=existingGroups.find(g=>g.id===groupId);
    const group:Group=previous?{...previous,name:project.name,kind:project.kind,governanceModel:project.governanceModel,status:'active',launchProfileSnapshot:structuredClone(project.launchProfile)}:{id:groupId,tenantId:this.tenantId,name:project.name,kind:project.kind,governanceModel:project.governanceModel,status:'active',createdBy:this.actorId,createdAt:stamp,operatingPolicy:starterGroupOperatingPolicy(),originMode:origin.mode,historicalCreatedAt:origin.historicalCreatedAt,currentExerciseLabel:origin.currentExerciseLabel,launchProfileSnapshot:structuredClone(project.launchProfile)};
    this.groupTenants.set(groupId,this.tenantId);await this.saveCached('/api/v1/groups',[...existingGroups.filter(g=>g.id!==groupId),group]);this.selectGroup(groupId);
    await this.saveCached('/api/v1/groups',[...existingGroups.filter(g=>g.id!==groupId),group]);
    await this.saveCached(`/api/v1/groups/${encodeURIComponent(groupId)}/operating-policy`,group.operatingPolicy??starterGroupOperatingPolicy());
    const owner:MembershipView={id:`membership_owner_${groupId}`,tenantId:this.tenantId,groupId,userId:this.actorId,memberNumber:1,roles:['founder','manager'],status:'active',joinedAt:group.createdAt,displayName:this.displayName};
    await this.saveCached(`/api/v1/groups/${encodeURIComponent(groupId)}/members`,[owner]);
    await this.saveCached(`/api/v1/groups/${encodeURIComponent(groupId)}/meetings`,[]);
    const localRubrics:RubricDefinition[]=[];
    for(const plan of project.rubrics??[]){const hash=await this.sha256Hex(JSON.stringify([this.tenantId,groupId,plan.key]));localRubrics.push({id:'rubric_launch_'+hash,tenantId:this.tenantId,groupId,name:plan.name,aliases:[],facets:{direction:'MIXED',obligation:'CUSTOM',medium:'CASH',refundability:'CUSTOM',replenishment:'CUSTOM',interestMode:'CUSTOM',eligibilityMode:'RULE_BASED'},policies:plan.policyDraft,activityPlan:structuredClone(plan),status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:stamp,updatedAt:stamp});}
    await this.saveCached(`/api/v1/groups/${encodeURIComponent(groupId)}/rubrics`,localRubrics);
    await this.queueLocal('GROUP_PROJECT_CONVERT_V1',{projectId,groupId},'convert:'+projectId);return group;
  }
  async updateRubricActivityPlan(rubricId:string,plan:LaunchRubricPlan):Promise<RubricDefinition>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/activity-plan`,{method:'PUT',body:JSON.stringify(plan)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`,rows=await this.cached<RubricDefinition[]>(path)??[],current=rows.find(x=>x.id===rubricId);if(!current)throw Error('RUBRIC_NOT_FOUND');
    const updated={...current,name:plan.name,activityPlan:structuredClone(plan),version:current.version+1,updatedAt:new Date().toISOString()};await this.saveCached(path,rows.map(x=>x.id===rubricId?updated:x));
    await this.queueLocal('RUBRIC_ACTIVITY_PLAN_V1',{groupId:this.activeGroupId,rubricId,plan});return updated;
  }

  async addMember(displayName:string):Promise<Membership>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`,{method:'POST',body:JSON.stringify({displayName,locale:this.locale})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const name=displayName.trim();if(!name)throw Error('MEMBER_NAME_REQUIRED');
    const existing=await this.cached<MembershipView[]>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`)??[],nextNumber=Math.max(0,...existing.map(x=>Number(x.memberNumber)||0))+1;
    const stamp=new Date().toISOString(),userId=makeId('user'),membershipId=makeId('membership'),membership:MembershipView={id:membershipId,tenantId:this.tenantId,groupId:this.activeGroupId,userId,memberNumber:nextNumber,roles:['member'],status:'active',joinedAt:stamp,displayName:name};
    await this.patchCachedArray<MembershipView>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`,rows=>rows.some(x=>x.id===membershipId)?rows:[...rows,membership]);
    await this.queueLocal('MEMBER_ADD_V1',{groupId:this.activeGroupId,userId,membershipId,displayName:name,locale:this.locale,createdAt:stamp});
    return membership;
  }

  async setMemberNumberOrder(membershipIds:string[]):Promise<MembershipView[]>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const ids=membershipIds.map(String),unique=new Set(ids);if(!ids.length||unique.size!==ids.length)throw Error('MEMBER_NUMBER_ORDER_INCOMPLETE');
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`;
    if(!this.isOffline())try{
      const result=await this.request<Membership[]>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/member-number-order`,{method:'PUT',body:JSON.stringify({membershipIds:ids})});
      const cached=await this.cached<MembershipView[]>(path)??[];
      const byId=new Map(result.map(x=>[x.id,x]));const merged=cached.map(x=>byId.has(x.id)?{...x,memberNumber:byId.get(x.id)!.memberNumber}:x);
      await this.saveCached(path,merged);return merged.filter(x=>x.status!=='left').sort((a,b)=>(Number(a.memberNumber)||Number.MAX_SAFE_INTEGER)-(Number(b.memberNumber)||Number.MAX_SAFE_INTEGER));
    }catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const cached=await this.cached<MembershipView[]>(path)??[];
    const current=cached.filter(x=>x.status!=='left');if(current.length!==ids.length||current.some(x=>!unique.has(x.id)))throw Error('MEMBER_NUMBER_ORDER_INCOMPLETE');
    const rank=new Map(ids.map((id,index)=>[id,index+1]));const updated=cached.map(x=>rank.has(x.id)?{...x,memberNumber:rank.get(x.id)}:x);
    await this.saveCached(path,updated);await this.queueLocal('MEMBER_NUMBER_ORDER_V1',{groupId:this.activeGroupId,membershipIds:ids},'member-number-order:'+this.activeGroupId+':'+ids.join('|'));
    return updated.filter(x=>x.status!=='left').sort((a,b)=>(Number(a.memberNumber)||Number.MAX_SAFE_INTEGER)-(Number(b.memberNumber)||Number.MAX_SAFE_INTEGER));
  }

  async recordFinancialSheetEntry(input:{membershipId:string;meetingId:string;rubric:any;amount:number;reason?:string;loanId?:string;deferSync?:boolean}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    const rubric=input.rubric??{},kind=String(rubric.activityPlan?.kind??'').toUpperCase();
    const normalized=String(rubric.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const systemKey=String(rubric.facets?.custom?.systemKey??'').toUpperCase();
    const nature=kind==='LOAN'||systemKey==='LOAN'||/^prets?$|^loans?$/.test(normalized)?'LOAN'
      :kind==='REPAYMENT'||systemKey==='REPAYMENT'||/remboursement|repayment/.test(normalized)?'REPAYMENT'
      :rubric.facets?.direction==='OUTFLOW'?'OUTFLOW':'CONTRIBUTION';
    if(nature==='CONTRIBUTION')return this.recordCashContribution({membershipId:input.membershipId,meetingId:input.meetingId,rubricId:rubric.id,amount:input.amount,lateReason:input.reason?.trim()||undefined});

    const key=makeId(nature==='OUTFLOW'?'sheet_out':nature==='LOAN'?'sheet_loan':'sheet_repayment');
    const queue=async(extra:Record<string,unknown>={})=>{
      const item=await this.queueLocal('FINANCIAL_SHEET_ENTRY_V1',{
        groupId:this.activeGroupId,membershipId:input.membershipId,meetingId:input.meetingId,rubricId:String(rubric.id??''),rubricName:String(rubric.name??''),amount:input.amount,nature,reason:input.reason?.trim()||undefined,loanId:input.loanId,...extra
      },key);
      return{status:'QUEUED_SYNC',queued:true,outbox:item};
    };

    if(nature==='OUTFLOW'){
      const canWrite=!input.deferSync&&await this.canAttemptCriticalWrite();
      const body={membershipId:input.membershipId,rubricId:rubric.id,meetingId:input.meetingId,amount:input.amount,label:rubric.name??'Dépense de séance',scope:'SHEET',note:'Saisie depuis la feuille financière canonique',idempotencyKey:key};
      if(!canWrite)return queue();
      try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/expenses`,{method:'POST',body:JSON.stringify(body)});}
      catch(error){if(error instanceof Error&&(error.message==='NETWORK_UNAVAILABLE'||/^HTTP_5\d\d$/.test(error.message)))return queue();throw error;}
    }

    if(nature==='LOAN'){
      const canWrite=!input.deferSync&&await this.canAttemptCriticalWrite();
      const policy=rubric.policies?.loan;if(!policy?.allowed)throw Error('LOAN_POLICY_REQUIRED');
      const special=/special/.test(normalized)?policy.specialLoans?.[0]:undefined,effectivePolicy=resolveClientLoanPolicy(null,policy,Date.now());
      const rawRate=special?.rateBasisPointsPerPeriod??effectivePolicy.rateBasisPointsPerPeriod;if(rawRate===undefined||rawRate===null)throw Error('LOAN_RATE_REQUIRED');
      const rateBasisPointsPerPeriod=Number(rawRate),paymentPriority=special?.paymentPriority??effectivePolicy.paymentPriority??'CAPITAL_FIRST',interestTiming=special?.interestTiming??effectivePolicy.interestTiming??'NEXT_SESSION_DUE';
      const periods=Number(special?.maxDurationPeriods??policy.overdue?.maxDurationPeriods??6),loanClass=special?'SPECIAL':'STANDARD';
      const replayMeta={rateBasisPointsPerPeriod,paymentPriority,interestTiming,periods,loanClass,policyRevisionId:effectivePolicy.policyRevisionId,policyRevisionEffectiveAt:effectivePolicy.policyRevisionEffectiveAt};
      if(!canWrite)return queue(replayMeta);
      try{
        let loan=await this.createCompletion('LOAN',{title:String(rubric.name??'Prêt'),data:{principal:input.amount,currency:'XAF',borrowerMembershipId:input.membershipId,rubricId:rubric.id,rateBasisPointsPerPeriod,paymentPriority,interestTiming,policyRevisionId:effectivePolicy.policyRevisionId,policyRevisionEffectiveAt:effectivePolicy.policyRevisionEffectiveAt,noInterestOnInterest:true,periods,outstandingPrincipal:0,unpaidInterest:0,loanClass,sourceSurface:'TWO_SHEETS',sheetEntryKey:key}});
        loan=await this.transitionCompletion(loan.id,'SUBMITTED',Number(loan.data?.completionVersion??1),{submittedFromSheet:true,meetingId:input.meetingId});
        loan=await this.transitionCompletion(loan.id,'APPROVED',Number(loan.data?.completionVersion??2),{approvedAt:new Date().toISOString(),approvedFromSheet:true});
        return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/loans/${encodeURIComponent(loan.id)}/disburse`,{method:'POST',body:JSON.stringify({amount:input.amount,expectedVersion:Number(loan.data?.completionVersion??3),meetingId:input.meetingId,rubricId:rubric.id,idempotencyKey:key+':disburse'})});
      }catch(error){if(error instanceof Error&&(error.message==='NETWORK_UNAVAILABLE'||/^HTTP_5\d\d$/.test(error.message)))return queue(replayMeta);throw error;}
    }

    // A generic "Remboursements" rubric is an envelope: Eco-System allocates the
    // payment between interest and principal according to the CURRENT loan policy.
    // A dedicated interest rubric stays explicit. A principal-only rubric must say
    // so explicitly (for example "Remboursement capital").
    const repaymentMarker=String(rubric.facets?.custom?.repaymentComponent??'').toUpperCase();
    const explicitInterest=repaymentMarker==='INTEREST'||/rembour.*interet|interest.*repay|interet.*rembour/.test(normalized);
    const explicitPrincipal=repaymentMarker==='PRINCIPAL'&&/capital/.test(normalized);
    const component=explicitInterest?'INTEREST':explicitPrincipal?'PRINCIPAL':'AUTO';
    const allRubrics=input.deferSync||this.isOffline()
      ?await this.cached<any[]>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/rubrics')??[]
      :await this.listRubrics().catch(()=>[]);
    const officialLoanRubric=allRubrics.find((r:any)=>String(r.facets?.custom?.systemKey??'').toUpperCase()==='LOAN'||/^(pret|prets|emprunt|emprunts|loan|loans)$/.test(String(r.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()));
    const defaultPolicy=resolveClientLoanPolicy(null,officialLoanRubric?.policies?.loan,Date.now()),policyPriority=String(defaultPolicy.paymentPriority??'CAPITAL_FIRST')==='INTEREST_FIRST'?'INTEREST_FIRST':String(defaultPolicy.paymentPriority)==='EXPLICIT_ALLOCATION'?'EXPLICIT_ALLOCATION':'CAPITAL_FIRST';
    // Write-ahead, including online. Losing a response after a canonical commit
    // must never lose its idempotency key or force the user to pay twice.
    const repaymentIntent=await queue({repaymentComponent:component,paymentPriority:policyPriority});
    const canWrite=!input.deferSync&&await this.canAttemptCriticalWrite();
    if(!canWrite)return repaymentIntent;
    try{
      const active=(await this.listCompletion('LOAN')).filter(l=>String(l.data?.borrowerMembershipId??'')===input.membershipId&&['DISBURSED','REPAYING'].includes(String(l.data?.completionState??''))&&(Number(l.data?.outstandingPrincipal??0)>0||Number(l.data?.unpaidInterest??0)>0));
      const loan=input.loanId?active.find(x=>x.id===input.loanId):active.length===1?active[0]:undefined;
      if(!loan)throw Error(active.length>1?'MULTIPLE_LOANS':'LOAN_REQUIRED');
      const effectivePolicy=resolveClientLoanPolicy(loan,officialLoanRubric?.policies?.loan,Date.now()),rawPriority=String(effectivePolicy.paymentPriority??loan.data?.paymentPriority??policyPriority),priority=rawPriority==='INTEREST_FIRST'?'INTEREST_FIRST':rawPriority==='EXPLICIT_ALLOCATION'?'EXPLICIT_ALLOCATION':'CAPITAL_FIRST';
      if(component==='AUTO'&&priority==='EXPLICIT_ALLOCATION')throw Error('LOAN_EXPLICIT_ALLOCATION_REQUIRED');
      const allocation=component==='AUTO'
        ?{paymentAmount:input.amount,priority}
        :{principalAmount:component==='PRINCIPAL'?input.amount:0,interestAmount:component==='INTEREST'?input.amount:0,priority};
      const result=await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/loans/${encodeURIComponent(loan.id)}/repay`,{method:'POST',body:JSON.stringify({...allocation,expectedVersion:Number(loan.data?.completionVersion??0),meetingId:input.meetingId,rubricId:rubric.id,idempotencyKey:key+':repay'})});
      this.outbox.markConfirmedByKey(this.tenantId,this.actorId,key);await this.persistOutbox();
      return result;
    }catch(error){
      if(error instanceof Error&&(error.message==='NETWORK_UNAVAILABLE'||/^HTTP_5\d\d$/.test(error.message)))return repaymentIntent;
      // A business validation error is not transient; never replay it silently.
      this.outbox.markConflictByKey(this.tenantId,this.actorId,key);await this.persistOutbox();
      throw error;
    }
  }

  async recordCashContribution(input:{membershipId:string;amount:number;meetingId?:string;rubricId?:string;lateReason?:string;approverIds?:string[];lateAuthorizationId?:string}):Promise<{queued:boolean;receipt?:ContributionReceipt;outbox?:OutboxItem}>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED'); const key=makeId('cash');
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    // Persist the same intent before the first send, including while online.
    // An ambiguous network failure is retried with this key, never a new charge.
    const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type:'CONTRIBUTION_CASH_RECORDED',payload:{groupId:this.activeGroupId,...input,currency:'XAF'},idempotencyKey:key});
    try{await this.persistOutbox();if(IndexedDbSovereignStore.supported())await this.sovereign.append({tenantId:this.tenantId,groupId:this.activeGroupId,actorId:this.actorId,type:'CONTRIBUTION_CASH_RECORDED',payload:{groupId:this.activeGroupId,...input,currency:'XAF',idempotencyKey:key,outboxId:item.id}});}catch(e){this.outbox.restore(this.outbox.list().filter(x=>x.id!==item.id));throw e;}
    if(!(await this.canAttemptCriticalWrite())){
      const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/ledger`,current=await this.cached<any>(path)??{summary:{currency:'XAF',cashBalance:0,memberFundsLiability:0,entryCount:0},entries:[],receipts:[]};
      if(!(current.receipts??[]).some((x:any)=>x.idempotencyKey===key)){
        const stamp=new Date().toISOString(),receipt={id:'local_receipt_'+item.id,tenantId:this.tenantId,groupId:this.activeGroupId,membershipId:input.membershipId,amount:{currency:'XAF',amount:input.amount},paymentMethod:'cash',ledgerEntryId:'local_pending_'+item.id,meetingId:input.meetingId,receivedAt:stamp,receivedBy:this.actorId,idempotencyKey:key,rubricId:input.rubricId,latePosting:undefined,netAmount:input.amount,localPending:true};
        const summary={...current.summary,cashBalance:Number(current.summary?.cashBalance??0)+input.amount,memberFundsLiability:Number(current.summary?.memberFundsLiability??0)+input.amount,entryCount:Number(current.summary?.entryCount??0)+1};
        await this.saveCached(path,{...current,summary,receipts:[...(current.receipts??[]),receipt]});
      }
      return{queued:true,outbox:item};
    }
    const result=await this.syncOutbox();const updated=result.find(x=>x.id===item.id)!;
    if(updated.status!=='CONFIRMED')return{queued:true,outbox:updated};
    return{queued:false,outbox:updated};
  }
  async prepayments():Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/prepayments') as any;return r.items??[];}
  async createPrepayment(input:{membershipId:string;rubricId?:string;amount:number;intendedMeetingId?:string;note?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/prepayments',{method:'POST',body:JSON.stringify({...input,idempotencyKey:makeId('prepayment')})});}
  async allocatePrepayment(id:string,input:{meetingId:string;amount:number}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/prepayments/'+encodeURIComponent(id)+'/allocate',{method:'POST',body:JSON.stringify(input)});}
  async reopenAuthorizations(meetingId:string):Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/meetings/'+encodeURIComponent(meetingId)+'/reopen-authorizations') as any;return r.items??[];}
  async createReopenAuthorization(meetingId:string,input:{reason:string;expiresAt?:string;scope?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/meetings/'+encodeURIComponent(meetingId)+'/reopen-authorizations',{method:'POST',body:JSON.stringify(input)});}
  async approveReopenAuthorization(meetingId:string,id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/meetings/'+encodeURIComponent(meetingId)+'/reopen-authorizations/'+encodeURIComponent(id)+'/approve',{method:'POST',body:'{}'});}
  async cancelReopenAuthorization(meetingId:string,id:string,reason:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/meetings/'+encodeURIComponent(meetingId)+'/reopen-authorizations/'+encodeURIComponent(id)+'/cancel',{method:'POST',body:JSON.stringify({reason})});}
  async opportunityGraph():Promise<any>{return this.request('/api/v1/opportunity-graph');}
  async wallet():Promise<any>{return this.request('/api/v1/wallet');}
  async reserveWallet(input:{groupId:string;subaccountKey:string;amount:number;purpose:string;expiresAt?:string}):Promise<any>{return this.request('/api/v1/wallet/reservations',{method:'POST',body:JSON.stringify(input)});}
  async releaseWalletReservation(id:string):Promise<any>{return this.request('/api/v1/wallet/reservations/'+encodeURIComponent(id)+'/release',{method:'POST',body:'{}'});}
  async valueDiscoveryProfile():Promise<any>{const r=await this.request('/api/v1/value-discovery/profile') as any;return r.profile??null;}
  async saveValueDiscoveryProfile(input:any):Promise<any>{return this.request('/api/v1/value-discovery/profile',{method:'PUT',body:JSON.stringify(input)});}
  async valueDiscoverySuggestions(limit=30):Promise<any[]>{const r=await this.request('/api/v1/value-discovery/suggestions?limit='+String(limit)) as any;return r.items??[];}
  async microAds(filters:{locality?:string;type?:'SEEK'|'OFFER';includeClosed?:boolean}={}):Promise<any[]>{if(!this.activeGroupId)return[];const p=new URLSearchParams();if(filters.locality)p.set('locality',filters.locality);if(filters.type)p.set('type',filters.type);if(filters.includeClosed)p.set('includeClosed','1');const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/micro-ads?'+p) as any;return r.items??[];}
  async createMicroAd(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/micro-ads',{method:'POST',body:JSON.stringify(input)});}
  async microAdAction(id:string,action:'publish'|'close'|'report'|'promote',input:any={}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/micro-ads/'+encodeURIComponent(id)+'/'+action,{method:'POST',body:JSON.stringify(input)});}
  async anticipation():Promise<{items:any[];signals:any[]}>{if(!this.activeGroupId)return{items:[],signals:[]};return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/anticipation');}
  async createAnticipationDraft():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/anticipation',{method:'POST',body:'{}'});}
  async transitionAnticipation(id:string,action:'validate'|'complete'|'archive'):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/anticipation/'+encodeURIComponent(id)+'/'+action,{method:'POST',body:'{}'});}
  async nextOfKin(membershipId?:string):Promise<any[]>{if(!this.activeGroupId)return[];const p=membershipId?'?membershipId='+encodeURIComponent(membershipId):'';const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/succession/next-of-kin'+p) as any;return r.items??[];}
  async createNextOfKin(input:{membershipId:string;contactAlias:string;relationship:string;contactRef:string;consentRef:string;notes?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/succession/next-of-kin',{method:'POST',body:JSON.stringify(input)});}
  async confirmNextOfKin(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/succession/next-of-kin/'+encodeURIComponent(id)+'/confirm',{method:'POST',body:'{}'});}
  async revokeNextOfKin(id:string,reason:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/succession/next-of-kin/'+encodeURIComponent(id)+'/revoke',{method:'POST',body:JSON.stringify({reason})});}
  async timeMachineSnapshots():Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/time-machine') as any;return r.items??[];}
  async captureTimeMachine(input:{label?:string;reason:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/time-machine',{method:'POST',body:JSON.stringify(input)});}
  async timeMachineSnapshot(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/time-machine/'+encodeURIComponent(id));}
  async compareTimeMachine(fromId:string,toId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const p=new URLSearchParams({from:fromId,to:toId});return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/time-machine/compare?'+p);}
  async rubricExceptions():Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/rubric-exceptions') as any;return r.items??[];}
  async createRubricException(input:{rubricId:string;title:string;scope:'GROUP'|'MEMBERSHIP'|'MEETING';targetRef?:string;reason:string;effectSummary:string;evidenceRef:string;validFrom?:string;validUntil?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/rubric-exceptions',{method:'POST',body:JSON.stringify(input)});}
  async decideRubricException(id:string,state:'APPROVED'|'REJECTED',note:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/rubric-exceptions/'+encodeURIComponent(id)+'/'+(state==='APPROVED'?'approve':'reject'),{method:'POST',body:JSON.stringify({note})});}
  async closeRubricException(id:string,note:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/rubric-exceptions/'+encodeURIComponent(id)+'/close',{method:'POST',body:JSON.stringify({note})});}
  async applicableRubricExceptions(input:{rubricId:string;membershipId?:string;meetingId?:string;at?:string}):Promise<any[]>{if(!this.activeGroupId)return[];const p=new URLSearchParams({rubricId:input.rubricId});if(input.membershipId)p.set('membershipId',input.membershipId);if(input.meetingId)p.set('meetingId',input.meetingId);if(input.at)p.set('at',input.at);const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/rubric-exceptions/applicable?'+p) as any;return r.items??[];}
  async miscRubrics(meetingId?:string):Promise<any[]>{if(!this.activeGroupId)return[];const q=meetingId?'?meetingId='+encodeURIComponent(meetingId):'';return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics${q}`);}
  async ensureMiscRubricStarters():Promise<any[]>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics`,{method:'POST',body:JSON.stringify({action:'ensure_starters'})});}
  async createMiscRubric(input:{name:string;description?:string;lifecycle?:'EPHEMERAL'|'PERSISTENT'|'SESSION_ONLY';amountMode?:'FIXED'|'VARIABLE';defaultAmount?:number;activeFirstSessions?:number}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics`,{method:'POST',body:JSON.stringify({action:'create_custom',...input})});}
  async postMiscRubrics(input:{membershipId:string;meetingId?:string;items:Array<{templateId:string;amount:number;note?:string}>}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics/postings`,{method:'POST',body:JSON.stringify({...input,idempotencyKey:makeId('misc_batch')})});}
  async miscPostings(filters:{meetingId?:string;membershipId?:string}={}):Promise<any[]>{if(!this.activeGroupId)return[];const p=new URLSearchParams();if(filters.meetingId)p.set('meetingId',filters.meetingId);if(filters.membershipId)p.set('membershipId',filters.membershipId);return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics/postings?${p}`);}
  pendingFinancialCellTargets():Array<{outboxId:string;meetingId:string;membershipId:string;rubricId:string;targetAmount:number;baselineValue:number;baselineVersion:number;status:string;businessStatus?:string;idempotencyKey:string;createdAt:string}>{
    if(!this.activeGroupId)return[];
    return this.outbox.list().filter(item=>{
      const payload=item.payload as Record<string,unknown>,businessStatus=String(item.lastResult?.status??'');
      return item.tenantId===this.tenantId&&item.actorId===this.actorId&&['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'].includes(item.type)&&
        String(payload.groupId??'')===this.activeGroupId&&!['CONFLICT','CANCELLED'].includes(item.status)&&
        (item.status!=='CONFIRMED'||businessStatus==='CONSENSUS_REQUIRED');
    }).map(item=>{
      const payload=item.payload as Record<string,unknown>;
      return{outboxId:item.id,meetingId:String(payload.meetingId??''),membershipId:String(payload.membershipId??''),rubricId:String(payload.rubricId??''),
        targetAmount:Number(payload.targetAmount??0),baselineValue:Number(payload.baselineValue??0),baselineVersion:Number(payload.baselineVersion??0),
        status:item.status,businessStatus:String(item.lastResult?.status??'')||undefined,idempotencyKey:item.idempotencyKey,createdAt:item.createdAt};
    }).filter(x=>x.meetingId&&x.membershipId&&x.rubricId&&Number.isSafeInteger(x.targetAmount)&&x.targetAmount>=0);
  }

  private async patchLocalCashMovement(input:{amount:number;direction:'in'|'out';kind:string;sourceType:string;sourceId:string;meetingId?:string;idempotencyKey:string;descriptionCode:string}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_AMOUNT');
    const path='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ledger',current=await this.cached<any>(path)??{summary:{currency:'XAF',cashBalance:0,memberFundsLiability:0,entryCount:0},entries:[],receipts:[],cellRevisions:[]};
    if(input.direction==='out'&&Number(current.summary?.cashBalance??0)<input.amount)throw Error('INSUFFICIENT_CASH');
    const existing=(current.entries??[]).find((x:any)=>x.idempotencyKey===input.idempotencyKey);if(existing)return existing;
    const stamp=new Date().toISOString(),entry={id:'local_ledger_'+input.idempotencyKey,tenantId:this.tenantId,groupId:this.activeGroupId,currency:'XAF',createdAt:stamp,createdBy:this.actorId,descriptionCode:input.descriptionCode,sourceType:input.sourceType,sourceId:input.sourceId,meetingId:input.meetingId,idempotencyKey:input.idempotencyKey,kind:input.kind,lines:[],localPending:true,localDirection:input.direction,localAmount:input.amount};
    const delta=input.direction==='in'?input.amount:-input.amount,summary={...current.summary,cashBalance:Number(current.summary?.cashBalance??0)+delta,entryCount:Number(current.summary?.entryCount??0)+1};
    await this.saveCached(path,{...current,summary,entries:[...(current.entries??[]),entry]});return entry;
  }

  async numpadCodes():Promise<NumpadCode[]>{
    if(!this.activeGroupId)return[];const rubrics=(await this.listRubrics()).filter(x=>x.status==='ACTIVE');return buildNumpadRubricCodes(rubrics.map(x=>({id:x.id,name:x.name})));
  }
  async previewEcoNumpad(raw:string,meetingId:string):Promise<{draft:NumpadDraft;membership:MembershipView;meeting:MeetingSession;rows:Array<NumpadDraft['entries'][number]&{rubric:RubricDefinition}>}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const [codes,members,meetings,rubrics]=await Promise.all([this.numpadCodes(),this.listMembers(),this.listMeetings(),this.listRubrics()]),draft=parseEcoNumpad(raw,codes);
    const membership=members.find(x=>Number(x.memberNumber)===draft.memberNumber&&x.status!=='left');if(!membership)throw Error('NUMPAD_MEMBER_NOT_FOUND');
    const meeting=meetings.find(x=>x.id===meetingId&&!['cancelled'].includes(x.status));if(!meeting)throw Error('MEETING_NOT_FOUND');
    const byId=new Map(rubrics.map(x=>[x.id,x])),rows=draft.entries.map(x=>{const rubric=byId.get(x.rubricId);if(!rubric||rubric.status!=='ACTIVE')throw Error('RUBRIC_NOT_FOUND');return{...x,rubric};});
    return{draft,membership,meeting,rows};
  }
  async commitEcoNumpad(raw:string,meetingId:string):Promise<{membershipId:string;meetingId:string;results:any[]}>{
    const preview=await this.previewEcoNumpad(raw,meetingId),results=[];for(const row of preview.rows)results.push(await this.recordFinancialSheetEntry({membershipId:preview.membership.id,meetingId,rubric:row.rubric,amount:row.amount}));
    return{membershipId:preview.membership.id,meetingId,results};
  }

  pendingFinancialSheetEntries():Array<{meetingId:string;membershipId:string;rubricId:string;amount:number;nature:string;status:string;idempotencyKey:string;createdAt:string}>{
    if(!this.activeGroupId)return[];
    return this.outbox.list().filter(item=>{
      const payload=item.payload as Record<string,unknown>;
      return item.tenantId===this.tenantId&&item.actorId===this.actorId&&item.type==='FINANCIAL_SHEET_ENTRY_V1'&&
        String(payload.groupId??'')===this.activeGroupId&&!['CONFIRMED','CONFLICT','CANCELLED'].includes(item.status);
    }).map(item=>{
      const payload=item.payload as Record<string,unknown>;
      return{meetingId:String(payload.meetingId??''),membershipId:String(payload.membershipId??''),rubricId:String(payload.rubricId??''),
        amount:Number(payload.amount??0),nature:String(payload.nature??''),status:item.status,idempotencyKey:item.idempotencyKey,createdAt:item.createdAt};
    }).filter(x=>x.meetingId&&x.membershipId&&x.rubricId&&Number.isSafeInteger(x.amount)&&x.amount>0);
  }

  async financialCellSnapshot():Promise<{generatedAt:string;watermark:string;cells:Array<{meetingId:string;membershipId:string;rubricId:string;amount:number;cellVersion:number;updatedAt:string;actorId?:string;nature?:string}>}>{
    if(!this.activeGroupId)return{generatedAt:new Date().toISOString(),watermark:'',cells:[]};
    return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/financial-cells/snapshot`);
  }

  async previewOfflineFinancialConfrontation():Promise<{generatedAt:string;watermark:string;rows:Array<{
    outboxId:string;idempotencyKey:string;meetingId:string;membershipId:string;rubricId:string;
    localAmount:number;baselineAmount:number;baselineVersion:number;recordedAt:string;
    canonicalAmount:number;canonicalVersion:number;canonicalUpdatedAt:string;canonicalActorId?:string;
    serverChangedSinceBaseline:boolean;sameAmount:boolean;
  }>}>{
    const queuedById=new Map(this.outbox.list().map(x=>[x.id,x]));
    const pending=this.pendingFinancialCellTargets().filter(x=>(queuedById.get(x.outboxId)?.payload as any)?.recordedOffline!==false);
    if(!pending.length)return{generatedAt:new Date().toISOString(),watermark:'',rows:[]};
    const snapshot=await this.financialCellSnapshot(),byCell=new Map<string,any>();
    if(this.usingOfflineSnapshot)throw Error('CONFRONTATION_SERVER_UNAVAILABLE');
    for(const row of snapshot.cells??[])byCell.set(JSON.stringify([row.meetingId,row.membershipId,row.rubricId]),row);
    const rows=pending.map(item=>{
      const canonical=byCell.get(JSON.stringify([item.meetingId,item.membershipId,item.rubricId]))??{};
      const canonicalAmount=Number(canonical.amount??0),canonicalVersion=Number(canonical.cellVersion??0);
      return{outboxId:item.outboxId,idempotencyKey:item.idempotencyKey,meetingId:item.meetingId,membershipId:item.membershipId,
        rubricId:item.rubricId,localAmount:item.targetAmount,baselineAmount:item.baselineValue,baselineVersion:item.baselineVersion,
        recordedAt:item.createdAt,canonicalAmount,canonicalVersion,canonicalUpdatedAt:String(canonical.updatedAt??''),
        canonicalActorId:canonical.actorId?String(canonical.actorId):undefined,
        serverChangedSinceBaseline:canonicalVersion>item.baselineVersion||canonicalAmount!==item.baselineValue,
        sameAmount:canonicalAmount===item.targetAmount};
    });
    return{generatedAt:snapshot.generatedAt,watermark:snapshot.watermark,rows};
  }

  async resolveOfflineFinancialConfrontation(preview:Awaited<ReturnType<ConnectedApplication['previewOfflineFinancialConfrontation']>>,decision:{applyIds:string[];keepServerIds:string[]}):Promise<any[]>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const groupId=this.activeGroupId,actorId=this.actorId,tenantId=this.tenantId;
    const apply=new Set(decision.applyIds),keep=new Set(decision.keepServerIds),known=new Set(preview.rows.map(x=>x.outboxId));
    if([...apply,...keep].some(id=>!known.has(id))||[...apply].some(id=>keep.has(id))||preview.rows.some(x=>!apply.has(x.outboxId)&&!keep.has(x.outboxId)))throw Error('CONFRONTATION_DECISION_INVALID');
    const resolved=[];
    for(const row of preview.rows){
      const item=this.outbox.list().find(x=>x.id===row.outboxId),p=item?.payload as any;
      if(this.activeGroupId!==groupId||this.actorId!==actorId||this.tenantId!==tenantId||!item||item.actorId!==this.actorId||item.tenantId!==this.tenantId||p?.groupId!==this.activeGroupId||['CONFIRMED','SYNCING','CANCELLED'].includes(item.status))throw Error('CONFRONTATION_DECISION_STALE');
      if(keep.has(row.outboxId)){
        await this.cancelOutboxItem(row.outboxId);
        resolved.push({...row,retainedAmount:row.canonicalAmount,retainedVersion:row.canonicalVersion});
      }else if(row.serverChangedSinceBaseline&&!row.sameAmount){
        // Explicitly choosing a divergent local amount is a NEW validation.
        // Keep the old intent, original date and command key in the audit trail.
        // Commit its replacement before cancellation, so an interrupted device
        // retains at least one durable intent throughout the decision.
        await this.warmFinancialClock(true);
        if(this.activeGroupId!==groupId||this.actorId!==actorId||this.tenantId!==tenantId)throw Error('CONFRONTATION_DECISION_STALE');
        await this.setFinancialCellTarget({meetingId:row.meetingId,membershipId:row.membershipId,rubricId:row.rubricId,
          targetAmount:row.localAmount,currentAmount:row.canonicalAmount,currentVersion:row.canonicalVersion,
          reason:'[OFFLINE_CONFRONTATION] Reconfirmation explicite de '+item.idempotencyKey+' · '+row.canonicalAmount+' → '+row.localAmount,deferSync:true});
        await this.cancelOutboxItem(row.outboxId);
      }
    }
    return resolved;
  }

  async ledger():Promise<{summary:LedgerSummary;entries:LedgerEntry[];receipts:Array<ContributionReceipt & {netAmount?:number;localPending?:boolean;localPendingStatus?:string}>;cellRevisions:Array<{meetingId:string;membershipId:string;rubricId:string;currency:string;version:number}>}>{
    if(!this.activeGroupId)return{summary:{currency:'XAF',cashBalance:0,memberFundsLiability:0,entryCount:0},entries:[],receipts:[],cellRevisions:[]};
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/ledger`;
    let base:{summary:LedgerSummary;entries:LedgerEntry[];receipts:Array<ContributionReceipt & {netAmount?:number;localPending?:boolean;localPendingStatus?:string}>;cellRevisions:Array<{meetingId:string;membershipId:string;rubricId:string;currency:string;version:number}>};
    try{base=await this.request(path);}
    catch(error){
      if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;
      base=await this.cached<typeof base>(path)??{summary:{currency:'XAF',cashBalance:0,memberFundsLiability:0,entryCount:0},entries:[],receipts:[],cellRevisions:[]};
    }

    const receipts=[...(base.receipts??[])],summary={...base.summary};
    const seen=new Set(receipts.map(r=>String(r.idempotencyKey??'')));
    const pending=this.outbox.list().filter(item=>{
      const payload=item.payload as Record<string,unknown>;
      return item.tenantId===this.tenantId&&item.actorId===this.actorId&&item.type==='CONTRIBUTION_CASH_RECORDED'&&
        String(payload.groupId??'')===this.activeGroupId&&!['CONFIRMED','CONFLICT','CANCELLED'].includes(item.status);
    });
    for(const item of pending){
      if(seen.has(item.idempotencyKey))continue;
      const payload=item.payload as Record<string,unknown>,amount=Number(payload.amount??0);
      if(!Number.isSafeInteger(amount)||amount<=0)continue;
      const receipt:any={id:'local_receipt_'+item.id,tenantId:this.tenantId,groupId:this.activeGroupId,membershipId:String(payload.membershipId??''),
        amount:{currency:String(payload.currency??'XAF'),amount},paymentMethod:'cash',ledgerEntryId:'local_pending_'+item.id,
        meetingId:payload.meetingId?String(payload.meetingId):undefined,receivedAt:item.createdAt,receivedBy:this.actorId,idempotencyKey:item.idempotencyKey,
        rubricId:payload.rubricId?String(payload.rubricId):undefined,netAmount:amount,localPending:true,localPendingStatus:item.status};
      receipts.push(receipt);seen.add(item.idempotencyKey);
      summary.cashBalance=Number(summary.cashBalance??0)+amount;
      summary.memberFundsLiability=Number(summary.memberFundsLiability??0)+amount;
      summary.entryCount=Number(summary.entryCount??0)+1;
    }
    return{...base,summary,receipts,cellRevisions:base.cellRevisions??[]};
  }
  async reverseLedgerEntry(entryId:string,reason:string):Promise<LedgerEntry>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/ledger/${encodeURIComponent(entryId)}/reverse`,{method:'POST',body:JSON.stringify({reason})});}

  async cashboxReconciliations():Promise<CashboxReconciliationRecord[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/cashbox/reconciliations`);}
  async reconcileCashbox(input:{openingCash:number;cashIn:number;cashOut:number;countedClosing:number;meetingId?:string}):Promise<CashboxReconciliationRecord>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request<CashboxReconciliationRecord>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/cashbox/reconciliations`,{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    for(const value of [input.openingCash,input.cashIn,input.cashOut,input.countedClosing])if(!Number.isSafeInteger(value)||value<0)throw Error('INVALID_CASHBOX_VALUE');
    const theoreticalClosing=input.openingCash+input.cashIn-input.cashOut,stamp=new Date().toISOString(),record:CashboxReconciliationRecord={id:makeId('cashrec'),tenantId:this.tenantId,groupId:this.activeGroupId,meetingId:input.meetingId,snapshot:{openingCash:input.openingCash,cashIn:input.cashIn,cashOut:input.cashOut,theoreticalClosing,countedClosing:input.countedClosing,variance:input.countedClosing-theoreticalClosing,currency:'XAF'},status:input.countedClosing===theoreticalClosing?'MATCHED':'MISMATCH',createdAt:stamp,createdBy:this.actorId};
    await this.patchCachedArray<CashboxReconciliationRecord>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/cashbox/reconciliations`,rows=>[...rows,record]);
    await this.queueLocal('CASHBOX_RECONCILE_V1',{groupId:this.activeGroupId,...input,currency:'XAF'},record.id);return record;
  }
  async expenses(input:{meetingId?:string;membershipId?:string;rubricId?:string;scope?:string}={}):Promise<any[]>{if(!this.activeGroupId)return[];const q=new URLSearchParams();for(const [k,v] of Object.entries(input))if(v)q.set(k,String(v));return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/expenses?${q}`);}
  async openSupportCase(summary:string):Promise<CaseRecord>{return this.request('/api/v1/cases',{method:'POST',body:JSON.stringify({summary,groupId:this.activeGroupId})});}
  async inboxItems():Promise<Array<{id:string;kind:string;title:string;priority:string;status:string;groupId?:string;dueAt?:string;sourceType?:string;sourceId?:string}>>{return this.request('/api/v1/inbox');}

  async productCatalog():Promise<{version:string;count:number;capabilities:ReturnType<ConnectedApplication['productModules']>}>{
    try{return await this.request('/api/v1/product/capabilities');}
    catch(error){
      if((error instanceof Error)&&error.message==='NETWORK_UNAVAILABLE'){
        const capabilities=this.productModules();
        return{version:'offline-bundled',count:capabilities.length,capabilities};
      }
      throw error;
    }
  }
  async searchGroups(input:{q?:string;locality?:string;recruitingOnly?:boolean;latitude?:number;longitude?:number;radiusKm?:number}={}):Promise<GroupDiscoveryMatch[]>{const p=new URLSearchParams();if(input.q)p.set('q',input.q);if(input.locality)p.set('locality',input.locality);if(input.recruitingOnly)p.set('recruitingOnly','true');if(input.latitude!==undefined)p.set('latitude',String(input.latitude));if(input.longitude!==undefined)p.set('longitude',String(input.longitude));if(input.radiusKm!==undefined)p.set('radiusKm',String(input.radiusKm));return this.request(`/api/v1/discovery/groups?${p}`);}
  async savedDiscoverySearches():Promise<any[]>{const r=await this.request('/api/v1/discovery/saved-searches') as any;return r.items??[];}
  async saveDiscoverySearch(input:any):Promise<any>{return this.request('/api/v1/discovery/saved-searches',{method:'POST',body:JSON.stringify(input)});}
  async runDiscoverySearch(id:string):Promise<any>{return this.request('/api/v1/discovery/saved-searches/'+encodeURIComponent(id)+'/run',{method:'POST',body:'{}'});}
  async deleteDiscoverySearch(id:string):Promise<any>{return this.request('/api/v1/discovery/saved-searches/'+encodeURIComponent(id),{method:'DELETE'});}
  async proximityGroups(locality:string,q=''):Promise<any[]>{const p=new URLSearchParams({locality});if(q)p.set('q',q);return this.request('/api/v1/discovery/proximity?'+p);}
  async proximityGroupsByCoordinates(latitude:number,longitude:number,radiusKm=20,q=''):Promise<any[]>{const p=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),radiusKm:String(radiusKm)});if(q)p.set('q',q);return this.request('/api/v1/discovery/proximity?'+p);}
  async managerPublicProfile():Promise<any>{const r=await this.request('/api/v1/discovery/manager-profile') as any;return r.profile;}
  async saveManagerPublicProfile(input:any):Promise<any>{return this.request('/api/v1/discovery/manager-profile',{method:'PUT',body:JSON.stringify(input)});}
  async searchManagerPublicProfiles(input:{q?:string;locality?:string;expertise?:string[]}={}):Promise<any[]>{const p=new URLSearchParams();if(input.q)p.set('q',input.q);if(input.locality)p.set('locality',input.locality);if(input.expertise?.length)p.set('expertise',input.expertise.join(','));const r=await this.request('/api/v1/discovery/manager-profiles/search?'+p) as any;return r.items??[];}
  async candidateProfile():Promise<any>{const r=await this.request('/api/v1/discovery/candidate-profile') as any;return r.profile;}
  async saveCandidateProfile(input:any):Promise<any>{return this.request('/api/v1/discovery/candidate-profile',{method:'PUT',body:JSON.stringify(input)});}
  async candidateInvitations():Promise<any[]>{return this.request('/api/v1/discovery/candidate-invitations');}
  async respondCandidateInvitation(id:string,response:'INTERESTED'|'DECLINED'):Promise<any>{return this.request('/api/v1/discovery/candidate-invitations/'+encodeURIComponent(id)+'/respond',{method:'POST',body:JSON.stringify({response})});}
  async searchConsentingCandidates(input:{q?:string;locality?:string;tags?:string[];latitude?:number;longitude?:number;radiusKm?:number}={}):Promise<any[]>{if(!this.activeGroupId)return[];const p=new URLSearchParams();if(input.q)p.set('q',input.q);if(input.locality)p.set('locality',input.locality);if(input.tags?.length)p.set('tags',input.tags.join(','));if(input.latitude!==undefined)p.set('latitude',String(input.latitude));if(input.longitude!==undefined)p.set('longitude',String(input.longitude));if(input.radiusKm!==undefined)p.set('radiusKm',String(input.radiusKm));return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/discovery/candidates?'+p);}
  async candidateGroupFit(candidateId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/discovery/candidates/'+encodeURIComponent(candidateId)+'/fit');}
  async inviteConsentingCandidate(candidateId:string,input:{campaignId?:string;message?:string}={}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/discovery/candidates/'+encodeURIComponent(candidateId)+'/invite',{method:'POST',body:JSON.stringify(input)});}
  async recruitmentCampaigns():Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/recruitment-campaigns');}
  async createRecruitmentCampaign(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/recruitment-campaigns',{method:'POST',body:JSON.stringify(input)});}
  async setRecruitmentCampaignState(id:string,state:'ACTIVE'|'PAUSED'|'CLOSED'):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/recruitment-campaigns/'+encodeURIComponent(id)+'/state',{method:'POST',body:JSON.stringify({state})});}
  async publishActiveGroup(input:{visibility:'PUBLIC'|'INVITE_ONLY'|'SECRET'|'MEMBERS_ONLY';discoverable:boolean;joinPolicy:'REQUEST'|'OPEN'|'INVITE_ONLY'|'CLOSED';recruiting:boolean;locality?:string;approxLocation?:{latitude:number;longitude:number;precisionMeters:number;source:'DEVICE_GEOLOCATION'};clearApproxLocation?:boolean;missionTags?:string[];activityTags?:string[]}):Promise<PublicGroupListing>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/discovery`,{method:'POST',body:JSON.stringify(input)});}
  async createJoinLink(input:{mode?:'AUTO_JOIN'|'HISTORICAL_MATCH';label?:string;expiresHours?:number;maxUses?:number}={}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/join-links`,{method:'POST',body:JSON.stringify(input)});}
  async listJoinLinks():Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/join-links`);}
  async redeemJoinCode(code:string):Promise<any>{return this.request('/api/v1/join/redeem',{method:'POST',body:JSON.stringify({code})});}
  async pairingStatus(requestId:string):Promise<any>{return this.request('/api/v1/join/pairing-requests/'+encodeURIComponent(requestId));}
  async createMemberPairingCode():Promise<any>{return this.request('/api/v1/pairing-code',{method:'POST',body:'{}'});}
  async listPairingRequests():Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/pairing-requests`);}
  async decidePairingRequest(requestId:string,input:{decision:'APPROVE'|'REJECT';membershipId?:string;reason?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/pairing-requests/${encodeURIComponent(requestId)}/decision`,{method:'POST',body:JSON.stringify(input)});}
  async pairMemberCode(membershipId:string,code:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/pair-member-code`,{method:'POST',body:JSON.stringify({membershipId,code})});}
  async membershipQuestions(groupId:string):Promise<any[]>{return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/membership-questions');}
  async setMembershipQuestions(questions:any[]):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/membership-questions',{method:'PUT',body:JSON.stringify({questions})});}
  async createMembershipReferral(note=''):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/membership-referrals',{method:'POST',body:JSON.stringify({note})});}
  async membershipApplicationDetails(id:string):Promise<any>{return this.request('/api/v1/membership-applications/'+encodeURIComponent(id)+'/details');}
  async requestToJoin(groupId:string,message?:string,answers?:Record<string,string>,referralCode?:string):Promise<MembershipApplication>{return this.request('/api/v1/membership-applications',{method:'POST',body:JSON.stringify({groupId,message,answers,referralCode})});}
  async listApplications():Promise<MembershipApplication[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/applications`);}
  async decideApplication(id:string,decision:'APPROVE'|'REJECT',reason?:string):Promise<{application:MembershipApplication;membershipId?:string}>{return this.request(`/api/v1/membership-applications/${encodeURIComponent(id)}/decision`,{method:'POST',body:JSON.stringify({decision,reason})});}

  async completionWorkflows():Promise<{version:string;workflows:Record<string,unknown>}>{return this.request('/api/v1/completion/workflows');}
  async groupIdentityPassport(issue=false):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/identity-passport`,issue?{method:'POST',body:'{}'}:undefined);}
  async groupIdentityProfile():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/identity-profile`);}
  async updateGroupIdentityProfile(input:{declarationDate?:string;declarationNumber?:string;officeMandateStart?:string;officeMandateEnd?:string;note?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/identity-profile`,{method:'PUT',body:JSON.stringify(input)});}
  async dataUseConsent():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/data-use-consent`);}
  async setDataUseConsent(purpose:'COLLECTIVE_LEARNING'|'COMMERCIAL_PERSONALIZATION'|'PARTNER_MATCHING'|'COMMUNITY_DISCOVERY',granted:boolean):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/data-use-consent`,{method:'POST',body:JSON.stringify({purpose,granted})});}
  async conciergeMemories():Promise<any[]>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/concierge/memories`);}
  async learnConciergeMemory(input:{category:string;key:string;value:string;sourceRef:string;evidenceSnippet?:string;confidence:number;privacy?:string;visibility?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/concierge/memories`,{method:'POST',body:JSON.stringify(input)});}
  async founderLearningObservatory(minGroups=5):Promise<any>{const p=new URLSearchParams({minGroups:String(Math.max(5,Math.trunc(minGroups))) });return this.request('/api/v1/founder/learning-observatory?'+p);}
  async conciergeProfile():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/concierge/profile`);}
  async collectiveSignals():Promise<any[]>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/concierge/collective-signals`);}
  async personalCommercialConsent():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/preferences/commercial-consent`);}
  async setPersonalCommercialConsent(granted:boolean):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/preferences/commercial-consent`,{method:'POST',body:JSON.stringify({granted})});}
  async ensureCommercialPreferenceCookie():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/preferences/commercial-cookie`,{method:'POST',body:'{}'});}
  async revokeCommercialPreferenceCookie():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/preferences/commercial-cookie/revoke`,{method:'POST',body:'{}'});}
  async commercialPreferenceContext():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/preferences/commercial-context`);}
  async commercialAffinities():Promise<any[]>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/concierge/commercial-affinities`);}
  async liveConsensus(meetingId:string):Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request<any>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/live-consensus`);return r.items??[];}
  async submitLiveConsensus(meetingId:string,input:{cellKey:string;value:string|number;label?:string;membershipId?:string;rubricId?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/live-consensus`,{method:'POST',body:JSON.stringify(input)});}
  async voteLiveConsensus(meetingId:string,cellKey:string,proposalActorId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/live-consensus/${encodeURIComponent(cellKey)}/vote`,{method:'POST',body:JSON.stringify({proposalActorId})});}
  async reserveLiveConsensus(meetingId:string,cellKey:string,reason:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/live-consensus/${encodeURIComponent(cellKey)}/reserve`,{method:'POST',body:JSON.stringify({reason})});}
  async reviewFinancialCellChange(input:{
    meetingId:string;membershipId:string;rubricId:string;amount:number;cellVersion:number;
    decision:'APPROVE'|'RESERVE';reason?:string;
  }):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!['APPROVE','RESERVE'].includes(input.decision)||!Number.isSafeInteger(input.amount)||
      input.amount<0||!Number.isSafeInteger(input.cellVersion)||input.cellVersion<0)throw Error('INVALID_CELL_REVIEW');
    if(input.decision==='RESERVE'&&!String(input.reason??'').trim())throw Error('RESERVE_REASON_REQUIRED');
    const payload={groupId:this.activeGroupId,...input,reason:String(input.reason??'').trim()};
    const key='cell-review:'+makeId('intent');
    const item=await this.queueLocal('FINANCIAL_CELL_REVIEW_V1',payload,key);
    if(!(await this.canAttemptCriticalWrite()))return{status:'QUEUED_SYNC',queued:true,outbox:item};
    try{
      const result=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+
        '/meetings/'+encodeURIComponent(input.meetingId)+'/financial-cells/review',
        {method:'POST',headers:{'x-idempotency-key':key},body:JSON.stringify(payload)});
      this.outbox.markConfirmedByKey(this.tenantId,this.actorId,key);
      await this.persistOutbox();return result;
    }catch(error){
      const code=error instanceof Error?error.message:String(error);
      if(code==='NETWORK_UNAVAILABLE'||/^HTTP_5\d\d$/.test(code))return{status:'QUEUED_SYNC',queued:true,outbox:item};
      this.outbox.markConflictByKey(this.tenantId,this.actorId,key);
      await this.persistOutbox();throw error;
    }
  }
  async setFinancialCellTarget(input:{meetingId:string;membershipId:string;rubricId:string;targetAmount:number;currentAmount?:number;currentVersion?:number;reason?:string;deferSync?:boolean}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!Number.isSafeInteger(input.targetAmount)||input.targetAmount<0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    const current=Number(input.currentAmount??0),currentVersion=Number(input.currentVersion??0),operationKey='cell-target:'+makeId('op');
    const payload={groupId:this.activeGroupId,meetingId:input.meetingId,membershipId:input.membershipId,rubricId:input.rubricId,targetAmount:input.targetAmount,baselineValue:current,baselineVersion:currentVersion,reason:input.reason??'',recordedAtClient:new Date().toISOString(),...this.financialRecordedAnchor()};
    // Persist the exact target command before attempting transport. If the HTTP
    // response is lost after commit, the same idempotency key is replayed later.
    const item=await this.queueLocal('FINANCIAL_CELL_CORRECTION_PROPOSAL_V2',payload,operationKey);
    if(input.deferSync||!(await this.canAttemptCriticalWrite()))return{status:'QUEUED_SYNC',queued:true,current,target:input.targetAmount,outbox:item};
    try{
      const result=await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(input.meetingId)}/financial-cells`,{
        method:'POST',headers:{'x-idempotency-key':operationKey},
        body:JSON.stringify({membershipId:input.membershipId,rubricId:input.rubricId,targetAmount:input.targetAmount,expectedCurrentAmount:current,expectedCellVersion:currentVersion,reason:input.reason??'',intentV2:item.payload})
      });
      if((result as any)?.status==='CLOCK_REVIEW'){
        // Persist the unresolved intent and surface it as a conflict. A clock
        // anomaly is never a successful financial confirmation.
        this.outbox.markConflictByKey(this.tenantId,this.actorId,operationKey);
        await this.persistOutbox();throw Error('CELL_CLOCK_REVIEW_REQUIRED');
      }
      this.outbox.markConfirmedByKey(this.tenantId,this.actorId,operationKey);
      await this.persistOutbox();return result;
    }catch(error){
      if(error instanceof Error&&['CELL_VALUE_CONFLICT','CELL_VERSION_CONFLICT'].includes(error.message)){this.outbox.markConflictByKey(this.tenantId,this.actorId,operationKey);await this.persistOutbox();throw error;}
      if(error instanceof Error&&(error.message==='NETWORK_UNAVAILABLE'||/^HTTP_5\d\d$/.test(error.message))){
        await this.persistOutbox();
        return{status:'QUEUED_SYNC',queued:true,current,target:input.targetAmount,outbox:item};
      }
      throw error;
    }
  }
  async applyFinancialCellConsensus(meetingId:string,cellKey:string,reason='Valeur retenue après confrontation des gestionnaires'):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(this.isOffline())throw Error('CONSENSUS_APPLY_REQUIRES_SYNC');
    return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/financial-cells/${encodeURIComponent(cellKey)}/apply`,{method:'POST',body:JSON.stringify({reason})});
  }
  async groupNotifications():Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/notifications`);}
  async trashItems():Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/trash`);}
  async moveToTrash(kind:'MEETING'|'MEMBER'|'RUBRIC'|'GROUP',entityId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/trash`,{method:'POST',body:JSON.stringify({kind,entityId})});}
  async restoreTrashItem(trashId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/trash/${encodeURIComponent(trashId)}/restore`,{method:'POST',body:'{}'});}
  async groupTrashItems():Promise<any[]>{return this.request('/api/v1/trash/groups');}
  async restoreGroupTrashItem(trashId:string):Promise<any>{return this.request('/api/v1/trash/groups/'+encodeURIComponent(trashId)+'/restore',{method:'POST',body:'{}'});}
  async setGroupTrashReminders(trashId:string,enabled:boolean):Promise<any>{return this.request('/api/v1/trash/groups/'+encodeURIComponent(trashId)+'/reminders',{method:'PUT',body:JSON.stringify({enabled})});}
  async groupPetitionStatus(trashId:string):Promise<any>{return this.request('/api/v1/trash/groups/'+encodeURIComponent(trashId)+'/petition');}
  async signGroupPetition(trashId:string):Promise<any>{return this.request('/api/v1/trash/groups/'+encodeURIComponent(trashId)+'/petition',{method:'POST',body:'{}'});}
  async withdrawGroupPetition(trashId:string):Promise<any>{return this.request('/api/v1/trash/groups/'+encodeURIComponent(trashId)+'/petition/withdraw',{method:'POST',body:'{}'});}
  async createSuccessorGroup(trashId:string,input:{name?:string;purpose?:string}={}):Promise<any>{return this.request('/api/v1/trash/groups/'+encodeURIComponent(trashId)+'/successor',{method:'POST',body:JSON.stringify(input)});}
  async recordSuccessionDecision(groupId:string,input:{decision:string;reason:string;nextAction?:string}):Promise<any>{return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/succession/decisions',{method:'POST',body:JSON.stringify(input)});}
  async openSuccessionDispute(groupId:string,input:{reviewDossierId:string;summary:string;evidenceRefs?:string[]}):Promise<any>{return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/succession/disputes',{method:'POST',body:JSON.stringify(input)});}

  async markGroupNotificationRead(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/notifications/${encodeURIComponent(id)}/read`,{method:'POST',body:'{}'});}
  async distributeMeetingSummary(meetingId:string):Promise<{queued:boolean;outbox:OutboxItem}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const items=await this.liveConsensus(meetingId).catch(error=>{if(this.isOffline()&&error instanceof Error&&error.message==='NETWORK_UNAVAILABLE')return[];throw error;});
    if(items.some((x:any)=>['COLLECTING','DIVERGENT'].includes(String(x.state))))throw Error('CONSENSUS_UNRESOLVED');
    const item=await this.queueLocal('MEETING_DISTRIBUTION_V1',{groupId:this.activeGroupId,meetingId,kind:'MEMBER_DISTRIBUTION_READY',confirmedAt:new Date().toISOString()},'meeting-distribution:'+meetingId);
    if(this.isOffline())return{queued:true,outbox:item};
    const synced=await this.syncOutbox(),updated=synced.find(x=>x.id===item.id)??item;return{queued:updated.status!=='CONFIRMED',outbox:updated};
  }
  private liveTicketCache?:{groupId:string;ticket:string;expiresAt:number};
  async liveTicket():Promise<{ticket:string;expiresAt:string;groupId:string}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const now=Date.now(),cached=this.liveTicketCache;
    if(cached&&cached.groupId===this.activeGroupId&&cached.expiresAt-now>5*60_000)return{ticket:cached.ticket,expiresAt:new Date(cached.expiresAt).toISOString(),groupId:cached.groupId};
    // If D1 is temporarily guarded, a still-valid signed Live ticket is more
    // useful than forcing a refresh that the quota gate will reject. This keeps
    // Durable Object push alive without any new D1 read.
    if(this.serverBudgetBlocked()&&cached&&cached.groupId===this.activeGroupId&&cached.expiresAt-now>15_000)
      return{ticket:cached.ticket,expiresAt:new Date(cached.expiresAt).toISOString(),groupId:cached.groupId};
    const data=await this.request<{ticket:string;expiresAt:string;groupId:string}>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/ticket`);
    const expiresAt=Date.parse(data.expiresAt);if(data.ticket&&Number.isFinite(expiresAt))this.liveTicketCache={groupId:data.groupId,ticket:data.ticket,expiresAt};
    return data;
  }
  async liveHealth():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/health`);}
  async liveEvents(after=0,limit=500):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const safeLimit=Math.min(Math.max(Math.trunc(limit)||500,1),500);return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/events?after=${encodeURIComponent(String(after))}&limit=${encodeURIComponent(String(safeLimit))}`);}
  async liveSignals(afterAt=0):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/signals?afterAt=${encodeURIComponent(String(Math.max(0,Math.trunc(afterAt)||0)))}`);}
  async publishLive(type:'PRESENCE'|'SYNC_HINT'|'MEETING_UPDATE',payload:Record<string,string|number|boolean|null>={}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/publish`,{method:'POST',body:JSON.stringify({type,payload,idempotencyKey:makeId('live')})});}
  async publishLiveSignal(type:'PRESENCE'|'TYPING'|'TYPING_STOP'|'CELL_FOCUS'|'CELL_BLUR'|'FINANCIAL_DRAFT'|'FINANCIAL_DRAFT_CLEAR'|'LIVE_ACK',payload:Record<string,string|number|boolean|null>={}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(typeof navigator!=='undefined'&&navigator.onLine===false)return{accepted:false,offline:true};
    return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/signal`,{method:'POST',body:JSON.stringify({type,payload})});
  }
  liveWebSocketUrl(after=0,ticket=''):string{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const base=new URL(this.baseUrl||location.origin,location.origin);base.protocol=base.protocol==='https:'?'wss:':'ws:';base.pathname=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/connect`;base.search='';if(Number(after)>0)base.searchParams.set('after',String(Math.trunc(Number(after))));if(ticket)base.searchParams.set('ticket',ticket);return base.toString();}

  async amountExplanation(membershipId:string,rubricId?:string):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const q=rubricId?'?rubricId='+encodeURIComponent(rubricId):'';return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/members/'+encodeURIComponent(membershipId)+'/amount-explanation'+q);}
  async searchDocuments(query:string,limit=20):Promise<Array<{recordId:string;title:string;score:number;snippet:string;source?:string;page?:string;version?:number}>>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/documents/search?q='+encodeURIComponent(query)+'&limit='+String(limit));}
  async registerIdentityProof(type:'CNI'|'PHONE'|'NAME',value:string,sourceRef='USER_PRESENTED'):Promise<{proofId:string;state:string;proofType:string}>{const clean=value.trim();if(!clean)throw Error('IDENTITY_PROOF_VALUE_REQUIRED');return this.request('/api/v1/identity-proofs/'+type.toLowerCase(),{method:'POST',body:JSON.stringify({value:clean,sourceRef})});}
  async identityProofMatches():Promise<Array<{tenantId:string;groupId:string;membershipId:string;proofType:'CNI'|'PHONE'|'NAME';confidence:'EXACT_HASH_MATCH'}>>{return this.request('/api/v1/identity-proofs/matches');}
  async previewHistoricalCsv(input:{title:string;kind?:'CONTRIBUTIONS'|'OPENING_BALANCE'|'IDENTITY_CLAIMS'|'OBLIGATIONS';text:string;delimiter?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const path='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/imports/csv/preview';return this.request(path,{method:'POST',body:JSON.stringify(input)});}
  async groupHealthSnapshot():Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/health-snapshot');}
  async notificationDigest(hours=24):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/notification-digest?hours='+String(hours));}
  async createExpectedContribution(input:{membershipId:string;title:string;dueAt:string;amount:number;rubricId?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/receivables/expected',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async allocateReceipt(input:{obligationId:string;receiptId:string;amount:number}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/receivables/allocations',{method:'POST',body:JSON.stringify(input)});}
  async arrears(asOf?:string):Promise<unknown[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/receivables/arrears'+(asOf?'?asOf='+encodeURIComponent(asOf):''));}
  private specializedFinancePath(kind:'savings'|'custody'|'solidarity'):string{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return '/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/offline-specialized/'+kind;}
  private async localSpecializedRecords(kind:'savings'|'custody'|'solidarity'):Promise<any[]>{return await this.cached<any[]>(this.specializedFinancePath(kind))??[];}
  private async saveLocalSpecialized(kind:'savings'|'custody'|'solidarity',record:any):Promise<void>{await this.patchCachedArray<any>(this.specializedFinancePath(kind),rows=>[...rows.filter(x=>x.id!==record.id),structuredClone(record)]);}

  async createSavingsPlan(input:{membershipId:string;name:string;targetAmount?:number}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{const record=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});await this.saveLocalSpecialized('savings',{...record,data:{...record.data,localBalance:0}});return record;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const member=(await this.listMembers()).find(x=>x.id===input.membershipId&&x.status==='active'),name=input.name.trim();if(!member)throw Error('MEMBERSHIP_NOT_FOUND');if(!name)throw Error('NAME_REQUIRED');if(input.targetAmount!==undefined&&(!Number.isSafeInteger(input.targetAmount)||input.targetAmount<0))throw Error('INVALID_TARGET_AMOUNT');
    const stamp=new Date().toISOString(),id=makeId('finance'),record={id,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:'RUBRIC.SAVINGS',title:name,status:'ACTIVE',tags:['specialized-finance','kind:SAVINGS_PLAN','local-pending'],data:{specializedKind:'SAVINGS_PLAN',membershipId:member.id,targetAmount:input.targetAmount??null,currency:'XAF',localBalance:0},createdBy:this.actorId,createdAt:stamp,updatedAt:stamp};
    await this.saveLocalSpecialized('savings',record);await this.queueLocal('SAVINGS_PLAN_CREATE_V1',{groupId:this.activeGroupId,id,membershipId:member.id,name,targetAmount:input.targetAmount??null,currency:'XAF'},'savings-plan:'+id);return record;
  }
  async savingsPosition(id:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{const position=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings/'+encodeURIComponent(id)+'/position'),rows=await this.localSpecializedRecords('savings'),old=rows.find(x=>x.id===id),stamp=new Date().toISOString(),record=old?{...old,data:{...old.data,localBalance:Number(position.balance??0),targetAmount:Number(position.targetAmount??0),currency:String(position.currency??'XAF')},updatedAt:stamp}:{id,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:'RUBRIC.SAVINGS',title:'Épargne',status:'ACTIVE',tags:['specialized-finance','kind:SAVINGS_PLAN','server-hydrated'],data:{specializedKind:'SAVINGS_PLAN',membershipId:null,targetAmount:Number(position.targetAmount??0),currency:String(position.currency??'XAF'),localBalance:Number(position.balance??0)},createdBy:this.actorId,createdAt:stamp,updatedAt:stamp};await this.saveLocalSpecialized('savings',record);return position;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const plan=(await this.localSpecializedRecords('savings')).find(x=>x.id===id);if(!plan)throw Error('SAVINGS_PLAN_NOT_FOUND');return{planId:id,balance:Number(plan.data?.localBalance??0),currency:String(plan.data?.currency??'XAF'),targetAmount:Number(plan.data?.targetAmount??0),offline:true};
  }
  async depositSavings(id:string,amount:number):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_AMOUNT');const key=makeId('savings');
    if(!this.isOffline())try{const entry=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings/'+encodeURIComponent(id)+'/deposit',{method:'POST',body:JSON.stringify({amount,idempotencyKey:key})}),rows=await this.localSpecializedRecords('savings'),plan=rows.find(x=>x.id===id);if(plan)await this.saveLocalSpecialized('savings',{...plan,data:{...plan.data,localBalance:Number(plan.data?.localBalance??0)+amount},updatedAt:new Date().toISOString()});return entry;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const plan=(await this.localSpecializedRecords('savings')).find(x=>x.id===id);if(!plan)throw Error('SAVINGS_PLAN_NOT_FOUND');const updated={...plan,data:{...plan.data,localBalance:Number(plan.data?.localBalance??0)+amount},updatedAt:new Date().toISOString()};
    await this.saveLocalSpecialized('savings',updated);const entry=await this.patchLocalCashMovement({amount,direction:'in',kind:'cash_in',sourceType:'savings_plan',sourceId:id,idempotencyKey:key,descriptionCode:'LEDGER_SAVINGS_DEPOSIT'});await this.queueLocal('SAVINGS_DEPOSIT_V1',{groupId:this.activeGroupId,planId:id,amount,idempotencyKey:key},key);return entry;
  }
  async withdrawSavings(id:string,amount:number):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_AMOUNT');const key=makeId('savings_withdraw');
    if(!this.isOffline())try{const entry=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings/'+encodeURIComponent(id)+'/withdraw',{method:'POST',body:JSON.stringify({amount,idempotencyKey:key})}),rows=await this.localSpecializedRecords('savings'),plan=rows.find(x=>x.id===id);if(plan)await this.saveLocalSpecialized('savings',{...plan,data:{...plan.data,localBalance:Math.max(0,Number(plan.data?.localBalance??0)-amount)},updatedAt:new Date().toISOString()});return entry;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const plan=(await this.localSpecializedRecords('savings')).find(x=>x.id===id);if(!plan)throw Error('SAVINGS_PLAN_NOT_FOUND');const balance=Number(plan.data?.localBalance??0);if(balance<amount)throw Error('INSUFFICIENT_SAVINGS_BALANCE');const updated={...plan,data:{...plan.data,localBalance:balance-amount},updatedAt:new Date().toISOString()};
    await this.saveLocalSpecialized('savings',updated);const entry=await this.patchLocalCashMovement({amount,direction:'out',kind:'cash_out',sourceType:'savings_plan',sourceId:id,idempotencyKey:key,descriptionCode:'LEDGER_SAVINGS_WITHDRAWAL'});await this.queueLocal('SAVINGS_WITHDRAW_V1',{groupId:this.activeGroupId,planId:id,amount,idempotencyKey:key},key);return entry;
  }
  async recordOpeningBalance(amount:number,note:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_AMOUNT');const clean=note.trim();if(!clean)throw Error('NOTE_REQUIRED');const key=makeId('opening');
    if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ledger/opening-balance',{method:'POST',body:JSON.stringify({amount,note:clean,currency:'XAF',idempotencyKey:key})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const entry=await this.patchLocalCashMovement({amount,direction:'in',kind:'opening_balance',sourceType:'opening_balance',sourceId:'local-opening-'+key,idempotencyKey:key,descriptionCode:'LEDGER_OPENING_BALANCE'});await this.queueLocal('OPENING_BALANCE_V1',{groupId:this.activeGroupId,amount,note:clean,currency:'XAF',idempotencyKey:key},key);return entry;
  }
  async createCustody(input:{name:string;holder:string}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const name=input.name.trim(),holder=input.holder.trim();if(!name||!holder)throw Error('CUSTODY_NAME_AND_HOLDER_REQUIRED');
    if(!this.isOffline())try{const record=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/custody',{method:'POST',body:JSON.stringify({name,holder,currency:'XAF'})});await this.saveLocalSpecialized('custody',{...record,data:{...record.data,localBalance:0}});return record;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const stamp=new Date().toISOString(),id=makeId('finance'),record={id,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:'FINANCE.LEDGER',title:name,status:'ACTIVE',tags:['specialized-finance','kind:CUSTODY_ACCOUNT','local-pending'],data:{specializedKind:'CUSTODY_ACCOUNT',holder,currency:'XAF',localBalance:0},createdBy:this.actorId,createdAt:stamp,updatedAt:stamp};
    await this.saveLocalSpecialized('custody',record);await this.queueLocal('CUSTODY_CREATE_V1',{groupId:this.activeGroupId,id,name,holder,currency:'XAF'},'custody-create:'+id);return record;
  }
  async custodyPosition(id:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{const position=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/custody/'+encodeURIComponent(id)+'/position'),rows=await this.localSpecializedRecords('custody'),old=rows.find(x=>x.id===id),stamp=new Date().toISOString(),record=old?{...old,title:String(position.name??old.title),data:{...old.data,holder:String(position.holder??old.data?.holder??''),currency:String(position.currency??'XAF'),localBalance:Number(position.balance??0)},updatedAt:stamp}:{id,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:'FINANCE.LEDGER',title:String(position.name??'Garde de trésorerie'),status:'ACTIVE',tags:['specialized-finance','kind:CUSTODY_ACCOUNT','server-hydrated'],data:{specializedKind:'CUSTODY_ACCOUNT',holder:String(position.holder??''),currency:String(position.currency??'XAF'),localBalance:Number(position.balance??0)},createdBy:this.actorId,createdAt:stamp,updatedAt:stamp};await this.saveLocalSpecialized('custody',record);return position;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const record=(await this.localSpecializedRecords('custody')).find(x=>x.id===id);if(!record)throw Error('CUSTODY_ACCOUNT_NOT_FOUND');return{custodyId:id,balance:Number(record.data?.localBalance??0),currency:String(record.data?.currency??'XAF'),holder:String(record.data?.holder??''),name:record.title,internalOnly:true,externalPaymentRail:false,offline:true};
  }
  async sendToCustody(id:string,amount:number):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_AMOUNT');const key=makeId('custody_out');
    if(!this.isOffline())try{const entry=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/custody/'+encodeURIComponent(id)+'/send',{method:'POST',body:JSON.stringify({amount,idempotencyKey:key})}),rows=await this.localSpecializedRecords('custody'),record=rows.find(x=>x.id===id);if(record)await this.saveLocalSpecialized('custody',{...record,data:{...record.data,localBalance:Number(record.data?.localBalance??0)+amount},updatedAt:new Date().toISOString()});return entry;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const record=(await this.localSpecializedRecords('custody')).find(x=>x.id===id);if(!record)throw Error('CUSTODY_ACCOUNT_NOT_FOUND');const updated={...record,data:{...record.data,localBalance:Number(record.data?.localBalance??0)+amount},updatedAt:new Date().toISOString()};
    await this.saveLocalSpecialized('custody',updated);const entry=await this.patchLocalCashMovement({amount,direction:'out',kind:'transfer',sourceType:'custody',sourceId:id,idempotencyKey:key,descriptionCode:'LEDGER_CASH_TO_CUSTODY'});await this.queueLocal('CUSTODY_SEND_V1',{groupId:this.activeGroupId,custodyId:id,amount,idempotencyKey:key},key);return entry;
  }
  async returnFromCustody(id:string,amount:number):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_AMOUNT');const key=makeId('custody_in');
    if(!this.isOffline())try{const entry=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/custody/'+encodeURIComponent(id)+'/return',{method:'POST',body:JSON.stringify({amount,idempotencyKey:key})}),rows=await this.localSpecializedRecords('custody'),record=rows.find(x=>x.id===id);if(record)await this.saveLocalSpecialized('custody',{...record,data:{...record.data,localBalance:Math.max(0,Number(record.data?.localBalance??0)-amount)},updatedAt:new Date().toISOString()});return entry;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const record=(await this.localSpecializedRecords('custody')).find(x=>x.id===id);if(!record)throw Error('CUSTODY_ACCOUNT_NOT_FOUND');const balance=Number(record.data?.localBalance??0);if(balance<amount)throw Error('INSUFFICIENT_CUSTODY_BALANCE');const updated={...record,data:{...record.data,localBalance:balance-amount},updatedAt:new Date().toISOString()};
    await this.saveLocalSpecialized('custody',updated);const entry=await this.patchLocalCashMovement({amount,direction:'in',kind:'transfer',sourceType:'custody',sourceId:id,idempotencyKey:key,descriptionCode:'LEDGER_CUSTODY_TO_CASH'});await this.queueLocal('CUSTODY_RETURN_V1',{groupId:this.activeGroupId,custodyId:id,amount,idempotencyKey:key},key);return entry;
  }

  async loanGuarantors(loanId:string):Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(loanId)+'/guarantors') as any;return r.items??[];}
  async registerGuarantor(loanId:string,input:{membershipId:string;guaranteedAmount:number}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(loanId)+'/guarantors',{method:'POST',body:JSON.stringify(input)});}
  async releaseLoanGuarantor(loanId:string,guaranteeId:string,reason:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(loanId)+'/guarantors/'+encodeURIComponent(guaranteeId)+'/release',{method:'POST',body:JSON.stringify({reason})});}
  async createSolidarityCase(input:{beneficiaryMembershipId:string;title:string;approvedAmount:number}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const title=input.title.trim();if(!title)throw Error('TITLE_REQUIRED');if(!Number.isSafeInteger(input.approvedAmount)||input.approvedAmount<=0)throw Error('INVALID_AMOUNT');
    if(!this.isOffline())try{const record=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/solidarity/cases',{method:'POST',body:JSON.stringify({...input,title,currency:'XAF'})});await this.saveLocalSpecialized('solidarity',{...record,data:{...record.data,localFunded:Number(record.data?.localFunded??0),localDisbursed:Number(record.data?.localDisbursed??0)}});return record;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const member=(await this.listMembers()).find(x=>x.id===input.beneficiaryMembershipId&&x.status==='active');if(!member)throw Error('MEMBERSHIP_NOT_FOUND');const stamp=new Date().toISOString(),id=makeId('risk'),record={id,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:'SOLIDARITY.FUND',title,status:'ACTIVE',tags:['specialized-finance','kind:SOLIDARITY_CASE','local-pending'],data:{specializedKind:'SOLIDARITY_CASE',beneficiaryMembershipId:member.id,approvedAmount:input.approvedAmount,currency:'XAF',state:'APPROVED',localFunded:0,localDisbursed:0},createdBy:this.actorId,createdAt:stamp,updatedAt:stamp};
    await this.saveLocalSpecialized('solidarity',record);await this.queueLocal('SOLIDARITY_CASE_CREATE_V1',{groupId:this.activeGroupId,id,beneficiaryMembershipId:member.id,title,approvedAmount:input.approvedAmount,currency:'XAF'},'solidarity-case:'+id);return record;
  }
  async fundSolidarity(id:string,amount:number):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_AMOUNT');const key=makeId('solidarity_fund');
    if(!this.isOffline())try{const entry=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/solidarity/cases/'+encodeURIComponent(id)+'/fund',{method:'POST',body:JSON.stringify({amount,idempotencyKey:key})}),rows=await this.localSpecializedRecords('solidarity'),record=rows.find(x=>x.id===id);if(record)await this.saveLocalSpecialized('solidarity',{...record,data:{...record.data,localFunded:Number(record.data?.localFunded??0)+amount},updatedAt:new Date().toISOString()});return entry;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const record=(await this.localSpecializedRecords('solidarity')).find(x=>x.id===id);if(!record)throw Error('SOLIDARITY_CASE_NOT_FOUND');const updated={...record,data:{...record.data,localFunded:Number(record.data?.localFunded??0)+amount},updatedAt:new Date().toISOString()};
    await this.saveLocalSpecialized('solidarity',updated);const entry=await this.patchLocalCashMovement({amount,direction:'in',kind:'cash_in',sourceType:'solidarity_case',sourceId:id,idempotencyKey:key,descriptionCode:'LEDGER_SOLIDARITY_FUNDING'});await this.queueLocal('SOLIDARITY_FUND_V1',{groupId:this.activeGroupId,caseId:id,amount,idempotencyKey:key},key);return entry;
  }
  async disburseSolidarity(id:string,amount:number):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_AMOUNT');const key=makeId('solidarity_pay');
    if(!this.isOffline())try{const entry=await this.request<any>('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/solidarity/cases/'+encodeURIComponent(id)+'/disburse',{method:'POST',body:JSON.stringify({amount,idempotencyKey:key})}),rows=await this.localSpecializedRecords('solidarity'),record=rows.find(x=>x.id===id);if(record)await this.saveLocalSpecialized('solidarity',{...record,data:{...record.data,localDisbursed:Number(record.data?.localDisbursed??0)+amount},updatedAt:new Date().toISOString()});return entry;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const record=(await this.localSpecializedRecords('solidarity')).find(x=>x.id===id);if(!record)throw Error('SOLIDARITY_CASE_NOT_FOUND');const disbursed=Number(record.data?.localDisbursed??0);if(disbursed+amount>Number(record.data?.approvedAmount??0))throw Error('SOLIDARITY_AMOUNT_EXCEEDS_APPROVAL');const updated={...record,data:{...record.data,localDisbursed:disbursed+amount},updatedAt:new Date().toISOString()};
    await this.saveLocalSpecialized('solidarity',updated);const entry=await this.patchLocalCashMovement({amount,direction:'out',kind:'cash_out',sourceType:'solidarity_case',sourceId:id,idempotencyKey:key,descriptionCode:'LEDGER_SOLIDARITY_DISBURSEMENT'});await this.queueLocal('SOLIDARITY_DISBURSE_V1',{groupId:this.activeGroupId,caseId:id,amount,idempotencyKey:key},key);return entry;
  }
  async saveGroupShop(input:{name:string;tagline?:string;visibility?:'GROUP_ONLY'|'PUBLIC';locality?:string;categories?:string[]}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/shop',{method:'POST',body:JSON.stringify(input)});}
  async groupStorefront():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/storefront');}
  async adCampaigns():Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/campaigns');}
  async visualMediaList():Promise<any[]> {if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/visual-media');}
  async visualMediaSlots():Promise<Record<string,string>> {if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/visual-slots');}
  async uploadVisualMedia(file:File,purpose:string):Promise<any> {if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const form=new FormData();form.append('file',file);form.append('purpose',purpose);return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/visual-media',{method:'POST',body:form});}
  async setVisualMediaSlot(slot:string,assetId:string):Promise<any> {if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/visual-slots',{method:'PUT',body:JSON.stringify({slot,assetId})});}
  visualMediaContentUrl(id:string):string {if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return '/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/visual-media/'+encodeURIComponent(id)+'/content';}
  async visualMediaBlob(id:string):Promise<Blob>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const url=this.visualMediaContentUrl(id),abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),12000);
    try {
      const response=await fetch(this.baseUrl+url,{method:'GET',headers:this.headers(),credentials:'same-origin',cache:'no-store',signal:abort.signal});
      if(!response.ok){const error=await response.json().catch(()=>({error:'MEDIA_READ_UNAVAILABLE'}));throw Error(String(error.error??'MEDIA_READ_UNAVAILABLE'));}
      const type=String(response.headers.get('content-type')??'');
      if(!['image/png','image/jpeg','image/webp'].includes(type))throw Error('MEDIA_INVALID_RESPONSE');
      return await response.blob();
    }finally{clearTimeout(timeout);}
  }
  async adDashboard():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/dashboard');}
  async adHousePlan():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/house-plan');}
  async adHouseVariants():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/house-variants',{method:'POST',body:'{}'});}
  async adInventory():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/inventory');}
  async adProspects():Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/prospects');}
  async createAdProspect(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/prospects',{method:'POST',body:JSON.stringify(input)});}
  async transitionAdProspect(id:string,state:string,note=''):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/prospects/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({state,note})});}

  async createAdCampaign(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/campaigns',{method:'POST',body:JSON.stringify(input)});}
  async transitionAdCampaign(id:string,state:string,note=''):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/campaigns/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({state,note})});}
  async recordAdMetric(id:string,event:'IMPRESSION'|'OPEN'|'ACTION'|'NEGATIVE_FEEDBACK'):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/campaigns/'+encodeURIComponent(id)+'/metric',{method:'POST',body:JSON.stringify({event})});}
  async saveExerciseYieldDraft(method:string,result:any):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const clean=method.trim();if(!clean)throw Error('YIELD_METHOD_REQUIRED');
    const draft={groupId:this.activeGroupId,method:clean,result:structuredClone(result),savedAt:new Date().toISOString(),savedBy:this.actorId};
    await this.saveCached('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/exercise-yield-draft',draft);return draft;
  }
  async exerciseYieldDraft():Promise<any|undefined>{
    if(!this.activeGroupId)return undefined;return this.cached('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/exercise-yield-draft');
  }
  async savingsYieldSourceData():Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const path='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/source-data';
    const pendingFinancial=this.outbox.list().filter(x=>x.actorId===this.actorId&&x.tenantId===this.tenantId&&String((x.payload as any)?.groupId??'')===this.activeGroupId&&!['CONFIRMED','CANCELLED','CONFLICT'].includes(x.status));
    if(!this.isOffline()&&!pendingFinancial.length)try{const data=await this.request<any>(path);if(!this.usingOfflineSnapshot)return data;}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const [rubrics,meetings,members,ledgerState,journal,periodRows,loanRows,sheetEvents]=await Promise.all([this.listRubrics(),this.listMeetings(),this.listMembers(),this.ledger(),this.sovereign.list(this.tenantId,this.activeGroupId),this.listWorkspaceRecords('FINANCE.LOAN_PERIOD',this.activeGroupId).catch(()=>[]),this.listCompletion('LOAN').catch(()=>[] as CompletionRecord[]),this.listWorkspaceRecords('FINANCE.SHEET_EVENT',this.activeGroupId).catch(()=>[])]);
    const isSavingsRubric=(r:any)=>{const kind=String(r.activityPlan?.kind??'').toUpperCase(),system=String(r.facets?.custom?.systemKey??'').toUpperCase(),name=String(r.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),semanticSavings=String(r.facets?.refundability??'')==='FULLY_REFUNDABLE'&&String(r.facets?.direction??'')!=='OUTFLOW'&&String(r.facets?.interestMode??'')==='CUSTOM';return kind==='SAVINGS'||/SAVINGS|EPARGNE/.test(system)||/epargne|saving/.test(name)||semanticSavings;};
    // Archived savings rubrics remain part of historical truth; archiving the
    // configuration must never turn past savings into zero.
    const savingsRubrics=rubrics.filter(isSavingsRubric),savingsIds=new Set(savingsRubrics.map(r=>r.id)),ordered=meetings.slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt))),sessionByMeeting=new Map(ordered.map((m,i)=>[m.id,i+1])),periodKeys=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],rubricById=new Map(savingsRubrics.map(r=>[r.id,r]));
    const deposits=(ledgerState.receipts??[]).filter((p:any)=>p.rubricId&&savingsIds.has(p.rubricId)&&Number(p.netAmount??0)>0).map((p:any)=>{const rubric=rubricById.get(p.rubricId)!,session=p.meetingId?(sessionByMeeting.get(p.meetingId)??1):1;return{id:p.id,memberId:p.membershipId,amount:Number(p.netAmount??0),session,fund:/scolaire|school/i.test(rubric.name)?'SCHOOL':'CLASSIC',periodKey:periodKeys[(session-1)%12],rubricId:p.rubricId,meetingId:p.meetingId??null,receivedAt:p.receivedAt};});
    const cached=await this.cached<any>(path),pendingKeys=new Set(this.outbox.list().filter(x=>!['CONFIRMED','CANCELLED','CONFLICT'].includes(x.status)).map(x=>x.idempotencyKey)),pendingInterest=journal.filter(x=>pendingKeys.has(String(x.payload.idempotencyKey??''))).reduce((n,x)=>n+(x.type==='LOAN_REPAY_V1'?Number(x.payload.interestAmount??0):x.type==='FINANCIAL_SHEET_ENTRY_V1'&&String(x.payload.nature)==='REPAYMENT'&&String(x.payload.repaymentComponent)==='INTEREST'?Number(x.payload.amount??0):0),0);
    // Merge by stable receipt id: a partial local hydration must never erase the
    // last server-confirmed savings table while connectivity is degraded.
    const knownReceiptIds=new Set((ledgerState.receipts??[]).map((x:any)=>String(x.id)));
    const depositById=new Map<string,any>();for(const d of (cached?.deposits??[]))if(d?.id&&!knownReceiptIds.has(String(d.id)))depositById.set(String(d.id),d);for(const d of deposits)if(d?.id)depositById.set(String(d.id),d);
    for(const target of this.pendingFinancialCellTargets()){
      if(!savingsIds.has(target.rubricId))continue;
      for(const [id,d] of depositById)if(d.memberId===target.membershipId&&d.rubricId===target.rubricId&&d.meetingId===target.meetingId)depositById.delete(id);
      const rubric=rubricById.get(target.rubricId)!,session=sessionByMeeting.get(target.meetingId)??1;
      if(target.targetAmount>0)depositById.set('pending:'+target.idempotencyKey,{id:'pending:'+target.idempotencyKey,memberId:target.membershipId,rubricId:target.rubricId,meetingId:target.meetingId,amount:target.targetAmount,session,fund:/scolaire|school/i.test(rubric.name)?'SCHOOL':'CLASSIC',periodKey:periodKeys[(session-1)%12],receivedAt:target.createdAt,localPending:true});
    }
    const effectiveDeposits=[...depositById.values()];
    const baseRecovered=Number(cached?.totals?.recoveredInterest??0),recoveredInterest=baseRecovered+pendingInterest,classicPrincipal=effectiveDeposits.filter((d:any)=>d.fund==='CLASSIC').reduce((n:number,d:any)=>n+Number(d.amount??0),0),schoolPrincipal=effectiveDeposits.filter((d:any)=>d.fund==='SCHOOL').reduce((n:number,d:any)=>n+Number(d.amount??0),0);
    const savingsSeries=savingsRubrics.map(r=>{const rows=effectiveDeposits.filter((d:any)=>d.rubricId===r.id);return{rubricId:r.id,name:r.name,total:rows.reduce((n:number,d:any)=>n+Number(d.amount??0),0),entries:rows.map((d:any)=>({memberId:d.memberId,meetingId:d.meetingId,session:d.session,amount:Number(d.amount??0)}))};});
    const normalizedPeriods=(periodRows as any[]).map((x:any)=>({id:x.id,loanId:String(x.data?.loanId??''),memberId:String(x.data?.membershipId??''),meetingId:String(x.data?.meetingId??''),principalPaid:Number(x.data?.principalPaid??0),interestPaid:Number(x.data?.interestPaid??0),principalAfter:Number(x.data?.principalAfter??0),interestAfter:Number(x.data?.interestAfter??0),interestNew:Number(x.data?.interestNew??0),nextInterestProjected:Number(x.data?.nextInterestProjected??0),totalDebtAfter:Number(x.data?.totalDebtAfter??0)}));
    const rubricMap=new Map(rubrics.map(r=>[r.id,r])),norm=(v:any)=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const officialLoanRubric=rubrics.find((r:any)=>String(r.facets?.custom?.systemKey??'').toUpperCase()==='LOAN'||/^(pret|prets|emprunt|emprunts|loan|loans)$/.test(norm(r.name).trim()));
    // Provisional views use the SAME payment allocator as the server owner.
    // They never append financial Ledger entries or persist a second balance.
    const pendingPayments:any[]=[],pendingDisbursements:any[]=[],pendingPeriods:any[]=[],pendingWarnings:string[]=[];let pendingCashDelta=0;
    const alreadyPosted=new Set((ledgerState.entries??[]).map(x=>String(x.idempotencyKey??'')));
    for(const item of pendingFinancial.filter(x=>x.type==='FINANCIAL_SHEET_ENTRY_V1')){
      const p=item.payload as any,amount=Number(p.amount),nature=String(p.nature);
      if(alreadyPosted.has(item.idempotencyKey+':repay')||alreadyPosted.has(item.idempotencyKey+':disburse'))continue;
      if(nature==='LOAN'){
        const rubric=rubricMap.get(String(p.rubricId))??officialLoanRubric,policy=resolveClientLoanPolicy({createdAt:item.createdAt,data:{completionState:'DRAFT'}},rubric?.policies?.loan,Date.parse(item.createdAt)),rate=Number(policy.rateBasisPointsPerPeriod??p.rateBasisPointsPerPeriod??0),timing=String(policy.interestTiming??p.interestTiming??'NEXT_SESSION_DUE'),loanId='pending:'+item.id,upfront=timing==='NEXT_SESSION_DUE'?0:Math.round(amount*rate/10000);
        loanRows.push({id:loanId,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:'COMPLETION.LOAN',title:String(p.rubricName??'Prêt'),summary:'Projection locale en attente',status:'ACTIVE',tags:['local-pending'],data:{completionKind:'LOAN',completionState:'DISBURSED',borrowerMembershipId:p.membershipId,rubricId:p.rubricId,principal:amount,outstandingPrincipal:amount,unpaidInterest:0,rateBasisPointsPerPeriod:rate,paymentPriority:policy.paymentPriority??p.paymentPriority??'CAPITAL_FIRST',interestTiming:timing,disbursementMeetingId:p.meetingId,localPending:true},createdBy:item.actorId,createdAt:item.createdAt,updatedAt:item.updatedAt} as any);
        pendingDisbursements.push({loanId,memberId:p.membershipId,meetingId:p.meetingId,session:sessionByMeeting.get(p.meetingId)??1,amount,rubricId:p.rubricId,createdAt:item.createdAt,localPending:true});
        pendingPeriods.push({id:loanId+':disburse',loanId,memberId:p.membershipId,meetingId:p.meetingId,principalPaid:0,interestPaid:upfront,principalAfter:amount,interestAfter:0,interestNew:0,nextInterestProjected:timing==='NEXT_SESSION_DUE'?Math.round(amount*rate/10000):0,totalDebtAfter:amount,localPending:true});
        if(upfront)pendingPayments.push({memberId:p.membershipId,meetingId:p.meetingId,loanId,principalPaid:0,interestPaid:upfront,localPending:true});
        pendingCashDelta+=upfront-amount;continue;
      }
      if(nature!=='REPAYMENT')continue;
      const candidates=loanRows.filter((x:any)=>String(x.data?.borrowerMembershipId??'')===String(p.membershipId)&&['DISBURSED','REPAYING'].includes(String(x.data?.completionState??'')));
      const loan=p.loanId?candidates.find(x=>x.id===p.loanId):candidates.length===1?candidates[0]:undefined;
      if(!loan){pendingWarnings.push('REPAYMENT_LOAN_ASSIGNMENT_PENDING:'+item.id);continue;}
      const d=loan.data as any,policy=resolveClientLoanPolicy(loan,officialLoanRubric?.policies?.loan,Date.parse(item.createdAt)),principal=Number(d.outstandingPrincipal??0),rate=Number(policy.rateBasisPointsPerPeriod??d.rateBasisPointsPerPeriod??0),priority=String(policy.paymentPriority??d.paymentPriority??'CAPITAL_FIRST');
      let interest=Number(d.unpaidInterest??0);const parseIds=(raw:any):string[]=>{try{return JSON.parse(String(raw??'[]'));}catch{return[];}};
      const accrued=parseIds(d.accruedMeetingIdsJson),prepared=parseIds(d.preparedInterestMeetingIdsJson);
      if(!accrued.includes(p.meetingId)&&!prepared.includes(p.meetingId)&&!d.preparedInterestPending)interest+=Math.round(principal*rate/10000);
      accrued.push(p.meetingId);
      try{
        const component=String(p.repaymentComponent??'AUTO');
        if(component==='AUTO'&&priority==='EXPLICIT_ALLOCATION')throw Error('LOAN_EXPLICIT_ALLOCATION_REQUIRED');
        const allocation=component==='AUTO'?applyLoanPayment({principalOutstanding:principal,unpaidInterest:interest,paymentAmount:amount,rateBasisPointsPerPeriod:0,priority:priority as 'CAPITAL_FIRST'|'INTEREST_FIRST'}):{principalPaid:component==='PRINCIPAL'?amount:0,interestPaid:component==='INTEREST'?amount:0};
        if(allocation.principalPaid>principal||allocation.interestPaid>interest)throw Error('INVALID_LOAN_REPAYMENT');
        const principalAfter=principal-allocation.principalPaid,interestAfter=interest-allocation.interestPaid;
        loan.data={...d,outstandingPrincipal:principalAfter,unpaidInterest:interestAfter,completionState:principalAfter+interestAfter===0?'CLOSED':'REPAYING',accruedMeetingIdsJson:JSON.stringify(accrued),preparedInterestPending:false,localPending:true};
        pendingPayments.push({memberId:p.membershipId,meetingId:p.meetingId,loanId:loan.id,principalPaid:allocation.principalPaid,interestPaid:allocation.interestPaid,localPending:true});pendingCashDelta+=amount;
        pendingPeriods.push({id:'pending:'+item.id,loanId:loan.id,memberId:p.membershipId,meetingId:p.meetingId,principalPaid:allocation.principalPaid,interestPaid:allocation.interestPaid,principalAfter,interestAfter,interestNew:interest-Number(d.unpaidInterest??0),nextInterestProjected:0,totalDebtAfter:principalAfter+interestAfter,localPending:true});
      }catch(error){pendingWarnings.push((error instanceof Error?error.message:'INVALID_LOAN_REPAYMENT')+':'+item.id);}
    }
    const eventPayments=(sheetEvents as any[]).map((x:any)=>{const d=x.data??{},rubric=rubricMap.get(String(d.rubricId??'')),name=norm(rubric?.name),explicit=String(rubric?.facets?.custom?.repaymentComponent??'').toUpperCase(),amount=Math.abs(Number(d.amount??0)),interest=Number(d.interestPaid??(explicit==='INTEREST'||/rembour.*interet|interest.*repay/.test(name)?amount:0)),principal=Number(d.principalPaid??(interest>0?0:/rembour|repay/.test(name)?amount:0));return{memberId:String(d.membershipId??''),meetingId:String(d.meetingId??''),loanId:String(d.loanId??''),principalPaid:Math.max(0,principal),interestPaid:Math.max(0,interest)};}).filter((x:any)=>x.principalPaid>0||x.interestPaid>0);
    eventPayments.push(...pendingPayments);
    const eventPrincipal=eventPayments.reduce((n:number,x:any)=>n+x.principalPaid,0),eventInterest=eventPayments.reduce((n:number,x:any)=>n+x.interestPaid,0),periodPrincipal=normalizedPeriods.reduce((n:number,x:any)=>n+x.principalPaid,0),periodInterest=normalizedPeriods.reduce((n:number,x:any)=>n+x.interestPaid,0);
    const repayments=(eventPrincipal>0?eventPayments.filter((x:any)=>x.principalPaid>0).map((x:any)=>({memberId:x.memberId,meetingId:x.meetingId,loanId:x.loanId,amount:x.principalPaid})):normalizedPeriods.filter((x:any)=>x.principalPaid>0).map((x:any)=>({memberId:x.memberId,meetingId:x.meetingId,loanId:x.loanId,amount:x.principalPaid})));
    const interestReceipts=(eventInterest>0?eventPayments.filter((x:any)=>x.interestPaid>0).map((x:any)=>({memberId:x.memberId,meetingId:x.meetingId,loanId:x.loanId,amount:x.interestPaid})):normalizedPeriods.filter((x:any)=>x.interestPaid>0).map((x:any)=>({memberId:x.memberId,meetingId:x.meetingId,loanId:x.loanId,amount:x.interestPaid})));
    const recoveredInterestFinal=Math.max(recoveredInterest,eventInterest,periodInterest);
    for(const period of pendingPeriods){const index=normalizedPeriods.findIndex(x=>x.loanId===period.loanId&&x.meetingId===period.meetingId);if(index<0)normalizedPeriods.push(period);else normalizedPeriods[index]={...period,principalPaid:normalizedPeriods[index].principalPaid+period.principalPaid,interestPaid:normalizedPeriods[index].interestPaid+period.interestPaid};}
    const meetingIndex=new Map(ordered.map((m,i)=>[m.id,i])),loanSheetEvents=(sheetEvents as any[]).filter((x:any)=>{const d=x.data??{},rubric=rubricMap.get(String(d.rubricId??'')),name=norm(rubric?.name),system=String((rubric?.facets as any)?.custom?.systemKey??'').toUpperCase();return String(d.direction??'').toUpperCase()==='OUT'&&(system==='LOAN'||/pret|emprunt|loan/.test(name))&&!/timbre|stamp/.test(name);});
    const loanDisbursements=loanSheetEvents.map((x:any)=>{const d=x.data??{},meetingId=String(d.meetingId??'');return{loanId:String(d.loanId??x.id),memberId:String(d.membershipId??''),meetingId,session:(meetingIndex.get(meetingId)??0)+1,amount:Math.abs(Number(d.amount??0)),rubricId:String(d.rubricId??''),createdAt:String(x.createdAt??x.updatedAt??'')}}).filter((x:any)=>x.meetingId&&x.amount>0);
    loanDisbursements.push(...pendingDisbursements);
    const disbursementMeetingByLoan=new Map<string,string>();for(const e of loanSheetEvents){const loanId=String(e.data?.loanId??'');if(loanId&&e.data?.meetingId)disbursementMeetingByLoan.set(loanId,String(e.data.meetingId));}
    const localLoanDebts=(loanRows as any[]).filter((x:any)=>['DISBURSED','REPAYING'].includes(String(x.data?.completionState??''))).map((x:any)=>{
      const rubric=rubricMap.get(String(x.data?.rubricId??''))??officialLoanRubric,effectivePolicy=resolveClientLoanPolicy(x,rubric?.policies?.loan,Date.now()),principal=Math.max(0,Number(x.data?.outstandingPrincipal??0)),rate=Number(effectivePolicy.rateBasisPointsPerPeriod??x.data?.rateBasisPointsPerPeriod??0),timing=String(effectivePolicy.interestTiming??x.data?.interestTiming??'NEXT_SESSION_DUE'),rawInterest=Math.max(0,Number(x.data?.unpaidInterest??0));
      const sourceMeetingId=String(disbursementMeetingByLoan.get(x.id)??x.data?.upfrontInterestSourceMeetingId??x.data?.disbursementMeetingId??''),sourceIndex=meetingIndex.get(sourceMeetingId),later=sourceIndex===undefined?[]:ordered.slice(sourceIndex+1),periodInterest=rate>0?Math.round(principal*rate/10000):0;
      const derivedCurrent=timing==='NEXT_SESSION_DUE'&&rawInterest===0&&later.length>0?periodInterest:0,interest=Math.max(rawInterest,derivedCurrent),latestLater=later.at(-1),nextInterestProjected=timing==='NEXT_SESSION_DUE'&&periodInterest>0&&latestLater?.status==='closed'?periodInterest:Number(x.data?.nextInterestProjected??0);
      return{loanId:x.id,memberId:String(x.data?.borrowerMembershipId??''),rubricId:String(x.data?.rubricId??''),title:x.title,principal,interest,nextInterestProjected,totalDue:principal+interest,totalIncludingNextInterest:principal+interest+nextInterestProjected,rateBasisPointsPerPeriod:rate,paymentPriority:String(effectivePolicy.paymentPriority??x.data?.paymentPriority??'CAPITAL_FIRST'),interestTiming:timing,policyRevisionId:String(effectivePolicy.policyRevisionId??x.data?.policyRevisionId??''),lastAccruedInterest:Number(x.data?.lastAccruedInterest??derivedCurrent),interestAppliesToMeetingId:String(x.data?.interestAppliesToMeetingId??latestLater?.id??'')||null,interestAppliesToLabel:String(x.data?.interestAppliesToLabel??(latestLater?.title||''))||null,interestSourceClosedMeetingId:String(x.data?.interestSourceClosedMeetingId??sourceMeetingId)||null,derivedInterest:derivedCurrent>0};
    }).filter((x:any)=>x.principal>0||x.interest>0||x.nextInterestProjected>0);
    const repaymentByMember=new Map<string,number>();for(const p of eventPayments)repaymentByMember.set(p.memberId,(repaymentByMember.get(p.memberId)??0)+Number(p.principalPaid??0));
    const historicalLoanDebts=loanSheetEvents.map((e:any,index:number)=>{const d=e.data??{},rubric=rubricMap.get(String(d.rubricId??'')),memberId=String(d.membershipId??''),gross=Math.abs(Number(d.amount??0)),availableRepayment=repaymentByMember.get(memberId)??0,used=Math.min(gross,availableRepayment);repaymentByMember.set(memberId,Math.max(0,availableRepayment-used));const principal=Math.max(0,gross-used),rate=Number(rubric?.policies?.loan?.rateBasisPointsPerPeriod??0),sourceMeetingId=String(d.meetingId??''),sourceIndex=meetingIndex.get(sourceMeetingId),later=sourceIndex===undefined?[]:ordered.slice(sourceIndex+1),periodInterest=rate>0?Math.round(principal*rate/10000):0,interest=later.length&&periodInterest>0?periodInterest:0,nextInterestProjected=later.at(-1)?.status==='closed'?periodInterest:0;return{loanId:String(d.loanId??e.id??('historical-loan-'+index)),memberId,rubricId:String(d.rubricId??''),title:String(rubric?.name??e.title??'Prêt historique'),principal,interest,nextInterestProjected,totalDue:principal+interest,totalIncludingNextInterest:principal+interest+nextInterestProjected,rateBasisPointsPerPeriod:rate,paymentPriority:String(rubric?.policies?.loan?.paymentPriority??'CAPITAL_FIRST'),interestTiming:String(rubric?.policies?.loan?.interestTiming??'NEXT_SESSION_DUE'),interestSourceClosedMeetingId:sourceMeetingId,derivedFromLegacySheet:true};}).filter((x:any)=>x.memberId&&x.principal>0);
    const loanDebtById=new Map<string,any>();for(const debt of (cached?.loanDebts??[]))if(debt?.loanId)loanDebtById.set(String(debt.loanId),debt);for(const debt of historicalLoanDebts)if(debt?.loanId&&!loanDebtById.has(String(debt.loanId)))loanDebtById.set(String(debt.loanId),debt);for(const debt of localLoanDebts)if(debt?.loanId)loanDebtById.set(String(debt.loanId),debt);for(const loan of loanRows)if(['CLOSED','CANCELLED','REJECTED'].includes(String(loan.data?.completionState??'')))loanDebtById.delete(String(loan.id));const loanDebts=[...loanDebtById.values()];
    const outstandingPrincipal=loanDebts.reduce((n:number,x:any)=>n+Number(x.principal??0),0),outstandingInterest=loanDebts.reduce((n:number,x:any)=>n+Number(x.interest??0),0),nextInterestProjected=loanDebts.reduce((n:number,x:any)=>n+Number(x.nextInterestProjected??0),0),otherDebt=Number(cached?.totals?.otherDebt??0),totalDebt=outstandingPrincipal+outstandingInterest+otherDebt,totalDebtIncludingNextInterest=totalDebt+nextInterestProjected,totalPrincipalRepaid=Math.max(eventPrincipal,periodPrincipal,Number(cached?.totals?.totalPrincipalRepaid??0)),totalSavings=effectiveDeposits.reduce((n:number,x:any)=>n+Number(x.amount??0),0),healthLeft=totalPrincipalRepaid+recoveredInterestFinal-totalDebt,healthWithNextLeft=totalPrincipalRepaid+recoveredInterestFinal-totalDebtIncludingNextInterest;
    const effectiveRepayments=repayments.length?repayments:(cached?.repayments??[]),effectiveInterestReceipts=interestReceipts.length?interestReceipts:(cached?.interestReceipts??[]);
    return{generatedAt:new Date().toISOString(),source:'LOCAL_LEDGER_RECEIPTS_AND_SOVEREIGN_JOURNAL',sourceDetail:'LAST_KNOWN_GOOD_PLUS_LOCAL_LEDGER_SHEETS_LOAN_PERIODS_AND_SOVEREIGN_JOURNAL',loanDisbursements,distributionPolicy:cached?.distributionPolicy??{eligibilityPolicy:'ALL_DEPOSITS',classicShareBasisPoints:7000,schoolShareBasisPoints:1000,borrowerShareBasisPoints:0,officeShareBasisPoints:2000,reserveShareBasisPoints:0,borrowerWeightMode:'VOLUME_TIME_INTEREST',eligibleThroughClassic:10,eligibleThroughSchool:7,poolingMode:'POOLED',residualPolicy:'TIME_WEIGHTED',recordId:null},members:members.map(m=>({id:m.id,displayName:m.displayName,status:m.status})),rubrics:savingsRubrics.map(r=>({id:r.id,name:r.name})),meetings:ordered.map((m,i)=>({id:m.id,title:m.title,session:i+1,scheduledAt:m.scheduledAt??m.openedAt,status:m.status})),deposits:effectiveDeposits,savingsSeries,repayments:effectiveRepayments,interestReceipts:effectiveInterestReceipts,loanPeriods:normalizedPeriods.length?normalizedPeriods:(cached?.loanPeriods??[]),loanDebts,closedLoanIds:loanRows.filter(x=>['CLOSED','CANCELLED','REJECTED'].includes(String(x.data?.completionState??''))).map(x=>x.id),otherDebts:cached?.otherDebts??[],totals:{classicPrincipal,schoolPrincipal,totalPrincipal:classicPrincipal+schoolPrincipal,totalSavings,totalPrincipalRepaid,recoveredInterest:recoveredInterestFinal,outstandingPrincipal,outstandingInterest,nextInterestProjected,otherDebt,totalDebt,totalDebtIncludingNextInterest,cashBalance:Number(ledgerState.summary?.cashBalance??cached?.totals?.cashBalance??0)+pendingCashDelta},health:{formula:'(TOTAL_REPAYMENTS + TOTAL_INTEREST_COLLECTED) - TOTAL_CURRENT_DEBT >= TOTAL_SAVINGS',left:healthLeft,right:totalSavings,difference:healthLeft-totalSavings,passes:healthLeft>=totalSavings},healthWithNext:{formula:'(TOTAL_REPAYMENTS + TOTAL_INTEREST_COLLECTED) - (TOTAL_CURRENT_DEBT + NEXT_INTEREST) >= TOTAL_SAVINGS',left:healthWithNextLeft,right:totalSavings,difference:healthWithNextLeft-totalSavings,passes:healthWithNextLeft>=totalSavings},interestByAccount:cached?.interestByAccount??{},warnings:[...(recoveredInterestFinal===0?['NO_REALIZED_INTEREST_FOUND']:[]),...pendingWarnings],localPending:pendingFinancial.length>0,offline:true};
  }
  async previewSavingsYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return allocateSavingsYield(input);}
  async previewWorkbookSavingsYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return simulateWorkbookYieldPipeline(input);}
  async previewCapitalAtWorkYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return allocateCapitalAtWorkYield(input);}
  async previewCapitalTimeYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return allocateCapitalTimeYield(input);}
  savingsEligibleDeposits(deposits:any[],policy:'ALL_DEPOSITS'|'LOAN_SESSION_GATE',loanSessions:number[],eligibleThroughSession:number):any[]{return eligibleSavingsDeposits(deposits,policy,loanSessions,eligibleThroughSession);}
  async previewBorrowerReward(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return allocateBorrowerReward(input);}
  async previewAttributedProductiveYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return allocateAttributedProductiveYield(input);}
  async savingsYieldPolicies():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return{presets:SAVINGS_YIELD_POLICY_PRESETS,activation:'HUMAN_CONFIRMATION_REQUIRED',financialPosting:false,offlineCapable:true};}
  async savingsYieldDoctor(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return diagnoseGroup(input);}
  async meetingAutopilot(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/meetings/autopilot-preview',{method:'POST',body:JSON.stringify(input)});}

  async previewInterestSplit(total:number,shares:Array<{key:string;basisPoints:number}>):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return splitInterestPool(total,shares);}
  async previewFinancialRecap(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return buildFinancialRecap(input);}
  async previewSessionRecap(meetingId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!(await this.listMeetings()).some(x=>x.id===meetingId))throw Error('MEETING_NOT_FOUND');return buildSessionRecap(input);}
  async previewClosingCarryover(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return buildClosingCarryover(input);}

  async valueNeeds():Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/value/needs') as any;return r.items??[];}
  async createValueNeed(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/value/needs',{method:'POST',body:JSON.stringify(input)});}
  async validateValueNeed(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/value/needs/'+encodeURIComponent(id)+'/validate',{method:'POST',body:'{}'});}
  async publishValueNeed(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/value/needs/'+encodeURIComponent(id)+'/publish',{method:'POST',body:'{}'});}
  async valueNeedMatches(id:string):Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/value/needs/'+encodeURIComponent(id)+'/matches') as any;return r.items??[];}
  async prepareValueProcurement(id:string,offerId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/value/needs/'+encodeURIComponent(id)+'/procurement',{method:'POST',body:JSON.stringify({offerId})});}
  async valueOffers():Promise<any[]>{const r=await this.request('/api/v1/value/offers') as any;return r.items??[];}
  async createValueOffer(input:any):Promise<any>{return this.request('/api/v1/value/offers',{method:'POST',body:JSON.stringify(input)});}

  async quietWatch():Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/quiet-watch') as any;return r.items??[];}
  async scanQuietWatch():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/quiet-watch',{method:'POST',body:'{}'});}
  async acknowledgeQuietWatch(id:string,note=''):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/quiet-watch/'+encodeURIComponent(id)+'/acknowledge',{method:'POST',body:JSON.stringify({note})});}
  async proposeQuietWatchAssistance(id:string,input:{objective:string;steps:string[];participants?:string[]}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/quiet-watch/'+encodeURIComponent(id)+'/assistance',{method:'POST',body:JSON.stringify(input)});}
  async approveQuietWatchAssistance(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/quiet-watch/'+encodeURIComponent(id)+'/approve-assistance',{method:'POST',body:'{}'});}
  async resolveQuietWatch(id:string,note:string,evidenceRef:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/quiet-watch/'+encodeURIComponent(id)+'/resolve',{method:'POST',body:JSON.stringify({note,evidenceRef})});}
  async safetyCases(groupId?:string):Promise<any[]>{const p=new URLSearchParams();if(groupId)p.set('groupId',groupId);const r=await this.request('/api/v1/safety/cases?'+p) as any;return r.items??[];}
  async reportSafety(input:any):Promise<any>{return this.request('/api/v1/safety/reports',{method:'POST',body:JSON.stringify(input)});}
  async transitionSafetyCase(id:string,state:string,note='',evidenceRef=''):Promise<any>{return this.request('/api/v1/safety/cases/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({state,note,evidenceRef})});}
  async safetyEvidence(id:string):Promise<any[]>{const r=await this.request('/api/v1/safety/cases/'+encodeURIComponent(id)+'/evidence') as any;return r.items??[];}
  async addSafetyEvidence(id:string,input:any):Promise<any>{return this.request('/api/v1/safety/cases/'+encodeURIComponent(id)+'/evidence',{method:'POST',body:JSON.stringify(input)});}
  async decideSafetyCase(id:string,input:any):Promise<any>{return this.request('/api/v1/safety/cases/'+encodeURIComponent(id)+'/decision',{method:'POST',body:JSON.stringify(input)});}
  async appealSafetyCase(id:string,input:any):Promise<any>{return this.request('/api/v1/safety/cases/'+encodeURIComponent(id)+'/appeal',{method:'POST',body:JSON.stringify(input)});}
  async assessReferralStructure(input:any):Promise<any>{return this.request('/api/v1/safety/referral-structure-assessment',{method:'POST',body:JSON.stringify(input)});}
  async trustGraph(membershipId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/trust/'+encodeURIComponent(membershipId));}
  async trustProfile(membershipId:string,band='SMALL'):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/trust/'+encodeURIComponent(membershipId)+'/profile?band='+encodeURIComponent(band));}
  async trustEvidence(membershipId:string):Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/trust/'+encodeURIComponent(membershipId)+'/evidence') as any;return r.items??[];}
  async addTrustEvidence(membershipId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/trust/'+encodeURIComponent(membershipId)+'/evidence',{method:'POST',body:JSON.stringify(input)});}

  async searchKnowledge(q='',groupId?:string):Promise<any[]>{const p=new URLSearchParams();if(q)p.set('q',q);if(groupId)p.set('groupId',groupId);const r=await this.request('/api/v1/knowledge?'+p) as any;return r.items??[];}
  async createKnowledge(input:any):Promise<any>{return this.request('/api/v1/knowledge',{method:'POST',body:JSON.stringify(input)});}
  async reviseKnowledge(id:string,input:any):Promise<any>{return this.request('/api/v1/knowledge/'+encodeURIComponent(id)+'/revisions',{method:'POST',body:JSON.stringify(input)});}
  async reviewKnowledge(id:string,state:'VALIDATED'|'TO_REVALIDATE',note=''):Promise<any>{return this.request('/api/v1/knowledge/'+encodeURIComponent(id)+'/review',{method:'POST',body:JSON.stringify({state,note})});}
  async encyclopedia(q=''):Promise<any[]>{const r=await this.request('/api/v1/encyclopedia?q='+encodeURIComponent(q)) as any;return r.items??[];}
  async founderAiContext(q=''):Promise<any>{return this.request('/api/v1/founder-ai/context?q='+encodeURIComponent(q));}
  async academy():Promise<any>{return this.request('/api/v1/academy');}
  async createAcademyCourse(input:any):Promise<any>{return this.request('/api/v1/academy/courses',{method:'POST',body:JSON.stringify(input)});}
  async enrollAcademy(courseId:string):Promise<any>{return this.request('/api/v1/academy/courses/'+encodeURIComponent(courseId)+'/enroll',{method:'POST',body:'{}'});}
  async submitAcademyLesson(enrollmentId:string,input:any):Promise<any>{return this.request('/api/v1/academy/enrollments/'+encodeURIComponent(enrollmentId)+'/lessons',{method:'POST',body:JSON.stringify(input)});}

  async referralDashboard():Promise<any>{return this.request('/api/v1/growth/referrals');}
  async createReferralCampaign(input:any):Promise<any>{return this.request('/api/v1/growth/referral-campaigns',{method:'POST',body:JSON.stringify(input)});}
  async setReferralCampaignState(id:string,state:'ACTIVE'|'PAUSED'|'DONE'):Promise<any>{return this.request('/api/v1/growth/referral-campaigns/'+encodeURIComponent(id)+'/state',{method:'POST',body:JSON.stringify({state})});}
  async createReferralShare(input:any):Promise<any>{return this.request('/api/v1/growth/referral-shares',{method:'POST',body:JSON.stringify(input)});}
  async registerReferralLanding(code:string):Promise<any>{return this.request('/api/v1/growth/referral-landings',{method:'POST',body:JSON.stringify({code})});}
  async registerReferralConversion(input:any):Promise<any>{return this.request('/api/v1/growth/referral-conversions',{method:'POST',body:JSON.stringify(input)});}
  async verifyReferralConversion(campaignId:string,conversionId:string,input:any):Promise<any>{return this.request('/api/v1/growth/referral-campaigns/'+encodeURIComponent(campaignId)+'/conversions/'+encodeURIComponent(conversionId)+'/verify',{method:'POST',body:JSON.stringify(input)});}
  async approveReferralReward(campaignId:string,conversionId:string):Promise<any>{return this.request('/api/v1/growth/referral-campaigns/'+encodeURIComponent(campaignId)+'/rewards/'+encodeURIComponent(conversionId)+'/approve',{method:'POST',body:'{}'});}

  async discoverCreatorContent(hubId?:string):Promise<any[]>{if(!this.activeGroupId)return[];const q=hubId?'?hubId='+encodeURIComponent(hubId):'';const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/creator-content'+q) as any;return r.items??[];}
  async creatorStudio():Promise<any>{return this.request('/api/v1/creator-studio');}
  async createCreatorContent(input:any):Promise<any>{return this.request('/api/v1/creator-studio/content',{method:'POST',body:JSON.stringify(input)});}
  async publishCreatorContent(id:string,input:{groupId:string;hubId:string}):Promise<any>{return this.request('/api/v1/creator-studio/content/'+encodeURIComponent(id)+'/publish',{method:'POST',body:JSON.stringify(input)});}
  async recordCreatorInterest(id:string,note=''):Promise<any>{return this.request('/api/v1/creator-studio/content/'+encodeURIComponent(id)+'/interest',{method:'POST',body:JSON.stringify({note})});}
  async startCreatorConversation(contentId:string,interestId:string,input:{groupId:string;hubId:string;body:string}):Promise<any>{return this.request('/api/v1/creator-studio/content/'+encodeURIComponent(contentId)+'/interests/'+encodeURIComponent(interestId)+'/conversation',{method:'POST',body:JSON.stringify(input)});}
  async creatorInterestToBusiness(contentId:string,interestId:string,input:{clientName:string;need:string;estimatedBudget?:number}):Promise<any>{return this.request('/api/v1/creator-studio/content/'+encodeURIComponent(contentId)+'/interests/'+encodeURIComponent(interestId)+'/action',{method:'POST',body:JSON.stringify(input)});}
  async talentProfile():Promise<any>{return this.request('/api/v1/talent/profile');}
  async addTalentEvidence(input:any):Promise<any>{return this.request('/api/v1/talent/evidence',{method:'POST',body:JSON.stringify(input)});}
  async businessSummary():Promise<any>{return this.request('/api/v1/business/summary');}
  async businessRecords():Promise<any[]>{const r=await this.request('/api/v1/business/records') as any;return r.items??[];}
  async configureBusiness(input:{name:string;currency?:string;services?:string[];locality?:string;monthlyFixedCosts?:number}):Promise<any>{return this.request('/api/v1/business/workspace',{method:'PUT',body:JSON.stringify(input)});}
  async createBusinessMandate(input:any):Promise<any>{return this.request('/api/v1/business/mandates',{method:'POST',body:JSON.stringify(input)});}
  async businessMandatesForGroup(groupId=this.activeGroupId):Promise<any[]>{if(!groupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/business/mandates') as any;return r.items??[];}
  async approveBusinessMandate(id:string):Promise<any>{return this.request('/api/v1/business/mandates/'+encodeURIComponent(id)+'/approve',{method:'POST',body:'{}'});}
  async activateBusinessMandate(id:string):Promise<any>{return this.request('/api/v1/business/mandates/'+encodeURIComponent(id)+'/activate',{method:'POST',body:'{}'});}
  async endBusinessMandate(id:string,reason:string):Promise<any>{return this.request('/api/v1/business/mandates/'+encodeURIComponent(id)+'/end',{method:'POST',body:JSON.stringify({reason})});}
  async createBusinessClient(input:any):Promise<any>{return this.request('/api/v1/business/clients',{method:'POST',body:JSON.stringify(input)});}
  async setBusinessClientState(id:string,state:string):Promise<any>{return this.request('/api/v1/business/clients/'+encodeURIComponent(id)+'/state',{method:'POST',body:JSON.stringify({state})});}
  async createBusinessOffer(input:any):Promise<any>{return this.request('/api/v1/business/offers',{method:'POST',body:JSON.stringify(input)});}
  async setBusinessOfferState(id:string,state:string):Promise<any>{return this.request('/api/v1/business/offers/'+encodeURIComponent(id)+'/state',{method:'POST',body:JSON.stringify({state})});}
  async createBusinessRequest(input:any):Promise<any>{return this.request('/api/v1/business/requests',{method:'POST',body:JSON.stringify(input)});}
  async setBusinessRequestState(id:string,state:string):Promise<any>{return this.request('/api/v1/business/requests/'+encodeURIComponent(id)+'/state',{method:'POST',body:JSON.stringify({state})});}
  async createBusinessQuote(input:any):Promise<any>{return this.request('/api/v1/business/quotes',{method:'POST',body:JSON.stringify(input)});}
  async decideBusinessQuote(id:string,state:string):Promise<any>{return this.request('/api/v1/business/quotes/'+encodeURIComponent(id)+'/decision',{method:'POST',body:JSON.stringify({state})});}
  async createBusinessOrder(input:any):Promise<any>{return this.request('/api/v1/business/orders',{method:'POST',body:JSON.stringify(input)});}
  async setBusinessOrderState(id:string,state:string):Promise<any>{return this.request('/api/v1/business/orders/'+encodeURIComponent(id)+'/state',{method:'POST',body:JSON.stringify({state})});}
  async createBusinessContract(input:any):Promise<any>{return this.request('/api/v1/business/contracts',{method:'POST',body:JSON.stringify(input)});}
  async issueBusinessInvoice(input:any):Promise<any>{return this.request('/api/v1/business/invoices',{method:'POST',body:JSON.stringify(input)});}
  async recordBusinessPayment(input:any):Promise<any>{return this.request('/api/v1/business/payments',{method:'POST',body:JSON.stringify(input)});}
  async recordBusinessExpense(input:any):Promise<any>{return this.request('/api/v1/business/expenses',{method:'POST',body:JSON.stringify(input)});}
  async recordBusinessRevenue(input:any):Promise<any>{return this.request('/api/v1/business/revenues',{method:'POST',body:JSON.stringify(input)});}
  async logBusinessCommunication(input:any):Promise<any>{return this.request('/api/v1/business/communications',{method:'POST',body:JSON.stringify(input)});}
  async createBusinessAction(input:any):Promise<any>{return this.request('/api/v1/business/actions',{method:'POST',body:JSON.stringify(input)});}
  async completeBusinessAction(id:string):Promise<any>{return this.request('/api/v1/business/actions/'+encodeURIComponent(id)+'/complete',{method:'POST',body:'{}'});}
  async recordBusinessTime(input:any):Promise<any>{return this.request('/api/v1/business/time',{method:'POST',body:JSON.stringify(input)});}
  async createBusinessScenario(input:any):Promise<any>{return this.request('/api/v1/business/scenarios',{method:'POST',body:JSON.stringify(input)});}
  async businessProfitability():Promise<any[]>{const r=await this.request('/api/v1/business/profitability') as any;return r.items??[];}
  async businessOperatingBrief():Promise<any>{return this.request('/api/v1/business/brief');}

  async externalPrograms(kind?:'PARTNER'|'NGO'):Promise<any[]>{if(!this.activeGroupId)return[];const q=kind?'?kind='+encodeURIComponent(kind):'';return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs'+q);}
  async createExternalProgram(input:{kind:'PARTNER'|'NGO';partyName:string;programName:string;purpose:string;localities?:string[];tags?:string[];dataAccess?:'NONE'|'GROUP_AGGREGATE_ECONOMIC'}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs',{method:'POST',body:JSON.stringify(input)});}
  async transitionExternalProgram(id:string,state:'ACTIVE'|'PAUSED'|'COMPLETED'):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({state})});}
  async externalSharePacks(programId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs/'+encodeURIComponent(programId)+'/share-packs');}
  async issueExternalSharePack(programId:string,purpose:string,ttlDays=30):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs/'+encodeURIComponent(programId)+'/share-packs',{method:'POST',body:JSON.stringify({purpose,ttlDays})});}
  async revokeExternalSharePack(shareId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-share-packs/'+encodeURIComponent(shareId)+'/revoke',{method:'POST',body:'{}'});}
  async programEnrollments(programId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs/'+encodeURIComponent(programId)+'/enrollments');}
  async createProgramEnrollment(programId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs/'+encodeURIComponent(programId)+'/enrollments',{method:'POST',body:JSON.stringify(input)});}
  async revokeProgramEnrollment(enrollmentId:string,reason:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/program-enrollments/'+encodeURIComponent(enrollmentId)+'/revoke',{method:'POST',body:JSON.stringify({reason})});}
  async programSupportActions(enrollmentId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/program-enrollments/'+encodeURIComponent(enrollmentId)+'/support-actions');}
  async recordProgramSupportAction(enrollmentId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/program-enrollments/'+encodeURIComponent(enrollmentId)+'/support-actions',{method:'POST',body:JSON.stringify(input)});}
  async programFundingEvidence(enrollmentId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/program-enrollments/'+encodeURIComponent(enrollmentId)+'/funding');}
  async recordProgramFundingEvidence(enrollmentId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/program-enrollments/'+encodeURIComponent(enrollmentId)+'/funding',{method:'POST',body:JSON.stringify(input)});}
  async programHandoverPlans(enrollmentId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/program-enrollments/'+encodeURIComponent(enrollmentId)+'/handovers');}
  async createProgramHandover(enrollmentId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/program-enrollments/'+encodeURIComponent(enrollmentId)+'/handovers',{method:'POST',body:JSON.stringify(input)});}
  async transitionProgramHandover(planId:string,state:string,input:any={}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/program-handovers/'+encodeURIComponent(planId)+'/transition',{method:'POST',body:JSON.stringify({state,...input})});}
  async economicProfile():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/economic-profile');}

  async createStockItem(input:{sku:string;name:string;quantity:number;unit?:string;unitPrice?:number;description?:string;published?:boolean;ownership?:'COMMERCIAL'|'POT_RESERVED'|'CONSIGNMENT'|'DEPOSIT_SALE';ownerRef?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/stock',{method:'POST',body:JSON.stringify(input)});}
  async marketSuppliers():Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/suppliers') as any;return r.items??[];}
  async registerMarketSupplier(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/suppliers',{method:'POST',body:JSON.stringify(input)});}
  async marketProcurement():Promise<any>{if(!this.activeGroupId)return{procurements:[],credits:[],suppliers:[]};return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements');}
  async createMarketProcurement(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements',{method:'POST',body:JSON.stringify(input)});}
  async approveValueProcurementDraft(draftId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements/from-value-draft/'+encodeURIComponent(draftId),{method:'POST',body:JSON.stringify(input)});}
  async receiveMarketProcurement(id:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements/'+encodeURIComponent(id)+'/receive',{method:'POST',body:JSON.stringify(input)});}
  async returnMarketProcurement(id:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements/'+encodeURIComponent(id)+'/return',{method:'POST',body:JSON.stringify(input)});}
  async paySupplierCredit(id:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/supplier-credits/'+encodeURIComponent(id)+'/payments',{method:'POST',body:JSON.stringify(input)});}
  async marketStockProjection(itemId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/stock/'+encodeURIComponent(itemId)+'/projection');}
  async marketProcurementLifecycle(procurementId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements/'+encodeURIComponent(procurementId)+'/lifecycle');}
  async recordMarketSupplierInvoice(procurementId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements/'+encodeURIComponent(procurementId)+'/invoices',{method:'POST',body:JSON.stringify(input)});}
  async reconcileMarketSupplierInvoice(procurementId:string,invoiceId:string,note?:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements/'+encodeURIComponent(procurementId)+'/invoices/'+encodeURIComponent(invoiceId)+'/reconcile',{method:'POST',body:JSON.stringify({note})});}
  async issueMarketSupplierCreditNote(procurementId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/procurements/'+encodeURIComponent(procurementId)+'/credit-notes',{method:'POST',body:JSON.stringify(input)});}

  async setStockListing(itemId:string,input:{published:boolean;unitPrice?:number;description?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/stock/'+encodeURIComponent(itemId)+'/listing',{method:'POST',body:JSON.stringify(input)});}
  async ecoPulseFeed(input:{locality?:string;limit?:number}={}):Promise<any>{const p=new URLSearchParams();if(input.locality)p.set('locality',input.locality);if(input.limit)p.set('limit',String(input.limit));return this.request('/api/v1/pulse/feed?'+p);}
  async ecoPulseProfile():Promise<any>{return this.request('/api/v1/pulse/profile');}
  async recordEcoPulse(input:{itemId:string;itemKind:string;action:'IMPRESSION'|'OPEN'|'DWELL_10S'|'COMPLETE'|'SAVE'|'SHARE'|'JOIN'|'RSVP'|'PURCHASE_INTENT'|'SEARCH_CLICK'|'SKIP'|'HIDE'|'NOT_INTERESTED';source:string;groupId?:string;locality?:string;tags?:string[]}):Promise<any>{return this.request('/api/v1/pulse/events',{method:'POST',body:JSON.stringify(input)});}
  async discoverInterestCommunities(input:{q?:string;locality?:string;tags?:string[];limit?:number}={}):Promise<any[]>{const p=new URLSearchParams();if(input.q)p.set('q',input.q);if(input.locality)p.set('locality',input.locality);if(input.tags?.length)p.set('tags',input.tags.join(','));if(input.limit)p.set('limit',String(input.limit));return this.request('/api/v1/communities?'+p);}
  async myInterestCommunities():Promise<any[]>{return this.request('/api/v1/communities?mine=true');}
  async createInterestCommunity(input:{name:string;description?:string;locality?:string;visibility?:'PUBLIC'|'PRIVATE';joinPolicy?:'OPEN'|'REQUEST';tags?:string[]}):Promise<any>{return this.request('/api/v1/communities',{method:'POST',body:JSON.stringify(input)});}
  async interestCommunity(id:string):Promise<any>{return this.request('/api/v1/communities/'+encodeURIComponent(id));}
  async joinInterestCommunity(id:string,message=''):Promise<any>{return this.request('/api/v1/communities/'+encodeURIComponent(id)+'/join',{method:'POST',body:JSON.stringify({message})});}
  async interestJoinRequests(id:string):Promise<any[]>{return this.request('/api/v1/communities/'+encodeURIComponent(id)+'/join-requests');}
  async decideInterestJoin(id:string,requestId:string,decision:'APPROVE'|'REJECT'):Promise<any>{return this.request('/api/v1/communities/'+encodeURIComponent(id)+'/join-requests/'+encodeURIComponent(requestId)+'/decision',{method:'POST',body:JSON.stringify({decision})});}
  async interestCommunityFeed(id:string,limit=100):Promise<any[]>{return this.request('/api/v1/communities/'+encodeURIComponent(id)+'/content?limit='+String(limit));}
  async createInterestContent(id:string,input:{kind:'POST'|'EVENT'|'PLACE'|'OFFER'|'REQUEST';title?:string;body:string;category?:string;locality?:string;startsAt?:string;endsAt?:string;metadata?:Record<string,unknown>}):Promise<any>{return this.request('/api/v1/communities/'+encodeURIComponent(id)+'/content',{method:'POST',body:JSON.stringify(input)});}
  async moderateInterestContent(id:string,contentId:string,state:'PUBLISHED'|'HIDDEN'):Promise<any>{return this.request('/api/v1/communities/'+encodeURIComponent(id)+'/content/'+encodeURIComponent(contentId)+'/moderate',{method:'POST',body:JSON.stringify({state})});}
  async forumMessages(hubId:string,input:{limit?:number;before?:string;after?:string;around?:string}={}):Promise<any>{if(!this.activeGroupId)return{messages:[]};const p=new URLSearchParams();if(input.limit)p.set('limit',String(input.limit));if(input.before)p.set('before',input.before);if(input.after)p.set('after',input.after);if(input.around)p.set('around',input.around);return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/forum-v2/hubs/'+encodeURIComponent(hubId)+'/messages?'+p);}
  async createForumMessage(hubId:string,input:{kind?:string;title?:string;body:string;parentId?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/forum-v2/hubs/'+encodeURIComponent(hubId)+'/messages',{method:'POST',body:JSON.stringify(input)});}
  async forumUserState(hubId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/forum-v2/hubs/'+encodeURIComponent(hubId)+'/state');}
  async saveForumDraft(hubId:string,title:string,body:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/forum-v2/hubs/'+encodeURIComponent(hubId)+'/draft',{method:'PUT',body:JSON.stringify({title,body})});}
  async saveForumReadPosition(hubId:string,messageId:string,anchorRatio=0):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/forum-v2/hubs/'+encodeURIComponent(hubId)+'/read-position',{method:'PUT',body:JSON.stringify({messageId,anchorRatio})});}
  async toggleForumReaction(messageId:string,reaction:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/forum-v2/messages/'+encodeURIComponent(messageId)+'/reaction',{method:'POST',body:JSON.stringify({reaction})});}
  async listCommunityHubs():Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/community/hubs');}
  async createCommunityHub(input:{title:string;about?:string;visibility?:'GROUP_PRIVATE'|'PLATFORM_PUBLIC';tags?:string[];federatedGroupCodes?:string[]}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/community/hubs',{method:'POST',body:JSON.stringify(input)});}
  async listCommunityPosts(hubId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/community/hubs/'+encodeURIComponent(hubId)+'/posts');}
  async createCommunityPost(hubId:string,input:{kind?:'DISCUSSION'|'ANNOUNCEMENT'|'OFFER'|'REQUEST';title?:string;body:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/community/hubs/'+encodeURIComponent(hubId)+'/posts',{method:'POST',body:JSON.stringify(input)});}
  async moderateCommunityPost(postId:string,state:'PUBLISHED'|'HIDDEN',reason:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/community/posts/'+encodeURIComponent(postId)+'/moderate',{method:'POST',body:JSON.stringify({state,reason})});}
  async communityFederation(hubId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/community/hubs/'+encodeURIComponent(hubId)+'/federation');}
  async createMarketOrder(input:{stockItemId:string;quantity:number;customerRef:string;unitPrice?:number}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/orders',{method:'POST',body:JSON.stringify(input)});}
  async deliverMarketOrder(id:string,quantity:number):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/orders/'+encodeURIComponent(id)+'/deliver',{method:'POST',body:JSON.stringify({quantity})});}
  async returnMarketOrder(id:string,quantity:number,reason:string):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/orders/'+encodeURIComponent(id)+'/return',{method:'POST',body:JSON.stringify({quantity,reason})});}
  async disputeMarketOrder(id:string,summary:string):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/orders/'+encodeURIComponent(id)+'/dispute',{method:'POST',body:JSON.stringify({summary})});}
  async createGroupBuy(input:{title:string;stockItemId?:string;thresholdQuantity:number;deadline:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/group-buys',{method:'POST',body:JSON.stringify(input)});}
  async commitGroupBuy(id:string,membershipId:string,quantity:number):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/group-buys/'+encodeURIComponent(id)+'/commit',{method:'POST',body:JSON.stringify({membershipId,quantity})});}
  async socialCommerce():Promise<any>{if(!this.activeGroupId)return{flashOffers:[],requests:[],responses:[],deals:[],liveMarkets:[]};return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/social-commerce');}
  async createFlashOffer(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/flash-offers',{method:'POST',body:JSON.stringify(input)});}
  async closeFlashOffer(id:string,reason=''):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/flash-offers/'+encodeURIComponent(id)+'/close',{method:'POST',body:JSON.stringify({reason})});}
  async createMarketRequest(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/requests',{method:'POST',body:JSON.stringify(input)});}
  async openMarketRequest(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/requests/'+encodeURIComponent(id)+'/open',{method:'POST',body:'{}'});}
  async acceptPredictedMarketRequest(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/requests/'+encodeURIComponent(id)+'/accept-prediction',{method:'POST',body:'{}'});}
  async marketRequestResponses(id:string):Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/requests/'+encodeURIComponent(id)+'/responses') as any;return r.items??[];}
  async respondMarketRequest(id:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/requests/'+encodeURIComponent(id)+'/responses',{method:'POST',body:JSON.stringify(input)});}
  async shortlistMarketResponse(requestId:string,responseId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/requests/'+encodeURIComponent(requestId)+'/responses/'+encodeURIComponent(responseId)+'/shortlist',{method:'POST',body:'{}'});}
  async selectMarketResponse(requestId:string,responseId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/requests/'+encodeURIComponent(requestId)+'/responses/'+encodeURIComponent(responseId)+'/select',{method:'POST',body:'{}'});}
  async transitionMarketRequest(id:string,state:'FULFILLMENT'|'CLOSED'|'DISPUTED',note=''):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/requests/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({state,note})});}
  async createDeal(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/deals',{method:'POST',body:JSON.stringify(input)});}
  async openDeal(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/deals/'+encodeURIComponent(id)+'/open',{method:'POST',body:'{}'});}
  async commitDealQuantity(id:string,quantity:number):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/deals/'+encodeURIComponent(id)+'/commit',{method:'POST',body:JSON.stringify({quantity})});}
  async dealCommitments(id:string):Promise<any[]>{if(!this.activeGroupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/deals/'+encodeURIComponent(id)+'/commitments') as any;return r.items??[];}
  async transitionDeal(id:string,state:'FULFILLMENT'|'CLOSED'|'DISPUTED',note=''):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/deals/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({state,note})});}
  async createLiveMarket(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/live-markets',{method:'POST',body:JSON.stringify(input)});}
  async setLiveMarketState(id:string,state:'SCHEDULED'|'LIVE'|'CLOSED'):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/live-markets/'+encodeURIComponent(id)+'/state',{method:'POST',body:JSON.stringify({state})});}
  async pinLiveMarketDeal(id:string,dealId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/live-markets/'+encodeURIComponent(id)+'/pin-deal',{method:'POST',body:JSON.stringify({dealId})});}

  async approveHistoricalImport(id:string,mapping:Record<string,string>={}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/imports/'+encodeURIComponent(id)+'/approve',{method:'POST',body:JSON.stringify({mapping})});}
  async applyHistoricalImport(id:string):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/imports/'+encodeURIComponent(id)+'/apply',{method:'POST',body:'{}'});}
  private completionPath(kind?:CompletionKind):string{const p=new URLSearchParams();if(kind)p.set('kind',kind);return '/api/v1/groups/'+encodeURIComponent(this.activeGroupId??'')+'/completion?'+p;}
  private localCompletionStatus(state:string):WorkspaceStatus{
    if(['DRAFT','UPLOADED','CAPTURED','REQUESTED','SPECIFIED','PREPARED','CREATED','REGISTERED'].includes(state))return'DRAFT';
    if(['DONE','COMPLETED','CLOSED','FULFILLED','ACCEPTED','RESOLVED','RESTORED_TEST','APPLIED','SERVED'].includes(state))return'DONE';
    if(['ARCHIVED','REVOKED','CANCELLED','REJECTED','REMOVED','SUPERSEDED','EXPIRED','DISCARDED'].includes(state))return'ARCHIVED';
    return'ACTIVE';
  }
  private encodeCompletionValue(value:unknown):string|number|boolean|null{
    if(value===null||typeof value==='string'||typeof value==='boolean')return value;
    if(typeof value==='number'){if(!Number.isFinite(value))throw Error('INVALID_NON_FINITE_VALUE');return value;}
    if(value===undefined)return null;return JSON.stringify(value);
  }
  private async saveLocalCompletion(record:CompletionRecord):Promise<void>{
    const allPath=this.completionPath(),kind=String(record.data.completionKind) as CompletionKind,kindPath=this.completionPath(kind);
    const up=(rows:CompletionRecord[])=>[...rows.filter(x=>x.id!==record.id),structuredClone(record)].sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    await this.patchCachedArray<CompletionRecord>(allPath,up);await this.patchCachedArray<CompletionRecord>(kindPath,up);
  }
  async listCompletion(kind?:CompletionKind):Promise<CompletionRecord[]>{if(!this.activeGroupId)return[];return this.request(this.completionPath(kind));}
  async createCompletion(kind:CompletionKind,input:{id?:string;title:string;summary?:string;data?:Record<string,unknown>;tags?:string[]}):Promise<CompletionRecord>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const localId=input.id?.trim()||makeId('completion');
    if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/completion',{method:'POST',body:JSON.stringify({kind,id:localId,...input})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const spec=COMPLETION_WORKFLOWS[kind];if(!spec)throw Error('INVALID_COMPLETION_KIND');const title=input.title.trim();if(!title)throw Error('TITLE_REQUIRED');
    const data:Record<string,string|number|boolean|null>={completionKind:kind,completionState:spec.initial,completionVersion:1};for(const [key,value] of Object.entries(input.data??{}))data[key]=this.encodeCompletionValue(value);
    const stamp=new Date().toISOString(),record:CompletionRecord={id:localId,tenantId:this.tenantId,groupId:this.activeGroupId,moduleId:spec.moduleId,title,summary:input.summary?.trim()||undefined,status:this.localCompletionStatus(spec.initial),tags:['completion','kind:'+kind,'state:'+spec.initial,...new Set(input.tags??[])],data,createdBy:this.actorId,createdAt:stamp,updatedAt:stamp};
    await this.saveLocalCompletion(record);await this.queueLocal('COMPLETION_CREATE_V1',{groupId:this.activeGroupId,kind,id:localId,title:record.title,summary:record.summary??null,data:structuredClone(input.data??{}),tags:input.tags??[]},'completion-create:'+localId);return record;
  }
  async transitionCompletion(id:string,to:string,expectedVersion:number,patch:Record<string,unknown>={},reason?:string):Promise<CompletionRecord>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/completion/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({to,expectedVersion,patch,reason})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const current=(await this.listCompletion()).find(x=>x.id===id);if(!current)throw Error('COMPLETION_RECORD_NOT_FOUND');const kind=String(current.data.completionKind) as CompletionKind,spec=COMPLETION_WORKFLOWS[kind],state=String(current.data.completionState),version=Number(current.data.completionVersion??0);
    if(version!==expectedVersion)throw Error('COMPLETION_VERSION_CONFLICT');if(!(spec?.transitions[state]??[]).includes(to))throw Error('INVALID_COMPLETION_TRANSITION');
    const data={...current.data};for(const [key,value] of Object.entries(patch)){if(['completionKind','completionState','completionVersion'].includes(key))continue;data[key]=this.encodeCompletionValue(value);}data.completionState=to;data.completionVersion=version+1;if(reason)data.lastTransitionReason=reason.trim();
    const tags=[...current.tags.filter(x=>!x.startsWith('state:')),'state:'+to],next:CompletionRecord={...current,status:this.localCompletionStatus(to),tags,data,updatedAt:new Date().toISOString()};
    await this.saveLocalCompletion(next);await this.queueLocal('COMPLETION_TRANSITION_V1',{groupId:this.activeGroupId,id,to,expectedVersion,patch:structuredClone(patch),reason:reason??null},'completion-transition:'+id+':'+expectedVersion+':'+to);return next;
  }
  async createHistoricalIdentityClaim(input:{historicalReference:string;evidenceReference:string;claimedMembershipId?:string;note?:string}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/identity-claims',{method:'POST',body:JSON.stringify(input)});}
  async exercises():Promise<CompletionRecord[]>{return this.listCompletion('GROUP_EXERCISE');}
  async openExercise(input:{label:string;openingCash:number;startsAt?:string;previousExerciseId?:string;memberOpeningPositions?:unknown[];retainedFunds?:unknown[];carryManifestId?:string}):Promise<CompletionRecord>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const label=input.label.trim();if(!label)throw Error('EXERCISE_LABEL_REQUIRED');if(!Number.isSafeInteger(input.openingCash)||input.openingCash<0)throw Error('INVALID_OPENING_CASH');
    const history=await this.exercises(),existing=history.find(x=>['PREPARED','OPEN','CLOSING'].includes(String(x.data.completionState)));if(existing)throw Error('EXERCISE_ALREADY_OPEN');
    let record=await this.createCompletion('GROUP_EXERCISE',{title:label,data:{label,openingCash:input.openingCash,startsAt:input.startsAt??new Date().toISOString(),previousExerciseId:input.previousExerciseId??null,carryManifestId:input.carryManifestId??null,memberOpeningPositionsJson:JSON.stringify(input.memberOpeningPositions??[]),retainedFundsJson:JSON.stringify(input.retainedFunds??[])}});
    record=await this.transitionCompletion(record.id,'OPEN',Number(record.data.completionVersion??1),{openedAt:new Date().toISOString()});
    if(history.length===0&&input.openingCash>0)await this.recordOpeningBalance(input.openingCash,'Trésorerie d’ouverture · '+label);
    const groups=await this.cached<Group[]>('/api/v1/groups')??[],group=groups.find(x=>x.id===this.activeGroupId);if(group){const next={...group,currentExerciseLabel:label};await this.saveCached('/api/v1/groups',groups.map(x=>x.id===group.id?next:x));}
    await this.queueLocal('GROUP_EXERCISE_LABEL_V1',{groupId:this.activeGroupId,exerciseId:record.id,label},'exercise-label:'+record.id);return record;
  }
  async prepareExerciseClosing(exerciseId:string,input:ExerciseClosingInput):Promise<{exercise:CompletionRecord;plan:ExerciseClosingPlan}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const exercise=(await this.exercises()).find(x=>x.id===exerciseId);if(!exercise)throw Error('EXERCISE_NOT_FOUND');if(String(exercise.data.completionState)!=='OPEN')throw Error('EXERCISE_NOT_OPEN');
    const plan=buildExerciseClosingPlan(input),next=await this.transitionCompletion(exercise.id,'CLOSING',Number(exercise.data.completionVersion??0),{closingPlanJson:JSON.stringify(plan),closingPreparedAt:new Date().toISOString(),closingPreparedBy:this.actorId});
    return{exercise:next,plan};
  }
  async reopenExerciseClosing(exerciseId:string,reason:string):Promise<CompletionRecord>{
    const exercise=(await this.exercises()).find(x=>x.id===exerciseId);if(!exercise)throw Error('EXERCISE_NOT_FOUND');const clean=reason.trim();if(!clean)throw Error('REASON_REQUIRED');
    return this.transitionCompletion(exercise.id,'OPEN',Number(exercise.data.completionVersion??0),{},clean);
  }
  async closeExercise(exerciseId:string):Promise<CompletionRecord>{
    const exercise=(await this.exercises()).find(x=>x.id===exerciseId);if(!exercise)throw Error('EXERCISE_NOT_FOUND');if(String(exercise.data.completionState)!=='CLOSING')throw Error('EXERCISE_NOT_CLOSING');if(!String(exercise.data.closingPlanJson??''))throw Error('EXERCISE_CLOSING_PLAN_REQUIRED');
    return this.transitionCompletion(exercise.id,'CLOSED',Number(exercise.data.completionVersion??0),{closedAt:new Date().toISOString(),closedBy:this.actorId});
  }
  async carryForwardExercise(exerciseId:string,nextLabel:string):Promise<{source:CompletionRecord;next:CompletionRecord;seed:any}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const history=await this.exercises(),exercise=history.find(x=>x.id===exerciseId);if(!exercise)throw Error('EXERCISE_NOT_FOUND');
    let plan:ExerciseClosingPlan;try{plan=JSON.parse(String(exercise.data.closingPlanJson??''));}catch{throw Error('EXERCISE_CLOSING_PLAN_REQUIRED');}
    const seed=buildExerciseCarryForwardSeed(exercise.id,nextLabel,plan),existingNext=history.find(x=>String(x.data.previousExerciseId??'')===exercise.id&&String(x.data.carryManifestId??'')===seed.carryManifestId);
    if(String(exercise.data.completionState)==='CARRIED_FORWARD'){
      const next=existingNext??history.find(x=>x.id===String(exercise.data.successorExerciseId??''));if(!next)throw Error('EXERCISE_SUCCESSOR_MISSING');return{source:exercise,next,seed};
    }
    if(String(exercise.data.completionState)!=='CLOSED')throw Error('EXERCISE_NOT_CLOSED');
    // Reserve/open the successor first. If interruption occurs here, retry detects it by previousExerciseId+carryManifestId.
    let next=existingNext;
    if(!next)next=await this.openExercise({label:nextLabel,openingCash:seed.openingCash,previousExerciseId:exercise.id,memberOpeningPositions:seed.memberOpeningPositions,retainedFunds:seed.retainedFunds,carryManifestId:seed.carryManifestId} as any);
    const source=await this.transitionCompletion(exercise.id,'CARRIED_FORWARD',Number(exercise.data.completionVersion??0),{carriedForwardAt:new Date().toISOString(),nextExerciseLabel:nextLabel,nextExerciseOpeningCash:seed.openingCash,carryManifestId:seed.carryManifestId,successorExerciseId:next.id});
    return{source,next,seed};
  }
  async createTontineCycle(input:{rubricId:string;name:string;rounds:number;potsPerRound:number;nominalPotAmount?:number}):Promise<CompletionRecord>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!input.rubricId||!input.name.trim())throw Error('TONTINE_CYCLE_REQUIRED');if(!Number.isSafeInteger(input.rounds)||input.rounds<1||!Number.isSafeInteger(input.potsPerRound)||input.potsPerRound<1)throw Error('INVALID_TONTINE_CYCLE');
    return this.createCompletion('TONTINE_CYCLE',{title:input.name,data:{rubricId:input.rubricId,rounds:input.rounds,potsPerRound:input.potsPerRound,currency:'XAF',nominalPotAmount:input.nominalPotAmount??null}});
  }
  async addTontineShare(input:{cycleId:string;membershipId:string;label:string}):Promise<CompletionRecord>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const cycle=(await this.listCompletion('TONTINE_CYCLE')).find(x=>x.id===input.cycleId);if(!cycle)throw Error('TONTINE_CYCLE_NOT_FOUND');
    const member=(await this.listMembers()).find(x=>x.id===input.membershipId&&x.status==='active');if(!member)throw Error('MEMBERSHIP_NOT_FOUND');
    return this.createCompletion('TONTINE_SHARE',{title:input.label,data:{cycleId:input.cycleId,membershipId:input.membershipId,scheduledRound:null,scheduledSlot:null,benefitLedgerEntryId:null}});
  }
  async suggestTontineSchedule(input:{shareIds:string[];rounds:number;potsPerRound:number;constraints?:TontineScheduleConstraint[]}):Promise<TontineScheduleResult>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return suggestTontineScheduleLocal(input.shareIds,input.rounds,input.potsPerRound,input.constraints??[]);
  }
  async scheduleTontineShare(shareId:string,round:number,expectedVersion:number):Promise<CompletionRecord>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const share=(await this.listCompletion('TONTINE_SHARE')).find(x=>x.id===shareId);if(!share)throw Error('TONTINE_SHARE_NOT_FOUND');
    const cycleId=String(share.data.cycleId??''),cycle=(await this.listCompletion('TONTINE_CYCLE')).find(x=>x.id===cycleId);if(!cycle)throw Error('TONTINE_CYCLE_NOT_FOUND');
    const maxRound=Number(cycle.data.rounds),pots=Number(cycle.data.potsPerRound);if(!Number.isSafeInteger(round)||round<1||round>maxRound)throw Error('TONTINE_ROUND_OUT_OF_RANGE');
    const siblings=(await this.listCompletion('TONTINE_SHARE')).filter(x=>x.id!==shareId&&String(x.data.cycleId??'')===cycleId&&Number(x.data.scheduledRound)===round&&String(x.data.completionState)!=='CANCELLED');if(siblings.length>=pots)throw Error('TONTINE_ROUND_CAPACITY_EXCEEDED');
    return this.transitionCompletion(shareId,'SCHEDULED',expectedVersion,{scheduledRound:round,scheduledSlot:siblings.length+1});
  }
  async serveTontineShare(shareId:string,input:{amount:number;expectedVersion:number;meetingId?:string}):Promise<{entry:LedgerEntry;share:CompletionRecord}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_AMOUNT');const key=makeId('benefit');
    if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/tontine/shares/'+encodeURIComponent(shareId)+'/serve',{method:'POST',body:JSON.stringify({...input,currency:'XAF',idempotencyKey:key})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const share=(await this.listCompletion('TONTINE_SHARE')).find(x=>x.id===shareId);if(!share)throw Error('TONTINE_SHARE_NOT_FOUND');if(String(share.data.completionState)!=='SCHEDULED')throw Error('TONTINE_SHARE_NOT_SCHEDULED');if(Number(share.data.completionVersion??0)!==input.expectedVersion)throw Error('COMPLETION_VERSION_CONFLICT');
    const entry:any=await this.patchLocalCashMovement({amount:input.amount,direction:'out',kind:'tontine_benefit',sourceType:'tontine_share',sourceId:shareId,meetingId:input.meetingId,idempotencyKey:key,descriptionCode:'LEDGER_TONTINE_BENEFIT'});
    const data={...share.data,completionState:'SERVED',completionVersion:input.expectedVersion+1,benefitLedgerEntryId:entry.id,servedAt:new Date().toISOString()},next:CompletionRecord={...share,status:'DONE',tags:[...share.tags.filter(x=>!x.startsWith('state:')),'state:SERVED'],data,updatedAt:new Date().toISOString()};
    await this.saveLocalCompletion(next);await this.queueLocal('TONTINE_SERVE_V1',{groupId:this.activeGroupId,shareId,amount:input.amount,expectedVersion:input.expectedVersion,meetingId:input.meetingId??null,currency:'XAF',idempotencyKey:key},key);return{entry,share:next};
  }
  async createObligation(input:{membershipId:string;type:string;title:string;dueAt?:string;amount?:number;sourceId?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/obligations',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async quoteLoan(input:{principal:number;installments:number;annualRateBasisPoints:number;installmentsPerYear?:number;method?:'FLAT'|'DECLINING';feesTotal?:number}):Promise<{schedule:LoanScheduleRow[]}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return{schedule:buildLoanSchedule(input)};
  }
  async simulateLoan(input:{principal:number;periods:number;ratePercentPerPeriod:number;priority:'CAPITAL_FIRST'|'INTEREST_FIRST'|'EXPLICIT_ALLOCATION';interestBasis?:'OUTSTANDING'|'INITIAL';payments?:number[];principalPayments?:number[];interestPayments?:number[];openingInterestDue?:number}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const rows=simulatePeriodicLoan(input);
    return{rows,summary:summarizePeriodicLoan(input,rows)};
  }
  async loanHistory(loanId:string):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(loanId)+'/history');}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const loan=(await this.listCompletion('LOAN')).find(x=>x.id===loanId);if(!loan)throw Error('LOAN_NOT_FOUND');const journal=await this.sovereign.list(this.tenantId,this.activeGroupId);
    return{loan,events:journal.filter(x=>String(x.payload.loanId??x.payload.sourceId??'')===loanId||String(x.payload.id??'')===loanId),offline:true};
  }
  async disburseLoan(id:string,input:{amount?:number;expectedVersion:number;meetingId?:string;rubricId?:string}):Promise<{entry:LedgerEntry;loan:CompletionRecord}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const key=makeId('loan_disbursement');
    if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(id)+'/disburse',{method:'POST',body:JSON.stringify({...input,idempotencyKey:key})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const loan=(await this.listCompletion('LOAN')).find(x=>x.id===id);if(!loan)throw Error('LOAN_NOT_FOUND');if(String(loan.data.completionState)!=='APPROVED')throw Error('LOAN_NOT_APPROVED');if(Number(loan.data.completionVersion??0)!==input.expectedVersion)throw Error('COMPLETION_VERSION_CONFLICT');
    const principal=Number(input.amount??loan.data.principal);if(!Number.isSafeInteger(principal)||principal<=0)throw Error('INVALID_LOAN_PRINCIPAL');
    const entry:any=await this.patchLocalCashMovement({amount:principal,direction:'out',kind:'loan_disbursement',sourceType:'loan',sourceId:id,meetingId:input.meetingId,idempotencyKey:key,descriptionCode:'LEDGER_LOAN_DISBURSEMENT'});
    const interestTiming=String(loan.data.interestTiming??'NEXT_SESSION_DUE'),rateBasisPointsPerPeriod=Number(loan.data.rateBasisPointsPerPeriod??0),upfrontInterestExpected=interestTiming==='NEXT_SESSION_DUE'?0:Math.round(principal*rateBasisPointsPerPeriod/10000);
    const data={...loan.data,completionState:'DISBURSED',completionVersion:input.expectedVersion+1,ledgerEntryId:entry.id,outstandingPrincipal:principal,unpaidInterest:0,accruedMeetingIdsJson:'[]',interestTiming,upfrontInterestExpected,upfrontInterestPending:upfrontInterestExpected>0,upfrontInterestSourceMeetingId:input.meetingId??'',upfrontInterestSkipNextClose:upfrontInterestExpected>0&&!input.meetingId,disbursedAt:new Date().toISOString()},next:CompletionRecord={...loan,status:'ACTIVE',tags:[...loan.tags.filter(x=>!x.startsWith('state:')),'state:DISBURSED'],data,updatedAt:new Date().toISOString()};
    await this.saveLocalCompletion(next);await this.queueLocal('LOAN_DISBURSE_V1',{groupId:this.activeGroupId,loanId:id,amount:principal,expectedVersion:input.expectedVersion,meetingId:input.meetingId??null,rubricId:input.rubricId??String(loan.data.rubricId??''),interestTiming,rateBasisPointsPerPeriod,idempotencyKey:key},key);return{entry,loan:next};
  }
  async repayLoan(id:string,input:{principalAmount:number;interestAmount?:number;expectedVersion:number;meetingId?:string}):Promise<{entry:LedgerEntry;loan:CompletionRecord}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const key=makeId('loan_repayment');
    if(!this.isOffline())try{return await this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(id)+'/repay',{method:'POST',body:JSON.stringify({...input,idempotencyKey:key})});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const loan=(await this.listCompletion('LOAN')).find(x=>x.id===id);if(!loan)throw Error('LOAN_NOT_FOUND');if(!['DISBURSED','REPAYING'].includes(String(loan.data.completionState)))throw Error('LOAN_NOT_REPAYABLE');if(Number(loan.data.completionVersion??0)!==input.expectedVersion)throw Error('COMPLETION_VERSION_CONFLICT');
    const outstanding=Number(loan.data.outstandingPrincipal??0),unpaid=Number(loan.data.unpaidInterest??0),principalPaid=Number(input.principalAmount??0),rateBp=Number(loan.data.rateBasisPointsPerPeriod??0);
    let accrued:string[]=[];try{accrued=JSON.parse(String(loan.data.accruedMeetingIdsJson??'[]'));if(!Array.isArray(accrued))accrued=[];}catch{accrued=[];}
    let prepared:string[]=[];try{prepared=JSON.parse(String(loan.data.preparedInterestMeetingIdsJson??'[]'));if(!Array.isArray(prepared))prepared=[];}catch{prepared=[];}
    let preparedPending=loan.data.preparedInterestPending===true||String(loan.data.preparedInterestPending)==='true',periodInterest=0,usedPrepared=false;
    if(input.meetingId){if(prepared.includes(input.meetingId)){prepared=prepared.filter(x=>x!==input.meetingId);usedPrepared=true;}else if(preparedPending){preparedPending=false;usedPrepared=true;}else if(!accrued.includes(input.meetingId)){periodInterest=Math.round(outstanding*rateBp/10000);accrued.push(input.meetingId);}}
    const interestDue=unpaid+periodInterest,interestPaid=Number(input.interestAmount??0);if(!Number.isSafeInteger(principalPaid)||principalPaid<0||principalPaid>outstanding||!Number.isSafeInteger(interestPaid)||interestPaid<0||interestPaid>interestDue)throw Error('INVALID_LOAN_REPAYMENT');
    const amount=principalPaid+interestPaid;if(amount<=0)throw Error('INVALID_LOAN_REPAYMENT');const entry:any=await this.patchLocalCashMovement({amount,direction:'in',kind:'loan_repayment',sourceType:'loan',sourceId:id,meetingId:input.meetingId,idempotencyKey:key,descriptionCode:'LEDGER_LOAN_REPAYMENT'});
    const remaining=outstanding-principalPaid,interestAfter=interestDue-interestPaid,target=remaining===0&&interestAfter===0?'CLOSED':'REPAYING',data={...loan.data,completionState:target,completionVersion:input.expectedVersion+1,outstandingPrincipal:remaining,unpaidInterest:interestAfter,lastRepaymentLedgerEntryId:entry.id,accruedMeetingIdsJson:JSON.stringify(accrued),preparedInterestMeetingIdsJson:JSON.stringify(prepared),preparedInterestPending:preparedPending,interestAppliesToMeetingId:usedPrepared&&input.meetingId?input.meetingId:loan.data.interestAppliesToMeetingId},next:CompletionRecord={...loan,status:target==='CLOSED'?'DONE':'ACTIVE',tags:[...loan.tags.filter(x=>!x.startsWith('state:')),'state:'+target],data,updatedAt:new Date().toISOString()};
    await this.saveLocalCompletion(next);await this.queueLocal('LOAN_REPAY_V1',{groupId:this.activeGroupId,loanId:id,principalAmount:principalPaid,interestAmount:interestPaid,periodInterest,rateBasisPointsPerPeriod:rateBp,accruedMeetingIds:accrued,expectedVersion:input.expectedVersion,meetingId:input.meetingId??null,idempotencyKey:key},key);return{entry,loan:next};
  }
  async createGovernanceDecision(input:{title:string;subject:string;threshold:number;expiresAt?:string;operationFingerprint?:string}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/governance/decisions',{method:'POST',body:JSON.stringify(input)});}
  async approveGovernanceDecision(id:string,expectedVersion:number):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/governance/decisions/'+encodeURIComponent(id)+'/approve',{method:'POST',body:JSON.stringify({expectedVersion})});}
  async createReadinessPassport():Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/readiness',{method:'POST',body:'{}'});}
  async compareRules(before:Record<string,unknown>,after:Record<string,unknown>):Promise<{differences:Array<{field:string;before:unknown;after:unknown}>}>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/rules/compare',{method:'POST',body:JSON.stringify({before,after})});}
  async ledgerAnomalies():Promise<Array<{code:string;entryId?:string;details:string}>>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ledger/anomalies');}
  calendarIcsUrl():string{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.baseUrl+'/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/calendar.ics';}

  async listWorkspaceRecords(moduleId?:string,groupId?:string):Promise<WorkspaceRecord[]>{const p=new URLSearchParams();if(moduleId)p.set('moduleId',moduleId);if(groupId)p.set('groupId',groupId);return this.request(`/api/v1/workspaces?${p}`);}
  async groupModels(groupId=this.activeGroupId):Promise<any[]>{if(!groupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/models') as any;return r.items??[];}
  async visibleGroupModels():Promise<any[]>{const r=await this.request('/api/v1/group-models') as any;return r.items??[];}
  async captureGroupModel(groupId:string,input:any):Promise<any>{return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/models',{method:'POST',body:JSON.stringify(input)});}
  async requestGroupModelReview(groupId:string,id:string):Promise<any>{return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/models/'+encodeURIComponent(id)+'/review-request',{method:'POST',body:'{}'});}
  async caseLaw(groupId=this.activeGroupId):Promise<any[]>{if(!groupId)return[];const r=await this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/case-law') as any;return r.items??[];}
  async createCaseLaw(groupId:string,input:any):Promise<any>{return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/case-law',{method:'POST',body:JSON.stringify(input)});}
  async validateCaseLawLocal(groupId:string,id:string):Promise<any>{return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/case-law/'+encodeURIComponent(id)+'/validate-local',{method:'POST',body:'{}'});}
  async requestCaseLawReview(groupId:string,id:string):Promise<any>{return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/case-law/'+encodeURIComponent(id)+'/review-request',{method:'POST',body:'{}'});}
  async founderGroupModelQueue():Promise<any[]>{const r=await this.request('/api/v1/founder/group-models/review-queue') as any;return r.items??[];}
  async founderReviewGroupModel(id:string,state:'STANDARD'|'RECOMMENDED'|'DEPRECATED',note:string):Promise<any>{return this.request('/api/v1/founder/group-models/'+encodeURIComponent(id)+'/review',{method:'POST',body:JSON.stringify({state,note})});}
  async founderCaseLawQueue():Promise<any[]>{const r=await this.request('/api/v1/founder/case-law/review-queue') as any;return r.items??[];}
  async founderReviewCaseLaw(id:string,state:'RECOMMENDED'|'REJECTED'|'ARCHIVED',note:string):Promise<any>{return this.request('/api/v1/founder/case-law/'+encodeURIComponent(id)+'/review',{method:'POST',body:JSON.stringify({state,note})});}
  async starterKit(groupId=this.activeGroupId):Promise<any|undefined>{if(!groupId)return undefined;return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/starter-kit');}
  async saveStarterKit(groupId:string,input:any):Promise<any>{if(!groupId)throw Error('GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(groupId)+'/starter-kit',{method:'PUT',body:JSON.stringify(input)});}
  async createWorkspaceRecord(input:{moduleId:string;title:string;summary?:string;status?:WorkspaceStatus;tags?:string[];data?:Record<string,string|number|boolean|null>;groupId?:string}):Promise<WorkspaceRecord>{return this.request('/api/v1/workspaces',{method:'POST',body:JSON.stringify({...input,groupId:input.groupId??this.activeGroupId})});}
  async updateWorkspaceRecord(id:string,input:Partial<Pick<WorkspaceRecord,'title'|'summary'|'status'|'tags'|'data'>>):Promise<WorkspaceRecord>{return this.request(`/api/v1/workspaces/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(input)});}

  async syncOutbox():Promise<OutboxItem[]>{
    if(this.serverBudgetBlocked()||typeof navigator!=='undefined'&&navigator.onLine===false)return this.outbox.list();
    // syncOutbox is itself an explicit, event-driven retry opportunity.
    // Clear only the short transport breaker; quota/D1 protection stays intact.
    this.transportUnavailableUntil=0;
    const result=await this.outbox.sync(async item=>{try{const groupId=(item.payload as {groupId?:string}).groupId;const r=await this.request<Record<string,unknown>&{accepted:boolean;stored?:boolean}>('/api/v1/outbox/apply',{method:'POST',headers:{'x-active-group-id':groupId??''},body:JSON.stringify(item)});return{ok:r.accepted&&r.stored!==false&&r.status!=='CLOCK_REVIEW',conflict:r.status==='CLOCK_REVIEW',result:r};}catch(e){const message=e instanceof Error?e.message:String(e);return{ok:false,conflict:['IDEMPOTENCY_CONFLICT','FORBIDDEN_SCOPE','CELL_VALUE_CONFLICT','CELL_VERSION_CONFLICT','CELL_CLOCK_REVIEW_REQUIRED'].includes(message),error:message};}});
    // Reconcile policy commands with the server-authored revision immediately.
    // Without this, an offline manager can keep seeing changeControl/localActionPending
    // until a later full GET even though the policy was already accepted.
    for(const item of result){
      if(item.status!=='CONFIRMED'||item.type!=='RUBRIC_POLICIES_V1')continue;
      const last=(item as any).lastResult as any,rubric=last?.rubric as RubricDefinition|undefined;
      const groupId=String((item.payload as any)?.groupId??rubric?.groupId??'');if(!rubric?.id||!groupId)continue;
      const path='/api/v1/groups/'+encodeURIComponent(groupId)+'/rubrics',rows=await this.cached<RubricDefinition[]>(path)??[];
      const canonical={...structuredClone(rubric),localActionPending:false} as RubricDefinition;
      await this.saveCached(path,rows.some(x=>x.id===canonical.id)?rows.map(x=>x.id===canonical.id?canonical:x):[...rows,canonical]);
      if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('eco:rubric-policy-synced',{detail:{groupId,rubricId:canonical.id,revision:last?.loanPolicyRevision??null}}));
    }
    await this.persistOutbox();return result;
  }
  async queueDemoIntent(note='Local note'):Promise<OutboxItem>{const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type:'MEETING_NOTE_UPDATED',payload:{groupId:this.activeGroupId,note},idempotencyKey:`note-${this.activeGroupId??'none'}-${Date.now()}`});await this.persistOutbox();return item;}
  async retryOutboxItem(id:string):Promise<OutboxItem|undefined>{const item=this.outbox.retry(id);await this.persistOutbox();return item;}
  async cancelOutboxItem(id:string):Promise<OutboxItem|undefined>{const item=this.outbox.cancel(id);await this.persistOutbox();return item;}
  private async persistOutbox(){if(!IndexedDbOutboxAdapter.supported())throw Error('DURABLE_STORAGE_REQUIRED');try{await this.outboxStorage.save(this.outbox.list());}catch{throw Error('DURABLE_STORAGE_REQUIRED');}}
  outboxItems():OutboxItem[]{return this.outbox.list();}

  productModules(){return structuredClone(PRODUCT_MODULES);}
  kernelServices():readonly string[]{return KERNEL_SERVICE_IDS;}
  deviceCompatibility(capabilities:DeviceCapabilities){return{level:this.kernel.compatibility.classify(capabilities),capabilities:structuredClone(capabilities)};}
  safetyState(){return{realMoneyEnabled:false,manualCashLedgerEnabled:true,cloudAiBudgetEnabled:false,relayMediaEnabled:false};}
  async founderControl():Promise<any>{return this.request('/api/v1/founder/control');}
  async createFounderContentTask(input:{key:string;title:string;status?:string;priority?:string;kind?:string;url?:string;note?:string}):Promise<any>{return this.request('/api/v1/founder/control/content',{method:'POST',body:JSON.stringify(input)});}
  async createFounderIncident(input:{key:string;title:string;priority?:string;source?:string;note?:string}):Promise<any>{return this.request('/api/v1/founder/control/incidents',{method:'POST',body:JSON.stringify(input)});}
  async transitionFounderControlItem(id:string,status:string,note='',evidenceRef=''):Promise<any>{return this.request('/api/v1/founder/control/items/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({status,note,evidenceRef})});}
  async markFounderCapabilityHealth(id:string,health:'UNKNOWN'|'PASS'|'DEGRADED'|'FAIL',note=''):Promise<any>{return this.request('/api/v1/founder/control/capabilities/'+encodeURIComponent(id)+'/check',{method:'POST',body:JSON.stringify({health,note})});}

  async universe(){const server=await this.request<{groups:number;inbox:number;audit:number}>('/api/v1/universe');return{...server,pendingSync:this.outbox.list().filter(x=>x.status!=='CONFIRMED').length};}
}
