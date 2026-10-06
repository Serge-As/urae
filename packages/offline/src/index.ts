import type { Id, OutboxItem } from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';

const idbAll=<T>(store:IDBObjectStore):Promise<T[]>=>new Promise((resolve,reject)=>{
  const modern=store as IDBObjectStore & {getAll?:()=>IDBRequest<T[]>};
  if(typeof modern.getAll==='function'){
    const request=modern.getAll();request.onsuccess=()=>resolve(request.result??[]);request.onerror=()=>reject(request.error??new Error('INDEXEDDB_READ_FAILED'));return;
  }
  const rows:T[]=[];const request=store.openCursor();
  request.onsuccess=()=>{const cursor=request.result;if(!cursor){resolve(rows);return;}rows.push(cursor.value as T);cursor.continue();};
  request.onerror=()=>reject(request.error??new Error('INDEXEDDB_READ_FAILED'));
});
const jsonClone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const replaceIdentity=(value:unknown,oldActorId:string,oldTenantId:string,newActorId:string,newTenantId:string):unknown=>{
  if(value===oldActorId)return newActorId;if(value===oldTenantId)return newTenantId;
  if(Array.isArray(value))return value.map(x=>replaceIdentity(x,oldActorId,oldTenantId,newActorId,newTenantId));
  if(value&&typeof value==='object'){const out:Record<string,unknown>={};for(const [k,v] of Object.entries(value as Record<string,unknown>))out[k]=replaceIdentity(v,oldActorId,oldTenantId,newActorId,newTenantId);return out;}
  return value;
};

export type SyncHandler = (item: OutboxItem) => Promise<{ ok: boolean; conflict?: boolean; result?: Record<string,unknown>; error?: string }>;

export class Outbox {
  private items = new Map<Id, OutboxItem>();
  private byKey = new Map<string, Id>();
  private syncing?: Promise<OutboxItem[]>;
  private scopeKey(tenantId:Id,actorId:Id,key:string):string{return JSON.stringify([tenantId,actorId,key]);}

  enqueue<T>(input: { tenantId: Id; actorId: Id; type: string; payload: T; idempotencyKey: string }): OutboxItem<T> {
    const key=this.scopeKey(input.tenantId,input.actorId,input.idempotencyKey);
    const existingId = this.byKey.get(key);
    if (existingId) return structuredClone(this.items.get(existingId) as OutboxItem<T>);
    const now = new Date().toISOString();
    const item: OutboxItem<T> = { id: makeId('outbox'), ...input, status: 'PENDING', createdAt: now, updatedAt: now, attempts: 0 };
    this.items.set(item.id, item as OutboxItem); this.byKey.set(key, item.id);
    return structuredClone(item);
  }

  restore(items: OutboxItem[]): void {
    this.items.clear(); this.byKey.clear();
    for (const item of items) {
      if (!item.id || !item.idempotencyKey || !item.tenantId || !item.actorId) continue;
      const safe: OutboxItem = { ...structuredClone(item), status: item.status === 'SYNCING' ? 'PENDING' : item.status };
      this.items.set(safe.id, safe); this.byKey.set(this.scopeKey(safe.tenantId,safe.actorId,safe.idempotencyKey), safe.id);
    }
  }

  list(): OutboxItem[] { return [...this.items.values()].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(x => structuredClone(x)); }
  /** Mirrors a single IndexedDB transaction already committed with this id. */
  adoptDurable(item:OutboxItem):void{
    const current=this.items.get(item.id);
    if(!current||this.scopeKey(current.tenantId,current.actorId,current.idempotencyKey)!==
      this.scopeKey(item.tenantId,item.actorId,item.idempotencyKey))throw Error('OUTBOX_DURABLE_IDENTITY_MISMATCH');
    this.items.set(item.id,structuredClone(item));
  }

  markConfirmedByKey(tenantId:Id,actorId:Id,idempotencyKey:string):OutboxItem|undefined{
    const id=this.byKey.get(this.scopeKey(tenantId,actorId,idempotencyKey)),current=id?this.items.get(id):undefined;
    if(!id||!current)return undefined;
    const next={...current,status:'CONFIRMED' as const,updatedAt:new Date().toISOString()};this.items.set(id,next);return structuredClone(next);
  }

