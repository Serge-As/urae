const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const row=(label,value)=>{const p=el('p');p.append(el('strong',label+' : '),document.createTextNode(String(value??'—')));return p;};
const link=(label,type,id)=>{const b=el('button',label,'link-btn');b.type='button';b.dataset.detailType=type;b.dataset.detailId=id;return b;};

export function mountDetailUI({app,navigate,getGroups,getMembers,getMeetings,getRubrics,isManager=()=>false,fmt=n=>String(n),date=x=>String(x),showError=console.error}){
  const title=document.getElementById('detailTitle'),subtitle=document.getElementById('detailSubtitle'),metrics=document.getElementById('detailMetrics'),body=document.getElementById('detailBody');
  if(!title||!subtitle||!metrics||!body)return{open:async()=>{}};
  let previous='dashboard';

  const metric=(value,label)=>{const d=el('div',undefined,'metric');d.append(el('strong',String(value)),el('span',label));return d;};
  const card=(heading)=>{const a=el('article',undefined,'panel');a.append(el('h2',heading));return a;};
  const currentView=()=>document.querySelector('.view.active')?.id?.replace(/^view-/,'')||'dashboard';
  const jump=(type,id)=>void open(type,id);

  const groupDetail=async id=>{
    const g=getGroups().find(x=>x.id===id);if(!g)throw Error('GROUP_NOT_FOUND');
    title.textContent=g.name;subtitle.textContent='Identité du groupe, gouvernance et éléments reliés.';
    metrics.replaceChildren(metric(g.kind,'Famille'),metric(g.governanceModel,'Gouvernance'),metric(g.status,'État'));
    const info=card('Identité');info.append(row('ID groupe',g.id),row('Origine',g.originMode??'—'),row('Exercice',g.currentExerciseLabel??'—'),row('Création',date(g.historicalCreatedAt??g.createdAt)));
    if(app.activeGroup()===g.id){
      try{const p=await app.groupIdentityPassport();info.append(row('Code identitaire',p.publicCode),row('Empreinte des règles',p.rulesFingerprint));}catch{}
      const members=getMembers(),meetings=getMeetings(),rubrics=getRubrics();
      metrics.append(metric(members.length,'Membres'),metric(meetings.length,'Séances'),metric(rubrics.length,'Rubriques'));
      const linked=card('Accès détaillés');
      const groups=[['Membres',members,'member','displayName'],['Séances',meetings,'meeting','title'],['Rubriques',rubrics,'rubric','name']];
      for(const [heading,items,type,labelKey] of groups){const box=el('div',undefined,'stack');box.append(el('h3',heading));for(const item of items.slice(0,50))box.append(link(item[labelKey],type,item.id));linked.append(box);}
      body.replaceChildren(info,linked);
    }else{
      const activate=el('button','Activer ce groupe pour ouvrir ses détails reliés','primary');activate.type='button';activate.onclick=async()=>{app.selectGroup(g.id);location.hash='';location.reload();};info.append(activate);body.replaceChildren(info);
    }
  };

  const memberDetail=async id=>{
    const m=getMembers().find(x=>x.id===id);if(!m)throw Error('MEMBERSHIP_NOT_FOUND');
    title.textContent=m.displayName;subtitle.textContent='Fiche du membre dans le groupe actif.';
    metrics.replaceChildren(metric((m.roles??[]).join(', ')||'member','Rôle'),metric(m.status,'État'));
    const info=card('Identité de membre');info.append(row('Nom',m.displayName),row('Fiche membre',m.id),row('Ancienneté',m.historicalJoinedAt?date(m.historicalJoinedAt):m.joinedAt?date(m.joinedAt):'—'));
    body.replaceChildren(info);
    if(isManager()||m.userId===app.currentActor()){
      try{
        const statement=await app.memberStatement(m.id);metrics.append(metric(fmt(statement.totalNetContributions),'Situation nette'));
        const finance=card('Situation financière');finance.append(row('À la date du',date(statement.asOf)),row('Total net',fmt(statement.totalNetContributions)));
        for(const r of statement.receipts.slice().sort((a,b)=>b.receivedAt.localeCompare(a.receivedAt)).slice(0,50)){
          const item=el('article',undefined,'item');item.append(el('strong',fmt(r.netAmount)),row('Reçu',r.id),row('Date',date(r.receivedAt)));
          if(r.meetingId)item.append(link('Voir la séance','meeting',r.meetingId));
          if(r.rubricId)item.append(link('Voir la rubrique','rubric',r.rubricId));
          finance.append(item);
        }
        body.append(finance);
      }catch{}
      try{
        const misc=await app.miscPostings({membershipId:m.id});if(misc.length){const other=card('Autres · petites rubriques');for(const p of misc.slice(0,30)){const a=el('article',undefined,'item');a.append(el('strong',p.title),row('Montant',fmt(Number(p.data?.amount??0))));if(p.data?.meetingId)a.append(link('Séance','meeting',String(p.data.meetingId)));other.append(a);}body.append(other);}
      }catch{}
      try{
        const notices=await app.financialNotices(m.id);if(notices.length){const n=card('Avis et validations');for(const x of notices.slice(0,20)){const a=el('article',undefined,'item');a.append(el('strong',x.operationType??'Opération'),row('État',x.status),row('Montant',fmt(Number(x.amount??0))));n.append(a);}body.append(n);}
      }catch{}
    }
  };

  const meetingDetail=async id=>{
    const meeting=getMeetings().find(x=>x.id===id);if(!meeting)throw Error('MEETING_NOT_FOUND');
    title.textContent=meeting.title;subtitle.textContent='Séance, mouvements liés et contexte.';
    metrics.replaceChildren(metric(meeting.status,'État'),metric(date(meeting.openedAt),'Ouverture'));
    const info=card('Séance');info.append(row('Titre',meeting.title),row('Ouverte par',meeting.openedBy),row('Planifiée',meeting.scheduledAt?date(meeting.scheduledAt):'—'),row('Clôturée',meeting.closedAt?date(meeting.closedAt):'—'));body.replaceChildren(info);
    if(isManager()){
      try{
        const ledger=await app.ledger(),receipts=ledger.receipts.filter(r=>r.meetingId===id);metrics.append(metric(receipts.length,'Encaissements'));
        const fin=card('Encaissements de cette séance');
        if(!receipts.length)fin.append(el('p','Aucun encaissement lié à cette séance.','hint'));
        for(const r of receipts){const m=getMembers().find(x=>x.id===r.membershipId),a=el('article',undefined,'item');a.append(link(m?.displayName??r.membershipId,'member',r.membershipId),row('Montant net',fmt(r.netAmount)));if(r.rubricId)a.append(link('Rubrique','rubric',r.rubricId));fin.append(a);}body.append(fin);
      }catch{}
    }
    try{const misc=await app.miscPostings({meetingId:id});if(misc.length){const other=card('Autres');for(const p of misc){const m=getMembers().find(x=>x.id===p.data?.membershipId),a=el('article',undefined,'item');a.append(el('strong',p.title),row('Montant',fmt(Number(p.data?.amount??0))));if(m)a.append(link(m.displayName,'member',m.id));other.append(a);}body.append(other);}}catch{}
  };

  const rubricDetail=async id=>{
    const r=getRubrics().find(x=>x.id===id);if(!r)throw Error('RUBRIC_NOT_FOUND');
    title.textContent=r.name;subtitle.textContent='Règle, pratique observée et mouvements liés.';
    metrics.replaceChildren(metric(r.status,'État'),metric(r.source,'Source'),metric(r.version,'Version'));
    const info=card('Règle de la rubrique');info.append(row('Nom',r.name),row('Objet',r.purpose??'—'),row('Écrit',r.operatingModel?.writtenRule??'—'),row('Pratique observée',r.operatingModel?.observedPractice??'—'),row('Règle effective',r.operatingModel?.effectiveRuleSummary??'—'),row('Écart',r.operatingModel?.ruleRealityStatus??'UNKNOWN'),row('Participation',r.activityPlan?.participationMode??r.facets?.obligation??'—'),row('Cadence',r.facets?.cadence??'—'));body.replaceChildren(info);
    if(r.activityPlan){
      const plan=card('Configuration');plan.append(row('Nature',r.activityPlan.kind),row('Montant nominal',fmt(Number(r.activityPlan.nominalAmount?.amount??0))),row('Durée',r.activityPlan.duration?r.activityPlan.duration.value+' '+r.activityPlan.duration.unit:'—'),row('Séances',r.activityPlan.sessions));body.append(plan);
    }
    if(isManager()){
      try{
        const ledger=await app.ledger(),receipts=ledger.receipts.filter(x=>x.rubricId===id);metrics.append(metric(receipts.length,'Écritures'));
        const fin=card('Mouvements par membre');for(const p of receipts.slice(0,50)){const m=getMembers().find(x=>x.id===p.membershipId),a=el('article',undefined,'item');a.append(link(m?.displayName??p.membershipId,'member',p.membershipId),row('Net',fmt(p.netAmount)));if(p.meetingId)a.append(link('Séance','meeting',p.meetingId));fin.append(a);}body.append(fin);
      }catch{}
    }
  };

  async function open(type,id){
    try{
      const active=currentView();if(active!=='detail')previous=active;
      metrics.replaceChildren();body.replaceChildren(el('p','Chargement…','hint'));navigate('detail');
      if(type==='group')await groupDetail(id);else if(type==='member')await memberDetail(id);else if(type==='meeting')await meetingDetail(id);else if(type==='rubric')await rubricDetail(id);else throw Error('DETAIL_TYPE_UNSUPPORTED');
      try{history.replaceState(null,'','#detail='+encodeURIComponent(type)+':'+encodeURIComponent(id));}catch{}
    }catch(e){showError(e);}
  }

  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target.closest('[data-detail-type][data-detail-id]'):null;if(!target)return;
    e.preventDefault();jump(target.dataset.detailType,target.dataset.detailId);
  });
  document.getElementById('detailBackBtn')?.addEventListener('click',()=>{navigate(previous);try{history.replaceState(null,'',location.pathname+location.search);}catch{}});
  return{open};
}
