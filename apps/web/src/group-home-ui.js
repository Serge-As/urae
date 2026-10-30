import {contextLink} from './context-link.js';
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

export function mountGroupHomeUI({app,getGroups,getMembers,getMeetings,navigate,fmt,showError=console.error}){
  const root=byId('groupHomeContent');
  const scope=()=>JSON.stringify([app.currentTenant?.(),app.currentActor?.(),app.activeGroup()]);
  let refreshToken=0;
  const clearForContext=()=>{refreshToken++;root?.replaceChildren();root?.removeAttribute('aria-busy');};
  const action=(label,view,target,options={})=>{const b=make('button','secondary',label);b.type='button';b.onclick=()=>navigate(view,{anchor:target,force:true,...options});return b;};
  const balanceCard=(label,value)=>{const card=make('div','metric');card.append(make('span','',label));const strong=make('strong',Number(value)>=0?'safe':'error',fmt(Number(value)));card.append(strong);return card;};
  const projectionNotice=async paths=>{
    if(typeof app.projectionMeta!=='function')return{element:null,metadata:[]};
    const metadata=await Promise.all(paths.map(([path])=>app.projectionMeta(path).catch(()=>null))),element=make('div','group-home-sync');element.setAttribute('role','status');
    for(let i=0;i<paths.length;i++){
      const meta=metadata[i],label=paths[i][1];
      element.append(make('p','',label+' · '+(meta?.lastSyncedAt?t('dernière synchronisation : ','last synchronized: ')+humanDateTime(meta.lastSyncedAt):t('aucune synchronisation disponible sur cet appareil.','no synchronization available on this device.'))));
    }
    const pending=Math.max(0,...metadata.map(x=>Number(x?.pendingCount??0)));
    if(pending)element.append(make('p','',t('Opérations locales en attente de confirmation : ','Local operations awaiting confirmation: ')+pending+t('. Les différentes vues peuvent encore différer.','. Different views may still differ.')));
    if(navigator.onLine===false||app.transportState?.().degraded||app.serverBudgetState?.().blocked)element.prepend(make('p','',t('Lecture depuis cet appareil. Les données restent celles de leur dernière synchronisation.','Reading from this device. Data reflects its last synchronization.')));
    return{element,metadata};
  };

  async function refresh(){
    if(!root)return;
    const token=++refreshToken,capturedScope=scope(),isCurrent=()=>token===refreshToken&&scope()===capturedScope;
    root.replaceChildren();root.setAttribute('aria-busy','true');
    const group=getGroups().find(x=>x.id===app.activeGroup());
    if(!group){root.removeAttribute('aria-busy');root.append(make('div','empty-state',t('Sélectionnez un groupe pour afficher son Accueil.','Select a group to show its Home.')));return;}
    const loading=make('p','hint',t('Actualisation de la situation du groupe…','Updating the group overview…'));loading.setAttribute('role','status');root.append(loading);
    const members=getMembers(),meetings=getMeetings(),[me,passport,profile]=await Promise.all([
      app.groupMe().catch(()=>({isManager:false,membership:null})),
      app.groupIdentityPassport(false).catch(()=>null),
      app.groupIdentityProfile().catch(()=>({}))
    ]);
    if(!isCurrent())return;
    const manage=Boolean(me?.isManager),office=members.filter(m=>m.roles?.some(r=>managerRoles.has(r))),now=new Date();

    // Build off-screen: an obsolete response can never append private figures
    // to a new account/group, including after a failed optional request.
    const surface=make('div','group-home-surface');surface.dataset.groupKind=group.kind;
    const masthead=make('header','group-home-masthead'),heading=make('div','group-home-heading');
    heading.append(make('span','eyebrow',group.kind==='rotating_tontine'?t('TONTINE ROTATIVE · VUE DU CYCLE','ROTATING TONTINE · CYCLE OVERVIEW'):t('ASSOCIATION · VUE D’ENSEMBLE','ASSOCIATION · OVERVIEW')),make('h2','group-home-title',group.name),make('p','',t('Les repères pour comprendre. Les accès pour agir.','Understand your situation. Find your next action.')));
    const stamps=make('div','group-home-stamps');
    for(const text of [passport?.publicCode,group.currentExerciseLabel??group.launchProfileSnapshot?.cycle?.label,manage?t('Gestionnaire','Manager'):t('Membre','Member')].filter(Boolean))stamps.append(make('span','pill',text));
    masthead.append(heading,stamps);surface.append(masthead);
    const shortcuts=make('nav','group-home-shortcuts');shortcuts.setAttribute('aria-label',t('Agir dans ce groupe','Act in this group'));
    shortcuts.append(action(t('Séances & réunions','Sessions & meetings'),'sessions'),action(manage?t('Fiches des membres','Member sheets'):t('Ma fiche individuelle','My individual sheet'),'operations','twoSheetWorkspace',{sheetMode:'individual',membershipId:me?.membership?.id}),action(t('Approfondir · Récap','Explore · Recap'),'recap'));
    surface.append(shortcuts);
    surface.dataset.composition='panorama';
    const views=make('nav','eco-panorama-views');views.setAttribute('aria-label',t('Composition de l’accueil','Home composition'));
    const compositionKey='eco.groupComposition.'+scope();let saved='panorama';try{saved=localStorage.getItem(compositionKey)||'panorama';}catch{}if(['panorama','journal'].includes(saved))surface.dataset.composition=saved;
    for(const [mode,fr,en]of[['panorama','Panorama','Overview'],['atelier','Atelier de séance','Meeting workshop'],['journal','Journal du groupe','Group journal']]){const b=make('button','secondary',t(fr,en));b.type='button';b.setAttribute('aria-pressed',String(surface.dataset.composition===mode));b.onclick=()=>{if(mode==='atelier'){navigate('operations',{anchor:'twoSheetWorkspace',sheetMode:'meeting',force:true});return;}surface.dataset.composition=mode;try{localStorage.setItem(compositionKey,mode);}catch{}for(const other of views.querySelectorAll('button'))other.setAttribute('aria-pressed',String(other===b));};views.append(b);}surface.append(views);

    const identification=make('details','group-home-block group-home-identity');identification.append(make('summary','',t('Identité, Bureau et repères du groupe','Identity, office and group details')));
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
    identification.append(make('p','hint',t('Déclaration légale et durée des mandats : ces informations sont affichées seulement lorsqu’elles sont réellement renseignées ; aucune valeur n’est inventée.','Legal declaration and mandate dates are shown only when actually recorded; no value is invented.')));

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
      form.onsubmit=e=>void(async()=>{e.preventDefault();if(!isCurrent())return;try{save.disabled=true;await app.updateGroupIdentityProfile({declarationNumber:declarationNumber.value||undefined,declarationDate:declarationDate.value||undefined,officeMandateStart:mandateStart.value||undefined,officeMandateEnd:mandateEnd.value||undefined,note:note.value||undefined});if(isCurrent())await refresh();}catch(error){if(isCurrent())showError(error);}finally{save.disabled=false;}})();
      details.append(form);identification.append(details);
    }

    const actions=make('div','actions');actions.append(action(t('Nouvelle séance','New session'),'operations','meetingForm'),action(t('Anciennes séances','Previous sessions'),'operations','meetingList'),action(t('Fiches individuelles','Individual sheets'),'operations','individualSheetsMode'));
    if(manage)actions.append(action(t('Gérer les membres','Manage members'),'members','memberList'),action(t('Gérer / archiver les rubriques','Manage / archive rubrics'),'operations','rubricList'),action(t('Ouvrir le Récap','Open Recap'),'recap'));identification.append(actions);
    const ref=make('details','');ref.append(make('summary','',t('Référence technique','Technical reference')),make('code','',group.id),make('p','hint',t('Le code ECO-GRP identifie le groupe sans donner d’accès. L’ID technique reste secondaire.','The ECO-GRP code identifies the group without granting access. The technical ID remains secondary.')));identification.append(ref);

    const starter=await app.starterKit(group.id).catch(()=>null);
    if(!isCurrent())return;
    let kitPanel;
    if(starter){
      const kit=make('details','group-home-block group-home-kit');kit.id='groupStarterKit';kit.append(make('summary','',t('Kit prêt à l’emploi du groupe · préparation et simulations','Group ready-to-use kit · planning and simulations')));
      const parse=value=>{try{return JSON.parse(String(value??''));}catch{return[];}};
      const checklist=parse(starter.data?.checklistJson),risks=parse(starter.data?.risksJson),calendar=parse(starter.data?.calendarJson),rubricRows=parse(starter.data?.rubricRowsJson),rules=parse(starter.data?.rulesJson);
      const metrics=make('div','metrics small');
      for(const [label,value] of [
        [t('Volume collectif simulé','Simulated collective volume'),fmt(Number(starter.data?.monetaryVolume??0))],
        [t('Frais de gestion simulés','Simulated management fees'),fmt(Number(starter.data?.managerFees??0))],
        [t('Coûts externes estimés','Estimated external costs'),fmt(Number(starter.data?.estimatedExternal??0)+Number(starter.data?.fixedCosts??0))],
        [t('Marge de gestion indicative','Indicative manager margin'),fmt(Number(starter.data?.estimatedMargin??0))]
      ]){const c=make('div','metric');c.append(make('span','',label),make('strong','',value));metrics.append(c);}kit.append(metrics);
      const status=make('div','two-col'),todo=make('article','item'),risk=make('article','item');todo.append(make('strong','',t('Checklist de lancement','Launch checklist')),make('p','hint',checklist.length?t(checklist.length+' point(s) générés. Utilisez le Kit imprimable pour les cocher et les adapter.','Generated points: '+checklist.length+'. Use the printable kit to check and adapt them.'):t('Checklist non disponible.','Checklist unavailable.')));risk.append(make('strong','',t('Risques / décisions à compléter','Risks / decisions to complete')),make('p','hint',risks.length?risks.join(' • '):t('Aucun blocage détecté par le Kit.','No blocking item detected by the kit.')));status.append(todo,risk);kit.append(status);
      const actions=make('div','actions');
      const print=make('button','primary',t('Ouvrir / imprimer le Kit','Open / print kit'));print.type='button';print.onclick=()=>{
        const w=window.open('','_blank','noopener,noreferrer,width=900,height=800');if(!w)return;
        const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const list=items=>'<ul>'+items.map(x=>'<li>'+esc(Array.isArray(x)?'['+x[0]+'] '+x[1]:x)+'</li>').join('')+'</ul>';
        const html='<!doctype html><meta charset="utf-8"><title>'+esc(starter.title)+'</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:30px auto;padding:0 20px;line-height:1.45}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #bbb;padding:7px}pre{white-space:pre-wrap;border:1px solid #ccc;padding:12px}@media print{button{display:none}}</style><h1>'+esc(starter.title)+'</h1><h2>Checklist</h2>'+list(checklist)+'<h2>Règlement type</h2>'+list(rules)+'<h2>Rubriques</h2><table><tr><th>Rubrique</th><th>Mode</th><th>Montant</th><th>Volume cycle</th><th>Frais gestion</th></tr>'+rubricRows.map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+esc(r.mode)+'</td><td>'+esc(r.amount)+'</td><td>'+esc(r.nominalCycle)+'</td><td>'+esc(r.fees)+'</td></tr>').join('')+'</table><h2>Calendrier</h2>'+list(calendar.map(x=>x.label+' · '+x.date))+'<h2>Risques</h2>'+list(risks.length?risks:['Aucun blocage détecté.'])+'<h2>Invitation</h2><pre>'+esc(starter.data?.invitation)+'</pre><h2>PV</h2><pre>'+esc(starter.data?.minutes)+'</pre><button onclick="print()">Imprimer / Enregistrer en PDF</button>';
        w.document.open();w.document.write(html);w.document.close();
      };
      actions.append(print);
      if(manage)actions.append(action(t('Ouvrir Business Studio','Open Business Studio'),'ecosystem','businessStudioOperational'));
      kit.append(actions);kitPanel=kit;
    }else if(manage){
      const missing=make('details','group-home-block group-home-kit');missing.append(make('summary','',t('Kit prêt à l’emploi','Ready-to-use kit')),make('p','hint',t('Ce groupe historique ne possède pas encore de Kit canonique. Utilisez Créer / intégrer pour préparer un nouveau Kit sans altérer ses écritures existantes.','This historical group does not yet have a canonical kit. Use Create / integrate to prepare one without altering existing entries.')));kitPanel=missing;
    }

    const ordered=meetings.slice().sort((a,b)=>meetingTime(a)-meetingTime(b)),current=ordered.find(x=>x.status==='open')??ordered.find(x=>meetingTime(x)>=now.getTime()),currentIndex=current?ordered.findIndex(x=>x.id===current.id):-1,previous=currentIndex>0?ordered[currentIndex-1]:ordered.filter(x=>meetingTime(x)<now.getTime()).at(-1),future=currentIndex>=0?ordered.slice(currentIndex+1):ordered.filter(x=>meetingTime(x)>now.getTime()),focusMeetings=[previous,current,...future.slice(0,4)].filter((x,i,a)=>x&&a.findIndex(y=>y?.id===x.id)===i);
    const declarationPairs=await Promise.all(focusMeetings.map(async m=>[m.id,await app.meetingBeneficiaries(m.id).catch(()=>[]),await app.meetingAttendance(m.id).catch(()=>[])])),meetingData=new Map(declarationPairs.map(([id,beneficiaries,attendance])=>[id,{beneficiaries,attendance}]));
    if(!isCurrent())return;
    const next=make('aside','group-home-next');next.append(make('span','eyebrow',t('LE PROCHAIN RENDEZ-VOUS','YOUR NEXT SESSION')),make('h3','',current?meetingLabel(current):t('Un calendrier à préparer','Plan your next session')));
    if(current){
      next.append(make('span','group-home-session-state',current.status==='open'?t('Séance ouverte','Session open'):t('Séance programmée','Session scheduled')),make('p','',current.title),make('p','',current.location||t('Lieu à préciser','Location to confirm')));
      const beneficiaries=meetingData.get(current.id)?.beneficiaries??[];
      if(beneficiaries.length)next.append(make('p','',t('Bénéficiaires déclarés : ','Declared beneficiaries: ')+beneficiaries.map(x=>x.displayName??members.find(m=>m.id===x.data?.membershipId)?.displayName??t('Membre','Member')).join(', ')));
      next.append(action(t('Ouvrir la séance →','Open session →'),'sessions',undefined,{meetingId:current.id}));
    }else{next.append(make('p','',t('Aucune séance à venir enregistrée. Retrouvez l’historique ou préparez la prochaine.','No upcoming session recorded. Visit the history or prepare your next session.')),action(manage?t('Préparer une séance','Prepare a session'):t('Voir les séances','View sessions'),manage?'operations':'sessions',manage?'meetingForm':undefined));}
    next.append(make('small','',t('Une date programmée ou un bénéficiaire déclaré ne vaut pas preuve de paiement.','A scheduled date or declared beneficiary is not proof of payment.')));
    const timeline=make('section','group-home-block eco-group-journal');timeline.append(make('h3','',t('Classement / calendrier : séance précédente · actuelle · prochaines','Schedule: previous · current · upcoming')));
    const timeGrid=make('div','three-col'),temporal=[['Séance précédente',previous],['Séance actuelle / prochaine',current],['Séances suivantes',null]];
    for(const [label,m] of temporal){
      const card=make('article','item');card.append(make('strong','',t(label,label==='Séance précédente'?'Previous session':label==='Séance actuelle / prochaine'?'Current / next session':'Upcoming sessions')));
      if(m){
        card.append(make('p','',meetingLabel(m)),make('p','hint',[m.location?('Lieu : '+m.location):null,m.theme?('Thème : '+m.theme):null,m.dressCode?('Tenue : '+m.dressCode):null].filter(Boolean).join(' · ')||t('Lieu / thème / tenue non renseignés.','Location / theme / dress not provided.')));
        const md=meetingData.get(m.id),beneficiaries=md?.beneficiaries??[];card.append(make('p','',beneficiaries.length?t('Bénéficiaires : ','Beneficiaries: ')+beneficiaries.map(x=>x.displayName??members.find(mm=>mm.id===x.data?.membershipId)?.displayName??'Membre').join(', '):t('Aucun bénéficiaire déclaré.','No beneficiary declared.')));
        const present=(md?.attendance??[]).filter(x=>['PRESENT','LATE','REPRESENTED'].includes(String(x.data?.attendance??''))).length;if(manage)card.append(make('small','',t('Présence renseignée : ','Attendance recorded: ')+present+' / '+members.filter(x=>x.status!=='left').length));
        const open=make('button','link-btn',t('Ouvrir cette séance','Open this session'));open.type='button';open.dataset.detailType='meeting';open.dataset.detailId=m.id;card.append(open);
      }else{
        if(label==='Séance précédente')card.append(make('p','hint',t('Aucune séance précédente enregistrée.','No previous session recorded.')));
        else if(future.length)for(const fm of future.slice(0,6)){const line=make('p','');line.textContent=meetingLabel(fm)+(fm.location?' · '+fm.location:'');card.append(line);}else card.append(make('p','hint',t('Aucune séance future programmée.','No future session scheduled.')));
      }timeGrid.append(card);
    }timeline.append(timeGrid);

    const finance=make('section','group-home-block group-home-finance');finance.append(make('span','eyebrow',manage?t('L’ESSENTIEL DU GROUPE','GROUP AT A GLANCE'):t('MON POINT DE SITUATION','MY SITUATION')),make('h3','',manage?t('Situation financière et Recap du groupe','Group finance and recap'):t('Ma situation financière et mon Recap','My finance and recap')));
    if(manage){
      try{
        const [recap,ledger,arrearsResult,sharesResult,loansResult,exercises]=await Promise.all([app.globalRecap(),app.ledger(),app.arrears().catch(()=>null),app.listCompletion('TONTINE_SHARE').catch(()=>null),app.listCompletion('LOAN').catch(()=>null),app.exercises?.().catch(()=>[])??[]]);
        if(!isCurrent())return;
        const base='/api/v1/groups/'+encodeURIComponent(group.id),freshness=await projectionNotice([[base+'/ledger',t('Trésorerie','Treasury')],[base+'/recap/global',t('Récap','Recap')]]);
        if(!isCurrent())return;
        const cashKnown=freshness.metadata[0]?.availability!=='UNAVAILABLE';
        const arrears=arrearsResult??[],shares=sharesResult??[],loans=loansResult??[];
        const positive=(recap.rows??[]).reduce((n,r)=>n+Number(r.positiveTotal??0),0),negativeMembers=(recap.rows??[]).reduce((n,r)=>n+Number(r.negativeTotal??0),0),backOffice=(recap.backOfficeExpenses??[]).reduce((n,x)=>n+Number(x.amount??0),0);
        const exercise=exercises.find(x=>['OPEN','CLOSING'].includes(String(x.data?.completionState))),opening=exercise?.data?.openingCash;
        const metrics=make('div','metrics small group-home-metrics'),cash=make('div','metric group-home-cash');
        cash.append(make('span','',t('Solde de caisse · Ledger','Cash balance · Ledger')),make('strong',Number(ledger.summary?.cashBalance)<0?'error':'',!cashKnown||ledger.summary?.cashBalance==null?'—':fmt(ledger.summary.cashBalance)),make('small','',ledger.summary?.currency??'XAF'));metrics.append(cash);
        for(const [label,value,note] of [
          [t('Ouverture / report','Opening / carryover'),opening==null?'—':fmt(Number(opening)),exercise?.title??t('Exercice ouvert non renseigné','No open exercise recorded')],
          [t('Entrées du Récap','Recap inflows'),fmt(positive),t('Totaux des fiches affichées','Totals of displayed sheets')],
          [t('Sorties du Récap','Recap outflows'),fmt(negativeMembers+backOffice),t('Fiches et back-office','Sheets and back-office')],
          [t('Fonds des membres','Member funds'),!cashKnown||ledger.summary?.memberFundsLiability==null?'—':fmt(ledger.summary.memberFundsLiability),t('Engagement du groupe · hors revenus','Group liability · not revenue')]
        ]){const card=make('div','metric');card.append(make('span','',label),make('strong','',value),make('small','',note));metrics.append(card);}
        finance.append(metrics,make('p','hint',t('Projection du Ledger/Récap canoniques : cette page Accueil ne recalcule pas une seconde comptabilité. Les entrées et sorties du Récap peuvent inclure des ajustements manuels ; elles ne reconstituent pas le solde de caisse.','Projection of canonical Ledger/Recap: this Home page does not calculate a second accounting truth. Recap inflows and outflows may include manual adjustments; they do not reconstruct the cash balance.')));
        if(freshness.element)finance.append(freshness.element);
        if((ledger.receipts??[]).some(x=>x.localPending))finance.append(make('p','truth-notice',t('Cette projection inclut des saisies locales en attente de synchronisation.','This projection includes local entries awaiting synchronization.')));
        const preview=make('section','group-home-recap'),previewHead=make('div','panel-head');previewHead.append(make('h4','',t('Feuille récapitulative · aperçu','Summary sheet · preview')),action(t('Voir tout le Récap →','Open full Recap →'),'recap'));preview.append(previewHead);
        const columns=(recap.layout?.columns??[]).slice(0,5),rows=recap.rows??[];
        if(rows.length){
          const wrap=make('div','matrix-wrap group-home-table');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',t('Aperçu du Récap, défilement horizontal possible','Recap preview, scroll horizontally'));
          const table=make('table','meeting-matrix'),head=make('thead'),hr=make('tr');table.append(make('caption','sr-only',t('Récap canonique : 8 membres et 5 rubriques au maximum. Le détail reste disponible dans Récap.','Canonical Recap: up to 8 members and 5 categories. Full details remain in Recap.')));
          for(const label of [t('Membre','Member'),...columns.map(c=>c.label??c.name??c.id),t('Total de fiche','Sheet total')])hr.append(make('th','',label));head.append(hr);table.append(head);
          const body=make('tbody');for(const row of rows.slice(0,8)){const tr=make('tr'),name=make('th'),open=make('button','link-btn',row.displayName);open.type='button';open.dataset.detailType='member';open.dataset.detailId=row.membershipId;name.scope='row';name.append(open);tr.append(name);for(const column of columns){const value=row.cells?.[column.id]?.displayAmount;tr.append(td(value==null?'—':fmt(value)));}tr.append(td(row.total==null?'—':fmt(row.total)));body.append(tr);}table.append(body);wrap.append(table);preview.append(wrap);
          preview.append(make('p','hint',t('Aperçu de '+Math.min(rows.length,8)+' / '+rows.length+' membres. Les montants reprennent les fiches ; ils ne sont ni des revenus personnels ni une promesse de gain.','Preview of '+Math.min(rows.length,8)+' / '+rows.length+' members. These figures reflect sheets; they are not personal earnings or promised returns.')));
        }else preview.append(make('p','empty-state',t('Aucune ligne de Récap enregistrée pour ce groupe.','No Recap rows recorded for this group.')));
        finance.append(preview);
        const debt=make('div','stack');debt.append(make('h4','',t('Membres redevables / impayés / amendes · prêts · intérêts','Members owing / arrears / fines · loans · interest')));
        const debtRows=[];
        for(const m of members.filter(x=>x.status!=='left')){
          const memberLoans=loans.filter(x=>String(x.data?.borrowerMembershipId??'')===m.id&&['DISBURSED','REPAYING'].includes(String(x.data?.completionState??'')));
          const principal=memberLoans.reduce((n,x)=>n+Number(x.data?.outstandingPrincipal??0),0),interest=memberLoans.reduce((n,x)=>n+Number(x.data?.unpaidInterest??0),0),memberArrears=arrears.filter(x=>x.assigneeId===m.userId&&Number(x.outstanding??0)>0),other=memberArrears.reduce((n,x)=>n+Number(x.outstanding??0),0),total=principal+interest+other;
          if(total>0)debtRows.push({member:m,principal,interest,other,total,memberLoans});
        }
        if(debtRows.length){
          const wrap=make('div','matrix-wrap'),table=document.createElement('table');table.className='meeting-matrix';const head=document.createElement('thead'),hr=document.createElement('tr');for(const h of [t('Membre','Member'),t('Capital prêt','Loan principal'),t('Intérêts dus','Interest due'),t('Autres impayés','Other arrears'),t('Dette totale','Total debt')])hr.append(make('th','',h));head.append(hr);table.append(head);const tbody=document.createElement('tbody');
          for(const d of debtRows){const tr=document.createElement('tr'),name=td(''),open=make('button','link-btn',d.member.displayName);open.type='button';open.dataset.detailType='member';open.dataset.detailId=d.member.id;name.append(open);tr.append(name,td(fmt(d.principal)),td(fmt(d.interest)),td(fmt(d.other)),td(fmt(d.total)));tbody.append(tr);}
          const totals=debtRows.reduce((a,d)=>({principal:a.principal+d.principal,interest:a.interest+d.interest,other:a.other+d.other,total:a.total+d.total}),{principal:0,interest:0,other:0,total:0}),tr=document.createElement('tr');tr.className='table-total-row';tr.append(make('th','',t('TOTAL','TOTAL')),td(fmt(totals.principal)),td(fmt(totals.interest)),td(fmt(totals.other)),td(fmt(totals.total)));tbody.append(tr);table.append(tbody);wrap.append(table);debt.append(wrap,make('p','hint',t('La dette totale additionne le capital restant, les intérêts déjà dus et les autres obligations. Un intérêt ajouté à la clôture d’une séance est porté sur la séance suivante.','Total debt includes outstanding principal, accrued interest and other obligations. Interest added when a session closes is assigned to the next session.')));
        }else debt.append(make('p','hint',arrearsResult&&loansResult?t('Aucune créance ouverte connue à ce jour.','No known open receivable today.'):t('Certaines données de dettes sont indisponibles. Consultez les fiches avant de conclure.','Some debt data is unavailable. Check the statements before drawing a conclusion.')));if(!arrearsResult||!loansResult)debt.append(make('p','truth-notice',t('Vue partielle : prêts ou impayés indisponibles.','Partial view: loans or arrears unavailable.')));finance.append(debt);
        const scheduled=shares.filter(x=>['SCHEDULED','SERVED'].includes(String(x.data?.completionState??''))).sort((a,b)=>Number(a.data?.scheduledRound??999)-Number(b.data?.scheduledRound??999)||Number(a.data?.scheduledSlot??999)-Number(b.data?.scheduledSlot??999));
        if(group.kind==='rotating_tontine'||scheduled.length){
          const ranking=make('section','group-home-rounds'),head=make('div','panel-head');head.append(make('h4','',t('Le cycle, tour après tour','Your cycle, round by round')),action(t('Gérer les tontines →','Manage tontines →'),'tontines'));ranking.append(head);
          if(scheduled.length){
            const served=scheduled.filter(x=>x.data.completionState==='SERVED').length;ranking.append(make('p','hint',t(served+' / '+scheduled.length+' parts au statut « servi ». Le calendrier et les paiements restent vérifiables dans Tontines.',served+' / '+scheduled.length+' shares marked “served”. Check schedules and payment evidence in Tontines.')));
            const wrap=make('div','matrix-wrap group-home-table');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',t('Calendrier des tours de tontine','Tontine rounds schedule'));
            const table=make('table','meeting-matrix'),thead=make('thead'),hr=make('tr');for(const h of [t('Tour','Round'),t('Position','Slot'),t('Bénéficiaire','Beneficiary'),t('État enregistré','Recorded status')])hr.append(make('th','',h));thead.append(hr);table.append(thead);
            const body=make('tbody');for(const share of scheduled.slice(0,12)){const member=members.find(m=>m.id===String(share.data?.membershipId??'')),tr=make('tr');tr.dataset.roundState=share.data.completionState;tr.append(td(share.data.scheduledRound),td(share.data.scheduledSlot),td(member?.displayName??share.title),td(share.data.completionState==='SERVED'?t('Servi','Served'):t('Programmé','Scheduled')));body.append(tr);}table.append(body);wrap.append(table);ranking.append(wrap);
            if(scheduled.length>12)ranking.append(make('p','hint',t('12 premières parts affichées. Le calendrier complet est dans Tontines.','First 12 shares shown. The full schedule is in Tontines.')));
          }else ranking.append(make('p','empty-state',sharesResult?t('Aucun classement de Tontine programmé.','No scheduled tontine ranking.'):t('Calendrier des tours momentanément indisponible.','Round schedule is temporarily unavailable.')));
          if(group.kind==='rotating_tontine')finance.insertBefore(ranking,preview);else finance.append(ranking);
        }
      }catch{finance.append(make('div','empty-state',t('Situation financière momentanément indisponible. Aucune valeur de remplacement n’est inventée.','Financial situation temporarily unavailable. No substitute value is invented.')));}
    }else if(me?.membership?.id){
      try{
        const [sheet,arrearsResult,sharesResult,statement]=await Promise.all([app.memberOperationalSheet(me.membership.id),app.arrears().catch(()=>null),app.listCompletion('TONTINE_SHARE').catch(()=>null),app.memberStatement(me.membership.id).catch(()=>null)]);if(!isCurrent())return;const arrears=arrearsResult??[],shares=sharesResult??[];let inflow=0,outflow=0;for(const r of sheet.exerciseMatrix??[])for(const cell of Object.values(r.cells??{})){inflow+=Number(cell?.inflow??0);outflow+=Number(cell?.outflow??0);}const net=inflow-outflow;
        const metrics=make('div','metrics small group-home-metrics');for(const [label,value] of [[t('Recettes / cotisations','Inflows / contributions'),fmt(inflow)],[t('Dépenses / bénéfices reçus','Outflows / benefits'),fmt(outflow)]]){const c=make('div','metric');c.append(make('span','',label),make('strong','',value));metrics.append(c);}metrics.append(balanceCard(t('Flux nets de ma fiche','Net flows on my sheet'),net));finance.append(metrics,make('p','hint',t('Ces flux décrivent votre fiche. Ils ne sont pas un portefeuille disponible ou des gains promis.','These flows describe your sheet. They are not a spendable wallet or promised earnings.')));
        const memberBase='/api/v1/groups/'+encodeURIComponent(group.id)+'/members/'+encodeURIComponent(me.membership.id),freshness=await projectionNotice([[memberBase+'/operational-sheet',t('Ma fiche','My sheet')],[memberBase+'/statement',t('Mes dettes','My debts')]]);
        if(!isCurrent())return;
        if(freshness.element)finance.append(freshness.element);
        const debt=make('div','stack');debt.append(make('h4','',t('Mes dettes / échéances','My debts / due items')));
        if(statement&&Number(statement.totalDebt??0)>0){
          const summary=make('article','item debt-summary-card');
          summary.append(make('strong','',t('Dette totale : ','Total debt: ')+fmt(Number(statement.totalDebt??0))),make('p','',t('Capital prêts : ','Loan principal: ')+fmt(Number(statement.debtPrincipal??0))+' · '+t('Intérêts dus : ','Interest due: ')+fmt(Number(statement.debtInterest??0))+' · '+t('Autres : ','Other: ')+fmt(Number(statement.otherDebt??0))));
          debt.append(summary);
          for(const loan of statement.loanDebts??[]){if(Number(loan.totalDebt??0)<=0)continue;const a=make('article','item');a.append(make('strong','',loan.title??t('Prêt','Loan')),make('p','',t('Capital restant : ','Outstanding principal: ')+fmt(Number(loan.outstandingPrincipal??0))+' · '+t('Intérêts : ','Interest: ')+fmt(Number(loan.unpaidInterest??0))));if(Number(loan.lastAccruedInterest??0)>0)a.append(make('small','',t('Dernier intérêt ajouté : ','Latest accrued interest: ')+fmt(Number(loan.lastAccruedInterest??0))+' · '+t('concerne ','applies to ')+(loan.interestAppliesToLabel??t('séance suivante','next session'))));debt.append(a);}
        }
        for(const row of arrears){const a=make('article','item');a.append(make('strong','',row.title),make('p','',amount(row,fmt)+' · '+(row.dueAt?humanDate(row.dueAt):t('sans échéance','no due date'))+' · '+row.status));debt.append(a);}
        if(debt.childElementCount===1)debt.append(make('p','hint',statement&&arrearsResult?t('Aucune dette ouverte connue.','No known open debt.'):t('Situation des dettes partiellement indisponible. Consultez votre fiche avant de conclure.','Debt information is partially unavailable. Check your statement before drawing a conclusion.')));finance.append(debt);
        const ownShares=shares.filter(x=>String(x.data?.membershipId??'')===me.membership.id),tontine=make('div','stack');tontine.append(make('h4','',t('Ma situation Tontines','My tontine status')));if(ownShares.length)for(const share of ownShares){const a=make('article','item');a.append(make('strong','',share.title),make('p','',t('État : ','Status: ')+String(share.data?.completionState??'—')+(share.data?.scheduledRound?t(' · tour ',' · round ')+share.data.scheduledRound:'')));tontine.append(a);}else tontine.append(make('p','hint',t('Aucune part de Tontine liée à ce compte.','No tontine share linked to this account.')));finance.append(tontine);
        const ownBenefits=[];for(const m of focusMeetings){const data=meetingData.get(m.id);for(const d of data?.beneficiaries??[])if(String(d.data?.membershipId??'')===me.membership.id)ownBenefits.push({meeting:m,declaration:d});}const benefits=make('div','stack');benefits.append(make('h4','',t('Mes réceptions / Assistances / Collation','My benefits / assistance / local aid')));if(ownBenefits.length)for(const x of ownBenefits){const a=make('article','item');a.append(make('strong','',meetingLabel(x.meeting)),make('p','',fmt(Number(x.declaration.data?.amount??0))+' · '+String(x.declaration.status??'ACTIVE')));benefits.append(a);}else benefits.append(make('p','hint',t('Aucune réception programmée ou récente dans les séances affichées.','No scheduled or recent receipt in the displayed sessions.')));finance.append(benefits);
        const actions=make('div','actions');actions.append(action(t('Ma fiche individuelle','My individual sheet'),'operations','twoSheetWorkspace',{sheetMode:'individual',membershipId:me.membership.id}),action(t('Simuler Tontines / Prêts','Simulate tontines / loans'),'finance'));finance.append(actions);
      }catch{finance.append(make('div','empty-state',t('Votre dernière situation n’est pas disponible dans ce contexte.','Your latest situation is not available in this context.')));}
    }else finance.append(make('div','empty-state',t('Aucune adhésion active trouvée pour ce compte.','No active membership found for this account.')));
    if(!isCurrent())return;
    const people=make('section','eco-group-people');people.append(make('span','eyebrow',t('UN GROUPE, DES PERSONNES','PEOPLE MAKE THE GROUP')),make('h3','',t('Participer, s’entraider, décider','Participate, support, decide')));
    const figures=make('div','eco-people-figures');for(const [n,label]of [[members.filter(m=>m.status==='active').length,t('membres actifs','active members')],[office.length,t('responsables','managers')],[meetings.filter(m=>m.status==='open').length,t('séances ouvertes','open meetings')]]){const line=make('div');line.append(make('strong','',String(n)),make('span','',label));figures.append(line);}people.append(figures);
    const faces=make('div','eco-member-landmarks');for(const member of members.filter(m=>m.status==='active').slice(0,6)){const a=contextLink(member.displayName,'member',member.id);a.classList.add('eco-member-landmark');faces.append(a);}people.append(faces,action(t('Retrouver tous les membres','Find all members'),'members'),action(t('Ouvrir le forum du groupe','Open group forum'),'ecosystem','communityEnginePanel'));
    const main=make('div','group-home-main');main.append(finance,next,people);surface.append(main);
    const doors=make('section','group-home-doors');doors.append(make('span','eyebrow',t('FAIRE GRANDIR NOS POSSIBILITÉS','GROW OUR POSSIBILITIES')),make('h3','',t('Entreprendre, échanger, avancer ensemble','Trade, connect and move forward together')));
    const doorGrid=make('div','group-home-door-grid');
    for(const [fr,en,detailFr,detailEn,module,anchor] of [
      ['Boutiques','Shops','Acheter, vendre et suivre les commandes','Buy, sell and track orders','MARKETPLACE.CORE'],
      ['Forum & entraide','Forum & support','Partager une question ou une expérience','Share a question or experience',null,'communityEnginePanel'],
      ['Opportunités','Opportunities','Proposer une offre ou exprimer un besoin','Post an offer or describe a need',null,'valueNetworkOperational'],
      ['AdManager','AdManager','Préparer une proposition publicitaire','Prepare an advertising proposal',null,'adManagerPanel'],
      ['Studio médias','Media studio','Personnaliser les visuels autorisés','Customize the visuals you can manage',null,'ecoVisualMediaStudio'],
      ['Tous les services','All services','Trouver une capacité pour votre projet','Find a capability for your project',null,null]
    ]){const b=make('button','group-home-door');b.type='button';b.append(make('strong','',t(fr,en)),make('span','',t(detailFr,detailEn)),make('span','group-home-door-arrow','↗'));if(module)b.dataset.moduleOpen=module;else b.onclick=()=>navigate(anchor?'ecosystem':'services',{anchor,force:true});doorGrid.append(b);}
    doors.append(doorGrid);surface.append(doors,timeline,identification);if(kitPanel)surface.append(kitPanel);
    surface.append(make('p','group-home-asof',t('Situation consultée le ','Viewed on ')+humanDateTime(now)+t(' · selon vos droits d’accès.',' · subject to your access rights.')));
    root.replaceChildren(surface);root.removeAttribute('aria-busy');
  }
  return{refresh,clearForContext};
}
