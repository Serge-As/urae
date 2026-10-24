import type { GroupDiscoveryMatch, GroupDiscoveryQuery, Id, MembershipApplication, PublicApproximateLocation, PublicGroupListing, User, WorkspaceRecord } from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';
import type { PlatformRepository } from '../../repositories/src/index.js';
import { PlatformKernel } from '../../platform-kernel/src/index.js';
import { FoundationService } from '../../domain/src/index.js';
import * as notebooks from './notebook.js';

const now=()=>new Date().toISOString();
const MANAGER_ROLES=new Set(['founder','manager','admin','president','treasurer']);
const normalize=(v:string|undefined)=>String(v??'').trim().toLocaleLowerCase();
const tokens=(v:string|undefined)=>normalize(v).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

const PUBLIC_CANDIDATE_TENANT='__eco_public_candidate_projection__';
const PUBLIC_MANAGER_TENANT='__eco_public_manager_projection__';
const cleanText=(v:unknown,max=240)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,max);
const cleanTags=(v:unknown)=>{let raw:unknown[]=Array.isArray(v)?v:[];if(typeof v==='string'&&v.trim()){try{const parsed=JSON.parse(v);raw=Array.isArray(parsed)?parsed:v.split(',');}catch{raw=v.split(',');}}return[...new Set(raw.map(x=>normalize(String(x))).filter(Boolean))].slice(0,24);};
const validCoordinates=(latitude:number,longitude:number)=>Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=-90&&latitude<=90&&longitude>=-180&&longitude<=180;
const publicApproximateLocation=(value:Partial<PublicApproximateLocation>|undefined):PublicApproximateLocation|undefined=>{
  if(!value)return undefined;const latitude=Number(value.latitude),longitude=Number(value.longitude);if(!validCoordinates(latitude,longitude))throw new Error('INVALID_GEO_COORDINATES');
  return{latitude:Number(latitude.toFixed(2)),longitude:Number(longitude.toFixed(2)),precisionMeters:Math.max(1000,Math.min(10000,Math.round(Number(value.precisionMeters)||1000))),source:'DEVICE_GEOLOCATION'};
};
const searchCoordinates=(latitude:unknown,longitude:unknown):{latitude:number;longitude:number}|undefined=>{
  if(latitude===undefined&&longitude===undefined)return undefined;
  const lat=Number(latitude),lon=Number(longitude);if(!validCoordinates(lat,lon))throw new Error('INVALID_GEO_COORDINATES');return{latitude:lat,longitude:lon};
};
const haversineKm=(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number})=>{
  const rad=(v:number)=>v*Math.PI/180,R=6371,dLat=rad(b.latitude-a.latitude),dLon=rad(b.longitude-a.longitude),lat1=rad(a.latitude),lat2=rad(b.latitude);
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
};
const safeRadiusKm=(value:unknown)=>Math.max(1,Math.min(100,Number.isFinite(Number(value))?Number(value):20));
export interface PublicCandidateProfile {
  id:Id;displayAlias:string;locality?:string;approxLocation?:PublicApproximateLocation;skills:string[];interests:string[];desiredGroupTags:string[];
  bio?:string;availability?:string;updatedAt:string;
}
export interface CandidateSearchQuery {text?:string;locality?:string;tags?:string[];latitude?:number;longitude?:number;radiusKm?:number;}
export interface CandidateMatch {candidate:PublicCandidateProfile;score:number;reasonCodes:string[];distanceKm?:number;}
export interface CandidateInvitationView {id:Id;groupId:Id;groupName:string;campaignId?:Id;message?:string;state:'PENDING'|'INTERESTED'|'DECLINED';createdAt:string;updatedAt:string;}
export interface PublicManagerProfile {
  id:Id;displayAlias:string;locality?:string;expertise:string[];services:string[];bio?:string;availability?:string;optIn:boolean;
  managedPublicGroups:Array<{groupId:Id;name:string}>;academyCertificates:string[];
  evidenceSummary:{managedPublicGroupCount:number;academyCertificateCount:number;selfDeclaredExpertise:true};
  reputationEvidence:{basis:'PUBLIC_EVIDENCE_ONLY';managedPublicGroups:Array<{groupId:Id;name:string}>;academyCertificates:string[];selfDeclaredExpertise:true;opaqueScore:false};
  contactShared:false;financialDataShared:false;rawIdentityShared:false;automaticRoleGrant:false;updatedAt:string;
}
export interface ManagerProfileSearchQuery {text?:string;locality?:string;expertise?:string[];}

