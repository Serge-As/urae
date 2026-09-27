import type {FounderControlSnapshot} from '../../founder-control/src/index.js';
import type {FounderLearningDiscovery,FounderLearningStats} from '../../founder-observatory/src/index.js';

export interface FounderAIBriefInput{
  query:string;
  knowledgeContext:{knowledge?:Array<Record<string,unknown>>;capabilities?:Array<Record<string,unknown>>;guardrails?:Record<string,unknown>};
  control?:FounderControlSnapshot;
  learning?:{stats:FounderLearningStats;discoveries:FounderLearningDiscovery[];privacy:string};
}
export interface FounderAIBrief{
  query:string;generatedAt:string;
  priorities:Array<{kind:'INCIDENT'|'CAPABILITY'|'KNOWLEDGE'|'DISCOVERY';title:string;reason:string;evidenceRef:string;severity:'INFO'|'WATCH'|'HIGH'|'CRITICAL'}>;
  evidence:{knowledge:Array<Record<string,unknown>>;capabilities:Array<Record<string,unknown>>;discoveries:FounderLearningDiscovery[]};
  suggestedActions:Array<{label:string;evidenceRef:string;canExecute:false}>;
  guardrails:{founderTeamOnly:true;canExplain:true;canSuggest:true;canExecute:false;canWriteLedger:false;canActivateRules:false;rawMemberData:false;rawGroupLearningData:false};
}
const text=(v:unknown)=>String(v??'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const match=(query:string,...values:unknown[])=>{const q=text(query).split(/\s+/).filter(Boolean);if(!q.length)return true;const h=text(values.join(' '));return q.every(x=>h.includes(x));};
export class FounderAIService{
  synthesize(input:FounderAIBriefInput):FounderAIBrief{
    const priorities:FounderAIBrief['priorities']=[],actions:FounderAIBrief['suggestedActions']=[],query=input.query.trim();
    for(const i of input.control?.incidents??[]){
      if(['RESOLVED','CLOSED'].includes(i.status)||!match(query,i.title,i.status,i.priority,i.data?.note))continue;
      const severity=i.priority==='CRITICAL'?'CRITICAL':i.priority==='HIGH'?'HIGH':'WATCH',ref='founder-control:incident:'+i.id;
      priorities.push({kind:'INCIDENT',title:i.title,reason:'Incident '+i.status+' · priorité '+i.priority,evidenceRef:ref,severity});actions.push({label:'Examiner et traiter cet incident avec preuve',evidenceRef:ref,canExecute:false});
    }
    for(const c of input.control?.capabilities??[]){
      if(!['FAIL','DEGRADED'].includes(c.health)||!match(query,c.id,c.labelFr,c.labelEn,c.health,c.healthNote))continue;
      const ref='founder-control:capability:'+c.id;priorities.push({kind:'CAPABILITY',title:c.labelFr||c.id,reason:'Santé '+c.health+(c.healthNote?' · '+c.healthNote:''),evidenceRef:ref,severity:c.health==='FAIL'?'CRITICAL':'HIGH'});actions.push({label:'Ouvrir la capacité et vérifier sa preuve de santé',evidenceRef:ref,canExecute:false});
    }
    for(const k of input.knowledgeContext.knowledge??[]){
      if(!match(query,k.title,k.kind,k.state,k.sourceRef))continue;const ref='knowledge:'+String(k.id??k.itemId??'unknown');priorities.push({kind:'KNOWLEDGE',title:String(k.title??'Connaissance'),reason:'Connaissance '+String(k.state??'')+(k.stale?' · à revalider':''),evidenceRef:ref,severity:k.stale?'WATCH':'INFO'});
    }
    const discoveries=(input.learning?.discoveries??[]).filter(d=>match(query,d.category,d.key,d.value));
    for(const d of discoveries.slice(0,20)){const ref='collective-learning:'+d.category+':'+d.key;priorities.push({kind:'DISCOVERY',title:d.key,reason:d.value+' · '+d.supportingGroups+' groupes · confiance '+d.averageConfidence,evidenceRef:ref,severity:'INFO'});}
    const order={CRITICAL:0,HIGH:1,WATCH:2,INFO:3};priorities.sort((a,b)=>order[a.severity]-order[b.severity]||a.title.localeCompare(b.title));
    return{query,generatedAt:new Date().toISOString(),priorities:priorities.slice(0,50),evidence:{knowledge:input.knowledgeContext.knowledge??[],capabilities:input.knowledgeContext.capabilities??[],discoveries:discoveries.slice(0,50)},suggestedActions:actions.slice(0,30),guardrails:{founderTeamOnly:true,canExplain:true,canSuggest:true,canExecute:false,canWriteLedger:false,canActivateRules:false,rawMemberData:false,rawGroupLearningData:false}};
  }
}
