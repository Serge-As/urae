import type {
  AuditEvent, CashboxReconciliationRecord, CashboxSnapshot, ContributionReceipt, Currency, FeasibilityResult,
  Group, GroupProject, Id, LedgerAccount, LedgerEntry, LedgerLine, LedgerSummary, MeetingSession, Membership,
  Money, Obligation, User, CaseRecord, GroupOperatingPolicy, ProjectCapability, ProjectAccessGrant, LatePostingTrace
} from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';
import type { PlatformRepository } from '../../repositories/src/index.js';
import { PlatformKernel } from '../../platform-kernel/src/index.js';

const assertIntNonNegative = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) throw new Error(`INVALID_${name.toUpperCase()}`);
};
const assertIntPositive = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) throw new Error(`INVALID_${name.toUpperCase()}`);
};
const now = (): string => new Date().toISOString();

const MANAGEMENT_ROLES = new Set(['founder','manager','admin','president','treasurer']);
const GROUP_KINDS = new Set<Group['kind']>(['association','rotating_tontine','in_kind_tontine','hybrid']);
const GOVERNANCE_MODELS = new Set<Group['governanceModel']>(['community','founder_managed','delegated','ngo_supported','hybrid']);

export const starterGroupOperatingPolicy = (): GroupOperatingPolicy => ({
  version: 1,
  latePosting: {
    mode: 'GOVERNED',
    requireReason: true,
    approval: {
      roleCodes: ['founder','president','treasurer','manager'],
      minimumApprovals: 1,
      founderOverride: true
    }
  }
});

const projectCan = (project:GroupProject,ctx:{actorId:Id;tenantId:Id},capability:ProjectCapability):boolean => {
  if(ctx.tenantId!==project.tenantId) return false;
  if(ctx.actorId===project.createdBy) return true;
  return Boolean(project.accessGrants?.some(g=>g.userId===ctx.actorId&&g.capabilities.includes(capability)));
};
const assertCanAccessGroup = async (repo:PlatformRepository,ctx:{actorId:Id;tenantId:Id},tenantId:Id,groupId:Id):Promise<Group> => {
  if(ctx.tenantId!==tenantId) throw new Error('FORBIDDEN_SCOPE');
  const group=await repo.getGroup(tenantId,groupId); if(!group) throw new Error('GROUP_NOT_FOUND');
  if(group.createdBy===ctx.actorId) return group;
  const memberships=await repo.listMemberships(tenantId,groupId);
  const membership=memberships.find(m=>m.userId===ctx.actorId&&m.status==='active');
  if(!membership) throw new Error('FORBIDDEN_SCOPE');
  return group;
};
const assertCanManageGroup = async (repo:PlatformRepository,ctx:{actorId:Id;tenantId:Id},tenantId:Id,groupId:Id):Promise<Group> => {
  const group=await assertCanAccessGroup(repo,ctx,tenantId,groupId);
  if(group.createdBy===ctx.actorId) return group;
  const memberships=await repo.listMemberships(tenantId,groupId);
  const membership=memberships.find(m=>m.userId===ctx.actorId&&m.status==='active');
  if(!membership||!membership.roles.some(r=>MANAGEMENT_ROLES.has(r))) throw new Error('FORBIDDEN_SCOPE');
  return group;
};

const registerGroupPolicies = (kernel: PlatformKernel): void => {
  kernel.policy.register('group:create', (ctx) => ({ allowed: ctx.actorId.length > 0, reason: 'AUTHENTICATED_ACTOR' }));
  kernel.policy.register('group:manage', (ctx, input) => {
    const groupId = (input as { groupId?: string } | undefined)?.groupId;
    const allowed = Boolean(groupId && (ctx.activeGroupId === groupId || !ctx.activeGroupId) &&
      (ctx.groupRoles.includes('manager') || ctx.groupRoles.includes('founder') || ctx.mandateIds.length > 0));
    return { allowed, reason: allowed ? 'GROUP_SCOPE_AND_ROLE' : 'FORBIDDEN_SCOPE' };
  });
};

