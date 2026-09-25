import { ConnectedApplication } from '../../../packages/application/src/index.js';
import type { Group, GroupOperatingPolicy, MeetingSession, MembershipView, RubricDefinition, RubricCyclePreview, WorkspaceRecord } from '../../../packages/contracts/src/index.js';
import type { ProductModule } from '../../../packages/module-registry/src/index.js';

const app=new ConnectedApplication({locale:'fr'});
let groups:Group[]=[]; let members:MembershipView[]=[]; let meetings:MeetingSession[]=[]; let rubrics:RubricDefinition[]=[];
let groupPolicy:GroupOperatingPolicy|undefined; let lastProjectId:string|undefined; let modules:ProductModule[]=[];
let selectedLot='ALL'; let deferredInstallPrompt:any; let wizardStep=1; let launchDraft:Record<string,unknown>={};

const $=<T extends HTMLElement=HTMLElement>(s:string):T=>{const e=document.querySelector(s);if(!e)throw new Error(`UI_ELEMENT_NOT_FOUND:${s}`);return e as T;};
const val=(id:string)=>(document.getElementById(id) as HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement).value.trim();
const num=(id:string)=>Number(val(id));
const checked=(id:string)=>(document.getElementById(id) as HTMLInputElement).checked;
const fmt=(n:number)=>`${new Intl.NumberFormat('fr-CM',{maximumFractionDigits:0}).format(n)} F CFA`;
const split=(v:string)=>v.split(',').map(x=>x.trim()).filter(Boolean);
const date=(v:string)=>{try{return new Intl.DateTimeFormat('fr-CM',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch{return v;}};

const toast=(m:string)=>{const e=$('#toast');e.textContent=m;e.hidden=false;setTimeout(()=>e.hidden=true,2600);};
const fail=(e:unknown)=>{const box=$('#errorBox');const code=e instanceof Error?e.message:String(e);const friendly:Record<string,string>={
  ACTIVE_GROUP_REQUIRED:"Sélectionnez d'abord un groupe.",
  GROUP_NAME_REQUIRED:"Le nom du groupe est obligatoire.",
  MEMBER_NAME_REQUIRED:"Le nom du membre est obligatoire.",
  MEMBERSHIP_NOT_FOUND:"Choisissez un membre.",
  LATE_POSTING_REASON_REQUIRED:"Cette opération après clôture exige un motif.",
  LATE_POSTING_APPROVAL_REQUIRED:"Les validations exigées par le groupe ne sont pas encore réunies. Ajoutez les approbateurs autorisés.",
  LATE_POSTING_NOT_ALLOWED:"Ce groupe interdit actuellement les opérations après clôture. Modifiez la politique seulement si les responsables habilités le décident.",
  LATE_POSTING_WINDOW_EXPIRED:"Le délai autorisé après clôture est dépassé. Une régularisation distincte est nécessaire.",
  WORKSPACE_TITLE_REQUIRED:"Donnez un titre au dossier.",
  INVALID_MODULE_ID:"Le service sélectionné n'est pas reconnu."
};box.textContent=friendly[code]??`Action non terminée : ${code}`;box.hidden=false;};
const clearFail=()=>{$('#errorBox').hidden=true;$('#errorBox').textContent='';};

const go=(name:string)=>{
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
  $(`#view-${name}`).classList.add('active');
  document.querySelector<HTMLButtonElement>(`.nav-btn[data-view="${name}"]`)?.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
};
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view!)));
document.querySelectorAll<HTMLElement>('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go!)));

const openModuleWorkspace=async(moduleId:string, suggestedTitle?:string)=>{
  const module=modules.find(x=>x.id===moduleId);
  if(!module){fail(new Error('INVALID_MODULE_ID'));return;}
  const select=$('#workspaceModule') as HTMLSelectElement;
  select.value=moduleId;
  const title=$('#workspaceTitle') as HTMLInputElement;
  const summary=$('#workspaceSummary') as HTMLTextAreaElement;
  if(suggestedTitle) title.value=suggestedTitle;
  else if(!title.value.trim()) title.value=module.labelFr;
  if(!summary.value.trim()) summary.value=`Dossier ${module.labelFr} — créé depuis le Master Cockpit Eco-System.`;
  go('services');
  await loadWorkspaces();
  title.focus();
};
document.querySelectorAll<HTMLElement>('[data-module-open]').forEach(el=>el.addEventListener('click',()=>{
  void openModuleWorkspace(el.dataset.moduleOpen!,el.dataset.templateTitle);
}));

const renderConnectivity=()=>{const online=navigator.onLine;const e=$('#connectivity');e.textContent=`● ${online?'En ligne':'Hors ligne'}`;e.className=`pill ${online?'online':'offline'}`;app.setConnectivity(online?'online':'offline');};

const renderUniverse=async()=>{
  const u=await app.universe();
  const rows:[number,string][]=[[u.groups,'Groupes'],[u.inbox,'Actions à traiter'],[u.pendingSync,'En attente de synchro'],[u.audit,'Événements audités']];
  const root=$('#universeCards');root.replaceChildren();
  for(const [n,l] of rows){const d=document.createElement('div');d.className='metric';d.innerHTML=`<strong>${n}</strong><span>${l}</span>`;root.append(d);}
};

const renderActiveGroup=()=>{
  const id=app.activeGroup();const group=groups.find(g=>g.id===id);const root=$('#activeGroupCard');
  if(!group){root.className='empty-state';root.textContent='Aucun groupe actif.';return;}
  root.className='item';root.innerHTML=`<strong>${group.name}</strong><p>${group.kind} · ${group.governanceModel}</p><small>Créé le ${date(group.createdAt)}</small>`;
};

const renderGroups=async()=>{
  groups=await app.listGroups();const root=$('#groupsList');root.replaceChildren();
  if(!groups.length){root.innerHTML='<div class="empty-state">Aucun groupe. Lancez votre premier projet.</div>';renderActiveGroup();return;}
  for(const g of groups){const a=document.createElement('article');a.className='item';a.innerHTML=`<strong>${g.name}</strong><p class="hint">${g.kind} · ${g.governanceModel}</p>`;const b=document.createElement('button');b.className='primary';b.textContent=g.id===app.activeGroup()?'Groupe actif':'Sélectionner';b.disabled=g.id===app.activeGroup();b.onclick=async()=>{app.selectGroup(g.id);await refreshGroupContext();toast(`Groupe actif : ${g.name}`);};a.append(b);root.append(a);}
  renderActiveGroup();
};

const renderInbox=async()=>{
  const items=await app.inboxItems();
  for(const selector of ['#dashboardInbox','#inboxList']){const root=$(selector);root.replaceChildren();if(!items.length){root.innerHTML='<li class="empty-state">Aucune action urgente.</li>';continue;}for(const i of items.slice(0,selector==='#dashboardInbox'?5:50)){const li=document.createElement('li');li.textContent=`${i.title} · ${i.status}`;root.append(li);}}
};

const renderMembers=async()=>{
  members=await app.listMembers();const list=$('#memberList');list.replaceChildren();
  const select=$('#contributionMember') as HTMLSelectElement;select.replaceChildren();
  if(!members.length){list.innerHTML='<li class="empty-state">Aucun membre.</li>';select.innerHTML='<option value="">Aucun membre</option>';return;}
  for(const m of members){const li=document.createElement('li');li.textContent=`${m.displayName} · ${m.roles.join(', ')}`;list.append(li);const o=document.createElement('option');o.value=m.id;o.textContent=m.displayName;select.append(o);}
};

const renderMeetings=async()=>{
  meetings=await app.listMeetings();const root=$('#meetingList');root.replaceChildren();const select=$('#contributionMeeting') as HTMLSelectElement;select.replaceChildren();
  const none=document.createElement('option');none.value='';none.textContent='Sans séance';select.append(none);
  for(const m of meetings.slice().sort((a,b)=>b.openedAt.localeCompare(a.openedAt))){const a=document.createElement('article');a.className='meeting-row';const span=document.createElement('span');span.textContent=`${m.title} · ${m.status==='open'?'ouverte':'clôturée'} · ${date(m.openedAt)}`;a.append(span);if(m.status==='open'){const b=document.createElement('button');b.textContent='Clôturer';b.onclick=async()=>{try{clearFail();await app.closeMeeting(m.id);await renderMeetings();toast('Clôture enregistrée comme checkpoint.');}catch(e){fail(e);}};a.append(b);}root.append(a);const o=document.createElement('option');o.value=m.id;o.textContent=`${m.title} (${m.status})`;select.append(o);}
};
const activeMeeting=()=>meetings.find(x=>x.status==='open')?.id;

const renderMeetingMatrix=()=>{
  const root=$('#meetingMatrix');
  root.replaceChildren();
  if(!app.activeGroup()||!members.length||!rubrics.length){
    root.innerHTML='<div class="empty-state">Ajoutez des membres et au moins une rubrique pour afficher la matrice.</div>';
    return;
  }
  const table=document.createElement('table');
  table.className='matrix-table';
  const head=document.createElement('thead');
  const hr=document.createElement('tr');
  hr.innerHTML='<th>Membre</th>'+rubrics.map(r=>`<th>${r.name}</th>`).join('');
  head.append(hr);table.append(head);
  const body=document.createElement('tbody');
  for(const member of members){
    const tr=document.createElement('tr');
    const name=document.createElement('td');name.textContent=member.displayName;tr.append(name);
    for(const rubric of rubrics){
      const td=document.createElement('td');
      const input=document.createElement('input');
      input.type='number';input.min='0';input.step='1';input.placeholder='0';
      input.dataset.matrixMember=member.id;input.dataset.matrixRubric=rubric.id;
      input.setAttribute('aria-label',`${member.displayName} — ${rubric.name}`);
      td.append(input);tr.append(td);
    }
    body.append(tr);
  }
  table.append(body);root.append(table);
};

const saveMeetingMatrix=async()=>{
  const inputs=[...document.querySelectorAll<HTMLInputElement>('[data-matrix-member][data-matrix-rubric]')];
  const entries=inputs.map(input=>({
    input,
    membershipId:input.dataset.matrixMember!,
    rubricId:input.dataset.matrixRubric!,
    amount:Number(input.value||0)
  })).filter(x=>Number.isFinite(x.amount)&&x.amount>0);
  if(!entries.length){toast('Aucun montant à enregistrer dans la matrice.');return;}
  clearFail();
  let done=0;let queued=0;
  try{
    for(const x of entries){
      const result=await app.recordCashContribution({
        membershipId:x.membershipId,
        rubricId:x.rubricId,
        meetingId:activeMeeting(),
        amount:x.amount
      });
      if(result.queued)queued++; else done++;
      x.input.value='';
    }
    renderOutbox();
    await renderLedger();
    toast(`Matrice enregistrée : ${done} écriture(s)${queued?` · ${queued} en attente offline`:''}.`);
  }catch(e){fail(e);}
};

const renderLivingRules=async()=>{
  if(!app.activeGroup())return;
  try{groupPolicy=await app.groupOperatingPolicy();const late=groupPolicy.latePosting;($('#lateMode') as HTMLSelectElement).value=late.mode;($('#lateMinApprovals') as HTMLInputElement).value=String(late.approval.minimumApprovals);($('#lateMaxHours') as HTMLInputElement).value=late.maxHoursAfterClose===undefined?'':String(late.maxHoursAfterClose);}catch{}
  rubrics=await app.listRubrics();const root=$('#rubricList');root.replaceChildren();const rselect=$('#contributionRubric') as HTMLSelectElement;const pselect=$('#rubricPreviewRubric') as HTMLSelectElement;rselect.replaceChildren();pselect.replaceChildren();
  const none=document.createElement('option');none.value='';none.textContent='Sans rubrique';rselect.append(none);
  if(!rubrics.length){root.innerHTML='<div class="empty-state">Aucune rubrique personnalisée. Décrivez par exemple la collation de ce groupe.</div>';}
  for(const r of rubrics){const a=document.createElement('article');a.className='item';const m=r.operatingModel;a.innerHTML=`<strong>${r.name}</strong><p class="hint">Écrit : ${m?.writtenRule||'—'}</p><p class="hint">Pratique : ${m?.observedPractice||'—'}</p><small>${m?.ruleRealityStatus??'UNKNOWN'} · cible ${m?.targetMode??'OPEN'} · manquant ${m?.shortfallHandling??'—'}</small>`;root.append(a);for(const sel of [rselect,pselect]){const o=document.createElement('option');o.value=r.id;o.textContent=r.name;sel.append(o);}}
};

const renderLedger=async()=>{
  const root=$('#ledgerMetrics');const receipts=$('#receiptList');root.replaceChildren();receipts.replaceChildren();if(!app.activeGroup())return;
  const l=await app.ledger();for(const [n,label] of [[l.summary.cashBalance,'Solde caisse'],[l.summary.memberFundsLiability,'Engagement membres'],[l.summary.entryCount,'Écritures']] as Array<[number,string]>){const d=document.createElement('div');d.className='metric';d.innerHTML=`<strong>${label==='Écritures'?n:fmt(n)}</strong><span>${label}</span>`;root.append(d);}
  if(!l.receipts.length)receipts.innerHTML='<div class="empty-state">Aucune cotisation enregistrée.</div>';
  for(const r of l.receipts.slice().reverse().slice(0,100)){const d=document.createElement('div');d.className='receipt';d.innerHTML=`<strong>${fmt(r.amount.amount)}</strong><span>${r.membershipId}</span><small>${date(r.receivedAt)}${r.latePosting?.isLate?' · tardive':''}</small>`;receipts.append(d);}
};

const renderOutbox=()=>{const root=$('#outboxList');root.replaceChildren();const xs=app.outboxItems();if(!xs.length){root.innerHTML='<li class="empty-state">Aucune opération en attente.</li>';return;}for(const x of xs){const li=document.createElement('li');li.textContent=`${x.type} · ${x.status}`;root.append(li);}};

const renderCompatibility=()=>{
  const caps={serviceWorker:'serviceWorker'in navigator,indexedDb:'indexedDB'in window,webRtc:'RTCPeerConnection'in window,bluetooth:'bluetooth'in navigator,microphone:Boolean(navigator.mediaDevices?.getUserMedia),webGpu:'gpu'in navigator};
  const r=app.deviceCompatibility(caps);$('#compatibilityLevel').innerHTML=`<strong>${r.level}</strong>`;const root=$('#compatibilityList');root.replaceChildren();for(const [k,v] of Object.entries(caps)){const li=document.createElement('li');li.textContent=`${k} : ${String(v)}`;root.append(li);}
};

const renderKernel=()=>{const root=$('#kernelList');root.replaceChildren();for(const id of app.kernelServices()){const li=document.createElement('li');li.textContent=id;root.append(li);}const s=app.safetyState();$('#safetyState').innerHTML=`<article class="item"><strong>Argent réel</strong><p>${s.realMoneyEnabled?'ACTIF':'DÉSACTIVÉ'}</p></article><article class="item"><strong>Ledger cash manuel</strong><p>${s.manualCashLedgerEnabled?'Actif':'Inactif'}</p></article><article class="item"><strong>IA cloud payante</strong><p>${s.cloudAiBudgetEnabled?'Active':'Désactivée'}</p></article>`;};

const renderModules=()=>{
  const q=val('catalogSearch').toLowerCase();const root=$('#moduleCatalog');root.replaceChildren();const chosen=modules.filter(m=>(selectedLot==='ALL'||m.lot===selectedLot)&&(!q||`${m.id} ${m.labelFr} ${m.labelEn}`.toLowerCase().includes(q)));
  $('#capabilityCount').textContent=String(modules.length);
  for(const m of chosen){const a=document.createElement('article');a.className='module-card';a.innerHTML=`<span class="module-status ${m.status.toLowerCase()}">${m.status.replaceAll('_',' ')}</span><strong>${m.labelFr}</strong><small>${m.id} · Lot ${m.lot} · ${m.workspace==='SPECIALIZED'?'moteur spécialisé':'workspace universel'}</small>`;a.onclick=()=>{($('#workspaceModule') as HTMLSelectElement).value=m.id;go('services');void loadWorkspaces();};root.append(a);}
};
const renderModuleStatuses=()=>{
  document.querySelectorAll<HTMLElement>('[data-status-for]').forEach(el=>{
    const m=modules.find(x=>x.id===el.dataset.statusFor);
    if(!m){el.textContent='À cartographier';return;}
    const label=m.status==='FOUNDATION_ACTIVE'?'Fondation active':m.status==='STRUCTURAL_V1'?'Structure prête':m.status==='PLANNED_DOMAIN'?'Domaine planifié':'Option ultérieure';
    el.textContent=label;
    el.className=`status-inline ${m.status.toLowerCase()}`;
  });
};

const renderLotFilters=()=>{const root=$('#lotFilters');root.replaceChildren();for(const lot of ['ALL','B','C','D','E','F','G','H','I','J']){const b=document.createElement('button');b.className=`filter ${lot===selectedLot?'active':''}`;b.textContent=lot==='ALL'?'Tous':`Lot ${lot}`;b.onclick=()=>{selectedLot=lot;renderLotFilters();renderModules();};root.append(b);}};

const renderEcosystemHighlights=()=>{
  const ids=['COMMUNITY.FORUM','COMMUNITY.PRO_HUBS','MARKETPLACE.GROUP_BUY','MANAGER.BUSINESS_STUDIO','ADS.MANAGER','LEARNING.MANAGER_ACADEMY','AI.ASSISTANT','PAPER.BRIDGE'];
  const root=$('#ecosystemHighlights');root.replaceChildren();for(const id of ids){const m=modules.find(x=>x.id===id);if(!m)continue;const b=document.createElement('button');b.className='quick';b.innerHTML=`<b>${m.labelFr}</b><span>${m.id}</span>`;b.onclick=()=>{($('#workspaceModule') as HTMLSelectElement).value=id;go('services');void loadWorkspaces();};root.append(b);}
};

const populateWorkspaceModules=()=>{const sel=$('#workspaceModule') as HTMLSelectElement;sel.replaceChildren();for(const m of modules){const o=document.createElement('option');o.value=m.id;o.textContent=`${m.labelFr} — ${m.id}`;sel.append(o);}};

const loadWorkspaces=async()=>{
  try{clearFail();const moduleId=val('workspaceModule');const xs=await app.listWorkspaceRecords(moduleId);const root=$('#workspaceRecords');root.replaceChildren();if(!xs.length){root.innerHTML='<div class="empty-state">Aucun dossier pour ce service. Créez le premier.</div>';return;}for(const x of xs.slice().reverse()){const a=document.createElement('article');a.className='item';a.innerHTML=`<strong>${x.title}</strong><p>${x.summary??''}</p><small>${x.status} · ${x.tags.join(', ')} · ${date(x.updatedAt)}</small>`;const b=document.createElement('button');b.className='link-btn';b.textContent=x.status==='DONE'?'Réactiver':'Marquer terminé';b.onclick=async()=>{await app.updateWorkspaceRecord(x.id,{status:x.status==='DONE'?'ACTIVE':'DONE'});await loadWorkspaces();};a.append(b);root.append(a);}}catch(e){fail(e);}
};

const renderDiscoveryResults=(xs:any[])=>{const root=$('#discoveryResults');root.replaceChildren();if(!xs.length){root.innerHTML='<div class="empty-state">Aucun groupe public correspondant.</div>';return;}for(const x of xs){const l=x.listing;const a=document.createElement('article');a.className='item';a.innerHTML=`<strong>${l.name}</strong><p>${l.locality??'Localité non publiée'} · ${l.family}</p><small>Affinité ${x.score} · ${l.recruiting?'recrute':'ne recrute pas actuellement'}</small>`;const b=document.createElement('button');b.className='primary';b.textContent='Demander à rejoindre';b.disabled=l.joinPolicy==='CLOSED'||l.joinPolicy==='INVITE_ONLY';b.onclick=async()=>{try{await app.requestToJoin(l.groupId,'Candidature envoyée depuis Eco-System Complete App');toast('Candidature envoyée.');}catch(e){fail(e);}};a.append(b);root.append(a);}};

const renderApplications=async()=>{const root=$('#applicationsBox');root.replaceChildren();if(!app.activeGroup()){root.innerHTML='<div class="empty-state">Sélectionnez un groupe pour voir ses candidatures.</div>';return;}try{const xs=await app.listApplications();if(!xs.length){root.innerHTML='<div class="empty-state">Aucune candidature en attente.</div>';return;}for(const x of xs){const a=document.createElement('article');a.className='item';a.innerHTML=`<strong>${x.applicantUserId}</strong><p>${x.message??''}</p><small>${x.status}</small>`;if(x.status==='PENDING'){for(const decision of ['APPROVE','REJECT'] as const){const b=document.createElement('button');b.className=decision==='APPROVE'?'primary':'link-btn';b.textContent=decision==='APPROVE'?'Approuver':'Refuser';b.onclick=async()=>{try{await app.decideApplication(x.id,decision);toast(decision==='APPROVE'?'Adhésion approuvée.':'Candidature refusée.');await renderApplications();await renderMembers();}catch(e){fail(e);}};a.append(b);}}root.append(a);}}catch(e){fail(e);}};

const refreshGroupContext=async()=>{
  await renderGroups();const active=Boolean(app.activeGroup());
  ($('#operationsContent') as HTMLElement).style.display=active?'block':'none';($('#noActiveGroupOperations') as HTMLElement).style.display=active?'none':'block';
  ($('#financeContent') as HTMLElement).style.display=active?'block':'none';($('#noActiveGroupFinance') as HTMLElement).style.display=active?'none':'block';
  if(active){await renderMembers();await renderMeetings();await renderLivingRules();await renderLedger();renderMeetingMatrix();}
  await renderApplications();await renderUniverse();await renderInbox();
};
const refreshAll=async()=>{await refreshGroupContext();renderOutbox();renderCompatibility();renderKernel();renderModules();renderEcosystemHighlights();renderModuleStatuses();};

const wizardSteps=[...document.querySelectorAll<HTMLElement>('.wizard-step')];
const wizardChips=[...document.querySelectorAll<HTMLButtonElement>('[data-step-jump]')];
const formValue=(id:string)=>{const e=document.getElementById(id) as HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|null;return e?.value?.trim()??'';};
const radioValue=(name:string)=>document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value??'';
const checkedValues=(name:string)=>[...document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map(x=>x.value);

const collectLaunchDraft=()=>({
  origin:radioValue('origin'),
  name:formValue('projectName'),
  historicalStartDate:formValue('historicalStartDate'),
  exerciseLabel:formValue('exerciseLabel'),
  family:formValue('groupKind'),
  governance:formValue('governanceModel'),
  financialAuthority:formValue('financialAuthority'),
  launchQuorum:formValue('launchQuorum'),
  delegationNotes:formValue('delegationNotes'),
  cycleStartDate:formValue('cycleStartDate'),
  sessions:formValue('sessions'),
  meetingFrequency:formValue('meetingFrequency'),
  meetingDay:formValue('meetingDay'),
  physicalPresence:checked('physicalPresence'),
  memberCount:formValue('memberCount'),
  entryPolicy:formValue('entryPolicy'),
  trialPeriod:formValue('trialPeriod'),
  multiSharePolicy:formValue('multiSharePolicy'),
  memberImportNotes:formValue('memberImportNotes'),
  benefitMode:formValue('benefitMode'),
  beneficiaryOrder:formValue('beneficiaryOrder'),
  catchupPolicy:formValue('catchupPolicy'),
  starterKit:formValue('starterKit'),
  plannedRubrics:formValue('plannedRubrics'),
  nominalContribution:formValue('nominalContribution'),
  managementFee:formValue('managementFee'),
  externalCostRate:formValue('externalCostRate'),
  fixedSessionCost:formValue('fixedSessionCost'),
  simulationScenario:formValue('simulationScenario'),
  lateRate:formValue('lateRate'),
  channels:checkedValues('channel'),
  publishPolicy:formValue('publishPolicy'),
  accessibility:radioValue('accessibility'),
  legacyDevicePriority:checked('legacyDevicePriority')
});

const renderLaunchPreview=()=>{
  launchDraft=collectLaunchDraft();
  const root=$('#launchPreview');root.replaceChildren();
  const rows:Array<[string,unknown]>=[
    ['Origine',launchDraft.origin],['Groupe',launchDraft.name||'—'],['Famille',launchDraft.family],
    ['Gouvernance',launchDraft.governance],['Exercice',launchDraft.exerciseLabel||launchDraft.cycleStartDate||'—'],
    ['Membres prévus',launchDraft.memberCount],['Séances',launchDraft.sessions],['Rubriques',launchDraft.plannedRubrics||'—'],
    ['Cotisation nominale',launchDraft.nominalContribution?fmt(Number(launchDraft.nominalContribution)):'—'],
    ['Communication',Array.isArray(launchDraft.channels)?launchDraft.channels.join(', '):'—'],
    ['Accessibilité',launchDraft.accessibility],['Faible connexion',launchDraft.legacyDevicePriority?'Prioritaire':'Standard']
  ];
  for(const [label,value] of rows){
    const d=document.createElement('div');d.className='preview-kv';
    d.innerHTML=`<span>${label}</span><strong>${String(value??'—')}</strong>`;root.append(d);
  }
  try{localStorage.setItem('eco-system-launch-draft-v234',JSON.stringify(launchDraft));}catch{}
};

const setWizardStep=(next:number)=>{
  wizardStep=Math.max(1,Math.min(10,next));
  wizardSteps.forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===wizardStep));
  wizardChips.forEach(x=>{const n=Number(x.dataset.stepJump);x.classList.toggle('active',n===wizardStep);x.classList.toggle('done',n<wizardStep);});
  $('#wizardProgress').textContent=`Étape ${wizardStep} / 10`;
  ($('#wizardPrev') as HTMLButtonElement).disabled=wizardStep===1;
  ($('#wizardNext') as HTMLButtonElement).style.display=wizardStep===10?'none':'inline-flex';
  if(wizardStep===10)renderLaunchPreview();
  document.querySelector('.page-head')?.scrollIntoView({behavior:'smooth',block:'start'});
};
$('#wizardPrev').addEventListener('click',()=>setWizardStep(wizardStep-1));
$('#wizardNext').addEventListener('click',()=>setWizardStep(wizardStep+1));
wizardChips.forEach(x=>x.addEventListener('click',()=>setWizardStep(Number(x.dataset.stepJump))));
document.querySelectorAll<HTMLInputElement>('input[name="familyChoice"]').forEach(r=>r.addEventListener('change',()=>{
  const select=$('#groupKind') as HTMLSelectElement;
  select.value=r.value;
}));
try{
  const saved=localStorage.getItem('eco-system-launch-draft-v234');
  if(saved)launchDraft=JSON.parse(saved);
}catch{}
setWizardStep(1);

