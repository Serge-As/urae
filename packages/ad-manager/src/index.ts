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
  mediaAssetId?:string;
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

export interface HouseAdAILike{run?(model:string,input:Record<string,unknown>,options?:Record<string,unknown>):Promise<unknown>;}
export class AdManagerService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public houseAI?:HouseAdAILike){}
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
    const out={headline:clean(c.headline,120),body:clean(c.body,1000),callToAction:clean(c.callToAction,60),destinationRef:clean(c.destinationRef,240),...(c.mediaAssetId?{mediaAssetId:clean(c.mediaAssetId,120)}:{})};
    if(out.mediaAssetId&&!/^visual_media_[a-zA-Z0-9_-]{1,105}$/.test(out.mediaAssetId))throw new Error('INVALID_AD_MEDIA_REFERENCE');
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

  async housePlan(groupId:string){
    const group=await this.requireManager(groupId),ctx=this.kernel.context.get(),[rubrics,meetings]=await Promise.all([this.repo.listRubricDefinitions(ctx.tenantId,groupId),this.repo.listMeetings(ctx.tenantId,groupId)]);
    const profile=group.launchProfileSnapshot,expected=profile?.cycle?.expectedSessions??0,done=meetings.filter(x=>x.status==='closed').length;
    const exerciseProgress=expected>0?Math.min(1,done/expected):undefined;
    let monthsToExerciseEnd:undefined|number;
    if(profile?.cycle?.startsAt&&expected>0){
      const start=Date.parse(profile.cycle.startsAt),cadence=profile.cycle.cadence??'MONTHLY',daysPerSession=cadence==='WEEKLY'?7:cadence==='BIWEEKLY'?14:cadence==='MONTHLY'?30.4375:30.4375;
      if(Number.isFinite(start)){const end=start+expected*daysPerSession*86400000;monthsToExerciseEnd=Math.max(0,(end-Date.now())/(30.4375*86400000));}
    }
    const deferredAssistance=rubrics.some(r=>r.activityPlan?.kind==='ASSISTANCE'&&r.policies?.assistance?.reviewStatus!=='VALIDATED');
    const context:HouseAdContext={groupKey:group.id,groupKind:group.kind,originMode:group.originMode,exerciseProgress,monthsToExerciseEnd,rubricKinds:rubrics.map(r=>r.activityPlan?.kind).filter(Boolean) as string[],rubricNames:rubrics.map(r=>r.name),lowBandwidth:Boolean(profile?.accessibility?.lowBandwidthPriority),deferredAssistance};
    return{context,plan:buildContextualHouseAdPlan(context),generatedAt:now()};
  }

  async composeHouseVariants(groupId:string){
    const base=await this.housePlan(groupId),top=base.plan.slice(0,4);
    if(!this.houseAI?.run)return{...base,aiUsed:false,model:null,variants:top.map(x=>({key:x.key,headline:x.headline,body:x.body,callToAction:x.callToAction,source:'DETERMINISTIC_FALLBACK'}))};
    const rubricFamilies=[...new Set((base.context.rubricKinds??[]).map(x=>String(x).toUpperCase()).filter(x=>/^[A-Z0-9_:-]{1,48}$/.test(x)))].slice(0,24);
    const names=(base.context.rubricNames??[]).join(' ').toLowerCase();
    const commerceSignals=[
      /savon/.test(names)?'SOAP':null,
      /huile/.test(names)?'OIL':null,
      /drap/.test(names)?'LINEN':null,
      /tissu/.test(names)?'TEXTILE':null,
      /assiette/.test(names)?'TABLEWARE':null
    ].filter(Boolean);
    const safeContext={
      stage:top[0]?.stage??'ANY',groupKind:base.context.groupKind??'unknown',originMode:base.context.originMode??'unknown',
      monthsToExerciseEnd:base.context.monthsToExerciseEnd===undefined?null:Number(base.context.monthsToExerciseEnd.toFixed(1)),
      rubricFamilies,commerceSignals,
      hasSavings:rubricFamilies.includes('SAVINGS'),hasAssistance:rubricFamilies.includes('ASSISTANCE'),
      hasTontine:rubricFamilies.some(x=>x.includes('TONTINE')),hasInKindDemand:commerceSignals.length>0,
      lowBandwidth:Boolean(base.context.lowBandwidth),deferredAssistance:Boolean(base.context.deferredAssistance)
    };
    const prompt=[
      'Tu es le rédacteur publicitaire interne d Eco-System, plateforme de tontines et associations au Cameroun.',
      'Crée exactement 4 variantes House Ads en français à partir du contexte de GROUPE ci-dessous et des services candidats.',
      'Contraintes absolues : n utiliser que les signaux collectifs fournis ; aucune donnée personnelle ou financière individuelle ; pas de manipulation ; pas de promesse financière ; pas de faux sentiment d urgence.',
      'Chaque variante : key existante, headline <= 80 caractères, body <= 260 caractères, callToAction <= 45 caractères.',
      'La publicité doit être utile au moment de l exercice. Une tontine savon/huile/drap peut renforcer Demand Exchange, mais un groupe sans cette rubrique peut encore recevoir une promotion commerce en exploration modérée.',
      'Réponds UNIQUEMENT par un tableau JSON valide sans markdown.',
      'CONTEXTE='+JSON.stringify(safeContext),
      'CANDIDATS='+JSON.stringify(top.map(x=>({key:x.key,headline:x.headline,body:x.body,callToAction:x.callToAction,reasonCodes:x.reasonCodes})))
    ].join('\n');
    try{
      const raw=await this.houseAI.run('@cf/zai-org/glm-4.7-flash',{messages:[{role:'user',content:prompt}],max_tokens:900,temperature:.7},{gateway:{id:'default',skipCache:false,cacheTtl:86400}});
      const carrier=raw as any,text=String(carrier?.response??carrier?.result?.response??carrier?.output_text??carrier?.choices?.[0]?.message?.content??'').trim();
      const jsonText=text.replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'');
      const parsed=JSON.parse(jsonText);
      if(!Array.isArray(parsed))throw new Error('HOUSE_AI_INVALID_SHAPE');
      const known=new Set(top.map(x=>x.key)),variants=parsed.slice(0,4).filter(x=>x&&known.has(String(x.key))).map(x=>({
        key:String(x.key),headline:clean(String(x.headline??''),80),body:clean(String(x.body??''),260),callToAction:clean(String(x.callToAction??''),45),source:'WORKERS_AI'
      })).filter(x=>x.headline&&x.body&&x.callToAction);
      if(!variants.length)throw new Error('HOUSE_AI_EMPTY');
      return{...base,aiUsed:true,model:'@cf/zai-org/glm-4.7-flash',variants};
    }catch(error){
      return{...base,aiUsed:false,model:'@cf/zai-org/glm-4.7-flash',warning:'AI_COMPOSER_FALLBACK:'+String((error as Error)?.message??error),variants:top.map(x=>({key:x.key,headline:x.headline,body:x.body,callToAction:x.callToAction,source:'DETERMINISTIC_FALLBACK'}))};
    }
  }

  /** Safe public projection for active group members. No targeting or budgets leave this endpoint. */
  async placement(groupId:string,placementId:AdPlacementId){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);
    if(!group)throw Error('GROUP_NOT_FOUND');
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(group.createdBy!==ctx.actorId&&!member)throw Error('FORBIDDEN_SCOPE');
    if(!AD_PLACEMENT_CATALOG.some(x=>x.id===placementId))throw Error('UNKNOWN_AD_PLACEMENT');
    // Direct serving is intentionally absent from receipts and financial mutation flows.
    if(!['HOME_AFTER_PRIORITIES','FEED_NATIVE','FORUM_NATIVE','MARKETPLACE_SPONSORED'].includes(placementId))
      throw Error('AD_PLACEMENT_NOT_PUBLIC');
    const records=await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId);
    const campaigns=records.filter(r=>r.data.state==='ACTIVE').map(decode);
    const decision=selectAdDelivery(campaigns,{placementId,groupKind:group.kind});
    if(decision.kind==='PAID'){
      const campaign=campaigns.find(x=>x.id===decision.campaignId);
      if(!campaign)return{kind:'NONE' as const};
      const {headline,body,callToAction,destinationRef,mediaAssetId}=campaign.creative;
      return{kind:'SPONSORED_SANDBOX' as const,campaignId:campaign.id,
        headline,body,callToAction,destinationRef,mediaAssetId:mediaAssetId??null};
    }
    if(decision.kind==='HOUSE'){
      const house=HOUSE_AD_CATALOG.find(x=>x.key===decision.houseKey);
      if(house)return{kind:'HOUSE' as const,headline:house.headline,body:house.body,
        callToAction:house.callToAction,destinationRef:house.destinationRef,mediaAssetId:null};
    }
    return{kind:'NONE' as const};
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
    return{id:record.id,groupId,organization,...record.data,state:'DISCOVERED',createdAt:stamp,updatedAt:stamp,createdBy:ctx.actorId};
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
    return{id,organization:record.title,...data,state:to,updatedAt};
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

