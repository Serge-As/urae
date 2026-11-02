import {FISCALIBRE_DOCUMENT_GZIP,FISCALIBRE_DOCUMENT_SHA256,FISCALIBRE_PASSWORD_SALT,FISCALIBRE_PASSWORD_VERIFIER} from './fiscalibre-document.js';

export interface FiscalibreHostEnv {AUTH_LIVE_SIGNING_SECRET?:string;RELEASE_COMMIT_SHA?:string;FISCALIBRE_TEST_VERIFIER?:{salt:string;verifier:string}}
const te=new TextEncoder(),COOKIE='fiscalibre_test_session',TTL=8*3600;
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
const equal=(a:string,b:string)=>{let x=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)x|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return x===0;};
const attempts=new Map<string,{count:number;until:number}>();
export const fiscalibrePath=(path:string)=>{try{const p=decodeURIComponent(path);return p==='/fiscalibre'||p.startsWith('/fiscalibre/');}catch{return false;}};
const headers=()=>new Headers({'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','content-security-policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"});
const html=(body:string,status=200)=>{const h=headers();h.set('content-type','text/html; charset=utf-8');return new Response(body,{status,headers:h});};
const loginPage=(message='')=>`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fiscalibre · Accès de test</title><style>body{font:17px system-ui;background:#f3f5ef;color:#183b33;margin:0;padding:24px}main{max-width:440px;margin:8vh auto;background:white;padding:28px;border-radius:16px}input,button{box-sizing:border-box;width:100%;padding:13px;margin:12px 0;font:inherit}button{background:#183b33;color:white;border:0;border-radius:7px}a{color:#183b33}.error{color:#a12222}</style><main><h1>Fiscalibre</h1><p>Comptabilité et fiscalité du Cameroun</p><p>Accès privé de test. Aucun compte Eco nécessaire.</p><form method="post" action="/fiscalibre/login"><label for="fiscalibrePassword">Mot de passe</label><input id="fiscalibrePassword" name="password" type="password" required maxlength="128" autocomplete="current-password"><button type="submit">Ouvrir Fiscalibre</button></form><p class="error" role="alert">${message}</p><a href="/">← Entrée d’Eco</a></main></html>`;
async function signature(secret:string,payload:string){const key=await crypto.subtle.importKey('raw',te.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,te.encode('FISCALIBRE_ACCESS_V1:'+payload)));}
async function authorized(request:Request,secret:string){const cookie=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';const m=cookie.match(/^(\d{10})\.([a-f0-9-]{36})\.([a-f0-9]{64})$/);if(!m)return false;const now=Math.floor(Date.now()/1000),expires=Number(m[1]);if(expires<=now||expires>now+TTL)return false;return equal(m[3],await signature(secret,m[1]+'.'+m[2]));}
async function readBody(request:Request){const reader=request.body?.getReader();if(!reader)return '';let bytes=0;const parts:Uint8Array[]=[];while(true){const r=await reader.read();if(r.done)break;bytes+=r.value.length;if(bytes>1024){await reader.cancel();throw Error('BODY_TOO_LARGE');}parts.push(r.value);}const out=new Uint8Array(bytes);let i=0;for(const p of parts){out.set(p,i);i+=p.length;}return new TextDecoder().decode(out);}
export async function fiscalibreFetch(request:Request,env:FiscalibreHostEnv={}){
 const url=new URL(request.url),path=decodeURIComponent(url.pathname);
 if(path==='/fiscalibre')return new Response(null,{status:308,headers:{location:'/fiscalibre/','cache-control':'no-store'}});
 if(path==='/fiscalibre/health'&&request.method==='GET')return Response.json({app:'Fiscalibre',version:'2.6.0-audit-20261102',commitSha:env.RELEASE_COMMIT_SHA||'LOCAL',documentSha256:FISCALIBRE_DOCUMENT_SHA256,passwordRequired:true,submissionEnabled:false,officialApiConfigured:false,storage:'browser-local',realMoneyEnabled:false},{headers:headers()});
 if(!['/fiscalibre/','/fiscalibre/index.html','/fiscalibre/login','/fiscalibre/logout'].includes(path))return html('<h1>Fiscalibre</h1><p>Ressource indisponible.</p>',404);
 const secret=env.AUTH_LIVE_SIGNING_SECRET;if(!secret||secret.length<20)return html(loginPage('Accès temporairement indisponible : configuration serveur requise.'),503);
 if(request.method==='POST'){
  if(request.headers.get('origin')!==url.origin)return html(loginPage('Requête refusée. Revenez au formulaire.'),403);
  if(path==='/fiscalibre/logout'){const h=headers();h.set('location','/fiscalibre/');h.set('set-cookie',`${COOKIE}=; Path=/fiscalibre/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);return new Response(null,{status:303,headers:h});}
  if(path!=='/fiscalibre/login')return html(loginPage(),405);
  const now=Date.now(),ip=request.headers.get('cf-connecting-ip')||'local',a=attempts.get(ip);if(a&&a.until>now&&a.count>=8)return html(loginPage('Trop de tentatives. Réessayez dans quelques minutes.'),429);
  if(attempts.size>10000)for(const [k,v] of attempts)if(v.until<=now)attempts.delete(k);
  let raw:string;try{raw=await readBody(request);}catch{return html(loginPage('Requête trop volumineuse.'),413);}
  const password=new URLSearchParams(raw).get('password')||'';if(!password||password.length>128)return html(loginPage('Mot de passe incorrect.'),401);
  const config=env.FISCALIBRE_TEST_VERIFIER||{salt:FISCALIBRE_PASSWORD_SALT,verifier:FISCALIBRE_PASSWORD_VERIFIER};
  const material=await crypto.subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveBits']);
  const derived=hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:te.encode(config.salt),iterations:100000},material,256));
  if(!equal(derived,config.verifier)){attempts.set(ip,{count:a&&a.until>now?a.count+1:1,until:a&&a.until>now?a.until:now+15*60000});return html(loginPage('Mot de passe incorrect.'),401);}
  attempts.delete(ip);const payload=(Math.floor(now/1000)+TTL)+'.'+crypto.randomUUID(),cookie=payload+'.'+await signature(secret,payload);const h=headers();h.set('location','/fiscalibre/');h.set('set-cookie',`${COOKIE}=${cookie}; Path=/fiscalibre/; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL}`);return new Response(null,{status:303,headers:h});
 }
 if(!['GET','HEAD'].includes(request.method))return html(loginPage(),405);
 if(!await authorized(request,secret))return html(loginPage(),401);
 const data=Uint8Array.from(atob(FISCALIBRE_DOCUMENT_GZIP),c=>c.charCodeAt(0));const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));const h=headers();h.set('content-type','text/html; charset=utf-8');return new Response(request.method==='HEAD'?null:stream,{headers:h});
}
