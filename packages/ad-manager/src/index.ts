import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type AdCampaignState='DRAFT'|'PENDING_REVIEW'|'APPROVED'|'ACTIVE'|'PAUSED'|'COMPLETED'|'REJECTED';
export type AdObjective='AWARENESS'|'COMMUNITY_JOIN'|'EVENT_RSVP'|'DEAL_OPEN'|'GROUP_BUY'|'LEAD'|'PARTNER_PROGRAM';
export interface AdTargeting {
  localities?:string[];
  interestTags?:string[];
  groupKinds?:string[];
  rubricKinds?:string[];
  /** Pseudonymous GROUP-level monetary-mass bands only. Never individual balances/debts. */
  aggregateRubricVolumeBands?:string[];
}
export interface AdCreative {
  headline:string;
  body:string;
  callToAction:string;
  destinationRef:string;
}
export interface AdCampaign {
  id:string;groupId:string;name:string;objective:AdObjective;state:AdCampaignState;
  budgetSandbox:number;currency:string;startsAt?:string;endsAt?:string;
  placements:string[];frequencyCapPer7Days:number;targeting:AdTargeting;creative:AdCreative;
  impressions:number;opens:number;actions:number;negativeFeedback:number;
  createdAt:string;updatedAt:string;createdBy:string;moderationNote?:string;
}
const MODULE='ADS.MANAGER';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const sensitive=/(member|membership|user|account|phone|email|name|cni|identity|debt|arrear|balance|saving|loan|health|medical|assistance|dispute|religion|politic|sexual|criminal)/i;
const clean=(v:string,max=300)=>v.trim().replace(/\s+/g,' ').slice(0,max);
const now=()=>new Date().toISOString();

const encode=(c:AdCampaign):WorkspaceRecord['data']=>({
  objective:c.objective,state:c.state,budgetSandbox:c.budgetSandbox,currency:c.currency,
  startsAt:c.startsAt??null,endsAt:c.endsAt??null,placementsJson:JSON.stringify(c.placements),
  frequencyCapPer7Days:c.frequencyCapPer7Days,targetingJson:JSON.stringify(c.targeting),creativeJson:JSON.stringify(c.creative),
  impressions:c.impressions,opens:c.opens,actions:c.actions,negativeFeedback:c.negativeFeedback,
  moderationNote:c.moderationNote??null
});
const decode=(r:WorkspaceRecord):AdCampaign=>({
  id:r.id,groupId:String(r.groupId??''),name:r.title,objective:String(r.data.objective) as AdObjective,state:String(r.data.state) as AdCampaignState,
  budgetSandbox:Number(r.data.budgetSandbox??0),currency:String(r.data.currency??'XAF'),
  startsAt:r.data.startsAt?String(r.data.startsAt):undefined,endsAt:r.data.endsAt?String(r.data.endsAt):undefined,
  placements:JSON.parse(String(r.data.placementsJson??'[]')),frequencyCapPer7Days:Number(r.data.frequencyCapPer7Days??3),
  targeting:JSON.parse(String(r.data.targetingJson??'{}')),creative:JSON.parse(String(r.data.creativeJson??'{}')),
  impressions:Number(r.data.impressions??0),opens:Number(r.data.opens??0),actions:Number(r.data.actions??0),negativeFeedback:Number(r.data.negativeFeedback??0),
  createdAt:r.createdAt,updatedAt:r.updatedAt,createdBy:r.createdBy,moderationNote:r.data.moderationNote?String(r.data.moderationNote):undefined
});

