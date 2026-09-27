import type { GovernanceKnowledgeClaim, Id, RubricDefinition, RubricFacets, RubricOperatingModel, RubricCyclePreview, LaunchRubricPlan, RubricPolicies } from '../../contracts/src/index.js';
import {validateLaunchRubrics,simulateRubricPlan} from './launch-config.js';
import { makeId } from '../../contracts/src/index.js';
import type { PlatformRepository } from '../../repositories/src/index.js';
import { PlatformKernel } from '../../platform-kernel/src/index.js';

const now=()=>new Date().toISOString();
const MANAGER_ROLES=new Set(['founder','manager','admin','president','treasurer']);
const normalize=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const requireManager=async(repo:PlatformRepository,kernel:PlatformKernel,tenantId:Id,groupId:Id)=>{const ctx=kernel.context.get();if(ctx.tenantId!==tenantId)throw new Error('FORBIDDEN_SCOPE');const g=await repo.getGroup(tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');if(g.createdBy===ctx.actorId)return;const m=(await repo.listMemberships(tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');if(!m||!m.roles.some(r=>MANAGER_ROLES.has(r)))throw new Error('FORBIDDEN_SCOPE');};

export interface GovernanceClaimSuggestion { subject:string; predicate:string; value:string; confidence:number; evidenceHint:string; }

export const STARTER_RUBRIC_FACETS:Record<string,RubricFacets>={
  secours:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'EVENT_BASED'},
  epargne:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'FULLY_REFUNDABLE',replenishment:'NONE',interestMode:'CUSTOM',eligibilityMode:'RULE_BASED'},
  tontine:{direction:'BIDIRECTIONAL',obligation:'MANDATORY',medium:'HYBRID',refundability:'CONDITIONAL',replenishment:'NONE',interestMode:'NONE',eligibilityMode:'RULE_BASED'},
  pret:{direction:'OUTFLOW',obligation:'OPTIONAL',medium:'CASH',refundability:'FULLY_REFUNDABLE',replenishment:'NONE',interestMode:'CUSTOM',eligibilityMode:'RULE_BASED'},
  collation:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'NON_REFUNDABLE',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},
  aide_locale:{direction:'BIDIRECTIONAL',obligation:'CUSTOM',medium:'CASH',refundability:'CONDITIONAL',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'RULE_BASED'},
  main_levee:{direction:'MIXED',obligation:'EVENT_DRIVEN',medium:'HYBRID',refundability:'CUSTOM',replenishment:'CUSTOM',interestMode:'NONE',eligibilityMode:'EVENT_BASED'}
};

export class RubricKnowledgeService {
  constructor(private readonly repo:PlatformRepository,private readonly kernel:PlatformKernel){}

  starterCandidates(){return Object.entries(STARTER_RUBRIC_FACETS).map(([code,facets])=>({code,facets:structuredClone(facets),requiresGroupConfirmation:true}));}

