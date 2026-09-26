import type { GroupDiscoveryMatch, GroupDiscoveryQuery, Id, MembershipApplication, PublicGroupListing, User, WorkspaceRecord } from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';
import type { PlatformRepository } from '../../repositories/src/index.js';
import { PlatformKernel } from '../../platform-kernel/src/index.js';
import { FoundationService } from '../../domain/src/index.js';

const now=()=>new Date().toISOString();
const MANAGER_ROLES=new Set(['founder','manager','admin','president','treasurer']);
const normalize=(v:string|undefined)=>String(v??'').trim().toLocaleLowerCase();
const tokens=(v:string|undefined)=>normalize(v).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

const PUBLIC_CANDIDATE_TENANT='__eco_public_candidate_projection__';
const cleanText=(v:unknown,max=240)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,max);
const cleanTags=(v:unknown)=>[...new Set((Array.isArray(v)?v:[]).map(x=>normalize(String(x))).filter(Boolean))].slice(0,24);
export interface PublicCandidateProfile {
  id:Id;displayAlias:string;locality?:string;skills:string[];interests:string[];desiredGroupTags:string[];
  bio?:string;availability?:string;updatedAt:string;
}
export interface CandidateSearchQuery {text?:string;locality?:string;tags?:string[];}
export interface CandidateMatch {candidate:PublicCandidateProfile;score:number;reasonCodes:string[];}
const candidateProjection=(row:WorkspaceRecord):PublicCandidateProfile=>({
  id:row.id,displayAlias:String(row.data.displayAlias??row.title),locality:row.data.locality?String(row.data.locality):undefined,
  skills:cleanTags(row.data.skills),interests:cleanTags(row.data.interests),desiredGroupTags:cleanTags(row.data.desiredGroupTags),
  bio:row.data.bio?String(row.data.bio):undefined,availability:row.data.availability?String(row.data.availability):undefined,updatedAt:row.updatedAt
});