$('#projectForm').addEventListener('input',()=>{lastProjectId=undefined;($('#createGroupBtn') as HTMLButtonElement).disabled=true;$('#simulationResult').replaceChildren();});
$('#projectForm').addEventListener('submit',async e=>{e.preventDefault();try{clearFail();renderLaunchPreview();const r=await app.simulateAndStoreProject({name:val('projectName'),kind:val('groupKind') as Group['kind'],governanceModel:val('governanceModel') as Group['governanceModel'],memberCount:num('memberCount'),sessions:num('sessions'),nominalContribution:num('nominalContribution'),managementFeePerContribution:num('managementFee'),estimatedExternalCostRate:num('externalCostRate')/100,fixedOperatingCostPerSession:num('fixedSessionCost')});lastProjectId=r.projectId;const root=$('#simulationResult');root.innerHTML=`<div class="result-row"><span>Volume brut</span><strong>${fmt(r.result.totalNominalContributions)}</strong></div><div class="result-row"><span>Revenus gestion</span><strong>${fmt(r.result.totalManagementFees)}</strong></div><div class="result-row"><span>Coûts estimés</span><strong>${fmt(r.result.estimatedExternalCosts+r.result.fixedOperatingCosts)}</strong></div><div class="result-row"><span>Marge estimée</span><strong>${fmt(r.result.estimatedManagerMargin)}</strong></div>`;($('#createGroupBtn') as HTMLButtonElement).disabled=false;toast('Faisabilité simulée. Vous pouvez encore revenir à toute étape.');}catch(e){fail(e);}});
$('#createGroupBtn').addEventListener('click',async()=>{if(!lastProjectId)return;try{const g=await app.createGroupFromProject(lastProjectId);try{await app.createWorkspaceRecord({moduleId:'GROUP.LAUNCH_STUDIO',title:`Dossier de lancement — ${g.name}`,summary:JSON.stringify(launchDraft),status:'DONE',tags:['cahier-2.3.4','launch-cockpit'],data:{source:'master-cockpit-20260911',cahier:'2.3.4'}});}catch{}try{localStorage.removeItem('eco-system-launch-draft-v234');}catch{}toast(`Groupe créé : ${g.name}`);await refreshGroupContext();go('operations');}catch(e){fail(e);}});

