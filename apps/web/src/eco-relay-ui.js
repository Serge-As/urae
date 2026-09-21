import {createEcoRelayBundle,encodeRelayQrFrames,decodeRelayQrFrames,verifyEcoRelayBundle} from '../../../packages/relay/src/index.js';

const $=s=>document.querySelector(s);
const state={frames:[],index:0,received:new Map()};
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function modal(){
 let d=$('#ecoRelayDialog');if(d)return d;
 d=document.createElement('dialog');d.id='ecoRelayDialog';d.className='relay-dialog';
 d.innerHTML=`<form method="dialog" class="relay-head"><div><strong>Eco Relay</strong><small>Partager ou recevoir sans Internet</small></div><button aria-label="Fermer">✕</button></form><div id="relayBody"></div>`;
 document.body.append(d);return d;
}
function actor(){return document.querySelector('#accountName')?.textContent?.trim()||'local-user';}
function device(){let id=localStorage.getItem('eco.relay.deviceId');if(!id){id=crypto.randomUUID?.()||('device-'+Date.now());localStorage.setItem('eco.relay.deviceId',id);}return id;}
function activeGroup(){return document.querySelector('#activeGroupSelect')?.value||undefined;}
function drawPseudoQr(text){
 const size=29,canvas=document.createElement('canvas');canvas.width=canvas.height=290;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,290,290);
 let seed=0;for(let i=0;i<text.length;i++)seed=(seed*31+text.charCodeAt(i))>>>0;const cell=10;
 ctx.fillStyle='#111';const finder=(x,y)=>{ctx.fillRect(x*cell,y*cell,70,70);ctx.fillStyle='#fff';ctx.fillRect((x+1)*cell,(y+1)*cell,50,50);ctx.fillStyle='#111';ctx.fillRect((x+2)*cell,(y+2)*cell,30,30);};
 finder(0,0);finder(22,0);finder(0,22);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){if((x<7&&y<7)||(x>=22&&y<7)||(x<7&&y>=22))continue;seed=(seed*1664525+1013904223)>>>0;if(seed&1)ctx.fillRect(x*cell,y*cell,cell,cell);}
 canvas.dataset.relayPayload=text;canvas.title='Aperçu visuel du fragment Eco Relay';return canvas;
}
async function shareQr(){
 const d=modal(),body=d.querySelector('#relayBody');body.innerHTML='<p>Préparation du paquet…</p>';d.showModal();
 const bundle=await createEcoRelayBundle({kind:'SYNC_FORWARD',senderActorId:actor(),senderDeviceId:device(),groupId:activeGroup(),recipientScope:'GROUP_MANAGERS',events:[],parentBundleIds:[]});
 state.frames=await encodeRelayQrFrames(bundle,700);state.index=0;renderFrame();
}
function renderFrame(){
 const body=$('#relayBody'),f=state.frames[state.index],raw=JSON.stringify(f);body.innerHTML=`<div class="relay-step"><h2>Partager via QR Code</h2><p>Montrez cet écran à l'autre téléphone. <strong>Fragment ${state.index+1}/${state.frames.length}</strong></p><div id="relayQrVisual" class="relay-qr"></div><textarea readonly aria-label="Données QR">${escapeHtml(raw)}</textarea><div class="actions"><button id="relayPrev" type="button">Précédent</button><button id="relayNext" type="button" class="primary">Suivant</button><button id="relayNative" type="button">Autres moyens de partage</button></div><p class="hint">Le texte reste disponible comme secours si la caméra/QR n'est pas prise en charge.</p></div>`;
 $('#relayQrVisual').append(drawPseudoQr(raw));$('#relayPrev').disabled=state.index===0;$('#relayNext').textContent=state.index===state.frames.length-1?'Terminé':'Suivant';
 $('#relayPrev').onclick=()=>{if(state.index>0){state.index--;renderFrame();}};$('#relayNext').onclick=()=>{if(state.index<state.frames.length-1){state.index++;renderFrame();}else modal().close();};
 $('#relayNative').onclick=()=>nativeShare(raw);
}
async function nativeShare(raw){
 try{if(navigator.share){await navigator.share({title:'Eco Relay',text:raw});return;}}catch(e){if(e?.name==='AbortError')return;}
 const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='eco-relay.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function receiveQr(){
 const d=modal(),body=d.querySelector('#relayBody');state.received.clear();body.innerHTML=`<div class="relay-step"><h2>Recevoir par QR Code</h2><p>1. Appuyez sur <strong>Scanner</strong> et visez le QR de l'autre téléphone.<br>2. Si le scanner n'est pas disponible, collez le texte du QR.</p><div class="actions"><button id="relayScan" type="button" class="primary">Scanner avec la caméra</button></div><label>Ou coller le fragment<textarea id="relayPaste" rows="6" placeholder="Collez ici les données Eco Relay"></textarea></label><button id="relayAccept" type="button">Ajouter ce fragment</button><div id="relayReceiveStatus" class="result"></div></div>`;d.showModal();
 $('#relayAccept').onclick=()=>acceptRaw($('#relayPaste').value);
 $('#relayScan').onclick=scanCamera;
}
async function acceptRaw(raw){
 const status=$('#relayReceiveStatus');try{const f=JSON.parse(raw.trim());if(f.format!=='eco-relay-qr')throw Error('QR_NON_ECO_RELAY');state.received.set(f.index,f);status.textContent=`Fragment ${f.index+1}/${f.total} reçu. ${state.received.size}/${f.total} disponibles.`;if(state.received.size===f.total){const bundle=await decodeRelayQrFrames([...state.received.values()]);if(!(await verifyEcoRelayBundle(bundle)))throw Error('PAQUET_INVALIDE');status.innerHTML=`<strong>Paquet Eco Relay vérifié ✓</strong><br>${escapeHtml(bundle.kind)} · ${bundle.events.length} événement(s).<br><small>L'import métier sera proposé après contrôle des droits et divergences.</small>`;}}catch(e){status.textContent='QR refusé : '+(e?.message||e);}
}
async function scanCamera(){
 const status=$('#relayReceiveStatus');
 if(!('BarcodeDetector' in globalThis)){status.textContent='Scanner QR automatique indisponible sur ce navigateur. Utilisez le partage natif, le fichier ou collez le texte du QR.';return;}
 try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.srcObject=stream;status.replaceChildren(video);const detector=new BarcodeDetector({formats:['qr_code']});const timer=setInterval(async()=>{try{const codes=await detector.detect(video);if(codes[0]?.rawValue){clearInterval(timer);stream.getTracks().forEach(t=>t.stop());await acceptRaw(codes[0].rawValue);}}catch{}},350);setTimeout(()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop());},60000);}catch(e){status.textContent='Caméra indisponible. Utilisez le partage natif, le fichier ou le collage.';}
}
export function installEcoRelayUI(){
 const share=$('#shareQrBtn'),receive=$('#receiveQrBtn');if(share)share.onclick=()=>void shareQr();if(receive)receive.onclick=()=>void receiveQr();
 window.addEventListener('eco:relay-reconcile-meeting',event=>void openMeetingRelay(event.detail,'reconcile'));
 window.addEventListener('eco:relay-distribute-members',event=>void openMeetingRelay(event.detail,'distribute'));
}
async function openMeetingRelay(detail,mode){
 const d=modal(),body=d.querySelector('#relayBody'),reconcile=mode==='reconcile';
 body.innerHTML=`<div class="relay-step"><h2>${reconcile?'Confronter les gestionnaires':'Diffuser aux membres'}</h2><p>${reconcile?'Le gestionnaire A choisit le moyen. Le gestionnaire B appuie Recevoir et attend. Eco-System doit échanger les deltas de cette séance et ne comparer que les divergences.':'Cette action est séparée du rapprochement. Elle prépare uniquement les mises à jour autorisées des membres après accord des gestionnaires.'}</p><div class="relay-method-grid"><button data-relay-method="qr" class="primary">QR Code · recommandé</button><button data-relay-method="nearby">Téléphone à proximité · rapide</button><button data-relay-method="native">Partage du téléphone</button><button data-relay-method="file">Fichier Eco Relay</button></div><p class="hint">Séance : ${escapeHtml(detail?.meetingId||'—')}. Les moyens non disponibles doivent basculer vers QR/fichier sans perdre les données.</p></div>`;d.showModal();
 body.querySelector('[data-relay-method="qr"]').onclick=()=>void shareMeetingDelta(detail,reconcile?'CONSENSUS':'MEMBER_DELTA');
 body.querySelector('[data-relay-method="native"]').onclick=()=>void shareMeetingDelta(detail,reconcile?'CONSENSUS':'MEMBER_DELTA',true);
 body.querySelector('[data-relay-method="file"]').onclick=()=>void shareMeetingDelta(detail,reconcile?'CONSENSUS':'MEMBER_DELTA',true);
 body.querySelector('[data-relay-method="nearby"]').onclick=()=>{body.querySelector('.hint').textContent='Proximité/Wi‑Fi direct est en qualification. Utilisez QR maintenant : aucune donnée ne sera perdue.';};
}
async function shareMeetingDelta(detail,kind,native=false){
 const bundle=await createEcoRelayBundle({kind,senderActorId:actor(),senderDeviceId:device(),groupId:detail?.groupId,meetingId:detail?.meetingId,recipientScope:kind==='MEMBER_DELTA'?'MEMBER':'GROUP_MANAGERS',events:[],parentBundleIds:[]});
 state.frames=await encodeRelayQrFrames(bundle,700);state.index=0;if(native){await nativeShare(JSON.stringify(state.frames));return;}renderFrame();
}

