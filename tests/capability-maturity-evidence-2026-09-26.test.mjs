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
 ['COMMUNITY.MICRO_ADS','packages/ad-manager/src/index.ts',['create(groupId','frequencyCapPer7Days','selectAdDelivery'],'apps/web/src/ad-manager-ui.js',['Brouillon AdManager créé en sandbox','frequencyCapPer7Days','placements']]
];
test('maturity registry promotes only capabilities with owner engine and user journey evidence',()=>{
 for(const [id,owner,ownerTokens,ui,uiTokens] of evidence){
   const a=fs.readFileSync(owner,'utf8'),b=fs.readFileSync(ui,'utf8');
   for(const token of ownerTokens)assert.ok(a.includes(token),id+' owner '+token);
   for(const token of uiTokens)assert.ok(b.includes(token),id+' ui '+token);
   assert.equal(PRODUCT_MODULES.find(x=>x.id===id)?.status,'FOUNDATION_ACTIVE',id);
 }
});
