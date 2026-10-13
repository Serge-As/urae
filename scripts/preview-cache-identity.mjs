// PREVIEW-ONLY post-build cache identity, never touch source release contract.
// Allows the same immutable PWA shell architecture to deliver fresh JS when
// the preview Worker changes, without touching IndexedDB / Outbox / Ledger.
import {readFile,writeFile} from 'node:fs/promises';
const sha=String(process.env.GITHUB_SHA||'').trim();
if(process.env.GITHUB_REF_NAME!=='preview/eco-refonte-20261012'||!/^[a-f0-9]{40}$/.test(sha))
  throw Error('PREVIEW_ONLY_EXACT_SHA_REQUIRED');
const last=String(process.env.ECO_PREVIEW_PREVIOUS_SHA||'').trim();
if(last&&!/^[a-f0-9]{40}$/.test(last))throw Error('PREVIOUS_SHA_MALFORMED');
const newCache='eco-system-preview-'+sha.slice(0,16);
const paths=['.build/sw.js','.build/public/sw.js','.build/apps/web/sw.js'];
for(const path of paths){
  let source=await readFile(path,'utf8');
  const current=source.match(/const CACHE = '([^']+)';/);
  const previous=source.match(/const PREVIOUS_CACHE = '([^']+)';/);
  if(!current||!previous||!current[1].startsWith('eco-system-'))throw Error('PREVIEW_CACHE_ANCHOR_MISSING:'+path);
  if(last&&last!==sha){
    source=source.replace(previous[0],`const PREVIOUS_CACHE = 'eco-system-preview-${last.slice(0,16)}';`);
  }else{
    source=source.replace(previous[0],`const PREVIOUS_CACHE = '${current[1]}';`);
  }
  // The pre-preview coherent release remains available as an emergency
  // rollback. Crucially, the currently editing page and its IndexedDB are
  // never force-reloaded, purged or migrated by this script.
  const old='name !== PREVIOUS_CACHE && name !== LEGACY_RECOVERY_CACHE';
  if(!source.includes(old))throw Error('PREVIEW_CACHE_RECOVERY_ANCHOR_MISSING:'+path);
  source=source.replace(old,`name !== PREVIOUS_CACHE && name !== '${current[1]}' && name !== LEGACY_RECOVERY_CACHE`);
  source=source.replace(current[0],`const CACHE = '${newCache}';`);
  if(!source.includes(newCache)||source.includes('indexedDB.deleteDatabase'))throw Error('PREVIEW_CACHE_ASSERTION_FAILED:'+path);
  await writeFile(path,source,'utf8');
}
console.log(JSON.stringify({event:'PREVIEW_CACHE_ISOLATED',sha,cache:newCache,previous:last?last.slice(0,16):'legacy'}));
