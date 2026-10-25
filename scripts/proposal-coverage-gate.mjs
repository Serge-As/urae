import {readFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
const referenceMeaning='REFERENCE_TO_EVALUATE_WITHIN_TARGET_LOTS_NOT_AUTOMATIC_DEPENDENCY_INSTALL';
const adoptedMeanings=new Set(['REVIEWED_REUSE_OF_EXISTING_TOOL','REVIEWED_ON_DEMAND_LOCAL_TOOL_INTEGRATION']);
function proofPath(root,path){
  if(typeof path!=='string'||!path||path.includes('\\')||path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('PROPOSAL_EVIDENCE_PATH_INVALID:'+path);
  const resolved=resolve(root,path),within=relative(root,resolved);
  if(isAbsolute(within)||within==='..'||within.startsWith('../')||within.startsWith('..\\'))throw Error('PROPOSAL_EVIDENCE_PATH_INVALID:'+path);
  return resolved;
}
export function verifyProposalCoverage(reg){
  const expected=['A','I','T','M'].flatMap((prefix,i)=>Array.from({length:[28,20,24,20][i]},(_,n)=>prefix+String(n+1).padStart(2,'0')));
  if(reg.count!==92||reg.lotCount!==28||!Array.isArray(reg.proposals)||reg.proposals.length!==92)throw Error('PROPOSAL_COUNT_MISMATCH');
  const ids=new Set(),lots=new Set();
  for(const p of reg.proposals){
    if(!expected.includes(p.id)||ids.has(p.id))throw Error('PROPOSAL_ID_MISMATCH');ids.add(p.id);
    if(!Array.isArray(p.targetLots)||!p.targetLots.length||new Set(p.targetLots).size!==p.targetLots.length||p.targetLots.some(n=>!Number.isInteger(n)||n<1||n>28)||!p.targetLots.includes(p.ownerLot))throw Error('PROPOSAL_LOT_MAPPING_MISSING:'+p.id);
    for(const n of p.targetLots)lots.add(n);
    if(!p.acceptanceCriteria?.length||!p.integrationPlan?.length)throw Error('PROPOSAL_ACCEPTANCE_MISSING:'+p.id);
    if(/^[TM]/.test(p.id)){
      const reference=p.status==='REFERENCE_MODEL_NOT_IMPORTED'&&p.integrationMeaning===referenceMeaning;
      const adopted=p.id.startsWith('T')&&p.status==='REVIEWED_TOOL_IN_USE'&&adoptedMeanings.has(p.integrationMeaning)&&p.adoptionDecision!=='KEEP_EXISTING_OWNER_UNTIL_MEASURED_BENEFIT'&&p.evidence?.length&&p.adoptedScope;
      if(!p.adoptionDecision||!p.sourceUrl||(!reference&&!adopted))throw Error('PROPOSAL_REFERENCE_ADOPTION_REQUIRES_REVIEW:'+p.id);
    }
    if(p.status==='DELIVERED_WITH_DOCUMENTED_LIMITS'&&(!p.evidence?.length||!p.limits))throw Error('PROPOSAL_DELIVERY_PROOF_MISSING:'+p.id);
  }
  if(expected.some(id=>!ids.has(id))||lots.size!==28)throw Error('PROPOSAL_COVERAGE_INCOMPLETE');
  return {proposals:ids.size,lots:lots.size,product:28,innovations:20,tools:24,models:20,assignmentIsNotImplementation:true};
}
export async function verifyProposalEvidence(reg,{root=defaultRoot}={}){
  const coverage=verifyProposalCoverage(reg),files=new Map();root=resolve(root);
  for(const p of reg.proposals){
    for(const path of p.evidence??[]){
      const absolute=proofPath(root,path);if(files.has(path))continue;
      let text;try{text=await readFile(absolute,'utf8');}catch{throw Error('PROPOSAL_EVIDENCE_NOT_READABLE:'+p.id+':'+path);}
      if(!text.trim())throw Error('PROPOSAL_EVIDENCE_EMPTY:'+p.id+':'+path);
      let value;if(path.endsWith('.json')){try{value=JSON.parse(text);}catch{throw Error('PROPOSAL_EVIDENCE_JSON_INVALID:'+p.id+':'+path);}}
      files.set(path,{text,value});
    }
  }
  // Existence is necessary, but a historic receipt for a different source must
  // never certify the current integrated functional programme.
  for(const p of reg.proposals.filter(p=>/^[AI]/.test(p.id)&&p.status==='DELIVERED_WITH_DOCUMENTED_LIMITS')){
    if(!/^[a-f0-9]{40}$/.test(reg.lastVerifiedSource??'')||!p.evidence.some(path=>{
      const receipt=files.get(path)?.value;
      return receipt?.protocol==='ECO_RELEASE_QUALIFICATION_1'&&receipt.sourceSha===reg.lastVerifiedSource&&receipt.sameSource===true&&receipt.failed===0&&receipt.skipped===0&&receipt.native>0&&receipt.chromium>0&&receipt.webkit>0&&receipt.fieldAcceptance==='NOT_ACCEPTED'&&receipt.realMoneyEnabled===false;
    }))throw Error('PROPOSAL_EXACT_SOURCE_QUALIFICATION_MISSING:'+p.id);
  }
  return {...coverage,evidenceFiles:files.size,sourceSha:reg.lastVerifiedSource,fieldAcceptance:'NOT_ACCEPTED'};
}
if(process.argv[1]?.replace(/\\/g,'/').endsWith('/proposal-coverage-gate.mjs')){
  const register=JSON.parse(await readFile(new URL('../docs/implementation/PROPOSALS_REGISTER_2026-10-20.json',import.meta.url),'utf8'));
  console.log('PROPOSAL_COVERAGE_PASS '+JSON.stringify(await verifyProposalEvidence(register)));
}
