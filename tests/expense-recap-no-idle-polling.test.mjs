import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';

const sourcePath='apps/web/src/expense-recap-ui.ts';
const baselineRef=process.env.ECO_EXPENSE_RECAP_SOURCE_REF;
if(baselineRef&&!/^[a-f0-9]{40}$/.test(baselineRef))throw Error('Expense regression source must be an exact Git commit.');
const source=baselineRef?execFileSync('git',['show',baselineRef+':'+sourcePath],{encoding:'utf8',windowsHide:true}):fs.readFileSync(sourcePath,'utf8');
const compiled=ts.transpileModule(source,{fileName:sourcePath,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
const errors=compiled.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error)??[];
if(errors.length)throw Error(ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:()=>process.cwd(),getCanonicalFileName:x=>x,getNewLine:()=>'\n'}));

// Execute the real component. Mutation notifications run after the current
// stack, as in a browser; an observer must not read its own appended card as
// a new canonical update. Fake time exposes repeated scheduled work without
// waiting on real timers or changing the application's 120 ms delay.
function fixture({meeting=false}={}){
  let now=0,nextTimer=1;
  const timers=new Map(),observations=new Map(),pending=new Map(),roots=new Map(),listeners=new Map(),requests=[];
  const notify=(root,node,kind)=>{
    const observer=observations.get(root);if(!observer)return;
    const records=pending.get(observer)??[];
    records.push({target:root,addedNodes:kind==='add'?[node]:[],removedNodes:kind==='remove'?[node]:[]});
    pending.set(observer,records);
    if(records.length===1)queueMicrotask(()=>{
      const batch=pending.get(observer)??[];pending.delete(observer);observer.callback(batch);
    });
  };
  class Element{
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.parent=null;this.textContent='';this.value='';}
    append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);notify(this,node,'add');}}
    remove(){if(!this.parent)return;const parent=this.parent;parent.children=parent.children.filter(x=>x!==this);this.parent=null;notify(parent,this,'remove');}
    querySelector(selector){const key=selector==='[data-expense-recap]'?'expenseRecap':selector==='[data-meeting-expenses]'?'meetingExpenses':undefined;return this.children.find(x=>key&&x.dataset[key]==='1')??null;}
    addEventListener(type,callback){listeners.set(this.id+':'+type,callback);}
  }
  class Observer{
    constructor(callback){this.callback=callback;}
    observe(root){observations.set(root,this);}
    disconnect(){for(const [root,observer]of observations)if(observer===this)observations.delete(root);}
  }
  for(const id of ['recapFinance','detailBody','activeGroupSelect','languageSelect']){const root=new Element();root.id=id;roots.set(id,root);}
  roots.get('activeGroupSelect').value='synthetic-group';roots.get('languageSelect').value='fr';
  const rows=[{amount:2500,scope:'SHEET',meetingId:'synthetic-meeting',label:'Synthetic meeting expense'},
    {amount:500,scope:'BACKOFFICE',label:'Synthetic unassigned expense'}];
  const sandbox={exports:{},document:{getElementById:id=>roots.get(id),createElement:tag=>new Element(tag),addEventListener:(type,callback)=>listeners.set(type,callback)},
    Element,HTMLElement:Element,MutationObserver:Observer,location:{hash:meeting?'#detail=meeting:synthetic-meeting':''},localStorage:{getItem:()=> 'synthetic-group'},
    fetch:async(url,options)=>{requests.push({url,group:options.headers['x-active-group-id']});return{ok:true,json:async()=>rows};},
    setTimeout:(callback,ms)=>{const id=nextTimer++;timers.set(id,{callback,due:now+ms});return id;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(compiled.outputText,sandbox,{filename:sourcePath});sandbox.exports.mountExpenseRecapUI();
  const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
  const advance=async duration=>{
    const target=now+duration;await flush();
    for(let i=0;i<500;i++){
      const next=[...timers].sort((a,b)=>a[1].due-b[1].due)[0];
      if(!next||next[1].due>target){now=target;return;}
      now=next[1].due;timers.delete(next[0]);next[1].callback();await flush();
    }
    throw Error('Expense recap kept scheduling work without a real update.');
  };
  const text=node=>[node.textContent,...node.children.map(text)].join(' ');
  return{advance,requests,timers,recap:roots.get('recapFinance'),detail:roots.get('detailBody'),node:()=>new Element(),text,
    changeLanguage:()=>listeners.get('languageSelect:change')(),changeGroup:value=>{roots.get('activeGroupSelect').value=value;listeners.get('activeGroupSelect:change')();}};
}

test('expense recap performs one initial read and remains idle after rendering its own card',async()=>{
  const app=fixture();await app.advance(2400);
  assert.equal(app.requests.length,1,'an idle recap must not re-read expenses every 120 ms');
  assert.equal(app.timers.size,0,'own rendering must not leave a polling timer');
  assert.equal(app.recap.children.length,1);assert.match(app.text(app.recap),/3[\s\u202f\u00a0]?000 F CFA/);
});

test('real recap changes refresh once, keep canonical content and use the selected group',async()=>{
  const app=fixture();await app.advance(360);const canonical=app.node();canonical.textContent='Canonical finance summary';app.recap.append(canonical);
  app.recap.append(app.node());app.changeLanguage();app.changeGroup('another-synthetic-group');
  await app.advance(2400);
  assert.equal(app.requests.length,2,'coincident canonical and context updates need one new read');
  assert.equal(app.requests[1].group,'another-synthetic-group');
  assert.equal(app.requests[1].url,'/api/v1/groups/another-synthetic-group/expenses');
  assert.ok(app.recap.children.includes(canonical),'the recap projection cannot replace canonical content');
  assert.equal(app.recap.children.filter(x=>x.dataset.expenseRecap==='1').length,1);
  assert.equal(app.timers.size,0,'a real refresh must settle after replacing its own card');
});

test('meeting expense and global recap projections refresh on a real detail change without observing themselves forever',async()=>{
  const app=fixture({meeting:true});await app.advance(360);
  assert.equal(app.requests.length,2,'one initial read for each existing projection');
  assert.match(app.text(app.detail),/2[\s\u202f\u00a0]?500 F CFA/);assert.doesNotMatch(app.text(app.detail),/Synthetic unassigned expense/);
  const canonical=app.node();canonical.textContent='Canonical meeting recap';app.detail.append(canonical);await app.advance(2400);
  assert.equal(app.requests.length,4,'one real detail update refreshes both projections once');
  assert.ok(app.detail.children.includes(canonical));
  assert.equal(app.detail.children.filter(x=>x.dataset.meetingExpenses==='1').length,1);
  assert.equal(app.recap.children.filter(x=>x.dataset.expenseRecap==='1').length,1);
  assert.equal(app.timers.size,0,'the meeting and global projection must both stop scheduling reads');
});
