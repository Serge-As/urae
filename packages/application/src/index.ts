import type {LaunchRubricPlan} from '../../contracts/src/index.js';
import { PlatformKernel, type DeviceCapabilities } from '../../platform-kernel/src/index.js';
import { InMemoryPlatformRepository } from '../../repositories/src/index.js';
import { FoundationService } from '../../domain/src/index.js';
import { IndexedDbOutboxAdapter, Outbox } from '../../offline/src/index.js';
import { LoopbackRelayTransport, envelopeForOutbox } from '../../relay/src/index.js';
import { PRODUCT_MODULES } from '../../module-registry/src/index.js';
import { makeId, type CashboxReconciliationRecord, type CashboxSnapshot, type CaseRecord, type ContributionReceipt, type FeasibilityResult, type Group, type LedgerEntry, type LedgerSummary, type MeetingSession, type Membership, type MembershipView, type OutboxItem, type GroupOperatingPolicy, type RubricDefinition, type RubricOperatingModel, type RubricCyclePreview, type GroupDiscoveryMatch, type PublicGroupListing, type MembershipApplication, type WorkspaceRecord, type WorkspaceStatus } from '../../contracts/src/index.js';
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
  private async request<T>(path:string,init:RequestInit={}):Promise<T>{
    const response=await fetch(`${this.baseUrl}${path}`,{...init,headers:{...this.headers(),...(init.headers??{})}});
    const body=await response.json().catch(()=>({error:`HTTP_${response.status}`}));
    if(!response.ok) throw new Error(String(body.error??`HTTP_${response.status}`)); return body as T;
  }

  async bootstrap(input:{actorId?:string;tenantId?:string;displayName?:string;locale?:string}={}):Promise<{restoredOutbox:number;groups:Group[]}>{
    const session=await this.authStatus();if(!session.authenticated || !session.account)throw Error('AUTHENTICATION_REQUIRED');
    this.actorId=session.account.id;this.homeTenantId=session.account.tenantId;this.tenantId=session.account.tenantId;this.displayName=session.account.displayName;
    let preferred:string|undefined;try{preferred=localStorage.getItem('tontine.locale')??undefined;}catch{}this.locale=preferred??session.account.locale;
    const groups=await this.listGroups();if(this.activeGroupId&&!groups.some(g=>g.id===this.activeGroupId))this.selectGroup(undefined);if(!this.activeGroupId&&groups[0])this.selectGroup(groups[0].id);else this.selectGroup(this.activeGroupId);
    await this.request('/api/v1/bootstrap',{method:'POST',body:JSON.stringify({displayName:this.displayName,locale:this.locale})});
    let restoredOutbox=0;if(IndexedDbOutboxAdapter.supported())try{const persisted=await this.outboxStorage.load();this.outbox.restore(persisted.filter(x=>x.actorId===this.actorId));restoredOutbox=this.outbox.list().length;}catch{}
    return{restoredOutbox,groups};
  }

  authStatus():Promise<{authenticated:boolean;account:SessionAccount|null}>{return this.request('/api/v1/auth/session');}
  currentActor():string{return this.actorId;}
  async memberStatement(membershipId:string):Promise<import('../../contracts/src/index.js').MemberStatement>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members/${encodeURIComponent(membershipId)}/statement`);}
  async authenticate(mode:'login'|'register',input:{username:string;password:string;displayName?:string}):Promise<void>{await this.request(`/api/v1/auth/${mode}`,{method:'POST',body:JSON.stringify({...input,locale:this.locale})});}
  async logout():Promise<void>{await this.request('/api/v1/auth/logout',{method:'POST',body:'{}'});this.outbox.restore([]);this.selectGroup(undefined);}

  setLocale(locale:string):void{this.locale=locale==='en'?'en':'fr';try{localStorage.setItem('tontine.locale',this.locale);}catch{}}
  setConnectivity(_connectivity:'online'|'offline'|'degraded'):void{}
  selectGroup(groupId?:string):void{this.activeGroupId=groupId;this.tenantId=(groupId?this.groupTenants.get(groupId):undefined)??this.homeTenantId??this.tenantId;try{if(groupId)localStorage.setItem('tontine.activeGroupId',groupId);else localStorage.removeItem('tontine.activeGroupId');}catch{}}
  activeGroup():string|undefined{return this.activeGroupId;}

  async listGroups():Promise<Group[]>{const groups=await this.request<Group[]>('/api/v1/groups');this.groupTenants=new Map(groups.map(g=>[g.id,g.tenantId]));return groups;}
  async groupOperatingPolicy():Promise<GroupOperatingPolicy>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/operating-policy`);}
  async updateGroupOperatingPolicy(policy:GroupOperatingPolicy):Promise<Group>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/operating-policy`,{method:'PUT',body:JSON.stringify(policy)});}
  async listRubrics():Promise<RubricDefinition[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`);}
  async createRubric(input:{name:string;writtenRule?:string;observedPractice?:string;model:RubricOperatingModel}):Promise<RubricDefinition>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');const facets={direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'};return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics`,{method:'POST',body:JSON.stringify({name:input.name,facets,source:'GROUP_CUSTOM',operatingModel:{...input.model,writtenRule:input.writtenRule,observedPractice:input.observedPractice}})});}
  async updateRubricOperatingModel(rubricId:string,model:RubricOperatingModel):Promise<RubricDefinition>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/operating-model`,{method:'PUT',body:JSON.stringify(model)});}
  async previewRubricCycle(rubricId:string,input:{memberCount:number;collectedFromMembers:number;solidarityCoverageAmount?:number;beneficiaryDisbursement?:number}):Promise<RubricCyclePreview>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/preview-cycle`,{method:'POST',body:JSON.stringify(input)});}
  async listMembers():Promise<MembershipView[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`);}
  async listMeetings():Promise<MeetingSession[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings`);}
  async openMeeting(title:string):Promise<MeetingSession>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings`,{method:'POST',body:JSON.stringify({title})});}
  async closeMeeting(meetingId:string):Promise<MeetingSession>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/meetings/${encodeURIComponent(meetingId)}/close`,{method:'POST',body:'{}'});}

  async simulateAndStoreProject(input:{name:string;kind:Group['kind'];governanceModel:Group['governanceModel'];rubrics?:LaunchRubricPlan[];memberCount?:number;sessions?:number;nominalContribution?:number;managementFeePerContribution?:number;estimatedExternalCostRate?:number;fixedOperatingCostPerSession?:number}):Promise<{projectId:string;result:FeasibilityResult}>{
    const headers={'x-active-group-id':''};
    const project=await this.request<{id:string}>('/api/v1/group-projects',{method:'POST',headers,body:JSON.stringify({...input,currency:'XAF'})});
    const result=await this.request<FeasibilityResult>(`/api/v1/group-projects/${encodeURIComponent(project.id)}/simulate`,{method:'POST',headers,body:'{}'});return{projectId:project.id,result};
  }
  async createGroupFromProject(projectId:string):Promise<Group>{const group=await this.request<Group>(`/api/v1/group-projects/${encodeURIComponent(projectId)}/convert`,{method:'POST',headers:{'x-active-group-id':''},body:'{}'});this.selectGroup(group.id);return group;}
  async updateRubricActivityPlan(rubricId:string,plan:LaunchRubricPlan):Promise<RubricDefinition>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/rubrics/${encodeURIComponent(rubricId)}/activity-plan`,{method:'PUT',body:JSON.stringify(plan)});}

  async addMember(displayName:string):Promise<Membership>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`,{method:'POST',body:JSON.stringify({displayName,locale:this.locale})});}

  async recordCashContribution(input:{membershipId:string;amount:number;meetingId?:string;rubricId?:string;lateReason?:string;approverIds?:string[]}):Promise<{queued:boolean;receipt?:ContributionReceipt;outbox?:OutboxItem}>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED'); const key=makeId('cash');
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_CONTRIBUTION_AMOUNT');
    // Persist the same intent before the first send, including while online.
    // An ambiguous network failure is retried with this key, never a new charge.
    const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type:'CONTRIBUTION_CASH_RECORDED',payload:{groupId:this.activeGroupId,...input,currency:'XAF'},idempotencyKey:key});
    try{await this.persistOutbox();}catch(e){this.outbox.restore(this.outbox.list().filter(x=>x.id!==item.id));throw e;}
    if(!navigator.onLine)return{queued:true,outbox:item};
    const result=await this.syncOutbox();const updated=result.find(x=>x.id===item.id)!;
    if(updated.status!=='CONFIRMED')return{queued:true,outbox:updated};
    return{queued:false,outbox:updated};
  }
  async ledger():Promise<{summary:LedgerSummary;entries:LedgerEntry[];receipts:ContributionReceipt[]}>{if(!this.activeGroupId)return{summary:{currency:'XAF',cashBalance:0,memberFundsLiability:0,entryCount:0},entries:[],receipts:[]};return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/ledger`);}
  async reverseLedgerEntry(entryId:string,reason:string):Promise<LedgerEntry>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/ledger/${encodeURIComponent(entryId)}/reverse`,{method:'POST',body:JSON.stringify({reason})});}

  async reconcileCashbox(input:{openingCash:number;cashIn:number;cashOut:number;countedClosing:number;meetingId?:string}):Promise<CashboxReconciliationRecord>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request<CashboxReconciliationRecord>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/cashbox/reconciliations`,{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async openSupportCase(summary:string):Promise<CaseRecord>{return this.request('/api/v1/cases',{method:'POST',body:JSON.stringify({summary,groupId:this.activeGroupId})});}
  async inboxItems():Promise<Array<{id:string;kind:string;title:string;priority:string;status:string;groupId?:string}>>{return this.request('/api/v1/inbox');}

  async productCatalog():Promise<{version:string;count:number;capabilities:ReturnType<ConnectedApplication['productModules']>}>{return this.request('/api/v1/product/capabilities');}
  async searchGroups(input:{q?:string;locality?:string;recruitingOnly?:boolean}={}):Promise<GroupDiscoveryMatch[]>{const p=new URLSearchParams();if(input.q)p.set('q',input.q);if(input.locality)p.set('locality',input.locality);if(input.recruitingOnly)p.set('recruitingOnly','true');return this.request(`/api/v1/discovery/groups?${p}`);}
  async publishActiveGroup(input:{visibility:'PUBLIC'|'INVITE_ONLY'|'SECRET'|'MEMBERS_ONLY';discoverable:boolean;joinPolicy:'REQUEST'|'OPEN'|'INVITE_ONLY'|'CLOSED';recruiting:boolean;locality?:string;missionTags?:string[];activityTags?:string[]}):Promise<PublicGroupListing>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/discovery`,{method:'POST',body:JSON.stringify(input)});}
  async requestToJoin(groupId:string,message?:string):Promise<MembershipApplication>{return this.request('/api/v1/membership-applications',{method:'POST',body:JSON.stringify({groupId,message})});}
  async listApplications():Promise<MembershipApplication[]>{if(!this.activeGroupId)return[];return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/applications`);}
  async decideApplication(id:string,decision:'APPROVE'|'REJECT',reason?:string):Promise<{application:MembershipApplication;membershipId?:string}>{return this.request(`/api/v1/membership-applications/${encodeURIComponent(id)}/decision`,{method:'POST',body:JSON.stringify({decision,reason})});}

  async completionWorkflows():Promise<{version:string;workflows:Record<string,unknown>}>{return this.request('/api/v1/completion/workflows');}
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
  async createStockItem(input:{sku:string;name:string;quantity:number;unit?:string}):Promise<unknown>{if(!this.activeGroupId)throw Error('ACTIVE_GROUP_REQUIRED');return this.request('/api/v1/groups/'+encodeURIComponent(this.activeGroupId)+'/market/stock',{method:'POST',body:JSON.stringify(input)});}
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
  private async persistOutbox(){if(!IndexedDbOutboxAdapter.supported())throw Error('DURABLE_STORAGE_REQUIRED');try{await this.outboxStorage.save(this.outbox.list());}catch{throw Error('DURABLE_STORAGE_REQUIRED');}}
  outboxItems():OutboxItem[]{return this.outbox.list();}

  productModules(){return structuredClone(PRODUCT_MODULES);}
  kernelServices():readonly string[]{return KERNEL_SERVICE_IDS;}
  deviceCompatibility(capabilities:DeviceCapabilities){return{level:this.kernel.compatibility.classify(capabilities),capabilities:structuredClone(capabilities)};}
  safetyState(){return{realMoneyEnabled:false,manualCashLedgerEnabled:true,cloudAiBudgetEnabled:false,relayMediaEnabled:false};}
  async universe(){const server=await this.request<{groups:number;inbox:number;audit:number}>('/api/v1/universe');return{...server,pendingSync:this.outbox.list().filter(x=>x.status!=='CONFIRMED').length};}
}