const requireManager=async(repo:PlatformRepository,kernel:PlatformKernel,tenantId:Id,groupId:Id):Promise<void>=>{
  const ctx=kernel.context.get();
  if(ctx.tenantId!==tenantId) throw new Error('FORBIDDEN_SCOPE');
  const group=await repo.getGroup(tenantId,groupId); if(!group) throw new Error('GROUP_NOT_FOUND');
  if(group.createdBy===ctx.actorId) return;
  const membership=(await repo.listMemberships(tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
  if(!membership||!membership.roles.some(r=>MANAGER_ROLES.has(r))) throw new Error('FORBIDDEN_SCOPE');
};

export interface PublishGroupListingInput extends Omit<PublicGroupListing,'id'|'tenantId'|'name'|'family'|'publishedAt'|'updatedAt'> {
  tenantId: Id;
}

/** Public cross-tenant projection. It deliberately never reads member lists, balances or private contacts. */
export class DiscoveryService {
  constructor(private readonly repo:PlatformRepository,private readonly kernel:PlatformKernel){}

  async publishGroupListing(input:PublishGroupListingInput):Promise<PublicGroupListing>{
    await requireManager(this.repo,this.kernel,input.tenantId,input.groupId);
    if(input.visibility==='SECRET') throw new Error('SECRET_GROUP_NOT_DISCOVERABLE');
    const group=await this.repo.getGroup(input.tenantId,input.groupId); if(!group) throw new Error('GROUP_NOT_FOUND');
    const previous=await this.repo.getPublicGroupListing(group.id); const timestamp=now();
    const listing:PublicGroupListing={
      id:previous?.id??makeId('listing'),tenantId:group.tenantId,groupId:group.id,name:group.name,
      family:group.kind==='association'?'association':'rotating_tontine',visibility:input.visibility,
      discoverable:input.visibility==='PUBLIC'&&input.discoverable,joinPolicy:input.joinPolicy,recruiting:input.recruiting,
      locality:input.locality?.trim()||undefined,missionTags:[...new Set(input.missionTags.map(normalize).filter(Boolean))],
      activityTags:[...new Set(input.activityTags.map(normalize).filter(Boolean))],meetingMode:input.meetingMode,
      contributionBand:input.contributionBand,publicManagerAlias:input.publicManagerAlias?.trim()||undefined,
      publishedAt:previous?.publishedAt??timestamp,updatedAt:timestamp
    };
    await this.repo.savePublicGroupListing(listing);
    const audit=this.kernel.audit.append({tenantId:group.tenantId,actorId:this.kernel.context.get().actorId,action:'GROUP_DISCOVERY_LISTING_PUBLISHED',targetType:'group',targetId:group.id,after:{visibility:listing.visibility,discoverable:listing.discoverable,joinPolicy:listing.joinPolicy,recruiting:listing.recruiting,locality:listing.locality,missionTags:listing.missionTags,activityTags:listing.activityTags},requestId:this.kernel.context.get().requestId});
    await this.repo.saveAudit(audit);
    return structuredClone(listing);
  }

  async search(query:GroupDiscoveryQuery={}):Promise<GroupDiscoveryMatch[]>{
    const q=tokens(query.text); const locality=normalize(query.locality); const mission=new Set((query.missionTags??[]).map(normalize)); const activity=new Set((query.activityTags??[]).map(normalize));
    const results:GroupDiscoveryMatch[]=[];
    for(const listing of await this.repo.listPublicGroupListings()){
      if(!listing.discoverable||listing.visibility!=='PUBLIC') continue;
      if(query.recruitingOnly&& !listing.recruiting) continue;
      if(query.family&&listing.family!==query.family) continue;
      if(query.meetingMode&&listing.meetingMode&&listing.meetingMode!==query.meetingMode) continue;
      if(query.maxContribution&&listing.contributionBand?.currency===query.maxContribution.currency&&listing.contributionBand.min!==undefined&&listing.contributionBand.min>query.maxContribution.amount) continue;
      let score=1; const reasons:string[]=[]; const haystack=normalize([listing.name,listing.locality,...listing.missionTags,...listing.activityTags].filter(Boolean).join(' '));
      if(q.length){const hits=q.filter(x=>haystack.includes(x)).length;if(hits===0) continue;score+=hits*12;reasons.push('TEXT_MATCH');}
      if(locality&&normalize(listing.locality)===locality){score+=25;reasons.push('LOCALITY_MATCH');}
      const missionHits=listing.missionTags.filter(x=>mission.has(normalize(x))).length;if(mission.size&&missionHits===0) continue;if(missionHits){score+=missionHits*15;reasons.push('MISSION_AFFINITY');}
      const activityHits=listing.activityTags.filter(x=>activity.has(normalize(x))).length;if(activity.size&&activityHits===0) continue;if(activityHits){score+=activityHits*10;reasons.push('ACTIVITY_AFFINITY');}
      if(query.family){score+=8;reasons.push('GROUP_FAMILY_MATCH');}
      if(query.meetingMode&&listing.meetingMode===query.meetingMode){score+=6;reasons.push('MEETING_MODE_MATCH');}
      if(listing.recruiting){score+=5;reasons.push('RECRUITING');}
      results.push({listing:structuredClone(listing),score,reasonCodes:reasons});
    }
    return results.sort((a,b)=>b.score-a.score||a.listing.name.localeCompare(b.listing.name));
  }

  async candidateProfile():Promise<PublicCandidateProfile|undefined>{
    const ctx=this.kernel.context.get(),rows=await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO');
    const row=rows.find(x=>String(x.data.ownerActorId??'')===ctx.actorId&&x.status==='ACTIVE'&&Boolean(x.data.optIn));
    return row?candidateProjection(row):undefined;
  }

  async saveCandidateProfile(input:{displayAlias:string;locality?:string;skills?:string[];interests?:string[];desiredGroupTags?:string[];bio?:string;availability?:string;optIn:boolean}):Promise<PublicCandidateProfile|undefined>{
    const ctx=this.kernel.context.get(),user=await this.repo.getUser(ctx.actorId);if(!user)throw new Error('USER_NOT_FOUND');
    const rows=await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO');
    const existing=rows.find(x=>String(x.data.ownerActorId??'')===ctx.actorId),stamp=now(),alias=cleanText(input.displayAlias||user.displayName,80);
    if(!alias)throw new Error('CANDIDATE_ALIAS_REQUIRED');
    const record:WorkspaceRecord={
      id:existing?.id??makeId('candidate'),tenantId:PUBLIC_CANDIDATE_TENANT,moduleId:'MEMBERSHIP.PORTFOLIO',title:alias,
      status:input.optIn?'ACTIVE':'ARCHIVED',tags:['public-candidate','consent:'+(input.optIn?'yes':'no')],
      data:{ownerActorId:ctx.actorId,optIn:Boolean(input.optIn),displayAlias:alias,locality:cleanText(input.locality,120),skills:cleanTags(input.skills),interests:cleanTags(input.interests),desiredGroupTags:cleanTags(input.desiredGroupTags),bio:cleanText(input.bio,500),availability:cleanText(input.availability,120)},
      createdBy:ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp
    };
    await this.repo.saveWorkspaceRecord(record);
    const audit=this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'CANDIDATE_PUBLIC_PROFILE_UPDATED',targetType:'candidate_projection',targetId:record.id,after:{optIn:Boolean(input.optIn),locality:Boolean(record.data.locality),skillsCount:cleanTags(input.skills).length},requestId:ctx.requestId});await this.repo.saveAudit(audit);
    return input.optIn?candidateProjection(record):undefined;
  }

  async searchCandidates(targetTenantId:Id,groupId:Id,query:CandidateSearchQuery):Promise<CandidateMatch[]>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);
    const text=cleanText(query.text,120),q=tokens(text),locality=normalize(query.locality),wanted=new Set(cleanTags(query.tags));
    if((text&&text.length<2)||(!q.length&&!locality&&!wanted.size))throw new Error('DISCOVERY_QUERY_REQUIRED');
    const rows=await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO'),matches:CandidateMatch[]=[];
    for(const row of rows){
      if(row.status!=='ACTIVE'||!Boolean(row.data.optIn))continue;
      const c=candidateProjection(row),hay=normalize([c.displayAlias,c.locality,c.bio,...c.skills,...c.interests,...c.desiredGroupTags].filter(Boolean).join(' '));
      let score=0;const reasons:string[]=[];
      if(q.length){const hits=q.filter(x=>hay.includes(x)).length;if(!hits)continue;score+=Math.min(40,hits*12);reasons.push('TEXT_MATCH');}
      if(locality){if(normalize(c.locality)!==locality)continue;score+=30;reasons.push('LOCALITY_MATCH');}
      if(wanted.size){const pool=new Set([...c.skills,...c.interests,...c.desiredGroupTags].map(normalize)),hits=[...wanted].filter(x=>pool.has(x)).length;if(!hits)continue;score+=Math.min(30,hits*10);reasons.push('TAG_MATCH');}
      matches.push({candidate:c,score,reasonCodes:reasons});
    }
    return matches.sort((a,b)=>b.score-a.score||a.candidate.displayAlias.localeCompare(b.candidate.displayAlias)).slice(0,20);
  }

  async candidateFit(targetTenantId:Id,groupId:Id,candidateId:Id):Promise<{candidate:PublicCandidateProfile;score:number;reasonCodes:string[];advisoryOnly:true;contactShared:false}>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);
    const row=(await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO')).find(x=>x.id===candidateId&&x.status==='ACTIVE'&&Boolean(x.data.optIn));if(!row)throw new Error('CANDIDATE_NOT_FOUND');
    const candidate=candidateProjection(row),listing=await this.repo.getPublicGroupListing(groupId);let score=10;const reasons:string[]=['OPT_IN_CANDIDATE'];
    if(listing?.locality&&normalize(listing.locality)===normalize(candidate.locality)){score+=30;reasons.push('LOCALITY_MATCH');}
    const groupTags=new Set([...(listing?.missionTags??[]),...(listing?.activityTags??[])].map(normalize)),candidateTags=new Set([...candidate.skills,...candidate.interests,...candidate.desiredGroupTags].map(normalize)),hits=[...groupTags].filter(x=>candidateTags.has(x)).length;
    if(hits){score+=Math.min(50,hits*10);reasons.push('PUBLIC_TAG_AFFINITY');}
    if(listing?.recruiting){score+=10;reasons.push('GROUP_RECRUITING');}
    return{candidate,score:Math.min(100,score),reasonCodes:reasons,advisoryOnly:true,contactShared:false};
  }

  async createRecruitmentCampaign(targetTenantId:Id,groupId:Id,input:{title:string;message?:string;locality?:string;tags?:string[]}):Promise<WorkspaceRecord>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);const ctx=this.kernel.context.get(),title=cleanText(input.title,160);if(!title)throw new Error('RECRUITMENT_TITLE_REQUIRED');const stamp=now();
    const record:WorkspaceRecord={id:makeId('recruitment'),tenantId:targetTenantId,groupId,moduleId:'MEMBERSHIP.RECRUITMENT',title,status:'ACTIVE',tags:['recruitment','state:ACTIVE'],data:{campaignState:'ACTIVE',message:cleanText(input.message,500),locality:cleanText(input.locality,120),tags:cleanTags(input.tags),candidateContactPolicy:'OPT_IN_ONLY'},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return record;
  }

  async recruitmentCampaigns(targetTenantId:Id,groupId:Id):Promise<WorkspaceRecord[]>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);return this.repo.listWorkspaceRecords(targetTenantId,'MEMBERSHIP.RECRUITMENT',groupId);
  }

  async setRecruitmentCampaignState(targetTenantId:Id,groupId:Id,id:Id,state:'ACTIVE'|'PAUSED'|'CLOSED'):Promise<WorkspaceRecord>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);const row=await this.repo.getWorkspaceRecord(targetTenantId,id);if(!row||row.groupId!==groupId||row.moduleId!=='MEMBERSHIP.RECRUITMENT')throw new Error('RECRUITMENT_CAMPAIGN_NOT_FOUND');const stamp=now(),next={...row,status:state==='CLOSED'?'DONE' as const:'ACTIVE' as const,tags:[...row.tags.filter(x=>!x.startsWith('state:')),'state:'+state],data:{...row.data,campaignState:state},updatedAt:stamp};await this.repo.saveWorkspaceRecord(next);return next;
  }
}

