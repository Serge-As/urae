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
let matrixMeetingId = '';
const isManager = () => groups.find(g => g.id === app.activeGroup())?.viewerRoles?.some(r => ['founder','manager','admin','president','treasurer'].includes(r)) ?? false;
let groupPolicy;
let lastProjectId;
let projectRevision=0;
const launchEditors=[];
let launchStudio;
let modules = [];
let selectedLot = 'ALL';
let deferredInstallPrompt;
const CAHIER_VERSION = '1.4.5-final-mega-offline-governance';
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
        if(state.sheetMode||state.matrixMeetingId)window.dispatchEvent(new CustomEvent('eco:restore-financial-sheet',{detail:{sheetMode:state.sheetMode,matrixMeetingId:state.matrixMeetingId}}));
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
    const next={view:name,scrollY:Number(options.scrollY)||0,anchor:options.anchor,sessionTab:options.sessionTab,meetingId:options.meetingId,matrixMeetingId:options.matrixMeetingId,sheetMode:options.sheetMode,openTarget:options.openTarget};
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
    event.preventDefault();go(view,{anchor:id,force:true});
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
    const list = $('#memberList');
    list.replaceChildren();
    const select = $('#contributionMember');
    select.replaceChildren();
    if (!members.length) {
        list.innerHTML = `<li class="empty-state">${tx('Aucun membre.','No member.')}</li>`;
        select.innerHTML = `<option value="">${tx('Aucun membre','No member')}</option>`;
        return;
    }
    for (const m of members) {
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
            const remove=document.createElement('button');remove.type='button';remove.className='link-btn';remove.textContent=tx('Mettre à la corbeille','Move to trash');remove.onclick=()=>void(async()=>{if(!confirm(tx('Retirer ce membre du groupe ? Il restera restaurable pendant 6 mois.','Remove this member from the group? It remains restorable for 6 months.')))return;try{await app.moveToTrash('MEMBER',m.id);await renderMembers();await renderTrash();toast(tx('Membre placé dans la corbeille.','Member moved to trash.'));}catch(e){fail(e);}})();li.append(remove);
        }
        list.append(li);
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = m.displayName;
        select.append(o);
    }
};
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
    const sessionSelected=document.querySelector('#sessionsMeetingSelect')?.value;
    if(sessionSelected&&sessionSelected!=='__cumulative__'&&meetings.some(x=>x.id===sessionSelected))return sessionSelected;
    if(matrixMeetingId&&meetings.some(x=>x.id===matrixMeetingId))return matrixMeetingId;
    return meetings.find(x=>x.status==='open')?.id??meetings.at(-1)?.id;
};
const exactCellRows=(membershipId,rubricId,meetingId)=>receiptPositions.filter(x=>x.membershipId===membershipId&&x.rubricId===rubricId&&x.meetingId===meetingId);
const exactCellAmount=(membershipId,rubricId,meetingId)=>exactCellRows(membershipId,rubricId,meetingId).reduce((n,x)=>n+Number(x.netAmount??0),0);

