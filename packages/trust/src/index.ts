import type { CommitmentBandId, CommitmentReliabilityProfile, Id, ReliabilityEvidence, WorkspaceRecord } from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import {makeId} from '../../contracts/src/index.js';

const points:Record<ReliabilityEvidence['kind'],number>={
  FULFILLED_ON_TIME:1,FULFILLED_LATE:0.35,MISSED_CONFIRMED:-1,RECOVERED_ARREARS:0.5,DISPUTE_RESOLVED:0.25,RULE_BREACH_CONFIRMED:-1.25
};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=1200)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
export type SafetyCaseState='DETECTED'|'TRIAGED'|'INVESTIGATING'|'ACTIONED'|'APPEALED'|'RESOLVED';
export type SafetyCategory='IMPERSONATION'|'FAKE_SUPPLIER'|'MISLEADING_PROMISE'|'REPUTATION_MANIPULATION'|'CREDIT_FRAUD'|'PHISHING'|'PYRAMID_PONZI'|'PUBLIC_CONTENT'|'OTHER';
export type SafetyAction='NO_ACTION'|'WARN'|'LIMIT'|'SUSPEND'|'RESTORE';

export interface ReferralStructureAssessment{
  safeByConstruction:boolean;
  signals:Array<{code:string;severity:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';explanation:string}>;
  legalVerdict:false;
  requiresHumanReview:boolean;
}

/**
 * Contextual behavioural reliability. It intentionally accepts no wealth, income, appearance,
 * religion, ethnicity, sex or prestige field and never makes an admission/exclusion decision.
 */
export class CommitmentReliabilityEngine {
  profile(subjectUserId:Id,commitmentBand:CommitmentBandId,evidence:ReliabilityEvidence[]):CommitmentReliabilityProfile{
    const sample=evidence.filter(x=>x.subjectUserId===subjectUserId&&x.commitmentBand===commitmentBand);
    if(sample.length<3) return {subjectUserId,commitmentBand,rating:'INSUFFICIENT_EVIDENCE',confidence:'LOW',sampleSize:sample.length,explanationCodes:['CONTEXT_SPECIFIC','NOT_ENOUGH_OBSERVATIONS','WEALTH_NOT_USED'],advisoryOnly:true};
    let total=0,weight=0; for(const e of sample){const w=clamp(e.weight??1,0.1,3);total+=points[e.kind]*w;weight+=w;}
    const avg=total/weight; const score=Math.round(clamp(((avg+1.25)/2.25)*100,0,100));
    const rating:CommitmentReliabilityProfile['rating']=score>=80?'CONSISTENT':score>=65?'MOSTLY_CONSISTENT':score>=45?'MIXED':'CONCERNING';
    const confidence:CommitmentReliabilityProfile['confidence']=sample.length>=12?'HIGH':sample.length>=5?'MEDIUM':'LOW';
    const explanationCodes=['CONTEXT_SPECIFIC','BEHAVIOUR_ONLY','WEALTH_NOT_USED'];
    if(sample.some(x=>x.kind==='FULFILLED_ON_TIME')) explanationCodes.push('ON_TIME_HISTORY');
    if(sample.some(x=>x.kind==='RECOVERED_ARREARS')) explanationCodes.push('ARREARS_RECOVERED');
    if(sample.some(x=>x.kind==='MISSED_CONFIRMED')) explanationCodes.push('CONFIRMED_MISSES_PRESENT');
    return {subjectUserId,commitmentBand,score,rating,confidence,sampleSize:sample.length,explanationCodes,advisoryOnly:true};
  }
}

export class CommitmentTrustGraphService {
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public engine=new CommitmentReliabilityEngine()){}
  private ctx(){return this.kernel.context.get();}
  private async subject(groupId:Id,membershipId:Id,manage=false){
    const c=this.ctx(),group=await this.repo.getGroup(c.tenantId,groupId);if(!group)throw new Error('GROUP_NOT_FOUND');
    const subject=await this.repo.getMembership(c.tenantId,groupId,membershipId);if(!subject||subject.status!=='active')throw new Error('MEMBERSHIP_NOT_FOUND');
    const actor=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    const manager=group.createdBy===c.actorId||Boolean(actor?.roles.some(r=>managerRoles.has(r)));
    if(manage&&!manager)throw new Error('FORBIDDEN_SCOPE');
    if(!manage&&!manager&&subject.userId!==c.actorId)throw new Error('FORBIDDEN_SCOPE');
    return{group,subject,manager};
  }
  async addEvidence(groupId:Id,membershipId:Id,input:{commitmentBand:CommitmentBandId;kind:ReliabilityEvidence['kind'];sourceId:Id;occurredAt?:string;weight?:number}){
    const {subject}=await this.subject(groupId,membershipId,true),band=clean(input.commitmentBand,80),sourceId=clean(input.sourceId,240);
    if(!band||!sourceId)throw new Error('TRUST_EVIDENCE_FIELDS_REQUIRED');
    const allowed:ReliabilityEvidence['kind'][]=['FULFILLED_ON_TIME','FULFILLED_LATE','MISSED_CONFIRMED','RECOVERED_ARREARS','DISPUTE_RESOLVED','RULE_BREACH_CONFIRMED'];
    if(!allowed.includes(input.kind))throw new Error('INVALID_RELIABILITY_EVIDENCE_KIND');
    const occurredAt=input.occurredAt?new Date(input.occurredAt).toISOString():now();if(!Number.isFinite(Date.parse(occurredAt)))throw new Error('INVALID_OCCURRED_AT');
    const weight=input.weight===undefined?1:Number(input.weight);if(!Number.isFinite(weight)||weight<0.1||weight>3)throw new Error('INVALID_RELIABILITY_WEIGHT');
    const c=this.ctx(),stamp=now(),record:WorkspaceRecord={id:makeId('trust_evidence'),tenantId:c.tenantId,groupId,moduleId:'TRUST.GRAPH',title:'Preuve de fiabilité · '+input.kind,status:'DONE',tags:['trust-evidence','behaviour-only','band:'+band],data:{kind:'RELIABILITY_EVIDENCE',membershipId,subjectUserId:subject.userId,commitmentBand:band,evidenceKind:input.kind,weight,occurredAt,sourceId,advisoryOnly:true,wealthUsed:false,automaticDecision:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'TRUST_EVIDENCE_RECORDED',targetType:'membership',targetId:membershipId,requestId:c.requestId,metadata:{groupId,commitmentBand:band,evidenceKind:input.kind,sourceId}}));return record;
  }
  async evidence(groupId:Id,membershipId:Id){
    await this.subject(groupId,membershipId,false);const c=this.ctx();
    return (await this.repo.listWorkspaceRecords(c.tenantId,'TRUST.GRAPH',groupId)).filter(x=>x.data.kind==='RELIABILITY_EVIDENCE'&&x.data.membershipId===membershipId).sort((a,b)=>String(b.data.occurredAt??b.createdAt).localeCompare(String(a.data.occurredAt??a.createdAt)));
  }
  async profile(groupId:Id,membershipId:Id,commitmentBand:CommitmentBandId){
    const {subject}=await this.subject(groupId,membershipId,false),band=clean(commitmentBand,80);if(!band)throw new Error('COMMITMENT_BAND_REQUIRED');
    const rows=await this.evidence(groupId,membershipId),items:ReliabilityEvidence[]=rows.filter(x=>String(x.data.commitmentBand)===band).map(x=>({subjectUserId:subject.userId,commitmentBand:band,kind:String(x.data.evidenceKind) as ReliabilityEvidence['kind'],weight:Number(x.data.weight??1),occurredAt:String(x.data.occurredAt??x.createdAt),sourceId:String(x.data.sourceId??x.id)}));
    return this.engine.profile(subject.userId,band,items);
  }
  async graph(groupId:Id,membershipId:Id){
    const rows=await this.evidence(groupId,membershipId),bands=[...new Set(rows.map(x=>String(x.data.commitmentBand??'')).filter(Boolean))];
    const profiles=[];for(const band of bands)profiles.push(await this.profile(groupId,membershipId,band));
    return{membershipId,evidence:rows,profiles,policy:{advisoryOnly:true,automaticAdmission:false,automaticCreditDecision:false,automaticExclusion:false,wealthUsed:false}};
  }
}

