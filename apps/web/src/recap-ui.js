const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const row=(label,value)=>{const p=el('p');p.append(el('strong',label+' : '),document.createTextNode(String(value??'—')));return p;};
const detail=(label,type,id)=>{const a=el('a',label,'link-btn');a.href='#detail='+encodeURIComponent(type)+':'+encodeURIComponent(id);a.dataset.detailType=type;a.dataset.detailId=id;return a;};

export function mountRecapUI({app,getGroups,getMembers,getMeetings,getRubrics,isManager,navigate,fmt=n=>String(n),date=x=>String(x),showError=console.error}){
  const ids=['recapMetrics','recapAlerts','recapIdentityLive','recapMembers','recapMeetingsRubrics','recapFinance','recapExceptions','recapCommunityMarket','recapActions'];
  const roots=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));if(ids.some(id=>!roots[id]))return{refresh:async()=>{}};
  const denied=document.getElementById('recapAccessDenied'),content=document.getElementById('recapContent'),nav=document.getElementById('recapNavBtn');
  const metric=(value,label)=>{const d=el('div',undefined,'metric');d.append(el('strong',String(value)),el('span',label));return d;};
  const action=(label,view)=>{const b=el('button',undefined,'quick');b.type='button';b.append(el('b',label));b.onclick=()=>navigate(view);return b;};
  const section=(title)=>{const box=el('article',undefined,'item');box.append(el('strong',title));return box;};
  const clear=()=>ids.forEach(id=>roots[id].replaceChildren());

  const refresh=async()=>{
    const active=Boolean(app.activeGroup()),manager=active&&isManager();if(nav)nav.hidden=!manager;if(denied)denied.hidden=manager||!active;if(content)content.hidden=!manager;clear();if(!manager)return;
    const group=getGroups().find(g=>g.id===app.activeGroup()),members=getMembers(),meetings=getMeetings(),rubrics=getRubrics(),openMeetings=meetings.filter(m=>m.status==='open');
    const futureMeetings=meetings.filter(m=>m.scheduledAt&&Date.parse(m.scheduledAt)>Date.now()).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
    const [passport,dna,ledger,arrears,pairings,applications,misc,miscCatalog,hubs,storefront,live,joinLinks,beta,pulse]=await Promise.all([
      app.groupIdentityPassport().catch(()=>null),app.conciergeProfile().catch(()=>null),app.ledger().catch(()=>null),app.arrears().catch(()=>[]),
      app.listPairingRequests().catch(()=>[]),app.listApplications().catch(()=>[]),app.miscPostings().catch(()=>[]),app.miscRubrics().catch(()=>[]),
      app.listCommunityHubs().catch(()=>[]),app.groupStorefront().catch(()=>({shop:null,items:[]})),app.liveHealth().catch(()=>null),
      app.listJoinLinks().catch(()=>[]),app.dataUseConsent().catch(()=>null),app.ecoPulseProfile().catch(()=>({affinities:[]}))
    ]);

    const activeMembers=members.filter(m=>m.status==='active'),managerMembers=activeMembers.filter(m=>(m.roles??[]).some(r=>['founder','manager','admin','president','treasurer'].includes(r)));
    const pendingApps=applications.filter(x=>x.status==='PENDING'),pendingPair=pairings.filter(x=>x.status==='PENDING');
    const now=Date.now(),validLinks=joinLinks.filter(x=>!x.revoked&&Date.parse(x.expiresAt)>now&&Number(x.usedCount)<Number(x.maxUses));
    const expiringLinks=validLinks.filter(x=>Date.parse(x.expiresAt)-now<24*60*60*1000);
    const ephemeral=miscCatalog.filter(x=>x.lifecycle==='EPHEMERAL'),persistent=miscCatalog.filter(x=>x.lifecycle==='PERSISTENT'),sessionOnly=miscCatalog.filter(x=>x.lifecycle==='SESSION_ONLY');
    const pulseAff=(pulse.affinities??[]).filter(x=>Number(x.score)>0).slice(0,5);

    roots.recapMetrics.append(
      metric(activeMembers.length,'Membres actifs'),metric(openMeetings.length,'Séances ouvertes'),metric(rubrics.length,'Rubriques principales'),
      metric(miscCatalog.length,'Sous-rubriques Autres'),metric(ledger?.summary?.cashBalance!==undefined?fmt(ledger.summary.cashBalance):'—','Caisse'),
      metric(arrears.length,'Impayés calculés'),metric(pendingApps.length+pendingPair.length,'Entrées à traiter'),metric(validLinks.length,'Liens actifs')
    );

    if(!pendingApps.length&&!pendingPair.length&&!arrears.length&&!expiringLinks.length&&!openMeetings.length)roots.recapAlerts.append(el('p','Aucune alerte prioritaire détectée. Le groupe peut poursuivre son cycle normal.','hint'));
    if(pendingApps.length)roots.recapAlerts.append(row('Demandes d’adhésion à décider',pendingApps.length));
    if(pendingPair.length)roots.recapAlerts.append(row('Rapprochements historiques à décider',pendingPair.length));
    if(arrears.length)roots.recapAlerts.append(row('Impayés / échéances',arrears.length));
    if(openMeetings.length>1)roots.recapAlerts.append(row('Attention : séances simultanément ouvertes',openMeetings.length));
    if(expiringLinks.length)roots.recapAlerts.append(row('Liens d’adhésion expirant dans les 24 h',expiringLinks.length));
    if(futureMeetings[0])roots.recapAlerts.append(row('Prochaine séance',futureMeetings[0].title+' · '+date(futureMeetings[0].scheduledAt)));

    if(group)roots.recapIdentityLive.append(detail(group.name,'group',group.id),row('Origine',group.originMode??(group.historicalCreatedAt?'Historique':'Nouveau groupe')));
    if(passport)roots.recapIdentityLive.append(row('Code groupe',passport.publicCode),row('Empreinte règles',passport.rulesFingerprint));
    if(dna)roots.recapIdentityLive.append(row('Concierge DNA',dna.algorithmId),row('Empreinte mémoire',dna.memoryFingerprint),row('Confiance mémoire',Math.round(Number(dna.confidenceAverage??0)*100)+'%'));
    roots.recapIdentityLive.append(row('Live Ledger',live?.enabled?'ACTIF':'Fallback offline'),row('Dernière séquence Live',live?.latest??0));
    roots.recapIdentityLive.append(row('Profil données',beta?.defaultMode??'BETA_OPEN'),row('Intelligence transverse','Apprentissage · personnalisation · partenaires · communautés actifs pendant la bêta'));
    if(pulseAff.length)roots.recapIdentityLive.append(row('EcoPulse apprend',pulseAff.map(x=>x.value).join(' · ')));

    const memberSummary=section('Structure des membres');
    memberSummary.append(row('Actifs',activeMembers.length),row('Responsables',managerMembers.length),row('Autres statuts',Math.max(0,members.length-activeMembers.length)));
    roots.recapMembers.append(memberSummary);
    for(const m of members.slice(0,40))roots.recapMembers.append(detail(m.displayName,'member',m.id));
    if(members.length>40)roots.recapMembers.append(el('p','+'+(members.length-40)+' autres membres','hint'));
    const onboarding=section('Entrées & appairages');onboarding.append(row('Liens valides',validLinks.length),row('Demandes classiques',pendingApps.length),row('Rapprochements historiques',pendingPair.length));
    for(const link of validLinks.slice(0,5))onboarding.append(row(link.label||link.mode,(link.usedCount??0)+' / '+link.maxUses+' utilisation(s) · expire '+date(link.expiresAt)));
    roots.recapMembers.append(onboarding);

    const meetingsBox=section('Séances');meetingsBox.append(row('Total',meetings.length),row('Ouvertes',openMeetings.length),row('À venir',futureMeetings.length));roots.recapMeetingsRubrics.append(meetingsBox);
    for(const m of meetings.slice().sort((a,b)=>(b.openedAt??'').localeCompare(a.openedAt??'')).slice(0,12))roots.recapMeetingsRubrics.append(detail(m.title,'meeting',m.id));
    const rubBox=section('Rubriques principales');for(const r of rubrics.slice(0,20))rubBox.append(detail(r.name,'rubric',r.id));roots.recapMeetingsRubrics.append(rubBox);
    const miscBox=section('Autres · cycle de vie');miscBox.append(row('Persistantes',persistent.map(x=>x.name).join(', ')||'—'),row('Éphémères',ephemeral.map(x=>x.name+(x.activeFirstSessions?' ('+x.activeFirstSessions+' premières séances)':'')).join(', ')||'—'),row('Selon séance',sessionOnly.map(x=>x.name).join(', ')||'—'));roots.recapMeetingsRubrics.append(miscBox);
    if(ledger&&members.length&&rubrics.length){
      const cumulative=section('Feuille récapitulative · exercice / cycle');
      const hint=el('p','Même projection canonique que dans Séances : membres × rubriques, cumul de toutes les séances enregistrées. Aucune seconde comptabilité.','hint');cumulative.append(hint);
      const wrap=el('div',undefined,'matrix-wrap'),table=el('table',undefined,'meeting-matrix'),head=el('thead'),hr=el('tr');hr.append(el('th','Membre'));
      const activeRubrics=rubrics.filter(r=>r.status!=='ARCHIVED');for(const rubric of activeRubrics)hr.append(el('th',rubric.name));hr.append(el('th','Total'));head.append(hr);table.append(head);const body=el('tbody');
      for(const member of members.filter(m=>m.status!=='left')){const tr=el('tr');tr.append(el('th',member.displayName));let total=0;
        for(const rubric of activeRubrics){const amount=(ledger.receipts??[]).filter(x=>x.membershipId===member.id&&x.rubricId===rubric.id).reduce((n,x)=>n+Number(x.netAmount??0),0);total+=amount;tr.append(el('td',fmt(amount)));}
        tr.append(el('td',fmt(total)));body.append(tr);
      }
      table.append(body);wrap.append(table);cumulative.append(wrap);roots.recapMeetingsRubrics.append(cumulative);
    }

    if(ledger){
      roots.recapFinance.append(row('Solde caisse',fmt(ledger.summary.cashBalance)),row('Fonds membres',fmt(ledger.summary.memberFundsLiability)),row('Écritures canoniques',ledger.summary.entryCount),row('Reçus',ledger.receipts.length));
      const recent=ledger.receipts.slice().sort((a,b)=>(b.receivedAt??'').localeCompare(a.receivedAt??'')).slice(0,8);
      if(recent.length){const box=section('Derniers encaissements');for(const receipt of recent){const member=members.find(m=>m.id===receipt.membershipId),line=el('div',undefined,'stack');line.append(member?detail(member.displayName,'member',member.id):el('span',receipt.membershipId),row('Net',fmt(receipt.netAmount)));if(receipt.meetingId)line.append(detail('Séance','meeting',receipt.meetingId));if(receipt.rubricId)line.append(detail('Rubrique','rubric',receipt.rubricId));box.append(line);}roots.recapFinance.append(box);}
    }else roots.recapFinance.append(el('p','Ledger non disponible dans ce contexte.','hint'));

    const byKind=new Map();for(const p of misc)byKind.set(String(p.data?.kind??p.title),(byKind.get(String(p.data?.kind??p.title))??0)+Number(p.data?.amount??0));
    if(byKind.size){for(const [k,v] of byKind)roots.recapExceptions.append(row(k,fmt(v)));}else roots.recapExceptions.append(el('p','Aucune petite rubrique enregistrée.','hint'));
    roots.recapExceptions.append(row('Impayés calculés',arrears.length),row('Appairages en attente',pendingPair.length),row('Demandes d’adhésion en attente',pendingApps.length));
    if(ephemeral.length&&meetings.length>Math.max(...ephemeral.map(x=>Number(x.activeFirstSessions??1))))roots.recapExceptions.append(row('Rubriques éphémères','Leur fenêtre initiale est dépassée : elles restent archivées dans l’historique sans surcharger la saisie courante.'));

    roots.recapCommunityMarket.append(row('Hubs financiers/associatifs du groupe',hubs.length),row('Boutique',storefront.shop?.name??'Non configurée'),row('Articles publiés',storefront.items?.length??0),row('EcoPulse','Actif sur les découvertes non sensibles'));
    if(storefront.items?.length){const box=section('Vitrine');for(const item of storefront.items.slice(0,8))box.append(row(item.name,(item.available??0)+' disponible(s) · '+fmt(Number(item.unitPrice??0))));roots.recapCommunityMarket.append(box);}

    for(const [label,view] of [['Réunion','operations'],['Finances','finance'],['Adhésions & appairages','discovery'],['Communautés & boutique','ecosystem'],['Identité · Live · IA','settings']])roots.recapActions.append(action(label,view));
  };
  return{refresh};
}