$('#memberForm').addEventListener('submit',async e=>{e.preventDefault();try{await app.addMember(val('memberName'));(document.getElementById('memberName') as HTMLInputElement).value='';await renderMembers();toast('Membre ajouté.');}catch(e){fail(e);}});
$('#meetingForm').addEventListener('submit',async e=>{e.preventDefault();try{await app.openMeeting(val('meetingTitle')||'Séance');(document.getElementById('meetingTitle') as HTMLInputElement).value='';await renderMeetings();toast('Séance ouverte.');}catch(e){fail(e);}});
$('#latePolicyForm').addEventListener('submit',async e=>{e.preventDefault();try{const current=groupPolicy??await app.groupOperatingPolicy();const mode=val('lateMode') as GroupOperatingPolicy['latePosting']['mode'];const raw=val('lateMaxHours');const min=Math.max(0,Math.trunc(num('lateMinApprovals')));const policy:GroupOperatingPolicy={...current,latePosting:{...current.latePosting,mode,maxHoursAfterClose:raw?Number(raw):undefined,requireReason:mode!=='FORBIDDEN',approval:{...current.latePosting.approval,roleCodes:current.latePosting.approval.roleCodes?.length?current.latePosting.approval.roleCodes:['founder','president','treasurer','manager'],minimumApprovals:mode==='GOVERNED'?Math.max(1,min):min}}};await app.updateGroupOperatingPolicy(policy);await renderLivingRules();toast('Politique après clôture enregistrée.');}catch(e){fail(e);}});
$('#rubricForm').addEventListener('submit',async e=>{e.preventDefault();try{const tm=val('targetMode') as any;const model:any={writtenRule:val('writtenRule')||undefined,observedPractice:val('observedPractice')||undefined,ruleRealityStatus:val('ruleRealityStatus'),targetMode:tm,targetAmount:tm==='FIXED_TOTAL'?{currency:'XAF',amount:num('fixedTargetAmount')}:undefined,perMemberAmount:tm==='PER_MEMBER_FIXED'?{currency:'XAF',amount:num('perMemberAmount')}:undefined,mandatoryForAbsentees:checked('mandatoryAbsentees'),shortfallHandling:val('shortfallHandling'),payoutMode:val('payoutMode'),immediateFullPayout:checked('immediateFullPayout')};await app.createRubric({name:val('rubricName'),writtenRule:model.writtenRule,observedPractice:model.observedPractice,model});await renderLivingRules();toast('Rubrique enregistrée.');}catch(e){fail(e);}});
$('#rubricPreviewForm').addEventListener('submit',async e=>{e.preventDefault();try{const id=val('rubricPreviewRubric');if(!id)throw new Error('RUBRIC_NOT_FOUND');const p=await app.previewRubricCycle(id,{memberCount:num('previewMemberCount'),collectedFromMembers:num('previewCollected'),solidarityCoverageAmount:num('previewSolidarity')});renderPreview(p);}catch(e){fail(e);}});
function renderPreview(p:RubricCyclePreview){$('#rubricPreviewResult').innerHTML=[['Attendu',p.expectedTotal],['Collecté membres',p.collectedFromMembers],['Manquant / dette',p.memberShortfall],['Couverture solidaire',p.solidarityCoverage],['Disponible bénéficiaire',p.availableForBeneficiary],['Décaissement',p.beneficiaryDisbursement],['Solde rubrique',p.remainingRubricBalance],['Dette membre après couverture',p.memberDebtAfterCoverage]].map(([l,n])=>`<div class="result-row"><span>${l}</span><strong>${fmt(Number(n))}</strong></div>`).join('');}