const openFinancialCellEditor=({member,rubric,meetingId})=>{
    const meeting=meetings.find(x=>x.id===meetingId);if(!meeting){fail(new Error('MEETING_NOT_FOUND'));return;}
    if(!isManager()){fail(new Error('FORBIDDEN_SCOPE'));return;}
    const current=exactCellAmount(member.id,rubric.id,meetingId);
    document.getElementById('financialCellEditor')?.remove();
    const dialog=document.createElement('dialog');dialog.id='financialCellEditor';dialog.className='financial-cell-editor';
    const h=document.createElement('h2');h.textContent=tx('Saisir / corriger la valeur','Enter / correct value');
    const context=document.createElement('p');context.textContent=`${member.displayName} · ${rubric.name} · ${meetingLabel(meeting)}`;
    const currentLine=document.createElement('p');currentLine.className='current-value';currentLine.textContent=tx('Valeur actuelle : ','Current value: ')+fmt(current);
    const warning=document.createElement('p');warning.className=meeting.status==='closed'?'truth-notice danger':'hint';
    warning.textContent=meeting.status==='closed'
      ? tx('Séance clôturée : toute correction reste tracée et déclenche une alerte aux gestionnaires et au membre.','Closed meeting: every correction remains audited and alerts managers and the member.')
      : current>0
        ? tx('Vous indiquez la nouvelle valeur totale de cette cellule. Eco-System ne l’ajoutera pas à l’ancienne valeur. Si un autre gestionnaire avait saisi la donnée, une confrontation sera ouverte.','Enter the new total value for this cell. Eco-System will not add it to the old value. If another manager entered it, reconciliation will open.')
        : tx('Nouvelle saisie pendant une séance ouverte : le membre recevra une alerte verte.','New entry during an open meeting: the member will receive a green alert.');
    const form=document.createElement('form');form.method='dialog';form.className='form-grid';
    const amount=document.createElement('input');amount.type='number';amount.min='0';amount.step='1';amount.inputMode='numeric';amount.required=true;amount.value=String(current);
    const amountLabel=document.createElement('label');amountLabel.textContent=tx('Nouvelle valeur totale (F CFA)','New total value (XAF)');amountLabel.append(amount);
    const reason=document.createElement('textarea');reason.rows=3;reason.placeholder=tx('Motif de la correction / précision utile','Reason for correction / useful note');if(current>0||meeting.status==='closed')reason.required=true;
    const reasonLabel=document.createElement('label');reasonLabel.className='full';reasonLabel.textContent=tx('Motif','Reason');reasonLabel.append(reason);
    const actions=document.createElement('div');actions.className='actions full';
    const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent=current>0?tx('Proposer / enregistrer cette valeur','Propose / save this value'):tx('Enregistrer cette valeur','Save this value');
    const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent=tx('Annuler','Cancel');cancel.onclick=()=>dialog.close();
    actions.append(save,cancel);form.append(amountLabel,reasonLabel,actions);dialog.append(h,context,currentLine,warning,form);document.body.append(dialog);
    form.onsubmit=e=>void(async()=>{
        e.preventDefault();const target=Number(amount.value);
        if(!Number.isSafeInteger(target)||target<0){fail(new Error('INVALID_CONTRIBUTION_AMOUNT'));return;}
        if(target===current){dialog.close();toast(tx('Aucun changement : la valeur est déjà celle-ci.','No change: this is already the current value.'));return;}
        try{
            save.disabled=true;
            const result=await app.setFinancialCellTarget({meetingId,membershipId:member.id,rubricId:rubric.id,targetAmount:target,currentAmount:current,reason:reason.value.trim()});
            if(result?.status==='CONSENSUS_REQUIRED')toast(tx('La valeur n’a pas été modifiée : confrontation ouverte entre gestionnaires.','Value not changed: manager reconciliation opened.'));
            else if(result?.status==='QUEUED_CONSENSUS'||result?.queued)toast(tx('Opération conservée hors ligne. La correction sera confrontée / synchronisée à la reconnexion.','Operation saved offline. The correction will be reconciled / synchronized on reconnection.'));
            else toast(tx('Valeur enregistrée avec traçabilité.','Value saved with audit trail.'));
            dialog.close();await renderLedger();await sessionsUI.refresh?.();renderIndividualSheetMatrix();
        }catch(err){fail(err);}finally{save.disabled=false;}
    });
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();amount.focus();amount.select();
};

