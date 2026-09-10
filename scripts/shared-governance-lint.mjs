import fs from 'node:fs';
const reg=JSON.parse(fs.readFileSync('docs/governance/SHARED_GUARDRAIL_REGISTRY.json','utf8'));
if(reg.guardrails.length<21) throw new Error('Expected at least 21 universal guardrails');
const ids=new Set(); for(const g of reg.guardrails){ if(!g.id||!g.rule) throw new Error('Invalid guardrail'); if(ids.has(g.id)) throw new Error('Duplicate guardrail '+g.id); ids.add(g.id); }
const play=fs.readFileSync(reg.source,'utf8');
for(const phrase of ['PROCÉDURE UNIVERSELLE DE SAUVEGARDE','commit ≠ merge ≠ migration ≠ déploiement ≠ production','aucune valeur de secret']) if(!play.toLowerCase().includes(phrase.toLowerCase())) throw new Error('Playbook missing '+phrase);
console.log(`Shared Governance PASS — ${reg.guardrails.length} guardrails`);
