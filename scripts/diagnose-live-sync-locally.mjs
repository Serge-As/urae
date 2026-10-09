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
const scratch=path.join(repo,'work','eco-live-sync-diagnostic-'+stamp);
const output=path.join(repo,'outputs','eco-live-sync-diagnostic-'+stamp);
const report={schemaVersion:1,kind:'LIVE_SYNC_DIAGNOSTIC_ONLY',startedAt:new Date().toISOString(),sourceSha:null,status:'IN_PROGRESS',checks:[],qualified:false,productionDeployed:false,realMoneyEnabled:false,fieldAccepted:false};
let server,serverLog;
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true}).trim();
async function run(file,args,label){
  console.log('\n[Eco-System diagnostic] '+label);
  const logPath=path.join(scratch,String(report.checks.length+1).padStart(2,'0')+'.log');
  let captured='';
  const child=spawn(file,args,{cwd:repo,env:process.env,stdio:['ignore','pipe','pipe'],windowsHide:true});
  for(const [stream,destination] of [[child.stdout,process.stdout],[child.stderr,process.stderr]])stream.on('data',chunk=>{captured+=chunk.toString();destination.write(chunk);});
  const exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  await writeFile(logPath,captured,'utf8');
  report.checks.push({label,status:exitCode===0?'PASS':'FAIL',exitCode,logPath});
  return exitCode;
}
try{
  if(Number(process.versions.node.split('.')[0])<24)throw Error('Node.js 24 or newer is required.');
  report.sourceSha=git('rev-parse','HEAD');
  if(git('diff','--name-only','HEAD'))throw Error('Tracked source differs from HEAD. Preserve those changes before diagnosis.');
  const extras=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean).filter(x=>!/^(\.build|\.data|\.bir|work|outputs|test-results|playwright-report)\//.test(x));
  if(extras.length)throw Error('Untracked source: '+extras.join(', '));
  await mkdir(scratch,{recursive:true});await mkdir(output,{recursive:true});
  const installed=JSON.parse(await readFile(path.join(repo,'node_modules','@playwright','test','package.json'),'utf8'));
  if(installed.version!=='1.56.1')throw Error('The already qualified Playwright 1.56.1 installation is required.');
  const buildCommand=process.platform==='win32'?{file:process.env.ComSpec||'cmd.exe',args:['/d','/s','/c','npm run build']}:{file:'npm',args:['run','build']};
  if(await run(buildCommand.file,buildCommand.args,'Build the exact checked-out source')!==0)throw Error('Build failed.');
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
  const exitCode=await run(process.execPath,['node_modules/@playwright/test/cli.js','test','tests/browser/sovereign-multi-manager-1.5.2.14.spec.mjs','--browser=chromium','--workers=1','--grep','^distinct managers','--retries=0','--output='+path.join(output,'browser')],'One instrumented two-manager scenario; unchanged five-second assertions');
  report.testResult=exitCode===0?'PASS':'FAIL';
  // A diagnostic PASS cannot replace 654 Node / Chromium 8 / WebKit 6.
  report.status='DIAGNOSTIC_COMPLETED';if(exitCode!==0)process.exitCode=1;
}catch(error){
  report.status='DIAGNOSTIC_ERROR';report.error=String(error?.stack??error);process.exitCode=1;
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
