export interface SovereignJournalEvent {
  id:string;tenantId:string;groupId:string;actorId:string;sequence:number;type:string;
  payload:Record<string,unknown>;createdAt:string;previousHash:string;hash:string;
}
export interface RelayKeyRecord {tenantId:string;groupId:string;membershipId:string;keyId:string;rawKey:string;createdAt:string;}
export interface SovereignSnapshot {tenantId:string;groupId:string;exportedAt:string;appVersion:string;state:Record<string,unknown>;}
export interface EcoVaultEnvelope {protocol:'ECOVAULT1';salt:string;iv:string;iterations:number;ciphertext:string;fingerprint:string;}

const DB='eco-system-sovereign-v1',VERSION=1,EVENTS='events',KEYS='relay-keys';
const te=new TextEncoder(),td=new TextDecoder();
const clone=<T>(v:T):T=>structuredClone(v);
const openDb=():Promise<IDBDatabase>=>new Promise((resolve,reject)=>{
  if(!('indexedDB' in globalThis))return reject(Error('INDEXEDDB_UNAVAILABLE'));
  const request=indexedDB.open(DB,VERSION);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(EVENTS))db.createObjectStore(EVENTS,{keyPath:'id'});if(!db.objectStoreNames.contains(KEYS))db.createObjectStore(KEYS,{keyPath:'id'});};
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

export class IndexedDbSovereignStore {
  static supported(){return typeof indexedDB!=='undefined';}
  async append(input:{tenantId:string;groupId:string;actorId:string;type:string;payload:Record<string,unknown>;createdAt?:string}):Promise<SovereignJournalEvent>{
    const rows=await this.list(input.tenantId,input.groupId),last=rows.at(-1),sequence=(last?.sequence??0)+1,createdAt=input.createdAt??new Date().toISOString(),previousHash=last?.hash??'GENESIS';
    const base={tenantId:input.tenantId,groupId:input.groupId,actorId:input.actorId,sequence,type:input.type,payload:clone(input.payload),createdAt,previousHash};
    const hash=await digest(stable(base)),event:SovereignJournalEvent={id:JSON.stringify([input.tenantId,input.groupId,sequence,hash.slice(0,16)]),...base,hash};
    const db=await openDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(EVENTS,'readwrite');tx.objectStore(EVENTS).put(event);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{db.close();}
    return clone(event);
  }
  async list(tenantId:string,groupId:string):Promise<SovereignJournalEvent[]>{
    const db=await openDb();try{return (await all<SovereignJournalEvent>(db.transaction(EVENTS,'readonly').objectStore(EVENTS))).filter(x=>x.tenantId===tenantId&&x.groupId===groupId).sort((a,b)=>a.sequence-b.sequence);}finally{db.close();}
  }
  async verify(tenantId:string,groupId:string):Promise<{ok:boolean;count:number;brokenAt?:number}>{
    const rows=await this.list(tenantId,groupId);let prev='GENESIS';
    for(const row of rows){
      if(row.previousHash!==prev)return{ok:false,count:rows.length,brokenAt:row.sequence};
      const {id,hash,...base}=row;if(await digest(stable(base))!==hash)return{ok:false,count:rows.length,brokenAt:row.sequence};prev=hash;
    }
    return{ok:true,count:rows.length};
  }
  async restoreEvents(tenantId:string,groupId:string,events:SovereignJournalEvent[]):Promise<void>{
    const ordered=events.filter(x=>x.tenantId===tenantId&&x.groupId===groupId).slice().sort((a,b)=>a.sequence-b.sequence);let prev='GENESIS',sequence=0;
    for(const row of ordered){
      if(row.sequence!==sequence+1||row.previousHash!==prev)throw Error('SOVEREIGN_JOURNAL_CHAIN_INVALID');
      const {id,hash,...base}=row;if(await digest(stable(base))!==hash)throw Error('SOVEREIGN_JOURNAL_HASH_INVALID');prev=hash;sequence=row.sequence;
    }
    const db=await openDb();try{
      const existing=await all<SovereignJournalEvent>(db.transaction(EVENTS,'readonly').objectStore(EVENTS));
      await new Promise<void>((resolve,reject)=>{const tx=db.transaction(EVENTS,'readwrite'),store=tx.objectStore(EVENTS);for(const row of existing)if(row.tenantId===tenantId&&row.groupId===groupId)store.delete(row.id);for(const row of ordered)store.put(clone(row));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
    }finally{db.close();}
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
  const envelope=JSON.parse(td.decode(unb64u(encoded.slice(10)))) as EcoVaultEnvelope;if(envelope.protocol!=='ECOVAULT1')throw Error('VAULT_FORMAT_INVALID');
  const salt=unb64u(envelope.salt),iv=unb64u(envelope.iv),key=await vaultKey(passphrase,salt,envelope.iterations,['decrypt']);
  let plain:ArrayBuffer;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:buffer(iv)},key,buffer(unb64u(envelope.ciphertext)));}catch{throw Error('VAULT_DECRYPT_FAILED');}
  const payload=td.decode(plain);if(await digest(payload)!==envelope.fingerprint)throw Error('VAULT_INTEGRITY_FAILED');
  const parsed=JSON.parse(payload);return{snapshot:parsed.snapshot,events:parsed.events??[],relayKeys:parsed.relayKeys??[]};
}