export type HouseAdStage='EARLY'|'MID'|'CLOSING'|'ANY';
export interface HouseAdCreative{key:string;headline:string;body:string;callToAction:string;destinationRef:string;placementIds:AdPlacementId[];objective:string;stages?:HouseAdStage[];rubricHints?:string[];universal?:boolean;}
export interface HouseAdContext{
  groupKey:string;
  groupKind?:string;
  originMode?:string;
  exerciseProgress?:number;
  monthsToExerciseEnd?:number;
  rubricKinds?:string[];
  rubricNames?:string[];
  lowBandwidth?:boolean;
  deferredAssistance?:boolean;
}
export interface ContextualHouseAd extends HouseAdCreative{score:number;reasonCodes:string[];stage:HouseAdStage;variant:number;}
const textHash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;};
const stageFor=(ctx:HouseAdContext):HouseAdStage=>{
  if(ctx.monthsToExerciseEnd!==undefined&&ctx.monthsToExerciseEnd<=4)return'CLOSING';
  const p=ctx.exerciseProgress??0;if(p<.25)return'EARLY';if(p>=.67)return'CLOSING';return'MID';
};
const contextualBody=(ad:HouseAdCreative,ctx:HouseAdContext,stage:HouseAdStage,variant:number)=>{
  const rubricNames=(ctx.rubricNames??[]).join(' ').toLowerCase(),inKind=/savon|huile|drap|assiette|tissu/.test(rubricNames);
  if(ad.key==='PAPER_BRIDGE'&&stage==='EARLY')return variant%2?'Commencez l’exercice avec des fiches papier cohérentes avec Eco-System, utiles en réunion et en cas de connexion faible.':'Préparez dès maintenant feuilles de séance, registres et états de caisse imprimables, puis retrouvez la même vérité dans Eco-System.';
  if(ad.key==='ACADEMY'&&stage==='EARLY')return variant%2?'Formez rapidement président, trésorier et contrôleur avant que les habitudes de l’exercice ne soient figées.':'Début d’exercice : une courte formation du Bureau évite beaucoup de corrections de caisse et de règles plus tard.';
  if(ad.key==='GROUP_DOCTOR'&&stage!=='EARLY')return variant%2?'Comparez le RI, les pratiques observées et les opérations déjà enregistrées avant que les écarts ne deviennent difficiles à corriger.':'Votre règlement, vos habitudes et vos comptes racontent-ils la même histoire ? Faites un diagnostic sans modifier les données.';
  if(ad.key==='INTEREST_FAIRNESS_LAB'&&stage==='CLOSING')return variant%2?'La fin d’exercice approche : comparez coefficients, Capital × Temps et capital réellement productif avant de partager les intérêts.':'À moins de quatre mois de la clôture, testez plusieurs règles de redistribution et montrez les écarts au Bureau avant toute validation.';
  if(ad.key==='DEMAND_EXCHANGE'&&inKind)return variant%2?'Vos rubriques en nature peuvent devenir un pouvoir d’achat collectif : comparez fournisseurs, transport et délais.':'Savons, huiles, draps ou autres besoins : agrégez la demande et négociez le coût rendu au lieu de comparer seulement le prix affiché.';
  if(ad.key==='ASSISTANCE_RULEBOOK')return'Les modalités maladie, deuil, mariage, baptême et autres événements peuvent être relues et validées une par une sans ralentir la création du groupe.';
  if(ad.key==='MEETING_AUTOPILOT')return'Préparez la prochaine séance : solde d’ouverture, rubriques actives, avances, bénéficiaires prévus et preuves encore attendues.';
  return ad.body;
};
export const HOUSE_AD_CATALOG:HouseAdCreative[]=[
  {key:'INTEREST_FAIRNESS_LAB',headline:'Préparez le partage des intérêts',body:'Comparez votre méthode historique, Capital × Temps et le capital réellement productif avant la clôture.',callToAction:'Ouvrir le Fairness Lab',destinationRef:'module:SAVINGS.YIELD.FAIRNESS_LAB',placementIds:['HOME_AFTER_PRIORITIES','POST_ACTION_HOUSE','REPORT_FOOTER'],objective:'ADOPTION',stages:['CLOSING'],rubricHints:['SAVINGS']},
  {key:'GROUP_DOCTOR',headline:'Votre groupe est-il cohérent ?',body:'Le Group Doctor signale règles contradictoires, preuves manquantes et écarts sans modifier vos décisions.',callToAction:'Faire le diagnostic',destinationRef:'module:GROUP.DOCTOR',placementIds:['HOME_AFTER_PRIORITIES','POST_ACTION_HOUSE'],objective:'ADOPTION',stages:['MID','CLOSING'],universal:true},
  {key:'ACADEMY',headline:'Former le Bureau sans longs manuels',body:'Micro-formations caisse, prêts, rapprochement, gouvernance et transition papier-numérique.',callToAction:'Voir Academy',destinationRef:'module:ACADEMY',placementIds:['FEED_NATIVE','FORUM_NATIVE','POST_ACTION_HOUSE','HOME_AFTER_PRIORITIES'],objective:'RETENTION',stages:['EARLY','MID'],universal:true},
  {key:'DEMAND_EXCHANGE',headline:'Achetez à plusieurs, négociez mieux',body:'Regroupez les besoins de plusieurs groupes et comparez prix rendu, capacité et délai.',callToAction:'Voir les achats groupés',destinationRef:'module:ECONOMIC.DEMAND.EXCHANGE.CORE',placementIds:['MARKETPLACE_SPONSORED','FEED_NATIVE'],objective:'ECONOMY',stages:['ANY'],rubricHints:['TONTINE','IN_KIND','CONTRIBUTION'],universal:true},
  {key:'PAPER_BRIDGE',headline:'Gardez aussi vos registres papier',body:'Préparez les fiches de séance, états de caisse et registres imprimables à partir des mêmes données.',callToAction:'Préparer un registre',destinationRef:'module:PAPER.BRIDGE',placementIds:['POST_ACTION_HOUSE','REPORT_FOOTER','HOME_AFTER_PRIORITIES'],objective:'ADOPTION',stages:['EARLY','MID'],universal:true},
  {key:'ASSISTANCE_RULEBOOK',headline:'Validez les modalités d’assistance sans bloquer la création',body:'Relisez maladie, deuil, mariage, baptême et autres événements dans un menu dédié.',callToAction:'Ouvrir les règles Assistance',destinationRef:'view:finance#assistanceRulebookPanel',placementIds:['HOME_AFTER_PRIORITIES','POST_ACTION_HOUSE'],objective:'ADOPTION',stages:['EARLY','MID'],rubricHints:['ASSISTANCE']},
  {key:'MEETING_AUTOPILOT',headline:'Préparez la prochaine réunion en quelques contrôles',body:'Vérifiez solde d’ouverture, rubriques, bénéficiaires et preuves avant la séance.',callToAction:'Préparer la réunion',destinationRef:'module:MEETING.AUTOPILOT',placementIds:['HOME_AFTER_PRIORITIES','POST_ACTION_HOUSE'],objective:'RETENTION',stages:['ANY'],universal:true}
];

