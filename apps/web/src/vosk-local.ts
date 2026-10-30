/** Optional, pinned French ASR. Model-only storage has no financial or identity data. */
const CACHE='eco-voice-fr022-v1',DATABASE='/eco-voice-fr022-v1',ROOT='/vendor/voice/';
const MODEL_KEY=ROOT+'fr022.tar.gz',ENGINE_KEY=ROOT+'vosk.js',WORKER_KEY=ROOT+'worker.js';
const SOURCE_SHA='cabf6180e177eb9b3a9a9d43a437bd5e549f3a7d09525e5d69a3fed787be12ad';
type Metric={modelLoadMs:number;audioSeconds:number;elapsedMs:number;realTimeFactor:number|null;heapBefore:number|null;heapAfter:number|null;batteryBefore:number|null;batteryAfter:number|null;physicalAcceptance:'NOT_ACCEPTED'};
let modelPromise:Promise<any>|undefined,loadedModel:any,modelUrl='',enginePromise:Promise<void>|undefined,lastMetric:Metric|undefined,generation=0;
const sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
const terminateModel=()=>{const current=loadedModel;loadedModel=undefined;try{current?.terminate();}catch{}current?.worker?.terminate?.();};
const heap=()=>Number((performance as any).memory?.usedJSHeapSize)||null;
const battery=async()=>{try{const value=await Promise.race([(navigator as any).getBattery?.(),new Promise(resolve=>setTimeout(()=>resolve(null),300))]);return Number.isFinite(value?.level)?value.level:null;}catch{return null;}};
export async function localModelInstalled(){try{const cache=await caches.open(CACHE);return Boolean(await cache.match(MODEL_KEY)&&await cache.match(ENGINE_KEY)&&await cache.match(WORKER_KEY));}catch{return false;}}
export async function installLocalModel(progress:(value:string)=>void=()=>{}){
  if(!window.isSecureContext||!window.caches||!crypto.subtle)throw Error('LOCAL_MODEL_STORAGE_UNAVAILABLE');
  const response=await fetch(ROOT+'manifest.json',{cache:'no-store'});if(!response.ok)throw Error('LOCAL_MODEL_UNAVAILABLE');const manifest=await response.json() as any;
  if(manifest.packagingVersion!==5||manifest.sourceSha256!==SOURCE_SHA||manifest.language!=='fr-FR'||manifest.onDemandOnly!==true||!Array.isArray(manifest.assets))throw Error('LOCAL_MODEL_MANIFEST_INVALID');
  const cache=await caches.open(CACHE),parts:ArrayBuffer[]=[];let downloaded=0;
  for(const asset of manifest.assets){
    if(!/^(vosk\.js|worker\.js|model-fr-part-\d{2}\.bin)$/.test(asset.path)||!Number.isSafeInteger(asset.bytes)||asset.bytes>9*1024*1024||asset.bytes<1||!/^[0-9a-f]{64}$/.test(asset.sha256))throw Error('LOCAL_MODEL_MANIFEST_INVALID');
    const url=ROOT+asset.path;let cached=await cache.match(url),bytes=cached?await cached.arrayBuffer():undefined;
    if(!bytes||bytes.byteLength!==asset.bytes||await sha(bytes)!==asset.sha256){const r=await fetch(url);if(!r.ok)throw Error('LOCAL_MODEL_DOWNLOAD_FAILED');bytes=await r.arrayBuffer();if(bytes.byteLength!==asset.bytes||await sha(bytes)!==asset.sha256)throw Error('LOCAL_MODEL_INTEGRITY_MISMATCH');const headers=new Headers({'content-type':asset.path.endsWith('.js')?'text/javascript':'application/octet-stream'});if(asset.path==='worker.js'){const policy=r.headers.get('content-security-policy');if(policy)headers.set('content-security-policy',policy);}await cache.put(url,new Response(bytes,{headers}));}
    downloaded+=bytes.byteLength;progress(Math.round(downloaded/1024/1024)+' Mo');if(asset.path.startsWith('model-fr-part-'))parts.push(bytes);
  }
  const blob=new Blob(parts,{type:'application/gzip'}),packed=await blob.arrayBuffer();if(packed.byteLength!==manifest.archiveBytes||await sha(packed)!==manifest.archiveSha256)throw Error('LOCAL_MODEL_INTEGRITY_MISMATCH');
  await cache.put(MODEL_KEY,new Response(blob,{headers:{'content-type':'application/gzip'}}));
  // Incomplete chunks remain resumable until this commit; the verified archive
  // then replaces them, so an installed model does not keep two compressed copies.
  for(const asset of manifest.assets)if(asset.path.startsWith('model-fr-part-'))await cache.delete(ROOT+asset.path);
  await cache.put(ROOT+'manifest.json',new Response(JSON.stringify(manifest),{headers:{'content-type':'application/json'}}));
}
async function engine(){
  if((window as any).Vosk)return;
  if(!enginePromise)enginePromise=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src=ENGINE_KEY;script.onload=()=>{script.remove();resolve();};script.onerror=()=>{script.remove();enginePromise=undefined;reject(Error('LOCAL_ENGINE_UNAVAILABLE'));};document.head.append(script);});
  await enginePromise;
}
export async function loadLocalModel(){
  if(!await localModelInstalled())throw Error('LOCAL_MODEL_NOT_INSTALLED');
  if(!navigator.serviceWorker?.controller)throw Error('LOCAL_MODEL_RELOAD_REQUIRED');
  if(!modelPromise){const at=generation;modelPromise=(async()=>{await engine();const response=await(await caches.open(CACHE)).match(MODEL_KEY);if(!response||at!==generation)throw Error('LOCAL_MODEL_NOT_INSTALLED');const url=URL.createObjectURL(await response.blob());if(at!==generation){URL.revokeObjectURL(url);throw Error('LOCAL_MODEL_NOT_INSTALLED');}modelUrl=url;const model=new(window as any).Vosk.Model(url,-1);loadedModel=model;await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('LOCAL_MODEL_LOAD_TIMEOUT')),45000);const done=(ok:boolean)=>{clearTimeout(timer);ok?resolve():reject(Error('LOCAL_MODEL_LOAD_FAILED'));};model.on('load',(m:any)=>done(Boolean(m.result)));model.on('error',()=>done(false));});if(at!==generation)throw Error('LOCAL_MODEL_NOT_INSTALLED');return model;})().catch(error=>{if(at===generation){terminateModel();modelPromise=undefined;if(modelUrl)URL.revokeObjectURL(modelUrl);modelUrl='';}throw error;});}
  return modelPromise;
}
export async function removeLocalModel(){
  generation++;terminateModel();modelPromise=undefined;enginePromise=undefined;
  if(modelUrl)URL.revokeObjectURL(modelUrl);modelUrl='';lastMetric=undefined;
  await caches.delete(CACHE);
  await new Promise<void>((resolve,reject)=>{const request=indexedDB.deleteDatabase(DATABASE);request.onsuccess=()=>resolve();request.onerror=()=>reject(Error('LOCAL_MODEL_DELETE_FAILED'));request.onblocked=()=>reject(Error('LOCAL_MODEL_OPEN_IN_ANOTHER_TAB'));});
}
export const localVoiceMetric=()=>lastMetric?{...lastMetric}:null;
/** Audio exists only in microphone buffers and the local recognition worker. */
export function localModelSpeech(onFinal:(text:string,confidence?:number)=>void,onState:(active:boolean,message:string)=>void){
  let active=false,stopping=false,revision=0,finalTimer:ReturnType<typeof setTimeout>|undefined,stream:MediaStream|undefined,audio:AudioContext|undefined,source:MediaStreamAudioSourceNode|undefined,node:ScriptProcessorNode|undefined,recognizer:any,parts:string[]=[],scores:number[]=[],started=0,audioSeconds=0,modelLoadMs=0,heapBefore:number|null=null,batteryBefore:number|null=null;
  const release=()=>{source?.disconnect();node?.disconnect();if(node)node.onaudioprocess=null;stream?.getTracks().forEach(t=>t.stop());void audio?.close();};
  const finish=async()=>{if(!stopping)return;stopping=false;clearTimeout(finalTimer);recognizer?.remove();recognizer=undefined;const at=revision,elapsedMs=performance.now()-started,after=await battery();if(at!==revision)return;lastMetric={modelLoadMs,audioSeconds,elapsedMs,realTimeFactor:audioSeconds?elapsedMs/1000/audioSeconds:null,heapBefore,heapAfter:heap(),batteryBefore,batteryAfter:after,physicalAcceptance:'NOT_ACCEPTED'};const text=parts.join(' ').trim();if(text)onFinal(text,scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:undefined);onState(false,text?'Transcription locale prête · relisez le montant.':'Aucune transcription locale · utilisez le clavier ou recommencez.');};
  const start=async()=>{if(active||stopping)return;const at=++revision;active=true;parts=[];scores=[];audioSeconds=0;heapBefore=heap();batteryBefore=await battery();if(at!==revision||!active)return;onState(true,'Préparation du modèle français sur cet appareil…');const loadStarted=performance.now();try{
    const model=await loadLocalModel();modelLoadMs=performance.now()-loadStarted;if(at!==revision||!active)return;
    const captured=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});if(at!==revision||!active){captured.getTracks().forEach(t=>t.stop());return;}stream=captured;audio=new AudioContext();await audio.resume();if(at!==revision||!active){release();return;}
    recognizer=new model.KaldiRecognizer(audio.sampleRate);recognizer.setWords(true);recognizer.on('result',(message:any)=>{const result=message.result??{},text=String(result.text??'').trim();if(text)parts.push(text);for(const word of result.result??[])if(Number.isFinite(word.conf))scores.push(word.conf);if(stopping&&message.final===true)void finish();});
    source=audio.createMediaStreamSource(stream);node=audio.createScriptProcessor(4096,1,1);node.onaudioprocess=event=>{if(active){audioSeconds+=event.inputBuffer.duration;recognizer.acceptWaveform(event.inputBuffer);}};source.connect(node);node.connect(audio.destination);started=performance.now();onState(true,'Écoute locale en français · arrêtez puis relisez.');
  }catch(error){if(at!==revision)return;release();active=false;onState(false,'Dictée locale indisponible · '+String(error instanceof Error?error.message:error));}};
  const stop=()=>{revision++;if(!active)return;active=false;release();if(!recognizer){onState(false,'Préparation locale arrêtée.');return;}stopping=true;recognizer.retrieveFinalResult();finalTimer=setTimeout(()=>{if(!stopping)return;stopping=false;recognizer?.remove();recognizer=undefined;onState(false,'La transcription locale n’a pas répondu. Aucun montant n’a été reporté.');},10000);};
  return{start:()=>void start(),stop,toggle:()=>active?stop():void start()};
}
