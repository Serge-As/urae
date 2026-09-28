export interface SovereignJournalEvent {
  id:string;tenantId:string;groupId:string;actorId:string;sequence:number;type:string;
  payload:Record<string,unknown>;createdAt:string;previousHash:string;hash:string;
}
export interface RelayKeyRecord {tenantId:string;groupId:string;membershipId:string;keyId:string;rawKey:string;createdAt:string;}
export interface SovereignSnapshot {tenantId:string;groupId:string;exportedAt:string;appVersion:string;state:Record<string,unknown>;}
export interface EcoVaultEnvelope {protocol:'ECOVAULT1';salt:string;iv:string;iterations:number;ciphertext:string;fingerprint:string;}
interface JournalHeadRecord {id:string;tenantId:string;groupId:string;sequence:number;hash:string;}

const DB='eco-system-sovereign-v1',VERSION=2,EVENTS='events',KEYS='relay-keys',HEADS='journal-heads';
const te=new TextEncoder(),td=new TextDecoder();
const clone=<T>(v:T):T=>structuredClone(v);
const headId=(t:string,g:string)=>JSON.stringify([t,g]);
const openDb=():Promise<IDBDatabase>=>new Promise((resolve,reject)=>{
  if(!('indexedDB' in globalThis))return reject(Error('INDEXEDDB_UNAVAILABLE'));
  const request=indexedDB.open(DB,VERSION);
  request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains(EVENTS))db.createObjectStore(EVENTS,{keyPath:'id'});
    if(!db.objectStoreNames.contains(KEYS))db.createObjectStore(KEYS,{keyPath:'id'});
    if(!db.objectStoreNames.contains(HEADS))db.createObjectStore(HEADS,{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error??Error('INDEXEDDB_OPEN_FAILED'));
});
const all=<T>(store:IDBObjectStore)=>new Promise<T[]>((resolve,reject)=>{
  const modern=store as IDBObjectStore&{getAll?:()=>IDBRequest<T[]>};if(modern.getAll){const r=modern.getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);return;}
  const rows:T[]=[];const r=store.openCursor();r.onsuccess=()=>{const c=r.result;if(!c)return resolve(rows);rows.push(c.value as T);c.continue();};r.onerror=()=>reject(r.error);
});
const stable=(value:unknown):string=>{
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  return '{'+Object.keys(value as Record<string,unknown>).sort().map(k=>JSON.stringify(k)+':'+stable((value as Record<string,unknown>)[k])).join(',')+'}';
};
const hex=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const digest=async(value:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(value))));
const b64u=(bytes:Uint8Array)=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
const unb64u=(v:string)=>{const n=v.replaceAll('-','+').replaceAll('_','/'),p=n+'='.repeat((4-n.length%4)%4),raw=atob(p),o=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)o[i]=raw.charCodeAt(i);return o;};
const buffer=(b:Uint8Array):ArrayBuffer=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) as ArrayBuffer;
const keyId=(t:string,g:string,m:string)=>JSON.stringify([t,g,m]);

export async function validateSovereignJournalEvents(tenantId:string,groupId:string,events:SovereignJournalEvent[]):Promise<void>{
  const ordered=events.filter(x=>x.tenantId===tenantId&&x.groupId===groupId).slice().sort((a,b)=>a.sequence-b.sequence);
  if(ordered.length!==events.length)throw Error('SOVEREIGN_JOURNAL_SCOPE_INVALID');
  let prev='GENESIS',sequence=0;
  for(const row of ordered){
    if(row.sequence!==sequence+1||row.previousHash!==prev)throw Error('SOVEREIGN_JOURNAL_CHAIN_INVALID');
    const {id,hash,...base}=row;
    if(await digest(stable(base))!==hash)throw Error('SOVEREIGN_JOURNAL_HASH_INVALID');
    prev=hash;sequence=row.sequence;
  }
}

