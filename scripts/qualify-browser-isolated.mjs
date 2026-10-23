// Qualification only: every file gets a separate disposable SQLite and process.
// Production authentication limits and application code remain unchanged.
import {spawn} from 'node:child_process';
import {mkdir,open,readFile} from 'node:fs/promises';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
const browser=process.argv.find(x=>x.startsWith('--browser='))?.split('=')[1];
const grep=process.argv.find(x=>x.startsWith('--grep='));
const files=process.argv.slice(2).filter(x=>!x.startsWith('--'));
if(!['chromium','webkit'].includes(browser)||!files.length||files.some(x=>!/^tests\/browser\/[\w.-]+\.spec\.mjs$/.test(x)))throw Error('Expected --browser=chromium|webkit and explicit test files');
try{await fetch('http://127.0.0.1:4173/health',{signal:AbortSignal.timeout(1000)});throw Error('QUALIFICATION_PORT_ALREADY_IN_USE');}catch(e){if(e.message==='QUALIFICATION_PORT_ALREADY_IN_USE')throw e;}
await mkdir('artifacts/browser-isolated',{recursive:true});
const runId=(process.env.GITHUB_RUN_ID||randomUUID())+'-'+(process.env.GITHUB_RUN_ATTEMPT||'1');
let passed=0;
for(const file of files){
 const slug=file.split('/').at(-1).replace('.spec.mjs',''),prefix=`artifacts/browser-isolated/${browser}-${slug}`;
 const log=await open(prefix+'.log','w');
 const server=spawn(process.execPath,['scripts/dev-server.mjs'],{env:{...process.env,OPEN_BROWSER:'0',PORT:'4173',ECO_DATA_FILE:`.data/qualification-${runId}-${browser}-${slug}.sqlite`},stdio:['ignore',log.fd,log.fd],windowsHide:true});
 const serverDone=once(server,'exit');let serverExited=false;serverDone.then(()=>{serverExited=true;});
 try{
  let ready=false;
  for(let i=0;i<80;i++){if(serverExited)break;try{const r=await fetch('http://127.0.0.1:4173/health',{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}
  if(!ready)throw Error('ISOLATED_SERVER_NOT_READY:'+await readFile(prefix+'.log','utf8'));
  const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test',file,'--browser='+browser,'--workers=1','--reporter=line,json','--output=test-results/'+browser+'-'+slug,...(grep?[grep]:[])],{env:{...process.env,ECO_WEBKIT_BASE_URL:'http://127.0.0.1:4173',PLAYWRIGHT_JSON_OUTPUT_NAME:prefix+'.json'},stdio:'inherit',windowsHide:true});
  const [code,signal]=await once(child,'exit');if(code!==0)throw Error('BROWSER_FILE_FAILED:'+file+':exit='+code+':signal='+signal);
  const report=JSON.parse(await readFile(prefix+'.json','utf8'));
  if(report.stats.unexpected||report.stats.skipped||report.stats.flaky||!report.stats.expected)throw Error('INCOMPLETE_OR_FLAKY_BROWSER_QUALIFICATION:'+file);
  passed+=report.stats.expected;
 }finally{
  if(!serverExited){server.kill();const stopped=await Promise.race([serverDone.then(()=>true),new Promise(r=>setTimeout(()=>r(false),3000))]);if(!stopped){server.kill('SIGKILL');await serverDone;}}
  await log.close();
 }
}
console.log(`ISOLATED_BROWSER_QUALIFICATION_PASS browser=${browser} files=${files.length} passed=${passed} failed=0 skipped=0`);
