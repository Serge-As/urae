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
import { captureRuntimeI18n, applyRuntimeLocale, localeTag, runtimeTranslate } from './runtime-i18n.js';
import { mountCompletionUI } from './completion-ui.js';
import { mountAdvancedUI } from './advanced-ui.js';
import { mountIdentityLiveUI } from './identity-live-ui.js';
import { mountCommunityShopUI } from './community-shop-ui.js';
import { mountMiscRubricUI } from './misc-rubrics-ui.js';
import { mountPairingUI } from './pairing-ui.js';
import { mountDetailUI } from './detail-ui.js';
import { mountPersonalCockpitUI } from './personal-cockpit-ui.js';
import { mountRecapUI } from './recap-ui.js';
import { mountInterestCommunityUI } from './interest-community-ui.js';
import { mountAdManagerUI } from './ad-manager-ui.js';
import { mountTontineManagerUI } from './tontine-manager-ui.js';
import { mountSavingsYieldUI } from './savings-yield-ui.js';
import { mountExternalProgramsUI } from './external-programs-ui.js';
import { mountFounderControlUI } from './founder-control-ui.js';
import { mountAssistanceRulebookUI } from './assistance-rulebook-ui.js';
import { mountGroupHomeUI } from './group-home-ui.js';
import { mountSessionsUI } from './sessions-ui.js';
import { mountBlueprintExecutableUI } from './blueprint-executable-ui.js';
import { mountCommunityBlueprintPresets } from './community-blueprint-presets.js';
import { mountFinancialLabUI } from './financial-lab-ui.js';
import { mountBusinessStudioUI } from './business-studio-ui.js';
import { mountCoreEconomicLearningUI } from './core-economic-learning-ui.js';
import { mountResilienceUI } from './resilience-ui.js';
let uiLocale = 'fr';
try { uiLocale = localStorage.getItem('tontine.locale') === 'en' ? 'en' : 'fr'; } catch {}
const tx = (fr,en) => runtimeTranslate(uiLocale,fr,en);
const app = new ConnectedApplication({ locale: uiLocale });
captureRuntimeI18n(document);
applyRuntimeLocale(uiLocale);
let groups = [];
let members = [];
let meetings = [];
let rubrics = [];
let receiptPositions = [];
let financialSheetEvents = [];
let financialCellVersions = new Map();
let financialPendingTargets = new Map();
let financialReviewTargets = new Map();
const FINANCIAL_DRAFT_STORAGE='eco.financialCellDrafts';
const financialCellDrafts=new Map((()=>{try{return Object.entries(JSON.parse(localStorage.getItem(FINANCIAL_DRAFT_STORAGE)||'{}'));}catch{return[];}})());
const persistFinancialCellDrafts=()=>{try{const entries=[...financialCellDrafts.entries()].slice(-120);localStorage.setItem(FINANCIAL_DRAFT_STORAGE,JSON.stringify(Object.fromEntries(entries)));}catch{}};
const saveFinancialCellDraft=(key,value)=>{if(value==='')financialCellDrafts.delete(key);else financialCellDrafts.set(key,String(value));persistFinancialCellDrafts();};
const clearFinancialCellDraft=key=>{financialCellDrafts.delete(key);persistFinancialCellDrafts();};
document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target.closest('.cell-validate'):null;
    if(!target)return;
    event.preventDefault();
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
let memberSortMode = 'chronological';
const MANAGER_ROLE_IDS=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);
const isManager = () => {const g=groups.find(g=>g.id===app.activeGroup());return Boolean(g&&(g.createdBy===app.currentActor()||(g.viewerRoles??[]).some(r=>MANAGER_ROLE_IDS.has(r))));};
let groupPolicy;
let lastProjectId;
let projectRevision=0;
const launchEditors=[];
let launchStudio;
let modules = [];
let selectedLot = 'ALL';
let deferredInstallPrompt;
const CAHIER_VERSION = '1.5.1-canonical-financial-tables-kit-business';
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
const toast = (m) => { const e = $('#toast'); e.textContent = m; e.hidden = false; setTimeout(() => e.hidden = true, 2600); };
const fail = (e) => {
    const box = $('#errorBox');
    const code = e instanceof Error ? e.message : String(e);
    const friendly = {
        AUTHENTICATION_REQUIRED: 'Votre session est terminée. Reconnectez-vous pour continuer.',
        INVALID_CREDENTIALS: 'Identifiant ou mot de passe incorrect.',
        INVALID_CREDENTIAL_FORMAT: 'Utilisez un identifiant de 3 à 50 caractères et un mot de passe de 12 à 128 caractères.',
        INVALID_DISPLAY_NAME: 'Indiquez votre nom d’affichage (80 caractères maximum).',
        ACCOUNT_UNAVAILABLE: 'Cet identifiant est déjà utilisé.',
        RATE_LIMITED: 'Trop de tentatives. Réessayez dans dix minutes.',
        INDEPENDENT_APPROVAL_REQUIRED: 'Chaque approbateur doit valider avec son propre compte. Une liste de noms ne vaut pas validation.',
        INDEPENDENT_REVIEW_REQUIRED: 'Cette correction financière exige la revue d’un autre responsable habilité. L’auteur ne peut jamais valider sa propre correction.',
        MEMBER_SELF_ACTION_REQUIRED: 'Le dossier personnel et certaines validations doivent être effectués par le membre concerné lui-même.',
        IDEMPOTENCY_CONFLICT: 'Cette référence correspond déjà à une opération différente. Consultez le reçu existant.',
        CONSENSUS_UNRESOLVED: 'Des saisies de gestionnaires sont encore divergentes. Confrontez-les et choisissez la valeur retenue avant de diffuser aux membres.',
        FORBIDDEN_SCOPE: 'Votre compte ne dispose pas de l’autorisation nécessaire pour ce groupe.',
        DURABLE_STORAGE_REQUIRED: 'Le stockage local est indisponible. Cette opération n’a pas été envoyée.',
        INVALID_CONTRIBUTION_AMOUNT: 'Le montant doit être un entier positif en F CFA.',
        SPECIALIZED_FINANCIAL_CORRECTION_REQUIRED: 'Cette cellule correspond à un prêt, un remboursement ou une sortie. Pour modifier une opération déjà comptabilisée, ouvrez son dossier spécialisé afin de conserver la dette, la caisse et les preuves cohérentes.',
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
    box.textContent = friendly[code] ?? `Action non terminée : ${code}`;
    box.hidden = false;
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
    app, notify: toast, showError: fail, getMembers: () => members, fmt, translate: (fr,en) => tx(fr,en)
});
const identityLiveUI = mountIdentityLiveUI({ app, notify: toast, showError: fail });
const communityShopUI = mountCommunityShopUI({ app, notify: toast, showError: fail, isManager, fmt });
const miscRubricUI = mountMiscRubricUI({ app, notify: toast, showError: fail, getMembers: () => members, getMeetings: () => meetings, isManager, fmt });
const pairingUI = mountPairingUI({ app, notify: toast, showError: fail, getMembers: () => members, isManager, afterMembershipChanged: async groupId => { await renderGroups(); if(groupId){ app.selectGroup(groupId); await refreshGroupContext(); } } });
const clearFail = () => { $('#errorBox').hidden = true; $('#errorBox').textContent = ''; };
let navDepth=Number(history.state?.ecoDepth??0);
const activeViewName=()=>document.querySelector('.view.active')?.id?.replace(/^view-/,'')||'dashboard';
const captureNavState=()=>{
    const view=activeViewName(),active=document.querySelector(`#view-${view}`);
    const sessionTab=document.querySelector('#sessionsTabs [data-session-tab].active')?.dataset?.sessionTab;
    const meetingId=document.querySelector('#sessionsMeetingSelect')?.value||undefined;
    const matrixMeetingId=document.querySelector('#meetingMatrixScope')?.value||undefined;
    const sheetMode=!document.querySelector('#individualSheetsMode')?.hidden?'individual':'meeting';
    const openDetails=[...(active?.querySelectorAll('details[open][id]')??[])].map(x=>x.id).slice(0,40);
    const focusId=document.activeElement?.id||undefined;
    return{view,scrollY:window.scrollY,sessionTab,meetingId,matrixMeetingId,sheetMode,openDetails,focusId};
};
const restoreNavState=state=>{
    if(!state)return;
    if(state.meetingId){const pick=document.querySelector('#sessionsMeetingSelect');if(pick&&[...pick.options].some(o=>o.value===state.meetingId)){pick.value=state.meetingId;pick.dispatchEvent(new Event('change',{bubbles:true}));}}
    if(state.sessionTab){const tab=document.querySelector(`#sessionsTabs [data-session-tab="${state.sessionTab}"]`);if(tab&&!tab.classList.contains('active'))tab.click();}
    for(const id of state.openDetails??[]){const node=document.getElementById(id);if(node?.tagName==='DETAILS')node.open=true;}
    requestAnimationFrame(()=>{
        if(state.openTarget){const node=document.getElementById(state.openTarget);if(node){if(node.tagName==='DETAILS')node.open=true;node.hidden=false;node.setAttribute('aria-hidden','false');}}
        if(state.sheetMode||state.matrixMeetingId||state.membershipId||state.rubricId)window.dispatchEvent(new CustomEvent('eco:restore-financial-sheet',{detail:{sheetMode:state.sheetMode,matrixMeetingId:state.matrixMeetingId,membershipId:state.membershipId,rubricId:state.rubricId}}));
        const anchor=state.anchor?document.getElementById(state.anchor):undefined;
        if(anchor)anchor.scrollIntoView({behavior:'auto',block:'start'});else window.scrollTo({top:Number(state.scrollY)||0,behavior:'auto'});
        if(state.focusId)document.getElementById(state.focusId)?.focus?.({preventScroll:true});
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
    if(activeNav&&window.matchMedia('(max-width:860px)').matches)setTimeout(()=>activeNav.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}),20);
    document.querySelector('#globalSearchResults')?.replaceChildren();
    restoreNavState(state??{view:name,scrollY:0});
    updateBackButton();
    return true;
};
const go=(name,options={})=>{
    const current=captureNavState(),sameDestination=name===current.view&&!options.anchor&&!options.force&&!options.sheetMode&&!options.openTarget;
    if(sameDestination)return;
    try{history.replaceState({ecoNav:current,ecoDepth:navDepth},'',`#${current.view}`);}catch{}
    navDepth+=1;
    const next={view:name,scrollY:Number(options.scrollY)||0,anchor:options.anchor,sessionTab:options.sessionTab,meetingId:options.meetingId,matrixMeetingId:options.matrixMeetingId,sheetMode:options.sheetMode,openTarget:options.openTarget,membershipId:options.membershipId,rubricId:options.rubricId};
    const hash=options.anchor?`#${options.anchor}`:`#${name}`;
    try{history.pushState({ecoNav:next,ecoDepth:navDepth},'',hash);}catch{}
    showView(name,next);updateBackButton();
};
const goBack=()=>{if(navDepth>0)history.back();};
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view,{anchor:b.dataset.anchor,meetingId:b.dataset.meetingId,matrixMeetingId:b.dataset.matrixMeetingId,sheetMode:b.dataset.sheetMode,openTarget:b.dataset.openTarget,force:Boolean(b.dataset.anchor||b.dataset.sheetMode||b.dataset.openTarget)})));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go,{anchor:b.dataset.anchor,meetingId:b.dataset.meetingId,matrixMeetingId:b.dataset.matrixMeetingId,sheetMode:b.dataset.sheetMode,openTarget:b.dataset.openTarget,force:Boolean(b.dataset.anchor||b.dataset.sheetMode||b.dataset.openTarget)})));
document.addEventListener('click',event=>{
    const link=event.target instanceof Element?event.target.closest('a[href^="#"]'):null;if(!link)return;
    const id=(link.getAttribute('href')||'').slice(1);if(!id)return;
    const target=document.getElementById(id);if(!target)return;
    const view=target.closest('.view')?.id?.replace(/^view-/,'');if(!view)return;
    event.preventDefault();go(view,{anchor:id,openTarget:link.dataset.openTarget,force:true});
});
document.querySelector('#appBackBtn')?.addEventListener('click',goBack);
window.addEventListener('popstate',event=>{
    const state=event.state?.ecoNav,hash=location.hash.slice(1);
    navDepth=Math.max(0,Number(event.state?.ecoDepth??Math.max(0,navDepth-1)));
    if(state?.view)showView(state.view,state);
    else if(hash){const target=document.getElementById(hash),view=target?.closest('.view')?.id?.replace(/^view-/,'')||hash;showView(view,{view,anchor:target?hash:undefined,scrollY:0});}
    updateBackButton();
});
try{
    const initial=captureNavState();
    if(!history.state?.ecoNav)history.replaceState({ecoNav:initial,ecoDepth:0},'',location.href);
    navDepth=Math.max(0,Number(history.state?.ecoDepth??0));
}catch{}
updateBackButton();
const detailUI = mountDetailUI({ app, navigate: go, getGroups: () => groups, getMembers: () => members, getMeetings: () => meetings, getRubrics: () => rubrics, isManager, fmt, date, showError: fail });
const personalCockpitUI = mountPersonalCockpitUI({ app, getGroups: () => groups, getMembers: () => members, getMeetings: () => meetings, navigate: go, fmt, date, showError: fail });
const recapUI = mountRecapUI({ app, getGroups: () => groups, getMembers: () => members, getMeetings: () => meetings, getRubrics: () => rubrics, isManager, navigate: go, fmt, date, showError: fail });
const interestCommunityUI = mountInterestCommunityUI({ app, notify: toast, showError: fail, date });
const adManagerUI = mountAdManagerUI({ app, notify: toast, showError: fail, isManager, fmt });
const tontineManagerUI = mountTontineManagerUI({ app, getRubrics: () => rubrics, getMembers: () => members, notify: toast, showError: fail, fmt, isManager });
const savingsYieldUI = mountSavingsYieldUI({ app, getMembers: () => members, notify: toast, showError: fail, fmt, isManager });
const externalProgramsUI = mountExternalProgramsUI({ app, notify: toast, showError: fail, isManager, fmt });
const businessStudioUI = mountBusinessStudioUI({app,navigate:go,notify:toast,showError:fail});
const coreEconomicLearningUI = mountCoreEconomicLearningUI({app,notify:toast,showError:fail,isManager});
const founderControlUI = mountFounderControlUI({ app, notify: toast, showError: fail });
const assistanceRulebookUI = mountAssistanceRulebookUI({ app, notify: toast, showError: fail, isManager });
const groupHomeUI = mountGroupHomeUI({ app, getGroups:()=>groups, getMembers:()=>members, getMeetings:()=>meetings, navigate:go, fmt });
const sessionsUI = mountSessionsUI({
    app,getGroups:()=>groups,getMembers:()=>members,getMeetings:()=>meetings,getRubrics:()=>rubrics,navigate:go,
    openDetail:(type,id)=>detailUI.open(type,id),showError:fail,notify:toast,
    reloadMeetings:async()=>{await renderMeetings();}
});
const blueprintExecutableUI = mountBlueprintExecutableUI({app,getGroups:()=>groups,getMeetings:()=>meetings,navigate:go,notify:toast,showError:fail});
mountCommunityBlueprintPresets();
const financialLabUI = mountFinancialLabUI({app,notify:toast,showError:fail});
const resilienceUI = mountResilienceUI({app,notify:toast,showError:fail});
const renderConnectivity = () => { const online = navigator.onLine; const e = $('#connectivity'); e.textContent = `● ${online ? tx('En ligne','Online') : tx('Hors ligne','Offline')}`; e.className = `pill ${online ? 'online' : 'offline'}`; app.setConnectivity(online ? 'online' : 'offline'); };
let lastOfflineSnapshotNotice=0;
window.addEventListener('eco:offline-snapshot-used',event=>{
    const detail=event instanceof CustomEvent?event.detail:undefined,stamp=detail?.updatedAt?new Date(detail.updatedAt):undefined,e=$('#connectivity');
    const when=stamp&&!Number.isNaN(stamp.getTime())?stamp.toLocaleString():tx('dernière synchro connue','last known sync');
    e.textContent=tx(`● Hors ligne · données du ${when}`,`● Offline · data from ${when}`);e.className='pill offline';
    const now=Date.now();if(now-lastOfflineSnapshotNotice>8000){toast(tx('Mode hors ligne : affichage de la dernière copie synchronisée. Les écritures restent en attente de confirmation serveur.','Offline mode: showing the last synchronized copy. Writes remain pending server confirmation.'));lastOfflineSnapshotNotice=now;}
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
const renderInbox = async () => {
    const items = await app.inboxItems();
    for (const selector of ['#dashboardInbox', '#inboxList']) {
        const root = $(selector);
        root.replaceChildren();
        if (!items.length) {
            root.innerHTML = `<li class="empty-state">${tx('Aucune action urgente.','No urgent action.')}</li>`;
            continue;
        }
        for (const i of items.slice(0, selector === '#dashboardInbox' ? 5 : 50)) {
            const li = document.createElement('li');
            li.textContent = `${i.title} · ${i.status}`;
            root.append(li);
        }
    }
};
const renderMembers = async () => {
    members = (await app.listMembers()).filter(x=>x.status!=='left');
    const list = $('#memberList'),select = $('#contributionMember'),manageSelect=document.querySelector('#memberManageSelect');
    list.replaceChildren();select.replaceChildren();manageSelect?.replaceChildren();
    const sortDate=m=>Date.parse(m.historicalJoinedAt??m.joinedAt??'')||Number.MAX_SAFE_INTEGER;
    const ordered=members.slice().sort((a,b)=>{
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
        const li = document.createElement('li');
        const memberLink=document.createElement('button');memberLink.type='button';memberLink.className='link-btn';memberLink.dataset.detailType='member';memberLink.dataset.detailId=m.id;memberLink.textContent=m.displayName;li.append(memberLink,document.createTextNode(' · '+m.roles.join(', ')));
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
        const o = document.createElement('option');o.value = m.id;o.textContent = m.displayName;select.append(o);
        if(manageSelect){const mo=document.createElement('option');mo.value=m.id;mo.textContent=m.displayName;manageSelect.append(mo);}
    }
};
document.querySelector('#memberSort')?.addEventListener('change',event=>{memberSortMode=event.target.value||'chronological';void renderMembers();});
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

const renderMeetings = async () => {
    meetings = (await app.listMeetings()).filter(x=>x.status!=='cancelled');
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
    if(kind==='REPAYMENT'||/remboursement|repayment/.test(name))return'REPAYMENT';
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
    const correction=financialPendingTargets.get(key);
    if(correction){
      const review=String(correction.businessStatus??'')==='CONSENSUS_REQUIRED';
      return{pending:true,status:review?'REVIEW_REQUIRED':correction.status,kind:review?'REVIEW':'CORRECTION',targetAmount:Number(correction.targetAmount??0)};
    }
    const receipt=exactCellRows(membershipId,rubricId,meetingId).find(x=>x.localPending===true);
    return receipt?{pending:true,status:String(receipt.localPendingStatus??'PENDING'),kind:'ENTRY',targetAmount:Number(receipt.netAmount??receipt.amount?.amount??0)}:{pending:false,status:'',kind:'',targetAmount:undefined};
};
const exactCellAmount=(membershipId,rubricId,meetingId)=>{
    const rubric=rubrics.find(x=>x.id===rubricId),nature=financialNatureForRubric(rubric);
    if(nature!=='CONTRIBUTION')return exactCellEvents(membershipId,rubricId,meetingId).reduce((sum,event)=>sum+(String(event.data?.direction??'IN')==='OUT'?-1:1)*Number(event.data?.amount??0),0);
    const pending=financialPendingTargets.get(financialCellKey(membershipId,rubricId,meetingId));
    // A locally queued target is the working projection until synchronization.
    // Once the server ACK says CONSENSUS_REQUIRED, the canonical Ledger value
    // must remain visible and the target is rendered separately as “Proposé”.
    if(pending&&String(pending.businessStatus??'')!=='CONSENSUS_REQUIRED'&&Number.isSafeInteger(Number(pending.targetAmount))&&Number(pending.targetAmount)>=0)return Number(pending.targetAmount);
    return exactCellRows(membershipId,rubricId,meetingId).reduce((n,x)=>n+Number(x.netAmount??0),0);
};
const exactCellVersion=(membershipId,rubricId,meetingId)=>Number(financialCellVersions.get(JSON.stringify([meetingId,membershipId,rubricId,'XAF']))??0);

const submitFinancialCellElement=async validate=>{
    const holder=validate?.closest?.('.matrix-cell-entry');
    const input=holder?.querySelector?.('.cell-target-input');
    const stateLine=holder?.querySelector?.('.cell-save-state');
    const currentLabel=holder?.querySelector?.('.cell-current');
    if(!holder||!input||!stateLine||!currentLabel)return;
    const membershipId=String(holder.dataset.membershipId??''),rubricId=String(holder.dataset.rubricId??''),meetingId=String(holder.dataset.meetingId??'');
    const member=members.find(x=>x.id===membershipId),rubric=rubrics.find(x=>x.id===rubricId);
    if(!member||!rubric||!meetingId){traceFinancialCell('CELL_FAIL',{membershipId,rubricId,meetingId,error:'CELL_CONTEXT_NOT_FOUND'});fail(new Error('CELL_CONTEXT_NOT_FOUND'));return;}
    const cellKey=financialCellKey(membershipId,rubricId,meetingId);
    if(holder.dataset.submitting==='1'){traceFinancialCell('CELL_SUBMIT_BUSY',{cellKey});return;}
    holder.dataset.submitting='1';
    const nature=financialNatureForRubric(rubric),signedCurrent=exactCellAmount(membershipId,rubricId,meetingId),current=Math.abs(signedCurrent),previousIcon=validate.textContent;
    let target=Number.NaN;
    const setCellState=(state,message='')=>{holder.dataset.saveState=state;holder.classList.toggle('is-failed',state==='FAILED');holder.classList.toggle('is-confirmed',state==='CONFIRMED');stateLine.hidden=!message;stateLine.textContent=message;};
    traceFinancialCell('CELL_SUBMIT_INVOKED',{cellKey,membershipId,rubricId,meetingId,inputValue:input.value,current,nature});
    try{
      clearFail();
      const raw=input.value.trim();
      if(raw===''){setCellState('IDLE');return;}
      target=Number(raw);
      if(!Number.isSafeInteger(target)||target<0)throw new Error('INVALID_CONTRIBUTION_AMOUNT');
      setCellState('SAVING_LOCAL',tx('Enregistrement…','Saving…'));
      traceFinancialCell('CELL_SUBMIT',{cellKey,membershipId,rubricId,meetingId,target,current,nature});
      if(target===current){
        input.value='';clearFinancialCellDraft(cellKey);setCellState('IDLE');
        toast(tx('Aucun changement : cette valeur est déjà enregistrée.','No change: this value is already recorded.'));
        return;
      }
      const meeting=meetings.find(x=>x.id===meetingId);let reason='';
      if(current>0||meeting?.status==='closed'){
        reason=prompt(tx(`Motif de la modification ${fmt(current)} → ${fmt(target)} :`,`Reason for change ${fmt(current)} → ${fmt(target)}:`),tx('Correction de la valeur de la cellule','Cell value correction'))??'';
        if(!reason.trim()){setCellState('IDLE');return;}
      }
      validate.disabled=true;input.disabled=true;validate.textContent='…';holder.classList.add('is-saving');
      let result;
      if(nature==='CONTRIBUTION'){
        if(current===0&&target===0){input.value='';clearFinancialCellDraft(cellKey);setCellState('IDLE');return;}
        result=await app.setFinancialCellTarget({meetingId,membershipId,rubricId,targetAmount:target,currentAmount:current,currentVersion:exactCellVersion(membershipId,rubricId,meetingId),reason:reason.trim()});
      }else{
        if(current>0)throw Error('SPECIALIZED_FINANCIAL_CORRECTION_REQUIRED');
        result=await app.recordFinancialSheetEntry({membershipId,meetingId,rubric,amount:target,reason:reason.trim()||undefined});
      }
      const displayTarget=(nature==='LOAN'||nature==='OUTFLOW')?-target:target;
      if(result?.status==='CONSENSUS_REQUIRED'){
        currentLabel.textContent=fmt(displayTarget);financialReviewTargets.delete(cellKey);
        holder.classList.add('pending-consensus');setCellState('CONFIRMED',tx('Proposition enregistrée · validation d’un second responsable requise','Proposal saved · second manager approval required'));
        traceFinancialCell('CELL_REVIEW_REQUIRED',{cellKey,target,current});toast(tx('Modification proposée : elle est enregistrée et attend la décision des gestionnaires.','Change proposal saved and awaiting manager decision.'));
      }else if(result?.status==='QUEUED_SYNC'||result?.queued){
        currentLabel.textContent=fmt(displayTarget);setCellState('QUEUED_OFFLINE',tx('Enregistré sur cet appareil · synchro en attente','Saved on this device · pending sync'));
        traceFinancialCell('CELL_LOCAL_COMMIT',{cellKey,target,status:'QUEUED'});
        toast(tx('✓ Valeur enregistrée sur cet appareil · synchronisation automatique en attente.','✓ Value saved on this device · automatic sync pending.'));
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
      input.value='';clearFinancialCellDraft(cellKey);
      await renderLedger();renderOutbox();
      window.dispatchEvent(new CustomEvent('eco:financial-data-changed',{detail:{meetingId,membershipId,rubricId}}));
      await sessionsUI.refresh?.();renderIndividualSheetMatrix();
    }catch(e){
      const code=e instanceof Error?e.message:String(e);
      setCellState('FAILED',tx('Échec : ','Failed: ')+code);
      traceFinancialCell('CELL_FAIL',{cellKey,target:Number.isFinite(target)?target:Number(input.value||0),current,error:code});
      fail(e);
    }finally{
      delete holder.dataset.submitting;validate.disabled=false;input.disabled=false;validate.textContent=previousIcon;holder.classList.remove('is-saving');
    }
};

const makeFinancialEntryCell=({member,rubric,meetingId,editable=true})=>{
    const holder=document.createElement('div');holder.className='matrix-cell matrix-cell-entry';holder.dataset.membershipId=member.id;holder.dataset.rubricId=rubric.id;holder.dataset.meetingId=meetingId;holder.tabIndex=-1;
    const nature=financialNatureForRubric(rubric),signedCurrent=exactCellAmount(member.id,rubric.id,meetingId),current=Math.abs(signedCurrent),currentLabel=document.createElement('strong');
    currentLabel.className='cell-current'+(signedCurrent<0?' is-negative':'');currentLabel.textContent=fmt(signedCurrent);holder.append(currentLabel);
    const pendingState=exactCellPendingState(member.id,rubric.id,meetingId);
    if(pendingState.pending){
      const pendingBadge=document.createElement('small');pendingBadge.className='cell-sync-state '+(pendingState.kind==='REVIEW'?'review':'pending');
      pendingBadge.textContent=pendingState.kind==='REVIEW'
        ?tx('Proposition enregistrée · validation d’un second responsable requise','Proposal saved · second manager approval required')
        :tx('Enregistré sur cet appareil · synchro en attente','Saved on this device · pending sync');
      holder.append(pendingBadge);holder.classList.add(pendingState.kind==='REVIEW'?'has-review-pending':'has-local-pending');
      if(Number.isSafeInteger(pendingState.targetAmount)&&pendingState.targetAmount>=0&&pendingState.kind==='REVIEW'){
        const proposed=document.createElement('small');proposed.className='cell-proposed-value';proposed.textContent=tx('Proposé : ','Proposed: ')+fmt(pendingState.targetAmount);holder.append(proposed);
      }
    }
    if(nature==='LOAN'){const badge=document.createElement('small');badge.className='cell-nature negative';badge.textContent=tx('Sortie / dette','Outflow / debt');holder.append(badge);}
    if(!editable)return holder;
    const persistentCellKey=financialCellKey(member.id,rubric.id,meetingId);
    const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.inputMode='numeric';input.className='cell-target-input';input.placeholder=current>0?tx('Modifier…','Change…'):tx('Saisir…','Enter…');input.setAttribute('aria-label',tx('Nouvelle valeur totale','New total value'));
    const restoredDraft=financialCellDrafts.get(persistentCellKey);if(restoredDraft!==undefined)input.value=String(restoredDraft);
    input.addEventListener('input',()=>saveFinancialCellDraft(persistentCellKey,input.value));
    const validate=document.createElement('button');validate.type='button';validate.className='cell-validate';validate.textContent='✓';validate.title=tx('Valider la valeur totale','Confirm total value');validate.setAttribute('aria-label',tx('Valider la saisie','Confirm entry'));
    const stateLine=document.createElement('small');stateLine.className='cell-save-state';stateLine.setAttribute('aria-live','polite');stateLine.hidden=true;
    const setCellState=(state,message='')=>{holder.dataset.saveState=state;holder.classList.toggle('is-failed',state==='FAILED');holder.classList.toggle('is-confirmed',state==='CONFIRMED');stateLine.hidden=!message;stateLine.textContent=message;};
    validate.dataset.ecoSubmitBound='canonical';
    holder.append(input,validate,stateLine);return holder;
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
const activeFinancialMembers=()=>members.filter(x=>x.status!=='left');
const canonicalFinancialObservers=new WeakMap();
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
    if(!activeRubrics.length||!activeMembers.length){root.innerHTML='<div class="empty-state">'+tx('Ajoutez au moins un membre et une rubrique active.','Add at least one member and one active rubric.')+'</div>';return;}
    const wrap=document.createElement('div');wrap.className='matrix-wrap canonical-financial-wrap';
    const table=document.createElement('table');table.className='meeting-matrix canonical-financial-matrix';
    const head=document.createElement('thead'),hr=document.createElement('tr'),body=document.createElement('tbody');
    if(mode==='meeting'){
      if(!isManager()){root.innerHTML='<div class="empty-state">'+tx('La feuille générale de séance est réservée aux responsables habilités.','The general meeting sheet is restricted to authorized managers.')+'</div>';return;}
      const requested=meetingId&&meetings.some(x=>x.id===meetingId&&x.status!=='cancelled')?meetingId:'';
      const selectedMeeting=requested||ensureMatrixMeeting();
      if(!selectedMeeting){root.innerHTML='<div class="empty-state">'+tx('Créez une séance avant de saisir des données financières.','Create a meeting before entering financial data.')+'</div>';return;}
      matrixMeetingId=selectedMeeting;root.dataset.meetingId=selectedMeeting;
      hr.append(document.createElement('th'));hr.firstChild.textContent=tx('Membre','Member');
      for(const r of activeRubrics){const th=document.createElement('th');th.textContent=r.name;hr.append(th);}
      const totalHead=document.createElement('th');totalHead.textContent=tx('Total membre','Member total');hr.append(totalHead);head.append(hr);table.append(head);
      for(const m of activeMembers){
        const tr=document.createElement('tr'),name=document.createElement('th');name.innerHTML=html`<strong>${m.displayName}</strong><small>${m.roles.join(', ')}</small>`;tr.append(name);let rowTotal=0;
        for(const r of activeRubrics){const value=exactCellAmount(m.id,r.id,selectedMeeting);rowTotal+=value;const td=document.createElement('td');td.append(makeFinancialEntryCell({member:m,rubric:r,meetingId:selectedMeeting,editable:Boolean(editable&&isManager())}));tr.append(td);}
        const total=document.createElement('td');total.className='table-row-total';total.textContent=fmt(rowTotal);tr.append(total);body.append(tr);
      }
      const totalRow=document.createElement('tr');totalRow.className='table-total-row';const totalLabel=document.createElement('th');totalLabel.textContent=tx('TOTAL COLONNES','COLUMN TOTALS');totalRow.append(totalLabel);let grand=0;
      for(const r of activeRubrics){const amount=activeMembers.reduce((sum,m)=>sum+exactCellAmount(m.id,r.id,selectedMeeting),0);grand+=amount;const td=document.createElement('td');td.textContent=fmt(amount);totalRow.append(td);}
      const grandTd=document.createElement('td');grandTd.className='table-grand-total';grandTd.textContent=fmt(grand);totalRow.append(grandTd);body.append(totalRow);
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
        toolbar.append(label,other,add);root.append(toolbar);
      }
      root.append(note,wrap);root.dataset.canonicalTableReady='1';return;
    }
    const member=activeMembers.find(x=>x.id===membershipId);
    if(!member){root.innerHTML='<div class="empty-state">'+tx('Aucune fiche individuelle accessible.','No individual sheet available.')+'</div>';return;}
    hr.append(document.createElement('th'));hr.firstChild.textContent=tx('Séance','Meeting');
    for(const r of activeRubrics){const th=document.createElement('th');th.textContent=r.name;hr.append(th);}
    const totalHead=document.createElement('th');totalHead.textContent=tx('Total séance','Meeting total');hr.append(totalHead);head.append(hr);table.append(head);
    const activeMeetings=meetings.filter(x=>x.status!=='cancelled').slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt)));
    for(const meeting of activeMeetings){
      const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=meetingLabel(meeting)+(meeting.status==='closed'?' · '+tx('clôturée','closed'):'');tr.append(th);let rowTotal=0;
      for(const r of activeRubrics){const value=exactCellAmount(member.id,r.id,meeting.id);rowTotal+=value;const td=document.createElement('td');td.append(makeFinancialEntryCell({member,rubric:r,meetingId:meeting.id,editable:Boolean(editable&&isManager())}));tr.append(td);}
      const total=document.createElement('td');total.className='table-row-total';total.textContent=fmt(rowTotal);tr.append(total);body.append(tr);
    }
    const totalRow=document.createElement('tr');totalRow.className='table-total-row';const label=document.createElement('th');label.textContent=tx('TOTAL COLONNES','COLUMN TOTALS');totalRow.append(label);let grand=0;
    for(const r of activeRubrics){const amount=activeMeetings.reduce((sum,meeting)=>sum+exactCellAmount(member.id,r.id,meeting.id),0);grand+=amount;const td=document.createElement('td');td.textContent=fmt(amount);totalRow.append(td);}
    const grandTd=document.createElement('td');grandTd.className='table-grand-total';grandTd.textContent=fmt(grand);totalRow.append(grandTd);body.append(totalRow);table.append(body);wrap.append(table);
    const note=document.createElement('p');note.className='truth-notice';note.textContent=tx('Cette fiche utilise exactement le même éditeur financier que la feuille de séance. Les totaux de chaque rubrique figurent sur la dernière ligne.','This sheet uses exactly the same financial editor as the meeting sheet. Totals for every rubric appear on the last row.');
    root.append(note,wrap);root.dataset.canonicalTableReady='1';
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
window.addEventListener('eco:financial-data-changed',()=>{renderMeetingMatrix();renderIndividualSheetMatrix();renderAllCanonicalFinancialHosts();});
document.querySelector('#individualSheetMember')?.addEventListener('change',renderIndividualSheetMatrix);
document.querySelector('#meetingSheetViewBtn')?.addEventListener('click',()=>{document.querySelector('#meetingMatrixPanel').hidden=false;document.querySelector('#individualSheetsMode').hidden=true;document.querySelector('#meetingSheetViewBtn').classList.add('active');document.querySelector('#individualSheetsViewBtn').classList.remove('active');renderMeetingMatrix();});
document.querySelector('#individualSheetsViewBtn')?.addEventListener('click',()=>{document.querySelector('#meetingMatrixPanel').hidden=true;document.querySelector('#individualSheetsMode').hidden=false;document.querySelector('#individualSheetsViewBtn').classList.add('active');document.querySelector('#meetingSheetViewBtn').classList.remove('active');renderIndividualSheetMatrix();});
window.addEventListener('eco:render-two-sheets',()=>{renderMeetingMatrix();renderIndividualSheetMatrix();});
window.addEventListener('eco:set-matrix-meeting',event=>{const id=event instanceof CustomEvent?String(event.detail?.meetingId??''):'';if(id&&meetings.some(x=>x.id===id)){matrixMeetingId=id;try{sessionStorage.setItem('eco.matrixMeetingId',id);}catch{}}});

window.addEventListener('eco:restore-financial-sheet',event=>{
    const detail=event instanceof CustomEvent?event.detail??{}:{};
    if(detail.matrixMeetingId&&meetings.some(x=>x.id===detail.matrixMeetingId))matrixMeetingId=detail.matrixMeetingId;
    if(detail.sheetMode==='individual')document.querySelector('#individualSheetsViewBtn')?.click();else document.querySelector('#meetingSheetViewBtn')?.click();
    renderMeetingMatrix();renderIndividualSheetMatrix();
    if(detail.membershipId&&detail.rubricId&&matrixMeetingId){
      requestAnimationFrame(()=>{const cell=document.querySelector(`.matrix-cell[data-membership-id="${CSS.escape(detail.membershipId)}"][data-rubric-id="${CSS.escape(detail.rubricId)}"][data-meeting-id="${CSS.escape(matrixMeetingId)}"]`);if(cell){cell.classList.add('pending-consensus');cell.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});cell.focus({preventScroll:true});}});
    }
});
const renderLivingRules = async () => {
    if (!app.activeGroup())
        return;
    try {
        groupPolicy = await app.groupOperatingPolicy();
        const late = groupPolicy.latePosting;
        $('#lateMode').value = late.mode;
        $('#lateMinApprovals').value = String(late.approval.minimumApprovals);
        $('#lateMaxHours').value = late.maxHoursAfterClose === undefined ? '' : String(late.maxHoursAfterClose);
    }
    catch { }
    rubrics = await app.listRubrics();
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
    for (const r of rubrics) {
        if(r.status==='ARCHIVED')continue;
        const a = document.createElement('article');
        a.className = 'item';
        const m = r.operatingModel;
        const rubricLink=document.createElement('button');rubricLink.type='button';rubricLink.className='link-btn';rubricLink.dataset.detailType='rubric';rubricLink.dataset.detailId=r.id;rubricLink.textContent=r.name;a.append(rubricLink);
        const written=document.createElement('p');written.className='hint';written.textContent='Écrit : '+(m?.writtenRule||'—');a.append(written);
        const practice=document.createElement('p');practice.className='hint';practice.textContent='Pratique : '+(m?.observedPractice||'—');a.append(practice);
        const small=document.createElement('small');small.textContent=`${m?.ruleRealityStatus ?? 'UNKNOWN'} · cible ${m?.targetMode ?? 'OPEN'} · manquant ${m?.shortfallHandling ?? '—'}`;a.append(small);
        if(r.activityPlan){
            const summary=document.createElement('p');summary.textContent=describeRubricPlan(r.activityPlan);a.append(summary);
            const scheduled=(r.activityPlan.participants??[]).flatMap(p=>p.shares.filter(s=>s.turn!==undefined).map(s=>`${p.name} · ${s.name} : tour ${s.turn}`));
            if(scheduled.length){const list=document.createElement('ul');for(const text of scheduled){const li=document.createElement('li');li.textContent=text;list.append(li);}a.append(list);}
        }
        if(isManager()){
          const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent=tx('Configurer les caractéristiques / parts','Configure characteristics / shares');
          edit.onclick=()=>editRubricPlan(r,async plan=>{await app.updateRubricActivityPlan(r.id,plan);await renderLivingRules();toast(tx('Caractéristiques enregistrées.','Characteristics saved.'));},launchError);
          const remove=document.createElement('button');remove.type='button';remove.className='link-btn';remove.textContent=tx('Mettre à la corbeille','Move to trash');remove.onclick=()=>void(async()=>{if(!confirm(tx('Archiver cette rubrique dans la corbeille pendant 6 mois ? Les anciennes écritures restent intactes.','Archive this rubric in trash for 6 months? Existing entries remain intact.')))return;try{await app.moveToTrash('RUBRIC',r.id);await renderLivingRules();await renderTrash();toast(tx('Rubrique placée dans la corbeille.','Rubric moved to trash.'));}catch(e){fail(e);}})();
          a.append(edit,remove);
        }
        root.append(a);
        for (const sel of [rselect, pselect]) {
            const o = document.createElement('option');
            o.value = r.id;
            o.textContent = r.name;
            sel.append(o);
        }
    }
    renderMeetingMatrix();
};
const renderLedger = async () => {
    const root = $('#ledgerMetrics');
    const receipts = $('#receiptList');
    root.replaceChildren();
    receipts.replaceChildren();
    if (!app.activeGroup())
        return;
    const [l,sheetEvents,sheetExpenses] = await Promise.all([app.ledger(),app.listWorkspaceRecords('FINANCE.SHEET_EVENT',app.activeGroup()).catch(()=>[]),app.expenses({scope:'SHEET'}).catch(()=>[])]);
    receiptPositions=l.receipts;
    financialPendingTargets=new Map((app.pendingFinancialCellTargets?.()??[]).map(x=>[financialCellKey(x.membershipId,x.rubricId,x.meetingId),x]));
    financialSheetEvents=[...sheetEvents,...sheetExpenses.map(x=>({id:x.id,data:{membershipId:x.membershipId,meetingId:x.meetingId,rubricId:x.rubricId,amount:x.amount,direction:'OUT',ledgerEntryId:x.ledgerEntryId}}))];
    financialCellVersions=new Map((l.cellRevisions??[]).map(r=>[JSON.stringify([r.meetingId,r.membershipId,r.rubricId,r.currency??'XAF']),Number(r.version??0)]));renderMeetingMatrix();renderIndividualSheetMatrix();
    for (const [n, label] of [[l.summary.cashBalance, 'Solde caisse'], [l.summary.memberFundsLiability, 'Engagement membres'], [l.summary.entryCount, 'Écritures']]) {
        const d = document.createElement('div');
        d.className = 'metric';
        d.innerHTML = html`<strong>${label === 'Écritures' ? n : fmt(n)}</strong><span>${label}</span>`;
        root.append(d);
    }
    if (!l.receipts.length)
        receipts.innerHTML = '<div class="empty-state">Aucune cotisation enregistrée.</div>';
    for (const r of l.receipts.slice().reverse().slice(0, 100)) {
        const d = document.createElement('div');
        d.className = 'receipt';
        d.innerHTML = html`<strong>${fmt(r.amount.amount)}</strong><span>${members.find(m=>m.id===r.membershipId)?.displayName ?? r.membershipId}</span><small>${date(r.receivedAt)}${r.latePosting?.isLate ? ' · tardive' : ''}</small>`;
        const net=document.createElement('small');net.textContent=`Net après annulations : ${fmt(r.netAmount)}`;d.append(net);
        const statement=document.createElement('button');statement.className='link-btn';statement.textContent='Relevé';statement.onclick=()=>showStatement(r.membershipId).catch(fail);d.append(statement);
        if(r.netAmount>0){const reverse=document.createElement('button');reverse.className='link-btn';reverse.textContent='Annuler avec trace';reverse.title='Annule cette écriture en conservant son historique. Pour remplacer le montant, utilisez « Saisir / corriger » dans la cellule de la feuille.';reverse.onclick=async()=>{
            const reason=prompt('Pourquoi annuler / corriger cette écriture ? Le reçu original restera visible et Eco-System créera automatiquement l’écriture inverse.');if(!reason?.trim())return;
            reverse.disabled=true;try{await app.reverseLedgerEntry(r.ledgerEntryId,reason);await renderLedger();toast('Correction enregistrée : l’écriture originale est conservée et son inverse a été ajouté.');}catch(e){fail(e);reverse.disabled=false;}
        };d.append(reverse);}
        receipts.append(d);
    }
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
    const m = modules.find(x => x.id === id);
    if (!m)
        return;
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
        if(n.action?.view){const open=document.createElement('button');open.type='button';open.className='primary';open.textContent=n.action.label||tx('Voir le détail','View details');open.onclick=()=>openNoticeAction(n.action);actions.append(open);}
        const seen=document.createElement('button');seen.type='button';seen.className='secondary';seen.textContent=tx('Marquer comme lu','Mark as read');seen.onclick=()=>void(async()=>{try{await app.markGroupNotificationRead(n.id);await renderUrgentNotifications();await renderFinancialAlerts();}catch(e){fail(e);}})();actions.append(seen);
        article.append(h,p,meta,actions);root.append(article);
      }
    }catch(error){if(navigator.onLine)fail(error);else root.innerHTML='<div class="empty-state">'+tx('Alertes non synchronisées hors ligne. Les alertes déjà chargées restent disponibles dans les copies locales.','Alerts not synchronized offline. Previously loaded alerts remain in local copies.')+'</div>';}
};
document.querySelector('#urgentNotificationsRefreshBtn')?.addEventListener('click',()=>void renderUrgentNotifications());
document.querySelector('#urgentNotificationsAllBtn')?.addEventListener('click',()=>{go('inbox',{anchor:'notificationCenterPanel',force:true});setTimeout(()=>document.querySelector('#notificationCenterPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),120);});
const renderNotificationCenter=async()=>{
  const root=document.querySelector('#notificationCenterList'),meta=document.querySelector('#notificationCenterMeta');if(!root)return;
  root.replaceChildren();if(!app.activeGroup()){root.innerHTML='<div class="empty-state">'+tx('Sélectionnez un groupe pour consulter ses alertes.','Select a group to view its alerts.')+'</div>';return;}
  try{
    const rank={CRITICAL:4,HIGH:3,NORMAL:2,LOW:1},notices=(await app.groupNotifications()).slice().sort((a,b)=>Number(Boolean(a.read))-Number(Boolean(b.read))||(rank[String(b.priority)]??0)-(rank[String(a.priority)]??0)||String(b.createdAt??'').localeCompare(String(a.createdAt??'')));
    const visible=notices.slice(0,100);if(meta)meta.textContent=tx(`${notices.filter(x=>!x.read).length} non lue(s) · ${notices.length} alerte(s) connues · affichage des 100 plus pertinentes au maximum.`,`${notices.filter(x=>!x.read).length} unread · ${notices.length} known alerts · showing at most the 100 most relevant.`);
    if(!visible.length){root.innerHTML='<div class="empty-state">'+tx('Aucune alerte pour ce groupe.','No alerts for this group.')+'</div>';return;}
    for(const n of visible){
      const article=document.createElement('article');article.className='item notification-center-item '+(n.read?'is-read':'is-unread')+' priority-'+String(n.priority??'NORMAL').toLowerCase();
      const h=document.createElement('strong');h.textContent=(n.priority==='CRITICAL'?'🔴 ':n.priority==='HIGH'?'🟠 ':n.priority==='LOW'?'⚪ ':'🔵 ')+String(n.title??tx('Notification','Notification'));
      const p=document.createElement('p');p.textContent=String(n.message??'');const small=document.createElement('small');small.textContent=date(n.createdAt);
      const actions=document.createElement('div');actions.className='actions';
      if(n.action?.view){const open=document.createElement('button');open.type='button';open.className='primary';open.textContent=n.action.label||tx('Ouvrir','Open');open.onclick=()=>openNoticeAction(n.action);actions.append(open);}
      if(!n.read){const seen=document.createElement('button');seen.type='button';seen.className='secondary';seen.textContent=tx('Marquer comme lu','Mark as read');seen.onclick=()=>void(async()=>{try{await app.markGroupNotificationRead(n.id);await renderNotificationCenter();await renderUrgentNotifications();await renderFinancialAlerts();}catch(e){fail(e);}})();actions.append(seen);}
      article.append(h,p,small,actions);root.append(article);
    }
  }catch(error){if(navigator.onLine)fail(error);else root.innerHTML='<div class="empty-state">'+tx('Centre d’alertes indisponible hors ligne tant qu’aucune copie locale n’existe.','Alert center unavailable offline until a local copy exists.')+'</div>';}
};
document.querySelector('#notificationCenterRefreshBtn')?.addEventListener('click',()=>void renderNotificationCenter());

const showFinancialAlert=(input={})=>{
    const bar=document.querySelector('#financialAlertBar');if(!bar)return;
    bar.replaceChildren();const title=document.createElement('strong'),message=document.createElement('span');
    title.textContent=input.title||tx('Mise à jour financière','Financial update');message.textContent=' · '+String(input.message||'');
    bar.className='financial-alert-bar '+(input.closed?'is-critical':input.correction?'is-closed':'is-open');bar.hidden=false;bar.append(title,message);
    if(input.action?.view){const open=document.createElement('button');open.type='button';open.className='link-btn';open.textContent=input.action.label||tx('Voir le détail','View details');open.onclick=()=>openNoticeAction(input.action);bar.append(open);}
    if(input.notificationId){const seen=document.createElement('button');seen.type='button';seen.className='link-btn';seen.textContent=tx('J’ai vu','Seen');seen.onclick=()=>void(async()=>{try{await app.markGroupNotificationRead(input.notificationId);bar.hidden=true;await renderUrgentNotifications();}catch(e){fail(e);}})();bar.append(seen);}
};
const renderFinancialAlerts=async()=>{
    const bar=document.querySelector('#financialAlertBar');if(!bar)return;
    if(!app.activeGroup()){bar.hidden=true;return;}
    try{
      const notices=await app.groupNotifications(),unread=notices.filter(x=>!x.read).filter(x=>/financi|cotisation|compte|séance clôturée/i.test(String(x.title??'')+' '+String(x.message??'')));
      const latest=unread[0];if(!latest){bar.hidden=true;return;}
      const closed=String(latest.priority)==='CRITICAL'||/clôtur|après clôture/i.test(String(latest.title??'')+' '+String(latest.message??''));
      showFinancialAlert({title:latest.title,message:latest.message,closed,correction:String(latest.priority)==='HIGH',notificationId:latest.id,action:latest.action});
    }catch(error){if(navigator.onLine)console.info('Financial alerts unavailable',error);}
};
const highlightRemoteFinancialCell=(p={})=>{
    if(!p.meetingId||!p.membershipId||!p.rubricId)return;
    const selector=`.matrix-cell-entry[data-meeting-id="${CSS.escape(String(p.meetingId))}"][data-membership-id="${CSS.escape(String(p.membershipId))}"][data-rubric-id="${CSS.escape(String(p.rubricId))}"]`;
    const cell=document.querySelector(selector);if(!cell)return;
    cell.classList.remove('remote-financial-change','remote-financial-closed');void cell.offsetWidth;cell.classList.add('remote-financial-change');if(p.meetingClosed)cell.classList.add('remote-financial-closed');const table=cell.closest('.canonical-financial-matrix');if(table&&p.meetingClosed)table.classList.add('has-post-close-change');
    const author=String(p.actorName||p.actorId||tx('Autre gestionnaire','Another manager'));cell.dataset.remoteAuthor=author;
    cell.title=tx(`Modifié par ${author} · ${p.previousAmount??'?'} → ${p.newAmount??'?'} F CFA. OK = j’ai vu.`,`Changed by ${author} · ${p.previousAmount??'?'} → ${p.newAmount??'?'} XAF. OK = seen.`);
    const button=cell.querySelector('.cell-validate');if(button){button.textContent='OK';button.classList.add('remote-ack');button.addEventListener('click',()=>{cell.classList.remove('remote-financial-change','remote-financial-closed');button.classList.remove('remote-ack');button.textContent='✓';},{once:true});}
};
window.addEventListener('eco:financial-live-update',event=>{
    const e=event instanceof CustomEvent?event.detail:undefined,p=e?.payload??{};if(String(p.actorId??'')!==String(app.currentActor?.()??''))highlightRemoteFinancialCell(p);
    showFinancialAlert({title:p.meetingClosed?tx('Modification après clôture','Post-close change'):tx('Saisie modifiée','Entry changed'),message:p.actorName?tx(`${p.actorName} a modifié une cellule. Elle clignote en vert.`,`${p.actorName} changed a cell. It is flashing green.`):tx('Une cellule financière vient d’être modifiée.','A financial cell was changed.'),closed:Boolean(p.meetingClosed),correction:true});
});

const refreshGroupContext = async () => {
    await renderGroups();
    const active = Boolean(app.activeGroup());
    $('#operationsContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupOperations').style.display = active ? 'none' : 'block';
    $('#sessionsContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupSessions').style.display = active ? 'none' : 'block';
    $('#financeContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupFinance').style.display = active ? 'none' : 'block';
    $('#membersContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupMembers').style.display = active ? 'none' : 'block';
    const manage=active && isManager();
    if(!active){await groupHomeUI.refresh();await sessionsUI.refresh();}
    $('#backOfficeContent').style.display = manage ? 'block' : 'none';
    $('#noActiveGroupBackoffice').style.display = manage ? 'none' : 'block';
    $('#noActiveGroupBackoffice').textContent = active&&!manage ? tx('Le Back-office est réservé aux responsables habilités du groupe.','Back office is restricted to authorized group managers.') : tx('Sélectionnez ou créez d’abord un groupe.','Select or create a group first.');
    $('#backOfficeNavBtn').hidden = active && !manage;
    for(const id of ['memberForm','meetingForm','latePolicyForm','rubricForm','contributionForm','cashboxForm','publishDiscoveryForm','workspaceForm','tontineCycleForm','tontineShareForm','adCampaignForm'])$( '#'+id).hidden=active && !manage;
    for(const id of ['advancedFinancePanel','assistanceRulebookPanel','savingsYieldLab','financeLedgerPanel']){const node=$('#'+id);if(node)node.hidden=active&&!manage;}
    for(const id of ['openAssistanceRulebookBtn','openSavingsLabBtn']){const node=$('#'+id);if(node)node.hidden=active&&!manage;}
    if (active) {
        await renderMembers();
        await renderMeetings();
        if(manage)await refreshOptionalOfflineSafe('official-loan-rubric',()=>app.ensureOfficialLoanRubric());
        await renderLivingRules();
        await groupHomeUI.refresh();
        await sessionsUI.refresh();
        if(manage)await renderLedger();
        else{receiptPositions=[];financialSheetEvents=[];financialCellVersions=new Map();$('#ledgerMetrics').replaceChildren();$('#receiptList').textContent='Votre relevé individuel est accessible depuis la liste des membres.';}
    }
    if(!active || manage)await refreshOptionalOfflineSafe('applications',renderApplications);else $('#applicationsBox').textContent='Les candidatures sont gérées par les responsables du groupe.';
    await refreshOptionalOfflineSafe('universe',renderUniverse);
    await refreshOptionalOfflineSafe('inbox',renderInbox);
    await refreshOptionalOfflineSafe('completion',()=>completionUI.refresh());
    await refreshOptionalOfflineSafe('advanced',()=>advancedUI.refresh());
    await refreshOptionalOfflineSafe('identity-live',()=>identityLiveUI.refresh());
    await refreshOptionalOfflineSafe('financial-alerts',renderFinancialAlerts);
    await refreshOptionalOfflineSafe('urgent-notifications',renderUrgentNotifications);
    await refreshOptionalOfflineSafe('notification-center',renderNotificationCenter);
    await refreshOptionalOfflineSafe('community-shop',()=>communityShopUI.refresh());
    await refreshOptionalOfflineSafe('misc-rubrics',()=>miscRubricUI.refresh());
    await refreshOptionalOfflineSafe('pairing',()=>pairingUI.refresh());
    await refreshOptionalOfflineSafe('personal-cockpit',()=>personalCockpitUI.refresh());
    await refreshOptionalOfflineSafe('recap',()=>recapUI.refresh());
    await refreshOptionalOfflineSafe('interest-community',()=>interestCommunityUI.refresh());
    await refreshOptionalOfflineSafe('ad-manager',()=>adManagerUI.refresh());
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
$('#activeGroupSelect').addEventListener('change', async (e) => { const id = e.target.value; app.selectGroup(id || undefined); try {
    await refreshGroupContext();
    toast(id ? 'Groupe actif changé.' : 'Aucun groupe actif.');
}
catch (err) {
    fail(err);
} });
const renderGlobalSearch = () => { const q = val('globalSearch').toLowerCase(); const root = $('#globalSearchResults'); root.replaceChildren(); if (q.length < 2)
    return; const ms = modules.filter(m => `${m.id} ${m.labelFr} ${m.labelEn}`.toLowerCase().includes(q)).slice(0, 8); const gs = groups.filter(g => g.name.toLowerCase().includes(q)).slice(0, 4); for (const g of gs) {
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
  const family=val('groupKind');
  if(family==='rotating_tontine'&&!launchEditors.some(editor=>editor.read().kind==='TONTINE')){
    addLaunchRubric({kind:'TONTINE',name:'Tontine',contributionMode:'MONEY'});
  }
  invalidateProject();
};
$('#groupKind').addEventListener('change',syncLaunchFamily);
launchStudio=mountLaunchStudio({
  app,getGroups:()=>groups,getRubrics:()=>{try{return readRubricEditors(launchEditors);}catch{return launchEditors.map(e=>e.read());}},
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
onSubmit('#projectForm', async (e) => { e.preventDefault(); try {
  await simulateCurrentLaunch();
}catch(e){fail(Error(launchError(e)));} });
$('#createGroupBtn').addEventListener('click',async()=>{
  const button=$('#createGroupBtn');if(button.disabled)return;
  const originalLabel=button.textContent;button.disabled=true;$('#projectForm').inert=true;
  const status=$('#launchStepStatus');const say=(message)=>{button.textContent=message;status.textContent=message;toast(message);};
  try{
    let project=lastProjectId;
    if(!project){
      say('1/3 · Vérification de la faisabilité…');
      const simulated=await simulateCurrentLaunch({silent:true});project=simulated.projectId;button.disabled=true;
    }
    say('2/3 · Création du groupe et de ses rubriques…');
    const group=await app.createGroupFromProject(project);
    lastProjectId=undefined;window.__ecoLastProjectReady=false;
    say('3/4 · Enregistrement du Kit prêt à l’emploi…');
    await launchStudio.persistStarterKit?.(group.id);
    say('4/4 · Synchronisation du groupe…');
    await refreshGroupContext();toast(`Groupe créé : ${group.name} · Kit prêt à l’emploi archivé avec le groupe.`);go('operations');
  }catch(error){
    launchStudio.renderPreview();fail(Error(launchError(error)));
  }finally{$('#projectForm').inert=false;button.textContent=originalLabel;}
});
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
    await app.publishActiveGroup({ visibility: val('listingVisibility'), discoverable: val('listingVisibility') === 'PUBLIC', joinPolicy: val('listingJoinPolicy'), recruiting: checked('listingRecruiting'), locality: val('listingLocality') || undefined, missionTags: split(val('listingMission')), activityTags: [] });
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
onSubmit('#supportForm', async (e) => { e.preventDefault(); try {
    const c = await app.openSupportCase(val('supportSummary'));
    document.getElementById('supportSummary').value = '';
    $('#caseLog').textContent = `Dossier ${c.id} ouvert.`;
    await renderInbox();
    toast('Dossier de support ouvert.');
}
catch (e) {
    fail(e);
} });
$('#queueBtn').addEventListener('click', async () => { await app.queueDemoIntent('Note hors ligne Cahier App 1.1'); renderOutbox(); toast('Note mise en file.'); });
$('#syncBtn').addEventListener('click', async () => { if (!navigator.onLine) {
    fail(new Error('Hors ligne'));
    return;
} try{const result=await app.syncOutbox();renderOutbox();if(isManager())await renderLedger();toast(result.some(x=>['FAILED','CONFLICT','PENDING'].includes(x.status))?'Certaines opérations restent à vérifier dans la file.':'Synchronisation confirmée.');}catch(e){fail(e);} });
$('#refreshBtn').addEventListener('click', async () => { try {
    clearFail();
    await refreshAll();
    toast('Données actualisées.');
}
catch (e) {
    fail(e);
} });
$('#modeBtn').addEventListener('click', () => { document.body.classList.toggle('ultra-simple'); toast(document.body.classList.contains('ultra-simple') ? 'Mode Ultra Simple activé.' : 'Mode complet activé.'); });
$('#languageSelect').addEventListener('change', async e => {
    uiLocale = e.target.value === 'en' ? 'en' : 'fr';
    app.setLocale(uiLocale);
    applyRuntimeLocale(uiLocale);
    completionUI.setLocale();
    advancedUI.setLocale();
    renderConnectivity(); renderModules(); renderEcosystemHighlights(); renderDomainHubs(); renderActiveGroup(); renderGroupSelector();
    await renderUniverse(); await renderInbox();
    toast(tx('Interface passée en français.','Interface switched to English.'));
});
window.addEventListener('online', async () => { renderConnectivity(); try {
    await app.syncOutbox();
    await refreshAll();
}
catch { } });
window.addEventListener('offline', renderConnectivity);
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type!=='ECO_SYSTEM_SYNC_OUTBOX'||!navigator.onLine)return;
    void (async()=>{try{await app.syncOutbox();renderOutbox();if(app.activeGroup())await refreshGroupContext();}catch{}})();
});
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
    document.body.classList.add('auth-restoring');
    renderConnectivity();
    renderKernel();
    try {
        const session=await app.authStatus();
        if(!session.authenticated||!session.account){showAuth(session.offline?tx('Aucun compte local n’existe encore. Créez votre compte maintenant : Internet n’est pas nécessaire.','No local account exists yet. Create your account now: Internet is not required.'):undefined,session.offline?'register':undefined);return;}
        $('#authScreen').hidden=true;document.body.classList.remove('signed-out','auth-restoring');
        $('#accountName').textContent=session.account.displayName+(session.registrationState==='LOCAL_PENDING_REGISTRATION'?tx(' · local',' · local'):'');
        const claim=document.querySelector('#claimLocalAccountBtn');
        if(claim){
          claim.hidden=session.registrationState!=='LOCAL_PENDING_REGISTRATION';claim.disabled=session.registrationState==='LOCAL_PENDING_REGISTRATION'&&!navigator.onLine;
          claim.textContent=navigator.onLine?tx('Finaliser le compte local','Finalize local account'):tx('Compte local · Internet requis pour finaliser','Local account · Internet needed to finalize');
        }
        await app.bootstrap();
        const catalog = await app.productCatalog();
        modules = catalog.capabilities;
        populateWorkspaceModules();
        renderLotFilters();
        renderEcosystemHighlights();
        renderDomainHubs();
        await refreshAll();
        await loadWorkspaces();
    }
    catch (e) {
        if(e instanceof Error&&e.message==='NETWORK_UNAVAILABLE'){showAuth(tx('Mode hors ligne disponible : créez votre premier compte local maintenant.','Offline mode is available: create your first local account now.'),'register');return;}
        fail(e);
    }
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
function showAuth(message='',preferredMode){document.body.classList.remove('auth-restoring');document.body.classList.add('signed-out');$('#authScreen').hidden=false;if(preferredMode)setAuthMode(preferredMode);if(message)$('#authError').textContent=message;$('#authUsername').focus();}
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
$('#logoutBtn').addEventListener('click',async()=>{try{await app.logout();document.body.classList.add('signed-out');$('#authScreen').hidden=false;$('#accountName').textContent='';const claim=document.querySelector('#claimLocalAccountBtn');if(claim)claim.hidden=true;showAuth(tx('Compte fermé sur cet appareil. Vos données locales ne sont pas supprimées.','Account signed out on this device. Your local data was not deleted.'));}catch(e){fail(e);}});
window.addEventListener('online',()=>{renderConnectivity();void start();});
window.addEventListener('offline',()=>{renderConnectivity();const claim=document.querySelector('#claimLocalAccountBtn');if(claim&&!claim.hidden){claim.disabled=true;claim.textContent=tx('Compte local · Internet requis pour finaliser','Local account · Internet needed to finalize');}});
void ensureCurrentServiceWorker();
void start();
