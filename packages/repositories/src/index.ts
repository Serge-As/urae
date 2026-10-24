import type {
  AuditEvent, CashboxReconciliationRecord, CaseRecord, ContributionReceipt, EvidenceRecord, Group, GroupProject, Id,
  LedgerAccount, LedgerEntry, MeetingSession, Membership, Obligation, User, PublicGroupListing, MembershipApplication,
  RubricDefinition, GovernanceKnowledgeClaim, WorkspaceRecord
} from '../../contracts/src/index.js';

export interface FinancialOperation {
  kind: 'contribution' | 'reversal' | 'cash_in' | 'cash_out' | 'loan_disbursement' | 'loan_repayment' | 'tontine_benefit' | 'opening_balance' | 'transfer';
  entry: LedgerEntry;
  receipt?: ContributionReceipt;
  accounts: LedgerAccount[];
  audit: AuditEvent;
  /** Records committed in the same financial transaction and dispatched afterwards. */
  outboxRecords?: WorkspaceRecord[];
}

export interface FinancialCellRevision {
  tenantId: Id;
  groupId: Id;
  meetingId: Id;
  membershipId: Id;
  rubricId: Id;
  currency: string;
  version: number;
  lastOperationId: Id;
  updatedAt: string;
}

export interface FinancialCellRevisionCAS {
  meetingId: Id;
  membershipId: Id;
  rubricId: Id;
  currency: string;
  expectedVersion: number;
  nextVersion: number;
}

export interface GroupPurgeManifest {
  tenantId: Id;
  groupId: Id;
  entityIds: Id[];
  artifactKeys: string[];
}
export interface GroupPurgeResult {
  purged: true;
  scopeHash: string;
  purgedAt: string;
  artifactCleanupTaskId: string;
  artifactsPending: number;
}

export type TrashEntityRecord = Group | Membership | MeetingSession | RubricDefinition;
export interface TrashLifecyclePlan {
  entityRecordType: 'group'|'membership'|'meeting'|'rubric_definition';
  entity: TrashEntityRecord;
  trashRecord: WorkspaceRecord;
  audit: AuditEvent;
}

export interface FinancialCorrectionPlan {
  kind: 'cell_correction';
  operationId: Id;
  idempotencyKey: string;
  intentFingerprint: string;
  tenantId: Id;
  groupId: Id;
  primaryEntryId: Id;
  entries: LedgerEntry[];
  receipt?: ContributionReceipt;
  accounts: LedgerAccount[];
  audits: AuditEvent[];
  cellRevision: FinancialCellRevisionCAS;
  /** Durable records created with the correction; delivery happens only after commit. */
  outboxRecords?: WorkspaceRecord[];
}

/** A real, later same-amount validation advances the winning clock and
 * canonical version without inventing a cash movement. */
export interface FinancialCellStampPlan {
  tenantId:Id;groupId:Id;operationId:Id;expectedVersion:number;nextVersion:number;
  meetingId:Id;membershipId:Id;rubricId:Id;currency:string;
  records:WorkspaceRecord[];audit:AuditEvent;createdAt:string;
}

export interface MarketStockReservationPlan {
  operationId: Id;
  tenantId: Id;
  groupId?: Id;
  stock: WorkspaceRecord;
  order: WorkspaceRecord;
  movement: EvidenceRecord;
  expectedVersion: number;
  reservationQuantity: number;
}

export interface MarketOrderTransitionPlan {
  operationId:Id;tenantId:Id;groupId?:Id;stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord;
  expectedStockVersion:number;expectedOrderVersion:number;
}

const marketScope=(r:WorkspaceRecord)=>String(r.data.marketScopeId??r.groupId??'');

export interface MarketRecordMutationPlan {record:WorkspaceRecord;expectedVersion:number;movement?:EvidenceRecord;createdStock?:WorkspaceRecord;createdMovement?:EvidenceRecord;}

// Optional conversion extends the existing stock CAS; old mutation plans are unchanged.
function validateCreatedStock(plan:MarketRecordMutationPlan){
 const x=plan.createdStock,e=plan.createdMovement,m=plan.movement,r=plan.record;if(!x&&!e)return;
 if(!x||!e||!m||r.data.marketKind!=='STOCK_ITEM'||x.data.marketKind!=='STOCK_ITEM'||x.moduleId!=='MARKETPLACE.CORE'||x.tenantId!==r.tenantId||x.groupId!==r.groupId||marketScope(x)!==marketScope(r)||x.id===r.id||!x.tags.includes('market-engine')||Number(x.data.version)!==1||!Number.isSafeInteger(x.data.quantity)||Number(x.data.quantity)<=0||Number(x.data.reserved)!==0||e.tenantId!==x.tenantId||e.subjectId!==x.id||e.data.sourceId!==r.id||e.data.marketScopeId!==marketScope(r)||m.type!=='MARKET_STOCK_MOVEMENT'||e.type!=='MARKET_STOCK_MOVEMENT'||m.data.kind!=='HARVEST_TRANSFORMATION'||e.data.kind!=='HARVEST_OUTPUT')throw Error('MARKET_CONVERSION_PLAN_INVALID');
}

export interface NotificationInsertResult {record:WorkspaceRecord;inserted:boolean;}

export interface PlatformRepository {
  commitMarketRecordMutation(plan:MarketRecordMutationPlan):WorkspaceRecord|Promise<WorkspaceRecord>;
  commitWorkspaceRecordRevision(record:WorkspaceRecord,expectedVersion:number):WorkspaceRecord|Promise<WorkspaceRecord>;
  commitFinancialOperation(operation: FinancialOperation): FinancialOperation | Promise<FinancialOperation>;
  commitFinancialCorrection(plan: FinancialCorrectionPlan): FinancialCorrectionPlan | Promise<FinancialCorrectionPlan>;
  commitFinancialCellStamp(plan:FinancialCellStampPlan):FinancialCellStampPlan|Promise<FinancialCellStampPlan>;
  commitMarketOrderTransition(plan:MarketOrderTransitionPlan):{stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord}|Promise<{stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord}>;
  commitMarketStockReservation(plan:MarketStockReservationPlan): {stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord} | Promise<{stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord}>;
  getFinancialCellRevision(tenantId:Id,groupId:Id,meetingId:Id,membershipId:Id,rubricId:Id,currency:string): FinancialCellRevision | undefined | Promise<FinancialCellRevision | undefined>;
  listFinancialCellRevisions(tenantId:Id,groupId:Id): FinancialCellRevision[] | Promise<FinancialCellRevision[]>;
  captureGroupPurgeManifest(tenantId:Id,groupId:Id): GroupPurgeManifest | Promise<GroupPurgeManifest>;
  purgeGroupData(manifest:GroupPurgeManifest,deletionId:string,purgedAt:string): GroupPurgeResult | Promise<GroupPurgeResult>;
  isGroupPurged(tenantId:Id,groupId:Id): boolean | Promise<boolean>;
  commitTrashLifecycle(plan:TrashLifecyclePlan): TrashLifecyclePlan | Promise<TrashLifecyclePlan>;
  listTrashMaintenanceItems(): WorkspaceRecord[] | Promise<WorkspaceRecord[]>;
  getGroupById(id:Id):Group|undefined|Promise<Group|undefined>;
  listMembershipsForUser(userId:Id):Membership[]|Promise<Membership[]>;
  saveUser(user: User): void | Promise<void>;
  getUser(id: Id): User | undefined | Promise<User | undefined>;

  saveProject(project: GroupProject): void | Promise<void>;
  getProject(tenantId: Id, id: Id): GroupProject | undefined | Promise<GroupProject | undefined>;

  saveGroup(group: Group): void | Promise<void>;
  getGroup(tenantId: Id, id: Id): Group | undefined | Promise<Group | undefined>;
  listGroups(tenantId: Id): Group[] | Promise<Group[]>;

  saveMembership(membership: Membership): void | Promise<void>;
  getMembership(tenantId: Id, groupId: Id, membershipId: Id): Membership | undefined | Promise<Membership | undefined>;
  listMemberships(tenantId: Id, groupId: Id): Membership[] | Promise<Membership[]>;

  saveObligation(obligation: Obligation): void | Promise<void>;
  listObligations(tenantId: Id, assigneeId?: Id): Obligation[] | Promise<Obligation[]>;

  saveCase(record: CaseRecord): void | Promise<void>;
  listCases(tenantId: Id, openedBy?: Id): CaseRecord[] | Promise<CaseRecord[]>;
  getCaseById(id:Id):CaseRecord|undefined|Promise<CaseRecord|undefined>;
  listCareCasesForActor(actorId:Id):CaseRecord[]|Promise<CaseRecord[]>;
  saveCaseRevision(record:CaseRecord,expectedRevision:number|null):boolean|Promise<boolean>;

  saveEvidence(record: EvidenceRecord): void | Promise<void>;
  getEvidence(tenantId: Id, id: Id): EvidenceRecord | undefined | Promise<EvidenceRecord | undefined>;
  listEvidence(tenantId: Id, subjectType?: string, subjectId?: Id): EvidenceRecord[] | Promise<EvidenceRecord[]>;

  saveAudit(event: AuditEvent): void | Promise<void>;
  listAudit(tenantId: Id): AuditEvent[] | Promise<AuditEvent[]>;

  saveMeeting(meeting: MeetingSession): void | Promise<void>;
  getMeeting(tenantId: Id, groupId: Id, meetingId: Id): MeetingSession | undefined | Promise<MeetingSession | undefined>;
  listMeetings(tenantId: Id, groupId: Id): MeetingSession[] | Promise<MeetingSession[]>;

  saveLedgerAccount(account: LedgerAccount): void | Promise<void>;
  listLedgerAccounts(tenantId: Id, groupId: Id): LedgerAccount[] | Promise<LedgerAccount[]>;

  saveLedgerEntry(entry: LedgerEntry): void | Promise<void>;
  getLedgerEntry(tenantId: Id, groupId: Id, entryId: Id): LedgerEntry | undefined | Promise<LedgerEntry | undefined>;
  findLedgerEntryByIdempotency(tenantId: Id, groupId: Id, idempotencyKey: string): LedgerEntry | undefined | Promise<LedgerEntry | undefined>;
  listLedgerEntries(tenantId: Id, groupId: Id): LedgerEntry[] | Promise<LedgerEntry[]>;

  saveContributionReceipt(receipt: ContributionReceipt): void | Promise<void>;
  findContributionReceiptByIdempotency(tenantId: Id, groupId: Id, idempotencyKey: string): ContributionReceipt | undefined | Promise<ContributionReceipt | undefined>;
  listContributionReceipts(tenantId: Id, groupId: Id): ContributionReceipt[] | Promise<ContributionReceipt[]>;

  saveCashboxReconciliation(record: CashboxReconciliationRecord): void | Promise<void>;
  listCashboxReconciliations(tenantId: Id, groupId: Id): CashboxReconciliationRecord[] | Promise<CashboxReconciliationRecord[]>;

  savePublicGroupListing(listing: PublicGroupListing): void | Promise<void>;
  getPublicGroupListing(groupId: Id): PublicGroupListing | undefined | Promise<PublicGroupListing | undefined>;
  listPublicGroupListings(): PublicGroupListing[] | Promise<PublicGroupListing[]>;

  saveMembershipApplication(application: MembershipApplication): void | Promise<void>;
  getMembershipApplication(id: Id): MembershipApplication | undefined | Promise<MembershipApplication | undefined>;
  listMembershipApplicationsForGroup(targetTenantId: Id, groupId: Id): MembershipApplication[] | Promise<MembershipApplication[]>;

