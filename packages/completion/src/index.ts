import type {
  Currency, Id, LedgerEntry, Membership, Obligation, WorkspaceRecord, WorkspaceStatus
} from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';
import type { PlatformRepository } from '../../repositories/src/index.js';
import type { PlatformKernel } from '../../platform-kernel/src/index.js';

export type CompletionKind =
  | 'IDENTITY_CLAIM'
  | 'TONTINE_CYCLE'
  | 'TONTINE_SHARE'
  | 'OBLIGATION_PLAN'
  | 'LOAN'
  | 'SAVINGS_PLAN'
  | 'GOVERNANCE_DECISION'
  | 'IMPORT_BATCH'
  | 'COMMUNITY_THREAD'
  | 'MARKET_ORDER'
  | 'AMOUNT_EXPLANATION'
  | 'TONTINE_SCHEDULE'
  | 'SCENARIO'
  | 'DOCUMENT'
  | 'OCR_DRAFT'
  | 'VOICE_DRAFT'
  | 'OFFLINE_SNAPSHOT'
  | 'CONFLICT'
  | 'RELAY_ENVELOPE'
  | 'CALENDAR_EVENT'
  | 'NOTIFICATION_PREF'
  | 'RULE_COMPARISON'
  | 'APPROVAL_REQUEST'
  | 'ANOMALY'
  | 'GROUP_BUY'
  | 'SKILL_PROFILE'
  | 'ACCESSIBILITY_PROFILE'
  | 'ACADEMY_EXERCISE'
  | 'BACKUP_PROOF'
  | 'READINESS_PASSPORT'
  | 'EXPECTATION_TRACE'
  | 'DIFFICULT_DAY'
  | 'GROUP_EXERCISE';

type Primitive = string | number | boolean | null;
export type CompletionData = Record<string, Primitive>;

interface WorkflowSpec {
  moduleId: string;
  initial: string;
  states: readonly string[];
  transitions: Readonly<Record<string, readonly string[]>>;
  managerOnly: boolean;
}

const flow = (
  moduleId: string,
  states: readonly string[],
  transitions: Readonly<Record<string, readonly string[]>>,
  managerOnly = true
): WorkflowSpec => ({ moduleId, initial: states[0]!, states, transitions, managerOnly });

