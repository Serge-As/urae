import type {Id,Membership,RubricDefinition,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';

export type MiscRubricKind='REGISTRATION'|'LOAN_STAMP'|'FINE'|'LOCAL_AID'|'HAND_RAISE'|'CUSTOM';
export type MiscLifecycle='EPHEMERAL'|'PERSISTENT'|'SESSION_ONLY';
export type MiscAmountMode='FIXED'|'VARIABLE';

export interface MiscRubricTemplate{
  id:Id;rubricId:Id;groupId:Id;kind:MiscRubricKind;name:string;description?:string;
  lifecycle:MiscLifecycle;amountMode:MiscAmountMode;defaultAmount?:number;currency:'XAF';
  activeFirstSessions?:number;status:'ACTIVE'|'ARCHIVED';createdAt:string;updatedAt:string;
}
export interface MiscPostingResult{template:MiscRubricTemplate;receiptId:Id;ledgerEntryId:Id;amount:number;currency:'XAF';}

const CATALOG='RUBRIC.MISC_CATALOG',POSTINGS='RUBRIC.MISC_POSTING';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const safe=(value:string)=>value.trim().replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,80);
const templateId=(groupId:string,kind:string)=>'misc_'+safe(groupId)+'_'+kind.toLowerCase();
const rubricId=(groupId:string,kind:string)=>'rubric_misc_'+safe(groupId)+'_'+kind.toLowerCase();

const parse=(r:WorkspaceRecord):MiscRubricTemplate=>({
  id:r.id,rubricId:String(r.data.rubricId),groupId:String(r.groupId??''),kind:String(r.data.kind) as MiscRubricKind,name:r.title,
  description:r.summary,lifecycle:String(r.data.lifecycle) as MiscLifecycle,amountMode:String(r.data.amountMode) as MiscAmountMode,
  defaultAmount:r.data.defaultAmount===null||r.data.defaultAmount===undefined?undefined:Number(r.data.defaultAmount),currency:'XAF',
  activeFirstSessions:r.data.activeFirstSessions===null||r.data.activeFirstSessions===undefined?undefined:Number(r.data.activeFirstSessions),
  status:r.status==='ARCHIVED'?'ARCHIVED':'ACTIVE',createdAt:r.createdAt,updatedAt:r.updatedAt
});

