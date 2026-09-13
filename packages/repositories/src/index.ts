import type {
  AuditEvent, CashboxReconciliationRecord, CaseRecord, ContributionReceipt, Group, GroupProject, Id,
  LedgerAccount, LedgerEntry, MeetingSession, Membership, Obligation, User, PublicGroupListing, MembershipApplication,
  RubricDefinition, GovernanceKnowledgeClaim, WorkspaceRecord
} from '../../contracts/src/index.js';

export interface FinancialOperation {
  kind: 'contribution' | 'reversal';
  entry: LedgerEntry;
  receipt?: ContributionReceipt;
  accounts: LedgerAccount[];
  audit: AuditEvent;
}

export interface PlatformRepository {
  commitFinancialOperation(operation: FinancialOperation): FinancialOperation | Promise<FinancialOperation>;
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

  saveWorkspaceRecord(record: WorkspaceRecord): void | Promise<void>;
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
    this.financialOperations.set(key,copy);
    return structuredClone(copy);
  }
  private users = new Map<Id, User>();
  private projects = new Map<Id, GroupProject>();
  private groups = new Map<Id, Group>();
  private memberships = new Map<Id, Membership>();
  private obligations = new Map<Id, Obligation>();
  private cases = new Map<Id, CaseRecord>();
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
  listCases(tenantId: Id, openedBy?: Id): CaseRecord[] { return [...this.cases.values()].filter(x => x.tenantId === tenantId && (!openedBy || x.openedBy === openedBy)).map(x => structuredClone(x)); }

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
export class D1PlatformRepository implements PlatformRepository {
  constructor(private readonly db:D1DatabaseLike){}
  getGroupById(id:Id){return this.byId<Group>('group',id);}
  listMembershipsForUser(userId:Id){return this.list<Membership>('membership','assignee_id=?',[userId]);}

  async commitFinancialOperation(operation:FinancialOperation):Promise<FinancialOperation>{
    const e=operation.entry;
    const scope=[e.tenantId,e.groupId,operation.kind,e.idempotencyKey];
    const statements=[this.db.prepare(`INSERT INTO financial_operations
      (tenant_id,group_id,operation_kind,idempotency_key,entry_id,operation_json)
      VALUES(?,?,?,?,?,?) ON CONFLICT(tenant_id,group_id,operation_kind,idempotency_key) DO NOTHING`)
      .bind(...scope,e.id,JSON.stringify(operation))];
    const rows:Array<[string,{id:Id},string|null]>=[
      ...operation.accounts.map(a=>['ledger_account',a,null] as [string,LedgerAccount,null]),
      ['ledger_entry',e,e.idempotencyKey],['audit',operation.audit,null]
    ];
    if(operation.receipt)rows.push(['contribution_receipt',operation.receipt,e.idempotencyKey]);
    for(const [type,value,key] of rows){
      statements.push(this.db.prepare(`INSERT INTO platform_records
        (record_type,record_id,tenant_id,group_id,assignee_id,idempotency_key,data_json,updated_at)
        SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM financial_operations
          WHERE tenant_id=? AND group_id=? AND operation_kind=? AND idempotency_key=? AND entry_id=?)
        ON CONFLICT(record_type,record_id) DO NOTHING`)
        .bind(type,value.id,e.tenantId,e.groupId,null,key,JSON.stringify(value),e.createdAt,...scope,e.id));
    }
    // D1 batch is transactional: the receipt, entry, accounts and audit either all
    // commit or all roll back. The unique operation key arbitrates competing requests.
    await this.db.batch(statements);
    const winner=await this.db.prepare(`SELECT operation_json FROM financial_operations
      WHERE tenant_id=? AND group_id=? AND operation_kind=? AND idempotency_key=?`)
      .bind(...scope).first<{operation_json:string}>();
    if(!winner)throw new Error('FINANCIAL_COMMIT_NOT_CONFIRMED');
    return JSON.parse(winner.operation_json) as FinancialOperation;
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
  listCases(t:Id,o?:Id){return this.list<CaseRecord>('case',o?'tenant_id=? AND assignee_id=?':'tenant_id=?',o?[t,o]:[t]);}
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
  async getWorkspaceRecord(t:Id,id:Id){const x=await this.byId<WorkspaceRecord>('workspace_record',id);return x?.tenantId===t?x:undefined;}
  listWorkspaceRecords(t:Id,moduleId?:string,g?:Id){
    if(moduleId&&g)return this.list<WorkspaceRecord>('workspace_record','tenant_id=? AND group_id=?',[t,g]).then(xs=>xs.filter(x=>x.moduleId===moduleId));
    if(g)return this.list<WorkspaceRecord>('workspace_record','tenant_id=? AND group_id=?',[t,g]);
    return this.list<WorkspaceRecord>('workspace_record','tenant_id=?',[t]).then(xs=>moduleId?xs.filter(x=>x.moduleId===moduleId):xs);
  }

  private async firstByScope<T>(type:string,where:string,values:unknown[]):Promise<T|undefined>{return this.parse<T>(await this.db.prepare(`SELECT data_json FROM platform_records WHERE record_type=? AND ${where} LIMIT 1`).bind(type,...values).first<PlatformRecordRow>());}
}
