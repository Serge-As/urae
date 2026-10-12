import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {ArtifactStoreLike} from '../../imports/src/store.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import {sniffVisualMime,assertVisualSize} from '../../visual-media/src/index.js';
const INVITE='ADS.EXTERNAL_INVITE',PROPOSAL='ADS.PARTNER_PROPOSAL';
const roles=new Set(['founder','manager','admin','president','treasurer']);
const objective=new Set(['AWARENESS','COMMUNITY_JOIN','EVENT_RSVP','DEAL_OPEN','GROUP_BUY','LEAD','PARTNER_PROGRAM']);
const clean=(v:unknown,max:number)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,max);
const hash=async (v:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const safeDestination=(v:string)=>/^(?:[a-z][a-z0-9-]{1,42}:[a-zA-Z0-9_-]{1,110}|\/[^/][^\s]{0,160})$/.test(v);
export class ExternalAdInviteService{
 constructor(readonly repo:PlatformRepository,readonly kernel:PlatformKernel,readonly store?:ArtifactStoreLike){}
 private async manager(groupId:string){
  const c=this.kernel.context.get(),group=await this.repo.getGroup(c.tenantId,groupId);
  if(!group)throw Error('GROUP_NOT_FOUND');if(group.createdBy===c.actorId)return;
  const member=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
  if(!member?.roles.some(x=>roles.has(x)))throw Error('FORBIDDEN_SCOPE');
 }
 async issue(groupId:string,title:string,hours=72){
  await this.manager(groupId);
  if(!Number.isSafeInteger(hours)||hours<1||hours>168)throw Error('INVALID_INVITE_EXPIRY');
  const c=this.kernel.context.get(),id=makeId('ad_invite'),stamp=new Date().toISOString();
  const token=id+'.'+crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
  const expiry=new Date(Date.now()+3600000*hours).toISOString();
  await this.repo.saveWorkspaceRecord({id,tenantId:c.tenantId,groupId,moduleId:INVITE,title:clean(title,120)||'Annonceur',
   status:'ACTIVE',tags:['ads','external','invite'],data:{tokenHash:await hash(token),expiresAt:expiry,proposalId:'',mediaAssetId:''},
   createdBy:c.actorId,createdAt:stamp,updatedAt:stamp});
  await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'EXTERNAL_AD_INVITATION_CREATED',
   targetType:'ad_invite',targetId:id,requestId:c.requestId,metadata:{groupId,expiresAt:expiry}}));
  return{token,inviteId:id,expiresAt:expiry};
 }
 async list(groupId:string){
  await this.manager(groupId);const c=this.kernel.context.get(),rows=await this.repo.listWorkspaceRecords(c.tenantId,INVITE,groupId);
  return rows.map(x=>({id:x.id,name:x.title,expiresAt:x.data.expiresAt,proposalId:x.data.proposalId??''}));
 }
 async revoke(groupId:string,inviteId:string){
  await this.manager(groupId);
  const c=this.kernel.context.get(),row=await this.repo.getWorkspaceRecord(c.tenantId,inviteId);
  if(!row||row.groupId!==groupId||row.moduleId!==INVITE)throw Error('AD_INVITE_NOT_FOUND');
  if(row.data.proposalId)throw Error('AD_INVITE_ALREADY_USED');
  if(row.status!=='ACTIVE')return{id:inviteId,status:row.status};
  await this.repo.saveWorkspaceRecord({...row,status:'ARCHIVED',updatedAt:new Date().toISOString()});
  await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'EXTERNAL_AD_INVITATION_REVOKED',
   targetType:'ad_invite',targetId:inviteId,requestId:c.requestId,metadata:{groupId}}));
  return{id:inviteId,status:'ARCHIVED'};
 }
 private async verify(groupId:string,token:string,consumed=false){
  const id=token.split('.')[0]??'',c=this.kernel.context.get();
  if(!/^ad_invite_[a-zA-Z0-9_-]{1,110}$/.test(id)||token.length>220||token.length<50)throw Error('AD_INVITE_INVALID');
  const row=await this.repo.getWorkspaceRecord(c.tenantId,id);
  if(!row||row.groupId!==groupId||row.moduleId!==INVITE||row.status!=='ACTIVE')throw Error('AD_INVITE_INVALID');
  if(Date.parse(String(row.data.expiresAt??''))<=Date.now())throw Error('AD_INVITE_EXPIRED');
  if((await hash(token))!==row.data.tokenHash)throw Error('AD_INVITE_INVALID');
  if(!consumed&&row.data.proposalId)throw Error('AD_INVITE_ALREADY_USED');
  return row;
 }
 async status(groupId:string,token:string){
  const row=await this.verify(groupId,token,true),c=this.kernel.context.get(),id=String(row.data.proposalId??'');
  const proposal=id?await this.repo.getWorkspaceRecord(c.tenantId,id):null;
  return{valid:true,expiresAt:row.data.expiresAt,proposalId:id,
   state:proposal?.groupId===groupId&&proposal.moduleId===PROPOSAL?String(proposal.data.proposalState):null};
 }
 async upload(groupId:string,token:string,file:File){
  if(!this.store)throw Error('MEDIA_STORAGE_UNAVAILABLE');
  const invite=await this.verify(groupId,token);assertVisualSize(file.size);
  const bytes=new Uint8Array(await file.arrayBuffer()),mime=sniffVisualMime(bytes);
  if(file.type&&file.type.toLowerCase()!==mime)throw Error('MEDIA_MIME_MISMATCH');
  const c=this.kernel.context.get(),stamp=new Date().toISOString(),id=makeId('visual_media');
  const key='imports/'+c.tenantId+'/'+groupId+'/external-ad/'+invite.id+'/'+id,owner='external_invite_'+invite.id;
  await this.store.put(key,bytes,{httpMetadata:{contentType:mime},customMetadata:{tenantId:c.tenantId,groupId,purpose:'PARTNER_CREATIVE'}});
  const record:WorkspaceRecord={id,tenantId:c.tenantId,groupId,moduleId:'MEDIA.VISUAL_ASSET',title:clean(file.name,120)||'Photo',
   status:'ACTIVE',tags:['media','private','external'],data:{artifactKey:key,purpose:'PARTNER_CREATIVE',contentType:mime,size:bytes.length,ownerId:owner},
   createdBy:owner,createdAt:stamp,updatedAt:stamp};
  await this.repo.saveWorkspaceRecord(record);
  await this.repo.saveWorkspaceRecord({...invite,data:{...invite.data,mediaAssetId:id},updatedAt:stamp});
  return{id};
 }
 async submit(groupId:string,token:string,input:Record<string,unknown>){
  const invite=await this.verify(groupId,token,true),c=this.kernel.context.get(),usedId=String(invite.data.proposalId??'');
  if(usedId)return{id:usedId,state:'SUBMITTED',alreadySubmitted:true};
  const title=clean(input.title,140),headline=clean(input.headline,120),body=clean(input.body,1000),
   callToAction=clean(input.callToAction,60),destinationRef=clean(input.destinationRef,200),
   locality=clean(input.locality,100),goal=clean(input.objective,60);
  if(!title||!headline||!body||!callToAction||!safeDestination(destinationRef)||!objective.has(goal))throw Error('INVALID_PARTNER_AD_PROPOSAL');
  const owner='external_invite_'+invite.id,id='partner_ad_external_'+invite.id,stamp=new Date().toISOString();
  const row:WorkspaceRecord={id,tenantId:c.tenantId,groupId,moduleId:PROPOSAL,title,summary:headline,
   status:'ACTIVE',tags:['ads','external','proposal','SUBMITTED'],data:{proposalState:'SUBMITTED',headline,body,callToAction,destinationRef,
    locality,objective:goal,mediaAssetId:invite.data.mediaAssetId??'',campaignId:'',reviewNote:''},
   createdBy:owner,createdAt:stamp,updatedAt:stamp};
  await this.repo.saveWorkspaceRecord(row);
  await this.repo.saveWorkspaceRecord({...invite,data:{...invite.data,proposalId:id},updatedAt:stamp});
  await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:owner,action:'EXTERNAL_AD_PROPOSAL_SUBMITTED',
   targetType:'partner_ad',targetId:id,requestId:c.requestId,metadata:{groupId,inviteId:invite.id}}));
  return{id,state:'SUBMITTED'};
 }
}
