const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const checked=id=>Boolean(document.getElementById(id)?.checked);
const setChecked=(id,v)=>{const e=document.getElementById(id);if(e)e.checked=Boolean(v);};
const row=(label,value)=>{const p=el('p');const b=el('strong',label+' : ');p.append(b,document.createTextNode(String(value??'—')));return p;};

export function mountIdentityLiveUI({app,notify=()=>{},showError=console.error}){
  let socket=null,lastSeq=0,activeGroup;
  const passportRoot=document.getElementById('identityPassport');
  if(!passportRoot)return{refresh:async()=>{},disconnect:()=>{}};
  const dnaRoot=document.getElementById('conciergeDna'),liveRoot=document.getElementById('premiumLiveStatus'),eventsRoot=document.getElementById('liveEventList'),memoryRoot=document.getElementById('conciergeMemoryList');

  const closeSocket=()=>{try{socket?.close(1000,'group-change');}catch{}socket=null;};
  const renderEvent=event=>{
    const card=el('article',undefined,'item');
    card.append(row('Événement',event.type),row('Heure',event.at),row('Séquence',event.seq));
    if(event.payload?.operationType)card.append(row('Opération',event.payload.operationType));
    if(event.payload?.amount!==undefined)card.append(row('Montant',new Intl.NumberFormat('fr-CM').format(Number(event.payload.amount))+' '+String(event.payload.currency??'XAF')));
    eventsRoot?.prepend(card);while(eventsRoot?.children.length>12)eventsRoot.lastElementChild?.remove();
    lastSeq=Math.max(lastSeq,Number(event.seq??0));
  };
  const connect=()=>{
    if(!app.activeGroup()||typeof WebSocket==='undefined')return;
    closeSocket();activeGroup=app.activeGroup();
    try{
      socket=new WebSocket(app.liveWebSocketUrl());
      socket.onopen=()=>{if(liveRoot){liveRoot.replaceChildren(row('Connexion','WebSocket connecté'),row('Groupe',activeGroup));}notify('Canal Premium Live connecté.');};
      socket.onmessage=e=>{try{const msg=JSON.parse(String(e.data));if(msg.type==='GROUP_LIVE_EVENT'&&msg.event)renderEvent(msg.event);}catch{}};
      socket.onclose=()=>{if(liveRoot)liveRoot.append(row('Canal','Déconnecté — le mode offline reste actif'));};
      socket.onerror=()=>{if(liveRoot)liveRoot.append(row('WebSocket','Indisponible — aucune donnée perdue, l’outbox reste prioritaire'));};
    }catch(e){showError(e);}
  };

  const renderMemories=async()=>{
    if(!memoryRoot||!app.activeGroup())return;memoryRoot.replaceChildren();
    const memories=await app.conciergeMemories();
    if(!memories.length){memoryRoot.append(el('p','Aucune mémoire confirmée. L’assistant peut fonctionner sans mémoire et apprendre progressivement.','hint'));return;}
    for(const m of memories.slice(0,30)){
      const a=el('article',undefined,'item');a.append(el('strong',m.key),row('Valeur',m.value),row('Source',m.sourceRef),row('Confiance',Math.round(Number(m.confidence)*100)+'%'),row('Portée',m.privacy+(m.collectiveEligible?' · collectif autorisé':'')));memoryRoot.append(a);
    }
  };

  const refresh=async()=>{
    const group=app.activeGroup();if(!group){closeSocket();passportRoot.replaceChildren(el('p','Sélectionnez un groupe.','hint'));dnaRoot?.replaceChildren();liveRoot?.replaceChildren();memoryRoot?.replaceChildren();return;}
    if(activeGroup&&activeGroup!==group){closeSocket();lastSeq=0;eventsRoot?.replaceChildren();}
    activeGroup=group;
    try{
      const [passport,dna,consent]=await Promise.all([app.groupIdentityPassport(),app.conciergeProfile(),app.dataUseConsent()]);
      passportRoot.replaceChildren(row('Code identitaire',passport.publicCode),row('Empreinte identité',passport.identityFingerprint),row('Empreinte règles',passport.rulesFingerprint),row('Rubriques',passport.rubricCount),row('Sécurité','Identifiant public, jamais un secret d’accès'));
      dnaRoot?.replaceChildren(row('Algorithme',dna.algorithmId),row('Empreinte mémoire',dna.memoryFingerprint),row('Mémoire privée',dna.privateMemoryCount),row('Mémoire partageable',dna.shareableMemoryCount),row('Confiance moyenne',Math.round(Number(dna.confidenceAverage)*100)+'%'),row('Politique','Conseil + règles ; aucune finance autonome'));
      setChecked('consentCollectiveLearning',consent.purposes.COLLECTIVE_LEARNING);setChecked('consentCommercial',consent.purposes.COMMERCIAL_PERSONALIZATION);setChecked('consentPartners',consent.purposes.PARTNER_MATCHING);setChecked('consentCommunity',consent.purposes.COMMUNITY_DISCOVERY);
      try{
        const health=await app.liveHealth();liveRoot?.replaceChildren(row('Premium Live',health.enabled?'ACTIF':'INACTIF'),row('Objets connectés',health.webSockets??0),row('Dernière séquence',health.latest??0),row('Code groupe',health.groupCode??passport.publicCode));
        if(health.enabled&&(!socket||socket.readyState>1))connect();
        if(health.enabled){const catchup=await app.liveEvents(lastSeq);for(const event of catchup.events??[])renderEvent(event);}
      }catch(e){liveRoot?.replaceChildren(row('Premium Live','Désactivé sur ce déploiement'),row('Fallback','Outbox offline + actualisation normale'));}      
      await renderMemories();
    }catch(e){showError(e);}
  };

  document.getElementById('refreshPassportBtn')?.addEventListener('click',()=>void (async()=>{try{await app.groupIdentityPassport(true);notify('Passeport identitaire rafraîchi.');await refresh();}catch(e){showError(e);}})());
  document.getElementById('liveConnectBtn')?.addEventListener('click',connect);
  document.getElementById('livePingBtn')?.addEventListener('click',()=>void (async()=>{try{await app.publishLive('PRESENCE',{state:'ACTIVE',at:new Date().toISOString()});notify('Présence envoyée au Live Hub.');}catch(e){showError(e);}})());

  const consentMap={consentCollectiveLearning:'COLLECTIVE_LEARNING',consentCommercial:'COMMERCIAL_PERSONALIZATION',consentPartners:'PARTNER_MATCHING',consentCommunity:'COMMUNITY_DISCOVERY'};
  for(const [id,purpose] of Object.entries(consentMap))document.getElementById(id)?.addEventListener('change',e=>void (async()=>{try{await app.setDataUseConsent(purpose,e.target.checked);notify('Consentement mis à jour.');await refresh();}catch(err){e.target.checked=!e.target.checked;showError(err);}})());

  document.getElementById('conciergeMemoryForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    await app.learnConciergeMemory({category:value('conciergeMemoryCategory'),key:value('conciergeMemoryKey'),value:value('conciergeMemoryValue'),sourceRef:value('conciergeMemorySource'),confidence:Number(value('conciergeMemoryConfidence')||0),privacy:value('conciergeMemoryPrivacy'),visibility:value('conciergeMemoryVisibility')});
    notify('Nouvel apprentissage ajouté à la mémoire du groupe.');document.getElementById('conciergeMemoryValue').value='';document.getElementById('conciergeMemorySource').value='';await refresh();
  }catch(err){showError(err);}})();});

  return{refresh,disconnect:closeSocket};
}