export class IndexedDbSovereignStore {
  static supported(){return typeof indexedDB!=='undefined'&&typeof indexedDB.open==='function';}
  private async head(tenantId:string,groupId:string):Promise<{sequence:number;hash:string;persisted:boolean}>{
    const db=await openDb();
    try{
      const stored=await new Promise<JournalHeadRecord|undefined>((resolve,reject)=>{
        const r=db.transaction(HEADS,'readonly').objectStore(HEADS).get(headId(tenantId,groupId));
        r.onsuccess=()=>resolve(r.result as JournalHeadRecord|undefined);r.onerror=()=>reject(r.error);
      });
      if(stored)return{sequence:stored.sequence,hash:stored.hash,persisted:true};
    }finally{db.close();}
    const rows=await this.list(tenantId,groupId),last=rows.at(-1);
    return{sequence:last?.sequence??0,hash:last?.hash??'GENESIS',persisted:false};
  }
  async append(input:{tenantId:string;groupId:string;actorId:string;type:string;payload:Record<string,unknown>;createdAt?:string}):Promise<SovereignJournalEvent>{
    for(let attempt=0;attempt<32;attempt++){
      const expected=await this.head(input.tenantId,input.groupId),sequence=expected.sequence+1,createdAt=input.createdAt??new Date().toISOString(),previousHash=expected.hash;
      const base={tenantId:input.tenantId,groupId:input.groupId,actorId:input.actorId,sequence,type:input.type,payload:clone(input.payload),createdAt,previousHash};
      const hash=await digest(stable(base)),event:SovereignJournalEvent={id:JSON.stringify([input.tenantId,input.groupId,sequence,hash.slice(0,16)]),...base,hash};
      const db=await openDb();
      try{
        const committed=await new Promise<boolean>((resolve,reject)=>{
          const tx=db.transaction([EVENTS,HEADS],'readwrite'),events=tx.objectStore(EVENTS),heads=tx.objectStore(HEADS),r=heads.get(headId(input.tenantId,input.groupId));
          let conflict=false;
          r.onsuccess=()=>{
            const current=r.result as JournalHeadRecord|undefined;
            if(current&&(current.sequence!==expected.sequence||current.hash!==expected.hash)){conflict=true;tx.abort();return;}
            if(!current&&expected.persisted){conflict=true;tx.abort();return;}
            events.add(clone(event));
            heads.put({id:headId(input.tenantId,input.groupId),tenantId:input.tenantId,groupId:input.groupId,sequence,hash} satisfies JournalHeadRecord);
          };
          r.onerror=()=>reject(r.error);
          tx.oncomplete=()=>resolve(true);
          tx.onabort=()=>conflict?resolve(false):reject(tx.error??Error('SOVEREIGN_APPEND_ABORTED'));
          tx.onerror=()=>reject(tx.error??Error('SOVEREIGN_APPEND_FAILED'));
        });
        if(committed)return clone(event);
      }finally{db.close();}
    }
    throw Error('SOVEREIGN_APPEND_CONTENTION');
  }
  async list(tenantId:string,groupId:string):Promise<SovereignJournalEvent[]>{
    const db=await openDb();try{return (await all<SovereignJournalEvent>(db.transaction(EVENTS,'readonly').objectStore(EVENTS))).filter(x=>x.tenantId===tenantId&&x.groupId===groupId).sort((a,b)=>a.sequence-b.sequence);}finally{db.close();}
  }
  async verify(tenantId:string,groupId:string):Promise<{ok:boolean;count:number;brokenAt?:number}>{
    const rows=await this.list(tenantId,groupId);
    try{await validateSovereignJournalEvents(tenantId,groupId,rows);return{ok:true,count:rows.length};}
    catch{for(let i=0,prev='GENESIS';i<rows.length;i++){const row=rows[i]!;if(row.sequence!==i+1||row.previousHash!==prev)return{ok:false,count:rows.length,brokenAt:row.sequence};prev=row.hash;}return{ok:false,count:rows.length,brokenAt:rows.at(-1)?.sequence};}
  }
  async replaceGroupState(tenantId:string,groupId:string,events:SovereignJournalEvent[],relayKeys:RelayKeyRecord[]):Promise<void>{
    const ordered=events.slice().sort((a,b)=>a.sequence-b.sequence);await validateSovereignJournalEvents(tenantId,groupId,ordered);
    for(const key of relayKeys)if(key.tenantId!==tenantId||key.groupId!==groupId||!key.membershipId||!key.keyId||!key.rawKey)throw Error('SOVEREIGN_RELAY_KEY_SCOPE_INVALID');
    const db=await openDb();
    try{
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction([EVENTS,HEADS,KEYS],'readwrite'),eventStore=tx.objectStore(EVENTS),headStore=tx.objectStore(HEADS),keyStore=tx.objectStore(KEYS);
        const er=eventStore.getAll(),kr=keyStore.getAll();let eventRows:any[]|undefined,keyRows:any[]|undefined,applied=false;
        const apply=()=>{
          if(applied||!eventRows||!keyRows)return;applied=true;
          for(const row of eventRows)if(row.tenantId===tenantId&&row.groupId===groupId)eventStore.delete(row.id);
          for(const row of keyRows)if(row.tenantId===tenantId&&row.groupId===groupId)keyStore.delete(row.id);
          for(const row of ordered)eventStore.put(clone(row));
          for(const key of relayKeys)keyStore.put({id:keyId(tenantId,groupId,key.membershipId),...clone(key)});
          const last=ordered.at(-1);
          if(last)headStore.put({id:headId(tenantId,groupId),tenantId,groupId,sequence:last.sequence,hash:last.hash} satisfies JournalHeadRecord);
          else headStore.delete(headId(tenantId,groupId));
        };
        er.onsuccess=()=>{eventRows=er.result;apply();};er.onerror=()=>reject(er.error);
        kr.onsuccess=()=>{keyRows=kr.result;apply();};kr.onerror=()=>reject(kr.error);
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??Error('SOVEREIGN_RESTORE_FAILED'));tx.onabort=()=>reject(tx.error??Error('SOVEREIGN_RESTORE_ABORTED'));
      });
    }finally{db.close();}
  }
  async restoreEvents(tenantId:string,groupId:string,events:SovereignJournalEvent[]):Promise<void>{
    await this.replaceGroupState(tenantId,groupId,events,await this.relayKeys(tenantId,groupId));
  }
  async saveRelayKey(record:RelayKeyRecord):Promise<void>{
    const db=await openDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(KEYS,'readwrite');tx.objectStore(KEYS).put({id:keyId(record.tenantId,record.groupId,record.membershipId),...clone(record)});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{db.close();}
  }
  async relayKey(tenantId:string,groupId:string,membershipId:string):Promise<RelayKeyRecord|undefined>{
    const db=await openDb();try{return await new Promise((resolve,reject)=>{const r=db.transaction(KEYS,'readonly').objectStore(KEYS).get(keyId(tenantId,groupId,membershipId));r.onsuccess=()=>{if(!r.result)return resolve(undefined);const {id,...row}=r.result;resolve(row as RelayKeyRecord);};r.onerror=()=>reject(r.error);});}finally{db.close();}
  }
  async relayKeys(tenantId:string,groupId:string):Promise<RelayKeyRecord[]>{
    const db=await openDb();try{return (await all<any>(db.transaction(KEYS,'readonly').objectStore(KEYS))).filter(x=>x.tenantId===tenantId&&x.groupId===groupId).map(({id,...x})=>x as RelayKeyRecord);}finally{db.close();}
  }
}

