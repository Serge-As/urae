import {EcoBroadcastReceiver,encodePairingQr,decodePairingQr} from '../../../packages/relay/src/broadcast.js';
import {qrV10LMatrix,qrMatrixSvg} from '../../../packages/relay/src/qr-v10.js';
import QrScanner from './vendor/qr-scanner.min.js';

const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const download=(name,text,type='application/json')=>{const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
const shareOrDownload=async(name,text,type,title)=>{const blob=new Blob([text],{type}),file=new File([blob],name,{type});if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title,files:[file]});return true;}download(name,text,type);return false;};
const money=n=>Math.round(Number(n)||0).toLocaleString('fr-FR')+' F';
const yieldRows=draft=>{
  const map=new Map(),add=row=>{if(!row?.memberId)return;const old=map.get(row.memberId)??{membershipId:row.memberId,principal:0,interest:0};old.principal+=Number(row.principal??0);old.interest+=Number(row.interest??0);map.set(row.memberId,old);};
  const result=draft?.result??{};
  if(Array.isArray(result.members))for(const row of result.members)add(row);
  for(const fund of result.funds??[]){const rows=fund?.members??fund?.data?.members??[];for(const row of rows)add(row);}
  return[...map.values()];
};

export function mountSovereignOfflineUI({app,getMembers=()=>[],getMeetings=()=>[],isManager=()=>false,notify=()=>{},showError=console.error}={}){
  const relay=document.getElementById('ecoRelaySovereignWorkspace'),local=document.getElementById('ecoLocalSovereignWorkspace');if(!relay||!local)return{refresh:async()=>{}};
  let frames=[],frameIndex=0,timer=null,currentBundle=null,qrScanner=null,receiver=new EcoBroadcastReceiver();

  const stopStream=()=>{if(timer){clearInterval(timer);timer=null;}};
  const stopCamera=()=>{if(qrScanner){try{qrScanner.stop();qrScanner.destroy();}catch{}qrScanner=null;}video.srcObject=null;};

  const status=el('p','Eco Relay prêt. Les données financières restent gouvernées par le noyau canonique.','truth-notice');
  const pairing=el('section',undefined,'item'),ph=el('h3','1 · Appairer chaque membre une seule fois'),pairNote=el('p','Le QR d’appairage contient la clé privée de ce membre. Affichez-le seulement devant la personne concernée, de près, puis masquez-le.','hint');
  const pairSelect=el('select'),pairBtn=el('button','Créer / afficher la clé','primary'),rotateBtn=el('button','Renouveler la clé','secondary'),pairQr=el('div',undefined,'eco-optical-qr'),pairInfo=el('p','', 'hint'),pairExport=el('button','Exporter .ecopair','secondary');pairExport.disabled=true;
  let lastPair=null;
  const pairActions=el('div',undefined,'actions');pairActions.append(pairBtn,rotateBtn,pairExport);pairing.append(ph,pairNote,pairSelect,pairActions,pairQr,pairInfo);

  const broadcast=el('section',undefined,'item'),bh=el('h3','2 · Eco Broadcast QR · diffusion collective'),meetingSelect=el('select'),prepare=el('button','Préparer la diffusion','primary'),start=el('button','Démarrer','primary'),pause=el('button','Pause','secondary'),fullscreen=el('button','Plein écran','secondary'),pack=el('button','Exporter Eco Pack','secondary'),screen=el('div',undefined,'eco-optical-screen'),frameInfo=el('p','Aucune diffusion préparée.','hint'),membersInfo=el('p','', 'hint');
  start.disabled=pause.disabled=fullscreen.disabled=pack.disabled=true;const ba=el('div',undefined,'actions');ba.append(prepare,start,pause,fullscreen,pack);broadcast.append(bh,el('p','Tous les téléphones regardent le même QR animé. Chaque appareil collecte les trames puis ouvre uniquement la capsule chiffrée de son propriétaire.','hint'),meetingSelect,ba,screen,frameInfo,membersInfo);

  const receive=el('section',undefined,'item'),rh=el('h3','3 · Recevoir sur le téléphone du membre'),cameraBtn=el('button','Ouvrir la caméra','primary'),cameraStop=el('button','Arrêter caméra','secondary'),photoBtn=el('button','Lire un QR depuis une photo','secondary'),video=document.createElement('video'),progress=el('p','0 / 0 trame','truth-notice'),fileInput=document.createElement('input'),pairImport=document.createElement('input'),photoInput=document.createElement('input');
  video.autoplay=true;video.playsInline=true;video.muted=true;video.className='eco-relay-camera';fileInput.type='file';fileInput.accept='.ecobroadcast,application/json';pairImport.type='file';pairImport.accept='.ecopair,application/json,text/plain';photoInput.type='file';photoInput.accept='image/*';photoInput.setAttribute('capture','environment');photoInput.hidden=true;
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

  const vault=el('section',undefined,'item'),vh=el('h3','Eco Vault · sauvegarde longue durée'),pass=document.createElement('input'),vaultExport=el('button','Créer un Eco Vault','primary'),vaultFile=document.createElement('input'),vaultRestore=el('button','Vérifier puis restaurer','secondary'),vaultStatus=el('p','', 'hint');
  pass.type='password';pass.placeholder='Phrase secrète (8 caractères minimum)';pass.autocomplete='new-password';vaultFile.type='file';vaultFile.accept='.ecovault,text/plain';
  const va=el('div',undefined,'actions');va.append(vaultExport,vaultRestore);vault.append(vh,el('p','Le Vault est chiffré et contient les snapshots, le journal local et les clés Relay du groupe. Gardez plusieurs copies A/B/C sur des supports différents.','hint'),pass,va,vaultFile,vaultStatus);

  relay.replaceChildren(status,pairing,broadcast,receive);
  local.replaceChildren(exercise,vault,el('p','Eco Local Room multi-appareils utilisera les mêmes capsules et le même journal. Broadcast QR et Eco Pack sont déjà des transports sans Internet ; le transport LAN/WebRTC restera un accélérateur et jamais une seconde comptabilité.','truth-notice'));

  const refresh=async()=>{
    const members=getMembers().filter(x=>x.status==='active'),meetings=getMeetings().slice().sort((a,b)=>String(b.scheduledAt??b.openedAt).localeCompare(String(a.scheduledAt??a.openedAt)));
    const keep=pairSelect.value;pairSelect.replaceChildren(...members.map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent='N°'+(m.memberNumber??'—')+' · '+m.displayName;return o;}));if(members.some(x=>x.id===keep))pairSelect.value=keep;
    const mk=meetingSelect.value;meetingSelect.replaceChildren(...meetings.map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.title+' · '+String(m.status);return o;}));if(meetings.some(x=>x.id===mk))meetingSelect.value=mk;
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

  const renderFrame=()=>{
    if(!frames.length)return;const raw=frames[frameIndex%frames.length];try{screen.innerHTML=qrMatrixSvg(qrV10LMatrix(raw),9,4);}catch(e){showError(e);stopStream();return;}
    frameInfo.textContent='Trame '+(frameIndex%frames.length+1)+' / '+frames.length+' · boucle '+(Math.floor(frameIndex/frames.length)+1);frameIndex++;
  };
  prepare.onclick=()=>void(async()=>{try{
    stopStream();screen.replaceChildren();frameIndex=0;const result=await app.prepareEcoBroadcast({meetingId:meetingSelect.value||undefined});currentBundle=result.bundle;frames=result.frames;start.disabled=pause.disabled=fullscreen.disabled=pack.disabled=false;
    membersInfo.textContent=result.included.length+' membre(s) inclus · '+result.unpaired.length+' non appairé(s)'+(result.unpaired.length?' — appairez-les avant la prochaine diffusion.':'');
    const seconds=Math.ceil(frames.length/2.5);frameInfo.textContent=frames.length+' trames · environ '+seconds+' s par passage à 2,5 images/s · laissez idéalement 2 passages pour les téléphones lents.';renderFrame();
  }catch(e){showError(e);}})();
  start.onclick=()=>{if(!frames.length)return;stopStream();renderFrame();timer=setInterval(renderFrame,400);};
  pause.onclick=()=>stopStream();
  fullscreen.onclick=()=>{const target=screen;target.requestFullscreen?.().catch(()=>{});};
  pack.onclick=()=>void(async()=>{try{if(currentBundle)await shareOrDownload('eco-broadcast-'+currentBundle.transferId+'.ecobroadcast',JSON.stringify(currentBundle),'application/json','Eco Broadcast');}catch(e){showError(e);}})();

  const acceptRaw=async raw=>{
    if(raw.startsWith('ECOP1:')){const material=decodePairingQr(raw);await app.importRelayPairingMaterial(material);progress.textContent='Appairage reçu pour ce membre. La clé reste sur cet appareil.';notify('Appairage Eco Relay enregistré.');return;}
    if(!raw.startsWith('ECOB1:'))return;
    const p=receiver.add(raw);progress.textContent=p.received+' / '+p.total+' trames'+(p.complete?' · complet':'');
    if(p.complete){const bundle=await receiver.assemble(),capsule=await app.receiveEcoBroadcast(bundle);progress.textContent='Mise à jour reçue · membre '+capsule.membershipId+' · '+new Date(capsule.generatedAt).toLocaleString();receiver.reset();stopCamera();notify('Compte personnel Eco mis à jour sans Internet.');}
  };
  cameraBtn.onclick=()=>void(async()=>{try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('CAMERA_WEB_UNAVAILABLE_USE_ECO_PACK');
    stopCamera();receiver=new EcoBroadcastReceiver();qrScanner=new QrScanner(video,result=>void(acceptRaw(String(result.data??result)).catch(showError)),{preferredCamera:'environment',maxScansPerSecond:10,highlightScanRegion:true,highlightCodeOutline:true,returnDetailedScanResult:true});
    await qrScanner.start();progress.textContent='Caméra active · gardez le QR animé dans le cadre jusqu’à 100 %.';
  }catch(e){stopCamera();progress.textContent='Caméra indisponible. Sur iPhone/iPad, essayez Safari ; Eco Pack reste disponible hors Internet.';showError(e);}})();cameraStop.onclick=()=>stopCamera();
  photoBtn.onclick=()=>photoInput.click();photoInput.onchange=()=>void(async()=>{try{const file=photoInput.files?.[0];if(!file)return;const result=await QrScanner.scanImage(file,{returnDetailedScanResult:true});await acceptRaw(String(result.data??result));}catch(e){showError(e);}finally{photoInput.value='';}})();

  fileInput.onchange=()=>void(async()=>{try{const file=fileInput.files?.[0];if(!file)return;const bundle=JSON.parse(await file.text());const capsule=await app.receiveEcoBroadcast(bundle);progress.textContent='Eco Pack reçu · compte '+capsule.membershipId+' mis à jour.';notify('Eco Pack importé.');}catch(e){showError(e);}});
  pairImport.onchange=()=>void(async()=>{try{const file=pairImport.files?.[0];if(!file)return;await acceptRaw((await file.text()).trim());}catch(e){showError(e);}});

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

  vaultExport.onclick=()=>void(async()=>{try{const encoded=await app.exportEcoVault(pass.value);const stamp=new Date().toISOString().replace(/[:.]/g,'-');await shareOrDownload('eco-vault-'+(app.activeGroup?.()??'groupe')+'-'+stamp+'.ecovault',encoded,'text/plain','Eco Vault');vaultStatus.textContent='Vault créé. Copiez-le idéalement sur deux autres supports physiques.';}catch(e){showError(e);}});
  vaultRestore.onclick=()=>void(async()=>{try{const file=vaultFile.files?.[0];if(!file)throw Error('VAULT_FILE_REQUIRED');const encoded=(await file.text()).trim(),info=await app.inspectEcoVault(pass.value,encoded);vaultStatus.textContent='Vault vérifié : '+info.events+' événements · '+info.snapshots+' snapshots. Restauration…';const done=await app.restoreEcoVault(pass.value,encoded);vaultStatus.textContent='Restauration terminée : '+done.events+' événements · '+done.outbox+' opérations de synchro.';notify('Eco Vault restauré et contrôlé.');await refresh();}catch(e){showError(e);}});

  window.addEventListener('beforeunload',()=>{stopStream();stopCamera();});void refresh();return{refresh,stop:()=>{stopStream();stopCamera();}};
}