const ensureMatrixMeeting=()=>{
    if(matrixMeetingId&&meetings.some(x=>x.id===matrixMeetingId&&x.status!=='cancelled'))return matrixMeetingId;
    matrixMeetingId=meetings.find(x=>x.status==='open')?.id??meetings.filter(x=>x.status!=='cancelled').at(-1)?.id??'';
    return matrixMeetingId;
};
const renderMeetingMatrix = () => {
    const root = $('#meetingMatrix');
    if (!isManager()) {
        root.innerHTML = '<div class="empty-state">'+tx('La feuille générale de séance est réservée aux responsables habilités. Utilisez « Fiches membres » pour consulter votre propre situation.','The general meeting sheet is restricted to authorized managers. Use “Member sheets” to view your own situation.')+'</div>';
        return;
    }
    if (!members.length || !rubrics.length) {
        root.innerHTML = `<div class="empty-state">${tx('Ajoutez au moins un membre et une rubrique pour afficher la matrice membres × rubriques.','Add at least one member and one rubric to display the member × rubric matrix.')}</div>`;
        return;
    }
    const selectedMeeting=ensureMatrixMeeting();
    if(!selectedMeeting){root.innerHTML='<div class="empty-state">'+tx('Créez une séance avant de saisir des données financières.','Create a meeting before entering financial data.')+'</div>';return;}
    const table = document.createElement('table');table.className = 'meeting-matrix';
    const head = document.createElement('thead'),hr = document.createElement('tr');
    hr.innerHTML = `<th>${tx('Membre','Member')}</th>` + rubrics.filter(r=>r.status!=='ARCHIVED').map(r => html`<th>${r.name}</th>`).join('');
    head.append(hr);table.append(head);const body = document.createElement('tbody');
    for (const m of members.filter(x=>x.status!=='left')) {
        const tr = document.createElement('tr'),name = document.createElement('td');
        name.innerHTML = html`<strong>${m.displayName}</strong><small>${m.roles.join(', ')}</small>`;tr.append(name);
        for (const rubric of rubrics.filter(x=>x.status!=='ARCHIVED')) {
            const td=document.createElement('td'),b=document.createElement('button');b.type='button';b.className='matrix-cell';
            const net=exactCellAmount(m.id,rubric.id,selectedMeeting);b.textContent=fmt(net);b.disabled=!isManager();
            b.title=tx('Saisir la valeur totale de cette cellule — pas un montant à ajouter','Enter the total cell value — not an amount to add');
            b.onclick=()=>openFinancialCellEditor({member:m,rubric,meetingId:selectedMeeting});td.append(b);tr.append(td);
        }
        body.append(tr);
    }
    table.append(body);
    const toolbar=document.createElement('div');toolbar.className='session-safety-toolbar';
    const label=document.createElement('label');label.textContent=tx('Séance de saisie : ','Entry meeting: ');
    const scope=document.createElement('select');scope.id='meetingMatrixScope';scope.setAttribute('aria-label',tx('Séance exacte de la matrice','Exact matrix meeting'));
    for(const m of meetings.filter(x=>x.status!=='cancelled').slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt)))){
        const option=document.createElement('option');option.value=m.id;option.textContent=meetingLabel(m)+' · '+(m.status==='closed'?tx('clôturée','closed'):tx('ouverte','open'));scope.append(option);
    }
    scope.value=selectedMeeting;scope.onchange=()=>{matrixMeetingId=scope.value;renderMeetingMatrix();renderIndividualSheetMatrix();};label.append(scope);
    const other=document.createElement('button');other.type='button';other.className='secondary';other.textContent=tx('Voir les séances','View meetings');other.onclick=()=>go('sessions',{meetingId:selectedMeeting,force:true});
    const add=document.createElement('button');add.type='button';add.className='secondary';add.textContent=tx('+ Nouvelle séance','+ New meeting');add.onclick=()=>go('sessions',{anchor:'sessionsCreateForm',force:true});
    toolbar.append(label,other,add);
    const note=document.createElement('p');note.className='truth-notice';note.textContent=tx('Sécurité : chaque cellule représente la valeur totale pour la séance choisie. Remplacer 1 000 par 500 donne 500 — jamais 1 500. Une valeur existante saisie dans un contexte multi-gestionnaires passe par confrontation avant modification.','Safety: each cell is the total value for the selected meeting. Replacing 1,000 with 500 gives 500 — never 1,500. An existing value in a multi-manager context goes through reconciliation before changing.');
    root.replaceChildren(toolbar,note,table);
};

