import type {PlatformRepository,D1DatabaseLike} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type ReferralTargetKind='GROUP'|'MANAGER'|'PARTNER'|'PRODUCT'|'CONTENT';
export type ReferralConversionKind='MEMBERSHIP_APPROVED'|'LEAD_QUALIFIED'|'ORDER_CONFIRMED'|'PROGRAM_JOINED'|'OTHER_VERIFIED';
export type ReferralRewardMode='SANDBOX_CREDIT'|'NON_CASH';
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=240)=>String(v??'').trim().slice(0,n);
const positive=(v:unknown,name:string,allowZero=true)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<(allowZero?0:1))throw new Error('INVALID_'+name.toUpperCase());return n;};
const hex=async(input:string)=>{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');};
const opaque=()=>{const bytes=new Uint8Array(18);crypto.getRandomValues(bytes);return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');};

export interface ReferralBudgetSnapshot{
  campaignId:Id;budgetTotal:number;reservedAmount:number;spentAmount:number;rewardPerConversion:number;state:'DRAFT'|'ACTIVE'|'PAUSED'|'DONE';
}
export interface ReferralBudgetStore{
  create(snapshot:ReferralBudgetSnapshot,tenantId:Id,ownerAccountId:Id):Promise<ReferralBudgetSnapshot>;
  setState(campaignId:Id,state:ReferralBudgetSnapshot['state']):Promise<ReferralBudgetSnapshot>;
  reserve(campaignId:Id,conversionId:Id):Promise<{reserved:boolean;amount:number;snapshot:ReferralBudgetSnapshot}>;
  approve(campaignId:Id,conversionId:Id):Promise<ReferralBudgetSnapshot>;
  snapshot(campaignId:Id):Promise<ReferralBudgetSnapshot|undefined>;
}

export class InMemoryReferralBudgetStore implements ReferralBudgetStore{
  campaigns=new Map<Id,ReferralBudgetSnapshot>();reservations=new Map<Id,{campaignId:Id;amount:number;state:'RESERVED'|'APPROVED'|'CANCELLED'}>();
  async create(x:ReferralBudgetSnapshot){if(this.campaigns.has(x.campaignId))return structuredClone(this.campaigns.get(x.campaignId)!);this.campaigns.set(x.campaignId,structuredClone(x));return structuredClone(x);}
  async setState(id:Id,state:ReferralBudgetSnapshot['state']){const x=this.campaigns.get(id);if(!x)throw new Error('REFERRAL_CAMPAIGN_NOT_FOUND');x.state=state;return structuredClone(x);}
  async reserve(id:Id,conversionId:Id){
    const x=this.campaigns.get(id);if(!x)throw new Error('REFERRAL_CAMPAIGN_NOT_FOUND');const old=this.reservations.get(conversionId);if(old)return{reserved:old.state!=='CANCELLED',amount:old.amount,snapshot:structuredClone(x)};
    const amount=x.rewardPerConversion;if(x.state!=='ACTIVE'||x.reservedAmount+x.spentAmount+amount>x.budgetTotal)return{reserved:false,amount:0,snapshot:structuredClone(x)};
    x.reservedAmount+=amount;this.reservations.set(conversionId,{campaignId:id,amount,state:'RESERVED'});return{reserved:true,amount,snapshot:structuredClone(x)};
  }
  async approve(id:Id,conversionId:Id){const x=this.campaigns.get(id),r=this.reservations.get(conversionId);if(!x||!r||r.campaignId!==id)throw new Error('REFERRAL_RESERVATION_NOT_FOUND');if(r.state==='APPROVED')return structuredClone(x);if(r.state!=='RESERVED')throw new Error('REFERRAL_RESERVATION_INVALID');x.reservedAmount-=r.amount;x.spentAmount+=r.amount;r.state='APPROVED';return structuredClone(x);}
  async snapshot(id:Id){const x=this.campaigns.get(id);return x?structuredClone(x):undefined;}
}

type D1Row={campaign_id:string;budget_total:number;reserved_amount:number;spent_amount:number;reward_per_conversion:number;state:ReferralBudgetSnapshot['state']};
const fromRow=(r:D1Row):ReferralBudgetSnapshot=>({campaignId:r.campaign_id,budgetTotal:Number(r.budget_total),reservedAmount:Number(r.reserved_amount),spentAmount:Number(r.spent_amount),rewardPerConversion:Number(r.reward_per_conversion),state:r.state});
export class D1ReferralBudgetStore implements ReferralBudgetStore{
  constructor(public db:D1DatabaseLike){}
  async create(x:ReferralBudgetSnapshot,tenantId:Id,ownerAccountId:Id){
    await this.db.prepare(`INSERT INTO referral_campaign_budgets(campaign_id,tenant_id,owner_account_id,budget_total,reserved_amount,spent_amount,reward_per_conversion,state,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(campaign_id) DO NOTHING`).bind(x.campaignId,tenantId,ownerAccountId,x.budgetTotal,x.reservedAmount,x.spentAmount,x.rewardPerConversion,x.state,now()).run();
    return (await this.snapshot(x.campaignId))!;
  }
  async setState(id:Id,state:ReferralBudgetSnapshot['state']){await this.db.prepare('UPDATE referral_campaign_budgets SET state=?,updated_at=? WHERE campaign_id=?').bind(state,now(),id).run();const x=await this.snapshot(id);if(!x)throw new Error('REFERRAL_CAMPAIGN_NOT_FOUND');return x;}
  async reserve(id:Id,conversionId:Id){
    const existing=await this.db.prepare('SELECT amount,state FROM referral_reward_reservations WHERE conversion_id=?').bind(conversionId).first<{amount:number;state:string}>();
    if(existing){const x=await this.snapshot(id);if(!x)throw new Error('REFERRAL_CAMPAIGN_NOT_FOUND');return{reserved:existing.state!=='CANCELLED',amount:Number(existing.amount),snapshot:x};}
    const stamp=now();
    const statements=[
      this.db.prepare(`INSERT INTO referral_reward_reservations(conversion_id,campaign_id,amount,state,created_at,updated_at)
        SELECT ?,campaign_id,reward_per_conversion,'RESERVED',?,? FROM referral_campaign_budgets
        WHERE campaign_id=? AND state='ACTIVE' AND reserved_amount+spent_amount+reward_per_conversion<=budget_total`)
        .bind(conversionId,stamp,stamp,id),
      this.db.prepare(`UPDATE referral_campaign_budgets SET reserved_amount=reserved_amount+
        COALESCE((SELECT amount FROM referral_reward_reservations WHERE conversion_id=? AND campaign_id=? AND state='RESERVED'),0),updated_at=?
        WHERE campaign_id=? AND EXISTS(SELECT 1 FROM referral_reward_reservations WHERE conversion_id=? AND campaign_id=? AND state='RESERVED')`)
        .bind(conversionId,id,stamp,id,conversionId,id)
    ];
    await this.db.batch(statements);
    const r=await this.db.prepare('SELECT amount,state FROM referral_reward_reservations WHERE conversion_id=? AND campaign_id=?').bind(conversionId,id).first<{amount:number;state:string}>(),x=await this.snapshot(id);
    if(!x)throw new Error('REFERRAL_CAMPAIGN_NOT_FOUND');return{reserved:Boolean(r&&r.state==='RESERVED'),amount:r?Number(r.amount):0,snapshot:x};
  }
  async approve(id:Id,conversionId:Id){
    const stamp=now(),r=await this.db.prepare('SELECT amount,state FROM referral_reward_reservations WHERE conversion_id=? AND campaign_id=?').bind(conversionId,id).first<{amount:number;state:string}>();
    if(!r)throw new Error('REFERRAL_RESERVATION_NOT_FOUND');if(r.state==='APPROVED')return (await this.snapshot(id))!;
    if(r.state!=='RESERVED')throw new Error('REFERRAL_RESERVATION_INVALID');
    await this.db.batch([
      this.db.prepare('UPDATE referral_campaign_budgets SET reserved_amount=reserved_amount-?,spent_amount=spent_amount+?,updated_at=? WHERE campaign_id=? AND reserved_amount>=?').bind(Number(r.amount),Number(r.amount),stamp,id,Number(r.amount)),
      this.db.prepare("UPDATE referral_reward_reservations SET state='APPROVED',updated_at=? WHERE conversion_id=? AND campaign_id=? AND state='RESERVED'").bind(stamp,conversionId,id)
    ]);
    return (await this.snapshot(id))!;
  }
  async snapshot(id:Id){const r=await this.db.prepare('SELECT campaign_id,budget_total,reserved_amount,spent_amount,reward_per_conversion,state FROM referral_campaign_budgets WHERE campaign_id=?').bind(id).first<D1Row>();return r?fromRow(r):undefined;}
}

export class GrowthReferralService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public budgets:ReferralBudgetStore){}
  private ctx(){return this.kernel.context.get();}
  private async actorRecords(module='GROWTH.REFERRAL'){const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId,module)).filter(x=>x.createdBy===c.actorId);}
  async createCampaign(input:{title:string;targetKind:ReferralTargetKind;targetId:Id;budgetTotal:number;rewardPerConversion:number;rewardMode?:ReferralRewardMode;endsAt?:string}){
    const c=this.ctx(),budgetTotal=positive(input.budgetTotal,'budget_total'),reward=positive(input.rewardPerConversion,'reward_per_conversion');
    if(reward>budgetTotal&&budgetTotal>0)throw new Error('REWARD_EXCEEDS_BUDGET');if(input.endsAt&&!Number.isFinite(Date.parse(input.endsAt)))throw new Error('INVALID_ENDS_AT');
    const id=makeId('refcampaign'),at=now(),record:WorkspaceRecord={id,tenantId:c.tenantId,moduleId:'GROWTH.REFERRAL',title:clean(input.title)||'Campagne de recommandation',status:'ACTIVE',tags:['referral','campaign'],data:{kind:'CAMPAIGN',targetKind:input.targetKind,targetId:input.targetId,rewardMode:input.rewardMode??'SANDBOX_CREDIT',endsAt:input.endsAt??'',state:'DRAFT'},createdBy:c.actorId,createdAt:at,updatedAt:at};
    await this.repo.saveWorkspaceRecord(record);const budget=await this.budgets.create({campaignId:id,budgetTotal,reservedAmount:0,spentAmount:0,rewardPerConversion:reward,state:'DRAFT'},c.tenantId,c.actorId);return{record,budget};
  }
  async setCampaignState(id:Id,state:'ACTIVE'|'PAUSED'|'DONE'){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.createdBy!==c.actorId||r.data.kind!=='CAMPAIGN')throw new Error('REFERRAL_CAMPAIGN_NOT_FOUND');
    const budget=await this.budgets.setState(id,state),next={...r,status:state==='DONE'?'DONE' as const:'ACTIVE' as const,data:{...r.data,state},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return{record:next,budget};
  }
  async createShare(input:{targetKind:ReferralTargetKind;targetId:Id;campaignId?:Id;channel?:'SYSTEM_SHARE'|'LINK'|'QR'|'CARD'}){
    const c=this.ctx();if(input.campaignId){const campaign=await this.repo.getWorkspaceRecord(c.tenantId,input.campaignId);if(!campaign||campaign.createdBy!==c.actorId||campaign.data.kind!=='CAMPAIGN')throw new Error('REFERRAL_CAMPAIGN_NOT_FOUND');}
    const code=opaque(),codeHash=await hex(code),at=now(),id=makeId('refshare'),record:WorkspaceRecord={id,tenantId:c.tenantId,moduleId:'GROWTH.REFERRAL',title:'Partage volontaire',status:'ACTIVE',tags:['referral','share-intent'],data:{kind:'SHARE',targetKind:input.targetKind,targetId:input.targetId,campaignId:input.campaignId??'',channel:input.channel??'SYSTEM_SHARE',codeHash,launchedAt:at,receivedCount:0,leadCount:0,conversionCount:0},createdBy:c.actorId,createdAt:at,updatedAt:at};
    await this.repo.saveWorkspaceRecord(record);return{shareId:id,code,targetKind:input.targetKind,targetId:input.targetId,measurement:'SHARE_LAUNCHED'};
  }
  private async findShare(code:string){const c=this.ctx(),hash=await hex(clean(code,200));const rows=await this.repo.listWorkspaceRecords(c.tenantId,'GROWTH.REFERRAL');return rows.find(x=>x.data.kind==='SHARE'&&x.data.codeHash===hash);}
  async registerLanding(code:string){
    const c=this.ctx(),share=await this.findShare(code);if(!share)throw new Error('REFERRAL_LINK_NOT_FOUND');if(share.createdBy===c.actorId)throw new Error('SELF_REFERRAL_NOT_ALLOWED');
    const id='reflead_'+encodeURIComponent(share.id+'|'+c.actorId),existing=await this.repo.getWorkspaceRecord(c.tenantId,id);if(existing)return existing;
    const at=now(),lead:WorkspaceRecord={id,tenantId:c.tenantId,moduleId:'GROWTH.REFERRAL',title:'Lead direct',status:'ACTIVE',tags:['referral','lead'],data:{kind:'LEAD',shareId:share.id,referrerAccountId:share.createdBy,referredAccountId:c.actorId,targetKind:String(share.data.targetKind),targetId:String(share.data.targetId),campaignId:String(share.data.campaignId??''),landedAt:at},createdBy:c.actorId,createdAt:at,updatedAt:at};
    await this.repo.saveWorkspaceRecord(lead);await this.repo.saveWorkspaceRecord({...share,data:{...share.data,receivedCount:Number(share.data.receivedCount??0)+1,leadCount:Number(share.data.leadCount??0)+1},updatedAt:at});return lead;
  }
  async registerConversion(input:{code:string;kind:ReferralConversionKind;eventRef:Id;evidenceSummary:string}){
    const c=this.ctx(),share=await this.findShare(input.code);if(!share)throw new Error('REFERRAL_LINK_NOT_FOUND');if(share.createdBy===c.actorId)throw new Error('SELF_REFERRAL_NOT_ALLOWED');
    const leadId='reflead_'+encodeURIComponent(share.id+'|'+c.actorId),lead=await this.repo.getWorkspaceRecord(c.tenantId,leadId);if(!lead)throw new Error('REFERRAL_LEAD_REQUIRED');
    const id='refconversion_'+encodeURIComponent(share.id+'|'+c.actorId+'|'+input.kind+'|'+input.eventRef),existing=await this.repo.getWorkspaceRecord(c.tenantId,id);if(existing)return{conversion:existing,rewardReserved:Boolean(existing.data.rewardReserved),rewardAmount:Number(existing.data.rewardAmount??0)};
    const at=now(),campaignId=String(share.data.campaignId??''),evidence=clean(input.evidenceSummary,700);if(!evidence)throw new Error('EVIDENCE_SUMMARY_REQUIRED');
    let rewardReserved=false,rewardAmount=0;if(campaignId){const reserved=await this.budgets.reserve(campaignId,id);rewardReserved=reserved.reserved;rewardAmount=reserved.amount;}
    const conversion:WorkspaceRecord={id,tenantId:c.tenantId,moduleId:'GROWTH.REFERRAL',title:'Conversion directe vérifiée',status:'DONE',tags:['referral','conversion','direct-only'],data:{kind:'CONVERSION',shareId:share.id,referrerAccountId:share.createdBy,referredAccountId:c.actorId,targetKind:String(share.data.targetKind),targetId:String(share.data.targetId),campaignId,eventKind:input.kind,eventRef:input.eventRef,evidenceSummary:evidence,rewardReserved,rewardAmount,verifiedAt:at,multiLevel:false},createdBy:c.actorId,createdAt:at,updatedAt:at};
    await this.repo.saveWorkspaceRecord(conversion);await this.repo.saveWorkspaceRecord({...share,data:{...share.data,conversionCount:Number(share.data.conversionCount??0)+1},updatedAt:at});return{conversion,rewardReserved,rewardAmount};
  }
  async approveReward(campaignId:Id,conversionId:Id){
    const c=this.ctx(),campaign=await this.repo.getWorkspaceRecord(c.tenantId,campaignId);if(!campaign||campaign.createdBy!==c.actorId)throw new Error('REFERRAL_CAMPAIGN_NOT_FOUND');
    const conversion=await this.repo.getWorkspaceRecord(c.tenantId,conversionId);if(!conversion||String(conversion.data.campaignId)!==campaignId)throw new Error('REFERRAL_CONVERSION_NOT_FOUND');
    const budget=await this.budgets.approve(campaignId,conversionId),next={...conversion,data:{...conversion.data,rewardState:'APPROVED_SANDBOX'},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return{conversion:next,budget};
  }
  async dashboard(){
    const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,'GROWTH.REFERRAL'),mine=rows.filter(x=>x.createdBy===c.actorId),campaigns=mine.filter(x=>x.data.kind==='CAMPAIGN');
    return{shares:mine.filter(x=>x.data.kind==='SHARE'),leads:rows.filter(x=>x.data.kind==='LEAD'&&x.data.referrerAccountId===c.actorId),conversions:rows.filter(x=>x.data.kind==='CONVERSION'&&x.data.referrerAccountId===c.actorId),campaigns:await Promise.all(campaigns.map(async record=>({record,budget:await this.budgets.snapshot(record.id)})))};
  }
}