export const COMPLETION_WORKFLOWS: Record<CompletionKind, WorkflowSpec> = {
  IDENTITY_CLAIM: flow('CORE.IDENTITY.CLAIM', ['DRAFT','UNDER_REVIEW','APPROVED','REJECTED'], {
    DRAFT:['UNDER_REVIEW'], UNDER_REVIEW:['APPROVED','REJECTED'], REJECTED:['UNDER_REVIEW'], APPROVED:[]
  }, false),
  TONTINE_CYCLE: flow('CORE.ROTATING_TONTINE', ['DRAFT','VALIDATED','ACTIVE','COMPLETED','CANCELLED'], {
    DRAFT:['VALIDATED','CANCELLED'], VALIDATED:['ACTIVE','CANCELLED'], ACTIVE:['COMPLETED','CANCELLED'], COMPLETED:[], CANCELLED:[]
  }),
  TONTINE_SHARE: flow('MEETING.BENEFICIARIES', ['REGISTERED','SCHEDULED','SERVED','REPLACED','CANCELLED'], {
    REGISTERED:['SCHEDULED','CANCELLED'], SCHEDULED:['SCHEDULED','SERVED','REPLACED','CANCELLED'], REPLACED:['SCHEDULED','CANCELLED'], SERVED:[], CANCELLED:[]
  }),
  OBLIGATION_PLAN: flow('FINANCE.OBLIGATIONS', ['DRAFT','ACTIVE','COMPLETED','CANCELLED'], {
    DRAFT:['ACTIVE','CANCELLED'], ACTIVE:['COMPLETED','CANCELLED'], COMPLETED:[], CANCELLED:[]
  }),
  LOAN: flow('FINANCE.LOANS', ['DRAFT','SUBMITTED','APPROVED','DISBURSED','REPAYING','CLOSED','REJECTED','CANCELLED'], {
    DRAFT:['SUBMITTED','CANCELLED'], SUBMITTED:['APPROVED','REJECTED','CANCELLED'], APPROVED:['DISBURSED','CANCELLED'],
    DISBURSED:['REPAYING','CLOSED'], REPAYING:['REPAYING','CLOSED'], CLOSED:[], REJECTED:[], CANCELLED:[]
  }),
  SAVINGS_PLAN: flow('RUBRIC.SAVINGS', ['DRAFT','ACTIVE','SETTLED','CANCELLED'], {
    DRAFT:['ACTIVE','CANCELLED'], ACTIVE:['SETTLED','CANCELLED'], SETTLED:[], CANCELLED:[]
  }),
  GOVERNANCE_DECISION: flow('GOVERNANCE.VOTE', ['DRAFT','OPEN','APPROVED','REJECTED','EXPIRED','CANCELLED'], {
    DRAFT:['OPEN','CANCELLED'], OPEN:['APPROVED','REJECTED','EXPIRED','CANCELLED'], APPROVED:[], REJECTED:[], EXPIRED:[], CANCELLED:[]
  }),
  IMPORT_BATCH: flow('PAPER.IMPORT', ['UPLOADED','MAPPED','REVIEWED','APPROVED','APPLIED','REJECTED'], {
    UPLOADED:['MAPPED','REJECTED'], MAPPED:['REVIEWED','REJECTED'], REVIEWED:['APPROVED','REJECTED'], APPROVED:['APPLIED','REJECTED'], APPLIED:[], REJECTED:[]
  }),
  COMMUNITY_THREAD: flow('COMMUNITY.FORUM', ['OPEN','RESOLVED','LOCKED','ARCHIVED'], {
    OPEN:['RESOLVED','LOCKED','ARCHIVED'], RESOLVED:['OPEN','ARCHIVED'], LOCKED:['OPEN','ARCHIVED'], ARCHIVED:[]
  }, false),
  MARKET_ORDER: flow('MARKETPLACE.CORE', ['DRAFT','QUOTED','CONFIRMED','PARTIAL','DELIVERED','RETURNED','DISPUTED','CANCELLED'], {
    DRAFT:['QUOTED','CANCELLED'], QUOTED:['CONFIRMED','CANCELLED'], CONFIRMED:['PARTIAL','DELIVERED','DISPUTED','CANCELLED'],
    PARTIAL:['PARTIAL','DELIVERED','DISPUTED'], DELIVERED:['RETURNED','DISPUTED'], RETURNED:['DISPUTED'], DISPUTED:['DELIVERED','RETURNED','CANCELLED'], CANCELLED:[]
  }),
  AMOUNT_EXPLANATION: flow('FINANCE.LEDGER', ['ACTIVE','ARCHIVED'], {ACTIVE:['ARCHIVED'],ARCHIVED:[]}, false),
  TONTINE_SCHEDULE: flow('MEETING.BENEFICIARIES', ['DRAFT','PROPOSED','VALIDATED','SUPERSEDED'], {
    DRAFT:['PROPOSED'], PROPOSED:['VALIDATED','SUPERSEDED'], VALIDATED:['SUPERSEDED'], SUPERSEDED:[]
  }),
  SCENARIO: flow('GROUP.LAUNCH.SIMULATION', ['DRAFT','COMPARED','PROMOTED','ARCHIVED'], {
    DRAFT:['COMPARED','ARCHIVED'], COMPARED:['PROMOTED','ARCHIVED'], PROMOTED:['ARCHIVED'], ARCHIVED:[]
  }),
  DOCUMENT: flow('GOVERNANCE.DOCUMENTS', ['DRAFT','ACTIVE','SUPERSEDED','REVOKED'], {
    DRAFT:['ACTIVE','REVOKED'], ACTIVE:['SUPERSEDED','REVOKED'], SUPERSEDED:[], REVOKED:[]
  }),
  OCR_DRAFT: flow('PAPER.BRIDGE', ['CAPTURED','RECOGNIZED','REVIEWED','IMPORTED','REJECTED'], {
    CAPTURED:['RECOGNIZED','REJECTED'], RECOGNIZED:['REVIEWED','REJECTED'], REVIEWED:['IMPORTED','REJECTED'], IMPORTED:[], REJECTED:[]
  }),
  VOICE_DRAFT: flow('EXPERIENCE.ORAL', ['CAPTURED','TRANSCRIBED','CONFIRMED','REJECTED'], {
    CAPTURED:['TRANSCRIBED','REJECTED'], TRANSCRIBED:['CONFIRMED','REJECTED'], CONFIRMED:[], REJECTED:[]
  }, false),
  OFFLINE_SNAPSHOT: flow('OFFLINE.OUTBOX', ['PREPARED','STALE','SYNCED','DISCARDED'], {
    PREPARED:['STALE','SYNCED','DISCARDED'], STALE:['SYNCED','DISCARDED'], SYNCED:[], DISCARDED:[]
  }, false),
  CONFLICT: flow('DATA.QUALITY', ['OPEN','RESOLVED','REJECTED'], {OPEN:['RESOLVED','REJECTED'],RESOLVED:[],REJECTED:[]}),
  RELAY_ENVELOPE: flow('RELAY.COMMUNITY', ['PREPARED','TRANSFERRED','QUARANTINED','ACCEPTED','REJECTED','EXPIRED'], {
    PREPARED:['TRANSFERRED','EXPIRED'], TRANSFERRED:['QUARANTINED','EXPIRED'], QUARANTINED:['ACCEPTED','REJECTED','EXPIRED'],
    ACCEPTED:[],REJECTED:[],EXPIRED:[]
  }, false),
  CALENDAR_EVENT: flow('CALENDAR.UNIFIED', ['ACTIVE','CANCELLED'], {ACTIVE:['CANCELLED'],CANCELLED:[]}, false),
  NOTIFICATION_PREF: flow('NOTIFY.MULTICHANNEL', ['ACTIVE','PAUSED'], {ACTIVE:['PAUSED'],PAUSED:['ACTIVE']}, false),
  RULE_COMPARISON: flow('RUBRIC.LIVING_RULES', ['DRAFT','REVIEWED','ARCHIVED'], {DRAFT:['REVIEWED','ARCHIVED'],REVIEWED:['ARCHIVED'],ARCHIVED:[]}),
  APPROVAL_REQUEST: flow('GOVERNANCE.VOTE', ['OPEN','APPROVED','REJECTED','EXPIRED','CANCELLED'], {
    OPEN:['APPROVED','REJECTED','EXPIRED','CANCELLED'],APPROVED:[],REJECTED:[],EXPIRED:[],CANCELLED:[]
  }),
  ANOMALY: flow('DATA.QUALITY', ['OPEN','EXPLAINED','RESOLVED','DISMISSED'], {
    OPEN:['EXPLAINED','RESOLVED','DISMISSED'],EXPLAINED:['RESOLVED','DISMISSED'],RESOLVED:[],DISMISSED:[]
  }),
  GROUP_BUY: flow('MARKETPLACE.GROUP_BUY', ['DRAFT','OPEN','THRESHOLD_MET','APPROVED','ORDERED','FULFILLED','CANCELLED'], {
    DRAFT:['OPEN','CANCELLED'],OPEN:['THRESHOLD_MET','CANCELLED'],THRESHOLD_MET:['APPROVED','CANCELLED'],APPROVED:['ORDERED','CANCELLED'],
    ORDERED:['FULFILLED','CANCELLED'],FULFILLED:[],CANCELLED:[]
  }),
  SKILL_PROFILE: flow('COMMUNITY.PRO_HUBS', ['ACTIVE','PAUSED','REMOVED'], {ACTIVE:['PAUSED','REMOVED'],PAUSED:['ACTIVE','REMOVED'],REMOVED:[]}, false),
  ACCESSIBILITY_PROFILE: flow('EXPERIENCE.ULTRA_SIMPLE', ['ACTIVE','PAUSED'], {ACTIVE:['PAUSED'],PAUSED:['ACTIVE']}, false),
  ACADEMY_EXERCISE: flow('LEARNING.MANAGER_ACADEMY', ['DRAFT','ACTIVE','COMPLETED','RESET'], {
    DRAFT:['ACTIVE'],ACTIVE:['COMPLETED','RESET'],COMPLETED:['RESET'],RESET:['ACTIVE']
  }, false),
  BACKUP_PROOF: flow('BACKUP.D1_RESTORE', ['CREATED','VERIFIED','RESTORED_TEST','FAILED'], {
    CREATED:['VERIFIED','FAILED'],VERIFIED:['RESTORED_TEST','FAILED'],RESTORED_TEST:[],FAILED:['CREATED']
  }),
  READINESS_PASSPORT: flow('DATA.QUALITY', ['DRAFT','READY','BLOCKED','ARCHIVED'], {
    DRAFT:['READY','BLOCKED','ARCHIVED'],READY:['BLOCKED','ARCHIVED'],BLOCKED:['READY','ARCHIVED'],ARCHIVED:[]
  }),
  EXPECTATION_TRACE: flow('DATA.QUALITY', ['REQUESTED','SPECIFIED','IMPLEMENTED','TESTED','ACCEPTED','REOPENED'], {
    REQUESTED:['SPECIFIED'],SPECIFIED:['IMPLEMENTED','REOPENED'],IMPLEMENTED:['TESTED','REOPENED'],TESTED:['ACCEPTED','REOPENED'],
    ACCEPTED:['REOPENED'],REOPENED:['SPECIFIED']
  }, false),
  GROUP_EXERCISE: flow('GROUP.EXERCISE', ['PREPARED','OPEN','CLOSING','CLOSED','CARRIED_FORWARD'], {
    PREPARED:['OPEN'],OPEN:['CLOSING'],CLOSING:['OPEN','CLOSED'],CLOSED:['CARRIED_FORWARD'],CARRIED_FORWARD:[]
  }),
  DIFFICULT_DAY: flow('SUPPORT.CENTER', ['OPEN','AUTHORIZED','REGULARIZATION_PENDING','RESOLVED','REJECTED'], {
    OPEN:['AUTHORIZED','REJECTED'],AUTHORIZED:['REGULARIZATION_PENDING','RESOLVED'],REGULARIZATION_PENDING:['RESOLVED'],RESOLVED:[],REJECTED:[]
  }, false)
};

