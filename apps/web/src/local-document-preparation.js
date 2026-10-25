// Optional, same-origin document preparation. Extracted text is untrusted until
// a person compares it with the source; this module has no business write API.
import {createLocalOCRSession} from './local-ocr-session.js';
const root='/vendor/documents/',tr=(fr,en)=>(document.getElementById('topLanguageSelect')?.value??document.getElementById('languageSelect')?.value??document.documentElement.lang)==='en'?en:fr;
export function validateLocalDocuments(files){
 if(!files.length||files.length>10||files.reduce((a,f)=>a+f.size,0)>25*1024*1024)throw Error('DOCUMENT_LOCAL_LIMIT_10_FILES_25_MB');
 for(const f of files)if(f.size<1||f.size>15*1024*1024||!(/\.(pdf|txt|docx|doc|png|jpe?g|webp)$/i.test(f.name)))throw Error('DOCUMENT_LOCAL_FORMAT_OR_SIZE');
 return true;
}
export function installLocalDocumentPreparation(input,parent,getContext=()=>''){
 const box=document.createElement('section');box.className='local-document-preparation full stack';box.dataset.localDocumentPreparation='true';
 const info=document.createElement('p');info.textContent=tr('Extraction locale facultative : texte PDF ou photos, français et anglais. Les moteurs gratuits sont chargés depuis Eco à votre demande. Les images ne sont pas envoyées à un service OCR externe. Word ancien et pages illisibles : transcription manuelle. Relisez toujours les nombres.','Optional local extraction: PDF text or photos, French and English. Free engines load from Eco on demand. Images are not sent to an external OCR service. Old Word and unreadable pages require manual transcription. Always check numbers.');
 const start=document.createElement('button'),cancel=document.createElement('button'),status=document.createElement('p'),previews=document.createElement('div');start.type=cancel.type='button';start.className=cancel.className='secondary';start.textContent=tr('Extraire localement pour préparer la relecture','Extract locally to prepare review');cancel.textContent=tr('Arrêter l’extraction','Stop extraction');cancel.hidden=true;status.setAttribute('role','status');previews.className='local-document-previews';box.append(info,start,cancel,status,previews);parent.append(box);
 let epoch=0,worker=null,workerEpoch=-1,pdfTask=null,pdfEpoch=-1,urls=[],texts=[],busy=false,captured=getContext();
 const alive=token=>token===epoch&&captured===getContext()&&box.isConnected;
 function reset(){epoch++;captured=getContext();void worker?.terminate();worker=null;void pdfTask?.destroy();pdfTask=null;pdfEpoch=-1;urls.forEach(u=>URL.revokeObjectURL(u));urls=[];texts=[];previews.replaceChildren();busy=false;start.disabled=false;cancel.hidden=true;status.textContent='';}
 input.addEventListener('change',reset);cancel.onclick=reset;
 const progress=(token,text)=>{if(alive(token))status.textContent=text;};
 async function ocr(source,token){
  if(!alive(token))throw Error('DOCUMENT_PREPARATION_CANCELLED');
  if(!worker){worker=createLocalOCRSession((status,value)=>progress(token,status+(Number.isFinite(value)?' · '+Math.round(value*100)+'%':'')));workerEpoch=token;}
  const session=worker;
  if(source instanceof HTMLCanvasElement)source=await new Promise((resolve,reject)=>source.toBlob(blob=>blob?resolve(blob):reject(Error('DOCUMENT_IMAGE_SIGNATURE')),'image/png'));
  if(!alive(token))throw Error('DOCUMENT_PREPARATION_CANCELLED');
  return session.recognize(source);
 }
 function preview(source,title){const figure=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent=title;if(source instanceof HTMLCanvasElement)figure.append(source);else{const img=document.createElement('img');img.src=source;img.alt=title;img.loading='lazy';figure.append(img);}figure.append(caption);previews.append(figure);}
 start.onclick=async()=>{
  if(busy||!box.isConnected)return;reset();const token=epoch,files=[...(input.files??[])];busy=true;start.disabled=true;cancel.hidden=false;
  try{validateLocalDocuments(files);let total=0;
   for(const file of files){if(!alive(token))return;progress(token,file.name);let text='',method='MANUAL';const bytes=new Uint8Array(await file.arrayBuffer());if(!alive(token))return;
    if(/\.txt$/i.test(file.name)){text=new TextDecoder().decode(bytes);method='LOCAL_TEXT';}
    else if(/\.pdf$/i.test(file.name)){
     if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('DOCUMENT_PDF_SIGNATURE');
     const url=root+'pdfjs-dist/build/pdf.mjs',pdfjs=await import(url);pdfjs.GlobalWorkerOptions.workerSrc=root+'pdfjs-dist/build/pdf.worker.mjs';if(!alive(token))return;
      const task=pdfjs.getDocument({data:bytes,isEvalSupported:false,enableXfa:false,disableFontFace:true,useWasm:false});pdfTask=task;pdfEpoch=token;const pdf=await task.promise;if(!alive(token))return;if(pdf.numPages>10)throw Error('DOCUMENT_PDF_LIMIT_10_PAGES');
     const pages=[];for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){if(!alive(token))return;const page=await pdf.getPage(pageNo),content=await page.getTextContent();let value=content.items.map(x=>String(x.str??'')+(x.hasEOL?'\n':' ')).join('');
      const base=page.getViewport({scale:1}),scale=Math.min(1.6,Math.sqrt(5000000/(base.width*base.height))),vp=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;if(!alive(token))return;preview(canvas,file.name+' · '+pageNo+'/'+pdf.numPages);
      if(value.trim().length<20){value=await ocr(canvas,token);method='LOCAL_PDF_OCR';}else if(method!=='LOCAL_PDF_OCR')method='LOCAL_PDF_TEXT';pages.push('['+pageNo+']\n'+value);page.cleanup();
      }text=pages.join('\n\n');await pdf.destroy();if(pdfTask===task){pdfTask=null;pdfEpoch=-1;}
    }else if(/\.(png|jpe?g|webp)$/i.test(file.name)){
     const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71,jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255,webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';if(!png&&!jpg&&!webp)throw Error('DOCUMENT_IMAGE_SIGNATURE');
     const image=await createImageBitmap(file);if(image.width*image.height>16000000){image.close();throw Error('DOCUMENT_IMAGE_LIMIT_16_MPIX');}image.close();const url=URL.createObjectURL(file);urls.push(url);preview(url,file.name);text=await ocr(file,token);method='LOCAL_IMAGE_OCR';
    }
    if(!alive(token))return;total+=text.length;if(total>115000)throw Error('DOCUMENT_LOCAL_TEXT_TOO_LARGE');texts.push({name:file.name,size:file.size,text,method});
   }
   progress(token,tr('Préparation locale terminée. Téléversez pour ouvrir la relecture ; aucun texte n’est encore enregistré.','Local preparation complete. Upload to open review; no text has been saved yet.'));
  }catch(error){if(alive(token)){texts=[];const code=String(error?.message??error),message=code==='DOCUMENT_OCR_TIMEOUT'?tr('L’extraction locale ne répond plus. Elle a été arrêtée ; vous pouvez réessayer.','Local extraction stopped responding and was stopped. You can retry.'):code==='DOCUMENT_OCR_UNAVAILABLE'?tr('Le moteur local n’a pas pu charger ou lire cette pièce. Vous pouvez réessayer.','The local engine could not load or read this file. You can retry.'):code;status.textContent=message+tr(' · Vous pouvez encore préparer la transcription manuelle.',' · You can still prepare manual transcription.');}}
    finally{if(alive(token)){busy=false;start.disabled=false;cancel.hidden=true;}if(pdfEpoch===token){const finished=pdfTask;pdfTask=null;pdfEpoch=-1;await finished?.destroy();}if(workerEpoch===token){const finished=worker;worker=null;workerEpoch=-1;await finished?.terminate();}}
 };
 return{reset,getTexts:()=>{if(busy)throw Error('DOCUMENT_PREPARATION_IN_PROGRESS');return captured===getContext()?texts.map(x=>({...x})):[];}};
}