const renderIndividualSheetMatrix=()=>{
    const root=document.querySelector('#individualSheetMatrix'),select=document.querySelector('#individualSheetMember');if(!root||!select)return;
    const previous=select.value;select.replaceChildren();
    const visible=isManager()?members.filter(x=>x.status!=='left'):members.filter(x=>x.userId===app.currentActor()&&x.status!=='left');
    for(const m of visible){const o=document.createElement('option');o.value=m.id;o.textContent=m.displayName;select.append(o);}
    if(previous&&visible.some(x=>x.id===previous))select.value=previous;
    const membershipId=select.value,member=visible.find(x=>x.id===membershipId);root.replaceChildren();
    if(!member){root.innerHTML='<div class="empty-state">'+tx('Aucune fiche individuelle accessible.','No individual sheet available.')+'</div>';return;}
    const table=document.createElement('table');table.className='meeting-matrix';const head=document.createElement('thead'),hr=document.createElement('tr');hr.append(document.createElement('th'));hr.firstChild.textContent=tx('Séance','Meeting');
    for(const rubric of rubrics.filter(x=>x.status!=='ARCHIVED')){const th=document.createElement('th');th.textContent=rubric.name;hr.append(th);}const totalTh=document.createElement('th');totalTh.textContent='Total';hr.append(totalTh);head.append(hr);table.append(head);
    const body=document.createElement('tbody');
    for(const meeting of meetings.filter(x=>x.status!=='cancelled').slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt)))){
        const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=meetingLabel(meeting)+(meeting.status==='closed'?' · '+tx('clôturée','closed'):'');tr.append(th);let total=0;
        for(const rubric of rubrics.filter(x=>x.status!=='ARCHIVED')){const value=exactCellAmount(member.id,rubric.id,meeting.id);total+=value;const td=document.createElement('td');
            if(isManager()){const b=document.createElement('button');b.type='button';b.className='matrix-cell';b.textContent=fmt(value);b.onclick=()=>openFinancialCellEditor({member,rubric,meetingId:meeting.id});td.append(b);}else td.textContent=fmt(value);tr.append(td);
        }
        const td=document.createElement('td');td.textContent=fmt(total);tr.append(td);body.append(tr);
    }
    table.append(body);root.append(table);
};
document.querySelector('#individualSheetMember')?.addEventListener('change',renderIndividualSheetMatrix);
document.querySelector('#meetingSheetViewBtn')?.addEventListener('click',()=>{document.querySelector('#meetingMatrixPanel').hidden=false;document.querySelector('#individualSheetsMode').hidden=true;document.querySelector('#meetingSheetViewBtn').classList.add('active');document.querySelector('#individualSheetsViewBtn').classList.remove('active');renderMeetingMatrix();});
document.querySelector('#individualSheetsViewBtn')?.addEventListener('click',()=>{document.querySelector('#meetingMatrixPanel').hidden=true;document.querySelector('#individualSheetsMode').hidden=false;document.querySelector('#individualSheetsViewBtn').classList.add('active');document.querySelector('#meetingSheetViewBtn').classList.remove('active');renderIndividualSheetMatrix();});
window.addEventListener('eco:render-two-sheets',()=>{renderMeetingMatrix();renderIndividualSheetMatrix();});
window.addEventListener('eco:restore-financial-sheet',event=>{
    const detail=event instanceof CustomEvent?event.detail??{}:{};
    if(detail.matrixMeetingId&&meetings.some(x=>x.id===detail.matrixMeetingId))matrixMeetingId=detail.matrixMeetingId;
    if(detail.sheetMode==='individual')document.querySelector('#individualSheetsViewBtn')?.click();else document.querySelector('#meetingSheetViewBtn')?.click();
    renderMeetingMatrix();renderIndividualSheetMatrix();
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
    const l = await app.ledger();
    receiptPositions=l.receipts;renderMeetingMatrix();renderIndividualSheetMatrix();
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
    if(!app.activeGroup()){root.innerHTML='<div class="empty-state">'+tx('Sélectionnez un groupe.','Select a group.')+'</div>';return;}
    try{
      const items=await app.trashItems();if(!items.length){root.innerHTML='<div class="empty-state">'+tx('Corbeille vide.','Trash is empty.')+'</div>';return;}
      for(const item of items){const expired=item.status!=='ACTIVE'||Boolean(item.data?.expired),a=document.createElement('article');a.className='item '+(expired?'trash-expired':'');
        const kind={MEETING:tx('Séance','Meeting'),MEMBER:tx('Membre','Member'),RUBRIC:tx('Rubrique','Rubric')}[item.data?.kind]??String(item.data?.kind??'Élément');
        const h=document.createElement('strong');h.textContent=kind+' · '+item.title;const p=document.createElement('p');p.textContent=expired?tx('Délai de restauration expiré. L’élément est définitivement retiré des vues opérationnelles ; l’audit financier reste conservé.','Restore period expired. The item is permanently removed from operational views; financial audit remains preserved.'):tx('Restaurable jusqu’au ','Restorable until ')+date(String(item.data?.restoreUntil??''));a.append(h,p);
        if(!expired){const restore=document.createElement('button');restore.type='button';restore.className='primary';restore.textContent=tx('Restaurer intégralement','Restore fully');restore.onclick=()=>void(async()=>{try{await app.restoreTrashItem(item.id);await refreshGroupContext();toast(tx('Élément restauré.','Item restored.'));}catch(e){fail(e);}})();a.append(restore);}root.append(a);
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
const showFinancialAlert=(input={})=>{
    const bar=document.querySelector('#financialAlertBar');if(!bar)return;
    bar.replaceChildren();const title=document.createElement('strong'),message=document.createElement('span');
    title.textContent=input.title||tx('Mise à jour financière','Financial update');message.textContent=' · '+String(input.message||'');
    bar.className='financial-alert-bar '+(input.closed?'is-critical':input.correction?'is-closed':'is-open');bar.hidden=false;bar.append(title,message);
    if(input.notificationId){const seen=document.createElement('button');seen.type='button';seen.className='link-btn';seen.textContent=tx('J’ai vu','Seen');seen.onclick=()=>void(async()=>{try{await app.markGroupNotificationRead(input.notificationId);bar.hidden=true;}catch(e){fail(e);}})();bar.append(seen);}
};
const renderFinancialAlerts=async()=>{
    const bar=document.querySelector('#financialAlertBar');if(!bar)return;
    if(!app.activeGroup()){bar.hidden=true;return;}
    try{
      const notices=await app.groupNotifications(),unread=notices.filter(x=>!x.read).filter(x=>/financi|cotisation|compte|séance clôturée/i.test(String(x.title??'')+' '+String(x.message??'')));
      const latest=unread[0];if(!latest){bar.hidden=true;return;}
      const closed=String(latest.priority)==='CRITICAL'||/clôtur|après clôture/i.test(String(latest.title??'')+' '+String(latest.message??''));
      showFinancialAlert({title:latest.title,message:latest.message,closed,correction:String(latest.priority)==='HIGH',notificationId:latest.id});
    }catch(error){if(navigator.onLine)console.info('Financial alerts unavailable',error);}
};
window.addEventListener('eco:financial-live-update',event=>{
    const e=event instanceof CustomEvent?event.detail:undefined,p=e?.payload??{};
    showFinancialAlert({title:p.meetingClosed?tx('Alerte après clôture','Post-close alert'):tx('Nouvelle saisie financière','New financial entry'),message:p.operationType==='FINANCIAL_CELL_CORRECTION'?tx('Votre situation financière vient d’être corrigée. Vérifiez-la.','Your financial position was corrected. Please review it.'):tx('Une nouvelle donnée financière vient d’être enregistrée sur votre compte.','A new financial value was recorded on your account.'),closed:Boolean(p.meetingClosed),correction:p.operationType==='FINANCIAL_CELL_CORRECTION'});
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
        await renderLivingRules();
        await groupHomeUI.refresh();
        await sessionsUI.refresh();
        if(manage)await renderLedger();
        else{receiptPositions=[];$('#ledgerMetrics').replaceChildren();$('#receiptList').textContent='Votre relevé individuel est accessible depuis la liste des membres.';}
    }
    if(!active || manage)await refreshOptionalOfflineSafe('applications',renderApplications);else $('#applicationsBox').textContent='Les candidatures sont gérées par les responsables du groupe.';
    await refreshOptionalOfflineSafe('universe',renderUniverse);
    await refreshOptionalOfflineSafe('inbox',renderInbox);
    await refreshOptionalOfflineSafe('completion',()=>completionUI.refresh());
    await refreshOptionalOfflineSafe('advanced',()=>advancedUI.refresh());
    await refreshOptionalOfflineSafe('identity-live',()=>identityLiveUI.refresh());
    await refreshOptionalOfflineSafe('financial-alerts',renderFinancialAlerts);
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
document.querySelector('#financeLoanRulesBtn')?.addEventListener('click',()=>go('finance',{anchor:'financeLoanGuide',openTarget:'loanCompletionPanel',force:true}));
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
    say('3/3 · Synchronisation du groupe…');
    await refreshGroupContext();toast(`Groupe créé : ${group.name}`);go('operations');
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
    renderConnectivity();
    renderKernel();
    try {
        const session=await app.authStatus();
        if(!session.authenticated||!session.account){showAuth(session.offline?tx('Aucun compte local n’existe encore. Choisissez « Créer un compte » : Internet n’est pas nécessaire.','No local account exists yet. Choose “Create account”: Internet is not required.'):undefined);return;}
        $('#authScreen').hidden=true;document.body.classList.remove('signed-out');
        $('#accountName').textContent=session.account.displayName+(session.registrationState==='LOCAL_PENDING_REGISTRATION'?tx(' · local',' · local'):'');
        const claim=$('#claimLocalAccountBtn');claim.hidden=session.registrationState!=='LOCAL_PENDING_REGISTRATION';claim.disabled=session.registrationState==='LOCAL_PENDING_REGISTRATION'&&!navigator.onLine;
        claim.textContent=navigator.onLine?tx('Finaliser le compte local','Finalize local account'):tx('Compte local · Internet requis pour finaliser','Local account · Internet needed to finalize');
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
        if(e instanceof Error&&e.message==='NETWORK_UNAVAILABLE'){showAuth(tx('Mode hors ligne disponible : connectez-vous à un compte local ou créez-en un maintenant.','Offline mode is available: sign in to a local account or create one now.'));return;}
        fail(e);
    }
}

async function showStatement(membershipId){
    const statement=await app.memberStatement(membershipId);
    document.getElementById('statementDialog')?.remove();
    const dialog=document.createElement('dialog');dialog.id='statementDialog';
    dialog.innerHTML=html`<h2>Relevé des cotisations</h2><p>${statement.displayName} · ${statement.groupName}</p><p>Arrêté au ${date(statement.asOf)}</p><strong>Total net : ${fmt(statement.totalNetContributions)}</strong><p class="hint">Ce relevé retrace les encaissements enregistrés et leurs contrepassations. Il ne calcule pas les dettes, prêts ou avoirs d’épargne.</p>`;
    const table=document.createElement('table');table.innerHTML='<thead><tr><th>Date</th><th>Séance / période</th><th>Reçu</th><th>Net</th><th>Détail</th></tr></thead>';
    const body=document.createElement('tbody');
    for(const r of statement.receipts){
        const tr=document.createElement('tr'),meeting=meetings.find(m=>m.id===r.meetingId);
        const tech=r.id+(r.ledgerEntryId?' · '+r.ledgerEntryId:'');
        tr.innerHTML=html`<td>${date(r.receivedAt)}</td><td>${meeting?meetingLabel(meeting):tx('Sans séance','No meeting')}</td><td>${fmt(r.amount.amount)}</td><td>${fmt(r.netAmount)}</td><td></td>`;
        const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=tx('Références techniques','Technical references');details.append(summary,document.createTextNode(tech));tr.lastElementChild.append(details);body.append(tr);
    }
    table.append(body);dialog.append(table);
    const statementMember=members.find(m=>m.id===membershipId);
    try{dialog.append(await renderMemberFinancialNotices({app,membershipId,memberUserId:statementMember?.userId,manager:isManager(),notify:toast,showError:fail}));}catch(e){const p=document.createElement('p');p.className='hint';p.textContent='Le contrôle des modifications financières sera disponible après synchronisation.';dialog.append(p);}
    const exportButton=document.createElement('button');exportButton.textContent='Exporter CSV';exportButton.className='primary';
    exportButton.onclick=()=>{
        const rows=[['Date','Séance / période','Référence technique','Membre','Groupe','Devise','Montant reçu','Montant net'],...statement.receipts.map(r=>{const meeting=meetings.find(m=>m.id===r.meetingId);return[r.receivedAt,meeting?meetingLabel(meeting):'Sans séance',r.id,statement.displayName,statement.groupName,r.amount.currency,r.amount.amount,r.netAmount];})];
        const cell=value=>'"'+String(value).replace(/^[\s]*[=+@\-]/,"'$&").replaceAll('"','""')+'"';
        const blob=new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
        const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`releve-${membershipId}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    const print=document.createElement('button');print.textContent='Imprimer / PDF';print.onclick=()=>window.print();
    const close=document.createElement('button');close.textContent='Fermer';close.onclick=()=>dialog.close();
    dialog.append(exportButton,print,close);document.body.append(dialog);dialog.showModal();
}
let authMode='login';
function showAuth(message=''){document.body.classList.add('signed-out');$('#authScreen').hidden=false;if(message)$('#authError').textContent=message;$('#authUsername').focus();}
document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>{
    authMode=button.dataset.authMode;
    document.querySelectorAll('[data-auth-mode]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});
    $('#authNameLabel').hidden=authMode!=='register';$('#authName').required=authMode==='register';
    $('#authSubmit').textContent=authMode==='register'?'Créer mon compte':'Me connecter';
    $('#authPassword').autocomplete=authMode==='register'?'new-password':'current-password';
}));
$('#authForm').addEventListener('submit',async event=>{
    event.preventDefault();const button=$('#authSubmit');button.disabled=true;$('#authError').textContent='';
    try{
        await app.authenticate(authMode,{username:val('authUsername'),password:document.getElementById('authPassword').value,displayName:val('authName')});
        $('#authPassword').value='';clearFail();await start();
        if(!navigator.onLine&&authMode==='register')toast(tx('Compte créé sur ce téléphone. Vous pouvez commencer sans Internet.','Account created on this phone. You can start without Internet.'));
    }
    catch(e){fail(e);$('#authError').textContent=$('#errorBox').textContent;}
    finally{button.disabled=false;}
});
$('#claimLocalAccountBtn').addEventListener('click',()=>void(async()=>{
    if(!navigator.onLine){toast(tx('Internet est nécessaire uniquement pour finaliser le compte sur le serveur. Vous pouvez continuer à travailler hors ligne.','Internet is only needed to finalize the account on the server. You can keep working offline.'));return;}
    const password=prompt(tx('Saisissez le mot de passe de ce compte local pour le finaliser et synchroniser ses données :','Enter this local account password to finalize it and synchronize its data:'));
    if(!password)return;
    const button=$('#claimLocalAccountBtn');button.disabled=true;
    try{const result=await app.claimLocalAccount(password);toast(tx(`Compte finalisé · ${result.synced} opération(s) synchronisée(s), ${result.pending} en attente.`,`Account finalized · ${result.synced} operation(s) synchronized, ${result.pending} pending.`));await start();}
    catch(e){fail(e);}
    finally{button.disabled=false;}
})());
$('#logoutBtn').addEventListener('click',async()=>{try{await app.logout();document.body.classList.add('signed-out');$('#authScreen').hidden=false;$('#accountName').textContent='';$('#claimLocalAccountBtn').hidden=true;showAuth(tx('Compte fermé sur cet appareil. Vos données locales ne sont pas supprimées.','Account signed out on this device. Your local data was not deleted.'));}catch(e){fail(e);}});
window.addEventListener('online',()=>{renderConnectivity();void start();});
window.addEventListener('offline',()=>{renderConnectivity();const claim=document.querySelector('#claimLocalAccountBtn');if(claim&&!claim.hidden){claim.disabled=true;claim.textContent=tx('Compte local · Internet requis pour finaliser','Local account · Internet needed to finalize');}});
void ensureCurrentServiceWorker();
void start();
