import {createRubricEditor,readRubricEditors,describeRubricPlan,editRubricPlan} from './launch-rubrics.js';
import {mountLaunchStudio} from './launch-studio.js';
import {renderMemberFinancialNotices} from './member-control-ui.js';
// UI recovered from the public Cahier App 1.1 on 2026-09-12, then hardened locally.
// Dynamic text is escaped before use in fixed HTML templates.
const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=(strings,...values)=>strings.reduce((out,s,i)=>out+s+(i<values.length?escapeText(values[i]):''),'');
import { ConnectedApplication } from '../../../packages/application/src/index.js';
import { captureRuntimeI18n, applyRuntimeLocale, localeTag, runtimeTranslate } from './runtime-i18n.js';
import { mountCompletionUI } from './completion-ui.js';
import { mountAdvancedUI } from './advanced-ui.js';
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
const CAHIER_VERSION = '1.2.0-functional-completion';
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
        IDEMPOTENCY_CONFLICT: 'Cette référence correspond déjà à une opération différente. Consultez le reçu existant.',
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
const clearFail = () => { $('#errorBox').hidden = true; $('#errorBox').textContent = ''; };
const go = (name) => {
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    document.querySelector(`.nav-btn[data-view="${name}"]`)?.classList.add('active');
    const pop = document.querySelector('#globalSearchResults');
    if (pop)
        pop.replaceChildren();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
const renderConnectivity = () => { const online = navigator.onLine; const e = $('#connectivity'); e.textContent = `● ${online ? tx('En ligne','Online') : tx('Hors ligne','Offline')}`; e.className = `pill ${online ? 'online' : 'offline'}`; app.setConnectivity(online ? 'online' : 'offline'); };
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
    members = await app.listMembers();
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
        li.textContent = `${m.displayName} · ${m.roles.join(', ')}`;
        if(isManager() || m.userId===app.currentActor()){
            const button=document.createElement('button');button.type='button';button.className='link-btn';button.textContent=tx('Relevé','Statement');
            button.onclick=()=>showStatement(m.id).catch(fail);li.append(button);
        }
        list.append(li);
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = m.displayName;
        select.append(o);
    }
};
const renderMeetings = async () => {
    meetings = await app.listMeetings();
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
        span.textContent = `${m.title} · ${m.status === 'open' ? tx('ouverte','open') : tx('clôturée','closed')} · ${date(m.openedAt)}`;
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
        root.append(a);
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = `${m.title} (${m.status})`;
        select.append(o);
    }
};
const activeMeeting = () => meetings.find(x => x.status === 'open')?.id;
const renderMeetingMatrix = () => {
    const root = $('#meetingMatrix');
    if (!members.length || !rubrics.length) {
        root.innerHTML = `<div class="empty-state">${tx('Ajoutez au moins un membre et une rubrique pour afficher la matrice membres × rubriques.','Add at least one member and one rubric to display the member × rubric matrix.')}</div>`;
        return;
    }
    const table = document.createElement('table');
    table.className = 'meeting-matrix';
    const head = document.createElement('thead');
    const hr = document.createElement('tr');
    hr.innerHTML = `<th>${tx('Membre','Member')}</th>` + rubrics.map(r => html`<th>${r.name}</th>`).join('');
    head.append(hr);
    table.append(head);
    const body = document.createElement('tbody');
    for (const m of members) {
        const tr = document.createElement('tr');
        const name = document.createElement('td');
        name.innerHTML = html`<strong>${m.displayName}</strong><small>${m.roles.join(', ')}</small>`;
        tr.append(name);
        for (const r of rubrics) {
            const td = document.createElement('td');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'matrix-cell';
            const net=receiptPositions.filter(x=>x.membershipId===m.id && x.rubricId===r.id && (!matrixMeetingId || x.meetingId===matrixMeetingId)).reduce((n,x)=>n+x.netAmount,0);
            b.textContent = fmt(net);b.disabled=!isManager();
            b.title = `${tx('Préparer une cotisation','Prepare a contribution')} ${m.displayName} · ${r.name}`;
            b.onclick = () => { $('#contributionMember').value = m.id; $('#contributionRubric').value = r.id; if (matrixMeetingId) $('#contributionMeeting').value = matrixMeetingId; go('finance'); $('#contributionAmount').focus(); toast(`${tx('Cotisation prête','Contribution ready')} : ${m.displayName} · ${r.name}`); };
            td.append(b);
            tr.append(td);
        }
        body.append(tr);
    }
    table.append(body);
    const label=document.createElement('label');label.textContent=tx('Encaissements nets confirmés · séance : ','Confirmed net collections · meeting: ');
    const scope=document.createElement('select');scope.setAttribute('aria-label',tx('Séance de la matrice','Matrix meeting'));
    for(const [id,title] of [['',tx('Toutes les séances','All meetings')],...meetings.map(m=>[m.id,m.title])]){
        const option=document.createElement('option');option.value=id;option.textContent=title;scope.append(option);
    }
    scope.value=matrixMeetingId;scope.onchange=()=>{matrixMeetingId=scope.value;renderMeetingMatrix();};label.append(scope);
    const note=document.createElement('p');note.className='hint';note.textContent=tx('Montants comptabilisés, annulations déduites. Une valeur nulle ne constitue pas automatiquement une dette. Cliquez pour préparer une saisie.','Posted amounts, reversals deducted. A zero value does not automatically mean a debt. Click to prepare an entry.');
    root.replaceChildren(label,note,table);
};
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
    for (const r of rubrics) {
        const a = document.createElement('article');
        a.className = 'item';
        const m = r.operatingModel;
        a.innerHTML = html`<strong>${r.name}</strong><p class="hint">Écrit : ${m?.writtenRule || '—'}</p><p class="hint">Pratique : ${m?.observedPractice || '—'}</p><small>${m?.ruleRealityStatus ?? 'UNKNOWN'} · cible ${m?.targetMode ?? 'OPEN'} · manquant ${m?.shortfallHandling ?? '—'}</small>`;
        if(r.activityPlan){
            const summary=document.createElement('p');summary.textContent=describeRubricPlan(r.activityPlan);a.append(summary);
            const scheduled=(r.activityPlan.participants??[]).flatMap(p=>p.shares.filter(s=>s.turn!==undefined).map(s=>`${p.name} · ${s.name} : tour ${s.turn}`));
            if(scheduled.length){const list=document.createElement('ul');for(const text of scheduled){const li=document.createElement('li');li.textContent=text;list.append(li);}a.append(list);}
        }
        const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent=tx('Configurer les caractéristiques / parts','Configure characteristics / shares');
        edit.onclick=()=>editRubricPlan(r,async plan=>{await app.updateRubricActivityPlan(r.id,plan);await renderLivingRules();toast(tx('Caractéristiques enregistrées.','Characteristics saved.'));},launchError);
        a.append(edit);
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
    receiptPositions=l.receipts;renderMeetingMatrix();
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
        if(r.netAmount>0){const reverse=document.createElement('button');reverse.className='link-btn';reverse.textContent='Contrepasser';reverse.onclick=async()=>{
            const reason=prompt('Motif de la contrepassation (le reçu original sera conservé)');if(!reason?.trim())return;
            reverse.disabled=true;try{await app.reverseLedgerEntry(r.ledgerEntryId,reason);await renderLedger();toast('Contrepassation enregistrée.');}catch(e){fail(e);reverse.disabled=false;}
        };d.append(reverse);}
        receipts.append(d);
    }
};
const renderOutbox = () => { const root = $('#outboxList'); root.replaceChildren(); const xs = app.outboxItems(); if (!xs.length) {
    root.innerHTML = '<li class="empty-state">Aucune opération en attente.</li>';
    return;
} for (const x of xs) {
    const li = document.createElement('li');
    li.textContent = `${x.type} · ${x.status}`;
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
    if (id.startsWith('OFFLINE.') || id.startsWith('SUPPORT.') || id.startsWith('EXPERIENCE.UNIVERSAL_INBOX'))
        return 'inbox';
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
        await app.requestToJoin(l.groupId, 'Candidature envoyée depuis Eco-System Cahier App 1.1');
        toast('Candidature envoyée.');
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
const refreshGroupContext = async () => {
    await renderGroups();
    const active = Boolean(app.activeGroup());
    $('#operationsContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupOperations').style.display = active ? 'none' : 'block';
    $('#financeContent').style.display = active ? 'block' : 'none';
    $('#noActiveGroupFinance').style.display = active ? 'none' : 'block';
    const manage=active && isManager();
    for(const id of ['memberForm','meetingForm','latePolicyForm','rubricForm','contributionForm','cashboxForm','publishDiscoveryForm','workspaceForm'])$( '#'+id).hidden=active && !manage;
    if (active) {
        await renderMembers();
        await renderMeetings();
        await renderLivingRules();
        if(manage)await renderLedger();
        else{receiptPositions=[];$('#ledgerMetrics').replaceChildren();$('#receiptList').textContent='Votre relevé individuel est accessible depuis la liste des membres.';}
    }
    if(!active || manage)await renderApplications();else $('#applicationsBox').textContent='Les candidatures sont gérées par les responsables du groupe.';
    await renderUniverse();
    await renderInbox();
    await completionUI.refresh();
    await advancedUI.refresh();
};
const refreshAll = async () => { await refreshGroupContext(); renderOutbox(); renderCompatibility(); renderKernel(); renderModules(); renderEcosystemHighlights(); renderDomainHubs(); };
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
$('#matrixViewBtn').addEventListener('click', () => { $('#meetingMatrixPanel').hidden = false; $('#matrixViewBtn').classList.add('active'); $('#cardViewBtn').classList.remove('active'); renderMeetingMatrix(); });
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
  launchEditors.push(editor);invalidateProject();editor.focus();return editor;
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
onSubmit('#projectForm', async (e) => { e.preventDefault(); try {
    clearFail();const revision=projectRevision;
    const parameters={rubrics:readRubricEditors(launchEditors),launchProfile:launchStudio.readProfile()};
    const r=await app.simulateAndStoreProject({name:val('projectName'),kind:val('groupKind'),governanceModel:val('governanceModel'),...parameters});
    if(revision!==projectRevision){toast('Le projet a changé. Relancez la simulation pour vérifier les nouveaux paramètres.');return;}
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
    launchStudio.afterSimulation();toast('Projet et rubriques vérifiés. Continuez jusqu’à la prévisualisation finale.');
}catch(e){fail(Error(launchError(e)));} });
$('#createGroupBtn').addEventListener('click',async()=>{
  if($('#createGroupBtn').disabled||!lastProjectId)return;
  const project=lastProjectId;$('#createGroupBtn').disabled=true;$('#projectForm').inert=true;
  try{const group=await app.createGroupFromProject(project);lastProjectId=undefined;toast(`Groupe créé : ${group.name}`);await refreshGroupContext();go('operations');}
  catch(error){if(lastProjectId===project)$('#createGroupBtn').disabled=false;fail(error);}
  finally{$('#projectForm').inert=false;}
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
    await app.openMeeting(val('meetingTitle') || 'Séance');
    document.getElementById('meetingTitle').value = '';
    await renderMeetings();
    toast('Séance ouverte.');
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
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstallPrompt = e; $('#installBtn').hidden = false; });
$('#installBtn').addEventListener('click', async () => { if (deferredInstallPrompt) {
    await deferredInstallPrompt.prompt();
    deferredInstallPrompt = undefined;
    $('#installBtn').hidden = true;
} });
async function ensureCurrentServiceWorker(){
    if(!('serviceWorker' in navigator))return;
    try{
        const reg=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
        await reg.update();
        navigator.serviceWorker.addEventListener('controllerchange',()=>{
            try{if(sessionStorage.getItem('eco-system-sw-reloaded')==='1')return;sessionStorage.setItem('eco-system-sw-reloaded','1');}catch{}
            location.reload();
        },{once:true});
    }catch{}
}

async function start() {
    renderConnectivity();
    renderKernel();
    try {
        const session=await app.authStatus();
        if(!session.authenticated){showAuth();return;}
        $('#authScreen').hidden=true;document.body.classList.remove('signed-out');
        $('#accountName').textContent=session.account.displayName;
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
        fail(e);
    }
}

async function showStatement(membershipId){
    const statement=await app.memberStatement(membershipId);
    document.getElementById('statementDialog')?.remove();
    const dialog=document.createElement('dialog');dialog.id='statementDialog';
    dialog.innerHTML=html`<h2>Relevé des cotisations</h2><p>${statement.displayName} · ${statement.groupName}</p><p>Arrêté au ${date(statement.asOf)}</p><strong>Total net : ${fmt(statement.totalNetContributions)}</strong><p class="hint">Ce relevé retrace les encaissements enregistrés et leurs contrepassations. Il ne calcule pas les dettes, prêts ou avoirs d’épargne.</p>`;
    const table=document.createElement('table');table.innerHTML='<thead><tr><th>Date</th><th>Référence</th><th>Reçu</th><th>Net</th></tr></thead>';
    const body=document.createElement('tbody');
    for(const r of statement.receipts){const tr=document.createElement('tr');tr.innerHTML=html`<td>${date(r.receivedAt)}</td><td>${r.id}</td><td>${fmt(r.amount.amount)}</td><td>${fmt(r.netAmount)}</td>`;body.append(tr);}
    table.append(body);dialog.append(table);
    const statementMember=members.find(m=>m.id===membershipId);
    try{dialog.append(await renderMemberFinancialNotices({app,membershipId,memberUserId:statementMember?.userId,manager:isManager(),notify:toast,showError:fail}));}catch(e){const p=document.createElement('p');p.className='hint';p.textContent='Le contrôle des modifications financières sera disponible après synchronisation.';dialog.append(p);}
    const exportButton=document.createElement('button');exportButton.textContent='Exporter CSV';exportButton.className='primary';
    exportButton.onclick=()=>{
        const rows=[['Date','Référence','Membre','Groupe','Devise','Montant reçu','Montant net'],...statement.receipts.map(r=>[r.receivedAt,r.id,statement.displayName,statement.groupName,r.amount.currency,r.amount.amount,r.netAmount])];
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
    try{await app.authenticate(authMode,{username:val('authUsername'),password:document.getElementById('authPassword').value,displayName:val('authName')});
        $('#authPassword').value='';clearFail();await start();}
    catch(e){fail(e);$('#authError').textContent=$('#errorBox').textContent;}
    finally{button.disabled=false;}
});
$('#logoutBtn').addEventListener('click',async()=>{try{await app.logout();location.reload();}catch(e){fail(e);}});
void start();
