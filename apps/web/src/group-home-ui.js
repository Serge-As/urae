const byId=id=>document.getElementById(id);
const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
const humanDate=value=>{try{return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'fr-FR',{dateStyle:'long'}).format(new Date(value));}catch{return String(value??'—');}};
const humanDateTime=value=>{try{return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value??'—');}};
const t=(fr,en)=>document.documentElement.lang==='en'?en:fr;
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const meetingTime=m=>new Date(m?.scheduledAt??m?.openedAt??m?.createdAt??0).getTime();
const meetingLabel=m=>t('Réunion du ','Meeting on ')+humanDate(m?.scheduledAt??m?.openedAt??m?.createdAt);

export function mountGroupHomeUI({app,getGroups,getMembers,getMeetings,navigate,fmt}){
  const root=byId('groupHomeContent');
  const action=(label,view,target)=>{const b=make('button','secondary',label);b.type='button';b.onclick=()=>{navigate(view);if(target)setTimeout(()=>byId(target)?.scrollIntoView({behavior:'smooth',block:'start'}),120);};return b;};

  async function refresh(){
    if(!root)return;
    root.replaceChildren();
    const group=getGroups().find(x=>x.id===app.activeGroup());
    if(!group){root.append(make('div','empty-state',t('Sélectionnez un groupe pour afficher son Accueil.','Select a group to show its Home.')));return;}
    const members=getMembers(),meetings=getMeetings(),me=await app.groupMe().catch(()=>({isManager:false,membership:null}));
    const manage=Boolean(me?.isManager);
    const office=members.filter(m=>m.roles?.some(r=>managerRoles.has(r)));
    const now=new Date();

    const identification=make('section','group-home-block');
    identification.append(make('h3','',t('Identification du groupe','Group identification')));
    const grid=make('div','metrics small');
    const fields=[
      [t('Groupe','Group'),group.name],
      [t('Type','Type'),group.kind==='rotating_tontine'?t('Tontine rotative','Rotating tontine'):t('Association / groupe','Association / group')],
      [t('Création réelle','Actual creation'),humanDate(group.historicalCreatedAt??group.createdAt)],
      [t('Mise en ligne','Platform entry'),humanDate(group.createdAt)],
      [t('Aujourd’hui','Today'),humanDateTime(now)],
      [t('Membres','Members'),String(members.filter(x=>x.status!=='left').length)],
      [t('Exercice / cycle','Exercise / cycle'),group.currentExerciseLabel??group.launchProfileSnapshot?.cycle?.label??t('À compléter','To complete')]
    ];
    for(const [label,value] of fields){const card=make('div','metric');card.append(make('span','',label),make('strong','',value));grid.append(card);}
    identification.append(grid);
    const officeBox=make('div','item');officeBox.append(make('strong','',t('Bureau / responsables','Office / managers')));
    officeBox.append(make('p','hint',office.length?office.map(x=>x.displayName+' · '+x.roles.filter(r=>managerRoles.has(r)).join(', ')).join(' • '):t('Composition à compléter selon la gouvernance du groupe.','Composition to complete according to group governance.')));
    const legal=make('p','hint',t('Déclaration légale et durée des mandats : afficher uniquement lorsqu’elles sont réellement renseignées dans le profil gouverné du groupe ; aucune valeur n’est inventée.','Legal declaration and mandate dates: shown only when actually recorded in the governed group profile; no value is invented.'));
    identification.append(officeBox,legal);

    const actions=make('div','actions');
    actions.append(action(t('Nouvelle séance','New session'),'operations','meetingForm'),action(t('Anciennes séances','Previous sessions'),'operations','meetingList'),action(t('Fiches individuelles','Individual sheets'),'operations','individualSheetsMode'));
    identification.append(actions);
    const ref=make('details','');const summary=make('summary','',t('Référence technique du groupe','Group technical reference'));const code=make('code','',group.id);ref.append(summary,code);identification.append(ref);
    root.append(identification);

    const timeline=make('section','group-home-block');timeline.append(make('h3','',t('Séances : précédente · en cours · prochaines','Sessions: previous · current · upcoming')));
    const ordered=meetings.slice().sort((a,b)=>meetingTime(a)-meetingTime(b));
    const current=ordered.find(x=>x.status==='open')??ordered.find(x=>meetingTime(x)>=now.getTime());
    const currentIndex=current?ordered.findIndex(x=>x.id===current.id):-1;
    const previous=currentIndex>0?ordered[currentIndex-1]:ordered.filter(x=>meetingTime(x)<now.getTime()).at(-1);
    const future=currentIndex>=0?ordered.slice(currentIndex+1):ordered.filter(x=>meetingTime(x)>now.getTime());
    const timeGrid=make('div','three-col');
    for(const [label,value] of [
      [t('Séance précédente','Previous session'),previous?meetingLabel(previous):t('Aucune','None')],
      [t('Séance actuelle / prochaine','Current / next session'),current?meetingLabel(current):t('À programmer','To schedule')],
      [t('À venir','Upcoming'),future.length?future.slice(0,4).map(meetingLabel).join(' • '):t('Aucune séance programmée','No scheduled session')]
    ]){const card=make('article','item');card.append(make('strong','',label),make('p','',value));timeGrid.append(card);}
    timeline.append(timeGrid);root.append(timeline);

    const finance=make('section','group-home-block');finance.append(make('h3','',manage?t('Situation financière du groupe','Group financial situation'):t('Votre situation dans ce groupe','Your situation in this group')));
    if(manage){
      try{
        const [recap,ledger]=await Promise.all([app.globalRecap(),app.ledger()]);
        const positive=(recap.rows??[]).reduce((n,r)=>n+Number(r.positiveTotal??0),0);
        const negativeMembers=(recap.rows??[]).reduce((n,r)=>n+Number(r.negativeTotal??0),0);
        const backOffice=(recap.backOfficeExpenses??[]).reduce((n,x)=>n+Number(x.amount??0),0);
        const openingEntries=(ledger.entries??[]).filter(e=>String(e.sourceType??'').toLowerCase().includes('opening')||String(e.descriptionCode??'').toLowerCase().includes('opening'));
        const opening=openingEntries.length?openingEntries.reduce((n,e)=>n+(e.lines??[]).reduce((m,l)=>m+Math.max(0,Number(l.debit??0)-Number(l.credit??0)),0),0):undefined;
        const metrics=make('div','metrics small');
        const rows=[
          [t('Solde initial / report','Opening / carryover'),opening===undefined?t('Non renseigné comme écriture d’ouverture','Not recorded as an opening entry'):fmt(opening)],
          [t('Recettes récapitulées','Recapped inflows'),fmt(positive)],
          [t('Dépenses récapitulées','Recapped outflows'),fmt(negativeMembers+backOffice)],
          [t('Solde caisse Ledger','Ledger cash balance'),fmt(Number(recap.ledgerSummary?.cashBalance??0))]
        ];
        for(const [label,value] of rows){const card=make('div','metric');card.append(make('span','',label),make('strong','',value));metrics.append(card);}
        finance.append(metrics,make('p','hint',t('Ces montants sont des projections du Ledger/Récap canoniques ; cette page Accueil ne recalcule pas une seconde comptabilité.','These amounts are projections of the canonical Ledger/Recap; this Home page does not calculate a second set of accounts.')));
      }catch{finance.append(make('div','empty-state',t('Situation financière momentanément indisponible. Aucune valeur de remplacement n’est inventée.','Financial situation temporarily unavailable. No substitute value is invented.')));}
    }else if(me?.membership?.id){
      try{
        const sheet=await app.memberOperationalSheet(me.membership.id),statement=sheet.statement??{};
        const metrics=make('div','metrics small');
        const card=make('div','metric');card.append(make('span','',t('Cotisations nettes enregistrées','Recorded net contributions')),make('strong','',fmt(Number(statement.totalNetContributions??0))));metrics.append(card);
        finance.append(metrics,make('p','hint',t('Vous voyez votre propre situation. Les tableaux globaux du groupe restent réservés aux responsables habilités.','You see your own situation. Global group tables remain restricted to authorized managers.')));
      }catch{finance.append(make('div','empty-state',t('Votre dernière situation n’est pas disponible dans ce contexte.','Your latest situation is not available in this context.')));}
    }else finance.append(make('div','empty-state',t('Aucune adhésion active trouvée pour ce compte.','No active membership found for this account.')));
    root.append(finance);
  }
  return{refresh};
}
