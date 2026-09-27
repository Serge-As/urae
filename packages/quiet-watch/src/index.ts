import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

type Severity='INFO'|'WATCH'|'HIGH'|'CRITICAL';
const managers=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=1000)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const safeJson=<T>(v:unknown,f:T):T=>{try{return JSON.parse(String(v??'')) as T;}catch{return f;}};

export class QuietWatchService{
 constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
 private ctx(){return this.kernel.context.get();}
 private async access(groupId:Id){
   const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
   if(g.createdBy===c.actorId)return g;const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
   if(!m||!m.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return g;
 }
 private signalKey(type:string,sourceId:string){return type+':'+sourceId;}
 private async existing(groupId:Id){const c=this.ctx();return this.repo.listWorkspaceRecords(c.tenantId,'SAFETY.QUIET_WATCH',groupId);}
 private async storeSignal(groupId:Id,input:{type:string;sourceId:string;title:string;summary:string;severity:Severity;evidenceRef:string}){
   const c=this.ctx(),key=this.signalKey(input.type,input.sourceId),rows=await this.existing(groupId),same=rows.find(x=>x.data.signalKey===key&&x.status!=='ARCHIVED'&&x.data.watchState!=='RESOLVED');if(same)return same;
   const stamp=now(),r:WorkspaceRecord={id:makeId('quiet_watch'),tenantId:c.tenantId,groupId,moduleId:'SAFETY.QUIET_WATCH',title:clean(input.title,240),summary:clean(input.summary,1500),status:'ACTIVE',tags:['quiet-watch','private-manager','state:DETECTED','severity:'+input.severity],data:{watchState:'DETECTED',signalKey:key,signalType:input.type,sourceId:input.sourceId,severity:input.severity,evidenceRef:clean(input.evidenceRef,500),publicAccusation:false,automaticSanction:false,automaticFinancialEffect:false,assistanceState:'NONE',assistancePlanJson:'[]',humanApprovalRequired:true},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
   await this.repo.saveWorkspaceRecord(r);return r;
 }
 async scan(groupId:Id){
   await this.access(groupId);const c=this.ctx(),[workspaces,obligations,cases,meetings]=await Promise.all([
     this.repo.listWorkspaceRecords(c.tenantId,undefined,groupId),this.repo.listObligations(c.tenantId),this.repo.listCases(c.tenantId),this.repo.listMeetings(c.tenantId,groupId)
   ]);let created=0;
   const add=async(x:Parameters<QuietWatchService['storeSignal']>[1])=>{const before=(await this.existing(groupId)).length;await this.storeSignal(groupId,x);if((await this.existing(groupId)).length>before)created++;};
   for(const r of workspaces){
     const kind=String(r.data.completionKind??''),state=String(r.data.completionState??r.status);
     if(['ANOMALY','CONFLICT'].includes(kind)&&!['RESOLVED','DISMISSED','REJECTED','CLOSED'].includes(state))await add({type:'DATA_'+kind,sourceId:r.id,title:kind==='ANOMALY'?'Anomalie à examiner':'Conflit à arbitrer',summary:r.summary??r.title,severity:kind==='ANOMALY'?'HIGH':'WATCH',evidenceRef:'workspace:'+r.id});
     if(r.moduleId==='FINANCE.MEMBER_CONTROL'&&String(r.data.disputeState??'NO_RESERVE')!=='NO_RESERVE'&&!['RESOLVED','CLOSED'].includes(String(r.data.disputeState??'')))await add({type:'MEMBER_RESERVE',sourceId:r.id,title:'Réserve membre ouverte',summary:'Une opération financière reste contestée ou réservée et demande une revue humaine.',severity:'HIGH',evidenceRef:'workspace:'+r.id});
     if(r.moduleId==='FINANCE.LIVE_PROJECTION'&&r.status==='ACTIVE'&&(r.tags.includes('pending')||r.tags.includes('retry-required')))await add({type:'LIVE_PROJECTION_PENDING',sourceId:r.id,title:'Diffusion financière en attente',summary:'Une projection validée n’a pas encore terminé sa diffusion Live.',severity:r.tags.includes('retry-required')?'HIGH':'WATCH',evidenceRef:'workspace:'+r.id});
   }
   for(const o of obligations.filter(x=>x.groupId===groupId&&['open','overdue'].includes(x.status))){const overdue=o.status==='overdue'||Boolean(o.dueAt&&Date.parse(o.dueAt)<Date.now());if(overdue)await add({type:'OVERDUE_OBLIGATION',sourceId:o.id,title:'Échéance dépassée',summary:o.title,severity:o.priority==='critical'?'CRITICAL':'WATCH',evidenceRef:'obligation:'+o.id});}
   for(const x of cases.filter(x=>x.groupId===groupId&&!['CLOSED','RESOLVED'].includes(x.status)))await add({type:'OPEN_CASE',sourceId:x.id,title:'Dossier ouvert à suivre',summary:x.summary,severity:'WATCH',evidenceRef:'case:'+x.id});
   for(const m of meetings){const at=Date.parse(m.scheduledAt??m.openedAt),stale=m.status==='open'&&Number.isFinite(at)&&Date.now()-at>36*3600000;if(stale)await add({type:'STALE_OPEN_MEETING',sourceId:m.id,title:'Séance ouverte depuis longtemps',summary:'La séance reste ouverte plus de 36 h après son horaire de référence. Vérifiez qu’elle ne doit pas être clôturée.',severity:'WATCH',evidenceRef:'meeting:'+m.id});}
   return{created,signals:await this.list(groupId),guardrails:{privateManagersOnly:true,publicAccusation:false,automaticSanction:false,automaticFinancialEffect:false}};
 }
 async list(groupId:Id){await this.access(groupId);const rows=await this.existing(groupId);return rows.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
 private async get(groupId:Id,id:Id){await this.access(groupId);const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!=='SAFETY.QUIET_WATCH')throw Error('QUIET_WATCH_ITEM_NOT_FOUND');return r;}
 async acknowledge(groupId:Id,id:Id,note=''){
   const c=this.ctx(),r=await this.get(groupId,id);if(String(r.data.watchState)==='RESOLVED')return r;const next={...r,tags:[...new Set(r.tags.filter(x=>!x.startsWith('state:')).concat('state:TRIAGED'))],data:{...r.data,watchState:'TRIAGED',triagedBy:c.actorId,triagedAt:now(),triageNote:clean(note,800)},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
 }
 async proposeAssistance(groupId:Id,id:Id,input:{objective:string;steps:string[];participants?:string[]}){
   const c=this.ctx(),r=await this.get(groupId,id),objective=clean(input.objective,800),steps=[...new Set(input.steps.map(x=>clean(x,500)).filter(Boolean))].slice(0,12);if(!objective||!steps.length)throw Error('ASSISTANCE_PLAN_REQUIRED');
   const participants=[...new Set((input.participants??[]).map(x=>clean(x,120)).filter(Boolean))].slice(0,20),next={...r,data:{...r.data,assistanceState:'PROPOSED',assistanceObjective:objective,assistancePlanJson:JSON.stringify(steps),assistanceParticipantsJson:JSON.stringify(participants),assistanceProposedBy:c.actorId,assistanceProposedAt:now(),humanApprovalRequired:true},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
 }
 async approveAssistance(groupId:Id,id:Id){
   const c=this.ctx(),r=await this.get(groupId,id);if(String(r.data.assistanceState)!=='PROPOSED')throw Error('ASSISTANCE_NOT_PROPOSED');
   const next={...r,data:{...r.data,assistanceState:'APPROVED',assistanceApprovedBy:c.actorId,assistanceApprovedAt:now()},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
 }
 async resolve(groupId:Id,id:Id,input:{note:string;evidenceRef:string}){
   const c=this.ctx(),r=await this.get(groupId,id),note=clean(input.note,1200),evidenceRef=clean(input.evidenceRef,500);if(!note||!evidenceRef)throw Error('QUIET_WATCH_RESOLUTION_EVIDENCE_REQUIRED');
   const next={...r,status:'DONE' as const,tags:[...new Set(r.tags.filter(x=>!x.startsWith('state:')).concat('state:RESOLVED'))],data:{...r.data,watchState:'RESOLVED',resolvedBy:c.actorId,resolvedAt:now(),resolutionNote:note,resolutionEvidenceRef:evidenceRef},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
   await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'QUIET_WATCH_RESOLVED',targetType:'workspace_record',targetId:id,requestId:c.requestId,metadata:{groupId,evidenceRef}}));return next;
 }
}
