// This disposable host owns Tesseract and its child worker. The page can stop
// both even when Tesseract's initialization promise never settles.
import Tesseract from '/vendor/documents/tesseract.js/dist/tesseract.esm.min.js';
const root=new URL('/vendor/documents/',self.location.href).href;
let engine=null,busy=false,failed=false,currentId=null;
const send=message=>self.postMessage({id:currentId,...message});
self.onmessage=async event=>{
 if(busy||failed)return;busy=true;currentId=event.data.id;
 try{
  if(!engine)engine=await Tesseract.createWorker('fra+eng',1,{
   workerPath:root+'tesseract.js-core/worker.min.js',corePath:root+'tesseract.js-core/',langPath:root+'languages',workerBlobURL:false,cacheMethod:'none',
   logger:message=>send({type:'PROGRESS',status:String(message.status??''),progress:message.progress}),
   errorHandler:()=>{failed=true;send({type:'ERROR'});}
  });
  if(failed)return;
  const {data}=await engine.recognize(event.data.source);
  send({type:'RESULT',text:String(data.text??'')});
 }catch{failed=true;send({type:'ERROR'});}
 finally{busy=false;}
};
