import type {Id} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const roles=new Set(['founder','manager','admin','president','treasurer']);
async function access(repo:PlatformRepository,kernel:PlatformKernel,groupId:Id,manage=false){
  const ctx=kernel.context.get();const group=await repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
  if(group.createdBy===ctx.actorId)return;
  const member=(await repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
  if(!member)throw Error('FORBIDDEN_SCOPE');
  if(manage&&!member.roles.some(r=>roles.has(r)))throw Error('FORBIDDEN_SCOPE');
}
export interface AmountExplanationRow{receiptId:Id;ledgerEntryId:Id;receivedAt:string;gross:number;net:number;rubricId?:Id;meetingId?:Id;reversalEntryIds:Id[];status:'ACTIVE'|'REVERSED'|'ADJUSTED';}
export class ExplainabilityService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  async amount(groupId:Id,membershipId:Id,rubricId?:Id){
    const ctx=this.kernel.context.get();await access(this.repo,this.kernel,groupId);
    const member=await this.repo.getMembership(ctx.tenantId,groupId,membershipId);if(!member)throw Error('MEMBERSHIP_NOT_FOUND');
    if(member.userId!==ctx.actorId)await access(this.repo,this.kernel,groupId,true);
    const receipts=(await this.repo.listContributionReceipts(ctx.tenantId,groupId)).filter(r=>r.membershipId===membershipId&&(!rubricId||r.rubricId===rubricId));
    const entries=await this.repo.listLedgerEntries(ctx.tenantId,groupId),accounts=await this.repo.listLedgerAccounts(ctx.tenantId,groupId);
    const byId=new Map(entries.map(e=>[e.id,e]));const rows:AmountExplanationRow[]=[];
    for(const receipt of receipts){
      if(!byId.has(receipt.ledgerEntryId))throw Error('RECEIPT_LEDGER_INCONSISTENT');
      const linked=new Set<Id>([receipt.ledgerEntryId]);let changed=true;
      while(changed){changed=false;for(const e of entries)if(e.reversalOfEntryId&&linked.has(e.reversalOfEntryId)&&!linked.has(e.id)){linked.add(e.id);changed=true;}}
      const cash=new Set(accounts.filter(a=>a.code==='CASH'&&a.currency===receipt.amount.currency).map(a=>a.id));let net=0;
      for(const id of linked){const e=byId.get(id);if(e)for(const line of e.lines)if(cash.has(line.accountId))net+=line.debit-line.credit;}
      const reversals=[...linked].filter(id=>id!==receipt.ledgerEntryId);
      rows.push({receiptId:receipt.id,ledgerEntryId:receipt.ledgerEntryId,receivedAt:receipt.receivedAt,gross:receipt.amount.amount,net,rubricId:receipt.rubricId,meetingId:receipt.meetingId,reversalEntryIds:reversals,status:net===0&&reversals.length?'REVERSED':net!==receipt.amount.amount?'ADJUSTED':'ACTIVE'});
    }
    const currencies=[...new Set(receipts.map(r=>r.amount.currency))];if(currencies.length>1)throw Error('MULTI_CURRENCY_EXPLANATION_REQUIRES_FILTER');
    const ruleReferences=[] as Array<{rubricId:Id;name:string;version:number;ruleRealityStatus?:string}>;
    for(const id of [...new Set(rows.map(r=>r.rubricId).filter(Boolean) as Id[])]){const r=await this.repo.getRubricDefinition(ctx.tenantId,groupId,id);if(r)ruleReferences.push({rubricId:r.id,name:r.name,version:r.version,ruleRealityStatus:r.operatingModel?.ruleRealityStatus});}
    return{groupId,membershipId,rubricId,currency:currencies[0]??'XAF',gross:rows.reduce((n,r)=>n+r.gross,0),net:rows.reduce((n,r)=>n+r.net,0),rows,ruleReferences};
  }
  async health(groupId:Id){
    const ctx=this.kernel.context.get();await access(this.repo,this.kernel,groupId,true);
    const [entries,receipts,obligations,records,audits]=await Promise.all([this.repo.listLedgerEntries(ctx.tenantId,groupId),this.repo.listContributionReceipts(ctx.tenantId,groupId),this.repo.listObligations(ctx.tenantId),this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId),this.repo.listAudit(ctx.tenantId)]);
    const openObligations=obligations.filter(o=>o.groupId===groupId&&(o.status==='open'||o.status==='overdue')).length;
    const openConflicts=records.filter(r=>r.tags.includes('kind:CONFLICT')&&!['DONE','ARCHIVED'].includes(r.status)).length;
    const groupAudits=audits.filter(a=>a.metadata?.groupId===groupId||a.targetId===groupId).sort((a,b)=>a.at.localeCompare(b.at));
    return{groupId,ledgerEntries:entries.length,receipts:receipts.length,openObligations,workspaceRecords:records.length,openConflicts,lastAuditAt:groupAudits.at(-1)?.at};
  }
}
