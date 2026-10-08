import {EcoBroadcastReceiver,EcoTargetedBroadcastReceiver,encodePairingQr,decodePairingQr} from '../../../packages/relay/src/broadcast.js';
import {qrV10LMatrix,qrMatrixSvg} from '../../../packages/relay/src/qr-v10.js';
import {EcoLocalRoomPeer,encodeLocalRoomSignalFrames,EcoLocalRoomSignalReceiver,decodeLocalRoomSignal} from '../../../packages/relay/src/local-room.js';
import QrScanner from './vendor/qr-scanner.min.js';

const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const download=(name,text,type='application/json')=>{const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
const shareOrDownload=async(name,text,type,title)=>{const blob=new Blob([text],{type});if(typeof File==='function'&&navigator.share&&typeof navigator.canShare==='function'){const file=new File([blob],name,{type});if(navigator.canShare({files:[file]})){await navigator.share({title,files:[file]});return true;}}download(name,text,type);return false;};
const money=n=>Math.round(Number(n)||0).toLocaleString('fr-FR')+' F';
const relayDate=value=>{const at=new Date(value);return Number.isNaN(at.getTime())?'Date à vérifier':new Intl.DateTimeFormat('fr-CM',{dateStyle:'short',timeStyle:'medium'}).format(at);};

export function renderRelayConfrontation({root,conflicts,app,members=[],meetings=[],rubrics=[],notify=()=>{},showError=console.error,onResolved=()=>{}}){
  root.querySelector('.relay-confrontation-review')?.remove();
  if(!conflicts?.length)return;
  const groupId=String(app.activeGroup()),section=el('section',undefined,'relay-confrontation-review');
  section.append(el('h3','Confrontation des montants'),el('p','Chaque cellule conserve son historique. La recommandation compare les dates déclarées des appareils ; une date incohérente doit être vérifiée.','hint'));
  const toolbar=el('div',undefined,'actions'),allLocal=el('button','Tout retenir ici','secondary'),allRemote=el('button','Tout retenir de l’autre appareil','secondary'),chronological=el('button','Appliquer les recommandations chronologiques','secondary');toolbar.append(allLocal,allRemote,chronological);section.append(toolbar);
  const wrap=el('div',undefined,'matrix-wrap relay-confrontation-wrap'),table=el('table',undefined,'meeting-matrix relay-confrontation-table');
  const head=el('thead'),header=el('tr');for(const label of ['Membre','Rubrique','Source / auteur','Montant','Date de validation','Décision'])header.append(el('th',label));head.append(header);table.append(head);
  const memberName=id=>members.find(x=>String(x.id)===String(id))?.displayName??id;
  const rubricName=id=>rubrics.find(x=>String(x.id)===String(id))?.name??id;
  const actorName=id=>members.find(x=>String(x.userId)===String(id))?.displayName??id;
  const grouped=new Map(),entries=[];
  for(const conflict of conflicts){const id=String(conflict.local?.payload?.meetingId??conflict.remote?.payload?.meetingId??'');if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(conflict);}
  const decide=async(entry,choice)=>{
    if(entry.resolved||String(app.activeGroup())!==groupId)return;
    entry.buttons.forEach(x=>{x.disabled=true;});
    try{
      await app.resolveLocalRoomManagerConflict({local:entry.row.local,remote:entry.row.remote,choice});
      entry.resolved=true;entry.trs.forEach(x=>x.classList.add('relay-conflict-resolved'));
      entry.status.textContent=choice==='LOCAL'?'✓ Montant de cet appareil retenu':'✓ Montant de l’autre appareil retenu';
      notify('Décision enregistrée avec son historique.');onResolved(entry.row,choice);
    }catch(error){entry.buttons.forEach(x=>{x.disabled=false;});showError(error);}
  };
  const bulk=async(entries,choice)=>{
    toolbar.querySelectorAll('button').forEach(x=>{x.disabled=true;});
    try{for(const entry of entries)await decide(entry,choice==='CHRONOLOGY'?entry.row.recommended==='REMOTE'?'REMOTE':'LOCAL':choice);}
    finally{toolbar.querySelectorAll('button').forEach(x=>{x.disabled=false;});}
  };
  for(const [meetingId,rows] of grouped){
    const body=el('tbody'),session=el('tr',undefined,'offline-confrontation-session'),heading=el('th');heading.colSpan=6;
    heading.append(el('strong',meetings.find(x=>String(x.id)===meetingId)?.title??meetingId));
    const groupActions=el('div',undefined,'actions'),local=el('button','Séance · retenir ici','secondary'),remote=el('button','Séance · retenir l’autre','secondary'),sessionEntries=[];groupActions.append(local,remote);heading.append(groupActions);session.append(heading);body.append(session);
    for(const row of rows){
      const p=row.local?.payload??{},q=row.remote?.payload??{},mine=el('tr',undefined,'offline-confrontation-local'),theirs=el('tr',undefined,'offline-confrontation-server');
      mine.dataset.conflictKey=row.key;theirs.dataset.conflictKey=row.key;
      const member=el('th',memberName(p.membershipId??q.membershipId)),rubric=el('th',rubricName(p.rubricId??q.rubricId));member.rowSpan=rubric.rowSpan=2;
      mine.append(member,rubric,el('td','Cet appareil · '+actorName(row.local.actorId)),el('td',money(p.targetAmount??p.amount),'amount'),el('td',relayDate(p.recordedAtClient??row.local.createdAt)));
      theirs.append(el('td','Autre appareil · '+actorName(row.remote.actorId)),el('td',money(q.targetAmount??q.amount),'amount'),el('td',relayDate(q.recordedAtClient??row.remote.createdAt)));
      const choice=el('td'),keep=el('button','Retenir ici','secondary'),take=el('button','Retenir l’autre','secondary'),status=el('small',row.recommended==='REMOTE'?'Date déclarée plus récente sur l’autre appareil':'Date déclarée plus récente ici','hint');choice.rowSpan=2;
      const supported=[row.local,row.remote].every(x=>['FINANCIAL_CELL_CORRECTION_PROPOSAL_V1','FINANCIAL_CELL_CORRECTION_PROPOSAL_V2'].includes(String(x.type)));
      const entry={row,trs:[mine,theirs],buttons:[keep,take],status,resolved:false};
      if(supported){keep.onclick=()=>void decide(entry,'LOCAL');take.onclick=()=>void decide(entry,'REMOTE');choice.append(keep,take,status);entries.push(entry);sessionEntries.push(entry);}
      else{choice.append(el('strong','Événement financier à vérifier'),el('p','Ce prêt ou remboursement se traite dans son dossier financier. Aucune écriture n’est remplacée par une contribution.','hint'));}
      mine.append(choice);body.append(mine,theirs);
    }
    local.onclick=()=>void bulk(sessionEntries,'LOCAL');remote.onclick=()=>void bulk(sessionEntries,'REMOTE');table.append(body);
  }
  allLocal.onclick=()=>void bulk(entries,'LOCAL');allRemote.onclick=()=>void bulk(entries,'REMOTE');chronological.onclick=()=>void bulk(entries,'CHRONOLOGY');
  wrap.append(table);section.append(wrap);root.append(section);
}
const yieldRows=draft=>{
  const map=new Map(),add=row=>{if(!row?.memberId)return;const old=map.get(row.memberId)??{membershipId:row.memberId,principal:0,interest:0};old.principal+=Number(row.principal??0);old.interest+=Number(row.interest??0);map.set(row.memberId,old);};
  const result=draft?.result??{};
  if(Array.isArray(result.members))for(const row of result.members)add(row);
  for(const fund of result.funds??[]){const rows=fund?.members??fund?.data?.members??[];for(const row of rows)add(row);}
  return[...map.values()];
};

export function mountSovereignOfflineUI({app,getMembers=()=>[],getMeetings=()=>[],getRubrics=()=>[],isManager=()=>false,notify=()=>{},showError=console.error}={}){
  const relay=document.getElementById('ecoRelaySovereignWorkspace'),local=document.getElementById('ecoLocalSovereignWorkspace');if(!relay||!local)return{refresh:async()=>{}};
  let frames=[],frameIndex=0,timer=null,currentBundle=null,qrScanner=null,receiver=new EcoBroadcastReceiver(),targetedReceiver=null;
  let localPeer=null,localSignalFrames=[],localSignalIndex=0,localSignalTimer=null,localQrScanner=null,localSignalReceiver=new EcoLocalRoomSignalReceiver(),localSignalRaw='';

  const stopStream=()=>{if(timer){clearInterval(timer);timer=null;}};
  const stopCamera=()=>{if(qrScanner){try{qrScanner.stop();qrScanner.destroy();}catch{}qrScanner=null;}video.srcObject=null;};
  const stopLocalSignal=()=>{if(localSignalTimer){clearInterval(localSignalTimer);localSignalTimer=null;}};
  const stopLocalCamera=()=>{if(localQrScanner){try{localQrScanner.stop();localQrScanner.destroy();}catch{}localQrScanner=null;}if(lrVideo)lrVideo.srcObject=null;};

  const status=el('p','Eco Relay prêt. Les données financières restent gouvernées par le noyau canonique.','truth-notice');
  const pairing=el('section',undefined,'item'),ph=el('h3','1 · Appairer chaque membre une seule fois'),pairNote=el('p','Le QR d’appairage contient la clé privée de ce membre. Affichez-le seulement devant la personne concernée, de près, puis masquez-le.','hint');
  const pairSelect=el('select'),pairBtn=el('button','Créer / afficher la clé','primary'),rotateBtn=el('button','Renouveler la clé','secondary'),pairQr=el('div',undefined,'eco-optical-qr'),pairInfo=el('p','', 'hint'),pairExport=el('button','Exporter .ecopair','secondary');pairExport.disabled=true;
  let lastPair=null;
  const pairActions=el('div',undefined,'actions');pairActions.append(pairBtn,rotateBtn,pairExport);pairing.append(ph,pairNote,pairSelect,pairActions,pairQr,pairInfo);

  const broadcast=el('section',undefined,'item'),bh=el('h3','2 · Eco Broadcast QR · diffusion collective'),meetingSelect=el('select'),speedSelect=el('select'),prepare=el('button','Préparer la diffusion','primary'),start=el('button','Démarrer','primary'),pause=el('button','Pause','secondary'),fullscreen=el('button','Plein écran','secondary'),pack=el('button','Exporter Eco Pack','secondary'),screen=el('div',undefined,'eco-optical-screen'),frameInfo=el('p','Aucune diffusion préparée.','hint'),membersInfo=el('p','', 'hint');
  speedSelect.append(new Option('Vitesse sûre · 2,5 QR/s','2.5'),new Option('Vitesse normale · 4 QR/s','4'),new Option('Vitesse rapide · 5 QR/s','5'));speedSelect.value='2.5';
  start.disabled=pause.disabled=fullscreen.disabled=pack.disabled=true;const ba=el('div',undefined,'actions');ba.append(prepare,start,pause,fullscreen,pack);broadcast.append(bh,el('p','Tous les téléphones regardent le même QR animé. Les trames sont ciblées : chaque appareil ignore celles des autres membres avant stockage et n’ouvre que sa capsule chiffrée.','hint'),meetingSelect,speedSelect,ba,screen,frameInfo,membersInfo);

  const receive=el('section',undefined,'item'),rh=el('h3','3 · Recevoir sur le téléphone du membre'),cameraBtn=el('button','Ouvrir la caméra','primary'),cameraStop=el('button','Arrêter caméra','secondary'),photoBtn=el('button','Lire un QR depuis une photo','secondary'),video=document.createElement('video'),progress=el('p','0 / 0 trame','truth-notice'),fileInput=document.createElement('input'),pairImport=document.createElement('input'),photoInput=document.createElement('input');
  video.autoplay=true;video.playsInline=true;video.muted=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.className='eco-relay-camera';fileInput.type='file';fileInput.accept='.ecobroadcast,application/json';pairImport.type='file';pairImport.accept='.ecopair,application/json,text/plain';photoInput.type='file';photoInput.accept='image/*';photoInput.setAttribute('capture','environment');photoInput.hidden=true;
  const receiveActions=el('div',undefined,'actions');receiveActions.append(cameraBtn,cameraStop,photoBtn,photoInput);receive.append(rh,el('p','Le décodeur QR est embarqué dans Eco-System et fonctionne sans Internet. Sur iPhone/iPad, si la caméra d’une PWA installée refuse de démarrer, ouvrez Eco-System dans Safari ou utilisez Eco Pack.','hint'),receiveActions,video,progress,el('label','Importer un Eco Pack'),fileInput,el('label','Importer une clé .ecopair'),pairImport);

  const exercise=el('section',undefined,'item'),eh=el('h3','Cycle d’exercice · clôture et report offline'),exerciseState=el('div',undefined,'stack'),newLabel=document.createElement('input'),openingCash=document.createElement('input'),openExercise=el('button','Ouvrir un exercice','primary');
  newLabel.placeholder='Ex. Exercice 2027';openingCash.type='number';openingCash.min='0';openingCash.step='1';openingCash.placeholder='Trésorerie d’ouverture';
  const openRow=el('div',undefined,'actions');openRow.append(newLabel,openingCash,openExercise);
  const closeBox=el('div',undefined,'stack'),closingCash=document.createElement('input'),principalDisposition=document.createElement('select'),interestDisposition=document.createElement('select'),solidarity=document.createElement('input'),reserve=document.createElement('input'),bureau=document.createElement('input'),otherCarry=document.createElement('input'),prepareClose=el('button','Préparer la clôture','primary'),closeExercise=el('button','Clôturer définitivement','secondary'),nextLabel=document.createElement('input'),rollExercise=el('button','Reporter et ouvrir le nouvel exercice','primary'),closingResult=el('div',undefined,'stack');
  for(const input of [closingCash,solidarity,reserve,bureau,otherCarry]){input.type='number';input.min='0';input.step='1';}
  closingCash.placeholder='Caisse réelle de clôture';solidarity.placeholder='Fonds Secours à retenir/report';reserve.placeholder='Réserve à retenir/report';bureau.placeholder='Bureau / indemnités à payer';otherCarry.placeholder='Autre solde à reporter';
  principalDisposition.append(new Option('Rembourser le principal aux membres','RETURN_TO_MEMBER'),new Option('Reporter le principal au nouvel exercice','CARRY_FORWARD'));
  interestDisposition.append(new Option('Payer les intérêts aux membres','PAY_OUT'),new Option('Reporter les intérêts','CARRY_FORWARD'));
  nextLabel.placeholder='Libellé du nouvel exercice';
  closeBox.append(el('p','La répartition d’intérêts utilisée est celle que le responsable a mémorisée dans le module Épargne. Aucune méthode cachée n’est substituée.','hint'),closingCash,principalDisposition,interestDisposition,solidarity,reserve,bureau,otherCarry,prepareClose,closeExercise,nextLabel,rollExercise,closingResult);
  exercise.append(eh,el('p','Un exercice peut vivre intégralement sur cet appareil : ouverture → séances → clôture préparée → validation → report. Les enveloppes de clôture sont des allocations ; un paiement physique reste une opération financière séparée à constater.','truth-notice'),openRow,exerciseState,closeBox);

  const localRoom=el('section',undefined,'item'),lrh=el('h3','Eco Local Room · appareil à appareil'),lrStatus=el('p','Aucune salle locale ouverte.','truth-notice'),lrCreate=el('button','Créer une salle (hôte)','primary'),lrScan=el('button','Scanner offre / réponse','secondary'),lrStopScan=el('button','Arrêter caméra','secondary'),lrExport=el('button','Partager le signal','secondary'),lrSignalScreen=el('div',undefined,'eco-optical-screen'),lrVideo=document.createElement('video'),lrFile=document.createElement('input'),lrMember=el('select'),lrSendMember=el('button','Envoyer la capsule du membre','primary'),lrSendDelta=el('button','Confronter / intégrer gestionnaires','secondary'),lrPrepareFerry=el('button','Préparer les paquets passeurs','secondary'),lrSendFerry=el('button','Échanger les paquets Relay','secondary'),lrInternetFerry=el('button','Profiter de cette connexion Internet','secondary'),ferryStatus=el('p','Aucun paquet passeur préparé.','hint'),lrCompare=el('div',undefined,'stack');
  lrVideo.autoplay=true;lrVideo.playsInline=true;lrVideo.muted=true;lrVideo.setAttribute('playsinline','');lrVideo.setAttribute('webkit-playsinline','');lrVideo.className='eco-relay-camera';lrFile.type='file';lrFile.accept='.ecolocal,text/plain';lrSendMember.disabled=lrSendDelta.disabled=lrSendFerry.disabled=lrExport.disabled=true;
  const lra=el('div',undefined,'actions');lra.append(lrCreate,lrScan,lrStopScan,lrExport);const lrs=el('div',undefined,'actions');lrs.append(lrMember,lrSendMember,lrSendDelta,lrPrepareFerry,lrSendFerry,lrInternetFerry);
  localRoom.append(lrh,el('p','Les deux appareils peuvent échanger directement sur le réseau local sans serveur. Les intentions métier sont conservées avec leur auteur et leur horodatage ; les membres/séances/rubriques peuvent se propager via Eco Relay sans transformer le transport en seconde comptabilité.','hint'),lra,lrSignalScreen,lrStatus,lrVideo,el('label','Importer un signal .ecolocal'),lrFile,lrs,ferryStatus,lrCompare);

  const numpad=el('section',undefined,'item'),nh=el('h3','Eco NumPad · saisie financière sans IA'),numMeeting=el('select'),numInput=document.createElement('input'),numPreview=el('button','Prévisualiser','secondary'),numCommit=el('button','Valider les lignes','primary'),numLegend=el('div',undefined,'stack'),numResult=el('div',undefined,'stack');let numDraft=null;
  numInput.placeholder='Ex. 3 S 500 E 1000 R 5000';numInput.autocomplete='off';numCommit.disabled=true;
  const na=el('div',undefined,'actions');na.append(numPreview,numCommit);numpad.append(nh,el('p','Format : N° membre puis couples CODE MONTANT. Exemple « 3 S 500 E 1000 R 5000 ». Tout est interprété localement, sans voix ni IA, puis prévisualisé avant écriture.','truth-notice'),numMeeting,numInput,na,numLegend,numResult);

  const vault=el('section',undefined,'item'),vh=el('h3','Eco Vault · sauvegarde longue durée'),pass=document.createElement('input'),vaultExport=el('button','Créer un Eco Vault','primary'),vaultFile=document.createElement('input'),vaultRestore=el('button','Vérifier puis restaurer','secondary'),vaultStatus=el('p','', 'hint');
  pass.type='password';pass.placeholder='Phrase secrète (8 caractères minimum)';pass.autocomplete='new-password';vaultFile.type='file';vaultFile.accept='.ecovault,text/plain';
  const va=el('div',undefined,'actions');va.append(vaultExport,vaultRestore);vault.append(vh,el('p','Le Vault est chiffré et contient les snapshots, le journal local et les clés Relay du groupe. Gardez plusieurs copies A/B/C sur des supports différents.','hint'),pass,va,vaultFile,vaultStatus);

  relay.replaceChildren(status,pairing,broadcast,receive);
  local.replaceChildren(localRoom,numpad,exercise,vault,el('p','Eco Local Room, Broadcast QR et Eco Pack réutilisent les mêmes capsules et le même journal souverain. Le transport n’est jamais une seconde comptabilité et les conflits financiers entre gestionnaires ne sont jamais fusionnés silencieusement.','truth-notice'));

  const refresh=async()=>{
    const members=getMembers().filter(x=>x.status==='active'),meetings=getMeetings().slice().sort((a,b)=>String(b.scheduledAt??b.openedAt).localeCompare(String(a.scheduledAt??a.openedAt)));
    const keep=pairSelect.value;pairSelect.replaceChildren(...members.map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent='N°'+(m.memberNumber??'—')+' · '+m.displayName;return o;}));if(members.some(x=>x.id===keep))pairSelect.value=keep;
    const lrKeep=lrMember.value;lrMember.replaceChildren(...members.map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent='N°'+(m.memberNumber??'—')+' · '+m.displayName;return o;}));if(members.some(x=>x.id===lrKeep))lrMember.value=lrKeep;
    lrCreate.disabled=!isManager();lrSendMember.disabled=!localPeer?.connected||!isManager()||!members.length;lrSendDelta.disabled=!localPeer?.connected||!isManager();lrPrepareFerry.disabled=!isManager();lrSendFerry.disabled=!localPeer?.connected;
    try{const ferry=await app.ecoRelayFerryPackets();ferryStatus.textContent=ferry.length+' paquet(s) Relay conservé(s) sur cet appareil · Internet facultatif.';}catch{}
    const mk=meetingSelect.value;meetingSelect.replaceChildren(...meetings.map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.title+' · '+String(m.status);return o;}));if(meetings.some(x=>x.id===mk))meetingSelect.value=mk;
    const nk=numMeeting.value;numMeeting.replaceChildren(...meetings.filter(m=>m.status!=='cancelled').map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.title+' · '+String(m.status);return o;}));if(meetings.some(x=>x.id===nk))numMeeting.value=nk;
    numLegend.replaceChildren();try{for(const row of await app.numpadCodes()){const line=el('p',row.code+' = '+row.name,'hint');numLegend.append(line);}}catch{}

    pairBtn.disabled=rotateBtn.disabled=!isManager()||!members.length;prepare.disabled=!isManager()||!members.length;
    if(!navigator.mediaDevices?.getUserMedia)progress.textContent='Caméra Web indisponible sur ce navigateur · Eco Pack reste disponible.';else if(!('BarcodeDetector' in window))progress.textContent='Décodeur Eco QR embarqué actif · compatible Safari/iOS sans BarcodeDetector.';
    exerciseState.replaceChildren();let exercises=[];try{exercises=await app.exercises();}catch{}
    const active=exercises.find(x=>['PREPARED','OPEN','CLOSING'].includes(String(x.data?.completionState))),latest=exercises.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if(!exercises.length)exerciseState.append(el('p','Aucun exercice enregistré. Vous pouvez créer le premier sans Internet.','hint'));
    for(const x of exercises.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,8)){const row=el('article',undefined,'item');row.append(el('strong',String(x.data?.label??x.title)),el('span',String(x.data?.completionState??''),'pill'));exerciseState.append(row);}
    openExercise.disabled=!isManager()||Boolean(active);prepareClose.disabled=!isManager()||String(active?.data?.completionState??'')!=='OPEN';closeExercise.disabled=!isManager()||String(active?.data?.completionState??'')!=='CLOSING';rollExercise.disabled=!isManager()||String(latest?.data?.completionState??'')!=='CLOSED';
    if(isManager()){try{const state=await app.ledger();if(!closingCash.dataset.userEdited)closingCash.value=String(Math.max(0,Number(state.summary?.cashBalance??0)));}catch{}}
  };

  const showPair=async rotate=>{
    try{
      const material=await app.relayPairingMaterial(pairSelect.value,rotate),raw=encodePairingQr(material);lastPair={material,raw};pairQr.innerHTML=qrMatrixSvg(qrV10LMatrix(raw),7,4);const svg=pairQr.querySelector('svg');if(svg){svg.style.maxWidth='100%';svg.style.height='auto';}pairInfo.textContent='Clé '+material.keyId+' · membre '+material.membershipId;pairExport.disabled=false;
    }catch(e){showError(e);}
  };
  pairBtn.onclick=()=>void showPair(false);rotateBtn.onclick=()=>void showPair(true);pairExport.onclick=()=>void(async()=>{try{if(lastPair)await shareOrDownload('eco-'+lastPair.material.membershipId+'.ecopair',lastPair.raw,'text/plain','Eco Relay · appairage');}catch(e){showError(e);}})();
  const renderLocalSignal=()=>{if(!localSignalFrames.length)return;const raw=localSignalFrames[localSignalIndex%localSignalFrames.length];lrSignalScreen.innerHTML=qrMatrixSvg(qrV10LMatrix(raw),9,4);localSignalIndex++;lrStatus.textContent='Signal local · trame '+(localSignalIndex%localSignalFrames.length||localSignalFrames.length)+' / '+localSignalFrames.length;};
  const showLocalSignal=async raw=>{stopLocalSignal();localSignalRaw=raw;localSignalFrames=await encodeLocalRoomSignalFrames(raw,165);localSignalIndex=0;lrExport.disabled=false;renderLocalSignal();localSignalTimer=setInterval(renderLocalSignal,400);};
  let relaySendTimer=0;
  window.addEventListener('eco:financial-local-committed',event=>{
    if(!isManager()||!localPeer?.connected||String(event.detail?.groupId)!==String(app.activeGroup()))return;
    if(relaySendTimer)clearTimeout(relaySendTimer);
    relaySendTimer=setTimeout(()=>{relaySendTimer=0;void app.localRoomManagerDelta().then(delta=>{if(localPeer?.connected)localPeer.send('MANAGER_DELTA',delta);}).catch(showError);},150);
  });
  window.addEventListener('eco:view-changed',event=>{
    if(event.detail?.view==='settings'&&isManager())void app.localRelayFinancialConflicts?.().then(conflicts=>renderRelayConfrontation({root:lrCompare,conflicts,app,members:getMembers(),meetings:getMeetings(),rubrics:getRubrics(),notify,showError})).catch(showError);
  });
  const wireLocalPeer=peer=>{
    peer.onPacket(async packet=>{try{
      if(packet.type==='MEMBER_CAPSULE'){const capsule=await app.receiveEcoBroadcast(packet.payload);lrCompare.prepend(el('p','Capsule reçue · membre '+capsule.membershipId,'truth-notice'));notify('Compte personnel mis à jour via Eco Local Room.');}
      else if(packet.type==='MANAGER_DELTA'){
        if(!isManager())throw Error('FORBIDDEN_SCOPE');
        const comparison=await app.confrontLocalRoomManagerDelta(packet.payload),imported=packet.payload?.protocol==='ECO_MANAGER_DELTA_2'?await app.importLocalRoomManagerDelta(packet.payload):{importedCommands:0,mergedSnapshots:0,conflicts:comparison.potentialFinancialConflicts.length};
        lrCompare.replaceChildren(el('strong','Confrontation Eco Relay'),el('p','Intentions communes : '+String(comparison.commonCommands??0)+' · seulement ici : '+comparison.localOnly+' · seulement autre appareil : '+comparison.remoteOnly),el('p','Données structurelles intégrées : '+String(imported.mergedSnapshots??0)+' · intentions Relay conservées : '+String(imported.importedCommands??0)),el('p','Divergences financières à examiner : '+comparison.potentialFinancialConflicts.length,comparison.potentialFinancialConflicts.length?'truth-notice':'hint'));
        renderRelayConfrontation({root:lrCompare,conflicts:await app.localRelayFinancialConflicts?.()??comparison.potentialFinancialConflicts,app,members:getMembers(),meetings:getMeetings(),rubrics:getRubrics(),notify,showError});
        notify('Eco Relay : données reçues et conservées localement sans serveur.');
      }
      else if(packet.type==='FERRY_PACKET_BATCH'){
        const result=await app.receiveEcoRelayFerryPackets(Array.isArray(packet.payload)?packet.payload:[]);
        ferryStatus.textContent='Paquets reçus : '+result.stored+' · appliqués à ce gestionnaire : '+result.applied+'.';
        notify('Paquets Eco Relay reçus pour transport ou intégration.');
      }
    }catch(e){showError(e);}});
  };
  const waitRoomOpen=async peer=>{try{await peer.waitUntilOpen(120000);stopLocalSignal();lrStatus.textContent='Eco Local Room connecté · données directes appareil à appareil.';lrSignalScreen.replaceChildren();lrSendMember.disabled=!isManager();lrSendDelta.disabled=!isManager();lrSendFerry.disabled=false;notify('Eco Local Room connecté.');}catch(e){lrStatus.textContent='Connexion locale non établie. Vérifiez que les deux appareils sont sur le même Wi‑Fi/hotspot.';}};
  const acceptLocalSignal=async raw=>{
    const signal=decodeLocalRoomSignal(raw);
    if(signal.role==='OFFER'){
      localPeer?.close();localPeer=new EcoLocalRoomPeer();wireLocalPeer(localPeer);const answer=await localPeer.acceptOffer(raw);lrStatus.textContent='Offre reçue · montrez maintenant le QR de réponse à l’hôte.';await showLocalSignal(answer);void waitRoomOpen(localPeer);
    }else{
      if(!localPeer)throw Error('ECO_LOCAL_ROOM_NOT_STARTED');await localPeer.acceptAnswer(raw);void waitRoomOpen(localPeer);
    }
  };
  lrCreate.onclick=()=>void(async()=>{try{localPeer?.close();localPeer=new EcoLocalRoomPeer();wireLocalPeer(localPeer);const offer=await localPeer.createOffer();lrStatus.textContent='Salle créée · faites scanner ce signal par le second appareil.';await showLocalSignal(offer);}catch(e){showError(e);}})();
  lrExport.onclick=()=>void(async()=>{try{if(localSignalRaw)await shareOrDownload('eco-local-room-'+Date.now()+'.ecolocal',localSignalRaw,'text/plain','Eco Local Room');}catch(e){showError(e);}})();
  lrFile.onchange=()=>void(async()=>{try{const file=lrFile.files?.[0];if(file)await acceptLocalSignal((await file.text()).trim());}catch(e){showError(e);}finally{lrFile.value='';}})();
  const acceptLocalFrame=async raw=>{if(!raw.startsWith('ECOLRS1:'))return;const state=localSignalReceiver.add(raw);lrStatus.textContent=state.received+' / '+state.total+' trames de signal';if(state.complete){const signal=await localSignalReceiver.assemble();localSignalReceiver.reset();stopLocalCamera();await acceptLocalSignal(signal);}};
  lrScan.onclick=()=>void(async()=>{try{if(!navigator.mediaDevices?.getUserMedia)throw Error('CAMERA_WEB_UNAVAILABLE_USE_ECO_PACK');stopLocalCamera();localSignalReceiver=new EcoLocalRoomSignalReceiver();localQrScanner=new QrScanner(lrVideo,result=>void(acceptLocalFrame(String(result.data??result)).catch(showError)),{preferredCamera:'environment',maxScansPerSecond:10,highlightScanRegion:true,highlightCodeOutline:true,returnDetailedScanResult:true});await localQrScanner.start();lrStatus.textContent='Caméra active · scannez toutes les trames du signal Eco Local.';}catch(e){stopLocalCamera();showError(e);}})();
  lrStopScan.onclick=()=>stopLocalCamera();
  lrSendMember.onclick=()=>void(async()=>{try{if(!localPeer?.connected)throw Error('ECO_LOCAL_ROOM_NOT_CONNECTED');const bundle=await app.localRoomMemberBundle(lrMember.value,numMeeting.value||meetingSelect.value||undefined);localPeer.send('MEMBER_CAPSULE',bundle);notify('Capsule membre envoyée par le réseau local.');}catch(e){showError(e);}})();
  lrSendDelta.onclick=()=>void(async()=>{try{if(!localPeer?.connected)throw Error('ECO_LOCAL_ROOM_NOT_CONNECTED');localPeer.send('MANAGER_DELTA',await app.localRoomManagerDelta());notify('Intentions et données structurelles envoyées pour confrontation locale.');}catch(e){showError(e);}})();
  lrPrepareFerry.onclick=()=>void(async()=>{try{const result=await app.prepareManagerFerryPackets();ferryStatus.textContent=result.packets.length+' paquet(s) chiffré(s) préparé(s) · '+result.unpaired.length+' gestionnaire(s) non appairé(s).';notify('Paquets passeurs préparés. Ils peuvent voyager via n’importe quel membre sans être lisibles par lui.');await refresh();}catch(e){showError(e);}})();
  lrSendFerry.onclick=()=>void(async()=>{try{if(!localPeer?.connected)throw Error('ECO_LOCAL_ROOM_NOT_CONNECTED');const packets=await app.ecoRelayFerryPackets();localPeer.send('FERRY_PACKET_BATCH',packets);notify(packets.length+' paquet(s) Eco Relay transmis à l’autre appareil.');}catch(e){showError(e);}})();
  lrInternetFerry.onclick=()=>void(async()=>{try{if(navigator.onLine===false)throw Error('NETWORK_UNAVAILABLE');const result=await app.syncEcoRelayFerry();ferryStatus.textContent='Connexion utilisée une fois · envoyés '+result.uploaded+' · reçus '+result.downloaded+' · intégrés '+result.applied+'.';notify('Eco Relay a profité de cette connexion sans polling continu.');await refresh();}catch(e){showError(e);}})();


  const renderFrame=()=>{
    if(!frames.length)return;const raw=frames[frameIndex%frames.length];try{screen.innerHTML=qrMatrixSvg(qrV10LMatrix(raw),9,4);}catch(e){showError(e);stopStream();return;}
    frameInfo.textContent='Trame '+(frameIndex%frames.length+1)+' / '+frames.length+' · boucle '+(Math.floor(frameIndex/frames.length)+1);frameIndex++;
  };
  prepare.onclick=()=>void(async()=>{try{
    stopStream();screen.replaceChildren();frameIndex=0;const result=await app.prepareEcoBroadcast({meetingId:meetingSelect.value||undefined});currentBundle=result.bundle;frames=result.targetedFrames?.length?result.targetedFrames:result.frames;start.disabled=pause.disabled=fullscreen.disabled=pack.disabled=false;
    membersInfo.textContent=result.included.length+' membre(s) inclus · '+result.unpaired.length+' non appairé(s)'+(result.unpaired.length?' — appairez-les avant la prochaine diffusion.':'');
    const fps=Number(speedSelect.value||2.5),seconds=Math.ceil(frames.length/fps);frameInfo.textContent=frames.length+' trames ciblées · environ '+seconds+' s par passage à '+String(fps).replace('.',',')+' QR/s · laissez idéalement 2 passages si plusieurs téléphones sont anciens ou éloignés.';renderFrame();
  }catch(e){showError(e);}})();
  start.onclick=()=>{if(!frames.length)return;stopStream();renderFrame();const fps=Math.max(1,Math.min(5,Number(speedSelect.value||2.5)));timer=setInterval(renderFrame,Math.round(1000/fps));};
  pause.onclick=()=>stopStream();
  fullscreen.onclick=()=>{const target=screen;if(target.requestFullscreen){void target.requestFullscreen().catch(()=>{target.classList.toggle('eco-optical-fullscreen-fallback');target.scrollIntoView({block:'center'});});}else{target.classList.toggle('eco-optical-fullscreen-fallback');target.scrollIntoView({block:'center'});}};
  pack.onclick=()=>void(async()=>{try{if(currentBundle)await shareOrDownload('eco-broadcast-'+currentBundle.transferId+'.ecobroadcast',JSON.stringify(currentBundle),'application/json','Eco Broadcast');}catch(e){showError(e);}})();

  const acceptRaw=async raw=>{
    if(raw.startsWith('ECOP1:')){
      const material=decodePairingQr(raw);await app.importRelayPairingMaterial(material);const identity=await app.relayReceiverIdentity();targetedReceiver=identity?new EcoTargetedBroadcastReceiver(identity.keyId):null;
      progress.textContent='Appairage reçu pour ce membre. La clé reste sur cet appareil.';notify('Appairage Eco Relay enregistré.');return;
    }
    if(raw.startsWith('ECOB2:')){
      if(!targetedReceiver){const identity=await app.relayReceiverIdentity();if(!identity)throw Error('RELAY_PAIRING_REQUIRED');targetedReceiver=new EcoTargetedBroadcastReceiver(identity.keyId);}
      const state=targetedReceiver.add(raw);if(!state.forThisMember)return;
      progress.textContent=state.received+' / '+state.total+' trames personnelles'+(state.complete?' · complet':'');
      if(state.complete){const bundle=await targetedReceiver.assemble(),capsule=await app.receiveEcoBroadcast(bundle);progress.textContent='Mise à jour reçue · membre '+capsule.membershipId+' · '+new Date(capsule.generatedAt).toLocaleString();targetedReceiver.reset();stopCamera();notify('Compte personnel Eco mis à jour sans Internet.');}
      return;
    }
    if(!raw.startsWith('ECOB1:'))return;
    const state=receiver.add(raw);progress.textContent=state.received+' / '+state.total+' trames'+(state.complete?' · complet':'');
    if(state.complete){const bundle=await receiver.assemble(),capsule=await app.receiveEcoBroadcast(bundle);progress.textContent='Mise à jour reçue · membre '+capsule.membershipId+' · '+new Date(capsule.generatedAt).toLocaleString();receiver.reset();stopCamera();notify('Compte personnel Eco mis à jour sans Internet.');}
  };
  cameraBtn.onclick=()=>void(async()=>{try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('CAMERA_WEB_UNAVAILABLE_USE_ECO_PACK');
    stopCamera();receiver=new EcoBroadcastReceiver();const identity=await app.relayReceiverIdentity();targetedReceiver=identity?new EcoTargetedBroadcastReceiver(identity.keyId):null;qrScanner=new QrScanner(video,result=>void(acceptRaw(String(result.data??result)).catch(showError)),{preferredCamera:'environment',maxScansPerSecond:10,highlightScanRegion:true,highlightCodeOutline:true,returnDetailedScanResult:true});
    await qrScanner.start();progress.textContent='Caméra active · gardez le QR animé dans le cadre jusqu’à 100 %.';
  }catch(e){stopCamera();progress.textContent='Caméra indisponible. Sur iPhone/iPad, essayez Safari ; Eco Pack reste disponible hors Internet.';showError(e);}})();cameraStop.onclick=()=>stopCamera();
  photoBtn.onclick=()=>photoInput.click();photoInput.onchange=()=>void(async()=>{try{const file=photoInput.files?.[0];if(!file)return;const result=await QrScanner.scanImage(file,{returnDetailedScanResult:true});await acceptRaw(String(result.data??result));}catch(e){showError(e);}finally{photoInput.value='';}})();

  fileInput.onchange=async()=>{try{const file=fileInput.files?.[0];if(!file)return;const bundle=JSON.parse(await file.text());const capsule=await app.receiveEcoBroadcast(bundle);progress.textContent='Eco Pack reçu · compte '+capsule.membershipId+' mis à jour.';notify('Eco Pack importé.');}catch(e){showError(e);}};
  pairImport.onchange=async()=>{try{const file=pairImport.files?.[0];if(!file)return;await acceptRaw((await file.text()).trim());}catch(e){showError(e);}};

  numPreview.onclick=()=>void(async()=>{try{
    const preview=await app.previewEcoNumpad(numInput.value,numMeeting.value);numDraft={raw:numInput.value,meetingId:numMeeting.value};numResult.replaceChildren(el('strong','Membre N°'+preview.draft.memberNumber+' · '+preview.membership.displayName),el('p',preview.meeting.title,'hint'));
    for(const row of preview.rows)numResult.append(el('p',row.code+' · '+row.rubric.name+' · '+money(row.amount)));
    numCommit.disabled=false;
  }catch(e){numDraft=null;numCommit.disabled=true;numResult.replaceChildren();showError(e);}})();
  numCommit.onclick=()=>void(async()=>{try{
    if(!numDraft)throw Error('NUMPAD_PREVIEW_REQUIRED');const done=await app.commitEcoNumpad(numDraft.raw,numDraft.meetingId);notify(done.results.length+' ligne(s) NumPad enregistrée(s).');numInput.value='';numDraft=null;numCommit.disabled=true;numResult.replaceChildren();await refresh();
  }catch(e){showError(e);}})();

  closingCash.addEventListener('input',()=>closingCash.dataset.userEdited='1');
  openExercise.onclick=()=>void(async()=>{try{const row=await app.openExercise({label:newLabel.value,openingCash:Number(openingCash.value||0)});notify('Exercice « '+row.title+' » ouvert localement.');newLabel.value='';openingCash.value='';await refresh();}catch(e){showError(e);}})();
  prepareClose.onclick=()=>void(async()=>{try{
    const exercises=await app.exercises(),current=exercises.find(x=>String(x.data?.completionState)==='OPEN');if(!current)throw Error('EXERCISE_NOT_OPEN');
    const [draft,source]=await Promise.all([app.exerciseYieldDraft(),app.savingsYieldSourceData()]),rows=yieldRows(draft),principalByMember=new Map();
    for(const d of source.deposits??[])principalByMember.set(d.memberId,(principalByMember.get(d.memberId)??0)+Number(d.amount??0));
    const interestByMember=new Map(rows.map(x=>[x.membershipId,x.interest])),memberIds=new Set([...principalByMember.keys(),...interestByMember.keys()]);
    const members=[...memberIds].map(id=>({membershipId:id,principal:Number(principalByMember.get(id)??rows.find(x=>x.membershipId===id)?.principal??0),interest:Number(interestByMember.get(id)??0)}));
    const retainedFunds=[
      {code:'SOLIDARITY_FUND',label:'Fonds Secours',amount:Number(solidarity.value||0),carryForward:true},
      {code:'RESERVE',label:'Réserve',amount:Number(reserve.value||0),carryForward:true},
      {code:'BUREAU',label:'Bureau / indemnités',amount:Number(bureau.value||0),carryForward:false}
    ].filter(x=>x.amount>0);
    const prepared=await app.prepareExerciseClosing(current.id,{closingCash:Number(closingCash.value||0),members,retainedFunds,principalDisposition:principalDisposition.value,interestDisposition:interestDisposition.value,unassignedCarryForward:Number(otherCarry.value||0)});
    const p=prepared.plan;closingResult.replaceChildren(el('p','Méthode intérêts : '+(draft?.method??'aucune répartition mémorisée'),'truth-notice'),el('p','Principal : '+money(p.totalPrincipal)+' · intérêts : '+money(p.totalInterest)+' · enveloppes cash : '+money(p.memberCashPayoutTotal)),el('p','Fonds retenus : '+money(p.retainedFundsTotal)+' · report membres : '+money(p.memberCarryForwardTotal)+' · ouverture suivante prévue : '+money(p.nextExerciseOpeningCash),'hint'));
    for(const row of p.members.slice(0,30)){const m=getMembers().find(x=>x.id===row.membershipId);closingResult.append(el('p',(m?.displayName??row.membershipId)+' · paiement '+money(row.cashPayout)+' · report '+money(row.nextExerciseOpeningPosition)));}
    notify('Plan de clôture calculé et conservé localement. Vérifiez-le avant clôture définitive.');await refresh();
  }catch(e){showError(e);}})();
  closeExercise.onclick=()=>void(async()=>{try{const current=(await app.exercises()).find(x=>String(x.data?.completionState)==='CLOSING');if(!current)throw Error('EXERCISE_NOT_CLOSING');await app.closeExercise(current.id);notify('Exercice clôturé. Le plan reste figé et auditable.');await refresh();}catch(e){showError(e);}})();
  rollExercise.onclick=()=>void(async()=>{try{const latest=(await app.exercises()).filter(x=>String(x.data?.completionState)==='CLOSED').sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];if(!latest)throw Error('EXERCISE_NOT_CLOSED');const done=await app.carryForwardExercise(latest.id,nextLabel.value);notify('Nouvel exercice « '+done.next.title+' » ouvert avec les reports validés.');nextLabel.value='';await refresh();}catch(e){showError(e);}})();

  vaultExport.onclick=async()=>{try{const encoded=await app.exportEcoVault(pass.value);const stamp=new Date().toISOString().replace(/[:.]/g,'-');await shareOrDownload('eco-vault-'+(app.activeGroup?.()??'groupe')+'-'+stamp+'.ecovault',encoded,'text/plain','Eco Vault');vaultStatus.textContent='Vault créé. Copiez-le idéalement sur deux autres supports physiques.';}catch(e){showError(e);}};
  vaultRestore.onclick=async()=>{try{const file=vaultFile.files?.[0];if(!file)throw Error('VAULT_FILE_REQUIRED');const encoded=(await file.text()).trim(),info=await app.inspectEcoVault(pass.value,encoded);vaultStatus.textContent='Vault vérifié : '+info.events+' événements · '+info.snapshots+' snapshots. Restauration…';const done=await app.restoreEcoVault(pass.value,encoded);vaultStatus.textContent='Restauration terminée : '+done.events+' événements · '+done.outbox+' opérations de synchro.';notify('Eco Vault restauré et contrôlé.');await refresh();}catch(e){showError(e);}};

  const suspendOptics=()=>{stopStream();stopLocalSignal();if(qrScanner){stopCamera();progress.textContent='Caméra arrêtée pendant la mise en arrière-plan. Touchez « Ouvrir la caméra » pour reprendre.';}if(localQrScanner){stopLocalCamera();lrStatus.textContent='Caméra Eco Local arrêtée pendant la mise en arrière-plan. Relancez le scan pour reprendre.';}};
  const onVisibility=()=>{if(document.hidden)suspendOptics();};
  document.addEventListener('visibilitychange',onVisibility);window.addEventListener('pagehide',suspendOptics);window.addEventListener('beforeunload',suspendOptics);
  void refresh();return{refresh,stop:()=>{document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',suspendOptics);stopStream();stopCamera();stopLocalSignal();stopLocalCamera();localPeer?.close();}};
}