const candidateProjection=(row:WorkspaceRecord):PublicCandidateProfile=>({
  id:row.id,displayAlias:String(row.data.displayAlias??row.title),locality:row.data.locality?String(row.data.locality):undefined,
  approxLocation:Boolean(row.data.geoOptIn)&&row.data.geoLatitude!==undefined&&row.data.geoLongitude!==undefined?publicApproximateLocation({latitude:Number(row.data.geoLatitude),longitude:Number(row.data.geoLongitude),precisionMeters:Number(row.data.geoPrecisionMeters??1000),source:'DEVICE_GEOLOCATION'}):undefined,
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
  clearApproxLocation?: boolean;
}

/** Public cross-tenant projection. It deliberately never reads member lists, balances or private contacts. */
export class DiscoveryService {
  constructor(private readonly repo:PlatformRepository,private readonly kernel:PlatformKernel){}
  notebook(){return notebooks.notebook(this.repo,this.kernel);}
  saveNotebook(input:Parameters<typeof notebooks.saveNotebook>[2]){return notebooks.saveNotebook(this.repo,this.kernel,input);}
  notebookPreview(input:Parameters<typeof notebooks.notebookPreview>[2]){return notebooks.notebookPreview(this.repo,this.kernel,input);}
  searchNotebooks(groupId:string,q:string){return notebooks.searchNotebooks(this.repo,this.kernel,groupId,q);}
  receivedNotebooks(groupId:string){return notebooks.receivedNotebooks(this.repo,this.kernel,groupId);}

  private managerProjection(row:WorkspaceRecord):PublicManagerProfile{
    const groups=(()=>{try{const x=JSON.parse(String(row.data.managedPublicGroupsJson??'[]'));return Array.isArray(x)?x.map((g:any)=>({groupId:String(g.groupId??''),name:String(g.name??'')})).filter((g:any)=>g.groupId&&g.name):[];}catch{return[];}})();
    const certs=(()=>{try{const x=JSON.parse(String(row.data.academyCertificatesJson??'[]'));return Array.isArray(x)?x.map(String).filter(Boolean):[];}catch{return[];}})();
    return{id:row.id,displayAlias:String(row.data.displayAlias??row.title),locality:row.data.locality?String(row.data.locality):undefined,
      expertise:cleanTags(row.data.expertiseJson),services:cleanTags(row.data.servicesJson),bio:row.data.bio?String(row.data.bio):undefined,
      availability:row.data.availability?String(row.data.availability):undefined,optIn:Boolean(row.data.optIn),managedPublicGroups:groups,academyCertificates:certs,
      evidenceSummary:{managedPublicGroupCount:groups.length,academyCertificateCount:certs.length,selfDeclaredExpertise:true},
      reputationEvidence:{basis:'PUBLIC_EVIDENCE_ONLY',managedPublicGroups:groups,academyCertificates:certs,selfDeclaredExpertise:true,opaqueScore:false},
      contactShared:false,financialDataShared:false,rawIdentityShared:false,automaticRoleGrant:false,updatedAt:row.updatedAt};
  }

  async managerProfile():Promise<PublicManagerProfile|undefined>{
    const ctx=this.kernel.context.get(),rows=await this.repo.listWorkspaceRecords(PUBLIC_MANAGER_TENANT,'MANAGER.PUBLIC_PROFILE');
    const row=rows.find(x=>String(x.data.ownerActorId??'')===ctx.actorId);return row?this.managerProjection(row):undefined;
  }

  async saveManagerProfile(input:{displayAlias:string;locality?:string;expertise?:string[];services?:string[];bio?:string;availability?:string;optIn:boolean;sharePublicGroups?:boolean;shareAcademyCertificates?:boolean}):Promise<PublicManagerProfile>{
    const ctx=this.kernel.context.get(),user=await this.repo.getUser(ctx.actorId);if(!user)throw new Error('USER_NOT_FOUND');
    const alias=cleanText(input.displayAlias||user.displayName,80);if(!alias)throw new Error('MANAGER_PROFILE_ALIAS_REQUIRED');
    const expertise=cleanTags(input.expertise),services=cleanTags(input.services);if(input.optIn&&!expertise.length&&!services.length)throw new Error('MANAGER_PROFILE_EXPERTISE_OR_SERVICE_REQUIRED');
    const managed:Array<{groupId:Id;name:string}>=[];
    if(input.sharePublicGroups){
      for(const g of await this.repo.listGroups(ctx.tenantId)){
        const membership=(await this.repo.listMemberships(ctx.tenantId,g.id)).find(x=>x.userId===ctx.actorId&&x.status==='active');
        const manages=g.createdBy===ctx.actorId||Boolean(membership?.roles.some(r=>MANAGER_ROLES.has(r)));if(!manages)continue;
        const listing=await this.repo.getPublicGroupListing(g.id);if(listing?.visibility==='PUBLIC'&&listing.discoverable)managed.push({groupId:g.id,name:g.name});
      }
    }
    const certs:string[]=[];
    if(input.shareAcademyCertificates){
      for(const row of await this.repo.listWorkspaceRecords(ctx.tenantId,'LEARNING.MANAGER_ACADEMY'))if(row.createdBy===ctx.actorId&&row.data.kind==='CERTIFICATE'&&row.status==='DONE')certs.push(row.title);
    }
    const rows=await this.repo.listWorkspaceRecords(PUBLIC_MANAGER_TENANT,'MANAGER.PUBLIC_PROFILE'),existing=rows.find(x=>String(x.data.ownerActorId??'')===ctx.actorId),stamp=now();
    const record:WorkspaceRecord={id:existing?.id??makeId('manager_profile'),tenantId:PUBLIC_MANAGER_TENANT,moduleId:'MANAGER.PUBLIC_PROFILE',title:alias,status:input.optIn?'ACTIVE':'ARCHIVED',tags:['public-manager-profile','consent:'+(input.optIn?'yes':'no')],
      data:{ownerActorId:ctx.actorId,optIn:Boolean(input.optIn),displayAlias:alias,locality:cleanText(input.locality,120),expertiseJson:JSON.stringify(expertise),servicesJson:JSON.stringify(services),bio:cleanText(input.bio,700),availability:cleanText(input.availability,160),managedPublicGroupsJson:JSON.stringify(managed),academyCertificatesJson:JSON.stringify(certs),contactShared:false,financialDataShared:false,rawIdentityShared:false,automaticRoleGrant:false,selfDeclaredExpertise:true},
      createdBy:ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'PUBLIC_MANAGER_PROFILE_UPDATED',targetType:'public_manager_profile',targetId:record.id,requestId:ctx.requestId,after:{optIn:Boolean(input.optIn),expertiseCount:expertise.length,servicesCount:services.length,managedPublicGroupCount:managed.length,academyCertificateCount:certs.length,contactShared:false,financialDataShared:false,automaticRoleGrant:false}}));
    return this.managerProjection(record);
  }

  async searchManagerProfiles(query:ManagerProfileSearchQuery={}):Promise<PublicManagerProfile[]>{
    const q=tokens(cleanText(query.text,120)),locality=normalize(query.locality),wanted=new Set(cleanTags(query.expertise)),out:Array<{profile:PublicManagerProfile;score:number}>=[];
    if(!q.length&&!locality&&!wanted.size)throw new Error('DISCOVERY_QUERY_REQUIRED');
    for(const row of await this.repo.listWorkspaceRecords(PUBLIC_MANAGER_TENANT,'MANAGER.PUBLIC_PROFILE')){
      if(row.status!=='ACTIVE'||row.data.optIn!==true)continue;const p=this.managerProjection(row),hay=normalize([p.displayAlias,p.locality,p.bio,...p.expertise,...p.services].filter(Boolean).join(' '));let score=0;
      if(q.length){const hits=q.filter(x=>hay.includes(x)).length;if(!hits)continue;score+=Math.min(40,hits*12);}
      if(locality){if(normalize(p.locality)!==locality)continue;score+=30;}
      if(wanted.size){const pool=new Set([...p.expertise,...p.services].map(normalize)),hits=[...wanted].filter(x=>pool.has(x)).length;if(!hits)continue;score+=Math.min(30,hits*10);}
      score+=Math.min(10,p.evidenceSummary.managedPublicGroupCount*3+p.evidenceSummary.academyCertificateCount);out.push({profile:p,score});
    }
    return out.sort((a,b)=>b.score-a.score||a.profile.displayAlias.localeCompare(b.profile.displayAlias)).slice(0,30).map(x=>x.profile);
  }

  async publishGroupListing(input:PublishGroupListingInput):Promise<PublicGroupListing>{
    await requireManager(this.repo,this.kernel,input.tenantId,input.groupId);
    if(input.visibility==='SECRET') throw new Error('SECRET_GROUP_NOT_DISCOVERABLE');
    const group=await this.repo.getGroup(input.tenantId,input.groupId); if(!group) throw new Error('GROUP_NOT_FOUND');
    const previous=await this.repo.getPublicGroupListing(group.id); const timestamp=now();
    const listing:PublicGroupListing={
      id:previous?.id??makeId('listing'),tenantId:group.tenantId,groupId:group.id,name:group.name,
      family:group.kind==='association'?'association':'rotating_tontine',visibility:input.visibility,
      discoverable:input.visibility==='PUBLIC'&&input.discoverable,joinPolicy:input.joinPolicy,recruiting:input.recruiting,
      locality:input.locality?.trim()||undefined,
      approxLocation:input.clearApproxLocation?undefined:(input.approxLocation?publicApproximateLocation(input.approxLocation):previous?.approxLocation),
      missionTags:[...new Set(input.missionTags.map(normalize).filter(Boolean))],
      activityTags:[...new Set(input.activityTags.map(normalize).filter(Boolean))],meetingMode:input.meetingMode,
      contributionBand:input.contributionBand,publicManagerAlias:input.publicManagerAlias?.trim()||undefined,
      publishedAt:previous?.publishedAt??timestamp,updatedAt:timestamp
    };
    await this.repo.savePublicGroupListing(listing);
    const audit=this.kernel.audit.append({tenantId:group.tenantId,actorId:this.kernel.context.get().actorId,action:'GROUP_DISCOVERY_LISTING_PUBLISHED',targetType:'group',targetId:group.id,after:{visibility:listing.visibility,discoverable:listing.discoverable,joinPolicy:listing.joinPolicy,recruiting:listing.recruiting,locality:listing.locality,approximateLocationShared:Boolean(listing.approxLocation),missionTags:listing.missionTags,activityTags:listing.activityTags},requestId:this.kernel.context.get().requestId});
    await this.repo.saveAudit(audit);
    return structuredClone(listing);
  }

  async search(query:GroupDiscoveryQuery={}):Promise<GroupDiscoveryMatch[]>{
    const q=tokens(query.text); const locality=normalize(query.locality); const mission=new Set((query.missionTags??[]).map(normalize)); const activity=new Set((query.activityTags??[]).map(normalize));
    const coords=searchCoordinates(query.latitude,query.longitude),radiusKm=safeRadiusKm(query.radiusKm);
    const results:GroupDiscoveryMatch[]=[];
    for(const listing of await this.repo.listPublicGroupListings()){
      if(!listing.discoverable||listing.visibility!=='PUBLIC') continue;
      if(query.recruitingOnly&& !listing.recruiting) continue;
      if(query.family&&listing.family!==query.family) continue;
      if(query.meetingMode&&listing.meetingMode&&listing.meetingMode!==query.meetingMode) continue;
      if(query.maxContribution&&listing.contributionBand?.currency===query.maxContribution.currency&&listing.contributionBand.min!==undefined&&listing.contributionBand.min>query.maxContribution.amount) continue;
      let score=1; const reasons:string[]=[]; let distanceKm:number|undefined; const haystack=normalize([listing.name,listing.locality,...listing.missionTags,...listing.activityTags].filter(Boolean).join(' '));
      if(q.length){const hits=q.filter(x=>haystack.includes(x)).length;if(hits===0) continue;score+=hits*12;reasons.push('TEXT_MATCH');}
      if(locality&&normalize(listing.locality)===locality){score+=25;reasons.push('LOCALITY_MATCH');}
      if(coords){if(!listing.approxLocation)continue;distanceKm=haversineKm(coords,listing.approxLocation);if(distanceKm>radiusKm)continue;score+=Math.max(5,35-Math.round(distanceKm));reasons.push('GPS_PROXIMITY');}
      const missionHits=listing.missionTags.filter(x=>mission.has(normalize(x))).length;if(mission.size&&missionHits===0) continue;if(missionHits){score+=missionHits*15;reasons.push('MISSION_AFFINITY');}
      const activityHits=listing.activityTags.filter(x=>activity.has(normalize(x))).length;if(activity.size&&activityHits===0) continue;if(activityHits){score+=activityHits*10;reasons.push('ACTIVITY_AFFINITY');}
      if(query.family){score+=8;reasons.push('GROUP_FAMILY_MATCH');}
      if(query.meetingMode&&listing.meetingMode===query.meetingMode){score+=6;reasons.push('MEETING_MODE_MATCH');}
      if(listing.recruiting){score+=5;reasons.push('RECRUITING');}
      results.push({listing:structuredClone(listing),score,reasonCodes:reasons,distanceKm:distanceKm===undefined?undefined:Number(distanceKm.toFixed(1))});
    }
    return results.sort((a,b)=>(a.distanceKm??Infinity)-(b.distanceKm??Infinity)||b.score-a.score||a.listing.name.localeCompare(b.listing.name));
  }

  async candidateProfile():Promise<PublicCandidateProfile|undefined>{
    const ctx=this.kernel.context.get(),rows=await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO');
    const row=rows.find(x=>String(x.data.ownerActorId??'')===ctx.actorId&&x.status==='ACTIVE'&&Boolean(x.data.optIn));
    return row?candidateProjection(row):undefined;
  }

  async saveCandidateProfile(input:{displayAlias:string;locality?:string;approxLocation?:PublicApproximateLocation;skills?:string[];interests?:string[];desiredGroupTags?:string[];bio?:string;availability?:string;optIn:boolean}):Promise<PublicCandidateProfile|undefined>{
    const ctx=this.kernel.context.get(),user=await this.repo.getUser(ctx.actorId);if(!user)throw new Error('USER_NOT_FOUND');
    const rows=await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO');
    const existing=rows.find(x=>String(x.data.ownerActorId??'')===ctx.actorId),stamp=now(),alias=cleanText(input.displayAlias||user.displayName,80);
    if(!alias)throw new Error('CANDIDATE_ALIAS_REQUIRED');
    const approxLocation=input.optIn?publicApproximateLocation(input.approxLocation):undefined;
    const record:WorkspaceRecord={
      id:existing?.id??makeId('candidate'),tenantId:PUBLIC_CANDIDATE_TENANT,moduleId:'MEMBERSHIP.PORTFOLIO',title:alias,
      status:input.optIn?'ACTIVE':'ARCHIVED',tags:['public-candidate','consent:'+(input.optIn?'yes':'no'),'geo-consent:'+(approxLocation?'yes':'no')],
      data:{ownerActorId:ctx.actorId,optIn:Boolean(input.optIn),displayAlias:alias,locality:cleanText(input.locality,120),geoOptIn:Boolean(approxLocation),geoLatitude:approxLocation?.latitude??null,geoLongitude:approxLocation?.longitude??null,geoPrecisionMeters:approxLocation?.precisionMeters??null,skills:JSON.stringify(cleanTags(input.skills)),interests:JSON.stringify(cleanTags(input.interests)),desiredGroupTags:JSON.stringify(cleanTags(input.desiredGroupTags)),bio:cleanText(input.bio,500),availability:cleanText(input.availability,120)},
      createdBy:ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp
    };
    await this.repo.saveWorkspaceRecord(record);
    const audit=this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'CANDIDATE_PUBLIC_PROFILE_UPDATED',targetType:'candidate_projection',targetId:record.id,after:{optIn:Boolean(input.optIn),locality:Boolean(record.data.locality),approximateLocationShared:Boolean(approxLocation),skillsCount:cleanTags(input.skills).length},requestId:ctx.requestId});await this.repo.saveAudit(audit);
    return input.optIn?candidateProjection(record):undefined;
  }

  async searchCandidates(targetTenantId:Id,groupId:Id,query:CandidateSearchQuery):Promise<CandidateMatch[]>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);
    const text=cleanText(query.text,120),q=tokens(text),locality=normalize(query.locality),wanted=new Set(cleanTags(query.tags)),coords=searchCoordinates(query.latitude,query.longitude),radiusKm=safeRadiusKm(query.radiusKm);
    if((text&&text.length<2)||(!q.length&&!locality&&!wanted.size&&!coords))throw new Error('DISCOVERY_QUERY_REQUIRED');
    const rows=await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO'),matches:CandidateMatch[]=[];
    for(const row of rows){
      if(row.status!=='ACTIVE'||!Boolean(row.data.optIn))continue;
      const c=candidateProjection(row),hay=normalize([c.displayAlias,c.locality,c.bio,...c.skills,...c.interests,...c.desiredGroupTags].filter(Boolean).join(' '));
      let score=0;const reasons:string[]=[];let distanceKm:number|undefined;
      if(q.length){const hits=q.filter(x=>hay.includes(x)).length;if(!hits)continue;score+=Math.min(40,hits*12);reasons.push('TEXT_MATCH');}
      if(locality){if(normalize(c.locality)!==locality)continue;score+=30;reasons.push('LOCALITY_MATCH');}
      if(coords){if(!c.approxLocation)continue;distanceKm=haversineKm(coords,c.approxLocation);if(distanceKm>radiusKm)continue;score+=Math.max(5,35-Math.round(distanceKm));reasons.push('GPS_PROXIMITY');}
      if(wanted.size){const pool=new Set([...c.skills,...c.interests,...c.desiredGroupTags].map(normalize)),hits=[...wanted].filter(x=>pool.has(x)).length;if(!hits)continue;score+=Math.min(30,hits*10);reasons.push('TAG_MATCH');}
      matches.push({candidate:c,score,reasonCodes:reasons,distanceKm:distanceKm===undefined?undefined:Number(distanceKm.toFixed(1))});
    }
    return matches.sort((a,b)=>(a.distanceKm??Infinity)-(b.distanceKm??Infinity)||b.score-a.score||a.candidate.displayAlias.localeCompare(b.candidate.displayAlias)).slice(0,20);
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

  private invitationView(row:WorkspaceRecord):CandidateInvitationView{
    return{id:row.id,groupId:String(row.data.targetGroupId??''),groupName:String(row.data.groupName??''),campaignId:row.data.campaignId?String(row.data.campaignId):undefined,message:row.data.message?String(row.data.message):undefined,state:String(row.data.invitationState??'PENDING') as CandidateInvitationView['state'],createdAt:row.createdAt,updatedAt:row.updatedAt};
  }

  async inviteCandidate(targetTenantId:Id,groupId:Id,candidateId:Id,input:{campaignId?:Id;message?:string}):Promise<CandidateInvitationView>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);const ctx=this.kernel.context.get(),group=await this.repo.getGroup(targetTenantId,groupId);if(!group)throw new Error('GROUP_NOT_FOUND');
    const candidate=(await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO')).find(x=>x.id===candidateId&&x.status==='ACTIVE'&&Boolean(x.data.optIn));if(!candidate)throw new Error('CANDIDATE_NOT_FOUND');
    if(input.campaignId){const campaign=await this.repo.getWorkspaceRecord(targetTenantId,input.campaignId);if(!campaign||campaign.groupId!==groupId||campaign.moduleId!=='MEMBERSHIP.RECRUITMENT'||String(campaign.data.campaignState)!=='ACTIVE')throw new Error('RECRUITMENT_CAMPAIGN_NOT_ACTIVE');}
    const prior=(await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.RECRUITMENT')).find(x=>String(x.data.candidateOwnerActorId)===String(candidate.data.ownerActorId)&&String(x.data.targetGroupId)===groupId&&String(x.data.invitationState)==='PENDING');
    if(prior)return this.invitationView(prior);
    const stamp=now(),record:WorkspaceRecord={id:makeId('candidate_invite'),tenantId:PUBLIC_CANDIDATE_TENANT,groupId,moduleId:'MEMBERSHIP.RECRUITMENT',title:'Invitation · '+group.name,status:'ACTIVE',tags:['candidate-invitation','state:PENDING'],data:{candidateOwnerActorId:String(candidate.data.ownerActorId),targetTenantId,targetGroupId:groupId,groupName:group.name,campaignId:input.campaignId??'',message:cleanText(input.message,500),invitationState:'PENDING',privateContactShared:false},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return this.invitationView(record);
  }

  async candidateInvitations():Promise<CandidateInvitationView[]>{
    const ctx=this.kernel.context.get(),rows=await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.RECRUITMENT');
    return rows.filter(x=>String(x.data.candidateOwnerActorId??'')===ctx.actorId&&x.tags.includes('candidate-invitation')).map(x=>this.invitationView(x)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }

  async respondCandidateInvitation(id:Id,response:'INTERESTED'|'DECLINED'):Promise<CandidateInvitationView>{
    const ctx=this.kernel.context.get(),row=await this.repo.getWorkspaceRecord(PUBLIC_CANDIDATE_TENANT,id);if(!row||row.moduleId!=='MEMBERSHIP.RECRUITMENT'||!row.tags.includes('candidate-invitation')||String(row.data.candidateOwnerActorId)!==ctx.actorId)throw new Error('CANDIDATE_INVITATION_NOT_FOUND');
    if(String(row.data.invitationState)!=='PENDING')return this.invitationView(row);
    const stamp=now(),next:WorkspaceRecord={...row,status:'DONE',tags:[...row.tags.filter(x=>!x.startsWith('state:')),'state:'+response],data:{...row.data,invitationState:response,respondedAt:stamp},updatedAt:stamp};await this.repo.saveWorkspaceRecord(next);return this.invitationView(next);
  }

  async saveSearch(input:{id?:Id;title:string;query:GroupDiscoveryQuery;alertsEnabled?:boolean}):Promise<WorkspaceRecord>{
    const ctx=this.kernel.context.get(),title=cleanText(input.title,120);if(!title)throw new Error('SAVED_SEARCH_TITLE_REQUIRED');
    const existing=input.id?await this.repo.getWorkspaceRecord(ctx.tenantId,input.id):undefined;
    if(existing&&(existing.moduleId!=='DISCOVERY.SAVED_SEARCH'||existing.createdBy!==ctx.actorId))throw new Error('FORBIDDEN_SCOPE');
    const stamp=now(),id=existing?.id??makeId('saved_search'),known=existing?String(existing.data.knownGroupIdsJson??'[]'):'[]';
    const record:WorkspaceRecord={id,tenantId:ctx.tenantId,moduleId:'DISCOVERY.SAVED_SEARCH',title,status:'ACTIVE',tags:['discovery-search',input.alertsEnabled?'alerts:on':'alerts:off'],data:{ownerActorId:ctx.actorId,queryJson:JSON.stringify(input.query??{}),alertsEnabled:Boolean(input.alertsEnabled),knownGroupIdsJson:known,lastCheckedAt:String(existing?.data.lastCheckedAt??'')},createdBy:ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  async savedSearches():Promise<WorkspaceRecord[]>{const ctx=this.kernel.context.get();return (await this.repo.listWorkspaceRecords(ctx.tenantId,'DISCOVERY.SAVED_SEARCH')).filter(x=>x.createdBy===ctx.actorId&&x.status!=='ARCHIVED').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  async runSavedSearch(id:Id):Promise<{search:WorkspaceRecord;matches:GroupDiscoveryMatch[];newMatches:GroupDiscoveryMatch[]}>{
    const ctx=this.kernel.context.get(),row=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!row||row.moduleId!=='DISCOVERY.SAVED_SEARCH'||row.createdBy!==ctx.actorId)throw new Error('SAVED_SEARCH_NOT_FOUND');
    let query:GroupDiscoveryQuery={};try{query=JSON.parse(String(row.data.queryJson??'{}')) as GroupDiscoveryQuery;}catch{}
    const matches=await this.search(query),known=new Set<string>();try{for(const x of JSON.parse(String(row.data.knownGroupIdsJson??'[]')))known.add(String(x));}catch{}
    const newMatches=matches.filter(x=>!known.has(x.listing.groupId)),stamp=now(),next={...row,data:{...row.data,knownGroupIdsJson:JSON.stringify(matches.map(x=>x.listing.groupId)),lastCheckedAt:stamp},updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(next);return{search:next,matches,newMatches};
  }
  async deleteSavedSearch(id:Id):Promise<WorkspaceRecord>{const ctx=this.kernel.context.get(),row=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!row||row.moduleId!=='DISCOVERY.SAVED_SEARCH'||row.createdBy!==ctx.actorId)throw new Error('SAVED_SEARCH_NOT_FOUND');const next={...row,status:'ARCHIVED' as const,updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;}
  async proximity(locality:string,text=''):Promise<GroupDiscoveryMatch[]>{const place=cleanText(locality,120);if(!place)throw new Error('LOCALITY_REQUIRED');return this.search({text:cleanText(text,120)||undefined,locality:place});}
  async proximityByCoordinates(latitude:number,longitude:number,radiusKm=20,text=''):Promise<GroupDiscoveryMatch[]>{searchCoordinates(latitude,longitude);return this.search({text:cleanText(text,120)||undefined,latitude,longitude,radiusKm:safeRadiusKm(radiusKm)});}

  async createRecruitmentCampaign(targetTenantId:Id,groupId:Id,input:{title:string;message?:string;locality?:string;tags?:string[]}):Promise<WorkspaceRecord>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);const ctx=this.kernel.context.get(),title=cleanText(input.title,160);if(!title)throw new Error('RECRUITMENT_TITLE_REQUIRED');const stamp=now();
    const record:WorkspaceRecord={id:makeId('recruitment'),tenantId:targetTenantId,groupId,moduleId:'MEMBERSHIP.RECRUITMENT',title,status:'ACTIVE',tags:['recruitment','state:ACTIVE'],data:{campaignState:'ACTIVE',message:cleanText(input.message,500),locality:cleanText(input.locality,120),tags:JSON.stringify(cleanTags(input.tags)),candidateContactPolicy:'OPT_IN_ONLY'},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
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

  private async questionRecord(targetTenantId:Id,groupId:Id){const row=await this.repo.getWorkspaceRecord(targetTenantId,'membership_questions_'+groupId);return row&&row.groupId===groupId&&row.moduleId==='MEMBERSHIP.QUESTIONS'?row:undefined;}
  private parseQuestions(row?:WorkspaceRecord):Array<{id:string;label:string;required:boolean}>{if(!row)return[];try{const q=JSON.parse(String(row.data.questionsJson??'[]'));return Array.isArray(q)?q.slice(0,12):[];}catch{return[];}}
  async membershipQuestions(groupId:Id):Promise<Array<{id:string;label:string;required:boolean}>>{const listing=await this.repo.getPublicGroupListing(groupId);if(!listing||listing.visibility!=='PUBLIC'||!listing.discoverable)return[];return this.parseQuestions(await this.questionRecord(listing.tenantId,groupId));}
  async groupMembershipQuestions(targetTenantId:Id,groupId:Id){await requireManager(this.repo,this.kernel,targetTenantId,groupId);return this.parseQuestions(await this.questionRecord(targetTenantId,groupId));}
  async setMembershipQuestions(targetTenantId:Id,groupId:Id,questions:Array<{id?:string;label:string;required?:boolean}>):Promise<WorkspaceRecord>{
    await requireManager(this.repo,this.kernel,targetTenantId,groupId);const cleanQuestions=questions.slice(0,12).map((q,i)=>({id:cleanText(q.id,80)||('q'+(i+1)),label:cleanText(q.label,240),required:Boolean(q.required)})).filter(q=>q.label);if(!cleanQuestions.length)throw new Error('MEMBERSHIP_QUESTIONS_REQUIRED');
    const stamp=now(),id='membership_questions_'+groupId,existing=await this.questionRecord(targetTenantId,groupId),record:WorkspaceRecord={id,tenantId:targetTenantId,groupId,moduleId:'MEMBERSHIP.QUESTIONS',title:'Questionnaire d’adhésion',status:'ACTIVE',tags:['membership-questions'],data:{questionsJson:JSON.stringify(cleanQuestions)},createdBy:this.kernel.context.get().actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(record);return record;
  }
  async createReferral(targetTenantId:Id,groupId:Id,note=''):Promise<WorkspaceRecord>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(targetTenantId,groupId);if(!group)throw new Error('GROUP_NOT_FOUND');const member=(await this.repo.listMemberships(targetTenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');if(!member&&group.createdBy!==ctx.actorId)throw new Error('FORBIDDEN_SCOPE');
    const code='ECO-REF-'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(),stamp=now(),record:WorkspaceRecord={id:makeId('membership_referral'),tenantId:targetTenantId,groupId,moduleId:'MEMBERSHIP.REFERRALS',title:'Parrainage d’adhésion',status:'ACTIVE',tags:['membership-referral','no-auto-reward'],data:{code,referrerActorId:ctx.actorId,referrerMembershipId:member?.id??'',note:cleanText(note,300),rewardAutomatic:false,conversionAutomatic:false},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(record);return record;
  }
  private async referralByCode(targetTenantId:Id,groupId:Id,code?:string):Promise<WorkspaceRecord|undefined>{if(!code?.trim())return undefined;const rows=await this.repo.listWorkspaceRecords(targetTenantId,'MEMBERSHIP.REFERRALS',groupId);return rows.find(x=>x.status==='ACTIVE'&&String(x.data.code).toUpperCase()===code.trim().toUpperCase());}
  async requestToJoin(input:{groupId:Id;message?:string;requestedCommitmentBand?:MembershipApplication['requestedCommitmentBand'];answers?:Record<string,string>;referralCode?:string}):Promise<MembershipApplication>{
    const ctx=this.kernel.context.get(); const listing=await this.repo.getPublicGroupListing(input.groupId); if(!listing||!listing.discoverable||listing.visibility!=='PUBLIC') throw new Error('GROUP_NOT_DISCOVERABLE');
    if(listing.joinPolicy==='CLOSED'||listing.joinPolicy==='INVITE_ONLY') throw new Error('JOIN_REQUIRES_INVITATION');
    const user=await this.repo.getUser(ctx.actorId); if(!user) throw new Error('USER_NOT_FOUND');
    const questions=this.parseQuestions(await this.questionRecord(listing.tenantId,listing.groupId)),answers:Record<string,string>={};for(const q of questions){const value=cleanText(input.answers?.[q.id],500);if(q.required&&!value)throw new Error('MEMBERSHIP_REQUIRED_ANSWER_MISSING:'+q.id);if(value)answers[q.id]=value;}
    const referral=await this.referralByCode(listing.tenantId,listing.groupId,input.referralCode);if(input.referralCode&&!referral)throw new Error('MEMBERSHIP_REFERRAL_NOT_FOUND');
    let application=(await this.repo.listMembershipApplicationsForGroup(listing.tenantId,listing.groupId)).find(x=>x.applicantUserId===ctx.actorId&&x.status==='PENDING');
    if(!application){application={id:makeId('application'),targetTenantId:listing.tenantId,groupId:listing.groupId,applicantUserId:ctx.actorId,sourceTenantId:ctx.tenantId,status:'PENDING',message:input.message?.trim()||undefined,requestedCommitmentBand:input.requestedCommitmentBand,createdAt:now()};await this.repo.saveMembershipApplication(application);const audit=this.kernel.audit.append({tenantId:listing.tenantId,actorId:ctx.actorId,action:'MEMBERSHIP_APPLICATION_SUBMITTED',targetType:'membership_application',targetId:application.id,after:{groupId:listing.groupId,applicantUserId:ctx.actorId},requestId:ctx.requestId});await this.repo.saveAudit(audit);}
    const stamp=now(),metaId='membership_application_meta_'+application.id,existingMeta=await this.repo.getWorkspaceRecord(listing.tenantId,metaId),meta:WorkspaceRecord={id:metaId,tenantId:listing.tenantId,groupId:listing.groupId,moduleId:'MEMBERSHIP.QUESTIONS',title:'Réponses candidature',status:'ACTIVE',tags:['membership-application-meta'],data:{applicationId:application.id,answersJson:JSON.stringify(answers),referralCode:referral?String(referral.data.code):'',referralId:referral?.id??'',referrerActorId:referral?String(referral.data.referrerActorId??''):''},createdBy:ctx.actorId,createdAt:existingMeta?.createdAt??stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(meta);
    return structuredClone(application);
  }
  async applicationDetails(applicationId:Id):Promise<{application:MembershipApplication;answers:Record<string,string>;referral?:{code:string;referrerActorId:string}}>{
    const application=await this.repo.getMembershipApplication(applicationId);if(!application)throw new Error('APPLICATION_NOT_FOUND');await requireManager(this.repo,this.kernel,application.targetTenantId,application.groupId);
    const meta=await this.repo.getWorkspaceRecord(application.targetTenantId,'membership_application_meta_'+application.id);let answers:Record<string,string>={};try{answers=JSON.parse(String(meta?.data.answersJson??'{}'));}catch{}
    return{application,answers,referral:meta?.data.referralCode?{code:String(meta.data.referralCode),referrerActorId:String(meta.data.referrerActorId??'')}:undefined};
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
