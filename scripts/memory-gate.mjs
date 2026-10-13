import { execFileSync } from 'node:child_process';
const run=(args)=>{try{return execFileSync('git',args,{encoding:'utf8'}).trimEnd();}catch{return '';}};
const changed=new Set();
const status=run(['status','--porcelain','--untracked-files=all']);
for(const line of status.split(/\r?\n/).filter(Boolean)){const p=line.slice(3).trim().replace(/^"|"$/g,''); if(p) changed.add(p);}
let base=process.env.MEMORY_GATE_BASE||'';
if(!base&&process.env.GITHUB_BASE_REF){const candidate=`origin/${process.env.GITHUB_BASE_REF}`; if(run(['rev-parse','--verify',candidate])) base=candidate;}
if(!base&&run(['rev-parse','--verify','HEAD~1'])) base='HEAD~1';
if(base){for(const p of run(['diff','--name-only',`${base}...HEAD`]).split(/\r?\n/).filter(Boolean))changed.add(p);}
const substantive=[...changed].filter(p=>/^(packages|apps|workers|cloudflare)\//.test(p));
if(!substantive.length){console.log('Memory gate OK (no substantive product change detected)');process.exit(0);}
const recalls=[...changed].filter(p=>/^docs\/memory\/recalls\/RECALL-.*\.md$/.test(p));
const cirs=[...changed].filter(p=>/^docs\/change-impact\/CIR-.*\.md$/.test(p));
if(!recalls.length||!cirs.length){console.error('MEMORY GATE FAILED');console.error(`Substantive changes: ${substantive.join(', ')}`);console.error(`Recall records: ${recalls.join(', ')||'NONE'}`);console.error(`CIR records: ${cirs.join(', ')||'NONE'}`);process.exit(1);}
console.log(`Memory gate OK (${substantive.length} substantive files; ${recalls.length} recall(s); ${cirs.length} CIR(s))`);
