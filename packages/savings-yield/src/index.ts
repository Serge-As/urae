export type SavingsYieldMode='EXACT_WEIGHTED_DEPOSITS'|'LEGACY_COEFFICIENTS'|'WORKBOOK_RECONSTRUCTED'|'AMOUNT_TIME'|'HYBRID_TIME_AMOUNT';
export type SavingsUtilizationBasis='NEW_DISBURSEMENT'|'OUTSTANDING_LOANS';

export interface SavingsDeposit {
  id:string;
  memberId:string;
  amount:number;
  periodKey:string;
}
export interface SavingsYieldInput {
  interestPool:number;
  deposits:SavingsDeposit[];
  coefficients:Record<string,number>;
  mode?:SavingsYieldMode;
  /** 1 keeps amount fully proportional. Values below 1 soften domination by very large late deposits. */
  amountPower?:number;
  /** Optional group rule: 0 means the period earns nothing, 1 means fully productive, intermediate values prorate. */
  periodProductivity?:Record<string,number>;
}
export interface SavingsDepositWeight extends SavingsDeposit {
  coefficient:number;
  productivity:number;
  score:number;
  provisionalInterest?:number;
}
export interface SavingsMemberAllocation {
  memberId:string;
  principal:number;
  weightedScore:number;
  exactInterest:number;
  interest:number;
  depositCount:number;
}
export interface SavingsYieldStages {
  generalRatePercent:number;
  maxCoefficient:number;
  provisionalBaseRate:number;
  provisionalTotal:number;
  normalizationRatio:number;
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
  stages:SavingsYieldStages;
  explanation:string[];
}
export interface PoolShare {key:string;basisPoints:number;}
export interface PoolSplit {key:string;amount:number;basisPoints:number;}

export interface SavingsPeriodActivity {
  periodKey:string;
  sequence:number;
  /** New loans paid during the period. */
  loanDisbursed:number;
  /** Principal returned by borrowers. It restores lendable liquidity but does not create new member-owned savings principal. */
  principalRepaid:number;
  /** Interest cash received from borrowers. It may be re-lent only when the group policy explicitly permits it. */
  interestCollected?:number;
  otherLendableInflow?:number;
  durationWeight?:number;
}
export interface SavingsAtWorkPolicy {
  utilizationBasis:SavingsUtilizationBasis;
  includeInterestAsLendable?:boolean;
  includeOtherLendableInflow?:boolean;
  openingLendableLiquidity?:number;
  openingOutstandingLoans?:number;
}
export interface SavingsAtWorkPeriod {
  periodKey:string;
  sequence:number;
  memberOwnedPrincipal:number;
  lendableLiquidityBeforeLoans:number;
  loanDisbursed:number;
  principalRepaid:number;
  outstandingLoans:number;
  utilization:number;
  durationWeight:number;
  modeledLiquidityAfterLoans:number;
}
export interface SavingsAtWorkResult {
  interestPool:number;
  utilizationBasis:SavingsUtilizationBasis;
  totalPrincipal:number;
  totalExposure:number;
  distributedInterest:number;
  undistributedInterest:number;
  periods:SavingsAtWorkPeriod[];
  members:SavingsMemberAllocation[];
  warnings:string[];
  explanation:string[];
}

const integer=(name:string,value:number,min=0)=>{
  if(!Number.isSafeInteger(value)||value<min)throw new Error('INVALID_'+name.toUpperCase());
  return value;
};
const finite=(name:string,value:number,min=0)=>{
  if(!Number.isFinite(value)||value<min)throw new Error('INVALID_'+name.toUpperCase());
  return value;
};
const clamp01=(value:number)=>Math.max(0,Math.min(1,value));

