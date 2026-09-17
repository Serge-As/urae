import { rm, mkdir, cp, access, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

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

// 1.3.4 field hardening must run before main.js. It removes the obsolete
// duplicate operational Tontine panel and installs mobile/voice guards before
// the regular UI modules bind their handlers. Keep the source HTML historical;
// the generated deployable artifact is explicit and testable.
for (const target of ['.build/index.html','.build/apps/web/index.html']) {
  let html=await readFile(target,'utf8');
  const main='<script type="module" src="/src/main.js?v=130"></script>';
  if(!html.includes(main))throw Error('MAIN_SCRIPT_ANCHOR_NOT_FOUND');
  html=html.replace(main,'<script type="module" src="/src/field-hardening.js?v=134"></script>\n  '+main);
  await writeFile(target,html,'utf8');
}
console.log('Build OK: .build/ (root service worker + web app + 1.3.4 field hardening)');

await import('./public-assets.mjs');
