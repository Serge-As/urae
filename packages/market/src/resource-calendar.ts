import type {MarketService,MarketRecord} from './index.js';

type Slot={id:string;buyerId:string;startsAt:string;endsAt:string;quantity:number;reference:string;state:'CONFIRMED'|'CANCELLED';createdAt:string;cancelledAt?:string;cancelledBy?:string;note:string;};
export interface ResourceCalendarConfiguration {expectedVersion:number;enabled:boolean;capacity:number;terms:string;}
export interface ResourceSlotInput {buyerId:string;startsAt:string;endsAt:string;quantity:number;reference:string;idempotencyKey:string;}
const clean=(v:unknown,n=1600)=>String(v??'').trim().slice(0,n);
const hash=async(v:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(x=>x.toString(16).padStart(2,'0')).join('');
export const resourceSlots=(item:MarketRecord)=>JSON.parse(String(item.data.resourceSlotsJson??'[]')) as Slot[];
export const hasActiveResourceSlots=(item:MarketRecord)=>resourceSlots(item).some(s=>s.state==='CONFIRMED'&&Date.parse(s.endsAt)>Date.now());

async function records(m:MarketService,shopId:string,itemId:string){
 const c=m.kernel.context.get(),shop=await m.repo.getWorkspaceRecord(c.tenantId,shopId),item=await m.repo.getWorkspaceRecord(c.tenantId,itemId);
 if(!shop||shop.moduleId!=='MARKETPLACE.CORE'||shop.data.marketKind!=='SHOP'||shop.data.ownerType!=='PERSON'||shop.status!=='ACTIVE'||!item||item.moduleId!=='MARKETPLACE.CORE'||item.data.marketKind!=='STOCK_ITEM'||String(item.data.marketScopeId??item.groupId)!==shopId||item.status!=='ACTIVE')throw Error('RESOURCE_OFFER_NOT_AVAILABLE');
 return{c,shop:shop as MarketRecord,item:item as MarketRecord};
}

function peak(slots:Array<Pick<Slot,'startsAt'|'endsAt'|'quantity'>>){
 const events=slots.flatMap(s=>[{at:Date.parse(s.startsAt),delta:s.quantity},{at:Date.parse(s.endsAt),delta:-s.quantity}]).sort((a,b)=>a.at-b.at||a.delta-b.delta);
 let current=0,maximum=0;for(const e of events){current+=e.delta;maximum=Math.max(maximum,current);}return maximum;
}

async function save(m:MarketService,item:MarketRecord,patch:Record<string,string|number|boolean|null>){
 const version=Number(item.data.version??1),next={...item,updatedAt:new Date().toISOString(),data:{...item.data,...patch,version:version+1}};
 await m.repo.commitWorkspaceRecordRevision(next,version);return next;
}

export async function configureResourceCalendar(m:MarketService,shopId:string,itemId:string,input:ResourceCalendarConfiguration){
 const {c,shop,item}=await records(m,shopId,itemId);if(shop.createdBy!==c.actorId)throw Error('SHOP_OWNER_REQUIRED');
 if(input.expectedVersion!==Number(item.data.version??1))throw Error('MARKET_RECORD_CONFLICT');
 if(typeof input.enabled!=='boolean'||!Number.isSafeInteger(input.capacity)||input.capacity<1||input.capacity>1000000)throw Error('INVALID_RESOURCE_CAPACITY');
 const terms=clean(input.terms);if(input.enabled&&!terms)throw Error('RESOURCE_TERMS_REQUIRED');
 const active=resourceSlots(item).filter(s=>s.state==='CONFIRMED'&&Date.parse(s.endsAt)>Date.now());
 if(active.length&&(!input.enabled||input.capacity!==Number(item.data.resourceCapacity)||terms!==String(item.data.resourceTerms)))throw Error('RESOURCE_HAS_ACTIVE_BOOKINGS');
 if(input.enabled&&(Number(item.data.reserved??0)>0||Number(item.data.quarantine??0)>0||input.capacity>Number(item.data.quantity)))throw Error('RESOURCE_STOCK_NOT_FREE');
 if(input.enabled&&item.data.ownership==='POT_RESERVED')throw Error('POT_STOCK_CANNOT_BE_RENTED');
 if(input.enabled&&item.data.temporalKind)throw Error('HARVEST_STOCK_CANNOT_BE_RENTED');
 const next=await save(m,item,{resourceCalendarEnabled:input.enabled,resourceCapacity:input.capacity,resourceTerms:terms});
 return{stockItemId:itemId,version:next.data.version,enabled:input.enabled,capacity:input.capacity,terms,paymentConfirmed:false};
}

export async function reserveResourceSlot(m:MarketService,shopId:string,itemId:string,input:ResourceSlotInput){
 const {c,shop,item}=await records(m,shopId,itemId);if(shop.createdBy!==c.actorId)throw Error('RESOURCE_OWNER_REQUIRED');
 if(!input.buyerId||input.buyerId===c.actorId||!await m.repo.getUser(input.buyerId))throw Error('RESOURCE_BUYER_REQUIRED');
 if(!/^[a-zA-Z0-9_-]{8,160}$/.test(input.idempotencyKey)||!clean(input.reference,300))throw Error('INVALID_IDEMPOTENCY_KEY');
 const start=Date.parse(input.startsAt),end=Date.parse(input.endsAt),quantity=input.quantity;
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end>Date.now()+366*86400000||!Number.isSafeInteger(quantity)||quantity<=0)throw Error('INVALID_RESOURCE_TIME');
 const id='resource_slot_'+await hash([c.tenantId,shopId,itemId,input.idempotencyKey]),all=resourceSlots(item),prior=all.find(s=>s.id===id),reference=clean(input.reference,300);
 if(prior){if(prior.buyerId!==input.buyerId||Date.parse(prior.startsAt)!==start||Date.parse(prior.endsAt)!==end||prior.quantity!==quantity||prior.reference!==reference)throw Error('RESOURCE_SLOT_IDEMPOTENCY_CONFLICT');return{...prior,stockItemId:itemId,version:Number(item.data.version),paymentConfirmed:false};}
 if(start<Date.now()-60000)throw Error('INVALID_RESOURCE_TIME');
 if(!item.data.resourceCalendarEnabled||shop.data.visibility!=='PUBLIC'||!item.data.published||item.data.pickupClosed===true)throw Error('RESOURCE_CALENDAR_UNAVAILABLE');
 if(item.data.availableAt&&start<Date.parse(String(item.data.availableAt))||item.data.availableUntil&&end>Date.parse(String(item.data.availableUntil)))throw Error('RESOURCE_ASSEMBLY_OUTSIDE_OFFER_PERIOD');
 const slot:Slot={id,buyerId:input.buyerId,startsAt:new Date(start).toISOString(),endsAt:new Date(end).toISOString(),quantity,reference,state:'CONFIRMED',createdAt:new Date().toISOString(),note:String(item.data.resourceTerms??'')};
 if(peak([...all.filter(s=>s.state==='CONFIRMED'&&Date.parse(s.endsAt)>Date.now()),slot])>Number(item.data.resourceCapacity))throw Error('RESOURCE_TIME_UNAVAILABLE');
 if(all.length>=200)throw Error('RESOURCE_CALENDAR_HISTORY_FULL');
 const next=await save(m,item,{resourceSlotsJson:JSON.stringify([...all,slot])});
 return{...slot,stockItemId:itemId,version:Number(next.data.version),paymentConfirmed:false};
}

