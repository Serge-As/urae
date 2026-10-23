/** Versioned educational review, owned by SafetyCaseService; no fraud verdict or financial command. */
export const LAB_REVIEW_VERSION = 'ECO_LAB_REVIEW_1';
export const LAB_QUESTIONS = [
  {id:'IDENTITY',fr:'L’identité et les coordonnées ont-elles une source contrôlable ?',en:'Do identity and contact details have a checkable source?',risk:'NO'},
  {id:'ECONOMY',fr:'Les revenus de l’activité sont-ils étayés par des pièces accessibles ?',en:'Is operating income supported by accessible documents?',risk:'NO'},
  {id:'RECRUITMENT',fr:'Le revenu promis dépend-il surtout du recrutement de nouveaux entrants ?',en:'Does the promised return depend mostly on recruiting new entrants?',risk:'YES'},
  {id:'WITHDRAWAL',fr:'Des retraits exigibles restent-ils bloqués sans explication documentée ?',en:'Are due withdrawals blocked without a documented explanation?',risk:'YES'},
  {id:'FEES',fr:'Les frais et les conditions de sortie sont-ils clairement écrits ?',en:'Are fees and exit conditions clearly documented?',risk:'NO'},
  {id:'PRESSURE',fr:'Une pression empêche-t-elle de prendre le temps de vérifier ?',en:'Does pressure prevent taking time to check?',risk:'YES'}
] as const;
export type LabAnswer = {id:string;answer:'YES'|'NO'|'UNKNOWN';source?:string;observedAt?:string};
export interface LabFlow {initialFunds:number;periodRevenue:number;newDeposits:number;requestedPayout:number;months:number;}
const integer=(v:unknown,name:string,max=1_000_000_000_000)=>{if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0||v>max)throw Error('INVALID_LAB_'+name);return v;};
export function simulateLabFlow(input:LabFlow){
  if(!input||typeof input!=='object')throw Error('INVALID_LAB_FLOW');
  const initialFunds=integer(input.initialFunds,'INITIAL_FUNDS'),periodRevenue=integer(input.periodRevenue,'REVENUE'),newDeposits=integer(input.newDeposits,'NEW_DEPOSITS'),requestedPayout=integer(input.requestedPayout,'PAYOUT'),months=integer(input.months,'MONTHS',120);if(!months)throw Error('INVALID_LAB_MONTHS');
  let cash=initialFunds,arrears=0,totalPaid=0;const rows=[];
  for(let period=1;period<=months;period++){
    const openingCash=cash,available=openingCash+periodRevenue+newDeposits,due=arrears+requestedPayout,paid=Math.min(available,due);cash=available-paid;arrears=due-paid;totalPaid+=paid;
    for(const value of [available,due,cash,arrears,totalPaid])if(!Number.isSafeInteger(value))throw Error('LAB_FLOW_OVERFLOW');
    rows.push({period,openingCash,declaredOperatingRevenue:periodRevenue,newDeposits,payoutRequested:requestedPayout,amountDue:due,paid,closingCash:cash,unpaid:arrears});
  }
  return{protocol:LAB_REVIEW_VERSION,assumptions:{initialFunds,periodRevenue,newDeposits,requestedPayout,months},rows,endingCash:cash,unpaid:arrears,totalPaid,newDepositObligationsUnspecified:newDeposits*months,
    limitations:['DECLARED_ASSUMPTIONS_NOT_DOCUMENT_VERIFICATION','NEW_DEPOSITS_ARE_NOT_OPERATING_INCOME','NEW_ENTRANTS_FUTURE_CLAIMS_NOT_MODELED','FEES_TAXES_TIMING_AND_LOSSES_ONLY_IF_INCLUDED_IN_INPUTS'],legalVerdict:false,solvencyCertified:false,financialWrites:false};
}
export function reviewLabAnswers(answers:LabAnswer[]){
  if(!Array.isArray(answers)||answers.length!==LAB_QUESTIONS.length)throw Error('LAB_QUESTIONNAIRE_INCOMPLETE');const ids=new Set<string>();
  const responses=LAB_QUESTIONS.map(q=>{const a=answers.find(x=>x&&typeof x==='object'&&x.id===q.id);if(!a||ids.has(a.id)||!['YES','NO','UNKNOWN'].includes(a.answer))throw Error('INVALID_LAB_ANSWER');ids.add(a.id);if(a.observedAt&&!Number.isFinite(Date.parse(a.observedAt)))throw Error('INVALID_LAB_SOURCE_DATE');return{id:q.id,answer:a.answer,source:String(a.source??'').trim().slice(0,1000),observedAt:a.observedAt??'',state:a.answer==='UNKNOWN'?'UNKNOWN':a.answer===q.risk?'QUESTION_REQUIRING_REVIEW':'DECLARED_RESPONSE_NOT_VERIFIED'};});
  return{protocol:LAB_REVIEW_VERSION,responses,unknown:responses.filter(x=>x.answer==='UNKNOWN').map(x=>x.id),questionsToClarify:responses.filter(x=>x.state==='QUESTION_REQUIRING_REVIEW'||x.answer==='UNKNOWN').map(x=>x.id),legalVerdict:false,fraudEstablished:false,publicAccusation:false,financialScoreEffect:false};
}
