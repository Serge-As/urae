import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateWorkbookYieldPipeline,allocateCapitalAtWorkYield} from '../.build/packages/savings-yield/src/index.js';

const classic=[{"id":"m1-jan","memberId":"m1","periodKey":"JAN","amount":150,"fund":"CLASSIC","session":1},{"id":"m1-apr","memberId":"m1","periodKey":"APR","amount":500000,"fund":"CLASSIC","session":4},{"id":"m1-oct","memberId":"m1","periodKey":"OCT","amount":1000,"fund":"CLASSIC","session":10},{"id":"m2-jan","memberId":"m2","periodKey":"JAN","amount":236,"fund":"CLASSIC","session":1},{"id":"m2-apr","memberId":"m2","periodKey":"APR","amount":90000,"fund":"CLASSIC","session":4},{"id":"m2-oct","memberId":"m2","periodKey":"OCT","amount":500,"fund":"CLASSIC","session":10},{"id":"m3-jan","memberId":"m3","periodKey":"JAN","amount":55,"fund":"CLASSIC","session":1},{"id":"m3-apr","memberId":"m3","periodKey":"APR","amount":45000,"fund":"CLASSIC","session":4},{"id":"m3-oct","memberId":"m3","periodKey":"OCT","amount":600,"fund":"CLASSIC","session":10},{"id":"m4-jan","memberId":"m4","periodKey":"JAN","amount":5699,"fund":"CLASSIC","session":1},{"id":"m4-apr","memberId":"m4","periodKey":"APR","amount":6321100,"fund":"CLASSIC","session":4},{"id":"m4-oct","memberId":"m4","periodKey":"OCT","amount":88,"fund":"CLASSIC","session":10},{"id":"m5-jan","memberId":"m5","periodKey":"JAN","amount":22,"fund":"CLASSIC","session":1},{"id":"m5-apr","memberId":"m5","periodKey":"APR","amount":8000,"fund":"CLASSIC","session":4},{"id":"m5-oct","memberId":"m5","periodKey":"OCT","amount":66,"fund":"CLASSIC","session":10},{"id":"m6-jan","memberId":"m6","periodKey":"JAN","amount":88,"fund":"CLASSIC","session":1},{"id":"m6-apr","memberId":"m6","periodKey":"APR","amount":36971,"fund":"CLASSIC","session":4},{"id":"m6-oct","memberId":"m6","periodKey":"OCT","amount":7000,"fund":"CLASSIC","session":10},{"id":"m7-jan","memberId":"m7","periodKey":"JAN","amount":99,"fund":"CLASSIC","session":1},{"id":"m7-oct","memberId":"m7","periodKey":"OCT","amount":233265,"fund":"CLASSIC","session":10},{"id":"m8-jan","memberId":"m8","periodKey":"JAN","amount":890,"fund":"CLASSIC","session":1},{"id":"m8-oct","memberId":"m8","periodKey":"OCT","amount":233,"fund":"CLASSIC","session":10},{"id":"m9-jan","memberId":"m9","periodKey":"JAN","amount":99990,"fund":"CLASSIC","session":1},{"id":"m9-oct","memberId":"m9","periodKey":"OCT","amount":55,"fund":"CLASSIC","session":10},{"id":"m10-jan","memberId":"m10","periodKey":"JAN","amount":25,"fund":"CLASSIC","session":1},{"id":"m10-apr","memberId":"m10","periodKey":"APR","amount":6312100,"fund":"CLASSIC","session":4},{"id":"m10-oct","memberId":"m10","periodKey":"OCT","amount":66,"fund":"CLASSIC","session":10},{"id":"m11-jan","memberId":"m11","periodKey":"JAN","amount":85320,"fund":"CLASSIC","session":1},{"id":"m11-apr","memberId":"m11","periodKey":"APR","amount":25910,"fund":"CLASSIC","session":4},{"id":"m11-oct","memberId":"m11","periodKey":"OCT","amount":44,"fund":"CLASSIC","session":10},{"id":"m12-jan","memberId":"m12","periodKey":"JAN","amount":855,"fund":"CLASSIC","session":1},{"id":"m12-oct","memberId":"m12","periodKey":"OCT","amount":33,"fund":"CLASSIC","session":10},{"id":"m13-jan","memberId":"m13","periodKey":"JAN","amount":956610,"fund":"CLASSIC","session":1},{"id":"m13-oct","memberId":"m13","periodKey":"OCT","amount":7,"fund":"CLASSIC","session":10},{"id":"m14-jan","memberId":"m14","periodKey":"JAN","amount":305,"fund":"CLASSIC","session":1},{"id":"m14-oct","memberId":"m14","periodKey":"OCT","amount":8,"fund":"CLASSIC","session":10},{"id":"m15-jan","memberId":"m15","periodKey":"JAN","amount":6985,"fund":"CLASSIC","session":1},{"id":"m15-oct","memberId":"m15","periodKey":"OCT","amount":996,"fund":"CLASSIC","session":10},{"id":"m16-jan","memberId":"m16","periodKey":"JAN","amount":54780,"fund":"CLASSIC","session":1},{"id":"m16-oct","memberId":"m16","periodKey":"OCT","amount":77,"fund":"CLASSIC","session":10},{"id":"m17-jan","memberId":"m17","periodKey":"JAN","amount":920,"fund":"CLASSIC","session":1},{"id":"m17-oct","memberId":"m17","periodKey":"OCT","amount":200,"fund":"CLASSIC","session":10},{"id":"m18-jan","memberId":"m18","periodKey":"JAN","amount":32585,"fund":"CLASSIC","session":1},{"id":"m18-oct","memberId":"m18","periodKey":"OCT","amount":2000,"fund":"CLASSIC","session":10},{"id":"m19-jan","memberId":"m19","periodKey":"JAN","amount":98520,"fund":"CLASSIC","session":1},{"id":"m19-oct","memberId":"m19","periodKey":"OCT","amount":5000,"fund":"CLASSIC","session":10},{"id":"m20-jan","memberId":"m20","periodKey":"JAN","amount":86,"fund":"CLASSIC","session":1},{"id":"m20-oct","memberId":"m20","periodKey":"OCT","amount":5,"fund":"CLASSIC","session":10},{"id":"m21-jan","memberId":"m21","periodKey":"JAN","amount":20,"fund":"CLASSIC","session":1},{"id":"m21-oct","memberId":"m21","periodKey":"OCT","amount":555,"fund":"CLASSIC","session":10},{"id":"m22-jan","memberId":"m22","periodKey":"JAN","amount":25,"fund":"CLASSIC","session":1},{"id":"m22-oct","memberId":"m22","periodKey":"OCT","amount":55,"fund":"CLASSIC","session":10}];
const school=[{"id":"m3-school-jan","memberId":"m3","periodKey":"JAN","amount":5000,"fund":"SCHOOL","session":1},{"id":"m6-school-nov","memberId":"m6","periodKey":"NOV","amount":5000,"fund":"SCHOOL","session":11},{"id":"m7-school-feb","memberId":"m7","periodKey":"FEB","amount":1000,"fund":"SCHOOL","session":2},{"id":"m8-school-jan","memberId":"m8","periodKey":"JAN","amount":1000000,"fund":"SCHOOL","session":1},{"id":"m12-school-jan","memberId":"m12","periodKey":"JAN","amount":50000,"fund":"SCHOOL","session":1},{"id":"m16-school-jan","memberId":"m16","periodKey":"JAN","amount":20000,"fund":"SCHOOL","session":1}];
const all=classic.concat(school);