const MANAGEMENT_ROLES = new Set(['founder','manager','admin','president','treasurer']);
const now = () => new Date().toISOString();
const finiteInt = (name:string,value:number,min=0):number => {
  if(!Number.isSafeInteger(value) || value<min) throw new Error('INVALID_'+name.toUpperCase());
  return value;
};
const requiredText = (name:string,value:unknown):string => {
  const text=String(value??'').trim(); if(!text) throw new Error(name.toUpperCase()+'_REQUIRED'); return text;
};
const encodeValue = (value:unknown):Primitive => {
  if(value===null || typeof value==='string' || typeof value==='boolean') return value;
  if(typeof value==='number'){ if(!Number.isFinite(value)) throw new Error('INVALID_NON_FINITE_VALUE'); return value; }
  if(value===undefined) return null;
  return JSON.stringify(value);
};
export const decodeJson = <T>(value:Primitive|undefined,fallback:T):T => {
  if(typeof value!=='string') return fallback;
  try{return JSON.parse(value) as T;}catch{return fallback;}
};

export interface CompletionRecord extends WorkspaceRecord {
  data: CompletionData;
}

const workspaceStatus = (state:string):WorkspaceStatus => {
  if(['DRAFT','UPLOADED','CAPTURED','REQUESTED','SPECIFIED','PREPARED','CREATED','REGISTERED'].includes(state)) return 'DRAFT';
  if(['DONE','COMPLETED','CLOSED','FULFILLED','ACCEPTED','RESOLVED','RESTORED_TEST','APPLIED','SERVED'].includes(state)) return 'DONE';
  if(['ARCHIVED','REVOKED','CANCELLED','REJECTED','REMOVED','SUPERSEDED','EXPIRED','DISCARDED'].includes(state)) return 'ARCHIVED';
  return 'ACTIVE';
};