function exactAllocation(pool:number,rows:Array<{memberId:string;principal:number;score:number;count:number}>):SavingsMemberAllocation[]{
  const total=rows.reduce((n,x)=>n+x.score,0);
  if(pool>0&&total<=0)throw new Error('ZERO_WEIGHT_CANNOT_DISTRIBUTE_INTEREST');
  const raw=rows.map((row,index)=>{
    const exactInterest=total>0?pool*row.score/total:0;
    return{index,...row,exactInterest,interest:Math.floor(exactInterest),remainder:exactInterest-Math.floor(exactInterest)};
  });
  let left=pool-raw.reduce((n,x)=>n+x.interest,0);
  raw.sort((a,b)=>b.remainder-a.remainder||b.score-a.score||a.memberId.localeCompare(b.memberId)||a.index-b.index);
  for(let i=0;i<left;i++)raw[i%raw.length]!.interest++;
  return raw.sort((a,b)=>a.index-b.index).map(({memberId,principal,score,exactInterest,interest,count})=>({memberId,principal,weightedScore:score,exactInterest,interest,depositCount:count}));
}

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

/**
 * Reconstructs the workbook's multi-stage logic while making every intermediate
 * quantity explicit and auditable.
 *
 * Historical chain:
 *   generalRatePercent = distributablePool / totalPrincipal * 100
 *   provisionalBaseRate = generalRatePercent / maxCoefficient
 *   provisional(deposit) = amount * provisionalBaseRate * coefficient
 *   normalizationRatio = provisionalTotal / distributablePool
 *   final(deposit) = provisional(deposit) / normalizationRatio
 *
 * Mathematically the constant provisionalBaseRate cancels at the final
 * normalization. It is nevertheless preserved because the workbook exposes it
 * and managers use it to understand/calibrate their method.
 */
export function allocateSavingsYield(input:SavingsYieldInput):SavingsYieldResult{
  const pool=integer('interest_pool',input.interestPool),mode=input.mode??'EXACT_WEIGHTED_DEPOSITS';
  if(!['EXACT_WEIGHTED_DEPOSITS','LEGACY_COEFFICIENTS','WORKBOOK_RECONSTRUCTED','AMOUNT_TIME','HYBRID_TIME_AMOUNT'].includes(mode))throw new Error('INVALID_SAVINGS_YIELD_MODE');
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
    const productivity=input.periodProductivity?.[d.periodKey]??1;
    finite('period_productivity',productivity);
    if(productivity>1)throw new Error('INVALID_PERIOD_PRODUCTIVITY');
    const amountFactor=mode==='HYBRID_TIME_AMOUNT'?Math.pow(d.amount,amountPower):d.amount;
    const score=amountFactor*coefficient*productivity;
    if(!Number.isFinite(score)||score<0)throw new Error('INVALID_DEPOSIT_SCORE');
    return{...d,coefficient,productivity,score};
  });
  const totalPrincipal=deposits.reduce((n,d)=>n+d.amount,0);
  const maxCoefficient=Math.max(...Object.values(input.coefficients).map(v=>finite('period_coefficient',v)));
  const generalRatePercent=totalPrincipal>0?pool/totalPrincipal*100:0;
  const provisionalBaseRate=maxCoefficient>0?generalRatePercent/maxCoefficient:0;
  let provisionalTotal=0;
  for(const d of deposits){
    // The workbook uses raw amount for the intermediate provisional column,
    // even when another modern weighting mode is selected.
    d.provisionalInterest=d.amount*provisionalBaseRate*d.coefficient*d.productivity;
    provisionalTotal+=d.provisionalInterest;
  }
  const normalizationRatio=pool>0?provisionalTotal/pool:0;
  const totalWeightedScore=deposits.reduce((n,d)=>n+d.score,0);
  const grouped=new Map<string,{principal:number;score:number;count:number}>();
  for(const d of deposits){
    const row=grouped.get(d.memberId)??{principal:0,score:0,count:0};
    row.principal+=d.amount;row.score+=d.score;row.count++;grouped.set(d.memberId,row);
  }
  const members=exactAllocation(pool,[...grouped.entries()].map(([memberId,row])=>({memberId,principal:row.principal,score:row.score,count:row.count})));
  const distributedInterest=members.reduce((n,m)=>n+m.interest,0);
  return{
    mode,interestPool:pool,totalPrincipal,totalWeightedScore,distributedInterest,undistributedInterest:pool-distributedInterest,deposits,members,
    stages:{generalRatePercent,maxCoefficient,provisionalBaseRate,provisionalTotal,normalizationRatio},
    explanation:[
      'Le moteur conserve la chaîne du classeur : Principal → intérêts provisoires → ratio de normalisation → intérêts finaux.',
      'Chaque dépôt est traité séparément à la séance/période où il apparaît ; le total annuel d’un membre ne reçoit jamais un coefficient unique.',
      'Le coefficient de période intervient dans le calcul provisoire puis la normalisation ramène l’ensemble exactement à l’enveloppe décidée par le Bureau.',
      'Un facteur de productivité peut rendre une période inéligible (0) ou partiellement productive, par exemple lorsqu’un groupe décide qu’une séance sans prêt ne produit aucun gain.',
      'La méthode des plus grands restes affecte les derniers francs d’arrondi : la somme finale distribuée est exactement égale à l’enveloppe.'
    ]
  };
}