export const assessReferralStructure=(input:{levels?:number;fundingSource?:string;rewardForRecruitingRecruiters?:boolean;promisedReturnLinkedToRecruitment?:boolean;realProductOrServiceEvidence?:boolean}):ReferralStructureAssessment=>{
  const signals:ReferralStructureAssessment['signals']=[],levels=Math.max(1,Math.trunc(Number(input.levels??1))),funding=clean(input.fundingSource,80).toUpperCase();
  if(levels>1)signals.push({code:'MULTI_LEVEL_REWARD',severity:'CRITICAL',explanation:'Les récompenses de recommandation doivent rester sur un seul niveau direct.'});
  if(input.rewardForRecruitingRecruiters)signals.push({code:'RECRUIT_RECRUITERS',severity:'CRITICAL',explanation:'La rémunération ne peut pas dépendre du recrutement de recruteurs.'});
  if(input.promisedReturnLinkedToRecruitment)signals.push({code:'RETURN_LINKED_TO_RECRUITMENT',severity:'CRITICAL',explanation:'Un rendement financier ne doit pas être promis en fonction du recrutement.'});
  if(['ENTRY_FEE','ENTRY_FEES','COTISATIONS','CONTRIBUTIONS','SAVINGS','EPARGNE'].includes(funding))signals.push({code:'MEMBER_MONEY_FUNDS_REFERRALS',severity:'CRITICAL',explanation:'Les primes ne doivent pas être financées secrètement par droits d’entrée, cotisations ou épargne.'});
  if(input.realProductOrServiceEvidence===false)signals.push({code:'ECONOMIC_ACTIVITY_UNVERIFIED',severity:'MEDIUM',explanation:'L’activité économique annoncée n’est pas documentée et doit être vérifiée.'});
  return{safeByConstruction:signals.every(x=>x.severity!=='CRITICAL'),signals,legalVerdict:false,requiresHumanReview:signals.length>0};
};