export class MiscRubricService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public ledger:LedgerService){}

  private async access(groupId:Id,manage=false):Promise<Membership|undefined>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');if(!member)throw Error('FORBIDDEN_SCOPE');
    if(manage&&!member.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return member;
  }
  private rubric(groupId:Id,id:Id,name:string,kind:MiscRubricKind,stamp:string):RubricDefinition{
    return{id,tenantId:this.kernel.context.get().tenantId,groupId,name,aliases:[],purpose:'Sous-rubrique regroupée sous « Autres » pour éviter la surcharge visuelle.',facets:{
      direction:'INFLOW',obligation:kind==='FINE'?'EVENT_DRIVEN':'OPTIONAL',medium:'CASH',refundability:'NON_REFUNDABLE',replenishment:'NONE',interestMode:'NONE',eligibilityMode:kind==='FINE'?'EVENT_BASED':'SELECTED_MEMBERS',
      custom:{miscRubric:true,miscKind:kind,visualContainer:'AUTRES'}
    },status:'ACTIVE',source:'GROUP_CUSTOM',version:1,createdAt:stamp,updatedAt:stamp};
  }
  private async saveTemplate(groupId:Id,input:{kind:MiscRubricKind;name:string;description?:string;lifecycle:MiscLifecycle;amountMode:MiscAmountMode;defaultAmount?:number;activeFirstSessions?:number;id?:Id;rubricId?:Id}):Promise<MiscRubricTemplate>{
    await this.access(groupId,true);const ctx=this.kernel.context.get(),stamp=now(),name=input.name.trim();if(!name)throw Error('MISC_RUBRIC_NAME_REQUIRED');
    if(input.defaultAmount!==undefined&&(!Number.isSafeInteger(input.defaultAmount)||input.defaultAmount<0))throw Error('INVALID_MISC_DEFAULT_AMOUNT');
    if(input.activeFirstSessions!==undefined&&(!Number.isSafeInteger(input.activeFirstSessions)||input.activeFirstSessions<1))throw Error('INVALID_MISC_SESSION_LIMIT');
    const id=input.id??makeId('misc'),rid=input.rubricId??makeId('rubric_misc');
    const existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id),record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:CATALOG,title:name,summary:input.description?.trim().slice(0,500),status:'ACTIVE',tags:['misc-rubric','container:AUTRES','kind:'+input.kind],data:{kind:input.kind,rubricId:rid,lifecycle:input.lifecycle,amountMode:input.amountMode,defaultAmount:input.defaultAmount??null,activeFirstSessions:input.activeFirstSessions??null,currency:'XAF'},createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    const existingRubric=await this.repo.getRubricDefinition(ctx.tenantId,groupId,rid);if(!existingRubric)await this.repo.saveRubricDefinition(this.rubric(groupId,rid,name,input.kind,stamp));
    return parse(record);
  }

  async ensureStarters(groupId:Id):Promise<MiscRubricTemplate[]>{
    await this.access(groupId,true);const ctx=this.kernel.context.get(),existing=await this.repo.listWorkspaceRecords(ctx.tenantId,CATALOG,groupId);
    const starters=[
      {kind:'REGISTRATION' as const,name:'Inscription',description:'Frais d’inscription généralement sollicités au démarrage du groupe.',lifecycle:'EPHEMERAL' as const,amountMode:'VARIABLE' as const,activeFirstSessions:3},
      {kind:'LOAN_STAMP' as const,name:'Timbre de prêt',description:'Timbre ou frais ponctuel lié à une opération de prêt.',lifecycle:'PERSISTENT' as const,amountMode:'VARIABLE' as const},
      {kind:'FINE' as const,name:'Amende',description:'Amende décidée selon les règles du groupe ou un événement de séance.',lifecycle:'PERSISTENT' as const,amountMode:'VARIABLE' as const}
    ];
    for(const s of starters){
      const id=templateId(groupId,s.kind);if(existing.some(x=>x.id===id))continue;
      await this.saveTemplate(groupId,{...s,id,rubricId:rubricId(groupId,s.kind)});
    }
    return this.list(groupId);
  }

  async createCustom(groupId:Id,input:{kind?:Extract<MiscRubricKind,'CUSTOM'|'LOCAL_AID'|'HAND_RAISE'>;name:string;description?:string;lifecycle?:MiscLifecycle;amountMode?:MiscAmountMode;defaultAmount?:number;activeFirstSessions?:number}){
    const kind=input.kind??'CUSTOM';
    return this.saveTemplate(groupId,{kind,name:input.name,description:input.description,lifecycle:input.lifecycle??'PERSISTENT',amountMode:input.amountMode??'VARIABLE',defaultAmount:input.defaultAmount,activeFirstSessions:input.activeFirstSessions});
  }

  async list(groupId:Id,meetingId?:Id):Promise<MiscRubricTemplate[]>{
    await this.access(groupId,false);const ctx=this.kernel.context.get(),all=(await this.repo.listWorkspaceRecords(ctx.tenantId,CATALOG,groupId)).map(parse).filter(x=>x.status==='ACTIVE');
    if(!meetingId)return all.sort((a,b)=>a.name.localeCompare(b.name));
    const meetings=(await this.repo.listMeetings(ctx.tenantId,groupId)).slice().sort((a,b)=>(a.scheduledAt??a.openedAt??'').localeCompare(b.scheduledAt??b.openedAt??''));
    const index=meetings.findIndex(m=>m.id===meetingId);if(index<0)throw Error('MEETING_NOT_FOUND');
    const sessionNo=index+1;
    return all.filter(x=>x.lifecycle!=='EPHEMERAL'||sessionNo<=(x.activeFirstSessions??1)).sort((a,b)=>a.name.localeCompare(b.name));
  }

  async postBatch(groupId:Id,input:{membershipId:Id;meetingId?:Id;items:Array<{templateId:Id;amount:number;note?:string}>;idempotencyKey:string}):Promise<MiscPostingResult[]>{
    await this.access(groupId,true);const ctx=this.kernel.context.get();if(!input.idempotencyKey.trim())throw Error('IDEMPOTENCY_KEY_REQUIRED');
    if(!Array.isArray(input.items)||!input.items.length||input.items.length>50)throw Error('INVALID_MISC_ITEMS');
    const available=await this.list(groupId,input.meetingId),byId=new Map(available.map(x=>[x.id,x]));
    for(const item of input.items){if(!byId.has(item.templateId))throw Error('MISC_RUBRIC_NOT_AVAILABLE');if(!Number.isSafeInteger(item.amount)||item.amount<=0)throw Error('INVALID_MISC_AMOUNT');}
    const results:MiscPostingResult[]=[];
    for(let i=0;i<input.items.length;i++){
      const item=input.items[i]!,template=byId.get(item.templateId)!;
      const receipt=await this.ledger.recordCashContribution({tenantId:ctx.tenantId,groupId,membershipId:input.membershipId,amount:item.amount,currency:'XAF',meetingId:input.meetingId,rubricId:template.rubricId,idempotencyKey:input.idempotencyKey+':'+i});
      const metadataId='misc_post_'+receipt.id,existing=await this.repo.getWorkspaceRecord(ctx.tenantId,metadataId);
      if(!existing)await this.repo.saveWorkspaceRecord({id:metadataId,tenantId:ctx.tenantId,groupId,moduleId:POSTINGS,title:template.name,summary:item.note?.trim().slice(0,500),status:'DONE',tags:['misc-posting','template:'+template.id,'receipt:'+receipt.id],data:{templateId:template.id,rubricId:template.rubricId,kind:template.kind,membershipId:input.membershipId,meetingId:input.meetingId??null,receiptId:receipt.id,ledgerEntryId:receipt.ledgerEntryId,amount:item.amount,currency:'XAF'},createdBy:ctx.actorId,createdAt:receipt.receivedAt,updatedAt:receipt.receivedAt});
      results.push({template,receiptId:receipt.id,ledgerEntryId:receipt.ledgerEntryId,amount:item.amount,currency:'XAF'});
    }
    return results;
  }

  async postings(groupId:Id,filters:{meetingId?:Id;membershipId?:Id}={}){
    await this.access(groupId,false);const ctx=this.kernel.context.get(),records=await this.repo.listWorkspaceRecords(ctx.tenantId,POSTINGS,groupId);
    return records.filter(r=>(!filters.meetingId||r.data.meetingId===filters.meetingId)&&(!filters.membershipId||r.data.membershipId===filters.membershipId)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }
}
