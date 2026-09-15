const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const row=(label,value)=>{const p=el('p');p.append(el('strong',label+' : '),document.createTextNode(String(value??'—')));return p;};
const detail=(label,type,id)=>{const a=el('a',label,'link-btn');a.href='#detail='+encodeURIComponent(type)+':'+encodeURIComponent(id);a.dataset.detailType=type;a.dataset.detailId=id;return a;};
export function mountRecapUI({app,getGroups,getMembers,getMeetings,getRubrics,isManager,navigate,fmt=n=>String(n),date=x=>String(x),showError=console.error}){
  const ids=['recapMetrics','recapAlerts','recapIdentityLive','recapMembers','recapMeetingsRubrics','recapFinance','recapExceptions','recapCommunityMarket','recapActions'];
  const roots=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));if(ids.some(id=>!roots[id]))return{refresh:async()=>{}};
  const denied=document.getElementById('recapAccessDenied'),content=document.getElementById('recapContent'),nav=document.getElementById('recapNavBtn');
  const metric=(value,label)=>{const d=el('div',undefined,'metric');d.append(el('strong',String(value)),el('span',label));return d;};
  const action=(label,view)=>{const b=el('button',undefined,'quick');b.type='button';b.append(el('b',label));b.onclick=()=>navigate(view);return b;};
  const clear=()=>ids.forEach(id=>roots[id].replaceChildren());
  const refresh=async()=>{
    const active=Boolean(app.activeGroup()),manager=active&&isManager();if(nav)nav.hidden=!manager;if(denied)denied.hidden=manager||!active;if(content)content.hidden=!manager;clear();if(!manager)return;
    const group=getGroups().find(g=>g.id===app.activeGroup()),members=getMembers(),meetings=getMeetings(),rubrics=getRubrics(),openMeetings=meetings.filter(m=>m.status==='open');
    const [passport,dna,ledger,arrears,pairings,applications,misc,hubs,storefront,live]=await Promise.all([
      app.groupIdentityPassport().catch(()=>null),app.conciergeProfile().catch(()=>null),app.ledger().catch(()=>null),app.arrears().catch(()=>[]),app.listPairingRequests().catch(()=>[]),app.listApplications().catch(()=>[]),app.miscPostings().catch(()=>[]),app.listCommunityHubs().catch(()=>[]),app.groupStorefront().catch(()=>({shop:null,items:[]})),app.liveHealth().catch(()=>null)
    ]);
    roots.recapMetrics.append(metric(members.length,'Membres'),metric(openMeetings.length,'Séances ouvertes'),metric(rubrics.length,'Rubriques'),metric(ledger?.summary?.cashBalance!==undefined?fmt(ledger.summary.cashBalance):'—','Caisse'),metric(arrears.length,'Impayés calculés'),metric(pairings.filter(x=>x.status==='PENDING').length,'Appairages en attente'));
    const pendingApps=applications.filter(x=>x.status==='PENDING'),pendingPair=pairings.filter(x=>x.status==='PENDING');
    if(!pendingApps.length&&!pendingPair.length&&!arrears.length)roots.recapAlerts.append(el('p','Aucune alerte prioritaire détectée dans les moteurs consultés.','hint'));
    if(pendingApps.length)roots.recapAlerts.append(row('Demandes d’adhésion',pendingApps.length));
    if(pendingPair.length)roots.recapAlerts.append(row('Rapprochements historiques',pendingPair.length));
    if(arrears.length)roots.recapAlerts.append(row('Impayés / échéances',arrears.length));
    if(openMeetings.length>1)roots.recapAlerts.append(row('Séances simultanément ouvertes',openMeetings.length));
    if(group)roots.recapIdentityLive.append(detail(group.name,'group',group.id));
    if(passport)roots.recapIdentityLive.append(row('Code groupe',passport.publicCode),row('Empreinte règles',passport.rulesFingerprint));
    if(dna)roots.recapIdentityLive.append(row('Concierge DNA',dna.algorithmId),row('Mémoire',dna.memoryFingerprint));
    roots.recapIdentityLive.append(row('Premium Live',live?.enabled?'ACTIF':'Non actif'),row('Dernière séquence',live?.latest??0));
    for(const m of members.slice(0,30))roots.recapMembers.append(detail(m.displayName,'member',m.id));
    if(members.length>30)roots.recapMembers.append(el('p','+'+(members.length-30)+' autres membres','hint'));
    for(const m of meetings.slice().sort((a,b)=>b.openedAt.localeCompare(a.openedAt)).slice(0,10))roots.recapMeetingsRubrics.append(detail(m.title,'meeting',m.id));
    const rubBox=el('div',undefined,'stack');for(const r of rubrics.slice(0,15))rubBox.append(detail(r.name,'rubric',r.id));roots.recapMeetingsRubrics.append(rubBox);
    if(ledger){roots.recapFinance.append(row('Solde caisse',fmt(ledger.summary.cashBalance)),row('Fonds membres',fmt(ledger.summary.memberFundsLiability)),row('Écritures',ledger.summary.entryCount),row('Reçus',ledger.receipts.length));}
    const byKind=new Map();for(const p of misc)byKind.set(String(p.data?.kind??p.title),(byKind.get(String(p.data?.kind??p.title))??0)+Number(p.data?.amount??0));
    if(byKind.size){for(const [k,v] of byKind)roots.recapExceptions.append(row(k,fmt(v)));}else roots.recapExceptions.append(el('p','Aucune petite rubrique enregistrée.','hint'));
    roots.recapExceptions.append(row('Impayés calculés',arrears.length),row('Appairages en attente',pendingPair.length));
    roots.recapCommunityMarket.append(row('Hubs du groupe',hubs.length),row('Boutique',storefront.shop?.name??'Non configurée'),row('Articles publiés',storefront.items?.length??0));
    for(const [label,view] of [['Réunion','operations'],['Finances','finance'],['Appairages','discovery'],['Communauté / boutique','ecosystem'],['Réglages Live & IA','settings']])roots.recapActions.append(action(label,view));
  };
  return{refresh};
}