  saveRubricDefinition(rubric: RubricDefinition): void | Promise<void>;
  getRubricDefinition(tenantId: Id, groupId: Id, rubricId: Id): RubricDefinition | undefined | Promise<RubricDefinition | undefined>;
  listRubricDefinitions(tenantId: Id, groupId: Id): RubricDefinition[] | Promise<RubricDefinition[]>;

  saveGovernanceKnowledgeClaim(claim: GovernanceKnowledgeClaim): void | Promise<void>;
  listGovernanceKnowledgeClaims(tenantId: Id, groupId?: Id): GovernanceKnowledgeClaim[] | Promise<GovernanceKnowledgeClaim[]>;

  getMarketRecordById(id:Id):WorkspaceRecord|undefined|Promise<WorkspaceRecord|undefined>;
  listMarketShops(actorId?:Id):WorkspaceRecord[]|Promise<WorkspaceRecord[]>;
  listMarketPurchases(actorId:Id):WorkspaceRecord[]|Promise<WorkspaceRecord[]>;
  saveWorkspaceRecord(record: WorkspaceRecord): void | Promise<void>;
  /** Notification-owned append-only publication/read/attempt; a replay never overwrites the first payload. */
  insertNotificationRecord(record: WorkspaceRecord): NotificationInsertResult | Promise<NotificationInsertResult>;
  /** Immutable, append-only facts owned by verification and poll follow-up. */
  insertGovernedRecord(record: WorkspaceRecord): NotificationInsertResult | Promise<NotificationInsertResult>;
  getWorkspaceRecord(tenantId: Id, id: Id): WorkspaceRecord | undefined | Promise<WorkspaceRecord | undefined>;
  listWorkspaceRecords(tenantId: Id, moduleId?: string, groupId?: Id): WorkspaceRecord[] | Promise<WorkspaceRecord[]>;
}

export class InMemoryPlatformRepository implements PlatformRepository {
  getGroupById(id:Id):Group|undefined {const g=this.groups.get(id);return g?structuredClone(g):undefined;}
  listMembershipsForUser(userId:Id):Membership[]{return [...this.memberships.values()].filter(m=>m.userId===userId).map(m=>structuredClone(m));}
  private financialOperations = new Map<string, FinancialOperation>();
  commitFinancialOperation(operation: FinancialOperation): FinancialOperation {
    const e=operation.entry;
    const key=JSON.stringify([e.tenantId,e.groupId,operation.kind,e.idempotencyKey]);
    const existing=this.financialOperations.get(key);
    if(existing) return structuredClone(existing);
    const copy=structuredClone(operation);
    // All changes are synchronous within this in-memory repository transaction.
    for(const a of copy.accounts) this.ledgerAccounts.set(a.id,a);
    this.ledgerEntries.set(copy.entry.id,copy.entry);
    if(copy.receipt) this.receipts.set(copy.receipt.id,copy.receipt);
    this.audits.set(copy.audit.id,copy.audit);
    for(const record of copy.outboxRecords??[])this.workspaceRecords.set(record.id,record);
    this.financialOperations.set(key,copy);
    return structuredClone(copy);
  }
  private financialCorrections = new Map<string, FinancialCorrectionPlan>();
  private financialCellRevisions = new Map<string, FinancialCellRevision>();
  private financialCellRevisionKey(t:Id,g:Id,m:Id,member:Id,rubric:Id,currency:string):string{return JSON.stringify([t,g,m,member,rubric,currency]);}
  commitFinancialCorrection(plan: FinancialCorrectionPlan): FinancialCorrectionPlan {
    const key=JSON.stringify([plan.tenantId,plan.groupId,plan.kind,plan.idempotencyKey]);
    const existing=this.financialCorrections.get(key);
    if(existing){
      if(existing.intentFingerprint!==plan.intentFingerprint)throw new Error('IDEMPOTENCY_CONFLICT');
      return structuredClone(existing);
    }
    const c=plan.cellRevision,revisionKey=this.financialCellRevisionKey(plan.tenantId,plan.groupId,c.meetingId,c.membershipId,c.rubricId,c.currency);
    const current=this.financialCellRevisions.get(revisionKey),currentVersion=current?.version??0;
    if(currentVersion!==c.expectedVersion)throw new Error('CELL_VERSION_CONFLICT');
    const copy=structuredClone(plan),at=copy.entries.at(-1)?.createdAt??new Date().toISOString();
    // One synchronous commit boundary: CAS, reversals, replacement, audit and
    // durable delivery records become visible together.
    this.financialCellRevisions.set(revisionKey,{tenantId:plan.tenantId,groupId:plan.groupId,meetingId:c.meetingId,membershipId:c.membershipId,rubricId:c.rubricId,currency:c.currency,version:c.nextVersion,lastOperationId:plan.operationId,updatedAt:at});
    for(const a of copy.accounts)this.ledgerAccounts.set(a.id,a);
    for(const entry of copy.entries)this.ledgerEntries.set(entry.id,entry);
    if(copy.receipt)this.receipts.set(copy.receipt.id,copy.receipt);
    for(const audit of copy.audits)this.audits.set(audit.id,audit);
    for(const record of copy.outboxRecords??[])this.workspaceRecords.set(record.id,record);
    this.financialCorrections.set(key,copy);
    return structuredClone(copy);
  }
  commitFinancialCellStamp(plan:FinancialCellStampPlan):FinancialCellStampPlan {
    const key=this.financialCellRevisionKey(plan.tenantId,plan.groupId,plan.meetingId,
      plan.membershipId,plan.rubricId,plan.currency);
    const current=this.financialCellRevisions.get(key);
    if((current?.version??0)!==plan.expectedVersion)throw Error('CELL_VERSION_CONFLICT');
    if(plan.nextVersion!==plan.expectedVersion+1)throw Error('INVALID_CELL_VERSION');
    this.financialCellRevisions.set(key,{tenantId:plan.tenantId,groupId:plan.groupId,
      meetingId:plan.meetingId,membershipId:plan.membershipId,rubricId:plan.rubricId,
      currency:plan.currency,version:plan.nextVersion,lastOperationId:plan.operationId,
      updatedAt:plan.createdAt});
    for(const record of plan.records)this.workspaceRecords.set(record.id,structuredClone(record));
    this.audits.set(plan.audit.id,structuredClone(plan.audit));
    return structuredClone(plan);
  }

  commitWorkspaceRecordRevision(record:WorkspaceRecord,expectedVersion:number){return this.commitMarketRecordMutation({record,expectedVersion});}
  commitMarketRecordMutation(plan:MarketRecordMutationPlan):WorkspaceRecord{
    validateCreatedStock(plan);if(plan.createdStock&&this.workspaceRecords.has(plan.createdStock.id))throw Error('MARKET_IDEMPOTENCY_CONFLICT');
    const current=this.workspaceRecords.get(plan.record.id);
    if(!current||current.tenantId!==plan.record.tenantId||current.groupId!==plan.record.groupId||marketScope(current)!==marketScope(plan.record))throw Error('FORBIDDEN_SCOPE');
    if(Number(current.data.version??1)!==plan.expectedVersion)throw Error('MARKET_RECORD_CONFLICT');
    if(plan.movement&&(plan.movement.tenantId!==current.tenantId||plan.movement.subjectId!==current.id||plan.movement.data.groupId!==current.groupId||String(plan.movement.data.marketScopeId??plan.movement.data.groupId??'')!==marketScope(current)))throw Error('MARKET_ORDER_PLAN_INVALID');
    this.workspaceRecords.set(current.id,structuredClone(plan.record));
    if(plan.movement)this.evidences.set(plan.movement.id,structuredClone(plan.movement));
    if(plan.createdStock)this.workspaceRecords.set(plan.createdStock.id,structuredClone(plan.createdStock));
    if(plan.createdMovement)this.evidences.set(plan.createdMovement.id,structuredClone(plan.createdMovement));
    return structuredClone(plan.record);
  }

  commitMarketOrderTransition(plan:MarketOrderTransitionPlan):{stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord}{
    const stock=this.workspaceRecords.get(plan.stock.id),order=this.workspaceRecords.get(plan.order.id),prior=this.evidences.get(plan.movement.id);
    if(!stock||!order||stock.tenantId!==plan.tenantId||order.tenantId!==plan.tenantId||stock.groupId!==plan.groupId||order.groupId!==plan.groupId||marketScope(stock)!==marketScope(order)||marketScope(stock)!==marketScope(plan.stock)||marketScope(order)!==marketScope(plan.order))throw Error('FORBIDDEN_SCOPE');
    if(prior){if(prior.type!=='MARKET_STOCK_MOVEMENT'||prior.data.requestFingerprint!==plan.movement.data.requestFingerprint)throw Error('MARKET_IDEMPOTENCY_CONFLICT');return{stock:structuredClone(stock),order:structuredClone(order),movement:structuredClone(prior)};}
    if(Number(stock.data.version??1)!==plan.expectedStockVersion||Number(order.data.version??1)!==plan.expectedOrderVersion)throw Error('MARKET_ORDER_CONFLICT');
    if(plan.movement.subjectId!==stock.id||plan.movement.data.sourceId!==order.id||String(plan.stock.data.lastMarketOperationId)!==plan.operationId||String(plan.order.data.lastMarketOperationId)!==plan.operationId)throw Error('MARKET_ORDER_PLAN_INVALID');
    this.workspaceRecords.set(stock.id,structuredClone(plan.stock));this.workspaceRecords.set(order.id,structuredClone(plan.order));this.evidences.set(plan.movement.id,structuredClone(plan.movement));
    return{stock:structuredClone(plan.stock),order:structuredClone(plan.order),movement:structuredClone(plan.movement)};
  }

  commitMarketStockReservation(plan:MarketStockReservationPlan):{stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord}{
    const current=this.workspaceRecords.get(plan.stock.id);
    if(!current||current.tenantId!==plan.tenantId||current.groupId!==plan.groupId||marketScope(current)!==marketScope(plan.order)||marketScope(current)!==marketScope(plan.stock))throw new Error('STOCK_ITEM_NOT_FOUND');
    const version=Number(current.data.version??1),available=Number(current.data.quantity??0)-Number(current.data.reserved??0)-Number(current.data.quarantine??0);
    if(version!==plan.expectedVersion||available<plan.reservationQuantity)throw new Error('MARKET_STOCK_RESERVATION_CONFLICT');
    if(String(plan.stock.data.lastReservationOperationId??'')!==plan.operationId)throw new Error('MARKET_STOCK_RESERVATION_PLAN_INVALID');
    this.workspaceRecords.set(plan.stock.id,structuredClone(plan.stock));
    this.workspaceRecords.set(plan.order.id,structuredClone(plan.order));
    this.evidences.set(plan.movement.id,structuredClone(plan.movement));
    return{stock:structuredClone(plan.stock),order:structuredClone(plan.order),movement:structuredClone(plan.movement)};
  }

  getFinancialCellRevision(tenantId:Id,groupId:Id,meetingId:Id,membershipId:Id,rubricId:Id,currency:string):FinancialCellRevision|undefined{
    const x=this.financialCellRevisions.get(this.financialCellRevisionKey(tenantId,groupId,meetingId,membershipId,rubricId,currency));
    return x?structuredClone(x):undefined;
  }
  listFinancialCellRevisions(tenantId:Id,groupId:Id):FinancialCellRevision[]{
    return [...this.financialCellRevisions.values()].filter(x=>x.tenantId===tenantId&&x.groupId===groupId).map(x=>structuredClone(x));
  }