async function vaultKey(passphrase:string,salt:Uint8Array,iterations:number,usage:KeyUsage[]){
  if(passphrase.length<8)throw Error('VAULT_PASSPHRASE_TOO_SHORT');
  const base=await crypto.subtle.importKey('raw',te.encode(passphrase),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:buffer(salt),iterations},base,{name:'AES-GCM',length:256},false,usage);
}
export async function createEcoVault(passphrase:string,snapshot:SovereignSnapshot,events:SovereignJournalEvent[],relayKeys:RelayKeyRecord[]=[]):Promise<string>{
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iterations=180000,key=await vaultKey(passphrase,salt,iterations,['encrypt']);
  const payload=stable({snapshot,events,relayKeys}),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:buffer(iv)},key,te.encode(payload)));
  const envelope:EcoVaultEnvelope={protocol:'ECOVAULT1',salt:b64u(salt),iv:b64u(iv),iterations,ciphertext:b64u(cipher),fingerprint:await digest(payload)};
  return 'ECOVAULT1.'+b64u(te.encode(JSON.stringify(envelope)));
}
export async function openEcoVault(passphrase:string,encoded:string):Promise<{snapshot:SovereignSnapshot;events:SovereignJournalEvent[];relayKeys:RelayKeyRecord[]}>{
  if(!encoded.startsWith('ECOVAULT1.'))throw Error('VAULT_FORMAT_INVALID');
  let envelope:EcoVaultEnvelope;try{envelope=JSON.parse(td.decode(unb64u(encoded.slice(10)))) as EcoVaultEnvelope;}catch{throw Error('VAULT_FORMAT_INVALID');}
  if(envelope.protocol!=='ECOVAULT1'||!Number.isSafeInteger(envelope.iterations)||envelope.iterations<100000||envelope.iterations>1000000)throw Error('VAULT_FORMAT_INVALID');
  const salt=unb64u(envelope.salt),iv=unb64u(envelope.iv);if(salt.length!==16||iv.length!==12||envelope.ciphertext.length>50_000_000)throw Error('VAULT_FORMAT_INVALID');
  const key=await vaultKey(passphrase,salt,envelope.iterations,['decrypt']);
  let plain:ArrayBuffer;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:buffer(iv)},key,buffer(unb64u(envelope.ciphertext)));}catch{throw Error('VAULT_DECRYPT_FAILED');}
  const payload=td.decode(plain);if(payload.length>35_000_000)throw Error('VAULT_TOO_LARGE');if(await digest(payload)!==envelope.fingerprint)throw Error('VAULT_INTEGRITY_FAILED');
  let parsed:any;try{parsed=JSON.parse(payload);}catch{throw Error('VAULT_PAYLOAD_INVALID');}
  if(!parsed?.snapshot?.tenantId||!parsed?.snapshot?.groupId||!parsed?.snapshot?.state||!Array.isArray(parsed?.events??[])||!Array.isArray(parsed?.relayKeys??[]))throw Error('VAULT_PAYLOAD_INVALID');
  return{snapshot:parsed.snapshot,events:parsed.events??[],relayKeys:parsed.relayKeys??[]};
}
