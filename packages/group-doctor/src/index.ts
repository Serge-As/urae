export type DoctorSeverity='INFO'|'NOTICE'|'WARNING'|'BLOCKER';
export interface GroupDoctorFinding{code:string;severity:DoctorSeverity;titleFr:string;detailFr:string;actionFr:string;}
export interface GroupDoctorInput{
  realizedInterestPool?:number;
  officeShareBasisPoints?:number;
  poolingMode?:'SEGREGATED'|'POOLED'|'CUSTOM_MATRIX';
  fixedFundSharesBasisPoints?:{CLASSIC?:number;SCHOOL?:number};
  classicPrincipal?:number;
  schoolPrincipal?:number;
  evidencedInterest?:number;
  residualInterest?:number;
  schoolLoanEvidence?:boolean;
  earlyDepositPriority?:boolean;
  coefficients?:number[];
  memberFundNegativePositions?:number;
  unreconciledCashDifference?:number;
  pendingPayoutEvidence?:number;
}
const n=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:0;
export function diagnoseGroup(input:GroupDoctorInput){
  const findings:GroupDoctorFinding[]=[];
  const pool=n(input.realizedInterestPool),residual=input.residualInterest===undefined?Math.max(0,pool-n(input.evidencedInterest)):n(input.residualInterest);
  if(pool>0&&residual/pool>=.1)findings.push({code:'YIELD_RESIDUAL_HIGH',severity:'WARNING',titleFr:'Une part importante des intérêts n’est pas rattachée à un prêt',detailFr:`${Math.round(residual).toLocaleString('fr-FR')} F sur ${Math.round(pool).toLocaleString('fr-FR')} F restent sans causalité prêt → intérêt suffisamment documentée.`,actionFr:'Conserver ce résidu visible et choisir explicitement une règle de secours : montant × temps, clé fixe ou décision manuelle.'});
  if((input.schoolPrincipal??0)>0&&input.poolingMode!=='POOLED'&&!input.schoolLoanEvidence)findings.push({code:'SCHOOL_YIELD_SOURCE_UNPROVEN',severity:'NOTICE',titleFr:'Épargne scolaire avec intérêts mais source de prêts non prouvée',detailFr:'La caisse scolaire possède du principal mais aucun prêt scolaire/source scolaire n’est explicitement identifié.',actionFr:'Demander au Bureau si Épargne scolaire et Épargne classique sont mutualisées pour les prêts, séparées, ou mélangées selon une matrice personnalisée.'});
  if(input.poolingMode==='POOLED'&&input.fixedFundSharesBasisPoints){
    findings.push({code:'POOLED_WITH_FIXED_SPLIT',severity:'NOTICE',titleFr:'Caisse mutualisée et clé fixe coexistent',detailFr:'Le Bureau peut conserver une clé 70/10/20 même lorsque les fonds sont mélangés, mais cette clé n’est pas nécessairement la part réellement productive de chaque caisse.',actionFr:'Afficher côte à côte la clé politique et la contribution productive observée avant validation.'});
  }
  if(input.earlyDepositPriority&&input.coefficients?.length){
    const positive=input.coefficients.filter(x=>Number.isFinite(x)&&x>0);let monotone=true;for(let i=1;i<positive.length;i++)if(positive[i]>positive[i-1])monotone=false;
    if(!monotone)findings.push({code:'EARLY_PRIORITY_COEFFICIENT_REVERSAL',severity:'WARNING',titleFr:'Les coefficients ne favorisent pas toujours les dépôts précoces',detailFr:'Au moins un coefficient tardif dépasse un coefficient antérieur alors que le groupe déclare vouloir privilégier la précocité.',actionFr:'Corriger la courbe ou utiliser le moteur Capital × Temps qui garantit la monotonie.'});
  }
  if(n(input.memberFundNegativePositions)>0)findings.push({code:'NEGATIVE_MEMBER_FUND_POSITION',severity:'WARNING',titleFr:'Position individuelle de fonds négative',detailFr:`${Math.trunc(n(input.memberFundNegativePositions))} position(s) individuelle(s) deviennent négatives.`,actionFr:'Vérifier retenues, reports et corrections ; une retenue ne doit pas effacer silencieusement la contribution historique du membre.'});
  if(n(input.unreconciledCashDifference)!==0)findings.push({code:'UNRECONCILED_CASH',severity:'BLOCKER',titleFr:'Écart de caisse non rapproché',detailFr:`Écart déclaré : ${Math.round(n(input.unreconciledCashDifference)).toLocaleString('fr-FR')} F.`,actionFr:'Rapprocher, justifier et faire valider l’écart avant verrouillage de la clôture si la politique du groupe l’exige.'});
  if(n(input.pendingPayoutEvidence)>0)findings.push({code:'PAYOUT_EVIDENCE_PENDING',severity:'WARNING',titleFr:'Preuves de sortie en attente',detailFr:`${Math.trunc(n(input.pendingPayoutEvidence))} décaissement(s) attendent encore une preuve/confirmation.`,actionFr:'Collecter signature, reçu, OTP ou double validation selon la politique de preuve.'});
  if(!findings.length)findings.push({code:'NO_RULE_CONTRADICTION_DETECTED',severity:'INFO',titleFr:'Aucune incohérence déterministe détectée',detailFr:'Les contrôles disponibles ne révèlent pas de contradiction sur les données fournies.',actionFr:'Continuer la revue humaine : ce diagnostic n’est pas une certification comptable ou juridique.'});
  return{generatedAt:new Date().toISOString(),findings,automaticMutation:false,scope:'ADVISORY_ONLY' as const};
}
