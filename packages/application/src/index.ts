import type {LaunchRubricPlan, GroupProjectLaunchProfile} from '../../contracts/src/index.js';
import { PlatformKernel, type DeviceCapabilities } from '../../platform-kernel/src/index.js';
import { InMemoryPlatformRepository } from '../../repositories/src/index.js';
import { FoundationService, GroupLaunchSimulator, starterGroupOperatingPolicy } from '../../domain/src/index.js';
import { IndexedDbOutboxAdapter, IndexedDbReadSnapshotAdapter, Outbox } from '../../offline/src/index.js';
import { LoopbackRelayTransport, envelopeForOutbox } from '../../relay/src/index.js';
import { PRODUCT_MODULES } from '../../module-registry/src/index.js';
import { makeId, type CashboxReconciliationRecord, type CashboxSnapshot, type CaseRecord, type ContributionReceipt, type EvidenceRecord, type FeasibilityResult, type Group, type LedgerEntry, type LedgerSummary, type MeetingSession, type Membership, type MembershipView, type OutboxItem, type GroupOperatingPolicy, type RubricDefinition, type RubricOperatingModel, type RubricCyclePreview, type GroupDiscoveryMatch, type PublicGroupListing, type MembershipApplication, type WorkspaceRecord, type WorkspaceStatus } from '../../contracts/src/index.js';
import type { CompletionKind, CompletionRecord, TontineScheduleConstraint, TontineScheduleResult, LoanScheduleRow } from '../../completion/src/index.js';

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

export class ConnectedApplication {
  private readonly kernel = new PlatformKernel();
  private readonly outbox = new Outbox();
  private readonly outboxStorage = new IndexedDbOutboxAdapter();
  private readonly readSnapshots = new IndexedDbReadSnapshotAdapter();
  private usingOfflineSnapshot=false;
  private actorId:string; private tenantId:string; private displayName:string; private locale:string; private activeGroupId?:string;
  private readonly baseUrl:string;
  private groupTenants=new Map<string,string>();
  private homeTenantId?:string;

  constructor(options:ConnectedApplicationOptions={}){
    this.baseUrl=options.baseUrl??''; this.actorId=options.actorId??'user_founder'; this.tenantId=options.tenantId??'tenant_local'; this.displayName=options.displayName??'Local Manager';
    let storedLocale:string|undefined;try{storedLocale=localStorage.getItem('tontine.locale')??undefined;this.activeGroupId=localStorage.getItem('tontine.activeGroupId')??undefined;}catch{}
    this.locale=options.locale??storedLocale??'fr';
  }