/**
 * A more economically defensible alternative to arbitrary month coefficients.
 * It measures member-owned savings capital while it is actually supporting
 * loans. Repayments restore lendable liquidity without being counted a second
 * time as new member principal.
 */
export function allocateSavingsYieldAtWork(input:{
  interestPool:number;
  deposits:SavingsDeposit[];
  periods:SavingsPeriodActivity[];
  policy:SavingsAtWorkPolicy;
  openingMemberPrincipal?:Record<string,number>;
}):SavingsAtWorkResult{
  const pool=integer('interest_pool',input.interestPool);
  if(!input.periods.length)throw new Error('SAVINGS_PERIODS_REQUIRED');
  const periods=[...input.periods].sort((a,b)=>a.sequence-b.sequence||a.periodKey.localeCompare(b.periodKey));
  const periodKeys=new Set<string>(),sequences=new Set<number>();
  for(const p of periods){
    if(!p.periodKey||periodKeys.has(p.periodKey))throw new Error('INVALID_SAVINGS_PERIOD_KEY');periodKeys.add(p.periodKey);
    if(!Number.isSafeInteger(p.sequence)||p.sequence<0||sequences.has(p.sequence))throw new Error('INVALID_SAVINGS_PERIOD_SEQUENCE');sequences.add(p.sequence);
    integer('loan_disbursed',p.loanDisbursed);integer('principal_repaid',p.principalRepaid);
    finite('interest_collected',p.interestCollected??0);finite('other_lendable_inflow',p.otherLendableInflow??0);finite('duration_weight',p.durationWeight??1);
  }
  if(!['NEW_DISBURSEMENT','OUTSTANDING_LOANS'].includes(input.policy.utilizationBasis))throw new Error('INVALID_UTILIZATION_BASIS');
  const memberCapital=new Map<string,number>();
  for(const [memberId,amount] of Object.entries(input.openingMemberPrincipal??{})){
    if(!memberId)throw new Error('INVALID_MEMBER_ID');memberCapital.set(memberId,integer('opening_member_principal',amount));
  }
  const depositsByPeriod=new Map<string,SavingsDeposit[]>();
  const seen=new Set<string>();
  for(const d of input.deposits){
    if(!d.id||seen.has(d.id))throw new Error('INVALID_DEPOSIT_ID');seen.add(d.id);
    if(!d.memberId||!periodKeys.has(d.periodKey))throw new Error('INVALID_DEPOSIT_DIMENSION');
    integer('deposit_amount',d.amount,1);
    const list=depositsByPeriod.get(d.periodKey)??[];list.push(d);depositsByPeriod.set(d.periodKey,list);
  }
  let lendableLiquidity=integer('opening_lendable_liquidity',input.policy.openingLendableLiquidity??0);
  let outstandingLoans=integer('opening_outstanding_loans',input.policy.openingOutstandingLoans??0);
  const exposure=new Map<string,number>(),periodRows:SavingsAtWorkPeriod[]=[],warnings:string[]=[];
  for(const p of periods){
    const deposits=depositsByPeriod.get(p.periodKey)??[];
    const savingsIn=deposits.reduce((n,d)=>n+d.amount,0);
    for(const d of deposits)memberCapital.set(d.memberId,(memberCapital.get(d.memberId)??0)+d.amount);
    const interestLendable=input.policy.includeInterestAsLendable?(p.interestCollected??0):0;
    const otherLendable=input.policy.includeOtherLendableInflow?(p.otherLendableInflow??0):0;
    // Principal repayments are recycled capital: cash returns to the pool, but no
    // member receives a second ownership credit for the same historical savings.
    lendableLiquidity+=savingsIn+p.principalRepaid+interestLendable+otherLendable;
    const liquidityBefore=lendableLiquidity;
    if(p.loanDisbursed>liquidityBefore)warnings.push('LOAN_DISBURSEMENT_EXCEEDS_MODELED_LIQUIDITY:'+p.periodKey);
    lendableLiquidity=Math.max(0,lendableLiquidity-p.loanDisbursed);
    outstandingLoans=Math.max(0,outstandingLoans-p.principalRepaid)+p.loanDisbursed;
    const totalPrincipal=[...memberCapital.values()].reduce((n,v)=>n+v,0);
    const basis=input.policy.utilizationBasis==='NEW_DISBURSEMENT'?p.loanDisbursed:outstandingLoans;
    const utilization=totalPrincipal>0?clamp01(basis/totalPrincipal):0;
    const durationWeight=p.durationWeight??1;
    for(const [memberId,principal] of memberCapital)exposure.set(memberId,(exposure.get(memberId)??0)+principal*utilization*durationWeight);
    periodRows.push({periodKey:p.periodKey,sequence:p.sequence,memberOwnedPrincipal:totalPrincipal,lendableLiquidityBeforeLoans:liquidityBefore,loanDisbursed:p.loanDisbursed,principalRepaid:p.principalRepaid,outstandingLoans,utilization,durationWeight,modeledLiquidityAfterLoans:lendableLiquidity});
  }
  const principalByMember=new Map<string,number>();
  for(const [m,v] of memberCapital)principalByMember.set(m,v);
  const rows=[...principalByMember.entries()].map(([memberId,principal])=>({memberId,principal,score:exposure.get(memberId)??0,count:input.deposits.filter(d=>d.memberId===memberId).length}));
  const members=exactAllocation(pool,rows);
  const totalExposure=members.reduce((n,m)=>n+m.weightedScore,0),distributedInterest=members.reduce((n,m)=>n+m.interest,0);
  return{
    interestPool:pool,utilizationBasis:input.policy.utilizationBasis,totalPrincipal:[...memberCapital.values()].reduce((n,v)=>n+v,0),
    totalExposure,distributedInterest,undistributedInterest:pool-distributedInterest,periods:periodRows,members,warnings,
    explanation:[
      'Le capital appartenant aux épargnants est distingué de la liquidité disponible sur la table.',
      'Un remboursement de principal remet de l’argent à disposition pour un nouveau prêt sans être compté une deuxième fois comme nouvelle épargne du membre.',
      input.policy.includeInterestAsLendable?'Les intérêts encaissés peuvent être prêtés de nouveau comme liquidité selon la politique du groupe, sans capitaliser la dette du débiteur.':'Les intérêts encaissés ne sont pas considérés comme liquidité prêtable dans cette simulation.',
      input.policy.utilizationBasis==='NEW_DISBURSEMENT'?'Une période sans nouveau prêt reçoit un facteur de productivité nul, conformément aux groupes qui refusent tout gain à une épargne non prêtée pendant la séance.':'Le facteur mesure les prêts encore en circulation ; une épargne peut donc rester productive même sans nouveau décaissement si elle continue de soutenir des prêts antérieurs.',
      'Les gains finaux sont répartis proportionnellement à l’exposition productive cumulée puis arrondis exactement à l’enveloppe disponible.'
    ]
  };
}
