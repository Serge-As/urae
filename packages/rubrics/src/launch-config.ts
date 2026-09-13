import type {LaunchRubricPlan, RubricFeasibility} from '../../contracts/src/index.js';

const positive=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>0;
const nonNegative=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
const positiveNumber=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>0;
export function validateLaunchRubrics(input:unknown):LaunchRubricPlan[]{
  if(!Array.isArray(input)||input.length<1||input.length>100)throw Error('PROJECT_RUBRICS_REQUIRED');
  const keys=new Set<string>();
  return input.map(raw=>{
    if(!raw||typeof raw!=='object')throw Error('INVALID_RUBRIC_CONFIGURATION');
    const p=raw as LaunchRubricPlan;
    if(typeof p.key!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(p.key)||keys.has(p.key))throw Error('INVALID_RUBRIC_KEY');keys.add(p.key);
    if(typeof p.name!=='string'||!p.name.trim()||p.name.trim().length>120)throw Error('RUBRIC_NAME_REQUIRED');
    if(!['CONTRIBUTION','TONTINE','SAVINGS','SOLIDARITY','OTHER'].includes(p.kind))throw Error('INVALID_RUBRIC_ACTIVITY');
    if(!p.nominalAmount||!nonNegative(p.nominalAmount.amount)||typeof p.nominalAmount.currency!=='string'||!/^[A-Z]{3}$/.test(p.nominalAmount.currency))throw Error('INVALID_RUBRIC_MONEY');
    const participationMode=p.participationMode??(p.kind==='TONTINE'?'OPTIONAL':'RULE_BASED');
    if(!['OPTIONAL','MANDATORY','RULE_BASED'].includes(participationMode))throw Error('INVALID_RUBRIC_PARTICIPATION');
    const contributionMode=p.contributionMode??'MONEY';
    if(!['MONEY','IN_KIND','MIXED'].includes(contributionMode))throw Error('INVALID_RUBRIC_CONTRIBUTION_MODE');
    const contributionLabel=typeof p.contributionLabel==='string'?p.contributionLabel.trim():'';
    const contributionUnit=typeof p.contributionUnit==='string'?p.contributionUnit.trim():'';
    const contextNote=typeof p.contextNote==='string'?p.contextNote.trim():'';
    const contributionQuantity=p.contributionQuantity??1;
    if(contributionMode!=='MONEY'&&(!contributionLabel||contributionLabel.length>120||!positiveNumber(contributionQuantity)))throw Error('INVALID_RUBRIC_IN_KIND');
    if(contributionUnit.length>60||contextNote.length>1000)throw Error('INVALID_RUBRIC_CONTEXT');
    if(!['PER_MEMBER','PER_SHARE'].includes(p.amountBasis)||p.kind==='TONTINE'&&p.amountBasis!=='PER_SHARE')throw Error('INVALID_RUBRIC_AMOUNT_BASIS');
    if(!positive(p.memberCount)||!positive(p.sessions)||!p.duration||!positive(p.duration.value)||!['DAYS','WEEKS','MONTHS','YEARS','SESSIONS'].includes(p.duration.unit))throw Error('INVALID_RUBRIC_COUNTS');
    if(p.amountBasis==='PER_SHARE'&&(!positive(p.shareCount)||p.shareCount!<p.memberCount))throw Error('INVALID_RUBRIC_SHARES');
    if(p.kind==='TONTINE'&&(!positive(p.potCount)||p.potCount!>p.shareCount!))throw Error('INVALID_RUBRIC_POTS');
    if(p.kind==='TONTINE'&&p.potCount!*p.sessions<p.shareCount!)throw Error('TONTINE_INSUFFICIENT_TURNS');
    if(p.participants!==undefined&&(!Array.isArray(p.participants)||p.kind!=='TONTINE'||p.participants.length>p.memberCount))throw Error('INVALID_TONTINE_PARTICIPANTS');
    const participantKeys=new Set<string>(),shareKeys=new Set<string>(),turns=new Map<number,number>();
    const participants=p.participants?.map(member=>{
      if(!member||typeof member.key!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(member.key)||participantKeys.has(member.key)||typeof member.name!=='string'||!member.name.trim()||member.name.length>120||!Array.isArray(member.shares)||!member.shares.length)throw Error('INVALID_TONTINE_PARTICIPANTS');
      participantKeys.add(member.key);
      const shares=member.shares.map(share=>{
        if(!share||typeof share.key!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(share.key)||shareKeys.has(share.key)||typeof share.name!=='string'||!share.name.trim()||share.name.length>120)throw Error('INVALID_TONTINE_SHARE');
        shareKeys.add(share.key);
        if(share.turn!==undefined){
          if(!positive(share.turn)||share.turn>p.sessions)throw Error('INVALID_TONTINE_TURN');
          const count=(turns.get(share.turn)??0)+1;turns.set(share.turn,count);
          if(count>p.potCount!)throw Error('TONTINE_TURN_CAPACITY_EXCEEDED');
        }
        return{key:share.key,name:share.name.trim(),turn:share.turn};
      });
      return{key:member.key,name:member.name.trim(),shares};
    });
    if(shareKeys.size>(p.shareCount??0))throw Error('TONTINE_SHARE_COUNT_EXCEEDED');
    if(participants&&p.shareCount!-shareKeys.size<p.memberCount-participants.length)throw Error('TONTINE_PARTICIPANT_SHARES_MISMATCH');
    if(!nonNegative(p.managementFeePerPayment)||!nonNegative(p.fixedCostPerSession)||!Number.isFinite(p.estimatedExternalCostRate)||p.estimatedExternalCostRate<0||p.estimatedExternalCostRate>1)throw Error('INVALID_RUBRIC_COSTS');
    return{key:p.key,name:p.name.trim(),kind:p.kind,nominalAmount:{...p.nominalAmount},amountBasis:p.amountBasis,participationMode,contributionMode,contributionLabel:contributionMode==='MONEY'?undefined:contributionLabel,contributionUnit:contributionMode==='MONEY'?undefined:(contributionUnit||'unité'),contributionQuantity:contributionMode==='MONEY'?undefined:Number(contributionQuantity),contextNote:contextNote||undefined,memberCount:p.memberCount,shareCount:p.amountBasis==='PER_SHARE'?p.shareCount:undefined,potCount:p.kind==='TONTINE'?p.potCount:undefined,participants,sessions:p.sessions,duration:{value:p.duration.value,unit:p.duration.unit},managementFeePerPayment:p.managementFeePerPayment,estimatedExternalCostRate:p.estimatedExternalCostRate,fixedCostPerSession:p.fixedCostPerSession};
  });
}

export function simulateRubricPlan(plan:LaunchRubricPlan):RubricFeasibility{
  const units=plan.amountBasis==='PER_SHARE'?plan.shareCount!:plan.memberCount;
  const events=units*plan.sessions,total=events*plan.nominalAmount.amount,fees=events*plan.managementFeePerPayment;
  const external=Math.round(total*plan.estimatedExternalCostRate),fixed=plan.sessions*plan.fixedCostPerSession;
  if(![events,total,fees,external,fixed,fees-external-fixed].every(Number.isSafeInteger))throw Error('SIMULATION_AMOUNT_OUT_OF_RANGE');
  return{key:plan.key,name:plan.name,kind:plan.kind,currency:plan.nominalAmount.currency,unitsPerSession:units,sessions:plan.sessions,totalNominalContributions:total,totalManagementFees:fees,estimatedExternalCosts:external,fixedOperatingCosts:fixed,estimatedManagerMargin:fees-external-fixed};
}