  private purgedGroupScopes = new Set<string>();
  private users = new Map<Id, User>();
  private projects = new Map<Id, GroupProject>();
  private groups = new Map<Id, Group>();
  private memberships = new Map<Id, Membership>();
  private obligations = new Map<Id, Obligation>();
  private cases = new Map<Id, CaseRecord>();
  private evidences = new Map<Id, EvidenceRecord>();
  private audits = new Map<Id, AuditEvent>();
  private meetings = new Map<Id, MeetingSession>();
  private ledgerAccounts = new Map<Id, LedgerAccount>();
  private ledgerEntries = new Map<Id, LedgerEntry>();
  private receipts = new Map<Id, ContributionReceipt>();
  private cashboxReconciliations = new Map<Id, CashboxReconciliationRecord>();
  private publicGroupListings = new Map<Id, PublicGroupListing>();
  private membershipApplications = new Map<Id, MembershipApplication>();
  private rubricDefinitions = new Map<Id, RubricDefinition>();
  private governanceKnowledgeClaims = new Map<Id, GovernanceKnowledgeClaim>();
  private workspaceRecords = new Map<Id, WorkspaceRecord>();

  commitTrashLifecycle(plan:TrashLifecyclePlan):TrashLifecyclePlan{
    const copy=structuredClone(plan),x=copy.entity as any;
    if(plan.entityRecordType==='group')this.groups.set(x.id,x);
    else if(plan.entityRecordType==='membership')this.memberships.set(x.id,x);
    else if(plan.entityRecordType==='meeting')this.meetings.set(x.id,x);
    else this.rubricDefinitions.set(x.id,x);
    this.workspaceRecords.set(copy.trashRecord.id,copy.trashRecord);this.audits.set(copy.audit.id,copy.audit);
    return structuredClone(copy);
  }
  listTrashMaintenanceItems():WorkspaceRecord[]{return [...this.workspaceRecords.values()].filter(x=>x.moduleId==='TRASH.ITEM'||x.moduleId==='TRASH.ARTIFACT_CLEANUP').map(x=>structuredClone(x));}

  captureGroupPurgeManifest(tenantId:Id,groupId:Id):GroupPurgeManifest{
    const ids=new Set<Id>([groupId]),artifacts=new Set<string>();
    const collect=(value:unknown)=>{
      if(typeof value==='string'&&value.includes('/'+tenantId+'/'+groupId+'/'))artifacts.add(value);
      else if(Array.isArray(value))for(const x of value)collect(x);
      else if(value&&typeof value==='object')for(const x of Object.values(value as Record<string,unknown>))collect(x);
    };
    const addScoped=<T extends {id:Id;tenantId?:Id;groupId?:Id}>(items:Iterable<T>)=>{
      for(const x of items)if(x.tenantId===tenantId&&x.groupId===groupId){ids.add(x.id);collect(x);}
    };
    addScoped(this.memberships.values());addScoped(this.obligations.values());addScoped(this.cases.values());
    addScoped(this.meetings.values());addScoped(this.ledgerAccounts.values());addScoped(this.ledgerEntries.values());
    addScoped(this.receipts.values());addScoped(this.cashboxReconciliations.values());addScoped(this.rubricDefinitions.values());
    addScoped(this.governanceKnowledgeClaims.values());addScoped(this.workspaceRecords.values());
    for(const x of this.publicGroupListings.values())if(x.groupId===groupId){ids.add(x.id);collect(x);}
    for(const x of this.membershipApplications.values())if(x.groupId===groupId){ids.add(x.id);collect(x);}
    return{tenantId,groupId,entityIds:[...ids],artifactKeys:[...artifacts]};
  }
  purgeGroupData(manifest:GroupPurgeManifest,deletionId:string,purgedAt:string):GroupPurgeResult{
    const {tenantId,groupId}=manifest,ids=new Set(manifest.entityIds),scope=JSON.stringify([tenantId,groupId]);
    const delScoped=<T extends {id:Id;tenantId?:Id;groupId?:Id}>(map:Map<Id,T>)=>{for(const [id,x] of map)if(x.tenantId===tenantId&&x.groupId===groupId)map.delete(id);};
    delScoped(this.memberships);delScoped(this.obligations);delScoped(this.cases);delScoped(this.meetings);
    delScoped(this.ledgerAccounts);delScoped(this.ledgerEntries);delScoped(this.receipts);delScoped(this.cashboxReconciliations);
    delScoped(this.rubricDefinitions);delScoped(this.governanceKnowledgeClaims);delScoped(this.workspaceRecords);
    for(const [id,x] of this.publicGroupListings)if(x.groupId===groupId)this.publicGroupListings.delete(id);
    for(const [id,x] of this.membershipApplications)if(x.groupId===groupId)this.membershipApplications.delete(id);
    for(const [id,x] of this.audits)if(x.tenantId===tenantId&&ids.has(x.targetId))this.audits.delete(id);
    for(const [id,x] of this.evidences)if(x.tenantId===tenantId&&ids.has(x.subjectId))this.evidences.delete(id);
    for(const [key,x] of this.financialOperations)if(x.entry.tenantId===tenantId&&x.entry.groupId===groupId)this.financialOperations.delete(key);
    for(const [key,x] of this.financialCorrections)if(x.tenantId===tenantId&&x.groupId===groupId)this.financialCorrections.delete(key);
    for(const [key,x] of this.financialCellRevisions)if(x.tenantId===tenantId&&x.groupId===groupId)this.financialCellRevisions.delete(key);
    this.groups.delete(groupId);this.purgedGroupScopes.add(scope);
    const cleanupId='trash_artifact_cleanup_'+encodeURIComponent(scope),cleanup:WorkspaceRecord={id:cleanupId,tenantId,moduleId:'TRASH.ARTIFACT_CLEANUP',title:'Nettoyage de pièces après purge',status:manifest.artifactKeys.length?'ACTIVE':'DONE',tags:['trash','artifact-cleanup'],data:{artifactKeysJson:JSON.stringify(manifest.artifactKeys),completedKeysJson:'[]',lastError:null,purgeScope:scope,purgedAt},createdBy:'system_trash_maintenance',createdAt:purgedAt,updatedAt:purgedAt};this.workspaceRecords.set(cleanupId,cleanup);
    return{purged:true,scopeHash:scope,purgedAt,artifactCleanupTaskId:cleanupId,artifactsPending:manifest.artifactKeys.length};
  }
  isGroupPurged(tenantId:Id,groupId:Id):boolean{return this.purgedGroupScopes.has(JSON.stringify([tenantId,groupId]));}

  saveUser(user: User): void { this.users.set(user.id, structuredClone(user)); }
  getUser(id: Id): User | undefined { const x = this.users.get(id); return x ? structuredClone(x) : undefined; }

  saveProject(project: GroupProject): void { this.projects.set(project.id, structuredClone(project)); }
  getProject(tenantId: Id, id: Id): GroupProject | undefined { const x = this.projects.get(id); return x?.tenantId === tenantId ? structuredClone(x) : undefined; }

  saveGroup(group: Group): void { this.groups.set(group.id, structuredClone(group)); }
  getGroup(tenantId: Id, id: Id): Group | undefined { const x = this.groups.get(id); return x?.tenantId === tenantId ? structuredClone(x) : undefined; }
  listGroups(tenantId: Id): Group[] { return [...this.groups.values()].filter(x => x.tenantId === tenantId).map(x => structuredClone(x)); }

  saveMembership(membership: Membership): void { this.memberships.set(membership.id, structuredClone(membership)); }
  getMembership(tenantId: Id, groupId: Id, membershipId: Id): Membership | undefined {
    const x = this.memberships.get(membershipId); return x?.tenantId === tenantId && x.groupId === groupId ? structuredClone(x) : undefined;
  }
  listMemberships(tenantId: Id, groupId: Id): Membership[] { return [...this.memberships.values()].filter(x => x.tenantId === tenantId && x.groupId === groupId).map(x => structuredClone(x)); }

  saveObligation(obligation: Obligation): void { this.obligations.set(obligation.id, structuredClone(obligation)); }
  listObligations(tenantId: Id, assigneeId?: Id): Obligation[] { return [...this.obligations.values()].filter(x => x.tenantId === tenantId && (!assigneeId || x.assigneeId === assigneeId)).map(x => structuredClone(x)); }

  saveCase(record: CaseRecord): void { this.cases.set(record.id, structuredClone(record)); }
  getCaseById(id:Id){const x=this.cases.get(id);return x?structuredClone(x):undefined;}
  listCareCasesForActor(actorId:Id){return [...this.cases.values()].filter(x=>x.openedBy===actorId||x.care?.participantIds.includes(actorId)).map(x=>structuredClone(x));}
  saveCaseRevision(record:CaseRecord,expectedRevision:number|null){const prior=this.cases.get(record.id);if(expectedRevision===null?Boolean(prior):!prior||prior.tenantId!==record.tenantId||prior.openedBy!==record.openedBy||(prior.care?.revision??0)!==expectedRevision)return false;this.cases.set(record.id,structuredClone(record));return true;}
  listCases(tenantId: Id, openedBy?: Id): CaseRecord[] { return [...this.cases.values()].filter(x => x.tenantId === tenantId && (!openedBy || x.openedBy === openedBy)).map(x => structuredClone(x)); }

  saveEvidence(record: EvidenceRecord): void {
    const previous=this.evidences.get(record.id);
    if(previous&&JSON.stringify(previous)!==JSON.stringify(record))throw new Error('EVIDENCE_IMMUTABLE_CONFLICT');
    this.evidences.set(record.id,structuredClone(record));
  }
  getEvidence(tenantId: Id, id: Id): EvidenceRecord | undefined { const x=this.evidences.get(id);return x?.tenantId===tenantId?structuredClone(x):undefined; }
  listEvidence(tenantId: Id, subjectType?: string, subjectId?: Id): EvidenceRecord[] {
    return [...this.evidences.values()].filter(x=>x.tenantId===tenantId&&(!subjectType||x.subjectType===subjectType)&&(!subjectId||x.subjectId===subjectId)).map(x=>structuredClone(x));
  }

  saveAudit(event: AuditEvent): void { this.audits.set(event.id, structuredClone(event)); }
  listAudit(tenantId: Id): AuditEvent[] { return [...this.audits.values()].filter(x => x.tenantId === tenantId).map(x => structuredClone(x)); }

  saveMeeting(meeting: MeetingSession): void { this.meetings.set(meeting.id, structuredClone(meeting)); }
  getMeeting(tenantId: Id, groupId: Id, meetingId: Id): MeetingSession | undefined {
    const x = this.meetings.get(meetingId); return x?.tenantId === tenantId && x.groupId === groupId ? structuredClone(x) : undefined;
  }
  listMeetings(tenantId: Id, groupId: Id): MeetingSession[] { return [...this.meetings.values()].filter(x => x.tenantId === tenantId && x.groupId === groupId).map(x => structuredClone(x)); }

  saveLedgerAccount(account: LedgerAccount): void { this.ledgerAccounts.set(account.id, structuredClone(account)); }
  listLedgerAccounts(tenantId: Id, groupId: Id): LedgerAccount[] { return [...this.ledgerAccounts.values()].filter(x => x.tenantId === tenantId && x.groupId === groupId).map(x => structuredClone(x)); }

  saveLedgerEntry(entry: LedgerEntry): void { this.ledgerEntries.set(entry.id, structuredClone(entry)); }
  getLedgerEntry(tenantId: Id, groupId: Id, entryId: Id): LedgerEntry | undefined {
    const x = this.ledgerEntries.get(entryId); return x?.tenantId === tenantId && x.groupId === groupId ? structuredClone(x) : undefined;
  }
  findLedgerEntryByIdempotency(tenantId: Id, groupId: Id, idempotencyKey: string): LedgerEntry | undefined {
    const x = [...this.ledgerEntries.values()].find(e => e.tenantId === tenantId && e.groupId === groupId && e.idempotencyKey === idempotencyKey);
    return x ? structuredClone(x) : undefined;
  }
  listLedgerEntries(tenantId: Id, groupId: Id): LedgerEntry[] { return [...this.ledgerEntries.values()].filter(x => x.tenantId === tenantId && x.groupId === groupId).map(x => structuredClone(x)); }

