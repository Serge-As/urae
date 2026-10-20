import {createPublicKey,verify} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';

export const canonicalApproval=value=>{
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return'['+value.map(canonicalApproval).join(',')+']';
  return'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalApproval(value[k])).join(',')+'}';
};
// The public key and expected change must come from a human-controlled source
// outside the mutable candidate. This function neither creates nor signs approval.
export function verifyEcoLockApproval(envelope,publicKey,expected,now=Date.now()){
  const p=envelope?.payload;if(p?.schema!=='ECO_LOCK_APPROVAL_V1')throw Error('ECO_LOCK_MISSING_APPROVAL');
  const key=createPublicKey(publicKey);if(key.asymmetricKeyType!=='ed25519')throw Error('ECO_LOCK_KEY_TYPE');
  if(typeof envelope.signature!=='string'||!verify(null,Buffer.from(canonicalApproval(p)),key,Buffer.from(envelope.signature,'base64')))throw Error('ECO_LOCK_BAD_SIGNATURE');
  if(typeof p.humanSigner!=='string'||!p.humanSigner.trim())throw Error('ECO_LOCK_HUMAN_SIGNER_REQUIRED');
  const issued=Date.parse(p.issuedAt),expiry=Date.parse(p.expiresAt);if(!Number.isFinite(issued)||!Number.isFinite(expiry)||issued>now||expiry<=now||expiry<=issued)throw Error('ECO_LOCK_EXPIRED_OR_FUTURE');
  for(const k of ['baseSha','headSha','rollbackSha'])if(!/^[a-f0-9]{40}$/.test(p[k]??''))throw Error('ECO_LOCK_INVALID_SHA');
  if(!/^[a-f0-9]{64}$/.test(p.impactSha256??''))throw Error('ECO_LOCK_IMPACT_REQUIRED');
  if(!Array.isArray(p.paths)||!p.paths.length||new Set(p.paths).size!==p.paths.length||p.paths.some(s=>typeof s!=='string'||!s||s.startsWith('/')||s.includes('\\')||s.split('/').includes('..')))throw Error('ECO_LOCK_INVALID_PATHS');
  for(const k of ['repository','baseSha','headSha','impactSha256','rollbackSha'])if(p[k]!==expected?.[k])throw Error('ECO_LOCK_SCOPE_MISMATCH:'+k);
  if(!Array.isArray(expected?.paths)||!isDeepStrictEqual([...p.paths].sort(),[...expected.paths].sort()))throw Error('ECO_LOCK_SCOPE_MISMATCH:paths');
  return{verified:true,repository:p.repository,headSha:p.headSha,humanSigner:p.humanSigner,expiresAt:p.expiresAt};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{if(process.argv.length!==5)throw Error('Usage: node scripts/verify-eco-lock-approval.mjs approval.json trusted-public-key.pem expected-change.json');
    const [approval,key,expected]=await Promise.all(process.argv.slice(2).map(p=>readFile(p,'utf8')));console.log(JSON.stringify(verifyEcoLockApproval(JSON.parse(approval),key,JSON.parse(expected)),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
