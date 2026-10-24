// UI projection only. Business profiles and permissions remain with their owners.
export const JOURNEY_VIEWS = Object.freeze(['dashboard','inbox','discovery','launch','assistant','operations','sessions','members','finance','tontines','recap','ecosystem','services','documents','relay','settings']);
const RETENTION_DAYS = [1,7,30];
export function createJourneyContext({storage, scope, now = Date.now} = {}) {
  const key = () => { const s=scope(); return s?.actor ? 'eco.journey.v1.'+encodeURIComponent(s.actor)+'.'+encodeURIComponent(s.group||'personal') : null; };
  const raw = () => {try{return JSON.parse(storage.getItem(key())||'null')||{};}catch{return{};}};
  const deviceKey=()=>scope()?.actor?'eco.journey.device.v1.'+encodeURIComponent(scope().actor):null;
  const deviceEnabled=()=>{try{return !!deviceKey()&&storage.getItem(deviceKey())!=='paused';}catch{return !!deviceKey();}};
  const retentionDays=()=>RETENTION_DAYS.includes(raw().retentionDays)?raw().retentionDays:30;
  const validTime=at=>Number.isFinite(at)&&at<=now()&&now()-at<retentionDays()*86400000;
  const read = () => {
    const k=key(); if(!k)return {enabled:false,recent:[]};
    try { const v=raw(),enabled=v.enabled!==false&&deviceEnabled(); return {enabled,recent:enabled&&Array.isArray(v.recent)?v.recent.filter(r=>JOURNEY_VIEWS.includes(r?.view)&&validTime(r.at)).slice(0,8).map(r=>({view:r.view,at:r.at})):[]}; }
    catch { return {enabled:true,recent:[]}; }
  };
  const write = v => { const k=key(); if(k)try{storage.setItem(k,JSON.stringify({retentionDays:retentionDays(),...v}));return true;}catch{} return false; };
  const references=()=>{
    if(!read().enabled)return[];
    try{const v=raw();return Array.isArray(v.references)?v.references.filter(r=>r?.kind==='meeting'&&typeof r.id==='string'&&r.id.length>0&&r.id.length<=240&&/^[\w.:/-]+$/.test(r.id)&&['sessions','operations'].includes(r.view)&&validTime(r.at)).slice(0,16).map(r=>({kind:'meeting',id:r.id,view:r.view,at:r.at})):[];}catch{return[];}
  };
  return {
    snapshot:read,
    references,
    settings:()=>({retentionDays:retentionDays(),deviceEnabled:deviceEnabled(),groupEnabled:raw().enabled!==false}),
    setRetentionDays(days){if(!RETENTION_DAYS.includes(days)||!key())return false;const state=read(),refs=references(),valid=at=>now()-at<days*86400000;return write({enabled:raw().enabled!==false,retentionDays:days,recent:state.recent.filter(r=>valid(r.at)),references:refs.filter(r=>valid(r.at))});},
    setDeviceEnabled(enabled){const k=deviceKey();if(!k)return false;try{storage.setItem(k,enabled?'enabled':'paused');return true;}catch{return false;}},
    forget(view){if(!JOURNEY_VIEWS.includes(view))return false;return write({enabled:raw().enabled!==false,recent:read().recent.filter(r=>r.view!==view),references:references().filter(r=>r.view!==view)});},
    rememberReference(reference){const r=reference,v=read();if(!v.enabled||r?.kind!=='meeting'||typeof r.id!=='string'||!r.id||r.id.length>240||!/^[\w.:/-]+$/.test(r.id)||!['sessions','operations'].includes(r.view))return false;write({...v,references:[{kind:'meeting',id:r.id,view:r.view,at:now()},...references().filter(x=>x.id!==r.id)].slice(0,16)});return true;},
    forgetReference(id){write({...read(),references:references().filter(r=>r.id!==id)});return read();},
    visit(view) { const v=read(); if(!v.enabled||!JOURNEY_VIEWS.includes(view)||view==='assistant')return v; const refs=references();write({enabled:true,recent:[{view,at:now()},...v.recent.filter(r=>r.view!==view)].slice(0,8),references:refs});return read(); },
    setEnabled(enabled) { const refs=references();write({enabled:Boolean(enabled),recent:enabled?read().recent:[],references:enabled?refs:[]});return read(); },
    clear() { write({enabled:raw().enabled!==false,recent:[],references:[]});return read(); }
  };
}

