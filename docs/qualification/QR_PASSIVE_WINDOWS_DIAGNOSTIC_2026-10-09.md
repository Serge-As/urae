# Diagnostic QR passif Windows — source a7 figé

Statut : **préparé, non exécuté, syntaxe Node non contrôlée pour ce nouveau fichier**. L'exécuteur Cloud renvoie `409 environment_offline: Environment is not connected`. Ce blocage n'est pas un échec du test QR.

Le SDK a une attente non bornée sur `BarcodeDetector.getSupportedFormats()`. Le chargement de l'image est également attendu avant le timer existant de 10 secondes. Ces constats de source ne prouvent pas où les 30 secondes Windows sont consommées.

Copier uniquement le bloc ci-dessous dans `work/qr-passive-diagnostic.mjs` du checkout a7 déjà construit, puis lancer depuis sa racine :

```powershell
node --check work/qr-passive-diagnostic.mjs
node work/qr-passive-diagnostic.mjs
```

Le script vérifie HEAD a7, source suivi propre, Node >=24 et Playwright 1.56.1. Le port 4173 doit être libre : il lance le serveur canonique avec une SQLite synthétique neuve sous `work/qr-native-…`, puis arrête ses processus. Les rapports sont dans ce même dossier. Aucun test de la suite 657/8/6 n'est exécuté par ce script.

Deux contextes Chromium frais observent chacun une fenêtre de 30 secondes, depuis la navigation :
- chemin automatique, vrai `scanImage`, présence de BarcodeDetector conservée ;
- vrai Worker livré, même QR/payload/SVG et même SDK, avec l'option `qrEngine` existante.

Les wrappers appellent les méthodes originales avec le même `this`, les mêmes arguments, et retournent leurs valeurs/promesses originales. Ils ne répondent pas à leur place. Aucun réglage du timer SDK ou du délai du test n'est effectué. Une opération encore ouverte à la fin est marquée `PENDING_AT_30000_MS`, jamais PASS. Le Worker doit renvoyer réellement le payload attendu pour obtenir `exactPayloadMatched=true`.

Lecture : `pendingAtStop` et les événements distinguent import, chargement SVG par `_loadImage`, création du moteur, formats natifs, détecteur natif et Worker. Une attribution à `getSupportedFormats` exige sa ligne `begin` sans résolution, un chargement d'image résolu et un décodage Worker réel réussi. Si le chargement SVG ou un import reste ouvert, traiter cette autre attente. Sans ces traces, aucun correctif produit n'est justifié.

Le test QR original reste celui du dépôt. S'il est relancé séparément avec un serveur synthétique contrôlé, sa sélection seule est :

```text
npx playwright test tests/browser/eco-system-webkit-sovereign-offline-1.5.2.9.spec.mjs --browser=chromium --workers=1 --grep "WebKit decodes an Eco QR with the bundled offline decoder and no BarcodeDetector dependency"
```

Aucun `--timeout`, skip ou changement du test. Ce diagnostic est toujours `qualified=false` et ne remplace pas WebKit6.

```javascript
import {execFileSync,spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir,open,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from 'node:net';
const require=createRequire(resolve('package.json')),expected='a7c333699dad0d70cf0de8e2f8a841a00396d0d7';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
if(Number(process.versions.node.split('.')[0])<24||require('playwright/package.json').version!=='1.56.1')throw Error('Node >=24 / Playwright 1.56.1 requis');
if(git('rev-parse','HEAD')!==expected||git('diff','--name-only','HEAD'))throw Error('Checkout a7 propre requis');
await new Promise((ok,no)=>{const p=createServer();p.once('error',no);p.listen(4173,'127.0.0.1',()=>p.close(ok));});
const root=resolve('work','qr-native-'+Date.now());await mkdir(root,{recursive:true});
const file=await open(resolve(root,'server.log'),'a');
const server=spawn(process.execPath,['scripts/dev-server.mjs'],{env:{...process.env,PORT:'4173',OPEN_BROWSER:'0',ECO_DATA_FILE:resolve(root,'synthetic.sqlite')},stdio:['ignore',file.fd,file.fd]});
const report={kind:'PASSIVE_QR_DIAGNOSTIC',qualified:false,sourceSha:expected,treeSha:git('rev-parse','HEAD^{tree}'),node:process.version,playwright:'1.56.1',platform:process.platform,observationWindowMs:30000,phases:[]};
let browser;server.on('error',error=>{report.serverError=String(error);});
try{
 let health;for(let i=0;i<45;i++){if(report.serverError)throw Error(report.serverError);try{const r=await fetch('http://127.0.0.1:4173/health',{signal:AbortSignal.timeout(1000)});if(r.ok){health=await r.json();break;}}catch{}await new Promise(r=>setTimeout(r,1000));}
 if(!health||health.realMoneyEnabled!==false)throw Error('Serveur SQLite synthetique indisponible');
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
 }
}catch(error){report.executionError=String(error);process.exitCode=1;}
finally{await browser?.close();server.kill();await file.close();const path=resolve(root,'qr-passive-report.json');await writeFile(path,JSON.stringify(report,null,2)+'\n');console.log(path);}

```