  markConflictByKey(tenantId:Id,actorId:Id,idempotencyKey:string):OutboxItem|undefined{
    const id=this.byKey.get(this.scopeKey(tenantId,actorId,idempotencyKey)),current=id?this.items.get(id):undefined;
    if(!id||!current)return undefined;
    const next={...current,status:'CONFLICT' as const,updatedAt:new Date().toISOString()};this.items.set(id,next);return structuredClone(next);
  }

  retry(id:Id):OutboxItem|undefined{
    const current=this.items.get(id);if(!current||current.status==='CONFIRMED'||current.status==='CANCELLED'||current.status==='CONFLICT')return current?structuredClone(current):undefined;
    const reset={...current,status:'PENDING' as const,attempts:0,updatedAt:new Date().toISOString()};this.items.set(id,reset);return structuredClone(reset);
  }

  sync(handler: SyncHandler): Promise<OutboxItem[]> {
    if(this.syncing)return this.syncing;
    this.syncing=this.syncPending(handler).finally(()=>{this.syncing=undefined;});
    return this.syncing;
  }

  private async syncPending(handler: SyncHandler): Promise<OutboxItem[]> {
    // IndexedDB getAll() is ordered by primary key, not business creation time.
    // Always replay the canonical chronological view so dependent operations
    // (cash-in before a later cash-out) survive a cold reload deterministically.
    for (const current of this.list().filter(x => (x.status === 'PENDING' || x.status === 'FAILED') && x.attempts < 5)) {
      const syncing = { ...current, status: 'SYNCING' as const, attempts: current.attempts + 1, updatedAt: new Date().toISOString() };
      this.items.set(current.id, syncing);
      try {
        const result = await handler(structuredClone(syncing));
        const status = result.conflict ? 'CONFLICT' : result.ok ? 'CONFIRMED' : 'FAILED';
        this.items.set(current.id, { ...syncing, status, lastResult: result.result, lastError: result.error, updatedAt: new Date().toISOString() });
      } catch (error) {
        this.items.set(current.id, { ...syncing, status: 'FAILED', lastError: error instanceof Error ? error.message : String(error), updatedAt: new Date().toISOString() });
      }
    }
    return this.list();
  }
}

const DB_NAME = 'tontine-platform';
// Additive schema. Never clear the V1 outbox or another identity's records.
const DB_VERSION = 2;
const STORE = 'outbox';
const FINANCE_INTENTS = 'financial_cell_intents';
const FINANCE_PROJECTIONS = 'financial_cell_projections';
const FINANCE_JOURNAL = 'financial_cell_journal';
const DEVICE_SEQUENCE = 'financial_device_sequences';

export class IndexedDbOutboxAdapter {
  static supported(): boolean { return typeof indexedDB !== 'undefined'; }

