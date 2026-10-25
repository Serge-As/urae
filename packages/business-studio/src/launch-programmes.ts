import type {PlatformRepository} from '../../repositories/src/index.js';
import {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import {readLaunchPlan} from './launch-plans.js';

const moduleId='MANAGER.BUSINESS_STUDIO',clean=(v:unknown,n=1600)=>String(v??'').trim().slice(0,n);
type Participant={actorId:string;state:'INVITED'|'JOINED'|'LEFT';termsRevision:number;planId:string;shareProgress:boolean;commitment:string;report:string;review:string;reviewedBy:string;reviewedAt:string;updatedAt:string;};
export interface LaunchProgrammeInput {groupId:string;title:string;entryConditions:string;reciprocalCommitments:string;resources:string;exitCriteria:string;endsAt:string;}
export interface LaunchProgrammeCommand {expectedVersion:number;action:'INVITE'|'JOIN'|'LEAVE'|'REPORT'|'REVIEW_RESULT'|'AMEND'|'CLOSE';actorId?:string;planId?:string;shareProgress?:boolean;consent?:boolean;commitment?:string;note?:string;entryConditions?:string;reciprocalCommitments?:string;resources?:string;exitCriteria?:string;endsAt?:string;}
const people=(r:WorkspaceRecord)=>JSON.parse(String(r.data.participantsJson??'[]')) as Participant[];
async function context(repo:PlatformRepository,kernel:PlatformKernel,groupId:string){
 const c=kernel.context.get(),g=await repo.getGroup(c.tenantId,groupId),members=(await repo.listMemberships(c.tenantId,groupId)).filter(m=>m.status==='active');
 if(!g||g.status!=='active'||!await repo.getUser(c.actorId)||g.createdBy!==c.actorId&&!members.some(m=>m.userId===c.actorId))throw Error('LAUNCH_PROGRAMME_NOT_FOUND');
 return{c,g,members,manager:g.createdBy===c.actorId||members.some(m=>m.userId===c.actorId&&m.roles.some(r=>['manager','admin','president','treasurer'].includes(r)))};
}
async function get(repo:PlatformRepository,kernel:PlatformKernel,id:string){
 const c=kernel.context.get(),r=await repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!==moduleId||r.data.businessKind!=='LAUNCH_PROGRAMME')throw Error('LAUNCH_PROGRAMME_NOT_FOUND');
 const access=await context(repo,kernel,String(r.groupId));if(r.createdBy!==c.actorId&&!people(r).some(p=>p.actorId===c.actorId&&p.state!=='LEFT'))throw Error('LAUNCH_PROGRAMME_NOT_FOUND');
 if(access.g.createdBy!==r.createdBy&&!access.members.some(m=>m.userId===r.createdBy&&m.roles.some(role=>['manager','admin','president','treasurer'].includes(role))))throw Error('LAUNCH_PROGRAMME_NOT_FOUND');
 return{r,...access};
}
async function sharedProgress(repo:PlatformRepository,kernel:PlatformKernel,r:WorkspaceRecord,p:Participant){
 if(!p.shareProgress||!p.planId||p.state!=='JOINED'||p.termsRevision!==Number(r.data.termsRevision))return null;
 try{const k=new PlatformKernel();k.context.set({...kernel.context.get(),actorId:p.actorId});const plan=await readLaunchPlan(repo,k,p.planId);if(plan.state!=='ACTIVE')return null;return{...plan.progress,sourceId:plan.id,sourceVersion:plan.version,checkedAt:new Date().toISOString(),financialResult:'NOT_INFERRED'};}catch{return null;}
}
async function view(repo:PlatformRepository,kernel:PlatformKernel,r:WorkspaceRecord){
 const access=await context(repo,kernel,String(r.groupId)),owner=r.createdBy===access.c.actorId,all=people(r),visible=all.filter(p=>owner||p.actorId===access.c.actorId),participants=[];
 for(const p of visible){const active=access.g.createdBy===p.actorId||access.members.some(m=>m.userId===p.actorId),current=active&&p.state==='JOINED'&&p.termsRevision===Number(r.data.termsRevision);participants.push({...p,current,progress:current?await sharedProgress(repo,kernel,r,p):null,resultState:!p.report?'NOT_REPORTED':p.review?'INDEPENDENT_HUMAN_REVIEW':'SELF_REPORTED'});}
 return{id:r.id,title:r.title,groupId:r.groupId,version:Number(r.data.version),termsRevision:Number(r.data.termsRevision),owner,state:r.data.programmeState,entryConditions:r.data.entryConditions,reciprocalCommitments:r.data.reciprocalCommitments,resources:r.data.resources,resourceStatus:'DECLARED_NOT_FUNDED',exitCriteria:r.data.exitCriteria,endsAt:r.data.endsAt,participants,memberCount:owner?all.filter(p=>p.state==='JOINED').length:undefined,fundingCommitted:false,automaticExecution:false};
}
export async function createLaunchProgramme(repo:PlatformRepository,kernel:PlatformKernel,input:LaunchProgrammeInput){
 const {c,manager}=await context(repo,kernel,input.groupId);if(!manager)throw Error('FORBIDDEN_SCOPE');
 const data={entryConditions:clean(input.entryConditions),reciprocalCommitments:clean(input.reciprocalCommitments),resources:clean(input.resources),exitCriteria:clean(input.exitCriteria)},title=clean(input.title,180),end=Date.parse(input.endsAt);
 if(!title||Object.values(data).some(x=>!x)||!Number.isFinite(end)||end<=Date.now()||end>Date.now()+730*86400000)throw Error('LAUNCH_PROGRAMME_CONTENT_REQUIRED');
 const at=new Date().toISOString(),r:WorkspaceRecord={id:makeId('launchprogramme'),tenantId:c.tenantId,groupId:input.groupId,moduleId,title,status:'ACTIVE',createdBy:c.actorId,createdAt:at,updatedAt:at,tags:['business-studio','launch-programme','governed-productive','private'],data:{businessKind:'LAUNCH_PROGRAMME',version:1,termsRevision:1,programmeState:'ACTIVE',...data,endsAt:new Date(end).toISOString(),participantsJson:'[]',eventsJson:'[]'}};
 await repo.insertGovernedRecord(r);return view(repo,kernel,r);
}
export async function launchProgrammes(repo:PlatformRepository,kernel:PlatformKernel){
 const c=kernel.context.get();if(!c.activeGroupId)return{items:[],limit:20};const access=await context(repo,kernel,c.activeGroupId),rows=(await repo.listWorkspaceRecords(c.tenantId,moduleId,c.activeGroupId)).filter(r=>r.data.businessKind==='LAUNCH_PROGRAMME'&&(r.createdBy===c.actorId||people(r).some(p=>p.actorId===c.actorId&&p.state!=='LEFT'))),items=[];
 for(const r of rows.slice(-20)){try{await get(repo,kernel,r.id);items.push(await view(repo,kernel,r));}catch{}}
 return{items,limit:20,canCreate:access.manager};
}
export async function readLaunchProgramme(repo:PlatformRepository,kernel:PlatformKernel,id:string){const {r}=await get(repo,kernel,id);return view(repo,kernel,r);}
export async function updateLaunchProgramme(repo:PlatformRepository,kernel:PlatformKernel,id:string,input:LaunchProgrammeCommand){
 const {r,c,members,g}=await get(repo,kernel,id),owner=r.createdBy===c.actorId,version=Number(r.data.version),all=people(r),own=all.find(p=>p.actorId===c.actorId),note=clean(input.note,2400),at=new Date().toISOString();
 if(input.expectedVersion!==version)throw Error('LAUNCH_PROGRAMME_VERSION_CONFLICT');
 if(input.action!=='LEAVE'&&(r.data.programmeState!=='ACTIVE'||Date.parse(String(r.data.endsAt))<=Date.now()))throw Error('LAUNCH_PROGRAMME_CLOSED');
 let patch:WorkspaceRecord['data']={};
 if(input.action==='INVITE'){
  if(!owner)throw Error('FORBIDDEN_SCOPE');const actorId=clean(input.actorId,180);if(actorId===c.actorId||!members.some(m=>m.userId===actorId)&&g.createdBy!==actorId)throw Error('LAUNCH_PROGRAMME_MEMBER_REQUIRED');
  if(all.some(p=>p.actorId===actorId))throw Error('LAUNCH_PROGRAMME_ALREADY_INVITED');if(all.length>=50)throw Error('LAUNCH_PROGRAMME_PARTICIPANT_LIMIT');
  all.push({actorId,state:'INVITED',termsRevision:0,planId:'',shareProgress:false,commitment:'',report:'',review:'',reviewedBy:'',reviewedAt:'',updatedAt:at});
 }else if(input.action==='JOIN'){
  if(owner||!own||own.state==='LEFT'||input.consent!==true||!clean(input.commitment))throw Error('LAUNCH_PROGRAMME_CONSENT_REQUIRED');
  const planId=clean(input.planId,180);if(planId)await readLaunchPlan(repo,kernel,planId);
  Object.assign(own,{state:'JOINED',termsRevision:Number(r.data.termsRevision),planId,shareProgress:input.shareProgress===true,commitment:clean(input.commitment),updatedAt:at});
 }else if(input.action==='LEAVE'){
  if(owner||!own||!note)throw Error('LAUNCH_PROGRAMME_PARTICIPANT_REQUIRED');Object.assign(own,{state:'LEFT',shareProgress:false,planId:'',updatedAt:at});
 }else if(input.action==='REPORT'){
  if(!own||own.state!=='JOINED'||own.termsRevision!==Number(r.data.termsRevision)||!note)throw Error('LAUNCH_PROGRAMME_JOIN_REQUIRED');Object.assign(own,{report:note,review:'',reviewedBy:'',reviewedAt:'',updatedAt:at});
 }else if(input.action==='REVIEW_RESULT'){
  if(!owner||!note)throw Error('FORBIDDEN_SCOPE');const p=all.find(x=>x.actorId===input.actorId);if(!p||p.state!=='JOINED'||!p.report||p.termsRevision!==Number(r.data.termsRevision)||!members.some(m=>m.userId===p.actorId)&&g.createdBy!==p.actorId)throw Error('LAUNCH_PROGRAMME_REPORT_REQUIRED');Object.assign(p,{review:note,reviewedBy:c.actorId,reviewedAt:at});
 }else if(input.action==='AMEND'){
  if(!owner||!note)throw Error('FORBIDDEN_SCOPE');const end=Date.parse(String(input.endsAt??r.data.endsAt));if(!Number.isFinite(end)||end<=Date.now()||end>Date.now()+730*86400000)throw Error('INVALID_LAUNCH_PROGRAMME_DATE');
  for(const key of ['entryConditions','reciprocalCommitments','resources','exitCriteria'] as const){const value=clean(input[key]??r.data[key]);if(!value)throw Error('LAUNCH_PROGRAMME_CONTENT_REQUIRED');patch[key]=value;}
  patch.endsAt=new Date(end).toISOString();patch.termsRevision=Number(r.data.termsRevision)+1;
 }else if(input.action==='CLOSE'){if(!owner||!note)throw Error('FORBIDDEN_SCOPE');patch.programmeState='CLOSED';}
 else throw Error('INVALID_LAUNCH_PROGRAMME_ACTION');
 const events=JSON.parse(String(r.data.eventsJson)) as unknown[];if(events.length>=300)throw Error('LAUNCH_PROGRAMME_HISTORY_FULL');
 const next={...r,updatedAt:at,data:{...r.data,...patch,version:version+1,participantsJson:JSON.stringify(all),eventsJson:JSON.stringify([...events,{action:input.action,actorId:c.actorId,subjectId:input.actorId??c.actorId,note,termsRevision:Number(r.data.termsRevision),at}])}};
 await repo.commitWorkspaceRecordRevision(next,version);return view(repo,kernel,next);
}
