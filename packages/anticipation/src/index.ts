import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

export type AnticipationLevel='CERTAIN'|'VERY_PROBABLE'|'HISTORICAL_INFERENCE'|'OPPORTUNITY';
export interface AnticipationSignal{id:string;level:AnticipationLevel;kind:string;title:string;detail:string;sourceRefs:string[];suggestedAt?:string;humanValidated:false;}
const managers=new Set(['founder','manager','admin','president','treasurer','secretary']);
const now=()=>new Date().toISOString();

export class AnticipationService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private async access(groupId:Id,manage=false){
    const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
    if(g.createdBy===c.actorId)return g;
    const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m||manage&&!m.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return g;
  }
  private async record(groupId:Id,id:Id){const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!=='GROUP.ANTICIPATION')throw Error('ANTICIPATION_NOT_FOUND');return r;}
  async signals(groupId:Id):Promise<AnticipationSignal[]>{
    await this.access(groupId,false);const c=this.ctx(),[meetings,obligations]=await Promise.all([this.repo.listMeetings(c.tenantId,groupId),this.repo.listObligations(c.tenantId)]);
    const t=Date.now(),signals:AnticipationSignal[]=[];
    const future=meetings.filter(m=>m.status!=='cancelled'&&m.scheduledAt&&Date.parse(m.scheduledAt)>=t).sort((a,b)=>Date.parse(String(a.scheduledAt))-Date.parse(String(b.scheduledAt)));
    if(future[0])signals.push({id:'next-meeting:'+future[0].id,level:'CERTAIN',kind:'NEXT_MEETING',title:'Prochaine séance connue',detail:'Séance programmée le '+new Date(String(future[0].scheduledAt)).toLocaleString('fr-FR'),sourceRefs:[future[0].id],suggestedAt:future[0].scheduledAt,humanValidated:false});
    else signals.push({id:'no-future-meeting',level:'CERTAIN',kind:'NO_FUTURE_MEETING',title:'Aucune séance future programmée',detail:'Le calendrier actuel ne contient aucune séance future non annulée.',sourceRefs:[],humanValidated:false});
    const open=obligations.filter(o=>o.groupId===groupId&&(o.status==='open'||o.status==='overdue'));
    if(open.length)signals.push({id:'open-obligations',level:'CERTAIN',kind:'OPEN_OBLIGATIONS',title:open.length+' obligation(s) ouverte(s)',detail:open.filter(x=>x.status==='overdue').length+' en retard · '+open.length+' au total.',sourceRefs:open.map(x=>x.id),humanValidated:false});
    const historical=meetings.filter(m=>m.status==='closed'&&(m.scheduledAt||m.openedAt)).map(m=>({id:m.id,at:Date.parse(String(m.scheduledAt??m.openedAt))})).filter(x=>Number.isFinite(x.at)).sort((a,b)=>a.at-b.at);
    if(!future.length&&historical.length>=3){
      const gaps=[];for(let i=1;i<historical.length;i++)gaps.push(historical[i].at-historical[i-1].at);gaps.sort((a,b)=>a-b);const gap=gaps[Math.floor(gaps.length/2)];
      if(gap>86400000){const predicted=new Date(historical.at(-1)!.at+gap);if(predicted.getTime()>t)signals.push({id:'historical-cadence',level:'HISTORICAL_INFERENCE',kind:'MEETING_CADENCE',title:'Cadence historique à examiner',detail:'Les séances passées suggèrent une prochaine période autour du '+predicted.toLocaleDateString('fr-FR')+'. Ce n’est pas une séance programmée.',sourceRefs:historical.slice(-4).map(x=>x.id),suggestedAt:predicted.toISOString(),humanValidated:false});}
    }
    return signals;
  }
  async createDraft(groupId:Id){
    await this.access(groupId,true);const c=this.ctx(),signals=await this.signals(groupId),stamp=now(),r:WorkspaceRecord={id:makeId('anticipation'),tenantId:c.tenantId,groupId,moduleId:'GROUP.ANTICIPATION',title:'Anticipation · '+new Date(stamp).toLocaleDateString('fr-FR'),summary:'Brouillon de signaux déterministes à valider humainement.',status:'DRAFT',tags:['anticipation','state:DRAFT','no-ledger'],data:{anticipationState:'DRAFT',signalsJson:JSON.stringify(signals),generatedAt:stamp,humanValidated:false,ledgerMutation:false,meetingMutation:false,obligationCreation:false},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'ANTICIPATION_DRAFT_GENERATED',targetType:'workspace_record',targetId:r.id,requestId:c.requestId,metadata:{groupId,signalCount:signals.length}}));return r;
  }
  async validate(groupId:Id,id:Id){
    await this.access(groupId,true);const c=this.ctx(),r=await this.record(groupId,id);if(String(r.data.anticipationState)!=='DRAFT')throw Error('ANTICIPATION_NOT_DRAFT');
    const next:WorkspaceRecord={...r,status:'ACTIVE',tags:['anticipation','state:ACTIVE','human-validated','no-ledger'],data:{...r.data,anticipationState:'ACTIVE',humanValidated:true,validatedAt:now(),validatedBy:c.actorId,ledgerMutation:false,meetingMutation:false,obligationCreation:false},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async complete(groupId:Id,id:Id){
    await this.access(groupId,true);const c=this.ctx(),r=await this.record(groupId,id);if(String(r.data.anticipationState)!=='ACTIVE')throw Error('ANTICIPATION_NOT_ACTIVE');
    const next:WorkspaceRecord={...r,status:'DONE',tags:['anticipation','state:DONE','no-ledger'],data:{...r.data,anticipationState:'DONE',completedAt:now(),completedBy:c.actorId},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async archive(groupId:Id,id:Id){
    await this.access(groupId,true);const c=this.ctx(),r=await this.record(groupId,id),next:WorkspaceRecord={...r,status:'ARCHIVED',tags:['anticipation','state:ARCHIVED','no-ledger'],data:{...r.data,anticipationState:'ARCHIVED',archivedAt:now(),archivedBy:c.actorId},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async list(groupId:Id){await this.access(groupId,false);const c=this.ctx();return (await this.repo.listWorkspaceRecords(c.tenantId,'GROUP.ANTICIPATION',groupId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
}
