export type SavingsYieldMode='EXACT_WEIGHTED_DEPOSITS'|'LEGACY_COEFFICIENTS'|'AMOUNT_TIME'|'HYBRID_TIME_AMOUNT';

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
    // Each deposit is weighted separately. We never multiply a member's annual total by one month coefficient.
    const amountFactor=mode==='HYBRID_TIME_AMOUNT'?Math.pow(d.amount,amountPower):d.amount;
    const score=amountFactor*coefficient;
    if(!Number.isFinite(score)||score<0)throw new Error('INVALID_DEPOSIT_SCORE');
    return{...d,coefficient,score};
  });
  const totalWeightedScore=deposits.reduce((n,d)=>n+d.score,0);
  if(pool>0&&totalWeightedScore<=0)throw new Error('ZERO_WEIGHT_CANNOT_DISTRIBUTE_INTEREST');
  const grouped=new Map<string,{principal:number;score:number;count:number}>();
  for(const d of deposits){
    const row=grouped.get(d.memberId)??{principal:0,score:0,count:0};
    row.principal+=d.amount;row.score+=d.score;row.count++;grouped.set(d.memberId,row);
  }
  const raw=[...grouped.entries()].map(([memberId,row],index)=>{
    const exactInterest=totalWeightedScore>0?pool*row.score/totalWeightedScore:0;
    return{index,memberId,principal:row.principal,weightedScore:row.score,depositCount:row.count,exactInterest,interest:Math.floor(exactInterest),remainder:exactInterest-Math.floor(exactInterest)};
  });
  let left=pool-raw.reduce((n,x)=>n+x.interest,0);
  raw.sort((a,b)=>b.remainder-a.remainder||b.weightedScore-a.weightedScore||a.memberId.localeCompare(b.memberId)||a.index-b.index);
  for(let i=0;i<left;i++)raw[i%raw.length]!.interest++;
  const members:SavingsMemberAllocation[]=raw.sort((a,b)=>a.index-b.index).map(({memberId,principal,weightedScore,depositCount,exactInterest,interest})=>({memberId,principal,weightedScore,depositCount,exactInterest,interest}));
  const distributedInterest=members.reduce((n,m)=>n+m.interest,0);
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
