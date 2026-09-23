const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const row=(label,value)=>{const p=el('p');p.append(el('strong',label+' : '),document.createTextNode(String(value??'—')));return p;};
const link=(label,type,id)=>{const a=el('a',label,'link-btn');a.href='#detail='+encodeURIComponent(type)+':'+encodeURIComponent(id);a.dataset.detailType=type;a.dataset.detailId=id;return a;};
const amountFor=(receipts,{meetingId,rubricId})=>receipts.filter(r=>(!meetingId||r.meetingId===meetingId)&&(!rubricId||r.rubricId===rubricId)).reduce((n,r)=>n+Number(r.netAmount??0),0);

export function mountDetailUI({app,navigate,getGroups,getMembers,getMeetings,getRubrics,isManager=()=>false,fmt=n=>String(n),date=x=>String(x),showError=console.error}){
  const title=document.getElementById('detailTitle'),subtitle=document.getElementById('detailSubtitle'),metrics=document.getElementById('detailMetrics'),body=document.getElementById('detailBody');
  if(!title||!subtitle||!metrics||!body)return{open:async()=>{}};
  let previous='dashboard',openedType='',openedId='';
  const metric=(value,label)=>{const d=el('div',undefined,'metric');d.append(el('strong',String(value)),el('span',label));return d;};
  const card=(heading)=>{const a=el('article',undefined,'panel');a.append(el('h2',heading));return a;};
  const currentView=()=>document.querySelector('.view.active')?.id?.replace(/^view-/,'')||'dashboard';
  const jump=(type,id)=>void open(type,id);
  const managerOrSelf=m=>isManager()||m.userId===app.currentActor();
  const humanMeetingLabel=m=>'Réunion du '+date(m?.scheduledAt??m?.openedAt??m?.createdAt??'');
  const actorName=id=>getMembers().find(m=>m.userId===id)?.displayName??id;

  const quickEntry=({membershipId,rubricId,meetingId,currentAmount=0,onSaved})=>{
    const box=el('div',undefined,'matrix-entry');box.dataset.membershipId=membershipId;box.dataset.rubricId=rubricId;box.dataset.meetingId=meetingId;
    const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.inputMode='numeric';input.placeholder=Number(currentAmount)>0?'Modifier…':'Saisir…';input.setAttribute('aria-label','Nouvelle valeur totale de la cellule');
    const button=el('button','✓','matrix-save');button.type='button';button.title='Valider la nouvelle valeur totale';
    const save=async()=>{try{
      const raw=input.value.trim();if(raw==='')return;const targetAmount=Number(raw);if(!Number.isSafeInteger(targetAmount)||targetAmount<0)throw Error('Le montant doit être un entier positif ou zéro.');
      const current=Math.max(0,Number(currentAmount??0));if(targetAmount===current){input.value='';return;}
      const meeting=getMeetings().find(x=>x.id===meetingId);let reason='';
      if(current>0||meeting?.status==='closed'){reason=prompt(`Motif de la modification ${fmt(current)} → ${fmt(targetAmount)} :`,'Correction de la valeur de la cellule')??'';if(!reason.trim())return;}
      button.disabled=true;input.disabled=true;
      const result=await app.setFinancialCellTarget({membershipId,rubricId,meetingId,targetAmount,currentAmount:current,reason:reason.trim()});
      if(result?.status==='CONSENSUS_REQUIRED')box.classList.add('pending-consensus');
      input.value='';await onSaved?.();
    }catch(e){showError(e);}finally{button.disabled=false;input.disabled=false;}};
    button.onclick=()=>void save();input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void save();}});box.append(input,button);return box;
  };

  const buildExerciseMatrix=({member,statement,operational,editable})=>{
    const meetings=getMeetings().slice().sort((a,b)=>(a.scheduledAt??a.openedAt).localeCompare(b.scheduledAt??b.openedAt));
    const rubrics=getRubrics().filter(r=>r.status!=='ARCHIVED');
    const wrap=el('div',undefined,'matrix-wrap member-exercise-matrix');const table=document.createElement('table');table.className='meeting-matrix';
    const thead=document.createElement('thead'),hr=document.createElement('tr');hr.append(el('th','Séance / période'));
    for(const r of rubrics){const th=document.createElement('th');th.append(link(r.name,'rubric',r.id));hr.append(th);}thead.append(hr);table.append(thead);
    const tbody=document.createElement('tbody');
    const rows=meetings.length?meetings:[{id:'',title:'Sans séance',openedAt:''}];
    for(const meeting of rows){
      const tr=document.createElement('tr'),th=document.createElement('th');if(meeting.id)th.append(link(humanMeetingLabel(meeting),'meeting',meeting.id));else th.textContent='Sans séance';tr.append(th);
      for(const rubric of rubrics){
        const opRow=operational?.exerciseMatrix?.find(x=>x.meetingId===meeting.id),opCell=opRow?.cells?.[rubric.id],confirmed=opCell?Number(opCell.net??0):amountFor(statement.receipts,{meetingId:meeting.id||undefined,rubricId:rubric.id});const td=document.createElement('td'),shown=el('strong',fmt(confirmed),'matrix-confirmed');shown.title=opCell?'Net de la même écriture canonique que la feuille de séance':'Montant net confirmé dans le Ledger';td.append(shown);
        if(editable&&meeting.id)td.append(quickEntry({membershipId:member.id,rubricId:rubric.id,meetingId:meeting.id,currentAmount:Math.max(0,confirmed),onSaved:async()=>{await open('member',member.id,true);}}));
        tr.append(td);
      }
      tbody.append(tr);
    }
    table.append(tbody);wrap.append(table);return wrap;
  };

  const buildMeetingMatrix=({meeting,ledger,editable})=>{
    const members=getMembers(),rubrics=getRubrics().filter(r=>r.status!=='ARCHIVED');
    const wrap=el('div',undefined,'matrix-wrap meeting-entry-matrix'),table=document.createElement('table');table.className='meeting-matrix';
    const thead=document.createElement('thead'),hr=document.createElement('tr');hr.append(el('th','Membre'));
    for(const r of rubrics){const th=document.createElement('th');th.append(link(r.name,'rubric',r.id));hr.append(th);}thead.append(hr);table.append(thead);
    const tbody=document.createElement('tbody');
    for(const member of members){const tr=document.createElement('tr'),th=document.createElement('th');th.append(link(member.displayName,'member',member.id));tr.append(th);
      for(const rubric of rubrics){const td=document.createElement('td'),confirmed=amountFor(ledger.receipts,{meetingId:meeting.id,rubricId:rubric.id});
        // Filter member separately: this is the member x rubric cell, not the group total.
        const cell=ledger.receipts.filter(r=>r.membershipId===member.id&&r.meetingId===meeting.id&&r.rubricId===rubric.id).reduce((n,r)=>n+Number(r.netAmount??0),0);
        td.append(el('strong',fmt(cell),'matrix-confirmed'));
        if(editable)td.append(quickEntry({membershipId:member.id,rubricId:rubric.id,meetingId:meeting.id,currentAmount:Math.max(0,cell),onSaved:async()=>{await open('meeting',meeting.id,true);}}));
        tr.append(td);
      }tbody.append(tr);
    }
    table.append(tbody);wrap.append(table);return wrap;
  };

  const groupDetail=async id=>{
    const g=getGroups().find(x=>x.id===id);if(!g)throw Error('GROUP_NOT_FOUND');
    title.textContent=g.name;subtitle.textContent='Identité du groupe, gouvernance et éléments reliés.';
    metrics.replaceChildren(metric(g.kind,'Famille'),metric(g.governanceModel,'Gouvernance'),metric(g.status,'État'));
    const info=card('Identité');info.append(row('ID groupe',g.id),row('Origine',g.originMode??'—'),row('Exercice',g.currentExerciseLabel??'—'),row('Création',date(g.historicalCreatedAt??g.createdAt)));
    if(app.activeGroup()===g.id){
      try{const p=await app.groupIdentityPassport();info.append(row('Code identitaire',p.publicCode),row('Empreinte des règles',p.rulesFingerprint));}catch{}
      const members=getMembers(),meetings=getMeetings(),rubrics=getRubrics();metrics.append(metric(members.length,'Membres'),metric(meetings.length,'Séances'),metric(rubrics.length,'Rubriques'));
      const linked=card('Accès détaillés');
      for(const [heading,items,type,labelKey] of [['Membres',members,'member','displayName'],['Séances',meetings,'meeting','title'],['Rubriques',rubrics,'rubric','name']]){const box=el('div',undefined,'stack');box.append(el('h3',heading));for(const item of items.slice(0,100))box.append(link(item[labelKey],type,item.id));linked.append(box);}
      body.replaceChildren(info,linked);
    }else{const activate=el('button','Activer ce groupe pour ouvrir ses détails reliés','primary');activate.type='button';activate.onclick=async()=>{app.selectGroup(g.id);location.hash='';location.reload();};info.append(activate);body.replaceChildren(info);}
  };

  const memberDetail=async id=>{
    const m=getMembers().find(x=>x.id===id);if(!m)throw Error('MEMBERSHIP_NOT_FOUND');
    title.textContent=m.displayName;subtitle.textContent='Fiche individuelle · exercice en cours · même vérité que la feuille de séance.';
    metrics.replaceChildren(metric((m.roles??[]).join(', ')||'member','Rôle'),metric(m.status,'État'));
    const identity=card('Identité dans ce groupe'),tech=document.createElement('details');tech.append(el('summary','Référence technique (support)'),el('code',m.id,'technical-id'));identity.append(row('Nom',m.displayName),row('N° dossier','…'+String(m.id).slice(-8).toUpperCase()),row('Année / ancienneté',m.historicalJoinedAt?date(m.historicalJoinedAt):m.joinedAt?date(m.joinedAt):'—'),tech);
    body.replaceChildren(identity);if(!managerOrSelf(m))return;
    let statement,operational;try{[statement,operational]=await Promise.all([app.memberStatement(m.id),app.memberOperationalSheet(m.id)]);}catch(e){showError(e);return;}
    metrics.append(metric(fmt(statement.totalNetContributions),'Cotisations nettes'),metric(fmt(statement.debtPrincipal??0),'Prêts / capital dû'),metric(fmt(statement.debtInterest??0),'Intérêts dus'),metric(fmt(statement.totalDebt??0),'Dette totale'),metric((operational?.rubrics??[]).length,'Rubriques de ma fiche'));
    const sheet=card('Votre fiche individuelle'),host=el('div',undefined,'canonical-financial-table-host');host.dataset.canonicalFinancialHost='1';host.dataset.financialMode='individual';host.dataset.membershipId=m.id;host.dataset.showToolbar='false';host.dataset.editable=isManager()?'true':'false';sheet.append(el('p','Chaque rubrique créée et non archivée du groupe apparaît ici. Cette fiche utilise le même tableau canonique que la feuille de séance : même saisie montant + ✓, même remplacement exact et mêmes totaux par colonne.','truth-notice'),host);body.append(sheet);window.dispatchEvent(new CustomEvent('eco:render-canonical-financial-table',{detail:{root:host,mode:'individual',membershipId:m.id,showToolbar:false,editable:isManager()}}));
    try{
      const loans=(await app.listCompletion('LOAN')).filter(x=>String(x.data?.borrowerMembershipId??'')===m.id);if(loans.length){const loanCard=card('Prêts / dettes');for(const loan of loans){const a=el('article',undefined,'item');a.append(el('strong',loan.title),row('État',loan.data?.completionState??'—'),row('Capital initial',fmt(Number(loan.data?.principal??0))),row('Capital restant',fmt(Number(loan.data?.outstandingPrincipal??0))));loanCard.append(a);}body.append(loanCard);}
    }catch{}
    try{const misc=await app.miscPostings({membershipId:m.id});if(misc.length){const other=card('Inscription · amendes · timbres · autres');for(const p of misc.slice(0,50)){const a=el('article',undefined,'item');a.append(el('strong',p.title),row('Montant',fmt(Number(p.data?.amount??0))));if(p.data?.meetingId)a.append(link('Voir la séance','meeting',String(p.data.meetingId)));other.append(a);}body.append(other);}}catch{}
    try{const notices=await app.financialNotices(m.id);if(notices.length){const n=card('Modifications, avis et validations');for(const x of notices.slice(0,30)){const a=el('article',undefined,'item');a.append(el('strong',x.operationType??'Opération'),row('État',x.status),row('Montant',fmt(Number(x.amount??0))));n.append(a);}body.append(n);}}catch{}
    const history=card('Historique des contributions et modifications'),historyRows=[],historyList=el('div',undefined,'stack'),historyMeta=el('p','Chargement de l’historique…','hint'),more=el('button','Charger la suite','secondary');more.type='button';more.hidden=true;history.append(historyMeta,historyList,more);body.append(history);
    let historyCursor;
    const renderHistory=()=>{
      historyList.replaceChildren();const grouped=new Map();
      for(const r of historyRows){const key=JSON.stringify([r.meetingId??'',r.rubricId??'']);if(!grouped.has(key))grouped.set(key,{label:(r.meetingTitle??'Sans séance')+' · '+(r.rubricName??'Sans rubrique'),rows:[]});grouped.get(key).rows.push(r);}
      for(const g of grouped.values()){const d=document.createElement('details');d.open=true;d.append(el('summary',g.label+' · '+g.rows.length+' événement(s)'));for(const r of g.rows){const item=el('article',undefined,'item'),nature=r.financialNature==='LOAN_DEBT'?'Prêt / dette — exclu des cotisations nettes':r.isModified?'Contribution modifiée':'Contribution saisie';item.append(el('strong',nature+' · '+fmt(r.amount?.amount??r.netAmount)),row('Montant net',fmt(r.netAmount)),row('Date / heure',date(r.receivedAt)),row('Auteur',r.receivedByName??actorName(r.receivedBy)));if(r.corrections?.length){for(const c of r.corrections)item.append(row('Modification',date(c.at)+' · '+(c.authorName??c.authorId??'—')+' · Motif : '+(c.reason??'—')));}d.append(item);}historyList.append(d);}
      if(!historyRows.length)historyList.append(el('p','Aucune contribution enregistrée.','hint'));
    };
    const loadHistory=async()=>{
      more.disabled=true;try{const page=await app.memberFinancialHistory(m.id,historyCursor,50);historyRows.push(...(page.items??[]));historyCursor=page.nextCursor??undefined;historyMeta.textContent=historyRows.length+' / '+Number(page.total??historyRows.length)+' événement(s) chargé(s) · aucune troncature silencieuse';more.hidden=!page.hasMore;renderHistory();}catch(error){historyMeta.textContent='Historique indisponible : '+String(error?.message??error);more.hidden=true;}finally{more.disabled=false;}
    };
    more.onclick=()=>void loadHistory();await loadHistory();
  };

  const meetingDetail=async id=>{
    const meeting=getMeetings().find(x=>x.id===id);if(!meeting)throw Error('MEETING_NOT_FOUND');
    const group=getGroups().find(x=>x.id===app.activeGroup()),ordered=getMeetings().slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt))),index=ordered.findIndex(x=>x.id===id),previous=index>0?ordered[index-1]:undefined,next=index>=0&&index<ordered.length-1?ordered[index+1]:undefined;
    title.textContent=humanMeetingLabel(meeting);subtitle.textContent='Séance du groupe · finances, membres, présence, bénéficiaires et preuves selon vos droits.';
    metrics.replaceChildren(metric(meeting.status,'État'),metric(date(meeting.scheduledAt??meeting.openedAt),'Date'),metric(group?.currentExerciseLabel??group?.launchProfileSnapshot?.cycle?.label??'À compléter','Exercice / cycle'));

    const info=card('Identification de la séance');
    info.append(row('Groupe',group?.name??'—'),row('Réunion',humanMeetingLabel(meeting)),row('Exercice / cycle',group?.currentExerciseLabel??group?.launchProfileSnapshot?.cycle?.label??'À compléter'),row('Ouverte par',actorName(meeting.openedBy)),row('Planifiée',meeting.scheduledAt?date(meeting.scheduledAt):'—'),row('Lieu / canal',meeting.location??'À compléter'),row('Thème',meeting.theme??'À compléter'),row('Tenue / code vestimentaire',meeting.dressCode??'À compléter'),row('Clôturée',meeting.closedAt?date(meeting.closedAt):'—'));
    const technical=document.createElement('details');technical.append(el('summary','Références techniques'),row('Titre interne',meeting.title),row('ID séance',meeting.id));info.append(technical);
    body.replaceChildren(info);

    const timeline=card('Temporalité de la séance'),timelineActions=el('div',undefined,'actions');
    if(previous){const b=el('button','← '+humanMeetingLabel(previous),'secondary');b.type='button';b.onclick=()=>jump('meeting',previous.id);timelineActions.append(b);}
    else timelineActions.append(el('span','Aucune séance précédente.','hint'));
    const now=el('strong',humanMeetingLabel(meeting));timelineActions.append(now);
    if(next){const b=el('button',humanMeetingLabel(next)+' →','secondary');b.type='button';b.onclick=()=>jump('meeting',next.id);timelineActions.append(b);}
    else timelineActions.append(el('span','Aucune séance suivante programmée.','hint'));
    timeline.append(timelineActions);body.append(timeline);

    const me=await app.groupMe().catch(()=>({isManager:false,membership:null})),manager=Boolean(me?.isManager);
    if(manager){
      const planning=card('Préparer / ajuster cette séance'),form=document.createElement('form');form.className='form-grid';
      const scheduled=document.createElement('input');scheduled.type='datetime-local';if(meeting.scheduledAt){const d=new Date(meeting.scheduledAt),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);scheduled.value=local.toISOString().slice(0,16);}
      const location=document.createElement('input');location.value=meeting.location??'';location.placeholder='Domicile, salle, téléphone…';
      const theme=document.createElement('input');theme.value=meeting.theme??'';theme.placeholder='Thème / objet';
      const dress=document.createElement('input');dress.value=meeting.dressCode??'';dress.placeholder='Tenue / code vestimentaire';
      const wrap=(label,node)=>{const l=document.createElement('label');l.textContent=label;l.append(node);return l;},save=el('button','Enregistrer le contexte','primary');save.type='submit';
      form.append(wrap('Date / heure prévue',scheduled),wrap('Lieu / canal',location),wrap('Thème',theme),wrap('Tenue / code vestimentaire',dress),save);
      form.onsubmit=e=>void(async()=>{e.preventDefault();try{save.disabled=true;const updated=await app.updateMeetingContext(id,{scheduledAt:scheduled.value?new Date(scheduled.value).toISOString():null,location:location.value||null,theme:theme.value||null,dressCode:dress.value||null});Object.assign(meeting,updated);await open('meeting',id,true);}catch(err){showError(err);}finally{save.disabled=false;}})();
      planning.append(form,el('p','Ces informations alimentent le calendrier précédente / actuelle / prochaines sans créer un second service de planning.','hint'));body.append(planning);
    }
    if(manager){
      try{
        const [ledger,cashboxes,expenses,arrears,loans]=await Promise.all([
          app.ledger(),app.cashboxReconciliations().catch(()=>[]),app.expenses({meetingId:id}).catch(()=>[]),app.arrears().catch(()=>[]),app.listCompletion('LOAN').catch(()=>[])
        ]);
        const receipts=ledger.receipts.filter(r=>r.meetingId===id),latestCashbox=cashboxes.filter(x=>x.meetingId===id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
        const receiptIn=receipts.reduce((n,r)=>n+Number(r.netAmount??0),0),expenseOut=expenses.reduce((n,x)=>n+Number(x.amount??x.data?.amount??0),0);
        const finance=card('Finances de la séance');
        if(latestCashbox){
          const f=latestCashbox.snapshot,grid=el('div',undefined,'metrics small');
          for(const [label,value] of [['Solde au début',fmt(Number(f.openingCash??0))],['Recettes',fmt(Number(f.cashIn??0))],['Dépenses',fmt(Number(f.cashOut??0))],['Solde théorique',fmt(Number(f.theoreticalClosing??0))],['Compté physiquement',fmt(Number(f.countedClosing??0))],['Écart',fmt(Number(f.variance??0))]])grid.append(metric(value,label));
          finance.append(grid,row('Rapprochement',latestCashbox.status),el('p','Les chiffres de caisse proviennent du rapprochement canonique de cette séance.','hint'));
        }else{
          const grid=el('div',undefined,'metrics small');grid.append(metric('À rapprocher','Solde au début'),metric(fmt(receiptIn),'Recettes Ledger connues'),metric(fmt(expenseOut),'Dépenses enregistrées'),metric('À rapprocher','Solde à la clôture'));finance.append(grid,el('p','Aucun rapprochement de caisse n’est enregistré pour cette séance. Eco-System n’invente pas le solde d’ouverture ou de clôture.','hint'));
        }
        const openArrears=(arrears??[]).filter(x=>!['settled','paid','closed','resolved'].includes(String(x.status??'').toLowerCase()));
        const activeLoans=(loans??[]).filter(x=>['APPROVED','DISBURSED','REPAYING'].includes(String(x.data?.completionState??''))&&(Number(x.data?.outstandingPrincipal??0)>0||Number(x.data?.unpaidInterest??0)>0));
        const debtSummary=el('div',undefined,'actions');debtSummary.append(metric(String(openArrears.length),'Impayés / obligations ouverts'),metric(String(activeLoans.length),'Prêts avec dette suivie'));
        const loanButton=el('button','Ouvrir Prêts + Intérêts','secondary');loanButton.type='button';loanButton.onclick=()=>navigate('finance');const ranking=el('button','Classements & calendrier','secondary');ranking.type='button';ranking.onclick=()=>navigate('tontines');debtSummary.append(loanButton,ranking);finance.append(debtSummary);body.append(finance);

        const debtTable=card('Gestion des dettes à ce jour');
        if(openArrears.length){
          const table=document.createElement('table');table.className='meeting-matrix';const head=document.createElement('thead'),hr=document.createElement('tr');for(const h of ['Membre','Motif','Montant restant','Échéance','État'])hr.append(el('th',h));head.append(hr);table.append(head);const tb=document.createElement('tbody');
          for(const item of openArrears){const member=getMembers().find(m=>m.userId===item.assigneeId),tr=document.createElement('tr');tr.append(el('td',member?.displayName??item.assigneeId),el('td',item.title??'—'),el('td',fmt(Number(item.outstanding??0))),el('td',item.dueAt?date(item.dueAt):'—'),el('td',String(item.status??'OPEN')));tb.append(tr);}table.append(tb);debtTable.append(table);
        }else debtTable.append(el('p','Aucun membre redevable selon les créances canoniques à cette date.','hint'));
        body.append(debtTable);

        const backOffice=expenses.filter(x=>String(x.scope??x.data?.scope??'').toUpperCase()==='BACKOFFICE'),backOfficeCard=card('Caisses / dépenses du Back-office comprises');
        if(backOffice.length){for(const expense of backOffice){const a=el('article',undefined,'item');a.append(el('strong',String(expense.label??expense.title??'Dépense Back-office')),row('Montant',fmt(Number(expense.amount??expense.data?.amount??0))),row('Date',date(expense.createdAt)));backOfficeCard.append(a);}}else backOfficeCard.append(el('p','Aucune dépense Back-office rattachée à cette séance.','hint'));
        body.append(backOfficeCard);

        metrics.append(metric(receipts.length,'Encaissements'));
        const sheet=card('Tableau complet de la séance');sheet.append(el('p','Membres en lignes, rubriques en colonnes. Les mêmes écritures alimentent les fiches individuelles, les rubriques et le Récap.','hint'),buildMeetingMatrix({meeting,ledger,editable:meeting.status==='open'}));
        const manageActions=el('div',undefined,'actions');
        for(const [label,view] of [['Fiches individuelles','operations'],['Gérer les membres','members'],['Gérer / archiver les rubriques','operations'],['Ouvrir le Récap','recap']]){const b=el('button',label,'secondary');b.type='button';b.onclick=()=>navigate(view);manageActions.append(b);}
        sheet.append(manageActions);body.append(sheet);
      }catch(e){showError(e);}
    }else{
      body.append(el('p','Le tableau financier global est réservé aux responsables. Votre propre situation de séance reste accessible ci-dessous.','hint'));
      if(me?.membership?.id)try{
        const operational=await app.memberOperationalSheet(me.membership.id),rowForMeeting=(operational.exerciseMatrix??[]).find(x=>x.meetingId===id),own=card('Ma situation dans cette séance');
        own.append(metric(fmt(Number(rowForMeeting?.total??0)),'Net de ma séance'));
        if(rowForMeeting){const list=el('div',undefined,'stack');for(const rubric of operational.rubrics??[]){const cell=rowForMeeting.cells?.[rubric.id];if(!cell||(!cell.inflow&&!cell.outflow))continue;const a=el('article',undefined,'item');a.append(el('strong',rubric.name),row('Entrées',fmt(Number(cell.inflow??0))),row('Sorties',fmt(Number(cell.outflow??0))),row('Net',fmt(Number(cell.net??0))));list.append(a);}own.append(list);}
        body.append(own);
      }catch(e){showError(e);}
    }

    const attendanceCard=card('Présence et émargement'),attendanceRows=await app.meetingAttendance(id).catch(()=>[]);
    if(manager){
      const byMember=new Map(attendanceRows.map(x=>[String(x.data?.membershipId??''),x])),table=document.createElement('table');table.className='meeting-matrix attendance-table';const head=document.createElement('thead'),hr=document.createElement('tr');for(const h of ['Membre','Présence','Observation','Action'])hr.append(el('th',h));head.append(hr);table.append(head);const tb=document.createElement('tbody');
      for(const member of getMembers().filter(x=>x.status!=='left')){const existing=byMember.get(member.id),tr=document.createElement('tr'),name=document.createElement('th');name.append(link(member.displayName,'member',member.id));const status=document.createElement('select');for(const [v,l] of [['PRESENT','Présent'],['LATE','En retard'],['REPRESENTED','Représenté'],['EXCUSED','Excusé'],['ABSENT','Absent']])status.append(new Option(l,v));status.value=String(existing?.data?.attendance??'PRESENT');const note=document.createElement('input');note.placeholder='Observation';note.value=String(existing?.data?.note??'');const save=el('button',existing?'Mettre à jour':'Enregistrer','secondary');save.type='button';save.onclick=()=>void(async()=>{try{save.disabled=true;await app.recordMeetingAttendance(id,{membershipId:member.id,attendance:status.value,note:note.value.trim()||undefined});await open('meeting',id,true);}catch(e){showError(e);}finally{save.disabled=false;}})();for(const node of [name,el('td'),el('td'),el('td')])tr.append(node);tr.children[1].append(status);tr.children[2].append(note);tr.children[3].append(save);tb.append(tr);}
      table.append(tb);attendanceCard.append(el('p','Le Bureau enregistre la présence. Chaque changement est audité.','hint'),table);
    }else{
      const own=attendanceRows[0];attendanceCard.append(row('Ma présence',own?String(own.data?.attendance??'—'):'Non renseignée'),own?.data?.note?row('Observation',own.data.note):el('p','Seul votre propre statut de présence est visible ici.','hint'));
    }
    body.append(attendanceCard);

    const beneficiaryCard=card('Bénéficiaires et preuves de réception'),[declarations,evidences]=await Promise.all([app.meetingBeneficiaries(id).catch(()=>[]),app.meetingBenefitEvidence(id).catch(()=>[])]);
    beneficiaryCard.append(el('p','Une preuve n’est enregistrée qu’après déclaration du bénéficiaire. Émargement papier, photo/document ou confirmation personnelle sont conservés comme preuves immuables.','hint'));
    if(manager){
      const form=document.createElement('form');form.className='form-grid';const member=document.createElement('select');member.append(new Option('Choisir le bénéficiaire',''));for(const m of getMembers().filter(x=>x.status!=='left'))member.append(new Option(m.displayName,m.id));const rubric=document.createElement('select');rubric.append(new Option('Sans rubrique spécifique',''));for(const r of getRubrics().filter(x=>x.status!=='ARCHIVED'))rubric.append(new Option(r.name,r.id));const amount=document.createElement('input');amount.type='number';amount.min='0';amount.step='1';amount.inputMode='numeric';amount.placeholder='Montant reçu';const note=document.createElement('input');note.placeholder='Note / contexte';const declare=el('button','Déclarer le bénéficiaire','primary');declare.type='submit';const label=(txt,node)=>{const l=document.createElement('label');l.textContent=txt;l.append(node);return l;};form.append(label('Bénéficiaire',member),label('Rubrique',rubric),label('Montant XAF',amount),label('Note',note),declare);form.onsubmit=e=>void(async()=>{e.preventDefault();try{const n=Number(amount.value);if(!member.value||!Number.isSafeInteger(n)||n<0)throw Error('Bénéficiaire et montant valides requis.');declare.disabled=true;await app.declareMeetingBeneficiary(id,{membershipId:member.value,rubricId:rubric.value||undefined,amount:n,currency:'XAF',note:note.value.trim()||undefined});await open('meeting',id,true);}catch(err){showError(err);}finally{declare.disabled=false;}})();beneficiaryCard.append(form);
    }
    const evidenceByDeclaration=new Map(evidences.map(x=>[String(x.data?.declarationId??''),x])),list=el('div',undefined,'stack');
    for(const declaration of declarations){
      const memberName=declaration.displayName??getMembers().find(x=>x.id===declaration.data?.membershipId)?.displayName??'Membre',rubricName=getRubrics().find(x=>x.id===declaration.data?.rubricId)?.name??'Sans rubrique',evidence=evidenceByDeclaration.get(declaration.id),item=el('article',undefined,'item');
      item.append(el('strong',memberName+' · '+rubricName),row('Montant déclaré',fmt(Number(declaration.data?.amount??0))),row('Code de réception',String(declaration.data?.proofCode??'—')),row('État',evidence?'Réception prouvée':'Preuve en attente'));
      if(evidence)item.append(row('Mode de preuve',String(evidence.data?.method??'—')),row('Enregistrée le',date(evidence.createdAt)));
      else{
        const actions=el('div',undefined,'actions'),own=String(declaration.data?.membershipId??'')===String(me?.membership?.id??'');
        if(own){const confirm=el('button','Je confirme avoir reçu','primary');confirm.type='button';confirm.onclick=()=>void(async()=>{try{confirm.disabled=true;await app.recordMeetingBenefitEvidence(id,{declarationId:declaration.id,membershipId:String(declaration.data.membershipId),rubricId:declaration.data.rubricId?String(declaration.data.rubricId):undefined,amount:Number(declaration.data.amount??0),currency:String(declaration.data.currency??'XAF'),method:'MEMBER_CONFIRMATION',idempotencyKey:'benefit:'+declaration.id+':member-confirm'});await open('meeting',id,true);}catch(err){showError(err);}finally{confirm.disabled=false;}})();actions.append(confirm);}
        if(manager){
          const paper=el('button','Émargement papier reçu','secondary');paper.type='button';paper.onclick=()=>void(async()=>{try{paper.disabled=true;await app.recordMeetingBenefitEvidence(id,{declarationId:declaration.id,membershipId:String(declaration.data.membershipId),rubricId:declaration.data.rubricId?String(declaration.data.rubricId):undefined,amount:Number(declaration.data.amount??0),currency:String(declaration.data.currency??'XAF'),method:'PAPER_EMARGEMENT',note:'Émargement papier constaté par un responsable habilité.',idempotencyKey:'benefit:'+declaration.id+':paper'});await open('meeting',id,true);}catch(err){showError(err);}finally{paper.disabled=false;}})();
          const file=document.createElement('input');file.type='file';file.accept='image/*,.pdf';file.setAttribute('aria-label','Photo ou PDF de la preuve');const upload=el('button','Joindre photo / document','secondary');upload.type='button';upload.onclick=()=>void(async()=>{try{const f=file.files?.[0];if(!f)throw Error('Choisissez une photo ou un PDF.');upload.disabled=true;const saved=await app.uploadMeetingBenefitEvidence(id,f);await app.recordMeetingBenefitEvidence(id,{declarationId:declaration.id,membershipId:String(declaration.data.membershipId),rubricId:declaration.data.rubricId?String(declaration.data.rubricId):undefined,amount:Number(declaration.data.amount??0),currency:String(declaration.data.currency??'XAF'),method:'PHOTO_DOCUMENT',artifactKey:saved.artifactKey,fingerprint:saved.fingerprint,note:'Preuve documentaire téléversée.',idempotencyKey:'benefit:'+declaration.id+':photo:'+saved.fingerprint});await open('meeting',id,true);}catch(err){showError(err);}finally{upload.disabled=false;}})();actions.append(paper,file,upload);
        }
        if(actions.childElementCount)item.append(actions);
      }
      list.append(item);
    }
    if(!declarations.length)list.append(el('p','Aucun bénéficiaire déclaré pour cette séance.','hint'));
    beneficiaryCard.append(list);body.append(beneficiaryCard);

    try{const misc=await app.miscPostings({meetingId:id});if(misc.length){const other=card('Autres · séance');for(const p of misc){const m=getMembers().find(x=>x.id===p.data?.membershipId),a=el('article',undefined,'item');a.append(el('strong',p.title),row('Montant',fmt(Number(p.data?.amount??0))));if(m)a.append(link(m.displayName,'member',m.id));other.append(a);}body.append(other);}}catch{}
    const sessionList=card('Liste des séances / précédentes séances');const sessionStack=el('div',undefined,'stack');
    for(const item of ordered.slice().reverse()){const a=el('article',undefined,'item'),head=el('div',undefined,'actions');head.append(link(humanMeetingLabel(item),'meeting',item.id),el('span',item.status==='closed'?'Clôturée':'Ouverte','pill'));a.append(head,el('p',[item.location?('Lieu : '+item.location):null,item.theme?('Thème : '+item.theme):null].filter(Boolean).join(' · ')||'Contexte non renseigné','hint'));sessionStack.append(a);}
    if(!ordered.length)sessionStack.append(el('p','Aucune autre séance.','hint'));sessionList.append(sessionStack);body.append(sessionList);
  };

  const rubricContributionMatrix=(rubric,ledger)=>{
    const meetings=getMeetings().slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt))),members=getMembers();
    const wrap=el('div',undefined,'matrix-wrap rubric-contribution-matrix'),table=document.createElement('table');table.className='meeting-matrix';
    const head=document.createElement('thead'),hr=document.createElement('tr');hr.append(el('th','Membre'));
    for(const meeting of meetings){const th=document.createElement('th');th.append(link(humanMeetingLabel(meeting),'meeting',meeting.id));hr.append(th);}
    const noMeeting=ledger.receipts.some(x=>x.rubricId===rubric.id&&!x.meetingId);if(noMeeting)hr.append(el('th','Sans séance'));
    hr.append(el('th','Total rubrique'));head.append(hr);table.append(head);const bodyRows=document.createElement('tbody');
    for(const member of members){const tr=document.createElement('tr'),name=document.createElement('th');name.append(link(member.displayName,'member',member.id));tr.append(name);let total=0;
      for(const meeting of meetings){const amount=ledger.receipts.filter(x=>x.membershipId===member.id&&x.rubricId===rubric.id&&x.meetingId===meeting.id).reduce((n,x)=>n+Number(x.netAmount??0),0);total+=amount;tr.append(el('td',fmt(amount)));}
      if(noMeeting){const amount=ledger.receipts.filter(x=>x.membershipId===member.id&&x.rubricId===rubric.id&&!x.meetingId).reduce((n,x)=>n+Number(x.netAmount??0),0);total+=amount;tr.append(el('td',fmt(amount)));}
      const sum=el('td');sum.append(el('strong',fmt(total)));tr.append(sum);bodyRows.append(tr);
    }
    table.append(bodyRows);wrap.append(table);return wrap;
  };

  const rubricConfigurationEditor=r=>{
    const box=card('Configurer cette rubrique'),ruleForm=document.createElement('form');ruleForm.className='form-grid';
    const written=document.createElement('textarea');written.rows=2;written.value=r.operatingModel?.writtenRule??'';const observed=document.createElement('textarea');observed.rows=2;observed.value=r.operatingModel?.observedPractice??'';
    const reality=document.createElement('select');for(const [v,label] of [['UNKNOWN','À vérifier'],['ALIGNED','Conforme'],['DIFFERS','Différent'],['MIXED','Mixte']]){const o=new Option(label,v);reality.append(o);}reality.value=r.operatingModel?.ruleRealityStatus??'UNKNOWN';
    const saveRule=el('button','Enregistrer règle et pratique','primary');saveRule.type='submit';
    const label=(text,node)=>{const l=document.createElement('label');l.textContent=text;l.append(node);return l;};
    ruleForm.append(label('Ce qui est écrit',written),label('Pratique observée',observed),label('Écart écrit / pratique',reality),saveRule);
    ruleForm.onsubmit=e=>void(async()=>{e.preventDefault();try{saveRule.disabled=true;const base=r.operatingModel??{targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false};await app.updateRubricOperatingModel(r.id,{...base,writtenRule:written.value.trim()||undefined,observedPractice:observed.value.trim()||undefined,ruleRealityStatus:reality.value});await open('rubric',r.id,true);}catch(err){showError(err);}finally{saveRule.disabled=false;}})();
    box.append(ruleForm);
    if(r.activityPlan){
      const planForm=document.createElement('form');planForm.className='form-grid';const amount=document.createElement('input');amount.type='number';amount.min='0';amount.max='999999999999';amount.step='1';amount.value=String(r.activityPlan.nominalAmount?.amount??0);
      const participation=document.createElement('select');for(const [v,label] of [['OPTIONAL','Facultative'],['MANDATORY','Obligatoire'],['RULE_BASED','Selon règle']])participation.append(new Option(label,v));participation.value=r.activityPlan.participationMode??'RULE_BASED';
      const savePlan=el('button','Enregistrer les paramètres','secondary');savePlan.type='submit';planForm.append(label('Montant nominal / part',amount),label('Participation',participation),savePlan);
      planForm.onsubmit=e=>void(async()=>{e.preventDefault();try{const n=Number(amount.value);if(!Number.isSafeInteger(n)||n<0)throw Error('Montant invalide.');savePlan.disabled=true;await app.updateRubricActivityPlan(r.id,{...r.activityPlan,nominalAmount:{...r.activityPlan.nominalAmount,amount:n},participationMode:participation.value});await open('rubric',r.id,true);}catch(err){showError(err);}finally{savePlan.disabled=false;}})();box.append(planForm);
    }
    return box;
  };

  const rubricDetail=async id=>{
    const r=getRubrics().find(x=>x.id===id);if(!r)throw Error('RUBRIC_NOT_FOUND');title.textContent=r.name;subtitle.textContent='Règle, pratique observée et mouvements liés.';metrics.replaceChildren(metric(r.status,'État'),metric(r.source,'Source'),metric(r.version,'Version'));
    const info=card('Règle de la rubrique');info.append(row('Nom',r.name),row('Objet',r.purpose??'—'),row('Écrit',r.operatingModel?.writtenRule??'—'),row('Pratique observée',r.operatingModel?.observedPractice??'—'),row('Règle effective',r.operatingModel?.effectiveRuleSummary??'—'),row('Écart',r.operatingModel?.ruleRealityStatus??'UNKNOWN'),row('Participation',r.activityPlan?.participationMode??r.facets?.obligation??'—'),row('Cadence',r.facets?.cadence??'—'));body.replaceChildren(info);
    if(r.activityPlan){const plan=card('Configuration actuelle');plan.append(row('Nature',r.activityPlan.kind),row('Montant nominal',fmt(Number(r.activityPlan.nominalAmount?.amount??0))),row('Durée',r.activityPlan.duration?r.activityPlan.duration.value+' '+r.activityPlan.duration.unit:'—'),row('Séances',r.activityPlan.sessions));body.append(plan);}
    if(isManager()){try{const ledger=await app.ledger(),receipts=ledger.receipts.filter(x=>x.rubricId===id);metrics.append(metric(receipts.length,'Écritures'));const recap=card('Tableau récapitulatif des contributions');recap.append(el('p','Responsables uniquement · membres en lignes, réunions/périodes en colonnes. Les montants sont les positions nettes après contrepassations.','hint'),rubricContributionMatrix(r,ledger));body.append(recap,rubricConfigurationEditor(r));}catch(e){showError(e);}}
    else body.append(el('p','Le tableau global de cette rubrique et sa configuration sont réservés aux responsables habilités.','hint'));
  };

  async function open(type,id,preservePrevious=false){
    try{openedType=type;openedId=id;const active=currentView();if(active!=='detail'&&!preservePrevious)previous=active;metrics.replaceChildren();body.replaceChildren(el('p','Chargement…','hint'));navigate('detail');
      if(type==='group')await groupDetail(id);else if(type==='member')await memberDetail(id);else if(type==='meeting')await meetingDetail(id);else if(type==='rubric')await rubricDetail(id);else throw Error('DETAIL_TYPE_UNSUPPORTED');
      try{history.replaceState(null,'','#detail='+encodeURIComponent(type)+':'+encodeURIComponent(id));}catch{}
    }catch(e){showError(e);}
  }
  const openFromLocation=async()=>{const raw=location.hash.match(/^#detail=([^:]+):(.+)$/);if(!raw)return false;const type=decodeURIComponent(raw[1]),id=decodeURIComponent(raw[2]);if(!type||!id)return false;await open(type,id);return true;};
  document.addEventListener('click',e=>{const target=e.target instanceof Element?e.target.closest('[data-detail-type][data-detail-id]'):null;if(!target)return;e.preventDefault();jump(target.dataset.detailType,target.dataset.detailId);});
  document.getElementById('detailBackBtn')?.addEventListener('click',()=>{navigate(previous);try{history.replaceState(null,'',location.pathname+location.search);}catch{}});
  return{open,openFromLocation,refreshCurrent:async()=>{if(openedType&&openedId)await open(openedType,openedId,true);}};
}
