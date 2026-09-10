export type ModuleStatus = 'FOUNDATION_ACTIVE' | 'STRUCTURAL_V1' | 'PLANNED_DOMAIN' | 'LATER_OPTIONAL';
export interface ProductModule { id:string; labelFr:string; labelEn:string; status:ModuleStatus; canonicalDependencies:string[]; }

export const PRODUCT_MODULES: ProductModule[] = [
  {id:'CORE.IDENTITY',labelFr:'Identité, profils et multi-groupes',labelEn:'Identity, profiles & multi-group access',status:'STRUCTURAL_V1',canonicalDependencies:['KERNEL.CONTEXT','KERNEL.POLICY']},
  {id:'CORE.ASSOCIATIONS',labelFr:'Associations à accumulation',labelEn:'Savings / accumulation associations',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.WORKFLOW','LEDGER.CANONICAL']},
  {id:'CORE.ROTATING_TONTINE',labelFr:'Tontines rotatives',labelEn:'Rotating tontines',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.WORKFLOW','LEDGER.CANONICAL']},
  {id:'CORE.RUBRICS',labelFr:'Rubriques configurables',labelEn:'Configurable funds & contribution categories',status:'STRUCTURAL_V1',canonicalDependencies:['KERNEL.CONFIGURATION']},
  {id:'FINANCE.LEDGER',labelFr:'Ledger et vérité financière',labelEn:'Canonical ledger & financial source of truth',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.AUDIT','KERNEL.RECONCILIATION']},
  {id:'FINANCE.CASHBOX',labelFr:'Caisse physique',labelEn:'Physical cashbox',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.RECONCILIATION','KERNEL.EVIDENCE']},
  {id:'FINANCE.LOANS',labelFr:'Prêts internes',labelEn:'Internal loans',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.WORKFLOW','KERNEL.OBLIGATIONS','LEDGER.CANONICAL']},
  {id:'FINANCE.ARREARS',labelFr:'Impayés et régularisation',labelEn:'Arrears & payment recovery',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.OBLIGATIONS','KERNEL.POLICY']},
  {id:'FINANCE.TRUST_SCORE',labelFr:'Score de confiance explicable',labelEn:'Explainable trust score',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.EVIDENCE']},
  {id:'FINANCE.WALLET',labelFr:'Wallet interne multi-rubriques',labelEn:'Internal multi-category wallet',status:'PLANNED_DOMAIN',canonicalDependencies:['LEDGER.CANONICAL']},
  {id:'SOLIDARITY.EXPRESS',labelFr:'Solidarité Express',labelEn:'Rapid solidarity assistance',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.CASES','KERNEL.OBLIGATIONS','LEDGER.CANONICAL']},
  {id:'GOVERNANCE.VOTE',labelFr:'Votes, décisions et quorum',labelEn:'Voting, decisions & quorum',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.WORKFLOW','KERNEL.EVIDENCE']},
  {id:'GOVERNANCE.MANDATE',labelFr:'Mandats, délégations et pouvoirs',labelEn:'Mandates, delegation & delegated authority',status:'STRUCTURAL_V1',canonicalDependencies:['KERNEL.CONTEXT','KERNEL.POLICY']},
  {id:'GOVERNANCE.TENDER',labelFr:'Appels d’offres et candidatures',labelEn:'Tenders & applications',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.WORKFLOW','KERNEL.CASES']},
  {id:'COMMUNITY.FORUM',labelFr:'Forum public/privé orienté solutions',labelEn:'Solution-oriented public/private forum',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.CASES','KERNEL.NOTIFICATIONS']},
  {id:'COMMUNITY.CHAT',labelFr:'Chat et communication',labelEn:'Chat & communication',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.NOTIFICATIONS']},
  {id:'COMMUNITY.MICRO_ADS',labelFr:'Micro-annonces communautaires',labelEn:'Community micro-listings',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.CASES']},
  {id:'MARKETPLACE.CORE',labelFr:'Marketplace',labelEn:'Marketplace',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.WORKFLOW','KERNEL.CASES']},
  {id:'MARKETPLACE.SUPPLIERS',labelFr:'Fournisseurs et sourcing',labelEn:'Suppliers & sourcing',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.EVIDENCE','KERNEL.CASES']},
  {id:'MARKETPLACE.SUPPLIER_CREDIT',labelFr:'Crédit commercial fournisseur',labelEn:'Supplier trade credit',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.WORKFLOW','KERNEL.OBLIGATIONS','LEDGER.CANONICAL']},
  {id:'MARKETPLACE.REWARDS',labelFr:'Cashback, points et fidélité',labelEn:'Cashback, points & loyalty',status:'PLANNED_DOMAIN',canonicalDependencies:['LEDGER.CANONICAL','KERNEL.POLICY']},
  {id:'MANAGER.BUSINESS_STUDIO',labelFr:'Cockpit privé de rentabilité',labelEn:'Private profitability cockpit',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.RECONCILIATION','KERNEL.EVIDENCE']},
  {id:'MANAGER.PUBLIC_PROFILE',labelFr:'Profil public et réputation gestionnaire',labelEn:'Manager public profile & reputation',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.EVIDENCE','KERNEL.CASES']},
  {id:'GROWTH.REFERRAL',labelFr:'Bouche-à-oreille et parrainage rémunéré',labelEn:'Word-of-mouth, referrals & rewarded advocacy',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.EVIDENCE']},
  {id:'GROUP.LAUNCH_STUDIO',labelFr:'Studio de création et faisabilité',labelEn:'Group launch & feasibility studio',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.CONFIGURATION','SIMULATION.CORE']},
  {id:'GROUP.MODEL_REGISTRY',labelFr:'Registre des modèles',labelEn:'Group model registry',status:'STRUCTURAL_V1',canonicalDependencies:['KERNEL.CONFIGURATION']},
  {id:'GROUP.CASE_LAW',labelFr:'Jurisprudence métier',labelEn:'Operational practice case-law registry',status:'STRUCTURAL_V1',canonicalDependencies:['KERNEL.EVIDENCE','KERNEL.CONFIGURATION']},
  {id:'SIMULATION.CORE',labelFr:'Moteur universel de simulation',labelEn:'Universal simulation engine',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.CONFIGURATION']},
  {id:'LEARNING.MANAGER_ACADEMY',labelFr:'Manager Academy',labelEn:'Manager Academy',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.NOTIFICATIONS','KERNEL.EVIDENCE']},
  {id:'LEARNING.NGO',labelFr:'ONG, animateurs et mesure d’impact',labelEn:'NGOs, facilitators & impact',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.DATA_GOVERNANCE','KERNEL.POLICY']},
  {id:'AI.ASSISTANT',labelFr:'Assistant IA hybride/local',labelEn:'Hybrid/local AI assistant',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.RESOURCE_GOVERNOR']},
  {id:'SAFETY.ANTISCAM',labelFr:'Centre anti-arnaque et crypto',labelEn:'Anti-scam & crypto safety center',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.CASES','KERNEL.EVIDENCE','KERNEL.NOTIFICATIONS']},
  {id:'OFFLINE.OUTBOX',labelFr:'Offline et file d’attente intelligente',labelEn:'Offline & intelligent outbox',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.EVENT_BACKBONE']},
  {id:'RELAY.COMMUNITY',labelFr:'Meeting Sync / Community Relay',labelEn:'Meeting Sync / Community Relay',status:'FOUNDATION_ACTIVE',canonicalDependencies:['OFFLINE.OUTBOX','KERNEL.COMPATIBILITY']},
  {id:'MEETING.COMMAND_CENTER',labelFr:'Cockpit de réunion',labelEn:'Meeting Command Center',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.OBLIGATIONS','FINANCE.CASHBOX','RELAY.COMMUNITY']},
  {id:'EXPERIENCE.ULTRA_SIMPLE',labelFr:'Mode Ultra Simple',labelEn:'Ultra Simple Mode',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.CONTEXT']},
  {id:'EXPERIENCE.ORAL',labelFr:'Mode Oral / guidé',labelEn:'Voice/guided mode',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.COMPATIBILITY','KERNEL.RESOURCE_GOVERNOR']},
  {id:'EXPERIENCE.UNIVERSAL_INBOX',labelFr:'Boîte de travail universelle',labelEn:'Universal task inbox',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.OBLIGATIONS','KERNEL.CASES']},
  {id:'SUPPORT.CENTER',labelFr:'Support, litiges et recours',labelEn:'Support, disputes & appeals',status:'FOUNDATION_ACTIVE',canonicalDependencies:['KERNEL.CASES']},
  {id:'TRUST.VERIFICATION',labelFr:'Centre de vérification et preuves',labelEn:'Verification & evidence center',status:'STRUCTURAL_V1',canonicalDependencies:['KERNEL.EVIDENCE','KERNEL.DATA_GOVERNANCE']},
  {id:'DATA.QUALITY',labelFr:'Qualité des données et imports',labelEn:'Data quality & imports',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.RECONCILIATION','KERNEL.EVIDENCE']},
  {id:'DATA.TIME_MACHINE',labelFr:'Historique / Time Machine',labelEn:'Historical state / Time Machine',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.AUDIT','LEDGER.CANONICAL']},
  {id:'REPORTING.EXPORTS',labelFr:'PDF, Excel, Word, CSV, JSON',labelEn:'PDF, Excel, Word, CSV, JSON',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY','KERNEL.DOCUMENTS']},
  {id:'GEO.DIRECTORY',labelFr:'Annuaire et géolocalisation',labelEn:'Directory & geolocation',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.DATA_GOVERNANCE','KERNEL.COMPATIBILITY']},
  {id:'NOTIFY.MULTICHANNEL',labelFr:'Notifications multicanales',labelEn:'Multichannel notifications',status:'STRUCTURAL_V1',canonicalDependencies:['KERNEL.NOTIFICATIONS']},
  {id:'DASHBOARDS.ALL',labelFr:'Dashboards par profil',labelEn:'Role-based dashboards',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.POLICY']},
  {id:'FEDERATION.GROUP_NETWORK',labelFr:'Fédérations / réseaux de groupes',labelEn:'Federations / group networks',status:'LATER_OPTIONAL',canonicalDependencies:['KERNEL.POLICY','GOVERNANCE.MANDATE']},
  {id:'SUCCESSION.NEXT_OF_KIN',labelFr:'Succession et ayants droit',labelEn:'Succession & next of kin',status:'PLANNED_DOMAIN',canonicalDependencies:['KERNEL.EVIDENCE','KERNEL.CASES','KERNEL.DATA_GOVERNANCE']},
  {id:'COMPATIBILITY.LEGACY',labelFr:'Compatibilité téléphones anciens',labelEn:'Legacy-device compatibility',status:'STRUCTURAL_V1',canonicalDependencies:['KERNEL.COMPATIBILITY','KERNEL.RESOURCE_GOVERNOR']}
];


export interface ServiceCapabilityCard {
  serviceId:string; responsibility:string; owns:string[]; dependsOn:string[]; forbidden:string[]; failurePolicy:'FAIL_CLOSED'|'DEGRADE'|'QUEUE';
}
export const SERVICE_CAPABILITY_DIRECTORY: ServiceCapabilityCard[] = [
 {serviceId:'PLATFORM.KERNEL',responsibility:'Shared cross-domain infrastructure',owns:['KERNEL.POLICY','KERNEL.WORKFLOW','KERNEL.AUDIT'],dependsOn:[],forbidden:['BUSINESS_LEDGER'],failurePolicy:'FAIL_CLOSED'},
 {serviceId:'FOUNDATION.DOMAIN',responsibility:'Core group/member domain',owns:['GROUP.CORE','MEMBERSHIP.CORE'],dependsOn:['PLATFORM.KERNEL'],forbidden:['D1.ADAPTER'],failurePolicy:'FAIL_CLOSED'},
 {serviceId:'DISCOVERY.MEMBERSHIP',responsibility:'Discovery, applications and invitations',owns:['DISCOVERY.SEARCH','MEMBERSHIP.GATEWAY'],dependsOn:['FOUNDATION.DOMAIN','PLATFORM.KERNEL'],forbidden:['LEDGER.POSTING'],failurePolicy:'DEGRADE'},
 {serviceId:'RUBRIC.KNOWLEDGE',responsibility:'Rubric taxonomy and configuration semantics',owns:['RUBRIC.TAXONOMY'],dependsOn:['PLATFORM.KERNEL'],forbidden:['LEDGER.POSTING'],failurePolicy:'DEGRADE'},
 {serviceId:'TRUST.CONTEXTUAL',responsibility:'Contextual reliability evidence',owns:['TRUST.CONTEXTUAL'],dependsOn:['PLATFORM.KERNEL'],forbidden:['MEMBERSHIP.AUTO_REJECT'],failurePolicy:'DEGRADE'},
 {serviceId:'OFFLINE.OUTBOX',responsibility:'Durable local intentions',owns:['OFFLINE.OUTBOX'],dependsOn:['PLATFORM.KERNEL'],forbidden:['REMOTE.FINALITY'],failurePolicy:'QUEUE'},
 {serviceId:'RELAY.TRANSPORT',responsibility:'Constrained continuity transport',owns:['RELAY.TRANSPORT'],dependsOn:['OFFLINE.OUTBOX'],forbidden:['LEDGER.POSTING'],failurePolicy:'DEGRADE'},
 {serviceId:'PLATFORM.REPOSITORY',responsibility:'Persistence port/adapters',owns:['PERSISTENCE.PORT'],dependsOn:[],forbidden:['BUSINESS_POLICY'],failurePolicy:'FAIL_CLOSED'},
 {serviceId:'FOUNDATION.APPLICATION',responsibility:'Application orchestration',owns:['APPLICATION.ORCHESTRATION'],dependsOn:['FOUNDATION.DOMAIN','PLATFORM.REPOSITORY'],forbidden:['DUPLICATE_BUSINESS_RULES'],failurePolicy:'FAIL_CLOSED'},
 {serviceId:'MODULE.REGISTRY',responsibility:'Capability inventory and ownership map',owns:['CAPABILITY.DIRECTORY'],dependsOn:[],forbidden:['BUSINESS_MUTATION'],failurePolicy:'DEGRADE'},
 {serviceId:'API.WORKER',responsibility:'HTTP boundary and environment wiring',owns:['HTTP.API'],dependsOn:['FOUNDATION.APPLICATION'],forbidden:['PARALLEL_DOMAIN_LOGIC'],failurePolicy:'FAIL_CLOSED'}
];
export function validateServiceCapabilityDirectory(cards=SERVICE_CAPABILITY_DIRECTORY){
 const ids=new Set(cards.map(c=>c.serviceId)); if(ids.size!==cards.length) throw new Error('duplicate serviceId');
 const owners=new Map<string,string>(); for(const c of cards){ for(const d of c.dependsOn) if(!ids.has(d)) throw new Error(`unknown dependency ${d}`); for(const cap of c.owns){ if(owners.has(cap)) throw new Error(`capability collision ${cap}`); owners.set(cap,c.serviceId); } } return true;
}

export * from './service-capabilities.js';
