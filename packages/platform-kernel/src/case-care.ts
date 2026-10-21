import type {CaseRecord,CaseCareState,CaseCareCategory,CaseCareCommand,CaseExpectationItem} from '../../contracts/src/index.js';

const text=(value:unknown,max:number,required=false)=>{if(value!==undefined&&typeof value!=='string')throw Error('INVALID_CASE_TEXT');const s=String(value??'').trim();if(s.length>max||required&&!s)throw Error('INVALID_CASE_TEXT');return s;};
export const caseOperationKey=(value:unknown)=>{if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{8,120}$/.test(value))throw Error('INVALID_IDEMPOTENCY_KEY');return value;};
const categories=new Set(['SUPPORT','ISSUE','DISPUTE','PREVENTION']);
export function initialCaseCare(record:CaseRecord,category:CaseCareCategory='SUPPORT',participantIds:string[]=[]):CaseCareState{
 if(!categories.has(category))throw Error('INVALID_CASE_CATEGORY');
 return {revision:0,category,visibility:'PRIVATE',participantIds:[...new Set([record.openedBy,...participantIds])],nextAction:'Examiner le dossier',waitingFor:'UNASSIGNED',events:[]};
}
export function createCaseCare(record:CaseRecord,input:{category?:CaseCareCategory;participantIds?:string[];sourceTenantId?:string;visibility?:CaseCareState['visibility']}={}):CaseRecord{
 const care=initialCaseCare(record,input.category,input.participantIds);care.revision=1;care.sourceTenantId=input.sourceTenantId;care.visibility=input.visibility??'PRIVATE';
 care.events.push({id:'created',fingerprint:'created',kind:'CREATED',actorId:record.openedBy,at:record.openedAt,note:record.summary,data:{category:care.category}});
 return {...structuredClone(record),care};
}
export interface CaseCareRights {actorId:string;requester:boolean;canManage:boolean;canParticipate:boolean;assignmentAllowed?:boolean;}
export function applyCaseCare(record:CaseRecord,command:CaseCareCommand,rights:CaseCareRights):CaseRecord{
 if(!rights.canParticipate)throw Error('FORBIDDEN_SCOPE');
 const key=caseOperationKey(command.idempotencyKey),note=text(command.note,3000),nextAction=command.nextAction===undefined?undefined:text(command.nextAction,500,true);
 const evidenceIds=command.evidenceIds??[];if(!Array.isArray(evidenceIds)||evidenceIds.length>6||evidenceIds.some(x=>typeof x!=='string'||!x||x.length>300))throw Error('INVALID_CASE_EVIDENCE');
 const items=command.items;if(items!==undefined&&(!Array.isArray(items)||!items.length||items.length>12))throw Error('INVALID_CASE_EXPECTATIONS');
 const cleanItems:CaseExpectationItem[]|undefined=items?.map(x=>{if(!x||typeof x.notApplicable!=='boolean')throw Error('INVALID_CASE_EXPECTATIONS');return {label:text(x.label,120,true),value:text(x.value,500,!x.notApplicable),notApplicable:x.notApplicable};});
 const fingerprint=JSON.stringify([command.action,note,command.assignedTo??null,nextAction??null,command.indicativeDueAt===undefined?'UNCHANGED':command.indicativeDueAt,command.waitingFor??null,evidenceIds,cleanItems??null,command.expectationRevision??null]);
 const out=structuredClone(record),care=out.care??initialCaseCare(out),prior=care.events.find(x=>x.id===key);
 if(prior){if(prior.actorId!==rights.actorId||prior.fingerprint!==fingerprint)throw Error('CASE_IDEMPOTENCY_CONFLICT');return out;}
 if(!Number.isSafeInteger(command.expectedRevision)||command.expectedRevision!==care.revision)throw Error('CASE_VERSION_CONFLICT');
 if(care.events.length>=200)throw Error('CASE_HISTORY_LIMIT');
 const manager=()=>{if(!rights.canManage)throw Error('FORBIDDEN_SCOPE');};
 const requester=()=>{if(!rights.requester)throw Error('FORBIDDEN_SCOPE');};
 const reason=()=>{if(!note)throw Error('CASE_REASON_REQUIRED');};
 const active=()=>{if(['CLOSED','RESOLVED'].includes(out.status))throw Error('CASE_REOPEN_REQUIRED');};
 const at=new Date().toISOString(),before=out.status,data:Record<string,unknown>={evidenceIds:[...new Set(evidenceIds)]};
 switch(command.action){
 case 'COMMENT':reason();break;
 case 'ASSIGN':
  manager();active();if(!command.assignedTo||!rights.assignmentAllowed)throw Error('INVALID_CASE_ASSIGNEE');
  care.assignedTo=command.assignedTo;care.participantIds=[...new Set([...care.participantIds,command.assignedTo])];care.waitingFor='RESPONSIBLE';care.nextAction='Examiner le dossier';if(out.status==='OPEN')out.status='TRIAGED';data.assignedTo=command.assignedTo;break;
 case 'UNASSIGN':manager();active();reason();delete care.assignedTo;care.waitingFor='UNASSIGNED';care.nextAction='Affecter un responsable';break;
 case 'START_REVIEW':manager();active();if(care.assignedTo!==rights.actorId)throw Error('CASE_ASSIGNEE_REQUIRED');out.status='UNDER_REVIEW';care.waitingFor='RESPONSIBLE';care.nextAction='Examiner les éléments et répondre';break;
 case 'UPDATE_PLAN':
  manager();active();if(!nextAction)throw Error('CASE_NEXT_ACTION_REQUIRED');care.nextAction=nextAction;
  if(command.waitingFor!==undefined){if(!['RESPONSIBLE','REQUESTER','EXTERNAL','UNASSIGNED'].includes(command.waitingFor))throw Error('INVALID_CASE_WAITING_PARTY');if(command.waitingFor==='RESPONSIBLE'&&!care.assignedTo)throw Error('CASE_ASSIGNEE_REQUIRED');care.waitingFor=command.waitingFor;}
  if(command.indicativeDueAt!==undefined){if(command.indicativeDueAt===null)delete care.indicativeDueAt;else{if(typeof command.indicativeDueAt!=='string'||!/^\d{4}-\d\d-\d\dT/.test(command.indicativeDueAt)||!Number.isFinite(Date.parse(command.indicativeDueAt)))throw Error('INVALID_CASE_DATE');care.indicativeDueAt=new Date(command.indicativeDueAt).toISOString();}}
  out.status=care.waitingFor==='REQUESTER'||care.waitingFor==='EXTERNAL'?'WAITING_PARTY':care.assignedTo?'UNDER_REVIEW':'OPEN';data.nextAction=care.nextAction;data.waitingFor=care.waitingFor;data.indicativeDueAt=care.indicativeDueAt??null;break;
 case 'PROPOSE_RESOLUTION':
  manager();active();reason();if(care.assignedTo!==rights.actorId||rights.requester)throw Error('CASE_INDEPENDENT_RESPONSIBLE_REQUIRED');care.resolution={state:'PROPOSED',text:note,proposedBy:rights.actorId,proposedAt:at};care.waitingFor='REQUESTER';care.nextAction='Accepter ou refuser la résolution proposée';out.status='WAITING_PARTY';break;
 case 'ACCEPT_RESOLUTION':case 'REFUSE_RESOLUTION':
  requester();active();if(care.resolution?.state!=='PROPOSED'||care.resolution.proposedBy===rights.actorId)throw Error('CASE_RESOLUTION_PROPOSAL_REQUIRED');
  if(command.action==='REFUSE_RESOLUTION')reason();care.resolution={...care.resolution,state:command.action==='ACCEPT_RESOLUTION'?'ACCEPTED':'REFUSED',decidedBy:rights.actorId,decidedAt:at};
  out.status=command.action==='ACCEPT_RESOLUTION'?'RESOLVED':'UNDER_REVIEW';care.waitingFor=out.status==='RESOLVED'?'NONE':'RESPONSIBLE';care.nextAction=out.status==='RESOLVED'?'Clôturer ou rouvrir si nécessaire':'Revoir la proposition refusée';break;
 case 'ESCALATE':active();reason();if(!rights.requester&&!rights.canManage)throw Error('FORBIDDEN_SCOPE');out.status='MEDIATION';care.waitingFor=care.assignedTo?'RESPONSIBLE':'UNASSIGNED';care.nextAction='Organiser une médiation, sans décision automatique';break;
 case 'APPEAL':case 'REOPEN':
  requester();reason();if(command.action==='REOPEN'&&!['CLOSED','RESOLVED'].includes(out.status))throw Error('INVALID_CASE_TRANSITION');out.status=command.action==='APPEAL'?'APPEALED':'OPEN';delete care.resolution;care.waitingFor=care.assignedTo?'RESPONSIBLE':'UNASSIGNED';care.nextAction='Réexaminer le dossier et le motif du recours';break;
 case 'CLOSE':requester();if(out.status!=='RESOLVED'||care.resolution?.state!=='ACCEPTED')throw Error('CASE_ACCEPTANCE_REQUIRED');out.status='CLOSED';care.waitingFor='NONE';care.nextAction='Dossier clôturé, recours possible';break;
 case 'WITHDRAW':requester();active();reason();out.status='CLOSED';care.waitingFor='NONE';care.nextAction='Demande retirée, sans résolution métier déduite';break;
 case 'PROPOSE_EXPECTATIONS':
  active();if(care.category!=='PREVENTION'||out.subjectType==='MARKET_ORDER')throw Error('CASE_RETROACTIVE_EXPECTATIONS_FORBIDDEN');
  if(!rights.requester&&care.assignedTo!==rights.actorId)throw Error('FORBIDDEN_SCOPE');if(!care.assignedTo||care.assignedTo===out.openedBy)throw Error('CASE_TWO_PARTIES_REQUIRED');if(!cleanItems)throw Error('INVALID_CASE_EXPECTATIONS');
  care.expectationDraft={revision:(care.expectationDraft?.revision??0)+1,items:cleanItems,proposedBy:rights.actorId,proposedAt:at,acceptedBy:[]};data.expectation=structuredClone(care.expectationDraft);break;
 case 'ACCEPT_EXPECTATIONS':{
  active();if(!rights.requester&&care.assignedTo!==rights.actorId)throw Error('FORBIDDEN_SCOPE');const draft=care.expectationDraft;
  if(!draft||command.expectationRevision!==draft.revision)throw Error('CASE_EXPECTATION_VERSION_CONFLICT');if(draft.acceptedBy.includes(rights.actorId))throw Error('CASE_EXPECTATION_ALREADY_ACCEPTED');
  draft.acceptedBy.push(rights.actorId);if(draft.acceptedBy.includes(out.openedBy)&&care.assignedTo&&draft.acceptedBy.includes(care.assignedTo)){draft.acceptedAt=at;care.acceptedExpectation=structuredClone(draft);}data.expectation=structuredClone(draft);break;}
 default:throw Error('INVALID_CASE_ACTION');
 }
 care.revision++;care.events.push({id:key,fingerprint,kind:command.action,actorId:rights.actorId,at,note,data:{...data,from:before,to:out.status}});out.care=care;if(new TextEncoder().encode(JSON.stringify(out)).byteLength>262144)throw Error('CASE_HISTORY_LIMIT');return out;
}
