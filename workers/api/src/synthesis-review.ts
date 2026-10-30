/** Shared by the direct and durable-outbox paths. No financial values are written. */
export async function validateSynthesis({snapshot,meetingId,membershipId,values}:{snapshot:{cells:any[]};meetingId:string;membershipId:string;values:any[]}){
  if(!membershipId||!Array.isArray(values)||values.length>100)throw Error('INVALID_SYNTHESIS_REVIEW');
  const seen=new Set<string>();
  return values.map(value=>{
    if(!value||typeof value.rubricId!=='string'||!value.rubricId||seen.has(value.rubricId)||!Number.isSafeInteger(value.amount)||value.amount<0||!Number.isSafeInteger(value.cellVersion)||value.cellVersion<0)throw Error('INVALID_SYNTHESIS_REVIEW');
    seen.add(value.rubricId);
    const cell=snapshot.cells.find(x=>x.meetingId===meetingId&&x.membershipId===membershipId&&x.rubricId===value.rubricId);
    if(Math.abs(cell?.amount??0)!==value.amount||Number(cell?.cellVersion??0)!==value.cellVersion)throw Error('SYNTHESIS_CHANGED_REVIEW_REQUIRED');
    return{...value,actorId:cell?.actorId??'',reviewDecision:cell?.reviewDecision};
  });
}
