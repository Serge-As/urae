import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type BallotMode='NAMED'|'SECRET';
export type BallotKind='YES_NO'|'SINGLE_CHOICE'|'MULTIPLE_CHOICE'|'RANKED';
export type MajorityRule='SIMPLE'|'QUALIFIED'|'UNANIMOUS';
export interface PollInput {title:string;question:string;options:string[];mode:BallotMode;kind:BallotKind;quorumBps:number;majority:MajorityRule;qualifiedThresholdBps?:number;closesAt?:string;}
export interface PollView extends PollInput {id:Id;groupId:Id;state:'OPEN'|'CLOSED'|'CANCELLED';eligibleCount:number;createdAt:string;createdBy:Id;closedAt?:string;}
export interface VoteTally {poll:PollView;castCount:number;quorumReached:boolean;counts:Record<string,number>;ranking:Array<{option:string;score:number}>;winner?:string;resolution:'PENDING'|'ADOPTED'|'REJECTED'|'NO_QUORUM'|'TIE';}

const POLL_MODULE='GOVERNANCE.VOTE';
const BALLOT_MODULE='GOVERNANCE.VOTE.BALLOT';
const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const clean=(s:string,n=300)=>s.trim().replace(/\s+/g,' ').slice(0,n);
const unique=(xs:string[])=>[...new Set(xs.map(x=>clean(String(x),120)).filter(Boolean))];
const data=(r:WorkspaceRecord)=>r.data as Record<string,unknown>;
const parse=(v:unknown,fallback:any)=>{try{return JSON.parse(String(v??''));}catch{return fallback;}};
const encodePoll=(p:PollView)=>({question:p.question,optionsJson:JSON.stringify(p.options),mode:p.mode,kind:p.kind,quorumBps:p.quorumBps,majority:p.majority,qualifiedThresholdBps:p.qualifiedThresholdBps??6667,closesAt:p.closesAt??null,state:p.state,eligibleCount:p.eligibleCount,closedAt:p.closedAt??null});
const decodePoll=(r:WorkspaceRecord):PollView=>({id:r.id,groupId:String(r.groupId??''),title:r.title,question:String(data(r).question??''),options:parse(data(r).optionsJson,[]),mode:String(data(r).mode) as BallotMode,kind:String(data(r).kind) as BallotKind,quorumBps:Number(data(r).quorumBps??0),majority:String(data(r).majority) as MajorityRule,qualifiedThresholdBps:Number(data(r).qualifiedThresholdBps??6667),closesAt:data(r).closesAt?String(data(r).closesAt):undefined,state:String(data(r).state) as PollView['state'],eligibleCount:Number(data(r).eligibleCount??0),createdAt:r.createdAt,createdBy:r.createdBy,closedAt:data(r).closedAt?String(data(r).closedAt):undefined});

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
    const quorumBps=Math.trunc(input.quorumBps);if(quorumBps<0||quorumBps>10000)throw Error('INVALID_QUORUM');
    const threshold=Math.trunc(input.qualifiedThresholdBps??6667);if(threshold<5001||threshold>10000)throw Error('INVALID_QUALIFIED_THRESHOLD');
    if(!['SIMPLE','QUALIFIED','UNANIMOUS'].includes(input.majority))throw Error('INVALID_MAJORITY');
    if(input.closesAt&&Number.isNaN(Date.parse(input.closesAt)))throw Error('INVALID_CLOSE_DATE');
    return{...input,title,question,options:normalized,quorumBps,qualifiedThresholdBps:threshold};
  }
  async open(groupId:Id,input:PollInput){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),i=this.validate(input),eligible=(await this.repo.listMemberships(ctx.tenantId,groupId)).filter(x=>x.status==='active').map(x=>x.id),stamp=now(),poll:PollView={...i,id:makeId('poll'),groupId,state:'OPEN',eligibleCount:eligible.length,createdAt:stamp,createdBy:ctx.actorId};
    await this.repo.saveWorkspaceRecord({id:poll.id,tenantId:ctx.tenantId,groupId,moduleId:POLL_MODULE,title:poll.title,summary:poll.question,status:'ACTIVE',tags:['governance','poll',`mode:${poll.mode}`],data:{...encodePoll(poll),eligibleJson:JSON.stringify(eligible)},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'GOVERNANCE_POLL_OPENED',targetType:'poll',targetId:poll.id,after:{mode:poll.mode,kind:poll.kind,eligibleCount:eligible.length,quorumBps:poll.quorumBps,majority:poll.majority},requestId:ctx.requestId}));return poll;
  }
  async list(groupId:Id){await this.access(groupId);const ctx=this.kernel.context.get();return(await this.repo.listWorkspaceRecords(ctx.tenantId,POLL_MODULE,groupId)).map(decodePoll).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  private async record(groupId:Id,pollId:Id){await this.access(groupId);const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,pollId);if(!r||r.groupId!==groupId||r.moduleId!==POLL_MODULE)throw Error('POLL_NOT_FOUND');return r;}
  async cast(groupId:Id,pollId:Id,selections:string[]){
    const {membership}=await this.access(groupId);if(!membership)throw Error('MEMBERSHIP_REQUIRED');const ctx=this.kernel.context.get(),r=await this.record(groupId,pollId),poll=decodePoll(r);if(poll.state!=='OPEN')throw Error('POLL_NOT_OPEN');if(poll.closesAt&&Date.parse(poll.closesAt)<=Date.now())throw Error('POLL_CLOSED_BY_TIME');
    const eligible=parse(data(r).eligibleJson,[]) as string[];if(!eligible.includes(membership.id))throw Error('NOT_ELIGIBLE_TO_VOTE');
    const picked=unique(selections);if(!picked.length||picked.some(x=>!poll.options.includes(x)))throw Error('INVALID_BALLOT');if(['YES_NO','SINGLE_CHOICE'].includes(poll.kind)&&picked.length!==1)throw Error('ONE_SELECTION_REQUIRED');if(poll.kind==='RANKED'&&picked.length!==poll.options.length)throw Error('RANK_ALL_OPTIONS_REQUIRED');
    const voterKey=poll.mode==='SECRET'?await hmac(this.secret||'eco-system-governance-fallback',`${poll.id}:${membership.id}`):membership.id;
    const id='ballot_'+await hmac(this.secret||'eco-system-governance-fallback',`${poll.id}:${voterKey}`),prior=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(prior)throw Error('BALLOT_ALREADY_CAST');const stamp=now();
    await this.repo.saveWorkspaceRecord({id,tenantId:ctx.tenantId,groupId,moduleId:BALLOT_MODULE,title:'Ballot',summary:'Vote enregistré',status:'DONE',tags:['governance','ballot',`poll:${poll.id}`],data:{pollId:poll.id,voterKey,selectionsJson:JSON.stringify(picked),mode:poll.mode},createdBy:poll.mode==='SECRET'?'secret-ballot':ctx.actorId,createdAt:stamp,updatedAt:stamp});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:poll.mode==='SECRET'?undefined:ctx.actorId,action:poll.mode==='SECRET'?'GOVERNANCE_SECRET_BALLOT_CAST':'GOVERNANCE_NAMED_BALLOT_CAST',targetType:'poll',targetId:poll.id,after:{ballotRecorded:true},requestId:ctx.requestId}));return{pollId:poll.id,accepted:true,secret:poll.mode==='SECRET'};
  }
  async close(groupId:Id,pollId:Id,state:'CLOSED'|'CANCELLED'='CLOSED'){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),r=await this.record(groupId,pollId),poll=decodePoll(r);if(poll.state!=='OPEN')throw Error('POLL_NOT_OPEN');const stamp=now(),next={...poll,state,closedAt:stamp};await this.repo.saveWorkspaceRecord({...r,status:state==='CLOSED'?'DONE':'ARCHIVED',data:{...r.data,...encodePoll(next)},updatedAt:stamp});await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'GOVERNANCE_POLL_'+state,targetType:'poll',targetId:poll.id,after:{state},requestId:ctx.requestId}));return next;
  }
  async tally(groupId:Id,pollId:Id):Promise<VoteTally>{
    await this.access(groupId);const ctx=this.kernel.context.get(),poll=decodePoll(await this.record(groupId,pollId)),rows=(await this.repo.listWorkspaceRecords(ctx.tenantId,BALLOT_MODULE,groupId)).filter(x=>String(x.data.pollId)===poll.id),counts=Object.fromEntries(poll.options.map(x=>[x,0])) as Record<string,number>;
    const rankedScores=Object.fromEntries(poll.options.map(x=>[x,0])) as Record<string,number>;for(const r of rows){const sel=parse(r.data.selectionsJson,[]) as string[];for(const x of sel)counts[x]=(counts[x]??0)+1;if(poll.kind==='RANKED')sel.forEach((x,i)=>rankedScores[x]=(rankedScores[x]??0)+(poll.options.length-i));}
    const castCount=rows.length,quorumReached=poll.eligibleCount===0?false:castCount*10000>=poll.eligibleCount*poll.quorumBps,source=poll.kind==='RANKED'?rankedScores:counts,ranking=Object.entries(source).map(([option,score])=>({option,score})).sort((a,b)=>b.score-a.score||a.option.localeCompare(b.option)),winner=ranking[0]?.score===ranking[1]?.score?undefined:ranking[0]?.option;
    let resolution:VoteTally['resolution']='PENDING';if(poll.state!=='OPEN'){
      if(!quorumReached)resolution='NO_QUORUM';else if(!winner)resolution='TIE';else if(poll.kind==='YES_NO'){
        const yes=counts.OUI??0,no=counts.NON??0,total=yes+no,ratio=total?yes*10000/total:0;const adopted=poll.majority==='UNANIMOUS'?yes===total&&total>0:poll.majority==='QUALIFIED'?ratio>=Number(poll.qualifiedThresholdBps??6667):yes>no;resolution=adopted?'ADOPTED':'REJECTED';
      }else resolution='ADOPTED';
    }
    return{poll,castCount,quorumReached,counts,ranking,winner,resolution};
  }
}
