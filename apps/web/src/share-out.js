const clean=(value,max=280)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
const encode=value=>encodeURIComponent(String(value??''));
const decode=value=>{try{return decodeURIComponent(String(value??''));}catch{return String(value??'');}};
const safeKind=value=>clean(value,48).toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'item';

export const buildEcoShareIntent=input=>{
  const parts=[input.view||'ecosystem',input.anchor||'',safeKind(input.kind),input.groupId||'',input.objectId||'',input.contextId||''].map(encode);
  return '#eco-share='+parts.join(':');
};

export const parseEcoShareIntent=(hash=globalThis.location?.hash??'')=>{
  const raw=String(hash??'');if(!raw.startsWith('#eco-share='))return null;
  const parts=raw.slice('#eco-share='.length).split(':');if(parts.length<5)return null;
  const [view,anchor,kind,groupId,objectId,contextId='']=parts.map(decode);
  if(!kind||!groupId||!objectId)return null;
  return{view:view||'ecosystem',anchor,kind:safeKind(kind),groupId,objectId,contextId};
};

export const buildWhatsAppSharePayload=(input,locationLike=globalThis.location)=>{
  const title=clean(input.title,180)||'Eco-System';
  const summary=clean(input.summary,360);
  const intent=buildEcoShareIntent(input);
  const origin=String(locationLike?.origin??'').replace(/\/$/,'');
  const pathname=String(locationLike?.pathname??'/').startsWith('/')?String(locationLike?.pathname??'/'):'/'+String(locationLike?.pathname??'');
  const deepLink=origin+pathname+intent;
  const kind=safeKind(input.kind).toUpperCase().replace(/[^A-Z0-9]+/g,'-').slice(0,16);
  const objectToken=String(input.objectId??'').replace(/[^a-zA-Z0-9]+/g,'').slice(-10).toUpperCase()||'OBJECT';
  const refCode='ECO-'+kind+'-'+objectToken;
  const lines=['Eco-System · '+title];
  if(summary)lines.push(summary);
  lines.push('Réf. '+refCode,deepLink);
  const text=lines.join('\n');
  return{intent,deepLink,refCode,text,whatsappUrl:'https://wa.me/?text='+encodeURIComponent(text)};
};

export const openWhatsAppShare=input=>{
  const payload=buildWhatsAppSharePayload(input);
  if(typeof window==='undefined')return payload;
  const opened=window.open(payload.whatsappUrl,'_blank','noopener,noreferrer');
  if(!opened&&window.location?.assign)window.location.assign(payload.whatsappUrl);
  return payload;
};

export const findEcoShareTarget=(intent,root=document)=>{
  if(!intent||!root?.querySelectorAll)return null;
  return [...root.querySelectorAll('[data-eco-share-kind][data-eco-share-id]')].find(node=>node.dataset.ecoShareKind===intent.kind&&node.dataset.ecoShareId===intent.objectId)??null;
};

export const focusEcoShareTarget=(intent,root=document)=>{
  const node=findEcoShareTarget(intent,root);if(!node)return null;
  node.classList.add('eco-share-target');
  node.scrollIntoView?.({behavior:'smooth',block:'center'});
  setTimeout(()=>node.classList.remove('eco-share-target'),5000);
  return node;
};
