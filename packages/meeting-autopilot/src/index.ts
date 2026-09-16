export interface MeetingAutopilotInput{
  meetingLabel:string;
  expectedRubrics:string[];
  plannedBeneficiaries?:Array<{rubric:string;beneficiary:string}>;
  advanceContributions?:number;
  pendingEvidenceCount?:number;
  unresolvedVariance?:number;
  lastClosingBalance?:number;
  offline?:boolean;
}
export function prepareMeetingAutopilot(input:MeetingAutopilotInput){
  if(!input.meetingLabel?.trim())throw new Error('MEETING_LABEL_REQUIRED');
  const warnings:string[]=[];const blockers:string[]=[];
  if((input.pendingEvidenceCount??0)>0)warnings.push('PAYOUT_EVIDENCE_PENDING');
  if((input.unresolvedVariance??0)!==0)blockers.push('PREVIOUS_VARIANCE_UNRESOLVED');
  if(!input.expectedRubrics?.length)warnings.push('NO_EXPECTED_RUBRIC');
  const checklist=[
    {key:'OPENING_BALANCE',labelFr:'Confirmer le solde d’ouverture',status:input.lastClosingBalance===undefined?'REVIEW':'READY'},
    {key:'ADVANCE_CONTRIBUTIONS',labelFr:'Revoir les cotisations reçues en avance',status:(input.advanceContributions??0)>0?'REVIEW':'READY'},
    {key:'RUBRICS',labelFr:'Charger uniquement les rubriques actives de la séance',status:input.expectedRubrics?.length?'READY':'REVIEW'},
    {key:'BENEFICIARIES',labelFr:'Confirmer les bénéficiaires planifiés sans inventer les événements imprévus',status:(input.plannedBeneficiaries??[]).length?'REVIEW':'READY'},
    {key:'EVIDENCE',labelFr:'Vérifier les preuves de décaissement encore attendues',status:(input.pendingEvidenceCount??0)>0?'REVIEW':'READY'},
    {key:'SYNC',labelFr:'Préparer la reprise réseau et les clés d’idempotence',status:input.offline?'OFFLINE_READY':'READY'}
  ];
  return{meetingLabel:input.meetingLabel.trim(),checklist,warnings,blockers,canOpen:blockers.length===0,automaticFinancialPosting:false,requiresHumanConfirmation:true};
}
