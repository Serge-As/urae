import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {MarketService} from '../../market/src/index.js';

const MODULE='MANAGER.BUSINESS_STUDIO';
const categories=['MATERIALS','TRANSPORT','LABOUR','FEES','OTHER'] as const;
type CostKind=typeof categories[number];
type Costs=Record<CostKind,number|null>;
export interface ExperimentInput{
 title:string;customer:string;problem:string;offer:string;quantity:number;unit:string;
 currency?:string;prices:number[];costs:Partial<Costs>;minutes?:number|null;
 endsAt:string;minimumOrders?:number|null;minimumGrossMargin?:number|null;
 previousExperimentId?:string;idempotencyKey:string;
}
export interface ExperimentObservationInput{
 costs:Partial<Costs>;minutes?:number|null;cashReceived?:number|null;note:string;idempotencyKey:string;
}
const clean=(x:unknown,max=1000)=>String(x??'').trim().slice(0,max);
const required=(x:unknown,max=1000)=>{const v=clean(x,max);if(!v)throw Error('EXPERIMENT_FIELD_REQUIRED');return v;};
const integer=(x:unknown)=>{if(typeof x!=='number'||!Number.isSafeInteger(x)||x<0||x>1e12)throw Error('INVALID_EXPERIMENT_AMOUNT');return x;};
const optional=(x:unknown)=>x===undefined||x===null||x===''?null:integer(x);
const readCosts=(input:Partial<Costs>):Costs=>Object.fromEntries(categories.map(key=>[key,optional(input?.[key])])) as Costs;
const parse=<T>(s:unknown,f:T):T=>{try{return JSON.parse(String(s)) as T;}catch{return f;}};
const digest=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const canonicalUnit=(s:unknown)=>clean(s,80).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/s$/,'').replace(/^(u|piece|unite)$/,'unit');
const total=(c:Costs)=>({knownSubtotal:categories.reduce((n,k)=>n+(c[k]??0),0),missing:categories.filter(k=>c[k]===null),complete:categories.every(k=>c[k]!==null)});
async function owned(repo:PlatformRepository,kernel:PlatformKernel,id:string,kind='EXPERIMENT'){
 const c=kernel.context.get(),r=await repo.getWorkspaceRecord(c.tenantId,id);
 if(!r||r.moduleId!==MODULE||!r.tags.includes('business-experiment')||r.createdBy!==c.actorId||r.data.businessKind!==kind)throw Error('EXPERIMENT_NOT_FOUND');
 return r;
}
async function append(repo:PlatformRepository,kernel:PlatformKernel,kind:string,key:string,title:string,values:WorkspaceRecord['data']){
 if(!/^[a-zA-Z0-9_.:-]{8,160}$/.test(key))throw Error('EXPERIMENT_REQUEST_KEY_REQUIRED');
 const c=kernel.context.get(),data={...values,businessKind:kind},fingerprint=await digest(JSON.stringify([title,data]));
 const id='be_'+await digest(JSON.stringify([c.tenantId,c.actorId,kind,key])),at=new Date().toISOString();
 const result=await repo.insertGovernedRecord({id,tenantId:c.tenantId,moduleId:MODULE,title,status:'ACTIVE',tags:['business-studio','business-experiment','immutable'],data:{...data,fingerprint},createdBy:c.actorId,createdAt:at,updatedAt:at});
 if(result.record.data.fingerprint!==fingerprint)throw Error('GOVERNED_RECORD_CONFLICT');
 if(result.inserted)await repo.saveAudit(kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'BUSINESS_'+kind,targetType:'business-experiment',targetId:id,requestId:c.requestId}));
 return result.record;
}
export async function createExperiment(repo:PlatformRepository,kernel:PlatformKernel,input:ExperimentInput){
 const quantity=Number(input.quantity),currency=clean(input.currency||'XAF',12).toUpperCase(),unit=required(input.unit,80);
 if(typeof input.quantity!=='number'||!Number.isFinite(quantity)||quantity<=0||quantity>1e6)throw Error('INVALID_EXPERIMENT_QUANTITY');
 if(!Array.isArray(input.prices)||input.prices.length!==2)throw Error('TWO_EXPERIMENT_PRICES_REQUIRED');
 const prices=input.prices.map(integer);if(prices.some(p=>!Number.isSafeInteger(Math.round(p*quantity))))throw Error('EXPERIMENT_AMOUNT_OVERFLOW');
 if(!Number.isFinite(Date.parse(input.endsAt))||Date.parse(input.endsAt)<=Date.now())throw Error('INVALID_EXPERIMENT_END');
 const costs=readCosts(input.costs),minutes=optional(input.minutes);
 if(input.previousExperimentId)await owned(repo,kernel,input.previousExperimentId);
 return append(repo,kernel,'EXPERIMENT',input.idempotencyKey,required(input.title,240),{
  customer:required(input.customer,500),problem:required(input.problem),offer:required(input.offer),quantity,unit,currency,
  pricesJson:JSON.stringify(prices),costsJson:JSON.stringify(costs),minutes,endsAt:new Date(input.endsAt).toISOString(),
  minimumOrders:optional(input.minimumOrders),minimumGrossMargin:optional(input.minimumGrossMargin),
  previousExperimentId:input.previousExperimentId??'',effect:'HYPOTHESIS_ONLY',version:1
 });
}
export async function observeExperiment(repo:PlatformRepository,kernel:PlatformKernel,id:string,input:ExperimentObservationInput){
 await owned(repo,kernel,id);
 return append(repo,kernel,'EXPERIMENT_OBSERVATION',input.idempotencyKey,'Declared experiment observation',{
  experimentId:id,costsJson:JSON.stringify(readCosts(input.costs)),minutes:optional(input.minutes),cashReceived:optional(input.cashReceived),
  note:required(input.note,2000),source:'SELF_DECLARED',financialEffect:false
 });
}
export async function linkExperimentOrder(repo:PlatformRepository,kernel:PlatformKernel,id:string,orderId:string){
 await owned(repo,kernel,id);const market=new MarketService(repo,kernel),{scopeId}=await market.businessOrderProjection(orderId);
 const c=kernel.context.get(),links=(await repo.listWorkspaceRecords(c.tenantId,MODULE)).filter(x=>x.createdBy===c.actorId&&x.tags.includes('business-experiment')&&x.data.businessKind==='EXPERIMENT_ORDER_LINK'&&x.data.experimentId===id);
 if(links.length>=20&&!links.some(x=>x.data.orderId===orderId))throw Error('EXPERIMENT_ORDER_LIMIT');
 return append(repo,kernel,'EXPERIMENT_ORDER_LINK',await digest(id+':'+orderId),'Canonical order reference',{experimentId:id,orderId,scopeId});
}
export async function listExperiments(repo:PlatformRepository,kernel:PlatformKernel){
 const c=kernel.context.get(),items=(await repo.listWorkspaceRecords(c.tenantId,MODULE)).filter(r=>r.createdBy===c.actorId&&r.tags.includes('business-experiment')&&r.data.businessKind==='EXPERIMENT');
 items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));return{items:items.slice(0,100),total:items.length,limit:100};
}
export async function reviewExperiment(repo:PlatformRepository,kernel:PlatformKernel,id:string,observationId?:string){
 const r=await owned(repo,kernel,id),c=kernel.context.get(),rows=(await repo.listWorkspaceRecords(c.tenantId,MODULE)).filter(x=>x.createdBy===c.actorId&&x.tags.includes('business-experiment')&&x.data.experimentId===id);
 const observations=rows.filter(x=>x.data.businessKind==='EXPERIMENT_OBSERVATION');
 const observation=observationId?observations.find(x=>x.id===observationId):undefined;
 if(observationId&&!observation)throw Error('EXPERIMENT_OBSERVATION_NOT_FOUND');
 const plannedCosts=parse<Costs>(r.data.costsJson,readCosts({})),planned=total(plannedCosts),quantity=Number(r.data.quantity);
 const forecasts=parse<number[]>(r.data.pricesJson,[]).map(price=>({unitPrice:price,quantity,forecastRevenue:Math.round(price*quantity),knownCosts:planned.knownSubtotal,missingCosts:planned.missing,grossMargin:planned.complete?Math.round(price*quantity)-planned.knownSubtotal:null,source:'HYPOTHESIS_ONLY'}));
 const market=new MarketService(repo,kernel),orders:Array<{orderId:string;status:string;quantity?:number;contractValue?:number;returnedQuantity?:number;currency?:string;unit?:string}>=[];
 let netDelivered=0,deliveredContractValue=0,deliveredOrders=0,ordersComplete=true;
 const allLinks=[...new Map(rows.filter(x=>x.data.businessKind==='EXPERIMENT_ORDER_LINK').map(x=>[String(x.data.orderId),x])).values()],links=allLinks.slice(0,20);
 if(!links.length||allLinks.length>links.length)ordersComplete=false;
 for(const link of links){
  try{
   const history=await market.businessOrderProjection(String(link.data.orderId)),order=history.order;
   const unit=String(order.data.unit??''),currency=String(order.data.currency??'XAF');
   if(currency!==r.data.currency||canonicalUnit(unit)!==canonicalUnit(r.data.unit)){ordersComplete=false;orders.push({orderId:order.id,status:'NOT_COMPARABLE',currency,unit});continue;}
   const delivered=history.netDelivered,amount=Math.round(delivered*Number(order.data.acceptedUnitPrice??order.data.unitPrice));
   if(!Number.isSafeInteger(amount)||amount<0)throw Error('INVALID_CANONICAL_ORDER_AMOUNT');
   netDelivered+=delivered;deliveredContractValue+=amount;if(delivered>0)deliveredOrders++;
   orders.push({orderId:order.id,status:'CANONICAL_READ',quantity:delivered,returnedQuantity:Number(order.data.returnedQuantity??0),contractValue:amount,currency,unit});
  }catch{ordersComplete=false;orders.push({orderId:String(link.data.orderId),status:'CURRENT_ACCESS_UNAVAILABLE'});}
 }
 if(!Number.isSafeInteger(deliveredContractValue))throw Error('EXPERIMENT_AMOUNT_OVERFLOW');
 const actualCosts=observation?parse<Costs>(observation.data.costsJson,readCosts({})):readCosts({}),actual=total(actualCosts);
 const complete=actual.complete&&ordersComplete&&Boolean(observation)&&links.length>0;
 const margin=complete?deliveredContractValue-actual.knownSubtotal:null;
 const minutes=observation?.data.minutes??null,cash=observation?.data.cashReceived??null;
 const minimumOrders=r.data.minimumOrders===null?null:Number(r.data.minimumOrders),minimumMargin=r.data.minimumGrossMargin===null?null:Number(r.data.minimumGrossMargin);
 const thresholdSatisfied=(minimumOrders===null||deliveredOrders>=minimumOrders)&&(minimumMargin===null||margin!==null&&margin>=minimumMargin);
 const decision=minimumOrders===null&&minimumMargin===null?'NO_THRESHOLD':!complete?'NOT_CONFIRMED':thresholdSatisfied?'THRESHOLD_MET':'THRESHOLD_NOT_MET';
 return{experiment:r,forecasts,observations,selectedObservationId:observation?.id??null,orders,totalLinkedOrders:allLinks.length,orderReadLimit:20,observed:{source:'CANONICAL_DELIVERIES_WITH_DECLARED_COSTS',ordersComplete,deliveredOrders:ordersComplete?deliveredOrders:null,netDelivered:ordersComplete?netDelivered:null,deliveredContractValue:ordersComplete?deliveredContractValue:null,knownCosts:actual.knownSubtotal,missingCosts:actual.missing,grossMargin:margin,minutes,cashReceivedDeclared:cash,cashFlowDeclared:cash!==null&&actual.complete?Number(cash)-actual.knownSubtotal:null,grossMarginPerHour:margin!==null&&Number(minutes)>0?Math.round(margin!/(Number(minutes)/60)):null},decision,ended:Date.parse(String(r.data.endsAt))<=Date.now(),paymentStatus:'NOT_INFERRED',financialEffect:false};
}
export async function experimentPublicationDraft(repo:PlatformRepository,kernel:PlatformKernel,id:string,priceIndex:number){
 const r=await owned(repo,kernel,id);if(priceIndex!==0&&priceIndex!==1)throw Error('INVALID_EXPERIMENT_PRICE_CHOICE');
 return{title:r.title,description:String(r.data.offer),quantity:Number(r.data.quantity),unit:String(r.data.unit),currency:String(r.data.currency),unitPrice:parse<number[]>(r.data.pricesJson,[])[priceIndex],sourceExperimentId:r.id,published:false,requiresExplicitConfirmation:true};
}
