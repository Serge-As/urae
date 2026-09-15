export type Id = string;
export type Currency = 'XAF' | 'EUR' | 'USD' | string;

export interface Money {
  currency: Currency;
  amount: number;
}

export interface ActorContext {
  actorId: Id;
  tenantId: Id;
  activeGroupId?: Id;
  membershipId?: Id;
  platformLevel?: number;
  groupRoles: string[];
  mandateIds: Id[];
  deviceId: Id;
  sessionId: Id;
  locale: 'fr' | 'en' | string;
  timezone: string;
  connectivity: 'online' | 'offline' | 'degraded';
  requestId: Id;
}

export interface DomainEvent<T = unknown> {
  id: Id;
  type: string;
  occurredAt: string;
  tenantId: Id;
  actorId?: Id;
  aggregateType: string;
  aggregateId: Id;
  payload: T;
  idempotencyKey?: string;
}

export interface AuditEvent {
  id: Id;
  at: string;
  tenantId: Id;
  actorId?: Id;
  action: string;
  targetType: string;
  targetId: Id;
  requestId?: Id;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: Id;
  displayName: string;
  locale: string;
  createdAt: string;
}

export type LatePostingMode = 'FORBIDDEN' | 'GOVERNED' | 'OPEN_WITH_TRACE';

export interface ApprovalRequirement {
  roleCodes: string[];
  minimumApprovals: number;
  founderOverride?: boolean;
}

export interface LatePostingPolicy {
  mode: LatePostingMode;
  maxHoursAfterClose?: number;
  requireReason: boolean;
  approval: ApprovalRequirement;
}

export interface GroupOperatingPolicy {
  version: number;
  latePosting: LatePostingPolicy;
  custom?: Record<string, unknown>;
  updatedAt?: string;
  updatedBy?: Id;
}

export interface Group {
  id: Id;
  tenantId: Id;
  name: string;
  kind: 'association' | 'rotating_tontine' | 'in_kind_tontine' | 'hybrid';
  originMode?: 'NEW' | 'IMPORT_EXISTING' | 'TRANSFORM_REGISTERED';
  historicalCreatedAt?: string;
  currentExerciseLabel?: string;
  evolvedFromKind?: 'association' | 'rotating_tontine' | 'in_kind_tontine' | 'hybrid';
  governanceModel: 'community' | 'founder_managed' | 'delegated' | 'ngo_supported' | 'hybrid';
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdBy: Id;
  createdAt: string;
  operatingPolicy?: GroupOperatingPolicy;
}

export interface Membership {
  id: Id;
  tenantId: Id;
  groupId: Id;
  userId: Id;
  roles: string[];
  status: 'invited' | 'active' | 'suspended' | 'left';
  joinedAt?: string;
  historicalJoinedAt?: string;
  historicalTenureStatus?: 'DECLARED' | 'VALIDATED' | 'CONTESTABLE' | 'HISTORICAL_TENURE_LOCKED';
}

export interface MembershipView extends Membership {
  displayName: string;
}

export interface Mandate {
  id: Id;
  tenantId: Id;
  groupId: Id;
  subjectUserId: Id;
  type: 'manager' | 'expert' | 'auditor' | 'ngo' | 'supplier' | 'delegate';
  permissions: string[];
  financialLimit?: number;
  startsAt: string;
  endsAt?: string;
  revokedAt?: string;
}

export interface Obligation {
  id: Id;
  tenantId: Id;
  groupId?: Id;
  assigneeId: Id;
  type: string;
  title: string;
  dueAt?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'open' | 'completed' | 'cancelled' | 'overdue';
  sourceType: string;
  sourceId: Id;
  amount?: Money;
}

export interface EvidenceRecord {
  id: Id;
  tenantId: Id;
  type: string;
  subjectType: string;
  subjectId: Id;
  createdAt: string;
  createdBy?: Id;
  data: Record<string, unknown>;
  immutable: boolean;
}

export interface CaseRecord {
  id: Id;
  tenantId: Id;
  groupId?: Id;
  type: string;
  subjectType: string;
  subjectId: Id;
  status: 'OPEN' | 'TRIAGED' | 'UNDER_REVIEW' | 'WAITING_PARTY' | 'MEDIATION' | 'RESOLVED' | 'APPEALED' | 'CLOSED';
  openedBy: Id;
  openedAt: string;
  summary: string;
}

export type ProjectCapability = 'SIMULATE' | 'EDIT' | 'CONVERT' | 'GRANT_ACCESS';

