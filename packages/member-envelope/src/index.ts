import type {Id,Membership} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';

const MANAGER_ROLES=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const now=()=>new Date().toISOString();
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const nonce=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,'0')).join('');

export interface MemberFinancialEnvelope{
  protocolVersion:1;
  tenantId:Id;groupId:Id;meetingId:Id;membershipId:Id;recipientUserId:Id;
  generatedAt:string;expiresAt:string;scope:'MEMBER_ONLY';
  projection:{
    meeting:{id:Id;title:string;status:string;scheduledAt?:string;closedAt?:string};
    meetingReceipts:Array<{receiptId:Id;rubricId?:Id;rubricName:string;netAmount:number;currency:string;receivedAt:string;late:boolean}>;
    meetingNet:number;statementTotal:number;
    notices:Array<{id:Id;operationType:string;amount:number;currency:string;rubricId?:Id;memberState:string;disputeState:string;version:number}>;
    loanDebts:Array<{loanId:Id;title:string;principal:number;interest:number;totalDebt:number}>;
    obligations:Array<{id:Id;title:string;status:string;dueAt?:string;amount?:number;currency?:string}>;
  };
  privacy:{otherMemberFinancialData:false;contactsIncluded:false;identityDocumentsIncluded:false;rawAuditIncluded:false};
  transport:{opaqueCapable:true;requiresRecipientBinding:true;antiReplayNonce:string};
  fingerprint:string;
}

