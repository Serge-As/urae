import type {ActorContext,CaseRecord,CaseCareCategory,CaseCareCommand} from '../../../packages/contracts/src/index.js';
import type {PlatformRepository} from '../../../packages/repositories/src/index.js';
import {PlatformKernel,caseOperationKey} from '../../../packages/platform-kernel/src/index.js';
import {MarketService} from '../../../packages/market/src/index.js';

const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
const fingerprint=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(x=>x.toString(16).padStart(2,'0')).join('');
/** HTTP adapter only. Kernel.Cases owns transitions; MarketService owns order parties. */
export function caseCareAdapter(repo:PlatformRepository,kernel:PlatformKernel){
 const ctx=()=>kernel.context.get();
 const groupRights=async(actorId:string,tenantId:string,groupId:string)=>{
  const group=await repo.getGroup(tenantId,groupId);if(!group||group.status==='archived')return{read:false,manage:false};if(group.createdBy===actorId)return{read:true,manage:true};
  const member=(await repo.listMemberships(tenantId,groupId)).find(x=>x.userId===actorId&&x.status==='active');return{read:Boolean(member),manage:Boolean(member?.roles.some(x=>managerRoles.has(x)))};
 };
 const orderContext=async(record:CaseRecord,actorId=ctx().actorId)=>{
  const order=await repo.getMarketRecordById(record.subjectId);if(!order||record.care?.sourceTenantId&&record.care.sourceTenantId!==order.tenantId)throw Error('FORBIDDEN_SCOPE');
  const k=new PlatformKernel();k.context.set({...ctx(),actorId,tenantId:order.tenantId});return new MarketService(repo,k,ctx().tenantId).supportContext(order.id);
 };
 const rights=async(record:CaseRecord,groupMemo?:Map<string,Promise<{read:boolean;manage:boolean}>>)=>{
  const c=ctx(),requester=record.openedBy===c.actorId,visibility=record.care?.visibility??'PRIVATE';let canManage=false,canParticipate=false;
  if(visibility==='ORDER_PARTIES'){
   const source=await orderContext(record);canManage=source.canManage;canParticipate=source.buyerId===c.actorId||source.canManage;
  }else if(record.tenantId===c.tenantId){
   const groupKey=JSON.stringify([c.actorId,record.tenantId,record.groupId]);let groupPromise=groupMemo?.get(groupKey);if(!groupPromise&&record.groupId){groupPromise=groupRights(c.actorId,record.tenantId,record.groupId);groupMemo?.set(groupKey,groupPromise);}const g=groupPromise?await groupPromise:{read:true,manage:false};
   canParticipate=g.read&&(requester||visibility==='GROUP_SUPPORT'&&g.manage);canManage=canParticipate&&(visibility==='PRIVATE'?requester:g.manage);
  }
  if(!canParticipate)throw Error('FORBIDDEN_SCOPE');return{actorId:c.actorId,requester,canManage,canParticipate};
 };
 const get=async(id:string)=>{const record=await repo.getCaseById(id);if(!record)throw Error('CASE_NOT_FOUND');const access=await rights(record);return{record,rights:access};};
 const detail=async(id:string)=>{
  const {record,rights:access}=await get(id),assignees:Array<{id:string;label:string}>=[];
  if(access.canManage){
   let candidates=[ctx().actorId];if(record.care?.visibility==='GROUP_SUPPORT'&&record.groupId){const group=await repo.getGroup(record.tenantId,record.groupId);candidates=[group!.createdBy,...(await repo.listMemberships(record.tenantId,record.groupId)).filter(m=>m.status==='active'&&m.roles.some(x=>managerRoles.has(x))).map(m=>m.userId)];}
   for(const id of [...new Set(candidates)]){const user=await repo.getUser(id);assignees.push({id,label:user?.displayName??id});}
  }
  const ids=[...new Set([record.openedBy,...(record.care?.participantIds??[]),...(record.care?.assignedTo?[record.care.assignedTo]:[]),...(record.care?.events.map(x=>x.actorId)??[])])],people:Record<string,string>={};
  for(const id of ids){const user=await repo.getUser(id);people[id]=user?.displayName??id;}
  return{record,rights:access,assignees,people,financialOutcome:'NOT_INFERRED',servicePromise:'NO_GUARANTEED_RESPONSE_TIME'};
 };
 const list=async()=>{
  const c=ctx(),rows=new Map((await repo.listCareCasesForActor(c.actorId)).map(x=>[x.id,x]));
  for(const item of await repo.listCases(c.tenantId))if(item.care?.visibility==='GROUP_SUPPORT')rows.set(item.id,item);
  const visible:CaseRecord[]=[],groupMemo=new Map<string,Promise<{read:boolean;manage:boolean}>>();for(const item of rows.values()){try{await rights(item,groupMemo);visible.push(item);}catch(error){if(error instanceof Error&&['FORBIDDEN_SCOPE','ORDER_NOT_FOUND','GROUP_NOT_FOUND','SHOP_NOT_FOUND'].includes(error.message))continue;throw error;}}
  visible.sort((a,b)=>(b.care?.events.at(-1)?.at??b.openedAt).localeCompare(a.care?.events.at(-1)?.at??a.openedAt));
  return{cases:visible.slice(0,100),truncated:visible.length>100,limit:100,financialOutcome:'NOT_INFERRED',servicePromise:'NO_GUARANTEED_RESPONSE_TIME'};
 };
 const create=async(input:{summary:string;category?:CaseCareCategory;groupId?:string;idempotencyKey:string})=>{
  const c=ctx(),key=caseOperationKey(input.idempotencyKey);if(typeof input.summary!=='string'||!input.summary.trim()||input.summary.length>3000)throw Error('CASE_SUMMARY_REQUIRED');
  if(input.groupId){const allowed=await groupRights(c.actorId,c.tenantId,input.groupId);if(!allowed.read)throw Error('FORBIDDEN_SCOPE');}
  const id='case_care_'+await fingerprint([c.tenantId,c.actorId,key]),summary=input.summary.trim(),prior=await repo.getCaseById(id);
  const match=(r:CaseRecord)=>{if(r.tenantId!==c.tenantId||r.openedBy!==c.actorId||r.summary!==summary||r.groupId!==input.groupId||r.care?.category!==(input.category??'SUPPORT'))throw Error('CASE_IDEMPOTENCY_CONFLICT');return r;};
  if(prior)return match(prior);
  const record=kernel.cases.createCare({id,tenantId:c.tenantId,groupId:input.groupId,type:'GENERAL_SUPPORT',subjectType:input.groupId?'group':'account',subjectId:input.groupId??c.actorId,status:'OPEN',openedBy:c.actorId,openedAt:new Date().toISOString(),summary},{category:input.category,visibility:input.groupId?'GROUP_SUPPORT':'PRIVATE'});
  if(await repo.saveCaseRevision(record,null))return record;const existing=await repo.getCaseById(id);if(!existing)throw Error('CASE_VERSION_CONFLICT');return match(existing);
 };
 const command=async(id:string,input:CaseCareCommand)=>{
  const {record,rights:access}=await get(id);let assignmentAllowed=false;
  if(input.action==='ASSIGN'&&input.assignedTo){
   if(record.care?.visibility==='ORDER_PARTIES'){try{assignmentAllowed=(await orderContext(record,input.assignedTo)).canManage;}catch{}}
   else if(record.care?.visibility==='GROUP_SUPPORT'&&record.groupId)assignmentAllowed=(await groupRights(input.assignedTo,record.tenantId,record.groupId)).manage;
   else assignmentAllowed=input.assignedTo===record.openedBy;
  }
  if(input.evidenceIds!==undefined&&(!Array.isArray(input.evidenceIds)||input.evidenceIds.length>6||input.evidenceIds.some(x=>typeof x!=='string'||!x||x.length>300)))throw Error('INVALID_CASE_EVIDENCE');
  for(const id of input.evidenceIds??[]){const proof=await repo.getEvidence(record.tenantId,id);if(!proof||proof.createdBy!==ctx().actorId||proof.immutable!==true||proof.data.groupId&&proof.data.groupId!==record.groupId)throw Error('FORBIDDEN_CASE_EVIDENCE');}
  const next=kernel.cases.applyCare(record,input,{...access,assignmentAllowed});if((next.care?.revision??0)===(record.care?.revision??0))return detail(id);
  if(!await repo.saveCaseRevision(next,record.care?.revision??0)){
   const latest=await get(id),replay=kernel.cases.applyCare(latest.record,input,{...latest.rights,assignmentAllowed});if((replay.care?.revision??0)!==(latest.record.care?.revision??0))throw Error('CASE_VERSION_CONFLICT');
  }
  return detail(id);
 };
 return{list,create,detail,command};
}
