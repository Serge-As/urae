import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFinancialRecap,buildSessionRecap,buildClosingCarryover} from '../.build/packages/recap-engine/src/index.js';

test('financial recap preserves automatic source while allowing governed manual display override',()=>{
  const r=buildFinancialRecap({
    columns:[
      {id:'savings',label:'Épargne',polarity:'POSITIVE',sourceRubricId:'r-savings'},
      {id:'debt',label:'Reste dettes',polarity:'NEGATIVE',sourceRubricId:'r-loan'},
      {id:'manual_bonus',label:'Ajustement positif',polarity:'POSITIVE',manualOnly:true}
    ],
    members:[{membershipId:'m1',displayName:'Pauline'}],
    cells:[
      {membershipId:'m1',columnId:'savings',automaticAmount:24500,manualOverride:22000,adjustmentReason:'Décision de clôture validée'},
      {membershipId:'m1',columnId:'debt',automaticAmount:5000},
      {membershipId:'m1',columnId:'manual_bonus',manualOverride:1000,adjustmentReason:'Rubrique exceptionnelle'}
    ]
  });
  const row=r.rows[0],saving=row.cells.find(x=>x.columnId==='savings');
  assert.equal(saving.automaticAmount,24500);assert.equal(saving.finalAmount,22000);assert.equal(saving.sourceMode,'MANUAL_OVERRIDE');
  assert.equal(row.positiveTotal,23000);assert.equal(row.negativeTotal,5000);assert.equal(row.total,18000);
});

test('session recap confronts every rubric inflow and outflow and exposes releasable balances',()=>{
  const r=buildSessionRecap({openingCash:10000,countedClosing:12000,rubrics:[
    {rubricId:'collation',label:'Collation',inflow:20000,outflow:18000,expectedInflow:22000,releaseAtClose:true},
    {rubricId:'tontine',label:'Tontine 2 000',inflow:40000,outflow:40000,expectedInflow:40000,releaseAtClose:true},
    {rubricId:'secours',label:'Secours',inflow:10000,outflow:1000,expectedInflow:12000,releaseAtClose:false}
  ]});
  assert.equal(r.totalInflow,70000);assert.equal(r.totalOutflow,59000);assert.equal(r.theoreticalClosing,21000);assert.equal(r.variance,-9000);
  assert.equal(r.rubrics.find(x=>x.rubricId==='collation').shortfall,2000);
  assert.equal(r.rubrics.find(x=>x.rubricId==='collation').releasableAmount,2000);
  assert.equal(r.rubrics.find(x=>x.rubricId==='tontine').releasableAmount,0);
});

test('closing carries structured Secours and Project funds into next exercise opening cash',()=>{
  const r=buildClosingCarryover({closingCash:303578,funds:[
    {fundCode:'SECOURS',label:'Fonds Secours',carryForward:true,memberReserves:[{membershipId:'m1',amount:12000},{membershipId:'m2',amount:18000}],unassignedAmount:6000},
    {fundCode:'PROJET',label:'Caisse Projet',carryForward:true,unassignedAmount:50000},
    {fundCode:'COLLATION',label:'Collation',carryForward:false,unassignedAmount:5000}
  ]});
  assert.equal(r.funds.find(x=>x.fundCode==='SECOURS').fundTotal,36000);
  assert.equal(r.carriedFundsTotal,86000);assert.equal(r.nextExerciseOpeningCash,303578);assert.equal(r.unallocatedCash,217578);
});

test('carryover cannot promise more structured funds than physical closing cash',()=>{
  assert.throws(()=>buildClosingCarryover({closingCash:10000,funds:[{fundCode:'S',label:'Secours',carryForward:true,unassignedAmount:11000}]}),/CARRYOVER_FUNDS_EXCEED_CLOSING_CASH/);
});