export function mountJourneyUI({journey,navigate,getContext}) {
  const host=document.getElementById('journeyPanel'); if(!host)return {refresh(){}};
  const labels={dashboard:['Accueil','Home'],inbox:['À faire','To do'],discovery:['Découvrir','Discover'],launch:['Créer / intégrer','Create / join'],operations:['Centre opérationnel','Operations'],sessions:['Séances','Sessions'],members:['Membres','Members'],finance:['Finances','Finance'],tontines:['Tontines','Tontines'],recap:['Récapitulatif','Summary'],ecosystem:['Écosystème','Ecosystem'],services:['Tous les services','All services'],documents:['Documents','Documents'],relay:['Eco Relay','Eco Relay'],settings:['Réglages','Settings']};
  const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;},settingsHost=host.querySelector('.journey-settings');
  const deviceLabel=make('label'),deviceToggle=make('input'),deviceText=make('span');deviceToggle.type='checkbox';deviceToggle.id='journeyDeviceRemember';deviceLabel.className='inline-check';deviceLabel.append(deviceToggle,deviceText);
  const retentionLabel=make('label'),retentionText=make('span'),retention=make('select');retention.id='journeyRetentionDays';retentionLabel.append(retentionText,retention);for(const days of RETENTION_DAYS){const option=make('option');option.value=String(days);retention.append(option);}
  const forgetList=make('div'),status=make('p');forgetList.id='journeyForgetList';status.id='journeyMemoryStatus';status.className='hint';status.setAttribute('role','status');settingsHost.append(deviceLabel,retentionLabel,forgetList,status);
  const changed=()=>window.dispatchEvent(new CustomEvent('eco:journey-changed'));
  const result=ok=>{status.textContent=ok?'':document.documentElement.lang==='en'?'This device cannot save the preference.':'Cet appareil ne peut pas enregistrer la préférence.';refresh();changed();};
  const refresh=()=>{
    const en=document.documentElement.lang==='en', state=journey.snapshot(),ctx=getContext(),settings=journey.settings();
    document.getElementById('cockpitGreeting').textContent=en?'Your day, your possibilities':'Votre journée, vos possibilités';
    document.getElementById('cockpitContext').textContent=ctx.groupLabel ? (en?'Active space · ':'Espace actif · ')+ctx.groupLabel : (en?'Your groups, activities and opportunities in one place.':'Vos groupes, vos activités et vos opportunités au même endroit.');
    const toggle=document.getElementById('journeyRemember');toggle.checked=settings.groupEnabled;toggle.disabled=!ctx.actor||!settings.deviceEnabled;
    deviceToggle.checked=settings.deviceEnabled;deviceToggle.disabled=!ctx.actor;deviceText.textContent=en?'Enable navigation memory for this account on this device':'Activer la mémoire de navigation de ce compte sur cet appareil';
    retentionText.textContent=en?'Keep this space for ':'Conserver cet espace pendant ';retention.value=String(settings.retentionDays);retention.disabled=!ctx.actor||!settings.deviceEnabled;for(const option of retention.options)option.textContent=option.value+(en?(option.value==='1'?' day':' days'):(option.value==='1'?' jour':' jours'));
    settingsHost.querySelector('.hint').textContent=en?'Local references only, separated by account and group. Pausing this device stops recording and hides resume links for this account in every group here. Other devices are unchanged. No amount or conversation content.':'Références locales uniquement, séparées par compte et groupe. La pause arrête la mémorisation et masque les reprises de ce compte dans tous ses groupes sur cet appareil. Les autres appareils restent inchangés. Aucun montant ni contenu de conversation.';
    forgetList.replaceChildren();for(const recent of state.recent){const b=make('button',(en?'Forget: ':'Oublier : ')+(labels[recent.view]?.[en?1:0]||recent.view));b.type='button';b.className='link-btn';b.dataset.journeyForget=recent.view;b.onclick=()=>result(journey.forget(recent.view));forgetList.append(b);}
    for(const reference of journey.references()){const b=make('button',(en?'Forget visited sheet · ':'Oublier la feuille consultée · ')+new Date(reference.at).toLocaleString(en?'en-GB':'fr-FR'));b.type='button';b.className='link-btn';b.dataset.journeyForgetReference=reference.id;b.onclick=()=>{journey.forgetReference(reference.id);refresh();changed();};forgetList.append(b);}
    const list=document.getElementById('journeyRecent');list.replaceChildren();
    for(const r of state.recent.filter(x=>x.view!=='dashboard').slice(0,5)) {
      const b=document.createElement('button');b.type='button';b.className='journey-chip';b.textContent=labels[r.view]?.[en?1:0]||r.view;b.onclick=()=>navigate(r.view);list.append(b);
    }
    if(!list.childElementCount){const p=document.createElement('p');p.className='hint';p.textContent=state.enabled?(en?'Your recently visited spaces will appear here.':'Vos derniers espaces consultés apparaîtront ici.'):(en?'Activity memory is paused.':'La mémorisation du parcours est désactivée.');list.append(p);}
  };
  document.getElementById('journeyRemember').onchange=e=>{journey.setEnabled(e.target.checked);refresh();window.dispatchEvent(new CustomEvent('eco:journey-changed'));};
  document.getElementById('journeyClear').onclick=()=>{journey.clear();refresh();window.dispatchEvent(new CustomEvent('eco:journey-changed'));};
  retention.onchange=()=>result(journey.setRetentionDays(Number(retention.value)));deviceToggle.onchange=()=>result(journey.setDeviceEnabled(deviceToggle.checked));
  window.addEventListener('eco:view-changed',e=>{journey.visit(e.detail?.view);refresh();});
  window.addEventListener('storage',refresh);
  let locale=document.documentElement.lang;new MutationObserver(()=>{if(locale!==document.documentElement.lang){locale=document.documentElement.lang;refresh();}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  const header=document.querySelector('.topbar');
  if(header&&typeof ResizeObserver!=='undefined'){const resize=new ResizeObserver(()=>document.documentElement.style.setProperty('--eco-header-height',header.getBoundingClientRect().height+'px'));resize.observe(header);}
  refresh();return {refresh};
}
