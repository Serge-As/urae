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
async function sourceCheck(r:WorkspaceRecord,load:SourceLoader){
 const checks=await Promise.all(parse(r.data.sourcesJson).map(async ref=>{const current=await load(String(r.groupId),String(r.data.hubId),ref);return{id:ref.id,engine:ref.engine,current:Boolean(current)&&await hash(current)===ref.hash};}));
 return{sources:checks,current:checks.length>0&&checks.every(x=>x.current)};
}
async function view(repo:PlatformRepository,kernel:PlatformKernel,r:WorkspaceRecord,load:SourceLoader){
 const c=await access(repo,kernel,String(r.groupId)),check=await sourceCheck(r,load),state=check.current?String(r.data.solutionState):'NEEDS_REVIEW',visible=check.current&&(state==='VALIDATED'||r.createdBy===c.actorId||c.manager);
 return{id:r.id,groupId:r.groupId,hubId:r.data.hubId,version:Number(r.data.version),title:check.current?r.title:'Solution à réexaminer / Solution needs review',state,method:visible?r.data.method:'',conditions:visible?r.data.conditions:'',result:visible?r.data.result:'',sources:check.sources,sourceCurrent:check.current,canReview:c.manager&&r.createdBy!==c.actorId&&check.current&&state==='PROPOSED',canRevise:r.createdBy===c.actorId,reviewedBy:r.data.reviewedBy||null,reviewNote:visible?r.data.reviewNote:null,sourceToken:check.current?await hash([r.id,r.data.version,r.data.sourcesJson]):null,automaticRule:false,publiclyIndexed:false};
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
