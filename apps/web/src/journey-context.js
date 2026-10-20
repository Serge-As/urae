// UI projection only. Business profiles and permissions remain with their owners.
export const JOURNEY_VIEWS = Object.freeze(['dashboard','inbox','discovery','launch','assistant','operations','sessions','members','finance','tontines','recap','ecosystem','services','documents','relay','settings']);
const TTL = 30 * 24 * 60 * 60 * 1000;
export function createJourneyContext({storage, scope, now = Date.now} = {}) {
  const key = () => { const s=scope(); return s?.actor ? 'eco.journey.v1.'+encodeURIComponent(s.actor)+'.'+encodeURIComponent(s.group||'personal') : null; };
  const read = () => {
    const k=key(); if(!k)return {enabled:false,recent:[]};
    try { const v=JSON.parse(storage.getItem(k)||'null'); return {enabled:v?.enabled!==false,recent:Array.isArray(v?.recent)?v.recent.filter(r=>JOURNEY_VIEWS.includes(r.view)&&Number.isFinite(r.at)&&now()-r.at<TTL&&r.at<=now()).slice(0,8).map(r=>({view:r.view,at:r.at})):[]}; }
    catch { return {enabled:true,recent:[]}; }
  };
  const write = v => { const k=key(); if(k)try{storage.setItem(k,JSON.stringify(v));}catch{} return v; };
  const references=()=>{
    if(!read().enabled)return[];
    try{const raw=JSON.parse(storage.getItem(key())||'null');return Array.isArray(raw?.references)?raw.references.filter(r=>r?.kind==='meeting'&&typeof r.id==='string'&&r.id.length>0&&r.id.length<=240&&/^[\w.:/-]+$/.test(r.id)&&['sessions','operations'].includes(r.view)&&Number.isFinite(r.at)&&r.at<=now()&&now()-r.at<TTL).slice(0,16).map(r=>({kind:'meeting',id:r.id,view:r.view,at:r.at})):[];}catch{return[];}
  };
  return {
    snapshot:read,
    references,
    rememberReference(reference){const r=reference,v=read();if(!v.enabled||r?.kind!=='meeting'||typeof r.id!=='string'||!r.id||r.id.length>240||!/^[\w.:/-]+$/.test(r.id)||!['sessions','operations'].includes(r.view))return false;write({...v,references:[{kind:'meeting',id:r.id,view:r.view,at:now()},...references().filter(x=>x.id!==r.id)].slice(0,16)});return true;},
    forgetReference(id){return write({...read(),references:references().filter(r=>r.id!==id)});},
    visit(view) { const v=read(); if(!v.enabled||!JOURNEY_VIEWS.includes(view)||view==='assistant')return v; const refs=references();write({enabled:true,recent:[{view,at:now()},...v.recent.filter(r=>r.view!==view)].slice(0,8),references:refs});return read(); },
    setEnabled(enabled) { const refs=references();write({enabled:Boolean(enabled),recent:enabled?read().recent:[],references:enabled?refs:[]});return read(); },
    clear() { write({enabled:read().enabled,recent:[],references:[]});return read(); }
  };
}

export function mountJourneyUI({journey,navigate,getContext}) {
  const host=document.getElementById('journeyPanel'); if(!host)return {refresh(){}};
  const labels={dashboard:['Accueil','Home'],inbox:['À faire','To do'],discovery:['Découvrir','Discover'],launch:['Créer / intégrer','Create / join'],operations:['Centre opérationnel','Operations'],sessions:['Séances','Sessions'],members:['Membres','Members'],finance:['Finances','Finance'],tontines:['Tontines','Tontines'],recap:['Récapitulatif','Summary'],ecosystem:['Écosystème','Ecosystem'],services:['Tous les services','All services'],documents:['Documents','Documents'],relay:['Eco Relay','Eco Relay'],settings:['Réglages','Settings']};
  const refresh=()=>{
    const en=document.documentElement.lang==='en', state=journey.snapshot(),ctx=getContext();
    document.getElementById('cockpitGreeting').textContent=en?'Your day, your possibilities':'Votre journée, vos possibilités';
    document.getElementById('cockpitContext').textContent=ctx.groupLabel ? (en?'Active space · ':'Espace actif · ')+ctx.groupLabel : (en?'Your groups, activities and opportunities in one place.':'Vos groupes, vos activités et vos opportunités au même endroit.');
    const toggle=document.getElementById('journeyRemember');toggle.checked=state.enabled;toggle.disabled=!ctx.actor;
    const list=document.getElementById('journeyRecent');list.replaceChildren();
    for(const r of state.recent.filter(x=>x.view!=='dashboard').slice(0,5)) {
      const b=document.createElement('button');b.type='button';b.className='journey-chip';b.textContent=labels[r.view]?.[en?1:0]||r.view;b.onclick=()=>navigate(r.view);list.append(b);
    }
    if(!list.childElementCount){const p=document.createElement('p');p.className='hint';p.textContent=state.enabled?(en?'Your recently visited spaces will appear here.':'Vos derniers espaces consultés apparaîtront ici.'):(en?'Activity memory is paused.':'La mémorisation du parcours est désactivée.');list.append(p);}
  };
  document.getElementById('journeyRemember').onchange=e=>{journey.setEnabled(e.target.checked);refresh();window.dispatchEvent(new CustomEvent('eco:journey-changed'));};
  document.getElementById('journeyClear').onclick=()=>{journey.clear();refresh();window.dispatchEvent(new CustomEvent('eco:journey-changed'));};
  window.addEventListener('eco:view-changed',e=>{journey.visit(e.detail?.view);refresh();});
  window.addEventListener('storage',refresh);
  const header=document.querySelector('.topbar');
  if(header&&typeof ResizeObserver!=='undefined'){const resize=new ResizeObserver(()=>document.documentElement.style.setProperty('--eco-header-height',header.getBoundingClientRect().height+'px'));resize.observe(header);}
  refresh();return {refresh};
}
