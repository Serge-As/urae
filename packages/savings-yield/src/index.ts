export type SavingsYieldMode='EXACT_WEIGHTED_DEPOSITS'|'LEGACY_COEFFICIENTS'|'AMOUNT_TIME'|'HYBRID_TIME_AMOUNT';

export type SavingsFund='CLASSIC'|'SCHOOL';
export interface SavingsDeposit {
  id:string;
  memberId:string;
  amount:number;
  periodKey:string;
  fund?:SavingsFund;
}
export interface SavingsYieldInput {
  interestPool:number;
  deposits:SavingsDeposit[];
  coefficients:Record<string,number>;
  mode?:SavingsYieldMode;
  /** 1 keeps amount fully proportional. Values below 1 soften domination by very large late deposits. */
  amountPower?:number;
}
export interface SavingsDepositWeight extends SavingsDeposit {
  coefficient:number;
  score:number;
}
export interface SavingsMemberAllocation {
  memberId:string;
  principal:number;
  weightedScore:number;
  exactInterest:number;
  interest:number;
  depositCount:number;
}
export interface SavingsYieldResult {
  mode:SavingsYieldMode;
  interestPool:number;
  totalPrincipal:number;
  totalWeightedScore:number;
  distributedInterest:number;
  undistributedInterest:number;
  deposits:SavingsDepositWeight[];
  members:SavingsMemberAllocation[];
  explanation:string[];
}
export interface PoolShare {key:string;basisPoints:number;}
export interface PoolSplit {key:string;amount:number;basisPoints:number;}

const integer=(name:string,value:number,min=0)=>{
  if(!Number.isSafeInteger(value)||value<min)throw new Error('INVALID_'+name.toUpperCase());
  return value;
};
const finite=(name:string,value:number,min=0)=>{
  if(!Number.isFinite(value)||value<min)throw new Error('INVALID_'+name.toUpperCase());
  return value;
};

export function splitInterestPool(total:number,shares:PoolShare[]):PoolSplit[]{
  integer('interest_pool',total);
  if(!shares.length)throw new Error('POOL_SHARES_REQUIRED');
  const sum=shares.reduce((n,x)=>n+integer('basis_points',x.basisPoints),0);
  if(sum!==10000)throw new Error('POOL_SHARES_MUST_TOTAL_10000_BPS');
  const raw=shares.map((x,index)=>({index,key:x.key,basisPoints:x.basisPoints,exact:total*x.basisPoints/10000}));
  const out=raw.map(x=>({...x,amount:Math.floor(x.exact),remainder:x.exact-Math.floor(x.exact)}));
  let left=total-out.reduce((n,x)=>n+x.amount,0);
  out.sort((a,b)=>b.remainder-a.remainder||a.key.localeCompare(b.key)||a.index-b.index);
  for(let i=0;i<left;i++)out[i%out.length]!.amount++;
  return out.sort((a,b)=>a.index-b.index).map(({key,basisPoints,amount})=>({key,basisPoints,amount}));
}

const exactAllocate=(pool:number,rows:Array<{memberId:string;principal:number;score:number;depositCount:number}>):SavingsMemberAllocation[]=>{
  const totalScore=rows.reduce((n,x)=>n+x.score,0);
  if(pool>0&&totalScore<=0)throw new Error('ZERO_WEIGHT_CANNOT_DISTRIBUTE_INTEREST');
  const raw=rows.map((row,index)=>{
    const exactInterest=totalScore>0?pool*row.score/totalScore:0;
    return{...row,index,exactInterest,interest:Math.floor(exactInterest),remainder:exactInterest-Math.floor(exactInterest)};
  });
  let left=pool-raw.reduce((n,x)=>n+x.interest,0);
  raw.sort((a,b)=>b.remainder-a.remainder||b.score-a.score||a.memberId.localeCompare(b.memberId)||a.index-b.index);
  for(let i=0;i<left;i++)raw[i%raw.length]!.interest++;
  return raw.sort((a,b)=>a.index-b.index).map(({memberId,principal,score,depositCount,exactInterest,interest})=>({memberId,principal,weightedScore:score,depositCount,exactInterest,interest}));
};

export function allocateSavingsYield(input:SavingsYieldInput):SavingsYieldResult{
  const pool=integer('interest_pool',input.interestPool),mode=input.mode??'EXACT_WEIGHTED_DEPOSITS';
  if(!['EXACT_WEIGHTED_DEPOSITS','LEGACY_COEFFICIENTS','AMOUNT_TIME','HYBRID_TIME_AMOUNT'].includes(mode))throw new Error('INVALID_SAVINGS_YIELD_MODE');
  if(!Array.isArray(input.deposits)||!input.deposits.length)throw new Error('SAVINGS_DEPOSITS_REQUIRED');
  const amountPower=mode==='HYBRID_TIME_AMOUNT'?finite('amount_power',input.amountPower??0.75,0):1;
  if(amountPower<=0||amountPower>1)throw new Error('INVALID_AMOUNT_POWER');
  const seen=new Set<string>();
  const deposits:SavingsDepositWeight[]=input.deposits.map(d=>{
    if(!d.id||seen.has(d.id))throw new Error('INVALID_DEPOSIT_ID');seen.add(d.id);
    if(!d.memberId||!d.periodKey)throw new Error('INVALID_DEPOSIT_DIMENSION');
    integer('deposit_amount',d.amount,1);
    const coefficient=input.coefficients[d.periodKey];
    if(coefficient===undefined)throw new Error('MISSING_PERIOD_COEFFICIENT:'+d.periodKey);
    finite('period_coefficient',coefficient);
    const amountFactor=mode==='HYBRID_TIME_AMOUNT'?Math.pow(d.amount,amountPower):d.amount;
    const score=amountFactor*coefficient;
    if(!Number.isFinite(score)||score<0)throw new Error('INVALID_DEPOSIT_SCORE');
    return{...d,coefficient,score};
  });
  const grouped=new Map<string,{principal:number;score:number;count:number}>();
  for(const d of deposits){
    const row=grouped.get(d.memberId)??{principal:0,score:0,count:0};
    row.principal+=d.amount;row.score+=d.score;row.count++;grouped.set(d.memberId,row);
  }
  const members=exactAllocate(pool,[...grouped.entries()].map(([memberId,row])=>({memberId,principal:row.principal,score:row.score,depositCount:row.count})));
  const totalWeightedScore=deposits.reduce((n,d)=>n+d.score,0),distributedInterest=members.reduce((n,m)=>n+m.interest,0);
  return{
    mode,interestPool:pool,totalPrincipal:deposits.reduce((n,d)=>n+d.amount,0),totalWeightedScore,
    distributedInterest,undistributedInterest:pool-distributedInterest,deposits,members,
    explanation:[
      'Chaque dépôt reçoit séparément le coefficient de sa période.',
      'Le score d’un membre est la somme des scores de ses dépôts, jamais son épargne annuelle multipliée par un coefficient unique.',
      'La répartition part de l’enveloppe réelle d’intérêts à distribuer.',
      'La méthode des plus grands restes affecte les derniers francs d’arrondi : la somme distribuée est exactement égale à l’enveloppe.'
    ]
  };
}


