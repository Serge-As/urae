import type {D1DatabaseLike} from '../../../packages/repositories/src/index.js';
import {D1PlatformRepository} from '../../../packages/repositories/src/index.js';
import {PlatformKernel} from '../../../packages/platform-kernel/src/index.js';
import {LedgerService} from '../../../packages/domain/src/index.js';
import {MemberEnvelopeService} from '../../../packages/member-envelope/src/index.js';
import {NotificationService} from '../../../packages/notifications/src/index.js';

export type FinancialWorkMode='REUNION'|'HORS_REUNION';
export interface FinancialWorkStorage{
  get<T=unknown>(key:string):Promise<T|undefined>;put(key:string,value:unknown):Promise<void>;
  list<T=unknown>(options?:{prefix?:string;startAfter?:string;limit?:number}):Promise<Map<string,T>>;
  setAlarm?(at:number):Promise<void>;getAlarm?():Promise<number|null>;deleteAlarm?():Promise<void>;
}
export interface FinancialWorkContext{
  workSessionId:string;tenantId:string;groupId:string;meetingId:string;mode:FinancialWorkMode;modeVersion:number;
  changedAt:string;changedBy:string;paused:boolean;
}
interface Passage{
  id:string;meetingId:string;membershipId:string;actorId:string;deviceId:string;expiresAt:number;
  closeRequestedAt?:number;closed:boolean;terminalCommandIds:string[];reviewedValues?:Array<{rubricId:string;amount:number;cellVersion?:number}>;
}
interface Bundle{
  id:string;version:number;tenantId:string;groupId:string;meetingId:string;membershipId:string;userId:string;
  operationIds:string[];noticeIds:string[];rubricIds:string[];terminalCommands:string[];passageIds:string[];
  firstCommittedAt:number;lastCommittedAt:number;dueAt?:number;dispatched:boolean;partial?:boolean;retryAt?:number;retryAttempts?:number;sealed?:boolean;superseded?:boolean;
}
const id=()=>crypto.randomUUID();
const safe=(value:unknown)=>String(value??'').slice(0,240);
const distinct=(values:string[])=>[...new Set(values.filter(Boolean))];
const contextKey=(meetingId:string)=>'work:context:'+encodeURIComponent(meetingId);
const passageKey=(passageId:string)=>'work:passage:'+encodeURIComponent(passageId);
const bundleKey=(meetingId:string,membershipId:string)=>'work:bundle:'+encodeURIComponent(JSON.stringify([meetingId,membershipId]));

/** Coordination owned by GroupLiveHub. All financial values still originate
 * from Ledger/D1; this state controls attention and transport only. */