const audit = async (
  repo:PlatformRepository,kernel:PlatformKernel,action:string,targetId:Id,after:unknown,groupId?:Id
):Promise<void> => {
  const ctx=kernel.context.get();
  const event=kernel.audit.append({
    tenantId:ctx.tenantId,actorId:ctx.actorId,action,targetType:'completion_record',targetId,
    requestId:ctx.requestId,metadata:groupId?{groupId}:undefined,after
  });
  await repo.saveAudit(event);
};

export interface TontineScheduleConstraint {
  shareId: Id;
  preferredRounds?: number[];
  forbiddenRounds?: number[];
}

export interface TontineScheduleResult {
  assignments: Array<{shareId:Id;round:number;slot:number}>;
  unassigned: Id[];
  warnings: string[];
}

export const suggestTontineSchedule = (
  shareIds:Id[], rounds:number, potsPerRound:number, constraints:TontineScheduleConstraint[]=[]
):TontineScheduleResult => {
  finiteInt('rounds',rounds,1); finiteInt('potsPerRound',potsPerRound,1);
  const unique=[...new Set(shareIds.map(x=>requiredText('shareId',x)))];
  const capacity=rounds*potsPerRound;
  const assigned:Array<{shareId:Id;round:number;slot:number}>=[];
  const used=new Map<number,number>();
  const byShare=new Map(constraints.map(x=>[x.shareId,x]));
  for(const shareId of unique){
    const rule=byShare.get(shareId);
    const preferred=(rule?.preferredRounds??[]).filter(r=>r>=1&&r<=rounds);
    const normal=Array.from({length:rounds},(_,i)=>i+1);
    const candidates=[...preferred,...normal.filter(r=>!preferred.includes(r))]
      .filter(r=>!(rule?.forbiddenRounds??[]).includes(r));
    const round=candidates.find(r=>(used.get(r)??0)<potsPerRound);
    if(round===undefined) continue;
    const slot=(used.get(round)??0)+1;used.set(round,slot);assigned.push({shareId,round,slot});
  }
  const assignedIds=new Set(assigned.map(x=>x.shareId));
  const unassigned=unique.filter(x=>!assignedIds.has(x));
  const warnings:string[]=[];
  if(unique.length>capacity)warnings.push('CAPACITY_INSUFFICIENT');
  if(unassigned.length)warnings.push('CONSTRAINTS_UNSATISFIED');
  return{assignments:assigned,unassigned,warnings};
};

export interface LoanScheduleRow {
  installment:number;
  principal:number;
  interest:number;
  fees:number;
  due:number;
  remainingPrincipal:number;
}

export const buildLoanSchedule = (input:{
  principal:number; installments:number; annualRateBasisPoints:number; installmentsPerYear?:number;
  method?:'FLAT'|'DECLINING'; feesTotal?:number;
}):LoanScheduleRow[] => {
  const principal=finiteInt('principal',input.principal,1);
  const installments=finiteInt('installments',input.installments,1);
  const rate=finiteInt('annualRateBasisPoints',input.annualRateBasisPoints,0)/10000;
  const perYear=finiteInt('installmentsPerYear',input.installmentsPerYear??12,1);
  const fees=finiteInt('feesTotal',input.feesTotal??0,0);
  const method=input.method??'DECLINING';
  let remaining=principal;
  const basePrincipal=Math.floor(principal/installments);
  const rows:LoanScheduleRow[]=[];
  for(let i=1;i<=installments;i++){
    const principalPart=i===installments?remaining:basePrincipal;
    const interestBase=method==='FLAT'?principal:remaining;
    const interest=Math.round(interestBase*rate/perYear);
    const feePart=i===installments?fees-Math.floor(fees/installments)*(installments-1):Math.floor(fees/installments);
    remaining-=principalPart;
    rows.push({installment:i,principal:principalPart,interest,fees:feePart,due:principalPart+interest+feePart,remainingPrincipal:remaining});
  }
  return rows;
};

export type LoanPaymentPriority = 'CAPITAL_FIRST'|'INTEREST_FIRST';

export interface LoanPaymentAllocation {
  priority:LoanPaymentPriority;
  principalBefore:number;
  interestAccrued:number;
  unpaidInterestBefore:number;
  totalInterestDue:number;
  paymentAmount:number;
  principalPaid:number;
  interestPaid:number;
  remainingPrincipal:number;
  unpaidInterestAfter:number;
  totalDebtAfter:number;
}

