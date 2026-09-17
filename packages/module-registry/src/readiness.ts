import type { ProductModule, ModuleStatus, ProductLot } from './index.js';

export type ReadinessClass='OPERATIONAL'|'STRUCTURAL'|'PLANNED'|'OPTIONAL'|'EXTERNAL_GATED';
export interface ProductReadinessItem extends ProductModule { readiness:ReadinessClass; releaseBlocking:boolean; }
export interface ProductReadinessReport {
  masterBaseline:'2.3.4';
  generatedAt:string;
  total:number;
  counts:Record<ReadinessClass,number>;
  byLot:Record<ProductLot,{total:number;operational:number;blocking:number}>;
  blockingIds:string[];
  externalGatedIds:string[];
  masterComplete:boolean;
  verdict:'MASTER_COMPLETE'|'CLOSURE_IN_PROGRESS';
}

/**
 * These capabilities are constitutional requirements but cannot truthfully be
 * called production-ready without an external provider/regulatory/security
 * qualification. They remain visible without blocking independent work.
 */
export const MASTER_2_3_4_EXTERNAL_GATES = new Set<string>([
  'INTEGRATION.MOBILE_MONEY',
  'INTEGRATION.SMS',
  'INTEGRATION.WHATSAPP',
  'INTEGRATION.TELEGRAM',
  'INTEGRATION.EMAIL',
  'COMMUNITY.VIDEO',
  'SECURITY.MFA'
]);

const classify=(module:ProductModule):ReadinessClass=>{
  if(MASTER_2_3_4_EXTERNAL_GATES.has(module.id))return 'EXTERNAL_GATED';
  const map:Record<ModuleStatus,ReadinessClass>={
    FOUNDATION_ACTIVE:'OPERATIONAL',
    STRUCTURAL_V1:'STRUCTURAL',
    PLANNED_DOMAIN:'PLANNED',
    LATER_OPTIONAL:'OPTIONAL'
  };
  return map[module.status];
};

export const productReadinessItems=(modules:ProductModule[]):ProductReadinessItem[]=>modules.map(module=>{
  const readiness=classify(module);
  return {...module,readiness,releaseBlocking:readiness==='STRUCTURAL'||readiness==='PLANNED'};
});

export const buildProductReadinessReport=(modules:ProductModule[],now=new Date()):ProductReadinessReport=>{
  const items=productReadinessItems(modules);
  const counts:Record<ReadinessClass,number>={OPERATIONAL:0,STRUCTURAL:0,PLANNED:0,OPTIONAL:0,EXTERNAL_GATED:0};
  const byLot={} as ProductReadinessReport['byLot'];
  for(const lot of ['A','B','C','D','E','F','G','H','I','J'] as ProductLot[])byLot[lot]={total:0,operational:0,blocking:0};
  for(const item of items){
    counts[item.readiness]++;
    byLot[item.lot].total++;
    if(item.readiness==='OPERATIONAL')byLot[item.lot].operational++;
    if(item.releaseBlocking)byLot[item.lot].blocking++;
  }
  const blockingIds=items.filter(x=>x.releaseBlocking).map(x=>x.id);
  const externalGatedIds=items.filter(x=>x.readiness==='EXTERNAL_GATED').map(x=>x.id);
  return {
    masterBaseline:'2.3.4',generatedAt:now.toISOString(),total:items.length,counts,byLot,
    blockingIds,externalGatedIds,masterComplete:blockingIds.length===0,
    verdict:blockingIds.length===0?'MASTER_COMPLETE':'CLOSURE_IN_PROGRESS'
  };
};
