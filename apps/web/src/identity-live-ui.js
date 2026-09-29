const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const row=(label,value)=>{const p=el('p');const b=el('strong',label+' : ');p.append(b,document.createTextNode(String(value??'—')));return p;};

export function mountIdentityLiveUI({app,notify=()=>{},showError=console.error}){
  let socket=null,lastSeq=0,activeGroup,reconnectTimer=null,heartbeatTimer=null,catchupTimer=null,lastPongAt=0,lastLiveMessageAt=0,reconnectAttempt=0,wantConnection=true,eventQueue=Promise.resolve();
  const passportRoot=document.getElementById('identityPassport');
  if(!passportRoot)return{refresh:async()=>{},disconnect:()=>{}};
  const dnaRoot=document.getElementById('conciergeDna'),liveRoot=document.getElementById('premiumLiveStatus'),eventsRoot=document.getElementById('liveEventList'),memoryRoot=document.getElementById('conciergeMemoryList');

  const clearTimers=()=>{if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=null;}if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null;}if(catchupTimer){clearInterval(catchupTimer);catchupTimer=null;}};
  const closeSocket=(reason='group-change')=>{clearTimers();try{socket?.close(1000,reason);}catch{}socket=null;};
  const dispatchDurableEvent=event=>{try{window.dispatchEvent(new CustomEvent('eco:live-event',{detail:event}));}catch{}};
  const catchUp=async()=>{
    if(!app.activeGroup())return;
    for(let page=0;page<50;page++){
      const before=lastSeq,data=await app.liveEvents(lastSeq,500),events=data.events??[];
      for(const event of events){if(Number(event.seq??0)>lastSeq){renderEvent(event);dispatchDurableEvent(event);}}
      const latest=Number(data.latest??lastSeq);
      if(!events.length||lastSeq>=latest||lastSeq===before)break;
    }
  };
  const scheduleReconnect=()=>{
    if(!wantConnection||!app.activeGroup()||navigator.onLine===false||reconnectTimer)return;
    const delay=Math.min(12000,750*(2**Math.min(reconnectAttempt,4)));reconnectAttempt+=1;
    reconnectTimer=setTimeout(()=>{reconnectTimer=null;connect();},delay);
    if(liveRoot)liveRoot.append(row('Reconnexion',Math.round(delay/100)/10+' s'));
  };
  const renderEvent=event=>{
    const card=el('article',undefined,'item');
    card.append(row('Événement',event.type),row('Heure',event.at),row('Séquence',event.seq));
    if(event.payload?.operationType)card.append(row('Opération',event.payload.operationType));
    if(event.payload?.amount!==undefined)card.append(row('Montant',new Intl.NumberFormat('fr-CM').format(Number(event.payload.amount))+' '+String(event.payload.currency??'XAF')));
    eventsRoot?.prepend(card);while(eventsRoot?.children.length>12)eventsRoot.lastElementChild?.remove();
    if(['FINANCIAL_NOTICE','MEMBER_CONTROL','MEMBER_PROJECTION_UPDATED','MEMBER_ENVELOPE_READY','CONSENSUS_SELECTED','MEETING_UPDATE'].includes(event.type)){
      const detail=event.payload?.selectedValue!==undefined?' · '+String(event.payload.selectedValue):'';
      notify((event.type==='MEMBER_ENVELOPE_READY'?'Votre enveloppe privée de séance est prête':event.type==='MEMBER_PROJECTION_UPDATED'?'Votre situation financière vient d’être mise à jour':'Mise à jour financière en direct')+detail);
      try{window.dispatchEvent(new CustomEvent('eco:financial-live-update',{detail:event}));}catch{}
      try{if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&document.visibilityState!=='visible')new Notification('Eco-System · Finance',{body:(event.type==='MEMBER_PROJECTION_UPDATED'?'Votre situation a été mise à jour.':'Une opération financière nécessite votre attention.')+detail});}catch{}
    }
    lastSeq=Math.max(lastSeq,Number(event.seq??0));
  };
  const connect=()=>{
    if(!wantConnection||!app.activeGroup()||typeof WebSocket==='undefined'||navigator.onLine===false)return;
    clearTimers();try{socket?.close(1000,'reconnect');}catch{}socket=null;activeGroup=app.activeGroup();
    try{
      socket=new WebSocket(app.liveWebSocketUrl());
      socket.onopen=()=>{
        reconnectAttempt=0;lastPongAt=Date.now();lastLiveMessageAt=Date.now();
        if(liveRoot)liveRoot.replaceChildren(row('Connexion','WebSocket connecté'),row('Groupe',activeGroup),row('Temps réel','ACTIF · reprise automatique'));
        void catchUp().catch(()=>{});
        void app.publishLiveSignal?.('PRESENCE',{state:'ONLINE',kind:'GROUP'}).catch(()=>{});
        heartbeatTimer=setInterval(()=>{if(!socket||socket.readyState!==WebSocket.OPEN)return;if(Date.now()-lastPongAt>45000){try{socket.close(4000,'heartbeat-timeout');}catch{}return;}try{socket.send('PING');}catch{}},20000);
        // Durable fallback: while the tab is visible, replay missed financial events
        // without forcing a page refresh. WebSocket remains the fast path; this is
        // only a gap-healing loop for mobile/proxy/browser edge cases.
        catchupTimer=setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine!==false)void catchUp().catch(()=>{});},1200);
      };
      socket.onmessage=e=>{
        lastLiveMessageAt=Date.now();
        try{
          const msg=JSON.parse(String(e.data));
          if(msg.type==='PONG'){lastPongAt=Date.now();return;}
          if(msg.type==='GROUP_LIVE_SIGNAL'&&msg.event){window.dispatchEvent(new CustomEvent('eco:live-signal',{detail:msg.event}));return;}
          if(msg.type==='GROUP_LIVE_EVENT'&&msg.event){
            eventQueue=eventQueue.then(async()=>{const seq=Number(msg.event.seq??0);if(seq>lastSeq+1)await catchUp();if(seq>lastSeq){renderEvent(msg.event);dispatchDurableEvent(msg.event);}}).catch(()=>{});
          }
        }catch{}
      };
      socket.onclose=()=>{socket=null;if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null;}if(liveRoot)liveRoot.append(row('Canal','Déconnecté · reprise automatique'));scheduleReconnect();};
      socket.onerror=()=>{if(liveRoot)liveRoot.append(row('WebSocket','Interruption détectée · outbox intacte'));};
    }catch(e){showError(e);scheduleReconnect();}
  };

  const renderFounderObservatory=async()=>{
    const panel=document.getElementById('founderObservatoryPanel'),stats=document.getElementById('founderObservatoryStats'),list=document.getElementById('founderObservatoryList');
    if(!panel||!stats||!list)return;
    try{
      const data=await app.founderLearningObservatory(5);
      panel.hidden=false;stats.replaceChildren();list.replaceChildren();
      for(const [n,label] of [[data.stats?.pseudonymousGroups??0,'Groupes pseudonymes'],[data.stats?.sanitizedSignals??0,'Signaux autorisés'],[data.stats?.discoveries??0,'Découvertes ≥ 5 groupes']]){
        const d=el('div',undefined,'metric');d.append(el('strong',String(n)),el('span',label));stats.append(d);
      }
      if(!(data.discoveries??[]).length)list.append(el('p','Pas encore assez de groupes pour afficher une découverte collective.','hint'));
      for(const d of data.discoveries??[]){
        const a=el('article',undefined,'item');a.append(el('strong',d.key+' · '+d.value),row('Catégorie',d.category),row('Groupes concordants',d.supportingGroups),row('Confiance moyenne',Math.round(Number(d.averageConfidence)*100)+'%'),row('Dernière observation',d.lastSeenAt));list.append(a);
      }
    }catch(e){
      panel.hidden=true;stats.replaceChildren();list.replaceChildren();
      if(e instanceof Error&&!['FOUNDER_TEAM_ONLY','FORBIDDEN_SCOPE'].includes(e.message)&&!e.message.includes('403'))showError(e);
    }
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
      const [passport,dna]=await Promise.all([app.groupIdentityPassport(),app.conciergeProfile()]);
      passportRoot.replaceChildren(row('Code identitaire',passport.publicCode),row('Empreinte identité',passport.identityFingerprint),row('Empreinte règles',passport.rulesFingerprint),row('Rubriques',passport.rubricCount),row('Sécurité','Identifiant public, jamais un secret d’accès'));
      dnaRoot?.replaceChildren(row('Algorithme',dna.algorithmId),row('Empreinte mémoire',dna.memoryFingerprint),row('Mémoire privée',dna.privateMemoryCount),row('Mémoire partageable',dna.shareableMemoryCount),row('Confiance moyenne',Math.round(Number(dna.confidenceAverage)*100)+'%'),row('Politique','Conseil + règles ; aucune finance autonome'));
      const preferenceStatus=document.getElementById('commercialPreferenceStatus');
      try{
        const issued=await app.ensureCommercialPreferenceCookie(),context=await app.commercialPreferenceContext();
        preferenceStatus?.replaceChildren(
          row('Profil bêta','BETA_OPEN · actif pour tous'),
          row('Apprentissage collectif','Actif · catégories non sensibles seulement'),
          row('Communautés & partenaires','Actifs'),
          row('Profil first-party','Cookie opaque / HttpOnly'),
          row('Affinités sûres',context.affinities?.length??issued.affinityCount??0)
        );
      }catch(e){
        preferenceStatus?.replaceChildren(row('Profil bêta','BETA_OPEN'),row('Profil first-party','En attente de synchronisation'));
      }
      try{
        const health=await app.liveHealth();liveRoot?.replaceChildren(row('Live Ledger',health.enabled?'ACTIF':'INACTIF'),row('Objets connectés',health.webSockets??0),row('Dernière séquence',health.latest??0),row('Code groupe',health.groupCode??passport.publicCode));
        if(health.enabled&&(!socket||socket.readyState>1))connect();
        if(health.enabled){const catchup=await app.liveEvents(lastSeq);for(const event of catchup.events??[])renderEvent(event);}
      }catch(e){liveRoot?.replaceChildren(row('Live Ledger','Non disponible sur ce déploiement'),row('Fallback','Outbox offline + actualisation normale'));}      
      await renderMemories();
      await renderFounderObservatory();
    }catch(e){showError(e);}
  };

  window.addEventListener('online',()=>{if(wantConnection)connect();});
  window.addEventListener('offline',()=>{closeSocket('offline');if(liveRoot)liveRoot.append(row('Réseau','Hors ligne · outbox active'));});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&wantConnection){if(!socket||socket.readyState!==WebSocket.OPEN)connect();else void catchUp().catch(()=>{});}});
  document.getElementById('refreshPassportBtn')?.addEventListener('click',()=>void (async()=>{try{await app.groupIdentityPassport(true);notify('Passeport identitaire rafraîchi.');await refresh();}catch(e){showError(e);}})());
  document.getElementById('conciergeMemoryForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    await app.learnConciergeMemory({category:value('conciergeMemoryCategory'),key:value('conciergeMemoryKey'),value:value('conciergeMemoryValue'),sourceRef:value('conciergeMemorySource'),confidence:Number(value('conciergeMemoryConfidence')||0),privacy:value('conciergeMemoryPrivacy'),visibility:value('conciergeMemoryVisibility')});
    notify('Nouvel apprentissage ajouté à la mémoire du groupe.');document.getElementById('conciergeMemoryValue').value='';document.getElementById('conciergeMemorySource').value='';await refresh();
  }catch(err){showError(err);}})();});

  return{refresh,disconnect:()=>{wantConnection=false;closeSocket('manual');},reconnect:()=>{wantConnection=true;connect();}};
}
