import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type NeedState='DRAFT'|'VALIDATED'|'PUBLISHED'|'MATCHED'|'PROCUREMENT_DRAFTED'|'CLOSED'|'CANCELLED';
export type OfferKind='SUPPLIER'|'NOW'|'HARVEST'|'FRESH_DROP'|'PICKUP'|'SERVICE';
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=1000)=>String(v??'').trim().slice(0,n);
const qty=(v:unknown)=>{const n=Number(v);if(!Number.isFinite(n)||n<=0)throw new Error('INVALID_QUANTITY');return n;};
const managers=new Set(['founder','manager','admin','president','treasurer']);

export class ValueNetworkService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private async groupAccess(groupId:Id,manage=false){
    const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');
    if(g.createdBy===c.actorId)return g;const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m||manage&&!m.roles.some(r=>managers.has(r)))throw new Error('FORBIDDEN_SCOPE');return g;
  }
  private async save(moduleId:string,title:string,groupId:Id|undefined,data:Record<string,string|number|boolean|null>,tags:string[],status:WorkspaceRecord['status']='ACTIVE'){
    const c=this.ctx(),at=now(),r:WorkspaceRecord={id:makeId('value'),tenantId:c.tenantId,groupId,moduleId,title,status,tags,data,createdBy:c.actorId,createdAt:at,updatedAt:at};await this.repo.saveWorkspaceRecord(r);return r;
  }
  private async get(id:Id,moduleId:string){const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!==moduleId)throw new Error(moduleId==='OPPORTUNITY.NEED'?'NEED_NOT_FOUND':'OFFER_NOT_FOUND');return r;}
  private async mutate(r:WorkspaceRecord,patch:Record<string,string|number|boolean|null>,status?:WorkspaceRecord['status']){const next={...r,status:status??r.status,data:{...r.data,...patch,version:Number(r.data.version??1)+1},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;}

  async createNeed(input:{groupId:Id;title:string;category:string;quantity:number;unit:string;locality?:string;neededBy?:string;maxUnitPrice?:number;maxTotalBudget?:number;currency?:string;qualityRequirement?:string;localOnly?:boolean;requireQualityEvidence?:boolean;sourceType?:'MANUAL'|'COMMUNITY_MESSAGE'|'FORECAST'|'RI';sourceRef?:Id;note?:string}){
    await this.groupAccess(input.groupId,true);if(input.neededBy&&(!Number.isFinite(Date.parse(input.neededBy))||Date.parse(input.neededBy)<=Date.now()))throw new Error('INVALID_NEEDED_BY');
    const maxUnitPrice=Number(input.maxUnitPrice??0),maxTotalBudget=Number(input.maxTotalBudget??0);if(maxUnitPrice<0||maxTotalBudget<0)throw new Error('INVALID_BUDGET');
    return this.save('OPPORTUNITY.NEED',clean(input.title,240)||'Besoin collectif',input.groupId,{state:'DRAFT',category:clean(input.category,160),quantity:qty(input.quantity),unit:clean(input.unit,80)||'unité',locality:clean(input.locality,180),neededBy:input.neededBy?new Date(input.neededBy).toISOString():'',maxUnitPrice:Number.isFinite(maxUnitPrice)?maxUnitPrice:0,maxTotalBudget:Number.isFinite(maxTotalBudget)?maxTotalBudget:0,currency:input.currency??'XAF',qualityRequirement:clean(input.qualityRequirement,160),localOnly:Boolean(input.localOnly),requireQualityEvidence:Boolean(input.requireQualityEvidence),sourceType:input.sourceType??'MANUAL',sourceRef:input.sourceRef??'',note:clean(input.note,1200),validatedAt:'',version:2},['opportunity','need','draft']);
  }
  async validateNeed(id:Id){
    const r=await this.get(id,'OPPORTUNITY.NEED');if(!r.groupId)throw new Error('GROUP_REQUIRED');await this.groupAccess(r.groupId,true);if(String(r.data.state)!=='DRAFT')throw new Error('NEED_NOT_DRAFT');
    return this.mutate(r,{state:'VALIDATED',validatedAt:now(),validatedBy:this.ctx().actorId});
  }
  async publishNeed(id:Id){
    const r=await this.get(id,'OPPORTUNITY.NEED');if(!r.groupId)throw new Error('GROUP_REQUIRED');await this.groupAccess(r.groupId,true);if(!['VALIDATED','MATCHED'].includes(String(r.data.state)))throw new Error('NEED_NOT_VALIDATED');
    return this.mutate(r,{state:'PUBLISHED',publishedAt:now()});
  }
  async createOffer(input:{kind:OfferKind;title:string;category:string;availableQuantity:number;unit:string;locality?:string;unitPrice?:number;deliveryCost?:number;currency?:string;expiresAt:string;availableFrom?:string;leadTimeDays?:number;qualityGrade?:string;qualityEvidenceRef?:string;supplierReliability?:number;supplierRef?:string;pickupRef?:string;evidenceRef?:string}){
    if(!Number.isFinite(Date.parse(input.expiresAt))||Date.parse(input.expiresAt)<=Date.now())throw new Error('INVALID_EXPIRES_AT');const price=Number(input.unitPrice??0),deliveryCost=Number(input.deliveryCost??0),leadTimeDays=Number(input.leadTimeDays??0),supplierReliability=Number(input.supplierReliability??0);if(!Number.isSafeInteger(price)||price<0)throw new Error('INVALID_UNIT_PRICE');if(!Number.isSafeInteger(deliveryCost)||deliveryCost<0)throw new Error('INVALID_DELIVERY_COST');if(!Number.isFinite(leadTimeDays)||leadTimeDays<0)throw new Error('INVALID_LEAD_TIME');if(supplierReliability<0||supplierReliability>100)throw new Error('INVALID_RELIABILITY');
    return this.save('OPPORTUNITY.OFFER',clean(input.title,240)||'Offre',undefined,{kind:input.kind,category:clean(input.category,160),availableQuantity:qty(input.availableQuantity),unit:clean(input.unit,80)||'unité',locality:clean(input.locality,180),unitPrice:price,deliveryCost,currency:input.currency??'XAF',expiresAt:new Date(input.expiresAt).toISOString(),availableFrom:input.availableFrom&&Number.isFinite(Date.parse(input.availableFrom))?new Date(input.availableFrom).toISOString():'',leadTimeDays,qualityGrade:clean(input.qualityGrade,160),qualityEvidenceRef:clean(input.qualityEvidenceRef,500),supplierReliability,supplierRef:clean(input.supplierRef,240),pickupRef:clean(input.pickupRef,240),evidenceRef:clean(input.evidenceRef,500),state:'ACTIVE',version:2},['opportunity','offer',input.kind.toLowerCase()]);
  }
  async matchNeed(needId:Id){
    const need=await this.get(needId,'OPPORTUNITY.NEED');if(!need.groupId)throw new Error('GROUP_REQUIRED');await this.groupAccess(need.groupId,false);
    if(!['VALIDATED','PUBLISHED','MATCHED'].includes(String(need.data.state)))throw new Error('NEED_NOT_MATCHABLE');
    const c=this.ctx(),offers=(await this.repo.listWorkspaceRecords(c.tenantId,'OPPORTUNITY.OFFER')).filter(x=>x.status==='ACTIVE'&&x.data.state==='ACTIVE'),required=Number(need.data.quantity),locality=clean(need.data.locality).toLowerCase(),category=clean(need.data.category).toLowerCase(),unit=clean(need.data.unit).toLowerCase(),neededBy=Date.parse(String(need.data.neededBy??''))||Infinity,maxUnitPrice=Number(need.data.maxUnitPrice??0),maxTotalBudget=Number(need.data.maxTotalBudget??0),quality=clean(need.data.qualityRequirement).toLowerCase(),localOnly=Boolean(need.data.localOnly),qualityEvidenceRequired=Boolean(need.data.requireQualityEvidence);
    const matches=offers.map(o=>{
      const reasons:string[]=[],unknowns:string[]=[],advantages:string[]=[];let eligible=true,score=0;
      const oCat=clean(o.data.category).toLowerCase(),oLoc=clean(o.data.locality).toLowerCase(),oUnit=clean(o.data.unit).toLowerCase(),expires=Date.parse(String(o.data.expiresAt??'')),availableFrom=Date.parse(String(o.data.availableFrom??'')),leadDays=Math.max(0,Number(o.data.leadTimeDays??0)),price=Number(o.data.unitPrice??0),delivery=Number(o.data.deliveryCost??0),reliability=Number(o.data.supplierReliability??0),oQuality=clean(o.data.qualityGrade).toLowerCase(),qualityEvidence=clean(o.data.qualityEvidenceRef);
      if(oCat!==category){eligible=false;reasons.push('CATEGORY_MISMATCH');}else{score+=25;advantages.push('CATEGORY_EXACT');}
      if(oUnit!==unit){eligible=false;reasons.push('UNIT_MISMATCH');}else{score+=15;advantages.push('UNIT_EXACT');}
      if(Number(o.data.availableQuantity)<required){eligible=false;reasons.push('QUANTITY_INSUFFICIENT');}else{score+=20;advantages.push('QUANTITY_COVERED');}
      if(locality&&oLoc){
        if(oLoc===locality){score+=12;advantages.push('LOCALITY_EXACT');}
        else if(localOnly){eligible=false;reasons.push('LOCALITY_REQUIRED');}
        else unknowns.push('DELIVERY_DISTANCE_NOT_COMPUTED');
      }else if(locality)unknowns.push('OFFER_LOCALITY_UNKNOWN');
      if(!Number.isFinite(expires)||expires<=Date.now()){eligible=false;reasons.push('OFFER_EXPIRED');}
      const earliest=Number.isFinite(availableFrom)?availableFrom:Date.now(),deliveryAt=earliest+leadDays*86400000;
      if(neededBy<Infinity&&deliveryAt>neededBy){eligible=false;reasons.push('DELIVERY_TOO_LATE');}else if(neededBy<Infinity){score+=8;advantages.push('DELIVERY_WINDOW_OK');}
      if(price>0){
        const landedTotal=price*required+delivery;
        if(maxUnitPrice>0&&price>maxUnitPrice){eligible=false;reasons.push('UNIT_PRICE_ABOVE_LIMIT');}
        if(maxTotalBudget>0&&landedTotal>maxTotalBudget){eligible=false;reasons.push('LANDED_COST_ABOVE_BUDGET');}
        if((!maxUnitPrice||price<=maxUnitPrice)&&(!maxTotalBudget||landedTotal<=maxTotalBudget)){score+=10;advantages.push('BUDGET_OK');}
      }else unknowns.push('UNIT_PRICE_UNKNOWN');
      if(delivery===0)unknowns.push('DELIVERY_COST_UNKNOWN_OR_ZERO');
      if(quality){
        if(!oQuality){unknowns.push('QUALITY_UNKNOWN');if(qualityEvidenceRequired){eligible=false;reasons.push('QUALITY_EVIDENCE_REQUIRED');}}
        else if(oQuality!==quality){eligible=false;reasons.push('QUALITY_MISMATCH');}
        else{score+=5;advantages.push('QUALITY_EXACT');}
      }
      if(qualityEvidenceRequired&&!qualityEvidence){eligible=false;reasons.push('QUALITY_EVIDENCE_REQUIRED');}
      if(reliability>0){score+=Math.min(5,reliability/20);advantages.push('RELIABILITY_DOCUMENTED');}else unknowns.push('RELIABILITY_UNKNOWN');
      const landedTotal=price>0?price*required+delivery:null,unitLanded=landedTotal===null?null:landedTotal/required;
      return{offer:o,eligible,score,reasons,unknowns,advantages,explanation:{requiredQuantity:required,unit,unitPrice:price>0?price:null,deliveryCost:delivery>0?delivery:null,landedTotal,unitLanded,availableFrom:Number.isFinite(availableFrom)?new Date(availableFrom).toISOString():null,leadTimeDays:leadDays||null,estimatedDeliveryAt:new Date(deliveryAt).toISOString(),quality:o.data.qualityGrade||null,reliability:reliability||null}};
    }).filter(x=>x.eligible).sort((a,b)=>b.score-a.score||Number(a.explanation.landedTotal??Number.MAX_SAFE_INTEGER)-Number(b.explanation.landedTotal??Number.MAX_SAFE_INTEGER));
    if(matches.length&&String(need.data.state)!=='MATCHED')await this.mutate(need,{state:'MATCHED',lastMatchedAt:now(),matchCount:matches.length});
    return matches;
  }
  async prepareProcurement(needId:Id,offerId:Id){
    const need=await this.get(needId,'OPPORTUNITY.NEED'),offer=await this.get(offerId,'OPPORTUNITY.OFFER');if(!need.groupId)throw new Error('GROUP_REQUIRED');await this.groupAccess(need.groupId,true);
    const matches=await this.matchNeed(needId);if(!matches.some(x=>x.offer.id===offerId))throw new Error('OFFER_NOT_ELIGIBLE');
    const draft=await this.save('MARKETPLACE.PROCUREMENT','Approvisionnement · '+need.title,need.groupId,{state:'DRAFT',needId:need.id,offerId:offer.id,quantity:Number(need.data.quantity),unit:String(need.data.unit),unitPrice:Number(offer.data.unitPrice??0),currency:String(offer.data.currency??'XAF'),supplierRef:String(offer.data.supplierRef??''),createsOrder:false,createsDebt:false,requiresExplicitApproval:true,version:1},['procurement','handoff','draft']);
    await this.mutate(need,{state:'PROCUREMENT_DRAFTED',procurementDraftId:draft.id});return draft;
  }
  async listNeeds(groupId:Id){await this.groupAccess(groupId,false);const c=this.ctx();return this.repo.listWorkspaceRecords(c.tenantId,'OPPORTUNITY.NEED',groupId);}
  async listOffers(){const c=this.ctx();return this.repo.listWorkspaceRecords(c.tenantId,'OPPORTUNITY.OFFER');}
}
