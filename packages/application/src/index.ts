import { PlatformKernel, type DeviceCapabilities } from '../../platform-kernel/src/index.js';
import { InMemoryPlatformRepository } from '../../repositories/src/index.js';
import { FoundationService } from '../../domain/src/index.js';
import { IndexedDbOutboxAdapter, Outbox } from '../../offline/src/index.js';
import { LoopbackRelayTransport, envelopeForOutbox } from '../../relay/src/index.js';
import { PRODUCT_MODULES } from '../../module-registry/src/index.js';
import { makeId, type CashboxReconciliationRecord, type CashboxSnapshot, type CaseRecord, type ContributionReceipt, type FeasibilityResult, type Group, type LedgerEntry, type LedgerSummary, type MeetingSession, type Membership, type MembershipView, type OutboxItem, type GroupOperatingPolicy, type RubricDefinition, type RubricOperatingModel, type RubricCyclePreview } from '../../contracts/src/index.js';

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

export class ConnectedApplication {
  private readonly kernel = new PlatformKernel();
  private readonly outbox = new Outbox();
  private readonly outboxStorage = new IndexedDbOutboxAdapter();
  private actorId:string; private tenantId:string; private displayName:string; private locale:string; private activeGroupId?:string;
  private readonly baseUrl:string;

  constructor(options:ConnectedApplicationOptions={}){
    this.baseUrl=options.baseUrl??''; this.actorId=options.actorId??'user_founder'; this.tenantId=options.tenantId??'tenant_local'; this.displayName=options.displayName??'Local Manager'; this.locale=options.locale??'fr';
    try{this.activeGroupId=localStorage.getItem('tontine.activeGroupId')??undefined;}catch{}
  }

  private headers(extra:Record<string,string>={}):HeadersInit{return{'content-type':'application/json','accept-language':this.locale,'x-tenant-id':this.tenantId,'x-actor-id':this.actorId,'x-group-roles':'founder,manager','x-active-group-id':this.activeGroupId??'','x-device-id':'web-local','x-session-id':'session-local','x-timezone':'Africa/Douala',...extra};}
  private async request<T>(path:string,init:RequestInit={}):Promise<T>{
    const response=await fetch(`${this.baseUrl}${path}`,{...init,headers:{...this.headers(),...(init.headers??{})}});
    const body=await response.json().catch(()=>({error:`HTTP_${response.status}`}));
    if(!response.ok) throw new Error(String(body.error??`HTTP_${response.status}`)); return body as T;
  }

  async bootstrap(input:{actorId?:string;tenantId?:string;displayName?:string;locale?:string}={}):Promise<{restoredOutbox:number;groups:Group[]}>{
    this.actorId=input.actorId??this.actorId;this.tenantId=input.tenantId??this.tenantId;this.displayName=input.displayName??this.displayName;this.locale=input.locale??this.locale;
    await this.request('/api/v1/bootstrap',{method:'POST',body:JSON.stringify({displayName:this.displayName,locale:this.locale})});
    let restoredOutbox=0;if(IndexedDbOutboxAdapter.supported())try{const persisted=await this.outboxStorage.load();this.outbox.restore(persisted.filter(x=>x.tenantId===this.tenantId&&x.actorId===this.actorId));restoredOutbox=this.outbox.list().length;}catch{}
    const groups=await this.listGroups(); if(this.activeGroupId&&!groups.some(g=>g.id===this.activeGroupId))this.selectGroup(undefined); if(!this.activeGroupId&&groups[0])this.selectGroup(groups[0].id);
    return{restoredOutbox,groups};
  }

  setLocale(locale:string):void{this.locale=locale;}
  setConnectivity(_connectivity:'online'|'offline'|'degraded'):void{}
  selectGroup(groupId?:string):void{this.activeGroupId=groupId;try{if(groupId)localStorage.setItem('tontine.activeGroupId',groupId);else localStorage.removeItem('tontine.activeGroupId');}catch{}}
  activeGroup():string|undefined{return this.activeGroupId;}

  async listGroups():Promise<Group[]>{return this.request('/api/v1/groups');}
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

