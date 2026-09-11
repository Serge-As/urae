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
 'cloudflare.api_token.tontine_platform_github_actions_deploy':'VERIFIED_REMOTE',
 'cloudflare.d1.eco-system-db':'VERIFIED_REMOTE',
 'cloudflare.worker.eco-system':'VERIFIED_REMOTE',
 'safety.realMoneyEnabled':'VERIFIED_REMOTE',
 'product.complete_app_1.0':'VERIFIED_REMOTE',
 'product.alpha_line':'SUPERSEDED'
};
for(const [id,status] of Object.entries(must)){
  const r=records.find(x=>x.id===id);
  if(!r)throw new Error(`Missing mandatory truth ${id}`);
  if(r.status!==status)throw new Error(`Unexpected status ${id}: ${r.status}, expected ${status}`);
}
const current=fs.readFileSync(currentPath,'utf8');
for(const s of ['CLOUDFLARE','eco-system-db','1.0.0-complete-app','realMoneyEnabled=false','Living Rules']) if(!current.includes(s)) throw new Error(`CURRENT_TRUTH missing ${s}`);

const next=fs.readFileSync(nextPath,'utf8');
const positiveLines=next.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^[-*0-9.]+\s+/.test(x));
const forbidden=[
  /\bcr[ée]er\b[^\n]*\bCLOUDFLARE_ACCOUNT_ID\b/i,
  /\bcr[ée]er\b[^\n]*\bCLOUDFLARE_API_TOKEN\b/i,
  /\bcr[ée]er\b[^\n]*\b(?:jeton|token)\s+Cloudflare\b/i,
  /\bcr[ée]er\b[^\n]*\beco-system-db\b/i
];
for(const line of positiveLines){
  if(/\b(?:ne\s+pas|sans|éviter\s+de)\b/i.test(line)) continue;
  for(const rx of forbidden) if(rx.test(line)) throw new Error(`NEXT_RUN regresses an acquired prerequisite: ${line}`);
}
const serialized=JSON.stringify(ledger);
if(/(?:Bearer\s+|eyJ[a-zA-Z0-9_-]{10,}|[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,})/.test(serialized)) throw new Error('Truth ledger appears to contain a secret/token value');
console.log(`Project truth OK: ${records.length} records; Cloudflare/D1/Worker and Complete App remote qualification preserved; realMoneyEnabled remains remotely verified false`);
