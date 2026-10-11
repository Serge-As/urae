/**
 * Presentation only. Never changes finance, campaign approval, rights or group records.
 * Media is loaded through ConnectedApplication using the same authenticated headers
 * as all other calls, never a public /media URL or externally supplied remote origin.
 */
const locations=[
  ['HOME_HERO','#view-dashboard > .hero','eco-home-visual'],
  ['GROUP_COVER','#groupHomePanel > .panel-head','eco-group-visual'],
  ['GROUP_LOGO','#activeGroupCard','eco-logo-visual'],
  ['MARKET_HERO','#marketEnginePanel','eco-market-visual'],
  ['FORUM_HERO','#interestCommunityPanel','eco-forum-visual'],
  ['PROFILE_PHOTO','#personalCockpitPanel > .panel-head','eco-profile-visual']
];
const fr=(f,e)=>document.documentElement.lang==='en'?e:f;
export function mountVisualMediaPresenter({app,showError=console.error}={}){
  let generation=0;
  let urls=[];
  const clear=()=>{
    document.querySelectorAll('[data-eco-visual-media]').forEach(x=>x.remove());
    for(const url of urls)URL.revokeObjectURL(url);
    urls=[];
  };
  const refresh=async()=>{
    const version=++generation;
    clear();
    if(!app.activeGroup())return;
    let slots;
    try{slots=await app.visualMediaSlots();}
    catch(error){/* Offline remains fully functional without optional media. */return;}
    if(version!==generation)return;
    for(const [slot,selector,cssClass] of locations){
      const id=slots?.[slot],target=document.querySelector(selector);
      if(!id||!target)continue;
      try{
        const blob=await app.visualMediaBlob(id);
        if(version!==generation)return;
        const objectUrl=URL.createObjectURL(blob);urls.push(objectUrl);
        const frame=document.createElement('figure');
        frame.className='eco-visual-display '+cssClass;
        frame.dataset.ecoVisualMedia=slot;
        const image=document.createElement('img');
        image.src=objectUrl;image.decoding='async';image.loading=slot==='HOME_HERO'?'eager':'lazy';
        image.alt=fr('Image de présentation : '+slot,'Presentation image: '+slot);
        frame.append(image);
        // Insert after the heading in the same original domain; never replace
        // any canonical controls, session input, Recap or existing content.
        target.insertAdjacentElement('afterend',frame);
      }catch(error){/* A missing asset cannot hide operational features. */}
    }
  };
  document.addEventListener('eco:group-context-changed',()=>void refresh());
  document.addEventListener('eco:visual-media-updated',()=>void refresh());
  document.addEventListener('eco:language-changed',()=>void refresh());
  return{refresh};
}
