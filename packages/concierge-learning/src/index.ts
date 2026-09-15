import type {Id, WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

export type DataUsePurpose='COLLECTIVE_LEARNING'|'COMMERCIAL_PERSONALIZATION'|'PARTNER_MATCHING'|'COMMUNITY_DISCOVERY';
export type LearningCategory='MEETING_RHYTHM'|'RUBRIC_PATTERN'|'OPERATING_PRACTICE'|'UX_PREFERENCE'|'MARKET_INTEREST'|'COMMUNITY_INTEREST'|'DOCUMENT_RULE'|'FINANCIAL_BALANCE'|'DEBT'|'HEALTH_ASSISTANCE'|'DISPUTE'|'IDENTITY'|'CONTACT';
export type MemoryVisibility='MEMBERS'|'MANAGERS';
export type MemoryPrivacy='GROUP_PRIVATE'|'GROUP_SHAREABLE';

export interface ConciergeMemoryCapsule {
  id:Id;groupId:Id;category:LearningCategory;key:string;value:string;sourceRef:string;
  evidenceSnippet?:string;confidence:number;privacy:MemoryPrivacy;visibility:MemoryVisibility;
  collectiveEligible:boolean;createdBy:Id;createdAt:string;updatedAt:string;version:number;
}
export interface GroupConsentProfile {groupId:Id;purposes:Record<DataUsePurpose,boolean>;version:number;updatedAt:string;updatedBy:Id;}
export interface SafeCollectiveSignal {
  groupCode:string;category:Extract<LearningCategory,'MEETING_RHYTHM'|'RUBRIC_PATTERN'|'OPERATING_PRACTICE'|'UX_PREFERENCE'|'MARKET_INTEREST'|'COMMUNITY_INTEREST'>;
  key:string;value:string;confidence:number;
}
export interface CollectiveDiscovery {category:SafeCollectiveSignal['category'];key:string;value:string;supportingGroups:number;averageConfidence:number;privacy:'K_ANONYMIZED';minGroupThreshold:number;}
export interface GroupConciergeProfile {
  groupCode:string;algorithmId:string;rulesFingerprint:string;memoryFingerprint:string;profileVersion:1;
  privateMemoryCount:number;shareableMemoryCount:number;memberVisibleCount:number;managerOnlyCount:number;
  preferenceKeys:string[];behaviorKeys:string[];confidenceAverage:number;generatedAt:string;
  modelPolicy:'RETRIEVAL_AND_RULES_NOT_AUTONOMOUS_FINANCE';
}

const MEMORY_MODULE='AI.GROUP_PRIVATE_MEMORY';
const CONSENT_MODULE='PRIVACY.DATA_USE_CONSENT';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const SAFE_COLLECTIVE=new Set<LearningCategory>(['MEETING_RHYTHM','RUBRIC_PATTERN','OPERATING_PRACTICE','UX_PREFERENCE','MARKET_INTEREST','COMMUNITY_INTEREST']);
const FORBIDDEN_COMMERCIAL=new Set<LearningCategory>(['DOCUMENT_RULE','FINANCIAL_BALANCE','DEBT','HEALTH_ASSISTANCE','DISPUTE','IDENTITY','CONTACT']);
const now=()=>new Date().toISOString();
const consentId=(groupId:Id)=>'data_use_consent_'+encodeURIComponent(groupId);
const memoryId=()=> 'memory_'+crypto.randomUUID();

const defaultConsent=(groupId:Id,actorId:Id):GroupConsentProfile=>({groupId,purposes:{COLLECTIVE_LEARNING:false,COMMERCIAL_PERSONALIZATION:false,PARTNER_MATCHING:false,COMMUNITY_DISCOVERY:false},version:1,updatedAt:now(),updatedBy:actorId});
const parseConsent=(r:WorkspaceRecord|undefined,groupId:Id,actorId:Id):GroupConsentProfile=>{
  if(!r)return defaultConsent(groupId,actorId);
  const raw=JSON.parse(String(r.data.purposesJson??'{}')) as Partial<Record<DataUsePurpose,boolean>>;
  return{groupId,purposes:{COLLECTIVE_LEARNING:Boolean(raw.COLLECTIVE_LEARNING),COMMERCIAL_PERSONALIZATION:Boolean(raw.COMMERCIAL_PERSONALIZATION),PARTNER_MATCHING:Boolean(raw.PARTNER_MATCHING),COMMUNITY_DISCOVERY:Boolean(raw.COMMUNITY_DISCOVERY)},version:Number(r.data.version??1),updatedAt:r.updatedAt,updatedBy:String(r.data.updatedBy??r.createdBy)};
};
const parseMemory=(r:WorkspaceRecord):ConciergeMemoryCapsule=>({
  id:r.id,groupId:String(r.groupId??''),category:String(r.data.category) as LearningCategory,key:String(r.data.key),value:String(r.data.value),sourceRef:String(r.data.sourceRef),
  evidenceSnippet:r.data.evidenceSnippet?String(r.data.evidenceSnippet):undefined,confidence:Number(r.data.confidence??0),privacy:String(r.data.privacy) as MemoryPrivacy,visibility:String(r.data.visibility) as MemoryVisibility,
  collectiveEligible:Boolean(r.data.collectiveEligible),createdBy:r.createdBy,createdAt:r.createdAt,updatedAt:r.updatedAt,version:Number(r.data.version??1)
});

export class ConciergeLearningService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private async membership(groupId:Id){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw new Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return{group,manager:true};
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member)throw new Error('FORBIDDEN_SCOPE');return{group,manager:member.roles.some(r=>managers.has(r))};
  }
  async consent(groupId:Id):Promise<GroupConsentProfile>{
    const ctx=this.kernel.context.get();await this.membership(groupId);
    return parseConsent(await this.repo.getWorkspaceRecord(ctx.tenantId,consentId(groupId)),groupId,ctx.actorId);
  }
  async setConsent(groupId:Id,purpose:DataUsePurpose,granted:boolean):Promise<GroupConsentProfile>{
    const ctx=this.kernel.context.get(),access=await this.membership(groupId);if(!access.manager)throw new Error('FORBIDDEN_SCOPE');
    const current=await this.consent(groupId),stamp=now(),next:GroupConsentProfile={...current,purposes:{...current.purposes,[purpose]:granted},version:current.version+1,updatedAt:stamp,updatedBy:ctx.actorId};
    const existing=await this.repo.getWorkspaceRecord(ctx.tenantId,consentId(groupId));
    await this.repo.saveWorkspaceRecord({id:consentId(groupId),tenantId:ctx.tenantId,groupId,moduleId:CONSENT_MODULE,title:'Consentements d’usage des données du groupe',summary:'Contrôle séparé de l’apprentissage collectif, personnalisation commerciale, partenaires et découverte communautaire.',status:'ACTIVE',tags:['privacy','consent','revocable'],data:{purposesJson:JSON.stringify(next.purposes),version:next.version,updatedBy:ctx.actorId},createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??stamp,updatedAt:stamp});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'GROUP_DATA_USE_CONSENT_UPDATED',targetType:'group',targetId:groupId,requestId:ctx.requestId,metadata:{purpose,granted,version:next.version}}));
    return next;
  }
  async learn(groupId:Id,input:{category:LearningCategory;key:string;value:string;sourceRef:string;evidenceSnippet?:string;confidence:number;privacy?:MemoryPrivacy;visibility?:MemoryVisibility}):Promise<ConciergeMemoryCapsule>{
    const ctx=this.kernel.context.get(),access=await this.membership(groupId);if(!access.manager)throw new Error('FORBIDDEN_SCOPE');
    const key=input.key.trim(),value=input.value.trim(),sourceRef=input.sourceRef.trim();if(!key||!value||!sourceRef)throw new Error('LEARNING_SOURCE_AND_VALUE_REQUIRED');
    if(!Number.isFinite(input.confidence)||input.confidence<0||input.confidence>1)throw new Error('INVALID_LEARNING_CONFIDENCE');
    const consent=await this.consent(groupId),privacy=input.privacy??'GROUP_PRIVATE';
    if(privacy==='GROUP_SHAREABLE'&&!SAFE_COLLECTIVE.has(input.category))throw new Error('CATEGORY_NOT_SHAREABLE');
    const collectiveEligible=privacy==='GROUP_SHAREABLE'&&consent.purposes.COLLECTIVE_LEARNING&&SAFE_COLLECTIVE.has(input.category);
    const stamp=now(),memory:ConciergeMemoryCapsule={id:memoryId(),groupId,category:input.category,key,value,sourceRef,evidenceSnippet:input.evidenceSnippet?.trim().slice(0,1000)||undefined,confidence:input.confidence,privacy,visibility:input.visibility??'MANAGERS',collectiveEligible,createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp,version:1};
    const record:WorkspaceRecord={id:memory.id,tenantId:ctx.tenantId,groupId,moduleId:MEMORY_MODULE,title:'Mémoire concierge · '+key,summary:'Connaissance sourcée et révocable propre au groupe.',status:'ACTIVE',tags:['concierge-memory','category:'+input.category,'privacy:'+privacy],data:{category:memory.category,key:memory.key,value:memory.value,sourceRef:memory.sourceRef,evidenceSnippet:memory.evidenceSnippet??null,confidence:memory.confidence,privacy:memory.privacy,visibility:memory.visibility,collectiveEligible:memory.collectiveEligible,version:1},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'CONCIERGE_MEMORY_LEARNED',targetType:'concierge_memory',targetId:memory.id,requestId:ctx.requestId,metadata:{groupId,category:memory.category,privacy:memory.privacy,collectiveEligible}}));
    return memory;
  }
  async memories(groupId:Id):Promise<ConciergeMemoryCapsule[]>{
    const ctx=this.kernel.context.get(),access=await this.membership(groupId);
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,MEMORY_MODULE,groupId)).map(parseMemory).filter(m=>access.manager||m.visibility==='MEMBERS').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  async safeCollectiveSignals(groupId:Id,groupCode:string):Promise<SafeCollectiveSignal[]>{
    const consent=await this.consent(groupId);if(!consent.purposes.COLLECTIVE_LEARNING)return[];
    return (await this.memories(groupId)).filter(m=>m.collectiveEligible&&SAFE_COLLECTIVE.has(m.category)).map(m=>({groupCode,category:m.category as SafeCollectiveSignal['category'],key:m.key,value:m.value,confidence:m.confidence}));
  }
  async commercialAffinities(groupId:Id):Promise<Array<{category:'MARKET_INTEREST'|'COMMUNITY_INTEREST';key:string;value:string}>>{
    const consent=await this.consent(groupId);if(!consent.purposes.COMMERCIAL_PERSONALIZATION)return[];
    return (await this.memories(groupId)).filter(m=>['MARKET_INTEREST','COMMUNITY_INTEREST'].includes(m.category)&&!FORBIDDEN_COMMERCIAL.has(m.category)).map(m=>({category:m.category as 'MARKET_INTEREST'|'COMMUNITY_INTEREST',key:m.key,value:m.value}));
  }
  async profile(groupId:Id,groupCode:string,rulesFingerprint:string):Promise<GroupConciergeProfile>{
    const memories=await this.memories(groupId),projection=memories.map(m=>({id:m.id,category:m.category,key:m.key,value:m.value,sourceRef:m.sourceRef,confidence:m.confidence,privacy:m.privacy,visibility:m.visibility,version:m.version})).sort((a,b)=>a.id.localeCompare(b.id));
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(projection)));
    const memoryFingerprint=[...new Uint8Array(digest)].slice(0,12).map(x=>x.toString(16).padStart(2,'0')).join('');
    const preferenceKeys=[...new Set(memories.filter(m=>['UX_PREFERENCE','MARKET_INTEREST','COMMUNITY_INTEREST'].includes(m.category)).map(m=>m.key))].sort();
    const behaviorKeys=[...new Set(memories.filter(m=>['MEETING_RHYTHM','RUBRIC_PATTERN','OPERATING_PRACTICE','DOCUMENT_RULE'].includes(m.category)).map(m=>m.key))].sort();
    const confidenceAverage=memories.length?Number((memories.reduce((n,m)=>n+m.confidence,0)/memories.length).toFixed(3)):0;
    return{groupCode,algorithmId:'CONCIERGE-DNA-'+groupCode+'-'+memoryFingerprint.slice(0,8),rulesFingerprint,memoryFingerprint,profileVersion:1,privateMemoryCount:memories.filter(m=>m.privacy==='GROUP_PRIVATE').length,shareableMemoryCount:memories.filter(m=>m.privacy==='GROUP_SHAREABLE').length,memberVisibleCount:memories.filter(m=>m.visibility==='MEMBERS').length,managerOnlyCount:memories.filter(m=>m.visibility==='MANAGERS').length,preferenceKeys,behaviorKeys,confidenceAverage,generatedAt:now(),modelPolicy:'RETRIEVAL_AND_RULES_NOT_AUTONOMOUS_FINANCE'};
  }

}

export const aggregateCollectiveLearning=(signals:SafeCollectiveSignal[],minGroups=5):CollectiveDiscovery[]=>{
  if(!Number.isSafeInteger(minGroups)||minGroups<3)throw new Error('MIN_GROUP_THRESHOLD_TOO_LOW');
  const buckets=new Map<string,SafeCollectiveSignal[]>();
  for(const signal of signals){if(!SAFE_COLLECTIVE.has(signal.category))continue;const k=JSON.stringify([signal.category,signal.key.trim().toLowerCase(),signal.value.trim().toLowerCase()]);buckets.set(k,[...(buckets.get(k)??[]),signal]);}
  const out:CollectiveDiscovery[]=[];
  for(const list of buckets.values()){const groups=new Set(list.map(x=>x.groupCode));if(groups.size<minGroups)continue;const first=list[0]!;out.push({category:first.category,key:first.key,value:first.value,supportingGroups:groups.size,averageConfidence:Number((list.reduce((n,x)=>n+x.confidence,0)/list.length).toFixed(3)),privacy:'K_ANONYMIZED',minGroupThreshold:minGroups});}
  return out.sort((a,b)=>b.supportingGroups-a.supportingGroups||a.key.localeCompare(b.key));
};