export type SavingsEligibilityPolicy='ALL_DEPOSITS'|'LOAN_SESSION_GATE';
export function eligibleSavingsDeposits<T extends {session:number}>(deposits:T[],policy:SavingsEligibilityPolicy,loanDisbursementSessions:number[],eligibleThroughSession:number):T[]{
  const cutoff=integer('eligible_through_session',eligibleThroughSession,1),loanSessions=new Set(loanDisbursementSessions.map(x=>integer('loan_session',x,1)));
  if(!['ALL_DEPOSITS','LOAN_SESSION_GATE'].includes(policy))throw new Error('INVALID_SAVINGS_ELIGIBILITY_POLICY');
  return deposits.filter(d=>{
    integer('deposit_session',d.session,1);
    if(d.session>cutoff)return false;
    return policy==='ALL_DEPOSITS'||loanSessions.has(d.session);
  });
}

export type BorrowerRewardMode='VOLUME_TIME_INTEREST'|'VOLUME_TIME'|'INTEREST_TIME';
export interface BorrowerRewardLoan{
  loanId:string;
  memberId:string;
  principal:number;
  disbursedSession:number;
  repaidSession?:number;
  realizedInterest:number;
}
export interface BorrowerRewardInput{
  interestPool:number;
  endSession:number;
  mode?:BorrowerRewardMode;
  loans:BorrowerRewardLoan[];
}
export interface BorrowerRewardResult{
  interestPool:number;
  mode:BorrowerRewardMode;
  eligibleLoanCount:number;
  distributedInterest:number;
  members:SavingsMemberAllocation[];
  loans:Array<BorrowerRewardLoan&{eligible:boolean;earlyDuration:number;score:number}>;
  explanation:string[];
}
export function allocateBorrowerReward(input:BorrowerRewardInput):BorrowerRewardResult{
  const pool=integer('interest_pool',input.interestPool),endSession=integer('end_session',input.endSession,1),mode=input.mode??'VOLUME_TIME_INTEREST';
  if(!['VOLUME_TIME_INTEREST','VOLUME_TIME','INTEREST_TIME'].includes(mode))throw new Error('INVALID_BORROWER_REWARD_MODE');
  const seen=new Set<string>(),rows:Array<BorrowerRewardLoan&{eligible:boolean;earlyDuration:number;score:number}>=[];
  for(const loan of input.loans){
    if(!loan.loanId||seen.has(loan.loanId)||!loan.memberId)throw new Error('INVALID_BORROWER_LOAN_ID');seen.add(loan.loanId);
    integer('borrowed_principal',loan.principal,1);integer('disbursed_session',loan.disbursedSession,1);integer('realized_interest',loan.realizedInterest,0);
    if(loan.disbursedSession>endSession)throw new Error('LOAN_AFTER_END_SESSION');
    if(loan.repaidSession!==undefined){integer('repaid_session',loan.repaidSession,loan.disbursedSession);if(loan.repaidSession>endSession)throw new Error('REPAYMENT_AFTER_END_SESSION');}
    const eligible=loan.repaidSession!==undefined,earlyDuration=Math.max(1,endSession-loan.disbursedSession+1);
    const base=mode==='VOLUME_TIME'?loan.principal:mode==='INTEREST_TIME'?loan.realizedInterest:loan.principal+loan.realizedInterest;
    rows.push({...loan,eligible,earlyDuration,score:eligible?base*earlyDuration:0});
  }
  const grouped=new Map<string,{principal:number;score:number;count:number}>();
  for(const loan of rows.filter(x=>x.eligible&&x.score>0)){const row=grouped.get(loan.memberId)??{principal:0,score:0,count:0};row.principal+=loan.principal;row.score+=loan.score;row.count++;grouped.set(loan.memberId,row);}
  const members=pool>0?exactAllocate(pool,[...grouped.entries()].map(([memberId,row])=>({memberId,principal:row.principal,score:row.score,depositCount:row.count}))):[...grouped.entries()].map(([memberId,row])=>({memberId,principal:row.principal,weightedScore:row.score,depositCount:row.count,exactInterest:0,interest:0}));
  return{interestPool:pool,mode,eligibleLoanCount:rows.filter(x=>x.eligible).length,distributedInterest:members.reduce((n,m)=>n+m.interest,0),members,loans:rows,explanation:[
    'Seuls les prêts dont le capital est totalement remboursé à la date de clôture sont éligibles à la prime emprunteur.',
    mode==='VOLUME_TIME_INTEREST'?'Poids = (capital emprunté + intérêts réellement payés) × ancienneté du prêt.':mode==='VOLUME_TIME'?'Poids = capital emprunté × ancienneté du prêt.':'Poids = intérêts réellement payés × ancienneté du prêt.',
    'Un prêt ancien reçoit plus de poids à montant comparable ; aucune dette encore ouverte ne génère de rétrocommission.',
    'Les derniers francs sont distribués par plus grands restes pour conserver exactement le pool.'
  ]};
}

/* -------------------------------------------------------------------------- */
/*  Workbook-compatible staged model                                           */
/* -------------------------------------------------------------------------- */

export interface WorkbookYieldFundConfig{
  fund:SavingsFund;
  shareBasisPoints:number;
  eligiblePeriods:string[];
  /** Historical “highest distribution percentage/coefficient”, e.g. 9. */
  highestCoefficient:number;
  coefficients:Record<string,number>;
}
export interface WorkbookYieldPipelineInput{
  realizedInterestPool:number;
  deposits:SavingsDeposit[];
  funds:WorkbookYieldFundConfig[];
  bureauShareBasisPoints:number;
}
export interface WorkbookYieldDepositStage extends SavingsDeposit{
  fund:SavingsFund;
  eligible:boolean;
  coefficient:number;
  provisionalRate:number;
  provisionalInterest:number;
  exactFinalInterest:number;
  finalInterest:number;
}
export interface WorkbookYieldFundResult{
  fund:SavingsFund;
  allocatedPool:number;
  totalPrincipal:number;
  eligiblePrincipal:number;
  generalRatePercent:number;
  highestCoefficient:number;
  provisionalBaseRate:number;
  provisionalTotal:number;
  normalizationRatio:number;
  deposits:WorkbookYieldDepositStage[];
  members:SavingsMemberAllocation[];
  distributedInterest:number;
}
export interface WorkbookYieldPipelineResult{
  realizedInterestPool:number;
  bureauIndemnity:number;
  funds:WorkbookYieldFundResult[];
  distributedToSavers:number;
  totalAllocated:number;
  exactPoolConservation:boolean;
  algebraicFinding:string;
  warnings:string[];
}

