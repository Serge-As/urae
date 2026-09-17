/* Eco-System 1.3.4 field hardening.
 * Runs before main.js in the deployable build. Keep this module focused on
 * DOM-level compatibility guards that must execute before legacy modules bind.
 * Domain/financial truth remains in canonical services, never here.
 */

const byId=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T|null;

// 1.3.3 exposed the same Tontine forms twice: once inside Réunion and once in
// the dedicated Tontines page. Both UI controllers then bound the duplicate ids.
// The dedicated Tontines page is the canonical configuration surface.
const operations=byId('view-operations');
const duplicateTontine=operations?.querySelector('#tontineCompletionPanel');
if(duplicateTontine){
  const notice=document.createElement('section');notice.className='panel field-link-notice';
  notice.innerHTML='<div class="panel-head"><div><h2>Configuration des Tontines</h2><p>Les cycles, parts, classements et pots se configurent dans l’onglet Tontines. La séance reste consacrée aux présences et aux saisies du jour.</p></div><button type="button" class="link-btn" data-go="tontines">Ouvrir Tontines</button></div>';
  duplicateTontine.replaceWith(notice);
}

// Mobile-first correction for the inline rubric editor. Nested two-column grids
// were compressing inputs to a few characters on phones.
const style=document.createElement('style');
style.id='field-hardening-134-styles';
style.textContent=`
#view-launch .suggestion-inline-config,#view-launch .launch-rubric,#view-launch .rubric-settings{min-width:0;max-width:100%}
#view-launch .suggestion-inline-config input,#view-launch .suggestion-inline-config select,#view-launch .suggestion-inline-config textarea{min-width:0;width:100%}
.field-link-notice{border-style:dashed;background:#f8fcf9}
.voice-live{display:inline-flex;align-items:center;gap:8px;color:var(--brand);font-weight:800}
.voice-live::before{content:'●';animation:voicePulse 1.2s infinite}
@keyframes voicePulse{50%{opacity:.25}}
@media(max-width:900px){
  #view-launch .suggestion-review-card[data-rubric=true]{padding:52px 12px 14px!important}
  #view-launch .suggestion-review-card[data-rubric=true]::before{left:14px;top:13px}
  #view-launch .suggestion-inline-config{grid-column:1/-1;margin-left:0;margin-right:0;padding:10px!important}
  #view-launch .suggestion-inline-config .form-grid,
  #view-launch .suggestion-inline-config .launch-rubric,
  #view-launch .suggestion-inline-config .rubric-settings,
  #view-launch .launch-rubric .form-grid,
  #view-launch .rubric-settings .form-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;width:100%!important}
  #view-launch .suggestion-inline-config .full,#view-launch .launch-rubric .full{grid-column:1!important}
  #view-launch .suggestion-inline-config .actions{position:sticky;bottom:0;z-index:5;padding:10px 0;background:#fbfefa}
  #view-launch .governance-upload{padding:10px}
}
@media(max-width:620px){
  .content{padding-left:10px!important;padding-right:10px!important}
  .panel{padding:14px!important}
  #view-launch .suggestion-review-card{width:100%;overflow:visible}
  #view-launch .suggestion-inline-config button{width:100%}
}
`;
document.head.append(style);

