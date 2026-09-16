import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateWorkbookYieldPipeline,allocateCapitalTimeYield,allocateAttributedProductiveYield} from '../.build/packages/savings-yield/src/index.js';

const classic=[{"id":"m1-jan","memberId":"m1","periodKey":"JAN","amount":150,"fund":"CLASSIC","session":1},{"id":"m1-apr","memberId":"m1","periodKey":"APR","amount":500000,"fund":"CLASSIC","session":4},{"id":"m1-oct","memberId":"m1","periodKey":"OCT","amount":1000,"fund":"CLASSIC","session":10},{"id":"m2-jan","memberId":"m2","periodKey":"JAN","amount":236,"fund":"CLASSIC","session":1},{"id":"m2-apr","memberId":"m2","periodKey":"APR","amount":90000,"fund":"CLASSIC","session":4},{"id":"m2-oct","memberId":"m2","periodKey":"OCT","amount":500,"fund":"CLASSIC","session":10},{"id":"m3-jan","memberId":"m3","periodKey":"JAN","amount":55,"fund":"CLASSIC","session":1},{"id":"m3-apr","memberId":"m3","periodKey":"APR","amount":45000,"fund":"CLASSIC","session":4},{"id":"m3-oct","memberId":"m3","periodKey":"OCT","amount":600,"fund":"CLASSIC","session":10},{"id":"m4-jan","memberId":"m4","periodKey":"JAN","amount":5699,"fund":"CLASSIC","session":1},{"id":"m4-apr","memberId":"m4","periodKey":"APR","amount":6321100,"fund":"CLASSIC","session":4},{"id":"m4-oct","memberId":"m4","periodKey":"OCT","amount":88,"fund":"CLASSIC","session":10},{"id":"m5-jan","memberId":"m5","periodKey":"JAN","amount":22,"fund":"CLASSIC","session":1},{"id":"m5-apr","memberId":"m5","periodKey":"APR","amount":8000,"fund":"CLASSIC","session":4},{"id":"m5-oct","memberId":"m5","periodKey":"OCT","amount":66,"fund":"CLASSIC","session":10},{"id":"m6-jan","memberId":"m6","periodKey":"JAN","amount":88,"fund":"CLASSIC","session":1},{"id":"m6-apr","memberId":"m6","periodKey":"APR","amount":36971,"fund":"CLASSIC","session":4},{"id":"m6-oct","memberId":"m6","periodKey":"OCT","amount":7000,"fund":"CLASSIC","session":10},{"id":"m7-jan","memberId":"m7","periodKey":"JAN","amount":99,"fund":"CLASSIC","session":1},{"id":"m7-oct","memberId":"m7","periodKey":"OCT","amount":233265,"fund":"CLASSIC","session":10},{"id":"m8-jan","memberId":"m8","periodKey":"JAN","amount":890,"fund":"CLASSIC","session":1},{"id":"m8-oct","memberId":"m8","periodKey":"OCT","amount":233,"fund":"CLASSIC","session":10},{"id":"m9-jan","memberId":"m9","periodKey":"JAN","amount":99990,"fund":"CLASSIC","session":1},{"id":"m9-oct","memberId":"m9","periodKey":"OCT","amount":55,"fund":"CLASSIC","session":10},{"id":"m10-jan","memberId":"m10","periodKey":"JAN","amount":25,"fund":"CLASSIC","session":1},{"id":"m10-apr","memberId":"m10","periodKey":"APR","amount":6312100,"fund":"CLASSIC","session":4},{"id":"m10-oct","memberId":"m10","periodKey":"OCT","amount":66,"fund":"CLASSIC","session":10},{"id":"m11-jan","memberId":"m11","periodKey":"JAN","amount":85320,"fund":"CLASSIC","session":1},{"id":"m11-apr","memberId":"m11","periodKey":"APR","amount":25910,"fund":"CLASSIC","session":4},{"id":"m11-oct","memberId":"m11","periodKey":"OCT","amount":44,"fund":"CLASSIC","session":10},{"id":"m12-jan","memberId":"m12","periodKey":"JAN","amount":855,"fund":"CLASSIC","session":1},{"id":"m12-oct","memberId":"m12","periodKey":"OCT","amount":33,"fund":"CLASSIC","session":10},{"id":"m13-jan","memberId":"m13","periodKey":"JAN","amount":956610,"fund":"CLASSIC","session":1},{"id":"m13-oct","memberId":"m13","periodKey":"OCT","amount":7,"fund":"CLASSIC","session":10},{"id":"m14-jan","memberId":"m14","periodKey":"JAN","amount":305,"fund":"CLASSIC","session":1},{"id":"m14-oct","memberId":"m14","periodKey":"OCT","amount":8,"fund":"CLASSIC","session":10},{"id":"m15-jan","memberId":"m15","periodKey":"JAN","amount":6985,"fund":"CLASSIC","session":1},{"id":"m15-oct","memberId":"m15","periodKey":"OCT","amount":996,"fund":"CLASSIC","session":10},{"id":"m16-jan","memberId":"m16","periodKey":"JAN","amount":54780,"fund":"CLASSIC","session":1},{"id":"m16-oct","memberId":"m16","periodKey":"OCT","amount":77,"fund":"CLASSIC","session":10},{"id":"m17-jan","memberId":"m17","periodKey":"JAN","amount":920,"fund":"CLASSIC","session":1},{"id":"m17-oct","memberId":"m17","periodKey":"OCT","amount":200,"fund":"CLASSIC","session":10},{"id":"m18-jan","memberId":"m18","periodKey":"JAN","amount":32585,"fund":"CLASSIC","session":1},{"id":"m18-oct","memberId":"m18","periodKey":"OCT","amount":2000,"fund":"CLASSIC","session":10},{"id":"m19-jan","memberId":"m19","periodKey":"JAN","amount":98520,"fund":"CLASSIC","session":1},{"id":"m19-oct","memberId":"m19","periodKey":"OCT","amount":5000,"fund":"CLASSIC","session":10},{"id":"m20-jan","memberId":"m20","periodKey":"JAN","amount":86,"fund":"CLASSIC","session":1},{"id":"m20-oct","memberId":"m20","periodKey":"OCT","amount":5,"fund":"CLASSIC","session":10},{"id":"m21-jan","memberId":"m21","periodKey":"JAN","amount":20,"fund":"CLASSIC","session":1},{"id":"m21-oct","memberId":"m21","periodKey":"OCT","amount":555,"fund":"CLASSIC","session":10},{"id":"m22-jan","memberId":"m22","periodKey":"JAN","amount":25,"fund":"CLASSIC","session":1},{"id":"m22-oct","memberId":"m22","periodKey":"OCT","amount":55,"fund":"CLASSIC","session":10}];
const school=[{"id":"m3-school-jan","memberId":"m3","periodKey":"JAN","amount":5000,"fund":"SCHOOL","session":1},{"id":"m6-school-nov","memberId":"m6","periodKey":"NOV","amount":5000,"fund":"SCHOOL","session":11},{"id":"m7-school-feb","memberId":"m7","periodKey":"FEB","amount":1000,"fund":"SCHOOL","session":2},{"id":"m8-school-jan","memberId":"m8","periodKey":"JAN","amount":1000000,"fund":"SCHOOL","session":1},{"id":"m12-school-jan","memberId":"m12","periodKey":"JAN","amount":50000,"fund":"SCHOOL","session":1},{"id":"m16-school-jan","memberId":"m16","periodKey":"JAN","amount":20000,"fund":"SCHOOL","session":1}];
const all=classic.concat(school);