export class FinancialWorkCoordinator{
  constructor(private storage:FinancialWorkStorage,private clock:()=>number=Date.now){}
  async context(meetingId:string){return this.storage.get<FinancialWorkContext>(contextKey(meetingId));}
  async choose(input:{tenantId:string;groupId:string;meetingId:string;actorId:string;mode:FinancialWorkMode;expectedModeVersion?:number;requestChange?:boolean}){
    if(!['REUNION','HORS_REUNION'].includes(input.mode))throw Error('INVALID_WORK_MODE');
    const old=await this.context(input.meetingId);
    if(old&&(old.tenantId!==input.tenantId||old.groupId!==input.groupId))throw Error('WORK_SCOPE_MISMATCH');
    if(old&&!input.requestChange)return{context:old,joined:true,requestedMode:input.mode};
    if(old&&input.expectedModeVersion!==old.modeVersion)throw Error('WORK_MODE_CHANGED');
    const context:FinancialWorkContext={workSessionId:old?.workSessionId??id(),tenantId:input.tenantId,groupId:input.groupId,meetingId:input.meetingId,mode:input.mode,modeVersion:(old?.modeVersion??0)+1,changedAt:new Date(this.clock()).toISOString(),changedBy:input.actorId,paused:false};
    await this.storage.put(contextKey(input.meetingId),context);
    if(old&&old.mode!==context.mode){
      for(const [key,b] of await this.storage.list<Bundle>({prefix:'work:bundle:'}))if(b.meetingId===input.meetingId&&!b.dispatched){b.dueAt=context.mode==='REUNION'?undefined:this.clock()+120000;await this.storage.put(key,b);}
    }
    await this.schedule();return{context,joined:false};
  }
  async activity(input:{meetingId:string;membershipId:string;actorId:string;deviceId?:string;passageId?:string;meaningful?:boolean}){
    const passageId=safe(input.passageId)||['passage',input.actorId,input.deviceId??'',input.meetingId,input.membershipId].join(':'),key=passageKey(passageId),old=await this.storage.get<Passage>(key),now=this.clock();
    if(old&&(old.actorId!==input.actorId||old.meetingId!==input.meetingId||old.membershipId!==input.membershipId))throw Error('PASSAGE_SCOPE_MISMATCH');
    const p:Passage=old??{id:passageId,meetingId:input.meetingId,membershipId:input.membershipId,actorId:input.actorId,deviceId:input.deviceId??'',expiresAt:now+45000,closed:false,terminalCommandIds:[]};
    if(!old||input.meaningful){p.expiresAt=now+45000;p.closed=false;await this.storage.put(key,p);}
    const actors=new Set<string>();
    const all=[...(await this.storage.list<Passage>({prefix:'work:passage:'})).values()];
    for(const x of all)if(x.meetingId===input.meetingId&&!x.closed&&x.expiresAt>now)actors.add(x.actorId);
    await this.schedule();return{passageId,activeManagers:actors.size,proposeReunion:actors.size>=2&&(await this.context(input.meetingId))?.mode!=='REUNION'};
  }
  async terminal(input:{meetingId:string;membershipId:string;passageId?:string;actorId:string;commandId:string}){
    if(!input.passageId)return;
    const key=passageKey(input.passageId),p=await this.storage.get<Passage>(key);
    if(!p)return;
    if(p.meetingId!==input.meetingId||p.membershipId!==input.membershipId||p.actorId!==input.actorId)throw Error('PASSAGE_SCOPE_MISMATCH');
    p.terminalCommandIds=distinct(p.terminalCommandIds.concat(input.commandId));await this.storage.put(key,p);await this.schedule();
  }
  async operation(input:{tenantId:string;groupId:string;meetingId:string;membershipId:string;userId:string;actorId:string;operationId:string;noticeId?:string;rubricId:string;commandId?:string;passageId?:string;deviceId?:string}){
    const now=this.clock(),key=bundleKey(input.meetingId,input.membershipId),old=await this.storage.get<Bundle>(key);
    if(old?.operationIds.includes(input.operationId))return old;
    const context=await this.context(input.meetingId);
    if(context&&(context.tenantId!==input.tenantId||context.groupId!==input.groupId))throw Error('WORK_SCOPE_MISMATCH');
    if(old?.sealed&&!old.dispatched){old.superseded=true;await this.storage.put('work:delivery:'+old.id+':'+old.version,old);}
    const b:Bundle=old&&!old.dispatched&&!old.sealed?old:{id:old?.id??id(),version:(old?.version??0)+1,tenantId:input.tenantId,groupId:input.groupId,meetingId:input.meetingId,membershipId:input.membershipId,userId:input.userId,operationIds:[...(old?.operationIds??[])],noticeIds:[...(old?.noticeIds??[])],rubricIds:[...(old?.rubricIds??[])],terminalCommands:[...(old?.terminalCommands??[])],passageIds:[],firstCommittedAt:now,lastCommittedAt:now,dispatched:false};
    b.operationIds=distinct(b.operationIds.concat(input.operationId));b.noticeIds=distinct(b.noticeIds.concat(input.noticeId??''));b.rubricIds=distinct(b.rubricIds.concat(input.rubricId));b.terminalCommands=distinct(b.terminalCommands.concat(input.commandId??''));b.lastCommittedAt=now;
    let p= input.passageId?await this.storage.get<Passage>(passageKey(input.passageId)):undefined;
    if(!p){const active=await this.activity({meetingId:input.meetingId,membershipId:input.membershipId,actorId:input.actorId,deviceId:input.deviceId,passageId:input.passageId,meaningful:true});p=await this.storage.get<Passage>(passageKey(active.passageId));}
    if(p){b.passageIds=distinct(b.passageIds.concat(p.id));if(input.commandId){p.terminalCommandIds=distinct(p.terminalCommandIds.concat(input.commandId));await this.storage.put(passageKey(p.id),p);}}
    if(!context||context.mode==='HORS_REUNION')b.dueAt=Math.min(b.lastCommittedAt+120000,b.firstCommittedAt+180000);
    await this.storage.put(key,b);await this.schedule();return b;
  }
  async close(input:{meetingId:string;membershipId:string;actorId:string;passageId:string;terminalCommandIds?:string[];reviewedValues?:Passage['reviewedValues']}){
    const key=passageKey(input.passageId),old=await this.storage.get<Passage>(key),now=this.clock();
    if(old&&(old.actorId!==input.actorId||old.meetingId!==input.meetingId||old.membershipId!==input.membershipId))throw Error('PASSAGE_SCOPE_MISMATCH');
    const p:Passage=old??{id:input.passageId,meetingId:input.meetingId,membershipId:input.membershipId,actorId:input.actorId,deviceId:'',expiresAt:now+45000,closed:false,terminalCommandIds:[]};
    p.closeRequestedAt=now;p.closed=true;p.expiresAt=now;
    // Commands already received remain distinct from the closing manifest.
    const manifest=distinct(input.terminalCommandIds??[]);
    (p as Passage&{closingManifest?:string[]}).closingManifest=manifest;
    p.reviewedValues=input.reviewedValues;await this.storage.put(key,p);
    const b=await this.storage.get<Bundle>(bundleKey(input.meetingId,input.membershipId));
    if(b&&!b.dispatched){b.passageIds=distinct(b.passageIds.concat(p.id));await this.storage.put(bundleKey(b.meetingId,b.membershipId),b);}
    await this.schedule();return{closed:true,passageId:p.id};
  }
  async pause(meetingId:string,actorId:string){
    const context=await this.context(meetingId);if(context){context.paused=true;context.changedBy=actorId;await this.storage.put(contextKey(meetingId),context);}
    for(const p of (await this.storage.list<Passage>({prefix:'work:passage:'})).values())if(p.meetingId===meetingId&&!p.closed)await this.close({meetingId,membershipId:p.membershipId,actorId:p.actorId,passageId:p.id,terminalCommandIds:p.terminalCommandIds});
    await this.schedule();return context;
  }
  private async readiness(b:Bundle){
    const now=this.clock(),ps=await Promise.all(b.passageIds.map(x=>this.storage.get<Passage>(passageKey(x))));
    const active=ps.some(p=>p&&!p.closed&&p.expiresAt>now),closures=ps.filter(p=>p?.closeRequestedAt!==undefined) as Passage[];
    const missing=closures.some(p=>((p as Passage&{closingManifest?:string[]}).closingManifest??[]).some(x=>!p.terminalCommandIds.includes(x)&&!b.terminalCommands.includes(x)));
    const barrierAt=closures.length?Math.max(...closures.map(p=>Number(p.closeRequestedAt))):undefined;
    const idleExpired=!active&&ps.length>0,closed=!active&&closures.length>0;
    if(missing&&barrierAt!==undefined&&now<barrierAt+30000)return{ready:false,next:barrierAt+30000};
    if(!active&&(closed||idleExpired&&b.dueAt===undefined)){const due=(barrierAt??Math.max(...ps.filter(Boolean).map(p=>p!.expiresAt)))+500;return{ready:now>=due,next:due,partial:missing||!closed};}
    if(b.dueAt!==undefined&&now>=b.dueAt)return{ready:true,partial:active||missing};
    const expiries=ps.filter(p=>p&&!p.closed&&p.expiresAt>now).map(p=>p!.expiresAt);
    return{ready:false,next:Math.min(b.dueAt??Infinity,...expiries)};
  }
  async due(){
    const out:Bundle[]=[];
    for(const b of (await this.storage.list<Bundle>({prefix:'work:bundle:'})).values()){
      if(b.dispatched||b.superseded||b.retryAt&&this.clock()<b.retryAt)continue;const r=await this.readiness(b);
      if(r.ready){b.partial=Boolean(r.partial);b.sealed=true;await this.storage.put(bundleKey(b.meetingId,b.membershipId),b);await this.storage.put('work:delivery:'+b.id+':'+b.version,b);out.push(structuredClone(b));}
    }
    return out;
  }
  async delivered(b:Bundle){const key=bundleKey(b.meetingId,b.membershipId),now=await this.storage.get<Bundle>(key);if(now?.version===b.version){now.dispatched=true;now.partial=b.partial;now.retryAt=undefined;await this.storage.put(key,now);await this.storage.put('work:delivery:'+b.id+':'+b.version,now);}await this.schedule();}
  async deliveryFailed(b:Bundle){const key=bundleKey(b.meetingId,b.membershipId),now=await this.storage.get<Bundle>(key);if(now?.version===b.version){now.retryAttempts=(now.retryAttempts??0)+1;now.retryAt=this.clock()+Math.min(300000,1000*2**Math.min(now.retryAttempts,9));await this.storage.put(key,now);await this.storage.put('work:delivery:'+b.id+':'+b.version,now);}await this.schedule();}
  async schedule(){
    if(!this.storage.setAlarm)return;
    let next=Infinity;
    for(const b of (await this.storage.list<Bundle>({prefix:'work:bundle:'})).values())if(!b.dispatched){const r=await this.readiness(b);next=Math.min(next,b.retryAt??r.next??this.clock()+1000);}
    if(Number.isFinite(next)){const at=Math.max(this.clock()+10,next),existing=await this.storage.getAlarm?.();if(existing===null||existing===undefined||existing>at)await this.storage.setAlarm(at);}
    else await this.storage.deleteAlarm?.();
  }
}