// Continuous voice capture. Android/Chrome may end a recognition session after
// a short silence even when continuous=true, so a controlled restart is used
// until the user explicitly stops. Final transcripts are accumulated instead
// of replacing the previous two words.
let voiceRecognition:any=null;
let voiceListening=false;
let restartTimer:number|undefined;
const setVoiceButton=(active:boolean)=>{
  const button=byId<HTMLButtonElement>('startLaunchVoice');
  const status=byId('voiceStatus');
  if(button){button.textContent=active?'⏹ Arrêter la dictée':'🎙️ Parler / dicter';button.setAttribute('aria-pressed',String(active));}
  if(status)status.classList.toggle('voice-live',active);
};
const stopVoice=()=>{
  voiceListening=false;if(restartTimer)window.clearTimeout(restartTimer);restartTimer=undefined;
  try{voiceRecognition?.stop?.();}catch{}
  setVoiceButton(false);const status=byId('voiceStatus');if(status)status.textContent='Dictée arrêtée. Relisez le texte puis lancez l’analyse.';
};
const startVoice=()=>{
  const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  const status=byId('voiceStatus'),box=byId<HTMLTextAreaElement>('launchAssistantText');
  if(!Recognition){if(status)status.textContent='Reconnaissance vocale non disponible sur cet appareil. Continuez au clavier ou téléversez un document/photo.';return;}
  if(voiceListening){stopVoice();return;}
  voiceListening=true;setVoiceButton(true);
  const recognition=new Recognition();voiceRecognition=recognition;
  recognition.lang=(byId<HTMLSelectElement>('projectLocale')?.value==='en')?'en-US':'fr-FR';
  recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;
  recognition.onstart=()=>{if(status)status.textContent='Écoute continue en cours… Parlez normalement ; faites des pauses si nécessaire.';};
  recognition.onresult=(event:any)=>{
    let finalText='',interim='';
    for(let i=event.resultIndex??0;i<event.results.length;i++){
      const text=String(event.results[i]?.[0]?.transcript??'').trim();if(!text)continue;
      if(event.results[i].isFinal)finalText+=(finalText?' ':'')+text;else interim+=(interim?' ':'')+text;
    }
    if(finalText&&box){const separator=box.value&& !/[\s\n]$/.test(box.value)?' ':'';box.value+=separator+finalText;box.dispatchEvent(new Event('input',{bubbles:true}));}
    if(status)status.textContent=interim?'Je vous écoute… '+interim:'Je vous écoute… continuez, ou appuyez sur Arrêter la dictée.';
  };
  recognition.onerror=(event:any)=>{
    const code=String(event.error??'erreur');
    if(['not-allowed','service-not-allowed','audio-capture'].includes(code)){
      voiceListening=false;setVoiceButton(false);if(status)status.textContent='Micro indisponible ('+code+'). Autorisez le micro ou utilisez texte/document.';
    }else if(status)status.textContent='La dictée a été interrompue ('+code+'). Reprise automatique…';
  };
  recognition.onend=()=>{
    if(!voiceListening){setVoiceButton(false);return;}
    if(status)status.textContent='Reprise de l’écoute…';
    restartTimer=window.setTimeout(()=>{if(voiceListening)try{recognition.start();}catch{voiceListening=false;setVoiceButton(false);}},250);
  };
  try{recognition.start();}catch{voiceListening=false;setVoiceButton(false);if(status)status.textContent='Impossible de démarrer le micro. Réessayez ou utilisez texte/document.';}
};

document.addEventListener('click',event=>{
  const target=event.target as HTMLElement|null;
  if(target?.closest('#startLaunchVoice')){event.preventDefault();event.stopImmediatePropagation();startVoice();return;}
},true);

// Prevent raw technical errors from reaching a non-technical manager.
const errorBox=byId('errorBox');
if(errorBox){
  const friendly=()=>{
    const text=errorBox.textContent??'';
    if(text.includes('COMPLETION_RECORD_NOT_FOUND'))errorBox.textContent='Le cycle ou l’élément choisi n’existe plus. Actualisez Tontines puis créez ou sélectionnez d’abord un cycle.';
    if(text.includes('JSON_REQUIRED'))errorBox.textContent='Le document n’a pas pu être transmis. Actualisez la page puis réessayez ; PDF, Word, texte et photos sont acceptés dans l’assistant de création.';
  };
  new MutationObserver(friendly).observe(errorBox,{childList:true,subtree:true,characterData:true});
}

// Dedicated Tontine forms are the only submission surface. Capture validation
// blocks stale/empty references before older listeners can expose raw errors.
document.addEventListener('submit',event=>{
  const form=event.target as HTMLFormElement|null;if(!form)return;
  if(form.id==='tontineShareForm'){
    const cycle=byId<HTMLSelectElement>('tontineShareCycle');
    if(!cycle?.value){event.preventDefault();event.stopImmediatePropagation();
      const box=byId('errorBox');if(box){box.textContent='Créez ou sélectionnez d’abord un cycle Tontine avant d’ajouter une part.';box.hidden=false;}cycle?.focus();}
  }
  if(form.id==='tontineCycleForm'){
    const rubric=byId<HTMLSelectElement>('tontineCycleRubric');
    if(!rubric?.value){event.preventDefault();event.stopImmediatePropagation();
      const box=byId('errorBox');if(box){box.textContent='Choisissez d’abord une rubrique Tontine active.';box.hidden=false;}rubric?.focus();}
  }
},true);

// The old operations Tontine panel was removed before main.js. The new notice
// is present early enough for main.js to bind its regular data-go navigation.
