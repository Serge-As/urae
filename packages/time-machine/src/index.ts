import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const managers=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const now=()=>new Date().toISOString();
const json=(v:unknown,max=160000)=>{const raw=JSON.stringify(v);if(raw.length>max)throw Error('TIME_MACHINE_SNAPSHOT_TOO_LARGE');return raw;};
const parse=<T>(v:unknown,fallback:T):T=>{try{return JSON.parse(String(v??'')) as T;}catch{return fallback;}};

export interface TimeMachineSnapshot{
 capturedAt:string;
 group:{id:Id;name:string;kind:string;governanceModel:string;status:string};
 counts:{members:number;activeMembers:number;rubrics:number;meetings:number;openMeetings:number;closedMeetings:number;ledgerEntries:number;receipts:number};
 finance:{currency:string;cashBalance:number;memberFundsLiability:number};
 rubrics:Array<{id:Id;name:string;version:number;status:string;kind?:string;direction?:string;obligation?:string}>;
 meetings:Array<{id:Id;status:string;scheduledAt?:string;openedAt?:string;closedAt?:string}>;
}

export class TimeMachineService{
 constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
 private ctx(){return this.kernel.context.get();}
 private async access(groupId:Id){
   const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
   if(g.createdBy===c.actorId)return g;
   const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
   if(!m||!m.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return g;
 }
 private async record(groupId:Id,id:Id){
   const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!=='DATA.TIME_MACHINE')throw Error('TIME_MACHINE_SNAPSHOT_NOT_FOUND');return r;
 }
 async capture(groupId:Id,input:{label?:string;reason:string}){
   const g=await this.access(groupId),c=this.ctx(),reason=String(input.reason??'').trim().slice(0,2000);if(!reason)throw Error('TIME_MACHINE_REASON_REQUIRED');
   const [members,rubrics,meetings,entries,receipts,accounts]=await Promise.all([
     this.repo.listMemberships(c.tenantId,groupId),this.repo.listRubricDefinitions(c.tenantId,groupId),this.repo.listMeetings(c.tenantId,groupId),this.repo.listLedgerEntries(c.tenantId,groupId),this.repo.listContributionReceipts(c.tenantId,groupId),this.repo.listLedgerAccounts(c.tenantId,groupId)
   ]);
   const currency=entries[0]?.currency??accounts[0]?.currency??'XAF',cashIds=new Set(accounts.filter(a=>a.code==='CASH'&&a.currency===currency).map(a=>a.id)),liabilityIds=new Set(accounts.filter(a=>a.code==='MEMBER_FUNDS_LIABILITY'&&a.currency===currency).map(a=>a.id));
   let cash=0,liability=0;for(const e of entries){for(const line of e.lines){if(cashIds.has(line.accountId))cash+=line.debit-line.credit;if(liabilityIds.has(line.accountId))liability+=line.credit-line.debit;}}
   const stamp=now(),snapshot:TimeMachineSnapshot={capturedAt:stamp,group:{id:g.id,name:g.name,kind:g.kind,governanceModel:g.governanceModel,status:g.status},counts:{members:members.length,activeMembers:members.filter(x=>x.status==='active').length,rubrics:rubrics.filter(x=>x.status==='ACTIVE').length,meetings:meetings.length,openMeetings:meetings.filter(x=>x.status==='open').length,closedMeetings:meetings.filter(x=>x.status==='closed').length,ledgerEntries:entries.length,receipts:receipts.length},finance:{currency,cashBalance:cash,memberFundsLiability:liability},rubrics:rubrics.map(r=>({id:r.id,name:r.name,version:r.version,status:r.status,kind:r.activityPlan?.kind,direction:r.facets?.direction,obligation:r.facets?.obligation})),meetings:meetings.map(m=>({id:m.id,status:m.status,scheduledAt:m.scheduledAt,openedAt:m.openedAt,closedAt:m.closedAt}))};
   const r:WorkspaceRecord={id:makeId('time_snapshot'),tenantId:c.tenantId,groupId,moduleId:'DATA.TIME_MACHINE',title:String(input.label??'').trim().slice(0,240)||'Snapshot · '+new Date(stamp).toLocaleString('fr-FR'),summary:reason.slice(0,1000),status:'DONE',tags:['time-machine','immutable','read-only'],data:{capturedAt:stamp,reason,snapshotJson:json(snapshot),readOnly:true,rollbackSupported:false,ledgerMutation:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
   await this.repo.saveWorkspaceRecord(r);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'TIME_MACHINE_SNAPSHOT_CAPTURED',targetType:'time_machine_snapshot',targetId:r.id,requestId:c.requestId,metadata:{groupId,capturedAt:stamp,ledgerEntries:entries.length}}));return r;
 }
 async list(groupId:Id){await this.access(groupId);const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId,'DATA.TIME_MACHINE',groupId)).sort((a,b)=>String(b.data.capturedAt??b.createdAt).localeCompare(String(a.data.capturedAt??a.createdAt)));}
 async get(groupId:Id,id:Id){await this.access(groupId);const r=await this.record(groupId,id);return{record:r,snapshot:parse<TimeMachineSnapshot|null>(r.data.snapshotJson,null)};}
 async compare(groupId:Id,fromId:Id,toId:Id){
   await this.access(groupId);const from=(await this.get(groupId,fromId)).snapshot,to=(await this.get(groupId,toId)).snapshot;if(!from||!to)throw Error('TIME_MACHINE_SNAPSHOT_INVALID');
   const fr=new Map(from.rubrics.map(x=>[x.id,x])),tr=new Map(to.rubrics.map(x=>[x.id,x]));
   const fm=new Map(from.meetings.map(x=>[x.id,x])),tm=new Map(to.meetings.map(x=>[x.id,x]));
   return{groupId,fromId,toId,fromAt:from.capturedAt,toAt:to.capturedAt,deltas:{members:to.counts.activeMembers-from.counts.activeMembers,rubrics:to.counts.rubrics-from.counts.rubrics,meetings:to.counts.meetings-from.counts.meetings,ledgerEntries:to.counts.ledgerEntries-from.counts.ledgerEntries,receipts:to.counts.receipts-from.counts.receipts,cashBalance:to.finance.cashBalance-from.finance.cashBalance,memberFundsLiability:to.finance.memberFundsLiability-from.finance.memberFundsLiability},rubrics:{added:to.rubrics.filter(x=>!fr.has(x.id)),removed:from.rubrics.filter(x=>!tr.has(x.id)),changed:to.rubrics.filter(x=>{const p=fr.get(x.id);return p&&JSON.stringify(p)!==JSON.stringify(x);})},meetings:{added:to.meetings.filter(x=>!fm.has(x.id)),statusChanged:to.meetings.filter(x=>{const p=fm.get(x.id);return p&&p.status!==x.status;})},readOnly:true,rollbackSupported:false};
 }
}
