// Read-only projection. The owners supply already-authorized data; this module
// neither reads the network nor computes financial balances or commands.
const TTL=30*86400000;
const idOk=x=>typeof x==='string'&&x.length>0&&x.length<=240&&/^[\w.:/-]+$/.test(x);
export const cockpitScope=context=>JSON.stringify([context?.actor||'',context?.tenant||'',context?.group||'']);
export function createCockpitPreferences({storage,scope,now=Date.now}={}){
 const key=()=>scope()?.actor?'eco.cockpit.preferences.v1.'+encodeURIComponent(cockpitScope(scope())):null;
 const read=()=>{try{const k=key(),v=k?JSON.parse(storage.getItem(k)||'null'):null,clean=a=>Array.isArray(a)?a.filter(x=>idOk(x?.id)&&Number.isFinite(x.at)&&x.at<=now()&&now()-x.at<TTL).slice(0,80):[];return{enabled:v?.enabled!==false,pinned:clean(v?.pinned),hidden:clean(v?.hidden)};}catch{return{enabled:true,pinned:[],hidden:[]};}};
 const write=v=>{try{const k=key();if(!k)return false;storage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
 return{snapshot:read,setEnabled:enabled=>write({...read(),enabled:Boolean(enabled)}),reset:()=>write({enabled:true,pinned:[],hidden:[]}),toggle(id,kind){if(!idOk(id)||!['pinned','hidden'].includes(kind))return false;const v=read();v[kind]=v[kind].some(x=>x.id===id)?v[kind].filter(x=>x.id!==id):[{id,at:now()},...v[kind]].slice(0,80);return write(v);}};
}
const closed=x=>['DONE','CLOSED','RESOLVED','CANCELLED','CANCELED','ARCHIVED','REJECTED'].includes(String(x||'').toUpperCase());
export function buildCockpitPriorities({groupId='',manager=false,meetings=[],inbox=null,notices=null,opportunities=null,references=[],memberId='',preferences={},now=Date.now()}={}){
 const cards=[];
 const add=c=>cards.push({...c,score:c.score||0});
 for(const item of inbox||[]){
  if(!idOk(item.id)||closed(item.status)||(item.groupId&&item.groupId!==groupId))continue;
  const due=Date.parse(item.dueAt||''),overdue=Number.isFinite(due)&&due<=now,urgent=['URGENT','HIGH','CRITICAL'].includes(String(item.priority).toUpperCase()),blocked=/BLOCK|CONFLICT|REVIEW/.test(String(item.status).toUpperCase());
  add({id:'inbox:'+item.id,lane:'now',kind:'inbox',targetId:item.id,title:String(item.title||'Action'),owner:'inbox',dueAt:Number.isFinite(due)?item.dueAt:null,reason:blocked?'blocked':overdue?'overdue':urgent?'priority':'assigned',score:(blocked?10000:overdue?9000:urgent?8000:4000),groupRequired:Boolean(item.groupId)});
 }
 for(const m of meetings){
  if(!idOk(m.id)||closed(m.status))continue;
  const open=String(m.status).toLowerCase()==='open',due=Date.parse(m.scheduledAt||'');
  if(!open&&(!Number.isFinite(due)||due<now))continue;
  add({id:'meeting:'+m.id,lane:open?'now':'watch',kind:'meeting',targetId:m.id,title:String(m.title||'Séance'),owner:'meetings',reason:open?(manager?'manage-meeting':'open-meeting'):'upcoming',dueAt:Number.isFinite(due)?m.scheduledAt:null,score:open?6000:3000,groupRequired:true});
 }
 for(const n of notices||[]){if(!idOk(n.id)||['CONFIRMED','APPROVED_AFTER_REVIEW','CANCELLED'].includes(String(n.status)))continue;add({id:'notice:'+n.id,lane:'watch',kind:'notice',targetId:n.id,memberId,title:String(n.operationType||'Avis financier'),owner:'notices',reason:'review',score:7000,groupRequired:true});}
 for(const r of references){if(r.kind!=='meeting'||!idOk(r.id))continue;const m=meetings.find(m=>m.id===r.id);if(!m||closed(m.status))continue;add({id:'resume:'+r.id,lane:'resume',kind:'resume',targetId:r.id,view:r.view,title:String(m.title||'Séance'),owner:'journey',reason:'interrupted',at:r.at,score:5000,groupRequired:true});}
 if(preferences.enabled!==false)for(const item of opportunities||[]){if(!idOk(item.id)||!['shop-item','public-group','interest-content-offer','interest-content-request','interest-community','group-hub'].includes(item.kind))continue;add({id:'opportunity:'+item.id,lane:'opportunities',kind:'opportunity',targetId:item.id,title:String(item.title||'Opportunité'),owner:'pulse',reason:'suggested',why:Array.isArray(item.why)?item.why.map(String).slice(0,3):[],score:1000,groupRequired:false});}
 const hidden=new Set(preferences.enabled===false?[]:(preferences.hidden||[]).map(x=>x.id)),pinned=new Set(preferences.enabled===false?[]:(preferences.pinned||[]).map(x=>x.id));
 const eligible=cards.filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i),visible=eligible.filter(c=>!hidden.has(c.id)).map(c=>({...c,pinned:pinned.has(c.id),score:c.score+(pinned.has(c.id)?1500:0)}));
 visible.sort((a,b)=>b.score-a.score||(Date.parse(a.dueAt)||Infinity)-(Date.parse(b.dueAt)||Infinity)||a.id.localeCompare(b.id));
 return{cards:visible,hiddenCount:eligible.length-visible.length,lanes:Object.fromEntries(['now','watch','resume','opportunities'].map(lane=>[lane,visible.filter(c=>c.lane===lane)]))};
}
export async function revalidateCockpitTarget({app,context,card,now=Date.now}={}){
 const same=()=>cockpitScope({actor:app.currentActor(),tenant:app.currentTenant?.(),group:app.activeGroup()})===cockpitScope(context);
 const requireSame=()=>{if(!same())throw Error('COCKPIT_CONTEXT_CHANGED');};
 const fresh=async(path,since)=>{const m=await app.projectionMeta(path);requireSame();if(m?.source!=='SERVER'||!Number.isFinite(Date.parse(m.lastSyncedAt))||Date.parse(m.lastSyncedAt)<since||m.scope?.actorId!==context.actor||m.scope?.tenantId!==context.tenant||m.scope?.groupId!==(context.group||null))throw Error('COCKPIT_VERIFICATION_UNAVAILABLE');};
 requireSame();
 if(card.groupRequired){
  if(!context.group)throw Error('COCKPIT_TARGET_UNAVAILABLE');
  const path='/api/v1/groups/'+encodeURIComponent(context.group),since=now(),access=await app.groupMe({requireServer:true});requireSame();await fresh(path+'/me',since);
  if(!access?.isManager&&(!access?.membership||String(access.membership.status).toLowerCase()!=='active'))throw Error('COCKPIT_TARGET_UNAVAILABLE');
  if(['meeting','resume'].includes(card.kind)){const started=now(),rows=await app.listMeetings({requireServer:true});requireSame();await fresh(path+'/meetings',started);const m=rows.find(x=>x.id===card.targetId);if(!m||closed(m.status))throw Error('COCKPIT_TARGET_UNAVAILABLE');return m;}
  if(card.kind==='notice'){
   if(access?.membership?.id!==card.memberId)throw Error('COCKPIT_TARGET_UNAVAILABLE');
   const started=now(),rows=await app.financialNotices(card.memberId,{requireServer:true});requireSame();await fresh(path+'/members/'+encodeURIComponent(card.memberId)+'/financial-notices',started);
   if(!rows.some(x=>x.id===card.targetId&&!['CONFIRMED','APPROVED_AFTER_REVIEW','CANCELLED'].includes(String(x.status))))throw Error('COCKPIT_TARGET_UNAVAILABLE');
  }
 }
 if(card.kind==='inbox'){const started=now(),rows=await app.inboxItems({requireServer:true});requireSame();await fresh('/api/v1/inbox',started);if(!rows.some(x=>x.id===card.targetId&&!closed(x.status)&&(!x.groupId||x.groupId===context.group)))throw Error('COCKPIT_TARGET_UNAVAILABLE');}
 requireSame();return true;
}
