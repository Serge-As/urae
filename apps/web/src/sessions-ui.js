const byId=id=>document.getElementById(id);
const t=(fr,en)=>document.documentElement.lang==='en'?en:fr;
const money=n=>new Intl.NumberFormat(document.documentElement.lang==='en'?'en-CM':'fr-CM',{maximumFractionDigits:0}).format(Number(n??0))+' F CFA';
const date=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch{return String(v)}};
const day=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'fr-FR',{dateStyle:'long'}).format(new Date(v));}catch{return String(v)}};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const card=(title,cls='panel')=>{const n=el('section',undefined,cls);n.append(el('h2',title));return n;};
const row=(label,value)=>{const n=el('div',undefined,'result-row');n.append(el('span',label),el('strong',value));return n;};
const button=(label,cls='secondary')=>{const b=el('button',label,cls);b.type='button';return b;};
const label=(text,node)=>{const l=el('label',text);l.append(node);return l;};
const meetingAt=m=>m?.scheduledAt??m?.openedAt??m?.createdAt;
const meetingLabel=m=>t('Réunion du ','Meeting on ')+day(meetingAt(m));
const isOpen=m=>m?.status==='open';
const normalizeStatus=s=>String(s??'').toUpperCase();
const statusFr=s=>({PRESENT:'Présent',LATE:'En retard',REPRESENTED:'Représenté',EXCUSED:'Excusé',ABSENT:'Absent'}[String(s)]??String(s??'—'));

