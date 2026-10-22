import type {PlatformRepository} from '../../../packages/repositories/src/index.js';
import type {LedgerService} from '../../../packages/domain/src/index.js';
import type {CompletionSuiteService} from '../../../packages/completion/src/index.js';
import {applyLoanPayment} from '../../../packages/completion/src/index.js';
import {simulatePeriodicLoan,summarizePeriodicLoan} from '../../../packages/loan-simulator/src/index.js';
import {buildSavingsCalculationCopy,verifySavingsCalculationCopy,financeDigest} from '../../../packages/savings-yield/src/proof.js';

type Dependencies={repo:PlatformRepository;ledger:LedgerService;completion:CompletionSuiteService;ctx:{tenantId:string;actorId:string};requireGroup:(id:string,manage?:boolean)=>Promise<any>;resolveLoanPolicy:(loan:any,policy:any)=>any};
const management=new Set(['founder','manager','admin','president','treasurer']);
const integer=(v:unknown,name:string,min=0,max=Number.MAX_SAFE_INTEGER)=>{if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max)throw Error('INVALID_'+name);return v;};
const safeSum=(values:number[])=>{const result=values.reduce((n,x)=>n+BigInt(integer(x>=0?x:-x,'FINANCE_AMOUNT'))*(x<0?-1n:1n),0n);if(result>BigInt(Number.MAX_SAFE_INTEGER)||result<BigInt(-Number.MAX_SAFE_INTEGER))throw Error('INVALID_FINANCE_TOTAL');return Number(result);};
const date=(raw:string|null,fallback:number)=>{if(raw===null||raw==='')return fallback;const n=Date.parse(raw);if(!Number.isFinite(n))throw Error('INVALID_STATEMENT_DATE');return n;};
const pageOf=<T>(rows:T[],offset:number)=>({items:rows.slice(offset,offset+100),total:rows.length,offset,nextOffset:offset+100<rows.length?offset+100:null});

