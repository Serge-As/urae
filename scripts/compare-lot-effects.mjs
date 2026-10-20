import {readFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';

export function compareLotEffects(before,after){
  for(const report of [before,after]){
    if(report?.schema!=='ECO_EFFECT_MIRROR_V1'||typeof report.scenario!=='string'||!report.scenario||!/^([a-f0-9]{64})$/.test(report.commandsSha256??'')||!report.effects||typeof report.effects!=='object'||Array.isArray(report.effects)||!Object.keys(report.effects).length)throw Error('MIRROR_INCOMPLETE_REPORT');
    for(const k of ['networkRequests','reads','writes','idleRequests'])if(!Number.isSafeInteger(report.metrics?.[k])||report.metrics[k]<0)throw Error('MIRROR_INVALID_METRIC');
    if(report.metrics.reads+report.metrics.writes!==report.metrics.networkRequests)throw Error('MIRROR_INCONSISTENT_METRICS');
  }
  if(before.scenario!==after.scenario||before.commandsSha256!==after.commandsSha256)throw Error('MIRROR_DIFFERENT_SCENARIOS');
  const sameEffects=isDeepStrictEqual(before.effects,after.effects),writesPreserved=before.metrics.writes===after.metrics.writes,
    idlePreserved=after.metrics.idleRequests<=before.metrics.idleRequests,savedRequests=before.metrics.networkRequests-after.metrics.networkRequests;
  return{schema:'ECO_EFFECT_COMPARISON_V1',scenario:before.scenario,sameEffects,writesPreserved,idlePreserved,savedRequests,
    reductionPercent:before.metrics.networkRequests?Math.round(10000*savedRequests/before.metrics.networkRequests)/100:0,
    pass:sameEffects&&writesPreserved&&idlePreserved&&savedRequests>0,
    limits:'Measured synthetic scenario only. No provider-billing or universal-equivalence claim.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    if(process.argv.length!==4)throw Error('Usage: node scripts/compare-lot-effects.mjs before.json after.json');
    const raw=await Promise.all(process.argv.slice(2).map(p=>readFile(p,'utf8')));if(raw.some(s=>s.length>1000000))throw Error('MIRROR_REPORT_TOO_LARGE');
    const result=compareLotEffects(...raw.map(s=>JSON.parse(s)));console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
  }catch(error){console.error(error.message);process.exitCode=1;}
}
