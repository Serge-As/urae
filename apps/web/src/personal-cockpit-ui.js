const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const row=(label,value)=>{const p=el('p');p.append(el('strong',label+' : '),document.createTextNode(String(value??'—')));return p;};
const detail=(label,type,id)=>{const b=el('button',label,'link-btn');b.type='button';b.dataset.detailType=type;b.dataset.detailId=id;return b;};
export function mountPersonalCockpitUI({app,getGroups,getMembers,getMeetings,navigate,fmt=n=>String(n),date=x=>String(x),showError=console.error}){
  const metrics=document.getElementById('personalCockpitMetrics'),situation=document.getElementById('personalSituation'),next=document.getElementById('personalNext'),noticesRoot=document.getElementById('personalLiveNotices'),spaces=document.getElementById('personalSpaces');
  if(!metrics||!situation||!next||!noticesRoot||!spaces)return{refresh:async()=>{}};
  const metric=(value,label)=>{const d=el('div',undefined,'metric');d.append(el('strong',String(value)),el('span',label));return d;};
  const action=(label,view)=>{const b=el('button',label,'secondary');b.type='button';b.onclick=()=>navigate(view);return b;};
  const refresh=async()=>{
    metrics.replaceChildren();situation.replaceChildren();next.replaceChildren();noticesRoot.replaceChildren();spaces.replaceChildren();
    const groups=getGroups(),groupId=app.activeGroup(),members=getMembers(),meetings=getMeetings(),mine=members.find(m=>m.userId===app.currentActor());
    metrics.append(metric(groups.length,'Groupes accessibles'));
    let personalCommunities=[];try{personalCommunities=await app.myInterestCommunities();}catch{}
    metrics.append(metric(personalCommunities.length,'Communautés d’intérêt'));
    if(!groupId){
      situation.append(el('p','Choisissez un groupe ou rejoignez-en un avec un code.','hint'),action('Choisir / rejoindre','discovery'));
      next.append(el('p','Aucun groupe actif : votre cockpit reste centré sur votre compte.','hint'));
      spaces.append(...groups.slice(0,12).map(g=>detail(g.name,'group',g.id)));
      for(const c of personalCommunities.slice(0,8)){const a=el('article',undefined,'item');a.append(el('strong',c.name),row('Communauté',c.locality||'Sans localité'));spaces.append(a);}
      spaces.append(action('Découvrir des communautés','ecosystem'));
      return;
    }
    const active=groups.find(g=>g.id===groupId);if(active)spaces.append(detail(active.name,'group',active.id));
    const open=meetings.filter(m=>m.status==='open'),future=meetings.filter(m=>m.scheduledAt&&Date.parse(m.scheduledAt)>=Date.now()).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
    metrics.append(metric(open.length,'Séances ouvertes'));
    if(mine){
      try{
        const statement=await app.memberStatement(mine.id);
        metrics.append(metric(fmt(statement.totalNetContributions),'Ma situation nette'));
        situation.append(detail(mine.displayName,'member',mine.id),row('Total net enregistré',fmt(statement.totalNetContributions)),row('Dernière actualisation',date(statement.asOf)));
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
      const health=await app.liveHealth();const a=el('article',undefined,'item');a.append(el('strong','Premium Live'),row('État',health.enabled?'Connecté / disponible':'Non activé sur ce déploiement'),row('Séquence',health.latest??0));noticesRoot.prepend(a);
    }catch{}
    try{
      const hubs=await app.listCommunityHubs();if(hubs.length){const h=el('article',undefined,'item');h.append(el('strong',hubs.length+' Hub(s) du groupe'),action('Voir Communauté & économie','ecosystem'));spaces.append(h);}
    }catch{}
    for(const c of personalCommunities.slice(0,8)){const a=el('article',undefined,'item');a.append(el('strong',c.name),row('Communauté',c.locality||'Sans localité'));spaces.append(a);}
    spaces.append(action('Découvrir d’autres groupes','discovery'),action('Communautés d’intérêt','ecosystem'));
  };
  return{refresh};
}