export class AdManagerService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private async requireManager(groupId:string){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw new Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return group;
    const m=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
    if(!m?.roles.some(r=>managers.has(r)))throw new Error('FORBIDDEN_SCOPE');return group;
  }
  private validateTargeting(t:AdTargeting){
    const raw=JSON.stringify(t);
    if(sensitive.test(raw))throw new Error('SENSITIVE_AD_TARGETING_FORBIDDEN');
    const all=[...(t.localities??[]),...(t.interestTags??[]),...(t.groupKinds??[]),...(t.rubricKinds??[]),...(t.aggregateRubricVolumeBands??[])];
    if(all.some(x=>typeof x!=='string'||x.length>120))throw new Error('INVALID_AD_TARGETING');
    return structuredClone(t);
  }
  private validateCreative(c:AdCreative){
    const out={headline:clean(c.headline,120),body:clean(c.body,1000),callToAction:clean(c.callToAction,60),destinationRef:clean(c.destinationRef,240)};
    if(!out.headline||!out.body||!out.callToAction||!out.destinationRef)throw new Error('INVALID_AD_CREATIVE');return out;
  }
  async list(groupId:string){await this.requireManager(groupId);const ctx=this.kernel.context.get();return(await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId)).map(decode).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  async get(groupId:string,id:string){await this.requireManager(groupId);const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!==MODULE)throw new Error('AD_CAMPAIGN_NOT_FOUND');return{record:r,campaign:decode(r)};}
  async create(groupId:string,input:{name:string;objective:AdObjective;budgetSandbox:number;currency?:string;startsAt?:string;endsAt?:string;placements?:string[];frequencyCapPer7Days?:number;targeting:AdTargeting;creative:AdCreative}){
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),stamp=now(),name=clean(input.name,160);
    if(!name||!['AWARENESS','COMMUNITY_JOIN','EVENT_RSVP','DEAL_OPEN','GROUP_BUY','LEAD','PARTNER_PROGRAM'].includes(input.objective))throw new Error('INVALID_AD_CAMPAIGN');
    if(!Number.isSafeInteger(input.budgetSandbox)||input.budgetSandbox<0)throw new Error('INVALID_AD_BUDGET');
    const cap=Math.trunc(input.frequencyCapPer7Days??3);if(cap<1||cap>50)throw new Error('INVALID_FREQUENCY_CAP');
    const campaign:AdCampaign={id:makeId('ad_campaign'),groupId,name,objective:input.objective,state:'DRAFT',budgetSandbox:input.budgetSandbox,currency:input.currency??'XAF',startsAt:input.startsAt,endsAt:input.endsAt,placements:[...new Set(input.placements??['FEED'])].slice(0,12),frequencyCapPer7Days:cap,targeting:this.validateTargeting(input.targeting),creative:this.validateCreative(input.creative),impressions:0,opens:0,actions:0,negativeFeedback:0,createdAt:stamp,updatedAt:stamp,createdBy:ctx.actorId};
    await this.repo.saveWorkspaceRecord({id:campaign.id,tenantId:ctx.tenantId,groupId,moduleId:MODULE,title:name,summary:'Campagne AdManager gouvernée. Budget sandbox : aucun débit réel.',status:'DRAFT',tags:['ad-campaign','sandbox','state:DRAFT'],data:encode(campaign),createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'AD_CAMPAIGN_CREATED',targetType:'ad_campaign',targetId:campaign.id,requestId:ctx.requestId,metadata:{groupId,objective:campaign.objective,budgetSandbox:campaign.budgetSandbox}}));return campaign;
  }
  async transition(groupId:string,id:string,to:AdCampaignState,note=''){
    const ctx=this.kernel.context.get(),x=await this.get(groupId,id),from=x.campaign.state;
    const allowed:Record<AdCampaignState,AdCampaignState[]>={DRAFT:['PENDING_REVIEW'],PENDING_REVIEW:['APPROVED','REJECTED'],APPROVED:['ACTIVE','DRAFT'],ACTIVE:['PAUSED','COMPLETED'],PAUSED:['ACTIVE','COMPLETED'],COMPLETED:[],REJECTED:['DRAFT']};
    if(!(allowed[from]??[]).includes(to))throw new Error('INVALID_AD_CAMPAIGN_TRANSITION');
    const next={...x.campaign,state:to,moderationNote:note.trim().slice(0,500)||x.campaign.moderationNote,updatedAt:now()};
    await this.repo.saveWorkspaceRecord({...x.record,status:to==='COMPLETED'?'DONE':to==='REJECTED'?'ARCHIVED':to==='DRAFT'?'DRAFT':'ACTIVE',tags:['ad-campaign','sandbox','state:'+to],data:encode(next),updatedAt:next.updatedAt});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'AD_CAMPAIGN_STATE_CHANGED',targetType:'ad_campaign',targetId:id,requestId:ctx.requestId,metadata:{from,to,note:note.trim().slice(0,200)}}));return next;
  }

  async dashboard(groupId:string){
    const campaigns=await this.list(groupId),prospects=await this.listProspects(groupId);
    const impressions=campaigns.reduce((n,x)=>n+x.impressions,0),opens=campaigns.reduce((n,x)=>n+x.opens,0),actions=campaigns.reduce((n,x)=>n+x.actions,0),negativeFeedback=campaigns.reduce((n,x)=>n+x.negativeFeedback,0);
    return{
      generatedAt:now(),campaigns,
      kpis:{campaigns:campaigns.length,active:campaigns.filter(x=>x.state==='ACTIVE').length,impressions,opens,actions,negativeFeedback,openRate:impressions?opens/impressions:0,actionRate:impressions?actions/impressions:0},
      inventory:AD_PLACEMENT_CATALOG,houseAds:HOUSE_AD_CATALOG,prospects,
      rules:{maxPaidAdsPerViewport:1,noAdsInFinancialMutationFlow:true,houseAdsFillUnsoldInventory:true,notificationAdsOptInOnly:true}
    };
  }
  async listProspects(groupId:string){
    await this.requireManager(groupId);const ctx=this.kernel.context.get();
    return(await this.repo.listWorkspaceRecords(ctx.tenantId,'ADS.PROSPECT',groupId)).map(r=>({
      id:r.id,groupId:String(r.groupId??''),organization:r.title,category:String(r.data.category??'OTHER'),locality:String(r.data.locality??''),
      sourceRef:String(r.data.sourceRef??''),publicContact:String(r.data.publicContact??''),state:String(r.data.state??'DISCOVERED'),
      estimatedMonthlyBudget:Number(r.data.estimatedMonthlyBudget??0),note:String(r.data.note??''),createdAt:r.createdAt,updatedAt:r.updatedAt,createdBy:r.createdBy
    })).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  async createProspect(groupId:string,input:{organization:string;category?:string;locality?:string;sourceRef?:string;publicContact?:string;estimatedMonthlyBudget?:number;note?:string}){
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),stamp=now(),organization=clean(input.organization,180);
    if(!organization)throw new Error('AD_PROSPECT_ORGANIZATION_REQUIRED');
    const budget=Math.trunc(input.estimatedMonthlyBudget??0);if(budget<0||!Number.isSafeInteger(budget))throw new Error('INVALID_AD_PROSPECT_BUDGET');
    const record:WorkspaceRecord={id:makeId('ad_prospect'),tenantId:ctx.tenantId,groupId,moduleId:'ADS.PROSPECT',title:organization,summary:'Prospect commercial public/consenti — aucune donnée membre.',status:'ACTIVE',tags:['ad-prospect','state:DISCOVERED'],data:{
      category:clean(input.category??'OTHER',80),locality:clean(input.locality??'',120),sourceRef:clean(input.sourceRef??'',500),publicContact:clean(input.publicContact??'',240),
      state:'DISCOVERED',estimatedMonthlyBudget:budget,note:clean(input.note??'',1000)
    },createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'AD_PROSPECT_CREATED',targetType:'ad_prospect',targetId:record.id,requestId:ctx.requestId,metadata:{groupId,category:record.data.category}}));
    return{id:record.id,groupId,organization,state:'DISCOVERED',...record.data,createdAt:stamp,updatedAt:stamp,createdBy:ctx.actorId};
  }
  async transitionProspect(groupId:string,id:string,to:AdProspectState,note=''){
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),record=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(!record||record.groupId!==groupId||record.moduleId!=='ADS.PROSPECT')throw new Error('AD_PROSPECT_NOT_FOUND');
    const from=String(record.data.state??'DISCOVERED') as AdProspectState;
    const allowed:Record<AdProspectState,AdProspectState[]>={DISCOVERED:['CONTACT_CANDIDATE','LOST'],CONTACT_CANDIDATE:['CONTACTED','LOST'],CONTACTED:['QUALIFIED','LOST'],QUALIFIED:['PROPOSAL','LOST'],PROPOSAL:['WON','LOST','QUALIFIED'],WON:[],LOST:['DISCOVERED']};
    if(!allowed[from]?.includes(to))throw new Error('INVALID_AD_PROSPECT_TRANSITION');
    const updatedAt=now(),data={...record.data,state:to,note:clean(note||String(record.data.note??''),1000)};
    await this.repo.saveWorkspaceRecord({...record,data,tags:['ad-prospect','state:'+to],updatedAt,status:to==='LOST'?'ARCHIVED':'ACTIVE'});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'AD_PROSPECT_STATE_CHANGED',targetType:'ad_prospect',targetId:id,requestId:ctx.requestId,metadata:{from,to}}));
    return{id,organization:record.title,state:to,...data,updatedAt};
  }

  async metric(groupId:string,id:string,event:'IMPRESSION'|'OPEN'|'ACTION'|'NEGATIVE_FEEDBACK'){
    const x=await this.get(groupId,id);if(x.campaign.state!=='ACTIVE')throw new Error('AD_CAMPAIGN_NOT_ACTIVE');
    const next={...x.campaign,updatedAt:now()};if(event==='IMPRESSION')next.impressions++;else if(event==='OPEN')next.opens++;else if(event==='ACTION')next.actions++;else next.negativeFeedback++;
    await this.repo.saveWorkspaceRecord({...x.record,data:encode(next),updatedAt:next.updatedAt});return next;
  }
}