export interface ProjectAccessGrant {
  userId: Id;
  capabilities: ProjectCapability[];
  grantedBy: Id;
  grantedAt: string;
}

export interface GroupProjectOrigin {
  mode: 'NEW' | 'IMPORT_EXISTING' | 'TRANSFORM_REGISTERED';
  historicalCreatedAt?: string;
  currentExerciseLabel?: string;
  sourceGroupId?: Id;
  historyNote?: string;
}

export interface GroupProjectCycle {
  label?: string;
  startsAt?: string;
  expectedSessions?: number;
  cadence?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
  meetingDay?: string;
  physicalMeetingExpected?: boolean;
}

export interface GroupProjectMemberSetup {
  expectedMembers?: number;
  rosterMode?: 'BUILD_LATER' | 'INVITE' | 'IMPORT' | 'HISTORICAL_RECONCILIATION';
  allowWaitingList?: boolean;
  allowProbation?: boolean;
}

export interface GroupProjectCommunication {
  channels?: Array<'IN_APP'|'PRINT'|'SMS'|'WHATSAPP'|'TELEGRAM'|'EMAIL'>;
  publishMemberStatements?: boolean;
}

export interface GroupProjectAccessibility {
  ultraSimple?: boolean;
  oralAssistant?: boolean;
  lowBandwidthPriority?: boolean;
  oldDevicePriority?: boolean;
  preferredLocale?: 'fr'|'en';
}

export interface GroupProjectLaunchProfile {
  origin: GroupProjectOrigin;
  cycle?: GroupProjectCycle;
  members?: GroupProjectMemberSetup;
  communication?: GroupProjectCommunication;
  accessibility?: GroupProjectAccessibility;
  sourceDocumentFingerprints?: string[];
  previewConfirmed?: boolean;
}

export interface GroupProject {
  id: Id;
  tenantId: Id;
  createdBy: Id;
  name: string;
  kind: Group['kind'];
  governanceModel: Group['governanceModel'];
  memberCount: number;
  sessions: number;
  nominalContribution: Money;
  managementFeePerContribution: Money;
  estimatedExternalCostRate: number;
  fixedOperatingCostPerSession: Money;
  status: 'draft' | 'simulated' | 'converted';
  accessGrants?: ProjectAccessGrant[];
  createdAt: string;
  rubrics?: LaunchRubricPlan[];
  launchProfile?: GroupProjectLaunchProfile;
  convertedGroupId?: Id;
}

export type RubricActivityKind = 'CONTRIBUTION' | 'TONTINE' | 'SAVINGS' | 'SOLIDARITY' | 'TRANSPORT' | 'REPAYMENT' | 'LOAN' | 'ASSISTANCE' | 'LEVY' | 'OFFICE' | 'OTHER';
export interface LaunchRubricPlan {
  key: string;
  name: string;
  kind: RubricActivityKind;
  nominalAmount: Money;
  amountBasis: 'PER_MEMBER' | 'PER_SHARE';
  participationMode?: 'OPTIONAL' | 'MANDATORY' | 'RULE_BASED';
  contributionMode?: 'MONEY' | 'IN_KIND' | 'MIXED';
  contributionLabel?: string;
  contributionUnit?: string;
  contributionQuantity?: number;
  contextNote?: string;
  memberCount: number;
  shareCount?: number;
  potCount?: number;
  participants?: Array<{key:string;name:string;shares:Array<{key:string;name:string;turn?:number}>}>;
  sessions: number;
  duration: {value:number;unit:'DAYS'|'WEEKS'|'MONTHS'|'YEARS'|'SESSIONS'};
  managementFeePerPayment: number;
  estimatedExternalCostRate: number;
  fixedCostPerSession: number;
}

export interface RubricFeasibility {
  key:string;name:string;kind:RubricActivityKind;currency:Currency;
  unitsPerSession:number;sessions:number;totalNominalContributions:number;
  totalManagementFees:number;estimatedExternalCosts:number;fixedOperatingCosts:number;estimatedManagerMargin:number;
}

export interface FeasibilityResult {
  projectId: Id;
  currency: Currency;
  totalNominalContributions: number;
  totalManagementFees: number;
  estimatedExternalCosts: number;
  fixedOperatingCosts: number;
  estimatedManagerMargin: number;
  breakEvenMembers?: number;
  assumptions: string[];
  rubricBreakdown?: RubricFeasibility[];
}

export interface MeetingSession {
  id: Id;
  tenantId: Id;
  groupId: Id;
  title: string;
  status: 'open' | 'closed' | 'cancelled';
  openedBy: Id;
  openedAt: string;
  scheduledAt?: string;
  closedAt?: string;
}

