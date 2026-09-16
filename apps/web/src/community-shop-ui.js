const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const v=id=>String(document.getElementById(id)?.value??'').trim();
const split=value=>value.split(',').map(x=>x.trim()).filter(Boolean);
const row=(label,value)=>{const p=el('p');const b=el('strong',label+' : ');p.append(b,document.createTextNode(String(value??'—')));return p;};

export function mountCommunityShopUI({app,notify=()=>{},showError=console.error,isManager=()=>false,fmt=n=>String(n)}){
  let hubs=[],activeHub='',lastTimeline=null,draftDirty=false,draftTimer,readTimer,observer,pollTimer,lastDraftUpdated='';
  const hubList=document.getElementById('communityHubList'),postList=document.getElementById('communityPostList'),hubSelect=document.getElementById('communityPostHub'),storefront=document.getElementById('groupStorefront');
  const bodyInput=document.getElementById('communityPostBody'),titleInput=document.getElementById('communityPostTitle'),kindInput=document.getElementById('communityPostKind'),draftStatus=document.getElementById('communityDraftStatus'),readStatus=document.getElementById('communityReadStatus');

  const saveDraft=async()=>{
    clearTimeout(draftTimer);if(!activeHub||!app.activeGroup())return;
    try{
      const d=await app.saveCommunityDraft(activeHub,{body:bodyInput?.value??'',title:titleInput?.value??'',kind:kindInput?.value??'DISCUSSION'});
      draftDirty=false;lastDraftUpdated=d.updatedAt??'';if(draftStatus)draftStatus.textContent='Brouillon synchronisé · '+new Date(d.updatedAt).toLocaleTimeString('fr-FR');
      try{await app.publishLive('SYNC_HINT',{kind:'FORUM_DRAFT',hubId:activeHub});}catch{}
    }catch(e){if(draftStatus)draftStatus.textContent='Brouillon local en attente de synchronisation.';showError(e);}
  };
  const scheduleDraft=()=>{draftDirty=true;if(draftStatus)draftStatus.textContent='Synchronisation du brouillon…';clearTimeout(draftTimer);draftTimer=setTimeout(()=>void saveDraft(),900);};

  const markReadLater=postId=>{
    clearTimeout(readTimer);readTimer=setTimeout(()=>void(async()=>{try{if(!activeHub)return;await app.saveCommunityReadCursor(activeHub,postId);if(readStatus)readStatus.textContent='Position de lecture synchronisée.';}catch(e){showError(e);}})(),1000);
  };
  const observePosts=()=>{
    observer?.disconnect();if(!postList||!('IntersectionObserver' in window))return;
    observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting&&x.intersectionRatio>=0.6).map(x=>x.target).sort((a,b)=>Number(a.dataset.timelineIndex)-Number(b.dataset.timelineIndex));
      if(visible.length)markReadLater(visible.at(-1).dataset.postId);
    },{root:null,threshold:[0.6]});
    postList.querySelectorAll('[data-post-id]').forEach(n=>observer.observe(n));
  };

  const renderHubs=async()=>{
    if(!hubList||!hubSelect||!app.activeGroup())return;
    hubs=await app.listCommunityHubs();hubList.replaceChildren();hubSelect.replaceChildren();
    if(!hubs.length){hubList.append(el('p','Aucun Hub. Créez un espace thématique pour démarrer une communauté.','hint'));hubSelect.append(new Option('Aucun Hub',''));activeHub='';postList?.replaceChildren();return;}
    for(const hub of hubs){
      hubSelect.append(new Option(hub.title,hub.id));
      const card=el('article',undefined,'item');card.append(el('strong',hub.title),row('Visibilité',hub.data?.visibility),row('Modération',hub.data?.moderation));
      const open=el('button','Ouvrir / reprendre','secondary');open.type='button';open.onclick=()=>{activeHub=hub.id;hubSelect.value=hub.id;draftDirty=false;void renderTimeline(true,true);};card.append(open);hubList.append(card);
    }
    if(!activeHub||!hubs.some(x=>x.id===activeHub))activeHub=hubs[0].id;hubSelect.value=activeHub;await renderTimeline(true,true);
  };

  const addEngagement=(card,post,engagement)=>{
    const reactions=el('div',undefined,'actions');
    const defs=[['LIKE','👍'],['LOVE','❤️'],['CELEBRATE','🎉'],['INSIGHTFUL','💡']];
    for(const [code,label] of defs){
      const count=Number(engagement?.reactions?.[code]??0),mine=(engagement?.myReactions??[]).includes(code),b=el('button',label+(count?' '+count:''),mine?'primary':'link-btn');b.type='button';
      b.onclick=()=>void(async()=>{try{await app.reactCommunityPost(post.id,code);await renderTimeline(false,false);}catch(e){showError(e);}})();reactions.append(b);
    }
    card.append(reactions);
    const comments=engagement?.comments??[];
    if(comments.length){const box=el('div',undefined,'stack');for(const c of comments.slice(-20)){const item=el('div',undefined,'item');item.append(el('p',c.summary??''),el('small',new Date(c.createdAt).toLocaleString('fr-FR')));box.append(item);}card.append(box);}
    const commentWrap=el('div',undefined,'inline-form'),input=el('input');input.placeholder='Répondre / commenter…';const send=el('button','Envoyer','secondary');send.type='button';
    send.onclick=()=>void(async()=>{try{if(!input.value.trim())return;await app.commentCommunityPost(post.id,input.value.trim());input.value='';await renderTimeline(false,false);}catch(e){showError(e);}})();commentWrap.append(input,send);card.append(commentWrap);
  };

  const renderTimeline=async(resume=false,restoreDraft=false)=>{
    if(!postList||!activeHub){postList?.replaceChildren();return;}
    const beforeAnchor=lastTimeline?.cursor?.anchorPostId;
    const data=await app.communityTimeline(activeHub,80);lastTimeline=data;postList.replaceChildren();
    if(readStatus)readStatus.textContent=(data.unreadCount??0)+' message(s) après votre dernière position · '+data.total+' au total';
    if(restoreDraft&&data.draft&&!draftDirty){
      if(bodyInput)bodyInput.value=data.draft.body??'';if(titleInput)titleInput.value=data.draft.draftTitle??'';if(kindInput)kindInput.value=data.draft.postKind??'DISCUSSION';
      lastDraftUpdated=data.draft.updatedAt??'';if(draftStatus)draftStatus.textContent='Brouillon restauré du serveur · '+new Date(data.draft.updatedAt).toLocaleString('fr-FR');
    }else if(!draftDirty&&data.draft&&data.draft.updatedAt>lastDraftUpdated){
      if(bodyInput)bodyInput.value=data.draft.body??'';if(titleInput)titleInput.value=data.draft.draftTitle??'';if(kindInput)kindInput.value=data.draft.postKind??'DISCUSSION';lastDraftUpdated=data.draft.updatedAt;
      if(draftStatus)draftStatus.textContent='Brouillon mis à jour depuis un autre appareil.';
    }
    if(!data.posts.length){postList.append(el('p','Aucune publication dans ce Hub.','hint'));return;}
    data.posts.forEach((post,index)=>{
      const card=el('article',undefined,'item');card.dataset.postId=post.id;card.dataset.timelineIndex=String(data.start+index);
      card.append(el('strong',post.title),el('span',post.data?.postKind??'DISCUSSION','pill'),el('p',post.summary??''),el('small',new Date(post.createdAt).toLocaleString('fr-FR')));
      if(data.cursor?.anchorPostId===post.id)card.prepend(el('div','← Votre dernière position mémorisée','truth-notice'));
      addEngagement(card,post,data.engagement?.[post.id]);
      if(isManager()){
        const action=el('button',post.data?.moderationState==='HIDDEN'?'Republier':'Masquer','secondary');action.type='button';
        action.onclick=()=>void(async()=>{const target=post.data?.moderationState==='HIDDEN'?'PUBLISHED':'HIDDEN';const reason=window.prompt('Motif de modération :','Modération par un responsable du groupe.');if(!reason?.trim())return;try{await app.moderateCommunityPost(post.id,target,reason.trim());notify('Modération enregistrée et auditée.');await renderTimeline(false,false);}catch(e){showError(e);}})();card.append(action);
      }
      postList.append(card);
    });
    observePosts();
    if(resume&&data.cursor?.anchorPostId){postList.querySelector(`[data-post-id="${CSS.escape(data.cursor.anchorPostId)}"]`)?.scrollIntoView({block:'center',behavior:'smooth'});}
    else if(resume&&!beforeAnchor)postList.lastElementChild?.scrollIntoView({block:'nearest'});
  };

  const renderStorefront=async()=>{
    if(!storefront||!app.activeGroup())return;storefront.replaceChildren();
    const data=await app.groupStorefront();
    if(data.shop){
      const head=el('article',undefined,'item');head.append(el('strong',data.shop.name),row('Slogan',data.shop.tagline||'—'),row('Visibilité',data.shop.visibility),row('Localité',data.shop.locality||'—'),row('Catégories',(data.shop.categories??[]).join(', ')||'—'));storefront.append(head);
      const name=document.getElementById('groupShopName'),tag=document.getElementById('groupShopTagline'),vis=document.getElementById('groupShopVisibility'),loc=document.getElementById('groupShopLocality'),cats=document.getElementById('groupShopCategories');
      if(name)name.value=data.shop.name??'';if(tag)tag.value=data.shop.tagline??'';if(vis)vis.value=data.shop.visibility??'GROUP_ONLY';if(loc)loc.value=data.shop.locality??'';if(cats)cats.value=(data.shop.categories??[]).join(', ');
    }else storefront.append(el('p','La boutique n’est pas encore configurée.','hint'));
    for(const item of data.items??[]){const card=el('article',undefined,'item');card.append(el('strong',item.name),row('SKU',item.sku),row('Disponible',item.available+' '+item.unit),row('Prix',fmt(item.unitPrice)),row('Description',item.description||'—'));storefront.append(card);}
    if(isManager()){
      const records=await app.listWorkspaceRecords('MARKETPLACE.CORE',app.activeGroup()),stocks=records.filter(x=>x.data?.marketKind==='STOCK_ITEM');
      if(stocks.length){const manage=el('section',undefined,'stack');manage.append(el('h4','Publication des articles du stock'));for(const item of stocks){
        const card=el('article',undefined,'item');card.append(el('strong',item.title),row('Stock',Number(item.data.quantity)-Number(item.data.reserved??0)),row('Vitrine',item.data.published?'Publié':'Masqué'));
        const toggle=el('button',item.data.published?'Retirer de la vitrine':'Publier dans la vitrine',item.data.published?'secondary':'primary');toggle.type='button';
        toggle.onclick=()=>void(async()=>{try{let price=Number(item.data.unitPrice??0);if(!item.data.published){const raw=window.prompt('Prix unitaire XAF :',String(price||0));if(raw===null)return;price=Math.max(0,Math.trunc(Number(raw)||0));}await app.setStockListing(item.id,{published:!Boolean(item.data.published),unitPrice:price,description:String(item.data.description??'')});notify('Vitrine mise à jour.');await renderStorefront();}catch(e){showError(e);}})();card.append(toggle);manage.append(card);
      }storefront.append(manage);}
    }
  };

  document.getElementById('communityHubForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{const hub=await app.createCommunityHub({title:v('communityHubTitle'),about:v('communityHubAbout')||undefined,visibility:v('communityHubVisibility'),tags:split(v('communityHubTags')),federatedGroupCodes:split(v('communityFederatedCodes'))});activeHub=hub.id;notify('Hub communautaire créé.');await renderHubs();}catch(err){showError(err);}})();});
  hubSelect?.addEventListener('change',()=>{void saveDraft().finally(()=>{activeHub=hubSelect.value;draftDirty=false;void renderTimeline(true,true);});});
  for(const node of [bodyInput,titleInput,kindInput])node?.addEventListener(node===kindInput?'change':'input',scheduleDraft);
  document.getElementById('communityResumeBtn')?.addEventListener('click',()=>void renderTimeline(true,false));
  document.getElementById('communityPostForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{const hubId=v('communityPostHub');if(!hubId)throw Error('COMMUNITY_HUB_REQUIRED');await app.createCommunityPost(hubId,{kind:v('communityPostKind'),title:v('communityPostTitle')||undefined,body:v('communityPostBody')});if(bodyInput)bodyInput.value='';if(titleInput)titleInput.value='';draftDirty=false;lastDraftUpdated='';if(draftStatus)draftStatus.textContent='Publié · brouillon serveur vidé.';notify('Publication ajoutée.');activeHub=hubId;await renderTimeline(false,false);}catch(err){showError(err);}})();});
  document.getElementById('groupShopForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{await app.saveGroupShop({name:v('groupShopName'),tagline:v('groupShopTagline')||undefined,visibility:v('groupShopVisibility'),locality:v('groupShopLocality')||undefined,categories:split(v('groupShopCategories'))});notify('Boutique du groupe enregistrée.');await renderStorefront();}catch(err){showError(err);}})();});

  pollTimer=setInterval(()=>{if(activeHub&&!document.hidden&&!draftDirty)void renderTimeline(false,true).catch(()=>{});},5000);
  window.addEventListener('beforeunload',()=>{clearInterval(pollTimer);clearTimeout(draftTimer);clearTimeout(readTimer);if(draftDirty)void saveDraft();},{once:true});

  const refresh=async()=>{if(!app.activeGroup()){hubList?.replaceChildren();postList?.replaceChildren();storefront?.replaceChildren();return;}try{await Promise.all([renderHubs(),renderStorefront()]);}catch(e){showError(e);}};
  return{refresh};
}
