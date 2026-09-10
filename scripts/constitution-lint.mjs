import { readFile } from 'node:fs/promises';
const text = await readFile('FEATURE_REGISTRY.yaml','utf8');
const required = ['KERNEL.CONTEXT','KERNEL.POLICY','KERNEL.WORKFLOW','KERNEL.OBLIGATIONS','OFFLINE.OUTBOX','RELAY.TRANSPORT.CORE','GROUP.LAUNCH.SIMULATION','MEETING.CASHBOX.RECONCILE','LEDGER.CANONICAL'];
const missing = required.filter(x => !text.includes(`id: ${x}`));
if (missing.length) { console.error(`Missing capabilities: ${missing.join(', ')}`); process.exit(1); }
const financialBlocks = text.split(/\n  - id: /).filter(x => /risk_class: financial_critical/.test(x));
for(const block of financialBlocks){ if(!/offline_policy:/.test(block) || !/audit_event:/.test(block) || !/tests:/.test(block)){ console.error('Financial critical capability missing required metadata'); process.exit(1); } }
const modules = await readFile('packages/module-registry/src/index.ts','utf8');
const mustRemember=['CORE.ASSOCIATIONS','CORE.ROTATING_TONTINE','FINANCE.LOANS','COMMUNITY.FORUM','MARKETPLACE.CORE','LEARNING.NGO','SAFETY.ANTISCAM','RELAY.COMMUNITY','MANAGER.BUSINESS_STUDIO','GOVERNANCE.TENDER','SUCCESSION.NEXT_OF_KIN'];
const missingModules=mustRemember.filter(x=>!modules.includes(`id:'${x}'`));
if(missingModules.length){console.error(`Product memory missing: ${missingModules.join(', ')}`);process.exit(1);}
console.log(`Constitution lint OK (${required.length} required capabilities, ${financialBlocks.length} financial-critical records, ${mustRemember.length} product domains remembered)`);
