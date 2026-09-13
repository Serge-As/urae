import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['apps','packages','workers'];
const files = [];
async function walk(dir){ for(const e of await readdir(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory()) await walk(p); else if(/\.(ts|js)$/.test(e.name)) files.push(p); }}
for(const r of roots) await walk(r);
const rules = [
  { where: /^apps\/web\//, forbidden: /(?:from\s*['\"][^'\"]*repositories\/src|import\s*\([^)]*repositories\/src|D1DatabaseLike)/, reason: 'UI must not import persistence adapters directly' },
  { where: /^packages\/platform-kernel\//, forbidden: /packages\/domain|repositories\/src/, reason: 'Kernel must not depend on domain or persistence' },
  { where: /^packages\/offline\//, forbidden: /PAYMENT_CONFIRMED|LEDGER_ENTRY_POSTED/, reason: 'Offline layer must not manufacture financial finality' }
];
const violations=[];
for(const f of files){ const txt=await readFile(f,'utf8'); for(const r of rules) if(r.where.test(f.replaceAll('\\','/'))&&r.forbidden.test(txt)) violations.push(`${f}: ${r.reason}`); }
if(violations.length){ console.error(violations.join('\n')); process.exit(1); }
console.log(`Architecture fitness OK (${files.length} source files scanned)`);