export function simulateWorkbookYieldPipeline(input:WorkbookYieldPipelineInput):WorkbookYieldPipelineResult{
  const total=integer('realized_interest_pool',input.realizedInterestPool);
  if(!Array.isArray(input.funds)||!input.funds.length)throw new Error('WORKBOOK_YIELD_FUNDS_REQUIRED');
  const shares:PoolShare[]=[
    ...input.funds.map(f=>({key:f.fund,basisPoints:integer('share_basis_points',f.shareBasisPoints)})),
    {key:'BUREAU',basisPoints:integer('bureau_share_basis_points',input.bureauShareBasisPoints)}
  ];
  const split=splitInterestPool(total,shares),seenFunds=new Set<SavingsFund>(),warnings:string[]=[];
  const results:WorkbookYieldFundResult[]=[];
  for(const config of input.funds){
    if(seenFunds.has(config.fund))throw new Error('DUPLICATE_SAVINGS_FUND');seenFunds.add(config.fund);
    const allocatedPool=split.find(x=>x.key===config.fund)?.amount??0;
    const fundDeposits=input.deposits.filter(d=>(d.fund??'CLASSIC')===config.fund);
    const totalPrincipal=fundDeposits.reduce((n,d)=>n+integer('deposit_amount',d.amount,1),0);
    if(allocatedPool>0&&totalPrincipal<=0)throw new Error('NO_PRINCIPAL_FOR_ALLOCATED_POOL:'+config.fund);
    const highest=finite('highest_coefficient',config.highestCoefficient);
    if(highest<=0)throw new Error('INVALID_HIGHEST_COEFFICIENT');
    const generalRatePercent=totalPrincipal>0?(allocatedPool/totalPrincipal)*100:0;
    const provisionalBaseRate=generalRatePercent/highest;
    const eligible=new Set(config.eligiblePeriods);
    const stages:WorkbookYieldDepositStage[]=fundDeposits.map(d=>{
      if(!d.id||!d.memberId||!d.periodKey)throw new Error('INVALID_DEPOSIT_DIMENSION');
      const coefficient=finite('period_coefficient',config.coefficients[d.periodKey]??0);
      const isEligible=eligible.has(d.periodKey);
      const provisionalInterest=isEligible?d.amount*provisionalBaseRate*coefficient:0;
      return{...d,fund:config.fund,eligible:isEligible,coefficient,provisionalRate:provisionalBaseRate,provisionalInterest,exactFinalInterest:0,finalInterest:0};
    });
    const provisionalTotal=stages.reduce((n,d)=>n+d.provisionalInterest,0);
    if(allocatedPool>0&&provisionalTotal<=0)throw new Error('ZERO_PROVISIONAL_INTEREST_FOR_ALLOCATED_POOL:'+config.fund);
    const normalizationRatio=allocatedPool>0?provisionalTotal/allocatedPool:0;
    const byMember=new Map<string,{principal:number;score:number;count:number}>();
    for(const d of stages){
      const row=byMember.get(d.memberId)??{principal:0,score:0,count:0};
      row.principal+=d.amount;
      // Provisional interest is used as the workbook score. Common scale factors cancel at normalization.
      row.score+=d.provisionalInterest;row.count++;byMember.set(d.memberId,row);
      d.exactFinalInterest=normalizationRatio>0?d.provisionalInterest/normalizationRatio:0;
    }
    const members=exactAllocate(allocatedPool,[...byMember.entries()].map(([memberId,r])=>({memberId,principal:r.principal,score:r.score,depositCount:r.count})));
    const memberInterest=new Map(members.map(m=>[m.memberId,m.interest]));
    // Deposit-level integer final is advisory only; exact member total is authoritative after largest-remainder rounding.
    for(const d of stages)d.finalInterest=Math.floor(d.exactFinalInterest);
    const distributedInterest=members.reduce((n,m)=>n+m.interest,0);
    if(highest!==Math.max(...Object.values(config.coefficients).filter(Number.isFinite),0))warnings.push('HIGHEST_COEFFICIENT_DIFFERS_FROM_PERIOD_MAX:'+config.fund);
    if(memberInterest.size===0&&allocatedPool>0)warnings.push('NO_MEMBER_ALLOCATION:'+config.fund);
    results.push({fund:config.fund,allocatedPool,totalPrincipal,eligiblePrincipal:stages.filter(x=>x.eligible).reduce((n,d)=>n+d.amount,0),generalRatePercent,highestCoefficient:highest,provisionalBaseRate,provisionalTotal,normalizationRatio,deposits:stages,members,distributedInterest});
  }
  const bureauIndemnity=split.find(x=>x.key==='BUREAU')?.amount??0,distributedToSavers=results.reduce((n,x)=>n+x.distributedInterest,0);
  const totalAllocated=distributedToSavers+bureauIndemnity;
  return{
    realizedInterestPool:total,bureauIndemnity,funds:results,distributedToSavers,totalAllocated,exactPoolConservation:totalAllocated===total,
    algebraicFinding:'Dans le pipeline historique linéaire, le taux général, la division par le coefficient maximal et le ratio final de normalisation sont des facteurs communs. Après normalisation, la part relative dépend de montant × coefficient de période. Les étapes restent utiles pour reproduire et expliquer le classeur, mais le coefficient maximal seul ne modifie pas la répartition finale.',
    warnings
  };
}

/* -------------------------------------------------------------------------- */
/*  Capital-at-work model — recommended fairness engine                        */
/* -------------------------------------------------------------------------- */

export type CapitalAllocationMethod='PRO_RATA_AVAILABLE'|'FIFO_AVAILABLE';
export interface CapitalAtWorkDeposit{
  id:string;memberId:string;amount:number;session:number;fund:SavingsFund;
}
export type CapitalAtWorkEvent=
  |{type:'LOAN_DISBURSEMENT';session:number;loanId:string;amount:number;fund:SavingsFund}
  |{type:'LOAN_PRINCIPAL_REPAYMENT';session:number;loanId:string;amount:number}
  |{type:'LOAN_INTEREST_RECEIPT';session:number;loanId:string;amount:number;fund:SavingsFund};
