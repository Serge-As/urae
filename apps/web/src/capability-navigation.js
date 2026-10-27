// Presentation handoffs only. The destination keeps its existing rights,
// rendering, financial editor and canonical business service.
const route=(view,anchor,options={})=>({view,...(anchor?{anchor}:{}),...options});
const destinations=new Map();
const add=(ids,view,anchor,options)=>{for(const id of ids.split(' '))destinations.set(id,route(view,anchor,options));};

add('CORE.IDENTITY CORE.IDENTITY.PROJECTIONS CORE.IDENTITY.CLAIM CORE.IDENTITY.MULTIGROUP','dashboard','personalCockpitPanel');
add('DISCOVERY.PROXIMITY GEO.DIRECTORY','discovery','geoDirectoryCenter');
add('MEMBERSHIP.RECONCILIATION','settings','identityVerificationCenter');
add('CORE.ASSOCIATIONS CORE.ROTATING_TONTINE CORE.IN_KIND_TONTINE CORE.HYBRID_GROUP GROUP.LAUNCH_STUDIO GROUP.LAUNCH.SIMULATION','launch');
add('MEMBERSHIP.RUBRIC_PARTICIPATION CORE.RUBRICS RUBRIC.LIVING_RULES RUBRIC.WRITTEN_RULE RUBRIC.OBSERVED_PRACTICE RUBRIC.EFFECTIVE_POLICY RUBRIC.EXCEPTIONS RUBRIC.COLLATION RUBRIC.ASSISTANCE RUBRIC.SAVINGS RUBRIC.LOANS','operations','rubricsManagementPanel');
add('MEMBER.DIGITAL_NOTEBOOK','operations','twoSheetWorkspace',{sheetMode:'individual'});
add('MEETING.COMMAND_CENTER MEETING.CALENDAR GROUP.MEETING_AUTOPILOT GROUP.DOCTOR','sessions','sessionsWorkspace',{sessionTab:'overview'});
add('MEETING.ATTENDANCE','sessions','sessionsWorkspace',{sessionTab:'attendance'});
add('MEETING.MEMBER_MATRIX','sessions','sessionsWorkspace',{sessionTab:'sheet'});
add('MEETING.BENEFICIARIES','sessions','sessionsWorkspace',{sessionTab:'beneficiaries'});
add('MEETING.CASHBOX.RECONCILE MEETING.MINUTES','sessions','sessionsWorkspace',{sessionTab:'recap'});
add('MEETING.ACTIONS','operations','governanceExecutionPanel');
add('FINANCE.LEDGER LEDGER.CANONICAL','finance','financeLedgerPanel');
add('FINANCE.CASHBOX','sessions','sessionsWorkspace',{sessionTab:'recap'});
add('FINANCE.OBLIGATIONS FINANCE.ARREARS FINANCE.SHORTFALL','sessions','sessionsWorkspace',{sessionTab:'debts'});
// Both ordinary loan and repayment entry still use the same canonical sheets.
add('FINANCE.LOANS FINANCE.REPAYMENTS','operations','twoSheetWorkspace',{sheetMode:'meeting'});
add('FINANCE.INTEREST FINANCE.LOAN_GUARANTORS','finance','loanOfficialConfig',{openTarget:'loanCompletionPanel'});
add('FINANCE.SAVINGS_YIELD','finance','savingsYieldLab');
add('FINANCE.SOLIDARITY','finance','assistanceRulebookPanel');
add('FINANCE.PRIOR_BALANCE','recap','recapFinance');
add('GOVERNANCE.DOCUMENTS GOVERNANCE.AI_RULE_EXTRACTION PAPER.IMPORT','documents');
add('COMMUNITY.CHAT','ecosystem','communityEnginePanel');
add('TRUST.GRAPH','members','trustGraphCenter');
add('MARKETPLACE.SUPPLIERS MARKETPLACE.SUPPLIER_CREDIT MARKETPLACE.PROCUREMENT','ecosystem','marketEnginePanel');
add('MARKETPLACE.FLASH_OFFERS MARKETPLACE.PREDICTIVE_DEMAND MARKETPLACE.REVERSE_MARKET MARKETPLACE.ECO_DEALS MARKETPLACE.LIVE_MARKET','ecosystem','socialCommercePanel');
add('MARKETPLACE.DEMAND_EXCHANGE MARKETPLACE.ECO_NOW MARKETPLACE.HARVEST_LOCAL MARKETPLACE.FRESH_DROP MARKETPLACE.PICKUP_NETWORK','ecosystem','valueNetworkOperational');
add('ADS.CAMPAIGNS ADS.CREATIVES ADS.PLACEMENTS ADS.TARGETING ADS.FREQUENCY_CAP ADS.ANALYTICS ADS.MODERATION ADS.BILLING_SANDBOX','ecosystem','adManagerPanel');
add('PARTNERS.DIRECTORY LEARNING.NGO','ecosystem','externalProgramsPanel');
add('LEARNING.KNOWLEDGE_BANK','ecosystem','knowledgeOperational');
add('GROWTH.REFERRAL SHARE.WHATSAPP.HANDOFF','ecosystem','referralOperational');
add('MANAGER.BUSINESS_AGENT','ecosystem','businessStudioOperational');
add('AI.ASSISTANT','assistant');
add('SAFETY.ANTISCAM','ecosystem','financialLabPanel');
add('PAPER.PRINT REPORTING.EXPORTS','documents','paperPrintCenter');
add('OFFLINE.OUTBOX EXPERIENCE.UNIVERSAL_INBOX NOTIFY.MULTICHANNEL','inbox');
add('RELAY.COMMUNITY','relay','ecoRelayPanel');
add('EXPERIENCE.ULTRA_SIMPLE EXPERIENCE.ORAL COMPATIBILITY.LEGACY SECURITY.AUTH SECURITY.MULTITENANT','settings');

const presets={
  'MARKETPLACE.ECO_NOW':'NOW',
  'MARKETPLACE.HARVEST_LOCAL':'HARVEST',
  'MARKETPLACE.FRESH_DROP':'FRESH_DROP',
  'MARKETPLACE.PICKUP_NETWORK':'PICKUP'
};
export function canonicalCapabilityDestination(id){
  const destination=destinations.get(id);
  return destination?{...destination,...(presets[id]?{preset:presets[id]}:{})}:null;
}