const persistAudit = async (repo: PlatformRepository, kernel: PlatformKernel, input: Omit<AuditEvent, 'id' | 'at'> & Partial<Pick<AuditEvent, 'id' | 'at'>>): Promise<AuditEvent> => {
  const event = kernel.audit.append(input);
  await repo.saveAudit(event);
  return event;
};

export interface CreateGroupProjectInput {
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
}

export class GroupLaunchSimulator {
  simulate(project: GroupProject): FeasibilityResult {
    assertIntPositive('memberCount', project.memberCount);
    assertIntPositive('sessions', project.sessions);
    assertIntNonNegative('nominalContribution', project.nominalContribution.amount);
    assertIntNonNegative('managementFee', project.managementFeePerContribution.amount);
    assertIntNonNegative('fixedCost', project.fixedOperatingCostPerSession.amount);
    if (project.nominalContribution.currency !== project.managementFeePerContribution.currency ||
        project.nominalContribution.currency !== project.fixedOperatingCostPerSession.currency) throw new Error('CURRENCY_MISMATCH');
    if (project.estimatedExternalCostRate < 0 || project.estimatedExternalCostRate > 1) throw new Error('INVALID_EXTERNAL_COST_RATE');

    const contributionEvents = project.memberCount * project.sessions;
    const totalNominal = contributionEvents * project.nominalContribution.amount;
    const fees = contributionEvents * project.managementFeePerContribution.amount;
    const external = Math.round(totalNominal * project.estimatedExternalCostRate);
    const fixed = project.sessions * project.fixedOperatingCostPerSession.amount;
    const margin = fees - external - fixed;
    const revenuePerMemberAllSessions = project.sessions * project.managementFeePerContribution.amount;
    const netContributionPerMember = Math.max(1, revenuePerMemberAllSessions - Math.round(project.sessions * project.nominalContribution.amount * project.estimatedExternalCostRate));
    const breakEvenMembers = Math.max(0, Math.ceil(fixed / netContributionPerMember));

    return {
      projectId: project.id, currency: project.nominalContribution.currency, totalNominalContributions: totalNominal,
      totalManagementFees: fees, estimatedExternalCosts: external, fixedOperatingCosts: fixed,
      estimatedManagerMargin: margin, breakEvenMembers,
      assumptions: ['NO_REAL_MONEY', 'EXTERNAL_COSTS_SEPARATE', `EXTERNAL_RATE:${(project.estimatedExternalCostRate * 100).toFixed(2)}`, 'EXCLUDES_ARREARS_DISCOUNTS_PRICE_VARIATIONS']
    };
  }
}

export class CashboxEngine {
  close(input: { openingCash: number; cashIn: number; cashOut: number; countedClosing: number; currency?: Currency }): CashboxSnapshot {
    const currency=input.currency??'XAF';
    for (const [name, value] of Object.entries(input)) {
      if (name === 'currency') continue;
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (currency === 'XAF' && !Number.isInteger(value))) throw new Error(`INVALID_CASHBOX_${name.toUpperCase()}`);
    }
    const theoreticalClosing = input.openingCash + input.cashIn - input.cashOut;
    return { openingCash:input.openingCash, cashIn:input.cashIn, cashOut:input.cashOut, theoreticalClosing, countedClosing:input.countedClosing, variance:input.countedClosing-theoreticalClosing, currency };
  }
}

export class FoundationService {
  readonly simulator = new GroupLaunchSimulator();
  readonly cashbox = new CashboxEngine();

  constructor(public readonly repo: PlatformRepository, public readonly kernel: PlatformKernel) {
    registerGroupPolicies(kernel);
    kernel.workflow.register('group_project', { draft: ['simulated'], simulated: ['simulated', 'converted'], converted: [] });
  }

  async ensureUser(user: User): Promise<void> { await this.repo.saveUser(user); }

