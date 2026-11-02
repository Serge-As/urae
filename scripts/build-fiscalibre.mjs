import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {gunzipSync} from 'node:zlib';
// Projection privée montée dans le Worker Eco ; aucune donnée D1/session n'est copiée.
const source=await readFile('apps/fiscalibre/index.html');const embedded=await readFile('workers/api/src/fiscalibre-document.ts','utf8');const match=embedded.match(/FISCALIBRE_DOCUMENT_GZIP\s*=\s*'([^']+)'/);if(!match||!gunzipSync(Buffer.from(match[1],'base64')).equals(source))throw Error('FISCALIBRE_PRIVATE_DOCUMENT_STALE');
const out='.build/fiscalibre';await mkdir(out,{recursive:true});const assets={};
for(const name of ['index.html','sources.json']){const bytes=await readFile('apps/fiscalibre/'+name);await copyFile('apps/fiscalibre/'+name,out+'/'+name);assets['/'+name]=createHash('sha256').update(bytes).digest('hex');}
await writeFile(out+'/asset-manifest.json',JSON.stringify({version:'2.6.0-audit-20261102',sourceSha:process.env.GITHUB_SHA||null,assets},null,2));
console.log('Fiscalibre private Worker document verified; no DGI/CNPS submission enabled.');
