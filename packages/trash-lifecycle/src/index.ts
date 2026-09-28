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

  private async cleanupArtifacts(item:WorkspaceRecord,at:Date):Promise<boolean>{
    if(item.moduleId!=='TRASH.ARTIFACT_CLEANUP'||item.status!=='ACTIVE')return true;
    let keys=jsonArray(item.data.artifactKeysJson),done=new Set(jsonArray(item.data.completedKeysJson));
    if(!keys.length){await this.repo.saveWorkspaceRecord({...item,status:'DONE',data:{...item.data,artifactKeysJson:'[]',completedKeysJson:'[]',lastError:null},updatedAt:nowIso(at)});return true;}
    if(!this.artifacts||typeof this.artifacts.delete!=='function')return false;
    try{
      for(const key of keys){if(done.has(key))continue;await this.artifacts.delete(key);done.add(key);await this.repo.saveWorkspaceRecord({...item,data:{...item.data,completedKeysJson:JSON.stringify([...done]),lastError:null},updatedAt:nowIso(at)});}
      await this.repo.saveWorkspaceRecord({...item,status:'DONE',tags:[...new Set([...item.tags,'completed'])],data:{...item.data,artifactKeysJson:'[]',completedKeysJson:'[]',lastError:null,completedAt:nowIso(at)},updatedAt:nowIso(at)});return true;
    }catch(error){await this.repo.saveWorkspaceRecord({...item,status:'ACTIVE',tags:[...new Set([...item.tags,'retry-required'])],data:{...item.data,completedKeysJson:JSON.stringify([...done]),lastError:(error instanceof Error?error.message:'ARTIFACT_DELETE_FAILED').slice(0,300)},updatedAt:nowIso(at)});return false;}
  }

  async run(at=new Date()):Promise<TrashMaintenanceReport>{
    const report:TrashMaintenanceReport={scanned:0,remindersCreated:0,purged:0,blocked:0,errors:[]};
    const items=await this.repo.listTrashMaintenanceItems();
    // Finish previously committed artifact cleanup jobs first. Business purge has already won arbitration.
    for(const cleanup of items.filter(x=>x.moduleId==='TRASH.ARTIFACT_CLEANUP'&&x.status==='ACTIVE')){
      try{if(!await this.cleanupArtifacts(cleanup,at))report.blocked++;}catch(error){report.errors.push({trashId:cleanup.id,error:error instanceof Error?error.message:'UNKNOWN_ERROR'});}
    }
    for(const original of items){
      if(original.moduleId!=='TRASH.ITEM'||original.status!=='ACTIVE')continue;
      report.scanned++;
      let item=original;
      try{
        const expiry=Date.parse(String(item.data.restoreUntil??''));
        if(!Number.isFinite(expiry))throw new Error('INVALID_TRASH_EXPIRY');
        const now=at.getTime();

        if(expiry<=now){
          const kind=String(item.data.kind??'');
          if(kind!=='GROUP'){
            // For referenced member/meeting/rubric identities, expire the recoverable trash snapshot
            // without silently deleting ledger references that still point at the archived entity id.
            item={...item,status:'ARCHIVED',tags:[...new Set([...item.tags,'retention-expired','recovery-snapshot-purged'])],data:{...item.data,lifecycleState:'PURGED_RECOVERY_SNAPSHOT',snapshotJson:'',purgedAt:nowIso(at),restoreDisabled:true},updatedAt:nowIso(at)};
            await this.repo.saveWorkspaceRecord(item);report.purged++;continue;
          }
          const petitionState=String(item.data.petitionState??'');
          if(['THRESHOLD_REACHED','VERIFIED','RECONSTITUTION_READY'].includes(petitionState)){report.blocked++;continue;}
          const groupId=String(item.data.entityId??item.groupId??'');if(!groupId)throw new Error('GROUP_ID_REQUIRED');
          const manifest=await this.repo.captureGroupPurgeManifest(item.tenantId,groupId);
          // The D1 repository arbitrates petition vs purge and commits a durable R2 cleanup job
          // in the same transaction. R2 deletion must never happen before that arbitration.
          let purge;
          try{purge=await this.repo.purgeGroupData(manifest,item.id,nowIso(at));}catch(error){
            const current=await this.repo.getWorkspaceRecord(item.tenantId,item.id).catch(()=>undefined),state=String(current?.data.petitionState??'');
            if(['THRESHOLD_REACHED','VERIFIED','RECONSTITUTION_READY'].includes(state)){report.blocked++;continue;}
            throw error;
          }
          report.purged++;
          if(purge.artifactsPending>0){const cleanup=await this.repo.getWorkspaceRecord(item.tenantId,purge.artifactCleanupTaskId);if(cleanup&&!await this.cleanupArtifacts(cleanup,at))report.blocked++;}
          continue;
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