export function buildContextualHouseAdPlan(context:HouseAdContext):ContextualHouseAd[]{
  const stage=stageFor(context),kinds=new Set((context.rubricKinds??[]).map(x=>x.toUpperCase())),names=(context.rubricNames??[]).join(' ').toLowerCase(),seed=textHash(context.groupKey||'group');
  return HOUSE_AD_CATALOG.map((ad,index)=>{
    let score=10,reasonCodes:string[]=[];
    const stageMatch=!ad.stages?.length||ad.stages.includes('ANY')||ad.stages.includes(stage);
    if(stageMatch){score+=35;reasonCodes.push('STAGE_MATCH:'+stage);}else score-=25;
    const hintMatch=(ad.rubricHints??[]).some(h=>kinds.has(h)||names.includes(h.toLowerCase()));
    if(hintMatch){score+=55;reasonCodes.push('RUBRIC_MATCH');}
    else if(ad.rubricHints?.length&&ad.universal){score+=8;reasonCodes.push('EXPLORATION_ALLOWED');}
    else if(ad.rubricHints?.length)score-=20;
    if(context.originMode==='IMPORT_EXISTING'&&ad.key==='PAPER_BRIDGE'){score+=45;reasonCodes.push('HISTORICAL_GROUP');}
    if(context.lowBandwidth&&ad.key==='PAPER_BRIDGE'){score+=25;reasonCodes.push('LOW_BANDWIDTH');}
    if(context.deferredAssistance&&ad.key==='ASSISTANCE_RULEBOOK'){score+=80;reasonCodes.push('ASSISTANCE_REVIEW_PENDING');}
    if(stage==='CLOSING'&&ad.key==='INTEREST_FAIRNESS_LAB'&&kinds.has('SAVINGS')){score+=100;reasonCodes.push('FOUR_MONTH_CLOSING_WINDOW');}
    if(/savon|huile|drap|assiette|tissu/.test(names)&&ad.key==='DEMAND_EXCHANGE'){score+=90;reasonCodes.push('IN_KIND_DEMAND');}
    if(stage==='EARLY'&&ad.key==='ACADEMY'){score+=75;reasonCodes.push('EARLY_TRAINING');}
    const variant=(seed+index)%3;
    return{...ad,body:contextualBody(ad,context,stage,variant),score,reasonCodes,stage,variant};
  }).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
}

