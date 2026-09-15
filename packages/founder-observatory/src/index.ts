import type {D1DatabaseLike} from '../../repositories/src/index.js';
import type {SafeCollectiveSignal} from '../../concierge-learning/src/index.js';

export interface FounderLearningDiscovery {
  category:SafeCollectiveSignal['category'];
  key:string;
  value:string;
  supportingGroups:number;
  averageConfidence:number;
  lastSeenAt:string;
  privacy:'K_ANONYMIZED';
}
export interface FounderLearningStats {
  sanitizedSignals:number;
  pseudonymousGroups:number;
  discoveries:number;
  minGroups:number;
}

const allowed=new Set(['MEETING_RHYTHM','RUBRIC_PATTERN','OPERATING_PRACTICE','UX_PREFERENCE','MARKET_INTEREST','COMMUNITY_INTEREST']);
const hex=(bytes:ArrayBuffer)=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
const sha=async(value:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
const hmac=async(secret:string,value:string)=>{
  if(secret.length<24)throw new Error('LEARNING_PEPPER_REQUIRED');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
};
const clean=(value:string,max:number)=>value.trim().replace(/\s+/g,' ').slice(0,max);

export class FounderLearningStore{
  constructor(public db:D1DatabaseLike,public pepper:string){}

  async ingest(groupCode:string,signals:SafeCollectiveSignal[]):Promise<{accepted:number}>{
    if(!signals.length)return{accepted:0};
    const groupToken=await hmac(this.pepper,'group:'+groupCode),stamp=new Date().toISOString();
    let accepted=0;
    for(const signal of signals){
      if(!allowed.has(signal.category))continue;
      const key=clean(signal.key,160),value=clean(signal.value,500);
      if(!key||!value||!Number.isFinite(signal.confidence)||signal.confidence<0||signal.confidence>1)continue;
      const sourceFingerprint=await sha(JSON.stringify([signal.category,key,value]));
      const signalId=await sha(JSON.stringify([groupToken,signal.category,key,value]));
      await this.db.prepare(`INSERT INTO collective_learning_signals
        (signal_id,group_token,category,signal_key,signal_value,confidence,source_fingerprint,first_seen_at,last_seen_at)
        VALUES(?,?,?,?,?,?,?,?,?)
        ON CONFLICT(group_token,category,signal_key,signal_value) DO UPDATE SET
          confidence=excluded.confidence,
          source_fingerprint=excluded.source_fingerprint,
          last_seen_at=excluded.last_seen_at`)
        .bind(signalId,groupToken,signal.category,key,value,signal.confidence,sourceFingerprint,stamp,stamp).run();
      accepted++;
    }
    return{accepted};
  }

  async discoveries(minGroups=5,limit=100):Promise<FounderLearningDiscovery[]>{
    if(!Number.isSafeInteger(minGroups)||minGroups<5)throw new Error('MIN_GROUP_THRESHOLD_TOO_LOW');
    const safeLimit=Math.min(Math.max(Math.trunc(limit),1),250);
    const result=await this.db.prepare(`SELECT category, signal_key, signal_value,
        COUNT(DISTINCT group_token) AS supporting_groups,
        AVG(confidence) AS average_confidence,
        MAX(last_seen_at) AS last_seen_at
      FROM collective_learning_signals
      GROUP BY category, signal_key, signal_value
      HAVING COUNT(DISTINCT group_token) >= ?
      ORDER BY supporting_groups DESC, last_seen_at DESC
      LIMIT ?`).bind(minGroups,safeLimit).all<Record<string,unknown>>();
    return result.results.map(row=>({
      category:String(row.category) as FounderLearningDiscovery['category'],
      key:String(row.signal_key),value:String(row.signal_value),
      supportingGroups:Number(row.supporting_groups),
      averageConfidence:Number(Number(row.average_confidence).toFixed(3)),
      lastSeenAt:String(row.last_seen_at),privacy:'K_ANONYMIZED' as const
    }));
  }

  async stats(minGroups=5):Promise<FounderLearningStats>{
    const totals=await this.db.prepare(`SELECT COUNT(*) AS signals, COUNT(DISTINCT group_token) AS groups FROM collective_learning_signals`).first<Record<string,unknown>>();
    const discoveries=await this.discoveries(minGroups,250);
    return{sanitizedSignals:Number(totals?.signals??0),pseudonymousGroups:Number(totals?.groups??0),discoveries:discoveries.length,minGroups};
  }
}
