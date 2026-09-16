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
