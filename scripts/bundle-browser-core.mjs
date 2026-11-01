const esbuild=await import('esbuild').catch(()=>null);
import {readFile,writeFile,cp} from 'node:fs/promises';
// No code splitting: preserves deferred controller order and stable offline URLs.
const output='.build/apps/web/src/boot-core.js';
if(esbuild){
const result=await esbuild.build({entryPoints:['apps/web/src/boot-core.js'],outfile:output,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,keepNames:true,metafile:true,legalComments:'eof',logLevel:'warning'});
await cp(output,'.build/src/boot-core.js');
let before=0;for(const name of Object.keys(result.metafile.inputs)){const compiled='.build/'+name.replace(/\.ts$/,'.js');before+=compiled===output?0:(await readFile(compiled)).length;}const after=(await readFile(output)).length;
const receipt={schema:1,owner:'ConnectedApplication',strategy:'STATIC_CORE_BUNDLE_NO_SPLITTING',inputs:Object.keys(result.metafile.inputs).length,inputBytes:before,outputBytes:after,savedBytes:before-after,portableBuildRequiresLockedDependencies:false};
await writeFile('.build/eco-bundle-report.json',JSON.stringify(receipt,null,2)+'\n');
console.log('Browser core:',receipt.inputs,'static modules,',before,'→',after,'bytes; deferred UI boundaries preserved.');
}else{console.log('Portable browser core: original ESM graph retained; optimized release requires locked esbuild.');await writeFile('.build/eco-bundle-report.json',JSON.stringify({strategy:'PORTABLE_ESM_FALLBACK',optimized:false})+'\n');}
