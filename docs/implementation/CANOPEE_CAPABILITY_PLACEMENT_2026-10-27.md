# Canopée + Repères — emplacement des 164 capacités

Audit du 27 octobre 2026. Les cartes sont ouvertes dans la véritable application locale avec des données fictives, sans compte réel. Les huit dernières destinations modifiées sont parcourues une seconde fois. Les empreintes des quatre fichiers de présentation fixent la provenance avant publication ; le reçu de livraison atteste ensuite le commit publié.

Résultat : **164 / 164 cartes présentes et parcourues**, **147 ouvertures vers un écran existant**, **17 dossiers préparatoires**, aucune destination absente, aucune erreur JavaScript, aucune écriture financière ou métier pendant la navigation. Les requêtes de prévisualisation de séance et la télémétrie déjà existante sont comptées séparément dans le JSON.

Les niveaux déclarés du registre sont conservés : 155 FOUNDATION_ACTIVE, 4 STRUCTURAL_V1, 5 PLANNED_DOMAIN. FOUNDATION_ACTIVE ne signifie pas que toutes les intégrations ou toutes les fonctions d’un domaine sont achevées. Les dossiers ci-dessous sont des limites existantes explicites ; ils ne sont pas annoncés comme des moteurs finalisés.

## Dossiers préparatoires conservés

| Capacité | Désignation | Maturité existante |
| --- | --- | --- |
| DISCOVERY.SAVED_SEARCH | Recherches sauvegardées | FOUNDATION_ACTIVE |
| DISCOVERY.ALERTS | Alertes de découverte | FOUNDATION_ACTIVE |
| MEMBERSHIP.QUESTIONS | Questions d'adhésion | FOUNDATION_ACTIVE |
| MEMBERSHIP.REFERRALS | Références et parrains | FOUNDATION_ACTIVE |
| MEMBERSHIP.ANTI_ENUMERATION | Protection anti-énumération | FOUNDATION_ACTIVE |
| GROUP.EVOLUTION | Évolution Tontine → Association | FOUNDATION_ACTIVE |
| GOVERNANCE.MANDATE | Mandats et délégations | FOUNDATION_ACTIVE |
| COMMUNITY.VIDEO | Visio et réunions distantes | PLANNED_DOMAIN |
| MARKETPLACE.REWARDS | Cashback, points et fidélité | PLANNED_DOMAIN |
| INTEGRATION.MOBILE_MONEY | Mobile Money sandbox | PLANNED_DOMAIN |
| INTEGRATION.SMS | SMS adapter | STRUCTURAL_V1 |
| INTEGRATION.WHATSAPP | WhatsApp adapter | STRUCTURAL_V1 |
| INTEGRATION.TELEGRAM | Telegram adapter | STRUCTURAL_V1 |
| INTEGRATION.EMAIL | Email adapter | STRUCTURAL_V1 |
| SECURITY.MFA | MFA rôles sensibles | PLANNED_DOMAIN |
| BACKUP.D1_RESTORE | Backup/restauration D1 | FOUNDATION_ACTIVE |
| FEDERATION.GROUP_NETWORK | Fédérations de groupes | PLANNED_DOMAIN |

## Tableaux et saisie financière

Les tableaux restent alimentés par leurs propriétaires existants. Les deux feuilles financières canoniques sont conservées : séance et membre. La finition commune améliore la lecture des montants, les en-têtes, le suivi de ligne, le focus et les commandes de validation. Elle ne déplace pas les colonnes fixes et ne remplace pas les confirmations, réserves ou conflits. Le test complémentaire couvre téléphone 390 px et mode Senior, édition d’un montant, commandes tactiles de 44 px minimum et persistance du signal rouge. Les suites financières acquises couvrent la valeur confirmée, le rechargement, les comptes distincts, la synchronisation et la reprise.

Inventaire statique des constructions de tableaux ; les modèles d’impression ont leurs styles propres. Ce décompte ne signifie pas que chaque état possible a été visualisé.