export class MembershipGatewayService {
  private readonly foundation:FoundationService;
  constructor(private readonly repo:PlatformRepository,private readonly kernel:PlatformKernel){this.foundation=new FoundationService(repo,kernel);}

  async requestToJoin(input:{groupId:Id;message?:string;requestedCommitmentBand?:MembershipApplication['requestedCommitmentBand']}):Promise<MembershipApplication>{
    const ctx=this.kernel.context.get(); const listing=await this.repo.getPublicGroupListing(input.groupId); if(!listing||!listing.discoverable||listing.visibility!=='PUBLIC') throw new Error('GROUP_NOT_DISCOVERABLE');
    if(listing.joinPolicy==='CLOSED'||listing.joinPolicy==='INVITE_ONLY') throw new Error('JOIN_REQUIRES_INVITATION');
    const user=await this.repo.getUser(ctx.actorId); if(!user) throw new Error('USER_NOT_FOUND');
    const existing=(await this.repo.listMembershipApplicationsForGroup(listing.tenantId,listing.groupId)).find(x=>x.applicantUserId===ctx.actorId&&x.status==='PENDING'); if(existing) return existing;
    const application:MembershipApplication={id:makeId('application'),targetTenantId:listing.tenantId,groupId:listing.groupId,applicantUserId:ctx.actorId,sourceTenantId:ctx.tenantId,status:'PENDING',message:input.message?.trim()||undefined,requestedCommitmentBand:input.requestedCommitmentBand,createdAt:now()};
    await this.repo.saveMembershipApplication(application);
    const audit=this.kernel.audit.append({tenantId:listing.tenantId,actorId:ctx.actorId,action:'MEMBERSHIP_APPLICATION_SUBMITTED',targetType:'membership_application',targetId:application.id,after:{groupId:listing.groupId,applicantUserId:ctx.actorId},requestId:ctx.requestId}); await this.repo.saveAudit(audit);
    return structuredClone(application);
  }

