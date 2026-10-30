let STORAGE_KEY='eco.uiMode';
window.addEventListener('eco:preference-scope',event=>{const actor=event.detail?.actorId,tenant=event.detail?.tenantId;if(!actor)return;STORAGE_KEY='eco.uiMode.'+encodeURIComponent(JSON.stringify([tenant,actor]));applyUiMode(currentUiMode(),{persist:false,announce:true});});
const VALID=new Set(['visual','senior','assisted']);

const $=id=>document.getElementById(id);

export const currentUiMode=()=>{
  try{
    const saved=sessionStorage.getItem(STORAGE_KEY)||localStorage.getItem(STORAGE_KEY);
    return VALID.has(saved)?saved:'visual';
  }catch{return'visual';}
};

const modeLabel=mode=>({
  visual:'Visuel',
  senior:'Senior',
  assisted:'Assisté / Dictée'
}[mode]??'Visuel');

export const applyUiMode=(mode,{persist=true,announce=false}={})=>{
  const next=VALID.has(mode)?mode:'visual';
  document.body.classList.remove('ui-mode-visual','ui-mode-senior','ui-mode-assisted');
  document.body.classList.add('ui-mode-'+next);
  document.documentElement.dataset.uiMode=next;
  for(const select of document.querySelectorAll('#uiModeSelect, #workspaceUiMode'))if(select.value!==next)select.value=next;
  document.querySelectorAll('[data-ui-mode-button]').forEach(button=>{
    const active=button.dataset.uiModeButton===next;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  const help=$('uiModeHelp');
  if(help){
    help.textContent=next==='visual'
      ? 'Présentation moderne et visuelle, densité normale et accès rapides.'
      : next==='senior'
        ? 'Textes plus grands, boutons plus larges, contrastes renforcés et navigation simplifiée.'
        : 'Boutons larges, instructions courtes et accès prioritaire à la dictée. Toute saisie financière dictée reste relue avant validation.';
  }
  if(persist){
    // Each window may compare a different mode. The shared value is only the
    // default for a newly opened window, never an override of an explicit choice.
    try{sessionStorage.setItem(STORAGE_KEY,next);localStorage.setItem(STORAGE_KEY,next);}catch{}
  }
  if(announce)window.dispatchEvent(new CustomEvent('eco:ui-mode-changed',{detail:{mode:next,label:modeLabel(next)}}));
  return next;
};

const openAssistedEntry=()=>{
  applyUiMode('assisted',{persist:true,announce:true});
  const operations=document.querySelector('.nav-btn[data-view="operations"]');
  operations?.click();
  setTimeout(()=>{
    const panel=$('voiceFinancialPanel');
    if(panel){
      panel.scrollIntoView({behavior:'smooth',block:'start'});
      const input=$('voiceFinancialText');
      input?.focus();
    }else{
      $('focusedFieldDictation')?.focus();
    }
  },120);
};

const install=()=>{
  applyUiMode(currentUiMode(),{persist:false});
  for(const select of document.querySelectorAll('#uiModeSelect, #workspaceUiMode')){
    select.value=currentUiMode();
    select.addEventListener('change',()=>applyUiMode(select.value,{persist:true,announce:true}));
  }
  document.querySelectorAll('[data-ui-mode-button]').forEach(button=>button.addEventListener('click',()=>{
    applyUiMode(button.dataset.uiModeButton,{persist:true,announce:true});
  }));
  $('openAssistedModeBtn')?.addEventListener('click',openAssistedEntry);
  window.addEventListener('storage',event=>{
    if(event.key===STORAGE_KEY&&!sessionStorage.getItem(STORAGE_KEY))applyUiMode(event.newValue||'visual',{persist:false,announce:true});
  });
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();