  async createProject(input: CreateGroupProjectInput, requestId = makeId('req')): Promise<GroupProject> {
    const context = this.kernel.context.get();
    const decision = this.kernel.policy.evaluate('group:create', context, input);
    if (!decision.allowed) throw new Error(decision.reason);
    if (context.tenantId !== input.tenantId || context.actorId !== input.createdBy) throw new Error('FORBIDDEN_SCOPE');
    if (!input.name.trim()) throw new Error('GROUP_NAME_REQUIRED');
    if (!GROUP_KINDS.has(input.kind)) throw new Error('INVALID_GROUP_KIND');
    if (!GOVERNANCE_MODELS.has(input.governanceModel)) throw new Error('INVALID_GOVERNANCE_MODEL');
    assertIntPositive('memberCount', input.memberCount); assertIntPositive('sessions', input.sessions);
    assertIntNonNegative('nominalContribution', input.nominalContribution.amount); assertIntNonNegative('managementFee', input.managementFeePerContribution.amount); assertIntNonNegative('fixedCost', input.fixedOperatingCostPerSession.amount);
    if (!Number.isFinite(input.estimatedExternalCostRate) || input.estimatedExternalCostRate < 0 || input.estimatedExternalCostRate > 1) throw new Error('INVALID_EXTERNAL_COST_RATE');
    if (input.nominalContribution.currency !== input.managementFeePerContribution.currency || input.nominalContribution.currency !== input.fixedOperatingCostPerSession.currency) throw new Error('CURRENCY_MISMATCH');
    const project: GroupProject = { ...input, name:input.name.trim(), id:makeId('project'), status:'draft', createdAt:now() };
    await this.repo.saveProject(project);
    await persistAudit(this.repo,this.kernel,{ tenantId:input.tenantId, actorId:input.createdBy, action:'GROUP_PROJECT_CREATED', targetType:'group_project', targetId:project.id, requestId, after:project });
    this.kernel.events.publish({ id:makeId('event'), type:'GROUP_PROJECT_CREATED', occurredAt:now(), tenantId:input.tenantId, actorId:input.createdBy, aggregateType:'group_project', aggregateId:project.id, payload:{name:project.name} });
    return structuredClone(project);
  }

  async grantProjectAccess(tenantId:Id,projectId:Id,userId:Id,capabilities:ProjectCapability[],requestId=makeId('req')):Promise<GroupProject>{
    const project=await this.repo.getProject(tenantId,projectId); if(!project) throw new Error('PROJECT_NOT_FOUND');
    const ctx=this.kernel.context.get(); if(!projectCan(project,ctx,'GRANT_ACCESS')) throw new Error('FORBIDDEN_SCOPE');
    const allowed=new Set<ProjectCapability>(['SIMULATE','EDIT','CONVERT','GRANT_ACCESS']);
    const clean=[...new Set(capabilities)].filter(c=>allowed.has(c)); if(!userId.trim()||!clean.length) throw new Error('INVALID_PROJECT_ACCESS_GRANT');
    const grants=(project.accessGrants??[]).filter(g=>g.userId!==userId);
    const grant:ProjectAccessGrant={userId,capabilities:clean,grantedBy:ctx.actorId,grantedAt:now()};
    const next={...project,accessGrants:[...grants,grant]}; await this.repo.saveProject(next);
    await persistAudit(this.repo,this.kernel,{tenantId,actorId:ctx.actorId,action:'GROUP_PROJECT_ACCESS_GRANTED',targetType:'group_project',targetId:projectId,requestId,metadata:{userId,capabilities:clean}});
    return structuredClone(next);
  }

  async simulateProject(tenantId: Id, projectId: Id, requestId = makeId('req')): Promise<FeasibilityResult> {
    const project = await this.repo.getProject(tenantId,projectId); if(!project) throw new Error('PROJECT_NOT_FOUND');
    const ctx=this.kernel.context.get(); if(!projectCan(project,ctx,'SIMULATE')) throw new Error('FORBIDDEN_SCOPE');
    const result = this.simulator.simulate(project);
    const next: GroupProject = {...project,status:project.status==='converted'?'converted':'simulated'}; await this.repo.saveProject(next);
    await persistAudit(this.repo,this.kernel,{tenantId,actorId:ctx.actorId,action:'GROUP_PROJECT_SIMULATED',targetType:'group_project',targetId:projectId,requestId,metadata:{result}});
    return result;
  }

