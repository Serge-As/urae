/** A read projection of Rubrics participation and canonical net receipts.
 * It never creates a receipt, cash movement, prepayment or second balance. */
export function projectTontineContribution(input:{eligible:boolean;shares:number;perShare:number;sessions:number;paidTotal:number;currentCash:number;targetCash?:number}){
  for(const [key,value] of Object.entries(input))if(typeof value==='number'&&(!Number.isSafeInteger(value)||value<0))throw Error('INVALID_TONTINE_POSITION_'+key.toUpperCase());
  const periodic=input.eligible?input.shares*input.perShare:0,expected=periodic*input.sessions;
  if(!Number.isSafeInteger(expected))throw Error('TONTINE_POSITION_OVERFLOW');
  const target=input.targetCash??input.currentCash,paidBefore=input.paidTotal-input.currentCash,paidAfter=paidBefore+target;
  if(paidBefore<0||!Number.isSafeInteger(paidAfter))throw Error('INVALID_TONTINE_RECEIPTS');
  const expectedBefore=Math.max(0,input.sessions-1)*periodic,arrearsBefore=Math.max(0,expectedBefore-paidBefore),advanceBefore=Math.max(0,paidBefore-expectedBefore),coveredByAdvance=Math.min(periodic,advanceBefore),remainingDue=Math.max(0,expected-paidAfter),advance=Math.max(0,paidAfter-expected);
  return{eligible:input.eligible,shares:input.shares,periodic,sessions:input.sessions,expectedCumulative:expected,paidBefore,paidTotal:input.paidTotal,currentCash:input.currentCash,targetCash:target,paidAfter,arrearsBefore,coveredByAdvance,maximumWithoutAdvance:Math.max(0,expected-paidBefore),remainingDue,advance,status:!input.eligible?'NOT_PARTICIPATING':remainingDue>0?'IN_ARREARS':advance>0?'IN_ADVANCE':'UP_TO_DATE',cashCollectedNow:target,ledgerMutationOnCoverage:false};
}
