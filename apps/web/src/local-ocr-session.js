// Own the worker before engine initialization: failed language loading must not
// leave the UI, or an inaccessible Tesseract child worker, running indefinitely.
export function createLocalOCRSession(onProgress=()=>{}) {
 const host=new Worker(new URL('./local-document-ocr-worker.js',import.meta.url),{type:'module'});
 let pending=null,stopped=false,sequence=0;
 const clear=job=>{clearTimeout(job.deadline);clearTimeout(job.idle);};
 function stop(code='DOCUMENT_PREPARATION_CANCELLED') {
  if(stopped)return;stopped=true;host.terminate();
  if(pending){const job=pending;pending=null;clear(job);job.reject(Error(code));}
 }
 function activity(job){clearTimeout(job.idle);job.idle=setTimeout(()=>stop('DOCUMENT_OCR_TIMEOUT'),60000);}
 host.onmessage=event=>{
  const job=pending,message=event.data;if(!job||message?.id!==job.id||stopped)return;
  if(message.type==='PROGRESS'){activity(job);onProgress(String(message.status??''),message.progress);}
  else if(message.type==='RESULT'){pending=null;clear(job);job.resolve(String(message.text??''));}
  else if(message.type==='ERROR')stop('DOCUMENT_OCR_UNAVAILABLE');
 };
 host.onerror=event=>{event.preventDefault();stop('DOCUMENT_OCR_UNAVAILABLE');};
 host.onmessageerror=()=>stop('DOCUMENT_OCR_UNAVAILABLE');
 return {
  recognize(source){
   if(stopped)return Promise.reject(Error('DOCUMENT_PREPARATION_CANCELLED'));
   if(pending)return Promise.reject(Error('DOCUMENT_PREPARATION_IN_PROGRESS'));
   return new Promise((resolve,reject)=>{
    const job={id:++sequence,resolve,reject,deadline:setTimeout(()=>stop('DOCUMENT_OCR_TIMEOUT'),180000),idle:null};pending=job;activity(job);
    try{host.postMessage({id:job.id,source});}catch{stop('DOCUMENT_OCR_UNAVAILABLE');}
   });
  },
  terminate:stop
 };
}
