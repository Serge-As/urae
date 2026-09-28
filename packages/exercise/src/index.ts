export type PrincipalDisposition='RETURN_TO_MEMBER'|'CARRY_FORWARD';
export type InterestDisposition='PAY_OUT'|'CARRY_FORWARD';

export interface ExerciseMemberYield {
  membershipId:string;
  principal:number;
  interest:number;
}
export interface ExerciseRetainedFund {
  code:string;
  label:string;
  amount:number;
  carryForward:boolean;
}
export interface ExerciseClosingInput {
  closingCash:number;
  members:ExerciseMemberYield[];
  retainedFunds?:ExerciseRetainedFund[];
  principalDisposition:PrincipalDisposition;
  interestDisposition:InterestDisposition;
  unassignedCarryForward?:number;
}
export interface ExerciseMemberEnvelope {
  membershipId:string;
  principal:number;
  interest:number;
  cashPayout:number;
  principalCarryForward:number;
  interestCarryForward:number;
  nextExerciseOpeningPosition:number;
}
export interface ExerciseClosingPlan {
  closingCash:number;
  totalPrincipal:number;
  totalInterest:number;
  retainedFundsTotal:number;
  retainedFundsPayoutTotal:number;
  retainedFundsCarryForwardTotal:number;
  memberCashPayoutTotal:number;
  memberCarryForwardTotal:number;
  unassignedCarryForward:number;
  cashOutTotal:number;
  plannedCarryForwardTotal:number;
  requiredCashAtClose:number;
  unallocatedCash:number;
  nextExerciseOpeningCash:number;
  members:ExerciseMemberEnvelope[];
  retainedFunds:ExerciseRetainedFund[];
  balanced:boolean;
}
const xaf=(name:string,value:number)=>{if(!Number.isSafeInteger(value)||value<0)throw Error('INVALID_'+name.toUpperCase());return value;};
export function buildExerciseClosingPlan(input:ExerciseClosingInput):ExerciseClosingPlan{
  const closingCash=xaf('closing_cash',input.closingCash),unassigned=xaf('unassigned_carry_forward',input.unassignedCarryForward??0);
  const seen=new Set<string>();
  const members=input.members.map(row=>{
    if(!row.membershipId||seen.has(row.membershipId))throw Error('INVALID_EXERCISE_MEMBER');seen.add(row.membershipId);
    const principal=xaf('principal',row.principal),interest=xaf('interest',row.interest);
    const principalReturn=input.principalDisposition==='RETURN_TO_MEMBER'?principal:0,interestReturn=input.interestDisposition==='PAY_OUT'?interest:0;
    const principalCarry=principal-principalReturn,interestCarry=interest-interestReturn;
    return{membershipId:row.membershipId,principal,interest,cashPayout:principalReturn+interestReturn,principalCarryForward:principalCarry,interestCarryForward:interestCarry,nextExerciseOpeningPosition:principalCarry+interestCarry};
  });
  const retainedFunds=(input.retainedFunds??[]).map(f=>({code:String(f.code??'').trim(),label:String(f.label??'').trim(),amount:xaf('retained_fund',f.amount),carryForward:Boolean(f.carryForward)}));
  if(retainedFunds.some(x=>!x.code||!x.label))throw Error('INVALID_RETAINED_FUND');
  if(new Set(retainedFunds.map(x=>x.code)).size!==retainedFunds.length)throw Error('DUPLICATE_RETAINED_FUND');
  const totalPrincipal=members.reduce((n,x)=>n+x.principal,0),totalInterest=members.reduce((n,x)=>n+x.interest,0),
    retainedFundsTotal=retainedFunds.reduce((n,x)=>n+x.amount,0),
    retainedFundsPayoutTotal=retainedFunds.filter(x=>!x.carryForward).reduce((n,x)=>n+x.amount,0),
    retainedFundsCarryForwardTotal=retainedFunds.filter(x=>x.carryForward).reduce((n,x)=>n+x.amount,0),
    memberCashPayoutTotal=members.reduce((n,x)=>n+x.cashPayout,0),
    memberCarryForwardTotal=members.reduce((n,x)=>n+x.nextExerciseOpeningPosition,0),
    cashOutTotal=memberCashPayoutTotal+retainedFundsPayoutTotal,
    plannedCarryForwardTotal=memberCarryForwardTotal+retainedFundsCarryForwardTotal+unassigned,
    requiredCashAtClose=cashOutTotal+plannedCarryForwardTotal,
    unallocatedCash=closingCash-requiredCashAtClose;
  if(unallocatedCash<0)throw Error('EXERCISE_CLOSING_EXCEEDS_CASH');
  const nextExerciseOpeningCash=plannedCarryForwardTotal+unallocatedCash;
  if(nextExerciseOpeningCash!==closingCash-cashOutTotal)throw Error('EXERCISE_CLOSING_BALANCE_MISMATCH');
  return{closingCash,totalPrincipal,totalInterest,retainedFundsTotal,retainedFundsPayoutTotal,retainedFundsCarryForwardTotal,memberCashPayoutTotal,memberCarryForwardTotal,unassignedCarryForward:unassigned,cashOutTotal,plannedCarryForwardTotal,requiredCashAtClose,unallocatedCash,nextExerciseOpeningCash,members,retainedFunds,balanced:true};
}

export interface ExerciseCarryForwardSeed {
  sourceExerciseId:string;
  nextLabel:string;
  openingCash:number;
  memberOpeningPositions:Array<{membershipId:string;principal:number;interest:number;total:number}>;
  retainedFunds:Array<{code:string;label:string;amount:number}>;
}
export function buildExerciseCarryForwardSeed(sourceExerciseId:string,nextLabel:string,plan:ExerciseClosingPlan):ExerciseCarryForwardSeed{
  if(!sourceExerciseId.trim()||!nextLabel.trim())throw Error('EXERCISE_ID_AND_LABEL_REQUIRED');
  return{sourceExerciseId,nextLabel,openingCash:plan.nextExerciseOpeningCash,
    memberOpeningPositions:plan.members.filter(x=>x.nextExerciseOpeningPosition>0).map(x=>({membershipId:x.membershipId,principal:x.principalCarryForward,interest:x.interestCarryForward,total:x.nextExerciseOpeningPosition})),
    retainedFunds:plan.retainedFunds.filter(x=>x.carryForward&&x.amount>0).map(x=>({code:x.code,label:x.label,amount:x.amount}))};
}