export function mountSessionsUI({app,getGroups,getMembers,getMeetings,getRubrics,navigate,openDetail,showError,notify,reloadMeetings}){
  const root=byId('sessionsWorkspace'),select=byId('sessionsMeetingSelect'),timeline=byId('sessionsTimelineStrip');
  let activeTab='overview';

  const context=async()=>{
    const group=getGroups().find(x=>x.id===app.activeGroup()),members=getMembers(),meetings=getMeetings().slice().sort((a,b)=>String(meetingAt(a)).localeCompare(String(meetingAt(b)))),rubrics=getRubrics();
    if(!group)return{group:null,members,meetings,rubrics,me:{isManager:false,membership:null},meeting:null};
    const me=await app.groupMe().catch(()=>({isManager:false,membership:null}));
    const wanted=select?.value,meeting=wanted==='__cumulative__'?null:(meetings.find(x=>x.id===wanted)??meetings.find(x=>x.status==='open')??meetings.at(-1)??null);
    return{group,members,meetings,rubrics,me,meeting,cumulative:wanted==='__cumulative__'};
  };

  const ensurePicker=async()=>{
    if(!select)return;
    const {meetings,meeting}=await context(),before=select.value;
    select.replaceChildren();
    select.append(new Option(t('★ Feuille récapitulative · exercice / cycle','★ Cumulative sheet · exercise / cycle'),'__cumulative__'));
    if(!meetings.length){select.disabled=false;select.value='__cumulative__';return;}
    select.disabled=false;
    for(const m of meetings.filter(x=>x.status!=='cancelled'))select.append(new Option(meetingLabel(m)+' · '+(isOpen(m)?t('ouverte','open'):t('clôturée','closed')),m.id));
    select.value=before==='__cumulative__'||meetings.some(x=>x.id===before)?before:'__cumulative__';
  };

  const renderTimeline=async()=>{
    if(!timeline)return;timeline.replaceChildren();
    const {meetings,meeting}=await context();
    if(!meeting){timeline.append(el('div',t('Aucune séance. Créez la première réunion.','No session. Create the first meeting.'),'empty-state'));return;}
    const index=meetings.findIndex(x=>x.id===meeting.id),previous=index>0?meetings[index-1]:null,next=index>=0&&index<meetings.length-1?meetings[index+1]:null;
    for(const [kind,m] of [[t('Précédente','Previous'),previous],[t('Actuelle','Current'),meeting],[t('Suivante','Next'),next]]){
      const a=el('article',undefined,'session-timeline-card '+(m?.id===meeting.id?'active':''));a.append(el('small',kind),el('strong',m?meetingLabel(m):'—'));
      if(m){a.append(el('span',[m.location,m.theme].filter(Boolean).join(' · ')||t('Contexte à compléter','Context to complete')));a.onclick=()=>{select.value=m.id;void refresh();};}
      timeline.append(a);
    }
  };

  const actions=()=>{const a=el('div',undefined,'actions');const center=button(t('Centre opérationnel','Operational Center'));center.onclick=()=>navigate('operations');const sheets=button(t('Fiches individuelles','Individual sheets'));sheets.onclick=()=>{navigate('operations');setTimeout(()=>byId('individualSheetsViewBtn')?.click(),90);};const members=button(t('Gérer les membres','Manage members'));members.onclick=()=>navigate('members');const rubrics=button(t('Gérer / archiver les rubriques','Manage / archive rubrics'));rubrics.onclick=()=>{navigate('operations');setTimeout(()=>byId('rubricList')?.scrollIntoView({behavior:'smooth',block:'start'}),90);};const recap=button(t('Récap global','Global recap'));recap.onclick=()=>navigate('recap');a.append(center,sheets,members,rubrics,recap);return a;};

  const renderLiveConsensus=async(c)=>{
    const {meeting,me,members,rubrics}=c;if(!meeting||!me.isManager)return null;
    const section=card(t('Saisie live multi-gestionnaires','Multi-manager live entry'),'panel live-consensus-panel');
    section.append(el('p',t('Chaque responsable garde une couleur stable. Si deux saisies divergent, la valeur n’est pas écrasée : le Bureau choisit la bonne donnée. La majorité est retenue, une dissidence maintenue reste en contentieux sans bloquer la séance.','Each manager keeps a stable color. If entries diverge, no value is silently overwritten: managers choose the correct value. The majority is retained and a maintained dissent remains a non-blocking dispute.'),'hint'));
    const form=el('form',undefined,'form-grid'),member=document.createElement('select'),rubric=document.createElement('select'),value=document.createElement('input'),save=button(t('Proposer cette donnée','Submit this value'),'primary');
    member.append(new Option(t('Membre concerné','Affected member'),''));for(const m of members.filter(x=>x.status!=='left'))member.append(new Option(m.displayName,m.id));
    rubric.append(new Option(t('Rubrique','Rubric'),''));for(const r of rubrics.filter(x=>x.status!=='ARCHIVED'))rubric.append(new Option(r.name,r.id));
    value.type='number';value.inputMode='numeric';value.step='1';value.placeholder='0';save.type='submit';
    form.append(label(t('Membre','Member'),member),label(t('Rubrique','Rubric'),rubric),label(t('Valeur','Value'),value),save);section.append(form);
    const list=el('div',undefined,'item-list');
    const draw=async()=>{list.replaceChildren();const items=await app.liveConsensus(meeting.id).catch(()=>[]);
      for(const item of items){const box=el('article',undefined,'item '+(item.state==='RESERVE_OPEN'?'danger':''));
        const title=el('strong',(members.find(x=>x.id===item.membershipId)?.displayName??item.membershipId??item.cellKey)+' · '+(rubrics.find(x=>x.id===item.rubricId)?.name??item.rubricId??''));
        box.append(title,el('small',item.state+(item.selectedValue!==undefined?' · '+t('retenu : ','selected: ')+item.selectedValue:'')));
        const chips=el('div',undefined,'actions');
        for(const p of item.proposals??[]){const b=button((p.label||p.actorId)+' : '+p.value);b.style.borderLeft='8px solid '+p.color;b.style.boxShadow='inset 0 0 0 1px '+p.color;b.onclick=()=>void(async()=>{try{b.disabled=true;await app.voteLiveConsensus(meeting.id,item.cellKey,p.actorId);notify(t('Choix transmis à tous les responsables.','Choice sent to all managers.'));await draw();}catch(e){showError(e);}finally{b.disabled=false;}})();chips.append(b);}
        box.append(chips);
        if(['MAJORITY_SELECTED','RESERVE_OPEN'].includes(item.state)){const reserve=button(t('Maintenir une donnée différente / réserve','Maintain different value / reserve'));reserve.onclick=()=>void(async()=>{const reason=prompt(t('Motif de la réserve :','Reserve reason:'))||'';if(!reason)return;try{await app.reserveLiveConsensus(meeting.id,item.cellKey,reason);notify(t('Réserve enregistrée sans bloquer la séance.','Reserve recorded without blocking the meeting.'));await draw();}catch(e){showError(e);}})();box.append(reserve);}
        if(item.selectedValue!==undefined&&['MAJORITY_SELECTED','UNANIMOUS','RESERVE_OPEN'].includes(item.state)){
          const apply=button(t('Appliquer la valeur retenue','Apply selected value'),'primary');
          apply.onclick=()=>void(async()=>{try{apply.disabled=true;const reason=prompt(t('Motif de l’application / correction :','Reason for applying/correcting:'),t('Valeur retenue après confrontation des gestionnaires','Value selected after manager reconciliation'));if(reason===null)return;const result=await app.applyFinancialCellConsensus(meeting.id,item.cellKey,reason);notify(result?.status==='NO_CHANGE'?t('La valeur canonique était déjà correcte.','Canonical value was already correct.'):t('Valeur canonique corrigée avec traçabilité.','Canonical value corrected with audit trail.'));window.dispatchEvent(new CustomEvent('eco:financial-live-update',{detail:{type:'CONSENSUS_APPLIED',payload:{meetingId:meeting.id,cellKey:item.cellKey,selectedValue:item.selectedValue}}}));await draw();}catch(e){showError(e);}finally{apply.disabled=false;}})();box.append(apply);
        }
        list.append(box);
      }if(!items.length)list.append(el('div',t('Aucune divergence ou saisie live pour cette séance.','No live entry or divergence for this meeting.'),'empty-state'));
    };
    form.onsubmit=e=>void(async()=>{e.preventDefault();try{if(!member.value||!rubric.value||value.value==='')throw Error(t('Choisissez le membre, la rubrique et la valeur.','Choose member, rubric and value.'));save.disabled=true;const cellKey=member.value+':'+rubric.value;await app.submitLiveConsensus(meeting.id,{cellKey,value:Number(value.value),membershipId:member.value,rubricId:rubric.value});notify(t('Saisie live transmise.','Live entry sent.'));value.value='';await draw();}catch(err){showError(err);}finally{save.disabled=false;}})();
    section.append(list);await draw();return section;
  };

  const renderOverview=async(c)=>{
    const {group,meeting,meetings,members,me}=c;if(!meeting)return card(t('Vue d’ensemble','Overview')).appendChild(el('div',t('Aucune séance disponible.','No session available.'),'empty-state')).parentNode;
    const section=card(meetingLabel(meeting));
    const grid=el('div',undefined,'metrics small');
    const fields=[
      [t('Date','Date'),date(meetingAt(meeting))],
      [t('Exercice / cycle','Exercise / cycle'),group.currentExerciseLabel??group.launchProfileSnapshot?.cycle?.label??t('À compléter','To complete')],
      [t('Lieu / canal','Location / channel'),meeting.location??t('À compléter','To complete')],
      [t('Thème','Theme'),meeting.theme??t('À compléter','To complete')],
      [t('Tenue','Dress code'),meeting.dressCode??t('À compléter','To complete')],
      [t('État','Status'),isOpen(meeting)?t('Ouverte','Open'):t('Clôturée','Closed')]
    ];
    for(const [l,v] of fields){const m=el('div',undefined,'metric');m.append(el('span',l),el('strong',v));grid.append(m);}section.append(grid);

    const [attendance,beneficiaries]=await Promise.all([app.meetingAttendance(meeting.id).catch(()=>[]),app.meetingBeneficiaries(meeting.id).catch(()=>[])]);
    const present=attendance.filter(x=>['PRESENT','LATE','REPRESENTED'].includes(normalizeStatus(x.data?.attendance))).length;
    const quick=el('div',undefined,'metrics small');
    for(const [n,l] of [[attendance.length,t('Présences renseignées','Attendance recorded')],[present,t('Présents / représentés','Present / represented')],[beneficiaries.length,t('Bénéficiaires déclarés','Declared beneficiaries')]]){
      const m=el('div',undefined,'metric');m.append(el('strong',n),el('span',l));quick.append(m);
    }section.append(quick);

    if(me.isManager){
      const [ledger,cashboxes,expenses]=await Promise.all([app.ledger().catch(()=>({receipts:[]})),app.cashboxReconciliations().catch(()=>[]),app.expenses({meetingId:meeting.id}).catch(()=>[])]);
      const receipts=(ledger.receipts??[]).filter(x=>x.meetingId===meeting.id),latest=cashboxes.filter(x=>x.meetingId===meeting.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
      const inflow=receipts.reduce((n,x)=>n+Number(x.netAmount??0),0),outflow=expenses.reduce((n,x)=>n+Number(x.amount??x.data?.amount??0),0);
      const fin=el('div',undefined,'metrics small');
      const vals=latest?[
        [latest.snapshot.openingCash,t('Solde début','Opening cash')],
        [latest.snapshot.cashIn,t('Recettes séance','Session inflows')],
        [latest.snapshot.cashOut,t('Dépenses séance','Session outflows')],
        [latest.snapshot.theoreticalClosing,t('Solde clôture','Closing cash')]
      ]:[[null,t('Solde début','Opening cash')],[inflow,t('Recettes Ledger','Ledger inflows')],[outflow,t('Dépenses enregistrées','Recorded outflows')],[null,t('Solde clôture','Closing cash')]];
      for(const [n,l] of vals){const m=el('div',undefined,'metric');m.append(el('span',l),el('strong',n===null?t('À rapprocher','To reconcile'):money(n)));fin.append(m);}section.append(fin);
    }else if(me.membership?.id){
      const sheet=await app.memberOperationalSheet(me.membership.id).catch(()=>null),r=sheet?.exerciseMatrix?.find(x=>x.meetingId===meeting.id);
      const own=el('div',undefined,'truth-notice');own.textContent=t('Votre situation pour cette séance : ','Your position for this session: ')+(r?money(r.total):t('aucun mouvement connu','no known movement'));section.append(own);
    }
    if(me.isManager){
      const finish=card(t('Fin de séance · rapprocher puis diffuser','End of session · reconcile then distribute'),'panel session-finish-panel');
      finish.append(el('p',t('Étape 1 : les gestionnaires confrontent uniquement les différences. Étape 2 : après accord, la diffusion aux membres est une action séparée pour éviter une erreur.','Step 1: managers compare differences only. Step 2: after agreement, member distribution is a separate action to prevent mistakes.'),'hint'));
      const finishActions=el('div',undefined,'actions');
      const reconcile=button(t('1 · Confronter les données entre gestionnaires','1 · Reconcile manager data'),'primary');
      reconcile.onclick=()=>void(async()=>{await refresh();setTimeout(()=>document.querySelector('.live-consensus-panel')?.scrollIntoView({behavior:'smooth',block:'start'}),40);notify(t('Confrontation ouverte : seules les divergences demandent une décision.','Reconciliation opened: only divergences require a decision.'));})();
      const distribute=button(t('2 · Diffuser aux membres','2 · Distribute to members'),'secondary');
      distribute.onclick=()=>void(async()=>{try{distribute.disabled=true;const r=await app.distributeMeetingSummary(meeting.id);notify(r.queued?t('Diffusion enregistrée hors ligne. Elle partira à la reconnexion.','Distribution saved offline. It will be sent on reconnection.'):t('Diffusion validée : les membres peuvent actualiser leur situation.','Distribution validated: members can refresh their position.'));}catch(e){showError(e);}finally{distribute.disabled=false;}})();
      finishActions.append(reconcile,distribute);finish.append(finishActions);
      const live=await renderLiveConsensus(c);if(live)finish.append(live);section.append(finish);
    }section.append(actions());return section;
  };

  const renderSheet=async(c)=>{
    const {meeting,me,members,rubrics}=c,section=card(t('Feuille de séance','Meeting sheet'));if(!meeting){section.append(el('div',t('Aucune séance.','No session.'),'empty-state'));return section;}
    if(!me.isManager){
      if(!me.membership?.id){section.append(el('div',t('Aucune fiche accessible.','No accessible sheet.'),'empty-state'));return section;}
      const sheet=await app.memberOperationalSheet(me.membership.id).catch(()=>null),mr=sheet?.exerciseMatrix?.find(x=>x.meetingId===meeting.id);
      if(!mr){section.append(el('div',t('Aucun mouvement pour cette séance.','No movement for this session.'),'empty-state'));return section;}
      const table=el('table',undefined,'meeting-matrix sessions-read-table'),head=el('thead'),hr=el('tr');hr.append(el('th',t('Rubrique','Rubric')),el('th',t('Entrées','Inflows')),el('th',t('Sorties','Outflows')),el('th','Net'));head.append(hr);table.append(head);const body=el('tbody');
      let tin=0,tout=0,tnet=0;for(const r of sheet.rubrics??[]){const cell=mr.cells?.[r.id]??{inflow:0,outflow:0,net:0};tin+=Number(cell.inflow??0);tout+=Number(cell.outflow??0);tnet+=Number(cell.net??0);const tr=el('tr');tr.append(el('td',r.name),el('td',money(cell.inflow)),el('td',money(cell.outflow)),el('td',money(cell.net)));body.append(tr);}const totalRow=el('tr',undefined,'table-total-row');totalRow.append(el('th',t('TOTAL','TOTAL')),el('td',money(tin)),el('td',money(tout)),el('td',money(tnet)));body.append(totalRow);table.append(body);const wrap=el('div',undefined,'matrix-wrap');wrap.append(table);section.append(wrap);return section;
    }
    const [ledger,expenses,events]=await Promise.all([app.ledger(),app.expenses({meetingId:meeting.id}).catch(()=>[]),app.listWorkspaceRecords('FINANCE.SHEET_EVENT',app.activeGroup()).catch(()=>[])]);
    const table=el('table',undefined,'meeting-matrix sessions-read-table'),head=el('thead'),hr=el('tr');hr.append(el('th',t('Membre','Member')));for(const r of rubrics.filter(x=>x.status!=='ARCHIVED'))hr.append(el('th',r.name));hr.append(el('th','Total'));head.append(hr);table.append(head);const body=el('tbody');
    for(const m of members.filter(x=>x.status!=='left')){const tr=el('tr'),name=el('th',m.displayName);tr.append(name);let total=0;
      for(const r of rubrics.filter(x=>x.status!=='ARCHIVED')){
        const receiptIn=(ledger.receipts??[]).filter(x=>x.meetingId===meeting.id&&x.membershipId===m.id&&x.rubricId===r.id).reduce((n,x)=>n+Number(x.netAmount??0),0);
        const eventIn=events.filter(x=>x.data?.meetingId===meeting.id&&x.data?.membershipId===m.id&&x.data?.rubricId===r.id&&x.data?.direction==='IN').reduce((n,x)=>n+Number(x.data?.amount??0),0);
        const eventOut=events.filter(x=>x.data?.meetingId===meeting.id&&x.data?.membershipId===m.id&&x.data?.rubricId===r.id&&x.data?.direction==='OUT').reduce((n,x)=>n+Number(x.data?.amount??0),0);
        const exp=expenses.filter(x=>x.membershipId===m.id&&x.rubricId===r.id).reduce((n,x)=>n+Number(x.amount??0),0),net=receiptIn+eventIn-eventOut-exp;total+=net;tr.append(el('td',money(net)));
      }tr.append(el('td',money(total)));body.append(tr);
    }table.append(body);const wrap=el('div',undefined,'matrix-wrap');wrap.append(table);section.append(el('p',t('Ce tableau projette les mêmes écritures canoniques que les deux feuilles. La saisie/correction reste dans le composant canonique pour éviter deux éditeurs concurrents.','This table projects the same canonical records as the two sheets. Entry/correction stays in the canonical component to avoid two competing editors.'),'hint'),wrap);
    const edit=button(t('Saisir / corriger cette séance dans la feuille canonique','Enter / correct this meeting in the canonical sheet'),'primary');edit.onclick=()=>{window.dispatchEvent(new CustomEvent('eco:set-matrix-meeting',{detail:{meetingId:meeting.id}}));navigate('operations',{anchor:'twoSheetWorkspace',matrixMeetingId:meeting.id,sheetMode:'meeting',force:true});};
    const other=button(t('Choisir une autre séance','Choose another meeting'));other.onclick=()=>select?.scrollIntoView({behavior:'smooth',block:'center'});
    const add=button(t('+ Nouvelle séance','+ New meeting'));add.onclick=()=>byId('sessionsCreateForm')?.scrollIntoView({behavior:'smooth',block:'start'});
    section.append(edit,other,add);return section;
  };

  const renderCumulative=async(c)=>{
    const {group,me,members,rubrics,meetings}=c,section=card(t('Feuille de saisie récapitulative · exercice / cycle','Cumulative entry sheet · exercise / cycle'));
    section.append(el('p',t('Cette feuille reprend les données déjà enregistrées des séances précédentes. Elle ne crée pas une seconde comptabilité : elle projette le Ledger canonique et sert de point d’entrée vers la saisie/correction autorisée.','This sheet carries forward data already recorded in previous sessions. It does not create a second accounting system: it projects the canonical Ledger and is an entry point to authorized entry/correction.'),'hint'));
    const ident=el('div',undefined,'metrics small');
    for(const [l,v] of [[t('Nom du groupe','Group name'),group?.name??'—'],[t('Code plateforme','Platform code'),group?.code??group?.id??'—'],[t('Date du jour / heure','Current date / time'),date(new Date().toISOString())],[t('Nombre de membres','Members'),members.filter(x=>x.status!=='left').length],[t('Exercice / cycle','Exercise / cycle'),group?.currentExerciseLabel??group?.launchProfileSnapshot?.cycle?.label??t('À compléter','To complete')]]){const m=el('div',undefined,'metric');m.append(el('span',l),el('strong',v));ident.append(m);}section.append(ident);
    if(!me.isManager){section.append(el('div',t('La feuille générale récapitulative est réservée aux responsables. Votre fiche individuelle reste disponible.','The cumulative group sheet is restricted to managers. Your individual sheet remains available.'),'empty-state'));return section;}
    const ledger=await app.ledger().catch(()=>({receipts:[]})),receipts=ledger.receipts??[],activeRubrics=rubrics.filter(x=>x.status!=='ARCHIVED'),activeMembers=members.filter(x=>x.status!=='left');
    if(!activeMembers.length||!activeRubrics.length){section.append(el('div',t('Ajoutez au moins un membre et une rubrique pour générer la feuille.','Add at least one member and one rubric to generate the sheet.'),'empty-state'));return section;}
    const wrap=el('div',undefined,'matrix-wrap'),table=el('table',undefined,'meeting-matrix sessions-read-table'),head=el('thead'),hr=el('tr');hr.append(el('th',t('Membre','Member')));for(const r of activeRubrics)hr.append(el('th',r.name));hr.append(el('th',t('Total exercice','Exercise total')));head.append(hr);table.append(head);const body=el('tbody');
    for(const m of activeMembers){const tr=el('tr'),name=el('th',m.displayName);tr.append(name);let total=0;for(const r of activeRubrics){const amount=receipts.filter(x=>x.membershipId===m.id&&x.rubricId===r.id).reduce((n,x)=>n+Number(x.netAmount??0),0);total+=amount;const td=el('td');const b=button(money(amount),'matrix-cell');b.title=t('Ouvrir les fiches individuelles avant de corriger une séance précise','Open individual sheets before correcting a specific meeting');b.onclick=()=>navigate('operations',{anchor:'twoSheetWorkspace',sheetMode:'individual',force:true});td.append(b);tr.append(td);}tr.append(el('td',money(total)));body.append(tr);}
    const totalRow=el('tr',undefined,'table-total-row');totalRow.append(el('th',t('TOTAL','TOTAL')));let grand=0;for(const r of activeRubrics){const amount=receipts.filter(x=>x.rubricId===r.id).reduce((n,x)=>n+Number(x.netAmount??0),0);grand+=amount;totalRow.append(el('td',money(amount)));}totalRow.append(el('td',money(grand)));body.append(totalRow);table.append(body);wrap.append(table);section.append(wrap);
    const sessions=el('div',undefined,'stack');sessions.append(el('h3',t('Séances déjà intégrées','Sessions already included')));for(const m of meetings.slice().sort((a,b)=>String(meetingAt(a)).localeCompare(String(meetingAt(b))))){const n=receipts.filter(x=>x.meetingId===m.id).reduce((s,x)=>s+Number(x.netAmount??0),0);sessions.append(row(meetingLabel(m),money(n)));}section.append(sessions);
    const actionsBox=el('div',undefined,'actions'),individual=button(t('Fiches individuelles','Individual sheets')),rubric=button(t('Autres · configuration des rubriques','Other · rubric configuration'));individual.onclick=()=>{navigate('operations');setTimeout(()=>byId('individualSheetsViewBtn')?.click(),80);};rubric.onclick=()=>{navigate('operations');setTimeout(()=>byId('rubricList')?.scrollIntoView({behavior:'smooth',block:'start'}),80);};actionsBox.append(individual,rubric);section.append(actionsBox);return section;
  };

  const renderAttendance=async(c)=>{
    const {meeting,me,members}=c,section=card(t('Présences','Attendance'));if(!meeting){section.append(el('div',t('Aucune séance.','No session.'),'empty-state'));return section;}
    const rows=await app.meetingAttendance(meeting.id).catch(()=>[]),byMember=new Map(rows.map(x=>[String(x.data?.membershipId??''),x]));
    if(!me.isManager){const own=rows.find(x=>String(x.data?.membershipId??'')===String(me.membership?.id??''));section.append(row(t('Ma présence','My attendance'),own?statusFr(own.data?.attendance):t('Non renseignée','Not recorded')));if(own?.data?.note)section.append(row(t('Observation','Note'),own.data.note));return section;}
    const wrap=el('div',undefined,'matrix-wrap'),table=el('table',undefined,'meeting-matrix attendance-table'),head=el('thead'),hr=el('tr');for(const h of [t('Membre','Member'),t('Présence','Attendance'),t('Observation','Note'),t('Action','Action')])hr.append(el('th',h));head.append(hr);table.append(head);const body=el('tbody');
    for(const m of members.filter(x=>x.status!=='left')){const existing=byMember.get(m.id),tr=el('tr'),state=document.createElement('select');for(const [v,l] of [['PRESENT',t('Présent','Present')],['LATE',t('En retard','Late')],['REPRESENTED',t('Représenté','Represented')],['EXCUSED',t('Excusé','Excused')],['ABSENT',t('Absent','Absent')]])state.append(new Option(l,v));state.value=String(existing?.data?.attendance??'PRESENT');const note=document.createElement('input');note.value=String(existing?.data?.note??'');note.placeholder=t('Observation','Note');const save=button(existing?t('Mettre à jour','Update'):t('Enregistrer','Save'));save.onclick=()=>void(async()=>{try{save.disabled=true;await app.recordMeetingAttendance(meeting.id,{membershipId:m.id,attendance:state.value,note:note.value.trim()||undefined});notify(t('Présence enregistrée.','Attendance saved.'));await refresh();}catch(e){showError(e);}finally{save.disabled=false;}})();for(const n of [el('td',m.displayName),el('td'),el('td'),el('td')])tr.append(n);tr.children[1].append(state);tr.children[2].append(note);tr.children[3].append(save);body.append(tr);}table.append(body);wrap.append(table);section.append(el('p',t('Le Bureau renseigne la présence via MeetingService. Ce chemin remplace l’ancien doublon de workspace générique.','Managers record attendance through MeetingService. This path replaces the old generic-workspace duplicate.'),'hint'),wrap);return section;
  };

  const renderBeneficiaries=async(c)=>{
    const {meeting,me,members,rubrics}=c,section=card(t('Bénéficiaires & preuves de réception','Beneficiaries & receipt evidence'));if(!meeting){section.append(el('div',t('Aucune séance.','No session.'),'empty-state'));return section;}
    const [declarations,evidences]=await Promise.all([app.meetingBeneficiaries(meeting.id).catch(()=>[]),app.meetingBenefitEvidence(meeting.id).catch(()=>[])]),byDeclaration=new Map(evidences.map(x=>[String(x.data?.declarationId??''),x]));
    if(me.isManager){
      const form=el('form',undefined,'form-grid'),member=document.createElement('select'),rubric=document.createElement('select'),amount=document.createElement('input'),note=document.createElement('input'),submit=button(t('Déclarer le bénéficiaire','Declare beneficiary'),'primary');
      member.append(new Option(t('Choisir…','Choose…'),''));for(const m of members.filter(x=>x.status!=='left'))member.append(new Option(m.displayName,m.id));rubric.append(new Option(t('Sans rubrique spécifique','No specific rubric'),''));for(const r of rubrics.filter(x=>x.status!=='ARCHIVED'))rubric.append(new Option(r.name,r.id));amount.type='number';amount.min='0';amount.step='1';amount.inputMode='numeric';note.placeholder=t('Motif / contexte','Reason / context');submit.type='submit';form.append(label(t('Bénéficiaire','Beneficiary'),member),label(t('Rubrique','Rubric'),rubric),label(t('Montant XAF','Amount XAF'),amount),label(t('Motif','Reason'),note),submit);
      form.onsubmit=e=>void(async()=>{e.preventDefault();try{const n=Number(amount.value);if(!member.value||!Number.isSafeInteger(n)||n<0)throw Error(t('Bénéficiaire et montant valides requis.','Valid beneficiary and amount required.'));submit.disabled=true;await app.declareMeetingBeneficiary(meeting.id,{membershipId:member.value,rubricId:rubric.value||undefined,amount:n,currency:'XAF',note:note.value.trim()||undefined});notify(t('Bénéficiaire déclaré.','Beneficiary declared.'));await refresh();}catch(err){showError(err);}finally{submit.disabled=false;}})();section.append(form);
    }
    const list=el('div',undefined,'stack');
    for(const d of declarations){const evidence=byDeclaration.get(d.id),item=el('article',undefined,'item'),name=d.displayName??members.find(x=>x.id===d.data?.membershipId)?.displayName??t('Membre','Member'),rubric=rubrics.find(x=>x.id===d.data?.rubricId)?.name??t('Sans rubrique','No rubric');item.append(el('strong',name+' · '+rubric),row(t('Montant','Amount'),money(d.data?.amount)),row(t('Code de réception','Receipt code'),d.data?.proofCode??'—'),row(t('État','Status'),evidence?t('Réception prouvée','Receipt evidenced'):t('Preuve en attente','Evidence pending')));
      if(evidence){item.append(row(t('Mode','Method'),evidence.data?.method??'—'),row(t('Date preuve','Evidence date'),date(evidence.createdAt)));}
      else{
        const acts=el('div',undefined,'actions'),own=String(d.data?.membershipId??'')===String(me.membership?.id??'');
        if(own){const confirm=button(t('Je confirme avoir reçu','I confirm receipt'),'primary');confirm.onclick=()=>void(async()=>{try{confirm.disabled=true;await app.recordMeetingBenefitEvidence(meeting.id,{declarationId:d.id,membershipId:String(d.data.membershipId),rubricId:d.data.rubricId?String(d.data.rubricId):undefined,amount:Number(d.data.amount??0),currency:String(d.data.currency??'XAF'),method:'MEMBER_CONFIRMATION',idempotencyKey:'session-ui:'+d.id+':self'});notify(t('Réception confirmée.','Receipt confirmed.'));await refresh();}catch(e){showError(e);}finally{confirm.disabled=false;}})();acts.append(confirm);}
        if(me.isManager){const paper=button(t('Émargement papier reçu','Paper signature received'));paper.onclick=()=>void(async()=>{try{paper.disabled=true;await app.recordMeetingBenefitEvidence(meeting.id,{declarationId:d.id,membershipId:String(d.data.membershipId),rubricId:d.data.rubricId?String(d.data.rubricId):undefined,amount:Number(d.data.amount??0),currency:String(d.data.currency??'XAF'),method:'PAPER_EMARGEMENT',note:t('Émargement papier constaté par un responsable habilité.','Paper signature observed by authorized manager.'),idempotencyKey:'session-ui:'+d.id+':paper'});await refresh();}catch(e){showError(e);}finally{paper.disabled=false;}})();const file=document.createElement('input');file.type='file';file.accept='image/*,.pdf';const upload=button(t('Joindre photo / PDF','Attach photo / PDF'));upload.onclick=()=>void(async()=>{try{const f=file.files?.[0];if(!f)throw Error(t('Choisissez un fichier.','Choose a file.'));upload.disabled=true;const saved=await app.uploadMeetingBenefitEvidence(meeting.id,f);await app.recordMeetingBenefitEvidence(meeting.id,{declarationId:d.id,membershipId:String(d.data.membershipId),rubricId:d.data.rubricId?String(d.data.rubricId):undefined,amount:Number(d.data.amount??0),currency:String(d.data.currency??'XAF'),method:'PHOTO_DOCUMENT',artifactKey:saved.artifactKey,fingerprint:saved.fingerprint,note:t('Preuve documentaire téléversée.','Document evidence uploaded.'),idempotencyKey:'session-ui:'+d.id+':photo:'+saved.fingerprint});await refresh();}catch(e){showError(e);}finally{upload.disabled=false;}})();acts.append(paper,file,upload);}if(acts.childElementCount)item.append(acts);
      }list.append(item);
    }if(!declarations.length)list.append(el('div',t('Aucun bénéficiaire déclaré.','No beneficiary declared.'),'empty-state'));section.append(el('p',t('Une preuve est liée à groupe + séance + rubrique + membre + déclaration. Le code ECO-RCP identifie la preuve mais n’accorde aucun droit.','Evidence is linked to group + session + rubric + member + declaration. The ECO-RCP code identifies evidence but grants no right.'),'hint'),list);return section;
  };

  const renderRecap=async(c)=>{
    const {meeting,me}=c,section=card(t('Récap & caisse','Recap & cashbox'));if(!meeting){section.append(el('div',t('Aucune séance.','No session.'),'empty-state'));return section;}
    if(!me.isManager){section.append(el('p',t('Le Récap global de caisse est réservé aux responsables. Votre fiche individuelle reste accessible dans « Feuille de séance ».','The global cash recap is restricted to managers. Your individual sheet remains available under “Meeting sheet”.'),'hint'));return section;}
    const [ledger,cashboxes,expenses]=await Promise.all([app.ledger(),app.cashboxReconciliations().catch(()=>[]),app.expenses({meetingId:meeting.id}).catch(()=>[])]);
    const receipts=(ledger.receipts??[]).filter(x=>x.meetingId===meeting.id),latest=cashboxes.filter(x=>x.meetingId===meeting.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0],receiptIn=receipts.reduce((n,x)=>n+Number(x.netAmount??0),0),expenseOut=expenses.reduce((n,x)=>n+Number(x.amount??0),0);
    if(latest){for(const [l,n] of [[t('Solde début','Opening cash'),latest.snapshot.openingCash],[t('Recettes','Inflows'),latest.snapshot.cashIn],[t('Dépenses','Outflows'),latest.snapshot.cashOut],[t('Solde théorique','Theoretical closing'),latest.snapshot.theoreticalClosing],[t('Compté','Counted cash'),latest.snapshot.countedClosing],[t('Écart','Variance'),latest.snapshot.variance]])section.append(row(l,money(n)));section.append(row(t('Statut rapprochement','Reconciliation status'),latest.status));}
    else{section.append(row(t('Solde début','Opening cash'),t('À rapprocher','To reconcile')),row(t('Recettes Ledger connues','Known Ledger inflows'),money(receiptIn)),row(t('Dépenses enregistrées','Recorded outflows'),money(expenseOut)),row(t('Solde clôture','Closing cash'),t('À rapprocher','To reconcile')));}
    const form=el('form',undefined,'form-grid'),opening=document.createElement('input'),cashIn=document.createElement('input'),cashOut=document.createElement('input'),counted=document.createElement('input'),save=button(t('Rapprocher cette séance','Reconcile this session'),'primary');for(const i of [opening,cashIn,cashOut,counted]){i.type='number';i.min='0';i.step='1';i.inputMode='numeric';}opening.value=String(latest?.snapshot?.openingCash??0);cashIn.value=String(latest?.snapshot?.cashIn??receiptIn);cashOut.value=String(latest?.snapshot?.cashOut??expenseOut);counted.value=String(latest?.snapshot?.countedClosing??0);save.type='submit';form.append(label(t('Ouverture','Opening'),opening),label(t('Entrées','Inflows'),cashIn),label(t('Sorties','Outflows'),cashOut),label(t('Compté physiquement','Counted cash'),counted),save);form.onsubmit=e=>void(async()=>{e.preventDefault();try{save.disabled=true;await app.reconcileCashbox({openingCash:Number(opening.value),cashIn:Number(cashIn.value),cashOut:Number(cashOut.value),countedClosing:Number(counted.value),meetingId:meeting.id});notify(t('Rapprochement enregistré.','Reconciliation saved.'));await refresh();}catch(err){showError(err);}finally{save.disabled=false;}})();section.append(form);const go=button(t('Ouvrir Récap global','Open global recap'));go.onclick=()=>navigate('recap');section.append(go);return section;
  };

  const renderDebts=async(c)=>{
    const {me,members}=c,section=card(me.isManager?t('Dettes complètes du groupe','Complete group debts'):t('Ma dette complète','My complete debt'));
    const [arrears,loans]=await Promise.all([app.arrears().catch(()=>[]),app.listCompletion('LOAN').catch(()=>[])]);
    const visibleMembers=me.isManager?members.filter(x=>x.status!=='left'):members.filter(x=>x.id===me.membership?.id),rows=[];
    for(const m of visibleMembers){
      const memberLoans=loans.filter(x=>String(x.data?.borrowerMembershipId??'')===m.id&&['DISBURSED','REPAYING'].includes(String(x.data?.completionState??'')));
      const principal=memberLoans.reduce((n,x)=>n+Number(x.data?.outstandingPrincipal??0),0),interest=memberLoans.reduce((n,x)=>n+Number(x.data?.unpaidInterest??0),0);
      const memberArrears=arrears.filter(x=>x.assigneeId===m.userId&&Number(x.outstanding??0)>0);
      const fines=memberArrears.filter(x=>/amende|pénalit|penalt|fine/i.test(String(x.title??''))).reduce((n,x)=>n+Number(x.outstanding??0),0);
      const other=memberArrears.filter(x=>!/amende|pénalit|penalt|fine/i.test(String(x.title??''))).reduce((n,x)=>n+Number(x.outstanding??0),0);
      const total=principal+interest+fines+other;if(total>0)rows.push({member:m,principal,interest,fines,other,total,memberLoans,memberArrears});
    }
    section.append(el('p',t('Dette = capital restant des prêts + intérêts dus + amendes/pénalités + autres obligations/impayés. Un prêt décaissé est une sortie de caisse du groupe (rubrique négative), tandis que le capital restant devient une créance sur le membre.','Debt = outstanding loan principal + due interest + fines/penalties + other obligations/arrears. A disbursed loan is a cash outflow for the group (negative rubric), while outstanding principal becomes a receivable from the member.'),'truth-notice'));
    if(!rows.length){section.append(el('div',t('Aucune dette ouverte connue.','No known open debt.'),'empty-state'));return section;}
    const wrap=el('div',undefined,'matrix-wrap'),table=el('table',undefined,'meeting-matrix'),head=el('thead'),hr=el('tr');for(const h of [t('Membre','Member'),t('Capital prêts','Loan principal'),t('Intérêts','Interest'),t('Amendes','Fines'),t('Autres impayés','Other arrears'),t('Dette totale','Total debt')])hr.append(el('th',h));head.append(hr);table.append(head);const body=el('tbody');
    for(const d of rows){const tr=el('tr');tr.append(el('td',d.member.displayName),el('td',money(d.principal)),el('td',money(d.interest)),el('td',money(d.fines)),el('td',money(d.other)),el('td',money(d.total)));body.append(tr);}
    const totals=rows.reduce((a,d)=>({principal:a.principal+d.principal,interest:a.interest+d.interest,fines:a.fines+d.fines,other:a.other+d.other,total:a.total+d.total}),{principal:0,interest:0,fines:0,other:0,total:0}),totalRow=el('tr',undefined,'table-total-row');totalRow.append(el('th',t('TOTAL','TOTAL')),el('td',money(totals.principal)),el('td',money(totals.interest)),el('td',money(totals.fines)),el('td',money(totals.other)),el('td',money(totals.total)));body.append(totalRow);table.append(body);wrap.append(table);section.append(wrap);
    const details=el('details');details.append(el('summary',t('Voir le détail des prêts et impayés','View loan and arrears details')));const list=el('div',undefined,'stack');for(const d of rows){const box=el('article',undefined,'item');box.append(el('strong',d.member.displayName));for(const loan of d.memberLoans)box.append(row(t('Prêt','Loan')+' · '+(loan.title??loan.id),money(Number(loan.data?.outstandingPrincipal??0)+Number(loan.data?.unpaidInterest??0))));for(const a of d.memberArrears)box.append(row(a.title??t('Impayé','Arrear'),money(a.outstanding??0)));list.append(box);}details.append(list);section.append(details);return section;
  };

  const renderSchedule=async(c)=>{
    const {meeting,meetings,members,rubrics,me}=c,section=card(t('Classements & programmation','Rankings & schedule'));if(!meeting){section.append(el('div',t('Aucune séance.','No session.'),'empty-state'));return section;}
    const index=meetings.findIndex(x=>x.id===meeting.id),windows=[meetings[index-1],meeting,meetings[index+1]].filter(Boolean),shares=await app.listCompletion('TONTINE_SHARE').catch(()=>[]);
    const grid=el('div',undefined,'three-col');
    for(const m of windows){const b=el('article',undefined,'item');b.append(el('strong',m.id===meeting.id?t('Séance actuelle','Current session'):meetingLabel(m)),el('p',meetingLabel(m)),el('p',[m.location,m.theme,m.dressCode].filter(Boolean).join(' · ')||t('Lieu / thème / tenue à compléter','Location / theme / dress to complete'),'hint'));const declarations=await app.meetingBeneficiaries(m.id).catch(()=>[]);if(declarations.length){const ul=el('ul');for(const d of declarations){const member=members.find(x=>x.id===d.data?.membershipId),rubric=rubrics.find(x=>x.id===d.data?.rubricId);ul.append(el('li',(member?.displayName??d.displayName??t('Membre','Member'))+' · '+(rubric?.name??t('Bénéfice','Benefit'))+' · '+money(d.data?.amount)));}b.append(ul);}else b.append(el('p',t('Aucun bénéficiaire déclaré.','No beneficiary declared.'),'hint'));grid.append(b);}section.append(grid);
    const scheduled=shares.filter(x=>['SCHEDULED','SERVED'].includes(String(x.data?.completionState??''))).sort((a,b)=>Number(a.data?.scheduledRound??999)-Number(b.data?.scheduledRound??999)||Number(a.data?.scheduledSlot??999)-Number(b.data?.scheduledSlot??999));if(scheduled.length){const wrap=el('div',undefined,'matrix-wrap'),table=el('table',undefined,'meeting-matrix'),head=el('thead'),hr=el('tr');for(const h of [t('Tour','Round'),t('Position','Slot'),t('Bénéficiaire','Beneficiary'),t('État','Status')])hr.append(el('th',h));head.append(hr);table.append(head);const body=el('tbody');for(const sh of scheduled){const tr=el('tr'),member=members.find(x=>x.id===String(sh.data?.membershipId??''));tr.append(el('td',sh.data?.scheduledRound??'—'),el('td',sh.data?.scheduledSlot??'—'),el('td',member?.displayName??sh.title),el('td',sh.data?.completionState??'—'));body.append(tr);}table.append(body);wrap.append(table);section.append(el('h3',t('Classement Tontines','Tontine schedule')),wrap);}if(me.isManager){const go=button(t('Gérer le classement dans Tontines','Manage schedule in Tontines'));go.onclick=()=>navigate('tontines');section.append(go);}return section;
  };

  const renderHistory=async(c)=>{
    const {meeting,me,members,rubrics}=c,section=card(t('Historique métier de la séance','Session business history'));if(!meeting){section.append(el('div',t('Aucune séance.','No session.'),'empty-state'));return section;}
    const [attendance,beneficiaries,evidence,minutes,actions]=await Promise.all([
      app.meetingAttendance(meeting.id).catch(()=>[]),app.meetingBeneficiaries(meeting.id).catch(()=>[]),app.meetingBenefitEvidence(meeting.id).catch(()=>[]),
      app.listWorkspaceRecords('MEETING.MINUTES',app.activeGroup()).catch(()=>[]),app.listWorkspaceRecords('MEETING.ACTIONS',app.activeGroup()).catch(()=>[])
    ]);
    const list=el('div',undefined,'stack');
    for(const x of attendance){const m=members.find(v=>v.id===String(x.data?.membershipId??''));const a=el('article',undefined,'item');a.append(el('strong',t('Présence · ','Attendance · ')+(m?.displayName??x.displayName??'—')),el('p',statusFr(x.data?.attendance)),el('small',date(x.updatedAt??x.createdAt)));list.append(a);}
    for(const d of beneficiaries){const m=members.find(v=>v.id===String(d.data?.membershipId??'')),r=rubrics.find(v=>v.id===String(d.data?.rubricId??''));const a=el('article',undefined,'item');a.append(el('strong',t('Bénéficiaire · ','Beneficiary · ')+(m?.displayName??d.displayName??'—')),el('p',(r?.name??t('Sans rubrique','No rubric'))+' · '+money(d.data?.amount)+' · '+String(d.data?.proofCode??'')),el('small',date(d.updatedAt??d.createdAt)));list.append(a);}
    for(const e of evidence){const a=el('article',undefined,'item');a.append(el('strong',t('Preuve de réception','Receipt evidence')),el('p',String(e.data?.method??'—')+' · '+String(e.data?.proofCode??'—')),el('small',date(e.createdAt)));list.append(a);}
    for(const w of [...minutes,...actions].filter(x=>String(x.data?.meetingId??'')===meeting.id)){const a=el('article',undefined,'item');a.append(el('strong',w.title),el('p',w.summary??''),el('small',date(w.updatedAt)));list.append(a);}
    if(!list.childElementCount)list.append(el('div',t('Aucun événement métier visible pour cette séance.','No visible business event for this session.'),'empty-state'));section.append(list,el('p',t('Cette vue est un historique métier lisible. L’audit serveur reste l’autorité de preuve lorsqu’une opération critique est contestée.','This is a readable business history. Server audit remains the evidence authority when a critical operation is disputed.'),'hint'));if(openDetail){const b=button(t('Ouvrir la fiche détaillée','Open detailed record'));b.onclick=()=>openDetail('meeting',meeting.id);section.append(b);}return section;
  };

  const renderTab=async()=>{
    if(!root)return;root.replaceChildren();const c=await context();if(!c.group){root.append(el('div',t('Sélectionnez un groupe.','Select a group.'),'empty-state'));return;}
    if(c.cumulative){
      activeTab='cumulative';byId('sessionsTabs')?.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.sessionTab==='cumulative'));
      try{root.append(await renderCumulative(c));}catch(e){showError(e);}return;
    }
    const fn={overview:renderOverview,sheet:renderSheet,cumulative:renderCumulative,attendance:renderAttendance,beneficiaries:renderBeneficiaries,recap:renderRecap,debts:renderDebts,schedule:renderSchedule,history:renderHistory}[activeTab]??renderOverview;
    try{
      if(c.meeting&&c.me.isManager){
        const bar=el('div',undefined,'panel session-safety-toolbar');
        const edit=button(t('Saisir / corriger cette séance','Enter / correct this meeting'),'primary');
        edit.onclick=()=>{window.dispatchEvent(new CustomEvent('eco:set-matrix-meeting',{detail:{meetingId:c.meeting.id}}));navigate('operations',{anchor:'twoSheetWorkspace',matrixMeetingId:c.meeting.id,sheetMode:'meeting',force:true});};
        const reconcile=button(t('Confronter les gestionnaires','Reconcile managers'));reconcile.onclick=()=>{activeTab='overview';byId('sessionsTabs')?.querySelector('[data-session-tab="overview"]')?.click();setTimeout(()=>document.querySelector('.live-consensus-panel')?.scrollIntoView({behavior:'smooth',block:'start'}),50);};
        const distribute=button(t('Diffuser aux membres','Distribute to members'));distribute.onclick=()=>void(async()=>{try{const x=await app.distributeMeetingSummary(c.meeting.id);notify(x.queued?t('Diffusion mise en file.','Distribution queued.'):t('Diffusion validée.','Distribution validated.'));}catch(e){showError(e);}})();
        const modify=button(c.meeting.status==='closed'?t('Modifier la séance clôturée','Edit closed meeting'):t('Modifier la séance','Edit meeting'));
        modify.onclick=()=>void(async()=>{const location=prompt(t('Lieu / canal :','Location / channel:'),c.meeting.location??'');if(location===null)return;const theme=prompt(t('Thème :','Theme:'),c.meeting.theme??'');if(theme===null)return;const dressCode=prompt(t('Tenue / consigne :','Dress code / instruction:'),c.meeting.dressCode??'');if(dressCode===null)return;try{await app.updateMeetingContext(c.meeting.id,{location,theme,dressCode});notify(c.meeting.status==='closed'?t('Séance clôturée corrigée : les responsables sont signalés.','Closed meeting corrected: managers were alerted.'):t('Séance modifiée.','Meeting updated.'));if(reloadMeetings)await reloadMeetings();await refresh();}catch(e){showError(e);}})();
        const other=button(t('Autres séances','Other meetings'));other.onclick=()=>{select.focus();select.scrollIntoView({behavior:'smooth',block:'center'});};
        const add=button(t('+ Nouvelle séance','+ New meeting'));add.onclick=()=>byId('sessionsCreateForm')?.scrollIntoView({behavior:'smooth',block:'start'});
        bar.append(edit,reconcile,distribute,modify,other,add);root.append(bar);
      }
      root.append(await fn(c));
    }catch(e){showError(e);root.append(el('div',t('Cette section n’a pas pu être chargée. Les autres modules restent disponibles.','This section could not be loaded. Other modules remain available.'),'empty-state'));}
  };

  const refresh=async()=>{await ensurePicker();await renderTimeline();await renderTab();};

  byId('sessionsTabs')?.querySelectorAll('button[data-session-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.sessionTab||'overview';byId('sessionsTabs').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));void renderTab();}));
  select?.addEventListener('change',()=>{if(select.value==='__cumulative__')activeTab='cumulative';else if(activeTab==='cumulative')activeTab='overview';void refresh();});
  byId('sessionsRefreshBtn')?.addEventListener('click',()=>void refresh());
  byId('sessionsOpenDetailBtn')?.addEventListener('click',()=>{if(select?.value&&openDetail)openDetail('meeting',select.value);});
  byId('sessionsCreateForm')?.addEventListener('submit',e=>void(async()=>{e.preventDefault();const submit=byId('sessionsCreateBtn');try{submit.disabled=true;const raw=byId('sessionsScheduledAt').value,created=await app.openMeeting({title:byId('sessionsTitle').value.trim()||undefined,scheduledAt:raw?new Date(raw).toISOString():undefined,location:byId('sessionsLocation').value.trim()||undefined,theme:byId('sessionsTheme').value.trim()||undefined,dressCode:byId('sessionsDressCode').value.trim()||undefined});notify(t('Séance créée.','Session created.'));if(reloadMeetings)await reloadMeetings();if(select)select.value=created.id;window.dispatchEvent(new CustomEvent('eco:sessions-changed'));await refresh();}catch(err){showError(err);}finally{submit.disabled=false;}})());

  return{refresh};
}
