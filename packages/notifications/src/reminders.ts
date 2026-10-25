import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';

export type ReminderTarget={kind:'PLAN_STEP'|'JOB_SLOT'|'JOB_DEADLINE'|'CARE';id:string;partId?:string;};
export type ReminderSource={title:string;dueAt:string;anchor:string;action:{view:string;anchor?:string;entityId?:string;};};
export type ReminderResolver=(target:ReminderTarget)=>Promise<ReminderSource|null>;
const moduleId='NOTIFY.REMINDER';
const hash=async(v:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(x=>x.toString(16).padStart(2,'0')).join('');
function target(value:ReminderTarget){if(!value||!['PLAN_STEP','JOB_SLOT','JOB_DEADLINE','CARE'].includes(value.kind)||typeof value.id!=='string'||!value.id||value.id.length>180||value.partId!==undefined&&(typeof value.partId!=='string'||value.partId.length>180))throw Error('INVALID_REMINDER_TARGET');return{kind:value.kind,id:value.id,...(value.partId?{partId:value.partId}:{})};}
export async function scheduleReminder(repo:PlatformRepository,kernel:PlatformKernel,input:{target:ReminderTarget;minutesBefore:number;consent:boolean},resolve:ReminderResolver){
 const c=kernel.context.get();if(input.consent!==true||![0,15,60,1440].includes(input.minutesBefore))throw Error('REMINDER_CONSENT_REQUIRED');
 const t=target(input.target),source=await resolve(t);if(!source||Date.parse(source.dueAt)<=Date.now())throw Error('REMINDER_SOURCE_UNAVAILABLE');
 const at=new Date().toISOString(),dueAt=new Date(Math.max(Date.now(),Date.parse(source.dueAt)-input.minutesBefore*60000)).toISOString(),id='reminder_'+await hash([c.tenantId,c.actorId,t,source.anchor,input.minutesBefore]);
 const record:WorkspaceRecord={id,tenantId:c.tenantId,moduleId,title:'Private chosen reminder',status:'ACTIVE',tags:['notification-reminder','private'],createdBy:c.actorId,createdAt:at,updatedAt:at,data:{targetJson:JSON.stringify(t),sourceAnchor:source.anchor,minutesBefore:input.minutesBefore,dueAt,version:1,state:'SCHEDULED'}};
 const inserted=await repo.insertNotificationRecord(record);if(inserted.record.createdBy!==c.actorId||inserted.record.data.sourceAnchor!==source.anchor)throw Error('REMINDER_CONFLICT');
 return{id,state:inserted.record.data.state,dueAt:inserted.record.data.dueAt,version:Number(inserted.record.data.version),externalDelivery:'NOT_CONFIGURED',businessOutcome:'NOT_INFERRED'};
}
export async function reminderInbox(repo:PlatformRepository,kernel:PlatformKernel,resolve:ReminderResolver,clock=Date.now()){
 const c=kernel.context.get(),rows=(await repo.listWorkspaceRecords(c.tenantId,moduleId)).filter(r=>r.createdBy===c.actorId&&r.data.state==='SCHEDULED').sort((a,b)=>String(a.data.dueAt).localeCompare(String(b.data.dueAt))),items=[];
 for(const r of rows.slice(0,50)){
  let source:ReminderSource|null=null;try{source=await resolve(target(JSON.parse(String(r.data.targetJson))));}catch{}
  // Revocation removes both the title and action. A closed/cancelled source
  // cannot continue to remind, even when the stored reminder is still present.
  if(!source)continue;
  const changed=source.anchor!==r.data.sourceAnchor;
  items.push({id:r.id,version:Number(r.data.version),title:source.title,dueAt:String(r.data.dueAt),sourceDueAt:source.dueAt,state:changed?'SOURCE_CHANGED':Date.parse(String(r.data.dueAt))<=clock?'DUE':'SCHEDULED',action:changed?null:source.action,target:JSON.parse(String(r.data.targetJson)),externalDelivery:'NOT_CONFIGURED',businessOutcome:'NOT_INFERRED'});
 }
 return{items,limit:50,hasMore:rows.length>50,checkedAt:new Date(clock).toISOString(),deliveryMode:'ON_AUTHORIZED_INBOX_READ',backgroundPolling:false};
}
export async function dismissReminder(repo:PlatformRepository,kernel:PlatformKernel,id:string,expectedVersion:number){
 const c=kernel.context.get(),r=await repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!==moduleId||r.createdBy!==c.actorId)throw Error('REMINDER_NOT_FOUND');
 if(r.data.state==='DISMISSED')return{id,state:'DISMISSED',businessOutcome:'NOT_INFERRED'};
 if(expectedVersion!==Number(r.data.version))throw Error('REMINDER_VERSION_CONFLICT');
 await repo.commitWorkspaceRecordRevision({...r,updatedAt:new Date().toISOString(),data:{...r.data,state:'DISMISSED',version:expectedVersion+1}},expectedVersion);
 return{id,state:'DISMISSED',businessOutcome:'NOT_INFERRED'};
}