export interface CapitalAtWorkPolicy{
  allocationMethod:CapitalAllocationMethod;
  /** When true, idle savings earn nothing until they are actually allocated to a loan. */
  noLoanNoYield:boolean;
  /** Returned principal becomes available again with its original saver ownership. */
  recyclePrincipalRepayments:boolean;
  /** Realized interest may be re-lent as collective profit capital; it never becomes a member's principal. */
  reinvestRealizedInterest:boolean;
}
export interface CapitalAtWorkInput{
  interestPool:number;
  deposits:CapitalAtWorkDeposit[];
  events:CapitalAtWorkEvent[];
  policy:CapitalAtWorkPolicy;
  endSession:number;
}
export interface CapitalLotExposure{
  lotId:string;
  memberId?:string;
  fund:SavingsFund;
  originalAmount:number;
  availableAmount:number;
  outstandingAmount:number;
  exposure:number;
  source:'MEMBER_SAVINGS'|'REALIZED_INTEREST';
}
export interface CapitalAtWorkResult{
  interestPool:number;
  realizedInterestReceipts:number;
  totalMemberPrincipal:number;
  totalMemberExposure:number;
  collectiveProfitExposure:number;
  loansDisbursed:number;
  principalRepaid:number;
  members:SavingsMemberAllocation[];
  lots:CapitalLotExposure[];
  distributedInterest:number;
  exactPoolConservation:boolean;
  explanation:string[];
}

type MutableLot=CapitalLotExposure&{createdSession:number};
type LoanAllocation={lotId:string;amount:number};
type OpenLoan={loanId:string;fund:SavingsFund;outstanding:number;allocations:LoanAllocation[]};

export function allocateCapitalAtWorkYield(input:CapitalAtWorkInput):CapitalAtWorkResult{
  const pool=integer('interest_pool',input.interestPool),endSession=integer('end_session',input.endSession,1);
  if(!input.deposits.length)throw new Error('SAVINGS_DEPOSITS_REQUIRED');
  const ids=new Set<string>(),lots:MutableLot[]=[];
  for(const d of input.deposits){
    if(!d.id||ids.has(d.id)||!d.memberId)throw new Error('INVALID_DEPOSIT_ID');ids.add(d.id);
    integer('deposit_amount',d.amount,1);integer('deposit_session',d.session,1);
    if(d.session>endSession)throw new Error('DEPOSIT_AFTER_END_SESSION');
    lots.push({lotId:d.id,memberId:d.memberId,fund:d.fund,originalAmount:d.amount,availableAmount:0,outstandingAmount:0,exposure:0,source:'MEMBER_SAVINGS',createdSession:d.session});
  }
  const events=[...input.events].sort((a,b)=>a.session-b.session||(['LOAN_PRINCIPAL_REPAYMENT','LOAN_INTEREST_RECEIPT','LOAN_DISBURSEMENT'].indexOf(a.type)-['LOAN_PRINCIPAL_REPAYMENT','LOAN_INTEREST_RECEIPT','LOAN_DISBURSEMENT'].indexOf(b.type)));
  for(const e of events){integer('event_session',e.session,1);if(e.session>endSession)throw new Error('EVENT_AFTER_END_SESSION');integer('event_amount',e.amount,1);}
  const loans=new Map<string,OpenLoan>();
  let cursor=1,loansDisbursed=0,principalRepaid=0,realizedInterestReceipts=0,collectiveSeq=0;
  const activateDeposits=(session:number)=>{for(const l of lots)if(l.source==='MEMBER_SAVINGS'&&l.createdSession===session&&l.availableAmount===0&&l.outstandingAmount===0)l.availableAmount=l.originalAmount;};
  const accrue=(delta:number)=>{if(delta<=0)return;for(const l of lots)l.exposure+=l.outstandingAmount*delta;};
  activateDeposits(1);
  const sessions=[...new Set(events.map(e=>e.session).concat(input.deposits.map(d=>d.session),[endSession+1]))].sort((a,b)=>a-b);
  for(const session of sessions){
    if(session<cursor)continue;
    accrue(session-cursor);cursor=session;
    if(session<=endSession)activateDeposits(session);
    for(const e of events.filter(x=>x.session===session)){
      if(e.type==='LOAN_PRINCIPAL_REPAYMENT'){
        const loan=loans.get(e.loanId);if(!loan)throw new Error('LOAN_NOT_FOUND:'+e.loanId);
        if(e.amount>loan.outstanding)throw new Error('REPAYMENT_EXCEEDS_OUTSTANDING:'+e.loanId);
        const ratio=e.amount/loan.outstanding;
        let returned=0;
        for(const a of loan.allocations){
          const lot=lots.find(l=>l.lotId===a.lotId)!;
          const part=a===loan.allocations[loan.allocations.length-1]?e.amount-returned:Math.floor(a.amount*ratio);
          returned+=part;a.amount-=part;lot.outstandingAmount-=part;
          if(input.policy.recyclePrincipalRepayments)lot.availableAmount+=part;
        }
        loan.allocations=loan.allocations.filter(a=>a.amount>0);loan.outstanding-=e.amount;principalRepaid+=e.amount;
        if(loan.outstanding===0)loans.delete(e.loanId);
      }else if(e.type==='LOAN_INTEREST_RECEIPT'){
        realizedInterestReceipts+=e.amount;
        if(input.policy.reinvestRealizedInterest){
          lots.push({lotId:'collective-interest-'+(++collectiveSeq),fund:e.fund,originalAmount:e.amount,availableAmount:e.amount,outstandingAmount:0,exposure:0,source:'REALIZED_INTEREST',createdSession:session});
        }
      }else{
        if(loans.has(e.loanId))throw new Error('DUPLICATE_LOAN_ID:'+e.loanId);
        const candidates=lots.filter(l=>l.fund===e.fund&&l.availableAmount>0);
        const available=candidates.reduce((n,l)=>n+l.availableAmount,0);
        if(e.amount>available)throw new Error('INSUFFICIENT_LOANABLE_CAPITAL:'+e.loanId);
        const allocations:LoanAllocation[]=[];let remaining=e.amount;
        if(input.policy.allocationMethod==='FIFO_AVAILABLE'){
          candidates.sort((a,b)=>a.createdSession-b.createdSession||a.lotId.localeCompare(b.lotId));
          for(const l of candidates){if(remaining<=0)break;const take=Math.min(l.availableAmount,remaining);l.availableAmount-=take;l.outstandingAmount+=take;allocations.push({lotId:l.lotId,amount:take});remaining-=take;}
        }else{
          const base=candidates.map(l=>({lot:l,exact:e.amount*l.availableAmount/available,take:0,remainder:0}));
          for(const x of base){x.take=Math.floor(x.exact);x.remainder=x.exact-x.take;}
          let left=e.amount-base.reduce((n,x)=>n+x.take,0);base.sort((a,b)=>b.remainder-a.remainder||a.lot.lotId.localeCompare(b.lot.lotId));
          for(let i=0;i<left;i++)base[i%base.length]!.take++;
          for(const x of base.filter(x=>x.take>0)){x.lot.availableAmount-=x.take;x.lot.outstandingAmount+=x.take;allocations.push({lotId:x.lot.lotId,amount:x.take});}
        }
        loans.set(e.loanId,{loanId:e.loanId,fund:e.fund,outstanding:e.amount,allocations});loansDisbursed+=e.amount;
      }
    }
  }
  const memberLots=lots.filter(l=>l.source==='MEMBER_SAVINGS'&&l.memberId);
  const byMember=new Map<string,{principal:number;score:number;count:number}>();
  for(const l of memberLots){
    const row=byMember.get(l.memberId!)??{principal:0,score:0,count:0};
    row.principal+=l.originalAmount;row.score+=input.policy.noLoanNoYield?l.exposure:(l.originalAmount*Math.max(0,endSession-l.createdSession+1));row.count++;byMember.set(l.memberId!,row);
  }
  const members=exactAllocate(pool,[...byMember.entries()].map(([memberId,r])=>({memberId,principal:r.principal,score:r.score,depositCount:r.count})));
  const distributedInterest=members.reduce((n,m)=>n+m.interest,0),totalMemberExposure=memberLots.reduce((n,l)=>n+l.exposure,0),collectiveProfitExposure=lots.filter(l=>l.source==='REALIZED_INTEREST').reduce((n,l)=>n+l.exposure,0);
  return{
    interestPool:pool,realizedInterestReceipts,totalMemberPrincipal:memberLots.reduce((n,l)=>n+l.originalAmount,0),totalMemberExposure,collectiveProfitExposure,loansDisbursed,principalRepaid,members,lots:lots.map(({createdSession,...l})=>l),distributedInterest,exactPoolConservation:distributedInterest===pool,
    explanation:[
      input.policy.noLoanNoYield?'Une épargne idle ne gagne aucun poids : seuls les montants effectivement prêtés accumulent une exposition productive.':'Le groupe a choisi un poids calendaire même lorsque l’épargne reste idle.',
      'Lorsqu’un capital prêté est remboursé, son propriétaire économique reste le dépôt d’origine ; s’il est prêté à nouveau, il accumule une nouvelle période productive.',
      input.policy.reinvestRealizedInterest?'Les intérêts encaissés peuvent être reprêtés comme capital collectif de profit. Ils ne deviennent pas le principal individuel d’un membre et ne créent pas d’intérêt sur intérêt d’un emprunteur.':'Les intérêts encaissés ne sont pas réinjectés dans le capital prêté.',
      'Le pool final décidé par le Bureau est réparti selon l’exposition productive des dépôts, puis arrondi par plus grands restes afin de conserver exactement 100 % du pool.'
    ]
  };
}