export interface CashboxSnapshot {
  openingCash: number;
  cashIn: number;
  cashOut: number;
  theoreticalClosing: number;
  countedClosing: number;
  variance: number;
  currency: Currency;
}

export interface CashboxReconciliationRecord {
  id: Id;
  tenantId: Id;
  groupId: Id;
  meetingId?: Id;
  snapshot: CashboxSnapshot;
  status: 'MATCHED' | 'MISMATCH' | 'UNDER_REVIEW' | 'RESOLVED';
  createdAt: string;
  createdBy: Id;
}

export type LedgerAccountType = 'asset' | 'liability' | 'income' | 'expense' | 'equity';

export interface LedgerAccount {
  id: Id;
  tenantId: Id;
  groupId: Id;
  code: string;
  nameCode: string;
  type: LedgerAccountType;
  currency: Currency;
  createdAt: string;
}

export interface LedgerLine {
  accountId: Id;
  debit: number;
  credit: number;
  memoCode?: string;
}

export interface LedgerEntry {
  id: Id;
  tenantId: Id;
  groupId: Id;
  currency: Currency;
  descriptionCode: string;
  sourceType: string;
  sourceId: Id;
  idempotencyKey: string;
  lines: LedgerLine[];
  createdAt: string;
  createdBy: Id;
  meetingId?: Id;
  reversalOfEntryId?: Id;
}

export interface LatePostingTrace {
  isLate: boolean;
  reason?: string;
  approvedBy: Id[];
  meetingClosedAt?: string;
}

export interface ContributionReceipt {
  id: Id;
  tenantId: Id;
  groupId: Id;
  membershipId: Id;
  amount: Money;
  paymentMethod: 'cash';
  ledgerEntryId: Id;
  meetingId?: Id;
  receivedAt: string;
  receivedBy: Id;
  idempotencyKey: string;
  rubricId?: Id;
  latePosting?: LatePostingTrace;
}

export interface LedgerSummary {
  currency: Currency;
  cashBalance: number;
  memberFundsLiability: number;
  entryCount: number;
}

export interface MemberStatement {
  groupId:Id;
  groupName:string;
  membershipId:Id;
  displayName:string;
  currency:Currency;
  asOf:string;
  totalNetContributions:number;
  receipts:Array<ContributionReceipt & {netAmount:number}>;
}

export interface OutboxItem<T = unknown> {
  id: Id;
  tenantId: Id;
  actorId: Id;
  type: string;
  payload: T;
  idempotencyKey: string;
  status: 'PENDING' | 'SYNCING' | 'CONFIRMED' | 'FAILED' | 'CONFLICT' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  attempts: number;
}


export type GroupVisibility = 'PUBLIC' | 'MEMBERS_ONLY' | 'INVITE_ONLY' | 'SECRET';
export type JoinPolicy = 'CLOSED' | 'INVITE_ONLY' | 'REQUEST' | 'OPEN';
export type MeetingMode = 'IN_PERSON' | 'REMOTE' | 'HYBRID';

export interface ContributionBand {
  currency: Currency;
  min?: number;
  max?: number;
  cadence?: 'daily' | 'weekly' | 'monthly' | 'session' | string;
}

/** Safe, deliberately sparse cross-tenant projection. Never contains member lists, balances or private contacts. */
export interface PublicGroupListing {
  id: Id;
  tenantId: Id;
  groupId: Id;
  name: string;
  family: 'association' | 'rotating_tontine';
  visibility: GroupVisibility;
  discoverable: boolean;
  joinPolicy: JoinPolicy;
  recruiting: boolean;
  locality?: string;
  missionTags: string[];
  activityTags: string[];
  meetingMode?: MeetingMode;
  contributionBand?: ContributionBand;
  publicManagerAlias?: string;
  publishedAt: string;
  updatedAt: string;
}

export interface GroupDiscoveryQuery {
  text?: string;
  locality?: string;
  missionTags?: string[];
  activityTags?: string[];
  family?: PublicGroupListing['family'];
  meetingMode?: MeetingMode;
  maxContribution?: Money;
  recruitingOnly?: boolean;
}

export interface GroupDiscoveryMatch {
  listing: PublicGroupListing;
  score: number;
  reasonCodes: string[];
}

export interface MembershipApplication {
  id: Id;
  targetTenantId: Id;
  groupId: Id;
  applicantUserId: Id;
  sourceTenantId: Id;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  message?: string;
  requestedCommitmentBand?: ContributionBand;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: Id;
  decisionReason?: string;
}