  async convertProjectToGroup(tenantId: Id, projectId: Id, requestId = makeId('req')): Promise<Group> {
    const project=await this.repo.getProject(tenantId,projectId); if(!project) throw new Error('PROJECT_NOT_FOUND');
    const ctx=this.kernel.context.get(); if(!projectCan(project,ctx,'CONVERT')) throw new Error('FORBIDDEN_SCOPE');
    if(project.status==='draft') await this.simulateProject(tenantId,projectId,requestId);
    const existingGroups=await this.repo.listGroups(tenantId);
    const already=existingGroups.find(g=>g.createdBy===project.createdBy&&g.name===project.name&&project.status==='converted');
    if(already) return already;
    const group:Group={id:makeId('group'),tenantId,name:project.name,kind:project.kind,governanceModel:project.governanceModel,status:'active',createdBy:project.createdBy,createdAt:now(),operatingPolicy:starterGroupOperatingPolicy()};
    await this.repo.saveGroup(group);
    const ownerMembership:Membership={id:makeId('membership'),tenantId,groupId:group.id,userId:project.createdBy,roles:['founder','manager'],status:'active',joinedAt:group.createdAt};
    await this.repo.saveMembership(ownerMembership);
    await this.repo.saveProject({...project,status:'converted'});
    const obligation=this.kernel.obligations.create({tenantId,groupId:group.id,assigneeId:project.createdBy,type:'GROUP_SETUP',title:'OBLIGATION_GROUP_SETUP',priority:'normal',sourceType:'group',sourceId:group.id});
    await this.repo.saveObligation(obligation);
    await persistAudit(this.repo,this.kernel,{tenantId,actorId:project.createdBy,action:'GROUP_CREATED_FROM_PROJECT',targetType:'group',targetId:group.id,requestId,after:group});
    this.kernel.events.publish({id:makeId('event'),type:'GROUP_CREATED',occurredAt:now(),tenantId,actorId:project.createdBy,aggregateType:'group',aggregateId:group.id,payload:{projectId}});
    return structuredClone(group);
  }

  async updateGroupOperatingPolicy(tenantId:Id,groupId:Id,policy:GroupOperatingPolicy,requestId=makeId('req')):Promise<Group>{
    const ctx=this.kernel.context.get(); const group=await assertCanManageGroup(this.repo,ctx,tenantId,groupId);
    const late=policy.latePosting;
    if(!late||!['FORBIDDEN','GOVERNED','OPEN_WITH_TRACE'].includes(late.mode)) throw new Error('INVALID_LATE_POSTING_MODE');
    if(late.maxHoursAfterClose!==undefined&&(!Number.isFinite(late.maxHoursAfterClose)||late.maxHoursAfterClose<0)) throw new Error('INVALID_LATE_POSTING_WINDOW');
    if(!Number.isInteger(late.approval.minimumApprovals)||late.approval.minimumApprovals<0) throw new Error('INVALID_APPROVAL_THRESHOLD');
    if(late.mode==='GOVERNED'&&late.approval.minimumApprovals<1) throw new Error('INVALID_APPROVAL_THRESHOLD');
    const next:Group={...group,operatingPolicy:{...structuredClone(policy),version:Math.max((group.operatingPolicy?.version??0)+1,policy.version||1),updatedAt:now(),updatedBy:ctx.actorId}};
    await this.repo.saveGroup(next);
    await persistAudit(this.repo,this.kernel,{tenantId,actorId:ctx.actorId,action:'GROUP_OPERATING_POLICY_UPDATED',targetType:'group',targetId:groupId,requestId,before:group.operatingPolicy,after:next.operatingPolicy});
    return structuredClone(next);
  }

