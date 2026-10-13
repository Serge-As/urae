#!/usr/bin/env node
// Prove the expense observer regression against an immutable old source and
// the checked-out source. Private synthetic DOM only; no network or deployment.
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baseline='d9bc8d9de22156f7ab798ef75470fc5ecf3019a3';
const rootArg=process.argv.find(x=>x.startsWith('--output='));
const output=rootArg?path.resolve(rootArg.slice('--output='.length)):path.join(repo,'outputs','expense-recap-regression-'+new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(output,{recursive:true});
const clean=text=>String(text??'').replace(/\u001b\[[0-?]*[ -/]*[@-~]/g,'');
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true}).trim();
const report={schemaVersion:1,kind:'EXPENSE_RECAP_BEHAVIOR_REGRESSION',baselineSha:baseline,sourceSha,status:'IN_PROGRESS',productionDeployed:false,qualified:false};
console.log('[Eco-System] Reference avant correction : 3 echecs attendus. Source corrigee : 3 succes requis.');
for(const [label,ref] of [['before',baseline],['after',undefined]]){
  const env={...process.env};delete env.ECO_EXPENSE_RECAP_SOURCE_REF;if(ref)env.ECO_EXPENSE_RECAP_SOURCE_REF=ref;
  const result=spawnSync(process.execPath,['--test','tests/expense-recap-no-idle-polling.test.mjs'],{cwd:repo,env,encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true});
  const log=clean(result.stdout)+'\n'+clean(result.stderr);await writeFile(path.join(output,label+'.log'),log,'utf8');
  const count=kind=>Number([...log.matchAll(new RegExp('\\b'+kind+' (\\d+)','g'))].at(-1)?.[1]??-1);
  report[label]={exitCode:result.status,tests:count('tests'),passed:count('pass'),failed:count('fail'),skipped:count('skipped'),cancelled:count('cancelled'),log:path.join(output,label+'.log')};
  if(result.error)report[label].launchError=String(result.error);
  if(label==='before')report[label].expectedAssertionFailures=['an idle recap must not re-read expenses every 120 ms','coincident canonical and context updates need one new read','one initial read for each existing projection'].every(message=>log.includes(message))&&log.includes('ERR_ASSERTION');
  console.log('ECO_EXPENSE_RECAP_REGRESSION '+label+' '+JSON.stringify(report[label]));
}
const before=report.before,after=report.after;
report.status=before.expectedAssertionFailures===true&&before.exitCode!==0&&before.tests===3&&before.passed===0&&before.failed===3&&before.skipped===0&&before.cancelled===0&&
  after.exitCode===0&&after.tests===3&&after.passed===3&&after.failed===0&&after.skipped===0&&after.cancelled===0?'PASS':'FAIL';
await writeFile(path.join(output,'expense-regression-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log('Expense observer causal regression: '+report.status);
if(report.status!=='PASS')process.exitCode=1;
