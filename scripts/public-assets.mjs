import {cp,mkdir} from 'node:fs/promises';
import path from 'node:path';
const base=path.resolve('.build'),publicRoot=path.join(base,'public');
await mkdir(publicRoot,{recursive:true});
for(const name of ['apps','packages','src','index.html','styles.css','manifest.webmanifest','sw.js']){
 await cp(path.join(base,name),path.join(publicRoot,name),{recursive:true,filter:source=>{
  const relative=path.relative(base,source).replaceAll('\\','/');
  return !relative.startsWith('packages/auth');
 }});
}

await cp('apps/web/_headers',path.join(publicRoot,'_headers'));
