import {EcoBroadcastReceiver} from '../../../packages/relay/src/broadcast.js';
import {qrV10LMatrix,qrMatrixSvg} from '../../../packages/relay/src/qr-v10.js';

const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const b64u=s=>{const bytes=new TextEncoder().encode(s);let raw='';for(const b of bytes)raw+=String.fromCharCode(b);return btoa(raw).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
const unb64u=v=>{const n=v.replaceAll('-','+').replaceAll('_','/'),raw=atob(n+'='.repeat((4-n.length%4)%4)),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new TextDecoder().decode(bytes);};
const pairingText=material=>'ECOPAIR1.'+b64u(JSON.stringify(material));
const parsePairing=raw=>{if(!raw.startsWith('ECOPAIR1.'))throw Error('PAIRING_QR_INVALID');const x=JSON.parse(unb64u(raw.slice(9)));if(x.protocolVersion!==1||!x.membershipId||!x.keyId||!x.rawKey)throw Error('PAIRING_QR_INVALID');return x;};
const download=(name,text,type='application/json')=>{const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};

export function mountSovereignOfflineUI({app,getMembers=()=>[],getMeetings=()=>[],isManager=()=>false,notify=()=>{},showError=console.error}={}){
  const relay=document.getElementById('ecoRelayWorkspace'),local=document.getElementById('ecoLocalWorkspace');if(!relay||!local)return{refresh:async()=>{}};
  let frames=[],frameIndex=0,timer=null,currentBundle=null,cameraStream=null,scanTimer=null,receiver=new EcoBroadcastReceiver();

  const stopStream=()=>{if(timer){clearInterval(timer);timer=null;}};
  const stopCamera=()=>{if(scanTimer){clearTimeout(scanTimer);scanTimer=null;}if(cameraStream){for(const track of cameraStream.getTracks())track.stop();cameraStream=null;}};

  const status=el('p','Eco Relay prêt. Les données financières restent gouvernées par le noyau canonique.','truth-notice');
  const pairing=el('section',undefined,'item'),ph=el('h3','1 · Appairer chaque membre une seule fois'),pairNote=el('p','Le QR d’appairage contient la clé privée de ce membre. Affichez-le seulement devant la personne concernée, de près, puis masquez-le.','hint');
  const pairSelect=el('select'),pairBtn=el('button','Créer / afficher la clé','primary'),rotateBtn=el('button','Renouveler la clé','secondary'),pairQr=el('div',undefined,'eco-optical-qr'),pairInfo=el('p','', 'hint'),pairExport=el('button','Exporter .ecopair','secondary');pairExport.disabled=true;
  let lastPair=null;
  const pairActions=el('div',undefined,'actions');pairActions.append(pairBtn,rotateBtn,pairExport);pairing.append(ph,pairNote,pairSelect,pairActions,pairQr,pairInfo);

  const broadcast=el('section',undefined,'item'),bh=el('h3','2 · Eco Broadcast QR · diffusion collective'),meetingSelect=el('select'),prepare=el('button','Préparer la diffusion','primary'),start=el('button','Démarrer','primary'),pause=el('button','Pause','secondary'),fullscreen=el('button','Plein écran','secondary'),pack=el('button','Exporter Eco Pack','secondary'),screen=el('div',undefined,'eco-optical-screen'),frameInfo=el('p','Aucune diffusion préparée.','hint'),membersInfo=el('p','', 'hint');
  start.disabled=pause.disabled=fullscreen.disabled=pack.disabled=true;const ba=el('div',undefined,'actions');ba.append(prepare,start,pause,fullscreen,pack);broadcast.append(bh,el('p','Tous les téléphones regardent le même QR animé. Chaque appareil collecte les trames puis ouvre uniquement la capsule chiffrée de son propriétaire.','hint'),meetingSelect,ba,screen,frameInfo,membersInfo);

  const receive=el('section',undefined,'item'),rh=el('h3','3 · Recevoir sur le téléphone du membre'),cameraBtn=el('button','Ouvrir la caméra','primary'),cameraStop=el('button','Arrêter caméra','secondary'),video=document.createElement('video'),progress=el('p','0 / 0 trame','truth-notice'),fileInput=document.createElement('input'),pairImport=document.createElement('input');
  video.autoplay=true;video.playsInline=true;video.muted=true;video.className='eco-relay-camera';fileInput.type='file';fileInput.accept='.ecobroadcast,application/json';pairImport.type='file';pairImport.accept='.ecopair,application/json,text/plain';
  const receiveActions=el('div',undefined,'actions');receiveActions.append(cameraBtn,cameraStop);receive.append(rh,el('p','Si le scanner caméra n’est pas disponible sur cet appareil, utilisez le fichier Eco Pack reçu hors Internet par Bluetooth, carte SD, câble ou partage local.','hint'),receiveActions,video,progress,el('label','Importer un Eco Pack'),fileInput,el('label','Importer une clé .ecopair'),pairImport);

  const vault=el('section',undefined,'item'),vh=el('h3','4 · Eco Vault · sauvegarde longue durée'),pass=document.createElement('input'),vaultExport=el('button','Créer un Eco Vault','primary'),vaultFile=document.createElement('input'),vaultRestore=el('button','Vérifier puis restaurer','secondary'),vaultStatus=el('p','', 'hint');
  pass.type='password';pass.placeholder='Phrase secrète (8 caractères minimum)';pass.autocomplete='new-password';vaultFile.type='file';vaultFile.accept='.ecovault,text/plain';
  const va=el('div',undefined,'actions');va.append(vaultExport,vaultRestore);vault.append(vh,el('p','Le Vault est chiffré et contient les snapshots, le journal local et les clés Relay du groupe. Gardez plusieurs copies A/B/C sur des supports différents.','hint'),pass,va,vaultFile,vaultStatus);

  relay.replaceChildren(status,pairing,broadcast,receive);
  local.replaceChildren(vault,el('p','Eco Local Room multi-appareils utilisera les mêmes capsules et le même journal. Broadcast QR et Eco Pack sont déjà des transports sans Internet ; le transport LAN/WebRTC restera un accélérateur et jamais une seconde comptabilité.','truth-notice'));

  const refresh=async()=>{
    const members=getMembers().filter(x=>x.status==='active'),meetings=getMeetings().slice().sort((a,b)=>String(b.scheduledAt??b.openedAt).localeCompare(String(a.scheduledAt??a.openedAt)));
    const keep=pairSelect.value;pairSelect.replaceChildren(...members.map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent='N°'+(m.memberNumber??'—')+' · '+m.displayName;return o;}));if(members.some(x=>x.id===keep))pairSelect.value=keep;
    const mk=meetingSelect.value;meetingSelect.replaceChildren(...meetings.map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.title+' · '+String(m.status);return o;}));if(meetings.some(x=>x.id===mk))meetingSelect.value=mk;
    pairBtn.disabled=rotateBtn.disabled=!isManager()||!members.length;prepare.disabled=!isManager()||!members.length;
    if(!('BarcodeDetector' in window))progress.textContent='Scanner QR natif indisponible sur ce navigateur · utilisez Eco Pack ou un appareil plus récent.';
  };

  const showPair=async rotate=>{
    try{
      const material=await app.relayPairingMaterial(pairSelect.value,rotate),raw=pairingText(material);lastPair={material,raw};pairQr.innerHTML=qrMatrixSvg(qrV10LMatrix(raw),7,4);pairInfo.textContent='Clé '+material.keyId+' · membre '+material.membershipId;pairExport.disabled=false;
    }catch(e){showError(e);}
  };
  pairBtn.onclick=()=>void showPair(false);rotateBtn.onclick=()=>void showPair(true);pairExport.onclick=()=>{if(lastPair)download('eco-'+lastPair.material.membershipId+'.ecopair',lastPair.raw,'text/plain');};

  const renderFrame=()=>{
    if(!frames.length)return;const raw=frames[frameIndex%frames.length];try{screen.innerHTML=qrMatrixSvg(qrV10LMatrix(raw),9,4);}catch(e){showError(e);stopStream();return;}
    frameInfo.textContent='Trame '+(frameIndex%frames.length+1)+' / '+frames.length+' · boucle '+(Math.floor(frameIndex/frames.length)+1);frameIndex++;
  };
  prepare.onclick=()=>void(async()=>{try{
    stopStream();screen.replaceChildren();frameIndex=0;const result=await app.prepareEcoBroadcast({meetingId:meetingSelect.value||undefined});currentBundle=result.bundle;frames=result.frames;start.disabled=pause.disabled=fullscreen.disabled=pack.disabled=false;
    membersInfo.textContent=result.included.length+' membre(s) inclus · '+result.unpaired.length+' non appairé(s)'+(result.unpaired.length?' — appairez-les avant la prochaine diffusion.':'');
    const seconds=Math.ceil(frames.length/4);frameInfo.textContent=frames.length+' trames · environ '+seconds+' s par passage à 4 images/s.';renderFrame();
  }catch(e){showError(e);}})();
  start.onclick=()=>{if(!frames.length)return;stopStream();renderFrame();timer=setInterval(renderFrame,250);};
  pause.onclick=()=>stopStream();
  fullscreen.onclick=()=>{const target=screen;target.requestFullscreen?.().catch(()=>{});};
  pack.onclick=()=>{if(currentBundle)download('eco-broadcast-'+currentBundle.transferId+'.ecobroadcast',JSON.stringify(currentBundle),'application/json');};

  const acceptRaw=async raw=>{
    if(raw.startsWith('ECOPAIR1.')){const material=parsePairing(raw);await app.importRelayPairingMaterial(material);progress.textContent='Appairage reçu pour ce membre. La clé reste sur cet appareil.';notify('Appairage Eco Relay enregistré.');return;}
    if(!raw.startsWith('ECOB1:'))return;
    const p=receiver.add(raw);progress.textContent=p.received+' / '+p.total+' trames'+(p.complete?' · complet':'');
    if(p.complete){const bundle=await receiver.assemble(),capsule=await app.receiveEcoBroadcast(bundle);progress.textContent='Mise à jour reçue · membre '+capsule.membershipId+' · '+new Date(capsule.generatedAt).toLocaleString();receiver.reset();stopCamera();notify('Compte personnel Eco mis à jour sans Internet.');}
  };
  cameraBtn.onclick=()=>void(async()=>{try{
    if(!('BarcodeDetector' in window))throw Error('BARCODE_DETECTOR_UNAVAILABLE_USE_ECO_PACK');
    stopCamera();receiver=new EcoBroadcastReceiver();const Detector=window.BarcodeDetector,detector=new Detector({formats:['qr_code']});cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});video.srcObject=cameraStream;await video.play();
    const scan=async()=>{if(!cameraStream)return;try{for(const code of await detector.detect(video))if(code.rawValue)await acceptRaw(code.rawValue);}catch(e){/* une image floue ne doit pas arrêter le flux */}scanTimer=setTimeout(scan,90);};scan();
  }catch(e){showError(e);}})();cameraStop.onclick=()=>stopCamera();

  fileInput.onchange=()=>void(async()=>{try{const file=fileInput.files?.[0];if(!file)return;const bundle=JSON.parse(await file.text());const capsule=await app.receiveEcoBroadcast(bundle);progress.textContent='Eco Pack reçu · compte '+capsule.membershipId+' mis à jour.';notify('Eco Pack importé.');}catch(e){showError(e);}});
  pairImport.onchange=()=>void(async()=>{try{const file=pairImport.files?.[0];if(!file)return;await acceptRaw((await file.text()).trim());}catch(e){showError(e);}});

  vaultExport.onclick=()=>void(async()=>{try{const encoded=await app.exportEcoVault(pass.value);const stamp=new Date().toISOString().replace(/[:.]/g,'-');download('eco-vault-'+(app.activeGroup?.()??'groupe')+'-'+stamp+'.ecovault',encoded,'text/plain');vaultStatus.textContent='Vault créé. Copiez-le idéalement sur deux autres supports physiques.';}catch(e){showError(e);}});
  vaultRestore.onclick=()=>void(async()=>{try{const file=vaultFile.files?.[0];if(!file)throw Error('VAULT_FILE_REQUIRED');const encoded=(await file.text()).trim(),info=await app.inspectEcoVault(pass.value,encoded);vaultStatus.textContent='Vault vérifié : '+info.events+' événements · '+info.snapshots+' snapshots. Restauration…';const done=await app.restoreEcoVault(pass.value,encoded);vaultStatus.textContent='Restauration terminée : '+done.events+' événements · '+done.outbox+' opérations de synchro.';notify('Eco Vault restauré et contrôlé.');await refresh();}catch(e){showError(e);}});

  window.addEventListener('beforeunload',()=>{stopStream();stopCamera();});void refresh();return{refresh,stop:()=>{stopStream();stopCamera();}};
}