export interface AdDeliveryRequest{placementId:AdPlacementId;locality?:string;interestTags?:string[];groupKind?:string;rubricKind?:string;viewerFrequency7d?:Record<string,number>;houseContext?:HouseAdContext;}
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
    if(c.targeting.interestTags?.length){
      const viewer=new Set((request.interestTags??[]).map(x=>x.toLowerCase()));
      if(!c.targeting.interestTags.some(x=>viewer.has(x.toLowerCase())))return false;
    }
    return true;
  }).map(c=>{
    const engagement=(c.actions*5+c.opens+1)/(c.impressions+20),feedbackPenalty=1/(1+c.negativeFeedback*0.2),freshness=c.impressions<100?1.08:1;
    const score=(Math.max(1,c.budgetSandbox)+1000)*engagement*feedbackPenalty*freshness;
    return{c,score};
  }).sort((a,b)=>b.score-a.score||a.c.id.localeCompare(b.c.id));
  if(eligible[0])return{kind:'PAID',campaignId:eligible[0].c.id,reason:'ACTIVE_ELIGIBLE_HIGHEST_VALUE',score:eligible[0].score};
  if(spec.houseFallback){
    const plan=request.houseContext?buildContextualHouseAdPlan(request.houseContext):HOUSE_AD_CATALOG.map((h,index)=>({...h,score:0,reasonCodes:['NO_CONTEXT'],stage:'ANY' as HouseAdStage,variant:index%3}));
    const house=plan.find(h=>h.placementIds.includes(request.placementId));
    if(house)return{kind:'HOUSE',houseKey:house.key,reason:'UNSOLD_INVENTORY_CONTEXTUAL_PLATFORM_PROMOTION',score:house.score};
  }
  return{kind:'NONE',reason:'NO_ELIGIBLE_CAMPAIGN',score:0};
}
