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

  const quickEntry=({membershipId,rubricId,meetingId,onSaved})=>{
    const box=el('div',undefined,'matrix-entry');const input=document.createElement('input');input.type='number';input.min='1';input.step='1';input.inputMode='numeric';input.placeholder='Ajouter…';input.setAttribute('aria-label','Montant à enregistrer');
    const button=el('button','✓','matrix-save');button.type='button';button.title='Enregistrer ce montant';
    const save=async()=>{try{const amount=Number(input.value);if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Le montant doit être un entier positif.');button.disabled=true;input.disabled=true;const result=await app.recordCashContribution({membershipId,rubricId,meetingId,amount});if(result.queued)throw Error('Opération conservée en attente de synchronisation : vérifiez la file avant une nouvelle saisie.');input.value='';await onSaved?.();}catch(e){showError(e);}finally{button.disabled=false;input.disabled=false;}};
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
        if(editable&&meeting.id)td.append(quickEntry({membershipId:member.id,rubricId:rubric.id,meetingId:meeting.id,onSaved:async()=>{await open('member',member.id,true);}}));
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
        if(editable)td.append(quickEntry({membershipId:member.id,rubricId:rubric.id,meetingId:meeting.id,onSaved:async()=>{await open('meeting',meeting.id,true);}}));
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
    const identity=card('Identité dans ce groupe');identity.append(row('Nom',m.displayName),row('Fiche membre',m.id),row('Année / ancienneté',m.historicalJoinedAt?date(m.historicalJoinedAt):m.joinedAt?date(m.joinedAt):'—'));
    body.replaceChildren(identity);if(!managerOrSelf(m))return;
    let statement,operational;try{[statement,operational]=await Promise.all([app.memberStatement(m.id),app.memberOperationalSheet(m.id)]);}catch(e){showError(e);return;}
    metrics.append(metric(fmt(statement.totalNetContributions),'Cotisations nettes'),metric((operational?.rubrics??[]).length,'Rubriques de ma fiche'));
    const sheet=card('Votre fiche individuelle');sheet.append(el('p','Chaque rubrique créée et non archivée du groupe apparaît ici. Chaque ligne est une séance/période. Cette fiche lit exactement la même vérité que la feuille de séance ; un membre voit sa propre fiche sans accéder aux fiches financières des autres.','hint'),buildExerciseMatrix({member:m,statement,operational,editable:isManager()}));body.append(sheet);
    try{
      const loans=(await app.listCompletion('LOAN')).filter(x=>String(x.data?.borrowerMembershipId??'')===m.id);if(loans.length){const loanCard=card('Prêts / dettes');for(const loan of loans){const a=el('article',undefined,'item');a.append(el('strong',loan.title),row('État',loan.data?.completionState??'—'),row('Capital initial',fmt(Number(loan.data?.principal??0))),row('Capital restant',fmt(Number(loan.data?.outstandingPrincipal??0))));loanCard.append(a);}body.append(loanCard);}
    }catch{}
    try{const misc=await app.miscPostings({membershipId:m.id});if(misc.length){const other=card('Inscription · amendes · timbres · autres');for(const p of misc.slice(0,50)){const a=el('article',undefined,'item');a.append(el('strong',p.title),row('Montant',fmt(Number(p.data?.amount??0))));if(p.data?.meetingId)a.append(link('Voir la séance','meeting',String(p.data.meetingId)));other.append(a);}body.append(other);}}catch{}
    try{const notices=await app.financialNotices(m.id);if(notices.length){const n=card('Modifications, avis et validations');for(const x of notices.slice(0,30)){const a=el('article',undefined,'item');a.append(el('strong',x.operationType??'Opération'),row('État',x.status),row('Montant',fmt(Number(x.amount??0))));n.append(a);}body.append(n);}}catch{}
    const history=card('Historique des encaissements');for(const r of statement.receipts.slice().sort((a,b)=>b.receivedAt.localeCompare(a.receivedAt)).slice(0,100)){const item=el('article',undefined,'item');item.append(el('strong',fmt(r.netAmount)),row('Date',date(r.receivedAt)));if(r.meetingId)item.append(link('Séance','meeting',r.meetingId));if(r.rubricId)item.append(link('Rubrique','rubric',r.rubricId));history.append(item);}body.append(history);
  };

  const meetingDetail=async id=>{
    const meeting=getMeetings().find(x=>x.id===id);if(!meeting)throw Error('MEETING_NOT_FOUND');
    title.textContent=humanMeetingLabel(meeting);subtitle.textContent='Feuille de séance · membres × rubriques · mêmes écritures que les fiches individuelles.';
    metrics.replaceChildren(metric(meeting.status,'État'),metric(date(meeting.scheduledAt??meeting.openedAt),'Date'));
    const info=card('Séance');info.append(row('Titre affiché',humanMeetingLabel(meeting)),row('Titre interne conservé',meeting.title),row('Ouverte par',actorName(meeting.openedBy)),row('Planifiée',meeting.scheduledAt?date(meeting.scheduledAt):'—'),row('Clôturée',meeting.closedAt?date(meeting.closedAt):'—'));body.replaceChildren(info);
    if(isManager()){
      try{const ledger=await app.ledger(),receipts=ledger.receipts.filter(r=>r.meetingId===id);metrics.append(metric(receipts.length,'Encaissements'));const sheet=card('Votre feuille de séance');sheet.append(el('p','Les noms des membres et les titres des rubriques ouvrent leurs fiches. Les montants ne sont plus des liens : saisissez un ajout dans la cellule et validez ✓.','hint'),buildMeetingMatrix({meeting,ledger,editable:meeting.status==='open'}));body.append(sheet);}catch(e){showError(e);}
    }else body.append(el('p','La feuille complète est réservée aux responsables. Votre fiche individuelle reste accessible depuis votre compte.','hint'));
    try{const misc=await app.miscPostings({meetingId:id});if(misc.length){const other=card('Autres · séance');for(const p of misc){const m=getMembers().find(x=>x.id===p.data?.membershipId),a=el('article',undefined,'item');a.append(el('strong',p.title),row('Montant',fmt(Number(p.data?.amount??0))));if(m)a.append(link(m.displayName,'member',m.id));other.append(a);}body.append(other);}}catch{}
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
