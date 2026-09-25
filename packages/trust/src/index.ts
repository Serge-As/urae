import type { CommitmentBandId, CommitmentReliabilityProfile, Id, ReliabilityEvidence } from '../../contracts/src/index.js';

const points:Record<ReliabilityEvidence['kind'],number>={
  FULFILLED_ON_TIME:1,
  FULFILLED_LATE:0.35,
  MISSED_CONFIRMED:-1,
  RECOVERED_ARREARS:0.5,
  DISPUTE_RESOLVED:0.25,
  RULE_BREACH_CONFIRMED:-1.25
};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

/**
 * Contextual behavioural reliability. It intentionally accepts no wealth, income, appearance,
 * religion, ethnicity or prestige field and never makes an admission/exclusion decision.
 */
export class CommitmentReliabilityEngine {
  profile(subjectUserId:Id,commitmentBand:CommitmentBandId,evidence:ReliabilityEvidence[]):CommitmentReliabilityProfile{
    const sample=evidence.filter(x=>x.subjectUserId===subjectUserId&&x.commitmentBand===commitmentBand);
    if(sample.length<3) return {subjectUserId,commitmentBand,rating:'INSUFFICIENT_EVIDENCE',confidence:'LOW',sampleSize:sample.length,explanationCodes:['CONTEXT_SPECIFIC','NOT_ENOUGH_OBSERVATIONS','WEALTH_NOT_USED'],advisoryOnly:true};
    let total=0,weight=0; for(const e of sample){const w=clamp(e.weight??1,0.1,3);total+=points[e.kind]*w;weight+=w;}
    const avg=total/weight; const score=Math.round(clamp(((avg+1.25)/2.25)*100,0,100));
    const rating:CommitmentReliabilityProfile['rating']=score>=80?'CONSISTENT':score>=65?'MOSTLY_CONSISTENT':score>=45?'MIXED':'CONCERNING';
    const confidence:CommitmentReliabilityProfile['confidence']=sample.length>=12?'HIGH':sample.length>=5?'MEDIUM':'LOW';
    const explanationCodes=['CONTEXT_SPECIFIC','BEHAVIOUR_ONLY','WEALTH_NOT_USED'];
    if(sample.some(x=>x.kind==='FULFILLED_ON_TIME')) explanationCodes.push('ON_TIME_HISTORY');
    if(sample.some(x=>x.kind==='RECOVERED_ARREARS')) explanationCodes.push('ARREARS_RECOVERED');
    if(sample.some(x=>x.kind==='MISSED_CONFIRMED')) explanationCodes.push('CONFIRMED_MISSES_PRESENT');
    return {subjectUserId,commitmentBand,score,rating,confidence,sampleSize:sample.length,explanationCodes,advisoryOnly:true};
  }
}
