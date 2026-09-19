import fs from 'node:fs';

const reg=JSON.parse(fs.readFileSync('docs/governance/SHARED_GUARDRAIL_REGISTRY.json','utf8'));
if(reg.guardrails.length<21) throw new Error('Expected at least 21 universal guardrails');

const ids=new Set();
for(const g of reg.guardrails){
  if(!g.id||!g.rule) throw new Error('Invalid guardrail');
  if(ids.has(g.id)) throw new Error('Duplicate guardrail '+g.id);
  ids.add(g.id);
}

const requiredGuards=['OWNER.CANONICAL','REUSE.BEFORE.BUILD'];
for(const id of requiredGuards) if(!ids.has(id)) throw new Error('Missing universal architecture guardrail '+id);

if(reg.scope!=='all_current_and_future_projects') throw new Error('Shared guardrail scope must include all current and future projects');
if(!Array.isArray(reg.conventions)||reg.conventions.length<2) throw new Error('Two founding universal conventions are required');
const conventions=new Map(reg.conventions.map(c=>[c.id,c]));
const canonical=conventions.get('CONVENTION.CANONICAL_AUTHORITY');
const reuse=conventions.get('CONVENTION.REUSE_FIRST');
if(!canonical||canonical.aliasOf!=='OWNER.CANONICAL'||canonical.status!=='MANDATORY') throw new Error('Canonical authority convention is not locked');
if(!reuse||reuse.aliasOf!=='REUSE.BEFORE.BUILD'||reuse.status!=='MANDATORY') throw new Error('Reuse-first convention is not locked');
for(const c of [canonical,reuse]){
  if(c.scope!=='all_current_and_future_projects') throw new Error('Convention scope regression '+c.id);
  if(!c.rule||!c.blockerWhenViolated) throw new Error('Convention lacks enforcement metadata '+c.id);
}

const play=fs.readFileSync(reg.source,'utf8');
for(const phrase of ['PROCÉDURE UNIVERSELLE DE SAUVEGARDE','commit ≠ merge ≠ migration ≠ déploiement ≠ production','aucune valeur de secret','Une capacité = une autorité canonique','Reuse Before Build'])
  if(!play.toLowerCase().includes(phrase.toLowerCase())) throw new Error('Playbook missing '+phrase);

if(!reg.conventionSource||!fs.existsSync(reg.conventionSource)) throw new Error('Founding convention source missing');
const conventionDoc=fs.readFileSync(reg.conventionSource,'utf8');
for(const phrase of ['CONVENTION 1','UNE CAPACITÉ SIGNIFICATIVE = UNE AUTORITÉ CANONIQUE','CONVENTION 2','RÉUTILISER / ÉTENDRE / ADAPTER AVANT DE CONSTRUIRE EN PARALLÈLE','tous les projets actuels et futurs'])
  if(!conventionDoc.toLowerCase().includes(phrase.toLowerCase())) throw new Error('Convention source missing '+phrase);

console.log(`Shared Governance PASS — ${reg.guardrails.length} guardrails + ${reg.conventions.length} founding conventions`);
