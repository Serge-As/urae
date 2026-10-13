#!/usr/bin/env node
// One diagnostic run. This does not qualify, archive or deploy the platform.
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {openSync,closeSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as pause} from 'node:timers/promises';
import {createServer as portProbe} from 'node:net';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const args=process.argv.slice(2);
const scopeArg=args.find(value=>value.startsWith('--scope='));
const scope=scopeArg?scopeArg.slice('--scope='.length):'live-sync';
const expectedTests=scope==='sovereign-chromium'?6:1;
const diagnosticName=scope==='sovereign-chromium'?'eco-sovereign-chromium-diagnostic-':'eco-live-sync-diagnostic-';
const scratch=path.join(repo,'work',diagnosticName+stamp);
const outputRootArg=args.find(value=>value.startsWith('--output-root='));
const outputRoot=outputRootArg?path.resolve(outputRootArg.slice('--output-root='.length)):path.join(repo,'outputs');
const output=path.join(outputRoot,diagnosticName+stamp);
const report={schemaVersion:1,kind:scope==='sovereign-chromium'?'SOVEREIGN_CHROMIUM_DIAGNOSTIC_ONLY':'LIVE_SYNC_DIAGNOSTIC_ONLY',scope,browser:'chromium',platform:process.platform,expectedTests,startedAt:new Date().toISOString(),sourceSha:null,status:'IN_PROGRESS',checks:[],qualified:false,productionDeployed:false,realMoneyEnabled:false,fieldAccepted:false};
let server,serverLog;
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true}).trim();
async function run(file,args,label){
  console.log('\n[Eco-System diagnostic] '+label);
  const logPath=path.join(scratch,String(report.checks.length+1).padStart(2,'0')+'.log');
  let captured='';
  const child=spawn(file,args,{cwd:repo,env:{...process.env,ECO_LIVE_SYNC_OUTPUT_DIR:output},stdio:['ignore','pipe','pipe'],windowsHide:true});
  for(const [stream,destination] of [[child.stdout,process.stdout],[child.stderr,process.stderr]])stream.on('data',chunk=>{captured+=chunk.toString();destination.write(chunk);});
  const exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  await writeFile(logPath,captured,'utf8');
  report.checks.push({label,status:exitCode===0?'PASS':'FAIL',exitCode,logPath});
  return{exitCode,captured};
}
try{
  if(!['live-sync','sovereign-chromium'].includes(scope))throw Error('Unknown diagnostic scope: '+scope);
  if(args.some(value=>!value.startsWith('--scope=')&&!value.startsWith('--output-root=')))throw Error('Unknown diagnostic argument. Supported: --scope=live-sync|sovereign-chromium and --output-root=<path>.');
  if(Number(process.versions.node.split('.')[0])<24)throw Error('Node.js 24 or newer is required.');
  report.sourceSha=git('rev-parse','HEAD');
  if(git('diff','--name-only','HEAD'))throw Error('Tracked source differs from HEAD. Preserve those changes before diagnosis.');
  const extras=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean).filter(x=>!/^(\.build|\.data|\.bir|work|outputs|test-results|playwright-report)\//.test(x));
  if(extras.length)throw Error('Untracked source: '+extras.join(', '));
  await mkdir(scratch,{recursive:true});await mkdir(output,{recursive:true});
  const installed=JSON.parse(await readFile(path.join(repo,'node_modules','@playwright','test','package.json'),'utf8'));
  if(installed.version!=='1.56.1')throw Error('The already qualified Playwright 1.56.1 installation is required.');
  const testArgs=scope==='sovereign-chromium'
    ?['node_modules/@playwright/test/cli.js','test','tests/browser/eco-system-webkit-sovereign-offline-1.5.2.9.spec.mjs','--browser=chromium','--workers=1']
    :['node_modules/@playwright/test/cli.js','test','tests/browser/sovereign-multi-manager-1.5.2.14.spec.mjs','--browser=chromium','--workers=1','--grep','distinct managers see typing'];
  report.playwrightVersion=installed.version;
  const listing=await run(process.execPath,[...testArgs,'--list'],'Verify exactly '+expectedTests+' diagnostic tests are selected before building');
  const selected=Number(listing.captured.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g,'').match(/Total:\s+(\d+)\s+test/)?.[1]);
  report.selectedTests=selected;
  if(listing.exitCode!==0||selected!==expectedTests)throw Error('Diagnostic selection must contain exactly '+expectedTests+' tests, received '+selected+'. No browser scenario executed.');
  const buildCommand=process.platform==='win32'?{file:process.env.ComSpec||'cmd.exe',args:['/d','/s','/c','npm run build']}:{file:'npm',args:['run','build']};
  if((await run(buildCommand.file,buildCommand.args,'Build the exact checked-out source')).exitCode!==0)throw Error('Build failed.');
  // Fresh synthetic SQLite only. Do not reopen a prior qualification database.
  await new Promise((resolve,reject)=>{const probe=portProbe();probe.once('error',reject);probe.listen(4173,'127.0.0.1',()=>probe.close(resolve));});
  serverLog=openSync(path.join(scratch,'server.log'),'a');
  server=spawn(process.execPath,['scripts/dev-server.mjs'],{cwd:repo,env:{...process.env,OPEN_BROWSER:'0',PORT:'4173',ECO_DATA_FILE:path.join(scratch,'diagnostic.sqlite')},stdio:['ignore',serverLog,serverLog],windowsHide:true});
  server.on('error',error=>{report.serverError=String(error);});
  let health;
  for(let i=0;i<45;i++){
    if(report.serverError)throw Error(report.serverError);
    if(server.exitCode!==null)throw Error('The isolated diagnostic server stopped.');
    try{const r=await fetch('http://127.0.0.1:4173/health',{signal:AbortSignal.timeout(2000)});if(r.ok){health=await r.json();break;}}catch{}
    await pause(1000);
  }
  if(!health)throw Error('Isolated server /health unavailable.');
  const release=JSON.parse(await readFile(path.join(repo,'docs','release','CURRENT_RELEASE_CONTRACT.json'),'utf8'));
  for(const field of ['version','buildId','pwaCache','schemaVersion','policyVersion'])if(health[field]!==release.release[field])throw Error('Local release mismatch: '+field);
  if(health.realMoneyEnabled!==false)throw Error('Synthetic diagnosis requires realMoneyEnabled=false.');
  report.localSourceBinding={sourceSha:report.sourceSha,trackedSourceClean:true,serverPid:server.pid,healthCommitSha:health.commitSha,authority:'CLEAN_CHECKOUT_AND_OWN_LOCAL_BUILD; NOT_PRODUCTION_ATTESTATION'};
  report.localHealth=health;
  const execution=await run(process.execPath,[...testArgs,'--retries=0','--output='+path.join(output,'browser')],scope==='sovereign-chromium'?'Six unchanged sovereign scenarios on installed Chromium, including real Local Room DataChannel and A01 callbacks':'One instrumented two-manager scenario; unchanged five-second assertions');
  const summary=execution.captured.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g,'');
  const count=kind=>Number([...summary.matchAll(new RegExp('(\\d+) '+kind+'\\b','g'))].at(-1)?.[1]??0);
  report.executedTests={passed:count('passed'),failed:count('failed'),skipped:count('skipped')};
  if(report.executedTests.passed+report.executedTests.failed!==expectedTests||report.executedTests.skipped!==0){
    report.testResult=report.executedTests.passed+report.executedTests.failed>0?'INCOMPLETE':'NOT_EXECUTED';
    throw Error('Expected '+expectedTests+' executed tests with zero skips. This diagnostic is incomplete; preserve its actual counts.');
  }
  report.testResult=execution.exitCode===0&&report.executedTests.passed===expectedTests?'PASS':'FAIL';
  if(scope==='sovereign-chromium')report.webkitResult='NOT_EXECUTED_BY_THIS_DIAGNOSTIC';
  // A diagnostic PASS cannot replace 657 Node / Chromium 8 / WebKit 6.
  report.status='DIAGNOSTIC_COMPLETED';if(report.testResult!=='PASS')process.exitCode=1;
}catch(error){
  report.status='DIAGNOSTIC_ERROR';report.testResult=report.testResult??'NOT_EXECUTED';report.error=String(error?.stack??error);process.exitCode=1;
  console.error('\n[Eco-System diagnostic] '+report.error);
}finally{
  if(server&&server.exitCode===null)server.kill();
  if(serverLog!==undefined)closeSync(serverLog);
  await mkdir(output,{recursive:true});
  report.completedAt=new Date().toISOString();
  const reportPath=path.join(output,'diagnostic-report.json');
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n','utf8');
  console.log('\nDiagnostic report: '+reportPath);
  console.log('Status: '+report.status+' | Test: '+String(report.testResult)+' | Source: '+String(report.sourceSha));
  console.log('Diagnostic only. The publication HOLD and full qualification remain required.');
}