  private async open(): Promise<IDBDatabase> {
    if (!IndexedDbOutboxAdapter.supported()) throw new Error('INDEXEDDB_UNAVAILABLE');
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
        for(const name of [FINANCE_INTENTS,FINANCE_PROJECTIONS,FINANCE_JOURNAL,DEVICE_SEQUENCE]){
          if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('INDEXEDDB_OPEN_FAILED'));
    });
  }

  /** One IndexedDB transaction records the financial command, queue item,
   * local cell projection, same-device monotonic sequence and immutable journal
   * event. The separate sovereign vault is a secondary mirror, not ACK proof.
   * A failed transaction rejects without telling the UI that finance was saved.
   */
  async recordFinancialCellIntent(item:OutboxItem<Record<string,unknown>>,deviceId:string):Promise<OutboxItem<Record<string,unknown>>>{
    if(!IndexedDbOutboxAdapter.supported())throw Error('DURABLE_STORAGE_REQUIRED');
    const p=item.payload,groupId=String(p.groupId??''),meetingId=String(p.meetingId??''),
      membershipId=String(p.membershipId??''),rubricId=String(p.rubricId??'');
    if(item.type!=='FINANCIAL_CELL_CORRECTION_PROPOSAL_V1'||!groupId||!meetingId||!membershipId||!rubricId||
       !deviceId||!Number.isSafeInteger(Number(p.targetAmount))||Number(p.targetAmount)<0)throw Error('CELL_INTENT_INVALID');
    const db=await this.open();
    try{
      return await new Promise<OutboxItem<Record<string,unknown>>>((resolve,reject)=>{
        const tx=db.transaction([STORE,FINANCE_INTENTS,FINANCE_PROJECTIONS,FINANCE_JOURNAL,DEVICE_SEQUENCE],'readwrite');
        const queue=tx.objectStore(STORE),intents=tx.objectStore(FINANCE_INTENTS),
          projections=tx.objectStore(FINANCE_PROJECTIONS),journal=tx.objectStore(FINANCE_JOURNAL),
          sequences=tx.objectStore(DEVICE_SEQUENCE);
        const seqKey=JSON.stringify([item.tenantId,item.actorId,deviceId]);
        let stored:OutboxItem<Record<string,unknown>>|undefined;
        const read=sequences.get(seqKey);
        read.onsuccess=()=>{
          const last=Number(read.result?.value??0);
          if(!Number.isSafeInteger(last)||last>=Number.MAX_SAFE_INTEGER){tx.abort();return;}
          const sequence=last+1;
          sequences.put({id:seqKey,value:sequence});
          const envelope={...structuredClone(p),deviceId,deviceSequence:sequence,
            commandId:item.idempotencyKey,recordedAtClient:String(p.recordedAtClient??item.createdAt),
            recordedAtSource:'LOCAL_VALIDATION'};
          stored={...structuredClone(item),payload:envelope};
          const cellKey=JSON.stringify([item.tenantId,groupId,String(p.exerciseId??''),meetingId,membershipId,rubricId,String(p.activityId??''),'XAF']);
          queue.put(stored);intents.put({id:item.idempotencyKey,tenantId:item.tenantId,actorId:item.actorId,groupId,cellKey,payload:envelope,status:'RECORDED_LOCAL'});
          projections.put({id:JSON.stringify([item.actorId,cellKey]),tenantId:item.tenantId,actorId:item.actorId,groupId,cellKey,
            amount:Number(p.targetAmount),commandId:item.idempotencyKey,pending:true,recordedAtClient:envelope.recordedAtClient});
          journal.put({id:item.id,tenantId:item.tenantId,actorId:item.actorId,groupId,cellKey,
            type:'FINANCIAL_CELL_INTENT_RECORDED',commandId:item.idempotencyKey,payload:envelope,at:envelope.recordedAtClient});
        };
        tx.oncomplete=()=>stored?resolve(stored):reject(Error('CELL_INTENT_NOT_COMMITTED'));
        tx.onerror=()=>reject(tx.error??Error('CELL_INTENT_STORAGE_FAILED'));
        tx.onabort=()=>reject(tx.error??Error('CELL_INTENT_STORAGE_ABORTED'));
      });
    }finally{db.close();}
  }

  async load(): Promise<OutboxItem[]> {
    if (!IndexedDbOutboxAdapter.supported()) return [];
    const db = await this.open();
    try {
      return await new Promise((resolve, reject) => {
        const store=db.transaction(STORE, 'readonly').objectStore(STORE);
        idbAll<OutboxItem>(store).then(resolve,reject);
      });
    } finally { db.close(); }
  }

  async save(items: OutboxItem[]): Promise<void> {
    if (!IndexedDbOutboxAdapter.supported()) return;
    const db = await this.open();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        // Do not erase another identity's queue on a shared phone.
        for (const item of items) {
          const read=store.get(item.id);
          read.onsuccess=()=>{
            const existing=read.result as OutboxItem|undefined;
            if(existing && (existing.tenantId!==item.tenantId || existing.actorId!==item.actorId))return;
            if(existing && (existing.updatedAt>item.updatedAt || existing.status==='CONFIRMED' && item.status!=='CONFIRMED'))return;
            store.put(structuredClone(item));
          };
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('INDEXEDDB_WRITE_FAILED'));
        tx.onabort = () => reject(tx.error ?? new Error('INDEXEDDB_WRITE_ABORTED'));
      });
    } finally { db.close(); }
  }
  async replaceForIdentity(actorId:string,tenantId:string,items:OutboxItem[]):Promise<void>{
    if(!IndexedDbOutboxAdapter.supported())return;
    for(const item of items)if(item.actorId!==actorId||item.tenantId!==tenantId)throw Error('OUTBOX_IDENTITY_SCOPE_INVALID');
    const db=await this.open();try{
      const existing=await idbAll<OutboxItem>(db.transaction(STORE,'readonly').objectStore(STORE));
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),keep=new Set(items.map(x=>x.id));
        for(const row of existing)if(row.actorId===actorId&&row.tenantId===tenantId&&!keep.has(row.id))store.delete(row.id);
        for(const item of items)store.put(structuredClone(item));
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??Error('INDEXEDDB_REPLACE_FAILED'));tx.onabort=()=>reject(tx.error??Error('INDEXEDDB_REPLACE_ABORTED'));
      });
    }finally{db.close();}
  }
  async migrateIdentity(oldActorId:string,oldTenantId:string,newActorId:string,newTenantId:string):Promise<OutboxItem[]>{
    if(!IndexedDbOutboxAdapter.supported())return[];
    const db=await this.open();
    try{
      const rows=await idbAll<OutboxItem>(db.transaction(STORE,'readonly').objectStore(STORE));
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
        for(const row of rows){
          if(row.actorId!==oldActorId||row.tenantId!==oldTenantId)continue;
          store.put({...row,actorId:newActorId,tenantId:newTenantId,payload:replaceIdentity(row.payload,oldActorId,oldTenantId,newActorId,newTenantId),updatedAt:new Date().toISOString()});
        }
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_MIGRATE_FAILED'));tx.onabort=()=>reject(tx.error??new Error('INDEXEDDB_MIGRATE_ABORTED'));
      });
      return (await idbAll<OutboxItem>(db.transaction(STORE,'readonly').objectStore(STORE))).filter(x=>x.actorId===newActorId&&x.tenantId===newTenantId);
    }finally{db.close();}
  }

}