export type AdProspectState='DISCOVERED'|'CONTACT_CANDIDATE'|'CONTACTED'|'QUALIFIED'|'PROPOSAL'|'WON'|'LOST';
export type AdPlacementId='HOME_AFTER_PRIORITIES'|'FEED_NATIVE'|'FORUM_NATIVE'|'MARKETPLACE_SPONSORED'|'GROUP_SPONSOR'|'REPORT_FOOTER'|'RECEIPT_FOOTER'|'POST_ACTION_HOUSE'|'NOTIFICATION_OPT_IN';
export interface AdPlacementSpec{
  id:AdPlacementId;labelFr:string;surface:string;paid:boolean;houseFallback:boolean;maxDensity:string;lowData:string;reason:string;
}
export const AD_PLACEMENT_CATALOG:AdPlacementSpec[]=[
  {id:'HOME_AFTER_PRIORITIES',labelFr:'Accueil — après les priorités',surface:'dashboard',paid:true,houseFallback:true,maxDensity:'1 carte native par écran initial',lowData:'texte + miniature <= 60 Ko',reason:'Visible sans repousser les échéances, soldes et actions urgentes.'},
  {id:'FEED_NATIVE',labelFr:'Fil — carte native',surface:'feed',paid:true,houseFallback:true,maxDensity:'1 sponsor pour 8 à 12 éléments organiques',lowData:'texte prioritaire',reason:'Format naturel, mesurable et moins intrusif qu’une bannière.'},
  {id:'FORUM_NATIVE',labelFr:'Forum — insertion native',surface:'forum',paid:true,houseFallback:true,maxDensity:'1 sponsor pour 10 messages/listes, jamais au milieu d’un thread court',lowData:'texte prioritaire',reason:'Monétise la découverte sans casser la conversation.'},
  {id:'MARKETPLACE_SPONSORED',labelFr:'Marketplace — produit/partenaire sponsorisé',surface:'marketplace',paid:true,houseFallback:false,maxDensity:'1 résultat sponsorisé parmi les 4 premiers puis <= 15 %',lowData:'miniature optimisée',reason:'Intention commerciale forte et attribution plus fiable.'},
  {id:'GROUP_SPONSOR',labelFr:'Page groupe — sponsor utile',surface:'group',paid:true,houseFallback:false,maxDensity:'1 emplacement si le groupe a opt-in',lowData:'logo facultatif + texte',reason:'Permet sponsoring local/ONG sans exploiter les finances individuelles.'},
  {id:'REPORT_FOOTER',labelFr:'Rapport — pied sponsorisé',surface:'document',paid:true,houseFallback:true,maxDensity:'petit footer ou dernière page',lowData:'texte/QR léger',reason:'Finance certains documents sans gêner leur lecture.'},
  {id:'RECEIPT_FOOTER',labelFr:'Reçu — pied discret',surface:'receipt',paid:true,houseFallback:true,maxDensity:'<= 15 % de la hauteur du pied',lowData:'texte seul',reason:'Très visible après l’action, jamais avant la validation financière.'},
  {id:'POST_ACTION_HOUSE',labelFr:'Après action — découverte Eco-System',surface:'post-action',paid:false,houseFallback:true,maxDensity:'1 carte, fermable',lowData:'texte',reason:'Cross-sell maison après réussite sans perturber l’action principale.'},
  {id:'NOTIFICATION_OPT_IN',labelFr:'Notification sponsorisée opt-in',surface:'notification',paid:true,houseFallback:false,maxDensity:'fortement limitée, préférence explicite',lowData:'texte',reason:'Canal puissant réservé aux utilisateurs ayant accepté ce format.'}
];