function openMeetingReconcile(detail={}){
 const d=modal(),body=d.querySelector('#relayBody');body.innerHTML=`<div class="relay-step"><h2>Confronter les données</h2><p><strong>Téléphone A :</strong> choisissez comment envoyer. <strong>Téléphone B :</strong> appuyez sur Recevoir et attendez.</p><p>Eco-System prépare uniquement les données utiles au rapprochement de la séance afin de réduire le transfert. Les données identiques n'ont pas vocation à circuler plusieurs fois.</p><div class="actions"><button id="meetingQrSend" class="primary" type="button">QR Code — recommandé</button><button id="meetingOtherSend" type="button">Autres moyens</button><button id="meetingWaitReceive" type="button">Je suis B · Recevoir</button></div><p class="hint">Après réception, les divergences doivent être confrontées avant toute diffusion aux membres.</p></div>`;d.showModal();
 $('#meetingQrSend').onclick=()=>void shareQr();$('#meetingOtherSend').onclick=()=>void nativeShare(JSON.stringify({format:'eco-relay-meeting-request',meetingId:detail.meetingId,groupId:detail.groupId}));$('#meetingWaitReceive').onclick=()=>void receiveQr();
}
function openMemberDistribution(detail={}){
 const d=modal(),body=d.querySelector('#relayBody');body.innerHTML=`<div class="relay-step"><h2>Diffuser aux membres</h2><p>Cette action est séparée du rapprochement des gestionnaires. Elle prépare la diffusion des données déjà validées aux membres autorisés.</p><div class="truth-notice"><strong>Diffusion de masse :</strong> pour 80 personnes, un QR individuel à la chaîne n'est pas la cible. Eco-System privilégiera un réseau local/hotspot avec diffusion parallèle; QR sert à rejoindre la séance et établir l'identité/la clé. Le fichier et le QR individuel restent des secours.</div><div class="actions"><button id="memberBroadcastNearby" class="primary" type="button">Diffuser à proximité</button><button id="memberBroadcastQr" type="button">QR de connexion</button><button id="memberBroadcastFile" type="button">Fichier de secours</button></div><p id="memberBroadcastStatus" class="result"></p></div>`;d.showModal();
 $('#memberBroadcastNearby').onclick=()=>{$('#memberBroadcastStatus').textContent='Mode proximité préparé : la qualification réseau local/WebRTC multi-appareils reste requise avant activation terrain.';};
 $('#memberBroadcastQr').onclick=()=>void shareQr();$('#memberBroadcastFile').onclick=()=>void nativeShare(JSON.stringify({format:'eco-relay-member-distribution',meetingId:detail.meetingId,groupId:detail.groupId}));
}
