import {envelopeForOutbox,generateRelayKey,exportRelayKey,importRelayKey,encryptRelayEnvelope,decryptRelayEnvelope,RelayReplayGuard} from '../../../packages/relay/src/index.js';
import {EcoBroadcastReceiver,encodePairingQr,decodePairingQr} from '../../../packages/relay/src/broadcast.js';
import {qrV10LMatrix,qrMatrixSvg} from '../../../packages/relay/src/qr-v10.js';
import QrScanner from './vendor/qr-scanner.min.js';

const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const button=(text,cls='secondary')=>{const b=el('button',text,cls);b.type='button';return b;};
const replayGuard=new RelayReplayGuard();
const DB='eco-relay-keys-v1',STORE='keys';
let lastBundle=null,peer=null,channel=null,broadcastTimer=null,broadcastWakeLock=null,scanner=null;

const openDb=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const saveKey=async(id,key)=>{const db=await openDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id,key});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}};
const loadKey=async id=>{if(!('indexedDB'in window))return undefined;const db=await openDb();try{return await new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result?.key);r.onerror=()=>reject(r.error);});}finally{db.close();}};
const deviceId=()=>{try{let id=localStorage.getItem('eco.relay.device');if(!id){const bytes=crypto.getRandomValues(new Uint8Array(12));id='device_'+[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('eco.relay.device',id);}return id;}catch{return 'device_session_'+Date.now();}};
const shareText=async(title,text)=>{if(navigator.share){await navigator.share({title,text});return;}await navigator.clipboard?.writeText(text);};
const downloadJson=(name,value)=>{const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const waitIce=pc=>new Promise(resolve=>{if(pc.iceGatheringState==='complete')return resolve();const done=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',done);resolve();}};pc.addEventListener('icegatheringstatechange',done);setTimeout(resolve,5000);});

const qrSvg=(payload,scale=6)=>qrMatrixSvg(qrV10LMatrix(payload),scale,4);
const stopBroadcastAnimation=async()=>{
  if(broadcastTimer){clearInterval(broadcastTimer);broadcastTimer=null;}
  try{await broadcastWakeLock?.release?.();}catch{}broadcastWakeLock=null;
};
const shareJsonFile=async(name,title,value)=>{
  const blob=new Blob([JSON.stringify(value)],{type:'application/json'}),file=new File([blob],name,{type:'application/json'});
  if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title,files:[file]});return true;}
  downloadJson(name,value);return false;
};

export function mountResilienceUI({app,notify=()=>{},showError=console.error}){
  const relayRoot=document.getElementById('ecoRelayWorkspace'),localRoot=document.getElementById('ecoLocalWorkspace');
  if(!relayRoot||!localRoot)return{refresh:async()=>{}};
  let activeKey,activeKeyId,preparedBroadcast=null,preparedFrames=[],pendingVaultText='';
  const broadcastReceiver=new EcoBroadcastReceiver();

  const stopScanner=async()=>{
    if(scanner){try{scanner.stop();scanner.destroy();}catch{}scanner=null;}
  };
  const capsuleSummary=(capsule)=>{
    const p=capsule?.projection??{},m=p.member??{},meeting=p.meeting??{},debts=Array.isArray(p.loanDebts)?p.loanDebts:[],receipts=Array.isArray(p.receipts)?p.receipts:[];
    const box=el('article',undefined,'item');
    box.append(el('strong','Compte reçu · '+(m.memberNumber?('N° '+m.memberNumber+' · '):'')+(m.displayName??capsule.membershipId)));
    box.append(el('p',[meeting.title?('Séance : '+meeting.title):'',receipts.length+' ligne(s) reçue(s)','Solde contributions : '+Number(p.statementTotal??0).toLocaleString('fr-FR')+' F','Dette prêt : '+debts.reduce((n,x)=>n+Number(x.totalDebt??0),0).toLocaleString('fr-FR')+' F'].filter(Boolean).join(' · '),'hint'));
    return box;
  };
  const acceptQrPayload=async(raw,progress,result)=>{
    if(raw.startsWith('ECOP1:')){
      const material=decodePairingQr(raw);await app.importRelayPairingMaterial(material);
      progress.textContent='Appairage reçu et enregistré hors ligne.';result.replaceChildren(el('p','Appairage Eco Relay terminé. Ce téléphone peut maintenant recevoir sa capsule privée.','truth-notice'));notify('Appairage Eco Relay terminé.');return;
    }
    if(!raw.startsWith('ECOB1:'))throw Error('QR_ECO_INCONNU');
    const state=broadcastReceiver.add(raw);progress.textContent='Broadcast : '+state.received+' / '+state.total+' trames reçues';
    if(state.complete){
      const bundle=await broadcastReceiver.assemble(),capsule=await app.receiveEcoBroadcast(bundle);
      result.replaceChildren(capsuleSummary(capsule));progress.textContent='Broadcast terminé · compte mis à jour sur cet appareil.';broadcastReceiver.reset();notify('Compte personnel mis à jour sans Internet.');
    }
  };
  const startScanner=async(video,progress,result)=>{
    await stopScanner();
    if(!navigator.mediaDevices?.getUserMedia)throw Error('CAMERA_WEB_INDISPONIBLE');
    scanner=new QrScanner(video,res=>void(async()=>{try{await acceptQrPayload(String(res.data??res),progress,result);}catch(e){if(String(e?.message??e)!=='INVALID_BROADCAST_FRAME')showError(e);}})(),{preferredCamera:'environment',maxScansPerSecond:10,highlightScanRegion:true,highlightCodeOutline:true,returnDetailedScanResult:true});
    try{await scanner.start();progress.textContent='Caméra active · gardez le QR dans le cadre.';}
    catch(error){await stopScanner();throw error;}
  };

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

    const [members,groups,meetings]=await Promise.all([app.listMembers().catch(()=>[]),app.listGroups().catch(()=>[]),app.listMeetings().catch(()=>[])]);
    const activeGroup=groups.find(g=>g.id===app.activeGroup?.()),self=members.find(m=>m.userId===app.currentActor?.());
    const canManage=Boolean(activeGroup&&(activeGroup.createdBy===app.currentActor?.()||self?.roles?.some(r=>['founder','manager','admin','president','treasurer'].includes(String(r).toLowerCase()))));

    if(canManage){
      const pairing=el('section',undefined,'item');pairing.append(el('strong','3 · Appairer un membre pour sa capsule privée'));
      pairing.append(el('p','À faire une seule fois par appareil membre. La clé reste locale ; le membre pourra ensuite recevoir les Broadcast sans Internet.','hint'));
      const select=document.createElement('select');for(const m of members.filter(x=>x.status==='active')){const o=document.createElement('option');o.value=m.id;o.textContent=(m.memberNumber?('N° '+m.memberNumber+' · '):'')+m.displayName;select.append(o);}
      const make=button('Afficher le QR d’appairage','primary'),rotate=button('Renouveler la clé'),pairQr=el('div',undefined,'stack'),pairActions=el('div',undefined,'actions');let lastPair=null;
      const renderPair=async(force=false)=>{const id=select.value;if(!id)throw Error('MEMBERSHIP_REQUIRED');lastPair=await app.relayPairingMaterial(id,force);const raw=encodePairingQr(lastPair);pairQr.innerHTML=qrSvg(raw,6);const svg=pairQr.querySelector('svg');if(svg){svg.style.maxWidth='100%';svg.style.height='auto';}pairQr.append(el('p','Le membre ouvre « Scanner Eco QR » puis cadre ce QR. Ne photographiez ni ne publiez ce code : il contient sa clé de proximité.','truth-notice'));};
      make.onclick=()=>void(renderPair(false).catch(showError));rotate.onclick=()=>void(renderPair(true).catch(showError));
      const sharePair=button('Partager le code d’appairage');sharePair.onclick=()=>void(async()=>{try{if(!lastPair)await renderPair(false);await shareText('Eco Relay · appairage membre',encodePairingQr(lastPair));}catch(e){showError(e);}})();
      pairActions.append(make,rotate,sharePair);pairing.append(select,pairActions,pairQr);relayRoot.append(pairing);
    }

    const receiveQr=el('section',undefined,'item');receiveQr.append(el('strong','4 · Scanner Eco QR / recevoir sa mise à jour'));
    receiveQr.append(el('p','Fonctionne sans BarcodeDetector : le décodeur QR est embarqué dans Eco-System. Sur iPhone/iPad, autorisez la caméra. Si la caméra d’une PWA écran d’accueil est bloquée par iOS, ouvrez la même page dans Safari ou importez un Eco Pack.','hint'));
    const video=document.createElement('video');video.playsInline=true;video.muted=true;video.style.width='100%';video.style.maxWidth='480px';video.style.background='#111';video.style.borderRadius='12px';
    const scanStatus=el('p','Caméra arrêtée','hint'),scanResult=el('div',undefined,'stack'),scanActions=el('div',undefined,'actions'),startScan=button('Scanner Eco QR','primary'),stopScan=button('Arrêter caméra'),photo=button('Lire un QR depuis une photo'),photoInput=document.createElement('input');photoInput.type='file';photoInput.accept='image/*';photoInput.setAttribute('capture','environment');photoInput.hidden=true;
    startScan.onclick=()=>void(startScanner(video,scanStatus,scanResult).catch(e=>{scanStatus.textContent='Caméra indisponible : utilisez Safari ou Eco Pack.';showError(e);}));
    stopScan.onclick=()=>void(stopScanner().then(()=>scanStatus.textContent='Caméra arrêtée'));
    photo.onclick=()=>photoInput.click();photoInput.onchange=()=>void(async()=>{const f=photoInput.files?.[0];if(!f)return;try{const res=await QrScanner.scanImage(f,{returnDetailedScanResult:true});await acceptQrPayload(String(res.data??res),scanStatus,scanResult);}catch(e){showError(e);}finally{photoInput.value='';}})();
    const packInput=document.createElement('input');packInput.type='file';packInput.accept='.json,.eco,application/json';packInput.hidden=true;const importPack=button('Importer un Eco Pack');
    importPack.onclick=()=>packInput.click();packInput.onchange=()=>void(async()=>{const f=packInput.files?.[0];if(!f)return;try{const raw=await f.text();if(raw.startsWith('ECOP1:')){await acceptQrPayload(raw.trim(),scanStatus,scanResult);}else{const parsed=JSON.parse(raw);if(parsed?.protocol==='ECO_BROADCAST_1'){const capsule=await app.receiveEcoBroadcast(parsed);scanResult.replaceChildren(capsuleSummary(capsule));scanStatus.textContent='Eco Pack reçu · compte mis à jour hors ligne.';}else if(parsed?.protocolVersion===1&&parsed?.rawKey){await app.importRelayPairingMaterial(parsed);scanStatus.textContent='Appairage importé hors ligne.';}else throw Error('ECO_PACK_INVALID');}}catch(e){showError(e);}finally{packInput.value='';}})();
    scanActions.append(startScan,stopScan,photo,importPack,photoInput,packInput);receiveQr.append(video,scanStatus,scanActions,scanResult);relayRoot.append(receiveQr);

    if(canManage){
      const broadcast=el('section',undefined,'item');broadcast.append(el('strong','5 · Eco Broadcast QR · diffusion collective'));
      broadcast.append(el('p','Un seul écran diffuse en boucle des trames QR. Tous les téléphones appairés peuvent les lire en même temps ; chaque appareil ne déchiffre que sa propre capsule.','truth-notice'));
      const meetingSelect=document.createElement('select'),latest=document.createElement('option');latest.value='';latest.textContent='Dernière séance / état courant';meetingSelect.append(latest);for(const m of meetings.slice().sort((a,b)=>String(b.scheduledAt??b.openedAt).localeCompare(String(a.scheduledAt??a.openedAt)))){const o=document.createElement('option');o.value=m.id;o.textContent=m.title;meetingSelect.append(o);}
      const speed=document.createElement('select');for(const [ms,label] of [[650,'Lent · anciens téléphones'],[450,'Normal · recommandé'],[320,'Rapide · bonne caméra']]){const o=document.createElement('option');o.value=String(ms);o.textContent=label;if(ms===450)o.selected=true;speed.append(o);}
      const prepBroadcast=button('Préparer la diffusion','primary'),startBroadcast=button('Démarrer les QR'),stopBroadcast=button('Arrêter'),sharePack=button('Partager Eco Pack'),broadcastInfo=el('p','Aucune diffusion préparée.','hint'),qrBox=el('div',undefined,'stack'),frameLabel=el('p','', 'hint');
      startBroadcast.disabled=stopBroadcast.disabled=sharePack.disabled=true;
      prepBroadcast.onclick=()=>void(async()=>{try{await stopBroadcastAnimation();const made=await app.prepareEcoBroadcast({meetingId:meetingSelect.value||undefined,ttlMinutes:60});preparedBroadcast=made.bundle;preparedFrames=made.frames;const ms=Number(speed.value),cycle=Math.ceil(preparedFrames.length*ms/1000);broadcastInfo.textContent=made.included.length+' membre(s) inclus · '+made.unpaired.length+' non appairé(s) · '+preparedFrames.length+' trames · 1 tour ≈ '+cycle+' s · 2 tours conseillés ≈ '+(cycle*2)+' s.';startBroadcast.disabled=false;sharePack.disabled=false;stopBroadcast.disabled=false;notify('Eco Broadcast prêt.');}catch(e){showError(e);}})();
      startBroadcast.onclick=()=>void(async()=>{try{if(!preparedFrames.length)throw Error('BROADCAST_NOT_PREPARED');await stopBroadcastAnimation();let i=0;const paint=()=>{const raw=preparedFrames[i%preparedFrames.length];qrBox.innerHTML=qrSvg(raw,7);const svg=qrBox.querySelector('svg');if(svg){svg.style.maxWidth='100%';svg.style.height='auto';}frameLabel.textContent='Trame '+((i%preparedFrames.length)+1)+' / '+preparedFrames.length;i++;};paint();broadcastTimer=setInterval(paint,Number(speed.value));try{broadcastWakeLock=await navigator.wakeLock?.request?.('screen');}catch{}notify('Diffusion QR démarrée.');}catch(e){showError(e);}})();
      stopBroadcast.onclick=()=>void(stopBroadcastAnimation().then(()=>{frameLabel.textContent='Diffusion arrêtée.';}));
      sharePack.onclick=()=>void(async()=>{try{if(!preparedBroadcast)throw Error('BROADCAST_NOT_PREPARED');await shareJsonFile('eco-broadcast-'+preparedBroadcast.transferId+'.json','Eco Broadcast',preparedBroadcast);}catch(e){showError(e);}})();
      const full=button('Plein écran QR');full.onclick=()=>void(qrBox.requestFullscreen?.().catch?.(()=>{}));
      const bActions=el('div',undefined,'actions');bActions.append(prepBroadcast,startBroadcast,stopBroadcast,sharePack,full);
      broadcast.append(el('label','Séance / contexte'),meetingSelect,el('label','Vitesse'),speed,bActions,broadcastInfo,qrBox,frameLabel);relayRoot.append(broadcast);
    }

    if(canManage){
      const vault=el('section',undefined,'item');vault.append(el('strong','6 · Eco Vault · sauvegarde longue durée'));
      vault.append(el('p','Sauvegarde chiffrée du groupe, journal local, file de synchro et clés Relay. À conserver sur un second support ; ne remplacez jamais l’unique copie par la nouvelle.','truth-notice'));
      const pass=document.createElement('input');pass.type='password';pass.autocomplete='new-password';pass.placeholder='Phrase secrète · 8 caractères minimum';
      const exportVault=button('Créer Eco Vault','primary'),importVault=button('Choisir un Eco Vault'),inspectVault=el('p','', 'hint'),vaultInput=document.createElement('input');vaultInput.type='file';vaultInput.accept='.ecovault,text/plain,application/octet-stream';vaultInput.hidden=true,restore=button('Restaurer ce Vault');restore.disabled=true;
      exportVault.onclick=()=>void(async()=>{try{const secret=pass.value;if(secret.length<8)throw Error('VAULT_PASSPHRASE_TOO_SHORT');const encoded=await app.exportEcoVault(secret),blob=new Blob([encoded],{type:'application/octet-stream'}),file=new File([blob],'eco-'+(app.activeGroup?.()??'group')+'-'+new Date().toISOString().slice(0,10)+'.ecovault',{type:'application/octet-stream'});if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({title:'Eco Vault',files:[file]});else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}notify('Eco Vault chiffré créé. Conservez-en une copie sur un autre appareil/support.');}catch(e){showError(e);}})();
      importVault.onclick=()=>vaultInput.click();vaultInput.onchange=()=>void(async()=>{const f=vaultInput.files?.[0];if(!f)return;try{pendingVaultText=await f.text();const info=await app.inspectEcoVault(pass.value,pendingVaultText);inspectVault.textContent='Vault '+info.groupId+' · '+info.events+' événement(s) · '+info.snapshots+' snapshot(s) · '+info.relayKeys+' clé(s) Relay · export '+new Date(info.exportedAt).toLocaleString();restore.disabled=false;}catch(e){pendingVaultText='';restore.disabled=true;showError(e);}finally{vaultInput.value='';}})();
      restore.onclick=()=>void(async()=>{try{if(!pendingVaultText)throw Error('VAULT_REQUIRED');const result=await app.restoreEcoVault(pass.value,pendingVaultText);notify('Eco Vault restauré : '+result.events+' événement(s), '+result.outbox+' opération(s) à synchroniser.');pendingVaultText='';restore.disabled=true;await renderRelay();}catch(e){showError(e);}})();
      const vActions=el('div',undefined,'actions');vActions.append(exportVault,importVault,restore,vaultInput);vault.append(pass,vActions,inspectVault);relayRoot.append(vault);
    }
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
