import type {D1DatabaseLike} from '../../repositories/src/index.js';

export type EngagementAction='IMPRESSION'|'OPEN'|'DWELL_10S'|'COMPLETE'|'SAVE'|'SHARE'|'JOIN'|'RSVP'|'PURCHASE_INTENT'|'SEARCH_CLICK'|'SKIP'|'HIDE'|'NOT_INTERESTED';
export interface EngagementSignal {
  itemId:string;itemKind:string;action:EngagementAction;source:string;groupId?:string;locality?:string;tags?:string[];sessionId?:string;
}
export interface RecommendationCandidate {
  id:string;kind:string;title:string;source:string;tags:string[];locality?:string;freshnessAt?:string;groupId?:string;
  payload?:Record<string,string|number|boolean|null>;
}
export interface RankedRecommendation extends RecommendationCandidate {
  score:number;reasonCodes:string[];why:string[];
}
export interface Affinity {dimension:string;value:string;score:number;positiveCount:number;negativeCount:number;updatedAt:string;}

const ACTION_WEIGHT:Record<EngagementAction,number>={
  IMPRESSION:0.05,OPEN:1.5,DWELL_10S:2,COMPLETE:3,SAVE:4,SHARE:5,JOIN:7,RSVP:6,PURCHASE_INTENT:6,SEARCH_CLICK:3,
  SKIP:-1,HIDE:-6,NOT_INTERESTED:-8
};
const POSITIVE=new Set<EngagementAction>(['OPEN','DWELL_10S','COMPLETE','SAVE','SHARE','JOIN','RSVP','PURCHASE_INTENT','SEARCH_CLICK']);
const NEGATIVE=new Set<EngagementAction>(['SKIP','HIDE','NOT_INTERESTED']);
const SENSITIVE=/(^|[._:-])(debt|balance|financial|finance|health|medical|assistance|dispute|identity|contact|phone|email|loan|arrears?|salary|income|religion|politic|sexual|criminal)([._:-]|$)/i;
const clean=(v:string,max=160)=>v.trim().replace(/\s+/g,' ').slice(0,max);
const normalize=(v:string)=>clean(v,120).toLowerCase();
const safeTags=(tags:string[]|undefined)=>[...new Set((tags??[]).map(normalize).filter(Boolean).filter(x=>!SENSITIVE.test(x)))].slice(0,24);
const now=()=>new Date().toISOString();
const days=(iso:string)=>Math.max(0,(Date.now()-Date.parse(iso))/(24*60*60*1000));
const decay=(score:number,updatedAt:string)=>score*Math.exp(-days(updatedAt)/60);
const hashBucket=async(value:string)=>{
  const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
  return ((b[0]??0)<<8)+(b[1]??0);
};
const affinityKey=(dimension:string,value:string)=>dimension+'\u0000'+normalize(value);

export class EcoPulseService{
  constructor(public db:D1DatabaseLike){}

