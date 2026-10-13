#!/usr/bin/env node
// Private local qualification: no deployment, production data or paid service.
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {openSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as pause} from 'node:timers/promises';
import {createServer as portProbe} from 'node:net';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const scratch=path.join(repo,'work','eco-local-qualification-'+stamp);
const outputRootArg=process.argv.find(value=>value.startsWith('--output-root='));
const outputRoot=outputRootArg?path.resolve(outputRootArg.slice('--output-root='.length)):path.join(repo,'outputs');
const output=path.join(outputRoot,'eco-qualification-'+stamp);
const report={schemaVersion:1,startedAt:new Date().toISOString(),status:'IN_PROGRESS',sourceSha:null,checks:[],productionDeployed:false,fieldAccepted:false,realMoneyEnabled:false};
let server,serverLog;
const clean=text=>String(text??'').replace(/\u001b\[[0-9;]*m/g,'');
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true}).trim();
const command=(name,args)=>{
  if(process.platform==='win32'&&['npm','npx'].includes(name)){
    // All arguments below are fixed repository commands. There is no shell
    // interpolation of user input, credentials, data paths or document contents.
    return{file:process.env.ComSpec||'cmd.exe',args:['/d','/s','/c',name+' '+args.join(' ')]};
  }
  return{file:name,args};
};
async function run(name,args,label,extraEnv={}){
  console.log('\n[Eco-System] '+label);
  const cmd=command(name,args),result=spawnSync(cmd.file,cmd.args,{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true,env:{...process.env,...extraEnv}});
  const stdout=clean(result.stdout),stderr=clean(result.stderr);
  if(stdout)process.stdout.write(stdout);if(stderr)process.stderr.write(stderr);
  const logPath=path.join(scratch,String(report.checks.length+1).padStart(2,'0')+'.log');
  await writeFile(logPath,stdout+'\n'+stderr,'utf8');
  report.checks.push({label,command:[name,...args].join(' '),status:result.status===0?'PASS':'FAIL',exitCode:result.status,logPath});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error(label+' failed: exit '+result.status);
  return stdout;
}
const finalCount=(text,pattern)=>{const matches=[...clean(text).matchAll(pattern)];return matches.length?Number(matches.at(-1)[1]):undefined;};
async function healthy(port){
  for(let i=0;i<45;i++){
    if(report.serverError)throw Error(report.serverError);
    if(server.exitCode!==null)throw Error('Isolated server stopped before /health; read '+path.join(scratch,'server.log'));
    try{const r=await fetch('http://127.0.0.1:'+port+'/health',{signal:AbortSignal.timeout(2000)});if(r.ok)return await r.json();}catch{}
    await pause(1000);
  }
  throw Error('Isolated server /health unavailable. Keep port 4173 free.');
}
try{
  if(Number(process.versions.node.split('.')[0])<24)throw Error('Node.js 24 or newer is required.');
  const diff=git('diff','--name-only','HEAD');
  if(diff)throw Error('Tracked source differs from HEAD. Use a clean clone or preserve and commit your changes before qualifying.');
  const extras=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean).filter(x=>!/^(\.build|\.data|\.bir|work|outputs|test-results|playwright-report)\//.test(x));
  if(extras.length)throw Error('Untracked source would not belong to the archive: '+extras.join(', '));
  report.sourceSha=git('rev-parse','HEAD');
  await mkdir(scratch,{recursive:true});await mkdir(output,{recursive:true});
  const release=JSON.parse(await readFile(path.join(repo,'docs','release','CURRENT_RELEASE_CONTRACT.json'),'utf8'));
  await run('npm',['ci','--ignore-scripts'],'Install exact locked dependencies');
  if(process.env.ECO_EXPENSE_RECAP_SOURCE_REF)throw Error('Remove ECO_EXPENSE_RECAP_SOURCE_REF: full qualification must use checked-out product source.');
  await run(process.execPath,['scripts/verify-expense-recap-regression.mjs','--output='+path.join(output,'expense-regression')],'Prove the expense observer defect on old source and the correction on current source');
  report.expenseRegression=JSON.parse(await readFile(path.join(output,'expense-regression','expense-regression-report.json'),'utf8'));
  const ci=await run('npm',['run','ci'],'Dependency audit, TypeScript, governance and all Node regressions');
  const nodeTests=finalCount(ci,/\btests (\d+)/g),nodePass=finalCount(ci,/\bpass (\d+)/g);
  report.node={tests:nodeTests,passed:nodePass};
  if(nodeTests!==722||nodePass!==722)throw Error('Expected 722 Node tests; review the exact summary instead of assuming success.');
  if(!process.argv.includes('--skip-browser-install'))await run('npx',['playwright','install','--with-deps','chromium','webkit'],'Install the locked Chromium and WebKit browsers');
  // Each qualification has its own disposable SQLite database. Production and
  // any existing local .data/eco-system.sqlite are never opened by this runner.
  await new Promise((resolve,reject)=>{const probe=portProbe();probe.once('error',reject);probe.listen(4173,'127.0.0.1',()=>probe.close(resolve));});
  serverLog=openSync(path.join(scratch,'server.log'),'a');
  server=spawn(process.execPath,['scripts/dev-server.mjs'],{cwd:repo,env:{...process.env,OPEN_BROWSER:'0',PORT:'4173',ECO_DATA_FILE:path.join(scratch,'qualification.sqlite')},stdio:['ignore',serverLog,serverLog],windowsHide:true});
  server.on('error',error=>{report.serverError=String(error);});
  const health=await healthy(4173);report.localHealth=health;
  for(const field of ['version','buildId','pwaCache','schemaVersion','policyVersion'])if(health[field]!==release.release?.[field])throw Error('Local release identity mismatch: '+field);
  report.localSourceBinding={checkedOutSha:report.sourceSha,trackedSourceClean:true,serverPid:server.pid,healthCommitSha:health.commitSha,authority:'CLEAN_TRACKED_CHECKOUT_AND_LOCAL_BUILD; NOT_PRODUCTION_HEALTH'};
  if(health.realMoneyEnabled!==false)throw Error('Synthetic qualification requires realMoneyEnabled=false.');
  const catalogResponse=await fetch('http://127.0.0.1:4173/api/v1/product/capabilities');
  if(!catalogResponse.ok)throw Error('Local capability catalog unavailable.');
  const catalog=await catalogResponse.json();report.capabilities=catalog.count;
  if(catalog.version!==release.release.version||catalog.count<164||catalog.capabilities?.length!==catalog.count)throw Error('Local capability catalog identity/count mismatch.');
  const chromium=await run('npx',['playwright','test','tests/browser/financial-cell-consensus-persistence-1.5.2.6.spec.mjs','tests/browser/browser-shell-mobile-1.5.2.6.spec.mjs','tests/browser/sovereign-multi-manager-1.5.2.14.spec.mjs','tests/browser/window-account-finance-20261010.spec.mjs','--browser=chromium','--workers=1'],'Chromium: persistence, mobile shell, two managers, idle expenses, confrontation and transport outage',{ECO_LIVE_SYNC_OUTPUT_DIR:output});
  const chromiumPassed=finalCount(chromium,/(\d+) passed/g);report.chromium={passed:chromiumPassed};
  if(chromiumPassed!==10)throw Error('Expected Chromium 10/10.');
  const webkit=await run('npx',['playwright','test','tests/browser/eco-system-webkit-sovereign-offline-1.5.2.9.spec.mjs','--browser=webkit','--workers=1'],'WebKit: sovereign offline regression suite');
  const webkitPassed=finalCount(webkit,/(\d+) passed/g);report.webkit={passed:webkitPassed};
  if(webkitPassed!==6)throw Error('Expected WebKit 6/6.');
  const archive=path.join(output,'source-'+report.sourceSha+'.tar.gz');
  await run('git',['archive','--format=tar.gz','-o',archive,'HEAD'],'Archive the exact qualified source');
  const sha256=createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile(path.join(output,'SHA256SUMS'),sha256+'  '+path.basename(archive)+'\n','utf8');
  await run('tar',['-tzf',archive],'Verify that the source archive is readable');
  report.archive={path:archive,sha256};
  report.status='PASS';
}catch(error){
  report.status='FAIL';report.error=String(error?.stack??error);process.exitCode=1;
  console.error('\n[Eco-System] '+report.error);
}finally{
  if(server&&server.exitCode===null)server.kill();
  if(serverLog!==undefined)closeSync(serverLog);
  await mkdir(output,{recursive:true});
  report.completedAt=new Date().toISOString();
  const reportPath=path.join(output,'qualification-report.json');
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n','utf8');
  console.log('\nQualification report: '+reportPath);
  try{report.liveSyncSummary=JSON.parse(await readFile(path.join(output,'live-sync-summary.json'),'utf8'));await writeFile(reportPath,JSON.stringify(report,null,2)+'\n','utf8');}catch{}
  console.log('Status: '+report.status+' | Source: '+String(report.sourceSha));
  console.log('This report records local qualification only. Production publication remains governed by its HOLD marker and exact-delivery gates.');
}
