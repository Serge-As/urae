import type {RubricActivityKind, GroupProjectLaunchProfile, RubricPolicies} from '../../contracts/src/index.js';

export interface GuidedSuggestion {
  id:string;
  category:'RUBRIC'|'LOAN_RULE'|'MEETING_RULE'|'MEMBERSHIP_RULE'|'GOVERNANCE_RULE'|'CONTRADICTION';
  title:string;
  confidence:number;
  evidence:string;
  explanation:string;
  rubric?:{
    name:string;
    kind:RubricActivityKind;
    participationMode:'OPTIONAL'|'MANDATORY'|'RULE_BASED';
    contributionMode:'MONEY'|'IN_KIND'|'MIXED';
    nominalAmount?:number;
    contributionLabel?:string;
    contributionUnit?:string;
    contributionQuantity?:number;
    contextNote?:string;
    policyDraft?:RubricPolicies;
  };
  rule?:Record<string,string|number|boolean>;
}

const clean=(text:string)=>text.replace(/\s+/g,' ').trim();
const money=(text:string,near:RegExp):number|undefined=>{
  const m=text.match(near);if(!m)return undefined;
  const raw=(m[1]??'').replace(/[ .]/g,'');const n=Number(raw);return Number.isSafeInteger(n)?n:undefined;
};
const evidence=(text:string,needle:RegExp):string=>{
  const m=needle.exec(text);if(!m)return'';
  const start=Math.max(0,m.index-90),end=Math.min(text.length,m.index+m[0].length+160);
  return clean(text.slice(start,end));
};
const suggestion=(input:Omit<GuidedSuggestion,'id'>):GuidedSuggestion=>({...input,id:'suggest_'+crypto.randomUUID()});

export const governanceFingerprint=async(text:string):Promise<string>=>{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
};