export type RubricDirection = 'INFLOW' | 'OUTFLOW' | 'BIDIRECTIONAL' | 'NON_CASH' | 'MIXED';
export type RubricRefundability = 'NON_REFUNDABLE' | 'FULLY_REFUNDABLE' | 'PARTIALLY_REFUNDABLE' | 'CONDITIONAL' | 'NOT_APPLICABLE' | 'CUSTOM';

export interface RubricFacets {
  direction: RubricDirection;
  obligation: 'MANDATORY' | 'OPTIONAL' | 'EVENT_DRIVEN' | 'CUSTOM';
  medium: 'CASH' | 'IN_KIND' | 'HYBRID' | 'NON_FINANCIAL';
  refundability: RubricRefundability;
  replenishment: 'NONE' | 'FIXED' | 'PRO_RATA_MEMBERS' | 'EVENT_DRIVEN' | 'CUSTOM';
  interestMode: 'NONE' | 'FIXED' | 'RATE' | 'CUSTOM';
  eligibilityMode: 'ALL_MEMBERS' | 'SELECTED_MEMBERS' | 'RULE_BASED' | 'EVENT_BASED' | 'CUSTOM';
  cadence?: string;
  fundCode?: string;
  containerCode?: string;
  custom?: Record<string, string | number | boolean>;
}



export type RubricTargetMode = 'OPEN' | 'FIXED_TOTAL' | 'PER_MEMBER_FIXED' | 'CUSTOM';
export type RubricShortfallHandling = 'LEAVE_SHORT' | 'SOLIDARITY_COVERAGE' | 'CONDITIONAL_SOLIDARITY' | 'CUSTOM';
export type RubricPayoutMode = 'COLLECTED_ONLY' | 'FIXED_TARGET_IF_COVERED' | 'CUSTOM';
export type RuleRealityStatus = 'UNKNOWN' | 'ALIGNED' | 'DIFFERS' | 'MIXED';

export interface RubricOperatingModel {
  writtenRule?: string;
  observedPractice?: string;
  effectiveRuleSummary?: string;
  ruleRealityStatus: RuleRealityStatus;
  targetMode: RubricTargetMode;
  targetAmount?: Money;
  perMemberAmount?: Money;
  mandatoryForAbsentees: boolean | 'RULE_BASED';
  shortfallHandling: RubricShortfallHandling;
  payoutMode: RubricPayoutMode;
  immediateFullPayout: boolean;
  solidaritySourceRubricId?: Id;
  custom?: Record<string, unknown>;
  confirmedAt?: string;
  confirmedBy?: Id;
}

export interface RubricCyclePreview {
  rubricId: Id;
  currency: Currency;
  memberCount: number;
  expectedTotal: number;
  collectedFromMembers: number;
  memberShortfall: number;
  memberPositionDisplay: number;
  solidarityCoverage: number;
  availableForBeneficiary: number;
  beneficiaryDisbursement: number;
  remainingRubricBalance: number;
  memberDebtAfterCoverage: number;
  notes: string[];
}

