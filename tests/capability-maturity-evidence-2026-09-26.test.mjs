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
 ['GOVERNANCE.AI_RULE_EXTRACTION','packages/guided-assistant/src/index.ts',['analyzeGovernanceText','governanceFingerprint'],'apps/web/src/launch-studio.js',['analyzeGroupDocument','renderSuggestions','analyzeLaunchFiles']],
 ['CALENDAR.UNIFIED','apps/web/src/unified-calendar.js',['buildUnifiedCalendar','obligations'],'apps/web/src/main.js',['renderUnifiedCalendar','unifiedCalendarPanel']],
 ['CORE.HYBRID_GROUP','packages/domain/src/index.ts',['TONTINE_VARIANT_REQUIRES_ROTATING_FAMILY','INVALID_TONTINE_VARIANT','rotating_tontine'],'apps/web/src/launch-studio.js',['tontineVariant','Variante de tontine']],
 ['CREATOR.STUDIO','packages/creator-talent/src/index.ts',['createContent','recordInterest','startConversation','createCanonicalAction','canonicalTransactionOnly:true'],'apps/web/src/creator-talent-ui.js',['contenu → intérêt → conversation → action → transaction','creatorInterestToBusiness','ne promet jamais de revenu']],
 ['LEARNING.TALENT','packages/creator-talent/src/index.ts',['addTalentEvidence','talentProfile','COMPLETED_ORDER','confirmedBusinessReceipts'],'apps/web/src/creator-talent-ui.js',['Learn → Prove → Work → Earn','Preuve Talent','Earn confirmé']],
 ['MANAGER.PUBLIC_PROFILE','packages/discovery/src/index.ts',['PublicManagerProfile','reputationEvidence','PUBLIC_EVIDENCE_ONLY','opaqueScore:false'],'apps/web/src/manager-public-profile-ui.js',['Réputation explicable','Score opaque : non','votre consentement']],
 ['SEARCH.UNIVERSAL','apps/web/src/universal-search.js',['localUniversalSearch','remoteUniversalSearch','scalarText'],'apps/web/src/main.js',['renderUniversalSearchFull','listWorkspaceRecords','inboxItems']],
 ['GOVERNANCE.DOCUMENT_STUDIO','packages/group-documents/src/index.ts',['GroupDocumentService','async create','async archive'],'apps/web/src/documents-ui.ts',['uploadDocuments','searchDocuments','refreshDocuments']],
 ['TRUST.VERIFICATION','packages/identity-proof/src/index.ts',['registerAccountProof','candidateMatches','identifier_hash'],'apps/web/src/identity-verification-ui.js',['registerIdentityProof','identityProofMatches','value.value=\'\'']],
 ['DATA.QUALITY','packages/completion/src/index.ts',["flow('DATA.QUALITY'",'readinessPassport'],'apps/web/src/data-quality-ui.js',['ledgerAnomalies','READINESS_PASSPORT','ANOMALY']],
 ['PAPER.BRIDGE','packages/group-documents/src/index.ts',['GroupDocumentService','artifactKey','fingerprint'],'apps/web/src/documents-ui.ts',['accept=".pdf,.doc,.docx,.txt,image/*"','analyze-files','Paper Bridge']],
 ['RUBRIC.STARTER_KITS','packages/starter-kit/src/index.ts',['StarterKitService','RUBRIC.STARTER_KITS','STARTER_KIT_CREATED'],'apps/web/src/starter-kit-ui.js',['Kit prêt à l’emploi du groupe','Rubriques & chiffrage','Invitation & modèle de PV']],
 ['GROUP.MODEL_REGISTRY','packages/group-learning-registry/src/index.ts',['GroupModelRegistryService','modelVersion','RECOMMENDED'],'apps/web/src/group-learning-registry-ui.js',['Capturer une version de modèle','captureGroupModel','Recommander']],
 ['GROUP.CASE_LAW','packages/group-learning-registry/src/index.ts',['GroupCaseLawService','CASE_LAW_RECOMMENDATION_EVIDENCE_INCOMPLETE','autoRuleActivation:false'],'apps/web/src/group-learning-registry-ui.js',['Documenter un précédent métier','createCaseLaw','Proposer à la revue globale']],
 ['MARKETPLACE.MARKET_INTELLIGENCE','packages/economic-intelligence/src/index.ts',['EconomicIntelligenceService','GROUP_PSEUDONYMOUS_AGGREGATE','containsIndividualFinancialData:false'],'apps/web/src/opportunity-intelligence-ui.js',['Market Intelligence','Intelligence marché agrégée','economicProfile']],
 ['GOVERNANCE.TENDER','packages/market/src/index.ts',['createMarketRequest','respondMarketRequest','shortlistMarketResponse','selectMarketResponse'],'apps/web/src/advanced-ui.js',['Ajouter une réponse fournisseur','Présélectionner','Sélectionner']],
 ['RUBRIC.LOCAL_AID','packages/rubrics/src/index.ts',["aide_locale:","refundability:'NON_REFUNDABLE'",'starterRubricFacetsForName'],'apps/web/src/main.js',["quickRubricLocalAid","rubricsManagementPanel","prepareRubricPreset('Aide locale'"]],
 ['RUBRIC.EXCEPTIONS','packages/rubric-exceptions/src/index.ts',['RubricExceptionService','exceptionState','autoApplyMoney:false'],'apps/web/src/operational-registry-ui.js',['createRubricException','decideRubricException','Effet exceptionnel']],
 ['DATA.TIME_MACHINE','packages/time-machine/src/index.ts',['TimeMachineService','rollbackSupported:false','compare(groupId'],'apps/web/src/operational-registry-ui.js',['captureTimeMachine','compareTimeMachine','Aucun rollback automatique']],
 ['SUCCESSION.NEXT_OF_KIN','packages/succession/src/index.ts',['NextOfKinService','grantsFinancialRights:false','legalHeirDetermination:false'],'apps/web/src/operational-registry-ui.js',['createNextOfKin','confirmNextOfKin','droits automatiques : aucun']],
 ['GOVERNANCE.MANDATE','packages/business-studio/src/index.ts',['approveMandate','minimumApprovals','systemPermissionElevation:false'],'apps/web/src/business-studio-ui.js',['Droits de mission','Approuver ce mandat','Activer après quorum']],
 ['GROUP.ANTICIPATION','packages/anticipation/src/index.ts',['AnticipationService','HISTORICAL_INFERENCE','ledgerMutation:false'],'apps/web/src/anticipation-ui.js',['Valider ce plan','Signaux actuels','Aucun signal ne modifie le RI, le Ledger']],
 ['RUBRIC.HAND_RAISE','packages/rubrics/src/index.ts',["main_levee:","obligation:'EVENT_DRIVEN'","medium:'HYBRID'"],'apps/web/src/main.js',["quickRubricHandRaise","rubricsManagementPanel","prepareRubricPreset('Main levée'"]],
 ['MEETING.PREPAYMENTS','packages/prepayments/src/index.ts',['ledger-once','ledgerMutationOnAllocation:false','PREPAYMENT_ALLOCATED'],'apps/web/src/meeting-finance-governance-ui.js',['Prépaiements / avances','Avance comptabilisée une seule fois','allocation sans mutation Ledger']],
 ['MEETING.REOPEN_AUTH','packages/meeting-authorization/src/index.ts',['independentAccountsRequired:true','authorizationState','APPROVED'],'apps/web/src/meeting-finance-governance-ui.js',['Approuver avec mon compte','lateAuthorizationId','quorum multi-responsables']],
 ['FINANCE.TRUST_SCORE','packages/trust/src/index.ts',['CommitmentReliabilityEngine','WEALTH_NOT_USED','advisoryOnly:true'],'apps/web/src/trust-center.js',['Score indicatif','Advisory only','ne décide jamais automatiquement']],
 ['COMMUNITY.MICRO_ADS','packages/community-micro-ads/src/index.ts',['MICRO_AD_GROUP_NEED_REQUIRES_MANAGER','microAdState','marketplaceRef'],'apps/web/src/micro-ads-ui.js',['Micro-annonces · Je cherche / Je propose','micro-annonce personnelle','Relier au Marketplace']],
 ['MANAGER.VALUE_DISCOVERY','packages/value-discovery/src/index.ts',['ValueDiscoveryService','incomePromise:false','publicationConsent===true'],'apps/web/src/value-discovery-ui.js',['Ce que je sais faire','Suggestions expliquées','revenu garanti : non']],
 ['FINANCE.WALLET','packages/wallet/src/index.ts',['WalletService','derivedFromCanonicalLedger:true','providerTopupEnabled:false','LOAN_DEBT'],'apps/web/src/wallet-ui.js',['Wallet Eco-System','Solde général','Mobile Money/cartes restent désactivées']],
 ['FINANCE.ENVELOPES','packages/member-envelope/src/index.ts',['MemberEnvelopeService',"scope:'MEMBER_ONLY'","otherMemberFinancialData:false","requiresRecipientBinding:true"],'apps/web/src/member-envelope-ui.js',['Mon enveloppe de séance','aucune donnée financière des autres membres','MEMBER_ENVELOPE_READY']],
 ['OPPORTUNITY.GRAPH','packages/opportunity-graph/src/index.ts',['OpportunityGraphService','persisted:false','secondSourceOfTruth:false','privacyFiltered:true'],'apps/web/src/opportunity-graph-ui.js',['Eco Opportunity Graph','ne devient jamais une seconde base de vérité','Relations visibles']],
 ['TRUST.GRAPH','packages/trust/src/index.ts',['CommitmentTrustGraphService','opaqueGlobalScore:false','secondSourceOfTruth:false','IDENTITY_PROOF_REFERENCE','PARTICIPATED_AS'],'apps/web/src/trust-center.js',['Relations explicables','ne crée pas une seconde vérité','Décision automatique']],
 ['PAPER.PRINT','apps/web/src/print-center.js',['buildSessionPrintSheet','buildMemberPrintSheet','buildAttendancePrintSheet','buildRoleRegister','buildMemberCards'],'apps/web/src/print-center.js',['Feuille de séance','Émargement / présences','Fiche individuelle','Cartes membres']],
 ['AI.FOUNDER','packages/founder-ai/src/index.ts',['FounderAIService','founderTeamOnly:true','canExecute:false','canWriteLedger:false'],'apps/web/src/founder-ai-ui.js',['brief stratégique sourcé','exécution automatique : non','n’invente pas de signal']],
 ['AI.LOCAL','apps/web/src/local-assistant.js',['interpretLocalAssistant','offlineCapable:true','canWriteLedger:false'],'apps/web/src/local-assistant.js',['voiceFinancialText','Rien ne sera comptabilisé avant votre validation','réseau requis : non']],
 ['SAFETY.QUIET_WATCH','packages/quiet-watch/src/index.ts',['QuietWatchService','publicAccusation:false','automaticSanction:false','automaticFinancialEffect:false'],'apps/web/src/quiet-watch-ui.js',['aucune accusation','aucune sanction','aucune écriture financière','Résoudre avec preuve']],
 ['DASHBOARDS.ALL','apps/web/src/role-dashboards-ui.js',['dashboardCard','owner','formula','proof'],'apps/web/src/role-dashboards-ui.js',["'MEMBER'","'MANAGER'","'PARTNER'","'ADVERTISER'","'SUPERADMIN'","'MAINTENANCE'",'Indisponible']],
];
test('maturity registry promotes only capabilities with owner engine and user journey evidence',()=>{
 for(const [id,owner,ownerTokens,ui,uiTokens] of evidence){
   const a=fs.readFileSync(owner,'utf8'),b=fs.readFileSync(ui,'utf8');
   for(const token of ownerTokens)assert.ok(a.includes(token),id+' owner '+token);
   for(const token of uiTokens)assert.ok(b.includes(token),id+' ui '+token);
   assert.equal(PRODUCT_MODULES.find(x=>x.id===id)?.status,'FOUNDATION_ACTIVE',id);
 }
});