test('expanded real dossier reproduces the historical workbook at the true 708,500 XAF interest pool',()=>{
  const r=simulateWorkbookYieldPipeline({
    realizedInterestPool:708500,
    bureauShareBasisPoints:2000,
    deposits:all.map(({session,...d})=>d),
    funds:[
      {fund:'CLASSIC',shareBasisPoints:7000,eligiblePeriods:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT'],highestCoefficient:9,coefficients:{JAN:9,FEB:8,MAR:7,APR:6,MAY:5,JUN:4,JUL:3,AUG:2,SEP:1,OCT:.5,NOV:0,DEC:0}},
      {fund:'SCHOOL',shareBasisPoints:1000,eligiblePeriods:['JAN','FEB','MAR','APR','MAY','JUN','JUL'],highestCoefficient:7,coefficients:{JAN:7,FEB:6,MAR:5,APR:4,MAY:3,JUN:2,JUL:1,AUG:0,SEP:0,OCT:0,NOV:0,DEC:0}}
    ]
  });
  const classicFund=r.funds.find(x=>x.fund==='CLASSIC'),schoolFund=r.funds.find(x=>x.fund==='SCHOOL');
  const value=(fund,id)=>fund.deposits.find(x=>x.id===id).exactFinalInterest;
  assert.ok(Math.abs(value(classicFund,'m1-apr')-16126.917327315045)<1e-8);
  assert.ok(Math.abs(value(classicFund,'m4-apr')-203879.7142353823)<1e-8);
  assert.ok(Math.abs(value(classicFund,'m10-apr')-203589.42972349058)<1e-8);
  assert.ok(Math.abs(value(classicFund,'m13-jan')-46281.51115344854)<1e-8);
  assert.ok(Math.abs(value(schoolFund,'m8-school-jan')-65854.46819811448)<1e-8);
  assert.equal(classicFund.allocatedPool,495950);
  assert.equal(schoolFund.allocatedPool,70850);
  assert.equal(r.bureauIndemnity,141700);
  assert.equal(r.totalAllocated,708500);
  assert.equal(r.exactPoolConservation,true);
});

test('capital-time is a transparent alternative that rewards both amount and earlier deposits',()=>{
  const r=allocateCapitalTimeYield({
    interestPool:10000,
    deposits:[
      {id:'early','memberId':'early','amount':100000,session:1,fund:'CLASSIC'},
      {id:'late','memberId':'late','amount':100000,session:9,fund:'CLASSIC'},
      {id:'bigger-late','memberId':'bigger-late','amount':200000,session:9,fund:'CLASSIC'}
    ],
    policy:{endSession:10,eligibleThroughSession:9,timeExponent:1,amountPower:1}
  });
  const gain=id=>r.members.find(x=>x.memberId===id)?.interest??0;
  assert.ok(gain('early')>gain('late'));
  assert.ok(gain('bigger-late')>gain('late'));
  assert.equal(r.distributedInterest,10000);
  assert.equal(r.undistributedInterest,0);
});

test('expanded dossier productive engine attributes the 690,000 evidenced interest and keeps the 18,500 residual explicit',()=>{
  const r=allocateAttributedProductiveYield({
    realizedInterestPool:708500,
    deposits:all.map(d=>({id:d.id,memberId:d.memberId,amount:d.amount,session:d.session,fund:d.fund,periodKey:d.periodKey})),
    loans:[
      {loanId:'jan-1m',disbursedSession:1,principal:1000000,realizedInterest:90000,repaidSession:3},
      {loanId:'apr-6m',disbursedSession:4,principal:6000000,realizedInterest:600000,repaidSession:6}
    ],
    policy:{
      officeShareBasisPoints:2000,
      poolingMode:'POOLED',
      allocationMethod:'PRO_RATA_AVAILABLE',
      residualPolicy:'TIME_WEIGHTED',
      endSession:12,
      eligibleThroughSession:10,
      timeExponent:1,
      amountPower:1
    }
  });
  assert.equal(r.officeIndemnity,141700);
  assert.equal(r.saverPool,566800);
  assert.equal(r.evidencedGrossInterest,690000);
  assert.equal(r.residualGrossInterest,18500);
  assert.equal(r.attributedSaverInterest,552000);
  assert.equal(r.residualSaverInterest,14800);
  assert.equal(r.unallocatedSaverInterest,0);
  assert.equal(r.exactPoolConservation,true);
  assert.ok((r.fundInterest.CLASSIC??0)>0);
  assert.ok((r.fundInterest.SCHOOL??0)>0);
  assert.ok(r.warnings.includes('CLASSIC_AND_SCHOOL_SAVINGS_MAY_FINANCE_THE_SAME_LOANS'));
});

test('segregated productive policy makes the source-fund decision explicit instead of silently mixing school savings',()=>{
  const r=allocateAttributedProductiveYield({
    realizedInterestPool:708500,
    deposits:all.map(d=>({id:d.id,memberId:d.memberId,amount:d.amount,session:d.session,fund:d.fund,periodKey:d.periodKey})),
    loans:[
      {loanId:'jan-1m',disbursedSession:1,principal:1000000,realizedInterest:90000,repaidSession:3,sourceFund:'CLASSIC'},
      {loanId:'apr-6m',disbursedSession:4,principal:6000000,realizedInterest:600000,repaidSession:6,sourceFund:'CLASSIC'}
    ],
    policy:{
      officeShareBasisPoints:2000,
      poolingMode:'SEGREGATED',
      allocationMethod:'PRO_RATA_AVAILABLE',
      residualPolicy:'FIXED_FUND_SPLIT',
      residualFundSharesBasisPoints:{CLASSIC:8750,SCHOOL:1250},
      endSession:12,
      eligibleThroughSession:10,
      timeExponent:1,
      amountPower:1
    }
  });
  assert.equal(r.exactPoolConservation,true);
  assert.ok((r.fundInterest.SCHOOL??0)>0,'school receives only the explicit residual share');
  assert.ok((r.fundInterest.CLASSIC??0)>(r.fundInterest.SCHOOL??0));
});


test('five-policy field comparison preserves the pool and exposes materially different allocation philosophies',()=>{
  const merge=(...results)=>{
    const by=new Map();
    for(const r of results)for(const row of r.members??[])by.set(row.memberId,(by.get(row.memberId)??0)+row.interest);
    return Object.fromEntries([...by.entries()].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})));
  };
  const historical=simulateWorkbookYieldPipeline({
    realizedInterestPool:708500,bureauShareBasisPoints:2000,deposits:all.map(({session,...d})=>d),
    funds:[
      {fund:'CLASSIC',shareBasisPoints:7000,eligiblePeriods:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT'],highestCoefficient:9,coefficients:{JAN:9,FEB:8,MAR:7,APR:6,MAY:5,JUN:4,JUL:3,AUG:2,SEP:1,OCT:.5,NOV:0,DEC:0}},
      {fund:'SCHOOL',shareBasisPoints:1000,eligiblePeriods:['JAN','FEB','MAR','APR','MAY','JUN','JUL'],highestCoefficient:7,coefficients:{JAN:7,FEB:6,MAR:5,APR:4,MAY:3,JUN:2,JUL:1,AUG:0,SEP:0,OCT:0,NOV:0,DEC:0}}
    ]
  });
  const linearClassic=allocateCapitalTimeYield({interestPool:495950,deposits:classic,policy:{endSession:12,eligibleThroughSession:10,timeExponent:1,amountPower:1}});
  const linearSchool=allocateCapitalTimeYield({interestPool:70850,deposits:school,policy:{endSession:12,eligibleThroughSession:7,timeExponent:1,amountPower:1}});
  const earlyClassic=allocateCapitalTimeYield({interestPool:495950,deposits:classic,policy:{endSession:12,eligibleThroughSession:10,timeExponent:1.5,amountPower:1}});
  const earlySchool=allocateCapitalTimeYield({interestPool:70850,deposits:school,policy:{endSession:12,eligibleThroughSession:7,timeExponent:1.5,amountPower:1}});
  const loans=[
    {loanId:'jan-1m',disbursedSession:1,principal:1000000,realizedInterest:90000,repaidSession:3},
    {loanId:'apr-6m',disbursedSession:4,principal:6000000,realizedInterest:600000,repaidSession:6}
  ];
  const productive=allocateAttributedProductiveYield({
    realizedInterestPool:708500,deposits:all,loans,
    policy:{officeShareBasisPoints:2000,poolingMode:'POOLED',allocationMethod:'PRO_RATA_AVAILABLE',residualPolicy:'UNALLOCATED',endSession:12,eligibleThroughSession:10,timeExponent:1,amountPower:1}
  });
  const hybrid=allocateAttributedProductiveYield({
    realizedInterestPool:708500,deposits:all,loans,
    policy:{officeShareBasisPoints:2000,poolingMode:'POOLED',allocationMethod:'PRO_RATA_AVAILABLE',residualPolicy:'TIME_WEIGHTED',endSession:12,eligibleThroughSession:10,timeExponent:1,amountPower:1}
  });
  const historicalMembers=merge(...historical.funds),linearMembers=merge(linearClassic,linearSchool),earlyMembers=merge(earlyClassic,earlySchool),productiveMembers=merge(productive),hybridMembers=merge(hybrid);
  const sum=x=>Object.values(x).reduce((n,v)=>n+v,0);
  assert.equal(sum(historicalMembers),566800);
  assert.equal(sum(linearMembers),566800);
  assert.equal(sum(earlyMembers),566800);
  assert.equal(sum(productiveMembers),552000);
  assert.equal(productive.unallocatedSaverInterest,14800);
  assert.equal(sum(hybridMembers),566800);
  assert.notDeepEqual(linearMembers,historicalMembers);
  assert.notDeepEqual(earlyMembers,linearMembers);
  assert.notDeepEqual(productiveMembers,hybridMembers);
  const top=(x,n=8)=>Object.entries(x).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],undefined,{numeric:true})).slice(0,n);
  console.log('FIVE_POLICY_FIELD_REPORT='+JSON.stringify({
    pool:708500,office:141700,saverPool:566800,
    policies:{
      historical:{distributed:sum(historicalMembers),unallocated:0,top:top(historicalMembers),members:historicalMembers},
      capital_time_linear:{alpha:1,beta:1,classicEligibleThrough:10,schoolEligibleThrough:7,distributed:sum(linearMembers),unallocated:0,top:top(linearMembers),members:linearMembers},
      capital_time_early_bonus:{alpha:1.5,beta:1,classicEligibleThrough:10,schoolEligibleThrough:7,distributed:sum(earlyMembers),unallocated:0,top:top(earlyMembers),members:earlyMembers},
      productive_attributed:{evidencedGrossInterest:productive.evidencedGrossInterest,residualGrossInterest:productive.residualGrossInterest,distributed:sum(productiveMembers),unallocated:productive.unallocatedSaverInterest,top:top(productiveMembers),members:productiveMembers},
      hybrid_productive_time:{evidencedGrossInterest:hybrid.evidencedGrossInterest,residualGrossInterest:hybrid.residualGrossInterest,distributed:sum(hybridMembers),unallocated:0,top:top(hybridMembers),members:hybridMembers}
    }
  }));
});
