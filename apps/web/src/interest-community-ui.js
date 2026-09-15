const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const split=v=>String(v??'').split(',').map(x=>x.trim()).filter(Boolean);
const row=(label,value)=>{const p=el('p');p.append(el('strong',label+' : '),document.createTextNode(String(value??'—')));return p;};

export function mountInterestCommunityUI({app,notify=()=>{},showError=console.error,date=x=>String(x)}){
  const results=document.getElementById('interestCommunityResults'),mineRoot=document.getElementById('myInterestCommunityList'),workspace=document.getElementById('interestCommunityWorkspace'),title=document.getElementById('activeInterestCommunityTitle'),meta=document.getElementById('activeInterestCommunityMeta'),feedRoot=document.getElementById('interestCommunityFeed'),requestsBox=document.getElementById('interestCommunityRequestsBox');
  if(!results||!mineRoot||!workspace||!title||!meta||!feedRoot||!requestsBox)return{refresh:async()=>{},my:()=>[]};
  let mine=[],activeId='';

  const open=async (id,contentId)=>{
    activeId=id;workspace.hidden=false;
    const community=await app.interestCommunity(id);title.textContent=community.name;meta.textContent=[community.locality,(community.tags??[]).join(' · '),community.memberCount+' membre(s)'].filter(Boolean).join(' · ');
    const locality=document.getElementById('interestContentLocality');if(locality&&!locality.value)locality.value=community.locality??'';
    await Promise.all([renderFeed(),renderRequests(community)]);
    const target=contentId?feedRoot.querySelector(`[data-community-content-id="${CSS.escape(String(contentId))}"]`):null;
    (target??workspace).scrollIntoView({behavior:'smooth',block:'start'});
  };
  const renderCommunityCard=(c,container,discover=false)=>{
    const card=el('article',undefined,'item');card.append(el('strong',c.name),row('Localité',c.locality||'—'),row('Membres',c.memberCount),row('Centres d’intérêt',(c.tags??[]).join(', ')||'—'));
    if(c.description)card.append(el('p',c.description));
    const actions=el('div',undefined,'actions');
    if(c.viewerStatus==='ACTIVE'){const b=el('button','Ouvrir','primary');b.type='button';b.onclick=()=>void (async()=>{try{await app.recordEcoPulse({itemId:c.id,itemKind:'interest-community',action:'OPEN',source:'community-discovery',locality:c.locality,tags:c.tags??[]});await open(c.id);}catch(e){showError(e);}})();actions.append(b);}
    else if(discover){const b=el('button',c.joinPolicy==='OPEN'?'Rejoindre':'Demander à rejoindre','primary');b.type='button';b.onclick=()=>void (async()=>{try{const r=await app.joinInterestCommunity(c.id);await app.recordEcoPulse({itemId:c.id,itemKind:'interest-community',action:r.status==='JOINED'?'JOIN':'SEARCH_CLICK',source:'community-discovery',locality:c.locality,tags:c.tags??[]}).catch(()=>{});notify(r.status==='JOINED'?'Communauté rejointe.':'Demande envoyée.');await refresh();if(r.status==='JOINED')await open(c.id);}catch(e){showError(e);}})();actions.append(b);}
    card.append(actions);container.append(card);
  };
  const search=async()=>{
    results.replaceChildren();
    const found=await app.discoverInterestCommunities({q:value('interestCommunityQ')||undefined,locality:value('interestCommunityLocality')||undefined,tags:split(value('interestCommunityTags')),limit:50});
    if(!found.length){results.append(el('p','Aucune communauté correspondante pour le moment. Vous pouvez créer la première.','hint'));return;}
    for(const c of found)renderCommunityCard(c,results,true);
  };
  const renderMine=async()=>{
    mine=await app.myInterestCommunities();mineRoot.replaceChildren();
    if(!mine.length){mineRoot.append(el('p','Vous n’avez encore rejoint aucune communauté d’intérêt.','hint'));return;}
    for(const c of mine)renderCommunityCard(c,mineRoot,false);
  };
  const renderFeed=async()=>{
    feedRoot.replaceChildren();if(!activeId)return;
    const feed=await app.interestCommunityFeed(activeId,100);
    if(!feed.length){feedRoot.append(el('p','Le fil est vide. Soyez la première personne à partager une bonne adresse, un événement ou une discussion.','hint'));return;}
    for(const item of feed){
      const card=el('article',undefined,'item');card.dataset.communityContentId=item.id;const prefix={POST:'Publication',EVENT:'Événement',PLACE:'Bon coin',OFFER:'Offre',REQUEST:'Demande'}[item.kind]??item.kind;
      card.append(el('strong',(item.title||prefix)),el('span',prefix+' · '+(item.category||'général'),'pill'),el('p',item.body));
      if(item.locality)card.append(row('Lieu',item.locality));if(item.startsAt)card.append(row('Quand',date(item.startsAt)+(item.endsAt?' → '+date(item.endsAt):'')));feedRoot.append(card);
    }
  };
  const renderRequests=async community=>{
    requestsBox.replaceChildren();if(!['CREATOR','MODERATOR'].includes(String(community.viewerRole)))return;
    try{
      const requests=await app.interestJoinRequests(community.id),pending=requests.filter(r=>r.status==='PENDING');if(!pending.length)return;
      requestsBox.append(el('h3','Demandes d’adhésion'));
      for(const r of pending){
        const card=el('article',undefined,'item');card.append(el('strong',r.displayName));if(r.message)card.append(el('p',r.message));
        const actions=el('div',undefined,'actions');
        for(const [label,decision,cls] of [['Accepter','APPROVE','primary'],['Refuser','REJECT','secondary']]){
          const b=el('button',label,cls);b.type='button';b.onclick=()=>void (async()=>{try{await app.decideInterestJoin(community.id,r.id,decision);notify('Demande mise à jour.');await renderRequests(community);await renderMine();}catch(e){showError(e);}})();actions.append(b);
        }
        card.append(actions);requestsBox.append(card);
      }
    }catch{}
  };

  document.addEventListener('eco:open-interest-community',e=>{const id=e instanceof CustomEvent?String(e.detail?.id??''):'';const contentId=e instanceof CustomEvent?String(e.detail?.contentId??''):'';if(id)void open(id,contentId||undefined).catch(showError);});
  document.getElementById('interestCommunitySearchForm')?.addEventListener('submit',e=>{e.preventDefault();void search().catch(showError);});
  document.getElementById('interestCommunityCreateForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    const c=await app.createInterestCommunity({name:value('interestCommunityName'),description:value('interestCommunityDescription')||undefined,locality:value('interestCommunityCreateLocality')||undefined,visibility:value('interestCommunityVisibility'),joinPolicy:value('interestCommunityJoinPolicy'),tags:split(value('interestCommunityCreateTags'))});
    notify('Communauté créée.');document.getElementById('interestCommunityName').value='';await renderMine();await search();await open(c.id);
  }catch(err){showError(err);}})();});
  document.getElementById('interestContentForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    if(!activeId)throw Error('COMMUNITY_REQUIRED');
    await app.createInterestContent(activeId,{kind:value('interestContentKind'),title:value('interestContentTitle')||undefined,body:value('interestContentBody'),category:value('interestContentCategory')||undefined,locality:value('interestContentLocality')||undefined,startsAt:value('interestContentStartsAt')||undefined,endsAt:value('interestContentEndsAt')||undefined});
    document.getElementById('interestContentBody').value='';document.getElementById('interestContentTitle').value='';notify('Publication ajoutée.');await renderFeed();
  }catch(err){showError(err);}})();});
  document.getElementById('closeInterestCommunityBtn')?.addEventListener('click',()=>{activeId='';workspace.hidden=true;});

  const refresh=async()=>{try{await Promise.all([renderMine(),search()]);if(activeId&&mine.some(c=>c.id===activeId))await open(activeId);}catch(e){showError(e);}};
  return{refresh,my:()=>mine.slice()};
}
