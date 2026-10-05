const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const row=(label,value)=>{const p=el('p');const b=el('strong',label+' : ');p.append(b,document.createTextNode(String(value??'—')));return p;};

export function mountIdentityLiveUI({app,notify=()=>{},showError=console.error,conservationMode=false}){
  let socket=null,lastSeq=0,lastSignalAt=0,activeGroup,reconnectTimer=null,reconnectAttempt=0,wantConnection=true,eventQueue=Promise.resolve(),connectPromise=null;
  const pendingDraftSignals=new Map();
  const passportRoot=document.getElementById('identityPassport');
  if(!passportRoot)return{refresh:async()=>{},publishSignal:async()=>({accepted:false,reason:'LIVE_UI_UNMOUNTED'}),disconnect:()=>{}};
  const dnaRoot=document.getElementById('conciergeDna'),liveRoot=document.getElementById('premiumLiveStatus'),eventsRoot=document.getElementById('liveEventList'),memoryRoot=document.getElementById('conciergeMemoryList');

  const clearTimers=()=>{if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=null;}};
  const closeSocket=(reason='group-change')=>{clearTimers();try{socket?.close(1000,reason);}catch{}socket=null;};
  const dispatchDurableEvent=event=>{try{window.dispatchEvent(new CustomEvent('eco:live-event',{detail:event}));}catch{}};
  const dispatchEphemeralSignal=signal=>{const at=Date.parse(String(signal?.at??''))||Date.now();lastSignalAt=Math.max(lastSignalAt,at);try{window.dispatchEvent(new CustomEvent('eco:live-signal',{detail:signal}));}catch{}};
  const catchUpSignals=async()=>{if(!app.activeGroup()||!app.liveSignals)return;const data=await app.liveSignals(lastSignalAt),signals=data.signals??[];for(const signal of signals)dispatchEphemeralSignal(signal);lastSignalAt=Math.max(lastSignalAt,Number(data.latestAt??lastSignalAt));};
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
    if(!wantConnection||!app.activeGroup()||navigator.onLine===false||reconnectTimer||reconnectAttempt>=4)return;
    // At most four connection attempts per outage; no idle polling or D1 requests.
    const backoff=[1500,4500,12000,30000][reconnectAttempt++];
    reconnectTimer=setTimeout(()=>{reconnectTimer=null;connect();},backoff);
    if(liveRoot)liveRoot.append(row('Reconnexion','Canal interrompu · tentative '+reconnectAttempt+'/4'));
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
  const signalKey=payload=>[payload?.kind??'',payload?.meetingId??'',payload?.membershipId??'',payload?.rubricId??''].join('|');
  const publishSignal=async(type,payload={})=>{
    if(!app.activeGroup())return{accepted:false,reason:'ACTIVE_GROUP_REQUIRED'};
    if(['FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR'].includes(type))pendingDraftSignals.set(signalKey(payload),{type,payload});
    if(navigator.onLine===false||app.serverBudgetState?.().blocked)return{accepted:false,offline:true,queued:['FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR'].includes(type)};
    if(socket&&socket.readyState===WebSocket.OPEN){
      try{socket.send(JSON.stringify({type:'CLIENT_SIGNAL',eventType:type,payload}));if(['FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR'].includes(type))pendingDraftSignals.delete(signalKey(payload));return{accepted:true,transport:'websocket'};}catch{}
    }
    // Ephemeral presence/typing/draft traffic is WebSocket-only. Never convert
    // keystrokes into REST/D1 requests when the live channel is unavailable.
    if(wantConnection&&(!socket||socket.readyState>1)){reconnectAttempt=0;void connect();}
    return{accepted:false,transport:'websocket-pending',queued:['FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR'].includes(type)};
  };
  const connect=()=>{
    if(connectPromise)return connectPromise;
    if(!wantConnection||!app.activeGroup()||typeof WebSocket==='undefined'||navigator.onLine===false||app.serverBudgetState?.().blocked)return Promise.resolve();
    if(socket&&[WebSocket.CONNECTING,WebSocket.OPEN].includes(socket.readyState))return Promise.resolve();
    const requestedGroup=app.activeGroup();
    clearTimers();try{socket?.close(1000,'reconnect');}catch{}socket=null;activeGroup=requestedGroup;
    connectPromise=(async()=>{
      let ticketData;
      try{ticketData=await app.liveTicket?.();}
      catch(e){
        // A D1 outage/quota must not trigger an expensive legacy authenticated
        // upgrade on every user action. Legacy fallback is for older 404 APIs.
        const code=String(e instanceof Error?e.message:e);
        if(code!=='NOT_FOUND'&&code!=='HTTP_404')throw e;
      }
      if(!wantConnection||navigator.onLine===false||app.activeGroup()!==requestedGroup||app.serverBudgetState?.().blocked)return;
      // Legacy authenticated upgrade remains available if ticket issuance is not
      // configured yet; it costs D1 but avoids breaking an older deployment.
      socket=new WebSocket(app.liveWebSocketUrl(lastSeq,String(ticketData?.ticket??'')));
      socket.onopen=()=>{
        reconnectAttempt=0;
        // Re-announce only the latest draft state per cell after reconnect.
        for(const {type,payload} of pendingDraftSignals.values())try{socket.send(JSON.stringify({type:'CLIENT_SIGNAL',eventType:type,payload}));}catch{}
        pendingDraftSignals.clear();
        // A successful socket handshake proves the network has recovered.
        // Resume pending Outbox once, without heartbeat or periodic REST probes.
        window.dispatchEvent(new CustomEvent('eco:live-connected',{detail:{groupId:activeGroup}}));
        if(liveRoot)liveRoot.replaceChildren(row('Connexion','WebSocket connecté'),row('Groupe',activeGroup),row('Temps réel',conservationMode?'PUSH ÉVÉNEMENTIEL · zéro polling D1':'ACTIF · push événementiel'));
      };
      socket.onmessage=e=>{
        try{
          const msg=JSON.parse(String(e.data));
          if(msg.type==='GROUP_LIVE_HELLO'){if(msg.reset)lastSeq=0;return;}
          if(msg.type==='GROUP_LIVE_SIGNAL'&&msg.event){dispatchEphemeralSignal(msg.event);return;}
          if(msg.type==='GROUP_LIVE_EVENT'&&msg.event){
            eventQueue=eventQueue.then(async()=>{
              const seq=Number(msg.event.seq??0);
              if(seq>lastSeq+1){try{socket?.close(4001,'sequence-gap');}catch{}return;}
              if(seq>lastSeq){renderEvent(msg.event);dispatchDurableEvent(msg.event);}
            }).catch(()=>{});
          }
        }catch{}
      };
      socket.onclose=()=>{socket=null;if(liveRoot)liveRoot.append(row('Canal','Déconnecté · reconnexion sur événement réseau'));scheduleReconnect();};
      socket.onerror=()=>{if(liveRoot)liveRoot.append(row('WebSocket','Interruption détectée · aucune boucle de polling'));};
    })().catch(e=>{showError(e);scheduleReconnect();}).finally(()=>{connectPromise=null;});
    return connectPromise;
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
    if(activeGroup&&activeGroup!==group){closeSocket();lastSeq=0;lastSignalAt=0;eventsRoot?.replaceChildren();}
    activeGroup=group;
    // Finance push must not depend on unrelated identity/concierge D1 reads.
    // A quota-limited request must never prevent managers from receiving writes.
    if(conservationMode&&(!socket||socket.readyState>1))connect();
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
      if(conservationMode){
        liveRoot?.replaceChildren(row('Live Ledger','PUSH ÉVÉNEMENTIEL · mode gratuit'),row('Coût D1','Aucun polling automatique'),row('Déclencheurs','frappe · brouillon · validation · reconnexion'));
        if(!socket||socket.readyState>1)connect();
      }else try{
        const health=await app.liveHealth();liveRoot?.replaceChildren(row('Live Ledger',health.enabled?'ACTIF':'INACTIF'),row('Objets connectés',health.webSockets??0),row('Dernière séquence',health.latest??0),row('Code groupe',health.groupCode??passport.publicCode));
        if(health.enabled&&(!socket||socket.readyState>1))connect();
      }catch(e){liveRoot?.replaceChildren(row('Live Ledger','Non disponible sur ce déploiement'),row('Fallback','Outbox offline + actualisation manuelle'));}      
      await renderMemories();
      await renderFounderObservatory();
    }catch(e){showError(e);}
  };

  window.addEventListener('online',()=>{if(wantConnection){reconnectAttempt=0;connect();}});
  // Android may retain navigator.onLine=true while switching Wi-Fi/data. React
  // only to a change of connection TYPE, never to RTT/downlink fluctuations.
  // No active network probe, heartbeat, or idle D1 traffic is introduced.
  const networkInfo=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const networkTypeOf=()=>String(networkInfo?.type??'')+'|'+String(networkInfo?.effectiveType??'');
  let previousNetworkType=networkTypeOf();
  networkInfo?.addEventListener?.('change',()=>{
    const next=networkTypeOf();if(next===previousNetworkType)return;previousNetworkType=next;
    if(!wantConnection||navigator.onLine===false)return;
    closeSocket('network-interface-change');reconnectAttempt=0;void connect();
  });
  window.addEventListener('eco:server-budget-expired',()=>{if(wantConnection&&navigator.onLine!==false){reconnectAttempt=0;void connect();}});
  window.addEventListener('eco:local-mutation',()=>{if(wantConnection&&navigator.onLine!==false&&(!socket||socket.readyState>1)){reconnectAttempt=0;connect();}});
  window.addEventListener('offline',()=>{closeSocket('offline');reconnectAttempt=0;if(liveRoot)liveRoot.append(row('Réseau','Hors ligne · outbox active'));});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&wantConnection&&(!socket||socket.readyState!==WebSocket.OPEN)){reconnectAttempt=0;connect();}});
  document.getElementById('refreshPassportBtn')?.addEventListener('click',()=>void (async()=>{try{await app.groupIdentityPassport(true);notify('Passeport identitaire rafraîchi.');await refresh();}catch(e){showError(e);}})());
  document.getElementById('conciergeMemoryForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    await app.learnConciergeMemory({category:value('conciergeMemoryCategory'),key:value('conciergeMemoryKey'),value:value('conciergeMemoryValue'),sourceRef:value('conciergeMemorySource'),confidence:Number(value('conciergeMemoryConfidence')||0),privacy:value('conciergeMemoryPrivacy'),visibility:value('conciergeMemoryVisibility')});
    notify('Nouvel apprentissage ajouté à la mémoire du groupe.');document.getElementById('conciergeMemoryValue').value='';document.getElementById('conciergeMemorySource').value='';await refresh();
  }catch(err){showError(err);}})();});

  return{refresh,publishSignal,disconnect:()=>{wantConnection=false;closeSocket('manual');},reconnect:()=>{reconnectAttempt=0;wantConnection=true;connect();}};
}
