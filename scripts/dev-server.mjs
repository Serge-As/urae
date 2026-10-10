import http from 'node:http';
import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {randomBytes} from 'node:crypto';
import worker from '../.build/workers/api/src/index.js';
import { SQLiteD1 } from './sqlite-d1.mjs';
import {createLocalLiveNamespace,attachLocalLiveUpgrades} from './local-live-adapter.mjs';

const root = path.resolve('.build');
const dataFile = process.env.ECO_DATA_FILE ?? '.data/eco-system.sqlite';
const db = new SQLiteD1(dataFile);db.migrate();
// Ephemeral signing key: test/development only, generated per process and never persisted.
const localSignedClockKey=randomBytes(32).toString('base64url');
const liveNamespace=createLocalLiveNamespace();
const handleRequest = request => worker.fetch(request,{DB:db,AUTH_LIVE_SIGNING_SECRET:localSignedClockKey,GROUP_LIVE_HUB:liveNamespace,PREMIUM_LIVE_LEDGER:'true'});
const mime = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.map':'application/json'
};
const securityHeaders = {
  'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY',
  'permissions-policy':'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=()',
  'content-security-policy':"default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};

try { await access(path.join(root, 'apps/web/index.html')); }
catch {
  console.error('\n[ERREUR] La version compilée .build est absente. / Prebuilt .build is missing.');
  console.error('Utilise le ZIP Runnable, ou exécute "npm install" puis "npm run build" dans les sources.');
  process.exit(1);
}

let currentPort = 4173;
const requestHandler = async (req,res) => {
  try {
    if(![`127.0.0.1:${currentPort}`,`localhost:${currentPort}`].includes(req.headers.host??'')){res.writeHead(403);res.end('Host not allowed');return;}
    if (req.url?.startsWith('/api/') || req.url === '/health') {
      const chunks=[];let size=0; for await (const c of req) {size+=c.length;if(size>131072){res.writeHead(413);res.end('Request too large');return;}chunks.push(c);}
      const body=Buffer.concat(chunks); const headers=new Headers();
      for(const [k,v] of Object.entries(req.headers)) if(v) headers.set(k,Array.isArray(v)?v.join(','):v);
      headers.set('cf-connecting-ip',req.socket.remoteAddress??'local');
      const host=req.headers.host??`localhost:${currentPort}`;
      const request=new Request(`http://${host}${req.url}`,{method:req.method,headers,body:['GET','HEAD'].includes(req.method??'GET')?undefined:body});
      const response=await handleRequest(request);
      const responseHeaders={...Object.fromEntries(response.headers.entries()),...securityHeaders};
      const sessionCookies=response.headers.getSetCookie();if(sessionCookies.length)responseHeaders['set-cookie']=sessionCookies;
      res.writeHead(response.status,responseHeaders);
      res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    let pathname = new URL(req.url ?? '/', `http://localhost:${currentPort}`).pathname;
    if (pathname === '/') pathname='/index.html';
    if (pathname.endsWith('/')) pathname += 'index.html';
    if(pathname.startsWith('/workers/') || pathname.startsWith('/packages/auth/'))throw new Error('forbidden');
    const file=path.resolve(root,'.'+pathname); const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('forbidden');
    const s=await stat(file); if(!s.isFile()) throw new Error('not file');
    const data=await readFile(file);
    const cacheControl = pathname === '/sw.js' ? 'no-cache' : 'no-store';
    res.writeHead(200,{'content-type':mime[path.extname(file)]??'application/octet-stream','cache-control':cacheControl,...securityHeaders}); res.end(data);
  } catch { res.writeHead(404,{'content-type':'text/plain; charset=utf-8',...securityHeaders}); res.end('Not found'); }
};

const tryListen = port => new Promise((resolve,reject) => {
  const server=http.createServer(requestHandler);
  attachLocalLiveUpgrades(server,handleRequest,host=>[`127.0.0.1:${port}`,`localhost:${port}`].includes(host??''));
  const onError=error=>{server.removeListener('listening',onListening);reject({error,server});};
  const onListening=()=>{server.removeListener('error',onError);resolve(server);};
  server.once('error',onError); server.once('listening',onListening); server.listen(port,'127.0.0.1');
});

const preferred = Number(process.env.PORT ?? 4173);
let server;
for(let port=preferred;port<preferred+20;port++){
  try { server=await tryListen(port); currentPort=port; break; }
  catch (result) {
    try { result.server.close(); } catch {}
    if(result.error?.code!=='EADDRINUSE') throw result.error;
    if(port===preferred) console.log(`Port ${preferred} déjà utilisé / already in use — recherche automatique d'un autre port…`);
  }
}
if(!server){console.error('Aucun port libre trouvé entre '+preferred+' et '+(preferred+19));process.exit(1);}

const url=`http://127.0.0.1:${currentPort}/`;
console.log('\n============================================================');
console.log(' ECO-SYSTEM — CAHIER APP 1.1.2 — QUALIFICATION LOCALE');
console.log('============================================================');
console.log(` App : ${url}`);
console.log(` API : http://127.0.0.1:${currentPort}/health`);
console.log(` Data: ${path.resolve(dataFile)}`);
console.log(' Ctrl+C pour arrêter / to stop.');
console.log('============================================================\n');

if(process.env.OPEN_BROWSER==='1'){
  const cmd=process.platform==='win32'?'cmd':process.platform==='darwin'?'open':'xdg-open';
  const args=process.platform==='win32'?['/c','start','',url]:[url];
  try { spawn(cmd,args,{detached:true,stdio:'ignore'}).unref(); } catch {}
}
