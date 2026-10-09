import {execFileSync,spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from 'node:net';
const require=createRequire(resolve('package.json')),expected='a7c333699dad0d70cf0de8e2f8a841a00396d0d7';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
const args=process.argv.slice(2);
if(args.length>1||args.some(value=>!value.startsWith('--output-root=')))throw Error('Argument pris en charge : --output-root=<dossier>.');
const outputRoot=args[0]?resolve(args[0].slice('--output-root='.length)):resolve('outputs');
if(Number(process.versions.node.split('.')[0])<24||require('playwright/package.json').version!=='1.56.1')throw Error('Node >=24 / Playwright 1.56.1 requis');
if(git('rev-parse','HEAD')!==expected||git('diff','--name-only','HEAD'))throw Error('Checkout a7 propre requis');
await new Promise((ok,no)=>{const p=createServer();p.once('error',no);p.listen(4173,'127.0.0.1',()=>p.close(ok));});
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const root=resolve('work','qr-native-'+stamp),output=resolve(outputRoot,'eco-qr-passive-diagnostic-'+stamp);
await mkdir(root,{recursive:true});await mkdir(output,{recursive:true});
const file=await open(resolve(root,'server.log'),'a');
const server=spawn(process.execPath,['scripts/dev-server.mjs'],{env:{...process.env,PORT:'4173',OPEN_BROWSER:'0',ECO_DATA_FILE:resolve(root,'synthetic.sqlite')},stdio:['ignore',file.fd,file.fd],windowsHide:true});
const report={kind:'PASSIVE_QR_DIAGNOSTIC',qualified:false,sourceSha:expected,treeSha:git('rev-parse','HEAD^{tree}'),node:process.version,playwright:'1.56.1',platform:process.platform,observationWindowMs:30000,startedAt:new Date().toISOString(),status:'IN_PROGRESS',productionDeployed:false,fieldAccepted:false,realMoneyEnabled:false,phases:[]};
let browser;server.on('error',error=>{report.serverError=String(error);});
try{
 let health;for(let i=0;i<45;i++){if(report.serverError)throw Error(report.serverError);if(server.exitCode!==null)throw Error('Le serveur synthetique a ete interrompu.');try{const r=await fetch('http://127.0.0.1:4173/health',{signal:AbortSignal.timeout(1000)});if(r.ok){health=await r.json();break;}}catch{}await new Promise(r=>setTimeout(r,1000));}
 if(!health||health.realMoneyEnabled!==false)throw Error('Serveur SQLite synthetique indisponible');
 const release=JSON.parse(await readFile(resolve('docs/release/CURRENT_RELEASE_CONTRACT.json'),'utf8'));
 for(const name of ['version','buildId','pwaCache','schemaVersion','policyVersion'])if(health[name]!==release.release[name])throw Error('Identite locale inattendue : '+name);
 report.localHealth=health;
 report.sourceBinding={trackedSourceClean:true,ownServerPid:server.pid,syntheticSqlite:resolve(root,'synthetic.sqlite'),healthCommitSha:health.commitSha,authority:'CLEAN_CHECKOUT_AND_OWN_LOCAL_SERVER; NOT_PRODUCTION'};
 browser=await require('playwright').chromium.launch();report.chromium=browser.version();
 for(const mode of ['automatic','bundled-worker']){
  const context=await browser.newContext(),page=await context.newPage(),phase={mode,events:[]};report.phases.push(phase);
  await page.exposeFunction('__qrTrace',event=>{phase.events.push(event);console.log(JSON.stringify({mode,...event}));});
  await page.addInitScript(()=>{
   let seq=0;const start=performance.now();const log=(stage,state,id,detail)=>void window.__qrTrace({stage,state,id,ms:Math.round(performance.now()-start),detail}).catch(()=>{});
   const brief=v=>Array.isArray(v)?(v.every(x=>typeof x==='string')?v:{type:'array',length:v.length}):typeof v?.data==='string'?{data:v.data}:v instanceof HTMLImageElement?{width:v.naturalWidth,height:v.naturalHeight}:v instanceof Worker?{engine:'Worker'}:typeof BarcodeDetector!=='undefined'&&v instanceof BarcodeDetector?{engine:'BarcodeDetector'}:null;
   window.__qrEvent=(stage,detail)=>log(stage,'event',++seq,detail);
   window.__qrEvent('native.availability',{barcodeDetectorAvailable:typeof BarcodeDetector!=='undefined',getSupportedFormatsAvailable:typeof window.BarcodeDetector?.getSupportedFormats==='function'});
   window.__qrObserve=(stage,call)=>{const id=++seq;log(stage,'begin',id);try{const result=call();Promise.resolve(result).then(v=>log(stage,'resolved',id,brief(v)),e=>log(stage,'rejected',id,String(e)));return result;}catch(e){log(stage,'thrown',id,String(e));throw e;}};
   window.__qrWrap=(object,key,name)=>{const original=object?.[key];if(typeof original!=='function')return;try{object[key]=function(...args){return window.__qrObserve(name,()=>Reflect.apply(original,this,args));};if(object[key]===original)log(name,'not_wrappable',++seq);}catch(e){log(name,'not_wrappable',++seq,String(e));}};
   if(typeof BarcodeDetector!=='undefined'){window.__qrWrap(BarcodeDetector,'getSupportedFormats','BarcodeDetector.getSupportedFormats');window.__qrWrap(BarcodeDetector.prototype,'detect','BarcodeDetector.detect');}
  });
  let timer;
  const task=(async()=>{
   await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
   return page.evaluate(async mode=>{
    const qr=await window.__qrObserve('import.qr',()=>import('/packages/relay/src/qr-v10.js'));
    const module=await window.__qrObserve('import.scanner',()=>import('/src/vendor/qr-scanner.min.js')),scanner=module.default;
    for(const name of ['createQrEngine','_loadImage','_drawToCanvas','scanImage'])window.__qrWrap(scanner,name,'QrScanner.'+name);
    const payload='ECOB1:abcdef123456:1:1:0123456789abcdef:SGVsbG9FY29TeXN0ZW0';
    const svg=window.__qrObserve('generate.svg',()=>qr.qrMatrixSvg(qr.qrV10LMatrix(payload),8,4));
    const uri='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);let worker;
    try{
     if(mode==='bundled-worker'){const m=await window.__qrObserve('import.worker',()=>import('/src/vendor/qr-scanner-worker.min.js'));worker=window.__qrObserve('create.worker',()=>m.createWorker());worker.addEventListener('message',e=>window.__qrEvent('Worker.message',{id:e.data?.id,type:e.data?.type,hasData:e.data?.data!==undefined}));worker.addEventListener('error',e=>window.__qrEvent('Worker.error',e.message));}
     const decoded=await scanner.scanImage(uri,{returnDetailedScanResult:true,...(worker?{qrEngine:worker}:{})});
     return{decoded:decoded.data,matchesExpected:decoded.data===payload,barcodeDetectorAvailable:typeof BarcodeDetector!=='undefined'};
    }finally{worker?.terminate();}
   },mode);
  })();
  try{
   const result=await Promise.race([task.then(value=>({state:'RESOLVED',value}),error=>({state:'REJECTED',error:String(error)})),new Promise(r=>{timer=setTimeout(()=>r({state:'PENDING_AT_30000_MS'}),30000);})]);
   Object.assign(phase,result);
   if(result.state==='RESOLVED')phase.exactPayloadMatched=result.value.matchesExpected===true;
  }finally{clearTimeout(timer);await context.close();}
  const states=new Map();for(const e of phase.events)if(e.id)states.set(e.id,e);phase.pendingAtStop=[...states.values()].filter(e=>e.state==='begin').map(e=>e.stage);
  await writeFile(resolve(output,'qr-passive-report.json'),JSON.stringify(report,null,2)+'\n');
 }
 report.status='DIAGNOSTIC_COMPLETED';
 if(report.phases.some(phase=>phase.state!=='RESOLVED'||phase.exactPayloadMatched!==true))process.exitCode=1;
}catch(error){report.status='DIAGNOSTIC_ERROR';report.executionError=String(error);process.exitCode=1;}
finally{try{await browser?.close();}catch(error){report.browserCleanupError=String(error);}if(server.exitCode===null)server.kill();try{await file.close();}catch(error){report.serverLogCleanupError=String(error);}report.completedAt=new Date().toISOString();const path=resolve(output,'qr-passive-report.json');await writeFile(path,JSON.stringify(report,null,2)+'\n');console.log('ECO_QR_PASSIVE_SUMMARY '+JSON.stringify({status:report.status,sourceSha:report.sourceSha,qualified:false,phases:report.phases.map(({mode,state,value,error,exactPayloadMatched,pendingAtStop})=>({mode,state,value,error,exactPayloadMatched,pendingAtStop})),executionError:report.executionError,reportPath:path}));console.log('Rapport sauvegarde : '+path);}