export const analyzeGovernanceText=(raw:string):GuidedSuggestion[]=>{
  const text=clean(raw);if(text.length<20)throw new Error('DOCUMENT_TEXT_TOO_SHORT');
  if(text.length>2_000_000)throw new Error('DOCUMENT_TEXT_TOO_LARGE');
  const out:GuidedSuggestion[]=[];
  const has=(r:RegExp)=>r.test(text);

  if(has(/caisse\s+secours|le\s+secours/i)){
    const amount=money(text,/secours[^.]{0,180}?(?:s['’]?élève|contribution)[^0-9]{0,20}([0-9 .]{3,})\s*(?:f|fcfa)/i)??money(text,/([0-9 .]{3,})\s*(?:f|fcfa)[^.] {0,0}/i);
    out.push(suggestion({category:'RUBRIC',title:'Secours / Solidarité',confidence:0.92,evidence:evidence(text,/caisse\s+secours|le\s+secours/i),
      explanation:'Caisse de solidarité détectée. Vérifiez le montant annuel, la période de versement, le remboursement partiel et les règles de renflouement.',
      rubric:{name:'Secours',kind:'SOLIDARITY',participationMode:'MANDATORY',contributionMode:'MONEY',nominalAmount:amount,contextNote:'À confirmer depuis le règlement : annualité, retenue de fin d’exercice et renflouement après assistance.',policyDraft:{participation:{mode:'MANDATORY'},contribution:{cadence:'ANNUAL',targetAmount:amount?{currency:'XAF',amount}:undefined,allowedMedia:['CASH','MOBILE_MONEY','TRANSFER'],missingHandling:'DEBT'},refund:{mode:'PARTIALLY_REFUNDABLE',settlementTiming:'END_OF_EXERCISE'},reserve:{carryForward:true,trackPerMember:true,openingBalanceSource:'PRIOR_CLOSING',replenishmentRule:'À arbitrer depuis le RI et la pratique observée'},loan:{allowed:false,interestBase:'PRINCIPAL_ONLY',noInterestOnInterest:true},lifecycle:{visibility:'PERSISTENT'}}}}));
  }
  if(has(/collation|aide\s+locale|ration/i)){
    const amount=money(text,/(?:collation|aide\s+locale|ration)[^.]{0,120}?([0-9 .]{3,})\s*(?:f|fcfa)/i);
    out.push(suggestion({category:'RUBRIC',title:'Collation / Aide locale / Ration',confidence:0.9,evidence:evidence(text,/collation|aide\s+locale|ration/i),
      explanation:'Rubrique de réunion détectée. L’assistant ne suppose pas si les absents paient : cette règle doit être confirmée.',
      rubric:{name:'Collation',kind:'CONTRIBUTION',participationMode:has(/obligatoire[^.]{0,80}(?:absence|absent)|même\s+en\s+cas\s+d['’]absence/i)?'MANDATORY':'RULE_BASED',contributionMode:'MONEY',nominalAmount:amount,contextNote:'Confirmer bénéficiaire de la réunion, présents/absents et règle de couverture d’un manquant.',policyDraft:{participation:{mode:has(/obligatoire[^.]{0,80}(?:absence|absent)|même\s+en\s+cas\s+d['’]absence/i)?'MANDATORY':'RULE_BASED',absentMemberRule:has(/obligatoire[^.]{0,80}(?:absence|absent)|même\s+en\s+cas\s+d['’]absence/i)?'PAYS':'CUSTOM'},contribution:{cadence:'SESSION',targetAmount:amount?{currency:'XAF',amount}:undefined,allowedMedia:['CASH','MOBILE_MONEY'],missingHandling:'DEBT'},beneficiary:{mode:'HOST',beneficiariesPerSession:1},refund:{mode:'NON_REFUNDABLE',settlementTiming:'SESSION'},lifecycle:{visibility:'PERSISTENT'}}}}));
  }
  if(has(/caisse\s+transport|le\s+transport/i)){
    const amount=money(text,/transport[^.]{0,140}?([0-9 .]{3,})\s*(?:f|fcfa)/i);
    out.push(suggestion({category:'RUBRIC',title:'Transport',confidence:0.88,evidence:evidence(text,/caisse\s+transport|le\s+transport/i),explanation:'Caisse Transport détectée.',
      rubric:{name:'Transport',kind:'TRANSPORT',participationMode:'RULE_BASED',contributionMode:'MONEY',nominalAmount:amount,contextNote:'Confirmer annualité, période de versement, remboursement éventuel et usages autorisés.',policyDraft:{participation:{mode:'RULE_BASED'},contribution:{cadence:'ANNUAL',targetAmount:amount?{currency:'XAF',amount}:undefined,allowedMedia:['CASH','MOBILE_MONEY'],missingHandling:'DEBT'},refund:{mode:'PARTIALLY_REFUNDABLE',settlementTiming:'END_OF_EXERCISE'},reserve:{carryForward:true,trackPerMember:true,openingBalanceSource:'PRIOR_CLOSING'},lifecycle:{visibility:'PERSISTENT'}}}}));
  }
  if(has(/épargne|epargne/i)){
    out.push(suggestion({category:'RUBRIC',title:'Épargne',confidence:0.94,evidence:evidence(text,/épargne|epargne/i),
      explanation:'Épargne détectée. Les intérêts générés par les prêts doivent rester séparés du capital et leur redistribution doit être simulée avant clôture.',
      rubric:{name:'Épargne',kind:'SAVINGS',participationMode:'OPTIONAL',contributionMode:'MONEY',contextNote:'Capital propriété de l’épargnant ; règles de rémunération et date de restitution à confirmer.',policyDraft:{participation:{mode:'OPTIONAL'},contribution:{cadence:'FLEXIBLE',allowedMedia:['CASH','MOBILE_MONEY','TRANSFER']},refund:{mode:'FULLY_REFUNDABLE',settlementTiming:'END_OF_EXERCISE'},loan:{allowed:true,rateBasisPointsPerPeriod:500,interestBase:'PRINCIPAL_ONLY',paymentPriority:'CAPITAL_FIRST',noInterestOnInterest:true},yield:{enabled:true,allocationModel:'EXACT_WEIGHTED_DEPOSITS',rounding:'LARGEST_REMAINDER'},lifecycle:{visibility:'PERSISTENT'}}}}));
  }
  if(has(/tontine/i)){
    const amount=money(text,/tontine[^.]{0,130}?([0-9 .]{3,})\s*(?:f|fcfa)/i);
    out.push(suggestion({category:'RUBRIC',title:'Tontine détectée',confidence:0.95,evidence:evidence(text,/tontine/i),
      explanation:'Une tontine ne doit pas absorber les autres tontines. Créez une instance par montant ou nature et choisissez ses participants propres.',
      rubric:{name:amount?'Tontine '+amount.toLocaleString('fr-FR'):'Tontine',kind:'TONTINE',participationMode:has(/tontine[^.]{0,100}obligatoire/i)?'MANDATORY':'OPTIONAL',contributionMode:'MONEY',nominalAmount:amount,contextNote:'Chaque souscription devient obligatoire uniquement selon la règle validée du groupe.',policyDraft:{participation:{mode:has(/tontine[^.]{0,100}obligatoire/i)?'MANDATORY':'OPTIONAL'},contribution:{cadence:'SESSION',targetAmount:amount?{currency:'XAF',amount}:undefined,allowedMedia:['CASH','MOBILE_MONEY'],missingHandling:'DEBT'},beneficiary:{mode:'SCHEDULED',beneficiariesPerSession:1},refund:{mode:'CONDITIONAL'},lifecycle:{visibility:'PERSISTENT'}}}}));
  }
  for(const item of ['savon','huile','assiette','drap']){
    if(new RegExp(item,'i').test(text)&&/tontine/i.test(text))out.push(suggestion({category:'RUBRIC',title:'Tontine en nature : '+item,confidence:0.82,evidence:evidence(text,new RegExp(item,'i')),explanation:'Tontine en nature détectée ; conservez-la comme instance autonome.',
      rubric:{name:item[0]!.toUpperCase()+item.slice(1),kind:'TONTINE',participationMode:'OPTIONAL',contributionMode:'IN_KIND',contributionLabel:item,contributionUnit:'unité',contributionQuantity:1,contextNote:'Quantité, qualité, fournisseur, transport et preuve de remise à confirmer.'}}));
  }
  if(has(/épargne\s+scolaire|epargne\s+scolaire/i)){
    out.push(suggestion({category:'RUBRIC',title:'Épargne scolaire',confidence:0.93,evidence:evidence(text,/épargne\s+scolaire|epargne\s+scolaire/i),
      explanation:'Épargne scolaire distincte détectée : elle conserve son propre calendrier de restitution et sa propre enveloppe de rendement.',
      rubric:{name:'Épargne scolaire',kind:'SAVINGS',participationMode:'OPTIONAL',contributionMode:'MONEY',contextNote:'Restitution avant la rentrée ou la Cassation selon le règlement.',policyDraft:{participation:{mode:'OPTIONAL'},contribution:{cadence:'FLEXIBLE',allowedMedia:['CASH','MOBILE_MONEY','TRANSFER']},refund:{mode:'FULLY_REFUNDABLE',settlementTiming:'MID_CYCLE'},loan:{allowed:true,rateBasisPointsPerPeriod:500,interestBase:'PRINCIPAL_ONLY',paymentPriority:'CAPITAL_FIRST',noInterestOnInterest:true},yield:{enabled:true,allocationModel:'EXACT_WEIGHTED_DEPOSITS',rounding:'LARGEST_REMAINDER'},lifecycle:{visibility:'PERSISTENT'}}}}));
  }
  if(has(/assistance/i))out.push(suggestion({category:'RUBRIC',title:'Assistance',confidence:0.86,evidence:evidence(text,/assistance/i),
    explanation:'Assistance détectée : elle peut être un décaissement, une main levée ou un mélange selon le cas.',
    rubric:{name:'Assistance',kind:'ASSISTANCE',participationMode:'RULE_BASED',contributionMode:'MONEY',contextNote:'Qualifier chaque type d’assistance : décaissement de caisse, main levée ou mixte.',policyDraft:{participation:{mode:'RULE_BASED'},assistance:{fundingMode:has(/main\s+levée|main\s+levee/i)?'MIXED':'DISBURSEMENT',authorization:'BUREAU'},lifecycle:{visibility:'EVENT_DRIVEN'}}}}));
  if(has(/main\s+levée|main\s+levee/i))out.push(suggestion({category:'RUBRIC',title:'Main levée',confidence:0.88,evidence:evidence(text,/main\s+levée|main\s+levee/i),
    explanation:'Collecte ponctuelle liée à un événement détectée.',
    rubric:{name:'Main levée',kind:'LEVY',participationMode:'RULE_BASED',contributionMode:'MONEY',contextNote:'Définir motif, bénéficiaires et caractère obligatoire ou volontaire.',policyDraft:{participation:{mode:'RULE_BASED'},contribution:{cadence:'EVENT',allowedMedia:['CASH','MOBILE_MONEY']},beneficiary:{mode:'EVENT_BASED'},lifecycle:{visibility:'EVENT_DRIVEN'}}}}));
  if(has(/frais\s+d['’]?inscription|inscription[^.]{0,80}(?:500|1000|franc)/i))out.push(suggestion({category:'RUBRIC',title:'Inscription',confidence:0.9,evidence:evidence(text,/frais\s+d['’]?inscription|inscription/i),
    explanation:'Petite rubrique d’ouverture d’exercice détectée.',
    rubric:{name:'Inscription',kind:'OTHER',participationMode:'MANDATORY',contributionMode:'MONEY',contextNote:'Rubrique éphémère de début d’exercice.',policyDraft:{participation:{mode:'MANDATORY'},contribution:{cadence:'EXERCISE_OPENING',allowedMedia:['CASH','MOBILE_MONEY']},lifecycle:{visibility:'FIRST_N_SESSIONS',activeFirstSessions:6}}}}));
  if(has(/amende|discipline/i))out.push(suggestion({category:'RUBRIC',title:'Amendes',confidence:0.84,evidence:evidence(text,/amende|discipline/i),
    explanation:'Rubrique événementielle d’amendes détectée.',
    rubric:{name:'Amendes',kind:'OTHER',participationMode:'RULE_BASED',contributionMode:'MONEY',contextNote:'Montant selon l’infraction et la qualité du membre.',policyDraft:{participation:{mode:'RULE_BASED'},contribution:{cadence:'EVENT',allowedMedia:['CASH','MOBILE_MONEY'],missingHandling:'DEBT'},lifecycle:{visibility:'EVENT_DRIVEN'}}}}));
  if(has(/cassation|clôture[^.]{0,80}f[eê]te|f[eê]te[^.]{0,80}fin\s+d['’]?exercice/i))out.push(suggestion({category:'RUBRIC',title:'Cassation / fête de clôture',confidence:0.82,evidence:evidence(text,/cassation|f[eê]te/i),
    explanation:'Activité ou dépense de clôture détectée ; elle reste distincte du RECAP financier.',
    rubric:{name:'Cassation',kind:'OTHER',participationMode:'RULE_BASED',contributionMode:'MONEY',contextNote:'Prévoir budget, comité, recettes éventuelles et décaissements de clôture.',policyDraft:{participation:{mode:'RULE_BASED'},contribution:{cadence:'END_OF_EXERCISE',allowedMedia:['CASH','MOBILE_MONEY']},lifecycle:{visibility:'EVENT_DRIVEN'}}}}));
  if(has(/tenue|tissu|uniforme/i))out.push(suggestion({category:'RUBRIC',title:'Tissu / Tenue',confidence:0.8,evidence:evidence(text,/tenue|tissu|uniforme/i),
    explanation:'Projet de tenue ou uniforme détecté.',
    rubric:{name:'Tissu / Tenue',kind:'OTHER',participationMode:'RULE_BASED',contributionMode:'MIXED',contributionLabel:'tissu / tenue',contributionUnit:'pièce',contributionQuantity:1,contextNote:'Définir fournisseur, qualité, prix, date et preuve de remise.',policyDraft:{participation:{mode:'RULE_BASED'},lifecycle:{visibility:'EXERCISE'}}}}));

  if(has(/emprunt|prêt|pret/i)){
    const normalRate=money(text,/(?:taux\s+d['’]?intérêt|taux\s+d['’]?interet)[^0-9]{0,40}([0-9]{1,3})\s*%/i);
    out.push(suggestion({category:'LOAN_RULE',title:'Règles de prêts',confidence:0.95,evidence:evidence(text,/emprunt|prêt|pret/i),
      explanation:'Prêt détecté. L’intérêt doit être isolé du capital ; aucun intérêt sur intérêt.',
      rule:{ratePercent:normalRate??5,paymentPriority:'CAPITAL_FIRST',noInterestOnInterest:true,alternativePriority:'INTEREST_FIRST'}}));
  }
  if(has(/timbre/i)){
    const stamp=money(text,/timbre[^.]{0,100}?([0-9 .]{2,})\s*(?:f|fcfa)/i);
    out.push(suggestion({category:'RUBRIC',title:'Timbre',confidence:0.86,evidence:evidence(text,/timbre/i),explanation:'Petite rubrique détectée ; elle peut rester sous « Autres » pour éviter de surcharger la feuille.',
      rubric:{name:'Timbre',kind:'OTHER',participationMode:'RULE_BASED',contributionMode:'MONEY',nominalAmount:stamp,contextNote:'À appliquer seulement lors des opérations concernées.'}}));
  }
  if(has(/réunion.{0,40}mensuel|réunions\s+sont\s+mensuelles/i))out.push(suggestion({category:'MEETING_RULE',title:'Réunions mensuelles',confidence:0.9,evidence:evidence(text,/réunions?[^.]{0,80}mensuel/i),explanation:'Cadence mensuelle détectée.',rule:{cadence:'MONTHLY'}}));
  if(has(/adhésion|inscription/i))out.push(suggestion({category:'MEMBERSHIP_RULE',title:'Adhésion / inscription',confidence:0.8,evidence:evidence(text,/adhésion|inscription/i),explanation:'Des règles d’adhésion ont été détectées. Elles doivent alimenter l’étape Membres, sans créer automatiquement un membre.',rule:{humanApprovalRequired:true}}));
  return out;
};

export const interpretLaunchPrompt=(raw:string):Partial<GroupProjectLaunchProfile> & {family?:'association'|'rotating_tontine';notes:string[]}=>{
  const text=clean(raw),notes:string[]=[];const result:Partial<GroupProjectLaunchProfile>&{family?:'association'|'rotating_tontine';notes:string[]}={notes};
  const existing=/existe\s+déjà|existe\s+depuis|historique|ancien\s+groupe/i.test(text);
  const transform=/tontine[^.]{0,100}(?:devient|devenir|évolu|transform)[^.]{0,100}association/i.test(text);
  result.origin={mode:transform?'TRANSFORM_REGISTERED':existing?'IMPORT_EXISTING':'NEW'};
  result.family=/association/i.test(text)?'association':/tontine/i.test(text)?'rotating_tontine':undefined;
  const m=text.match(/([0-9]{1,5})\s+membres?/i);if(m)result.members={expectedMembers:Number(m[1]),rosterMode:existing?'HISTORICAL_RECONCILIATION':'BUILD_LATER'};
  if(/mensuel|chaque\s+mois/i.test(text))result.cycle={...(result.cycle??{}),cadence:'MONTHLY'};
  if(/faible\s+connexion|2g|ancien\s+(?:android|téléphone)|senior|âgé/i.test(text))result.accessibility={lowBandwidthPriority:true,oldDevicePriority:true,ultraSimple:true};
  if(/oral|voix|parler|micro/i.test(text))result.accessibility={...(result.accessibility??{}),oralAssistant:true};
  notes.push('ASSISTANT_DRAFT_ONLY','HUMAN_CONFIRMATION_REQUIRED','NO_FINANCIAL_WRITE');
  return result;
};
