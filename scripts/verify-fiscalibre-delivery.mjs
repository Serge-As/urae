import {readFile} from 'node:fs/promises';
const origin=new URL(process.env.ECO_SYSTEM_ROOT||'https://eco-system.sergemimf.workers.dev/').origin;
const root=origin+'/fiscalibre',expected=process.env.GITHUB_SHA;
if(!/^[a-f0-9]{40}$/.test(expected||''))throw Error('Exact source SHA required');
let health;
for(let attempt=0;attempt<12;attempt++){
 const response=await fetch(root+'/health',{cache:'no-store'});
 if(response.ok){const value=await response.json();if(value.commitSha===expected){health=value;break;}}
 await new Promise(resolve=>setTimeout(resolve,2000));
}
if(!health||health.version!=='2.6.0-audit-20261102'||health.sessionMaxAgeSeconds!==3600||health.passwordRequired!==true||health.submissionEnabled!==false||health.officialApiConfigured!==false||health.storage!=='browser-local')throw Error('Fiscalibre mounted health mismatch');
const manifest=JSON.parse(await readFile('.build/fiscalibre/asset-manifest.json','utf8'));
if(manifest.sourceSha!==expected||manifest.assets['/index.html']!==health.documentSha256)throw Error('Fiscalibre private source hash mismatch');
for(const path of ['/','/index.html','/access.js']){
 const response=await fetch(root+path,{cache:'no-store'});
 if(response.status!==401||!response.headers.get('cache-control')?.includes('no-store'))throw Error('Fiscalibre private access gate failed '+path);
 if(path!=='/access.js'&&!(await response.text()).includes('id="fiscalibrePassword"'))throw Error('Password form missing');
}
const incorrect=await fetch(root+'/login',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:'synthetic-invalid-delivery-check'}),redirect:'manual'});
if(incorrect.status!==401||incorrect.headers.has('set-cookie'))throw Error('Incorrect credentials were accepted');
const entry=await fetch(origin+'/',{cache:'no-store'});
if(!entry.ok||!(await entry.text()).includes('id="fiscalibreLink" href="/fiscalibre/"'))throw Error('Eco entry link missing');
console.log(JSON.stringify({fiscalibreVerified:true,sourceSha:expected,documentSha256:health.documentSha256,mountedInEco:true,passwordRequired:true,sessionMaxAgeSeconds:3600,submissionEnabled:false}));
