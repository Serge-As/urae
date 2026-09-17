/* Eco-System 1.3.4 field hardening.
 * Runs before main.js in the deployable build. Keep this module focused on
 * DOM-level compatibility guards that must execute before legacy modules bind.
 * Domain/financial truth remains in canonical services, never here.
 */

const byId=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T|null;
const showFieldError=(message:string,focus?:HTMLElement|null)=>{const box=byId('errorBox');if(box){box.textContent=message;box.hidden=false;}focus?.focus();};

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
.loan-simulation-explain{grid-column:1/-1;padding:12px;border-radius:12px;background:#f6faf7;border:1px dashed #b8cfc2}
.loan-simulation-table{overflow:auto;margin-top:12px}.loan-simulation-table table{width:100%;min-width:760px;border-collapse:collapse}.loan-simulation-table th,.loan-simulation-table td{padding:9px;border:1px solid var(--line);text-align:right;white-space:nowrap}.loan-simulation-table th:first-child,.loan-simulation-table td:first-child{text-align:left}.loan-simulation-table th{background:#f5f2eb}
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

// Restore the group practice for loan simulation: the rate is per period/month,
// only principal is taxable and unpaid interest never generates interest.
type LoanPriority='CAPITAL_FIRST'|'INTEREST_FIRST';
type LoanInterestBasis='OUTSTANDING'|'INITIAL';
interface LoanLine{period:number;principalBefore:number;interestOpening:number;interestNew:number;payment:number;principalPaid:number;interestPaid:number;principalAfter:number;interestAfter:number;totalAfter:number;}
const simulateLoan=(principal:number,periods:number,ratePct:number,priority:LoanPriority,basis:LoanInterestBasis,payments:number[]):LoanLine[]=>{
  let capital=principal,interestDue=0;const rows:LoanLine[]=[];
  for(let period=1;period<=periods;period++){
    const before=capital,interestOpening=interestDue;
    const interestNew=Math.round((basis==='INITIAL'?principal:capital)*ratePct/100);
    interestDue+=interestNew;let available=Math.max(0,Math.round(payments[period-1]??0)),principalPaid=0,interestPaid=0;
    if(priority==='CAPITAL_FIRST'){
      principalPaid=Math.min(capital,available);capital-=principalPaid;available-=principalPaid;
      interestPaid=Math.min(interestDue,available);interestDue-=interestPaid;
    }else{
      interestPaid=Math.min(interestDue,available);interestDue-=interestPaid;available-=interestPaid;
      principalPaid=Math.min(capital,available);capital-=principalPaid;
    }
    rows.push({period,principalBefore:before,interestOpening,interestNew,payment:Math.round(payments[period-1]??0),principalPaid,interestPaid,principalAfter:capital,interestAfter:interestDue,totalAfter:capital+interestDue});
  }
  return rows;
};
const money=(n:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n)+' F';
const prepareLoanSimulator=()=>{
  const form=byId<HTMLFormElement>('loanForm');if(!form)return;
  const rate=byId<HTMLInputElement>('loanRate'),method=byId<HTMLSelectElement>('loanMethod'),installments=byId<HTMLInputElement>('loanInstallments');
  if(rate){const label=rate.closest('label');if(label){label.childNodes[0]!.textContent='Taux par mois / période %';}rate.value=rate.value==='10'?'5':rate.value;}
  if(installments){const label=installments.closest('label');if(label)label.childNodes[0]!.textContent='Nombre de mois / périodes à simuler';if(installments.value==='5')installments.value='3';}
  if(method){const label=method.closest('label');if(label)label.childNodes[0]!.textContent='Base de calcul de l’intérêt';method.replaceChildren(new Option('Capital restant dû','OUTSTANDING'),new Option('Capital initial (taux fixe)','INITIAL'));}
  if(!byId('loanPriority')){
    const priority=document.createElement('label');priority.textContent='Priorité d’imputation du paiement';
    const select=document.createElement('select');select.id='loanPriority';select.append(new Option('Capital d’abord','CAPITAL_FIRST'),new Option('Intérêts d’abord','INTEREST_FIRST'));priority.append(select);
    const scenario=document.createElement('label');scenario.className='full';scenario.textContent='Paiements simulés par mois / période';
    const input=document.createElement('input');input.id='loanScenarioPayments';input.placeholder='Ex. 0, 30000, 20000 = rien au mois 1, puis 30 000, puis 20 000';scenario.append(input);
    const explain=document.createElement('p');explain.className='loan-simulation-explain';explain.textContent='Simulation uniquement : l’intérêt de chaque période est calculé sur le capital taxable selon la règle choisie. Les intérêts impayés restent séparés et ne produisent jamais d’autres intérêts. Cette simulation ne crée aucun prêt ni aucune dette.';
    const submit=form.querySelector('button[type="submit"],button:not([type])');submit?.before(priority,scenario,explain);if(submit)submit.textContent='Simuler uniquement';
  }
};
prepareLoanSimulator();

const renderLoanSimulation=()=>{
  const principal=Number(byId<HTMLInputElement>('loanPrincipal')?.value??0),periods=Number(byId<HTMLInputElement>('loanInstallments')?.value??0),ratePct=Number(byId<HTMLInputElement>('loanRate')?.value??0);
  if(!Number.isSafeInteger(principal)||principal<=0)return showFieldError('Le capital doit être un entier positif.',byId('loanPrincipal'));
  if(!Number.isSafeInteger(periods)||periods<1||periods>120)return showFieldError('Le nombre de périodes doit être compris entre 1 et 120.',byId('loanInstallments'));
  if(!Number.isFinite(ratePct)||ratePct<0||ratePct>100)return showFieldError('Le taux par période doit être compris entre 0 et 100 %.',byId('loanRate'));
  const priority=(byId<HTMLSelectElement>('loanPriority')?.value||'CAPITAL_FIRST') as LoanPriority;
  const basis=(byId<HTMLSelectElement>('loanMethod')?.value||'OUTSTANDING') as LoanInterestBasis;
  const raw=byId<HTMLInputElement>('loanScenarioPayments')?.value??'';
  const payments=raw.split(/[;,]/).map(x=>x.trim()).filter(Boolean).map(Number);
  if(payments.some(x=>!Number.isFinite(x)||x<0))return showFieldError('Les paiements simulés doivent être des montants positifs séparés par des virgules.',byId('loanScenarioPayments'));
  const rows=simulateLoan(principal,periods,ratePct,priority,basis,payments),root=byId('loanQuoteResult');if(!root)return;
  root.replaceChildren();const intro=document.createElement('p');intro.className='truth-notice';intro.textContent=`Capital ${money(principal)} · taux ${ratePct}% par période · ${priority==='CAPITAL_FIRST'?'capital payé en priorité':'intérêts payés en priorité'} · intérêts impayés non taxables.`;root.append(intro);
  const wrap=document.createElement('div');wrap.className='loan-simulation-table';const table=document.createElement('table');
  table.innerHTML='<thead><tr><th>Période</th><th>Capital début</th><th>Intérêt antérieur</th><th>Nouvel intérêt</th><th>Paiement</th><th>Capital payé</th><th>Intérêt payé</th><th>Capital restant</th><th>Intérêt restant</th><th>Dette totale</th></tr></thead>';
  const body=document.createElement('tbody');
  for(const r of rows){const tr=document.createElement('tr');for(const v of [String(r.period),money(r.principalBefore),money(r.interestOpening),money(r.interestNew),money(r.payment),money(r.principalPaid),money(r.interestPaid),money(r.principalAfter),money(r.interestAfter),money(r.totalAfter)]){const td=document.createElement('td');td.textContent=v;tr.append(td);}body.append(tr);}table.append(body);wrap.append(table);root.append(wrap);
  const last=rows.at(-1)!;const totalInterest=rows.reduce((s,r)=>s+r.interestNew,0);const summary=document.createElement('p');summary.className='hint';summary.textContent=`Après ${periods} période(s) : capital restant ${money(last.principalAfter)} · intérêts non payés ${money(last.interestAfter)} · intérêts générés ${money(totalInterest)}. Aucun intérêt n’a été calculé sur les intérêts impayés.`;root.append(summary);
};

// Dedicated Tontine forms are the only submission surface. Capture validation
// blocks stale/empty references before older listeners can expose raw errors.
// The loan form is also intercepted: Finance is a simulator/configurator, not a
// hidden loan-creation shortcut.
document.addEventListener('submit',event=>{
  const form=event.target as HTMLFormElement|null;if(!form)return;
  if(form.id==='loanForm'){event.preventDefault();event.stopImmediatePropagation();renderLoanSimulation();return;}
  if(form.id==='tontineShareForm'){
    const cycle=byId<HTMLSelectElement>('tontineShareCycle');
    if(!cycle?.value){event.preventDefault();event.stopImmediatePropagation();showFieldError('Créez ou sélectionnez d’abord un cycle Tontine avant d’ajouter une part.',cycle);}
  }
  if(form.id==='tontineCycleForm'){
    const rubric=byId<HTMLSelectElement>('tontineCycleRubric');
    if(!rubric?.value){event.preventDefault();event.stopImmediatePropagation();showFieldError('Choisissez d’abord une rubrique Tontine active.',rubric);}
  }
},true);

// The old operations Tontine panel was removed before main.js. The new notice
// is present early enough for main.js to bind its regular data-go navigation.