export async function readResourceSlot(m:MarketService,shopId:string,itemId:string,id:string){
 const {c,shop,item}=await records(m,shopId,itemId),slot=resourceSlots(item).find(s=>s.id===id);
 if(!slot||![shop.createdBy,slot.buyerId].includes(c.actorId))throw Error('RESOURCE_SLOT_NOT_FOUND');
 return{...slot,stockItemId:itemId,ownerId:shop.createdBy,version:Number(item.data.version),paymentConfirmed:false};
}

export async function resourceReservation(m:MarketService,shopId:string,itemId:string,reference:string){
 const {c,shop,item}=await records(m,shopId,itemId),slot=resourceSlots(item).find(s=>s.reference===reference&&[shop.createdBy,s.buyerId].includes(c.actorId));
 return slot?readResourceSlot(m,shopId,itemId,slot.id):null;
}

export async function cancelResourceSlot(m:MarketService,shopId:string,itemId:string,id:string,note:string){
 const {c,shop,item}=await records(m,shopId,itemId),all=resourceSlots(item),slot=all.find(s=>s.id===id);
 if(!slot||![shop.createdBy,slot.buyerId].includes(c.actorId))throw Error('RESOURCE_SLOT_NOT_FOUND');
 if(slot.state==='CANCELLED')return readResourceSlot(m,shopId,itemId,id);
 if(!clean(note))throw Error('RESOURCE_CANCELLATION_REASON_REQUIRED');
 Object.assign(slot,{state:'CANCELLED',cancelledAt:new Date().toISOString(),cancelledBy:c.actorId,note:clean(note)});
 await save(m,item,{resourceSlotsJson:JSON.stringify(all)});return readResourceSlot(m,shopId,itemId,id);
}

export async function resourceCalendar(m:MarketService,shopId:string,itemId:string){
 const {c,shop,item}=await records(m,shopId,itemId),owner=shop.createdBy===c.actorId;
 if(!owner&&(shop.data.visibility!=='PUBLIC'||!item.data.published))throw Error('RESOURCE_CALENDAR_UNAVAILABLE');
 return{stockItemId:itemId,version:Number(item.data.version),enabled:item.data.resourceCalendarEnabled===true,capacity:Number(item.data.resourceCapacity??0),terms:String(item.data.resourceTerms??''),slots:resourceSlots(item).filter(s=>s.state==='CONFIRMED'&&Date.parse(s.endsAt)>Date.now()).map(s=>({id:owner||s.buyerId===c.actorId?s.id:undefined,startsAt:s.startsAt,endsAt:s.endsAt,quantity:s.quantity,own:s.buyerId===c.actorId,state:s.state})),owner,reservationOwner:'MARKETPLACE.CORE',paymentConfirmed:false};
}
