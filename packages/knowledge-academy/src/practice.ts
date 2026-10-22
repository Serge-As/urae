import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
const MODULE='LEARNING.MANAGER_ACADEMY';
const text=(v:unknown,max=2000)=>String(v??'').trim().slice(0,max);
const list=(v:unknown)=>{try{const x=JSON.parse(String(v??'[]'));return Array.isArray(x)?x:[];}catch{return[];}};
async function digest(v:unknown){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(x=>x.toString(16).padStart(2,'0')).join('');}
const now=()=>new Date().toISOString();
async function actor(repo:PlatformRepository,kernel:PlatformKernel){const c=kernel.context.get();if(!await repo.getUser(c.actorId))throw Error('USER_NOT_FOUND');return c;}
async function get(repo:PlatformRepository,kernel:PlatformKernel,id:string){const c=await actor(repo,kernel),r=await repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!==MODULE||r.data.kind!=='PRACTICE_ATTEMPT'||![r.createdBy,r.data.mentorId].includes(c.actorId))throw Error('PRACTICE_NOT_FOUND');return{c,r};}
function events(r:WorkspaceRecord){return list(r.data.eventsJson);}
async function save(repo:PlatformRepository,kernel:PlatformKernel,r:WorkspaceRecord,expectedVersion:number,event:string,patch:WorkspaceRecord['data']){
 const c=kernel.context.get(),history=events(r);if(history.length>=100)throw Error('PRACTICE_HISTORY_FULL');const stamp=now();
 const next={...r,updatedAt:stamp,data:{...r.data,...patch,version:Number(r.data.version)+1,eventsJson:JSON.stringify([...history,{event,actorId:c.actorId,at:stamp,submissionRevision:patch.submissionRevision??r.data.submissionRevision}])}};
 return repo.commitWorkspaceRecordRevision(next,expectedVersion);
}
export async function createPractice(repo:PlatformRepository,kernel:PlatformKernel,input:{title:string;criteria:string[];mentorId:string;consent:boolean;terms?:string}){
 const c=await actor(repo,kernel),title=text(input.title,180),criteria=Array.isArray(input.criteria)?input.criteria.map(x=>text(x,500)).filter(Boolean).slice(0,12):[],mentorId=text(input.mentorId,180);
 if(!title||!criteria.length)throw Error('PRACTICE_CRITERIA_REQUIRED');if(input.consent!==true)throw Error('PRACTICE_SHARING_CONSENT_REQUIRED');if(mentorId===c.actorId)throw Error('PRACTICE_INDEPENDENT_MENTOR_REQUIRED');if(!mentorId||!await repo.getUser(mentorId))throw Error('PRACTICE_MENTOR_NOT_FOUND');
 const terms=text(input.terms,1200)||'Voluntary unpaid educational review; no employment, payment, contract or financial permission is created.';
  const at=now(),r:WorkspaceRecord={id:makeId('practice'),tenantId:c.tenantId,moduleId:MODULE,title,status:'ACTIVE',tags:['academy','practice','private','governed-productive'],createdBy:c.actorId,createdAt:at,updatedAt:at,data:{kind:'PRACTICE_ATTEMPT',version:1,criteriaJson:JSON.stringify(criteria),mentorId,terms,mentorAccepted:false,submissionsJson:'[]',reviewsJson:'[]',state:'DRAFT',submissionRevision:0,deliverable:'',reviewedSubmissionRevision:0,reviewedBy:'',reviewNote:'',reviewedAt:'',appealReason:'',eventsJson:JSON.stringify([{event:'CREATED',actorId:c.actorId,at}]),grantsPermission:false,paymentCreated:false}};
 return (await repo.insertGovernedRecord(r)).record;
}
export async function practiceView(repo:PlatformRepository,kernel:PlatformKernel,r:WorkspaceRecord){
 const c=kernel.context.get(),owner=r.createdBy===c.actorId,accepted=r.data.mentorAccepted===true,canReadDeliverable=owner||(accepted&&r.data.state!=='WITHDRAWN'),revision=Number(r.data.submissionRevision??0);
 const view={id:r.id,title:r.title,version:Number(r.data.version),state:String(r.data.state),learnerId:r.createdBy,mentorId:String(r.data.mentorId),mentorAccepted:accepted,terms:String(r.data.terms??''),submissions:canReadDeliverable?list(r.data.submissionsJson):[],reviews:canReadDeliverable?list(r.data.reviewsJson):[],criteria:list(r.data.criteriaJson),deliverable:canReadDeliverable?String(r.data.deliverable??''):'',submissionRevision:revision,reviewedBy:r.data.reviewedBy||null,reviewNote:canReadDeliverable?r.data.reviewNote:null,appealReason:canReadDeliverable?r.data.appealReason:null,events:canReadDeliverable?events(r):[],canReview:!owner&&accepted&&r.data.state==='SUBMITTED',isLearner:owner,badge:{valid:r.data.state==='VALIDATED'&&Number(r.data.reviewedSubmissionRevision)===revision,issuerId:r.data.reviewedBy||null,issuedAt:r.data.reviewedAt||null,criteria:list(r.data.criteriaJson),evidenceId:r.id,evidenceRevision:revision,recheckRequired:true,grantsPermission:false,paymentCreated:false}};
 return {...view,reviewToken:canReadDeliverable?await digest([r.id,r.data.version,revision,r.data.deliverable,r.data.criteriaJson]):null};
}
export async function practices(repo:PlatformRepository,kernel:PlatformKernel){const c=await actor(repo,kernel),rows=(await repo.listWorkspaceRecords(c.tenantId,MODULE)).filter(r=>r.data.kind==='PRACTICE_ATTEMPT'&&(r.createdBy===c.actorId||r.data.mentorId===c.actorId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));return{items:await Promise.all(rows.slice(0,50).map(r=>practiceView(repo,kernel,r))),total:rows.length,pageLimit:50};}
export async function readPractice(repo:PlatformRepository,kernel:PlatformKernel,id:string){const {r}=await get(repo,kernel,id);return practiceView(repo,kernel,r);}
export async function updatePractice(repo:PlatformRepository,kernel:PlatformKernel,id:string,input:{action:string;expectedVersion:number;deliverable?:string;reviewToken?:string;note?:string;decision?:string}){
 const {c,r}=await get(repo,kernel,id),owner=r.createdBy===c.actorId,mentor=r.data.mentorId===c.actorId,state=String(r.data.state),version=Number(r.data.version),note=text(input.note,1600);if(input.expectedVersion!==version)throw Error('PRACTICE_VERSION_CONFLICT');if(state==='WITHDRAWN')throw Error('PRACTICE_WITHDRAWN');
 let patch:WorkspaceRecord['data'];
 if(input.action==='ACCEPT_MENTOR'){
  if(!mentor||owner)throw Error('FORBIDDEN_SCOPE');if(r.data.mentorAccepted===true)return practiceView(repo,kernel,r);patch={mentorAccepted:true};
 }else if(input.action==='SUBMIT'){
  if(!owner)throw Error('FORBIDDEN_SCOPE');if(!['DRAFT','CORRECTION_REQUIRED'].includes(state))throw Error('PRACTICE_NOT_EDITABLE');const deliverable=text(input.deliverable,10000);if(!deliverable)throw Error('PRACTICE_DELIVERABLE_REQUIRED');const submissions=list(r.data.submissionsJson);if(submissions.length>=10)throw Error('PRACTICE_SUBMISSION_HISTORY_FULL');const revision=Number(r.data.submissionRevision??0)+1;patch={deliverable,submissionsJson:JSON.stringify([...submissions,{revision,deliverable,actorId:c.actorId,submittedAt:now()}]),state:'SUBMITTED',submissionRevision:revision,reviewedSubmissionRevision:0,reviewedBy:'',reviewNote:'',reviewedAt:''};
 }else if(input.action==='REVIEW'){
  if(owner||!mentor||r.data.mentorAccepted!==true)throw Error('PRACTICE_INDEPENDENT_REVIEW_REQUIRED');if(state!=='SUBMITTED'||!String(r.data.deliverable??'').trim())throw Error('PRACTICE_SUBMISSION_REQUIRED');const view=await practiceView(repo,kernel,r);if(input.reviewToken!==view.reviewToken)throw Error('PRACTICE_DELIVERABLE_NOT_REVIEWED');if(!note)throw Error('PRACTICE_REVIEW_REASON_REQUIRED');if(!['VALIDATED','CORRECTION_REQUIRED'].includes(String(input.decision)))throw Error('INVALID_PRACTICE_DECISION');patch={state:String(input.decision),reviewNote:note,reviewedBy:c.actorId,reviewedAt:now(),reviewedSubmissionRevision:Number(r.data.submissionRevision)};
 }else if(input.action==='REVOKE'){
  if(owner||!mentor||state!=='VALIDATED')throw Error('FORBIDDEN_SCOPE');if(!note)throw Error('PRACTICE_REVOCATION_REASON_REQUIRED');patch={state:'REVOKED',reviewNote:note,revokedAt:now()};
 }else if(input.action==='APPEAL'){
  if(!owner||!['CORRECTION_REQUIRED','REVOKED'].includes(state))throw Error('FORBIDDEN_SCOPE');if(!note)throw Error('PRACTICE_APPEAL_REASON_REQUIRED');patch={state:'APPEALED',appealReason:note};
 }else if(input.action==='RESOLVE_APPEAL'){
  if(owner||!mentor||state!=='APPEALED'||!note)throw Error('PRACTICE_APPEAL_RESOLUTION_REQUIRED');patch={state:'CORRECTION_REQUIRED',reviewNote:note};
 }else if(input.action==='WITHDRAW'){
  if(!owner||state==='WITHDRAWN')throw Error('FORBIDDEN_SCOPE');patch={state:'WITHDRAWN'};
 }else throw Error('INVALID_PRACTICE_ACTION');
 if(['REVIEW','REVOKE','APPEAL','RESOLVE_APPEAL'].includes(input.action)){const reviews=list(r.data.reviewsJson);if(reviews.length>=50)throw Error('PRACTICE_REVIEW_HISTORY_FULL');patch.reviewsJson=JSON.stringify([...reviews,{event:input.action,submissionRevision:Number(r.data.submissionRevision),actorId:c.actorId,note,decision:patch.state,at:now()}]);}
  return practiceView(repo,kernel,await save(repo,kernel,r,version,input.action,patch));
}
