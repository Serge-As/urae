const DB='eco-system-meeting-snapshots-v1';
const STORE='snapshots';
const reqp=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
async function openDb(){
  if(!globalThis.indexedDB)throw Error('INDEXEDDB_REQUIRED');
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'});};
  return reqp(request);
}
export class MeetingSnapshotStore{
  async save(snapshot){
    const db=await openDb(),tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put({...snapshot,updatedAt:new Date().toISOString()});
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();return snapshot.id;
  }
  async list(groupId){
    const db=await openDb(),rows=await reqp(db.transaction(STORE,'readonly').objectStore(STORE).getAll());db.close();
    return rows.filter(x=>x.groupId===groupId).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }
  async remove(id){
    const db=await openDb(),tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
  }
}
