import {allocateSavingsYield,type SavingsYieldInput} from './index.js';

/** A portable calculation copy. A content hash never certifies deposits or cash payment. */
export const canonicalFinanceJson=(value:unknown):string=>{
  if(Array.isArray(value))return '['+value.map(canonicalFinanceJson).join(',')+']';
  if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalFinanceJson((value as Record<string,unknown>)[k])).join(',')+'}';
  if(typeof value==='number'&&!Number.isFinite(value))throw Error('INVALID_FINANCE_NUMBER');
  return JSON.stringify(value)??'null';
};
export async function financeDigest(value:unknown):Promise<string>{
  const bytes=new TextEncoder().encode(canonicalFinanceJson(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function buildSavingsCalculationCopy(input:SavingsYieldInput){
  if(!input||!Array.isArray(input.deposits)||input.deposits.length>1000||!input.coefficients||Object.keys(input.coefficients).length>120)throw Error('INVALID_YIELD_COPY_INPUT');
  const normalized:SavingsYieldInput={interestPool:input.interestPool,mode:input.mode??'EXACT_WEIGHTED_DEPOSITS',amountPower:input.mode==='HYBRID_TIME_AMOUNT'?(input.amountPower??0.75):1,
    coefficients:Object.fromEntries(Object.entries(input.coefficients).sort(([a],[b])=>a.localeCompare(b))),
    deposits:input.deposits.map(d=>({id:String(d.id??''),memberId:String(d.memberId??''),amount:d.amount,periodKey:String(d.periodKey??''),...(d.fund?{fund:d.fund}:{})})).sort((a,b)=>a.id.localeCompare(b.id))};
  const result=allocateSavingsYield(normalized);
  if(!Number.isSafeInteger(result.totalPrincipal)||result.members.some(x=>!Number.isSafeInteger(x.principal))||result.distributedInterest+result.undistributedInterest!==normalized.interestPool)throw Error('INVALID_YIELD_COPY_TOTAL');
  const payload={format:'ECO_SAVINGS_CALCULATION_COPY_V1',engine:'SavingsYield.allocateSavingsYield/v1',rounding:'LARGEST_REMAINDER',provenance:'DECLARED_SIMULATION',currency:'XAF',posting:false,input:normalized,result};
  return {...payload,contentSha256:await financeDigest(payload)};
}
export async function verifySavingsCalculationCopy(value:unknown){
  const supplied=value as any;if(!supplied||supplied.format!=='ECO_SAVINGS_CALCULATION_COPY_V1')throw Error('INVALID_YIELD_COPY_FORMAT');
  const expected=await buildSavingsCalculationCopy(supplied.input);
  if(canonicalFinanceJson(expected)!==canonicalFinanceJson(supplied))throw Error('YIELD_COPY_MISMATCH');
  return {valid:true,meaning:'CALCULATION_AND_CONTENT_MATCH_NOT_PAYMENT_CERTIFICATION',contentSha256:expected.contentSha256,distributedInterest:expected.result.distributedInterest};
}
