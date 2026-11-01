import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function checkContribution({files,rules,root=process.cwd()}){
 const errors=[],matched=[];
 for(const rule of rules){
  if(!files.some(file=>rule.patterns.some(prefix=>file.startsWith(prefix))))continue;
  matched.push(rule.id);
  if(!rule.owner||!rule.invariants?.length||!rule.proofs?.length){errors.push(rule.id+': missing owner/invariants/proofs');continue;}
  for(const proof of rule.proofs){const p=path.resolve(root,proof);if(!p.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()||fs.statSync(p).size===0)errors.push(rule.id+': missing or unsafe proof '+proof);}
 }
 return{errors,matched};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
 let base=process.env.CONTRIBUTION_BASE||'HEAD~1';
 const files=[...new Set([...git(['diff','--name-only',base,'HEAD']),...git(['diff','--name-only','HEAD'])])];
 const {rules}=JSON.parse(fs.readFileSync('docs/governance/CONTRIBUTION_RULES.json','utf8'));
 const result=checkContribution({files,rules});
 console.log('CONTRIBUTION_RULES '+JSON.stringify(result));
 if(result.errors.length)process.exit(1);
 console.log('Required tests are mapped here; the CI execution steps must also pass before delivery.');
}