  saveContributionReceipt(receipt: ContributionReceipt): void { this.receipts.set(receipt.id, structuredClone(receipt)); }
  findContributionReceiptByIdempotency(tenantId: Id, groupId: Id, idempotencyKey: string): ContributionReceipt | undefined {
    const x = [...this.receipts.values()].find(r => r.tenantId === tenantId && r.groupId === groupId && r.idempotencyKey === idempotencyKey);
    return x ? structuredClone(x) : undefined;
  }
  listContributionReceipts(tenantId: Id, groupId: Id): ContributionReceipt[] { return [...this.receipts.values()].filter(x => x.tenantId === tenantId && x.groupId === groupId).map(x => structuredClone(x)); }

  saveCashboxReconciliation(record: CashboxReconciliationRecord): void { this.cashboxReconciliations.set(record.id, structuredClone(record)); }
  listCashboxReconciliations(tenantId: Id, groupId: Id): CashboxReconciliationRecord[] { return [...this.cashboxReconciliations.values()].filter(x => x.tenantId === tenantId && x.groupId === groupId).map(x => structuredClone(x)); }

  savePublicGroupListing(listing: PublicGroupListing): void { this.publicGroupListings.set(listing.groupId, structuredClone(listing)); }
  getPublicGroupListing(groupId: Id): PublicGroupListing | undefined { const x=this.publicGroupListings.get(groupId); return x ? structuredClone(x) : undefined; }
  listPublicGroupListings(): PublicGroupListing[] { return [...this.publicGroupListings.values()].map(x=>structuredClone(x)); }

  saveMembershipApplication(application: MembershipApplication): void { this.membershipApplications.set(application.id, structuredClone(application)); }
  getMembershipApplication(id: Id): MembershipApplication | undefined { const x=this.membershipApplications.get(id); return x ? structuredClone(x) : undefined; }
  listMembershipApplicationsForGroup(targetTenantId: Id, groupId: Id): MembershipApplication[] { return [...this.membershipApplications.values()].filter(x=>x.targetTenantId===targetTenantId&&x.groupId===groupId).map(x=>structuredClone(x)); }

  saveRubricDefinition(rubric: RubricDefinition): void { this.rubricDefinitions.set(rubric.id, structuredClone(rubric)); }
  getRubricDefinition(tenantId: Id, groupId: Id, rubricId: Id): RubricDefinition | undefined { const x=this.rubricDefinitions.get(rubricId); return x?.tenantId===tenantId&&x.groupId===groupId ? structuredClone(x) : undefined; }
  listRubricDefinitions(tenantId: Id, groupId: Id): RubricDefinition[] { return [...this.rubricDefinitions.values()].filter(x=>x.tenantId===tenantId&&x.groupId===groupId).map(x=>structuredClone(x)); }

  saveGovernanceKnowledgeClaim(claim: GovernanceKnowledgeClaim): void { this.governanceKnowledgeClaims.set(claim.id, structuredClone(claim)); }
  listGovernanceKnowledgeClaims(tenantId: Id, groupId?: Id): GovernanceKnowledgeClaim[] { return [...this.governanceKnowledgeClaims.values()].filter(x=>x.tenantId===tenantId&&(!groupId||x.groupId===groupId)).map(x=>structuredClone(x)); }
  saveWorkspaceRecord(record: WorkspaceRecord): void { this.workspaceRecords.set(record.id, structuredClone(record)); }
  insertNotificationRecord(record:WorkspaceRecord):NotificationInsertResult {
    if(!['NOTIFY.MESSAGE','NOTIFY.READ','NOTIFY.ATTEMPT'].includes(record.moduleId))throw Error('INVALID_NOTIFICATION_RECORD');
    const previous=this.workspaceRecords.get(record.id);
    if(previous){if(previous.tenantId!==record.tenantId||previous.moduleId!==record.moduleId)throw Error('NOTIFICATION_ID_CONFLICT');return {record:structuredClone(previous),inserted:false};}
    this.workspaceRecords.set(record.id,structuredClone(record));return {record:structuredClone(record),inserted:true};
  }
  insertGovernedRecord(record:WorkspaceRecord):NotificationInsertResult{
    if(!['TRUST.VERIFICATION','GOVERNANCE.VOTE.ACTION','GOVERNANCE.VOTE.BALLOT'].includes(record.moduleId)&&!(record.moduleId==='MANAGER.BUSINESS_STUDIO'&&record.tags.includes('business-experiment'))&&!(record.moduleId==='OPPORTUNITY.NEED'&&record.tags.includes('consensual-pool'))&&! (record.moduleId==='ADS.MANAGER'&&record.tags.includes('ad-pilot'))&&!(record.tags.includes('governed-productive')&&((record.moduleId==='LEARNING.MANAGER_ACADEMY'&&record.data.kind==='PRACTICE_ATTEMPT')||(record.moduleId==='LEARNING.KNOWLEDGE_BANK'&&record.data.kind==='FORUM_SOLUTION')||(record.moduleId==='MEMBERSHIP.PORTFOLIO'&&record.data.kind==='DISCOVERY_NOTEBOOK')||(record.moduleId==='MANAGER.BUSINESS_STUDIO'&&['JOB','ACQUISITION_ROOM','LAUNCH_PLAN','RESOURCE_ASSEMBLY','RESOURCE_ALLOCATION_CLAIM'].includes(String(record.data.businessKind))))))throw Error('INVALID_GOVERNED_RECORD');
    const previous=this.workspaceRecords.get(record.id);
    if(previous){if(previous.tenantId!==record.tenantId||previous.moduleId!==record.moduleId||previous.groupId!==record.groupId)throw Error('GOVERNED_RECORD_CONFLICT');return{record:structuredClone(previous),inserted:false};}
    this.workspaceRecords.set(record.id,structuredClone(record));return{record:structuredClone(record),inserted:true};
  }
  getMarketRecordById(id:Id):WorkspaceRecord|undefined{const r=this.workspaceRecords.get(id);return r?.tags.includes('market-engine')?structuredClone(r):undefined;}
  listMarketShops(actorId?:Id):WorkspaceRecord[]{return [...this.workspaceRecords.values()].filter(r=>r.tags.includes('market-engine')&&r.data.marketKind==='SHOP'&&r.data.ownerType==='PERSON'&&!r.groupId&&r.status==='ACTIVE'&&(actorId?r.createdBy===actorId||JSON.parse(String(r.data.collaboratorsJson??'[]')).some((x:{userId:string})=>x.userId===actorId):r.data.visibility==='PUBLIC')).map(r=>structuredClone(r));}
  listMarketPurchases(actorId:Id):WorkspaceRecord[]{return [...this.workspaceRecords.values()].filter(r=>r.tags.includes('market-engine')&&r.data.marketKind==='MARKET_ORDER'&&r.data.buyerUserId===actorId).map(r=>structuredClone(r));}
  getWorkspaceRecord(tenantId: Id, id: Id): WorkspaceRecord | undefined { const x=this.workspaceRecords.get(id); return x?.tenantId===tenantId?structuredClone(x):undefined; }
  listWorkspaceRecords(tenantId: Id, moduleId?: string, groupId?: Id): WorkspaceRecord[] { return [...this.workspaceRecords.values()].filter(x=>x.tenantId===tenantId&&(!moduleId||x.moduleId===moduleId)&&(!groupId||x.groupId===groupId)).map(x=>structuredClone(x)); }
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<unknown[]>;
}

interface PlatformRecordRow { data_json: string; }
type RecordScope={tenantId?:Id;groupId?:Id;assigneeId?:Id;idempotencyKey?:string};

/**
 * Pilot D1 adapter. It deliberately stores domain documents behind the existing
 * PlatformRepository port so domain services never depend on Cloudflare.
 * The generic platform_records table is a migration bridge while the schema
 * is still evolving; financial-critical persistence still needs a dedicated
 * atomic repository contract before real-money approval.
 */
const purgeScopeHash=async(tenantId:Id,groupId:Id)=>{
  const bytes=new TextEncoder().encode('eco-system-purge-v1|'+tenantId+'|'+groupId);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
const deletionHash=async(deletionId:string)=>{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('eco-system-deletion-v1|'+deletionId));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
};

export class D1PlatformRepository implements PlatformRepository {
  constructor(private readonly db:D1DatabaseLike){}
  getGroupById(id:Id){return this.byId<Group>('group',id);}
  listMembershipsForUser(userId:Id){return this.list<Membership>('membership','assignee_id=?',[userId]);}

  async commitFinancialOperation(operation:FinancialOperation):Promise<FinancialOperation>{
    const e=operation.entry;
    const scope=[e.tenantId,e.groupId,operation.kind,e.idempotencyKey];
    const statements=[this.db.prepare(`INSERT INTO financial_operations_v2
      (tenant_id,group_id,operation_kind,idempotency_key,entry_id,operation_json)
      VALUES(?,?,?,?,?,?) ON CONFLICT(tenant_id,group_id,operation_kind,idempotency_key) DO NOTHING`)
      .bind(...scope,e.id,JSON.stringify(operation))];
    const rows:Array<[string,{id:Id},string|null]>=[
      ...operation.accounts.map(a=>['ledger_account',a,null] as [string,LedgerAccount,null]),
      ['ledger_entry',e,e.idempotencyKey],['audit',operation.audit,null]
    ];
    if(operation.receipt)rows.push(['contribution_receipt',operation.receipt,e.idempotencyKey]);
    for(const record of operation.outboxRecords??[])rows.push(['workspace_record',record,null]);
    for(const [type,value,key] of rows){
      statements.push(this.db.prepare(`INSERT INTO platform_records
        (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
        SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM financial_operations_v2
          WHERE tenant_id=? AND group_id=? AND operation_kind=? AND idempotency_key=? AND entry_id=?)
        ON CONFLICT(record_type,record_id) DO NOTHING`)
        .bind(type,value.id,e.tenantId,e.groupId,null,key,JSON.stringify(value),e.createdAt,...scope,e.id));
    }
    // D1 batch is transactional: the receipt, entry, accounts and audit either all
    // commit or all roll back. The unique operation key arbitrates competing requests.
    await this.db.batch(statements);
    const winner=await this.db.prepare(`SELECT operation_json FROM financial_operations_v2
      WHERE tenant_id=? AND group_id=? AND operation_kind=? AND idempotency_key=?`)
      .bind(...scope).first<{operation_json:string}>();
    if(!winner)throw new Error('FINANCIAL_COMMIT_NOT_CONFIRMED');
    return JSON.parse(winner.operation_json) as FinancialOperation;
  }

