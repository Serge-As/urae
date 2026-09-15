import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

export interface AggregateRubricVolume {
  rubricId:string;
  rubricLabel:string;
  amount:number;
  receiptCount:number;
}
export interface GroupEconomicProfile {
  groupCode:string;
  currency:string;
  memberCount:number;
  receiptCount:number;
  collectedTotal:number;
  cashIn:number;
  cashOut:number;
  transactionCount:number;
  rubricVolumes:AggregateRubricVolume[];
  generatedAt:string;
  privacy:'GROUP_PSEUDONYMOUS_AGGREGATE';
  containsIndividualFinancialData:false;
  exportable:boolean;
  exportBlockers:string[];
}

export class EconomicIntelligenceService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  async profile(groupId:string,groupCode:string,minMembersForExternal=5):Promise<GroupEconomicProfile>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw new Error('GROUP_NOT_FOUND');
    const [members,receipts,entries,accounts,rubrics]=await Promise.all([
      this.repo.listMemberships(ctx.tenantId,groupId),this.repo.listContributionReceipts(ctx.tenantId,groupId),
      this.repo.listLedgerEntries(ctx.tenantId,groupId),this.repo.listLedgerAccounts(ctx.tenantId,groupId),this.repo.listRubricDefinitions(ctx.tenantId,groupId)
    ]);
    const rubricMap=new Map(rubrics.map(r=>[r.id,r.name])),byRubric=new Map<string,{amount:number;count:number}>();
    for(const receipt of receipts){
      const key=receipt.rubricId??'UNASSIGNED',row=byRubric.get(key)??{amount:0,count:0};
      row.amount+=receipt.amount.amount;row.count++;byRubric.set(key,row);
    }
    const cashIds=new Set(accounts.filter(a=>a.code==='CASH').map(a=>a.id));let cashIn=0,cashOut=0;
    for(const entry of entries)for(const line of entry.lines)if(cashIds.has(line.accountId)){cashIn+=line.debit;cashOut+=line.credit;}
    const activeMembers=members.filter(m=>m.status==='active').length,blockers:string[]=[];
    if(activeMembers<minMembersForExternal)blockers.push('MIN_MEMBER_AGGREGATION_NOT_REACHED');
    const rubricVolumes=[...byRubric.entries()].map(([rubricId,v])=>({rubricId,rubricLabel:rubricId==='UNASSIGNED'?'Non affecté':rubricMap.get(rubricId)??'Rubrique',amount:v.amount,receiptCount:v.count})).sort((a,b)=>b.amount-a.amount||a.rubricLabel.localeCompare(b.rubricLabel));
    return{groupCode,currency:receipts[0]?.amount.currency??entries[0]?.currency??'XAF',memberCount:activeMembers,receiptCount:receipts.length,collectedTotal:receipts.reduce((n,r)=>n+r.amount.amount,0),cashIn,cashOut,transactionCount:entries.length,rubricVolumes,generatedAt:new Date().toISOString(),privacy:'GROUP_PSEUDONYMOUS_AGGREGATE',containsIndividualFinancialData:false,exportable:blockers.length===0,exportBlockers:blockers};
  }
}
