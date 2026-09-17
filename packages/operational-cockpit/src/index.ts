import type {Id,Membership,WorkspaceRecord,RubricDefinition,Money} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';
import {makeId} from '../../contracts/src/index.js';

const MANAGERS=new Set(['founder','manager','admin','president','treasurer','auditor']);
const RECAP_CONFIG='RECAP.GLOBAL.CONFIG',RECAP_OVERRIDE='RECAP.GLOBAL.OVERRIDE';
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=160)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const hashColor=(value:string)=>{let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#9333ea','#4f46e5'][Math.abs(h)%8];};

export interface RecapColumnConfig{
  id:string;label:string;polarity:'POSITIVE'|'NEGATIVE';sourceRubricId?:Id;manualOnly?:boolean;description?:string;
}
export interface RecapLayout{columns:RecapColumnConfig[];version:number;updatedAt:string;updatedBy:Id;}
export interface RecapOverride{membershipId:Id;columnId:string;amount:number;reason:string;updatedAt:string;updatedBy:Id;}
export interface RecapCell{automaticAmount:number;displayAmount:number;manualOverride?:number;reason?:string;source:'RUBRIC'|'MANUAL_ONLY'|'NONE';}
export interface RecapMemberRow{membershipId:Id;displayName:string;cells:Record<string,RecapCell>;positiveTotal:number;negativeTotal:number;total:number;}
export interface MemberExerciseCell{rubricId:Id;inflow:number;outflow:number;net:number;}
export interface MemberExerciseRow{meetingId:Id;title:string;scheduledAt?:string;status:string;cells:Record<string,MemberExerciseCell>;total:number;}

const parseJson=<T>(v:unknown,fallback:T):T=>{try{return typeof v==='string'?JSON.parse(v) as T:fallback;}catch{return fallback;}};

export class OperationalCockpitService{
  constructor(private repo:PlatformRepository,private kernel:PlatformKernel,private ledger:LedgerService){}

  private async access(groupId:Id,membershipId?:Id,manage=false){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    const memberships=await this.repo.listMemberships(ctx.tenantId,groupId);
    const viewer=memberships.find(m=>m.userId===ctx.actorId&&m.status==='active');
    const manager=group.createdBy===ctx.actorId||Boolean(viewer?.roles.some(r=>MANAGERS.has(r)));
    if(!manager&&!viewer)throw Error('FORBIDDEN_SCOPE');
    if(manage&&!manager)throw Error('FORBIDDEN_SCOPE');
    let target:Membership|undefined;
    if(membershipId){target=memberships.find(m=>m.id===membershipId);if(!target)throw Error('MEMBERSHIP_NOT_FOUND');if(!manager&&target.userId!==ctx.actorId)throw Error('FORBIDDEN_SCOPE');}
    return{ctx,group,memberships,viewer,manager,target};
  }

  async memberSheet(groupId:Id,membershipId:Id){
    const {ctx,group,target}=await this.access(groupId,membershipId,false);if(!target)throw Error('MEMBERSHIP_NOT_FOUND');
    const [user,meetings,rubrics,statement,workspaces,obligations]=await Promise.all([
      this.repo.getUser(target.userId),this.repo.listMeetings(ctx.tenantId,groupId),this.repo.listRubricDefinitions(ctx.tenantId,groupId),
      this.ledger.memberStatement(ctx.tenantId,groupId,membershipId),
      this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId),this.repo.listObligations(ctx.tenantId,target.userId)
    ]);
    const expenses=workspaces.filter(x=>x.moduleId==='FINANCE.EXPENSE'&&String(x.data.membershipId??'')===membershipId).map(x=>({
      id:x.id,meetingId:x.data.meetingId?String(x.data.meetingId):undefined,rubricId:x.data.rubricId?String(x.data.rubricId):undefined,
      amount:Number(x.data.amount??0),label:x.title,scope:String(x.data.scope??'BACKOFFICE'),createdAt:x.createdAt
    }));
    const loans=workspaces.filter(x=>x.tags.includes('completion')&&x.data.completionKind==='LOAN'&&String(x.data.borrowerMembershipId??'')===membershipId);
    const tontines=workspaces.filter(x=>x.tags.includes('completion')&&x.data.completionKind==='TONTINE_SHARE'&&String(x.data.membershipId??'')===membershipId);
    const notices=workspaces.filter(x=>x.moduleId==='FINANCE.MEMBER_CONTROL'&&String(x.data.membershipId??'')===membershipId).map(x=>({
      id:x.id,operationType:String(x.data.operationType??''),amount:Number(x.data.amount??0),currency:String(x.data.currency??'XAF'),
      rubricId:x.data.rubricId?String(x.data.rubricId):undefined,meetingId:x.data.meetingId?String(x.data.meetingId):undefined,
      authorId:String(x.data.authorId??x.createdBy),authorRoles:parseJson<string[]>(x.data.authorRolesJson,[]),
      authorColor:hashColor(String(x.data.authorId??x.createdBy)),memberState:String(x.data.memberState??'NOTIFIED'),
      disputeState:String(x.data.disputeState??'NO_RESERVE'),createdAt:x.createdAt,updatedAt:x.updatedAt
    }));
    const profile=workspaces.find(x=>x.moduleId==='MEMBER.PROFILE'&&String(x.data.membershipId??'')===membershipId);
    const receipts=statement.receipts;
    const rows:MemberExerciseRow[]=meetings.slice().sort((a,b)=>(a.scheduledAt??a.openedAt).localeCompare(b.scheduledAt??b.openedAt)).map(meeting=>{
      const cells:Record<string,MemberExerciseCell>={};let total=0;
      for(const rubric of rubrics){
        const inflow=receipts.filter(x=>x.meetingId===meeting.id&&x.rubricId===rubric.id).reduce((n,x)=>n+Number(x.netAmount??0),0);
        const outflow=expenses.filter(x=>x.meetingId===meeting.id&&x.rubricId===rubric.id).reduce((n,x)=>n+x.amount,0);
        cells[rubric.id]={rubricId:rubric.id,inflow,outflow,net:inflow-outflow};total+=inflow-outflow;
      }
      return{meetingId:meeting.id,title:meeting.title,scheduledAt:meeting.scheduledAt,status:meeting.status,cells,total};
    });
    return{
      group:{id:group.id,name:group.name,kind:group.kind,currentExerciseLabel:group.currentExerciseLabel},
      membership:{...target,displayName:user?.displayName??target.userId},profile:profile?{title:profile.title,summary:profile.summary,data:profile.data,updatedAt:profile.updatedAt}:null,
      rubrics:rubrics.filter(r=>r.status!=='ARCHIVED').map(r=>({id:r.id,name:r.name,kind:r.activityPlan?.kind,status:r.status,policies:r.policies})),
      exerciseMatrix:rows,statement,loans,tontines,obligations:obligations.filter(x=>x.groupId===groupId),
      notices,generatedAt:now()
    };
  }

  async getRecapLayout(groupId:Id):Promise<RecapLayout>{
    const {ctx}=await this.access(groupId,undefined,true),id='recap_layout_'+groupId,record=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(record){
      const columns=parseJson<RecapColumnConfig[]>(record.data.columnsJson,[]);return{columns,version:Number(record.data.version??1),updatedAt:record.updatedAt,updatedBy:String(record.data.updatedBy??record.createdBy)};
    }
    const rubrics=(await this.repo.listRubricDefinitions(ctx.tenantId,groupId)).filter(r=>r.status==='ACTIVE');
    const columns:RecapColumnConfig[]=rubrics.slice(0,12).map(r=>({id:'rubric:'+r.id,label:r.name,polarity:'POSITIVE',sourceRubricId:r.id}));
    return{columns,version:0,updatedAt:now(),updatedBy:ctx.actorId};
  }

  async saveRecapLayout(groupId:Id,input:{columns:RecapColumnConfig[];expectedVersion?:number}):Promise<RecapLayout>{
    const {ctx}=await this.access(groupId,undefined,true);if(!Array.isArray(input.columns)||input.columns.length>80)throw Error('INVALID_RECAP_COLUMNS');
    const id='recap_layout_'+groupId,old=await this.repo.getWorkspaceRecord(ctx.tenantId,id),current=Number(old?.data.version??0);
    if(input.expectedVersion!==undefined&&Number(input.expectedVersion)!==current)throw Error('RECAP_LAYOUT_VERSION_CONFLICT');
    const columns=input.columns.map((c,i)=>{
      const label=clean(c.label);if(!label)throw Error('RECAP_COLUMN_LABEL_REQUIRED');
      const polarity=c.polarity;if(!['POSITIVE','NEGATIVE'].includes(polarity))throw Error('INVALID_RECAP_POLARITY');
      return{id:clean(c.id||'column_'+(i+1),120),label,polarity,sourceRubricId:c.sourceRubricId?clean(c.sourceRubricId,160):undefined,manualOnly:Boolean(c.manualOnly),description:clean(c.description,300)};
    });
    const version=current+1,stamp=now(),record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:RECAP_CONFIG,title:'Récapitulatif global',summary:'Colonnes positives, négatives et manuelles du récapitulatif.',status:'ACTIVE',tags:['recap','global','layout'],data:{columnsJson:JSON.stringify(columns),version,updatedBy:ctx.actorId},createdBy:old?.createdBy??ctx.actorId,createdAt:old?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'GLOBAL_RECAP_LAYOUT_UPDATED',targetType:'group',targetId:groupId,before:old?.data,after:{version,columns},requestId:ctx.requestId}));
    return{columns,version,updatedAt:stamp,updatedBy:ctx.actorId};
  }

  async setRecapOverride(groupId:Id,input:{membershipId:Id;columnId:string;amount:number|null;reason:string}){
    const {ctx,memberships}=await this.access(groupId,undefined,true),member=memberships.find(x=>x.id===input.membershipId);if(!member)throw Error('MEMBERSHIP_NOT_FOUND');
    const columnId=clean(input.columnId,120),reason=clean(input.reason,500);if(!columnId)throw Error('RECAP_COLUMN_REQUIRED');if(!reason)throw Error('RECAP_OVERRIDE_REASON_REQUIRED');
    if(input.amount!==null&&(!Number.isSafeInteger(input.amount)||input.amount<0))throw Error('INVALID_RECAP_OVERRIDE_AMOUNT');
    const id='recap_override_'+encodeURIComponent(groupId+'|'+member.id+'|'+columnId),old=await this.repo.getWorkspaceRecord(ctx.tenantId,id),stamp=now();
    if(input.amount===null){
      if(old)await this.repo.saveWorkspaceRecord({...old,status:'ARCHIVED',summary:reason,data:{...old.data,amount:null,reason,updatedBy:ctx.actorId},updatedAt:stamp});
    }else{
      await this.repo.saveWorkspaceRecord({id,tenantId:ctx.tenantId,groupId,moduleId:RECAP_OVERRIDE,title:'Override Récap',summary:reason,status:'ACTIVE',tags:['recap','override','member:'+member.id,'column:'+columnId],data:{membershipId:member.id,columnId,amount:input.amount,reason,updatedBy:ctx.actorId},createdBy:old?.createdBy??ctx.actorId,createdAt:old?.createdAt??stamp,updatedAt:stamp});
    }
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:input.amount===null?'GLOBAL_RECAP_OVERRIDE_CLEARED':'GLOBAL_RECAP_OVERRIDE_SET',targetType:'membership',targetId:member.id,before:old?.data,after:{columnId,amount:input.amount,reason},requestId:ctx.requestId}));
    return{membershipId:member.id,columnId,amount:input.amount,reason,updatedAt:stamp,updatedBy:ctx.actorId};
  }

  async globalRecap(groupId:Id){
    const {ctx,group,memberships}=await this.access(groupId,undefined,true);
    const [layout,rubrics,workspaces]=await Promise.all([this.getRecapLayout(groupId),this.repo.listRubricDefinitions(ctx.tenantId,groupId),this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)]);
    const overrides=workspaces.filter(x=>x.moduleId===RECAP_OVERRIDE&&x.status==='ACTIVE');
    const overrideMap=new Map(overrides.map(x=>[String(x.data.membershipId)+'|'+String(x.data.columnId),x]));
    const rows:RecapMemberRow[]=[];
    for(const membership of memberships.filter(x=>x.status!=='left')){
      const user=await this.repo.getUser(membership.userId),statement=await this.ledger.memberStatement(ctx.tenantId,groupId,membership.id),cells:Record<string,RecapCell>={};let positiveTotal=0,negativeTotal=0;
      for(const column of layout.columns){
        let automaticAmount=0,source:RecapCell['source']='NONE';
        if(column.sourceRubricId&&!column.manualOnly){automaticAmount=statement.receipts.filter(x=>x.rubricId===column.sourceRubricId).reduce((n,x)=>n+Number(x.netAmount??0),0);source='RUBRIC';}
        if(column.manualOnly)source='MANUAL_ONLY';
        const override=overrideMap.get(membership.id+'|'+column.id),manualOverride=override?.data.amount===null||override?.data.amount===undefined?undefined:Number(override.data.amount),displayAmount=manualOverride??automaticAmount;
        cells[column.id]={automaticAmount,displayAmount,manualOverride,reason:override?.summary,source};
        if(column.polarity==='POSITIVE')positiveTotal+=displayAmount;else negativeTotal+=displayAmount;
      }
      rows.push({membershipId:membership.id,displayName:user?.displayName??membership.userId,cells,positiveTotal,negativeTotal,total:positiveTotal-negativeTotal});
    }
    const backOfficeExpenses=workspaces.filter(x=>x.moduleId==='FINANCE.EXPENSE'&&x.data.scope==='BACKOFFICE').map(x=>({id:x.id,label:x.title,amount:Number(x.data.amount??0),meetingId:x.data.meetingId?String(x.data.meetingId):undefined,createdAt:x.createdAt}));
    const ledgerSummary=await this.ledger.summary(ctx.tenantId,groupId);
    return{group:{id:group.id,name:group.name,currentExerciseLabel:group.currentExerciseLabel},layout,rows,backOfficeExpenses,ledgerSummary,generatedAt:now()};
  }
}
