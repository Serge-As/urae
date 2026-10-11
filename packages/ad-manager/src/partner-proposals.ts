import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import {AdManagerService,type AdObjective} from './index.js';

const MODULE='ADS.PARTNER_PROPOSAL';
export type ProposalState='SUBMITTED'|'REJECTED'|'IMPORTED';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const clean=(v:unknown,max:number)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,max);
const objectives=new Set<AdObjective>(['AWARENESS','COMMUNITY_JOIN','EVENT_RSVP','DEAL_OPEN','GROUP_BUY','LEAD','PARTNER_PROGRAM']);
const safeRef=(value:string)=>/^(?:[a-z][a-z0-9-]{1,42}:[a-zA-Z0-9_-]{1,110}|\/[^/][^\s]{0,160})$/.test(value);
export class PartnerAdProposalService{
  constructor(readonly repo:PlatformRepository,readonly kernel:PlatformKernel,readonly ads:AdManagerService){}
  private async access(groupId:string,managerOnly=false){
    const c=this.kernel.context.get(),group=await this.repo.getGroup(c.tenantId,groupId);
    if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===c.actorId)return true;
    const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m)throw Error('FORBIDDEN_SCOPE');
    const manager=m.roles.some(x=>managers.has(x));
    if(managerOnly&&!manager)throw Error('FORBIDDEN_SCOPE');
    return manager;
  }
  async list(groupId:string){
    const manager=await this.access(groupId),c=this.kernel.context.get();
    const records=await this.repo.listWorkspaceRecords(c.tenantId,MODULE,groupId);
    return records.filter(r=>manager||r.createdBy===c.actorId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }
  private async checkOwnedImage(groupId:string,imageId:string,ownerId:string){
    if(!imageId)return;
    const c=this.kernel.context.get(),media=await this.repo.getWorkspaceRecord(c.tenantId,imageId);
    if(!media||media.groupId!==groupId||media.moduleId!=='MEDIA.VISUAL_ASSET'||
      media.data.purpose!=='PARTNER_CREATIVE'||media.createdBy!==ownerId||media.status!=='ACTIVE')
      throw Error('PARTNER_AD_MEDIA_OWNER_MISMATCH');
  }
  async create(groupId:string,input:{title:string;headline:string;body:string;callToAction:string;destinationRef:string;objective:AdObjective;mediaAssetId?:string;locality?:string}){
    await this.access(groupId);
    const c=this.kernel.context.get(),stamp=new Date().toISOString();
    const title=clean(input.title,140),headline=clean(input.headline,120),body=clean(input.body,1000),
      callToAction=clean(input.callToAction,60),destinationRef=clean(input.destinationRef,200),locality=clean(input.locality,100),
      mediaAssetId=clean(input.mediaAssetId,120),objective=input.objective;
    if(!title||!headline||!body||!callToAction||!safeRef(destinationRef)||!objectives.has(objective))throw Error('INVALID_PARTNER_AD_PROPOSAL');
    await this.checkOwnedImage(groupId,mediaAssetId,c.actorId);
    const record:WorkspaceRecord={id:makeId('partner_ad'),tenantId:c.tenantId,groupId,moduleId:MODULE,title,summary:headline,
      status:'ACTIVE',tags:['ads','proposal','SUBMITTED'],data:{proposalState:'SUBMITTED',headline,body,callToAction,destinationRef,objective,locality,mediaAssetId,reviewNote:'',campaignId:''},
      createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'PARTNER_AD_PROPOSED',
      targetType:'partner_ad',targetId:record.id,requestId:c.requestId,metadata:{groupId,objective,hasImage:Boolean(mediaAssetId)}}));
    return record;
  }
  async review(groupId:string,id:string,decision:'REJECT'|'IMPORT',note=''){
    await this.access(groupId,true);
    const c=this.kernel.context.get(),row=await this.repo.getWorkspaceRecord(c.tenantId,id);
    if(!row||row.groupId!==groupId||row.moduleId!==MODULE)throw Error('PARTNER_AD_NOT_FOUND');
    const state=String(row.data.proposalState);
    if(state==='IMPORTED'&&decision==='IMPORT')return row;
    if(state!=='SUBMITTED')throw Error('INVALID_PARTNER_AD_TRANSITION');
    if(decision==='IMPORT')await this.checkOwnedImage(groupId,String(row.data.mediaAssetId??''),row.createdBy);
    // No self-approval: the submitter cannot also be their own reviewing manager.
    if(row.createdBy===c.actorId)throw Error('PARTNER_AD_SELF_REVIEW_FORBIDDEN');
    const stamp=new Date().toISOString(),reviewNote=clean(note,500);
    if(decision==='REJECT'&&!reviewNote)throw Error('REVIEW_REASON_REQUIRED');
    let campaignId='';
    if(decision==='IMPORT'){
      // The canonical AdManager alone creates a DRAFT sandbox campaign. This
      // operation NEVER approves, charges, activates or sends advertising.
      const objective=String(row.data.objective) as AdObjective;
      const asset=clean(row.data.mediaAssetId,120);
      const campaign=await this.ads.create(groupId,{name:row.title,objective,budgetSandbox:0,currency:'XAF',placements:['FEED'],
        frequencyCapPer7Days:3,targeting:row.data.locality?{localities:[clean(row.data.locality,100)]}:{},
        creative:{headline:String(row.data.headline),body:String(row.data.body),callToAction:String(row.data.callToAction),
          destinationRef:String(row.data.destinationRef),...(asset?{mediaAssetId:asset}:{})}});
      campaignId=campaign.id;
    }
    const nextState:ProposalState=decision==='IMPORT'?'IMPORTED':'REJECTED';
    const updated={...row,data:{...row.data,proposalState:nextState,reviewNote,campaignId},
      status:nextState==='REJECTED'?'ARCHIVED' as const:'DONE' as const,
      tags:['ads','proposal',nextState],updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(updated);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'PARTNER_AD_REVIEWED',
      targetType:'partner_ad',targetId:id,requestId:c.requestId,metadata:{groupId,decision,campaignId:campaignId||null}}));
    return updated;
  }
}