export class MemberEnvelopeService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public ledger:LedgerService){}
  private ctx(){return this.kernel.context.get();}
  private async access(groupId:Id){
    const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw Error('GROUP_NOT_FOUND');
    const membership=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    const manager=g.createdBy===c.actorId||Boolean(membership?.roles.some(r=>MANAGER_ROLES.has(r)));
    if(!manager&&!membership)throw Error('FORBIDDEN_SCOPE');
    return{group:g,membership,manager};
  }
  private async target(groupId:Id,membershipId?:Id):Promise<{target:Membership;manager:boolean}>{
    const a=await this.access(groupId),c=this.ctx();
    const target=membershipId?await this.repo.getMembership(c.tenantId,groupId,membershipId):a.membership;
    if(!target||target.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');
    if(!a.manager&&target.userId!==c.actorId)throw Error('FORBIDDEN_SCOPE');
    return{target,manager:a.manager};
  }
  /** The same canonical read model serves confrontation and private summaries.
   * It is not a second accounting engine and it never writes financial data. */
  async canonicalCells(groupId:Id){
    const c=this.ctx(),access=await this.access(groupId);
    const [positions,revisions,events,expenses]=await Promise.all([
      this.ledger.receiptPositions(c.tenantId,groupId),this.repo.listFinancialCellRevisions(c.tenantId,groupId),
      this.repo.listWorkspaceRecords(c.tenantId,'FINANCE.SHEET_EVENT',groupId),this.repo.listWorkspaceRecords(c.tenantId,'FINANCE.EXPENSE',groupId)
    ]);
    const key=(meetingId:string,membershipId:string,rubricId:string)=>JSON.stringify([meetingId,membershipId,rubricId]);
    const cells=new Map<string,{meetingId:string;membershipId:string;rubricId:string;amount:number;cellVersion:number;updatedAt:string;actorId?:string;nature?:string}>(),versions=new Map(revisions.map(r=>[key(r.meetingId,r.membershipId,r.rubricId),r]));
    for(const p of positions){if(!p.meetingId||!p.rubricId)continue;const k=key(p.meetingId,p.membershipId,p.rubricId),old=cells.get(k),r=versions.get(k),at=String(r?.updatedAt??p.receivedAt??'');cells.set(k,{meetingId:p.meetingId,membershipId:p.membershipId,rubricId:p.rubricId,amount:Number(old?.amount??0)+Number(p.netAmount??0),cellVersion:Number(r?.version??0),updatedAt:at>String(old?.updatedAt??'')?at:String(old?.updatedAt??at),actorId:String(p.receivedBy??old?.actorId??''),nature:'CONTRIBUTION'});}
    for(const r of revisions){const k=key(r.meetingId,r.membershipId,r.rubricId);if(!cells.has(k))cells.set(k,{meetingId:r.meetingId,membershipId:r.membershipId,rubricId:r.rubricId,amount:0,cellVersion:r.version,updatedAt:r.updatedAt,nature:'CONTRIBUTION'});}
    for(const e of events){const d=e.data,meetingId=String(d.meetingId??''),membershipId=String(d.membershipId??''),rubricId=String(d.rubricId??'');if(!meetingId||!membershipId||!rubricId)continue;const k=key(meetingId,membershipId,rubricId),old=cells.get(k),out=d.direction==='OUT';cells.set(k,{meetingId,membershipId,rubricId,amount:Number(old?.amount??0)+(out?-1:1)*Math.abs(Number(d.amount??0)),cellVersion:Number(old?.cellVersion??0)+1,updatedAt:e.updatedAt??e.createdAt,actorId:e.createdBy,nature:out?'LOAN_OR_OUTFLOW':'REPAYMENT'});}
    for(const e of expenses){const d=e.data;if(d.scope!=='SHEET'||e.status==='ARCHIVED')continue;const meetingId=String(d.meetingId??''),membershipId=String(d.membershipId??''),rubricId=String(d.rubricId??'');if(!meetingId||!membershipId||!rubricId)continue;const k=key(meetingId,membershipId,rubricId),old=cells.get(k);cells.set(k,{meetingId,membershipId,rubricId,amount:Number(old?.amount??0)-Math.abs(Number(d.amount??0)),cellVersion:Number(old?.cellVersion??0)+1,updatedAt:e.updatedAt??e.createdAt,actorId:e.createdBy,nature:'OUTFLOW'});}
    const visible=[...cells.values()].filter(x=>access.manager||x.membershipId===access.membership?.id);
    const watermark=visible.reduce((n,x)=>Math.max(n,Date.parse(x.updatedAt)||0),0);
    return{cells:visible,watermark,generatedAt:now()};
  }

  async passageSummary(groupId:Id,meetingId:Id,membershipId:Id,rubricIds:string[]){
    const c=this.ctx(),{target}=await this.target(groupId,membershipId),meeting=await this.repo.getMeeting(c.tenantId,groupId,meetingId);if(!meeting)throw Error('MEETING_NOT_FOUND');
    const [projection,allMeetings,rubrics,notices]=await Promise.all([this.canonicalCells(groupId),this.repo.listMeetings(c.tenantId,groupId),this.repo.listRubricDefinitions(c.tenantId,groupId),this.repo.listWorkspaceRecords(c.tenantId,'FINANCE.MEMBER_CONTROL',groupId)]);
    const ordered=allMeetings.slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt))||a.id.localeCompare(b.id)),at=ordered.findIndex(x=>x.id===meetingId),beforeIds=new Set(ordered.slice(0,Math.max(0,at)).map(x=>x.id));
    const own=projection.cells.filter(x=>x.membershipId===membershipId),byRubric=new Map(rubrics.map(x=>[x.id,x]));
    const lines=[...new Set(rubricIds)].map(rubricId=>{
      const rows=own.filter(x=>x.rubricId===rubricId),current=rows.find(x=>x.meetingId===meetingId),before=rows.filter(x=>beforeIds.has(x.meetingId)).reduce((n,x)=>n+x.amount,0),amount=Number(current?.amount??0),r=byRubric.get(rubricId);
      const controls=notices.filter(x=>x.data.membershipId===membershipId&&x.data.meetingId===meetingId&&x.data.rubricId===rubricId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      return{rubricId,rubricName:r?.name??rubricId,before,current:amount,total:before+amount,currency:'XAF',cellVersion:Number(current?.cellVersion??0),authorId:current?.actorId??controls[0]?.createdBy??'',noticeId:controls[0]?.id??'',noticeIds:controls.map(x=>x.id),disputeState:String(controls[0]?.data.disputeState??'NO_RESERVE'),nature:current?.nature??'CONTRIBUTION'};
    });
    return{groupId,meetingId,meetingTitle:meeting.title,membershipId,userId:target.userId,generatedAt:projection.generatedAt,lines,totals:{before:lines.reduce((n,x)=>n+x.before,0),current:lines.reduce((n,x)=>n+x.current,0),total:lines.reduce((n,x)=>n+x.total,0)},totalMeaning:'SUM_OF_DISPLAYED_MONETARY_FLOWS_NOT_CASH_OR_DEBT_STOCK'};
  }

  async distributionReady(groupId:Id,meetingId:Id){
    const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,'MEETING.DISTRIBUTION',groupId);
    return rows.some(x=>x.status==='DONE'&&x.data.kind==='MEMBER_DISTRIBUTION_READY'&&x.data.meetingId===meetingId);
  }
  async build(groupId:Id,meetingId:Id,membershipId?:Id):Promise<MemberFinancialEnvelope>{
    const c=this.ctx(),{target}=await this.target(groupId,membershipId),meeting=await this.repo.getMeeting(c.tenantId,groupId,meetingId);
    if(!meeting)throw Error('MEETING_NOT_FOUND');
    if(!await this.distributionReady(groupId,meetingId))throw Error('MEMBER_DISTRIBUTION_NOT_READY');
    const rubrics=await this.repo.listRubricDefinitions(c.tenantId,groupId),rubricNames=new Map(rubrics.map(x=>[x.id,x.name]));
    const positions=(await this.ledger.receiptPositions(c.tenantId,groupId)).filter(x=>x.membershipId===target.id&&x.meetingId===meetingId&&x.netAmount!==0);
    const statement=await this.ledger.memberStatement(c.tenantId,groupId,target.id);
    const notices=(await this.repo.listWorkspaceRecords(c.tenantId,'FINANCE.MEMBER_CONTROL',groupId))
      .filter(x=>x.data.membershipId===target.id&&x.data.meetingId===meetingId)
      .map(x=>({id:x.id,operationType:String(x.data.operationType??''),amount:Number(x.data.amount??0),currency:String(x.data.currency??'XAF'),rubricId:x.data.rubricId?String(x.data.rubricId):undefined,memberState:String(x.data.memberState??'NOTIFIED'),disputeState:String(x.data.disputeState??'NO_RESERVE'),version:Number(x.data.version??1)}));
    const loanDebts=(await this.repo.listWorkspaceRecords(c.tenantId,undefined,groupId))
      .filter(x=>x.data.completionKind==='LOAN'&&x.data.borrowerMembershipId===target.id&&['DISBURSED','REPAYING'].includes(String(x.data.completionState??'')))
      .map(x=>{const principal=Math.max(0,Number(x.data.outstandingPrincipal??0)),interest=Math.max(0,Number(x.data.unpaidInterest??0));return{loanId:x.id,title:x.title,principal,interest,totalDebt:principal+interest};})
      .filter(x=>x.totalDebt>0);
    const obligations=(await this.repo.listObligations(c.tenantId,target.userId))
      .filter(x=>x.groupId===groupId&&(x.status==='open'||x.status==='overdue'))
      .map(x=>({id:x.id,title:x.title,status:x.status,dueAt:x.dueAt,amount:x.amount?.amount,currency:x.amount?.currency}));
    const generatedAt=now(),expiresAt=new Date(Date.now()+24*3600_000).toISOString();
    const base={
      protocolVersion:1 as const,tenantId:c.tenantId,groupId,meetingId,membershipId:target.id,recipientUserId:target.userId,
      generatedAt,expiresAt,scope:'MEMBER_ONLY' as const,
      projection:{
        meeting:{id:meeting.id,title:meeting.title,status:meeting.status,scheduledAt:meeting.scheduledAt,closedAt:meeting.closedAt},
        meetingReceipts:positions.map(x=>({receiptId:x.id,rubricId:x.rubricId,rubricName:x.rubricId?rubricNames.get(x.rubricId)??'Rubrique':'Sans rubrique',netAmount:x.netAmount,currency:x.amount.currency,receivedAt:x.receivedAt,late:Boolean(x.latePosting?.isLate)})),
        meetingNet:positions.reduce((n,x)=>n+x.netAmount,0),statementTotal:statement.totalNetContributions,notices,loanDebts,obligations
      },
      privacy:{otherMemberFinancialData:false as const,contactsIncluded:false as const,identityDocumentsIncluded:false as const,rawAuditIncluded:false as const},
      transport:{opaqueCapable:true as const,requiresRecipientBinding:true as const,antiReplayNonce:nonce()}
    };
    return{...base,fingerprint:await digest(JSON.stringify(base))};
  }
  async buildAll(groupId:Id,meetingId:Id):Promise<MemberFinancialEnvelope[]>{
    const a=await this.access(groupId);if(!a.manager)throw Error('MANAGER_REQUIRED');
    const c=this.ctx(),members=(await this.repo.listMemberships(c.tenantId,groupId)).filter(x=>x.status==='active'),out:MemberFinancialEnvelope[]=[];
    for(const m of members)out.push(await this.build(groupId,meetingId,m.id));
    return out;
  }
}
