import type { Id, OutboxItem } from '../../contracts/src/index.js';
import { makeId } from '../../contracts/src/index.js';

export type SyncHandler = (item: OutboxItem) => Promise<{ ok: boolean; conflict?: boolean }>;

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

  sync(handler: SyncHandler): Promise<OutboxItem[]> {
    if(this.syncing)return this.syncing;
    this.syncing=this.syncPending(handler).finally(()=>{this.syncing=undefined;});
    return this.syncing;
  }

  private async syncPending(handler: SyncHandler): Promise<OutboxItem[]> {
    for (const current of [...this.items.values()].filter(x => x.status === 'PENDING' || x.status === 'FAILED')) {
      const syncing = { ...current, status: 'SYNCING' as const, attempts: current.attempts + 1, updatedAt: new Date().toISOString() };
      this.items.set(current.id, syncing);
      try {
        const result = await handler(structuredClone(syncing));
        const status = result.conflict ? 'CONFLICT' : result.ok ? 'CONFIRMED' : 'FAILED';
        this.items.set(current.id, { ...syncing, status, updatedAt: new Date().toISOString() });
      } catch {
        this.items.set(current.id, { ...syncing, status: 'FAILED', updatedAt: new Date().toISOString() });
      }
    }
    return this.list();
  }
}

const DB_NAME = 'tontine-platform';
const DB_VERSION = 1;
const STORE = 'outbox';

export class IndexedDbOutboxAdapter {
  static supported(): boolean { return typeof indexedDB !== 'undefined'; }

  private async open(): Promise<IDBDatabase> {
    if (!IndexedDbOutboxAdapter.supported()) throw new Error('INDEXEDDB_UNAVAILABLE');
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('INDEXEDDB_OPEN_FAILED'));
    });
  }

  async load(): Promise<OutboxItem[]> {
    if (!IndexedDbOutboxAdapter.supported()) return [];
    const db = await this.open();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        request.onsuccess = () => resolve((request.result ?? []) as OutboxItem[]);
        request.onerror = () => reject(request.error ?? new Error('INDEXEDDB_READ_FAILED'));
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
}
