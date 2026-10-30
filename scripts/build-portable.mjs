import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

// A zero-dependency Node 24 build. This compiles TypeScript, but does not replace
// the separately required TypeScript typecheck in the release qualification.
const root=process.cwd();
const output=path.resolve(root,'.build');
if(path.dirname(output)!==root || path.basename(output)!=='.build') throw Error('UNSAFE_BUILD_PATH');
await rm(output,{recursive:true,force:true});
async function compile(dir){
 for(const e of await readdir(path.join(root,dir),{withFileTypes:true})){
  const relative=path.join(dir,e.name);
   if(e.isDirectory()&&relative!==path.join('apps','web','vendor')) await compile(relative);
  else if(e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')){
   const source=await readFile(path.join(root,relative),'utf8');
   const result=stripTypeScriptTypes(source,{mode:'transform',sourceUrl:relative});
   const target=path.join(output,relative.replace(/\.ts$/,'.js'));
   await mkdir(path.dirname(target),{recursive:true});await writeFile(target,result);
  }
  else if(e.name.endsWith('.js') && dir.startsWith(path.join('apps','web','src'))){
   const target=path.join(output,relative);await mkdir(path.dirname(target),{recursive:true});await cp(path.join(root,relative),target);
  }
 }
}
for(const dir of ['apps','packages','workers'])await compile(dir);
await import('./prepare-local-document-engines.mjs');
await import('./prepare-local-voice.mjs');
for(const f of ['index.html','external-ad.html','public-notebook.html','styles.css','canopee.css','manifest.webmanifest','sw.js']){
 await cp(path.join(root,'apps/web',f),path.join(output,'apps/web',f));
 await cp(path.join(root,'apps/web',f),path.join(output,f));
}
await cp(path.join(output,'apps/web/src'),path.join(output,'src'),{recursive:true});
await cp(path.join(root,'apps/web/vendor/documents'),path.join(output,'vendor/documents'),{recursive:true});
await cp(path.join(root,'apps/web/vendor/voice'),path.join(output,'vendor/voice'),{recursive:true});
console.log('Portable build OK — Node type transformation; TypeScript typecheck remains a separate check.');

await import('./pwa-shell-closure.mjs');
await import('./public-assets.mjs');
