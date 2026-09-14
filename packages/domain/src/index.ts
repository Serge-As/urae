import type {
  AuditEvent, CashboxReconciliationRecord, CashboxSnapshot, ContributionReceipt, Currency, FeasibilityResult,
  Group, GroupProject, Id, LedgerAccount, LedgerEntry, LedgerLine, LedgerSummary, MeetingSession, Membership,
  Money, Obligation, User, CaseRecord, GroupOperatingPolicy, ProjectCapability, ProjectAccessGrant, LatePostingTrace, MemberStatement, GroupProjectLaunchProfile
} from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';
import type { PlatformRepository } from '../../repositories/src/index.js';
import { PlatformKernel } from '../../platform-kernel/src/index.js';
import type {LaunchRubricPlan} from '../../contracts/src/index.js';
import {validateLaunchRubrics,simulateRubricPlan} from '../../rubrics/src/launch-config.js';
import {RubricKnowledgeService} from '../../rubrics/src/index.js';

const assertIntNonNegative = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(value)) throw new Error(`INVALID_${name.toUpperCase()}`);
};
const assertIntPositive = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0 || !Number.isSafeInteger(value)) throw new Error(`INVALID_${name.toUpperCase()}`);
};
const now = (): string => new Date().toISOString();
const requiredTextCode = (value:string):string => { const clean=value.trim().replace(/[^A-Z0-9_]/gi,'_').toUpperCase(); if(!clean)throw new Error('LEDGER_ACCOUNT_CODE_REQUIRED'); return clean; };

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
  memberCount?: number;
  sessions?: number;
  nominalContribution?: Money;
  managementFeePerContribution?: Money;
  estimatedExternalCostRate?: number;
  fixedOperatingCostPerSession?: Money;
  rubrics?: LaunchRubricPlan[];
  launchProfile?: GroupProjectLaunchProfile;
}

const normalizeLaunchProfile=(profile:GroupProjectLaunchProfile|undefined):GroupProjectLaunchProfile=>{
  const origin=profile?.origin??{mode:'NEW' as const};
  if(!['NEW','IMPORT_EXISTING','TRANSFORM_REGISTERED'].includes(origin.mode))throw new Error('INVALID_GROUP_ORIGIN');
  if(origin.mode==='TRANSFORM_REGISTERED'&&!origin.sourceGroupId)throw new Error('SOURCE_GROUP_REQUIRED');
  if(origin.historicalCreatedAt&&Number.isNaN(Date.parse(origin.historicalCreatedAt)))throw new Error('INVALID_HISTORICAL_DATE');
  const expectedMembers=profile?.members?.expectedMembers;
  if(expectedMembers!==undefined&&(!Number.isSafeInteger(expectedMembers)||expectedMembers<1||expectedMembers>100000))throw new Error('INVALID_EXPECTED_MEMBERS');
  const expectedSessions=profile?.cycle?.expectedSessions;
  if(expectedSessions!==undefined&&(!Number.isSafeInteger(expectedSessions)||expectedSessions<1||expectedSessions>10000))throw new Error('INVALID_EXPECTED_SESSIONS');
  return structuredClone({
    origin,
    cycle:profile?.cycle,
    members:profile?.members,
    communication:profile?.communication,
    accessibility:profile?.accessibility,
    sourceDocumentFingerprints:profile?.sourceDocumentFingerprints??[],
    previewConfirmed:Boolean(profile?.previewConfirmed)
  });
};