/* -------------------------------------------------------------------------- */
/*  Policy-driven fairness lab                                                 */
/* -------------------------------------------------------------------------- */

export type FundPoolingMode='SEGREGATED'|'POOLED'|'CUSTOM_MATRIX';
export type ResidualYieldPolicy='TIME_WEIGHTED'|'FIXED_FUND_SPLIT'|'UNALLOCATED';

export interface CapitalTimeDeposit extends CapitalAtWorkDeposit{
  periodKey?:string;
}
export interface CapitalTimePolicy{
  endSession:number;
  /** Last session whose deposits are allowed to earn a yield. Defaults to endSession. */
  eligibleThroughSession?:number;
  /** 1 = linear time. >1 deliberately strengthens the premium for early deposits. */
  timeExponent?:number;
  /** 1 = amount fully proportional. Values below 1 soften domination by very large deposits. */
  amountPower?:number;
}
export interface CapitalTimeYieldInput{
  interestPool:number;
  deposits:CapitalTimeDeposit[];
  policy:CapitalTimePolicy;
}
export interface CapitalTimeYieldResult extends SavingsYieldResult{
  timeExponent:number;
  amountPower:number;
  endSession:number;
  eligibleThroughSession:number;
}

/**
 * Transparent alternative to hand-tuned monthly coefficients.
 * score = amount^amountPower × productive_time^timeExponent.
 * With defaults (1,1), twice the amount or twice the eligible time gives twice the score.
 */
export function allocateCapitalTimeYield(input:CapitalTimeYieldInput):CapitalTimeYieldResult{
  const pool=integer('interest_pool',input.interestPool);
  if(!input.deposits.length)throw new Error('SAVINGS_DEPOSITS_REQUIRED');
  const endSession=integer('end_session',input.policy.endSession,1);
  const eligibleThroughSession=integer('eligible_through_session',input.policy.eligibleThroughSession??endSession,1);
  if(eligibleThroughSession>endSession)throw new Error('ELIGIBLE_SESSION_AFTER_END');
  const timeExponent=finite('time_exponent',input.policy.timeExponent??1,0);
  const amountPower=finite('amount_power',input.policy.amountPower??1,0);
  if(timeExponent<=0||timeExponent>5)throw new Error('INVALID_TIME_EXPONENT');
  if(amountPower<=0||amountPower>1)throw new Error('INVALID_AMOUNT_POWER');
  const seen=new Set<string>();
  const deposits:SavingsDepositWeight[]=input.deposits.map(d=>{
    if(!d.id||seen.has(d.id)||!d.memberId)throw new Error('INVALID_DEPOSIT_ID');seen.add(d.id);
    integer('deposit_amount',d.amount,1);integer('deposit_session',d.session,1);
    if(d.session>endSession)throw new Error('DEPOSIT_AFTER_END_SESSION');
    const eligible=d.session<=eligibleThroughSession;
    const productiveTime=eligible?Math.max(1,endSession-d.session+1):0;
    const coefficient=eligible?Math.pow(productiveTime,timeExponent):0;
    const score=eligible?Math.pow(d.amount,amountPower)*coefficient:0;
    return{id:d.id,memberId:d.memberId,amount:d.amount,periodKey:d.periodKey??String(d.session),fund:d.fund,coefficient,score};
  });
  const grouped=new Map<string,{principal:number;score:number;count:number}>();
  for(const d of deposits){
    const row=grouped.get(d.memberId)??{principal:0,score:0,count:0};
    row.principal+=d.amount;row.score+=d.score;row.count++;grouped.set(d.memberId,row);
  }
  const members=exactAllocate(pool,[...grouped.entries()].map(([memberId,row])=>({memberId,principal:row.principal,score:row.score,depositCount:row.count})));
  const distributedInterest=members.reduce((n,m)=>n+m.interest,0);
  return{
    mode:'AMOUNT_TIME',interestPool:pool,totalPrincipal:deposits.reduce((n,d)=>n+d.amount,0),
    totalWeightedScore:deposits.reduce((n,d)=>n+d.score,0),distributedInterest,undistributedInterest:pool-distributedInterest,
    deposits,members,timeExponent,amountPower,endSession,eligibleThroughSession,
    explanation:[
      'Le poids est calculé directement à partir du montant et du temps : montant^β × durée^α.',
      'α=1 et β=1 donnent une règle linéaire, facile à expliquer : plus tôt et plus élevé = plus de droits.',
      'α>1 permet au groupe de privilégier encore davantage les dépôts précoces ; β<1 peut limiter la domination de très gros dépôts si le groupe le décide.',
      'La date/session limite d’éligibilité est une politique du groupe et n’est jamais figée dans Eco-System.',
      'Les derniers francs d’arrondi utilisent la méthode des plus grands restes afin que le pool soit conservé exactement.'
    ]
  };
}

