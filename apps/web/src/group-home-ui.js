const byId=id=>document.getElementById(id);
const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
const humanDate=value=>{if(!value)return'À compléter';try{return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'fr-FR',{dateStyle:'long'}).format(new Date(value));}catch{return String(value??'—');}};
const humanDateTime=value=>{if(!value)return'—';try{return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value??'—');}};
const t=(fr,en)=>document.documentElement.lang==='en'?en:fr;
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const meetingTime=m=>new Date(m?.scheduledAt??m?.openedAt??m?.createdAt??0).getTime();
const meetingLabel=m=>t('Réunion du ','Meeting on ')+humanDate(m?.scheduledAt??m?.openedAt??m?.createdAt);
const amount=(row,fmt)=>fmt(Number(row?.outstanding??row?.amount?.amount??row?.amount??0));
const td=text=>make('td','',String(text??'—'));

export function mountGroupHomeUI({app,getGroups,getMembers,getMeetings,navigate,fmt}){
  const root=byId('groupHomeContent');
  const action=(label,view,target)=>{const b=make('button','secondary',label);b.type='button';b.onclick=()=>{navigate(view);if(target)setTimeout(()=>byId(target)?.scrollIntoView({behavior:'smooth',block:'start'}),120);};return b;};
  const balanceCard=(label,value)=>{const card=make('div','metric');card.append(make('span','',label));const strong=make('strong',Number(value)>=0?'safe':'error',fmt(Number(value)));card.append(strong);return card;};

  async function refresh(){
    if(!root)return;
    root.replaceChildren();
    const group=getGroups().find(x=>x.id===app.activeGroup());
    if(!group){root.append(make('div','empty-state',t('Sélectionnez un groupe pour afficher son Accueil.','Select a group to show its Home.')));return;}
    const members=getMembers(),meetings=getMeetings(),[me,passport,profile]=await Promise.all([
      app.groupMe().catch(()=>({isManager:false,membership:null})),
      app.groupIdentityPassport(false).catch(()=>null),
      app.groupIdentityProfile().catch(()=>({}))
    ]);
    const manage=Boolean(me?.isManager),office=members.filter(m=>m.roles?.some(r=>managerRoles.has(r))),now=new Date();

    const identification=make('section','group-home-block');identification.append(make('h3','',t('Identification du groupe','Group identification')));
    const grid=make('div','metrics small'),groupLabel=passport?.publicCode?group.name+' · '+passport.publicCode:group.name;
    const fields=[
      [t('Groupe + code','Group + code'),groupLabel],
      [t('Type','Type'),group.kind==='rotating_tontine'?t('Tontine rotative','Rotating tontine'):t('Association / groupe','Association / group')],
      [t('Création réelle','Actual creation'),humanDate(group.historicalCreatedAt??group.createdAt)],
      [t('Aujourd’hui','Today'),humanDateTime(now)],
      [t('Déclaration','Legal declaration'),profile?.declarationNumber?String(profile.declarationNumber)+(profile.declarationDate?' · '+humanDate(profile.declarationDate):''):t('À compléter','To complete')],
      [t('Mandat du Bureau','Office mandate'),profile?.officeMandateStart||profile?.officeMandateEnd?humanDate(profile.officeMandateStart)+' → '+humanDate(profile.officeMandateEnd):t('À compléter','To complete')],
      [t('Mise en ligne','Platform entry'),humanDate(group.createdAt)],
      [t('Membres','Members'),String(members.filter(x=>x.status!=='left').length)],
      [t('Exercice / cycle','Exercise / cycle'),group.currentExerciseLabel??group.launchProfileSnapshot?.cycle?.label??t('À compléter','To complete')]
    ];
    for(const [label,value] of fields){const card=make('div','metric');card.append(make('span','',label),make('strong','',value));grid.append(card);}identification.append(grid);
    const officeBox=make('div','item');officeBox.append(make('strong','',t('Bureau / responsables','Office / managers')),make('p','hint',office.length?office.map(x=>x.displayName+' · '+x.roles.filter(r=>managerRoles.has(r)).join(', ')).join(' • '):t('Composition à compléter selon la gouvernance du groupe.','Composition to complete according to group governance.')));
    if(profile?.officeMandateStart||profile?.officeMandateEnd)officeBox.append(make('small','',t('Mandat : ','Mandate: ')+humanDate(profile.officeMandateStart)+' → '+humanDate(profile.officeMandateEnd)));identification.append(officeBox);

    if(!manage&&me?.membership){
      const own=make('div','item');own.append(make('strong','',t('Mon identification dans ce groupe','My identity in this group')),make('p','',t('Numéro membre : ','Member ID: ')+String(me.membership.id)),make('p','',t('Première inscription : ','First joined: ')+humanDate(me.membership.historicalJoinedAt??me.membership.joinedAt)),make('p','hint',t('Éligibilité Assistance : calculée seulement lorsqu’une règle validée permet de conclure ; sinon « à vérifier » plutôt qu’une réponse inventée.','Assistance eligibility is computed only when a validated rule can determine it; otherwise it remains “to verify”.')));identification.append(own);
    }

    if(manage){
      const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=t('Renseigner déclaration et mandat du Bureau','Edit declaration and office mandate');details.append(summary);
      const form=document.createElement('form');form.className='form-grid';
      const declarationNumber=document.createElement('input');declarationNumber.value=profile?.declarationNumber??'';declarationNumber.placeholder='N° déclaration';
      const declarationDate=document.createElement('input');declarationDate.type='date';if(profile?.declarationDate)declarationDate.value=String(profile.declarationDate).slice(0,10);
      const mandateStart=document.createElement('input');mandateStart.type='date';if(profile?.officeMandateStart)mandateStart.value=String(profile.officeMandateStart).slice(0,10);
      const mandateEnd=document.createElement('input');mandateEnd.type='date';if(profile?.officeMandateEnd)mandateEnd.value=String(profile.officeMandateEnd).slice(0,10);
      const note=document.createElement('input');note.value=profile?.note??'';note.placeholder=t('Note administrative facultative','Optional administrative note');
      const wrap=(label,node)=>{const l=document.createElement('label');l.textContent=label;l.append(node);return l;},save=make('button','primary',t('Enregistrer le profil du groupe','Save group profile'));save.type='submit';
      form.append(wrap(t('Numéro de déclaration','Declaration number'),declarationNumber),wrap(t('Date de déclaration','Declaration date'),declarationDate),wrap(t('Début mandat','Mandate start'),mandateStart),wrap(t('Fin mandat','Mandate end'),mandateEnd),wrap(t('Note','Note'),note),save);
      form.onsubmit=e=>void(async()=>{e.preventDefault();try{save.disabled=true;await app.updateGroupIdentityProfile({declarationNumber:declarationNumber.value||undefined,declarationDate:declarationDate.value||undefined,officeMandateStart:mandateStart.value||undefined,officeMandateEnd:mandateEnd.value||undefined,note:note.value||undefined});await refresh();}finally{save.disabled=false;}})();
      details.append(form);identification.append(details);
    }

    const actions=make('div','actions');actions.append(action(t('Nouvelle séance','New session'),'operations','meetingForm'),action(t('Anciennes séances','Previous sessions'),'operations','meetingList'),action(t('Fiches individuelles','Individual sheets'),'operations','individualSheetsMode'));
    if(manage)actions.append(action(t('Gérer les membres','Manage members'),'members','memberList'),action(t('Gérer / archiver les rubriques','Manage / archive rubrics'),'operations','rubricList'),action(t('Ouvrir le Récap','Open Recap'),'recap'));identification.append(actions);
    const ref=make('details','');ref.append(make('summary','',t('Référence technique','Technical reference')),make('code','',group.id),make('p','hint',t('Le code ECO-GRP identifie le groupe sans donner d’accès. L’ID technique reste secondaire.','The ECO-GRP code identifies the group without granting access. The technical ID remains secondary.')));identification.append(ref);root.append(identification);

    const ordered=meetings.slice().sort((a,b)=>meetingTime(a)-meetingTime(b)),current=ordered.find(x=>x.status==='open')??ordered.find(x=>meetingTime(x)>=now.getTime()),currentIndex=current?ordered.findIndex(x=>x.id===current.id):-1,previous=currentIndex>0?ordered[currentIndex-1]:ordered.filter(x=>meetingTime(x)<now.getTime()).at(-1),future=currentIndex>=0?ordered.slice(currentIndex+1):ordered.filter(x=>meetingTime(x)>now.getTime()),focusMeetings=[previous,current,...future.slice(0,4)].filter((x,i,a)=>x&&a.findIndex(y=>y.id===x.id)===i);
    const declarationPairs=await Promise.all(focusMeetings.map(async m=>[m.id,await app.meetingBeneficiaries(m.id).catch(()=>[]),await app.meetingAttendance(m.id).catch(()=>[])])),meetingData=new Map(declarationPairs.map(([id,beneficiaries,attendance])=>[id,{beneficiaries,attendance}]));
    const timeline=make('section','group-home-block');timeline.append(make('h3','',t('Classement / calendrier : séance précédente · actuelle · prochaines','Schedule: previous · current · upcoming')));
    const timeGrid=make('div','three-col'),temporal=[['Séance précédente',previous],['Séance actuelle / prochaine',current],['Séances suivantes',null]];
    for(const [label,m] of temporal){
      const card=make('article','item');card.append(make('strong','',t(label,label==='Séance précédente'?'Previous session':label==='Séance actuelle / prochaine'?'Current / next session':'Upcoming sessions')));
      if(m){
        card.append(make('p','',meetingLabel(m)),make('p','hint',[m.location?('Lieu : '+m.location):null,m.theme?('Thème : '+m.theme):null,m.dressCode?('Tenue : '+m.dressCode):null].filter(Boolean).join(' · ')||t('Lieu / thème / tenue non renseignés.','Location / theme / dress not provided.')));
        const md=meetingData.get(m.id),beneficiaries=md?.beneficiaries??[];card.append(make('p','',beneficiaries.length?t('Bénéficiaires : ','Beneficiaries: ')+beneficiaries.map(x=>x.displayName??members.find(mm=>mm.id===x.data?.membershipId)?.displayName??'Membre').join(', '):t('Aucun bénéficiaire déclaré.','No beneficiary declared.')));
        const present=(md?.attendance??[]).filter(x=>['PRESENT','LATE','REPRESENTED'].includes(String(x.data?.attendance??''))).length;if(manage)card.append(make('small','',t('Présence renseignée : ','Attendance recorded: ')+present+' / '+members.filter(x=>x.status!=='left').length));
        const open=make('button','link-btn',t('Ouvrir cette séance','Open this session'));open.type='button';open.dataset.detailType='meeting';open.dataset.detailId=m.id;card.append(open);
      }else{
        if(future.length)for(const fm of future.slice(0,6)){const line=make('p','');line.textContent=meetingLabel(fm)+(fm.location?' · '+fm.location:'');card.append(line);}else card.append(make('p','hint',t('Aucune séance future programmée.','No future session scheduled.')));
      }timeGrid.append(card);
    }timeline.append(timeGrid);root.append(timeline);

    const finance=make('section','group-home-block');finance.append(make('h3','',manage?t('Situation financière et Recap du groupe','Group finance and recap'):t('Ma situation financière et mon Recap','My finance and recap')));
    if(manage){
      try{
        const [recap,ledger,arrears,shares]=await Promise.all([app.globalRecap(),app.ledger(),app.arrears().catch(()=>[]),app.listCompletion('TONTINE_SHARE').catch(()=>[])]);
        const positive=(recap.rows??[]).reduce((n,r)=>n+Number(r.positiveTotal??0),0),negativeMembers=(recap.rows??[]).reduce((n,r)=>n+Number(r.negativeTotal??0),0),backOffice=(recap.backOfficeExpenses??[]).reduce((n,x)=>n+Number(x.amount??0),0),openingEntries=(ledger.entries??[]).filter(e=>String(e.sourceType??'').toLowerCase().includes('opening')||String(e.descriptionCode??'').toLowerCase().includes('opening')),opening=openingEntries.length?openingEntries.reduce((n,e)=>n+(e.lines??[]).reduce((m,l)=>m+Math.max(0,Number(l.debit??0)-Number(l.credit??0)),0),0):undefined,balance=Number(recap.ledgerSummary?.cashBalance??0);
        const metrics=make('div','metrics small');for(const [label,value] of [[t('Solde initial / report','Opening / carryover'),opening===undefined?t('À renseigner','To record'):fmt(opening)],[t('Recettes depuis exercice','Exercise inflows'),fmt(positive)],[t('Dépenses depuis exercice','Exercise outflows'),fmt(negativeMembers+backOffice)]]){const card=make('div','metric');card.append(make('span','',label),make('strong','',value));metrics.append(card);}metrics.append(balanceCard(t('Solde caisse à ce jour','Cash balance today'),balance));finance.append(metrics,make('p','hint',t('Projection du Ledger/Récap canoniques : aucun deuxième calcul comptable n’est créé ici.','Projection of canonical Ledger/Recap: no second accounting engine is created here.')));
        const debt=make('div','stack');debt.append(make('h4','',t('Membres redevables / impayés / amendes','Members owing / arrears / fines')));if(arrears.length){const table=document.createElement('table');table.className='meeting-matrix';const head=document.createElement('thead'),hr=document.createElement('tr');for(const h of [t('Membre','Member'),t('Motif','Reason'),t('Restant','Outstanding'),t('Échéance','Due'),t('État','Status')])hr.append(make('th','',h));head.append(hr);table.append(head);const tbody=document.createElement('tbody');for(const row of arrears){const tr=document.createElement('tr'),member=members.find(m=>m.userId===row.assigneeId);tr.append(td(member?.displayName??row.assigneeId),td(row.title),td(amount(row,fmt)),td(row.dueAt?humanDate(row.dueAt):'—'),td(row.status));tbody.append(tr);}table.append(tbody);debt.append(table);}else debt.append(make('p','hint',t('Aucune créance ouverte connue à ce jour.','No known open receivable today.')));finance.append(debt);
        const ranking=make('div','stack');ranking.append(make('h4','',t('Classement Tontines','Tontine schedule')));const scheduled=shares.filter(x=>['SCHEDULED','SERVED'].includes(String(x.data?.completionState??''))).sort((a,b)=>Number(a.data?.scheduledRound??999)-Number(b.data?.scheduledRound??999)||Number(a.data?.scheduledSlot??999)-Number(b.data?.scheduledSlot??999));if(scheduled.length){const table=document.createElement('table');table.className='meeting-matrix';const head=document.createElement('thead'),hr=document.createElement('tr');for(const h of [t('Tour','Round'),t('Position','Slot'),t('Bénéficiaire','Beneficiary'),t('État','Status')])hr.append(make('th','',h));head.append(hr);table.append(head);const tb=document.createElement('tbody');for(const share of scheduled){const member=members.find(m=>m.id===String(share.data?.membershipId??'')),tr=document.createElement('tr');tr.append(td(share.data?.scheduledRound),td(share.data?.scheduledSlot),td(member?.displayName??share.title),td(share.data?.completionState));tb.append(tr);}table.append(tb);ranking.append(table);}else ranking.append(make('p','hint',t('Aucun classement de Tontine programmé.','No scheduled tontine ranking.')));finance.append(ranking);
      }catch{finance.append(make('div','empty-state',t('Situation financière momentanément indisponible. Aucune valeur de remplacement n’est inventée.','Financial situation temporarily unavailable. No substitute value is invented.')));}
    }else if(me?.membership?.id){
      try{
        const [sheet,arrears,shares]=await Promise.all([app.memberOperationalSheet(me.membership.id),app.arrears().catch(()=>[]),app.listCompletion('TONTINE_SHARE').catch(()=>[])]);let inflow=0,outflow=0;for(const r of sheet.exerciseMatrix??[])for(const cell of Object.values(r.cells??{})){inflow+=Number(cell?.inflow??0);outflow+=Number(cell?.outflow??0);}const net=inflow-outflow;
        const metrics=make('div','metrics small');for(const [label,value] of [[t('Recettes / cotisations','Inflows / contributions'),fmt(inflow)],[t('Dépenses / bénéfices reçus','Outflows / benefits'),fmt(outflow)]]){const c=make('div','metric');c.append(make('span','',label),make('strong','',value));metrics.append(c);}metrics.append(balanceCard(t('Ma balance connue','My known balance'),net));finance.append(metrics);
        const debt=make('div','stack');debt.append(make('h4','',t('Mes dettes / échéances','My debts / due items')));if(arrears.length)for(const row of arrears){const a=make('article','item');a.append(make('strong','',row.title),make('p','',amount(row,fmt)+' · '+(row.dueAt?humanDate(row.dueAt):t('sans échéance','no due date'))+' · '+row.status));debt.append(a);}else debt.append(make('p','hint',t('Aucune dette ouverte connue.','No known open debt.')));finance.append(debt);
        const ownShares=shares.filter(x=>String(x.data?.membershipId??'')===me.membership.id),tontine=make('div','stack');tontine.append(make('h4','',t('Ma situation Tontines','My tontine status')));if(ownShares.length)for(const share of ownShares){const a=make('article','item');a.append(make('strong','',share.title),make('p','',t('État : ','Status: ')+String(share.data?.completionState??'—')+(share.data?.scheduledRound?t(' · tour ',' · round ')+share.data.scheduledRound:'')));tontine.append(a);}else tontine.append(make('p','hint',t('Aucune part de Tontine liée à ce compte.','No tontine share linked to this account.')));finance.append(tontine);
        const ownBenefits=[];for(const m of focusMeetings){const data=meetingData.get(m.id);for(const d of data?.beneficiaries??[])if(String(d.data?.membershipId??'')===me.membership.id)ownBenefits.push({meeting:m,declaration:d});}const benefits=make('div','stack');benefits.append(make('h4','',t('Mes réceptions / Assistances / Collation','My benefits / assistance / local aid')));if(ownBenefits.length)for(const x of ownBenefits){const a=make('article','item');a.append(make('strong','',meetingLabel(x.meeting)),make('p','',fmt(Number(x.declaration.data?.amount??0))+' · '+String(x.declaration.status??'ACTIVE')));benefits.append(a);}else benefits.append(make('p','hint',t('Aucune réception programmée ou récente dans les séances affichées.','No scheduled or recent receipt in the displayed sessions.')));finance.append(benefits);
        const actions=make('div','actions');actions.append(action(t('Ma fiche individuelle','My individual sheet'),'operations','individualSheetsMode'),action(t('Simuler Tontines / Prêts','Simulate tontines / loans'),'finance'));finance.append(actions);
      }catch{finance.append(make('div','empty-state',t('Votre dernière situation n’est pas disponible dans ce contexte.','Your latest situation is not available in this context.')));}
    }else finance.append(make('div','empty-state',t('Aucune adhésion active trouvée pour ce compte.','No active membership found for this account.')));
    root.append(finance);
  }
  return{refresh};
}
