import {openLoanSimulationDialog} from './loan-simulation-ui.js';
const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const row=(label,value)=>{const p=el('p');p.append(el('strong',label+' : '),document.createTextNode(String(value??'—')));return p;};
const detail=(label,type,id)=>{const a=el('a',label,'link-btn');a.href='#detail='+encodeURIComponent(type)+':'+encodeURIComponent(id);a.dataset.detailType=type;a.dataset.detailId=id;return a;};

export function mountPersonalCockpitUI({app,getGroups,getMembers,getMeetings,navigate,openGroupForum,fmt=n=>String(n),date=x=>String(x),showError=console.error}){
  const metrics=document.getElementById('personalCockpitMetrics'),situation=document.getElementById('personalSituation'),next=document.getElementById('personalNext'),noticesRoot=document.getElementById('personalLiveNotices'),spaces=document.getElementById('personalSpaces');
  const pulseRoot=document.getElementById('ecoPulseFeed'),pulseProfile=document.getElementById('ecoPulseProfile');
  if(!metrics||!situation||!next||!noticesRoot||!spaces)return{refresh:async()=>{}};
  const metric=(value,label)=>{const d=el('div',undefined,'metric');d.append(el('strong',String(value)),el('span',label));return d;};
  const action=(label,view)=>{const b=el('button',label,'secondary');b.type='button';b.onclick=()=>navigate(view);return b;};
  const impressed=new Set(),dwelled=new Set(),timers=new Map();
  const pulseSignal=async(item,actionName)=>{
    try{await app.recordEcoPulse({itemId:item.id,itemKind:item.kind,action:actionName,source:item.source,groupId:item.groupId,locality:item.locality,tags:item.tags??[]});}catch{}
  };
  const pulseOpen=async item=>{
    await pulseSignal(item,'OPEN');
    if(item.kind==='interest-community'||item.kind.startsWith('interest-content-')){
      navigate('ecosystem');
      document.dispatchEvent(new CustomEvent('eco:open-interest-community',{detail:{id:String(item.payload?.communityId??item.id),contentId:item.payload?.contentId}}));
      return;
    }
    if(item.kind==='public-group'){
      navigate('discovery');
      const q=document.getElementById('discoveryQ');if(q)q.value=item.title;
      document.getElementById('discoverySearchForm')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      return;
    }
    if(item.kind==='group-hub'){
      navigate('ecosystem');document.getElementById('communityEnginePanel')?.scrollIntoView({behavior:'smooth',block:'start'});return;
    }
    if(item.kind==='shop-item'){
      navigate('ecosystem');document.getElementById('groupShopPanel')?.scrollIntoView({behavior:'smooth',block:'start'});return;
    }
  };
  const observeDwell=(card,item)=>{
    if(!('IntersectionObserver' in globalThis))return;
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        const key=item.kind+':'+item.id;
        if(entry.isIntersecting&&entry.intersectionRatio>=0.6&&!dwelled.has(key)){
          if(!timers.has(key))timers.set(key,setTimeout(()=>{dwelled.add(key);timers.delete(key);void pulseSignal(item,'DWELL_10S');observer.disconnect();},10000));
        }else if(timers.has(key)){clearTimeout(timers.get(key));timers.delete(key);}
      }
    },{threshold:[0.6]});
    observer.observe(card);
  };
  const renderPulse=async()=>{
    if(!pulseRoot||!pulseProfile)return;
    pulseRoot.replaceChildren();pulseProfile.textContent='EcoPulse prépare vos suggestions…';
    try{
      const [feed,profile]=await Promise.all([app.ecoPulseFeed({limit:12}),app.ecoPulseProfile()]);
      const top=(profile.affinities??[]).filter(x=>x.score>0).slice(0,5);
      pulseProfile.textContent=top.length?'EcoPulse apprend surtout : '+top.map(x=>x.value).join(' · ')+' · 15% d’exploration pour éviter une bulle fermée.':'EcoPulse démarre en mode exploration : vos ouvertures, recherches, adhésions et masquages vont rapidement personnaliser ce fil.';
      if(!(feed.items??[]).length){pulseRoot.append(el('p','Les recommandations apparaîtront dès que des groupes ou communautés seront publiés.','hint'));return;}
      for(const item of feed.items){
        const card=el('article',undefined,'item');card.dataset.pulseId=item.id;card.dataset.pulseKind=item.kind;
        const heading=el('strong',item.title);card.append(heading);
        const communityContentLabel=item.kind.startsWith('interest-content-')?({event:'Événement',place:'Bon coin',offer:'Offre',request:'Demande',post:'Publication'}[item.kind.replace('interest-content-','')]??'Communauté'):null;
        const meta=[item.locality,item.kind==='interest-community'?'Communauté d’intérêt':communityContentLabel??(item.kind==='public-group'?'Groupe à découvrir':item.kind==='meeting'?'Vie de mon groupe':item.kind==='shop-item'?'Boutique':item.kind==='group-hub'?'Hub du groupe':item.kind)].filter(Boolean).join(' · ');
        if(meta)card.append(el('p',meta,'hint'));
        if(item.why?.length)card.append(el('p','Pourquoi ceci ? '+item.why.join(' · '),'hint'));
        if(item.kind==='shop-item'&&item.payload?.unitPrice!==undefined)card.append(row('Prix',fmt(Number(item.payload.unitPrice))));
        const actions=el('div',undefined,'actions');
        if(item.kind==='meeting'){
          const a=detail('Ouvrir', 'meeting', String(item.payload?.meetingId??item.id));a.classList.add('primary');a.addEventListener('click',()=>void pulseSignal(item,'OPEN'));actions.append(a);
        }else{
          const open=el('button','Ouvrir','primary');open.type='button';open.onclick=()=>void pulseOpen(item);actions.append(open);
        }
        const hide=el('button','Moins de ceci','secondary');hide.type='button';hide.onclick=()=>void (async()=>{await pulseSignal(item,'NOT_INTERESTED');card.remove();})();actions.append(hide);
        card.append(actions);pulseRoot.append(card);
        const key=item.kind+':'+item.id;if(!impressed.has(key)){impressed.add(key);void pulseSignal(item,'IMPRESSION');}
        observeDwell(card,item);
      }
    }catch(e){pulseProfile.textContent='EcoPulse reste disponible dès que la synchronisation serveur revient.';pulseRoot.append(el('p','Le cockpit principal continue de fonctionner sans recommandation réseau.','hint'));}
  };

  const tr=(fr,en)=>document.documentElement.lang?.startsWith('en')?en:fr;
  // Personal directory only. Every discussion still belongs to the existing
  // Community / InterestCommunity owner; no second feed or message store.
  const renderPersonalForas=(groups,communities,unavailable=false)=>{
    const section=el('details',undefined,'item personal-foras-directory');
    const count=groups.length+communities.length;
    section.append(el('summary',tr('Mes Foras · '+count+' espaces','My Forums · '+count+' spaces')));
    const hint=el('p',tr('Retrouvez vos groupes et communautés sans quitter votre compte. Chaque espace garde ses propres droits.','Open your groups and communities from your account. Each space keeps its own permissions.'),'hint');
    section.append(hint);
    if(unavailable)section.append(el('p',tr('La liste de vos groupes est temporairement indisponible. Cela ne signifie pas que vous en avez été retiré.','Your group list is temporarily unavailable. It does not mean that you have been removed.'),'truth-notice'));
    if(groups.length){
      section.append(el('strong',tr('Foras de mes groupes','My group forums')));
      for(const group of groups){
        const button=el('button',String(group.name||group.id),'secondary personal-forum-link');
        button.type='button';button.dataset.forumGroup=String(group.id);
        button.onclick=()=>void Promise.resolve(openGroupForum?.(group.id)).catch(showError);
        section.append(button);
      }
    }
    if(communities.length){
      section.append(el('strong',tr('Foras de mes communautés','My community forums')));
      for(const community of communities){
        const button=el('button',String(community.name||community.id),'secondary personal-forum-link');
        button.type='button';button.dataset.forumCommunity=String(community.id);
        button.onclick=()=>{
          navigate('ecosystem',{anchor:'interestCommunityWorkspace',force:true});
          document.dispatchEvent(new CustomEvent('eco:open-interest-community',{detail:{id:String(community.id)}}));
        };
        section.append(button);
      }
    }
    if(!count&&!unavailable)section.append(el('p',tr('Rejoignez un groupe ou une communauté pour retrouver ici ses échanges.','Join a group or community to find its discussions here.'),'hint'));
    spaces.append(section);
  };
    const refresh=async()=>{
    metrics.replaceChildren();situation.replaceChildren();next.replaceChildren();noticesRoot.replaceChildren();spaces.replaceChildren();
    const groups=getGroups(),groupId=app.activeGroup(),members=getMembers(),meetings=getMeetings(),mine=members.find(m=>m.userId===app.currentActor());
    metrics.append(metric(groups.length,'Groupes accessibles'));
    let personalCommunities=[];try{personalCommunities=await app.myInterestCommunities();}catch{}
    metrics.append(metric(personalCommunities.length,'Communautés d’intérêt'));
    // A tenant catalogue can contain groups that are not mine. Never expose
    // those names as my forum shortcuts without a server membership check.
    let forumGroups=[],forumsUnavailable=false;
    try{forumGroups=await app.listMyGroups();}catch{forumsUnavailable=true;}
    renderPersonalForas(forumGroups,personalCommunities,forumsUnavailable);
    void renderPulse();
    if(!groupId){
      situation.append(el('p','Choisissez un groupe ou rejoignez-en un avec un code.','hint'),action('Choisir / rejoindre','discovery'));
      next.append(el('p','Aucun groupe actif : votre cockpit reste centré sur votre compte.','hint'));
      spaces.append(...forumGroups.slice(0,12).map(g=>detail(g.name,'group',g.id)));
      for(const c of personalCommunities.slice(0,8)){const a=el('article',undefined,'item');a.append(el('strong',c.name),row('Communauté',c.locality||'Sans localité'));spaces.append(a);}
      spaces.append(action('Découvrir des communautés','ecosystem'));
      return;
    }
    const active=forumGroups.find(g=>g.id===groupId);if(active)spaces.append(detail(active.name,'group',active.id));
    const open=meetings.filter(m=>m.status==='open'),future=meetings.filter(m=>m.scheduledAt&&Date.parse(m.scheduledAt)>=Date.now()).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
    metrics.append(metric(open.length,'Séances ouvertes'));
    if(mine){
      try{
        const statement=await app.memberStatement(mine.id);
        const totalDebt=Number(statement.totalDebt??0),positionAfterDebt=Number(statement.totalNetContributions??0)-totalDebt;
        metrics.append(metric(fmt(statement.totalNetContributions),'Mes cotisations nettes'),metric(fmt(totalDebt),'Mes dettes'),metric(fmt(positionAfterDebt),'Position après dettes'));
        situation.append(detail(mine.displayName,'member',mine.id),row('Cotisations nettes',fmt(statement.totalNetContributions)),row('Dettes / prêts + intérêts',fmt(totalDebt)),row('Position après dettes',fmt(positionAfterDebt)),row('Dernière actualisation',date(statement.asOf)));
        try{
          const sheet=await app.memberOperationalSheet(mine.id),rubrics=sheet.rubrics??[],matrix=sheet.exerciseMatrix??[],box=el('article',undefined,'item');
          box.append(el('strong','Ma fiche financière du groupe'),el('p','Toutes les rubriques du groupe sont reprises ici depuis la même vérité que la feuille de séance.','hint'));
          const grid=el('div',undefined,'personal-rubric-grid');
          for(const rubric of rubrics){
            const total=matrix.reduce((n,r)=>n+Number(r.cells?.[rubric.id]?.net??0),0),item=el('button',undefined,'secondary');
            item.type='button';if(rubric.polarity==='NEGATIVE')item.classList.add('financial-negative');item.innerHTML='<span>'+String(rubric.name)+'</span><strong>'+fmt(total)+'</strong>';item.onclick=()=>{location.hash='#detail=member:'+encodeURIComponent(mine.id);};grid.append(item);
          }
          box.append(grid);const actions=el('div',undefined,'actions'),open=el('button','Ouvrir ma fiche individuelle complète','primary');open.type='button';open.onclick=()=>{location.hash='#detail=member:'+encodeURIComponent(mine.id);};const sim=el('button','Simuler l’évolution de mon prêt','secondary');sim.type='button';sim.onclick=()=>void(async()=>{try{const loans=(sheet.loans??[]).filter(x=>['DISBURSED','REPAYING'].includes(String(x.data?.completionState??''))),loan=loans[0];await openLoanSimulationDialog({app,loan,fallbackDebt:Number(statement.debtPrincipal??0),fallbackInterest:Number(statement.debtInterest??0),title:'Évolution de mon prêt',memberName:mine.displayName});}catch(e){showError(e);}})();actions.append(open,sim);box.append(actions);situation.append(box);
        }catch(e){situation.append(el('p','La fiche financière détaillée sera affichée dès que la synchronisation du groupe est disponible.','hint'));}
      }catch(e){situation.append(detail(mine.displayName,'member',mine.id),el('p','Votre relevé personnel reste accessible depuis votre fiche.','hint'));}
      try{
        const notices=await app.financialNotices(mine.id),pending=notices.filter(n=>!['CONFIRMED','APPROVED_AFTER_REVIEW'].includes(String(n.status)));
        metrics.append(metric(pending.length,'Avis à vérifier'));
        if(!notices.length)noticesRoot.append(el('p','Aucun avis financier à vérifier.','hint'));
        for(const n of notices.slice(0,8)){const a=el('article',undefined,'item');a.append(el('strong',String(n.operationType??'Opération')),row('Montant',fmt(Number(n.amount??0))),row('État',n.status),row('Date',date(n.createdAt??n.updatedAt??'')));noticesRoot.append(a);}
      }catch{noticesRoot.append(el('p','Les avis apparaîtront ici dès qu’une opération vous concerne.','hint'));}
    }else{
      situation.append(el('p','Votre compte n’est pas encore relié à une fiche membre dans ce groupe. Utilisez l’appairage si le groupe existait déjà.','hint'),action('Appairer mon compte','discovery'));
    }
    if(open.length){for(const m of open.slice(0,3)){const a=el('article',undefined,'item');a.append(detail(m.title,'meeting',m.id),row('État','Ouverte'));next.append(a);}}
    else if(future.length){const m=future[0],a=el('article',undefined,'item');a.append(detail(m.title,'meeting',m.id),row('Prévue',date(m.scheduledAt)));next.append(a);}
    else next.append(el('p','Aucune prochaine séance renseignée.','hint'));
    try{
      const inbox=await app.inboxItems(),mineItems=inbox.filter(x=>!x.groupId||x.groupId===groupId);
      if(mineItems.length){const a=el('article',undefined,'item');a.append(el('strong',mineItems.length+' action(s) à traiter'));const b=action('Ouvrir À faire','inbox');a.append(b);next.append(a);}
    }catch{}
    try{
      const health=await app.liveHealth();const a=el('article',undefined,'item');a.append(el('strong','Live Ledger'),row('État',health.enabled?'Connecté / disponible':'Non actif sur ce déploiement'),row('Séquence',health.latest??0));noticesRoot.prepend(a);
    }catch{}
    try{
      const hubs=await app.listCommunityHubs();if(hubs.length){const h=el('article',undefined,'item');h.append(el('strong',hubs.length+' Hub(s) du groupe'),action('Voir Communauté & économie','ecosystem'));spaces.append(h);}
    }catch{}
    for(const c of personalCommunities.slice(0,8)){const a=el('article',undefined,'item');a.append(el('strong',c.name),row('Communauté',c.locality||'Sans localité'));spaces.append(a);}
    const opportunities=el('section',undefined,'item personal-opportunity-actions');
    opportunities.append(el('strong',tr('Mes opportunités économiques','My business opportunities')));
    opportunities.append(el('p',tr('Transformez vos besoins en demandes gouvernées et proposez vos services. Aucun engagement automatique.','Turn your needs into governed requests and offer services. No automatic commitment.'),'hint'));
    const buttons=el('div',undefined,'actions');
    for(const [kind,fr,en] of [['REQUEST','Exprimer un besoin','Post a need'],['OFFER','Proposer un produit ou service','Offer a product or service']]){
      const button=el('button',tr(fr,en),'secondary');
      button.type='button';
      button.onclick=()=>window.dispatchEvent(new CustomEvent('eco:forum-opportunity-intent',{detail:{groupId:app.activeGroup(),kind,title:'',body:''}}));
      buttons.append(button);
    }
    const discover=el('button',tr('Rechercher des opportunités','Explore opportunities'),'link-btn');
    discover.type='button';discover.onclick=()=>navigate('ecosystem',{anchor:'valueNetworkOperational',force:true});buttons.append(discover);
    opportunities.append(buttons);spaces.append(opportunities);
    spaces.append(action('Découvrir d’autres groupes','discovery'),action('Communautés d’intérêt','ecosystem'));
  };
  document.getElementById('ecoPulseRefreshBtn')?.addEventListener('click',()=>void renderPulse());
  return{refresh,refreshPulse:renderPulse};
}