/** Authorized read projection; every calculation delegates to the acquired financial owners. No writes. */
export async function financialExplanationRoute(request:Request,url:URL,d:Dependencies):Promise<unknown|undefined>{
  const route=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/finance\/(explanation|loans(?:\/[^/]+(?:\/scenario)?)?|yield-receipts|yield-copy(?:\/verify)?|calendar(?:\/stress)?)$/);
  if(!route)return undefined;
  const groupId=route[1]!,action=route[2]!,{repo,ledger,completion,ctx}=d;
  const group=await d.requireGroup(groupId,false),members=await repo.listMemberships(ctx.tenantId,groupId),self=members.find(m=>m.userId===ctx.actorId&&m.status==='active');
  const manager=group.createdBy===ctx.actorId||Boolean(self?.roles.some(r=>management.has(r)));
  const body=async()=>{const raw=await request.text();if(raw.length>131072)throw Error('INVALID_FINANCE_REQUEST_SIZE');return JSON.parse(raw||'{}') as any;};
  const stamp=()=>({groupId,generatedAt:new Date().toISOString(),source:'CANONICAL_OWNER_READ_PROJECTION',financialPosting:false});
  if(action==='explanation'&&request.method==='GET'){
    const membershipId=url.searchParams.get('membershipId')||(!manager?self?.id:undefined);
    if(membershipId&&!members.some(m=>m.id===membershipId))throw Error('MEMBERSHIP_NOT_FOUND');
    if(!manager&&membershipId!==self?.id)throw Error('FORBIDDEN_SCOPE');
    const from=date(url.searchParams.get('from'),-Infinity),to=date(url.searchParams.get('to'),Infinity);if(to<from)throw Error('INVALID_STATEMENT_PERIOD');
    const offset=integer(Number(url.searchParams.get('offset')??0),'FINANCE_OFFSET');
    const rubricId=url.searchParams.get('rubricId')||undefined,meetingId=url.searchParams.get('meetingId')||undefined;
    const authorizedMembers=manager?members:members.filter(m=>m.id===self?.id);
    const memberLabels=await Promise.all(authorizedMembers.map(async m=>({id:m.id,displayName:(await repo.getUser(m.userId))?.displayName??m.id})));
    const [accounts,entries,positions,rubrics,meetings]=await Promise.all([repo.listLedgerAccounts(ctx.tenantId,groupId),repo.listLedgerEntries(ctx.tenantId,groupId),ledger.receiptPositions(ctx.tenantId,groupId),repo.listRubricDefinitions(ctx.tenantId,groupId),repo.listMeetings(ctx.tenantId,groupId)]);
    const cashIds=new Set(accounts.filter(a=>a.code==='CASH'&&a.currency==='XAF').map(a=>a.id)),receiptByEntry=new Map(positions.filter(r=>r.amount.currency==='XAF').map(r=>[r.ledgerEntryId,r]));
    // Resolve chains, rather than silently losing a correction when adapters return a different order.
    for(let changed=true;changed;){changed=false;for(const e of entries)if(e.reversalOfEntryId&&!receiptByEntry.has(e.id)){const parent=receiptByEntry.get(e.reversalOfEntryId);if(parent){receiptByEntry.set(e.id,parent);changed=true;}}}
    const canonical=membershipId?await ledger.memberStatement(ctx.tenantId,groupId,membershipId):await ledger.summary(ctx.tenantId,groupId,'XAF');
    const permitted=entries.filter(e=>e.currency==='XAF'&&(!membershipId||receiptByEntry.get(e.id)?.membershipId===membershipId));
    const reversals=new Map<string,string[]>();for(const e of permitted)if(e.reversalOfEntryId)reversals.set(e.reversalOfEntryId,[...(reversals.get(e.reversalOfEntryId)??[]),e.id]);
    const rows=permitted.map(e=>{const receipt=receiptByEntry.get(e.id);return {entryId:e.id,createdAt:e.createdAt,kind:e.sourceType,descriptionCode:e.descriptionCode,sourceId:e.sourceId??null,idempotencyKey:e.idempotencyKey,meetingId:e.meetingId??receipt?.meetingId??null,rubricId:receipt?.rubricId??null,membershipId:receipt?.membershipId??null,receiptId:receipt?.id??null,reversalOfEntryId:e.reversalOfEntryId??null,reversedBy:reversals.get(e.id)??[],cashDelta:safeSum(e.lines.filter(l=>cashIds.has(l.accountId)).map(l=>l.debit-l.credit))};});
    const matches=(x:typeof rows[number])=>{const n=Date.parse(x.createdAt);return n>=from&&n<=to&&(!rubricId||x.rubricId===rubricId)&&(!meetingId||x.meetingId===meetingId);};
    const filtered=rows.filter(matches).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.entryId.localeCompare(b.entryId)),cashFromMovements=safeSum(rows.map(x=>x.cashDelta)),canonicalAmount=membershipId?Number((canonical as any).totalNetContributions):Number((canonical as any).cashBalance);
    const control=cashFromMovements===canonicalAmount&&((membershipId)||Number((canonical as any).entryCount)===permitted.length);
    return {...stamp(),scope:membershipId?'MEMBER_CONTRIBUTIONS':'GROUP_CASH',membershipId:membershipId??null,currency:'XAF',canonical,control:{status:control?'MATCH':'RECHECK_REQUIRED',movementTotal:cashFromMovements,canonicalAmount,difference:safeSum([cashFromMovements,-canonicalAmount]),meaning:'Separate reads may overlap a concurrent posting; recheck before concluding an error.'},period:{from:Number.isFinite(from)?new Date(from).toISOString():null,to:Number.isFinite(to)?new Date(to).toISOString():null,net:safeSum(filtered.map(x=>x.cashDelta)),cashIn:safeSum(filtered.map(x=>Math.max(0,x.cashDelta))),cashOut:safeSum(filtered.map(x=>Math.max(0,-x.cashDelta)))},movements:pageOf(filtered,offset),filters:{members:memberLabels,rubrics:rubrics.map(r=>({id:r.id,name:r.name})),meetings:meetings.map(m=>({id:m.id,title:m.title}))},pendingLocalIncluded:false,limits:{pageSize:100,currency:'XAF',memberView:'Confirmed contributions and their reversal chains; not net worth or all member debts.',historicalRowsRead:'Full canonical history; bounded calls do not imply bounded rows.'}};
  }
  if(action==='loans'&&request.method==='GET'){
    const loans=await completion.list(groupId,'LOAN');
    return {...stamp(),items:loans.map(l=>({id:l.id,title:l.title,state:String(l.data.completionState),version:l.data.completionVersion,principal:Number(l.data.outstandingPrincipal??0),interest:Number(l.data.unpaidInterest??0),membershipId:l.data.borrowerMembershipId??null})),limitedTo:'CURRENT_AUTHORIZED_LOANS'};
  }
  if(action.startsWith('loans/')){
    const loanId=decodeURIComponent(action.split('/')[1]!),loan=(await completion.list(groupId,'LOAN')).find(l=>l.id===loanId);if(!loan)throw Error('LOAN_NOT_FOUND');
    const loanRubrics=await repo.listRubricDefinitions(ctx.tenantId,groupId),rubric=loanRubrics.find(r=>r.id===String(loan.data.rubricId??''))??loanRubrics.find(r=>String(r.facets?.custom?.systemKey??'').toUpperCase()==='LOAN'||/^(pret|prets|emprunt|emprunts|loan|loans)$/.test(String(r.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim())),policy=d.resolveLoanPolicy(loan,rubric?.policies?.loan);
    const policyValues={rateBasisPointsPerPeriod:Number(policy.rateBasisPointsPerPeriod??loan.data.rateBasisPointsPerPeriod??0),paymentPriority:String(policy.paymentPriority??loan.data.paymentPriority??'CAPITAL_FIRST'),interestTiming:String(policy.interestTiming??loan.data.interestTiming??'NEXT_SESSION_DUE'),policyRevisionId:String(policy.policyRevisionId??loan.data.policyRevisionId??'')};
    const principal=integer(Number(loan.data.outstandingPrincipal??0),'LOAN_PRINCIPAL'),interest=integer(Number(loan.data.unpaidInterest??0),'LOAN_INTEREST');
    const snapshot=await financeDigest({loanId,version:loan.data.completionVersion,updatedAt:loan.updatedAt,principal,interest,policy:policyValues});
    if(request.method==='GET'&&!action.endsWith('/scenario')){
      const [events,periods,guarantors]=await Promise.all([repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.SHEET_EVENT',groupId),repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.LOAN_PERIOD',groupId),repo.listWorkspaceRecords(ctx.tenantId,'FINANCE.LOAN_GUARANTORS',groupId)]);
      return {...stamp(),loan:{id:loan.id,title:loan.title,state:loan.data.completionState,version:loan.data.completionVersion,principal,interest,totalDue:safeSum([principal,interest]),policy:policyValues,snapshot},events:events.filter(e=>String(e.data.loanId??'')===loanId).map(e=>({id:e.id,createdAt:e.createdAt,meetingId:e.data.meetingId??null,amount:e.data.amount??0,principalPaid:e.data.principalPaid??0,interestPaid:e.data.interestPaid??0,ledgerEntryId:e.data.ledgerEntryId??null})),periods:periods.filter(p=>String(p.data.loanId??'')===loanId).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id)).map(p=>({id:p.id,meetingId:p.data.meetingId??null,principalBefore:p.data.principalBefore,interestNew:p.data.interestNew,principalPaid:p.data.principalPaid,interestPaid:p.data.interestPaid,principalAfter:p.data.principalAfter,interestAfter:p.data.interestAfter,policyRevisionId:p.data.policyRevisionId??null})),guaranteeCount:guarantors.filter(g=>String(g.data.loanId??'')===loanId&&g.status!=='ARCHIVED').length,guaranteeDetailsIncluded:false};
    }
    if(action.endsWith('/scenario')&&request.method==='POST'){
      const input=await body();if(input.expectedSnapshot!==snapshot)throw Error('FINANCE_PREVIEW_STALE');
      const amount=integer(input.paymentAmount,'LOAN_PAYMENT',0),periods=integer(input.periods??3,'LOAN_PERIODS',1,24),start=integer(input.paymentStartPeriod??1,'PAYMENT_START_PERIOD',1,periods);
      const priority=policyValues.paymentPriority;
      if(priority==='EXPLICIT_ALLOCATION')throw Error('LOAN_EXPLICIT_ALLOCATION_REQUIRED');
      if(priority!=='CAPITAL_FIRST'&&priority!=='INTEREST_FIRST')throw Error('INVALID_LOAN_PRIORITY');
      const recordedDuePreview=applyLoanPayment({principalOutstanding:principal,unpaidInterest:interest,paymentAmount:amount,rateBasisPointsPerPeriod:0,priority});
      const future=principal>0?{principal,openingInterestDue:interest,periods,ratePercentPerPeriod:policyValues.rateBasisPointsPerPeriod/100,priority:priority as 'CAPITAL_FIRST'|'INTEREST_FIRST',interestBasis:'OUTSTANDING' as const,payments:Array.from({length:periods},(_,i)=>i+1>=start?amount:0)}:null;
      const rows=future?simulatePeriodicLoan(future):[];
      return {...stamp(),snapshot,recordedDuePreview,rows,summary:future?summarizePeriodicLoan(future,rows):null,assumptions:{paymentAmount:amount,paymentStartPeriod:start,periods,policy:policyValues,recordedPreviewIncludesNewMeetingInterest:false,futurePeriodsAreHypothetical:true},canExecuteFromPreview:false};
    }
  }
  if(action==='yield-receipts'&&request.method==='GET'){
    const exercises=(await completion.list(groupId,'GROUP_EXERCISE')).filter(e=>['CLOSED','CARRIED_FORWARD'].includes(String(e.data.completionState))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    const items=[];for(const e of exercises.slice(0,20)){
      let plan:any;try{plan=JSON.parse(String(e.data.closingPlanJson??''));}catch{items.push({exerciseId:e.id,title:e.title,status:'INPUTS_NOT_RECORDED'});continue;}
      if(!Array.isArray(plan?.members)){items.push({exerciseId:e.id,title:e.title,status:'INPUTS_NOT_RECORDED'});continue;}
      const envelopes=plan.members.filter((x:any)=>manager||x.membershipId===self?.id).map((x:any)=>({membershipId:x.membershipId,principal:x.principal,interest:x.interest,payableCash:x.payableCash,paidCash:x.paidCash,carriedTotal:x.carriedTotal}));
      if(!manager&&!envelopes.length)continue;
      items.push({exerciseId:e.id,title:e.title,state:e.data.completionState,version:e.data.completionVersion,status:'CLOSING_PLAN_SNAPSHOT',contentSha256:await financeDigest(plan),envelopes,...(manager?{totals:{principal:plan.totalPrincipal,interest:plan.totalInterest,allocated:plan.memberAllocatedTotal}}:{}),calculationInputsRecorded:false,paymentCertification:false});
    }
    return {...stamp(),items,totalExercises:exercises.length,readLimit:20,meaning:'Existing immutable closing allocation, not a new distribution, payment receipt or reconstructed historical calculation.'};
  }
  if(action==='yield-copy'&&request.method==='POST'){
    if(!manager)throw Error('FORBIDDEN_SCOPE');return {...stamp(),copy:await buildSavingsCalculationCopy(await body())};
  }
  if(action==='yield-copy/verify'&&request.method==='POST'){
    if(!manager)throw Error('FORBIDDEN_SCOPE');return {...stamp(),verification:await verifySavingsCalculationCopy(await body())};
  }
  if(action==='calendar'&&request.method==='GET'){
    const [cycles,shares,obligations,rubrics,entries]=await Promise.all([completion.list(groupId,'TONTINE_CYCLE'),completion.list(groupId,'TONTINE_SHARE'),repo.listObligations(ctx.tenantId),repo.listRubricDefinitions(ctx.tenantId,groupId),repo.listLedgerEntries(ctx.tenantId,groupId)]);
    const provenEntries=new Set(entries.map(e=>e.id));
    return {...stamp(),manager,cycles:cycles.map(c=>({id:c.id,title:c.title,state:c.data.completionState,rounds:c.data.rounds,nominalPotAmount:c.data.nominalPotAmount??null})),shares:shares.map(s=>({id:s.id,cycleId:s.data.cycleId,membershipId:s.data.membershipId,round:s.data.scheduledRound??null,state:s.data.completionState,benefitLedgerEntryId:s.data.benefitLedgerEntryId??null,servedWithEvidence:s.data.completionState==='SERVED'&&provenEntries.has(String(s.data.benefitLedgerEntryId??''))})),obligations:obligations.filter(o=>o.groupId===groupId&&(manager||o.assigneeId===ctx.actorId)).map(o=>({id:o.id,type:o.type,state:o.status,dueAt:o.dueAt??null,amount:o.amount??null,sourceId:o.sourceId??null})),assistanceRules:rubrics.filter(r=>r.policies?.assistance).map(r=>({rubricId:r.id,name:r.name,reviewStatus:r.policies!.assistance!.reviewStatus??'DRAFT',authorization:r.policies!.assistance!.authorization??'CUSTOM',events:(r.policies!.assistance!.eventRules??[]).map(x=>({key:x.key,label:x.label,eligibilityRule:x.eligibilityRule??null,representationRule:x.representationRule??null,sourceEvidence:x.sourceEvidence??null}))})),sensitiveDocumentsIncluded:false,roundDatesInferred:false};
  }
  if(action==='calendar/stress'&&request.method==='POST'){
    if(!manager)throw Error('FORBIDDEN_SCOPE');const input=await body(),cycle=(await completion.list(groupId,'TONTINE_CYCLE')).find(c=>c.id===input.cycleId);if(!cycle)throw Error('TONTINE_CYCLE_NOT_FOUND');
    const rounds=integer(Number(cycle.data.rounds),'TONTINE_ROUNDS',1,120),pot=integer(cycle.data.nominalPotAmount,'NOMINAL_POT_AMOUNT',1),opening=integer(input.openingCash,'OPENING_CASH'),incoming=integer(input.incomePerRound,'INCOME_PER_ROUND'),late=integer(input.delayedAmount,'DELAYED_AMOUNT',0,incoming),affected=integer(input.affectedRound,'AFFECTED_ROUND',1,rounds),release=input.releaseRound===null?null:integer(input.releaseRound,'RELEASE_ROUND',affected+1,rounds);
    const shares=(await completion.list(groupId,'TONTINE_SHARE')).filter(s=>s.data.cycleId===cycle.id&&s.data.completionState==='SCHEDULED');
    let baseline=opening,stressed=opening;const rows=[];for(let round=1;round<=rounds;round++){
      const plannedPayout=safeSum(shares.filter(s=>Number(s.data.scheduledRound)===round).map(()=>pot));
      baseline=safeSum([baseline,incoming,-plannedPayout]);const timingDelta=(round===affected?-late:0)+(round===release?late:0);stressed=safeSum([stressed,incoming,timingDelta,-plannedPayout]);rows.push({round,plannedPayout,declaredIncome:incoming,baseline,stressed,difference:safeSum([stressed,-baseline]),shortfall:Math.max(0,-stressed)});
    }
    return {...stamp(),cycleId:cycle.id,rows,assumptions:{openingCash:opening,incomePerRound:incoming,delayedAmount:late,affectedRound:affected,releaseRound:release,potAmount:pot},hypothetical:true,canonicalScheduleChanged:false,cashSource:'USER_DECLARED_SCENARIO_NOT_AVAILABLE_GROUP_BALANCE',scheduledSharesOnly:true};
  }
  throw Error('INVALID_FINANCE_EXPLANATION_METHOD');
}
