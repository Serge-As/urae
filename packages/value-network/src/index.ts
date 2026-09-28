import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type NeedState='DRAFT'|'VALIDATED'|'PUBLISHED'|'MATCHED'|'PROCUREMENT_DRAFTED'|'CLOSED'|'CANCELLED';
export type OfferKind='SUPPLIER'|'NOW'|'HARVEST'|'FRESH_DROP'|'PICKUP'|'SERVICE';
const MATCH_POLICY_VERSION='VALUE_MATCH_1.5.2';
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=1000)=>String(v??'').trim().slice(0,n);
const norm=(v:unknown)=>clean(v,500).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const qty=(v:unknown)=>{const n=Number(v);if(!Number.isFinite(n)||n<=0)throw new Error('INVALID_QUANTITY');return n;};
const money=(v:unknown,name:string,allowUnknown=false)=>{
  if((v===undefined||v===null||v==='')&&allowUnknown)return null;
  const n=Number(v);if(!Number.isSafeInteger(n)||n<0)throw new Error('INVALID_'+name);return n;
};
const managers=new Set(['founder','manager','admin','president','treasurer']);
const tokens=(v:unknown)=>[...new Set(norm(v).split(/[^a-z0-9]+/).filter(x=>x.length>1))];

type UnitInfo={family:string;factor:number;label:string};
const unitInfo=(raw:unknown):UnitInfo=>{
  const u=norm(raw).replace(/\./g,'');
  if(['u','unite','unites','piece','pieces','unité','pièce'].includes(u))return{family:'PIECE',factor:1,label:'unité'};
  if(['g','gramme','grammes'].includes(u))return{family:'MASS',factor:1,label:'g'};
  if(['kg','kilo','kilos','kilogramme','kilogrammes'].includes(u))return{family:'MASS',factor:1000,label:'kg'};
  if(['t','tonne','tonnes'].includes(u))return{family:'MASS',factor:1_000_000,label:'tonne'};
  if(['ml','millilitre','millilitres'].includes(u))return{family:'VOLUME',factor:1,label:'ml'};
  if(['l','litre','litres'].includes(u))return{family:'VOLUME',factor:1000,label:'litre'};
  if(['min','minute','minutes'].includes(u))return{family:'TIME',factor:1,label:'minute'};
  if(['h','heure','heures'].includes(u))return{family:'TIME',factor:60,label:'heure'};
  if(['carton','cartons','sac','sacs','paquet','paquets','caisse','caisses','lot','lots'].includes(u))return{family:'PACKAGE:'+u.replace(/s$/,''),factor:1,label:u.replace(/s$/,'')};
  return{family:'EXACT:'+u,factor:1,label:u||'unité'};
};
const compatible=(a:UnitInfo,b:UnitInfo)=>a.family===b.family;
const parseZones=(value:unknown)=>{try{const x=JSON.parse(String(value??'[]'));return Array.isArray(x)?x.map(norm).filter(Boolean):[];}catch{return[];}};
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));

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

  async createNeed(input:{groupId:Id;title:string;category:string;quantity:number;unit:string;locality?:string;neededBy?:string;sourceType?:'MANUAL'|'COMMUNITY_MESSAGE'|'FORECAST'|'RI';sourceRef?:Id;note?:string;specification?:string;quality?:string;currency?:string;budgetMax?:number;substitutionsAllowed?:boolean;publicationConsent?:boolean}){
    await this.groupAccess(input.groupId,true);if(input.neededBy&&(!Number.isFinite(Date.parse(input.neededBy))||Date.parse(input.neededBy)<=Date.now()))throw new Error('INVALID_NEEDED_BY');
    const budget=money(input.budgetMax,'BUDGET_MAX',true),currency=clean(input.currency||'XAF',12).toUpperCase();
    return this.save('OPPORTUNITY.NEED',clean(input.title,240)||'Besoin collectif',input.groupId,{
      state:'DRAFT',category:clean(input.category,160),categoryKey:norm(input.category),quantity:qty(input.quantity),unit:clean(input.unit,80)||'unité',
      locality:clean(input.locality,180),neededBy:input.neededBy?new Date(input.neededBy).toISOString():'',sourceType:input.sourceType??'MANUAL',sourceRef:input.sourceRef??'',note:clean(input.note,1200),
      specification:clean(input.specification,600),quality:clean(input.quality,160),currency,budgetMax:budget,substitutionsAllowed:Boolean(input.substitutionsAllowed),
      publicationConsent:input.publicationConsent===true,validatedAt:'',matchPolicyVersion:MATCH_POLICY_VERSION,version:1
    },['opportunity','need','draft']);
  }
  async validateNeed(id:Id){
    const r=await this.get(id,'OPPORTUNITY.NEED');if(!r.groupId)throw new Error('GROUP_REQUIRED');await this.groupAccess(r.groupId,true);if(String(r.data.state)!=='DRAFT')throw new Error('NEED_NOT_DRAFT');
    return this.mutate(r,{state:'VALIDATED',validatedAt:now(),validatedBy:this.ctx().actorId});
  }
  async publishNeed(id:Id){
    const r=await this.get(id,'OPPORTUNITY.NEED');if(!r.groupId)throw new Error('GROUP_REQUIRED');await this.groupAccess(r.groupId,true);if(!['VALIDATED','MATCHED'].includes(String(r.data.state)))throw new Error('NEED_NOT_VALIDATED');
    if(r.data.publicationConsent!==true)throw new Error('NEED_PUBLICATION_CONSENT_REQUIRED');
    return this.mutate(r,{state:'PUBLISHED',publishedAt:now()});
  }
  async createOffer(input:{kind:OfferKind;title:string;category:string;availableQuantity:number;unit:string;locality?:string;unitPrice?:number;currency?:string;expiresAt:string;supplierRef?:string;pickupRef?:string;evidenceRef?:string;specification?:string;quality?:string;serviceZones?:string[];availableBy?:string;transportCost?:number;otherCosts?:number;discount?:number;documentedDeliveries?:number;confirmedDisputes?:number;sponsored?:boolean}){
    if(!Number.isFinite(Date.parse(input.expiresAt))||Date.parse(input.expiresAt)<=Date.now())throw new Error('INVALID_EXPIRES_AT');
    if(input.availableBy&&!Number.isFinite(Date.parse(input.availableBy)))throw new Error('INVALID_AVAILABLE_BY');
    const unitPrice=money(input.unitPrice,'UNIT_PRICE',true),transport=money(input.transportCost,'TRANSPORT_COST',true),other=money(input.otherCosts,'OTHER_COSTS',true),discount=money(input.discount,'DISCOUNT',true);
    const deliveries=money(input.documentedDeliveries,'DOCUMENTED_DELIVERIES',true)??0,disputes=money(input.confirmedDisputes,'CONFIRMED_DISPUTES',true)??0;
    if(disputes>deliveries&&deliveries>0)throw new Error('INVALID_RELIABILITY_EVIDENCE');
    return this.save('OPPORTUNITY.OFFER',clean(input.title,240)||'Offre',undefined,{
      kind:input.kind,category:clean(input.category,160),categoryKey:norm(input.category),availableQuantity:qty(input.availableQuantity),unit:clean(input.unit,80)||'unité',
      locality:clean(input.locality,180),unitPrice,currency:clean(input.currency||'XAF',12).toUpperCase(),expiresAt:new Date(input.expiresAt).toISOString(),
      supplierRef:clean(input.supplierRef,240),pickupRef:clean(input.pickupRef,240),evidenceRef:clean(input.evidenceRef,500),
      specification:clean(input.specification,600),quality:clean(input.quality,160),serviceZonesJson:JSON.stringify((input.serviceZones??[]).map(x=>clean(x,180)).filter(Boolean)),
      availableBy:input.availableBy?new Date(input.availableBy).toISOString():'',transportCost:transport,otherCosts:other,discount,
      documentedDeliveries:deliveries,confirmedDisputes:disputes,sponsored:Boolean(input.sponsored),state:'ACTIVE',matchPolicyVersion:MATCH_POLICY_VERSION,version:1
    },['opportunity','offer',input.kind.toLowerCase()]);
  }

  async matchNeed(needId:Id){
    const need=await this.get(needId,'OPPORTUNITY.NEED');if(!need.groupId)throw new Error('GROUP_REQUIRED');await this.groupAccess(need.groupId,false);
    if(!['VALIDATED','PUBLISHED','MATCHED'].includes(String(need.data.state)))throw new Error('NEED_NOT_MATCHABLE');
    const c=this.ctx(),offers=(await this.repo.listWorkspaceRecords(c.tenantId,'OPPORTUNITY.OFFER')).filter(x=>x.status==='ACTIVE'&&x.data.state==='ACTIVE');
    const required=Number(need.data.quantity),needUnit=unitInfo(need.data.unit),requiredCanonical=required*needUnit.factor,locality=norm(need.data.locality),category=norm(need.data.categoryKey||need.data.category);
    const needSpec=tokens(need.data.specification),needQuality=norm(need.data.quality),neededBy=Date.parse(String(need.data.neededBy??'')),currency=clean(need.data.currency||'XAF',12).toUpperCase();
    const budgetMax=need.data.budgetMax===null||need.data.budgetMax===undefined?null:Number(need.data.budgetMax),substitutions=need.data.substitutionsAllowed===true;

    const evaluated=offers.map(o=>{
      const hardReasons:string[]=[],explanations:string[]=[],warnings:string[]=[];
      let eligible=true,baseScore=0;
      const oCat=norm(o.data.categoryKey||o.data.category),oLoc=norm(o.data.locality),zones=parseZones(o.data.serviceZonesJson),expires=Date.parse(String(o.data.expiresAt??'')),availableBy=Date.parse(String(o.data.availableBy??''));
      const offerUnit=unitInfo(o.data.unit),offerCanonical=Number(o.data.availableQuantity)*offerUnit.factor;
      if(oCat!==category){eligible=false;hardReasons.push('CATEGORY_MISMATCH');}else{baseScore+=20;explanations.push('Catégorie compatible');}
      if(!compatible(needUnit,offerUnit)){eligible=false;hardReasons.push('UNIT_NOT_COMPARABLE');}
      else if(offerCanonical+1e-9<requiredCanonical){eligible=false;hardReasons.push('QUANTITY_INSUFFICIENT');}
      else{baseScore+=15;explanations.push('Quantité couverte à 100 %');}
      if(locality){
        if(oLoc===locality||zones.includes(locality)){baseScore+=12;explanations.push('Zone desservie');}
        else{eligible=false;hardReasons.push('ZONE_NOT_SERVED');}
      }
      if(!Number.isFinite(expires)||expires<=Date.now()){eligible=false;hardReasons.push('OFFER_EXPIRED');}
      const offeredSpec=tokens(o.data.specification),missingSpec=needSpec.filter(t=>!offeredSpec.includes(t));
      if(missingSpec.length){
        if(!substitutions){eligible=false;hardReasons.push('SPECIFICATION_MISMATCH');}
        else warnings.push('Substitution de spécification à confirmer');
      }else if(needSpec.length){baseScore+=10;explanations.push('Spécification demandée satisfaite');}
      const offeredQuality=norm(o.data.quality);
      if(needQuality&&offeredQuality!==needQuality){
        if(!substitutions){eligible=false;hardReasons.push('QUALITY_MISMATCH');}
        else warnings.push('Qualité différente à confirmer');
      }else if(needQuality){baseScore+=8;explanations.push('Qualité demandée satisfaite');}
      if(Number.isFinite(neededBy)){
        if(!Number.isFinite(availableBy)){eligible=false;hardReasons.push('DELIVERY_DATE_UNKNOWN');}
        else if(availableBy>neededBy){eligible=false;hardReasons.push('DELIVERY_TOO_LATE');}
        else{baseScore+=12;explanations.push('Disponible avant la date demandée');}
      }

      const priceKnown=o.data.unitPrice!==null&&o.data.unitPrice!==undefined,offerCurrency=clean(o.data.currency||'XAF',12).toUpperCase();
      let merchandiseCost:number|null=null,landedTotal:number|null=null,landedUnitCost:number|null=null;
      if(priceKnown&&compatible(needUnit,offerUnit)&&offerCurrency===currency){
        const unitPrice=Number(o.data.unitPrice),canonicalPrice=unitPrice/offerUnit.factor;
        merchandiseCost=Math.round(requiredCanonical*canonicalPrice);
        const transport=o.data.transportCost===null||o.data.transportCost===undefined?null:Number(o.data.transportCost),other=o.data.otherCosts===null||o.data.otherCosts===undefined?null:Number(o.data.otherCosts),discount=o.data.discount===null||o.data.discount===undefined?0:Number(o.data.discount);
        if(transport===null||other===null)warnings.push('Coût rendu incomplet : transport ou autres frais inconnus');
        else{landedTotal=Math.max(0,merchandiseCost+transport+other-discount);landedUnitCost=required>0?landedTotal/required:null;explanations.push('Coût rendu documenté : '+landedTotal+' '+currency);}
      }else if(priceKnown&&offerCurrency!==currency){eligible=false;hardReasons.push('CURRENCY_NOT_COMPARABLE');}
      else warnings.push('Prix sur devis / inconnu');
      if(budgetMax!==null){
        if(landedTotal===null){eligible=false;hardReasons.push('LANDED_COST_UNKNOWN_FOR_BUDGET');}
        else if(landedTotal>budgetMax){eligible=false;hardReasons.push('BUDGET_EXCEEDED');}
        else{baseScore+=8;explanations.push('Budget maximum respecté');}
      }

      const deliveries=Number(o.data.documentedDeliveries??0),disputes=Number(o.data.confirmedDisputes??0);
      const reliability=deliveries>0?clamp((deliveries-Math.min(deliveries,disputes))/deliveries,0,1):null;
      if(reliability!==null){baseScore+=Math.round(10*reliability);explanations.push(deliveries+' livraison(s) documentée(s)');}
      else warnings.push('Fiabilité non encore documentée');
      const ageDays=Math.max(0,(Date.now()-Date.parse(o.updatedAt))/(24*60*60*1000));
      const freshness=clamp(1-ageDays/30,0,1);baseScore+=Math.round(5*freshness);
      if(ageDays<=7)explanations.push('Offre actualisée récemment');
      if(o.data.sponsored===true)warnings.push('Offre sponsorisée : le sponsoring ne modifie pas le score de confiance');

      return{offer:o,eligible,hardReasons,warnings,explanations,baseScore,landedTotal,landedUnitCost,reliability,freshness,priceKnown,sponsored:o.data.sponsored===true,policyVersion:MATCH_POLICY_VERSION};
    });

    const eligible=evaluated.filter(x=>x.eligible),knownCosts=eligible.map(x=>x.landedTotal).filter((x):x is number=>x!==null),minCost=knownCosts.length?Math.min(...knownCosts):null;
    const matches=eligible.map(x=>{
      let priceScore=0;if(x.landedTotal!==null&&minCost!==null){priceScore=minCost===0?(x.landedTotal===0?10:0):clamp(10*(minCost/x.landedTotal),0,10);}
      const score=clamp(Math.round((x.baseScore+priceScore)*10)/10,0,100);
      return{...x,score,scoreBreakdown:{base:x.baseScore,price:Math.round(priceScore*10)/10},rankingIndependentOfSponsorship:true};
    }).sort((a,b)=>b.score-a.score||(a.landedTotal??Infinity)-(b.landedTotal??Infinity)||b.freshness-a.freshness);

    if(matches.length&&String(need.data.state)!=='MATCHED')await this.mutate(need,{state:'MATCHED',lastMatchedAt:now(),matchCount:matches.length,matchPolicyVersion:MATCH_POLICY_VERSION});
    return matches;
  }

  async prepareProcurement(needId:Id,offerId:Id){
    const need=await this.get(needId,'OPPORTUNITY.NEED'),offer=await this.get(offerId,'OPPORTUNITY.OFFER');if(!need.groupId)throw new Error('GROUP_REQUIRED');await this.groupAccess(need.groupId,true);
    const matches=await this.matchNeed(needId),match=matches.find(x=>x.offer.id===offerId);if(!match)throw new Error('OFFER_NOT_ELIGIBLE');
    const draft=await this.save('MARKETPLACE.PROCUREMENT','Approvisionnement · '+need.title,need.groupId,{
      state:'DRAFT',needId:need.id,offerId:offer.id,needTitle:need.title,category:String(need.data.category??''),quantity:Number(need.data.quantity),unit:String(need.data.unit),unitPrice:offer.data.unitPrice===null?0:Number(offer.data.unitPrice??0),
      currency:String(offer.data.currency??'XAF'),supplierRef:String(offer.data.supplierRef??''),merchandiseCost:match.merchandiseCost,transportCost:Number(offer.data.transportCost??0),otherCosts:Number(offer.data.otherCosts??0),discount:Number(offer.data.discount??0),landedCost:match.landedTotal,matchScore:match.score,matchPolicyVersion:MATCH_POLICY_VERSION,
      createsOrder:false,createsDebt:false,requiresExplicitApproval:true,version:1
    },['procurement','handoff','draft']);
    await this.mutate(need,{state:'PROCUREMENT_DRAFTED',procurementDraftId:draft.id});return draft;
  }
  async listNeeds(groupId:Id){await this.groupAccess(groupId,false);const c=this.ctx();return this.repo.listWorkspaceRecords(c.tenantId,'OPPORTUNITY.NEED',groupId);}
  async listOffers(){const c=this.ctx();return this.repo.listWorkspaceRecords(c.tenantId,'OPPORTUNITY.OFFER');}
}