$('#contributionForm').addEventListener('submit',async e=>{e.preventDefault();try{const membershipId=val('contributionMember');if(!membershipId)throw new Error('MEMBERSHIP_NOT_FOUND');const r=await app.recordCashContribution({membershipId,amount:num('contributionAmount'),rubricId:val('contributionRubric')||undefined,meetingId:val('contributionMeeting')||undefined,lateReason:val('lateReason')||undefined,approverIds:split(val('lateApprovers'))});toast(r.queued?'Cotisation mise en attente hors ligne.':r.receipt?.latePosting?.isLate?'Cotisation tardive enregistrée et tracée.':'Cotisation enregistrée.');renderOutbox();if(!r.queued)await renderLedger();}catch(e){fail(e);}});
$('#cashboxForm').addEventListener('submit',async e=>{e.preventDefault();try{const r=await app.reconcileCashbox({openingCash:num('opening'),cashIn:num('cashIn'),cashOut:num('cashOut'),countedClosing:num('counted'),meetingId:activeMeeting()});$('#cashboxResult').innerHTML=`<div class="result-row"><span>Théorique</span><strong>${fmt(r.snapshot.theoreticalClosing)}</strong></div><div class="result-row"><span>Écart</span><strong>${fmt(r.snapshot.variance)}</strong></div><div class="result-row"><span>Statut</span><strong>${r.status}</strong></div>`;toast('Rapprochement enregistré.');}catch(e){fail(e);}});
$('#matrixRefresh').addEventListener('click',()=>renderMeetingMatrix());
$('#matrixSave').addEventListener('click',()=>void saveMeetingMatrix());

