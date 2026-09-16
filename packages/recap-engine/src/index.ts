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


export type MemberFundMovementKind='OPENING_RETENTION'|'CONTRIBUTION'|'REFUND_TO_MEMBER'|'FORFEITURE'|'ADJUSTMENT_IN'|'ADJUSTMENT_OUT';
export interface MemberFundMovement{
  id:string;
  membershipId:string;
  kind:MemberFundMovementKind;
  amount:number;
  at?:string;
  sourceId?:string;
  note?:string;
}
export interface MemberFundPosition{
  membershipId:string;
  openingRetention:number;
  contributions:number;
  refunds:number;
  forfeitures:number;
  adjustmentsIn:number;
  adjustmentsOut:number;
  closingRetention:number;
  movementCount:number;
}
export interface MemberFundBreakdown{
  fundCode:string;
  openingTotal:number;
  contributionsTotal:number;
  reductionsTotal:number;
  closingTotal:number;
  members:MemberFundPosition[];
  movements:MemberFundMovement[];
}

export function buildMemberFundBreakdown(input:{fundCode:string;movements:MemberFundMovement[]}):MemberFundBreakdown{
  if(!input.fundCode.trim())throw new Error('FUND_CODE_REQUIRED');
  const seen=new Set<string>(),rows=new Map<string,MemberFundPosition>();
  const movements=input.movements.map(m=>{
    if(!m.id||seen.has(m.id))throw new Error('INVALID_FUND_MOVEMENT_ID');seen.add(m.id);
    if(!m.membershipId)throw new Error('FUND_MOVEMENT_MEMBER_REQUIRED');
    const v=amount('fund_movement_amount',m.amount);
    const row=rows.get(m.membershipId)??{membershipId:m.membershipId,openingRetention:0,contributions:0,refunds:0,forfeitures:0,adjustmentsIn:0,adjustmentsOut:0,closingRetention:0,movementCount:0};
    if(m.kind==='OPENING_RETENTION')row.openingRetention+=v;
    else if(m.kind==='CONTRIBUTION')row.contributions+=v;
    else if(m.kind==='REFUND_TO_MEMBER')row.refunds+=v;
    else if(m.kind==='FORFEITURE')row.forfeitures+=v;
    else if(m.kind==='ADJUSTMENT_IN')row.adjustmentsIn+=v;
    else if(m.kind==='ADJUSTMENT_OUT')row.adjustmentsOut+=v;
    else throw new Error('INVALID_FUND_MOVEMENT_KIND');
    row.movementCount++;
    row.closingRetention=row.openingRetention+row.contributions+row.adjustmentsIn-row.refunds-row.forfeitures-row.adjustmentsOut;
    if(row.closingRetention<0)throw new Error('NEGATIVE_MEMBER_FUND_RETENTION:'+m.membershipId);
    rows.set(m.membershipId,row);return{...m,amount:v};
  });
  const members=[...rows.values()].sort((a,b)=>a.membershipId.localeCompare(b.membershipId));
  const openingTotal=members.reduce((n,x)=>n+x.openingRetention,0),contributionsTotal=members.reduce((n,x)=>n+x.contributions+x.adjustmentsIn,0),reductionsTotal=members.reduce((n,x)=>n+x.refunds+x.forfeitures+x.adjustmentsOut,0),closingTotal=members.reduce((n,x)=>n+x.closingRetention,0);
  return{fundCode:input.fundCode,openingTotal,contributionsTotal,reductionsTotal,closingTotal,members,movements};
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