  private headers(extra:Record<string,string>={}):HeadersInit{return{'content-type':'application/json','accept-language':this.locale,'x-active-group-id':this.activeGroupId??'','x-timezone':'Africa/Douala',...extra};}
  private offlineReadAllowed(path:string):boolean{
    // Actor-scoped IndexedDB snapshots are safe for GET projections. Keeping this
    // generic prevents a newly-added read screen from becoming an accidental
    // offline blocker. Mutations are never synthesized here.
    return path==='/api/v1/auth/session'||path.startsWith('/api/v1/');
  }
  private offlineReadKey(path:string):string{return path==='/api/v1/auth/session'?'session:last':JSON.stringify([this.actorId,this.tenantId,this.activeGroupId??'',path]);}
  private async cacheReadSnapshot<T>(path:string,body:T):Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported()||!this.offlineReadAllowed(path))return;
    const session=path==='/api/v1/auth/session'?(body as any)?.account:undefined;
    try{await this.readSnapshots.save({id:this.offlineReadKey(path),actorId:String(session?.id??this.actorId),tenantId:String(session?.tenantId??this.tenantId),path,body});}catch{}
  }
  private announceOfflineSnapshot(path:string,updatedAt:string):void{
    this.usingOfflineSnapshot=true;
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:offline-snapshot-used',{detail:{path,updatedAt}}));
  }
  private isOffline():boolean{return this.usingOfflineSnapshot||(typeof navigator!=='undefined'&&navigator.onLine===false);}
  private async cached<T>(path:string):Promise<T|undefined>{try{return (await this.readSnapshots.get<T>(this.offlineReadKey(path)))?.body;}catch{return undefined;}}
  private async saveCached<T>(path:string,body:T):Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported())throw Error('DURABLE_STORAGE_REQUIRED');
    await this.readSnapshots.save({id:this.offlineReadKey(path),actorId:this.actorId,tenantId:this.tenantId,path,body});
  }
  private async patchCachedArray<T>(path:string,updater:(items:T[])=>T[]):Promise<T[]>{
    const current=structuredClone(await this.cached<T[]>(path)??[]),next=updater(current);
    await this.saveCached(path,next);return next;
  }
  private async queueLocal(type:string,payload:Record<string,unknown>,idempotencyKey=makeId('op')):Promise<OutboxItem>{
    const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type,payload,idempotencyKey});
    await this.persistOutbox();
    if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('eco:local-mutation',{detail:{type,id:item.id,idempotencyKey}}));
    return item;
  }
  private async sha256Hex(value:string):Promise<string>{
    const bytes=new TextEncoder().encode(value),digest=await crypto.subtle.digest('SHA-256',bytes);
    return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
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
    const method=String(init.method??'GET').toUpperCase(),cacheable=method==='GET'&&this.offlineReadAllowed(path);
    let response:Response;
    try{
      response=await fetch(`${this.baseUrl}${path}`,{...init,headers});
    }catch(error){
      if(cacheable&&IndexedDbReadSnapshotAdapter.supported()){
        try{const snapshot=await this.readSnapshots.get<T>(this.offlineReadKey(path));if(snapshot){this.announceOfflineSnapshot(path,snapshot.updatedAt);return structuredClone(snapshot.body);}}catch{}
      }
      throw new Error('NETWORK_UNAVAILABLE',{cause:error});
    }
    const body=await response.json().catch(()=>({error:`HTTP_${response.status}`}));
    if(!response.ok)throw new Error(String(body.error??`HTTP_${response.status}`));
    this.usingOfflineSnapshot=false;
    if(cacheable)await this.cacheReadSnapshot(path,body as T);
    return body as T;
  }

  async bootstrap(input:{actorId?:string;tenantId?:string;displayName?:string;locale?:string}={}):Promise<{restoredOutbox:number;groups:Group[]}>{
    const session=await this.authStatus();if(!session.authenticated || !session.account)throw Error('AUTHENTICATION_REQUIRED');
    this.actorId=session.account.id;this.homeTenantId=session.account.tenantId;this.tenantId=session.account.tenantId;this.displayName=session.account.displayName;
    let preferred:string|undefined;try{preferred=localStorage.getItem('tontine.locale')??undefined;}catch{}this.locale=preferred??session.account.locale;
    const groups=await this.listGroups();if(this.activeGroupId&&!groups.some(g=>g.id===this.activeGroupId))this.selectGroup(undefined);if(!this.activeGroupId&&groups[0])this.selectGroup(groups[0].id);else this.selectGroup(this.activeGroupId);
    if(!this.usingOfflineSnapshot)await this.request('/api/v1/bootstrap',{method:'POST',body:JSON.stringify({displayName:this.displayName,locale:this.locale})});
    let restoredOutbox=0;if(IndexedDbOutboxAdapter.supported())try{const persisted=await this.outboxStorage.load();this.outbox.restore(persisted.filter(x=>x.actorId===this.actorId));restoredOutbox=this.outbox.list().length;}catch{}
    return{restoredOutbox,groups};
  }

  authStatus():Promise<{authenticated:boolean;account:SessionAccount|null}>{return this.request('/api/v1/auth/session');}
  currentActor():string{return this.actorId;}
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

  async memberStatement(membershipId:string):Promise<import('../../contracts/src/index.js').MemberStatement>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members/${encodeURIComponent(membershipId)}/statement`);}
  async groupMe():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/me`);}
  async globalRecap():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/recap/global`);}
  async memberOperationalSheet(membershipId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members/${encodeURIComponent(membershipId)}/operational-sheet`);}
  async authenticate(mode:'login'|'register',input:{username:string;password:string;displayName?:string}):Promise<void>{await this.request(`/api/v1/auth/${mode}`,{method:'POST',body:JSON.stringify({...input,locale:this.locale})});}
  async logout():Promise<void>{const actor=this.actorId;await this.request('/api/v1/auth/logout',{method:'POST',body:'{}'});this.outbox.restore([]);this.selectGroup(undefined);try{await this.readSnapshots.clearForActor(actor);await this.readSnapshots.remove('session:last');}catch{}}

  setLocale(locale:string):void{this.locale=locale==='en'?'en':'fr';try{localStorage.setItem('tontine.locale',this.locale);}catch{}}
  setConnectivity(_connectivity:'online'|'offline'|'degraded'):void{}
  selectGroup(groupId?:string):void{this.activeGroupId=groupId;this.tenantId=(groupId?this.groupTenants.get(groupId):undefined)??this.homeTenantId??this.tenantId;try{if(groupId)localStorage.setItem('tontine.activeGroupId',groupId);else localStorage.removeItem('tontine.activeGroupId');}catch{}}
  activeGroup():string|undefined{return this.activeGroupId;}

  async analyzeGroupDocument(text:string):Promise<{fingerprint:string;suggestions:any[];requiresHumanConfirmation:boolean;financialWrites:boolean}>{return this.request('/api/v1/assistant/group-launch/analyze',{method:'POST',body:JSON.stringify({text})});}
  async analyzeGroupDocumentFiles(files:File[]):Promise<{combinedText:string;fingerprints:string[];files:any[];warnings:string[];suggestions:any[];requiresHumanConfirmation:boolean;financialWrites:boolean}>{
    const form=new FormData();for(const file of files)form.append('files',file,file.name);
    return this.request('/api/v1/assistant/group-launch/analyze-files',{method:'POST',body:form});
  }
  async interpretGroupLaunch(text:string):Promise<{draft:any;requiresHumanConfirmation:boolean;financialWrites:boolean}>{return this.request('/api/v1/assistant/group-launch/interpret',{method:'POST',body:JSON.stringify({text})});}

  async listGroups():Promise<Group[]>{const groups=await this.request<Group[]>('/api/v1/groups');this.groupTenants=new Map(groups.map(g=>[g.id,g.tenantId]));return groups;}
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
  async createRubric(input:{name:string;writtenRule?:string;observedPractice?:string;model:RubricOperatingModel}):Promise<RubricDefinition>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');
    const facets={direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'} as const;
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
    if(!this.isOffline())try{return await this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/policies`,{method:'PUT',body:JSON.stringify(policies)});}catch(error){if(!(error instanceof Error)||error.message!=='NETWORK_UNAVAILABLE')throw error;}
    const path=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`,rows=await this.cached<RubricDefinition[]>(path)??[],current=rows.find(x=>x.id===rubricId);if(!current)throw Error('RUBRIC_NOT_FOUND');
    const updated={...current,policies:structuredClone(policies),version:current.version+1,updatedAt:new Date().toISOString()};await this.saveCached(path,rows.map(x=>x.id===rubricId?updated:x));
    await this.queueLocal('RUBRIC_POLICIES_V1',{groupId:this.activeGroupId,rubricId,policies});return updated;
  }
  async previewRubricCycle(rubricId:string,input:{memberCount:number;collectedFromMembers:number;solidarityCoverageAmount?:number;beneficiaryDisbursement?:number}):Promise<RubricCyclePreview>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/preview-cycle`,{method:'POST',body:JSON.stringify(input)});}
  async updateMemberLifecycle(membershipId:string,input:{status?:string;roles?:string[];reason?:string;probationEndsAt?:string;historicalJoinedAt?:string;expectedRevision?:number}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/members/'+encodeURIComponent(membershipId)+'/lifecycle',{method:'PUT',body:JSON.stringify(input)});}
  async listMembers():Promise<MembershipView[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`);}
  async listMeetings():Promise<MeetingSession[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings`);}
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
    const owner:MembershipView={id:`membership_owner_${groupId}`,tenantId:this.tenantId,groupId,userId:this.actorId,roles:['founder','manager'],status:'active',joinedAt:group.createdAt,displayName:this.displayName};
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
    const stamp=new Date().toISOString(),userId=makeId('user'),membershipId=makeId('membership'),membership:MembershipView={id:membershipId,tenantId:this.tenantId,groupId:this.activeGroupId,userId,roles:['member'],status:'active',joinedAt:stamp,displayName:name};
    await this.patchCachedArray<MembershipView>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`,rows=>rows.some(x=>x.id===membershipId)?rows:[...rows,membership]);
    await this.queueLocal('MEMBER_ADD_V1',{groupId:this.activeGroupId,userId,membershipId,displayName:name,locale:this.locale,createdAt:stamp});
    return membership;
  }

  async recordCashContribution(input:{membershipId:string;amount:number;meetingId?:string;rubricId?:string;lateReason?:string;approverIds?:string[]}):Promise<{queued:boolean;receipt?:ContributionReceipt;outbox?:OutboxItem}>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED'); const key=makeId('cash');
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    // Persist the same intent before the first send, including while online.
    // An ambiguous network failure is retried with this key, never a new charge.
    const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type:'CONTRIBUTION_CASH_RECORDED',payload:{groupId:this.activeGroupId,...input,currency:'XAF'},idempotencyKey:key});
    try{await this.persistOutbox();}catch(e){this.outbox.restore(this.outbox.list().filter(x=>x.id!==item.id));throw e;}
    if(this.isOffline()){
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
  async miscRubrics(meetingId?:string):Promise<any[]>{if(!this.activeGroupId)return[];const q=meetingId?'?meetingId='+encodeURIComponent(meetingId):'';return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics${q}`);}
  async ensureMiscRubricStarters():Promise<any[]>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics`,{method:'POST',body:JSON.stringify({action:'ensure_starters'})});}
  async createMiscRubric(input:{name:string;description?:string;lifecycle?:'EPHEMERAL'|'PERSISTENT'|'SESSION_ONLY';amountMode?:'FIXED'|'VARIABLE';defaultAmount?:number;activeFirstSessions?:number}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics`,{method:'POST',body:JSON.stringify({action:'create_custom',...input})});}
  async postMiscRubrics(input:{membershipId:string;meetingId?:string;items:Array<{templateId:string;amount:number;note?:string}>}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics/postings`,{method:'POST',body:JSON.stringify({...input,idempotencyKey:makeId('misc_batch')})});}
  async miscPostings(filters:{meetingId?:string;membershipId?:string}={}):Promise<any[]>{if(!this.activeGroupId)return[];const p=new URLSearchParams();if(filters.meetingId)p.set('meetingId',filters.meetingId);if(filters.membershipId)p.set('membershipId',filters.membershipId);return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/misc-rubrics/postings?${p}`);}
  async ledger():Promise<{summary:LedgerSummary;entries:LedgerEntry[];receipts:ContributionReceipt[]}>{if(!this.activeGroupId)return{summary:{currency:'XAF',cashBalance:0,memberFundsLiability:0,entryCount:0},entries:[],receipts:[]};return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/ledger`);}
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
  async inboxItems():Promise<Array<{id:string;kind:string;title:string;priority:string;status:string;groupId?:string}>>{return this.request('/api/v1/inbox');}

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
  async searchGroups(input:{q?:string;locality?:string;recruitingOnly?:boolean}={}):Promise<GroupDiscoveryMatch[]>{const p=new URLSearchParams();if(input.q)p.set('q',input.q);if(input.locality)p.set('locality',input.locality);if(input.recruitingOnly)p.set('recruitingOnly','true');return this.request(`/api/v1/discovery/groups?${p}`);}
  async publishActiveGroup(input:{visibility:'PUBLIC'|'INVITE_ONLY'|'SECRET'|'MEMBERS_ONLY';discoverable:boolean;joinPolicy:'REQUEST'|'OPEN'|'INVITE_ONLY'|'CLOSED';recruiting:boolean;locality?:string;missionTags?:string[];activityTags?:string[]}):Promise<PublicGroupListing>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/discovery`,{method:'POST',body:JSON.stringify(input)});}
  async createJoinLink(input:{mode?:'AUTO_JOIN'|'HISTORICAL_MATCH';label?:string;expiresHours?:number;maxUses?:number}={}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/join-links`,{method:'POST',body:JSON.stringify(input)});}
  async listJoinLinks():Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/join-links`);}
  async redeemJoinCode(code:string):Promise<any>{return this.request('/api/v1/join/redeem',{method:'POST',body:JSON.stringify({code})});}
  async pairingStatus(requestId:string):Promise<any>{return this.request('/api/v1/join/pairing-requests/'+encodeURIComponent(requestId));}
  async createMemberPairingCode():Promise<any>{return this.request('/api/v1/pairing-code',{method:'POST',body:'{}'});}
  async listPairingRequests():Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/pairing-requests`);}
  async decidePairingRequest(requestId:string,input:{decision:'APPROVE'|'REJECT';membershipId?:string;reason?:string}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/pairing-requests/${encodeURIComponent(requestId)}/decision`,{method:'POST',body:JSON.stringify(input)});}
  async pairMemberCode(membershipId:string,code:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/pair-member-code`,{method:'POST',body:JSON.stringify({membershipId,code})});}
  async requestToJoin(groupId:string,message?:string):Promise<MembershipApplication>{return this.request('/api/v1/membership-applications',{method:'POST',body:JSON.stringify({groupId,message})});}
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
  async setFinancialCellTarget(input:{meetingId:string;membershipId:string;rubricId:string;targetAmount:number;currentAmount?:number;reason?:string}):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(!Number.isSafeInteger(input.targetAmount)||input.targetAmount<0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    const current=Number(input.currentAmount??0);
    if(this.isOffline()){
      if(current===0&&input.targetAmount>0)return this.recordCashContribution({membershipId:input.membershipId,amount:input.targetAmount,meetingId:input.meetingId,rubricId:input.rubricId});
      const item=await this.queueLocal('FINANCIAL_CELL_CORRECTION_PROPOSAL_V1',{groupId:this.activeGroupId,meetingId:input.meetingId,membershipId:input.membershipId,rubricId:input.rubricId,targetAmount:input.targetAmount,baselineValue:current,reason:input.reason??''},'cell-proposal:'+input.meetingId+':'+input.membershipId+':'+input.rubricId+':'+makeId('op'));
      return{status:'QUEUED_CONSENSUS',current,target:input.targetAmount,outbox:item};
    }
    return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(input.meetingId)}/financial-cells`,{method:'POST',body:JSON.stringify({membershipId:input.membershipId,rubricId:input.rubricId,targetAmount:input.targetAmount,reason:input.reason??''})});
  }
  async applyFinancialCellConsensus(meetingId:string,cellKey:string,reason='Valeur retenue après confrontation des gestionnaires'):Promise<any>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    if(this.isOffline())throw Error('CONSENSUS_APPLY_REQUIRES_SYNC');
    return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/financial-cells/${encodeURIComponent(cellKey)}/apply`,{method:'POST',body:JSON.stringify({reason})});
  }
  async groupNotifications():Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/notifications`);}
  async trashItems():Promise<any[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/trash`);}
  async moveToTrash(kind:'MEETING'|'MEMBER'|'RUBRIC',entityId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/trash`,{method:'POST',body:JSON.stringify({kind,entityId})});}
  async restoreTrashItem(trashId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/trash/${encodeURIComponent(trashId)}/restore`,{method:'POST',body:'{}'});}
  async markGroupNotificationRead(id:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/notifications/${encodeURIComponent(id)}/read`,{method:'POST',body:'{}'});}
  async distributeMeetingSummary(meetingId:string):Promise<{queued:boolean;outbox:OutboxItem}>{
    if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const items=await this.liveConsensus(meetingId).catch(error=>{if(this.isOffline()&&error instanceof Error&&error.message==='NETWORK_UNAVAILABLE')return[];throw error;});
    if(items.some((x:any)=>['COLLECTING','DIVERGENT'].includes(String(x.state))))throw Error('CONSENSUS_UNRESOLVED');
    const item=await this.queueLocal('MEETING_DISTRIBUTION_V1',{groupId:this.activeGroupId,meetingId,kind:'MEMBER_DISTRIBUTION_READY',confirmedAt:new Date().toISOString()},'meeting-distribution:'+meetingId);
    if(this.isOffline())return{queued:true,outbox:item};
    const synced=await this.syncOutbox(),updated=synced.find(x=>x.id===item.id)??item;return{queued:updated.status!=='CONFIRMED',outbox:updated};
  }
  async liveHealth():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/health`);}
  async liveEvents(after=0):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/events?after=${encodeURIComponent(String(after))}`);}
  async publishLive(type:'PRESENCE'|'SYNC_HINT'|'MEETING_UPDATE',payload:Record<string,string|number|boolean|null>={}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/publish`,{method:'POST',body:JSON.stringify({type,payload,idempotencyKey:makeId('live')})});}
  liveWebSocketUrl():string{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const base=new URL(this.baseUrl||location.origin,location.origin);base.protocol=base.protocol==='https:'?'wss:':'ws:';base.pathname=`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/live/connect`;base.search='';return base.toString();}

  async amountExplanation(membershipId:string,rubricId?:string):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const q=rubricId?'?rubricId='+encodeURIComponent(rubricId):'';return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/members/'+encodeURIComponent(membershipId)+'/amount-explanation'+q);}
  async searchDocuments(query:string,limit=20):Promise<Array<{recordId:string;title:string;score:number;snippet:string;source?:string;page?:string;version?:number}>>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/documents/search?q='+encodeURIComponent(query)+'&limit='+String(limit));}
  async previewHistoricalCsv(input:{title:string;kind?:'CONTRIBUTIONS'|'OPENING_BALANCE'|'IDENTITY_CLAIMS'|'OBLIGATIONS';text:string;delimiter?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');const path='/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/imports/csv/preview';return this.request(path,{method:'POST',body:JSON.stringify(input)});}
  async groupHealthSnapshot():Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/health-snapshot');}
  async notificationDigest(hours=24):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/notification-digest?hours='+String(hours));}
  async createExpectedContribution(input:{membershipId:string;title:string;dueAt:string;amount:number;rubricId?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/receivables/expected',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async allocateReceipt(input:{obligationId:string;receiptId:string;amount:number}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/receivables/allocations',{method:'POST',body:JSON.stringify(input)});}
  async arrears(asOf?:string):Promise<unknown[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/receivables/arrears'+(asOf?'?asOf='+encodeURIComponent(asOf):''));}
  async createSavingsPlan(input:{membershipId:string;name:string;targetAmount?:number}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async savingsPosition(id:string):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings/'+encodeURIComponent(id)+'/position');}
  async depositSavings(id:string,amount:number):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings/'+encodeURIComponent(id)+'/deposit',{method:'POST',body:JSON.stringify({amount,idempotencyKey:makeId('savings')})});}
  async withdrawSavings(id:string,amount:number):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings/'+encodeURIComponent(id)+'/withdraw',{method:'POST',body:JSON.stringify({amount,idempotencyKey:makeId('savings_withdraw')})});}
  async recordOpeningBalance(amount:number,note:string):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ledger/opening-balance',{method:'POST',body:JSON.stringify({amount,note,currency:'XAF',idempotencyKey:makeId('opening')})});}
  async createCustody(input:{name:string;holder:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/custody',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async sendToCustody(id:string,amount:number):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/custody/'+encodeURIComponent(id)+'/send',{method:'POST',body:JSON.stringify({amount,idempotencyKey:makeId('custody_out')})});}
  async returnFromCustody(id:string,amount:number):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/custody/'+encodeURIComponent(id)+'/return',{method:'POST',body:JSON.stringify({amount,idempotencyKey:makeId('custody_in')})});}
  async registerGuarantor(loanId:string,input:{membershipId:string;guaranteedAmount:number}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(loanId)+'/guarantors',{method:'POST',body:JSON.stringify(input)});}
  async createSolidarityCase(input:{beneficiaryMembershipId:string;title:string;approvedAmount:number}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/solidarity/cases',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async fundSolidarity(id:string,amount:number):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/solidarity/cases/'+encodeURIComponent(id)+'/fund',{method:'POST',body:JSON.stringify({amount,idempotencyKey:makeId('solidarity_fund')})});}
  async disburseSolidarity(id:string,amount:number):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/solidarity/cases/'+encodeURIComponent(id)+'/disburse',{method:'POST',body:JSON.stringify({amount,idempotencyKey:makeId('solidarity_pay')})});}
  async saveGroupShop(input:{name:string;tagline?:string;visibility?:'GROUP_ONLY'|'PUBLIC';locality?:string;categories?:string[]}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/shop',{method:'POST',body:JSON.stringify(input)});}
  async groupStorefront():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/storefront');}
  async adCampaigns():Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ads/campaigns');}
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
  async savingsYieldSourceData():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/source-data');}
  async previewSavingsYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/preview',{method:'POST',body:JSON.stringify(input)});}
  async previewWorkbookSavingsYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/workbook-preview',{method:'POST',body:JSON.stringify(input)});}
  async previewCapitalAtWorkYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/capital-at-work-preview',{method:'POST',body:JSON.stringify(input)});}
  async previewCapitalTimeYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/capital-time-preview',{method:'POST',body:JSON.stringify(input)});}
  async previewAttributedProductiveYield(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/attributed-productive-preview',{method:'POST',body:JSON.stringify(input)});}
  async savingsYieldPolicies():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/policies');}
  async savingsYieldDoctor(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/doctor',{method:'POST',body:JSON.stringify(input)});}
  async meetingAutopilot(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/meetings/autopilot-preview',{method:'POST',body:JSON.stringify(input)});}

  async previewInterestSplit(total:number,shares:Array<{key:string;basisPoints:number}>):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/savings-yield/split-preview',{method:'POST',body:JSON.stringify({total,shares})});}
  async previewFinancialRecap(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/recap/financial-preview',{method:'POST',body:JSON.stringify(input)});}
  async previewSessionRecap(meetingId:string,input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/meetings/'+encodeURIComponent(meetingId)+'/recap-preview',{method:'POST',body:JSON.stringify(input)});}
  async previewClosingCarryover(input:any):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/closing/carryover-preview',{method:'POST',body:JSON.stringify(input)});}

  async externalPrograms(kind?:'PARTNER'|'NGO'):Promise<any[]>{if(!this.activeGroupId)return[];const q=kind?'?kind='+encodeURIComponent(kind):'';return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs'+q);}
  async createExternalProgram(input:{kind:'PARTNER'|'NGO';partyName:string;programName:string;purpose:string;localities?:string[];tags?:string[];dataAccess?:'NONE'|'GROUP_AGGREGATE_ECONOMIC'}):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs',{method:'POST',body:JSON.stringify(input)});}
  async transitionExternalProgram(id:string,state:'ACTIVE'|'PAUSED'|'COMPLETED'):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({state})});}
  async externalSharePacks(programId:string):Promise<any[]>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs/'+encodeURIComponent(programId)+'/share-packs');}
  async issueExternalSharePack(programId:string,purpose:string,ttlDays=30):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-programs/'+encodeURIComponent(programId)+'/share-packs',{method:'POST',body:JSON.stringify({purpose,ttlDays})});}
  async revokeExternalSharePack(shareId:string):Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/external-share-packs/'+encodeURIComponent(shareId)+'/revoke',{method:'POST',body:'{}'});}
  async economicProfile():Promise<any>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/economic-profile');}

  async createStockItem(input:{sku:string;name:string;quantity:number;unit?:string;unitPrice?:number;description?:string;published?:boolean}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/stock',{method:'POST',body:JSON.stringify(input)});}
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
  async approveHistoricalImport(id:string,mapping:Record<string,string>={}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/imports/'+encodeURIComponent(id)+'/approve',{method:'POST',body:JSON.stringify({mapping})});}
  async applyHistoricalImport(id:string):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/imports/'+encodeURIComponent(id)+'/apply',{method:'POST',body:'{}'});}
  async listCompletion(kind?:CompletionKind):Promise<CompletionRecord[]>{if(!this.activeGroupId)return[];const p=new URLSearchParams();if(kind)p.set('kind',kind);return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/completion?'+p);}
  async createCompletion(kind:CompletionKind,input:{title:string;summary?:string;data?:Record<string,unknown>;tags?:string[]}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/completion',{method:'POST',body:JSON.stringify({kind,...input})});}
  async transitionCompletion(id:string,to:string,expectedVersion:number,patch:Record<string,unknown>={},reason?:string):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/completion/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({to,expectedVersion,patch,reason})});}
  async createHistoricalIdentityClaim(input:{historicalReference:string;evidenceReference:string;claimedMembershipId?:string;note?:string}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/identity-claims',{method:'POST',body:JSON.stringify(input)});}
  async createTontineCycle(input:{rubricId:string;name:string;rounds:number;potsPerRound:number;nominalPotAmount?:number}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/tontine/cycles',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async addTontineShare(input:{cycleId:string;membershipId:string;label:string}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/tontine/shares',{method:'POST',body:JSON.stringify(input)});}
  async suggestTontineSchedule(input:{shareIds:string[];rounds:number;potsPerRound:number;constraints?:TontineScheduleConstraint[]}):Promise<TontineScheduleResult>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/tontine/schedule/suggest',{method:'POST',body:JSON.stringify(input)});}
  async scheduleTontineShare(shareId:string,round:number,expectedVersion:number):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/tontine/shares/'+encodeURIComponent(shareId)+'/schedule',{method:'POST',body:JSON.stringify({round,expectedVersion})});}
  async serveTontineShare(shareId:string,input:{amount:number;expectedVersion:number;meetingId?:string}):Promise<{entry:LedgerEntry;share:CompletionRecord}>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/tontine/shares/'+encodeURIComponent(shareId)+'/serve',{method:'POST',body:JSON.stringify({...input,currency:'XAF',idempotencyKey:makeId('benefit')})});}
  async createObligation(input:{membershipId:string;type:string;title:string;dueAt?:string;amount?:number;sourceId?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/obligations',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async quoteLoan(input:{principal:number;installments:number;annualRateBasisPoints:number;installmentsPerYear?:number;method?:'FLAT'|'DECLINING';feesTotal?:number}):Promise<{schedule:LoanScheduleRow[]}>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/quote',{method:'POST',body:JSON.stringify(input)});}
  async disburseLoan(id:string,input:{amount?:number;expectedVersion:number;meetingId?:string}):Promise<{entry:LedgerEntry;loan:CompletionRecord}>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(id)+'/disburse',{method:'POST',body:JSON.stringify({...input,idempotencyKey:makeId('loan_disbursement')})});}
  async repayLoan(id:string,input:{principalAmount:number;expectedVersion:number;meetingId?:string}):Promise<{entry:LedgerEntry;loan:CompletionRecord}>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/loans/'+encodeURIComponent(id)+'/repay',{method:'POST',body:JSON.stringify({...input,idempotencyKey:makeId('loan_repayment')})});}
  async createGovernanceDecision(input:{title:string;subject:string;threshold:number;expiresAt?:string;operationFingerprint?:string}):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/governance/decisions',{method:'POST',body:JSON.stringify(input)});}
  async approveGovernanceDecision(id:string,expectedVersion:number):Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/governance/decisions/'+encodeURIComponent(id)+'/approve',{method:'POST',body:JSON.stringify({expectedVersion})});}
  async createReadinessPassport():Promise<CompletionRecord>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/readiness',{method:'POST',body:'{}'});}
  async compareRules(before:Record<string,unknown>,after:Record<string,unknown>):Promise<{differences:Array<{field:string;before:unknown;after:unknown}>}>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/rules/compare',{method:'POST',body:JSON.stringify({before,after})});}
  async ledgerAnomalies():Promise<Array<{code:string;entryId?:string;details:string}>>{if(!this.activeGroupId)return[];return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/ledger/anomalies');}
  calendarIcsUrl():string{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.baseUrl+'/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/calendar.ics';}

  async listWorkspaceRecords(moduleId?:string,groupId?:string):Promise<WorkspaceRecord[]>{const p=new URLSearchParams();if(moduleId)p.set('moduleId',moduleId);if(groupId)p.set('groupId',groupId);return this.request(`/api/v1/workspaces?${p}`);}
  async createWorkspaceRecord(input:{moduleId:string;title:string;summary?:string;status?:WorkspaceStatus;tags?:string[];data?:Record<string,string|number|boolean|null>;groupId?:string}):Promise<WorkspaceRecord>{return this.request('/api/v1/workspaces',{method:'POST',body:JSON.stringify({...input,groupId:input.groupId??this.activeGroupId})});}
  async updateWorkspaceRecord(id:string,input:Partial<Pick<WorkspaceRecord,'title'|'summary'|'status'|'tags'|'data'>>):Promise<WorkspaceRecord>{return this.request(`/api/v1/workspaces/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(input)});}

  async syncOutbox():Promise<OutboxItem[]>{
    const result=await this.outbox.sync(async item=>{try{const groupId=(item.payload as {groupId?:string}).groupId;const r=await this.request<{accepted:boolean;stored?:boolean}>('/api/v1/outbox/apply',{method:'POST',headers:{'x-active-group-id':groupId??''},body:JSON.stringify(item)});return{ok:r.accepted&&r.stored!==false};}catch(e){return{ok:false,conflict:e instanceof Error&&['IDEMPOTENCY_CONFLICT','FORBIDDEN_SCOPE'].includes(e.message)};}});await this.persistOutbox();return result;
  }
  async queueDemoIntent(note='Local note'):Promise<OutboxItem>{const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type:'MEETING_NOTE_UPDATED',payload:{groupId:this.activeGroupId,note},idempotencyKey:`note-${this.activeGroupId??'none'}-${Date.now()}`});await this.persistOutbox();return item;}
  async retryOutboxItem(id:string):Promise<OutboxItem|undefined>{const item=this.outbox.retry(id);await this.persistOutbox();return item;}
  private async persistOutbox(){if(!IndexedDbOutboxAdapter.supported())throw Error('DURABLE_STORAGE_REQUIRED');try{await this.outboxStorage.save(this.outbox.list());}catch{throw Error('DURABLE_STORAGE_REQUIRED');}}
  outboxItems():OutboxItem[]{return this.outbox.list();}

  productModules(){return structuredClone(PRODUCT_MODULES);}
  kernelServices():readonly string[]{return KERNEL_SERVICE_IDS;}
  deviceCompatibility(capabilities:DeviceCapabilities){return{level:this.kernel.compatibility.classify(capabilities),capabilities:structuredClone(capabilities)};}
  safetyState(){return{realMoneyEnabled:false,manualCashLedgerEnabled:true,cloudAiBudgetEnabled:false,relayMediaEnabled:false};}
  async founderControl():Promise<any>{return this.request('/api/v1/founder/control');}
  async createFounderContentTask(input:{key:string;title:string;status?:string;priority?:string;kind?:string;url?:string;note?:string}):Promise<any>{return this.request('/api/v1/founder/control/content',{method:'POST',body:JSON.stringify(input)});}
  async createFounderIncident(input:{key:string;title:string;priority?:string;source?:string;note?:string}):Promise<any>{return this.request('/api/v1/founder/control/incidents',{method:'POST',body:JSON.stringify(input)});}
  async transitionFounderControlItem(id:string,status:string,note=''):Promise<any>{return this.request('/api/v1/founder/control/items/'+encodeURIComponent(id)+'/transition',{method:'POST',body:JSON.stringify({status,note})});}
  async markFounderCapabilityHealth(id:string,health:'UNKNOWN'|'PASS'|'DEGRADED'|'FAIL',note=''):Promise<any>{return this.request('/api/v1/founder/control/capabilities/'+encodeURIComponent(id)+'/check',{method:'POST',body:JSON.stringify({health,note})});}

  async universe(){const server=await this.request<{groups:number;inbox:number;audit:number}>('/api/v1/universe');return{...server,pendingSync:this.outbox.list().filter(x=>x.status!=='CONFIRMED').length};}
}