  async addMember(tenantId: Id, groupId: Id, user: User, requestId = makeId('req')): Promise<Membership> {
    const ctx=this.kernel.context.get(); const group=await assertCanManageGroup(this.repo,ctx,tenantId,groupId);
    const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:groupId},{groupId}); if(!decision.allowed) throw new Error(decision.reason);
    if(!user.displayName.trim()) throw new Error('MEMBER_NAME_REQUIRED');
    await this.repo.saveUser({...user,displayName:user.displayName.trim()});
    const membership:Membership={id:makeId('membership'),tenantId,groupId,userId:user.id,roles:['member'],status:'active',joinedAt:now()};
    await this.repo.saveMembership(membership);
    await persistAudit(this.repo,this.kernel,{tenantId,actorId:ctx.actorId,action:'MEMBER_ADDED',targetType:'membership',targetId:membership.id,requestId,after:membership});
    this.kernel.events.publish({id:makeId('event'),type:'MEMBER_ADDED',occurredAt:now(),tenantId,actorId:ctx.actorId,aggregateType:'group',aggregateId:groupId,payload:{userId:user.id,membershipId:membership.id}});
    return structuredClone(membership);
  }

  async openSupportCase(input:{tenantId:Id;groupId?:Id;openedBy:Id;summary:string},requestId=makeId('req')):Promise<CaseRecord>{
    const clean=input.summary.trim(); if(!clean) throw new Error('CASE_SUMMARY_REQUIRED');
    if(input.groupId) await assertCanAccessGroup(this.repo,this.kernel.context.get(),input.tenantId,input.groupId);
    const record=this.kernel.cases.open({tenantId:input.tenantId,groupId:input.groupId,type:'GENERAL_SUPPORT',subjectType:input.groupId?'group':'account',subjectId:input.groupId??input.openedBy,openedBy:input.openedBy,summary:clean});
    await this.repo.saveCase(record);
    await persistAudit(this.repo,this.kernel,{tenantId:input.tenantId,actorId:input.openedBy,action:'SUPPORT_CASE_OPENED',targetType:'case',targetId:record.id,requestId,after:record});
    return record;
  }

  async reconcileCashbox(input:{tenantId:Id;groupId:Id;meetingId?:Id;openingCash:number;cashIn:number;cashOut:number;countedClosing:number;currency?:Currency},requestId=makeId('req')):Promise<CashboxReconciliationRecord>{
    const ctx=this.kernel.context.get(); await assertCanManageGroup(this.repo,ctx,input.tenantId,input.groupId);
    const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:input.groupId},{groupId:input.groupId}); if(!decision.allowed) throw new Error(decision.reason);
    if(input.meetingId && !(await this.repo.getMeeting(input.tenantId,input.groupId,input.meetingId))) throw new Error('MEETING_NOT_FOUND');
    const snapshot=this.cashbox.close(input); const reconciliation=this.kernel.reconciliation.compare(snapshot.theoreticalClosing,snapshot.countedClosing);
    const record:CashboxReconciliationRecord={id:makeId('cashrec'),tenantId:input.tenantId,groupId:input.groupId,meetingId:input.meetingId,snapshot,status:reconciliation.status==='MATCHED'?'MATCHED':'MISMATCH',createdAt:now(),createdBy:ctx.actorId};
    await this.repo.saveCashboxReconciliation(record);
    await persistAudit(this.repo,this.kernel,{tenantId:input.tenantId,actorId:ctx.actorId,action:'CASHBOX_RECONCILED',targetType:'group',targetId:input.groupId,requestId,metadata:{record}});
    return record;
  }
}