  async commitFinancialCorrection(plan:FinancialCorrectionPlan):Promise<FinancialCorrectionPlan>{
    const c=plan.cellRevision,at=plan.entries.at(-1)?.createdAt??new Date().toISOString();
    const key=[plan.tenantId,plan.groupId,c.meetingId,c.membershipId,c.rubricId,c.currency];
    const cas=c.expectedVersion===0
      ? this.db.prepare(`INSERT INTO financial_cell_revisions
          (tenant_id,group_id,meeting_id,membership_id,rubric_id,currency,version,last_operation_id,updated_at)
          VALUES(?,?,?,?,?,?,?,?,?)
          ON CONFLICT(tenant_id,group_id,meeting_id,membership_id,rubric_id,currency)
          DO UPDATE SET version=excluded.version,last_operation_id=excluded.last_operation_id,updated_at=excluded.updated_at
          WHERE financial_cell_revisions.version=0`)
          .bind(...key,c.nextVersion,plan.operationId,at)
      : this.db.prepare(`UPDATE financial_cell_revisions
          SET version=?,last_operation_id=?,updated_at=?
          WHERE tenant_id=? AND group_id=? AND meeting_id=? AND membership_id=? AND rubric_id=? AND currency=? AND version=?`)
          .bind(c.nextVersion,plan.operationId,at,...key,c.expectedVersion);
    const operation=this.db.prepare(`INSERT INTO financial_correction_operations
      (tenant_id,group_id,idempotency_key,operation_id,primary_entry_id,operation_json,created_at)
      SELECT ?,?,?,?,?,?,? WHERE EXISTS (
        SELECT 1 FROM financial_cell_revisions WHERE tenant_id=? AND group_id=? AND meeting_id=? AND membership_id=? AND rubric_id=? AND currency=? AND version=? AND last_operation_id=?
      ) ON CONFLICT(tenant_id,group_id,idempotency_key) DO NOTHING`)
      .bind(plan.tenantId,plan.groupId,plan.idempotencyKey,plan.operationId,plan.primaryEntryId,JSON.stringify(plan),at,...key,c.nextVersion,plan.operationId);
    const statements:D1PreparedStatementLike[]=[cas,operation];
    // If the CAS lost and this is not an idempotent replay, the scalar subquery
    // is NULL and the NOT NULL guard aborts the whole D1 batch.
    statements.push(this.db.prepare(`INSERT INTO financial_correction_commit_guards
      (tenant_id,group_id,idempotency_key,operation_id,created_at)
      VALUES(?,?,?,(SELECT operation_id FROM financial_correction_operations WHERE tenant_id=? AND group_id=? AND idempotency_key=?),?)
      ON CONFLICT(tenant_id,group_id,idempotency_key) DO NOTHING`)
      .bind(plan.tenantId,plan.groupId,plan.idempotencyKey,plan.tenantId,plan.groupId,plan.idempotencyKey,at));
    const rows:Array<[string,{id:Id},string|null,string]>=[
      ...plan.accounts.map(a=>['ledger_account',a,null,at] as [string,LedgerAccount,null,string]),
      ...plan.entries.map(e=>['ledger_entry',e,e.idempotencyKey,e.createdAt] as [string,LedgerEntry,string,string]),
      ...plan.audits.map(a=>['audit',a,null,a.at] as [string,AuditEvent,null,string])
    ];
    if(plan.receipt)rows.push(['contribution_receipt',plan.receipt,plan.receipt.idempotencyKey,plan.receipt.receivedAt]);
    for(const record of plan.outboxRecords??[])rows.push(['workspace_record',record,null,record.updatedAt]);
    for(const [type,value,idempotency,updatedAt] of rows){
      statements.push(this.db.prepare(`INSERT INTO platform_records
        (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
        SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (
          SELECT 1 FROM financial_correction_operations
          WHERE tenant_id=? AND group_id=? AND idempotency_key=? AND operation_id=? AND primary_entry_id=?
        ) ON CONFLICT(record_type,record_id) ${type==='workspace_record'&&value.id.startsWith('cell_order_v2_')?'DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at':'DO NOTHING'}`)
        .bind(type,value.id,plan.tenantId,plan.groupId,null,idempotency,JSON.stringify(value),updatedAt,plan.tenantId,plan.groupId,plan.idempotencyKey,plan.operationId,plan.primaryEntryId));
    }
    try{await this.db.batch(statements);}catch(error){
      const current=await this.getFinancialCellRevision(plan.tenantId,plan.groupId,c.meetingId,c.membershipId,c.rubricId,c.currency);
      if((current?.version??0)!==c.expectedVersion)throw new Error('CELL_VERSION_CONFLICT',{cause:error});
      throw error;
    }
    const winner=await this.db.prepare(`SELECT operation_json FROM financial_correction_operations
      WHERE tenant_id=? AND group_id=? AND idempotency_key=?`).bind(plan.tenantId,plan.groupId,plan.idempotencyKey).first<{operation_json:string}>();
    if(!winner)throw new Error('FINANCIAL_CORRECTION_COMMIT_NOT_CONFIRMED');
    const stored=JSON.parse(winner.operation_json) as FinancialCorrectionPlan;
    if(stored.intentFingerprint!==plan.intentFingerprint)throw new Error('IDEMPOTENCY_CONFLICT');
    return stored;
  }

  async commitFinancialCellStamp(plan:FinancialCellStampPlan):Promise<FinancialCellStampPlan>{
    if(plan.nextVersion!==plan.expectedVersion+1)throw Error('INVALID_CELL_VERSION');
    const key=[plan.tenantId,plan.groupId,plan.meetingId,plan.membershipId,plan.rubricId,plan.currency];
    const cas=plan.expectedVersion===0?
      this.db.prepare(`INSERT INTO financial_cell_revisions
        (tenant_id,group_id,meeting_id,membership_id,rubric_id,currency,version,last_operation_id,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?)
        ON CONFLICT(tenant_id,group_id,meeting_id,membership_id,rubric_id,currency)
        DO UPDATE SET version=excluded.version,last_operation_id=excluded.last_operation_id,updated_at=excluded.updated_at
        WHERE financial_cell_revisions.version=0`)
        .bind(...key,plan.nextVersion,plan.operationId,plan.createdAt):
      this.db.prepare(`UPDATE financial_cell_revisions
        SET version=?,last_operation_id=?,updated_at=?
        WHERE tenant_id=? AND group_id=? AND meeting_id=? AND membership_id=? AND rubric_id=? AND currency=? AND version=?`)
        .bind(plan.nextVersion,plan.operationId,plan.createdAt,...key,plan.expectedVersion);
    // The operation ID is selected from the exact newly committed CAS row.
    // Null violates record_id NOT NULL, aborting the full D1 batch on a race.
    const guard=this.db.prepare(`INSERT INTO platform_records
      (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
      VALUES('financial_cell_stamp_guard',(
        SELECT last_operation_id FROM financial_cell_revisions
        WHERE tenant_id=? AND group_id=? AND meeting_id=? AND membership_id=? AND rubric_id=? AND currency=?
          AND version=? AND last_operation_id=?
      ),?,?,NULL,?,?,?)`)
      .bind(...key,plan.nextVersion,plan.operationId,plan.tenantId,plan.groupId,
        plan.operationId,JSON.stringify({operationId:plan.operationId}),plan.createdAt);
    const statements:D1PreparedStatementLike[]=[cas,guard];
    for(const record of plan.records){
      const update=record.moduleId==='FINANCE.CELL_ORDER_V2';
      statements.push(this.db.prepare(`INSERT INTO platform_records
        (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
        SELECT 'workspace_record',?,?,?,?,?,?,?
          WHERE EXISTS (SELECT 1 FROM platform_records WHERE record_type='financial_cell_stamp_guard'
            AND record_id=? AND tenant_id=? AND group_id=?)
        ON CONFLICT(record_type,record_id) ${update?'DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at':'DO NOTHING'}`)
        .bind(record.id,plan.tenantId,plan.groupId,null,null,JSON.stringify(record),
          record.updatedAt,plan.operationId,plan.tenantId,plan.groupId));
    }
    statements.push(this.db.prepare(`INSERT INTO platform_records
      (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
      SELECT 'audit',?,?,?,?,?,?,? WHERE EXISTS (
        SELECT 1 FROM platform_records WHERE record_type='financial_cell_stamp_guard'
          AND record_id=? AND tenant_id=? AND group_id=?)`)
      .bind(plan.audit.id,plan.tenantId,plan.groupId,null,null,
        JSON.stringify(plan.audit),plan.audit.at,plan.operationId,plan.tenantId,plan.groupId));
    try{await this.db.batch(statements);}catch(error){
      const current=await this.getFinancialCellRevision(...key as [Id,Id,Id,Id,Id,string]);
      if((current?.version??0)!==plan.expectedVersion)throw Error('CELL_VERSION_CONFLICT',{cause:error});
      throw error;
    }
    const updated=await this.getFinancialCellRevision(...key as [Id,Id,Id,Id,Id,string]);
    if(updated?.lastOperationId!==plan.operationId||updated.version!==plan.nextVersion)throw Error('FINANCIAL_STAMP_NOT_COMMITTED');
    return plan;
  }