export interface AttributedLoanCycle{
  loanId:string;
  disbursedSession:number;
  principal:number;
  /** Realized gross interest evidenced for this loan/cycle. */
  realizedInterest:number;
  /** Session where the evidenced principal is available again. Omit when still outstanding at closing. */
  repaidSession?:number;
  /** Required for SEGREGATED, optional for POOLED. */
  sourceFund?:SavingsFund;
  /** For CUSTOM_MATRIX, explicitly list the funds authorized to finance this loan. */
  eligibleFunds?:SavingsFund[];
}
export interface AttributedProductivePolicy{
  officeShareBasisPoints:number;
  poolingMode:FundPoolingMode;
  allocationMethod:CapitalAllocationMethod;
  residualPolicy:ResidualYieldPolicy;
  endSession:number;
  eligibleThroughSession?:number;
  timeExponent?:number;
  amountPower?:number;
  /** Used only when residualPolicy=FIXED_FUND_SPLIT. Saver fund shares must total 10000 bps. */
  residualFundSharesBasisPoints?:Partial<Record<SavingsFund,number>>;
}
export interface AttributedProductiveInput{
  realizedInterestPool:number;
  deposits:CapitalTimeDeposit[];
  loans:AttributedLoanCycle[];
  policy:AttributedProductivePolicy;
}
export interface AttributedLoanTrace{
  loanId:string;
  principal:number;
  grossInterest:number;
  saverInterest:number;
  disbursedSession:number;
  repaidSession?:number;
  allocations:Array<{lotId:string;memberId:string;fund:SavingsFund;amount:number}>;
  fundPrincipal:Partial<Record<SavingsFund,number>>;
}
export interface AttributedProductiveResult{
  realizedInterestPool:number;
  officeIndemnity:number;
  saverPool:number;
  evidencedGrossInterest:number;
  residualGrossInterest:number;
  attributedSaverInterest:number;
  residualSaverInterest:number;
  unallocatedSaverInterest:number;
  members:SavingsMemberAllocation[];
  fundInterest:Partial<Record<SavingsFund,number>>;
  loanTraces:AttributedLoanTrace[];
  exactPoolConservation:boolean;
  warnings:string[];
  explanation:string[];
}

type ProductiveLot={
  lotId:string;memberId:string;fund:SavingsFund;amount:number;available:number;session:number;
};
const integerAllocate=(pool:number,rows:Array<{key:string;score:number}>)=>{
  integer('allocation_pool',pool);
  if(pool===0)return rows.map(x=>({key:x.key,amount:0,exact:0}));
  const total=rows.reduce((n,x)=>n+x.score,0);
  if(total<=0)throw new Error('ZERO_WEIGHT_CANNOT_DISTRIBUTE_INTEREST');
  const raw=rows.map((r,index)=>({index,key:r.key,score:r.score,exact:pool*r.score/total,amount:0,remainder:0}));
  for(const r of raw){r.amount=Math.floor(r.exact);r.remainder=r.exact-r.amount;}
  let left=pool-raw.reduce((n,x)=>n+x.amount,0);
  raw.sort((a,b)=>b.remainder-a.remainder||b.score-a.score||a.key.localeCompare(b.key)||a.index-b.index);
  for(let i=0;i<left;i++)raw[i%raw.length]!.amount++;
  return raw.sort((a,b)=>a.index-b.index).map(({key,amount,exact})=>({key,amount,exact}));
};

/**
 * Causal engine: each evidenced loan carries its own realized interest back to the
 * savings lots that actually financed that loan. Unmatched interest is never invented;
 * it follows an explicit residual policy chosen by the group/Bureau.
 */
