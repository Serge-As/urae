import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const argv=process.argv.slice(2); const write=argv.includes('--write'); const query=argv.filter(x=>x!=='--write').join(' ').trim();
if(!query){console.error('Usage: node scripts/memory-recall.mjs "concept" [--write]');process.exit(2);}
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const synonymsPath=path.join(root,'docs/memory/CONCEPT_SYNONYMS.json');
const synonyms=fs.existsSync(synonymsPath)?JSON.parse(fs.readFileSync(synonymsPath,'utf8')):{};
const queryNorm=normalize(query); const terms=new Set(queryNorm.split(/[^a-z0-9_-]+/).filter(x=>x.length>2));
for(const [key,vals] of Object.entries(synonyms)) if(queryNorm.includes(normalize(key))||vals.some(v=>queryNorm.includes(normalize(v)))){terms.add(normalize(key)); for(const v of vals) for(const t of normalize(v).split(/[^a-z0-9_-]+/).filter(x=>x.length>2)) terms.add(t);}
const roots=['AGENTS.md','PROJECT_STATE.md','FEATURE_REGISTRY.yaml','NEXT_RUN.md','docs/constitution','docs/engineering','docs/change-impact','docs/memory'];
const files=[]; const walk=p=>{if(!fs.existsSync(p))return;const st=fs.statSync(p);if(st.isDirectory())for(const n of fs.readdirSync(p))walk(path.join(p,n));else if(/\.(md|ya?ml|json)$/i.test(p)&&!p.includes(`${path.sep}recalls${path.sep}RECALL-AUTO-`))files.push(p);}; roots.forEach(x=>walk(path.join(root,x)));
const hits=[];
for(const file of files){const raw=fs.readFileSync(file,'utf8');const n=normalize(raw);let score=0;const matched=[];for(const t of terms){const c=n.split(t).length-1;if(c){score+=Math.min(c,20);matched.push(t);}}if(!score)continue;const lines=raw.split(/\r?\n/);const snippets=[];for(let i=0;i<lines.length&&snippets.length<5;i++){const ln=normalize(lines[i]);if([...terms].some(t=>ln.includes(t))){snippets.push(`${i+1}: ${lines[i].trim().slice(0,260)}`);}}hits.push({file:path.relative(root,file).replaceAll('\\','/'),score,matched:[...new Set(matched)].slice(0,20),snippets});}
hits.sort((a,b)=>b.score-a.score||a.file.localeCompare(b.file));
const top=hits.slice(0,24); const stamp=new Date().toISOString().slice(0,10); const slug=normalize(query).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'recall';
const report=[`# Memory Recall — ${query}`,``,`Date: ${stamp}`,`Terms élargis: ${[...terms].sort().join(', ')}`,``,`## Sources les plus pertinentes`,...top.flatMap(h=>[`- **${h.file}** — score ${h.score}; concepts: ${h.matched.join(', ')}`,...h.snippets.map(s=>`  - ${s}`)]),``,`## Gate`, `Ce rapport est un index de rappel, pas une décision métier. Toute contradiction doit être rapprochée avec la Constitution, l'état réel du code, les CIR/ADR et les tests avant implémentation.`].join('\n');
console.log(report);
if(write){const dir=path.join(root,'docs/memory/recalls');fs.mkdirSync(dir,{recursive:true});const out=path.join(dir,`RECALL-AUTO-${stamp}-${slug}.md`);fs.writeFileSync(out,report+'\n');console.error(`\nWrote ${path.relative(root,out)}`);}
