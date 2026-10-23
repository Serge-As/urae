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