export interface ReadSnapshot<T=unknown>{
  id:string;
  actorId:string;
  tenantId:string;
  path:string;
  body:T;
  updatedAt:string;
  source?:'SERVER'|'LOCAL'|'RELAY'|'RESTORED';
  lastSyncedAt?:string;
  sourceVersion?:string|number;
}

const READ_DB_NAME='eco-system-read-snapshots';
const READ_DB_VERSION=1;
const READ_STORE='snapshots';

export class IndexedDbReadSnapshotAdapter {
  static supported():boolean{return typeof indexedDB!=='undefined';}

  private async open():Promise<IDBDatabase>{
    if(!IndexedDbReadSnapshotAdapter.supported())throw new Error('INDEXEDDB_UNAVAILABLE');
    return await new Promise((resolve,reject)=>{
      const request=indexedDB.open(READ_DB_NAME,READ_DB_VERSION);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(READ_STORE))db.createObjectStore(READ_STORE,{keyPath:'id'});};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error??new Error('INDEXEDDB_OPEN_FAILED'));
    });
  }

  async get<T=unknown>(id:string):Promise<ReadSnapshot<T>|undefined>{
    if(!IndexedDbReadSnapshotAdapter.supported())return undefined;
    const db=await this.open();
    try{
      return await new Promise((resolve,reject)=>{
        const request=db.transaction(READ_STORE,'readonly').objectStore(READ_STORE).get(id);
        request.onsuccess=()=>resolve(request.result as ReadSnapshot<T>|undefined);
        request.onerror=()=>reject(request.error??new Error('INDEXEDDB_READ_FAILED'));
      });
    }finally{db.close();}
  }

  async save<T=unknown>(snapshot:Omit<ReadSnapshot<T>,'updatedAt'>):Promise<ReadSnapshot<T>>{
    if(!IndexedDbReadSnapshotAdapter.supported())return{...snapshot,updatedAt:new Date().toISOString()};
    const value:ReadSnapshot<T>={...structuredClone(snapshot),updatedAt:new Date().toISOString()};
    const db=await this.open();
    try{
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction(READ_STORE,'readwrite');tx.objectStore(READ_STORE).put(value);
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_FAILED'));tx.onabort=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_ABORTED'));
      });
      return value;
    }finally{db.close();}
  }

  async remove(id:string):Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported())return;
    const db=await this.open();
    try{
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction(READ_STORE,'readwrite');tx.objectStore(READ_STORE).delete(id);
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_DELETE_FAILED'));
      });
    }finally{db.close();}
  }

  async listForActorTenant(actorId:string,tenantId:string):Promise<ReadSnapshot[]>{
    if(!IndexedDbReadSnapshotAdapter.supported())return[];
    const db=await this.open();try{return (await idbAll<ReadSnapshot>(db.transaction(READ_STORE,'readonly').objectStore(READ_STORE))).filter(x=>x.actorId===actorId&&x.tenantId===tenantId).map(x=>structuredClone(x));}finally{db.close();}
  }
  async applyAtomic(input:{save:Array<{id:string;actorId:string;tenantId:string;path:string;body:unknown;source?:ReadSnapshot['source'];lastSyncedAt?:string;sourceVersion?:string|number}>;removeIds?:string[]}):Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported())return;
    const seen=new Set<string>();for(const row of input.save){if(!row.id||seen.has(row.id))throw Error('SNAPSHOT_BATCH_INVALID');seen.add(row.id);}
    const db=await this.open();try{
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction(READ_STORE,'readwrite'),store=tx.objectStore(READ_STORE),updatedAt=new Date().toISOString();
        for(const id of input.removeIds??[])if(!seen.has(id))store.delete(id);
        for(const row of input.save)store.put({...structuredClone(row),updatedAt});
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??Error('INDEXEDDB_BATCH_WRITE_FAILED'));tx.onabort=()=>reject(tx.error??Error('INDEXEDDB_BATCH_WRITE_ABORTED'));
      });
    }finally{db.close();}
  }

  async clearForActor(actorId:string):Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported())return;
    const db=await this.open();
    try{
      const rows=await new Promise<ReadSnapshot[]>((resolve,reject)=>{
        const store=db.transaction(READ_STORE,'readonly').objectStore(READ_STORE);idbAll<ReadSnapshot>(store).then(resolve,reject);
      });
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction(READ_STORE,'readwrite'),store=tx.objectStore(READ_STORE);
        for(const row of rows)if(row.actorId===actorId)store.delete(row.id);
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_DELETE_FAILED'));
      });
    }finally{db.close();}
  }
  async migrateIdentity(oldActorId:string,oldTenantId:string,newActorId:string,newTenantId:string):Promise<void>{
    if(!IndexedDbReadSnapshotAdapter.supported())return;
    const db=await this.open();
    try{
      const rows=await idbAll<ReadSnapshot>(db.transaction(READ_STORE,'readonly').objectStore(READ_STORE));
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction(READ_STORE,'readwrite'),store=tx.objectStore(READ_STORE);
        for(const row of rows){
          if(row.actorId!==oldActorId||row.tenantId!==oldTenantId)continue;
          let id=row.id;
          if(id!=='session:last'){
            try{const parts=JSON.parse(id);if(Array.isArray(parts)&&parts.length>=4){parts[0]=newActorId;parts[1]=newTenantId;id=JSON.stringify(parts);}}catch{}
          }
          const migrated:ReadSnapshot={...row,id,actorId:newActorId,tenantId:newTenantId,body:replaceIdentity(row.body,oldActorId,oldTenantId,newActorId,newTenantId),updatedAt:new Date().toISOString()};
          store.put(migrated);if(id!==row.id)store.delete(row.id);
        }
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_MIGRATE_FAILED'));tx.onabort=()=>reject(tx.error??new Error('INDEXEDDB_MIGRATE_ABORTED'));
      });
    }finally{db.close();}
  }

}


