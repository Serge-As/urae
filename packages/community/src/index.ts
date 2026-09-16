import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

type CommunityKind='HUB'|'POST'|'COMMENT'|'REACTION'|'CURSOR'|'DRAFT';
export type CommunityVisibility='GROUP_PRIVATE'|'PLATFORM_PUBLIC';
export type CommunityPostKind='DISCUSSION'|'ANNOUNCEMENT'|'OFFER'|'REQUEST';
export type CommunityReaction='LIKE'|'LOVE'|'CELEBRATE'|'INSIGHTFUL';
export interface CommunityRecord extends WorkspaceRecord{data:WorkspaceRecord['data']&{communityKind:CommunityKind;version:number};}

const managers=new Set(['founder','manager','admin','president','treasurer','moderator']);
const now=()=>new Date().toISOString();
const clean=(v:unknown,max=5000)=>String(v??'').trim().slice(0,max);

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
  private async hub(groupId:Id,hubId:Id){
    const hub=(await this.records(groupId,'HUB')).find(x=>x.id===hubId);if(!hub)throw Error('COMMUNITY_HUB_NOT_FOUND');return hub;
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
    const ctx=this.kernel.context.get();await this.access(groupId);await this.hub(groupId,input.hubId);
    const body=input.body.trim();if(!body)throw Error('COMMUNITY_POST_REQUIRED');if(body.length>10000)throw Error('COMMUNITY_POST_TOO_LONG');
    const kind=input.kind??'DISCUSSION';if(!['DISCUSSION','ANNOUNCEMENT','OFFER','REQUEST'].includes(kind))throw Error('INVALID_COMMUNITY_POST_KIND');
    const stamp=now(),record:CommunityRecord={id:makeId('community_post'),tenantId:ctx.tenantId,groupId,moduleId:kind==='OFFER'||kind==='REQUEST'?'COMMUNITY.MICRO_ADS':'COMMUNITY.FORUM',title:input.title?.trim().slice(0,160)||kind,summary:body,status:'ACTIVE',tags:['community-engine','kind:POST','hub:'+input.hubId,'post-kind:'+kind],data:{communityKind:'POST',version:1,hubId:input.hubId,postKind:kind,moderationState:'PUBLISHED',authorId:ctx.actorId},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    const draft=(await this.records(groupId,'DRAFT')).find(x=>x.data.hubId===input.hubId&&x.createdBy===ctx.actorId&&x.status==='DRAFT');
    if(draft)await this.repo.saveWorkspaceRecord({...draft,status:'ARCHIVED',summary:'',data:{...draft.data,body:'',draftTitle:'',version:Number(draft.data.version??1)+1},updatedAt:stamp});
    return record;
  }
  async listPosts(groupId:Id,hubId:Id){
    const access=await this.access(groupId),posts=await this.records(groupId,'POST');
    return posts.filter(x=>x.data.hubId===hubId&&(access.manager||x.data.moderationState==='PUBLISHED')).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
  }

  async saveDraft(groupId:Id,hubId:Id,input:{body?:string;title?:string;kind?:CommunityPostKind}){
    const ctx=this.kernel.context.get();await this.access(groupId);await this.hub(groupId,hubId);
    const body=String(input.body??'').slice(0,10000),title=String(input.title??'').slice(0,160),kind=input.kind??'DISCUSSION';
    if(!['DISCUSSION','ANNOUNCEMENT','OFFER','REQUEST'].includes(kind))throw Error('INVALID_COMMUNITY_POST_KIND');
    const existing=(await this.records(groupId,'DRAFT')).find(x=>x.data.hubId===hubId&&x.createdBy===ctx.actorId&&x.status==='DRAFT'),stamp=now();
    const record:CommunityRecord=existing?{...existing,title:'Draft · '+hubId,summary:body,status:'DRAFT',data:{...existing.data,body,draftTitle:title,postKind:kind,version:Number(existing.data.version??1)+1},updatedAt:stamp}:{id:makeId('community_draft'),tenantId:ctx.tenantId,groupId,moduleId:'COMMUNITY.FORUM',title:'Draft · '+hubId,summary:body,status:'DRAFT',tags:['community-engine','kind:DRAFT','hub:'+hubId],data:{communityKind:'DRAFT',version:1,hubId,body,draftTitle:title,postKind:kind,authorId:ctx.actorId},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return{hubId,body,draftTitle:title,postKind:kind,updatedAt:record.updatedAt,version:Number(record.data.version??1)};
  }
  async draft(groupId:Id,hubId:Id){
    const ctx=this.kernel.context.get();await this.access(groupId);
    const r=(await this.records(groupId,'DRAFT')).filter(x=>x.data.hubId===hubId&&x.createdBy===ctx.actorId&&x.status==='DRAFT').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
    return r?{hubId,body:r.summary??'',draftTitle:String(r.data.draftTitle??''),postKind:String(r.data.postKind??'DISCUSSION'),updatedAt:r.updatedAt,version:Number(r.data.version??1)}:null;
  }

  async markRead(groupId:Id,hubId:Id,anchorPostId:Id){
    const ctx=this.kernel.context.get();await this.access(groupId);const posts=await this.listPosts(groupId,hubId),anchor=posts.find(x=>x.id===anchorPostId);if(!anchor)throw Error('COMMUNITY_POST_NOT_FOUND');
    const existing=(await this.records(groupId,'CURSOR')).find(x=>x.data.hubId===hubId&&x.createdBy===ctx.actorId),stamp=now();
    const record:CommunityRecord=existing?{...existing,status:'ACTIVE',data:{...existing.data,anchorPostId,anchorCreatedAt:anchor.createdAt,version:Number(existing.data.version??1)+1},updatedAt:stamp}:{id:makeId('community_cursor'),tenantId:ctx.tenantId,groupId,moduleId:'COMMUNITY.FORUM',title:'Read cursor · '+hubId,status:'ACTIVE',tags:['community-engine','kind:CURSOR','hub:'+hubId],data:{communityKind:'CURSOR',version:1,hubId,anchorPostId,anchorCreatedAt:anchor.createdAt,authorId:ctx.actorId},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return{hubId,anchorPostId,anchorCreatedAt:anchor.createdAt,updatedAt:stamp};
  }
  async cursor(groupId:Id,hubId:Id){
    const ctx=this.kernel.context.get();await this.access(groupId);const r=(await this.records(groupId,'CURSOR')).find(x=>x.data.hubId===hubId&&x.createdBy===ctx.actorId);
    return r?{hubId,anchorPostId:String(r.data.anchorPostId??''),anchorCreatedAt:String(r.data.anchorCreatedAt??''),updatedAt:r.updatedAt}:null;
  }

  async react(groupId:Id,postId:Id,reaction:CommunityReaction){
    const ctx=this.kernel.context.get();await this.access(groupId);if(!['LIKE','LOVE','CELEBRATE','INSIGHTFUL'].includes(reaction))throw Error('INVALID_COMMUNITY_REACTION');
    const post=(await this.records(groupId,'POST')).find(x=>x.id===postId);if(!post)throw Error('COMMUNITY_POST_NOT_FOUND');
    const existing=(await this.records(groupId,'REACTION')).find(x=>x.data.postId===postId&&x.createdBy===ctx.actorId&&x.data.reaction===reaction),stamp=now();
    const active=existing?!Boolean(existing.data.active):true;
    const record:CommunityRecord=existing?{...existing,status:active?'ACTIVE':'ARCHIVED',data:{...existing.data,active,version:Number(existing.data.version??1)+1},updatedAt:stamp}:{id:makeId('community_reaction'),tenantId:ctx.tenantId,groupId,moduleId:'COMMUNITY.FORUM',title:reaction,status:'ACTIVE',tags:['community-engine','kind:REACTION','post:'+postId],data:{communityKind:'REACTION',version:1,postId,reaction,active:true,authorId:ctx.actorId},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return{postId,reaction,active};
  }
  async createComment(groupId:Id,postId:Id,body:string,parentCommentId?:Id){
    const ctx=this.kernel.context.get();await this.access(groupId);const post=(await this.records(groupId,'POST')).find(x=>x.id===postId);if(!post)throw Error('COMMUNITY_POST_NOT_FOUND');
    const text=clean(body,5000);if(!text)throw Error('COMMUNITY_COMMENT_REQUIRED');
    if(parentCommentId){const parent=(await this.records(groupId,'COMMENT')).find(x=>x.id===parentCommentId&&x.data.postId===postId);if(!parent)throw Error('COMMUNITY_COMMENT_NOT_FOUND');}
    const stamp=now(),r:CommunityRecord={id:makeId('community_comment'),tenantId:ctx.tenantId,groupId,moduleId:'COMMUNITY.FORUM',title:'Commentaire',summary:text,status:'ACTIVE',tags:['community-engine','kind:COMMENT','post:'+postId],data:{communityKind:'COMMENT',version:1,postId,parentCommentId:parentCommentId??null,authorId:ctx.actorId,moderationState:'PUBLISHED'},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(r);return r;
  }
  async engagement(groupId:Id,postId:Id){
    const ctx=this.kernel.context.get();await this.access(groupId);const records=await this.records(groupId),reactions=records.filter(x=>x.data.communityKind==='REACTION'&&x.data.postId===postId&&x.data.active===true),comments=records.filter(x=>x.data.communityKind==='COMMENT'&&x.data.postId===postId&&x.data.moderationState==='PUBLISHED').sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    const counts:Record<string,number>={LIKE:0,LOVE:0,CELEBRATE:0,INSIGHTFUL:0};for(const r of reactions)counts[String(r.data.reaction)]=(counts[String(r.data.reaction)]??0)+1;
    const mine=reactions.filter(x=>x.createdBy===ctx.actorId).map(x=>String(x.data.reaction));
    return{postId,reactions:counts,myReactions:mine,comments};
  }
  async timeline(groupId:Id,hubId:Id,limit=60){
    await this.hub(groupId,hubId);const posts=await this.listPosts(groupId,hubId),cursor=await this.cursor(groupId,hubId),draft=await this.draft(groupId,hubId),safeLimit=Math.max(10,Math.min(200,Math.trunc(limit)||60));
    let start=Math.max(0,posts.length-safeLimit);
    if(cursor?.anchorPostId){const idx=posts.findIndex(x=>x.id===cursor.anchorPostId);if(idx>=0)start=Math.max(0,Math.min(idx-10,posts.length-safeLimit));}
    const page=posts.slice(start,start+safeLimit),anchorIndex=cursor?.anchorPostId?posts.findIndex(x=>x.id===cursor.anchorPostId):-1,unreadCount=anchorIndex>=0?Math.max(0,posts.length-anchorIndex-1):posts.length;
    const engagementEntries=await Promise.all(page.map(async p=>[p.id,await this.engagement(groupId,p.id)] as const));const engagement=Object.fromEntries(engagementEntries);
    return{hubId,posts:page,total:posts.length,start,unreadCount,cursor,draft,engagement,hasBefore:start>0,hasAfter:start+page.length<posts.length};
  }

  async moderate(groupId:Id,postId:Id,state:'PUBLISHED'|'HIDDEN',reason:string){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),post=(await this.records(groupId,'POST')).find(x=>x.id===postId);if(!post)throw Error('COMMUNITY_POST_NOT_FOUND');
    if(!reason.trim())throw Error('MODERATION_REASON_REQUIRED');
    const next:CommunityRecord={...post,data:{...post.data,moderationState:state,moderationReason:reason.trim(),moderatedBy:ctx.actorId,version:Number(post.data.version??1)+1},updatedAt:now()};
    await this.repo.saveWorkspaceRecord(next);await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'COMMUNITY_POST_MODERATED',targetType:'community_post',targetId:postId,requestId:ctx.requestId,metadata:{state,reason:reason.trim()}}));return next;
  }
  async federationProfile(groupId:Id,hubId:Id){
    const hub=await this.hub(groupId,hubId);
    return{hubId:hub.id,title:hub.title,visibility:hub.data.visibility,tags:JSON.parse(String(hub.data.tagsJson??'[]')),federatedGroupCodes:JSON.parse(String(hub.data.federatedGroupCodesJson??'[]')),safeProjection:true};
  }
}
