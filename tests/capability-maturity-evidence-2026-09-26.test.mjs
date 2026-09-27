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
 ['RUBRIC.HAND_RAISE','packages/rubrics/src/index.ts',["main_levee:","obligation:'EVENT_DRIVEN'","medium:'HYBRID'"],'apps/web/src/main.js',["quickRubricHandRaise","rubricsManagementPanel","prepareRubricPreset('Main levée'"]],
 ['MEETING.PREPAYMENTS','packages/prepayments/src/index.ts',['ledger-once','ledgerMutationOnAllocation:false','PREPAYMENT_ALLOCATED'],'apps/web/src/meeting-finance-governance-ui.js',['Prépaiements / avances','Avance comptabilisée une seule fois','allocation sans mutation Ledger']],
 ['MEETING.REOPEN_AUTH','packages/meeting-authorization/src/index.ts',['independentAccountsRequired:true','authorizationState','APPROVED'],'apps/web/src/meeting-finance-governance-ui.js',['Approuver avec mon compte','lateAuthorizationId','quorum multi-responsables']],
 ['FINANCE.TRUST_SCORE','packages/trust/src/index.ts',['CommitmentReliabilityEngine','WEALTH_NOT_USED','advisoryOnly:true'],'apps/web/src/trust-center.js',['Score indicatif','Advisory only','ne décide jamais automatiquement']],
];
test('maturity registry promotes only capabilities with owner engine and user journey evidence',()=>{
 for(const [id,owner,ownerTokens,ui,uiTokens] of evidence){
   const a=fs.readFileSync(owner,'utf8'),b=fs.readFileSync(ui,'utf8');
   for(const token of ownerTokens)assert.ok(a.includes(token),id+' owner '+token);
   for(const token of uiTokens)assert.ok(b.includes(token),id+' ui '+token);
   assert.equal(PRODUCT_MODULES.find(x=>x.id===id)?.status,'FOUNDATION_ACTIVE',id);
 }
});