export const applyLoanPayment=(input:{
  principalOutstanding:number;
  unpaidInterest?:number;
  paymentAmount:number;
  rateBasisPointsPerPeriod:number;
  priority?:LoanPaymentPriority;
}):LoanPaymentAllocation=>{
  const principal=finiteInt('principalOutstanding',input.principalOutstanding,0);
  const unpaid=finiteInt('unpaidInterest',input.unpaidInterest??0,0);
  const payment=finiteInt('paymentAmount',input.paymentAmount,0);
  const rateBp=finiteInt('rateBasisPointsPerPeriod',input.rateBasisPointsPerPeriod,0);
  const priority=input.priority??'CAPITAL_FIRST';
  if(!['CAPITAL_FIRST','INTEREST_FIRST'].includes(priority))throw new Error('INVALID_LOAN_PAYMENT_PRIORITY');
  // Interest is always calculated on principal only. Unpaid interest is carried separately and never capitalized.
  const accrued=Math.round(principal*rateBp/10000);
  const interestDue=unpaid+accrued;
  if(payment>principal+interestDue)throw new Error('LOAN_PAYMENT_EXCEEDS_TOTAL_DUE');
  let principalPaid=0,interestPaid=0;
  if(priority==='CAPITAL_FIRST'){
    principalPaid=Math.min(payment,principal);
    interestPaid=Math.min(Math.max(0,payment-principalPaid),interestDue);
  }else{
    interestPaid=Math.min(payment,interestDue);
    principalPaid=Math.min(Math.max(0,payment-interestPaid),principal);
  }
  const remainingPrincipal=principal-principalPaid;
  const unpaidInterestAfter=interestDue-interestPaid;
  return{priority,principalBefore:principal,interestAccrued:accrued,unpaidInterestBefore:unpaid,totalInterestDue:interestDue,paymentAmount:payment,principalPaid,interestPaid,remainingPrincipal,unpaidInterestAfter,totalDebtAfter:remainingPrincipal+unpaidInterestAfter};
};

export interface RuleDifference {field:string;before:unknown;after:unknown;}
export const compareRules = (before:Record<string,unknown>,after:Record<string,unknown>):RuleDifference[] => {
  const keys=[...new Set([...Object.keys(before),...Object.keys(after)])].sort();
  return keys.filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k])).map(k=>({field:k,before:before[k],after:after[k]}));
};

export const makeIcs = (events:Array<{uid:string;title:string;start:string;end?:string;cancelled?:boolean}>):string => {
  const esc=(x:string)=>x.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const stamp=(x:string)=>new Date(x).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const rows=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Eco-System//Calendar//FR'];
  for(const e of events){
    rows.push('BEGIN:VEVENT','UID:'+esc(e.uid),'DTSTAMP:'+stamp(now()),'DTSTART:'+stamp(e.start),'SUMMARY:'+esc(e.title));
    if(e.end)rows.push('DTEND:'+stamp(e.end));
    if(e.cancelled)rows.push('STATUS:CANCELLED');
    rows.push('END:VEVENT');
  }
  rows.push('END:VCALENDAR');
  return rows.join('\r\n');
};

export interface LedgerAnomaly {
  code:string;
  entryId?:Id;
  details:string;
}
export const explainLedgerAnomalies = (entries:LedgerEntry[]):LedgerAnomaly[] => {
  const anomalies:LedgerAnomaly[]=[]; const keys=new Map<string,Id>();
  for(const entry of entries){
    const previous=keys.get(entry.idempotencyKey);
    if(previous&&previous!==entry.id) anomalies.push({code:'DUPLICATE_IDEMPOTENCY_KEY',entryId:entry.id,details:previous});
    else keys.set(entry.idempotencyKey,entry.id);
    const debit=entry.lines.reduce((n,l)=>n+l.debit,0),credit=entry.lines.reduce((n,l)=>n+l.credit,0);
    if(debit!==credit) anomalies.push({code:'UNBALANCED_ENTRY',entryId:entry.id,details:String(debit-credit)});
    if(entry.lines.some(l=>l.debit<0||l.credit<0)) anomalies.push({code:'NEGATIVE_LEDGER_LINE',entryId:entry.id,details:'negative line'});
  }
  return anomalies;
};

export class CompletionSuiteService {
  constructor(public readonly repo:PlatformRepository,public readonly kernel:PlatformKernel){}

