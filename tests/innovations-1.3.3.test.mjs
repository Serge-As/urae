import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseGroup} from '../.build/packages/group-doctor/src/index.js';
import {prepareMeetingAutopilot} from '../.build/packages/meeting-autopilot/src/index.js';

test('Group Doctor explains pooled savings and unattributed interest without mutating finance',()=>{
  const r=diagnoseGroup({
    realizedInterestPool:708500,evidencedInterest:690000,residualInterest:18500,
    poolingMode:'POOLED',fixedFundSharesBasisPoints:{CLASSIC:7000,SCHOOL:1000},
    classicPrincipal:14935199,schoolPrincipal:1081000,earlyDepositPriority:true,
    coefficients:[9,8,7,6,5,4,3,2,1,.5,0,0]
  });
  assert.equal(r.automaticMutation,false);
  assert.ok(r.findings.some(x=>x.code==='POOLED_WITH_FIXED_SPLIT'));
});

test('Meeting Autopilot blocks opening only for explicit unresolved previous variance',()=>{
  const blocked=prepareMeetingAutopilot({meetingLabel:'Séance 7',expectedRubrics:['Secours','Épargne'],unresolvedVariance:500});
  assert.equal(blocked.canOpen,false);
  assert.ok(blocked.blockers.includes('PREVIOUS_VARIANCE_UNRESOLVED'));
  const ready=prepareMeetingAutopilot({meetingLabel:'Séance 7',expectedRubrics:['Secours','Épargne'],unresolvedVariance:0,offline:true});
  assert.equal(ready.canOpen,true);
  assert.equal(ready.automaticFinancialPosting,false);
});
