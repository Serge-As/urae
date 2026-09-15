const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const v=id=>String(document.getElementById(id)?.value??'').trim();
const split=value=>value.split(',').map(x=>x.trim()).filter(Boolean);
const row=(label,value)=>{const p=el('p');const b=el('strong',label+' : ');p.append(b,document.createTextNode(String(value??'—')));return p;};

export function mountCommunityShopUI({app,notify=()=>{},showError=console.error,isManager=()=>false,fmt=n=>String(n)}){
  let hubs=[],activeHub='';
  const hubList=document.getElementById('communityHubList'),postList=document.getElementById('communityPostList'),hubSelect=document.getElementById('communityPostHub'),storefront=document.getElementById('groupStorefront');

  const renderHubs=async()=>{
    if(!hubList||!hubSelect||!app.activeGroup())return;
    hubs=await app.listCommunityHubs();hubList.replaceChildren();hubSelect.replaceChildren();
    if(!hubs.length){hubList.append(el('p','Aucun Hub. Créez un espace thématique pour démarrer une communauté.','hint'));hubSelect.append(new Option('Aucun Hub',''));activeHub='';postList?.replaceChildren();return;}
    for(const hub of hubs){
      hubSelect.append(new Option(hub.title,hub.id));
      const card=el('article',undefined,'item');card.append(el('strong',hub.title),row('Visibilité',hub.data?.visibility),row('Modération',hub.data?.moderation));
      const open=el('button','Ouvrir','secondary');open.type='button';open.onclick=()=>{activeHub=hub.id;hubSelect.value=hub.id;void renderPosts();};card.append(open);hubList.append(card);
    }
    if(!activeHub||!hubs.some(x=>x.id===activeHub))activeHub=hubs[0].id;hubSelect.value=activeHub;await renderPosts();
  };

  const renderPosts=async()=>{
    if(!postList||!activeHub){postList?.replaceChildren();return;}postList.replaceChildren();
    const posts=await app.listCommunityPosts(activeHub);
    if(!posts.length){postList.append(el('p','Aucune publication dans ce Hub.','hint'));return;}
    for(const post of posts){
      const card=el('article',undefined,'item');card.append(el('strong',post.title),row('Type',post.data?.postKind),el('p',post.summary??''),row('État',post.data?.moderationState));
      if(isManager()){
        const action=el('button',post.data?.moderationState==='HIDDEN'?'Republier':'Masquer','secondary');action.type='button';
        action.onclick=()=>void (async()=>{const target=post.data?.moderationState==='HIDDEN'?'PUBLISHED':'HIDDEN';const reason=window.prompt('Motif de modération :','Modération par un responsable du groupe.');if(!reason?.trim())return;try{await app.moderateCommunityPost(post.id,target,reason.trim());notify('Modération enregistrée et auditée.');await renderPosts();}catch(e){showError(e);}})();
        card.append(action);
      }
      postList.append(card);
    }
  };

  const renderStorefront=async()=>{
    if(!storefront||!app.activeGroup())return;storefront.replaceChildren();
    const data=await app.groupStorefront();
    if(data.shop){
      const head=el('article',undefined,'item');head.append(el('strong',data.shop.name),row('Slogan',data.shop.tagline||'—'),row('Visibilité',data.shop.visibility),row('Localité',data.shop.locality||'—'),row('Catégories',(data.shop.categories??[]).join(', ')||'—'));storefront.append(head);
      const name=document.getElementById('groupShopName'),tag=document.getElementById('groupShopTagline'),vis=document.getElementById('groupShopVisibility'),loc=document.getElementById('groupShopLocality'),cats=document.getElementById('groupShopCategories');
      if(name)name.value=data.shop.name??'';if(tag)tag.value=data.shop.tagline??'';if(vis)vis.value=data.shop.visibility??'GROUP_ONLY';if(loc)loc.value=data.shop.locality??'';if(cats)cats.value=(data.shop.categories??[]).join(', ');
    }else storefront.append(el('p','La boutique n’est pas encore configurée.','hint'));
    for(const item of data.items??[]){
      const card=el('article',undefined,'item');card.append(el('strong',item.name),row('SKU',item.sku),row('Disponible',item.available+' '+item.unit),row('Prix',fmt(item.unitPrice)),row('Description',item.description||'—'));storefront.append(card);
    }
    if(isManager()){
      const records=await app.listWorkspaceRecords('MARKETPLACE.CORE',app.activeGroup());
      const stocks=records.filter(x=>x.data?.marketKind==='STOCK_ITEM');
      if(stocks.length){const manage=el('section',undefined,'stack');manage.append(el('h4','Publication des articles du stock'));for(const item of stocks){
        const card=el('article',undefined,'item');card.append(el('strong',item.title),row('Stock',Number(item.data.quantity)-Number(item.data.reserved??0)),row('Vitrine',item.data.published?'Publié':'Masqué'));
        const toggle=el('button',item.data.published?'Retirer de la vitrine':'Publier dans la vitrine',item.data.published?'secondary':'primary');toggle.type='button';
        toggle.onclick=()=>void (async()=>{try{let price=Number(item.data.unitPrice??0);if(!item.data.published){const raw=window.prompt('Prix unitaire XAF :',String(price||0));if(raw===null)return;price=Math.max(0,Math.trunc(Number(raw)||0));}await app.setStockListing(item.id,{published:!Boolean(item.data.published),unitPrice:price,description:String(item.data.description??'')});notify('Vitrine mise à jour.');await renderStorefront();}catch(e){showError(e);}})();card.append(toggle);manage.append(card);
      }storefront.append(manage);}
    }
  };

  document.getElementById('communityHubForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{const hub=await app.createCommunityHub({title:v('communityHubTitle'),about:v('communityHubAbout')||undefined,visibility:v('communityHubVisibility'),tags:split(v('communityHubTags')),federatedGroupCodes:split(v('communityFederatedCodes'))});activeHub=hub.id;notify('Hub communautaire créé.');await renderHubs();}catch(err){showError(err);}})();});
  hubSelect?.addEventListener('change',()=>{activeHub=hubSelect.value;void renderPosts();});
  document.getElementById('communityPostForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{const hubId=v('communityPostHub');if(!hubId)throw Error('COMMUNITY_HUB_REQUIRED');await app.createCommunityPost(hubId,{kind:v('communityPostKind'),title:v('communityPostTitle')||undefined,body:v('communityPostBody')});document.getElementById('communityPostBody').value='';notify('Publication ajoutée.');activeHub=hubId;await renderPosts();}catch(err){showError(err);}})();});
  document.getElementById('groupShopForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{await app.saveGroupShop({name:v('groupShopName'),tagline:v('groupShopTagline')||undefined,visibility:v('groupShopVisibility'),locality:v('groupShopLocality')||undefined,categories:split(v('groupShopCategories'))});notify('Boutique du groupe enregistrée.');await renderStorefront();}catch(err){showError(err);}})();});

  const refresh=async()=>{if(!app.activeGroup()){hubList?.replaceChildren();postList?.replaceChildren();storefront?.replaceChildren();return;}try{await Promise.all([renderHubs(),renderStorefront()]);}catch(e){showError(e);}};
  return{refresh};
}
