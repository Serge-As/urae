export type LoanPaymentPriority='CAPITAL_FIRST'|'INTEREST_FIRST'|'EXPLICIT_ALLOCATION';
export type LoanInterestBasis='OUTSTANDING'|'INITIAL';

export interface PeriodicLoanInput{
  principal:number;
  periods:number;
  ratePercentPerPeriod:number;
  priority:LoanPaymentPriority;
  interestBasis?:LoanInterestBasis;
  payments?:number[];
  principalPayments?:number[];
  interestPayments?:number[];
  openingInterestDue?:number;
}

export interface PeriodicLoanLine{
  period:number;
  principalBefore:number;
  interestOpening:number;
  interestNew:number;
  payment:number;
  principalPaid:number;
  interestPaid:number;
  unappliedPayment:number;
  principalAfter:number;
  interestAfter:number;
  totalDebtAfter:number;
  nextTaxablePrincipal:number;
  nextInterestProjected:number;
  nextTotalDueProjected:number;
}

export interface PeriodicLoanSummary{
  originalPrincipal:number;
  openingInterestDue:number;
  totalPrincipalPaid:number;
  totalInterestGenerated:number;
  totalInterestPaid:number;
  finalPrincipalDue:number;
  finalInterestDue:number;
  finalDebt:number;
  nextInterestProjected:number;
  nextTotalDueProjected:number;
  periodsSimulated:number;
}

const xaf=(value:number,name:string)=>{
  if(!Number.isSafeInteger(value)||value<0)throw Error('INVALID_'+name);
  return value;
};

/**
 * Simulates the group practice described by the founder:
 * - rate is per meeting/month/period, never silently annualised;
 * - only principal is interest-bearing;
 * - unpaid interest remains a separate debt and never produces interest;
 * - payment allocation may prioritise principal or accrued interest;
 * - a period may have no payment or a partial payment.
 *
 * This is a simulation only. It does not create a loan, receipt or Ledger entry.
 */
export function simulatePeriodicLoan(input:PeriodicLoanInput):PeriodicLoanLine[]{
  const principal=xaf(input.principal,'LOAN_PRINCIPAL');
  if(principal<=0)throw Error('INVALID_LOAN_PRINCIPAL');
  if(!Number.isSafeInteger(input.periods)||input.periods<1||input.periods>120)throw Error('INVALID_LOAN_PERIODS');
  if(!Number.isFinite(input.ratePercentPerPeriod)||input.ratePercentPerPeriod<0||input.ratePercentPerPeriod>100)throw Error('INVALID_LOAN_RATE');
  if(!['CAPITAL_FIRST','INTEREST_FIRST','EXPLICIT_ALLOCATION'].includes(input.priority))throw Error('INVALID_LOAN_PRIORITY');
  const basis=input.interestBasis??'OUTSTANDING';if(!['OUTSTANDING','INITIAL'].includes(basis))throw Error('INVALID_LOAN_INTEREST_BASIS');
  const payments=(input.payments??[]).map((p,i)=>xaf(p,'LOAN_PAYMENT_'+(i+1)));
  const principalPayments=(input.principalPayments??[]).map((p,i)=>xaf(p,'LOAN_PRINCIPAL_PAYMENT_'+(i+1)));
  const interestPayments=(input.interestPayments??[]).map((p,i)=>xaf(p,'LOAN_INTEREST_PAYMENT_'+(i+1)));
  let capital=principal,interestDue=xaf(input.openingInterestDue??0,'OPENING_INTEREST_DUE');const rows:PeriodicLoanLine[]=[];
  for(let period=1;period<=input.periods;period++){
    const principalBefore=capital,interestOpening=interestDue;
    // No interest on interest: the taxable basis never includes interestDue.
    // Once principal is extinguished, no new interest is generated even when the
    // contract basis is INITIAL. Existing unpaid interest remains due separately
    // and never becomes an interest-bearing principal in the current model.
    const taxable=capital<=0?0:(basis==='INITIAL'?principal:capital);
    const interestNew=Math.round(taxable*input.ratePercentPerPeriod/100);
    interestDue+=interestNew;
    let payment=payments[period-1]??0,available=payment,principalPaid=0,interestPaid=0;
    if(input.priority==='EXPLICIT_ALLOCATION'){
      const plannedPrincipal=principalPayments[period-1]??0,plannedInterest=interestPayments[period-1]??0;
      payment=plannedPrincipal+plannedInterest;available=0;
      if(plannedPrincipal>capital)throw Error('LOAN_EXPLICIT_PRINCIPAL_EXCEEDS_DUE');
      if(plannedInterest>interestDue)throw Error('LOAN_EXPLICIT_INTEREST_EXCEEDS_DUE');
      principalPaid=plannedPrincipal;interestPaid=plannedInterest;capital-=principalPaid;interestDue-=interestPaid;
    }else if(input.priority==='CAPITAL_FIRST'){
      principalPaid=Math.min(capital,available);capital-=principalPaid;available-=principalPaid;
      interestPaid=Math.min(interestDue,available);interestDue-=interestPaid;available-=interestPaid;
    }else{
      interestPaid=Math.min(interestDue,available);interestDue-=interestPaid;available-=interestPaid;
      principalPaid=Math.min(capital,available);capital-=principalPaid;available-=principalPaid;
    }
    const nextTaxablePrincipal=capital,nextTaxable=basis==='INITIAL'&&capital>0?principal:capital;
    const nextInterestProjected=Math.round(nextTaxable*input.ratePercentPerPeriod/100),nextTotalDueProjected=capital+interestDue+nextInterestProjected;
    rows.push({period,principalBefore,interestOpening,interestNew,payment,principalPaid,interestPaid,unappliedPayment:available,principalAfter:capital,interestAfter:interestDue,totalDebtAfter:capital+interestDue,nextTaxablePrincipal,nextInterestProjected,nextTotalDueProjected});
  }
  return rows;
}


export function summarizePeriodicLoan(input:PeriodicLoanInput,rows:PeriodicLoanLine[]):PeriodicLoanSummary{
  const last=rows.at(-1);
  return{
    originalPrincipal:input.principal,
    openingInterestDue:input.openingInterestDue??0,
    totalPrincipalPaid:rows.reduce((n,r)=>n+r.principalPaid,0),
    totalInterestGenerated:rows.reduce((n,r)=>n+r.interestNew,0),
    totalInterestPaid:rows.reduce((n,r)=>n+r.interestPaid,0),
    finalPrincipalDue:last?.principalAfter??input.principal,
    finalInterestDue:last?.interestAfter??0,
    finalDebt:last?.totalDebtAfter??input.principal,
    nextInterestProjected:last?.nextInterestProjected??Math.round(input.principal*input.ratePercentPerPeriod/100),
    nextTotalDueProjected:last?.nextTotalDueProjected??input.principal+Math.round(input.principal*input.ratePercentPerPeriod/100),
    periodsSimulated:rows.length
  };
}
