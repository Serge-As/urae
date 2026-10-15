import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectedApplication} from '../.build/packages/application/src/index.js';

test('a 3-second financial response completes once with its original intent, without a false network failure',async t=>{
  const saved=globalThis.fetch;
  t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.parse('2026-10-15T12:00:00Z')});
  let calls=0,aborted=false;
  globalThis.fetch=async(_url,init)=>{
    calls++;init.signal?.addEventListener('abort',()=>{aborted=true;});
    return new Promise(resolve=>setTimeout(()=>resolve(new Response(JSON.stringify({accepted:true,stored:true,canonicalAmount:2500}),{status:200})),3000));
  };
  try{
    const app=new ConnectedApplication({actorId:'synthetic-manager',tenantId:'synthetic-tenant'});
    const result=app.request('/api/v1/outbox/apply',{method:'POST',body:JSON.stringify({idempotencyKey:'unchanged-key'})});
    await Promise.resolve();await Promise.resolve();
    t.mock.timers.tick(2300);await Promise.resolve();assert.equal(aborted,false);
    t.mock.timers.tick(700);const ack=await result;
    assert.equal(ack.accepted,true);assert.equal(ack.canonicalAmount,2500);assert.equal(calls,1);assert.equal(aborted,false);
    assert.equal(app.transportState().degraded,false);
  }finally{globalThis.fetch=saved;t.mock.timers.reset();}
});

test('a short optional-request circuit does not block Live recovery, while an explicit D1 quota still does',async()=>{
  const saved=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({ticket:'synthetic',groupId:'g',expiresAt:'2026-12-01T00:00:00Z'}),{status:200});};
  try{
    const app=new ConnectedApplication({actorId:'synthetic-manager',tenantId:'synthetic-tenant'});
    app.transportUnavailableUntil=Date.now()+50000;
    const data=await app.request('/api/v1/groups/g/live/ticket');assert.equal(data.ticket,'synthetic');assert.equal(calls,1);
    app.transportUnavailableUntil=Date.now()+50000;
    await assert.rejects(app.request('/api/v1/groups/g/optional-panel'),/NETWORK_UNAVAILABLE/);assert.equal(calls,1);
    app.serverBudgetBlockedUntil=Date.now()+50000;
    await assert.rejects(app.request('/api/v1/groups/g/live/ticket'),/NETWORK_UNAVAILABLE/);assert.equal(calls,1);
  }finally{globalThis.fetch=saved;}
});
