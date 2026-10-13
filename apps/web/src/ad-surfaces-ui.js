const label=(fr,en)=>document.documentElement.lang?.startsWith('en')?en:fr;
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);if(cls)n.className=cls;return n;};
const SURFACES=[
 {placement:'HOME_AFTER_PRIORITIES',host:'#view-dashboard .hero'},
 {placement:'FORUM_NATIVE',host:'#communityEnginePanel .section-kicker'},
 {placement:'MARKETPLACE_SPONSORED',host:'#marketEnginePanel > summary'}
];
const resolveDestination=(ref)=>{
 const value=String(ref??'');
 if(value.startsWith('deal:'))return{view:'ecosystem',anchor:'socialCommercePanel'};
 if(value.startsWith('group-buy:')||value.startsWith('stock:'))return{view:'ecosystem',anchor:'marketEnginePanel'};
 if(value.startsWith('community:'))return{view:'ecosystem',anchor:'communityEnginePanel'};
 if(value.startsWith('service:'))return{view:'ecosystem',anchor:'valueNetworkOperational'};
 if(value==='module:ACADEMY')return{view:'ecosystem',anchor:'academyOperational'};
 if(value==='module:ECONOMIC.DEMAND.EXCHANGE.CORE')return{view:'ecosystem',anchor:'valueNetworkOperational'};
 if(value==='view:finance#assistanceRulebookPanel')return{view:'finance',anchor:'assistanceRulebookPanel'};
 if(value==='module:MEETING.AUTOPILOT')return{view:'operations',anchor:'meetingList'};
 if(value.startsWith('module:'))return{view:'ecosystem',anchor:'blueprintExecutablePanel',generic:true};
 return null;
};
/** Strictly presentational advertising. No invented impressions, billing or click statistics. */
export function mountAdSurfacesUI({app,navigate=()=>{},showError=console.error}={}){
 let group=null,generation=0,urls=[];
 const clear=()=>{document.querySelectorAll('[data-eco-ad-surface]').forEach(x=>x.remove());for(const url of urls)URL.revokeObjectURL(url);urls=[];};
 const refresh=async(force=false)=>{
  const groupId=app.activeGroup()??null;
  const criticalFlow=Boolean(document.querySelector('#view-finance.active, #view-sessions.active, #view-operations.active, #view-recap.active'));
  const offline=typeof navigator!=='undefined'&&navigator.onLine===false;
  // Advertisements are optional; no network call may delay a financial
  // operation, live reconciliation, or offline outbox replay.
  if(!groupId||criticalFlow||offline){
    if(group!==groupId){group=groupId;generation++;clear();}
    return;
  }
  if(!force&&groupId===group)return;
  group=groupId;const stamp=++generation;clear();
  const results=await Promise.all(SURFACES.map(async spec=>{
    try{return{spec,ad:await app.adSurface(spec.placement)};}catch{return{spec,ad:null};}
  }));
  if(stamp!==generation)return;
  for(const {spec,ad} of results){
   const host=document.querySelector(spec.host);
   if(!host||!ad||ad.kind==='NONE'||!ad.headline)continue;
   const article=el('article',undefined,'eco-ad-surface');
   article.dataset.ecoAdSurface=spec.placement;
   article.setAttribute('aria-label',label('Emplacement publicitaire','Advertising placement'));
   article.append(el('span',ad.kind==='HOUSE'?label('Service Eco-System','Eco-System service'):label('Contenu sponsorisé · simulation','Sponsored content · sandbox'),'eco-ad-disclosure'));
   article.append(el('strong',ad.headline),el('p',ad.body));
   if(ad.mediaAssetId){
    const image=el('img',undefined,'eco-ad-surface-image');image.alt=String(ad.headline);image.loading='lazy';image.decoding='async';
    article.append(image);
    void app.visualMediaBlob(String(ad.mediaAssetId)).then(blob=>{
     if(stamp!==generation||!image.isConnected)return;
     const url=URL.createObjectURL(blob);urls.push(url);image.src=url;
    }).catch(()=>image.remove());
   }
   const destination=resolveDestination(ad.destinationRef);
   if(destination){
    const button=el('button',destination.generic?label('Explorer les services','Explore services'):ad.callToAction,'secondary');
    button.type='button';button.onclick=()=>navigate(destination.view,{anchor:destination.anchor,force:true});
    article.append(button);
   }
   host.insertAdjacentElement('afterend',article);
  }
 };
 const rerender=()=>void refresh(true).catch(showError);
 document.addEventListener('eco:group-context-changed',()=>void refresh().catch(showError));
 document.addEventListener('eco:ad-campaign-state-changed',rerender);
 document.addEventListener('eco:language-changed',rerender);
 window.addEventListener('online',rerender);
 window.addEventListener('eco:view-changed',event=>{if(['dashboard','ecosystem'].includes(event.detail?.view))rerender();});
 return{refresh};
}