  async listForGroup(targetTenantId:Id,groupId:Id):Promise<MembershipApplication[]>{ await requireManager(this.repo,this.kernel,targetTenantId,groupId); return this.repo.listMembershipApplicationsForGroup(targetTenantId,groupId); }

  async decide(applicationId:Id,decision:'APPROVE'|'REJECT',reason?:string):Promise<{application:MembershipApplication;membershipId?:Id}>{
    const application=await this.repo.getMembershipApplication(applicationId); if(!application) throw new Error('APPLICATION_NOT_FOUND'); if(application.status!=='PENDING') throw new Error('APPLICATION_ALREADY_DECIDED');
    await requireManager(this.repo,this.kernel,application.targetTenantId,application.groupId);
    let membershipId:Id|undefined;
    if(decision==='APPROVE'){
      const user=await this.repo.getUser(application.applicantUserId); if(!user) throw new Error('USER_NOT_FOUND');
      const existing=(await this.repo.listMemberships(application.targetTenantId,application.groupId)).find(x=>x.userId===user.id&&x.status==='active');
      const membership=existing??await this.foundation.addMember(application.targetTenantId,application.groupId,user); membershipId=membership.id;
    }
    const updated:MembershipApplication={...application,status:decision==='APPROVE'?'APPROVED':'REJECTED',decidedAt:now(),decidedBy:this.kernel.context.get().actorId,decisionReason:reason?.trim()||undefined};
    await this.repo.saveMembershipApplication(updated);
    const audit=this.kernel.audit.append({tenantId:application.targetTenantId,actorId:this.kernel.context.get().actorId,action:'MEMBERSHIP_APPLICATION_DECIDED',targetType:'membership_application',targetId:application.id,after:{status:updated.status,membershipId},requestId:this.kernel.context.get().requestId}); await this.repo.saveAudit(audit);
    return {application:structuredClone(updated),membershipId};
  }
}
