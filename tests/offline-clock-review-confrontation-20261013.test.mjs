import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';
test('an offline clock-review intention remains available to the manager confrontation without becoming sendable',async()=>{
 const app=new ConnectedApplication({actorId:'synthetic-manager',tenantId:'synthetic-tenant'});app.selectGroup('synthetic-group');
 app.outbox.restore([{id:'review',idempotencyKey:'cell-target:review',type:'FINANCIAL_CELL_CORRECTION_PROPOSAL_V2',actorId:'synthetic-manager',tenantId:'synthetic-tenant',status:'CONFLICT',attempts:1,createdAt:'2026-10-13T10:00:00Z',updatedAt:'2026-10-13T10:00:01Z',lastResult:{status:'CLOCK_REVIEW'},payload:{groupId:'synthetic-group',meetingId:'s',membershipId:'m',rubricId:'r',targetAmount:4000,baselineValue:3000,baselineVersion:2,recordedOffline:true}}]);
 app.request=async()=>({generatedAt:'2026-10-13T10:02:00Z',watermark:'latest',cells:[{meetingId:'s',membershipId:'m',rubricId:'r',amount:5000,cellVersion:3,updatedAt:'2026-10-13T10:01:00Z'}]});
 assert.equal(app.pendingFinancialCellTargets().length,1);const preview=await app.previewOfflineFinancialConfrontation();assert.equal(preview.rows.length,1);assert.equal(preview.rows[0].localAmount,4000);assert.equal(preview.rows[0].canonicalAmount,5000);assert.equal(preview.rows[0].serverChangedSinceBaseline,true);
 let sent=0;await app.outbox.sync(async()=>{sent++;return{ok:true};});assert.equal(sent,0,'human review remains mandatory');
});
