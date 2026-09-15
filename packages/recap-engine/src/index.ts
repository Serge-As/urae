export type RecapPolarity='POSITIVE'|'NEGATIVE';

export interface FinancialRecapColumn {
  id:string;
  label:string;
  polarity:RecapPolarity;
  sourceRubricId?:string;
  manualOnly?:boolean;
}
export interface FinancialRecapCellInput {
  membershipId:string;
  columnId:string;
  automaticAmount?:number;
  manualOverride?:number;
  adjustmentReason?:string;
}
export interface FinancialRecapMember {
  membershipId:string;
  displayName:string;
}
export interface FinancialRecapCell {
  columnId:string;
  polarity:RecapPolarity;
  automaticAmount:number;
  finalAmount:number;
  sourceMode:'AUTOMATIC'|'MANUAL_OVERRIDE'|'MANUAL_ONLY';
  adjustmentReason?:string;
}
export interface FinancialRecapRow {
  membershipId:string;
  displayName:string;
  cells:FinancialRecapCell[];
  positiveTotal:number;
  negativeTotal:number;
  total:number;
}
export interface FinancialRecapResult {
  columns:FinancialRecapColumn[];
  rows:FinancialRecapRow[];
  positiveTotal:number;
  negativeTotal:number;
  grandTotal:number;
}

export interface SessionRubricFlow {
  rubricId:string;
  label:string;
  inflow:number;
  outflow:number;
  expectedInflow?:number;
  releaseAtClose?:boolean;
}
export interface SessionRecapInput {
  openingCash:number;
  countedClosing:number;
  rubrics:SessionRubricFlow[];
}
export interface SessionRubricResult extends SessionRubricFlow {
  shortfall:number;
  net:number;
  releasableAmount:number;
}
export interface SessionRecapResult {
  openingCash:number;
  totalInflow:number;
  totalOutflow:number;
  theoreticalClosing:number;
  countedClosing:number;
  variance:number;
  rubrics:SessionRubricResult[];
}

export interface ClosingMemberReserve {
  membershipId:string;
  amount:number;
}
export interface ClosingFund {
  fundCode:string;
  label:string;
  carryForward:boolean;
  memberReserves?:ClosingMemberReserve[];
  unassignedAmount?:number;
}
export interface ClosingCarryoverInput {
  closingCash:number;
  funds:ClosingFund[];
}
export interface ClosingCarryoverResult {
  closingCash:number;
  carriedFundsTotal:number;
  unallocatedCash:number;
  nextExerciseOpeningCash:number;
  funds:Array<ClosingFund & {memberReserveTotal:number;fundTotal:number}>;
}

const amount=(name:string,value:number)=>{
  if(!Number.isSafeInteger(value)||value<0)throw new Error('INVALID_'+name.toUpperCase());
  return value;
};

export function buildFinancialRecap(input:{columns:FinancialRecapColumn[];members:FinancialRecapMember[];cells:FinancialRecapCellInput[]}):FinancialRecapResult{
  const ids=new Set<string>();for(const c of input.columns){if(!c.id||ids.has(c.id))throw new Error('INVALID_RECAP_COLUMN');ids.add(c.id);if(!['POSITIVE','NEGATIVE'].includes(c.polarity))throw new Error('INVALID_RECAP_POLARITY');}
  const cellMap=new Map(input.cells.map(x=>[x.membershipId+'\u0000'+x.columnId,x]));
  const rows:FinancialRecapRow[]=input.members.map(member=>{
    const cells=input.columns.map(column=>{
      const raw=cellMap.get(member.membershipId+'\u0000'+column.id),automaticAmount=amount('automatic_amount',raw?.automaticAmount??0);
      const hasOverride=raw?.manualOverride!==undefined,finalAmount=hasOverride?amount('manual_override',raw!.manualOverride!):automaticAmount;
      if(column.manualOnly&&!hasOverride&&automaticAmount!==0)throw new Error('MANUAL_ONLY_COLUMN_HAS_AUTOMATIC_VALUE');
      return{columnId:column.id,polarity:column.polarity,automaticAmount,finalAmount,sourceMode:column.manualOnly?'MANUAL_ONLY':hasOverride?'MANUAL_OVERRIDE':'AUTOMATIC',adjustmentReason:raw?.adjustmentReason} as FinancialRecapCell;
    });
    const positiveTotal=cells.filter(x=>x.polarity==='POSITIVE').reduce((n,x)=>n+x.finalAmount,0);
    const negativeTotal=cells.filter(x=>x.polarity==='NEGATIVE').reduce((n,x)=>n+x.finalAmount,0);
    return{membershipId:member.membershipId,displayName:member.displayName,cells,positiveTotal,negativeTotal,total:positiveTotal-negativeTotal};
  });
  return{columns:input.columns,rows,positiveTotal:rows.reduce((n,x)=>n+x.positiveTotal,0),negativeTotal:rows.reduce((n,x)=>n+x.negativeTotal,0),grandTotal:rows.reduce((n,x)=>n+x.total,0)};
}

export function buildSessionRecap(input:SessionRecapInput):SessionRecapResult{
  const openingCash=amount('opening_cash',input.openingCash),countedClosing=amount('counted_closing',input.countedClosing);
  const rubrics=input.rubrics.map(r=>{
    const inflow=amount('rubric_inflow',r.inflow),outflow=amount('rubric_outflow',r.outflow),expected=r.expectedInflow===undefined?inflow:amount('expected_inflow',r.expectedInflow);
    const shortfall=Math.max(0,expected-inflow),net=inflow-outflow;
    return{...r,inflow,outflow,expectedInflow:expected,shortfall,net,releasableAmount:r.releaseAtClose?Math.max(0,inflow-outflow):0};
  });
  const totalInflow=rubrics.reduce((n,x)=>n+x.inflow,0),totalOutflow=rubrics.reduce((n,x)=>n+x.outflow,0);
  const theoreticalClosing=openingCash+totalInflow-totalOutflow;
  return{openingCash,totalInflow,totalOutflow,theoreticalClosing,countedClosing,variance:countedClosing-theoreticalClosing,rubrics};
}

export function buildClosingCarryover(input:ClosingCarryoverInput):ClosingCarryoverResult{
  const closingCash=amount('closing_cash',input.closingCash);
  const funds=input.funds.map(f=>{
    const members=f.memberReserves??[],seen=new Set<string>();
    for(const m of members){if(!m.membershipId||seen.has(m.membershipId))throw new Error('INVALID_MEMBER_RESERVE');seen.add(m.membershipId);amount('member_reserve',m.amount);}
    const memberReserveTotal=members.reduce((n,m)=>n+m.amount,0),unassignedAmount=amount('unassigned_fund',f.unassignedAmount??0);
    return{...f,unassignedAmount,memberReserveTotal,fundTotal:memberReserveTotal+unassignedAmount};
  });
  const carriedFundsTotal=funds.filter(x=>x.carryForward).reduce((n,x)=>n+x.fundTotal,0);
  if(carriedFundsTotal>closingCash)throw new Error('CARRYOVER_FUNDS_EXCEED_CLOSING_CASH');
  return{closingCash,carriedFundsTotal,unallocatedCash:closingCash-carriedFundsTotal,nextExerciseOpeningCash:closingCash,funds};
}
