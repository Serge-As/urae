import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

type CommunityKind='HUB'|'POST';
export type CommunityVisibility='GROUP_PRIVATE'|'PLATFORM_PUBLIC';
export type CommunityPostKind='DISCUSSION'|'ANNOUNCEMENT'|'OFFER'|'REQUEST';
export interface CommunityRecord extends WorkspaceRecord{data:WorkspaceRecord['data']&{communityKind:CommunityKind;version:number};}

const managers=new Set(['founder','manager','admin','president','treasurer','moderator']);
const now=()=>new Date().toISOString();

export class CommunityService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private async access(groupId:Id,manage=false):Promise<{membership?:Membership;manager:boolean}>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return{manager:true};
    const membership=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!membership)throw Error('FORBIDDEN_SCOPE');
    const manager=membership.roles.some(r=>managers.has(r));if(manage&&!manager)throw Error('FORBIDDEN_SCOPE');return{membership,manager};
  }
  private async records(groupId:Id,kind?:CommunityKind){
    await this.access(groupId);const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)).filter(r=>r.tags.includes('community-engine')&&(!kind||r.data.communityKind===kind)) as CommunityRecord[];
  }
  async createHub(groupId:Id,input:{title:string;about?:string;visibility?:CommunityVisibility;tags?:string[];federatedGroupCodes?:string[]}){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),title=input.title.trim();if(!title)throw Error('COMMUNITY_TITLE_REQUIRED');
    const stamp=now(),visibility=input.visibility??'GROUP_PRIVATE',tags=[...new Set((input.tags??[]).map(x=>x.trim().toLowerCase()).filter(Boolean))].slice(0,20);
    const federated=[...new Set((input.federatedGroupCodes??[]).map(x=>x.trim().toUpperCase()).filter(Boolean))].slice(0,50);
    const record:CommunityRecord={id:makeId('community_hub'),tenantId:ctx.tenantId,groupId,moduleId:'COMMUNITY.PRO_HUBS',title,summary:input.about?.trim().slice(0,1000),status:'ACTIVE',tags:['community-engine','kind:HUB',...tags.map(x=>'topic:'+x)],data:{communityKind:'HUB',version:1,visibility,tagsJson:JSON.stringify(tags),federatedGroupCodesJson:JSON.stringify(federated),moderation:'GOVERNED'},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'COMMUNITY_HUB_CREATED',targetType:'community_hub',targetId:record.id,requestId:ctx.requestId,metadata:{groupId,visibility}}));return record;
  }
  async listHubs(groupId:Id){return this.records(groupId,'HUB');}
  async createPost(groupId:Id,input:{hubId:Id;kind?:CommunityPostKind;body:string;title?:string}){
    const ctx=this.kernel.context.get();await this.access(groupId);const hubs=await this.records(groupId,'HUB'),hub=hubs.find(x=>x.id===input.hubId);if(!hub)throw Error('COMMUNITY_HUB_NOT_FOUND');
    const body=input.body.trim();if(!body)throw Error('COMMUNITY_POST_REQUIRED');if(body.length>5000)throw Error('COMMUNITY_POST_TOO_LONG');
    const kind=input.kind??'DISCUSSION';if(!['DISCUSSION','ANNOUNCEMENT','OFFER','REQUEST'].includes(kind))throw Error('INVALID_COMMUNITY_POST_KIND');
    const stamp=now(),record:CommunityRecord={id:makeId('community_post'),tenantId:ctx.tenantId,groupId,moduleId:kind==='OFFER'||kind==='REQUEST'?'COMMUNITY.MICRO_ADS':'COMMUNITY.FORUM',title:input.title?.trim().slice(0,160)||kind,summary:body,status:'ACTIVE',tags:['community-engine','kind:POST','hub:'+hub.id,'post-kind:'+kind],data:{communityKind:'POST',version:1,hubId:hub.id,postKind:kind,moderationState:'PUBLISHED',authorId:ctx.actorId},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  async listPosts(groupId:Id,hubId:Id){
    const access=await this.access(groupId),posts=await this.records(groupId,'POST');
    return posts.filter(x=>x.data.hubId===hubId&&(access.manager||x.data.moderationState==='PUBLISHED')).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }
  async moderate(groupId:Id,postId:Id,state:'PUBLISHED'|'HIDDEN',reason:string){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),post=(await this.records(groupId,'POST')).find(x=>x.id===postId);if(!post)throw Error('COMMUNITY_POST_NOT_FOUND');
    if(!reason.trim())throw Error('MODERATION_REASON_REQUIRED');
    const next:CommunityRecord={...post,data:{...post.data,moderationState:state,moderationReason:reason.trim(),moderatedBy:ctx.actorId,version:Number(post.data.version??1)+1},updatedAt:now()};
    await this.repo.saveWorkspaceRecord(next);await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'COMMUNITY_POST_MODERATED',targetType:'community_post',targetId:postId,requestId:ctx.requestId,metadata:{state,reason:reason.trim()}}));return next;
  }
  async federationProfile(groupId:Id,hubId:Id){
    const hub=(await this.records(groupId,'HUB')).find(x=>x.id===hubId);if(!hub)throw Error('COMMUNITY_HUB_NOT_FOUND');
    return{hubId:hub.id,title:hub.title,visibility:hub.data.visibility,tags:JSON.parse(String(hub.data.tagsJson??'[]')),federatedGroupCodes:JSON.parse(String(hub.data.federatedGroupCodesJson??'[]')),safeProjection:true};
  }
}