test('real workbook fixture reproduces cached final-interest results to floating precision',()=>{
  const r=simulateWorkbookYieldPipeline({
    realizedInterestPool:18500,
    bureauShareBasisPoints:2000,
    deposits:all.map(({session,...d})=>d),
    funds:[
      {fund:'CLASSIC',shareBasisPoints:7000,eligiblePeriods:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT'],highestCoefficient:9,coefficients:{JAN:9,FEB:8,MAR:7,APR:6,MAY:5,JUN:4,JUL:3,AUG:2,SEP:1,OCT:.5,NOV:0,DEC:0}},
      {fund:'SCHOOL',shareBasisPoints:1000,eligiblePeriods:['JAN','FEB','MAR','APR','MAY','JUN','JUL'],highestCoefficient:7,coefficients:{JAN:7,FEB:6,MAR:5,APR:4,MAY:3,JUN:2,JUL:1,AUG:0,SEP:0,OCT:0,NOV:0,DEC:0}}
    ]
  });
  const c=r.funds.find(x=>x.fund==='CLASSIC'),s=r.funds.find(x=>x.fund==='SCHOOL');
  const value=(fund,id)=>fund.deposits.find(x=>x.id===id).exactFinalInterest;
  assert.ok(Math.abs(value(c,'m1-apr')-421.09805300681484)<1e-9);
  assert.ok(Math.abs(value(c,'m4-apr')-5323.605805722756)<1e-9);
  assert.ok(Math.abs(value(c,'m10-apr')-5316.026040768632)<1e-9);
  assert.ok(Math.abs(value(c,'m13-jan')-1208.4798254605475)<1e-9);
  assert.ok(Math.abs(value(s,'m8-school-jan')-1719.5591554906391)<1e-9);
  assert.equal(c.allocatedPool,12950);assert.equal(s.allocatedPool,1850);assert.equal(r.bureauIndemnity,3700);
  assert.equal(r.totalAllocated,18500);assert.equal(r.exactPoolConservation,true);
});

test('productive-capital fixture exposes that April/October savings never financed a recorded regular loan',()=>{
  const r=allocateCapitalAtWorkYield({
    interestPool:12950,
    endSession:12,
    deposits:classic.map(d=>({id:d.id,memberId:d.memberId,amount:d.amount,session:d.session,fund:'CLASSIC'})),
    events:[{type:'LOAN_DISBURSEMENT',session:1,loanId:'regular-jan',amount:50050,fund:'CLASSIC'}],
    policy:{allocationMethod:'PRO_RATA_AVAILABLE',noLoanNoYield:true,recyclePrincipalRepayments:true,reinvestRealizedInterest:false}
  });
  const gain=id=>r.members.find(x=>x.memberId===id)?.interest??0;
  assert.equal(r.loansDisbursed,50050);assert.equal(r.totalMemberPrincipal,14935199);
  assert.equal(gain('m13'),9216);
  assert.equal(gain('m9'),963);
  assert.equal(gain('m19'),949);
  assert.equal(gain('m11'),822);
  assert.equal(gain('m10'),0);
  assert.equal(r.distributedInterest,12950);assert.equal(r.exactPoolConservation,true);
});

test('productive-capital engine refuses to invent school yield when no school loan is evidenced',()=>{
  assert.throws(()=>allocateCapitalAtWorkYield({
    interestPool:1850,endSession:12,
    deposits:school.map(d=>({id:d.id,memberId:d.memberId,amount:d.amount,session:d.session,fund:'SCHOOL'})),
    events:[],
    policy:{allocationMethod:'PRO_RATA_AVAILABLE',noLoanNoYield:true,recyclePrincipalRepayments:true,reinvestRealizedInterest:false}
  }),/ZERO_WEIGHT_CANNOT_DISTRIBUTE_INTEREST/);
});
