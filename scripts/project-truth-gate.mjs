import fs from 'node:fs';
const ledgerPath='docs/memory/PROJECT_TRUTH_LEDGER.json';
const currentPath='docs/memory/CURRENT_TRUTH.md';
const nextPath='NEXT_RUN.md';
for(const p of [ledgerPath,currentPath,nextPath]) if(!fs.existsSync(p)) throw new Error(`Missing ${p}`);
const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
const allowed=new Set(ledger.allowedStatuses||[]);
if(!allowed.size) throw new Error('Truth ledger allowedStatuses missing');
const records=ledger.records||[];
const ids=new Set();
for(const r of records){
  if(!r.id||ids.has(r.id)) throw new Error(`Truth record missing/duplicate id: ${r.id}`);
  ids.add(r.id);
  if(!allowed.has(r.status)) throw new Error(`Invalid truth status ${r.status} for ${r.id}`);
  if(!r.observedOn||!r.evidence?.length) throw new Error(`Truth record lacks evidence/date: ${r.id}`);
  if(/secret|token/i.test(r.scope||'') && r.valueStored!==false) throw new Error(`Secret/token record must state valueStored=false: ${r.id}`);
}
const must={
 'github.secret.CLOUDFLARE_ACCOUNT_ID':'ACQUIRED',
 'github.secret.CLOUDFLARE_API_TOKEN':'ACQUIRED',
 'cloudflare.api_token.tontine_platform_github_actions_deploy':'ACQUIRED',
 'cloudflare.d1.eco-system-db':'TO_VERIFY',
 'cloudflare.worker.eco-system':'TO_VERIFY',
 'safety.realMoneyEnabled':'ACQUIRED'
};
for(const [id,status] of Object.entries(must)){const r=records.find(x=>x.id===id);if(!r)throw new Error(`Missing mandatory truth ${id}`);if(r.status!==status)throw new Error(`Unexpected status ${id}: ${r.status}, expected ${status}`);}
const current=fs.readFileSync(currentPath,'utf8');
for(const s of ['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_API_TOKEN','tontine-platform-github-actions-deploy','2.3.3']) if(!current.includes(s)) throw new Error(`CURRENT_TRUTH missing ${s}`);
const next=fs.readFileSync(nextPath,'utf8');
const forbidden=[/cr[ée]er\s+(?:le\s+)?secret[^\n]*CLOUDFLARE_ACCOUNT_ID/i,/cr[ée]er\s+(?:le\s+)?secret[^\n]*CLOUDFLARE_API_TOKEN/i,/cr[ée]er\s+(?:un\s+)?jeton\s+Cloudflare/i];
for(const rx of forbidden) if(rx.test(next)) throw new Error(`NEXT_RUN regresses an acquired Cloudflare prerequisite: ${rx}`);
const serialized=JSON.stringify(ledger);
if(/(?:Bearer\s+|eyJ[a-zA-Z0-9_-]{10,}|[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,})/.test(serialized)) throw new Error('Truth ledger appears to contain a secret/token value');
console.log(`Project truth OK: ${records.length} records; acquired Cloudflare prerequisites preserved; remote D1/Worker still explicitly unverified`);
