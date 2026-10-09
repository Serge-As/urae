#!/usr/bin/env node
// Prepared Codespaces qualification driver. It does not create a codespace or change billing.
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,open,readdir} from 'node:fs/promises';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
const repo=process.cwd(),source='a7c333699dad0d70cf0de8e2f8a841a00396d0d7';
const sourceTree='0c75c80833d78c807cc2fbef082b06f9c0c6aa7f';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const scratch=resolve(repo,'work','eco-free-linux-'+stamp),output=resolve(repo,'outputs','eco-free-linux-'+stamp);
const report={schemaVersion:1,kind:'CODESPACES_FREE_ROUTE',status:'PREPARING',sourceSha:source,sourceTree,qualified:false,productionDeployed:false,fieldAccepted:false,realMoneyEnabled:false,startedAt:new Date().toISOString(),checks:[]};
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true,timeout:60000}).trim();
let server,serverLog;
async function run(file,args,label,timeoutMs=600000){
  const logPath=resolve(output,String(report.checks.length+1).padStart(2,'0')+'.log');
  console.log('\n[ECO_FREE_LINUX] '+label);
  let captured='',timedOut=false,killTimer;
  const child=spawn(file,args,{cwd:repo,env:{...process.env},stdio:['ignore','pipe','pipe'],detached:true});
  for(const [stream,target] of [[child.stdout,process.stdout],[child.stderr,process.stderr]])stream.on('data',chunk=>{captured+=chunk.toString();target.write(chunk);});
  const timer=setTimeout(()=>{timedOut=true;try{process.kill(-child.pid,'SIGTERM');}catch{}killTimer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},3000);},timeoutMs);
  let exitCode;
  try{exitCode=await new Promise((ok,no)=>{child.once('error',no);child.once('close',ok);});}finally{clearTimeout(timer);clearTimeout(killTimer);}
  await writeFile(logPath,captured,'utf8');
  report.checks.push({label,command:[file,...args].join(' '),exitCode,timedOut,status:exitCode===0&&!timedOut?'PASS':'FAIL',logPath});
  if(timedOut||exitCode!==0)throw Error(label+(timedOut?' exceeded process limit; original test deadline unchanged':' failed: '+exitCode));
  return captured.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g,'');
}
async function stopServer(){
  if(!server)return;
  if(server.exitCode===null){
    const closed=new Promise(ok=>server.once('close',ok));
    server.kill('SIGTERM');
    await Promise.race([closed,new Promise(ok=>setTimeout(ok,3000))]);
    if(server.exitCode===null)server.kill('SIGKILL');
  }
  if(serverLog){await serverLog.close();serverLog=undefined;}
  server=undefined;
}
async function publishEvidence(){
  const branch='evidence/free-linux-'+stamp.toLowerCase(),worktree=resolve(scratch,'evidence-worktree');
  execFileSync('git',['fetch','origin','evidence/cloud-qualification-20261009-a7c3336'],{cwd:repo,stdio:'pipe',timeout:60000});
  execFileSync('git',['worktree','add','--detach',worktree,'e71098c5b6ac5cbbc2f23eadddbd7bef3b2d70b5'],{cwd:repo,stdio:'pipe',timeout:60000});
  const relative='docs/qualification/free-linux/'+stamp,dest=resolve(worktree,relative);
  await mkdir(dest,{recursive:true});
  for(const check of report.checks)await writeFile(resolve(dest,basename(check.logPath)),await readFile(check.logPath));
  try{
    const nativeRoot=resolve(output,'full-qualification'),dirs=(await readdir(nativeRoot,{withFileTypes:true})).filter(entry=>entry.isDirectory()&&entry.name.startsWith('eco-qualification-'));
    if(dirs.length===1){
      const bytes=await readFile(resolve(nativeRoot,dirs[0].name,'qualification-report.json')),native=JSON.parse(bytes);
      await writeFile(resolve(dest,'qualification-report.json'),bytes);
      report.preservedNativeReportSha256=createHash('sha256').update(bytes).digest('hex');
      for(let i=0;i<(native.checks??[]).length;i++)await writeFile(resolve(dest,'native-'+String(i+1).padStart(2,'0')+'.log'),await readFile(native.checks[i].logPath));
    }
  }catch(error){report.nativeEvidenceCopyError=String(error);}
  if(report.qualified&&report.archive)await writeFile(resolve(dest,basename(report.archive.path)),await readFile(report.archive.path));
  report.controllerSha256=createHash('sha256').update(await readFile(resolve(process.argv[1]))).digest('hex');
  report.publication={status:'PREPARED_FOR_PUSH',branch,path:relative,documentaryCommitIsNotTestedSource:true};
  await writeFile(resolve(dest,'free-linux-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
  execFileSync('git',['add','--',relative],{cwd:worktree,stdio:'pipe',timeout:60000});
  execFileSync('git',['-c','user.name=Eco-System qualification','-c','user.email=eco-qualification@localhost','commit','-m','test: preserve free Linux qualification '+report.status+' for a7c3336 [skip ci]'],{cwd:worktree,stdio:'pipe',timeout:60000});
  const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:worktree,encoding:'utf8',timeout:60000}).trim();
  execFileSync('git',['push','origin',sha+':refs/heads/'+branch],{cwd:worktree,stdio:'pipe',timeout:60000});
  report.publication={status:'PUSHED',branch,commitSha:sha,path:relative,documentaryCommitIsNotTestedSource:true,url:'https://github.com/SergeDelor/urae/tree/'+sha+'/'+relative};
}
async function oneScenario(browser,phrase,label){
  const args=['node_modules/@playwright/test/cli.js','test','tests/browser/eco-system-webkit-sovereign-offline-1.5.2.9.spec.mjs','--browser='+browser,'--workers=1','--retries=0','--grep',phrase];
  const list=await run(process.execPath,[...args,'--list'],label+' selection',90000);
  if(Number(list.match(/Total:\s+(\d+)\s+test/)?.[1])!==1)throw Error(label+' did not select exactly one unchanged test');
  const result=await run(process.execPath,[...args,'--output='+resolve(output,'preflight-'+browser)],label,90000);
  if(!/\b1 passed\b/.test(result)||/\b[1-9]\d* (?:failed|skipped|flaky|interrupted)\b/.test(result))throw Error(label+' incomplete result');
}
try{
  if(process.platform!=='linux'||process.env.CODESPACES!=='true')throw Error('This prepared route requires a Linux Codespace, after included usage and zero paid spending have been verified.');
  if(!process.argv.includes('--included-usage-confirmed')||process.argv.slice(2).some(value=>value!=='--included-usage-confirmed'))throw Error('Included compute/storage and blocked paid spending must be verified in the account before this run.');
  if(process.versions.node!=='24.19.0')throw Error('The prepared runtime is Node 24.19.0; bootstrap it before launching.');
  if(git('rev-parse','HEAD')!==source||git('rev-parse','HEAD^{tree}')!==sourceTree||git('diff','--name-only','HEAD'))throw Error('Expected exact clean a7 source. Do not reset existing work.');
  const extras=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean).filter(value=>!/^(\.build|\.data|\.bir|work|outputs|test-results|playwright-report)\//.test(value));
  if(extras.length)throw Error('Untracked source would invalidate source binding: '+extras.join(', '));
  await mkdir(scratch,{recursive:true});await mkdir(output,{recursive:true});
  report.platform=process.platform;report.node=process.version;report.codespaceName=process.env.CODESPACE_NAME;
  report.status='IN_PROGRESS';
  await run('npm',['ci','--ignore-scripts'],'Install exact lockfile');
  const playwright=JSON.parse(await readFile(resolve(repo,'node_modules/@playwright/test/package.json'),'utf8'));
  if(playwright.version!=='1.56.1')throw Error('Expected locked Playwright 1.56.1; never override it with 1.55.0.');
  report.playwrightVersion=playwright.version;
  await run(process.execPath,['node_modules/@playwright/test/cli.js','install','--with-deps','chromium','webkit'],'Install pinned browsers and Linux dependencies');
  await run('npm',['run','build'],'Build exact a7 source');
  await new Promise((ok,no)=>{const probe=createServer();probe.once('error',no);probe.listen(4173,'127.0.0.1',()=>probe.close(ok));});
  serverLog=await open(resolve(scratch,'preflight-server.log'),'a');
  server=spawn(process.execPath,['scripts/dev-server.mjs'],{cwd:repo,env:{...process.env,OPEN_BROWSER:'0',PORT:'4173',ECO_DATA_FILE:resolve(scratch,'preflight.sqlite')},stdio:['ignore',serverLog.fd,serverLog.fd]});
  let serverError;server.on('error',error=>{serverError=String(error);});
  let health;
  for(let i=0;i<45;i++){
    if(serverError)throw Error(serverError);
    if(server.exitCode!==null)throw Error('Own synthetic server stopped');
    try{const r=await fetch('http://127.0.0.1:4173/health',{signal:AbortSignal.timeout(2000)});if(r.ok){health=await r.json();break;}}catch{}
    await new Promise(ok=>setTimeout(ok,1000));
  }
  if(!health||health.realMoneyEnabled!==false)throw Error('Synthetic /health unavailable or money guard not false');
  const release=JSON.parse(await readFile(resolve(repo,'docs/release/CURRENT_RELEASE_CONTRACT.json'),'utf8'));
  for(const name of ['version','buildId','pwaCache','schemaVersion','policyVersion'])if(health[name]!==release.release[name])throw Error('Local release identity mismatch: '+name);
  report.preflightSourceBinding={checkedOutSha:source,tree:sourceTree,trackedSourceClean:true,serverPid:server.pid,healthCommitSha:health.commitSha,authority:'CLEAN_CHECKOUT_AND_OWN_SYNTHETIC_BUILD; NOT_PRODUCTION'};
  await oneScenario('webkit','WebKit opens a serverless Eco Local Room','Real WebKit Local Room packet');
  await oneScenario('chromium','WebKit decodes an Eco QR','Real Chromium QR decode');
  await stopServer();
  // Reuse the canonical full qualifier: same 657 Node / 8 Chromium / 6 WebKit and archive gates.
  const fullRoot=resolve(output,'full-qualification');
  const fullLog=await run(process.execPath,['scripts/qualify-eco-locally.mjs','--skip-browser-install','--output-root='+fullRoot],'Single full canonical qualification',1800000);
  if(/\b[1-9]\d* (?:skipped|flaky|interrupted|did not run)\b/.test(fullLog))throw Error('Full qualification included skipped/flaky/incomplete browser execution');
  const nativePath=fullLog.match(/Qualification report:\s*(.+)/)?.[1]?.trim();
  if(!nativePath||!nativePath.startsWith(fullRoot+'/'))throw Error('Native report not bound to this output directory');
  const native=JSON.parse(await readFile(nativePath,'utf8'));
  if(native.status!=='PASS'||native.sourceSha!==source||native.node?.tests!==657||native.node?.passed!==657||native.chromium?.passed!==8||native.webkit?.passed!==6||!native.archive)throw Error('Native qualification did not pass every exact gate');
  const archiveBytes=await readFile(native.archive.path),archiveSha=createHash('sha256').update(archiveBytes).digest('hex');
  if(archiveSha!==native.archive.sha256||basename(native.archive.path)!=='source-'+source+'.tar.gz')throw Error('Independent source archive read/hash mismatch');
  // Preserve the native logs directly with the report instead of deep recursive UI copies.
  for(let i=0;i<native.checks.length;i++)await writeFile(resolve(output,'full-'+String(i+1).padStart(2,'0')+'.log'),await readFile(native.checks[i].logPath));
  report.nativeQualification={path:nativePath,sha256:createHash('sha256').update(await readFile(nativePath)).digest('hex'),sourceSha:source,node:native.node,chromium:native.chromium,webkit:native.webkit};
  report.archive={path:native.archive.path,sha256:archiveSha,bytes:archiveBytes.length};
  report.status='PASS';report.qualified=true;
}catch(error){report.status='FAIL';report.error=String(error?.stack??error);process.exitCode=1;console.error('[ECO_FREE_LINUX] '+report.error);}
finally{
  try{await stopServer();}catch(error){report.cleanupError=String(error);}
  await mkdir(output,{recursive:true});report.completedAt=new Date().toISOString();
  if(report.platform==='linux'&&report.codespaceName){try{await publishEvidence();}catch{report.publication={status:'PUSH_FAILED',error:'Evidence remains in Codespace outputs; no source branch moved.'};}}
 
  const reportPath=resolve(output,'free-linux-report.json');
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n','utf8');
  console.log('ECO_FREE_LINUX_SUMMARY '+JSON.stringify({status:report.status,qualified:report.qualified,sourceSha:report.sourceSha,checks:report.checks.map(({label,status})=>({label,status})),nativeQualification:report.nativeQualification,archive:report.archive,publication:report.publication,error:report.error,reportPath}));
  console.log('Prepared route only: no billing change, runner registration, Actions dispatch, production D1 or R2 mutation.');
}
