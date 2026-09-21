import fs from 'node:fs';

const registryPath=process.env.EVIDENCE_REGISTRY_PATH || 'EVIDENCE_REGISTRY.yaml';
const featureRegistryPath=process.env.FEATURE_REGISTRY_PATH || 'FEATURE_REGISTRY.yaml';

const STAGES=['IDEA','SPECIFIED','IMPLEMENTED','CI_QUALIFIED','DEPLOYED','SMOKE_VERIFIED','FIELD_ACCEPTED','ACQUIRED'];
const FIELD_STATES=new Set(['PENDING','PASS','FAIL','BLOCKED','NOT_APPLICABLE']);
const stageIndex=status=>STAGES.indexOf(status);
const atLeast=(status,target)=>stageIndex(status)>=stageIndex(target);

const readRegistry=path=>{
  if(!fs.existsSync(path)) throw new Error(`Missing ${path}`);
  const raw=fs.readFileSync(path,'utf8');
  try{return JSON.parse(raw);}
  catch(error){throw new Error(`${path} must remain JSON-compatible YAML: ${error.message}`);}
};

export function validateEvidenceRegistry({registry,featureRegistryText}){
  const errors=[];
  if(registry?.doctrine!=='NO_EVIDENCE_NO_REALITY')errors.push('Missing NO_EVIDENCE_NO_REALITY doctrine');
  if(!Array.isArray(registry?.entries))errors.push('entries must be an array');
  const allowed=new Set(registry?.allowed_statuses||[]);
  for(const status of STAGES)if(!allowed.has(status))errors.push(`allowed_statuses missing ${status}`);

  const ids=new Set();
  for(const entry of registry?.entries||[]){
    const id=String(entry.capability_id||'').trim();
    if(!id){errors.push('Evidence entry missing capability_id');continue;}
    if(ids.has(id))errors.push(`Duplicate evidence capability_id: ${id}`);
    ids.add(id);

    if(!STAGES.includes(entry.status))errors.push(`${id}: invalid status ${entry.status}`);
    if(!featureRegistryText.includes(`id: ${id}`))errors.push(`${id}: not found in FEATURE_REGISTRY.yaml`);

    if(atLeast(entry.status,'IMPLEMENTED')&&!entry.commit)errors.push(`${id}: IMPLEMENTED+ requires commit`);
    if(atLeast(entry.status,'CI_QUALIFIED')){
      if(!Array.isArray(entry.test_ids)||entry.test_ids.length===0)errors.push(`${id}: CI_QUALIFIED+ requires test_ids`);
      if(!entry.ci_run)errors.push(`${id}: CI_QUALIFIED+ requires ci_run`);
    }
    if(atLeast(entry.status,'DEPLOYED')&&!entry.deploy_run)errors.push(`${id}: DEPLOYED+ requires deploy_run`);
    if(atLeast(entry.status,'SMOKE_VERIFIED')&&(!Array.isArray(entry.smoke)||entry.smoke.length===0))errors.push(`${id}: SMOKE_VERIFIED+ requires smoke evidence`);

    const fieldCases=Array.isArray(entry.field_cases)?entry.field_cases:[];
    for(const fieldCase of fieldCases){
      if(!fieldCase?.id)errors.push(`${id}: field case missing id`);
      if(!FIELD_STATES.has(fieldCase?.status))errors.push(`${id}: invalid field case status ${fieldCase?.status}`);
    }
    const fieldRequired=entry.field_required!==false;
    const allFieldPass=fieldCases.length>0&&fieldCases.every(c=>c.status==='PASS'||c.status==='NOT_APPLICABLE');
    if(atLeast(entry.status,'FIELD_ACCEPTED')&&fieldRequired&&!allFieldPass)errors.push(`${id}: FIELD_ACCEPTED requires all field cases PASS/NOT_APPLICABLE`);
    if(entry.status==='ACQUIRED'&&fieldRequired&&!allFieldPass)errors.push(`${id}: ACQUIRED requires field acceptance when field_required=true`);
    if(entry.status==='ACQUIRED'&&!entry.acquisition_reason)errors.push(`${id}: ACQUIRED requires acquisition_reason`);
    if(!entry.last_verified_at)errors.push(`${id}: missing last_verified_at`);
    if(!entry.verifier)errors.push(`${id}: missing verifier`);
  }

  const serialized=JSON.stringify(registry);
  if(/(?:Bearer\\s+|eyJ[a-zA-Z0-9_-]{10,}|[A-Za-z0-9_-]{40,}\\.[A-Za-z0-9_-]{20,})/.test(serialized))errors.push('Evidence registry appears to contain a secret/token value');

  return errors;
}

export function runEvidenceGate(){
  const registry=readRegistry(registryPath);
  const featureRegistryText=fs.readFileSync(featureRegistryPath,'utf8');
  const errors=validateEvidenceRegistry({registry,featureRegistryText});
  if(errors.length){
    for(const error of errors)console.error('EVIDENCE_GATE_FAIL:',error);
    throw new Error(`Evidence gate failed with ${errors.length} error(s)`);
  }
  const counts=Object.fromEntries(STAGES.map(stage=>[stage,(registry.entries||[]).filter(x=>x.status===stage).length]));
  const pending=(registry.entries||[]).filter(x=>(x.field_cases||[]).some(c=>c.status==='PENDING'||c.status==='FAIL'||c.status==='BLOCKED')).map(x=>x.capability_id);
  console.log('Evidence gate PASS',JSON.stringify({entries:registry.entries.length,counts,pendingFieldAcceptance:pending}));
}

if(process.argv[1]&&new URL(import.meta.url).pathname.endsWith(process.argv[1].replace(/\\/g,'/')))runEvidenceGate();