export type LocalRegistrationState='LOCAL_PENDING_REGISTRATION'|'SERVER_CLAIMED';
export interface LocalAccountRecord{
  id:string;tenantId:string;username:string;displayName:string;locale:string;createdAt:string;
  registrationState:LocalRegistrationState;salt:string;passwordVerifier:string;iterations:number;
  serverActorId?:string;serverTenantId?:string;claimedAt?:string;
}
const LOCAL_AUTH_DB='eco-system-local-auth-v1',LOCAL_AUTH_VERSION=1,LOCAL_ACCOUNT_STORE='accounts',LOCAL_META_STORE='meta';
const base64Bytes=(bytes:Uint8Array):string=>{let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);};
const bytesBase64=(value:string):Uint8Array=>{const binary=atob(value),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;};
const randomHex=(length=16):string=>{if(typeof crypto==='undefined'||typeof crypto.getRandomValues!=='function')throw Error('WEB_CRYPTO_REQUIRED');const bytes=crypto.getRandomValues(new Uint8Array(length));return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');};
const bufferOf=(bytes:Uint8Array):ArrayBuffer=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
export const deriveLocalPasswordVerifier=async(password:string,salt:string,iterations=120000):Promise<string>=>{
  if(typeof crypto==='undefined'||!crypto.subtle)throw Error('WEB_CRYPTO_REQUIRED');
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:bufferOf(bytesBase64(salt)),iterations,hash:'SHA-256'},material,256);
  return base64Bytes(new Uint8Array(bits));
};
const constantTimeTextEqual=(left:string,right:string):boolean=>{const a=bytesBase64(left),b=bytesBase64(right);let diff=a.length^b.length,max=Math.max(a.length,b.length);for(let i=0;i<max;i++)diff|=(a[i]??0)^(b[i]??0);return diff===0;};
const normalizeLocalUsername=(value:string):string=>value.trim().toLowerCase();