| Fichier propriétaire | Constructions repérées |
| --- | ---: |
| apps/web/src/completion-ui.js | 6 |
| apps/web/src/detail-ui.js | 3 |
| apps/web/src/economic-experiments-ui.js | 1 |
| apps/web/src/financial-explanations-ui.js | 1 |
| apps/web/src/group-home-ui.js | 2 |
| apps/web/src/launch-studio.js | 3 |
| apps/web/src/loan-simulation-ui.js | 2 |
| apps/web/src/main.js | 4 |
| apps/web/src/member-control-ui.js | 1 |
| apps/web/src/print-center.js | 7 |
| apps/web/src/recap-ui.js | 2 |
| apps/web/src/request-budget-ui.js | 1 |
| apps/web/src/safety-review-ui.js | 1 |
| apps/web/src/savings-yield-ui.js | 2 |
| apps/web/src/sessions-ui.js | 5 |
| apps/web/src/sovereign-offline-ui.js | 1 |
| apps/web/src/starter-kit-ui.js | 1 |

## Matrice complète

| Capacité | Maturité | Écran | Ancre / onglet / feuille | Destination vérifiée |
| --- | --- | --- | --- | --- |
| CORE.IDENTITY | FOUNDATION_ACTIVE | dashboard | personalCockpitPanel | Écran propriétaire existant |
| CORE.IDENTITY.PROJECTIONS | FOUNDATION_ACTIVE | dashboard | personalCockpitPanel | Écran propriétaire existant |
| CORE.IDENTITY.CLAIM | FOUNDATION_ACTIVE | dashboard | personalCockpitPanel | Écran propriétaire existant |
| CORE.IDENTITY.MULTIGROUP | FOUNDATION_ACTIVE | dashboard | personalCockpitPanel | Écran propriétaire existant |
| DISCOVERY.GROUP_SEARCH | FOUNDATION_ACTIVE | discovery | — | Écran propriétaire existant |
| DISCOVERY.MEMBER_SEARCH | FOUNDATION_ACTIVE | discovery | — | Écran propriétaire existant |
| DISCOVERY.GROUP_FIT | FOUNDATION_ACTIVE | discovery | — | Écran propriétaire existant |
| DISCOVERY.SAVED_SEARCH | FOUNDATION_ACTIVE | services | — | Dossier préparatoire conservé |
| DISCOVERY.ALERTS | FOUNDATION_ACTIVE | services | — | Dossier préparatoire conservé |
| DISCOVERY.PROXIMITY | FOUNDATION_ACTIVE | discovery | geoDirectoryCenter | Écran propriétaire existant |
| MEMBERSHIP.APPLICATION | FOUNDATION_ACTIVE | discovery | — | Écran propriétaire existant |
| MEMBERSHIP.INVITATION | FOUNDATION_ACTIVE | discovery | — | Écran propriétaire existant |
| MEMBERSHIP.RECRUITMENT | FOUNDATION_ACTIVE | discovery | — | Écran propriétaire existant |
| MEMBERSHIP.PORTFOLIO | FOUNDATION_ACTIVE | ecosystem | productiveCommunityCenter | Écran propriétaire existant |
| MEMBERSHIP.QUESTIONS | FOUNDATION_ACTIVE | services | — | Dossier préparatoire conservé |
| MEMBERSHIP.REFERRALS | FOUNDATION_ACTIVE | services | — | Dossier préparatoire conservé |
| MEMBERSHIP.RECONCILIATION | FOUNDATION_ACTIVE | settings | identityVerificationCenter | Écran propriétaire existant |
| MEMBERSHIP.RUBRIC_PARTICIPATION | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| MEMBER.DIGITAL_NOTEBOOK | FOUNDATION_ACTIVE | operations | twoSheetWorkspace · individual | Écran propriétaire existant |
| MEMBERSHIP.ANTI_ENUMERATION | FOUNDATION_ACTIVE | services | — | Dossier préparatoire conservé |
| CORE.ASSOCIATIONS | FOUNDATION_ACTIVE | launch | — | Écran propriétaire existant |
| CORE.ROTATING_TONTINE | FOUNDATION_ACTIVE | launch | — | Écran propriétaire existant |
| CORE.IN_KIND_TONTINE | FOUNDATION_ACTIVE | launch | — | Écran propriétaire existant |
| CORE.HYBRID_GROUP | FOUNDATION_ACTIVE | launch | — | Écran propriétaire existant |
| GROUP.LAUNCH_STUDIO | FOUNDATION_ACTIVE | launch | — | Écran propriétaire existant |
| GROUP.LAUNCH.SIMULATION | FOUNDATION_ACTIVE | launch | — | Écran propriétaire existant |
| GROUP.MODEL_REGISTRY | FOUNDATION_ACTIVE | settings | groupLearningRegistry | Écran propriétaire existant |
| GROUP.CASE_LAW | FOUNDATION_ACTIVE | settings | groupLearningRegistry | Écran propriétaire existant |
| GROUP.EVOLUTION | FOUNDATION_ACTIVE | services | — | Dossier préparatoire conservé |
| GROUP.ANTICIPATION | FOUNDATION_ACTIVE | dashboard | anticipationCenter | Écran propriétaire existant |
| GROUP.MEETING_AUTOPILOT | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · overview | Écran propriétaire existant |
| GROUP.DOCTOR | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · overview | Écran propriétaire existant |
| CORE.RUBRICS | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.LIVING_RULES | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.WRITTEN_RULE | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.OBSERVED_PRACTICE | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.EFFECTIVE_POLICY | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.EXCEPTIONS | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.STARTER_KITS | FOUNDATION_ACTIVE | launch | savedStarterKitPanel | Écran propriétaire existant |
| RUBRIC.COLLATION | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.LOCAL_AID | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.HAND_RAISE | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.ASSISTANCE | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.SAVINGS | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| RUBRIC.LOANS | FOUNDATION_ACTIVE | operations | rubricsManagementPanel | Écran propriétaire existant |
| MEETING.COMMAND_CENTER | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · overview | Écran propriétaire existant |
| MEETING.ATTENDANCE | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · attendance | Écran propriétaire existant |
| MEETING.MEMBER_MATRIX | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · sheet | Écran propriétaire existant |
| MEETING.PREPAYMENTS | FOUNDATION_ACTIVE | sessions | meetingFinanceGovernanceCenter | Écran propriétaire existant |
| MEETING.BENEFICIARIES | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · beneficiaries | Écran propriétaire existant |
| MEETING.CASHBOX.RECONCILE | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · recap | Écran propriétaire existant |
| MEETING.LATE_POSTING | FOUNDATION_ACTIVE | operations | — | Écran propriétaire existant |
| MEETING.CLOSE_CHECKPOINT | FOUNDATION_ACTIVE | operations | — | Écran propriétaire existant |
| MEETING.REOPEN_AUTH | FOUNDATION_ACTIVE | sessions | meetingFinanceGovernanceCenter | Écran propriétaire existant |
| MEETING.MINUTES | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · recap | Écran propriétaire existant |
| MEETING.ACTIONS | FOUNDATION_ACTIVE | operations | governanceExecutionPanel | Écran propriétaire existant |
| MEETING.CALENDAR | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · overview | Écran propriétaire existant |
| FINANCE.LEDGER | FOUNDATION_ACTIVE | finance | financeLedgerPanel | Écran propriétaire existant |
| LEDGER.CANONICAL | FOUNDATION_ACTIVE | finance | financeLedgerPanel | Écran propriétaire existant |
| FINANCE.CASHBOX | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · recap | Écran propriétaire existant |
| FINANCE.OBLIGATIONS | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · debts | Écran propriétaire existant |
| FINANCE.ARREARS | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · debts | Écran propriétaire existant |
| FINANCE.LOANS | FOUNDATION_ACTIVE | operations | twoSheetWorkspace · meeting | Écran propriétaire existant |
| FINANCE.LOAN_GUARANTORS | FOUNDATION_ACTIVE | finance | loanOfficialConfig | Écran propriétaire existant |
| FINANCE.INTEREST | FOUNDATION_ACTIVE | finance | loanOfficialConfig | Écran propriétaire existant |
| FINANCE.REPAYMENTS | FOUNDATION_ACTIVE | operations | twoSheetWorkspace · meeting | Écran propriétaire existant |
| FINANCE.SAVINGS_YIELD | FOUNDATION_ACTIVE | finance | savingsYieldLab | Écran propriétaire existant |
| FINANCE.SOLIDARITY | FOUNDATION_ACTIVE | finance | assistanceRulebookPanel | Écran propriétaire existant |
| FINANCE.SHORTFALL | FOUNDATION_ACTIVE | sessions | sessionsWorkspace · debts | Écran propriétaire existant |
| FINANCE.FIXED_TARGET | FOUNDATION_ACTIVE | finance | — | Écran propriétaire existant |
| FINANCE.ENVELOPES | FOUNDATION_ACTIVE | dashboard | memberEnvelopeCenter | Écran propriétaire existant |
| FINANCE.PRIOR_BALANCE | FOUNDATION_ACTIVE | recap | recapFinance | Écran propriétaire existant |
| FINANCE.WALLET | FOUNDATION_ACTIVE | dashboard | walletCenter | Écran propriétaire existant |
| FINANCE.TRUST_SCORE | FOUNDATION_ACTIVE | members | trustGraphCenter | Écran propriétaire existant |
| GOVERNANCE.VOTE | FOUNDATION_ACTIVE | operations | governanceExecutionPanel | Écran propriétaire existant |
| GOVERNANCE.MANDATE | FOUNDATION_ACTIVE | services | — | Dossier préparatoire conservé |
| GOVERNANCE.TENDER | FOUNDATION_ACTIVE | ecosystem | socialCommercePanel | Écran propriétaire existant |
| GOVERNANCE.DOCUMENTS | FOUNDATION_ACTIVE | documents | — | Écran propriétaire existant |
| GOVERNANCE.AI_RULE_EXTRACTION | FOUNDATION_ACTIVE | documents | — | Écran propriétaire existant |
| COMMUNITY.FORUM | FOUNDATION_ACTIVE | ecosystem | communityEnginePanel | Écran propriétaire existant |
| COMMUNITY.CHAT | FOUNDATION_ACTIVE | ecosystem | communityEnginePanel | Écran propriétaire existant |
| COMMUNITY.VIDEO | PLANNED_DOMAIN | services | — | Dossier préparatoire conservé |
| COMMUNITY.PRO_HUBS | FOUNDATION_ACTIVE | ecosystem | communityEnginePanel | Écran propriétaire existant |
| COMMUNITY.MICRO_ADS | FOUNDATION_ACTIVE | ecosystem | microAdsCenter | Écran propriétaire existant |
| OPPORTUNITY.GRAPH | FOUNDATION_ACTIVE | ecosystem | opportunityGraphCenter | Écran propriétaire existant |
| OPPORTUNITY.NEED | FOUNDATION_ACTIVE | ecosystem | valueNetworkOperational | Écran propriétaire existant |
| TRUST.GRAPH | FOUNDATION_ACTIVE | members | trustGraphCenter | Écran propriétaire existant |
| MARKETPLACE.CORE | FOUNDATION_ACTIVE | ecosystem | marketEnginePanel | Écran propriétaire existant |
| MARKETPLACE.SUPPLIERS | FOUNDATION_ACTIVE | ecosystem | marketEnginePanel | Écran propriétaire existant |
| MARKETPLACE.SUPPLIER_CREDIT | FOUNDATION_ACTIVE | ecosystem | marketEnginePanel | Écran propriétaire existant |
| MARKETPLACE.GROUP_BUY | FOUNDATION_ACTIVE | ecosystem | marketEnginePanel | Écran propriétaire existant |
| MARKETPLACE.FLASH_OFFERS | FOUNDATION_ACTIVE | ecosystem | socialCommercePanel | Écran propriétaire existant |
| MARKETPLACE.PREDICTIVE_DEMAND | FOUNDATION_ACTIVE | ecosystem | socialCommercePanel | Écran propriétaire existant |
| MARKETPLACE.REVERSE_MARKET | FOUNDATION_ACTIVE | ecosystem | socialCommercePanel | Écran propriétaire existant |
| MARKETPLACE.ECO_DEALS | FOUNDATION_ACTIVE | ecosystem | socialCommercePanel | Écran propriétaire existant |
| MARKETPLACE.LIVE_MARKET | FOUNDATION_ACTIVE | ecosystem | socialCommercePanel | Écran propriétaire existant |
| MARKETPLACE.DEMAND_EXCHANGE | FOUNDATION_ACTIVE | ecosystem | valueNetworkOperational | Écran propriétaire existant |
| MARKETPLACE.PROCUREMENT | FOUNDATION_ACTIVE | ecosystem | marketEnginePanel | Écran propriétaire existant |
| MARKETPLACE.ECO_NOW | FOUNDATION_ACTIVE | ecosystem | valueNetworkOperational | Écran propriétaire existant |
| MARKETPLACE.HARVEST_LOCAL | FOUNDATION_ACTIVE | ecosystem | valueNetworkOperational | Écran propriétaire existant |
| MARKETPLACE.FRESH_DROP | FOUNDATION_ACTIVE | ecosystem | valueNetworkOperational | Écran propriétaire existant |
| MARKETPLACE.PICKUP_NETWORK | FOUNDATION_ACTIVE | ecosystem | valueNetworkOperational | Écran propriétaire existant |
| MARKETPLACE.MARKET_INTELLIGENCE | FOUNDATION_ACTIVE | ecosystem | opportunityIntelligence | Écran propriétaire existant |
| MARKETPLACE.REWARDS | PLANNED_DOMAIN | services | — | Dossier préparatoire conservé |
| MANAGER.BUSINESS_STUDIO | FOUNDATION_ACTIVE | ecosystem | businessStudioOperational | Écran propriétaire existant |
| MANAGER.BUSINESS_AGENT | FOUNDATION_ACTIVE | ecosystem | businessStudioOperational | Écran propriétaire existant |
| MANAGER.VALUE_DISCOVERY | FOUNDATION_ACTIVE | ecosystem | valueDiscoveryCenter | Écran propriétaire existant |
| CREATOR.STUDIO | FOUNDATION_ACTIVE | ecosystem | creatorTalentCenter | Écran propriétaire existant |
| MANAGER.PUBLIC_PROFILE | FOUNDATION_ACTIVE | discovery | managerPublicProfileCenter | Écran propriétaire existant |
| GROWTH.REFERRAL | FOUNDATION_ACTIVE | ecosystem | referralOperational | Écran propriétaire existant |
| PARTNERS.DIRECTORY | FOUNDATION_ACTIVE | ecosystem | externalProgramsPanel | Écran propriétaire existant |
| ADS.MANAGER | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| ADS.CAMPAIGNS | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| ADS.CREATIVES | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| ADS.PLACEMENTS | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| ADS.TARGETING | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| ADS.FREQUENCY_CAP | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| ADS.ANALYTICS | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| ADS.MODERATION | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| ADS.BILLING_SANDBOX | FOUNDATION_ACTIVE | ecosystem | adManagerPanel | Écran propriétaire existant |
| LEARNING.MANAGER_ACADEMY | FOUNDATION_ACTIVE | ecosystem | productiveCommunityCenter | Écran propriétaire existant |
| LEARNING.TALENT | FOUNDATION_ACTIVE | ecosystem | creatorTalentCenter | Écran propriétaire existant |
| LEARNING.NGO | FOUNDATION_ACTIVE | ecosystem | externalProgramsPanel | Écran propriétaire existant |
| LEARNING.KNOWLEDGE_BANK | FOUNDATION_ACTIVE | ecosystem | knowledgeOperational | Écran propriétaire existant |
| AI.ASSISTANT | FOUNDATION_ACTIVE | assistant | — | Écran propriétaire existant |
| AI.FOUNDER | FOUNDATION_ACTIVE | control | founderAICenter | Écran propriétaire existant |
| AI.LOCAL | FOUNDATION_ACTIVE | assistant | localAssistantCenter | Écran propriétaire existant |
| SAFETY.ANTISCAM | FOUNDATION_ACTIVE | ecosystem | financialLabPanel | Écran propriétaire existant |
| SAFETY.QUIET_WATCH | FOUNDATION_ACTIVE | dashboard | quietWatchCenter | Écran propriétaire existant |
| GOVERNANCE.DOCUMENT_STUDIO | FOUNDATION_ACTIVE | documents | — | Écran propriétaire existant |
| PAPER.BRIDGE | FOUNDATION_ACTIVE | documents | — | Écran propriétaire existant |
| PAPER.IMPORT | FOUNDATION_ACTIVE | documents | — | Écran propriétaire existant |
| PAPER.PRINT | FOUNDATION_ACTIVE | documents | paperPrintCenter | Écran propriétaire existant |
| REPORTING.EXPORTS | FOUNDATION_ACTIVE | documents | paperPrintCenter | Écran propriétaire existant |
| DASHBOARDS.ALL | FOUNDATION_ACTIVE | dashboard | roleDashboardsCenter | Écran propriétaire existant |
| SEARCH.UNIVERSAL | FOUNDATION_ACTIVE | ecosystem | universalSearchPanel | Écran propriétaire existant |
| CALENDAR.UNIFIED | FOUNDATION_ACTIVE | ecosystem | unifiedCalendarPanel | Écran propriétaire existant |
| NOTIFY.MULTICHANNEL | FOUNDATION_ACTIVE | inbox | — | Écran propriétaire existant |
| INTEGRATION.MOBILE_MONEY | PLANNED_DOMAIN | services | — | Dossier préparatoire conservé |
| INTEGRATION.SMS | STRUCTURAL_V1 | services | — | Dossier préparatoire conservé |
| SHARE.WHATSAPP.HANDOFF | FOUNDATION_ACTIVE | ecosystem | referralOperational | Écran propriétaire existant |
| INTEGRATION.WHATSAPP | STRUCTURAL_V1 | services | — | Dossier préparatoire conservé |
| INTEGRATION.TELEGRAM | STRUCTURAL_V1 | services | — | Dossier préparatoire conservé |
| INTEGRATION.EMAIL | STRUCTURAL_V1 | services | — | Dossier préparatoire conservé |
| GEO.DIRECTORY | FOUNDATION_ACTIVE | discovery | geoDirectoryCenter | Écran propriétaire existant |
| OFFLINE.OUTBOX | FOUNDATION_ACTIVE | inbox | — | Écran propriétaire existant |
| RELAY.COMMUNITY | FOUNDATION_ACTIVE | relay | ecoRelayPanel | Écran propriétaire existant |
| EXPERIENCE.ULTRA_SIMPLE | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| EXPERIENCE.ORAL | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| EXPERIENCE.UNIVERSAL_INBOX | FOUNDATION_ACTIVE | inbox | — | Écran propriétaire existant |
| SUPPORT.CENTER | FOUNDATION_ACTIVE | inbox | — | Écran propriétaire existant |
| TRUST.VERIFICATION | FOUNDATION_ACTIVE | settings | verificationAssertionsPanel | Écran propriétaire existant |
| DATA.QUALITY | FOUNDATION_ACTIVE | settings | dataQualityCenter | Écran propriétaire existant |
| DATA.TIME_MACHINE | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| SECURITY.AUTH | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| SECURITY.MFA | PLANNED_DOMAIN | services | — | Dossier préparatoire conservé |
| SECURITY.MULTITENANT | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| SECURITY.AUDIT | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| BACKUP.BIR_PLUS | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| BACKUP.D1_RESTORE | FOUNDATION_ACTIVE | services | — | Dossier préparatoire conservé |
| OBSERVABILITY.HEALTH | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| COMPATIBILITY.LEGACY | FOUNDATION_ACTIVE | settings | — | Écran propriétaire existant |
| SUCCESSION.NEXT_OF_KIN | FOUNDATION_ACTIVE | settings | operationalRegistryCenter | Écran propriétaire existant |
| FEDERATION.GROUP_NETWORK | PLANNED_DOMAIN | services | — | Dossier préparatoire conservé |

## Limites de la preuve

La qualification automatique du commit exact, la sauvegarde D1 et la vérification du déploiement sont attestées séparément dans le reçu de livraison. Aucune acceptation sur appareil physique ou groupe réel n’est déduite de cet inventaire. FIELD_ACCEPTED=NOT_ACCEPTED ; realMoneyEnabled=false. Les intégrations externes et la synchronisation distante demandent une connexion.
