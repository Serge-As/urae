import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';

export type ConsensusState='COLLECTING'|'DIVERGENT'|'MAJORITY_SELECTED'|'UNANIMOUS'|'RESERVE_OPEN';
export interface ManagerProposal {actorId:string;value:string;label:string;color:string;submittedAt:string;}
export interface ManagerVote {actorId:string;proposalActorId:string;votedAt:string;}
export interface LiveConsensus {
  id:string;groupId:string;meetingId:string;cellKey:string;membershipId?:string;rubricId?:string;
  proposals:ManagerProposal[];votes:ManagerVote[];state:ConsensusState;selectedValue?:string;selectedProposalActorId?:string;
  dissentingActorIds:string[];version:number;createdAt:string;updatedAt:string;
}

const MODULE='MEETING.LIVE_CONSENSUS';
const MANAGER_ROLES=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const PALETTE=['#2563eb','#16a34a','#9333ea','#ea580c','#0891b2','#be123c','#4f46e5','#0f766e'];
const now=()=>new Date().toISOString();
const stableColor=(actorId:string)=>{let h=0;for(const c of actorId)h=(h*31+c.charCodeAt(0))>>>0;return PALETTE[h%PALETTE.length]!;};
const idFor=(groupId:string,meetingId:string,cellKey:string)=>'live_consensus_'+encodeURIComponent(JSON.stringify([groupId,meetingId,cellKey]));
const clean=(v:unknown)=>String(v??'').trim().slice(0,500);

const parse=(r:WorkspaceRecord):LiveConsensus=>{
  const d=r.data;
  return {id:r.id,groupId:String(r.groupId??''),meetingId:String(d.meetingId??''),cellKey:String(d.cellKey??''),membershipId:d.membershipId?String(d.membershipId):undefined,rubricId:d.rubricId?String(d.rubricId):undefined,
    proposals:JSON.parse(String(d.proposalsJson??'[]')) as ManagerProposal[],votes:JSON.parse(String(d.votesJson??'[]')) as ManagerVote[],state:String(d.state??'COLLECTING') as ConsensusState,
    selectedValue:d.selectedValue===null||d.selectedValue===undefined?undefined:String(d.selectedValue),selectedProposalActorId:d.selectedProposalActorId?String(d.selectedProposalActorId):undefined,
    dissentingActorIds:JSON.parse(String(d.dissentingActorIdsJson??'[]')) as string[],version:Number(d.version??1),createdAt:r.createdAt,updatedAt:r.updatedAt};
};
const data=(x:LiveConsensus):WorkspaceRecord['data']=>({meetingId:x.meetingId,cellKey:x.cellKey,membershipId:x.membershipId??null,rubricId:x.rubricId??null,proposalsJson:JSON.stringify(x.proposals),votesJson:JSON.stringify(x.votes),state:x.state,selectedValue:x.selectedValue??null,selectedProposalActorId:x.selectedProposalActorId??null,dissentingActorIdsJson:JSON.stringify(x.dissentingActorIds),version:x.version});