export class GroupLaunchSimulator {
  simulate(project: GroupProject): FeasibilityResult {
    if(project.rubrics!==undefined){
      const plans=validateLaunchRubrics(project.rubrics),rows=plans.map(simulateRubricPlan);
      if(new Set(rows.map(r=>r.currency)).size!==1)throw Error('CURRENCY_MISMATCH');
      const total=(field:'totalNominalContributions'|'totalManagementFees'|'estimatedExternalCosts'|'fixedOperatingCosts'|'estimatedManagerMargin')=>{const sum=rows.reduce((n,r)=>n+r[field],0);if(!Number.isSafeInteger(sum))throw Error('SIMULATION_AMOUNT_OUT_OF_RANGE');return sum;};
      return{projectId:project.id,currency:rows[0]!.currency,totalNominalContributions:total('totalNominalContributions'),totalManagementFees:total('totalManagementFees'),estimatedExternalCosts:total('estimatedExternalCosts'),fixedOperatingCosts:total('fixedOperatingCosts'),estimatedManagerMargin:total('estimatedManagerMargin'),rubricBreakdown:rows,assumptions:['NO_REAL_MONEY','INDEPENDENT_RUBRIC_CYCLES','NOMINAL_PER_MEMBER_OR_SHARE_PER_TURN','POTS_ARE_BENEFICIARY_SLOTS_NOT_CONTRIBUTION_UNITS','PLANNING_DOES_NOT_CREATE_MEMBERSHIPS_OR_DEBTS','EXCLUDES_ARREARS_DISCOUNTS_PRICE_VARIATIONS']};
    }
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
    const plans=input.rubrics===undefined?undefined:validateLaunchRubrics(input.rubrics);
    const launchProfile=normalizeLaunchProfile(input.launchProfile);
    if(launchProfile.origin.mode==='TRANSFORM_REGISTERED'){
      const source=await assertCanManageGroup(this.repo,context,input.tenantId,String(launchProfile.origin.sourceGroupId));
      if(source.kind!=='rotating_tontine'&&source.kind!=='in_kind_tontine')throw new Error('SOURCE_GROUP_NOT_TONTINE');
    }
    const currency=plans?.[0]?.nominalAmount.currency??input.nominalContribution?.currency??'XAF';
    // Legacy fields are retained for saved projects; rubric plans are the authority for new configurations.
    const project:GroupProject={tenantId:input.tenantId,createdBy:input.createdBy,name:input.name.trim(),kind:input.kind,governanceModel:input.governanceModel,id:makeId('project'),status:'draft',createdAt:now(),rubrics:plans,launchProfile,
      memberCount:plans?1:input.memberCount!,sessions:plans?1:input.sessions!,nominalContribution:plans?{currency,amount:0}:input.nominalContribution!,managementFeePerContribution:plans?{currency,amount:0}:input.managementFeePerContribution!,estimatedExternalCostRate:plans?0:input.estimatedExternalCostRate!,fixedOperatingCostPerSession:plans?{currency,amount:0}:input.fixedOperatingCostPerSession!};
    if(!plans&&(!project.nominalContribution||!project.managementFeePerContribution||!project.fixedOperatingCostPerSession))throw Error('PROJECT_RUBRICS_REQUIRED');
    if(!Number.isFinite(project.estimatedExternalCostRate))throw Error('INVALID_EXTERNAL_COST_RATE');
    this.simulator.simulate(project);
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
    if(project.status==='converted'){
      const already=project.convertedGroupId?await this.repo.getGroup(tenantId,project.convertedGroupId):(await this.repo.listGroups(tenantId)).find(g=>g.createdBy===project.createdBy&&g.name===project.name);
      if(already)return already;
    }
    const origin=project.launchProfile?.origin??{mode:'NEW' as const};
    const transforming=origin.mode==='TRANSFORM_REGISTERED'&&Boolean(origin.sourceGroupId);
    const groupId=transforming?String(origin.sourceGroupId):(project.convertedGroupId??`group_from_${project.id}`);
    const previous=await this.repo.getGroup(tenantId,groupId);
    if(transforming&&!previous)throw new Error('SOURCE_GROUP_NOT_FOUND');
    const group:Group=previous
      ?{...previous,name:project.name,kind:project.kind,governanceModel:project.governanceModel,status:'active',originMode:origin.mode,historicalCreatedAt:origin.historicalCreatedAt??previous.historicalCreatedAt,currentExerciseLabel:origin.currentExerciseLabel??previous.currentExerciseLabel,evolvedFromKind:previous.kind!==project.kind?previous.kind:previous.evolvedFromKind}
      :{id:groupId,tenantId,name:project.name,kind:project.kind,governanceModel:project.governanceModel,status:'active',createdBy:project.createdBy,createdAt:now(),operatingPolicy:starterGroupOperatingPolicy(),originMode:origin.mode,historicalCreatedAt:origin.historicalCreatedAt,currentExerciseLabel:origin.currentExerciseLabel};
    await this.repo.saveGroup(group);
    const ownerMembership:Membership={id:`membership_owner_${group.id}`,tenantId,groupId:group.id,userId:project.createdBy,roles:['founder','manager'],status:'active',joinedAt:group.createdAt};
    if(!(await this.repo.listMemberships(tenantId,group.id)).some(m=>m.userId===project.createdBy))await this.repo.saveMembership(ownerMembership);
    const rubricService=new RubricKnowledgeService(this.repo,this.kernel);
    for(const plan of project.rubrics??[])await rubricService.createRubric({tenantId,groupId:group.id,name:plan.name,launchKey:plan.key,launchProjectId:project.id,activityPlan:plan,source:'GROUP_CUSTOM',facets:{direction:'MIXED',obligation:'CUSTOM',medium:'CASH',refundability:'CUSTOM',replenishment:'CUSTOM',interestMode:'CUSTOM',eligibilityMode:'RULE_BASED'}});
    const obligation=this.kernel.obligations.create({tenantId,groupId:group.id,assigneeId:project.createdBy,type:transforming?'GROUP_EVOLUTION_REVIEW':'GROUP_SETUP',title:transforming?'OBLIGATION_GROUP_EVOLUTION_REVIEW':'OBLIGATION_GROUP_SETUP',priority:'normal',sourceType:'group',sourceId:group.id});
    await this.repo.saveObligation(obligation);
    await this.repo.saveProject({...project,status:'converted',convertedGroupId:group.id});
    await persistAudit(this.repo,this.kernel,{tenantId,actorId:project.createdBy,action:transforming?'GROUP_EVOLVED_FROM_PROJECT':'GROUP_CREATED_FROM_PROJECT',targetType:'group',targetId:group.id,requestId,after:group});
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
  // Naming another member is not proof that they approved this operation.
  // Multi-person approvals require independently authenticated approval records.
  if((input.approverIds??[]).some(id=>id!==ctx.actorId)) throw new Error('INDEPENDENT_APPROVAL_REQUIRED');
  const candidateIds=[ctx.actorId];
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

  async receiptPositions(tenantId:Id,groupId:Id,asOf=now()):Promise<Array<ContributionReceipt & {netAmount:number}>>{
    const cutoff=Date.parse(asOf);if(!Number.isFinite(cutoff))throw Error('INVALID_STATEMENT_DATE');
    const entries=(await this.repo.listLedgerEntries(tenantId,groupId)).filter(e=>Date.parse(e.createdAt)<=cutoff);
    const accounts=await this.repo.listLedgerAccounts(tenantId,groupId);
    const receipts=(await this.repo.listContributionReceipts(tenantId,groupId)).filter(r=>Date.parse(r.receivedAt)<=cutoff);
    return receipts.map(receipt=>{
      if(!entries.some(e=>e.id===receipt.ledgerEntryId))throw Error('RECEIPT_LEDGER_INCONSISTENT');
      const linked=new Set([receipt.ledgerEntryId]);
      let previous=-1;while(previous!==linked.size){previous=linked.size;for(const e of entries)if(e.reversalOfEntryId&&linked.has(e.reversalOfEntryId))linked.add(e.id);}
      const cashIds=new Set(accounts.filter(a=>a.code==='CASH'&&a.currency===receipt.amount.currency).map(a=>a.id));
      let netAmount=0;for(const e of entries)if(linked.has(e.id))for(const line of e.lines)if(cashIds.has(line.accountId))netAmount+=line.debit-line.credit;
      return{...receipt,netAmount};
    });
  }

  async memberStatement(tenantId:Id,groupId:Id,membershipId:Id,asOf=now()):Promise<MemberStatement>{
    const ctx=this.kernel.context.get();const group=await assertCanAccessGroup(this.repo,ctx,tenantId,groupId);
    const member=await this.repo.getMembership(tenantId,groupId,membershipId);if(!member)throw Error('MEMBERSHIP_NOT_FOUND');
    if(member.userId!==ctx.actorId)await assertCanManageGroup(this.repo,ctx,tenantId,groupId);
    const cutoff=Date.parse(asOf);if(!Number.isFinite(cutoff))throw Error('INVALID_STATEMENT_DATE');
    const timestamp=new Date(cutoff).toISOString();
    const rows=(await this.receiptPositions(tenantId,groupId,timestamp)).filter(r=>r.membershipId===membershipId);
    const receipts=rows;
    const currencies=new Set(receipts.map(r=>r.amount.currency));if(currencies.size>1)throw Error('MULTI_CURRENCY_STATEMENT_REQUIRES_FILTER');
    const currency=receipts[0]?.amount.currency??'XAF';
    const user=await this.repo.getUser(member.userId);
    return{groupId,groupName:group.name,membershipId,displayName:user?.displayName??member.userId,currency,asOf:timestamp,totalNetContributions:rows.reduce((n,r)=>n+r.netAmount,0),receipts:rows};
  }

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
    if(!cash){cash={id:`acct_cash_${encodeURIComponent(JSON.stringify([tenantId,groupId,currency]))}`,tenantId,groupId,code:'CASH',nameCode:'LEDGER_ACCOUNT_CASH',type:'asset',currency,createdAt:now()};}
    if(!memberFunds){memberFunds={id:`acct_funds_${encodeURIComponent(JSON.stringify([tenantId,groupId,currency]))}`,tenantId,groupId,code:'MEMBER_FUNDS_LIABILITY',nameCode:'LEDGER_ACCOUNT_MEMBER_FUNDS',type:'liability',currency,createdAt:now()};}
    return {cash,memberFunds};
  }

