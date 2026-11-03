/** The server supplies an absolute expiry from its signed cookie; views never renew it. */
export const FISCALIBRE_ACCESS_SOURCE=String.raw`function fiscalibreAccessGuard(config){
 const root=document.documentElement;
 let deadline=Infinity,wallDeadline=Infinity,timer,pending=false,locked=false;
 const conceal=()=>{root.setAttribute('data-fiscalibre-private','pending');const s=document.getElementById('fiscalibreAccessStatus');if(s)s.textContent='Vérification de l’accès privé…';};
 const save=()=>{try{window.fiscalibreSaveBeforeLock?.();}catch{/* Existing export remains available during the session. */}};
 const expired=()=>performance.now()>=deadline||Date.now()>=wallDeadline;
 const lock=()=>{if(locked)return;locked=true;save();conceal();window.speechSynthesis?.cancel();location.replace('/fiscalibre/?expired=1');};
 const verify=(value)=>{
  if(locked)return;
  const remaining=value.expiresAt-value.serverNow;
  if(!Number.isFinite(remaining)||remaining<=0||remaining>3600000){lock();return;}
  deadline=Math.min(deadline,performance.now()+remaining);wallDeadline=Math.min(wallDeadline,Date.now()+remaining);
  pending=false;if(expired()){lock();return;}
  root.removeAttribute('data-fiscalibre-private');
  clearTimeout(timer);timer=setTimeout(lock,Math.max(1,Math.min(deadline-performance.now(),wallDeadline-Date.now())));
  const status=document.getElementById('fiscalibreSessionStatus');if(status)status.textContent='Accès privé : mot de passe à ressaisir au plus tard à '+new Date(value.expiresAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'. Un rechargement ne prolonge pas cette heure.';
 };
 const revalidate=()=>{
  if(locked||pending)return;conceal();if(expired()){lock();return;}pending=true;
  const script=document.createElement('script');script.src='/fiscalibre/access.js?check='+Date.now();
  const timeout=setTimeout(lock,10000);
  script.onerror=()=>{clearTimeout(timeout);script.remove();lock();};
  script.onload=()=>{clearTimeout(timeout);script.remove();if(pending)lock();};
  document.head.appendChild(script);
 };
 window.__fiscalibreAccess={verify};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){save();conceal();}else revalidate();});
 window.addEventListener('pagehide',()=>{save();conceal();});
 window.addEventListener('pageshow',event=>{if(event.persisted)revalidate();else if(expired())lock();});
 window.addEventListener('focus',revalidate);
 const check=(event)=>{if(expired()||root.hasAttribute('data-fiscalibre-private')){event.preventDefault();event.stopImmediatePropagation();if(expired())lock();}};
 for(const event of ['pointerdown','keydown','click','submit'])document.addEventListener(event,check,true);
 verify(config);
}`;

export const fiscalibreAccessScript=(expiresAt:number)=>`(function(){const c=${JSON.stringify({expiresAt,serverNow:Date.now()})};if(window.__fiscalibreAccess)window.__fiscalibreAccess.verify(c);else (${FISCALIBRE_ACCESS_SOURCE})(c);})();`;
