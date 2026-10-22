import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {MarketService} from '../../market/src/index.js';
import type {AdManagerService} from './index.js';

type Event={id:string;kind:'DELIVERY'|'IMPRESSION'|'OPEN'|'CONTACT'|'ORDER';at:string;viewer:string;deliveryId?:string;orderId?:string};
type Pilot={maximumDeliveries:number;events:Event[]};
const hash=async(v:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(x=>x.toString(16).padStart(2,'0')).join('');
const read=(r:WorkspaceRecord):Pilot=>{try{const p=JSON.parse(String(r.data.internalPilotJson??''));if(Number.isSafeInteger(p.maximumDeliveries)&&Array.isArray(p.events))return p;}catch{}throw Error('INVALID_INTERNAL_PILOT');};
const stamp=()=>new Date().toISOString(),placements=['HOME_AFTER_PRIORITIES','FEED_NATIVE','FORUM_NATIVE','MARKETPLACE_SPONSORED'];
export const pilotSummary=(r:WorkspaceRecord)=>{if(!r.tags.includes('ad-pilot'))return null;const p=read(r);return{mode:'FREE_INTERNAL',maximumDeliveries:p.maximumDeliveries,servedDeliveries:p.events.filter(x=>x.kind==='DELIVERY').length,confirmedImpressions:p.events.filter(x=>x.kind==='IMPRESSION').length,chargedAmount:0,measurementOwner:'AdManagerService'};};

/** An implementation detail of AdManagerService, using its campaigns and moderation. */
export class InternalPilotOperations{
 constructor(private repo:PlatformRepository,private kernel:PlatformKernel,private owner:AdManagerService){}
 private async member(groupId:string){const c=this.kernel.context.get(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');if(g.createdBy!==c.actorId&&!(await this.repo.listMemberships(c.tenantId,groupId)).some(m=>m.userId===c.actorId&&m.status==='active'))throw Error('FORBIDDEN_SCOPE');return g;}
 private async record(groupId:string,id:string){const c=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!=='ADS.MANAGER'||!r.tags.includes('ad-pilot'))throw Error('INTERNAL_PILOT_NOT_FOUND');return r;}
 private async consent(groupId:string,confirmed:boolean){if(confirmed!==true)throw Error('PILOT_EXPLICIT_CONSENT_REQUIRED');const c=this.kernel.context.get();if(!this.owner.measurementConsent||!await this.owner.measurementConsent(groupId,c.actorId))throw Error('PILOT_MEASUREMENT_CONSENT_UNAVAILABLE');}
 async create(groupId:string,input:{name:string;headline:string;body:string;destinationRef:string;maximumDeliveries:number;frequencyCap:number;endsAt:string;idempotencyKey:string}){
  await this.owner.list(groupId);const c=this.kernel.context.get(),name=String(input.name??'').trim().slice(0,160),headline=String(input.headline??'').trim().slice(0,120),body=String(input.body??'').trim().slice(0,1000),destination=String(input.destinationRef??'').trim(),end=Date.parse(input.endsAt);
  if(!name||!headline||!body||!/^module:[A-Z0-9._-]{1,100}$/.test(destination))throw Error('INVALID_PILOT_CREATIVE');
  if(!Number.isSafeInteger(input.maximumDeliveries)||input.maximumDeliveries<1||input.maximumDeliveries>100||!Number.isSafeInteger(input.frequencyCap)||input.frequencyCap<1||input.frequencyCap>10)throw Error('INVALID_PILOT_CAP');
  if(!Number.isFinite(end)||end<=Date.now()||end-Date.now()>30*86400000)throw Error('INVALID_PILOT_PERIOD');
  if(!/^[A-Za-z0-9_-]{8,120}$/.test(input.idempotencyKey))throw Error('INVALID_IDEMPOTENCY_KEY');
  const id='ad_pilot_'+await hash([c.tenantId,c.actorId,groupId,input.idempotencyKey]),fingerprint=JSON.stringify([name,headline,body,destination,input.maximumDeliveries,input.frequencyCap,new Date(end).toISOString()]),at=stamp();
  const campaign:WorkspaceRecord={id,tenantId:c.tenantId,groupId,moduleId:'ADS.MANAGER',title:name,status:'DRAFT',tags:['ad-campaign','ad-pilot','sandbox','state:DRAFT'],data:{objective:'LEAD',state:'DRAFT',budgetSandbox:0,currency:'XAF',startsAt:at,endsAt:new Date(end).toISOString(),placementsJson:JSON.stringify(placements),frequencyCapPer7Days:input.frequencyCap,targetingJson:'{}',creativeJson:JSON.stringify({headline,body,callToAction:'Découvrir',destinationRef:destination}),impressions:0,opens:0,actions:0,negativeFeedback:0,version:1,creationFingerprint:fingerprint,internalPilotJson:JSON.stringify({maximumDeliveries:input.maximumDeliveries,events:[]})},createdBy:c.actorId,createdAt:at,updatedAt:at};
  const result=await this.repo.insertGovernedRecord(campaign);if(result.record.createdBy!==c.actorId||result.record.data.creationFingerprint!==fingerprint)throw Error('PILOT_IDEMPOTENCY_CONFLICT');
  return{id:result.record.id,state:String(result.record.data.state),...pilotSummary(result.record)};
 }
 async available(groupId:string){await this.member(groupId);const c=this.kernel.context.get(),all=await this.repo.listWorkspaceRecords(c.tenantId,'ADS.MANAGER',groupId);return all.filter(r=>r.tags.includes('ad-pilot')&&r.data.state==='ACTIVE'&&Date.parse(String(r.data.endsAt))>Date.now()).slice(0,100).map(r=>({id:r.id,name:r.title,endsAt:r.data.endsAt,...pilotSummary(r)})).filter(p=>p.servedDeliveries!<p.maximumDeliveries!);}
 private async change(groupId:string,id:string,fn:(r:WorkspaceRecord,p:Pilot)=>Event|undefined){
  for(let i=0;i<4;i++){const r=await this.record(groupId,id),p=read(r),event=fn(r,p);if(!event)return{record:r,event:undefined};const prior=p.events.find(x=>x.id===event.id);if(prior)return{record:r,event:prior};if(p.events.length>=500)throw Error('PILOT_EVENT_LIMIT');p.events.push(event);const next:WorkspaceRecord={...r,data:{...r.data,internalPilotJson:JSON.stringify(p),version:Number(r.data.version??1)+1},updatedAt:stamp()};
   try{await this.repo.commitWorkspaceRecordRevision(next,Number(r.data.version??1));return{record:next,event};}catch(e){if(!(e instanceof Error)||e.message!=='MARKET_RECORD_CONFLICT')throw e;}
  }throw Error('PILOT_CONCURRENT_RETRY');
 }
 async delivery(groupId:string,id:string,input:{placementId:string;idempotencyKey:string;consent:boolean;test?:boolean}){
  await this.member(groupId);await this.consent(groupId,input.consent);if(!placements.includes(input.placementId))throw Error('PILOT_PLACEMENT_FORBIDDEN');if(!/^[A-Za-z0-9_-]{8,120}$/.test(input.idempotencyKey))throw Error('INVALID_IDEMPOTENCY_KEY');
  const c=this.kernel.context.get(),viewer=await hash([c.tenantId,id,c.actorId]),eventId='delivery_'+await hash([viewer,input.placementId,input.idempotencyKey]);let reason='NOT_AVAILABLE';
  const result=await this.change(groupId,id,(r,p)=>{if(r.createdBy===c.actorId||input.test===true){reason='OWNER_OR_TEST_EXCLUDED';return;}const old=p.events.find(x=>x.id===eventId);if(old)return old;
   if(r.data.state!=='ACTIVE'||Date.parse(String(r.data.endsAt))<=Date.now()||Date.parse(String(r.data.startsAt))>Date.now()){reason='INACTIVE_OR_EXPIRED';return;}
   if(p.events.filter(x=>x.kind==='DELIVERY').length>=p.maximumDeliveries){reason='DELIVERY_CAP_REACHED';return;}
   if(p.events.filter(x=>x.kind==='DELIVERY'&&x.viewer===viewer&&Date.now()-Date.parse(x.at)<7*86400000).length>=Number(r.data.frequencyCapPer7Days)){reason='FREQUENCY_CAP_REACHED';return;}
   return{id:eventId,kind:'DELIVERY',at:stamp(),viewer};
  });
  if(!result.event)return{served:false,reason};const creative=JSON.parse(String(result.record.data.creativeJson));return{served:true,campaignId:id,deliveryId:result.event.id,servedAt:result.event.at,headline:creative.headline,body:creative.body,destinationRef:creative.destinationRef,chargedAmount:0,impressionConfirmed:false};
 }
 async interact(groupId:string,id:string,input:{deliveryId:string;kind:'IMPRESSION'|'OPEN'|'CONTACT';consent:boolean}){
  await this.member(groupId);await this.consent(groupId,input.consent);if(!['IMPRESSION','OPEN','CONTACT'].includes(input.kind))throw Error('INVALID_PILOT_EVENT');
  const c=this.kernel.context.get(),viewer=await hash([c.tenantId,id,c.actorId]);
  const result=await this.change(groupId,id,(_r,p)=>{const d=p.events.find(e=>e.kind==='DELIVERY'&&e.id===input.deliveryId&&e.viewer===viewer);if(!d||Date.now()-Date.parse(d.at)>7*86400000)throw Error('PILOT_ATTRIBUTION_WINDOW_CLOSED');return{id:d.id+'_'+input.kind,kind:input.kind,viewer,deliveryId:d.id,at:stamp()};});return{recorded:true,kind:result.event!.kind,chargedAmount:0};
 }
 async linkOrder(groupId:string,id:string,input:{deliveryId:string;orderId:string;consent:boolean}){
  await this.member(groupId);await this.consent(groupId,input.consent);const c=this.kernel.context.get(),market=new MarketService(this.repo,this.kernel),order=(await market.buyerOrderHistory(input.orderId)).order;
  if(order.data.buyerUserId!==c.actorId||order.groupId!==groupId)throw Error('PILOT_BUYER_ORDER_REQUIRED');
  const viewer=await hash([c.tenantId,id,c.actorId]);await this.change(groupId,id,(r,p)=>{if(r.createdBy===c.actorId)throw Error('PILOT_SELF_ATTRIBUTION_FORBIDDEN');const d=p.events.find(e=>e.kind==='DELIVERY'&&e.id===input.deliveryId&&e.viewer===viewer);const orderAt=Date.parse(order.createdAt);if(!d||orderAt<Date.parse(d.at)||orderAt>Date.parse(d.at)+7*86400000||Date.now()-Date.parse(d.at)>7*86400000)throw Error('PILOT_ATTRIBUTION_WINDOW_CLOSED');const prior=p.events.find(e=>e.kind==='ORDER'&&e.orderId===order.id);if(prior)return prior;if(p.events.filter(x=>x.kind==='ORDER').length>=20)throw Error('PILOT_ORDER_REFERENCE_LIMIT');return{id:'order_'+order.id,kind:'ORDER',viewer,deliveryId:d.id,orderId:order.id,at:stamp()};});return{linked:true,paymentStatus:'NOT_INFERRED'};
 }
 async report(groupId:string,id:string){
  const {record:r}=await this.owner.get(groupId,id);if(!r.tags.includes('ad-pilot'))throw Error('INTERNAL_PILOT_NOT_FOUND');const p=read(r),links=p.events.filter(e=>e.kind==='ORDER');let complete=true,value=0,deliveredOrders=0;
  const quantities:Record<string,{netDelivered:number;returned:number;cancelled:number}>={};
  const market=new MarketService(this.repo,this.kernel);for(const e of links){try{const v=await market.businessOrderProjection(e.orderId!);if(v.order.groupId!==groupId||v.order.data.currency!==r.data.currency)throw Error('SCOPE_OR_CURRENCY');const unit=String(v.order.data.unit),q=quantities[unit]??{netDelivered:0,returned:0,cancelled:0};q.netDelivered+=v.netDelivered;q.returned+=Number(v.order.data.returnedQuantity??0);q.cancelled+=Number(v.order.data.cancelledQuantity??0);quantities[unit]=q;value+=v.netDelivered*Number(v.order.data.acceptedUnitPrice??v.order.data.unitPrice);if(!Number.isSafeInteger(value))throw Error('AMOUNT_OVERFLOW');if(v.netDelivered>0)deliveredOrders++;}catch{complete=false;}}
  const units=Object.keys(quantities),single=units.length===1?quantities[units[0]!]!:undefined;
  return{campaignId:id,name:r.title,state:r.data.state,endsAt:r.data.endsAt,...pilotSummary(r),opens:p.events.filter(e=>e.kind==='OPEN').length,contactIntents:p.events.filter(e=>e.kind==='CONTACT').length,linkedOrders:links.length,ordersWithCurrentDelivery:complete?deliveredOrders:null,netDelivered:complete&&single?single.netDelivered:null,returnedQuantity:complete&&single?single.returned:null,cancelledQuantity:complete&&single?single.cancelled:null,quantityUnit:complete&&single?units[0]:null,quantitiesByUnit:complete?quantities:null,deliveredContractValue:complete?value:null,currency:r.data.currency,complete,attributionWindowDays:7,attribution:'BUYER_DECLARED_NOT_EXCLUSIVE',cashRevenue:null,paymentStatus:'NOT_INFERRED',contactMeaning:'EXPLICIT_CONTACT_INTENT_NOT_VERIFIED_SALE',legacyCountersExcluded:true,generatedAt:stamp()};
 }
}
