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
  async metric(groupId:string,id:string,event:'IMPRESSION'|'OPEN'|'ACTION'|'NEGATIVE_FEEDBACK'){
    const x=await this.get(groupId,id);if(x.campaign.state!=='ACTIVE')throw new Error('AD_CAMPAIGN_NOT_ACTIVE');
    const next={...x.campaign,updatedAt:now()};if(event==='IMPRESSION')next.impressions++;else if(event==='OPEN')next.opens++;else if(event==='ACTION')next.actions++;else next.negativeFeedback++;
    await this.repo.saveWorkspaceRecord({...x.record,data:encode(next),updatedAt:next.updatedAt});return next;
  }
}
