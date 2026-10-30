import {readFile,writeFile}from'node:fs/promises';
const registry=await readFile('FEATURE_REGISTRY.yaml','utf8'),catalog=await readFile('packages/module-registry/src/index.ts','utf8');
const policies=new Map();for(const block of registry.split(/\n(?=\s+- id: )/)){const id=block.match(/^\s*- id: (\S+)/m)?.[1],policy=block.match(/^\s+offline_policy: (.+)$/m)?.[1];if(id&&policy)policies.set(id,policy.trim());}
const ids=[...catalog.matchAll(/\{id:'([^']+)'/g)].map(x=>x[1]);const rows=Object.fromEntries(ids.map(id=>[id,policies.get(id)||'NOT_QUALIFIED_SERVER_CONFIRMATION_REQUIRED']));
const source='// Generated from FEATURE_REGISTRY.yaml and PRODUCT_MODULES; do not infer new offline rights.\nexport const OFFLINE_CAPABILITY_POLICIES=Object.freeze('+JSON.stringify(rows,null,2)+');\n';
const file='apps/web/src/offline-policies.generated.js';if(process.argv.includes('--check')){if(await readFile(file,'utf8')!==source)throw Error('STALE_OFFLINE_CAPABILITY_MAP');}else await writeFile(file,source);
console.log('Offline map:',ids.length,'capabilities;',Object.values(rows).filter(x=>x!=='NOT_QUALIFIED_SERVER_CONFIRMATION_REQUIRED').length,'documented policies; others explicitly unqualified.');