export class SafetyCaseService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private async access(groupId?:Id,manage=false){
    if(!groupId)return true;const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');
    if(g.createdBy===c.actorId)return true;const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m||manage&&!m.roles.some(r=>managerRoles.has(r)))throw new Error('FORBIDDEN_SCOPE');return true;
  }
  private canManage(groupId?:Id){return this.access(groupId,true);}
  private async get(id:Id){
    const r=await this.repo.getWorkspaceRecord(this.ctx().tenantId,id);if(!r||r.moduleId!=='SAFETY.ANTISCAM'||r.data.kind!=='SAFETY_CASE')throw new Error('SAFETY_CASE_NOT_FOUND');return r;
  }
  async report(input:{groupId?:Id;subjectType:string;subjectRef:string;category:SafetyCategory;summary:string;evidenceRef?:string;source?:string}){
    if(input.groupId)await this.access(input.groupId,false);
    const subjectType=clean(input.subjectType,80).toUpperCase(),subjectRef=clean(input.subjectRef,240),summary=clean(input.summary,1800);
    if(!subjectType||!subjectRef||!summary)throw new Error('SAFETY_REPORT_FIELDS_REQUIRED');
    const allowed:SafetyCategory[]=['IMPERSONATION','FAKE_SUPPLIER','MISLEADING_PROMISE','REPUTATION_MANIPULATION','CREDIT_FRAUD','PHISHING','PYRAMID_PONZI','PUBLIC_CONTENT','OTHER'];
    if(!allowed.includes(input.category))throw new Error('INVALID_SAFETY_CATEGORY');
    const c=this.ctx(),stamp=now(),id=makeId('safety_case'),r:WorkspaceRecord={id,tenantId:c.tenantId,groupId:input.groupId,moduleId:'SAFETY.ANTISCAM',title:'Signalement · '+input.category,status:'ACTIVE',tags:['safety-case','unverified-suspicion',input.category.toLowerCase()],data:{kind:'SAFETY_CASE',subjectType,subjectRef,category:input.category,summary,evidenceRef:clean(input.evidenceRef,500),source:clean(input.source,160),caseState:'DETECTED',findingStatus:'UNVERIFIED_SUSPICION',publicAccusation:false,financialScoreEffect:false,automaticLegalVerdict:false,createdBy:c.actorId},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);return r;
  }
  async list(groupId?:Id){
    if(groupId)await this.canManage(groupId);const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,'SAFETY.ANTISCAM',groupId);
    return rows.filter(x=>x.data.kind==='SAFETY_CASE').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  async transition(id:Id,to:SafetyCaseState,note='',evidenceRef=''){
    const r=await this.get(id);await this.canManage(r.groupId);const from=String(r.data.caseState) as SafetyCaseState;
    const allowed:Record<SafetyCaseState,SafetyCaseState[]>={DETECTED:['TRIAGED','RESOLVED'],TRIAGED:['INVESTIGATING','RESOLVED'],INVESTIGATING:['ACTIONED','RESOLVED'],ACTIONED:['APPEALED','RESOLVED'],APPEALED:['INVESTIGATING','RESOLVED'],RESOLVED:[]};
    if(!(allowed[from]??[]).includes(to))throw new Error('INVALID_SAFETY_TRANSITION');
    const data:WorkspaceRecord['data']={...r.data,caseState:to,lastReviewNote:clean(note,1200),lastEvidenceRef:clean(evidenceRef,500),lastReviewedAt:now()};
    if(to==='RESOLVED')data.findingStatus='RESOLVED_WITHOUT_AUTOMATIC_PUBLIC_FINDING';
    const next={...r,status:to==='RESOLVED'?'DONE' as const:'ACTIVE' as const,data,updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async addEvidence(id:Id,input:{summary:string;ref:string;source?:string}){
    const r=await this.get(id);await this.canManage(r.groupId);const summary=clean(input.summary,1200),ref=clean(input.ref,500);if(!summary||!ref)throw new Error('SAFETY_EVIDENCE_REQUIRED');
    const c=this.ctx(),stamp=now(),ev:WorkspaceRecord={id:makeId('safety_evidence'),tenantId:c.tenantId,groupId:r.groupId,moduleId:'SAFETY.ANTISCAM',title:'Preuve · '+r.title,status:'DONE',tags:['safety-evidence','case:'+r.id],data:{kind:'EVIDENCE_REF',caseId:r.id,summary,ref,source:clean(input.source,160),verified:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(ev);return ev;
  }
  async evidence(id:Id){
    const r=await this.get(id);await this.canManage(r.groupId);return (await this.repo.listWorkspaceRecords(this.ctx().tenantId,'SAFETY.ANTISCAM',r.groupId)).filter(x=>x.data.kind==='EVIDENCE_REF'&&x.data.caseId===id);
  }
  async decide(id:Id,input:{action:SafetyAction;reason:string;evidenceRef?:string;findingStatus?:'UNVERIFIED_SUSPICION'|'SUPPORTED_BY_REVIEW'|'NOT_SUPPORTED'}){
    const r=await this.get(id);await this.canManage(r.groupId);if(String(r.data.caseState)!=='INVESTIGATING')throw new Error('SAFETY_CASE_NOT_INVESTIGATING');
    const actions:SafetyAction[]=['NO_ACTION','WARN','LIMIT','SUSPEND','RESTORE'];if(!actions.includes(input.action))throw new Error('INVALID_SAFETY_ACTION');
    const reason=clean(input.reason,1200);if(!reason)throw new Error('SAFETY_DECISION_REASON_REQUIRED');
    const c=this.ctx(),stamp=now(),decision:WorkspaceRecord={id:makeId('safety_decision'),tenantId:c.tenantId,groupId:r.groupId,moduleId:'SAFETY.ANTISCAM',title:'Décision de revue · '+input.action,status:'DONE',tags:['safety-decision','case:'+r.id],data:{kind:'REVIEW_DECISION',caseId:r.id,action:input.action,reason,evidenceRef:clean(input.evidenceRef,500),findingStatus:input.findingStatus??'UNVERIFIED_SUSPICION',legalVerdict:false,financialScoreEffect:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(decision);
    const next={...r,data:{...r.data,caseState:'ACTIONED',lastDecisionId:decision.id,findingStatus:input.findingStatus??'UNVERIFIED_SUSPICION',publicAccusation:false,automaticLegalVerdict:false},updatedAt:stamp};await this.repo.saveWorkspaceRecord(next);return{case:next,decision};
  }
  async appeal(id:Id,input:{reason:string;evidenceRef?:string}){
    const r=await this.get(id);if(String(r.data.caseState)!=='ACTIONED')throw new Error('SAFETY_CASE_NOT_APPEALABLE');const reason=clean(input.reason,1200);if(!reason)throw new Error('APPEAL_REASON_REQUIRED');
    const c=this.ctx(),stamp=now(),appeal:WorkspaceRecord={id:makeId('safety_appeal'),tenantId:c.tenantId,groupId:r.groupId,moduleId:'SAFETY.ANTISCAM',title:'Recours · '+r.title,status:'ACTIVE',tags:['safety-appeal','case:'+r.id],data:{kind:'APPEAL',caseId:r.id,reason,evidenceRef:clean(input.evidenceRef,500),appealState:'OPEN'},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(appeal);
    const next={...r,data:{...r.data,caseState:'APPEALED',lastAppealId:appeal.id},updatedAt:stamp};await this.repo.saveWorkspaceRecord(next);return{case:next,appeal};
  }
}
