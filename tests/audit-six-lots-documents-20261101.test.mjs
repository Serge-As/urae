import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildXlsx,sheetsForPrint} from '../apps/web/src/xlsx-export.js';
import {projectRubricMatrix,rubricUnitLabel} from '../apps/web/src/rubric-matrix.js';
import {selectHomePriorities} from '../apps/web/src/home-priorities.js';
import {checkContribution} from '../scripts/contribution-gate.mjs';
import {allocateSavingsYield} from '../.build/packages/savings-yield/src/index.js';
import {buildExerciseClosingPlan} from '../.build/packages/exercise/src/index.js';
function entries(bytes){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),out=new Map();let at=0;while(view.getUint32(at,true)===0x04034b50){const len=view.getUint32(at+18,true),names=view.getUint16(at+26,true),extra=view.getUint16(at+28,true),name=new TextDecoder().decode(bytes.slice(at+30,at+30+names)),start=at+30+names+extra;out.set(name,new TextDecoder().decode(bytes.slice(start,start+len)));at=start+len;}assert.equal(view.getUint32(at,true),0x02014b50);return out;}
test('real XLSX has OOXML relationships, integer amounts and inline text that cannot execute a spreadsheet formula',()=>{
 const bytes=buildXlsx([{name:'Données',rows:[['Membre','XAF'],['=HYPERLINK("malicious")',5000],['Élodie & Serge',0]]}]),files=entries(bytes);assert.equal(files.size,5);assert.ok(files.get('[Content_Types].xml').includes('spreadsheetml.sheet'));assert.ok(files.get('xl/worksheets/sheet1.xml').includes('t="inlineStr"'));assert.ok(!files.get('xl/worksheets/sheet1.xml').includes('<f>'));assert.match(files.get('xl/worksheets/sheet1.xml'),/<v>5000<\/v>/);assert.ok(files.get('xl/worksheets/sheet1.xml').includes('Élodie &amp; Serge'));
 assert.throws(()=>buildXlsx([{name:'Invalid/name',rows:[]}]),/INVALID_SHEET/);assert.throws(()=>buildXlsx([{name:'A',rows:[[1.25]]}]),/INVALID_XAF_CELL/);
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/six-lots-xlsx-synthetic.xlsx',bytes);
});
test('member workbook contains only the authorized member projection and source references',()=>{
 const sheets=sheetsForPrint('MEMBER_SHEET',{group:{name:'Test'},member:{displayName:'Serge'},lot:'synthetic',generatedAt:'2026-11-01',byRubric:[{rubricName:'Épargne',total:5000}],receipts:[{meetingName:'Réunion',rubricName:'Épargne',netAmount:5000,receiptId:'r-own'}]});assert.equal(sheets.length,2);assert.ok(JSON.stringify(sheets).includes('r-own'));assert.ok(!JSON.stringify(sheets).includes('other-member'));assert.ok(JSON.stringify(sheets).includes('confirmation'));
});
test('rubric period matrix aggregates once, preserves net corrections and separates non-cash units',()=>{
 const input={rubricId:'r',meetings:[{id:'s1',title:'Janvier',scheduledAt:'2026-01-01'},{id:'s2',title:'Février',scheduledAt:'2026-02-01'}],members:[{id:'a'},{id:'b'}],receipts:[{membershipId:'a',rubricId:'r',meetingId:'s1',netAmount:5000},{membershipId:'a',rubricId:'r',meetingId:'s1',netAmount:-2000},{membershipId:'b',rubricId:'r',meetingId:'s2',netAmount:7000},{membershipId:'a',rubricId:'other',meetingId:'s1',netAmount:999999}]};
 assert.equal(projectRubricMatrix(input).total,10000);const selected=projectRubricMatrix({...input,to:'2026-01-31',contributorsOnly:true});assert.equal(selected.rows.length,1);assert.equal(selected.total,3000);assert.equal(selected.columns.length,1);assert.match(rubricUnitLabel({facets:{medium:'IN_KIND'}}),/quantités séparées/);
});
test('home keeps all critical alerts, only authorized group items and a truthful count of remaining actions',()=>{
 const items=Array.from({length:8},(_,i)=>({id:String(i),groupId:'g',status:'open',priority:i<4?'CRITICAL':'HIGH'}));items.push({id:'private',groupId:'other',status:'open',priority:'CRITICAL'});const selected=selectHomePriorities(items,'g');assert.equal(selected.visible.length,4);assert.equal(selected.remaining,4);assert.ok(selected.visible.every(x=>x.groupId==='g'));assert.equal(selectHomePriorities([{...items[0],status:'completed'}],'g').total,0);
});
test('contribution registry rejects missing, empty and escaping proofs with explicit owners',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'eco-rules-'));try{fs.writeFileSync(path.join(root,'proof.mjs'),'export const proof=true;');const rule={id:'FINANCE',patterns:['finance/'],owner:'Ledger',invariants:['preserve'],proofs:['proof.mjs']};assert.deepEqual(checkContribution({files:['finance/a'],rules:[rule],root}).errors,[]);for(const proof of ['missing.mjs','../outside.mjs'])assert.ok(checkContribution({files:['finance/a'],rules:[{...rule,proofs:[proof]}],root}).errors.length);assert.ok(checkContribution({files:['finance/a'],rules:[{...rule,owner:''}],root}).errors.length);}finally{fs.rmSync(root,{recursive:true});}
});
test('generated savings pools and closing plans conserve integer money across 120 deterministic uneven distributions',()=>{
 let state=37;const random=n=>{state=(state*1664525+1013904223)>>>0;return state%n;};
 for(let run=0;run<120;run++){const interestPool=random(50000)+1,deposits=Array.from({length:7},(_,i)=>({id:'d'+i,memberId:'m'+i,amount:random(100000)+1,periodKey:'p'+i%3})),allocated=allocateSavingsYield({interestPool,deposits,coefficients:{p0:12,p1:5,p2:1}});assert.equal(allocated.distributedInterest,interestPool);assert.equal(allocated.members.reduce((n,x)=>n+x.interest,0),interestPool);assert.ok(allocated.members.every(x=>Number.isSafeInteger(x.interest)));
 const members=allocated.members.map(m=>({membershipId:m.memberId,principal:m.principal,interest:m.interest})),cash=members.reduce((n,m)=>n+m.principal+m.interest,0),plan=buildExerciseClosingPlan({closingCash:cash,members,principalDisposition:'RETURN_TO_MEMBER',interestDisposition:'CARRY_FORWARD'});assert.equal(plan.memberPaidTotal,0);assert.equal(plan.cashOutTotal+plan.nextExerciseOpeningCash,cash);assert.equal(plan.memberAllocatedTotal,cash);}
});
