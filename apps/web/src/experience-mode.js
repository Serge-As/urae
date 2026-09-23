const STORAGE_KEY='eco.experienceMode';
const MODES=new Set(['visual','senior','assisted']);

const getStored=()=>{try{const value=localStorage.getItem(STORAGE_KEY)||'visual';return MODES.has(value)?value:'visual';}catch{return'visual';}};
const save=value=>{try{localStorage.setItem(STORAGE_KEY,value);}catch{}};
const label=value=>value==='senior'?'Senior':value==='assisted'?'Assisté · dictée':'Visuel';

const readableText=()=>{
  const active=document.querySelector('.view.active');
  if(!active)return'';
  return [...active.querySelectorAll('h1,h2,h3,p,.truth-notice,.hint')]
    .filter(node=>!node.closest('[hidden]')&&!node.hidden)
    .map(node=>String(node.textContent||'').trim())
    .filter(Boolean).slice(0,24).join('. ').slice(0,5000);
};

export function mountExperienceMode({toast,translate}={}){
  const t=(fr,en)=>typeof translate==='function'?translate(fr,en):fr;
  const buttons=[...document.querySelectorAll('[data-experience-mode]')];
  const select=document.getElementById('experienceModeSelect');
  const status=document.getElementById('experienceModeStatus');
  const readButton=document.getElementById('experienceReadPageBtn');
  const dictateButton=document.getElementById('experienceDictateBtn');

  const apply=(mode,announce=false)=>{
    const next=MODES.has(mode)?mode:'visual';
    document.body.dataset.experienceMode=next;
    save(next);
    buttons.forEach(button=>{
      const selected=button.dataset.experienceMode===next;
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    if(select)select.value=next;
    if(status){
      status.textContent=next==='visual'
        ?t('Visuel : interface riche, moderne et compacte.','Visual: rich, modern and compact interface.')
        :next==='senior'
          ?t('Senior : textes plus grands, contraste renforcé et zones tactiles élargies.','Senior: larger text, stronger contrast and larger touch targets.')
          :t('Assisté : interface simplifiée, grands contrôles, lecture et dictée mises en avant.','Assisted: simplified interface, large controls, reading and dictation emphasized.');
    }
    document.documentElement.style.setProperty('color-scheme','light');
    window.dispatchEvent(new CustomEvent('eco:experience-mode-changed',{detail:{mode:next}}));
    if(announce&&toast)toast(t('Mode '+label(next)+' activé.','Mode '+label(next)+' enabled.'));
  };

  buttons.forEach(button=>button.addEventListener('click',()=>apply(button.dataset.experienceMode,true)));
  select?.addEventListener('change',()=>apply(select.value,true));

  readButton?.addEventListener('click',()=>{
    if(!('speechSynthesis'in window)){toast?.(t('Lecture vocale non disponible sur ce navigateur.','Speech reading is unavailable in this browser.'));return;}
    const text=readableText();if(!text){toast?.(t('Aucun contenu lisible sur cet écran.','No readable content on this screen.'));return;}
    speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=document.documentElement.lang==='en'?'en-US':'fr-FR';
    speechSynthesis.speak(utterance);
  });

  dictateButton?.addEventListener('click',()=>{
    apply('assisted');
    const active=document.activeElement;
    if(active instanceof HTMLInputElement||active instanceof HTMLTextAreaElement){
      const mic=document.getElementById('focusedFieldDictation');
      if(mic instanceof HTMLButtonElement&&!mic.hidden){mic.click();return;}
    }
    document.querySelector('input:not([type="hidden"]),textarea')?.focus?.();
    toast?.(t('Touchez le champ à remplir puis utilisez le micro flottant.','Tap the field to fill, then use the floating microphone.'));
  });

  apply(getStored());
  return{apply,current:()=>document.body.dataset.experienceMode||'visual'};
}
