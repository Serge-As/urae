import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import {notificationIsQuiet} from './policy.js';
import * as reminders from './reminders.js';
export type {ReminderTarget,ReminderSource,ReminderResolver} from './reminders.js';

export type NotifyChannel='IN_APP'|'WEB_PUSH'|'EMAIL'|'SMS'|'WHATSAPP'|'TELEGRAM';
export interface NotificationPreferences {channels:Record<NotifyChannel,boolean>;quietHours?:{start:string;end:string;timezone?:string};snoozedUntil?:string;digest:'IMMEDIATE'|'DAILY'|'WEEKLY';updatedAt:string;}
export interface GroupNoticeAction {view:string;anchor?:string;meetingId?:Id;membershipId?:Id;rubricId?:Id;entityKind?:string;entityId?:Id;label?:string}
export interface GroupNotice {id:Id;groupId:Id;title:string;message:string;channels:NotifyChannel[];audience:'ALL_MEMBERS'|'MANAGERS'|'SELECTED'|'SELECTED_USERS';selectedMembershipIds:string[];selectedUserIds:string[];priority:'LOW'|'NORMAL'|'HIGH'|'CRITICAL';createdAt:string;createdBy:Id;delivery:Record<NotifyChannel,'AVAILABLE'|'MANUAL_SHARE'|'PROVIDER_PENDING'|'PROVIDER_CONFIRMED'>;action?:GroupNoticeAction;}
const PREF='NOTIFY.PREFERENCES',NOTICE='NOTIFY.MESSAGE',READ='NOTIFY.READ',ATTEMPT='NOTIFY.ATTEMPT';
const managerRoles=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const allChannels:NotifyChannel[]=['IN_APP','WEB_PUSH','EMAIL','SMS','WHATSAPP','TELEGRAM'];
const now=()=>new Date().toISOString();
const clean=(s:string,n=1000)=>s.trim().replace(/\s+/g,' ').slice(0,n);
const prefId=(userId:Id)=>'notify_pref_'+encodeURIComponent(userId);
const readId=(noticeId:Id,userId:Id)=>'notify_read_'+encodeURIComponent(noticeId+'|'+userId);
const validClock=(v:string)=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v);
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))).map(n=>n.toString(16).padStart(2,'0')).join('');
const decode=(r:WorkspaceRecord):GroupNotice=>({id:r.id,groupId:r.groupId!,title:r.title,message:r.summary??'',channels:JSON.parse(String(r.data.channelsJson??'[]')),audience:String(r.data.audience??'ALL_MEMBERS') as GroupNotice['audience'],selectedMembershipIds:JSON.parse(String(r.data.selectedJson??'[]')),selectedUserIds:JSON.parse(String(r.data.selectedUsersJson??'[]')),priority:String(r.data.priority??'NORMAL') as GroupNotice['priority'],createdAt:r.createdAt,createdBy:r.createdBy,delivery:JSON.parse(String(r.data.deliveryJson??'{}')),action:r.data.actionJson?JSON.parse(String(r.data.actionJson)):undefined});

