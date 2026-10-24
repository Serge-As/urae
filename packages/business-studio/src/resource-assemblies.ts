import type {PlatformRepository} from '../../repositories/src/index.js';
import {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import {MarketService} from '../../market/src/index.js';

const moduleId='MANAGER.BUSINESS_STUDIO';
const clean=(value:unknown,max=1600)=>String(value??'').trim().slice(0,max);
const digest=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(x=>x.toString(16).padStart(2,'0')).join('');
const unit=(value:unknown)=>clean(value,80).normalize('NFKC').toLowerCase();
interface Line {id:string;name:string;shopId:string;stockItemId:string;ownerId:string;quantity:number;unit:string;startsAt:string;endsAt:string;conditions:string;offerFingerprint:string;decision:'REQUESTED'|'ACCEPTED'|'DECLINED'|'WITHDRAWN';decisionNote:string;decidedAt:string;orderId:string;}
export interface ResourceAssemblyInput {title:string;groupId:string;consent:boolean;idempotencyKey:string;lines:Array<{name:string;shopId:string;stockItemId:string;quantity:number;unit:string;startsAt:string;endsAt:string;conditions:string}>;}
export interface ResourceAssemblyCommand {expectedVersion:number;action:'ACCEPT'|'DECLINE'|'WITHDRAW'|'LINK_ORDER'|'ARCHIVE';lineId?:string;note?:string;orderId?:string;}
const lines=(r:WorkspaceRecord)=>JSON.parse(String(r.data.linesJson)) as Line[];

async function participants(repo:PlatformRepository,tenantId:string,groupId:string){
 const group=await repo.getGroup(tenantId,groupId);
 return new Set(group?.status==='active'?[group.createdBy,...(await repo.listMemberships(tenantId,groupId)).filter(m=>m.status==='active').map(m=>m.userId)]:[]);
}
async function actor(repo:PlatformRepository,kernel:PlatformKernel){const c=kernel.context.get();if(!await repo.getUser(c.actorId))throw Error('USER_NOT_FOUND');return c;}
async function get(repo:PlatformRepository,kernel:PlatformKernel,id:string){
 const c=await actor(repo,kernel),r=await repo.getWorkspaceRecord(c.tenantId,id);
 if(!r||r.moduleId!==moduleId||r.data.businessKind!=='RESOURCE_ASSEMBLY'||!r.tags.includes('governed-productive')||![r.createdBy,...lines(r).map(x=>x.ownerId)].includes(c.actorId))throw Error('RESOURCE_ASSEMBLY_NOT_FOUND');
 const members=await participants(repo,c.tenantId,String(r.groupId));if(!members.has(c.actorId)||!members.has(r.createdBy))throw Error('RESOURCE_ASSEMBLY_NOT_FOUND');
 return {c,r,members};
}
// Match the existing Market record resolver: canonical storage tenant, same
// authenticated actor, then Market's public/party authorization. Never trust a
// tenant or owner supplied by the plan. This performs no commercial command.
async function marketForRecord(repo:PlatformRepository,kernel:PlatformKernel,id:string){const record=await repo.getMarketRecordById(id);if(!record)throw Error('MARKET_RECORD_NOT_FOUND');const k=new PlatformKernel();k.context.set({...kernel.context.get(),tenantId:record.tenantId});return new MarketService(repo,k);}
async function offer(repo:PlatformRepository,kernel:PlatformKernel,shopId:string,stockItemId:string){
 const resource=await (await marketForRecord(repo,kernel,shopId)).resourceOfferProjection(shopId,stockItemId);
 return {...resource,fingerprint:await digest([resource.shopId,resource.stockItemId,resource.ownerId,resource.name,resource.unit,resource.unitPrice,resource.currency,resource.deliveryTerms,resource.availableAt,resource.availableUntil])};
}
async function allocationId(tenantId:string,orderId:string){return 'assembly_allocation_'+await digest([tenantId,orderId]);}
async function orderProof(repo:PlatformRepository,kernel:PlatformKernel,r:WorkspaceRecord,line:Line){
 if(!line.orderId)return null;
 try{
  const p=await (await marketForRecord(repo,kernel,line.orderId)).resourceOrderProjection(line.orderId),claim=await repo.getWorkspaceRecord(p.tenantId,await allocationId(p.tenantId,line.orderId));
  const matches=p.buyerId===r.createdBy&&p.ownerId===line.ownerId&&p.shopId===line.shopId&&p.stockItemId===line.stockItemId&&unit(p.unit)===unit(line.unit)&&p.activeQuantity>=line.quantity&&!p.disputed&&claim?.data.planId===r.id&&claim.data.lineId===line.id&&claim.data.planTenantId===r.tenantId;
  return matches?{orderId:line.orderId,version:p.version,state:p.state,quantity:p.activeQuantity,source:'MARKETPLACE.CORE',paymentConfirmed:false}:null;
 }catch{return null;}
}
async function view(repo:PlatformRepository,kernel:PlatformKernel,r:WorkspaceRecord,members:Set<string>,revalidate=true){
 const c=kernel.context.get(),own=r.createdBy===c.actorId,result=[];
 for(const line of lines(r).filter(x=>own||x.ownerId===c.actorId)){
  if(!revalidate){result.push({...line,sourceCurrent:null,availableNow:null,state:'RECHECK_REQUIRED',proof:null});continue;}
  let current:Awaited<ReturnType<typeof offer>>|null=null;try{current=await offer(repo,kernel,line.shopId,line.stockItemId);}catch{}
  const sourceCurrent=Boolean(current&&current.ownerId===line.ownerId&&current.fingerprint===line.offerFingerprint&&members.has(line.ownerId));
  const proof=sourceCurrent&&line.decision==='ACCEPTED'?await orderProof(repo,kernel,r,line):null;
  const ended=Date.parse(line.endsAt)<=Date.now();
  result.push({...line,sourceCurrent,availableNow:current?.available??null,state:ended?'ENDED':line.decision==='WITHDRAWN'||line.decision==='DECLINED'?line.decision:!sourceCurrent?'SOURCE_NEEDS_REVIEW':proof?'CANONICAL_ORDER_LINKED':line.decision==='ACCEPTED'?'ACCEPTED_NOT_RESERVED':'PROVISIONAL',proof});
 }
 return {id:r.id,title:own?r.title:'Resource request',groupId:r.groupId,plannerId:r.createdBy,own,version:Number(r.data.version),state:r.data.planState,lines:result,privatePlan:true,sourcesRevalidated:revalidate,automaticReservation:false,financialWrites:false,reservationOwner:'MARKETPLACE.CORE',allocationLimit:'one canonical order per plan line; no calendar overbooking engine'};
}
export async function createResourceAssembly(repo:PlatformRepository,kernel:PlatformKernel,input:ResourceAssemblyInput){
 const c=await actor(repo,kernel),title=clean(input.title,180),groupId=clean(input.groupId,180);
 const members=await participants(repo,c.tenantId,groupId);if(!title||!groupId||!members.has(c.actorId))throw Error('RESOURCE_ASSEMBLY_GROUP_REQUIRED');
 if(input.consent!==true)throw Error('RESOURCE_REQUEST_SHARE_CONSENT_REQUIRED');
 if(!/^[a-zA-Z0-9_-]{8,120}$/.test(input.idempotencyKey))throw Error('INVALID_IDEMPOTENCY_KEY');
 if(!Array.isArray(input.lines)||!input.lines.length||input.lines.length>4)throw Error('RESOURCE_ASSEMBLY_LINE_LIMIT');
 const selected:Line[]=[],seen=new Set<string>();
 for(const inputLine of input.lines){
  if(!inputLine||typeof inputLine!=='object')throw Error('RESOURCE_ASSEMBLY_LINE_REQUIRED');
  const resource=await offer(repo,kernel,clean(inputLine.shopId,180),clean(inputLine.stockItemId,180)),name=clean(inputLine.name,180),conditions=clean(inputLine.conditions),quantity=inputLine.quantity,start=Date.parse(inputLine.startsAt),end=Date.parse(inputLine.endsAt);
  if(!name||!conditions||!Number.isSafeInteger(quantity)||quantity<=0||quantity>1000000||unit(inputLine.unit)!==unit(resource.unit))throw Error('RESOURCE_ASSEMBLY_QUANTITY_OR_UNIT');
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<Date.now()-60000||end<=start||end>Date.now()+366*86400000)throw Error('RESOURCE_ASSEMBLY_DATES');
   if(resource.availableAt&&start<Date.parse(resource.availableAt)||resource.availableUntil&&end>Date.parse(resource.availableUntil))throw Error('RESOURCE_ASSEMBLY_OUTSIDE_OFFER_PERIOD');
  if(resource.ownerId===c.actorId||!members.has(resource.ownerId))throw Error('RESOURCE_OWNER_GROUP_REQUIRED');
  if(seen.has(resource.stockItemId))throw Error('RESOURCE_ASSEMBLY_DUPLICATE_RESOURCE');seen.add(resource.stockItemId);
  selected.push({id:makeId('resource_line'),name,shopId:resource.shopId,stockItemId:resource.stockItemId,ownerId:resource.ownerId,quantity,unit:resource.unit,startsAt:new Date(start).toISOString(),endsAt:new Date(end).toISOString(),conditions,offerFingerprint:resource.fingerprint,decision:'REQUESTED',decisionNote:'',decidedAt:'',orderId:''});
 }
 const fingerprint=await digest([title,groupId,selected.map(({id,...line})=>line)]),at=new Date().toISOString(),id='assembly_'+await digest([c.tenantId,c.actorId,input.idempotencyKey]),record:WorkspaceRecord={id,tenantId:c.tenantId,groupId,moduleId,title,status:'ACTIVE',tags:['business-studio','resource-assembly','governed-productive','private'],createdBy:c.actorId,createdAt:at,updatedAt:at,data:{businessKind:'RESOURCE_ASSEMBLY',planState:'ACTIVE',version:1,linesJson:JSON.stringify(selected),eventsJson:'[]',creationFingerprint:fingerprint}};
 const inserted=await repo.insertGovernedRecord(record);if(inserted.record.createdBy!==c.actorId||inserted.record.data.creationFingerprint!==fingerprint)throw Error('RESOURCE_ASSEMBLY_IDEMPOTENCY_CONFLICT');return view(repo,kernel,inserted.record,members);
}
export async function resourceAssemblies(repo:PlatformRepository,kernel:PlatformKernel){
 const c=await actor(repo,kernel),members=await participants(repo,c.tenantId,String(c.activeGroupId??''));if(!members.has(c.actorId))return{items:[],limit:30,automaticReservation:false};
 const rows=(await repo.listWorkspaceRecords(c.tenantId,moduleId)).filter(r=>r.groupId===c.activeGroupId&&r.data.businessKind==='RESOURCE_ASSEMBLY'&&members.has(r.createdBy)&&(r.createdBy===c.actorId||lines(r).some(x=>x.ownerId===c.actorId))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),items=[];
 for(const r of rows.slice(0,30))items.push(await view(repo,kernel,r,members,false));
 return {items,limit:30,automaticReservation:false,sourcesRevalidated:false};
}
export async function readResourceAssembly(repo:PlatformRepository,kernel:PlatformKernel,id:string){const {r,members}=await get(repo,kernel,id);return view(repo,kernel,r,members);}
export async function updateResourceAssembly(repo:PlatformRepository,kernel:PlatformKernel,id:string,input:ResourceAssemblyCommand){
 const {c,r,members}=await get(repo,kernel,id),version=Number(r.data.version),own=r.createdBy===c.actorId,note=clean(input.note),all=lines(r),at=new Date().toISOString(),history=JSON.parse(String(r.data.eventsJson)) as unknown[];
 if(input.expectedVersion!==version)throw Error('RESOURCE_ASSEMBLY_VERSION_CONFLICT');if(r.data.planState==='ARCHIVED')throw Error('RESOURCE_ASSEMBLY_ARCHIVED');
 if(history.length>=200)throw Error('RESOURCE_ASSEMBLY_HISTORY_FULL');
 let planState=String(r.data.planState);
 if(input.action==='ARCHIVE'){if(!own)throw Error('FORBIDDEN_SCOPE');planState='ARCHIVED';}
 else{
  const line=all.find(x=>x.id===input.lineId);if(!line||(!own&&line.ownerId!==c.actorId))throw Error('RESOURCE_ASSEMBLY_LINE_NOT_FOUND');
  if(!note)throw Error('RESOURCE_ASSEMBLY_REASON_REQUIRED');
  if(['ACCEPT','DECLINE'].includes(input.action)){
   if(c.actorId!==line.ownerId||line.decision==='WITHDRAWN')throw Error('RESOURCE_OWNER_REQUIRED');
   const current=await offer(repo,kernel,line.shopId,line.stockItemId);if(current.ownerId!==c.actorId||current.fingerprint!==line.offerFingerprint)throw Error('RESOURCE_ASSEMBLY_SOURCE_CHANGED');
   if(Date.parse(line.endsAt)<=Date.now())throw Error('RESOURCE_ASSEMBLY_ENDED');line.decision=input.action==='ACCEPT'?'ACCEPTED':'DECLINED';
  }else if(input.action==='WITHDRAW'){if(!own&&c.actorId!==line.ownerId)throw Error('FORBIDDEN_SCOPE');line.decision='WITHDRAWN';}
  else if(input.action==='LINK_ORDER'){
   if(!own||line.decision!=='ACCEPTED'||Date.parse(line.endsAt)<=Date.now())throw Error('RESOURCE_ASSEMBLY_ACCEPTANCE_REQUIRED');
    if(!members.has(line.ownerId))throw Error('RESOURCE_OWNER_GROUP_REQUIRED');
   const current=await offer(repo,kernel,line.shopId,line.stockItemId);if(current.fingerprint!==line.offerFingerprint)throw Error('RESOURCE_ASSEMBLY_SOURCE_CHANGED');
   const orderId=clean(input.orderId,180);if(line.orderId&&line.orderId!==orderId)throw Error('RESOURCE_ASSEMBLY_ORDER_ALREADY_LINKED');
    const p=await (await marketForRecord(repo,kernel,orderId)).resourceOrderProjection(orderId);
   if(p.buyerId!==c.actorId||p.ownerId!==line.ownerId||p.shopId!==line.shopId||p.stockItemId!==line.stockItemId||unit(p.unit)!==unit(line.unit)||p.activeQuantity<line.quantity||p.disputed)throw Error('RESOURCE_ASSEMBLY_ORDER_MISMATCH');
    const claim:WorkspaceRecord={id:await allocationId(p.tenantId,orderId),tenantId:p.tenantId,moduleId,title:'Canonical resource order assignment',status:'ACTIVE',tags:['business-studio','resource-allocation','governed-productive','immutable','private'],createdBy:c.actorId,createdAt:at,updatedAt:at,data:{businessKind:'RESOURCE_ALLOCATION_CLAIM',planId:r.id,planTenantId:r.tenantId,lineId:line.id,orderId}};
    const inserted=await repo.insertGovernedRecord(claim);if(inserted.record.createdBy!==c.actorId||inserted.record.data.planId!==r.id||inserted.record.data.planTenantId!==r.tenantId||inserted.record.data.lineId!==line.id)throw Error('RESOURCE_ORDER_ALREADY_ALLOCATED');line.orderId=orderId;
  }else throw Error('INVALID_RESOURCE_ASSEMBLY_ACTION');
  line.decisionNote=note;line.decidedAt=at;
 }
 const next={...r,updatedAt:at,data:{...r.data,version:version+1,planState,linesJson:JSON.stringify(all),eventsJson:JSON.stringify([...history,{action:input.action,lineId:input.lineId??'',actorId:c.actorId,at}])}};
 await repo.commitWorkspaceRecordRevision(next,version);return view(repo,kernel,next,members);
}