export function allocateAttributedProductiveYield(input:AttributedProductiveInput):AttributedProductiveResult{
  const total=integer('realized_interest_pool',input.realizedInterestPool),officeBps=integer('office_share_basis_points',input.policy.officeShareBasisPoints);
  if(officeBps>10000)throw new Error('INVALID_OFFICE_SHARE');
  const endSession=integer('end_session',input.policy.endSession,1);
  const eligibleThroughSession=integer('eligible_through_session',input.policy.eligibleThroughSession??endSession,1);
  if(eligibleThroughSession>endSession)throw new Error('ELIGIBLE_SESSION_AFTER_END');
  if(!input.deposits.length)throw new Error('SAVINGS_DEPOSITS_REQUIRED');
  const timeExponent=finite('time_exponent',input.policy.timeExponent??1,0),amountPower=finite('amount_power',input.policy.amountPower??1,0);
  if(timeExponent<=0||timeExponent>5)throw new Error('INVALID_TIME_EXPONENT');
  if(amountPower<=0||amountPower>1)throw new Error('INVALID_AMOUNT_POWER');
  if(!['SEGREGATED','POOLED','CUSTOM_MATRIX'].includes(input.policy.poolingMode))throw new Error('INVALID_POOLING_MODE');
  if(!['PRO_RATA_AVAILABLE','FIFO_AVAILABLE'].includes(input.policy.allocationMethod))throw new Error('INVALID_CAPITAL_ALLOCATION_METHOD');
  if(!['TIME_WEIGHTED','FIXED_FUND_SPLIT','UNALLOCATED'].includes(input.policy.residualPolicy))throw new Error('INVALID_RESIDUAL_POLICY');

  const poolSplit=splitInterestPool(total,[{key:'SAVERS',basisPoints:10000-officeBps},{key:'OFFICE',basisPoints:officeBps}]);
  const saverPool=poolSplit.find(x=>x.key==='SAVERS')!.amount,officeIndemnity=poolSplit.find(x=>x.key==='OFFICE')!.amount;
  const ids=new Set<string>(),lots:ProductiveLot[]=input.deposits.map(d=>{
    if(!d.id||ids.has(d.id)||!d.memberId)throw new Error('INVALID_DEPOSIT_ID');ids.add(d.id);
    integer('deposit_amount',d.amount,1);integer('deposit_session',d.session,1);
    if(d.session>endSession)throw new Error('DEPOSIT_AFTER_END_SESSION');
    return{lotId:d.id,memberId:d.memberId,fund:d.fund,amount:d.amount,available:0,session:d.session};
  });
  const loans=[...input.loans].sort((a,b)=>a.disbursedSession-b.disbursedSession||a.loanId.localeCompare(b.loanId));
  const loanIds=new Set<string>();
  for(const loan of loans){
    if(!loan.loanId||loanIds.has(loan.loanId))throw new Error('INVALID_LOAN_ID');loanIds.add(loan.loanId);
    integer('loan_principal',loan.principal,1);integer('loan_interest',loan.realizedInterest,0);integer('loan_session',loan.disbursedSession,1);
    if(loan.disbursedSession>endSession)throw new Error('LOAN_AFTER_END_SESSION');
    if(loan.repaidSession!==undefined){integer('loan_repaid_session',loan.repaidSession,loan.disbursedSession);if(loan.repaidSession>endSession)throw new Error('REPAYMENT_AFTER_END_SESSION');}
    if(input.policy.poolingMode==='SEGREGATED'&&!loan.sourceFund)throw new Error('SOURCE_FUND_REQUIRED:'+loan.loanId);
    if(input.policy.poolingMode==='CUSTOM_MATRIX'&&!(loan.eligibleFunds?.length))throw new Error('ELIGIBLE_FUNDS_REQUIRED:'+loan.loanId);
  }
  const evidencedGrossInterest=loans.reduce((n,l)=>n+l.realizedInterest,0);
  if(evidencedGrossInterest>total)throw new Error('EVIDENCED_INTEREST_EXCEEDS_POOL');
  const residualGrossInterest=total-evidencedGrossInterest;
  const grossBuckets=[...loans.map(l=>({key:'loan:'+l.loanId,score:l.realizedInterest})),{key:'residual',score:residualGrossInterest}];
  const saverByGross=integerAllocate(saverPool,grossBuckets.filter(x=>x.score>0));
  const saverAmountFor=(key:string)=>saverByGross.find(x=>x.key===key)?.amount??0;

  const memberInterest=new Map<string,number>(),memberPrincipal=new Map<string,number>(),memberCount=new Map<string,number>(),fundInterest:Partial<Record<SavingsFund,number>>={CLASSIC:0,SCHOOL:0};
  for(const lot of lots){memberPrincipal.set(lot.memberId,(memberPrincipal.get(lot.memberId)??0)+lot.amount);memberCount.set(lot.memberId,(memberCount.get(lot.memberId)??0)+1);}
  const traces:AttributedLoanTrace[]=[],warnings:string[]=[];
  const returnedAt=new Map<number,Array<{lotId:string;amount:number}>>();
  const activate=(session:number)=>{for(const l of lots)if(l.session===session&&l.available===0)l.available=l.amount;};
  activate(1);
  const allSessions=[...new Set(lots.map(x=>x.session).concat(loans.flatMap(x=>[x.disbursedSession,...(x.repaidSession?[x.repaidSession]:[])]),[endSession]))].sort((a,b)=>a-b);
  const allocationByLoan=new Map<string,Array<{lotId:string;memberId:string;fund:SavingsFund;amount:number}>>();
  for(const session of allSessions){
    if(session>1)activate(session);
    for(const r of returnedAt.get(session)??[]){const lot=lots.find(x=>x.lotId===r.lotId);if(lot)lot.available+=r.amount;}
    for(const loan of loans.filter(x=>x.disbursedSession===session)){
      const allowedFunds=input.policy.poolingMode==='POOLED'
        ?new Set<SavingsFund>(['CLASSIC','SCHOOL'])
        :input.policy.poolingMode==='SEGREGATED'
          ?new Set<SavingsFund>([loan.sourceFund!])
          :new Set<SavingsFund>(loan.eligibleFunds!);
      const candidates=lots.filter(l=>l.available>0&&allowedFunds.has(l.fund)&&l.session<=eligibleThroughSession);
      const available=candidates.reduce((n,l)=>n+l.available,0);
      if(loan.principal>available)throw new Error('INSUFFICIENT_PRODUCTIVE_CAPITAL:'+loan.loanId);
      const allocations:Array<{lotId:string;memberId:string;fund:SavingsFund;amount:number}>=[];
      if(input.policy.allocationMethod==='FIFO_AVAILABLE'){
        candidates.sort((a,b)=>a.session-b.session||a.lotId.localeCompare(b.lotId));let remaining=loan.principal;
        for(const l of candidates){if(remaining<=0)break;const take=Math.min(l.available,remaining);l.available-=take;remaining-=take;allocations.push({lotId:l.lotId,memberId:l.memberId,fund:l.fund,amount:take});}
      }else{
        const parts=integerAllocate(loan.principal,candidates.map(l=>({key:l.lotId,score:l.available})));
        for(const p of parts.filter(x=>x.amount>0)){const l=candidates.find(x=>x.lotId===p.key)!;l.available-=p.amount;allocations.push({lotId:l.lotId,memberId:l.memberId,fund:l.fund,amount:p.amount});}
      }
      allocationByLoan.set(loan.loanId,allocations);
      if(loan.repaidSession!==undefined){
        const list=returnedAt.get(loan.repaidSession)??[];for(const a of allocations)list.push({lotId:a.lotId,amount:a.amount});returnedAt.set(loan.repaidSession,list);
      }
      const saverInterest=saverAmountFor('loan:'+loan.loanId);
      if(saverInterest>0){
        const parts=integerAllocate(saverInterest,allocations.map(a=>({key:a.lotId,score:a.amount})));
        for(const p of parts){
          const a=allocations.find(x=>x.lotId===p.key)!;
          memberInterest.set(a.memberId,(memberInterest.get(a.memberId)??0)+p.amount);
          fundInterest[a.fund]=(fundInterest[a.fund]??0)+p.amount;
        }
      }
      const fundPrincipal:Partial<Record<SavingsFund,number>>={};
      for(const a of allocations)fundPrincipal[a.fund]=(fundPrincipal[a.fund]??0)+a.amount;
      traces.push({loanId:loan.loanId,principal:loan.principal,grossInterest:loan.realizedInterest,saverInterest,disbursedSession:loan.disbursedSession,repaidSession:loan.repaidSession,allocations,fundPrincipal});
    }
  }

  const residualSaverInterest=saverAmountFor('residual');let unallocatedSaverInterest=0;
  if(residualSaverInterest>0){
    if(input.policy.residualPolicy==='UNALLOCATED'){
      unallocatedSaverInterest=residualSaverInterest;warnings.push('RESIDUAL_INTEREST_HELD_FOR_BUREAU_DECISION');
    }else if(input.policy.residualPolicy==='TIME_WEIGHTED'){
      const weights=lots.map(l=>({key:l.lotId,score:l.session<=eligibleThroughSession?Math.pow(l.amount,amountPower)*Math.pow(Math.max(1,endSession-l.session+1),timeExponent):0})).filter(x=>x.score>0);
      const parts=integerAllocate(residualSaverInterest,weights);
      for(const p of parts){const l=lots.find(x=>x.lotId===p.key)!;memberInterest.set(l.memberId,(memberInterest.get(l.memberId)??0)+p.amount);fundInterest[l.fund]=(fundInterest[l.fund]??0)+p.amount;}
    }else{
      const shares=input.policy.residualFundSharesBasisPoints??{};
      const classic=integer('classic_residual_share',Number(shares.CLASSIC??0)),school=integer('school_residual_share',Number(shares.SCHOOL??0));
      if(classic+school!==10000)throw new Error('RESIDUAL_FUND_SHARES_MUST_TOTAL_10000_BPS');
      const split=splitInterestPool(residualSaverInterest,[{key:'CLASSIC',basisPoints:classic},{key:'SCHOOL',basisPoints:school}]);
      for(const s of split){
        if(s.amount===0)continue;const fund=s.key as SavingsFund;
        const weights=lots.filter(l=>l.fund===fund&&l.session<=eligibleThroughSession).map(l=>({key:l.lotId,score:Math.pow(l.amount,amountPower)*Math.pow(Math.max(1,endSession-l.session+1),timeExponent)}));
        if(!weights.length){unallocatedSaverInterest+=s.amount;warnings.push('NO_ELIGIBLE_DEPOSITS_FOR_RESIDUAL_FUND:'+fund);continue;}
        const parts=integerAllocate(s.amount,weights);for(const p of parts){const l=lots.find(x=>x.lotId===p.key)!;memberInterest.set(l.memberId,(memberInterest.get(l.memberId)??0)+p.amount);fundInterest[l.fund]=(fundInterest[l.fund]??0)+p.amount;}
      }
    }
  }
  const members:SavingsMemberAllocation[]=[...memberPrincipal.entries()].map(([memberId,principal])=>({memberId,principal,weightedScore:0,exactInterest:memberInterest.get(memberId)??0,interest:memberInterest.get(memberId)??0,depositCount:memberCount.get(memberId)??0})).sort((a,b)=>b.interest-a.interest||a.memberId.localeCompare(b.memberId));
  const attributedSaverInterest=traces.reduce((n,x)=>n+x.saverInterest,0);
  const distributed=members.reduce((n,x)=>n+x.interest,0);
  if(input.policy.poolingMode==='POOLED')warnings.push('CLASSIC_AND_SCHOOL_SAVINGS_MAY_FINANCE_THE_SAME_LOANS');
  if(residualGrossInterest>0)warnings.push('UNATTRIBUTED_GROSS_INTEREST:'+residualGrossInterest);
  return{
    realizedInterestPool:total,officeIndemnity,saverPool,evidencedGrossInterest,residualGrossInterest,attributedSaverInterest,residualSaverInterest,unallocatedSaverInterest,
    members,fundInterest,loanTraces:traces,exactPoolConservation:officeIndemnity+distributed+unallocatedSaverInterest===total,warnings,
    explanation:[
      'La part du Bureau est prélevée sur le pool réel selon la clé décidée par le groupe.',
      'Chaque intérêt de prêt documenté est attribué aux lots d’épargne qui ont effectivement financé ce prêt.',
      'Le principal remboursé revient aux mêmes lots et peut financer un prêt ultérieur : la propriété économique du capital n’est pas perdue.',
      'Le mélange Épargne classique / Épargne scolaire est un paramètre explicite : séparé, mutualisé ou matrice personnalisée.',
      'Les intérêts non rattachés à un prêt restent visibles comme résidu et suivent une politique explicite : pondération temps, clé fixe ou attente de décision.',
      'Aucun lien prêt ↔ épargne n’est inventé lorsqu’il manque une preuve.'
    ]
  };
}