  async createRubric(input:{id?:Id;tenantId:Id;groupId:Id;name:string;aliases?:string[];purpose?:string;facets:RubricFacets;source?:RubricDefinition['source'];operatingModel?:RubricOperatingModel;policies?:RubricPolicies;activityPlan?:LaunchRubricPlan;launchKey?:string;launchProjectId?:string}):Promise<RubricDefinition>{
    if(input.launchProjectId){
      const project=await this.repo.getProject(input.tenantId,input.launchProjectId),ctx=this.kernel.context.get(),group=await this.repo.getGroup(input.tenantId,input.groupId);
      const allowed=project&&ctx.tenantId===project.tenantId&&(ctx.actorId===project.createdBy||project.accessGrants?.some(g=>g.userId===ctx.actorId&&g.capabilities.includes('CONVERT')));
      const planned=project?.rubrics?.find(p=>p.key===input.launchKey);
      const expectedGroupId=project?.launchProfile?.origin.mode==='TRANSFORM_REGISTERED'?project.launchProfile.origin.sourceGroupId:`group_from_${project?.id}`;
      if(!allowed||!group||group.createdBy!==project.createdBy||group.id!==expectedGroupId||!planned||JSON.stringify(planned)!==JSON.stringify(input.activityPlan))throw Error('FORBIDDEN_SCOPE');
    }else await requireManager(this.repo,this.kernel,input.tenantId,input.groupId);
    const timestamp=now(); const name=input.name.trim(); if(!name)throw new Error('RUBRIC_NAME_REQUIRED');
    const activityPlan=input.activityPlan?validateLaunchRubrics([input.activityPlan])[0]:undefined;
    const launchHash=input.launchKey?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([input.tenantId,input.groupId,input.launchKey])))),b=>b.toString(16).padStart(2,'0')).join(''):undefined;
    const id=launchHash?'rubric_launch_'+launchHash:(input.id?.trim()||makeId('rubric'));
    const existing=(input.launchKey||input.id)?await this.repo.getRubricDefinition(input.tenantId,input.groupId,id):undefined;if(existing){if(existing.name!==name)throw Error('IDEMPOTENCY_CONFLICT');return existing;}
    const rubric:RubricDefinition={id,tenantId:input.tenantId,groupId:input.groupId,name,aliases:[...new Set((input.aliases??[]).map(x=>x.trim()).filter(Boolean))],purpose:input.purpose?.trim()||undefined,facets:structuredClone(input.facets),operatingModel:input.operatingModel?structuredClone(input.operatingModel):undefined,policies:input.policies?structuredClone(input.policies):undefined,activityPlan,status:input.launchProjectId?'ACTIVE':'DRAFT',source:input.source??'GROUP_CUSTOM',version:1,createdAt:timestamp,updatedAt:timestamp};
    await this.repo.saveRubricDefinition(rubric); const audit=this.kernel.audit.append({tenantId:input.tenantId,actorId:this.kernel.context.get().actorId,action:'RUBRIC_CREATED',targetType:'rubric',targetId:rubric.id,after:rubric,requestId:this.kernel.context.get().requestId});await this.repo.saveAudit(audit);return structuredClone(rubric);
  }

  async listRubrics(tenantId:Id,groupId:Id):Promise<RubricDefinition[]>{
    const ctx=this.kernel.context.get();if(ctx.tenantId!==tenantId)throw new Error('FORBIDDEN_SCOPE');
    const group=await this.repo.getGroup(tenantId,groupId);if(!group)throw new Error('GROUP_NOT_FOUND');
    if(group.createdBy!==ctx.actorId){
      const membership=(await this.repo.listMemberships(tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
      if(!membership)throw new Error('FORBIDDEN_SCOPE');
    }
    return this.repo.listRubricDefinitions(tenantId,groupId);
  }

  async updateActivityPlan(tenantId:Id,groupId:Id,rubricId:Id,input:unknown):Promise<RubricDefinition>{
    await requireManager(this.repo,this.kernel,tenantId,groupId);
    const current=await this.repo.getRubricDefinition(tenantId,groupId,rubricId);if(!current)throw Error('RUBRIC_NOT_FOUND');
    const plan=validateLaunchRubrics([input])[0]!;
    if(current.activityPlan&&plan.key!==current.activityPlan.key)throw Error('INVALID_RUBRIC_KEY');
    simulateRubricPlan(plan);
    const updated:RubricDefinition={...current,name:plan.name,activityPlan:plan,version:current.version+1,updatedAt:now()};
    await this.repo.saveRubricDefinition(updated);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId,actorId:this.kernel.context.get().actorId,action:'RUBRIC_ACTIVITY_CONFIGURATION_UPDATED',targetType:'rubric',targetId:rubricId,before:current,after:updated,requestId:this.kernel.context.get().requestId}));
    return updated;
  }

  async updateOperatingModel(input:{tenantId:Id;groupId:Id;rubricId:Id;model:RubricOperatingModel}):Promise<RubricDefinition>{
    await requireManager(this.repo,this.kernel,input.tenantId,input.groupId);
    const current=await this.repo.getRubricDefinition(input.tenantId,input.groupId,input.rubricId); if(!current) throw new Error('RUBRIC_NOT_FOUND');
    const model=structuredClone(input.model);
    if(!['UNKNOWN','ALIGNED','DIFFERS','MIXED'].includes(model.ruleRealityStatus)) throw new Error('INVALID_RULE_REALITY_STATUS');
    if(!['OPEN','FIXED_TOTAL','PER_MEMBER_FIXED','CUSTOM'].includes(model.targetMode)) throw new Error('INVALID_RUBRIC_TARGET_MODE');
    if(!['LEAVE_SHORT','SOLIDARITY_COVERAGE','CONDITIONAL_SOLIDARITY','CUSTOM'].includes(model.shortfallHandling)) throw new Error('INVALID_SHORTFALL_HANDLING');
    if(!['COLLECTED_ONLY','FIXED_TARGET_IF_COVERED','CUSTOM'].includes(model.payoutMode)) throw new Error('INVALID_PAYOUT_MODE');
    const values=[model.targetAmount,model.perMemberAmount].filter(Boolean) as Array<{currency:string;amount:number}>;
    for(const money of values){if(!Number.isFinite(money.amount)||money.amount<0||(money.currency==='XAF'&&!Number.isInteger(money.amount)))throw new Error('INVALID_RUBRIC_MONEY');}
    const updated:RubricDefinition={...current,operatingModel:{...model,confirmedAt:now(),confirmedBy:this.kernel.context.get().actorId},version:current.version+1,updatedAt:now()};
    await this.repo.saveRubricDefinition(updated);
    const audit=this.kernel.audit.append({tenantId:input.tenantId,actorId:this.kernel.context.get().actorId,action:'RUBRIC_OPERATING_MODEL_UPDATED',targetType:'rubric',targetId:current.id,before:current.operatingModel,after:updated.operatingModel,requestId:this.kernel.context.get().requestId}); await this.repo.saveAudit(audit);
    return structuredClone(updated);
  }

  async updatePolicies(input:{tenantId:Id;groupId:Id;rubricId:Id;policies:RubricPolicies}):Promise<RubricDefinition>{
    await requireManager(this.repo,this.kernel,input.tenantId,input.groupId);
    const current=await this.repo.getRubricDefinition(input.tenantId,input.groupId,input.rubricId);if(!current)throw new Error('RUBRIC_NOT_FOUND');
    const policies=structuredClone(input.policies);
    if(policies.loan){
      if(policies.loan.interestBase!=='PRINCIPAL_ONLY'||policies.loan.noInterestOnInterest!==true)throw new Error('INTEREST_ON_INTEREST_FORBIDDEN');
      if(policies.loan.rateBasisPointsPerPeriod!==undefined&&(!Number.isFinite(policies.loan.rateBasisPointsPerPeriod)||policies.loan.rateBasisPointsPerPeriod<0))throw new Error('INVALID_LOAN_RATE');
      if(policies.loan.overdue){
        const o=policies.loan.overdue;
        if(o.maxDurationPeriods!==undefined&&(!Number.isSafeInteger(o.maxDurationPeriods)||o.maxDurationPeriods<1))throw new Error('INVALID_LOAN_MAX_DURATION');
        if(o.gracePeriods!==undefined&&(!Number.isSafeInteger(o.gracePeriods)||o.gracePeriods<0))throw new Error('INVALID_LOAN_GRACE');
        if(o.penaltyRateBasisPointsPerPeriod!==undefined&&(!Number.isFinite(o.penaltyRateBasisPointsPerPeriod)||o.penaltyRateBasisPointsPerPeriod<0))throw new Error('INVALID_LOAN_PENALTY_RATE');
        const allowed=new Set(['TONTINE','SOLIDARITY','GUARANTOR','OTHER']);for(const source of o.recoverFrom??[])if(!allowed.has(source))throw new Error('INVALID_LOAN_RECOVERY_SOURCE');
      }
      for(const special of policies.loan.specialLoans??[]){
        if(!special.key?.trim()||!special.label?.trim())throw new Error('INVALID_SPECIAL_LOAN');
        if(!Number.isFinite(special.rateBasisPointsPerPeriod)||special.rateBasisPointsPerPeriod<0)throw new Error('INVALID_SPECIAL_LOAN_RATE');
        if(special.maxDurationPeriods!==undefined&&(!Number.isSafeInteger(special.maxDurationPeriods)||special.maxDurationPeriods<1))throw new Error('INVALID_SPECIAL_LOAN_DURATION');
      }
    }
    if(policies.fine){
      if(!Array.isArray(policies.fine.rules)||policies.fine.rules.length>100)throw new Error('INVALID_FINE_GRID');
      for(const rule of policies.fine.rules){
        if(!rule.key?.trim()||!rule.label?.trim())throw new Error('INVALID_FINE_RULE');
        if(!Number.isSafeInteger(rule.amount)||rule.amount<0)throw new Error('INVALID_FINE_AMOUNT');
      }
    }
    if(policies.yield){
      if(policies.yield.distributableShareBasisPoints!==undefined&&(!Number.isInteger(policies.yield.distributableShareBasisPoints)||policies.yield.distributableShareBasisPoints<0||policies.yield.distributableShareBasisPoints>10000))throw new Error('INVALID_YIELD_SHARE');
      for(const value of Object.values(policies.yield.coefficientSchedule??{}))if(!Number.isFinite(value)||value<0)throw new Error('INVALID_YIELD_COEFFICIENT');
    }
    if(policies.lifecycle?.visibility==='FIRST_N_SESSIONS'&&(!Number.isInteger(policies.lifecycle.activeFirstSessions)||Number(policies.lifecycle.activeFirstSessions)<=0))throw new Error('INVALID_RUBRIC_LIFECYCLE');
    const updated:RubricDefinition={...current,policies,version:current.version+1,updatedAt:now()};
    await this.repo.saveRubricDefinition(updated);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:input.tenantId,actorId:this.kernel.context.get().actorId,action:'RUBRIC_POLICIES_UPDATED',targetType:'rubric',targetId:current.id,before:current.policies,after:policies,requestId:this.kernel.context.get().requestId}));
    return structuredClone(updated);
  }

  async previewCycle(input:{tenantId:Id;groupId:Id;rubricId:Id;memberCount:number;collectedFromMembers:number;solidarityCoverageAmount?:number;beneficiaryDisbursement?:number}):Promise<RubricCyclePreview>{
    await requireManager(this.repo,this.kernel,input.tenantId,input.groupId);
    const rubric=await this.repo.getRubricDefinition(input.tenantId,input.groupId,input.rubricId); if(!rubric) throw new Error('RUBRIC_NOT_FOUND');
    const model=rubric.operatingModel; if(!model) throw new Error('RUBRIC_OPERATING_MODEL_REQUIRED');
    if(!Number.isInteger(input.memberCount)||input.memberCount<0) throw new Error('INVALID_MEMBER_COUNT');
    if(!Number.isFinite(input.collectedFromMembers)||input.collectedFromMembers<0) throw new Error('INVALID_COLLECTED_AMOUNT');
    const currency=model.targetAmount?.currency??model.perMemberAmount?.currency??'XAF';
    if(currency==='XAF'&&!Number.isInteger(input.collectedFromMembers)) throw new Error('INVALID_COLLECTED_AMOUNT');
    let expectedTotal=input.collectedFromMembers;
    if(model.targetMode==='FIXED_TOTAL') expectedTotal=model.targetAmount?.amount??0;
    else if(model.targetMode==='PER_MEMBER_FIXED') expectedTotal=(model.perMemberAmount?.amount??0)*input.memberCount;
    else if(model.targetMode==='CUSTOM'&&model.targetAmount) expectedTotal=model.targetAmount.amount;
    const memberShortfall=Math.max(0,expectedTotal-input.collectedFromMembers);
    let solidarityCoverage=0;
    if(model.shortfallHandling==='SOLIDARITY_COVERAGE') solidarityCoverage=memberShortfall;
    else if(model.shortfallHandling==='CONDITIONAL_SOLIDARITY'||model.shortfallHandling==='CUSTOM') solidarityCoverage=Math.max(0,input.solidarityCoverageAmount??0);
    if(currency==='XAF'&&!Number.isInteger(solidarityCoverage)) throw new Error('INVALID_SOLIDARITY_COVERAGE');
    const availableForBeneficiary=input.collectedFromMembers+solidarityCoverage;
    let beneficiaryDisbursement=0;
    if(model.payoutMode==='COLLECTED_ONLY') beneficiaryDisbursement=input.collectedFromMembers;
    else if(model.payoutMode==='FIXED_TARGET_IF_COVERED') beneficiaryDisbursement=Math.min(expectedTotal,availableForBeneficiary);
    else beneficiaryDisbursement=Math.max(0,input.beneficiaryDisbursement??Math.min(expectedTotal,availableForBeneficiary));
    if(beneficiaryDisbursement>availableForBeneficiary) throw new Error('DISBURSEMENT_EXCEEDS_AVAILABLE');
    if(currency==='XAF'&&!Number.isInteger(beneficiaryDisbursement)) throw new Error('INVALID_BENEFICIARY_DISBURSEMENT');
    const notes:string[]=[];
    if(model.writtenRule&&model.observedPractice&&model.ruleRealityStatus!=='ALIGNED') notes.push('WRITTEN_RULE_DIFFERS_FROM_OBSERVED_PRACTICE');
    if(memberShortfall>0) notes.push('MEMBER_SHORTFALL_RECORDED_SEPARATELY');
    if(solidarityCoverage>0) notes.push('GROUP_SOLIDARITY_COVERAGE_RECORDED_SEPARATELY');
    if(model.immediateFullPayout) notes.push('IMMEDIATE_FULL_PAYOUT_CONFIGURED');
    return {rubricId:rubric.id,currency,memberCount:input.memberCount,expectedTotal,collectedFromMembers:input.collectedFromMembers,memberShortfall,memberPositionDisplay:-memberShortfall,solidarityCoverage,availableForBeneficiary,beneficiaryDisbursement,remainingRubricBalance:availableForBeneficiary-beneficiaryDisbursement,memberDebtAfterCoverage:memberShortfall,notes};
  }

  suggestClaimsFromGovernanceText(text:string):GovernanceClaimSuggestion[]{
    const t=normalize(text); const out:GovernanceClaimSuggestion[]=[]; const add=(subject:string,predicate:string,value:string,confidence:number,evidenceHint:string)=>{if(!out.some(x=>x.subject===subject&&x.predicate===predicate&&x.value===value))out.push({subject,predicate,value,confidence,evidenceHint});};
    if(/secours|solidarit|fonds social/.test(t)) add('SECOURS','RUBRIC_PRESENT','true',0.8,'TERM_MATCH');
    if(/main levee|assistance/.test(t)) add('ASSISTANCE','RUBRIC_PRESENT','true',0.75,'TERM_MATCH');
    if(/pret|emprunt|credit/.test(t)) add('PRET','RUBRIC_PRESENT','true',0.8,'TERM_MATCH');
    if(/interet|taux de/.test(t)) add('PRET','INTEREST_MODE','PRESENT_OR_CONFIGURED',0.65,'INTEREST_TERM');
    if(/rembours/.test(t)) add('UNKNOWN_RUBRIC','REFUNDABILITY','REFUND_OR_REPAYMENT_RULE_PRESENT',0.65,'REFUND_TERM');
    if(/prorata|au prorata|reconstit|combler|renflou/.test(t)) add('UNKNOWN_RUBRIC','REPLENISHMENT','PRO_RATA_OR_REPLENISHMENT_RULE_POSSIBLE',0.7,'REPLENISHMENT_TERM');
    if(/avaliste|garant/.test(t)) add('PRET','GUARANTEE_RULE','GUARANTOR_REQUIRED_OR_REFERENCED',0.8,'GUARANTOR_TERM');
    if(/epargne/.test(t)) add('EPARGNE','RUBRIC_PRESENT','true',0.8,'TERM_MATCH');
    if(/tontine/.test(t)) add('TONTINE','RUBRIC_PRESENT','true',0.8,'TERM_MATCH');
    if(/nature|huile|savon|produit/.test(t)) add('UNKNOWN_RUBRIC','MEDIUM','IN_KIND_POSSIBLE',0.55,'IN_KIND_TERM');
    return out;
  }

  async recordClaim(input:{tenantId:Id;groupId?:Id;sourceFingerprint:string;sourceKind:GovernanceKnowledgeClaim['sourceKind'];suggestion:GovernanceClaimSuggestion}):Promise<GovernanceKnowledgeClaim>{
    if(input.groupId) await requireManager(this.repo,this.kernel,input.tenantId,input.groupId); else if(this.kernel.context.get().tenantId!==input.tenantId) throw new Error('FORBIDDEN_SCOPE');
    const claim:GovernanceKnowledgeClaim={id:makeId('claim'),tenantId:input.tenantId,groupId:input.groupId,sourceFingerprint:input.sourceFingerprint,sourceKind:input.sourceKind,subject:input.suggestion.subject,predicate:input.suggestion.predicate,value:input.suggestion.value,confidence:Math.max(0,Math.min(1,input.suggestion.confidence)),status:'OBSERVED',evidenceHint:input.suggestion.evidenceHint,createdAt:now()};
    await this.repo.saveGovernanceKnowledgeClaim(claim); return structuredClone(claim);
  }

  async reviewClaim(claimId:Id,status:'VALIDATED'|'REJECTED'):Promise<GovernanceKnowledgeClaim>{
    const all=await this.repo.listGovernanceKnowledgeClaims(this.kernel.context.get().tenantId); const claim=all.find(x=>x.id===claimId); if(!claim)throw new Error('CLAIM_NOT_FOUND'); if(claim.groupId)await requireManager(this.repo,this.kernel,claim.tenantId,claim.groupId);
    const updated={...claim,status,reviewedAt:now(),reviewedBy:this.kernel.context.get().actorId} satisfies GovernanceKnowledgeClaim; await this.repo.saveGovernanceKnowledgeClaim(updated);return structuredClone(updated);
  }
}
