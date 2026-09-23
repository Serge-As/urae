import type {PlatformRepository} from '../../repositories/src/index.js';
import type {WorkspaceRecord,WorkspaceStatus} from '../../contracts/src/index.js';
import type {ArtifactStoreLike} from '../../imports/src/store.js';

export const addCalendarMonthsClamped=(input:Date,months:number)=>{
  const y=input.getUTCFullYear(),m=input.getUTCMonth()+months;
  const first=new Date(Date.UTC(y,m,1,input.getUTCHours(),input.getUTCMinutes(),input.getUTCSeconds(),input.getUTCMilliseconds()));
  const lastDay=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
  first.setUTCDate(Math.min(input.getUTCDate(),lastDay));
  return first;
};

const jsonArray=(value:unknown):string[]=>{
  try{const parsed=JSON.parse(String(value??'[]'));return Array.isArray(parsed)?parsed.map(String).filter(Boolean):[];}catch{return[];}
};
const monthKey=(date:Date)=>date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0');
const nowIso=(date:Date)=>date.toISOString();

export interface TrashMaintenanceReport{
  scanned:number;remindersCreated:number;purged:number;blocked:number;errors:Array<{trashId:string;error:string}>;
}

export class TrashLifecycleMaintenance{
  constructor(public repo:PlatformRepository,public artifacts?:ArtifactStoreLike){}

  private async systemReminder(item:WorkspaceRecord,at:Date):Promise<boolean>{
    const recipients=jsonArray(item.data.reminderRecipientUserIdsJson).filter(x=>!jsonArray(item.data.reminderOptOutUserIdsJson).includes(x));
    if(!recipients.length)return false;
    const key=monthKey(at),id='trash_reminder_'+encodeURIComponent(String(item.id)+'|'+key),existing=await this.repo.getWorkspaceRecord(item.tenantId,id);
    if(existing)return false;
    const restoreUntil=String(item.data.restoreUntil??''),createdAt=nowIso(at);
    const notice:WorkspaceRecord={
      id,tenantId:item.tenantId,groupId:item.groupId,moduleId:'NOTIFY.MESSAGE',
      title:'Rappel · groupe dans la corbeille',
      summary:`« ${item.title} » est toujours dans la corbeille. Restauration possible jusqu’au ${new Date(restoreUntil).toLocaleDateString('fr-FR',{timeZone:'UTC'})}.`,
      status:'ACTIVE',tags:['notification','trash-reminder','priority:HIGH'],
      data:{channelsJson:JSON.stringify(['IN_APP','WEB_PUSH']),audience:'SELECTED_USERS',selectedJson:'[]',selectedUsersJson:JSON.stringify(recipients),priority:'HIGH',deliveryJson:JSON.stringify({IN_APP:'AVAILABLE',WEB_PUSH:'PROVIDER_PENDING'}),actionJson:JSON.stringify({view:'trash',entityKind:'GROUP',entityId:String(item.data.entityId??item.groupId??''),label:'Voir le groupe supprimé'})},
      createdBy:'system_trash_maintenance',createdAt,updatedAt:createdAt
    };
    await this.repo.saveWorkspaceRecord(notice);return true;
  }

  async run(at=new Date()):Promise<TrashMaintenanceReport>{
    const report:TrashMaintenanceReport={scanned:0,remindersCreated:0,purged:0,blocked:0,errors:[]};
    const items=await this.repo.listTrashMaintenanceItems();
    for(const original of items){
      if(String(original.data.kind??'')!=='GROUP'||original.status!=='ACTIVE')continue;
      report.scanned++;
      let item=original;
      try{
        const expiry=Date.parse(String(item.data.restoreUntil??''));
        if(!Number.isFinite(expiry))throw new Error('INVALID_TRASH_EXPIRY');
        const now=at.getTime();

        if(expiry<=now){
          const petitionState=String(item.data.petitionState??'');
          if(['THRESHOLD_REACHED','VERIFIED','RECONSTITUTION_READY'].includes(petitionState)){
            report.blocked++;continue;
          }
          if(String(item.data.lifecycleState??'TRASHED')!=='PURGE_PENDING'){
            item={...item,data:{...item.data,lifecycleState:'PURGE_PENDING',purgeStartedAt:nowIso(at)},updatedAt:nowIso(at)};
            await this.repo.saveWorkspaceRecord(item);
          }
          const groupId=String(item.data.entityId??item.groupId??'');if(!groupId)throw new Error('GROUP_ID_REQUIRED');
          const manifest=await this.repo.captureGroupPurgeManifest(item.tenantId,groupId);
          if(manifest.artifactKeys.length&&(!this.artifacts||typeof this.artifacts.delete!=='function')){
            item={...item,data:{...item.data,purgeBlocked:'ARTIFACT_DELETE_UNAVAILABLE'},updatedAt:nowIso(at)};
            await this.repo.saveWorkspaceRecord(item);report.blocked++;continue;
          }
          let artifactFailure:string|undefined;
          for(const key of manifest.artifactKeys){
            try{await this.artifacts?.delete?.(key);}catch(error){artifactFailure=error instanceof Error?error.message:'ARTIFACT_DELETE_FAILED';break;}
          }
          if(artifactFailure){
            item={...item,data:{...item.data,purgeBlocked:'ARTIFACT_DELETE_FAILED',lastPurgeError:artifactFailure.slice(0,300)},updatedAt:nowIso(at)};
            await this.repo.saveWorkspaceRecord(item);report.blocked++;continue;
          }
          await this.repo.purgeGroupData(manifest,item.id,nowIso(at));report.purged++;continue;
        }

        const due=Date.parse(String(item.data.nextReminderAt??''));
        if(item.data.remindersEnabled!==false&&Number.isFinite(due)&&due<=now){
          if(await this.systemReminder(item,at))report.remindersCreated++;
          const next=addCalendarMonthsClamped(new Date(String(item.data.nextReminderAt)),1);
          item={...item,data:{...item.data,lastReminderAt:nowIso(at),nextReminderAt:next.toISOString()},updatedAt:nowIso(at)};
          await this.repo.saveWorkspaceRecord(item);
        }
      }catch(error){report.errors.push({trashId:item.id,error:error instanceof Error?error.message:'UNKNOWN_ERROR'});}
    }
    return report;
  }
}
