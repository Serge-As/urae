// Pure selection over the authorized inbox; no private cross-group item is exposed.
export function selectHomePriorities(items,groupId,now=Date.now()){
 const open=(items??[]).filter(x=>x.groupId===groupId&&!['COMPLETED','CLOSED','CANCELLED','DONE','RESOLVED'].includes(String(x.status).toUpperCase()));
 const critical=x=>String(x.priority).toUpperCase()==='CRITICAL';
 const rank=x=>critical(x)?0:x.dueAt&&Date.parse(x.dueAt)<=now?1:String(x.priority).toUpperCase()==='HIGH'?2:3;
 open.sort((a,b)=>rank(a)-rank(b)||String(a.dueAt??'z').localeCompare(String(b.dueAt??'z'))||String(a.id).localeCompare(String(b.id)));
 const urgent=open.filter(critical),others=open.filter(x=>!critical(x));
 return {visible:[...urgent,...others.slice(0,Math.max(0,3-urgent.length))],remaining:Math.max(0,others.length-Math.max(0,3-urgent.length)),total:open.length};
}