  commitWorkspaceRecordRevision(record:WorkspaceRecord,expectedVersion:number){return this.commitMarketRecordMutation({record,expectedVersion});}
  async commitMarketRecordMutation(plan:MarketRecordMutationPlan):Promise<WorkspaceRecord>{
    validateCreatedStock(plan);
    const r=plan.record,m=plan.movement;
    if(Number(r.data.version)!==plan.expectedVersion+1||m&&(m.tenantId!==r.tenantId||m.subjectId!==r.id||m.data.groupId!==r.groupId||String(m.data.marketScopeId??m.data.groupId??'')!==marketScope(r)))throw Error('MARKET_ORDER_PLAN_INVALID');
    const update=this.db.prepare(`UPDATE platform_records SET data_json=?,updated_at=? WHERE record_type='workspace_record' AND record_id=? AND tenant_id=? AND group_id IS ? AND COALESCE(CAST(json_extract(data_json,'$.data.version') AS INTEGER),1)=?`).bind(JSON.stringify(r),r.updatedAt,r.id,r.tenantId,r.groupId??null,plan.expectedVersion);
    if(!m){const result=await update.run() as {changes?:number|bigint;meta?:{changes?:number}};if(Number(result.meta?.changes??result.changes)!==1)throw Error('MARKET_RECORD_CONFLICT');return r;}
    // The NOT NULL scalar guard makes a stale update abort the whole D1 batch.
    const guard=this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at) VALUES('market_mutation_guard',?,?,?,?,?,(SELECT json_object('operationId',?) FROM platform_records WHERE record_type='workspace_record' AND record_id=? AND tenant_id=? AND group_id IS ? AND json_extract(data_json,'$.data.lastMarketOperationId')=?),?)`).bind(m.id,r.tenantId,r.groupId??null,null,m.id,m.id,r.id,r.tenantId,r.groupId??null,m.id,r.updatedAt);
    const evidence=this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at) VALUES('evidence',?,?,?,?,?,?,?)`).bind(m.id,r.tenantId,r.groupId??null,null,m.id,JSON.stringify(m),m.createdAt);
    const statements=[update,guard,evidence];
    if(plan.createdStock){const x=plan.createdStock,e=plan.createdMovement!;
      statements.push(this.db.prepare("INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at) VALUES('workspace_record',?,?,?,?,NULL,?,?)").bind(x.id,x.tenantId,x.groupId??null,x.createdBy,JSON.stringify(x),x.updatedAt));
      statements.push(this.db.prepare("INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at) VALUES('evidence',?,?,?,?,?,?,?)").bind(e.id,e.tenantId,x.groupId??null,null,e.id,JSON.stringify(e),e.createdAt));
    }
    try{await this.db.batch(statements);}catch(error){const current=await this.getWorkspaceRecord(r.tenantId,r.id);if(Number(current?.data.version??1)!==plan.expectedVersion)throw Error('MARKET_RECORD_CONFLICT',{cause:error});throw error;}
    return r;
  }

  async commitMarketOrderTransition(plan:MarketOrderTransitionPlan):Promise<{stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord}>{
    if(plan.stock.tenantId!==plan.tenantId||plan.order.tenantId!==plan.tenantId||plan.stock.groupId!==plan.groupId||plan.order.groupId!==plan.groupId||plan.movement.tenantId!==plan.tenantId||plan.movement.subjectId!==plan.stock.id||plan.movement.data.sourceId!==plan.order.id||plan.stock.data.lastMarketOperationId!==plan.operationId||plan.order.data.lastMarketOperationId!==plan.operationId||marketScope(plan.stock)!==marketScope(plan.order))throw Error('MARKET_ORDER_PLAN_INVALID');
    const update=(record:WorkspaceRecord,version:number)=>this.db.prepare(`UPDATE platform_records SET data_json=?,updated_at=?
      WHERE record_type='workspace_record' AND record_id=? AND tenant_id=? AND group_id IS ? AND COALESCE(CAST(json_extract(data_json,'$.data.version') AS INTEGER),1)=?`)
      .bind(JSON.stringify(record),record.updatedAt,record.id,plan.tenantId,plan.groupId??null,version);
    const guard=this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
      VALUES('market_transition_guard',?,?,?,?,?,(SELECT json_object('operationId',?) FROM platform_records s JOIN platform_records o ON o.tenant_id=s.tenant_id AND o.group_id IS s.group_id
      WHERE s.record_type='workspace_record' AND s.record_id=? AND o.record_type='workspace_record' AND o.record_id=? AND s.tenant_id=? AND s.group_id IS ?
      AND json_extract(s.data_json,'$.data.lastMarketOperationId')=? AND json_extract(o.data_json,'$.data.lastMarketOperationId')=? LIMIT 1),?)`)
      .bind(plan.operationId,plan.tenantId,plan.groupId??null,null,plan.operationId,plan.operationId,plan.stock.id,plan.order.id,plan.tenantId,plan.groupId??null,plan.operationId,plan.operationId,plan.order.updatedAt);
    const evidence=this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at) VALUES('evidence',?,?,?,?,?,?,?)`)
      .bind(plan.movement.id,plan.tenantId,plan.groupId??null,null,plan.operationId,JSON.stringify(plan.movement),plan.movement.createdAt);
    try{await this.db.batch([update(plan.stock,plan.expectedStockVersion),update(plan.order,plan.expectedOrderVersion),guard,evidence]);}
    catch(error){
      const [prior,stock,order]=await Promise.all([this.getEvidence(plan.tenantId,plan.movement.id),this.getWorkspaceRecord(plan.tenantId,plan.stock.id),this.getWorkspaceRecord(plan.tenantId,plan.order.id)]);
      if(prior){if(prior.type!=='MARKET_STOCK_MOVEMENT'||prior.data.requestFingerprint!==plan.movement.data.requestFingerprint)throw Error('MARKET_IDEMPOTENCY_CONFLICT');if(stock&&order)return{stock,order,movement:prior};}
      if(Number(stock?.data.version??1)!==plan.expectedStockVersion||Number(order?.data.version??1)!==plan.expectedOrderVersion)throw new Error('MARKET_ORDER_CONFLICT',{cause:error});throw error;
    }
    return{stock:plan.stock,order:plan.order,movement:plan.movement};
  }

  async commitMarketStockReservation(plan:MarketStockReservationPlan):Promise<{stock:WorkspaceRecord;order:WorkspaceRecord;movement:EvidenceRecord}>{
    if(marketScope(plan.stock)!==marketScope(plan.order))throw Error('MARKET_ORDER_PLAN_INVALID');
    const updatedAt=plan.stock.updatedAt;
    const stockUpdate=this.db.prepare(`UPDATE platform_records
      SET data_json=?,updated_at=?
      WHERE record_type='workspace_record' AND record_id=? AND tenant_id=? AND group_id IS ?
        AND CAST(json_extract(data_json,'$.data.version') AS INTEGER)=?
        AND (CAST(json_extract(data_json,'$.data.quantity') AS INTEGER)-CAST(json_extract(data_json,'$.data.reserved') AS INTEGER)-COALESCE(CAST(json_extract(data_json,'$.data.quarantine') AS INTEGER),0))>=?`)
      .bind(JSON.stringify(plan.stock),updatedAt,plan.stock.id,plan.tenantId,plan.groupId??null,plan.expectedVersion,plan.reservationQuantity);
    const guard=this.db.prepare(`INSERT INTO platform_records
      (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
      VALUES('market_reservation_guard',?,?,?,?,?,(
        SELECT json_object('operationId',?) FROM platform_records
        WHERE record_type='workspace_record' AND record_id=? AND tenant_id=? AND group_id IS ?
          AND json_extract(data_json,'$.data.lastReservationOperationId')=?
        LIMIT 1
      ),?)`)
      .bind(plan.operationId,plan.tenantId,plan.groupId??null,null,plan.operationId,plan.operationId,plan.stock.id,plan.tenantId,plan.groupId??null,plan.operationId,updatedAt);
    const orderInsert=this.db.prepare(`INSERT INTO platform_records
      (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
      SELECT 'workspace_record',?,?,?,?,?,?,? WHERE EXISTS (
        SELECT 1 FROM platform_records WHERE record_type='market_reservation_guard' AND record_id=? AND tenant_id=? AND group_id IS ?
      )`)
      .bind(plan.order.id,plan.tenantId,plan.groupId??null,plan.order.createdBy,plan.operationId,JSON.stringify(plan.order),plan.order.updatedAt,plan.operationId,plan.tenantId,plan.groupId??null);
    const evidenceInsert=this.db.prepare(`INSERT INTO platform_records
      (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
      SELECT 'evidence',?,?,?,?,?,?,? WHERE EXISTS (
        SELECT 1 FROM platform_records WHERE record_type='market_reservation_guard' AND record_id=? AND tenant_id=? AND group_id IS ?
      )`)
      .bind(plan.movement.id,plan.tenantId,plan.groupId??null,null,plan.operationId,JSON.stringify(plan.movement),plan.movement.createdAt,plan.operationId,plan.tenantId,plan.groupId??null);
    try{await this.db.batch([stockUpdate,guard,orderInsert,evidenceInsert]);}catch(error){
      const current=await this.getWorkspaceRecord(plan.tenantId,plan.stock.id),version=Number(current?.data.version??0);
      if(version!==Number(plan.stock.data.version??0)||String(current?.data.lastReservationOperationId??'')!==plan.operationId)throw new Error('MARKET_STOCK_RESERVATION_CONFLICT',{cause:error});
      throw error;
    }
    const [stock,order,movement]=await Promise.all([
      this.getWorkspaceRecord(plan.tenantId,plan.stock.id),
      this.getWorkspaceRecord(plan.tenantId,plan.order.id),
      this.getEvidence(plan.tenantId,plan.movement.id)
    ]);
    if(!stock||!order||!movement)throw new Error('MARKET_STOCK_RESERVATION_NOT_CONFIRMED');
    return{stock,order,movement};
  }

  async getFinancialCellRevision(tenantId:Id,groupId:Id,meetingId:Id,membershipId:Id,rubricId:Id,currency:string):Promise<FinancialCellRevision|undefined>{
    const row=await this.db.prepare(`SELECT tenant_id,group_id,meeting_id,membership_id,rubric_id,currency,version,last_operation_id,updated_at
      FROM financial_cell_revisions WHERE tenant_id=? AND group_id=? AND meeting_id=? AND membership_id=? AND rubric_id=? AND currency=?`)
      .bind(tenantId,groupId,meetingId,membershipId,rubricId,currency)
      .first<{tenant_id:string;group_id:string;meeting_id:string;membership_id:string;rubric_id:string;currency:string;version:number;last_operation_id:string;updated_at:string}>();
    return row?{tenantId:row.tenant_id,groupId:row.group_id,meetingId:row.meeting_id,membershipId:row.membership_id,rubricId:row.rubric_id,currency:row.currency,version:Number(row.version),lastOperationId:row.last_operation_id,updatedAt:row.updated_at}:undefined;
  }
  async listFinancialCellRevisions(tenantId:Id,groupId:Id):Promise<FinancialCellRevision[]>{
    const rows=await this.db.prepare(`SELECT tenant_id,group_id,meeting_id,membership_id,rubric_id,currency,version,last_operation_id,updated_at
      FROM financial_cell_revisions WHERE tenant_id=? AND group_id=?`).bind(tenantId,groupId)
      .all<{tenant_id:string;group_id:string;meeting_id:string;membership_id:string;rubric_id:string;currency:string;version:number;last_operation_id:string;updated_at:string}>();
    return rows.results.map(row=>({tenantId:row.tenant_id,groupId:row.group_id,meetingId:row.meeting_id,membershipId:row.membership_id,rubricId:row.rubric_id,currency:row.currency,version:Number(row.version),lastOperationId:row.last_operation_id,updatedAt:row.updated_at}));
  }

  async commitTrashLifecycle(plan:TrashLifecyclePlan):Promise<TrashLifecyclePlan>{
    const entity=plan.entity as any,scopeGroup=plan.entityRecordType==='group'?entity.id:entity.groupId;
    const statements=[
      this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
        VALUES(?,?,?,?,?,?,?,?)
        ON CONFLICT(record_type,record_id) DO UPDATE SET tenant_id=excluded.tenant_id,group_id=excluded.group_id,assignee_id=excluded.assignee_id,idempotency_key=excluded.idempotency_key,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(plan.entityRecordType,entity.id,entity.tenantId,scopeGroup,plan.entityRecordType==='membership'?entity.userId:null,null,JSON.stringify(entity),new Date().toISOString()),
      this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
        VALUES('workspace_record',?,?,?,?,?,?,?)
        ON CONFLICT(record_type,record_id) DO UPDATE SET tenant_id=excluded.tenant_id,group_id=excluded.group_id,assignee_id=excluded.assignee_id,idempotency_key=excluded.idempotency_key,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(plan.trashRecord.id,plan.trashRecord.tenantId,plan.trashRecord.groupId??null,plan.trashRecord.createdBy,null,JSON.stringify(plan.trashRecord),plan.trashRecord.updatedAt),
      this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
        VALUES('audit',?,?,?,?,?,?,?)
        ON CONFLICT(record_type,record_id) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(plan.audit.id,plan.audit.tenantId,null,plan.audit.actorId??null,null,JSON.stringify(plan.audit),plan.audit.at)
    ];
    await this.db.batch(statements);return structuredClone(plan);
  }
  async listTrashMaintenanceItems():Promise<WorkspaceRecord[]>{
    const rows=await this.db.prepare(`SELECT data_json FROM platform_records WHERE record_type='workspace_record' AND json_extract(data_json,'$.moduleId') IN ('TRASH.ITEM','TRASH.ARTIFACT_CLEANUP')`).all<PlatformRecordRow>();
    return rows.results.map(r=>JSON.parse(r.data_json) as WorkspaceRecord);
  }

  async captureGroupPurgeManifest(tenantId:Id,groupId:Id):Promise<GroupPurgeManifest>{
    const modern=await this.db.prepare('SELECT record_id,data_json FROM platform_records WHERE tenant_id=? AND group_id=?').bind(tenantId,groupId).all<{record_id:string;data_json:string}>();
    const legacy=await this.db.prepare(`
      SELECT id FROM tenant_group WHERE tenant_id=? AND id=?
      UNION SELECT id FROM membership WHERE tenant_id=? AND group_id=?
      UNION SELECT id FROM mandate WHERE tenant_id=? AND group_id=?
      UNION SELECT id FROM obligation WHERE tenant_id=? AND group_id=?
      UNION SELECT id FROM case_record WHERE tenant_id=? AND group_id=?
      UNION SELECT id FROM meeting_session WHERE tenant_id=? AND group_id=?
      UNION SELECT id FROM ledger_account WHERE tenant_id=? AND group_id=?
      UNION SELECT id FROM ledger_entry WHERE tenant_id=? AND group_id=?
      UNION SELECT id FROM contribution_receipt WHERE tenant_id=? AND group_id=?
      UNION SELECT id FROM cashbox_reconciliation WHERE tenant_id=? AND group_id=?`)
      .bind(tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId)
      .all<{id:string}>();
    const ids=new Set<string>([groupId,...modern.results.map(x=>x.record_id),...legacy.results.map(x=>x.id)]),artifacts=new Set<string>();
    const collect=(value:unknown)=>{
      if(typeof value==='string'&&value.includes('/'+tenantId+'/'+groupId+'/'))artifacts.add(value);
      else if(Array.isArray(value))for(const x of value)collect(x);
      else if(value&&typeof value==='object')for(const x of Object.values(value as Record<string,unknown>))collect(x);
    };
    for(const row of modern.results){try{collect(JSON.parse(row.data_json));}catch{}}
    return{tenantId,groupId,entityIds:[...ids],artifactKeys:[...artifacts]};
  }

  async purgeGroupData(manifest:GroupPurgeManifest,deletionId:string,purgedAt:string):Promise<GroupPurgeResult>{
    const {tenantId,groupId}=manifest,scopeHash=await purgeScopeHash(tenantId,groupId),dHash=await deletionHash(deletionId),cleanupId='trash_artifact_cleanup_'+scopeHash;
    const cleanup:WorkspaceRecord={id:cleanupId,tenantId,moduleId:'TRASH.ARTIFACT_CLEANUP',title:'Nettoyage de pièces après purge',status:manifest.artifactKeys.length?'ACTIVE':'DONE',tags:['trash','artifact-cleanup'],data:{artifactKeysJson:JSON.stringify(manifest.artifactKeys),completedKeysJson:'[]',lastError:null,purgeScopeHash:scopeHash,purgedAt},createdBy:'system_trash_maintenance',createdAt:purgedAt,updatedAt:purgedAt};
    const q=(sql:string,...values:unknown[])=>this.db.prepare(sql).bind(...values);
    const statements:D1PreparedStatementLike[]=[
      // Arbitration happens inside the same D1 batch as deletion. If the final
      // qualifying petition signature already exists, the scalar subquery is
      // NULL, the NOT NULL guard fails, and the entire purge is rolled back.
      q(`INSERT INTO group_purge_execution_guards(scope_hash,allowed,created_at)
         VALUES(?,(SELECT 1 FROM platform_records trash
           WHERE trash.record_type='workspace_record' AND trash.record_id=?
             AND json_extract(trash.data_json,'$.moduleId')='TRASH.ITEM'
             AND (
               CAST(COALESCE(json_extract(trash.data_json,'$.data.petitionThreshold'),0) AS INTEGER)=0
               OR (SELECT COUNT(*) FROM platform_records sig
                   WHERE sig.record_type='workspace_record' AND sig.tenant_id=? AND sig.group_id=?
                     AND json_extract(sig.data_json,'$.moduleId')='TRASH.PETITION_SIGNATURE'
                     AND json_extract(sig.data_json,'$.status')!='ARCHIVED'
                     AND json_extract(sig.data_json,'$.data.trashId')=?)
                  < CAST(COALESCE(json_extract(trash.data_json,'$.data.petitionThreshold'),0) AS INTEGER)
             )
         ),?)
         ON CONFLICT(scope_hash) DO UPDATE SET allowed=excluded.allowed,created_at=excluded.created_at`,
         scopeHash,deletionId,tenantId,groupId,deletionId,purgedAt),
      q(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
         VALUES('workspace_record',?,?,NULL,NULL,NULL,?,?)
         ON CONFLICT(record_type,record_id) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at`,cleanupId,tenantId,JSON.stringify(cleanup),purgedAt),
      // Remove non-group-scoped audit/evidence while the entity graph is still queryable.
      q(`DELETE FROM platform_records WHERE tenant_id=? AND record_type IN ('audit','evidence') AND (
          json_extract(data_json,'$.targetId')=? OR json_extract(data_json,'$.subjectId')=? OR
          json_extract(data_json,'$.targetId') IN (SELECT record_id FROM platform_records WHERE tenant_id=? AND group_id=?) OR
          json_extract(data_json,'$.subjectId') IN (SELECT record_id FROM platform_records WHERE tenant_id=? AND group_id=?)
        )`,tenantId,groupId,groupId,tenantId,groupId,tenantId,groupId),
      q(`DELETE FROM audit_event WHERE tenant_id=? AND (
          target_id=? OR target_id IN (SELECT id FROM membership WHERE tenant_id=? AND group_id=?) OR
          target_id IN (SELECT id FROM meeting_session WHERE tenant_id=? AND group_id=?) OR
          target_id IN (SELECT id FROM ledger_entry WHERE tenant_id=? AND group_id=?) OR
          target_id IN (SELECT id FROM contribution_receipt WHERE tenant_id=? AND group_id=?)
        )`,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId),
      q(`DELETE FROM evidence_record WHERE tenant_id=? AND (
          subject_id=? OR subject_id IN (SELECT id FROM membership WHERE tenant_id=? AND group_id=?) OR
          subject_id IN (SELECT id FROM meeting_session WHERE tenant_id=? AND group_id=?) OR
          subject_id IN (SELECT id FROM ledger_entry WHERE tenant_id=? AND group_id=?)
        )`,tenantId,groupId,tenantId,groupId,tenantId,groupId,tenantId,groupId),
      q('DELETE FROM community_reactions WHERE message_id IN (SELECT id FROM community_messages WHERE tenant_id=? AND group_id=?)',tenantId,groupId),
      q('DELETE FROM community_user_state WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM community_messages WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM historical_identity_hints WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM historical_pairing_requests WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM group_join_links WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM commercial_preference_tokens WHERE group_id=?',groupId),
      q('DELETE FROM commercial_preference_consents WHERE group_id=?',groupId),
      q('DELETE FROM engagement_events WHERE group_id=?',groupId),
      q(`DELETE FROM founder_control_items WHERE json_extract(data_json,'$.groupId')=? OR item_key=?`,groupId,groupId),
      q('DELETE FROM financial_correction_commit_guards WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM financial_correction_operations WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM financial_cell_revisions WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM financial_operations_v2 WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM financial_operations WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM platform_records WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      // Legacy normalized tables may still contain historical rows from pre-platform_records releases.
      q('DELETE FROM contribution_receipt WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM cashbox_reconciliation WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM ledger_line WHERE entry_id IN (SELECT id FROM ledger_entry WHERE tenant_id=? AND group_id=?)',tenantId,groupId),
      q('DELETE FROM ledger_entry WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM ledger_account WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM meeting_session WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM mandate WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM obligation WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM case_record WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM membership WHERE tenant_id=? AND group_id=?',tenantId,groupId),
      q('DELETE FROM tenant_group WHERE tenant_id=? AND id=?',tenantId,groupId),
      q('DELETE FROM group_purge_execution_guards WHERE scope_hash=?',scopeHash),
      q(`INSERT INTO purged_group_tombstones(scope_hash,purged_at,deletion_hash,purge_policy_version)
         VALUES(?,?,?,'PURGE_V1_COMPLETE_BUSINESS_DATA')
         ON CONFLICT(scope_hash) DO UPDATE SET purged_at=excluded.purged_at,deletion_hash=excluded.deletion_hash,purge_policy_version=excluded.purge_policy_version`,scopeHash,purgedAt,dHash)
    ];
    await this.db.batch(statements);
    return{purged:true,scopeHash,purgedAt,artifactCleanupTaskId:cleanupId,artifactsPending:manifest.artifactKeys.length};
  }

  async isGroupPurged(tenantId:Id,groupId:Id):Promise<boolean>{
    const scopeHash=await purgeScopeHash(tenantId,groupId);
    return Boolean(await this.db.prepare('SELECT scope_hash FROM purged_group_tombstones WHERE scope_hash=? LIMIT 1').bind(scopeHash).first<{scope_hash:string}>());
  }

  private async saveRecord<T extends {id:Id}>(type:string,value:T,scope:RecordScope={}):Promise<void>{
    const sql=`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
      VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT(record_type,record_id) DO UPDATE SET tenant_id=excluded.tenant_id,group_id=excluded.group_id,assignee_id=excluded.assignee_id,idempotency_key=excluded.idempotency_key,data_json=excluded.data_json,updated_at=excluded.updated_at`;
    await this.db.prepare(sql).bind(type,value.id,scope.tenantId??null,scope.groupId??null,scope.assigneeId??null,scope.idempotencyKey??null,JSON.stringify(value),new Date().toISOString()).run();
  }
  private parse<T>(row:PlatformRecordRow|null):T|undefined{if(!row)return undefined;return JSON.parse(row.data_json) as T;}
  private async byId<T>(type:string,id:Id):Promise<T|undefined>{return this.parse<T>(await this.db.prepare('SELECT data_json FROM platform_records WHERE record_type=? AND record_id=? LIMIT 1').bind(type,id).first<PlatformRecordRow>());}
  private async list<T>(type:string,where:string='',values:unknown[]=[]):Promise<T[]>{const suffix=where?` AND ${where}`:'';const rows=await this.db.prepare(`SELECT data_json FROM platform_records WHERE record_type=?${suffix}`).bind(type,...values).all<PlatformRecordRow>();return rows.results.map(r=>JSON.parse(r.data_json) as T);}

  saveUser(x:User){return this.saveRecord('user',x);} getUser(id:Id){return this.byId<User>('user',id);}
  saveProject(x:GroupProject){return this.saveRecord('project',x,{tenantId:x.tenantId});}
  async getProject(t:Id,id:Id){const x=await this.byId<GroupProject>('project',id);return x?.tenantId===t?x:undefined;}
  saveGroup(x:Group){return this.saveRecord('group',x,{tenantId:x.tenantId,groupId:x.id});}
  async getGroup(t:Id,id:Id){const x=await this.byId<Group>('group',id);return x?.tenantId===t?x:undefined;}
  listGroups(t:Id){return this.list<Group>('group','tenant_id=?',[t]);}
  saveMembership(x:Membership){return this.saveRecord('membership',x,{tenantId:x.tenantId,groupId:x.groupId,assigneeId:x.userId});}
  async getMembership(t:Id,g:Id,id:Id){const x=await this.byId<Membership>('membership',id);return x?.tenantId===t&&x.groupId===g?x:undefined;}
  listMemberships(t:Id,g:Id){return this.list<Membership>('membership','tenant_id=? AND group_id=?',[t,g]);}
  saveObligation(x:Obligation){return this.saveRecord('obligation',x,{tenantId:x.tenantId,groupId:x.groupId,assigneeId:x.assigneeId});}
  listObligations(t:Id,a?:Id){return this.list<Obligation>('obligation',a?'tenant_id=? AND assignee_id=?':'tenant_id=?',a?[t,a]:[t]);}
  saveCase(x:CaseRecord){return this.saveRecord('case',x,{tenantId:x.tenantId,groupId:x.groupId,assigneeId:x.openedBy});}
  getCaseById(id:Id){return this.byId<CaseRecord>('case',id);}
  listCareCasesForActor(actorId:Id){return this.list<CaseRecord>('case',"(assignee_id=? OR EXISTS (SELECT 1 FROM json_each(data_json,'$.care.participantIds') AS p WHERE p.value=?))",[actorId,actorId]);}
  async saveCaseRevision(x:CaseRecord,expectedRevision:number|null){
    const result=expectedRevision===null
      ?await this.db.prepare("INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,data_json,updated_at) VALUES('case',?,?,?,?,?,?) ON CONFLICT(record_type,record_id) DO NOTHING").bind(x.id,x.tenantId,x.groupId??null,x.openedBy,JSON.stringify(x),new Date().toISOString()).run()
      :await this.db.prepare("UPDATE platform_records SET data_json=?,updated_at=? WHERE record_type='case' AND record_id=? AND tenant_id=? AND assignee_id=? AND COALESCE(json_extract(data_json,'$.care.revision'),0)=?").bind(JSON.stringify(x),new Date().toISOString(),x.id,x.tenantId,x.openedBy,expectedRevision).run();
    const changes=result as {meta?:{changes?:number};changes?:number};return Number(changes.meta?.changes??changes.changes??0)===1;
  }
  listCases(t:Id,o?:Id){return this.list<CaseRecord>('case',o?'tenant_id=? AND assignee_id=?':'tenant_id=?',o?[t,o]:[t]);}
  async saveEvidence(x:EvidenceRecord){
    const previous=await this.byId<EvidenceRecord>('evidence',x.id);
    if(previous&&JSON.stringify(previous)!==JSON.stringify(x))throw new Error('EVIDENCE_IMMUTABLE_CONFLICT');
    if(!previous)await this.saveRecord('evidence',x,{tenantId:x.tenantId});
  }
  async getEvidence(t:Id,id:Id){const x=await this.byId<EvidenceRecord>('evidence',id);return x?.tenantId===t?x:undefined;}
  async listEvidence(t:Id,subjectType?:string,subjectId?:Id){
    const rows=await this.list<EvidenceRecord>('evidence','tenant_id=?',[t]);
    return rows.filter(x=>(!subjectType||x.subjectType===subjectType)&&(!subjectId||x.subjectId===subjectId));
  }
  saveAudit(x:AuditEvent){return this.saveRecord('audit',x,{tenantId:x.tenantId});}
  listAudit(t:Id){return this.list<AuditEvent>('audit','tenant_id=?',[t]);}
  saveMeeting(x:MeetingSession){return this.saveRecord('meeting',x,{tenantId:x.tenantId,groupId:x.groupId});}
  async getMeeting(t:Id,g:Id,id:Id){const x=await this.byId<MeetingSession>('meeting',id);return x?.tenantId===t&&x.groupId===g?x:undefined;}
  listMeetings(t:Id,g:Id){return this.list<MeetingSession>('meeting','tenant_id=? AND group_id=?',[t,g]);}
  saveLedgerAccount(x:LedgerAccount){return this.saveRecord('ledger_account',x,{tenantId:x.tenantId,groupId:x.groupId});}
  listLedgerAccounts(t:Id,g:Id){return this.list<LedgerAccount>('ledger_account','tenant_id=? AND group_id=?',[t,g]);}
  saveLedgerEntry(x:LedgerEntry){return this.saveRecord('ledger_entry',x,{tenantId:x.tenantId,groupId:x.groupId,idempotencyKey:x.idempotencyKey});}
  async getLedgerEntry(t:Id,g:Id,id:Id){const x=await this.byId<LedgerEntry>('ledger_entry',id);return x?.tenantId===t&&x.groupId===g?x:undefined;}
  findLedgerEntryByIdempotency(t:Id,g:Id,k:string){return this.firstByScope<LedgerEntry>('ledger_entry','tenant_id=? AND group_id=? AND idempotency_key=?',[t,g,k]);}
  listLedgerEntries(t:Id,g:Id){return this.list<LedgerEntry>('ledger_entry','tenant_id=? AND group_id=?',[t,g]);}
  saveContributionReceipt(x:ContributionReceipt){return this.saveRecord('contribution_receipt',x,{tenantId:x.tenantId,groupId:x.groupId,idempotencyKey:x.idempotencyKey});}
  findContributionReceiptByIdempotency(t:Id,g:Id,k:string){return this.firstByScope<ContributionReceipt>('contribution_receipt','tenant_id=? AND group_id=? AND idempotency_key=?',[t,g,k]);}
  listContributionReceipts(t:Id,g:Id){return this.list<ContributionReceipt>('contribution_receipt','tenant_id=? AND group_id=?',[t,g]);}
  saveCashboxReconciliation(x:CashboxReconciliationRecord){return this.saveRecord('cashbox',x,{tenantId:x.tenantId,groupId:x.groupId});}
  listCashboxReconciliations(t:Id,g:Id){return this.list<CashboxReconciliationRecord>('cashbox','tenant_id=? AND group_id=?',[t,g]);}
  savePublicGroupListing(x:PublicGroupListing){return this.saveRecord('public_group_listing',x,{tenantId:x.tenantId,groupId:x.groupId});}
  async getPublicGroupListing(groupId:Id){return (await this.listPublicGroupListings()).find(x=>x.groupId===groupId);}
  async listPublicGroupListings(){
    // Historical rows use a listing ID, not the group ID. Retain older versions
    // while exposing only the latest privacy projection for each group.
    const latest=new Map<Id,PublicGroupListing>();
    for(const x of await this.list<PublicGroupListing>('public_group_listing')){
      const previous=latest.get(x.groupId);if(!previous || x.updatedAt>=previous.updatedAt)latest.set(x.groupId,x);
    }
    return [...latest.values()];
  }
  saveMembershipApplication(x:MembershipApplication){return this.saveRecord('membership_application',x,{tenantId:x.targetTenantId,groupId:x.groupId,assigneeId:x.applicantUserId});}
  getMembershipApplication(id:Id){return this.byId<MembershipApplication>('membership_application',id);}
  listMembershipApplicationsForGroup(t:Id,g:Id){return this.list<MembershipApplication>('membership_application','tenant_id=? AND group_id=?',[t,g]);}
  saveRubricDefinition(x:RubricDefinition){return this.saveRecord('rubric_definition',x,{tenantId:x.tenantId,groupId:x.groupId});}
  async getRubricDefinition(t:Id,g:Id,id:Id){const x=await this.byId<RubricDefinition>('rubric_definition',id);return x?.tenantId===t&&x.groupId===g?x:undefined;}
  listRubricDefinitions(t:Id,g:Id){return this.list<RubricDefinition>('rubric_definition','tenant_id=? AND group_id=?',[t,g]);}
  saveGovernanceKnowledgeClaim(x:GovernanceKnowledgeClaim){return this.saveRecord('governance_claim',x,{tenantId:x.tenantId,groupId:x.groupId});}
  listGovernanceKnowledgeClaims(t:Id,g?:Id){return this.list<GovernanceKnowledgeClaim>('governance_claim',g?'tenant_id=? AND group_id=?':'tenant_id=?',g?[t,g]:[t]);}
  saveWorkspaceRecord(x:WorkspaceRecord){return this.saveRecord('workspace_record',x,{tenantId:x.tenantId,groupId:x.groupId,assigneeId:x.createdBy});}
  async insertNotificationRecord(x:WorkspaceRecord):Promise<NotificationInsertResult>{
    if(!['NOTIFY.MESSAGE','NOTIFY.READ','NOTIFY.ATTEMPT'].includes(x.moduleId))throw Error('INVALID_NOTIFICATION_RECORD');
    const result=await this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at) VALUES('workspace_record',?,?,?,?,NULL,?,?) ON CONFLICT(record_type,record_id) DO NOTHING`).bind(x.id,x.tenantId,x.groupId??null,x.createdBy,JSON.stringify(x),x.updatedAt).run();
    const stored=await this.getWorkspaceRecord(x.tenantId,x.id);
    if(!stored||stored.moduleId!==x.moduleId)throw Error('NOTIFICATION_ID_CONFLICT');const changes=result as {meta?:{changes?:number};changes?:number};return {record:stored,inserted:Number(changes.meta?.changes??changes.changes??0)===1};
  }
  async insertGovernedRecord(x:WorkspaceRecord):Promise<NotificationInsertResult>{
    if(!['TRUST.VERIFICATION','GOVERNANCE.VOTE.ACTION','GOVERNANCE.VOTE.BALLOT'].includes(x.moduleId)&&!(x.moduleId==='MANAGER.BUSINESS_STUDIO'&&x.tags.includes('business-experiment'))&&!(x.moduleId==='OPPORTUNITY.NEED'&&x.tags.includes('consensual-pool'))&&! (x.moduleId==='ADS.MANAGER'&&x.tags.includes('ad-pilot'))&&!(x.tags.includes('governed-productive')&&((x.moduleId==='LEARNING.MANAGER_ACADEMY'&&x.data.kind==='PRACTICE_ATTEMPT')||(x.moduleId==='LEARNING.KNOWLEDGE_BANK'&&x.data.kind==='FORUM_SOLUTION')||(x.moduleId==='MEMBERSHIP.PORTFOLIO'&&x.data.kind==='DISCOVERY_NOTEBOOK')||(x.moduleId==='MANAGER.BUSINESS_STUDIO'&&['JOB','ACQUISITION_ROOM','LAUNCH_PLAN','RESOURCE_ASSEMBLY','RESOURCE_ALLOCATION_CLAIM'].includes(String(x.data.businessKind))))))throw Error('INVALID_GOVERNED_RECORD');
    const result=await this.db.prepare(`INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at) VALUES('workspace_record',?,?,?,?,NULL,?,?) ON CONFLICT(record_type,record_id) DO NOTHING`).bind(x.id,x.tenantId,x.groupId??null,x.createdBy,JSON.stringify(x),x.updatedAt).run();
    const stored=await this.getWorkspaceRecord(x.tenantId,x.id);if(!stored||stored.moduleId!==x.moduleId||stored.groupId!==x.groupId)throw Error('GOVERNED_RECORD_CONFLICT');
    const changes=result as {meta?:{changes?:number};changes?:number};return{record:stored,inserted:Number(changes.meta?.changes??changes.changes??0)===1};
  }
  async getMarketRecordById(id:Id){const r=await this.byId<WorkspaceRecord>('workspace_record',id);return r?.tags.includes('market-engine')?r:undefined;}
  listMarketShops(actorId?:Id){
    const base="group_id IS NULL AND json_extract(data_json,'$.data.marketKind')='SHOP' AND json_extract(data_json,'$.data.ownerType')='PERSON' AND json_extract(data_json,'$.status')='ACTIVE'";
    return this.list<WorkspaceRecord>('workspace_record',base+(actorId?" AND (assignee_id=? OR EXISTS(SELECT 1 FROM json_each(json_extract(data_json,'$.data.collaboratorsJson')) j WHERE json_extract(j.value,'$.userId')=?))":" AND json_extract(data_json,'$.data.visibility')='PUBLIC'"),actorId?[actorId,actorId]:[]).then(rows=>rows.filter(r=>r.tags.includes('market-engine')));
  }
  listMarketPurchases(actorId:Id){return this.list<WorkspaceRecord>('workspace_record',"json_extract(data_json,'$.data.marketKind')='MARKET_ORDER' AND json_extract(data_json,'$.data.buyerUserId')=?",[actorId]).then(rows=>rows.filter(r=>r.tags.includes('market-engine')));}
  async getWorkspaceRecord(t:Id,id:Id){const x=await this.byId<WorkspaceRecord>('workspace_record',id);return x?.tenantId===t?x:undefined;}
  listWorkspaceRecords(t:Id,moduleId?:string,g?:Id){
    if(moduleId&&g)return this.list<WorkspaceRecord>('workspace_record','tenant_id=? AND group_id=?',[t,g]).then(xs=>xs.filter(x=>x.moduleId===moduleId));
    if(g)return this.list<WorkspaceRecord>('workspace_record','tenant_id=? AND group_id=?',[t,g]);
    return this.list<WorkspaceRecord>('workspace_record','tenant_id=?',[t]).then(xs=>moduleId?xs.filter(x=>x.moduleId===moduleId):xs);
  }

  private async firstByScope<T>(type:string,where:string,values:unknown[]):Promise<T|undefined>{return this.parse<T>(await this.db.prepare(`SELECT data_json FROM platform_records WHERE record_type=? AND ${where} LIMIT 1`).bind(type,...values).first<PlatformRecordRow>());}
}
