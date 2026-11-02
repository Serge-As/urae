import { rm, mkdir, cp, access, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

await import('./generate-offline-capabilities.mjs');
const RELEASE_VERSION='1.5.2.45-fiscalibre-host';
const compiler=path.resolve('node_modules/typescript/bin/tsc');
try{await access(compiler);}catch{await import('./build-portable.mjs');process.exit(0);}
const output=path.resolve('.build');
if(path.dirname(output)!==process.cwd() || path.basename(output)!=='.build')throw Error('UNSAFE_BUILD_PATH');
await rm(output, { recursive: true, force: true });
const result = spawnSync(process.execPath, ['--stack-size=8192',compiler,'-p', 'tsconfig.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
await mkdir('.build/apps/web', { recursive: true });
await import('./prepare-local-document-engines.mjs');
await import('./prepare-local-voice.mjs');
for (const file of ['index.html','external-ad.html','public-notebook.html','styles.css','canopee.css','manifest.webmanifest']) {
  await cp(path.join('apps/web', file), path.join('.build/apps/web', file));
  await cp(path.join('apps/web', file), path.join('.build', file));
}
await cp('.build/apps/web/src', '.build/src', { recursive: true });
await cp('apps/web/vendor/documents','.build/vendor/documents',{recursive:true});
await cp('apps/web/vendor/voice','.build/vendor/voice',{recursive:true});
await cp('apps/web/sw.js', '.build/apps/web/sw.js');
await cp('apps/web/sw.js', '.build/sw.js');

await import('./bundle-browser-core.mjs');

console.log(`Build OK: .build/ (Eco-System ${RELEASE_VERSION}; offline reload + explicit conflicts + loan/debt tables)`);

await import('./pwa-shell-closure.mjs');
await import('./public-assets.mjs');
await import('./build-fiscalibre.mjs');
