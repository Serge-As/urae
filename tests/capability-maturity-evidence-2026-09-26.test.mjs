import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PRODUCT_MODULES} from '../.build/packages/module-registry/src/index.js';

const evidence=[
 ['MEETING.BENEFICIARIES','packages/domain/src/index.ts',['declareBenefit','recordBenefitEvidence'],'apps/web/src/sessions-ui.js',['declareMeetingBeneficiary']],
 ['OPPORTUNITY.NEED','packages/value-network/src/index.ts',['createNeed','matchNeed'],'apps/web/src/core-economic-learning-ui.js',['createValueNeed','valueNeedMatches']],
 ['MANAGER.BUSINESS_STUDIO','packages/business-studio/src/index.ts',['createClient','createQuote','recordPayment','profitability'],'apps/web/src/business-studio-ui.js',['createBusinessClient','issueBusinessInvoice','businessProfitability']],
 ['GROWTH.REFERRAL','packages/growth-referral/src/index.ts',['createCampaign','verifyConversion'],'apps/web/src/core-economic-learning-ui.js',['createReferralCampaign','verifyReferralConversion']],
 ['LEARNING.MANAGER_ACADEMY','packages/knowledge-academy/src/index.ts',['createCourse','enroll','submitLesson'],'apps/web/src/core-economic-learning-ui.js',['createAcademyCourse','enrollAcademy']],
 ['LEARNING.KNOWLEDGE_BANK','packages/knowledge-academy/src/index.ts',['createKnowledge','searchKnowledge','reviewKnowledge'],'apps/web/src/core-economic-learning-ui.js',['createKnowledge','searchKnowledge']],
 ['SAFETY.ANTISCAM','packages/trust/src/index.ts',['SafetyCaseService','addEvidence','appeal'],'apps/web/src/financial-lab-ui.js',['reportSafety','decideSafetyCase']],
 ['COMMUNITY.CHAT','packages/community-realtime/src/index.ts',['createMessage','toggleReaction','saveDraft'],'apps/web/src/community-shop-ui.js',['renderRealtimeMessage','écrit…']],
 ['COMMUNITY.PRO_HUBS','packages/community/src/index.ts',['createHub','federationProfile'],'apps/web/src/community-shop-ui.js',['createCommunityHub','federatedGroupCodes']],
 ['FINANCE.PRIOR_BALANCE','packages/finance/src/treasury.ts',['openingBalance'],'apps/web/src/advanced-ui.js',['openingBalanceForm','recordOpeningBalance']],
 ['GROUP.ANTICIPATION','packages/market/src/index.ts',['createMarketRequest','PREDICTION','acceptPredictedMarketRequest'],'apps/web/src/advanced-ui.js',['socialRequestSource','acceptPredictedMarketRequest']],
 ['GOVERNANCE.AI_RULE_EXTRACTION','packages/guided-assistant/src/index.ts',['analyzeGovernanceText','governanceFingerprint'],'apps/web/src/launch-studio.js',['analyzeGroupDocument','renderSuggestions','analyzeLaunchFiles']],
 ['CORE.HYBRID_GROUP','packages/domain/src/index.ts',['GROUP_KINDS',"'hybrid'"],'apps/web/index.html',['value="hybrid"']],
 ['SEARCH.UNIVERSAL','apps/web/src/universal-search.js',['localUniversalSearch','remoteUniversalSearch'],'apps/web/src/main.js',['renderUniversalSearchFull','universalSearchFull']],
 ['CALENDAR.UNIFIED','apps/web/src/unified-calendar.js',['buildUnifiedCalendar','obligations'],'apps/web/src/main.js',['renderUnifiedCalendar','unifiedCalendarPanel']],
 ['RUBRIC.STARTER_KITS','packages/rubrics/src/index.ts',['STARTER_RUBRIC_FACETS','starterCandidates'],'apps/web/src/launch-studio.js',['buildStarterKit','persistStarterKit','printStarterKit']],
 ['GOVERNANCE.DOCUMENT_STUDIO','packages/group-documents/src/index.ts',['GroupDocumentService','async create','async archive'],'apps/web/src/documents-ui.ts',['uploadDocuments','searchDocuments','refreshDocuments']],
 ['TRUST.VERIFICATION','packages/identity-proof/src/index.ts',['registerAccountProof','candidateMatches','identifier_hash'],'apps/web/src/identity-verification-ui.js',['registerIdentityProof','identityProofMatches','value.value=\'\'']],
 ['AI.FOUNDER','packages/knowledge-academy/src/index.ts',['founderContext','canActivateRules:false','canWriteLedger:false'],'apps/web/src/core-economic-learning-ui.js',['Founder AI','founderAiContext','knowledgeOperational']],
 ['DATA.QUALITY','packages/completion/src/index.ts',["flow('DATA.QUALITY'",'readinessPassport'],'apps/web/src/data-quality-ui.js',['ledgerAnomalies','READINESS_PASSPORT','ANOMALY']],
 ['PAPER.BRIDGE','packages/group-documents/src/index.ts',['GroupDocumentService','artifactKey','fingerprint'],'apps/web/src/documents-ui.ts',['accept=".pdf,.doc,.docx,.txt,image/*"','analyze-files','Paper Bridge']],
 ['GOVERNANCE.MANDATE','packages/business-studio/src/index.ts',['createMandate','activateMandate','endMandate'],'apps/web/src/business-studio-ui.js',['Nouveau mandat','Activer le mandat','Terminer le mandat']],
 ['OPPORTUNITY.GRAPH','packages/value-network/src/index.ts',['createNeed','matchNeed','prepareProcurement'],'apps/web/src/opportunity-intelligence-ui.js',['Graphe besoins → offres','valueNeedMatches','le sponsoring ne modifie jamais le score']],
 ['MANAGER.VALUE_DISCOVERY','packages/value-network/src/index.ts',['matchNeed','scoreBreakdown','hardReasons'],'apps/web/src/opportunity-intelligence-ui.js',['Value Discovery','Score explicable','Coût rendu']],
 ['MARKETPLACE.MARKET_INTELLIGENCE','packages/economic-intelligence/src/index.ts',['EconomicIntelligenceService','GROUP_PSEUDONYMOUS_AGGREGATE','containsIndividualFinancialData:false'],'apps/web/src/opportunity-intelligence-ui.js',['Market Intelligence','Intelligence marché agrégée','economicProfile']],
 ['AI.LOCAL','packages/voice-commands/src/index.ts',['parseVoiceFinancialCommand','matchVoiceCandidate','parseVoiceAmount'],'apps/web/src/voice-entry-ui.ts',['Rien n’est comptabilisé avant votre validation','Comprendre et prévisualiser','Valider ces saisies']],
 ['SAFETY.QUIET_WATCH','packages/trust/src/index.ts',['SafetyCaseService','UNVERIFIED_SUSPICION','automaticLegalVerdict:false'],'apps/web/src/quiet-watch-ui.js',['suspicion non vérifiée','decideSafetyCase','Enregistrer un recours']],
 ['GOVERNANCE.TENDER','packages/market/src/index.ts',['createMarketRequest','respondMarketRequest','shortlistMarketResponse','selectMarketResponse'],'apps/web/src/advanced-ui.js',['Ajouter une réponse fournisseur','Présélectionner','Sélectionner']],
 ['COMMUNITY.MICRO_ADS','packages/ad-manager/src/index.ts',['create(groupId','frequencyCapPer7Days','selectAdDelivery'],'apps/web/src/ad-manager-ui.js',['Brouillon AdManager créé en sandbox','frequencyCapPer7Days','placements']],
 ['RUBRIC.LOCAL_AID','packages/guided-assistant/src/index.ts',["pushMeetingContribution('Aide locale'","kind:'CONTRIBUTION'",'ne les fusionne pas'],'apps/web/src/main.js',["quickRubricLocalAid","rubricsManagementPanel","prepareRubricPreset('Aide locale'"]],
 ['RUBRIC.HAND_RAISE','packages/guided-assistant/src/index.ts',["title:'Main levée'","kind:'LEVY'",'main\\s+levée'],'apps/web/src/main.js',["quickRubricHandRaise","rubricsManagementPanel","prepareRubricPreset('Main levée'"]],
 ['PAPER.PRINT','apps/web/src/print-center.js',['buildPrintSnapshot','financial:ledger?','aucune écriture financière'],'apps/web/src/main.js',['PAPER.PRINT','paperPrintCenter','printCenterUI.refresh']],
 ['GROUP.MODEL_REGISTRY','apps/web/src/operational-registry-ui.js',['GROUP.MODEL_REGISTRY','modelState','sourceGroupId'],'apps/web/src/main.js',['GROUP.MODEL_REGISTRY','operationalRegistryUI.open']],
 ['GROUP.CASE_LAW','apps/web/src/operational-registry-ui.js',['GROUP.CASE_LAW','autoRuleActivation:false','caseState'], 'apps/web/src/main.js',['GROUP.CASE_LAW','operationalRegistryUI.open']],
 ['RUBRIC.EXCEPTIONS','apps/web/src/operational-registry-ui.js',['RUBRIC.EXCEPTIONS','exceptionState','createsLedgerEntry:false'],'apps/web/src/main.js',['RUBRIC.EXCEPTIONS','operationalRegistryUI.open']],
 ['DATA.TIME_MACHINE','apps/web/src/operational-registry-ui.js',['DATA.TIME_MACHINE','read-only-snapshot','rollbackSupported:false'],'apps/web/src/main.js',['DATA.TIME_MACHINE','operationalRegistryUI.open']],
 ['SUCCESSION.NEXT_OF_KIN','apps/web/src/operational-registry-ui.js',['SUCCESSION.NEXT_OF_KIN','grantsMembership:false','grantsFinancialRights:false'],'apps/web/src/main.js',['SUCCESSION.NEXT_OF_KIN','operationalRegistryUI.open']],
 ['DASHBOARDS.ALL','apps/web/src/role-directory-talent-ui.js',['mountRoleDashboardsUI','Vue responsable','Vue membre'],'apps/web/src/main.js',['DASHBOARDS.ALL','roleDashboardsUI.refresh']],
 ['GEO.DIRECTORY','packages/discovery/src/index.ts',['proximity(locality','LOCALITY_REQUIRED','searchCandidates'],'apps/web/src/role-directory-talent-ui.js',['Annuaire local','proximityGroups','Aucun suivi GPS permanent']],
 ['MANAGER.PUBLIC_PROFILE','packages/discovery/src/index.ts',['saveCandidateProfile','optIn','CANDIDATE_PUBLIC_PROFILE_UPDATED'],'apps/web/src/role-directory-talent-ui.js',['Profil public gestionnaire','saveCandidateProfile','Rendre ce profil découvrable']],
 ['CREATOR.STUDIO','packages/business-studio/src/index.ts',['createOffer','setOfferState','OFFER'],'apps/web/src/role-directory-talent-ui.js',['Creator & Seller Studio','createBusinessOffer','setBusinessOfferState']],
 ['LEARNING.TALENT','packages/knowledge-academy/src/index.ts',['CERTIFICATE','submitLesson','grantsFinancialRole:false'],'apps/web/src/role-directory-talent-ui.js',['Talent · apprendre','myCertificates','aucun pouvoir administratif ou financier automatique']],
 ['MEETING.PREPAYMENTS','packages/prepayments/src/index.ts',['ledger-once','ledgerMutationOnAllocation:false','PREPAYMENT_ALLOCATED'],'apps/web/src/meeting-finance-governance-ui.js',['Prépaiements / avances','Avance comptabilisée une seule fois','allocation sans mutation Ledger']],
 ['MEETING.REOPEN_AUTH','packages/meeting-authorization/src/index.ts',['independentAccountsRequired:true','authorizationState','APPROVED'],'apps/web/src/meeting-finance-governance-ui.js',['Approuver avec mon compte','lateAuthorizationId','quorum multi-responsables']],
 ['FINANCE.ENVELOPES','packages/finance/src/treasury.ts',['BUDGET_ENVELOPE','ledgerMutation:false','ENVELOPE_BUDGET_EXCEEDED'],'apps/web/src/finance-envelope-ui.js',['Enveloppes budgétaires','ne crée aucune écriture Ledger','allocateEnvelope']],
 ['FINANCE.WALLET','packages/finance/src/treasury.ts',['custodyPosition','internalOnly:true','externalPaymentRail:false'],'apps/web/src/advanced-ui.js',['Portefeuille interne Eco-System','Mobile Money','custodyPosition']],
 ['FINANCE.TRUST_SCORE','packages/trust/src/index.ts',['CommitmentReliabilityEngine','WEALTH_NOT_USED','advisoryOnly:true'],'apps/web/src/trust-center.js',['Score indicatif','Advisory only','ne décide jamais automatiquement']],
 ['TRUST.GRAPH','packages/trust/src/index.ts',['CommitmentTrustGraphService','automaticCreditDecision:false','wealthUsed:false'],'apps/web/src/trust-center.js',['Trust Graph','Décision automatique','richesse utilisée']]
];
test('maturity registry promotes only capabilities with owner engine and user journey evidence',()=>{
 for(const [id,owner,ownerTokens,ui,uiTokens] of evidence){
   const a=fs.readFileSync(owner,'utf8'),b=fs.readFileSync(ui,'utf8');
   for(const token of ownerTokens)assert.ok(a.includes(token),id+' owner '+token);
   for(const token of uiTokens)assert.ok(b.includes(token),id+' ui '+token);
   assert.equal(PRODUCT_MODULES.find(x=>x.id===id)?.status,'FOUNDATION_ACTIVE',id);
 }
});