export class MeetingService {
  constructor(public readonly repo:PlatformRepository,public readonly kernel:PlatformKernel){registerGroupPolicies(kernel);}
  async openMeeting(tenantId:Id,groupId:Id,input:{title?:string;scheduledAt?:string},requestId=makeId('req')):Promise<MeetingSession>{
    const ctx=this.kernel.context.get(); const group=await assertCanManageGroup(this.repo,ctx,tenantId,groupId);
    const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:groupId},{groupId}); if(!decision.allowed) throw new Error(decision.reason);
    const meeting:MeetingSession={id:makeId('meeting'),tenantId,groupId,title:input.title?.trim()||'MEETING_DEFAULT_TITLE',status:'open',openedBy:ctx.actorId,openedAt:now(),scheduledAt:input.scheduledAt};
    await this.repo.saveMeeting(meeting);
    await persistAudit(this.repo,this.kernel,{tenantId,actorId:ctx.actorId,action:'MEETING_OPENED',targetType:'meeting',targetId:meeting.id,requestId,after:meeting});
    return meeting;
  }
  async closeMeeting(tenantId:Id,groupId:Id,meetingId:Id,requestId=makeId('req')):Promise<MeetingSession>{
    const current=await this.repo.getMeeting(tenantId,groupId,meetingId); if(!current) throw new Error('MEETING_NOT_FOUND');
    if(current.status==='closed') return current;
    if(current.status!=='open') throw new Error('MEETING_NOT_OPEN');
    const ctx=this.kernel.context.get(); await assertCanManageGroup(this.repo,ctx,tenantId,groupId); const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:groupId},{groupId}); if(!decision.allowed) throw new Error(decision.reason);
    const next={...current,status:'closed' as const,closedAt:now()}; await this.repo.saveMeeting(next);
    await persistAudit(this.repo,this.kernel,{tenantId,actorId:ctx.actorId,action:'MEETING_CLOSED',targetType:'meeting',targetId:meetingId,requestId,before:current,after:next});
    return next;
  }
}

const membershipRolesForActor = async (repo:PlatformRepository,tenantId:Id,group:Group,userId:Id):Promise<string[]> => {
  if(userId===group.createdBy) return ['founder','manager'];
  const membership=(await repo.listMemberships(tenantId,group.id)).find(m=>m.userId===userId&&m.status==='active');
  return membership?.roles??[];
};

const authorizeLatePosting = async (repo:PlatformRepository,group:Group,ctx:{actorId:Id;tenantId:Id},meeting:MeetingSession,input:{lateReason?:string;approverIds?:Id[]}):Promise<LatePostingTrace> => {
  const policy=group.operatingPolicy??starterGroupOperatingPolicy(); const late=policy.latePosting;
  if(late.mode==='FORBIDDEN') throw new Error('LATE_POSTING_NOT_ALLOWED');
  const reason=input.lateReason?.trim(); if(late.requireReason&&!reason) throw new Error('LATE_POSTING_REASON_REQUIRED');
  if(late.maxHoursAfterClose!==undefined&&meeting.closedAt){
    const elapsed=(Date.now()-new Date(meeting.closedAt).getTime())/3600000;
    if(Number.isFinite(elapsed)&&elapsed>late.maxHoursAfterClose) throw new Error('LATE_POSTING_WINDOW_EXPIRED');
  }
  const candidateIds=[...new Set([ctx.actorId,...(input.approverIds??[])])];
  if(late.mode==='OPEN_WITH_TRACE') return {isLate:true,reason,approvedBy:candidateIds,meetingClosedAt:meeting.closedAt};
  const eligible:Id[]=[]; let founderPresent=false;
  for(const id of candidateIds){
    const roles=await membershipRolesForActor(repo,group.tenantId,group,id);
    if(id===group.createdBy) founderPresent=true;
    if(roles.some(r=>late.approval.roleCodes.includes(r))) eligible.push(id);
  }
  const approved=(late.approval.founderOverride&&founderPresent)||eligible.length>=late.approval.minimumApprovals;
  if(!approved) throw new Error('LATE_POSTING_APPROVAL_REQUIRED');
  return {isLate:true,reason,approvedBy:eligible,meetingClosedAt:meeting.closedAt};
};

export class LedgerService {
  constructor(public readonly repo:PlatformRepository,public readonly kernel:PlatformKernel){registerGroupPolicies(kernel);}

