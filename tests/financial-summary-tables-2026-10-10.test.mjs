import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectDebtEvolution,projectSavingsDeposits} from '../apps/web/src/financial-summary-tables.js';

test('debt recap deduplicates revisions while preserving distinct loans and member totals',()=>{
 const data={meetings:[{id:'s1'},{id:'s2'}],loanDebts:[{loanId:'l1',memberId:'a',principal:5000,interest:0,totalDue:5000},{loanId:'l1',memberId:'a',principal:5000,interest:0,totalDue:5000},{loanId:'l2',memberId:'a',principal:700,interest:70,totalDue:770}],loanPeriods:[{loanId:'l1',memberId:'a',meetingId:'s1',principalAfter:6000,totalDebtAfter:6000,updatedAt:'2026-10-01'},{loanId:'l1',memberId:'a',meetingId:'s1',principalAfter:5000,totalDebtAfter:5000,updatedAt:'2026-10-02'}]};
 const recap=projectDebtEvolution(data);assert.equal(recap.members.length,1);assert.equal(recap.members[0].loans.length,2);assert.equal(recap.sessionTotals[0].principal,5000);assert.equal(recap.latestTotals.principal,5700);assert.equal(recap.latestTotals.due,5770);
});

test('savings recap gives each membership all funds and one exact subtotal without merging equal names',()=>{
 const members=[{id:'a',displayName:'Martin',memberNumber:9},{id:'b',displayName:'Martin',memberNumber:14}];
 const deposits=[{id:'d1',memberId:'a',fund:'CLASSIC',amount:100000},{id:'d2',memberId:'a',fund:'CLASSIC',amount:5000},{id:'d3',memberId:'a',fund:'SCHOOL',amount:20000},{id:'d3',memberId:'a',fund:'SCHOOL',amount:20000},{id:'d4',memberId:'b',fund:'SCHOOL',amount:50000}];
 const recap=projectSavingsDeposits({members,deposits});assert.equal(recap.members.length,2);assert.equal(recap.members[0].rubrics.length,2);assert.equal(recap.members[0].total,125000);assert.equal(recap.members[1].total,50000);assert.equal(recap.total,175000);assert.equal(recap.depositCount,4);
 const school=projectSavingsDeposits({members,deposits,rubricFilter:'SCHOOL'});assert.equal(school.total,70000);assert.ok(school.members.every(m=>m.rubrics.length===1));
});
