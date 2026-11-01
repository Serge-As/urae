const key=scope=>'eco.voiceEcho.'+scope;
export const validEchoAmount=value=>Number.isSafeInteger(value)&&value>=0;
export function createVoiceEcho({scope,notify=()=>{}}){
 let last=null;const read=()=>{try{return JSON.parse(localStorage.getItem(key(scope())))??{};}catch{return {};}};
 const namesEnabled=()=>read().names===true;
 const textFor=({amount,memberName,rubricName})=>{if(!validEchoAmount(amount))throw Error('INVALID_ECHO_AMOUNT');return (namesEnabled()&&memberName?memberName+' · ':'')+(rubricName?rubricName+' · ':'')+new Intl.NumberFormat('fr-CM').format(amount)+' francs CFA';};
 const speak=text=>{const engine=window.speechSynthesis,voice=engine?.getVoices().find(v=>v.localService===true&&/^fr(?:-|$)/i.test(v.lang));
  if(!engine||!voice){notify('Aucune voix française locale disponible. Relisez le montant affiché.');return false;}
  engine.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.9;engine.speak(utterance);return true;};
 const settings=()=>{
  const prior=document.activeElement,selected=scope(),d=document.createElement('dialog');d.className='eco-work-dialog';d.dataset.voiceEcho='settings';
  const h=document.createElement('h2');h.textContent='Relire le montant à voix haute';d.append(h);
  const p=document.createElement('p');p.textContent='Lecture facultative avec une voix locale disponible. La dictée reste indépendante. Aucun montant n’est validé par la voix.';d.append(p);
  const prefs=read(),enabled=document.createElement('input'),names=document.createElement('input');enabled.type=names.type='checkbox';enabled.checked=prefs.enabled===true;names.checked=prefs.names===true;
  for(const [node,label]of[[enabled,'Me proposer une relecture avant de valider'],[names,'Inclure le nom du membre dans la lecture (audible autour de moi)']]){const l=document.createElement('label');l.append(node,document.createTextNode(label));d.append(l);}
  const save=document.createElement('button');save.type='button';save.className='primary';save.textContent='Enregistrer mon choix';save.onclick=()=>{if(scope()===selected){try{localStorage.setItem(key(selected),JSON.stringify({enabled:enabled.checked,names:names.checked}));}catch{notify('Préférence non mémorisée sur cet appareil.');}}d.close();};
  const manual=document.createElement('button');manual.type='button';manual.className='secondary';manual.textContent='Lire le montant sélectionné';manual.onclick=()=>{const input=last?.isConnected?last:null,amount=Number(input?.value);if(!input||!input.value||!validEchoAmount(amount)){notify('Sélectionnez d’abord une cellule avec un montant à relire.');return;}speak(textFor({amount}));};d.append(manual,save);
  const close=()=>{window.speechSynthesis?.cancel();d.remove();prior?.focus?.();};d.addEventListener('close',close,{once:true});d.addEventListener('cancel',()=>d.close(),{once:true});document.body.append(d);d.showModal();
 };
 document.addEventListener('focusin',event=>{if(event.target?.matches?.('.cell-target-input'))last=event.target;});
 window.addEventListener('eco:voice-echo-settings',settings);
 window.addEventListener('eco:context-changed',()=>{last=null;window.speechSynthesis?.cancel();for(const d of document.querySelectorAll('dialog[data-voice-echo]'))d.close();});
 return {before:async input=>{
  if(!read().enabled)return true;const selected=scope(),text=textFor(input),prior=document.activeElement;
  return new Promise(resolve=>{const d=document.createElement('dialog');d.className='eco-work-dialog';d.dataset.voiceEcho='confirmation';const title=document.createElement('h2');title.textContent='Relisez avant de valider';const amount=document.createElement('p');amount.className='voice-echo-amount';amount.textContent=text;const status=document.createElement('p');status.className='hint';status.textContent='Cette étape ne comptabilise rien. Le montant sera transmis après votre confirmation.';d.append(title,amount,status);
   let accepted=false;for(const [label,action]of[['Écouter',()=>speak(text)],['Confirmer ce montant',()=>{accepted=scope()===selected;d.close();}],['Revenir à la saisie',()=>d.close()]]){const b=document.createElement('button');b.type='button';b.className=label==='Confirmer ce montant'?'primary':'secondary';b.textContent=label;b.onclick=action;d.append(b);}
   const close=()=>{window.speechSynthesis?.cancel();d.remove();prior?.focus?.();resolve(accepted&&scope()===selected);};d.addEventListener('close',close,{once:true});d.addEventListener('cancel',()=>d.close(),{once:true});document.body.append(d);d.showModal();speak(text);
  });
 },settings};
}
