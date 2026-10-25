import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join,dirname,basename,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {verifyProposalCoverage,verifyProposalEvidence} from '../scripts/proposal-coverage-gate.mjs';

const register=()=>readFile(new URL('../docs/implementation/PROPOSALS_REGISTER_2026-10-20.json',import.meta.url),'utf8').then(JSON.parse);

test('all delivered proposals link to readable evidence and the exact qualified runtime; adopted tools retain their limited scope',async()=>{
  const reg=await register(),report=await verifyProposalEvidence(reg);
  assert.equal(report.proposals,92);assert.equal(report.lots,28);assert.ok(report.evidenceFiles>20);
  assert.equal(report.sourceSha,reg.lastVerifiedSource);assert.equal(report.fieldAcceptance,'NOT_ACCEPTED');
  assert.deepEqual(reg.proposals.filter(p=>p.status==='REVIEWED_TOOL_IN_USE').map(p=>p.id),['T16','T19','T20']);
  const unreviewed=structuredClone(reg);delete unreviewed.proposals.find(p=>p.id==='T20').adoptedScope;
  assert.throws(()=>verifyProposalCoverage(unreviewed),/ADOPTION_REQUIRES_REVIEW:T20/);
});

test('an absent proof, an unreadable path and an escaping reference cannot certify a delivered proposal',async()=>{
  for(const [path,error]of [['docs/absent-proof.json',/EVIDENCE_NOT_READABLE/],['../package.json',/EVIDENCE_PATH_INVALID/],['/package.json',/EVIDENCE_PATH_INVALID/],['C:\\private\\file.json',/EVIDENCE_PATH_INVALID/]]){
    const reg=await register();reg.proposals[0].evidence=[path];await assert.rejects(verifyProposalEvidence(reg),error);
  }
});

test('historic success and malformed or empty evidence fail closed without erasing the proposal criteria',async()=>{
  const reg=await register(),original=structuredClone(reg.proposals[0].acceptanceCriteria);reg.lastVerifiedSource='0'.repeat(40);
  await assert.rejects(verifyProposalEvidence(reg),/EXACT_SOURCE_QUALIFICATION_MISSING:A01/);assert.deepEqual(reg.proposals[0].acceptanceCriteria,original);
  const root=await mkdtemp(join(tmpdir(),'eco-proposal-proof-'));
  try{
    await mkdir(join(root,'docs'));const synthetic=await register();for(const p of synthetic.proposals)p.evidence=['docs/proof.json'];
    await writeFile(join(root,'docs/proof.json'),'{invalid');await assert.rejects(verifyProposalEvidence(synthetic,{root}),/EVIDENCE_JSON_INVALID/);
    await writeFile(join(root,'docs/proof.json'),'  ');await assert.rejects(verifyProposalEvidence(synthetic,{root}),/EVIDENCE_EMPTY/);
  }finally{
    assert.equal(dirname(resolve(root)),resolve(tmpdir()));assert.ok(basename(root).startsWith('eco-proposal-proof-'));
    await rm(root,{recursive:true,force:true});
  }
});
