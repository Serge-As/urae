// Build-time PWA dependency closure. No runtime network crawl or extra D1 requests.
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';

const build=path.resolve('.build');
const swSource=await readFile('apps/web/sw.js','utf8');
const sourceBlock=swSource.match(/const ESSENTIAL_SHELL = \[([\s\S]*?)\];\s*const OPTIONAL_SHELL = \[([\s\S]*?)\];/);
if(!sourceBlock)throw Error('PWA_SHELL_LIST_NOT_FOUND');
const declared=[...sourceBlock[1].matchAll(/'([^']+)'/g),...sourceBlock[2].matchAll(/'([^']+)'/g)].map(match=>match[1]);
const originalPaths=new Set(declared.map(v=>new URL(v,'https://eco.invalid').pathname));
const found=new Set(),generated=new Set(),assets=new Map();
const localUrl=(value,owner)=> {
  if(/^(?:data:|blob:|https?:|\/\/|#)/i.test(value))return null;
  const full=new URL(value,'https://eco.invalid'+owner);
  return full.origin==='https://eco.invalid'?full.pathname+full.search:null;
};
const diskUrl=url=>{
  const pathname=new URL(url,'https://eco.invalid').pathname;
  if(pathname==='/')return path.join(build,'index.html');
  if(!pathname.startsWith('/'))throw Error('PWA_BAD_PATH:'+url);
  return path.join(build,pathname.slice(1));
};
const scan=async(url,from)=>{
  const pathname=new URL(url,'https://eco.invalid').pathname;
  if(found.has(pathname))return;
  found.add(pathname);
  let source;
  try { source=await readFile(diskUrl(url)); }
  catch(e){throw Error('PWA_IMPORT_MISSING:'+pathname+' FROM '+from+': '+String(e?.code??e));}
  assets.set(pathname,{bytes:source.length,sha256:createHash('sha256').update(source).digest('hex')});
  if(!originalPaths.has(pathname))generated.add(pathname);
  if(/\.m?js$/i.test(pathname)){
    const file=ts.createSourceFile(pathname,source.toString('utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
    const refs=[];
    const visit=node=>{
      if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))refs.push(node.moduleSpecifier.text);
      if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&node.arguments.length===1&&ts.isStringLiteral(node.arguments[0]))refs.push(node.arguments[0].text);
      ts.forEachChild(node,visit);
    };
    visit(file);
    for(const spec of refs){
      const dep=localUrl(spec,pathname);
      if(dep)await scan(dep,pathname);
      else if(!/^(?:https?:|data:|blob:|\/\/)/i.test(spec))throw Error('PWA_UNRESOLVED_IMPORT:'+spec+' FROM '+pathname);
    }
  }
  if(/\.css$/i.test(pathname)){
    const css=source.toString('utf8');
    for(const match of css.matchAll(/url\(\s*['"]?([^)'"]+)/g)){
      const dep=localUrl(match[1].trim(),pathname);
      if(dep)await scan(dep,pathname);
    }
  }
  if(/\.html$/i.test(pathname)){
    const html=source.toString('utf8');
    for(const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi)){
      const dep=localUrl(match[1],pathname);
      if(dep&&/\.(?:m?js|css|svg|png|webp|jpg|jpeg|ico|webmanifest)(?:\?|$)/i.test(dep))await scan(dep,pathname);
    }
  }
};
for(const initial of declared)await scan(initial,'SERVICE_WORKER');
const manifest={
  schemaVersion:1,
  shellCache:swSource.match(/const CACHE = '([^']+)'/)?.[1]??null,
  initialShell:declared,
  transitiveAssets:[...generated].sort(),
  assets:Object.fromEntries([...assets].sort(([a],[b])=>a.localeCompare(b)))
};
await writeFile(path.join(build,'eco-shell-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const marker='const GENERATED_IMPORT_CLOSURE = [];';
if(!swSource.includes(marker))throw Error('PWA_SHELL_INJECTION_ANCHOR_NOT_FOUND');
const builtSw=swSource.replace(marker,'const GENERATED_IMPORT_CLOSURE = '+JSON.stringify(manifest.transitiveAssets)+';');
for(const dest of ['sw.js','apps/web/sw.js'])await writeFile(path.join(build,dest),builtSw);
console.log('PWA dependency closure complete:',declared.length,'initial assets,',generated.size,'transitive assets; no missing local import.');
