import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {BusinessStudioService} from '../../business-studio/src/index.js';
import type {CommunityService} from '../../community/src/index.js';

const now=()=>new Date().toISOString();
const clean=(v:unknown,n=2000)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const allowedEvidence=new Set(['PRACTICE','PORTFOLIO','COMPLETED_ORDER','EVALUATION']);

export class CreatorTalentService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public business:BusinessStudioService,public community:CommunityService){}
  private ctx(){return this.kernel.context.get();}
  private async businessRows(){
    const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId)).filter(r=>r.createdBy===c.actorId&&r.tags.includes('business-studio'));
  }
  private async creatorRecord(id:Id){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!=='CREATOR.STUDIO')throw Error('CREATOR_CONTENT_NOT_FOUND');return r;
  }
  private async ownerContent(id:Id){const c=this.ctx(),r=await this.creatorRecord(id);if(r.createdBy!==c.actorId)throw Error('FORBIDDEN_SCOPE');return r;}
  async createContent(input:{title:string;body:string;offerId?:Id;groupId?:Id;hubId?:Id}){
    const c=this.ctx(),title=clean(input.title,180),body=clean(input.body,5000);if(!title||!body)throw Error('CREATOR_CONTENT_REQUIRED');
    if(input.offerId){const offer=(await this.businessRows()).find(r=>r.id===input.offerId&&r.data.businessKind==='OFFER');if(!offer)throw Error('CREATOR_OFFER_NOT_FOUND');}
    let postId='',state:'DRAFT'|'PUBLISHED'='DRAFT';
    if(input.groupId||input.hubId){if(!input.groupId||!input.hubId)throw Error('CREATOR_GROUP_AND_HUB_REQUIRED');const post=await this.community.createPost(input.groupId,{hubId:input.hubId,kind:input.offerId?'OFFER':'ANNOUNCEMENT',title,body});postId=post.id;state='PUBLISHED';}
    const stamp=now(),r:WorkspaceRecord={id:makeId('creator_content'),tenantId:c.tenantId,groupId:input.groupId,moduleId:'CREATOR.STUDIO',title,summary:body,status:'ACTIVE',tags:['creator-studio','content','state:'+state],data:{creatorKind:'CONTENT',contentState:state,offerId:input.offerId??'',hubId:input.hubId??'',communityPostId:postId,interestCount:0,conversationCount:0,actionCount:0,canonicalTransactionOnly:true,incomePromise:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'CREATOR_CONTENT_CREATED',targetType:'creator_content',targetId:r.id,requestId:c.requestId,metadata:{state,offerId:input.offerId??'',communityPostId:postId}}));return r;
  }
  async publishContent(id:Id,input:{groupId:Id;hubId:Id}){
    const c=this.ctx(),r=await this.ownerContent(id);if(String(r.data.contentState)==='PUBLISHED')return r;
    const post=await this.community.createPost(input.groupId,{hubId:input.hubId,kind:r.data.offerId?'OFFER':'ANNOUNCEMENT',title:r.title,body:r.summary??''});
    const next={...r,groupId:input.groupId,tags:['creator-studio','content','state:PUBLISHED'],data:{...r.data,contentState:'PUBLISHED',hubId:input.hubId,communityPostId:post.id},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'CREATOR_CONTENT_PUBLISHED',targetType:'creator_content',targetId:id,requestId:c.requestId,metadata:{groupId:input.groupId,hubId:input.hubId,communityPostId:post.id}}));return next;
  }
  async recordInterest(id:Id,note=''){
    const c=this.ctx(),content=await this.creatorRecord(id);if(String(content.data.contentState)!=='PUBLISHED')throw Error('CREATOR_CONTENT_NOT_PUBLIC');
    if(content.createdBy===c.actorId)throw Error('CREATOR_SELF_INTEREST_NOT_ALLOWED');
    if(content.groupId){const group=await this.repo.getGroup(c.tenantId,content.groupId);if(!group)throw Error('GROUP_NOT_FOUND');if(group.createdBy!==c.actorId){const m=(await this.repo.listMemberships(c.tenantId,content.groupId)).find(x=>x.userId===c.actorId&&x.status==='active');if(!m)throw Error('FORBIDDEN_SCOPE');}}
    const existing=(await this.repo.listWorkspaceRecords(c.tenantId,'CREATOR.STUDIO',content.groupId)).find(x=>x.data.creatorKind==='INTEREST'&&x.data.contentId===id&&x.createdBy===c.actorId&&x.status!=='ARCHIVED');if(existing)return existing;
    const stamp=now(),interest:WorkspaceRecord={id:makeId('creator_interest'),tenantId:c.tenantId,groupId:content.groupId,moduleId:'CREATOR.STUDIO',title:'Intérêt · '+content.title,summary:clean(note,800),status:'ACTIVE',tags:['creator-studio','interest'],data:{creatorKind:'INTEREST',contentId:id,creatorActorId:content.createdBy,interestState:'OPEN',conversationRef:'',actionRef:'',privateContactShared:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(interest);
    const count=(await this.repo.listWorkspaceRecords(c.tenantId,'CREATOR.STUDIO',content.groupId)).filter(x=>x.data.creatorKind==='INTEREST'&&x.data.contentId===id&&x.status!=='ARCHIVED').length;
    await this.repo.saveWorkspaceRecord({...content,data:{...content.data,interestCount:count},updatedAt:stamp});return interest;
  }
  async startConversation(contentId:Id,interestId:Id,input:{groupId:Id;hubId:Id;body:string}){
    const c=this.ctx(),content=await this.ownerContent(contentId),interest=await this.repo.getWorkspaceRecord(c.tenantId,interestId);if(!interest||interest.data.creatorKind!=='INTEREST'||interest.data.contentId!==contentId)throw Error('CREATOR_INTEREST_NOT_FOUND');
    if(input.groupId!==content.groupId)throw Error('CREATOR_CONVERSATION_GROUP_MISMATCH');
    const body=clean(input.body,3000);if(!body)throw Error('CREATOR_CONVERSATION_REQUIRED');
    const post=await this.community.createPost(input.groupId,{hubId:input.hubId,kind:'DISCUSSION',title:'Conversation · '+content.title,body});
    const next={...interest,data:{...interest.data,interestState:'CONVERSATION',conversationRef:post.id},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveWorkspaceRecord({...content,data:{...content.data,conversationCount:Number(content.data.conversationCount??0)+1},updatedAt:now()});return{interest:next,post};
  }
  async createCanonicalAction(contentId:Id,interestId:Id,input:{clientName:string;need:string;estimatedBudget?:number}){
    const c=this.ctx(),content=await this.ownerContent(contentId),interest=await this.repo.getWorkspaceRecord(c.tenantId,interestId);if(!interest||interest.data.creatorKind!=='INTEREST'||interest.data.contentId!==contentId)throw Error('CREATOR_INTEREST_NOT_FOUND');
    const client=await this.business.createClient({name:clean(input.clientName,180)||'Contact Creator',type:'PERSON',consentToContact:true});
    const request=await this.business.createRequest({title:'Creator · '+content.title,need:clean(input.need,2000)||content.summary||content.title,clientId:client.id,estimatedBudget:input.estimatedBudget,source:'CREATOR.STUDIO'});
    const next={...interest,data:{...interest.data,interestState:'ACTION',actionRef:request.id,clientRef:client.id},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    await this.repo.saveWorkspaceRecord({...content,data:{...content.data,actionCount:Number(content.data.actionCount??0)+1},updatedAt:now()});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'CREATOR_INTEREST_TO_BUSINESS_REQUEST',targetType:'creator_content',targetId:contentId,requestId:c.requestId,metadata:{businessRequestId:request.id,clientId:client.id}}));return{interest:next,client,request};
  }
  async myCreatorStudio(){
    const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,'CREATOR.STUDIO');const mine=rows.filter(r=>r.createdBy===c.actorId||r.data.creatorActorId===c.actorId);
    return{content:mine.filter(r=>r.data.creatorKind==='CONTENT'&&r.createdBy===c.actorId),interests:mine.filter(r=>r.data.creatorKind==='INTEREST')};
  }

  async addTalentEvidence(input:{kind:'PRACTICE'|'PORTFOLIO'|'COMPLETED_ORDER'|'EVALUATION';title:string;evidenceRef:string;businessOrderId?:Id;rating?:number}){
    const c=this.ctx();if(!allowedEvidence.has(input.kind))throw Error('INVALID_TALENT_EVIDENCE_KIND');const title=clean(input.title,200),evidenceRef=clean(input.evidenceRef,500);if(!title||!evidenceRef)throw Error('TALENT_EVIDENCE_REQUIRED');
    let orderState='';if(input.kind==='COMPLETED_ORDER'){if(!input.businessOrderId)throw Error('TALENT_ORDER_REQUIRED');const order=(await this.businessRows()).find(r=>r.id===input.businessOrderId&&r.data.businessKind==='ORDER');if(!order||String(order.data.orderState)!=='DELIVERED')throw Error('TALENT_ORDER_NOT_DELIVERED');orderState='DELIVERED';}
    if(input.kind==='EVALUATION'&&(input.rating===undefined||!Number.isFinite(Number(input.rating))||Number(input.rating)<1||Number(input.rating)>5))throw Error('INVALID_TALENT_RATING');
    const stamp=now(),r:WorkspaceRecord={id:makeId('talent_evidence'),tenantId:c.tenantId,moduleId:'LEARNING.TALENT',title,status:'DONE',tags:['talent','evidence','kind:'+input.kind.toLowerCase()],data:{talentKind:'EVIDENCE',evidenceKind:input.kind,evidenceRef,businessOrderId:input.businessOrderId??'',orderState,rating:input.rating??0,verifiedByCanonicalOwner:input.kind==='COMPLETED_ORDER',incomePromise:false,grantsPermission:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(r);return r;
  }
  async talentProfile(){
    const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId),academy=rows.filter(r=>r.moduleId==='LEARNING.MANAGER_ACADEMY'&&r.createdBy===c.actorId),evidence=rows.filter(r=>r.moduleId==='LEARNING.TALENT'&&r.createdBy===c.actorId&&r.data.talentKind==='EVIDENCE'),biz=rows.filter(r=>r.createdBy===c.actorId&&r.tags.includes('business-studio'));
    const certificates=academy.filter(r=>r.data.kind==='CERTIFICATE'&&r.status==='DONE'),offers=biz.filter(r=>r.data.businessKind==='OFFER'&&r.data.offerState==='ACTIVE'),delivered=biz.filter(r=>r.data.businessKind==='ORDER'&&r.data.orderState==='DELIVERED'),earned=biz.filter(r=>(r.data.businessKind==='PAYMENT'||r.data.businessKind==='REVENUE')&&Number(r.data.amount??0)>0);
    const proved=evidence.length>0||certificates.length>0,worked=delivered.length>0||evidence.some(r=>r.data.evidenceKind==='COMPLETED_ORDER');
    return{learn:{complete:certificates.length>0,certificates},prove:{complete:proved,evidence},work:{complete:worked,deliveredOrders:delivered},earn:{complete:earned.length>0,confirmedBusinessReceipts:earned},offers,guardrails:{incomePromise:false,certificateGrantsRole:false,collectiveMoneyUsed:false,canonicalBusinessOwner:true}};
  }
}