$('#discoverySearchForm').addEventListener('submit',async e=>{e.preventDefault();try{const xs=await app.searchGroups({q:val('discoveryQ')||undefined,locality:val('discoveryLocality')||undefined,recruitingOnly:checked('discoveryRecruiting')});renderDiscoveryResults(xs);}catch(e){fail(e);}});
$('#publishDiscoveryForm').addEventListener('submit',async e=>{e.preventDefault();try{await app.publishActiveGroup({visibility:val('listingVisibility') as any,discoverable:val('listingVisibility')==='PUBLIC',joinPolicy:val('listingJoinPolicy') as any,recruiting:checked('listingRecruiting'),locality:val('listingLocality')||undefined,missionTags:split(val('listingMission')),activityTags:[]});toast('Projection publique mise à jour.');}catch(e){fail(e);}});

$('#workspaceModule').addEventListener('change',()=>void loadWorkspaces());
$('#workspaceReload').addEventListener('click',()=>void loadWorkspaces());
$('#workspaceForm').addEventListener('submit',async e=>{e.preventDefault();try{await app.createWorkspaceRecord({moduleId:val('workspaceModule'),title:val('workspaceTitle'),summary:val('workspaceSummary')||undefined,status:val('workspaceStatus') as any,tags:split(val('workspaceTags')),data:{source:'complete-app-1.0'}});(document.getElementById('workspaceTitle') as HTMLInputElement).value='';(document.getElementById('workspaceSummary') as HTMLTextAreaElement).value='';await loadWorkspaces();toast('Dossier enregistré sur D1.');}catch(e){fail(e);}});
$('#catalogSearch').addEventListener('input',renderModules);

