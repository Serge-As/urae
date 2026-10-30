import {mountRecoveryWorkspace} from './recovery-workspace.js';
import {readTablePreferences,selectTableMembers,tablePreferenceControls} from './table-preferences.js';
import {financialNumberButton} from './financial-number-ui.js';
import {contextLink} from './context-link.js';
import {deferredMount} from './deferred-ui.js';
const bootStage=stage=>window.dispatchEvent(new CustomEvent('eco:boot-stage',{detail:{stage}}));
bootStage('CORE_LOADED');
const mountTemporalCommerceUI=deferredMount(async()=>{await coreEconomicLearningUI.whenMounted();return import('./temporal-commerce-ui.js');},'mountTemporalCommerceUI','Eco-System');
const mountFinancialExplanationsUI=deferredMount(()=>import('./financial-explanations-ui.js'),'mountFinancialExplanationsUI','Eco-System');
import {mountNotificationCenterUI} from './notification-center-ui.js';
import {mountEcoCareUI} from './eco-care-ui.js';
import {createJourneyContext,mountJourneyUI} from './journey-context.js';
import {mountWorkspaceNavigation} from './workspace-navigation.js';
import {mountShellNavigation} from './shell-navigation.js';
import {canonicalCapabilityDestination} from './capability-navigation.js';
import {mountRequestBudgetUI} from './request-budget-ui.js';
import {createCellDictationButton,speech} from './voice-entry-ui.js';
import {createFinancialWorkUI} from './financial-work-ui.js';
import {createRubricEditor,readRubricEditors,describeRubricPlan,editRubricPlan} from './launch-rubrics.js';
import {mountLaunchStudio} from './launch-studio.js';
import {renderMemberFinancialNotices} from './member-control-ui.js';
// UI recovered from the public Cahier App 1.1 on 2026-09-12, then hardened locally.
// Dynamic text is escaped before use in fixed HTML templates.
const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=(strings,...values)=>strings.reduce((out,s,i)=>out+s+(i<values.length?escapeText(values[i]):''),'');
if(typeof structuredClone!=='function'){
    // JSON-safe fallback for the local projections used by Eco-System on older Chrome/WebView.
    // Blobs/Files are never passed through this compatibility clone.
    window.structuredClone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
}
import { ConnectedApplication } from '../../../packages/application/src/index.js';
import { captureRuntimeI18n, applyRuntimeLocale, installRuntimeI18nObserver, localeTag, runtimeTranslate } from './runtime-i18n.js';
import { mountCompletionUI } from './completion-ui.js';
import { mountAdvancedUI } from './advanced-ui.js';
import { mountIdentityLiveUI } from './identity-live-ui.js';
const mountCommunityShopUI=deferredMount(()=>import('./community-shop-ui.js'),'mountCommunityShopUI','Eco-System');
import {mountPersonalShopsUI} from './personal-shops-ui.js';
const mountMiscRubricUI=deferredMount(()=>import('./misc-rubrics-ui.js'),'mountMiscRubricUI','Eco-System');
const mountPairingUI=deferredMount(()=>import('./pairing-ui.js'),'mountPairingUI','Eco-System');
import { mountDetailUI } from './detail-ui.js';
import { mountPersonalCockpitUI } from './personal-cockpit-ui.js';
import { mountRecapUI } from './recap-ui.js';
import { mountInterestCommunityUI } from './interest-community-ui.js';
const mountAdManagerUI=deferredMount(()=>import('./ad-manager-ui.js'),'mountAdManagerUI','Eco-System');
const mountVisualMediaStudio=deferredMount(()=>import('./visual-media-studio.js'),'mountVisualMediaStudio','Eco-System');
const mountPartnerAdsUI=deferredMount(()=>import('./partner-ad-ui.js'),'mountPartnerAdsUI','Eco-System');
const mountAdSurfacesUI=deferredMount(()=>import('./ad-surfaces-ui.js'),'mountAdSurfacesUI','Eco-System');
const mountVisualMediaPresenter=deferredMount(()=>import('./visual-media-presenter.js'),'mountVisualMediaPresenter','Eco-System');
import { mountTontineManagerUI } from './tontine-manager-ui.js';
import { mountSavingsYieldUI } from './savings-yield-ui.js';
const mountExternalProgramsUI=deferredMount(()=>import('./external-programs-ui.js'),'mountExternalProgramsUI','Eco-System');
const mountFounderControlUI=deferredMount(()=>import('./founder-control-ui.js'),'mountFounderControlUI','Eco-System');
const mountAssistanceRulebookUI=deferredMount(()=>import('./assistance-rulebook-ui.js'),'mountAssistanceRulebookUI','Eco-System');
import { mountGroupHomeUI } from './group-home-ui.js';
import { mountSessionsUI } from './sessions-ui.js';
import { splitFinancialRubrics, planFinancialRubricLayout } from './smart-grid-view.js';
const mountBlueprintExecutableUI=deferredMount(()=>import('./blueprint-executable-ui.js'),'mountBlueprintExecutableUI','Eco-System');
import { mountCommunityBlueprintPresets } from './community-blueprint-presets.js';
const mountFinancialLabUI=deferredMount(()=>import('./financial-lab-ui.js'),'mountFinancialLabUI','Eco-System');
import { mountSafetyReviewUI } from './safety-review-ui.js';
const mountBusinessStudioUI=deferredMount(()=>import('./business-studio-ui.js'),'mountBusinessStudioUI','Eco-System');
const mountEconomicExperimentsUI=deferredMount(async()=>{await Promise.all([businessStudioUI.whenMounted(),coreEconomicLearningUI.whenMounted()]);return import('./economic-experiments-ui.js');},'mountEconomicExperimentsUI','Eco-System');
const mountResourceAssembliesUI=deferredMount(async()=>{await businessStudioUI.whenMounted();return import('./resource-assemblies-ui.js');},'mountResourceAssembliesUI','Eco-System');
const mountCoreEconomicLearningUI=deferredMount(()=>import('./core-economic-learning-ui.js'),'mountCoreEconomicLearningUI','Eco-System');
const mountResilienceUI=deferredMount(()=>import('./resilience-ui.js'),'mountResilienceUI','Eco-System');
import { parseEcoShareIntent } from './share-out.js';
import { localUniversalSearch, remoteUniversalSearch, authorizedSearchContext } from './universal-search.js';
import { buildUnifiedCalendar } from './unified-calendar.js';
const mountDocumentsUI=deferredMount(()=>import('./documents-ui.js'),'mountDocumentsUI','Documents');
const mountPrintCenterUI=deferredMount(async()=>{await documentsUI.whenMounted();return import('./print-center.js');},'mountPrintCenterUI','Eco-System');
const mountMemberDossierUI=deferredMount(()=>import('./member-dossier-ui.js'),'mountMemberDossierUI','Documents');
import { mountIdentityVerificationUI } from './identity-verification-ui.js';
import { mountDataQualityUI } from './data-quality-ui.js';
const mountOpportunityIntelligenceUI=deferredMount(()=>import('./opportunity-intelligence-ui.js'),'mountOpportunityIntelligenceUI','Eco-System');
const mountOperationalRegistryUI=deferredMount(()=>import('./operational-registry-ui.js'),'mountOperationalRegistryUI','Eco-System');
const mountGroupLearningRegistryUI=deferredMount(async()=>{await operationalRegistryUI.whenMounted();return import('./group-learning-registry-ui.js');},'mountGroupLearningRegistryUI','Eco-System');
import { mountGeoDirectoryUI } from './role-directory-talent-ui.js';
import { mountRoleDashboardsUI } from './role-dashboards-ui.js';
const mountCreatorTalentUI=deferredMount(()=>import('./creator-talent-ui.js'),'mountCreatorTalentUI','Eco-System');
const mountProductiveCommunityUI=deferredMount(()=>import('./productive-community-ui.js'),'mountProductiveCommunityUI','Eco-System');
import { mountLocalAssistantUI } from './local-assistant.js';
const mountQuietWatchUI=deferredMount(()=>import('./quiet-watch-ui.js'),'mountQuietWatchUI','Eco-System');
const mountFounderAIUI=deferredMount(()=>import('./founder-ai-ui.js'),'mountFounderAIUI','Eco-System');
const mountManagerPublicProfileUI=deferredMount(()=>import('./manager-public-profile-ui.js'),'mountManagerPublicProfileUI','Eco-System');
const mountTrustCenterUI=deferredMount(()=>import('./trust-center.js'),'mountTrustCenterUI','Eco-System');
import { mountGovernedGroupUI } from './governed-group-ui.js';
const mountStarterKitUI=deferredMount(()=>import('./starter-kit-ui.js'),'mountStarterKitUI','Eco-System');
const mountMeetingFinanceGovernanceUI=deferredMount(()=>import('./meeting-finance-governance-ui.js'),'mountMeetingFinanceGovernanceUI','Eco-System');
const mountAnticipationUI=deferredMount(()=>import('./anticipation-ui.js'),'mountAnticipationUI','Eco-System');
const mountMicroAdsUI=deferredMount(()=>import('./micro-ads-ui.js'),'mountMicroAdsUI','Eco-System');
const mountValueDiscoveryUI=deferredMount(async()=>{await businessStudioUI.whenMounted();return import('./value-discovery-ui.js');},'mountValueDiscoveryUI','Eco-System');
const mountWalletUI=deferredMount(()=>import('./wallet-ui.js'),'mountWalletUI','Eco-System');
const mountMemberEnvelopeUI=deferredMount(async()=>{await walletUI.whenMounted();return import('./member-envelope-ui.js');},'mountMemberEnvelopeUI','Eco-System');
import { mountSovereignOfflineUI } from './sovereign-offline-ui.js';
const mountOpportunityGraphUI=deferredMount(async()=>{await opportunityIntelligenceUI.whenMounted();return import('./opportunity-graph-ui.js');},'mountOpportunityGraphUI','Eco-System');
let uiLocale = 'fr';
try { uiLocale = localStorage.getItem('tontine.locale') === 'en' ? 'en' : 'fr'; } catch {}
const tx = (fr,en) => runtimeTranslate(uiLocale,fr,en);
// Make the isolated preview unmistakable. The production title/version and
// financial conflict banners are untouched; this is a visual truth label.
const previewEnvironment=location.hostname==='eco-system-refonte-preview.sergemimf.workers.dev';
const previewBadge=document.getElementById('previewEnvBadge');
if(previewBadge)previewBadge.hidden=!previewEnvironment;
const app = new ConnectedApplication({ locale: uiLocale });
mountRequestBudgetUI({app,tx});
captureRuntimeI18n(document);
applyRuntimeLocale(uiLocale);
installRuntimeI18nObserver(()=>uiLocale);
let groups = [];
let members = [];
let meetings = [];
const dashboardScope=()=>JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]);
let hydratedDashboardScope='';
let rubrics = [];
let receiptPositions = [];
let financialSheetEvents = [];
let financialCellVersions = new Map();
let financialCellMetadata = new Map();
let financialDurableProjections=new Map(),financialSnapshotCellVersions=new Map();
let financialReviewInbox=new Map();
let financialApprovedReviewVersions=new Map();
let financialReviewSnapshotLoaded=false;
// Ephemeral indicators are local projections only. No draft amounts are sent
// over Live or stored on the server, and this map is never a financial authority.
const remoteFinancialDrafts=new Map();
const remoteDraftNames=key=>{
  const actors=remoteFinancialDrafts.get(key);if(!actors)return[];
  for(const [id,row] of actors)if(Number(row.expiresAt)<Date.now()||id===String(app.currentActor?.()??'')){clearTimeout(row.timer);actors.delete(id);}
  if(!actors.size){remoteFinancialDrafts.delete(key);return[];}
  return [...actors.values()].map(row=>String(row.name)).filter(Boolean);
};
let financialPendingTargets = new Map();
let financialPendingSheetEntries = [];
let financialReviewTargets = new Map();
const financialOptimisticValues=new Map();
// Free-tier conservation is event-driven: WebSocket push carries actual changes.
// No D1 polling, no draft heartbeat and no periodic Outbox retry are scheduled.
// Expensive canonical polling stays dormant for a future paid mode.
const FREE_CONSERVATION_MODE=true;
const FINANCIAL_CONFIRMED_STORAGE='eco.financialConfirmedCells.v1';
const financialConfirmedCells=new Map();
let financialStorageScope='';
const financialCellDrafts=new Map();
const FINANCIAL_DRAFT_STORAGE='eco.financialCellDrafts.v2';
// A draft belongs to the editing window and account. Canonical confirmations
// belong to an authorized account/group; neither may overwrite another account.
const financialScopedStorageKey=base=>base+':'+JSON.stringify([String(app.currentActor?.()??''),String(app.activeGroup?.()??'')]);
const ensureFinancialStorageScope=()=>{
  const scope=financialScopedStorageKey('scope');if(scope===financialStorageScope)return;
  financialStorageScope=scope;financialConfirmedCells.clear();financialCellDrafts.clear();financialReviewInbox.clear();financialApprovedReviewVersions.clear();financialReviewSnapshotLoaded=false;
  try{for(const [k,v] of Object.entries(JSON.parse(localStorage.getItem(financialScopedStorageKey(FINANCIAL_CONFIRMED_STORAGE))||'{}')))financialConfirmedCells.set(k,v);}catch{}
  try{for(const [k,v] of Object.entries(JSON.parse(sessionStorage.getItem(financialScopedStorageKey(FINANCIAL_DRAFT_STORAGE))||'{}')))financialCellDrafts.set(k,String(v));}catch{}
  for(const actors of remoteFinancialDrafts.values())for(const row of actors.values())clearTimeout(row.timer);
  remoteFinancialDrafts.clear();
};
const persistFinancialConfirmedCells=()=>{try{
  const now=Date.now(),rows=[...financialConfirmedCells.entries()].filter(([,v])=>v&&now-Number(v.confirmedAt||0)<7*86400000).slice(-500);
  financialConfirmedCells.clear();for(const [k,v] of rows)financialConfirmedCells.set(k,v);
  localStorage.setItem(financialScopedStorageKey(FINANCIAL_CONFIRMED_STORAGE),JSON.stringify(Object.fromEntries(rows)));
}catch{}};
const rememberConfirmedCell=(key,{amount,cellVersion,meetingId,membershipId,rubricId}={})=>{
  ensureFinancialStorageScope();
  if(!Number.isFinite(Number(amount)))return;
  financialConfirmedCells.set(key,{groupId:String(app.activeGroup?.()??''),meetingId:String(meetingId??''),membershipId:String(membershipId??''),rubricId:String(rubricId??''),amount:Number(amount),cellVersion:Number.isFinite(Number(cellVersion))?Number(cellVersion):null,confirmedAt:Date.now()});
  persistFinancialConfirmedCells();
  void Promise.resolve(app.receiveFinancialLiveEvent?.({groupId:app.activeGroup?.(),payload:{meetingId,membershipId,rubricId,newAmount:Math.abs(Number(amount)),cellVersion:Number(cellVersion??0),actorId:app.currentActor?.()}})).catch(error=>console.info('Financial read model persistence deferred',error));
};
const forgetConfirmedCell=key=>{ensureFinancialStorageScope();if(financialConfirmedCells.delete(key))persistFinancialConfirmedCells();};
const persistFinancialCellDrafts=()=>{try{const entries=[...financialCellDrafts.entries()].slice(-120);sessionStorage.setItem(financialScopedStorageKey(FINANCIAL_DRAFT_STORAGE),JSON.stringify(Object.fromEntries(entries)));}catch{}};
const saveFinancialCellDraft=(key,value)=>{ensureFinancialStorageScope();if(value==='')financialCellDrafts.delete(key);else financialCellDrafts.set(key,String(value));persistFinancialCellDrafts();};
const clearFinancialCellDraft=key=>{ensureFinancialStorageScope();financialCellDrafts.delete(key);persistFinancialCellDrafts();};
document.addEventListener('click',event=>{
    const blockedCell=event.target instanceof Element?event.target.closest('.matrix-cell-entry[data-member-review-blocked="1"]'):null;
    if(blockedCell){event.preventDefault();event.stopImmediatePropagation();return;}
    const target=event.target instanceof Element?event.target.closest('.cell-validate'):null;
    if(!target)return;
    event.preventDefault();
    if(target.classList.contains('remote-ack')){event.stopPropagation();target.classList.remove('remote-ack');target.textContent='✓';return;}
    traceFinancialCell?.('CELL_CLICK_CAPTURE',{bound:target.dataset.ecoSubmitBound||'',membershipId:target.closest('.matrix-cell-entry')?.dataset.membershipId||'',rubricId:target.closest('.matrix-cell-entry')?.dataset.rubricId||'',meetingId:target.closest('.matrix-cell-entry')?.dataset.meetingId||''});
    void submitFinancialCellElement(target);
},true);
document.addEventListener('keydown',event=>{
    if(event.isComposing||!(event.target instanceof Element))return;
    if(!(event.key==='Enter'||event.code==='Enter'||event.keyCode===13))return;
    const input=event.target.closest('.cell-target-input');if(!input)return;
    const button=input.closest('.matrix-cell-entry')?.querySelector('.cell-validate');
    if(!button)return;
    event.preventDefault();event.stopPropagation();
    void submitFinancialCellElement(button);
},true);
let matrixMeetingId = '';
let memberSortMode = 'number';
const MANAGER_ROLE_IDS=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const isManager = () => {
  const g=groups.find(g=>g.id===app.activeGroup()),actor=app.currentActor(),self=members.find(m=>m.userId===actor&&m.status!=='left');
  return Boolean(g&&(g.createdBy===actor||(g.viewerRoles??[]).some(r=>MANAGER_ROLE_IDS.has(String(r).toLowerCase()))||(self?.roles??[]).some(r=>MANAGER_ROLE_IDS.has(String(r).toLowerCase()))));
};
let groupPolicy;
let lastProjectId;
let projectRevision=0;
const launchEditors=[];
let launchStudio;
let modules = [];
let applicationStartup = Promise.resolve();
let selectedLot = 'ALL';
let deferredInstallPrompt;
const CAHIER_VERSION = '1.5.2.43-canopee-collective';
const $ = (s) => { const e = document.querySelector(s); if (!e)
    throw new Error(`UI_ELEMENT_NOT_FOUND:${s}`); return e; };
const val = (id) => document.getElementById(id).value.trim();
const num = (id) => Number(val(id));
const checked = (id) => document.getElementById(id).checked;
const fmt = (n) => `${new Intl.NumberFormat(localeTag(uiLocale), { maximumFractionDigits: 0 }).format(n)} F CFA`;
const split = (v) => v.split(',').map(x => x.trim()).filter(Boolean);
const date = (v) => { try {
    return new Intl.DateTimeFormat(localeTag(uiLocale), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v));
}
catch {
    return v;
} };
const dateOnly=(v)=>{try{return new Intl.DateTimeFormat(localeTag(uiLocale),{dateStyle:'long'}).format(new Date(v));}catch{return String(v??'');}};
const meetingLabel=(m)=>tx('Réunion du ','Meeting on ')+dateOnly(m?.scheduledAt??m?.openedAt??m?.createdAt??'');
const actorDisplayName=(actorId)=>members.find(m=>m.userId===actorId)?.displayName??actorId;
// Stable per-account accent, reproducible on offline devices without a D1 read.
// Labels/IDs remain visible: colour alone is not an identity proof or a lock.
const editorColor=actorId=>{
  const identity=String(actorId??'');if(!identity)return'';
  let hash=2166136261;
  for(let i=0;i<identity.length;i++){hash=Math.imul(hash^identity.charCodeAt(i),16777619);}
  return 'hsl('+String((hash>>>0)%360)+' 66% 35%)';
};
const stampEditorColor=(cell,actorId)=>{
  const id=String(actorId??'');if(!cell||!id)return;
  cell.dataset.editorId=id;cell.style.setProperty('--eco-editor-color',editorColor(id));
};
const memberNumberText=m=>Number(m?.memberNumber)>0?tx('Membre n°'+Number(m.memberNumber),'Member #'+Number(m.memberNumber)):'';
const memberDisplay=m=>(memberNumberText(m)?memberNumberText(m)+' · ':'')+String(m?.displayName??'');
const toast = (m) => { const e = $('#toast'); e.textContent = m; e.hidden = false; setTimeout(() => e.hidden = true, 2600); };
let errorHideTimer=0;
const hideError=()=>{const box=$('#errorBox');if(errorHideTimer){clearTimeout(errorHideTimer);errorHideTimer=0;}box.hidden=true;box.replaceChildren();};
const fail = (e) => {
    const box = $('#errorBox');
    const code = e instanceof Error ? e.message : String(e);
    const friendly = {
        AUTHENTICATION_REQUIRED: 'Votre session est terminée. Reconnectez-vous pour continuer.',
        INVALID_CREDENTIALS: 'Identifiant ou mot de passe incorrect.',
        INVALID_CREDENTIAL_FORMAT: 'Utilisez un identifiant de 3 à 50 caractères et un mot de passe de 12 à 128 caractères.',
        INVALID_DISPLAY_NAME: 'Indiquez votre nom d’affichage (80 caractères maximum).',
        MEMBER_NUMBER_ORDER_INCOMPLETE: 'Le classement doit contenir exactement tous les membres visibles du groupe.',
        MEMBER_NUMBERS_MUST_BE_CONTIGUOUS: 'Les numéros doivent être uniques et former la suite 1, 2, 3… sans doublon ni trou.',
        ACCOUNT_UNAVAILABLE: 'Cet identifiant est déjà utilisé.',
        RATE_LIMITED: 'Trop de tentatives. Réessayez dans dix minutes.',
        INDEPENDENT_APPROVAL_REQUIRED: 'Chaque approbateur doit valider avec son propre compte. Une liste de noms ne vaut pas validation.',
        INDEPENDENT_REVIEW_REQUIRED: 'Cette correction financière exige la revue d’un autre responsable habilité. L’auteur ne peut jamais valider sa propre correction.',
        MEMBER_SELF_ACTION_REQUIRED: 'Le dossier personnel et certaines validations doivent être effectués par le membre concerné lui-même.',
        IDEMPOTENCY_CONFLICT: 'Cette référence correspond déjà à une opération différente. Consultez le reçu existant.',
        CELL_CLOCK_REVIEW_REQUIRED: 'Horloge de validation non vérifiable pour cette saisie. Le montant local est conservé en contentieux et ne remplace pas la comptabilité tant que la chronologie n’est pas vérifiée.',
        CELL_VALUE_CONFLICT: 'Cette cellule a déjà été modifiée par un autre gestionnaire. Eco-System vient de resynchroniser automatiquement la valeur actuelle. Vérifiez-la puis validez de nouveau si nécessaire. Si elle ne se met pas à jour sous 2 secondes, cliquez sur Actualiser.',
        CELL_VERSION_CONFLICT: 'Cette cellule a changé depuis votre dernière lecture. Eco-System vient de resynchroniser automatiquement sa version. Vérifiez-la puis recommencez uniquement cette cellule. Si elle reste inchangée sous 2 secondes, cliquez sur Actualiser.',
        HTTP_503: 'Le serveur de synchronisation est momentanément indisponible. Si cette opération a été mise en file locale, elle sera renvoyée automatiquement ; sinon attendez quelques instants puis cliquez sur Actualiser avant de ressaisir.',
        NETWORK_UNAVAILABLE: 'Connexion momentanément indisponible. Les opérations compatibles hors ligne restent conservées sur cet appareil et seront synchronisées automatiquement.',
        CONSENSUS_UNRESOLVED: 'Des saisies de gestionnaires sont encore divergentes. Confrontez-les et choisissez la valeur retenue avant de diffuser aux membres.',
        FORBIDDEN_SCOPE: 'Votre compte ne dispose pas de l’autorisation nécessaire pour ce groupe.',
        DURABLE_STORAGE_REQUIRED: 'Le stockage local est indisponible. Cette opération n’a pas été envoyée.',
        INVALID_CONTRIBUTION_AMOUNT: 'Le montant doit être un entier positif en F CFA.',
        TONTINE_NOT_PARTICIPATING: 'Ce membre ne participe pas à cette tontine. Vérifiez son inscription et ses parts.',
        TONTINE_ADVANCE_DECLARATION_REQUIRED: 'Ce montant dépasse le cumul dû. Déclarez et confirmez le surplus comme avance pour les prochaines séances.',
        MEMBER_DEBT_SETTLED: 'Ce membre n’a plus de dette exigible. Aucun remboursement supplémentaire n’a été encaissé.',
        LOAN_PAYMENT_EXCEEDS_TOTAL_DUE: 'Ce remboursement dépasse la dette actuellement due. Vérifiez la situation affichée avant de ressaisir.',
        SHEET_TARGET_STALE: 'Un autre remboursement a modifié cette cellule. Actualisez sa situation avant de confirmer une nouvelle valeur.',
        SPECIALIZED_FINANCIAL_CORRECTION_REQUIRED: 'Cette cellule correspond à un prêt, un remboursement ou une sortie. Pour modifier une opération déjà comptabilisée, ouvrez son dossier spécialisé afin de conserver la dette, la caisse et les preuves cohérentes.',
        INSUFFICIENT_AUTHORIZED_LOAN_FUNDS: 'Le montant du prêt dépasse les fonds que la politique du groupe autorise à prêter (Épargne + Remboursements/Intérêts encaissés disponibles). Aucun décaissement n’a été conservé.',
        INSUFFICIENT_CASH_CONCURRENT: 'Deux décaissements concurrents auraient rendu la caisse négative. Eco-System a annulé avec trace cette tentative : actualisez le solde puis réessayez.',
        INSUFFICIENT_CASH: 'La caisse disponible ne suffit pas pour ce décaissement selon la politique actuelle du groupe.',
        MEETING_REQUIRED_FOR_RESTRICTED_LOAN_FUNDING: 'Ce mode de financement des prêts exige de rattacher le décaissement à une séance afin de vérifier les Épargnes et Remboursements autorisés.',
        MEETING_REQUIRED_FOR_SESSION_ONLY_LOAN_FUNDING: 'Le groupe interdit le report des reliquats : choisissez la séance du décaissement.',
        LOAN_POLICY_REQUIRED: 'Configurez d’abord les règles de la rubrique Prêt avant le décaissement.',
        LOAN_RATE_REQUIRED: 'Le taux par période du prêt doit être défini avant le décaissement.',
        MULTIPLE_LOANS: 'Ce membre a plusieurs prêts actifs. Ouvrez le dossier Prêts pour choisir exactement celui à rembourser.',
        LOAN_REQUIRED: 'Aucun prêt actif correspondant n’a été trouvé pour ce membre.',
        ACTIVE_GROUP_REQUIRED: "Sélectionnez d'abord un groupe.",
        GROUP_NAME_REQUIRED: "Le nom du groupe est obligatoire.",
        MEMBER_NAME_REQUIRED: "Le nom du membre est obligatoire.",
        MEMBERSHIP_NOT_FOUND: "Choisissez un membre.",
        LATE_POSTING_REASON_REQUIRED: "Cette opération après clôture exige un motif.",
        LATE_POSTING_APPROVAL_REQUIRED: 'Les validations exigées ne sont pas réunies. Le parcours de validation par plusieurs comptes reste à compléter.',
        LATE_POSTING_NOT_ALLOWED: "Ce groupe interdit actuellement les opérations après clôture. Modifiez la politique seulement si les responsables habilités le décident.",
        LATE_POSTING_WINDOW_EXPIRED: "Le délai autorisé après clôture est dépassé. Une régularisation distincte est nécessaire.",
        WORKSPACE_TITLE_REQUIRED: "Donnez un titre au dossier.",
        INVALID_MODULE_ID: "Le service sélectionné n'est pas reconnu."
    };
    const message=document.createElement('span');message.className='error-message';message.textContent=friendly[code] ?? `Action non terminée : ${code}`;
    const close=document.createElement('button');close.type='button';close.className='error-close';close.textContent='× '+tx('Fermer','Close');close.setAttribute('aria-label',tx('Fermer ce message','Close this message'));close.onclick=hideError;
    box.replaceChildren(message,close);box.hidden=false;
    if(errorHideTimer)clearTimeout(errorHideTimer);errorHideTimer=setTimeout(hideError,code==='AUTHENTICATION_REQUIRED'?12000:7000);
    if(code==='AUTHENTICATION_REQUIRED')showAuth('Reconnectez-vous : votre saisie en cours reste conservée dans cette page.');
};

function onSubmit(selector, handler) {
    const form=$(selector);let pending=false;
    form.addEventListener('submit',async event=>{
        event.preventDefault();if(pending)return;
        pending=true;const buttons=[...form.querySelectorAll('button[type=submit],button:not([type])')];
        const states=buttons.map(b=>b.disabled);buttons.forEach(b=>b.disabled=true);
        try{await handler(event);}finally{pending=false;buttons.forEach((b,i)=>b.disabled=states[i]);}
    });
}

const completionUI = mountCompletionUI({
    app, notify: toast, showError: fail, getMembers: () => members, getMeetings: () => meetings,
    getRubrics: () => rubrics, getLocale: () => uiLocale, fmt, date
});
const advancedUI = mountAdvancedUI({
    app, notify: toast, showError: fail, getMembers: () => members, fmt, translate: (fr,en) => tx(fr,en), isManager
});
const identityLiveUI = mountIdentityLiveUI({ app, notify: toast, showError: fail, conservationMode: FREE_CONSERVATION_MODE });
const communityShopUI = mountCommunityShopUI({ app, notify: toast, showError: fail, isManager, fmt, actorName: actorDisplayName });
const personalShopsUI = mountPersonalShopsUI({app,notify:toast,showError:fail,fmt});
const openAuthorizedNotice=async notice=>{
    const actor=app.currentActor(),tenant=app.currentTenant(),verified=await app.resolveGroupNotificationAction(String(notice.groupId),String(notice.id));
    if(actor!==app.currentActor()||tenant!==app.currentTenant())return;
    if(!(verified.action.view==='trash'&&verified.action.entityKind==='GROUP')&&app.activeGroup()!==notice.groupId){app.selectGroup(notice.groupId);await refreshGroupContext();}
    if(actor===app.currentActor()&&tenant===app.currentTenant())openNoticeAction(verified.action);
};
const notificationCenterUI=mountNotificationCenterUI({app,loadNotices:()=>app.notificationsAcrossGroups(),openNotice:openAuthorizedNotice,openReminder:async item=>{const context=JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]),fresh=(await app.personalReminders()).items.find(r=>r.id===item.id&&r.action);if(!fresh)throw Error('REMINDER_SOURCE_UNAVAILABLE');if(context!==JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]))return;if(fresh.target.kind==='CARE'){go('inbox',{force:true});await renderInbox();if(context===JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]))await ecoCareUI.open(fresh.target.id);}else{go('ecosystem',{anchor:'productiveCommunityCenter',force:true});await productiveCommunityUI.open(fresh.target.kind==='PLAN_STEP'?'plans':'jobs');if(context===JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]))document.querySelector('[data-'+(fresh.target.kind==='PLAN_STEP'?'plan':'job')+'-id="'+CSS.escape(fresh.target.id)+'"]')?.scrollIntoView({block:'start',behavior:'instant'});}},openWaiting:async item=>{const actor=app.currentActor(),tenant=app.currentTenant();await renderInbox(item.id);if(actor===app.currentActor()&&tenant===app.currentTenant()){go('inbox',{anchor:'eco-inbox-item-'+item.id,force:true});if(item.kind==='case')await ecoCareUI.open(item.id);}},showError:fail,notify:toast,date});
let careErrorMessage='';
const ecoCareUI=mountEcoCareUI({app,showError:error=>{careErrorMessage=error.message;fail(error);},clearError:()=>{if(careErrorMessage&&$('#errorBox .error-message')?.textContent.includes(careErrorMessage))hideError();careErrorMessage='';},notify:toast,changed:()=>renderInbox(),date});

const miscRubricUI = mountMiscRubricUI({ app, notify: toast, showError: fail, getMembers: () => members, getMeetings: () => meetings, isManager, fmt });
const pairingUI = mountPairingUI({ app, notify: toast, showError: fail, getMembers: () => members, isManager, afterMembershipChanged: async groupId => { await renderGroups(); if(groupId){ app.selectGroup(groupId); await refreshGroupContext(); } } });
const clearFail = hideError;
let navDepth=Number(history.state?.ecoDepth??0);
const NAV_STATE_STORAGE='eco.navigation.state.v1';
const activeViewName=()=>document.querySelector('.view.active')?.id?.replace(/^view-/,'')||'dashboard';
const readPersistedNavState=()=>{try{const value=JSON.parse(sessionStorage.getItem(NAV_STATE_STORAGE)||'null');return value&&typeof value==='object'?value:null;}catch{return null;}};
const persistNavState=state=>{if(!state?.view)return;try{sessionStorage.setItem(NAV_STATE_STORAGE,JSON.stringify({...state,savedAt:Date.now()}));}catch{}};
// A navigation button receives focus before its click handler runs. Retain the
// last attached editor reference so returning to a sheet can restore that cell.
// Its value remains exclusively in the existing financial draft owner.
let lastFinancialEditor=null;
document.addEventListener('focusin',event=>{if(event.target?.matches?.('.cell-target-input'))lastFinancialEditor=event.target;});
const captureNavState=()=>{
    const view=activeViewName(),active=document.querySelector(`#view-${view}`);
    const sessionTab=document.querySelector('#sessionsTabs [data-session-tab].active')?.dataset?.sessionTab;
    const meetingId=document.querySelector('#sessionsMeetingSelect')?.value||undefined;
    const matrixMeetingId=document.querySelector('#meetingMatrixScope')?.value||undefined;
    const membershipId=document.querySelector('#individualSheetMember')?.value||undefined;
    const sheetMode=!document.querySelector('#individualSheetsMode')?.hidden?'individual':'meeting';
    const openDetails=[...(active?.querySelectorAll('details[open][id]')??[])].map(x=>x.id).slice(0,40);
    const focusId=document.activeElement?.id||undefined;
    const editor=document.activeElement?.matches?.('.cell-target-input')?document.activeElement:lastFinancialEditor;
    const focusedCell=editor?.isConnected&&active?.contains(editor)?editor.closest('.matrix-cell-entry'):null;
    const financialFocus=focusedCell?{meetingId:focusedCell.dataset.meetingId,membershipId:focusedCell.dataset.membershipId,rubricId:focusedCell.dataset.rubricId,hostId:focusedCell.closest('#meetingMatrix,#sessionsWorkspace,#individualSheetMatrix')?.id}:undefined;
    const meetingWrap=document.querySelector('#meetingMatrix .canonical-financial-wrap')??document.querySelector('#meetingMatrix');
    const individualWrap=document.querySelector('#individualSheetMatrix .canonical-financial-wrap')??document.querySelector('#individualSheetMatrix');
    const matrixScrollLeft=Number(meetingWrap?.scrollLeft??0),matrixScrollTop=Number(meetingWrap?.scrollTop??0);
    const individualScrollLeft=Number(individualWrap?.scrollLeft??0),individualScrollTop=Number(individualWrap?.scrollTop??0);
    return{view,scrollY:window.scrollY,sessionTab,meetingId,matrixMeetingId,membershipId,sheetMode,openDetails,focusId,financialFocus,matrixScrollLeft,matrixScrollTop,individualScrollLeft,individualScrollTop};
};
const resolveRequestedNavState=()=>{
    if(history.state?.ecoNav?.view)return history.state.ecoNav;
    const saved=readPersistedNavState(),hash=location.hash.slice(1);
    if(hash){
        const target=document.getElementById(hash),direct=document.getElementById('view-'+hash),view=target?.closest('.view')?.id?.replace(/^view-/,'')||(direct?hash:(saved?.view||'dashboard'));
        return saved?.view===view?{...saved,view,anchor:target?hash:saved.anchor}:{view,anchor:target?hash:undefined,scrollY:0};
    }
    return saved??captureNavState();
};
let startupNavState=resolveRequestedNavState();
let cancelNavigationRestoration=()=>{},navigationRestorationId=0,navigationInteractionRevision=0;
// A late startup/read must yield to the user's current gesture and destination.
// Keep the initial F5 restoration when the page has not been used yet.
for(const type of ['pointerdown','keydown','wheel','touchstart'])window.addEventListener(type,()=>{
    navigationInteractionRevision++;cancelNavigationRestoration();
},{capture:true,passive:true});
const restoreNavState=state=>{
    if(!state)return;
    cancelNavigationRestoration();const restorationId=++navigationRestorationId,interactionRevision=navigationInteractionRevision;
    const restorationCleanups=[];
    cancelNavigationRestoration=()=>{for(const cleanup of restorationCleanups)cleanup();};
    if(state.meetingId){const pick=document.querySelector('#sessionsMeetingSelect');if(pick&&[...pick.options].some(o=>o.value===state.meetingId)){pick.value=state.meetingId;pick.dispatchEvent(new Event('change',{bubbles:true}));}}
    if(state.sessionTab){const tab=document.querySelector(`#sessionsTabs [data-session-tab="${state.sessionTab}"]`);if(tab&&!tab.classList.contains('active'))tab.click();}
    for(const id of state.openDetails??[]){const node=document.getElementById(id);if(node?.tagName==='DETAILS')node.open=true;}
    requestAnimationFrame(()=>{
        if(restorationId!==navigationRestorationId||interactionRevision!==navigationInteractionRevision)return;
        if(state.openTarget){const node=document.getElementById(state.openTarget);if(node){if(node.tagName==='DETAILS')node.open=true;node.hidden=false;node.setAttribute('aria-hidden','false');}}
        if(state.sheetMode||state.matrixMeetingId||state.membershipId||state.rubricId)window.dispatchEvent(new CustomEvent('eco:restore-financial-sheet',{detail:{sheetMode:state.sheetMode,matrixMeetingId:state.matrixMeetingId,membershipId:state.membershipId,rubricId:state.rubricId}}));
        const anchor=state.anchor?document.getElementById(state.anchor):undefined;
        if(anchor){
          // All module shortcuts use the existing owner panels, including dynamically
          // mounted Business/Academy/Kit details. Reveal ancestors before scrolling.
          let owner=anchor instanceof Element?anchor.closest('details'):null;
          while(owner){owner.open=true;owner=owner.parentElement?.closest('details')??null;}
          anchor.scrollIntoView({behavior:'instant',block:'start'});
        }else window.scrollTo({top:Number(state.scrollY)||0,behavior:'instant'});
        const restoredWrappers=new WeakSet();
        const restoreOne=(wrap,left,top)=>{if(!wrap||wrap.clientWidth===0||restoredWrappers.has(wrap))return;if(left>0&&wrap.scrollWidth<=wrap.clientWidth)return;if(wrap.scrollLeft!==0||wrap.scrollTop!==0){restoredWrappers.add(wrap);return;}wrap.scrollLeft=left;wrap.scrollTop=top;restoredWrappers.add(wrap);};
        let matrixRestorationStopped=false,matrixFrame=0,matrixMutations,matrixSizes;
        const pendingMatrixRoots=[
          [document.querySelector('#meetingMatrix'),Number(state.matrixScrollLeft)||0,Number(state.matrixScrollTop)||0],
          [document.querySelector('#individualSheetMatrix'),Number(state.individualScrollLeft)||0,Number(state.individualScrollTop)||0]
        ].filter(([root,left,top])=>root&&(left>0||top>0));
        const stopMatrixRestoration=()=>{if(matrixRestorationStopped)return;matrixRestorationStopped=true;matrixMutations?.disconnect();matrixSizes?.disconnect();cancelAnimationFrame(matrixFrame);for(const type of ['pointerdown','keydown','wheel','touchstart'])window.removeEventListener(type,stopMatrixRestoration,true);};
        const restoreMatrixScroll=()=>{
          if(matrixRestorationStopped||restorationId!==navigationRestorationId)return;
          const meetingWrap=document.querySelector('#meetingMatrix .canonical-financial-wrap')??document.querySelector('#meetingMatrix');
          const individualWrap=document.querySelector('#individualSheetMatrix .canonical-financial-wrap')??document.querySelector('#individualSheetMatrix');
          restoreOne(meetingWrap,Number(state.matrixScrollLeft)||0,Number(state.matrixScrollTop)||0);
          restoreOne(individualWrap,Number(state.individualScrollLeft)||0,Number(state.individualScrollTop)||0);
          if(pendingMatrixRoots.length&&pendingMatrixRoots.every(([root])=>restoredWrappers.has(root.querySelector('.canonical-financial-wrap'))))stopMatrixRestoration();
        };
        // On F5, the table may arrive after the first animation frames while
        // optional panels are still loading. Restore its saved column when its
        // existing renderer supplies a visible wrapper, without waiting for all
        // modules or keeping control after the user's first interaction.
        if(pendingMatrixRoots.length){
          const schedule=()=>{cancelAnimationFrame(matrixFrame);matrixFrame=requestAnimationFrame(restoreMatrixScroll);};
          matrixMutations=new MutationObserver(schedule);
          if(typeof ResizeObserver==='function')matrixSizes=new ResizeObserver(schedule);
          for(const [root]of pendingMatrixRoots){matrixMutations.observe(root,{childList:true});matrixSizes?.observe(root);}
          for(const type of ['pointerdown','keydown','wheel','touchstart'])window.addEventListener(type,stopMatrixRestoration,{capture:true,passive:true});
          restorationCleanups.push(stopMatrixRestoration);
        }
        restoreMatrixScroll();setTimeout(restoreMatrixScroll,60);setTimeout(restoreMatrixScroll,220);
        if(state.focusId)document.getElementById(state.focusId)?.focus?.({preventScroll:true});
        if(state.financialFocus){
          const f=state.financialFocus,host=f.hostId?document.getElementById(f.hostId):document.querySelector('#view-'+state.view);
          const selector=`.matrix-cell-entry[data-meeting-id="${CSS.escape(String(f.meetingId??''))}"][data-membership-id="${CSS.escape(String(f.membershipId??''))}"][data-rubric-id="${CSS.escape(String(f.rubricId??''))}"] .cell-target-input`;
          host?.querySelector(selector)?.focus({preventScroll:true});
        }
        // Preserve an explicit workspace destination through asynchronous layout
        // changes until the user interacts or navigates. Financial viewport
        // restoration keeps its existing bounded lifetime.
        const stableWorkspaceAnchor=anchor&&['marketEnginePanel','communityEnginePanel','adManagerPanel','ecoVisualMediaStudio','valueNetworkOperational'].includes(state.anchor);
        if((!anchor||stableWorkspaceAnchor)&&typeof ResizeObserver==='function'){
          let stopped=false,frame=0,timer=0,mutations;
          const restoreViewport=()=>{if(stopped||restorationId!==navigationRestorationId)return;if(stableWorkspaceAnchor){if(anchor.isConnected&&Math.abs(anchor.getBoundingClientRect().top-(parseFloat(getComputedStyle(anchor).scrollMarginTop)||0))>1)anchor.scrollIntoView({behavior:'instant',block:'start'});}else window.scrollTo({top:Number(state.scrollY)||0,behavior:'instant'});};
          const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(restoreViewport);};
          const observer=new ResizeObserver(schedule);
          const stop=()=>{if(stopped)return;stopped=true;observer.disconnect();mutations?.disconnect();cancelAnimationFrame(frame);clearTimeout(timer);for(const type of ['pointerdown','keydown','wheel','touchstart'])window.removeEventListener(type,stop,true);};
          const view=document.getElementById('view-'+state.view);
          if(view){
            observer.observe(view);
            if(stableWorkspaceAnchor){
              const observed=new WeakSet(),observePanels=()=>{for(const panel of view.children)if(!observed.has(panel)){observed.add(panel);observer.observe(panel);}};
              observePanels();mutations=new MutationObserver(()=>{observePanels();schedule();});mutations.observe(view,{childList:true,subtree:true});
            }
          }
          for(const type of ['pointerdown','keydown','wheel','touchstart'])window.addEventListener(type,stop,{capture:true,passive:true});
          if(!stableWorkspaceAnchor)timer=setTimeout(stop,1500);restorationCleanups.push(stop);
        }
    });
};
const updateBackButton=()=>{const b=document.querySelector('#appBackBtn');if(b)b.hidden=navDepth<=0;};
const showView=(name,state)=>{
    const target=document.querySelector(`#view-${name}`);if(!target)return false;
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
    target.classList.add('active');
    const activeNav=[...document.querySelectorAll(`.nav-btn[data-view="${name}"]`)].find(x=>!state?.anchor||x.dataset.anchor===state.anchor)||document.querySelector(`.nav-btn[data-view="${name}"]`);
    activeNav?.classList.add('active');
    if(activeNav&&window.matchMedia('(max-width:860px)').matches)setTimeout(()=>{const strip=activeNav.parentElement;if(strip)strip.scrollTo({left:Math.max(0,activeNav.offsetLeft-(strip.clientWidth-activeNav.clientWidth)/2),behavior:'smooth'});},20);
    document.querySelector('#globalSearchResults')?.replaceChildren();
    const nextState=state??{view:name,scrollY:0};
    restoreNavState(nextState);persistNavState(nextState);
    updateBackButton();
    try{window.dispatchEvent(new CustomEvent('eco:view-changed',{detail:{view:name,state:nextState}}));}catch{}
    return true;
};
const go=(name,options={})=>{
    const current=captureNavState(),sameDestination=name===current.view&&!options.anchor&&!options.force&&!options.sheetMode&&!options.openTarget;
    if(sameDestination)return;
    navigationInteractionRevision++;
    window.dispatchEvent(new CustomEvent('eco:navigation-leaving',{detail:{state:current}}));
    try{history.replaceState({ecoNav:current,ecoDepth:navDepth},'',`#${current.view}`);}catch{}
    navDepth+=1;
    const next={view:name,scrollY:Number(options.scrollY)||0,anchor:options.anchor,sessionTab:options.sessionTab,meetingId:options.meetingId,matrixMeetingId:options.matrixMeetingId,sheetMode:options.sheetMode,openTarget:options.openTarget,membershipId:options.membershipId,rubricId:options.rubricId,focusId:options.focusId,financialFocus:options.financialFocus,openDetails:options.openDetails,matrixScrollLeft:options.matrixScrollLeft,matrixScrollTop:options.matrixScrollTop,individualScrollLeft:options.individualScrollLeft,individualScrollTop:options.individualScrollTop};
    const hash=options.anchor?`#${options.anchor}`:`#${name}`;
    try{history.pushState({ecoNav:next,ecoDepth:navDepth},'',hash);}catch{}
    showView(name,next);updateBackButton();
};
const goBack=()=>{if(navDepth>0)history.back();};
window.addEventListener('eco:open-economic-opportunity',event=>{
  const groupId=event instanceof CustomEvent?String(event.detail?.groupId??''):'';
  const kind=event instanceof CustomEvent?String(event.detail?.kind??''):'';
  if(groupId&&groupId!==app.activeGroup())return;
  if(!groupId&&kind!=='OFFER')return;
  // Navigate only after the canonical demand/offer form accepted a draft.
  // No publication, reservation, payment or inventory mutation occurs.
  go('ecosystem',{anchor:'valueNetworkOperational',force:true});
});

document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view,{anchor:b.dataset.anchor,meetingId:b.dataset.meetingId,matrixMeetingId:b.dataset.matrixMeetingId,sheetMode:b.dataset.sheetMode,openTarget:b.dataset.openTarget,force:Boolean(b.dataset.anchor||b.dataset.sheetMode||b.dataset.openTarget)})));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go,{anchor:b.dataset.anchor,meetingId:b.dataset.meetingId,matrixMeetingId:b.dataset.matrixMeetingId,sheetMode:b.dataset.sheetMode,openTarget:b.dataset.openTarget,force:Boolean(b.dataset.anchor||b.dataset.sheetMode||b.dataset.openTarget)})));

document.querySelectorAll('[data-eco-module-preset]').forEach(button=>button.addEventListener('click',()=>{
    const kind=button.dataset.ecoModulePreset;
    if(!['NOW','HARVEST'].includes(kind))return;
    // The owner module creates the form and validates its data. This shortcut
    // only selects an existing preset; it never constructs a second workflow.
    requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent('eco:value-network-preset',{detail:{kind}})));
}));
document.addEventListener('click',event=>{
    const link=event.target instanceof Element?event.target.closest('a[href^="#"]'):null;if(!link)return;
    const id=(link.getAttribute('href')||'').slice(1);if(!id)return;
    const target=document.getElementById(id);if(!target)return;
    const view=target.closest('.view')?.id?.replace(/^view-/,'');if(!view)return;
    event.preventDefault();go(view,{anchor:id,openTarget:link.dataset.openTarget,force:true});
});
document.querySelector('#appBackBtn')?.addEventListener('click',goBack);
const documentsUI=mountDocumentsUI({navigate:go,getContext:()=>JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()])});
const printCenterUI=mountPrintCenterUI({app,getGroups:()=>groups,getMembers:()=>members,getMeetings:()=>meetings,getRubrics:()=>rubrics,isManager,notify:toast,showError:fail});
mountMemberDossierUI();
const identityVerificationUI=mountIdentityVerificationUI({app,getGroups:()=>groups,navigate:go,notify:toast,showError:fail});
const dataQualityUI=mountDataQualityUI({app,navigate:go,notify:toast,showError:fail,getReleaseVersion:()=>CAHIER_VERSION});
const opportunityIntelligenceUI=mountOpportunityIntelligenceUI({app,notify:toast,showError:fail,isManager});
const operationalRegistryUI=mountOperationalRegistryUI({app,getGroups:()=>groups,getMembers:()=>members,getRubrics:()=>rubrics,isManager,notify:toast,showError:fail});
const groupLearningRegistryUI=mountGroupLearningRegistryUI({app,getGroups:()=>groups,notify:toast,showError:fail});
const roleDashboardsUI=mountRoleDashboardsUI({app,getGroups:()=>groups,getMembers:()=>members,getMeetings:()=>meetings,isManager,navigate:go,showError:fail});
const geoDirectoryUI=mountGeoDirectoryUI({app,isManager,notify:toast,showError:fail});
const creatorTalentUI=mountCreatorTalentUI({app,notify:toast,showError:fail});
const productiveCommunityUI=mountProductiveCommunityUI({app,getMembers:()=>members});
const journey=createJourneyContext({storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},scope:()=>({actor:app.currentActor(),group:app.activeGroup()})});
const assistantContext=()=>({actor:app.currentActor(),tenant:app.currentTenant(),memoryEnabled:journey.snapshot().enabled,group:app.activeGroup(),groupLabel:groups.find(g=>g.id===app.activeGroup())?.name||'',role:isManager()?'manager':'member',view:activeViewName(),recent:journey.snapshot().recent});
const journeyUI=mountJourneyUI({journey,navigate:go,getContext:assistantContext});
const shellNavigation=mountShellNavigation({getContext:()=>{
    const context=assistantContext(),view=activeViewName();
    // These controls are mounted progressively by their existing owners.
    // Missing presentation context must never interrupt group/finance loading.
    const find=selector=>document.querySelector(selector);
    const select=view==='sessions'?find('#sessionsMeetingSelect'):view==='operations'?(!find('#individualSheetsMode')?.hidden?find('#individualSheetMember'):find('#meetingMatrixScope')):view==='services'?find('#workspaceModule'):null;
    return{...context,objectLabel:context.group?select?.selectedOptions?.[0]?.textContent||'':''};
},getCurrentState:captureNavState,navigate:go});
const localAssistantUI=mountLocalAssistantUI({getModules:()=>modules,openModule:id=>openModule(id),navigate:go,notify:toast,getContext:assistantContext,searchAuthorized:async query=>{const captured=JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]);await openModule('SEARCH.UNIVERSAL');if(captured!==JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]))return;const input=document.getElementById('universalSearchFull');if(input){input.value=String(query).slice(0,4000);input.dispatchEvent(new Event('input',{bubbles:true}));}},speech});
const quietWatchUI=mountQuietWatchUI({app,isManager,notify:toast,showError:fail});
const founderAIUI=mountFounderAIUI({app,showError:fail});
const managerPublicProfileUI=mountManagerPublicProfileUI({app,notify:toast,showError:fail});
const trustCenterUI=mountTrustCenterUI({app,getMembers:()=>members,isManager,notify:toast,showError:fail});
const governedGroupUI=mountGovernedGroupUI({app,getMembers:()=>members,isManager,navigate:go,notify:toast,showError:fail});
const starterKitUI=mountStarterKitUI({app,notify:toast,showError:fail});
const meetingFinanceGovernanceUI=mountMeetingFinanceGovernanceUI({app,getMembers:()=>members,getMeetings:()=>meetings,getRubrics:()=>rubrics,isManager,notify:toast,showError:fail});
const anticipationUI=mountAnticipationUI({app,isManager,notify:toast,showError:fail});
const microAdsUI=mountMicroAdsUI({app,isManager,notify:toast,showError:fail});
const valueDiscoveryUI=mountValueDiscoveryUI({app,notify:toast,showError:fail});
const walletUI=mountWalletUI({app,notify:toast,showError:fail,navigate:go});
const memberEnvelopeUI=mountMemberEnvelopeUI({app,notify:toast,showError:fail});
const sovereignOfflineUI=mountSovereignOfflineUI({app,getMembers:()=>members,getMeetings:()=>meetings,getRubrics:()=>rubrics,isManager,notify:toast,showError:fail});
const opportunityGraphUI=mountOpportunityGraphUI({app,showError:fail});
window.addEventListener('popstate',event=>{
    const state=event.state?.ecoNav,hash=location.hash.slice(1);
    if(hash.startsWith('eco-proof=')){governedGroupUI.openLinkIfPresent();return;}
    navDepth=Math.max(0,Number(event.state?.ecoDepth??Math.max(0,navDepth-1)));
    if(state?.view)showView(state.view,state);
    else if(hash){const target=document.getElementById(hash),view=target?.closest('.view')?.id?.replace(/^view-/,'')||hash;showView(view,{view,anchor:target?hash:undefined,scrollY:0});}
    updateBackButton();
});
try{
    const initial=startupNavState;
    if(!history.state?.ecoNav)history.replaceState({ecoNav:initial,ecoDepth:0},'',location.href);
    navDepth=Math.max(0,Number(history.state?.ecoDepth??0));
    if(initial?.view)showView(initial.view,initial);
}catch{}
window.addEventListener('pagehide',()=>persistNavState(captureNavState()));
updateBackButton();
const detailUI = mountDetailUI({ app, navigate: go, getGroups: () => groups, getMembers: () => members, getMeetings: () => meetings, getRubrics: () => rubrics, isManager, fmt, date, showError: fail, beforeOpen:async(type,id)=>!financialWorkUI||await financialWorkUI.visit(type==='meeting'?id:ensureMatrixMeeting(),type==='member'?id:'') });
const recoveryWorkspace=mountRecoveryWorkspace({app,getGroups:()=>groups,getModules:()=>modules,navigate:go,tx,showError:fail});
const personalCockpitUI = mountPersonalCockpitUI({
  app, getGroups:()=>groups, getMembers:()=>members, getMeetings:()=>meetings,
  navigate:go, fmt, date, showError:fail, isManager, journey, openDetail:(type,id)=>detailUI.open(type,id),
  openInbox:async id=>{const scope=[app.currentActor(),app.currentTenant?.(),app.activeGroup()].join('|');await renderInbox(id);if(scope!==[app.currentActor(),app.currentTenant?.(),app.activeGroup()].join('|'))return;go('inbox',{anchor:'eco-inbox-item-'+id,force:true});},
  openGroupWorkspace:async groupId=>{
    const mine=await app.listMyGroups();
    if(!mine.some(group=>group.id===groupId))throw Error('FORBIDDEN_SCOPE');
    app.selectGroup(groupId);
    await refreshGroupContext();
    go('dashboard',{force:true});
  },
  openGroupForum:async groupId=>{
    // Reuse the normal group-context refresh and its permission checks.
    if(!groups.some(group=>group.id===groupId))throw Error('FORBIDDEN_SCOPE');
    if(app.activeGroup()!==groupId){app.selectGroup(groupId);await refreshGroupContext();}
    go('ecosystem',{anchor:'communityEnginePanel',force:true});
  }
});
const recapUI = mountRecapUI({ app, getGroups: () => groups, getMembers: () => members, getMeetings: () => meetings, getRubrics: () => rubrics, isManager, navigate: go, fmt, date, showError: fail });
window.addEventListener('eco:view-changed',event=>{
    if(event.detail?.view!=='recap')return;
    // Loading is driven by actual navigation, never a background polling loop.
    void recapUI.refresh().catch(fail);
});
const interestCommunityUI = mountInterestCommunityUI({ app, notify: toast, showError: fail, date });
const adManagerUI = mountAdManagerUI({ app, notify: toast, showError: fail, isManager, fmt });
const visualMediaStudio = mountVisualMediaStudio({app,notify:toast,showError:fail,isManager});
const partnerAdsUI = mountPartnerAdsUI({app,notify:toast,showError:fail,isManager});
const adSurfacesUI = mountAdSurfacesUI({app,navigate:go,showError:fail});
const visualMediaPresenter = mountVisualMediaPresenter({app,showError:fail});
const tontineManagerUI = mountTontineManagerUI({ app, getRubrics: () => rubrics, getMembers: () => members, notify: toast, showError: fail, fmt, isManager });
const savingsYieldUI = mountSavingsYieldUI({ app, getMembers: () => members, notify: toast, showError: fail, fmt, isManager });
const externalProgramsUI = mountExternalProgramsUI({ app, notify: toast, showError: fail, isManager, fmt });
const businessStudioUI = mountBusinessStudioUI({app,navigate:go,notify:toast,showError:fail});
const coreEconomicLearningUI = mountCoreEconomicLearningUI({app,notify:toast,showError:fail,isManager});
const economicExperimentsUI=mountEconomicExperimentsUI({app,isManager,notify:toast});
const resourceAssembliesUI=mountResourceAssembliesUI({app,openShop:id=>personalShopsUI.openStorefront(id),notify:toast});
const temporalCommerceUI=mountTemporalCommerceUI({app,isManager,notify:toast});
const financialExplanationsUI=mountFinancialExplanationsUI({app,isManager});
const founderControlUI = mountFounderControlUI({ app, notify: toast, showError: fail });
const assistanceRulebookUI = mountAssistanceRulebookUI({ app, notify: toast, showError: fail, isManager });
const groupHomeUI = mountGroupHomeUI({ app, getGroups:()=>groups, getMembers:()=>members, getMeetings:()=>meetings, navigate:go, fmt, showError:fail });
const sessionsUI = mountSessionsUI({
    app,getGroups:()=>groups,getMembers:()=>members,getMeetings:()=>meetings,getRubrics:()=>rubrics,navigate:go,
    openDetail:(type,id)=>detailUI.open(type,id),showError:fail,notify:toast,
    reloadMeetings:async()=>{await renderMeetings();}
});
const blueprintExecutableUI = mountBlueprintExecutableUI({app,getGroups:()=>groups,getMeetings:()=>meetings,navigate:go,notify:toast,showError:fail});
mountCommunityBlueprintPresets();
const financialLabUI = mountFinancialLabUI({app,notify:toast,showError:fail});
const safetyReviewUI=mountSafetyReviewUI({app});
const resilienceUI = mountResilienceUI({app,notify:toast,showError:fail});
mountWorkspaceNavigation({getScope:()=>[app.currentActor(),app.activeGroup()].map(encodeURIComponent).join('.'),navigate:go});
let liveChannelConnected=false;
const renderConnectivity = () => {
    const online=navigator.onLine,budget=app.serverBudgetState?.(),transport=app.transportState?.(),paused=Boolean(budget?.blocked),degraded=Boolean(transport?.degraded),e=$('#connectivity');
    e.textContent=paused?(String(budget?.reason??'').startsWith('D1_')?tx('● Quota Cloudflare · saisies conservées localement','● Cloudflare quota · entries saved locally'):tx('● Mode conservation · serveur en pause','● Conservation mode · server paused'))
      :degraded?tx('● Local actif · serveur momentanément absent','● Local active · server temporarily unavailable')
      :online?(liveChannelConnected?tx('● En ligne · Live','● Online · Live'):tx('● En ligne · connexion Live…','● Online · connecting Live…'))
      :tx('● Hors ligne','● Offline');
    e.title=paused?tx(`Accès serveur limité. Reprise ciblée après ${new Date(Number(budget?.until??0)).toLocaleString('fr-FR')}. Les validations serveur restent en attente.`,`Server limited. Retry after ${new Date(Number(budget?.until??0)).toLocaleString('en-US')}. Server confirmations pending.`)
      :degraded?tx('Le réseau local reste utilisable. Eco-System privilégie les données de cet appareil et Eco Relay sans sonder le serveur en boucle.','Local networking remains available. Eco-System prioritizes this device and Eco Relay without polling the server.'):'';
    e.className=`pill ${!online?'offline':paused||degraded?'degraded':'online'}`;app.setConnectivity(!online?'offline':paused||degraded?'degraded':'online');
};
let lastOfflineSnapshotNotice=0;
window.addEventListener('eco:offline-snapshot-used',event=>{
    const detail=event instanceof CustomEvent?event.detail:undefined,stamp=detail?.updatedAt?new Date(detail.updatedAt):undefined,e=$('#connectivity');
    const when=stamp&&!Number.isNaN(stamp.getTime())?stamp.toLocaleString():tx('dernière synchro connue','last known sync');
    const browserOnline=navigator.onLine!==false;
    e.textContent=browserOnline?tx(`● Local actif · dernière copie du ${when}`,`● Local active · last copy from ${when}`):tx(`● Hors ligne · données du ${when}`,`● Offline · data from ${when}`);
    e.className=browserOnline?'pill degraded':'pill offline';
    const now=Date.now();if(now-lastOfflineSnapshotNotice>8000){toast(browserOnline?tx('Serveur momentanément indisponible : Eco-System reste actif localement et reprendra la synchronisation sur le prochain événement réseau ou financier.','Server temporarily unavailable: Eco-System stays active locally and will resume sync on the next network or financial event.'):tx('Mode hors ligne : affichage de la dernière copie synchronisée. Les écritures restent en attente de confirmation serveur.','Offline mode: showing the last synchronized copy. Writes remain pending server confirmation.'));lastOfflineSnapshotNotice=now;}
});
const renderUniverse = async () => {
    const u = await app.universe();
    const rows = [[u.groups, tx('Groupes','Groups')], [u.inbox, tx('Actions à traiter','Actions to do')], [u.pendingSync, tx('En attente de synchro','Pending sync')], [u.audit, tx('Événements audités','Audited events')]];
    const root = $('#universeCards');
    root.replaceChildren();
    for (const [n, l] of rows) {
        const d = document.createElement('div');
        d.className = 'metric';
        d.innerHTML = html`<strong>${n}</strong><span>${l}</span>`;
        root.append(d);
    }
};
const renderActiveGroup = () => {
    const id = app.activeGroup();
    const group = groups.find(g => g.id === id);
    const root = $('#activeGroupCard');
    if (!group) {
        root.className = 'empty-state';
        root.textContent = tx('Aucun groupe actif.','No active group.');
        return;
    }
    root.className = 'item';
    root.innerHTML = html`<strong>${group.name}</strong><p>${group.kind} · ${group.governanceModel}</p><small>${tx('Créé le','Created on')} ${date(group.createdAt)}</small>`;
};
const renderGroupSelector = () => {
    const sel = $('#activeGroupSelect');
    sel.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = groups.length ? tx('Choisir un groupe…','Choose a group…') : tx('Aucun groupe — créez ou intégrez-en un','No group — create or join one');
    sel.append(empty);
    for (const g of groups) {
        const o = document.createElement('option');
        o.value = g.id;
        o.textContent = g.name;
        sel.append(o);
    }
    sel.value = app.activeGroup() ?? '';
};
const renderGroups = async () => {
    // Member-facing navigation uses the membership-checked account catalogue,
    // not all groups of the same tenant (which can include private groups).
    groups = await app.listGroups();
    const root = $('#groupsList');
    root.replaceChildren();
    if (!groups.length) {
        root.innerHTML = `<div class="empty-state">${tx('Aucun groupe. Lancez votre premier projet.','No group yet. Start your first project.')}</div>`;
        renderActiveGroup();
        renderGroupSelector();
        return;
    }
    for (const g of groups) {
        const a = document.createElement('article');
        a.className = 'item';
        a.innerHTML = html`<strong>${g.name}</strong><p class="hint">${g.kind} · ${g.governanceModel}</p>`;
        const b = document.createElement('button');
        b.className = 'primary';
        b.textContent = g.id === app.activeGroup() ? tx('Groupe actif','Active group') : tx('Sélectionner','Select');
        b.disabled = g.id === app.activeGroup();
        b.onclick = async () => { app.selectGroup(g.id); await refreshGroupContext(); toast(`${tx('Groupe actif','Active group')} : ${g.name}`); };
        a.append(b);
        if(g.id===app.activeGroup()&&isManager()){
          const danger=document.createElement('details');danger.className='group-danger-zone';const summary=document.createElement('summary');summary.textContent=tx('Gérer / supprimer le groupe','Manage / delete group');danger.append(summary);
          const remove=document.createElement('button');remove.type='button';remove.className='secondary danger-action';remove.textContent=tx('Placer le groupe à la corbeille','Move group to trash');
          remove.onclick=()=>void(async()=>{const typed=prompt(tx(`Pour éviter une suppression accidentelle, écrivez exactement : ${g.name}`,`To prevent accidental deletion, type exactly: ${g.name}`));if(typed!==g.name)return;try{await app.moveToTrash('GROUP',g.id);app.selectGroup(undefined);await renderGroups();await renderTrash();toast(tx('Groupe placé dans la corbeille pour 6 mois.','Group moved to trash for 6 months.'));}catch(e){fail(e);}})();danger.append(remove);a.append(danger);
        }
        root.append(a);
    }
    renderActiveGroup();
    renderGroupSelector();
};
const renderInbox = async highlightedId => {
    const captured={actor:app.currentActor(),tenant:app.currentTenant?.(),group:app.activeGroup()||''};
    const items = await app.inboxItems();
    if(captured.actor!==app.currentActor()||captured.group!==(app.activeGroup()||'')||captured.tenant!==app.currentTenant?.())return;
    personalCockpitUI.acceptInbox?.(items,captured);
    for (const selector of ['#dashboardInbox', '#inboxList']) {
        const root = $(selector);
        root.replaceChildren();
        if (!items.length) {
            root.innerHTML = `<li class="empty-state">${tx('Aucune action urgente.','No urgent action.')}</li>`;
            continue;
        }
        const visible=items.slice(0,selector==='#dashboardInbox'?5:50),target=typeof highlightedId==='string'?items.find(x=>x.id===highlightedId):null;
        if(selector==='#inboxList'&&target&&!visible.some(x=>x.id===target.id))visible.push(target);
        for (const i of visible) {
            const li = document.createElement('li');
            if(selector==='#inboxList'){li.id='eco-inbox-item-'+i.id;li.tabIndex=-1;}
            li.textContent = `${i.title} · ${i.status}`;
            root.append(li);
        }
    }
};
const renderMembers = async providedMembers => {
    members = (providedMembers??await app.listMembers()).filter(x=>x.status!=='left');
    const list = $('#memberList'),select = $('#contributionMember'),manageSelect=document.querySelector('#memberManageSelect');
    list.replaceChildren();select.replaceChildren();manageSelect?.replaceChildren();
    const sortDate=m=>Date.parse(m.historicalJoinedAt??m.joinedAt??'')||Number.MAX_SAFE_INTEGER;
    const ordered=members.slice().sort((a,b)=>{
      if(memberSortMode==='number')return (Number(a.memberNumber)||Number.MAX_SAFE_INTEGER)-(Number(b.memberNumber)||Number.MAX_SAFE_INTEGER)||String(a.displayName).localeCompare(String(b.displayName),localeTag(uiLocale),{sensitivity:'base'});
      if(memberSortMode==='name')return String(a.displayName).localeCompare(String(b.displayName),localeTag(uiLocale),{sensitivity:'base'});
      if(memberSortMode==='role')return String(a.roles?.[0]??'').localeCompare(String(b.roles?.[0]??''),localeTag(uiLocale),{sensitivity:'base'})||String(a.displayName).localeCompare(String(b.displayName),localeTag(uiLocale),{sensitivity:'base'});
      return sortDate(a)-sortDate(b)||String(a.displayName).localeCompare(String(b.displayName),localeTag(uiLocale),{sensitivity:'base'});
    });
    if (!ordered.length) {
        list.innerHTML = `<li class="empty-state">${tx('Aucun membre.','No member.')}</li>`;
        select.innerHTML = `<option value="">${tx('Aucun membre','No member')}</option>`;
        if(manageSelect)manageSelect.innerHTML=`<option value="">${tx('Aucun membre','No member')}</option>`;
        return;
    }
    for (const m of ordered) {
        const li = document.createElement('li');li.dataset.membershipId=m.id;
        if(isManager()){const rankLabel=document.createElement('label');rankLabel.className='member-number-editor';const rankText=document.createElement('span');rankText.textContent=tx('N°','No.');const rankInput=document.createElement('input');rankInput.type='number';rankInput.min='1';rankInput.step='1';rankInput.value=String(Number(m.memberNumber)||'');rankInput.dataset.memberNumberInput=m.id;rankInput.setAttribute('aria-label',tx('Numéro de classement de '+m.displayName,'Ranking number for '+m.displayName));rankLabel.append(rankText,rankInput);li.append(rankLabel);}
        const memberLink=document.createElement('button');memberLink.type='button';memberLink.className='link-btn';memberLink.dataset.detailType='member';memberLink.dataset.detailId=m.id;memberLink.textContent=memberDisplay(m);li.append(memberLink,document.createTextNode(' · '+m.roles.join(', ')));
        if(isManager() || m.userId===app.currentActor()){
            const button=document.createElement('button');button.type='button';button.className='link-btn';button.textContent=tx('Relevé','Statement');
            button.onclick=()=>showStatement(m.id).catch(fail);li.append(button);
        }
        const dossier=document.createElement('button');dossier.type='button';dossier.className='link-btn';dossier.dataset.memberDossierOpen=m.id;dossier.textContent=tx('Dossier membre','Member dossier');li.append(dossier);
        if(isManager()){
            const details=document.createElement('details');details.className='member-authority-editor';const summary=document.createElement('summary');summary.textContent=tx('Habilitations / statut','Authorities / status');details.append(summary);
            const status=document.createElement('select');for(const s of ['invited','waitlisted','trial','active','suspended','left']){const o=document.createElement('option');o.value=s;o.textContent=s;status.append(o)}status.value=m.status;
            const roles=document.createElement('input');roles.value=m.roles.join(', ');roles.placeholder=tx('member, treasurer, president…','member, treasurer, president…');
            const reason=document.createElement('input');reason.placeholder=tx('Motif / décision du groupe','Reason / group decision');
            const save=document.createElement('button');save.type='button';save.className='secondary';save.textContent=tx('Enregistrer les habilitations','Save authorities');save.onclick=async()=>{try{const nextRoles=roles.value.split(',').map(x=>x.trim()).filter(Boolean);await app.updateMemberLifecycle(m.id,{status:status.value,roles:nextRoles,reason:reason.value,expectedRevision:Number(m.lifecycleRevision??0)});await renderMembers();toast(tx('Habilitations mises à jour et auditées.','Authorities updated and audited.'));}catch(e){fail(e);}};
            const box=document.createElement('div');box.className='inline-form';box.append(status,roles,reason,save);details.append(box);li.append(details);
        }
        list.append(li);
        const o = document.createElement('option');o.value = m.id;o.textContent = memberDisplay(m);select.append(o);
        if(manageSelect){const mo=document.createElement('option');mo.value=m.id;mo.textContent=memberDisplay(m);manageSelect.append(mo);}
    }
};
document.querySelector('#memberSort')?.addEventListener('change',event=>{memberSortMode=event.target.value||'number';void renderMembers();});
document.querySelector('#memberApplyDisplayedOrderBtn')?.addEventListener('click',()=>void(async()=>{
    if(!isManager())return;
    const ids=[...document.querySelectorAll('#memberList [data-membership-id]')].map(x=>String(x.dataset.membershipId??'')).filter(Boolean);
    if(!ids.length)return;
    try{await app.setMemberNumberOrder(ids);memberSortMode='number';const sort=document.querySelector('#memberSort');if(sort)sort.value='number';await renderMembers();renderMeetingMatrix();renderIndividualSheetMatrix();renderOutbox();toast(navigator.onLine===false?tx('Classement enregistré sur cet appareil · synchro en attente.','Ranking saved on this device · pending sync.'):tx('Numéros des membres mis à jour selon l’ordre affiché.','Member numbers updated from the displayed order.'));}catch(e){fail(e);}
})());
document.querySelector('#memberSaveNumbersBtn')?.addEventListener('click',()=>void(async()=>{
    if(!isManager())return;
    const inputs=[...document.querySelectorAll('#memberList [data-member-number-input]')],pairs=inputs.map(input=>({id:String(input.dataset.memberNumberInput??''),number:Number(input.value)}));
    if(!pairs.length)return;
    const numbers=pairs.map(x=>x.number),expected=Array.from({length:pairs.length},(_,i)=>i+1);
    if(numbers.some(n=>!Number.isInteger(n)||n<1)||new Set(numbers).size!==numbers.length||numbers.slice().sort((a,b)=>a-b).some((n,i)=>n!==expected[i])){fail(new Error('MEMBER_NUMBERS_MUST_BE_CONTIGUOUS'));return;}
    const ids=pairs.slice().sort((a,b)=>a.number-b.number).map(x=>x.id);
    try{await app.setMemberNumberOrder(ids);memberSortMode='number';const sort=document.querySelector('#memberSort');if(sort)sort.value='number';await renderMembers();renderMeetingMatrix();renderIndividualSheetMatrix();renderOutbox();toast(navigator.onLine===false?tx('Numéros enregistrés sur cet appareil · synchro en attente.','Numbers saved on this device · pending sync.'):tx('Classement et numéros des membres enregistrés.','Member ranking and numbers saved.'));}catch(e){fail(e);}
})());
document.querySelector('#memberRenameBtn')?.addEventListener('click',()=>void(async()=>{
    const id=document.querySelector('#memberManageSelect')?.value,m=members.find(x=>x.id===id);if(!m)return;
    const next=prompt(tx('Corriger le nom du membre :','Correct member name:'),m.displayName);if(next===null||!next.trim()||next.trim()===m.displayName)return;
    const reason=prompt(tx('Motif de la correction du nom :','Reason for name correction:'),tx('Correction d’une erreur de saisie','Correction of an entry error'));if(reason===null||!reason.trim())return;
    try{await app.updateMemberName(m.id,next.trim(),reason.trim());await renderMembers();toast(tx('Nom du membre corrigé et modification signalée.','Member name corrected and change notified.'));}catch(e){fail(e);}
})());
document.querySelector('#memberTrashBtn')?.addEventListener('click',()=>void(async()=>{
    const id=document.querySelector('#memberManageSelect')?.value,m=members.find(x=>x.id===id);if(!m)return;
    if(!confirm(tx(`Placer « ${m.displayName} » dans la corbeille pendant 6 mois ? Aucune écriture financière ne sera effacée.`,`Move “${m.displayName}” to trash for 6 months? No financial record will be erased.`)))return;
    try{await app.moveToTrash('MEMBER',m.id);await renderMembers();await renderTrash();toast(tx('Membre placé dans la corbeille.','Member moved to trash.'));}catch(e){fail(e);}
})());

const renderMeetings = async providedMeetings => {
    meetings = (providedMeetings??await app.listMeetings()).filter(x=>x.status!=='cancelled');
    const root = $('#meetingList');
    root.replaceChildren();
    const select = $('#contributionMeeting');
    select.replaceChildren();
    const none = document.createElement('option');
    none.value = '';
    none.textContent = tx('Sans séance','No meeting');
    select.append(none);
    for (const m of meetings.slice().sort((a, b) => b.openedAt.localeCompare(a.openedAt))) {
        const a = document.createElement('article');
        a.className = 'meeting-row';
        const span = document.createElement('span');
        const meetingLink=document.createElement('button');meetingLink.type='button';meetingLink.className='link-btn';meetingLink.dataset.detailType='meeting';meetingLink.dataset.detailId=m.id;meetingLink.textContent=meetingLabel(m);
        span.append(meetingLink,document.createTextNode(` · ${m.status === 'open' ? tx('ouverte','open') : tx('clôturée','closed')}`));
        if(m.title&&m.title!==meetingLink.textContent){const stored=document.createElement('small');stored.textContent=' · '+tx('titre interne: ','stored title: ')+m.title;span.append(stored);}
        a.append(span);
        if (m.status === 'open' && isManager()) {
            const b = document.createElement('button');
            b.textContent = tx('Clôturer','Close');
            b.onclick = async () => { try {
                clearFail();
                await app.closeMeeting(m.id);
                await renderMeetings();
                toast(tx('Clôture enregistrée comme checkpoint.','Closing recorded as a checkpoint.'));
            }
            catch (e) {
                fail(e);
            } };
            a.append(b);
        }
        if(isManager()){
            const edit=document.createElement('button');edit.type='button';edit.className='link-btn';edit.textContent=tx('Modifier','Edit');edit.onclick=()=>go('sessions',{meetingId:m.id,force:true});
            const remove=document.createElement('button');remove.type='button';remove.className='link-btn';remove.textContent=tx('Corbeille','Trash');remove.onclick=()=>void(async()=>{if(!confirm(tx('Mettre cette séance à la corbeille ? Elle reste restaurable pendant 6 mois et aucune écriture financière n’est supprimée.','Move this meeting to trash? It remains restorable for 6 months and no financial entry is deleted.')))return;try{await app.moveToTrash('MEETING',m.id);await renderMeetings();await renderTrash();toast(tx('Séance placée dans la corbeille.','Meeting moved to trash.'));}catch(e){fail(e);}})();a.append(edit,remove);
        }
        root.append(a);
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = `${meetingLabel(m)} · ${m.status}`;
        select.append(o);
    }
};
const activeMeeting = () => {
    if(matrixMeetingId&&meetings.some(x=>x.id===matrixMeetingId))return matrixMeetingId;
    const sessionSelected=document.querySelector('#sessionsMeetingSelect')?.value;
    if(sessionSelected&&sessionSelected!=='__cumulative__'&&meetings.some(x=>x.id===sessionSelected))return sessionSelected;
    return meetings.find(x=>x.status==='open')?.id??meetings.at(-1)?.id;
};
const financialNatureForRubric=rubric=>{
    const kind=String(rubric?.activityPlan?.kind??'').toUpperCase(),name=String(rubric?.name??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),systemKey=String(rubric?.facets?.custom?.systemKey??'').toUpperCase();
    if(kind==='LOAN'||systemKey==='LOAN'||/^prets?$|^loans?$/.test(name))return'LOAN';
    if(kind==='REPAYMENT'||systemKey==='REPAYMENT'||/remboursement|repayment/.test(name))return'REPAYMENT';
    if(rubric?.facets?.direction==='OUTFLOW')return'OUTFLOW';
    return'CONTRIBUTION';
};
const exactCellRows=(membershipId,rubricId,meetingId)=>receiptPositions.filter(x=>x.membershipId===membershipId&&x.rubricId===rubricId&&x.meetingId===meetingId);
const exactCellEvents=(membershipId,rubricId,meetingId)=>financialSheetEvents.filter(x=>String(x.data?.membershipId??'')===membershipId&&String(x.data?.rubricId??'')===rubricId&&String(x.data?.meetingId??'')===meetingId);
const financialCellKey=(membershipId,rubricId,meetingId)=>JSON.stringify([meetingId,membershipId,rubricId]);
const traceFinancialCell=(type,detail={})=>{
    const event={type,at:new Date().toISOString(),groupId:app.activeGroup?.()??'',...detail};
    try{const key='eco.financialCellTrace',rows=JSON.parse(localStorage.getItem(key)||'[]');localStorage.setItem(key,JSON.stringify([...rows,event].slice(-50)));}catch{}
    window.dispatchEvent(new CustomEvent('eco:financial-cell-trace',{detail:event}));
};
const exactCellPendingState=(membershipId,rubricId,meetingId)=>{
    const key=financialCellKey(membershipId,rubricId,meetingId),review=financialReviewTargets.get(key);
    if(review)return{pending:true,status:'REVIEW_REQUIRED',kind:'REVIEW',targetAmount:Number(review.targetAmount??0)};
    const correction=financialPendingTargets.get(key)??(app.pendingFinancialCellTargets?.()??[]).find(x=>x.membershipId===membershipId&&x.rubricId===rubricId&&x.meetingId===meetingId);
    if(correction){
      const review=['CONSENSUS_REQUIRED','CLOCK_REVIEW'].includes(String(correction.businessStatus??'')),relay=String(correction.source??'')==='RELAY';
      return{pending:true,status:review?'REVIEW_REQUIRED':correction.status,kind:review?'REVIEW':relay?'RELAY':'CORRECTION',targetAmount:Number(correction.targetAmount??0),sourceActorId:String(correction.sourceActorId??'')};
    }
    const specialized=financialPendingSheetEntries.find(x=>x.membershipId===membershipId&&x.rubricId===rubricId&&x.meetingId===meetingId);
    if(specialized)return{pending:true,status:String(specialized.status??'PENDING'),kind:'SPECIALIZED_ENTRY',targetAmount:Number(specialized.amount??0)};
    const receipt=exactCellRows(membershipId,rubricId,meetingId).find(x=>x.localPending===true);
    return receipt?{pending:true,status:String(receipt.localPendingStatus??'PENDING'),kind:'ENTRY',targetAmount:Number(receipt.netAmount??receipt.amount?.amount??0)}:{pending:false,status:'',kind:'',targetAmount:undefined};
};
const exactCellAmount=(membershipId,rubricId,meetingId)=>{
    const cellKey=financialCellKey(membershipId,rubricId,meetingId),optimistic=financialOptimisticValues.get(cellKey);
    if(Number.isFinite(optimistic))return Number(optimistic);
    const rubric=rubrics.find(x=>x.id===rubricId),nature=financialNatureForRubric(rubric);
    let canonical=0;
    if(nature!=='CONTRIBUTION'){
      canonical=exactCellEvents(membershipId,rubricId,meetingId).reduce((sum,event)=>sum+(String(event.data?.direction??'IN')==='OUT'?-1:1)*Number(event.data?.amount??0),0);
      const pending=financialPendingSheetEntries.find(x=>x.membershipId===membershipId&&x.rubricId===rubricId&&x.meetingId===meetingId);
      if(pending){
        const signed=['LOAN','OUTFLOW'].includes(String(pending.nature??nature))?-Math.abs(Number(pending.amount??0)):Math.abs(Number(pending.amount??0));
        if(canonical===0)canonical=signed;
      }
    }else{
      const pending=financialPendingTargets.get(cellKey);
      // A locally queued target is the working projection until synchronization.
      // Once the server ACK says CONSENSUS_REQUIRED, the canonical Ledger value
      // remains visible and the target is rendered separately as “Proposé”.
      if(pending&&!['CONSENSUS_REQUIRED','REMOTE_DIVERGENCE','CLOCK_REVIEW'].includes(String(pending.businessStatus??''))&&Number.isSafeInteger(Number(pending.targetAmount))&&Number(pending.targetAmount)>=0)return Number(pending.targetAmount);
      canonical=exactCellRows(membershipId,rubricId,meetingId).reduce((n,x)=>n+Number(x.netAmount??0),0);
    }
    const streamed=financialDurableProjections.get(cellKey),snapshotVersion=Number(financialSnapshotCellVersions.get(JSON.stringify([meetingId,membershipId,rubricId,'XAF']))??0);
    if(streamed&&streamed.cellVersion>=snapshotVersion)canonical=['LOAN','OUTFLOW'].includes(nature)?-Math.abs(streamed.amount):streamed.amount;
    const confirmed=financialConfirmedCells.get(cellKey);
    if(confirmed&&String(confirmed.groupId??'')===String(app.activeGroup?.()??'')){
      const canonicalVersion=Number(financialCellVersions.get(JSON.stringify([meetingId,membershipId,rubricId,'XAF']))??0),confirmedVersion=Number(confirmed.cellVersion);
      // A strictly newer canonical version supersedes the local confirmation.
      if(Number.isFinite(confirmedVersion)&&canonicalVersion>confirmedVersion){forgetConfirmedCell(cellKey);return canonical;}
      // Remove the overlay only when the canonical projection actually confirms
      // the exact value. Same-version stale reads must never roll the writer back.
      if((!Number.isFinite(confirmedVersion)||canonicalVersion>=confirmedVersion)&&Number(canonical)===Number(confirmed.amount)){forgetConfirmedCell(cellKey);return canonical;}
      if(Date.now()-Number(confirmed.confirmedAt??0)<7*86400000)return Number(confirmed.amount);
      forgetConfirmedCell(cellKey);
    }
    return canonical;
};
const exactCellVersion=(membershipId,rubricId,meetingId)=>Number(financialCellVersions.get(JSON.stringify([meetingId,membershipId,rubricId,'XAF']))??0);

const readCellAmount=node=>{const raw=String(node?.querySelector?.('.cell-current')?.textContent??'').replace(/[^0-9-]/g,'');return raw?Number(raw):0;};
const recalcCanonicalFinancialTable=table=>{
    if(!table)return;
    const rows=[...table.querySelectorAll('tbody tr')].filter(row=>!row.classList.contains('table-total-row'));
    const byRubric=new Map();let grand=0;
    for(const row of rows){
      let rowTotal=0;
      for(const cell of row.querySelectorAll('.matrix-cell-entry')){
        const amount=readCellAmount(cell);rowTotal+=amount;
        const rubricId=String(cell.dataset.rubricId??'');if(rubricId)byRubric.set(rubricId,(byRubric.get(rubricId)??0)+amount);
      }
      const target=row.querySelector('.table-row-total');if(target)target.textContent=fmt(rowTotal);
      grand+=rowTotal;
    }
    for(const total of table.querySelectorAll('[data-total-rubric-id]'))total.textContent=fmt(byRubric.get(String(total.dataset.totalRubricId??''))??0);
    const grandTarget=table.querySelector('.table-grand-total');if(grandTarget)grandTarget.textContent=fmt(grand);
};
const patchFinancialDomCell=({meetingId,membershipId,rubricId,amount,cellVersion,remote=false,preservePending=false}={})=>{
    const key=financialCellKey(String(membershipId??''),String(rubricId??''),String(meetingId??''));
    if(Number.isFinite(Number(amount)))financialOptimisticValues.set(key,Number(amount));
    if(Number.isFinite(Number(cellVersion)))financialCellVersions.set(JSON.stringify([String(meetingId??''),String(membershipId??''),String(rubricId??''),'XAF']),Number(cellVersion));
    const selector=financialLiveSelector?.({meetingId,membershipId,rubricId})||'';
    if(!selector)return;
    const touched=new Set();
    for(const cell of document.querySelectorAll(selector)){
      const value=Number.isFinite(Number(amount))?Number(amount):exactCellAmount(String(membershipId),String(rubricId),String(meetingId));
      const current=cell.querySelector('.cell-current');if(current){current.textContent=fmt(value);current.classList.toggle('is-negative',value<0);}
      if(!preservePending){financialPendingTargets.delete(key);financialReviewTargets.delete(key);}
      const table=cell.closest('.canonical-financial-matrix');if(table)touched.add(table);
      if(remote)cell.dataset.remoteAppliedAt=String(Date.now());
    }
    for(const table of touched)recalcCanonicalFinancialTable(table);
};
const focusNextFinancialInput=(holder,wrapState)=>{
    const table=holder?.closest?.('.canonical-financial-matrix');if(!table)return;
    const inputs=[...table.querySelectorAll('.cell-target-input:not(:disabled)')],current=holder.querySelector('.cell-target-input'),index=inputs.indexOf(current),next=index>=0?inputs[index+1]:null;
    const wrap=holder.closest('.matrix-wrap');if(wrap&&wrapState){wrap.scrollLeft=wrapState.left;wrap.scrollTop=wrapState.top;}
    if(next){next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});}
};
const hydrateRelayFinancialReviews=async()=>{
  for(const conflict of await app.localRelayFinancialConflicts?.().catch?.(()=>[])??[]){
    const local=conflict.local?.payload??{},remote=conflict.remote?.payload??{};
    if(local.groupId!==app.activeGroup())continue;
    const key=financialCellKey(String(local.membershipId),String(local.rubricId),String(local.meetingId));
    financialReviewTargets.set(key,{...remote,targetAmount:Number(remote.targetAmount??remote.amount),localTargetAmount:Number(local.targetAmount??local.amount),source:'RELAY',businessStatus:'RELAY_REVIEW_REQUIRED'});
  }
};
const loadFinancialProjectionState=async({clearOptimistic=false}={})=>{
    ensureFinancialStorageScope();
    const [l,sheetEvents,sheetExpenses,reviewSnapshot]=await Promise.all([app.ledger(),app.listWorkspaceRecords('FINANCE.SHEET_EVENT',app.activeGroup()).catch(()=>[]),app.expenses({scope:'SHEET'}).catch(()=>[]),app.financialCellSnapshot(financialReviewSnapshotLoaded).catch(()=>null)]);
    if(reviewSnapshot){financialReviewSnapshotLoaded=true;financialReviewInbox=new Map(reviewSnapshot.cells.filter(x=>x.reviewRequired).map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),x]));financialApprovedReviewVersions=new Map(reviewSnapshot.cells.filter(x=>x.reviewDecision==='APPROVE').map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),Number(x.cellVersion)]));}
    receiptPositions=l.receipts;
    const localTargets=app.pendingFinancialCellTargets?.()??[],relayTargets=await app.relayManagerFinancialTargets?.().catch?.(()=>[])??[];
    financialPendingTargets=new Map(localTargets.map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),x]));
    financialReviewTargets=new Map();
    for(const relay of relayTargets){
      const key=financialCellKey(relay.membershipId,relay.rubricId,relay.meetingId),local=financialPendingTargets.get(key);
      if(!local)financialPendingTargets.set(key,relay);
      else if(Number(local.targetAmount)!==Number(relay.targetAmount))financialReviewTargets.set(key,{...relay,targetAmount:relay.targetAmount,localTargetAmount:Number(local.targetAmount),source:'RELAY',businessStatus:'RELAY_REVIEW_REQUIRED'});
    }
    await hydrateRelayFinancialReviews();
    financialPendingSheetEntries=app.pendingFinancialSheetEntries?.()??[];
    financialSheetEvents=[...sheetEvents,...sheetExpenses.map(x=>({id:x.id,createdBy:x.createdBy,createdAt:x.createdAt,updatedAt:x.updatedAt,data:{membershipId:x.membershipId,meetingId:x.meetingId,rubricId:x.rubricId,amount:x.amount,direction:'OUT',ledgerEntryId:x.ledgerEntryId}}))];
    financialCellVersions=new Map((l.cellRevisions??[]).map(r=>[JSON.stringify([r.meetingId,r.membershipId,r.rubricId,r.currency??'XAF']),Number(r.version??0)]));
    for(const event of financialSheetEvents){const d=event.data??{},key=JSON.stringify([d.meetingId,d.membershipId,d.rubricId,'XAF']);financialCellVersions.set(key,(financialCellVersions.get(key)??0)+1);}
    financialSnapshotCellVersions=new Map(financialCellVersions);
    financialDurableProjections=new Map((l.liveCells??[]).map(p=>[financialCellKey(p.membershipId,p.rubricId,p.meetingId),p]));
    for(const p of l.liveCells??[]){const key=JSON.stringify([p.meetingId,p.membershipId,p.rubricId,'XAF']);financialCellVersions.set(key,Math.max(Number(financialCellVersions.get(key)??0),Number(p.cellVersion)));const pending=financialPendingTargets.get(financialCellKey(p.membershipId,p.rubricId,p.meetingId));if(pending&&p.cellVersion>Number(pending.baselineVersion??pending.baselineCellVersion??0)&&Number(pending.targetAmount)!==p.amount)pending.businessStatus='REMOTE_DIVERGENCE';}
    financialCellMetadata=new Map();
    const rememberMeta=(membershipId,rubricId,meetingId,actorId,at)=>{
      if(!membershipId||!rubricId||!meetingId)return;
      const key=financialCellKey(String(membershipId),String(rubricId),String(meetingId)),stamp=Date.parse(String(at??''))||0,old=financialCellMetadata.get(key);
      if(!old||stamp>=Number(old.stamp??0))financialCellMetadata.set(key,{actorId:String(actorId??''),at:String(at??''),stamp});
    };
    for(const row of l.receipts??[])rememberMeta(row.membershipId,row.rubricId,row.meetingId,row.receivedBy,row.receivedAt);
    for(const event of financialSheetEvents){const d=event.data??{};rememberMeta(d.membershipId,d.rubricId,d.meetingId,event.createdBy,event.updatedAt??event.createdAt);}
    const pendingSheetKeys=new Set(financialPendingSheetEntries.map(x=>financialCellKey(x.membershipId,x.rubricId,x.meetingId)));
    for(const key of financialOptimisticValues.keys())if(clearOptimistic||(!financialPendingTargets.has(key)&&!pendingSheetKeys.has(key)))financialOptimisticValues.delete(key);
    return l;
};
const refreshFinancialProjectionSilently=async(detail)=>{
    if(!app.activeGroup())return;
    await loadFinancialProjectionState();
    if(detail?.meetingId&&detail?.membershipId&&detail?.rubricId){
      const key=financialCellKey(String(detail.membershipId),String(detail.rubricId),String(detail.meetingId));
      financialOptimisticValues.delete(key);
      const rubric=rubrics.find(x=>x.id===String(detail.rubricId)),nature=financialNatureForRubric(rubric),fresh=exactCellAmount(String(detail.membershipId),String(detail.rubricId),String(detail.meetingId));
      patchFinancialDomCell({meetingId:detail.meetingId,membershipId:detail.membershipId,rubricId:detail.rubricId,amount:fresh,cellVersion:exactCellVersion(String(detail.membershipId),String(detail.rubricId),String(detail.meetingId)),remote:Boolean(detail.remote)});
      if(nature==='LOAN'||nature==='OUTFLOW')void nature;
    }
};

const financialRetryTimers=new Map();
const cellHasPendingLocal=detail=>{
  const key=financialCellKey(String(detail.membershipId??''),String(detail.rubricId??''),String(detail.meetingId??''));
  return financialPendingTargets.has(key)||financialPendingSheetEntries.some(x=>x.membershipId===detail.membershipId&&x.rubricId===detail.rubricId&&x.meetingId===detail.meetingId);
};
const setCellSyncedState=detail=>{
  const selector=financialLiveSelector?.(detail)||'';
  for(const cell of selector?document.querySelectorAll(selector):[]){
    cell.dataset.saveState='CONFIRMED';cell.classList.add('is-confirmed');cell.classList.remove('is-failed');
    const state=cell.querySelector('.cell-save-state');if(state){state.textContent=tx('✓ Synchronisé','✓ Synced');state.hidden=false;setTimeout(()=>{if(state.textContent.includes('Synchron')||state.textContent.includes('Synced'))state.hidden=true;},2200);}
    cell.classList.remove('has-local-pending','has-review-pending','is-conflict','is-critical-conflict');
    cell.querySelector('.cell-sync-state.pending')?.remove();
  }
  const bar=document.querySelector('#financialAlertBar');
    if(bar?.dataset.criticalCellKey===financialCellKey(String(detail.membershipId),String(detail.rubricId),String(detail.meetingId))){delete bar.dataset.criticalCellKey;bar.hidden=true;}
    if(financialReviewInbox.size)renderPendingFinancialReviewAlert();
};
const pendingTargetSnapshot=()=>Array.from(app.pendingFinancialCellTargets?.()??[]).map(item=>({
  key:financialCellKey(String(item.membershipId??''),String(item.rubricId??''),String(item.meetingId??'')),
  meetingId:String(item.meetingId??''),membershipId:String(item.membershipId??''),rubricId:String(item.rubricId??''),
  amount:Number(item.targetAmount??0),cellVersion:Number(item.baselineVersion??0)+1,idempotencyKey:String(item.idempotencyKey??'')
})).filter(item=>item.meetingId&&item.membershipId&&item.rubricId&&Number.isSafeInteger(item.amount)&&item.amount>=0);
const pendingSheetSnapshot=()=>Array.from(app.pendingFinancialSheetEntries?.()??[]).map(item=>({
  key:financialCellKey(String(item.membershipId??''),String(item.rubricId??''),String(item.meetingId??'')),
  meetingId:String(item.meetingId??''),membershipId:String(item.membershipId??''),rubricId:String(item.rubricId??''),
  amount:['LOAN','OUTFLOW'].includes(String(item.nature??''))?-Math.abs(Number(item.amount??0)):Math.abs(Number(item.amount??0)),
  nature:String(item.nature??''),idempotencyKey:String(item.idempotencyKey??'')
})).filter(item=>item.meetingId&&item.membershipId&&item.rubricId&&Number.isFinite(item.amount));

let offlineConfrontationDeferred=false;
const confrontationLabel=(collection,id,fallback)=>{
  const row=collection.find(x=>String(x.id)===String(id));
  return String(row?.displayName??row?.name??row?.title??fallback??id);
};
const showOfflineFinancialConfrontation=preview=>new Promise(resolve=>{
  const rows=Array.isArray(preview?.rows)?preview.rows:[];
  if(!rows.length){resolve({applyIds:[],keepServerIds:[]});return;}
  document.getElementById('offlineFinancialConfrontation')?.remove();
  const decisions=new Map(rows.map(row=>[row.outboxId,row.sameAmount?'APPLY_LOCAL':'']));
  const dialog=document.createElement('dialog');dialog.id='offlineFinancialConfrontation';dialog.className='offline-confrontation-dialog';
  const head=document.createElement('div');head.className='offline-confrontation-head';
  const title=document.createElement('div'),h=document.createElement('h2'),intro=document.createElement('p');
  h.textContent=tx('Confrontation des données au retour en ligne','Data review when returning online');
  intro.textContent=tx(
    'Eco-System a trouvé des modifications enregistrées hors ligne sur cet appareil. Vérifiez ce qui existe déjà et ce que cet appareil propose avant la synchronisation.',
    'Eco-System found changes saved offline on this device. Review what already exists and what this device proposes before syncing.'
  );
  title.append(h,intro);
  const stats=document.createElement('div');stats.className='offline-confrontation-stats';
  const divergent=rows.filter(x=>!x.sameAmount).length,changed=rows.filter(x=>x.serverChangedSinceBaseline).length;
  for(const [value,label] of [[rows.length,tx('modification(s)','change(s)')],[divergent,tx('divergence(s)','difference(s)')],[changed,tx('valeur(s) distante(s) modifiée(s)','server value(s) changed')]]){
    const metric=document.createElement('div');metric.innerHTML='<strong>'+String(value)+'</strong><span>'+label+'</span>';stats.append(metric);
  }
  head.append(title,stats);dialog.append(head);

  const toolbar=document.createElement('div');toolbar.className='offline-confrontation-toolbar';
  const applyAll=document.createElement('button');applyAll.type='button';applyAll.className='primary';applyAll.textContent=tx('Appliquer toutes mes modifications','Apply all my changes');
  const keepAll=document.createElement('button');keepAll.type='button';keepAll.className='secondary';keepAll.textContent=tx('Conserver toutes les données déjà présentes','Keep all existing data');
  const hint=document.createElement('span');hint.className='hint';hint.textContent=tx('Les confirmations identiques restent envoyées afin de conserver leur date de validation.','Identical confirmations are still sent so their validation time is preserved.');
  toolbar.append(applyAll,keepAll,hint);dialog.append(toolbar);

  const wrap=document.createElement('div');wrap.className='matrix-wrap offline-confrontation-wrap';
  const table=document.createElement('table');table.className='meeting-matrix offline-confrontation-table';
  const thead=document.createElement('thead');thead.innerHTML='<tr><th>'+tx('Membre','Member')+'</th><th>'+tx('Rubrique','Rubric')+'</th><th>'+tx('Source','Source')+'</th><th>'+tx('Montant','Amount')+'</th><th>'+tx('Version / date','Version / date')+'</th><th>'+tx('Décision','Decision')+'</th></tr>';table.append(thead);
  const grouped=new Map();
  for(const row of rows){const key=String(row.meetingId);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}
  const decisionButtons=new Map();

  const setDecision=(row,value)=>{
    if(row.sameAmount)value='APPLY_LOCAL';
    decisions.set(row.outboxId,value);
    const pair=decisionButtons.get(row.outboxId);
    if(pair){pair.apply.classList.toggle('active',value==='APPLY_LOCAL');pair.keep.classList.toggle('active',value==='KEEP_SERVER');}
    updateConfirm();
  };
  const bulk=(meetingId,value)=>{for(const row of rows.filter(x=>String(x.meetingId)===String(meetingId)))setDecision(row,value);};
  const renderGroup=(meetingId,groupRows)=>{
    const tbody=document.createElement('tbody');tbody.dataset.meetingId=meetingId;
    const section=document.createElement('tr');section.className='offline-confrontation-session';
    const cell=document.createElement('th');cell.colSpan=6;
    const left=document.createElement('div'),label=document.createElement('strong'),actions=document.createElement('div');
    const meeting=meetings.find(x=>String(x.id)===meetingId);
    label.textContent=meeting?meetingLabel(meeting):tx('Séance ','Meeting ')+meetingId;
    const useLocal=document.createElement('button');useLocal.type='button';useLocal.className='link-btn';useLocal.textContent=tx('Tout appliquer pour cette séance','Apply all for this meeting');
    const useServer=document.createElement('button');useServer.type='button';useServer.className='link-btn';useServer.textContent=tx('Tout conserver pour cette séance','Keep existing for this meeting');
    useLocal.onclick=()=>bulk(meetingId,'APPLY_LOCAL');useServer.onclick=()=>bulk(meetingId,'KEEP_SERVER');
    actions.append(useLocal,useServer);left.append(label,actions);cell.append(left);section.append(cell);tbody.append(section);

    for(const row of groupRows){
      const member=confrontationLabel(members,row.membershipId,row.membershipId),rubric=confrontationLabel(rubrics,row.rubricId,row.rubricId);
      const serverTr=document.createElement('tr');serverTr.className='offline-confrontation-server';
      const localTr=document.createElement('tr');localTr.className='offline-confrontation-local';
      const memberCell=document.createElement('th');memberCell.rowSpan=2;memberCell.textContent=member;
      const rubricCell=document.createElement('th');rubricCell.rowSpan=2;rubricCell.textContent=rubric;
      const serverSource=document.createElement('td');serverSource.textContent=tx('Déjà présent','Existing');
      const serverAmount=document.createElement('td');serverAmount.className='amount';serverAmount.textContent=fmt(row.canonicalAmount);
      const serverMeta=document.createElement('td');serverMeta.textContent='v'+String(row.canonicalVersion)+(row.canonicalUpdatedAt?' · '+date(row.canonicalUpdatedAt):'');
      const localSource=document.createElement('td');localSource.textContent=tx('Cet appareil','This device');
      const localAmount=document.createElement('td');localAmount.className='amount';localAmount.textContent=fmt(row.localAmount);
      const localMeta=document.createElement('td');localMeta.textContent=tx('Enregistré ','Saved ')+date(row.recordedAt);
      const decision=document.createElement('td');decision.rowSpan=2;decision.className='offline-confrontation-decision';
      if(row.sameAmount){
        const same=document.createElement('span');same.className='pill success';same.textContent=tx('Même montant · confirmer','Same amount · confirm');decision.append(same);
      }else{
        const apply=document.createElement('button');apply.type='button';apply.className='secondary';apply.textContent=tx('Appliquer cet appareil','Use this device');
        const keep=document.createElement('button');keep.type='button';keep.className='secondary';keep.textContent=tx('Conserver présent','Keep existing');
        apply.onclick=()=>setDecision(row,'APPLY_LOCAL');keep.onclick=()=>setDecision(row,'KEEP_SERVER');
        decisionButtons.set(row.outboxId,{apply,keep});decision.append(apply,keep);
        if(row.serverChangedSinceBaseline){
          const warn=document.createElement('small');warn.className='offline-confrontation-warning';warn.textContent=tx('La valeur distante a changé depuis votre départ hors ligne.','The server value changed while you were offline.');decision.append(warn);
        }
      }
      serverTr.append(memberCell,rubricCell,serverSource,serverAmount,serverMeta,decision);
      localTr.append(localSource,localAmount,localMeta);
      tbody.append(serverTr,localTr);
    }
    table.append(tbody);
  };
  for(const [meetingId,groupRows] of grouped)renderGroup(meetingId,groupRows);
  wrap.append(table);dialog.append(wrap);

  const footer=document.createElement('div');footer.className='offline-confrontation-footer';
  const later=document.createElement('button');later.type='button';later.className='ghost';later.textContent=tx('Plus tard','Later');
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';
  const unresolved=document.createElement('span');unresolved.className='hint';
  const updateConfirm=()=>{
    const left=rows.filter(row=>!row.sameAmount&&!decisions.get(row.outboxId)).length;
    confirm.disabled=left>0;confirm.textContent=left?tx('Décidez encore '+left+' ligne(s)','Decide '+left+' more row(s)'):tx('Valider et synchroniser','Confirm and sync');
    unresolved.textContent=left?tx(left+' divergence(s) à décider.',''+left+' difference(s) still need a decision.'):'';
  };
  applyAll.onclick=()=>{for(const row of rows)setDecision(row,'APPLY_LOCAL');};
  keepAll.onclick=()=>{for(const row of rows)setDecision(row,row.sameAmount?'APPLY_LOCAL':'KEEP_SERVER');};
  const defer=()=>{dialog.close();dialog.remove();resolve(null);};
  later.onclick=defer;
  dialog.addEventListener('cancel',event=>{event.preventDefault();defer();});
  confirm.onclick=()=>{
    const keepServerIds=rows.filter(row=>decisions.get(row.outboxId)==='KEEP_SERVER').map(row=>row.outboxId);
    const applyIds=rows.filter(row=>decisions.get(row.outboxId)==='APPLY_LOCAL').map(row=>row.outboxId);
    dialog.close();dialog.remove();resolve({applyIds,keepServerIds});
  };
  footer.append(unresolved,later,confirm);dialog.append(footer);document.body.append(dialog);updateConfirm();dialog.showModal();
});
const reviewOfflineFinancialBacklog=async(force=false)=>{
  if(!isManager()||!app.activeGroup?.())return true;
  const pending=app.pendingFinancialCellTargets?.()??[];if(!pending.length)return true;
  if(offlineConfrontationDeferred&&!force)return false;
  const preview=await app.previewOfflineFinancialConfrontation();
  if(!preview.rows?.length)return true;
  // No remote change since this device's baseline = no conflict to arbitrate.
  // Sync automatically; only real concurrent divergence opens the confrontation
  // dialog. This keeps reconnect under five seconds without hiding conflicts.
  const clockReview=pending.some(x=>x.status==='CONFLICT'&&x.businessStatus==='CLOCK_REVIEW');
  if(!force&&!clockReview&&preview.rows.every(row=>row.sameAmount||!row.serverChangedSinceBaseline))return true;
  for(const row of preview.rows)if(!row.sameAmount&&row.serverChangedSinceBaseline)markCriticalFinancialConflict({...row,amount:row.localAmount});
  const reviewGroup=String(app.activeGroup());
  const decision=await showOfflineFinancialConfrontation(preview);
  if(String(app.activeGroup())!==reviewGroup)return false;
  if(!decision){offlineConfrontationDeferred=true;return false;}
  const retained=await app.resolveOfflineFinancialConfrontation(preview,decision);
  financialPendingTargets=new Map((app.pendingFinancialCellTargets?.()??[]).map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),x]));
  for(const row of retained){
    const key=financialCellKey(row.membershipId,row.rubricId,row.meetingId);
    financialOptimisticValues.delete(key);forgetConfirmedCell(key);
    rememberConfirmedCell(key,{...row,amount:row.retainedAmount,cellVersion:row.retainedVersion});
    patchFinancialDomCell({...row,amount:row.retainedAmount,cellVersion:row.retainedVersion,preservePending:false});
    setCellSyncedState(row);
    window.dispatchEvent(new CustomEvent('eco:financial-data-changed',{detail:{...row,amount:row.retainedAmount,soft:true,reviewed:true}}));
  }
  offlineConfrontationDeferred=false;renderOutbox();
  return true;
};
const markCriticalFinancialConflict=detail=>{
  const selector=`.matrix-cell-entry[data-meeting-id="${CSS.escape(String(detail.meetingId??''))}"][data-membership-id="${CSS.escape(String(detail.membershipId??''))}"][data-rubric-id="${CSS.escape(String(detail.rubricId??''))}"]`;
  for(const cell of document.querySelectorAll(selector)){
    cell.classList.add('is-conflict','is-critical-conflict');
    const state=cell.querySelector('.cell-save-state');if(state){state.hidden=false;state.textContent=tx(`CONFLIT : cet appareil avait ${fmt(detail.amount)} ; une autre valeur a été synchronisée. Vérification obligatoire.`,`CONFLICT: this device had ${fmt(detail.amount)}; another value was synchronized. Review required.`);}
  }
  try{showFinancialAlert({title:tx('Conflit financier à résoudre','Financial conflict to resolve'),message:tx(`La même cellule a été modifiée sur plusieurs appareils. Valeur locale : ${fmt(detail.amount)}. Aucune valeur divergente n’a été écrasée silencieusement.`,`The same cell was edited on multiple devices. Local value: ${fmt(detail.amount)}. No divergent value was silently overwritten.`),conflict:true,closed:true,action:{view:'sessions',meetingId:detail.meetingId,membershipId:detail.membershipId,rubricId:detail.rubricId,label:tx('Voir la cellule','Open cell')}});}catch{}
  if((app.pendingFinancialCellTargets?.()??[]).length){
    const bar=document.querySelector('#financialAlertBar');
    if(bar)bar.dataset.criticalCellKey=financialCellKey(String(detail.membershipId),String(detail.rubricId),String(detail.meetingId));
    if(bar&&!bar.querySelector('[data-financial-confrontation]')){
      const review=document.createElement('button');review.type='button';review.dataset.financialConfrontation='1';review.textContent=tx('Comparer les montants','Compare amounts');
      review.onclick=()=>{offlineConfrontationDeferred=false;void resumeOnline({forceConfrontation:true}).catch(fail);};bar.append(review);
    }
  }
};
const renderPersistedFinancialConflicts=()=>{
  for(const item of app.outboxItems?.()??[]){
    if(!['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'].includes(item.type)||item.status!=='CONFLICT')continue;
    const p=item.payload??{};markCriticalFinancialConflict({meetingId:p.meetingId,membershipId:p.membershipId,rubricId:p.rubricId,amount:Number(p.targetAmount??0),idempotencyKey:item.idempotencyKey});
  }
};
const rememberTargetsConfirmedBySync=before=>{
  const byKey=new Map((app.outboxItems?.()??[]).map(item=>[String(item.idempotencyKey??''),item]));
  for(const item of before){
    const stored=byKey.get(item.idempotencyKey);
    if(stored?.status==='CONFIRMED'){
      if(stored.lastResult?.status==='SUPERSEDED'){
        forgetConfirmedCell(item.key);financialOptimisticValues.delete(item.key);
        const acceptedAmount=Number(stored.lastResult?.canonicalAmount);
        if(Number.isSafeInteger(acceptedAmount))patchFinancialDomCell({
          ...item,amount:acceptedAmount,cellVersion:Number(stored.lastResult?.cellVersion),
          preservePending:false});
      }else rememberConfirmedCell(item.key,{
        ...item,amount:Number(stored.lastResult?.canonicalAmount??item.amount),
        cellVersion:Number(stored.lastResult?.cellVersion??item.cellVersion)});
    }
    else if(stored?.status==='CONFLICT'){forgetConfirmedCell(item.key);financialOptimisticValues.delete(item.key);markCriticalFinancialConflict(item);}
  }
};
const scheduleFinancialOutboxRecovery=detail=>{
  const key=financialCellKey(String(detail.membershipId??''),String(detail.rubricId??''),String(detail.meetingId??''));
  if(financialRetryTimers.has(key)||navigator.onLine===false)return;
  // One validation may cause one bounded recovery attempt only. If the network
  // is still unavailable, the durable Outbox waits for a real event:
  // online, live-connected, focus/pageshow or explicit Actualiser. No timer loop.
  const run=async()=>{
    financialRetryTimers.delete(key);
    if(navigator.onLine===false)return;
    try{
      // Use the same serialized, reviewed recovery path as a network return.
      // In particular an older SUPERSEDED target must never be promoted back
      // over the canonical amount returned by the server.
      await resumeOnline();
    }catch(error){
      networkRecoveryNeeded=true;
      console.info('Targeted financial Outbox retry deferred until a real connectivity event',error);
    }
  };
  const timer=setTimeout(run,850);financialRetryTimers.set(key,timer);
};

let financialSnapshotTimer=0,financialSnapshotBusy=false,financialSnapshotPrimed=false,financialSnapshotGroup='';
const financialSnapshotState=new Map();
const pollCanonicalFinancialSnapshot=async()=>{
  if(financialSnapshotBusy||navigator.onLine===false||document.visibilityState!=='visible'||!app.activeGroup()||!isManager()||!document.querySelector('.canonical-financial-matrix'))return;
  const activeGroup=String(app.activeGroup()??'');
  if(financialSnapshotGroup!==activeGroup){financialSnapshotGroup=activeGroup;financialSnapshotState.clear();financialSnapshotPrimed=false;}
  financialSnapshotBusy=true;
  try{
    const data=await app.financialCellSnapshot(),next=new Map();
    for(const row of data.cells??[]){
      const key=financialCellKey(String(row.membershipId),String(row.rubricId),String(row.meetingId)),signature=String(row.cellVersion??0)+'|'+String(row.amount??0)+'|'+String(row.updatedAt??'');
      next.set(key,signature);
      const previous=financialSnapshotState.get(key),optimistic=financialOptimisticValues.get(key),canonicalAmount=Number(row.amount??0);
      if(Number.isFinite(optimistic)&&canonicalAmount===Number(optimistic)&&!cellHasPendingLocal(row)){
        financialOptimisticValues.delete(key);
        patchFinancialDomCell({meetingId:row.meetingId,membershipId:row.membershipId,rubricId:row.rubricId,amount:canonicalAmount,cellVersion:Number(row.cellVersion??0),remote:false});
      }else if(financialSnapshotPrimed&&previous!==signature&&!cellHasPendingLocal(row)){
        financialOptimisticValues.delete(key);
        patchFinancialDomCell({meetingId:row.meetingId,membershipId:row.membershipId,rubricId:row.rubricId,amount:canonicalAmount,cellVersion:Number(row.cellVersion??0),remote:true});
        if(row.reviewRequired)highlightRemoteFinancialCell({meetingId:row.meetingId,membershipId:row.membershipId,rubricId:row.rubricId,newAmount:Math.abs(canonicalAmount),cellVersion:Number(row.cellVersion??0),actorId:String(row.actorId??''),actorName:row.actorId?actorDisplayName(String(row.actorId)):tx('Autre gestionnaire','Another manager'),operationType:'CANONICAL_SNAPSHOT'});
      }
    }
    financialSnapshotState.clear();for(const [k,v] of next)financialSnapshotState.set(k,v);financialSnapshotPrimed=true;
  }catch{}
  finally{financialSnapshotBusy=false;}
};
const ensureFinancialSnapshotPolling=()=>{
  if(FREE_CONSERVATION_MODE)return;
  if(financialSnapshotTimer)return;
  financialSnapshotTimer=setInterval(()=>{void pollCanonicalFinancialSnapshot();},30000);
  void pollCanonicalFinancialSnapshot();
};

let financialWorkUI;
const financialLocalSubmissions=new Map();
const ensureFinancialWorkUI=()=>financialWorkUI??=createFinancialWorkUI({app,tx,notify:toast,resume:()=>resumeOnline(),isLiveConnected:()=>liveChannelConnected,
  waitForEntries:async(meetingId,membershipId)=>{await Promise.all([...financialLocalSubmissions.values()].filter(x=>x.meetingId===meetingId&&x.membershipId===membershipId).map(x=>x.done));},
  memberName:id=>members.find(x=>x.id===id)?.displayName??id,
  openDetail:target=>void detailUI.open(target.type,target.id,false,true),
  summary:async(meetingId,membershipId,ids,options={})=>{
    const local=()=>{
      const ordered=meetings.filter(x=>x.status!=='cancelled').slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt))),beforeIds=ordered.slice(0,ordered.findIndex(x=>x.id===meetingId)).map(x=>x.id);
      const selected=[...new Set([...ids,...activeFinancialRubrics().filter(r=>exactCellVersion(membershipId,r.id,meetingId)>0||exactCellAmount(membershipId,r.id,meetingId)!==0).map(r=>r.id)])];
      const lines=selected.map(rubricId=>{const current=exactCellAmount(membershipId,rubricId,meetingId),before=beforeIds.reduce((n,id)=>n+exactCellAmount(membershipId,rubricId,id),0),meta=financialCellMetadata.get(financialCellKey(membershipId,rubricId,meetingId));return{rubricId,rubricName:rubrics.find(x=>x.id===rubricId)?.name??rubricId,before,current,total:before+current,cellVersion:exactCellVersion(membershipId,rubricId,meetingId),authorId:meta?.actorId,authorName:meta?.actorId?actorDisplayName(meta.actorId):'',updatedAt:meta?.at};});return{local:true,generatedAt:new Date().toISOString(),lines,totals:Object.fromEntries(['before','current','total'].map(k=>[k,lines.reduce((n,x)=>n+x[k],0)]))};
    };
    if(options.local||navigator.onLine===false)return local();
    const data=await app.financialPassageSummary(meetingId,membershipId,ids,true);if(data.projectionSource==='LOCAL_CACHE')return local();return data;
  },
  edit:(selection,rubricId)=>{const cell=[...document.querySelectorAll('.matrix-cell-entry')].find(x=>x.dataset.meetingId===selection.meetingId&&x.dataset.membershipId===selection.membershipId&&x.dataset.rubricId===rubricId);cell?.scrollIntoView({block:'center',inline:'nearest'});cell?.querySelector('input')?.focus();}
});
const needsFinancialEntryPosition=rubric=>financialNatureForRubric(rubric)==='REPAYMENT'||rubric?.activityPlan?.kind==='TONTINE'||String(rubric?.facets?.custom?.systemKey??'')==='TONTINE'||/^tontine(?:\b|\d)/i.test(String(rubric?.name??''));
const showFinancialEntryPosition=(holder,position,delta=0)=>{
  let hint=holder.querySelector('.cell-financial-position');if(!hint){hint=document.createElement('small');hint.className='cell-financial-position';hint.setAttribute('role','status');holder.append(hint);}
  if(!position){hint.textContent=tx('Situation à vérifier à la reconnexion ; aucun solde serveur confirmé.','Position to verify on reconnection; no confirmed server balance.');return;}
  const prefix=position.projectionSource==='LOCAL_CACHE'?tx('Dernière situation connue · ','Last known position · '):'';
  if(position.kind==='REPAYMENT')hint.textContent=prefix+(position.totalDue===0?tx('Dette apurée · restant dû : 0 F CFA. Aucun nouveau remboursement.','Debt cleared · remaining due: 0 XAF. No further repayment.'):tx('Dette due : ','Debt due: ')+fmt(position.totalDue)+tx(' · capital ',' · principal ')+fmt(position.principal)+tx(' · intérêts dus ',' · due interest ')+fmt(position.interest)+tx(' · autres dettes ',' · other debts ')+fmt(position.otherDebt)+(delta?tx(' · restant après la saisie en attente : ',' · remaining after the pending entry: ')+fmt(position.totalDue-delta):''));
  else if(position.applies)hint.textContent=prefix+(!position.eligible?tx('Non inscrit à cette tontine · aucune nouvelle cotisation.','Not enrolled in this tontine · no new contribution.'):!position.configured?tx('Participation reconnue ; montant par part à préciser dans les règles de la tontine.','Participation found; set the per-share amount in tontine rules.'):tx('Par séance : ','Per meeting: ')+fmt(position.periodic)+' · '+position.sessions+tx(' séance(s), cumul attendu : ',' meeting(s), expected total: ')+fmt(position.expectedCumulative)+' · '+(position.coveredByAdvance?tx('déjà couvert par avance : ','already covered by prepayment: ')+fmt(position.coveredByAdvance)+' · ':'')+(position.remainingDue?tx('reste à cotiser : ','still to contribute: ')+fmt(position.remainingDue):position.advance?tx('avance : ','prepaid: ')+fmt(position.advance):tx('à jour','up to date')));
};
const submitFinancialCellElement=async validate=>{
    const holder=validate?.closest?.('.matrix-cell-entry');
    const input=holder?.querySelector?.('.cell-target-input');
    const stateLine=holder?.querySelector?.('.cell-save-state');
    const currentLabel=holder?.querySelector?.('.cell-current');
    if(!holder||!input||!stateLine||!currentLabel)return;
    const membershipId=String(holder.dataset.membershipId??''),rubricId=String(holder.dataset.rubricId??''),meetingId=String(holder.dataset.meetingId??'');
    const member=members.find(x=>x.id===membershipId),rubric=rubrics.find(x=>x.id===rubricId);
    if(!member||!rubric||!meetingId){traceFinancialCell('CELL_FAIL',{membershipId,rubricId,meetingId,error:'CELL_CONTEXT_NOT_FOUND'});fail(new Error('CELL_CONTEXT_NOT_FOUND'));return;}
    const cellKey=financialCellKey(membershipId,rubricId,meetingId),wrap=holder.closest('.matrix-wrap'),wrapState=wrap?{left:wrap.scrollLeft,top:wrap.scrollTop}:null;
    const clearRemoteDraft=()=>{void Promise.resolve(identityLiveUI.publishSignal?.('FINANCIAL_DRAFT_CLEAR',{kind:'FINANCIAL_CELL',meetingId,membershipId,rubricId})).catch(()=>{});};
    if(holder.dataset.submitting==='1'){traceFinancialCell('CELL_SUBMIT_BUSY',{cellKey});return;}
    holder.classList.remove('is-conflict');holder.dataset.submitting='1';
    let localComplete;const localSubmission={meetingId,membershipId,done:new Promise(resolve=>{localComplete=resolve;})};financialLocalSubmissions.set(cellKey,localSubmission);
    const nature=financialNatureForRubric(rubric),signedCurrent=exactCellAmount(membershipId,rubricId,meetingId),current=Math.abs(signedCurrent),previousIcon=validate.textContent;
    let target=Number.NaN,optimisticStaged=false;
    const setCellState=(state,message='')=>{
      const selector=financialLiveSelector({meetingId,membershipId,rubricId}),cells=new Set([holder,...document.querySelectorAll(selector)]);
      for(const cell of cells){
        cell.dataset.saveState=state;cell.classList.toggle('is-failed',state==='FAILED');cell.classList.toggle('is-confirmed',state==='CONFIRMED');
        const line=cell.querySelector('.cell-save-state')??document.createElement('small');line.className='cell-save-state';line.setAttribute('aria-live','polite');line.hidden=!message;line.textContent=message;if(!line.isConnected)cell.append(line);
      }
    };
    traceFinancialCell('CELL_SUBMIT_INVOKED',{cellKey,membershipId,rubricId,meetingId,inputValue:input.value,current,nature});
    try{
      clearFail();
      const raw=input.value.trim();
      if(raw===''){setCellState('IDLE');return;}
      target=Number(raw);
      if(!Number.isSafeInteger(target)||target<0)throw new Error('INVALID_CONTRIBUTION_AMOUNT');
      if(!await ensureFinancialWorkUI().before(meetingId,membershipId,rubricId)){setCellState('IDLE');return;}
      // A window/account handover can invalidate the early group clock warm-up.
      // Reuse a valid anchor, or obtain one before recording a new online intent.
      // Existing offline intentions and their original timestamps are never rewritten.
      await app.warmFinancialClock?.();
      setCellState('SAVING_LOCAL',tx('Enregistrement…','Saving…'));
      traceFinancialCell('CELL_SUBMIT',{cellKey,membershipId,rubricId,meetingId,target,current,nature});
      if(target===current&&nature!=='CONTRIBUTION'){
        input.value='';clearFinancialCellDraft(cellKey);clearRemoteDraft();setCellState('IDLE');
        toast(tx('Aucun changement : cette valeur est déjà enregistrée.','No change: this value is already recorded.'));
        return;
      }
      let entryPosition=null;
      if(needsFinancialEntryPosition(rubric))try{entryPosition=await app.financialEntryPosition({meetingId,membershipId,rubricId});showFinancialEntryPosition(holder,entryPosition);}catch(error){if(navigator.onLine!==false&&!app.serverBudgetState?.().blocked&&error.message!=='NETWORK_UNAVAILABLE')throw error;showFinancialEntryPosition(holder,null);}
      if(nature==='REPAYMENT'){
        if(target<current)throw Error(tx('Une baisse de remboursement exige une correction tracée de l’opération financière. La valeur enregistrée est conservée.','Reducing a repayment requires a traced financial correction. The recorded value is preserved.'));
        if(entryPosition&&target-current>entryPosition.maximumPayment)throw Error(entryPosition.totalDue===0?tx('Dette totalement apurée : aucun nouveau remboursement à encaisser.','Debt fully cleared: no additional repayment to collect.'):tx('Dépassement : dette globale due ','Overpayment: total debt due ')+fmt(entryPosition.totalDue)+tx('. Valeur totale maximale de cette cellule : ','. Maximum total value for this cell: ')+fmt(current+entryPosition.maximumPayment));
      }
      const meeting=meetings.find(x=>x.id===meetingId);let reason='';
      if(target!==current&&(current>0||meeting?.status==='closed')){
        reason=prompt(tx(`Motif de la modification ${fmt(current)} → ${fmt(target)} :`,`Reason for change ${fmt(current)} → ${fmt(target)}:`),tx('Correction de la valeur de la cellule','Cell value correction'))??'';
        if(!reason.trim()){setCellState('IDLE');return;}
      }
      if(entryPosition?.kind==='TONTINE'&&entryPosition.applies&&target>current){
        if(!entryPosition.eligible)throw Error(tx('Ce membre n’est pas inscrit à cette tontine. Vérifiez ses participations avant de cotiser.','This member is not enrolled in this tontine. Check participation before collecting.'));
        if(entryPosition.configured&&target>entryPosition.maximumWithoutAdvance){
          const surplus=target-entryPosition.maximumWithoutAdvance;
          if(!window.confirm(tx('Le surplus de '+fmt(surplus)+' sera une avance pour les prochaines séances. Confirmer cette avance ?','The extra '+fmt(surplus)+' will prepay future meetings. Confirm this prepayment?'))){setCellState('IDLE');return;}
          reason='[AVANCE] '+(reason||tx('Avance déclarée pour les séances suivantes','Declared prepayment for future meetings'));
        }else if(entryPosition.configured&&target!==entryPosition.periodic&&!reason){
          reason=prompt(tx('Montant différent de la cotisation normale '+fmt(entryPosition.periodic)+'. Motif (rappel, paiement partiel…) :','Amount differs from the usual '+fmt(entryPosition.periodic)+'. Reason (arrears, partial payment…):'),entryPosition.arrearsBefore?tx('Rappel de cotisations','Arrears payment'):tx('Cotisation partielle','Partial contribution'))??'';
          if(!reason.trim()){setCellState('IDLE');return;}
        }
      }
      validate.disabled=true;input.disabled=true;validate.textContent='…';holder.classList.add('is-saving');
      let result;
      const displayTarget=(nature==='LOAN'||nature==='OUTFLOW')?-target:target;
      const stageOptimisticValue=()=>{optimisticStaged=true;
        financialOptimisticValues.set(cellKey,displayTarget);
        patchFinancialDomCell({meetingId,membershipId,rubricId,amount:displayTarget,preservePending:true});
        currentLabel.textContent=fmt(displayTarget);
      };
      if(nature==='CONTRIBUTION'){
        // A zero or identical amount may itself be a newer recorded intent.
        // Display the local working value immediately. Transport can be slow or
        // unavailable, but the cell must not visually jump back while the
        // durable command is being queued/sent.
        stageOptimisticValue();
        result=await app.setFinancialCellTarget({meetingId,membershipId,rubricId,targetAmount:target,currentAmount:current,currentVersion:exactCellVersion(membershipId,rubricId,meetingId),reason:reason.trim(),deferSync:true});
        if(Number.isFinite(Number(result?.cellVersion)))financialCellVersions.set(JSON.stringify([meetingId,membershipId,rubricId,'XAF']),Number(result.cellVersion));
      }else{
        if(current>0&&nature!=='REPAYMENT')throw Error('SPECIALIZED_FINANCIAL_CORRECTION_REQUIRED');
        stageOptimisticValue();
        result=await app.recordFinancialSheetEntry({membershipId,meetingId,rubric,amount:nature==='REPAYMENT'?target-current:target,targetAmount:nature==='REPAYMENT'?target:undefined,baselineAmount:current,baselineVersion:exactCellVersion(membershipId,rubricId,meetingId),reason:reason.trim()||undefined,deferSync:true});
        if(nature==='REPAYMENT'&&entryPosition)showFinancialEntryPosition(holder,entryPosition,target-current);
      }
      patchFinancialDomCell({meetingId,membershipId,rubricId,amount:displayTarget,cellVersion:result?.cellVersion,preservePending:true});
      if(result?.status==='CONSENSUS_REQUIRED'){
        currentLabel.textContent=fmt(displayTarget);financialReviewTargets.delete(cellKey);
        holder.classList.add('pending-consensus');setCellState('CONFIRMED',tx('Proposition enregistrée · validation d’un second responsable requise','Proposal saved · second manager approval required'));
        traceFinancialCell('CELL_REVIEW_REQUIRED',{cellKey,target,current});toast(tx('Modification proposée : elle est enregistrée et attend la décision des gestionnaires.','Change proposal saved and awaiting manager decision.'));
      }else if(result?.status==='QUEUED_SYNC'||result?.queued){
        currentLabel.textContent=fmt(displayTarget);
        if(nature==='CONTRIBUTION'){
          financialPendingTargets.set(cellKey,{membershipId,rubricId,meetingId,targetAmount:target,baselineValue:Number(result?.outbox?.payload?.baselineValue??current),baselineVersion:Number(result?.outbox?.payload?.baselineVersion??exactCellVersion(membershipId,rubricId,meetingId)),status:'PENDING',businessStatus:''});
        }else{
          financialPendingSheetEntries=financialPendingSheetEntries.filter(x=>!(x.membershipId===membershipId&&x.rubricId===rubricId&&x.meetingId===meetingId));
          financialPendingSheetEntries.push({membershipId,rubricId,meetingId,amount:nature==='REPAYMENT'?target-current:target,status:'PENDING',nature});
        }
        setCellState('QUEUED_OFFLINE',tx('Enregistré sur cet appareil · synchro en attente','Saved on this device · pending sync'));
        traceFinancialCell('CELL_LOCAL_COMMIT',{cellKey,target,status:'QUEUED'});
        toast(tx('✓ Valeur enregistrée sur cet appareil · synchronisation automatique en attente.','✓ Value saved on this device · automatic sync pending.'));
        if(navigator.onLine!==false)scheduleFinancialOutboxRecovery({meetingId,membershipId,rubricId,amount:displayTarget,nature});
      }else if(result?.selfBenefit){
        currentLabel.textContent=fmt(displayTarget);financialReviewTargets.delete(cellKey);
        setCellState('CONFIRMED',tx('Correction appliquée · vérification indépendante signalée','Correction saved · independent review required'));
        traceFinancialCell('CELL_REVIEW_REQUIRED',{cellKey,target,current,selfBenefit:true});
        toast(tx('⚠ Correction de votre propre situation : ancienne valeur, contrepassation et nouvelle valeur sont tracées. Un autre responsable habilité doit la vérifier.','⚠ Correction of your own situation: previous value, reversal and new value are traced. Another authorized manager must review it.'));
      }else if(result?.requiresIndependentReview){
        currentLabel.textContent=fmt(displayTarget);financialReviewTargets.delete(cellKey);
        setCellState('CONFIRMED',tx('Correction appliquée · accusé de réception attendu','Correction saved · second approval required'));
        traceFinancialCell('CELL_REVIEW_REQUIRED',{cellKey,target,current});
        toast(tx('Correction enregistrée avec ancienne valeur, contrepassation et nouvelle valeur. Un autre responsable habilité doit la vérifier avant validation institutionnelle.','Correction recorded with previous value, reversal and new value. Another authorized manager must review it before institutional confirmation.'));
      }else{
        financialReviewTargets.delete(cellKey);currentLabel.textContent=fmt(displayTarget);setCellState('CONFIRMED',tx('✓ Validé','✓ Confirmed'));traceFinancialCell('CELL_ACK',{cellKey,target,current});
        toast(nature==='LOAN'?tx('Prêt décaissé : la caisse diminue et la dette du membre est créée.','Loan disbursed: cash decreases and the member debt is created.'):tx('Valeur enregistrée.','Value saved.'));
      }
      input.value='';clearFinancialCellDraft(cellKey);clearRemoteDraft();renderOutbox();
      const preservePending=Boolean(result?.status==='QUEUED_SYNC'||result?.queued);
      const superseded=String(result?.status??'')==='SUPERSEDED';
      const canonicalSigned=superseded?Number(result?.canonicalAmount??signedCurrent):displayTarget;
      if(superseded){
        // A later recorded intent on another phone prevailed. Show its value,
        // never the sender's outdated target and never a false green ACK.
        financialOptimisticValues.delete(cellKey);forgetConfirmedCell(cellKey);
        holder.classList.add('is-conflict');
        setCellState('CONFLICT',tx('Saisie antérieure conservée dans l’historique · montant récent retenu : ',
          'Earlier entry retained in history · latest value kept: ')+fmt(canonicalSigned));
        toast(tx('Un autre enregistrement plus récent prévaut. Votre saisie reste contestable.',
          'A later recording prevails. Your entry remains available for review.'));
      }
      const unresolvedConsensus=String(result?.status??'')==='CONSENSUS_REQUIRED';
      if(!preservePending&&!unresolvedConsensus&&!superseded){rememberConfirmedCell(cellKey,{amount:canonicalSigned,cellVersion:Number.isFinite(Number(result?.cellVersion))?Number(result.cellVersion):exactCellVersion(membershipId,rubricId,meetingId)+1,meetingId,membershipId,rubricId});const changedAt=new Date().toISOString(),actorId=String(app.currentActor?.()??'');financialCellMetadata.set(cellKey,{actorId,at:changedAt,stamp:Date.now()});holder.dataset.lastActor=actorId;stampEditorColor(holder,actorId);holder.dataset.lastUpdatedAt=changedAt;holder.title=tx(`Dernière modification : ${actorDisplayName(actorId)||tx('Gestionnaire','Manager')} · ${date(changedAt)}`,`Last change: ${actorDisplayName(actorId)||tx('Gestionnaire','Manager')} · ${date(changedAt)}`);}
      patchFinancialDomCell({meetingId,membershipId,rubricId,amount:canonicalSigned,cellVersion:result?.cellVersion,preservePending});
      focusNextFinancialInput(holder,wrapState);
      window.dispatchEvent(new CustomEvent('eco:financial-data-changed',{detail:{meetingId,membershipId,rubricId,amount:canonicalSigned,cellVersion:result?.cellVersion,soft:true,preservePending}}));
      // In free-conservation mode the transaction response + WebSocket event are
      // authoritative. No D1 snapshot GET is triggered after each cell.
      if(!preservePending&&!FREE_CONSERVATION_MODE)void pollCanonicalFinancialSnapshot();
    }catch(e){
      const code=e instanceof Error?e.message:String(e);
      traceFinancialCell('CELL_FAIL',{cellKey,target:Number.isFinite(target)?target:Number(input.value||0),current,error:code});
      // A rejected command must never leave the optimistic working value looking
      // like a confirmed mutation.
      if(optimisticStaged)financialOptimisticValues.delete(cellKey);
      if(['CELL_VALUE_CONFLICT','CELL_VERSION_CONFLICT','CELL_CLOCK_REVIEW_REQUIRED'].includes(code)){
        financialOptimisticValues.delete(cellKey);holder.classList.add('is-conflict');markCriticalFinancialConflict({meetingId,membershipId,rubricId,amount:Number.isFinite(target)?target:Number(input.value||0)});
        setCellState('CONFLICT',tx('Une autre saisie existe · resynchronisation de cette cellule…','Another entry exists · resynchronizing this cell…'));
        try{
          await refreshFinancialProjectionSilently({meetingId,membershipId,rubricId,remote:true});
          setCellState('CONFLICT',tx('Cellule resynchronisée · vérifiez la valeur affichée puis validez de nouveau si nécessaire','Cell resynchronized · check the displayed value and confirm again if needed'));
        }catch{}
        fail(new Error(code));return;
      }
      if(optimisticStaged)patchFinancialDomCell({meetingId,membershipId,rubricId,amount:signedCurrent,preservePending:false});
      setCellState('FAILED',tx('Échec : ','Failed: ')+code);fail(e);
    }finally{
      localComplete();if(financialLocalSubmissions.get(cellKey)===localSubmission)financialLocalSubmissions.delete(cellKey);
      delete holder.dataset.submitting;validate.disabled=false;input.disabled=false;validate.textContent=previousIcon;holder.classList.remove('is-saving');
    }
};

const makeFinancialEntryCell=({member,rubric,meetingId,editable=true})=>{
    ensureFinancialStorageScope();
    const holder=document.createElement('div');holder.className='matrix-cell matrix-cell-entry';holder.dataset.membershipId=member.id;holder.dataset.rubricId=rubric.id;holder.dataset.meetingId=meetingId;holder.tabIndex=-1;
    const persistentCellKey=financialCellKey(member.id,rubric.id,meetingId),nature=financialNatureForRubric(rubric),signedCurrent=exactCellAmount(member.id,rubric.id,meetingId),current=Math.abs(signedCurrent),currentLabel=document.createElement('strong');
    currentLabel.className='cell-current'+(signedCurrent<0?' is-negative':'');currentLabel.textContent=fmt(signedCurrent);holder.append(currentLabel);
    const meta=financialCellMetadata.get(persistentCellKey);
    if(meta?.actorId||meta?.at){if(meta.actorId)stampEditorColor(holder,meta.actorId);const actor=meta.actorId?actorDisplayName(meta.actorId):tx('Gestionnaire','Manager'),when=meta.at?date(meta.at):'';holder.dataset.lastActor=String(meta.actorId??'');holder.dataset.lastUpdatedAt=String(meta.at??'');holder.title=tx(`Dernière modification : ${actor}${when?' · '+when:''}`,`Last change: ${actor}${when?' · '+when:''}`);}
    const pendingState=exactCellPendingState(member.id,rubric.id,meetingId);
    if(pendingState.pending){
      const pendingBadge=document.createElement('small');pendingBadge.className='cell-sync-state '+(pendingState.kind==='REVIEW'?'review':'pending');
      pendingBadge.textContent=pendingState.kind==='REVIEW'
        ?(financialReviewTargets.get(persistentCellKey)?.source==='RELAY'
          ?tx('Divergence Eco Relay · confrontation requise','Eco Relay divergence · review required')
          :tx('Proposition enregistrée · validation d’un second responsable requise','Proposal saved · second manager approval required'))
        :pendingState.kind==='RELAY'
          ?tx('Reçu via Eco Relay · serveur non requis pour continuer','Received via Eco Relay · server not required to continue')
          :tx('Enregistré sur cet appareil · synchro en attente','Saved on this device · pending sync');
      holder.append(pendingBadge);holder.classList.add(pendingState.kind==='REVIEW'?'has-review-pending':pendingState.kind==='RELAY'?'has-relay-pending':'has-local-pending');
      if(pendingState.kind==='REVIEW')holder.classList.add('is-conflict','is-critical-conflict');
      if(Number.isSafeInteger(pendingState.targetAmount)&&pendingState.targetAmount>=0&&pendingState.kind==='REVIEW'){
        const proposed=document.createElement('small');proposed.className='cell-proposed-value';proposed.textContent=tx('Proposé : ','Proposed: ')+fmt(pendingState.targetAmount);holder.append(proposed);
      }
    }
    if(nature==='LOAN'){const badge=document.createElement('small');badge.className='cell-nature negative';badge.textContent=tx('Sortie / dette','Outflow / debt');holder.append(badge);}
    if(!editable)return holder;
    const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.inputMode='numeric';input.className='cell-target-input';input.placeholder=current>0?tx('Modifier…','Change…'):tx('Saisir…','Enter…');input.setAttribute('aria-label',tx('Nouvelle valeur totale','New total value'));
    const restoredDraft=financialCellDrafts.get(persistentCellKey);if(restoredDraft!==undefined)input.value=String(restoredDraft);
    let typingTimer=0,typingActive=false,lastTypingSignal=0,draftAnnounced=false;
    const liveSignalsEnabled=Boolean(identityLiveUI?.publishSignal);
    const signalPayload=()=>({kind:'FINANCIAL_CELL',meetingId,membershipId:member.id,rubricId:rubric.id});
    const sendSignal=type=>{if(liveSignalsEnabled)void Promise.resolve(identityLiveUI.publishSignal(type,signalPayload())).catch(()=>{});};
    const stopTyping=()=>{if(typingTimer){clearTimeout(typingTimer);typingTimer=0;}if(typingActive){typingActive=false;sendSignal('TYPING_STOP');}};
    const announceDraft=()=>{if(!input.value.trim()){if(draftAnnounced){draftAnnounced=false;sendSignal('FINANCIAL_DRAFT_CLEAR');}return;}if(!draftAnnounced){draftAnnounced=true;sendSignal('FINANCIAL_DRAFT');}};
    const loadEntryPosition=()=>{if(needsFinancialEntryPosition(rubric))void app.financialEntryPosition({meetingId,membershipId:member.id,rubricId:rubric.id}).then(position=>{if(holder.isConnected)showFinancialEntryPosition(holder,position);}).catch(()=>{if(holder.isConnected)showFinancialEntryPosition(holder,null);});};
    const reviewBeforeEntering=()=>{
      input.readOnly=true;
      return ensureFinancialWorkUI().visit(meetingId,member.id).then(allowed=>{
        input.readOnly=false;
        if(allowed&&input.isConnected){input.focus({preventScroll:true});loadEntryPosition();}else input.blur();
        return allowed;
      }).catch(error=>{input.readOnly=false;input.blur();fail(error);return false;});
    };
    // Capture the first pointer event on the entire cell, before input focus,
    // validation or dictation. Keyboard focus uses the same gate below.
    holder.addEventListener('pointerdown',event=>{
      if(!ensureFinancialWorkUI().needsReview(meetingId,member.id))return;
      event.preventDefault();event.stopImmediatePropagation();
      holder.dataset.memberReviewBlocked='1';void reviewBeforeEntering().finally(()=>{delete holder.dataset.memberReviewBlocked;});
    },true);
    holder.addEventListener('click',event=>{
      if(holder.dataset.memberReviewBlocked!=='1')return;
      delete holder.dataset.memberReviewBlocked;event.preventDefault();event.stopImmediatePropagation();
    },true);
    input.addEventListener('focus',()=>{
      const work=ensureFinancialWorkUI();
      if(work.needsReview(meetingId,member.id)){
        void reviewBeforeEntering();
        return;
      }
      sendSignal('CELL_FOCUS');announceDraft();loadEntryPosition();
    });
    input.addEventListener('input',()=>{saveFinancialCellDraft(persistentCellKey,input.value);announceDraft();if(!typingActive||Date.now()-lastTypingSignal>=1000){typingActive=true;lastTypingSignal=Date.now();sendSignal('TYPING');}if(typingTimer)clearTimeout(typingTimer);typingTimer=setTimeout(stopTyping,2500);});
    input.addEventListener('blur',()=>{stopTyping();announceDraft();sendSignal('CELL_BLUR');});
    const validate=document.createElement('button');validate.type='button';validate.className='cell-validate';validate.textContent='✓';validate.title=tx('Valider la valeur totale','Confirm total value');validate.setAttribute('aria-label',tx('Valider la saisie','Confirm entry'));
    const liveLine=document.createElement('small');liveLine.className='cell-live-presence';liveLine.setAttribute('aria-live','polite');liveLine.hidden=true;
    const remoteDraftAuthors=remoteDraftNames(persistentCellKey);
    if(remoteDraftAuthors.length){holder.classList.add('live-cell-draft');holder.dataset.remoteDraftAuthor=remoteDraftAuthors.join(', ');liveLine.textContent=tx(remoteDraftAuthors.join(', ')+' a un brouillon non validé',remoteDraftAuthors.join(', ')+' has an unconfirmed draft');liveLine.hidden=false;}
    const stateLine=document.createElement('small');stateLine.className='cell-save-state';stateLine.setAttribute('aria-live','polite');stateLine.hidden=true;
    const setCellState=(state,message='')=>{holder.dataset.saveState=state;holder.classList.toggle('is-failed',state==='FAILED');holder.classList.toggle('is-confirmed',state==='CONFIRMED');stateLine.hidden=!message;stateLine.textContent=message;};
    validate.dataset.ecoSubmitBound='canonical';
    const dictation=createCellDictationButton(input,{label:memberDisplay(member)+' · '+rubric.name,getScope:()=>String(app.currentActor())+'|'+String(app.activeGroup())});
    holder.append(input,dictation,validate,liveLine,stateLine);return holder;
};

const ensureMatrixMeeting=()=>{
    if(matrixMeetingId&&meetings.some(x=>x.id===matrixMeetingId&&x.status!=='cancelled'))return matrixMeetingId;
    try{const saved=sessionStorage.getItem('eco.matrixMeetingId');if(saved&&meetings.some(x=>x.id===saved&&x.status!=='cancelled')){matrixMeetingId=saved;return matrixMeetingId;}}catch{}
    matrixMeetingId=meetings.find(x=>x.status==='open')?.id??meetings.filter(x=>x.status!=='cancelled').at(-1)?.id??'';
    return matrixMeetingId;
};
const normalizeFinancialLabel=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const hasCanonicalLoanStamp=()=>rubrics.some(r=>r.status!=='ARCHIVED'&&normalizeFinancialLabel(r.name)==='timbre de pret');
const isLegacyStampDuplicate=r=>hasCanonicalLoanStamp()&&normalizeFinancialLabel(r?.name)==='timbre';
const activeFinancialRubrics=()=>rubrics.filter(x=>x.status!=='ARCHIVED'&&!isLegacyStampDuplicate(x));
const activeFinancialMembers=()=>members.filter(x=>x.status!=='left').slice().sort((a,b)=>(Number(a.memberNumber)||Number.MAX_SAFE_INTEGER)-(Number(b.memberNumber)||Number.MAX_SAFE_INTEGER)||String(a.displayName??'').localeCompare(String(b.displayName??''),localeTag(uiLocale),{sensitivity:'base'}));
const renderRubricRecapTable=async(rubric,host)=>{
  host.replaceChildren();const status=document.createElement('p');status.className='hint';status.textContent=tx('Chargement du récapitulatif…','Loading recap…');host.append(status);
  try{
    await loadFinancialProjectionState();
    const ordered=meetings.filter(x=>x.status!=='cancelled').slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt))),people=activeFinancialMembers(),wrap=document.createElement('div');wrap.className='matrix-wrap';const table=document.createElement('table');table.className='meeting-matrix';
    const head=document.createElement('thead'),hr=document.createElement('tr');for(const label of [tx('Membre','Member'),...ordered.map((m,i)=>'S'+String(i+1)),tx('Total','Total')]){const th=document.createElement('th');th.textContent=label;hr.append(th);}head.append(hr);table.append(head);
    const body=document.createElement('tbody'),col=new Map();let grand=0;
    for(const member of people){const tr=document.createElement('tr'),name=document.createElement('th');name.textContent=memberDisplay(member);tr.append(name);let rowTotal=0;for(const meeting of ordered){const amount=exactCellAmount(member.id,rubric.id,meeting.id);rowTotal+=amount;col.set(meeting.id,(col.get(meeting.id)??0)+amount);const td=document.createElement('td');td.textContent=amount?fmt(amount):'—';tr.append(td);}grand+=rowTotal;const td=document.createElement('td');td.textContent=fmt(rowTotal);tr.append(td);body.append(tr);}
    const total=document.createElement('tr');total.className='table-total-row';const th=document.createElement('th');th.textContent=tx('TOTAL','TOTAL');total.append(th);for(const meeting of ordered){const td=document.createElement('td');td.textContent=fmt(col.get(meeting.id)??0);total.append(td);}const end=document.createElement('td');end.textContent=fmt(grand);total.append(end);body.append(total);table.append(body);wrap.append(table);host.replaceChildren(wrap);
  }catch(error){host.replaceChildren();const p=document.createElement('p');p.className='truth-notice';p.textContent=tx('Récapitulatif non rechargé : Eco-System conserve la dernière projection locale et réessaiera lors d’un prochain accès.','Recap not reloaded: Eco-System keeps the last local projection and will retry on a later access.');host.append(p);console.info('Rubric recap deferred',error);}
};
const appendRubricRecapChooser=root=>{
  if(!root||!rubrics.length)return;
  const section=document.createElement('section');section.id='rubricRecapChooser';section.className='item rubric-recap-chooser';
  const title=document.createElement('h3');title.textContent=tx('Tableau récapitulatif · membres × séances','Recap table · members × sessions');
  const hint=document.createElement('p');hint.className='hint';hint.textContent=tx('Choisissez une rubrique : Eco-System affiche un seul tableau membres × séances, avec totaux par membre, par séance et total général.','Choose a rubric: Eco-System shows one members × sessions table, with member, session and grand totals.');
  const select=document.createElement('select');select.setAttribute('aria-label',tx('Rubrique à récapituler','Rubric to recap'));
  for(const rubric of rubrics){const option=document.createElement('option');option.value=rubric.id;option.textContent=rubric.name+(rubric.status==='ARCHIVED'?tx(' · archivée',' · archived'):'');select.append(option);}
  try{const saved=sessionStorage.getItem('eco.rubricRecap.selected');if(saved&&rubrics.some(r=>r.id===saved))select.value=saved;}catch{}
  const host=document.createElement('div');host.className='rubric-recap-host';
  const render=()=>{const rubric=rubrics.find(r=>r.id===select.value);if(!rubric)return;try{sessionStorage.setItem('eco.rubricRecap.selected',rubric.id);}catch{}void renderRubricRecapTable(rubric,host);};
  select.addEventListener('change',render);section.append(title,hint,select,host);root.append(section);render();
};
const canonicalFinancialObservers=new WeakMap();
const canonicalFinancialSizes=new WeakMap();
const protectCanonicalFinancialHost=root=>{
    if(!root||canonicalFinancialObservers.has(root))return;
    const observer=new MutationObserver(()=>{
      if(root.dataset.canonicalTableReady!=='1'||root.dataset.canonicalRepairQueued==='1')return;
      if(root.querySelector('.canonical-financial-matrix'))return;
      root.dataset.canonicalRepairQueued='1';
      queueMicrotask(()=>{
        delete root.dataset.canonicalRepairQueued;
        if(!root.isConnected||root.dataset.canonicalTableReady!=='1'||root.querySelector('.canonical-financial-matrix'))return;
        renderCanonicalFinancialTable({
          root,
          mode:root.dataset.financialMode||'meeting',
          meetingId:root.dataset.meetingId||'',
          membershipId:root.dataset.membershipId||'',
          showToolbar:root.dataset.showToolbar!=='false',
          editable:root.dataset.editable!=='false'
        });
      });
    });
    observer.observe(root,{childList:true});
    canonicalFinancialObservers.set(root,observer);
};
const renderCanonicalFinancialTable=({root,mode='meeting',meetingId='',membershipId='',showToolbar=true,editable=isManager()})=>{
    if(!root)return;
    const measuredWidth=root.clientWidth||0;
    if(typeof ResizeObserver!=='undefined'&&!canonicalFinancialSizes.has(root)){
      const state={width:measuredWidth,observer:null};
      state.observer=new ResizeObserver(()=>{
        const width=root.clientWidth;
        if(width<1||Math.abs(width-state.width)<8)return;
        state.width=width;
        if(root.querySelector('.cell-target-input:focus')){root.dataset.canonicalRenderDeferred='1';return;}
        renderCanonicalFinancialTable({root,mode:root.dataset.financialMode||mode,meetingId:root.dataset.meetingId||'',membershipId:root.dataset.membershipId||'',showToolbar:root.dataset.showToolbar!=='false',editable:root.dataset.editable!=='false'});
      });
      canonicalFinancialSizes.set(root,state);state.observer.observe(root);
    }
    const previousWrap=root.querySelector?.('.canonical-financial-wrap');
    const previousMatrixScroll=previousWrap?{left:Number(previousWrap.scrollLeft)||0,top:Number(previousWrap.scrollTop)||0}:null;
    const restoreReplacedMatrixScroll=wrap=>{
      if(!previousMatrixScroll||!wrap)return;
      let applied=false;
      const apply=()=>{if(applied||!wrap.isConnected||wrap.clientWidth===0)return;if(wrap.scrollLeft!==0||wrap.scrollTop!==0){applied=true;return;}wrap.scrollLeft=previousMatrixScroll.left;wrap.scrollTop=previousMatrixScroll.top;applied=true;};
      apply();requestAnimationFrame(apply);setTimeout(apply,80);
    };
    const activeEditor=root.querySelector?.('.cell-target-input:focus');
    if(root.dataset.canonicalTableReady==='1'&&activeEditor&&String(activeEditor.value??'').trim()!==''){
      root.dataset.canonicalRenderDeferred='1';
      traceFinancialCell('CELL_RENDER_DEFERRED',{meetingId:root.dataset.meetingId??'',membershipId:activeEditor.closest('.matrix-cell-entry')?.dataset.membershipId??'',rubricId:activeEditor.closest('.matrix-cell-entry')?.dataset.rubricId??''});
      return;
    }
    delete root.dataset.canonicalRenderDeferred;
    protectCanonicalFinancialHost(root);
    root.dataset.canonicalFinancialHost='1';root.dataset.canonicalFinancialOwner='main-v151';root.dataset.canonicalTableReady='0';root.dataset.financialMode=mode;root.dataset.meetingId=meetingId||'';root.dataset.membershipId=membershipId||'';root.dataset.showToolbar=showToolbar===false?'false':'true';root.dataset.editable=editable===false?'false':'true';
    root.replaceChildren();
    const activeRubrics=activeFinancialRubrics(),activeMembers=activeFinancialMembers();
    const tableScope=JSON.stringify([app.currentTenant(),app.currentActor(),app.activeGroup(),mode]);
    const preferences=readTablePreferences(tableScope),displayRubrics=preferences.columns?activeRubrics.filter(r=>preferences.columns.includes(r.id)):activeRubrics;
    if(!displayRubrics.length)displayRubrics.push(...activeRubrics);
    const displayMembers=selectTableMembers(activeMembers,preferences,m=>activeRubrics.reduce((n,r)=>n+exactCellAmount(m.id,r.id,meetingId||matrixMeetingId),0));
    if(!activeRubrics.length||!activeMembers.length){root.innerHTML='<div class="empty-state">'+tx('Ajoutez au moins un membre et une rubrique active.','Add at least one member and one active rubric.')+'</div>';return;}
    // SmartGrid is a presentation-only projection. Financial editors and writes
    // remain exclusively owned by the existing canonical renderer and Ledger.
    const panelScope=[app.currentActor(),app.activeGroup(),mode].map(encodeURIComponent).join('.');
    const choiceKey='eco.smartGrid.parts.'+panelScope;
    const uiMode=document.documentElement.dataset.uiMode||'visual';
    const layout=planFinancialRubricLayout({count:displayRubrics.length,width:measuredWidth,mode:uiMode,individual:mode!=='meeting'});
    let savedParts=null;try{const saved=sessionStorage.getItem(choiceKey);if(saved!==null)savedParts=Number(saved);}catch{}
    const parts=savedParts===1?1:savedParts&&layout.fits(savedParts)?savedParts:layout.recommended||1;
    root.dataset.parts=String(parts);root.dataset.recommendedParts=String(layout.recommended||'');
    root.dataset.rubricCount=String(activeRubrics.length);
    const columnGroups=splitFinancialRubrics(displayRubrics,parts);
    const panelKey='eco.smartGrid.index.'+panelScope;
    let panelIndex=0;
    try{panelIndex=Math.max(0,Math.min(columnGroups.length-1,Number(sessionStorage.getItem(panelKey))||0));}catch{}
    const visibleRubrics=columnGroups[panelIndex]??activeRubrics;
    const presentation= document.createElement('div');presentation.className='eco-smartgrid-toolbar';
    const title=document.createElement('strong');title.textContent=tx('Affichage des rubriques','Rubric display');
    const presets=document.createElement('div');presets.className='eco-smartgrid-parts';
    for(const n of layout.choices){
      const b=document.createElement('button');b.type='button';b.className=parts===n?'primary':'secondary';
      b.textContent=n===1?tx('Vue intégrale','Full view'):tx('Vue en '+n+' parties',n+' parts view');
      b.setAttribute('aria-pressed',String(parts===n));
      b.onclick=()=>{try{sessionStorage.setItem(choiceKey,String(n));sessionStorage.setItem(panelKey,'0');}catch{}
        renderCanonicalFinancialTable({root,mode,meetingId,membershipId,showToolbar,editable});};
      presets.append(b);
    }
    presentation.append(title,presets);
    presentation.append(tablePreferenceControls({scope:tableScope,preferences,rubrics:activeRubrics,tx,onApply:()=>renderCanonicalFinancialTable({root,mode,meetingId,membershipId,showToolbar,editable})}));
    const visibility=document.createElement('p');visibility.className='eco-table-visibility';visibility.setAttribute('role','status');visibility.textContent=tx(displayMembers.length+' / '+activeMembers.length+' membres · '+displayRubrics.length+' / '+activeRubrics.length+' rubriques visibles. Les totaux généraux gardent toutes les données.',displayMembers.length+' / '+activeMembers.length+' members · '+displayRubrics.length+' / '+activeRubrics.length+' visible categories. Grand totals retain all data.');presentation.append(visibility);
    const fitHint=document.createElement('small');fitHint.className='hint eco-smartgrid-fit';
    fitHint.textContent=layout.recommended===null
      ?tx('Fenêtre trop étroite pour une partie entière : la vue intégrale conserve le défilement horizontal. Élargissez la fenêtre ou choisissez le mode Visuel.','The window is too narrow for a complete part: full view keeps horizontal scrolling. Widen the window or choose Visual mode.')
      :tx(activeRubrics.length+' rubriques · '+(layout.recommended===1?'le tableau tient en entier':layout.recommended+' parties minimum pour tout lire sans défilement horizontal')+'. Seuls les découpages qui tiennent sont proposés.',activeRubrics.length+' categories · '+(layout.recommended===1?'the whole table fits':layout.recommended+' parts minimum to read everything without horizontal scrolling')+'. Only layouts that fit are offered.');
    presentation.append(fitHint);
    if(columnGroups.length>1){
      const navigation=document.createElement('div');navigation.className='eco-smartgrid-navigation';
      const previous=document.createElement('button');previous.type='button';previous.className='secondary';previous.textContent='←';
      previous.setAttribute('aria-label',tx('Partie précédente','Previous part'));previous.disabled=panelIndex===0;
      const indication=document.createElement('span');indication.textContent=tx('Partie ','Part ')+(panelIndex+1)+' / '+columnGroups.length;
      indication.setAttribute('aria-live','polite');
      const next=document.createElement('button');next.type='button';next.className='secondary';next.textContent='→';
      next.setAttribute('aria-label',tx('Partie suivante','Next part'));next.disabled=panelIndex===columnGroups.length-1;
      const openPart=index=>{try{sessionStorage.setItem(panelKey,String(index));}catch{}
        renderCanonicalFinancialTable({root,mode,meetingId,membershipId,showToolbar,editable});};
      previous.onclick=()=>openPart(panelIndex-1);next.onclick=()=>openPart(panelIndex+1);
      const partSelect=document.createElement('select');partSelect.setAttribute('aria-label',tx('Choisir une partie du tableau','Choose a table part'));
      columnGroups.forEach((columns,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=tx('Partie ','Part ')+(index+1)+' · '+(columns[0]?.name||'')+(columns.length>1?' → '+columns.at(-1).name:'');partSelect.append(option);});
      partSelect.value=String(panelIndex);partSelect.onchange=()=>openPart(Number(partSelect.value));
      navigation.append(previous,indication,next,partSelect);presentation.append(navigation);
      const totalHint=document.createElement('small');totalHint.className='hint';totalHint.textContent=tx('Les totaux incluent toutes les parties. Les colonnes de cette partie restent modifiables dans la même feuille.','Totals include all parts. Columns in this part remain editable in the same sheet.');presentation.append(totalHint);
    }
    const wrap=document.createElement('div');wrap.className='matrix-wrap canonical-financial-wrap';
    // The matrix scrolls horizontally. Forward ordinary vertical mouse-wheel
    // motion to the document when the matrix has no vertical overflow: keep
    // the cursor inside the table instead of forcing users to leave it.
    wrap.addEventListener('wheel',event=>{
      if(event.defaultPrevented||event.ctrlKey||event.shiftKey||Math.abs(event.deltaY)<=Math.abs(event.deltaX))return;
      const verticalRange=Math.max(0,wrap.scrollHeight-wrap.clientHeight);
      const atEdge=(event.deltaY<0&&wrap.scrollTop<=1)||
        (event.deltaY>0&&wrap.scrollTop>=verticalRange-1);
      if(verticalRange>8&&!atEdge)return;
      const page=document.scrollingElement;
      if(!page||page.scrollHeight<=page.clientHeight+1)return;
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);
      event.preventDefault();window.scrollBy(0,delta);
    },{passive:false});
    const table=document.createElement('table');table.className='meeting-matrix canonical-financial-matrix';
    // Explicit columns make the measured partition a real layout contract,
    // independent of the many historical table minimum-width selectors.
    const fitted=Boolean(layout.fits(parts));table.dataset.fitted=String(fitted);table.dataset.mode=mode;
    const columns=document.createElement('colgroup');
    const addColumn=(width,kind)=>{const col=document.createElement('col');col.setAttribute('width',String(width));col.className='financial-column-'+kind;columns.append(col);};
    if(mode==='meeting')addColumn(layout.numberWidth,'number');
    addColumn(layout.identityWidth,'identity');
    for(const r of visibleRubrics)addColumn(layout.columnWidth,'rubric');
    addColumn(layout.totalWidth,'total');table.append(columns);
    table.setAttribute('width',String(layout.reserved+visibleRubrics.length*layout.columnWidth));
    wrap.dataset.fitted=String(fitted);
    const head=document.createElement('thead'),hr=document.createElement('tr'),body=document.createElement('tbody');
    if(mode==='meeting'){
      if(!isManager()){root.innerHTML='<div class="empty-state">'+tx('La feuille générale de séance est réservée aux responsables habilités.','The general meeting sheet is restricted to authorized managers.')+'</div>';return;}
      const requested=meetingId&&meetings.some(x=>x.id===meetingId&&x.status!=='cancelled')?meetingId:'';
      const selectedMeeting=requested||ensureMatrixMeeting();
      if(!selectedMeeting){root.innerHTML='<div class="empty-state">'+tx('Créez une séance avant de saisir des données financières.','Create a meeting before entering financial data.')+'</div>';return;}
      matrixMeetingId=selectedMeeting;root.dataset.meetingId=selectedMeeting;
      const numberHead=document.createElement('th');numberHead.textContent=tx('N°','No.');numberHead.className='member-number-column';hr.append(numberHead);
      const memberHead=document.createElement('th');memberHead.textContent=tx('Membre','Member');hr.append(memberHead);
      for(const r of visibleRubrics){const th=document.createElement('th');th.scope='col';th.append(contextLink(r.name,'rubric',r.id));hr.append(th);}
      const totalHead=document.createElement('th');totalHead.textContent=columnGroups.length>1?tx('Total général membre','Member grand total'):tx('Total membre','Member total');hr.append(totalHead);head.append(hr);table.append(head);
      for(const m of displayMembers){
        const tr=document.createElement('tr'),number=document.createElement('th'),name=document.createElement('th');number.className='member-number-column';number.textContent=String(Number(m.memberNumber)||'—');name.replaceChildren(contextLink(String(m.displayName??''),'member',m.id));const roles=document.createElement('small');roles.textContent=m.roles.join(', ');name.append(roles);name.title=String(m.displayName??'')+(m.roles.length?' · '+m.roles.join(', '):'');tr.append(number,name);const rowTotal=activeRubrics.reduce((sum,r)=>sum+exactCellAmount(m.id,r.id,selectedMeeting),0);
        tr.dataset.membershipId=m.id;
        for(const r of visibleRubrics){const value=exactCellAmount(m.id,r.id,selectedMeeting);const td=document.createElement('td');td.dataset.rubricId=r.id;td.append(makeFinancialEntryCell({member:m,rubric:r,meetingId:selectedMeeting,editable:Boolean(editable&&isManager())}));tr.append(td);}
        const total=document.createElement('td');total.className='table-row-total';total.append(financialNumberButton({label:tx('Total membre · ','Member total · ')+m.displayName,total:rowTotal,rows:activeRubrics.map(r=>({label:r.name,id:r.id,type:'rubric',amount:exactCellAmount(m.id,r.id,selectedMeeting)})),fmt,tx,period:meetingLabel(meetings.find(x=>x.id===selectedMeeting))}));tr.append(total);body.append(tr);
      }
      const totalRow=document.createElement('tr');totalRow.className='table-total-row';const totalLabel=document.createElement('th');totalLabel.colSpan=2;totalLabel.textContent=tx('TOTAL COLONNES','COLUMN TOTALS');totalRow.append(totalLabel);
      for(const r of visibleRubrics){const amount=activeMembers.reduce((sum,m)=>sum+exactCellAmount(m.id,r.id,selectedMeeting),0);const td=document.createElement('td');td.dataset.totalRubricId=r.id;td.textContent=fmt(amount);totalRow.append(td);}
      const grandTd=document.createElement('td');grandTd.className='table-grand-total';
      const grand=activeMembers.reduce((total,m)=>total+activeRubrics.reduce((sum,r)=>sum+exactCellAmount(m.id,r.id,selectedMeeting),0),0);
      grandTd.append(financialNumberButton({label:tx('Total général · toutes les rubriques et tous les membres','Grand total · all categories and members'),total:grand,rows:activeRubrics.map(r=>({label:r.name,id:r.id,type:'rubric',amount:activeMembers.reduce((n,m)=>n+exactCellAmount(m.id,r.id,selectedMeeting),0)})),fmt,tx,period:meetingLabel(meetings.find(x=>x.id===selectedMeeting))}));grandTd.title=tx('Total général de toutes les rubriques','Grand total across every rubric');
      totalRow.append(grandTd);body.append(totalRow);
      if(displayMembers.length!==activeMembers.length){const filtered=document.createElement('tr');filtered.className='eco-filtered-total';const title=document.createElement('th');title.colSpan=2;title.textContent=tx('Sous-total des membres affichés','Subtotal of displayed members');filtered.append(title);for(const r of visibleRubrics){const td=document.createElement('td');td.textContent=fmt(displayMembers.reduce((n,m)=>n+exactCellAmount(m.id,r.id,selectedMeeting),0));filtered.append(td);}const total=document.createElement('td');total.textContent=fmt(displayMembers.reduce((n,m)=>n+activeRubrics.reduce((sum,r)=>sum+exactCellAmount(m.id,r.id,selectedMeeting),0),0));filtered.append(total);body.append(filtered);}
      table.append(body);wrap.append(table);
      const note=document.createElement('p');note.className='truth-notice';note.textContent=tx('Une seule matrice financière canonique est utilisée ici et dans les fiches individuelles. Chaque cellule est la valeur totale de la séance : Remplacer 1 000 par 500 donne 500. La dernière ligne totalise chaque colonne et la dernière colonne totalise chaque membre.','One canonical financial matrix is used here and in individual sheets. Each cell is the total value for the meeting: replacing 1,000 with 500 gives 500. The last row totals every column and the last column totals every member.');
      if(showToolbar){
        const toolbar=document.createElement('div');toolbar.className='session-safety-toolbar';
        const label=document.createElement('label');label.textContent=tx('Séance de saisie : ','Entry meeting: ');
        const scope=document.createElement('select');scope.id='meetingMatrixScope';scope.className='meeting-matrix-scope';scope.setAttribute('aria-label',tx('Séance exacte de la matrice','Exact matrix meeting'));
        for(const m of meetings.filter(x=>x.status!=='cancelled').slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt)))){const o=document.createElement('option');o.value=m.id;o.textContent=meetingLabel(m)+' · '+(m.status==='closed'?tx('clôturée','closed'):tx('ouverte','open'));scope.append(o);}
        scope.value=selectedMeeting;scope.onchange=()=>{matrixMeetingId=scope.value;try{sessionStorage.setItem('eco.matrixMeetingId',matrixMeetingId);}catch{}renderCanonicalFinancialTable({root,mode:'meeting',meetingId:matrixMeetingId,showToolbar,editable});renderIndividualSheetMatrix();};
        label.append(scope);
        const other=document.createElement('button');other.type='button';other.className='secondary';other.textContent=tx('Voir les séances','View meetings');other.onclick=()=>go('sessions',{meetingId:selectedMeeting,force:true});
        const add=document.createElement('button');add.type='button';add.className='secondary';add.textContent=tx('+ Nouvelle séance','+ New meeting');add.onclick=()=>go('sessions',{anchor:'sessionsCreateForm',force:true});
        toolbar.append(label,contextLink(meetingLabel(meetings.find(x=>x.id===selectedMeeting)),'meeting',selectedMeeting),other,add);root.append(toolbar);
      }
      root.append(presentation,wrap,note);
      if(columnGroups.length>1){
        const explanation=document.createElement('p');explanation.className='eco-smartgrid-explanation';
        explanation.textContent=tx('Les sous-totaux des colonnes concernent uniquement cette partie. Les totaux généraux des membres et de la feuille comprennent toutes les rubriques, même masquées.','Column subtotals apply only to this part. Member and sheet grand totals include all rubrics, including hidden parts.');
        root.append(explanation);
      }restoreReplacedMatrixScroll(wrap);root.dataset.canonicalTableReady='1';ensureFinancialWorkUI().toolbar();queueMicrotask(restoreFinancialReviewInbox);return;
    }
    const member=activeMembers.find(x=>x.id===membershipId);
    if(!member){root.innerHTML='<div class="empty-state">'+tx('Aucune fiche individuelle accessible.','No individual sheet available.')+'</div>';return;}
    hr.append(document.createElement('th'));hr.firstChild.textContent=tx('Séance','Meeting');
    for(const r of visibleRubrics){const th=document.createElement('th');th.scope='col';th.append(contextLink(r.name,'rubric',r.id));hr.append(th);}
    const totalHead=document.createElement('th');totalHead.textContent=columnGroups.length>1?tx('Total général séance','Meeting grand total'):tx('Total séance','Meeting total');hr.append(totalHead);head.append(hr);table.append(head);
    const activeMeetings=meetings.filter(x=>x.status!=='cancelled').slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt)));
    for(const meeting of activeMeetings){
      const tr=document.createElement('tr'),th=document.createElement('th');th.append(contextLink(meetingLabel(meeting)+(meeting.status==='closed'?' · '+tx('clôturée','closed'):''),'meeting',meeting.id));th.scope='row';tr.append(th);const rowTotal=activeRubrics.reduce((sum,r)=>sum+exactCellAmount(member.id,r.id,meeting.id),0);
      tr.dataset.meetingId=meeting.id;
      for(const r of visibleRubrics){const value=exactCellAmount(member.id,r.id,meeting.id);const td=document.createElement('td');td.dataset.rubricId=r.id;td.append(makeFinancialEntryCell({member,rubric:r,meetingId:meeting.id,editable:Boolean(editable&&isManager())}));tr.append(td);}
      const total=document.createElement('td');total.className='table-row-total';total.textContent=fmt(rowTotal);tr.append(total);body.append(tr);
    }
    const totalRow=document.createElement('tr');totalRow.className='table-total-row';const label=document.createElement('th');label.textContent=tx('TOTAL COLONNES','COLUMN TOTALS');totalRow.append(label);
    for(const r of visibleRubrics){const amount=activeMeetings.reduce((sum,meeting)=>sum+exactCellAmount(member.id,r.id,meeting.id),0);const td=document.createElement('td');td.dataset.totalRubricId=r.id;td.textContent=fmt(amount);totalRow.append(td);}
    const grandTd=document.createElement('td');grandTd.className='table-grand-total';
    const grand=activeMeetings.reduce((total,m)=>total+activeRubrics.reduce((sum,r)=>sum+exactCellAmount(member.id,r.id,m.id),0),0);
    grandTd.textContent=fmt(grand);grandTd.title=tx('Total général de toutes les rubriques','Grand total across every rubric');
    totalRow.append(grandTd);body.append(totalRow);table.append(body);wrap.append(table);
    const note=document.createElement('p');note.className='truth-notice';note.textContent=tx('Cette fiche utilise exactement le même éditeur financier que la feuille de séance. Les totaux de chaque rubrique figurent sur la dernière ligne.','This sheet uses exactly the same financial editor as the meeting sheet. Totals for every rubric appear on the last row.');
    root.append(presentation,wrap,note);
      if(columnGroups.length>1){
        const explanation=document.createElement('p');explanation.className='eco-smartgrid-explanation';
        explanation.textContent=tx('Les sous-totaux des colonnes concernent uniquement cette partie. Les totaux généraux des membres et de la feuille comprennent toutes les rubriques, même masquées.','Column subtotals apply only to this part. Member and sheet grand totals include all rubrics, including hidden parts.');
        root.append(explanation);
      }restoreReplacedMatrixScroll(wrap);root.dataset.canonicalTableReady='1';ensureFinancialWorkUI().toolbar();queueMicrotask(restoreFinancialReviewInbox);
};
const renderMeetingMatrix=()=>renderCanonicalFinancialTable({root:document.querySelector('#meetingMatrix'),mode:'meeting',meetingId:ensureMatrixMeeting(),showToolbar:true,editable:isManager()});
const renderIndividualSheetMatrix=()=>{
    const root=document.querySelector('#individualSheetMatrix'),select=document.querySelector('#individualSheetMember');if(!root||!select)return;
    const previous=select.value;select.replaceChildren();const visible=isManager()?activeFinancialMembers():activeFinancialMembers().filter(x=>x.userId===app.currentActor());
    for(const m of visible){const o=document.createElement('option');o.value=m.id;o.textContent=m.displayName;select.append(o);}
    if(previous&&visible.some(x=>x.id===previous))select.value=previous;else if(!select.value&&visible[0])select.value=visible[0].id;
    renderCanonicalFinancialTable({root,mode:'individual',membershipId:select.value,showToolbar:false,editable:isManager()});
};
const renderAllCanonicalFinancialHosts=scope=>{
  const provider=scope??document,roots=provider.querySelectorAll?[...provider.querySelectorAll('[data-canonical-financial-host="1"]')]:[];
  for(const root of roots){if(root.id==='meetingMatrix'||root.id==='individualSheetMatrix')continue;renderCanonicalFinancialTable({root,mode:root.dataset.financialMode||'meeting',meetingId:root.dataset.meetingId||'',membershipId:root.dataset.membershipId||'',showToolbar:root.dataset.showToolbar!=='false',editable:root.dataset.editable!=='false'});}
};
window.addEventListener('eco:render-canonical-financial-table',event=>{
  const d=event instanceof CustomEvent?event.detail??{}:{};const root=d.root instanceof Element?d.root:null;if(!root)return;
  root.dataset.canonicalFinancialHost='1';root.dataset.financialMode=d.mode||'meeting';root.dataset.meetingId=d.meetingId||'';root.dataset.membershipId=d.membershipId||'';root.dataset.showToolbar=d.showToolbar===false?'false':'true';root.dataset.editable=d.editable===false?'false':'true';
  renderCanonicalFinancialTable({root,mode:root.dataset.financialMode,meetingId:root.dataset.meetingId,membershipId:root.dataset.membershipId,showToolbar:root.dataset.showToolbar!=='false',editable:root.dataset.editable!=='false'});
});
window.addEventListener('eco:financial-data-changed',event=>{
  const detail=event instanceof CustomEvent?event.detail??{}:{};
  if(detail.soft&&detail.meetingId&&detail.membershipId&&detail.rubricId){patchFinancialDomCell(detail);return;}
  renderMeetingMatrix();renderIndividualSheetMatrix();renderAllCanonicalFinancialHosts();
});
document.querySelector('#individualSheetMember')?.addEventListener('change',renderIndividualSheetMatrix);
document.querySelector('#meetingSheetViewBtn')?.addEventListener('click',()=>{document.querySelector('#meetingMatrixPanel').hidden=false;document.querySelector('#individualSheetsMode').hidden=true;document.querySelector('#meetingSheetViewBtn').classList.add('active');document.querySelector('#individualSheetsViewBtn').classList.remove('active');renderMeetingMatrix();});
document.querySelector('#individualSheetsViewBtn')?.addEventListener('click',()=>{document.querySelector('#meetingMatrixPanel').hidden=true;document.querySelector('#individualSheetsMode').hidden=false;document.querySelector('#individualSheetsViewBtn').classList.add('active');document.querySelector('#meetingSheetViewBtn').classList.remove('active');renderIndividualSheetMatrix();});
window.addEventListener('eco:render-two-sheets',()=>{renderMeetingMatrix();renderIndividualSheetMatrix();});
window.addEventListener('eco:ui-mode-changed',()=>{renderMeetingMatrix();renderIndividualSheetMatrix();renderAllCanonicalFinancialHosts();});
window.addEventListener('eco:financial-outbox-confirmed',event=>{
  const d=event.detail??{};
  if(String(d.actorId)!==String(app.currentActor())||String(d.groupId)!==String(app.activeGroup()))return;
  const amount=Number(d.amount),version=Number(d.cellVersion);
  if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(version)||['SUPERSEDED','CONSENSUS_REQUIRED','CLOCK_REVIEW'].includes(d.status))return;
  financialPendingTargets=new Map((app.pendingFinancialCellTargets?.()??[]).map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),x]));
  financialPendingSheetEntries=app.pendingFinancialSheetEntries?.()??[];
  if(cellHasPendingLocal(d))return; // A more recent local command still needs its own ACK.
  if(exactCellVersion(d.membershipId,d.rubricId,d.meetingId)>version)return;
  const nature=financialNatureForRubric(rubrics.find(r=>r.id===d.rubricId));
  const signed=['LOAN','OUTFLOW'].includes(nature)?-Math.abs(amount):amount;
  const key=financialCellKey(d.membershipId,d.rubricId,d.meetingId);
  financialOptimisticValues.delete(key);
  rememberConfirmedCell(key,{...d,amount:signed,cellVersion:version});
  patchFinancialDomCell({...d,amount:signed,preservePending:false});
  setCellSyncedState(d);
  for(const cell of document.querySelectorAll(financialLiveSelector(d))){
    if(d.debtPosition)showFinancialEntryPosition(cell,d.debtPosition);
    else if(needsFinancialEntryPosition(rubrics.find(r=>r.id===d.rubricId)))void app.financialEntryPosition({meetingId:d.meetingId,membershipId:d.membershipId,rubricId:d.rubricId}).then(position=>{if(cell.isConnected)showFinancialEntryPosition(cell,position);}).catch(()=>{});
  }
  window.dispatchEvent(new CustomEvent('eco:financial-data-changed',{detail:{...d,amount:signed,soft:true}}));
});
window.addEventListener('eco:financial-command-rejected',event=>{
  const d=event.detail??{};if(d.actorId!==app.currentActor()||d.groupId!==app.activeGroup())return;
  const key=financialCellKey(d.membershipId,d.rubricId,d.meetingId);financialOptimisticValues.delete(key);
  financialPendingTargets=new Map((app.pendingFinancialCellTargets?.()??[]).map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),x]));financialPendingSheetEntries=app.pendingFinancialSheetEntries?.()??[];
  for(const cell of document.querySelectorAll(financialLiveSelector(d))){const input=cell.querySelector('.cell-target-input');if(input&&!input.value){input.value=String(d.targetAmount??d.amount??'');saveFinancialCellDraft(key,input.value);}cell.classList.add('is-failed');const state=cell.querySelector('.cell-save-state');if(state){state.hidden=false;state.textContent=tx('Saisie conservée pour correction · montant refusé par le contrôle métier','Entry retained for correction · amount rejected by business validation');}}
  void refreshFinancialProjectionSilently({...d,remote:true}).catch(()=>{});fail(Error(d.error??'FINANCIAL_ENTRY_REQUIRES_REVIEW'));
});
window.addEventListener('eco:set-matrix-meeting',event=>{const id=event instanceof CustomEvent?String(event.detail?.meetingId??''):'';if(id&&meetings.some(x=>x.id===id)){matrixMeetingId=id;try{sessionStorage.setItem('eco.matrixMeetingId',id);}catch{}}});

window.addEventListener('eco:restore-financial-sheet',event=>{
    const detail=event instanceof CustomEvent?event.detail??{}:{};
    if(detail.matrixMeetingId&&meetings.some(x=>x.id===detail.matrixMeetingId))matrixMeetingId=detail.matrixMeetingId;
    if(detail.sheetMode==='individual')document.querySelector('#individualSheetsViewBtn')?.click();else document.querySelector('#meetingSheetViewBtn')?.click();
    if(detail.membershipId){const select=document.querySelector('#individualSheetMember');if(select&&[...select.options].some(o=>o.value===detail.membershipId))select.value=detail.membershipId;}
    renderMeetingMatrix();renderIndividualSheetMatrix();
    if(detail.membershipId&&detail.rubricId&&matrixMeetingId){
      requestAnimationFrame(()=>{const cell=document.querySelector(`.matrix-cell[data-membership-id="${CSS.escape(detail.membershipId)}"][data-rubric-id="${CSS.escape(detail.rubricId)}"][data-meeting-id="${CSS.escape(matrixMeetingId)}"]`);if(cell){cell.classList.add('pending-consensus');cell.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});cell.focus({preventScroll:true});}});
    }
});
const renderLivingRules = async providedRubrics => {
    if (!app.activeGroup())
        return;
    try {
        if(!providedRubrics)groupPolicy = await app.groupOperatingPolicy();
        const late = groupPolicy.latePosting;
        $('#lateMode').value = late.mode;
        $('#lateMinApprovals').value = String(late.approval.minimumApprovals);
        $('#lateMaxHours').value = late.maxHoursAfterClose === undefined ? '' : String(late.maxHoursAfterClose);
    }
    catch { }
    rubrics = providedRubrics??await app.listRubrics();
    const root = $('#rubricList');
    root.replaceChildren();
    const rselect = $('#contributionRubric');
    const pselect = $('#rubricPreviewRubric');
    rselect.replaceChildren();
    pselect.replaceChildren();
    const none = document.createElement('option');
    none.value = '';
    none.textContent = tx('Sans rubrique','No rubric');
    rselect.append(none);
    if (!rubrics.length) {
        root.innerHTML = `<div class="empty-state">${tx('Aucune rubrique personnalisée. Décrivez par exemple la collation de ce groupe.','No custom rubric. Describe, for example, how this group handles refreshments.')}</div>`;
    }
    if(isManager()){const add=document.createElement('button');add.type='button';add.className='primary';add.textContent=tx('+ Ajouter une rubrique à ce groupe','+ Add a rubric to this group');add.onclick=()=>document.querySelector('#rubricForm')?.scrollIntoView({behavior:'smooth',block:'start'});root.append(add);}
    appendRubricRecapChooser(root);
    for (const r of rubrics) {
        const a = document.createElement('article');
        a.className = 'item'+(r.status==='ARCHIVED'?' is-archived':'');
        const m = r.operatingModel;
        const rubricLink=document.createElement('button');rubricLink.type='button';rubricLink.className='link-btn';rubricLink.dataset.detailType='rubric';rubricLink.dataset.detailId=r.id;rubricLink.textContent=r.name;a.append(rubricLink);
        if(r.status==='ARCHIVED'){const archived=document.createElement('span');archived.className='pill';archived.textContent=tx('Archivée · données conservées','Archived · data preserved');a.append(archived);}
        const written=document.createElement('p');written.className='hint';written.textContent='Écrit : '+(m?.writtenRule||'—');a.append(written);
        const practice=document.createElement('p');practice.className='hint';practice.textContent='Pratique : '+(m?.observedPractice||'—');a.append(practice);
        const small=document.createElement('small');small.textContent=`${m?.ruleRealityStatus ?? 'UNKNOWN'} · cible ${m?.targetMode ?? 'OPEN'} · manquant ${m?.shortfallHandling ?? '—'}`;a.append(small);
        if(r.activityPlan){
            const summary=document.createElement('p');summary.textContent=describeRubricPlan(r.activityPlan);a.append(summary);
            const scheduled=(r.activityPlan.participants??[]).flatMap(p=>p.shares.filter(s=>s.turn!==undefined).map(s=>`${p.name} · ${s.name} : tour ${s.turn}`));
            if(scheduled.length){const list=document.createElement('ul');for(const text of scheduled){const li=document.createElement('li');li.textContent=text;list.append(li);}a.append(list);}
        }
        if(isManager()){
          if(r.status==='ARCHIVED'){
            const restore=document.createElement('button');restore.type='button';restore.className='secondary';restore.textContent=tx('Restaurer cette rubrique','Restore this rubric');restore.onclick=()=>void(async()=>{try{const trash=await app.trashItems(),item=trash.find(x=>String(x.data?.kind??'')==='RUBRIC'&&String(x.data?.entityId??'')===r.id&&x.status==='ACTIVE');if(!item)throw Error('TRASH_ITEM_NOT_FOUND');await app.restoreTrashItem(item.id);await renderLivingRules();await renderTrash();toast(tx('Rubrique restaurée avec son historique.','Rubric restored with its history.'));}catch(e){fail(e);}})();a.append(restore);
          }else{
            const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent=tx('Configurer les caractéristiques / parts','Configure characteristics / shares');
            edit.onclick=()=>editRubricPlan(r,async plan=>{await app.updateRubricActivityPlan(r.id,plan);await renderLivingRules();toast(tx('Caractéristiques enregistrées.','Characteristics saved.'));},launchError);
            const remove=document.createElement('button');remove.type='button';remove.className='link-btn';remove.textContent=tx('Mettre à la corbeille','Move to trash');remove.onclick=()=>void(async()=>{if(!confirm(tx('Archiver cette rubrique dans la corbeille pendant 6 mois ? Les anciennes écritures restent intactes.','Archive this rubric in trash for 6 months? Existing entries remain intact.')))return;try{await app.moveToTrash('RUBRIC',r.id);await renderLivingRules();await renderTrash();toast(tx('Rubrique placée dans la corbeille.','Rubric moved to trash.'));}catch(e){fail(e);}})();a.append(edit,remove);
          }
        }
        root.append(a);
        if(r.status==='ARCHIVED')continue;
        for (const sel of [rselect, pselect]) {
            const o = document.createElement('option');
            o.value = r.id;
            o.textContent = r.name;
            sel.append(o);
        }
    }
    renderMeetingMatrix();
};
const ledgerHistoryFilters={search:'',meetingId:'',page:0};
const renderLedger = async () => {
    const root = $('#ledgerMetrics');
    const receipts = $('#receiptList');
    root.replaceChildren();
    receipts.replaceChildren();
    if (!app.activeGroup())
        return;
    const l=await loadFinancialProjectionState({clearOptimistic:true});renderMeetingMatrix();renderIndividualSheetMatrix();
    for (const [n, label] of [[l.summary.cashBalance, 'Solde caisse'], [l.summary.memberFundsLiability, 'Engagement membres'], [l.summary.entryCount, 'Écritures']]) {
        const d = document.createElement('div');
        d.className = 'metric';
        d.innerHTML = html`<strong>${label === 'Écritures' ? n : fmt(n)}</strong><span>${label}</span>`;
        root.append(d);
    }
    // A single filterable/paginated matrix replaces 100 receipt cards. Never
    // truncate canonical history: its actual Ledger and reversal actions remain.
    const allReceipts=l.receipts.slice().reverse(),memberById=new Map(members.map(x=>[x.id,x.displayName])),rubricById=new Map(rubrics.map(x=>[x.id,x.name])),meetingById=new Map(meetings.map(x=>[x.id,x.title??x.name??x.id]));
    if(!allReceipts.length){receipts.innerHTML='<div class="empty-state">Aucune cotisation enregistrée.</div>';return;}
    const search=document.createElement('input');search.type='search';search.placeholder='Rechercher membre, rubrique, gestionnaire, montant…';search.setAttribute('aria-label','Filtrer les écritures');
    search.value=ledgerHistoryFilters.search;
    const chooseMeeting=document.createElement('select');chooseMeeting.setAttribute('aria-label','Filtrer par séance');
    const allOption=document.createElement('option');allOption.value='';allOption.textContent='Toutes les séances';chooseMeeting.append(allOption);
    for(const [id,label] of meetingById){const opt=document.createElement('option');opt.value=id;opt.textContent=label;chooseMeeting.append(opt);}
    chooseMeeting.value=ledgerHistoryFilters.meetingId;
    const controls=document.createElement('div');controls.className='actions';controls.append(chooseMeeting,search);
    const wrap=document.createElement('div');wrap.className='matrix-wrap';
    const footer=document.createElement('div');footer.className='actions';
    const count=document.createElement('span'),prev=document.createElement('button'),next=document.createElement('button');prev.type='button';next.type='button';prev.textContent='← Précédent';next.textContent='Suivant →';prev.className='secondary';next.className='secondary';footer.append(prev,count,next);
    const renderPage=()=>{
      const query=ledgerHistoryFilters.search.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),meetingId=ledgerHistoryFilters.meetingId;
      const filtered=allReceipts.filter(r=>{
        if(meetingId&&String(r.meetingId??'')!==meetingId)return false;
        if(!query)return true;
        const searchable=[memberById.get(r.membershipId)??r.membershipId,rubricById.get(r.rubricId)??r.rubricId,actorDisplayName(String(r.receivedBy??'')),r.amount?.amount,r.netAmount,date(r.receivedAt)].join(' ').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
        return searchable.includes(query);
      });
      const pageSize=25,maxPage=Math.max(0,Math.ceil(filtered.length/pageSize)-1);
      ledgerHistoryFilters.page=Math.min(ledgerHistoryFilters.page,maxPage);
      const begin=ledgerHistoryFilters.page*pageSize;
      const table=document.createElement('table');table.className='meeting-matrix ledger-history-table';
      const thead=document.createElement('thead'),head=document.createElement('tr');
      for(const label of ['Séance','Membre','Rubrique','Saisi','Net actuel','Gestionnaire','Date','Actions']){const th=document.createElement('th');th.textContent=label;head.append(th);}
      thead.append(head);table.append(thead);
      const tbody=document.createElement('tbody');
      for(const r of filtered.slice(begin,begin+pageSize)){
        const tr=document.createElement('tr'),cells=[meetingById.get(r.meetingId)??'Sans séance',memberById.get(r.membershipId)??r.membershipId,rubricById.get(r.rubricId)??r.rubricId,fmt(r.amount?.amount??0),fmt(r.netAmount),actorDisplayName(String(r.receivedBy??'')),date(r.receivedAt)+(r.latePosting?.isLate?' · tardive':'')];
        for(const value of cells){const td=document.createElement('td');td.textContent=String(value??'');tr.append(td);}
        const actions=document.createElement('td');
        const statement=document.createElement('button');statement.type='button';statement.className='link-btn';statement.textContent='Relevé';statement.onclick=()=>showStatement(r.membershipId).catch(fail);actions.append(statement);
        if(r.netAmount>0){const reverse=document.createElement('button');reverse.type='button';reverse.className='link-btn';reverse.textContent='Annuler avec trace';reverse.title='Annule cette écriture en conservant son historique. Pour remplacer le montant, utilisez « Saisir / corriger » dans la cellule de la feuille.';reverse.onclick=async()=>{
          const reason=prompt('Pourquoi annuler / corriger cette écriture ? Le reçu original restera visible et Eco-System créera automatiquement l’écriture inverse.');if(!reason?.trim())return;
          reverse.disabled=true;try{await app.reverseLedgerEntry(r.ledgerEntryId,reason);await renderLedger();toast('Correction enregistrée : l’écriture originale est conservée et son inverse a été ajouté.');}catch(e){fail(e);reverse.disabled=false;}
        };actions.append(reverse);}
        tr.append(actions);tbody.append(tr);
      }
      table.append(tbody);wrap.replaceChildren(table);
      count.textContent=(filtered.length?(begin+1)+'–'+Math.min(begin+pageSize,filtered.length):'0')+' / '+filtered.length+' écritures';prev.disabled=ledgerHistoryFilters.page===0;next.disabled=ledgerHistoryFilters.page>=maxPage;
    };
    search.addEventListener('input',()=>{ledgerHistoryFilters.search=search.value;ledgerHistoryFilters.page=0;renderPage();});
    chooseMeeting.addEventListener('change',()=>{ledgerHistoryFilters.meetingId=chooseMeeting.value;ledgerHistoryFilters.page=0;renderPage();});
    prev.addEventListener('click',()=>{ledgerHistoryFilters.page=Math.max(0,ledgerHistoryFilters.page-1);renderPage();});
    next.addEventListener('click',()=>{ledgerHistoryFilters.page++;renderPage();});
    receipts.append(controls,wrap,footer);renderPage();
};
const renderOutbox = () => { const root = $('#outboxList'); root.replaceChildren(); const xs = app.outboxItems(); if (!xs.length) {
    root.innerHTML = '<li class="empty-state">Aucune opération en attente.</li>';
    return;
} for (const x of xs) {
    const li = document.createElement('li'),label=document.createElement('span');
    label.textContent = `${x.type} · ${x.status} · tentative ${x.attempts}/5`;li.append(label);
    if(x.status==='FAILED'&&x.attempts>=5){const retry=document.createElement('button');retry.type='button';retry.className='link-btn';retry.textContent=tx('Réessayer','Retry');retry.onclick=()=>void(async()=>{await app.retryOutboxItem(x.id);renderOutbox();if(navigator.onLine){await app.syncOutbox();renderOutbox();}})();li.append(retry);}
    root.append(li);
} };
const renderCompatibility = () => {
    const caps = { serviceWorker: 'serviceWorker' in navigator, indexedDb: 'indexedDB' in window, webRtc: 'RTCPeerConnection' in window, bluetooth: 'bluetooth' in navigator, microphone: Boolean(navigator.mediaDevices?.getUserMedia), webGpu: 'gpu' in navigator };
    const r = app.deviceCompatibility(caps);
    $('#compatibilityLevel').innerHTML = html`<strong>${r.level}</strong>`;
    const root = $('#compatibilityList');
    root.replaceChildren();
    for (const [k, v] of Object.entries(caps)) {
        const li = document.createElement('li');
        li.textContent = `${k} : ${String(v)}`;
        root.append(li);
    }
};
const renderKernel = () => { const root = $('#kernelList'); root.replaceChildren(); for (const id of app.kernelServices()) {
    const li = document.createElement('li');
    li.textContent = id;
    root.append(li);
} const s = app.safetyState(); $('#safetyState').innerHTML = html`<article class="item"><strong>Argent réel</strong><p>${s.realMoneyEnabled ? 'ACTIF' : 'DÉSACTIVÉ'}</p></article><article class="item"><strong>Ledger cash manuel</strong><p>${s.manualCashLedgerEnabled ? 'Actif' : 'Inactif'}</p></article><article class="item"><strong>IA cloud payante</strong><p>${s.cloudAiBudgetEnabled ? 'Active' : 'Désactivée'}</p></article>`; };
const moduleLabel = (m) => uiLocale === 'en' ? (m.labelEn || m.labelFr) : m.labelFr;
const statusCopy = (status) => ({
    FOUNDATION_ACTIVE: tx('Parcours de base','Foundation journey'),
    STRUCTURAL_V1: tx('Dossier · service à compléter','Record · service to complete'),
    PLANNED_DOMAIN: tx('Domaine planifié','Planned domain'),
    LATER_OPTIONAL: tx('Option ultérieure','Later option')
}[status] ?? status);
const renderModules = () => {
    const q = val('catalogSearch').toLowerCase();
    const root = $('#moduleCatalog');
    root.replaceChildren();
    const chosen = modules.filter(m => (selectedLot === 'ALL' || m.lot === selectedLot) && (!q || `${m.id} ${m.labelFr} ${m.labelEn}`.toLowerCase().includes(q)));
    $('#capabilityCount').textContent = String(modules.length);
    for (const m of chosen) {
        const a = document.createElement('article');
        a.className = 'module-card';
        a.dataset.capabilityId=m.id;a.tabIndex=0;a.setAttribute('role','button');
        a.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();a.click();}};
        a.innerHTML = html`<span class="module-status ${m.status.toLowerCase()}">${statusCopy(m.status)}</span><strong>${moduleLabel(m)}</strong><small>${m.id} · ${tx('Lot','Lot')} ${m.lot} · ${m.workspace === 'SPECIALIZED' ? tx('moteur spécialisé','specialized engine') : tx('workspace universel','universal workspace')}</small>`;
        a.onclick = () => void openModule(m.id);
        root.append(a);
    }
};
const renderLotFilters = () => { const root = $('#lotFilters'); root.replaceChildren(); for (const lot of ['ALL', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
    const b = document.createElement('button');
    b.className = `filter ${lot === selectedLot ? 'active' : ''}`;
    b.textContent = lot === 'ALL' ? tx('Tous','All') : `Lot ${lot}`;
    b.onclick = () => { selectedLot = lot; renderLotFilters(); renderModules(); };
    root.append(b);
} };
const renderEcosystemHighlights = () => {
    const ids = ['COMMUNITY.FORUM', 'COMMUNITY.PRO_HUBS', 'MARKETPLACE.GROUP_BUY', 'MANAGER.BUSINESS_STUDIO', 'ADS.MANAGER', 'LEARNING.MANAGER_ACADEMY', 'AI.ASSISTANT', 'PAPER.BRIDGE'];
    const root = $('#ecosystemHighlights');
    root.replaceChildren();
    for (const id of ids) {
        const m = modules.find(x => x.id === id);
        if (!m)
            continue;
        const b = document.createElement('button');
        b.className = 'quick';
        b.innerHTML = html`<b>${moduleLabel(m)}</b><span>${m.id}</span>`;
        b.onclick = () => void openModule(id);
        root.append(b);
    }
};
const STATUS_COPY = new Proxy({}, { get: (_target, key) => statusCopy(String(key)) });
const specializedRoute = (id) => {
    if (id.startsWith('DISCOVERY.') || id.startsWith('MEMBERSHIP.') || id.startsWith('CORE.IDENTITY'))
        return 'discovery';
    if (id.startsWith('GROUP.') || id.startsWith('CORE.ASSOCIATIONS') || id.startsWith('CORE.ROTATING') || id.startsWith('CORE.IN_KIND') || id.startsWith('CORE.HYBRID'))
        return 'launch';
    if (id.startsWith('RUBRIC.') || id === 'CORE.RUBRICS' || id.startsWith('MEETING.'))
        return 'operations';
    if (id.startsWith('LEDGER.') || id.startsWith('FINANCE.') || id.startsWith('SAVINGS.') || id.startsWith('LOAN.') || id.startsWith('SOLIDARITY.'))
        return 'finance';
    if (id.startsWith('ADS.'))
        return 'ecosystem';
    if (id.startsWith('OFFLINE.') || id.startsWith('SUPPORT.') || id.startsWith('EXPERIENCE.UNIVERSAL_INBOX'))
        return 'inbox';
    if (id.startsWith('PARTNERS.') || id === 'LEARNING.NGO' || id.startsWith('ADS.'))
        return 'ecosystem';
    if (id.startsWith('SECURITY.') || id.startsWith('BACKUP.') || id.startsWith('OBSERVABILITY.') || id.startsWith('COMPATIBILITY.') || id.startsWith('DATA.'))
        return 'settings';
    return undefined;
};
const openModule = async (id) => {
    // Retain an early menu click until account, group and catalogue are ready.
    // Secondary panel reads must not block navigation; startup restores the
    // latest history state so it preserves the destination chosen meanwhile.
    let startup;
    do { startup=applicationStartup; await startup; } while(startup!==applicationStartup);
    const m = modules.find(x => x.id === id);
    if (!m)
        return;
    if(m.status==='FOUNDATION_ACTIVE'&&['MARKETPLACE.CORE','MARKETPLACE.GROUP_BUY'].includes(id)){
        const captured=JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]);
        await go('ecosystem',{anchor:'marketEnginePanel',force:true});
        if(captured!==JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]))return;
        const panel=document.getElementById('marketEnginePanel');if(panel)panel.open=true;
        if(id==='MARKETPLACE.CORE')await personalShopsUI.open();
        await advancedUI.openMarket();return;
    }
    if(m.status==='FOUNDATION_ACTIVE'&&['COMMUNITY.FORUM','COMMUNITY.PRO_HUBS'].includes(id)){
        go('ecosystem',{anchor:'communityEnginePanel',force:true});
        await communityShopUI.refresh();return;
    }
    if(m.status==='FOUNDATION_ACTIVE'&&id==='ADS.MANAGER'){
        go('ecosystem',{anchor:'adManagerPanel',force:true});
        await adManagerUI.refresh();return;
    }
    if(m.status==='FOUNDATION_ACTIVE'&&id==='SEARCH.UNIVERSAL'){await go('ecosystem',{anchor:'universalSearchPanel',force:true});const panel=document.getElementById('universalSearchPanel');if(panel?.tagName==='DETAILS')panel.open=true;return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'CALENDAR.UNIFIED'){go('ecosystem',{anchor:'unifiedCalendarPanel',force:true});const panel=document.querySelector('#unifiedCalendarPanel');if(panel?.tagName==='DETAILS')panel.open=true;void renderUnifiedCalendar();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'GOVERNANCE.DOCUMENT_STUDIO'){go('documents',{force:true});void documentsUI.refresh();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'TRUST.VERIFICATION'){go('settings',{anchor:'verificationAssertionsPanel',force:true});governedGroupUI.open('trust');return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'GOVERNANCE.VOTE'){go('operations',{anchor:'governanceExecutionPanel',force:true});governedGroupUI.open('governance');return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'DATA.QUALITY'){go('settings',{anchor:'dataQualityCenter',force:true});void dataQualityUI.refresh();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'PAPER.BRIDGE'){go('documents',{force:true});void documentsUI.refresh();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'RUBRIC.STARTER_KITS'){go('launch',{anchor:'savedStarterKitPanel',force:true});starterKitUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && ['GROUP.MODEL_REGISTRY','GROUP.CASE_LAW'].includes(id)){go('settings',{anchor:'groupLearningRegistry',force:true});groupLearningRegistryUI.open(id==='GROUP.MODEL_REGISTRY'?'models':'cases');return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'GROUP.ANTICIPATION'){go('dashboard',{anchor:'anticipationCenter',force:true});anticipationUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'COMMUNITY.MICRO_ADS'){go('ecosystem',{anchor:'microAdsCenter',force:true});microAdsUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'MANAGER.VALUE_DISCOVERY'){go('ecosystem',{anchor:'valueDiscoveryCenter',force:true});valueDiscoveryUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'FINANCE.WALLET'){go('dashboard',{anchor:'walletCenter',force:true});walletUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'FINANCE.ENVELOPES'){go('dashboard',{anchor:'memberEnvelopeCenter',force:true});memberEnvelopeUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'OPPORTUNITY.GRAPH'){go('ecosystem',{anchor:'opportunityGraphCenter',force:true});opportunityGraphUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'MANAGER.BUSINESS_STUDIO'){go('ecosystem',{anchor:'businessStudioOperational',force:true});economicExperimentsUI.open('experiments');return;}
    if(m.status === 'FOUNDATION_ACTIVE' && ['OPPORTUNITY.NEED','OPPORTUNITY.OFFER'].includes(id)){go('ecosystem',{anchor:'valueNetworkOperational',force:true});economicExperimentsUI.open('pools');return;}
    if(m.status === 'FOUNDATION_ACTIVE' && ['LEARNING.MANAGER_ACADEMY','MEMBERSHIP.PORTFOLIO'].includes(id)){go('ecosystem',{anchor:'productiveCommunityCenter',force:true});productiveCommunityUI.open(id==='MEMBERSHIP.PORTFOLIO'?'notebook':'practice');return;}
    if(m.status === 'FOUNDATION_ACTIVE' && ['CREATOR.STUDIO','LEARNING.TALENT'].includes(id)){go('ecosystem',{anchor:'creatorTalentCenter',force:true});creatorTalentUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'MANAGER.PUBLIC_PROFILE'){go('discovery',{anchor:'managerPublicProfileCenter',force:true});managerPublicProfileUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'MARKETPLACE.MARKET_INTELLIGENCE'){go('ecosystem',{anchor:'opportunityIntelligence',force:true});opportunityIntelligenceUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'GOVERNANCE.TENDER'){go('ecosystem',{anchor:'socialCommercePanel',force:true});const panel=document.querySelector('#socialCommercePanel');if(panel?.tagName==='DETAILS')panel.open=true;return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'RUBRIC.LOCAL_AID'){go('operations',{anchor:'rubricsManagementPanel',force:true});setTimeout(()=>prepareRubricPreset('Aide locale','Rubrique principale de contribution, au même niveau métier que Collation / Ration. Confirmer la règle du groupe : montant, présence/absence, bénéficiaire, solidarité, manquant et décaissement.'),80);return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'RUBRIC.HAND_RAISE'){go('operations',{anchor:'rubricsManagementPanel',force:true});setTimeout(()=>prepareRubricPreset('Main levée','Rubrique principale événementielle : définir motif, bénéficiaire, participation obligatoire ou volontaire, montant ou règle de calcul, preuve et validation du groupe.'),80);return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'FINANCE.TRUST_SCORE'){go('members',{anchor:'trustGraphCenter',force:true});void trustCenterUI.refresh();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && ['MEETING.PREPAYMENTS','MEETING.REOPEN_AUTH'].includes(id)){go('sessions',{anchor:'meetingFinanceGovernanceCenter',force:true});meetingFinanceGovernanceUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'AI.LOCAL'){go('assistant',{anchor:'localAssistantCenter',force:true});localAssistantUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'SAFETY.QUIET_WATCH'){go('dashboard',{anchor:'quietWatchCenter',force:true});quietWatchUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'AI.FOUNDER'){go('control',{anchor:'founderAICenter',force:true});founderAIUI.open();return;}
    if(m.status === 'FOUNDATION_ACTIVE' && id === 'DASHBOARDS.ALL'){go('dashboard',{anchor:'roleDashboardsCenter',force:true});roleDashboardsUI.open();return;}
    const destination=m.status==='FOUNDATION_ACTIVE'?canonicalCapabilityDestination(id):null;
    if(destination){
        const {view,preset,registryTab,...options}=destination;
        await go(view,{...options,force:true});
        if(preset)window.dispatchEvent(new CustomEvent('eco:value-network-preset',{detail:{kind:preset}}));
        if(registryTab)operationalRegistryUI.open(registryTab);
        return;
    }
    const route = m.workspace === 'SPECIALIZED' && m.status === 'FOUNDATION_ACTIVE' ? specializedRoute(id) : undefined;
    if (route) {
        go(route);
        toast(moduleLabel(m));
        return;
    }
    $('#workspaceModule').value = id;
    go('services');
    await loadWorkspaces();
    setTimeout(() => $('#workspaceTitle').focus(), 50);
};
const hubCard = (m) => { const a = document.createElement('article'); a.className = 'hub-card'; a.innerHTML = html`<header><b>${moduleLabel(m)}</b><span class="truth-chip ${m.status.toLowerCase()}">${statusCopy(m.status)}</span></header><p>${m.id} · Lot ${m.lot}</p><small>${m.workspace === 'SPECIALIZED' ? tx('Fonctions de base disponibles','Foundation functions available') : tx('Organisation de vos notes et informations','Organize your notes and information')}</small>`; const b = document.createElement('button'); b.type = 'button'; b.className = m.workspace === 'SPECIALIZED' ? 'primary' : 'link-btn'; b.textContent = m.workspace === 'SPECIALIZED' && m.status === 'FOUNDATION_ACTIVE' ? tx('Ouvrir','Open') : tx('Ouvrir le dossier','Open record'); b.onclick = () => void openModule(m.id); a.append(b); return a; };
const fillHub = (selector, predicate, limit = 12) => { const root = $(selector); root.replaceChildren(); for (const m of modules.filter(predicate).slice(0, limit))
    root.append(hubCard(m)); };
const renderDomainHubs = () => {
    fillHub('#discoveryHub', m => m.lot === 'B' && m.id !== 'DISCOVERY.GROUP_SEARCH' && m.id !== 'MEMBERSHIP.APPLICATION', 9);
    fillHub('#launchHub', m => m.lot === 'C' && ['GROUP.', 'CORE.', 'RUBRIC.STARTER', 'RUBRIC.EXCEPTIONS'].some(p => m.id.startsWith(p)), 9);
    fillHub('#meetingHub', m => m.lot === 'D' && m.id !== 'MEETING.COMMAND_CENTER' && m.id !== 'MEETING.CASHBOX.RECONCILE', 9);
    fillHub('#financeHub', m => m.lot === 'E', 12);
    fillHub('#communityHub', m => m.lot === 'F' && (m.id.startsWith('COMMUNITY.') || m.id.startsWith('MANAGER.') || m.id.startsWith('GROWTH.') || m.id.startsWith('PARTNERS.')), 12);
    fillHub('#marketHub', m => m.lot === 'F' && (m.id.startsWith('MARKETPLACE.') || m.id.startsWith('SUPPLIER.') || m.id.startsWith('BUSINESS.') || m.id.startsWith('PROCUREMENT.') || m.id.startsWith('COMMERCE.')), 12);
    fillHub('#growthHub', m => m.lot === 'G', 12);
    fillHub('#guidanceHub', m => m.lot === 'H', 12);
    fillHub('#reportsHub', m => m.lot === 'I', 12);
    fillHub('#hardeningHub', m => m.lot === 'J', 12);
};
const populateWorkspaceModules = () => { const sel = $('#workspaceModule'); sel.replaceChildren(); for (const m of modules) {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = `${moduleLabel(m)} — ${m.id}`;
    sel.append(o);
} };
const loadWorkspaces = async () => {
    try {
        clearFail();
        if(app.activeGroup()&&!isManager()){$('#workspaceRecords').textContent=tx('Les dossiers du groupe sont réservés à ses responsables.','Group records are reserved for its leaders.');return;}
        const moduleId = val('workspaceModule');
        const xs = await app.listWorkspaceRecords(moduleId);
        const root = $('#workspaceRecords');
        root.replaceChildren();
        if (!xs.length) {
            root.innerHTML = `<div class="empty-state">${tx('Aucun dossier pour ce service. Créez le premier.','No record for this service. Create the first one.')}</div>`;
            return;
        }
        for (const x of xs.slice().reverse()) {
            const a = document.createElement('article');
            a.className = 'item';
            a.innerHTML = html`<strong>${x.title}</strong><p>${x.summary ?? ''}</p><small>${x.status} · ${x.tags.join(', ')} · ${date(x.updatedAt)}</small>`;
            const b = document.createElement('button');
            b.className = 'link-btn';
            b.textContent = x.status === 'DONE' ? tx('Réactiver','Reactivate') : tx('Marquer terminé','Mark done');
            b.onclick = async () => { await app.updateWorkspaceRecord(x.id, { status: x.status === 'DONE' ? 'ACTIVE' : 'DONE' }); await loadWorkspaces(); };
            a.append(b);
            root.append(a);
        }
    }
    catch (e) {
        fail(e);
    }
};
const renderDiscoveryResults = (xs) => { const root = $('#discoveryResults'); root.replaceChildren(); if (!xs.length) {
    root.innerHTML = '<div class="empty-state">Aucun groupe public correspondant.</div>';
    return;
} for (const x of xs) {
    const l = x.listing;
    const a = document.createElement('article');
    a.className = 'item';
    a.innerHTML = html`<strong>${l.name}</strong><p>${l.locality ?? 'Localité non publiée'} · ${l.family}</p><small>Affinité ${x.score} · ${l.recruiting ? 'recrute' : 'ne recrute pas actuellement'}</small>`;
    const b = document.createElement('button');
    b.className = 'primary';
    b.textContent = 'Demander à rejoindre';
    b.disabled = l.joinPolicy === 'CLOSED' || l.joinPolicy === 'INVITE_ONLY';
    b.onclick = async () => { try {
        await app.requestToJoin(l.groupId, 'Candidature envoyée depuis Eco-System 1.3');
        await app.recordEcoPulse({itemId:l.groupId,itemKind:'public-group',action:'SEARCH_CLICK',source:'group-discovery',locality:l.locality,tags:[l.family,...(l.missionTags??[]),...(l.activityTags??[])]}).catch(()=>{});
        toast('Candidature envoyée.');
        void personalCockpitUI.refreshPulse?.();
    }
    catch (e) {
        fail(e);
    } };
    a.append(b);
    root.append(a);
} };
const renderApplications = async () => { const root = $('#applicationsBox'); root.replaceChildren(); if (!app.activeGroup()) {
    root.innerHTML = '<div class="empty-state">Sélectionnez un groupe pour voir ses candidatures.</div>';
    return;
} try {
    const xs = await app.listApplications();
    if (!xs.length) {
        root.innerHTML = '<div class="empty-state">Aucune candidature en attente.</div>';
        return;
    }
    for (const x of xs) {
        const a = document.createElement('article');
        a.className = 'item';
        a.innerHTML = html`<strong>${x.applicantUserId}</strong><p>${x.message ?? ''}</p><small>${x.status}</small>`;
        if (x.status === 'PENDING') {
            for (const decision of ['APPROVE', 'REJECT']) {
                const b = document.createElement('button');
                b.className = decision === 'APPROVE' ? 'primary' : 'link-btn';
                b.textContent = decision === 'APPROVE' ? 'Approuver' : 'Refuser';
                b.onclick = async () => { try {
                    await app.decideApplication(x.id, decision);
                    toast(decision === 'APPROVE' ? 'Adhésion approuvée.' : 'Candidature refusée.');
                    await renderApplications();
                    await renderMembers();
                }
                catch (e) {
                    fail(e);
                } };
                a.append(b);
            }
        }
        root.append(a);
    }
}
catch (e) {
    fail(e);
} };
const renderTrash=async()=>{
    const root=document.querySelector('#trashList');if(!root)return;root.replaceChildren();
    const parseJsonArray=value=>{try{const x=JSON.parse(String(value??'[]'));return Array.isArray(x)?x.map(String):[];}catch{return[];}};
    try{
      const groupItems=await app.groupTrashItems().catch(()=>[]),scoped=app.activeGroup()?await app.trashItems().catch(()=>[]):[],seen=new Set(),now=Date.now(),restoredWindow=72*60*60*1000;
      const items=[...groupItems,...scoped].filter(x=>{
        if(seen.has(x.id))return false;seen.add(x.id);
        const restored=String(x.data?.lifecycleState??'')==='RESTORED'||x.status==='DONE';
        if(!restored)return true;
        const restoredAt=Date.parse(String(x.data?.restoredAt??x.updatedAt??''));return Number.isFinite(restoredAt)&&now-restoredAt<=restoredWindow;
      });
      if(!items.length){root.innerHTML='<div class="empty-state">'+tx('Corbeille vide.','Trash is empty.')+'</div>';return;}
      for(const item of items){
        const restored=String(item.data?.lifecycleState??'')==='RESTORED'||item.status==='DONE',expired=!restored&&(item.status!=='ACTIVE'||Boolean(item.data?.expired)),a=document.createElement('article');a.className='item '+(restored?'trash-restored ':expired?'trash-expired ':'');
        const kind={MEETING:tx('Séance','Meeting'),MEMBER:tx('Membre','Member'),RUBRIC:tx('Rubrique','Rubric'),GROUP:tx('Groupe','Group')}[item.data?.kind]??String(item.data?.kind??'Élément');
        const h=document.createElement('strong');h.textContent=kind+' · '+item.title;
        const restoredAt=Date.parse(String(item.data?.restoredAt??item.updatedAt??'')),visibleUntil=Number.isFinite(restoredAt)?new Date(restoredAt+restoredWindow).toISOString():'';
        const p=document.createElement('p');p.textContent=restored
          ?tx('Restauré avec succès · ce message disparaît automatiquement après 72 h. Visible jusqu’au ','Restored successfully · this message disappears automatically after 72 h. Visible until ')+date(visibleUntil)
          :expired
            ?tx('Délai expiré : les données métier restaurables ont été purgées. Seules des traces techniques/statistiques minimales non reconstructives peuvent subsister.','Retention expired: restorable business data was purged. Only minimal non-reconstructive technical/statistical traces may remain.')
            :tx('Restaurable jusqu’au ','Restorable until ')+date(String(item.data?.restoreUntil??''));
        a.append(h,p);

        if(item.data?.kind==='GROUP'&&!expired&&!restored){
          const optedOut=parseJsonArray(item.data?.reminderOptOutUserIdsJson).includes(app.currentActor());
          const reminder=document.createElement('p');reminder.className='hint';reminder.textContent=optedOut
            ?tx('Vous avez désactivé votre rappel mensuel.','You disabled your monthly reminder.')
            :tx('Votre rappel mensuel est actif tant que ce groupe reste restaurable.','Your monthly reminder stays active while this group can be restored.');
          a.append(reminder);
          try{
            const petition=await app.groupPetitionStatus(item.id),box=document.createElement('div');box.className='truth-notice';
            const status=document.createElement('strong');status.textContent=tx('Pétition de reconstitution : ','Reconstitution petition: ')+petition.signatureCount+' / '+petition.threshold;
            const detail=document.createElement('p');detail.textContent=petition.reached
              ?tx('Seuil des 2/3 atteint. Les signataires peuvent constituer un nouveau groupe sans transfert automatique de l’argent, des dettes ou des créances.','Two-thirds threshold reached. Signatories can form a new group without automatic transfer of money, debts or receivables.')
              :tx('Électorat figé au moment du retrait : ','Electorate frozen at deletion: ')+petition.electorateCount+tx(' membres.',' members.');
            box.append(status,detail);
            const actions=document.createElement('div');actions.className='actions';
            const sign=document.createElement('button');sign.type='button';sign.className='secondary';sign.textContent=petition.signedByMe?tx('Retirer ma signature','Withdraw my signature'):tx('Signer la pétition','Sign the petition');
            sign.onclick=()=>void(async()=>{try{petition.signedByMe?await app.withdrawGroupPetition(item.id):await app.signGroupPetition(item.id);await renderTrash();toast(petition.signedByMe?tx('Signature retirée.','Signature withdrawn.'):tx('Signature enregistrée.','Signature recorded.'));}catch(e){fail(e);}})();actions.append(sign);
            if(petition.reached&&!petition.successorGroupId){
              const successor=document.createElement('button');successor.type='button';successor.className='primary';successor.textContent=tx('Créer le nouveau groupe','Create successor group');
              successor.onclick=()=>void(async()=>{try{
                const name=prompt(tx('Nom du nouveau groupe (laisser vide pour reprendre le nom avec « reconstitué ») :','New group name (leave empty to reuse the name with “reconstituted”):'))??'';
                const purpose=prompt(tx('Objet ou motif de la reconstitution :','Purpose of reconstitution:'))??'';
                const result=await app.createSuccessorGroup(item.id,{name:name.trim()||undefined,purpose:purpose.trim()||undefined});
                toast(tx('Nouveau groupe créé. Aucun transfert financier automatique n’a été effectué.','Successor group created. No automatic financial transfer was made.'));
                await renderGroups();await renderTrash();
              }catch(e){fail(e);}})();actions.append(successor);
            }
            if(petition.successorGroupId){const done=document.createElement('span');done.className='pill';done.textContent=tx('Groupe successeur créé','Successor group created');actions.append(done);}
            box.append(actions);a.append(box);
          }catch(error){if(error instanceof Error&&!['FORBIDDEN_SCOPE','PETITION_ELECTORATE_REQUIRED'].includes(error.message))console.warn(error);}
        }

        if(!expired&&!restored){
          const restore=document.createElement('button');restore.type='button';restore.className='primary';restore.textContent=tx('Restaurer intégralement','Restore fully');
          restore.onclick=()=>void(async()=>{try{if(item.data?.kind==='GROUP')await app.restoreGroupTrashItem(item.id);else await app.restoreTrashItem(item.id);clearFail();await renderGroups();await refreshGroupContext();await renderTrash();toast(tx('Élément restauré. Il restera signalé ici pendant 72 h.','Item restored. It will remain noted here for 72 hours.'));}catch(e){fail(e);}})();a.append(restore);
          if(item.data?.kind==='GROUP'){
            const optedOut=parseJsonArray(item.data?.reminderOptOutUserIdsJson).includes(app.currentActor()),mute=document.createElement('button');mute.type='button';mute.className='secondary';mute.textContent=optedOut?tx('Réactiver mon rappel mensuel','Enable my monthly reminder'):tx('Ne plus me rappeler chaque mois','Stop my monthly reminder');
            mute.onclick=()=>void(async()=>{try{await app.setGroupTrashReminders(item.id,optedOut);await renderTrash();toast(optedOut?tx('Rappel réactivé.','Reminder enabled.'):tx('Votre rappel a été désactivé.','Your reminder was disabled.'));}catch(e){fail(e);}})();a.append(mute);
          }
        }
        root.append(a);
      }
    }catch(e){fail(e);}
};
document.querySelector('#trashRefreshBtn')?.addEventListener('click',()=>void renderTrash());
const refreshOptionalOfflineSafe=async(label,fn)=>{
    try{return await fn();}
    catch(error){
        if(!navigator.onLine && error instanceof Error && error.message==='NETWORK_UNAVAILABLE'){
            console.info('Offline optional section skipped:',label);
            return;
        }
        throw error;
    }
};
window.addEventListener('eco:view-changed',event=>{
    if(event.detail?.view!=='dashboard'||hydratedDashboardScope!==dashboardScope())return;
    // Refresh the existing projections when the user returns or refreshes Home.
    // Context hydration owns the initial load; there is no background polling.
    void Promise.all([groupHomeUI.refresh(),roleDashboardsUI.refresh()]).catch(fail);
});
const openNoticeAction=action=>{
    if(!action?.view)return;
    go(action.view,{anchor:action.anchor,meetingId:action.meetingId,matrixMeetingId:action.meetingId,sheetMode:action.membershipId&&action.rubricId?'meeting':undefined,membershipId:action.membershipId,rubricId:action.rubricId,force:true});
    if(action.meetingId&&action.membershipId&&action.rubricId)setTimeout(()=>{highlightRemoteFinancialCell({...action,actorName:action.actorName||tx('Gestionnaire','Manager')});document.querySelector('.remote-financial-change')?.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});},180);
    if(action.entityKind&&action.entityId)requestAnimationFrame(()=>{
      const type=String(action.entityKind).toLowerCase(),selector=`[data-detail-type="${CSS.escape(type)}"][data-detail-id="${CSS.escape(String(action.entityId))}"]`,button=document.querySelector(selector);
      button?.scrollIntoView({behavior:'smooth',block:'center'});button?.click?.();
    });
};
const renderUrgentNotifications=async()=>{
    const root=document.querySelector('#urgentNotificationsList');if(!root)return;
    root.replaceChildren();
    if(!app.activeGroup()){root.innerHTML='<div class="empty-state">'+tx('Sélectionnez un groupe pour voir ses alertes.','Select a group to see its alerts.')+'</div>';return;}
    try{
      const notices=await app.groupNotifications(),rank={CRITICAL:4,HIGH:3,NORMAL:2,LOW:1},unread=notices.filter(x=>!x.read).sort((a,b)=>(rank[String(b.priority)]??0)-(rank[String(a.priority)]??0)||String(b.createdAt??'').localeCompare(String(a.createdAt??''))),urgent=unread.filter(x=>['HIGH','CRITICAL'].includes(String(x.priority))).slice(0,5);
      const allButton=document.querySelector('#urgentNotificationsAllBtn');if(allButton)allButton.textContent=tx('Toutes les alertes','All alerts')+(unread.length?' · '+unread.length:'');
      if(!urgent.length){root.innerHTML='<div class="empty-state">'+tx('Aucune notification urgente.','No urgent notification.')+'</div>';return;}
      for(const n of urgent){
        const article=document.createElement('article');article.className='item '+(n.priority==='CRITICAL'?'urgent-critical':'urgent-high');
        const h=document.createElement('strong');h.textContent=(n.priority==='CRITICAL'?'🔴 ':'🟠 ')+n.title;
        const p=document.createElement('p');p.textContent=n.message??'';const meta=document.createElement('small');meta.textContent=tx('Auteur : ','Author: ')+actorDisplayName(n.createdBy)+' · '+date(n.createdAt);
        const actions=document.createElement('div');actions.className='actions';
        if(n.action?.view){const open=document.createElement('button');open.type='button';open.className='primary';open.textContent=n.action.label||tx('Voir le détail','View details');open.onclick=()=>void openAuthorizedNotice({...n,groupId:app.activeGroup()}).catch(fail);actions.append(open);}
        const seen=document.createElement('button');seen.type='button';seen.className='secondary';seen.textContent=tx('Marquer comme lu','Mark as read');seen.onclick=()=>void(async()=>{try{await app.markGroupNotificationRead(n.id);await renderUrgentNotifications();await renderFinancialAlerts();}catch(e){fail(e);}})();actions.append(seen);
        article.append(h,p,meta,actions);root.append(article);
      }
    }catch(error){if(navigator.onLine)fail(error);else root.innerHTML='<div class="empty-state">'+tx('Alertes non synchronisées hors ligne. Les alertes déjà chargées restent disponibles dans les copies locales.','Alerts not synchronized offline. Previously loaded alerts remain in local copies.')+'</div>';}
};
document.querySelector('#urgentNotificationsRefreshBtn')?.addEventListener('click',()=>void renderUrgentNotifications());
document.querySelector('#urgentNotificationsAllBtn')?.addEventListener('click',()=>{go('inbox',{anchor:'notificationCenterPanel',force:true});setTimeout(()=>document.querySelector('#notificationCenterPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),120);});
const renderNotificationCenter=async(options={})=>{
  if(!document.querySelector('#view-inbox.active'))return;
  await notificationCenterUI.refresh(options);
};
document.querySelector('#notificationCenterRefreshBtn')?.addEventListener('click',()=>void renderNotificationCenter());
window.addEventListener('eco:view-changed',event=>{
  if(event.detail?.view==='inbox'){void renderNotificationCenter();void ecoCareUI.refresh();}
});

const DISMISSED_FINANCIAL_ALERTS='eco.dismissedFinancialAlerts';
const dismissedFinancialAlerts=()=>{try{return new Set(JSON.parse(sessionStorage.getItem(DISMISSED_FINANCIAL_ALERTS)||'[]'));}catch{return new Set();}};
const dismissFinancialAlert=id=>{if(!id)return;try{const rows=dismissedFinancialAlerts();rows.add(String(id));sessionStorage.setItem(DISMISSED_FINANCIAL_ALERTS,JSON.stringify([...rows].slice(-80)));}catch{}};
const showFinancialAlert=(input={})=>{
    const bar=document.querySelector('#financialAlertBar');if(!bar)return;
    if(!input.review&&!input.conflict&&financialReviewInbox.size){renderPendingFinancialReviewAlert();return;}
    clearTimeout(Number(bar.dataset.autoHideTimer||0));
    // A late informational push must not erase the unresolved conflict's
    // comparison action while the manager defers the modal.
    const criticalKey=bar.dataset.criticalCellKey;
    if(criticalKey&&!input.conflict&&!input.review&&(app.pendingFinancialCellTargets?.()??[]).some(x=>financialCellKey(x.membershipId,x.rubricId,x.meetingId)===criticalKey)){bar.hidden=false;return;}
    delete bar.dataset.criticalCellKey;
    if(input.notificationId&&dismissedFinancialAlerts().has(String(input.notificationId))){bar.hidden=true;return;}
    bar.replaceChildren();const title=document.createElement('strong'),message=document.createElement('span');
    title.textContent=input.title||tx('Mise à jour financière','Financial update');message.textContent=' · '+String(input.message||'');
    bar.className='financial-alert-bar '+(input.closed?'is-critical':input.correction?'is-closed':'is-open');bar.hidden=false;bar.append(title,message);
    if(input.action?.view){const open=document.createElement('button');open.type='button';open.className='link-btn';open.textContent=input.action.label||tx('Voir le détail','View details');open.onclick=()=>openNoticeAction(input.action);bar.append(open);}
    if(input.notificationId){const seen=document.createElement('button');seen.type='button';seen.className='link-btn';seen.textContent=tx('J’ai vu','Seen');seen.onclick=()=>void(async()=>{try{await app.markGroupNotificationRead(input.notificationId);bar.hidden=true;await renderUrgentNotifications();}catch(e){fail(e);}})();bar.append(seen);}
    if(!input.review&&!input.conflict){const close=document.createElement('button');close.type='button';close.className='link-btn financial-alert-close';close.textContent='× '+tx('Fermer','Close');close.title=tx('Masquer ce bandeau sans supprimer la notification du centre d’alertes','Hide this banner without deleting the notification from the alert center');close.onclick=()=>{if(input.notificationId)dismissFinancialAlert(input.notificationId);bar.hidden=true;};bar.append(close);}
    if(!input.notificationId&&!input.review&&!input.conflict)bar.dataset.autoHideTimer=String(setTimeout(()=>{bar.hidden=true;},9000));
};
const renderFinancialAlerts=async()=>{
    const bar=document.querySelector('#financialAlertBar');if(!bar)return;
    if(!app.activeGroup()){bar.hidden=true;return;}
    if(financialReviewInbox.size){renderPendingFinancialReviewAlert();return;}
    try{
      const dismissed=dismissedFinancialAlerts(),notices=await app.groupNotifications(),unread=notices.filter(x=>!x.read&&!dismissed.has(String(x.id))).filter(x=>/financi|cotisation|compte|séance clôturée/i.test(String(x.title??'')+' '+String(x.message??'')));
      const latest=unread[0];if(!latest){bar.hidden=true;return;}
      const closed=String(latest.priority)==='CRITICAL'||/clôtur|après clôture/i.test(String(latest.title??'')+' '+String(latest.message??''));
      showFinancialAlert({title:latest.title,message:latest.message,closed,correction:String(latest.priority)==='HIGH',notificationId:latest.id,action:latest.action});
    }catch(error){if(navigator.onLine)console.info('Financial alerts unavailable',error);}
};
const financialLiveSelector=p=>p?.meetingId&&p?.membershipId&&p?.rubricId?`.matrix-cell-entry[data-meeting-id="${CSS.escape(String(p.meetingId))}"][data-membership-id="${CSS.escape(String(p.membershipId))}"][data-rubric-id="${CSS.escape(String(p.rubricId))}"]`:'';
const renderPendingFinancialReviewAlert=()=>{
  const criticalKey=document.querySelector('#financialAlertBar')?.dataset.criticalCellKey;
  if(criticalKey&&(app.pendingFinancialCellTargets?.()??[]).some(x=>financialCellKey(x.membershipId,x.rubricId,x.meetingId)===criticalKey))return;
  const row=financialReviewInbox.values().next().value;if(!row)return;
  showFinancialAlert({review:true,correction:true,title:tx('Modifications à examiner','Changes to review'),message:tx(financialReviewInbox.size+' cellule(s) attendent votre accord ou une contestation. Cette alerte reste disponible après actualisation.',financialReviewInbox.size+' cell(s) await your approval or dispute. This alert remains after refresh.'),action:{view:'operations',anchor:'twoSheetWorkspace',...row,label:tx('Examiner la cellule','Review cell')}});
};
const restoreFinancialReviewInbox=()=>{
  for(const row of financialReviewInbox.values())highlightRemoteFinancialCell({...row,newAmount:Math.abs(row.amount??row.newAmount),at:row.updatedAt??row.at,restored:true});
  if(financialReviewInbox.size)renderPendingFinancialReviewAlert();
};
const resolveFinancialReviewProjection=detail=>{
  if(detail.actorId!==app.currentActor()||detail.groupId!==app.activeGroup()||detail.decision!=='APPROVE')return;
  const key=financialCellKey(detail.membershipId,detail.rubricId,detail.meetingId),pending=financialReviewInbox.get(key);
  if(pending&&Number(pending.cellVersion)>Number(detail.cellVersion))return;
  financialApprovedReviewVersions.set(key,Number(detail.cellVersion));
  financialReviewInbox.delete(key);
  for(const cell of document.querySelectorAll(financialLiveSelector(detail))){
    if(Number(cell.dataset.remoteVersion??0)>Number(detail.cellVersion))continue;
    cell.classList.remove('remote-financial-change','remote-financial-closed');
    for(const el of cell.querySelectorAll('.cell-remote-review-actions,.cell-remote-seen-btn,.cell-remote-change-note'))el.remove();
  }
  const bar=document.querySelector('#financialAlertBar');if(bar)bar.hidden=true;
  if(financialReviewInbox.size)renderPendingFinancialReviewAlert();
  void app.groupNotifications().then(async rows=>{for(const notice of rows){const action=notice.action;if(!notice.read&&action?.meetingId===detail.meetingId&&action?.membershipId===detail.membershipId&&action?.rubricId===detail.rubricId&&Number(action.cellVersion??0)<=Number(detail.cellVersion))await app.markGroupNotificationRead(notice.id);}}).catch(()=>{});
};
window.addEventListener('eco:financial-review-confirmed',event=>resolveFinancialReviewProjection(event.detail??{}));
const applyRemoteFinancialProjection=(p={})=>{
    const selector=financialLiveSelector(p);if(!selector)return;
    const amount=Number(p.newAmount);if(!Number.isSafeInteger(amount)||amount<0)return false;
    if(Number.isSafeInteger(Number(p.cellVersion))&&Number(p.cellVersion)<exactCellVersion(String(p.membershipId),String(p.rubricId),String(p.meetingId)))return false;
    // Remote projections never erase unconfirmed local financial intents.
    // Preserve them for the server CAS and visibly flag divergent edits.
    const pending=(app.outboxItems?.()??[]).find(item=>{
      if(['CONFIRMED','CANCELLED'].includes(String(item.status??'')))return false;
      if(!['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2','FINANCIAL_SHEET_ENTRY_V1'].includes(String(item.type)))return false;
      const d=item.payload??{};
      return String(d.meetingId??'')===String(p.meetingId)&&String(d.membershipId??'')===String(p.membershipId)&&String(d.rubricId??'')===String(p.rubricId);
    });
    if(pending){
      const localAmount=Number(pending.payload?.targetAmount??pending.payload?.amount);
      const baselineVersion=Number(pending.payload?.baselineVersion);
      if(Number.isFinite(localAmount)&&localAmount!==amount&&Number.isSafeInteger(baselineVersion)&&Number(p.cellVersion??0)<=baselineVersion)return false;
      if(Number.isFinite(localAmount)&&localAmount!==amount){
        markCriticalFinancialConflict({...p,amount:localAmount});
        const key=financialCellKey(String(p.membershipId),String(p.rubricId),String(p.meetingId));
        const projection=financialPendingTargets.get(key);if(projection)projection.businessStatus='REMOTE_DIVERGENCE';
        financialOptimisticValues.delete(key);
      }
    }
    forgetConfirmedCell(financialCellKey(String(p.membershipId??''),String(p.rubricId??''),String(p.meetingId??'')));
    const rubric=rubrics.find(x=>x.id===String(p.rubricId)),nature=financialNatureForRubric(rubric),signed=(nature==='LOAN'||nature==='OUTFLOW')?-Math.abs(amount):amount;
    financialDurableProjections.set(financialCellKey(String(p.membershipId),String(p.rubricId),String(p.meetingId)),{amount,cellVersion:Number(p.cellVersion??0),actorId:String(p.actorId??''),at:String(p.at??'')});
    patchFinancialDomCell({meetingId:p.meetingId,membershipId:p.membershipId,rubricId:p.rubricId,amount:signed,cellVersion:p.cellVersion,remote:true,preservePending:Boolean(pending)});
    // Keep the confirmed server delta across an offline reload, including when
    // this screen's older read snapshot has not been rehydrated yet.
    rememberConfirmedCell(financialCellKey(String(p.membershipId),String(p.rubricId),String(p.meetingId)),{meetingId:p.meetingId,membershipId:p.membershipId,rubricId:p.rubricId,amount:signed,cellVersion:p.cellVersion});
    return true;
};
const acknowledgeRemoteFinancialCell=button=>{
    const cell=button?.closest?.('.matrix-cell-entry');if(!cell)return;cell.classList.remove('remote-financial-change','remote-financial-closed');button.remove();
    void Promise.resolve(identityLiveUI.publishSignal?.('LIVE_ACK',{kind:'FINANCIAL_CELL',meetingId:cell.dataset.meetingId||'',membershipId:cell.dataset.membershipId||'',rubricId:cell.dataset.rubricId||''})).catch(()=>{});
};
const highlightRemoteFinancialCell=(p={})=>{
    const selector=financialLiveSelector(p);if(!selector)return;
    if(!applyRemoteFinancialProjection(p))return;
    if(Number(financialApprovedReviewVersions.get(financialCellKey(p.membershipId,p.rubricId,p.meetingId))??-1)>=Number(p.cellVersion))return;
    if(p.actorId&&p.actorId!==app.currentActor()){
      const key=financialCellKey(p.membershipId,p.rubricId,p.meetingId),old=financialReviewInbox.get(key);
      if(!old||Number(old.cellVersion)<=Number(p.cellVersion))financialReviewInbox.set(key,{...p,amount:Number(p.newAmount)});
    }
    const author=String(p.actorName||actorDisplayName(String(p.actorId||''))||tx('Autre gestionnaire','Another manager'));
    for(const cell of document.querySelectorAll(selector)){
      cell.classList.remove('remote-financial-change','remote-financial-closed');void cell.offsetWidth;cell.classList.add('remote-financial-change');if(p.meetingClosed)cell.classList.add('remote-financial-closed');const table=cell.closest('.canonical-financial-matrix');if(table&&p.meetingClosed)table.classList.add('has-post-close-change');
      const changedAt=String(p.at??new Date().toISOString()),when=date(changedAt);cell.dataset.remoteAuthor=author;stampEditorColor(cell,p.actorId);cell.dataset.lastUpdatedAt=changedAt;cell.title=tx(`Modifié par ${author} · ${when} · ${p.previousAmount??'?'} → ${p.newAmount??'?'} F CFA. OK = j’ai vu.`,`Changed by ${author} · ${when} · ${p.previousAmount??'?'} → ${p.newAmount??'?'} XAF. OK = seen.`);financialCellMetadata.set(financialCellKey(String(p.membershipId),String(p.rubricId),String(p.meetingId)),{actorId:String(p.actorId??''),at:changedAt,stamp:Date.parse(changedAt)||Date.now()});
      const note=cell.querySelector('.cell-remote-change-note')??document.createElement('small');
      note.className='cell-remote-change-note';note.setAttribute('role','status');
      note.textContent=tx('Changement par ','Changed by ')+author+' ('+String(p.actorId??'—')+') · '+when+' · '+String(p.previousAmount??'?')+' → '+String(p.newAmount??'?')+' F CFA';
      if(!note.isConnected)cell.append(note);
      const rubric=rubrics.find(x=>x.id===String(p.rubricId??''));
      if(financialNatureForRubric(rubric)!=='CONTRIBUTION'){
        let direct=cell.querySelector('.cell-remote-specialized');
        if(!direct){direct=document.createElement('button');direct.type='button';
          direct.className='secondary cell-remote-specialized';cell.append(direct);}
        direct.textContent=tx('Examiner dans le dossier financier','Review in financial record');
        direct.onclick=()=>go('finance',{force:true});
        // Editing a loan/payment still opens its financial owner. Read receipts,
        // agreement and reserve below only review the committed projection.
      }
      // A separate acknowledgment must never turn the financial ✓ button into
      // an OK button: a manager may immediately re-edit or dispute the cell.
      let seen=cell.querySelector('.cell-remote-seen-btn');
      if(!seen){seen=document.createElement('button');seen.type='button';seen.className='cell-remote-seen-btn secondary';seen.onclick=()=>acknowledgeRemoteFinancialCell(seen);cell.append(seen);}
      seen.textContent=tx('Vu · sans accord','Seen · no approval');
      seen.title=tx('Accusé de lecture uniquement : validez ou contestez séparément','Read receipt only: approve or dispute separately');
      const controls=cell.querySelector('.cell-remote-review-actions')??document.createElement('div');
      controls.className='cell-remote-review-actions';controls.replaceChildren();
      const makeAction=(label,run)=>{
        const control=document.createElement('button');control.type='button';control.className='secondary';
        control.textContent=label;control.onclick=()=>void run(control);controls.append(control);return control;
      };
      const review=async(decision,reason,control)=>{
        const membershipId=String(cell.dataset.membershipId??''),rubricId=String(cell.dataset.rubricId??''),
          meetingId=String(cell.dataset.meetingId??''),signedAmount=exactCellAmount(membershipId,rubricId,meetingId);
        const currentVersion=Number(cell.dataset.remoteVersion??exactCellVersion(membershipId,rubricId,meetingId));
        if(!Number.isSafeInteger(currentVersion)||currentVersion<0)throw Error('CELL_REVIEW_STALE');
        control.disabled=true;
        try{
          const result=await app.reviewFinancialCellChange({meetingId,membershipId,rubricId,
            amount:Math.abs(signedAmount),cellVersion:currentVersion,decision,reason});
          if(decision==='RESERVE'){
            cell.classList.add('is-conflict','is-critical-conflict');
            const state=cell.querySelector('.cell-save-state');
            if(state){state.hidden=false;state.textContent=result.queued?
              tx('Réserve enregistrée sur cet appareil · transmission en attente','Reserve saved locally · pending sync'):
              tx('Contentieux ouvert · montant maintenu jusqu’à décision','Dispute opened · amount remains until a decision');}
            // The canonical target remains shown: never create a reverse Ledger
            // entry by acknowledging or contesting a colleague's amount.
          }else if(result.queued){
            const state=cell.querySelector('.cell-save-state');
            if(state){state.hidden=false;state.textContent=tx('Accord enregistré sur appareil · synchro en attente','Approval saved locally · pending sync');}
          }else{
            cell.classList.remove('remote-financial-change');
            const seenButton=cell.querySelector('.cell-remote-seen-btn');
            if(seenButton)acknowledgeRemoteFinancialCell(seenButton);
            resolveFinancialReviewProjection({groupId:app.activeGroup(),actorId:app.currentActor(),meetingId,membershipId,rubricId,cellVersion:currentVersion,decision});
          }
        }catch(error){
          fail(error);
          if(error instanceof Error&&error.message==='CELL_REVIEW_STALE')
            void refreshFinancialProjectionSilently({meetingId,membershipId,rubricId,remote:true});
        }finally{control.disabled=false;}
      };
      const accept=makeAction(tx('Approuver','Approve'),control=>review('APPROVE','',control));
      accept.setAttribute('aria-label',tx('Approuver explicitement cette modification','Explicitly approve this correction'));
      makeAction(tx('Contester','Dispute'),async control=>{
        const reason=window.prompt(tx('Motif de la contestation (montant maintenu pendant la procédure) :',
          'Reason for dispute (the amount stays until a decision):'),'');
        if(!reason?.trim())return;
        await review('RESERVE',reason.trim(),control);
      });
      makeAction(tx('Remodifier','Edit again'),async()=>{
        const input=cell.querySelector('.cell-target-input');
        if(input){input.focus({preventScroll:true});input.scrollIntoView({block:'nearest',inline:'nearest'});}
      });
      cell.dataset.remoteVersion=String(p.cellVersion??exactCellVersion(String(p.membershipId),String(p.rubricId),String(p.meetingId)));
      if(!controls.isConnected)cell.append(controls);
    }
};
const paintRemoteFinancialDraft=(cell,key)=>{
    const line=cell.querySelector('.cell-live-presence');if(!line)return;
    const authors=remoteDraftNames(key);
    if(authors.length){
      const actors=remoteFinancialDrafts.get(key);if(actors?.size===1)stampEditorColor(cell,[...actors.keys()][0]);
      const names=authors.join(', ');cell.dataset.remoteDraftAuthor=names;cell.classList.add('live-cell-draft');
      if(!cell.classList.contains('live-cell-active')){line.textContent=tx(names+' a un brouillon non validé',names+' has an unconfirmed draft');line.hidden=false;}
    }else{
      delete cell.dataset.remoteDraftAuthor;cell.classList.remove('live-cell-draft');
      if(!cell.classList.contains('live-cell-active'))line.hidden=true;
    }
};
window.addEventListener('eco:live-signal',event=>{
    const e=event instanceof CustomEvent?event.detail:undefined,p=e?.payload??{},actorId=String(e?.actorId??'');if(!actorId||actorId===String(app.currentActor?.()??''))return;
    if(String(p.kind??'')!=='FINANCIAL_CELL')return;
    const key=financialCellKey(String(p.membershipId??''),String(p.rubricId??''),String(p.meetingId??'')),selector=financialLiveSelector(p),type=String(e.type??''),name=actorDisplayName(actorId)||tx('Un autre gestionnaire','Another manager');
    if(type==='FINANCIAL_DRAFT'){
      const actors=remoteFinancialDrafts.get(key)??new Map(),old=actors.get(actorId);if(old?.timer)clearTimeout(old.timer);
      const deadline=Date.now()+30*60_000;
      const timer=setTimeout(()=>{const latest=actors.get(actorId);if(latest?.expiresAt!==deadline)return;actors.delete(actorId);for(const cell of selector?document.querySelectorAll(selector):[])paintRemoteFinancialDraft(cell,key);},30*60_000);
      actors.set(actorId,{name,actorId,expiresAt:deadline,timer});remoteFinancialDrafts.set(key,actors);
    }
    if(type==='FINANCIAL_DRAFT_CLEAR'){
      const actors=remoteFinancialDrafts.get(key),existing=actors?.get(actorId);if(existing?.timer)clearTimeout(existing.timer);actors?.delete(actorId);
      if(actors&&!actors.size)remoteFinancialDrafts.delete(key);
    }
    for(const cell of selector?document.querySelectorAll(selector):[]){
      const line=cell.querySelector('.cell-live-presence');if(!line)continue;
      const resetPresenceTimer=ms=>{
        clearTimeout(Number(cell.dataset.liveTypingHideTimer||0));
        const t=setTimeout(()=>{cell.classList.remove('live-cell-active');paintRemoteFinancialDraft(cell,key);},ms);
        cell.dataset.liveTypingHideTimer=String(t);
      };
    if(['TYPING','CELL_FOCUS'].includes(type)){stampEditorColor(cell,actorId);line.textContent=type==='TYPING'?tx(`${name} saisit…`,`${name} is typing…`):tx(`${name} travaille sur cette cellule`,`${name} is working on this cell`);line.hidden=false;cell.classList.add('live-cell-active');resetPresenceTimer(3500);}
    if(['TYPING_STOP','CELL_BLUR'].includes(type))cell.classList.remove('live-cell-active');
      paintRemoteFinancialDraft(cell,key);
    }
});
let liveLedgerRefreshTimer=0;
window.addEventListener('eco:financial-live-update',event=>{
    const e=event instanceof CustomEvent?event.detail:undefined,p=e?.payload??{},sourceActorId=String(p.actorId??e?.actorId??''),sameActor=Boolean(sourceActorId)&&sourceActorId===String(app.currentActor?.()??'');
    if(p.decision){resolveFinancialReviewProjection({...p,groupId:app.activeGroup(),actorId:sourceActorId});return;}
    if(p.meetingId&&p.membershipId&&p.rubricId){
      // Another browser/device may use the same account. It must converge too.
      // The origin page is protected by its pending Outbox item, so this cannot
      // erase an unconfirmed local value.
      if(sameActor)applyRemoteFinancialProjection({...p,actorId:sourceActorId,at:e?.at});
      else highlightRemoteFinancialCell({...p,actorId:sourceActorId,at:e?.at});
    }
    // Do not show a colleague-style warning for our own account on another
    // device; convergence itself is enough.
    if(sameActor)return;
    showFinancialAlert({title:p.meetingClosed?tx('Modification après clôture','Post-close change'):tx('Mise à jour financière en direct','Live financial update'),message:p.actorName?tx(`${p.actorName} a mis à jour une cellule. Elle reste surlignée jusqu’à votre accusé de réception.`,`${p.actorName} updated a cell. It stays highlighted until you acknowledge it.`):tx('Une donnée financière vient d’être mise à jour en direct.','A financial value was just updated live.'),closed:Boolean(p.meetingClosed),correction:true});
    if(!FREE_CONSERVATION_MODE&&isManager()&&p.meetingId&&p.membershipId&&p.rubricId){if(liveLedgerRefreshTimer)clearTimeout(liveLedgerRefreshTimer);liveLedgerRefreshTimer=setTimeout(()=>{void pollCanonicalFinancialSnapshot();},800);}
});

const refreshGroupContext = async () => {
    window.dispatchEvent(new CustomEvent('eco:context-changed'));recoveryWorkspace.clearForContext();
    const requestedGroup=app.activeGroup(),requestedDashboardScope=dashboardScope();
    hydratedDashboardScope='';
    groupHomeUI.clearForContext();
    roleDashboardsUI.clearForContext?.();
    personalCockpitUI.clearForContext?.();
    personalShopsUI.clearForContext?.();
    const refreshPersonalShops=personalShopsUI.captureRefresh?.();
    notificationCenterUI.clearForContext?.();
    ecoCareUI.clearForContext?.();
    governedGroupUI.clearForContext?.();
    economicExperimentsUI.clearForContext?.();
    resourceAssembliesUI.clearForContext();
    financialExplanationsUI.clearForContext?.();
    productiveCommunityUI.clearForContext?.();
    safetyReviewUI.clearForContext?.();
    dataQualityUI.clearForContext?.();
    documentsUI.clearForContext?.();
    launchStudio?.refreshContext();
    identityVerificationUI.clearForContext?.();
    universalSearchRevision++;document.getElementById('universalSearchFullResults')?.replaceChildren();const searchScope=JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]);if(searchScope!==universalSearchScope){universalSearchScope=searchScope;const input=document.getElementById('universalSearchFull');if(input)input.value='';}
    // Account navigation does not wait for optional group/financial panels.
    // Reuse this same membership-checked directory in the personal cockpit.
    const personalDirectory=personalCockpitUI.prepareNavigation?.();
    personalDirectory?.catch(()=>{});
    journeyUI.refresh();localAssistantUI.refreshContext();void recoveryWorkspace.refresh().catch(fail);
    shellNavigation.refresh();
    await renderGroups();
    journeyUI.refresh();localAssistantUI.refreshContext();
    if(requestedGroup!==app.activeGroup())return;
    const active = Boolean(app.activeGroup());
    // Role checks must use the NEW group's members, not the previous group's
    // list. Otherwise invited managers temporarily lose finance/Recap access.
    if(active)await renderMembers();
    if(requestedGroup!==app.activeGroup())return;
    $('#operationsContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupOperations').style.display = active ? 'none' : 'block';
    $('#sessionsContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupSessions').style.display = active ? 'none' : 'block';
    $('#financeContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupFinance').style.display = active ? 'none' : 'block';
    $('#membersContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupMembers').style.display = active ? 'none' : 'block';
    const manage=active && isManager();
    if(!active){await refreshOptionalOfflineSafe('group-home',()=>groupHomeUI.refresh());await refreshOptionalOfflineSafe('sessions-home',()=>sessionsUI.refresh());}
    $('#backOfficeContent').style.display = manage ? 'block' : 'none';
    $('#noActiveGroupBackoffice').style.display = manage ? 'none' : 'block';
    $('#noActiveGroupBackoffice').textContent = active&&!manage ? tx('Le Back-office est réservé aux responsables habilités du groupe.','Back office is restricted to authorized group managers.') : tx('Sélectionnez ou créez d’abord un groupe.','Select or create a group first.');
    $('#backOfficeNavBtn').hidden = active && !manage;
    for(const id of ['memberForm','meetingForm','latePolicyForm','rubricForm','contributionForm','cashboxForm','publishDiscoveryForm','workspaceForm','tontineCycleForm','tontineShareForm','adCampaignForm'])$( '#'+id).hidden=active && !manage;
    for(const id of ['advancedFinancePanel','assistanceRulebookPanel','savingsYieldLab','financeLedgerPanel']){const node=$('#'+id);if(node)node.hidden=active&&!manage;}
    for(const id of ['openAssistanceRulebookBtn','openSavingsLabBtn']){const node=$('#'+id);if(node)node.hidden=active&&!manage;}
    if (active) {
        await renderMeetings();
        if(requestedGroup!==app.activeGroup())return;
        if(manage){
          await refreshOptionalOfflineSafe('official-loan-rubric',()=>app.ensureOfficialLoanRubric());
          await refreshOptionalOfflineSafe('official-repayment-rubric',()=>app.ensureOfficialRepaymentRubric());
        }
        await renderLivingRules();
        await refreshOptionalOfflineSafe('group-home',()=>groupHomeUI.refresh());
        await refreshOptionalOfflineSafe('sessions-home',()=>sessionsUI.refresh());
        if(manage)await renderLedger();
        else{receiptPositions=[];financialSheetEvents=[];financialPendingSheetEntries=[];financialCellVersions=new Map();$('#ledgerMetrics').replaceChildren();$('#receiptList').textContent='Votre relevé individuel est accessible depuis la liste des membres.';}
    }
    if(requestedDashboardScope!==dashboardScope())return;
    hydratedDashboardScope=requestedDashboardScope;
    await refreshOptionalOfflineSafe('role-dashboards',()=>roleDashboardsUI.refresh());
    if(!active || manage)await refreshOptionalOfflineSafe('applications',renderApplications);else $('#applicationsBox').textContent='Les candidatures sont gérées par les responsables du groupe.';
    await refreshOptionalOfflineSafe('universe',renderUniverse);
    await refreshOptionalOfflineSafe('inbox',renderInbox);
    await refreshOptionalOfflineSafe('completion',()=>completionUI.refresh());
    await refreshOptionalOfflineSafe('advanced',()=>advancedUI.refresh());
    await refreshOptionalOfflineSafe('identity-live',()=>identityLiveUI.refresh());
    await refreshOptionalOfflineSafe('financial-alerts',renderFinancialAlerts);
    if(active&&manage)ensureFinancialSnapshotPolling();
    await refreshOptionalOfflineSafe('urgent-notifications',renderUrgentNotifications);
    await refreshOptionalOfflineSafe('notification-center',()=>renderNotificationCenter({background:true}));
    await refreshOptionalOfflineSafe('community-shop',()=>communityShopUI.refresh());
    if(document.getElementById('personalShopsPanel')?.open)await refreshOptionalOfflineSafe('personal-shops',()=>refreshPersonalShops?.());
    await refreshOptionalOfflineSafe('misc-rubrics',()=>miscRubricUI.refresh());
    await refreshOptionalOfflineSafe('pairing',()=>pairingUI.refresh());
    await refreshOptionalOfflineSafe('sovereign-offline',()=>sovereignOfflineUI.refresh());
    await refreshOptionalOfflineSafe('personal-cockpit',()=>personalCockpitUI.refresh(personalDirectory));
    if(activeViewName()==='recap'&&requestedGroup===app.activeGroup())await refreshOptionalOfflineSafe('recap',()=>recapUI.refresh());
    await refreshOptionalOfflineSafe('interest-community',()=>interestCommunityUI.refresh());
    await refreshOptionalOfflineSafe('ad-manager',()=>adManagerUI.refresh());
    await refreshOptionalOfflineSafe('temporal-commerce',()=>temporalCommerceUI.refresh());
    await refreshOptionalOfflineSafe('visual-media',()=>visualMediaStudio.refresh());
    await refreshOptionalOfflineSafe('partner-ads',()=>partnerAdsUI.refresh());
    await refreshOptionalOfflineSafe('ad-surfaces',()=>adSurfacesUI.refresh());
    await refreshOptionalOfflineSafe('visual-media-presenter',()=>visualMediaPresenter.refresh());
    await refreshOptionalOfflineSafe('tontine-manager',()=>tontineManagerUI.refresh());
    await refreshOptionalOfflineSafe('savings-yield',()=>savingsYieldUI.refresh());
    await refreshOptionalOfflineSafe('assistance-rulebook',()=>assistanceRulebookUI.refresh());
    await refreshOptionalOfflineSafe('external-programs',()=>externalProgramsUI.refresh());
    await refreshOptionalOfflineSafe('blueprint',()=>blueprintExecutableUI.refresh());
    await refreshOptionalOfflineSafe('financial-lab',()=>financialLabUI.refresh());
    await refreshOptionalOfflineSafe('resilience',()=>resilienceUI.refresh());
    await refreshOptionalOfflineSafe('founder-control',()=>founderControlUI.refresh());
    if(manage)await refreshOptionalOfflineSafe('trash',renderTrash);
};
const refreshAll = async () => { await refreshGroupContext(); renderOutbox(); renderCompatibility(); renderKernel(); renderModules(); renderEcosystemHighlights(); renderDomainHubs(); await detailUI.openFromLocation?.(); };
const openEcoShareIntent=async intent=>{
    if(!intent)return false;
    if(intent.groupId&&app.activeGroup()!==intent.groupId){
        if(!groups.some(g=>g.id===intent.groupId)){toast(tx('Ce partage concerne un groupe auquel ce compte n’a pas accès.','This share belongs to a group this account cannot access.'));return false;}
        app.selectGroup(intent.groupId);await refreshGroupContext();
    }
    if(intent.kind==='notification'){
        const actor=app.currentActor(),tenant=app.currentTenant();
        await app.resolveGroupNotificationAction(String(intent.groupId),String(intent.objectId));
        if(actor!==app.currentActor()||tenant!==app.currentTenant())return false;
        go('inbox',{anchor:'eco-notice-'+intent.objectId,force:true});
        return true;
    }
    go(intent.view||'ecosystem',{anchor:intent.anchor||undefined,force:true});
    window.dispatchEvent(new CustomEvent('eco:share-intent',{detail:intent}));
    return true;
};
$('#activeGroupSelect').addEventListener('change', async (e) => { const id = e.target.value; app.selectGroup(id || undefined); try {
    await refreshGroupContext();
    toast(id ? 'Groupe actif changé.' : 'Aucun groupe actif.');
}
catch (err) {
    fail(err);
} });
const renderGlobalSearch = () => { const q = val('globalSearch').toLowerCase(); const root = $('#globalSearchResults'); root.replaceChildren(); if (q.length < 2)
    return;
    const destinations=shellNavigation.search(q).slice(0,6),shownModules=new Set(destinations.map(d=>d.module).filter(Boolean));
    for(const destination of destinations){const b=document.createElement('button');b.type='button';b.className='search-hit';const title=document.createElement('strong');title.textContent=destination.label;const sub=document.createElement('small');sub.textContent=tx('Fonction · accès direct','Function · direct access');b.append(title,sub);b.onclick=()=>shellNavigation.activate(destination);root.append(b);}
    const ms = modules.filter(m => !shownModules.has(m.id)&&`${m.id} ${m.labelFr} ${m.labelEn}`.toLowerCase().includes(q)).slice(0, 8); const gs = groups.filter(g => g.name.toLowerCase().includes(q)).slice(0, 4); for (const g of gs) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'search-hit';
    b.innerHTML = html`<strong>${g.name}</strong><small>Groupe · ${g.kind}</small>`;
    b.onclick = async () => { app.selectGroup(g.id); await refreshGroupContext(); go('dashboard'); };
    root.append(b);
} for (const m of ms) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'search-hit';
    b.innerHTML = html`<strong>${m.labelFr}</strong><small>${m.id} · ${STATUS_COPY[m.status] ?? m.status}</small>`;
    b.onclick = () => void openModule(m.id);
    root.append(b);
} };
$('#globalSearch').addEventListener('input', renderGlobalSearch);
let universalSearchTimer;
let universalSearchRevision=0;
let universalSearchScope='';
const openUniversalSearchResult=async row=>{
    if(row.kind==='group'){app.selectGroup(row.id);await refreshGroupContext();await detailUI.open('group',row.id);return;}
    if(['member','meeting','rubric'].includes(row.kind)){await detailUI.open(row.kind,row.id);return;}
    if(row.kind==='module'){await openModule(row.id);return;}
    if(row.kind==='workspace'&&row.moduleId){await openModule(row.moduleId);return;}
    if(row.kind==='inbox'){go('dashboard',{anchor:'dashboardInbox',force:true});return;}
};
const renderUniversalSearchFull=async()=>{
    const input=document.querySelector('#universalSearchFull'),root=document.querySelector('#universalSearchFullResults');
    if(!input||!root)return;
    const query=input.value.trim(),revision=++universalSearchRevision;root.replaceChildren();
    if(query.length<2){const p=document.createElement('p');p.className='hint';p.textContent=tx('Saisissez au moins 2 caractères.','Enter at least 2 characters.');root.append(p);return;}
    const getSearchContext=()=>({actor:app.currentActor(),tenant:app.currentTenant(),group:app.activeGroup()||''}),captured=getSearchContext();
    const current=()=>revision===universalSearchRevision&&JSON.stringify(captured)===JSON.stringify(getSearchContext());
    let access={groups:[],privateGroup:false},privateUnavailable=false;
    try{access=await authorizedSearchContext({app,context:captured,getContext:getSearchContext,allowCached:navigator.onLine===false});}catch{privateUnavailable=true;}
    if(!current())return;
    const local=localUniversalSearch({query,groups:access.groups,modules,members:access.privateGroup?members:[],meetings:access.privateGroup?meetings:[],rubrics:access.privateGroup?rubrics:[]});
    let remote=[];
    if(!privateUnavailable){
        const groupId=access.privateGroup?captured.group:undefined;
        const partial=()=>{privateUnavailable=true;return[];};
        const [documents,knowledge,workspaces,inbox]=await Promise.all([
            groupId?app.searchDocuments(query,20).catch(partial):Promise.resolve([]),
            app.searchKnowledge(query,groupId).catch(partial),
            groupId?app.listWorkspaceRecords(undefined,groupId).catch(partial):Promise.resolve([]),
            app.inboxItems({requireServer:navigator.onLine!==false}).catch(partial)
        ]);
        if(!current())return;
        remote=remoteUniversalSearch({query,documents,knowledge,workspaces,inbox});
    }
    if(navigator.onLine===false){const note=document.createElement('p');note.className='truth-notice';note.textContent=tx('Recherche sur les copies autorisées de ce compte et de ce groupe · résultats éventuellement incomplets ou anciens.','Searching authorized copies for this account and group · results may be incomplete or old.');root.append(note);}
    const rows=[...local,...remote].sort((a,b)=>Number(b.score??0)-Number(a.score??0)||String(a.title??'').localeCompare(String(b.title??''),'fr')).slice(0,80);
    if(privateUnavailable){const p=document.createElement('p');p.className='truth-notice';p.textContent=tx('Une source privée ne peut pas être vérifiée. Les services locaux restent accessibles ; les résultats peuvent être incomplets.','A private source cannot be verified. Local services remain accessible; results may be incomplete.');root.append(p);}
    if(!rows.length){const p=document.createElement('p');p.className='empty-state';p.textContent=tx('Aucun résultat autorisé trouvé.','No authorized result found.');root.append(p);return;}
    for(const row of rows){
        const interactive=['group','member','meeting','rubric','module'].includes(row.kind),node=document.createElement(interactive?'button':'article');
        if(interactive){node.type='button';node.className='search-hit';node.onclick=()=>void(async()=>{if(!current())return;try{if(row.kind!=='module'){const fresh=await authorizedSearchContext({app,context:captured,getContext:getSearchContext,allowCached:navigator.onLine===false});if(!current())return;if(row.kind==='group'&&!fresh.groups.some(g=>g.id===row.id))throw Error('SEARCH_ACCESS_UNVERIFIED');}await openUniversalSearchResult(row);}catch{root.replaceChildren();const p=document.createElement('p');p.className='truth-notice';p.textContent=tx('Les droits de cette cible doivent être revérifiés. Relancez la recherche.','Permissions for this target need checking. Run the search again.');root.append(p);}})();}
        else node.className='item';
        const title=document.createElement('strong');title.textContent=row.title||row.id;
        const sub=document.createElement('small');sub.textContent=row.subtitle||row.kind;
        node.append(title,sub);
        if(row.snippet){const p=document.createElement('p');p.className='hint';p.textContent=row.snippet;node.append(p);}
        root.append(node);
    }
};
document.querySelector('#universalSearchFull')?.addEventListener('input',()=>{
    clearTimeout(universalSearchTimer);universalSearchTimer=setTimeout(()=>void renderUniversalSearchFull(),220);
});
const renderUnifiedCalendar=async()=>{
    const root=document.querySelector('#unifiedCalendarList');if(!root)return;root.replaceChildren();
    const groupId=app.activeGroup();
    if(!groupId){const p=document.createElement('p');p.className='empty-state';p.textContent=tx('Sélectionnez un groupe pour afficher son calendrier.','Select a group to display its calendar.');root.append(p);return;}
    const [records,inbox]=await Promise.all([
        app.listWorkspaceRecords(undefined,groupId).catch(()=>[]),
        app.inboxItems().catch(()=>[])
    ]);
    const obligations=inbox.filter(x=>x.groupId===groupId&&x.dueAt&&!['DONE','CLOSED','RESOLVED','CANCELLED'].includes(String(x.status??'').toUpperCase()));
    const model=buildUnifiedCalendar({meetings,records,obligations});
    const rows=[...model.upcoming.slice(0,80),...model.past.slice(-20)];
    if(!rows.length){const p=document.createElement('p');p.className='empty-state';p.textContent=tx('Aucune date explicite n’est encore enregistrée.','No explicit date is recorded yet.');root.append(p);return;}
    for(const row of rows){
        const item=document.createElement('article');item.className='item';
        const title=document.createElement('strong');title.textContent=row.title;
        const meta=document.createElement('small');meta.textContent=date(row.at)+' · '+row.source+(row.status?' · '+row.status:'');
        item.append(title,meta);
        if(row.kind==='meeting'){const open=document.createElement('button');open.type='button';open.className='link-btn';open.textContent=tx('Ouvrir la séance','Open meeting');open.onclick=()=>void detailUI.open('meeting',row.entityId);item.append(open);}
        root.append(item);
    }
};
document.querySelector('#unifiedCalendarRefresh')?.addEventListener('click',()=>void renderUnifiedCalendar());
document.querySelector('#unifiedCalendarPanel')?.addEventListener('toggle',e=>{if(e.currentTarget.open)void renderUnifiedCalendar();});
document.querySelector('#unifiedCalendarIcs')?.addEventListener('click',()=>{
    if(!app.activeGroup()){toast(tx('Sélectionnez d’abord un groupe.','Select a group first.'));return;}
    if(navigator.onLine===false){toast(tx('Le fichier .ics se télécharge dès que la connexion revient. Le calendrier affiché reste consultable hors ligne.','The .ics file can be downloaded when connectivity returns. The displayed calendar remains available offline.'));return;}
    const a=document.createElement('a');a.href=app.calendarIcsUrl();a.download='eco-system-calendrier.ics';a.rel='noopener';document.body.append(a);a.click();a.remove();
});
document.addEventListener('click', e => { const t = e.target; if (!t.closest('.top-search'))
    $('#globalSearchResults').replaceChildren(); const open = t.closest('[data-module-open]'); if (open?.dataset.moduleOpen)
    void openModule(open.dataset.moduleOpen); });
$('#matrixViewBtn').addEventListener('click', () => { $('#meetingMatrixPanel').hidden = false; $('#matrixViewBtn').classList.add('active'); $('#cardViewBtn').classList.remove('active'); document.dispatchEvent(new CustomEvent('eco:render-two-sheets')); });
document.querySelector('#financeIndividualSheetBtn')?.addEventListener('click',()=>go('operations',{anchor:'twoSheetWorkspace',sheetMode:'individual',force:true}));
document.querySelector('#financeLoanRulesBtn')?.addEventListener('click',()=>go('finance',{anchor:'loanOfficialConfig',openTarget:'loanCompletionPanel',force:true}));
document.querySelector('#openSavingsLabBtn')?.addEventListener('click',()=>go('finance',{anchor:'savingsYieldLab',force:true}));
document.querySelector('#openAssistanceRulebookBtn')?.addEventListener('click',()=>go('finance',{anchor:'assistanceRulebookPanel',force:true}));

$('#cardViewBtn').addEventListener('click', () => { $('#meetingMatrixPanel').hidden = true; $('#cardViewBtn').classList.add('active'); $('#matrixViewBtn').classList.remove('active'); });
const launchError=error=>({
  PROJECT_RUBRICS_REQUIRED:'Ajoutez au moins une rubrique et renseignez ses caractéristiques.',
  RUBRIC_NAME_REQUIRED:'Donnez un nom à chaque rubrique.',
  INVALID_RUBRIC_ACTIVITY:'Choisissez la nature de chaque rubrique.',
  INVALID_RUBRIC_MONEY:'Le montant monétaire de cette rubrique doit être un entier positif ou nul.',
  INVALID_RUBRIC_PARTICIPATION:'Choisissez comment les membres participent à cette rubrique.',
  INVALID_RUBRIC_CONTRIBUTION_MODE:'Choisissez si cette rubrique fonctionne en argent, en nature ou en mode mixte.',
  INVALID_RUBRIC_IN_KIND:'Pour une rubrique en nature, indiquez l’article et une quantité positive.',
  INVALID_RUBRIC_CONTEXT:'Vérifiez le contexte de la rubrique : unité ou note trop longue.',
  INVALID_RUBRIC_COUNTS:'Renseignez le nombre de membres, de tours et la durée avec des nombres entiers positifs.',
  INVALID_RUBRIC_AMOUNT_BASIS:'Le montant d’une tontine se définit par nom / part.',
  INVALID_RUBRIC_SHARES:'Le total des parts doit être au moins égal au nombre de membres participants.',
  INVALID_RUBRIC_POTS:'Indiquez un nombre de pots par tour compris entre 1 et le total des parts.',
  TONTINE_INSUFFICIENT_TURNS:'Le nombre de tours et de pots ne permet pas encore de servir toutes les parts. Ajustez la programmation du cycle.',
  INVALID_TONTINE_PARTICIPANTS:'Chaque participant prévu doit avoir un nom et au moins une part. Leur nombre ne peut pas dépasser celui des membres prévus.',
  INVALID_TONTINE_SHARE:'Chaque part doit avoir son propre nom et son identifiant unique.',
  INVALID_TONTINE_TURN:'Le tour de bénéfice doit appartenir au cycle prévu.',
  TONTINE_TURN_CAPACITY_EXCEEDED:'Un tour dépasse le nombre de pots prévu. Répartissez les parts sur d’autres tours ou ajustez le nombre de pots.',
  TONTINE_SHARE_COUNT_EXCEEDED:'La liste comporte plus de parts que le total prévu dans cette tontine.',
  TONTINE_PARTICIPANT_SHARES_MISMATCH:'Il ne reste pas assez de parts pour les autres membres prévus. Ajustez le total des parts ou le nombre de membres.',
  INVALID_RUBRIC_COSTS:'Vérifiez les frais : montants entiers positifs ou nuls, taux entre 0 et 100 %.',
  SIMULATION_AMOUNT_OUT_OF_RANGE:'Ces montants sont trop élevés pour un calcul exact. Vérifiez les paramètres.'
}[error.message]??error.message);
const invalidateProject=()=>{projectRevision++;lastProjectId=undefined;launchStudio?.invalidateSimulation();$('#createGroupBtn').disabled=true;$('#simulationResult').replaceChildren();};
const addLaunchRubric=(preset={})=>{
  const editor=createRubricEditor($('#launchRubrics'),{
    plan:preset.plan,initialName:preset.name??'',initialKind:preset.kind??'',initialContributionMode:preset.contributionMode??'MONEY',
    onChange:invalidateProject,onRemove:()=>{launchEditors.splice(launchEditors.indexOf(editor),1);editor.card.remove();invalidateProject();}
  });
  launchEditors.push(editor);invalidateProject();if(!preset.skipFocus)editor.focus();return editor;
};
$('#addLaunchRubric').onclick=()=>addLaunchRubric();
$('#addLaunchTontine').onclick=()=>addLaunchRubric({kind:'TONTINE',contributionMode:'MONEY'});
const syncLaunchFamily=()=>{
  const family=val('groupKind'),variant=val('tontineVariant')||'MONEY',wrap=$('#tontineVariantWrap');
  if(wrap)wrap.hidden=family!=='rotating_tontine';
  if(family==='rotating_tontine'&&!launchEditors.some(editor=>editor.read().kind==='TONTINE')){
    addLaunchRubric({kind:'TONTINE',name:'Tontine',contributionMode:variant==='IN_KIND'?'IN_KIND':variant==='HYBRID'?'MIXED':'MONEY'});
  }
  invalidateProject();
};
$('#groupKind').addEventListener('change',syncLaunchFamily);
$('#tontineVariant')?.addEventListener('change',syncLaunchFamily);
launchStudio=mountLaunchStudio({
  app,getGroups:()=>groups,getRubrics:()=>{try{return readRubricEditors(launchEditors);}catch{return launchEditors.map(e=>e.read());}},
  getEditors:()=>launchEditors,
  restoreEditors:rows=>{for(const editor of launchEditors.splice(0))editor.card.remove();for(const row of rows){const editor=addLaunchRubric({plan:row.plan,skipFocus:true});const controls=[...editor.card.querySelectorAll('input,select,textarea')];if(controls.length!==(row.controls??[]).length)throw Error('LAUNCH_DRAFT_CONTROL_VERSION');row.controls.forEach((saved,i)=>{controls[i].value=String(saved.value??'');if(controls[i].type==='checkbox')controls[i].checked=Boolean(saved.checked);});editor.card.dispatchEvent(new Event('input',{bubbles:true}));}},
  resumeCreation:projectId=>void createLaunchGroup(projectId),
  addRubric:addLaunchRubric,invalidate:invalidateProject,toast,showError:fail
});
syncLaunchFamily();
$('#projectForm').addEventListener('input',invalidateProject);
const simulateCurrentLaunch=async({silent=false}={})=>{
  clearFail();const revision=projectRevision;
  const parameters={rubrics:readRubricEditors(launchEditors),launchProfile:launchStudio.readProfile()};
  const r=await app.simulateAndStoreProject({name:val('projectName'),kind:val('groupKind'),governanceModel:val('governanceModel'),...parameters});
  if(revision!==projectRevision)throw new Error('PROJECT_CHANGED_DURING_SIMULATION');
  lastProjectId=r.projectId;
  const root=$('#simulationResult');root.replaceChildren();
  if(parameters.rubrics){for(const plan of parameters.rubrics){
    const result=r.result.rubricBreakdown.find(row=>row.key===plan.key),card=document.createElement('article');card.className='simulation-rubric';
    card.innerHTML=html`<h3>${plan.name}</h3><p>${describeRubricPlan(plan)}</p>`;
    if(plan.contributionMode==='IN_KIND'){
      const volume=result.unitsPerSession*result.sessions*Number(plan.contributionQuantity??1),p=document.createElement('p');
      p.textContent='Volume prévu sur ce cycle : '+volume+' '+String(plan.contributionUnit??'unité')+' de '+String(plan.contributionLabel??'nature');card.append(p);
    }else{
      const p=document.createElement('p');p.innerHTML='Collecte monétaire prévue sur ce cycle : <strong>'+fmt(result.totalNominalContributions)+'</strong>';card.append(p);
      if(plan.contributionMode==='MIXED'){const q=document.createElement('p');const volume=result.unitsPerSession*result.sessions*Number(plan.contributionQuantity??1);q.textContent='En plus : '+volume+' '+String(plan.contributionUnit??'unité')+' de '+String(plan.contributionLabel??'nature');card.append(q);}
    }
    if(plan.kind==='TONTINE'){
      const planned=(plan.participants??[]).flatMap(p=>p.shares),note=document.createElement('p');note.className='hint';note.textContent=`${planned.length} / ${plan.shareCount} parts nommées · ${planned.filter(s=>s.turn!==undefined).length} passages programmés. Chaque part bénéficie une fois ; plusieurs parts d’un membre peuvent passer au même tour.`;card.append(note);
    }
    root.append(card);
  }}
  const totals=document.createElement('div');totals.innerHTML=html`<div class="result-row"><span>Total monétaire des rubriques prévues</span><strong>${fmt(r.result.totalNominalContributions)}</strong></div><div class="result-row"><span>Frais de gestion perçus</span><strong>${fmt(r.result.totalManagementFees)}</strong></div><div class="result-row"><span>Coûts estimés</span><strong>${fmt(r.result.estimatedExternalCosts+r.result.fixedOperatingCosts)}</strong></div><div class="result-row"><span>Marge de gestion estimée</span><strong>${fmt(r.result.estimatedManagerMargin)}</strong></div><p class="hint">Prévision selon les versements complets. Les rubriques peuvent avoir des durées différentes. Cette simulation ne crée aucun versement ni bénéfice payé.</p>`;root.append(totals);
  launchStudio.afterSimulation();if(!silent)toast('Projet et rubriques vérifiés. Continuez jusqu’à la prévisualisation finale.');
  return r;
};
// Unlike the transient global toast, this local result survives long enough
// for members and real-device audits to understand why a simulation failed.
let launchSimulationPending=false;
const simulateLaunchFromUserAction=async()=>{
  if(launchSimulationPending)return;
  const button=$('#simulateProjectBtn'),output=$('#simulationResult');
  launchSimulationPending=true;button.disabled=true;
  const label=button.textContent;
  output.setAttribute('role','status');
  output.replaceChildren();
  const progress=document.createElement('p');
  progress.className='truth-notice';progress.textContent=tx('Vérification de la faisabilité en cours…','Feasibility check in progress…');
  output.append(progress);
  try{
    await simulateCurrentLaunch();
    output.dataset.simulationStatus='PASS';
  }catch(error){
    const message=launchError(error);
    output.replaceChildren();
    const detail=document.createElement('p');
    detail.className='truth-notice';detail.setAttribute('role','alert');
    detail.textContent=tx('Simulation non terminée : ','Simulation could not finish: ')+message;
    output.append(detail);output.dataset.simulationStatus='ERROR';
    fail(Error(message));
  }finally{
    button.disabled=false;button.textContent=label;launchSimulationPending=false;
  }
};
onSubmit('#projectForm', async event=>{
  event.preventDefault();
  await simulateLaunchFromUserAction();
});
$('#simulateProjectBtn').addEventListener('click',()=>void simulateLaunchFromUserAction());
let launchCreationPending=false;
const createLaunchGroup=async(resumeProjectId)=>{
  const button=$('#createGroupBtn');if(launchCreationPending||(button.disabled&&!resumeProjectId))return;
  launchCreationPending=true;
  const creator=app.currentActor(),creatorTenant=app.currentTenant();
  const assertCreator=()=>{if(creator!==app.currentActor()||creatorTenant!==app.currentTenant())throw Error('LAUNCH_CREATION_CONTEXT_CHANGED');};
  const originalLabel=button.textContent;button.disabled=true;$('#projectForm').inert=true;
  const status=$('#launchStepStatus');const say=(message)=>{button.textContent=message;status.textContent=message;toast(message);};
  try{
    const pending=launchStudio.pendingCreation();
    if(pending&&!resumeProjectId)throw Error(tx('Une tentative de création existe déjà. Utilisez sa reprise dans le Studio pour éviter un doublon.','A creation attempt already exists. Resume it in the Studio to avoid a duplicate.'));
    if(resumeProjectId&&(!pending||pending.completedGroupId||pending.projectId!==resumeProjectId))throw Error('LAUNCH_CREATION_CONTEXT_CHANGED');
    let project=resumeProjectId??lastProjectId;
    if(!project){
      say('1/3 · Vérification de la faisabilité…');
      const simulated=await simulateCurrentLaunch({silent:true});project=simulated.projectId;button.disabled=true;
    }
    assertCreator();
    say('2/3 · Création du groupe et de ses rubriques…');
    launchStudio.rememberCreation(project);
    const group=await app.createGroupFromProject(project);
    assertCreator();
    launchStudio.completeCreation(group.id);
    lastProjectId=undefined;window.__ecoLastProjectReady=false;
    // A completed canonical group must be visible before optional Kit/media
    // work. Never leave users on a loading wizard while 20+ dashboards refresh.
    say('3/4 · Activation du groupe…');
    await renderGroups();
    renderActiveGroup();
    renderGroupSelector();
    go('operations',{force:true});
    toast(`Groupe créé : ${group.name}. Ses espaces se chargent sans bloquer la navigation.`);
    // Preserve both operations; failure is visible, never mistaken for an
    // unsuccessful group conversion or silently swallowed.
    void launchStudio.persistStarterKit?.(group.id,resumeProjectId?pending.kit:undefined).then(kit=>{if(kit&&creator===app.currentActor()&&creatorTenant===app.currentTenant())launchStudio.markKitSaved(group.id);}).catch(error=>{
      const message=error instanceof Error?error.message:String(error);
      console.warn('KIT_STARTER_PERSISTENCE_PENDING',message);
      toast(tx('Groupe créé ; Kit prêt à l’emploi à réessayer depuis le groupe.','Group created; starter kit must be retried from the group.'));
    });
    void refreshGroupContext().catch(fail);
  }catch(error){
    launchStudio.renderPreview();fail(Error(launchError(error)));
  }finally{$('#projectForm').inert=false;button.disabled=false;button.textContent=originalLabel;launchCreationPending=false;}
};
$('#createGroupBtn').addEventListener('click',()=>void createLaunchGroup());
onSubmit('#memberForm', async (e) => { e.preventDefault(); try {
    await app.addMember(val('memberName'));
    document.getElementById('memberName').value = '';
    await renderMembers();
    toast('Membre ajouté.');
}
catch (e) {
    fail(e);
} });
onSubmit('#meetingForm', async (e) => { e.preventDefault(); try {
    const rawScheduled=val('meetingScheduledAt'),scheduledAt=rawScheduled?new Date(rawScheduled).toISOString():undefined;
    const title=val('meetingTitle') || meetingLabel({openedAt:scheduledAt??new Date().toISOString()});
    await app.openMeeting({title,scheduledAt,location:val('meetingLocation')||undefined,theme:val('meetingTheme')||undefined,dressCode:val('meetingDressCode')||undefined});
    for(const id of ['meetingTitle','meetingScheduledAt','meetingLocation','meetingTheme','meetingDressCode'])document.getElementById(id).value='';
    await renderMeetings();
    toast(scheduledAt?'Séance programmée / ouverte.':'Séance ouverte.');
}
catch (e) {
    fail(e);
} });
onSubmit('#latePolicyForm', async (e) => { e.preventDefault(); try {
    const current = groupPolicy ?? await app.groupOperatingPolicy();
    const mode = val('lateMode');
    const raw = val('lateMaxHours');
    const min = Math.max(0, Math.trunc(num('lateMinApprovals')));
    const policy = { ...current, latePosting: { ...current.latePosting, mode, maxHoursAfterClose: raw ? Number(raw) : undefined, requireReason: mode !== 'FORBIDDEN', approval: { ...current.latePosting.approval, roleCodes: current.latePosting.approval.roleCodes?.length ? current.latePosting.approval.roleCodes : ['founder', 'president', 'treasurer', 'manager'], minimumApprovals: mode === 'GOVERNED' ? Math.max(1, min) : min } } };
    await app.updateGroupOperatingPolicy(policy);
    await renderLivingRules();
    toast('Politique après clôture enregistrée.');
}
catch (e) {
    fail(e);
} });
const prepareRubricPreset=(name,description)=>{
    const form=document.querySelector('#rubricForm');if(!form)return;
    document.querySelector('#rubricName').value=name;
    document.querySelector('#writtenRule').value='';
    document.querySelector('#observedPractice').value=description;
    document.querySelector('#ruleRealityStatus').value='UNKNOWN';
    document.querySelector('#targetMode').value='OPEN';
    document.querySelector('#perMemberAmount').value='0';
    document.querySelector('#fixedTargetAmount').value='0';
    document.querySelector('#shortfallHandling').value='CUSTOM';
    document.querySelector('#payoutMode').value='CUSTOM';
    document.querySelector('#mandatoryAbsentees').checked=false;
    document.querySelector('#immediateFullPayout').checked=false;
    form.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('#rubricName')?.focus();
};
document.querySelector('#quickRubricCollation')?.addEventListener('click',()=>prepareRubricPreset('Collation','Rubrique principale de contribution : règle du groupe concernant montant, bénéficiaire de la séance, présents/absents, manquant, couverture et décaissement.'));
document.querySelector('#quickRubricLocalAid')?.addEventListener('click',()=>prepareRubricPreset('Aide locale','Rubrique principale de contribution, équivalente à Collation / Ration dans la nature CONTRIBUTION ; sa règle reste propre au groupe et ne relève pas de « Autres ».'));
document.querySelector('#quickRubricHandRaise')?.addEventListener('click',()=>prepareRubricPreset('Main levée','Rubrique principale événementielle : motif, bénéficiaire, caractère obligatoire ou volontaire, montant, preuves et autorité de validation à confirmer.'));
document.querySelector('#quickRubricLoan')?.addEventListener('click',()=>prepareRubricPreset('Prêt','Rubrique de prêts : règles de demande, approbation, décaissement, taux, remboursement et éventuelles sanctions à confirmer par le groupe.'));
document.querySelector('#quickRubricSavings')?.addEventListener('click',()=>prepareRubricPreset('Épargne','Rubrique d’épargne : versements, retrait, période d’éligibilité et règles de rendement/intérêts à confirmer par le groupe.'));
document.querySelector('#quickRubricAssistance')?.addEventListener('click',()=>prepareRubricPreset('Assistance','Rubrique d’assistance/solidarité : événements éligibles, preuves, montants et processus d’approbation à confirmer par le groupe.'));
onSubmit('#rubricForm', async (e) => { e.preventDefault(); try {
    const tm = val('targetMode');
    const model = { writtenRule: val('writtenRule') || undefined, observedPractice: val('observedPractice') || undefined, ruleRealityStatus: val('ruleRealityStatus'), targetMode: tm, targetAmount: tm === 'FIXED_TOTAL' ? { currency: 'XAF', amount: num('fixedTargetAmount') } : undefined, perMemberAmount: tm === 'PER_MEMBER_FIXED' ? { currency: 'XAF', amount: num('perMemberAmount') } : undefined, mandatoryForAbsentees: checked('mandatoryAbsentees'), shortfallHandling: val('shortfallHandling'), payoutMode: val('payoutMode'), immediateFullPayout: checked('immediateFullPayout') };
    await app.createRubric({ name: val('rubricName'), writtenRule: model.writtenRule, observedPractice: model.observedPractice, model });
    await renderLivingRules();
    toast('Rubrique enregistrée.');
}
catch (e) {
    fail(e);
} });
onSubmit('#rubricPreviewForm', async (e) => { e.preventDefault(); try {
    const id = val('rubricPreviewRubric');
    if (!id)
        throw new Error('RUBRIC_NOT_FOUND');
    const p = await app.previewRubricCycle(id, { memberCount: num('previewMemberCount'), collectedFromMembers: num('previewCollected'), solidarityCoverageAmount: num('previewSolidarity') });
    renderPreview(p);
}
catch (e) {
    fail(e);
} });
function renderPreview(p) { $('#rubricPreviewResult').innerHTML = [['Attendu', p.expectedTotal], ['Collecté membres', p.collectedFromMembers], ['Manquant / dette', p.memberShortfall], ['Couverture solidaire', p.solidarityCoverage], ['Disponible bénéficiaire', p.availableForBeneficiary], ['Décaissement', p.beneficiaryDisbursement], ['Solde rubrique', p.remainingRubricBalance], ['Dette membre après couverture', p.memberDebtAfterCoverage]].map(([l, n]) => html`<div class="result-row"><span>${l}</span><strong>${fmt(Number(n))}</strong></div>`).join(''); }
onSubmit('#contributionForm', async (e) => { e.preventDefault(); try {
    const membershipId = val('contributionMember');
    if (!membershipId)
        throw new Error('MEMBERSHIP_NOT_FOUND');
    const r = await app.recordCashContribution({ membershipId, amount: num('contributionAmount'), rubricId: val('contributionRubric') || undefined, meetingId: val('contributionMeeting') || undefined, lateReason: val('lateReason') || undefined, approverIds: split(val('lateApprovers')) });
    toast(r.queued ? 'Opération conservée en attente de confirmation. Consultez la file avant toute nouvelle saisie.' : r.receipt?.latePosting?.isLate ? 'Cotisation tardive enregistrée et tracée.' : 'Cotisation enregistrée.');
    $('#contributionAmount').value='';
    renderOutbox();
    if (!r.queued)
        await renderLedger();
}
catch (e) {
    fail(e);
} });
onSubmit('#cashboxForm', async (e) => { e.preventDefault(); try {
    const r = await app.reconcileCashbox({ openingCash: num('opening'), cashIn: num('cashIn'), cashOut: num('cashOut'), countedClosing: num('counted'), meetingId: activeMeeting() });
    $('#cashboxResult').innerHTML = html`<div class="result-row"><span>Théorique</span><strong>${fmt(r.snapshot.theoreticalClosing)}</strong></div><div class="result-row"><span>Écart</span><strong>${fmt(r.snapshot.variance)}</strong></div><div class="result-row"><span>Statut</span><strong>${r.status}</strong></div>`;
    toast('Rapprochement enregistré.');
}
catch (e) {
    fail(e);
} });
onSubmit('#discoverySearchForm', async (e) => { e.preventDefault(); try {
    const xs = await app.searchGroups({ q: val('discoveryQ') || undefined, locality: val('discoveryLocality') || undefined, recruitingOnly: checked('discoveryRecruiting') });
    renderDiscoveryResults(xs);
}
catch (e) {
    fail(e);
} });
onSubmit('#publishDiscoveryForm', async (e) => { e.preventDefault(); try {
    await app.publishActiveGroup({ visibility: val('listingVisibility'), discoverable: val('listingVisibility') === 'PUBLIC', joinPolicy: val('listingJoinPolicy'), recruiting: checked('listingRecruiting'), locality: val('listingLocality') || undefined, ...geoDirectoryUI.currentPublishGeoPatch(), missionTags: split(val('listingMission')), activityTags: [] });
    toast('Projection publique mise à jour.');
}
catch (e) {
    fail(e);
} });
$('#workspaceModule').addEventListener('change', () => void loadWorkspaces());
$('#workspaceReload').addEventListener('click', () => void loadWorkspaces());
onSubmit('#workspaceForm', async (e) => { e.preventDefault(); try {
    await app.createWorkspaceRecord({ moduleId: val('workspaceModule'), title: val('workspaceTitle'), summary: val('workspaceSummary') || undefined, status: val('workspaceStatus'), tags: split(val('workspaceTags')), data: { source: CAHIER_VERSION } });
    document.getElementById('workspaceTitle').value = '';
    document.getElementById('workspaceSummary').value = '';
    await loadWorkspaces();
    toast('Dossier enregistré.');
}
catch (e) {
    fail(e);
} });
$('#catalogSearch').addEventListener('input', renderModules);
// Eco Care delegates this form to Kernel.Cases through its versioned adapter.
$('#queueBtn').addEventListener('click', async () => { await app.queueDemoIntent('Note hors ligne Cahier App 1.1'); renderOutbox(); toast('Note mise en file.'); });
$('#syncBtn').addEventListener('click', async () => { if (!navigator.onLine) {
    fail(new Error('Hors ligne'));
    return;
} try{offlineConfrontationDeferred=false;await resumeOnline({forceConfrontation:true});renderOutbox();}catch(e){fail(e);} });
const refreshVisibleBusinessSurface=async preserved=>{
    const view=String(preserved?.view??activeViewName());
    if(view==='recap'){await recapUI.refresh();return;}
    if(view==='operations'){
        const [freshMembers,freshMeetings,freshRubrics]=await Promise.all([app.listMembers(),app.listMeetings(),app.listRubrics()]);
        await renderMembers(freshMembers);await renderMeetings(freshMeetings);await renderLivingRules(freshRubrics);
        if(isManager())await loadFinancialProjectionState({clearOptimistic:false});
        renderMeetingMatrix();renderIndividualSheetMatrix();renderAllCanonicalFinancialHosts();
        await identityLiveUI.refresh();return;
    }
    if(view==='sessions'){await renderMeetings();await sessionsUI.refresh();await identityLiveUI.refresh();return;}
    if(view==='members'){await renderMembers();return;}
    if(view==='finance'){
        await renderMembers();await renderMeetings();await renderLivingRules();
        if(isManager())await renderLedger();
        await completionUI.refresh();await savingsYieldUI.refresh();await identityLiveUI.refresh();return;
    }
    if(view==='dashboard'){
        await renderGroups();renderActiveGroup();renderGroupSelector();await renderUniverse();await renderInbox();await identityLiveUI.refresh();return;
    }
    await refreshGroupContext();
};
$('#refreshBtn').addEventListener('click', async () => { try {
    clearFail();
    const preserved=captureNavState(),preservedRevision=navigationInteractionRevision;persistNavState(preserved);
    // Manual refresh may clear a short transport breaker, but must never bypass
    // a known Cloudflare/D1 quota guard and recreate the former request storm.
    app.forceTransportRetry?.();
    renderConnectivity();
    if(navigator.onLine!==false&&(app.outboxItems?.()??[]).some(item=>!['CONFIRMED','CANCELLED'].includes(String(item.status??''))))await resumeOnline();
    await refreshVisibleBusinessSurface(preserved);
    if(preservedRevision===navigationInteractionRevision)showView(preserved.view,preserved);
    toast(tx('Données utiles actualisées sans perdre votre position.','Visible data refreshed without losing your position.'));
}
catch (e) {
    fail(e);
} });
$('#modeBtn').addEventListener('click', () => { document.body.classList.toggle('ultra-simple'); toast(document.body.classList.contains('ultra-simple') ? 'Mode Ultra Simple activé.' : 'Mode complet activé.'); });
$('#languageSelect').addEventListener('change', async e => {
    document.querySelectorAll('[data-eco-language-control]').forEach(c=>{c.value=e.target.value==='en'?'en':'fr';});
    uiLocale = e.target.value === 'en' ? 'en' : 'fr';
    app.setLocale(uiLocale);
    applyRuntimeLocale(uiLocale);
    await personalShopsUI.setLocale?.();
    await notificationCenterUI.setLocale?.();
    await ecoCareUI.setLocale?.();
    governedGroupUI.setLocale?.();
    economicExperimentsUI.setLocale?.();
    resourceAssembliesUI.setLocale();
    temporalCommerceUI.setLocale?.();
    financialExplanationsUI.setLocale?.();
    productiveCommunityUI.setLocale?.();
    launchStudio?.setLocale();
    completionUI.setLocale();
    advancedUI.setLocale();
    renderConnectivity(); renderModules(); renderEcosystemHighlights(); renderDomainHubs(); renderActiveGroup(); renderGroupSelector();
    await renderUniverse(); await renderInbox();
    toast(tx('Interface passée en français.','Interface switched to English.'));
});
document.querySelectorAll('[data-eco-language-control]').forEach(control=>{
    control.value=uiLocale;
    control.addEventListener('change',()=>{
        const canonical=document.getElementById('languageSelect');
        if(!canonical)return;
        canonical.value=control.value==='en'?'en':'fr';
        canonical.dispatchEvent(new Event('change',{bubbles:true}));
    });
});
let onlineResumePromise=null,onlineResumeRequested=false;
let networkRecoveryNeeded=navigator.onLine===false;
const resumeOnline=({forceConfrontation=false,relayFerry=false}={})=>{
    if(onlineResumePromise){onlineResumeRequested=true;return onlineResumePromise;}
    onlineResumeRequested=false;
    const preserved=captureNavState();persistNavState(preserved);
    onlineResumePromise=(async()=>{renderConnectivity();try{
        if(navigator.onLine===false){networkRecoveryNeeded=true;return;}
        if(!(await reviewOfflineFinancialBacklog(forceConfrontation))){networkRecoveryNeeded=true;renderConnectivity();return;}
        const pendingBefore=(app.outboxItems?.()??[]).filter(item=>!['CONFIRMED','CANCELLED'].includes(String(item.status??'')));
        const beforeSync=pendingTargetSnapshot(),beforeSheetSync=pendingSheetSnapshot();
        await app.syncOutbox();
        if((app.outboxItems?.()??[]).some(x=>x.lastResult?.deliveryPending))await app.repairFinancialLiveDelivery?.();
        rememberTargetsConfirmedBySync(beforeSync);
        financialPendingTargets=new Map((app.pendingFinancialCellTargets?.()??[]).map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),x]));
        financialPendingSheetEntries=app.pendingFinancialSheetEntries?.()??[];
        const itemsAfter=new Map((app.outboxItems?.()??[]).map(item=>[String(item.idempotencyKey??''),item]));
        const changed=beforeSync.filter(item=>['CONFIRMED','CONFLICT'].includes(String(itemsAfter.get(item.idempotencyKey)?.status??'')));
        const changedSheets=beforeSheetSync.filter(item=>itemsAfter.get(item.idempotencyKey)?.status==='CONFIRMED');
        // A transport wake-up with zero changes must not reload every table or
        // return the manager to Home; the WebSocket replays authorized deltas.
        if(app.activeGroup()&&changed.length){
            await loadFinancialProjectionState();
            for(const item of changed){
                const row=itemsAfter.get(item.idempotencyKey);
                if(row?.status==='CONFLICT')continue;
                financialOptimisticValues.delete(item.key);
                const fresh=Number.isFinite(Number(row?.lastResult?.canonicalAmount))?Number(row.lastResult.canonicalAmount):exactCellAmount(item.membershipId,item.rubricId,item.meetingId);
                patchFinancialDomCell({...item,amount:fresh,cellVersion:exactCellVersion(item.membershipId,item.rubricId,item.meetingId)});
                if(row?.lastResult?.status==='SUPERSEDED')markCriticalFinancialConflict({...item,amount:item.amount});else setCellSyncedState(item);
                window.dispatchEvent(new CustomEvent('eco:financial-data-changed',{detail:{...item,amount:fresh,soft:true,recovered:true}}));
            }
        }
        if(app.activeGroup()&&changedSheets.length){
            for(const item of changedSheets){
                financialOptimisticValues.delete(item.key);
                const ack=itemsAfter.get(item.idempotencyKey)?.lastResult??{},amount=Number.isFinite(Number(ack.canonicalAmount))?Number(ack.canonicalAmount):item.amount;
                rememberConfirmedCell(item.key,{...item,amount,cellVersion:ack.cellVersion??exactCellVersion(item.membershipId,item.rubricId,item.meetingId)});
                patchFinancialDomCell({...item,amount,preservePending:false});
                setCellSyncedState(item);
                window.dispatchEvent(new CustomEvent('eco:financial-data-changed',{detail:{...item,amount,soft:true,recovered:true}}));
            }
        }
        // Structural Outbox writes (groups, membership, rubrics, loans, etc.)
        // still require their existing full domain hydration until every owner
        // has a typed incremental projection.
        const incrementalFinancialTypes=new Set(['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2','FINANCIAL_SHEET_ENTRY_V1','FINANCIAL_CELL_REVIEW_V1','CONTRIBUTION_CASH_RECORDED','FINANCIAL_WORK_V1']);
        const otherConfirmed=pendingBefore.some(item=>
            !incrementalFinancialTypes.has(String(item.type))&&
            itemsAfter.get(String(item.idempotencyKey??''))?.status==='CONFIRMED');
        if(otherConfirmed){
            if(app.activeGroup())await refreshGroupContext();else await renderGroups();
        }
        networkRecoveryNeeded=false;
        // Background recovery must not navigate. The manager may have changed
        // tabs or focused another cell while the server was answering.
        renderOutbox();renderConnectivity();renderPersistedFinancialConflicts();
        // Relay ferry is opportunistic and follows the critical financial ACK.
        // Preparing recipients must never hold a repayment behind many reads.
        if(relayFerry)void app.syncEcoRelayFerry?.().then(result=>{
          if(result&&(Number(result.downloaded??0)>0||Number(result.applied??0)>0))window.dispatchEvent(new CustomEvent('eco:manager-relay-updated',{detail:{groupId:app.activeGroup?.(),ferry:true,...result}}));
        }).catch(()=>{});
    }catch(error){networkRecoveryNeeded=true;console.info('Online resume deferred',error);}})().finally(()=>{
      onlineResumePromise=null;
      const again=onlineResumeRequested;onlineResumeRequested=false;
      if(again&&navigator.onLine!==false&&!offlineConfrontationDeferred&&
        !app.serverBudgetState?.().blocked&&(app.outboxItems?.()??[]).some(x=>x.status==='PENDING'))void resumeOnline();
    });
    return onlineResumePromise;
};
const eventDrivenConnectivityRecovery=(event)=>{
    // Foreground activity is a real retry opportunity. A timer wake is not.
    if(['focus','pageshow','visibilitychange'].includes(String(event?.type??'')))app.forceTransportRetry?.();
    renderConnectivity();
    const pending=(app.outboxItems?.()??[]).some(item=>!['CONFIRMED','CANCELLED'].includes(String(item.status)));
    if(navigator.onLine&&(pending||networkRecoveryNeeded))void resumeOnline();
};
window.addEventListener('online',()=>{app.forceTransportRetry?.();networkRecoveryNeeded=true;void resumeOnline({relayFerry:true});});
window.addEventListener('eco:transport-retry-ready',eventDrivenConnectivityRecovery);
window.addEventListener('offline',()=>{networkRecoveryNeeded=true;offlineConfrontationDeferred=false;persistNavState(captureNavState());renderConnectivity();});
window.addEventListener('pageshow',eventDrivenConnectivityRecovery);
window.addEventListener('eco:server-budget-blocked',renderConnectivity);
window.addEventListener('eco:transport-degraded',()=>{
    networkRecoveryNeeded=true;renderConnectivity();
});
window.addEventListener('eco:manager-relay-updated',()=>{void(async()=>{
    const structure=await app.localRelayGroupStructure?.();if(structure){
      await renderMembers(structure.members);await renderMeetings(structure.meetings);await renderLivingRules(structure.rubrics);
    }
    const localTargets=app.pendingFinancialCellTargets?.()??[],relayTargets=await app.relayManagerFinancialTargets?.()??[];
    financialPendingTargets=new Map(localTargets.map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),x]));financialReviewTargets=new Map();
    for(const relay of relayTargets){
      const key=financialCellKey(relay.membershipId,relay.rubricId,relay.meetingId),local=financialPendingTargets.get(key);
      if(!local)financialPendingTargets.set(key,relay);
      else if(Number(local.targetAmount)!==Number(relay.targetAmount))financialReviewTargets.set(key,{...relay,localTargetAmount:Number(local.targetAmount),source:'RELAY',businessStatus:'RELAY_REVIEW_REQUIRED'});
    }
    await hydrateRelayFinancialReviews();
    renderMeetingMatrix();renderIndividualSheetMatrix();renderAllCanonicalFinancialHosts();
  })().catch(error=>console.info('Relay local projection refresh deferred',error));});
window.addEventListener('eco:server-budget-expired',()=>{networkRecoveryNeeded=true;void resumeOnline();});
window.addEventListener('eco:live-connected',()=>{
    void app.repairFinancialLiveDelivery?.().catch(e=>{if(String(e.message)!=='FORBIDDEN_SCOPE')console.info('Financial delivery repair deferred',e);});
    // The authenticated socket itself proves real server reachability. Clear a
    // stale local/offline latch without issuing a D1/auth probe, then replay only
    // pending Outbox work.
    liveChannelConnected=true;app.markLiveTransportHealthy?.();networkRecoveryNeeded=true;eventDrivenConnectivityRecovery();renderConnectivity();
});
window.addEventListener('eco:live-disconnected',()=>{liveChannelConnected=false;renderConnectivity();});
window.addEventListener('focus',eventDrivenConnectivityRecovery);
document.addEventListener('visibilitychange',event=>{if(document.visibilityState==='visible')eventDrivenConnectivityRecovery(event);});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type!=='ECO_SYSTEM_SYNC_OUTBOX'||!navigator.onLine)return;
    void resumeOnline();
});
// A browser/page refresh must resume the exact business place, including a
// horizontal financial column far to the right. sessionStorage is synchronous,
// so pagehide can safely persist the last visible state without any request.
const persistCurrentNavigation=()=>{try{const state=captureNavState();persistNavState(state);history.replaceState({...history.state,ecoNav:state},'',location.href);}catch{}};
window.addEventListener('pagehide',persistCurrentNavigation);
window.addEventListener('beforeunload',persistCurrentNavigation);
const iosLike=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standaloneMode=()=>window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;
const showIosInstallGuide=()=>{
    document.getElementById('iosInstallGuide')?.remove();
    const dialog=document.createElement('dialog');dialog.id='iosInstallGuide';dialog.className='ios-install-guide';
    const h=document.createElement('h2');h.textContent=tx('Installer Eco-System sur iPhone / iPad','Install Eco-System on iPhone / iPad');
    const p=document.createElement('p');p.textContent=tx('Dans Safari : touchez Partager, puis « Sur l’écran d’accueil », puis Ajouter. Ouvrez ensuite Eco-System depuis son icône pour profiter du mode application et du cache hors ligne.','In Safari: tap Share, then “Add to Home Screen”, then Add. Open Eco-System from its icon to use app mode and offline cache.');
    const note=document.createElement('p');note.className='hint';note.textContent=tx('Aucune suppression de données n’est nécessaire. Si l’option n’apparaît pas, ouvrez cette page directement dans Safari.','You do not need to delete any data. If the option is missing, open this page directly in Safari.');
    const close=document.createElement('button');close.type='button';close.className='primary';close.textContent=tx('J’ai compris','Got it');close.onclick=()=>dialog.close();
    dialog.append(h,p,note,close);document.body.append(dialog);dialog.showModal();
};
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstallPrompt = e; $('#installBtn').hidden = false; });
if(iosLike()&&!standaloneMode()){$('#installBtn').hidden=false;$('#installBtn').textContent=tx('Installer sur iPhone / iPad','Install on iPhone / iPad');}
$('#installBtn').addEventListener('click', async () => {
    if (deferredInstallPrompt) {
        await deferredInstallPrompt.prompt();
        deferredInstallPrompt = undefined;
        $('#installBtn').hidden = true;
        return;
    }
    if(iosLike()&&!standaloneMode())showIosInstallGuide();
});
async function ensureCurrentServiceWorker(){
    if(!('serviceWorker' in navigator))return;
    try{
        const controllerKey='eco.sw.controller-ready:'+CAHIER_VERSION;
        navigator.serviceWorker.addEventListener('controllerchange',()=>{
            // A new coherent worker may take control while the user is typing,
            // saving or synchronizing. Never reload that live document: drafts,
            // in-flight requests and the durable outbox must remain untouched.
            try{sessionStorage.setItem(controllerKey,'1');}catch{}
            window.dispatchEvent(new CustomEvent('eco:service-worker-updated',{detail:{version:CAHIER_VERSION}}));
        },{once:false});
        const reg=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
        try{if(navigator.storage&&navigator.storage.persist)await navigator.storage.persist();}catch{}
        try{
            if('periodicSync' in reg)await reg.periodicSync.register('eco-system-outbox',{minInterval:12*60*60*1000});
        }catch{}
        try{
            if('sync' in reg && app.outboxItems().some(x=>x.status!=='CONFIRMED'))await reg.sync.register('eco-system-outbox');
        }catch{}
        // Never reload a live session because a worker changed. On old Android,
        // a forced reload during loss of network can destroy the usable cached page.
        if(navigator.onLine)setTimeout(()=>{try{reg.update();}catch{}},5000);
    }catch{}
}

async function start() {
    const startupInteractionRevision=navigationInteractionRevision;
    document.body.classList.add('auth-restoring');
    renderConnectivity();
    renderKernel();
    let settleStartup;
    applicationStartup=new Promise(resolve=>{settleStartup=resolve;});
    let authenticatedSession=false;
    try {
        bootStage('AUTH_SESSION');
        const session=await app.authStatus();
        if(!session.authenticated||!session.account){showAuth(session.offline?tx('Aucun compte local n’existe encore. Créez votre compte maintenant : Internet n’est pas nécessaire.','No local account exists yet. Create your account now: Internet is not required.'):undefined,session.offline?'register':undefined);return;}
        authenticatedSession=true;bootStage('AUTHENTICATED');window.dispatchEvent(new CustomEvent('eco:preference-scope',{detail:{actorId:app.currentActor(),tenantId:app.currentTenant()}}));
        window.dispatchEvent(new CustomEvent('eco:core-ready'));
        launchStudio?.refreshContext();identityVerificationUI.clearForContext?.();$('#authScreen').hidden=true;document.body.classList.remove('signed-out','auth-restoring');
        $('#accountName').textContent=session.account.displayName+(session.registrationState==='LOCAL_PENDING_REGISTRATION'?tx(' · local',' · local'):'');
        const claim=document.querySelector('#claimLocalAccountBtn');
        if(claim){
          claim.hidden=session.registrationState!=='LOCAL_PENDING_REGISTRATION';claim.disabled=session.registrationState==='LOCAL_PENDING_REGISTRATION'&&!navigator.onLine;
          claim.textContent=navigator.onLine?tx('Finaliser le compte local','Finalize local account'):tx('Compte local · Internet requis pour finaliser','Local account · Internet needed to finalize');
        }
        bootStage('LOCAL_WORKSPACE');await app.bootstrap();
        const shareIntent=parseEcoShareIntent();
        try{
            const catalog=await app.productCatalog();
            modules=catalog.capabilities;
        }catch(error){
            if(!(navigator.onLine===false&&error instanceof Error&&error.message==='NETWORK_UNAVAILABLE'))throw error;
            console.info('Offline product catalog snapshot unavailable; core group workspace remains usable.');
        }
        populateWorkspaceModules();
        // The catalogue is independent of optional group projections. Make its
        // existing destinations available as soon as the catalogue is loaded.
        renderModules();
        renderLotFilters();
        renderEcosystemHighlights();
        renderDomainHubs();
        settleStartup();
        await refreshAll();bootStage('READY');
        const requested=history.state?.ecoNav?.view?history.state.ecoNav:startupNavState??readPersistedNavState();
        if(requested?.view&&startupInteractionRevision===navigationInteractionRevision)showView(requested.view,requested);
        renderPersistedFinancialConflicts();startupNavState=null;
        if(shareIntent)await refreshOptionalOfflineSafe('share-intent',()=>openEcoShareIntent(shareIntent));
        governedGroupUI.openLinkIfPresent?.();
        await refreshOptionalOfflineSafe('workspaces',loadWorkspaces);
    }
    catch (e) {
        if(e instanceof Error&&e.message==='NETWORK_UNAVAILABLE'){
            if(authenticatedSession){
                launchStudio?.refreshContext();identityVerificationUI.clearForContext?.();$('#authScreen').hidden=true;document.body.classList.remove('signed-out','auth-restoring');renderConnectivity();
                try{await renderGroups();}catch(error){console.info('Offline groups restore skipped',error);}
                if(app.activeGroup()){
                  try{await renderMembers();}catch(error){console.info('Offline members restore skipped',error);}
                  try{await renderMeetings();}catch(error){console.info('Offline meetings restore skipped',error);}
                  try{await renderLivingRules();}catch(error){console.info('Offline rubrics restore skipped',error);}
                  try{if(isManager())await renderLedger();}catch(error){console.info('Offline ledger restore skipped',error);}
                  try{renderMeetingMatrix();renderIndividualSheetMatrix();}catch(error){console.info('Offline financial matrix render skipped',error);}
                }
                try{renderOutbox();renderCompatibility();renderKernel();renderModules();renderEcosystemHighlights();renderDomainHubs();}catch{}
                const requested=history.state?.ecoNav?.view?history.state.ecoNav:startupNavState??readPersistedNavState();if(requested?.view&&startupInteractionRevision===navigationInteractionRevision)showView(requested.view,requested);renderPersistedFinancialConflicts();startupNavState=null;
                toast(tx('Mode hors ligne : le noyau local synchronisé a été restauré. Les sections secondaires non disponibles restent différées.','Offline mode: the synchronized local core was restored. Unavailable secondary sections are deferred.'));
                return;
            }
            showAuth(tx('Mode hors ligne disponible : créez votre premier compte local maintenant.','Offline mode is available: create your first local account now.'),'register');return;
        }
        bootStage('FAILED');fail(e);
    }
    finally { settleStartup(); }
}

async function showStatement(membershipId){
    const statement=await app.memberStatement(membershipId);
    document.getElementById('statementDialog')?.remove();
    const dialog=document.createElement('dialog');dialog.id='statementDialog';dialog.className='statement-dialog';
    dialog.innerHTML=html`<h2>${tx('Relevé financier du membre','Member financial statement')}</h2><p>${statement.displayName} · ${statement.groupName}</p><p>${tx('Arrêté au','As of')} ${date(statement.asOf)}</p>`;
    const metrics=document.createElement('div');metrics.className='metrics small statement-metrics';
    const metric=(value,label)=>{const d=document.createElement('div');d.className='metric';d.innerHTML=html`<strong>${fmt(Number(value??0))}</strong><span>${label}</span>`;return d;};
    metrics.append(metric(statement.totalNetContributions,tx('Cotisations nettes','Net contributions')),metric(statement.debtPrincipal,tx('Capital prêts / dettes','Loan principal / debt')),metric(statement.debtInterest,tx('Intérêts dus','Interest due')),metric(statement.totalDebt,tx('Dette totale','Total debt')));
    dialog.append(metrics);
    const note=document.createElement('p');note.className='truth-notice';note.textContent=tx('Les prêts et autres sorties ne sont pas comptés comme des cotisations positives. Ils sont présentés séparément dans les dettes.','Loans and other outflows are not counted as positive contributions. They are shown separately under debts.');dialog.append(note);
    const groupsMap=new Map();
    for(const r of statement.receipts){const key=JSON.stringify([r.meetingId??'',r.rubricId??'']);if(!groupsMap.has(key))groupsMap.set(key,{title:(r.meetingTitle??tx('Sans séance','No meeting'))+' · '+(r.rubricName??tx('Sans rubrique','No rubric')),rows:[]});groupsMap.get(key).rows.push(r);}
    const history=document.createElement('div');history.className='statement-history-groups';const heading=document.createElement('h3');heading.textContent=tx('Historique des contributions et modifications','Contribution and change history');history.append(heading);
    for(const group of groupsMap.values()){
      const details=document.createElement('details');details.open=true;const summary=document.createElement('summary');summary.textContent=group.title;details.append(summary);const list=document.createElement('div');list.className='stack';
      for(const r of group.rows.slice().sort((a,b)=>String(b.receivedAt).localeCompare(String(a.receivedAt)))){
        const item=document.createElement('article');item.className='item contribution-history-item';
        const kind=r.financialNature==='LOAN_DEBT'?tx('Prêt / dette — exclu des cotisations nettes','Loan / debt — excluded from net contributions'):(r.isModified||Number(r.netAmount)!==Number(r.amount.amount)?tx('Contribution modifiée','Modified contribution'):tx('Contribution saisie','Recorded contribution'));
        const title=document.createElement('strong');title.textContent=kind+' · '+fmt(r.amount.amount);
        const info=document.createElement('p');info.textContent=`${tx('Net','Net')} : ${fmt(r.netAmount)} · ${tx('Date / heure','Date / time')} : ${date(r.receivedAt)} · ${tx('Auteur','Author')} : ${r.receivedByName??actorDisplayName(r.receivedBy)}`;item.append(title,info);
        if(r.corrections?.length){const corr=document.createElement('ul');for(const c of r.corrections){const li=document.createElement('li');li.textContent=`${tx('Modification','Change')} · ${date(c.at)} · ${tx('Auteur','Author')} : ${c.authorName??c.authorId??'—'} · ${tx('Motif','Reason')} : ${c.reason??'—'}`;corr.append(li);}item.append(corr);}list.append(item);
      }
      details.append(list);history.append(details);
    }
    if(!groupsMap.size){const empty=document.createElement('div');empty.className='empty-state';empty.textContent=tx('Aucun encaissement enregistré.','No recorded contribution.');history.append(empty);}dialog.append(history);
    const debtDetail=document.createElement('p');debtDetail.className='hint';debtDetail.textContent=tx(`Dette détaillée : capital ${fmt(statement.debtPrincipal??0)} + intérêts ${fmt(statement.debtInterest??0)} + autres impayés ${fmt(statement.otherDebt??0)}.`,`Debt detail: principal ${fmt(statement.debtPrincipal??0)} + interest ${fmt(statement.debtInterest??0)} + other arrears ${fmt(statement.otherDebt??0)}.`);dialog.append(debtDetail);
    try{dialog.append(await renderMemberFinancialNotices({app,membershipId,memberUserId:members.find(m=>m.id===membershipId)?.userId,manager:isManager(),notify:toast,showError:fail}));}catch(e){const p=document.createElement('p');p.className='hint';p.textContent=tx('Le contrôle des modifications financières sera disponible après synchronisation.','Financial change review will be available after synchronization.');dialog.append(p);}
    const exportButton=document.createElement('button');exportButton.textContent=tx('Exporter CSV','Export CSV');exportButton.className='primary';
    exportButton.onclick=()=>{const rows=[['Date / heure','Séance','Rubrique','Nature','Auteur','Montant saisi','Montant net','Motif(s) de modification'],...statement.receipts.map(r=>[r.receivedAt,r.meetingTitle??'Sans séance',r.rubricName??'Sans rubrique',r.financialNature??'CONTRIBUTION',r.receivedByName??r.receivedBy,r.amount.amount,r.netAmount,(r.corrections??[]).map(c=>c.reason??'').filter(Boolean).join(' | ')])];const cell=value=>'"'+String(value??'').replace(/^[\s]*[=+@\-]/,"'$&").replaceAll('"','""')+'"';const blob=new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`releve-${membershipId}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    const print=document.createElement('button');print.textContent=tx('Imprimer / PDF','Print / PDF');print.onclick=()=>window.print();const close=document.createElement('button');close.textContent=tx('Fermer','Close');close.onclick=()=>dialog.close();dialog.append(exportButton,print,close);document.body.append(dialog);dialog.showModal();
}
let authMode='login';
const setAuthMode=mode=>{
    authMode=mode==='register'?'register':'login';
    document.querySelectorAll('[data-auth-mode]').forEach(b=>{const selected=b.dataset.authMode===authMode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
    $('#authNameLabel').hidden=authMode!=='register';$('#authName').required=authMode==='register';
    $('#authSubmit').textContent=authMode==='register'?'Créer mon compte hors ligne ou en ligne':'Me connecter';
    $('#authPassword').autocomplete=authMode==='register'?'new-password':'current-password';
};
function showAuth(message='',preferredMode){window.dispatchEvent(new CustomEvent('eco:context-changed'));recoveryWorkspace.clearForContext();bootStage('SIGNED_OUT');document.body.classList.remove('auth-restoring');document.body.classList.add('signed-out');$('#authScreen').hidden=false;if(preferredMode)setAuthMode(preferredMode);if(message)$('#authError').textContent=message;$('#authUsername').focus();}
document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>setAuthMode(button.dataset.authMode)));
document.querySelector('#authShowPassword')?.addEventListener('change',event=>{const input=document.querySelector('#authPassword');if(input)input.type=event.target.checked?'text':'password';});

$('#authForm').addEventListener('submit',async event=>{
    event.preventDefault();const button=$('#authSubmit');button.disabled=true;$('#authError').textContent='';
    try{
        await app.authenticate(authMode,{username:val('authUsername'),password:document.getElementById('authPassword').value,displayName:val('authName'),rememberDevice:Boolean(document.getElementById('authRememberDevice')?.checked)});
        $('#authPassword').value='';clearFail();await start();
        if(!navigator.onLine&&authMode==='register')toast(tx('Compte créé sur ce téléphone. Vous pouvez commencer sans Internet.','Account created on this phone. You can start without Internet.'));
    }
    catch(e){fail(e);$('#authError').textContent=$('#errorBox').textContent;}
    finally{button.disabled=false;}
});
document.querySelector('#claimLocalAccountBtn')?.addEventListener('click',()=>void(async()=>{
    if(!navigator.onLine){toast(tx('Internet est nécessaire uniquement pour finaliser le compte sur le serveur. Vous pouvez continuer à travailler hors ligne.','Internet is only needed to finalize the account on the server. You can keep working offline.'));return;}
    const password=prompt(tx('Saisissez le mot de passe de ce compte local pour le finaliser et synchroniser ses données :','Enter this local account password to finalize it and synchronize its data:'));
    if(!password)return;
    const button=document.querySelector('#claimLocalAccountBtn');if(button)button.disabled=true;
    try{const result=await app.claimLocalAccount(password);toast(tx(`Compte finalisé · ${result.synced} opération(s) synchronisée(s), ${result.pending} en attente.`,`Account finalized · ${result.synced} operation(s) synchronized, ${result.pending} pending.`));await start();}
    catch(e){fail(e);}
    finally{if(button)button.disabled=false;}
})());
$('#logoutBtn').addEventListener('click',async()=>{try{await app.logout();documentsUI.clearForContext();notificationCenterUI.clearForContext(true);ecoCareUI.clearForContext(true);governedGroupUI.clearForContext(true);economicExperimentsUI.clearForContext(true);resourceAssembliesUI.clearForContext(true);financialExplanationsUI.clearForContext(true);productiveCommunityUI.clearForContext(true);safetyReviewUI.clearForContext(true);dataQualityUI.clearForContext(true);launchStudio?.refreshContext(true);identityVerificationUI.clearForContext?.(true);journeyUI.refresh();localAssistantUI.refreshContext();document.body.classList.add('signed-out');$('#authScreen').hidden=false;$('#accountName').textContent='';const claim=document.querySelector('#claimLocalAccountBtn');if(claim)claim.hidden=true;showAuth(tx('Compte fermé sur cet appareil. Vos données locales ne sont pas supprimées.','Account signed out on this device. Your local data was not deleted.'));}catch(e){fail(e);}});
// Online recovery is serialized by resumeOnline() above: sync durable outbox first, then restart projections.
window.addEventListener('offline',()=>{renderConnectivity();const claim=document.querySelector('#claimLocalAccountBtn');if(claim&&!claim.hidden){claim.disabled=true;claim.textContent=tx('Compte local · Internet requis pour finaliser','Local account · Internet needed to finalize');}});
// Authentication and the first usable workspace take precedence over shell
// installation downloads, especially on a slow phone or a cold browser profile.
void start().finally(()=>void ensureCurrentServiceWorker());