export class NotificationService{
 constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  scheduleReminder(input:Parameters<typeof reminders.scheduleReminder>[2],resolve:reminders.ReminderResolver){return reminders.scheduleReminder(this.repo,this.kernel,input,resolve);}
  reminderInbox(resolve:reminders.ReminderResolver){return reminders.reminderInbox(this.repo,this.kernel,resolve);}
  dismissReminder(id:string,expectedVersion:number){return reminders.dismissReminder(this.repo,this.kernel,id,expectedVersion);}
 private async groupAccess(groupId:Id,manage=false){const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');if(group.createdBy===ctx.actorId)return{group,membership:(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active')};const membership=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');if(!membership||manage&&!membership.roles.some(r=>managerRoles.has(r)))throw Error('FORBIDDEN_SCOPE');return{group,membership};}
 private recipient(r:WorkspaceRecord,access:Awaited<ReturnType<NotificationService['groupAccess']>>){const ctx=this.kernel.context.get(),d=decode(r);if(d.audience==='ALL_MEMBERS')return true;if(d.audience==='MANAGERS')return access.group.createdBy===ctx.actorId||Boolean(access.membership?.roles.some(x=>managerRoles.has(x)));if(d.audience==='SELECTED_USERS')return d.selectedUserIds.includes(ctx.actorId);return Boolean(access.membership&&d.selectedMembershipIds.includes(access.membership.id));}
 private async noticeRecord(groupId:Id,id:Id){const access=await this.groupAccess(groupId),ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!==NOTICE||r.status!=='ACTIVE')throw Error('NOTICE_NOT_FOUND');if(!this.recipient(r,access))throw Error('FORBIDDEN_SCOPE');return{r,access};}
 async canReadRecord(r:WorkspaceRecord){try{const ctx=this.kernel.context.get();if(r.tenantId!==ctx.tenantId)return false;if(r.moduleId===NOTICE){await this.noticeRecord(r.groupId!,r.id);return true;}if(r.createdBy!==ctx.actorId)return false;if(r.moduleId===ATTEMPT){await this.noticeRecord(r.groupId!,String(r.data.noticeId));return true;}return [PREF,READ].includes(r.moduleId);}catch{return false;}}
 async preferences():Promise<NotificationPreferences>{const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,prefId(ctx.actorId));if(r){const raw=JSON.parse(String(r.data.channelsJson??'{}')) as Record<string,unknown>;return{channels:Object.fromEntries(allChannels.map(c=>[c,Boolean(raw?.[c])])) as NotificationPreferences['channels'],quietHours:r.data.quietHoursJson?JSON.parse(String(r.data.quietHoursJson)):undefined,snoozedUntil:r.data.snoozedUntil?String(r.data.snoozedUntil):undefined,digest:String(r.data.digest??'IMMEDIATE') as NotificationPreferences['digest'],updatedAt:r.updatedAt};}return{channels:{IN_APP:true,WEB_PUSH:true,EMAIL:false,SMS:false,WHATSAPP:false,TELEGRAM:false},digest:'IMMEDIATE',updatedAt:now()};}
 async savePreferences(input:{channels?:Partial<Record<NotifyChannel,boolean>>;quietHours?:NotificationPreferences['quietHours']|null;snoozedUntil?:string|null;digest?:NotificationPreferences['digest']}){
  const ctx=this.kernel.context.get(),current=await this.preferences(),stamp=now(),channels={...current.channels};
  for(const c of allChannels){const value=input.channels?.[c];if(value!==undefined){if(typeof value!=='boolean')throw Error('INVALID_NOTIFICATION_PREFERENCE');channels[c]=value;}}
  const digest=input.digest??current.digest;if(!['IMMEDIATE','DAILY','WEEKLY'].includes(digest))throw Error('INVALID_DIGEST');
  const quiet=input.quietHours===null?undefined:input.quietHours??current.quietHours;
  if(quiet){if(!validClock(quiet.start)||!validClock(quiet.end))throw Error('INVALID_QUIET_HOURS');try{new Intl.DateTimeFormat('en',{timeZone:quiet.timezone??ctx.timezone}).format();}catch{throw Error('INVALID_QUIET_TIMEZONE');}}
  const snooze=input.snoozedUntil===null?undefined:input.snoozedUntil??current.snoozedUntil;
  if(input.snoozedUntil&&(!Number.isFinite(Date.parse(input.snoozedUntil))||Date.parse(input.snoozedUntil)<=Date.now()||Date.parse(input.snoozedUntil)>Date.now()+30*86400000))throw Error('INVALID_SNOOZE');
  const id=prefId(ctx.actorId),old=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
  await this.repo.saveWorkspaceRecord({id,tenantId:ctx.tenantId,moduleId:PREF,title:'Notification preferences',summary:'User-controlled notification preferences',status:'ACTIVE',tags:['notifications','preferences'],data:{channelsJson:JSON.stringify(channels),quietHoursJson:quiet?JSON.stringify({...quiet,timezone:quiet.timezone??ctx.timezone}):null,snoozedUntil:snooze??null,digest},createdBy:old?.createdBy??ctx.actorId,createdAt:old?.createdAt??stamp,updatedAt:stamp});return this.preferences();
 }
 async publish(groupId:Id,input:{title:string;message:string;channels:NotifyChannel[];audience?:GroupNotice['audience'];selectedMembershipIds?:string[];selectedUserIds?:string[];priority?:GroupNotice['priority'];action?:GroupNoticeAction;idempotencyKey?:string;sourceEvent?:{id:string;version:number}}){
  await this.groupAccess(groupId,true);const ctx=this.kernel.context.get(),title=clean(input.title,160),message=clean(input.message,1500),channels=[...new Set(input.channels)].filter(c=>allChannels.includes(c));if(!title||!message||!channels.length)throw Error('INVALID_NOTICE');
  const selected=[...new Set(input.selectedMembershipIds??[])].sort(),selectedUsers=[...new Set(input.selectedUserIds??[])].sort(),audience=input.audience??'ALL_MEMBERS',priority=input.priority??'NORMAL';
  if(!['ALL_MEMBERS','MANAGERS','SELECTED','SELECTED_USERS'].includes(audience)||!['LOW','NORMAL','HIGH','CRITICAL'].includes(priority))throw Error('INVALID_NOTICE');if(audience==='SELECTED'&&!selected.length)throw Error('SELECTED_AUDIENCE_REQUIRED');if(audience==='SELECTED_USERS'&&!selectedUsers.length)throw Error('SELECTED_USERS_AUDIENCE_REQUIRED');
  const event=input.sourceEvent;if(event&&(!event.id?.trim()||event.id.length>500||!Number.isSafeInteger(event.version)||event.version<1))throw Error('INVALID_NOTIFICATION_EVENT');
  const stableKey=input.idempotencyKey?.trim(),id=event?'notice_event_'+await hash([ctx.tenantId,groupId,event.id,event.version]):stableKey?'notice_'+encodeURIComponent(JSON.stringify([groupId,stableKey])):makeId('notice');
  const action=input.action?{view:clean(input.action.view,80),anchor:input.action.anchor?clean(input.action.anchor,120):undefined,meetingId:input.action.meetingId?clean(input.action.meetingId,160):undefined,membershipId:input.action.membershipId?clean(input.action.membershipId,160):undefined,rubricId:input.action.rubricId?clean(input.action.rubricId,160):undefined,entityKind:input.action.entityKind?clean(input.action.entityKind,80):undefined,entityId:input.action.entityId?clean(input.action.entityId,160):undefined,label:input.action.label?clean(input.action.label,160):undefined}:undefined;
  const fingerprint=await hash([title,message,[...channels].sort(),audience,selected,selectedUsers,priority,action??null]);
  const existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(existing&&existing.groupId===groupId&&existing.moduleId===NOTICE){if(event&&existing.data.fingerprint!==fingerprint)throw Error('NOTIFICATION_EVENT_CONFLICT');return decode(existing);}
  const delivery=Object.fromEntries(channels.map(c=>[c,c==='IN_APP'?'AVAILABLE':c==='WEB_PUSH'?'PROVIDER_PENDING':'MANUAL_SHARE'])) as GroupNotice['delivery'],stamp=now();
  const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:NOTICE,title,summary:message,status:'ACTIVE',tags:['notification','priority:'+priority,...(stableKey||event?['idempotent']:[])],data:{channelsJson:JSON.stringify(channels),audience,selectedJson:JSON.stringify(selected),selectedUsersJson:JSON.stringify(selectedUsers),priority,deliveryJson:JSON.stringify(delivery),actionJson:action?JSON.stringify(action):null,idempotencyKey:stableKey??null,sourceEventId:event?.id??null,sourceVersion:event?.version??null,fingerprint},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
  const {record:stored,inserted}=await this.repo.insertNotificationRecord(record);if(event&&stored.data.fingerprint!==fingerprint)throw Error('NOTIFICATION_EVENT_CONFLICT');
  if(inserted)await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'GROUP_NOTICE_PUBLISHED',targetType:'notification',targetId:id,after:{channels,audience,delivery,idempotencyKey:stableKey??null},requestId:ctx.requestId}));return decode(stored);
 }
 async inbox(groupId:Id){const access=await this.groupAccess(groupId),ctx=this.kernel.context.get(),[rows,readRows]=await Promise.all([this.repo.listWorkspaceRecords(ctx.tenantId,NOTICE,groupId),this.repo.listWorkspaceRecords(ctx.tenantId,READ,groupId)]),reads=new Map(readRows.filter(x=>x.createdBy===ctx.actorId).map(x=>[String(x.data.noticeId),x.createdAt]));return rows.filter(r=>r.status==='ACTIVE'&&this.recipient(r,access)).map(r=>({...decode(r),read:reads.has(r.id),readAt:reads.get(r.id),sourceEventId:r.data.sourceEventId??r.data.idempotencyKey??r.id,sourceVersion:r.data.sourceVersion??null,businessState:'NOT_INFERRED'})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 async markRead(groupId:Id,noticeId:Id){await this.noticeRecord(groupId,noticeId);const ctx=this.kernel.context.get(),id=readId(noticeId,ctx.actorId),stamp=now();const {record:stored}=await this.repo.insertNotificationRecord({id,tenantId:ctx.tenantId,groupId,moduleId:READ,title:'Read receipt',summary:'Notification read',status:'DONE',tags:['notification-read'],data:{noticeId},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp});return{noticeId,read:true,readAt:stored.createdAt,businessState:'NOT_INFERRED'};}
 async resolveAction(groupId:Id,id:Id){
  const {r,access}=await this.noticeRecord(groupId,id),ctx=this.kernel.context.get(),action=decode(r).action;
  const manager=access.group.createdBy===ctx.actorId||Boolean(access.membership?.roles.some(role=>managerRoles.has(role)));
  if(action?.view==='trash'&&action.entityId&&['MEMBER','MEETING','GROUP','RUBRIC'].includes(String(action.entityKind))){
   const kind=String(action.entityKind),trash=await this.repo.getWorkspaceRecord(ctx.tenantId,'trash_'+encodeURIComponent(JSON.stringify([groupId,kind,action.entityId])));
   if(!trash||trash.moduleId!=='TRASH.ITEM'||trash.groupId!==groupId||trash.data.kind!==kind||trash.data.entityId!==action.entityId)throw Error('NOTIFICATION_ACTION_UNAVAILABLE');
   const allowed=kind==='GROUP'?access.group.createdBy===ctx.actorId||trash.data.deletedBy===ctx.actorId||JSON.parse(String(trash.data.eligibleUserIdsJson??'[]')).includes(ctx.actorId):manager;
   if(!allowed)throw Error('NOTIFICATION_ACTION_UNAVAILABLE');
   return{noticeId:id,groupId,action,authorizedAt:now(),readChanged:false,businessState:'NOT_INFERRED'};
  }
  if(!action?.view||access.group.status==='archived')throw Error('NOTIFICATION_ACTION_UNAVAILABLE');
  if(action.meetingId){const m=await this.repo.getMeeting(ctx.tenantId,groupId,action.meetingId);if(!m||m.status==='cancelled')throw Error('NOTIFICATION_ACTION_UNAVAILABLE');}
  if(action.membershipId){const m=await this.repo.getMembership(ctx.tenantId,groupId,action.membershipId);if(!m||m.status!=='active'||!manager&&m.userId!==ctx.actorId)throw Error('NOTIFICATION_ACTION_UNAVAILABLE');}
  if(action.rubricId){const rubric=await this.repo.getRubricDefinition(ctx.tenantId,groupId,action.rubricId);if(!rubric||rubric.status==='ARCHIVED')throw Error('NOTIFICATION_ACTION_UNAVAILABLE');}
  if(action.entityId){const kind=String(action.entityKind??'').toUpperCase();
   if(kind==='MEMBER'){const m=await this.repo.getMembership(ctx.tenantId,groupId,action.entityId);if(!m||m.status!=='active'||!manager&&m.userId!==ctx.actorId)throw Error('NOTIFICATION_ACTION_UNAVAILABLE');}
   else if(kind==='MEETING'){const m=await this.repo.getMeeting(ctx.tenantId,groupId,action.entityId);if(!m||m.status==='cancelled')throw Error('NOTIFICATION_ACTION_UNAVAILABLE');}
   else if(kind==='GROUP'){if(action.entityId!==groupId)throw Error('NOTIFICATION_ACTION_UNAVAILABLE');}
   else if(kind==='RUBRIC'){const x=await this.repo.getRubricDefinition(ctx.tenantId,groupId,action.entityId);if(!x||x.status==='ARCHIVED')throw Error('NOTIFICATION_ACTION_UNAVAILABLE');}
   else {const x=await this.repo.getWorkspaceRecord(ctx.tenantId,action.entityId);if(!x||x.groupId!==groupId||x.status==='ARCHIVED'||!manager&&x.createdBy!==ctx.actorId&&String(x.data.membershipId??'')!==access.membership?.id)throw Error('NOTIFICATION_ACTION_UNAVAILABLE');}
  }
  return{noticeId:id,groupId,action,authorizedAt:now(),readChanged:false,businessState:'NOT_INFERRED'};
 }
 async history(groupId:Id,id:Id){await this.noticeRecord(groupId,id);const ctx=this.kernel.context.get(),read=await this.repo.getWorkspaceRecord(ctx.tenantId,readId(id,ctx.actorId)),attempts=(await this.repo.listWorkspaceRecords(ctx.tenantId,ATTEMPT,groupId)).filter(x=>x.createdBy===ctx.actorId&&x.data.noticeId===id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,20);return{noticeId:id,readAt:read?.createdAt,attempts:attempts.map(x=>({id:x.id,state:x.data.state,channel:x.data.channel,createdAt:x.createdAt,transportOutcome:'NOT_CONFIRMED'})),businessState:'NOT_INFERRED'};}
 async recordAttempt(groupId:Id,id:Id,input:{idempotencyKey:string;state:string}){
  await this.noticeRecord(groupId,id);if(!['BROWSER_REQUESTED','PERMISSION_DENIED','UNAVAILABLE','FAILED'].includes(input.state))throw Error('INVALID_NOTIFICATION_ATTEMPT');if(!input.idempotencyKey?.trim()||input.idempotencyKey.length>200)throw Error('INVALID_NOTIFICATION_ATTEMPT_KEY');
  const ctx=this.kernel.context.get(),prefs=await this.preferences(),effective=input.state==='BROWSER_REQUESTED'&&(!prefs.channels.WEB_PUSH||notificationIsQuiet(prefs,new Date(),ctx.timezone))?'SUPPRESSED':input.state,at=now(),key='notice_attempt_'+await hash([ctx.tenantId,id,ctx.actorId,input.idempotencyKey]);
  const {record:stored}=await this.repo.insertNotificationRecord({id:key,tenantId:ctx.tenantId,groupId,moduleId:ATTEMPT,title:'Notification browser attempt',status:'DONE',tags:['notification-attempt'],data:{noticeId:id,state:effective,channel:'WEB_PUSH',requestedState:input.state,transportOutcome:'NOT_CONFIRMED',fingerprint:await hash([input.state])},createdBy:ctx.actorId,createdAt:at,updatedAt:at});
  if(stored.createdBy!==ctx.actorId||stored.data.requestedState!==input.state)throw Error('NOTIFICATION_ATTEMPT_CONFLICT');return{id:stored.id,state:stored.data.state,channel:'WEB_PUSH',transportOutcome:'NOT_CONFIRMED',businessState:'NOT_INFERRED'};
 }
}
