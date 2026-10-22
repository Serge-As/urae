import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type BallotMode='NAMED'|'SECRET';
export type BallotKind='YES_NO'|'SINGLE_CHOICE'|'MULTIPLE_CHOICE'|'RANKED';
export type MajorityRule='SIMPLE'|'QUALIFIED'|'UNANIMOUS';
export interface PollInput {title:string;question:string;options:string[];mode:BallotMode;kind:BallotKind;quorumBps:number;majority:MajorityRule;qualifiedThresholdBps?:number;closesAt?:string;rulesVersion?:string;discussionRef?:string;evidenceRefs?:string[];}
export interface PollView extends PollInput {id:Id;groupId:Id;state:'OPEN'|'CLOSED'|'CANCELLED';eligibleCount:number;createdAt:string;createdBy:Id;closedAt?:string;}
export interface VoteTally {poll:PollView;castCount:number;quorumReached:boolean;counts:Record<string,number>;ranking:Array<{option:string;score:number}>;winner?:string;resolution:'PENDING'|'ADOPTED'|'REJECTED'|'NO_QUORUM'|'TIE'|'CANCELLED';}

const POLL_MODULE='GOVERNANCE.VOTE';
const BALLOT_MODULE='GOVERNANCE.VOTE.BALLOT';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const clean=(s:string,n=300)=>s.trim().replace(/\s+/g,' ').slice(0,n);
const unique=(xs:string[])=>[...new Set(xs.map(x=>clean(String(x),120)).filter(Boolean))];
const data=(r:WorkspaceRecord)=>r.data as Record<string,unknown>;
const parse=(v:unknown,fallback:any)=>{try{return JSON.parse(String(v??''));}catch{return fallback;}};
const encodePoll=(p:PollView)=>({question:p.question,optionsJson:JSON.stringify(p.options),mode:p.mode,kind:p.kind,quorumBps:p.quorumBps,majority:p.majority,qualifiedThresholdBps:p.qualifiedThresholdBps??6667,closesAt:p.closesAt??null,state:p.state,eligibleCount:p.eligibleCount,closedAt:p.closedAt??null,rulesVersion:p.rulesVersion??null,discussionRef:p.discussionRef??null,evidenceRefsJson:JSON.stringify(p.evidenceRefs??[])});
const decodePoll=(r:WorkspaceRecord):PollView=>({id:r.id,groupId:String(r.groupId??''),title:r.title,question:String(data(r).question??''),options:parse(data(r).optionsJson,[]),mode:String(data(r).mode) as BallotMode,kind:String(data(r).kind) as BallotKind,quorumBps:Number(data(r).quorumBps??0),majority:String(data(r).majority) as MajorityRule,qualifiedThresholdBps:Number(data(r).qualifiedThresholdBps??6667),closesAt:data(r).closesAt?String(data(r).closesAt):undefined,state:String(data(r).state) as PollView['state'],eligibleCount:Number(data(r).eligibleCount??0),createdAt:r.createdAt,createdBy:r.createdBy,closedAt:data(r).closedAt?String(data(r).closedAt):undefined,rulesVersion:data(r).rulesVersion?String(data(r).rulesVersion):undefined,discussionRef:data(r).discussionRef?String(data(r).discussionRef):undefined,evidenceRefs:parse(data(r).evidenceRefsJson,[])});

const hmac=async(secret:string,value:string)=>{
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,'0')).join('');
};

