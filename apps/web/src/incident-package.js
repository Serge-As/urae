// No free text, URL, account identifier, amount or source error can enter this package.
const categories=['secondary-read','financial-read','live-control','authentication','write','other-read'];
const counts=['calls','networkRequests','coalesced','localResponses','failures','completed','decodedJsonBytes'];
const bounded=v=>Number.isSafeInteger(v)&&v>=0?Math.min(v,1_000_000_000):0;
export function createIncidentPackage({version,mode,category,monitor}={}){
  if(!/^\d+\.\d+\.\d+(?:\.\d+)?(?:-[a-z0-9-]+)?$/.test(String(version??'')))throw Error('INCIDENT_RELEASE_VERSION_REQUIRED');
  if(!['visual','senior','assisted'].includes(mode))throw Error('INCIDENT_DISPLAY_MODE_REQUIRED');
  const scenarios={SYNC:'two-actor-conflict',TABLE:'twenty-rubric-partition',REVIEW:'member-transition-review',OTHER:'manual-reproduction-needed'};
  if(!Object.hasOwn(scenarios,category))throw Error('INCIDENT_CATEGORY_REQUIRED');
  return{protocol:'ECO_INCIDENT_MINIMAL_1',release:version,mode,category,createdAt:new Date().toISOString(),requestCounts:categories.map(category=>{const input=monitor?.rows?.find(x=>x.category===category)??{};return{category,...Object.fromEntries(counts.map(k=>[k,bounded(input[k])]))};}),syntheticTemplate:scenarios[category],actualFaultReproduced:false,requiresLocalReproduction:true,containsUserInput:false,containsFinancialData:false,containsIdentity:false};
}

const replayStates=new Set(['LOAN_DISBURSED','OFFLINE_QUEUE_RESTORED','SERVER_COMMITTED_ACK_LOST','FAILED_QUEUE_SAVED','FAILED_QUEUE_RELOADED','SAME_COMMAND_RETRIED','LIVE_TRANSPORT_RESTORED','DURABLE_PROJECTIONS_RETRIED','CANONICAL_INVARIANTS_VERIFIED']);
const replayKeys=['protocol','recipeVersion','release','mode','scenario','sampleProvenance','timeline','expectedTotals','observation','containsRealIdentity','containsRealFinancialData'];
const expectedTotals={borrowed:10000,repaid:4000,remainingPrincipal:6000,cashBalance:14000};
export function createIncidentReplay(report,{version,mode}={}){
  createIncidentPackage({version,mode,category:'SYNC'});
  if(report?.protocol!=='ECO_ENGINE_REHEARSAL_1'||report.recipeVersion!==1||report.syntheticOnly!==true||!['LOST_ACK','LIVE_OUTAGE'].includes(report.scenario)||!Array.isArray(report.checks)||!report.checks.length||report.checks.some(x=>typeof x.passed!=='boolean')||!Array.isArray(report.timeline))throw Error('INCIDENT_REPLAY_RESULT_INVALID');
  const timeline=report.timeline.map((row,index)=>{if(row.step!==index+1||!replayStates.has(row.state))throw Error('INCIDENT_REPLAY_TIMELINE_INVALID');return{step:index+1,state:row.state};});
  const value={protocol:'ECO_INCIDENT_REPLAY_1',recipeVersion:1,release:version,mode,scenario:report.scenario,sampleProvenance:'SYNTHETIC_REPLAY_OF_KNOWN_FAILURE_PATTERN',timeline,expectedTotals:{...expectedTotals},observation:{faultObserved:report.faultObserved===true,recovered:report.recovered===true,checks:report.checks.length,passed:report.checks.filter(x=>x.passed).length},containsRealIdentity:false,containsRealFinancialData:false};
  parseIncidentReplay(JSON.stringify(value));return value;
}
export function parseIncidentReplay(text){
  if(typeof text!=='string'||text.length>16000)throw Error('INCIDENT_REPLAY_SIZE_LIMIT');
  let value;try{value=JSON.parse(text);}catch{throw Error('INCIDENT_REPLAY_JSON_INVALID');}
  const exact=(object,keys)=>object&&typeof object==='object'&&!Array.isArray(object)&&Object.keys(object).length===keys.length&&Object.keys(object).every(k=>keys.includes(k));
  if(!exact(value,replayKeys)||value.protocol!=='ECO_INCIDENT_REPLAY_1'||value.recipeVersion!==1||!['LOST_ACK','LIVE_OUTAGE'].includes(value.scenario)||value.sampleProvenance!=='SYNTHETIC_REPLAY_OF_KNOWN_FAILURE_PATTERN'||value.containsRealIdentity!==false||value.containsRealFinancialData!==false)throw Error('INCIDENT_REPLAY_SCHEMA_INVALID');
  createIncidentPackage({version:value.release,mode:value.mode,category:'SYNC'});
  if(!exact(value.expectedTotals,Object.keys(expectedTotals))||Object.keys(expectedTotals).some(key=>value.expectedTotals[key]!==expectedTotals[key]))throw Error('INCIDENT_REPLAY_SYNTHETIC_VALUES_REQUIRED');
  if(!Array.isArray(value.timeline)||value.timeline.length<1||value.timeline.length>12||value.timeline.some((row,i)=>!exact(row,['step','state'])||row.step!==i+1||!replayStates.has(row.state)))throw Error('INCIDENT_REPLAY_TIMELINE_INVALID');
  const o=value.observation;if(!exact(o,['faultObserved','recovered','checks','passed'])||typeof o.faultObserved!=='boolean'||typeof o.recovered!=='boolean'||!Number.isSafeInteger(o.checks)||o.checks<1||o.checks>100||!Number.isSafeInteger(o.passed)||o.passed<0||o.passed>o.checks)throw Error('INCIDENT_REPLAY_OBSERVATION_INVALID');
  // Imported observations are claims, never a new proof or authority.
  return{scenario:value.scenario,recordedRelease:value.release,mode:value.mode,recipeVersion:1,previousObservationUnverified:true};
}