  private async membership(groupId:Id,manage:boolean):Promise<Membership|undefined>{
    const ctx=this.kernel.context.get();
    const group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw new Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return undefined;
    const membership=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!membership)throw new Error('FORBIDDEN_SCOPE');
    if(manage&&!membership.roles.some(r=>MANAGEMENT_ROLES.has(r)))throw new Error('FORBIDDEN_SCOPE');
    return membership;
  }

  private async getRecord(groupId:Id,id:Id,manage=false):Promise<CompletionRecord>{
    await this.membership(groupId,manage);
    const ctx=this.kernel.context.get();
    const record=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(!record||record.groupId!==groupId||!record.tags.includes('completion'))throw new Error('COMPLETION_RECORD_NOT_FOUND');
    return record as CompletionRecord;
  }

  async list(groupId:Id,kind?:CompletionKind):Promise<CompletionRecord[]>{
    const viewer=await this.membership(groupId,false);
    const ctx=this.kernel.context.get();
    const records=(await this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId))
      .filter(r=>r.tags.includes('completion'));
    let visible=records.filter(r=>!kind||r.data.completionKind===kind) as CompletionRecord[];
    const manager=!viewer||viewer.roles.some(r=>MANAGEMENT_ROLES.has(r));
    if(!manager){
      visible=visible.filter(r=>{
        if(r.data.completionKind==='LOAN')return String(r.data.borrowerMembershipId??'')===viewer.id;
        if(r.data.completionKind==='TONTINE_SHARE')return String(r.data.membershipId??'')===viewer.id;
        if(r.data.completionKind==='IDENTITY_CLAIM')return !r.data.claimedMembershipId||String(r.data.claimedMembershipId)===viewer.id;
        return !['GOVERNANCE_DECISION','APPROVAL_REQUEST','IMPORT_BATCH'].includes(String(r.data.completionKind));
      });
    }
    return visible;
  }

  async create(groupId:Id,kind:CompletionKind,input:{
    id?:Id;title:string;summary?:string;data?:Record<string,unknown>;tags?:string[];
  }):Promise<CompletionRecord>{
    const spec=COMPLETION_WORKFLOWS[kind];if(!spec)throw new Error('INVALID_COMPLETION_KIND');
    await this.membership(groupId,spec.managerOnly);
    const ctx=this.kernel.context.get();
    const title=requiredText('title',input.title);
    const data:CompletionData={completionKind:kind,completionState:spec.initial,completionVersion:1};
    for(const [key,value] of Object.entries(input.data??{}))data[key]=encodeValue(value);
    if(kind==='LOAN'&&data.borrowerMembershipId&&data.rubricId){
      const rubric=await this.repo.getRubricDefinition(ctx.tenantId,groupId,String(data.rubricId)),block=Boolean(rubric?.policies?.loan?.overdue?.blockNewLoanUntilSettled);
      if(block){
        const existing=(await this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)).filter(r=>r.tags.includes('completion')&&r.data.completionKind==='LOAN'&&String(r.data.borrowerMembershipId??'')===String(data.borrowerMembershipId)&&['DISBURSED','REPAYING'].includes(String(r.data.completionState))&&(Number(r.data.outstandingPrincipal??0)>0||Number(r.data.unpaidInterest??0)>0));
        if(existing.length)throw new Error('PREVIOUS_LOAN_DEBT_NOT_SETTLED');
      }
    }
    this.validate(kind,spec.initial,data);
    const timestamp=now();
    const record:CompletionRecord={
      id:input.id?.trim()||makeId('completion'),tenantId:ctx.tenantId,groupId,moduleId:spec.moduleId,title,summary:input.summary?.trim()||undefined,
      status:workspaceStatus(spec.initial),tags:['completion','kind:'+kind,'state:'+spec.initial,...new Set(input.tags??[])],
      data,createdBy:ctx.actorId,createdAt:timestamp,updatedAt:timestamp
    };
    await this.repo.saveWorkspaceRecord(record);
    await audit(this.repo,this.kernel,'COMPLETION_RECORD_CREATED',record.id,{kind,state:spec.initial},groupId);
    return structuredClone(record);
  }

  async transition(groupId:Id,id:Id,to:string,input:{
    expectedVersion:number;patch?:Record<string,unknown>;reason?:string;
  }):Promise<CompletionRecord>{
    const current=await this.getRecord(groupId,id,true);
    const kind=String(current.data.completionKind) as CompletionKind;
    const spec=COMPLETION_WORKFLOWS[kind];if(!spec)throw new Error('INVALID_COMPLETION_KIND');
    const state=String(current.data.completionState);
    const version=Number(current.data.completionVersion??0);
    if(version!==input.expectedVersion)throw new Error('COMPLETION_VERSION_CONFLICT');
    if(!(spec.transitions[state]??[]).includes(to))throw new Error('INVALID_COMPLETION_TRANSITION');
    const data:CompletionData={...current.data};
    for(const [key,value] of Object.entries(input.patch??{})){
      if(['completionKind','completionState','completionVersion'].includes(key))continue;
      data[key]=encodeValue(value);
    }
    data.completionState=to;data.completionVersion=version+1;
    if(input.reason)data.lastTransitionReason=input.reason.trim();
    this.validate(kind,to,data);
    const tags=current.tags.filter(x=>!x.startsWith('state:'));tags.push('state:'+to);
    const next:CompletionRecord={...current,status:workspaceStatus(to),tags,data,updatedAt:now()};
    await this.repo.saveWorkspaceRecord(next);
    await audit(this.repo,this.kernel,'COMPLETION_RECORD_TRANSITIONED',id,{kind,from:state,to,version:version+1},groupId);
    return structuredClone(next);
  }

  async createHistoricalIdentityClaim(groupId:Id,input:{
    historicalReference:string;evidenceReference:string;claimedMembershipId?:Id;note?:string;
  }):Promise<CompletionRecord>{
    return this.create(groupId,'IDENTITY_CLAIM',{
      title:'Historical identity claim',summary:input.note,
      data:{historicalReference:requiredText('historicalReference',input.historicalReference),
        evidenceReference:requiredText('evidenceReference',input.evidenceReference),
        claimedMembershipId:input.claimedMembershipId??null}
    });
  }

  async createTontineCycle(groupId:Id,input:{
    rubricId:Id;name:string;rounds:number;potsPerRound:number;currency?:Currency;nominalPotAmount?:number;
  }):Promise<CompletionRecord>{
    finiteInt('rounds',input.rounds,1);finiteInt('potsPerRound',input.potsPerRound,1);
    if(input.nominalPotAmount!==undefined)finiteInt('nominalPotAmount',input.nominalPotAmount,1);
    return this.create(groupId,'TONTINE_CYCLE',{
      title:requiredText('name',input.name),
      data:{rubricId:requiredText('rubricId',input.rubricId),rounds:input.rounds,potsPerRound:input.potsPerRound,
        currency:input.currency??'XAF',nominalPotAmount:input.nominalPotAmount??null}
    });
  }

  async addTontineShare(groupId:Id,input:{
    cycleId:Id;membershipId:Id;label:string;
  }):Promise<CompletionRecord>{
    const cycle=await this.getRecord(groupId,input.cycleId,true);
    if(cycle.data.completionKind!=='TONTINE_CYCLE')throw new Error('TONTINE_CYCLE_NOT_FOUND');
    const ctx=this.kernel.context.get();
    const membership=await this.repo.getMembership(ctx.tenantId,groupId,input.membershipId);
    if(!membership||membership.status!=='active')throw new Error('MEMBERSHIP_NOT_FOUND');
    return this.create(groupId,'TONTINE_SHARE',{
      title:requiredText('label',input.label),
      data:{cycleId:input.cycleId,membershipId:input.membershipId,scheduledRound:null,scheduledSlot:null,benefitLedgerEntryId:null}
    });
  }

  async scheduleTontineShare(groupId:Id,shareId:Id,round:number,expectedVersion:number):Promise<CompletionRecord>{
    finiteInt('round',round,1);
    const share=await this.getRecord(groupId,shareId,true);
    if(share.data.completionKind!=='TONTINE_SHARE')throw new Error('TONTINE_SHARE_NOT_FOUND');
    const cycleId=requiredText('cycleId',share.data.cycleId);
    const cycle=await this.getRecord(groupId,cycleId,true);
    const maxRound=Number(cycle.data.rounds),pots=Number(cycle.data.potsPerRound);
    if(round>maxRound)throw new Error('TONTINE_ROUND_OUT_OF_RANGE');
    const siblings=(await this.list(groupId,'TONTINE_SHARE')).filter(r=>r.data.cycleId===cycleId&&r.id!==shareId&&Number(r.data.scheduledRound)===round&&r.data.completionState!=='CANCELLED');
    if(siblings.length>=pots)throw new Error('TONTINE_ROUND_CAPACITY_EXCEEDED');
    const slot=siblings.length+1;
    const target=share.data.completionState==='SCHEDULED'?'SCHEDULED':'SCHEDULED';
    return this.transition(groupId,shareId,target,{expectedVersion,patch:{scheduledRound:round,scheduledSlot:slot}});
  }

  async markTontineShareServed(groupId:Id,shareId:Id,benefitLedgerEntryId:Id,expectedVersion:number):Promise<CompletionRecord>{
    const share=await this.getRecord(groupId,shareId,true);
    if(share.data.completionKind!=='TONTINE_SHARE')throw new Error('TONTINE_SHARE_NOT_FOUND');
    if(!share.data.scheduledRound)throw new Error('TONTINE_SHARE_NOT_SCHEDULED');
    const ctx=this.kernel.context.get(),entryId=requiredText('benefitLedgerEntryId',benefitLedgerEntryId);
    const entry=await this.repo.getLedgerEntry(ctx.tenantId,groupId,entryId);
    if(!entry||entry.sourceType!=='tontine_share'||entry.sourceId!==share.id||entry.descriptionCode!=='LEDGER_TONTINE_BENEFIT')throw new Error('TONTINE_BENEFIT_LEDGER_PROOF_INVALID');
    return this.transition(groupId,shareId,'SERVED',{expectedVersion,patch:{benefitLedgerEntryId:entryId,servedAt:now()}});
  }

  async createFinancialObligation(groupId:Id,input:{
    membershipId:Id;type:string;title:string;dueAt?:string;amount?:number;currency?:Currency;sourceId?:Id;
  }):Promise<Obligation>{
    await this.membership(groupId,true);
    const ctx=this.kernel.context.get();
    const member=await this.repo.getMembership(ctx.tenantId,groupId,input.membershipId);
    if(!member||member.status!=='active')throw new Error('MEMBERSHIP_NOT_FOUND');
    if(input.amount!==undefined)finiteInt('obligationAmount',input.amount,0);
    if(input.dueAt&&!Number.isFinite(Date.parse(input.dueAt)))throw new Error('INVALID_OBLIGATION_DUE_AT');
    const obligation:Obligation={
      id:makeId('obligation'),tenantId:ctx.tenantId,groupId,assigneeId:member.userId,type:requiredText('type',input.type),
      title:requiredText('title',input.title),dueAt:input.dueAt,priority:'normal',status:'open',sourceType:'completion',
      sourceId:input.sourceId??groupId,amount:input.amount===undefined?undefined:{currency:input.currency??'XAF',amount:input.amount}
    };
    await this.repo.saveObligation(obligation);
    await audit(this.repo,this.kernel,'FINANCIAL_OBLIGATION_CREATED',obligation.id,{type:obligation.type,dueAt:obligation.dueAt,amount:obligation.amount},groupId);
    return structuredClone(obligation);
  }

  async createGovernanceDecision(groupId:Id,input:{
    title:string;subject:string;threshold:number;expiresAt?:string;operationFingerprint?:string;
  }):Promise<CompletionRecord>{
    finiteInt('threshold',input.threshold,1);
    if(input.expiresAt&&!Number.isFinite(Date.parse(input.expiresAt)))throw new Error('INVALID_DECISION_EXPIRY');
    return this.create(groupId,'GOVERNANCE_DECISION',{
      title:input.title,data:{subject:requiredText('subject',input.subject),threshold:input.threshold,expiresAt:input.expiresAt??null,
        operationFingerprint:input.operationFingerprint??null,approverIds:'[]',approvalCount:0}
    });
  }

  async approveDecision(groupId:Id,id:Id,expectedVersion:number):Promise<CompletionRecord>{
    const record=await this.getRecord(groupId,id,false);
    if(record.data.completionKind!=='GOVERNANCE_DECISION'&&record.data.completionKind!=='APPROVAL_REQUEST')throw new Error('DECISION_NOT_FOUND');
    const ctx=this.kernel.context.get();
    const state=String(record.data.completionState);
    if(state!=='OPEN')throw new Error('DECISION_NOT_OPEN');
    const expiresAt=record.data.expiresAt;
    if(typeof expiresAt==='string'&&expiresAt&&Date.parse(expiresAt)<Date.now())throw new Error('DECISION_EXPIRED');
    const approvers=decodeJson<Id[]>(record.data.approverIds,[]);
    if(approvers.includes(ctx.actorId))throw new Error('DUPLICATE_APPROVAL');
    const nextApprovers=[...approvers,ctx.actorId];
    const threshold=Number(record.data.threshold??1);
    const target=nextApprovers.length>=threshold?'APPROVED':'OPEN';
    if(target==='OPEN'){
      if(Number(record.data.completionVersion)!==expectedVersion)throw new Error('COMPLETION_VERSION_CONFLICT');
      const data={...record.data,approverIds:JSON.stringify(nextApprovers),approvalCount:nextApprovers.length,completionVersion:expectedVersion+1};
      const next={...record,data,updatedAt:now()} as CompletionRecord;
      await this.repo.saveWorkspaceRecord(next);
      await audit(this.repo,this.kernel,'GOVERNANCE_APPROVAL_ADDED',id,{approvalCount:nextApprovers.length,threshold},groupId);
      return structuredClone(next);
    }
    if(Number(record.data.completionVersion)!==expectedVersion)throw new Error('COMPLETION_VERSION_CONFLICT');
    const data:CompletionData={...record.data,approverIds:JSON.stringify(nextApprovers),approvalCount:nextApprovers.length,
      completionState:'APPROVED',completionVersion:expectedVersion+1};
    this.validate(record.data.completionKind as CompletionKind,'APPROVED',data);
    const tags=record.tags.filter(x=>!x.startsWith('state:'));tags.push('state:APPROVED');
    const next:CompletionRecord={...record,status:workspaceStatus('APPROVED'),tags,data,updatedAt:now()};
    await this.repo.saveWorkspaceRecord(next);
    await audit(this.repo,this.kernel,'GOVERNANCE_DECISION_APPROVED',id,{approvalCount:nextApprovers.length,threshold},groupId);
    return structuredClone(next);
  }

  async readinessPassport(groupId:Id):Promise<CompletionRecord>{
    await this.membership(groupId,false);
    const ctx=this.kernel.context.get();
    const [rubrics,members,meetings]=await Promise.all([
      this.repo.listRubricDefinitions(ctx.tenantId,groupId),
      this.repo.listMemberships(ctx.tenantId,groupId),
      this.repo.listMeetings(ctx.tenantId,groupId)
    ]);
    const blockers:string[]=[];
    if(!rubrics.some(r=>r.status==='ACTIVE'))blockers.push('NO_ACTIVE_RUBRIC');
    if(!members.some(m=>m.status==='active'))blockers.push('NO_ACTIVE_MEMBER');
    const data={ready:blockers.length===0,blockers,activeRubrics:rubrics.filter(r=>r.status==='ACTIVE').length,
      activeMembers:members.filter(m=>m.status==='active').length,meetingCount:meetings.length,checkedAt:now()};
    return this.create(groupId,'READINESS_PASSPORT',{title:'Group readiness passport',data});
  }

  private validate(kind:CompletionKind,state:string,data:CompletionData):void{
    const spec=COMPLETION_WORKFLOWS[kind];
    if(!spec.states.includes(state))throw new Error('INVALID_COMPLETION_STATE');
    if(kind==='IDENTITY_CLAIM'&&state==='APPROVED'){
      requiredText('evidenceReference',data.evidenceReference);
      requiredText('historicalReference',data.historicalReference);
    }
    if(kind==='TONTINE_CYCLE'){
      finiteInt('rounds',Number(data.rounds),1);finiteInt('potsPerRound',Number(data.potsPerRound),1);
    }
    if(kind==='TONTINE_SHARE'&&state==='SERVED')requiredText('benefitLedgerEntryId',data.benefitLedgerEntryId);
    if(kind==='LOAN'&&['DISBURSED','REPAYING','CLOSED'].includes(state)){
      requiredText('ledgerEntryId',data.ledgerEntryId);
      const outstanding=Number(data.outstandingPrincipal??0);
      finiteInt('outstandingPrincipal',outstanding,0);
      if(state==='CLOSED'&&outstanding!==0)throw new Error('LOAN_BALANCE_NOT_ZERO');
    }
    if(kind==='GOVERNANCE_DECISION'&&state==='APPROVED'){
      const approvals=Number(data.approvalCount??0),threshold=Number(data.threshold??1);
      if(approvals<threshold)throw new Error('QUORUM_NOT_REACHED');
    }
    if(kind==='IMPORT_BATCH'&&state==='APPLIED'){
      if(data.approved!==true)throw new Error('IMPORT_NOT_APPROVED');
      if(Number(data.issueCount??0)!==0)throw new Error('IMPORT_HAS_UNRESOLVED_ISSUES');
    }
    if(kind==='GROUP_BUY'&&['THRESHOLD_MET','APPROVED','ORDERED','FULFILLED'].includes(state)){
      const committed=Number(data.committedQuantity??0),threshold=Number(data.thresholdQuantity??0);
      if(committed<threshold)throw new Error('GROUP_BUY_THRESHOLD_NOT_MET');
    }
  }
}

