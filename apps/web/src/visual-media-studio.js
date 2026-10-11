const mediaSlots=[
  ['HOME_HERO','Bannière Accueil','Home banner'],
  ['GROUP_LOGO','Logo du groupe','Group logo'],
  ['GROUP_COVER','Couverture du groupe','Group cover'],
  ['MARKET_HERO','Bannière Marketplace','Marketplace banner'],
  ['FORUM_HERO','Bannière Forum','Forum banner'],
  ['PROFILE_PHOTO','Ma photo de profil','My profile picture'],
  ['AD_CREATIVE','Visuel publicitaire','Advertising creative']
];
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const tr=(fr,en)=>document.documentElement.lang?.toLowerCase().startsWith('en')?en:fr;

export function mountVisualMediaStudio({app,notify=()=>{},showError=console.error,isManager=()=>false}={}){
  const host=document.getElementById('ecoVisualMediaStudio');
  if(!host)return{refresh:async()=>{}};
  let generation=0;
  let previewUrls=[];
  const clearUrls=()=>{for(const url of previewUrls)URL.revokeObjectURL(url);previewUrls=[];};
  const draw=async()=>{
    const token=++generation;
    clearUrls();host.replaceChildren();
    const group=app.activeGroup();
    if(!group){host.append(el('p','hint',tr('Choisissez d’abord un groupe.','Choose a group first.')));return;}
    let assets,slots;
    try{[assets,slots]=await Promise.all([app.visualMediaList(),app.visualMediaSlots()]);}
    catch(error){if(token===generation){host.append(el('p','hint',tr('Bibliothèque indisponible : ','Media library unavailable: ')+String(error?.message??error)));}return;}
    if(token!==generation)return;
    const hint=el('p','truth-notice',tr('Les images sont privées par défaut. Vous pouvez remplacer votre photo et, avec les droits requis, les visuels du groupe. Une image de campagne est soumise à la validation AdManager.','Images are private by default. You may replace your own photo and, with the required permissions, group visuals. Advertising creatives still require AdManager approval.'));
    host.append(hint);
    const grid=el('div','eco-media-grid');
    for(const [slot,fr,en] of mediaSlots.filter(([slot])=>isManager()||slot==='PROFILE_PHOTO')){
      const card=el('section','eco-media-slot item'),head=el('div','eco-media-head');
      head.append(el('strong','',tr(fr,en)));
      const preview=el('div','eco-media-preview');
      const assetId=slots?.[slot];
      if(assetId){
        const img=el('img');img.alt=tr(fr,en);img.loading='lazy';
        preview.append(img);
        void app.visualMediaBlob(assetId).then(blob=>{
          if(token!==generation)return;
          const url=URL.createObjectURL(blob);previewUrls.push(url);img.src=url;
        }).catch(()=>{if(token===generation)preview.replaceChildren(el('span','hint',tr('Image indisponible','Image unavailable')));});
      }else{
        preview.append(el('span','eco-media-placeholder',slot==='PROFILE_PHOTO'?'◉':slot==='GROUP_LOGO'?'✦':'▧'));
      }
      const form=el('form','eco-media-form');
      const file=document.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.required=true;
      file.setAttribute('aria-label',tr('Importer : '+fr,'Upload: '+en));
      const save=el('button','primary',tr('Remplacer l’image','Replace image'));save.type='submit';
      form.append(file,save);
      form.onsubmit=event=>{event.preventDefault();void(async()=>{
        const selected=file.files?.[0];if(!selected)return;
        if(selected.size>2000000){showError(new Error('MEDIA_SIZE_OUT_OF_RANGE'));return;}
        save.disabled=true;
        try{
          const asset=await app.uploadVisualMedia(selected,slot);
          await app.setVisualMediaSlot(slot,asset.id);
          notify(tr('Image enregistrée.','Image saved.'));
          document.dispatchEvent(new CustomEvent('eco:visual-media-updated',{detail:{slot,groupId:group}}));
          await draw();
        }catch(error){showError(error);}
        finally{save.disabled=false;}
      })();};
      const actions=el('div','actions');
      if(assetId){
        const remove=el('button','secondary',tr('Retirer','Remove'));remove.type='button';
        remove.onclick=()=>void(async()=>{
          if(!window.confirm(tr('Retirer cette image de la présentation ?','Remove this image from this presentation?')))return;
          try{await app.setVisualMediaSlot(slot,'');notify(tr('Image retirée.','Image removed.'));document.dispatchEvent(new CustomEvent('eco:visual-media-updated',{detail:{slot,groupId:group}}));await draw();}catch(error){showError(error);}
        })();
        actions.append(remove);
      }
      card.append(head,preview,form,actions);
      grid.append(card);
    }
    host.append(grid);
    const gallery=el('details','eco-media-library'),summary=el('summary','',tr('Bibliothèque de médias ('+assets.length+')','Media library ('+assets.length+')'));
    gallery.append(summary);
    for(const asset of assets){
      const item=el('p','hint',asset.name+' · '+asset.purpose+' · '+Math.ceil(asset.size/1024)+' Ko');
      gallery.append(item);
    }
    host.append(gallery);
  };
  const active=()=>document.getElementById('view-ecosystem')?.classList.contains('active')===true;
  const refresh=()=>active()?draw().catch(showError):Promise.resolve();
  document.addEventListener('eco:group-context-changed',refresh);
  document.addEventListener('eco:language-changed',refresh);
  window.addEventListener('eco:view-changed',event=>{if(event.detail?.view==='ecosystem')void refresh();});
  return{refresh};
}