export interface YieldPolicyPreset{
  id:string;labelFr:string;descriptionFr:string;recommendedWhen:string;requiresLoanEvidence:boolean;
}
export const SAVINGS_YIELD_POLICY_PRESETS:YieldPolicyPreset[]=[
  {id:'LEGACY_COEFFICIENTS',labelFr:'Méthode historique à coefficients',descriptionFr:'Reproduit les coefficients décidés par le Bureau et la méthode du classeur.',recommendedWhen:'Le groupe veut conserver exactement sa méthode actuelle ou migrer un historique.',requiresLoanEvidence:false},
  {id:'CAPITAL_TIME_LINEAR',labelFr:'Capital × temps (linéaire)',descriptionFr:'Le montant et la durée d’immobilisation comptent directement, sans coefficients arbitraires.',recommendedWhen:'Le groupe veut une règle simple, transparente et fortement explicable qui favorise naturellement les dépôts précoces.',requiresLoanEvidence:false},
  {id:'CAPITAL_TIME_EARLY_BONUS',labelFr:'Capital × temps avec bonus de précocité',descriptionFr:'Même principe, avec un exposant temps > 1 décidé par le groupe pour renforcer la prime aux dépôts très précoces.',recommendedWhen:'Le groupe veut encourager explicitement les dépôts des premiers mois.',requiresLoanEvidence:false},
  {id:'ATTRIBUTED_PRODUCTIVE',labelFr:'Capital réellement productif',descriptionFr:'Les intérêts documentés d’un prêt reviennent aux lots d’épargne qui ont réellement financé ce prêt.',recommendedWhen:'Le groupe peut tracer suffisamment bien prêts, sources de caisse, remboursements et intérêts.',requiresLoanEvidence:true},
  {id:'HYBRID_PRODUCTIVE_TIME',labelFr:'Hybride productif + temps',descriptionFr:'Les intérêts attribuables suivent les prêts réels ; le résidu suit une pondération montant × temps ou reste en attente de décision.',recommendedWhen:'Les historiques sont partiellement traçables et le groupe veut éviter d’inventer les liens manquants.',requiresLoanEvidence:true}
];
