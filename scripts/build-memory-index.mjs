import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const masterRel='docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.4_2026-09-05.md';
const master=path.join(root,masterRel); if(!fs.existsSync(master)) throw new Error(`Missing ${masterRel}`);
const lines=fs.readFileSync(master,'utf8').split(/\r?\n/);
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[`*_#>]/g,'').replace(/\s+/g,' ').trim();
const requirements=[]; const headings=[]; const seenHead=new Map(); const seenId=new Set();
for(let i=0;i<lines.length;i++){
  const line=lines[i]; const hm=line.match(/^(#{1,6})\s+(.+?)\s*$/); if(hm){const title=hm[2].trim();const key=norm(title); if(key){const prev=seenHead.get(key);if(prev)prev.occurrences++;else{const rec={level:hm[1].length,title,line:i+1,occurrences:1};seenHead.set(key,rec);headings.push(rec);}}}
  const idm=line.match(/\*\*([A-Z][A-Z0-9_.-]{2,})\s*(?:\[([^\]]+)\])?\*\*\s*(.*)$/); if(idm&&!seenId.has(idm[1])){seenId.add(idm[1]);requirements.push({id:idm[1],status:idm[2]?.trim()||null,summary:idm[3]?.trim().slice(0,500)||'',line:i+1});}
  const tm=line.match(/^\|\s*`?([A-Z][A-Z0-9_.-]{2,})`?\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/); if(tm&&tm[1]!=="ID"&&!seenId.has(tm[1])){seenId.add(tm[1]);requirements.push({id:tm[1],status:tm[3]?.replace(/`/g,"").trim()||null,summary:tm[2]?.replace(/`/g,"").trim().slice(0,500)||"",line:i+1});}
}
const out={schemaVersion:1,generatedOn:'2026-09-05',source:{path:masterRel,lines:lines.length},rules:{purpose:'Navigation index only; source text remains authoritative.',missingFromIndexDoesNotMeanRemoved:true},counts:{uniqueRequirementIds:requirements.length,uniqueHeadings:headings.length},requirements,headings};
const dest=path.join(root,'docs/memory/MASTER_CAPABILITY_INDEX.json');const rendered=JSON.stringify(out,null,2)+'\n';if(process.argv.includes('--check')){if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==rendered){console.error('MEMORY INDEX STALE: run npm run memory:index');process.exit(1);}console.log(`Memory index OK: ${requirements.length} requirement IDs, ${headings.length} unique headings`);}else{fs.writeFileSync(dest,rendered);console.log(`Memory index built: ${requirements.length} requirement IDs, ${headings.length} unique headings -> ${path.relative(root,dest)}`);}
