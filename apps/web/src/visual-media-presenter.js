/**
 * Presentation only. Never changes finance, campaign approval, rights or group records.
 * Media is loaded through ConnectedApplication using the same authenticated headers
 * as all other calls, never a public /media URL or externally supplied remote origin.
 */
const locations=[
  ['HOME_HERO','#view-dashboard > .cockpit-welcome, #view-dashboard > .hero','eco-home-visual'],
  ['GROUP_COVER','#groupHomePanel > .panel-head','eco-group-visual'],
  ['GROUP_LOGO','#activeGroupCard','eco-logo-visual'],
  ['MARKET_HERO','#marketEnginePanel','eco-market-visual'],
  ['FORUM_HERO','#interestCommunityPanel','eco-forum-visual'],
  ['PROFILE_PHOTO','#personalCockpitPanel > .panel-head','eco-profile-visual']
];
const fr=(f,e)=>document.documentElement.lang==='en'?e:f;
export function mountVisualMediaPresenter({app,showError=console.error}={}){
  let generation=0;
  let previousGroupId=null;
  let urls=[];
  let observer=null;
  const clear=()=>{
    observer?.disconnect();observer=null;
    document.querySelectorAll('[data-eco-visual-media]').forEach(x=>x.remove());
    for(const url of urls)URL.revokeObjectURL(url);
    urls=[];
  };
  const refresh=async(force=false)=>{
    const groupId=app.activeGroup()??null;
    const financial=Boolean(document.querySelector('#view-finance.active, #view-sessions.active, #view-operations.active, #view-recap.active'));
    const offline=typeof navigator!=='undefined'&&navigator.onLine===false;
    if(financial||offline){
      // Optional imagery must not trip the app-wide transport circuit-breaker
      // or compete with reconciliation/outbox during financial recovery.
      if(previousGroupId!==groupId){generation++;clear();previousGroupId=null;}
      return;
    }
    if(!force&&previousGroupId===groupId)return;
    const version=++generation;
    clear();
    if(!groupId){previousGroupId=null;return;}
    let slots,brand;
    try{[slots,brand]=await Promise.all([
      app.visualMediaSlots(),app.groupBrandSlots().catch(()=>({}))
    ]);}
    catch(error){previousGroupId=null;/* Offline remains fully functional without optional media. */return;}
    if(version!==generation)return;
    previousGroupId=groupId;
    const load=async(frame,id)=>{
      if(frame.dataset.ecoLoaded==='1')return;
      frame.dataset.ecoLoaded='1';
      try{
        const blob=frame.dataset.ecoBrand==='1'
          ?await app.groupBrandBlob(id):await app.visualMediaBlob(id);
        if(version!==generation||!frame.isConnected)return;
        const objectUrl=URL.createObjectURL(blob);urls.push(objectUrl);
        const image=document.createElement('img');
        image.src=objectUrl;image.decoding='async';image.loading='lazy';
        image.alt=fr('Image de présentation','Presentation image');
        frame.replaceChildren(image);
      }catch{
        // No image is better than a broken image above critical group operations.
        frame.remove();
      }
    };
    if(typeof IntersectionObserver==='function'){
      observer=new IntersectionObserver(entries=>{
        for(const entry of entries)if(entry.isIntersecting){
          observer?.unobserve(entry.target);
          void load(entry.target,entry.target.dataset.ecoAssetId);
        }
      },{rootMargin:'180px 0px'});
    }
    for(const [slot,selector,cssClass] of locations){
      const brandSlot=slot==='GROUP_LOGO'?'BRAND_LOGO':slot;
      const ownId=slots?.[slot],brandId=slot==='PROFILE_PHOTO'?null:brand?.[brandSlot];
      const id=ownId||brandId,target=document.querySelector(selector);
      if(!id||!target)continue;
      const frame=document.createElement('figure');
      frame.className='eco-visual-display '+cssClass;
      frame.dataset.ecoVisualMedia=slot;
      frame.dataset.ecoAssetId=id;
      if(!ownId&&brandId)frame.dataset.ecoBrand='1';
      frame.append(document.createElement('span'));
      target.insertAdjacentElement('afterend',frame);
      if(observer)observer.observe(frame);
      else void load(frame,id);
    }
  };
  document.addEventListener('eco:group-context-changed',()=>void refresh());
  document.addEventListener('eco:visual-media-updated',()=>void refresh(true));
  document.addEventListener('eco:language-changed',()=>void refresh(true));
  window.addEventListener('online',()=>void refresh(true));
  window.addEventListener('eco:view-changed',event=>{if(['dashboard','ecosystem'].includes(event.detail?.view))void refresh();});
  return{refresh};
}
