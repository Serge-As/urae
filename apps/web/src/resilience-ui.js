import {envelopeForOutbox,generateRelayKey,exportRelayKey,importRelayKey,encryptRelayEnvelope,decryptRelayEnvelope,RelayReplayGuard} from '../../../packages/relay/src/index.js';

const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const button=(text,cls='secondary')=>{const b=el('button',text,cls);b.type='button';return b;};
const replayGuard=new RelayReplayGuard();
const DB='eco-relay-keys-v1',STORE='keys';
let lastBundle=null,peer=null,channel=null;

const openDb=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const saveKey=async(id,key)=>{const db=await openDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id,key});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}};
const loadKey=async id=>{if(!('indexedDB'in window))return undefined;const db=await openDb();try{return await new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result?.key);r.onerror=()=>reject(r.error);});}finally{db.close();}};
const deviceId=()=>{try{let id=localStorage.getItem('eco.relay.device');if(!id){const bytes=crypto.getRandomValues(new Uint8Array(12));id='device_'+[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('eco.relay.device',id);}return id;}catch{return 'device_session_'+Date.now();}};
const shareText=async(title,text)=>{if(navigator.share){await navigator.share({title,text});return;}await navigator.clipboard?.writeText(text);};
const downloadJson=(name,value)=>{const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const waitIce=pc=>new Promise(resolve=>{if(pc.iceGatheringState==='complete')return resolve();const done=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',done);resolve();}};pc.addEventListener('icegatheringstatechange',done);setTimeout(resolve,5000);});

export function mountResilienceUI({app,notify=()=>{},showError=console.error}){
  const relayRoot=document.getElementById('ecoRelayLegacyWorkspace'),localRoot=document.getElementById('ecoLocalLegacyWorkspace');
  if(!relayRoot||!localRoot)return{refresh:async()=>{}};
  let activeKey,activeKeyId;

  const renderRelay=async()=>{
    relayRoot.replaceChildren();
    const status=el('div',undefined,'truth-notice');status.append(el('strong','Appareil : '),document.createTextNode(deviceId()));relayRoot.append(status);
    const keyBox=el('section',undefined,'item'),keyTitle=el('strong','1 · Appairage chiffré'),keyInfo=el('p',activeKeyId?'Clé locale active · '+activeKeyId:'Aucune clé locale active.','hint');
    const create=button('Créer une clé de proximité','primary'),importBtn=button('Importer une clé reçue'),share=button('Partager la clé face à face');
    create.onclick=()=>void(async()=>{try{const made=await generateRelayKey();activeKey=made.key;activeKeyId=made.keyId;await saveKey('active',{key:activeKey,keyId:activeKeyId});notify('Clé Eco Relay créée. Partagez-la uniquement avec l’appareil prévu.');await renderRelay();}catch(e){showError(e);}})();
    importBtn.onclick=()=>void(async()=>{const raw=prompt('Collez le code de clé Eco Relay reçu :');if(!raw)return;try{const material=JSON.parse(raw),key=await importRelayKey(material);activeKey=key;activeKeyId=material.keyId;await saveKey('active',{key,keyId:activeKeyId});notify('Clé importée et vérifiée.');await renderRelay();}catch(e){showError(e);}})();
    share.onclick=()=>void(async()=>{try{if(!activeKey)throw Error('RELAY_KEY_REQUIRED');const material=await exportRelayKey(activeKey);await shareText('Eco Relay · clé de proximité',JSON.stringify(material));}catch(e){showError(e);}})();
    keyBox.append(keyTitle,keyInfo,create,importBtn,share);relayRoot.append(keyBox);

    const transfer=el('section',undefined,'item');transfer.append(el('strong','2 · Transférer les opérations en attente'));
    transfer.append(el('p','Le paquet est chiffré. Un téléphone relais peut le transporter ou le repartager, mais ne devient pas l’auteur des opérations.','hint'));
    const prepare=button('Préparer le paquet chiffré','primary'),nativeShare=button('Partager avec le téléphone'),file=button('Enregistrer le fichier'),input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;const receive=button('Recevoir un fichier Eco Relay');
    prepare.onclick=()=>void(async()=>{try{if(!activeKey||!activeKeyId)throw Error('RELAY_KEY_REQUIRED');const items=app.outboxItems().filter(x=>!['CONFIRMED','CANCELLED'].includes(x.status));if(!items.length)throw Error('RELAY_NOTHING_TO_SEND');const envelopes=[];for(const item of items)envelopes.push(await encryptRelayEnvelope(envelopeForOutbox(deviceId(),item),activeKey,activeKeyId));lastBundle={kind:'ECO_RELAY_BUNDLE_V1',keyId:activeKeyId,createdAt:new Date().toISOString(),senderDeviceId:deviceId(),relayOnly:true,envelopes};notify(items.length+' opération(s) chiffrée(s) prête(s).');nativeShare.disabled=false;file.disabled=false;if(channel?.readyState==='open')channel.send(JSON.stringify(lastBundle));}catch(e){showError(e);}})();
    nativeShare.disabled=true;nativeShare.onclick=()=>void(async()=>{try{if(!lastBundle)throw Error('RELAY_BUNDLE_REQUIRED');if(navigator.share&&navigator.canShare){const blob=new Blob([JSON.stringify(lastBundle)],{type:'application/json'}),f=new File([blob],'eco-relay.json',{type:'application/json'});if(navigator.canShare({files:[f]})){await navigator.share({title:'Eco Relay',files:[f]});return;}}await shareText('Eco Relay',JSON.stringify(lastBundle));}catch(e){showError(e);}})();
    file.disabled=true;file.onclick=()=>{if(lastBundle)downloadJson('eco-relay-'+Date.now()+'.json',lastBundle);};
    receive.onclick=()=>input.click();input.onchange=()=>void(async()=>{const f=input.files?.[0];if(!f)return;try{await acceptBundle(JSON.parse(await f.text()));}catch(e){showError(e);}finally{input.value='';}})();
    const received=el('div',undefined,'stack');received.id='ecoRelayReceived';
    transfer.append(prepare,nativeShare,file,receive,input,received);relayRoot.append(transfer);
  };

  const acceptBundle=async bundle=>{
    if(bundle?.kind!=='ECO_RELAY_BUNDLE_V1'||!Array.isArray(bundle.envelopes))throw Error('RELAY_BUNDLE_INVALID');
    if(!activeKey||bundle.keyId!==activeKeyId)throw Error('RELAY_KEY_MISMATCH');
    const root=document.getElementById('ecoRelayReceived');root?.replaceChildren();let accepted=0,duplicates=0;
    for(const encrypted of bundle.envelopes){const plain=await decryptRelayEnvelope(encrypted,activeKey,'server');if(!replayGuard.accept(plain)){duplicates++;continue;}const payload=JSON.parse(plain.payload);accepted++;const a=el('article',undefined,'item');a.append(el('strong',String(payload.type??'Opération')),el('p','Auteur original : '+String(payload.actorId??'—')+' · '+String(payload.idempotencyKey??''),'hint'));root?.append(a);}
    lastBundle=bundle;
    const message='Paquet vérifié : '+accepted+' opération(s), '+duplicates+' doublon(s)/rejeu(x) ignoré(s). RELAY_ONLY : aucune opération financière n’est attribuée à cet appareil.';
    root?.prepend(el('p',message,'truth-notice'));notify(message);
  };

  const renderLocal=()=>{
    localRoot.replaceChildren();
    const intro=el('p','Une fois la liaison établie, le gestionnaire A peut envoyer sans nouvelle intervention sur B. Le navigateur ne promet pas encore une diffusion fiable à 80 appareils : ce mode est un transport local 1:1 qualifiable, avec fichier Eco Relay en secours.','truth-notice');localRoot.append(intro);
    const status=el('p','Canal : non connecté','hint'),offer=document.createElement('textarea'),answer=document.createElement('textarea');offer.rows=5;answer.rows=5;offer.placeholder='Offre Eco Local';answer.placeholder='Réponse Eco Local';
    const host=button('A · Créer une salle locale','primary'),join=button('B · Rejoindre avec une offre'),finish=button('A · Terminer avec la réponse'),send=button('Envoyer le dernier paquet sur le canal');send.disabled=true;
    const bindChannel=dc=>{channel=dc;dc.onopen=()=>{status.textContent='Canal : connecté · transfert automatique disponible';send.disabled=false;notify('Eco Local connecté.');};dc.onclose=()=>{status.textContent='Canal : fermé';send.disabled=true;};dc.onmessage=e=>void(async()=>{try{await acceptBundle(JSON.parse(String(e.data)));}catch(err){showError(err);}})();};
    host.onclick=()=>void(async()=>{try{if(!window.RTCPeerConnection)throw Error('WEBRTC_UNAVAILABLE');peer?.close();peer=new RTCPeerConnection();bindChannel(peer.createDataChannel('eco-relay',{ordered:true}));await peer.setLocalDescription(await peer.createOffer());await waitIce(peer);offer.value=JSON.stringify(peer.localDescription);status.textContent='Canal : offre prête. Envoyez-la à B.';}catch(e){showError(e);}})();
    join.onclick=()=>void(async()=>{try{if(!window.RTCPeerConnection)throw Error('WEBRTC_UNAVAILABLE');const remote=JSON.parse(offer.value);peer?.close();peer=new RTCPeerConnection();peer.ondatachannel=e=>bindChannel(e.channel);await peer.setRemoteDescription(remote);await peer.setLocalDescription(await peer.createAnswer());await waitIce(peer);answer.value=JSON.stringify(peer.localDescription);status.textContent='Canal : réponse prête. Retournez-la à A.';}catch(e){showError(e);}})();
    finish.onclick=()=>void(async()=>{try{if(!peer)throw Error('ECO_LOCAL_HOST_REQUIRED');await peer.setRemoteDescription(JSON.parse(answer.value));status.textContent='Canal : négociation terminée, connexion en cours…';}catch(e){showError(e);}})();
    send.onclick=()=>{try{if(!lastBundle||channel?.readyState!=='open')throw Error('ECO_LOCAL_NOT_READY');channel.send(JSON.stringify(lastBundle));notify('Paquet envoyé sur Eco Local.');}catch(e){showError(e);}};
    localRoot.append(status,el('label','Offre A → B'),offer,host,join,el('label','Réponse B → A'),answer,finish,send);
  };

  const refresh=async()=>{
    try{const stored=await loadKey('active');if(stored?.key){activeKey=stored.key;activeKeyId=stored.keyId;}}catch{}
    await renderRelay();renderLocal();
  };
  return{refresh};
}