/** NotificationService remains the only owner of alerts. The alarm is server
 * side; no open browser, per-second D1 polling or duplicated cash ledger. */
export async function deliverFinancialBundle(db:D1DatabaseLike,b:Bundle){
  const repo=new D1PlatformRepository(db),group=await repo.getGroup(b.tenantId,b.groupId);if(!group)throw Error('GROUP_NOT_FOUND');
  const kernel=new PlatformKernel();kernel.context.set({tenantId:b.tenantId,actorId:group.createdBy,activeGroupId:b.groupId,groupRoles:['founder'],mandateIds:[],deviceId:'server-financial-digest',sessionId:'server-financial-digest',requestId:id(),locale:'fr',timezone:'Africa/Douala',connectivity:'online'});
  const envelope=new MemberEnvelopeService(repo,kernel,new LedgerService(repo,kernel)),candidate=await envelope.passageSummary(b.groupId,b.meetingId,b.membershipId,b.rubricIds);
  if(candidate.userId!==b.userId)throw Error('BUNDLE_RECIPIENT_CHANGED');
  if(candidate.lines.some(x=>!x.noticeId||!b.noticeIds.includes(x.noticeId)))throw Error('BUNDLE_SOURCE_NOT_READY');
  const recordId='financial_bundle_'+b.id+'_v'+b.version,at=new Date().toISOString(),existing=await repo.getWorkspaceRecord(b.tenantId,recordId);
  const snapshot=existing?JSON.parse(String(existing.data.snapshotJson)):candidate;
  if(!existing)await repo.saveWorkspaceRecord({id:recordId,tenantId:b.tenantId,groupId:b.groupId,moduleId:'FINANCE.MEMBER_BUNDLE',title:'Synthèse privée de séance',summary:snapshot.meetingTitle,status:'DONE',tags:['member-bundle','member:'+b.membershipId],data:{bundleId:b.id,bundleVersion:b.version,membershipId:b.membershipId,userId:b.userId,meetingId:b.meetingId,snapshotJson:JSON.stringify(snapshot),operationIdsJson:JSON.stringify(b.operationIds),noticeIdsJson:JSON.stringify(b.noticeIds),partial:Boolean(b.partial),memberState:'NOTIFIED'},createdBy:group.createdBy,createdAt:at,updatedAt:at});
  const notification=await new NotificationService(repo,kernel).publish(b.groupId,{title:'Votre récapitulatif de séance est disponible',message:snapshot.meetingTitle+' · '+snapshot.lines.length+' rubriques regroupées. Consultez les montants enregistrés ; vous pouvez confirmer votre lecture ou contester une ligne.',channels:['IN_APP','WEB_PUSH'],audience:'SELECTED',selectedMembershipIds:[b.membershipId],priority:'NORMAL',idempotencyKey:'member-bundle:'+b.id+':v'+b.version,action:{view:'members',membershipId:b.membershipId,meetingId:b.meetingId,entityKind:'FINANCIAL_BUNDLE',entityId:recordId,label:'Voir ma synthèse'}});
  return{recordId,notificationId:notification.id,userId:b.userId,membershipId:b.membershipId,meetingId:b.meetingId,bundleId:b.id,bundleVersion:b.version,partial:Boolean(b.partial)};
}