  private validateBalanced(entry:LedgerEntry):void{
    if(entry.lines.length<2) throw new Error('LEDGER_MINIMUM_TWO_LINES');
    let debit=0,credit=0;
    for(const line of entry.lines){assertIntNonNegative('ledgerDebit',line.debit);assertIntNonNegative('ledgerCredit',line.credit);if(line.debit>0&&line.credit>0) throw new Error('LEDGER_LINE_BOTH_SIDES');if(line.debit===0&&line.credit===0) throw new Error('LEDGER_ZERO_LINE');debit+=line.debit;credit+=line.credit;}
    if(debit!==credit) throw new Error('LEDGER_UNBALANCED');
  }

  private async ensureStandardAccounts(tenantId:Id,groupId:Id,currency:Currency):Promise<{cash:LedgerAccount;memberFunds:LedgerAccount}>{
    const accounts=await this.repo.listLedgerAccounts(tenantId,groupId);
    let cash=accounts.find(a=>a.code==='CASH'&&a.currency===currency);
    let memberFunds=accounts.find(a=>a.code==='MEMBER_FUNDS_LIABILITY'&&a.currency===currency);
    if(!cash){cash={id:makeId('acct'),tenantId,groupId,code:'CASH',nameCode:'LEDGER_ACCOUNT_CASH',type:'asset',currency,createdAt:now()};await this.repo.saveLedgerAccount(cash);}
    if(!memberFunds){memberFunds={id:makeId('acct'),tenantId,groupId,code:'MEMBER_FUNDS_LIABILITY',nameCode:'LEDGER_ACCOUNT_MEMBER_FUNDS',type:'liability',currency,createdAt:now()};await this.repo.saveLedgerAccount(memberFunds);}
    return {cash,memberFunds};
  }