export interface HouseAdCreative{key:string;headline:string;body:string;callToAction:string;destinationRef:string;placementIds:AdPlacementId[];objective:string;}
export const HOUSE_AD_CATALOG:HouseAdCreative[]=[
  {key:'INTEREST_FAIRNESS_LAB',headline:'Testez votre règle de partage des intérêts',body:'Comparez votre méthode historique, Capital × Temps et le capital réellement productif avant la clôture.',callToAction:'Ouvrir le Fairness Lab',destinationRef:'module:SAVINGS.YIELD.FAIRNESS_LAB',placementIds:['HOME_AFTER_PRIORITIES','POST_ACTION_HOUSE','REPORT_FOOTER'],objective:'ADOPTION'},
  {key:'GROUP_DOCTOR',headline:'Votre groupe est-il cohérent ?',body:'Le Group Doctor signale règles contradictoires, preuves manquantes et écarts sans modifier vos décisions.',callToAction:'Faire le diagnostic',destinationRef:'module:GROUP.DOCTOR',placementIds:['HOME_AFTER_PRIORITIES','POST_ACTION_HOUSE'],objective:'ADOPTION'},
  {key:'ACADEMY',headline:'Former le Bureau sans longs manuels',body:'Micro-formations caisse, prêts, rapprochement, gouvernance et transition papier-numérique.',callToAction:'Voir Academy',destinationRef:'module:ACADEMY',placementIds:['FEED_NATIVE','FORUM_NATIVE','POST_ACTION_HOUSE'],objective:'RETENTION'},
  {key:'DEMAND_EXCHANGE',headline:'Achetez à plusieurs, négociez mieux',body:'Regroupez les besoins de plusieurs groupes et comparez prix rendu, capacité et délai.',callToAction:'Voir les achats groupés',destinationRef:'module:ECONOMIC.DEMAND.EXCHANGE.CORE',placementIds:['MARKETPLACE_SPONSORED','FEED_NATIVE'],objective:'ECONOMY'},
  {key:'PAPER_BRIDGE',headline:'Gardez aussi vos registres papier',body:'Préparez les fiches de séance, états de caisse et registres imprimables à partir des mêmes données.',callToAction:'Préparer un registre',destinationRef:'module:PAPER.BRIDGE',placementIds:['POST_ACTION_HOUSE','REPORT_FOOTER'],objective:'ADOPTION'}
];

