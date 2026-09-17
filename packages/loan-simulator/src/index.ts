export type LoanPaymentPriority='CAPITAL_FIRST'|'INTEREST_FIRST';
export type LoanInterestBasis='OUTSTANDING'|'INITIAL';

export interface PeriodicLoanInput{
  principal:number;
  periods:number;
  ratePercentPerPeriod:number;
  priority:LoanPaymentPriority;
  interestBasis?:LoanInterestBasis;
  payments?:number[];
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
  if(!['CAPITAL_FIRST','INTEREST_FIRST'].includes(input.priority))throw Error('INVALID_LOAN_PRIORITY');
  const basis=input.interestBasis??'OUTSTANDING';if(!['OUTSTANDING','INITIAL'].includes(basis))throw Error('INVALID_LOAN_INTEREST_BASIS');
  const payments=(input.payments??[]).map((p,i)=>xaf(p,'LOAN_PAYMENT_'+(i+1)));
  let capital=principal,interestDue=0;const rows:PeriodicLoanLine[]=[];
  for(let period=1;period<=input.periods;period++){
    const principalBefore=capital,interestOpening=interestDue;
    // No interest on interest: the taxable basis never includes interestDue.
    const taxable=basis==='INITIAL'?principal:capital;
    const interestNew=Math.round(taxable*input.ratePercentPerPeriod/100);
    interestDue+=interestNew;
    const payment=payments[period-1]??0;let available=payment,principalPaid=0,interestPaid=0;
    if(input.priority==='CAPITAL_FIRST'){
      principalPaid=Math.min(capital,available);capital-=principalPaid;available-=principalPaid;
      interestPaid=Math.min(interestDue,available);interestDue-=interestPaid;available-=interestPaid;
    }else{
      interestPaid=Math.min(interestDue,available);interestDue-=interestPaid;available-=interestPaid;
      principalPaid=Math.min(capital,available);capital-=principalPaid;available-=principalPaid;
    }
    rows.push({period,principalBefore,interestOpening,interestNew,payment,principalPaid,interestPaid,unappliedPayment:available,principalAfter:capital,interestAfter:interestDue,totalDebtAfter:capital+interestDue,nextTaxablePrincipal:capital});
  }
  return rows;
}
