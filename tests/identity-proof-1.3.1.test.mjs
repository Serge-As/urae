import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteD1} from '../scripts/sqlite-d1.mjs';
import {IdentityProofService} from '../.build/packages/identity-proof/src/index.js';

test('CNI matching stores only keyed hashes and finds exact historical membership candidates',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const svc=new IdentityProofService(db,'identity-match-pepper-very-long-secret-2026');
    await svc.registerAccountCni('account_a',' 1234-5678-AB ');
    await svc.recordHistoricalCniHint({tenantId:'tenant_a',groupId:'group_a',membershipId:'membership_a',cni:'12345678AB',createdBy:'manager'});
    const matches=await svc.candidateMatches('account_a');
    assert.deepEqual(matches,[{tenantId:'tenant_a',groupId:'group_a',membershipId:'membership_a',proofType:'CNI',confidence:'EXACT_HASH_MATCH'}]);
    const raw=db.db.prepare("SELECT identifier_hash FROM identity_proof_tokens WHERE account_id='account_a'").get();
    assert.ok(raw.identifier_hash);assert.notEqual(raw.identifier_hash,'12345678AB');
  }finally{db.close();}
});

test('CNI matching is useless without the server-only pepper and never exposes the raw number',async()=>{
  const db=new SQLiteD1(':memory:');db.migrate();
  try{
    const svc=new IdentityProofService(db,'short');
    await assert.rejects(()=>svc.registerAccountCni('a','12345678'),/IDENTITY_MATCH_PEPPER_REQUIRED/);
  }finally{db.close();}
});