export interface AdDeliveryRequest{placementId:AdPlacementId;locality?:string;interestTags?:string[];groupKind?:string;rubricKind?:string;viewerFrequency7d?:Record<string,number>;}
export interface AdDeliveryDecision{kind:'PAID'|'HOUSE'|'NONE';campaignId?:string;houseKey?:string;reason:string;score:number;}
export function selectAdDelivery(campaigns:AdCampaign[],request:AdDeliveryRequest):AdDeliveryDecision{
  const spec=AD_PLACEMENT_CATALOG.find(x=>x.id===request.placementId);if(!spec)throw new Error('UNKNOWN_AD_PLACEMENT');
  const nowMs=Date.now();
  const eligible=campaigns.filter(c=>{
    if(c.state!=='ACTIVE'||!c.placements.includes(request.placementId))return false;
    if(c.startsAt&&Date.parse(c.startsAt)>nowMs)return false;if(c.endsAt&&Date.parse(c.endsAt)<nowMs)return false;
    if((request.viewerFrequency7d?.[c.id]??0)>=c.frequencyCapPer7Days)return false;
    if(c.targeting.localities?.length&&(!request.locality||!c.targeting.localities.includes(request.locality)))return false;
    if(c.targeting.groupKinds?.length&&(!request.groupKind||!c.targeting.groupKinds.includes(request.groupKind)))return false;
    if(c.targeting.rubricKinds?.length&&(!request.rubricKind||!c.targeting.rubricKinds.includes(request.rubricKind)))return false;
    return true;
  }).map(c=>{
    const engagement=(c.actions*5+c.opens+1)/(c.impressions+20),feedbackPenalty=1/(1+c.negativeFeedback*0.2),freshness=c.impressions<100?1.08:1;
    const score=(Math.max(1,c.budgetSandbox)+1000)*engagement*feedbackPenalty*freshness;
    return{c,score};
  }).sort((a,b)=>b.score-a.score||a.c.id.localeCompare(b.c.id));
  if(eligible[0])return{kind:'PAID',campaignId:eligible[0].c.id,reason:'ACTIVE_ELIGIBLE_HIGHEST_VALUE',score:eligible[0].score};
  if(spec.houseFallback){
    const house=HOUSE_AD_CATALOG.find(h=>h.placementIds.includes(request.placementId));
    if(house)return{kind:'HOUSE',houseKey:house.key,reason:'UNSOLD_INVENTORY_FILLED_BY_PLATFORM_PROMOTION',score:0};
  }
  return{kind:'NONE',reason:'NO_ELIGIBLE_CAMPAIGN',score:0};
}
