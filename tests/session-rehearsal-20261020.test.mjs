import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionRehearsal,parseRehearsalAmount,REHEARSAL_RUBRICS} from '../apps/web/src/session-rehearsal.js';
import {planFinancialRubricLayout,splitFinancialRubrics} from '../apps/web/src/smart-grid-view.js';
const first=REHEARSAL_RUBRICS[0].id;
test('educational amounts accept whole totals and reject ambiguous, fractional or excessive input',()=>{
  for(const [raw,expected] of [['0',0],[' 1000 ',1000],['1000000000',1000000000]])assert.equal(parseRehearsalAmount(raw),expected);
  for(const raw of ['',-1,'1.5','1e3','Infinity','1000000001','9007199254740993','1 000'])assert.throws(()=>parseRehearsalAmount(raw));
});
test('unknown exercise identities cannot create records or revisions',()=>{
  const x=createSessionRehearsal();assert.throws(()=>x.save('real-member',first,1),/MEMBER_UNKNOWN/);assert.throws(()=>x.save('Amina','real-rubric',1),/RUBRIC_UNKNOWN/);assert.equal(x.revision,0);
});
test('repeated confirmation is an exact total rather than a second addition',()=>{
  const x=createSessionRehearsal();x.save('Amina',first,1000);x.save('Amina',first,1000);assert.equal(x.total('Amina'),1000);assert.equal(x.revision,1);x.save('Amina',first,1500);assert.equal(x.total('Amina'),1500);assert.equal(x.revision,2);
});
test('general totals include all twenty categories independently of each visible complete partition',()=>{
  const x=createSessionRehearsal();REHEARSAL_RUBRICS.forEach((row,index)=>x.save('Amina',row.id,(index+1)*100));assert.equal(x.total('Amina'),21000);
  for(const mode of ['visual','senior','assisted'])for(const width of [480,768,1366]){const plan=planFinancialRubricLayout({count:20,width,mode});if(plan.recommended===null)continue;const parts=splitFinancialRubrics(REHEARSAL_RUBRICS,plan.recommended);assert.equal(new Set(parts.flat().map(x=>x.id)).size,20);assert.equal(parts.flat().length,20);assert.equal(parts.reduce((sum,rows)=>sum+rows.reduce((n,row)=>n+x.amount('Amina',row.id),0),0),21000);assert.equal(plan.fits(plan.recommended),true);}
});
test('member transition freezes the exact prior summary before any following entry',()=>{
  const x=createSessionRehearsal();x.save('Amina',first,1000);const frozen=x.visit('Boris');assert.equal(frozen.total,1000);assert.equal(frozen.nextMember,'Boris');assert.throws(()=>{frozen.lines[0].amount=7000;},TypeError);assert.throws(()=>x.save('Boris',first,750),/REVIEW_REQUIRED/);assert.equal(x.total('Boris'),0);
  assert.throws(()=>x.confirmReview(frozen.revision+1),/REVIEW_STALE/);assert.equal(x.pending,frozen);x.confirmReview(frozen.revision);x.save('Boris',first,750);assert.equal(x.total('Amina'),1000);assert.equal(x.total('Boris'),750);assert.equal(x.reviewCount,1);
});
test('cancelling review preserves prior values and continues to require the explicit transition',()=>{
  const x=createSessionRehearsal();x.save('Amina',first,1000);x.visit('Boris');assert.equal(x.cancelReview(),'Amina');assert.equal(x.total('Amina'),1000);assert.throws(()=>x.save('Boris',first,750),/REVIEW_REQUIRED/);assert.equal(x.visit('Boris').total,1000);
});
test('restarting and opening a separate exercise share no values or review state',()=>{
  const a=createSessionRehearsal(),b=createSessionRehearsal();a.save('Amina',first,2000);a.visit('Boris');assert.equal(b.total('Amina'),0);assert.equal(b.pending,null);a.reset();assert.equal(a.total('Amina'),0);assert.equal(a.pending,null);assert.equal(a.revision,0);assert.equal(a.reviewCount,0);
});