export interface RubricParticipationPolicy {
  mode:'OPTIONAL'|'MANDATORY'|'RULE_BASED';
  absentMemberRule?:'PAYS'|'DOES_NOT_PAY'|'REPRESENTATIVE_RULE'|'CUSTOM';
  memberRule?:string;
}
export interface RubricContributionPolicy {
  cadence?:string;
  targetAmount?:Money;
  dueBySession?:number;
  allowedMedia?:Array<'CASH'|'MOBILE_MONEY'|'TRANSFER'|'IN_KIND'>;
  missingHandling?:'DEBT'|'SOLIDARITY_ADVANCE'|'IGNORE'|'CUSTOM';
}
export interface RubricBeneficiaryPolicy {
  mode:'NONE'|'HOST'|'ROTATING'|'SCHEDULED'|'EVENT_BASED'|'SELECTED'|'CUSTOM';
  beneficiariesPerSession?:number;
  selectionRule?:string;
}
export interface RubricRefundPolicy {
  mode:RubricRefundability;
  settlementTiming?:'SESSION'|'MID_CYCLE'|'END_OF_EXERCISE'|'CUSTOM';
  retainedAmount?:Money;
  retainedTargetPerMember?:Money;
}
export interface RubricReservePolicy {
  carryForward:boolean;
  trackPerMember:boolean;
  openingBalanceSource?:'PRIOR_CLOSING'|'MANUAL'|'ZERO'|'CUSTOM';
  replenishmentRule?:string;
}
export interface RubricLoanPolicy {
  allowed:boolean;
  rateBasisPointsPerPeriod?:number;
  interestBase:'PRINCIPAL_ONLY';
  paymentPriority?:'CAPITAL_FIRST'|'INTEREST_FIRST'|'EXPLICIT_ALLOCATION';
  noInterestOnInterest:true;
}
export interface RubricYieldPolicy {
  enabled:boolean;
  allocationModel?:'EXACT_WEIGHTED_DEPOSITS'|'LEGACY_COEFFICIENTS'|'AMOUNT_TIME'|'HYBRID_TIME_AMOUNT';
  coefficientSchedule?:Record<string,number>;
  distributableShareBasisPoints?:number;
  rounding?:'LARGEST_REMAINDER';
}
export interface RubricAssistancePolicy {
  fundingMode:'DISBURSEMENT'|'LEVY'|'MIXED';
  authorization?:'MANAGER'|'BUREAU'|'ASSEMBLY'|'DOUBLE_VALIDATION'|'CUSTOM';
  eligibleEvents?:string[];
}
export interface RubricLifecyclePolicy {
  visibility:'PERSISTENT'|'EXERCISE'|'FIRST_N_SESSIONS'|'SESSION_ONLY'|'EVENT_DRIVEN';
  activeFirstSessions?:number;
  effectiveFromSession?:number;
  effectiveUntilSession?:number;
}
export interface RubricPolicies {
  participation?:RubricParticipationPolicy;
  contribution?:RubricContributionPolicy;
  beneficiary?:RubricBeneficiaryPolicy;
  refund?:RubricRefundPolicy;
  reserve?:RubricReservePolicy;
  loan?:RubricLoanPolicy;
  yield?:RubricYieldPolicy;
  assistance?:RubricAssistancePolicy;
  lifecycle?:RubricLifecyclePolicy;
  notes?:string[];
}

export interface RubricDefinition {
  id: Id;
  tenantId: Id;
  groupId: Id;
  name: string;
  aliases: string[];
  purpose?: string;
  facets: RubricFacets;
  operatingModel?: RubricOperatingModel;
  /** Composable policies: the rubric keeps one identity while its operational rules evolve independently. */
  policies?: RubricPolicies;
  activityPlan?: LaunchRubricPlan;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  source: 'STARTER' | 'GROUP_CUSTOM' | 'GOVERNANCE_TEXT' | 'MIGRATED';
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceKnowledgeClaim {
  id: Id;
  tenantId: Id;
  groupId?: Id;
  sourceFingerprint: string;
  sourceKind: 'RI' | 'STATUTES' | 'PV' | 'CHARTER' | 'OTHER';
  subject: string;
  predicate: string;
  value: string;
  confidence: number;
  status: 'OBSERVED' | 'PROPOSED' | 'VALIDATED' | 'REJECTED' | 'SUPERSEDED';
  evidenceHint?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: Id;
}

export type CommitmentBandId = 'MICRO' | 'SMALL' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | string;
export interface ReliabilityEvidence {
  subjectUserId: Id;
  commitmentBand: CommitmentBandId;
  kind: 'FULFILLED_ON_TIME' | 'FULFILLED_LATE' | 'MISSED_CONFIRMED' | 'RECOVERED_ARREARS' | 'DISPUTE_RESOLVED' | 'RULE_BREACH_CONFIRMED';
  weight?: number;
  occurredAt: string;
  sourceId: Id;
}
export interface CommitmentReliabilityProfile {
  subjectUserId: Id;
  commitmentBand: CommitmentBandId;
  score?: number;
  rating: 'INSUFFICIENT_EVIDENCE' | 'CONSISTENT' | 'MOSTLY_CONSISTENT' | 'MIXED' | 'CONCERNING';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  sampleSize: number;
  explanationCodes: string[];
  advisoryOnly: true;
}


export type WorkspaceStatus = 'DRAFT' | 'ACTIVE' | 'DONE' | 'ARCHIVED';

export interface WorkspaceRecord {
  id: Id;
  tenantId: Id;
  groupId?: Id;
  moduleId: string;
  title: string;
  summary?: string;
  status: WorkspaceStatus;
  tags: string[];
  data: Record<string, string | number | boolean | null>;
  createdBy: Id;
  createdAt: string;
  updatedAt: string;
}

export const makeId = (prefix: string): string => {
  const id = globalThis.crypto.randomUUID();
  return `${prefix}_${id}`;
};
