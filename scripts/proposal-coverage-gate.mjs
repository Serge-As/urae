import {readFile} from 'node:fs/promises';
export function verifyProposalCoverage(reg){
  const expected=['A','I','T','M'].flatMap((prefix,i)=>Array.from({length:[28,20,24,20][i]},(_,n)=>prefix+String(n+1).padStart(2,'0')));
  if(reg.count!==92||reg.lotCount!==28||!Array.isArray(reg.proposals)||reg.proposals.length!==92)throw Error('PROPOSAL_COUNT_MISMATCH');
  const ids=new Set(),lots=new Set();
  for(const p of reg.proposals){
    if(!expected.includes(p.id)||ids.has(p.id))throw Error('PROPOSAL_ID_MISMATCH');ids.add(p.id);
    if(!Array.isArray(p.targetLots)||!p.targetLots.length||new Set(p.targetLots).size!==p.targetLots.length||p.targetLots.some(n=>!Number.isInteger(n)||n<1||n>28)||!p.targetLots.includes(p.ownerLot))throw Error('PROPOSAL_LOT_MAPPING_MISSING:'+p.id);
    for(const n of p.targetLots)lots.add(n);
    if(!p.acceptanceCriteria?.length||!p.integrationPlan?.length)throw Error('PROPOSAL_ACCEPTANCE_MISSING:'+p.id);
    if(/^[TM]/.test(p.id)&&(!p.adoptionDecision||!p.sourceUrl||p.integrationMeaning!=='REFERENCE_TO_EVALUATE_WITHIN_TARGET_LOTS_NOT_AUTOMATIC_DEPENDENCY_INSTALL'||p.status!=='REFERENCE_MODEL_NOT_IMPORTED'))throw Error('PROPOSAL_REFERENCE_ADOPTION_REQUIRES_REVIEW:'+p.id);
    if(p.status==='DELIVERED_WITH_DOCUMENTED_LIMITS'&&(!p.evidence?.length||!p.limits))throw Error('PROPOSAL_DELIVERY_PROOF_MISSING:'+p.id);
  }
  if(expected.some(id=>!ids.has(id))||lots.size!==28)throw Error('PROPOSAL_COVERAGE_INCOMPLETE');
  return {proposals:ids.size,lots:lots.size,product:28,innovations:20,tools:24,models:20,assignmentIsNotImplementation:true};
}
if(process.argv[1]?.replace(/\\/g,'/').endsWith('/proposal-coverage-gate.mjs')){
  const register=JSON.parse(await readFile(new URL('../docs/implementation/PROPOSALS_REGISTER_2026-10-20.json',import.meta.url),'utf8'));
  console.log('PROPOSAL_COVERAGE_PASS '+JSON.stringify(verifyProposalCoverage(register)));
}
