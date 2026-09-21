import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {validateEvidenceRegistry} from '../scripts/evidence-gate.mjs';

test('evidence registry validates current proven stages without inventing field acceptance',async()=>{
  const [registryRaw,featureRegistryText]=await Promise.all([
    readFile('EVIDENCE_REGISTRY.yaml','utf8'),
    readFile('FEATURE_REGISTRY.yaml','utf8')
  ]);
  const registry=JSON.parse(registryRaw);
  const errors=validateEvidenceRegistry({registry,featureRegistryText});
  assert.deepEqual(errors,[]);
  const blueprint=registry.entries.find(x=>x.capability_id==='BLUEPRINT.EXECUTABLE');
  assert.equal(blueprint.status,'SMOKE_VERIFIED');
  assert.ok(blueprint.field_cases.some(x=>x.status==='PENDING'));
  assert.notEqual(blueprint.status,'FIELD_ACCEPTED');
  assert.notEqual(blueprint.status,'ACQUIRED');
});

test('evidence gate refuses FIELD_ACCEPTED while a required field case is pending',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'eco-evidence-'));
  try{
    const registry=JSON.parse(await readFile('EVIDENCE_REGISTRY.yaml','utf8'));
    const blueprint=registry.entries.find(x=>x.capability_id==='BLUEPRINT.EXECUTABLE');
    blueprint.status='FIELD_ACCEPTED';
    const candidate=join(dir,'EVIDENCE_REGISTRY.yaml');
    await writeFile(candidate,JSON.stringify(registry,null,2));
    assert.throws(()=>execFileSync(process.execPath,['scripts/evidence-gate.mjs'],{
      env:{...process.env,EVIDENCE_REGISTRY_PATH:candidate},
      stdio:'pipe'
    }),/Command failed/);
  }finally{
    await rm(dir,{recursive:true,force:true});
  }
});

test('architecture guardrail may be ACQUIRED without a user field journey when explicitly non-field',async()=>{
  const registry=JSON.parse(await readFile('EVIDENCE_REGISTRY.yaml','utf8'));
  const boundary=registry.entries.find(x=>x.capability_id==='PROJECT.BACKHAUL.EXCLUSION');
  assert.equal(boundary.status,'ACQUIRED');
  assert.equal(boundary.field_required,false);
  assert.match(boundary.acquisition_reason,/Founder decision/i);
});

test('registry separates feature declaration from evidence and contains no raw secrets',async()=>{
  const raw=await readFile('EVIDENCE_REGISTRY.yaml','utf8');
  assert.match(raw,/NO_EVIDENCE_NO_REALITY/);
  assert.doesNotMatch(raw,/Bearer\s+|eyJ[a-zA-Z0-9_-]{10,}/);
  execFileSync(process.execPath,['scripts/evidence-gate.mjs'],{stdio:'pipe'});
});