  async recordCashContribution(input:{tenantId:Id;groupId:Id;membershipId:Id;amount:number;currency?:Currency;meetingId?:Id;rubricId?:Id;lateReason?:string;approverIds?:Id[];idempotencyKey:string;effectiveAt?:string},requestId=makeId('req')):Promise<ContributionReceipt>{
    assertIntPositive('contributionAmount',input.amount); if(!input.idempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const ctx=this.kernel.context.get(); const group=await assertCanManageGroup(this.repo,ctx,input.tenantId,input.groupId);
    const sameIntent=(receipt:ContributionReceipt)=>{
      if(receipt.membershipId!==input.membershipId || receipt.amount.amount!==input.amount ||
        receipt.amount.currency!==(input.currency??'XAF') || receipt.meetingId!==input.meetingId ||
        receipt.rubricId!==input.rubricId || (input.effectiveAt!==undefined && receipt.receivedAt!==new Date(input.effectiveAt).toISOString())) throw new Error('IDEMPOTENCY_CONFLICT');
      return receipt;
    };
    const existing=await this.repo.findContributionReceiptByIdempotency(input.tenantId,input.groupId,input.idempotencyKey);
    if(existing) return sameIntent(existing);
    if(input.rubricId && !(await this.repo.getRubricDefinition(input.tenantId,input.groupId,input.rubricId))) throw new Error('RUBRIC_NOT_FOUND');
    const membership=await this.repo.getMembership(input.tenantId,input.groupId,input.membershipId); if(!membership||membership.status!=='active') throw new Error('MEMBERSHIP_NOT_FOUND');
    let latePosting:LatePostingTrace|undefined;
    if(input.meetingId){const meeting=await this.repo.getMeeting(input.tenantId,input.groupId,input.meetingId);if(!meeting) throw new Error('MEETING_NOT_FOUND');if(meeting.status==='cancelled') throw new Error('MEETING_NOT_OPEN');if(meeting.status==='closed') latePosting=await authorizeLatePosting(this.repo,group,ctx,meeting,input);}
    const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:input.groupId},{groupId:input.groupId}); if(!decision.allowed) throw new Error(decision.reason);
    const currency=input.currency??'XAF'; const accounts=await this.ensureStandardAccounts(input.tenantId,input.groupId,currency);
    const effectiveAt=input.effectiveAt===undefined?now():new Date(input.effectiveAt).toISOString(); if(!Number.isFinite(Date.parse(effectiveAt)))throw new Error('INVALID_EFFECTIVE_AT');
    const entry:LedgerEntry={id:makeId('ledger'),tenantId:input.tenantId,groupId:input.groupId,currency,descriptionCode:'LEDGER_CASH_CONTRIBUTION',sourceType:'membership_contribution',sourceId:membership.id,idempotencyKey:input.idempotencyKey,meetingId:input.meetingId,createdAt:effectiveAt,createdBy:ctx.actorId,lines:[{accountId:accounts.cash.id,debit:input.amount,credit:0,memoCode:'LEDGER_CASH_RECEIVED'},{accountId:accounts.memberFunds.id,debit:0,credit:input.amount,memoCode:'LEDGER_MEMBER_FUNDS_CREDITED'}]};
    this.validateBalanced(entry);
    const receipt:ContributionReceipt={id:makeId('receipt'),tenantId:input.tenantId,groupId:input.groupId,membershipId:membership.id,amount:{currency,amount:input.amount},paymentMethod:'cash',ledgerEntryId:entry.id,meetingId:input.meetingId,rubricId:input.rubricId,latePosting,receivedAt:entry.createdAt,receivedBy:ctx.actorId,idempotencyKey:input.idempotencyKey};
    const audit=this.kernel.audit.append({tenantId:input.tenantId,actorId:ctx.actorId,action:'CASH_CONTRIBUTION_POSTED',targetType:'ledger_entry',targetId:entry.id,requestId,after:{entry,receipt}});
    const committed=await this.repo.commitFinancialOperation({kind:'contribution',entry,receipt,accounts:[accounts.cash,accounts.memberFunds],audit});
    if(!committed.receipt)throw new Error('FINANCIAL_COMMIT_NOT_CONFIRMED');
    sameIntent(committed.receipt);
    if(committed.entry.id!==entry.id)return committed.receipt;
    this.kernel.events.publish({id:makeId('event'),type:'CASH_CONTRIBUTION_POSTED',occurredAt:now(),tenantId:input.tenantId,actorId:ctx.actorId,aggregateType:'group',aggregateId:input.groupId,payload:{membershipId:membership.id,amount:input.amount,currency,receiptId:receipt.id},idempotencyKey:input.idempotencyKey});
    return receipt;
  }

  private async ensureNamedAccount(tenantId:Id,groupId:Id,currency:Currency,code:string,type:LedgerAccount['type']):Promise<LedgerAccount>{
    const existing=(await this.repo.listLedgerAccounts(tenantId,groupId)).find(a=>a.code===code&&a.currency===currency);
    if(existing)return existing;
    return{id:'acct_'+encodeURIComponent(JSON.stringify([tenantId,groupId,currency,code])),tenantId,groupId,code,nameCode:'LEDGER_ACCOUNT_'+code,type,currency,createdAt:now()};
  }

  async recordCashMovement(input:{
    tenantId:Id;groupId:Id;amount:number;currency?:Currency;direction:'in'|'out';
    counterAccountCode:string;counterAccountType:LedgerAccount['type'];descriptionCode:string;
    sourceType:string;sourceId:Id;meetingId?:Id;idempotencyKey:string;
    kind:'cash_in'|'cash_out'|'loan_disbursement'|'loan_repayment'|'tontine_benefit'|'opening_balance'|'transfer';effectiveAt?:string;
  },requestId=makeId('req')):Promise<LedgerEntry>{
    assertIntPositive('cashMovementAmount',input.amount);
    if(!input.idempotencyKey.trim())throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const ctx=this.kernel.context.get();
    const group=await assertCanManageGroup(this.repo,ctx,input.tenantId,input.groupId);
    const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:input.groupId},{groupId:input.groupId});
    if(!decision.allowed)throw new Error(decision.reason);
    if(input.meetingId){
      const meeting=await this.repo.getMeeting(input.tenantId,input.groupId,input.meetingId);
      if(!meeting)throw new Error('MEETING_NOT_FOUND');
      if(meeting.status!=='open')throw new Error('MEETING_NOT_OPEN');
    }
    const currency=input.currency??'XAF';
    const existing=await this.repo.findLedgerEntryByIdempotency(input.tenantId,input.groupId,input.idempotencyKey);
    if(existing){
      const total=existing.lines.reduce((n,l)=>n+l.debit,0);
      if(existing.currency!==currency||existing.sourceType!==input.sourceType||existing.sourceId!==input.sourceId||
        existing.descriptionCode!==input.descriptionCode||total!==input.amount)throw new Error('IDEMPOTENCY_CONFLICT');
      return existing;
    }
    if(input.direction==='out'){
      const balance=(await this.summary(input.tenantId,input.groupId,currency)).cashBalance;
      if(balance<input.amount)throw new Error('INSUFFICIENT_CASH');
    }
    const standard=await this.ensureStandardAccounts(input.tenantId,input.groupId,currency);
    const counter=input.counterAccountCode==='MEMBER_FUNDS_LIABILITY'
      ? standard.memberFunds
      : await this.ensureNamedAccount(input.tenantId,input.groupId,currency,requiredTextCode(input.counterAccountCode),input.counterAccountType);
    const lines:LedgerLine[]=input.direction==='out'
      ? [{accountId:counter.id,debit:input.amount,credit:0,memoCode:input.descriptionCode+'_COUNTER'},
         {accountId:standard.cash.id,debit:0,credit:input.amount,memoCode:input.descriptionCode+'_CASH'}]
      : [{accountId:standard.cash.id,debit:input.amount,credit:0,memoCode:input.descriptionCode+'_CASH'},
         {accountId:counter.id,debit:0,credit:input.amount,memoCode:input.descriptionCode+'_COUNTER'}];
    const entry:LedgerEntry={id:makeId('ledger'),tenantId:input.tenantId,groupId:input.groupId,currency,
      descriptionCode:input.descriptionCode,sourceType:input.sourceType,sourceId:input.sourceId,
      idempotencyKey:input.idempotencyKey,createdAt:input.effectiveAt===undefined?now():new Date(input.effectiveAt).toISOString(),createdBy:ctx.actorId,meetingId:input.meetingId,lines};
    this.validateBalanced(entry);
    const audit=this.kernel.audit.append({tenantId:input.tenantId,actorId:ctx.actorId,action:'CASH_MOVEMENT_POSTED',
      targetType:'ledger_entry',targetId:entry.id,requestId,metadata:{kind:input.kind,direction:input.direction},after:entry});
    const committed=await this.repo.commitFinancialOperation({kind:input.kind,entry,accounts:[standard.cash,counter],audit});
    if(committed.entry.id!==entry.id){
      const total=committed.entry.lines.reduce((n,l)=>n+l.debit,0);
      if(total!==input.amount||committed.entry.sourceId!==input.sourceId)throw new Error('IDEMPOTENCY_CONFLICT');
    }
    this.kernel.events.publish({id:makeId('event'),type:'CASH_MOVEMENT_POSTED',occurredAt:now(),tenantId:input.tenantId,
      actorId:ctx.actorId,aggregateType:'group',aggregateId:group.id,payload:{entryId:committed.entry.id,kind:input.kind,amount:input.amount,currency},
      idempotencyKey:input.idempotencyKey});
    return committed.entry;
  }

  async recordAccountTransfer(input:{
    tenantId:Id;groupId:Id;amount:number;currency?:Currency;
    fromAccountCode:string;fromAccountType:LedgerAccount['type'];
    toAccountCode:string;toAccountType:LedgerAccount['type'];
    descriptionCode:string;sourceType:string;sourceId:Id;idempotencyKey:string;meetingId?:Id;
  },requestId=makeId('req')):Promise<LedgerEntry>{
    assertIntPositive('accountTransferAmount',input.amount);
    if(!input.idempotencyKey.trim())throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const ctx=this.kernel.context.get();await assertCanManageGroup(this.repo,ctx,input.tenantId,input.groupId);
    const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:input.groupId},{groupId:input.groupId});
    if(!decision.allowed)throw new Error(decision.reason);
    const currency=input.currency??'XAF';
    const existing=await this.repo.findLedgerEntryByIdempotency(input.tenantId,input.groupId,input.idempotencyKey);
    if(existing)return existing;
    const from=await this.ensureNamedAccount(input.tenantId,input.groupId,currency,requiredTextCode(input.fromAccountCode),input.fromAccountType);
    const to=await this.ensureNamedAccount(input.tenantId,input.groupId,currency,requiredTextCode(input.toAccountCode),input.toAccountType);
    if(from.id===to.id)throw new Error('TRANSFER_ACCOUNTS_MUST_DIFFER');
    const entry:LedgerEntry={id:makeId('ledger'),tenantId:input.tenantId,groupId:input.groupId,currency,
      descriptionCode:input.descriptionCode,sourceType:input.sourceType,sourceId:input.sourceId,idempotencyKey:input.idempotencyKey,
      meetingId:input.meetingId,createdAt:now(),createdBy:ctx.actorId,
      lines:[{accountId:to.id,debit:input.amount,credit:0,memoCode:input.descriptionCode+'_TO'},
             {accountId:from.id,debit:0,credit:input.amount,memoCode:input.descriptionCode+'_FROM'}]};
    this.validateBalanced(entry);
    const audit=this.kernel.audit.append({tenantId:input.tenantId,actorId:ctx.actorId,action:'ACCOUNT_TRANSFER_POSTED',
      targetType:'ledger_entry',targetId:entry.id,requestId,metadata:{from:from.code,to:to.code},after:entry});
    return (await this.repo.commitFinancialOperation({kind:'transfer',entry,accounts:[from,to],audit})).entry;
  }

  async reverseEntry(input:{tenantId:Id;groupId:Id;entryId:Id;reason:string},requestId=makeId('req')):Promise<LedgerEntry>{
    const original=await this.repo.getLedgerEntry(input.tenantId,input.groupId,input.entryId); if(!original) throw new Error('LEDGER_ENTRY_NOT_FOUND');
    const ctx=this.kernel.context.get(); await assertCanManageGroup(this.repo,ctx,input.tenantId,input.groupId); const decision=this.kernel.policy.evaluate('group:manage',{...ctx,activeGroupId:input.groupId},{groupId:input.groupId}); if(!decision.allowed) throw new Error(decision.reason);
    const key=`reversal:${original.id}`; const existing=await this.repo.findLedgerEntryByIdempotency(input.tenantId,input.groupId,key); if(existing) return existing;
    const reason=input.reason.trim(); if(!reason) throw new Error('REVERSAL_REASON_REQUIRED');
    const lines:LedgerLine[]=original.lines.map(l=>({accountId:l.accountId,debit:l.credit,credit:l.debit,memoCode:'LEDGER_REVERSAL'}));
    const reversal:LedgerEntry={id:makeId('ledger'),tenantId:input.tenantId,groupId:input.groupId,currency:original.currency,descriptionCode:'LEDGER_REVERSAL',sourceType:'ledger_reversal',sourceId:original.id,idempotencyKey:key,createdAt:now(),createdBy:ctx.actorId,meetingId:original.meetingId,reversalOfEntryId:original.id,lines};
    this.validateBalanced(reversal);
    const audit=this.kernel.audit.append({tenantId:input.tenantId,actorId:ctx.actorId,action:'LEDGER_ENTRY_REVERSED',targetType:'ledger_entry',targetId:reversal.id,requestId,metadata:{originalEntryId:original.id,reason},after:reversal});
    return (await this.repo.commitFinancialOperation({kind:'reversal',entry:reversal,accounts:[],audit})).entry;
  }

  async summary(tenantId:Id,groupId:Id,currency:Currency='XAF'):Promise<LedgerSummary>{
    const accounts=await this.repo.listLedgerAccounts(tenantId,groupId); const entries=(await this.repo.listLedgerEntries(tenantId,groupId)).filter(e=>e.currency===currency);
    const cashIds=new Set(accounts.filter(a=>a.code==='CASH'&&a.currency===currency).map(a=>a.id)); const liabilityIds=new Set(accounts.filter(a=>a.code==='MEMBER_FUNDS_LIABILITY'&&a.currency===currency).map(a=>a.id));
    let cashBalance=0,memberFundsLiability=0;
    for(const e of entries) for(const l of e.lines){if(cashIds.has(l.accountId)) cashBalance+=l.debit-l.credit;if(liabilityIds.has(l.accountId)) memberFundsLiability+=l.credit-l.debit;}
    return {currency,cashBalance,memberFundsLiability,entryCount:entries.length};
  }
}
