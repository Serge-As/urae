import type { GroupDiscoveryMatch, GroupDiscoveryQuery, Id, MembershipApplication, PublicGroupListing, User } from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';
import type { PlatformRepository } from '../../repositories/src/index.js';
import { PlatformKernel } from '../../platform-kernel/src/index.js';
import { FoundationService } from '../../domain/src/index.js';

const now=()=>new Date().toISOString();
const MANAGER_ROLES=new Set(['founder','manager','admin','president','treasurer']);
const normalize=(v:string|undefined)=>String(v??'').trim().toLocaleLowerCase();
const tokens=(v:string|undefined)=>normalize(v).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

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