export class MeetingLiveConsensusService{
  constructor(private repo:PlatformRepository,private kernel:PlatformKernel){}
  private async managerIds(groupId:string):Promise<string[]>{
    const ctx=this.kernel.context.get(),g=await this.repo.getGroup(ctx.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
    const ids=new Set<string>([g.createdBy]);
    for(const m of await this.repo.listMemberships(ctx.tenantId,groupId))if(m.status==='active'&&m.roles.some(r=>MANAGER_ROLES.has(r)))ids.add(m.userId);
    return [...ids];
  }
  private async requireManager(groupId:string){
    const ctx=this.kernel.context.get(),ids=await this.managerIds(groupId);
    if(!ids.includes(ctx.actorId))throw Error('MANAGER_REQUIRED');
  }
  private async save(x:LiveConsensus,action:string){
    const ctx=this.kernel.context.get(),existing=await this.repo.getWorkspaceRecord(ctx.tenantId,x.id);
    const record:WorkspaceRecord={id:x.id,tenantId:ctx.tenantId,groupId:x.groupId,moduleId:MODULE,title:'Consensus de saisie en direct',summary:x.state,status:x.state==='UNANIMOUS'?'DONE':'ACTIVE',tags:['meeting-live','multi-manager','consensus',...(x.state==='RESERVE_OPEN'?['contentieux']:[])],data:data(x),createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??x.createdAt,updatedAt:x.updatedAt};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action,targetType:'meeting_live_consensus',targetId:x.id,requestId:ctx.requestId,metadata:{meetingId:x.meetingId,cellKey:x.cellKey,state:x.state,version:x.version}}));
    return structuredClone(x);
  }
  async submit(input:{groupId:string;meetingId:string;cellKey:string;value:unknown;label?:string;membershipId?:string;rubricId?:string}){
    await this.requireManager(input.groupId);const ctx=this.kernel.context.get(),id=idFor(input.groupId,input.meetingId,input.cellKey),existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id),stamp=now(),managerIds=await this.managerIds(input.groupId);
    const x:LiveConsensus=existing?parse(existing):{id,groupId:input.groupId,meetingId:input.meetingId,cellKey:input.cellKey,membershipId:input.membershipId,rubricId:input.rubricId,proposals:[],votes:[],state:'COLLECTING',dissentingActorIds:[],version:0,createdAt:stamp,updatedAt:stamp};
    const proposal:ManagerProposal={actorId:ctx.actorId,value:clean(input.value),label:clean(input.label||ctx.actorId),color:stableColor(ctx.actorId),submittedAt:stamp};
    x.proposals=[...x.proposals.filter(p=>p.actorId!==ctx.actorId),proposal];x.votes=x.votes.filter(v=>v.actorId!==ctx.actorId);x.version++;x.updatedAt=stamp;
    const actual=x.proposals.filter(p=>managerIds.includes(p.actorId)),values=new Set(x.proposals.map(p=>p.value));
    x.selectedValue=undefined;x.selectedProposalActorId=undefined;
    x.state=values.size>1?'DIVERGENT':actual.length>=managerIds.length&&managerIds.length>0?'UNANIMOUS':'COLLECTING';
    if(x.state==='UNANIMOUS'){x.selectedValue=proposal.value;x.selectedProposalActorId=proposal.actorId;x.dissentingActorIds=[];}
    return this.save(x,'LIVE_MANAGER_PROPOSAL_SUBMITTED');
  }

  async proposeAgainstBaseline(input:{groupId:string;meetingId:string;cellKey:string;value:unknown;baselineValue:unknown;baselineActorId?:string;label?:string;membershipId?:string;rubricId?:string}){
    await this.requireManager(input.groupId);const ctx=this.kernel.context.get(),id=idFor(input.groupId,input.meetingId,input.cellKey),existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id),stamp=now();
    if(clean(input.value)===clean(input.baselineValue))return this.submit({groupId:input.groupId,meetingId:input.meetingId,cellKey:input.cellKey,value:input.value,label:input.label,membershipId:input.membershipId,rubricId:input.rubricId});
    const x:LiveConsensus=existing?parse(existing):{id,groupId:input.groupId,meetingId:input.meetingId,cellKey:input.cellKey,membershipId:input.membershipId,rubricId:input.rubricId,proposals:[],votes:[],state:'COLLECTING',dissentingActorIds:[],version:0,createdAt:stamp,updatedAt:stamp};
    const baselineId='baseline:'+clean(input.baselineActorId||'ledger'),baseline:ManagerProposal={actorId:baselineId,value:clean(input.baselineValue),label:'Valeur canonique actuelle',color:stableColor(baselineId),submittedAt:stamp};
    const proposal:ManagerProposal={actorId:ctx.actorId,value:clean(input.value),label:clean(input.label||ctx.actorId),color:stableColor(ctx.actorId),submittedAt:stamp};
    x.proposals=[...x.proposals.filter(p=>p.actorId!==ctx.actorId&&!p.actorId.startsWith('baseline:')),baseline,proposal];
    x.votes=x.votes.filter(v=>v.actorId!==ctx.actorId);x.state='DIVERGENT';x.selectedValue=undefined;x.selectedProposalActorId=undefined;x.dissentingActorIds=[];x.version++;x.updatedAt=stamp;
    return this.save(x,'LIVE_MANAGER_CORRECTION_PROPOSED_AGAINST_BASELINE');
  }
  async vote(groupId:string,meetingId:string,cellKey:string,proposalActorId:string){
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),id=idFor(groupId,meetingId,cellKey),record=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!record)throw Error('LIVE_CONSENSUS_NOT_FOUND');
    const x=parse(record),candidate=x.proposals.find(p=>p.actorId===proposalActorId);if(!candidate)throw Error('PROPOSAL_NOT_FOUND');const stamp=now(),managerIds=await this.managerIds(groupId);
    x.votes=[...x.votes.filter(v=>v.actorId!==ctx.actorId),{actorId:ctx.actorId,proposalActorId,votedAt:stamp}];x.version++;x.updatedAt=stamp;
    const eligible=x.votes.filter(v=>managerIds.includes(v.actorId)),counts=new Map<string,number>();for(const v of eligible)counts.set(v.proposalActorId,(counts.get(v.proposalActorId)??0)+1);
    const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]),winner=ranked[0],second=ranked[1]?.[1]??0,majority=Math.floor(managerIds.length/2)+1;
    if(winner&&winner[0]&&winner[1]>=majority&&winner[1]>second){
      const p=x.proposals.find(q=>q.actorId===winner[0])!;x.selectedValue=p.value;x.selectedProposalActorId=p.actorId;
      x.dissentingActorIds=[...new Set([...x.proposals.filter(q=>!q.actorId.startsWith('baseline:')&&q.value!==p.value).map(q=>q.actorId),...eligible.filter(v=>v.proposalActorId!==winner[0]).map(v=>v.actorId)])];
      x.state=eligible.length===managerIds.length&&eligible.every(v=>v.proposalActorId===winner[0])?'UNANIMOUS':'MAJORITY_SELECTED';
    } else {x.state='DIVERGENT';x.selectedValue=undefined;x.selectedProposalActorId=undefined;}
    return this.save(x,'LIVE_MANAGER_CONSENSUS_VOTED');
  }
  async maintainDissent(groupId:string,meetingId:string,cellKey:string,reason:string){
    await this.requireManager(groupId);const ctx=this.kernel.context.get(),id=idFor(groupId,meetingId,cellKey),record=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!record)throw Error('LIVE_CONSENSUS_NOT_FOUND');const x=parse(record);
    if(!x.selectedValue)throw Error('MAJORITY_REQUIRED');if(!x.dissentingActorIds.includes(ctx.actorId))x.dissentingActorIds.push(ctx.actorId);x.state='RESERVE_OPEN';x.version++;x.updatedAt=now();
    const saved=await this.save(x,'LIVE_MANAGER_RESERVE_OPENED');
    const caseId='case_live_consensus_'+encodeURIComponent(id);const cases=await this.repo.listCases(ctx.tenantId,ctx.actorId);
    if(!cases.some(c=>c.id===caseId))await this.repo.saveCase({id:caseId,tenantId:ctx.tenantId,groupId,type:'LIVE_DATA_DIVERGENCE',subjectType:'meeting_cell',subjectId:id,status:'OPEN',openedBy:ctx.actorId,openedAt:now(),summary:clean(reason)||'Divergence maintenue après choix majoritaire'});
    return saved;
  }
  async get(groupId:string,meetingId:string,cellKey:string){const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,idFor(groupId,meetingId,cellKey));return r?parse(r):undefined;}
  async list(groupId:string,meetingId:string){const ctx=this.kernel.context.get();return (await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId)).map(parse).filter(x=>x.meetingId===meetingId);}
}