export class IndexedDbLocalAuthAdapter{
  static supported():boolean{return typeof indexedDB!=='undefined'&&typeof crypto!=='undefined'&&Boolean(crypto.subtle)&&typeof crypto.getRandomValues==='function';}
  private async open():Promise<IDBDatabase>{
    if(!IndexedDbLocalAuthAdapter.supported())throw Error('LOCAL_AUTH_UNAVAILABLE');
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(LOCAL_AUTH_DB,LOCAL_AUTH_VERSION);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(LOCAL_ACCOUNT_STORE))db.createObjectStore(LOCAL_ACCOUNT_STORE,{keyPath:'id'});if(!db.objectStoreNames.contains(LOCAL_META_STORE))db.createObjectStore(LOCAL_META_STORE,{keyPath:'key'});};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error??new Error('INDEXEDDB_OPEN_FAILED'));
    });
  }
  private async currentId(db:IDBDatabase):Promise<string|undefined>{
    return new Promise((resolve,reject)=>{const request=db.transaction(LOCAL_META_STORE,'readonly').objectStore(LOCAL_META_STORE).get('current');request.onsuccess=()=>resolve(request.result?.value as string|undefined);request.onerror=()=>reject(request.error??new Error('INDEXEDDB_READ_FAILED'));});
  }
  async current():Promise<LocalAccountRecord|undefined>{
    if(!IndexedDbLocalAuthAdapter.supported())return undefined;const db=await this.open();
    try{const id=await this.currentId(db);if(!id)return undefined;return await new Promise((resolve,reject)=>{const request=db.transaction(LOCAL_ACCOUNT_STORE,'readonly').objectStore(LOCAL_ACCOUNT_STORE).get(id);request.onsuccess=()=>resolve(request.result as LocalAccountRecord|undefined);request.onerror=()=>reject(request.error??new Error('INDEXEDDB_READ_FAILED'));});}finally{db.close();}
  }
  async register(input:{username:string;password:string;displayName:string;locale:string}):Promise<LocalAccountRecord>{
    const username=normalizeLocalUsername(input.username),displayName=input.displayName.trim(),password=input.password;
    if(!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username)||password.length<12||password.length>128)throw Error('INVALID_CREDENTIAL_FORMAT');
    if(!displayName||displayName.length>80)throw Error('INVALID_DISPLAY_NAME');
    const db=await this.open();
    try{
      const accounts=await idbAll<LocalAccountRecord>(db.transaction(LOCAL_ACCOUNT_STORE,'readonly').objectStore(LOCAL_ACCOUNT_STORE));
      if(accounts.some(x=>x.username===username))throw Error('ACCOUNT_UNAVAILABLE');
      const saltBytes=crypto.getRandomValues(new Uint8Array(16)),salt=base64Bytes(saltBytes),iterations=120000;
      const account:LocalAccountRecord={id:'local_user_'+randomHex(16),tenantId:'local_tenant_'+randomHex(16),username,displayName,locale:input.locale==='en'?'en':'fr',createdAt:new Date().toISOString(),registrationState:'LOCAL_PENDING_REGISTRATION',salt,passwordVerifier:await deriveLocalPasswordVerifier(password,salt,iterations),iterations};
      await new Promise<void>((resolve,reject)=>{const tx=db.transaction([LOCAL_ACCOUNT_STORE,LOCAL_META_STORE],'readwrite');tx.objectStore(LOCAL_ACCOUNT_STORE).put(account);tx.objectStore(LOCAL_META_STORE).put({key:'current',value:account.id});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_FAILED'));});
      return jsonClone(account);
    }finally{db.close();}
  }
  async login(usernameValue:string,password:string):Promise<LocalAccountRecord>{
    const username=normalizeLocalUsername(usernameValue),db=await this.open();
    try{
      const accounts=await idbAll<LocalAccountRecord>(db.transaction(LOCAL_ACCOUNT_STORE,'readonly').objectStore(LOCAL_ACCOUNT_STORE)),account=accounts.find(x=>x.username===username);
      const salt=account?.salt??base64Bytes(new Uint8Array(16)),iterations=account?.iterations??120000,actual=await deriveLocalPasswordVerifier(password,salt,iterations);
      if(!account||!constantTimeTextEqual(actual,account.passwordVerifier))throw Error('INVALID_CREDENTIALS');
      await new Promise<void>((resolve,reject)=>{const tx=db.transaction(LOCAL_META_STORE,'readwrite');tx.objectStore(LOCAL_META_STORE).put({key:'current',value:account.id});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_FAILED'));});
      return jsonClone(account);
    }finally{db.close();}
  }
  async rememberServerAccount(input:{username:string;password:string;displayName:string;locale:string;serverActorId:string;serverTenantId:string}):Promise<LocalAccountRecord>{
    const username=normalizeLocalUsername(input.username),password=input.password,displayName=input.displayName.trim();
    if(!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username)||password.length<12||password.length>128)throw Error('INVALID_CREDENTIAL_FORMAT');
    if(!displayName||displayName.length>80)throw Error('INVALID_DISPLAY_NAME');
    const db=await this.open();
    try{
      const accounts=await idbAll<LocalAccountRecord>(db.transaction(LOCAL_ACCOUNT_STORE,'readonly').objectStore(LOCAL_ACCOUNT_STORE));
      const existing=accounts.find(x=>x.username===username&&x.registrationState==='SERVER_CLAIMED');
      const salt=existing?.salt??base64Bytes(crypto.getRandomValues(new Uint8Array(16))),iterations=existing?.iterations??120000;
      const account:LocalAccountRecord={
        id:existing?.id??('local_mirror_'+randomHex(16)),
        tenantId:existing?.tenantId??input.serverTenantId,
        username,displayName,locale:input.locale==='en'?'en':'fr',
        createdAt:existing?.createdAt??new Date().toISOString(),
        registrationState:'SERVER_CLAIMED',
        salt,passwordVerifier:await deriveLocalPasswordVerifier(password,salt,iterations),iterations,
        serverActorId:input.serverActorId,serverTenantId:input.serverTenantId,claimedAt:new Date().toISOString()
      };
      await new Promise<void>((resolve,reject)=>{const tx=db.transaction([LOCAL_ACCOUNT_STORE,LOCAL_META_STORE],'readwrite');tx.objectStore(LOCAL_ACCOUNT_STORE).put(account);tx.objectStore(LOCAL_META_STORE).put({key:'current',value:account.id});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_FAILED'));});
      return jsonClone(account);
    }finally{db.close();}
  }
  async logout():Promise<void>{
    if(!IndexedDbLocalAuthAdapter.supported())return;const db=await this.open();
    try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(LOCAL_META_STORE,'readwrite');tx.objectStore(LOCAL_META_STORE).delete('current');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_DELETE_FAILED'));});}finally{db.close();}
  }
  async markClaimed(localId:string,server:{id:string;tenantId:string}):Promise<LocalAccountRecord>{
    const db=await this.open();try{
      const current=await new Promise<LocalAccountRecord|undefined>((resolve,reject)=>{const request=db.transaction(LOCAL_ACCOUNT_STORE,'readonly').objectStore(LOCAL_ACCOUNT_STORE).get(localId);request.onsuccess=()=>resolve(request.result as LocalAccountRecord|undefined);request.onerror=()=>reject(request.error??new Error('INDEXEDDB_READ_FAILED'));});
      if(!current)throw Error('LOCAL_ACCOUNT_NOT_FOUND');
      const updated:LocalAccountRecord={...current,registrationState:'SERVER_CLAIMED',serverActorId:server.id,serverTenantId:server.tenantId,claimedAt:new Date().toISOString()};
      await new Promise<void>((resolve,reject)=>{const tx=db.transaction([LOCAL_ACCOUNT_STORE,LOCAL_META_STORE],'readwrite');tx.objectStore(LOCAL_ACCOUNT_STORE).put(updated);tx.objectStore(LOCAL_META_STORE).put({key:'current',value:localId});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_FAILED'));});return jsonClone(updated);
    }finally{db.close();}
  }
}


export type IdentityMigrationStep='SERVER_IDENTITY_VERIFIED'|'SNAPSHOTS_MIGRATED'|'OUTBOX_MIGRATED'|'LOCAL_ACCOUNT_BOUND'|'SESSION_ADOPTED'|'COMPLETED';
export interface IdentityMigrationJournalRecord{
  id:string;oldActorId:string;oldTenantId:string;newActorId:string;newTenantId:string;
  steps:IdentityMigrationStep[];startedAt:string;updatedAt:string;completedAt?:string;lastError?:string;
}
const MIGRATION_DB='eco-system-identity-migration-v1',MIGRATION_DB_VERSION=1,MIGRATION_STORE='journal';

export class IndexedDbIdentityMigrationJournal{
  static supported():boolean{return typeof indexedDB!=='undefined';}
  private async open():Promise<IDBDatabase>{
    if(!IndexedDbIdentityMigrationJournal.supported())throw Error('INDEXEDDB_UNAVAILABLE');
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(MIGRATION_DB,MIGRATION_DB_VERSION);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(MIGRATION_STORE))db.createObjectStore(MIGRATION_STORE,{keyPath:'id'});};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error??new Error('INDEXEDDB_OPEN_FAILED'));
    });
  }
  private id(oldActorId:string,oldTenantId:string){return JSON.stringify([oldActorId,oldTenantId]);}
  async get(oldActorId:string,oldTenantId:string):Promise<IdentityMigrationJournalRecord|undefined>{
    if(!IndexedDbIdentityMigrationJournal.supported())return undefined;const db=await this.open();
    try{return await new Promise((resolve,reject)=>{const r=db.transaction(MIGRATION_STORE,'readonly').objectStore(MIGRATION_STORE).get(this.id(oldActorId,oldTenantId));r.onsuccess=()=>resolve(r.result as IdentityMigrationJournalRecord|undefined);r.onerror=()=>reject(r.error??new Error('INDEXEDDB_READ_FAILED'));});}
    finally{db.close();}
  }
  async begin(input:{oldActorId:string;oldTenantId:string;newActorId:string;newTenantId:string}):Promise<IdentityMigrationJournalRecord>{
    const existing=await this.get(input.oldActorId,input.oldTenantId);
    if(existing){
      if(existing.newActorId!==input.newActorId||existing.newTenantId!==input.newTenantId)throw Error('IDENTITY_MIGRATION_TARGET_CONFLICT');
      return structuredClone(existing);
    }
    const at=new Date().toISOString(),record:IdentityMigrationJournalRecord={id:this.id(input.oldActorId,input.oldTenantId),...input,steps:['SERVER_IDENTITY_VERIFIED'],startedAt:at,updatedAt:at};
    const db=await this.open();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(MIGRATION_STORE,'readwrite');tx.objectStore(MIGRATION_STORE).put(record);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_FAILED'));tx.onabort=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_ABORTED'));});return structuredClone(record);}finally{db.close();}
  }
  async mark(oldActorId:string,oldTenantId:string,step:IdentityMigrationStep,lastError?:string):Promise<IdentityMigrationJournalRecord>{
    const current=await this.get(oldActorId,oldTenantId);if(!current)throw Error('IDENTITY_MIGRATION_JOURNAL_NOT_FOUND');
    const at=new Date().toISOString(),steps=current.steps.includes(step)?current.steps:[...current.steps,step],next:IdentityMigrationJournalRecord={...current,steps,updatedAt:at,lastError:lastError?.slice(0,500),completedAt:step==='COMPLETED'?at:current.completedAt};
    const db=await this.open();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(MIGRATION_STORE,'readwrite');tx.objectStore(MIGRATION_STORE).put(next);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_FAILED'));tx.onabort=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_ABORTED'));});return structuredClone(next);}finally{db.close();}
  }
  async fail(oldActorId:string,oldTenantId:string,error:unknown):Promise<void>{
    const current=await this.get(oldActorId,oldTenantId);if(!current)return;
    const message=error instanceof Error?error.message:String(error);const db=await this.open(),next={...current,lastError:message.slice(0,500),updatedAt:new Date().toISOString()};
    try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(MIGRATION_STORE,'readwrite');tx.objectStore(MIGRATION_STORE).put(next);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('INDEXEDDB_WRITE_FAILED'));});}finally{db.close();}
  }
}
