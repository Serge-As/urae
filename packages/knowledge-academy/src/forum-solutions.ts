import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type SolutionSource={id:string;engine:'LIVE'|'LEGACY'};
export type SourceLoader=(groupId:string,hubId:string,ref:SolutionSource)=>Promise<unknown|undefined>;
export interface SolutionInput {groupId:string;hubId:string;title:string;method:string;conditions:string;result:string;sources:SolutionSource[];consent:boolean;}
const moduleId='LEARNING.KNOWLEDGE_BANK',clean=(v:unknown,n=4000)=>String(v??'').trim().slice(0,n);
const parse=(v:unknown)=>JSON.parse(String(v??'[]')) as Array<SolutionSource&{hash:string}>;
const managers=new Set(['founder','manager','admin','president','treasurer','secretary','moderator']);
async function hash(value:unknown){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function access(repo:PlatformRepository,kernel:PlatformKernel,groupId:string){
 const c=kernel.context.get(),g=await repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
 const m=(await repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
 if(g.createdBy!==c.actorId&&!m)throw Error('FORBIDDEN_SCOPE');return{...c,manager:g.createdBy===c.actorId||Boolean(m?.roles.some(x=>managers.has(x)))};
}
type Transmission={groupId:string;active:boolean;revision:number;sourceHash:string;at:string};
const transmissions=(r:WorkspaceRecord)=>JSON.parse(String(r.data.transmissionsJson??'[]')) as Transmission[];
const referenceId=(sourceId:string,groupId:string)=>hash(['solution-transmission',sourceId,groupId]).then(x=>'solution_reference_'+x);
const contentHash=(r:WorkspaceRecord)=>hash([r.id,r.title,r.data.method,r.data.conditions,r.data.result,r.data.sourcesJson]);
async function currentAuthor(repo:PlatformRepository,r:WorkspaceRecord){const g=await repo.getGroup(r.tenantId,String(r.groupId));return Boolean(g?.status==='active'&&(g.createdBy===r.createdBy||(await repo.listMemberships(r.tenantId,g.id)).some(m=>m.userId===r.createdBy&&m.status==='active')));}
async function sourceCheck(r:WorkspaceRecord,load:SourceLoader,repo:PlatformRepository):Promise<{sources:Array<{id:string;engine:'LIVE'|'LEGACY';current:boolean}>;current:boolean}>{
 if(r.data.adaptationSourceId){
  const parent=await repo.getWorkspaceRecord(String(r.data.adaptationSourceTenantId??r.tenantId),String(r.data.adaptationSourceId)),grant=parent?transmissions(parent).find(x=>x.groupId===r.groupId&&x.active):undefined;
  const current=Boolean(parent&&parent.moduleId===moduleId&&parent.status==='ACTIVE'&&parent.data.kind==='FORUM_SOLUTION'&&!parent.data.adaptationSourceId&&parent.data.solutionState==='VALIDATED'&&grant&&grant.revision===r.data.transmissionRevision&&grant.sourceHash===r.data.adaptationSourceHash&&await contentHash(parent)===grant.sourceHash&&await currentAuthor(repo,parent)&&(await sourceCheck(parent,load,repo)).current);
  return{sources:[] as Array<{id:string;engine:'LIVE'|'LEGACY';current:boolean}>,current};
 }
 const checks=await Promise.all(parse(r.data.sourcesJson).map(async ref=>{const current=await load(String(r.groupId),String(r.data.hubId),ref);return{id:ref.id,engine:ref.engine,current:Boolean(current)&&await hash(current)===ref.hash};}));
 return{sources:checks,current:checks.length>0&&checks.every(x=>x.current)};
}
async function view(repo:PlatformRepository,kernel:PlatformKernel,r:WorkspaceRecord,load:SourceLoader){
 const c=await access(repo,kernel,String(r.groupId)),check=await sourceCheck(r,load,repo),state=check.current?String(r.data.solutionState):'NEEDS_REVIEW',visible=check.current&&(state==='VALIDATED'||r.createdBy===c.actorId||c.manager);
 return{id:r.id,groupId:r.groupId,hubId:r.data.hubId,version:Number(r.data.version),title:check.current?r.title:'Solution à réexaminer / Solution needs review',state,method:visible?r.data.method:'',conditions:visible?r.data.conditions:'',result:visible?r.data.result:'',sources:check.sources,sourceCurrent:check.current,canReview:c.manager&&r.createdBy!==c.actorId&&check.current&&state==='PROPOSED',canRevise:r.createdBy===c.actorId,reviewedBy:r.data.reviewedBy||null,reviewNote:visible?r.data.reviewNote:null,sourceToken:check.current?await hash([r.id,r.data.version,r.data.sourcesJson]):null,canTransmit:!r.data.adaptationSourceId&&r.createdBy===c.actorId&&state==='VALIDATED'&&check.current,transmissions:r.createdBy===c.actorId?transmissions(r).map(x=>({groupId:x.groupId,active:x.active,revision:x.revision})):[],adapted:Boolean(r.data.adaptationSourceId),automaticRule:false,publiclyIndexed:false};
}
export async function createForumSolution(repo:PlatformRepository,kernel:PlatformKernel,input:SolutionInput,load:SourceLoader){
 const c=await access(repo,kernel,clean(input.groupId,180));if(input.consent!==true)throw Error('SOLUTION_GROUP_SHARING_CONSENT_REQUIRED');
 const title=clean(input.title,180),method=clean(input.method),conditions=clean(input.conditions,1500),result=clean(input.result,1500),hubId=clean(input.hubId,180);
 if(!title||!method||!conditions||!result||!hubId)throw Error('SOLUTION_CONTENT_REQUIRED');
 if(!Array.isArray(input.sources)||input.sources.length<1||input.sources.length>3)throw Error('SOLUTION_SOURCES_REQUIRED');
 const refs: Array<SolutionSource&{hash:string}>=[];
 for(const ref of input.sources){if(!ref?.id||!['LIVE','LEGACY'].includes(ref.engine)||refs.some(x=>x.id===ref.id))throw Error('INVALID_SOLUTION_SOURCE');const source=await load(input.groupId,hubId,ref);if(!source)throw Error('SOLUTION_SOURCE_UNAVAILABLE');refs.push({id:clean(ref.id,180),engine:ref.engine,hash:await hash(source)});}
 const at=new Date().toISOString(),r:WorkspaceRecord={id:makeId('solution'),tenantId:c.tenantId,groupId:input.groupId,moduleId,title,status:'ACTIVE',createdBy:c.actorId,createdAt:at,updatedAt:at,tags:['knowledge','forum-solution','governed-productive'],data:{kind:'FORUM_SOLUTION',version:1,solutionState:'PROPOSED',sensitivity:'GROUP',hubId,method,conditions,result,sourcesJson:JSON.stringify(refs),reviewedBy:'',reviewNote:'',automaticRule:false}};
 await repo.insertGovernedRecord(r);return view(repo,kernel,r,load);
}
export async function forumSolutions(repo:PlatformRepository,kernel:PlatformKernel,groupId:string,load:SourceLoader){
 const c=await access(repo,kernel,groupId),all=(await repo.listWorkspaceRecords(c.tenantId,moduleId,groupId)).filter(r=>r.tags.includes('forum-solution')&&r.status==='ACTIVE'&&(r.data.solutionState==='VALIDATED'||r.createdBy===c.actorId||c.manager)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 return{items:await Promise.all(all.slice(0,20).map(r=>view(repo,kernel,r,load))),total:all.length,pageLimit:20};
}
export async function reviewForumSolution(repo:PlatformRepository,kernel:PlatformKernel,id:string,input:{expectedVersion:number;sourceToken:string;accepted:boolean;note:string},load:SourceLoader){
 const c=kernel.context.get(),r=await repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.data.kind!=='FORUM_SOLUTION'||!r.tags.includes('forum-solution'))throw Error('SOLUTION_NOT_FOUND');
 const a=await access(repo,kernel,String(r.groupId));if(!a.manager||r.createdBy===a.actorId)throw Error('SOLUTION_INDEPENDENT_REVIEW_REQUIRED');if(Number(r.data.version)!==input.expectedVersion)throw Error('SOLUTION_VERSION_CONFLICT');
 const v=await view(repo,kernel,r,load);if(!v.sourceCurrent||input.sourceToken!==v.sourceToken)throw Error('SOLUTION_SOURCE_CHANGED');if(r.data.solutionState!=='PROPOSED')throw Error('SOLUTION_NOT_REVIEWABLE');const note=clean(input.note,1500);if(!note)throw Error('SOLUTION_REVIEW_REASON_REQUIRED');
 const next={...r,updatedAt:new Date().toISOString(),data:{...r.data,version:input.expectedVersion+1,solutionState:input.accepted?'VALIDATED':'REJECTED',reviewedBy:c.actorId,reviewNote:note,reviewedAt:new Date().toISOString()}};
 await repo.commitWorkspaceRecordRevision(next,input.expectedVersion);return view(repo,kernel,next,load);
}

export async function transmitForumSolution(repo:PlatformRepository,kernel:PlatformKernel,id:string,input:{expectedVersion:number;sourceToken:string;targetGroupId:string;enabled:boolean;consent?:boolean},load:SourceLoader){
 const c=kernel.context.get(),r=await repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!==moduleId||r.data.kind!=='FORUM_SOLUTION'||r.status!=='ACTIVE'||r.createdBy!==c.actorId||r.data.adaptationSourceId)throw Error('SOLUTION_NOT_FOUND');
 await access(repo,kernel,String(r.groupId));if(Number(r.data.version)!==input.expectedVersion)throw Error('SOLUTION_VERSION_CONFLICT');
 if(typeof input.enabled!=='boolean')throw Error('INVALID_SOLUTION_TRANSMISSION');const target=clean(input.targetGroupId,180);if(!target||target===r.groupId)throw Error('SOLUTION_TARGET_GROUP_REQUIRED');
 const list=transmissions(r),prior=list.find(x=>x.groupId===target),at=new Date().toISOString();
 if(input.enabled){
  if(input.consent!==true)throw Error('SOLUTION_TRANSMISSION_CONSENT_REQUIRED');const g=await repo.getGroupById(target);if(g?.status!=='active')throw Error('GROUP_NOT_FOUND');
  if(g.createdBy!==c.actorId&&!(await repo.listMemberships(g.tenantId,target)).some(m=>m.userId===c.actorId&&m.status==='active'))throw Error('FORBIDDEN_SCOPE');
  const v=await view(repo,kernel,r,load);if(!v.canTransmit||v.sourceToken!==input.sourceToken)throw Error('SOLUTION_SOURCE_CHANGED');if(!prior&&list.length>=10)throw Error('SOLUTION_TRANSMISSION_LIMIT');
  const grant={groupId:target,active:true,revision:(prior?.revision??0)+1,sourceHash:await contentHash(r),at};if(prior)Object.assign(prior,grant);else list.push(grant);
  // Discovery pointer only; the source grant above remains the sole authority.
  // An interrupted/losing source CAS leaves an inert pointer, never an access grant.
  const pointer:WorkspaceRecord={id:await referenceId(r.id,target),tenantId:g.tenantId,groupId:target,moduleId,title:'Method transmission reference',status:'ACTIVE',tags:['governed-productive','forum-solution-reference'],createdBy:c.actorId,createdAt:at,updatedAt:at,data:{kind:'FORUM_SOLUTION_TRANSMISSION',sourceId:r.id,sourceTenantId:r.tenantId,version:1}};
  await repo.insertGovernedRecord(pointer);
 }else{if(!prior)throw Error('SOLUTION_TRANSMISSION_NOT_FOUND');prior.active=false;prior.revision++;prior.at=at;}
 const next={...r,updatedAt:at,data:{...r.data,version:input.expectedVersion+1,transmissionsJson:JSON.stringify(list)}};await repo.commitWorkspaceRecordRevision(next,input.expectedVersion);return view(repo,kernel,next,load);
}

async function transmissionView(repo:PlatformRepository,r:WorkspaceRecord,target:string,load:SourceLoader){
 const grant=transmissions(r).find(x=>x.groupId===target&&x.active);
 if(!grant||r.status!=='ACTIVE'||r.moduleId!==moduleId||r.data.kind!=='FORUM_SOLUTION'||r.data.adaptationSourceId||r.data.solutionState!=='VALIDATED'||grant.sourceHash!==await contentHash(r)||!await currentAuthor(repo,r)||!(await sourceCheck(r,load,repo)).current)return undefined;
 return{id:r.id,title:r.title,method:r.data.method,conditions:r.data.conditions,result:r.data.result,transmissionToken:await hash([r.id,target,grant.revision,grant.sourceHash]),revision:grant.revision,sourceHash:grant.sourceHash,rawSourcesShared:false};
}
export async function receivedForumSolutions(repo:PlatformRepository,kernel:PlatformKernel,groupId:string,load:SourceLoader){
 const c=await access(repo,kernel,groupId),rows=(await repo.listWorkspaceRecords(c.tenantId,moduleId,groupId)).filter(r=>r.data.kind==='FORUM_SOLUTION_TRANSMISSION'&&r.tags.includes('governed-productive')),items=[];
 for(const pointer of rows){const r=await repo.getWorkspaceRecord(String(pointer.data.sourceTenantId),String(pointer.data.sourceId)),item=r?await transmissionView(repo,r,groupId,load):undefined;if(item)items.push(item);if(items.length>=20)break;}
 return{items:items.map(({sourceHash,revision,...p})=>p),limit:20,canAdapt:c.manager,publiclyIndexed:false};
}
export async function adaptForumSolution(repo:PlatformRepository,kernel:PlatformKernel,groupId:string,input:{sourceId:string;transmissionToken:string;title:string;method:string;conditions:string;result:string;consent:boolean},load:SourceLoader){
 const c=await access(repo,kernel,groupId);if(!c.manager)throw Error('SOLUTION_TARGET_MANAGER_REQUIRED');if(input.consent!==true)throw Error('SOLUTION_GROUP_SHARING_CONSENT_REQUIRED');
 const pointer=await repo.getWorkspaceRecord(c.tenantId,await referenceId(clean(input.sourceId,180),groupId));
 const parent=pointer?.groupId===groupId&&pointer.data.kind==='FORUM_SOLUTION_TRANSMISSION'?await repo.getWorkspaceRecord(String(pointer.data.sourceTenantId),String(pointer.data.sourceId)):undefined,shared=parent?await transmissionView(repo,parent,groupId,load):undefined;if(!shared||shared.transmissionToken!==input.transmissionToken)throw Error('SOLUTION_TRANSMISSION_UNAVAILABLE');
 const title=clean(input.title,180),method=clean(input.method),conditions=clean(input.conditions,1500),result=clean(input.result,1500);if(!title||!method||!conditions||!result)throw Error('SOLUTION_CONTENT_REQUIRED');
 const at=new Date().toISOString(),r:WorkspaceRecord={id:makeId('solution'),tenantId:c.tenantId,groupId,moduleId,title,status:'ACTIVE',createdBy:c.actorId,createdAt:at,updatedAt:at,tags:['knowledge','forum-solution','governed-productive'],data:{kind:'FORUM_SOLUTION',version:1,solutionState:'PROPOSED',sensitivity:'GROUP',hubId:'',method,conditions,result,sourcesJson:'[]',reviewedBy:'',reviewNote:'',adaptationSourceId:parent!.id,adaptationSourceTenantId:parent!.tenantId,adaptationSourceHash:shared.sourceHash,transmissionRevision:shared.revision,automaticRule:false}};
 await repo.insertGovernedRecord(r);return view(repo,kernel,r,load);
}
