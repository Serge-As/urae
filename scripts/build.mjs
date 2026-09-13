import { rm, mkdir, cp, access } from 'node:fs/promises';
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
console.log('Build OK: .build/ (root service worker + web app)');

await import('./public-assets.mjs');
