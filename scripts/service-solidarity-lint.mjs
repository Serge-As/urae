import { readFile } from 'node:fs/promises';
const src = await readFile('packages/module-registry/src/service-capabilities.ts','utf8');
const ids = [...src.matchAll(/serviceId:\s*'([^']+)'/g)].map(m=>m[1]);
if(ids.length < 10) throw new Error(`Too few capability cards: ${ids.length}`);
if(new Set(ids).size !== ids.length) throw new Error('Duplicate serviceId in capability directory');
for(const required of ['KERNEL','DOMAIN','LEDGER','DISCOVERY_MEMBERSHIP','RUBRICS','TRUST','OFFLINE','RELAY','REPOSITORY','APPLICATION','WORKER_API']){
  if(!ids.includes(required)) throw new Error(`Missing canonical service capability card: ${required}`);
}
for(const token of ['mustNotOwn','allowedDependencies','failurePolicy','offlinePolicy','dataAuthority']){
  if(!src.includes(token)) throw new Error(`Capability cards missing ${token}`);
}
if(!src.includes("wealth-inference") || !src.includes("automatic-exclusion")) throw new Error('Trust safety boundaries missing');
if(!src.includes("financial-finality") || !src.includes("fresh-authorization")) throw new Error('Offline finality boundaries missing');
console.log(`Service solidarity OK (${ids.length} canonical service cards)`);