  async recordCashContribution(input:{tenantId:Id;groupId:Id;membershipId:Id;amount:number;currency?:Currency;meetingId?:Id;rubricId?:Id;lateReason?:string;approverIds?:Id[];idempotencyKey:string},requestId=makeId('req')):Promise<ContributionReceipt>{
    assertIntPositive('contributionAmount',input.amount); if(!input.idempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const existing=await this.repo.findContributionReceiptByIdempotency(input.tenantId,input.groupId,input.idempotencyKey); if(existing) return existing;
    const ctx=this.kernel.context.get(); const group=await assertCanManageGroup(this.repo,ctx,input.tenantId,input.groupId);
    const membership=await this.repo.getMembership(input.tenantId,input.groupId,input.membershipId); if(!membership||membership.status!=='active') throw new Error('MEMBERSHIP_NOT_FOUND');
    let latePosting:LatePostingTrace|undefined;
    if(input.meetingId){const meeting=await this.repo.getMeeting(input.tenantId,input.groupId,input.meetingId);if(!meeting) throw new Error('MEETING_NOT_FOUND');if(meeting.status==='cancelled') throw new Error('MEETING_NOT_OPEN');if(meeting.status==='closed') latePosting=await authorizeLatePosting(this.repo,group,ctx,meeting,input);}
    const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:input.groupId},{groupId:input.groupId}); if(!decision.allowed) throw new Error(decision.reason);
    const currency=input.currency??'XAF'; const accounts=await this.ensureStandardAccounts(input.tenantId,input.groupId,currency);
    const entry:LedgerEntry={id:makeId('ledger'),tenantId:input.tenantId,groupId:input.groupId,currency,descriptionCode:'LEDGER_CASH_CONTRIBUTION',sourceType:'membership_contribution',sourceId:membership.id,idempotencyKey:input.idempotencyKey,meetingId:input.meetingId,createdAt:now(),createdBy:ctx.actorId,lines:[{accountId:accounts.cash.id,debit:input.amount,credit:0,memoCode:'LEDGER_CASH_RECEIVED'},{accountId:accounts.memberFunds.id,debit:0,credit:input.amount,memoCode:'LEDGER_MEMBER_FUNDS_CREDITED'}]};
    this.validateBalanced(entry); await this.repo.saveLedgerEntry(entry);
    const receipt:ContributionReceipt={id:makeId('receipt'),tenantId:input.tenantId,groupId:input.groupId,membershipId:membership.id,amount:{currency,amount:input.amount},paymentMethod:'cash',ledgerEntryId:entry.id,meetingId:input.meetingId,rubricId:input.rubricId,latePosting,receivedAt:entry.createdAt,receivedBy:ctx.actorId,idempotencyKey:input.idempotencyKey};
    await this.repo.saveContributionReceipt(receipt);
    await persistAudit(this.repo,this.kernel,{tenantId:input.tenantId,actorId:ctx.actorId,action:'CASH_CONTRIBUTION_POSTED',targetType:'ledger_entry',targetId:entry.id,requestId,after:{entry,receipt}});
    this.kernel.events.publish({id:makeId('event'),type:'CASH_CONTRIBUTION_POSTED',occurredAt:now(),tenantId:input.tenantId,actorId:ctx.actorId,aggregateType:'group',aggregateId:input.groupId,payload:{membershipId:membership.id,amount:input.amount,currency,receiptId:receipt.id},idempotencyKey:input.idempotencyKey});
    return receipt;
  }

  async reverseEntry(input:{tenantId:Id;groupId:Id;entryId:Id;reason:string},requestId=makeId('req')):Promise<LedgerEntry>{
    const original=await this.repo.getLedgerEntry(input.tenantId,input.groupId,input.entryId); if(!original) throw new Error('LEDGER_ENTRY_NOT_FOUND');
    const ctx=this.kernel.context.get(); await assertCanManageGroup(this.repo,ctx,input.tenantId,input.groupId); const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:input.groupId},{groupId:input.groupId}); if(!decision.allowed) throw new Error(decision.reason);
    const key=`reversal:${original.id}`; const existing=await this.repo.findLedgerEntryByIdempotency(input.tenantId,input.groupId,key); if(existing) return existing;
    const reason=input.reason.trim(); if(!reason) throw new Error('REVERSAL_REASON_REQUIRED');
    const lines:LedgerLine[]=original.lines.map(l=>({accountId:l.accountId,debit:l.credit,credit:l.debit,memoCode:'LEDGER_REVERSAL'}));
    const reversal:LedgerEntry={id:makeId('ledger'),tenantId:input.tenantId,groupId:input.groupId,currency:original.currency,descriptionCode:'LEDGER_REVERSAL',sourceType:'ledger_reversal',sourceId:original.id,idempotencyKey:key,createdAt:now(),createdBy:ctx.actorId,meetingId:original.meetingId,reversalOfEntryId:original.id,lines};
    this.validateBalanced(reversal); await this.repo.saveLedgerEntry(reversal);
    await persistAudit(this.repo,this.kernel,{tenantId:input.tenantId,actorId:ctx.actorId,action:'LEDGER_ENTRY_REVERSED',targetType:'ledger_entry',targetId:reversal.id,requestId,metadata:{originalEntryId:original.id,reason},after:reversal});
    return reversal;
  }

  async summary(tenantId:Id,groupId:Id,currency:Currency='XAF'):Promise<LedgerSummary>{
    const accounts=await this.repo.listLedgerAccounts(tenantId,groupId); const entries=(await this.repo.listLedgerEntries(tenantId,groupId)).filter(e=>e.currency===currency);
    const cashId=accounts.find(a=>a.code==='CASH'&&a.currency===currency)?.id; const liabilityId=accounts.find(a=>a.code==='MEMBER_FUNDS_LIABILITY'&&a.currency===currency)?.id;
    let cashBalance=0,memberFundsLiability=0;
    for(const e of entries) for(const l of e.lines){if(l.accountId===cashId) cashBalance+=l.debit-l.credit;if(l.accountId===liabilityId) memberFundsLiability+=l.credit-l.debit;}
    return {currency,cashBalance,memberFundsLiability,entryCount:entries.length};
  }
}