  async simulateAndStoreProject(input:{name:string;kind:Group['kind'];governanceModel:Group['governanceModel'];memberCount:number;sessions:number;nominalContribution:number;managementFeePerContribution:number;estimatedExternalCostRate:number;fixedOperatingCostPerSession:number}):Promise<{projectId:string;result:FeasibilityResult}>{
    const project=await this.request<{id:string}>('/api/v1/group-projects',{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});
    const result=await this.request<FeasibilityResult>(`/api/v1/group-projects/${encodeURIComponent(project.id)}/simulate`,{method:'POST',body:'{}'}); return{projectId:project.id,result};
  }
  async createGroupFromProject(projectId:string):Promise<Group>{const group=await this.request<Group>(`/api/v1/group-projects/${encodeURIComponent(projectId)}/convert`,{method:'POST',body:'{}'});this.selectGroup(group.id);return group;}
  async addMember(displayName:string):Promise<Membership>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/members`,{method:'POST',body:JSON.stringify({displayName,locale:this.locale})});}

  async recordCashContribution(input:{membershipId:string;amount:number;meetingId?:string;rubricId?:string;lateReason?:string;approverIds?:string[]}):Promise<{queued:boolean;receipt?:ContributionReceipt;outbox?:OutboxItem}>{
    if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED'); const key=`cash-${this.activeGroupId}-${input.membershipId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    if(!navigator.onLine){const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type:'CONTRIBUTION_CASH_RECORDED',payload:{groupId:this.activeGroupId,membershipId:input.membershipId,amount:input.amount,currency:'XAF',meetingId:input.meetingId,rubricId:input.rubricId,lateReason:input.lateReason,approverIds:input.approverIds},idempotencyKey:key});await this.persistOutbox();return{queued:true,outbox:item};}
    const receipt=await this.request<ContributionReceipt>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/contributions/cash`,{method:'POST',body:JSON.stringify({membershipId:input.membershipId,amount:input.amount,currency:'XAF',meetingId:input.meetingId,rubricId:input.rubricId,lateReason:input.lateReason,approverIds:input.approverIds,idempotencyKey:key})});return{queued:false,receipt};
  }
  async ledger():Promise<{summary:LedgerSummary;entries:LedgerEntry[];receipts:ContributionReceipt[]}>{if(!this.activeGroupId)return{summary:{currency:'XAF',cashBalance:0,memberFundsLiability:0,entryCount:0},entries:[],receipts:[]};return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/ledger`);}
  async reverseLedgerEntry(entryId:string,reason:string):Promise<LedgerEntry>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/ledger/${encodeURIComponent(entryId)}/reverse`,{method:'POST',body:JSON.stringify({reason})});}

  async reconcileCashbox(input:{openingCash:number;cashIn:number;cashOut:number;countedClosing:number;meetingId?:string}):Promise<CashboxReconciliationRecord>{if(!this.activeGroupId)throw new Error('ACTIVE_GROUP_REQUIRED');return this.request<CashboxReconciliationRecord>(`/api/v1/groups/${encodeURIComponent(this.activeGroupId)}/cashbox/reconciliations`,{method:'POST',body:JSON.stringify({...input,currency:'XAF'})});}
  async openSupportCase(summary:string):Promise<CaseRecord>{return this.request('/api/v1/cases',{method:'POST',body:JSON.stringify({summary,groupId:this.activeGroupId})});}
  async inboxItems():Promise<Array<{id:string;kind:string;title:string;priority:string;status:string;groupId?:string}>>{return this.request('/api/v1/inbox');}

  async syncOutbox():Promise<OutboxItem[]>{
    const result=await this.outbox.sync(async item=>{try{const r=await this.request<{accepted:boolean}>('/api/v1/outbox/apply',{method:'POST',body:JSON.stringify(item)});return{ok:r.accepted};}catch{return{ok:false,conflict:false};}});await this.persistOutbox();return result;
  }
  async queueDemoIntent(note='Local note'):Promise<OutboxItem>{const item=this.outbox.enqueue({tenantId:this.tenantId,actorId:this.actorId,type:'MEETING_NOTE_UPDATED',payload:{groupId:this.activeGroupId,note},idempotencyKey:`note-${this.activeGroupId??'none'}-${Date.now()}`});await this.persistOutbox();return item;}
  private async persistOutbox(){if(!IndexedDbOutboxAdapter.supported())return;try{await this.outboxStorage.save(this.outbox.list());}catch{}}
  outboxItems():OutboxItem[]{return this.outbox.list();}

  productModules(){return structuredClone(PRODUCT_MODULES);}
  kernelServices():readonly string[]{return KERNEL_SERVICE_IDS;}
  deviceCompatibility(capabilities:DeviceCapabilities){return{level:this.kernel.compatibility.classify(capabilities),capabilities:structuredClone(capabilities)};}
  safetyState(){return{realMoneyEnabled:false,manualCashLedgerEnabled:true,cloudAiBudgetEnabled:false,relayMediaEnabled:false};}
  async universe(){const server=await this.request<{groups:number;inbox:number;audit:number}>('/api/v1/universe');return{...server,pendingSync:this.outbox.list().filter(x=>x.status!=='CONFIRMED').length};}
}