export class GovernanceVoteService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,private readonly secret:string){}
  private async access(groupId:Id,manage=false){
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return{group,membership:(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId)};
    const membership=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
    if(!membership||manage&&!membership.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');return{group,membership};
  }
  private validate(input:PollInput){
    const title=clean(input.title,160),question=clean(input.question,600),options=unique(input.options);
    if(!title||!question)throw Error('POLL_TITLE_QUESTION_REQUIRED');
    if(!['NAMED','SECRET'].includes(input.mode)||!['YES_NO','SINGLE_CHOICE','MULTIPLE_CHOICE','RANKED'].includes(input.kind))throw Error('INVALID_POLL_MODE');
    const normalized=input.kind==='YES_NO'?['OUI','NON']:options;if(normalized.length<2||normalized.length>20)throw Error('INVALID_POLL_OPTIONS');
    const quorumBps=Math.trunc(input.quorumBps);if(!Number.isSafeInteger(quorumBps)||quorumBps<0||quorumBps>10000)throw Error('INVALID_QUORUM');
    const threshold=Math.trunc(input.qualifiedThresholdBps??6667);if(!Number.isSafeInteger(threshold)||threshold<5001||threshold>10000)throw Error('INVALID_QUALIFIED_THRESHOLD');
    if(!['SIMPLE','QUALIFIED','UNANIMOUS'].includes(input.majority))throw Error('INVALID_MAJORITY');
    if(input.closesAt&&Number.isNaN(Date.parse(input.closesAt)))throw Error('INVALID_CLOSE_DATE');
    return{...input,title,question,options:normalized,quorumBps,qualifiedThresholdBps:threshold,rulesVersion:clean(String(input.rulesVersion??''),120)||undefined,discussionRef:clean(String(input.discussionRef??''),240)||undefined,evidenceRefs:unique(input.evidenceRefs??[]).slice(0,20)};
  }
  async open(groupId:Id,input:PollInput){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),i=this.validate(input),eligible=(await this.repo.listMemberships(ctx.tenantId,groupId)).filter(x=>x.status==='active').map(x=>x.id),stamp=now(),poll:PollView={...i,id:makeId('poll'),groupId,state:'OPEN',eligibleCount:eligible.length,createdAt:stamp,createdBy:ctx.actorId};
    await this.repo.saveWorkspaceRecord({id:poll.id,tenantId:ctx.tenantId,groupId,moduleId:POLL_MODULE,title:poll.title,summary:poll.question,status:'ACTIVE',tags:['governance','poll',`mode:${poll.mode}`],data:{...encodePoll(poll),eligibleJson:JSON.stringify(eligible)},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'GOVERNANCE_POLL_OPENED',targetType:'poll',targetId:poll.id,after:{mode:poll.mode,kind:poll.kind,eligibleCount:eligible.length,quorumBps:poll.quorumBps,majority:poll.majority},requestId:ctx.requestId}));return poll;
  }
  async list(groupId:Id){await this.access(groupId);const ctx=this.kernel.context.get();return(await this.repo.listWorkspaceRecords(ctx.tenantId,POLL_MODULE,groupId)).filter(r=>r.tags.includes('poll')).map(decodePoll).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  private async record(groupId:Id,pollId:Id){await this.access(groupId);const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,pollId);if(!r||r.groupId!==groupId||r.moduleId!==POLL_MODULE||!r.tags.includes('poll'))throw Error('POLL_NOT_FOUND');return r;}
  async cast(groupId:Id,pollId:Id,selections:string[]){
    const {membership}=await this.access(groupId);if(!membership)throw Error('MEMBERSHIP_REQUIRED');const ctx=this.kernel.context.get(),r=await this.record(groupId,pollId),poll=decodePoll(r);if(poll.state!=='OPEN')throw Error('POLL_NOT_OPEN');if(poll.closesAt&&Date.parse(poll.closesAt)<=Date.now())throw Error('POLL_CLOSED_BY_TIME');
    const eligible=parse(data(r).eligibleJson,[]) as string[];if(!eligible.includes(membership.id))throw Error('NOT_ELIGIBLE_TO_VOTE');
    const picked=unique(selections);if(!picked.length||picked.some(x=>!poll.options.includes(x)))throw Error('INVALID_BALLOT');if(['YES_NO','SINGLE_CHOICE'].includes(poll.kind)&&picked.length!==1)throw Error('ONE_SELECTION_REQUIRED');if(poll.kind==='RANKED'&&picked.length!==poll.options.length)throw Error('RANK_ALL_OPTIONS_REQUIRED');
    const voterKey=poll.mode==='SECRET'?await hmac(this.secret||'eco-system-governance-fallback',`${poll.id}:${membership.id}`):membership.id;
    const id='ballot_'+await hmac(this.secret||'eco-system-governance-fallback',`${poll.id}:${voterKey}`),prior=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(prior)throw Error('BALLOT_ALREADY_CAST');const stamp=now();
    const inserted=await this.repo.insertGovernedRecord({id,tenantId:ctx.tenantId,groupId,moduleId:BALLOT_MODULE,title:'Ballot',summary:'Vote enregistré',status:'DONE',tags:['governance','ballot',`poll:${poll.id}`],data:{pollId:poll.id,voterKey,selectionsJson:JSON.stringify(picked),mode:poll.mode},createdBy:poll.mode==='SECRET'?'secret-ballot':ctx.actorId,createdAt:stamp,updatedAt:stamp});
    if(!inserted.inserted)throw Error('BALLOT_ALREADY_CAST');
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:poll.mode==='SECRET'?undefined:ctx.actorId,action:poll.mode==='SECRET'?'GOVERNANCE_SECRET_BALLOT_CAST':'GOVERNANCE_NAMED_BALLOT_CAST',targetType:'poll',targetId:poll.id,after:{ballotRecorded:true},requestId:ctx.requestId}));return{pollId:poll.id,accepted:true,secret:poll.mode==='SECRET'};
  }
  async close(groupId:Id,pollId:Id,state:'CLOSED'|'CANCELLED'='CLOSED'){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),r=await this.record(groupId,pollId),poll=decodePoll(r);if(poll.state!=='OPEN')throw Error('POLL_NOT_OPEN');const stamp=now(),next={...poll,state,closedAt:stamp};await this.repo.saveWorkspaceRecord({...r,status:state==='CLOSED'?'DONE':'ARCHIVED',data:{...r.data,...encodePoll(next)},updatedAt:stamp});await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'GOVERNANCE_POLL_'+state,targetType:'poll',targetId:poll.id,after:{state},requestId:ctx.requestId}));return next;
  }
  async tally(groupId:Id,pollId:Id):Promise<VoteTally>{
    await this.access(groupId);const ctx=this.kernel.context.get(),poll=decodePoll(await this.record(groupId,pollId)),rows=(await this.repo.listWorkspaceRecords(ctx.tenantId,BALLOT_MODULE,groupId)).filter(x=>String(x.data.pollId)===poll.id),counts=Object.fromEntries(poll.options.map(x=>[x,0])) as Record<string,number>;
    const rankedScores=Object.fromEntries(poll.options.map(x=>[x,0])) as Record<string,number>;for(const r of rows){const sel=parse(r.data.selectionsJson,[]) as string[];for(const x of sel)counts[x]=(counts[x]??0)+1;if(poll.kind==='RANKED')sel.forEach((x,i)=>rankedScores[x]=(rankedScores[x]??0)+(poll.options.length-i));}
    const castCount=rows.length,quorumReached=poll.eligibleCount===0?false:castCount*10000>=poll.eligibleCount*poll.quorumBps,source=poll.kind==='RANKED'?rankedScores:counts,ranking=Object.entries(source).map(([option,score])=>({option,score})).sort((a,b)=>b.score-a.score||a.option.localeCompare(b.option)),winner=ranking[0]?.score===ranking[1]?.score?undefined:ranking[0]?.option;
    let resolution:VoteTally['resolution']='PENDING';if(poll.state==='CANCELLED')resolution='CANCELLED';else if(poll.state==='CLOSED'){
      if(!quorumReached)resolution='NO_QUORUM';else if(!winner)resolution='TIE';else if(poll.kind==='YES_NO'){
        const yes=counts.OUI??0,no=counts.NON??0,total=yes+no,ratio=total?yes*10000/total:0;const adopted=poll.majority==='UNANIMOUS'?yes===total&&total>0:poll.majority==='QUALIFIED'?ratio>=Number(poll.qualifiedThresholdBps??6667):yes>no;resolution=adopted?'ADOPTED':'REJECTED';
      }else resolution='ADOPTED';
    }
    return{poll,castCount,quorumReached,counts,ranking,winner,resolution};
  }

  private async appendAction(groupId:Id,kind:string,key:string,values:WorkspaceRecord['data']){
    if(!/^[a-zA-Z0-9_.:-]{8,160}$/.test(key))throw Error('GOVERNED_REQUEST_KEY_REQUIRED');
    const c=this.kernel.context.get(),payload={kind,...values},fingerprint=await hmac(this.secret,JSON.stringify(payload)),id='gov_action_'+await hmac(this.secret,JSON.stringify([c.tenantId,c.actorId,groupId,kind,key])),stamp=now();
    const result=await this.repo.insertGovernedRecord({id,tenantId:c.tenantId,groupId,moduleId:'GOVERNANCE.VOTE.ACTION',title:kind==='TASK'?String(values.title):'Decision follow-up · '+kind,status:'DONE',tags:['governance-follow-up','immutable'],data:{...payload,fingerprint},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp});
    if(result.record.data.fingerprint!==fingerprint)throw Error('GOVERNED_RECORD_CONFLICT');
    if(result.inserted)await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'GOVERNANCE_FOLLOWUP_'+kind,targetType:'poll',targetId:String(values.pollId),requestId:c.requestId}));return result.record;
  }
  async planExecution(groupId:Id,pollId:Id,input:{title:string;assigneeUserId:Id;dueAt?:string;effectOwner:string;idempotencyKey:string}){
    await this.access(groupId,true);const tally=await this.tally(groupId,pollId);if(tally.resolution!=='ADOPTED'||tally.poll.state!=='CLOSED')throw Error('ADOPTED_DECISION_REQUIRED');
    const title=clean(String(input.title),300);if(!title||!['NONE','FINANCE','MANDATE','GROUP_RULES','PROCUREMENT','SUCCESSION','FEDERATION'].includes(input.effectOwner))throw Error('INVALID_DECISION_TASK');
    const c=this.kernel.context.get(),members=await this.repo.listMemberships(c.tenantId,groupId);if(!members.some(x=>x.userId===input.assigneeUserId&&x.status==='active'))throw Error('ACTIVE_ASSIGNEE_REQUIRED');
    if(input.dueAt&&!Number.isFinite(Date.parse(input.dueAt)))throw Error('INVALID_TASK_DUE_AT');
    return this.appendAction(groupId,'TASK',input.idempotencyKey,{pollId,title,assigneeUserId:input.assigneeUserId,dueAt:input.dueAt?new Date(input.dueAt).toISOString():null,effectOwner:input.effectOwner,rulesVersion:tally.poll.rulesVersion??null,decisionJson:JSON.stringify(tally),financialEffect:false,permissionGranted:false});
  }
  async execution(groupId:Id,pollId?:Id){
    await this.access(groupId);const rows=(await this.repo.listWorkspaceRecords(this.kernel.context.get().tenantId,'GOVERNANCE.VOTE.ACTION',groupId)).filter(x=>x.tags.includes('governance-follow-up'));
    return rows.filter(r=>r.data.kind==='TASK'&&(!pollId||r.data.pollId===pollId)).map(task=>{const events=rows.filter(x=>x.data.taskId===task.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
      const reports=events.filter(x=>x.data.kind==='REPORT'),reviewed=new Set(events.filter(x=>x.data.kind==='REVIEW').flatMap(x=>parse(x.data.reviewedReportIdsJson,[]) as string[]));
      const state=events.some(x=>x.data.kind==='CANCEL')?'CANCELLED':reports.length?reports.every(x=>reviewed.has(x.id))?'EVIDENCE_REVIEWED':'EFFECT_REPORTED':events.some(x=>x.data.kind==='START')?'IN_PROGRESS':'PLANNED';
      return{task,events,state,canonicalEffect:'NOT_INFERRED',financialEffect:false,permissionGranted:false};});
  }
  async actOnExecution(groupId:Id,id:Id,input:{action:'START'|'REPORT'|'REVIEW'|'CANCEL';note:string;evidenceRef?:string;idempotencyKey:string}){
    const access=await this.access(groupId),c=this.kernel.context.get(),rows=await this.execution(groupId),view=rows.find(x=>x.task.id===id);if(!view)throw Error('DECISION_TASK_NOT_FOUND');
    const manager=access.group.createdBy===c.actorId||Boolean(access.membership?.roles.some(r=>managers.has(r)));
    if(!manager&&view.task.data.assigneeUserId!==c.actorId)throw Error('FORBIDDEN_SCOPE');
    if(['REVIEW','CANCEL'].includes(input.action)&&!manager)throw Error('FORBIDDEN_SCOPE');
    if(!['START','REPORT','REVIEW','CANCEL'].includes(input.action))throw Error('INVALID_TASK_ACTION');
    const replayId='gov_action_'+await hmac(this.secret,JSON.stringify([c.tenantId,c.actorId,groupId,input.action,input.idempotencyKey])),replay=view.events.some(x=>x.id===replayId);
    if(!replay&&(view.state==='CANCELLED'||view.state==='EVIDENCE_REVIEWED'&&input.action!=='CANCEL'))throw Error('DECISION_TASK_FINISHED');
    if(!replay&&input.action==='REVIEW'&&view.state!=='EFFECT_REPORTED')throw Error('REPORTED_EFFECT_REQUIRED');
    const note=clean(String(input.note),1200),evidenceRef=clean(String(input.evidenceRef??''),240);if(!note||['REPORT','REVIEW'].includes(input.action)&&!evidenceRef)throw Error('DECISION_TASK_EVIDENCE_REQUIRED');
    const reviewedReportIdsJson=input.action==='REVIEW'?(view.events.find(x=>x.id===replayId)?.data.reviewedReportIdsJson??JSON.stringify(view.events.filter(x=>x.data.kind==='REPORT').map(x=>x.id).sort())):null;
    return this.appendAction(groupId,input.action,input.idempotencyKey,{taskId:id,pollId:String(view.task.data.pollId),note,evidenceRef,reviewedReportIdsJson,canonicalEffect:'NOT_INFERRED',financialEffect:false,permissionGranted:false});
  }
}
