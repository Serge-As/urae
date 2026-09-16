export type RevenueRail='ADS'|'SPONSORING'|'SUPPLIER_ACCESS'|'DEAL_RESERVATION'|'GROUP_BUY'|'VERIFIED_LEAD'|'PARTNER_SAAS'|'NGO_PROGRAM'|'INSIGHTS'|'PRO_SERVICES'|'EVENTS'|'DOCUMENT_SERVICES';
export interface EconomicLine {code:string;amount:number;}
export interface UnitEconomicsInput {revenues:EconomicLine[];costs:EconomicLine[];}
export interface UnitEconomicsResult {revenue:number;cost:number;margin:number;marginRate:number;revenues:EconomicLine[];costs:EconomicLine[];}

export interface GroupDemandSignal {
  groupCode:string;
  itemKey:string;
  quantity:number;
  targetUnitPrice?:number;
  locality?:string;
  neededBy?:string;
  source:'TONTINE_IN_KIND'|'GROUP_BUY'|'PROJECT'|'EVENT'|'MARKET_REQUEST'|'OTHER';
}
export interface DemandAggregate {
  itemKey:string;
  groups:number;
  totalQuantity:number;
  localities:string[];
  earliestNeed?:string;
  weightedTargetUnitPrice?:number;
  privacy:'PSEUDONYMOUS_GROUP_AGGREGATE';
}
export interface SupplierBid {
  supplierId:string;
  unitPrice:number;
  transportTotal:number;
  capacity:number;
  reliabilityScore:number;
  leadTimeDays:number;
}
export interface RankedSupplierBid extends SupplierBid {
  eligible:boolean;
  landedTotal:number;
  landedUnitCost:number;
  score:number;
  reasons:string[];
}

const money=(name:string,n:number)=>{if(!Number.isSafeInteger(n)||n<0)throw new Error('INVALID_'+name.toUpperCase());return n;};
const positive=(name:string,n:number)=>{if(!Number.isFinite(n)||n<=0)throw new Error('INVALID_'+name.toUpperCase());return n;};

export function calculateUnitEconomics(input:UnitEconomicsInput):UnitEconomicsResult{
  for(const l of [...input.revenues,...input.costs])money('economic_line_amount',l.amount);
  const revenue=input.revenues.reduce((n,x)=>n+x.amount,0),cost=input.costs.reduce((n,x)=>n+x.amount,0),margin=revenue-cost;
  return{revenue,cost,margin,marginRate:revenue?margin/revenue:0,revenues:input.revenues,costs:input.costs};
}

export function aggregateDemand(signals:GroupDemandSignal[]):DemandAggregate[]{
  const buckets=new Map<string,GroupDemandSignal[]>();
  for(const s of signals){
    if(!/^ECO-GRP-[A-Z0-9-]+$/.test(s.groupCode))throw new Error('PUBLIC_GROUP_CODE_REQUIRED');
    positive('demand_quantity',s.quantity);
    if(s.targetUnitPrice!==undefined)money('target_unit_price',s.targetUnitPrice);
    buckets.set(s.itemKey,[...(buckets.get(s.itemKey)??[]),s]);
  }
  return[...buckets.entries()].map(([itemKey,rows])=>{
    const uniqueGroups=new Set(rows.map(x=>x.groupCode)),totalQuantity=rows.reduce((n,x)=>n+x.quantity,0);
    const priced=rows.filter(x=>x.targetUnitPrice!==undefined);
    const weightedTargetUnitPrice=priced.length?Math.round(priced.reduce((n,x)=>n+x.targetUnitPrice!*x.quantity,0)/priced.reduce((n,x)=>n+x.quantity,0)):undefined;
    const dates=rows.map(x=>x.neededBy).filter(Boolean).sort() as string[];
    return{itemKey,groups:uniqueGroups.size,totalQuantity,localities:[...new Set(rows.map(x=>x.locality).filter(Boolean) as string[])].sort(),earliestNeed:dates[0],weightedTargetUnitPrice,privacy:'PSEUDONYMOUS_GROUP_AGGREGATE' as const};
  }).sort((a,b)=>b.totalQuantity-a.totalQuantity||a.itemKey.localeCompare(b.itemKey));
}

export function rankSupplierBids(demand:DemandAggregate,bids:SupplierBid[]):RankedSupplierBid[]{
  return bids.map(b=>{
    money('supplier_unit_price',b.unitPrice);money('supplier_transport',b.transportTotal);positive('supplier_capacity',b.capacity);
    if(!Number.isFinite(b.reliabilityScore)||b.reliabilityScore<0||b.reliabilityScore>100)throw new Error('INVALID_RELIABILITY_SCORE');
    if(!Number.isFinite(b.leadTimeDays)||b.leadTimeDays<0)throw new Error('INVALID_LEAD_TIME');
    const eligible=b.capacity>=demand.totalQuantity,landedTotal=b.unitPrice*demand.totalQuantity+b.transportTotal,landedUnitCost=landedTotal/demand.totalQuantity;
    const reliabilityPenalty=(100-b.reliabilityScore)*landedUnitCost*0.002;
    const leadPenalty=b.leadTimeDays*landedUnitCost*0.001;
    const score=landedUnitCost+reliabilityPenalty+leadPenalty+(eligible?0:1e12);
    const reasons=[eligible?'CAPACITY_OK':'INSUFFICIENT_CAPACITY','LANDED_UNIT_COST:'+landedUnitCost.toFixed(2),'RELIABILITY:'+b.reliabilityScore,'LEAD_DAYS:'+b.leadTimeDays];
    return{...b,eligible,landedTotal,landedUnitCost,score,reasons};
  }).sort((a,b)=>a.score-b.score||b.reliabilityScore-a.reliabilityScore||a.supplierId.localeCompare(b.supplierId));
}