  async record(accountId:string,input:EngagementSignal){
    const itemId=clean(input.itemId),itemKind=normalize(input.itemKind),source=normalize(input.source),locality=input.locality?normalize(input.locality):undefined;
    if(!itemId||!itemKind||!source)throw new Error('INVALID_ENGAGEMENT_SIGNAL');
    if(SENSITIVE.test(itemKind)||SENSITIVE.test(source))throw new Error('SENSITIVE_ENGAGEMENT_FEATURE_FORBIDDEN');
    const tags=safeTags(input.tags),weight=ACTION_WEIGHT[input.action];
    if(weight===undefined)throw new Error('INVALID_ENGAGEMENT_ACTION');
    const eventId='eng_'+crypto.randomUUID(),stamp=now();
    await this.db.prepare(`INSERT INTO engagement_events(event_id,account_id,group_id,item_id,item_kind,action,source,locality,tags_json,weight,session_id,occurred_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(eventId,accountId,input.groupId??null,itemId,itemKind,input.action,source,locality??null,JSON.stringify(tags),weight,input.sessionId?clean(input.sessionId,120):null,stamp).run();

    if(input.action!=='IMPRESSION'){
      const dims:Array<[string,string,number]>=[['kind',itemKind,0.9],['source',source,0.65],...tags.map(t=>['tag',t,1] as [string,string,number])];
      if(locality)dims.push(['locality',locality,0.75]);
      for(const [dimension,value,multiplier] of dims){
        const delta=weight*multiplier,positive=POSITIVE.has(input.action)?1:0,negative=NEGATIVE.has(input.action)?1:0;
        await this.db.prepare(`INSERT INTO engagement_affinities(account_id,dimension,affinity_value,score,positive_count,negative_count,updated_at)
          VALUES(?,?,?,?,?,?,?)
          ON CONFLICT(account_id,dimension,affinity_value) DO UPDATE SET
            score=engagement_affinities.score+excluded.score,
            positive_count=engagement_affinities.positive_count+excluded.positive_count,
            negative_count=engagement_affinities.negative_count+excluded.negative_count,
            updated_at=excluded.updated_at`).bind(accountId,dimension,value,delta,positive,negative,stamp).run();
      }
    }
    const counters:{[K in EngagementAction]?:string}={IMPRESSION:'impressions',OPEN:'opens',SAVE:'saves',SHARE:'shares',JOIN:'joins',HIDE:'hides',NOT_INTERESTED:'hides'};
    const column=counters[input.action];
    await this.db.prepare(`INSERT INTO engagement_item_stats(item_kind,item_id,impressions,opens,saves,shares,joins,hides,updated_at)
      VALUES(?,?,0,0,0,0,0,0,?)
      ON CONFLICT(item_kind,item_id) DO UPDATE SET updated_at=excluded.updated_at`).bind(itemKind,itemId,stamp).run();
    if(column)await this.db.prepare(`UPDATE engagement_item_stats SET ${column}=${column}+1,updated_at=? WHERE item_kind=? AND item_id=?`).bind(stamp,itemKind,itemId).run();
    return{eventId,accepted:true,weight};
  }

  async affinities(accountId:string,limit=40):Promise<Affinity[]>{
    const rows=await this.db.prepare(`SELECT dimension,affinity_value,score,positive_count,negative_count,updated_at
      FROM engagement_affinities WHERE account_id=? ORDER BY score DESC LIMIT ?`).bind(accountId,Math.min(Math.max(Math.trunc(limit),1),100)).all<Record<string,unknown>>();
    return rows.results.map(r=>({dimension:String(r.dimension),value:String(r.affinity_value),score:Number(decay(Number(r.score),String(r.updated_at)).toFixed(3)),positiveCount:Number(r.positive_count),negativeCount:Number(r.negative_count),updatedAt:String(r.updated_at)}));
  }

  async rank(accountId:string,candidates:RecommendationCandidate[],input:{locality?:string;limit?:number;dayKey?:string}={}):Promise<RankedRecommendation[]>{
    const limit=Math.min(Math.max(Math.trunc(input.limit??12),1),30),aff=await this.affinities(accountId,100),map=new Map(aff.map(a=>[affinityKey(a.dimension,a.value),a.score]));
    const [recent,statsRows]=await Promise.all([
      this.db.prepare(`SELECT item_id,item_kind,action,occurred_at FROM engagement_events WHERE account_id=? ORDER BY occurred_at DESC LIMIT 300`).bind(accountId).all<Record<string,unknown>>(),
      this.db.prepare(`SELECT * FROM engagement_item_stats ORDER BY updated_at DESC LIMIT 1000`).all<Record<string,unknown>>()
    ]);
    const statsMap=new Map(statsRows.results.map(r=>[String(r.item_kind)+'\u0000'+String(r.item_id),r]));
    const opened=new Map<string,string>(),hidden=new Set<string>();
    for(const r of recent.results){const key=String(r.item_kind)+'\u0000'+String(r.item_id);if(['HIDE','NOT_INTERESTED'].includes(String(r.action)))hidden.add(key);if(['OPEN','JOIN','SAVE','SHARE'].includes(String(r.action))&&!opened.has(key))opened.set(key,String(r.occurred_at));}
    const ranked:RankedRecommendation[]=[];
    for(const raw of candidates.slice(0,500)){
      const candidate={...raw,tags:safeTags(raw.tags),kind:normalize(raw.kind),source:normalize(raw.source),locality:raw.locality?normalize(raw.locality):undefined};
      const key=candidate.kind+'\u0000'+candidate.id;if(hidden.has(key))continue;
      let score=10;const reasonCodes:string[]=[],why:string[]=[];
      const signals:Array<[string,string]>=[['kind',candidate.kind],['source',candidate.source],...candidate.tags.map(t=>['tag',t] as [string,string])];
      if(candidate.locality)signals.push(['locality',candidate.locality]);
      const affinity=signals.reduce((n,[d,v])=>n+(map.get(affinityKey(d,v))??0),0);
      if(affinity>0){score+=Math.min(28,affinity*1.6);reasonCodes.push('PERSONAL_AFFINITY');why.push('Correspond à vos interactions et centres d’intérêt');}
      if(input.locality&&candidate.locality===normalize(input.locality)){score+=6;reasonCodes.push('LOCALITY');why.push('Proche de votre zone');}
      if(candidate.freshnessAt&&Number.isFinite(Date.parse(candidate.freshnessAt))){const bonus=Math.max(0,8-days(candidate.freshnessAt)*0.45);if(bonus>1){score+=bonus;reasonCodes.push('FRESH');why.push('Contenu récent');}}
      const stats=statsMap.get(key);
      if(stats){const rawPopularity=Number(stats.opens??0)+2*Number(stats.saves??0)+3*Number(stats.shares??0)+4*Number(stats.joins??0)-2*Number(stats.hides??0);const popularity=Math.log1p(Math.max(0,rawPopularity));if(popularity>0.4){score+=Math.min(10,popularity*1.5);reasonCodes.push('COMMUNITY_SIGNAL');why.push('Intéresse aussi d’autres utilisateurs');}}
      const seenAt=opened.get(key);if(seenAt){const age=days(seenAt);score-=age<1?16:age<7?8:3;reasonCodes.push('RECENTLY_SEEN');}
      const bucket=await hashBucket(accountId+'|'+candidate.id+'|'+(input.dayKey??new Date().toISOString().slice(0,10)));
      if(bucket%100<15){score+=5;reasonCodes.push('EXPLORATION');why.push('Découverte volontaire pour élargir vos suggestions');}
      ranked.push({...candidate,score:Number(score.toFixed(3)),reasonCodes,why:[...new Set(why)].slice(0,4)});
    }
    ranked.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
    const result:RankedRecommendation[]=[],kindCount=new Map<string,number>(),sourceCount=new Map<string,number>();
    for(const item of ranked){
      if(result.length>=limit)break;
      if((kindCount.get(item.kind)??0)>=3||(sourceCount.get(item.source)??0)>=4)continue;
      if(result.length&&result[result.length-1]?.source===item.source&&(sourceCount.get(item.source)??0)>=2)continue;
      result.push(item);kindCount.set(item.kind,(kindCount.get(item.kind)??0)+1);sourceCount.set(item.source,(sourceCount.get(item.source)??0)+1);
    }
    return result;
  }
}