$('#supportForm').addEventListener('submit',async e=>{e.preventDefault();try{const c=await app.openSupportCase(val('supportSummary'));(document.getElementById('supportSummary') as HTMLTextAreaElement).value='';$('#caseLog').textContent=`Dossier ${c.id} ouvert.`;await renderInbox();toast('Dossier de support ouvert.');}catch(e){fail(e);}});
$('#queueBtn').addEventListener('click',async()=>{await app.queueDemoIntent('Note hors ligne Complete App');renderOutbox();toast('Note mise en file.');});
$('#syncBtn').addEventListener('click',async()=>{if(!navigator.onLine){fail(new Error('Hors ligne'));return;}await app.syncOutbox();renderOutbox();toast('Synchronisation terminée.');});
$('#refreshBtn').addEventListener('click',async()=>{try{clearFail();await refreshAll();toast('Données actualisées.');}catch(e){fail(e);}});
$('#modeBtn').addEventListener('click',()=>{document.body.classList.toggle('ultra-simple');toast(document.body.classList.contains('ultra-simple')?'Mode Ultra Simple activé.':'Mode complet activé.');});
$('#languageSelect').addEventListener('change',e=>{app.setLocale((e.target as HTMLSelectElement).value);toast('Langue du contexte mise à jour. La traduction complète reste progressive.');});
window.addEventListener('online',async()=>{renderConnectivity();try{await app.syncOutbox();await refreshAll();}catch{}});
window.addEventListener('offline',renderConnectivity);
window.addEventListener('beforeinstallprompt',(e:any)=>{e.preventDefault();deferredInstallPrompt=e;($('#installBtn') as HTMLButtonElement).hidden=false;});
$('#installBtn').addEventListener('click',async()=>{if(deferredInstallPrompt){await deferredInstallPrompt.prompt();deferredInstallPrompt=undefined;($('#installBtn') as HTMLButtonElement).hidden=true;}});

async function start(){
  renderConnectivity();renderKernel();
  try{
    await app.bootstrap({displayName:'Gestionnaire Eco-System',locale:'fr'});
    const catalog=await app.productCatalog();modules=catalog.capabilities;populateWorkspaceModules();renderLotFilters();renderEcosystemHighlights();renderModuleStatuses();
    await refreshAll();await loadWorkspaces();
    if('serviceWorker'in navigator)try{const reg=await navigator.serviceWorker.register('/sw.js?v=master-20260911',{scope:'/'});await reg.update();}catch{}
  }catch(e){fail(e);}
}
void start();
