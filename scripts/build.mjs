import { rm, mkdir, cp, access, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const RELEASE_VERSION='1.5.2.3-financial-entry-offline';
const compiler=path.resolve('node_modules/typescript/bin/tsc');
try{await access(compiler);}catch{await import('./build-portable.mjs');process.exit(0);}
const output=path.resolve('.build');
if(path.dirname(output)!==process.cwd() || path.basename(output)!=='.build')throw Error('UNSAFE_BUILD_PATH');
await rm(output, { recursive: true, force: true });
const result = spawnSync(process.execPath, [compiler,'-p', 'tsconfig.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
await mkdir('.build/apps/web', { recursive: true });
for (const file of ['index.html','styles.css','manifest.webmanifest']) {
  await cp(path.join('apps/web', file), path.join('.build/apps/web', file));
  await cp(path.join('apps/web', file), path.join('.build', file));
}
await cp('.build/apps/web/src', '.build/src', { recursive: true });
await cp('apps/web/sw.js', '.build/apps/web/sw.js');
await cp('apps/web/sw.js', '.build/sw.js');

// 1.3.4: the historical page contains two generations of Tontine forms with
// duplicate ids. field-hardening removes the obsolete Réunion panel before
// main.js mounts, then this scoped compatibility guard prevents completion-ui
// from binding its older Tontine controller to the remaining dedicated forms.
// TontineManagerUI is therefore the single operational owner.
for (const target of ['.build/apps/web/src/completion-ui.js','.build/src/completion-ui.js']) {
  let source=await readFile(target,'utf8');
  const anchor=/const\s+byId\s*=\s*id\s*=>\s*document\.getElementById\(id\)\s*;/;
  const replacement="const byId=id=>{const tontineOperational=/^(?:tontine(?:Cycle|Share|Serve|Rounds|Pots|PotAmount|Schedule|Completion)|suggestTontine|applyTontine|readiness)/.test(id);if(tontineOperational&&!document.getElementById('tontineCompletionPanel'))return null;return document.getElementById(id);};";
  if(!anchor.test(source))throw Error('COMPLETION_TONTINE_GUARD_ANCHOR_NOT_FOUND');
  source=source.replace(anchor,replacement);
  await writeFile(target,source,'utf8');
}

// Field hardening and the voice/two-sheet/document compatibility layer bind
// before main.js so stale click semantics cannot win the event race.
for (const target of ['.build/index.html','.build/apps/web/index.html']) {
  let html=await readFile(target,'utf8');
  const main='<script type="module" src="/src/main.js?v=1523"></script>';
  if(!html.includes(main))throw Error('MAIN_SCRIPT_ANCHOR_NOT_FOUND');
  html=html.replace(main,'<script type="module" src="/src/field-hardening.js?v=1523"></script>\n  <script type="module" src="/src/voice-entry-bootstrap.js?v=1523"></script>\n  '+main);
  html=html
    .replaceAll('Eco-System — 1.3.3 Fairness Lab · AdOps · Doctor','Eco-System — 1.3.4 Voice · Two-Sheet · Documents')
    .replaceAll('ECO-SYSTEM · 1.3.3','ECO-SYSTEM · 1.3.4')
    .replaceAll('1.3.3 FAIRNESS · ADOPS · DOCTOR','1.3.4 VOICE · TWO-SHEET · DOCUMENTS');
  await writeFile(target,html,'utf8');
}

// The service worker must cache every module that is statically required by the
// HTML entry points. Keep this generated from the compiled graph instead of
// maintaining a second hand-written list that can silently drift.
const startupMarker='const BUILD_STARTUP_SHELL = [];';
const staticModuleSpecifiers=source=>{
  const found=[];
  for(const match of source.matchAll(/^\s*import\s+(?:[^'"\n]*?\sfrom\s*)?['"]([^'"]+)['"]/gm))found.push(match[1]);
  for(const match of source.matchAll(/^\s*export\s+[^'"\n]*?\sfrom\s*['"]([^'"]+)['"]/gm))found.push(match[1]);
  return found;
};
const resolveModuleUrl=(specifier,parentUrl)=>{
  if(!specifier.startsWith('.')&&!specifier.startsWith('/'))return null;
  const resolved=new URL(specifier,'https://eco.invalid'+parentUrl);
  return resolved.pathname+resolved.search;
};
const compiledPathForUrl=url=>path.join(output,new URL(url,'https://eco.invalid').pathname.replace(/^\//,''));
const startupShell=new Set();
const collectStartupModule=async url=>{
  if(startupShell.has(url))return;
  const filePath=compiledPathForUrl(url);
  let source;
  try{source=await readFile(filePath,'utf8');}
  catch{throw Error('STARTUP_MODULE_NOT_BUILT:'+url);}
  startupShell.add(url);
  for(const specifier of staticModuleSpecifiers(source)){
    const dependency=resolveModuleUrl(specifier,url);
    if(dependency)await collectStartupModule(dependency);
  }
};
const builtIndex=await readFile('.build/index.html','utf8');
const moduleEntries=[...builtIndex.matchAll(/<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map(match=>match[1]);
for(const entry of moduleEntries)await collectStartupModule(entry);
const startupShellList=[...startupShell].sort();
for(const target of ['.build/sw.js','.build/apps/web/sw.js']){
  let source=await readFile(target,'utf8');
  if(!source.includes(startupMarker))throw Error('SERVICE_WORKER_STARTUP_MARKER_NOT_FOUND');
  source=source.replace(startupMarker,'const BUILD_STARTUP_SHELL = '+JSON.stringify(startupShellList,null,2)+';');
  await writeFile(target,source,'utf8');
}
console.log('Service Worker startup graph: '+startupShellList.length+' static modules cached as required.');

// Keep the runtime identity truthful without rewriting the large historical
// source file solely for a release label.
for (const target of ['.build/workers/api/src/index.js']) {
  let source=await readFile(target,'utf8');
  source=source.replaceAll('1.3.3-fairness-adops-doctor-launch',RELEASE_VERSION);
  await writeFile(target,source,'utf8');
}
for (const target of ['.build/apps/web/src/main.js','.build/src/main.js']) {
  let source=await readFile(target,'utf8');
  source=source.replace("const CAHIER_VERSION = '1.3.2-savings-control-forum-live';",`const CAHIER_VERSION = '${RELEASE_VERSION}';`);
  await writeFile(target,source,'utf8');
}
console.log(`Build OK: .build/ (Eco-System ${RELEASE_VERSION}; 1.5.1 canonical financial tables + starter kit + Business Studio`);

await import('./public-assets.mjs');
